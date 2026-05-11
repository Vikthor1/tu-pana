// Tu Pana de Escritura — prompts.js
// Coaching content: micro-prompts, stuck affirmations, pana hints, revision categories.
// Also includes the UI functions that display these prompts (showStuckMini, injectPanaHint, etc.).

// ════════════════════════════════════════════════════════
//  MICRO-PROMPTS — one tiny task + one sentence starter per stage
// ════════════════════════════════════════════════════════
const MICRO_PROMPTS = {
    1: [
        { task: 'Name one moment you remember.', starter: 'I remember the moment when…' },
        { task: 'Start with a place.', starter: 'This happened in…' },
        { task: 'Start with a person.', starter: 'The person I remember most in this story is…' },
        { task: 'Start with a feeling.', starter: 'At that moment, I felt…' },
        { task: 'Start with what you noticed first.', starter: 'The first thing I noticed was…' },
        { task: 'Start with what you did not understand.', starter: 'I did not understand why…' }
    ],
    2: [
        { task: 'Name the part of your story you understand best right now.', starter: 'The part of my story I understand best right now is…' },
        { task: 'Name the part you still need to figure out.', starter: 'The part I still need to figure out is…' },
        { task: 'Write one question your essay might explore.', starter: 'One question my essay might explore is…' }
    ],
    3: [
        { task: 'Write what this story might really be about.', starter: 'This story might be about…' },
        { task: 'Name a tension you notice in this memory.', starter: 'A tension I notice in this memory is…' },
        { task: 'Write the bigger question hiding inside this moment.', starter: 'The bigger question behind this moment might be…' },
        { task: 'Connect this experience to a larger issue.', starter: 'This experience connects to issues of…' }
    ],
    4: [
        { task: 'Name what was happening around your personal experience.', starter: 'At the time this happened, my community was also dealing with…' },
        { task: 'Name a larger historical issue connected to this memory.', starter: 'A larger historical issue connected to this memory is…' },
        { task: 'Write what a reader needs to know to understand this moment.', starter: 'To understand this moment, a reader needs to know…' },
        { task: 'Name a question you want to research.', starter: 'I need a source that helps me understand…' }
    ],
    5: [
        { task: 'Write how your essay could begin.', starter: 'My essay could begin with…' },
        { task: 'Write what the reader needs to understand after the anecdote.', starter: 'After the anecdote, the reader needs to understand…' },
        { task: 'Name one section your essay should focus on.', starter: 'One section of my essay should focus on…' },
        { task: 'Write how the ending might connect back.', starter: 'The ending might return to…' }
    ],
    6: [
        { task: 'Write the next part of your draft — one sentence.', starter: 'The next part of my draft needs to explain…' },
        { task: 'Name one idea you have not developed yet.', starter: 'One idea I have not developed yet is…' },
        { task: 'Write what this paragraph is trying to show.', starter: 'This paragraph is trying to show…' },
        { task: 'Connect the memory to the larger issue.', starter: 'I can connect this memory to the larger issue by…' }
    ],
    7: [
        { task: 'Paste one sentence you want to make clearer.', starter: 'One sentence I want to make clearer is…' },
        { task: 'Name what this paragraph would be stronger if it had.', starter: 'This paragraph would be stronger if…' },
        { task: 'Write the idea you want the reader to understand.', starter: 'The idea I want the reader to understand is…' },
        { task: 'Name what you want to protect as you revise.', starter: 'I want to revise without losing…' }
    ],
    8: [
        { task: 'Name the sentence you most want to revise.', starter: 'One sentence I want to make clearer is…' },
        { task: 'Describe what the paragraph needs.', starter: 'This paragraph would be stronger if…' },
        { task: 'Write what you want to protect.', starter: 'I want to keep my voice by…' }
    ],
    9: [
        { task: 'Name one item you still need to check before Stage 10.', starter: 'One thing I still need to check is…' },
        { task: 'Confirm your first draft is saved and complete.', starter: 'My first draft is saved and…' },
        { task: 'Check whether your essay includes both a personal moment and a larger connection.', starter: 'My essay includes a personal moment and a connection to…' },
        { task: 'Name one part of your draft that needs one last look.', starter: 'The part of my draft that still needs attention is…' }
    ]
};

const STUCK_AFFIRMATIONS = [
    "No pasa nada. Let's make this smaller.",
    'One sentence. That is all we need right now.',
    "The blank page is acting dramatic. Let's give it one sentence and calm it down.",
    'This is not the whole essay. This is just one brave little sentence.',
    'Café first, panic later. Actually, no panic — just one sentence.'
];

let stuckMiniIdx = {};  // tracks prompt index per stage

function showStuckMini() {
    // Remove any existing mini card
    document.querySelectorAll('.stuck-mini').forEach(el => el.remove());

    const stage = state.stage;
    const prompts = MICRO_PROMPTS[stage] || MICRO_PROMPTS[6];
    if (stuckMiniIdx[stage] === undefined) stuckMiniIdx[stage] = 0;
    const idx   = stuckMiniIdx[stage] % prompts.length;
    const p     = prompts[idx];
    const aff   = STUCK_AFFIRMATIONS[Math.floor(Math.random() * STUCK_AFFIRMATIONS.length)];

    const card = document.createElement('div');
    card.className = 'stuck-mini';
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Stuck — tiny writing prompt · ayuda para escribir');
    card.innerHTML = `
        <div class="stuck-mini-affirmation" aria-live="polite">${aff}</div>
        <div class="stuck-mini-task">
            <strong>Tiny task · Tarea pequeña:</strong>
            ${p.task}
        </div>
        <div class="stuck-mini-starter">
            <span class="stuck-mini-starter-label">Sentence starter · Cómo empezar:</span>
            "${p.starter}"
        </div>
        <div class="stuck-mini-actions">
            <button class="stuck-mini-primary" onclick="useStarter(this)" data-starter="${p.starter.replace(/"/g,'&quot;')}"
                aria-label="Copiar este inicio de oración a mi borrador · Copy this sentence starter to my draft">
                Usar este inicio · Use this starter
            </button>
            <button class="stuck-mini-secondary" onclick="nextStarter(${stage})"
                aria-label="Mostrar un inicio diferente · Show a different starter">
                Otro inicio · Different starter
            </button>
            <button class="stuck-mini-close" onclick="this.closest('.stuck-mini').remove()"
                aria-label="Cerrar · Close">✕</button>
        </div>
    `;

    D.chatMessages.appendChild(card);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
    card.querySelector('.stuck-mini-primary').focus();
}

function useStarter(btn) {
    const starter = btn.getAttribute('data-starter') || '';
    if (!starter) return;
    const area = D.draftArea;
    if (!area || area.disabled) return;
    const cur = area.value;
    area.value = cur ? cur + '\n\n' + starter : starter;
    area.focus();
    // Place cursor at end
    area.setSelectionRange(area.value.length, area.value.length);
    // Trigger word count update
    area.dispatchEvent(new Event('input'));
    btn.closest('.stuck-mini').remove();
}

function nextStarter(stage) {
    stuckMiniIdx[stage] = ((stuckMiniIdx[stage] || 0) + 1);
    showStuckMini();
}

// ════════════════════════════════════════════════════════
//  PANA HINTS — stage-specific just-in-time guidance
// ════════════════════════════════════════════════════════
const PANA_HINTS = {
    1: {
        gentle: {
            title: 'Empieza con el detalle que recuerdas más claramente. · Start with the detail you remember most clearly.',
            body: 'Una anécdota tiene tres cosas: un lugar, una persona, y un momento en que algo cambió. No necesitas saber qué significa todavía. / An anecdote has three things: a place, a person, and a moment when something shifted. You do not have to know what it means yet.',
            action: 'Escribe tres oraciones sobre ese momento. · Write three sentences about that moment.'
        },
        direct: {
            title: 'Tres específicos. · Three specifics.',
            body: 'Dónde estabas, quién estaba, y qué cambió. Primero la escena, después el significado. / Where you were, who was there, and what changed. Scene first, meaning later.',
            action: 'Escribe la escena sin detenerte. · Write the scene without stopping.'
        }
    },
    2: {
        gentle: {
            title: 'Tu experiencia puede ser evidencia. · Your experience can be evidence.',
            body: 'Pregúntate: ¿qué estaba pasando alrededor de este momento personal? ¿Qué fuerza más grande estaba en juego? / Ask: what was happening around this personal moment? What larger force was at work?',
            action: 'Escribe una oración que conecte tu momento con algo más grande. · Write one sentence connecting your moment to something larger.'
        },
        direct: {
            title: 'Nombra la fuerza. · Name the force.',
            body: 'Conecta el momento privado con el patrón público. / Connect the private moment to the public pattern.',
            action: 'Escribe: "Mi experiencia se conecta con ______ porque ______." · Write: "My experience connects to ______ because ______."'
        }
    },
    3: {
        gentle: {
            title: 'Una propuesta fuerte nombra la tensión. · A strong pitch names the tension.',
            body: 'No solo el tema — lo que tira en dos direcciones. Esa tensión es tu argumento. / Not just the topic — what pulls in two directions. That tension is your argument.',
            action: 'Completa: "Mi ensayo es sobre ______, y la tensión es ______." · Complete: "My essay is about ______, and the tension is ______."'
        },
        direct: {
            title: 'Define la tensión. · Define the tension.',
            body: 'Experiencia personal versus fuerza histórica. Esa brecha es tu argumento. / Personal experience vs. historical force. That gap is your argument.',
            action: 'Escribe la tensión en una oración. · Write the tension in one sentence.'
        }
    },
    4: {
        gentle: {
            title: 'La investigación profundiza tu historia. · Research deepens your story.',
            body: 'Una fuente debe ayudarte a entender tu historia más profundamente, no reemplazar lo que ya sabes. Tu experiencia es el punto de partida. / A source should help you understand your story more deeply, not replace what you already know. Your experience is the starting point.',
            action: 'Busca una fuente que contextualice tu experiencia. · Find one source that contextualizes your experience.'
        },
        direct: {
            title: 'Contextualiza, no valida. · Contextualize, do not validate.',
            body: 'La investigación profundiza tu historia; no le da credibilidad que tú no tengas. / Research deepens your story; it does not validate it.',
            action: 'Toma nota de una cita que conecte con tu historia. · Take notes on one citation that connects to your story.'
        }
    },
    5: {
        gentle: {
            title: 'El esquema es un mapa, no una jaula. · An outline is a map, not a cage.',
            body: 'Cada sección debe ayudar al lector a moverse de la experiencia al significado. Puedes cambiarlo mientras escribes. / Each section should help the reader move from experience to meaning. You can change it as you write.',
            action: 'Escribe un esquema de 5 secciones. Luego marca cuál es el punto de giro. · Write a 5-section outline. Then mark the turning point.'
        },
        direct: {
            title: 'Estructura con propósito. · Structure with purpose.',
            body: 'Escena → Puente → Contexto → Análisis → Conclusión. Cada sección gana la siguiente. / Scene → Bridge → Context → Analysis → Conclusion. Each section earns the next.',
            action: 'Escribe una oración sobre qué hace cada sección para el lector. · Write one sentence about what each section does for the reader.'
        }
    },
    6: {
        gentle: {
            title: 'Escribe sin parar. · Write without stopping.',
            body: 'No borres nada. El borrador no necesita ser bueno — necesita ser tuyo. / Do not delete anything. The draft does not need to be good — it needs to be yours.',
            action: 'Escribe durante 15 minutos sin detenerte. · Write for 15 minutes without stopping.'
        },
        direct: {
            title: 'Solo una regla: termina. · Only one rule: finish.',
            body: 'No edites. No borres. Termina el borrador primero. / Do not edit. Do not delete. Finish the draft first.',
            action: 'Escribe hasta el final. Luego guarda. · Write to the end. Then save.'
        }
    },
    7: {
        gentle: {
            title: 'La revisión protege tu voz. · Revision protects your voice.',
            body: 'No revises tu voz fuera del ensayo — revisa para que tu significado sea más claro. / Do not revise your voice out of the essay — revise to make your meaning clearer.',
            action: 'Elige una oración y pregúntate: ¿esto suena como yo? · Choose one sentence and ask: does this still sound like me?'
        },
        direct: {
            title: 'Claridad y argumento, no pulimento. · Clarity and argument, not polish.',
            body: 'Si un cambio debilita tu voz, recházalo. / If a change weakens your voice, reject it.',
            action: 'Revisa un párrafo. Conserva lo que es tuyo. · Revise one paragraph. Keep what is yours.'
        }
    },
    8: {
        gentle: {
            title: 'Pulir voz empieza con una oración. · Voice polish starts with one sentence.',
            body: 'Elige una oración o pasaje corto. Pregúntate si necesita claridad, especificidad o protección de voz. El coach sugiere una ruta — tú haces el cambio final. / Choose one sentence or short passage. Ask whether it needs clarity, specificity, or voice protection. The coach suggests a route — you make the final edit.',
            action: 'Elige una oración. Selecciona una ruta en la tarjeta de abajo. · Choose one sentence. Pick a route in the card below.'
        },
        direct: {
            title: 'Una oración. Una ruta. Tú decides. · One sentence. One route. You decide.',
            body: 'No revises todo a la vez. Elige una oración, nombra qué necesita, y haz el cambio tú mismo. / Do not revise everything at once. Choose one sentence, name what it needs, and make the change yourself.',
            action: 'Pega una oración en el chat con la ruta elegida. · Paste one sentence in the chat with your chosen route.'
        }
    },
    9: {
        gentle: {
            title: 'El checklist es tu pausa final. · The checklist is your final pause.',
            body: 'No es burocracia — es la oportunidad de asegurarte de que el trabajo que hiciste esté completo. Revisa el ensayo, el borrador guardado, las fuentes si las tienes, y las frases que protegiste. / It\'s not busywork — it\'s the chance to make sure the work you did is complete. Check the essay, the saved draft, any sources you have, and the phrases you protected.',
            action: 'Nombra un elemento del checklist que todavía necesitas verificar. · Name one checklist item you still need to verify.'
        },
        direct: {
            title: 'Verifica antes de continuar. · Verify before you continue.',
            body: 'Borrador guardado. Apertura con momento específico. Conexión nombrada. Fuentes revisadas. Voz revisada. Cinco elementos — y luego adelante. / Draft saved. Opening with specific moment. Connection named. Sources reviewed. Voice reviewed. Five items — and then move forward.',
            action: 'Confirma uno a uno. · Confirm one by one.'
        }
    }
};

function injectPanaHint(stageId) {
    const hint = PANA_HINTS[stageId];
    if (!hint) return;
    const h = hint[state.tone] || hint.gentle;
    const div = document.createElement('div');
    div.className = 'pana-hint guide-card';
    div.setAttribute('role', 'note');
    div.setAttribute('aria-label', 'Pana Hint — just-in-time writing guidance');
    div.innerHTML =
        `<span class="pana-hint-label">Pana Hint</span>` +
        `<div class="guide-card-title">${escapeHtml(h.title)}</div>` +
        `<div class="guide-card-body">${wrapBilingualHtml(h.body)}</div>` +
        `<div class="guide-card-action">${escapeHtml(h.action)}</div>`;
    D.chatMessages.appendChild(div);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
}

// ════════════════════════════════════════════════════════
//  REVISION PANEL — small vs big change categories
// ════════════════════════════════════════════════════════
const REVISION_SMALL = [
    'Try a different version of one sentence.',
    'Add one concrete detail — a name, a place, a date.',
    'Replace a vague word with a more specific one.',
    'Add one sensory detail to the anecdote.',
    'Add one transition between two ideas.',
    'Break one long sentence into two.',
    'Name who is speaking or acting more clearly.',
    'Add one sentence explaining why this moment matters.'
];
const REVISION_BIG = [
    'Reconsider the structure of this paragraph.',
    'Move this anecdote earlier or later.',
    'Add historical context before the analysis.',
    'Separate personal memory from historical explanation.',
    'Strengthen the connection between your story and the source.',
    'Rebuild the paragraph around one clearer main idea.',
    'Move from memory to context more gradually.'
];

function injectRevisionPanel(stageId) {
    // Don't inject a second panel if one already exists
    if (document.querySelector('.revision-panel')) return;

    const smallItems = REVISION_SMALL.map(ex =>
        `<button class="revision-example-btn" onclick="selectRevisionFocus(this,'small')" aria-pressed="false">${ex}</button>`
    ).join('');
    const bigItems = REVISION_BIG.map(ex =>
        `<button class="revision-example-btn" onclick="selectRevisionFocus(this,'big')" aria-pressed="false">${ex}</button>`
    ).join('');

    const panel = document.createElement('div');
    panel.className = 'revision-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Revision focus selector · selector de enfoque de revisión');
    panel.innerHTML = `
        <div class="revision-panel-title">Choose your revision focus · Elige tu enfoque</div>
        <p class="revision-panel-sub"><strong>Empieza con algo pequeño.</strong> Una oración, un detalle, una idea.<br><em style="color:var(--text-muted)">Start small. Revision means helping the reader hear your voice more clearly — not rewriting everything.</em></p>

        <div class="revision-category">
            <div class="revision-category-header small" role="heading" aria-level="3">
                <svg viewBox="0 0 16 16" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round" aria-hidden="true"><path d="M2 8l4 4 8-8"/></svg>
                Cambio pequeño · Small Change
                <span class="revision-category-toggle" aria-hidden="true">▾</span>
            </div>
            <div class="revision-examples" id="revSmallExamples" role="group" aria-label="Small change options">${smallItems}</div>
        </div>

        <div class="revision-category">
            <div class="revision-category-header big" onclick="toggleRevisionBig()" role="button" aria-expanded="false" aria-controls="revBigExamples" tabindex="0"
                onkeydown="if(event.key==='Enter'||event.key===' ')toggleRevisionBig()">
                <svg viewBox="0 0 16 16" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v6M5 8h6"/></svg>
                Cambio grande · Big Change
                <span style="font-size:0.72rem;font-weight:400;color:var(--text-muted);margin-left:4px;">(optional · opcional)</span>
                <span class="revision-category-toggle" id="revBigToggleIcon" aria-hidden="true">▸</span>
            </div>
            <div class="revision-examples hidden" id="revBigExamples" role="group" aria-label="Big change options">${bigItems}</div>
        </div>

        <p class="revision-panel-note">
            <strong>Un cambio grande es una opción, no una orden.</strong>
            Tu Pana shows you choices — you decide what your essay needs.
            <span style="display:block;margin-top:6px;color:var(--text-muted);font-style:italic;">No need to sound like a textbook wearing a blazer. Keep your voice, make the idea clearer.</span>
        </p>
    `;

    D.chatMessages.appendChild(panel);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
}

function toggleRevisionBig() {
    const examples = document.getElementById('revBigExamples');
    const icon     = document.getElementById('revBigToggleIcon');
    const header   = examples && examples.previousElementSibling;
    if (!examples) return;
    const hidden = examples.classList.toggle('hidden');
    if (icon)   icon.textContent = hidden ? '▸' : '▾';
    if (header) header.setAttribute('aria-expanded', hidden ? 'false' : 'true');
}

function selectRevisionFocus(btn, size) {
    // Toggle selected state on this button
    const alreadySelected = btn.classList.contains('selected');
    // Deselect all
    document.querySelectorAll('.revision-example-btn').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
    });
    if (!alreadySelected) {
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
        // Post the chosen focus as a user message so the AI coach knows
        const focusText = size === 'small'
            ? t(`Quiero hacer un cambio pequeño: ${btn.textContent} / I want to make a small change: ${btn.textContent}`,
                `Small change focus: ${btn.textContent}`)
            : t(`Quiero considerar un cambio grande: ${btn.textContent} / I want to consider a big change: ${btn.textContent}`,
                `Big change focus: ${btn.textContent}`);
        sendMsg(focusText);
    }
}

// ════════════════════════════════════════════════════════
//  STAGE 4 — RESEARCH GUIDANCE CARD
//  Clickable starters send a pre-formed question to the coach.
//  The coach can suggest search terms and source types but
//  must never invent sources or citations (enforced in system prompt).
// ════════════════════════════════════════════════════════
const RESEARCH_STRATEGIES = [
    { es: '¿Qué términos de búsqueda me recomiendas para mi tema?',
      en: 'What search terms do you recommend for my topic?' },
    { es: '¿Qué tipos de fuentes debo buscar para este ensayo?',
      en: 'What types of sources should I look for in this essay?' },
    { es: '¿Cómo sé si una fuente es confiable?',
      en: 'How can I tell if a source is credible?' },
    { es: '¿En qué base de datos debo buscar — JSTOR, ProQuest, Google Scholar?',
      en: 'Which database should I search — JSTOR, ProQuest, or Google Scholar?' },
];

function injectResearchCard() {
    if (document.querySelector('.research-card')) return;
    const items = RESEARCH_STRATEGIES.map(s =>
        `<button class="research-strategy-btn" onclick="useResearchStarter(this)" type="button" ` +
        `data-es="${escapeHtml(s.es)}" data-en="${escapeHtml(s.en)}" aria-pressed="false">` +
        `<span class="show-es">${escapeHtml(s.es)}</span>` +
        `<span class="lang-sep"> · </span>` +
        `<span class="show-en">${escapeHtml(s.en)}</span>` +
        `</button>`
    ).join('');

    const card = document.createElement('div');
    card.className = 'research-card';
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Guía de investigación · Research guidance');
    card.innerHTML =
        `<div class="research-card-title">Investigar con el coach · Researching with the coach</div>` +
        `<div class="research-guardrail" role="note">` +
            `<strong>El coach puede sugerir términos de búsqueda y tipos de fuentes — no puede inventar fuentes ni citas.</strong> ` +
            `Verifica siempre en las bases de datos de tu biblioteca o materiales aprobados por tu instructor. · ` +
            `The coach can suggest search terms and source types — but <strong>cannot invent sources or citations.</strong> ` +
            `Always verify through library databases or instructor-approved materials.` +
        `</div>` +
        `<div class="research-card-sub">Empieza por aquí — toca una pregunta · Start here — tap a question</div>` +
        `<div class="research-strategy-list">${items}</div>` +
        `<p class="research-card-note">Cuando encuentres una fuente, regresa y cuéntasela al coach. · When you find a source, come back and tell the coach what you found.</p>`;

    D.chatMessages.appendChild(card);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
}

function useResearchStarter(btn) {
    const alreadySelected = btn.classList.contains('selected');
    document.querySelectorAll('.research-strategy-btn').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
    });
    if (!alreadySelected) {
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
        const es = btn.dataset.es;
        const en = btn.dataset.en;
        const msg = state.lang === 'en' ? en : state.lang === 'es' ? es : `${es} · ${en}`;
        sendMsg(msg);
    }
}

// ════════════════════════════════════════════════════════
//  STAGE 8 — VOICE POLISH CARD
//  Step-by-step guided flow. Route buttons pre-fill the chat input
//  with a template so the student pastes their own sentence.
//  The protect route shows a Voice Vault how-to note instead.
//  Replaces the revision panel at Stage 8 to reduce clutter.
// ════════════════════════════════════════════════════════
const VOICE_POLISH_ROUTES = [
    { key: 'clearer',
      es: 'Quiero que esta oración sea más clara. Aquí está:',
      en: 'I want to make this sentence clearer. Here it is:' },
    { key: 'specific',
      es: 'Quiero añadir detalles más específicos. Aquí está mi oración:',
      en: 'I want to add more specific details. Here is my sentence:' },
    { key: 'voice',
      es: 'Quiero mantener mi voz aquí — que no pierda lo que es mío. Aquí está:',
      en: 'I want to keep my voice here — without losing what is mine. Here it is:' },
    { key: 'matters',
      es: '¿Por qué importa esta oración en mi ensayo? Aquí está:',
      en: 'Why does this sentence matter in my essay? Here it is:' },
    { key: 'protect', es: '', en: '' },
];

function injectVoicePolishCard() {
    if (document.querySelector('.voice-polish-card')) return;

    function vpBtn(route) {
        const r = VOICE_POLISH_ROUTES.find(x => x.key === route);
        const labels = {
            clearer:  { es: 'Que sea más clara',              en: 'Make it clearer' },
            specific: { es: 'Que sea más específica',          en: 'Make it more specific' },
            voice:    { es: 'Mantener mi voz',                 en: 'Keep my voice' },
            matters:  { es: '¿Por qué importa esta oración?', en: 'Ask why this matters' },
            protect:  { es: 'Proteger esta frase',             en: 'Protect this phrase' },
        };
        const lbl = labels[route];
        const extraCls = route === 'protect' ? ' vp-route-protect' : '';
        return `<button class="vp-route-btn${extraCls}" onclick="selectPolishRoute(this,'${route}')" ` +
            `type="button" data-es="${escapeHtml(r.es)}" data-en="${escapeHtml(r.en)}" aria-pressed="false">` +
            `<span class="show-es">${escapeHtml(lbl.es)}</span>` +
            `<span class="lang-sep"> · </span>` +
            `<span class="show-en">${escapeHtml(lbl.en)}</span>` +
            `</button>`;
    }

    const card = document.createElement('div');
    card.className = 'voice-polish-card';
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Guía de Pulir Voz · Voice Polish guide');
    card.innerHTML =
        `<div class="vp-card-title">` +
            `<span class="show-es">Cómo usar la Etapa de Pulir Voz</span>` +
            `<span class="lang-sep"> · </span>` +
            `<span class="show-en">How to use Voice Polish</span>` +
        `</div>` +
        `<ol class="vp-steps">` +
            `<li class="vp-step"><span class="vp-step-num">1</span><span>` +
                `<span class="show-es">Elige <strong>una oración o pasaje corto</strong> de tu borrador.</span>` +
                `<span class="lang-sep"> · </span>` +
                `<span class="show-en">Choose <strong>one sentence or short passage</strong> from your draft.</span>` +
            `</span></li>` +
            `<li class="vp-step"><span class="vp-step-num">2</span><span>` +
                `<span class="show-es">Elige qué tipo de ayuda necesitas (abajo).</span>` +
                `<span class="lang-sep"> · </span>` +
                `<span class="show-en">Choose what kind of help you need (below).</span>` +
            `</span></li>` +
            `<li class="vp-step"><span class="vp-step-num">3</span><span>` +
                `<span class="show-es">Pega tu oración en el chat y envíala al coach.</span>` +
                `<span class="lang-sep"> · </span>` +
                `<span class="show-en">Paste your sentence into the chat and send it to the coach.</span>` +
            `</span></li>` +
            `<li class="vp-step"><span class="vp-step-num">4</span><span>` +
                `<span class="show-es"><strong>Tú decides el cambio final.</strong> El coach no reescribe tu oración.</span>` +
                `<span class="lang-sep"> · </span>` +
                `<span class="show-en"><strong>You decide the final edit.</strong> The coach does not rewrite your sentence.</span>` +
            `</span></li>` +
        `</ol>` +
        `<div class="vp-routes-label">` +
            `<span class="show-es">¿Qué tipo de ayuda necesitas?</span>` +
            `<span class="lang-sep"> · </span>` +
            `<span class="show-en">What kind of help do you need?</span>` +
        `</div>` +
        `<div class="vp-routes">` +
            vpBtn('clearer') + vpBtn('specific') + vpBtn('voice') +
            vpBtn('matters') + vpBtn('protect') +
        `</div>` +
        `<p class="vp-guardrail">` +
            `<span class="show-es">El coach identifica posibilidades y sugiere rutas de revisión — no reescribe tu oración. Tú haces el cambio final.</span>` +
            `<span class="lang-sep"> · </span>` +
            `<span class="show-en">The coach identifies possibilities and suggests revision routes — it does not rewrite your sentence. You make the final edit.</span>` +
        `</p>`;

    D.chatMessages.appendChild(card);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
}

function selectPolishRoute(btn, route) {
    const alreadySelected = btn.classList.contains('selected');
    document.querySelectorAll('.vp-route-btn').forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
    });
    // Remove any existing protect note
    document.querySelector('.vp-protect-note')?.remove();

    if (alreadySelected && route === 'protect') return;

    btn.classList.add('selected');
    btn.setAttribute('aria-pressed', 'true');

    if (route === 'protect') {
        const note = document.createElement('p');
        note.className = 'vp-protect-note';
        note.innerHTML =
            `<span class="show-es"><strong>Para proteger una frase:</strong> selecciona texto en tu borrador (panel izquierdo), luego haz clic en <strong>Proteger</strong> en la barra de herramientas. La Bóveda de voz (debajo del borrador) confirma qué frases están protegidas.</span>` +
            `<span class="lang-sep"> · </span>` +
            `<span class="show-en"><strong>To protect a phrase:</strong> select text in your draft (left panel), then click <strong>Protect</strong> in the toolbar above the draft. The Voice Vault (below the draft) shows which phrases are protected.</span>`;
        btn.closest('.voice-polish-card').appendChild(note);
        return;
    }

    const es = btn.dataset.es;
    const en = btn.dataset.en;
    const template = state.lang === 'en' ? en : state.lang === 'es' ? es : `${es} / ${en}`;
    if (D.chatInput) {
        D.chatInput.value = template + ' ';
        D.chatInput.dispatchEvent(new Event('input'));
        D.chatInput.focus();
        const len = D.chatInput.value.length;
        D.chatInput.setSelectionRange(len, len);
    }
}

// ════════════════════════════════════════════════════════
//  DEMO MODE — pre-canned coaching responses per stage
//  Index 0 = stage intro (auto-sent on entry)
//  Index 1+ = follow-up replies to student messages
// ════════════════════════════════════════════════════════
const DEMO_RESPONSES = {
    1: [
        'Hola, bienvenido/a a Tu Pana de Escritura. Estoy aquí para acompañarte paso a paso.\n\nHi, welcome to Tu Pana de Escritura. I\'m here to support you step by step.\n\nEn la Etapa 1 tu trabajo es encontrar UN momento específico de tu vida — no toda una época, sino un instante concreto: un lugar, una persona, algo que pasó. ¿Qué momento viene a tu mente?\n\nIn Stage 1 your work is to find ONE specific moment from your life — not a whole era, but a concrete instant: a place, a person, something that happened. What moment comes to mind?',
        'Buen comienzo. Ese momento que nombraste — hay algo ahí.\n\nGood start. That moment you named — there\'s something there.\n\nPrueba esto: cierra los ojos y regresa a ese instante. ¿Dónde estabas exactamente? ¿Qué viste primero? Escribe ese primer detalle físico — un objeto, un color, un sonido. Un solo detalle cambia todo.\n\nTry this: close your eyes and return to that instant. Where were you exactly? What did you see first? Write that first physical detail — an object, a color, a sound. One detail changes everything.',
        '¿Hay algo en ese momento que nunca pudiste explicar del todo — algo que todavía no entiendes? Ese "algo inexplicable" suele ser exactamente hacia donde quiere ir el ensayo.\n\nIs there something about that moment you\'ve never been able to fully explain — something you still don\'t completely understand? That unexplained thing is often exactly where the essay wants to go.',
    ],
    2: [
        'Etapa 2 — Conexión. Tu historia personal no existe sola — está conectada a algo más grande.\n\nStage 2 — Connection. Your personal story doesn\'t exist alone — it\'s connected to something larger.\n\n¿Qué está pasando en tu comunidad, en tu historia familiar, o en el mundo que se relaciona con el momento que escribiste en la Etapa 1? Nombra esa conexión en una oración.\n\nWhat is happening in your community, your family history, or in the world that connects to the moment you wrote about in Stage 1? Name that connection in one sentence.',
        'Ese hilo entre lo personal y lo más grande — ese es el corazón del ensayo de géneros mixtos. No tienes que tener la respuesta completa todavía. Solo necesitas ver el hilo.\n\nThat thread between the personal and the larger issue — that is the heart of the mixed-genre essay. You don\'t need the full answer yet. You just need to see the thread.\n\n¿Cómo describirías esa conexión en una sola oración? Esa sería tu oración puente.\n\nHow would you describe that connection in one sentence? That would be your bridge sentence.',
        'La conexión no tiene que ser perfecta — tiene que ser honesta. ¿Qué hace que tu momento personal sea parte de algo más grande que solo tu historia?\n\nThe connection doesn\'t have to be perfect — it has to be honest. What makes your personal moment part of something larger than just your story?',
    ],
    3: [
        'Etapa 3 — Tu Pitch. Es momento de convertir tu momento y tu conexión en una propuesta concreta.\n\nStage 3 — Your Pitch. It\'s time to turn your moment and your connection into a concrete proposal.\n\nEscribe 4–6 oraciones que respondan: ¿de qué trata tu ensayo, de quién habla, qué tensión explora, y por qué importa? No tiene que ser perfecto — tiene que ser tuyo.\n\nWrite 4–6 sentences that answer: what is your essay about, whose story does it tell, what tension does it explore, and why does it matter? It doesn\'t have to be perfect — it has to be yours.',
        'Ese pitch que escribiste — ¿qué tensión nombra? Un pitch fuerte no solo presenta el tema: nombra lo que choca contra lo que. Esa tensión es el motor del ensayo.\n\nThat pitch you wrote — what tension does it name? A strong pitch doesn\'t just introduce the topic: it names what crashes against what. That tension is the engine of the essay.',
        '¿El pitch hace sentir al lector por qué esta historia importa ahora? Si el lector no sabe por qué importa tu historia, la conexión no ha llegado todavía.\n\nDoes the pitch make the reader feel why this story matters now? If the reader doesn\'t know why your story matters, the connection hasn\'t landed yet.',
    ],
    4: [
        'Etapa 4 — Investigación. Tu historia personal necesita contexto — y las fuentes te ayudan a encontrarlo.\n\nStage 4 — Research. Your personal story needs context — and sources help you find it.\n\nEl coach puede ayudarte a identificar términos de búsqueda, tipos de fuentes y cómo evaluar su credibilidad. Lo que el coach no puede hacer es inventar fuentes ni citas — siempre verifica en las bases de datos de tu biblioteca o materiales aprobados por tu instructor. Usa los botones de la tarjeta de investigación (arriba) para empezar.\n\nThe coach can help you identify search terms, source types, and how to evaluate credibility. What the coach cannot do is invent sources or citations — always verify through your library databases or instructor-approved materials. Use the buttons in the research card (above) to get started.',
        'Para encontrar fuentes útiles, empieza con los términos más específicos de tu historia — un lugar, un evento, una fecha, una comunidad. Cuanto más específico el término, más útil el resultado. Busca en JSTOR, ProQuest, o Google Scholar, y verifica que las fuentes sean académicas, periodísticas o documentales.\n\nTo find useful sources, start with the most specific terms from your story — a place, an event, a date, a community. The more specific the term, the more useful the result. Search in JSTOR, ProQuest, or Google Scholar, and verify that sources are academic, journalistic, or documentary.',
        'Cuando encuentres una fuente, cuéntame qué encontraste — el título, el autor, de qué trata. A partir de ahí puedo ayudarte a pensar cómo conectarla con tu historia. Recuerda: el coach no puede verificar ni inventar fuentes. Tú eres quien tiene acceso a las bases de datos.\n\nWhen you find a source, tell me what you found — the title, the author, what it\'s about. From there I can help you think about how to connect it to your story. Remember: the coach cannot verify or invent sources. You are the one with access to the databases.',
    ],
    5: [
        'Etapa 5 — Esquema. Has reunido mucho material. Ahora es momento de decidir cómo organizarlo.\n\nStage 5 — Outline. You\'ve gathered a lot of material. Now it\'s time to decide how to organize it.\n\nUn ensayo de géneros mixtos no sigue un esquema rígido — es más como una secuencia de piezas. ¿Cuál pieza de tu historia merece ir primero? ¿Qué necesita sentir el lector antes de entender lo que sigue?\n\nA mixed-genre essay doesn\'t follow a rigid outline — it\'s more like a sequence of pieces. Which piece of your story deserves to come first? What does the reader need to feel before they can understand what comes next?',
        'Cuando piensas en el final de tu ensayo, ¿qué quieres que el lector lleve consigo? Ese sentimiento o pensamiento final puede ayudarte a entender el arco de todo el ensayo.\n\nWhen you think about the end of your essay, what do you want the reader to carry with them? That final feeling or thought can help you understand the arc of the whole essay.',
        'La estructura también puede ser una pregunta: ¿en qué orden necesita el lector recibir las piezas para que el significado llegue con más fuerza?\n\nStructure can also be a question: in what order does the reader need to receive the pieces so that the meaning lands with the most force?',
    ],
    6: [
        'Etapa 6 — Borrador. Este es el momento central del proceso.\n\nStage 6 — Draft. This is the central moment of the process.\n\nTodo lo que has mapeado, nombrado y estructurado finalmente llega a la página. No necesita ser perfecto — necesita ser honesto. Cuando termines de escribir, guarda tu borrador con el botón Guardar.\n\nEverything you\'ve mapped, named, and structured finally hits the page. It doesn\'t need to be perfect — it needs to be honest. When you\'re done writing, save your draft with the Guardar button.',
        'Sigue escribiendo. No edites mientras escribes — eso es para después. Si te quedas atascado/a, escribe la parte que te parece más fácil, no la más importante. A veces el camino de entrada es una puerta lateral.\n\nKeep writing. Don\'t edit while you write — that comes later. If you get stuck, write the part that feels easiest, not most important. Sometimes the entry point is a side door.',
        'Recuerda: este es tu primer borrador. No tiene que ser el mejor — solo tiene que existir. La revisión viene después. Ahora mismo, solo escribe.\n\nRemember: this is your first draft. It doesn\'t have to be the best — it just has to exist. Revision comes later. Right now, just write.',
    ],
    7: [
        'Etapa 7 — Revisión Sustancial. La revisión no es corregir errores — es ver tu trabajo con ojos nuevos.\n\nStage 7 — Major Revision. Revision is not fixing mistakes — it\'s seeing your work with new eyes.\n\nPega una oración que quieras hacer más clara y dime: ¿qué estás *tratando* de decir con ella? Una vez que entienda tu intención, trabajamos para que la oración la refleje.\n\nPaste one sentence you want to make clearer and tell me: what are you *trying* to say with it? Once I understand your intention, we\'ll work to make the sentence match it.',
        'Eso que quieres decir — ¿hay una imagen, un ejemplo concreto, o una comparación que podría hacerlo más claro? La abstracción siempre se ancla mejor en lo específico.\n\nThat thing you\'re trying to say — is there an image, a concrete example, or a comparison that could make it clearer? Abstraction always lands better when anchored in the specific.',
        'Cuando revisas, hay dos preguntas que siempre vale la pena hacerse: ¿Es claro? ¿Es mío? La claridad sin voz no es suficiente.\n\nWhen revising, two questions are always worth asking: Is it clear? Is it mine? Clarity without voice isn\'t enough.',
    ],
    8: [
        'Etapa 8 — Pulir Voz. En esta etapa, el trabajo es de precisión: una oración a la vez.\n\nStage 8 — Voice Polish. In this stage, the work is precise: one sentence at a time.\n\nElige una oración o pasaje corto de tu borrador. Usa la tarjeta de Pulir Voz (arriba) para elegir qué tipo de ayuda necesitas: claridad, especificidad, protección de voz, o por qué importa esa oración. El coach sugiere una ruta — tú haces el cambio final. El coach no reescribe tu oración.\n\nChoose one sentence or short passage from your draft. Use the Voice Polish card (above) to choose what kind of help you need: clarity, specificity, voice protection, or why the sentence matters. The coach suggests a route — you make the final edit. The coach does not rewrite your sentence.',
        'Pega la oración que quieres trabajar — y dime qué ruta elegiste (más clara, más específica, mantener mi voz, o por qué importa). Eso me ayuda a responderte de manera útil sin reescribir lo que es tuyo.\n\nPaste the sentence you want to work on — and tell me which route you chose (clearer, more specific, keep my voice, or why it matters). That helps me respond usefully without rewriting what is yours.',
        'Si hay una frase que quieres proteger — algo que no debe cambiar porque es tuyo — selecciónala en el borrador y usa el botón Proteger en la barra de herramientas. La Bóveda de Voz (debajo del borrador) confirma qué está protegido.\n\nIf there\'s a phrase you want to protect — something that must not change because it\'s yours — select it in the draft and use the Protect button in the toolbar above the draft. The Voice Vault (below the draft) confirms what is protected.',
    ],
    9: [
        'Etapa 9 — Checklist. Esta es tu pausa final antes de completar el proceso.\n\nStage 9 — Checklist. This is your final pause before completing the process.\n\nRevisa: ¿Tienes guardado tu primer borrador? ¿Tu ensayo abre con un momento específico? ¿Incluye la conexión con algo más grande? ¿Revisaste tus fuentes y citas si se requieren? ¿Revisaste tu voz y las frases que protegiste? Si algo falta, este es el momento de atenderlo.\n\nCheck: Is your first draft saved? Does your essay open with a specific moment? Does it include the connection to something larger? Have you reviewed your sources and citations if required? Did you review your voice and the phrases you protected? If something is missing, this is the moment to address it.',
        'Dime qué revisaste y qué todavía necesitas verificar. El checklist no es para presionarte — es para asegurarte de que el trabajo que hiciste esté completo antes de llegar a la reflexión final.\n\nTell me what you\'ve checked and what you still need to verify. The checklist isn\'t to pressure you — it\'s to make sure the work you did is complete before you reach the final reflection.',
        'Si todo está en orden, estás listo/a para la Etapa 10 — tu cierre de proceso. Si algo necesita una última mirada, hazlo ahora. Una revisión final pequeña puede marcar la diferencia.\n\nIf everything is in order, you\'re ready for Stage 10 — your writing snapshot and process closure. If something needs one last look, do it now. One small final revision can make the difference.',
    ],
    10: [
        'Has llegado a la Etapa 10 — el Capstone. Eso no es poca cosa.\n\nYou\'ve reached Stage 10 — the Capstone. That is not a small thing.\n\nEmpezaste con un momento, y ahora tienes un borrador completo de un ensayo autobiográfico de géneros mixtos. Antes de completar el capstone, te pido una cosa: lee tu ensayo de principio a fin — no para corregir, sino para ser testigo de lo que creaste. Esta es tu historia, en tu voz.\n\nYou started with a moment, and now you have a complete draft of a mixed-genre autobiographical essay. Before completing the capstone, I ask one thing: read your essay from beginning to end — not to fix, but to witness what you created. This is your story, in your voice.',
        'Este ensayo es evidencia de que puedes hacer algo difícil: escribir desde la experiencia personal hacia el análisis, mantener tu voz mientras piensas críticamente, y usar herramientas de IA sin que la IA te use a ti.\n\nThis essay is evidence that you can do something hard: write from personal experience toward analysis, maintain your voice while thinking critically, and use AI tools without letting AI use you.',
    ],
};

// Tracks which follow-up response to deliver next, keyed by stage
const _demoIdx = {};

