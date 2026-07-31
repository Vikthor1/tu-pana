// council_ui_test.mjs — Review Council UI (Sprint C2)
// Run with a local server on 127.0.0.1:3001.
//
// Covered:
//   - Council offer inside the shared Review-draft dialog (gemini mode only)
//   - explicit disclosure naming three reviewer transmissions + synthesis
//   - launch → 3 council_reviewer + 1 council_synthesis proxy calls, Flash model
//   - synthesized report: preserve-first, capped priorities with corroboration,
//     evidence quotes, disagreement as a writer question
//   - accept/adapt/reject/defer decisions persist to tupana_council_runs
//   - repeat-run friction on an unchanged draft + view-last report
//   - stale label when the draft changed since the stored run
//   - failure isolation: one failed reviewer → labeled partial report;
//     two failed reviewers → graceful abort, nothing saved
//   - blocked genre (college-personal-statement) hides the Council entirely
//   - non-gemini coach mode hides the Council
//   - no page JavaScript errors

import { chromium } from 'playwright';

const HOST = 'http://127.0.0.1:3001/';
const PROXY = 'https://tupana-gemini-proxy.dr-torres-velez.workers.dev/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
let requests = [];
let failRoles = [];   // roles whose reviewer calls return a non-retryable 400
page.on('pageerror', error => errors.push(String(error)));

const draft =
    'My interest in computing began in a family where mathematics shaped everyday decisions. ' +
    'My mother used operations research to organize scarce family time while working full time, and I learned that an algorithm could carry a deeply human purpose. ' +
    'Later, in a community technology project, I saw how careful systems design could either expand access or reproduce an existing barrier. ' +
    'Those experiences now guide my goal of studying human-centered computing at the graduate level. ' +
    'I want to investigate how public institutions can build technical systems that are rigorous, accountable, and responsive to the people who depend on them. ' +
    'Graduate study will help me connect my technical preparation with research that serves communities.';

const QUOTE = 'an algorithm could carry a deeply human purpose';
const QUOTE2 = 'expand access or reproduce an existing barrier';
const PRESERVE_QUOTE = 'rigorous, accountable, and responsive';

function reviewerBody(role) {
    if (role === 'voice') {
        return JSON.stringify({
            role, noFindings: true, findings: [],
            preserve: [{ quote: PRESERVE_QUOTE, why: 'This triad is the writer’s own institutional voice.' }]
        });
    }
    return JSON.stringify({
        role, noFindings: false,
        findings: [{
            dimension: role === 'structure' ? 'through-line' : 'specificity',
            severity: 'priority', confidence: 'high',
            claim: role === 'structure'
                ? 'The argument arrives only after two paragraphs of chronology.'
                : 'The central claim rests on one example without named methods.',
            evidenceQuote: role === 'structure' ? QUOTE : QUOTE2,
            whyItMatters: 'A committee reader decides early whether the trajectory is clear.',
            revisionMove: 'Name the goal in the opening two sentences, then let the story support it.',
            voiceNote: ''
        }],
        preserve: []
    });
}

const synthesisBody = JSON.stringify({
    summary: 'A strong personal trajectory whose argument arrives late; the voice is worth protecting.',
    priorities: [{
        sourceIds: ['structure-1', 'evidence-1'],
        dimension: 'through-line',
        claim: 'The draft’s purpose arrives late and rests on a single example.',
        evidenceQuote: QUOTE,
        whyItMatters: 'Committee readers decide early whether the trajectory is clear.',
        revisionMove: 'State the research goal in the first two sentences.',
        confidence: 'high', voiceNote: ''
    }],
    secondary: [],
    preserve: [{ sourceIds: ['voice-p1'], quote: PRESERVE_QUOTE, why: 'Keep this institutional triad — it is the writer’s own voice.' }],
    disagreements: [{
        question: 'Should the family story open the statement, or should the research goal?',
        positions: ['Open with the goal for committee clarity', 'Open with the story — it is the distinctive voice']
    }]
});

await page.route(PROXY, async route => {
    const payload = JSON.parse(route.request().postData() || '{}');
    requests.push(payload);
    const role = /YOUR ROLE — Structure/.test(payload.prompt) ? 'structure'
        : /YOUR ROLE — Evidence/.test(payload.prompt) ? 'evidence'
            : /YOUR ROLE — Voice/.test(payload.prompt) ? 'voice' : null;
    if (payload.requestKind === 'council_reviewer' && role && failRoles.includes(role)) {
        await route.fulfill({
            status: 400, contentType: 'application/json',
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: true, category: 'bad_request', status: 400, message: 'mock failure' })
        });
        return;
    }
    const text = payload.requestKind === 'council_reviewer' ? reviewerBody(role)
        : payload.requestKind === 'council_synthesis' ? synthesisBody
            : 'ordinary coach reply';
    await route.fulfill({
        status: 200, contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
            text, truncated: false,
            usage: { inputTokens: 1500, outputTokens: 220, thoughtTokens: 0, cachedTokens: 0, totalTokens: 1720 }
        })
    });
});

let passed = 0, failed = 0;
function check(label, condition) {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
    if (ok) passed += 1; else failed += 1;
}

async function prepareStage(assignment = 'graduate-sop', { coachMode = 'gemini', text = draft, stage = 7 } = {}) {
    requests = [];
    failRoles = [];
    await page.goto(HOST + (assignment ? `?assignment=${assignment}` : ''));
    await page.evaluate(({ text, stage, coachMode }) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('tupana_lab_done', 'true');
        localStorage.setItem('tupana_onboarding_complete', 'true');
        localStorage.setItem('tupana_draft_saved', 'true');
        localStorage.setItem('tupana_draft', text);
        localStorage.setItem(`tupana_writing_s${stage}`, text);
        localStorage.setItem('tupana_stage', String(stage));
        localStorage.setItem('tupana_coach_mode', coachMode);
        localStorage.setItem('tupana_ai_cue_seen', 'true');
    }, { text, stage, coachMode });
    await page.reload();
    await page.waitForTimeout(450);
}

// ── Offer + disclosure ──
console.log('Offer and disclosure');
await prepareStage();
await page.locator('#fullDraftReviewBtn').click();
check('Council offer appears inside the Review-draft dialog',
    await page.locator('#councilOffer').isVisible());
check('disclosure names three reviewer transmissions and the synthesis send',
    /tres veces|three times/i.test(await page.locator('.council-disclosure').textContent()) &&
    /síntesis|synthesis/i.test(await page.locator('.council-disclosure').textContent()));
check('no view-last button before any run',
    await page.locator('#councilViewLast').count() === 0);
check('single-lens review remains the first option above the Council',
    await page.locator('#fullDraftReviewModal input[name="fullReviewLens"]').count() === 5);

// ── First run → report ──
console.log('\nFirst Council run');
await page.locator('#councilLaunch').click();
await page.waitForSelector('.council-section', { timeout: 20000 });
const councilRequests = requests.filter(r => ['council_reviewer', 'council_synthesis'].includes(r.requestKind));
check('exactly 3 reviewer calls + 1 synthesis call',
    councilRequests.filter(r => r.requestKind === 'council_reviewer').length === 3 &&
    councilRequests.filter(r => r.requestKind === 'council_synthesis').length === 1);
check('every Council call routes to gemini-2.5-flash',
    councilRequests.every(r => r.model === 'gemini-2.5-flash'));
check('reviewer prompts carry the SOP genre context',
    councilRequests.filter(r => r.requestKind === 'council_reviewer')
        .every(r => /Statement of Purpose/.test(r.prompt)));
const reportText = await page.locator('.full-review-modal-card').textContent();
check('preserve-first section renders with the protected quote',
    /Lo que ya funciona|What is working/.test(reportText) && reportText.includes(PRESERVE_QUOTE));
check('one corroborated priority with its evidence quote',
    await page.locator('.council-finding').count() >= 1 &&
    (await page.locator('.council-corroboration').count()) >= 1 &&
    reportText.includes(QUOTE));
check('disagreement rendered as a writer question, not a verdict',
    /Tu decisión|Your call/.test(reportText) &&
    /Should the family story open/.test(reportText));
check('no admissions-prediction or score language in the report',
    !/chances|probabilidad de admisión|score|puntaje/i.test(reportText));

// ── Decisions persist ──
console.log('\nDecisions');
await page.locator('.council-decision-btn[data-finding="p1"][data-decision="adapted"]').click();
check('decision button reflects pressed state',
    (await page.locator('.council-decision-btn[data-finding="p1"][data-decision="adapted"]').getAttribute('aria-pressed')) === 'true');
const storedDecision = await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem('tupana_council_runs') || '{}');
    const runs = all['graduate-sop'] || [];
    return runs.length ? runs[runs.length - 1].decisions?.p1?.decision : null;
});
check('decision persisted to tupana_council_runs', storedDecision === 'adapted');

// ── Repeat friction + view last ──
console.log('\nRepeat friction and stored report');
await page.locator('#fullReviewClose').click();
await page.locator('#fullDraftReviewBtn').click();
check('unchanged draft disables a repeat Council until the override is checked',
    await page.locator('#councilLaunch').isDisabled() &&
    await page.locator('#councilSameDraftOverride').count() === 1);
await page.locator('#councilSameDraftOverride').check();
check('override re-enables the Council', await page.locator('#councilLaunch').isEnabled());
await page.locator('#councilViewLast').click();
await page.waitForSelector('.council-section', { timeout: 8000 });
check('stored report reopens without a stale label for the unchanged draft',
    await page.locator('.council-stale-note').count() === 0);
check('stored decision restored in the reopened report',
    (await page.locator('.council-decision-btn[data-finding="p1"][data-decision="adapted"]').getAttribute('aria-pressed')) === 'true');
await page.locator('#fullReviewClose').click();

// Changed draft → stale label on the stored report
await page.evaluate(() => {
    const changed = localStorage.getItem('tupana_writing_s7') + ' A new closing sentence changes the signature.';
    localStorage.setItem('tupana_writing_s7', changed);
    localStorage.setItem('tupana_draft', changed);
});
await page.reload();
await page.waitForTimeout(450);
await page.locator('#fullDraftReviewBtn').click();
check('changed draft re-enables the Council without an override',
    await page.locator('#councilLaunch').isEnabled() &&
    await page.locator('#councilSameDraftOverride').count() === 0);
await page.locator('#councilViewLast').click();
await page.waitForSelector('.council-section', { timeout: 8000 });
check('stored report is labeled as from an earlier draft version',
    await page.locator('.council-stale-note').isVisible());
await page.locator('#fullReviewClose').click();

// ── Failure isolation ──
console.log('\nFailure isolation');
await prepareStage();
failRoles = ['structure'];
await page.locator('#fullDraftReviewBtn').click();
await page.locator('#councilLaunch').click();
await page.waitForSelector('.council-partial-note', { timeout: 20000 });
const partialText = await page.locator('.full-review-modal-card').textContent();
check('one failed reviewer → labeled partial report',
    /no estuvo disponible|was unavailable/i.test(partialText) && /Estructura|Structure/.test(partialText));
check('partial run still saved with partial status', await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem('tupana_council_runs') || '{}');
    const runs = all['graduate-sop'] || [];
    return runs.length === 1 && runs[0].status === 'partial';
}));
await page.locator('#fullReviewClose').click();

await prepareStage();
failRoles = ['structure', 'evidence'];
await page.locator('#fullDraftReviewBtn').click();
await page.locator('#councilLaunch').click();
await page.waitForSelector('.council-abort-note', { timeout: 20000 });
check('two failed reviewers → graceful abort message',
    /no pudo completar|could not complete/i.test(await page.locator('.council-abort-note').textContent()));
check('aborted run saved nothing', await page.evaluate(() => {
    const all = JSON.parse(localStorage.getItem('tupana_council_runs') || '{}');
    return !(all['graduate-sop'] || []).length;
}));
await page.locator('#councilAbortClose').click();

// ── Availability boundaries ──
console.log('\nAvailability boundaries');
await prepareStage('college-personal-statement');
await page.locator('#fullDraftReviewBtn').click();
check('blocked admissions genre shows no Council offer',
    await page.locator('#councilOffer').count() === 0 &&
    await page.locator('#fullDraftReviewModal input[name="fullReviewLens"]').count() === 5);
await page.locator('#fullReviewClose').click();

await prepareStage('');
await page.locator('#fullDraftReviewBtn').click();
check('default (no assignment) genre offers the Council',
    await page.locator('#councilOffer').isVisible());
await page.locator('#fullReviewClose').click();

await prepareStage('graduate-sop', { coachMode: 'ollama' });
const btnEnabled = await page.locator('#fullDraftReviewBtn').isEnabled();
if (btnEnabled) {
    await page.locator('#fullDraftReviewBtn').click();
    check('non-gemini coach mode shows no Council offer',
        await page.locator('#councilOffer').count() === 0);
    await page.locator('#fullReviewClose').click();
} else {
    check('non-gemini coach mode shows no Council offer', true);
}

check('no page JavaScript errors', errors.length === 0);
if (errors.length) console.log('    errors:', errors.join(' | '));

console.log(`\n${passed + failed ? '' : ''}${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAILED` : ''}`);
await browser.close();
process.exit(failed ? 1 : 0);
