/*
 * Tu Pana Writing Studio — pedagogical-engine migration candidate.
 * Forked from the hardened Integrated Desk finalist (explore.html?concept=integrated
 * at d8b92e8); the finalist's contracts are preserved and pinned by the studio suites.
 * This file deliberately does not import, enumerate, or read any R0 storage key
 * except through the explicit, student-invoked legacy-import preview (studio-import.js).
 * One exact storage key; mock AI provider in this plane.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'tupana-studio:v1';
    const root = document.getElementById('prototypeRoot');
    const dialogRoot = document.getElementById('dialogRoot');
    const live = document.getElementById('liveRegion');
    const assertive = document.getElementById('assertiveRegion');
    const concept = 'integrated';
    let state = loadState(concept);
    let captured = null;
    let saveTimer = null;
    let lastFocus = null;
    let reviewTab = 'history';
    let pendingDecision = null;
    let pendingMoveLink = null;
    let dialogGuard = null;
    let dialogAfterDiscard = null;
    // In-flight provider request token. Closing the consent dialog (cancel,
    // Escape, backdrop) cancels the pending request: a late response is ignored,
    // persists nothing, and is recorded only as metadata-only usage + an event.
    let pendingProviderToken = null;
    // True only inside one synchronous Guided Discovery preview render, during
    // which the canonical state is swapped for synthetic data and saving is off.
    let previewLock = false;
    let editorCaret = null;
    let activeEditSurface = null;
    const editHistories = new Map();

    const conceptMeta = {
        integrated: {
            short: 'Studio', name: 'Writing Studio', finalist: false,
            mental: 'My essay lives in the Draft. Moves and notes help me think.',
            summary: 'Desk clarity with durable genre-specific Move notes, visible coach access, contextual critical-AI judgment, and optional culturally responsive preparation.',
            tags: ['1 draft', 'Persistent Move notes'],
        },
    };

    const copy = {
        en: {
            prototype: 'Practice preview — the coach is simulated on this device. Your writing stays here.',
            saved: 'Saved on this device', saving: 'Saving…', saveFailed: 'Couldn’t save — keep this page open and export a backup from Settings.',
            compare: 'Compare concepts', settings: 'Settings', language: 'Language', genre: 'Writing project',
            whereDesk: 'Your Desk', whereJourney: 'Step {n} of 10', whereHybrid: 'Phase {n} of 4',
            doingDesk: 'Shape one current draft. Open a move only when it helps.',
            doingJourney: 'Work on this step’s artifact. Your marked current version stays visible.',
            doingHybrid: 'Keep one draft moving through a smaller set of phases.',
            nextDesk: 'Next: strengthen the draft or open Finish when you are ready.',
            nextJourney: 'Next: {next}. Back and Continue never mark work complete.',
            nextHybrid: 'Next: {next}. Your draft carries forward unchanged.',
            currentDraft: 'Current draft', currentVersion: 'Marked current version', autosaved: 'Autosaved locally', words: '{n} words',
            paste: 'Paste a draft', focus: 'Focus', exitFocus: 'Exit focus',
            reviewCenter: 'Review Center', focusedReview: 'Focused review', council: 'The Council', coach: 'Ask Tu Pana',
            reflection: 'Process Reflection', finish: 'Finish', back: 'Back', continue: 'Continue',
            priorWork: 'Prior work', moves: 'Moves for this moment', workRail: 'Your work', evidence: 'Evidence so far',
            noPrior: 'Your writing and review history will appear here.', noReviews: 'No mock reviews yet. Your draft remains entirely yours.',
            selectHint: 'Select words in the draft to ask about that exact passage.', captured: 'Passage captured', reviewPassage: 'Review passage', clear: 'Clear',
            sendCoach: 'Send to mock coach', sendReview: 'Request mock review', convene: 'Convene mock Council', revisit: 'Revisit report',
            selectedScope: 'Selected passage', paragraphScope: 'Current paragraph', fullScope: 'Full draft', exactPreview: 'Exact text preview',
            consent: 'I choose to send this exact text to the simulated coach on this device.',
            noNetwork: 'Mock AI only: nothing leaves this page and no network request is made.', cancel: 'Cancel',
            accept: 'Accept', adapt: 'Adapt', reject: 'Reject', later: 'Decide later', decisionRecorded: 'Decision recorded. You decide how to revise your own words.',
            reflectionWhy: 'The app brings factual evidence forward. It never writes your reasoning, feelings, or reflective claims.',
            reflectionEvidence: 'Activity evidence you may use', saveReturn: 'Save and return later', optional: 'Optional',
            prompt1: 'What changed most in your writing, and why?',
            prompt2: 'Which AI suggestion did you accept, adapt, or reject, and what guided that decision?',
            prompt3: 'What did you preserve because it sounds or feels distinctly like you?',
            prompt4: 'What cultural, linguistic, family, or community knowledge shaped this work?',
            preparePacket: 'Prepare final packet', studentReflection: 'Student reflection', instructorAppendix: 'Instructor evidence appendix',
            packetDraft: 'Draft included in packet', confirmDraft: 'I confirm that this exact draft is the version I intend to include.',
            createPacket: 'Create local packet', downloadPacket: 'Download packet', packetReady: 'Final packet is ready locally.',
            settingsTitle: 'Settings', storageNote: 'Your work is saved only in this browser, in one Writing Studio record. Tu Pana never reads other work saved on this device.',
            focusDecision: 'Mobile Focus decision', danger: 'Danger Zone', export: 'Export safety copy', delete: 'Delete this Writing Studio’s saved data',
            deleteExplain: 'Only the Writing Studio’s saved record in this browser will be removed. Other work saved on this device is untouched.',
            typeDelete: 'Type DELETE to enable deletion', deleteNow: 'Delete saved data',
            startBlank: 'Start with a blank draft', replaceDraft: 'Replace draft with this text',
            pasteWarning: 'Paste your own writing here. It replaces your current draft, and the replaced text stays recoverable as an exact snapshot in your draft history.',
            phaseDiscover: 'Discover', phaseDraft: 'Draft', phaseStrengthen: 'Strengthen', phaseFinish: 'Finish',
            actStart: 'Start', actRevise: 'Revise', actFinish: 'Finish',
            currentMark: 'Current version', markCurrent: 'Mark as current', newer: 'Newer than marked version',
            completeRule: 'Complete when this step has meaningful writing or a recorded decision.',
            noFallback: 'Guidance is configured for this genre; unknown genres use neutral writing guidance, never autobiographical defaults.',
            notebook: 'Notebook', draft: 'Draft', myWork: 'My Work', notebookSaved: 'Notebook card saved locally',
            notebookPurpose: 'Use these cards for thinking, research, and planning—not as competing drafts.',
            cardsSuggested: 'Cards are suggested and skippable. Starting the draft directly is always allowed.',
            draftMissing: 'Doesn’t exist yet—you will write it.', writeDraft: 'Write my draft',
            authorshipBoundary: 'Your notebook stays beside you as reference. Your draft starts empty and only you type or paste its prose.',
            notebookCoach: 'Ask about this notebook card', notebookCoachBoundary: 'The mock coach may discuss ideas already in this card and ask questions. It will not generate draft prose or transfer text into the draft.',
            pasteNotebook: 'Paste notebook material', saveCard: 'Save notebook card', nextCard: 'Continue to: {name}',
            notebookReference: 'Notebook reference', draftToolsLocked: 'Draft review unlocks after you create your draft.',
            createdEmpty: 'Canonical draft created empty. Notebook text was not transferred.',
            versions: 'Versions', draftSnapshot: 'Dated draft snapshot', directDraft: 'Begin drafting now',
            finalist: 'Finalist under evaluation', planningNotes: 'Planning notes', makeNote: 'Make a note', editNote: 'Edit note',
            askVisible: 'Ask Tu Pana', coachEntryHint: 'Ask about a passage, paragraph, or the full draft. Select text for the Passage Tray.',
            knowledgeTitle: 'Your knowledge and language may belong here', knowledgeBody: 'Your language, experience, family, or community knowledge may help here. You choose what stays private.',
            useKnowledge: 'Use this lens', notNow: 'Not now', revisitKnowledge: 'Knowledge & language lens',
            criticalAction: 'Think critically about this response', allQuestions: 'View the Five Questions', rationale: 'Optional reason in your own words', saveDecision: 'Save decision',
            decisionMaker: 'You remain the author and decision-maker. No response changes your draft.', purpose: 'Purpose', reviewer: 'Mock reviewer', calls: 'Mock calls represented',
            councilUnavailable: 'Council is not configured for this genre. Use focused review or ask your instructor for disciplinary feedback.',
        },
        es: {
            prototype: 'Vista de práctica — el coach es simulado en este dispositivo. Tu escritura permanece aquí.',
            saved: 'Guardado en este dispositivo', saving: 'Guardando…', saveFailed: 'No se pudo guardar — mantén esta página abierta y exporta una copia desde Configuración.',
            compare: 'Comparar conceptos', settings: 'Configuración', language: 'Idioma', genre: 'Proyecto de escritura',
            whereDesk: 'Tu Escritorio', whereJourney: 'Paso {n} de 10', whereHybrid: 'Fase {n} de 4',
            doingDesk: 'Trabaja un solo borrador actual. Abre una movida solo cuando ayude.',
            doingJourney: 'Trabaja el artefacto de este paso. Tu versión actual marcada siempre está visible.',
            doingHybrid: 'Mueve un solo borrador por un recorrido más corto.',
            nextDesk: 'Próximo: fortalece el borrador o abre Finalizar cuando estés listo.',
            nextJourney: 'Próximo: {next}. Atrás y Continuar nunca marcan trabajo como completo.',
            nextHybrid: 'Próximo: {next}. Tu borrador continúa sin cambios.',
            currentDraft: 'Borrador actual', currentVersion: 'Versión actual marcada', autosaved: 'Autoguardado local', words: '{n} palabras',
            paste: 'Pegar un borrador', focus: 'Enfoque', exitFocus: 'Salir de enfoque',
            reviewCenter: 'Centro de Revisión', focusedReview: 'Lectura enfocada', council: 'El Consejo', coach: 'Preguntar a Tu Pana',
            reflection: 'Reflexión de proceso', finish: 'Finalizar', back: 'Atrás', continue: 'Continuar',
            priorWork: 'Trabajo anterior', moves: 'Movidas para este momento', workRail: 'Tu trabajo', evidence: 'Evidencia hasta ahora',
            noPrior: 'Tu escritura e historial de revisión aparecerán aquí.', noReviews: 'Todavía no hay revisiones simuladas. Tu borrador sigue siendo completamente tuyo.',
            selectHint: 'Selecciona palabras del borrador para preguntar por ese pasaje exacto.', captured: 'Pasaje capturado', reviewPassage: 'Revisar pasaje', clear: 'Borrar selección',
            sendCoach: 'Enviar al coach simulado', sendReview: 'Pedir revisión simulada', convene: 'Convocar Consejo simulado', revisit: 'Revisitar informe',
            selectedScope: 'Pasaje seleccionado', paragraphScope: 'Párrafo actual', fullScope: 'Borrador completo', exactPreview: 'Vista previa del texto exacto',
            consent: 'Elijo enviar este texto exacto al coach simulado en este dispositivo.',
            noNetwork: 'Solo IA simulada: nada sale de esta página y no se hace ninguna solicitud de red.', cancel: 'Cancelar',
            accept: 'Aceptar', adapt: 'Adaptar', reject: 'Rechazar', later: 'Decidir después', decisionRecorded: 'Decisión guardada. Tú decides cómo revisar tus propias palabras.',
            reflectionWhy: 'La app trae evidencia factual. Nunca escribe tu razonamiento, sentimientos ni afirmaciones reflexivas.',
            reflectionEvidence: 'Evidencia de actividad que puedes usar', saveReturn: 'Guardar y volver después', optional: 'Opcional',
            prompt1: '¿Qué cambió más en tu escritura y por qué?',
            prompt2: '¿Qué sugerencia de IA aceptaste, adaptaste o rechazaste, y qué guio tu decisión?',
            prompt3: '¿Qué preservaste porque suena o se siente claramente como tú?',
            prompt4: '¿Qué conocimiento cultural, lingüístico, familiar o comunitario dio forma a este trabajo?',
            preparePacket: 'Preparar paquete final', studentReflection: 'Reflexión estudiantil', instructorAppendix: 'Apéndice de evidencia para el instructor',
            packetDraft: 'Borrador incluido en el paquete', confirmDraft: 'Confirmo que este texto exacto es la versión que quiero incluir.',
            createPacket: 'Crear paquete local', downloadPacket: 'Descargar paquete', packetReady: 'El paquete final está listo localmente.',
            settingsTitle: 'Configuración', storageNote: 'Tu trabajo se guarda solo en este navegador, en un registro del Writing Studio. Tu Pana nunca lee otro trabajo guardado en este dispositivo.',
            focusDecision: 'Decisión de Enfoque móvil', danger: 'Zona de peligro', export: 'Exportar copia de seguridad', delete: 'Borrar los datos guardados del Writing Studio',
            deleteExplain: 'Solo se borrará el registro guardado del Writing Studio en este navegador. El resto del trabajo guardado en este dispositivo no cambia.',
            typeDelete: 'Escribe DELETE para activar el borrado', deleteNow: 'Borrar datos del prototipo',
            startBlank: 'Comenzar con borrador vacío', replaceDraft: 'Reemplazar el borrador con este texto',
            pasteWarning: 'Pega aquí tu propia escritura. Reemplaza tu borrador actual, y el texto reemplazado queda recuperable como una instantánea exacta en tu historial.',
            phaseDiscover: 'Descubrir', phaseDraft: 'Redactar', phaseStrengthen: 'Fortalecer', phaseFinish: 'Finalizar',
            actStart: 'Comenzar', actRevise: 'Revisar', actFinish: 'Finalizar',
            currentMark: 'Versión actual', markCurrent: 'Marcar como actual', newer: 'Más reciente que la versión marcada',
            completeRule: 'Se completa cuando este paso contiene escritura sustancial o una decisión guardada.',
            noFallback: 'La guía está configurada para este género; los géneros desconocidos reciben guía neutral, nunca un modelo autobiográfico.',
            notebook: 'Cuaderno', draft: 'Borrador', myWork: 'Mi trabajo', notebookSaved: 'Tarjeta del cuaderno guardada localmente',
            notebookPurpose: 'Usa estas tarjetas para pensar, investigar y planificar—no como borradores que compiten.',
            cardsSuggested: 'Las tarjetas son sugeridas y opcionales. Siempre puedes comenzar el borrador directamente.',
            draftMissing: 'Todavía no existe—tú lo escribirás.', writeDraft: 'Escribir mi borrador',
            authorshipBoundary: 'Tu cuaderno queda a tu lado como referencia. El borrador comienza vacío y solo tú escribes o pegas su prosa.',
            notebookCoach: 'Preguntar sobre esta tarjeta', notebookCoachBoundary: 'El coach simulado puede conversar sobre ideas que ya están en esta tarjeta y hacer preguntas. No generará prosa del borrador ni transferirá texto.',
            pasteNotebook: 'Pegar material en el cuaderno', saveCard: 'Guardar tarjeta', nextCard: 'Continuar a: {name}',
            notebookReference: 'Referencia del cuaderno', draftToolsLocked: 'La revisión del borrador se activa después de crear tu borrador.',
            createdEmpty: 'Borrador canónico creado vacío. No se transfirió texto del cuaderno.',
            versions: 'Versiones', draftSnapshot: 'Instantánea fechada del borrador', directDraft: 'Comenzar a redactar ahora',
            finalist: 'Finalista bajo evaluación', planningNotes: 'Notas de planificación', makeNote: 'Hacer una nota', editNote: 'Editar nota',
            askVisible: 'Preguntar a Tu Pana', coachEntryHint: 'Pregunta sobre un pasaje, párrafo o el borrador completo. Selecciona texto para abrir la bandeja de pasaje.',
            knowledgeTitle: 'Tu conocimiento y lenguaje pueden pertenecer aquí', knowledgeBody: 'Tu idioma, experiencia, familia o comunidad pueden ayudar aquí. Tú eliges qué queda privado.',
            useKnowledge: 'Usar esta lente', notNow: 'Ahora no', revisitKnowledge: 'Lente de conocimiento e idioma',
            criticalAction: 'Pensar críticamente sobre esta respuesta', allQuestions: 'Ver las Cinco Preguntas', rationale: 'Razón opcional en tus propias palabras', saveDecision: 'Guardar decisión',
            decisionMaker: 'Tú sigues siendo autor/a y quien decide. Ninguna respuesta cambia tu borrador.', purpose: 'Propósito', reviewer: 'Revisor simulado', calls: 'Llamadas simuladas representadas',
            councilUnavailable: 'El Consejo no está configurado para este género. Usa una revisión enfocada o pide retroalimentación disciplinaria a tu instructor/a.',
        },
    };

    const {
        genres, genreMovesEs, integratedMoveProfiles, criticalQuestions,
        councilConfig, lensCriticalKeys, coachCriticalKeys, reflectionPrompt4,
        stuckStarters, moveDeeper, resolveAssignment,
    } = window.StudioProfiles;

    const genreNotebooks = {
        admissions: [
            { id: 'anecdote', en: 'Anecdote', es: 'Anécdota', promptEn: 'Capture one concrete moment and the details a reader can see.', promptEs: 'Captura un momento concreto y los detalles que el lector puede ver.' },
            { id: 'connection', en: 'Connection', es: 'Conexión', promptEn: 'What changed in your understanding, choices, or direction?', promptEs: '¿Qué cambió en tu comprensión, decisiones o dirección?' },
            { id: 'central-idea', en: 'Central idea', es: 'Idea central', promptEn: 'Name the insight the essay should leave with its reader.', promptEs: 'Nombra la reflexión que el ensayo debe dejarle al lector.' },
            { id: 'context', en: 'Research / context', es: 'Investigación / contexto', promptEn: 'Note only context the reader needs to understand your experience.', promptEs: 'Anota solo el contexto necesario para comprender tu experiencia.' },
            { id: 'outline', en: 'Outline', es: 'Esquema', promptEn: 'Sketch a possible order without writing the essay itself.', promptEs: 'Bosqueja un orden posible sin escribir el ensayo.' },
        ],
        stem: [
            { id: 'context', en: 'Scientific context', es: 'Contexto científico', promptEn: 'What question does this investigation address, and why?', promptEs: '¿Qué pregunta aborda esta investigación y por qué?' },
            { id: 'hypothesis', en: 'Hypothesis', es: 'Hipótesis', promptEn: 'State a testable prediction and the reasoning behind it.', promptEs: 'Declara una predicción comprobable y su razonamiento.' },
            { id: 'methods', en: 'Methods plan', es: 'Plan de métodos', promptEn: 'List variables, controls, and steps needed for reproducibility.', promptEs: 'Enumera variables, controles y pasos necesarios para reproducibilidad.' },
            { id: 'data', en: 'Data notes', es: 'Notas de datos', promptEn: 'Record observations and patterns without turning them into conclusions.', promptEs: 'Registra observaciones y patrones sin convertirlos en conclusiones.' },
            { id: 'analysis', en: 'Analysis plan', es: 'Plan de análisis', promptEn: 'Plan how evidence will support, complicate, or reject the hypothesis.', promptEs: 'Planifica cómo la evidencia apoyará, complicará o rechazará la hipótesis.' },
        ],
        sop: [
            { id: 'program', en: 'Program', es: 'Programa', promptEn: 'Note the specific program, faculty, or resources relevant to your purpose.', promptEs: 'Anota el programa, facultad o recursos relevantes para tu propósito.' },
            { id: 'trajectory', en: 'Trajectory', es: 'Trayectoria', promptEn: 'Trace the experiences that shaped your current research direction.', promptEs: 'Traza las experiencias que formaron tu dirección de investigación.' },
            { id: 'evidence', en: 'Preparation evidence', es: 'Evidencia de preparación', promptEn: 'List concrete work that demonstrates readiness for this field.', promptEs: 'Enumera trabajo concreto que demuestra preparación para este campo.' },
            { id: 'fit', en: 'Research fit', es: 'Encaje de investigación', promptEn: 'Connect your questions to what this program uniquely supports.', promptEs: 'Conecta tus preguntas con lo que este programa apoya de forma única.' },
            { id: 'outline', en: 'Purpose outline', es: 'Esquema de propósito', promptEn: 'Sketch a logical sequence without drafting the statement.', promptEs: 'Bosqueja una secuencia lógica sin redactar la carta.' },
        ],
        neutral: [
            { id: 'purpose', en: 'Purpose', es: 'Propósito', promptEn: 'What should this writing help its audience understand or do?', promptEs: '¿Qué debe ayudar esta escritura a comprender o hacer?' },
            { id: 'audience', en: 'Audience', es: 'Audiencia', promptEn: 'What does this audience already know, and what will it need?', promptEs: '¿Qué sabe ya esta audiencia y qué necesitará?' },
            { id: 'evidence', en: 'Evidence', es: 'Evidencia', promptEn: 'Gather relevant examples, facts, quotations, or observations.', promptEs: 'Reúne ejemplos, hechos, citas u observaciones relevantes.' },
            { id: 'structure', en: 'Structure', es: 'Estructura', promptEn: 'Sketch an order that helps the audience follow the purpose.', promptEs: 'Bosqueja un orden que ayude a seguir el propósito.' },
        ],
    };

    const journeySteps = [
        ['Purpose', 'Name the assignment’s purpose and audience.'],
        ['Evidence', 'Gather the material this genre needs.'],
        ['Direction', 'Choose the main claim, question, or through-line.'],
        ['Structure', 'Arrange the work into a useful sequence.'],
        ['Plan', 'Make the next drafting move concrete.'],
        ['First draft', 'Build a complete working version.'],
        ['Revision', 'Change ideas, evidence, and structure.'],
        ['Voice & precision', 'Protect voice while improving clarity.'],
        ['Checklist', 'Verify genre expectations and remaining decisions.'],
        ['Process closing', 'Reflect and prepare the final packet.'],
    ];
    const journeyStepsEs = [
        ['Propósito', 'Nombra el propósito y la audiencia.'], ['Evidencia', 'Reúne el material que este género necesita.'],
        ['Dirección', 'Elige la afirmación, pregunta o hilo principal.'], ['Estructura', 'Ordena el trabajo en una secuencia útil.'],
        ['Plan', 'Haz concreta la próxima movida de redacción.'], ['Primer borrador', 'Construye una versión de trabajo completa.'],
        ['Revisión', 'Cambia ideas, evidencia y estructura.'], ['Voz y precisión', 'Protege la voz mientras mejoras la claridad.'],
        ['Checklist', 'Verifica expectativas y decisiones pendientes.'], ['Cierre de proceso', 'Reflexiona y prepara el paquete final.'],
    ];

    const hybridPhases = [
        ['Discover', 'Clarify purpose, evidence, and direction.'],
        ['Draft', 'Build one complete working version.'],
        ['Strengthen', 'Review, decide, and revise in your own words.'],
        ['Finish', 'Reflect, verify, and prepare the packet.'],
    ];
    const hybridPhasesEs = [
        ['Descubrir', 'Aclara propósito, evidencia y dirección.'], ['Redactar', 'Construye una versión de trabajo completa.'],
        ['Fortalecer', 'Revisa, decide y modifica con tus propias palabras.'], ['Finalizar', 'Reflexiona, verifica y prepara el paquete.'],
    ];

    function stepData(index) { return (state?.lang === 'en' ? journeySteps : journeyStepsEs)[index]; }
    function phaseData(index) { return (state?.lang === 'en' ? hybridPhases : hybridPhasesEs)[index]; }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
    }

    function t(key, values = {}) {
        const lang = state?.lang === 'es' || state?.lang === 'both' ? 'es' : 'en';
        let value = copy[lang][key] || copy.en[key] || key;
        Object.entries(values).forEach(([name, replacement]) => { value = value.replaceAll(`{${name}}`, replacement); });
        return value;
    }

    function instruction(key, values = {}) {
        if (!state || state.lang !== 'both') return escapeHtml(t(key, values));
        let es = copy.es[key] || key;
        let en = copy.en[key] || key;
        Object.entries(values).forEach(([name, replacement]) => {
            es = es.replaceAll(`{${name}}`, replacement);
            en = en.replaceAll(`{${name}}`, replacement);
        });
        return `<span lang="es">${escapeHtml(es)}</span><span lang="en" style="display:block;color:var(--muted);font-size:.88em;margin-top:3px">${escapeHtml(en)}</span>`;
    }

    function storageKey() { return STORAGE_KEY; }

    function defaultState(name) {
        const now = new Date().toISOString();
        return {
            schema: 1, concept: name, lang: 'en', genre: name === 'integrated' ? 'autobiographical' : 'admissions', draft: '',
            step: 1, phase: 1, view: 'write', savedAt: now, createdAt: now,
            place: name === 'notebook' ? 'notebook' : 'write', activeNotebook: 0,
            notebookEntries: {}, notebookCoachRuns: [], draftDeclared: false, draftCreatedAt: null,
            moveNotes: {}, knowledgeChoice: null, knowledgeChoiceAt: null,
            criticalViews: [], onboardingSeenAt: null, protectedPhrases: [], voiceEntries: [], finishChecks: {}, genreStates: {}, nativeSpellcheck: true,
            reviewCopy: null, revisionCycle: { focus: '', closure: '', selectedSuggestion: null, updatedAt: null },
            invitations: { moveReview: null, finishReflection: null },
            appearance: 'system',
            artifacts: {}, currentArtifact: name === 'journey' ? 'step-1' : 'draft',
            versions: [], reviews: [], decisions: [], councilRuns: [],
            reflections: { changed: '', decision: '', voice: '', knowledge: '' },
            reflectionSavedAt: null, packetCreatedAt: null, packetDraft: '',
        };
    }

    function loadState(name) {
        const fallback = defaultState(name);
        try {
            const raw = localStorage.getItem(storageKey(name));
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            if (!parsed || parsed.schema !== 1 || parsed.concept !== name) return fallback;
            const loaded = { ...fallback, ...parsed, reflections: { ...fallback.reflections, ...(parsed.reflections || {}) } };
            if (name === 'integrated' && !Array.isArray(parsed.voiceEntries)) {
                loaded.voiceEntries = (parsed.protectedPhrases || []).map(item => ({ ...item, id: item.id || `legacy-voice-${item.protectedAt || Date.now()}` }));
            }
            return loaded;
        } catch (error) {
            console.warn('[Exploration] isolated state could not be restored', error);
            return fallback;
        }
    }

    function saveState(message = '') {
        if (!state) return;
        // Guided Discovery preview window: the synthetic state installed for one
        // synchronous render must never be persisted under any circumstance.
        if (previewLock) return;
        state.savedAt = new Date().toISOString();
        try {
            localStorage.setItem(storageKey(concept), JSON.stringify(state));
            setSaveIndicator('saved');
            if (message) announce(message);
        } catch (error) {
            setSaveIndicator('failed');
            assertive.textContent = t('saveFailed');
            console.error('[Studio] local save failed', error);
        }
    }

    function setSaveIndicator(status) {
        const text = status === 'saved' ? t('saved') : status === 'saving' ? t('saving') : t('saveFailed');
        document.querySelectorAll('[data-save-state]').forEach(el => { el.textContent = text; });
    }

    function scheduleSave() {
        clearTimeout(saveTimer);
        setSaveIndicator('saving');
        saveTimer = setTimeout(() => saveState(), 180);
    }

    function announce(message) {
        live.textContent = '';
        requestAnimationFrame(() => { live.textContent = message; });
    }

    function wordCount(text) { return String(text || '').trim() ? String(text).trim().split(/\s+/).length : 0; }
    function shortDate(iso) { return new Intl.DateTimeFormat(state?.lang === 'es' ? 'es' : 'en', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso)); }
    const unknownGenre = {
        label: { en: 'Genre selection required', es: 'Se requiere elegir un género' },
        moves: { discover: [], review: [], council: [] },
    };
    function currentGenre() { return genres[state.genre] || (concept === 'integrated' ? unknownGenre : genres.neutral); }
    function genreLabel() { return currentGenre().label[state.lang === 'en' ? 'en' : 'es']; }
    // Rendered assignment names: full official name for menus and assistive
    // technology, compact label for tight header/chip contexts. Stored record
    // provenance keeps using .label and is untouched.
    function genreFullName(genre = currentGenre()) {
        const names = genre.fullName || genre.label;
        return names[state.lang === 'en' ? 'en' : 'es'];
    }
    function genreHeaderLabel(genre = currentGenre()) {
        const names = genre.headerLabel || genre.fullName || genre.label;
        return names[state.lang === 'en' ? 'en' : 'es'];
    }
    function storedGenreLabel(record) {
        if (state.lang === 'es' && record?.genreLabelEs) return record.genreLabelEs;
        if (record?.genreLabel) return record.genreLabel;
        if (record?.genre && genres[record.genre]) return genres[record.genre].label[state.lang === 'es' ? 'es' : 'en'];
        return state.lang === 'es' ? 'Género no guardado · registro anterior' : 'Genre not stored · earlier record';
    }
    function spellcheckEnabled() { return state.nativeSpellcheck !== false; }
    // Bilingual helper for surfaces built after the copy dictionary. The finalist
    // dropped 'both' mode here (Spanish only); the studio honors the student's
    // explicit Español + English choice, Spanish-primary, on every surface.
    function uiText(en, es) {
        if (state.lang === 'en') return en;
        if (state.lang === 'both' && en !== es) return `${es} · ${en}`;
        return es;
    }
    // ── C1-core: context-safe bilingual rendering ─────────────────────────
    // uiText() above stays the SAFE DEFAULT and is deliberately unchanged. It
    // returns PLAIN TEXT, which is what every non-markup sink requires:
    // aria-label and title attributes, placeholders, announce() live regions,
    // clipboard writes, native confirm(), string comparisons, and any value
    // that reaches a persisted record. In `Español + English` mode it returns
    // one flat "es · en" string with no language attribution — correct for
    // those sinks, but it is why a screen reader mispronounces the
    // non-primary language when that same string is rendered as visible text.
    //
    // uiMarkup() is its markup-returning sibling, and the ONLY sanctioned way
    // to emit an attributed bilingual string. It escapes each language
    // separately and wraps them in correctly attributed <span lang> elements,
    // mirroring the existing instruction() helper so this introduces no new
    // pattern. Contract, in both directions:
    //   • It RETURNS HTML. Interpolate it WITHOUT escapeHtml(), and only into
    //     a confirmed markup sink. Never into an attribute, a live region, a
    //     comparison, or anything persisted.
    //   • Single-language modes emit escaped text with NO wrapper, so `en` and
    //     `es` render byte-identically to escapeHtml(uiText(...)). Only the
    //     bilingual mode gains markup; en/es meaning and behavior are
    //     unchanged.
    //   • The visual result in bilingual mode is the same "es · en" the
    //     student already sees. The separator is aria-hidden so assistive
    //     technology reads two clean language runs instead of a stray middot.
    //
    // COUNTING BASIS — reconciling the audit's "306 call sites" with a direct
    // measurement of 143. Both are correct; they count different things in this
    // file, and the discrepancy was a measurement artifact, not a change:
    //   306 = raw occurrences of `uiText(`  (grep -o), of which
    //     1 = this function's own declaration, leaving
    //   305 = actual call sites, spread across
    //   143 = lines matching `uiText(`      (grep -c, which counts LINES),
    //         of which 142 carry calls and 1 is the declaration line.
    // Many lines hold several calls — one holds 16 — which is the whole gap.
    //
    // Those 305 call sites classify by OUTPUT CONTEXT as:
    //   154 escaped into an HTML template      ← convertible
    //    98 returned from a helper / held as a value (announcements, clipboard,
    //       native confirm(), comparisons, record fields)
    //    19 openDialog() title or subtitle (set as text by openDialog)
    //    14 announce() live regions
    //    11 aria-label / accessible name
    //     5 title attribute
    //     4 raw text inside an HTML template
    // The 98 + 14 + 11 + 5 = 128 non-markup sinks are exactly why uiText() must
    // stay plain: a blind change would emit literal markup into every one.
    //
    // Migration of the remaining classified call sites is C1-migration and is
    // deliberately NOT done here. A3's disclosure is this primitive's first and
    // so far only production consumer.
    function uiMarkup(en, es) {
        if (state.lang === 'en') return escapeHtml(en);
        if (state.lang === 'both' && en !== es) {
            return `<span lang="es">${escapeHtml(es)}</span><span aria-hidden="true"> · </span><span lang="en">${escapeHtml(en)}</span>`;
        }
        return escapeHtml(es);
    }
    // Block form for multi-line disclosure copy: each paragraph is an
    // independently attributed bilingual run. Same contract as uiMarkup().
    function uiMarkupList(pairs, tag = 'li') {
        return pairs.map(([en, es]) => `<${tag}>${uiMarkup(en, es)}</${tag}>`).join('');
    }
    function voiceEntries() { return state.voiceEntries || []; }
    // Truthful provider-aware copy. Current-mode surfaces (consent, buttons,
    // banner) reflect the ACTIVE provider; saved cards reflect the RECORD's
    // stored provenance, never the current mode.
    function liveProviderActive() { return (window.STUDIO_CONFIG || {}).provider === 'gemini'; }
    function consentText() {
        return liveProviderActive()
            ? uiText('I choose to send this exact text to the Tu Pana AI coach.', 'Elijo enviar este texto exacto al coach de IA de Tu Pana.')
            : t('consent');
    }
    // ── A3: truthful processor and data-treatment disclosure ──────────────
    // Founder-approved wording, 2026-08-06. Every constraint below is binding
    // and was ruled on explicitly; do not "tighten" this copy without a new
    // founder ruling:
    //   • Google Gemini is named regardless of which model serves the request.
    //     Model versions are deliberately ABSENT — they age faster than the
    //     disclosure and do not help a student decide whether to consent.
    //   • NO zero-retention claim. The Google paragraph states the paid-terms
    //     position and its limits in the same breath.
    //   • NO geographic claim in either direction. Placement is Default and
    //     Google's processing location is unaddressed; silence is the only
    //     truthful option.
    //   • Never implies the writing stays inside Tu Pana. The transit path
    //     browser → Tu Pana's coach service → Google Gemini is named in every
    //     tier.
    //   • Live and mock are distinguished truthfully and separately.
    //   • Gemini generates the COACHING FEEDBACK, never the student's writing.
    // Spanish register: "el servicio de acompañamiento de Tu Pana"; the
    // untranslated "coach" is deliberately absent from the Spanish disclosure.
    // Evidence base: founder-performed A1 (Tier 1 · Prepay, paid branch) and
    // A2 (Cloudflare logging/tracing/export disabled) console verifications.
    // A2 is a CONFIGURATION-STATE fact with recorded re-check triggers, which
    // is why the storage paragraph says what is configured, not what is
    // eternally true.
    const A3 = {
        consentLine: {
            live: [
                'The writing shown above is sent only because you chose to send it. It travels from your browser through Tu Pana’s coach service to Google Gemini, which generates the coaching feedback. Tu Pana’s service is not designed to store or log your writing.',
                'El texto que se muestra arriba se envía únicamente porque tú elegiste enviarlo. Viaja desde tu navegador, a través del servicio de acompañamiento de Tu Pana, hasta Google Gemini, que genera la orientación. El servicio de Tu Pana no está diseñado para guardar ni registrar el contenido de tu escritura.',
            ],
            mock: [
                'Your writing is not sent for AI processing. No request is made to Tu Pana’s coach service or to an AI provider.',
                'Tu escritura no se envía para ser procesada por IA. No se hace ninguna solicitud al servicio de acompañamiento de Tu Pana ni a un proveedor de IA.',
            ],
        },
        summary: ['What happens to my writing?', '¿Qué pasa con mi escritura?'],
        live: [
            ['Your draft, notes, and saved work stay in this browser on this device. Tu Pana does not send your writing for AI processing while you type.',
                'Tu borrador, tus notas y tu trabajo guardado permanecen en este navegador, en este dispositivo. Tu Pana no envía tu escritura para ser procesada por IA mientras escribes.'],
            ['When you choose to send, the AI request includes the portion of your writing and any other content you explicitly chose to attach, all shown in the consent preview, plus the instructions Tu Pana needs to provide genre-specific coaching. No other part of your draft is included.',
                'Cuando eliges enviar, la solicitud de IA incluye el fragmento de tu escritura y cualquier otro contenido que hayas decidido adjuntar, todo visible en la vista previa de consentimiento, además de las instrucciones que Tu Pana necesita para ofrecer orientación específica para ese género. Ninguna otra parte del borrador se incluye.'],
            ['The request travels from your browser to Tu Pana’s coach service (a Cloudflare Worker), and from there to Google Gemini, which generates the coaching feedback.',
                'La solicitud viaja desde tu navegador al servicio de acompañamiento de Tu Pana (un Worker de Cloudflare) y de ahí a Google Gemini, que genera la orientación.'],
            ['Tu Pana’s service is not designed to store or log your writing. On Cloudflare, content logging, tracing, and export are disabled. Cloudflare still retains content-free aggregate operational metrics such as request counts, errors, and CPU time.',
                'El servicio de Tu Pana no está diseñado para guardar ni registrar el contenido de tu escritura. En Cloudflare, el registro de contenido, el rastreo y la exportación están desactivados. Cloudflare conserva métricas operativas agregadas que no contienen la escritura, como la cantidad de solicitudes, los errores y el tiempo de CPU.'],
            ['Under Tu Pana’s paid Gemini terms, Google does not use prompts or responses to improve its products. Google may temporarily log prompts and responses for abuse monitoring, and processes technical usage information needed to operate and maintain the service. This is not a zero-retention promise.',
                'Bajo los términos del servicio de pago de Gemini de Tu Pana, Google no utiliza los textos enviados —los prompts— ni las respuestas para mejorar sus productos. Google puede registrarlos temporalmente para detectar usos indebidos. Google también procesa información técnica de uso necesaria para operar y mantener el servicio. Esto no es una promesa de retención cero.'],
            ['You can complete the entire writing process without using AI at all.',
                'Puedes completar todo el proceso de escritura sin usar IA.'],
        ],
        mock: [
            ['This copy of the Studio is running the local practice coach, inside this page.',
                'Esta copia del Studio usa una herramienta local de práctica que funciona dentro de esta página.'],
            ['Your writing is not sent for AI processing. No request is made to Tu Pana’s coach service or to an AI provider.',
                'Tu escritura no se envía para ser procesada por IA. No se hace ninguna solicitud al servicio de acompañamiento de Tu Pana ni a un proveedor de IA.'],
            ['Your draft, notes, and saved work stay in this browser on this device.',
                'Tu borrador, tus notas y tu trabajo guardado permanecen en este navegador, en este dispositivo.'],
            ['When a copy of the Studio is connected to the live coach service, the writing you consent to send travels to Google Gemini, which generates the coaching feedback. This copy is not connected.',
                'Cuando una copia del Studio está conectada al servicio de acompañamiento en vivo, la escritura que autorizas a enviar viaja hasta Google Gemini, que genera la orientación. Esta copia no está conectada.'],
        ],
        help: [
            [['While you write', 'Mientras escribes'],
                ['Everything you write in the Studio — draft, notebook, Your Voice entries, decisions, saved reviews — is stored by your browser on this device. Tu Pana has no account system and no server copy of your work. Tu Pana does not send your writing for AI processing while you type. Clearing this browser’s storage deletes the copy kept by this browser. That copy cannot be recovered unless you previously created a backup.',
                    'Todo lo que escribes en el Studio — borrador, cuaderno, entradas de Tu voz, decisiones, revisiones guardadas — lo guarda tu navegador en este dispositivo. Tu Pana no tiene sistema de cuentas ni copia en un servidor. Tu Pana no envía tu escritura para ser procesada por IA mientras escribes. Al borrar el almacenamiento de este navegador, se elimina la copia guardada por este navegador. Esa copia no puede recuperarse a menos que hayas creado antes un respaldo.']],
            [['When you ask for AI help', 'Cuando pides ayuda de IA'],
                ['Nothing is sent for AI processing until you check the consent box, and you always see the exact writing first. The AI request includes the portion of your writing and any other content you explicitly chose to attach, all shown in the consent preview, plus the instructions Tu Pana needs to provide genre-specific coaching. No other part of your draft is included. It travels from your browser to Tu Pana’s coach service, which runs as a Cloudflare Worker, and from there to Google Gemini, which generates the coaching feedback.',
                    'Nada se envía para ser procesado por IA hasta que marcas la casilla de consentimiento, y siempre ves antes el texto exacto. La solicitud de IA incluye el fragmento de tu escritura y cualquier otro contenido que hayas decidido adjuntar, todo visible en la vista previa de consentimiento, además de las instrucciones que Tu Pana necesita para ofrecer orientación específica para ese género. Ninguna otra parte del borrador se incluye. Viaja desde tu navegador al servicio de acompañamiento de Tu Pana, que funciona como un Worker de Cloudflare, y de ahí a Google Gemini, que genera la orientación.']],
            [['Storage and logging', 'Almacenamiento y registros'],
                ['Tu Pana’s coach service is not designed to store or log your writing. On Cloudflare, content logging, tracing, and export are disabled. Cloudflare still retains content-free aggregate operational metrics such as request counts, errors, and CPU time.',
                    'El servicio de acompañamiento de Tu Pana no está diseñado para guardar ni registrar el contenido de tu escritura. En Cloudflare, el registro de contenido, el rastreo y la exportación están desactivados. Cloudflare conserva métricas operativas agregadas que no contienen la escritura, como la cantidad de solicitudes, los errores y el tiempo de CPU.']],
            [['How Google handles the request', 'Cómo maneja Google la solicitud'],
                ['Under Tu Pana’s paid Gemini terms, Google does not use prompts or responses to improve its products. Google may temporarily log prompts and responses for abuse monitoring. Google also processes technical usage information needed to operate and maintain the service. This is not a zero-retention promise.',
                    'Bajo los términos del servicio de pago de Gemini de Tu Pana, Google no utiliza los textos enviados —los prompts— ni las respuestas para mejorar sus productos. Google puede registrarlos temporalmente para detectar usos indebidos. Google también procesa información técnica de uso necesaria para operar y mantener el servicio. Esto no es una promesa de retención cero.']],
            [['What we do not claim', 'Lo que no afirmamos'],
                ['We do not claim that requests are processed in a particular country or region. The statements above describe Tu Pana’s code and current configuration. Google and Cloudflare may also perform their own platform processing under their applicable terms.',
                    'No afirmamos que las solicitudes se procesen en un país o una región determinados. Las explicaciones anteriores describen el código y la configuración actual de Tu Pana. Google y Cloudflare también pueden realizar sus propios procesos de plataforma conforme a los términos aplicables.']],
            [['What you control', 'Lo que tú controlas'],
                ['You can use the entire Studio without AI — write, revise, reflect, and finish without sending anything for AI processing. When you do send, you choose the exact words, and you decide whether to accept, adapt, or reject anything the coach says.',
                    'Puedes usar todo el Studio sin IA: escribir, revisar, reflexionar y terminar sin enviar nada para ser procesado por IA. Cuando envías, tú eliges las palabras exactas y tú decides si aceptas, adaptas o rechazas lo que sugiera el servicio de acompañamiento.']],
        ],
    };
    function a3ConsentPair() { return liveProviderActive() ? A3.consentLine.live : A3.consentLine.mock; }
    // The first production consumer of the C1-core primitive. MARKUP SINK ONLY:
    // interpolate without escapeHtml(). A plain-text form is deliberately not
    // kept here — nothing needs one, and `uiText(...a3ConsentPair())` is the
    // one-line answer if an announcement or record ever does.
    function boundaryMarkup() { return uiMarkup(...a3ConsentPair()); }
    // Tier 2: the expandable "What happens to my writing?" disclosure shown at
    // the consent moment. Opt-in, so the consent line itself stays short.
    function a3DisclosureMarkup() {
        const rows = liveProviderActive() ? A3.live : A3.mock;
        return `<details class="a3-disclosure"><summary>${uiMarkup(...A3.summary)}</summary><ul class="a3-disclosure-list">${uiMarkupList(rows)}</ul></details>`;
    }
    function sendCoachLabel() { return liveProviderActive() ? uiText('Send to Tu Pana coach', 'Enviar al coach de Tu Pana') : t('sendCoach'); }
    function sendReviewLabel() { return liveProviderActive() ? uiText('Request review', 'Pedir revisión') : t('sendReview'); }
    function conveneLabel() { return liveProviderActive() ? uiText('Convene the Council', 'Convocar al Consejo') : t('convene'); }
    function appearanceName(value = state.appearance || 'system') {
        const labels = state.lang === 'en'
            ? { system: 'System default', light: 'Paper', dark: 'Dark' }
            : { system: 'Sistema', light: 'Papel', dark: 'Oscuro' };
        return labels[value] || labels.system;
    }
    function nextAppearance(value = state.appearance || 'system') { return value === 'system' ? 'light' : value === 'light' ? 'dark' : 'system'; }
    function applyAppearance() {
        document.documentElement.dataset.appearance = state?.appearance || 'system';
        document.documentElement.style.colorScheme = state?.appearance === 'dark' ? 'dark' : state?.appearance === 'light' ? 'light' : 'light dark';
    }
    function setAppearance(value) {
        if (!['system', 'light', 'dark'].includes(value)) return;
        state.appearance = value;
        applyAppearance();
        saveState(uiText(`Appearance: ${appearanceName()}.`, `Apariencia: ${appearanceName()}.`));
        document.querySelectorAll('[data-appearance-current]').forEach(el => { el.textContent = appearanceName(); });
    }
    function genreOptionsMarkup() {
        const selectable = Object.entries(genres).filter(([id]) => concept === 'integrated' || id !== 'autobiographical');
        const invalid = !genres[state.genre] ? `<option value="" selected disabled>${escapeHtml(state.lang === 'en' ? 'Select a configured genre' : 'Elige un género configurado')}</option>` : '';
        return `${invalid}${selectable.map(([id, genre]) => `<option value="${id}" ${id === state.genre ? 'selected' : ''}>${escapeHtml(genreFullName(genre))}</option>`).join('')}`;
    }
    function genreMoves(kind) {
        if (state.lang === 'en') return currentGenre().moves[kind];
        if (concept === 'integrated' && !genres[state.genre]) return [];
        return (genreMovesEs[state.genre] || genreMovesEs.neutral)[kind];
    }

    function storeActiveGenreState() {
        if (concept !== 'integrated' || !state.genre) return;
        state.genreStates ||= {};
        state.genreStates[state.genre] = {
            reflections: { ...state.reflections }, reflectionSavedAt: state.reflectionSavedAt,
            finishChecks: { ...state.finishChecks }, knowledgeChoice: state.knowledgeChoice,
            knowledgeChoiceAt: state.knowledgeChoiceAt, onboardingSeenAt: state.onboardingSeenAt,
        };
    }

    function loadActiveGenreState(genreId) {
        if (concept !== 'integrated') return;
        const saved = state.genreStates?.[genreId];
        state.reflections = { changed: '', decision: '', voice: '', knowledge: '', ...(saved?.reflections || {}) };
        state.reflectionSavedAt = saved?.reflectionSavedAt || null;
        state.finishChecks = { ...(saved?.finishChecks || {}) };
        state.knowledgeChoice = saved?.knowledgeChoice ?? null;
        state.knowledgeChoiceAt = saved?.knowledgeChoiceAt || null;
        state.onboardingSeenAt = saved?.onboardingSeenAt || null;
    }
    function notebookCards() { return genreNotebooks[state.genre] || genreNotebooks.neutral; }
    function notebookCardLabel(card) { return card[state.lang === 'en' ? 'en' : 'es']; }
    function notebookCardPrompt(card) { return card[state.lang === 'en' ? 'promptEn' : 'promptEs']; }
    function activeNotebookCard() { return notebookCards()[Math.min(state.activeNotebook, notebookCards().length - 1)]; }
    function notebookEntryKey(card) { return `${state.genre}:${card.id}`; }
    function integratedMoves() { return integratedMoveProfiles[state.genre] || (state.genre === 'neutral' ? integratedMoveProfiles.neutral : []); }
    function integratedMoveLabel(move) { return move[state.lang === 'en' ? 'en' : 'es']; }
    function integratedMoveNudge(move) { return move[state.lang === 'en' ? 'nudgeEn' : 'nudgeEs']; }
    function integratedMoveWhy(move) { return move[state.lang === 'en' ? 'whyEn' : 'whyEs']; }
    function integratedMovePrompt(move) { return move[state.lang === 'en' ? 'promptEn' : 'promptEs']; }
    function integratedMoveDeeper(move) {
        const deeper = moveDeeper[state.genre]?.[move.id];
        return deeper ? (state.lang === 'en' ? deeper.en : deeper.es) : '';
    }
    function integratedMoveExample(move) {
        if (!move.exampleEn?.length || !move.exampleEs?.length) return '';
        const rows = move.exampleEn.map((entry, index) => {
            const es = move.exampleEs[index] || ['', ''];
            return `<div><dt>${escapeHtml(uiText(entry[0], es[0]))}</dt><dd>${escapeHtml(uiText(entry[1], es[1]))}</dd></div>`;
        }).join('');
        return `<details class="move-example"><summary>${escapeHtml(uiText('See a quick example', 'Ver un ejemplo breve'))}</summary><p class="example-boundary">${escapeHtml(uiText('Hypothetical structure—not suggested content.', 'Estructura hipotética; no es contenido sugerido.'))}</p><dl>${rows}</dl><p class="example-ownership">${escapeHtml(uiText('Use your own facts and wording.', 'Usa tus propios hechos y palabras.'))}</p></details>`;
    }
    function moveNoteKey(move) { return `${state.genre}:${move.id}`; }
    function draftSignature(text = getDraft()) { return `${text.length}:${text.slice(0, 24)}`; }
    function draftInvitationKey() { return `${state.createdAt}:${state.genre}`; }
    function passageContext(selection = captured) {
        if (!selection?.hasSelection || !selection.text?.trim()) return null;
        const full = selection.full || getDraft();
        const start = Number.isFinite(selection.start) ? selection.start : full.indexOf(selection.text);
        const end = Number.isFinite(selection.end) ? selection.end : start + selection.text.length;
        return {
            quote: selection.text,
            paragraph: selection.paragraph || '',
            before: start >= 0 ? full.slice(Math.max(0, start - 90), start) : '',
            after: end >= 0 ? full.slice(end, Math.min(full.length, end + 90)) : '',
            capturedAt: selection.capturedAt || new Date().toISOString(),
            draftSignature: draftSignature(full),
        };
    }
    function resolvePassageLink(link) {
        if (!link?.quote) return { status: 'none', label: '' };
        const draft = getDraft();
        if (draft.includes(link.quote)) return { status: 'exact', label: uiText('Exact quotation is still in the current draft.', 'La cita exacta todavía está en el borrador actual.') };
        const before = String(link.before || '').trim().slice(-32);
        const after = String(link.after || '').trim().slice(0, 32);
        if ((before && draft.includes(before)) || (after && draft.includes(after)) || (link.paragraph && draft.includes(link.paragraph))) {
            return { status: 'context', label: uiText('Nearby context remains; the saved quotation may have changed.', 'El contexto cercano permanece; la cita guardada puede haber cambiado.') };
        }
        return { status: 'saved', label: uiText('Saved quotation only; its current location is not assumed.', 'Solo cita guardada; no se presupone su ubicación actual.') };
    }
    function linkedMoveNotesForSelection(selection = captured) {
        if (!selection?.hasSelection || !selection.text?.trim()) return [];
        return integratedMoves().map((move, index) => ({ move, index, note: state.moveNotes[moveNoteKey(move)] }))
            .filter(({ note }) => note?.passageLink?.quote && (note.passageLink.quote === selection.text || note.passageLink.quote.includes(selection.text) || selection.text.includes(note.passageLink.quote)));
    }
    function criticalQuestion(key) { return criticalQuestions[key] || criticalQuestions.thinking; }
    function criticalQuestionText(key) { return criticalQuestion(key)[state.lang === 'en' ? 'en' : 'es']; }
    function criticalRiskText(key, genre = state.genre) {
        if (genre !== 'autobiographical') return '';
        if (key === 'cultural') return state.lang === 'en'
            ? 'Could this response stereotype, depoliticize, or misread culturally situated knowledge?'
            : '¿Podría esta respuesta estereotipar, despolitizar o malinterpretar conocimiento culturalmente situado?';
        if (key === 'voice') return state.lang === 'en'
            ? 'Could this response genericize or flatten multilingual, family, community, or dialectal meaning?'
            : '¿Podría esta respuesta volver genérico o aplanar un significado multilingüe, familiar, comunitario o dialectal?';
        return state.lang === 'en'
            ? 'Could this response remove the history, power, or standpoint that makes the passage meaningful?'
            : '¿Podría esta respuesta borrar la historia, el poder o la perspectiva que da significado al pasaje?';
    }
    // Data-driven contextual-question selection (replaces the finalist's
    // display-label regex): council/lens/coach keys come from the profile registry.
    function integratedCriticalKey(kind, lensIndex = null) {
        if (kind === 'council') return councilConfig[state.genre]?.criticalKey || 'cultural';
        const lensKeys = lensCriticalKeys[state.genre];
        if (Number.isInteger(lensIndex) && lensKeys && lensKeys[lensIndex]) return lensKeys[lensIndex];
        return coachCriticalKeys[state.genre] || 'thinking';
    }

    function councilEnabled(genreId = state.genre) {
        return councilConfig[genreId]?.enabled === true;
    }

    // Additive genre guidance carried to the coach. Absent for profiles that
    // declare none, in which case the prompt header omits the line entirely.
    function genreCoachRules(genreId = state.genre) {
        return (genres[genreId] || {}).coachRules || undefined;
    }

    // A profile may say in its own words why its Council is unavailable. Without
    // one, the generic line stands.
    function councilUnavailableText(genreId = state.genre) {
        const reason = councilConfig[genreId]?.disabledReason;
        if (!reason) return t('councilUnavailable');
        return state.lang === 'en' ? reason.en : reason.es;
    }

    function renderBanner() {
        const text = liveProviderActive()
            ? uiText('Family preview — the AI coach is live, used only with your explicit consent. Do not paste sensitive personal information.', 'Vista familiar — el coach de IA está en vivo y se usa solo con tu consentimiento explícito. No pegues información personal sensible.')
            : t('prototype');
        return `<div class="exploration-banner"><span class="banner-dot" aria-hidden="true"></span><strong>${escapeHtml(text)}</strong></div>`;
    }

    function orientation() {
        let where, doing, next;
        if (concept === 'desk') {
            where = t('whereDesk'); doing = t('doingDesk'); next = t('nextDesk');
        } else if (concept === 'integrated') {
            where = t('whereDesk');
            doing = state.lang === 'en' ? 'Write one draft. Use a Move or coach when helpful.' : 'Escribe un borrador. Usa una Movida o el coach cuando ayude.';
            next = state.lang === 'en' ? 'Next: draft, make a note, or ask for review.' : 'Próximo: redacta, haz una nota o pide revisión.';
        } else if (concept === 'journey') {
            where = t('whereJourney', { n: state.step }); doing = t('doingJourney');
            next = t('nextJourney', { next: state.step < 10 ? stepData(state.step)[0] : t('finish') });
        } else if (concept === 'hybrid') {
            where = t('whereHybrid', { n: state.phase }); doing = t('doingHybrid');
            next = t('nextHybrid', { next: state.phase < 4 ? phaseData(state.phase)[0] : t('finish') });
        } else {
            const card = activeNotebookCard();
            where = state.place === 'draft' ? t('draft') : t('notebook');
            doing = state.place === 'draft' ? t('authorshipBoundary') : t('notebookPurpose');
            next = state.place === 'draft'
                ? (state.draftDeclared ? `${t('nextDesk')}` : t('writeDraft'))
                : (state.activeNotebook < notebookCards().length - 1 ? t('nextCard', { name: notebookCardLabel(notebookCards()[state.activeNotebook + 1]) }) : t('writeDraft'));
        }
        return { where, doing, next };
    }

    // The original Tu Pana brand mark — the animated laptop-and-coffee writing
    // companion — carried over verbatim from the legacy application's header
    // (index.html .header-logo). Decorative here: the product title names the
    // product; animation is disabled under prefers-reduced-motion in CSS.
    function brandIconSvg() {
        return `<span class="brand-icon" aria-hidden="true"><svg viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg" focusable="false"><circle class="tp-av-bg" cx="120" cy="110" r="96"/><circle class="tp-av-glow" cx="120" cy="110" r="76"/><ellipse fill="rgba(49,86,66,0.14)" cx="130" cy="178" rx="94" ry="15"/><path class="tp-av-laptop" d="M49 51H158C164 51,169 56,169 62V139H38V62C38 56,43 51,49 51Z"/><rect class="tp-av-screen" x="52" y="65" width="103" height="61" rx="8"/><rect class="tp-av-screen-inner" x="62" y="76" width="83" height="39" rx="6"/><path class="tp-av-line" d="M70 86 H130"/><path class="tp-av-line l2" d="M70 98 H122"/><path class="tp-av-line l3" d="M70 110 H111"/><rect class="tp-av-cursor" x="133" y="82" width="4" height="12" rx="1"/><path class="tp-av-base" d="M28 139H179L196 163C198 166,195 170,190 170H17C12 170,10 166,13 163Z"/><rect class="tp-av-trackpad" x="80" y="150" width="44" height="10" rx="4"/><rect class="tp-av-key" x="43" y="149" width="8" height="5" rx="2"/><rect class="tp-av-key" x="56" y="149" width="8" height="5" rx="2"/><rect class="tp-av-key" x="69" y="149" width="8" height="5" rx="2"/><rect class="tp-av-key" x="132" y="149" width="8" height="5" rx="2"/><rect class="tp-av-key" x="145" y="149" width="8" height="5" rx="2"/><rect class="tp-av-key" x="158" y="149" width="8" height="5" rx="2"/><path class="tp-av-spark" d="M181 45L185 54L194 58L185 62L181 71L177 62L168 58L177 54Z"/><ellipse class="tp-av-saucer" cx="211" cy="165" rx="30" ry="8"/><path class="tp-av-cup" d="M188 121H229L224 158C222 166,195 166,193 158Z"/><ellipse class="tp-av-coffee" cx="208.5" cy="122" rx="19" ry="5"/><path class="tp-av-handle" d="M229 132C243 132,243 153,227 153"/><path class="tp-av-steam" d="M199 108 C192 98,206 93,199 82"/><path class="tp-av-steam s2" d="M211 109 C204 98,218 92,211 80"/><path class="tp-av-steam s3" d="M223 108 C216 98,230 93,223 82"/></svg></span>`;
    }

    function renderHeader() {
        const o = orientation();
        const appearanceControl = concept === 'integrated'
            ? `<button class="icon-button appearance-button" data-action="appearance-cycle" aria-label="${escapeHtml(uiText(`Appearance: ${appearanceName()}. Switch to ${appearanceName(nextAppearance())}.`, `Apariencia: ${appearanceName()}. Cambiar a ${appearanceName(nextAppearance())}.`))}" title="${escapeHtml(uiText(`Appearance: ${appearanceName()}`, `Apariencia: ${appearanceName()}`))}">◐</button><button class="icon-button" data-action="help" aria-label="${escapeHtml(uiText('Help', 'Ayuda'))}" title="${escapeHtml(uiText('Help', 'Ayuda'))}">?</button>`
            : '';
        const genreKnown = Boolean(genres[state.genre]);
        return `${renderBanner()}
            <header class="prototype-header"><div class="prototype-header-inner">
                <div class="brand-lockup">${brandIconSvg()}<div class="brand-copy">
                    <strong class="product-title">Tu Pana Writing Studio</strong>
                    <span class="genre-select-wrap"><span class="genre-select-face" aria-hidden="true">${escapeHtml(genreKnown ? genreHeaderLabel() : (state.lang === 'en' ? 'Choose a writing project' : 'Elige un proyecto'))}<span class="genre-select-caret">▾</span></span><select class="header-select genre-select" data-action="genre" aria-label="${escapeHtml(`${t('genre')}: ${genreKnown ? genreFullName() : ''}`)}">${genreOptionsMarkup()}</select></span>
                </div></div>
                <div class="prototype-actions"><select class="header-select" data-action="language" aria-label="${escapeHtml(t('language'))}"><option value="en" ${state.lang === 'en' ? 'selected' : ''}>English</option><option value="es" ${state.lang === 'es' ? 'selected' : ''}>Español</option><option value="both" ${state.lang === 'both' ? 'selected' : ''}>Español + English</option></select>
                    ${appearanceControl}<button class="icon-button" data-action="settings" aria-label="${escapeHtml(t('settings'))}" title="${escapeHtml(t('settings'))}">⚙</button></div>
            </div></header>
            <section class="orientation-bar" aria-label="Current location and next action"><div class="orientation-inner"><div class="orientation-copy"><span class="location-pill">${escapeHtml(o.where)}</span><div class="orientation-text"><strong>${escapeHtml(o.doing)}</strong><span>${escapeHtml(o.next)}</span></div>${concept === 'integrated' ? `<button class="mobile-project-chip" data-action="settings" aria-label="${escapeHtml(`${t('genre')}: ${genres[state.genre] ? genreFullName() : state.genre}`)}"><span>${escapeHtml(t('genre'))}</span><strong>${escapeHtml(genres[state.genre] ? genreHeaderLabel() : genreLabel())}</strong></button>` : ''}</div><div class="orientation-next"><small>${escapeHtml(t('currentDraft'))}</small><strong id="orientationDraftWords">${concept === 'notebook' && !state.draftDeclared ? escapeHtml(t('draftMissing')) : `${wordCount(getDraft())} ${escapeHtml(state.lang !== 'en' ? 'palabras' : 'words')}`}</strong></div></div></section>`;
    }

    function renderApp() {
        document.documentElement.lang = state.lang === 'en' ? 'en' : 'es';
        document.body.dataset.concept = concept;
        applyAppearance();
        const content = state.view === 'reflection' ? renderReflectionPage() : state.view === 'finish' ? renderFinishPage() : renderWorkspace();
        root.innerHTML = `${renderHeader()}<div class="prototype-main">${content}</div><button class="button primary focus-exit" data-action="exit-focus">${escapeHtml(t('exitFocus'))}</button>${renderPassageBar()}`;
        bindEditor();
        bindNotebookEditor();
        bindEditSurfaces();
        updateVisualViewport();
        requestAnimationFrame(ensureCurrentSwitcherVisible);
    }

    function ensureCurrentSwitcherVisible() {
        const switcher = document.querySelector('.concept-switcher');
        const current = switcher?.querySelector('[aria-current="page"]');
        if (!switcher || !current || switcher.scrollWidth <= switcher.clientWidth) return;
        switcher.scrollLeft = Math.max(0, current.offsetLeft - (switcher.clientWidth - current.offsetWidth) / 2);
    }

    function getDraft() {
        if (concept !== 'journey') return state.draft || '';
        return state.artifacts[`step-${state.step}`]?.text ?? state.draft ?? '';
    }

    function setDraft(text) {
        state.draft = text;
        if (concept === 'journey') {
            const key = `step-${state.step}`;
            state.artifacts[key] = { text, updatedAt: new Date().toISOString(), label: stepData(state.step - 1)[0] };
        }
        scheduleSave();
    }

    function editSurfaceKey(field) { return field?.dataset.editKey || field?.id || ''; }
    function ensureEditHistory(field) {
        if (!field || !/^(TEXTAREA|INPUT)$/.test(field.tagName)) return null;
        const key = editSurfaceKey(field);
        if (!key) return null;
        if (!editHistories.has(key)) editHistories.set(key, { stack: [field.value], index: 0, restoring: false });
        return editHistories.get(key);
    }
    function setActiveEditSurface(field) {
        if (!field || !/^(TEXTAREA|INPUT)$/.test(field.tagName)) return;
        activeEditSurface = field;
        ensureEditHistory(field);
        updateEditControls();
    }
    function recordEditInput(field) {
        const history = ensureEditHistory(field);
        if (!history || history.restoring) return;
        if (history.stack[history.index] === field.value) return;
        history.stack.splice(history.index + 1);
        history.stack.push(field.value);
        if (history.stack.length > 100) history.stack.shift();
        history.index = history.stack.length - 1;
        updateEditControls();
    }
    function currentEditSurface() {
        if (activeEditSurface && document.contains(activeEditSurface)) return activeEditSurface;
        if (document.activeElement?.matches?.('textarea, input[type="text"]')) return document.activeElement;
        return document.getElementById('draftEditor');
    }
    function updateEditControls() {
        const field = currentEditSurface();
        const history = ensureEditHistory(field);
        document.querySelectorAll('[data-action="edit-undo"]').forEach(button => { button.disabled = !history || history.index <= 0; });
        document.querySelectorAll('[data-action="edit-redo"]').forEach(button => { button.disabled = !history || history.index >= history.stack.length - 1; });
    }
    function applyEditHistory(direction) {
        const field = currentEditSurface();
        const history = ensureEditHistory(field);
        if (!field || !history) return;
        const next = history.index + direction;
        if (next < 0 || next >= history.stack.length) return;
        history.restoring = true;
        history.index = next;
        field.value = history.stack[next];
        field.dispatchEvent(new Event('input', { bubbles: true }));
        history.restoring = false;
        field.focus();
        updateEditControls();
        announce(uiText(direction < 0 ? 'Undid the last in-session edit. This is not a draft snapshot.' : 'Redid the in-session edit.', direction < 0 ? 'Se deshizo la última edición de esta sesión. No es una instantánea del borrador.' : 'Se rehízo la edición de esta sesión.'));
    }
    async function copyTextWithFallback(text, success, unavailable) {
        try {
            if (!navigator.clipboard?.writeText) throw new Error('Clipboard write unavailable');
            await navigator.clipboard.writeText(text);
            announce(success);
            return true;
        } catch (error) {
            announce(unavailable);
            return false;
        }
    }
    function selectedEditRange(field) {
        if (!field || !Number.isFinite(field.selectionStart) || field.selectionEnd <= field.selectionStart) return null;
        return { start: field.selectionStart, end: field.selectionEnd, text: field.value.slice(field.selectionStart, field.selectionEnd) };
    }
    async function runEditAction(action) {
        const field = currentEditSurface();
        if (!field) return;
        setActiveEditSurface(field);
        if (action === 'edit-select-all') {
            field.focus(); field.select(); announce(uiText('Selected this writing field.', 'Se seleccionó este campo de escritura.')); return;
        }
        const selected = selectedEditRange(field);
        if (action === 'edit-copy') {
            if (!selected) return announce(uiText('Select text first.', 'Selecciona texto primero.'));
            return copyTextWithFallback(selected.text, uiText('Copied locally to your device clipboard.', 'Copiado localmente al portapapeles de tu dispositivo.'), uiText('Copy is unavailable here. Use your device’s Edit menu.', 'Copiar no está disponible aquí. Usa el menú Editar de tu dispositivo.'));
        }
        if (action === 'edit-cut') {
            if (!selected) return announce(uiText('Select text first.', 'Selecciona texto primero.'));
            const copied = await copyTextWithFallback(selected.text, '', uiText('Cut is unavailable here. Use your device’s Edit menu.', 'Cortar no está disponible aquí. Usa el menú Editar de tu dispositivo.'));
            if (!copied) return;
            field.setRangeText('', selected.start, selected.end, 'start');
            field.dispatchEvent(new Event('input', { bubbles: true }));
            announce(uiText('Cut. Your writing is still saved locally.', 'Cortado. Tu escritura sigue guardada localmente.'));
            return;
        }
        if (action === 'edit-paste') {
            try {
                if (!navigator.clipboard?.readText) throw new Error('Clipboard read unavailable');
                const text = await navigator.clipboard.readText();
                const start = field.selectionStart ?? field.value.length;
                const end = field.selectionEnd ?? start;
                field.setRangeText(text, start, end, 'end');
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.focus();
                announce(uiText('Pasted into this writing field.', 'Pegado en este campo de escritura.'));
            } catch (error) {
                announce(uiText('Paste is unavailable here. Use your device’s Edit menu.', 'Pegar no está disponible aquí. Usa el menú Editar de tu dispositivo.'));
            }
        }
    }
    function renderEditControls(context = 'draft') {
        const label = uiText('Edit writing', 'Editar escritura');
        return `<div class="edit-utility ${context === 'dialog' ? 'dialog-edit-utility' : ''}" aria-label="${escapeHtml(label)}"><button class="icon-button" data-action="edit-undo" aria-label="${escapeHtml(uiText('Undo in-session edit', 'Deshacer edición de esta sesión'))}" title="${escapeHtml(uiText('Undo', 'Deshacer'))}">↶</button><button class="icon-button" data-action="edit-redo" aria-label="${escapeHtml(uiText('Redo in-session edit', 'Rehacer edición de esta sesión'))}" title="${escapeHtml(uiText('Redo', 'Rehacer'))}">↷</button><details class="edit-menu"><summary aria-label="${escapeHtml(uiText('Edit options', 'Opciones de edición'))}">${escapeHtml(uiText('Edit', 'Editar'))}</summary><div class="edit-menu-popover"><button data-action="edit-cut">${escapeHtml(uiText('Cut', 'Cortar'))}</button><button data-action="edit-copy">${escapeHtml(uiText('Copy', 'Copiar'))}</button><button data-action="edit-paste">${escapeHtml(uiText('Paste', 'Pegar'))}</button><button data-action="edit-select-all">${escapeHtml(uiText('Select all', 'Seleccionar todo'))}</button></div></details></div>`;
    }

    function setView(view) {
        state.view = view;
        saveState();
        renderApp();
        requestAnimationFrame(() => root.focus());
    }

    function renderWorkspace() {
        if (concept === 'desk') return renderDeskWorkspace();
        if (concept === 'integrated') {
            if (!genres[state.genre]) return renderGenreConfigurationError();
            // A genuinely new, empty workspace meets Guided Discovery's welcome
            // before the Desk's full choice architecture. The genre and language
            // already resolved above it are untouched, so skipping lands on the
            // correct Desk for the link the writer arrived through.
            if (window.StudioTour?.shouldOfferFirstRun(tourContext())) return window.StudioTour.firstRunHtml(tourContext());
            return renderIntegratedWorkspace();
        }
        if (concept === 'journey') return renderJourneyWorkspace();
        if (concept === 'hybrid') return renderHybridWorkspace();
        return renderNotebookWorkspace();
    }

    function renderGenreConfigurationError() {
        return `<section class="finish-page" aria-labelledby="genreErrorTitle"><div class="finish-hero"><p class="eyebrow">${escapeHtml(state.lang === 'en' ? 'Configuration required' : 'Configuración requerida')}</p><h2 id="genreErrorTitle">${escapeHtml(state.lang === 'en' ? 'This writing genre is not configured.' : 'Este género de escritura no está configurado.')}</h2><p>${escapeHtml(state.lang === 'en' ? `The assignment id “${state.genre}” will not inherit Autobiographical or General Writing guidance. Choose a configured writing project.` : `La tarea “${state.genre}” no heredará guía autobiográfica ni general. Elige un proyecto de escritura configurado.`)}</p><button class="button secondary" data-action="settings">${escapeHtml(state.lang === 'en' ? 'Choose writing project' : 'Elegir proyecto de escritura')}</button></div></section>`;
    }

    function renderNotebookWorkspace() {
        return `${renderNotebookPlaces()}${state.place === 'draft' && state.draftDeclared ? renderNotebookDraft() : renderNotebook()}`;
    }

    function renderNotebookPlaces() {
        const draftAction = state.draftDeclared ? 'place-draft' : 'create-draft';
        return `<nav class="phase-strip notebook-places" aria-label="Notebook and draft places"><button class="phase-tab" data-action="place-notebook" ${state.place !== 'draft' ? 'aria-current="page"' : ''}><strong>${escapeHtml(t('notebook'))}</strong><span id="notebookPlaceCount">${Object.values(state.notebookEntries).filter(entry => wordCount(entry.text)).length}/${notebookCards().length}</span></button><button class="phase-tab" data-action="${draftAction}" ${state.place === 'draft' ? 'aria-current="page"' : ''}><strong>${escapeHtml(t('draft'))}</strong><span id="draftPlaceCount">${escapeHtml(state.draftDeclared ? t('words', { n: wordCount(state.draft) }) : t('draftMissing'))}</span></button><button class="phase-tab" data-action="my-work"><strong>${escapeHtml(t('myWork'))}</strong><span>${state.versions.length + state.reviews.length + state.councilRuns.length} ${escapeHtml(state.lang === 'en' ? 'records' : 'registros')}</span></button></nav>`;
    }

    function renderNotebook() {
        const cards = notebookCards();
        const active = activeNotebookCard();
        const entry = state.notebookEntries[notebookEntryKey(active)] || { text: '', updatedAt: null };
        const coachRuns = state.notebookCoachRuns.filter(run => run.cardId === notebookEntryKey(active));
        return `<div class="notebook-grid"><aside class="panel notebook-card-list"><div class="panel-header"><div><span class="panel-kicker">${escapeHtml(genreLabel())}</span><h2>${escapeHtml(t('notebook'))}</h2><p>${escapeHtml(t('cardsSuggested'))}</p></div></div><nav class="journey-steps" aria-label="${escapeHtml(t('notebook'))}">${cards.map((card, index) => {
            const cardEntry = state.notebookEntries[notebookEntryKey(card)];
            const hasEvidence = Boolean(cardEntry && wordCount(cardEntry.text));
            return `<button class="step-button" data-action="notebook-card" data-card="${index}" ${state.activeNotebook === index ? 'aria-current="page"' : ''}><span class="step-number">${index + 1}</span><span class="step-label"><strong>${escapeHtml(notebookCardLabel(card))}</strong><small ${state.activeNotebook === index ? 'id="activeNotebookCardStatus"' : ''}>${hasEvidence ? `${wordCount(cardEntry.text)} ${escapeHtml(state.lang === 'en' ? 'words' : 'palabras')}` : escapeHtml(state.lang === 'en' ? 'Suggested · skippable' : 'Sugerida · opcional')}</small></span><span class="done-mark" ${state.activeNotebook === index ? 'id="activeNotebookEvidence"' : ''} aria-label="${hasEvidence ? 'has evidence' : 'no evidence'}">${hasEvidence ? '✓' : '○'}</span></button>`;
        }).join('')}</nav></aside>
        <section class="panel notebook-card-panel" aria-labelledby="notebookCardTitle"><div class="editor-topline"><div class="draft-identity"><strong id="notebookCardTitle">${escapeHtml(notebookCardLabel(active))}</strong><span>${escapeHtml(notebookCardPrompt(active))}</span></div><div class="editor-actions"><button class="button ghost" data-action="paste-notebook">${escapeHtml(t('pasteNotebook'))}</button></div></div><div class="editor-wrap"><textarea id="notebookEditor" class="draft-editor notebook-editor" spellcheck="${spellcheckEnabled()}" aria-label="${escapeHtml(`${t('notebook')}: ${notebookCardLabel(active)}`)}" placeholder="${escapeHtml(state.lang === 'en' ? 'Think here in notes, fragments, questions, or an outline…' : 'Piensa aquí con notas, fragmentos, preguntas o un esquema…')}">${escapeHtml(entry.text)}</textarea><div class="editor-meta"><span id="notebookWordCount">${escapeHtml(t('words', { n: wordCount(entry.text) }))}</span><span class="autosave-message" data-save-state role="status" aria-live="polite" aria-atomic="true">${escapeHtml(entry.updatedAt ? `${t('notebookSaved')} · ${shortDate(entry.updatedAt)}` : t('autosaved'))}</span></div></div><p class="editor-privacy">${instruction('notebookCoachBoundary')} ${escapeHtml(t('noNetwork'))}</p><footer class="editor-footer"><div class="footer-group"><button class="button ghost" data-action="notebook-back" ${state.activeNotebook === 0 ? 'disabled' : ''}>← ${escapeHtml(t('back'))}</button><button class="button primary" data-action="notebook-next">${escapeHtml(state.activeNotebook < cards.length - 1 ? t('nextCard', { name: notebookCardLabel(cards[state.activeNotebook + 1]) }) : t('writeDraft'))} →</button></div><div class="footer-group"><button class="button secondary" data-action="notebook-coach">${escapeHtml(t('notebookCoach'))}</button></div></footer>${coachRuns.length ? `<div class="panel-body notebook-coach-history"><span class="mock-label">Mock coach · ${escapeHtml(notebookCardLabel(active))}</span><p>${escapeHtml(coachRuns.at(-1).response)}</p></div>` : ''}</section>
        <aside class="support-stack"><section class="panel authorship-card"><div class="panel-body"><span class="panel-kicker">${escapeHtml(state.lang === 'en' ? 'Two kinds of work' : 'Dos tipos de trabajo')}</span><h2>${escapeHtml(t('writeDraft'))}</h2><p>${instruction('authorshipBoundary')}</p><button class="button primary" data-action="create-draft">${escapeHtml(state.draftDeclared ? t('draft') : t('writeDraft'))}</button><p class="boundary-note">${escapeHtml(t('cardsSuggested'))}</p></div></section>${renderNotebookEvidencePanel()}</aside></div>`;
    }

    function renderNotebookDraft() {
        return `<div class="workspace-grid notebook-draft">${renderEditor()}<aside class="support-stack notebook-reference" aria-label="${escapeHtml(t('notebookReference'))}">${renderNotebookReference()}${renderVersionsPanel()}${renderReviewPanel()}</aside></div>`;
    }

    function renderNotebookReference() {
        return `<section class="panel"><div class="panel-header"><div><h2>${escapeHtml(t('notebookReference'))}</h2><p>${escapeHtml(state.lang === 'en' ? 'Reference only—nothing transfers automatically.' : 'Solo referencia—nada se transfiere automáticamente.')}</p></div><button class="button ghost" data-action="place-notebook">${escapeHtml(t('notebook'))}</button></div><div class="panel-body artifact-list">${notebookCards().map((card, index) => {
            const entry = state.notebookEntries[notebookEntryKey(card)];
            return `<button class="artifact-row notebook-reference-row" data-action="notebook-card" data-card="${index}"><strong>${escapeHtml(notebookCardLabel(card))}</strong><small>${escapeHtml(entry?.text ? `${wordCount(entry.text)} ${state.lang === 'en' ? 'words' : 'palabras'} · ${entry.text.slice(0, 80)}` : (state.lang === 'en' ? 'No notes yet' : 'Sin notas'))}</small></button>`;
        }).join('')}</div></section>`;
    }

    function renderVersionsPanel() {
        return `<section class="panel"><div class="panel-header"><div><h2>${escapeHtml(t('versions'))}</h2><p>${escapeHtml(state.lang === 'en' ? 'Dated snapshots of the canonical draft' : 'Instantáneas fechadas del borrador canónico')}</p></div></div><div class="panel-body artifact-list">${state.versions.length ? state.versions.slice().reverse().map(version => `<div class="artifact-row"><strong>${escapeHtml(t('draftSnapshot'))} · ${version.words}</strong><small>${shortDate(version.createdAt)}</small></div>`).join('') : `<div class="empty-state">${escapeHtml(state.lang === 'en' ? 'A snapshot is added before review and Finish.' : 'Se añade una instantánea antes de revisión y Finalizar.')}</div>`}</div></section>`;
    }

    function renderNotebookEvidencePanel() {
        const filled = notebookCards().filter(card => wordCount(state.notebookEntries[notebookEntryKey(card)]?.text)).length;
        return `<section class="panel"><div class="panel-header"><div><h2>${escapeHtml(t('evidence'))}</h2><p>${escapeHtml(state.lang === 'en' ? 'Evidence means useful work exists—not that you visited.' : 'Evidencia significa que existe trabajo útil—no que visitaste.')}</p></div></div><div class="panel-body artifact-list"><div class="artifact-row"><strong id="notebookEvidenceCount">${filled}/${notebookCards().length} ${escapeHtml(state.lang === 'en' ? 'cards with work' : 'tarjetas con trabajo')}</strong><small>${escapeHtml(t('cardsSuggested'))}</small></div><div class="artifact-row"><strong>${state.draftDeclared ? escapeHtml(t('currentDraft')) : escapeHtml(t('draftMissing'))}</strong><small>${escapeHtml(state.draftDeclared ? t('words', { n: wordCount(state.draft) }) : t('draftToolsLocked'))}</small></div></div></section>`;
    }

    function renderDeskWorkspace() {
        return `<nav class="phase-strip" aria-label="Desk places"><button class="phase-tab" aria-current="step">${escapeHtml(t('currentDraft'))}</button><button class="phase-tab" data-action="reflection">${escapeHtml(t('reflection'))}</button><button class="phase-tab" data-action="finish">${escapeHtml(t('finish'))}</button></nav>
            <div class="workspace-grid desk">${renderEditor()}
                <aside class="support-stack" aria-label="Supporting work">${renderMovesPanel('desk')}${renderReviewPanel()}${renderEvidencePanel()}</aside>
            </div>`;
    }

    function renderIntegratedWorkspace() {
        return `<nav class="phase-strip" aria-label="Integrated Desk places"><button class="phase-tab" aria-current="step">${escapeHtml(t('currentDraft'))}</button><button class="phase-tab" data-action="reflection">${escapeHtml(t('reflection'))}</button><button class="phase-tab" data-action="finish">${escapeHtml(t('finish'))}</button></nav>
            <div class="workspace-grid desk integrated-desk">${renderEditor()}
                <aside class="support-stack integrated-support" aria-label="Optional planning and review">${renderKnowledgeOnboarding()}${renderIntegratedMovesPanel()}${renderReviewPanel()}${renderEvidencePanel()}</aside>
            </div>`;
    }

    function renderKnowledgeOnboarding() {
        if (concept !== 'integrated' || state.genre !== 'autobiographical') return '';
        if (state.knowledgeChoice !== null) return '';
        const body = state.lang === 'en'
            ? 'Cultural, linguistic, family, community, historical, and experiential knowledge can be resources here. Use only what you choose.'
            : 'El conocimiento cultural, lingüístico, familiar, comunitario, histórico y vivido puede ser un recurso. Usa solo lo que elijas.';
        return `<section class="panel knowledge-onboarding" aria-labelledby="knowledgeTitle"><div class="panel-body"><span class="panel-kicker">${escapeHtml(state.lang === 'en' ? 'Optional' : 'Opcional')}</span><h2 id="knowledgeTitle">${escapeHtml(state.lang === 'en' ? 'What you already know can matter here' : 'Lo que ya sabes puede importar aquí')}</h2><p>${escapeHtml(body)}</p><p>${escapeHtml(state.lang === 'en' ? 'Write in English, Spanish, or code-mesh when that carries your meaning.' : 'Escribe en inglés, español o mezcla códigos cuando eso lleve tu significado.')}</p><div class="knowledge-actions"><button class="button secondary" data-action="knowledge-choice" data-choice="engage">${escapeHtml(t('useKnowledge'))}</button><button class="button ghost" data-action="knowledge-choice" data-choice="skip">${escapeHtml(t('notNow'))}</button></div><small>${escapeHtml(state.lang === 'en' ? 'Identity, trauma, family, migration, and cultural disclosure are always optional.' : 'Divulgar identidad, trauma, familia, migración o cultura siempre es opcional.')}</small></div></section>`;
    }

    function renderIntegratedMovesPanel() {
        const moves = integratedMoves();
        const filled = moves.filter(move => wordCount(state.moveNotes[moveNoteKey(move)]?.text)).length;
        return `<section class="panel integrated-moves"><div class="panel-header"><div><h2>${escapeHtml(t('moves'))}</h2><p>${escapeHtml(`${genreLabel()} · ${state.lang === 'en' ? 'optional guidance' : 'guía opcional'}`)}</p></div>${filled ? `<span class="evidence-count" aria-label="${filled} ${escapeHtml(state.lang === 'en' ? 'notes with content' : 'notas con contenido')}">${filled}</span>` : ''}</div><div class="panel-body move-list">${moves.map((move, index) => {
            const note = state.moveNotes[moveNoteKey(move)];
            const hasNote = Boolean(note && wordCount(note.text));
            return `<article class="move-card integrated-move"><strong>${escapeHtml(integratedMoveLabel(move))}</strong><span>${escapeHtml(integratedMoveNudge(move))}</span><details><summary>${escapeHtml(state.lang === 'en' ? 'Why this may help' : 'Por qué podría ayudar')}</summary><p>${escapeHtml(integratedMoveWhy(move))}</p>${integratedMoveDeeper(move) ? `<p class="move-deeper">${escapeHtml(integratedMoveDeeper(move))}</p>` : ''}</details>${integratedMoveExample(move)}<button class="text-button" data-action="integrated-move-note" data-move="${index}">${escapeHtml(hasNote ? t('editNote') : t('makeNote'))}${hasNote ? ` · ${wordCount(note.text)} ${escapeHtml(state.lang === 'en' ? 'words' : 'palabras')}` : ''}</button></article>`;
        }).join('')}${renderGenreReferenceNotes()}${renderPlanningNotesReference()}${renderYourVoiceReference()}${renderKnowledgeRevisit()}</div></section>`;
    }

    // Quiet, closed-by-default reference material a genre may declare — length
    // guidance, working boundaries. Reference only: never a gate, never a
    // submission rule, never counted as evidence or progress.
    function renderGenreReferenceNotes() {
        const notes = currentGenre().referenceNotes;
        if (!notes || !notes.length) return '';
        return notes.map(note => `<details class="planning-reference genre-reference"><summary>${escapeHtml(state.lang === 'en' ? note.title.en : note.title.es)}</summary><p>${escapeHtml(state.lang === 'en' ? note.body.en : note.body.es)}</p></details>`).join('');
    }

    function renderPlanningNotesReference() {
        const notes = integratedMoves().map(move => ({ move, note: state.moveNotes[moveNoteKey(move)] })).filter(item => wordCount(item.note?.text));
        if (!notes.length) return `<p class="planning-empty">${escapeHtml(state.lang === 'en' ? 'Planning notes appear here only after you write useful content. They never enter the draft automatically.' : 'Las notas aparecen aquí solo cuando escribes contenido útil. Nunca entran al borrador automáticamente.')}</p>`;
        return `<details class="planning-reference"><summary>${escapeHtml(t('planningNotes'))} · ${notes.length}</summary><div class="artifact-list">${notes.map(({ move, note }) => {
            const linked = note.passageLink ? ` · “${note.passageLink.quote.slice(0, 48)}”` : '';
            return `<button class="artifact-row notebook-reference-row" data-action="integrated-move-note" data-move="${integratedMoves().indexOf(move)}"><strong>${escapeHtml(integratedMoveLabel(move))}</strong><small>${escapeHtml(`${wordCount(note.text)} ${state.lang === 'en' ? 'words' : 'palabras'} · ${note.text.slice(0, 70)}${linked}`)}</small></button>`;
        }).join('')}</div><p>${escapeHtml(state.lang === 'en' ? 'Reference only—nothing transfers to the canonical draft.' : 'Solo referencia—nada se transfiere al borrador canónico.')}</p></details>`;
    }

    function renderYourVoiceReference() {
        const entries = voiceEntries();
        if (concept !== 'integrated' || !entries.length) return '';
        return `<details class="planning-reference your-voice-reference"><summary>${escapeHtml(uiText('Your Voice', 'Tu voz'))} · ${entries.length}</summary><p>${escapeHtml(uiText('Keep what sounds like you. These student-owned entries stay local and are not sent to mock AI unless you explicitly request it in a review.', 'Conserva lo que suena como tú. Estas entradas del estudiante se quedan locales y no se envían a la IA simulada a menos que lo pidas explícitamente en una revisión.'))}</p><div class="artifact-list">${entries.map((item, index) => `<div class="artifact-row"><strong>“${escapeHtml(item.text)}”</strong><small>${escapeHtml(item.reason || uiText('No reason added. You decide what this wording means.', 'No agregaste una razón. Tú decides qué significa esta redacción.'))}</small><button class="text-button" data-action="voice-note" data-voice="${index}">${escapeHtml(item.reason ? uiText('Edit your note', 'Editar tu nota') : uiText('Add a note', 'Agregar una nota'))}</button></div>`).join('')}</div></details>`;
    }

    function renderKnowledgeRevisit() {
        if (state.genre !== 'autobiographical' || state.knowledgeChoice === null) return '';
        const engaged = state.knowledgeChoice === 'engage';
        return `<details class="knowledge-revisit"><summary>${escapeHtml(t('revisitKnowledge'))}</summary><p>${escapeHtml(state.lang === 'en' ? 'Cultural, linguistic, family, community, historical, and experiential knowledge may be resources. You control what remains private.' : 'El conocimiento cultural, lingüístico, familiar, comunitario, histórico y vivido puede ser recurso. Tú controlas lo privado.')}</p><p><strong>${escapeHtml(engaged ? (state.lang === 'en' ? 'You chose to use this lens.' : 'Elegiste usar esta lente.') : (state.lang === 'en' ? 'You chose not now. You may return at any time.' : 'Elegiste ahora no. Puedes regresar cuando quieras.'))}</strong></p><button class="text-button" data-action="knowledge-reset">${escapeHtml(state.lang === 'en' ? 'Choose again' : 'Elegir de nuevo')}</button></details>`;
    }

    function renderJourneyWorkspace() {
        return `<div class="workspace-grid">
            <aside class="panel journey-panel"><div class="panel-header"><div><span class="panel-kicker">${escapeHtml(state.step <= 5 ? t('actStart') : state.step <= 9 ? t('actRevise') : t('actFinish'))}</span><h2>10 ${escapeHtml(state.lang !== 'en' ? 'pasos' : 'steps')}</h2><p>${escapeHtml(t('completeRule'))}</p></div></div><nav class="journey-steps" aria-label="Writing steps">${(state.lang === 'en' ? journeySteps : journeyStepsEs).map((step, index) => renderStepButton(step, index + 1)).join('')}</nav></aside>
            ${renderEditor()}
            <aside class="support-stack" aria-label="Work and review">${renderWorkRail()}${renderReviewPanel()}${renderEvidencePanel()}</aside>
        </div>`;
    }

    function renderHybridWorkspace() {
        return `<nav class="phase-strip" aria-label="Writing phases">${(state.lang === 'en' ? hybridPhases : hybridPhasesEs).map((phase, index) => `<button class="phase-tab" data-action="phase" data-phase="${index + 1}" ${state.phase === index + 1 ? 'aria-current="step"' : ''}><strong>${index + 1}. ${escapeHtml(phase[0])}</strong></button>`).join('')}</nav>
            <div class="workspace-grid hybrid">${renderEditor()}<aside class="support-stack">${renderReviewPanel()}${renderEvidencePanel()}</aside></div>
            <section class="context-moves" aria-labelledby="contextMovesTitle"><div class="panel-header"><div><h2 id="contextMovesTitle">${escapeHtml(t('moves'))}</h2><p>${escapeHtml(genreLabel())}</p></div></div><div class="context-grid">${genreMoves('discover').map((move, i) => `<article class="context-card"><span class="panel-kicker">${escapeHtml(phaseData(state.phase - 1)[0])} · ${i + 1}</span><h3>${escapeHtml(move)}</h3><p>${escapeHtml(contextMoveDetail(i))}</p><button class="text-button" data-action="activate-move" data-move="${i}">${escapeHtml(state.lang === 'en' ? 'Use this move' : 'Usar esta movida')}</button></article>`).join('')}</div></section>`;
    }

    function renderStepButton(step, number) {
        const artifact = state.artifacts[`step-${number}`];
        const done = artifact && wordCount(artifact.text) >= 8;
        return `<button class="step-button" data-action="step" data-step="${number}" ${state.step === number ? 'aria-current="step"' : ''}><span class="step-number">${number}</span><span class="step-label"><strong>${escapeHtml(step[0])}</strong><small>${escapeHtml(step[1])}</small></span><span class="done-mark" aria-label="${done ? 'has evidence' : 'not complete'}">${done ? '✓' : '○'}</span></button>`;
    }

    // ── Guided Discovery live-preview seam ───────────────────────────────────
    // A preview is produced by the REAL panel renderer, so it cannot drift from
    // the Studio: same markup, same classes, same translation source, same genre
    // profile. Only the data is synthetic. The canonical state is swapped for a
    // synthetic one for the duration of ONE synchronous render and restored in
    // `finally`; `previewLock` additionally makes `saveState` a no-op for that
    // window, so no synthetic value can reach localStorage even if a renderer
    // asked for a save. Nothing here is async — a timer cannot interleave.
    function syntheticPreviewState(seed = {}) {
        const base = defaultState('integrated');
        const genreId = state.genre;
        const move = (integratedMoveProfiles[genreId] || [])[0] || null;
        const at = '2026-01-15T15:04:00.000Z';
        const synthetic = {
            ...base,
            lang: state.lang,
            genre: genreId,
            appearance: state.appearance,
            createdAt: at,
            savedAt: at,
            draft: seed.draft || '',
        };
        if (seed.moveNote && move) {
            synthetic.moveNotes = { [`${genreId}:${move.id}`]: { text: seed.moveNote, updatedAt: at } };
        }
        if (seed.voice) {
            synthetic.voiceEntries = [{ id: 'demo-voice', text: seed.voice.text, reason: seed.voice.reason || '', protectedAt: at, genre: genreId }];
        }
        if (seed.decision) {
            synthetic.decisions = [{ id: 'demo-decision', choice: seed.decision.choice, choiceLabel: seed.decision.label, suggestion: seed.decision.suggestion, rationale: seed.decision.rationale || '', createdAt: at, genre: genreId, genreLabel: (genres[genreId] || {}).label }];
        }
        if (seed.reviewCopy) {
            synthetic.versions = [{ id: 'demo-copy', signature: `${seed.reviewCopy.length}:demo`, words: wordCount(seed.reviewCopy), createdAt: at, reason: 'review copy', text: seed.reviewCopy }];
            synthetic.reviewCopy = { snapshotId: 'demo-copy', createdAt: at };
        }
        if (seed.review) {
            synthetic.reviews = [{ id: 'demo-review', lens: seed.review.lens, scope: seed.review.scope, createdAt: at, genre: genreId, genreLabel: (genres[genreId] || {}).label }];
        }
        return synthetic;
    }

    // Inert by construction: every real `data-action` is renamed so the delegated
    // handler can never see it, and every control is disabled and removed from
    // the tab order. A preview is something to look at; the tour's own controls
    // live outside the preview surface.
    function sanitizePreviewMarkup(markup) {
        const host = document.createElement('div');
        host.innerHTML = markup;
        host.querySelectorAll('[data-action]').forEach(node => {
            node.setAttribute('data-demo-action', node.getAttribute('data-action'));
            node.removeAttribute('data-action');
        });
        host.querySelectorAll('button').forEach(node => {
            node.setAttribute('disabled', '');
            node.setAttribute('tabindex', '-1');
        });
        host.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
        return host.innerHTML;
    }

    function renderTourPreview(kind, seed = {}) {
        const realState = state;
        let markup = '';
        previewLock = true;
        try {
            state = syntheticPreviewState(seed);
            if (kind === 'moves') markup = renderIntegratedMovesPanel();
            else if (kind === 'review') markup = renderReviewPanel();
            else if (kind === 'evidence') markup = renderEvidencePanel();
            else if (kind === 'voice') markup = renderYourVoiceReference();
            else if (kind === 'copies') markup = evidenceArchiveBody('copies');
            else if (kind === 'decisions') markup = evidenceArchiveBody('decisions');
        } finally {
            state = realState;
            previewLock = false;
        }
        return sanitizePreviewMarkup(markup);
    }

    // Context handed to Guided Discovery. It exposes read-only descriptions of
    // the active genre and whether real work exists; the conversation cannot
    // reach the canonical draft, any record, or the provider through it.
    function tourContext() {
        return {
            lang: () => state.lang,
            escape: escapeHtml,
            genre: () => (genres[state.genre] ? currentGenre() : null),
            moveById: id => integratedMoves().find(move => move.id === id) || integratedMoves()[0] || null,
            moveLabel: integratedMoveLabel,
            moveNudge: integratedMoveNudge,
            // Live annotated previews, rendered by the real panel renderers from
            // synthetic data. Read-only markup: every control is inert.
            preview: renderTourPreview,
            genreLabel: () => genreLabel(),
            councilAvailable: () => councilEnabled(),
            // The same laptop-and-coffee companion as the header, so the
            // conversation is visibly with the Studio's own character.
            avatar: brandIconSvg,
            hasWork: () => Boolean((getDraft() || '').trim())
                || (state.versions || []).length > 0
                || (state.reviews || []).length > 0
                || (state.councilRuns || []).length > 0
                || Boolean(state.legacyImport)
                || hasMeaningfulStudentEvidence(),
            openDialog: (title, subtitle, body, footer, options) => openDialog(title, subtitle, body, footer, options),
            closeDialog: force => closeDialog(force),
            rerender: () => renderApp(),
            announce,
            // preventScroll: dismissing the card or leaving the tour gives keyboard
            // users the writing surface without moving the viewport under them.
            focusEditor: () => document.getElementById('draftEditor')?.focus({ preventScroll: true }),
        };
    }

    function renderEditor() {
        const isCurrent = concept !== 'journey' || state.currentArtifact === `step-${state.step}`;
        const focusAvailable = concept === 'desk' || concept === 'journey' || concept === 'integrated';
        return `<section class="panel editor-panel" aria-labelledby="draftTitle"><div class="editor-topline"><div class="draft-identity"><strong id="draftTitle">${escapeHtml(concept === 'journey' ? stepData(state.step - 1)[0] : t('currentDraft'))}</strong><span>${escapeHtml(isCurrent ? t('currentVersion') : t('priorWork'))}${concept === 'journey' ? ` · ${escapeHtml(t('whereJourney', { n: state.step }))}` : ''}</span></div><div class="editor-actions">${concept === 'integrated' ? renderEditControls() : ''}<button class="button ghost" data-action="paste">${escapeHtml(t('paste'))}</button>${focusAvailable ? `<button class="button ghost focus-btn" data-action="focus">${escapeHtml(t('focus'))}</button>` : ''}</div></div>
            <div class="editor-wrap"><textarea id="draftEditor" class="draft-editor" spellcheck="${spellcheckEnabled()}" aria-label="${escapeHtml(t('currentDraft'))}" placeholder="${escapeHtml(state.lang !== 'en' ? 'Comienza con tus propias palabras…' : 'Start with your own words…')}">${escapeHtml(getDraft())}</textarea><div class="editor-meta"><span id="wordCount">${escapeHtml(t('words', { n: wordCount(getDraft()) }))}</span><span class="autosave-message" data-save-state role="status" aria-live="polite" aria-atomic="true">${escapeHtml(t('autosaved'))}</span></div></div>
            <p class="editor-privacy">${instruction('selectHint')} ${escapeHtml(liveProviderActive() ? uiText('Nothing is ever sent without your explicit consent and an exact preview.', 'Nada se envía nunca sin tu consentimiento explícito y una vista previa exacta.') : t('noNetwork'))}</p>
            ${concept === 'integrated' && window.StudioTour?.shouldOfferWelcome(tourContext()) ? window.StudioTour.welcomeCardHtml(tourContext()) : ''}
            ${concept === 'integrated' ? `<section class="coach-entry" aria-label="${escapeHtml(t('askVisible'))}"><div><strong>${escapeHtml(t('askVisible'))}</strong><span>${escapeHtml(t('coachEntryHint'))}</span></div><button class="button secondary" data-action="coach">${escapeHtml(t('askVisible'))}</button></section>` : ''}
            <footer class="editor-footer"><div class="footer-group"><button class="button ghost" data-action="back" ${atBeginning() ? 'disabled' : ''}>← ${escapeHtml(t('back'))}</button><button class="button primary" data-action="continue">${escapeHtml(continueLabel())} →</button></div><div class="footer-group">${concept === 'journey' && !isCurrent && state.step >= 6 ? `<button class="button secondary" data-action="mark-current">${escapeHtml(t('markCurrent'))}</button>` : ''}${concept === 'integrated' ? `<button class="button ghost stuck-inline" data-action="stuck" aria-label="${escapeHtml(uiText('I’m stuck — get one small next step', 'Estoy atascado/a — recibe un pequeño próximo paso'))}">${escapeHtml(uiText('I’m stuck', 'Estoy atascado/a'))}</button>` : ''}<button class="button secondary" data-action="review-center">${escapeHtml(t('reviewCenter'))}</button></div></footer>
        </section>`;
    }

    function renderMovesPanel(type) {
        const moves = genreMoves('discover');
        const title = type === 'desk' ? t('moves') : phaseData(state.phase - 1)[0];
        return `<section class="panel"><div class="panel-header"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(genreLabel())}</p></div></div><div class="panel-body move-list">${moves.map((move, index) => `<button class="move-card" data-action="activate-move" data-move="${index}"><strong>${escapeHtml(move)}</strong><span>${escapeHtml(contextMoveDetail(index))}</span></button>`).join('')}<p style="margin:10px 0 0;color:var(--muted);font-size:.8rem">${escapeHtml(t('noFallback'))}</p></div></section>`;
    }

    function contextMoveDetail(index) {
        const generic = state.lang !== 'en'
            ? ['Haz una nota breve; no cambia el borrador.', 'Úsala como lente, no como destino separado.', 'Tú decides si la evidencia cambia tu texto.']
            : ['Make a brief note; it does not change the draft.', 'Use it as a lens, not another destination.', 'You decide whether the evidence changes your text.'];
        return generic[index] || generic[0];
    }

    function renderReviewPanel() {
        const reportCount = state.reviews.length + state.councilRuns.length;
        const councilAction = concept === 'integrated' && !councilEnabled()
            ? `<div class="support-action unavailable"><strong>${escapeHtml(t('council'))}</strong><span>${escapeHtml(councilUnavailableText())}</span></div>`
            : concept === 'integrated' && state.councilRuns.length
                ? `<button class="support-action" data-action="review-tab" data-tab="council"><strong>${escapeHtml(t('council'))}</strong><span>${escapeHtml(t('revisit'))}</span></button>`
                : `<button class="support-action" data-action="council"><strong>${escapeHtml(t('council'))}</strong><span>${escapeHtml(state.councilRuns.length ? t('revisit') : t('convene'))}</span></button>`;
        const historyAction = reportCount || state.decisions.length
            ? `<button class="support-action" data-action="review-center"><strong>${escapeHtml(t('priorWork'))}</strong><span>${escapeHtml(t('revisit'))}</span></button>`
            : `<button class="support-action" data-action="review-center"><strong>${escapeHtml(uiText('Review options & history', 'Opciones e historial de revisión'))}</strong><span>${escapeHtml(uiText('self-review and saved feedback', 'revisión propia y comentarios guardados'))}</span></button>`;
        return `<section class="panel"><div class="panel-header"><div><h2>${escapeHtml(t('reviewCenter'))}</h2><p>${escapeHtml(reportCount ? uiText(`${reportCount} saved report${reportCount === 1 ? '' : 's'}`, `${reportCount} informe${reportCount === 1 ? '' : 's'} guardado${reportCount === 1 ? '' : 's'}`) : uiText('Feedback is optional.', 'La retroalimentación es opcional.'))}</p></div>${state.decisions.length ? `<span class="evidence-count" aria-label="${escapeHtml(uiText(`${state.decisions.length} decisions`, `${state.decisions.length} decisiones`))}">${state.decisions.length}</span>` : ''}</div><div class="panel-body"><button class="support-action" data-action="coach"><strong>${escapeHtml(t('coach'))}</strong><span>${escapeHtml(state.lang === 'en' ? 'passage, paragraph, or draft' : 'pasaje, párrafo o borrador')}</span></button><button class="support-action" data-action="focused-review"><strong>${escapeHtml(t('focusedReview'))}</strong><span>${escapeHtml(genreMoves('review')[0])}</span></button>${councilAction}${historyAction}</div></section>`;
    }

    function reviewCopySnapshot() {
        const id = state.reviewCopy?.snapshotId;
        return id ? state.versions.find(version => version.id === id) || null : null;
    }

    function renderRevisionCycleEntry(context = 'review') {
        if (concept !== 'integrated' || !getDraft().trim()) return '';
        const copy = reviewCopySnapshot();
        const label = copy
            ? uiText('View review copy', 'Ver copia de revisión')
            : uiText('Ready for a second look', '¿Listo/a para una segunda mirada?');
        const detail = copy
            ? uiText(`Saved ${versionTimestamp(copy)}. Your live draft is still editable.`, `Guardada ${versionTimestamp(copy)}. Tu borrador activo sigue siendo editable.`)
            : uiText('Save an exact local copy when you want to look again—not a final lock.', 'Guarda una copia local exacta cuando quieras volver a mirar; no es un cierre final.');
        return `<section class="revision-cycle-entry revision-cycle-${context}"><div><strong>${escapeHtml(uiText('Revision cycle', 'Ciclo de revisión'))}</strong><span>${escapeHtml(detail)}</span></div><button class="button secondary" data-action="revision-cycle">${escapeHtml(label)}</button></section>`;
    }

    function renderEvidencePanel() {
        const currentVersions = concept === 'journey' ? Object.keys(state.artifacts).length : state.versions.length;
        const moveNoteCount = concept === 'integrated' ? integratedMoves().filter(move => wordCount(state.moveNotes[moveNoteKey(move)]?.text)).length : 0;
        const rationaleCount = state.decisions.filter(decision => decision.rationale?.trim()).length;
        const recoverableSnapshots = concept === 'integrated' ? state.versions.filter(version => typeof version.text === 'string').length : 0;
        const metadataCheckpoints = concept === 'integrated' ? state.versions.length - recoverableSnapshots : 0;
        const versionEvidence = concept === 'integrated'
            ? (state.versions.length ? `<div class="artifact-row"><strong>${recoverableSnapshots} ${escapeHtml(state.lang === 'en' ? 'recoverable draft snapshots' : 'instantáneas recuperables del borrador')}</strong><small>${escapeHtml(metadataCheckpoints ? `${metadataCheckpoints} ${state.lang === 'en' ? 'earlier metadata-only checkpoints' : 'puntos anteriores solo con metadatos'}` : (state.lang === 'en' ? 'Exact prior text is viewable when a snapshot exists.' : 'El texto anterior exacto se puede ver cuando existe una instantánea.'))}</small><button class="text-button" data-action="version-history">${escapeHtml(state.lang === 'en' ? 'View draft history' : 'Ver historial del borrador')}</button></div>` : '')
            : `<div class="artifact-row"><strong>${currentVersions} ${escapeHtml(state.lang !== 'en' ? 'versiones o artefactos' : 'versions or artifacts')}</strong><small>${escapeHtml(t('autosaved'))}</small></div>`;
        const moveEvidence = concept === 'integrated' && moveNoteCount ? `<div class="artifact-row"><strong>${moveNoteCount} ${escapeHtml(state.lang === 'en' ? 'Move notes with content' : 'notas de Movidas con contenido')}</strong></div>` : '';
        const voiceEvidence = concept === 'integrated' && voiceEntries().length ? `<div class="artifact-row"><strong>${voiceEntries().length} ${escapeHtml(uiText('student-owned Your Voice entries', 'entradas de Tu voz del estudiante'))}</strong><small>${escapeHtml(uiText('Exact text only; no quality or understanding is inferred.', 'Solo texto exacto; no se infiere calidad ni comprensión.'))}</small></div>` : '';
        const decisionEvidence = state.decisions.length ? `<div class="artifact-row"><strong>${state.decisions.length} ${escapeHtml(state.lang !== 'en' ? 'decisiones' : 'decisions')}</strong><small>${escapeHtml(`${state.decisions.map(d => d.choice).join(', ')}${concept === 'integrated' ? ` · ${rationaleCount} ${state.lang === 'en' ? 'student reasons' : 'razones estudiantiles'}` : ''}`)}</small></div>` : '';
        const councilEvidence = state.councilRuns.length ? `<div class="artifact-row"><strong>${state.councilRuns.length} ${escapeHtml(state.lang !== 'en' ? 'Consejos' : 'Council runs')}</strong><small>${escapeHtml(t('revisit'))}</small></div>` : '';
        return `<section class="panel"><div class="panel-header"><div><h2>${escapeHtml(t('evidence'))}</h2><p>${escapeHtml(uiText('Evidence grows from your own words, saved drafts, sources, and revision decisions—not simply from moving through the Studio.', 'La evidencia crece a partir de tus propias palabras, borradores guardados, fuentes y decisiones de revisión; no simplemente al recorrer el espacio de escritura.'))}</p></div></div><div class="panel-body artifact-list">${moveEvidence}${voiceEvidence}${versionEvidence}${decisionEvidence}${councilEvidence}${concept === 'integrated' ? `<button class="button secondary" data-action="evidence-browser">${escapeHtml(uiText('Browse evidence', 'Explorar evidencia'))}</button>` : ''}<button class="button secondary" data-action="reflection">${escapeHtml(t('reflection'))}</button></div></section>`;
    }

    function evidenceArchiveBody(filter) {
        const empty = `<div class="empty-state">${escapeHtml(uiText('Nothing student-created is saved in this view yet.', 'Todavía no hay nada creado por el estudiante guardado en esta vista.'))}</div>`;
        if (filter === 'moves') {
            const entries = integratedMoves().map((move, index) => ({ move, index, note: state.moveNotes[moveNoteKey(move)] })).filter(({ note }) => wordCount(note?.text));
            return entries.length ? entries.map(({ move, index, note }) => `<article class="evidence-entry"><span class="evidence-date">${escapeHtml(versionTimestamp({ createdAt: note.updatedAt }))}</span><h3>${escapeHtml(integratedMoveLabel(move))}</h3><p>${escapeHtml(note.text)}</p>${note.passageLink ? `<blockquote>${escapeHtml(note.passageLink.quote)}</blockquote><small>${escapeHtml(resolvePassageLink(note.passageLink).label)}</small>` : ''}<button class="text-button" data-action="integrated-move-note" data-move="${index}">${escapeHtml(uiText('Open this note', 'Abrir esta nota'))}</button></article>`).join('') : empty;
        }
        if (filter === 'voice') {
            const entries = voiceEntries().map((entry, index) => ({ entry, index })).filter(({ entry }) => !entry.genre || entry.genre === state.genre);
            return entries.length ? entries.map(({ entry, index }) => `<article class="evidence-entry"><span class="evidence-date">${escapeHtml(versionTimestamp({ createdAt: entry.protectedAt }))}</span><h3>${escapeHtml(uiText('Your Voice', 'Tu voz'))}</h3><blockquote>${escapeHtml(entry.text)}</blockquote><p>${escapeHtml(entry.reason || uiText('No meaning is inferred; you chose this exact wording.', 'No se infiere ningún significado; tú elegiste esta redacción exacta.'))}</p><button class="text-button" data-action="voice-note" data-voice="${index}">${escapeHtml(uiText('Open this entry', 'Abrir esta entrada'))}</button></article>`).join('') : empty;
        }
        if (filter === 'decisions') {
            return state.decisions.length ? state.decisions.slice().reverse().map(decision => `<article class="evidence-entry"><span class="evidence-date">${escapeHtml(versionTimestamp({ createdAt: decision.createdAt }))}</span><h3>${escapeHtml(decision.choiceLabel)}</h3><p>${escapeHtml(storedGenreLabel(decision))}</p><blockquote>${escapeHtml(decision.suggestion)}</blockquote>${decision.rationale ? `<p>${escapeHtml(decision.rationale)}</p>` : ''}<button class="text-button" data-action="evidence-open-review" data-tab="decisions">${escapeHtml(uiText('Open decision record', 'Abrir registro de decisión'))}</button></article>`).join('') : empty;
        }
        if (filter === 'copies') {
            const copy = reviewCopySnapshot();
            return copy ? `<article class="evidence-entry"><span class="evidence-date">${escapeHtml(versionTimestamp(copy))}</span><h3>${escapeHtml(uiText('Review copy', 'Copia de revisión'))}</h3><p>${copy.words} ${escapeHtml(uiText('words · exact local text', 'palabras · texto local exacto'))}</p><button class="text-button" data-action="view-snapshot" data-snapshot="${escapeHtml(copy.id)}" data-return-tab="evidence">${escapeHtml(uiText('View exact review copy', 'Ver copia de revisión exacta'))}</button><button class="text-button" data-action="compare-review-copy">${escapeHtml(uiText('Compare with current draft', 'Comparar con el borrador actual'))}</button></article>` : empty;
        }
        const records = [
            ...state.reviews.map(item => ({ ...item, recordType: 'review' })),
            ...state.councilRuns.map(item => ({ ...item, recordType: 'council' })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return records.length ? records.map(item => `<article class="evidence-entry"><span class="evidence-date">${escapeHtml(versionTimestamp({ createdAt: item.createdAt }))}</span><h3>${escapeHtml(item.recordType === 'council' ? t('council') : item.lens)}</h3><p>${escapeHtml(storedGenreLabel(item))} · ${escapeHtml(item.scope || item.payloadScope || uiText('stored scope unavailable', 'alcance guardado no disponible'))}</p><button class="text-button" data-action="evidence-open-review" data-tab="${item.recordType === 'council' ? 'council' : 'history'}">${escapeHtml(uiText('Open saved report', 'Abrir informe guardado'))}</button></article>`).join('') : empty;
    }

    function openEvidenceArchive(filter = 'moves') {
        const filters = [
            ['moves', uiText('Move notes', 'Notas de Movidas')],
            ['voice', uiText('Your Voice', 'Tu voz')],
            ['decisions', uiText('Decisions', 'Decisiones')],
            ['copies', uiText('Review copies', 'Copias de revisión')],
            ['reviews', uiText('Saved reviews', 'Revisiones guardadas')],
        ];
        openDialog(uiText('My writing evidence', 'Mi evidencia de escritura'), uiText('A reference for your decisions—not a completion meter.', 'Una referencia para tus decisiones; no es un medidor de cumplimiento.'), `<nav class="evidence-filters" aria-label="${escapeHtml(uiText('Evidence filters', 'Filtros de evidencia'))}">${filters.map(([id, label]) => `<button data-action="evidence-filter" data-filter="${id}" ${id === filter ? 'aria-current="page"' : ''}>${escapeHtml(label)}</button>`).join('')}</nav><section class="evidence-archive" aria-live="polite">${evidenceArchiveBody(filter)}</section>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(uiText('Return to draft', 'Volver al borrador'))}</button>`, { wide: true });
    }

    function renderWorkRail() {
        const artifacts = Object.entries(state.artifacts).sort(([a], [b]) => Number(a.split('-')[1]) - Number(b.split('-')[1]));
        return `<section class="panel"><div class="panel-header"><div><h2>${escapeHtml(t('workRail'))}</h2><p>${escapeHtml(t('currentVersion'))}</p></div></div><div class="panel-body artifact-list">${artifacts.length ? artifacts.map(([key, artifact]) => {
            const n = Number(key.split('-')[1]);
            return `<div class="artifact-row"><strong>${escapeHtml(stepData(n - 1)?.[0] || key)} · ${wordCount(artifact.text)}</strong><small>${shortDate(artifact.updatedAt)}</small>${state.currentArtifact === key ? `<span class="current-badge">✓ ${escapeHtml(t('currentMark'))}</span>` : `<button class="text-button" data-action="go-artifact" data-step="${n}">${escapeHtml(t('priorWork'))}</button>`}</div>`;
        }).join('') : `<div class="empty-state">${escapeHtml(t('noPrior'))}</div>`}</div></section>`;
    }

    function atBeginning() { return concept === 'desk' || concept === 'integrated' ? true : concept === 'journey' ? state.step === 1 : concept === 'hybrid' ? state.phase === 1 : false; }
    function continueLabel() {
        if (concept === 'desk') return t('finish');
        if (concept === 'integrated') return `${t('continue')}: ${t('reflection')}`;
        if (concept === 'journey') return state.step < 10 ? `${t('continue')}: ${stepData(state.step)[0]}` : t('reflection');
        if (concept === 'hybrid') return state.phase < 4 ? `${t('continue')}: ${phaseData(state.phase)[0]}` : t('reflection');
        return `${t('continue')}: ${t('reflection')}`;
    }

    function navigateRelative(direction) {
        checkpointVersion(direction > 0 ? 'before moving forward' : 'before moving back');
        if (concept === 'desk') return setView('finish');
        if (concept === 'integrated') return setView('reflection');
        if (concept === 'journey') {
            if (direction < 0 && state.step > 1) goStep(state.step - 1);
            else if (direction > 0 && state.step < 10) goStep(state.step + 1);
            else if (direction > 0) setView('reflection');
        } else if (concept === 'hybrid') {
            if (direction < 0 && state.phase > 1) state.phase -= 1;
            else if (direction > 0 && state.phase < 4) state.phase += 1;
            else if (direction > 0) return setView('reflection');
            saveState(); renderApp();
        } else if (direction < 0) {
            state.place = 'notebook'; saveState(); renderApp();
        } else {
            setView('reflection');
        }
    }

    function goStep(nextStep) {
        const oldText = getDraft();
        const target = state.artifacts[`step-${nextStep}`];
        state.step = nextStep;
        if (!target && oldText) state.artifacts[`step-${nextStep}`] = { text: oldText, updatedAt: new Date().toISOString(), label: stepData(nextStep - 1)[0], carriedForward: true };
        state.draft = state.artifacts[`step-${nextStep}`]?.text || state.draft;
        if (nextStep < 6) state.currentArtifact = `step-${nextStep}`;
        saveState(); renderApp();
    }

    function checkpointVersion(reason = 'writing checkpoint', textOverride = null) {
        const text = textOverride !== null ? textOverride : getDraft();
        if (!text || concept === 'journey') return null;
        const signature = `${text.length}:${text.slice(0, 24)}`;
        const existing = state.versions.at(-1);
        if (existing?.signature === signature) return existing.id;
        const version = {
            id: crypto.randomUUID?.() || `${Date.now()}`,
            signature,
            words: wordCount(text),
            createdAt: new Date().toISOString(),
            phase: state.phase,
            reason,
        };
        if (concept === 'integrated') {
            version.text = text;
            version.genre = state.genre;
            version.genreLabel = currentGenre().label.en;
            version.genreLabelEs = currentGenre().label.es;
        }
        state.versions.push(version);
        if (concept !== 'integrated') state.versions = state.versions.slice(-12);
        return version.id;
    }

    function bindEditor() {
        const editor = document.getElementById('draftEditor');
        if (!editor) return;
        editor.addEventListener('input', () => {
            editorCaret = editor.selectionStart;
            setDraft(editor.value);
            const count = document.getElementById('wordCount');
            if (count) count.textContent = t('words', { n: wordCount(editor.value) });
            const orientationCount = document.getElementById('orientationDraftWords');
            if (orientationCount) orientationCount.textContent = t('words', { n: wordCount(editor.value) });
            const placeCount = document.getElementById('draftPlaceCount');
            if (placeCount) placeCount.textContent = t('words', { n: wordCount(editor.value) });
        });
        ['click', 'pointerup', 'keyup', 'touchend'].forEach(type => editor.addEventListener(type, () => { editorCaret = editor.selectionStart; }, { passive: true }));
        ['select'].forEach(type => editor.addEventListener(type, () => setTimeout(() => captureSelection(editor), 0), { passive: true }));
        // iOS Safari does not reliably fire `select` on a textarea when the
        // student selects by touch and drags the native handles — which is how
        // selection is made on a phone. `selectionchange` is the event that does
        // fire there, so the Passage Tray depends on it rather than on `select`
        // alone. Desktop keeps both paths; they converge on the same capture.
        ['pointerup', 'touchend', 'keyup'].forEach(type => editor.addEventListener(type, () => scheduleSelectionCapture(editor), { passive: true }));
    }

    // A touch drag emits selectionchange continuously; capture settles shortly
    // after the student stops moving, so the tray is not rebuilt mid-gesture.
    let selectionCaptureTimer = null;
    function scheduleSelectionCapture(editor) {
        clearTimeout(selectionCaptureTimer);
        selectionCaptureTimer = setTimeout(() => captureSelection(editor), 180);
    }

    function bindEditSurfaces() {
        const preferred = document.getElementById('draftEditor');
        document.querySelectorAll('textarea, input[type="text"]').forEach(field => ensureEditHistory(field));
        if (preferred) setActiveEditSurface(preferred);
        updateEditControls();
    }

    function bindNotebookEditor() {
        const editor = document.getElementById('notebookEditor');
        if (!editor) return;
        editor.addEventListener('input', () => {
            const card = activeNotebookCard();
            state.notebookEntries[notebookEntryKey(card)] = { text: editor.value, updatedAt: new Date().toISOString(), provenance: 'student' };
            const count = document.getElementById('notebookWordCount');
            if (count) count.textContent = t('words', { n: wordCount(editor.value) });
            const filled = notebookCards().filter(item => wordCount(state.notebookEntries[notebookEntryKey(item)]?.text)).length;
            const placeCount = document.getElementById('notebookPlaceCount');
            if (placeCount) placeCount.textContent = `${filled}/${notebookCards().length}`;
            const evidenceCount = document.getElementById('notebookEvidenceCount');
            if (evidenceCount) evidenceCount.textContent = `${filled}/${notebookCards().length} ${state.lang === 'en' ? 'cards with work' : 'tarjetas con trabajo'}`;
            const activeStatus = document.getElementById('activeNotebookCardStatus');
            if (activeStatus) activeStatus.textContent = wordCount(editor.value) ? `${wordCount(editor.value)} ${state.lang === 'en' ? 'words' : 'palabras'}` : (state.lang === 'en' ? 'Suggested · skippable' : 'Sugerida · opcional');
            const activeEvidence = document.getElementById('activeNotebookEvidence');
            if (activeEvidence) { activeEvidence.textContent = wordCount(editor.value) ? '✓' : '○'; activeEvidence.setAttribute('aria-label', wordCount(editor.value) ? 'has evidence' : 'no evidence'); }
            scheduleSave();
        });
    }

    function captureSelection(editor) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        if (!Number.isFinite(start) || end <= start) return;
        const text = editor.value.slice(start, end);
        if (!text.trim()) return;
        const beforeBreak = editor.value.lastIndexOf('\n', start - 1) + 1;
        const afterBreakRaw = editor.value.indexOf('\n', end);
        const afterBreak = afterBreakRaw === -1 ? editor.value.length : afterBreakRaw;
        // Nothing changes if the same selection is re-reported: a touch drag
        // emits many events, and rebuilding the tray each time would fight the
        // student's finger.
        if (captured?.hasSelection && captured.text === text && captured.start === start && captured.end === end) return;
        editorCaret = end;
        captured = {
            text,
            paragraph: editor.value.slice(beforeBreak, afterBreak),
            full: editor.value,
            start, end,
            hasSelection: true,
            capturedAt: new Date().toISOString(),
            // Provenance for stale validation: a capture belongs to one draft
            // state and one writing project, and may never outlive either.
            signature: draftSignature(editor.value),
            genre: state.genre,
        };
        updatePassageBar();
        announce(`${t('captured')}: ${text.slice(0, 80)}`);
    }

    // A captured passage may be protected or sent only while it is still the
    // student's current writing, in this project. Anything else asks them to
    // select again rather than acting on text that has moved on.
    function validateCapture() {
        if (!captured?.hasSelection) return { ok: false, reason: 'none' };
        const text = String(captured.text || '');
        if (!text.trim()) return { ok: false, reason: 'empty' };
        if (captured.genre && captured.genre !== state.genre) return { ok: false, reason: 'genre' };
        const draft = getDraft();
        // Exact position first; then anywhere in the draft, since ordinary
        // editing elsewhere shifts offsets without changing the passage.
        if (draft.slice(captured.start, captured.end) === text) return { ok: true };
        if (draft.includes(text)) return { ok: true, moved: true };
        return { ok: false, reason: 'stale' };
    }

    function captureInvalid(reason) {
        const message = reason === 'genre'
            ? uiText('That passage belonged to a different writing project. Select the wording again in this draft.',
                'Ese pasaje era de otro proyecto de escritura. Selecciona de nuevo en este borrador.')
            : reason === 'empty'
                ? uiText('Nothing is selected. Select the exact wording in your draft first.',
                    'No hay nada seleccionado. Selecciona primero la redacción exacta en tu borrador.')
                : uiText('Your draft changed, so that exact wording is no longer there. Select it again.',
                    'Tu borrador cambió y esa redacción exacta ya no está. Selecciónala de nuevo.');
        captured = null;
        updatePassageBar();
        assertive.textContent = message;
        announce(message);
        document.getElementById('draftEditor')?.focus({ preventScroll: true });
    }

    function renderPassageBar() {
        const protectAction = concept === 'integrated'
            ? `<button class="button ghost protect-phrase" data-action="protect-phrase">${escapeHtml(uiText('Keep as my voice', 'Guardar como mi voz'))}</button>`
            : '';
        const moveAction = concept === 'integrated' && integratedMoves().length
            ? `<button class="button ghost passage-move-action" data-action="passage-moves">${escapeHtml(uiText('Use a Move', 'Usar una Movida'))}</button>`
            : '';
        return `<section id="passageBar" class="passage-bar" ${captured?.hasSelection ? '' : 'hidden'} aria-label="${escapeHtml(t('captured'))}"><div class="passage-copy"><strong>${escapeHtml(t('captured'))}</strong><span id="passageExcerpt">${escapeHtml(captured?.text || '')}</span></div>${moveAction}${protectAction}<button class="button secondary" data-action="passage-review">${escapeHtml(t('reviewPassage'))}</button><button class="icon-button" data-action="clear-passage" aria-label="${escapeHtml(t('clear'))}">×</button></section>`;
    }

    function openPassageMoves() {
        if (concept !== 'integrated' || !captured?.hasSelection) return;
        const passageCheck = validateCapture();
        if (!passageCheck.ok) { captureInvalid(passageCheck.reason); return; }
        const quote = captured.text;
        openDialog(uiText('Use a Move with this passage', 'Usa una Movida con este pasaje'), genreLabel(), `<blockquote>${escapeHtml(quote)}</blockquote><p>${escapeHtml(uiText('Choose an optional genre-aware question or action. A note exists only if you write and save one.', 'Elige una pregunta o acción opcional apropiada al género. Solo existe una nota si escribes y guardas una.'))}</p><div class="choice-stack passage-move-choices">${integratedMoves().map((move, index) => `<button class="radio-card" data-action="passage-move" data-move="${index}"><span><strong>${escapeHtml(integratedMoveNudge(move))}</strong><br><small>${escapeHtml(integratedMoveLabel(move))}</small></span></button>`).join('')}</div>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button>`);
    }

    function protectCapturedPhrase() {
        if (concept !== 'integrated') return;
        // Exact wording only, and only if it is still this draft's wording.
        const check = validateCapture();
        if (!check.ok) { captureInvalid(check.reason); return; }
        const normalized = captured.text.trim();
        if (!voiceEntries().some(item => item.text === normalized)) {
            const entry = { id: `voice-${Date.now()}`, text: normalized, protectedAt: new Date().toISOString(), genre: state.genre, studentAuthored: true, reason: '' };
            state.voiceEntries.push(entry);
            state.protectedPhrases.push(entry);
            saveState(uiText('Kept as your voice. You can add a note later if useful.', 'Guardado como tu voz. Puedes agregar una nota después si te sirve.'));
        } else {
            announce(uiText('That exact wording is already in Your Voice.', 'Esa redacción exacta ya está en Tu voz.'));
        }
        captured = null;
        renderApp();
        document.getElementById('draftEditor')?.focus();
    }

    function updatePassageBar() {
        let bar = document.getElementById('passageBar');
        if (!bar) {
            document.body.insertAdjacentHTML('beforeend', renderPassageBar());
            bar = document.getElementById('passageBar');
        }
        if (!captured?.hasSelection) { bar.hidden = true; return; }
        bar.hidden = false;
        const excerpt = document.getElementById('passageExcerpt');
        if (excerpt) excerpt.textContent = captured.text;
    }

    function updateVisualViewport() {
        const vv = window.visualViewport;
        const offset = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
        document.documentElement.style.setProperty('--vv-offset', `${offset}px`);
    }

    function openDialog(title, subtitle, body, footer, options = {}) {
        lastFocus = document.activeElement;
        dialogRoot.innerHTML = `<div class="overlay" data-action="overlay-close"><section class="dialog ${options.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="dialogTitle"><header class="dialog-header"><div><h2 id="dialogTitle">${escapeHtml(title)}</h2>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}</div><button class="icon-button" data-action="close-dialog" aria-label="${escapeHtml(t('cancel'))}">×</button></header><div class="dialog-body">${body}</div>${footer ? `<footer class="dialog-footer">${footer}</footer>` : ''}</section></div>`;
        const dialog = dialogRoot.querySelector('[role="dialog"]');
        const editable = dialog.querySelector('textarea, input[type="text"]');
        if (editable && concept === 'integrated') {
            editable.dataset.editKey ||= `dialog-${editable.id || 'writing'}`;
            dialog.querySelector('.dialog-header')?.insertAdjacentHTML('beforeend', renderEditControls('dialog'));
            setActiveEditSurface(editable);
        }
        dialogGuard = {
            fields: Array.from(dialog.querySelectorAll('[data-protect-dirty]')).map(field => ({ field, initial: field.value })),
        };
        dialogAfterDiscard = null;
        requestAnimationFrame(() => (dialog.querySelector('input, textarea, button, select, [tabindex]') || dialog).focus());
    }

    function dialogHasDirtyText() {
        return Boolean(dialogGuard?.fields.some(({ field, initial }) => document.contains(field) && field.value !== initial));
    }

    function showDirtyDialogConfirmation() {
        const body = dialogRoot.querySelector('.dialog-body');
        if (!body) return;
        let confirmation = body.querySelector('.dirty-confirm');
        if (!confirmation) {
            body.insertAdjacentHTML('beforeend', `<section class="dirty-confirm" role="alert" aria-labelledby="dirtyConfirmTitle"><strong id="dirtyConfirmTitle">${escapeHtml(state.lang === 'en' ? 'Discard unsaved changes?' : '¿Descartar cambios no guardados?')}</strong><p>${escapeHtml(state.lang === 'en' ? 'This text has not been saved as evidence or added to your draft.' : 'Este texto no se ha guardado como evidencia ni se ha añadido a tu borrador.')}</p><div class="dirty-confirm-actions"><button class="button danger" data-action="discard-dialog">${escapeHtml(state.lang === 'en' ? 'Discard changes' : 'Descartar cambios')}</button><button class="button secondary" data-action="keep-editing">${escapeHtml(state.lang === 'en' ? 'Keep editing' : 'Seguir editando')}</button></div></section>`);
            confirmation = body.querySelector('.dirty-confirm');
        }
        confirmation.querySelector('[data-action="keep-editing"]')?.focus();
    }

    function finishDialogClose() {
        window.StudioTour?.notifyDialogClosed();
        dialogRoot.innerHTML = '';
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
        lastFocus = null;
        dialogGuard = null;
    }

    function closeDialog(force = false, afterClose = null) {
        if (pendingProviderToken && !pendingProviderToken.settled) pendingProviderToken.cancelled = true;
        if (!force && dialogHasDirtyText()) {
            dialogAfterDiscard = afterClose;
            showDirtyDialogConfirmation();
            return false;
        }
        finishDialogClose();
        if (afterClose) afterClose();
        return true;
    }

    function discardDialogChanges() {
        const afterClose = dialogAfterDiscard;
        dialogAfterDiscard = null;
        closeDialog(true, afterClose);
    }

    function keepEditingDialog() {
        dialogRoot.querySelector('.dirty-confirm')?.remove();
        dialogAfterDiscard = null;
        const dirtyField = dialogGuard?.fields.find(({ field, initial }) => field.value !== initial)?.field;
        dirtyField?.focus();
    }

    // The paste dialog opens EMPTY. It exists so a writer can bring in their own
    // draft from elsewhere — never to seed the canonical draft with sample text.
    // The exact preview mirrors what the writer actually typed or pasted, so the
    // preview keeps meaning what it says everywhere else in the Studio.
    function openPasteDialog() {
        openDialog(t('paste'), t('pasteWarning'), `<div class="field"><label for="pasteDraft">${escapeHtml(t('currentDraft'))}</label><textarea id="pasteDraft" data-protect-dirty spellcheck="${spellcheckEnabled()}" placeholder="${escapeHtml(state.lang !== 'en' ? 'Pega aquí tu propio borrador…' : 'Paste your own draft here…')}"></textarea></div><p class="exact-preview" id="pastePreview"></p>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="replace-draft">${escapeHtml(t('replaceDraft'))}</button>`);
    }

    function openPasteNotebookDialog() {
        const card = activeNotebookCard();
        const current = state.notebookEntries[notebookEntryKey(card)]?.text || '';
        openDialog(t('pasteNotebook'), t('pasteWarning'), `<div class="field"><label for="pasteNotebookText">${escapeHtml(`${t('notebook')}: ${notebookCardLabel(card)}`)}</label><textarea id="pasteNotebookText" data-protect-dirty spellcheck="${spellcheckEnabled()}">${escapeHtml(current)}</textarea></div><p>${escapeHtml(t('authorshipBoundary'))}</p><div class="exact-preview" id="pasteNotebookPreview">${escapeHtml(current)}</div>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="save-notebook-paste">${escapeHtml(t('saveCard'))}</button>`);
    }

    function saveNotebookPaste() {
        const card = activeNotebookCard();
        state.notebookEntries[notebookEntryKey(card)] = { text: document.getElementById('pasteNotebookText')?.value || '', updatedAt: new Date().toISOString(), provenance: 'student-imported-synthetic' };
        saveState(t('notebookSaved')); closeDialog(true); renderApp();
    }

    function createCanonicalDraft() {
        if (!state.draftDeclared) {
            state.draftDeclared = true;
            state.draftCreatedAt = new Date().toISOString();
            state.draft = '';
            state.versions = [];
            state.packetCreatedAt = null;
            state.packetDraft = '';
            announce(t('createdEmpty'));
        }
        state.place = 'draft';
        saveState(t('createdEmpty')); renderApp();
        requestAnimationFrame(() => document.getElementById('draftEditor')?.focus());
    }

    function openNotebookCoachDialog() {
        const card = activeNotebookCard();
        const text = state.notebookEntries[notebookEntryKey(card)]?.text || '';
        if (!text.trim()) {
            announce(state.lang === 'en' ? 'Write a notebook note before asking about it.' : 'Escribe una nota antes de preguntar sobre ella.');
            return;
        }
        openDialog(t('notebookCoach'), t('notebookCoachBoundary'), `<div class="field"><label>${escapeHtml(t('exactPreview'))}</label><div class="exact-preview" id="notebookPayloadPreview">${escapeHtml(text)}</div></div><label class="consent-box"><input id="transmitConsent" type="checkbox"><span><strong>${escapeHtml(t('consent'))}</strong><br>${escapeHtml(t('noNetwork'))}</span></label>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="submit-notebook-coach" disabled>${escapeHtml(t('sendCoach'))}</button>`);
    }

    function submitNotebookCoach(button) {
        const card = activeNotebookCard();
        const text = state.notebookEntries[notebookEntryKey(card)]?.text || '';
        button.disabled = true;
        const response = state.lang === 'en'
            ? `Question to consider: which detail in these notes most directly serves your purpose? I will not turn the note into draft prose.`
            : `Pregunta para considerar: ¿qué detalle de estas notas sirve más directamente a tu propósito? No convertiré la nota en prosa del borrador.`;
        state.notebookCoachRuns.push({ id: `notebook-coach-${Date.now()}`, cardId: notebookEntryKey(card), payload: text, response, createdAt: new Date().toISOString(), mock: true });
        saveState(); closeDialog(true); renderApp();
    }

    function openMyWork() {
        const currentEntries = notebookCards().map(card => ({ card, entry: state.notebookEntries[notebookEntryKey(card)] })).filter(item => wordCount(item.entry?.text));
        const draftStatus = state.draftDeclared ? `${wordCount(state.draft)} ${state.lang === 'en' ? 'words' : 'palabras'} · ${t('currentVersion')}` : t('draftMissing');
        openDialog(t('myWork'), state.lang === 'en' ? 'A truthful inventory—not a submission screen.' : 'Un inventario veraz—no una pantalla de entrega.', `<div class="artifact-list"><div class="artifact-row"><strong>${escapeHtml(t('draft'))}</strong><small>${escapeHtml(draftStatus)}</small></div><div class="artifact-row"><strong>${escapeHtml(t('notebook'))}</strong><small>${currentEntries.length}/${notebookCards().length} ${escapeHtml(state.lang === 'en' ? 'cards with useful work' : 'tarjetas con trabajo útil')}</small></div><div class="artifact-row"><strong>${escapeHtml(t('versions'))}</strong><small>${state.versions.length}</small></div><div class="artifact-row"><strong>${escapeHtml(t('reviewCenter'))}</strong><small>${state.reviews.length + state.councilRuns.length} ${escapeHtml(state.lang === 'en' ? 'saved reports' : 'informes guardados')} · ${state.decisions.length} ${escapeHtml(state.lang === 'en' ? 'decisions' : 'decisiones')}</small></div><div class="artifact-row"><strong>${escapeHtml(t('reflection'))}</strong><small>${['changed','decision','voice'].filter(key => state.reflections[key].trim()).length}/3</small></div></div><p>${escapeHtml(state.lang === 'en' ? 'Backup is available in Settings. Submit happens outside Tu Pana.' : 'La copia de seguridad está en Configuración. La entrega ocurre fuera de Tu Pana.')}</p>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button secondary" data-action="settings">${escapeHtml(t('settings'))}</button>`);
    }

    function openMoveDialog(index) {
        const title = genreMoves('discover')[index] || genreMoves('discover')[0];
        const existing = state.artifacts[`move-${index}`]?.text || '';
        openDialog(title, contextMoveDetail(index), `<div class="field"><label for="moveNote">${escapeHtml(state.lang !== 'en' ? 'Nota de apoyo (no compite con tu borrador)' : 'Supporting note (not a competing draft)')}</label><textarea id="moveNote" data-protect-dirty spellcheck="${spellcheckEnabled()}" placeholder="${escapeHtml(state.lang !== 'en' ? 'Escribe una nota breve en tus propias palabras…' : 'Write a brief note in your own words…')}">${escapeHtml(existing)}</textarea></div><p>${escapeHtml(state.lang !== 'en' ? 'Esta tarjeta queda disponible como contexto. Nunca cambia ni inserta texto en tu borrador.' : 'This card remains available as context. It never changes or inserts text into your draft.')}</p>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="save-move" data-move="${index}">${escapeHtml(t('saveReturn'))}</button>`);
    }

    function openIntegratedMoveNote(index, link = null) {
        const move = integratedMoves()[index];
        if (!move) return;
        const existingNote = state.moveNotes[moveNoteKey(move)] || null;
        const existing = existingNote?.text || '';
        pendingMoveLink = link || existingNote?.passageLink || null;
        const linked = pendingMoveLink ? `<section class="linked-passage" aria-label="${escapeHtml(uiText('Linked passage', 'Pasaje vinculado'))}"><strong>${escapeHtml(uiText('Linked to this exact quotation', 'Vinculada a esta cita exacta'))}</strong><blockquote>${escapeHtml(pendingMoveLink.quote)}</blockquote><small>${escapeHtml(resolvePassageLink(pendingMoveLink).label)}</small></section>` : '';
        openDialog(integratedMoveLabel(move), integratedMoveWhy(move), `${linked}<div class="field"><label for="integratedMoveNote">${escapeHtml(t('planningNotes'))}</label><textarea id="integratedMoveNote" data-protect-dirty spellcheck="${spellcheckEnabled()}" placeholder="${escapeHtml(integratedMovePrompt(move))}">${escapeHtml(existing)}</textarea></div><p class="boundary-note"><strong>${escapeHtml(state.lang === 'en' ? 'Reference only.' : 'Solo referencia.')}</strong> ${escapeHtml(state.lang === 'en' ? 'This note never transfers into or changes the canonical draft. You may write a fragment, question, quotation, observation, outline point, or evidence.' : 'Esta nota nunca se transfiere ni cambia el borrador canónico. Puedes escribir un fragmento, pregunta, cita, observación, punto de esquema o evidencia.')}</p>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="save-integrated-note" data-move="${index}">${escapeHtml(t('saveReturn'))}</button>`);
    }

    function saveIntegratedMoveNote(index) {
        const move = integratedMoves()[index];
        if (!move) return;
        const text = document.getElementById('integratedMoveNote')?.value || '';
        const key = moveNoteKey(move);
        const existing = state.moveNotes[key];
        if (!text.trim()) {
            pendingMoveLink = null;
            announce(existing ? uiText('The existing note was not replaced with an empty note.', 'La nota existente no se reemplazó con una nota vacía.') : uiText('No note was created.', 'No se creó ninguna nota.'));
            closeDialog(true); renderApp();
            return;
        }
        state.moveNotes[key] = { ...existing, text, updatedAt: new Date().toISOString(), provenance: 'student', genre: state.genre, moveId: move.id, passageLink: pendingMoveLink || existing?.passageLink || null };
        state.invitations ||= { moveReview: null, finishReflection: null };
        const priorInvitation = state.invitations.moveReview;
        const hiddenForThisDraft = priorInvitation?.hiddenForDraft && priorInvitation.draftSignature === draftInvitationKey();
        state.invitations.moveReview = { moveKey: key, createdAt: new Date().toISOString(), dismissed: hiddenForThisDraft, hiddenForDraft: hiddenForThisDraft, draftSignature: draftInvitationKey() };
        pendingMoveLink = null;
        saveState(state.lang === 'en' ? 'Planning note saved locally.' : 'Nota de planificación guardada localmente.');
        closeDialog(true); renderApp();
    }

    function openCoachDialog() {
        if (concept === 'notebook' && !state.draftDeclared) {
            announce(t('draftToolsLocked'));
            return;
        }
        const base = captured?.hasSelection ? captured : deriveDraftScopes();
        if (!base || !base.full.trim()) {
            announce(state.lang !== 'en' ? 'Escribe algo antes de pedir coaching.' : 'Write something before asking for coaching.');
            return;
        }
        captured = base;
        openScopeDialog('coach', t('coach'), state.lang !== 'en' ? 'Elige exactamente qué texto revisar.' : 'Choose exactly which text to review.');
    }

    function deriveDraftScopes() {
        const full = getDraft();
        let paragraph = '';
        if (Number.isFinite(editorCaret) && editorCaret >= 0 && editorCaret <= full.length) {
            const beforeBreak = full.lastIndexOf('\n', Math.max(0, editorCaret - 1)) + 1;
            const afterBreakRaw = full.indexOf('\n', editorCaret);
            const afterBreak = afterBreakRaw === -1 ? full.length : afterBreakRaw;
            paragraph = full.slice(beforeBreak, afterBreak).trim() ? full.slice(beforeBreak, afterBreak) : '';
        }
        return { text: '', paragraph, full, hasSelection: false, capturedAt: new Date().toISOString() };
    }

    // ── F1 — Ask Tu Pana carries a genuine request ────────────────────────
    // Before this, the Ask Tu Pana pathway had NO question field anywhere in
    // the Studio, and sent the literal string 'Student question' /
    // 'Pregunta del estudiante' as the request. On a draft the writer had not
    // annotated, the model therefore received text and no actual request. The
    // 1D live run recorded three different failures from that one cause: the
    // transmitted draft ignored, a coach asking a question the interface could
    // not accept, and a recitation of the internal rule scaffolding.
    //
    // Two changes close it. The writer now has a real, optional question box;
    // and when they leave it blank, an EXPLICIT BOUNDED DEFAULT REQUEST is
    // sent under a label saying Tu Pana generated it. The default is a genuine
    // instruction — one useful next move on the writing already transmitted —
    // not a placeholder pretending to be a student question, and it tells the
    // model in as many words not to ask for text it already has.
    const COACH_DEFAULT_REQUEST = {
        en: 'The writer did not type a specific question. The writing above is what they chose to send, and it is complete for this request — do not ask them to provide, paste, or resend it. Read it and offer one useful next move: name one thing the writing is already doing, and ask one focused revision question the writer can act on now.',
        es: 'La persona que escribe no escribió una pregunta específica. El texto de arriba es lo que decidió enviar y está completo para esta solicitud — no le pidas que lo proporcione, lo pegue ni lo envíe de nuevo. Léelo y ofrece una movida útil: nombra algo que la escritura ya está haciendo y haz una pregunta de revisión enfocada que pueda aplicar ahora.',
    };
    // The provider language, mirroring submitMockReview: `both` mode sends es.
    function providerLangCode() { return state.lang === 'en' ? 'en' : 'es'; }
    function coachDefaultRequest() { return providerLangCode() === 'en' ? COACH_DEFAULT_REQUEST.en : COACH_DEFAULT_REQUEST.es; }
    // The single source of truth for what the coach pathway transmits as its
    // request. The consent preview and the actual send both read it, so the
    // preview cannot drift from the payload.
    function coachRequestText(typed) {
        const question = String(typed ?? '').trim();
        return question || coachDefaultRequest();
    }
    function coachQuestionValue() {
        return String(dialogRoot.querySelector('#coachQuestion')?.value ?? '').trim();
    }
    function renderCoachQuestionField() {
        return `<div class="field coach-question"><label for="coachQuestion">${escapeHtml(uiText('What would you like to ask about this writing?', '¿Qué te gustaría preguntar sobre esta escritura?'))}</label><textarea id="coachQuestion" rows="2" spellcheck="${spellcheckEnabled()}" aria-describedby="coachQuestionHint" placeholder="${escapeHtml(uiText('For example: is my main idea clear here?', 'Por ejemplo: ¿se entiende aquí mi idea principal?'))}"></textarea><p class="field-hint" id="coachQuestionHint">${escapeHtml(uiText('Optional. Leave it blank and Tu Pana is asked for one useful next move on the writing above. Either way, the exact request appears below before you send.', 'Opcional. Si lo dejas en blanco, se le pide a Tu Pana una movida útil sobre la escritura de arriba. En cualquier caso, la solicitud exacta aparece abajo antes de enviar.'))}</p></div>`;
    }
    // Requirement 3: the writer sees EVERYTHING being transmitted. The scope
    // preview already shows the writing; this shows the request that travels
    // with it, whether the writer wrote it or Tu Pana supplied the default.
    function renderCoachRequestPreview() {
        return `<div class="field"><span class="field-label" id="coachRequestPreviewLabel">${escapeHtml(uiText('Exact request sent with your writing', 'Solicitud exacta que se envía con tu escritura'))}</span><div class="exact-preview" id="coachRequestPreview" role="region" aria-labelledby="coachRequestPreviewLabel" tabindex="0">${escapeHtml(coachRequestText(''))}</div></div>`;
    }
    // Short, honest card title. A typed question titles its own card; a
    // defaulted request is never labelled as though the writer asked it.
    function coachReviewTitle(question) {
        if (!question) return uiText('One useful next move', 'Una movida útil');
        return question.length <= 90 ? question : `${question.slice(0, 89)}…`;
    }

    function openScopeDialog(kind, title, subtitle) {
        const scopes = [];
        if (captured?.hasSelection && captured.text?.trim()) scopes.push(['selected', t('selectedScope'), captured.text]);
        if (captured?.paragraph?.trim()) scopes.push(['paragraph', t('paragraphScope'), captured.paragraph]);
        if (captured?.full?.trim()) scopes.push(['full', t('fullScope'), captured.full]);
        const defaultScope = scopes[0]?.[0] || 'full';
        const facts = concept === 'integrated' ? renderIntegratedTransmissionFacts(kind) : '';
        const scopeHint = captured?.hasSelection ? '' : `<p class="scope-hint">${escapeHtml(state.lang === 'en' ? 'No passage is selected. Select words in the draft to add a passage option.' : 'No hay un pasaje seleccionado. Selecciona palabras del borrador para añadir esa opción.')}</p>`;
        openDialog(title, subtitle, `${facts}${scopeHint}<div class="scope-grid" role="radiogroup" aria-label="Review scope">${scopes.map(([id, label, text]) => `<label class="scope-choice"><input type="radio" name="reviewScope" value="${id}" ${id === defaultScope ? 'checked' : ''}><strong>${escapeHtml(label)}</strong><span>${wordCount(text)} ${escapeHtml(state.lang !== 'en' ? 'palabras' : 'words')}</span></label>`).join('')}</div><div class="field" style="margin-top:17px"><label>${escapeHtml(t('exactPreview'))}</label><div class="exact-preview" id="scopePreview">${escapeHtml(scopeText(defaultScope))}</div></div>${kind === 'focused' ? renderLensChoices() : `${renderCoachQuestionField()}${renderCoachRequestPreview()}`}${renderMoveContextOffer()}${renderVoiceConstraintOffer()}<label class="consent-box"><input id="transmitConsent" type="checkbox"><span><strong>${escapeHtml(consentText())}</strong><br>${boundaryMarkup()}</span></label>${a3DisclosureMarkup()}`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="submit-mock" data-kind="${kind}" disabled>${escapeHtml(kind === 'focused' ? sendReviewLabel() : sendCoachLabel())}</button>`);
    }

    function renderMoveContextOffer() {
        if (concept !== 'integrated') return '';
        const linked = linkedMoveNotesForSelection();
        if (!linked.length) return '';
        return `<details class="move-context-offer"><summary>${escapeHtml(uiText('Optional: frame this request with my linked Move note', 'Opcional: orientar esta solicitud con mi nota vinculada de Movida'))}</summary><p>${escapeHtml(uiText('The general passage-help path stays available. Nothing is selected or sent automatically.', 'La ayuda general sobre el pasaje sigue disponible. Nada se selecciona ni se envía automáticamente.'))}</p><div class="choice-stack">${linked.map(({ move, index, note }) => `<label class="move-context-choice"><span class="check-line"><input type="radio" name="moveContext" value="${index}"> <span><strong>${escapeHtml(integratedMoveLabel(move))}</strong><br>${escapeHtml(note.text)}</span></span><span class="exact-preview move-context-preview"><strong>${escapeHtml(uiText('Exact linked quotation', 'Cita vinculada exacta'))}</strong>\n${escapeHtml(note.passageLink.quote)}</span></label>`).join('')}</div><button class="text-button" type="button" data-action="clear-move-context">${escapeHtml(uiText('Use general passage help instead', 'Usar ayuda general sobre el pasaje'))}</button></details>`;
    }

    function renderVoiceConstraintOffer() {
        if (concept !== 'integrated' || !voiceEntries().length) return '';
        return `<details class="voice-constraint"><summary>${escapeHtml(uiText('Optional: ask the mock reviewer to honor selected Your Voice entries', 'Opcional: pide al revisor simulado que respete entradas seleccionadas de Tu voz'))}</summary><label class="check-line"><input type="checkbox" id="includeVoiceEntries"> <span>${escapeHtml(uiText('Include these exact entries with this mock request', 'Incluye estas entradas exactas con esta solicitud simulada'))}</span></label><div class="exact-preview voice-entry-preview">${voiceEntries().map(item => `“${escapeHtml(item.text)}”`).join('\n')}</div><p>${escapeHtml(uiText('This local mock records your request only. It does not claim live-model enforcement.', 'Esta simulación local solo registra tu solicitud. No afirma que un modelo en vivo la aplique.'))}</p></details>`;
    }

    function renderIntegratedTransmissionFacts(kind) {
        const purpose = kind === 'focused'
            ? (state.lang === 'en' ? 'Apply one chosen genre-aware review lens.' : 'Aplicar una lente de revisión elegida y apropiada al género.')
            : (state.lang === 'en' ? 'Ask for one strength and one revision question about the chosen scope.' : 'Pedir una fortaleza y una pregunta de revisión sobre el alcance elegido.');
        const live = liveProviderActive();
        const reviewer = kind === 'focused'
            ? (live ? uiText('One genre-focused Tu Pana reviewer', 'Un revisor de Tu Pana enfocado en el género') : (state.lang === 'en' ? 'One mock genre-focused reviewer' : 'Un revisor simulado enfocado en el género'))
            : (live ? uiText('Tu Pana writing coach', 'Coach de escritura de Tu Pana') : (state.lang === 'en' ? 'Tu Pana mock writing coach' : 'Coach de escritura simulado Tu Pana'));
        return `<section class="transmission-facts" aria-label="AI request facts"><dl><div><dt>${escapeHtml(t('purpose'))}</dt><dd>${escapeHtml(purpose)}</dd></div><div><dt>${escapeHtml(t('reviewer'))}</dt><dd>${escapeHtml(reviewer)}</dd></div><div><dt>${escapeHtml(t('calls'))}</dt><dd>1</dd></div></dl><p><strong>${escapeHtml(t('decisionMaker'))}</strong></p></section>`;
    }

    function renderLensChoices() {
        return `<fieldset class="field"><legend>${escapeHtml(state.lang === 'en' ? 'Review lens' : 'Lente de revisión')}</legend><div class="choice-stack">${genreMoves('review').map((lens, i) => `<label class="radio-card"><input type="radio" name="reviewLens" value="${escapeHtml(lens)}" data-lens-index="${i}" ${i === 0 ? 'checked' : ''}><span>${escapeHtml(lens)}</span></label>`).join('')}</div></fieldset>`;
    }

    function openFocusedReviewDialog() {
        if (concept === 'notebook' && !state.draftDeclared) {
            announce(t('draftToolsLocked'));
            return;
        }
        const base = captured?.hasSelection ? captured : deriveDraftScopes();
        if (!base.full.trim()) return openCoachDialog();
        captured = base;
        openScopeDialog('focused', t('focusedReview'), state.lang !== 'en' ? 'Una lectura, una prioridad, tu decisión.' : 'One reading, one priority, your decision.');
    }

    function scopeText(scope) {
        if (!captured) return '';
        return scope === 'selected' ? captured.text : scope === 'paragraph' ? captured.paragraph : captured.full;
    }

    function submitMockReview(kind, button) {
        const scope = dialogRoot.querySelector('input[name="reviewScope"]:checked')?.value || 'full';
        const text = scopeText(scope);
        if (!text) return;
        const lensInput = kind === 'focused' ? dialogRoot.querySelector('input[name="reviewLens"]:checked') : null;
        // F1 — the coach pathway now carries a real request. `askedQuestion` is
        // the writer's own words (empty if they chose not to type one) and
        // `coachRequest` is exactly what the consent preview showed.
        const askedQuestion = kind === 'focused' ? '' : coachQuestionValue();
        const coachRequest = kind === 'focused' ? '' : coachRequestText(askedQuestion);
        const lens = lensInput ? lensInput.value : coachReviewTitle(askedQuestion);
        const lensIndex = lensInput ? Number(lensInput.dataset.lensIndex) : null;
        const voiceEntriesIncluded = dialogRoot.querySelector('#includeVoiceEntries')?.checked ? voiceEntries().map(item => ({ id: item.id, text: item.text })) : [];
        const moveIndex = Number(dialogRoot.querySelector('input[name="moveContext"]:checked')?.value);
        const linkedMove = Number.isInteger(moveIndex) ? integratedMoves()[moveIndex] : null;
        const linkedMoveNote = linkedMove ? state.moveNotes[moveNoteKey(linkedMove)] : null;
        const moveContextIncluded = linkedMove && linkedMoveNote ? { moveId: linkedMove.id, moveLabel: integratedMoveLabel(linkedMove), noteText: linkedMoveNote.text, quote: linkedMoveNote.passageLink?.quote || '', studentAuthored: true } : null;
        const restoreLabel = button.textContent;
        button.disabled = true;
        const provider = StudioProvider.active();
        button.textContent = provider.live
            ? (state.lang !== 'en' ? 'Leyendo…' : 'Reading…')
            : (state.lang !== 'en' ? 'Leyendo localmente…' : 'Reading locally…');
        // Everything the record will claim is captured at consent time; a response
        // landing after the draft, genre, or dialog has changed can never rewrite it.
        const genre = currentGenre();
        const consentedGenreId = state.genre;
        const consentedDraft = getDraft();
        const providerLang = state.lang === 'en' ? 'en' : 'es';
        const requestKind = kind === 'focused' && scope === 'full' ? 'full_draft_review' : 'passage_analysis';
        // B7 — accurate coverage statement. The previous comment here claimed
        // "genre rules travel with every request", which was never true: this
        // carries genres[id].coachRules, and a profile that declares none sends
        // no GENRE GUIDANCE line at all. After B1 nine of the eleven profiles
        // declared coachRules; `autobiographical` and `neutral` (General
        // Writing) did not, and transmitted no genre safeguard on any path.
        // B2 (founder-approved 2026-08-06) authored both, so ELEVEN of eleven
        // profiles now declare coachRules and are carried on all five
        // student-reachable pathways. That is a statement about COVERAGE — a
        // genre-appropriate safeguard set is transmitted on every path — and
        // not a claim that any student outcome is guaranteed.
        //
        // What IS universal, on every pathway and every profile, is
        // AUTHORSHIP_RULES; passage and full-draft paths add
        // PASSAGE_READING_PROTOCOL. Genre rules are strictly additive beneath
        // them, under a header saying so.
        const genreContext = genreCoachRules(consentedGenreId);
        const prompt = kind === 'focused' && scope === 'full'
            ? StudioProvider.buildFullDraftPrompt({ genreName: genre.label.en, genreContext, lang: providerLang, lensLabel: lens, lensInstruction: lens, purpose: 'genre-focused review', words: wordCount(text), text, voiceEntries: voiceEntriesIncluded })
            : StudioProvider.buildPassagePrompt({ genreName: genre.label.en, genreContext, lang: providerLang, scopeLabel: scope, text, question: kind === 'focused' ? `Focused review request — lens: ${lens}. Review only this consented ${scope === 'paragraph' ? 'paragraph' : 'passage'}; do not ask for the rest of the draft.` : coachRequest, requestLabel: kind !== 'focused' && !askedQuestion ? 'REQUEST GENERATED BY TU PANA (the writer did not type a question)' : undefined, moveContext: moveContextIncluded, voiceEntries: voiceEntriesIncluded });
        const token = { cancelled: false, settled: false };
        pendingProviderToken = token;
        provider.call({ requestKind, prompt, payload: { genreName: genre.label.en }, lang: providerLang }).then(result => {
            recordProviderUsage(requestKind, result.usage);
            if (token.cancelled) { recordProviderEvent(requestKind, { category: 'cancelled' }); return; }
            // F1 — VALIDATE BEFORE STORE, the Council kernel's discipline applied
            // to the four single-coach pathways. A response that recites this
            // application's internal rule scaffolding, or narrates its own
            // deliberation, never becomes visible text, never becomes a stored
            // review, and never triggers a version snapshot. Usage is still
            // counted above: the call really happened and really cost money.
            // Only the REASON is recorded — verdict.marker is a fragment of the
            // scaffolding itself, so persisting it would reintroduce the leak.
            const verdict = StudioProvider.validateCoachResponse(result.text);
            if (!verdict.ok) {
                recordProviderEvent(requestKind, { category: 'response_rejected', reason: verdict.reason });
                token.settled = true;
                button.disabled = false;
                button.textContent = restoreLabel;
                renderProviderFailure({ category: 'response_rejected', message: StudioProvider.errorMessage('response_rejected', providerLang), retryable: false });
                return;
            }
            token.settled = true;
            const suggestion = verdict.text;
            const snapshotId = concept === 'notebook' || concept === 'integrated'
                ? checkpointVersion(kind === 'focused' ? 'before focused review' : 'before coach feedback', consentedDraft)
                : null;
            const criticalKey = concept === 'integrated' ? integratedCriticalKey(kind, lensIndex) : null;
            state.reviews.push({ id: `review-${Date.now()}`, type: kind, lens, scope, words: wordCount(text), exactExcerpt: text.slice(0, 180), suggestion, createdAt: new Date().toISOString(), mock: !provider.live, provider: provider.name, requestKind, truncated: Boolean(result.truncated), purpose: kind === 'focused' ? 'genre-focused review' : 'writing coach question', reviewer: kind === 'focused' ? (provider.live ? 'Tu Pana genre-focused reviewer' : 'mock genre-focused reviewer') : (provider.live ? 'Tu Pana coach' : 'Tu Pana mock coach'), calls: 1, criticalKey, criticalPrompt: criticalKey ? criticalQuestion(criticalKey).en : null, criticalContext: criticalKey ? criticalRiskText(criticalKey) : null, draftSignature: draftSignature(consentedDraft), snapshotId, genre: consentedGenreId, genreLabel: genre.label.en, genreLabelEs: genre.label.es, voiceEntriesIncluded, moveContextIncluded, question: askedQuestion || null, requestDefaulted: kind !== 'focused' && !askedQuestion });
            saveState(); closeDialog(true); renderApp(); reviewTab = 'history'; openReviewCenter();
        }).catch(failure => {
            recordProviderEvent(requestKind, failure);
            if (token.cancelled) return;
            token.settled = true;
            button.disabled = false;
            button.textContent = restoreLabel;
            renderProviderFailure(failure);
        });
    }

    // Truthful provider-failure surface inside the open dialog: the request made
    // no change, saved nothing, and the non-AI path remains available.
    function renderProviderFailure(failure) {
        const dialog = dialogRoot.querySelector('.dialog');
        if (!dialog) { announce(failure.message); return; }
        dialog.querySelector('.provider-error')?.remove();
        const notice = document.createElement('div');
        notice.className = 'provider-error';
        notice.setAttribute('role', 'alert');
        const boundary = state.lang !== 'en'
            ? 'Tu borrador no cambió y nada se guardó de esta solicitud. Puedes seguir escribiendo sin IA.'
            : 'Your draft is unchanged and nothing from this request was saved. You can keep writing without AI.';
        notice.innerHTML = `<strong>${escapeHtml(failure.message || '')}</strong><br>${escapeHtml(boundary)}`;
        dialog.querySelector('.dialog-body, .dialog-content')?.appendChild(notice) || dialog.appendChild(notice);
    }

    // Metadata-only usage accounting (counts, never text), mirroring the legacy
    // tupana_ai_usage contract inside the studio record.
    function recordProviderUsage(requestKind, usage) {
        state.usage ||= { requests: 0, byKind: {} };
        state.usage.requests += 1;
        state.usage.byKind[requestKind] = (state.usage.byKind[requestKind] || 0) + 1;
        if (usage && typeof usage === 'object') {
            for (const field of ['inputTokens', 'outputTokens', 'thoughtTokens']) {
                if (Number.isFinite(usage[field])) state.usage[field] = (state.usage[field] || 0) + usage[field];
            }
        }
    }

    function recordProviderEvent(requestKind, failure) {
        state.providerEvents ||= [];
        state.providerEvents = state.providerEvents.slice(-9);
        // `reason` is added ONLY when the caller supplies one (currently the F1
        // response guard), so every pre-existing event keeps its exact shape.
        // It carries a category name — 'scaffolding' | 'deliberation' | 'empty'
        // — never any fragment of the rejected response.
        const event = { requestKind, category: failure?.category || 'unknown', at: new Date().toISOString() };
        if (failure?.reason) event.reason = failure.reason;
        state.providerEvents.push(event);
        saveState();
    }

    function mockSuggestion(kind, lens, text) {
        const genreLabel = currentGenre().label.en;
        if (state.lang !== 'en') return `Fortaleza: el pasaje establece una dirección clara para ${genreLabel}. Pregunta de revisión: ¿qué evidencia específica ayudaría al lector a seguir esta idea? No reescribí ninguna oración.`;
        return `Strength: this passage establishes a clear direction for the ${genreLabel}. Revision question: what specific evidence would help the reader follow this idea? I did not rewrite any sentence.`;
    }

    function openCouncilDialog() {
        if (concept === 'notebook' && !state.draftDeclared) {
            announce(t('draftToolsLocked'));
            return;
        }
        if (concept === 'integrated' && !councilEnabled()) {
            openDialog(t('council'), state.lang === 'en' ? 'Explicit profile boundary' : 'Límite explícito del perfil', `<p>${escapeHtml(councilUnavailableText())}</p><p>${escapeHtml(state.lang === 'en' ? 'No mock Council calls are represented. Your draft remains unchanged.' : 'No se representa ninguna llamada simulada del Consejo. Tu borrador no cambia.')}</p>`, `<button class="button primary" data-action="close-dialog">${escapeHtml(t('cancel'))}</button>`);
            return;
        }
        if (state.councilRuns.length && !getDraft().trim()) return openReviewCenter('council');
        const draft = getDraft();
        if (!draft.trim()) return openCoachDialog();
        const roles = genreMoves('council');
        const roleMeta = councilConfig[state.genre]?.roles || [];
        const councilFacts = concept === 'integrated' ? `<section class="transmission-facts"><dl><div><dt>${escapeHtml(t('purpose'))}</dt><dd>${escapeHtml(state.lang === 'en' ? 'Compare three genre-appropriate perspectives, then synthesize priorities.' : 'Comparar tres perspectivas apropiadas al género y sintetizar prioridades.')}</dd></div><div><dt>${escapeHtml(t('reviewer'))}</dt><dd>${escapeHtml(roles.join(' · '))}</dd></div><div><dt>${escapeHtml(t('calls'))}</dt><dd>${escapeHtml(state.lang === 'en' ? '3 reviewer calls + 1 synthesis' : '3 llamadas de revisión + 1 síntesis')}<br><small>${escapeHtml(liveProviderActive() ? uiText('The Council takes longer because it makes several live AI calls through the Tu Pana coach service.', 'El Consejo tarda más porque hace varias llamadas de IA en vivo mediante el servicio del coach de Tu Pana.') : uiText('The Council takes longer because it represents several separate readings.', 'El Consejo tarda más porque representa varias lecturas separadas.'))}</small></dd></div></dl><p><strong>${escapeHtml(t('decisionMaker'))}</strong></p></section>` : '';
        openDialog(t('council'), state.lang !== 'en' ? 'Tres perspectivas configuradas para este género. Ninguna reemplaza tu decisión.' : 'Three genre-configured perspectives. None replaces your decision.', `${councilFacts}<div class="choice-stack">${roles.map((role, index) => {
            // A profile may describe each perspective in its own words. Without
            // one, the neutral line stands — three purpose-built readers must
            // never be presented as three copies of the same generic offer.
            const blurb = roleMeta[index]?.blurb;
            const detail = blurb
                ? (state.lang === 'en' ? blurb.en : blurb.es)
                : (state.lang !== 'en' ? 'Busca una fortaleza y una pregunta.' : 'Looks for one strength and one question.');
            return `<div class="radio-card"><span><strong>${escapeHtml(role)}</strong><br><small>${escapeHtml(detail)}</small></span></div>`;
        }).join('')}</div><div class="field" style="margin-top:17px"><label>${escapeHtml(t('exactPreview'))}</label><div class="exact-preview">${escapeHtml(draft)}</div></div><label class="consent-box"><input id="transmitConsent" type="checkbox"><span><strong>${escapeHtml(consentText())}</strong><br>${boundaryMarkup()}</span></label>${a3DisclosureMarkup()}`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="run-council" disabled>${escapeHtml(conveneLabel())}</button>`);
    }

    function runCouncil(button) {
        const restoreLabel = button.textContent;
        button.disabled = true;
        const provider = StudioProvider.active();
        button.textContent = provider.live
            ? (state.lang !== 'en' ? 'Convocando…' : 'Convening…')
            : (state.lang !== 'en' ? 'Convocando localmente…' : 'Convening locally…');
        // Everything the record will claim is captured at consent time.
        const roles = genreMoves('council');
        const genre = currentGenre();
        const consentedGenreId = state.genre;
        const providerLang = state.lang === 'en' ? 'en' : 'es';
        const config = councilConfig[consentedGenreId] || {};
        const roleMeta = config.roles || [{ key: 'structure' }, { key: 'evidence' }, { key: 'voice' }];
        const draftText = getDraft();
        const kernel = window.StudioCouncil;
        const token = { cancelled: false, settled: false };
        pendingProviderToken = token;
        let callsMade = 0;

        const reviewerCalls = roles.map((roleLabel, index) => {
            const meta = roleMeta[index] || { key: 'structure' };
            return provider.call({
                requestKind: 'council_reviewer',
                prompt: StudioProvider.buildCouncilReviewerPrompt({ genreName: genre.label.en, genreContext: genreCoachRules(consentedGenreId), lang: providerLang, roleLabel, roleMandate: meta.mandate || roleLabel, prohibitions: config.prohibitions || [], text: draftText }),
                payload: { genreName: genre.label.en, roleKey: meta.key, roleLabel, draft: draftText },
                lang: providerLang,
            }).then(result => {
                callsMade += 1;
                recordProviderUsage('council_reviewer', result.usage);
                // Role identity comes from the requested role record, never the text.
                return kernel.validateReviewerResult(result.text, draftText, meta.key, roleLabel);
            }, failure => {
                recordProviderEvent('council_reviewer', failure);
                return { ok: false, reason: failure.category || 'call-failed', roleKey: meta.key, roleLabel, findings: [], preserve: [], dropped: [] };
            });
        });

        function abortRun(messageEn, messageEs, category) {
            recordProviderEvent('council_synthesis', { category: category || 'council-aborted' });
            if (token.cancelled) return;
            token.settled = true;
            button.disabled = false;
            button.textContent = restoreLabel;
            renderProviderFailure({ message: uiText(messageEn, messageEs) });
        }

        Promise.all(reviewerCalls).then(outcomes => {
            if (token.cancelled) { recordProviderEvent('council_reviewer', { category: 'cancelled' }); return null; }
            const validOutcomes = outcomes.filter(outcome => outcome.ok);
            if (validOutcomes.length < kernel.LIMITS.minReviewers) {
                abortRun('The Council could not gather enough valid perspectives. Your draft is unchanged and nothing was saved. You can try again or use a focused review.',
                    'El Consejo no pudo reunir suficientes perspectivas válidas. Tu borrador no cambió y nada se guardó. Puedes intentarlo de nuevo o usar una revisión enfocada.', 'too-few-reviewers');
                return null;
            }
            const allFindings = validOutcomes.flatMap(outcome => outcome.findings);
            const allPreserve = validOutcomes.flatMap(outcome => outcome.preserve);
            const droppedCount = outcomes.flatMap(outcome => outcome.dropped || []).length;
            const reviewers = outcomes.map(outcome => ({ roleKey: outcome.roleKey, roleLabel: outcome.roleLabel, status: outcome.ok ? 'complete' : 'failed', dropped: (outcome.dropped || []).length }));
            const finish = report => ({ report, allFindings, allPreserve, droppedCount, reviewers, validCount: validOutcomes.length });

            if (!allFindings.length && !allPreserve.length) {
                // Legacy empty-findings shortcut: no synthesis call is made or represented.
                return finish({ summary: uiText('The Council reported no findings. That is information, not a failure.', 'El Consejo no reportó hallazgos. Eso es información, no un fracaso.'), priorities: [], secondary: [], preserve: [], disagreements: [] });
            }

            const findingsLite = allFindings.map(({ id, roleKey, claim, evidenceQuote, severity, confidence, revisionMove, why }) => ({ id, roleKey, claim, evidenceQuote, severity, confidence, revisionMove, why }));
            const preserveLite = allPreserve.map(({ id, roleKey, quote, why }) => ({ id, roleKey, quote, why }));
            const synthesisCall = () => provider.call({
                requestKind: 'council_synthesis',
                prompt: StudioProvider.buildCouncilSynthesisPrompt({ genreName: genre.label.en, genreContext: genreCoachRules(consentedGenreId), lang: providerLang, synthesisOrder: config.synthesisOrder || [], findingsJson: JSON.stringify({ findings: findingsLite, preserve: preserveLite }) }),
                payload: { genreName: genre.label.en, validated: { findings: allFindings, preserve: allPreserve } },
                lang: providerLang,
            }).then(result => {
                callsMade += 1;
                recordProviderUsage('council_synthesis', result.usage);
                return kernel.validateSynthesisResult(result.text, allFindings, allPreserve, draftText);
            });
            return synthesisCall().then(validated => validated.ok ? validated : synthesisCall()).then(validated => {
                if (!validated.ok) {
                    abortRun('The Council synthesis could not be validated, so no report was saved. Your draft is unchanged.',
                        'La síntesis del Consejo no pudo validarse, así que no se guardó ningún informe. Tu borrador no cambió.', 'synthesis-invalid');
                    return null;
                }
                return finish(validated.report);
            });
        }).then(outcome => {
            if (!outcome || token.cancelled) return;
            token.settled = true;
            const { report, droppedCount, reviewers, validCount } = outcome;
            const snapshotId = concept === 'notebook' || concept === 'integrated' ? checkpointVersion('before Council review', draftText) : null;
            const flattened = [...report.priorities, ...report.secondary].map(item => ({
                role: item.roles ? item.roles.map(roleKey => (roleMeta.find(meta => meta.key === roleKey) || { key: roleKey }).key).join(' + ') : '',
                roleKeys: item.roles || [],
                suggestion: `${item.claim}${item.revisionMove ? ` — ${item.revisionMove}` : ''}`,
                quote: item.evidenceQuote || null,
                corroborated: Boolean(item.corroborated),
                confidence: item.confidence || 'high',
                voiceNote: item.voiceNote || null,
            }));
            const run = {
                id: `council-${Date.now()}`, createdAt: new Date().toISOString(), genre: consentedGenreId,
                genreLabel: genre.label.en, genreLabelEs: genre.label.es, roles: [...roles], payloadScope: 'full', snapshotId,
                words: wordCount(draftText), signature: `${draftText.length}:${draftText.slice(0, 24)}`,
                findings: flattened, report, reviewers, droppedCount,
                status: validCount === roles.length ? 'complete' : 'partial',
                mock: !provider.live, provider: provider.name,
                calls: callsMade,
                criticalKey: concept === 'integrated' ? integratedCriticalKey('council') : null,
                criticalPrompt: concept === 'integrated' ? criticalQuestion(integratedCriticalKey('council')).en : null,
                criticalContext: concept === 'integrated' ? criticalRiskText(integratedCriticalKey('council'), consentedGenreId) : null,
                draftSignature: `${draftText.length}:${draftText.slice(0, 24)}`,
            };
            state.councilRuns.push(run);
            saveState(); closeDialog(true); renderApp(); reviewTab = 'council'; openReviewCenter();
        }).catch(failure => {
            recordProviderEvent('council_synthesis', failure);
            if (token.cancelled) return;
            token.settled = true;
            button.disabled = false;
            button.textContent = restoreLabel;
            renderProviderFailure(failure);
        });
    }

    function saveReviewCopy() {
        const text = getDraft();
        if (!text.trim()) {
            announce(uiText('Write something before saving a review copy.', 'Escribe algo antes de guardar una copia de revisión.'));
            return false;
        }
        const existing = reviewCopySnapshot();
        if (existing?.text === text) {
            announce(uiText('Your review copy already matches the live draft.', 'Tu copia de revisión ya coincide con el borrador activo.'));
            return true;
        }
        const snapshotId = checkpointVersion('review copy saved for a second look');
        const snapshot = state.versions.find(version => version.id === snapshotId);
        state.reviewCopy = {
            snapshotId,
            savedAt: snapshot?.createdAt || new Date().toISOString(),
            genre: state.genre,
            genreLabel: currentGenre().label.en,
            genreLabelEs: currentGenre().label.es,
        };
        saveState(uiText('Exact review copy saved locally. Your live draft is still editable.', 'Copia de revisión exacta guardada localmente. Tu borrador activo sigue siendo editable.'));
        return true;
    }

    function openRevisionCycle() {
        const copy = reviewCopySnapshot();
        if (!copy) {
            openDialog(uiText('Ready for a second look?', '¿Listo/a para una segunda mirada?'), uiText('A review copy is a local point for reflection—not a final lock.', 'Una copia de revisión es un punto local para reflexionar; no es un cierre final.'), `<p>${escapeHtml(uiText('Save an exact copy of the draft as it is now. You can keep editing before and after feedback, and this does not claim your writing is complete or ready to submit.', 'Guarda una copia exacta del borrador tal como está. Puedes seguir editando antes y después de recibir comentarios, y esto no afirma que tu escritura esté completa ni lista para entregar.'))}</p>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="save-review-copy">${escapeHtml(uiText('Save a review copy', 'Guardar una copia de revisión'))}</button>`);
            return;
        }
        const saved = versionTimestamp(copy);
        const councilAllowed = councilEnabled();
        const differs = copy.text !== getDraft();
        openDialog(uiText('Choose a second look', 'Elige una segunda mirada'), uiText(`Review copy saved ${saved}`, `Copia de revisión guardada ${saved}`), `<p>${escapeHtml(uiText('Choose the kind of support that fits today. Every path is optional; your live draft remains editable.', 'Elige el apoyo que te sirva hoy. Cada camino es opcional; tu borrador activo sigue siendo editable.'))}</p>${differs ? `<p class="revision-copy-note">${escapeHtml(uiText('Your live draft has changed since this copy. You may update the review copy deliberately; the earlier exact snapshot remains in local history.', 'Tu borrador activo cambió desde esta copia. Puedes actualizar la copia de revisión deliberadamente; la instantánea exacta anterior permanece en el historial local.'))}</p>` : ''}<div class="choice-stack revision-paths"><button class="radio-card" data-action="revision-self-review"><span><strong>${escapeHtml(uiText('Review it myself', 'Revisarlo yo mismo/a'))}</strong><br><small>${escapeHtml(uiText('Choose one thing to revisit in your own words.', 'Elige una cosa para revisar con tus propias palabras.'))}</small></span></button><button class="radio-card" data-action="revision-existing-feedback"><span><strong>${escapeHtml(uiText('Use feedback I already have', 'Usar comentarios que ya tengo'))}</strong><br><small>${escapeHtml(uiText('Reopen a saved report; this does not make a new request.', 'Reabre un informe guardado; esto no crea una solicitud nueva.'))}</small></span></button><button class="radio-card" data-action="revision-ask-feedback"><span><strong>${escapeHtml(uiText('Ask Tu Pana for feedback', 'Pedir comentarios a Tu Pana'))}</strong><br><small>${escapeHtml(uiText('Shows exact scope and consent before a local mock response.', 'Muestra el alcance exacto y el consentimiento antes de una respuesta simulada local.'))}</small></span></button>${councilAllowed ? `<button class="radio-card" data-action="revision-council"><span><strong>${escapeHtml(uiText('Convene the Council', 'Convocar al Consejo'))}</strong><br><small>${escapeHtml(uiText('Optional, genre-configured, and separately consented.', 'Opcional, configurado por género y con consentimiento aparte.'))}</small></span></button>` : `<div class="radio-card unavailable"><span><strong>${escapeHtml(t('council'))}</strong><br><small>${escapeHtml(t('councilUnavailable'))}</small></span></div>`}</div><p class="revision-copy-note">${escapeHtml(uiText('Saved copy: exact local text only. No quality score, lock, or automatic review.', 'Copia guardada: solo texto local exacto. Sin puntuación de calidad, cierre ni revisión automática.'))}</p>`, `<button class="button ghost" data-action="compare-review-copy">${escapeHtml(uiText('Compare copy and current draft', 'Comparar copia y borrador actual'))}</button>${differs ? `<button class="button secondary" data-action="update-review-copy">${escapeHtml(uiText('Update review copy', 'Actualizar copia de revisión'))}</button>` : ''}<button class="button secondary" data-action="return-write">${escapeHtml(uiText('Not now', 'Ahora no'))}</button>`);
    }

    function renderMoveReviewInvitation() {
        if (concept !== 'integrated') return '';
        const invitation = state.invitations?.moveReview;
        const note = invitation?.moveKey ? state.moveNotes[invitation.moveKey] : null;
        if (!invitation || invitation.dismissed || !wordCount(note?.text) || invitation.draftSignature !== draftInvitationKey()) return '';
        return `<section class="contextual-invitation" role="note"><div><strong>${escapeHtml(uiText('Use this note only if it helps', 'Usa esta nota solo si te ayuda'))}</strong><p>${escapeHtml(uiText('A focused review can now use the same genre-aware lens. The note stays local unless you explicitly include it with a selected passage.', 'Una revisión enfocada ahora puede usar la misma lente del género. La nota permanece local a menos que la incluyas explícitamente con un pasaje seleccionado.'))}</p></div><div class="invitation-actions"><button class="button secondary" data-action="focused-review">${escapeHtml(t('focusedReview'))}</button><button class="button ghost" data-action="dismiss-invitation" data-invitation="move-review">${escapeHtml(t('notNow'))}</button><button class="text-button" data-action="hide-invitation" data-invitation="move-review">${escapeHtml(uiText('Do not show again for this draft', 'No mostrar de nuevo para este borrador'))}</button></div></section>`;
    }

    function openRevisionFocus(suggestion = '') {
        const voice = voiceEntries();
        const existing = state.revisionCycle?.focus || '';
        const prompt = suggestion
            ? uiText('A saved suggestion is shown as context. You decide whether to use it, adapt it, reject it, or set it aside.', 'Una sugerencia guardada aparece como contexto. Tú decides si la usas, adaptas, rechazas o la dejas para después.')
            : uiText('Pick one revision to try. You do not need to fix everything or use feedback.', 'Elige una revisión para probar. No necesitas corregir todo ni usar comentarios.');
        openDialog(uiText('Choose what to work on', 'Elige en qué trabajar'), uiText('One student-chosen next move', 'Un próximo paso elegido por el estudiante'), `${suggestion ? `<blockquote>${escapeHtml(suggestion)}</blockquote>` : ''}<p>${escapeHtml(prompt)}</p>${voice.length ? `<p class="voice-constraint-note"><strong>${escapeHtml(uiText('Your Voice is here if useful.', 'Tu voz está aquí si te sirve.'))}</strong> ${escapeHtml(uiText(`${voice.length} exact student-selected entr${voice.length === 1 ? 'y' : 'ies'} remain local; you decide what to preserve.`, `${voice.length} entrada${voice.length === 1 ? '' : 's'} exacta${voice.length === 1 ? '' : 's'} seleccionada${voice.length === 1 ? '' : 's'} por el estudiante permanece${voice.length === 1 ? '' : 'n'} local${voice.length === 1 ? '' : 'es'}; tú decides qué conservar.`))}</p>` : ''}<div class="field"><label for="revisionFocus">${escapeHtml(uiText('My one revision to try (optional)', 'Mi una revisión para probar (opcional)'))}</label><textarea id="revisionFocus" data-protect-dirty spellcheck="${spellcheckEnabled()}" maxlength="500">${escapeHtml(existing)}</textarea></div>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="save-revision-focus" data-suggestion="${escapeHtml(suggestion)}">${escapeHtml(uiText('Return to draft', 'Volver al borrador'))}</button>`);
    }

    function saveRevisionFocus(suggestion = '') {
        state.revisionCycle ||= {};
        state.revisionCycle.focus = document.getElementById('revisionFocus')?.value || '';
        state.revisionCycle.selectedSuggestion = suggestion || null;
        state.revisionCycle.updatedAt = new Date().toISOString();
        saveState(state.revisionCycle.focus.trim() ? uiText('Your revision choice is saved locally.', 'Tu elección de revisión está guardada localmente.') : uiText('You can return to the draft without choosing a revision.', 'Puedes volver al borrador sin elegir una revisión.'));
        closeDialog(true); setView('write');
    }

    function openRevisionComparison(view = 'before') {
        const copy = reviewCopySnapshot();
        if (!copy?.text) return openRevisionCycle();
        const current = getDraft();
        const beforeActive = view === 'before';
        openDialog(uiText('Review copy and current draft', 'Copia de revisión y borrador actual'), uiText(`Review copy saved ${versionTimestamp(copy)}`, `Copia de revisión guardada ${versionTimestamp(copy)}`), `<p>${escapeHtml(uiText('Read the exact wording. Changes are not scored, graded, or labeled better; you decide what to keep and what to revisit.', 'Lee la redacción exacta. Los cambios no se puntúan, califican ni se etiquetan como mejores; tú decides qué conservar y qué revisar.'))}</p><div class="compare-mobile-tabs" role="tablist" aria-label="Draft comparison"><button role="tab" aria-selected="${beforeActive}" data-action="compare-view" data-view="before">${escapeHtml(uiText('Before: review copy', 'Antes: copia de revisión'))}</button><button role="tab" aria-selected="${!beforeActive}" data-action="compare-view" data-view="current">${escapeHtml(uiText('Current draft', 'Borrador actual'))}</button></div><div class="revision-compare-grid" data-compare-view="${view}"><section class="compare-pane compare-before" aria-label="Review copy"><h3>${escapeHtml(uiText('Review copy', 'Copia de revisión'))}</h3><small>${escapeHtml(versionTimestamp(copy))} · ${copy.words} ${escapeHtml(uiText('words', 'palabras'))}</small><pre>${escapeHtml(copy.text)}</pre></section><section class="compare-pane compare-current" aria-label="Current draft"><h3>${escapeHtml(t('currentDraft'))}</h3><small>${wordCount(current)} ${escapeHtml(uiText('words', 'palabras'))} · ${escapeHtml(uiText('Still editable', 'Aún editable'))}</small><pre>${escapeHtml(current)}</pre></section></div>`, `<button class="button ghost" data-action="revision-brief-reflection">${escapeHtml(uiText('Reflect briefly', 'Reflexionar brevemente'))}</button><button class="button secondary" data-action="return-write">${escapeHtml(uiText('Keep revising', 'Seguir revisando'))}</button><button class="button primary" data-action="finish-from-revision">${escapeHtml(uiText('Finish for now', 'Finalizar por ahora'))}</button>`, { wide: true });
    }

    function openRevisionBriefReflection() {
        const existing = state.revisionCycle?.closure || '';
        openDialog(uiText('Brief revision note', 'Nota breve de revisión'), uiText('Optional student-authored note', 'Nota opcional escrita por el estudiante'), `<p>${escapeHtml(uiText('If useful, name what you changed, what you kept because it sounded like you, or one thing you would revisit later. This is not another required reflection.', 'Si te sirve, nombra qué cambiaste, qué conservaste porque sonaba como tú o una cosa que revisarías después. No es otra reflexión obligatoria.'))}</p><div class="field"><label for="revisionClosure">${escapeHtml(uiText('My brief revision note (optional)', 'Mi nota breve de revisión (opcional)'))}</label><textarea id="revisionClosure" data-protect-dirty spellcheck="${spellcheckEnabled()}" maxlength="500">${escapeHtml(existing)}</textarea></div><p>${escapeHtml(uiText('Saving this creates factual local evidence only. Process Reflection stays in your own words.', 'Guardar esto crea solo evidencia factual local. La Reflexión del proceso sigue con tus propias palabras.'))}</p>`, `<button class="button ghost" data-action="return-write">${escapeHtml(uiText('Keep revising', 'Seguir revisando'))}</button><button class="button secondary" data-action="finish-from-revision">${escapeHtml(uiText('Finish for now', 'Finalizar por ahora'))}</button><button class="button primary" data-action="save-revision-closure">${escapeHtml(uiText('Save note', 'Guardar nota'))}</button>`);
    }

    function saveRevisionClosure() {
        state.revisionCycle ||= {};
        state.revisionCycle.closure = document.getElementById('revisionClosure')?.value || '';
        state.revisionCycle.updatedAt = new Date().toISOString();
        saveState(uiText('Revision note saved locally.', 'Nota de revisión guardada localmente.'));
        closeDialog(true); setView('reflection');
    }

    function renderFeedbackChoiceGuide() {
        return `<details class="feedback-choice-guide"><summary>${escapeHtml(uiText('Which kind of feedback would help?', '¿Qué tipo de retroalimentación te ayudaría?'))}</summary><div class="feedback-choice-grid"><div><strong>${escapeHtml(t('coach'))}</strong><span>${escapeHtml(uiText('For a specific question about a passage, paragraph, or draft.', 'Para una pregunta específica sobre un pasaje, párrafo o borrador.'))}</span></div><div><strong>${escapeHtml(t('focusedReview'))}</strong><span>${escapeHtml(uiText('For one careful lens, such as structure, evidence, or voice.', 'Para una sola mirada cuidadosa, como estructura, evidencia o voz.'))}</span></div><div><strong>${escapeHtml(t('council'))}</strong><span>${escapeHtml(uiText('For several perspectives on a developed draft.', 'Para varias perspectivas sobre un borrador desarrollado.'))}</span></div></div><p>${escapeHtml(uiText('These are optional choices, not steps. Reviewing it yourself or using feedback from an instructor or another person are equally valid.', 'Son opciones voluntarias, no pasos. Revisarlo por tu cuenta o usar comentarios de un instructor u otra persona son alternativas igualmente válidas.'))}</p></details>`;
    }

    function reviewTabLabel(label, count) {
        return `${escapeHtml(label)}${count ? ` <span class="tab-count" aria-label="${escapeHtml(uiText(`${count} saved`, `${count} guardado${count === 1 ? '' : 's'}`))}">(${count})</span>` : ''}`;
    }

    function openReviewCenter(tab = reviewTab) {
        if (concept === 'notebook' && !state.draftDeclared) {
            announce(t('draftToolsLocked'));
            return;
        }
        reviewTab = tab;
        openDialog(t('reviewCenter'), state.lang !== 'en' ? 'Pide, escucha, decide, revisa y verifica.' : 'Ask, hear, decide, revise, and verify.', `${renderRevisionCycleEntry('center')}${renderMoveReviewInvitation()}${renderFeedbackChoiceGuide()}<div class="review-layout"><nav class="review-nav" aria-label="${escapeHtml(uiText('Review sections', 'Secciones de revisión'))}"><button data-action="review-tab" data-tab="history" ${tab === 'history' ? 'aria-current="page"' : ''}>${reviewTabLabel(t('focusedReview'), state.reviews.length)}</button><button data-action="review-tab" data-tab="council" ${tab === 'council' ? 'aria-current="page"' : ''}>${reviewTabLabel(t('council'), state.councilRuns.length)}</button><button data-action="review-tab" data-tab="decisions" ${tab === 'decisions' ? 'aria-current="page"' : ''}>${reviewTabLabel(state.lang !== 'en' ? 'Decisiones' : 'Decisions', state.decisions.length)}</button></nav><section class="review-feed" id="reviewFeed">${renderReviewFeed(tab)}</section></div>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(state.lang !== 'en' ? 'Volver al borrador' : 'Return to draft')}</button>`, { wide: true });
    }

    function renderCouncilRunCard(run) {
        const live = run.mock === false;
        const providerLabel = live ? uiText('Tu Pana AI Council', 'Consejo de IA de Tu Pana') : 'Mock Council';
        const callsLabel = run.calls
            ? `${run.calls} ${live ? uiText('AI calls', 'llamadas de IA') : (state.lang === 'en' ? 'mock calls represented' : 'llamadas simuladas representadas')}`
            : (state.lang === 'en' ? 'call count not stored' : 'cantidad de llamadas no guardada');
        const failedRoles = (run.reviewers || []).filter(reviewer => reviewer.status !== 'complete');
        const partialNote = run.status === 'partial' && failedRoles.length
            ? `<p class="council-partial-note">${escapeHtml(uiText(`Partial report: ${failedRoles.map(reviewer => reviewer.roleLabel || reviewer.roleKey).join(', ')} could not be validated. The perspectives below are complete and grounded.`, `Informe parcial: ${failedRoles.map(reviewer => reviewer.roleLabel || reviewer.roleKey).join(', ')} no pudo validarse. Las perspectivas siguientes están completas y verificadas.`))}</p>`
            : '';
        const droppedNote = run.droppedCount
            ? `<p class="council-dropped-note">${escapeHtml(uiText(`${run.droppedCount} unverifiable item${run.droppedCount === 1 ? ' was' : 's were'} discarded because its quotation could not be anchored to your exact draft.`, `${run.droppedCount} elemento${run.droppedCount === 1 ? '' : 's'} sin verificación se descartó porque su cita no pudo anclarse a tu borrador exacto.`))}</p>`
            : '';
        const findingsHtml = run.findings.map((finding, index) => `<div class="council-finding"><p class="council-finding-head"><strong>${escapeHtml(finding.role)}</strong>${finding.corroborated ? ` <span class="corroborated-mark" title="${escapeHtml(uiText('Two or more perspectives agree', 'Dos o más perspectivas coinciden'))}">✓✓</span>` : ''}${finding.confidence === 'low' ? ` <span class="tentative-chip">${escapeHtml(uiText('tentative reading', 'lectura tentativa'))}</span>` : ''}</p><p>${escapeHtml(finding.suggestion)}</p>${finding.quote ? `<blockquote class="council-anchor">“${escapeHtml(finding.quote)}”</blockquote>` : ''}${finding.voiceNote ? `<p class="voice-note"><strong>${escapeHtml(uiText('Protect your voice:', 'Protege tu voz:'))}</strong> ${escapeHtml(finding.voiceNote)}</p>` : ''}${decisionButtons(run.id, index, finding.suggestion, run.criticalKey)}${concept === 'integrated' ? `<button class="text-button revision-focus-suggestion" data-action="revision-focus-suggestion" data-suggestion="${escapeHtml(finding.suggestion)}">${escapeHtml(uiText('Pick one revision to try', 'Elige una revisión para probar'))}</button>` : ''}</div>`).join('');
        const preserveHtml = run.report?.preserve?.length
            ? `<div class="council-preserve"><h4>${escapeHtml(uiText('Worth preserving', 'Vale la pena conservar'))}</h4>${run.report.preserve.map(item => `<blockquote class="council-anchor">“${escapeHtml(item.quote)}”</blockquote><p>${escapeHtml(item.why)}</p>`).join('')}</div>`
            : '';
        const disagreementsHtml = run.report?.disagreements?.length
            ? `<div class="council-disagreements"><h4>${escapeHtml(uiText('Your call — the Council does not agree', 'Tu decisión — el Consejo no coincide'))}</h4>${run.report.disagreements.map(item => `<p><strong>${escapeHtml(item.question)}</strong></p><ul>${item.positions.map(position => `<li>${escapeHtml(position.roleKey)}: ${escapeHtml(position.view)}</li>`).join('')}</ul>`).join('')}</div>`
            : '';
        return `<article class="review-card"><span class="mock-label">${escapeHtml(providerLabel)} · ${escapeHtml(storedGenreLabel(run))}</span><h3>${escapeHtml(t('council'))}</h3><p class="review-meta">${shortDate(run.createdAt)} · ${escapeHtml(run.payloadScope || (state.lang === 'en' ? 'scope not stored' : 'alcance no guardado'))} · ${run.words} ${escapeHtml(state.lang === 'en' ? 'words reviewed' : 'palabras revisadas')}${concept === 'integrated' ? ` · ${escapeHtml(callsLabel)}` : ''}</p>${renderSnapshotLink(run.snapshotId, 'council')}${concept === 'integrated' ? renderCriticalPrompt(run.criticalKey, run.genre) : ''}${run.report?.summary ? `<p class="council-summary">${escapeHtml(run.report.summary)}</p>` : ''}${partialNote}${findingsHtml}${preserveHtml}${disagreementsHtml}${droppedNote}</article>`;
    }

    function renderReviewFeed(tab) {
        if (tab === 'history') {
            if (!state.reviews.length) return `<div class="empty-state">${escapeHtml(t('noReviews'))}<br><button class="button secondary" data-action="focused-review" style="margin-top:12px">${escapeHtml(t('sendReview'))}</button></div>`;
            return state.reviews.slice().reverse().map(review => renderReviewCard(review)).join('');
        }
        if (tab === 'council') {
            if (!state.councilRuns.length) return `<div class="empty-state">${escapeHtml(t('noReviews'))}<br><button class="button secondary" data-action="council" style="margin-top:12px">${escapeHtml(t('convene'))}</button></div>`;
            const reports = state.councilRuns.slice().reverse().map(run => renderCouncilRunCard(run)).join('');
            return `${reports}${concept === 'integrated' ? `<div class="review-secondary-action"><button class="button secondary" data-action="convene-again">${escapeHtml(state.lang === 'en' ? 'Convene again' : 'Convocar de nuevo')}</button><small>${escapeHtml(state.lang === 'en' ? 'Creates a new mock Council report after a separate consent step.' : 'Crea un nuevo informe simulado después de un consentimiento separado.')}</small></div>` : ''}`;
        }
        if (!state.decisions.length) return `<div class="empty-state">${escapeHtml(state.lang !== 'en' ? 'Todavía no has decidido sobre una sugerencia.' : 'You have not decided on a suggestion yet.')}</div>`;
        return state.decisions.slice().reverse().map(decision => `<article class="review-card"><h3>${escapeHtml(decision.choiceLabel)}</h3><p class="review-meta">${shortDate(decision.createdAt)} · ${escapeHtml(decision.sourceType)}${decision.payloadScope ? ` · ${escapeHtml(decision.payloadScope)}` : ''}</p>${renderSnapshotLink(decision.relatedVersionId, 'decisions')}<blockquote>${escapeHtml(decision.suggestion)}</blockquote>${decision.criticalPrompt ? `<p><strong>${escapeHtml(state.lang === 'en' ? 'Critical prompt' : 'Pregunta crítica')}:</strong> ${escapeHtml(criticalQuestionText(decision.criticalKey))}</p>` : ''}${decision.rationale ? `<p><strong>${escapeHtml(state.lang === 'en' ? 'Student reason' : 'Razón estudiantil')}:</strong> ${escapeHtml(decision.rationale)}</p>` : ''}<p>${escapeHtml(t('decisionRecorded'))}</p></article>`).join('');
    }

    function renderReviewCard(review) {
        const voiceRequest = review.voiceEntriesIncluded?.length ? `<p class="voice-request-note">${escapeHtml(review.mock === false
            ? uiText(`Your ${review.voiceEntriesIncluded.length} Your Voice entr${review.voiceEntriesIncluded.length === 1 ? 'y was' : 'ies were'} sent as explicit protection constraints. A model can still miss them — the protected wording remains yours to keep.`, `Tu${review.voiceEntriesIncluded.length === 1 ? '' : 's'} ${review.voiceEntriesIncluded.length} entrada${review.voiceEntriesIncluded.length === 1 ? '' : 's'} de Tu voz se enviaron como restricciones explícitas de protección. Un modelo aún puede ignorarlas — la redacción protegida sigue siendo tuya.`)
            : uiText(`You asked this local mock to consider ${review.voiceEntriesIncluded.length} Your Voice entr${review.voiceEntriesIncluded.length === 1 ? 'y' : 'ies'}. This records your request; it does not claim live-model enforcement.`, `Pediste que esta simulación local considere ${review.voiceEntriesIncluded.length} entrada${review.voiceEntriesIncluded.length === 1 ? '' : 's'} de Tu voz. Esto registra tu solicitud; no afirma una aplicación por un modelo en vivo.`))}</p>` : '';
        const moveRequest = review.moveContextIncluded ? `<p class="move-request-note"><strong>${escapeHtml(uiText('Optional Move framing used:', 'Orientación opcional de Movida utilizada:'))}</strong> ${escapeHtml(review.moveContextIncluded.moveLabel)} · ${escapeHtml(review.moveContextIncluded.noteText)}</p>` : '';
        // F1 — the saved card says truthfully what was asked. A typed question
        // is shown in the writer's own words; a defaulted request is named as
        // Tu Pana's, never presented as though the writer asked it. Records
        // written before F1 carry neither field and render nothing extra.
        const questionRequest = review.type === 'coach'
            ? (review.question
                ? `<p class="question-request-note"><strong>${escapeHtml(uiText('You asked:', 'Preguntaste:'))}</strong> ${escapeHtml(review.question)}</p>`
                : (review.requestDefaulted ? `<p class="question-request-note">${escapeHtml(uiText('You did not type a question, so Tu Pana was asked for one useful next move on this writing.', 'No escribiste una pregunta, así que se le pidió a Tu Pana una movida útil sobre esta escritura.'))}</p>` : ''))
            : '';
        const liveRecord = review.mock === false;
        const truncatedNote = review.truncated ? `<p class="truncated-note">${escapeHtml(uiText('This response was cut off by a length limit; what appears here is everything that arrived.', 'Esta respuesta fue cortada por un límite de longitud; lo que aparece aquí es todo lo que llegó.'))}</p>` : '';
        return `<article class="review-card"><span class="mock-label">${escapeHtml(liveRecord ? uiText('Tu Pana AI', 'IA de Tu Pana') : 'Mock AI')} · ${escapeHtml(storedGenreLabel(review))} · ${escapeHtml(review.scope || (state.lang === 'en' ? 'scope not stored' : 'alcance no guardado'))}</span><h3>${escapeHtml(review.lens)}</h3><p class="review-meta">${shortDate(review.createdAt)} · ${review.words} ${escapeHtml(state.lang !== 'en' ? 'palabras compartidas' : 'words shared')}${concept === 'integrated' ? ` · ${escapeHtml(review.calls ? `${review.calls} ${liveRecord ? (state.lang === 'en' ? 'AI call' : 'llamada de IA') : (state.lang === 'en' ? 'mock call' : 'llamada simulada')}` : (state.lang === 'en' ? 'call count not stored' : 'cantidad de llamadas no guardada'))}` : ''}</p>${renderSnapshotLink(review.snapshotId, 'history')}<blockquote>${escapeHtml(review.exactExcerpt)}</blockquote>${questionRequest}${moveRequest}${voiceRequest}<p>${escapeHtml(review.suggestion)}</p>${truncatedNote}${concept === 'integrated' ? renderCriticalPrompt(review.criticalKey, review.genre) : ''}${decisionButtons(review.id, 0, review.suggestion, review.criticalKey)}${concept === 'integrated' ? `<button class="text-button revision-focus-suggestion" data-action="revision-focus-suggestion" data-suggestion="${escapeHtml(review.suggestion)}">${escapeHtml(uiText('Pick one revision to try', 'Elige una revisión para probar'))}</button>` : ''}</article>`;
    }

    function renderSnapshotLink(snapshotId, returnTab = reviewTab) {
        if (!snapshotId) return '';
        const version = state.versions.find(item => item.id === snapshotId);
        if (!version) return `<p class="checkpoint-note">${escapeHtml(state.lang === 'en' ? 'Linked checkpoint is no longer available in this synthetic record.' : 'El punto vinculado ya no está disponible en este registro sintético.')}</p>`;
        const label = typeof version.text === 'string'
            ? (state.lang === 'en' ? 'View draft snapshot used for this feedback' : 'Ver la instantánea usada para esta retroalimentación')
            : (state.lang === 'en' ? 'View metadata-only checkpoint' : 'Ver punto solo con metadatos');
        return `<button class="text-button snapshot-link" data-action="view-snapshot" data-snapshot="${escapeHtml(snapshotId)}" data-return-tab="${escapeHtml(returnTab)}">${escapeHtml(label)}</button>`;
    }

    function versionTimestamp(version) {
        return new Intl.DateTimeFormat(state.lang === 'es' ? 'es' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(version.createdAt));
    }

    function openVersionHistory() {
        const versions = state.versions.slice().reverse();
        const body = versions.length
            ? `<div class="artifact-list">${versions.map(version => {
                const recoverable = typeof version.text === 'string';
                const title = recoverable
                    ? (state.lang === 'en' ? 'Draft snapshot' : 'Instantánea del borrador')
                    : (state.lang === 'en' ? 'Metadata-only checkpoint' : 'Punto solo con metadatos');
                const note = recoverable
                    ? (state.lang === 'en' ? 'Exact prior text is stored locally and viewable.' : 'El texto anterior exacto está guardado localmente y se puede ver.')
                    : (state.lang === 'en' ? 'Earlier record: text was not stored, so this is not a recoverable snapshot.' : 'Registro anterior: no se guardó el texto, así que no es una instantánea recuperable.');
                return `<article class="artifact-row version-row"><strong>${escapeHtml(title)} · ${version.words ?? 0} ${escapeHtml(state.lang === 'en' ? 'words' : 'palabras')}</strong><small>${escapeHtml(versionTimestamp(version))} · ${escapeHtml(version.reason || (state.lang === 'en' ? 'reason not stored' : 'motivo no guardado'))}</small><p>${escapeHtml(note)}</p><button class="text-button" data-action="view-snapshot" data-snapshot="${escapeHtml(version.id)}" data-return-tab="versions">${escapeHtml(recoverable ? (state.lang === 'en' ? 'Inspect exact text' : 'Inspeccionar texto exacto') : (state.lang === 'en' ? 'Inspect checkpoint facts' : 'Inspeccionar datos del punto'))}</button></article>`;
            }).join('')}</div>`
            : `<div class="empty-state">${escapeHtml(state.lang === 'en' ? 'No draft checkpoints yet. A recoverable snapshot is created before mock review, Council, replacement, reflection, or Finish.' : 'Todavía no hay puntos del borrador. Se crea una instantánea recuperable antes de revisión simulada, Consejo, reemplazo, reflexión o Finalizar.')}</div>`;
        openDialog(state.lang === 'en' ? 'Draft history' : 'Historial del borrador', state.lang === 'en' ? 'Read-only local draft history. Viewing never replaces the current draft.' : 'Historial local del borrador, solo lectura. Verlo nunca reemplaza el borrador actual.', body, `<button class="button ghost" data-action="close-dialog">${escapeHtml(state.lang === 'en' ? 'Return to draft' : 'Volver al borrador')}</button>`, { wide: true });
    }

    function openSnapshotViewer(snapshotId, returnTab = 'versions') {
        const version = state.versions.find(item => item.id === snapshotId);
        if (!version) return openVersionHistory();
        const recoverable = typeof version.text === 'string';
        const title = recoverable
            ? (state.lang === 'en' ? 'Draft snapshot' : 'Instantánea del borrador')
            : (state.lang === 'en' ? 'Metadata-only checkpoint' : 'Punto solo con metadatos');
        const facts = `<dl class="snapshot-facts"><div><dt>${escapeHtml(state.lang === 'en' ? 'Recorded' : 'Registrado')}</dt><dd>${escapeHtml(versionTimestamp(version))}</dd></div><div><dt>${escapeHtml(state.lang === 'en' ? 'Reason' : 'Motivo')}</dt><dd>${escapeHtml(version.reason || (state.lang === 'en' ? 'Not stored in this earlier record' : 'No guardado en este registro anterior'))}</dd></div><div><dt>${escapeHtml(state.lang === 'en' ? 'Words' : 'Palabras')}</dt><dd>${version.words ?? 0}</dd></div><div><dt>${escapeHtml(t('genre'))}</dt><dd>${escapeHtml(storedGenreLabel(version))}</dd></div></dl>`;
        const content = recoverable
            ? `${facts}<p>${escapeHtml(state.lang === 'en' ? 'Read-only exact prior wording. Copying does not change the active draft.' : 'Texto anterior exacto de solo lectura. Copiar no cambia el borrador activo.')}</p><pre class="snapshot-text" id="snapshotText">${escapeHtml(version.text)}</pre>`
            : `${facts}<p class="checkpoint-note">${escapeHtml(state.lang === 'en' ? 'Text was not stored in this earlier record. This checkpoint cannot be viewed or recovered and is not called a snapshot.' : 'El texto no se guardó en este registro anterior. Este punto no se puede ver ni recuperar y no se llama instantánea.')}</p>`;
        const backAction = returnTab === 'versions'
            ? `<button class="button ghost" data-action="version-history">${escapeHtml(state.lang === 'en' ? 'Back to draft history' : 'Volver al historial')}</button>`
            : returnTab === 'evidence'
                ? `<button class="button ghost" data-action="evidence-filter" data-filter="copies">${escapeHtml(state.lang === 'en' ? 'Back to evidence' : 'Volver a evidencia')}</button>`
                : `<button class="button ghost" data-action="review-tab" data-tab="${escapeHtml(returnTab)}">${escapeHtml(state.lang === 'en' ? 'Back to report' : 'Volver al informe')}</button>`;
        const copyAction = recoverable ? `<button class="button secondary" data-action="copy-snapshot" data-snapshot="${escapeHtml(snapshotId)}">${escapeHtml(state.lang === 'en' ? 'Copy prior wording' : 'Copiar texto anterior')}</button>` : '';
        openDialog(title, state.lang === 'en' ? 'Viewing only—your current draft stays unchanged.' : 'Solo lectura—tu borrador actual no cambia.', content, `${backAction}${copyAction}`, { wide: true });
    }

    async function copySnapshotText(snapshotId) {
        const version = state.versions.find(item => item.id === snapshotId);
        if (typeof version?.text !== 'string') return;
        try {
            await navigator.clipboard.writeText(version.text);
        } catch (error) {
            const helper = document.createElement('textarea');
            helper.value = version.text;
            helper.setAttribute('readonly', '');
            helper.style.position = 'fixed';
            helper.style.opacity = '0';
            document.body.appendChild(helper);
            helper.select();
            document.execCommand('copy');
            helper.remove();
        }
        announce(state.lang === 'en' ? 'Prior wording copied. Current draft unchanged.' : 'Texto anterior copiado. El borrador actual no cambió.');
    }

    function dismissInvitation(kind, hideForDraft = false) {
        state.invitations ||= { moveReview: null, finishReflection: null };
        const key = kind === 'finish-reflection' ? 'finishReflection' : 'moveReview';
        const current = state.invitations[key] || {};
        state.invitations[key] = { ...current, dismissed: true, hiddenForDraft: hideForDraft, draftSignature: draftInvitationKey(), dismissedAt: new Date().toISOString() };
        saveState();
        if (dialogRoot.querySelector('[role="dialog"]')) {
            if (key === 'moveReview') openReviewCenter(reviewTab);
            else closeDialog(true);
        } else renderApp();
    }

    function renderCriticalPrompt(key, genre = state.genre) {
        if (!key) return '';
        const available = Object.entries(criticalQuestions).filter(([questionKey]) => !(genre === 'stem' && questionKey === 'cultural'));
        const risk = criticalRiskText(key, genre);
        return `<details class="critical-moment" data-critical-key="${escapeHtml(key)}"><summary>${escapeHtml(t('criticalAction'))}</summary><div class="critical-moment-body"><span class="panel-kicker">${escapeHtml(criticalQuestion(key).principle)}</span>${risk ? `<p class="critical-risk">${escapeHtml(risk)}</p>` : ''}<p class="critical-primary">${escapeHtml(criticalQuestionText(key))}</p><p>${escapeHtml(t('decisionMaker'))}</p><details class="critical-framework"><summary>${escapeHtml(t('allQuestions'))}</summary><ul>${available.map(([questionKey, question]) => `<li class="${questionKey === key ? 'current' : ''}"><strong>${escapeHtml(question.principle)}</strong> — ${escapeHtml(question[state.lang === 'en' ? 'en' : 'es'])}</li>`).join('')}</ul></details></div></details>`;
    }

    function decisionButtons(sourceId, suggestionIndex, suggestion, criticalKey = '') {
        const prior = state.decisions.find(d => d.sourceId === sourceId && d.suggestionIndex === suggestionIndex);
        return `<div class="decision-row" aria-label="Student decision">${[['accept', t('accept')], ['adapt', t('adapt')], ['reject', t('reject')], ['later', t('later')]].map(([choice, label]) => `<button class="decision-button" data-action="decision" data-source="${escapeHtml(sourceId)}" data-index="${suggestionIndex}" data-choice="${choice}" data-critical="${escapeHtml(criticalKey)}" data-suggestion="${escapeHtml(suggestion)}" ${prior?.choice === choice ? 'aria-pressed="true"' : 'aria-pressed="false"'}>${escapeHtml(label)}</button>`).join('')}</div>`;
    }

    function recordDecision(button) {
        const sourceId = button.dataset.source;
        const index = Number(button.dataset.index || 0);
        const choice = button.dataset.choice;
        const labels = { accept: t('accept'), adapt: t('adapt'), reject: t('reject'), later: t('later') };
        if (concept === 'integrated') {
            const review = state.reviews.find(item => item.id === sourceId);
            const council = state.councilRuns.find(item => item.id === sourceId);
            pendingDecision = {
                sourceId, index, choice, choiceLabel: labels[choice], suggestion: button.dataset.suggestion,
                criticalKey: button.dataset.critical || review?.criticalKey || council?.criticalKey || 'thinking',
                criticalContext: review?.criticalContext || council?.criticalContext || criticalRiskText(button.dataset.critical || 'thinking'),
                sourceType: council ? t('council') : t('focusedReview'),
                aiSource: council ? 'Mock Council' : (review?.reviewer || 'Tu Pana mock coach'),
                payloadScope: council ? 'full' : (review?.scope || 'unknown'),
                draftSignature: council?.draftSignature || review?.draftSignature || `${getDraft().length}:${getDraft().slice(0, 24)}`,
                relatedVersionId: council?.snapshotId || review?.snapshotId || null,
                genre: council?.genre || review?.genre || state.genre,
                genreLabel: council?.genreLabel || review?.genreLabel || currentGenre().label.en,
                genreLabelEs: council?.genreLabelEs || review?.genreLabelEs || currentGenre().label.es,
            };
            openDialog(labels[choice], t('criticalAction'), `<div class="critical-decision-summary"><span class="panel-kicker">${escapeHtml(criticalQuestion(pendingDecision.criticalKey).principle)}</span><p>${escapeHtml(criticalQuestionText(pendingDecision.criticalKey))}</p><blockquote>${escapeHtml(pendingDecision.suggestion)}</blockquote></div><div class="field"><label for="decisionRationale">${escapeHtml(t('rationale'))}</label><textarea id="decisionRationale" data-protect-dirty spellcheck="${spellcheckEnabled()}" maxlength="500" placeholder="${escapeHtml(state.lang === 'en' ? 'I chose this because…' : 'Elegí esto porque…')}"></textarea></div><p>${escapeHtml(t('decisionMaker'))}</p>`, `<button class="button ghost" data-action="review-center">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="save-integrated-decision">${escapeHtml(t('saveDecision'))}</button>`);
            return;
        }
        state.decisions = state.decisions.filter(d => !(d.sourceId === sourceId && d.suggestionIndex === index));
        state.decisions.push({ id: `decision-${Date.now()}`, sourceId, suggestionIndex: index, sourceType: sourceId.startsWith('council') ? t('council') : t('focusedReview'), choice, choiceLabel: labels[choice], suggestion: button.dataset.suggestion, createdAt: new Date().toISOString(), studentAuthored: true });
        saveState(t('decisionRecorded'));
        renderApp();
        openReviewCenter(reviewTab);
    }

    function saveIntegratedDecision() {
        if (!pendingDecision) return;
        const rationale = document.getElementById('decisionRationale')?.value || '';
        state.decisions = state.decisions.filter(d => !(d.sourceId === pendingDecision.sourceId && d.suggestionIndex === pendingDecision.index));
        state.decisions.push({
            id: `decision-${Date.now()}`,
            sourceId: pendingDecision.sourceId,
            suggestionIndex: pendingDecision.index,
            sourceType: pendingDecision.sourceType,
            choice: pendingDecision.choice,
            choiceLabel: pendingDecision.choiceLabel,
            suggestion: pendingDecision.suggestion,
            rationale,
            aiSource: pendingDecision.aiSource,
            payloadScope: pendingDecision.payloadScope,
            criticalKey: pendingDecision.criticalKey,
            criticalPrompt: criticalQuestion(pendingDecision.criticalKey).en,
            criticalContext: pendingDecision.criticalContext,
            draftSignature: pendingDecision.draftSignature,
            relatedVersionId: pendingDecision.relatedVersionId,
            genre: pendingDecision.genre,
            genreLabel: pendingDecision.genreLabel,
            genreLabelEs: pendingDecision.genreLabelEs,
            createdAt: new Date().toISOString(),
            studentAuthored: true,
        });
        pendingDecision = null;
        saveState(t('decisionRecorded'));
        renderApp();
        openReviewCenter(reviewTab);
    }

    function factualEvidence() {
        const items = [];
        if (concept === 'notebook') {
            const notebookCount = notebookCards().filter(card => wordCount(state.notebookEntries[notebookEntryKey(card)]?.text)).length;
            if (notebookCount) items.push(`${notebookCount}/${notebookCards().length} ${state.lang !== 'en' ? 'tarjetas de cuaderno con trabajo' : 'notebook cards with work'}`);
            if (state.draftCreatedAt) items.push(`${state.lang !== 'en' ? 'Borrador creado por el estudiante' : 'Student-created draft'} · ${shortDate(state.draftCreatedAt)}`);
        }
        if (concept === 'integrated') {
            const moveCount = integratedMoves().filter(move => wordCount(state.moveNotes[moveNoteKey(move)]?.text)).length;
            if (moveCount) items.push(`${moveCount}/${integratedMoves().length} ${state.lang !== 'en' ? 'notas de Movidas con contenido' : 'Move notes with content'}`);
            if (state.knowledgeChoice) items.push(state.knowledgeChoice === 'engage'
                ? (state.lang !== 'en' ? 'Lente opcional de conocimiento e idioma abierta' : 'Optional knowledge and language lens opened')
                : (state.lang !== 'en' ? 'Lente opcional omitida por ahora' : 'Optional knowledge and language lens skipped for now'));
            if (state.criticalViews.length) items.push(`${state.criticalViews.length} ${state.lang !== 'en' ? 'preguntas críticas abiertas' : 'critical prompts opened'}`);
            if (voiceEntries().length) items.push(`${voiceEntries().length} ${state.lang !== 'en' ? 'entradas exactas de Tu voz elegidas por el estudiante' : 'student-selected exact Your Voice entries'}`);
            if (reviewCopySnapshot()) items.push(state.lang !== 'en' ? 'Copia de revisión exacta guardada localmente' : 'Exact review copy saved locally');
            if (state.revisionCycle?.focus?.trim()) items.push(state.lang !== 'en' ? 'Elección de revisión escrita por el estudiante' : 'Student-authored revision choice');
            if (state.revisionCycle?.closure?.trim()) items.push(state.lang !== 'en' ? 'Nota breve de revisión escrita por el estudiante' : 'Student-authored brief revision note');
            if (state.genre === 'autobiographical' && Object.values(state.finishChecks).filter(Boolean).length) items.push(`${Object.values(state.finishChecks).filter(Boolean).length}/4 ${state.lang !== 'en' ? 'marcas del checklist hechas por el estudiante' : 'student-marked Finish checks'}`);
        }
        if (wordCount(getDraft())) items.push(`${wordCount(getDraft())} ${state.lang !== 'en' ? 'palabras en la versión actual' : 'words in the current version'}`);
        if (state.versions.length) {
            const exactSnapshots = state.versions.filter(version => typeof version.text === 'string').length;
            const metadataOnly = state.versions.length - exactSnapshots;
            if (exactSnapshots) items.push(`${exactSnapshots} ${state.lang !== 'en' ? 'instantáneas locales recuperables' : 'recoverable local snapshots'}`);
            if (metadataOnly) items.push(`${metadataOnly} ${state.lang !== 'en' ? 'puntos anteriores solo con metadatos' : 'earlier metadata-only checkpoints'}`);
        }
        if (Object.keys(state.artifacts).length) items.push(`${Object.keys(state.artifacts).length} ${state.lang !== 'en' ? 'artefactos con texto' : 'artifacts with text'}`);
        if (state.reviews.length) items.push(`${state.reviews.length} ${state.lang !== 'en' ? 'lecturas enfocadas' : 'focused reviews'}`);
        if (state.councilRuns.length) items.push(`${state.councilRuns.length} ${state.lang !== 'en' ? 'reuniones del Consejo' : 'Council runs'}`);
        state.decisions.forEach(d => items.push(`${d.choiceLabel}: ${d.sourceType}${d.rationale?.trim() ? (state.lang !== 'en' ? ' · razón estudiantil guardada' : ' · student reason saved') : ''}`));
        return items;
    }

    function reflectionPrompts() {
        const rp4 = concept === 'integrated' ? reflectionPrompt4[state.genre] : null;
        const knowledge = rp4 ? (state.lang !== 'en' ? rp4.es : rp4.en) : t('prompt4');
        return [
            ['changed', t('prompt1'), false], ['decision', t('prompt2'), false], ['voice', t('prompt3'), false], ['knowledge', knowledge, true],
        ];
    }

    function renderReflectionPage() {
        const prompts = reflectionPrompts();
        const complete = ['changed', 'decision', 'voice'].filter(key => state.reflections[key].trim()).length;
        return `<section class="finish-page" aria-labelledby="reflectionTitle"><div class="finish-hero"><p class="eyebrow">${escapeHtml(t('whereDesk'))}</p><h2 id="reflectionTitle">${escapeHtml(t('reflection'))}</h2><p>${escapeHtml(t('reflectionWhy'))}</p><strong>${complete}/3 ${escapeHtml(state.lang !== 'en' ? 'respuestas requeridas guardadas' : 'required responses saved')}</strong></div>
            <section class="panel"><div class="panel-header"><div><h3>${escapeHtml(t('reflection'))}</h3><p>${escapeHtml(state.lang === 'en' ? 'Student-authored only.' : 'Solo escrito por el estudiante.')}</p></div>${concept === 'integrated' ? renderEditControls() : ''}</div><div class="panel-body"><div class="reflection-intro"><strong>${escapeHtml(t('reflectionEvidence'))}</strong><div class="evidence-chips">${factualEvidence().length ? factualEvidence().map(item => `<span class="evidence-chip">${escapeHtml(item)}</span>`).join('') : `<span class="evidence-chip">${escapeHtml(state.lang !== 'en' ? 'La evidencia aparecerá al trabajar.' : 'Evidence will appear as you work.')}</span>`}</div></div>
            <form id="reflectionForm">${prompts.map(([key, label, optional]) => `<div class="reflection-prompt"><label for="reflection-${key}">${escapeHtml(label)} ${optional ? `<span class="optional-label">(${escapeHtml(t('optional'))})</span>` : ''}</label><textarea id="reflection-${key}" name="${key}" spellcheck="${spellcheckEnabled()}" ${optional ? '' : 'required'}>${escapeHtml(state.reflections[key])}</textarea></div>`).join('')}</form></div><footer class="editor-footer"><button class="button ghost" data-action="return-write">← ${escapeHtml(state.lang !== 'en' ? 'Volver a escribir' : 'Return to writing')}</button><div class="footer-group"><button class="button secondary" data-action="save-reflection">${escapeHtml(t('saveReturn'))}</button><button class="button primary" data-action="finish">${escapeHtml(t('preparePacket'))} →</button></div></footer></section></section>`;
    }

    function saveReflection() {
        const form = document.getElementById('reflectionForm');
        if (!form) return;
        const data = new FormData(form);
        ['changed', 'decision', 'voice', 'knowledge'].forEach(key => { state.reflections[key] = String(data.get(key) || ''); });
        state.reflectionSavedAt = new Date().toISOString();
        saveState(t('saved'));
    }

    function markedDraft() {
        if (concept !== 'journey') return state.draft || '';
        return state.artifacts[state.currentArtifact]?.text || getDraft();
    }

    function reflectionComplete() { return ['changed', 'decision', 'voice'].every(key => state.reflections[key].trim().length >= 1); }

    function renderGenreFinishChecklist() {
        if (concept !== 'integrated' || state.genre !== 'autobiographical') return '';
        const items = state.lang === 'en'
            ? [
                ['connection', 'My chosen experience connects to a historical, social, cultural, linguistic, economic, or political force.'],
                ['sources', 'I verified factual or historical claims with sources I can trace.'],
                ['voice', 'Multilingual, family, community, dialectal, or culturally specific phrases remain as I intend.'],
                ['privacy', 'The personal details in this version match what I choose to disclose.'],
            ]
            : [
                ['connection', 'Mi experiencia elegida se conecta con una fuerza histórica, social, cultural, lingüística, económica o política.'],
                ['sources', 'Verifiqué afirmaciones históricas o factuales con fuentes rastreables.'],
                ['voice', 'Las frases multilingües, familiares, comunitarias, dialectales o culturales quedan como yo quiero.'],
                ['privacy', 'Los detalles personales en esta versión coinciden con lo que elijo divulgar.'],
            ];
        return `<section class="packet-section genre-finish-check"><h3>${escapeHtml(state.lang === 'en' ? 'Autobiographical essay check' : 'Revisión del ensayo autobiográfico')}</h3><p>${escapeHtml(state.lang === 'en' ? 'Your check—not an app inference. These marks do not submit or rewrite anything.' : 'Tu revisión—no una inferencia de la app. Estas marcas no entregan ni reescriben nada.')}</p><div class="choice-stack">${items.map(([key, label]) => `<label class="consent-box"><input type="checkbox" data-action="finish-check" data-key="${key}" ${state.finishChecks[key] ? 'checked' : ''}><span>${escapeHtml(label)}</span></label>`).join('')}</div></section>`;
    }

    function hasMeaningfulStudentEvidence() {
        const currentDecision = state.decisions.some(decision => decision?.choice && decision.genre === state.genre);
        const currentCopy = state.reviewCopy?.genre === state.genre && Boolean(reviewCopySnapshot());
        return integratedMoves().some(move => wordCount(state.moveNotes[moveNoteKey(move)]?.text))
            || voiceEntries().some(entry => entry?.text && (!entry.genre || entry.genre === state.genre))
            || currentDecision || currentCopy;
    }

    function renderFinishReflectionInvitation() {
        if (concept !== 'integrated' || reflectionComplete() || !hasMeaningfulStudentEvidence()) return '';
        const invitation = state.invitations?.finishReflection;
        if (invitation?.dismissed && invitation.draftSignature === draftInvitationKey()) return '';
        return `<section class="contextual-invitation finish-reflection-invitation" role="note"><div><strong>${escapeHtml(uiText('Your choices can help with Process Reflection', 'Tus decisiones pueden ayudar con la Reflexión del proceso'))}</strong><p>${escapeHtml(uiText('If useful, explain what you changed or kept in your own words. Opening evidence does not prove learning, and this invitation does not block Finish.', 'Si te sirve, explica con tus propias palabras qué cambiaste o conservaste. Abrir evidencia no demuestra aprendizaje y esta invitación no bloquea Finalizar.'))}</p></div><div class="invitation-actions"><button class="button secondary" data-action="reflection">${escapeHtml(t('reflection'))}</button><button class="button ghost" data-action="dismiss-invitation" data-invitation="finish-reflection">${escapeHtml(t('notNow'))}</button><button class="text-button" data-action="hide-invitation" data-invitation="finish-reflection">${escapeHtml(uiText('Do not show again for this draft', 'No mostrar de nuevo para este borrador'))}</button></div></section>`;
    }

    function renderFinishPage() {
        const draft = markedDraft();
        const ready = Boolean(draft.trim()) && reflectionComplete();
        const packetReady = Boolean(state.packetCreatedAt);
        return `<section class="finish-page" aria-labelledby="finishTitle"><div class="finish-hero"><p class="eyebrow">${escapeHtml(t('finish'))}</p><h2 id="finishTitle">${escapeHtml(t('preparePacket'))}</h2><p>${escapeHtml(state.lang !== 'en' ? 'Guardar mantiene tu trabajo en progreso. Finalizar confirma una versión y arma un paquete local. Entregar ocurre fuera del Writing Studio, según las instrucciones de tu instructor.' : 'Save keeps work in progress. Finish confirms one version and assembles a local packet. Submission happens outside the Writing Studio, according to your instructor’s directions.')}</p></div>
            ${renderFinishReflectionInvitation()}${concept === 'integrated' ? renderRevisionCycleEntry('finish') : ''}<div class="finish-grid"><section class="packet-section"><h3>${escapeHtml(t('packetDraft'))}</h3><p>${wordCount(draft)} ${escapeHtml(state.lang !== 'en' ? 'palabras' : 'words')} · ${escapeHtml(concept === 'journey' ? state.currentArtifact : t('currentDraft'))}</p><div class="packet-preview" id="finalDraftPreview">${escapeHtml(draft || (state.lang !== 'en' ? 'No hay borrador todavía.' : 'No draft yet.'))}</div><label class="consent-box" style="margin-top:12px"><input id="packetConfirm" type="checkbox" ${state.packetCreatedAt ? 'checked' : ''}><span>${escapeHtml(t('confirmDraft'))}</span></label></section>
            <section class="packet-section"><h3>${escapeHtml(state.lang !== 'en' ? 'Comprobación honesta' : 'Truthful readiness check')}</h3><ul class="check-list"><li class="${draft.trim() ? 'done' : ''}">${escapeHtml(state.lang !== 'en' ? 'Una versión exacta está identificada' : 'One exact version is identified')}</li><li class="${reflectionComplete() ? 'done' : ''}">${escapeHtml(state.lang !== 'en' ? 'Tres respuestas contienen texto' : 'Three student-authored responses contain text')}</li><li class="${concept === 'integrated' || state.councilRuns.length ? 'done' : ''}">${escapeHtml(concept === 'integrated' && !state.councilRuns.length ? (state.lang !== 'en' ? 'No se solicitó Consejo—es opcional' : 'No Council requested—optional') : (state.lang !== 'en' ? 'La evidencia del Consejo está incluida si existe' : 'Council evidence is included when it exists'))}</li><li class="${concept === 'integrated' || state.decisions.length ? 'done' : ''}">${escapeHtml(concept === 'integrated' && !state.decisions.length ? (state.lang !== 'en' ? 'No hubo decisiones de IA—la IA es opcional' : 'No AI decisions—AI is optional') : (state.lang !== 'en' ? 'Las decisiones sobre sugerencias están incluidas' : 'Suggestion decisions are included'))}</li></ul><p><strong>${escapeHtml(ready ? (state.lang !== 'en' ? 'Listo para crear el paquete local' : 'Ready to create the local packet') : (state.lang !== 'en' ? 'Todavía en progreso' : 'Still in progress'))}</strong></p><button class="button primary" data-action="create-packet" ${!ready ? 'disabled' : ''}>${escapeHtml(t('createPacket'))}</button></section></div>
            <div class="finish-grid"><section class="packet-section"><h3>${escapeHtml(t('studentReflection'))}</h3><p>${escapeHtml(state.lang !== 'en' ? 'Solo contiene las palabras del estudiante.' : 'Contains only the student’s words.')}</p>${reflectionPrompts().map(([key, label], i) => state.reflections[key] ? `<h4>${i + 1}. ${escapeHtml(label)}</h4><p>${escapeHtml(state.reflections[key])}</p>` : '').join('') || `<p>${escapeHtml(state.lang !== 'en' ? 'Todavía no hay reflexión.' : 'No reflection yet.')}</p>`}</section>
            <section class="packet-section"><h3>${escapeHtml(t('instructorAppendix'))}</h3><p>${escapeHtml(state.lang !== 'en' ? 'Evidencia factual del sistema, separada de la reflexión.' : 'Factual system evidence, separate from reflection.')}</p><ul class="check-list">${factualEvidence().map(item => `<li class="done">${escapeHtml(item)}</li>`).join('') || `<li>${escapeHtml(t('noPrior'))}</li>`}</ul></section></div>${renderGenreFinishChecklist()}
            ${concept === 'notebook' || concept === 'integrated' ? `<section class="packet-section action-meanings"><h3>${escapeHtml(state.lang === 'en' ? 'Five different actions' : 'Cinco acciones distintas')}</h3><div class="artifact-list"><div class="artifact-row"><strong>${escapeHtml(state.lang === 'en' ? 'Save' : 'Guardar')}</strong><small>${escapeHtml(state.lang === 'en' ? 'Keeps your exact work in this browser.' : 'Mantiene tu trabajo exacto en este navegador.')}</small></div><div class="artifact-row"><strong>${escapeHtml(t('finish'))}</strong><small>${escapeHtml(state.lang === 'en' ? 'Confirms which draft and reflection belong in the packet.' : 'Confirma qué borrador y reflexión pertenecen al paquete.')}</small></div><div class="artifact-row"><strong>${escapeHtml(t('createPacket'))}</strong><small>${escapeHtml(state.lang === 'en' ? 'Assembles a local preview; it submits nothing.' : 'Arma una vista previa local; no entrega nada.')}</small></div><div class="artifact-row"><strong>${escapeHtml(state.lang === 'en' ? 'Backup' : 'Copia de seguridad')}</strong><small>${escapeHtml(state.lang === 'en' ? 'Downloads your saved Writing Studio work as one file on this device.' : 'Descarga tu trabajo guardado del Writing Studio como un archivo en este dispositivo.')}</small></div><div class="artifact-row"><strong>${escapeHtml(state.lang === 'en' ? 'External Submit' : 'Entrega externa')}</strong><small>${escapeHtml(state.lang === 'en' ? 'Happens outside Tu Pana under instructor directions.' : 'Ocurre fuera de Tu Pana según las instrucciones del instructor.')}</small></div></div><button class="button secondary" data-action="export-state">${escapeHtml(t('export'))}</button></section>` : ''}
            ${packetReady ? `<section class="packet-section"><h3>${escapeHtml(t('packetReady'))}</h3><button class="button primary" data-action="download-packet">${escapeHtml(t('downloadPacket'))}</button></section>` : ''}
            <footer class="editor-footer"><button class="button ghost" data-action="reflection">← ${escapeHtml(t('reflection'))}</button><button class="button secondary" data-action="return-write">${escapeHtml(state.lang !== 'en' ? 'Volver al borrador' : 'Return to draft')}</button></footer></section>`;
    }

    function packetText() {
        const lines = [
            'TU PANA WRITING STUDIO — WRITING PACKET',
            'Written with: Tu Pana Writing Studio',
            `Genre: ${currentGenre().label.en}`,
            `Created: ${new Date().toISOString()}`,
            '', 'CURRENT DRAFT', markedDraft(), '', 'STUDENT REFLECTION',
            `1. ${copy.en.prompt1}\n${state.reflections.changed}`,
            `2. ${copy.en.prompt2}\n${state.reflections.decision}`,
            `3. ${copy.en.prompt3}\n${state.reflections.voice}`,
        ];
        if (state.reflections.knowledge) {
            const packetRp4 = concept === 'integrated' ? reflectionPrompt4[state.genre] : null;
            const knowledgePrompt = packetRp4 ? packetRp4.en : copy.en.prompt4;
            lines.push(`4. ${knowledgePrompt}\n${state.reflections.knowledge}`);
        }
        lines.push('', 'INSTRUCTOR EVIDENCE APPENDIX', ...factualEvidence().map(item => `- ${item}`), '', 'Mock AI only. No AI-authored reasoning or reflective claim is included.');
        return lines.join('\n');
    }

    function createPacket() {
        const confirmed = document.getElementById('packetConfirm')?.checked;
        if (!confirmed) {
            assertive.textContent = state.lang !== 'en' ? 'Confirma el borrador exacto antes de crear el paquete.' : 'Confirm the exact draft before creating the packet.';
            document.getElementById('packetConfirm')?.focus();
            return;
        }
        if (concept === 'notebook' || concept === 'integrated') checkpointVersion('final packet created');
        state.packetCreatedAt = new Date().toISOString();
        state.packetDraft = markedDraft();
        saveState(t('packetReady')); renderApp();
    }

    function downloadText(text, filename, type = 'text/plain') {
        const blob = new Blob([text], { type: `${type};charset=utf-8` });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
        URL.revokeObjectURL(url);
    }


    function openVoiceNote(index) {
        const entry = voiceEntries()[index];
        if (!entry) return;
        openDialog(uiText('Your Voice', 'Tu voz'), uiText('Keep what sounds like you', 'Guarda lo que suena como tú'), `<blockquote class="voice-entry-quote">${escapeHtml(entry.text)}</blockquote><div class="field"><label for="voiceReason">${escapeHtml(uiText('Why do you want to keep this? (optional)', '¿Por qué quieres guardar esto? (opcional)'))}</label><textarea id="voiceReason" data-protect-dirty spellcheck="${spellcheckEnabled()}" maxlength="500">${escapeHtml(entry.reason || '')}</textarea></div><p>${escapeHtml(uiText('This exact student-selected wording stays local. It is not a quality score and is never included with mock AI unless you choose it in a request.', 'Esta redacción exacta seleccionada por el estudiante permanece local. No es una puntuación de calidad y nunca se incluye con IA simulada a menos que la elijas en una solicitud.'))}</p>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="save-voice-note" data-index="${index}">${escapeHtml(t('save'))}</button>`);
    }

    function saveVoiceNote(index) {
        const entry = voiceEntries()[index];
        if (!entry) return;
        entry.reason = document.getElementById('voiceReason')?.value || '';
        entry.updatedAt = new Date().toISOString();
        const legacy = state.protectedPhrases?.find(item => item.id === entry.id);
        if (legacy) legacy.reason = entry.reason;
        saveState(uiText('Your Voice note saved locally.', 'Nota de Tu voz guardada localmente.'));
        closeDialog(true); renderApp();
    }

    function stuckMicroTask() {
        const tasks = {
            autobiographical: uiText('Write one detail that only you can name. Leave out anything you do not want to disclose.', 'Escribe un detalle que solo tú puedes nombrar. Omite cualquier cosa que no quieras revelar.'),
            stem: uiText('Name one observation and one variable that might matter.', 'Nombra una observación y una variable que podrían importar.'),
            sop: uiText('Name one preparation detail that supports your next question.', 'Nombra un detalle de preparación que respalde tu próxima pregunta.'),
            admissions: uiText('Name one concrete action before explaining what changed.', 'Nombra una acción concreta antes de explicar qué cambió.'),
            neutral: uiText('Name the reader, purpose, and one piece of evidence.', 'Nombra al lector, el propósito y una evidencia.'),
        };
        const starter = stuckStarters[state.genre];
        if (starter) return uiText(starter.en, starter.es);
        return tasks[state.genre] || tasks.neutral;
    }

    function openStuckSupport() {
        const choices = [
            ['idea', uiText('I don’t know what to write', 'No sé qué escribir')],
            ['feedback', uiText('I don’t understand this feedback', 'No entiendo esta retroalimentación')],
            ['overwhelmed', uiText('I feel overwhelmed', 'Me siento abrumado/a')],
            ['break', uiText('I need a break', 'Necesito un descanso')],
            ['instructor', uiText('I want instructor help', 'Quiero ayuda del instructor')],
        ];
        openDialog(uiText('I’m stuck', 'Estoy atascado/a'), uiText('Choose one small next step. Nothing here is required.', 'Elige un pequeño próximo paso. Nada aquí es obligatorio.'), `<div class="choice-stack stuck-choices">${choices.map(([id, label]) => `<button class="radio-card" data-action="stuck-choice" data-choice="${id}"><span>${escapeHtml(label)}</span></button>`).join('')}</div>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button>`);
    }

    function openStuckChoice(choice) {
        if (choice === 'idea') {
            openDialog(uiText('One small writing step', 'Un pequeño paso de escritura'), uiText('Optional and genre-aware', 'Opcional y apropiado al género'), `<p class="stuck-microtask">${escapeHtml(stuckMicroTask())}</p><p>${escapeHtml(uiText('You can use this as a private starting point, open a Move, or keep writing in your own way. Nothing is inserted into your draft.', 'Puedes usar esto como inicio privado, abrir una Movida o seguir escribiendo a tu manera. No se inserta nada en tu borrador.'))}</p>`, `<button class="button ghost" data-action="copy-stuck-starter" data-starter="${escapeHtml(stuckMicroTask())}">${escapeHtml(uiText('Copy starter', 'Copiar inicio'))}</button><button class="button secondary" data-action="stuck-open-move" data-move="0">${escapeHtml(uiText('Open a Move', 'Abrir una Movida'))}</button><button class="button primary" data-action="return-write">${escapeHtml(uiText('Return to draft', 'Volver al borrador'))}</button>`);
            return;
        }
        if (choice === 'feedback') {
            const review = state.reviews.at(-1);
            const council = state.councilRuns.at(-1);
            const latest = review || council;
            if (!latest) {
                openDialog(uiText('Understand feedback', 'Entender la retroalimentación'), uiText('No saved feedback yet', 'Aún no hay retroalimentación guardada'), `<p>${escapeHtml(uiText('There is no saved report to explain. You can keep writing, or ask for review later if it would help.', 'No hay un informe guardado para explicar. Puedes seguir escribiendo o pedir una revisión más tarde si te ayuda.'))}</p>`, `<button class="button primary" data-action="return-write">${escapeHtml(uiText('Return to draft', 'Volver al borrador'))}</button>`);
                return;
            }
            const tab = review ? 'history' : 'council';
            closeDialog(true, () => openReviewCenter(tab));
            return;
        }
        if (choice === 'overwhelmed') {
            openDialog(uiText('Make the page quieter', 'Haz la página más tranquila'), uiText('A reversible next action', 'Una acción reversible'), `<p>${escapeHtml(uiText('Focus hides optional supports for now. You can leave it at any time; your draft stays here.', 'Enfoque oculta los apoyos opcionales por ahora. Puedes salir en cualquier momento; tu borrador permanece aquí.'))}</p><p class="stuck-microtask">${escapeHtml(uiText('Try one sentence, then decide what you need next.', 'Prueba una oración y luego decide qué necesitas.'))}</p>`, `<button class="button ghost" data-action="return-write">${escapeHtml(uiText('Keep normal view', 'Mantener vista normal'))}</button><button class="button primary" data-action="stuck-focus">${escapeHtml(uiText('Use Focus for now', 'Usar Enfoque por ahora'))}</button>`);
            return;
        }
        if (choice === 'break') {
            saveState(uiText('Saved locally.', 'Guardado localmente.'));
            openDialog(uiText('You can take a break', 'Puedes tomar un descanso'), uiText('Your work is saved on this device', 'Tu trabajo está guardado en este dispositivo'), `<p>${escapeHtml(uiText('You may return later. There is no timer and no lost progress.', 'Puedes volver más tarde. No hay temporizador ni progreso perdido.'))}</p>`, `<button class="button primary" data-action="return-write">${escapeHtml(uiText('Return when ready', 'Volver cuando estés listo/a'))}</button>`);
            return;
        }
        const summary = safeInstructorSummary();
        openDialog(uiText('Ask an instructor for help', 'Pedir ayuda al instructor'), uiText('Local, writing-free summary', 'Resumen local sin escritura'), `<p>${escapeHtml(uiText('This preview does not include your draft, notes, Voice entries, feedback text, reflection, or personal information.', 'Esta vista previa no incluye tu borrador, notas, entradas de Tu voz, texto de retroalimentación, reflexión ni información personal.'))}</p><pre class="safe-summary">${escapeHtml(summary)}</pre>`, `<button class="button ghost" data-action="copy-instructor-summary">${escapeHtml(uiText('Copy summary', 'Copiar resumen'))}</button><button class="button primary" data-action="return-write">${escapeHtml(uiText('Return to draft', 'Volver al borrador'))}</button>`);
    }

    function safeInstructorSummary() {
        return [
            `Tu Pana Writing Studio`,
            `${uiText('Writing project', 'Proyecto de escritura')}: ${genreLabel()}`,
            `${uiText('Draft word count', 'Conteo de palabras del borrador')}: ${wordCount(getDraft())}`,
            `${uiText('Saved feedback reports', 'Informes de retroalimentación guardados')}: ${state.reviews.length + state.councilRuns.length}`,
            `${uiText('Student decisions recorded', 'Decisiones estudiantiles registradas')}: ${state.decisions.length}`,
        ].join('\n');
    }

    function openHelp() {
        openDialog(uiText('Help', 'Ayuda'), uiText('Tu Pana Writing Studio', 'Tu Pana Writing Studio'), `<p>${escapeHtml(uiText('Choose a safe route. Reports and feedback stay on this device.', 'Elige una ruta segura. Los reportes y comentarios permanecen en este dispositivo.'))}</p><div class="choice-stack"><button class="radio-card" data-action="tour-start"><span><strong>${escapeHtml(uiText('Let Tu Pana show you around', 'Deja que Tu Pana te muestre el lugar'))}</strong><br><small>${escapeHtml(uiText('A short conversation, no typing. Uses sample material, never your writing.', 'Una conversación corta, sin escribir nada. Usa material de muestra, nunca tu escritura.'))}</small></span></button><button class="radio-card" data-action="help-disclosure"><span>${uiMarkup(...A3.summary)}</span></button><button class="radio-card" data-action="help-report"><span>${escapeHtml(uiText('Report a problem', 'Reportar un problema'))}</span></button><button class="radio-card" data-action="help-feedback"><span>${escapeHtml(uiText('Share feedback', 'Compartir comentarios'))}</span></button></div>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button>`);
    }

    // A3 tier 3: the fuller Help explanation. Same context-safe primitive as
    // the consent surfaces — no second bilingual pattern.
    function openDataDisclosure() {
        const body = A3.help.map(([heading, copy]) =>
            `<section class="a3-help-section"><h3>${uiMarkup(...heading)}</h3><p>${uiMarkup(...copy)}</p></section>`).join('');
        openDialog(uiText(...A3.summary), uiText('Tu Pana Writing Studio', 'Tu Pana Writing Studio'),
            `<div class="a3-help">${body}</div>`,
            `<button class="button ghost" data-action="close-dialog">${escapeHtml(uiText('Close', 'Cerrar'))}</button>`);
    }

    function openHelpReport(category = 'problem') {
        const categories = category === 'feedback'
            ? [['feedback', uiText('I have feedback', 'Tengo comentarios')]]
            : [['broken', uiText('Something did not work', 'Algo no funcionó')], ['confused', uiText('I’m confused', 'Estoy confundido/a')]];
        openDialog(category === 'feedback' ? uiText('Share feedback', 'Compartir comentarios') : uiText('Report a problem', 'Reportar un problema'), uiText('Preview what would be shared', 'Vista previa de lo que se compartiría'), `<div class="field"><label for="reportCategory">${escapeHtml(uiText('Category', 'Categoría'))}</label><select id="reportCategory">${categories.map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join('')}</select></div><div class="field"><label for="reportDescription">${escapeHtml(uiText('What happened? (optional)', '¿Qué pasó? (opcional)'))}</label><textarea id="reportDescription" data-protect-dirty spellcheck="${spellcheckEnabled()}" maxlength="1000"></textarea></div><label class="check-line"><input type="checkbox" id="reportTechContext"> <span>${escapeHtml(uiText('Include safe technical context: app version, writing-project identifier, and browser/device category.', 'Incluye contexto técnico seguro: versión de la aplicación, identificador del proyecto y categoría de navegador/dispositivo.'))}</span></label><p>${escapeHtml(uiText('Never included: your draft, notes, Your Voice entries, AI payloads, reports, reflection, identity, history, or precise location. The Writing Studio does not send this report anywhere.', 'Nunca se incluye: tu borrador, notas, entradas de Tu voz, cargas de IA, informes, reflexión, identidad, historial o ubicación precisa. El Writing Studio no envía este reporte a ningún lugar.'))}</p>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="preview-local-report" data-kind="${category}">${escapeHtml(uiText('Preview local report', 'Vista previa del reporte local'))}</button>`);
    }

    function previewLocalReport(kind) {
        const category = document.getElementById('reportCategory')?.value || kind;
        const description = document.getElementById('reportDescription')?.value || '';
        const includeTech = document.getElementById('reportTechContext')?.checked;
        const report = { category, description, sent: false };
        if (includeTech) report.technicalContext = { appVersion: 'writing-studio-2026-08', genre: state.genre, deviceCategory: window.matchMedia('(max-width: 640px)').matches ? 'mobile-sized browser' : 'desktop-sized browser' };
        openDialog(uiText('Local report preview', 'Vista previa del reporte local'), uiText('Nothing is sent', 'No se envía nada'), `<pre class="safe-summary">${escapeHtml(JSON.stringify(report, null, 2))}</pre><p>${escapeHtml(uiText('This is a local preview only. Tu Pana has not sent any information.', 'Esta es solo una vista previa local. Tu Pana no ha enviado información.'))}</p>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="return-write">${escapeHtml(uiText('Return to draft', 'Volver al borrador'))}</button>`);
    }

    function openSettings() {
        const integratedSettings = concept === 'integrated' ? `<section class="packet-section settings-section"><h3>${escapeHtml(state.lang === 'en' ? 'Writing project' : 'Proyecto de escritura')}</h3><p>${escapeHtml(state.lang === 'en' ? 'An assignment link can set this writing project automatically; this control also lets you choose it yourself.' : 'Un enlace de tarea puede definir este proyecto de escritura automáticamente; este control también te deja elegirlo.')}</p>${state.assignmentNotice ? `<p class="assignment-notice">${escapeHtml(state.lang === 'en' ? state.assignmentNotice.en : state.assignmentNotice.es)}</p>` : ''}<label class="field" for="settingsGenre"><span>${escapeHtml(t('genre'))}</span><select id="settingsGenre" class="settings-select" data-action="genre" aria-label="${escapeHtml(t('genre'))}">${genreOptionsMarkup()}</select></label></section><section class="packet-section settings-section"><h3>${escapeHtml(state.lang === 'en' ? 'Writing utilities' : 'Utilidades de escritura')}</h3><label class="check-line"><input type="checkbox" data-action="native-spellcheck" ${spellcheckEnabled() ? 'checked' : ''}> <span>${escapeHtml(state.lang === 'en' ? 'Native spelling suggestions' : 'Sugerencias ortográficas nativas')}</span></label><p>${escapeHtml(state.lang === 'en' ? 'Spelling suggestions come from your browser or device. Tu Pana does not send your writing for this feature.' : 'Las sugerencias ortográficas provienen de tu navegador o dispositivo. Tu Pana no envía tu escritura para esta función.')}</p></section><section class="packet-section settings-section"><h3>${escapeHtml(uiText('Appearance', 'Apariencia'))}</h3><p>${escapeHtml(uiText('Choose a local visual-comfort preference. It does not affect your writing or evidence.', 'Elige una preferencia local de comodidad visual. No afecta tu escritura ni la evidencia.'))}</p><div class="choice-stack appearance-choices">${[['system', uiText('System default', 'Predeterminado del sistema')], ['light', uiText('Paper / Light', 'Papel / Claro')], ['dark', uiText('Dark', 'Oscuro')]].map(([value, label]) => `<button class="radio-card ${state.appearance === value ? 'selected' : ''}" data-action="appearance-choice" data-appearance="${value}" aria-pressed="${state.appearance === value}"><span>${escapeHtml(label)}</span></button>`).join('')}</div></section><section class="packet-section settings-section"><h3>${escapeHtml(uiText('Legacy Writing Studio work', 'Trabajo del Writing Studio anterior'))}</h3><p>${escapeHtml(uiText('If this browser holds work from the earlier ten-step Writing Studio, you can preview exactly what an import would bring over. Nothing is imported, changed, or deleted without this preview, and your legacy record stays untouched.', 'Si este navegador guarda trabajo del Writing Studio anterior de diez pasos, puedes previsualizar exactamente qué traería una importación. Nada se importa, cambia o borra sin esta previsualización, y tu registro anterior queda intacto.'))}</p><button class="button secondary" data-action="legacy-import">${escapeHtml(uiText('Preview legacy import', 'Previsualizar importación'))}</button>${state.legacyImport ? `<p class="assignment-notice">${escapeHtml(uiText(`Legacy import applied ${new Date(state.legacyImport.appliedAt).toLocaleDateString()}.`, `Importación aplicada ${new Date(state.legacyImport.appliedAt).toLocaleDateString()}.`))}</p><button class="button ghost" data-action="legacy-import-restore">${escapeHtml(uiText('Restore pre-import state', 'Restaurar estado previo a la importación'))}</button>` : ''}</section>` : '';
        openDialog(t('settingsTitle'), conceptMeta[concept].name, `<p>${escapeHtml(t('storageNote'))}</p>${integratedSettings}<section class="danger-zone"><h3>${escapeHtml(t('danger'))}</h3><p>${escapeHtml(t('deleteExplain'))}</p><button class="button secondary" data-action="export-state">${escapeHtml(t('export'))}</button><div class="field" style="margin-top:15px"><label for="deleteConfirm">${escapeHtml(t('typeDelete'))}</label><input class="delete-confirm" id="deleteConfirm" type="text" autocomplete="off"></div><button class="button danger" data-action="delete-state" disabled>${escapeHtml(t('deleteNow'))}</button></section>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button>`);
    }

    function deletePrototypeState() {
        localStorage.removeItem(storageKey(concept));
        state = defaultState(concept);
        captured = null;
        closeDialog(true); renderApp();
        announce(state.lang !== 'en' ? 'Datos guardados borrados de este dispositivo.' : 'Saved data deleted from this device.');
    }

    function openLegacyImportPreview() {
        const scan = StudioImport.scanLegacy(localStorage);
        if (!scan.found) {
            openDialog(uiText('Legacy import', 'Importación anterior'), uiText('Nothing found', 'Nada encontrado'), `<p>${escapeHtml(uiText('No legacy Writing Studio work was found in this browser. Nothing was changed.', 'No se encontró trabajo del Writing Studio anterior en este navegador. Nada cambió.'))}</p>`, `<button class="button primary" data-action="close-dialog">${escapeHtml(t('cancel'))}</button>`);
            return;
        }
        const plan = StudioImport.buildPlan(scan, state);
        const excerpt = text => text.length > 160 ? `${text.slice(0, 160)}…` : text;
        const body = `
            <p>${escapeHtml(uiText('This preview shows every effect before anything happens. Cancel changes nothing; your legacy record is never modified or deleted.', 'Esta previsualización muestra cada efecto antes de que ocurra. Cancelar no cambia nada; tu registro anterior nunca se modifica ni se borra.'))}</p>
            ${plan.liveDraft ? `<section class="packet-section"><h3>${escapeHtml(uiText('Becomes your live draft', 'Se convierte en tu borrador activo'))}</h3><p>${plan.liveDraft.words} ${escapeHtml(uiText('words from', 'palabras de'))} ${escapeHtml(plan.liveDraft.key)}${plan.liveDraft.collapsedKeys && plan.liveDraft.collapsedKeys.length ? ` · ${escapeHtml(uiText('identical copies collapsed:', 'copias idénticas agrupadas:'))} ${escapeHtml(plan.liveDraft.collapsedKeys.join(', '))}` : ''}</p><div class="exact-preview">${escapeHtml(excerpt(plan.liveDraft.text))}</div></section>` : ''}
            ${plan.liveDraftBlockedByExisting ? `<section class="packet-section"><h3>${escapeHtml(uiText('Your current Studio draft is preserved', 'Tu borrador actual del Studio se conserva'))}</h3><p>${escapeHtml(uiText('Because your Studio draft already has content, the legacy draft is imported as an exact recoverable snapshot instead — nothing is overwritten.', 'Como tu borrador del Studio ya tiene contenido, el borrador anterior se importa como una instantánea exacta recuperable — nada se sobrescribe.'))}</p></section>` : ''}
            ${plan.snapshots.length ? `<section class="packet-section"><h3>${escapeHtml(uiText('Exact snapshots (date not recorded)', 'Instantáneas exactas (fecha no registrada)'))}</h3><ul>${plan.snapshots.map(item => `<li>${escapeHtml(item.key)} · ${item.words} ${escapeHtml(uiText('words', 'palabras'))}${item.collapsedKeys.length ? ` · ${escapeHtml(uiText('identical copies collapsed:', 'copias idénticas agrupadas:'))} ${escapeHtml(item.collapsedKeys.join(', '))}` : ''}</li>`).join('')}</ul></section>` : ''}
            ${plan.voiceEntries.length ? `<section class="packet-section"><h3>${escapeHtml(uiText('Your Voice entries (exact text, real dates)', 'Entradas de Tu voz (texto exacto, fechas reales)'))}</h3><ul>${plan.voiceEntries.map(item => `<li>“${escapeHtml(item.text)}”</li>`).join('')}</ul></section>` : ''}
            ${plan.facts.length ? `<section class="packet-section"><h3>${escapeHtml(uiText('Imported as read-only evidence', 'Importado como evidencia de solo lectura'))}</h3><ul>${plan.facts.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>` : ''}
            <section class="packet-section"><h3>${escapeHtml(uiText('Deliberately not imported', 'Deliberadamente no importado'))}</h3><ul>${plan.notImported.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
            ${plan.assignmentSuggestion ? `<p class="assignment-notice">${escapeHtml(uiText(`The legacy record remembers the assignment “${plan.assignmentSuggestion}”. You can choose the matching writing project in Settings; it is not switched automatically.`, `El registro anterior recuerda la tarea “${plan.assignmentSuggestion}”. Puedes elegir el proyecto correspondiente en Configuración; no se cambia automáticamente.`))}</p>` : ''}
            <p><strong>${escapeHtml(uiText('A restorable snapshot of your current Studio record is stored before anything is applied.', 'Antes de aplicar nada se guarda una copia restaurable de tu registro actual del Studio.'))}</strong></p>`;
        openDialog(uiText('Legacy import preview', 'Previsualización de importación'), uiText('Nothing happens without your confirmation', 'Nada ocurre sin tu confirmación'), body, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="legacy-import-apply">${escapeHtml(uiText('Import into the Studio', 'Importar al Studio'))}</button>`, { wide: true });
    }

    function applyLegacyImport() {
        const scan = StudioImport.scanLegacy(localStorage);
        const plan = StudioImport.buildPlan(scan, state);
        StudioImport.applyPlan(plan, scan, state);
        saveState();
        closeDialog(true);
        renderApp();
        announce(uiText('Legacy work imported. A restorable pre-import snapshot is in Settings.', 'Trabajo anterior importado. Hay una copia restaurable en Configuración.'));
    }

    function restoreLegacyImport() {
        const restored = StudioImport.restorePreImport(state);
        if (!restored) { announce(uiText('No pre-import snapshot exists.', 'No existe una copia previa a la importación.')); return; }
        state = restored;
        saveState();
        closeDialog(true);
        renderApp();
        announce(uiText('Pre-import state restored exactly.', 'Estado previo a la importación restaurado exactamente.'));
    }

    function handleAction(target) {
        const action = target.dataset.action;
        if (!action) return;
        if (window.StudioTour?.handleAction(tourContext(), action, target)) return;
        if (action === 'settings') openSettings();
        else if (action === 'legacy-import') openLegacyImportPreview();
        else if (action === 'legacy-import-apply') applyLegacyImport();
        else if (action === 'legacy-import-restore') restoreLegacyImport();
        else if (action === 'appearance-cycle') setAppearance(nextAppearance());
        else if (action === 'appearance-choice') { setAppearance(target.dataset.appearance); openSettings(); }
        else if (action === 'help') openHelp();
        else if (action === 'help-disclosure') openDataDisclosure();
        else if (action === 'help-report') openHelpReport('problem');
        else if (action === 'help-feedback') openHelpReport('feedback');
        else if (action === 'preview-local-report') previewLocalReport(target.dataset.kind);
        else if (action === 'stuck') openStuckSupport();
        else if (action === 'revision-cycle') openRevisionCycle();
        else if (action === 'save-review-copy') { if (saveReviewCopy()) openRevisionCycle(); }
        else if (action === 'update-review-copy') { if (saveReviewCopy()) openRevisionCycle(); }
        else if (action === 'revision-self-review') openRevisionFocus();
        else if (action === 'revision-existing-feedback') { if (state.reviews.length || state.councilRuns.length) closeDialog(true, () => openReviewCenter(state.reviews.length ? 'history' : 'council')); else openDialog(uiText('Use feedback I already have', 'Usar comentarios que ya tengo'), uiText('No saved feedback yet', 'Aún no hay comentarios guardados'), `<p>${escapeHtml(uiText('There is no saved report to reopen. You can review the copy yourself, keep revising, or intentionally ask for feedback later.', 'No hay un informe guardado para reabrir. Puedes revisar la copia por tu cuenta, seguir revisando o pedir comentarios más tarde de forma intencional.'))}</p>`, `<button class="button secondary" data-action="revision-self-review">${escapeHtml(uiText('Review it myself', 'Revisarlo yo mismo/a'))}</button><button class="button ghost" data-action="return-write">${escapeHtml(uiText('Keep revising', 'Seguir revisando'))}</button>`); }
        else if (action === 'revision-ask-feedback') closeDialog(true, openFocusedReviewDialog);
        else if (action === 'revision-council') closeDialog(true, openCouncilDialog);
        else if (action === 'revision-focus-suggestion') openRevisionFocus(target.dataset.suggestion || '');
        else if (action === 'save-revision-focus') saveRevisionFocus(target.dataset.suggestion || '');
        else if (action === 'compare-review-copy') openRevisionComparison();
        else if (action === 'compare-view') openRevisionComparison(target.dataset.view || 'before');
        else if (action === 'revision-brief-reflection') openRevisionBriefReflection();
        else if (action === 'save-revision-closure') saveRevisionClosure();
        else if (action === 'finish-from-revision') { closeDialog(true); checkpointVersion('entered Finish'); setView('finish'); }
        else if (action === 'stuck-choice') openStuckChoice(target.dataset.choice);
        else if (action === 'stuck-open-move') { closeDialog(true); openIntegratedMoveNote(Number(target.dataset.move)); }
        else if (action === 'copy-stuck-starter') copyTextWithFallback(target.dataset.starter || '', uiText('Starter copied.', 'Inicio copiado.'), uiText('Copy is unavailable here. Use your device’s Edit menu.', 'Copiar no está disponible aquí. Usa el menú Editar de tu dispositivo.'));
        else if (action === 'stuck-focus') { closeDialog(true); document.body.classList.add('focus-mode'); document.getElementById('draftEditor')?.focus(); }
        else if (action === 'copy-instructor-summary') copyTextWithFallback(safeInstructorSummary(), uiText('Summary copied.', 'Resumen copiado.'), uiText('Copy is unavailable here. Use your device’s Edit menu.', 'Copiar no está disponible aquí. Usa el menú Editar de tu dispositivo.'));
        else if (action === 'voice-note') openVoiceNote(Number(target.dataset.voice));
        else if (action === 'save-voice-note') saveVoiceNote(Number(target.dataset.index));
        else if (action === 'edit-undo') applyEditHistory(-1);
        else if (action === 'edit-redo') applyEditHistory(1);
        else if (action === 'edit-cut' || action === 'edit-copy' || action === 'edit-paste' || action === 'edit-select-all') runEditAction(action);
        else if (action === 'close-dialog') closeDialog();
        else if (action === 'overlay-close') closeDialog();
        else if (action === 'discard-dialog') discardDialogChanges();
        else if (action === 'keep-editing') keepEditingDialog();
        else if (action === 'knowledge-choice') { state.knowledgeChoice = target.dataset.choice === 'engage' ? 'engage' : 'skip'; state.knowledgeChoiceAt = new Date().toISOString(); state.onboardingSeenAt ||= state.knowledgeChoiceAt; saveState(); renderApp(); }
        else if (action === 'knowledge-reset') { state.knowledgeChoice = null; saveState(); renderApp(); }
        else if (action === 'integrated-move-note') openIntegratedMoveNote(Number(target.dataset.move));
        else if (action === 'passage-moves') openPassageMoves();
        else if (action === 'passage-move') openIntegratedMoveNote(Number(target.dataset.move), passageContext());
        else if (action === 'save-integrated-note') saveIntegratedMoveNote(Number(target.dataset.move));
        else if (action === 'place-notebook') { state.place = 'notebook'; state.view = 'write'; captured = null; saveState(); renderApp(); }
        else if (action === 'place-draft') { if (state.draftDeclared) { state.place = 'draft'; state.view = 'write'; saveState(); renderApp(); } }
        else if (action === 'create-draft') createCanonicalDraft();
        else if (action === 'my-work') openMyWork();
        else if (action === 'notebook-card') { state.activeNotebook = Number(target.dataset.card); state.place = 'notebook'; state.view = 'write'; saveState(); closeDialog(); renderApp(); }
        else if (action === 'notebook-back') { state.activeNotebook = Math.max(0, state.activeNotebook - 1); saveState(); renderApp(); }
        else if (action === 'notebook-next') { if (state.activeNotebook < notebookCards().length - 1) { state.activeNotebook += 1; saveState(); renderApp(); } else createCanonicalDraft(); }
        else if (action === 'paste-notebook') openPasteNotebookDialog();
        else if (action === 'save-notebook-paste') saveNotebookPaste();
        else if (action === 'notebook-coach') openNotebookCoachDialog();
        else if (action === 'submit-notebook-coach') submitNotebookCoach(target);
        else if (action === 'paste') openPasteDialog();
        else if (action === 'replace-draft') { const value = document.getElementById('pasteDraft')?.value || ''; checkpointVersion('before draft replacement'); setDraft(value); saveState(); closeDialog(true); renderApp(); }
        else if (action === 'activate-move') openMoveDialog(Number(target.dataset.move));
        else if (action === 'save-move') { const key = `move-${target.dataset.move}`; state.artifacts[key] = { text: document.getElementById('moveNote')?.value || '', updatedAt: new Date().toISOString(), label: genreMoves('discover')[Number(target.dataset.move)] }; saveState(); closeDialog(true); renderApp(); }
        else if (action === 'focus') { document.body.classList.add('focus-mode'); document.getElementById('draftEditor')?.focus(); }
        else if (action === 'exit-focus') { document.body.classList.remove('focus-mode'); document.getElementById('draftEditor')?.focus(); }
        else if (action === 'back') navigateRelative(-1);
        else if (action === 'continue') navigateRelative(1);
        else if (action === 'step' || action === 'go-artifact') goStep(Number(target.dataset.step));
        else if (action === 'phase') { state.phase = Number(target.dataset.phase); saveState(); renderApp(); }
        else if (action === 'mark-current') { state.currentArtifact = `step-${state.step}`; saveState(); renderApp(); }
        else if (action === 'coach') openCoachDialog();
        else if (action === 'passage-review') {
            // The captured passage must still be this draft's wording before it
            // can reach the consent step; scope is never silently widened.
            const check = validateCapture();
            if (!check.ok) captureInvalid(check.reason);
            else openScopeDialog('coach', t('coach'), state.lang !== 'en' ? 'La selección ya está capturada aunque iOS la cierre.' : 'The selection is already captured even if iOS collapses it.');
        }
        else if (action === 'protect-phrase') protectCapturedPhrase();
        else if (action === 'clear-passage') { captured = null; updatePassageBar(); document.getElementById('draftEditor')?.focus(); }
        else if (action === 'clear-move-context') { dialogRoot.querySelectorAll('input[name="moveContext"]').forEach(input => { input.checked = false; }); announce(uiText('General passage help selected. No Move note will be included.', 'Ayuda general seleccionada. No se incluirá ninguna nota de Movida.')); }
        else if (action === 'focused-review') closeDialog(false, openFocusedReviewDialog);
        else if (action === 'council' || action === 'convene-again') closeDialog(false, openCouncilDialog);
        else if (action === 'review-center') closeDialog(false, () => openReviewCenter());
        else if (action === 'submit-mock') submitMockReview(target.dataset.kind, target);
        else if (action === 'run-council') runCouncil(target);
        else if (action === 'review-tab') openReviewCenter(target.dataset.tab);
        else if (action === 'evidence-browser') openEvidenceArchive();
        else if (action === 'evidence-filter') openEvidenceArchive(target.dataset.filter || 'moves');
        else if (action === 'evidence-open-review') openReviewCenter(target.dataset.tab || 'history');
        else if (action === 'dismiss-invitation') dismissInvitation(target.dataset.invitation, false);
        else if (action === 'hide-invitation') dismissInvitation(target.dataset.invitation, true);
        else if (action === 'version-history') openVersionHistory();
        else if (action === 'view-snapshot') openSnapshotViewer(target.dataset.snapshot, target.dataset.returnTab || 'versions');
        else if (action === 'copy-snapshot') copySnapshotText(target.dataset.snapshot);
        else if (action === 'decision') recordDecision(target);
        else if (action === 'save-integrated-decision') saveIntegratedDecision();
        else if (action === 'reflection') { if (state.view === 'reflection') saveReflection(); setView('reflection'); }
        else if (action === 'save-reflection') saveReflection();
        else if (action === 'finish') { if (state.view === 'reflection') saveReflection(); if (concept === 'notebook' || concept === 'integrated') checkpointVersion('entered Finish'); setView('finish'); }
        else if (action === 'return-write') { if (dialogRoot.contains(target)) closeDialog(true); if (concept === 'notebook' && state.draftDeclared) state.place = 'draft'; setView('write'); }
        else if (action === 'create-packet') createPacket();
        else if (action === 'download-packet') downloadText(packetText(), 'tupana-writing-packet.txt');
        else if (action === 'export-state') downloadText(JSON.stringify({ app: 'tupana-writing-studio', exportedAt: new Date().toISOString(), state }, null, 2), 'tupana-writing-studio-backup.json', 'application/json');
        else if (action === 'delete-state') deletePrototypeState();
    }

    root.addEventListener('click', event => {
        const target = event.target.closest('[data-action]');
        if (target) handleAction(target);
    });
    dialogRoot.addEventListener('click', event => {
        const target = event.target.closest('[data-action]');
        if (target && !(target.dataset.action === 'overlay-close' && event.target !== target)) handleAction(target);
    });

    document.addEventListener('change', event => {
        const target = event.target;
        if (target.matches('[data-action="language"]')) {
            state.lang = target.value;
            saveState();
            renderApp();
            // An open Guided Discovery rebuilds its current response group in the
            // new language and drops anything still arriving in the old one.
            window.StudioTour?.notifyEnvironmentChanged?.(tourContext());
        }
        else if (target.matches('[data-action="genre"]')) {
            storeActiveGenreState();
            state.genre = genres[target.value] ? target.value : target.value;
            loadActiveGenreState(state.genre);
            captured = null;
            saveState();
            if (dialogRoot.contains(target)) closeDialog(true);
            renderApp();
            window.StudioTour?.notifyEnvironmentChanged?.(tourContext());
            announce(`${t('genre')}: ${genreLabel()}`);
            requestAnimationFrame(() => (document.querySelector('.mobile-project-chip') || document.querySelector('.genre-select'))?.focus());
        }
        else if (target.matches('[data-action="native-spellcheck"]')) {
            state.nativeSpellcheck = target.checked;
            saveState();
            document.querySelectorAll('textarea').forEach(field => field.spellcheck = target.checked);
        }
        else if (target.matches('[data-action="finish-check"]')) { state.finishChecks[target.dataset.key] = target.checked; saveState(); }
        else if (target.name === 'reviewScope') { const preview = document.getElementById('scopePreview'); if (preview) preview.textContent = scopeText(target.value); }
        else if (target.id === 'transmitConsent') { const button = dialogRoot.querySelector('[data-action="submit-mock"], [data-action="run-council"], [data-action="submit-notebook-coach"]'); if (button) button.disabled = !target.checked; }
    });

    document.addEventListener('input', event => {
        if (event.target.matches?.('textarea, input[type="text"]')) {
            setActiveEditSurface(event.target);
            recordEditInput(event.target);
        }
        // F1 — the consent preview tracks the question as it is typed, so what
        // the writer reads is always what would be sent at that moment.
        if (event.target.id === 'coachQuestion') { const preview = document.getElementById('coachRequestPreview'); if (preview) preview.textContent = coachRequestText(event.target.value); }
        if (event.target.id === 'pasteDraft') { const preview = document.getElementById('pastePreview'); if (preview) preview.textContent = event.target.value; }
        if (event.target.id === 'pasteNotebookText') { const preview = document.getElementById('pasteNotebookPreview'); if (preview) preview.textContent = event.target.value; }
        if (event.target.id === 'deleteConfirm') { const button = dialogRoot.querySelector('[data-action="delete-state"]'); if (button) button.disabled = event.target.value !== 'DELETE'; }
    });

    document.addEventListener('focusin', event => {
        if (event.target.matches?.('textarea, input[type="text"]')) setActiveEditSurface(event.target);
    });

    document.addEventListener('toggle', event => {
        const target = event.target;
        if (concept !== 'integrated' || !target.matches?.('.critical-moment') || !target.open) return;
        const key = target.dataset.criticalKey || 'thinking';
        const nearby = target.closest('.review-card');
        const signature = `${key}:${nearby?.querySelector('.review-meta')?.textContent || ''}`;
        if (!state.criticalViews.some(view => view.signature === signature)) {
            state.criticalViews.push({ key, signature, openedAt: new Date().toISOString() });
            saveState();
        }
    }, true);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && dialogRoot.firstElementChild) {
            if (dialogRoot.querySelector('.dirty-confirm')) keepEditingDialog();
            else closeDialog();
        }
        const dialog = dialogRoot.querySelector('[role="dialog"]');
        if (event.key === 'Tab' && dialog) {
            const focusable = Array.from(dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')).filter(el => !el.hidden && el.offsetParent !== null);
            if (!focusable.length) return;
            const first = focusable[0], last = focusable.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });

    // The reliable iOS signal. `select` on a textarea is not dispatched for a
    // touch selection made with the native handles, so on a physical iPhone the
    // Passage Tray never appeared and sentence-level Your Voice was unreachable.
    // selectionchange is document-level, so the editor is resolved each time.
    document.addEventListener('selectionchange', () => {
        const editor = document.getElementById('draftEditor');
        if (!editor || document.activeElement !== editor) return;
        scheduleSelectionCapture(editor);
    });

    window.visualViewport?.addEventListener('resize', updateVisualViewport);
    window.visualViewport?.addEventListener('scroll', updateVisualViewport);
    window.addEventListener('resize', updateVisualViewport);
    window.addEventListener('beforeunload', () => saveState());

    // Assignment resolution: legacy and current links map to explicit profiles
    // (studio-profiles.js aliases). Unknown ids stop loudly in renderWorkspace and
    // inherit neither the autobiographical nor the General Writing profile.
    (function resolveAssignmentFromLink() {
        const raw = new URLSearchParams(location.search).get('assignment');
        if (!raw) return;
        const resolved = resolveAssignment(raw);
        if (resolved) {
            if (state.genre !== resolved.profileId) {
                storeActiveGenreState();
                state.genre = resolved.profileId;
                loadActiveGenreState(resolved.profileId);
                captured = null;
            }
            state.assignmentId = raw.trim();
            state.assignmentNotice = resolved.notice || null;
        } else {
            // The alias map is the ONLY route from a link to a profile. A raw id
            // that happens to equal an internal profile key must not bypass it:
            // that is how an ambiguous `?assignment=stem` reached the lab report
            // even after the alias was withdrawn. Prefixing guarantees no
            // registry hit, so the configuration-required stop always renders.
            state.genre = `unconfigured:${raw.trim()}`;
            state.assignmentId = raw.trim();
            state.assignmentNotice = null;
        }
        saveState();
    }());
    renderApp();
})();
