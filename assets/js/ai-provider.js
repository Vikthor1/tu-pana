// Tu Pana de Escritura — ai-provider.js
// AI provider abstraction layer. Separates provider-specific logic from the main workflow.
// Current provider: 'current' — routes to existing ui.js coach pipeline (Ollama/demo/offline/Copilot).
//
// To add Gemini Flash-Lite later:
//   1. Set AI_PROVIDER = 'gemini' (or add a FEATURES.geminiProvider guard)
//   2. Implement callGeminiProvider() here
//   3. Add the 'gemini' case to sendCoachMessage()
//   4. No changes needed in ui.js sendMsg() or app.js
//
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
                model:            CONFIG.geminiModel            || 'gemini-2.5-flash-lite'
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
//  Returns raw AI response text, or null if the active provider
//  delivers its response asynchronously (DirectLine callback) or
//  via an external iframe (Dify).  Callers manage UI state; this
//  function is pure provider I/O.
//
//  Currently returns text for: Ollama.
//  Returns null for: DirectLine, demo, offline, Dify.
//
//  Both sendCoachMessage() and Stage 10 requestCoachPerspective()
//  use this function so the Ollama call path is never duplicated.
//
//  ui.js functions (callLocalCoachProvider, state) are available at
//  call time — ai-provider.js loads first but is only invoked after
//  all scripts are parsed.
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

    // DirectLine / demo / offline / Dify: response arrives via callback or iframe
    return null;
}

// ════════════════════════════════════════════════════════
//  PROVIDER ROUTER — coaching UI entry point
//  Calls generateCoachResponse() for providers that return raw text.
//  Falls through to sendMsg() for async/iframe providers (DirectLine,
//  demo, Dify) where sendMsg() manages typing state and display.
//
//  Note: sendCoachMessage() is not yet wired as the primary call site
//  for normal chat. sendMsg() in ui.js remains the entry point for
//  the main chat flow; this function is the future routing layer.
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

    // Future: when Gemini (or another raw-text provider) is enabled, call
    // generateCoachResponse() here, handle full UI setup/teardown, and return.
    // For now, all providers route through sendMsg() which manages typing state,
    // student message display, process logging, and Ollama internally via
    // generateCoachResponse(). Adding a raw-text branch here before sendMsg()
    // handles UI state would silently skip typing indicators and process events.
    if (typeof sendMsg === 'function') return sendMsg(message);
    console.error('[Tu Pana] sendMsg not available — check script load order.');
}
