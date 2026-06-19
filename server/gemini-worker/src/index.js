/**
 * Tu Pana Gemini Proxy — Cloudflare Worker
 *
 * Receives a Tu Pana coach payload from the frontend,
 * calls the Gemini API server-side using the GEMINI_API_KEY secret,
 * and returns a stable { text } or { error } response.
 *
 * The API key never leaves this Worker. It is never logged.
 * Student writing is never logged.
 */

const MAX_PROMPT_CHARS = 32000;  // accommodates full Tu Pana system prompt (~14-16k) + context + student message

const ALLOWED_MODELS = new Set([
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
]);

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

// Origins allowed to call this proxy.
// Tighten this list before production — do not use '*'.
// NOTE: the two localhost entries are DEV-ONLY (local testing against this Worker).
// For a production-only deployment they can be removed, leaving the GitHub Pages origin.
const ALLOWED_ORIGINS = new Set([
    'http://localhost:8000',   // dev only
    'http://localhost:3001',   // dev only
    'https://vikthor1.github.io',
]);

// ── CORS helpers ──────────────────────────────────────────

function corsHeaders(origin) {
    const allowed = ALLOWED_ORIGINS.has(origin) ? origin : null;
    if (!allowed) return {};
    return {
        'Access-Control-Allow-Origin':  allowed,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary':                         'Origin',  // correct caching when ACAO varies by origin
    };
}

function handleOptions(request) {
    const origin = request.headers.get('Origin') || '';
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

// ── Gemini API call ───────────────────────────────────────

async function callGemini({ model, systemPrompt, userMessage, apiKey }) {
    const endpoint =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const body = {
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        // Flash gets 600 tokens: Stage 7 revision needs detailed coaching;
        // Stage 10 capstone JSON (8 dimensions × 3 fields) is tight at 400.
        generationConfig: { maxOutputTokens: model === 'gemini-2.5-flash' ? 600 : 400 },
    };

    const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type':    'application/json',
            'x-goog-api-key':  apiKey,   // key stays server-side only
        },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        // Extract only the Gemini status enum (e.g. RESOURCE_EXHAUSTED) — never forward the
        // message field, which may echo prompt content. Validate format before using.
        let upstreamStatus = null;
        try {
            const errBody = await resp.json();
            const s = errBody?.error?.status;
            if (typeof s === 'string' && /^[A-Z_]+$/.test(s)) upstreamStatus = s;
        } catch(_) {}
        const err = new Error(`Gemini upstream ${resp.status}`);
        err.status    = resp.status;
        err.upstreamStatus = upstreamStatus;
        throw err;
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return text;
}

// ── Main handler ──────────────────────────────────────────

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';

        // Preflight
        if (request.method === 'OPTIONS') return handleOptions(request);

        // Method guard
        if (request.method !== 'POST') {
            return Response.json(
                { error: 'Method not allowed' },
                { status: 405, headers: corsHeaders(origin) }
            );
        }

        // F1 — Origin admission gate (TP-SR-02). Reject any request whose Origin is
        // not allowlisted BEFORE spending Gemini quota. Previously a disallowed
        // origin still reached Gemini (only the response lost its CORS headers), so
        // casual cross-origin / naive-script calls could still burn quota and cost.
        // LIMITATION: a determined non-browser client can forge the Origin header, so
        // this stops casual/browser abuse only — meaningful abuse protection still
        // requires the Cloudflare edge Rate Limiting rule documented in
        // docs/security/tp-sr-02-live-verification-checklist.md.
        if (!ALLOWED_ORIGINS.has(origin)) {
            return Response.json({ error: 'Origin not allowed' }, { status: 403 });
        }

        // Secret guard — checked early so the error is clear during setup
        if (!env.GEMINI_API_KEY) {
            return Response.json(
                { error: 'Gemini not configured' },
                { status: 503, headers: corsHeaders(origin) }
            );
        }

        // Parse body
        let payload;
        try {
            payload = await request.json();
        } catch {
            return Response.json(
                { error: 'Invalid JSON' },
                { status: 400, headers: corsHeaders(origin) }
            );
        }

        // Validate prompt
        const { prompt, model: reqModel } = payload;
        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
            return Response.json(
                { error: 'prompt is required' },
                { status: 400, headers: corsHeaders(origin) }
            );
        }
        if (prompt.length > MAX_PROMPT_CHARS) {
            return Response.json(
                { error: 'Prompt too large' },
                { status: 400, headers: corsHeaders(origin) }
            );
        }

        // Model selection — allowlist only
        const model = (reqModel && ALLOWED_MODELS.has(reqModel)) ? reqModel : DEFAULT_MODEL;

        // Call Gemini
        try {
            const text = await callGemini({
                model,
                systemPrompt: null,   // system prompt assembly happens in the frontend pipeline
                userMessage:  prompt,
                apiKey:       env.GEMINI_API_KEY,
            });
            return Response.json({ text }, { headers: corsHeaders(origin) });
        } catch (err) {
            // Log only error type and upstream status — never log prompt, key, or student content
            console.error('Gemini proxy error:', err.name, err.status || '', err.upstreamStatus || '');
            const upStatus = err.status;
            let category, outStatus, message;
            if (upStatus === 429) {
                category = 'rate_limited';        outStatus = 429;
                message  = 'Too many requests. Wait briefly and try again.';
            } else if (upStatus === 400) {
                category = 'bad_request';         outStatus = 400;
                message  = 'Request could not be processed.';
            } else if (upStatus === 401 || upStatus === 403) {
                category = 'auth_error';          outStatus = 503;
                message  = 'Coach configuration error.';
            } else if (upStatus === 503 || upStatus === 504) {
                category = 'service_unavailable'; outStatus = 503;
                message  = 'Gemini is temporarily unavailable.';
            } else if (upStatus >= 500) {
                category = 'upstream_error';      outStatus = 502;
                message  = 'Upstream error from Gemini.';
            } else if (upStatus) {
                category = 'upstream_error';      outStatus = 502;
                message  = `Upstream error: ${upStatus}`;
            } else {
                category = 'network_error';       outStatus = 502;
                message  = 'Network error reaching Gemini.';
            }
            return Response.json(
                { error: true, category, status: outStatus, message,
                  upstreamStatus: err.upstreamStatus || null },
                { status: outStatus, headers: corsHeaders(origin) }
            );
        }
    },
};
