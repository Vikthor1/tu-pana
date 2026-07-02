// Tu Pana de Escritura — ai-provider.js
// AI provider abstraction layer.
// Loads after prompts.js, before storage.js.
// Depends on: AUTHORSHIP_GATE (genre-template.js), FEATURES (genre-template.js)

// ════════════════════════════════════════════════════════
//  ACTIVE PROVIDER
//  'gemini' = Gemini Flash-Lite via Cloudflare Worker proxy (active)
//  'current' = use existing state.coachMode routing in ui.js
//  Other values: 'ollama' | 'offline'
// ════════════════════════════════════════════════════════
const AI_PROVIDER = 'gemini';

// ════════════════════════════════════════════════════════
//  LAYERED PROMPT BUILDER
//  Assembles a system prompt from discrete layers.
//  Called by buildOllamaSystemPrompt() in ui.js for the Ollama path.
//  Future providers call this directly instead of their own prompt builder.
// ════════════════════════════════════════════════════════
function buildCoachPrompt({
    baseRules,
    courseModeRules,
    genreRules,
    stageRules,
    studentProcessData,
    userMessage
} = {}) {
    const parts = [];
    if (baseRules)          parts.push(baseRules);
    if (courseModeRules)    parts.push(courseModeRules);
    if (genreRules)         parts.push(genreRules);
    if (stageRules)         parts.push(stageRules);
    if (studentProcessData) parts.push('Student context:\n' + JSON.stringify(studentProcessData, null, 2));
    if (userMessage)        parts.push('Student message:\n' + userMessage);
    return parts.join('\n\n');
}

// ════════════════════════════════════════════════════════
//  GEMINI PROVIDER — scaffolded, disabled by feature flag
//  Gemini must be called through a secure proxy. Never expose API keys in browser code.
// ════════════════════════════════════════════════════════

// Stages 7 (revision) and 10 (capstone) use Flash for stronger paragraph-level
// reasoning and reliable JSON generation. All other stages use Flash-Lite.
function selectGeminiModel(stageId) {
    const FLASH_STAGE_IDS = new Set([7, 10, 'stage.revision', 'stage.reflection']);
    return FLASH_STAGE_IDS.has(stageId) ? 'gemini-2.5-flash' : (CONFIG.geminiModel || 'gemini-2.5-flash-lite');
}

// ── Gemini error helpers ──────────────────────────────────

function _statusToGeminiCategory(status) {
    if (status === 429) return 'rate_limited';
    if (status === 400) return 'bad_request';
    if (status === 401 || status === 403) return 'auth_error';
    if (status === 503 || status === 504) return 'service_unavailable';
    if (status >= 500) return 'upstream_error';
    return 'unknown_error';
}

function _mkGeminiErr(msg, category) {
    const e = new Error(msg);
    e.category = category;
    return e;
}

// Retryable categories (transient failures worth retrying automatically)
const _GEMINI_RETRYABLE = new Set(['rate_limited', 'service_unavailable', 'upstream_error', 'network_error']);
const _GEMINI_MAX_RETRIES = 2;

function _geminiBackoffMs(attempt) {
    // attempt 0 → ~1500ms, attempt 1 → ~4000ms; jitter prevents client synchronization
    return (attempt === 0 ? 1500 : 4000) + Math.floor(Math.random() * 600);
}

// Bilingual student-facing error messages keyed by category
function getGeminiErrorMessage(err) {
    const cat = err?.category;
    if (cat === 'rate_limited') {
        return 'El coach está recibiendo demasiadas solicitudes en este momento. Espera un momento e intenta de nuevo.\nThe coach is receiving too many requests right now. Wait a moment and try again.';
    }
    if (cat === 'auth_error') {
        return 'Hay un problema de configuración con el coach. Por favor, avisa a tu instructor/a.\nThere is a configuration issue with the coach. Please notify your instructor.';
    }
    if (cat === 'bad_request') {
        return 'El coach no pudo procesar ese mensaje. Intenta de nuevo o acorta tu mensaje.\nThe coach could not process that message. Try again or shorten your message.';
    }
    if (cat === 'invalid_response') {
        return 'El coach devolvió una respuesta inesperada. Intenta de nuevo.\nThe coach returned an unexpected response. Try again.';
    }
    // Visible copy only (Localization QA): approved AI-mode vocabulary — no
    // behavior, retry, or payload change in this function.
    return 'El Coach IA no está disponible temporalmente. Puedes intentar de nuevo o continuar con la Guía sin IA.\nThe Live AI coach is temporarily unavailable. You can try again or continue with Built-in, no AI mode.';
}

// Single-attempt Gemini fetch — called by callGeminiProviderViaProxy retry loop
async function _callGeminiOnce(coachPayload) {
    let response;
    try {
        response = await fetch(CONFIG.geminiProxyUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Data minimization (TP-SR-02): send only what the Worker consumes.
                // studentContext / assignmentConfig were transmitted but unused by the
                // Worker; removed so no unneeded fields travel over the wire.
                prompt:           coachPayload.prompt  || '',
                stageId:          coachPayload.stageId || null,
                responseFormat:   'text',
                model:            selectGeminiModel(coachPayload.stageId)
            })
        });
    } catch (_) {
        throw _mkGeminiErr('[Tu Pana] Gemini proxy unreachable', 'network_error');
    }

    let data;
    try {
        data = await response.json();
    } catch (_) {
        throw _mkGeminiErr('[Tu Pana] Gemini proxy returned an invalid response', 'invalid_response');
    }

    if (!response.ok) {
        const cat = data?.category || _statusToGeminiCategory(response.status);
        console.warn('[Tu Pana] Gemini proxy non-OK response', {
            proxyStatus:      response.status,
            mappedCategory:   cat,
            returnedCategory: data?.category      ?? '(none)',
            upstreamStatus:   data?.upstreamStatus ?? '(none)',
            timestamp:        new Date().toISOString()
        });
        const e   = _mkGeminiErr('[Tu Pana] Gemini error: ' + (data?.message || response.status), cat);
        e.status  = response.status;
        throw e;
    }

    if (!data?.text || typeof data.text !== 'string') {
        throw _mkGeminiErr('[Tu Pana] Gemini proxy returned no text', 'invalid_response');
    }

    return data.text;
}

async function callGeminiProviderViaProxy(coachPayload) {
    if (!CONFIG.geminiProxyUrl) {
        throw _mkGeminiErr('[Tu Pana] Gemini not configured: CONFIG.geminiProxyUrl is empty.', 'auth_error');
    }

    let lastErr;
    for (let attempt = 0; attempt <= _GEMINI_MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            await new Promise(r => setTimeout(r, _geminiBackoffMs(attempt - 1)));
        }
        try {
            return await _callGeminiOnce(coachPayload);
        } catch (err) {
            lastErr = err;
            if (!_GEMINI_RETRYABLE.has(err.category)) break; // non-retryable: stop immediately
        }
    }
    throw lastErr;
}

// ════════════════════════════════════════════════════════
//  RAW TEXT GENERATOR — lower-level provider entry point
//  Returns raw AI response text, or null for async/iframe providers.
//  Used by sendCoachMessage() and requestCoachPerspective().
// ════════════════════════════════════════════════════════
async function generateCoachResponse({ prompt, stageId, studentContext, assignmentConfig, responseFormat = 'text' } = {}) {
    // Gemini via Cloudflare Worker proxy
    if (FEATURES.geminiProvider && AI_PROVIDER === 'gemini') {
        return await callGeminiProviderViaProxy({ prompt, stageId, studentContext, assignmentConfig, responseFormat });
    }

    // Ollama: synchronously returns raw text
    if (typeof state !== 'undefined' && state.coachMode === 'ollama') {
        if (typeof callLocalCoachProvider === 'function') {
            return await callLocalCoachProvider(prompt);
        }
    }

    // DirectLine / offline: response arrives via callback or iframe
    return null;
}

// ════════════════════════════════════════════════════════
//  PROVIDER ROUTER — coaching UI entry point
//  All providers currently route through sendMsg() in ui.js.
// ════════════════════════════════════════════════════════
async function sendCoachMessage({ message, stageId, studentContext, assignmentConfig } = {}) {
    // Authorship gate secondary check (primary enforcement is in ui.js updateDraftControls)
    if (AUTHORSHIP_GATE && AUTHORSHIP_GATE.requiredBefore.includes(stageId)) {
        const draftSaved = (() => {
            try { return localStorage.getItem('tupana_draft_saved') === 'true'; } catch(e) { return false; }
        })();
        if (!draftSaved) {
            console.warn('[Tu Pana] Authorship gate: stage', stageId, 'requires first draft. Primary gate in ui.js.');
        }
    }

    if (typeof sendMsg === 'function') return sendMsg(message);
    console.error('[Tu Pana] sendMsg not available — check script load order.');
}
