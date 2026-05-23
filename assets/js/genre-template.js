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
    instructorSettings:  false   // future: instructor configuration panel
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
