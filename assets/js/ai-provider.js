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

async function callGeminiProviderViaProxy(coachPayload) {
    if (!CONFIG.geminiProxyUrl) {
        throw new Error('[Tu Pana] Gemini not configured: CONFIG.geminiProxyUrl is empty.');
    }

    let response;
    try {
        response = await fetch(CONFIG.geminiProxyUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt:           coachPayload.prompt           || '',
                stageId:          coachPayload.stageId          || null,
                studentContext:   coachPayload.studentContext   || {},
                assignmentConfig: coachPayload.assignmentConfig || {},
                responseFormat:   'text',
                model:            selectGeminiModel(coachPayload.stageId)
            })
        });
    } catch (err) {
        throw new Error('[Tu Pana] Gemini proxy unreachable');
    }

    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error('[Tu Pana] Gemini proxy returned an invalid response');
    }

    if (!response.ok) {
        throw new Error('[Tu Pana] Gemini proxy error: ' + (data?.error || response.status));
    }

    if (!data?.text || typeof data.text !== 'string') {
        throw new Error('[Tu Pana] Gemini proxy returned no text');
    }

    return data.text;
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
