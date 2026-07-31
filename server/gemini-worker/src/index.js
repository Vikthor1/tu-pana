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

// Gemini 2.5 Flash supports a 1,048,576-token input context. Keep a generous
// application-side ceiling for abuse protection without rejecting legitimate
// genre instructions plus a full student draft. 128k characters is still only
// a small fraction of the model context window.
const MAX_PROMPT_CHARS = 128000;

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
    'http://localhost:8000',    // dev only
    'http://localhost:3001',    // dev only
    // Family-preview deployment of the redesign branch (Cloudflare Pages,
    // founder-authorized 2026-07-31). Bounded personal use; NOT the release —
    // Sprint 0 B3–B7 still gate the real launch. Retire with the preview.
    'https://tupana-preview.pages.dev',
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

// Stage 7 is the revision stage (frontend sends stageId 7 / 'stage.revision').
function isStage7(stageId) {
    return stageId === 7 || stageId === 'stage.revision';
}

// Stage 10 is the capstone reflection (frontend sends stageId 10 / 'stage.reflection').
function isStage10(stageId) {
    return stageId === 10 || stageId === 'stage.reflection';
}

// Per-request generation config.
//
// Stages 7 and 10 plus shared passage/full-draft analysis run on
// gemini-2.5-flash, a *thinking* model, where maxOutputTokens caps thinking +
// visible tokens COMBINED.
// Default thinking consumed almost the entire
// 600-token budget (~573 thought vs 23 visible → finishReason MAX_TOKENS), starving
// the visible output. Disabling thinking (thinkingBudget:0) frees the whole budget for
// the reply. Each ceiling is a VALIDATED SAFETY CEILING sized from a faithful probe of
// that stage's real prompt, not a verbosity target; billing is on tokens generated, so
// a ceiling above the real output adds no normal-case cost and only bounds a runaway:
//   - Passage analysis: whole-passage reading across every genre → 1536.
//   - Full-draft review: whole-draft map + two strengths + three priorities → 3072.
//   - Stage 7 (revision, prose coaching): self-terminated (STOP) at ~269 tokens → 1536.
//   - Stage 10 (capstone: valid JSON, 8 rubric dimensions x rating/observation/
//     suggestion + limitations): self-terminated (STOP) at ~643 tokens → 2048. Thinking
//     MUST be off here too — with thinking on, 2048 was consumed by ~1964 thought tokens
//     and the JSON came back truncated/invalid (0/8 dimensions).
//
// Every other stage/model is intentionally UNCHANGED (Flash 600, Flash-Lite
// 400, default thinking).
function buildGenerationConfig(model, stageId, requestKind) {
    if (model === 'gemini-2.5-flash' && requestKind === 'full_draft_review') {
        return { maxOutputTokens: 3072, thinkingConfig: { thinkingBudget: 0 } };
    }
    if (model === 'gemini-2.5-flash' && requestKind === 'capstone_review') {
        return { maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } };
    }
    // Review Council (C1): one specialist reviewer returns ≤5 JSON findings
    // (1536); the synthesizer merges all validated findings into one capped
    // report (2048). Both are strict-JSON outputs, so thinking must be off —
    // same starvation failure mode as Stage 10.
    if (model === 'gemini-2.5-flash' && requestKind === 'council_reviewer') {
        return { maxOutputTokens: 1536, thinkingConfig: { thinkingBudget: 0 } };
    }
    if (model === 'gemini-2.5-flash' && requestKind === 'council_synthesis') {
        return { maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } };
    }
    if (model === 'gemini-2.5-flash' && requestKind === 'passage_analysis') {
        return { maxOutputTokens: 1536, thinkingConfig: { thinkingBudget: 0 } };
    }
    if (model === 'gemini-2.5-flash' && isStage7(stageId)) {
        return { maxOutputTokens: 1536, thinkingConfig: { thinkingBudget: 0 } };
    }
    if (model === 'gemini-2.5-flash' && isStage10(stageId)) {
        return { maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } };
    }
    return { maxOutputTokens: model === 'gemini-2.5-flash' ? 600 : 400 };
}

async function callGemini({ model, stageId, requestKind, systemPrompt, userMessage, apiKey }) {
    const endpoint =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const body = {
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: buildGenerationConfig(model, stageId, requestKind),
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
    const cand = data?.candidates?.[0];
    const text = cand?.content?.parts?.[0]?.text ?? '';
    // Surface the termination reason so the caller can tell a complete reply
    // (STOP) from a truncated one (MAX_TOKENS). Previously discarded, which let a
    // cut-off partial reply be presented as complete coaching.
    const finishReason = cand?.finishReason ?? null;
    const rawUsage = data?.usageMetadata || {};
    const asCount = value => Number.isFinite(Number(value))
        ? Math.max(0, Math.floor(Number(value)))
        : 0;
    // Return counts only. The Worker never logs or stores prompts or responses.
    const usage = {
        inputTokens: asCount(rawUsage.promptTokenCount),
        outputTokens: asCount(rawUsage.candidatesTokenCount),
        thoughtTokens: asCount(rawUsage.thoughtsTokenCount),
        cachedTokens: asCount(rawUsage.cachedContentTokenCount),
        totalTokens: asCount(rawUsage.totalTokenCount),
    };
    return { text, finishReason, usage };
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
        const { prompt, model: reqModel, stageId } = payload;
        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
            return Response.json(
                { error: 'prompt is required' },
                { status: 400, headers: corsHeaders(origin) }
            );
        }
        if (prompt.length > MAX_PROMPT_CHARS) {
            return Response.json(
                {
                    error: 'Prompt too large',
                    category: 'prompt_too_large',
                    maxPromptChars: MAX_PROMPT_CHARS,
                },
                { status: 400, headers: corsHeaders(origin) }
            );
        }

        // Model selection — allowlist only
        const model = (reqModel && ALLOWED_MODELS.has(reqModel)) ? reqModel : DEFAULT_MODEL;
        // The only request-specific generation path currently supported. Treat
        // all unknown values as ordinary requests.
        const KNOWN_REQUEST_KINDS = new Set([
            'passage_analysis',
            'full_draft_review',
            'capstone_review',
            'council_reviewer',
            'council_synthesis',
        ]);
        const requestKind = KNOWN_REQUEST_KINDS.has(payload.requestKind)
            ? payload.requestKind
            : null;

        // Call Gemini
        try {
            const { text, finishReason, usage } = await callGemini({
                model,
                stageId,              // selects the Stage 7 / Stage 10 generation config
                requestKind,          // selects complete cross-genre passage coaching
                systemPrompt: null,   // system prompt assembly happens in the frontend pipeline
                userMessage:  prompt,
                apiKey:       env.GEMINI_API_KEY,
            });
            // Integrity: a MAX_TOKENS-truncated reply must not be returned as complete
            // coaching. Flag ONLY the confirmed truncation reason here — other non-STOP
            // reasons (e.g. SAFETY) generally arrive with empty text and keep the
            // existing invalid-response handling; this is not a general error redesign.
            const truncated = finishReason === 'MAX_TOKENS';
            return Response.json({ text, truncated, usage }, { headers: corsHeaders(origin) });
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
