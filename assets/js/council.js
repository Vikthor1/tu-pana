// Tu Pana de Escritura — council.js
// Review Council kernel (Sprint C1): three configured specialist reviewers plus
// one synthesizer over an existing student draft.
// Pure data + pure functions + injected-dependency orchestration.
// No DOM. No direct provider calls (the caller injects callFn). No storage
// access outside the two guarded helpers at the bottom. UI arrives in C2.
//
// Doctrine (decisions.log 2026-07-31): the Council critiques an existing draft
// and never rewrites it; every finding must anchor to a verbatim quote from the
// draft (validated in code, not by prompt hope); output is capped; genuine
// reviewer disagreement is surfaced as a writer decision, never averaged away;
// runs stay local-first; the 10-stage engine and authorship gate are untouched.

// ════════════════════════════════════════════════════════
//  LIMITS — enforced in validation code, not only in prompts
// ════════════════════════════════════════════════════════
const COUNCIL_LIMITS = {
    reviewerCount:   3,     // fixed core: structure, evidence, voice
    minReviewers:    2,     // fewer survivors than this aborts the run
    perReviewerMax:  5,     // findings kept per reviewer after validation
    priorityMax:     3,     // synthesized "fix first" findings
    secondaryMax:    4,     // synthesized "worth knowing" findings
    preserveMax:     3,     // "what is working — protect it" notes
    disagreementMax: 2,     // surfaced writer-decision questions
    claimWords:      60,
    quoteWordsMax:   40,
    quoteCharsMin:   10,    // quotes shorter than this cannot anchor reliably
    whyWords:        40,
    moveWords:       40,
    fragmentWords:   15,    // longest illustrative wording a reviewer may offer
    historyMax:      5,     // stored runs kept per project
    retriesPerCall:  1
};

// ════════════════════════════════════════════════════════
//  REVIEWER ROLES — fixed cross-genre core
//  Each mandate says what the role assesses, what it must ignore, and what it
//  is prohibited from doing. Genre profiles may append to mandates; they never
//  replace the prohibitions.
// ════════════════════════════════════════════════════════
const COUNCIL_ROLES = {
    structure: {
        key: 'structure',
        labelEs: 'Estructura y trayectoria',
        labelEn: 'Structure & trajectory',
        mandate: 'Assess the draft’s overall movement: organization, sequencing, paragraph roles, transitions, proportion, and through-line. Diagnose relationships across sections.',
        mustIgnore: 'Sentence-level wording, grammar, evidence quality, and voice. If a problem is purely at the sentence level, it is outside your mandate.',
        prohibited: 'Do not rewrite passages. Do not propose a full alternative outline. Do not comment on evidence quality or voice — other reviewers own those.'
    },
    evidence: {
        key: 'evidence',
        labelEs: 'Evidencia y desarrollo',
        labelEn: 'Evidence & development',
        mandate: 'Assess the quality, placement, specificity, and interpretation of evidence, examples, and concrete detail. Distinguish missing support from support that is present but not yet connected to the draft’s purpose.',
        mustIgnore: 'Overall organization and voice. If a paragraph is well-supported but in the wrong place, that is the structure reviewer’s finding, not yours.',
        prohibited: 'Never invent, suggest, or imply sources, data, quotations, or facts the student could insert. Do not rewrite passages. Do not comment on structure or voice.'
    },
    voice: {
        key: 'voice',
        labelEs: 'Voz y autenticidad',
        labelEn: 'Voice & authenticity',
        mandate: 'Assess where the writer’s voice is distinct and working, where meaning genuinely blurs, and — critically — which passages must NOT be polished away. Distinguish true clarity problems from stylistic difference and from cultural or linguistic variation. Protect culturally meaningful language, dialect, and code-switching.',
        mustIgnore: 'Structure and evidence quality. A distinctive passage in the wrong section is still a voice strength.',
        prohibited: 'Never recommend standardizing, translating, or smoothing culturally situated phrasing. Do not rewrite passages. When another likely recommendation would make the text more generic, say so explicitly as a preservation warning.'
    }
};

// ════════════════════════════════════════════════════════
//  GENRE PROFILES — configuration over forks
//  Keyed by assignment id (genre-template.js ASSIGNMENT_LAYERS) plus 'default'.
//  Every field optional; getCouncilProfile() merges over the default.
//    enabled          false blocks the Council for this genre (with a reason)
//    roleMandates     { roleKey: extra mandate text appended for this genre }
//    prohibitedExtra  genre-specific prohibited behaviors (appended, all roles)
//    synthesisOrder   role keys in priority order for tie-breaking
//    audienceContext  one paragraph the reviewers receive about genre+audience
// ════════════════════════════════════════════════════════
const COUNCIL_PROFILES = {
    'default': {
        enabled: true,
        labelEs: 'Ensayo autobiográfico de género mixto',
        labelEn: 'Mixed-genre autobiographical essay',
        audienceContext: 'A first-year college mixed-genre autobiographical essay moving from personal memory to social analysis. The audience is an academic reader who values both the personal voice and the analytical connection.',
        synthesisOrder: ['structure', 'evidence', 'voice'],
        roleMandates: {},
        prohibitedExtra: []
    },
    'graduate-sop': {
        enabled: true,
        labelEs: 'Carta de intención de posgrado',
        labelEn: 'Graduate Statement of Purpose',
        audienceContext: 'A graduate Statement of Purpose read by an admissions committee of faculty in the target discipline. Disciplinary fit, intellectual trajectory, and concrete preparation matter more than narrative flourish; the writer’s authentic scholarly voice must survive.',
        synthesisOrder: ['evidence', 'structure', 'voice'],
        roleMandates: {
            structure: 'For an SOP, assess whether the trajectory moves from motivation through preparation to fit and future plan without repetition or chronology-for-its-own-sake.',
            evidence: 'For an SOP, specificity means named projects, methods, skills, faculty or program features, and concrete outcomes — assess whether claims of preparation and fit are grounded in them.',
            voice: 'For an SOP, protect the writer’s genuine intellectual voice against generic “admissions-speak.” Flag passages that sound like any applicant could have written them.'
        },
        prohibitedExtra: [
            'Never predict admission chances or characterize the applicant’s competitiveness.',
            'Never suggest the writer claim experience, skills, or motivations they have not described.'
        ]
    },
    'cap200-bronx-beautiful-service-learning': {
        enabled: true,
        labelEs: 'Informe de aprendizaje-servicio',
        labelEn: 'Service-Learning Report',
        audienceContext: 'A service-learning report for a community-engagement course. It must honor both academic structure (methodology, findings, analysis) and the community’s dignity. Real service activity, real hours, and real observations — nothing may be invented.',
        synthesisOrder: ['evidence', 'structure', 'voice'],
        roleMandates: {
            evidence: 'For a service-learning report, evidence means the student’s real logged activities, observations, and data. Assess whether findings are grounded in what the student actually reports doing — never suggest adding activities, hours, or data.',
            voice: 'Protect the student’s own account of the community. Flag any finding that would push the draft toward deficit framing of the community served.'
        },
        prohibitedExtra: [
            'Never suggest inventing or embellishing service activities, hours, partners, or data.',
            'Never recommend framing the community in deficit terms.'
        ]
    },
    'research-paper': {
        enabled: true,
        labelEs: 'Trabajo de investigación',
        labelEn: 'Research Paper',
        audienceContext: 'An academic research paper. Argument, source use, and evidentiary traceability are central: every claim should be supportable, and the reader must be able to tell the student’s analysis from their sources’.',
        synthesisOrder: ['evidence', 'structure', 'voice'],
        roleMandates: {
            evidence: 'For a research paper, assess whether claims are traceable to the sources the draft itself references and whether the student’s analysis is distinguishable from summary. Never invent, complete, or correct citations — flag missing support as a question for the writer.'
        },
        prohibitedExtra: [
            'Never invent sources, titles, authors, quotations, or citation details.'
        ]
    },
    // Blocked pending the Sprint 1 provider/eligibility decision (decisions.log
    // 2026-07-31 constraint d): admissions applicants are routinely minors.
    'college-personal-statement': {
        enabled: false,
        disabledReason: 'admissions-eligibility-pending',
        labelEs: 'Ensayo de admisión universitaria',
        labelEn: 'College Admissions Essay'
    }
};

// Merged profile lookup. Unknown ids inherit the default profile; a known id
// with enabled:false returns null so callers block the run (checked in code,
// not in UI copy). No DOM.
function getCouncilProfile(assignmentId) {
    const base = COUNCIL_PROFILES['default'];
    const overlay = (assignmentId && Object.prototype.hasOwnProperty.call(COUNCIL_PROFILES, assignmentId))
        ? COUNCIL_PROFILES[assignmentId]
        : null;
    if (overlay && overlay.enabled === false) return null;
    if (!overlay) return { ...base, profileId: 'default' };
    return {
        ...base,
        ...overlay,
        profileId: assignmentId,
        roleMandates: { ...base.roleMandates, ...(overlay.roleMandates || {}) },
        prohibitedExtra: [...base.prohibitedExtra, ...(overlay.prohibitedExtra || [])],
        synthesisOrder: overlay.synthesisOrder || base.synthesisOrder
    };
}

// ════════════════════════════════════════════════════════
//  EVIDENCE ANCHORS — deterministic, code-level validation
//  A finding's quote must be a verbatim (whitespace-normalized,
//  case-insensitive) substring of the draft. Unverifiable quotes are dropped
//  before synthesis ever sees them.
// ════════════════════════════════════════════════════════
function _councilNorm(text) {
    return String(text || '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
        .replace(/\s+/g, ' ').trim().toLowerCase();
}

function councilAnchorValid(quote, draftText) {
    const q = _councilNorm(quote);
    if (q.length < COUNCIL_LIMITS.quoteCharsMin) return false;
    return _councilNorm(draftText).includes(q);
}

function _councilWordCount(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function _councilTrimWords(text, maxWords) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    return words.length <= maxWords ? words.join(' ') : words.slice(0, maxWords).join(' ') + '…';
}

// ════════════════════════════════════════════════════════
//  PROMPTS — reviewers return strict JSON; the synthesizer may only work
//  from the validated findings it is given (enforced again in code).
// ════════════════════════════════════════════════════════
function buildCouncilReviewerPrompt({ role, profile, draftText, langLabel }) {
    const extraMandate = (profile.roleMandates && profile.roleMandates[role.key]) || '';
    const prohibitedExtra = (profile.prohibitedExtra || []).join(' ');
    return [
        'You are one specialist reviewer on the Tu Pana Review Council, reading a complete student draft.',
        'The student wrote every word of this draft. You diagnose; the student revises. You never rewrite.',
        '',
        `GENRE AND AUDIENCE: ${profile.audienceContext}`,
        '',
        `YOUR ROLE — ${role.labelEn}.`,
        `MANDATE: ${role.mandate} ${extraMandate}`.trim(),
        `OUTSIDE YOUR MANDATE (do not comment on): ${role.mustIgnore}`,
        `PROHIBITED: ${role.prohibited} ${prohibitedExtra}`.trim(),
        '',
        'RULES:',
        `- Return at most ${COUNCIL_LIMITS.perReviewerMax} findings. Fewer, well-chosen findings beat an exhaustive list.`,
        '- If the draft has no significant problem within your mandate, return an empty findings list with noFindings true. That is a fully acceptable answer.',
        '- Every finding MUST include evidenceQuote: an EXACT, verbatim quotation copied from the draft (3–40 words). Findings whose quote is not verbatim will be discarded automatically.',
        `- severity is "priority" (materially weakens the draft for this genre and audience) or "secondary" (worth knowing, not urgent).`,
        '- confidence is "high" or "low". Use "low" whenever a competent reader could reasonably disagree.',
        `- revisionMove names the strategy the student should attempt in their own words — never replacement prose. If a short illustrative fragment is unavoidable, keep it under ${COUNCIL_LIMITS.fragmentWords} words and phrase it as a pattern, not a sentence to copy.`,
        '- If a recommendation would make the text more generic or flatten culturally meaningful language, set voiceNote explaining what must be preserved.',
        '- preserve lists passages that are working and should NOT be changed (with verbatim quotes).',
        `- Student-facing text fields will be shown in a ${langLabel || 'bilingual Spanish/English'} interface; write them in clear, plain English.`,
        '',
        'Respond with ONLY this JSON (no markdown fences, no commentary):',
        '{"role":"' + role.key + '","noFindings":false,"findings":[{"dimension":"...","severity":"priority","confidence":"high","claim":"...","evidenceQuote":"...","whyItMatters":"...","revisionMove":"...","voiceNote":""}],"preserve":[{"quote":"...","why":"..."}]}',
        '',
        'STUDENT DRAFT (complete):',
        '---',
        draftText,
        '---'
    ].join('\n');
}

function buildCouncilSynthesisPrompt({ profile, survivingFindings, preserveCandidates, reviewerRoles, draftWordCount }) {
    return [
        'You are the synthesizer of the Tu Pana Review Council. Three specialist reviewers have read one student draft independently. Your job is to turn their validated findings into ONE calm, prioritized report the student can act on.',
        '',
        `GENRE AND AUDIENCE: ${profile.audienceContext}`,
        `Reviewers that completed: ${reviewerRoles.join(', ')}. Draft length: ${draftWordCount} words.`,
        '',
        'HARD RULES:',
        '- Work ONLY from the findings provided below. You may merge duplicates and sharpen wording, but you may not introduce a problem no reviewer reported. Every item you output must list the sourceIds of the finding(s) it came from; items with unknown sourceIds are discarded automatically.',
        `- priorities: the ${COUNCIL_LIMITS.priorityMax} most consequential findings at most, in fix-first order. When impact is comparable, prefer this genre’s order: ${profile.synthesisOrder.join(' > ')}.`,
        `- secondary: at most ${COUNCIL_LIMITS.secondaryMax} lower-priority observations.`,
        `- preserve: at most ${COUNCIL_LIMITS.preserveMax} notes on what is working and must not be revised away, chosen from the preserve candidates.`,
        `- disagreements: at most ${COUNCIL_LIMITS.disagreementMax}. When reviewers genuinely conflict — or a tradeoff (clarity vs voice, concision vs context) is real — do NOT resolve it. Phrase it as a neutral question only the writer can answer, with each position stated fairly.`,
        '- Do not inflate certainty: carry low confidence through as "low". Do not add praise, scores, predictions, or advice beyond the findings.',
        '',
        'Respond with ONLY this JSON (no markdown fences, no commentary):',
        '{"summary":"2-3 sentences on the draft’s overall state","priorities":[{"sourceIds":["structure-1"],"dimension":"...","claim":"...","evidenceQuote":"...","whyItMatters":"...","revisionMove":"...","confidence":"high","voiceNote":""}],"secondary":[],"preserve":[{"sourceIds":["voice-p1"],"quote":"...","why":"..."}],"disagreements":[{"question":"...","positions":["...","..."]}]}',
        '',
        'VALIDATED FINDINGS (JSON):',
        JSON.stringify(survivingFindings, null, 1),
        '',
        'PRESERVE CANDIDATES (JSON):',
        JSON.stringify(preserveCandidates, null, 1)
    ].join('\n');
}

// ════════════════════════════════════════════════════════
//  PARSING + VALIDATION — every model output passes through here
// ════════════════════════════════════════════════════════
function parseCouncilJson(text) {
    if (!text || typeof text !== 'string') return null;
    let t = text.trim();
    const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fence) t = fence[1].trim();
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try { return JSON.parse(t.slice(start, end + 1)); } catch (e) { return null; }
}

// Reviewer output → validated findings. Deterministic: bad anchors dropped,
// severities/confidence normalized, caps applied, stable ids assigned.
function validateReviewerResult(parsed, roleKey, draftText) {
    const dropped = [];
    if (!parsed || typeof parsed !== 'object') return { ok: false, findings: [], preserve: [], dropped: ['unparseable'] };
    const rawFindings = Array.isArray(parsed.findings) ? parsed.findings : [];
    const findings = [];
    for (const raw of rawFindings) {
        if (findings.length >= COUNCIL_LIMITS.perReviewerMax) { dropped.push('over-cap'); continue; }
        if (!raw || typeof raw !== 'object') { dropped.push('malformed'); continue; }
        const quote = String(raw.evidenceQuote || '');
        if (!councilAnchorValid(quote, draftText)) { dropped.push('bad-anchor'); continue; }
        if (_councilWordCount(quote) > COUNCIL_LIMITS.quoteWordsMax) { dropped.push('quote-too-long'); continue; }
        if (!String(raw.claim || '').trim()) { dropped.push('empty-claim'); continue; }
        findings.push({
            id: `${roleKey}-${findings.length + 1}`,
            roleKey,
            dimension: _councilTrimWords(raw.dimension || roleKey, 8),
            severity: raw.severity === 'priority' ? 'priority' : 'secondary',
            confidence: raw.confidence === 'low' ? 'low' : 'high',
            claim: _councilTrimWords(raw.claim, COUNCIL_LIMITS.claimWords),
            evidenceQuote: quote.trim(),
            whyItMatters: _councilTrimWords(raw.whyItMatters || '', COUNCIL_LIMITS.whyWords),
            revisionMove: _councilTrimWords(raw.revisionMove || '', COUNCIL_LIMITS.moveWords),
            voiceNote: String(raw.voiceNote || '').trim() ? _councilTrimWords(raw.voiceNote, COUNCIL_LIMITS.whyWords) : ''
        });
    }
    const preserve = [];
    for (const raw of (Array.isArray(parsed.preserve) ? parsed.preserve : [])) {
        if (preserve.length >= COUNCIL_LIMITS.preserveMax) break;
        const quote = String((raw && raw.quote) || '');
        if (!councilAnchorValid(quote, draftText)) { dropped.push('bad-preserve-anchor'); continue; }
        preserve.push({
            id: `${roleKey}-p${preserve.length + 1}`,
            roleKey,
            quote: quote.trim(),
            why: _councilTrimWords((raw && raw.why) || '', COUNCIL_LIMITS.whyWords)
        });
    }
    return { ok: true, findings, preserve, dropped };
}

// Synthesis output → validated report. Unsupported claims (unknown sourceIds)
// are discarded; corroboration is recomputed here from the source findings,
// never trusted from the model.
function validateSynthesisResult(parsed, findingsById, preserveById, draftText) {
    if (!parsed || typeof parsed !== 'object') return null;
    const resolve = (item) => {
        const ids = Array.isArray(item && item.sourceIds) ? item.sourceIds.filter(id => findingsById[id]) : [];
        return ids;
    };
    const mapFinding = (item, ids) => {
        const roles = [...new Set(ids.map(id => findingsById[id].roleKey))];
        const quote = String(item.evidenceQuote || findingsById[ids[0]].evidenceQuote || '');
        if (!councilAnchorValid(quote, draftText)) return null;
        const lowSource = ids.some(id => findingsById[id].confidence === 'low');
        return {
            sourceIds: ids,
            roles,
            corroborated: roles.length >= 2,
            dimension: _councilTrimWords(item.dimension || findingsById[ids[0]].dimension, 8),
            claim: _councilTrimWords(item.claim || findingsById[ids[0]].claim, COUNCIL_LIMITS.claimWords),
            evidenceQuote: quote.trim(),
            whyItMatters: _councilTrimWords(item.whyItMatters || '', COUNCIL_LIMITS.whyWords),
            revisionMove: _councilTrimWords(item.revisionMove || '', COUNCIL_LIMITS.moveWords),
            confidence: (item.confidence === 'low' || lowSource) ? 'low' : 'high',
            voiceNote: String(item.voiceNote || '').trim() ? _councilTrimWords(item.voiceNote, COUNCIL_LIMITS.whyWords) : ''
        };
    };
    const priorities = [];
    for (const item of (Array.isArray(parsed.priorities) ? parsed.priorities : [])) {
        if (priorities.length >= COUNCIL_LIMITS.priorityMax) break;
        const ids = resolve(item);
        if (!ids.length) continue;
        const mapped = mapFinding(item, ids);
        if (mapped) priorities.push(mapped);
    }
    const usedIds = new Set(priorities.flatMap(p => p.sourceIds));
    const secondary = [];
    for (const item of (Array.isArray(parsed.secondary) ? parsed.secondary : [])) {
        if (secondary.length >= COUNCIL_LIMITS.secondaryMax) break;
        const ids = resolve(item).filter(id => !usedIds.has(id));
        if (!ids.length) continue;
        const mapped = mapFinding(item, ids);
        if (mapped) { secondary.push(mapped); ids.forEach(id => usedIds.add(id)); }
    }
    const preserve = [];
    for (const item of (Array.isArray(parsed.preserve) ? parsed.preserve : [])) {
        if (preserve.length >= COUNCIL_LIMITS.preserveMax) break;
        const ids = Array.isArray(item && item.sourceIds) ? item.sourceIds.filter(id => preserveById[id]) : [];
        const quote = String((item && item.quote) || (ids.length ? preserveById[ids[0]].quote : ''));
        if (!councilAnchorValid(quote, draftText)) continue;
        preserve.push({ sourceIds: ids, quote: quote.trim(), why: _councilTrimWords((item && item.why) || '', COUNCIL_LIMITS.whyWords) });
    }
    const disagreements = [];
    for (const item of (Array.isArray(parsed.disagreements) ? parsed.disagreements : [])) {
        if (disagreements.length >= COUNCIL_LIMITS.disagreementMax) break;
        const q = String((item && item.question) || '').trim();
        if (!q) continue;
        disagreements.push({
            question: _councilTrimWords(q, COUNCIL_LIMITS.claimWords),
            positions: (Array.isArray(item.positions) ? item.positions : []).slice(0, 3).map(p => _councilTrimWords(p, COUNCIL_LIMITS.whyWords))
        });
    }
    return {
        summary: _councilTrimWords(String(parsed.summary || ''), 80),
        priorities, secondary, preserve, disagreements
    };
}

// ════════════════════════════════════════════════════════
//  ORCHESTRATION — injected callFn({ prompt, requestKind }) → Promise<string>
//  Parallel reviewers, one retry each, failure isolation (the run proceeds
//  with >= minReviewers survivors, labeled), then one synthesis call.
// ════════════════════════════════════════════════════════
async function _councilCallWithRetry(callFn, args, retries) {
    let lastErr = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try { return await callFn(args); } catch (err) { lastErr = err; }
    }
    throw lastErr || new Error('council call failed');
}

async function runCouncilKernel({ draftText, assignmentId, stage, langLabel, callFn }) {
    const profile = getCouncilProfile(assignmentId);
    if (!profile) return { status: 'blocked', reason: 'genre-not-enabled' };
    const words = _councilWordCount(draftText);
    if (words < 50) return { status: 'blocked', reason: 'draft-too-short' };

    const roles = Object.values(COUNCIL_ROLES);
    const reviewerStates = [];
    const results = await Promise.all(roles.map(async role => {
        const state = { roleKey: role.key, status: 'failed', dropped: [] };
        reviewerStates.push(state);
        try {
            const text = await _councilCallWithRetry(callFn, {
                prompt: buildCouncilReviewerPrompt({ role, profile, draftText, langLabel }),
                requestKind: 'council_reviewer'
            }, COUNCIL_LIMITS.retriesPerCall);
            const parsed = parseCouncilJson(text);
            const validated = validateReviewerResult(parsed, role.key, draftText);
            if (!validated.ok) { state.status = 'invalid'; return null; }
            state.status = 'ok';
            state.dropped = validated.dropped;
            return validated;
        } catch (err) {
            state.status = 'failed';
            return null;
        }
    }));

    const survivors = results.filter(Boolean);
    if (survivors.length < COUNCIL_LIMITS.minReviewers) {
        return { status: 'aborted', reason: 'too-few-reviewers', reviewers: reviewerStates };
    }

    const allFindings = survivors.flatMap(r => r.findings);
    const allPreserve = survivors.flatMap(r => r.preserve);
    const findingsById = Object.fromEntries(allFindings.map(f => [f.id, f]));
    const preserveById = Object.fromEntries(allPreserve.map(p => [p.id, p]));
    const okRoles = reviewerStates.filter(s => s.status === 'ok').map(s => s.roleKey);

    let report = null;
    if (allFindings.length === 0 && allPreserve.length === 0) {
        report = { summary: '', priorities: [], secondary: [], preserve: [], disagreements: [] };
    } else {
        try {
            const text = await _councilCallWithRetry(callFn, {
                prompt: buildCouncilSynthesisPrompt({
                    profile,
                    survivingFindings: allFindings,
                    preserveCandidates: allPreserve,
                    reviewerRoles: okRoles,
                    draftWordCount: words
                }),
                requestKind: 'council_synthesis'
            }, COUNCIL_LIMITS.retriesPerCall);
            report = validateSynthesisResult(parseCouncilJson(text), findingsById, preserveById, draftText);
        } catch (err) { report = null; }
        if (!report) return { status: 'aborted', reason: 'synthesis-failed', reviewers: reviewerStates };
    }

    return {
        status: okRoles.length === roles.length ? 'complete' : 'partial',
        profileId: profile.profileId,
        stage: stage || null,
        wordCount: words,
        reviewers: reviewerStates,
        reviewerFindings: allFindings,
        report
    };
}

// ════════════════════════════════════════════════════════
//  LOCAL RUN HISTORY — localStorage only, metadata + findings + decisions.
//  No draft text is stored beyond the anchored quotes. Guarded for non-browser
//  contexts (node tests inject nothing; helpers no-op without localStorage).
// ════════════════════════════════════════════════════════
const COUNCIL_STORAGE_KEY = 'tupana_council_runs';

function _councilStore() {
    return (typeof localStorage !== 'undefined') ? localStorage : null;
}

function loadCouncilRuns(projectId) {
    const store = _councilStore();
    if (!store) return [];
    try {
        const all = JSON.parse(store.getItem(COUNCIL_STORAGE_KEY) || '{}');
        return Array.isArray(all[projectId]) ? all[projectId] : [];
    } catch (e) { return []; }
}

function saveCouncilRun(projectId, run) {
    const store = _councilStore();
    if (!store) return null;
    try {
        const all = JSON.parse(store.getItem(COUNCIL_STORAGE_KEY) || '{}');
        const runs = Array.isArray(all[projectId]) ? all[projectId] : [];
        const record = {
            id: `run-${(runs[runs.length - 1] && Number(String(runs[runs.length - 1].id).replace('run-', '')) + 1) || runs.length + 1}`,
            timestamp: new Date().toISOString(),
            draftSignature: run.draftSignature || null,
            profileId: run.profileId,
            stage: run.stage,
            wordCount: run.wordCount,
            status: run.status,
            reviewers: run.reviewers.map(r => ({ roleKey: r.roleKey, status: r.status })),
            report: run.report,
            decisions: {},
            verifications: []
        };
        runs.push(record);
        all[projectId] = runs.slice(-COUNCIL_LIMITS.historyMax);
        store.setItem(COUNCIL_STORAGE_KEY, JSON.stringify(all));
        return record;
    } catch (e) { return null; }
}

// decision: accepted | adapted | rejected | deferred | resolved
function recordCouncilDecision(projectId, runId, findingKey, decision) {
    const store = _councilStore();
    if (!store) return false;
    const allowed = new Set(['accepted', 'adapted', 'rejected', 'deferred', 'resolved']);
    if (!allowed.has(decision)) return false;
    try {
        const all = JSON.parse(store.getItem(COUNCIL_STORAGE_KEY) || '{}');
        const run = (all[projectId] || []).find(r => r.id === runId);
        if (!run) return false;
        run.decisions[findingKey] = { decision, timestamp: new Date().toISOString() };
        store.setItem(COUNCIL_STORAGE_KEY, JSON.stringify(all));
        return true;
    } catch (e) { return false; }
}

// verdict: improved | partial | active — recorded per finding after re-review
function recordCouncilVerification(projectId, runId, findingKey, verdict, draftSignature) {
    const store = _councilStore();
    if (!store) return false;
    const allowed = new Set(['improved', 'partial', 'active']);
    if (!allowed.has(verdict)) return false;
    try {
        const all = JSON.parse(store.getItem(COUNCIL_STORAGE_KEY) || '{}');
        const run = (all[projectId] || []).find(r => r.id === runId);
        if (!run) return false;
        run.verifications.push({ findingKey, verdict, draftSignature: draftSignature || null, timestamp: new Date().toISOString() });
        store.setItem(COUNCIL_STORAGE_KEY, JSON.stringify(all));
        return true;
    } catch (e) { return false; }
}

// Node test seam (browser ignores this; script-tag loading is unaffected).
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        COUNCIL_LIMITS, COUNCIL_ROLES, COUNCIL_PROFILES, COUNCIL_STORAGE_KEY,
        getCouncilProfile, councilAnchorValid, parseCouncilJson,
        buildCouncilReviewerPrompt, buildCouncilSynthesisPrompt,
        validateReviewerResult, validateSynthesisResult, runCouncilKernel,
        loadCouncilRuns, saveCouncilRun, recordCouncilDecision, recordCouncilVerification
    };
}
