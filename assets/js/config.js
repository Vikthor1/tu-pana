// Tu Pana de Escritura — config.js
// API settings, embed URLs, user identity. Edit this file to change coach mode or connection details.

// ════════════════════════════════════════════════════════
//  CONFIG  —  Keep directLineSecret blank in browser-served builds.
// ════════════════════════════════════════════════════════
const CONFIG = {
    directLineSecret: '',       // Keep blank in browser-served builds. Do not place Direct Line secrets in client-side code.
    copilotEmbedUrl:  'https://copilotstudio.microsoft.com/environments/Default-6f60f0b3-5f06-4e09-9715-989dba8cc7d8/bots/cr7e4_agentkFTdLB/webchat?__version__=2',
    useCopilotEmbed:  true,     // Set false to fall back to DirectLine / offline mode.
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
    // Gemini provider (future). geminiProxyUrl must point to a secure server-side proxy.
    // Never add a Gemini API key here — browser code is public.
    geminiProxyUrl: 'https://tupana-gemini-proxy.dr-torres-velez.workers.dev',
    geminiModel:    'gemini-2.5-flash-lite',
    userId:   'student-' + Math.random().toString(36).slice(2, 10),  // Ephemeral. New random suffix per page load. Not persisted.
    userName: 'Estudiante'
};
