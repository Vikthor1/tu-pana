// Tu Pana de Escritura — genre-template.js
// Feature flags, app configuration, stable stage IDs, authorship gate,
// the default genre template, and the genre registry.
// No DOM access. No UI. No providers. Loads after data.js.

// ════════════════════════════════════════════════════════
//  FEATURE FLAGS — all future features disabled by default
//  No UI is exposed for any of these. Toggle here only.
// ════════════════════════════════════════════════════════
const FEATURES = {
    genreSelection:      false,  // future: genre picker in UI
    courseModeSelection: false,  // future: course-mode picker in UI
    spanishL2Mode:       false,  // future: Spanish L2 course mode
    heritageSpanishMode: false,  // future: Heritage Spanish course mode
    geminiProvider:      true,   // Gemini Flash-Lite via Cloudflare Worker proxy
    instructorSettings:  false,  // future: instructor configuration panel
    // Patch 12: human-recorded audio asset playback. Browser TTS permanently disabled.
    // Spanish narrations in assets/audio/es/ (01–07). English deferred.
    // When false: no audio buttons render, no Audio objects created.
    audioInstructions:   true
};

// ════════════════════════════════════════════════════════
//  APP CONFIGURATION — default assignment context
//  Not exposed as a visible setting. Internal reference only.
// ════════════════════════════════════════════════════════
const APP_CONFIG = {
    appVersion:     '1.0',
    schemaVersion:  '1.0',
    courseMode:     'ell-academic-writing',
    genre:          'mixed-genre-autobiographical-essay',
    targetLanguage: 'english',
    studentLevel:   'first-year-college'
};

// ════════════════════════════════════════════════════════
//  STABLE STAGE IDS — internal IDs independent of visible labels
//  App logic should use these, not numeric IDs or stage names.
// ════════════════════════════════════════════════════════
const STAGE_IDS = {
    1:  'stage.anecdote',
    2:  'stage.connection',
    3:  'stage.topic_pitch',
    4:  'stage.research',
    5:  'stage.outline',
    6:  'stage.first_draft',
    7:  'stage.revision',
    8:  'stage.voice_polish',
    9:  'stage.checklist',
    10: 'stage.reflection'
};

// ════════════════════════════════════════════════════════
//  AUTHORSHIP GATE — core writing-process engine rule
//  Lives here so it is genre-independent and always enforced.
// ════════════════════════════════════════════════════════
const AUTHORSHIP_GATE = {
    requiredBefore: [
        'stage.revision',
        'stage.voice_polish',
        'stage.checklist',
        'stage.reflection'
    ],
    requirement: 'student_saved_first_draft',
    gateStage:   6,
    message: 'Before I can give paragraph-level revision feedback, you need to save a first draft that you wrote yourself.'
};

// ════════════════════════════════════════════════════════
//  DEFAULT GENRE TEMPLATE — mixed-genre autobiographical essay
//  coachFocus values must match the system prompt rules exactly.
//  Display titles / descriptions stay in data.js STAGES array.
// ════════════════════════════════════════════════════════
const mixedGenreAutobiographicalEssay = {
    templateId:          'mixed-genre-autobiographical-essay',
    templateName:        'Mixed-Genre Autobiographical Essay',
    templateDescription: 'Guides students from personal memory to social analysis.',
    courseMode:          'ell-academic-writing',
    targetLanguage:      'english',
    studentLevel:        'first-year-college',
    authorshipGate:      AUTHORSHIP_GATE,
    stages: [
        {
            id:      'stage.anecdote',
            number:  1,
            titleEs: 'Anécdota',
            titleEn: 'Anecdote',
            phase:   'Discover',
            coachFocus: 'Help the student find or sharpen a specific memory. A Stage 1 anecdote is ready when it has three elements: a specific place, a specific person or relationship, and a moment when something shifted or changed. When all three elements are present, the stage is complete — affirm what is strong and encourage the student to move to Stage 2. Do not push for more sensory detail or specificity once these elements exist. On the first response: name one specific strength, identify at most 2 areas to improve, and ask no more than 2 questions — never 4 or 5 questions at once. After the student has revised once or twice and the text is meaningfully richer, shift to affirmation and forward momentum. Do not write the anecdote for them. Do not generate any sentence, phrase, or memory that the student could copy into their draft.',
            allowedSupport: ['questions', 'feedback', 'sensory-detail prompts', 'forward-momentum affirmation', 'good-enough-for-this-stage signals'],
            blockedSupport: ['write anecdote', 'generate memory', 'invent story', 'push for more detail once core elements are present', 'ask 4 or more questions at once']
        },
        {
            id:      'stage.connection',
            number:  2,
            titleEs: 'Conexión',
            titleEn: 'Connection',
            phase:   'Discover',
            coachFocus: 'Help the student connect a memory to a larger historical, social, cultural, linguistic, racial, migration-related, gendered, economic, or political force. Teach the idea of a bridge sentence but do not write it for them.',
            allowedSupport: ['questions', 'feedback', 'bridge-sentence frame (blanks only)'],
            blockedSupport: ['write bridge sentence', 'write connection', 'supply context']
        },
        {
            id:      'stage.topic_pitch',
            number:  3,
            titleEs: 'Tu Pitch',
            titleEn: 'Topic Pitch',
            phase:   'Build',
            coachFocus: 'Stage 3 is about pitch, tension, and emerging argument — not memory development (Stage 1) or finding a connection (Stage 2). When the student shares a pitch, identify the tension in their own words: name the personal side and the larger-issue side. Ask one focused question to help them sharpen the argument direction. Do not ask "how did you feel?" unless it is directly tied to argument. Do not send them back to the memory or back to Stage 2 connection questions. A strong pitch names what pulls in two directions and answers: what does this essay argue? Do not write the pitch for them.',
            allowedSupport: ['tension identification from student\'s own words', 'argument-direction questions', 'pitch checklist', 'personal side / larger issue contrast', 'blank tension frame with placeholders: "My essay argues that ___ because ___"', 'focus suggestions'],
            blockedSupport: ['write pitch', 'generate thesis', 'supply argument', 'Stage 1 memory-development questions', 'Stage 2 feeling/connection questions not tied to argument', 'full revised pitch']
        },
        {
            id:      'stage.research',
            number:  4,
            titleEs: 'Investigación',
            titleEn: 'Research',
            phase:   'Build',
            coachFocus: 'Suggest research directions, keywords, kinds of sources, and questions to investigate. Do not invent sources, titles, authors, quotations, URLs, or citations.',
            allowedSupport: ['search keywords', 'database suggestions', 'source-type guidance', 'research questions'],
            blockedSupport: ['invent sources', 'generate citations', 'fabricate quotations', 'write bibliography', 'formatted citation examples', 'bibliographic entries even as examples']
        },
        {
            id:      'stage.outline',
            number:  5,
            titleEs: 'Esquema',
            titleEn: 'Outline',
            phase:   'Build',
            coachFocus: 'If the student has not written their own outline, ask them to draft one first. Do not generate an outline for them. If they provide an outline, give feedback.',
            allowedSupport: ['feedback on student outline', 'blank scaffold (slots only)', 'questions'],
            blockedSupport: ['generate outline', 'write section titles', 'fill in outline items']
        },
        {
            id:      'stage.first_draft',
            number:  6,
            titleEs: 'Primer Borrador',
            titleEn: 'First Draft',
            phase:   'Build',
            coachFocus: 'This is the unassisted first-draft stage. Do not provide paragraph-level revision feedback until the student has saved a first draft. Encourage the student to keep drafting in their own words.',
            allowedSupport: ['encouragement', 'stuck prompts', 'micro-tasks'],
            blockedSupport: ['paragraph revision', 'rewriting', 'draft generation', 'outline completion']
        },
        {
            id:      'stage.revision',
            number:  7,
            titleEs: 'Revisión',
            titleEn: 'Revision',
            phase:   'Refine',
            coachFocus: 'Revision feedback must be paragraph-level and organized around the Five Questions: 1. Accuracy  2. Voice  3. Specificity  4. Thinking  5. Cultural Knowledge. Do not rewrite the paragraph. Give feedback and suggestions only.',
            allowedSupport: ['paragraph-level feedback', 'five-question protocol', 'targeted questions'],
            blockedSupport: ['rewrite paragraph', 'generate replacement sentence', 'polish prose']
        },
        {
            id:      'stage.voice_polish',
            number:  8,
            titleEs: 'Pulir Voz',
            titleEn: 'Voice Polish',
            phase:   'Refine',
            coachFocus: 'Voice Polish must preserve the student\'s voice, code-switching, Spanglish, family language, neighborhood language, dialectal choices, and culturally meaningful phrasing. Do not flatten the writing into generic academic English. Honor protected Voice Vault phrases. Do not provide a full rewritten sentence, polished alternative, or copy-paste-ready version of the student\'s sentence — identify what the sentence might need and suggest a route; the student writes the revision.',
            allowedSupport: ['voice comparison questions', 'read-aloud prompts', 'Voice Vault feedback', 'blank sentence frames with placeholders only', 'route labels', 'word-level suggestions', 'revision questions', 'try-adding-X guidance'],
            blockedSupport: ['flatten voice', 'replace dialectal phrasing', 'rewrite for academic register', 'copy-paste replacement sentences', 'polished alternative versions', 'better version examples', 'full rewritten sentences']
        },
        {
            id:      'stage.checklist',
            number:  9,
            titleEs: 'Checklist',
            titleEn: 'Checklist',
            phase:   'Complete',
            coachFocus: 'Help the student check readiness. Do not write missing sections for them.',
            allowedSupport: ['readiness questions', 'checklist review', 'revision decision prompts'],
            blockedSupport: ['write missing sections', 'generate process note', 'complete checklist for student']
        },
        {
            id:      'stage.reflection',
            number:  10,
            titleEs: 'Mi Cierre de Proceso',
            titleEn: 'My Writing Snapshot',
            phase:   'Complete',
            coachFocus: 'Help the student reflect on their own process. Do not write the student\'s self-assessment for them.',
            allowedSupport: ['reflection questions', 'capstone prompts', 'process summary guidance'],
            blockedSupport: ['write self-assessment', 'generate instructor report', 'complete capstone for student']
        }
    ]
};

// ════════════════════════════════════════════════════════
//  GENRE TEMPLATE REGISTRY
//  Only one template exists now. New templates registered here later.
// ════════════════════════════════════════════════════════
const genreTemplateRegistry = {
    'mixed-genre-autobiographical-essay': mixedGenreAutobiographicalEssay
};

// ════════════════════════════════════════════════════════
//  TEMPLATE LOADER
//  Returns the active template. When FEATURES.genreSelection is
//  enabled, this will read APP_CONFIG.genre and support switching.
// ════════════════════════════════════════════════════════
function getActiveTemplate() {
    return genreTemplateRegistry[APP_CONFIG.genre] || mixedGenreAutobiographicalEssay;
}

// ════════════════════════════════════════════════════════
//  GENERIC SERVICE-LEARNING GENRE FOUNDATION (Stage B)
//  A reusable, institution-agnostic service-learning writing layer.
//  Contains NO course-specific values. A course (CAP 200, or any future
//  college/course) becomes a PROFILE on top of this type by supplying a
//  config object that matches SERVICE_LEARNING_PROFILE_SCHEMA — see Batch 3.
//  This engine must never contain CAP-200-specific strings.
//  Pure data + pure functions. No DOM. No providers.
//
//  It does NOT add engine stages: the stable 10-stage core is unchanged.
//  The service-learning "moves" below map onto the existing stages and shape
//  only the additive ASSIGNMENT CONTEXT that the coach prompt receives. The
//  global authorship gate (Stage 6) and voice protection (Stage 8) always win.
// ════════════════════════════════════════════════════════

// ---- Profile field schema: the contract a course profile fills ----
// Every field is OPTIONAL. The context builder degrades gracefully when a
// field is absent, so the same engine serves courses with very different
// requirements (different hours, partners, proposal/approval rules, data
// expectations, deliverables, academic structures, and instructor cautions).
const SERVICE_LEARNING_PROFILE_SCHEMA = {
    courseName:            'string',   // e.g. "CAP 200"
    institution:           'string',   // e.g. "Hostos Community College"
    projectLabel:          'string',   // student-facing project name
    requiredHours:         'number',   // configurable; NEVER globally hard-coded
    serviceType:           'string',   // e.g. "direct service"
    proposalRequired:      'boolean',
    proposalDetail:        'string',   // how the proposal works (template, etc.)
    approvalRequired:      'boolean',  // approval gate BEFORE service begins
    dataRequirement:       'string',   // what inquiry/data is expected
    reflectionRequirement: 'string',
    academicStructure:     'array',    // e.g. ['Introduction','Methodology',...]
    finalDeliverable:      'string',   // e.g. "5–7 page written report"
    assignmentWeight:      'string',   // e.g. "40% of the course grade"
    courseConcepts:        'array',    // disciplinary / learning-outcome focus
    supportResources:      'array',    // e.g. ["Hostos Writing Center"]
    evidenceTypes:         'array',    // logged hours, journals, interviews, surveys
    revisionExpectation:   'string',
    feedbackProcess:       'string',
    instructorCautions:    'array'     // genre warnings: what NOT to reduce it to
};

// ---- Reusable, transferable service-learning writing moves ----
// Institution-agnostic coaching directives. `stages` notes which of the
// existing 10 stages each move lives in (descriptive — adds no new stage).
const SERVICE_LEARNING_MOVES = [
    { key: 'project_basics',       label: 'Project Basics',                 stages: [1, 3], coach: 'Help the student name their service-learning project, the community it serves, and why it matters to them — in their own words.' },
    { key: 'community_partner',    label: 'CBO / Community Partner',        stages: [1, 3], coach: 'Help the student describe the community-based organization or partner and its role. Do not invent the partner or its details.' },
    { key: 'community_need',       label: 'Community Need or Issue',        stages: [2, 3], coach: 'Help the student articulate the community need or social issue the project addresses, connecting personal observation to a larger context.' },
    { key: 'proposal_timeline',    label: 'Project Proposal & Timeline',    stages: [3, 5], coach: 'When the course requires a proposal, help the student plan scope and a realistic timeline. The student writes the proposal; the coach asks planning questions only.' },
    { key: 'approval_readiness',   label: 'Approval Readiness Check',       stages: [3, 5], coach: 'When the course requires approval before service, help the student check that their plan is ready to submit. The coach NEVER grants or simulates approval — only the instructor approves.' },
    { key: 'service_actions',      label: 'Service Actions / Logged Hours', stages: [4],    coach: 'Help the student record what they actually did and the hours they logged. Never invent hours or activities.' },
    { key: 'data_collection',      label: 'Data Collection Plan',           stages: [4],    coach: 'Help the student plan how they will gather real evidence (observations, interviews, surveys, documents). Suggest approaches; do not fabricate data.' },
    { key: 'methodology',          label: 'Methodology',                    stages: [4, 5], coach: 'Help the student explain their methods clearly — what they did, with whom, and how — so a reader could understand the process.' },
    { key: 'evidence',             label: 'Evidence / Data / Examples',     stages: [6],    coach: 'Help the student present their real evidence and examples. Facts only; never supply data, findings, quotes, or sources.' },
    { key: 'results',              label: 'Results or Findings',            stages: [6, 7], coach: 'Help the student report what they found — observations and data — without interpretation creeping in yet.' },
    { key: 'discussion',           label: 'Discussion / Analysis',          stages: [7],    coach: 'Help the student interpret their findings: connect results to course concepts AND to community meaning. Ask analytical questions; do not write the analysis.' },
    { key: 'course_concept',       label: 'Course Concept Connection',      stages: [7, 2], coach: 'Help the student tie the project explicitly to course learning and disciplinary concepts.' },
    { key: 'reflection',           label: 'Reflection / Positionality',     stages: [7, 10],coach: 'Help the student reflect on their role, assumptions, and growth. Reflection is part of the work — not the whole assignment.' },
    { key: 'public_significance',  label: 'Public or Community Significance',stages: [7, 8], coach: 'Help the student articulate why the project matters beyond themselves — its public or community significance.' },
    { key: 'intro_conclusion',     label: 'Introduction, Conclusion & Revision', stages: [8, 9], coach: 'Help the student frame an introduction and conclusion and plan revisions. Offer questions and structure, never copy-ready prose.' },
    { key: 'process_report',       label: 'Process Report',                 stages: [10],   coach: 'Help the student produce a metacognitive process report on how the project came together. The student writes it; the coach prompts reflection.' }
];

// ---- Coaching invariants for ALL service-learning work (no course specifics) ----
const SERVICE_LEARNING_PRINCIPLES = [
    'The project connects community-based service, the CBO/partner context, approved planning, data collection and analysis, academic report structure, course learning, reflection and positionality, revision, and public/community meaning — not any one of these alone.',
    'Use only the student\'s real service experience, real observations, and real data. If something is missing, ask the student for it — never fill it in.',
    'Protect identifying information about individuals served. Guide the student to describe people in general terms.',
    'Reflection is part of the work, not the whole assignment.'
];

// ---- What the coach must NEVER do in the service-learning genre ----
const SERVICE_LEARNING_COACH_MUST_NOT = [
    'present itself as granting or simulating proposal approval',
    'replace instructor feedback',
    'invent service hours, CBO details, observations, data, findings, quotes, or sources',
    'treat reflection as the whole assignment',
    'reduce the project to a volunteer-hours log',
    'turn the report into a generic research paper disconnected from the service',
    'turn the report into a data-only report disconnected from community meaning',
    'grade the student or make claims about rubric scores'
];

// ---- The generic service-learning project TYPE ----
const serviceLearningProjectType = {
    typeId:          'service_learning_project',
    typeName:        'Service-Learning Project',
    // Short, student-facing description (bilingual) for a selector. Kept brief on
    // purpose: the selector helps students choose, it does not explain pedagogy.
    studentLabelEs:  'Proyecto de Aprendizaje-Servicio',
    studentLabelEn:  'Service-Learning Project',
    studentDescEs:   'Convierte tu servicio comunitario, tu evidencia, las ideas del curso y tu reflexión en un proyecto académico pulido.',
    studentDescEn:   'Turn your community-based service, evidence, course ideas, and reflection into a polished academic project.',
    schema:          SERVICE_LEARNING_PROFILE_SCHEMA,
    moves:           SERVICE_LEARNING_MOVES,
    principles:      SERVICE_LEARNING_PRINCIPLES,
    coachMustNot:    SERVICE_LEARNING_COACH_MUST_NOT
};

// ---- Context builder: profile config → additive ASSIGNMENT CONTEXT body ----
// Produces the coach-directive text injected (Session-78 seam) AFTER every
// mandatory rule. All course specifics come from `profile`; the generic engine
// supplies only transferable structure and guardrails. Returns a string.
function buildServiceLearningContext(profile) {
    profile = profile || {};
    const L = [];
    const list = (a) => Array.isArray(a) ? a.filter(Boolean) : (a ? [a] : []);

    // 1. Framing (uses whatever the profile provides; generic when absent)
    const projName = profile.projectLabel || (profile.courseName ? (profile.courseName + ' service-learning project') : 'a service-learning project');
    const deliverable = profile.finalDeliverable ? (' Their final deliverable is ' + profile.finalDeliverable + '.') : '';
    L.push('The student is working on ' + projName + ' — a SERVICE-LEARNING writing project.' + deliverable +
        ' Help them turn real community-based service and inquiry into academically grounded, ethically reflective, evidence-based writing. You never write it for them and never grade it; the student is the author of every word.');

    // 2. The reusable service-learning arc + academic structure
    L.push('Coach the work as a connected arc: ' + SERVICE_LEARNING_MOVES.map(m => m.label).join(' → ') + '.');

    // 2b. Integration map — where each move lives in Tu Pana's existing 10-step
    // journey. The steps themselves do NOT change; only the coaching focus shifts.
    const byStage = {};
    SERVICE_LEARNING_MOVES.forEach(m => (m.stages || []).forEach(n => { (byStage[n] = byStage[n] || []).push(m.label); }));
    const stageLines = Object.keys(byStage).sort((a, b) => a - b).map(n => 'Step ' + n + ': ' + byStage[n].join(', '));
    if (stageLines.length) {
        L.push('These moves map onto the existing 10-step journey (the steps do not change — match your focus to the student\'s current step):\n- ' + stageLines.join('\n- '));
    }

    const struct = list(profile.academicStructure);
    if (struct.length) {
        L.push('Organize the academic report around this structure: ' + struct.join(' · ') + '. Guide the student through each part with questions and structure — never copy-ready prose.');
    }

    // 3. Course requirements that exist for THIS profile (conditional)
    const req = [];
    if (profile.assignmentWeight)   req.push('This assignment is ' + profile.assignmentWeight + '.');
    if (profile.proposalRequired)   req.push('A project proposal is required' + (profile.proposalDetail ? (' — ' + profile.proposalDetail) : '') + '. The student writes it; you ask planning questions only.');
    if (profile.approvalRequired)   req.push('The proposal must be approved before service begins. You do NOT grant approval — only the instructor does; help the student get ready to submit.');
    if (typeof profile.requiredHours === 'number') req.push('The project involves about ' + profile.requiredHours + ' hours of ' + (profile.serviceType || 'service') + '.');
    else if (profile.serviceType)   req.push('The service is generally ' + profile.serviceType + ' where applicable.');
    if (profile.dataRequirement)    req.push('Required inquiry: ' + profile.dataRequirement + '.');
    if (list(profile.evidenceTypes).length) req.push('Evidence may include ' + list(profile.evidenceTypes).join(', ') + ' — use only what the student actually gathered.');
    if (profile.reflectionRequirement) req.push('Reflection expectation: ' + profile.reflectionRequirement + '.');
    if (profile.revisionExpectation) req.push(profile.revisionExpectation);
    if (profile.feedbackProcess)    req.push(profile.feedbackProcess);
    if (list(profile.supportResources).length) req.push('Encourage the student to use: ' + list(profile.supportResources).join(', ') + '.');
    if (list(profile.courseConcepts).length) req.push('Emphasize these course learning outcomes: ' + list(profile.courseConcepts).join(', ') + '.');
    if (req.length) L.push('Course requirements to keep in view:\n- ' + req.join('\n- '));

    // 4. Generic service-learning principles
    L.push('Service-learning coaching principles:\n- ' + SERVICE_LEARNING_PRINCIPLES.join('\n- '));

    // 5. Guardrails: generic must-nots + any profile-specific cautions
    const mustNot = SERVICE_LEARNING_COACH_MUST_NOT.slice();
    const cautions = list(profile.instructorCautions);
    L.push('In this genre the coach must NEVER:\n- ' + mustNot.join('\n- ') +
        (cautions.length ? ('\nDo not frame the assignment as only: ' + cautions.join('; ') + '.') : ''));

    // 6. Deference (the additive block can never relax the global rules)
    L.push('This assignment context is additive guidance. The authorship gate, voice protection, and no-copyable-prose / no-invented-data rules stated above remain in full force and are never relaxed by it.');

    return L.join('\n');
}

// ════════════════════════════════════════════════════════
//  CAP 200 / BRONX BEAUTIFUL — course PROFILE on the generic type (Stage B)
//  The first concrete service_learning_project profile. ALL CAP-200-specific
//  values live here (and in the selector labels), never in the generic engine.
//  serviceHours is a CONFIGURABLE profile field — not globally hard-coded.
//  This is the comprehensive CAP 200 layer; the older cap-200-first-draft
//  layer is left UNTOUCHED and continues to serve the live pilot.
// ════════════════════════════════════════════════════════
const cap200BronxBeautifulServiceLearning = {
    profileId:             'cap200_bronx_beautiful_service_learning',
    typeId:                'service_learning_project',
    courseName:            'CAP 200',
    institution:           'Hostos Community College',
    projectLabel:          'the CAP 200 "Bronx Beautiful" Service-Learning Project',
    finalDeliverable:      'a 5–7 page written report',
    assignmentWeight:      '40% of the course grade',
    requiredHours:         10,                 // configurable profile field
    serviceType:           'direct service',
    proposalRequired:      true,
    proposalDetail:        'a structured project proposal using the provided template, with a timeline for completion, submitted for a student-selected community-based organization (CBO)',
    approvalRequired:      true,
    dataRequirement:       'every student collects and analyzes real data',
    evidenceTypes:         ['logged service hours', 'reflective journals', 'interview transcripts', 'survey data'],
    reflectionRequirement: 'critical, course-connected reflection (not generic "community service" sentimentality)',
    academicStructure:     ['Introduction', 'Methodology', 'Results', 'Discussion', 'Conclusion'],
    courseConcepts:        ['critical thinking', 'problem solving'],
    supportResources:      ['the Hostos Writing Center'],
    revisionExpectation:   'A rough draft in academic format is expected; revisions are expected after detailed instructor feedback, working toward polished, college-level writing.',
    feedbackProcess:       'The instructor gives detailed feedback and scores with a rubric; the coach never grades and never predicts a rubric score.',
    instructorCautions:    ['only personal reflection', 'only a volunteer-hours log', 'only a generic research paper', 'only a data report disconnected from community meaning'],
    // Short, student-facing selector copy (kept brief on purpose — the selector
    // helps students choose, it does not explain the full assignment).
    studentLabelEs:        'Proyecto de Aprendizaje-Servicio CAP 200',
    studentLabelEn:        'CAP 200 Service-Learning Project',
    studentDescEs:         'Construye tu reporte de 5–7 páginas: tu proyecto con la CBO, tus datos, los conceptos del curso, tu análisis y tu reflexión.',
    studentDescEn:         'Build your 5–7 page report from your CBO project, your data, course concepts, analysis, and reflection.'
};

// Registry-ready layer object. Backward-compatible shape ({id, name, context})
// so the existing ui.js injection point consumes it UNCHANGED; `type`/`profile`
// are additive metadata. `context` is composed by the generic builder — all the
// CAP-200 wording flows in through the profile, not the engine.
const cap200ServiceLearningLayer = {
    id:         'cap200-bronx-beautiful-service-learning',
    name:       'CAP 200 — Bronx Beautiful Service-Learning Project',
    type:       'service_learning_project',
    selectable: true,   // appears in the in-app project selector (Batch 4)
    profile:    cap200BronxBeautifulServiceLearning,
    context:    buildServiceLearningContext(cap200BronxBeautifulServiceLearning)
};

// ════════════════════════════════════════════════════════
//  ASSIGNMENT LAYERS (Session 78) — thin, link/config-activated context
//  ON TOP OF the stable 10-stage core. Pure data + lookup (no DOM here).
//  An assignment layer adds ASSIGNMENT CONTEXT to the coach prompt; it is
//  ADDITIVE ONLY and never relaxes the global guardrails — the Stage 6
//  authorship gate and Stage 8 voice protection always win. With no active
//  assignment the app is exactly the generic Tu Pana coach (generic fallback).
//  Activated by a link (?assignment=<id>) or a saved id; resolution lives in
//  app.js. New assignments are registered here later.
// ════════════════════════════════════════════════════════
const ASSIGNMENT_LAYERS = {
    'cap-200-first-draft': {
        id:   'cap-200-first-draft',
        name: 'CAP 200 — Bronx Beautiful Service Learning Project (First Draft)',
        // Additive coaching context only. It explicitly defers to the authorship gate and voice rules.
        context:
`The student is working on the CAP 200 "Bronx Beautiful" Service Learning Project FIRST DRAFT — their first full version of a 5–7 page report. Help them PLAN and ORGANIZE this draft. You never write it for them and never grade it; the student is the author of every word.
- Build the draft from the student's One-Paragraph Proposal, their Project Data notes/report, their real service-learning or professor-approved research experience, and real sources (at least one outside academic source plus two course readings).
- Organize around the IMRDC structure: Introduction (the project/topic, why it matters for the Bronx, and the larger question) · Methodology (what they actually did) · Results (the real data, observations, and findings — facts only) · Discussion (what it means; connect results to a Bronx Beautiful theme and to their sources) · Conclusion (what they learned, why it matters, and what comes next).
- NEVER invent or supply data, hours, observations, findings, sources, citations, or quotes. If something is missing, ask the student for it — do not fill it in.
- NEVER include identifying information about individuals served; guide the student to describe people in general terms.
- The goal is a complete-ENOUGH draft (not a perfect one) so it can receive feedback.
This assignment context is additive guidance. The authorship gate, voice protection, and no-copyable-prose rules stated above remain in full force and are never relaxed by it.`
    },
    // Stage B: comprehensive CAP 200 service-learning profile (generic engine + profile config).
    'cap200-bronx-beautiful-service-learning': cap200ServiceLearningLayer
};

// Pure lookup — returns the layer object for a known id, else null (generic fallback). No DOM.
function getAssignmentLayer(id) {
    return (id && Object.prototype.hasOwnProperty.call(ASSIGNMENT_LAYERS, id)) ? ASSIGNMENT_LAYERS[id] : null;
}

// Profiles that opt into the in-app project selector (Batch 4). Returns short,
// student-facing copy only — never the full assignment context. Future profiles
// flagged `selectable: true` with student labels appear automatically, so the
// selector never needs a redesign to add a course. No DOM.
function getSelectableProfiles() {
    return Object.keys(ASSIGNMENT_LAYERS)
        .map(id => ASSIGNMENT_LAYERS[id])
        .filter(l => l && l.selectable && l.profile)
        .map(l => ({
            assignmentId: l.id,
            labelEs: l.profile.studentLabelEs || l.name,
            labelEn: l.profile.studentLabelEn || l.name,
            descEs:  l.profile.studentDescEs  || '',
            descEn:  l.profile.studentDescEn  || ''
        }));
}

// ════════════════════════════════════════════════════════
//  STAGE HELPERS
// ════════════════════════════════════════════════════════
function getStageId(stageNumber) {
    return STAGE_IDS[stageNumber] || ('stage.' + stageNumber);
}

function getTemplateStageData(stageNumber) {
    const template = getActiveTemplate();
    return template.stages.find(s => s.number === stageNumber) || null;
}

// ════════════════════════════════════════════════════════
//  PROCESS LOG — structure definition
//  Key and schema defined here. Wiring in Phase 2.
//  Format each entry as:
//  { timestamp, stageId, actionType, studentGenerated, aiGenerated, summary }
// ════════════════════════════════════════════════════════
const PROCESS_LOG_KEY = 'tupana_process_log';

// ════════════════════════════════════════════════════════
//  SCHEMA VERSION INIT
//  Runs inline on load. If no version is stored, this is legacy
//  v1.0 data — mark it without changing any existing values.
// ════════════════════════════════════════════════════════
(function initSchemaVersion() {
    try {
        if (!localStorage.getItem('tupana_schema_version')) {
            localStorage.setItem('tupana_schema_version', APP_CONFIG.schemaVersion);
            localStorage.setItem('tupana_template_id', APP_CONFIG.genre);
        }
    } catch(e) {}
})();
