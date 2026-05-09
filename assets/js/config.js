// Tu Pana de Escritura — config.js
// API settings, embed URLs, user identity. Edit this file to change coach mode or connection details.

// ════════════════════════════════════════════════════════
//  CONFIG  —  Keep directLineSecret blank in browser-served builds.
// ════════════════════════════════════════════════════════
const CONFIG = {
    directLineSecret: '',       // Keep blank in browser-served builds. Do not place Direct Line secrets in client-side code.
    copilotEmbedUrl:  'https://copilotstudio.microsoft.com/environments/Default-6f60f0b3-5f06-4e09-9715-989dba8cc7d8/bots/cr7e4_agentkFTdLB/webchat?__version__=2',
    useCopilotEmbed:  true,     // Set false to fall back to DirectLine / offline mode.
    difyEmbedUrl:     'https://udify.app/chatbot/ZE9gRf5mVyst2LAX',  // Set '' to disable Dify mode.
    userId:   'student-' + Math.random().toString(36).slice(2, 10),
    userName: 'Estudiante'
};
