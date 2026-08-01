// council_kernel_test.mjs — Review Council kernel (Sprint C1)
// Pure-node suite: no network, no browser, no key. Drives assets/js/council.js
// through its CommonJS test seam.
//
// Covered:
//   - profile merge (default + graduate-sop overlay), unknown-id fallback,
//     admissions profile blocked (enabled:false → null)
//   - evidence-anchor validator: verbatim, whitespace/case/curly-quote
//     normalization, fabricated and too-short quotes rejected
//   - JSON parsing: plain, fenced, prose-wrapped, malformed
//   - reviewer validation: bad anchors dropped, per-reviewer cap, stable ids,
//     severity/confidence normalization, noFindings allowed, preserve anchors
//   - synthesis validation: caps (3/4/3/2), unknown sourceIds discarded,
//     corroboration recomputed from sources (never trusted), low-confidence
//     propagation, duplicate source suppression priority→secondary
//   - orchestration: all-ok → complete; one reviewer failing twice → partial;
//     two failing → aborted (min survivors); synthesis failure → aborted;
//     retry works; blocked genre and short draft refuse before any call
//   - storage helpers: save caps history, decisions restricted to the allowed
//     vocabulary, verification appends
// Run: node council_kernel_test.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const C = require('./assets/js/council.js');

let pass = 0, fail = 0;
const check = (l, c) => { console.log(`  ${c ? '✅' : '❌'} ${l}`); c ? pass++ : fail++; };

const DRAFT = [
    'When I first arrived in the Bronx, my grandmother told me that "el idioma se lleva en la sangre" and I did not believe her.',
    'Years later, standing in front of my own students, I heard her words come out of my mouth.',
    'This essay argues that heritage language is not a barrier but an inheritance, one that institutions routinely misread.',
    'My evidence comes from three summers of teaching, from my own schooling, and from what my mother calls nuestra manera de hablar.'
].join(' ');

// ── Profiles ──
console.log('\n── Genre profiles ──');
const def = C.getCouncilProfile(null);
check('null assignment falls back to default profile', def && def.profileId === 'default');
check('default profile enabled with 3-role synthesis order', def.synthesisOrder.length === 3);
const sop = C.getCouncilProfile('graduate-sop');
check('graduate-sop profile merges over default', sop && sop.profileId === 'graduate-sop');
check('graduate-sop keeps its own synthesis order (evidence first)', sop.synthesisOrder[0] === 'evidence');
check('graduate-sop adds role mandates', !!sop.roleMandates.voice);
check('graduate-sop inherits + extends prohibited behaviors', sop.prohibitedExtra.some(p => /predict admission/i.test(p)));
check('unknown assignment id is blocked instead of inheriting the essay default', C.getCouncilProfile('no-such-genre') === null);
check('STEM and legacy CAP are explicitly disabled until profiled',
    C.getCouncilProfile('stem-lab-report') === null && C.getCouncilProfile('cap-200-first-draft') === null);
const adm = C.getCouncilProfile('college-personal-statement');
check('college-personal-statement enabled (founder override 2026-07-31), voice-first synthesis',
    !!adm && adm.synthesisOrder[0] === 'voice');
check('admissions profile hard-prohibits outcome prediction',
    adm.prohibitedExtra.some(p => /Never predict admission outcomes/.test(p)));
check('cap200 and research profiles enabled', !!C.getCouncilProfile('cap200-bronx-beautiful-service-learning') && !!C.getCouncilProfile('research-paper'));
C.COUNCIL_PROFILES['__test-disabled'] = { enabled: false, labelEn: 'x', labelEs: 'x' };
check('enabled:false mechanism still blocks a profile (returns null)', C.getCouncilProfile('__test-disabled') === null);
delete C.COUNCIL_PROFILES['__test-disabled'];

// ── Anchor validator ──
console.log('\n── Evidence anchors ──');
check('verbatim quote validates', C.councilAnchorValid('heritage language is not a barrier', DRAFT));
check('case-insensitive match validates', C.councilAnchorValid('HERITAGE LANGUAGE IS NOT A BARRIER', DRAFT));
check('whitespace-normalized match validates', C.councilAnchorValid('heritage   language\nis not a barrier', DRAFT));
check('curly-quote normalization validates', C.councilAnchorValid('“el idioma se lleva en la sangre”', DRAFT));
check('fabricated quote rejected', !C.councilAnchorValid('my father always said work hard', DRAFT));
check('near-miss paraphrase rejected', !C.councilAnchorValid('heritage language is no barrier', DRAFT));
check('too-short quote rejected', !C.councilAnchorValid('the', DRAFT));
check('empty quote rejected', !C.councilAnchorValid('', DRAFT));

// ── JSON parsing ──
console.log('\n── JSON parsing ──');
check('plain JSON parses', C.parseCouncilJson('{"a":1}').a === 1);
check('fenced JSON parses', C.parseCouncilJson('```json\n{"a":2}\n```').a === 2);
check('prose-wrapped JSON parses', C.parseCouncilJson('Here you go: {"a":3} — done!').a === 3);
check('malformed JSON returns null', C.parseCouncilJson('{"a":') === null);
check('non-string returns null', C.parseCouncilJson(null) === null);

// ── Reviewer validation ──
console.log('\n── Reviewer validation ──');
const mkFinding = (over = {}) => ({
    dimension: 'through-line', severity: 'priority', confidence: 'high',
    claim: 'The bridge from anecdote to argument arrives late.',
    evidenceQuote: 'heritage language is not a barrier but an inheritance',
    whyItMatters: 'The reader waits too long for the stakes.',
    revisionMove: 'State the argument within the first three sentences.',
    ...over
});
let rv = C.validateReviewerResult({ findings: [mkFinding(), mkFinding({ evidenceQuote: 'this was never written' })] }, 'structure', DRAFT);
check('valid finding kept, fabricated-anchor finding dropped', rv.findings.length === 1 && rv.dropped.includes('bad-anchor'));
check('kept finding gets stable role-scoped id', rv.findings[0].id === 'structure-1');
rv = C.validateReviewerResult({ findings: Array.from({ length: 8 }, () => mkFinding()) }, 'evidence', DRAFT);
check('per-reviewer cap enforced (8 → 5)', rv.findings.length === C.COUNCIL_LIMITS.perReviewerMax);
rv = C.validateReviewerResult({ findings: [mkFinding({ severity: 'catastrophic', confidence: 'certain' })] }, 'voice', DRAFT);
check('unknown severity normalizes to secondary', rv.findings[0].severity === 'secondary');
check('unknown confidence normalizes to high', rv.findings[0].confidence === 'high');
rv = C.validateReviewerResult({ noFindings: true, findings: [] }, 'voice', DRAFT);
check('noFindings (empty list) is a valid reviewer answer', rv.ok && rv.findings.length === 0);
rv = C.validateReviewerResult({ findings: [], preserve: [{ quote: 'nuestra manera de hablar', why: 'voice' }, { quote: 'invented praise', why: 'x' }] }, 'voice', DRAFT);
check('preserve quotes anchor-validated too', rv.preserve.length === 1 && rv.preserve[0].id === 'voice-p1');
rv = C.validateReviewerResult(null, 'voice', DRAFT);
check('unparseable reviewer output marked not ok', rv.ok === false);
rv = C.validateReviewerResult({ findings: [mkFinding({ claim: '' })] }, 'voice', DRAFT);
check('empty-claim finding dropped', rv.findings.length === 0 && rv.dropped.includes('empty-claim'));

// ── Synthesis validation ──
console.log('\n── Synthesis validation ──');
const f1 = { ...C.validateReviewerResult({ findings: [mkFinding()] }, 'structure', DRAFT).findings[0] };
const f2 = { ...C.validateReviewerResult({ findings: [mkFinding({ confidence: 'low' })] }, 'evidence', DRAFT).findings[0] };
const f3 = { ...C.validateReviewerResult({ findings: [mkFinding()] }, 'voice', DRAFT).findings[0] };
const byId = { [f1.id]: f1, [f2.id]: f2, [f3.id]: f3 };
const pv = C.validateReviewerResult({ findings: [], preserve: [{ quote: 'nuestra manera de hablar', why: 'keep' }] }, 'voice', DRAFT).preserve[0];
const pById = { [pv.id]: pv };
const mkSyn = (over = {}) => ({
    summary: 'The draft has a strong voice and a late-arriving argument.',
    priorities: [{ sourceIds: [f1.id, f2.id], dimension: 'through-line', claim: 'Argument arrives late.', evidenceQuote: f1.evidenceQuote, whyItMatters: 'Stakes unclear.', revisionMove: 'Front-load the claim.', confidence: 'high' }],
    secondary: [], preserve: [{ sourceIds: [pv.id], quote: pv.quote, why: 'distinctive voice' }],
    disagreements: [{ question: 'Should the Spanish phrases be glossed?', positions: ['Gloss for the committee', 'Leave unglossed as voice'] }],
    ...over
});
let syn = C.validateSynthesisResult(mkSyn(), byId, pById, DRAFT);
check('valid synthesis passes with 1 priority', syn && syn.priorities.length === 1);
check('corroboration recomputed from sources (2 roles → true)', syn.priorities[0].corroborated === true);
check('low source confidence propagates to merged finding', syn.priorities[0].confidence === 'low');
check('preserve kept with valid anchor', syn.preserve.length === 1);
check('disagreement surfaced as writer question', syn.disagreements.length === 1);
syn = C.validateSynthesisResult(mkSyn({ priorities: [{ sourceIds: ['ghost-9'], claim: 'Invented problem.', evidenceQuote: f1.evidenceQuote }] }), byId, pById, DRAFT);
check('unknown sourceIds discarded (unsupported claim)', syn.priorities.length === 0);
syn = C.validateSynthesisResult(mkSyn({ priorities: Array.from({ length: 6 }, () => mkSyn().priorities[0]) }), byId, pById, DRAFT);
check('priority cap enforced (6 → 3)', syn.priorities.length === C.COUNCIL_LIMITS.priorityMax);
syn = C.validateSynthesisResult(mkSyn({ secondary: [{ sourceIds: [f1.id], claim: 'dup of priority', evidenceQuote: f1.evidenceQuote }, { sourceIds: [f3.id], claim: 'real secondary', evidenceQuote: f3.evidenceQuote }] }), byId, pById, DRAFT);
check('secondary reusing a priority source is suppressed; fresh one kept', syn.secondary.length === 1 && syn.secondary[0].sourceIds[0] === f3.id);
syn = C.validateSynthesisResult(mkSyn({ priorities: [{ sourceIds: [f1.id], claim: 'ok', evidenceQuote: 'not in the draft at all' }] }), byId, pById, DRAFT);
check('synthesis finding with invalid anchor dropped', syn.priorities.length === 0);
check('unparseable synthesis returns null', C.validateSynthesisResult(null, byId, pById, DRAFT) === null);

// ── Orchestration ──
console.log('\n── Orchestration ──');
const reviewerJson = (role) => JSON.stringify({
    role, noFindings: false,
    findings: [mkFinding({ dimension: role })],
    preserve: role === 'voice' ? [{ quote: 'nuestra manera de hablar', why: 'voice' }] : []
});
const synthesisJsonFor = (calls) => {
    // Build a synthesis referencing the real generated ids (role-1)
    return JSON.stringify(mkSyn({
        priorities: [{ sourceIds: ['structure-1', 'evidence-1'], dimension: 'through-line', claim: 'Argument late.', evidenceQuote: 'heritage language is not a barrier but an inheritance', whyItMatters: 'Stakes.', revisionMove: 'Front-load.', confidence: 'high' }],
        preserve: [{ sourceIds: ['voice-p1'], quote: 'nuestra manera de hablar', why: 'keep' }]
    }));
};

async function run(callFn, assignmentId = 'graduate-sop', draftText = DRAFT) {
    return C.runCouncilKernel({ draftText, assignmentId, stage: 7, langLabel: 'bilingual', callFn });
}

let calls = [];
let r = await run(async ({ prompt, requestKind }) => {
    calls.push(requestKind);
    if (requestKind === 'council_reviewer') {
        const role = /YOUR ROLE — Structure/.test(prompt) ? 'structure' : /YOUR ROLE — Evidence/.test(prompt) ? 'evidence' : 'voice';
        return reviewerJson(role);
    }
    return synthesisJsonFor(calls);
});
check('all reviewers ok → status complete', r.status === 'complete');
check('3 reviewer calls + 1 synthesis call', calls.filter(k => k === 'council_reviewer').length === 3 && calls.filter(k => k === 'council_synthesis').length === 1);
check('report carries priorities with corroboration', r.report.priorities.length === 1 && r.report.priorities[0].corroborated === true);
check('reviewer states all ok', r.reviewers.every(s => s.status === 'ok'));

let attempt = {};
r = await run(async ({ prompt, requestKind }) => {
    if (requestKind === 'council_reviewer' && /YOUR ROLE — Evidence/.test(prompt)) {
        attempt.evidence = (attempt.evidence || 0) + 1;
        throw new Error('boom');
    }
    if (requestKind === 'council_reviewer') {
        const role = /YOUR ROLE — Structure/.test(prompt) ? 'structure' : 'voice';
        return reviewerJson(role);
    }
    return JSON.stringify(mkSyn({ priorities: [{ sourceIds: ['structure-1'], claim: 'ok', evidenceQuote: 'heritage language is not a barrier but an inheritance', revisionMove: 'x', whyItMatters: 'y', dimension: 'through-line', confidence: 'high' }], preserve: [{ sourceIds: ['voice-p1'], quote: 'nuestra manera de hablar', why: 'keep' }] }));
});
check('one reviewer failing (after retry) → status partial', r.status === 'partial');
check('failed reviewer retried exactly once', attempt.evidence === 2);
check('failed reviewer labeled in states', r.reviewers.find(s => s.roleKey === 'evidence').status === 'failed');
check('single-role priority not corroborated', r.report.priorities[0].corroborated === false);

r = await run(async ({ prompt, requestKind }) => {
    if (requestKind === 'council_reviewer' && !/YOUR ROLE — Voice/.test(prompt)) throw new Error('down');
    if (requestKind === 'council_reviewer') return reviewerJson('voice');
    return synthesisJsonFor([]);
});
check('two reviewers failing → aborted (min survivors)', r.status === 'aborted' && r.reason === 'too-few-reviewers');

r = await run(async ({ requestKind, prompt }) => {
    if (requestKind === 'council_synthesis') throw new Error('syn down');
    const role = /YOUR ROLE — Structure/.test(prompt) ? 'structure' : /YOUR ROLE — Evidence/.test(prompt) ? 'evidence' : 'voice';
    return reviewerJson(role);
});
check('synthesis failing (after retry) → aborted', r.status === 'aborted' && r.reason === 'synthesis-failed');

let flaky = 0;
r = await run(async ({ requestKind, prompt }) => {
    if (requestKind === 'council_reviewer' && /YOUR ROLE — Structure/.test(prompt) && flaky++ === 0) throw new Error('transient');
    if (requestKind === 'council_reviewer') {
        const role = /YOUR ROLE — Structure/.test(prompt) ? 'structure' : /YOUR ROLE — Evidence/.test(prompt) ? 'evidence' : 'voice';
        return reviewerJson(role);
    }
    return synthesisJsonFor([]);
});
check('transient reviewer failure recovered by retry → complete', r.status === 'complete');

C.COUNCIL_PROFILES['__test-disabled'] = { enabled: false, labelEn: 'x', labelEs: 'x' };
r = await run(async () => { throw new Error('never called'); }, '__test-disabled');
check('blocked genre refuses before any model call', r.status === 'blocked' && r.reason === 'genre-not-enabled');
delete C.COUNCIL_PROFILES['__test-disabled'];
r = await run(async () => { throw new Error('never called'); }, 'graduate-sop', 'too short');
check('short draft refuses before any model call', r.status === 'blocked' && r.reason === 'draft-too-short');

let malformedCalls = 0;
r = await run(async ({ requestKind, prompt }) => {
    if (requestKind === 'council_reviewer' && /YOUR ROLE — Structure/.test(prompt)) { malformedCalls++; return 'not json at all'; }
    if (requestKind === 'council_reviewer') {
        const role = /YOUR ROLE — Evidence/.test(prompt) ? 'evidence' : 'voice';
        return reviewerJson(role);
    }
    return JSON.stringify(mkSyn({ priorities: [{ sourceIds: ['evidence-1'], claim: 'ok', evidenceQuote: 'heritage language is not a barrier but an inheritance', revisionMove: 'x', whyItMatters: 'y', dimension: 'd', confidence: 'high' }], preserve: [{ sourceIds: ['voice-p1'], quote: 'nuestra manera de hablar', why: 'keep' }] }));
});
check('malformed reviewer JSON → run proceeds partial with 2 survivors', r.status === 'partial' && r.reviewers.find(s => s.roleKey === 'structure').status === 'invalid');

// ── Storage helpers ──
console.log('\n── Storage helpers ──');
const mem = new Map();
globalThis.localStorage = {
    getItem: k => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: k => mem.delete(k),
    key: i => [...mem.keys()][i],
    get length() { return mem.size; }
};
const goodRun = { profileId: 'graduate-sop', stage: 7, wordCount: 80, status: 'complete', reviewers: [{ roleKey: 'structure', status: 'ok' }], report: { summary: 's', priorities: [], secondary: [], preserve: [], disagreements: [] }, draftSignature: '80:abc' };
const saved = C.saveCouncilRun('graduate-sop', goodRun);
check('run saved with id + empty decisions', !!saved && saved.id === 'run-1' && Object.keys(saved.decisions).length === 0);
for (let i = 0; i < 7; i++) C.saveCouncilRun('graduate-sop', goodRun);
check('history capped per project', C.loadCouncilRuns('graduate-sop').length === C.COUNCIL_LIMITS.historyMax);
const lastId = C.loadCouncilRuns('graduate-sop').slice(-1)[0].id;
check('decision with allowed vocabulary recorded', C.recordCouncilDecision('graduate-sop', lastId, 'structure-1', 'adapted') === true);
check('decision outside vocabulary rejected', C.recordCouncilDecision('graduate-sop', lastId, 'structure-1', 'obeyed') === false);
check('verification appends with verdict', C.recordCouncilVerification('graduate-sop', lastId, 'structure-1', 'improved', '81:def') === true);
check('verification with bogus verdict rejected', C.recordCouncilVerification('graduate-sop', lastId, 'structure-1', 'perfect', null) === false);
const reloaded = C.loadCouncilRuns('graduate-sop').slice(-1)[0];
check('decisions + verifications persisted', reloaded.decisions['structure-1'].decision === 'adapted' && reloaded.verifications.length === 1);
check('other projects unaffected', C.loadCouncilRuns('research-paper').length === 0);

console.log(`\n${pass + fail} checks — ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
