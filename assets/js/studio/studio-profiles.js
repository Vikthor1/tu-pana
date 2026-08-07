/*
 * Tu Pana Writing Studio — genre and assignment profile registry.
 * The pedagogical engine as data: every genre's Moves, review lenses, Council
 * configuration, contextual critical-AI question mapping, reflection prompt,
 * and stuck-support starter live here, translated from the legacy application
 * (assets/js/genre-template.js, assets/js/council.js, assets/js/prompts.js —
 * read-only sources at R0 1462aea) into the Integrated Desk interaction model.
 * Unknown assignment ids resolve to null and the interface stops loudly;
 * nothing inherits the autobiographical or General Writing profile silently.
 */
(function () {
    'use strict';

    const genres = {
        autobiographical: {
            label: { en: 'Mixed-genre autobiographical essay', es: 'Ensayo autobiográfico de género mixto' },
            // Rendered names (label above stays untouched for stored record provenance):
            fullName: { en: 'Mixed-Genre Autobiographical Essay', es: 'Ensayo autobiográfico de género mixto' },
            headerLabel: { en: 'Autobiographical Essay', es: 'Ensayo autobiográfico' },
            tourExample: {
                moveId: 'larger-force',
                excerpt: { en: 'At the library counter I answered in English until my aunt said, aquí escuchamos primero. I had treated translating as a small favor, not as something with a history behind it.', es: 'En el mostrador de la biblioteca respondí en inglés hasta que mi tía dijo: aquí escuchamos primero. Yo trataba la traducción como un favor pequeño, no como algo con una historia detrás.' },
                phrase: { en: 'aquí escuchamos primero', es: 'aquí escuchamos primero' },
                suggestion: { en: 'The moment is clear, but the reader cannot yet tell what larger question it opens. Consider naming the connection in your own words before expanding it.', es: 'El momento es claro, pero el lector todavía no sabe qué pregunta más amplia abre. Considera nombrar la conexión con tus propias palabras antes de desarrollarla.' },
                before: { en: 'I had treated translating as a small favor.', es: 'Yo trataba la traducción como un favor pequeño.' },
                after: { en: 'I had treated translating as a small favor, not as something with a history behind it.', es: 'Yo trataba la traducción como un favor pequeño, no como algo con una historia detrás.' },
            },
            // Guided Discovery: genre-owned conversational content. Humor here
            // stays on writing and revision — never on family, language,
            // community, or anything a student lived through.
            discovery: {
                openingQuip: {
                    en: 'Seventeen notebooks, four napkins, one voice memo. The draft can still be one thing.',
                    es: 'Diecisiete libretas, cuatro servilletas y una nota de voz. El borrador todavía puede ser uno solo.',
                },
                concerns: [
                    { id: 'belongs', moveId: 'memory-boundary',
                      en: 'I don’t know what belongs here.', es: 'No sé qué cabe aquí.',
                      replyEn: 'Honest place to start. One Move is built for exactly that: choosing a moment, and choosing where it stops.',
                      replyEs: 'Buen punto de partida. Hay una Movida hecha justo para eso: elegir un momento y elegir dónde termina.' },
                    { id: 'meaning', moveId: 'larger-force',
                      en: 'I have the moment, not the meaning.', es: 'Tengo el momento, no el significado.',
                      replyEn: 'That gap is the essay, not a problem with it. A Move helps you name the larger question the moment opens.',
                      replyEs: 'Ese hueco es el ensayo, no un defecto. Una Movida te ayuda a nombrar la pregunta más amplia que abre el momento.' },
                    { id: 'sound', moveId: 'voice-language',
                      en: 'I’m worried it won’t sound like me.', es: 'Me preocupa que no suene a mí.',
                      replyEn: 'Then we start there. One Move is about protecting language before anything gets revised.',
                      replyEs: 'Entonces empezamos por ahí. Hay una Movida para proteger el idioma antes de revisar nada.' },
                ],
                moveNote: {
                    en: 'The library counter — the afternoon my aunt answered before I did. Stop before the part about my grandmother.',
                    es: 'El mostrador de la biblioteca — la tarde en que mi tía respondió antes que yo. Parar antes de la parte de mi abuela.',
                },
                voiceReason: {
                    en: 'This is how it is actually said at home. I don’t want it smoothed out.',
                    es: 'Así se dice de verdad en mi casa. No quiero que me lo suavicen.',
                },
                decisionRationale: {
                    en: 'Taking the direction, keeping my own wording.',
                    es: 'Tomo la dirección y conservo mis palabras.',
                },
            },
            moves: {
                discover: ['Choose a memory and a boundary', 'Connect memory to a larger force', 'Test experience with research and context', 'Protect language and voice'],
                review: ['Personal-to-social connection', 'Evidence and historical grounding', 'Voice and translingual integrity'],
                council: ['Connection and structure reviewer', 'Evidence and historical-context reviewer', 'Voice and cultural-integrity reviewer'],
            },
        },
        admissions: {
            label: { en: 'College personal statement', es: 'Ensayo de admisión universitaria' },
            // Rendered names (label above stays untouched for stored record provenance):
            fullName: { en: 'College Personal Statement', es: 'Ensayo de admisión universitaria' },
            headerLabel: { en: 'College Essay', es: 'Ensayo de admisión' },
            tourExample: {
                moveId: 'connection',
                excerpt: { en: 'I built a color-coded signup sheet because I thought the problem was speed. By Friday I understood that people wanted to know what the form would change.', es: 'Hice una hoja de registro con colores porque pensé que el problema era la rapidez. Para el viernes entendí que la gente quería saber qué cambiaría el formulario.' },
                phrase: { en: 'what the form would change', es: 'qué cambiaría el formulario' },
                suggestion: { en: 'The shift in your understanding is the strongest part. Consider giving that change one more sentence of your own thinking.', es: 'El cambio en tu comprensión es la parte más fuerte. Considera darle a ese cambio una oración más de tu propio pensamiento.' },
                before: { en: 'By Friday I understood that people wanted something else.', es: 'Para el viernes entendí que la gente quería otra cosa.' },
                after: { en: 'By Friday I understood that people wanted to know what the form would change.', es: 'Para el viernes entendí que la gente quería saber qué cambiaría el formulario.' },
            },
            // Guided Discovery: gently resists the movie-trailer expectation.
            // No admission-odds language, no invented institutional fit.
            discovery: {
                openingQuip: {
                    en: 'Your life does not have to become a movie trailer. No slow motion required.',
                    es: 'Tu vida no tiene que volverse un tráiler de película. No hace falta cámara lenta.',
                },
                concerns: [
                    { id: 'which', moveId: 'disclosure',
                      en: 'I don’t know which story to tell.', es: 'No sé qué historia contar.',
                      replyEn: 'Common, and fixable. A Move helps you choose what you actually want to reveal — and what stays yours.',
                      replyEs: 'Pasa mucho y tiene arreglo. Una Movida te ayuda a elegir qué quieres mostrar y qué se queda para ti.' },
                    { id: 'point', moveId: 'connection',
                      en: 'I have the story, not the point.', es: 'Tengo la historia, no la idea.',
                      replyEn: 'The point usually hides in what changed for you. There’s a Move for finding it.',
                      replyEs: 'La idea suele esconderse en lo que cambió para ti. Hay una Movida para encontrarla.' },
                    { id: 'generic', moveId: 'language',
                      en: 'I’m worried it’ll sound like everyone else.', es: 'Me preocupa sonar igual que todos.',
                      replyEn: 'Then let’s protect the parts only you would write, before anything gets polished.',
                      replyEs: 'Entonces protejamos lo que solo tú escribirías, antes de pulir nada.' },
                ],
                moveNote: {
                    en: 'The signup-sheet week. Keep the part where I was wrong about what the problem was.',
                    es: 'La semana de la hoja de registro. Conservar la parte en que me equivoqué sobre cuál era el problema.',
                },
                voiceReason: {
                    en: 'It’s the plainest sentence in the essay and it’s the true one.',
                    es: 'Es la oración más sencilla del ensayo y es la verdadera.',
                },
                decisionRationale: {
                    en: 'Good direction, but I’ll say it my way.',
                    es: 'Buena dirección, pero lo digo a mi manera.',
                },
            },
            moves: {
                discover: ['Choose one concrete turning point', 'Name what changed in your understanding', 'Connect the moment to what you will pursue'],
                review: ['Purpose and personal insight', 'Structure and narrative movement', 'Voice and specificity'],
                council: ['Admissions reader', 'Writing teacher', 'Student voice advocate'],
            },
        },
        stem: {
            label: { en: 'STEM lab report', es: 'Informe de laboratorio STEM' },
            // Rendered names (label above stays untouched for stored record provenance):
            fullName: { en: 'STEM Laboratory Report', es: 'Informe de laboratorio STEM' },
            headerLabel: { en: 'STEM Lab Report', es: 'Informe de laboratorio' },
            tourExample: {
                moveId: 'reasoning',
                excerpt: { en: 'The seedlings under longer light grew 2.4 centimeters more on average. One unusually tall seedling and the small sample size limit what this can show.', es: 'Las plántulas con luz más prolongada crecieron 2.4 centímetros más en promedio. Una plántula inusualmente alta y el tamaño pequeño de la muestra limitan lo que esto puede mostrar.' },
                phrase: { en: 'the small sample size limit what this can show', es: 'el tamaño pequeño de la muestra limitan lo que esto puede mostrar' },
                suggestion: { en: 'The observation and the limitation are both stated. Consider naming which course concept explains why the evidence supports the claim.', es: 'La observación y la limitación están declaradas. Considera nombrar qué concepto del curso explica por qué la evidencia respalda la afirmación.' },
                before: { en: 'The seedlings under longer light grew more.', es: 'Las plántulas con luz más prolongada crecieron más.' },
                after: { en: 'The seedlings under longer light grew 2.4 centimeters more on average.', es: 'Las plántulas con luz más prolongada crecieron 2.4 centímetros más en promedio.' },
            },
            // Guided Discovery: humor distinguishes what was observed from what
            // everyone hoped for. Council is not configured for this profile and
            // the conversation says so plainly rather than hiding it.
            discovery: {
                openingQuip: {
                    en: 'A lab report says what happened — not what everyone was hoping would happen.',
                    es: 'Un informe de laboratorio dice lo que pasó, no lo que todos esperaban que pasara.',
                },
                concerns: [
                    { id: 'start', moveId: 'question',
                      en: 'I don’t know where to start writing it up.', es: 'No sé por dónde empezar a redactarlo.',
                      replyEn: 'Start with the question and what you predicted. A Move keeps that pair in front of you.',
                      replyEs: 'Empieza por la pregunta y lo que predijiste. Una Movida mantiene ese par a la vista.' },
                    { id: 'mixing', moveId: 'observation',
                      en: 'I keep mixing observation with interpretation.', es: 'Mezclo la observación con la interpretación.',
                      replyEn: 'That separation is most of the grade in this genre. There’s a Move that does only that.',
                      replyEs: 'Esa separación es buena parte de la nota en este género. Hay una Movida solo para eso.' },
                    { id: 'connect', moveId: 'reasoning',
                      en: 'I can’t connect my data to the claim.', es: 'No logro conectar mis datos con la afirmación.',
                      replyEn: 'Then we work the link itself — evidence, then the reasoning that carries it.',
                      replyEs: 'Entonces trabajamos el enlace: la evidencia y luego el razonamiento que la sostiene.' },
                ],
                moveNote: {
                    en: '2.4 cm mean difference. One outlier seedling. Sample of twelve — say so plainly.',
                    es: 'Diferencia media de 2.4 cm. Una plántula atípica. Muestra de doce — decirlo claramente.',
                },
                voiceReason: {
                    en: 'I wrote the limitation myself and I want it kept.',
                    es: 'La limitación la escribí yo y quiero conservarla.',
                },
                decisionRationale: {
                    en: 'Adding the course concept, keeping my numbers as they are.',
                    es: 'Agrego el concepto del curso y dejo mis números como están.',
                },
            },
            moves: {
                discover: ['State the research question and prediction', 'Separate observation from interpretation', 'Connect the result to the evidence'],
                review: ['Claim–evidence alignment', 'Methods and reproducibility', 'Limitations and precision'],
                // Role labels come from STEM_COUNCIL_ROLES below. The former
                // labels ("Lab instructor", "Scientific clarity editor") named an
                // authority that could confirm scientific correctness — which
                // this system cannot do and must never imply.
                council: [],
            },
        },
        sop: {
            label: { en: 'Graduate statement of purpose', es: 'Carta de propósito para posgrado' },
            // Rendered names (label above stays untouched for stored record provenance):
            fullName: { en: 'Graduate Statement of Purpose', es: 'Carta de propósito para posgrado' },
            headerLabel: { en: 'Statement of Purpose', es: 'Carta de propósito' },
            tourExample: {
                moveId: 'evidence',
                excerpt: { en: 'I built the intake survey and coded the responses myself. That work is where my question about participatory design actually began.', es: 'Construí la encuesta de admisión y codifiqué las respuestas yo mismo. En ese trabajo empezó realmente mi pregunta sobre el diseño participativo.' },
                phrase: { en: 'coded the responses myself', es: 'codifiqué las respuestas yo mismo' },
                suggestion: { en: 'The claim rests on concrete work. Consider adding what that work taught you, so the reader can follow the claim to the question.', es: 'La afirmación se apoya en trabajo concreto. Considera añadir qué te enseñó ese trabajo, para que el lector siga la afirmación hasta la pregunta.' },
                before: { en: 'I worked on a survey project.', es: 'Trabajé en un proyecto de encuesta.' },
                after: { en: 'I built the intake survey and coded the responses myself.', es: 'Construí la encuesta de admisión y codifiqué las respuestas yo mismo.' },
            },
            // Guided Discovery: contrasts concrete evidence with impressive
            // adjectives. Never invents faculty, courses, or opportunities.
            discovery: {
                openingQuip: {
                    en: '“Passionate, dedicated, driven.” A beautiful cloud with nothing to stand on.',
                    es: '«Apasionado, dedicado, comprometido». Una nube preciosa sin dónde pararse.',
                },
                concerns: [
                    { id: 'generic', moveId: 'trajectory',
                      en: 'Everything I write sounds generic.', es: 'Todo lo que escribo suena genérico.',
                      replyEn: 'Usually that means the trajectory is missing, not the talent. A Move traces it.',
                      replyEs: 'Casi siempre falta la trayectoria, no el talento. Una Movida la traza.' },
                    { id: 'claims', moveId: 'evidence',
                      en: 'I have claims, not evidence.', es: 'Tengo afirmaciones, no evidencia.',
                      replyEn: 'Then we go find the work you actually did. That’s what a committee can follow.',
                      replyEs: 'Entonces buscamos el trabajo que de verdad hiciste. Eso es lo que un comité puede seguir.' },
                    { id: 'fit', moveId: 'fit',
                      en: 'I don’t know how to write about the program.', es: 'No sé cómo escribir sobre el programa.',
                      replyEn: 'Carefully, and only from what you can verify. A Move keeps that honest.',
                      replyEs: 'Con cuidado y solo con lo que puedas verificar. Una Movida lo mantiene honesto.' },
                ],
                moveNote: {
                    en: 'Built the intake survey, coded 300 responses. The question started there, not in a seminar.',
                    es: 'Construí la encuesta y codifiqué 300 respuestas. La pregunta empezó ahí, no en un seminario.',
                },
                voiceReason: {
                    en: 'This names what I actually did. I don’t want it generalized.',
                    es: 'Esto nombra lo que de verdad hice. No quiero que lo generalicen.',
                },
                decisionRationale: {
                    en: 'Useful point — I’ll add the method, not the adjectives.',
                    es: 'Buen punto: agrego el método, no los adjetivos.',
                },
            },
            moves: {
                discover: ['Name the problem you want to study', 'Connect prior preparation to future inquiry', 'Make program fit specific and evidence-based'],
                review: ['Purpose and research trajectory', 'Preparation and evidence', 'Program fit and contribution'],
                council: ['Faculty reader', 'Research mentor', 'Purpose-and-fit editor'],
            },
        },
        neutral: {
            label: { en: 'General writing project', es: 'Proyecto general de escritura' },
            // Rendered names (label above stays untouched for stored record provenance):
            fullName: { en: 'General Writing Project', es: 'Proyecto general de escritura' },
            headerLabel: { en: 'General Writing', es: 'Escritura general' },
            tourExample: {
                moveId: 'structure',
                excerpt: { en: 'The library should stay open later during exam weeks. Students who work day shifts arrive when the doors are already closing.', es: 'La biblioteca debería abrir más tarde durante las semanas de exámenes. Los estudiantes que trabajan de día llegan cuando las puertas ya se están cerrando.' },
                phrase: { en: 'when the doors are already closing', es: 'cuando las puertas ya se están cerrando' },
                suggestion: { en: 'The claim and one observation are here. Consider what evidence a reader would need before the cost question comes up.', es: 'La afirmación y una observación están aquí. Considera qué evidencia necesitaría un lector antes de que surja la pregunta del costo.' },
                before: { en: 'Students have trouble using the library.', es: 'Los estudiantes tienen dificultades para usar la biblioteca.' },
                after: { en: 'Students who work day shifts arrive when the doors are already closing.', es: 'Los estudiantes que trabajan de día llegan cuando las puertas ya se están cerrando.' },
            },
            // Guided Discovery: neutral by design — inherits no admissions or
            // autobiographical assumption.
            discovery: {
                openingQuip: {
                    en: 'The blank page is being dramatic. We don’t have to join it.',
                    es: 'La página en blanco se cree muy dramática. No tenemos que seguirle el juego.',
                },
                concerns: [
                    { id: 'reader', moveId: 'purpose',
                      en: 'I don’t know what the reader needs.', es: 'No sé qué necesita quien lee.',
                      replyEn: 'Then that’s the first question, not a later one. A Move makes purpose and audience explicit.',
                      replyEs: 'Entonces esa es la primera pregunta, no una posterior. Una Movida hace explícitos el propósito y el público.' },
                    { id: 'organize', moveId: 'structure',
                      en: 'I have ideas but can’t organize them.', es: 'Tengo ideas pero no logro ordenarlas.',
                      replyEn: 'Very normal. A Move helps you sketch a sequence a reader can actually follow.',
                      replyEs: 'Muy normal. Una Movida te ayuda a bosquejar una secuencia que se pueda seguir.' },
                    { id: 'evidence', moveId: 'evidence',
                      en: 'I’m not sure my evidence is enough.', es: 'No sé si mi evidencia alcanza.',
                      replyEn: 'Let’s look at what would actually convince a careful reader.',
                      replyEs: 'Veamos qué convencería de verdad a quien lee con atención.' },
                ],
                moveNote: {
                    en: 'Audience: the committee that sets hours. They need the cost question answered before they will read further.',
                    es: 'Público: el comité que fija los horarios. Necesitan la pregunta del costo resuelta antes de seguir leyendo.',
                },
                voiceReason: {
                    en: 'Concrete, and it came from watching rather than guessing.',
                    es: 'Es concreto y salió de observar, no de suponer.',
                },
                decisionRationale: {
                    en: 'Fair point about evidence. Keeping my opening line.',
                    es: 'Buen punto sobre la evidencia. Conservo mi primera línea.',
                },
            },
            moves: {
                discover: ['Clarify the purpose and audience', 'Choose relevant evidence', 'Arrange ideas so the reader can follow'],
                review: ['Purpose and clarity', 'Structure and evidence', 'Voice and precision'],
                council: ['Audience reader', 'Structure reviewer', 'Voice advocate'],
            },
        },
        cap200: {
            // Presentation only. The course number is gone from every rendered
            // name: this genre is service-learning writing, not one course's
            // assignment. The profile key (`cap200`), every route id, the
            // persistence schema, and the genre value stored in saved records
            // are all unchanged, so existing links and stored work keep working.
            // Records that already snapshotted the old label keep showing it —
            // `storedGenreLabel` prefers the record's own copy — which is
            // truthful provenance, not stale data.
            label: { en: 'Service-learning report', es: 'Reporte de aprendizaje-servicio' },
            fullName: { en: 'Service-Learning Report', es: 'Reporte de aprendizaje-servicio' },
            headerLabel: { en: 'Service-Learning Report', es: 'Aprendizaje-servicio' },
            tourExample: {
                moveId: 'community-course-bridge',
                excerpt: { en: 'My shift notes kept returning to the same scene: explaining eligibility rules took as long as handing out food. That pattern is where the course concept became visible to me.', es: 'Mis notas de turno volvían a la misma escena: explicar las reglas de elegibilidad tomaba tanto tiempo como entregar alimentos. En ese patrón el concepto del curso se me hizo visible.' },
                phrase: { en: 'explaining eligibility rules took as long as handing out food', es: 'explicar las reglas de elegibilidad tomaba tanto tiempo como entregar alimentos' },
                suggestion: { en: 'The observation comes from your own notes. Consider naming which course concept explains the pattern, in your own words.', es: 'La observación viene de tus propias notas. Considera nombrar qué concepto del curso explica el patrón, con tus propias palabras.' },
                before: { en: 'The pantry was busy and confusing.', es: 'La despensa estaba ocupada y confusa.' },
                after: { en: 'Explaining eligibility rules took as long as handing out food.', es: 'Explicar las reglas de elegibilidad tomaba tanto tiempo como entregar alimentos.' },
            },
            // Guided Discovery: warmth stays on the writing and the notebook.
            // Nothing here jokes about service, community conditions, or the
            // people a student worked with, and nothing invents an experience.
            discovery: {
                openingQuip: {
                    en: 'Your shift notes have been waiting patiently. Let’s give them somewhere to go.',
                    es: 'Tus notas de turno llevan rato esperando. Vamos a darles a dónde ir.',
                },
                concerns: [
                    { id: 'notes', moveId: 'imrdc-structure',
                      en: 'I have notes, not a report.', es: 'Tengo notas, no un reporte.',
                      replyEn: 'That’s the right raw material. A Move helps you give it the structure the report needs.',
                      replyEs: 'Ese es el material correcto. Una Movida te ayuda a darle la estructura que el reporte necesita.' },
                    { id: 'concept', moveId: 'community-course-bridge',
                      en: 'I don’t know which course concept fits.', es: 'No sé qué concepto del curso encaja.',
                      replyEn: 'Then we start from what you observed and work toward the concept, not the other way around.',
                      replyEs: 'Entonces partimos de lo que observaste y avanzamos hacia el concepto, no al revés.' },
                    { id: 'counts', moveId: 'evidence-data-plan',
                      en: 'I’m not sure what counts as evidence.', es: 'No sé qué cuenta como evidencia.',
                      replyEn: 'Your logged hours, your own notes, what you recorded at the time. A Move helps you plan it.',
                      replyEs: 'Tus horas registradas, tus propias notas, lo que anotaste en el momento. Una Movida te ayuda a planearlo.' },
                ],
                moveNote: {
                    en: 'Third week: explaining eligibility took as long as handing out food. Four shifts logged, journal after each.',
                    es: 'Tercera semana: explicar la elegibilidad tomaba tanto como entregar alimentos. Cuatro turnos registrados, diario después de cada uno.',
                },
                voiceReason: {
                    en: 'This is what I actually observed, not a summary of it.',
                    es: 'Esto es lo que observé de verdad, no un resumen.',
                },
                decisionRationale: {
                    en: 'Naming the concept, keeping my own description of the shift.',
                    es: 'Nombro el concepto y conservo mi propia descripción del turno.',
                },
            },
            moves: {
                discover: ['Name your community starting point', 'Connect the issue to a course concept', 'Plan your evidence and data', 'Structure the report (IMRDC)'],
                review: ['Evidence and real data grounding', 'IMRDC structure and course-concept connection', 'Voice and community dignity'],
                council: ['Service-learning evidence reviewer', 'Report structure reviewer', 'Community-voice reviewer'],
            },
        },
        research: {
            label: { en: 'Research paper', es: 'Trabajo de investigación' },
            // Rendered names (label above stays untouched for stored record provenance):
            fullName: { en: 'Research Paper', es: 'Trabajo de investigación' },
            headerLabel: { en: 'Research Paper', es: 'Investigación' },
            tourExample: {
                moveId: 'notes-patterns',
                excerpt: { en: 'My two sources measure different things: one looks at diet, the other at civic participation. Put side by side, they disagree about what counts as a benefit.', es: 'Mis dos fuentes miden cosas distintas: una observa la dieta y la otra la participación cívica. Puestas lado a lado, no coinciden en qué cuenta como beneficio.' },
                phrase: { en: 'they disagree about what counts as a benefit', es: 'no coinciden en qué cuenta como beneficio' },
                suggestion: { en: 'You have noticed a real tension between sources. Consider stating your own interpretation of that tension before adding more sources.', es: 'Notaste una tensión real entre fuentes. Considera declarar tu propia interpretación de esa tensión antes de añadir más fuentes.' },
                before: { en: 'My sources say different things.', es: 'Mis fuentes dicen cosas distintas.' },
                after: { en: 'Put side by side, they disagree about what counts as a benefit.', es: 'Puestas lado a lado, no coinciden en qué cuenta como beneficio.' },
            },
            // Guided Discovery: the humor carries the hardest rule in this genre —
            // no invented source, quotation, citation, page number, or finding.
            discovery: {
                openingQuip: {
                    // "No matter how confident it looks" carries the real critical-AI
                    // point. An earlier draft ("I have tested this") could be misread
                    // as Tu Pana admitting it fabricates sources.
                    en: 'A citation cannot summon a source that does not exist — no matter how confident the citation looks.',
                    es: 'Una cita no puede invocar una fuente que no existe, por muy segura que se vea.',
                },
                concerns: [
                    { id: 'big', moveId: 'focused-question',
                      en: 'My topic is way too big.', es: 'Mi tema es demasiado amplio.',
                      replyEn: 'Almost every topic is, at first. A Move narrows it into something arguable.',
                      replyEs: 'Casi todos lo son al principio. Una Movida lo reduce a algo discutible.' },
                    { id: 'argument', moveId: 'notes-patterns',
                      en: 'I have sources, not an argument.', es: 'Tengo fuentes, no un argumento.',
                      replyEn: 'The argument usually shows up where sources disagree. A Move helps you find that seam.',
                      replyEs: 'El argumento suele aparecer donde las fuentes no coinciden. Una Movida te ayuda a encontrar esa costura.' },
                    { id: 'quality', moveId: 'source-evaluation',
                      en: 'I don’t know if my sources are good enough.', es: 'No sé si mis fuentes son suficientemente buenas.',
                      replyEn: 'Then we evaluate them deliberately, one at a time, with your own judgment.',
                      replyEs: 'Entonces las evaluamos con calma, una por una, con tu propio criterio.' },
                ],
                moveNote: {
                    en: 'Two sources measure different things — diet vs. civic participation. They disagree on what “benefit” means.',
                    es: 'Dos fuentes miden cosas distintas: dieta y participación cívica. No coinciden en qué significa «beneficio».',
                },
                voiceReason: {
                    en: 'This is my reading of the tension, not either source’s.',
                    es: 'Esta es mi lectura de la tensión, no la de ninguna fuente.',
                },
                decisionRationale: {
                    en: 'I’ll state my interpretation first, then add sources.',
                    es: 'Primero declaro mi interpretación y después agrego fuentes.',
                },
            },
            moves: {
                discover: ['Turn your topic into a focused question', 'Plan your search and source types', 'Evaluate each source', 'Find patterns across your notes'],
                review: ['Evidence and source traceability', 'Argument and structure', 'Voice and analytical clarity'],
                council: ['Source-evidence reviewer', 'Argument-structure reviewer', 'Academic-voice reviewer'],
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
            council: [],
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
        cap200: {
            discover: ['Nombra tu punto de partida comunitario', 'Conecta el tema con un concepto del curso', 'Planea tu evidencia y tus datos', 'Estructura el reporte (IMRDC)'],
            review: ['Evidencia y datos reales', 'Estructura IMRDC y conexión con el curso', 'Voz y dignidad comunitaria'],
            council: ['Revisor de evidencia de aprendizaje-servicio', 'Revisor de estructura del reporte', 'Revisor de voz comunitaria'],
        },
        research: {
            discover: ['Convierte tu tema en una pregunta enfocada', 'Planea tu búsqueda y tipos de fuentes', 'Evalúa cada fuente', 'Encuentra patrones en tus notas'],
            review: ['Evidencia y trazabilidad de fuentes', 'Argumento y estructura', 'Voz y claridad analítica'],
            council: ['Revisor de evidencia y fuentes', 'Revisor de argumento y estructura', 'Revisor de voz académica'],
        },
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
                exampleEn: [
                    ['Chosen moment', 'The specific experience already in the draft'],
                    ['Larger force', 'A historical, social, linguistic, economic, or political context'],
                    ['Bridge question', 'How might that context change what the moment means?'],
                    ['Boundary', 'What will remain private or outside this essay?'],
                ],
                exampleEs: [
                    ['Momento elegido', 'La experiencia específica que ya está en el borrador'],
                    ['Fuerza mayor', 'Un contexto histórico, social, lingüístico, económico o político'],
                    ['Pregunta puente', '¿Cómo podría ese contexto cambiar el significado del momento?'],
                    ['Límite', '¿Qué quedará privado o fuera de este ensayo?'],
                ],
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
                exampleEn: [
                    ['Moment', 'One event the writer chooses to share'],
                    ['Shift', 'What the writer began to notice, question, or understand'],
                    ['Why it matters', 'The insight the reader needs for this essay'],
                    ['Privacy choice', 'Details the writer chooses not to disclose'],
                ],
                exampleEs: [
                    ['Momento', 'Un suceso que quien escribe elige compartir'],
                    ['Cambio', 'Lo que quien escribe comenzó a notar, cuestionar o comprender'],
                    ['Por qué importa', 'La reflexión que el lector necesita para este ensayo'],
                    ['Decisión de privacidad', 'Detalles que quien escribe elige no divulgar'],
                ],
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
                exampleEn: [
                    ['Claim', 'What the result may show'],
                    ['Data', 'The exact observation or measurement that supports it'],
                    ['Reasoning', 'The course concept that explains why the data supports the claim'],
                    ['Limitation', 'What the evidence cannot establish'],
                ],
                exampleEs: [
                    ['Afirmación', 'Lo que el resultado podría mostrar'],
                    ['Datos', 'La observación o medición exacta que la respalda'],
                    ['Razonamiento', 'El concepto del curso que explica por qué los datos respaldan la afirmación'],
                    ['Limitación', 'Lo que la evidencia no puede establecer'],
                ],
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
                exampleEn: [
                    ['Claim', 'What are you saying about your development?'],
                    ['Evidence', 'What specific project, responsibility, action, or result supports it?'],
                    ['Reflection', 'What did you learn or begin questioning?'],
                    ['Forward link', 'How does that connect to what you want to pursue?'],
                ],
                exampleEs: [
                    ['Afirmación', '¿Qué dices sobre tu desarrollo?'],
                    ['Evidencia', '¿Qué proyecto, responsabilidad, acción o resultado específico la respalda?'],
                    ['Reflexión', '¿Qué aprendiste o comenzaste a cuestionar?'],
                    ['Conexión futura', '¿Cómo se conecta con lo que quieres estudiar o desarrollar?'],
                ],
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
                exampleEn: [
                    ['Purpose', 'What the reader should understand or do'],
                    ['Claim', 'The main point that serves that purpose'],
                    ['Evidence', 'Verifiable support the reader can examine'],
                    ['Complication', 'A limit, tension, or alternative the writing must address'],
                    ['Conclusion', 'What follows from the reasoning'],
                ],
                exampleEs: [
                    ['Propósito', 'Lo que el lector debe comprender o hacer'],
                    ['Afirmación', 'El punto principal que sirve a ese propósito'],
                    ['Evidencia', 'Apoyo verificable que el lector puede examinar'],
                    ['Complicación', 'Un límite, tensión o alternativa que el texto debe abordar'],
                    ['Conclusión', 'Lo que se desprende del razonamiento'],
                ],
            },
        ],
        cap200: [
            {
                id: 'community-starting-point', criticalKey: 'cultural',
                en: 'Name your community starting point', es: 'Nombra tu punto de partida comunitario',
                nudgeEn: 'Name your CBO, the community you are working with, or the moment that connected you to this project.',
                nudgeEs: 'Nombra tu CBO, la comunidad con la que trabajas, o el momento que te conectó con este proyecto.',
                whyEn: 'A concrete starting point grounds the report in what you actually did, not a general idea of service.',
                whyEs: 'Un punto de partida concreto ancla el reporte en lo que realmente hiciste, no en una idea general de servicio.',
                promptEn: 'CBO name, community context, first observation, or the moment that connected me…',
                promptEs: 'Nombre del CBO, contexto comunitario, primera observación, o el momento que me conectó…',
            },
            {
                id: 'community-course-bridge', criticalKey: 'thinking',
                en: 'Connect the community issue to a course concept', es: 'Conecta el tema comunitario con un concepto del curso',
                nudgeEn: 'Ask what larger social, historical, or civic issue your service touches, and which course concept explains it.',
                nudgeEs: 'Pregunta qué problema social, histórico o cívico más amplio toca tu servicio, y qué concepto del curso lo explica.',
                whyEn: 'The report moves from direct service toward analysis; the course concept is not decoration.',
                whyEs: 'El reporte avanza del servicio directo al análisis; el concepto del curso no es decoración.',
                promptEn: 'Larger issue, course concept, bridge sentence, or tension to investigate…',
                promptEs: 'Problema más amplio, concepto del curso, oración puente o tensión por investigar…',
                exampleEn: [
                    ['Service observation', 'Something the writer actually did or observed'],
                    ['Larger issue', 'The social, historical, or civic context it may reveal'],
                    ['Course concept', 'A verified idea from the course that helps interpret it'],
                    ['Connection to test', 'How the observation and concept might complicate one another'],
                ],
                exampleEs: [
                    ['Observación del servicio', 'Algo que quien escribe realmente hizo u observó'],
                    ['Problema mayor', 'El contexto social, histórico o cívico que podría revelar'],
                    ['Concepto del curso', 'Una idea verificada del curso que ayuda a interpretarlo'],
                    ['Conexión por comprobar', 'Cómo la observación y el concepto podrían complicarse mutuamente'],
                ],
            },
            {
                id: 'evidence-data-plan', criticalKey: 'accuracy',
                en: 'Plan your evidence and data', es: 'Planea tu evidencia y tus datos',
                nudgeEn: 'Plan how you will gather real evidence — logged hours, journal entries, interviews, or surveys.',
                nudgeEs: 'Planea cómo reunirás evidencia real — horas registradas, entradas de diario, entrevistas o encuestas.',
                whyEn: 'Findings must be grounded in what you actually did and observed; hours, activities, and data are never invented.',
                whyEs: 'Los hallazgos deben basarse en lo que realmente hiciste y observaste; las horas, actividades y datos nunca se inventan.',
                promptEn: 'Evidence types, logged hours, interview or journal notes, or a question my data should answer…',
                promptEs: 'Tipos de evidencia, horas registradas, notas de entrevista o diario, o una pregunta que mis datos deben responder…',
            },
            {
                id: 'imrdc-structure', criticalKey: 'specificity',
                en: 'Structure the report (IMRDC)', es: 'Estructura el reporte (IMRDC)',
                nudgeEn: 'Organize your report with introduction, methodology, results, discussion, and conclusion.',
                nudgeEs: 'Organiza tu reporte con introducción, metodología, resultados, discusión y conclusión.',
                whyEn: 'The IMRDC structure gives your real service and data an academic shape a reader can follow.',
                whyEs: 'La estructura IMRDC le da a tu servicio y tus datos reales una forma académica que el lector puede seguir.',
                promptEn: 'Section, key point per section, or a piece still missing from my structure…',
                promptEs: 'Sección, punto clave por sección, o algo que todavía falta en mi estructura…',
            },
        ],
        research: [
            {
                id: 'focused-question', criticalKey: 'thinking',
                en: 'Turn your topic into a focused, arguable question', es: 'Convierte tu tema en una pregunta enfocada y discutible',
                nudgeEn: 'Turn your topic into one question that is not too broad, not too narrow, and researchable.',
                nudgeEs: 'Convierte tu tema en una pregunta que no sea demasiado amplia, ni demasiado estrecha, y que se pueda investigar.',
                whyEn: 'A research paper begins with a question, not a conclusion; the question shapes everything that follows.',
                whyEs: 'Un trabajo de investigación empieza con una pregunta, no con una conclusión; la pregunta da forma a todo lo demás.',
                promptEn: 'Topic, possible questions, what evidence could answer it, or a question that feels too broad or too narrow…',
                promptEs: 'Tema, preguntas posibles, qué evidencia podría responderla, o una pregunta que parece demasiado amplia o estrecha…',
            },
            {
                id: 'search-plan-sources', criticalKey: 'specificity',
                en: 'Plan your search and source types', es: 'Planea tu búsqueda y tipos de fuentes',
                nudgeEn: 'Name the source types you need — scholarly, popular, community knowledge, or data — and where to look for each.',
                nudgeEs: 'Nombra los tipos de fuentes que necesitas — académicas, populares, conocimiento comunitario o datos — y dónde buscar cada una.',
                whyEn: 'A search plan keeps you from settling for the first source; community knowledge counts alongside scholarly sources.',
                whyEs: 'Un plan de búsqueda evita que te conformes con la primera fuente; el conocimiento comunitario cuenta junto a las fuentes académicas.',
                promptEn: 'Search terms, source types still missing, or where I will look for each…',
                promptEs: 'Términos de búsqueda, tipos de fuente que faltan, o dónde buscaré cada una…',
            },
            {
                id: 'source-evaluation', criticalKey: 'accuracy',
                en: 'Evaluate each source', es: 'Evalúa cada fuente',
                nudgeEn: "Check each source's author, date, venue, purpose, and credibility before you decide it belongs.",
                nudgeEs: 'Revisa el autor, la fecha, el medio, el propósito y la credibilidad de cada fuente antes de decidir si entra en tu trabajo.',
                whyEn: 'You judge the source — credibility is not something to assume from a confident tone or a familiar name.',
                whyEs: 'Tú evalúas la fuente — la credibilidad no se asume por un tono seguro o un nombre conocido.',
                promptEn: 'Author, date, purpose, credibility concern, limitation, or a source I am unsure about…',
                promptEs: 'Autor, fecha, propósito, duda de credibilidad, limitación, o una fuente de la que no estoy seguro/a…',
            },
            {
                id: 'notes-patterns', criticalKey: 'cultural',
                en: 'Find patterns across your notes', es: 'Encuentra patrones en tus notas',
                nudgeEn: 'Sort your notes into "what I know," "what a source says," and "what I think this means."',
                nudgeEs: 'Organiza tus notas en "lo que yo sé," "lo que dice una fuente" y "lo que creo que esto significa."',
                whyEn: 'Sources can confirm, complicate, or challenge what you already know — keeping them separate protects your own thinking.',
                whyEs: 'Las fuentes pueden confirmar, complicar o cuestionar lo que ya sabes — mantenerlas separadas protege tu propio pensamiento.',
                promptEn: 'What I know, what a source says, a pattern across sources, or a tension I noticed…',
                promptEs: 'Lo que sé, lo que dice una fuente, un patrón entre fuentes, o una tensión que noté…',
                exampleEn: [
                    ['What I know', 'The writer’s prior, community, or disciplinary knowledge'],
                    ['What a source says', 'A traceable claim recorded in the writer’s source notes'],
                    ['Tension', 'Where the sources or forms of knowledge differ'],
                    ['My interpretation', 'What the writer currently thinks the pattern may mean'],
                    ['Verify next', 'A fact, source, or perspective still needed'],
                ],
                exampleEs: [
                    ['Lo que sé', 'El conocimiento previo, comunitario o disciplinario de quien escribe'],
                    ['Lo que dice una fuente', 'Una afirmación rastreable anotada por quien escribe'],
                    ['Tensión', 'Dónde difieren las fuentes o formas de conocimiento'],
                    ['Mi interpretación', 'Lo que quien escribe piensa por ahora que podría significar el patrón'],
                    ['Verificar después', 'Un hecho, fuente o perspectiva que todavía hace falta'],
                ],
            },
        ],
    };

    // Council configuration per profile, translated from assets/js/council.js
    // COUNCIL_PROFILES (lines 78-163). `enabled: false` states its reason plainly;
    // no profile ever falls back to another genre's roles.
    // Role mandates ported from legacy COUNCIL_ROLES (council.js:41-66) with the
    // genre roleMandate overlays (council.js:78-163), aligned by position with
    // genres[id].moves.council display labels. Role identity in every record and
    // prompt derives from these entries, never from generated text.
    const COUNCIL_ROLE_MANDATES = {
        structure: 'Assess overall movement, sequencing, paragraph roles, transitions, and the through-line. Ignore sentence-level style, evidence quality, and voice. Never rewrite and never provide a full alternative outline.',
        evidence: 'Assess the quality, placement, specificity, and interpretation of evidence. Never invent, suggest, or imply sources, data, quotations, or facts.',
        voice: 'Name where the voice works, where meaning genuinely blurs, and which passages must NOT be polished away. Never recommend standardizing, translating, or smoothing culturally situated phrasing.',
    };
    function councilRoles(genreId, overlays = {}) {
        return ['structure', 'evidence', 'voice'].map(key => ({
            key,
            mandate: COUNCIL_ROLE_MANDATES[key] + (overlays[key] ? ` ${overlays[key]}` : ''),
        }));
    }

    const councilConfig = {
        autobiographical: {
            enabled: true, synthesisOrder: ['structure', 'evidence', 'voice'], criticalKey: 'cultural',
            roles: councilRoles('autobiographical', {
                structure: 'The audience is a mixed-genre autobiographical essay connecting chosen experience to a larger historical, social, cultural, or political force.',
                evidence: 'Personal and community knowledge can function as evidence when connected to history and analysis; factual claims still need traceable support.',
                voice: 'Cultural and linguistic variation is a resource; issue an explicit preservation warning when a likely recommendation would generify the text.',
            }),
        },
        admissions: {
            enabled: true, synthesisOrder: ['voice', 'structure', 'evidence'], criticalKey: 'cultural',
            roles: councilRoles('admissions', {
                structure: 'A personal statement moves from a lived moment toward reflection; it does not need five-paragraph form.',
                evidence: 'Evidence is lived scenes and concrete actions, not credential lists.',
                voice: 'The writer\'s own voice is the single most valuable element of this genre.',
            }),
            // prohibitions assigned below from GENRE_SAFEGUARDS (B1 canonical source)
        },
        stem: { enabled: false, criticalKey: 'accuracy' },
        sop: {
            enabled: true, synthesisOrder: ['evidence', 'structure', 'voice'], criticalKey: 'cultural',
            roles: councilRoles('sop', {
                structure: 'Assess trajectory without demanding chronology for its own sake.',
                evidence: 'Preparation claims need named projects, methods, results, or sources the draft itself states.',
                voice: 'Protect the applicant\'s voice against generic admissions-speak.',
            }),
            // prohibitions assigned below from GENRE_SAFEGUARDS (B1 canonical source)
        },
        neutral: { enabled: true, synthesisOrder: ['structure', 'evidence', 'voice'], criticalKey: 'cultural', roles: councilRoles('neutral') },
        cap200: {
            enabled: true, synthesisOrder: ['evidence', 'structure', 'voice'], criticalKey: 'accuracy',
            roles: councilRoles('cap200', {
                evidence: 'Evidence means real logged hours, observations, journals, interviews, and surveys the draft reports.',
                voice: 'Flag any framing that describes the community in deficit terms.',
            }),
            // prohibitions assigned below from GENRE_SAFEGUARDS (B1 canonical source)
        },
        research: {
            enabled: true, synthesisOrder: ['evidence', 'structure', 'voice'], criticalKey: 'accuracy',
            roles: councilRoles('research', {
                evidence: 'Claims must be traceable to the draft\'s own sources; student analysis must be distinguishable from summary.',
            }),
            // prohibitions assigned below from GENRE_SAFEGUARDS (B1 canonical source)
        },
    };

    // ── B1 + B3: one canonical source of profile safeguards ───────────────
    // Before this block, four profiles (admissions, sop, cap200, research)
    // declared their safeguards ONLY as councilConfig.prohibitions. That made
    // them reachable on the Council path and nowhere else: Ask Tu Pana,
    // passage review, focused review, and full-draft review carried no genre
    // safeguard at all, because genreCoachRules() reads genres[id].coachRules
    // and those profiles had none. The son's College Personal Statement route
    // and the niece's Graduate Statement of Purpose route both land on those
    // everyday coaching paths.
    //
    // Each set below is declared ONCE and composes BOTH carriers, so the two
    // can never drift into conflicting sources of truth. After B2 this table
    // covers ELEVEN of eleven profiles (six here plus the three STEM and two
    // Reading Response configurations, which compose their own coachRules from
    // STEM_NO_VERIFICATION / READING_SOURCE_RULES further down and are
    // preserved byte-for-byte):
    //   • genres[id].coachRules  — the universal carrier. Travels on all five
    //                              request pathways as additive GENRE GUIDANCE.
    //   • councilConfig[id].prohibitions — the Council carrier.
    // buildCouncilReviewerPrompt() then filters any rule already carried
    // verbatim in GENRE GUIDANCE, so the same prohibition is never TRANSMITTED
    // twice in one prompt. Retained protection, no duplicate prompt text.
    //
    // B3 adds the outcome-prediction prohibitions to admissions and sop. The
    // pre-existing sentences are preserved verbatim; nothing was reworded.
    //
    // B2 (2026-08-06) completes the matrix: `autobiographical` and `neutral`
    // (General Writing) now declare safeguards through this same canonical
    // source, so ALL ELEVEN profiles are carried on all five student-reachable
    // pathways. No second carrier was introduced. One optional field was added
    // to the canonical shape — `councilOnly` — for a constraint that is
    // genuinely a property of the Council FORMAT rather than of coaching in
    // general. It is APPENDED to the Council carrier and never duplicated:
    // founder condition B1.1 ("genuinely Council-specific constraints are
    // preserved as additive Council rules"). Only `autobiographical` uses it.
    //
    // Nothing here relaxes AUTHORSHIP_RULES or PASSAGE_READING_PROTOCOL, which
    // remain universal, unchanged, and above every genre set in every prompt.
    // Genre safeguards are additive and are never a substitute for them: the
    // universal rules govern TEXT PRODUCTION (never write prose the student
    // could copy); these govern what the coach may CLAIM, INFER, REQUEST, or
    // PUSH TOWARD. A coach can satisfy one perfectly while violating the other.
    const NO_OUTCOME_PREDICTION =
        'Never predict or estimate whether the writer will be accepted, admitted, selected, funded, interviewed, waitlisted, deferred, or rejected, and never rate the draft\'s chances — not as a number, a probability, a percentage, a letter grade, a tier, a ranking, or a confident impression — and not even when the writer asks you directly. If the writer asks, say plainly that you cannot know, and return to what the draft itself does.';

    const GENRE_SAFEGUARDS = {
        // B2 — founder-authored and founder-approved 2026-08-06.
        autobiographical: {
            intro: 'This is a mixed-genre autobiographical essay. The writer is the only authority on their own life; your role is to help them write what they have chosen to tell.',
            rules: [
                'Never invent, complete, intensify, dramatize, or supply any part of the writer\'s life: a memory, a scene, a detail, a date, an order of events, a place, a family member, a relationship, a migration or immigration experience, a hardship, a loss, a conversation, a line of dialogue, a cultural or religious practice, or a feeling the writer did not already state.',
                'Never infer or name what the writer did not say — a diagnosis, an illness, abuse, addiction, violence, immigration or documentation status, sexual orientation, gender identity, religion, race or ethnicity, poverty, someone\'s motives, or the state of a relationship. If your reading depends on something the draft does not say, ask about it instead of assuming it, and accept a decline as a complete answer.',
                'Never encourage disclosure in order to strengthen the writing. Do not suggest that a more painful, more private, or more dramatic version of an experience would be more compelling, more authentic, more honest, or more valuable to a reader.',
                'Pain is not the source of good autobiographical writing, and adversity is not what makes a life worth writing about. Never treat suffering, struggle, hardship, or trauma as the required material, the strongest material, or the proof that the writing is real.',
                'The writer retains authority over what happened and what the experience means to them. Never override their account, declare its "true" meaning, or supply a significance they did not choose. You may identify a tension in the draft or invite the writer to consider a possible interpretation, but frame it as a question grounded in their text and leave the answer entirely with them. Never reshape their life into a clearer, more dramatic, more redemptive, or more institutionally appealing story.',
                'Uncertainty and incomplete memory are legitimate autobiographical material. Never convert "I think", "maybe", "I don\'t remember", or "someone told me" into settled fact, and never treat a gap in memory as a defect the writer must repair. Help the writer distinguish what they remember, what they interpret, and what they think now.',
                'The writer may decline, generalize, condense, omit, or reframe anything. Treat that as an authorship and craft decision, not avoidance. If the writer declines a line of inquiry, do not press it again during the current interaction. If a question or revision would require disclosure the writer has not offered, name the writing need in general terms and offer a route that does not require disclosure.',
                'Spanish, code-meshing, translanguaging, dialect, family and community idiom, untranslated words, and culturally specific naming are meaningful writing choices, not errors by default. Do not standardize, translate, gloss, explain, or smooth them merely for an imagined outside reader. If the writer explicitly asks for help with translation, glossing, or audience access, explain the available choices and their tradeoffs while preserving the writer\'s authority and cultural specificity.',
                'Support the craft directly: scene, structure, sequence, pacing, reflection, the movement between experience and analysis, coherence, voice, and the ethical representation of other real people. Work on how the writing carries what the writer chose to include — never by adding material of your own.',
                'You are a writing coach, not a counselor, evaluator, or clinical screener. Do not infer, assess, or diagnose the writer\'s mental health, wellbeing, or safety from autobiographical material, and do not treat a draft as a clinical report. Respond to the writing they brought you. Nothing in this genre rule overrides any applicable universal safety requirement triggered by an explicit statement.',
                'None of this places personal, cultural, community, family, political, or identity-related material off-limits. When the writer chooses to write about it, engage it fully and seriously as writing. The writer decides what belongs in this essay; your work is to help them write it well.',
            ],
            // The ONLY genuinely Council-format-specific constraint in B2. The
            // unresolved-disagreement object exists solely in the Council
            // synthesis contract; on the four single-coach pathways there is no
            // panel and no disagreement to frame. Appended to the Council
            // carrier, never carried by genreContext, never duplicated.
            councilOnly: [
                'COUNCIL-SPECIFIC: never frame a disagreement between reviewers as a question about whether the writer\'s experience really happened that way, what it really meant, or how much of it they should disclose. Disagreements concern the writing only, and the writer is never asked to defend their life to a panel.',
            ],
        },
        admissions: {
            intro: 'This is a college admissions personal statement. Support the WRITING; you are not an admissions officer and cannot evaluate this writer\'s chances.',
            rules: [
                'Never predict admission outcomes or competitiveness, or compare the writer with other applicants.',
                NO_OUTCOME_PREDICTION,
                'Never recommend adding achievements, experiences, or qualities the draft does not state.',
                'Never push the writer toward a prestige-coded or culturally narrow template.',
            ],
        },
        sop: {
            intro: 'This is a graduate statement of purpose. Support the WRITING; you are not an admissions or selection committee and cannot evaluate this writer\'s chances.',
            rules: [
                'Never predict admission chances.',
                NO_OUTCOME_PREDICTION,
                'Never claim experience or preparation the draft does not state.',
            ],
        },
        cap200: {
            intro: 'This is a service-learning report grounded in real community work the student actually carried out.',
            rules: [
                'Never suggest inventing or embellishing service activities, hours, partners, or data.',
                'Never recommend framing the community in deficit terms.',
            ],
        },
        research: {
            intro: 'This is a research paper whose claims depend on real, traceable sources.',
            rules: [
                'Never invent sources, titles, authors, quotations, or citation details.',
            ],
        },
        // B2 — founder-authored and founder-approved 2026-08-06. This profile
        // must FAIL SAFE: the genre and assignment are unknown, so the rules
        // govern asserting unknowns as known. No councilOnly entry — the
        // reviewers' and the synthesis prompts both receive these through
        // genreContext, so a Council-only rule would add prompt text without
        // adding protection.
        neutral: {
            intro: 'This is a general writing project. The genre, assignment, discipline, audience, and instructor requirements are UNKNOWN to you, and you must not resolve that by guessing.',
            rules: [
                'You have not seen the assignment, the rubric, the syllabus, the course, or the instructor\'s expectations, and no genre profile is active for this draft. Never state, imply, or proceed as though you know what this assignment requires.',
                'Never invent or present as belonging to the writer\'s project any fact, evidence, data, statistic, observation, event, experience, source, title, author, quotation, page number, citation detail, or disciplinary claim the draft does not contain. A clearly labeled hypothetical example may be used to explain a writing principle, but it must not be presented as factual, as sourced, or as content the writer should insert into the draft.',
                'Never invent a requirement. Length, format, structure, section headings, citation style, number of sources, tone, deadline, and evaluation criteria are all unknown to you; do not present any of them as required.',
                'When safe guidance depends on something you do not know — the purpose, the audience, the genre, the kind of evidence expected, a discipline\'s conventions, or what the instructor asked for — say plainly what you would need and ask one focused question, or give guidance that holds regardless of the answer. Do not guess, and do not stall.',
                'Distinguish a writing suggestion you are offering from a requirement set by an instructor, a discipline, or a publication. Name which one you are giving whenever it could be unclear. Direct the writer back to the assignment, the instructor, or an authoritative disciplinary source for anything you cannot verify.',
                'Never predict or estimate an outcome — a grade, a score, a pass, an acceptance, a publication decision, an evaluation, or how any particular reader will judge this. If the writer asks, say plainly that you cannot know, and return to what the draft itself does.',
                'Never import another genre\'s expectations. Do not ask for a personal narrative, a lived-experience disclosure, a lab report\'s sections, an admissions arc, a thesis in a fixed position, a citation style, or a five-paragraph shape merely because writing often has them. Work from what this draft is actually doing.',
                'Preserve the writer\'s intended meaning and voice. Do not standardize, translate, or smooth multilingual, dialectal, code-meshed, or culturally specific language by default, and do not replace the writer\'s terms with terminology you merely assume a field would prefer. If the writer explicitly requests help adapting language for an audience or discipline, explain the choices and tradeoffs and let the writer decide.',
                'If the writer tells you the assignment, the genre, or a requirement, work from what they told you and attribute it to them. Never upgrade what the writer reported into a fact you verified or a disciplinary standard you confirmed.',
                'Not knowing the assignment is not a reason to be unhelpful. Focus, structure, development, sequencing, transitions, clarity, coherence, whether a claim is carried by what the draft itself supplies, and what a reader would need next can all be addressed from the draft alone.',
            ],
        },
    };

    Object.entries(GENRE_SAFEGUARDS).forEach(([profileId, { intro, rules, councilOnly }]) => {
        genres[profileId].coachRules = `${intro} ${rules.join(' ')}`;
        // The shared rules ride BOTH carriers; buildCouncilReviewerPrompt drops
        // any of them already carried verbatim in GENRE GUIDANCE, so nothing is
        // transmitted twice. councilOnly rules are additive: they are not in
        // coachRules, so the filter never removes them.
        councilConfig[profileId].prohibitions = rules.concat(councilOnly || []);
    });

    // Contextual critical-question key per focused-review lens, aligned by index
    // with genres[id].moves.review. Replaces the finalist's fragile label-regex
    // (integratedCriticalKey) with data. Keys: cultural | accuracy | voice |
    // specificity | thinking (canonical Five Questions).
    const lensCriticalKeys = {
        autobiographical: ['thinking', 'accuracy', 'voice'],
        admissions: ['voice', 'specificity', 'voice'],
        stem: ['accuracy', 'accuracy', 'specificity'],
        sop: ['voice', 'specificity', 'accuracy'],
        neutral: ['thinking', 'accuracy', 'specificity'],
        cap200: ['accuracy', 'thinking', 'cultural'],
        research: ['accuracy', 'thinking', 'voice'],
    };

    // Default contextual key for an unlensed coach question, per profile.
    const coachCriticalKeys = {
        autobiographical: 'voice', admissions: 'voice', stem: 'thinking', sop: 'thinking', neutral: 'thinking',
        cap200: 'accuracy', research: 'accuracy',
    };

    // Optional fourth Process Reflection prompt, per profile (conditional on the
    // student's own choices; never required).
    const reflectionPrompt4 = {
        stem: {
            en: 'What disciplinary knowledge, data, or observations shaped this work?',
            es: '¿Qué conocimiento disciplinario, datos u observaciones dieron forma a este trabajo?',
        },
        autobiographical: {
            en: 'If you chose to use it, what cultural, linguistic, family, community, historical, or experiential knowledge shaped this work?',
            es: 'Si decidiste usarlo, ¿qué conocimiento cultural, lingüístico, familiar, comunitario, histórico o vivido dio forma a este trabajo?',
        },
        cap200: {
            en: 'If you chose to draw on it, what community or cultural knowledge — beyond the data — shaped this report?',
            es: 'Si decidiste usarlo, ¿qué conocimiento comunitario o cultural — más allá de los datos — dio forma a este reporte?',
        },
        research: {
            en: 'What did your sources confirm, complicate, or change about your thinking?',
            es: '¿Qué confirmaron, complicaron o cambiaron tus fuentes en tu manera de pensar?',
        },
    };

    // Genre-appropriate one-sentence stuck starters (insertion-free).
    const stuckStarters = {
        cap200: {
            en: 'Name one piece of evidence you already have — an hour logged, an observation, or a journal note.',
            es: 'Nombra una evidencia que ya tienes — una hora registrada, una observación o una nota de diario.',
        },
        research: {
            en: 'Name one source you have and what question you want it to help answer.',
            es: 'Nombra una fuente que ya tienes y qué pregunta quieres que te ayude a responder.',
        },
    };

    // Deeper optional guidance per Move (progressive disclosure), translated from
    // the legacy stage arcs (genre-template.js). Keyed [genreId][moveId] -> {en, es}.
    const moveDeeper = {
        autobiographical: {
            'memory-boundary': {
                en: 'A memory is ready to work with once it has three elements: a specific place, a specific person or relationship, and a moment when something shifted or changed. Once those three are present, the memory is enough — there is no need to keep adding sensory detail. Identity, family, migration, and trauma disclosure are never required to find a strong entry point.',
                es: 'Una memoria está lista cuando tiene tres elementos: un lugar específico, una persona o relación específica, y un momento en que algo cambió. Una vez presentes esos tres, la memoria ya es suficiente — no hace falta seguir agregando detalle sensorial. Nunca se exige divulgar identidad, familia, migración ni trauma para encontrar un buen punto de entrada.',
            },
            'larger-force': {
                en: 'This move asks which historical, social, cultural, linguistic, racial, migration-related, gendered, economic, or political force meets your moment — a bridge sentence, not a full argument yet. The genre moves from chosen experience toward analysis, so the story is never left as decoration; a blank frame can help you find the shape of the bridge, but you write it yourself.',
                es: 'Este paso pregunta qué fuerza histórica, social, cultural, lingüística, racial, migratoria, de género, económica o política se cruza con tu momento — una oración puente, no un argumento completo todavía. El género avanza de la experiencia elegida al análisis, así que la historia nunca queda como decoración; un esquema en blanco puede ayudarte a encontrar la forma del puente, pero tú la escribes.',
            },
            'research-context': {
                en: 'A source here should confirm, complicate, or challenge what your experience already suggests — research is a conversation with your memory, not a replacement for it. Bring in only the context a reader actually needs to understand your experience, and treat any suggested keyword, database, or source type as a lead to verify yourself, never a citation to copy.',
                es: 'Una fuente aquí debe confirmar, complicar o cuestionar lo que tu experiencia ya sugiere — la investigación es una conversación con tu memoria, no un reemplazo de ella. Incluye solo el contexto que el lector realmente necesita para entender tu experiencia, y trata cualquier palabra clave, base de datos o tipo de fuente sugerida como una pista para verificar tú mismo/a, nunca como una cita para copiar.',
            },
            'voice-language': {
                en: 'Code-meshing, dialect, family language, and culturally specific phrasing stay in the essay when they carry meaning — smoother is not always truer. Revision help here names what a sentence might need and points to a route, but never hands you a polished replacement sentence; you write the version that still sounds like you.',
                es: 'La mezcla de códigos, el dialecto, el lenguaje familiar y las frases culturalmente específicas se quedan en el ensayo cuando llevan significado — más pulido no siempre es más verdadero. La ayuda en revisión nombra qué podría necesitar una oración y señala una ruta, pero nunca te entrega una oración pulida de reemplazo; tú escribes la versión que todavía suena a ti.',
            },
        },
        admissions: {
            disclosure: {
                en: 'Build a bounded inventory of small, real, ownable material — moments, routines, objects, places, relationships, questions, or tensions. Add three possibilities and you may stop after three; it does not have to be the most dramatic thing that ever happened to you. Nothing here ever demands trauma, adversity, or "the biggest challenge of your life," and pain is never framed as what makes an essay stronger.',
                es: 'Construye un inventario limitado de material pequeño, real y propio — momentos, rutinas, objetos, lugares, relaciones, preguntas o tensiones. Agrega tres posibilidades y puedes parar después de tres; no tiene que ser lo más dramático que te ha pasado. Nada aquí exige trauma, adversidad ni "el reto más grande de tu vida," y el dolor nunca se presenta como lo que fortalece un ensayo.',
            },
            language: {
                en: 'Protecting language means naming one specific word, rhythm, code-meshed phrase, or community meaning you do not want smoothed away — not a general commitment to "keep your voice." Clarity is never a reason to flatten multilingual voice into generic admissions language; if a phrase matters to you, it can stay even after a concern is raised once.',
                es: 'Proteger el idioma significa nombrar una palabra, un ritmo, una frase mezclada o un significado comunitario específico que no quieres que se suavice — no un compromiso general de "mantener tu voz." La claridad nunca es razón para aplanar la voz multilingüe en lenguaje genérico de admisiones; si una frase te importa, puede quedarse incluso después de señalar una duda una vez.',
            },
            connection: {
                en: 'Compare no more than a few of your own candidate directions using workability, not odds: concreteness, reflective potential, ownership, and whether the material has room to develop within the real word limit. This check never scores, ranks by prestige, or estimates admission probability — the only question is whether a direction can carry a full essay, not whether it will impress a reader.',
                es: 'Compara unas pocas de tus direcciones posibles usando su viabilidad, no probabilidades: concreción, potencial de reflexión, apropiación, y si el material tiene espacio para desarrollarse dentro del límite real de palabras. Esta revisión nunca puntúa, ordena por prestigio ni calcula probabilidades de admisión — la única pregunta es si una dirección puede sostener un ensayo completo, no si va a impresionar a un lector.',
            },
        },
        stem: {
            question: {
                en: 'A strong question is testable and tied to what your class actually studied and what you actually did — not a broad scientific mystery. Tell apart questions that are too broad, too vague, and genuinely workable, and check that your own data could plausibly answer it before you commit to it.',
                es: 'Una buena pregunta es comprobable y está ligada a lo que tu clase realmente estudió y a lo que tú realmente hiciste — no a un misterio científico amplio. Distingue entre preguntas demasiado amplias, demasiado vagas y realmente viables, y verifica que tus propios datos puedan responderla antes de comprometerte con ella.',
            },
            observation: {
                en: 'Record only what you actually measured or observed before explaining what it might mean — observation and interpretation are two different moves, not one sentence. Missing data gets asked for, never invented, estimated, or quietly cleaned up; an outlier or an uncertain reading stays in the record as it was.',
                es: 'Registra solo lo que realmente mediste u observaste antes de explicar qué podría significar — observación e interpretación son dos pasos distintos, no una sola oración. Los datos faltantes se piden, nunca se inventan, se estiman ni se "limpian" en silencio; un valor atípico o una lectura incierta se queda en el registro tal como fue.',
            },
            reasoning: {
                en: 'Name which sentence is your claim, which data from your own results supports it, and which course concept explains why that evidence supports that claim — Claim, Evidence, Reasoning. A strong explanation also names a limitation or a source of error, since confident tone is never a substitute for showing why the evidence actually supports the conclusion.',
                es: 'Nombra cuál oración es tu afirmación, qué dato de tus propios resultados la respalda, y qué concepto del curso explica por qué esa evidencia respalda esa afirmación — Afirmación, Evidencia, Razonamiento. Una buena explicación también nombra una limitación o una fuente de error, ya que un tono seguro nunca sustituye mostrar por qué la evidencia realmente respalda la conclusión.',
            },
        },
        sop: {
            trajectory: {
                en: 'Find the thread connecting what you have actually done to the question or problem you want to study now, and test whether your own evidence supports that through-line rather than assuming it does. This move never forces a childhood origin story, a dramatic hook, or a redemption arc — a supported trajectory is stronger than an invented one.',
                es: 'Encuentra el hilo que conecta lo que realmente has hecho con la pregunta o el problema que quieres estudiar ahora, y prueba si tu propia evidencia respalda esa trayectoria en vez de asumir que lo hace. Este paso nunca fuerza una historia de origen en la infancia, un gancho dramático ni un arco de redención — una trayectoria respaldada es más fuerte que una inventada.',
            },
            evidence: {
                en: 'Map each claim onto concrete evidence, what it taught you, and where it points next: CLAIM → CONCRETE EVIDENCE → REFLECTION → FORWARD LINK. Program facts get tagged honestly — [VERIFIED] when you pasted an official source, [STATED] when unconfirmed, [MISSING] when it is a gap to fill — and no course, faculty member, or lab is ever supplied without a source you provided.',
                es: 'Mapea cada afirmación con evidencia concreta, lo que te enseñó, y hacia dónde apunta: AFIRMACIÓN → EVIDENCIA CONCRETA → REFLEXIÓN → CONEXIÓN FUTURA. Los datos del programa se etiquetan con honestidad — [VERIFICADO] cuando pegaste una fuente oficial, [DECLARADO] cuando no está confirmado, [FALTA] cuando es un vacío por llenar — y nunca se ofrece un curso, profesor o laboratorio sin una fuente que tú hayas dado.',
            },
            fit: {
                en: 'Program fit only counts when it traces to an official source you provided — a course catalog line, a faculty page, a program description — never a guessed course, lab, or faculty name. Generic fit ("your prestigious program") gets flagged the same way an unverifiable claim does: name what specific, sourced detail it should be replaced with.',
                es: 'El encaje con el programa solo cuenta cuando se puede rastrear a una fuente oficial que tú diste — una línea del catálogo, una página de facultad, una descripción del programa — nunca un curso, laboratorio o profesor adivinado. El encaje genérico ("tu prestigioso programa") se señala igual que una afirmación no verificable: nombra el detalle específico y con fuente que debería reemplazarlo.',
            },
        },
        neutral: {
            purpose: {
                en: 'Purpose is what decides what belongs in the piece and what does not — name what you want the audience to understand or be able to do after reading. A clear purpose also implies its audience: what they already know and what they will need explained before your point can land.',
                es: 'El propósito es lo que decide qué pertenece al texto y qué no — nombra qué quieres que la audiencia comprenda o pueda hacer después de leer. Un propósito claro también implica su audiencia: qué sabe ya y qué necesitará que se le explique antes de que tu idea llegue.',
            },
            evidence: {
                en: 'Gather only evidence you can verify — examples, facts, quotations, or observations with a source or a memory you can stand behind. Evidence exists so a reader can test your claims themselves, not just take your word for them.',
                es: 'Reúne solo evidencia que puedas verificar — ejemplos, hechos, citas u observaciones con una fuente o un recuerdo que puedas respaldar. La evidencia existe para que el lector pueda comprobar tus afirmaciones por sí mismo, no solo confiar en tu palabra.',
            },
            structure: {
                en: 'A useful sequence gives the reader a path — claim, evidence, complication, conclusion, or whatever order this purpose actually needs — without the coach writing the draft for you. Sketch the order first; let the sentences come after the shape is clear.',
                es: 'Una secuencia útil le da al lector un camino — afirmación, evidencia, complicación, conclusión, o el orden que este propósito realmente necesite — sin que el coach escriba el borrador por ti. Bosqueja el orden primero; deja que las oraciones lleguen después de que la forma esté clara.',
            },
        },
        cap200: {
            'community-starting-point': {
                en: 'Start with your CBO, the community you are working with, or the moment that connected you to this project — described in general terms that protect the identifying details of the people you served. This starting point grounds the whole report in real service, not a general idea of "helping," and it is the foundation the course-concept connection and your data plan will build on.',
                es: 'Empieza con tu CBO, la comunidad con la que trabajas, o el momento que te conectó con este proyecto — descrito en términos generales que protejan los datos identificables de las personas a quienes serviste. Este punto de partida ancla todo el reporte en servicio real, no en una idea general de "ayudar," y es la base sobre la que se construirán la conexión con el curso y tu plan de datos.',
            },
            'community-course-bridge': {
                en: 'Connect your starting point to a larger social, historical, cultural, environmental, or civic issue, and to a specific course concept — the report has to hold both the community-based service and the disciplinary learning together, not one or the other. A generic research paper disconnected from the service, or a volunteer-hours log disconnected from the course, both miss what this move is asking for.',
                es: 'Conecta tu punto de partida con un problema social, histórico, cultural, ambiental o cívico más amplio, y con un concepto específico del curso — el reporte tiene que sostener juntos el servicio comunitario y el aprendizaje disciplinario, no solo uno de los dos. Un trabajo de investigación genérico desconectado del servicio, o un registro de horas de voluntariado desconectado del curso, no cumplen lo que pide este paso.',
            },
            'evidence-data-plan': {
                en: 'Plan how you will gather real evidence — logged hours, reflective journals, interview transcripts, or survey data — and protect the identifying information of anyone you served by describing people in general terms. Findings can only be grounded in what you actually report doing; hours, activities, partners, and data are never invented or embellished, even to fill a gap.',
                es: 'Planea cómo reunirás evidencia real — horas registradas, diarios reflexivos, transcripciones de entrevistas o datos de encuestas — y protege la información identificable de las personas a quienes serviste describiéndolas en términos generales. Los hallazgos solo pueden basarse en lo que realmente reportas haber hecho; las horas, actividades, socios y datos nunca se inventan ni se exageran, ni siquiera para llenar un vacío.',
            },
            'imrdc-structure': {
                en: 'Organize your report around Introduction, Methodology, Results, Discussion, and Conclusion — an academic shape for real service, real data, and real reflection, not a substitute for any of them. Reflection belongs inside this structure as part of the work, never as the whole assignment, and the community you served is never described in deficit terms.',
                es: 'Organiza tu reporte en Introducción, Metodología, Resultados, Discusión y Conclusión — una forma académica para tu servicio real, tus datos reales y tu reflexión real, no un sustituto de ninguno de ellos. La reflexión pertenece dentro de esta estructura como parte del trabajo, nunca como la tarea completa, y la comunidad a la que serviste nunca se describe en términos de déficit.',
            },
        },
        research: {
            'focused-question': {
                en: 'A research paper begins with a question, not a conclusion — turn your topic into something focused and arguable by telling apart questions that are too broad, too narrow, and genuinely workable. Naming your own knowledge or community experience as a starting point is legitimate; the question just has to be one your evidence could actually answer.',
                es: 'Un trabajo de investigación empieza con una pregunta, no con una conclusión — convierte tu tema en algo enfocado y discutible distinguiendo entre preguntas demasiado amplias, demasiado estrechas y realmente viables. Nombrar tu propio conocimiento o experiencia comunitaria como punto de partida es legítimo; la pregunta solo tiene que ser una que tu evidencia realmente pueda responder.',
            },
            'search-plan-sources': {
                en: 'Plan where to look and what source types you need — scholarly and popular, primary and secondary, and community knowledge alongside academic sources. This is a search strategy, never a delivered source list: no source, title, author, or citation is ever supplied or invented on your behalf — you do the searching and the finding.',
                es: 'Planea dónde buscar y qué tipos de fuentes necesitas — académicas y populares, primarias y secundarias, y conocimiento comunitario junto a fuentes académicas. Esto es una estrategia de búsqueda, nunca una lista de fuentes entregada: ninguna fuente, título, autor o cita se ofrece ni se inventa en tu nombre — tú haces la búsqueda y el hallazgo.',
            },
            'source-evaluation': {
                en: 'Examine each source with the same questions every time: who wrote it, when, for whom, what is its purpose, and how credible and relevant is it. You judge the source — no source is ever declared reliable, verified, or vouched for beyond the details you yourself bring to the evaluation.',
                es: 'Examina cada fuente con las mismas preguntas cada vez: quién la escribió, cuándo, para quién, cuál es su propósito, y qué tan creíble y relevante es. Tú evalúas la fuente — ninguna fuente se declara confiable, verificada o avalada más allá de los detalles que tú mismo/a aportas a la evaluación.',
            },
            'notes-patterns': {
                en: 'Take notes in your own words and keep quotation, paraphrase, and summary clearly apart, sorting each note into "what I know," "what a source says," and "what I think this means." Sources can confirm, complicate, or challenge your own knowledge — the pattern or tension you notice across sources is your analysis, not a summary of any one of them.',
                es: 'Toma notas con tus propias palabras y mantén separadas la cita, la paráfrasis y el resumen, clasificando cada nota en "lo que sé," "lo que dice una fuente" y "lo que creo que esto significa." Las fuentes pueden confirmar, complicar o cuestionar tu propio conocimiento — el patrón o la tensión que notas entre fuentes es tu análisis, no un resumen de ninguna de ellas.',
            },
        },
    };

    // ── STEM: bounded profiles and a purpose-built Council ───────────────────
    //
    // AUDIT (2026-08-05). The migrated `stem` profile inherited the legacy
    // "STEM Lab Report & Scientific Explanation" layer (genre-template.js:676-807,
    // read-only at R0) but was labelled for the lab report alone, so one profile
    // was silently covering two different disciplinary genres — and the shared
    // link `?assignment=stem` resolved to it without asking which. Its Council
    // was `enabled: false` with no roles at all, and the display labels it
    // carried ("Lab instructor", "Scientific clarity editor") named an authority
    // that can confirm scientific correctness. Nothing in any STEM request told
    // the model what it must not verify, because the `genreContext` seam the
    // prompt builders accept was never populated by anything.
    //
    // Resolution: three bounded profiles, one shared safety contract, one
    // purpose-built Council. A "research summary" profile is deliberately NOT
    // added — it would overlap the existing Research Paper profile and no
    // current product need calls for it.

    const STEM_NO_VERIFICATION = [
        'This is scientific and technical writing. Support the WRITING; you cannot and must not adjudicate the science.',
        'Never state or imply that you have verified scientific correctness, checked a calculation, recomputed a value, confirmed a measurement, validated an experimental design, or checked an external source.',
        'Never invent or supply data, results, measurements, units, equations, methods, controls, sources of error, citations, or disciplinary facts the draft does not contain.',
        'Never alter, recompute, round, convert, or "correct" a quantity, unit, equation, symbol, or technical term in the student\'s draft. Preserve them exactly as written.',
        'Distinguish INTERNAL CONSISTENCY — what the draft\'s own parts say about each other — from EXTERNAL FACTUAL VERIFICATION, which you cannot perform. Name which one you are doing whenever it could be unclear.',
        'When the draft does not contain enough information to support an observation, say so plainly and ask one useful question instead of asserting a conclusion.',
        'A claim may be scientifically questionable and you may still be unable to judge it. In that case, address only whether the draft shows how its own evidence supports it.',
        'Never import expectations from humanities, admissions, autobiographical, or general personal writing. Do not ask for narrative arc, personal voice, or reflective disclosure that this genre does not call for.',
        'Disciplinary terseness is not a style flaw. Do not flatten technical writing into general academic prose.',
    ].join(' ');

    // Purpose-built for scientific and technical writing. These are not the
    // general structure/evidence/voice roles under new names: each mandate names
    // what this reader examines AND what it is not entitled to conclude.
    const STEM_COUNCIL_ROLES = [
        {
            key: 'reasoning',
            label: { en: 'Reasoning and Evidence', es: 'Razonamiento y evidencia' },
            // Student-facing description shown before consent. Each perspective
            // says what it examines AND what it cannot judge, so three readers
            // never look like three copies of the same generic offer.
            blurb: { en: 'Asks whether your evidence actually reaches your claim. It cannot judge whether the science is right.', es: 'Pregunta si tu evidencia realmente alcanza tu afirmación. No puede juzgar si la ciencia es correcta.' },
            mandate: 'Examine whether each claim is connected to evidence the student actually supplied, and where the reasoning between claim and evidence is missing, implied rather than stated, or carried further than the evidence reaches. You are NOT certifying that any claim is scientifically true, that any calculation is correct, or that any result is valid. Report only whether the draft shows a reader how its own evidence supports its own claim. Never supply data, a result, or a scientific fact the draft does not contain.',
        },
        {
            key: 'audience',
            label: { en: 'Disciplinary Clarity and Audience', es: 'Claridad disciplinaria y audiencia' },
            blurb: { en: 'Asks what a reader in your course needs in order to follow the work, without flattening your technical language.', es: 'Pregunta qué necesita un lector de tu curso para seguir el trabajo, sin aplanar tu lenguaje técnico.' },
            mandate: 'Examine terminology, causal explanation, organization, and what the intended disciplinary reader needs in order to follow the work. Distinguish genuine imprecision from ordinary disciplinary compression, and never recommend replacing a technical term the student chose with a general one. Ignore evidence quality and limitations; another reader has those. Never rewrite and never supply replacement wording.',
        },
        {
            key: 'uncertainty',
            label: { en: 'Methods, Uncertainty, and Limitations', es: 'Métodos, incertidumbre y limitaciones' },
            blurb: { en: 'Asks whether the draft claims more than its own described methods can support.', es: 'Pregunta si el borrador afirma más de lo que sus propios métodos descritos pueden sostener.' },
            mandate: 'Examine qualifiers, stated assumptions, procedural explanation, scope, uncertainty, and limitations: whether the draft claims more than its own described methods can support, and whether what the work cannot establish is stated anywhere. Never invent a method, control, source of error, or limitation the student did not describe, and never assert what the true result should have been.',
        },
    ];

    const STEM_COUNCIL_PROHIBITIONS = [
        'Never state or imply that you verified scientific correctness, a calculation, a measurement, an experimental design, or an external source.',
        'Never invent or supply data, results, units, equations, methods, controls, citations, or disciplinary facts absent from the draft.',
        'Never alter, recompute, or "correct" a quantity, unit, equation, or technical term the student wrote.',
        'Never import humanities, admissions, or autobiographical expectations into scientific writing.',
        'When evidence in the draft is insufficient, say so and ask a question rather than concluding.',
    ];

    const stemCouncil = () => ({
        enabled: true,
        synthesisOrder: ['reasoning', 'uncertainty', 'audience'],
        criticalKey: 'accuracy',
        roles: STEM_COUNCIL_ROLES.map(role => ({ key: role.key, mandate: role.mandate, blurb: role.blurb })),
        prohibitions: STEM_COUNCIL_PROHIBITIONS.slice(),
    });
    const stemCouncilLabels = lang => STEM_COUNCIL_ROLES.map(role => role.label[lang]);

    // The two additional bounded profiles. The lab report keeps its existing,
    // already-verified Moves; these two are the genres it was silently covering.
    const STEM_PROFILES = {
        stemExplanation: {
            label: { en: 'Scientific explanation', es: 'Explicación científica' },
            fullName: { en: 'Technical or Scientific Explanation', es: 'Explicación técnica o científica' },
            headerLabel: { en: 'Scientific Explanation', es: 'Explicación científica' },
            levelRules: 'The assignment is a technical or scientific EXPLANATION: the student explains why or how a phenomenon occurs, using the Claim–Evidence–Reasoning pattern. The work is explanatory rather than persuasive; there is no opponent to defeat. Support the student in making the causal mechanism explicit and in defining what a reader needs in order to follow it.',
            moves: [
                { id: 'phenomenon', criticalKey: 'accuracy',
                  en: 'Name the phenomenon and the question', es: 'Nombra el fenómeno y la pregunta',
                  nudgeEn: 'State what happened or what is observed, and the why-or-how question your explanation answers.',
                  nudgeEs: 'Declara qué ocurrió o qué se observa, y la pregunta de por qué o cómo que responde tu explicación.',
                  whyEn: 'An explanation needs a specific question. Without one it becomes a description of the topic.',
                  whyEs: 'Una explicación necesita una pregunta específica. Sin ella se vuelve una descripción del tema.',
                  promptEn: 'The observed phenomenon, and the why-or-how question I am answering…',
                  promptEs: 'El fenómeno observado y la pregunta de por qué o cómo que estoy respondiendo…',
                  deeperEn: 'Separate the phenomenon from the explanation of it: the phenomenon is what anyone could observe, the explanation is the mechanism you are proposing. A question that begins "why" or "how" keeps you in explanatory territory; a question that begins "what" usually produces description instead. Name the scope too — which conditions your explanation covers, and which it does not.',
                  deeperEs: 'Separa el fenómeno de su explicación: el fenómeno es lo que cualquiera podría observar, la explicación es el mecanismo que propones. Una pregunta que empieza con «por qué» o «cómo» te mantiene en terreno explicativo; una que empieza con «qué» suele producir descripción. Nombra también el alcance: qué condiciones cubre tu explicación y cuáles no.' },
                { id: 'claim-evidence', criticalKey: 'accuracy',
                  en: 'State the claim and the evidence it rests on', es: 'Declara la afirmación y la evidencia que la sostiene',
                  nudgeEn: 'Write the claim as one sentence, then list the specific observations, measurements, or data that support it.',
                  nudgeEs: 'Escribe la afirmación en una oración y luego enumera las observaciones, mediciones o datos específicos que la respaldan.',
                  whyEn: 'A claim a reader can locate is what makes the rest of the explanation checkable.',
                  whyEs: 'Una afirmación que el lector puede ubicar es lo que hace comprobable el resto de la explicación.',
                  promptEn: 'My claim in one sentence, and the exact evidence behind it…',
                  promptEs: 'Mi afirmación en una oración y la evidencia exacta que la respalda…',
                  deeperEn: 'Evidence here means what you or your source actually recorded — a measurement, an observation, a documented result — not a general statement that something is known. Keep quantities, units, and conditions exactly as recorded; an explanation built on a tidied number is not an explanation of what happened. If a piece of evidence is missing, note the gap rather than filling it.',
                  deeperEs: 'La evidencia aquí es lo que tú o tu fuente registraron realmente — una medición, una observación, un resultado documentado — no una afirmación general de que algo se sabe. Conserva cantidades, unidades y condiciones tal como se registraron; una explicación construida sobre un número «arreglado» no explica lo que pasó. Si falta una evidencia, anota el vacío en vez de llenarlo.',
                  exampleEn: [
                      ['Claim', 'The mechanism you are proposing, in one sentence'],
                      ['Evidence', 'The specific observations or measurements recorded'],
                      ['Conditions', 'What was held constant, and what varied'],
                  ],
                  exampleEs: [
                      ['Afirmación', 'El mecanismo que propones, en una oración'],
                      ['Evidencia', 'Las observaciones o mediciones específicas registradas'],
                      ['Condiciones', 'Qué se mantuvo constante y qué varió'],
                  ] },
                { id: 'reasoning-link', criticalKey: 'thinking',
                  en: 'Explain the reasoning that connects them', es: 'Explica el razonamiento que los conecta',
                  nudgeEn: 'Name the scientific principle or course concept that makes this evidence support this claim.',
                  nudgeEs: 'Nombra el principio científico o concepto del curso que hace que esta evidencia respalde esta afirmación.',
                  whyEn: 'Reasoning is the part readers most often leave out, and the part that makes an explanation an explanation.',
                  whyEs: 'El razonamiento es lo que más se omite y lo que convierte una explicación en explicación.',
                  promptEn: 'The principle or concept, and how it links my evidence to my claim…',
                  promptEs: 'El principio o concepto, y cómo enlaza mi evidencia con mi afirmación…',
                  deeperEn: 'Write the link as a chain a reader can follow one step at a time: because this principle holds, this evidence means this, which is why the claim follows. If you cannot name the principle, that is useful information — it usually means the connection is still an assumption rather than an explanation. A confident tone is not reasoning, and neither is restating the evidence in different words.',
                  deeperEs: 'Escribe el enlace como una cadena que el lector pueda seguir paso a paso: dado que este principio se cumple, esta evidencia significa esto, y por eso se sigue la afirmación. Si no puedes nombrar el principio, eso es información útil — suele significar que la conexión sigue siendo un supuesto y no una explicación. Un tono seguro no es razonamiento, y repetir la evidencia con otras palabras tampoco.' },
                { id: 'audience-terms', criticalKey: 'specificity',
                  en: 'Define what your reader needs to follow it', es: 'Define lo que tu lector necesita para seguirla',
                  nudgeEn: 'Name the terms, units, or background a reader in this course needs — and define them where they first appear.',
                  nudgeEs: 'Nombra los términos, unidades o antecedentes que necesita un lector de este curso — y defínelos donde aparecen por primera vez.',
                  whyEn: 'Precision is for the reader. A term that is exact but undefined does not explain anything.',
                  whyEs: 'La precisión es para el lector. Un término exacto pero sin definir no explica nada.',
                  promptEn: 'Terms to define, units to state, and background my reader will need…',
                  promptEs: 'Términos por definir, unidades por declarar y antecedentes que necesitará mi lector…',
                  deeperEn: 'Decide who the reader is first — a classmate, an instructor, a general reader — because that decides what may be assumed. Technical vocabulary is not decoration and should not be replaced with vaguer everyday words; the fix for an unfamiliar term is a definition, not a substitution. Units and conditions belong beside every quantity, since a number without them cannot be interpreted.',
                  deeperEs: 'Decide primero quién es el lector — un compañero, un instructor, un lector general — porque eso decide qué se puede dar por supuesto. El vocabulario técnico no es decoración y no debe reemplazarse por palabras cotidianas más vagas; lo que arregla un término desconocido es una definición, no un sustituto. Las unidades y condiciones acompañan a cada cantidad, ya que un número sin ellas no se puede interpretar.' },
            ],
            review: { en: ['Claim, evidence, and reasoning', 'Mechanism and causal clarity', 'Terminology and reader needs'], es: ['Afirmación, evidencia y razonamiento', 'Mecanismo y claridad causal', 'Terminología y necesidades del lector'] },
            lensKeys: ['accuracy', 'thinking', 'specificity'],
            stuck: { en: 'Write the one sentence that says what you think is causing this, even if you are not sure yet.', es: 'Escribe la oración que dice qué crees que está causando esto, aunque todavía no estés seguro/a.' },
            reflect4: { en: 'What disciplinary knowledge, data, or observations shaped this explanation?', es: '¿Qué conocimiento disciplinario, datos u observaciones dieron forma a esta explicación?' },
            tourExample: {
                moveId: 'reasoning-link',
                excerpt: { en: 'The metal strip bent toward the copper side each time it was heated. Copper expands more than steel at the same temperature, which is why the strip curves toward the side that grows faster.', es: 'La tira metálica se dobló hacia el lado del cobre cada vez que se calentó. El cobre se expande más que el acero a la misma temperatura, y por eso la tira se curva hacia el lado que crece más rápido.' },
                phrase: { en: 'which is why the strip curves toward the side that grows faster', es: 'y por eso la tira se curva hacia el lado que crece más rápido' },
                suggestion: { en: 'The principle and the observation are both here. Consider stating the link as one step a reader can follow, so the reasoning is visible rather than assumed.', es: 'El principio y la observación están aquí. Considera declarar el enlace como un paso que el lector pueda seguir, para que el razonamiento se vea en vez de suponerse.' },
                before: { en: 'The strip bent when heated.', es: 'La tira se dobló al calentarse.' },
                after: { en: 'The metal strip bent toward the copper side each time it was heated.', es: 'La tira metálica se dobló hacia el lado del cobre cada vez que se calentó.' },
            },
            discovery: {
                openingQuip: { en: 'An explanation answers why. A description just tells the reader the thing exists, which they had guessed.', es: 'Una explicación responde por qué. Una descripción solo le dice al lector que la cosa existe, cosa que ya sospechaba.' },
                concerns: [
                    { id: 'describe', moveId: 'phenomenon',
                      en: 'I think I’m describing, not explaining.', es: 'Creo que estoy describiendo, no explicando.',
                      replyEn: 'Useful thing to notice. A Move turns the topic into a why-or-how question, which is where explanation starts.',
                      replyEs: 'Buena cosa de notar. Una Movida convierte el tema en una pregunta de por qué o cómo, que es donde empieza la explicación.' },
                    { id: 'link', moveId: 'reasoning-link',
                      en: 'I have the data but the “why” is missing.', es: 'Tengo los datos pero falta el «por qué».',
                      replyEn: 'That missing piece has a name — reasoning — and a Move built just for it.',
                      replyEs: 'Esa pieza que falta tiene nombre — razonamiento — y una Movida hecha solo para eso.' },
                    { id: 'terms', moveId: 'audience-terms',
                      en: 'I don’t know how much to define.', es: 'No sé cuánto debo definir.',
                      replyEn: 'Then we start from who is reading it. A Move works out what may be assumed and what must be said.',
                      replyEs: 'Entonces partimos de quién lo lee. Una Movida resuelve qué se puede suponer y qué hay que decir.' },
                ],
                moveNote: { en: 'Copper expands more than steel at the same temperature — that is the principle the whole explanation rests on.', es: 'El cobre se expande más que el acero a la misma temperatura — ese es el principio en que se apoya toda la explicación.' },
                voiceReason: { en: 'I want the mechanism in my own words, not a textbook sentence.', es: 'Quiero el mecanismo en mis propias palabras, no una oración de libro de texto.' },
                decisionRationale: { en: 'Making the link explicit, keeping my own phrasing.', es: 'Hago explícito el enlace y conservo mi propia formulación.' },
            },
        },
        stemArgument: {
            label: { en: 'Scientific argument', es: 'Argumento científico' },
            fullName: { en: 'Evidence-Based Scientific Argument', es: 'Argumento científico basado en evidencia' },
            headerLabel: { en: 'Scientific Argument', es: 'Argumento científico' },
            levelRules: 'The assignment is an EVIDENCE-BASED SCIENTIFIC ARGUMENT: the student argues for one claim over competing ones using evidence and reasoning, and addresses at least one alternative explanation. Unlike an explanation, a live disagreement is expected. Support the student in choosing evidence that could actually discriminate between claims, and in stating what their evidence cannot settle.',
            moves: [
                { id: 'question-claim', criticalKey: 'thinking',
                  en: 'Turn the question into an arguable claim', es: 'Convierte la pregunta en una afirmación discutible',
                  nudgeEn: 'State a claim a reasonable person could disagree with, given the evidence available.',
                  nudgeEs: 'Formula una afirmación con la que una persona razonable podría estar en desacuerdo, dada la evidencia disponible.',
                  whyEn: 'If no alternative is possible, there is nothing to argue and the evidence has no work to do.',
                  whyEs: 'Si no hay alternativa posible, no hay nada que argumentar y la evidencia no tiene trabajo que hacer.',
                  promptEn: 'My claim, and the alternative someone could reasonably hold instead…',
                  promptEs: 'Mi afirmación y la alternativa que alguien podría sostener razonablemente…',
                  deeperEn: 'Test the claim by asking what a competent person who disagrees would say. If nothing comes to mind, the claim is probably a statement of fact or a definition rather than an argument. Keep the claim within what your evidence could reach: a claim about all cases rarely survives evidence from one experiment, and narrowing it is a strengthening move, not a retreat.',
                  deeperEs: 'Prueba la afirmación preguntando qué diría una persona competente que discrepa. Si no se te ocurre nada, probablemente sea un hecho o una definición y no un argumento. Mantén la afirmación dentro de lo que tu evidencia puede alcanzar: una afirmación sobre todos los casos rara vez sobrevive a la evidencia de un solo experimento, y acotarla la fortalece, no la debilita.' },
                { id: 'evidence-selection', criticalKey: 'accuracy',
                  en: 'Choose evidence that can actually decide it', es: 'Elige evidencia que de verdad pueda decidirlo',
                  nudgeEn: 'Select the observations or data that would come out differently if your claim were wrong.',
                  nudgeEs: 'Selecciona las observaciones o datos que saldrían distintos si tu afirmación fuera incorrecta.',
                  whyEn: 'Evidence consistent with every possible claim cannot support any one of them.',
                  whyEs: 'La evidencia compatible con toda afirmación posible no puede respaldar ninguna.',
                  promptEn: 'The evidence I have, and what it would look like if I were wrong…',
                  promptEs: 'La evidencia que tengo y cómo se vería si yo estuviera equivocado/a…',
                  deeperEn: 'The strongest evidence is the kind that could have come out against you and did not. Record it exactly as measured, including the inconvenient parts — a discarded outlier is a decision that has to be stated, not a tidying step. Where your evidence comes from someone else\'s work, keep the source with it; where it is your own, keep the conditions with it.',
                  deeperEs: 'La evidencia más fuerte es la que pudo haber salido en tu contra y no lo hizo. Regístrala exactamente como se midió, incluidas las partes incómodas — descartar un valor atípico es una decisión que hay que declarar, no un paso de limpieza. Cuando la evidencia viene del trabajo de otra persona, conserva la fuente junto a ella; cuando es tuya, conserva las condiciones.',
                  exampleEn: [
                      ['Claim', 'What you are arguing'],
                      ['Evidence for', 'What supports it, exactly as recorded'],
                      ['Would look different if', 'What you would expect to see if the claim were wrong'],
                      ['Source or conditions', 'Where it came from, or how it was measured'],
                  ],
                  exampleEs: [
                      ['Afirmación', 'Lo que argumentas'],
                      ['Evidencia a favor', 'Lo que la respalda, tal como se registró'],
                      ['Se vería distinto si', 'Lo que esperarías ver si la afirmación fuera incorrecta'],
                      ['Fuente o condiciones', 'De dónde vino, o cómo se midió'],
                  ] },
                { id: 'reasoning-link', criticalKey: 'thinking',
                  en: 'Explain the reasoning that connects them', es: 'Explica el razonamiento que los conecta',
                  nudgeEn: 'Name the scientific principle or course concept that makes this evidence support this claim.',
                  nudgeEs: 'Nombra el principio científico o concepto del curso que hace que esta evidencia respalde esta afirmación.',
                  whyEn: 'Reasoning is what turns data next to a claim into data supporting a claim.',
                  whyEs: 'El razonamiento es lo que convierte datos junto a una afirmación en datos que la respaldan.',
                  promptEn: 'The principle or concept, and how it links my evidence to my claim…',
                  promptEs: 'El principio o concepto, y cómo enlaza mi evidencia con mi afirmación…',
                  deeperEn: 'In an argument the reasoning has to do more than connect: it has to explain why this evidence favours your claim over the alternative. Write it as a chain a reader can follow, and name the principle you are relying on. If the same reasoning would equally support the competing claim, it is not yet doing argumentative work.',
                  deeperEs: 'En un argumento el razonamiento debe hacer más que conectar: debe explicar por qué esta evidencia favorece tu afirmación por encima de la alternativa. Escríbelo como una cadena que el lector pueda seguir y nombra el principio en que te apoyas. Si el mismo razonamiento respaldaría igual a la afirmación rival, todavía no está haciendo trabajo argumentativo.' },
                { id: 'counterclaim-rebuttal', criticalKey: 'thinking',
                  en: 'Address the strongest alternative', es: 'Atiende la alternativa más fuerte',
                  nudgeEn: 'State the best competing explanation and say what evidence would distinguish it from yours.',
                  nudgeEs: 'Formula la mejor explicación rival y di qué evidencia la distinguiría de la tuya.',
                  whyEn: 'An argument that has met its strongest rival is far more convincing than one that names a weak one.',
                  whyEs: 'Un argumento que enfrentó a su rival más fuerte convence mucho más que uno que nombra a uno débil.',
                  promptEn: 'The strongest competing explanation, and what would tell them apart…',
                  promptEs: 'La explicación rival más fuerte y qué las distinguiría…',
                  deeperEn: 'Build the alternative at its strongest, in a form its own advocate would accept. Then be specific about what separates the two: often it is a measurement nobody has made yet, and saying so is a legitimate result. Rejecting an alternative because it is unfamiliar, or because your own is more convenient, is not a rebuttal.',
                  deeperEs: 'Construye la alternativa en su versión más fuerte, en una forma que su propio defensor aceptaría. Luego sé específico/a sobre qué las separa: muchas veces es una medición que nadie ha hecho todavía, y decirlo es un resultado legítimo. Rechazar una alternativa porque es desconocida, o porque la tuya es más conveniente, no es una refutación.' },
                { id: 'limits-uncertainty', criticalKey: 'accuracy',
                  en: 'State what your evidence cannot establish', es: 'Declara lo que tu evidencia no puede establecer',
                  nudgeEn: 'Name the scope, assumptions, and uncertainty your conclusion depends on.',
                  nudgeEs: 'Nombra el alcance, los supuestos y la incertidumbre de los que depende tu conclusión.',
                  whyEn: 'Stating a limit is how a scientific argument earns trust, not how it loses it.',
                  whyEs: 'Declarar un límite es como un argumento científico gana confianza, no como la pierde.',
                  promptEn: 'Scope, assumptions, sources of uncertainty, and what this cannot settle…',
                  promptEs: 'Alcance, supuestos, fuentes de incertidumbre y lo que esto no puede zanjar…',
                  deeperEn: 'Limitations are not an apology at the end; they define what your claim actually covers. Distinguish uncertainty in the measurement from uncertainty in the inference — a precise measurement can still support a shaky conclusion. Sample size, unexamined conditions, and assumptions you could not test all belong here, stated plainly enough that a reader could design the study that would settle it.',
                  deeperEs: 'Las limitaciones no son una disculpa al final; definen qué cubre realmente tu afirmación. Distingue la incertidumbre de la medición de la incertidumbre de la inferencia — una medición precisa puede sostener igual una conclusión frágil. El tamaño de la muestra, las condiciones no examinadas y los supuestos que no pudiste probar van aquí, declarados con la claridad suficiente para que alguien pudiera diseñar el estudio que lo zanjaría.' },
            ],
            review: { en: ['Claim, evidence, and reasoning', 'Counterclaim and rebuttal', 'Scope, uncertainty, and limitations'], es: ['Afirmación, evidencia y razonamiento', 'Contraargumento y refutación', 'Alcance, incertidumbre y limitaciones'] },
            lensKeys: ['accuracy', 'thinking', 'accuracy'],
            stuck: { en: 'Write the claim you would defend if someone disagreed with you right now, in one sentence.', es: 'Escribe en una oración la afirmación que defenderías si alguien te contradijera ahora mismo.' },
            reflect4: { en: 'What disciplinary knowledge, data, or observations shaped this argument — and what would change your mind?', es: '¿Qué conocimiento disciplinario, datos u observaciones dieron forma a este argumento — y qué te haría cambiar de opinión?' },
            tourExample: {
                moveId: 'counterclaim-rebuttal',
                excerpt: { en: 'The warmer tank grew more algae, which supports temperature as the driver. Light reaching the two tanks was not measured, so an unequal light source could produce the same result.', es: 'El tanque más cálido produjo más algas, lo que respalda la temperatura como causa. La luz que llegaba a los dos tanques no se midió, así que una fuente de luz desigual podría producir el mismo resultado.' },
                phrase: { en: 'an unequal light source could produce the same result', es: 'una fuente de luz desigual podría producir el mismo resultado' },
                suggestion: { en: 'You named the competing explanation instead of hiding it. Consider naming the measurement that would tell the two apart, so the reader knows what would settle it.', es: 'Nombraste la explicación rival en vez de ocultarla. Considera nombrar la medición que distinguiría las dos, para que el lector sepa qué lo zanjaría.' },
                before: { en: 'Something else might explain it.', es: 'Algo más podría explicarlo.' },
                after: { en: 'Light reaching the two tanks was not measured.', es: 'La luz que llegaba a los dos tanques no se midió.' },
            },
            discovery: {
                openingQuip: { en: 'Evidence that agrees with every possible answer has not helped you choose one.', es: 'La evidencia que concuerda con todas las respuestas posibles no te ayudó a elegir ninguna.' },
                concerns: [
                    { id: 'arguable', moveId: 'question-claim',
                      en: 'I’m not sure my claim is arguable.', es: 'No sé si mi afirmación es discutible.',
                      replyEn: 'Good instinct to check. A Move tests it against what someone who disagrees would say.',
                      replyEs: 'Buen instinto revisarlo. Una Movida la prueba contra lo que diría alguien que discrepa.' },
                    { id: 'which', moveId: 'evidence-selection',
                      en: 'I don’t know which data to use.', es: 'No sé qué datos usar.',
                      replyEn: 'Then we look for the data that would have come out differently if you were wrong.',
                      replyEs: 'Entonces buscamos los datos que habrían salido distintos si estuvieras equivocado/a.' },
                    { id: 'other', moveId: 'counterclaim-rebuttal',
                      en: 'Something else might explain my result.', es: 'Algo más podría explicar mi resultado.',
                      replyEn: 'Then say so — that is a Move here, not a weakness. We build the alternative and find what separates them.',
                      replyEs: 'Entonces dilo — aquí eso es una Movida, no una debilidad. Construimos la alternativa y buscamos qué las separa.' },
                ],
                moveNote: { en: 'Light was never measured across the two tanks. That is the alternative explanation I have to deal with.', es: 'Nunca se midió la luz en los dos tanques. Esa es la explicación alternativa que tengo que atender.' },
                voiceReason: { en: 'I want my own hedge kept — it says exactly how sure I am.', es: 'Quiero conservar mi propia matización — dice exactamente qué tan seguro/a estoy.' },
                decisionRationale: { en: 'Naming the measurement that would decide it, in my words.', es: 'Nombro la medición que lo decidiría, con mis palabras.' },
            },
        },
    };

    Object.entries(STEM_PROFILES).forEach(([profileId, config]) => {
        genres[profileId] = {
            label: config.label, fullName: config.fullName, headerLabel: config.headerLabel,
            tourExample: config.tourExample,
            discovery: config.discovery,
            coachRules: `${STEM_NO_VERIFICATION} ${config.levelRules}`,
            moves: {
                discover: config.moves.map(move => move.en),
                review: config.review.en,
                council: stemCouncilLabels('en'),
            },
        };
        genreMovesEs[profileId] = {
            discover: config.moves.map(move => move.es),
            review: config.review.es,
            council: stemCouncilLabels('es'),
        };
        integratedMoveProfiles[profileId] = config.moves.map(move => {
            const entry = { id: move.id, criticalKey: move.criticalKey, en: move.en, es: move.es,
                nudgeEn: move.nudgeEn, nudgeEs: move.nudgeEs, whyEn: move.whyEn, whyEs: move.whyEs,
                promptEn: move.promptEn, promptEs: move.promptEs };
            if (move.exampleEn) { entry.exampleEn = move.exampleEn; entry.exampleEs = move.exampleEs; }
            return entry;
        });
        moveDeeper[profileId] = Object.fromEntries(config.moves.map(move => [move.id, { en: move.deeperEn, es: move.deeperEs }]));
        lensCriticalKeys[profileId] = config.lensKeys;
        coachCriticalKeys[profileId] = 'accuracy';
        reflectionPrompt4[profileId] = config.reflect4;
        stuckStarters[profileId] = config.stuck;
        councilConfig[profileId] = stemCouncil();
    });

    // The lab report joins the same Council and the same safety contract; its
    // own Moves are unchanged.
    genres.stem.coachRules = `${STEM_NO_VERIFICATION} The assignment is a LAB OR METHODS REPORT: the student reports an investigation they carried out — question, method, observations, results, and what the results can and cannot show. Support the separation of observation from interpretation, and the honest reporting of outliers, uncertainty, and sources of error.`;
    genres.stem.moves.council = stemCouncilLabels('en');
    genreMovesEs.stem.council = stemCouncilLabels('es');
    councilConfig.stem = stemCouncil();
    stuckStarters.stem = {
        en: 'Write one observation exactly as you recorded it, before saying what you think it means.',
        es: 'Escribe una observación exactamente como la registraste, antes de decir qué crees que significa.',
    };

    // ── Reading Response / Reading Reflection ────────────────────────────────
    //
    // ONE pedagogical family, TWO configurations. Everything pedagogical — the
    // Moves, their deeper guidance, the source-integrity coach rules, the
    // reference notes, the review lenses — is authored once below. The
    // undergraduate and graduate configurations differ by DECLARED
    // CONFIGURATION (which Moves are visible, how each is framed, expected
    // length, lens wording), never by a second copy of the engine. Two Move ids
    // are literally shared between the levels; the rest are level-declared.
    //
    // The graduate configuration is not an inflated undergraduate one: it adds
    // counterinterpretation and disciplinary/methodological stakes as Moves of
    // their own, and reframes the claim Move as taking an interpretive position
    // rather than distinguishing response from summary.

    // Source integrity for the whole family. This reaches the model on every
    // request as additive GENRE GUIDANCE; it can never relax the authorship or
    // passage-protocol rules it is appended to.
    const READING_SOURCE_RULES = [
        'This is a reading response: the student is responding to a text assigned to them.',
        'Keep the assigned author\'s ideas and the student\'s own response distinct at every point; never blur them together or attribute one to the other.',
        'You have NOT read the assigned text. You have only whatever the student included in this request.',
        'Never invent, complete, correct, or supply a quotation, page number, line number, section reference, citation, bibliographic detail, publication fact, author biography, or claim about what the text says beyond what the student actually supplied.',
        'Never state or imply that you have read the assigned text, verified a quotation against its source, or confirmed a citation.',
        'When you have only a passage, notes, or partial context, say plainly which things cannot be checked from what you received, and ask for what you would need.',
        'Preserve the student\'s quoted material exactly as they wrote it; never silently normalize, translate, or tidy a quotation.',
        'Help with paraphrase by naming what an accurate paraphrase must do and by asking what the student understood — never by producing a paraphrase for them, and never by rewording source language so that copied wording passes as the student\'s own.',
        'Never ask the student to paste or upload an entire copyrighted reading.',
        'Summary is not automatically an error: brief context can be necessary for analysis. Distinguish unnecessary retelling from the context the student\'s argument actually needs.',
        'Multilingual, culturally situated, community, and lived-experience connections are legitimate analytical resources when the student chooses them. Never require them, and never treat their absence as a deficiency.',
    ].join(' ');

    // Shared Move authoring. Each entry holds the level-specific framing of one
    // shared pedagogical function, so the function is defined once.
    const READING_MOVES = {
        'text-and-question': {
            criticalKey: 'accuracy',
            ug: {
                en: 'Name the text and what you are answering',
                es: 'Nombra el texto y a qué respondes',
                nudgeEn: 'Name the reading, and the specific passage, idea, or assignment question you are actually responding to.',
                nudgeEs: 'Nombra la lectura y el pasaje, la idea o la pregunta de la tarea a la que realmente respondes.',
                whyEn: 'A reading response answers something specific. Naming it early keeps the piece from drifting into a summary of everything.',
                whyEs: 'Una respuesta de lectura contesta algo específico. Nombrarlo temprano evita que el texto se vuelva un resumen de todo.',
                promptEn: 'Title and author, the passage or idea I am responding to, and what the assignment asks…',
                promptEs: 'Título y autor/a, el pasaje o la idea a la que respondo, y qué pide la tarea…',
                deeperEn: 'Naming the text is not the same as summarizing it. Identify the reading, then narrow to the one passage, claim, or question you are answering — a response aimed at a specific thing is almost always stronger than one aimed at the whole reading. Only the context a reader genuinely needs belongs here; everything else is retelling. If the assignment asks a particular question, that question, not the reading as a whole, is what you are answering.',
                deeperEs: 'Nombrar el texto no es resumirlo. Identifica la lectura y luego enfócate en el pasaje, la afirmación o la pregunta que estás contestando — una respuesta dirigida a algo específico casi siempre es más fuerte que una dirigida a toda la lectura. Aquí solo cabe el contexto que el lector realmente necesita; lo demás es recuento. Si la tarea hace una pregunta puntual, esa pregunta, y no la lectura entera, es lo que respondes.',
            },
            grad: {
                en: 'Frame the text and the problem you are entering',
                es: 'Enmarca el texto y el problema en el que entras',
                nudgeEn: 'Name the text or texts, and the interpretive problem, tension, or question your response takes up.',
                nudgeEs: 'Nombra el texto o los textos y el problema, la tensión o la pregunta interpretativa que retoma tu respuesta.',
                whyEn: 'A seminar response enters an ongoing conversation. Framing the problem tells your reader which conversation this is.',
                whyEs: 'Una respuesta de seminario entra en una conversación en curso. Enmarcar el problema le dice al lector de cuál conversación se trata.',
                promptEn: 'The text or texts, the interpretive problem or tension, and the course conversation this enters…',
                promptEs: 'El texto o los textos, el problema o la tensión interpretativa, y la conversación del curso en la que esto entra…',
                deeperEn: 'At this level the framing does real analytical work: it establishes which problem is live, why it is a problem, and what is at stake in resolving it one way rather than another. Give only the context a disciplinary reader needs — they have likely read the text, so extended recapitulation costs you space you need for argument. If you are working across more than one text, say here what puts them in the same conversation.',
                deeperEs: 'En este nivel el encuadre hace trabajo analítico real: establece qué problema está vivo, por qué es un problema, y qué está en juego al resolverlo de una manera u otra. Da solo el contexto que necesita un lector disciplinario — probablemente ya leyó el texto, así que recapitular en extenso te cuesta el espacio que necesitas para argumentar. Si trabajas con más de un texto, di aquí qué los pone en la misma conversación.',
            },
        },
        'beyond-summary': {
            criticalKey: 'thinking',
            ug: {
                en: 'Say what you think, not only what it says',
                es: 'Di lo que piensas, no solo lo que dice',
                nudgeEn: 'Write the claim only you can make: what you argue, notice, question, or evaluate about this text.',
                nudgeEs: 'Escribe la afirmación que solo tú puedes hacer: qué argumentas, notas, cuestionas o evalúas sobre este texto.',
                whyEn: 'Brief context helps a reader follow you. Your response is what you add to it — and that is the part being asked for.',
                whyEs: 'Un poco de contexto ayuda al lector. Tu respuesta es lo que le agregas — y esa es la parte que te están pidiendo.',
                promptEn: 'What I claim, notice, doubt, or evaluate about this text — and what a reader might have assumed instead…',
                promptEs: 'Lo que afirmo, noto, dudo o evalúo sobre este texto — y lo que un lector podría haber supuesto en cambio…',
                deeperEn: 'The test is simple: could someone write your sentence without having an opinion? If yes, it is still summary. A real response takes a position — you find something persuasive, unconvincing, incomplete, surprising, or true in a way the author did not emphasize. Disagreement is welcome and so is agreement, as long as it is reasoned. You do not have to like the text, and you do not have to have the final word on it.',
                deeperEs: 'La prueba es sencilla: ¿alguien podría escribir tu oración sin tener una opinión? Si es así, todavía es resumen. Una respuesta real toma una posición — algo te parece convincente, poco convincente, incompleto, sorprendente o cierto de un modo que el autor no subrayó. El desacuerdo es bienvenido y el acuerdo también, siempre que esté razonado. No tienes que gustar del texto, ni tener la última palabra sobre él.',
                exampleEn: [
                    ['What the text says', 'The author’s point, in your own words, briefly'],
                    ['What I think', 'Your interpretation, evaluation, or question'],
                    ['Why it is not obvious', 'What a reader might have assumed instead'],
                ],
                exampleEs: [
                    ['Lo que dice el texto', 'El punto del autor, en tus palabras, brevemente'],
                    ['Lo que pienso', 'Tu interpretación, evaluación o pregunta'],
                    ['Por qué no es obvio', 'Lo que un lector podría haber supuesto en cambio'],
                ],
            },
        },
        'interpretive-position': {
            criticalKey: 'thinking',
            grad: {
                en: 'Stake an interpretive position',
                es: 'Toma una posición interpretativa',
                nudgeEn: 'State the reading you are advancing, and what theoretical or methodological commitments it rests on.',
                nudgeEs: 'Declara la lectura que propones y en qué compromisos teóricos o metodológicos se apoya.',
                whyEn: 'A position can be argued with. A reaction cannot, and a summary gives a reader nothing to take up.',
                whyEs: 'Con una posición se puede discutir. Con una reacción no, y un resumen no le da al lector nada que retomar.',
                promptEn: 'The reading I am advancing, the commitments behind it, and what it would mean if I am right…',
                promptEs: 'La lectura que propongo, los compromisos detrás de ella, y qué significaría si tengo razón…',
                deeperEn: 'Name the position and name where you are standing to hold it: a theoretical frame, a methodological preference, a disciplinary tradition, or a set of prior commitments about what counts as evidence. Making that standpoint explicit is not a weakness — it is what lets another reader locate, test, and argue with your reading rather than merely agreeing or not. Say what would follow if your reading is right, and be honest about what it cannot settle.',
                deeperEs: 'Nombra la posición y nombra desde dónde la sostienes: un marco teórico, una preferencia metodológica, una tradición disciplinaria o un conjunto de compromisos previos sobre qué cuenta como evidencia. Explicitar ese punto de partida no es una debilidad — es lo que permite a otro lector ubicar, probar y discutir tu lectura en vez de solo estar o no de acuerdo. Di qué se seguiría si tu lectura es correcta, y sé honesto/a sobre lo que no puede zanjar.',
                exampleEn: [
                    ['Position', 'The reading you are advancing'],
                    ['Standpoint', 'The theoretical or methodological commitments it rests on'],
                    ['At stake', 'What follows if this reading holds'],
                    ['Limit', 'What this reading cannot settle'],
                ],
                exampleEs: [
                    ['Posición', 'La lectura que propones'],
                    ['Punto de partida', 'Los compromisos teóricos o metodológicos que la sostienen'],
                    ['Lo que está en juego', 'Qué se sigue si esta lectura se sostiene'],
                    ['Límite', 'Lo que esta lectura no puede zanjar'],
                ],
            },
        },
        'passage-evidence': {
            criticalKey: 'accuracy',
            ug: {
                en: 'Hold the passage exactly, then explain it',
                es: 'Conserva el pasaje exacto y luego explícalo',
                nudgeEn: 'Copy the quotation, paraphrase, example, or detail exactly as it appears — then say how it supports your response.',
                nudgeEs: 'Copia la cita, la paráfrasis, el ejemplo o el detalle exactamente como aparece — y luego di cómo apoya tu respuesta.',
                whyEn: 'Evidence has to be represented accurately before it can support anything. The explanation is yours to write; the text will not write it.',
                whyEs: 'La evidencia debe representarse con exactitud antes de poder apoyar algo. La explicación te toca escribirla a ti; el texto no la escribe.',
                promptEn: 'The exact quotation or detail, where it comes from, and how it supports my point…',
                promptEs: 'La cita o el detalle exacto, de dónde viene, y cómo apoya mi punto…',
                deeperEn: 'Copy quoted words exactly — changing them, even to make them fit your sentence, misrepresents the text. Record where each one came from in whatever form your assignment asks, and record it while you have the reading in front of you rather than reconstructing it later. Then do the part that is actually yours: quoting is not explaining, and a quotation dropped in without commentary leaves the reader to guess what you saw in it. Paraphrase means restating in your own sentence structure and vocabulary, not swapping a few words.',
                deeperEs: 'Copia las palabras citadas exactamente — cambiarlas, aunque sea para que encajen en tu oración, tergiversa el texto. Anota de dónde viene cada una en el formato que pida tu tarea, y anótalo mientras tienes la lectura delante, no reconstruyéndolo después. Luego haz la parte que sí es tuya: citar no es explicar, y una cita puesta sin comentario deja al lector adivinando qué viste en ella. Parafrasear es reformular con tu propia estructura y vocabulario, no cambiar unas cuantas palabras.',
                exampleEn: [
                    ['Exact words', 'The quotation or detail, copied exactly as it appears'],
                    ['Where it is from', 'Page, section, or paragraph — whatever your assignment asks'],
                    ['What it shows', 'How it supports, complicates, or limits your response'],
                ],
                exampleEs: [
                    ['Palabras exactas', 'La cita o el detalle, copiado tal como aparece'],
                    ['De dónde viene', 'Página, sección o párrafo — lo que pida tu tarea'],
                    ['Qué muestra', 'Cómo apoya, complica o limita tu respuesta'],
                ],
            },
            grad: {
                en: 'Represent the evidence precisely',
                es: 'Representa la evidencia con precisión',
                nudgeEn: 'Quote or paraphrase with precision, locate it, and show how it supports, complicates, or limits your reading.',
                nudgeEs: 'Cita o parafrasea con precisión, ubícala, y muestra cómo apoya, complica o limita tu lectura.',
                whyEn: 'At this level a misquotation is not a slip — it is an argument resting on something the text does not say.',
                whyEs: 'En este nivel una cita mal hecha no es un desliz — es un argumento apoyado en algo que el texto no dice.',
                promptEn: 'The exact passage, its location, and how it supports, complicates, or limits my reading…',
                promptEs: 'El pasaje exacto, su ubicación, y cómo apoya, complica o limita mi lectura…',
                deeperEn: 'Precision here is an argumentative obligation, not a formatting chore: the strength of your reading is bounded by how accurately you represent what you are reading. Attend to what the passage does in its own context before recruiting it for yours — a line that supports you when isolated may not once its surrounding qualifications are restored. Say explicitly when your evidence complicates or limits your position rather than only when it supports it; that is a mark of a serious reading, not a concession.',
                deeperEs: 'La precisión aquí es una obligación argumentativa, no un trámite de formato: la fuerza de tu lectura está limitada por la exactitud con que representas lo que lees. Atiende a lo que hace el pasaje en su propio contexto antes de reclutarlo para el tuyo — una línea que te apoya aislada puede dejar de hacerlo cuando se restituyen sus matices. Di explícitamente cuándo tu evidencia complica o limita tu posición, no solo cuándo la apoya; eso es señal de una lectura seria, no una concesión.',
                exampleEn: [
                    ['Exact words', 'The passage, copied exactly as it appears'],
                    ['Location', 'Page, section, or paragraph, in the form your field expects'],
                    ['In its own context', 'What the passage is doing where it appears'],
                    ['In your argument', 'How it supports, complicates, or limits your reading'],
                ],
                exampleEs: [
                    ['Palabras exactas', 'El pasaje, copiado tal como aparece'],
                    ['Ubicación', 'Página, sección o párrafo, en la forma que espera tu campo'],
                    ['En su propio contexto', 'Qué hace el pasaje donde aparece'],
                    ['En tu argumento', 'Cómo apoya, complica o limita tu lectura'],
                ],
            },
        },
        'counterinterpretation': {
            criticalKey: 'thinking',
            grad: {
                en: 'Take the strongest competing reading seriously',
                es: 'Toma en serio la lectura rival más fuerte',
                nudgeEn: 'State the best reading that competes with yours, and say what it would take to decide between them.',
                nudgeEs: 'Formula la mejor lectura que compite con la tuya y di qué haría falta para decidir entre ambas.',
                whyEn: 'A response that has met its strongest objection is more convincing than one that has not met any.',
                whyEs: 'Una respuesta que enfrentó su objeción más fuerte convence más que una que no enfrentó ninguna.',
                promptEn: 'The competing reading at its strongest, what supports it, and what would decide between us…',
                promptEs: 'La lectura rival en su versión más fuerte, qué la apoya, y qué decidiría entre las dos…',
                deeperEn: 'Build the competing reading at its strongest, not at its most convenient — a version its own advocate would recognize. Then be specific about the disagreement: is it about what the text says, what it implies, what counts as evidence, or which question is worth asking? Naming the kind of disagreement usually matters more than declaring a winner, and it is entirely legitimate to conclude that the evidence available does not yet decide it.',
                deeperEs: 'Construye la lectura rival en su versión más fuerte, no en la más conveniente — una versión que su propio defensor reconocería. Luego sé específico/a sobre el desacuerdo: ¿es sobre lo que el texto dice, lo que implica, qué cuenta como evidencia, o cuál pregunta vale la pena hacer? Nombrar el tipo de desacuerdo suele importar más que declarar un ganador, y es del todo legítimo concluir que la evidencia disponible todavía no lo decide.',
            },
        },
        'why-it-matters': {
            criticalKey: 'thinking',
            ug: {
                en: 'Say why it matters, and what is still open',
                es: 'Di por qué importa y qué queda abierto',
                nudgeEn: 'Connect your response to the assignment, the course conversation, another text, or what you already know — and name what is still unresolved.',
                nudgeEs: 'Conecta tu respuesta con la tarea, la conversación del curso, otro texto o lo que ya sabes — y nombra qué queda sin resolver.',
                whyEn: 'Ending on an implication or a real question is stronger than restating the claim you already made.',
                whyEs: 'Terminar con una implicación o una pregunta real es más fuerte que repetir la afirmación que ya hiciste.',
                promptEn: 'What follows from this, what it connects to, and the question I still have…',
                promptEs: 'Qué se sigue de esto, con qué se conecta, y la pregunta que todavía tengo…',
                deeperEn: 'A connection counts when it is genuine — to the assignment, the course conversation, another reading, a disciplinary question, community knowledge, or your own experience. Reach for whichever of those actually applies, and skip the ones that do not; a forced connection reads as filler. Ending with an honest open question is not an admission that you failed to finish. It shows a reader where your thinking currently stops, which is more useful than a conclusion that pretends to close something the response did not close.',
                deeperEs: 'Una conexión cuenta cuando es genuina — con la tarea, la conversación del curso, otra lectura, una pregunta disciplinaria, el conocimiento comunitario o tu propia experiencia. Usa la que de verdad aplique y deja fuera las que no; una conexión forzada se lee como relleno. Terminar con una pregunta abierta y honesta no es admitir que no terminaste. Le muestra al lector dónde se detiene tu pensamiento ahora, lo cual es más útil que una conclusión que finge cerrar algo que la respuesta no cerró.',
            },
        },
        'disciplinary-stakes': {
            criticalKey: 'cultural',
            grad: {
                en: 'Name the disciplinary and methodological stakes',
                es: 'Nombra lo que está en juego disciplinaria y metodológicamente',
                nudgeEn: 'Say what your reading implies for the field\'s questions, methods, or the course conversation — and what remains open.',
                nudgeEs: 'Di qué implica tu lectura para las preguntas, los métodos o la conversación del curso — y qué queda abierto.',
                whyEn: 'A graduate response earns its length by mattering to something beyond the single text.',
                whyEs: 'Una respuesta de posgrado justifica su extensión al importar más allá del texto único.',
                promptEn: 'What this implies for the field\'s methods or questions, what it connects to, and what remains open…',
                promptEs: 'Qué implica esto para los métodos o las preguntas del campo, con qué se conecta, y qué queda abierto…',
                deeperEn: 'Stakes can be methodological (this reading would change how we study something), theoretical (it puts pressure on a concept the field relies on), or conversational (it revises how two texts have been read together). Community, multilingual, and practitioner knowledge are legitimate here when they genuinely bear on the question — treat them as knowledge, not as anecdote, and never as a required gesture. Close with what your reading leaves open, stated precisely enough that someone could take it up.',
                deeperEs: 'Lo que está en juego puede ser metodológico (esta lectura cambiaría cómo estudiamos algo), teórico (presiona un concepto del que depende el campo) o conversacional (revisa cómo se han leído juntos dos textos). El conocimiento comunitario, multilingüe y de la práctica es legítimo aquí cuando de verdad incide en la pregunta — trátalo como conocimiento, no como anécdota, y nunca como un gesto obligatorio. Cierra con lo que tu lectura deja abierto, formulado con la precisión suficiente para que alguien pueda retomarlo.',
            },
        },
    };

    // The two declared configurations.
    const READING_LEVELS = {
        readingUg: {
            level: 'ug',
            moveIds: ['text-and-question', 'beyond-summary', 'passage-evidence', 'why-it-matters'],
            label: { en: 'Reading response', es: 'Respuesta de lectura' },
            fullName: { en: 'Undergraduate Reading Response', es: 'Respuesta de lectura (licenciatura)' },
            headerLabel: { en: 'Reading Response', es: 'Respuesta de lectura' },
            lengthEn: 'Assignments in this family often ask for roughly 250–500 words — but your instructor’s directions govern. If they ask for something different, follow them.',
            lengthEs: 'Las tareas de este tipo suelen pedir aproximadamente 250–500 palabras — pero las indicaciones de tu instructor/a mandan. Si piden otra cosa, sigue eso.',
            levelRulesEn: 'This is an undergraduate short reading response; typical guidance is roughly 250 to 500 words, though the instructor\'s directions govern and may differ. Help the student tell apart what the text says, what they claim about it, which passage or detail supports that claim, and why it matters. Keep the analytical demand appropriate to a novice college writer without lowering it.',
            reviewEn: ['Response beyond summary', 'Evidence accuracy and explanation', 'Clarity and your own voice'],
            reviewEs: ['Respuesta más allá del resumen', 'Exactitud de la evidencia y explicación', 'Claridad y voz propia'],
            lensKeys: ['thinking', 'accuracy', 'voice'],
            stuckEn: 'Copy one sentence from the reading that you reacted to — agreement, confusion, or disagreement — and write what you thought when you read it.',
            stuckEs: 'Copia una oración de la lectura ante la que reaccionaste — acuerdo, confusión o desacuerdo — y escribe qué pensaste al leerla.',
            reflect4En: 'What did this text confirm, complicate, or change about your own thinking?',
            reflect4Es: '¿Qué confirmó, complicó o cambió este texto en tu manera de pensar?',
            tourExample: {
                moveId: 'beyond-summary',
                excerptEn: 'The author says access improved after the policy. My own campus got the same policy and the line at the office got longer, which makes me doubt that access and availability are the same thing.',
                excerptEs: 'El autor dice que el acceso mejoró tras la política. En mi propio campus aplicaron la misma política y la fila en la oficina se hizo más larga, lo que me hace dudar de que acceso y disponibilidad sean lo mismo.',
                phraseEn: 'access and availability are the same thing',
                phraseEs: 'acceso y disponibilidad sean lo mismo',
                suggestionEn: 'You have moved past summary into a real doubt. Consider naming the exact sentence in the reading that your doubt is answering, so a reader can follow you back to the text.',
                suggestionEs: 'Ya pasaste del resumen a una duda real. Considera nombrar la oración exacta de la lectura a la que responde tu duda, para que el lector pueda seguirte de vuelta al texto.',
                beforeEn: 'The author talks about access.',
                beforeEs: 'El autor habla del acceso.',
                afterEn: 'The author says access improved after the policy.',
                afterEs: 'El autor dice que el acceso mejoró tras la política.',
            },
            discovery: {
                openingQuip: {
                    en: 'You read the thing. Now the blank page would like to know what you thought about it.',
                    es: 'Ya leíste el texto. Ahora la página en blanco quiere saber qué pensaste.',
                },
                concerns: [
                    { id: 'summary', moveId: 'beyond-summary',
                      en: 'I just end up summarizing it.', es: 'Termino resumiéndolo y ya.',
                      replyEn: 'Very common, and fixable. One Move is built around the line between what the text says and what you think about it.',
                      replyEs: 'Muy común, y tiene arreglo. Hay una Movida hecha sobre la línea entre lo que dice el texto y lo que tú piensas de él.' },
                    { id: 'quote', moveId: 'passage-evidence',
                      en: 'I’m not sure how to use quotations.', es: 'No sé bien cómo usar las citas.',
                      replyEn: 'Then we start there: copy it exactly, say where it came from, and then write the part the quotation cannot write for you.',
                      replyEs: 'Empezamos por ahí: cópiala exacta, di de dónde viene, y luego escribe la parte que la cita no puede escribir por ti.' },
                    { id: 'opinion', moveId: 'text-and-question',
                      en: 'I don’t know if my opinion counts.', es: 'No sé si mi opinión cuenta.',
                      replyEn: 'It counts when it answers something specific in the reading. A Move helps you name exactly what you are answering.',
                      replyEs: 'Cuenta cuando responde a algo específico de la lectura. Una Movida te ayuda a nombrar exactamente a qué respondes.' },
                ],
                moveNote: {
                    en: 'The author says access improved. My campus got the same policy and the line got longer — that is the thing I actually want to argue about.',
                    es: 'El autor dice que el acceso mejoró. En mi campus aplicaron la misma política y la fila se alargó — eso es lo que de verdad quiero discutir.',
                },
                voiceReason: {
                    en: 'This is how I would say it out loud, and I want it to stay that way.',
                    es: 'Así lo diría en voz alta y quiero que se quede así.',
                },
                decisionRationale: {
                    en: 'Taking the point about naming the sentence, keeping my own wording.',
                    es: 'Acepto lo de nombrar la oración y conservo mis propias palabras.',
                },
            },
        },
        readingGrad: {
            level: 'grad',
            moveIds: ['text-and-question', 'interpretive-position', 'passage-evidence', 'counterinterpretation', 'disciplinary-stakes'],
            label: { en: 'Extended reading response', es: 'Respuesta de lectura extendida' },
            fullName: { en: 'Graduate Extended Reading Response', es: 'Respuesta de lectura extendida (posgrado)' },
            headerLabel: { en: 'Seminar Response', es: 'Respuesta de seminario' },
            lengthEn: 'Assignments in this family often ask for roughly 1,000–1,700 words, about two pages, or whatever your instructor defines — their directions govern.',
            lengthEs: 'Las tareas de este tipo suelen pedir aproximadamente 1,000–1,700 palabras, unas dos páginas, o lo que defina tu instructor/a — sus indicaciones mandan.',
            levelRulesEn: 'This is a graduate extended reading response, typically about 1,000 to 1,700 words or as the instructor defines. Expect and support genuine analytical complexity: synthesis across ideas or texts, theoretical positioning, counterinterpretation, methodological reflection, disciplinary implications, and connection to broader course questions. Do not treat it as a longer undergraduate response, and do not coach it toward summary-plus-reaction.',
            reviewEn: ['Interpretive position and stakes', 'Textual precision and evidence', 'Synthesis, counterinterpretation, and disciplinary voice'],
            reviewEs: ['Posición interpretativa y lo que está en juego', 'Precisión textual y evidencia', 'Síntesis, contralectura y voz disciplinaria'],
            lensKeys: ['thinking', 'accuracy', 'voice'],
            stuckEn: 'Name one claim in the text you are not ready to accept, and copy the passage that makes you hesitate.',
            stuckEs: 'Nombra una afirmación del texto que no estás listo/a para aceptar, y copia el pasaje que te hace dudar.',
            reflect4En: 'What theoretical or disciplinary commitments shaped how you read this text, and what would a differently situated reader notice?',
            reflect4Es: '¿Qué compromisos teóricos o disciplinarios dieron forma a tu lectura de este texto, y qué notaría alguien situado/a de otra manera?',
            tourExample: {
                moveId: 'interpretive-position',
                excerptEn: 'Read alongside the earlier chapter, the argument depends on treating participation as an outcome rather than a process. That move is what makes the conclusion available, and it is also what I want to contest.',
                excerptEs: 'Leído junto al capítulo anterior, el argumento depende de tratar la participación como resultado y no como proceso. Ese movimiento es lo que hace disponible la conclusión, y es también lo que quiero disputar.',
                phraseEn: 'as an outcome rather than a process',
                phraseEs: 'como resultado y no como proceso',
                suggestionEn: 'The position is stated and located in the text. Consider naming what would count as evidence against it, so a reader can see where the argument could fail.',
                suggestionEs: 'La posición está declarada y ubicada en el texto. Considera nombrar qué contaría como evidencia en contra, para que el lector vea dónde podría fallar el argumento.',
                beforeEn: 'The argument has a problem with participation.',
                beforeEs: 'El argumento tiene un problema con la participación.',
                afterEn: 'The argument depends on treating participation as an outcome rather than a process.',
                afterEs: 'El argumento depende de tratar la participación como resultado y no como proceso.',
            },
            discovery: {
                openingQuip: {
                    en: 'Summarizing is the warm-up. The seminar wants the argument you would actually defend.',
                    es: 'Resumir es el calentamiento. El seminario quiere el argumento que de verdad defenderías.',
                },
                concerns: [
                    { id: 'position', moveId: 'interpretive-position',
                      en: 'I have reactions, not a position.', es: 'Tengo reacciones, no una posición.',
                      replyEn: 'That is the gap this genre lives in. A Move turns the reaction into a reading someone could argue with.',
                      replyEs: 'Ese es justo el hueco donde vive este género. Una Movida convierte la reacción en una lectura con la que alguien podría discutir.' },
                    { id: 'objection', moveId: 'counterinterpretation',
                      en: 'I can’t tell if my reading holds up.', es: 'No sé si mi lectura se sostiene.',
                      replyEn: 'Then we test it against its strongest rival — that is a Move of its own here, not an afterthought.',
                      replyEs: 'Entonces la probamos contra su rival más fuerte — aquí eso es una Movida propia, no un añadido final.' },
                    { id: 'stakes', moveId: 'disciplinary-stakes',
                      en: 'Why does this matter beyond the text?', es: '¿Por qué importa esto más allá del texto?',
                      replyEn: 'Good question to ask early. A Move is about exactly that: methods, concepts, and the conversation this enters.',
                      replyEs: 'Buena pregunta para hacerse temprano. Hay una Movida sobre justo eso: métodos, conceptos y la conversación en la que esto entra.' },
                ],
                moveNote: {
                    en: 'The argument treats participation as an outcome, not a process. Read against the earlier chapter, that is what makes the conclusion available — and contestable.',
                    es: 'El argumento trata la participación como resultado, no como proceso. Leído contra el capítulo anterior, eso es lo que hace disponible la conclusión — y disputable.',
                },
                voiceReason: {
                    en: 'This phrasing carries the distinction my whole reading depends on.',
                    es: 'Esta formulación lleva la distinción de la que depende toda mi lectura.',
                },
                decisionRationale: {
                    en: 'Adding what would count against me, in my own terms.',
                    es: 'Agrego qué contaría en mi contra, en mis propios términos.',
                },
            },
        },
    };

    // Build both configurations from the shared authoring above.
    Object.entries(READING_LEVELS).forEach(([profileId, config]) => {
        const level = config.level;
        const moves = config.moveIds.map(moveId => {
            const shared = READING_MOVES[moveId];
            const framing = shared[level];
            if (!framing) throw new Error(`Reading Response: Move "${moveId}" has no ${level} framing`);
            const move = { id: moveId, criticalKey: shared.criticalKey, en: framing.en, es: framing.es,
                nudgeEn: framing.nudgeEn, nudgeEs: framing.nudgeEs, whyEn: framing.whyEn, whyEs: framing.whyEs,
                promptEn: framing.promptEn, promptEs: framing.promptEs };
            if (framing.exampleEn) { move.exampleEn = framing.exampleEn; move.exampleEs = framing.exampleEs; }
            return move;
        });

        genres[profileId] = {
            label: config.label, fullName: config.fullName, headerLabel: config.headerLabel,
            tourExample: {
                moveId: config.tourExample.moveId,
                excerpt: { en: config.tourExample.excerptEn, es: config.tourExample.excerptEs },
                phrase: { en: config.tourExample.phraseEn, es: config.tourExample.phraseEs },
                suggestion: { en: config.tourExample.suggestionEn, es: config.tourExample.suggestionEs },
                before: { en: config.tourExample.beforeEn, es: config.tourExample.beforeEs },
                after: { en: config.tourExample.afterEn, es: config.tourExample.afterEs },
            },
            discovery: config.discovery,
            // Additive GENRE GUIDANCE carried to the coach on every request.
            coachRules: `${READING_SOURCE_RULES} ${config.levelRulesEn}`,
            // Quiet reference material in the Moves rail — never a submission rule.
            referenceNotes: [
                { title: { en: 'How long should this be?', es: '¿De qué extensión debe ser?' },
                  body: { en: config.lengthEn, es: config.lengthEs } },
                { title: { en: 'Working with the reading', es: 'Trabajar con la lectura' },
                  body: {
                      en: 'Tu Pana has not read your assigned text. It only ever sees what you choose to send, and it will say so rather than guess. It will never supply a quotation, page number, or citation for you, and it cannot confirm that a quotation matches the source — that check is yours to make against the reading itself.',
                      es: 'Tu Pana no ha leído tu texto asignado. Solo ve lo que tú decides enviar, y lo dirá en vez de adivinar. Nunca te dará una cita, un número de página ni una referencia, y no puede confirmar que una cita coincida con la fuente — esa comprobación te toca hacerla contra la lectura misma.' } },
            ],
            moves: {
                discover: moves.map(move => move.en),
                review: config.reviewEn,
                council: [],
            },
        };
        genreMovesEs[profileId] = {
            discover: moves.map(move => move.es),
            review: config.reviewEs,
            council: [],
        };
        integratedMoveProfiles[profileId] = moves;
        moveDeeper[profileId] = Object.fromEntries(config.moveIds.map(moveId => {
            const framing = READING_MOVES[moveId][level];
            return [moveId, { en: framing.deeperEn, es: framing.deeperEs }];
        }));
        lensCriticalKeys[profileId] = config.lensKeys;
        coachCriticalKeys[profileId] = 'accuracy';
        reflectionPrompt4[profileId] = { en: config.reflect4En, es: config.reflect4Es };
        stuckStarters[profileId] = { en: config.stuckEn, es: config.stuckEs };
        // DECISION: the Reading Response Council stays DISABLED. No bounded,
        // separately coherent Council configuration exists for this family, and
        // inventing reviewer roles for it would mean either relabelling general
        // writing roles or shipping a source-integrity surface that has never
        // been proven safe. Focused review and Ask Tu Pana are fully operational
        // here and carry the same source rules.
        councilConfig[profileId] = {
            enabled: false,
            criticalKey: 'accuracy',
            disabledReason: {
                en: 'The Council is not available for reading responses yet. A Council reads a developed draft through several perspectives at once, and the perspectives for responding to someone else’s text have not been built or checked for safety. Focused review and Ask Tu Pana work fully here.',
                es: 'El Consejo todavía no está disponible para respuestas de lectura. Un Consejo lee un borrador desarrollado desde varias perspectivas a la vez, y las perspectivas para responder al texto de otra persona no se han construido ni verificado. La lectura enfocada y Preguntar a Tu Pana funcionan completamente aquí.',
            },
        };
    });

    // Assignment-id resolution. Legacy links keep working; every alias maps to an
    // explicit profile. Unknown ids return null (the interface stops loudly).
    const ASSIGNMENT_ALIASES = {
        'mixed-genre-autobiographical-essay': { profileId: 'autobiographical' },
        'college-personal-statement': { profileId: 'admissions' },
        'graduate-sop': { profileId: 'sop' },
        'stem-lab-report': { profileId: 'stem' },
        'stem-methods-report': { profileId: 'stem' },
        'stem-scientific-explanation': { profileId: 'stemExplanation' },
        'scientific-explanation': { profileId: 'stemExplanation' },
        'stem-scientific-argument': { profileId: 'stemArgument' },
        'evidence-based-scientific-argument': { profileId: 'stemArgument' },
        'research-paper': { profileId: 'research' },
        'cap200-bronx-beautiful-service-learning': { profileId: 'cap200' },
        'cap-200-first-draft': {
            profileId: 'cap200',
            notice: {
                en: 'This CAP 200 link now opens the full service-learning writing project.',
                es: 'Este enlace de CAP 200 ahora abre el proyecto completo de aprendizaje-servicio.',
            },
        },
        'general-writing': { profileId: 'neutral' },
        // Reading Response: the level is pedagogically load-bearing, so every
        // link states it. A bare `reading-response` or `reading-reflection` is
        // deliberately NOT mapped: it would have to guess a level, and guessing
        // wrong hands a graduate seminar writer a novice scaffold, or the
        // reverse. Unmapped ids reach the configuration-required stop, which
        // offers recovery to the selection screen where both are listed.
        'reading-response-undergraduate': { profileId: 'readingUg' },
        'reading-reflection-undergraduate': { profileId: 'readingUg' },
        'reading-response-graduate': { profileId: 'readingGrad' },
        'reading-reflection-graduate': { profileId: 'readingGrad' },
        'readingUg': { profileId: 'readingUg' },
        'readingGrad': { profileId: 'readingGrad' },
        'autobiographical': { profileId: 'autobiographical' },
        'admissions': { profileId: 'admissions' },
        'sop': { profileId: 'sop' },
        // A bare `stem` is deliberately NOT mapped. Three bounded STEM genres now
        // exist, and an unqualified STEM link cannot say which one the student
        // was assigned. Guessing would hand a lab-report scaffold to someone
        // writing an argument. It fails closed to the configuration-required
        // stop, which lists all three.
        'research': { profileId: 'research' },
        'cap200': { profileId: 'cap200' },
        'neutral': { profileId: 'neutral' },
    };

    function resolveAssignment(rawId) {
        if (!rawId || typeof rawId !== 'string') return null;
        const entry = ASSIGNMENT_ALIASES[rawId.trim()];
        if (!entry || !genres[entry.profileId]) return null;
        return { profileId: entry.profileId, notice: entry.notice || null };
    }

    window.StudioProfiles = {
        genres, genreMovesEs, integratedMoveProfiles, criticalQuestions,
        councilConfig, lensCriticalKeys, coachCriticalKeys, reflectionPrompt4,
        stuckStarters, moveDeeper, resolveAssignment,
    };
}());
