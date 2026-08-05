/*
 * Tu Pana Writing Studio — interactive quick tour.
 *
 * A bounded, optional, ~60–90 second walkthrough of how the Studio supports
 * developing, reviewing, and revising the student's own writing.
 *
 * Isolation contract (enforced here and verified by studio_tour_test.mjs):
 *   - the tour never reads, writes, replaces, selects, or transmits the
 *     canonical draft or any real record (Move notes, Your Voice, Evidence,
 *     decisions, versions, reviews, Council reports, reflection, Finish);
 *   - every interaction runs against an explicitly labeled demonstration
 *     excerpt supplied by the active genre profile (`tourExample`);
 *   - all tour interaction state is in memory and is discarded when the tour
 *     closes; the only persisted value is this module's own preference record
 *     (a version plus dismissal/completion timestamps) under a separate key;
 *   - no network or AI request is made from any tour path — this file contains
 *     no fetch, no provider call, and no reference to the canonical state key.
 *
 * The tour is never required, never auto-opens twice, never interrupts a
 * returning writer who already has work, and is always replayable from Help.
 */
(function () {
    'use strict';

    const TOUR_KEY = 'tupana-studio:tour:v1';
    const TOUR_VERSION = 1;
    const TOTAL = 6;

    // ── Preference record (the only persisted value) ─────────────────────────
    function readPrefs() {
        try {
            const raw = localStorage.getItem(TOUR_KEY);
            if (!raw) return { v: TOUR_VERSION };
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : { v: TOUR_VERSION };
        } catch { return { v: TOUR_VERSION }; }
    }
    function writePrefs(patch) {
        try {
            localStorage.setItem(TOUR_KEY, JSON.stringify({ ...readPrefs(), v: TOUR_VERSION, ...patch }));
        } catch { /* a full or blocked store must never break the Studio */ }
    }
    function welcomeAnswered() {
        const prefs = readPrefs();
        return Boolean(prefs.dismissedAt || prefs.completedAt || prefs.startedAt);
    }

    // ── In-memory demonstration state (never persisted) ──────────────────────
    let demo = null;
    function resetDemo(origin) {
        demo = { moment: 1, origin, moveRevealed: false, kept: '', feedback: '', decision: '', compare: 'before' };
    }

    // The tour is opened either from the empty-desk welcome card or from Help.
    // Focus returns to whichever control started it; when a Help replay replaces
    // the Help dialog, the header Help button is that control.
    function restoreOriginFocus(origin) {
        if (origin !== 'help') return;
        requestAnimationFrame(() => {
            if (document.activeElement && document.activeElement !== document.body) return;
            document.querySelector('[data-action="help"]')?.focus();
        });
    }
    function active() { return demo !== null; }
    function endDemo() { demo = null; }

    // ── Bilingual helper: Spanish-primary pairing in `both` mode ─────────────
    function makeText(ctx) {
        return function pair(en, es) {
            if (ctx.lang() === 'en') return ctx.escape(en);
            if (ctx.lang() === 'es') return ctx.escape(es);
            return `<span lang="es">${ctx.escape(es)}</span><span lang="en" class="tour-en">${ctx.escape(en)}</span>`;
        };
    }
    // Buttons, tabs, and chips pair inline so bilingual mode stays compact; prose
    // keeps the stacked Spanish-primary pairing.
    function label(ctx, en, es) {
        return ctx.escape(plain(ctx, en, es));
    }
    function plain(ctx, en, es) {
        const lang = ctx.lang();
        if (lang === 'en') return en;
        if (lang === 'es') return es;
        return `${es} · ${en}`;
    }

    // ── Genre-supplied demonstration material ────────────────────────────────
    // Future genres supply their own `tourExample` through the profile; no tour
    // architecture change is needed. A genre without one gets neutral material,
    // and an unconfigured assignment gets no genre material at all.
    function example(ctx) {
        const genre = ctx.genre();
        if (!genre) return null;
        const source = genre.tourExample;
        if (!source) return null;
        const lang = ctx.lang() === 'en' ? 'en' : 'es';
        return {
            excerpt: source.excerpt[lang],
            phrase: source.phrase[lang],
            moveId: source.moveId,
            suggestion: source.suggestion[lang],
            before: source.before[lang],
            after: source.after[lang],
        };
    }

    // ── Moment content ───────────────────────────────────────────────────────
    function moments(ctx) {
        const text = makeText(ctx);
        const sample = example(ctx);
        const move = sample ? ctx.moveById(sample.moveId) : null;
        const moveLabel = move ? ctx.moveLabel(move) : '';
        const moveNudge = move ? ctx.moveNudge(move) : '';

        const demoNote = `<p class="tour-demo-label">${text(
            'Demonstration — not your writing. Nothing here is saved.',
            'Demostración — no es tu escritura. Nada de esto se guarda.')}</p>`;

        const excerptBlock = sample ? `<div class="tour-demo">${demoNote}<p class="tour-excerpt" id="tourExcerpt">${ctx.escape(sample.excerpt)}</p></div>` : '';

        return [
            {
                key: 'desk',
                title: text('Your draft stays at the center.', 'Tu borrador se queda en el centro.'),
                body: `<p>${text(
                    'Write in one continuous draft. Notes and feedback stay separate until you decide what belongs in it.',
                    'Escribe en un solo borrador continuo. Las notas y los comentarios se mantienen aparte hasta que decidas qué pertenece a él.')}</p>
                    ${excerptBlock}
                    <p class="tour-why">${text(
                        'Why this helps: keeping one draft visible makes it easier to stay oriented while ideas develop.',
                        'Por qué ayuda: mantener un solo borrador visible facilita orientarte mientras las ideas se desarrollan.')}</p>
                    <p class="tour-fact">${text(
                        'It saves in this browser as you type. Nothing is sent anywhere unless you ask.',
                        'Se guarda en este navegador mientras escribes. Nada se envía a menos que lo pidas.')}</p>`,
            },
            {
                key: 'moves',
                title: text('Moves offer a way into the work.', 'Las Movidas ofrecen una entrada al trabajo.'),
                body: `<p>${text(
                    'Moves help you notice what this kind of writing may need — without deciding your content.',
                    'Las Movidas te ayudan a notar qué puede necesitar este tipo de escritura, sin decidir tu contenido.')}</p>
                    ${move ? `<div class="tour-demo">${demoNote}
                        <article class="tour-move-card">
                            <strong>${ctx.escape(moveLabel)}</strong>
                            <span>${ctx.escape(moveNudge)}</span>
                            ${demo.moveRevealed
                                ? `<p class="tour-move-example">${text(
                                    'Name the moment, then the larger question it opens, then decide how much to say. The wording stays yours.',
                                    'Nombra el momento, luego la pregunta más amplia que abre, y luego decide cuánto contar. La redacción sigue siendo tuya.')}</p>`
                                : `<button class="button secondary" data-action="tour-reveal-move">${label(ctx, 'Show what this Move asks', 'Ver qué pide esta Movida')}</button>`}
                        </article></div>` : ''}
                    <p class="tour-why">${text(
                        'Why this helps: writers often make progress by focusing on one meaningful problem at a time.',
                        'Por qué ayuda: quien escribe suele avanzar concentrándose en un problema significativo a la vez.')}</p>
                    <p class="tour-fact">${text(
                        'A note you write here stays yours and never moves into your draft on its own.',
                        'La nota que escribas aquí sigue siendo tuya y nunca pasa sola a tu borrador.')}</p>`,
            },
            {
                key: 'voice',
                title: text('You decide what sounds like you.', 'Tú decides qué suena como tú.'),
                body: `<p>${text(
                    'Keep a phrase you are proud of so feedback does not quietly smooth it away.',
                    'Guarda una frase que te enorgullezca para que los comentarios no la suavicen en silencio.')}</p>
                    ${sample ? `<div class="tour-demo">${demoNote}
                        <p class="tour-excerpt" id="tourExcerpt" data-tour-selectable>${ctx.escape(sample.excerpt)}</p>
                        <p class="tour-hint">${text('Select a few words above, or use the suggested phrase.', 'Selecciona unas palabras arriba, o usa la frase sugerida.')}</p>
                        <div class="tour-actions-inline">
                            <button class="button secondary" data-action="tour-keep-selection" ${demo.kept ? 'disabled' : ''}>${label(ctx, 'Keep as my voice', 'Guardar como mi voz')}</button>
                            <button class="text-button" data-action="tour-keep-suggested">${label(ctx, 'Use the suggested phrase', 'Usar la frase sugerida')}</button>
                        </div>
                        ${demo.kept ? `<p class="tour-result">${text('Kept exactly as written:', 'Guardado exactamente como está escrito:')} <q>${ctx.escape(demo.kept)}</q></p>` : ''}
                    </div>` : ''}
                    <p class="tour-why">${text(
                        'Why this helps: revision can strengthen a draft while preserving language, perspective, and identity.',
                        'Por qué ayuda: revisar puede fortalecer un borrador conservando el idioma, la perspectiva y la identidad.')}</p>
                    <p class="tour-fact">${text(
                        'Tu Pana never judges which wording is authentic. Kept wording stays exact, on this device, and reaches AI only if you later choose to include it.',
                        'Tu Pana nunca juzga qué redacción es auténtica. Lo guardado queda exacto, en este dispositivo, y llega a la IA solo si luego eliges incluirlo.')}</p>`,
            },
            {
                key: 'feedback',
                title: text('Choose only the feedback you need.', 'Elige solo los comentarios que necesitas.'),
                body: `<p>${text(
                    'Ask one question, request one lens, invite several perspectives, or keep working without AI.',
                    'Haz una pregunta, pide una mirada, invita varias perspectivas, o sigue sin IA.')}</p>
                    <div class="tour-demo">${demoNote}
                    <div class="choice-stack tour-feedback-choices" role="group" aria-label="${ctx.escape(plain(ctx, 'Kinds of feedback', 'Tipos de comentarios'))}">
                        ${[['ask', label(ctx, 'Ask Tu Pana', 'Preguntar a Tu Pana'), text('For a specific question about a passage, paragraph, or draft.', 'Para una pregunta específica sobre un pasaje, párrafo o borrador.')],
                           ['focused', label(ctx, 'Focused review', 'Lectura enfocada'), text('For one careful lens, such as structure, evidence, or voice.', 'Para una sola mirada cuidadosa, como estructura, evidencia o voz.')],
                           ['council', label(ctx, 'The Council', 'El Consejo'), text('For several perspectives on a developed draft.', 'Para varias perspectivas sobre un borrador desarrollado.')]]
                            .map(([id, label, note]) => `<button class="radio-card ${demo.feedback === id ? 'selected' : ''}" data-action="tour-feedback" data-choice="${id}" aria-pressed="${demo.feedback === id}"><span><strong>${label}</strong><br><small>${note}</small></span></button>`).join('')}
                    </div>
                    ${demo.feedback ? `<p class="tour-result">${feedbackExplanation(ctx, text, demo.feedback)}</p>` : ''}
                    </div>
                    <p class="tour-why">${text(
                        'Why this helps: useful feedback depends on your purpose — not on asking for the largest possible review.',
                        'Por qué ayuda: los comentarios útiles dependen de tu propósito, no de pedir la revisión más grande posible.')}</p>
                    <p class="tour-fact">${text(
                        'Optional choices, not steps. Reviewing it yourself or using an instructor’s feedback are equally valid.',
                        'Opciones voluntarias, no pasos. Revisarlo por tu cuenta o usar comentarios de un instructor valen igual.')}</p>`,
            },
            {
                key: 'decide',
                title: text('Feedback becomes useful when you judge it.', 'Los comentarios se vuelven útiles cuando tú los evalúas.'),
                body: `<p>${text(
                    'Accept it, adapt it, reject it, or return later. Nothing changes your writing automatically.',
                    'Acéptalos, adáptalos, recházalos o vuelve después. Nada cambia tu escritura automáticamente.')}</p>
                    ${sample ? `<div class="tour-demo">${demoNote}
                        <blockquote class="tour-suggestion">${ctx.escape(sample.suggestion)}</blockquote>
                        <div class="tour-actions-inline" role="group" aria-label="${ctx.escape(plain(ctx, 'Your decision', 'Tu decisión'))}">
                            ${[['accept', label(ctx, 'Accept', 'Aceptar')], ['adapt', label(ctx, 'Adapt', 'Adaptar')], ['reject', label(ctx, 'Reject', 'Rechazar')], ['later', label(ctx, 'Decide later', 'Decidir después')]]
                                .map(([id, label]) => `<button class="button ${demo.decision === id ? 'secondary' : 'ghost'}" data-action="tour-decide" data-choice="${id}" aria-pressed="${demo.decision === id}">${label}</button>`).join('')}
                        </div>
                        ${demo.decision ? `<p class="tour-result">${text(
                            'Demonstration only — your draft is unchanged and nothing was recorded.',
                            'Solo demostración — tu borrador no cambió y no se registró nada.')}</p>` : ''}
                    </div>` : ''}
                    <p class="tour-why">${text(
                        'Why this helps: writers develop through decisions — not simply by collecting suggestions.',
                        'Por qué ayuda: quien escribe avanza por sus decisiones, no solo reuniendo sugerencias.')}</p>
                    <p class="tour-fact">${text(
                        'You can add a short reason in your own words. It belongs to your process, not to the AI.',
                        'Puedes añadir una razón breve con tus palabras. Pertenece a tu proceso, no a la IA.')}</p>`,
            },
            {
                key: 'revise',
                title: text('Writing grows through another look.', 'La escritura crece con una segunda mirada.'),
                body: `<p>${text(
                    'Save a review copy, revise what matters, compare, and finish when the writing is ready for its purpose.',
                    'Guarda una copia de revisión, revisa lo que importa, compara y finaliza cuando esté lista para su propósito.')}</p>
                    ${sample ? `<div class="tour-demo">${demoNote}
                        <div class="tour-compare-tabs" role="tablist" aria-label="${ctx.escape(plain(ctx, 'Compare', 'Comparar'))}">
                            <button role="tab" data-action="tour-compare" data-choice="before" aria-selected="${demo.compare === 'before'}">${label(ctx, 'Before', 'Antes')}</button>
                            <button role="tab" data-action="tour-compare" data-choice="after" aria-selected="${demo.compare === 'after'}">${label(ctx, 'Current', 'Actual')}</button>
                        </div>
                        <p class="tour-excerpt" role="tabpanel">${ctx.escape(demo.compare === 'before' ? sample.before : sample.after)}</p>
                        <p class="tour-hint">${text('No score or grade. You read the difference.', 'Sin puntuación ni calificación. Tú lees la diferencia.')}</p>
                    </div>` : ''}
                    <p class="tour-why">${text(
                        'Why this helps: one deliberate revision is usually worth more than endless rounds of feedback.',
                        'Por qué ayuda: una revisión deliberada suele valer más que rondas interminables de comentarios.')}</p>
                    <p class="tour-fact"><strong>${text('Tu Pana supports the process. You remain the writer.', 'Tu Pana acompaña el proceso. Tú sigues siendo quien escribe.')}</strong></p>`,
            },
        ];
    }

    function feedbackExplanation(ctx, text, choice) {
        if (choice === 'ask') return text(
            'In the Studio this would open a consent step showing the exact passage and your question before anything is sent.',
            'En el Studio esto abriría un paso de consentimiento que muestra el pasaje exacto y tu pregunta antes de enviar nada.');
        if (choice === 'focused') return text(
            'In the Studio you would pick one lens and see the exact text and lens before anything is sent.',
            'En el Studio elegirías una sola mirada y verías el texto exacto y la mirada antes de enviar nada.');
        return text(
            'In the Studio this would show the roles, the exact draft, and that it represents three reviewer readings plus one synthesis — and it takes longer.',
            'En el Studio esto mostraría los roles, el borrador exacto, y que representa tres lecturas más una síntesis — y toma más tiempo.');
    }

    // ── Welcome card (non-modal, empty state only) ───────────────────────────
    function shouldOfferWelcome(ctx) {
        return Boolean(ctx.genre()) && !ctx.hasWork() && !welcomeAnswered() && !active();
    }

    function welcomeCardHtml(ctx) {
        const text = makeText(ctx);
        return `<aside class="tour-welcome" aria-labelledby="tourWelcomeTitle">
            <div class="tour-welcome-copy">
                <strong id="tourWelcomeTitle">${text('Meet your writing desk', 'Conoce tu escritorio de escritura')}</strong>
                <span>${text(
                    'Take a one-minute tour of how Tu Pana helps you develop, review, and revise your own writing.',
                    'Haz un recorrido de un minuto por cómo Tu Pana te ayuda a desarrollar, revisar y mejorar tu propia escritura.')}</span>
            </div>
            <div class="tour-welcome-actions">
                <button class="button secondary" data-action="tour-start">${label(ctx, 'Take a quick tour', 'Hacer el recorrido')}</button>
                <button class="button ghost" data-action="tour-dismiss">${label(ctx, 'Not now', 'Ahora no')}</button>
            </div>
        </aside>`;
    }

    // ── Runtime ──────────────────────────────────────────────────────────────
    function start(ctx) {
        resetDemo(document.querySelector('.tour-welcome') ? 'welcome' : 'help');
        writePrefs({ startedAt: new Date().toISOString() });
        const text = makeText(ctx);
        if (!ctx.genre()) {
            // Unconfigured assignment: never borrow another genre's material.
            ctx.openDialog(
                plain(ctx, 'Quick tour', 'Recorrido rápido'),
                plain(ctx, 'Choose a writing project first', 'Elige primero un proyecto de escritura'),
                `<p>${text(
                    'The tour uses an example from your writing project, and this assignment is not configured yet. Choose a writing project in Settings, then start the tour from Help.',
                    'El recorrido usa un ejemplo de tu proyecto de escritura, y esta tarea todavía no está configurada. Elige un proyecto en Configuración y luego inicia el recorrido desde Ayuda.')}</p>`,
                `<button class="button ghost" data-action="close-dialog">${label(ctx, 'Close', 'Cerrar')}</button><button class="button primary" data-action="settings">${label(ctx, 'Open Settings', 'Abrir Configuración')}</button>`);
            endDemo();
            return;
        }
        ctx.openDialog(plain(ctx, 'Quick tour', 'Recorrido rápido'), plain(ctx, 'About one minute · leave whenever you like', 'Cerca de un minuto · sal cuando quieras'), '<div id="tourBody"></div>', '<div id="tourFooter"></div>', { wide: true });
        render(ctx, { focus: false });
    }

    function render(ctx, options = {}) {
        if (!active()) return;
        const text = makeText(ctx);
        const list = moments(ctx);
        const moment = list[demo.moment - 1];
        const body = document.getElementById('tourBody') || document.querySelector('.dialog-body');
        const footer = document.getElementById('tourFooter') || document.querySelector('.dialog-footer');
        if (!body) return;
        body.innerHTML = `<div class="tour-moment" data-moment="${moment.key}">
            <p class="tour-progress">${ctx.escape(plain(ctx, `${demo.moment} of ${TOTAL}`, `${demo.moment} de ${TOTAL}`))}</p>
            <h3 class="tour-title" id="tourMomentTitle" tabindex="-1">${moment.title}</h3>
            ${moment.body}
        </div>`;
        if (footer) {
            const last = demo.moment === TOTAL;
            footer.innerHTML = `<button class="button ghost" data-action="tour-skip">${label(ctx, 'Skip tour', 'Saltar recorrido')}</button>
                <div class="tour-nav">
                    <button class="button ghost" data-action="tour-back" ${demo.moment === 1 ? 'disabled' : ''}>← ${label(ctx, 'Back', 'Atrás')}</button>
                    ${last
                        ? `<button class="button secondary" data-action="tour-explore">${label(ctx, 'Explore on my own', 'Explorar por mi cuenta')}</button><button class="button primary" data-action="tour-write">${label(ctx, 'Start writing', 'Empezar a escribir')}</button>`
                        : `<button class="button primary" data-action="tour-next">${label(ctx, 'Next', 'Siguiente')} →</button>`}
                </div>`;
        }
        if (options.focus !== false) document.getElementById('tourMomentTitle')?.focus();
        ctx.announce(plain(ctx, `Step ${demo.moment} of ${TOTAL}`, `Paso ${demo.moment} de ${TOTAL}`));
    }

    function finish(ctx, mode) {
        writePrefs({ completedAt: new Date().toISOString(), lastExit: mode });
        const originAtExit = demo ? demo.origin : 'welcome';
        endDemo();
        // The welcome card is only present when the tour was started from the
        // empty desk. Re-render just in that case so the answered card leaves;
        // a Help-initiated replay keeps the dialog's own focus restoration.
        const origin = originAtExit;
        const cameFromWelcomeCard = origin === 'welcome' || Boolean(document.querySelector('.tour-welcome'));
        ctx.closeDialog(true);
        if (cameFromWelcomeCard) {
            ctx.rerender();
            ctx.focusEditor();
        } else if (mode === 'write') {
            ctx.focusEditor();
        } else {
            restoreOriginFocus(origin);
        }
    }

    // Every tour action is handled here; nothing else in the Studio changes.
    function handleAction(ctx, action, target) {
        switch (action) {
            case 'tour-start':
                start(ctx);
                return true;
            case 'tour-dismiss':
                writePrefs({ dismissedAt: new Date().toISOString() });
                ctx.rerender();
                ctx.focusEditor();
                ctx.announce(plain(ctx, 'Tour dismissed. You can start it later from Help.', 'Recorrido descartado. Puedes iniciarlo después desde Ayuda.'));
                return true;
            case 'tour-next':
                if (!active()) return true;
                demo.moment = Math.min(TOTAL, demo.moment + 1);
                render(ctx);
                return true;
            case 'tour-back':
                if (!active()) return true;
                demo.moment = Math.max(1, demo.moment - 1);
                render(ctx);
                return true;
            case 'tour-skip':
                finish(ctx, 'skip');
                return true;
            case 'tour-write':
                finish(ctx, 'write');
                return true;
            case 'tour-explore':
                finish(ctx, 'explore');
                return true;
            case 'tour-reveal-move':
                if (!active()) return true;
                demo.moveRevealed = true;
                render(ctx, { focus: false });
                return true;
            case 'tour-keep-selection': {
                if (!active()) return true;
                const sample = example(ctx);
                const selection = String(window.getSelection?.() || '').trim();
                const withinExcerpt = selection && sample && sample.excerpt.includes(selection);
                demo.kept = withinExcerpt ? selection : (sample ? sample.phrase : '');
                render(ctx, { focus: false });
                return true;
            }
            case 'tour-keep-suggested': {
                if (!active()) return true;
                const sample = example(ctx);
                demo.kept = sample ? sample.phrase : '';
                render(ctx, { focus: false });
                return true;
            }
            case 'tour-feedback':
                if (!active()) return true;
                demo.feedback = target.dataset.choice || '';
                render(ctx, { focus: false });
                return true;
            case 'tour-decide':
                if (!active()) return true;
                demo.decision = target.dataset.choice || '';
                render(ctx, { focus: false });
                return true;
            case 'tour-compare':
                if (!active()) return true;
                demo.compare = target.dataset.choice === 'after' ? 'after' : 'before';
                render(ctx, { focus: false });
                return true;
            default:
                return false;
        }
    }

    // Closing the dialog by any route (×, Escape, backdrop) ends the tour and
    // discards every demonstration value.
    function notifyDialogClosed() {
        if (!active()) return;
        const origin = demo.origin;
        endDemo();
        restoreOriginFocus(origin);
    }

    window.StudioTour = {
        TOUR_KEY, TOUR_VERSION, TOTAL,
        readPrefs, welcomeAnswered, shouldOfferWelcome, welcomeCardHtml,
        start, handleAction, notifyDialogClosed, isActive: active,
    };
}());
