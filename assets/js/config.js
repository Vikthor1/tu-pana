// Tu Pana de Escritura — config.js
// API settings, user identity. Edit this file to change coach mode or connection details.

// ════════════════════════════════════════════════════════
//  CONFIG
// ════════════════════════════════════════════════════════
const CONFIG = {
    // Local AI provider. For direct Ollama testing use http://localhost:11434.
    // Later this can point to a local proxy, e.g. http://localhost:3001, without changing any other code.
    ollamaUrl:   'http://localhost:11434',
    ollamaModel: 'qwen2.5:7b',
    // Local Ollama performance settings.
    // keep_alive reduces cold-start delays during testing.
    // options constrain output length and improve rule-following consistency.
    ollamaKeepAlive: '10m',
    ollamaOptions: {
        temperature: 0.4,
        top_p:       0.85,
        num_predict: 400,
        num_ctx:     4096
    },
    // Gemini provider via Cloudflare Worker proxy.
    // Never add a Gemini API key here — browser code is public.
    geminiProxyUrl: 'https://tupana-gemini-proxy.dr-torres-velez.workers.dev',
    geminiModel:    'gemini-2.5-flash-lite',
    userId:   'student-' + Math.random().toString(36).slice(2, 10),  // Ephemeral. New random suffix per page load. Not persisted.
    userName: 'Estudiante',
    // Bug report URL (Patch 25). Set to a Google Form or other URL to enable the student bug report button.
    // Leave empty to show a "form not configured" fallback message.
    bugReportUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSczOMvWbQtyOkr_HaqNvWpBZpfgdbw5Q0I0JzCS3uBl6EMPSA/viewform'
};
