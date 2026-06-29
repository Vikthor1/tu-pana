// Tu Pana de Escritura — prompts.js
// Coaching content: micro-prompts, stuck affirmations, pana hints, revision categories.
// Also includes the UI functions that display these prompts (showStuckMini, injectPanaHint, etc.).

// ════════════════════════════════════════════════════════
//  MICRO-PROMPTS — one tiny task + one sentence starter per stage
// ════════════════════════════════════════════════════════
// Stage A.2 / B3: bilingual { es, en } task + starter. showStuckMini() resolves by
// state.lang so a Spanish-mode student never gets English text inserted into the draft.
const MICRO_PROMPTS = {
    1: [
        { task: { es: 'Nombra un momento que recuerdas.', en: 'Name one moment you remember.' }, starter: { es: 'Recuerdo el momento en que…', en: 'I remember the moment when…' } },
        { task: { es: 'Empieza con un lugar.', en: 'Start with a place.' }, starter: { es: 'Esto pasó en…', en: 'This happened in…' } },
        { task: { es: 'Empieza con una persona.', en: 'Start with a person.' }, starter: { es: 'La persona que más recuerdo en esta historia es…', en: 'The person I remember most in this story is…' } },
        { task: { es: 'Empieza con un sentimiento.', en: 'Start with a feeling.' }, starter: { es: 'En ese momento, sentí…', en: 'At that moment, I felt…' } },
        { task: { es: 'Empieza con lo primero que notaste.', en: 'Start with what you noticed first.' }, starter: { es: 'Lo primero que noté fue…', en: 'The first thing I noticed was…' } },
        { task: { es: 'Empieza con lo que no entendiste.', en: 'Start with what you did not understand.' }, starter: { es: 'No entendía por qué…', en: 'I did not understand why…' } }
    ],
    2: [
        { task: { es: 'Nombra la parte de tu historia que entiendes mejor ahora.', en: 'Name the part of your story you understand best right now.' }, starter: { es: 'La parte de mi historia que entiendo mejor ahora es…', en: 'The part of my story I understand best right now is…' } },
        { task: { es: 'Nombra la parte que todavía necesitas descifrar.', en: 'Name the part you still need to figure out.' }, starter: { es: 'La parte que todavía necesito descifrar es…', en: 'The part I still need to figure out is…' } },
        { task: { es: 'Escribe una pregunta que tu ensayo podría explorar.', en: 'Write one question your essay might explore.' }, starter: { es: 'Una pregunta que mi ensayo podría explorar es…', en: 'One question my essay might explore is…' } }
    ],
    3: [
        { task: { es: 'Escribe de qué podría tratarse realmente esta historia.', en: 'Write what this story might really be about.' }, starter: { es: 'Esta historia podría tratar de…', en: 'This story might be about…' } },
        { task: { es: 'Nombra una tensión que notas en este recuerdo.', en: 'Name a tension you notice in this memory.' }, starter: { es: 'Una tensión que noto en este recuerdo es…', en: 'A tension I notice in this memory is…' } },
        { task: { es: 'Escribe la pregunta más grande escondida en este momento.', en: 'Write the bigger question hiding inside this moment.' }, starter: { es: 'La pregunta más grande detrás de este momento podría ser…', en: 'The bigger question behind this moment might be…' } },
        { task: { es: 'Nombra el lado personal y el lado del tema más amplio de tu pitch.', en: 'Name the personal side and the larger-issue side of your pitch.' }, starter: { es: 'El lado personal de mi ensayo es ___, y el tema más amplio es…', en: 'The personal side of my essay is ___, and the larger issue is…' } }
    ],
    4: [
        { task: { es: 'Nombra lo que pasaba alrededor de tu experiencia personal.', en: 'Name what was happening around your personal experience.' }, starter: { es: 'En la época en que pasó esto, mi comunidad también enfrentaba…', en: 'At the time this happened, my community was also dealing with…' } },
        { task: { es: 'Nombra un tema histórico más amplio conectado con este recuerdo.', en: 'Name a larger historical issue connected to this memory.' }, starter: { es: 'Un tema histórico más amplio conectado con este recuerdo es…', en: 'A larger historical issue connected to this memory is…' } },
        { task: { es: 'Escribe lo que un lector necesita saber para entender este momento.', en: 'Write what a reader needs to know to understand this moment.' }, starter: { es: 'Para entender este momento, un lector necesita saber…', en: 'To understand this moment, a reader needs to know…' } },
        { task: { es: 'Nombra una pregunta que quieres investigar.', en: 'Name a question you want to research.' }, starter: { es: 'Necesito una fuente que me ayude a entender…', en: 'I need a source that helps me understand…' } }
    ],
    5: [
        { task: { es: 'Escribe cómo podría empezar tu ensayo.', en: 'Write how your essay could begin.' }, starter: { es: 'Mi ensayo podría empezar con…', en: 'My essay could begin with…' } },
        { task: { es: 'Escribe lo que el lector necesita entender después de la anécdota.', en: 'Write what the reader needs to understand after the anecdote.' }, starter: { es: 'Después de la anécdota, el lector necesita entender…', en: 'After the anecdote, the reader needs to understand…' } },
        { task: { es: 'Nombra una sección en la que tu ensayo debería concentrarse.', en: 'Name one section your essay should focus on.' }, starter: { es: 'Una sección de mi ensayo debería concentrarse en…', en: 'One section of my essay should focus on…' } },
        { task: { es: 'Escribe cómo el final podría conectar de regreso.', en: 'Write how the ending might connect back.' }, starter: { es: 'El final podría regresar a…', en: 'The ending might return to…' } }
    ],
    6: [
        { task: { es: 'Escribe la siguiente parte de tu borrador — una oración.', en: 'Write the next part of your draft — one sentence.' }, starter: { es: 'La siguiente parte de mi borrador necesita explicar…', en: 'The next part of my draft needs to explain…' } },
        { task: { es: 'Nombra una idea que todavía no has desarrollado.', en: 'Name one idea you have not developed yet.' }, starter: { es: 'Una idea que todavía no he desarrollado es…', en: 'One idea I have not developed yet is…' } },
        { task: { es: 'Escribe lo que este párrafo intenta mostrar.', en: 'Write what this paragraph is trying to show.' }, starter: { es: 'Este párrafo intenta mostrar…', en: 'This paragraph is trying to show…' } },
        { task: { es: 'Conecta el recuerdo con el tema más amplio.', en: 'Connect the memory to the larger issue.' }, starter: { es: 'Puedo conectar este recuerdo con el tema más amplio mediante…', en: 'I can connect this memory to the larger issue by…' } }
    ],
    7: [
        { task: { es: 'Pega una oración que quieras hacer más clara.', en: 'Paste one sentence you want to make clearer.' }, starter: { es: 'Una oración que quiero hacer más clara es…', en: 'One sentence I want to make clearer is…' } },
        { task: { es: 'Nombra lo que haría más fuerte a este párrafo.', en: 'Name what this paragraph would be stronger if it had.' }, starter: { es: 'Este párrafo sería más fuerte si…', en: 'This paragraph would be stronger if…' } },
        { task: { es: 'Escribe la idea que quieres que el lector entienda.', en: 'Write the idea you want the reader to understand.' }, starter: { es: 'La idea que quiero que el lector entienda es…', en: 'The idea I want the reader to understand is…' } },
        { task: { es: 'Nombra lo que quieres proteger mientras revisas.', en: 'Name what you want to protect as you revise.' }, starter: { es: 'Quiero revisar sin perder…', en: 'I want to revise without losing…' } }
    ],
    8: [
        { task: { es: 'Nombra la oración que más quieres revisar.', en: 'Name the sentence you most want to revise.' }, starter: { es: 'Una oración que quiero hacer más clara es…', en: 'One sentence I want to make clearer is…' } },
        { task: { es: 'Describe lo que necesita el párrafo.', en: 'Describe what the paragraph needs.' }, starter: { es: 'Este párrafo sería más fuerte si…', en: 'This paragraph would be stronger if…' } },
        { task: { es: 'Escribe lo que quieres proteger.', en: 'Write what you want to protect.' }, starter: { es: 'Quiero mantener mi voz al…', en: 'I want to keep my voice by…' } }
    ],
    9: [
        { task: { es: 'Nombra algo que todavía necesitas revisar antes de la Etapa 10.', en: 'Name one item you still need to check before Stage 10.' }, starter: { es: 'Algo que todavía necesito revisar es…', en: 'One thing I still need to check is…' } },
        { task: { es: 'Confirma que tu primer borrador está guardado y completo.', en: 'Confirm your first draft is saved and complete.' }, starter: { es: 'Mi primer borrador está guardado y…', en: 'My first draft is saved and…' } },
        { task: { es: 'Verifica si tu ensayo incluye tanto un momento personal como una conexión más amplia.', en: 'Check whether your essay includes both a personal moment and a larger connection.' }, starter: { es: 'Mi ensayo incluye un momento personal y una conexión con…', en: 'My essay includes a personal moment and a connection to…' } },
        { task: { es: 'Nombra una parte de tu borrador que necesita una última mirada.', en: 'Name one part of your draft that needs one last look.' }, starter: { es: 'La parte de mi borrador que todavía necesita atención es…', en: 'The part of my draft that still needs attention is…' } }
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
    // Stage A.2 / B3: resolve language so a Spanish-mode student never gets English
    // text inserted into the draft. The instruction shows bilingually in 'both' mode;
    // the inserted starter is single-language (en→EN, es/both→ES, Spanish-primary).
    const _pickBoth    = o => state.lang === 'en' ? o.en : state.lang === 'es' ? o.es : `${o.es} · ${o.en}`;
    const _pickStarter = o => state.lang === 'en' ? o.en : o.es;
    const taskText     = _pickBoth(p.task);
    const starterText  = _pickStarter(p.starter);
    const aff   = STUCK_AFFIRMATIONS[Math.floor(Math.random() * STUCK_AFFIRMATIONS.length)];

    const card = document.createElement('div');
    card.className = 'stuck-mini';
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Stuck — tiny writing prompt · ayuda para escribir');
    card.innerHTML = `
        <div class="stuck-mini-affirmation" aria-live="polite">${aff}</div>
        <div class="stuck-mini-task">
            <strong>Tiny task · Tarea pequeña:</strong>
            ${taskText}
        </div>
        <div class="stuck-mini-starter">
            <span class="stuck-mini-starter-label">Sentence starter · Cómo empezar:</span>
            "${starterText}"
        </div>
        <div class="stuck-mini-actions">
            <button class="stuck-mini-primary" onclick="useStarter(this)" data-starter="${starterText.replace(/"/g,'&quot;')}"
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
            body: 'Elige una oración — no todo a la vez. La tarjeta de abajo te guía paso a paso. / Choose one sentence — not everything at once. The card below walks you through it.',
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
        state._reflectStage = 7; // milestone: revision focus chosen — next bot response shows checkpoint
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
            `<span class="show-es">Tu coach puede sugerir opciones, pero tú haces la edición final para que la oración siga sonando como tú.</span>` +
            `<span class="lang-sep"> · </span>` +
            `<span class="show-en">The coach can suggest options, but you make the final edit so the sentence still sounds like you.</span>` +
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
    state._reflectStage = 8; // milestone: voice-polish route active — next bot response shows checkpoint
}

// ════════════════════════════════════════════════════════
//  STAGE ENTRY MESSAGES — one-time canned welcome per stage
//  Format: "Spanish sentence.\nEnglish sentence." (wrapBilingualHtml splits on \n)
//  Injected by injectStageEntryWelcome() in ui.js with msgType 'stage-intro'.
// ════════════════════════════════════════════════════════
const STAGE_ENTRY_MESSAGES = {
    1: 'Tu Pana hace preguntas para ayudarte a escribir desde tus propias ideas — no escribe el ensayo por ti. Eso es lo que lo hace diferente.\n\nEmpieza con una escena específica — un lugar, una persona, un momento que recuerdas bien.\n\nTu Pana asks questions to help you write from your own ideas — it does not write the essay for you. That is what makes it different.\n\nStart with a specific scene: a place, a person, a moment you remember clearly.',
    2: 'Conecta tu anécdota con algo más grande — escribe una oración que nombre la fuerza o el patrón detrás de tu historia.\nConnect your anecdote to something larger — write one sentence naming the force or pattern behind your story.',
    3: 'Define la tensión de tu argumento: ¿qué tira en dos direcciones en tu historia?\nDefine the tension in your argument: what pulls in two directions in your story?',
    4: 'Busca una fuente que contextualice tu experiencia — no para reemplazarla, sino para profundizarla.\nFind one source that contextualizes your experience — not to replace it, but to deepen it.',
    5: 'Traza el mapa de cómo tu ensayo pasa de la anécdota al argumento — puedes cambiarlo mientras escribes.\nOutline how your essay moves from anecdote to argument — you can change it as you write.',
    6: 'Este es tu borrador: lo escribes tú, sin el coach. No tiene que ser perfecto — solo tiene que ser tuyo. Escribe sin detenerte.\n\nThis is your draft: you write it, without the coach. It does not need to be perfect — it just needs to be yours. Write without stopping.\n\n(Opcional: si una etapa anterior quedó incompleta, puedes volver y usar la opción de importar para traer tus partes más fuertes. · Optional: if an earlier stage feels unfinished, you can go back and use import to bring your strongest pieces forward.)',
    7: 'Revisa para hacer tu argumento más claro, sin borrarte de la página — elige una oración y empieza ahí.\nRevise to make your argument clearer without erasing yourself — choose one sentence and start there.',
    8: 'Elige una oración de tu borrador y decide qué tipo de ayuda necesita: claridad, especificidad o protección de voz.\nChoose one sentence from your draft and decide what kind of help it needs: clarity, specificity, or voice protection.',
    9: 'Antes de avanzar, confirma que tu borrador está guardado y que tu ensayo incluye un momento personal y una conexión más amplia.\nBefore you move on, confirm your draft is saved and your essay includes a personal moment and a larger connection.',
   10: 'Nombra lo que cambió en tu proceso: qué mejoró, qué protegiste, qué todavía necesita atención.\nName what changed in your process: what improved, what you protected, and what still needs attention.'
};
