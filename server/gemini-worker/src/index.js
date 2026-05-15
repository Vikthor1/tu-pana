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
const ALLOWED_ORIGINS = new Set([
    'http://localhost:8000',
    'http://localhost:3001',
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
        // Do not forward raw Gemini error bodies — they may contain key details.
        throw new Error(`Gemini API error: ${resp.status}`);
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
            // Log only error type — never log prompt, key, or response content
            console.error('Gemini proxy error:', err.name || 'Unknown error');
            return Response.json(
                { error: 'Gemini request failed' },
                { status: 502, headers: corsHeaders(origin) }
            );
        }
    },
};
