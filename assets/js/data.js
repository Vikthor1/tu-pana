// Tu Pana de Escritura — data.js
// Pure data: icons, stage definitions, transitions, steps, word thresholds.
// No DOM access. No functions except getIcon().

// ════════════════════════════════════════════════════════
//  CUSTOM SVG ICON LIBRARY
//  Warm, literary, student-centered icons
// ════════════════════════════════════════════════════════
const ICONS = {
    'student-page': `<svg viewBox="0 0 64 64" aria-hidden="true"><rect class="soft" x="10" y="8" width="42" height="50" rx="8"/><path class="tp-fill-paper" d="M16 6h24l10 10v40a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z"/><path d="M40 7v9h9"/><path d="M21 24h20M21 31h18M21 38h12"/><path class="tp-fill-mango" d="M22 49c4-7 8-9 11-7 2 1 1 5-2 6 4-2 8-1 9 2 1 3-2 5-6 5-5 0-9-2-12-6z"/></svg>`,
    'first-draft-door': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-paper2" d="M12 58V12c0-3 2-5 5-5h30c3 0 5 2 5 5v46"/><path class="tp-fill-paper" d="M24 58V26c0-3 2-5 5-5h13c3 0 5 2 5 5v32"/><circle class="tp-fill-mango" cx="42" cy="39" r="2"/><path d="M30 31h8M30 38h6"/><path class="tp-fill-teal" d="M26 13l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/></svg>`,
    'guide-lighthouse': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-sky" d="M24 12 9 5M40 12l15-7M24 17 7 18M40 17l17 1"/><path class="tp-fill-mango" d="M25 10h14v11H25z"/><path d="M28 10V7h8v3"/><path d="M25 21h14"/><path class="tp-fill-paper" d="M22 21h20l5 37H17z"/><path d="M26 21l-3 37M38 21l3 37"/><path d="M20 33h24M19 45h26M16 58h32"/><path class="tp-fill-teal" d="M29 33h6v9h-6z"/><path d="M32 21v37"/></svg>`,
    'critical-lens': `<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="tp-fill-paper" cx="27" cy="27" r="16"/><path d="M39 39l15 15"/><path class="tp-fill-plum" d="M28 17l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M22 44l-5 5M18 40l-5 5"/></svg>`,
    'voice-thread': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-paper" d="M14 8h32l6 6v42H14z"/><path d="M46 8v7h7"/><path class="tp-fill-rose" d="M29 21c0-3 2-5 5-5s5 2 5 5v9c0 3-2 5-5 5s-5-2-5-5z"/><path d="M23 29c0 7 4 12 11 12s11-5 11-12M34 41v8M27 49h14"/><path d="M21 54c4-3 8-3 12 0s8 3 12 0"/></svg>`,
    'language-bridge': `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M7 47h50"/><path class="tp-fill-paper" d="M16 47V24h9v23"/><path class="tp-fill-paper" d="M39 47V24h9v23"/><path d="M17 30h7M17 37h7M40 30h7M40 37h7"/><path d="M20.5 24C24 35 28 41 32 47"/><path d="M43.5 24C40 35 36 41 32 47"/><path d="M20.5 24C28 32 36 32 43.5 24"/><path d="M13 47c10-7 28-7 38 0"/><path class="tp-fill-mango" d="M10 52h44v5H10z"/><path class="tp-fill-teal" d="M13 18h15v6H13z"/><path class="tp-fill-rose" d="M36 18h15v6H36z"/></svg>`,
    'positionality-compass': `<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="tp-fill-paper" cx="32" cy="32" r="23"/><path d="M32 7v7M32 50v7M7 32h7M50 32h7"/><path class="tp-fill-mango" d="M32 14l6 18-6-3-6 3z"/><path class="tp-fill-teal" d="M32 50l-6-18 6 3 6-3z"/><path d="M18 18l5 5M46 18l-5 5M18 46l5-5M46 46l-5-5"/><circle class="tp-fill-clay" cx="32" cy="32" r="3"/></svg>`,
    'community-map': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-paper2" d="M8 15l15-6 18 6 15-6v40l-15 6-18-6-15 6z"/><path d="M23 9v40M41 15v40"/><path class="tp-fill-rose" d="M31 21c0-4 3-7 7-7s7 3 7 7c0 6-7 13-7 13s-7-7-7-13z"/><circle cx="38" cy="21" r="2"/><path d="M14 35c6-4 10-4 16 0s10 4 20-2"/></svg>`,
    'reflection-mirror': `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse class="tp-fill-paper" cx="32" cy="24" rx="15" ry="18"/><ellipse class="tp-fill-sky" cx="32" cy="24" rx="10" ry="13"/><path d="M27 18c3-3 8-3 11 0"/><path d="M32 42v10"/><path class="tp-fill-paper2" d="M23 52h18v6H23z"/><path d="M23 58h18"/><path d="M24 48h16"/></svg>`,
    'revision-arrows': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-paper" d="M18 9h22l8 8v32H18z"/><path d="M40 10v8h8"/><path d="M24 25h15M24 32h12"/><path d="M17 30a18 18 0 0 1 22-16"/><path d="M33 10l6 4-5 5"/><path d="M47 34a18 18 0 0 1-22 16"/><path d="M31 54l-6-4 5-5"/><path class="tp-fill-mango" d="M38 43l12-12 5 5-12 12-7 2z"/></svg>`,
    'saved-seal': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-paper" d="M14 7h33l7 7v43H14z"/><path d="M47 7v8h7M22 23h21M22 31h16"/><circle class="tp-fill-jade" cx="43" cy="45" r="10"/><path d="M38 45l4 4 7-8"/></svg>`,
    'footsteps': `<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse class="tp-fill-teal" cx="23" cy="39" rx="7" ry="11" transform="rotate(-18 23 39)"/><circle class="tp-fill-teal" cx="16" cy="25" r="2.3"/><circle class="tp-fill-teal" cx="21" cy="23" r="2.4"/><circle class="tp-fill-teal" cx="26" cy="24" r="2.2"/><circle class="tp-fill-teal" cx="30" cy="27" r="2"/><ellipse class="tp-fill-mango" cx="42" cy="25" rx="7" ry="11" transform="rotate(18 42 25)"/><circle class="tp-fill-mango" cx="35" cy="11" r="2"/><circle class="tp-fill-mango" cx="39" cy="8" r="2.2"/><circle class="tp-fill-mango" cx="44" cy="8" r="2.3"/><circle class="tp-fill-mango" cx="49" cy="10" r="2.1"/><path d="M16 55c8-3 18-3 31 0"/></svg>`,
    'accuracy-target': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-paper" d="M15 8h30l6 6v42H15z"/><path d="M45 8v7h7"/><circle class="tp-fill-teal" cx="33" cy="34" r="14"/><circle class="tp-fill-paper" cx="33" cy="34" r="8"/><circle class="tp-fill-clay" cx="33" cy="34" r="3"/><path d="M43 24l9-9M47 15h5v5"/></svg>`,
    'specificity-highlighter': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-paper" d="M13 8h34l4 4v44H13z"/><path d="M47 8v5h5"/><path class="tp-fill-mango" d="M21 29h25v8H21z"/><path d="M21 21h18M21 33h25M21 45h14"/><path class="tp-fill-plum" d="M45 43l9-9 5 5-9 9-7 2z"/></svg>`,
    'thinking-brain': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-rose" d="M22 50c-7-1-11-7-10-14-5-6-2-16 6-18 2-7 12-9 17-4 7-4 17 1 17 10 6 3 7 13 2 18 1 7-5 12-12 10-5 5-15 4-20-2z"/><path d="M31 15v36"/><path d="M25 18c-4 1-6 4-5 8"/><path d="M20 31c4-2 8-1 10 3"/><path d="M23 42c3-3 6-3 8 0"/><path d="M39 17c4 2 5 6 3 9"/><path d="M43 31c-4-1-8 1-10 5"/><path d="M40 43c-3-3-6-3-8 0"/><path d="M18 36c-2 3-2 6 1 9"/><path d="M47 37c2 3 1 7-2 10"/></svg>`,
    'writing-map': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-paper" d="M9 14l14-5 18 5 14-5v41l-14 5-18-5-14 5z"/><path d="M23 9v41M41 14v41"/><path d="M15 43c7-12 18 2 27-9 4-5 4-11 10-15"/><circle class="tp-fill-mango" cx="15" cy="43" r="3"/><circle class="tp-fill-teal" cx="52" cy="19" r="3"/><path d="M29 25h6M28 31h8"/></svg>`,
    'final-portfolio': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-paper2" d="M8 20h20l5 6h23v27a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5z"/><path class="tp-fill-paper" d="M15 14h33v34H15z"/><path d="M22 25h17M22 33h20M22 41h12"/><path class="tp-fill-jade" d="M41 39l4 4 8-10"/></svg>`,
    'boundary-envelope': `<svg viewBox="0 0 64 64" aria-hidden="true"><rect class="tp-fill-paper2" x="9" y="16" width="46" height="34" rx="5"/><path d="M10 20l22 17 22-17"/><path class="tp-fill-paper" d="M24 10h16l6 6v20H24z"/><path d="M40 10v7h7"/><path class="tp-fill-rose" d="M32 27c-4-4-9-1-7 4 1 4 7 8 7 8s6-4 7-8c2-5-3-8-7-4z"/></svg>`,
    'process-timeline': `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 10v44"/><circle class="tp-fill-mango" cx="18" cy="16" r="5"/><circle class="tp-fill-teal" cx="18" cy="32" r="5"/><circle class="tp-fill-plum" cx="18" cy="48" r="5"/><path class="tp-fill-paper" d="M30 10h22v12H30zM30 26h22v12H30zM30 42h22v12H30z"/><path d="M35 16h10M35 32h12M35 48h8"/></svg>`,
    'luminous-page': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-paper" d="M17 8h28l7 7v41H17z"/><path d="M45 8v8h8M24 27h20M24 35h17M24 43h10"/><path class="tp-fill-mango" d="M11 16l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/><path class="tp-fill-teal" d="M51 36l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/></svg>`,
    'grammar-tuning': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-paper" d="M13 8h30l8 8v40H13z"/><path d="M43 8v9h9M22 25h20M22 33h15"/><circle class="tp-fill-teal" cx="39" cy="43" r="10"/><path d="M39 34v6M39 46v6M30 43h6M42 43h7"/><circle class="tp-fill-paper" cx="39" cy="43" r="3"/></svg>`,
    'academic-dial': `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-paper" d="M13 44a20 20 0 1 1 38 0z"/><path d="M20 42h24"/><path d="M20 37l-5-3M24 28l-3-5M32 25v-6M40 28l3-5M44 37l5-3"/><path class="tp-fill-mango" d="M32 40l11-13"/><circle class="tp-fill-clay" cx="32" cy="40" r="3"/><path d="M22 51h20"/></svg>`,
    'mobile-writing-view': `<svg viewBox="0 0 64 64" aria-hidden="true"><rect class="tp-fill-paper" x="17" y="6" width="30" height="52" rx="7"/><path d="M28 11h8M29 53h6"/><rect class="tp-fill-paper2" x="21" y="17" width="22" height="16" rx="3"/><path d="M24 22h12M24 27h9"/><rect class="tp-fill-teal" x="21" y="37" width="22" height="10" rx="3"/><path d="M25 42h10"/><path class="tp-fill-mango" d="M49 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/></svg>`,
    'universal-access': `<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="tp-fill-paper" cx="32" cy="32" r="24"/><circle class="tp-fill-mango" cx="32" cy="16" r="5"/><path d="M16 27h32"/><path d="M32 21v16"/><path d="M32 37l-10 15"/><path d="M32 37l10 15"/><path d="M24 52h-5"/><path d="M40 52h5"/><path class="tp-fill-teal" d="M12 32a20 20 0 1 0 40 0"/></svg>`
};

function getIcon(name, size, ariaHidden) {
    const svg = ICONS[name];
    if (!svg) return '';
    const ah = ariaHidden !== false ? ' aria-hidden="true"' : '';
    const style = size ? ` style="width:${size}px;height:${size}px"` : '';
    return `<span class="tp-icon"${style}${ah}>${svg}</span>`;
}

// ════════════════════════════════════════════════════════
//  STAGE DATA
// ════════════════════════════════════════════════════════
const STAGES = [
    { id:1,  es:'Anécdota',       en:'Anecdote',     desc:'Identify a specific anecdote, experience, or identity moment. Start in whatever language feels most real — then write it a second time in the other.', translang:'Puedes escribir en español, inglés, o los dos. Tu idioma es tu herramienta.',
      example: `Example / Ejemplo:
"La primera vez que vi a mi mamá llorar fue cuando recibió la carta de desalojo. Esa carta no era solo sobre nosotros."

"The first time I saw my mother cry was when she received the eviction letter. That letter was not just about us."`,
      followups: [
        '¿Qué detalle concreto de esta escena todavía no he descrito? / What concrete detail in this scene have I not described yet?',
        '¿Qué palabra en español no tiene traducción exacta — y por qué la necesito aquí? / What Spanish word has no exact translation — and why do I need it here?',
        '¿Qué sentido físico (olor, sonido, tacto) falta en mi anécdota? / What physical sense (smell, sound, touch) is missing from my anecdote?'
      ]},
    { id:2,  es:'Conexión',       en:'Connection',   desc:'Connect your personal memory to a larger historical, social, or cultural context. If a word exists only in Spanish (or only in English), use it — then explain it in the other language.', translang:'Si una palabra solo existe en tu otro idioma, úsala. El código-alternado es válido.',
      example: `Example / Ejemplo:
That letter was about thousands of families like ours displaced in the South Bronx during the 90s when the city decided our neighborhood was worth more without us.

Esa carta era sobre miles de familias como la nuestra desplazadas en el South Bronx durante los 90 cuando la ciudad decidió que nuestro barrio valía más sin nosotros.`,
      followups: [
        '¿Qué pregunta sobre mi historia todavía no puedo responder? / What question about my story can I still not answer?',
        '¿Dónde está el momento de giro — donde lo personal choca con lo histórico? / Where is the turning point — where the personal collides with the historical?',
        '¿Qué fuente confirmaría (o desafiaría) lo que ya sé por experiencia? / What source would confirm (or challenge) what I already know from experience?'
      ]},
    { id:3,  es:'Tu Pitch',       en:'Topic Pitch',  desc:'Write a 4–6 sentence topic pitch in your own words.',
      example: `Example / Ejemplo:
"My essay connects my family's eviction in 1997 to gentrification in the South Bronx. I use personal memories — my mother's tears, the packing boxes — alongside research on NYC housing policy to show how private profit was built on our pain."`,
      followups: [
        '¿Mi pitch tiene una pregunta real o solo un tema? / Does my pitch have a real question or just a topic?',
        '¿Qué oposición o tensión hay en mi idea — y no la estoy evitando? / What opposition or tension exists in my idea — and am I not avoiding it?',
        '¿Por qué a alguien que no es de mi comunidad le importaría esto? / Why would someone outside my community care about this?'
      ]},
    { id:4,  es:'Investigación',  en:'Research',     desc:'Find sources and identify research directions — your coach suggests, you search.',
      example: `Example / Ejemplo:
Research question: How did 1990s welfare reform target Black and Latinx neighborhoods in NYC?

Sources to find:
• A scholarly article on 'Broken Windows' policing and its racial impact
• A community organization's report on South Bronx displacement
• A 1997 newspaper article about your specific neighborhood`,
      followups: [
        '¿Qué fuente escolar contradice lo que mi comunidad ya sabe? / What scholarly source contradicts what my community already knows?',
        '¿Qué pregunta de investigación me da miedo hacer — y por qué? / What research question am I afraid to ask — and why?',
        '¿Cómo conecto esta investigación con una escena específica de mi borrador? / How do I connect this research to a specific scene in my draft?'
      ]},
    { id:5,  es:'Esquema',        en:'Outline',      desc:'Create your own rough outline. Your coach gives feedback, not the outline.',
      example: `Example / Ejemplo:
1. Opening scene: The eviction letter, my mother's hands shaking
2. Bridge: That letter was not unique — it was part of a pattern
3. Context: 1990s welfare reform + 'Broken Windows' policing
4. Analysis: How policy turned our homes into profit
5. Conclusion: I still live with this — and so does my city`,
      followups: [
        '¿Mi esquema tiene un momento de giro claro — o es solo una lista? / Does my outline have a clear turning point — or is it just a list?',
        '¿Qué sección me da más miedo escribir — y por qué? / What section am I most afraid to write — and why?',
        '¿Dónde pongo mi voz más fuerte en este esquema? / Where do I place my strongest voice in this outline?'
      ]},
    { id:6,  es:'Primer\nBorrador',en:'First Draft', desc:'⭐ Write and save your unassisted first draft. This unlocks revision feedback.',
      example: `Example / Ejemplo:
Write 3–4 pages without stopping. Do not delete anything. Do not check grammar. Start with your most vivid memory and let the connections emerge naturally.

If you get stuck, write "I am stuck because..." and keep going. The only rule: no AI help. This draft belongs to you.

Escribe 3–4 páginas sin parar. No borres nada. No revises la gramática. Empieza con tu memoria más vívida y deja que las conexiones surjan naturalmente.`,
      followups: [
        '¿Qué oración de mi borrador suena más como yo? / What sentence in my draft sounds most like me?',
        '¿Dónde me detuve porque algo me dio miedo escribirlo? / Where did I stop because something scared me to write it?',
        '¿Qué conexión entre mi historia y el contexto más grande todavía no está clara? / What connection between my story and the larger context is still unclear?'
      ]},
    { id:7,  es:'Revisión',       en:'Revision',     desc:'Receive paragraph-level feedback using the five-question protocol.',
      example: `Example / Ejemplo:
Paste one paragraph from your draft into the chat. Your coach will ask:
• What specific detail here is doing the most work?
• Where does your voice sound most like YOU?
• What historical connection is still missing?

Pega un párrafo de tu borrador en el chat. Tu coach te preguntará qué detalle específico trabaja más, dónde suena tu voz más como TÚ, y qué conexión histórica todavía falta.`,
      followups: [
        '¿Qué detalle concreto de este párrafo debería expandir? / What concrete detail in this paragraph should I expand?',
        '¿Qué oración aquí suena como alguien más — no como yo? / What sentence here sounds like someone else — not like me?',
        '¿Dónde falta el puente entre mi experiencia y el contexto histórico? / Where is the bridge between my experience and the historical context missing?'
      ]},
    { id:8,  es:'Pulir Voz',      en:'Voice Polish', desc:'Compare original and revised paragraphs. Protect what still sounds like you.',
      example: `Example / Ejemplo:
Original: "The policies were very impactful on my community."
Revised:  "My mother's hands shook when she read the letter — and that shaking is what the policy counted as progress."

Question: Which sentence sounds like YOU? Protect that voice.

Pregunta: ¿Qué oración suena como TÚ? Protege esa voz.`,
      followups: [
        '¿Qué frase en español de mi borrador original no debería perder en la revisión? / What Spanish phrase in my original draft should I not lose in revision?',
        '¿Qué oración "académica" suena como un robot la escribió? / What "academic" sentence sounds like a robot wrote it?',
        '¿Qué detalle personal protejo cueste lo que cueste? / What personal detail do I protect at all costs?'
      ]},
    { id:9,  es:'Checklist',      en:'Checklist',    desc:'Verify all submission materials are complete before turning in.',
      example: `Example / Ejemplo:
□ First draft saved in Tu Pana
□ Revised essay with feedback addressed
□ Bridge sentence: personal story → historical context
□ At least 2 scholarly sources cited
□ Process note: how you used AI as a tool
□ All facts verified with independent sources`,
      followups: [
        '¿Mi ensayo todavía tiene mi voz en la primera oración y en la última? / Does my essay still have my voice in the first sentence and the last?',
        '¿Qué hecho histórico verifiqué con una fuente independiente? / What historical fact did I verify with an independent source?',
        '¿Qué decisión de revisión me costó más — y por qué la tomé? / What revision decision cost me the most — and why did I make it?'
      ]},
    { id:10, es:'Mi Cierre\nde Proceso', en:'My Writing Snapshot', desc:'Reflect on your writing process before submitting. Name what changed, what you protected, and what still needs your attention.',
      followups: [
        '¿Qué cambió entre mi primer borrador y mi versión final? / What changed between my first draft and my final version?',
        '¿Qué parte de mi voz protegí durante toda la revisión? / What part of my voice did I protect throughout revision?',
        '¿Qué sigue necesitando trabajo — y por qué lo entrego de todas formas? / What still needs work — and why am I submitting it anyway?'
      ]}
];

// ════════════════════════════════════════════════════════
//  STAGE TRANSITIONS — per-stage completed text + CTA labels
//  Used by the stage preview modal and the continue button.
// ════════════════════════════════════════════════════════
const STAGE_TRANSITIONS = {
    2:  {
        completedEs: 'Identificaste un momento específico y lo escribiste con tus propias palabras.',
        completedEn: 'You identified a specific moment and wrote it in your own words.',
        ctaEs: 'Conectar con la historia',
        ctaEn: 'Connect to History'
    },
    3:  {
        completedEs: 'Conectaste tu historia personal con un contexto histórico o social más amplio.',
        completedEn: 'You connected your personal story to a larger historical context.',
        ctaEs: 'Escribir mi pitch',
        ctaEn: 'Write My Pitch'
    },
    4:  {
        completedEs: 'Argumentaste en pocas oraciones por qué tu ensayo importa.',
        completedEn: 'You argued in a few sentences why your essay matters.',
        ctaEs: 'Empezar la investigación',
        ctaEn: 'Begin Research'
    },
    5:  {
        completedEs: 'Identificaste tus preguntas de investigación y fuentes clave.',
        completedEn: 'You identified your research questions and key sources.',
        ctaEs: 'Crear mi esquema',
        ctaEn: 'Create My Outline'
    },
    6:  {
        completedEs: 'Tienes una estructura para tu ensayo. Ahora viene la parte más importante.',
        completedEn: 'You have a structure for your essay. Now comes the most important part.',
        ctaEs: 'Empezar mi borrador',
        ctaEn: 'Start My Draft'
    },
    7:  {
        completedEs: 'Guardaste tu primer borrador sin ayuda. Eso es tuyo para siempre.',
        completedEn: 'You saved your unassisted first draft. That belongs to you.',
        ctaEs: 'Comenzar la revisión',
        ctaEn: 'Start Revising'
    },
    8:  {
        completedEs: 'Recibiste retroalimentación a nivel de párrafo usando las Cinco Preguntas.',
        completedEn: 'You received paragraph-level feedback using the Five Questions.',
        ctaEs: 'Pulir mi voz',
        ctaEn: 'Polish My Voice'
    },
    9:  {
        completedEs: 'Comparaste tu borrador original con tus revisiones y protegiste tu voz.',
        completedEn: 'You compared original and revised drafts and protected your voice.',
        ctaEs: 'Ir al checklist',
        ctaEn: 'Go to Checklist'
    },
    10: {
        completedEs: 'Verificaste todos los materiales de entrega.',
        completedEn: 'You verified all submission materials.',
        ctaEs: 'Escribir mi cierre de proceso',
        ctaEn: 'Write My Reflection'
    }
};

// ════════════════════════════════════════════════════════
//  STAGE STEPS — 3 in-stage steps per stage (for task bar)
// ════════════════════════════════════════════════════════
const STAGE_STEPS = {
    1:  [
        { es: 'Elige un momento específico de tu vida.',          en: 'Choose one specific moment from your life.' },
        { es: 'Escribe libremente. La gramática puede esperar.',   en: 'Write freely. Grammar can wait.' },
        { es: '¿Qué detalle de lo que escribiste te sorprende más?', en: 'What detail in what you wrote surprises you most?' }
    ],
    2:  [
        { es: 'Relee tu anécdota. ¿Qué fuerza más grande la conecta?', en: 'Re-read your anecdote. What larger force connects to it?' },
        { es: 'Nombra la conexión: histórica, social, o cultural.',      en: 'Name the connection: historical, social, or cultural.' },
        { es: 'Escribe la oración puente entre tu historia y ese contexto.', en: 'Write the bridge sentence between your story and that context.' }
    ],
    3:  [
        { es: 'Decide qué pregunta real intenta responder tu ensayo.',        en: 'Decide what real question your essay is trying to answer.' },
        { es: 'Escribe 4–6 oraciones que expliquen tu argumento principal.',  en: 'Write 4–6 sentences explaining your main argument.' },
        { es: '¿Tu pitch suena como tú? Léelo en voz alta.',                 en: 'Does your pitch sound like you? Read it aloud.' }
    ],
    4:  [
        { es: 'Genera 2–3 preguntas de investigación desde tu experiencia.',  en: 'Generate 2–3 research questions from your experience.' },
        { es: 'Busca fuentes que confirmen — o desafíen — lo que ya sabes.',  en: 'Find sources that confirm — or challenge — what you already know.' },
        { es: 'Conecta cada fuente con una escena específica de tu historia.', en: 'Connect each source to a specific scene in your story.' }
    ],
    5:  [
        { es: 'Lista 5 momentos clave de tu ensayo en orden tentativo.',          en: 'List 5 key moments of your essay in tentative order.' },
        { es: 'Identifica el punto de giro: ¿dónde lo personal choca con lo histórico?', en: 'Identify the turning point: where the personal collides with the historical.' },
        { es: 'Comparte tu esquema con el coach y pide retroalimentación concreta.', en: 'Share your outline with the coach and ask for specific feedback.' }
    ],
    6:  [
        { es: '⭐ Escribe sin parar. No borres nada. Este borrador es tuyo.',      en: '⭐ Write without stopping. Do not delete anything. This draft is yours.' },
        { es: 'Sigue escribiendo. El coach espera hasta que guardes.',              en: 'Keep writing. The coach waits until you save.' },
        { es: 'Cuando termines, guarda tu borrador para desbloquear la revisión.',  en: 'When done, save your draft to unlock revision.' }
    ],
    7:  [
        { es: 'Elige un párrafo. Pégalo en el chat con el coach.',           en: 'Choose one paragraph. Paste it in chat with the coach.' },
        { es: 'Aplica las Cinco Preguntas a la respuesta del coach.',        en: 'Apply the Five Questions to the coach\'s response.' },
        { es: 'Tú decides qué queda. Tu criterio tiene la última palabra.',  en: 'You decide what stays. Your judgment has the final word.' }
    ],
    8:  [
        { es: 'Compara tu versión original con la versión revisada.',         en: 'Compare your original with the revised version.' },
        { es: 'Protege lo que todavía suena como tú.',                        en: 'Protect what still sounds like you.' },
        { es: 'Toma la decisión final. Tu voz no debe sonar como un robot.',  en: 'Make the final decision. Your voice should not sound like a robot.' }
    ],
    9:  [
        { es: 'Verifica que tienes todos los materiales de entrega.',             en: 'Verify that all your submission materials are ready.' },
        { es: 'Confirma que todas las fuentes están verificadas con citas reales.', en: 'Confirm all sources are verified with real citations.' },
        { es: 'Tu ensayo todavía tiene tu voz en la primera y última oración.',   en: 'Your essay still has your voice in the first and last sentence.' }
    ],
    10: [
        { es: 'Completa tu autoevaluación (10A). Tu criterio va primero.',  en: 'Complete your self-assessment (10A). Your judgment comes first.' },
        { es: 'Compara con la perspectiva del coach (10B). Léela críticamente.', en: 'Compare with the coach perspective (10B). Read it critically.' },
        { es: 'Escribe tu respuesta final (10C). Tú tienes la última palabra.', en: 'Write your final response (10C). You have the final word.' }
    ]
};

// Word-count thresholds that auto-advance stage steps (stages 1–6 only)
// [threshold-for-step-2, threshold-for-step-3]
const STEP_WORD_THRESHOLDS = {
    1: [5, 40], 2: [5, 40], 3: [10, 50],
    4: [5, 20], 5: [5, 30], 6: [20, 200]
};
