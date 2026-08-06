/*
 * Tu Pana Writing Studio — Guided Discovery.
 *
 * An optional, choice-driven conversation with the Studio's companion. It
 * replaces the six-moment Quick Tour it grew out of: there is exactly one
 * onboarding experience, entered from the empty-desk welcome card or from Help.
 *
 * Shape: Tu Pana offers one short message at a time; the student answers by
 * tapping one of two or three prewritten replies. No typing is ever required.
 * A reply changes the route, the example, the ordering, or the depth — and
 * there is no wrong answer. Branches stay shallow and reconnect.
 *
 * Live annotated previews are rendered by the REAL Studio panel renderers
 * (ctx.preview → studio-ui renderTourPreview) from synthetic data, so a preview
 * cannot drift from the application. Every preview surface is inert: the
 * renderer's `data-action` attributes are renamed and its controls disabled
 * before the markup reaches this module. Demonstration actions are the tour's
 * own controls, rendered outside the preview surface.
 *
 * Isolation contract (enforced here, verified by studio_tour_test.mjs):
 *   - never reads, writes, replaces, selects, or transmits the canonical draft
 *     or any real record (Move notes, Your Voice, Evidence, decisions,
 *     versions, reviews, Council reports, reflection, Finish);
 *   - every example is synthetic and supplied by the active genre profile;
 *   - all conversation state is in memory and discarded when the tour closes;
 *     the only persisted value is this module's own preference record (a
 *     version plus dismissal/start/completion timestamps) under a separate key;
 *   - no network or AI request is made from any path — this file contains no
 *     fetch, no provider call, and no reference to the canonical state key;
 *   - no analytics or behavioral telemetry of any kind is collected.
 *
 * The conversation is never required, never auto-opens twice, never interrupts
 * a returning writer who already has work, and is always replayable from Help.
 */
(function () {
    'use strict';

    const TOUR_KEY = 'tupana-studio:tour:v1';
    const TOUR_VERSION = 2;

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
    // Version-agnostic on purpose: a student who already answered an earlier
    // onboarding version is not asked again by a later one.
    function welcomeAnswered() {
        const prefs = readPrefs();
        return Boolean(prefs.dismissedAt || prefs.completedAt || prefs.startedAt);
    }

    // ── Conversational pacing ────────────────────────────────────────────────
    // A response group is revealed one beat at a time rather than all at once.
    // Two rules bound it: at most AUTO_LIMIT messages arrive on their own after a
    // single student choice, and the explanation that follows a live preview
    // always waits for the student. Everything past that is the student's pace.
    const COMPOSING_MIN = 420;
    const COMPOSING_MAX = 680;
    const AUTO_LIMIT = 3;

    // Deterministic, never deceptive: the pause length is derived from the
    // message about to arrive (longer message, slightly longer pause), clamped to
    // the messaging-interface range. No randomness, so tests are reproducible.
    function composingDelay(turn) {
        if (prefersReducedMotion()) return 0;
        const scratch = document.createElement('div');
        scratch.innerHTML = turn && turn.html ? turn.html : '';
        const words = scratch.textContent.trim().split(/\s+/).filter(Boolean).length;
        return Math.min(COMPOSING_MAX, COMPOSING_MIN + Math.min(words, 40) * 6);
    }

    // ── In-memory conversation state (never persisted) ───────────────────────
    let demo = null;
    let revealTimer = null;
    // Bumped whenever the conversation's identity changes — Back, Start over,
    // Skip, Exit, close, language, genre. A scheduled reveal captures the value
    // it was queued under and abandons itself if it no longer matches, so no
    // stale message can arrive after the thing it belonged to is gone.
    let generation = 0;

    function resetDemo(origin) {
        generation += 1;
        demo = {
            origin,
            beat: 'open',
            route: null,
            turns: [],
            seen: {},
            concern: null,
            feedback: null,
            decision: null,
            voiceKept: false,
            compare: 'before',
            evidenceFocus: null,
            history: [],
            // reveal state
            queue: [],
            composing: false,
            gate: null,
            autoCount: 0,
            focusPending: false,
            // scroll orientation
            stick: true,
            unreadBelow: false,
            // environment the transcript was written in
            lang: null,
            genreId: null,
        };
    }
    function active() { return demo !== null; }
    function invalidatePending() {
        generation += 1;
        clearTimeout(revealTimer);
        revealTimer = null;
        if (demo) { demo.queue = []; demo.composing = false; demo.gate = null; }
    }
    function endDemo() {
        invalidatePending();
        demo = null;
    }

    // Snapshot for Back. Turns are plain strings; a shallow copy with a copied
    // turn list is a complete restore point.
    function snapshot() {
        const { history, ...rest } = demo;
        return { ...rest, turns: demo.turns.slice(), seen: { ...demo.seen } };
    }

    // Leaving the conversation must never drop a keyboard user on <body>. The
    // control that opened it is the right place to land — except for the
    // first-run welcome, which no longer exists once the tour has started, so
    // the writing surface it handed over to takes the focus instead.
    function restoreOriginFocus(origin) {
        requestAnimationFrame(() => {
            if (document.activeElement && document.activeElement !== document.body) return;
            if (origin === 'help') { document.querySelector('[data-action="help"]')?.focus(); return; }
            if (origin === 'welcome') {
                const editor = document.getElementById('draftEditor');
                if (editor) { editor.focus({ preventScroll: true }); return; }
                document.querySelector('[data-action="help"]')?.focus();
            }
        });
    }

    // ── Bilingual helpers ────────────────────────────────────────────────────
    // Prose pairs Spanish-primary and stacked in `both` mode. Short lines —
    // quips, captions, control labels — pair inline so bilingual mode never
    // becomes a wall of doubled text.
    function makeText(ctx) {
        return function pair(en, es) {
            if (ctx.lang() === 'en') return ctx.escape(en);
            if (ctx.lang() === 'es') return ctx.escape(es);
            return `<span lang="es">${ctx.escape(es)}</span><span lang="en" class="tour-en">${ctx.escape(en)}</span>`;
        };
    }
    function inline(ctx, en, es) {
        if (ctx.lang() === 'en') return ctx.escape(en);
        if (ctx.lang() === 'es') return ctx.escape(es);
        return `<span lang="es">${ctx.escape(es)}</span><span lang="en" class="tour-en inline">${ctx.escape(en)}</span>`;
    }
    function label(ctx, en, es) { return ctx.escape(plain(ctx, en, es)); }
    function plain(ctx, en, es) {
        const lang = ctx.lang();
        if (lang === 'en') return en;
        if (lang === 'es') return es;
        return `${es} · ${en}`;
    }
    function pick(ctx, bundle) {
        if (!bundle) return '';
        return ctx.lang() === 'en' ? bundle.en : bundle.es;
    }

    // ── Genre-supplied material ──────────────────────────────────────────────
    function genreData(ctx) {
        const genre = ctx.genre();
        if (!genre) return null;
        const source = genre.tourExample;
        const discovery = genre.discovery;
        if (!source || !discovery) return null;
        const lang = ctx.lang() === 'en' ? 'en' : 'es';
        return {
            excerpt: source.excerpt[lang],
            phrase: source.phrase[lang],
            moveId: source.moveId,
            suggestion: source.suggestion[lang],
            before: source.before[lang],
            after: source.after[lang],
            quip: discovery.openingQuip,
            concerns: discovery.concerns,
            moveNote: discovery.moveNote,
            voiceReason: discovery.voiceReason,
            decisionRationale: discovery.decisionRationale,
        };
    }

    // ── Message and preview construction ─────────────────────────────────────
    function panaTurn(html, options = {}) {
        return { who: 'pana', html, kind: options.kind || 'say' };
    }
    function meTurn(html) { return { who: 'me', html, kind: 'say' }; }

    function demoLabel(ctx) {
        const text = makeText(ctx);
        return text('Sample — not your writing. Nothing here is saved.',
            'Muestra — no es tu escritura. Nada de esto se guarda.');
    }

    // A live annotated preview. `kind` and `seed` are handed straight to the
    // real panel renderer; the markup that comes back is already inert.
    function previewTurn(ctx, kind, seed, caption, srText) {
        const markup = ctx.preview ? ctx.preview(kind, seed) : '';
        if (!markup) return null;
        const id = `gdPreview-${kind}`;
        return panaTurn(`<figure class="gd-preview" data-preview="${ctx.escape(kind)}">
            <figcaption class="gd-preview-head">
                <span class="gd-preview-badge">${label(ctx, 'Sample', 'Muestra')}</span>
                <span class="gd-preview-caption">${caption}</span>
            </figcaption>
            <p class="sr-only" id="${id}Desc">${srText}</p>
            <div class="gd-preview-surface" data-preview-surface>${markup}</div>
            <button class="text-button gd-preview-expand" data-action="gd-expand" aria-describedby="${id}Desc">${label(ctx, 'Enlarge this sample', 'Ampliar esta muestra')}</button>
        </figure>`, { kind: 'preview' });
    }

    function excerptTurn(ctx, body, extra = '') {
        return panaTurn(`<div class="gd-demo">
            <p class="gd-demo-label">${demoLabel(ctx)}</p>
            ${body}${extra}
        </div>`, { kind: 'demo' });
    }

    // ═════════════════════════════════════════════════════════════════════════
    //  The conversation
    // ═════════════════════════════════════════════════════════════════════════
    // Each beat returns the companion turns to append and the replies to offer.
    // `next` names the following beat; side effects are recorded on `demo`.

    function beat(ctx, id) {
        const text = makeText(ctx);
        const data = genreData(ctx);
        const genreName = ctx.genreLabel ? ctx.genreLabel() : '';

        if (id === 'open') {
            return {
                chapter: plain(ctx, 'Hello', 'Hola'),
                turns: [
                    panaTurn(`<p>${text(
                        `Hola. I’m Tu Pana — your writing companion for your ${genreName.toLowerCase()}. One thing first, because it is the whole point: I don’t write your draft. You do. I ask questions, point at what is working, and stay out of your sentences.`,
                        `Hola. Soy Tu Pana, tu compañero de escritura para tu ${genreName.toLowerCase()}. Lo primero, porque es lo esencial: yo no escribo tu borrador. Lo escribes tú. Yo hago preguntas, señalo lo que funciona y me mantengo fuera de tus oraciones.`)}</p>`),
                    panaTurn(`<p class="gd-quip">${inline(ctx, data.quip.en, data.quip.es)}</p>`, { kind: 'quip' }),
                    panaTurn(`<p>${text(
                        'Where do you want to start? No typing — just tap. And there is no wrong answer.',
                        '¿Por dónde quieres empezar? Sin escribir nada, solo toca. Y no hay respuesta incorrecta.')}</p>`),
                ],
                choices: [
                    { id: 'start', label: plain(ctx, 'Help me get started.', 'Ayúdame a empezar.'), next: 'moves-ask', route: 'start' },
                    { id: 'feedback', label: plain(ctx, 'Show me how feedback works.', 'Muéstrame cómo funcionan los comentarios.'), next: 'feedback-ask', route: 'feedback' },
                    { id: 'control', label: plain(ctx, 'Show me how I stay in control.', 'Muéstrame cómo mantengo el control.'), next: 'voice-ask', route: 'control' },
                ],
            };
        }

        // ── Moves ────────────────────────────────────────────────────────────
        if (id === 'moves-ask') {
            return {
                chapter: plain(ctx, 'Starting', 'Empezar'),
                turns: [panaTurn(`<p>${text(
                    'What usually makes starting difficult?',
                    '¿Qué suele hacer difícil el empezar?')}</p>`)],
                choices: data.concerns.map(concern => ({
                    id: concern.id,
                    label: plain(ctx, concern.en, concern.es),
                    next: 'moves-preview',
                    concern: concern.id,
                    reply: `<p>${text(concern.replyEn, concern.replyEs)}</p>`,
                })),
            };
        }

        if (id === 'moves-preview') {
            const concern = data.concerns.find(item => item.id === demo.concern) || data.concerns[0];
            const move = ctx.moveById(concern.moveId);
            const turns = [
                panaTurn(`<p>${text(
                    'This is the real Moves panel, filled with sample material so you can see what it looks like in use:',
                    'Este es el panel de Movidas real, con material de muestra para que veas cómo se ve en uso:')}</p>`),
            ];
            const preview = previewTurn(ctx, 'moves',
                { moveNote: pick(ctx, data.moveNote) },
                text('The Moves panel for this project, with one note already written.',
                    'El panel de Movidas de este proyecto, con una nota ya escrita.'),
                text('A sample Moves panel listing this project’s optional Moves. Each Move has a short nudge, an expandable explanation, an optional example structure, and a button for writing your own note. One sample note is filled in.',
                    'Un panel de Movidas de muestra con las Movidas opcionales de este proyecto. Cada Movida tiene un empujón breve, una explicación desplegable, una estructura de ejemplo opcional y un botón para escribir tu propia nota. Hay una nota de muestra llena.'));
            if (preview) turns.push(preview);
            turns.push(panaTurn(`<p class="gd-quip">${inline(ctx,
                'A Move is a nudge, not homework wearing a tiny hat.',
                'Una Movida es un empujoncito, no una tarea disfrazada.')}</p>`, { kind: 'quip' }));
            turns.push(panaTurn(`<p>${text(
                `${move ? `“${ctx.moveLabel(move)}” is the one that fits what you just told me. ` : ''}Moves are optional. Open one when you want a way in, ignore them when you don’t. The example inside shows a structure — never prose to copy.`,
                `${move ? `«${ctx.moveLabel(move)}» es la que encaja con lo que me acabas de decir. ` : ''}Las Movidas son opcionales. Abre una cuando quieras una entrada; ignóralas cuando no. El ejemplo de adentro muestra una estructura, nunca prosa para copiar.`)}</p>`));
            // Deliberately plain: this beat already carries a humorous line, and
            // two quips in one exchange breaks the rhythm the tone review asks for.
            turns.push(panaTurn(`<p>${text(
                'Anything you write in a Move note stays in the note. It never moves into your draft on its own.',
                'Lo que escribas en una nota de Movida se queda en la nota. Nunca pasa sola a tu borrador.')}</p>`));
            return { chapter: plain(ctx, 'Moves', 'Movidas'), turns, choices: nextAfterPillar(ctx, 'moves') };
        }

        // ── Your Voice ───────────────────────────────────────────────────────
        if (id === 'voice-ask') {
            return {
                chapter: plain(ctx, 'Your Voice', 'Tu voz'),
                turns: [
                    panaTurn(`<p>${text(
                        'Here is a line from a sample draft. Not yours — nothing in this conversation touches your writing.',
                        'Aquí hay una línea de un borrador de muestra. No es tuyo: nada en esta conversación toca tu escritura.')}</p>`),
                    excerptTurn(ctx, `<p class="tour-excerpt">${ctx.escape(data.excerpt)}</p>`),
                    panaTurn(`<p>${text(
                        'When a phrase in your own draft matters to you, you can keep it. You choose it — I never guess which words are “really you.”',
                        'Cuando una frase de tu borrador te importa, puedes conservarla. Tú la eliges: yo nunca adivino qué palabras son «realmente tuyas».')}</p>`),
                ],
                choices: [
                    { id: 'keep', label: plain(ctx, `Keep “${data.phrase}”`, `Conservar «${data.phrase}»`), next: 'voice-preview', voiceKept: true },
                    { id: 'why', label: plain(ctx, 'Why would I need that?', '¿Para qué me sirve eso?'), next: 'voice-preview', voiceKept: true,
                      reply: `<p>${text(
                        'Because revision advice is general and your wording is not. Keeping a phrase is a reminder to you, and a constraint on any review you ask for later.',
                        'Porque los consejos de revisión son generales y tus palabras no. Conservar una frase es un recordatorio para ti y un límite para cualquier revisión que pidas después.')}</p>` },
                ],
            };
        }

        if (id === 'voice-preview') {
            const turns = [];
            const preview = previewTurn(ctx, 'voice',
                { voice: { text: data.phrase, reason: pick(ctx, data.voiceReason) } },
                text('Your Voice, holding one kept phrase and the writer’s own reason.',
                    'Tu voz, con una frase conservada y la razón de quien escribe.'),
                text('A sample Your Voice list containing one entry: the exact phrase the writer kept, and a short reason in the writer’s own words.',
                    'Una lista de muestra de Tu voz con una entrada: la frase exacta que conservó quien escribe y una razón breve en sus propias palabras.'));
            if (preview) turns.push(preview);
            turns.push(panaTurn(`<p class="gd-quip">${inline(ctx,
                'Revision is useful. Bulldozing the sentences you love is not.',
                'Revisar es útil. Arrasar con las frases que quieres, no.')}</p>`, { kind: 'quip' }));
            turns.push(panaTurn(`<p>${text(
                'It stays exactly as you wrote it, on this device. It reaches the AI only if you later choose to include it — and you see the exact text before anything goes.',
                'Se queda exactamente como la escribiste, en este dispositivo. Llega a la IA solo si después eliges incluirla, y ves el texto exacto antes de que salga nada.')}</p>`));
            return { chapter: plain(ctx, 'Your Voice', 'Tu voz'), turns, choices: nextAfterPillar(ctx, 'voice') };
        }

        // ── Review Center ────────────────────────────────────────────────────
        if (id === 'feedback-ask') {
            return {
                chapter: plain(ctx, 'Feedback', 'Comentarios'),
                turns: [panaTurn(`<p>${text(
                    'What kind of help would you want from a writing coach?',
                    '¿Qué tipo de ayuda querrías de alguien que te acompaña a escribir?')}</p>`)],
                choices: [
                    { id: 'ask', next: 'feedback-preview', feedback: 'ask',
                      label: plain(ctx, 'One answer about a specific passage.', 'Una respuesta sobre un pasaje específico.') },
                    { id: 'focused', next: 'feedback-preview', feedback: 'focused',
                      label: plain(ctx, 'One careful look at a particular problem.', 'Una mirada cuidadosa a un problema concreto.') },
                    { id: 'council', next: 'feedback-preview', feedback: 'council',
                      label: plain(ctx, 'Several perspectives on a whole draft.', 'Varias perspectivas sobre un borrador completo.') },
                ],
            };
        }

        if (id === 'feedback-preview') {
            const choice = demo.feedback || 'ask';
            const councilOn = ctx.councilAvailable ? ctx.councilAvailable() : true;
            const turns = [panaTurn(`<p>${text(
                'All of those live in one place. This is the real Review Center:',
                'Todo eso vive en un solo lugar. Este es el Centro de revisión real:')}</p>`)];
            const preview = previewTurn(ctx, 'review',
                { draft: data.excerpt, review: { lens: pick(ctx, { en: 'Structure and evidence', es: 'Estructura y evidencia' }), scope: pick(ctx, { en: 'one paragraph', es: 'un párrafo' }) } },
                text('The Review Center, with one saved report already in it.',
                    'El Centro de revisión, con un informe guardado.'),
                text('A sample Review Center panel offering Ask Tu Pana, a focused review, the Council where the project supports it, and saved reports.',
                    'Un panel de muestra del Centro de revisión con Preguntar a Tu Pana, una lectura enfocada, el Consejo cuando el proyecto lo permite, e informes guardados.'));
            if (preview) turns.push(preview);
            turns.push(panaTurn(`<p>${matchExplanation(ctx, text, choice, councilOn)}</p>`));
            if (choice === 'council' && councilOn) {
                turns.push(panaTurn(`<p class="gd-quip">${inline(ctx,
                    'Think roundtable, not courtroom. You still make the decision.',
                    'Piensa en mesa redonda, no en tribunal. La decisión sigue siendo tuya.')}</p>`, { kind: 'quip' }));
            } else if (choice === 'focused') {
                turns.push(panaTurn(`<p class="gd-quip">${inline(ctx,
                    'One lens, one purpose — no feedback avalanche.',
                    'Una lente, un propósito. Sin avalancha de comentarios.')}</p>`, { kind: 'quip' }));
            }
            turns.push(panaTurn(`<p>${text(
                'These are choices, not stages. Reviewing it yourself or taking your instructor’s feedback counts just as much. And nothing leaves this device until you have seen the exact text being sent and said yes.',
                'Son opciones, no etapas. Revisarlo por tu cuenta o usar los comentarios de tu instructor/a vale igual. Y nada sale de este dispositivo hasta que veas el texto exacto que se envía y digas que sí.')}</p>`));
            turns.push(panaTurn(`<p>${text(
                'Saved reports reopen any time without asking the AI again.',
                'Los informes guardados se vuelven a abrir cuando quieras sin volver a consultar a la IA.')}</p>`));
            return { chapter: plain(ctx, 'Review Center', 'Centro de revisión'), turns, choices: nextAfterPillar(ctx, 'feedback') };
        }

        // ── Judging one recommendation (shared spine) ────────────────────────
        if (id === 'decide') {
            return {
                chapter: plain(ctx, 'Your call', 'Tú decides'),
                turns: [
                    panaTurn(`<p>${text(
                        'Say a review came back with this:',
                        'Digamos que una revisión te devuelve esto:')}</p>`),
                    excerptTurn(ctx, `<blockquote class="gd-suggestion">${ctx.escape(data.suggestion)}</blockquote>`),
                    panaTurn(`<p>${text(
                        'Three moves. None of them is wrong:',
                        'Tres jugadas. Ninguna es incorrecta:')}</p>`),
                ],
                choices: [
                    { id: 'accept', label: plain(ctx, 'Accept it.', 'Aceptarlo.'), next: 'decide-reply', decision: 'accept' },
                    { id: 'adapt', label: plain(ctx, 'Adapt it — my way.', 'Adaptarlo a mi manera.'), next: 'decide-reply', decision: 'adapt' },
                    { id: 'reject', label: plain(ctx, 'Reject it.', 'Rechazarlo.'), next: 'decide-reply', decision: 'reject' },
                ],
            };
        }

        if (id === 'decide-reply') {
            const turns = [panaTurn(`<p>${decisionReply(ctx, text, demo.decision)}</p>`)];
            turns.push(panaTurn(`<p>${text(
                'Either way, nothing changed your draft on its own, and nothing was sent anywhere. What gets recorded is your decision — and a reason, if you want to add one in your own words.',
                'En todo caso, nada cambió tu borrador por su cuenta y nada se envió a ningún lado. Lo que queda registrado es tu decisión, y una razón si quieres añadirla con tus palabras.')}</p>`));
            return { chapter: plain(ctx, 'Your call', 'Tú decides'), turns, choices: [
                { id: 'go-revise', label: plain(ctx, 'Then what?', '¿Y después?'), next: 'revise' },
            ] };
        }

        // ── Revision ─────────────────────────────────────────────────────────
        if (id === 'revise') {
            const showing = demo.compare === 'after' ? data.after : data.before;
            const turns = [
                panaTurn(`<p>${text(
                    'When you want a second look, you save a review copy — an exact local copy — and keep writing. Nothing is locked.',
                    'Cuando quieras una segunda mirada, guardas una copia de revisión —una copia local exacta— y sigues escribiendo. Nada queda cerrado.')}</p>`),
            ];
            const preview = previewTurn(ctx, 'copies',
                { reviewCopy: data.excerpt },
                text('A saved review copy, exactly as the Studio records it.',
                    'Una copia de revisión guardada, tal como la registra el Studio.'),
                text('A sample review-copy record showing when it was saved, its word count, and buttons for viewing the exact text or comparing it with the current draft.',
                    'Un registro de muestra de copia de revisión con la fecha de guardado, el conteo de palabras y botones para ver el texto exacto o compararlo con el borrador actual.'));
            if (preview) turns.push(preview);
            turns.push(excerptTurn(ctx, `<div class="gd-compare">
                <div class="gd-compare-tabs" role="tablist" aria-label="${ctx.escape(plain(ctx, 'Compare', 'Comparar'))}">
                    <button role="tab" data-action="gd-compare" data-choice="before" aria-selected="${demo.compare === 'before'}">${label(ctx, 'Earlier', 'Antes')}</button>
                    <button role="tab" data-action="gd-compare" data-choice="after" aria-selected="${demo.compare === 'after'}">${label(ctx, 'Current', 'Actual')}</button>
                </div>
                <p class="tour-excerpt" role="tabpanel">${ctx.escape(showing)}</p>
            </div>`));
            // Not "on trial": the Council beat already uses a courtroom contrast,
            // and the same register twice in one conversation reads as a bit.
            turns.push(panaTurn(`<p class="gd-quip">${inline(ctx,
                'The earlier draft is not the villain here. It is just where you were standing.',
                'El borrador anterior no es el villano. Es simplemente donde estabas parado/a.')}</p>`, { kind: 'quip' }));
            turns.push(panaTurn(`<p>${text(
                'No score, no grade, no percentage pretending to measure the improvement. You read the difference and decide what it means.',
                'Sin puntaje, sin calificación, sin porcentaje que finja medir la mejora. Tú lees la diferencia y decides qué significa.')}</p>`));
            return { chapter: plain(ctx, 'Revision', 'Revisión'), turns, choices: [
                { id: 'onward', label: plain(ctx, 'Got it.', 'Entendido.'), next: 'offer' },
            ] };
        }

        // ── Optional depth ───────────────────────────────────────────────────
        if (id === 'offer') {
            const optional = [];
            if (!demo.seen.evidence) {
                optional.push({ id: 'evidence', label: plain(ctx, 'What does the Studio remember?', '¿Qué recuerda el Studio?'), next: 'evidence-ask' });
            }
            if (!demo.seen.moves) {
                optional.push({ id: 'moves', label: plain(ctx, 'Show me how to start a draft.', 'Muéstrame cómo empezar un borrador.'), next: 'moves-ask' });
            }
            if (!demo.seen.feedback) {
                optional.push({ id: 'feedback', label: plain(ctx, 'Show me how feedback works.', 'Muéstrame cómo funcionan los comentarios.'), next: 'feedback-ask' });
            }
            if (!demo.seen.voice) {
                optional.push({ id: 'voice', label: plain(ctx, 'How do I protect my wording?', '¿Cómo protejo mis palabras?'), next: 'voice-ask' });
            }
            // Leaving is always offered and is always last: at most two curiosity
            // branches are shown, so "I'm ready to write" can never be crowded out.
            const choices = optional.slice(0, 2).concat([
                { id: 'ready', label: plain(ctx, 'I’m ready to write.', 'Estoy listo/a para escribir.'), next: 'close' },
            ]);
            return {
                chapter: plain(ctx, 'Anything else', 'Algo más'),
                turns: [panaTurn(`<p>${text(
                    'That is the loop: notice something, ask for what you need, judge the answer, revise on purpose. Want one more thing, or are you ready to write?',
                    'Ese es el ciclo: notar algo, pedir lo que necesitas, evaluar la respuesta y revisar a propósito. ¿Quieres ver algo más o ya estás listo/a para escribir?')}</p>`)],
                choices,
            };
        }

        if (id === 'evidence-ask') {
            return {
                chapter: plain(ctx, 'Evidence', 'Evidencia'),
                turns: [panaTurn(`<p>${text(
                    'Want to see what the Studio keeps for you?',
                    '¿Quieres ver qué guarda el Studio para ti?')}</p>`)],
                choices: [
                    { id: 'voice', next: 'evidence-preview', evidenceFocus: 'voice',
                      label: plain(ctx, 'My strongest wording.', 'Mis mejores palabras.') },
                    { id: 'decisions', next: 'evidence-preview', evidenceFocus: 'decisions',
                      label: plain(ctx, 'Decisions I made about feedback.', 'Las decisiones que tomé sobre los comentarios.') },
                    { id: 'copies', next: 'evidence-preview', evidenceFocus: 'copies',
                      label: plain(ctx, 'How my draft changed.', 'Cómo cambió mi borrador.') },
                ],
            };
        }

        if (id === 'evidence-preview') {
            const focus = demo.evidenceFocus || 'voice';
            const turns = [];
            const preview = previewTurn(ctx, 'evidence',
                {
                    draft: data.excerpt,
                    moveNote: pick(ctx, data.moveNote),
                    voice: { text: data.phrase, reason: pick(ctx, data.voiceReason) },
                    decision: {
                        choice: 'adapt',
                        label: plain(ctx, 'Adapted', 'Adaptado'),
                        suggestion: data.suggestion,
                        rationale: pick(ctx, data.decisionRationale),
                    },
                    reviewCopy: data.excerpt,
                },
                text('Evidence, holding a Move note, a kept phrase, one decision, and a review copy.',
                    'Evidencia, con una nota de Movida, una frase conservada, una decisión y una copia de revisión.'),
                text('A sample Evidence panel listing a Move note with content, a Your Voice entry, a saved draft snapshot, and one feedback decision with the writer’s own reason.',
                    'Un panel de muestra de Evidencia con una nota de Movida con contenido, una entrada de Tu voz, una instantánea guardada del borrador y una decisión con la razón de quien escribe.'));
            if (preview) turns.push(preview);
            turns.push(panaTurn(`<p>${evidenceFocusLine(ctx, text, focus)}</p>`));
            turns.push(panaTurn(`<p class="gd-quip">${inline(ctx,
                'Receipts for your thinking — not grades wearing a disguise.',
                'Recibos de tu pensamiento, no calificaciones disfrazadas.')}</p>`, { kind: 'quip' }));
            turns.push(panaTurn(`<p>${text(
                'It is a record of choices you made. Not a score, not a completion meter, and not something watching you. It grows from your writing, not from walking around the Studio.',
                'Es un registro de las decisiones que tomaste. No es un puntaje, ni un medidor de avance, ni algo que te vigila. Crece con tu escritura, no con pasear por el Studio.')}</p>`));
            demo.seen.evidence = true;
            return { chapter: plain(ctx, 'Evidence', 'Evidencia'), turns, choices: [
                { id: 'onward', label: plain(ctx, 'Makes sense.', 'Tiene sentido.'), next: 'offer' },
            ] };
        }

        // ── Close ────────────────────────────────────────────────────────────
        if (id === 'close') {
            return {
                chapter: plain(ctx, 'Ready', 'Listo'),
                turns: [
                    panaTurn(`<p>${text(
                        'Quick map before you go. Your draft takes the big space. Beside it — below it on a phone — one column holds Moves, the Review Center, and Evidence, in that order. Across the top: Current Draft, Process Reflection, Finish. That is the whole place.',
                        'Un mapa rápido antes de irte. Tu borrador ocupa el espacio grande. Al lado —debajo en el teléfono— una columna tiene las Movidas, el Centro de revisión y la Evidencia, en ese orden. Arriba: Borrador actual, Reflexión del proceso y Finalizar. Ese es todo el lugar.')}</p>`),
                    panaTurn(`<p>${text(
                        'Strong writing grows through choices — what to develop, what feedback to use, what to protect, what to revise. Tu Pana helps you practice those choices. The writing stays yours.',
                        'La escritura fuerte crece con decisiones: qué desarrollar, qué comentarios usar, qué proteger y qué revisar. Tu Pana te ayuda a practicar esas decisiones. La escritura sigue siendo tuya.')}</p>`),
                    panaTurn(`<p class="gd-quip">${inline(ctx,
                        'The blank page has been acting dramatic this whole time. You know where to begin now.',
                        'La página en blanco lleva todo este rato haciendo drama. Ya sabes por dónde empezar.')}</p>`, { kind: 'quip' }),
                ],
                choices: [],
                final: true,
            };
        }

        return null;
    }

    // After a pillar, the conversation always rejoins the shared spine on its
    // first pass, and returns to the "anything else" offer afterwards.
    function nextAfterPillar(ctx, pillar) {
        demo.seen[pillar] = true;
        const spineDone = demo.seen.decide;
        return [{
            id: 'continue',
            label: spineDone
                ? plain(ctx, 'Good. What else?', 'Bien. ¿Qué más?')
                : plain(ctx, 'Okay — what happens next?', 'Bien, ¿y qué pasa después?'),
            next: spineDone ? 'offer' : 'decide',
        }];
    }

    function matchExplanation(ctx, text, choice, councilOn) {
        if (choice === 'ask') return text(
            'That is Ask Tu Pana — one question about a passage, a paragraph, or the whole draft. Fastest of the three, and the most specific.',
            'Eso es Preguntar a Tu Pana: una pregunta sobre un pasaje, un párrafo o el borrador completo. Es la más rápida de las tres y la más específica.');
        if (choice === 'focused') return text(
            'That is a focused review — one lens you choose, such as structure, evidence, or voice. Narrower than the Council, deeper than a single question.',
            'Eso es una lectura enfocada: una sola lente que tú eliges, como estructura, evidencia o voz. Más estrecha que el Consejo y más honda que una pregunta suelta.');
        if (!councilOn) return text(
            'That would be the Council — but it is not configured for this kind of writing, so the Studio says so plainly instead of pretending. A focused review, or your instructor’s disciplinary feedback, does that work here.',
            'Eso sería el Consejo, pero no está configurado para este tipo de escritura, así que el Studio lo dice claramente en vez de fingir. Una lectura enfocada, o los comentarios de tu instructor/a, hacen ese trabajo aquí.');
        return text(
            'That is the Council — three readers plus one synthesis, each with a different job. It takes longer than the others, because it is gathering several perspectives rather than one. When the readers disagree, the disagreement comes to you as a question instead of a fake consensus.',
            'Eso es el Consejo: tres lecturas más una síntesis, cada una con su tarea. Tarda más que las otras porque reúne varias perspectivas en lugar de una. Cuando las lecturas no coinciden, el desacuerdo llega a ti como pregunta, no como un consenso fingido.');
    }

    function decisionReply(ctx, text, decision) {
        if (decision === 'accept') return text(
            'Straightforward. You would revise along that line — and you write the new sentence. I never hand you replacement prose.',
            'Directo. Revisarías en esa dirección, y la oración nueva la escribes tú. Yo nunca te entrego prosa de reemplazo.');
        if (decision === 'reject') return text(
            'Completely allowed, and recorded as a real decision rather than a skipped task. Sometimes the advice is wrong, or the line matters for a reason a reader cannot see yet.',
            'Totalmente válido, y queda registrado como una decisión real, no como una tarea saltada. A veces el consejo se equivoca, o la línea importa por una razón que quien lee todavía no ve.');
        return text(
            'Often the strongest move. Take the direction, leave the framing, make the sentence yours.',
            'Muchas veces es la mejor jugada: tomas la dirección, dejas el envoltorio y haces tuya la oración.');
    }

    function evidenceFocusLine(ctx, text, focus) {
        if (focus === 'decisions') return text(
            'Your decisions are in there — what you accepted, adapted, or rejected, with any reason you added in your own words.',
            'Tus decisiones están ahí: qué aceptaste, adaptaste o rechazaste, con la razón que hayas añadido con tus palabras.');
        if (focus === 'copies') return text(
            'Your saved copies are in there — the exact earlier text, so you can see what actually changed.',
            'Tus copias guardadas están ahí: el texto anterior exacto, para que veas qué cambió de verdad.');
        return text(
            'Your kept wording is in there — exactly as you wrote it, with nothing inferred about what it means.',
            'Tus palabras conservadas están ahí, exactamente como las escribiste, sin inferir nada sobre lo que significan.');
    }

    // ── First contact ────────────────────────────────────────────────────────
    //
    // Two different people arrive at an unanswered onboarding state, and they
    // must not be treated the same way.
    //
    // A genuinely NEW writer — a configured project, an empty workspace, no
    // answer recorded — meets a calm welcome before the Desk's full choice
    // architecture, offering Guided Discovery first and the Desk immediately.
    // It is a surface, not a gate: no modal, nothing blocked, and the secondary
    // action goes straight to work.
    //
    // An EXISTING writer whose workspace predates this flag gets no such thing.
    // Their draft, notes, evidence, versions, or imported work are already
    // there, and interrupting them merely because a preference key is missing
    // would be indefensible. They get the quiet, dismissible invitation instead.
    //
    // Onboarding state is INTERFACE PREFERENCE. It lives in its own key beside
    // the Studio record, never inside it, and is never process evidence or
    // student work.
    function shouldOfferFirstRun(ctx) {
        return Boolean(ctx.genre()) && !ctx.hasWork() && !welcomeAnswered() && !active();
    }
    function shouldOfferWelcome(ctx) {
        return Boolean(ctx.genre()) && ctx.hasWork() && !welcomeAnswered() && !active();
    }

    function firstRunHtml(ctx) {
        const text = makeText(ctx);
        return `<section class="first-run" aria-labelledby="firstRunTitle">
            <div class="first-run-card">
                <div class="first-run-mark" aria-hidden="true">${ctx.avatar ? ctx.avatar() : ''}</div>
                <h2 id="firstRunTitle">${text('Welcome to your Writing Studio', 'Bienvenido/a a tu Writing Studio')}</h2>
                <p class="first-run-project">${ctx.escape(ctx.genreLabel())}</p>
                <p class="first-run-lead">${text(
                    'This is where your writing lives — one draft, with help beside it when you want it. Tu Pana can show you around first, or you can start writing right now.',
                    'Aquí vive tu escritura — un solo borrador, con ayuda al lado cuando la quieras. Tu Pana puede mostrarte el lugar primero, o puedes empezar a escribir ahora mismo.')}</p>
                <div class="first-run-actions">
                    <button class="button primary" data-action="tour-start">${label(ctx, 'Show me around', 'Muéstrame el lugar')}</button>
                    <button class="button secondary" data-action="tour-dismiss">${label(ctx, 'Go straight to my Desk', 'Ir directo a mi Escritorio')}</button>
                </div>
                <p class="first-run-note">${text(
                    'A short conversation, no typing, and you can leave at any point. It uses examples, never your writing. You can start it again whenever you like from Help.',
                    'Una conversación corta, sin escribir nada, y puedes salir en cualquier momento. Usa ejemplos, nunca tu escritura. Puedes volver a empezarla cuando quieras desde Ayuda.')}</p>
            </div>
        </section>`;
    }

    function welcomeCardHtml(ctx) {
        const text = makeText(ctx);
        return `<aside class="tour-welcome" aria-labelledby="tourWelcomeTitle">
            <div class="tour-welcome-copy">
                <strong id="tourWelcomeTitle">${text('Want Tu Pana to show you around?', '¿Quieres que Tu Pana te muestre el lugar?')}</strong>
                <span>${text(
                    'A short conversation about how this works. No typing — and you can leave the moment you would rather write.',
                    'Una conversación corta sobre cómo funciona esto. Sin escribir nada, y puedes salir en cuanto prefieras escribir.')}</span>
            </div>
            <div class="tour-welcome-actions">
                <button class="button secondary" data-action="tour-start">${label(ctx, 'Show me around', 'Muéstrame el lugar')}</button>
                <button class="button ghost" data-action="tour-dismiss">${label(ctx, 'Not now', 'Ahora no')}</button>
            </div>
        </aside>`;
    }

    // ── Runtime ──────────────────────────────────────────────────────────────
    function start(ctx) {
        const fromWelcome = Boolean(document.querySelector('.tour-welcome') || document.querySelector('.first-run'));
        resetDemo(fromWelcome ? 'welcome' : 'help');
        writePrefs({ startedAt: new Date().toISOString() });
        // Starting IS the answer, so the surface underneath the conversation
        // becomes the Desk immediately. Without this the first-run welcome stays
        // rendered behind the dialog and is what the writer lands back on when
        // they leave — which would read as the tour having refused to let go.
        if (fromWelcome) ctx.rerender();
        const text = makeText(ctx);
        if (!ctx.genre() || !genreData(ctx)) {
            // Unconfigured assignment: never borrow another genre's material.
            ctx.openDialog(
                plain(ctx, 'Guided Discovery', 'Recorrido guiado'),
                plain(ctx, 'Choose a writing project first', 'Elige primero un proyecto de escritura'),
                `<p>${text(
                    'This conversation uses examples from your writing project, and this assignment is not configured yet. Choose a writing project in Settings, then start it again from Help.',
                    'Esta conversación usa ejemplos de tu proyecto de escritura, y esta tarea todavía no está configurada. Elige un proyecto en Configuración y vuelve a empezar desde Ayuda.')}</p>`,
                `<button class="button ghost" data-action="close-dialog">${label(ctx, 'Close', 'Cerrar')}</button><button class="button primary" data-action="settings">${label(ctx, 'Open Settings', 'Abrir Configuración')}</button>`);
            endDemo();
            return;
        }
        ctx.openDialog(
            plain(ctx, 'Guided Discovery', 'Recorrido guiado'),
            plain(ctx, 'A short conversation · leave whenever you like', 'Una conversación corta · sal cuando quieras'),
            '<div id="tourBody"></div>', '<div id="tourFooter"></div>', { wide: true });
        demo.lang = ctx.lang();
        demo.genreId = currentGenreId(ctx);
        // Opening the conversation is itself a deliberate action, so focus may
        // land on the first reply once the opening group has finished arriving.
        demo.focusPending = true;
        enterBeat(ctx, 'open', { announce: false });
    }

    // A live preview is a conversational event of its own. Whatever explains it
    // must not land on top of it: the student decides when that arrives.
    function markGates(turns) {
        let afterPreview = false;
        turns.forEach(turn => {
            if (afterPreview) { turn.gateBefore = 'preview'; afterPreview = false; }
            if (turn.kind === 'preview') afterPreview = true;
        });
        return turns;
    }

    // Append a beat's turns through the reveal queue and offer its replies once
    // the group has finished arriving. `beatStart` remembers where this beat's
    // turns begin so an in-beat control (the comparison tabs) can re-render them
    // in place instead of appending a duplicate stretch.
    function enterBeat(ctx, id, options = {}) {
        const next = beat(ctx, id);
        if (!next) return;
        demo.beat = id;
        demo.beatStart = demo.turns.length;
        demo.chapter = next.chapter;
        demo.choices = [];
        demo.beatChoices = next.choices;
        demo.final = Boolean(next.final);
        demo.queue = markGates(next.turns.slice());
        demo.autoCount = 0;
        pumpReveal(ctx, options);
    }

    // The reveal state machine. Exactly one of these is true at a time: a message
    // is composing, the conversation is waiting at a gate, or the group has
    // finished and the replies are showing.
    function pumpReveal(ctx, options = {}) {
        if (!active()) return;
        const mine = generation;

        if (!demo.queue.length) {
            demo.composing = false;
            demo.gate = null;
            demo.choices = demo.beatChoices || [];
            render(ctx, options);
            return;
        }

        const nextTurn = demo.queue[0];
        const gateReason = nextTurn.gateBefore
            || (demo.autoCount >= AUTO_LIMIT ? 'pause' : null);
        if (gateReason) {
            demo.composing = false;
            demo.gate = { reason: gateReason };
            render(ctx, { ...options, focus: options.focus });
            return;
        }

        const reveal = () => {
            // Abandon silently if anything invalidated this reveal while it waited.
            if (!active() || generation !== mine) return;
            revealTimer = null;
            demo.composing = false;
            const turn = demo.queue.shift();
            if (!turn) { pumpReveal(ctx, options); return; }
            demo.turns.push(turn);
            demo.autoCount += 1;
            render(ctx, { ...options, arrived: turn });
            pumpReveal(ctx, { ...options, focus: options.focus });
        };

        const delay = composingDelay(nextTurn);
        if (delay <= 0) { reveal(); return; }
        demo.composing = true;
        render(ctx, { ...options, focus: false });
        clearTimeout(revealTimer);
        revealTimer = setTimeout(reveal, delay);
    }

    // Pointer users can bring the next message forward instead of waiting.
    function skipComposing(ctx) {
        if (!active() || !demo.composing) return;
        clearTimeout(revealTimer);
        revealTimer = null;
        demo.composing = false;
        const turn = demo.queue.shift();
        if (turn) {
            demo.turns.push(turn);
            demo.autoCount += 1;
            render(ctx, { arrived: turn, focus: false });
        }
        pumpReveal(ctx, { focus: false });
    }

    // The student asked for the rest of the group. The marker on the waiting turn
    // is consumed here — otherwise the queue would stop at the same gate again.
    function continueReveal(ctx) {
        if (!active() || !demo.gate) return;
        if (demo.queue.length) delete demo.queue[0].gateBefore;
        demo.gate = null;
        demo.autoCount = 0;
        demo.focusPending = true;
        pumpReveal(ctx);
    }

    function advance(ctx, choice) {
        demo.history.push(snapshot());
        if (choice.route) demo.route = choice.route;
        if (choice.concern) demo.concern = choice.concern;
        if (choice.feedback) demo.feedback = choice.feedback;
        if (choice.decision) { demo.decision = choice.decision; demo.seen.decide = true; }
        if (choice.evidenceFocus) demo.evidenceFocus = choice.evidenceFocus;
        if (choice.voiceKept) demo.voiceKept = true;
        // The student's own reply lands first and immediately — it is theirs.
        demo.turns.push(meTurn(ctx.escape(choice.label)));
        demo.choices = [];
        demo.focusPending = true;
        const opening = choice.reply ? [panaTurn(choice.reply)] : [];
        render(ctx, { focus: false, arrived: demo.turns[demo.turns.length - 1] });

        const next = beat(ctx, choice.next);
        if (!next) return;
        demo.beat = choice.next;
        demo.beatStart = demo.turns.length;
        demo.chapter = next.chapter;
        demo.beatChoices = next.choices;
        demo.final = Boolean(next.final);
        demo.queue = markGates(opening.concat(next.turns));
        demo.autoCount = 0;
        pumpReveal(ctx);
    }

    function prefersReducedMotion() {
        try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
        catch { return false; }
    }

    function back(ctx) {
        if (!demo.history.length) return;
        invalidatePending();
        const previous = demo.history.pop();
        const history = demo.history;
        // A snapshot is taken while replies are showing, so the restored beat is
        // fully revealed: empty queue, no gate, nothing in flight.
        demo = {
            ...previous, history,
            queue: [], composing: false, gate: null, autoCount: 0,
            focusPending: true, stick: true, unreadBelow: false,
        };
        // Re-enter the beat so its choices are rebuilt from current data.
        const rebuilt = beat(ctx, demo.beat);
        demo.choices = rebuilt ? rebuilt.choices : [];
        demo.beatChoices = demo.choices;
        demo.chapter = rebuilt ? rebuilt.chapter : demo.chapter;
        demo.final = Boolean(rebuilt && rebuilt.final);
        render(ctx);
    }

    function restart(ctx) {
        const origin = demo.origin;
        invalidatePending();
        resetDemo(origin);
        demo.lang = ctx.lang();
        demo.genreId = currentGenreId(ctx);
        demo.focusPending = true;
        enterBeat(ctx, 'open');
    }

    function currentGenreId(ctx) {
        const genre = ctx.genre();
        return genre ? (genre.fullName?.en || genre.label?.en || 'genre') : null;
    }

    // The Studio re-renders on a language or writing-project change while the
    // conversation is open. Pending reveals are dropped and the current response
    // group is rebuilt in the new language, so no group is ever half-translated.
    // Earlier turns keep the language they were actually said in.
    function notifyEnvironmentChanged(ctx) {
        if (!active()) return;
        const lang = ctx.lang();
        const genreId = currentGenreId(ctx);
        if (lang === demo.lang && genreId === demo.genreId) return;
        invalidatePending();
        demo.lang = lang;
        demo.genreId = genreId;
        if (!ctx.genre() || !genreData(ctx)) { finish(ctx, 'genre-change'); return; }
        rebuildCurrentBeat(ctx);
    }

    // The companion's face appears once per run of consecutive messages, the way
    // a person's avatar does in a messaging app — not stamped on every bubble.
    function turnHtml(ctx, turn, isLast, showAvatar) {
        if (turn.who === 'me') {
            return `<div class="gd-turn me${isLast ? ' gd-new' : ''}"><p class="gd-bubble me">${turn.html}</p></div>`;
        }
        const wide = turn.kind === 'preview' || turn.kind === 'demo';
        const avatar = wide
            ? ''
            : `<span class="gd-avatar${showAvatar ? '' : ' gd-avatar-spacer'}" aria-hidden="true">${showAvatar && ctx.avatar ? ctx.avatar() : ''}</span>`;
        const bubbleClass = wide ? 'gd-bubble wide' : 'gd-bubble';
        return `<div class="gd-turn pana${isLast ? ' gd-new' : ''}">${avatar}<div class="${bubbleClass}${turn.kind === 'quip' ? ' quip' : ''}">${turn.html}</div></div>`;
    }

    function render(ctx, options = {}) {
        if (!active()) return;
        const body = document.getElementById('tourBody') || document.querySelector('.dialog-body');
        const footer = document.getElementById('tourFooter') || document.querySelector('.dialog-footer');
        if (!body) return;

        const transcript = demo.turns.map((turn, index) => {
            // First speaking bubble of a consecutive companion run carries the face.
            let showAvatar = false;
            if (turn.who === 'pana' && turn.kind !== 'preview' && turn.kind !== 'demo') {
                let previous = null;
                for (let i = index - 1; i >= 0; i -= 1) {
                    if (demo.turns[i].kind === 'preview' || demo.turns[i].kind === 'demo') continue;
                    previous = demo.turns[i];
                    break;
                }
                showAvatar = !previous || previous.who !== 'pana';
            }
            return turnHtml(ctx, turn, index === demo.turns.length - 1, showAvatar);
        }).join('');
        // Decorative only: hidden from assistive technology, never labelled
        // "thinking", and never implying a live human or a generated response.
        // A pointer user can tap it to bring the next message forward.
        const typing = demo.composing
            // Not a `.gd-turn`: nothing has been said yet.
            ? `<div class="gd-composing-row"><span class="gd-avatar" aria-hidden="true">${ctx.avatar ? ctx.avatar() : ''}</span><div class="gd-bubble gd-typing" data-action="gd-skip-composing" aria-hidden="true"><i></i><i></i><i></i></div></div>`
            : '';
        const gate = demo.gate
            ? `<div class="gd-choices gd-gate">
                    <button class="gd-choice gd-continue" data-action="gd-continue">${label(ctx, ...continueLabel(demo.gate.reason))}</button>
                </div>`
            : '';
        const choices = (demo.choices || []).length
            ? `<div class="gd-choices" role="group" aria-label="${ctx.escape(plain(ctx, 'Your reply', 'Tu respuesta'))}">${demo.choices
                .map((choice, index) => `<button class="gd-choice" data-action="gd-choose" data-choice="${index}">${ctx.escape(choice.label)}</button>`).join('')}</div>`
            : '';
        const ending = demo.final && !demo.queue.length && !demo.gate && !demo.composing
            ? `<div class="gd-choices gd-final">
                    <button class="button secondary" data-action="tour-explore">${label(ctx, 'Look around on my own', 'Explorar por mi cuenta')}</button>
                    <button class="button primary" data-action="tour-write">${label(ctx, 'Start writing', 'Empezar a escribir')}</button>
                </div>`
            : '';
        body.innerHTML = `<div class="gd-conversation" data-beat="${ctx.escape(demo.beat)}"${demo.composing ? ' data-composing="true"' : ''}${demo.gate ? ` data-gate="${ctx.escape(demo.gate.reason)}"` : ''}>
            <p class="gd-chapter" id="tourChapter" tabindex="-1">${ctx.escape(demo.chapter || '')}</p>
            <div class="gd-transcript">${transcript}${typing}</div>
            ${gate}${choices}${ending}
        </div>`;

        if (footer) {
            footer.innerHTML = `<button class="button ghost" data-action="tour-skip">${label(ctx, 'Skip', 'Saltar')}</button>
                <div class="tour-nav">
                    <button class="button ghost" data-action="gd-back" ${demo.history.length ? '' : 'disabled'}>← ${label(ctx, 'Back', 'Atrás')}</button>
                    <button class="button ghost" data-action="gd-restart" ${demo.turns.length > 3 ? '' : 'disabled'}>${label(ctx, 'Start over', 'Reiniciar')}</button>
                </div>`;
        }

        // Focus never follows an arriving message into a bubble or a preview. It
        // moves only after a deliberate action by the student, and only onto the
        // control that action produced — otherwise the control they just
        // activated disappears and focus falls to the document body.
        const interactive = body.querySelector('.gd-choice, .gd-final .button.primary');
        if (demo.focusPending && interactive && options.focus !== false) {
            demo.focusPending = false;
            // Deferred by a frame: the dialog performs its own initial focus on
            // the next frame, so focusing synchronously here would be overwritten
            // and a keyboard user would land on the close button instead of the
            // reply their action produced.
            const target = interactive;
            requestAnimationFrame(() => {
                if (active() && target.isConnected) target.focus({ preventScroll: true });
            });
        }

        attachScrollWatch(ctx, body);
        syncUnreadPill(ctx);
        followNewContent(ctx, body, options.arrived, options.settled);

        // A polite, restrained live region: one announcement per companion
        // message that actually arrived. The composing dots are never announced,
        // and a preview is announced by its caption rather than by reading out
        // the whole component's markup.
        if (options.arrived && options.arrived.who === 'pana' && options.announce !== false) {
            ctx.announce(announcementFor(ctx, options.arrived));
        }
    }

    function continueLabel(reason) {
        if (reason === 'preview') return ['What am I seeing?', '¿Qué estoy viendo?'];
        return ['Keep going', 'Sigue'];
    }

    function announcementFor(ctx, turn) {
        const scratch = document.createElement('div');
        scratch.innerHTML = turn.html;
        if (turn.kind === 'preview') {
            const caption = scratch.querySelector('.gd-preview-caption');
            const text = caption ? caption.textContent.trim() : '';
            return plain(ctx, `Sample shown: ${text}`, `Muestra: ${text}`);
        }
        return scratch.textContent.trim().slice(0, 220);
    }

    // ── Scroll orientation ───────────────────────────────────────────────────
    // Follow the conversation while the student is reading the newest part; stop
    // following the moment they scroll up to re-read, and tell them quietly that
    // something arrived instead of yanking them back.
    const NEAR_BOTTOM = 72;
    let scrollWatchTarget = null;
    let scrollWatchHandler = null;
    // `scroll` events are ambiguous: our own smooth follow emits them, and so
    // does the browser clamping scrollTop while the conversation is re-rendered.
    // Neither means the student moved. So auto-follow is only ever switched off
    // by evidence of an actual gesture — a wheel, a touch drag, a scrolling key,
    // or a scrollbar drag. Everything else leaves following alone.
    const SCROLL_KEYS = new Set(['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' ']);
    let userIntentUntil = 0;
    function markUserIntent() { userIntentUntil = Date.now() + 1500; }

    function scrollTo(scroller, target) {
        if (prefersReducedMotion()) scroller.scrollTop = target;
        else scroller.scrollTo({ top: target, behavior: 'smooth' });
    }

    function isNearBottom(scroller) {
        return scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= NEAR_BOTTOM;
    }

    function attachScrollWatch(ctx, body) {
        const scroller = body.closest('.dialog') || body;
        if (!scroller || scrollWatchTarget === scroller) return;
        detachScrollWatch();
        scrollWatchTarget = scroller;
        scrollWatchHandler = () => {
            if (!active()) return;
            // Sitting at the newest message is unambiguous however it happened:
            // resume following and retire the affordance.
            if (isNearBottom(scroller)) {
                demo.stick = true;
                if (demo.unreadBelow) { demo.unreadBelow = false; syncUnreadPill(ctx); }
                return;
            }
            // Away from the bottom, but only a gesture may stop following.
            if (Date.now() > userIntentUntil) return;
            demo.stick = false;
        };
        scroller.addEventListener('scroll', scrollWatchHandler, { passive: true });
        scroller.addEventListener('wheel', markUserIntent, { passive: true });
        scroller.addEventListener('touchmove', markUserIntent, { passive: true });
        scroller.addEventListener('keydown', event => {
            if (SCROLL_KEYS.has(event.key)) markUserIntent();
        });
        // A scrollbar drag starts on the scroller itself, outside its content box.
        scroller.addEventListener('mousedown', event => {
            if (event.offsetX > scroller.clientWidth || event.offsetY > scroller.clientHeight) markUserIntent();
        });
    }

    function detachScrollWatch() {
        if (scrollWatchTarget && scrollWatchHandler) {
            scrollWatchTarget.removeEventListener('scroll', scrollWatchHandler);
            scrollWatchTarget.removeEventListener('wheel', markUserIntent);
            scrollWatchTarget.removeEventListener('touchmove', markUserIntent);
        }
        scrollWatchTarget = null;
        scrollWatchHandler = null;
    }

    // The pill lives outside the re-rendered conversation body so it survives a
    // render, and is positioned against the viewport (honouring the safe area)
    // rather than scrolling away with the transcript.
    function syncUnreadPill(ctx) {
        const existing = document.querySelector('.gd-unread');
        if (!active() || !demo.unreadBelow) { existing?.remove(); return; }
        if (existing) return;
        const host = document.querySelector('.overlay') || document.body;
        const pill = document.createElement('button');
        pill.className = 'gd-unread';
        pill.type = 'button';
        pill.setAttribute('data-action', 'gd-jump');
        pill.textContent = plain(ctx, 'New message ↓', 'Mensaje nuevo ↓');
        pill.setAttribute('aria-label', plain(ctx,
            'New message below. Jump to the newest message.',
            'Mensaje nuevo abajo. Ir al mensaje más reciente.'));
        host.appendChild(pill);
    }

    function followNewContent(ctx, body, arrived, settled) {
        const scroller = body.closest('.dialog') || body;
        if (!scroller) return;
        // After layout: a preview's height is unknown until it has been laid out,
        // so measuring in the same frame lands short.
        requestAnimationFrame(() => {
            if (!active() || !scroller.isConnected) return;
            if (!demo.stick) {
                // The student is reading further up. Say something arrived; do
                // not move them. Replies becoming available counts as something
                // arriving, so they are never left waiting off-screen.
                if (arrived || settled) { demo.unreadBelow = true; syncUnreadPill(ctx); }
                return;
            }
            const last = body.querySelector('.gd-transcript .gd-turn:last-child');
            const anchor = body.querySelector('.gd-choices') || last;
            if (!anchor) return;
            const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
            // Measured against the scrollport, not offsetParent — and the dialog's
            // sticky footer covers the bottom of it, so the usable edge is higher.
            const port = scroller.getBoundingClientRect();
            const footer = document.querySelector('.dialog-footer');
            const footerHeight = footer ? footer.getBoundingClientRect().height : 0;
            const usableBottom = port.bottom - footerHeight;

            let target;
            if (last && last.getBoundingClientRect().height > (usableBottom - port.top) * 0.6) {
                // A tall arrival — a live preview — is revealed from its top, with
                // a strip of the preceding message still visible for context,
                // rather than by jumping to the very bottom of the conversation.
                target = scroller.scrollTop + (last.getBoundingClientRect().top - port.top) - 84;
            } else {
                // Otherwise bring the new item and the replies just inside view.
                target = scroller.scrollTop + (anchor.getBoundingClientRect().bottom - usableBottom) + 16;
            }
            target = Math.max(0, Math.min(maxTop, Math.round(target)));

            // Never scroll backwards: content is never moved above the student's
            // current reading position.
            if (target <= scroller.scrollTop) return;
            scrollTo(scroller, target);
        });
    }

    function jumpToNewest(ctx) {
        const body = document.getElementById('tourBody');
        const scroller = body ? (body.closest('.dialog') || body) : null;
        if (!scroller) return;
        demo.stick = true;
        demo.unreadBelow = false;
        syncUnreadPill(ctx);
        scrollTo(scroller, Math.max(0, scroller.scrollHeight - scroller.clientHeight));
    }

    function finish(ctx, mode) {
        writePrefs({ completedAt: new Date().toISOString(), lastExit: mode });
        const originAtExit = demo ? demo.origin : 'welcome';
        endDemo();
        detachScrollWatch();
        document.querySelector('.gd-unread')?.remove();
        const cameFromWelcomeCard = originAtExit === 'welcome' || Boolean(document.querySelector('.tour-welcome'));
        ctx.closeDialog(true);
        if (cameFromWelcomeCard) {
            ctx.rerender();
            ctx.focusEditor();
        } else if (mode === 'write') {
            ctx.focusEditor();
        } else {
            restoreOriginFocus(originAtExit);
        }
    }

    // Every action is handled here; nothing else in the Studio changes.
    function handleAction(ctx, action, target) {
        switch (action) {
            case 'tour-start':
                start(ctx);
                return true;
            case 'tour-dismiss':
                writePrefs({ dismissedAt: new Date().toISOString() });
                ctx.rerender();
                ctx.focusEditor();
                ctx.announce(plain(ctx, 'Dismissed. You can start it later from Help.', 'Descartado. Puedes empezarlo después desde Ayuda.'));
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
            case 'gd-choose': {
                // Guarded against repeat taps: choices exist only when the group
                // has finished arriving, and are cleared the instant one is taken.
                if (!active() || demo.composing || demo.gate || demo.queue.length) return true;
                const choice = (demo.choices || [])[Number(target.dataset.choice)];
                if (choice) advance(ctx, choice);
                return true;
            }
            case 'gd-continue':
                continueReveal(ctx);
                return true;
            case 'gd-skip-composing':
                skipComposing(ctx);
                return true;
            case 'gd-jump':
                if (!active()) return true;
                jumpToNewest(ctx);
                return true;
            case 'gd-back':
                if (!active()) return true;
                back(ctx);
                return true;
            case 'gd-restart':
                if (!active()) return true;
                restart(ctx);
                return true;
            case 'gd-compare': {
                if (!active()) return true;
                invalidatePending();
                demo.compare = target.dataset.choice === 'after' ? 'after' : 'before';
                // Rebuild the revision beat's turns in place so the comparison
                // updates without appending a duplicate stretch of conversation.
                rebuildCurrentBeat(ctx);
                return true;
            }
            case 'gd-expand': {
                if (!active()) return true;
                const figure = target.closest('.gd-preview');
                if (figure) {
                    const expanding = !figure.classList.contains('gd-preview--expanded');
                    figure.classList.toggle('gd-preview--expanded', expanding);
                    target.textContent = expanding
                        ? plain(ctx, 'Shrink this sample', 'Reducir esta muestra')
                        : plain(ctx, 'Enlarge this sample', 'Ampliar esta muestra');
                }
                return true;
            }
            default:
                return false;
        }
    }

    // Re-render only the turns belonging to the current beat, in place. Used by
    // the comparison tabs and by a language or writing-project change: the group
    // is rebuilt whole, so it can never be part one language and part another.
    function rebuildCurrentBeat(ctx) {
        const start = typeof demo.beatStart === 'number' ? demo.beatStart : demo.turns.length;
        demo.turns = demo.turns.slice(0, start);
        demo.queue = [];
        demo.composing = false;
        demo.gate = null;
        const rebuilt = beat(ctx, demo.beat);
        if (rebuilt) {
            rebuilt.turns.forEach(turn => demo.turns.push(turn));
            demo.choices = rebuilt.choices;
            demo.beatChoices = rebuilt.choices;
            demo.chapter = rebuilt.chapter;
            demo.final = Boolean(rebuilt.final);
        }
        render(ctx, { focus: false, announce: false });
    }

    // Closing the dialog by any route (×, Escape, backdrop) ends the
    // conversation, cancels anything in flight, and discards every value in it.
    function notifyDialogClosed() {
        if (!active()) return;
        const origin = demo.origin;
        endDemo();
        detachScrollWatch();
        document.querySelector('.gd-unread')?.remove();
        restoreOriginFocus(origin);
    }

    window.StudioTour = {
        TOUR_KEY, TOUR_VERSION,
        readPrefs, welcomeAnswered, shouldOfferWelcome, welcomeCardHtml,
        shouldOfferFirstRun, firstRunHtml,
        start, handleAction, notifyDialogClosed, notifyEnvironmentChanged, isActive: active,
    };
}());
