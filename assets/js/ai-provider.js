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
//  'current' = use existing state.coachMode routing in ui.js
//  Future values: 'gemini' | 'ollama' | 'offline'
// ════════════════════════════════════════════════════════
const AI_PROVIDER = 'current';

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
//  PROVIDER ROUTER — main entry point for coaching requests
//  All AI requests from the workflow pass through here.
//  Currently delegates to sendMsg() in ui.js (no behavior change).
//
//  Future Gemini path:
//    if (AI_PROVIDER === 'gemini' && FEATURES.geminiProvider) {
//        return callGeminiProvider({ message, stageId, studentContext, assignmentConfig });
//    }
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

    // Route: Gemini (future, disabled by feature flag)
    if (AI_PROVIDER === 'gemini' && FEATURES.geminiProvider) {
        // Placeholder — Gemini not connected yet
        // return await callGeminiProvider({ message, stageId, studentContext, assignmentConfig });
        console.warn('[Tu Pana] Gemini provider is flagged but not implemented. Falling back.');
    }

    // Default: delegate to existing sendMsg() in ui.js
    // sendMsg is a function declaration in ui.js (loaded after this file) — available at call time.
    if (typeof sendMsg === 'function') {
        return sendMsg(message);
    }
    console.error('[Tu Pana] sendMsg not available — check script load order.');
}
