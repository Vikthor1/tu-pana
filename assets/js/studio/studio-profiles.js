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
            sample: 'At the neighborhood library, I answered my aunt in English until she said, “aquí escuchamos primero.” I had treated translation as a quick exchange of words. Her phrase made me notice who was expected to adapt, whose knowledge counted, and why language access is also a question of power. This synthetic essay connects that chosen memory to a larger history of public institutions and multilingual communities without asking any student to disclose a private family story.',
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
            sample: 'The first week at the neighborhood learning center, I designed a color-coded signup sheet because I thought efficiency was the problem. By Friday, I understood that the real problem was trust. Families did not need a faster form; they needed someone to explain what the form would change. I began sitting beside each visitor, listening before writing. That shift—from solving the visible task to understanding the human need—now guides how I approach community technology and the questions I hope to study in college.',
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
            sample: 'The basil seedlings exposed to eight hours of light grew an average of 2.4 centimeters more than the seedlings exposed to four hours. This result supports the prediction that longer light exposure increases early stem growth under otherwise controlled conditions. The small sample size and one unusually tall seedling limit the strength of the conclusion. A second trial with more plants and randomized tray positions would test whether the pattern persists.',
            moves: {
                discover: ['State the research question and prediction', 'Separate observation from interpretation', 'Connect the result to the evidence'],
                review: ['Claim–evidence alignment', 'Methods and reproducibility', 'Limitations and precision'],
                council: ['Lab instructor', 'Methods reviewer', 'Scientific clarity editor'],
            },
        },
        sop: {
            label: { en: 'Graduate statement of purpose', es: 'Carta de propósito para posgrado' },
            // Rendered names (label above stays untouched for stored record provenance):
            fullName: { en: 'Graduate Statement of Purpose', es: 'Carta de propósito para posgrado' },
            headerLabel: { en: 'Statement of Purpose', es: 'Carta de propósito' },
            sample: 'My work on a public transit accessibility project showed me how technical decisions become public consequences. I entered the project focused on routing efficiency and left asking how disabled riders could shape the systems intended to serve them. Graduate study in human-centered computing would let me build the research methods needed to investigate that question with rigor. I hope to study participatory design, accessible infrastructure, and the ways public institutions can evaluate whether technology expands meaningful access.',
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
            sample: 'This synthetic draft begins with a clear purpose, develops one idea with concrete evidence, and leaves room for the writer to decide what should change next. The language is intentionally neutral so that no assignment inherits expectations from an unrelated genre.',
            moves: {
                discover: ['Clarify the purpose and audience', 'Choose relevant evidence', 'Arrange ideas so the reader can follow'],
                review: ['Purpose and clarity', 'Structure and evidence', 'Voice and precision'],
                council: ['Audience reader', 'Structure reviewer', 'Voice advocate'],
            },
        },
        cap200: {
            label: { en: 'CAP 200 service-learning report', es: 'Reporte de aprendizaje-servicio CAP 200' },
            // Rendered names (label above stays untouched for stored record provenance):
            fullName: { en: 'CAP 200 Service-Learning Report', es: 'Reporte de aprendizaje-servicio CAP 200' },
            headerLabel: { en: 'Service-Learning Report', es: 'Aprendizaje-servicio' },
            sample: 'During my ten hours at the neighborhood food pantry, I logged each shift and kept a short journal after every visit. By the third week, my notes showed a pattern: volunteers spent as much time explaining eligibility rules as they did handing out groceries. That observation connected directly to our course concept of structural barriers to access. This synthetic report draws on real logged hours and journal entries — no interview or statistic here was invented — to argue that confusion, not scarcity, was the persistent obstacle.',
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
            sample: 'Community gardens are often described as solutions to food insecurity, but the sources I have gathered disagree about how much they actually help. One source measures diet change directly; another focuses on social connection and civic participation instead. Placed side by side, they suggest the benefit may be real but different from what garden advocates usually claim. This synthetic paragraph models how a research paragraph puts sources in conversation rather than summarizing them one at a time — no source named here is real.',
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
            prohibitions: [
                'Never predict admission outcomes or competitiveness, or compare the writer with other applicants.',
                'Never recommend adding achievements, experiences, or qualities the draft does not state.',
                'Never push the writer toward a prestige-coded or culturally narrow template.',
            ],
        },
        stem: { enabled: false, criticalKey: 'accuracy' },
        sop: {
            enabled: true, synthesisOrder: ['evidence', 'structure', 'voice'], criticalKey: 'cultural',
            roles: councilRoles('sop', {
                structure: 'Assess trajectory without demanding chronology for its own sake.',
                evidence: 'Preparation claims need named projects, methods, results, or sources the draft itself states.',
                voice: 'Protect the applicant\'s voice against generic admissions-speak.',
            }),
            prohibitions: [
                'Never predict admission chances.',
                'Never claim experience or preparation the draft does not state.',
            ],
        },
        neutral: { enabled: true, synthesisOrder: ['structure', 'evidence', 'voice'], criticalKey: 'cultural', roles: councilRoles('neutral') },
        cap200: {
            enabled: true, synthesisOrder: ['evidence', 'structure', 'voice'], criticalKey: 'accuracy',
            roles: councilRoles('cap200', {
                evidence: 'Evidence means real logged hours, observations, journals, interviews, and surveys the draft reports.',
                voice: 'Flag any framing that describes the community in deficit terms.',
            }),
            prohibitions: [
                'Never suggest inventing or embellishing service activities, hours, partners, or data.',
                'Never recommend framing the community in deficit terms.',
            ],
        },
        research: {
            enabled: true, synthesisOrder: ['evidence', 'structure', 'voice'], criticalKey: 'accuracy',
            roles: councilRoles('research', {
                evidence: 'Claims must be traceable to the draft\'s own sources; student analysis must be distinguishable from summary.',
            }),
            prohibitions: [
                'Never invent sources, titles, authors, quotations, or citation details.',
            ],
        },
    };

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

    // Assignment-id resolution. Legacy links keep working; every alias maps to an
    // explicit profile. Unknown ids return null (the interface stops loudly).
    const ASSIGNMENT_ALIASES = {
        'mixed-genre-autobiographical-essay': { profileId: 'autobiographical' },
        'college-personal-statement': { profileId: 'admissions' },
        'graduate-sop': { profileId: 'sop' },
        'stem-lab-report': { profileId: 'stem' },
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
        'autobiographical': { profileId: 'autobiographical' },
        'admissions': { profileId: 'admissions' },
        'sop': { profileId: 'sop' },
        'stem': { profileId: 'stem' },
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
