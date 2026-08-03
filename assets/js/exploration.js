/*
 * Tu Pana Writing Studio comparative prototypes — local exploration only.
 * This file deliberately does not import, enumerate, or read any R0 storage key.
 * Every concept has one exact, window-specific storage key and uses mock AI only.
 */
(function () {
    'use strict';

    const WINDOW_ID = 'writing-studio-ux-2026-08';
    const STORAGE_BASE = `tupana-explore:${WINDOW_ID}`;
    const CONCEPTS = ['desk', 'journey', 'hybrid', 'notebook', 'integrated'];
    const root = document.getElementById('prototypeRoot');
    const dialogRoot = document.getElementById('dialogRoot');
    const live = document.getElementById('liveRegion');
    const assertive = document.getElementById('assertiveRegion');
    const params = new URLSearchParams(location.search);
    let concept = CONCEPTS.includes(params.get('concept')) ? params.get('concept') : '';
    let state = concept ? loadState(concept) : null;
    let captured = null;
    let saveTimer = null;
    let lastFocus = null;
    let reviewTab = 'history';
    let pendingDecision = null;
    let dialogGuard = null;
    let dialogAfterDiscard = null;
    let editorCaret = null;

    const conceptMeta = {
        desk: {
            short: 'Desk', name: 'Draft-centered Desk', number: '1',
            mental: 'One piece of writing, one desk.',
            summary: 'A canonical draft stays central while pedagogical moves, evidence, coach work, and Council reports gather around it.',
            tags: ['1 draft', 'Contextual moves', '2 places'],
        },
        journey: {
            short: 'Journey', name: 'Clarified staged journey', number: '2',
            mental: 'Ten truthful steps, one visible spine.',
            summary: 'The conservative control keeps ten step-owned artifacts, then makes current-version truth, prior work, and review re-entry explicit.',
            tags: ['10 steps', 'Work rail', 'Current marker'],
        },
        hybrid: {
            short: 'Hybrid', name: 'Simplified hybrid', number: '3',
            mental: 'One draft through four purposeful phases.',
            summary: 'A canonical draft moves through Discover, Draft, Strengthen, and Finish with genre-aware moves underneath and one Review Center.',
            tags: ['4 phases', '1 draft', 'Review Center'],
        },
        notebook: {
            short: 'Notebook', name: 'Cuaderno y Borrador · Notebook & Draft', number: '4',
            mental: 'Think in a notebook; write one draft.',
            summary: 'Genre-shaped, skippable notebook cards support preparation. A calm authorship boundary begins one empty canonical draft without transferring notebook prose.',
            tags: ['2 kinds of work', '1 draft', 'Authorship boundary'],
        },
        integrated: {
            short: 'Finalist', name: 'Integrated Desk · Finalist', number: '5', finalist: true,
            mental: 'My essay lives in the Draft. Moves and notes help me think.',
            summary: 'Desk clarity with durable genre-specific Move notes, visible coach access, contextual critical-AI judgment, and optional culturally responsive preparation.',
            tags: ['Finalist under evaluation', '1 draft', 'Persistent Move notes'],
        },
    };

    const copy = {
        en: {
            prototype: 'Local UX prototype — synthetic text and mock AI only. Do not paste real coursework.',
            saved: 'Saved on this device', saving: 'Saving locally…', saveFailed: 'Not saved. Keep this page open and export a safety copy.',
            compare: 'Compare concepts', settings: 'Settings', language: 'Language', genre: 'Writing project',
            whereDesk: 'Your Desk', whereJourney: 'Step {n} of 10', whereHybrid: 'Phase {n} of 4',
            doingDesk: 'Shape one current draft. Open a move only when it helps.',
            doingJourney: 'Work on this step’s artifact. Your marked current version stays visible.',
            doingHybrid: 'Keep one draft moving through a smaller set of phases.',
            nextDesk: 'Next: strengthen the draft or open Finish when you are ready.',
            nextJourney: 'Next: {next}. Back and Continue never mark work complete.',
            nextHybrid: 'Next: {next}. Your draft carries forward unchanged.',
            currentDraft: 'Current draft', currentVersion: 'Marked current version', autosaved: 'Autosaved locally', words: '{n} words',
            paste: 'Paste synthetic draft', useSample: 'Use synthetic sample', focus: 'Focus', exitFocus: 'Exit focus',
            reviewCenter: 'Review Center', focusedReview: 'Focused review', council: 'The Council', coach: 'Ask Tu Pana',
            reflection: 'Process Reflection', finish: 'Finish', back: 'Back', continue: 'Continue',
            priorWork: 'Prior work', moves: 'Moves for this moment', workRail: 'Your work', evidence: 'Evidence so far',
            noPrior: 'Your writing and review history will appear here.', noReviews: 'No mock reviews yet. Your draft remains entirely yours.',
            selectHint: 'Select words in the draft to ask about that exact passage.', captured: 'Passage captured', reviewPassage: 'Review passage', clear: 'Clear',
            sendCoach: 'Send to mock coach', sendReview: 'Request mock review', convene: 'Convene mock Council', revisit: 'Revisit report',
            selectedScope: 'Selected passage', paragraphScope: 'Current paragraph', fullScope: 'Full draft', exactPreview: 'Exact text preview',
            consent: 'I choose to send this exact text to the mock AI in this local prototype.',
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
            settingsTitle: 'Prototype settings', storageNote: 'This concept uses one isolated local-storage record. It never reads R0 or family-preview work.',
            focusDecision: 'Mobile Focus decision', danger: 'Danger Zone', export: 'Export safety copy', delete: 'Delete this concept’s prototype data',
            deleteExplain: 'Only this concept’s synthetic prototype record will be removed. Other concepts and R0 keys are untouched.',
            typeDelete: 'Type DELETE to enable deletion', deleteNow: 'Delete prototype data',
            startBlank: 'Start with a blank draft', replaceDraft: 'Replace draft with this synthetic text',
            pasteWarning: 'Exploration boundary: use only synthetic or disposable participant-authored test text. Never paste real coursework.',
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
            pasteNotebook: 'Paste synthetic notebook material', saveCard: 'Save notebook card', nextCard: 'Continue to: {name}',
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
            prototype: 'Prototipo UX local — solo texto sintético e IA simulada. No pegues trabajo académico real.',
            saved: 'Guardado en este dispositivo', saving: 'Guardando localmente…', saveFailed: 'No se guardó. Mantén esta página abierta y exporta una copia.',
            compare: 'Comparar conceptos', settings: 'Configuración', language: 'Idioma', genre: 'Proyecto de escritura',
            whereDesk: 'Tu Escritorio', whereJourney: 'Paso {n} de 10', whereHybrid: 'Fase {n} de 4',
            doingDesk: 'Trabaja un solo borrador actual. Abre una movida solo cuando ayude.',
            doingJourney: 'Trabaja el artefacto de este paso. Tu versión actual marcada siempre está visible.',
            doingHybrid: 'Mueve un solo borrador por un recorrido más corto.',
            nextDesk: 'Próximo: fortalece el borrador o abre Finalizar cuando estés listo.',
            nextJourney: 'Próximo: {next}. Atrás y Continuar nunca marcan trabajo como completo.',
            nextHybrid: 'Próximo: {next}. Tu borrador continúa sin cambios.',
            currentDraft: 'Borrador actual', currentVersion: 'Versión actual marcada', autosaved: 'Autoguardado local', words: '{n} palabras',
            paste: 'Pegar borrador sintético', useSample: 'Usar ejemplo sintético', focus: 'Enfoque', exitFocus: 'Salir de enfoque',
            reviewCenter: 'Centro de Revisión', focusedReview: 'Lectura enfocada', council: 'El Consejo', coach: 'Preguntar a Tu Pana',
            reflection: 'Reflexión de proceso', finish: 'Finalizar', back: 'Atrás', continue: 'Continuar',
            priorWork: 'Trabajo anterior', moves: 'Movidas para este momento', workRail: 'Tu trabajo', evidence: 'Evidencia hasta ahora',
            noPrior: 'Tu escritura e historial de revisión aparecerán aquí.', noReviews: 'Todavía no hay revisiones simuladas. Tu borrador sigue siendo completamente tuyo.',
            selectHint: 'Selecciona palabras del borrador para preguntar por ese pasaje exacto.', captured: 'Pasaje capturado', reviewPassage: 'Revisar pasaje', clear: 'Borrar selección',
            sendCoach: 'Enviar al coach simulado', sendReview: 'Pedir revisión simulada', convene: 'Convocar Consejo simulado', revisit: 'Revisitar informe',
            selectedScope: 'Pasaje seleccionado', paragraphScope: 'Párrafo actual', fullScope: 'Borrador completo', exactPreview: 'Vista previa del texto exacto',
            consent: 'Elijo enviar este texto exacto a la IA simulada en este prototipo local.',
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
            settingsTitle: 'Configuración del prototipo', storageNote: 'Este concepto usa un solo registro local aislado. Nunca lee trabajo de R0 ni de la vista previa familiar.',
            focusDecision: 'Decisión de Enfoque móvil', danger: 'Zona de peligro', export: 'Exportar copia de seguridad', delete: 'Borrar datos de este concepto',
            deleteExplain: 'Solo se borrará el registro sintético de este concepto. Los otros conceptos y las claves R0 no cambian.',
            typeDelete: 'Escribe DELETE para activar el borrado', deleteNow: 'Borrar datos del prototipo',
            startBlank: 'Comenzar con borrador vacío', replaceDraft: 'Reemplazar con este texto sintético',
            pasteWarning: 'Límite de exploración: usa solo texto sintético o desechable creado para la prueba. Nunca pegues trabajo académico real.',
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
            pasteNotebook: 'Pegar material sintético en el cuaderno', saveCard: 'Guardar tarjeta', nextCard: 'Continuar a: {name}',
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

    const genres = {
        autobiographical: {
            label: { en: 'Mixed-genre autobiographical essay', es: 'Ensayo autobiográfico de género mixto' },
            sample: 'At the neighborhood library, I answered my aunt in English until she said, “aquí escuchamos primero.” I had treated translation as a quick exchange of words. Her phrase made me notice who was expected to adapt, whose knowledge counted, and why language access is also a question of power. This synthetic essay connects that chosen memory to a larger history of public institutions and multilingual communities without asking any student to disclose a private family story.',
            moves: {
                discover: ['Choose a memory and a boundary', 'Connect memory to a larger force', 'Test experience with research and context', 'Protect language and voice'],
                review: ['Personal-to-social connection', 'Evidence and historical grounding', 'Voice and translingual integrity'],
                council: ['Connection and structure reviewer', 'Evidence and historical-context reviewer', 'Voice and cultural-integrity reviewer'],
            },
        },
        admissions: {
            label: { en: 'College personal statement', es: 'Ensayo de admisión universitaria' },
            sample: 'The first week at the neighborhood learning center, I designed a color-coded signup sheet because I thought efficiency was the problem. By Friday, I understood that the real problem was trust. Families did not need a faster form; they needed someone to explain what the form would change. I began sitting beside each visitor, listening before writing. That shift—from solving the visible task to understanding the human need—now guides how I approach community technology and the questions I hope to study in college.',
            moves: {
                discover: ['Choose one concrete turning point', 'Name what changed in your understanding', 'Connect the moment to what you will pursue'],
                review: ['Purpose and personal insight', 'Structure and narrative movement', 'Voice and specificity'],
                council: ['Admissions reader', 'Writing teacher', 'Student voice advocate'],
            },
        },
        stem: {
            label: { en: 'STEM lab report', es: 'Informe de laboratorio STEM' },
            sample: 'The basil seedlings exposed to eight hours of light grew an average of 2.4 centimeters more than the seedlings exposed to four hours. This result supports the prediction that longer light exposure increases early stem growth under otherwise controlled conditions. The small sample size and one unusually tall seedling limit the strength of the conclusion. A second trial with more plants and randomized tray positions would test whether the pattern persists.',
            moves: {
                discover: ['State the research question and prediction', 'Separate observation from interpretation', 'Connect the result to the evidence'],
                review: ['Claim–evidence alignment', 'Methods and reproducibility', 'Limitations and precision'],
                council: ['Lab instructor', 'Methods reviewer', 'Scientific clarity editor'],
            },
        },
        sop: {
            label: { en: 'Graduate statement of purpose', es: 'Carta de propósito para posgrado' },
            sample: 'My work on a public transit accessibility project showed me how technical decisions become public consequences. I entered the project focused on routing efficiency and left asking how disabled riders could shape the systems intended to serve them. Graduate study in human-centered computing would let me build the research methods needed to investigate that question with rigor. I hope to study participatory design, accessible infrastructure, and the ways public institutions can evaluate whether technology expands meaningful access.',
            moves: {
                discover: ['Name the problem you want to study', 'Connect prior preparation to future inquiry', 'Make program fit specific and evidence-based'],
                review: ['Purpose and research trajectory', 'Preparation and evidence', 'Program fit and contribution'],
                council: ['Faculty reader', 'Research mentor', 'Purpose-and-fit editor'],
            },
        },
        neutral: {
            label: { en: 'General writing project', es: 'Proyecto general de escritura' },
            sample: 'This synthetic draft begins with a clear purpose, develops one idea with concrete evidence, and leaves room for the writer to decide what should change next. The language is intentionally neutral so that no assignment inherits expectations from an unrelated genre.',
            moves: {
                discover: ['Clarify the purpose and audience', 'Choose relevant evidence', 'Arrange ideas so the reader can follow'],
                review: ['Purpose and clarity', 'Structure and evidence', 'Voice and precision'],
                council: ['Audience reader', 'Structure reviewer', 'Voice advocate'],
            },
        },
    };

    const genreMovesEs = {
        autobiographical: {
            discover: ['Elige una memoria y un límite', 'Conecta la memoria con una fuerza mayor', 'Contrasta la experiencia con investigación y contexto', 'Protege el idioma y la voz'],
            review: ['Conexión personal y social', 'Evidencia y contexto histórico', 'Voz e integridad translingüe'],
            council: ['Revisor de conexión y estructura', 'Revisor de evidencia y contexto histórico', 'Revisor de voz e integridad cultural'],
        },
        admissions: {
            discover: ['Elige un punto de cambio concreto', 'Nombra qué cambió en tu comprensión', 'Conecta el momento con lo que quieres perseguir'],
            review: ['Propósito y reflexión personal', 'Estructura y movimiento narrativo', 'Voz y especificidad'],
            council: ['Lector de admisiones', 'Docente de escritura', 'Defensor de la voz estudiantil'],
        },
        stem: {
            discover: ['Declara la pregunta y la predicción', 'Separa observación de interpretación', 'Conecta el resultado con la evidencia'],
            review: ['Alineación de afirmación y evidencia', 'Métodos y reproducibilidad', 'Limitaciones y precisión'],
            council: ['Instructor de laboratorio', 'Revisor de métodos', 'Editor de claridad científica'],
        },
        sop: {
            discover: ['Nombra el problema que quieres estudiar', 'Conecta tu preparación con la investigación futura', 'Haz que el encaje con el programa sea específico'],
            review: ['Propósito y trayectoria de investigación', 'Preparación y evidencia', 'Encaje y contribución al programa'],
            council: ['Lector de facultad', 'Mentor de investigación', 'Editor de propósito y encaje'],
        },
        neutral: {
            discover: ['Aclara el propósito y la audiencia', 'Elige evidencia relevante', 'Ordena las ideas para orientar al lector'],
            review: ['Propósito y claridad', 'Estructura y evidencia', 'Voz y precisión'],
            council: ['Lector de audiencia', 'Revisor de estructura', 'Defensor de la voz'],
        },
    };

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

    // Canonical Five Questions, traced to assets/js/ui.js EVAL_QUESTIONS and
    // index.html #fiveQStrip. The finalist selects one question per authentic
    // decision and keeps the remainder behind progressive disclosure.
    const criticalQuestions = {
        cultural: {
            en: 'Does it miss what you know from your own community?',
            es: '¿Está perdiendo algo que tú sabes desde tu comunidad?',
            principle: 'Cultural knowledge',
        },
        accuracy: {
            en: 'Are factual or academic claims real and verified — or does this need a source?',
            es: '¿Las afirmaciones académicas o históricas son reales y verificadas — o necesitan una fuente?',
            principle: 'Accuracy',
        },
        voice: {
            en: 'Does this still sound like the specific person who wrote it?',
            es: '¿Todavía suena como la persona específica que lo escribió?',
            principle: 'Voice',
        },
        specificity: {
            en: 'Are there concrete details, or does it stay too abstract?',
            es: '¿Hay detalles concretos o se queda demasiado abstracto?',
            principle: 'Specificity',
        },
        thinking: {
            en: 'Does this deepen the thinking this piece of writing is trying to do?',
            es: '¿Profundiza el pensamiento que este trabajo escrito intenta desarrollar?',
            principle: 'Thinking',
        },
    };

    const integratedMoveProfiles = {
        autobiographical: [
            {
                id: 'memory-boundary', criticalKey: 'specificity',
                en: 'Choose a memory and a boundary', es: 'Elige una memoria y un límite',
                nudgeEn: 'Find a place, relationship, and moment of change—or choose another entry point.',
                nudgeEs: 'Encuentra un lugar, una relación y un cambio—o elige otro punto de entrada.',
                whyEn: 'Specificity helps the reader enter the essay. Identity, family, migration, and trauma disclosure are never required.',
                whyEs: 'La especificidad ayuda al lector. Nunca se exige divulgar identidad, familia, migración ni trauma.',
                promptEn: 'Possible memory, concrete detail, shift, privacy boundary, or a different entry point…',
                promptEs: 'Memoria posible, detalle, cambio, límite de privacidad u otro punto de entrada…',
            },
            {
                id: 'larger-force', criticalKey: 'thinking',
                en: 'Connect memory to a larger force', es: 'Conecta la memoria con una fuerza mayor',
                nudgeEn: 'Ask what historical, social, cultural, linguistic, economic, or political force meets this moment.',
                nudgeEs: 'Pregunta qué fuerza histórica, social, cultural, lingüística, económica o política cruza este momento.',
                whyEn: 'The genre moves from chosen experience toward analysis; the story is not decoration.',
                whyEs: 'El género avanza de la experiencia elegida al análisis; la historia no es decoración.',
                promptEn: 'Larger pattern, tension, bridge, question, standpoint, or system to investigate…',
                promptEs: 'Patrón, tensión, puente, pregunta, perspectiva o sistema por investigar…',
            },
            {
                id: 'research-context', criticalKey: 'accuracy',
                en: 'Test experience with research and context', es: 'Contrasta la experiencia con investigación y contexto',
                nudgeEn: 'Identify a source that could confirm, complicate, or challenge what experience suggests.',
                nudgeEs: 'Identifica una fuente que pueda confirmar, complicar o cuestionar lo que sugiere la experiencia.',
                whyEn: 'Experiential and community knowledge can guide inquiry; factual claims still need traceable support.',
                whyEs: 'El conocimiento vivido y comunitario guía la investigación; los hechos aún necesitan apoyo rastreable.',
                promptEn: 'Community source, scholarly source, historical fact, search term, contradiction, or verification need…',
                promptEs: 'Fuente comunitaria o académica, hecho histórico, término, contradicción o verificación…',
            },
            {
                id: 'voice-language', criticalKey: 'voice',
                en: 'Protect language and voice', es: 'Protege el idioma y la voz',
                nudgeEn: 'Keep code-meshing, dialect, family language, or culturally specific phrasing when it carries meaning.',
                nudgeEs: 'Conserva la mezcla de códigos, dialecto, lenguaje familiar o frase cultural cuando lleva significado.',
                whyEn: 'Smoother is not always truer. Revision must not flatten the writer into generic academic English.',
                whyEs: 'Más pulido no siempre es más verdadero. La revisión no debe aplanar la voz en inglés académico genérico.',
                promptEn: 'Phrase, rhythm, language choice, translation limit, community meaning, or voice risk to protect…',
                promptEs: 'Frase, ritmo, idioma, límite de traducción, significado comunitario o riesgo para la voz…',
            },
        ],
        admissions: [
            {
                id: 'disclosure', criticalKey: 'cultural',
                en: 'Choose what you want to reveal', es: 'Elige lo que quieres revelar',
                nudgeEn: 'Choose a small moment you can tell fully—or choose another.',
                nudgeEs: 'Elige un momento pequeño que puedas contar por completo—o elige otro.',
                whyEn: 'A personal essay needs specificity, not trauma or compulsory disclosure.',
                whyEs: 'Un ensayo personal necesita especificidad, no trauma ni divulgación obligatoria.',
                promptEn: 'Possible moments, boundaries, or details I choose to keep private…',
                promptEs: 'Momentos posibles, límites o detalles que decido mantener privados…',
            },
            {
                id: 'language', criticalKey: 'voice',
                en: 'Protect language and cultural meaning', es: 'Protege el idioma y el significado cultural',
                nudgeEn: 'Protect a word, rhythm, code-meshed phrase, or community meaning.',
                nudgeEs: 'Protege una palabra, ritmo, frase mezclada o significado comunitario.',
                whyEn: 'Clarity should not flatten multilingual voice into generic admissions language.',
                whyEs: 'La claridad no debe aplanar la voz multilingüe en lenguaje genérico de admisiones.',
                promptEn: 'Language, phrase, translation choice, or meaning I want to protect…',
                promptEs: 'Idioma, frase, decisión de traducción o significado que quiero proteger…',
            },
            {
                id: 'connection', criticalKey: 'thinking',
                en: 'Connect moment to insight', es: 'Conecta el momento con la reflexión',
                nudgeEn: 'What changed in your understanding, and why does it matter here?',
                nudgeEs: '¿Qué cambió en tu comprensión y por qué importa aquí?',
                whyEn: 'The essay becomes more than a scene when your own thinking gives it direction.',
                whyEs: 'El ensayo se vuelve más que una escena cuando tu propio pensamiento le da dirección.',
                promptEn: 'The change, tension, audience connection, or larger meaning I may develop…',
                promptEs: 'El cambio, tensión, conexión con el lector o significado mayor que podría desarrollar…',
            },
        ],
        stem: [
            {
                id: 'question', criticalKey: 'accuracy',
                en: 'Question and prediction', es: 'Pregunta y predicción',
                nudgeEn: 'State what the investigation can test and what result you predicted.',
                nudgeEs: 'Declara qué puede comprobar la investigación y qué resultado predijiste.',
                whyEn: 'A testable question keeps the report aligned with the actual experiment.',
                whyEs: 'Una pregunta comprobable mantiene el informe alineado con el experimento real.',
                promptEn: 'Research question, prediction, variables, or course concept to verify…',
                promptEs: 'Pregunta, predicción, variables o concepto del curso que debo verificar…',
            },
            {
                id: 'observation', criticalKey: 'specificity',
                en: 'Separate observation from interpretation', es: 'Separa observación de interpretación',
                nudgeEn: 'Record only what you measured or observed before explaining what it may mean.',
                nudgeEs: 'Registra solo lo que mediste u observaste antes de explicar qué podría significar.',
                whyEn: 'Scientific readers need to distinguish data from the writer’s interpretation.',
                whyEs: 'Los lectores científicos necesitan distinguir los datos de la interpretación.',
                promptEn: 'Measurements, observations, table notes, outliers, or uncertainties…',
                promptEs: 'Mediciones, observaciones, notas de tabla, valores atípicos o incertidumbres…',
            },
            {
                id: 'reasoning', criticalKey: 'thinking',
                en: 'Link evidence to the claim', es: 'Conecta la evidencia con la afirmación',
                nudgeEn: 'Name which data supports the claim and which course concept explains the link.',
                nudgeEs: 'Nombra qué datos apoyan la afirmación y qué concepto del curso explica la conexión.',
                whyEn: 'Reasoning—not confident tone—shows why evidence supports a conclusion.',
                whyEs: 'El razonamiento—no un tono seguro—muestra por qué la evidencia apoya una conclusión.',
                promptEn: 'Claim, supporting data, reasoning, limitation, or source of error…',
                promptEs: 'Afirmación, datos, razonamiento, limitación o fuente de error…',
            },
        ],
        sop: [
            {
                id: 'trajectory', criticalKey: 'thinking', en: 'Trace a supported direction', es: 'Traza una dirección respaldada',
                nudgeEn: 'Connect a concrete experience to the question or problem you want to study.', nudgeEs: 'Conecta una experiencia concreta con la pregunta o problema que quieres estudiar.',
                whyEn: 'A supported trajectory is stronger than an invented origin story.', whyEs: 'Una trayectoria respaldada es más fuerte que una historia de origen inventada.',
                promptEn: 'Experience, preparation, question, or forward link…', promptEs: 'Experiencia, preparación, pregunta o conexión futura…',
            },
            {
                id: 'evidence', criticalKey: 'specificity', en: 'Pair claims with evidence', es: 'Une afirmaciones con evidencia',
                nudgeEn: 'Name the action, result, and learning behind each preparation claim.', nudgeEs: 'Nombra la acción, el resultado y el aprendizaje detrás de cada afirmación.',
                whyEn: 'Evidence distinguishes demonstrated preparation from résumé summary.', whyEs: 'La evidencia distingue la preparación demostrada del resumen del currículum.',
                promptEn: 'Claim, concrete action, result, and what it demonstrates…', promptEs: 'Afirmación, acción, resultado y qué demuestra…',
            },
            {
                id: 'fit', criticalKey: 'accuracy', en: 'Verify program fit', es: 'Verifica el encaje con el programa',
                nudgeEn: 'Use only program details you can trace to an official source.', nudgeEs: 'Usa solo detalles del programa que puedas rastrear a una fuente oficial.',
                whyEn: 'Confident but invented fit claims damage trust.', whyEs: 'Las afirmaciones seguras pero inventadas dañan la confianza.',
                promptEn: 'Official source, verified feature, open question, or fact to check…', promptEs: 'Fuente oficial, característica verificada, pregunta o dato por comprobar…',
            },
        ],
        neutral: [
            {
                id: 'purpose', criticalKey: 'thinking', en: 'Clarify purpose and audience', es: 'Aclara propósito y audiencia',
                nudgeEn: 'Name what the reader should understand or do.', nudgeEs: 'Nombra qué debe comprender o hacer el lector.',
                whyEn: 'Purpose helps you decide what belongs and what does not.', whyEs: 'El propósito ayuda a decidir qué pertenece y qué no.',
                promptEn: 'Purpose, audience, constraint, or question…', promptEs: 'Propósito, audiencia, restricción o pregunta…',
            },
            {
                id: 'evidence', criticalKey: 'accuracy', en: 'Gather defensible evidence', es: 'Reúne evidencia defendible',
                nudgeEn: 'List examples, observations, or sources you can verify.', nudgeEs: 'Enumera ejemplos, observaciones o fuentes que puedas verificar.',
                whyEn: 'Evidence lets readers test the writing’s claims.', whyEs: 'La evidencia permite que los lectores comprueben las afirmaciones.',
                promptEn: 'Evidence, source, observation, or verification need…', promptEs: 'Evidencia, fuente, observación o necesidad de verificación…',
            },
            {
                id: 'structure', criticalKey: 'specificity', en: 'Sketch a useful sequence', es: 'Bosqueja una secuencia útil',
                nudgeEn: 'Arrange the claim, evidence, complication, and conclusion.', nudgeEs: 'Ordena la afirmación, evidencia, complicación y conclusión.',
                whyEn: 'A sequence gives the reader a path without writing the draft for you.', whyEs: 'Una secuencia orienta al lector sin escribir el borrador por ti.',
                promptEn: 'Possible order, missing section, or transition job…', promptEs: 'Orden posible, sección faltante o función de transición…',
            },
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

    function storageKey(name) { return `${STORAGE_BASE}:${name}:v1`; }

    function defaultState(name) {
        const now = new Date().toISOString();
        return {
            schema: 1, concept: name, lang: 'en', genre: name === 'integrated' ? 'autobiographical' : 'admissions', draft: '',
            step: 1, phase: 1, view: 'write', savedAt: now, createdAt: now,
            place: name === 'notebook' ? 'notebook' : 'write', activeNotebook: 0,
            notebookEntries: {}, notebookCoachRuns: [], draftDeclared: false, draftCreatedAt: null,
            moveNotes: {}, knowledgeChoice: null, knowledgeChoiceAt: null,
            criticalViews: [], onboardingSeenAt: null, protectedPhrases: [], finishChecks: {}, genreStates: {}, nativeSpellcheck: true,
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
            return { ...fallback, ...parsed, reflections: { ...fallback.reflections, ...(parsed.reflections || {}) } };
        } catch (error) {
            console.warn('[Exploration] isolated state could not be restored', error);
            return fallback;
        }
    }

    function saveState(message = '') {
        if (!state) return;
        state.savedAt = new Date().toISOString();
        try {
            localStorage.setItem(storageKey(concept), JSON.stringify(state));
            document.querySelectorAll('[data-save-state]').forEach(el => { el.textContent = t('saved'); });
            if (message) announce(message);
        } catch (error) {
            document.querySelectorAll('[data-save-state]').forEach(el => { el.textContent = t('saveFailed'); });
            assertive.textContent = t('saveFailed');
            console.error('[Exploration] isolated prototype write failed', error);
        }
    }

    function scheduleSave() {
        clearTimeout(saveTimer);
        document.querySelectorAll('[data-save-state]').forEach(el => { el.textContent = t('saving'); });
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
        sample: '', moves: { discover: [], review: [], council: [] },
    };
    function currentGenre() { return genres[state.genre] || (concept === 'integrated' ? unknownGenre : genres.neutral); }
    function genreLabel() { return currentGenre().label[state.lang === 'en' ? 'en' : 'es']; }
    function storedGenreLabel(record) {
        if (state.lang === 'es' && record?.genreLabelEs) return record.genreLabelEs;
        if (record?.genreLabel) return record.genreLabel;
        if (record?.genre && genres[record.genre]) return genres[record.genre].label[state.lang === 'es' ? 'es' : 'en'];
        return state.lang === 'es' ? 'Género no guardado · registro sintético anterior' : 'Genre not stored · earlier synthetic record';
    }
    function spellcheckEnabled() { return state.nativeSpellcheck !== false; }
    function genreOptionsMarkup() {
        const selectable = Object.entries(genres).filter(([id]) => concept === 'integrated' || id !== 'autobiographical');
        const invalid = !genres[state.genre] ? `<option value="" selected disabled>${escapeHtml(state.lang === 'en' ? 'Select a configured genre' : 'Elige un género configurado')}</option>` : '';
        return `${invalid}${selectable.map(([id, genre]) => `<option value="${id}" ${id === state.genre ? 'selected' : ''}>${escapeHtml(genre.label[state.lang === 'en' ? 'en' : 'es'])}</option>`).join('')}`;
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
    function moveNoteKey(move) { return `${state.genre}:${move.id}`; }
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
    function integratedCriticalKey(kind, lens = '') {
        if (kind === 'council') return state.genre === 'stem' ? 'accuracy' : 'cultural';
        if (/evidence|accuracy|method|limit|claim/i.test(lens)) return 'accuracy';
        if (/voice|voz|personal|purpose/i.test(lens)) return 'voice';
        if (/structure|specific|precision|clarity|estructura|precisión/i.test(lens)) return 'specificity';
        return state.genre === 'admissions' || state.genre === 'autobiographical' ? 'voice' : 'thinking';
    }

    function renderBanner() {
        return `<div class="exploration-banner"><span class="banner-dot" aria-hidden="true"></span><strong>${escapeHtml(t('prototype'))}</strong></div>`;
    }

    function renderLanding() {
        document.documentElement.lang = 'en';
        document.body.dataset.concept = 'comparison';
        root.innerHTML = `${renderBanner()}
            <div class="comparison-shell">
                <section class="comparison-hero" aria-labelledby="comparisonTitle">
                    <div><p class="eyebrow">Founder comparison · August 2026</p>
                        <h1 id="comparisonTitle">Five ways to understand a writing studio.</h1>
                        <p class="lede">Each local concept supports the same complete task journey with isolated synthetic data and deterministic mock AI. The question is which mental model a first-time student can understand and trust.</p></div>
                    <aside class="comparison-note"><strong>No winner is implied.</strong><p>Test the same eleven tasks in each concept. Leave and return freely—each concept keeps its own local prototype state.</p></aside>
                </section>
                <section class="concept-grid" aria-label="Writing Studio concepts">
                    ${CONCEPTS.map(name => {
                        const item = conceptMeta[name];
                        return `<article class="concept-card ${item.finalist ? 'finalist-card' : ''}">${item.finalist ? `<span class="finalist-badge">${escapeHtml(copy.en.finalist)}</span>` : ''}<span class="concept-number">${item.number}</span><h2>${item.name}</h2><p><strong>${item.mental}</strong> ${item.summary}</p><div class="concept-tags">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div><a class="button primary" href="?concept=${name}">Open ${item.short} prototype <span aria-hidden="true">→</span></a></article>`;
                    }).join('')}
                </section>
                <section class="journey-script" aria-labelledby="taskJourneyTitle"><h2 id="taskJourneyTitle">Use the same journey every time</h2><p>Observe whether the concept answers where you are, what you are doing, and what happens next without facilitator explanation.</p><ol class="task-grid">${['Start writing or prewriting','Paste existing synthetic writing','Save, leave, and return','Find prior work','Move forward and backward','Ask the coach about a passage','Request focused review','Convene and revisit the Council','Act on a suggestion','Complete reflection','Prepare the final packet'].map(task => `<li>${task}</li>`).join('')}</ol></section>
            </div>`;
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

    function renderHeader() {
        const o = orientation();
        return `${renderBanner()}
            <header class="prototype-header"><div class="prototype-header-inner">
                <a class="brand-lockup" href="?" aria-label="${escapeHtml(t('compare'))}"><span class="brand-mark" aria-hidden="true">TP</span><span class="brand-copy"><strong>Tu Pana Writing Studio</strong><small>${escapeHtml(conceptMeta[concept].name)}${concept === 'integrated' ? ` · ${escapeHtml(t('finalist'))}` : ''}</small></span></a>
                <nav class="concept-switcher" aria-label="Prototype switcher"><a class="switch-link" href="?">${escapeHtml(t('compare'))}</a>${CONCEPTS.map(name => `<a class="switch-link" href="?concept=${name}" ${name === concept ? 'aria-current="page"' : ''}>${conceptMeta[name].number}. ${conceptMeta[name].short}</a>`).join('')}</nav>
                <div class="prototype-actions"><span class="save-state"><span class="save-state-dot" aria-hidden="true"></span><span data-save-state>${escapeHtml(t('saved'))}</span></span>
                    <select class="header-select genre-select" data-action="genre" aria-label="${escapeHtml(t('genre'))}">${genreOptionsMarkup()}</select>
                    <select class="header-select" data-action="language" aria-label="${escapeHtml(t('language'))}"><option value="en" ${state.lang === 'en' ? 'selected' : ''}>English</option><option value="es" ${state.lang === 'es' ? 'selected' : ''}>Español</option><option value="both" ${state.lang === 'both' ? 'selected' : ''}>Español + English</option></select>
                    <button class="icon-button" data-action="settings" aria-label="${escapeHtml(t('settings'))}" title="${escapeHtml(t('settings'))}">⚙</button></div>
            </div></header>
            <section class="orientation-bar" aria-label="Current location and next action"><div class="orientation-inner"><div class="orientation-copy"><span class="location-pill">${escapeHtml(o.where)}</span><div class="orientation-text"><strong>${escapeHtml(o.doing)}</strong><span>${escapeHtml(o.next)}</span></div>${concept === 'integrated' ? `<button class="mobile-project-chip" data-action="settings" aria-label="${escapeHtml(`${t('genre')}: ${genreLabel()}`)}"><span>${escapeHtml(t('genre'))}</span><strong>${escapeHtml(genreLabel())}</strong></button>` : ''}</div><div class="orientation-next"><small>${escapeHtml(t('currentDraft'))}</small><strong id="orientationDraftWords">${concept === 'notebook' && !state.draftDeclared ? escapeHtml(t('draftMissing')) : `${wordCount(getDraft())} ${escapeHtml(state.lang !== 'en' ? 'palabras' : 'words')}`}</strong></div></div></section>`;
    }

    function renderApp() {
        document.documentElement.lang = state.lang === 'en' ? 'en' : 'es';
        document.body.dataset.concept = concept;
        const content = state.view === 'reflection' ? renderReflectionPage() : state.view === 'finish' ? renderFinishPage() : renderWorkspace();
        root.innerHTML = `${renderHeader()}<div class="prototype-main">${content}</div><button class="button primary focus-exit" data-action="exit-focus">${escapeHtml(t('exitFocus'))}</button>${renderPassageBar()}`;
        bindEditor();
        bindNotebookEditor();
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

    function setView(view) {
        state.view = view;
        saveState();
        renderApp();
        requestAnimationFrame(() => root.focus());
    }

    function renderWorkspace() {
        if (concept === 'desk') return renderDeskWorkspace();
        if (concept === 'integrated') return genres[state.genre] ? renderIntegratedWorkspace() : renderGenreConfigurationError();
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
        <section class="panel notebook-card-panel" aria-labelledby="notebookCardTitle"><div class="editor-topline"><div class="draft-identity"><strong id="notebookCardTitle">${escapeHtml(notebookCardLabel(active))}</strong><span>${escapeHtml(notebookCardPrompt(active))}</span></div><div class="editor-actions"><button class="button ghost" data-action="paste-notebook">${escapeHtml(t('pasteNotebook'))}</button><button class="button secondary" data-action="notebook-sample">${escapeHtml(t('useSample'))}</button></div></div><div class="editor-wrap"><textarea id="notebookEditor" class="draft-editor notebook-editor" spellcheck="${spellcheckEnabled()}" aria-label="${escapeHtml(`${t('notebook')}: ${notebookCardLabel(active)}`)}" placeholder="${escapeHtml(state.lang === 'en' ? 'Think here in notes, fragments, questions, or an outline…' : 'Piensa aquí con notas, fragmentos, preguntas o un esquema…')}">${escapeHtml(entry.text)}</textarea><div class="editor-meta"><span id="notebookWordCount">${escapeHtml(t('words', { n: wordCount(entry.text) }))}</span><span class="autosave-message" data-save-state>${escapeHtml(entry.updatedAt ? `${t('notebookSaved')} · ${shortDate(entry.updatedAt)}` : t('autosaved'))}</span></div></div><p class="editor-privacy">${instruction('notebookCoachBoundary')} ${escapeHtml(t('noNetwork'))}</p><footer class="editor-footer"><div class="footer-group"><button class="button ghost" data-action="notebook-back" ${state.activeNotebook === 0 ? 'disabled' : ''}>← ${escapeHtml(t('back'))}</button><button class="button primary" data-action="notebook-next">${escapeHtml(state.activeNotebook < cards.length - 1 ? t('nextCard', { name: notebookCardLabel(cards[state.activeNotebook + 1]) }) : t('writeDraft'))} →</button></div><div class="footer-group"><button class="button secondary" data-action="notebook-coach">${escapeHtml(t('notebookCoach'))}</button></div></footer>${coachRuns.length ? `<div class="panel-body notebook-coach-history"><span class="mock-label">Mock coach · ${escapeHtml(notebookCardLabel(active))}</span><p>${escapeHtml(coachRuns.at(-1).response)}</p></div>` : ''}</section>
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
        return `<section class="panel integrated-moves"><div class="panel-header"><div><h2>${escapeHtml(t('moves'))}</h2><p>${escapeHtml(`${genreLabel()} · ${state.lang === 'en' ? 'optional guidance' : 'guía opcional'}`)}</p></div><span class="evidence-count" aria-label="${filled} ${escapeHtml(state.lang === 'en' ? 'notes with content' : 'notas con contenido')}">${filled}</span></div><div class="panel-body move-list">${moves.map((move, index) => {
            const note = state.moveNotes[moveNoteKey(move)];
            const hasNote = Boolean(note && wordCount(note.text));
            return `<article class="move-card integrated-move"><strong>${escapeHtml(integratedMoveLabel(move))}</strong><span>${escapeHtml(integratedMoveNudge(move))}</span><details><summary>${escapeHtml(state.lang === 'en' ? 'Why this may help' : 'Por qué podría ayudar')}</summary><p>${escapeHtml(integratedMoveWhy(move))}</p></details><button class="text-button" data-action="integrated-move-note" data-move="${index}">${escapeHtml(hasNote ? t('editNote') : t('makeNote'))}${hasNote ? ` · ${wordCount(note.text)} ${escapeHtml(state.lang === 'en' ? 'words' : 'palabras')}` : ''}</button></article>`;
        }).join('')}${renderPlanningNotesReference()}${renderProtectedPhrasesReference()}${renderKnowledgeRevisit()}</div></section>`;
    }

    function renderPlanningNotesReference() {
        const notes = integratedMoves().map(move => ({ move, note: state.moveNotes[moveNoteKey(move)] })).filter(item => wordCount(item.note?.text));
        if (!notes.length) return `<p class="planning-empty">${escapeHtml(state.lang === 'en' ? 'Planning notes appear here only after you write useful content. They never enter the draft automatically.' : 'Las notas aparecen aquí solo cuando escribes contenido útil. Nunca entran al borrador automáticamente.')}</p>`;
        return `<details class="planning-reference"><summary>${escapeHtml(t('planningNotes'))} · ${notes.length}</summary><div class="artifact-list">${notes.map(({ move, note }) => `<button class="artifact-row notebook-reference-row" data-action="integrated-move-note" data-move="${integratedMoves().indexOf(move)}"><strong>${escapeHtml(integratedMoveLabel(move))}</strong><small>${escapeHtml(`${wordCount(note.text)} ${state.lang === 'en' ? 'words' : 'palabras'} · ${note.text.slice(0, 88)}`)}</small></button>`).join('')}</div><p>${escapeHtml(state.lang === 'en' ? 'Reference only—nothing transfers to the canonical draft.' : 'Solo referencia—nada se transfiere al borrador canónico.')}</p></details>`;
    }

    function renderProtectedPhrasesReference() {
        if (state.genre !== 'autobiographical' || !state.protectedPhrases.length) return '';
        return `<details class="planning-reference protected-phrases"><summary>${escapeHtml(state.lang === 'en' ? 'Protected voice phrases' : 'Frases de voz protegidas')} · ${state.protectedPhrases.length}</summary><div class="artifact-list">${state.protectedPhrases.map(item => `<div class="artifact-row"><strong>“${escapeHtml(item.text)}”</strong><small>${escapeHtml(state.lang === 'en' ? 'Student protected exact text; mock AI cannot edit it.' : 'Texto exacto protegido por el estudiante; la IA simulada no puede editarlo.')}</small></div>`).join('')}</div></details>`;
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

    function renderEditor() {
        const isCurrent = concept !== 'journey' || state.currentArtifact === `step-${state.step}`;
        const focusAvailable = concept === 'desk' || concept === 'journey' || concept === 'integrated';
        return `<section class="panel editor-panel" aria-labelledby="draftTitle"><div class="editor-topline"><div class="draft-identity"><strong id="draftTitle">${escapeHtml(concept === 'journey' ? stepData(state.step - 1)[0] : t('currentDraft'))}</strong><span>${escapeHtml(isCurrent ? t('currentVersion') : t('priorWork'))}${concept === 'journey' ? ` · ${escapeHtml(t('whereJourney', { n: state.step }))}` : ''}</span></div><div class="editor-actions"><button class="button ghost" data-action="paste">${escapeHtml(t('paste'))}</button>${!getDraft() ? `<button class="button secondary" data-action="sample">${escapeHtml(t('useSample'))}</button>` : ''}${focusAvailable ? `<button class="button ghost focus-btn" data-action="focus">${escapeHtml(t('focus'))}</button>` : ''}</div></div>
            <div class="editor-wrap"><textarea id="draftEditor" class="draft-editor" spellcheck="${spellcheckEnabled()}" aria-label="${escapeHtml(t('currentDraft'))}" placeholder="${escapeHtml(state.lang !== 'en' ? 'Comienza con tus propias palabras…' : 'Start with your own words…')}">${escapeHtml(getDraft())}</textarea><div class="editor-meta"><span id="wordCount">${escapeHtml(t('words', { n: wordCount(getDraft()) }))}</span><span class="autosave-message" data-save-state>${escapeHtml(t('autosaved'))}</span></div></div>
            <p class="editor-privacy">${instruction('selectHint')} ${escapeHtml(t('noNetwork'))}</p>
            ${concept === 'integrated' ? `<section class="coach-entry" aria-label="${escapeHtml(t('askVisible'))}"><div><strong>${escapeHtml(t('askVisible'))}</strong><span>${escapeHtml(t('coachEntryHint'))}</span></div><button class="button secondary" data-action="coach">${escapeHtml(t('askVisible'))}</button></section>` : ''}
            <footer class="editor-footer"><div class="footer-group"><button class="button ghost" data-action="back" ${atBeginning() ? 'disabled' : ''}>← ${escapeHtml(t('back'))}</button><button class="button primary" data-action="continue">${escapeHtml(continueLabel())} →</button></div><div class="footer-group">${concept === 'journey' && !isCurrent && state.step >= 6 ? `<button class="button secondary" data-action="mark-current">${escapeHtml(t('markCurrent'))}</button>` : ''}<button class="button secondary" data-action="review-center">${escapeHtml(t('reviewCenter'))}</button></div></footer>
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
        const councilAction = concept === 'integrated' && state.genre === 'stem'
            ? `<div class="support-action unavailable"><strong>${escapeHtml(t('council'))}</strong><span>${escapeHtml(t('councilUnavailable'))}</span></div>`
            : concept === 'integrated' && state.councilRuns.length
                ? `<button class="support-action" data-action="review-tab" data-tab="council"><strong>${escapeHtml(t('council'))}</strong><span>${escapeHtml(t('revisit'))}</span></button>`
                : `<button class="support-action" data-action="council"><strong>${escapeHtml(t('council'))}</strong><span>${escapeHtml(state.councilRuns.length ? t('revisit') : t('convene'))}</span></button>`;
        return `<section class="panel"><div class="panel-header"><div><h2>${escapeHtml(t('reviewCenter'))}</h2><p>${state.reviews.length + state.councilRuns.length} ${escapeHtml(state.lang === 'en' ? 'saved reports' : 'informes guardados')}</p></div><span class="evidence-count">${state.decisions.length}</span></div><div class="panel-body"><button class="support-action" data-action="coach"><strong>${escapeHtml(t('coach'))}</strong><span>${escapeHtml(state.lang === 'en' ? 'passage, paragraph, or draft' : 'pasaje, párrafo o borrador')}</span></button><button class="support-action" data-action="focused-review"><strong>${escapeHtml(t('focusedReview'))}</strong><span>${escapeHtml(genreMoves('review')[0])}</span></button>${councilAction}<button class="support-action" data-action="review-center"><strong>${escapeHtml(t('priorWork'))}</strong><span>${escapeHtml(t('revisit'))}</span></button></div></section>`;
    }

    function renderEvidencePanel() {
        const currentVersions = concept === 'journey' ? Object.keys(state.artifacts).length : state.versions.length;
        const moveNoteCount = concept === 'integrated' ? integratedMoves().filter(move => wordCount(state.moveNotes[moveNoteKey(move)]?.text)).length : 0;
        const rationaleCount = state.decisions.filter(decision => decision.rationale?.trim()).length;
        const recoverableSnapshots = concept === 'integrated' ? state.versions.filter(version => typeof version.text === 'string').length : 0;
        const metadataCheckpoints = concept === 'integrated' ? state.versions.length - recoverableSnapshots : 0;
        const versionEvidence = concept === 'integrated'
            ? `<div class="artifact-row"><strong>${recoverableSnapshots} ${escapeHtml(state.lang === 'en' ? 'recoverable draft snapshots' : 'instantáneas recuperables del borrador')}</strong><small>${escapeHtml(metadataCheckpoints ? `${metadataCheckpoints} ${state.lang === 'en' ? 'earlier metadata-only checkpoints' : 'puntos anteriores solo con metadatos'}` : (state.lang === 'en' ? 'Exact prior text is viewable when a snapshot exists.' : 'El texto anterior exacto se puede ver cuando existe una instantánea.'))}</small><button class="text-button" data-action="version-history">${escapeHtml(state.lang === 'en' ? 'View draft history' : 'Ver historial del borrador')}</button></div>`
            : `<div class="artifact-row"><strong>${currentVersions} ${escapeHtml(state.lang !== 'en' ? 'versiones o artefactos' : 'versions or artifacts')}</strong><small>${escapeHtml(t('autosaved'))}</small></div>`;
        return `<section class="panel"><div class="panel-header"><div><h2>${escapeHtml(t('evidence'))}</h2><p>${escapeHtml(state.lang !== 'en' ? 'Hechos, no reflexión escrita por IA' : 'Facts, not AI-written reflection')}</p></div></div><div class="panel-body artifact-list">${concept === 'integrated' ? `<div class="artifact-row"><strong>${moveNoteCount} ${escapeHtml(state.lang === 'en' ? 'Move notes with content' : 'notas de Movidas con contenido')}</strong><small>${escapeHtml(state.lang === 'en' ? 'Navigation never counts as evidence.' : 'La navegación nunca cuenta como evidencia.')}</small></div>` : ''}${concept === 'integrated' && state.genre === 'autobiographical' ? `<div class="artifact-row"><strong>${state.protectedPhrases.length} ${escapeHtml(state.lang === 'en' ? 'student-protected voice phrases' : 'frases de voz protegidas por el estudiante')}</strong><small>${escapeHtml(state.lang === 'en' ? 'Exact text only; no understanding is inferred.' : 'Solo texto exacto; no se infiere comprensión.')}</small></div>` : ''}${versionEvidence}<div class="artifact-row"><strong>${state.decisions.length} ${escapeHtml(state.lang !== 'en' ? 'decisiones' : 'decisions')}</strong><small>${escapeHtml(state.decisions.length ? `${state.decisions.map(d => d.choice).join(', ')}${concept === 'integrated' ? ` · ${rationaleCount} ${state.lang === 'en' ? 'student reasons' : 'razones estudiantiles'}` : ''}` : t('noPrior'))}</small></div><div class="artifact-row"><strong>${state.councilRuns.length} ${escapeHtml(state.lang !== 'en' ? 'Consejos' : 'Council runs')}</strong><small>${escapeHtml(state.councilRuns.length ? t('revisit') : t('noPrior'))}</small></div><button class="button secondary" data-action="reflection">${escapeHtml(t('reflection'))}</button></div></section>`;
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

    function checkpointVersion(reason = 'writing checkpoint') {
        const text = getDraft();
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
        editorCaret = end;
        captured = { text, paragraph: editor.value.slice(beforeBreak, afterBreak), full: editor.value, start, end, hasSelection: true, capturedAt: new Date().toISOString() };
        updatePassageBar();
        announce(`${t('captured')}: ${text.slice(0, 80)}`);
    }

    function renderPassageBar() {
        const protectAction = concept === 'integrated' && state?.genre === 'autobiographical'
            ? `<button class="button ghost protect-phrase" data-action="protect-phrase">${escapeHtml(state.lang === 'en' ? 'Protect phrase' : 'Proteger frase')}</button>`
            : '';
        return `<section id="passageBar" class="passage-bar" ${captured?.hasSelection ? '' : 'hidden'} aria-label="${escapeHtml(t('captured'))}"><div class="passage-copy"><strong>${escapeHtml(t('captured'))}</strong><span id="passageExcerpt">${escapeHtml(captured?.text || '')}</span></div>${protectAction}<button class="button secondary" data-action="passage-review">${escapeHtml(t('reviewPassage'))}</button><button class="icon-button" data-action="clear-passage" aria-label="${escapeHtml(t('clear'))}">×</button></section>`;
    }

    function protectCapturedPhrase() {
        if (!captured?.text?.trim() || concept !== 'integrated' || state.genre !== 'autobiographical') return;
        const normalized = captured.text.trim();
        if (!state.protectedPhrases.some(item => item.text === normalized)) {
            state.protectedPhrases.push({ text: normalized, protectedAt: new Date().toISOString(), genre: state.genre, studentAuthored: true });
            saveState(state.lang === 'en' ? 'Exact phrase protected.' : 'Frase exacta protegida.');
        } else {
            announce(state.lang === 'en' ? 'That exact phrase is already protected.' : 'Esa frase exacta ya está protegida.');
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
        dialogRoot.innerHTML = '';
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
        lastFocus = null;
        dialogGuard = null;
    }

    function closeDialog(force = false, afterClose = null) {
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

    function openPasteDialog() {
        const sample = currentGenre().sample;
        openDialog(t('paste'), t('pasteWarning'), `<div class="field"><label for="pasteDraft">${escapeHtml(t('currentDraft'))}</label><textarea id="pasteDraft" data-protect-dirty spellcheck="${spellcheckEnabled()}">${escapeHtml(sample)}</textarea></div><p class="exact-preview" id="pastePreview">${escapeHtml(sample)}</p>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="replace-draft">${escapeHtml(t('replaceDraft'))}</button>`);
    }

    function useSample() {
        if (getDraft()) checkpointVersion('before sample replacement');
        setDraft(currentGenre().sample);
        if (concept === 'journey') state.currentArtifact = `step-${state.step}`;
        saveState(); renderApp();
        announce(t('saved'));
    }

    function notebookSample(card) {
        const examples = {
            admissions: {
                anecdote: 'Synthetic note: A student realizes during a neighborhood workshop that listening matters more than making the fastest form.',
                connection: 'Synthetic note: The moment changes the student’s definition of useful technology—from efficient to accountable.',
                'central-idea': 'Synthetic note: Responsible design begins by listening to the people who will live with the result.',
                context: 'Synthetic context to verify: community learning centers often help families navigate unfamiliar enrollment systems.',
                outline: 'Possible order only: concrete workshop moment → mistaken assumption → listening → changed direction → future questions.',
            },
            stem: {
                context: 'Synthetic note: Compare basil seedling growth under four and eight hours of light while other conditions stay controlled.',
                hypothesis: 'Synthetic hypothesis: seedlings receiving eight hours of light will show greater mean stem growth.',
                methods: 'Synthetic plan: equal soil, water, seed type, and measurement schedule; randomize tray position.',
                data: 'Synthetic data note: the eight-hour group averaged 2.4 cm more growth; one unusually tall seedling may affect the mean.',
                analysis: 'Synthetic plan: compare group means, report sample size, and discuss the outlier and need for a second trial.',
            },
            sop: {
                program: 'Synthetic note: identify a human-centered computing program with participatory-design faculty and public-sector partnerships.',
                trajectory: 'Synthetic note: transit accessibility work shifted the student from routing efficiency toward participatory design.',
                evidence: 'Synthetic evidence: accessibility audit, community interviews, and an undergraduate research methods course.',
                fit: 'Synthetic note: connect questions about public technology to specific faculty methods without prestige claims.',
                outline: 'Possible order only: research problem → prior preparation → future questions → specific program fit → contribution.',
            },
            neutral: {
                purpose: 'Synthetic note: help a reader understand one evidence-based position and its practical consequence.',
                audience: 'Synthetic note: the audience knows the topic but needs the evidence and terms explained clearly.',
                evidence: 'Synthetic note: collect two observations, one credible source, and one counterexample.',
                structure: 'Possible order only: context → claim → evidence → complication → conclusion.',
            },
        };
        return examples[state.genre]?.[card.id] || `Synthetic planning note for ${card.en}.`;
    }

    function openPasteNotebookDialog() {
        const card = activeNotebookCard();
        const current = state.notebookEntries[notebookEntryKey(card)]?.text || notebookSample(card);
        openDialog(t('pasteNotebook'), t('pasteWarning'), `<div class="field"><label for="pasteNotebookText">${escapeHtml(`${t('notebook')}: ${notebookCardLabel(card)}`)}</label><textarea id="pasteNotebookText" data-protect-dirty spellcheck="${spellcheckEnabled()}">${escapeHtml(current)}</textarea></div><p>${escapeHtml(t('authorshipBoundary'))}</p><div class="exact-preview" id="pasteNotebookPreview">${escapeHtml(current)}</div>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="save-notebook-paste">${escapeHtml(t('saveCard'))}</button>`);
    }

    function saveNotebookPaste() {
        const card = activeNotebookCard();
        state.notebookEntries[notebookEntryKey(card)] = { text: document.getElementById('pasteNotebookText')?.value || '', updatedAt: new Date().toISOString(), provenance: 'student-imported-synthetic' };
        saveState(t('notebookSaved')); closeDialog(true); renderApp();
    }

    function useNotebookSample() {
        const card = activeNotebookCard();
        state.notebookEntries[notebookEntryKey(card)] = { text: notebookSample(card), updatedAt: new Date().toISOString(), provenance: 'synthetic-sample' };
        saveState(t('notebookSaved')); renderApp();
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

    function openIntegratedMoveNote(index) {
        const move = integratedMoves()[index];
        if (!move) return;
        const existing = state.moveNotes[moveNoteKey(move)]?.text || '';
        openDialog(integratedMoveLabel(move), integratedMoveWhy(move), `<div class="field"><label for="integratedMoveNote">${escapeHtml(t('planningNotes'))}</label><textarea id="integratedMoveNote" data-protect-dirty spellcheck="${spellcheckEnabled()}" placeholder="${escapeHtml(integratedMovePrompt(move))}">${escapeHtml(existing)}</textarea></div><p class="boundary-note"><strong>${escapeHtml(state.lang === 'en' ? 'Reference only.' : 'Solo referencia.')}</strong> ${escapeHtml(state.lang === 'en' ? 'This note never transfers into or changes the canonical draft. You may write a fragment, question, quotation, observation, outline point, or evidence.' : 'Esta nota nunca se transfiere ni cambia el borrador canónico. Puedes escribir un fragmento, pregunta, cita, observación, punto de esquema o evidencia.')}</p>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="save-integrated-note" data-move="${index}">${escapeHtml(t('saveReturn'))}</button>`);
    }

    function saveIntegratedMoveNote(index) {
        const move = integratedMoves()[index];
        if (!move) return;
        const text = document.getElementById('integratedMoveNote')?.value || '';
        state.moveNotes[moveNoteKey(move)] = { text, updatedAt: new Date().toISOString(), provenance: 'student', genre: state.genre, moveId: move.id };
        saveState(text.trim() ? (state.lang === 'en' ? 'Planning note saved locally.' : 'Nota de planificación guardada localmente.') : t('saved'));
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

    function openScopeDialog(kind, title, subtitle) {
        const scopes = [];
        if (captured?.hasSelection && captured.text?.trim()) scopes.push(['selected', t('selectedScope'), captured.text]);
        if (captured?.paragraph?.trim()) scopes.push(['paragraph', t('paragraphScope'), captured.paragraph]);
        if (captured?.full?.trim()) scopes.push(['full', t('fullScope'), captured.full]);
        const defaultScope = scopes[0]?.[0] || 'full';
        const facts = concept === 'integrated' ? renderIntegratedTransmissionFacts(kind) : '';
        const scopeHint = captured?.hasSelection ? '' : `<p class="scope-hint">${escapeHtml(state.lang === 'en' ? 'No passage is selected. Select words in the draft to add a passage option.' : 'No hay un pasaje seleccionado. Selecciona palabras del borrador para añadir esa opción.')}</p>`;
        openDialog(title, subtitle, `${facts}${scopeHint}<div class="scope-grid" role="radiogroup" aria-label="Review scope">${scopes.map(([id, label, text]) => `<label class="scope-choice"><input type="radio" name="reviewScope" value="${id}" ${id === defaultScope ? 'checked' : ''}><strong>${escapeHtml(label)}</strong><span>${wordCount(text)} ${escapeHtml(state.lang !== 'en' ? 'palabras' : 'words')}</span></label>`).join('')}</div><div class="field" style="margin-top:17px"><label>${escapeHtml(t('exactPreview'))}</label><div class="exact-preview" id="scopePreview">${escapeHtml(scopeText(defaultScope))}</div></div>${kind === 'focused' ? renderLensChoices() : ''}<label class="consent-box"><input id="transmitConsent" type="checkbox"><span><strong>${escapeHtml(t('consent'))}</strong><br>${escapeHtml(t('noNetwork'))}</span></label>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="submit-mock" data-kind="${kind}" disabled>${escapeHtml(kind === 'focused' ? t('sendReview') : t('sendCoach'))}</button>`);
    }

    function renderIntegratedTransmissionFacts(kind) {
        const purpose = kind === 'focused'
            ? (state.lang === 'en' ? 'Apply one chosen genre-aware review lens.' : 'Aplicar una lente de revisión elegida y apropiada al género.')
            : (state.lang === 'en' ? 'Ask for one strength and one revision question about the chosen scope.' : 'Pedir una fortaleza y una pregunta de revisión sobre el alcance elegido.');
        const reviewer = kind === 'focused'
            ? (state.lang === 'en' ? 'One mock genre-focused reviewer' : 'Un revisor simulado enfocado en el género')
            : (state.lang === 'en' ? 'Tu Pana mock writing coach' : 'Coach de escritura simulado Tu Pana');
        return `<section class="transmission-facts" aria-label="AI request facts"><dl><div><dt>${escapeHtml(t('purpose'))}</dt><dd>${escapeHtml(purpose)}</dd></div><div><dt>${escapeHtml(t('reviewer'))}</dt><dd>${escapeHtml(reviewer)}</dd></div><div><dt>${escapeHtml(t('calls'))}</dt><dd>1</dd></div></dl><p><strong>${escapeHtml(t('decisionMaker'))}</strong></p></section>`;
    }

    function renderLensChoices() {
        return `<fieldset class="field"><legend>${escapeHtml(state.lang === 'en' ? 'Review lens' : 'Lente de revisión')}</legend><div class="choice-stack">${genreMoves('review').map((lens, i) => `<label class="radio-card"><input type="radio" name="reviewLens" value="${escapeHtml(lens)}" ${i === 0 ? 'checked' : ''}><span>${escapeHtml(lens)}</span></label>`).join('')}</div></fieldset>`;
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
        const lens = kind === 'focused' ? dialogRoot.querySelector('input[name="reviewLens"]:checked')?.value : (state.lang !== 'en' ? 'Pregunta del estudiante' : 'Student question');
        button.disabled = true;
        button.textContent = state.lang !== 'en' ? 'Leyendo localmente…' : 'Reading locally…';
        window.setTimeout(() => {
            const genre = currentGenre();
            const suggestion = mockSuggestion(kind, lens, text);
            const snapshotId = concept === 'notebook' || concept === 'integrated'
                ? checkpointVersion(kind === 'focused' ? 'before focused review' : 'before coach feedback')
                : null;
            const criticalKey = concept === 'integrated' ? integratedCriticalKey(kind, lens) : null;
            state.reviews.push({ id: `review-${Date.now()}`, type: kind, lens, scope, words: wordCount(text), exactExcerpt: text.slice(0, 180), suggestion, createdAt: new Date().toISOString(), mock: true, purpose: kind === 'focused' ? 'genre-focused review' : 'writing coach question', reviewer: kind === 'focused' ? 'mock genre-focused reviewer' : 'Tu Pana mock coach', calls: 1, criticalKey, criticalPrompt: criticalKey ? criticalQuestion(criticalKey).en : null, criticalContext: criticalKey ? criticalRiskText(criticalKey) : null, draftSignature: `${getDraft().length}:${getDraft().slice(0, 24)}`, snapshotId, genre: state.genre, genreLabel: genre.label.en, genreLabelEs: genre.label.es });
            saveState(); closeDialog(true); renderApp(); reviewTab = 'history'; openReviewCenter();
        }, 260);
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
        if (concept === 'integrated' && state.genre === 'stem') {
            openDialog(t('council'), state.lang === 'en' ? 'Explicit profile boundary' : 'Límite explícito del perfil', `<p>${escapeHtml(t('councilUnavailable'))}</p><p>${escapeHtml(state.lang === 'en' ? 'No mock Council calls are represented. Your draft remains unchanged.' : 'No se representa ninguna llamada simulada del Consejo. Tu borrador no cambia.')}</p>`, `<button class="button primary" data-action="close-dialog">${escapeHtml(t('cancel'))}</button>`);
            return;
        }
        if (state.councilRuns.length && !getDraft().trim()) return openReviewCenter('council');
        const draft = getDraft();
        if (!draft.trim()) return openCoachDialog();
        const roles = genreMoves('council');
        const councilFacts = concept === 'integrated' ? `<section class="transmission-facts"><dl><div><dt>${escapeHtml(t('purpose'))}</dt><dd>${escapeHtml(state.lang === 'en' ? 'Compare three genre-appropriate perspectives, then synthesize priorities.' : 'Comparar tres perspectivas apropiadas al género y sintetizar prioridades.')}</dd></div><div><dt>${escapeHtml(t('reviewer'))}</dt><dd>${escapeHtml(roles.join(' · '))}</dd></div><div><dt>${escapeHtml(t('calls'))}</dt><dd>${escapeHtml(state.lang === 'en' ? '3 reviewer calls + 1 synthesis' : '3 llamadas de revisión + 1 síntesis')}</dd></div></dl><p><strong>${escapeHtml(t('decisionMaker'))}</strong></p></section>` : '';
        openDialog(t('council'), state.lang !== 'en' ? 'Tres perspectivas configuradas para este género. Ninguna reemplaza tu decisión.' : 'Three genre-configured perspectives. None replaces your decision.', `${councilFacts}<div class="choice-stack">${roles.map(role => `<div class="radio-card"><span><strong>${escapeHtml(role)}</strong><br><small>${escapeHtml(state.lang !== 'en' ? 'Busca una fortaleza y una pregunta.' : 'Looks for one strength and one question.')}</small></span></div>`).join('')}</div><div class="field" style="margin-top:17px"><label>${escapeHtml(t('exactPreview'))}</label><div class="exact-preview">${escapeHtml(draft)}</div></div><label class="consent-box"><input id="transmitConsent" type="checkbox"><span><strong>${escapeHtml(t('consent'))}</strong><br>${escapeHtml(t('noNetwork'))}</span></label>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button><button class="button primary" data-action="run-council" disabled>${escapeHtml(t('convene'))}</button>`);
    }

    function runCouncil(button) {
        button.disabled = true;
        const snapshotId = concept === 'notebook' || concept === 'integrated' ? checkpointVersion('before Council review') : null;
        const roles = genreMoves('council');
        const genre = currentGenre();
        const run = {
            id: `council-${Date.now()}`, createdAt: new Date().toISOString(), genre: state.genre,
            genreLabel: genre.label.en, genreLabelEs: genre.label.es, roles: [...roles], payloadScope: 'full', snapshotId,
            words: wordCount(getDraft()), signature: `${getDraft().length}:${getDraft().slice(0, 24)}`,
            findings: roles.map((role, index) => ({ role, suggestion: councilSuggestion(index) })), mock: true,
            calls: concept === 'integrated' ? 4 : undefined,
            criticalKey: concept === 'integrated' ? integratedCriticalKey('council') : null,
            criticalPrompt: concept === 'integrated' ? criticalQuestion(integratedCriticalKey('council')).en : null,
            criticalContext: concept === 'integrated' ? criticalRiskText(integratedCriticalKey('council')) : null,
            draftSignature: `${getDraft().length}:${getDraft().slice(0, 24)}`,
        };
        state.councilRuns.push(run);
        saveState(); closeDialog(true); renderApp(); reviewTab = 'council'; openReviewCenter();
    }

    function councilSuggestion(index) {
        const review = genreMoves('review')[index] || genreMoves('review')[0];
        return state.lang !== 'en' ? `Observa una base sólida en ${review}. Pregunta dónde una evidencia más precisa apoyaría la decisión del lector.` : `Sees a sound foundation in ${review}. Asks where more precise evidence would support the reader’s judgment.`;
    }

    function openReviewCenter(tab = reviewTab) {
        if (concept === 'notebook' && !state.draftDeclared) {
            announce(t('draftToolsLocked'));
            return;
        }
        reviewTab = tab;
        openDialog(t('reviewCenter'), state.lang !== 'en' ? 'Pide, escucha, decide, revisa y verifica.' : 'Ask, hear, decide, revise, and verify.', `<div class="review-layout"><nav class="review-nav" aria-label="Review sections"><button data-action="review-tab" data-tab="history" ${tab === 'history' ? 'aria-current="page"' : ''}>${escapeHtml(t('focusedReview'))} (${state.reviews.length})</button><button data-action="review-tab" data-tab="council" ${tab === 'council' ? 'aria-current="page"' : ''}>${escapeHtml(t('council'))} (${state.councilRuns.length})</button><button data-action="review-tab" data-tab="decisions" ${tab === 'decisions' ? 'aria-current="page"' : ''}>${escapeHtml(state.lang !== 'en' ? 'Decisiones' : 'Decisions')} (${state.decisions.length})</button></nav><section class="review-feed" id="reviewFeed">${renderReviewFeed(tab)}</section></div>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(state.lang !== 'en' ? 'Volver al borrador' : 'Return to draft')}</button>`, { wide: true });
    }

    function renderReviewFeed(tab) {
        if (tab === 'history') {
            if (!state.reviews.length) return `<div class="empty-state">${escapeHtml(t('noReviews'))}<br><button class="button secondary" data-action="focused-review" style="margin-top:12px">${escapeHtml(t('sendReview'))}</button></div>`;
            return state.reviews.slice().reverse().map(review => renderReviewCard(review)).join('');
        }
        if (tab === 'council') {
            if (!state.councilRuns.length) return `<div class="empty-state">${escapeHtml(t('noReviews'))}<br><button class="button secondary" data-action="council" style="margin-top:12px">${escapeHtml(t('convene'))}</button></div>`;
            const reports = state.councilRuns.slice().reverse().map(run => `<article class="review-card"><span class="mock-label">Mock Council · ${escapeHtml(storedGenreLabel(run))}</span><h3>${escapeHtml(t('council'))}</h3><p class="review-meta">${shortDate(run.createdAt)} · ${escapeHtml(run.payloadScope || (state.lang === 'en' ? 'scope not stored' : 'alcance no guardado'))} · ${run.words} ${escapeHtml(state.lang === 'en' ? 'words reviewed' : 'palabras revisadas')}${concept === 'integrated' ? ` · ${escapeHtml(run.calls ? `${run.calls} ${state.lang === 'en' ? 'mock calls represented' : 'llamadas simuladas representadas'}` : (state.lang === 'en' ? 'mock call count not stored' : 'cantidad de llamadas simuladas no guardada'))}` : ''}</p>${renderSnapshotLink(run.snapshotId, 'council')}${concept === 'integrated' ? renderCriticalPrompt(run.criticalKey, run.genre) : ''}${run.findings.map((finding, index) => `<blockquote><strong>${escapeHtml(finding.role)}</strong><br>${escapeHtml(finding.suggestion)}</blockquote>${decisionButtons(run.id, index, finding.suggestion, run.criticalKey)}`).join('')}</article>`).join('');
            return `${reports}${concept === 'integrated' ? `<div class="review-secondary-action"><button class="button secondary" data-action="convene-again">${escapeHtml(state.lang === 'en' ? 'Convene again' : 'Convocar de nuevo')}</button><small>${escapeHtml(state.lang === 'en' ? 'Creates a new mock Council report after a separate consent step.' : 'Crea un nuevo informe simulado después de un consentimiento separado.')}</small></div>` : ''}`;
        }
        if (!state.decisions.length) return `<div class="empty-state">${escapeHtml(state.lang !== 'en' ? 'Todavía no has decidido sobre una sugerencia.' : 'You have not decided on a suggestion yet.')}</div>`;
        return state.decisions.slice().reverse().map(decision => `<article class="review-card"><h3>${escapeHtml(decision.choiceLabel)}</h3><p class="review-meta">${shortDate(decision.createdAt)} · ${escapeHtml(decision.sourceType)}${decision.payloadScope ? ` · ${escapeHtml(decision.payloadScope)}` : ''}</p>${renderSnapshotLink(decision.relatedVersionId, 'decisions')}<blockquote>${escapeHtml(decision.suggestion)}</blockquote>${decision.criticalPrompt ? `<p><strong>${escapeHtml(state.lang === 'en' ? 'Critical prompt' : 'Pregunta crítica')}:</strong> ${escapeHtml(criticalQuestionText(decision.criticalKey))}</p>` : ''}${decision.rationale ? `<p><strong>${escapeHtml(state.lang === 'en' ? 'Student reason' : 'Razón estudiantil')}:</strong> ${escapeHtml(decision.rationale)}</p>` : ''}<p>${escapeHtml(t('decisionRecorded'))}</p></article>`).join('');
    }

    function renderReviewCard(review) {
        return `<article class="review-card"><span class="mock-label">Mock AI · ${escapeHtml(storedGenreLabel(review))} · ${escapeHtml(review.scope || (state.lang === 'en' ? 'scope not stored' : 'alcance no guardado'))}</span><h3>${escapeHtml(review.lens)}</h3><p class="review-meta">${shortDate(review.createdAt)} · ${review.words} ${escapeHtml(state.lang !== 'en' ? 'palabras compartidas' : 'words shared')}${concept === 'integrated' ? ` · ${escapeHtml(review.calls ? `${review.calls} ${state.lang === 'en' ? 'mock call' : 'llamada simulada'}` : (state.lang === 'en' ? 'mock call count not stored' : 'cantidad de llamadas simuladas no guardada'))}` : ''}</p>${renderSnapshotLink(review.snapshotId, 'history')}<blockquote>${escapeHtml(review.exactExcerpt)}</blockquote><p>${escapeHtml(review.suggestion)}</p>${concept === 'integrated' ? renderCriticalPrompt(review.criticalKey, review.genre) : ''}${decisionButtons(review.id, 0, review.suggestion, review.criticalKey)}</article>`;
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
                    : (state.lang === 'en' ? 'Earlier prototype record: text was not stored, so this is not a recoverable snapshot.' : 'Registro anterior del prototipo: no se guardó el texto, así que no es una instantánea recuperable.');
                return `<article class="artifact-row version-row"><strong>${escapeHtml(title)} · ${version.words ?? 0} ${escapeHtml(state.lang === 'en' ? 'words' : 'palabras')}</strong><small>${escapeHtml(versionTimestamp(version))} · ${escapeHtml(version.reason || (state.lang === 'en' ? 'reason not stored' : 'motivo no guardado'))}</small><p>${escapeHtml(note)}</p><button class="text-button" data-action="view-snapshot" data-snapshot="${escapeHtml(version.id)}" data-return-tab="versions">${escapeHtml(recoverable ? (state.lang === 'en' ? 'Inspect exact text' : 'Inspeccionar texto exacto') : (state.lang === 'en' ? 'Inspect checkpoint facts' : 'Inspeccionar datos del punto'))}</button></article>`;
            }).join('')}</div>`
            : `<div class="empty-state">${escapeHtml(state.lang === 'en' ? 'No draft checkpoints yet. A recoverable snapshot is created before mock review, Council, replacement, reflection, or Finish.' : 'Todavía no hay puntos del borrador. Se crea una instantánea recuperable antes de revisión simulada, Consejo, reemplazo, reflexión o Finalizar.')}</div>`;
        openDialog(state.lang === 'en' ? 'Draft history' : 'Historial del borrador', state.lang === 'en' ? 'Read-only local prototype history. Viewing never replaces the current draft.' : 'Historial local de solo lectura. Verlo nunca reemplaza el borrador actual.', body, `<button class="button ghost" data-action="close-dialog">${escapeHtml(state.lang === 'en' ? 'Return to draft' : 'Volver al borrador')}</button>`, { wide: true });
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
            : `${facts}<p class="checkpoint-note">${escapeHtml(state.lang === 'en' ? 'Text was not stored in this earlier synthetic record. This checkpoint cannot be viewed or recovered and is not called a snapshot.' : 'El texto no se guardó en este registro sintético anterior. Este punto no se puede ver ni recuperar y no se llama instantánea.')}</p>`;
        const backAction = returnTab === 'versions'
            ? `<button class="button ghost" data-action="version-history">${escapeHtml(state.lang === 'en' ? 'Back to draft history' : 'Volver al historial')}</button>`
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
            if (state.genre === 'autobiographical' && state.protectedPhrases.length) items.push(`${state.protectedPhrases.length} ${state.lang !== 'en' ? 'frases exactas protegidas por el estudiante' : 'exact phrases protected by the student'}`);
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
        const knowledge = concept === 'integrated' && state.genre === 'stem'
            ? (state.lang !== 'en' ? '¿Qué conocimiento disciplinario, datos u observaciones dieron forma a este trabajo?' : 'What disciplinary knowledge, data, or observations shaped this work?')
            : concept === 'integrated' && state.genre === 'autobiographical'
                ? (state.lang !== 'en' ? 'Si decidiste usarlo, ¿qué conocimiento cultural, lingüístico, familiar, comunitario, histórico o vivido dio forma a este trabajo?' : 'If you chose to use it, what cultural, linguistic, family, community, historical, or experiential knowledge shaped this work?')
            : t('prompt4');
        return [
            ['changed', t('prompt1'), false], ['decision', t('prompt2'), false], ['voice', t('prompt3'), false], ['knowledge', knowledge, true],
        ];
    }

    function renderReflectionPage() {
        const prompts = reflectionPrompts();
        const complete = ['changed', 'decision', 'voice'].filter(key => state.reflections[key].trim()).length;
        return `<section class="finish-page" aria-labelledby="reflectionTitle"><div class="finish-hero"><p class="eyebrow">${escapeHtml(t('whereDesk'))}</p><h2 id="reflectionTitle">${escapeHtml(t('reflection'))}</h2><p>${escapeHtml(t('reflectionWhy'))}</p><strong>${complete}/3 ${escapeHtml(state.lang !== 'en' ? 'respuestas requeridas guardadas' : 'required responses saved')}</strong></div>
            <section class="panel"><div class="panel-body"><div class="reflection-intro"><strong>${escapeHtml(t('reflectionEvidence'))}</strong><div class="evidence-chips">${factualEvidence().length ? factualEvidence().map(item => `<span class="evidence-chip">${escapeHtml(item)}</span>`).join('') : `<span class="evidence-chip">${escapeHtml(state.lang !== 'en' ? 'La evidencia aparecerá al trabajar.' : 'Evidence will appear as you work.')}</span>`}</div></div>
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

    function renderFinishPage() {
        const draft = markedDraft();
        const ready = Boolean(draft.trim()) && reflectionComplete();
        const packetReady = Boolean(state.packetCreatedAt);
        return `<section class="finish-page" aria-labelledby="finishTitle"><div class="finish-hero"><p class="eyebrow">${escapeHtml(t('finish'))}</p><h2 id="finishTitle">${escapeHtml(t('preparePacket'))}</h2><p>${escapeHtml(state.lang !== 'en' ? 'Guardar mantiene tu trabajo en progreso. Finalizar confirma una versión y arma un paquete local. Entregar ocurre fuera de este prototipo, según las instrucciones de tu instructor.' : 'Save keeps work in progress. Finish confirms one version and assembles a local packet. Submission happens outside this prototype, according to your instructor’s directions.')}</p></div>
            <div class="finish-grid"><section class="packet-section"><h3>${escapeHtml(t('packetDraft'))}</h3><p>${wordCount(draft)} ${escapeHtml(state.lang !== 'en' ? 'palabras' : 'words')} · ${escapeHtml(concept === 'journey' ? state.currentArtifact : t('currentDraft'))}</p><div class="packet-preview" id="finalDraftPreview">${escapeHtml(draft || (state.lang !== 'en' ? 'No hay borrador todavía.' : 'No draft yet.'))}</div><label class="consent-box" style="margin-top:12px"><input id="packetConfirm" type="checkbox" ${state.packetCreatedAt ? 'checked' : ''}><span>${escapeHtml(t('confirmDraft'))}</span></label></section>
            <section class="packet-section"><h3>${escapeHtml(state.lang !== 'en' ? 'Comprobación honesta' : 'Truthful readiness check')}</h3><ul class="check-list"><li class="${draft.trim() ? 'done' : ''}">${escapeHtml(state.lang !== 'en' ? 'Una versión exacta está identificada' : 'One exact version is identified')}</li><li class="${reflectionComplete() ? 'done' : ''}">${escapeHtml(state.lang !== 'en' ? 'Tres respuestas contienen texto' : 'Three student-authored responses contain text')}</li><li class="${concept === 'integrated' || state.councilRuns.length ? 'done' : ''}">${escapeHtml(concept === 'integrated' && !state.councilRuns.length ? (state.lang !== 'en' ? 'No se solicitó Consejo—es opcional' : 'No Council requested—optional') : (state.lang !== 'en' ? 'La evidencia del Consejo está incluida si existe' : 'Council evidence is included when it exists'))}</li><li class="${concept === 'integrated' || state.decisions.length ? 'done' : ''}">${escapeHtml(concept === 'integrated' && !state.decisions.length ? (state.lang !== 'en' ? 'No hubo decisiones de IA—la IA es opcional' : 'No AI decisions—AI is optional') : (state.lang !== 'en' ? 'Las decisiones sobre sugerencias están incluidas' : 'Suggestion decisions are included'))}</li></ul><p><strong>${escapeHtml(ready ? (state.lang !== 'en' ? 'Listo para crear el paquete local' : 'Ready to create the local packet') : (state.lang !== 'en' ? 'Todavía en progreso' : 'Still in progress'))}</strong></p><button class="button primary" data-action="create-packet" ${!ready ? 'disabled' : ''}>${escapeHtml(t('createPacket'))}</button></section></div>
            <div class="finish-grid"><section class="packet-section"><h3>${escapeHtml(t('studentReflection'))}</h3><p>${escapeHtml(state.lang !== 'en' ? 'Solo contiene las palabras del estudiante.' : 'Contains only the student’s words.')}</p>${reflectionPrompts().map(([key, label], i) => state.reflections[key] ? `<h4>${i + 1}. ${escapeHtml(label)}</h4><p>${escapeHtml(state.reflections[key])}</p>` : '').join('') || `<p>${escapeHtml(state.lang !== 'en' ? 'Todavía no hay reflexión.' : 'No reflection yet.')}</p>`}</section>
            <section class="packet-section"><h3>${escapeHtml(t('instructorAppendix'))}</h3><p>${escapeHtml(state.lang !== 'en' ? 'Evidencia factual del sistema, separada de la reflexión.' : 'Factual system evidence, separate from reflection.')}</p><ul class="check-list">${factualEvidence().map(item => `<li class="done">${escapeHtml(item)}</li>`).join('') || `<li>${escapeHtml(t('noPrior'))}</li>`}</ul></section></div>${renderGenreFinishChecklist()}
            ${concept === 'notebook' || concept === 'integrated' ? `<section class="packet-section action-meanings"><h3>${escapeHtml(state.lang === 'en' ? 'Five different actions' : 'Cinco acciones distintas')}</h3><div class="artifact-list"><div class="artifact-row"><strong>${escapeHtml(state.lang === 'en' ? 'Save' : 'Guardar')}</strong><small>${escapeHtml(state.lang === 'en' ? 'Keeps exact work in this isolated browser.' : 'Mantiene el trabajo exacto en este navegador aislado.')}</small></div><div class="artifact-row"><strong>${escapeHtml(t('finish'))}</strong><small>${escapeHtml(state.lang === 'en' ? 'Confirms which draft and reflection belong in the packet.' : 'Confirma qué borrador y reflexión pertenecen al paquete.')}</small></div><div class="artifact-row"><strong>${escapeHtml(t('createPacket'))}</strong><small>${escapeHtml(state.lang === 'en' ? 'Assembles a local preview; it submits nothing.' : 'Arma una vista previa local; no entrega nada.')}</small></div><div class="artifact-row"><strong>${escapeHtml(state.lang === 'en' ? 'Backup' : 'Copia de seguridad')}</strong><small>${escapeHtml(state.lang === 'en' ? 'Downloads this concept’s isolated synthetic state.' : 'Descarga el estado sintético aislado de este concepto.')}</small></div><div class="artifact-row"><strong>${escapeHtml(state.lang === 'en' ? 'External Submit' : 'Entrega externa')}</strong><small>${escapeHtml(state.lang === 'en' ? 'Happens outside Tu Pana under instructor directions.' : 'Ocurre fuera de Tu Pana según las instrucciones del instructor.')}</small></div></div><button class="button secondary" data-action="export-state">${escapeHtml(t('export'))}</button></section>` : ''}
            ${packetReady ? `<section class="packet-section"><h3>${escapeHtml(t('packetReady'))}</h3><button class="button primary" data-action="download-packet">${escapeHtml(t('downloadPacket'))}</button></section>` : ''}
            <footer class="editor-footer"><button class="button ghost" data-action="reflection">← ${escapeHtml(t('reflection'))}</button><button class="button secondary" data-action="return-write">${escapeHtml(state.lang !== 'en' ? 'Volver al borrador' : 'Return to draft')}</button></footer></section>`;
    }

    function packetText() {
        const lines = [
            'TU PANA WRITING STUDIO — LOCAL EXPLORATION PACKET',
            `Concept: ${conceptMeta[concept].name}`,
            `Genre: ${currentGenre().label.en}`,
            `Created: ${new Date().toISOString()}`,
            '', 'CURRENT DRAFT', markedDraft(), '', 'STUDENT REFLECTION',
            `1. ${copy.en.prompt1}\n${state.reflections.changed}`,
            `2. ${copy.en.prompt2}\n${state.reflections.decision}`,
            `3. ${copy.en.prompt3}\n${state.reflections.voice}`,
        ];
        if (state.reflections.knowledge) {
            const knowledgePrompt = concept === 'integrated' && state.genre === 'stem'
                ? 'What disciplinary knowledge, data, or observations shaped this work?'
                : concept === 'integrated' && state.genre === 'autobiographical'
                    ? 'If you chose to use it, what cultural, linguistic, family, community, historical, or experiential knowledge shaped this work?'
                : copy.en.prompt4;
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

    function focusDecisionText() {
        if (concept === 'desk') return state.lang !== 'en' ? 'Sí. El Escritorio ofrece Enfoque en móvil porque una sola área de escritura sigue visible; Salir y la barra de pasaje permanecen dentro del viewport.' : 'Yes. The Desk offers mobile Focus because one writing surface stays visible; Exit and the passage bar remain inside the viewport.';
        if (concept === 'integrated') return state.lang !== 'en' ? 'Sí. El Escritorio Integrado conserva Enfoque porque hay un solo borrador canónico. Salir y la bandeja de pasaje permanecen dentro del viewport; las notas vuelven al salir.' : 'Yes. Integrated Desk keeps Focus because there is one canonical draft. Exit and the Passage Tray remain inside the viewport; planning notes return when Focus closes.';
        if (concept === 'journey') return state.lang !== 'en' ? 'No en móvil. Ocultar los diez pasos debilitaría orientación y verdad sobre versiones; el editor móvil ya recibe prioridad.' : 'No on mobile. Hiding ten steps would weaken orientation and version truth; the mobile editor already gets priority.';
        if (concept === 'hybrid') return state.lang !== 'en' ? 'No hay modo Enfoque separado. El híbrido reduce el recorrido a cuatro fases y trata el espacio móvil normal como la vista enfocada.' : 'No separate Focus mode. The hybrid reduces the journey to four phases and treats its normal mobile workspace as the focused view.';
        return state.lang !== 'en' ? 'No hay modo Enfoque separado. En móvil, el borrador recibe prioridad y Cuaderno queda como pestaña estable de una acción; no se comprime la vista dividida de escritorio.' : 'No separate Focus mode. On mobile, the draft gets priority and Notebook remains a stable one-action tab; the desktop split view is not compressed.';
    }

    function openSettings() {
        const integratedSettings = concept === 'integrated' ? `<section class="packet-section settings-section"><h3>${escapeHtml(state.lang === 'en' ? 'Writing project' : 'Proyecto de escritura')}</h3><p>${escapeHtml(state.lang === 'en' ? 'This local control supports honest prototype comparison. A production assignment may set the genre through its link.' : 'Este control local permite una comparación honesta del prototipo. Una tarea de producción podría definir el género mediante su enlace.')}</p><label class="field" for="settingsGenre"><span>${escapeHtml(t('genre'))}</span><select id="settingsGenre" class="settings-select" data-action="genre" aria-label="${escapeHtml(t('genre'))}">${genreOptionsMarkup()}</select></label></section><section class="packet-section settings-section"><h3>${escapeHtml(state.lang === 'en' ? 'Writing utilities' : 'Utilidades de escritura')}</h3><label class="check-line"><input type="checkbox" data-action="native-spellcheck" ${spellcheckEnabled() ? 'checked' : ''}> <span>${escapeHtml(state.lang === 'en' ? 'Native spelling suggestions' : 'Sugerencias ortográficas nativas')}</span></label><p>${escapeHtml(state.lang === 'en' ? 'Spelling suggestions come from your browser or device. Tu Pana does not send your writing for this feature.' : 'Las sugerencias ortográficas provienen de tu navegador o dispositivo. Tu Pana no envía tu escritura para esta función.')}</p></section>` : '';
        openDialog(t('settingsTitle'), conceptMeta[concept].name, `<p>${escapeHtml(t('storageNote'))}</p>${integratedSettings}<section class="packet-section"><h3>${escapeHtml(t('focusDecision'))}</h3><p>${escapeHtml(focusDecisionText())}</p></section><section class="danger-zone"><h3>${escapeHtml(t('danger'))}</h3><p>${escapeHtml(t('deleteExplain'))}</p><button class="button secondary" data-action="export-state">${escapeHtml(t('export'))}</button><div class="field" style="margin-top:15px"><label for="deleteConfirm">${escapeHtml(t('typeDelete'))}</label><input class="delete-confirm" id="deleteConfirm" type="text" autocomplete="off"></div><button class="button danger" data-action="delete-state" disabled>${escapeHtml(t('deleteNow'))}</button></section>`, `<button class="button ghost" data-action="close-dialog">${escapeHtml(t('cancel'))}</button>`);
    }

    function deletePrototypeState() {
        localStorage.removeItem(storageKey(concept));
        state = defaultState(concept);
        captured = null;
        closeDialog(true); renderApp();
        announce(state.lang !== 'en' ? 'Datos sintéticos borrados.' : 'Synthetic prototype data deleted.');
    }

    function handleAction(target) {
        const action = target.dataset.action;
        if (!action) return;
        if (action === 'settings') openSettings();
        else if (action === 'close-dialog') closeDialog();
        else if (action === 'overlay-close') closeDialog();
        else if (action === 'discard-dialog') discardDialogChanges();
        else if (action === 'keep-editing') keepEditingDialog();
        else if (action === 'knowledge-choice') { state.knowledgeChoice = target.dataset.choice === 'engage' ? 'engage' : 'skip'; state.knowledgeChoiceAt = new Date().toISOString(); state.onboardingSeenAt ||= state.knowledgeChoiceAt; saveState(); renderApp(); }
        else if (action === 'knowledge-reset') { state.knowledgeChoice = null; saveState(); renderApp(); }
        else if (action === 'integrated-move-note') openIntegratedMoveNote(Number(target.dataset.move));
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
        else if (action === 'notebook-sample') useNotebookSample();
        else if (action === 'notebook-coach') openNotebookCoachDialog();
        else if (action === 'submit-notebook-coach') submitNotebookCoach(target);
        else if (action === 'paste') openPasteDialog();
        else if (action === 'sample') useSample();
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
        else if (action === 'passage-review') openScopeDialog('coach', t('coach'), state.lang !== 'en' ? 'La selección ya está capturada aunque iOS la cierre.' : 'The selection is already captured even if iOS collapses it.');
        else if (action === 'protect-phrase') protectCapturedPhrase();
        else if (action === 'clear-passage') { captured = null; updatePassageBar(); document.getElementById('draftEditor')?.focus(); }
        else if (action === 'focused-review') closeDialog(false, openFocusedReviewDialog);
        else if (action === 'council' || action === 'convene-again') closeDialog(false, openCouncilDialog);
        else if (action === 'review-center') closeDialog(false, () => openReviewCenter());
        else if (action === 'submit-mock') submitMockReview(target.dataset.kind, target);
        else if (action === 'run-council') runCouncil(target);
        else if (action === 'review-tab') openReviewCenter(target.dataset.tab);
        else if (action === 'version-history') openVersionHistory();
        else if (action === 'view-snapshot') openSnapshotViewer(target.dataset.snapshot, target.dataset.returnTab || 'versions');
        else if (action === 'copy-snapshot') copySnapshotText(target.dataset.snapshot);
        else if (action === 'decision') recordDecision(target);
        else if (action === 'save-integrated-decision') saveIntegratedDecision();
        else if (action === 'reflection') { if (state.view === 'reflection') saveReflection(); setView('reflection'); }
        else if (action === 'save-reflection') saveReflection();
        else if (action === 'finish') { if (state.view === 'reflection') saveReflection(); if (concept === 'notebook' || concept === 'integrated') checkpointVersion('entered Finish'); setView('finish'); }
        else if (action === 'return-write') { if (concept === 'notebook' && state.draftDeclared) state.place = 'draft'; setView('write'); }
        else if (action === 'create-packet') createPacket();
        else if (action === 'download-packet') downloadText(packetText(), `tupana-${concept}-synthetic-packet.txt`);
        else if (action === 'export-state') downloadText(JSON.stringify({ window: WINDOW_ID, concept, exportedAt: new Date().toISOString(), state }, null, 2), `tupana-${concept}-prototype-backup.json`, 'application/json');
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
        if (target.matches('[data-action="language"]')) { state.lang = target.value; saveState(); renderApp(); }
        else if (target.matches('[data-action="genre"]')) {
            storeActiveGenreState();
            state.genre = genres[target.value] ? target.value : target.value;
            loadActiveGenreState(state.genre);
            captured = null;
            saveState();
            if (dialogRoot.contains(target)) closeDialog(true);
            renderApp();
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
        if (event.target.id === 'pasteDraft') { const preview = document.getElementById('pastePreview'); if (preview) preview.textContent = event.target.value; }
        if (event.target.id === 'pasteNotebookText') { const preview = document.getElementById('pasteNotebookPreview'); if (preview) preview.textContent = event.target.value; }
        if (event.target.id === 'deleteConfirm') { const button = dialogRoot.querySelector('[data-action="delete-state"]'); if (button) button.disabled = event.target.value !== 'DELETE'; }
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

    window.visualViewport?.addEventListener('resize', updateVisualViewport);
    window.visualViewport?.addEventListener('scroll', updateVisualViewport);
    window.addEventListener('resize', updateVisualViewport);
    window.addEventListener('beforeunload', () => saveState());

    if (concept) renderApp(); else renderLanding();
})();
