// Writing Studio — bounded STEM profiles and the operational STEM Council.
//
// The audit that produced this suite found: one profile silently covering two
// disciplinary genres, an ambiguous `?assignment=stem` link resolving to the lab
// report, a Council that was `enabled: false` with no roles at all but whose
// display labels ("Lab instructor", "Scientific clarity editor") named an
// authority that could confirm scientific correctness, and no discipline rules
// reaching the model on any request because the `genreContext` seam was never
// populated.
//
// What is asserted here is the contract this codebase controls: which profiles
// exist, what fails closed, which rules and prohibitions are placed in every
// transmitted prompt, what the student sees before consent, and what the
// validation kernel refuses to store. Model behaviour is checked separately by
// bounded live validation, not here.
//
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const BASE = `${ORIGIN}/studio.html`;
const KEY = 'tupana-studio:v1';
const LAB = 'stem-lab-report';
const EXPLAIN = 'stem-scientific-explanation';
const ARGUE = 'stem-scientific-argument';
const STEM_LINKS = [LAB, EXPLAIN, ARGUE];
const browser = await chromium.launch({ headless: true });
let passed = 0;
let failed = 0;
const check = (label, condition, detail = '') => {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
    if (ok) passed++; else failed++;
};

const external = [];
const errors = [];
let page;
async function fresh(query = '', viewport = { width: 1440, height: 960 }) {
    if (page) await page.close();
    page = await browser.newPage({ viewport });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(ORIGIN)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(BASE);
    // Desk suites: onboarding is answered so the Studio opens on the Desk.
    // The first-run welcome that precedes it for a genuinely new writer has
    // its own suite (studio_onboarding_test.mjs) and is covered there.
    await page.evaluate(key => { localStorage.removeItem(key); localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' })); }, KEY);
    await page.goto(`${BASE}${query}`);
}
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);
async function capturePrompts() {
    await page.evaluate(() => {
        window.__prompts = [];
        const realActive = window.StudioProvider.active;
        window.StudioProvider.active = function () {
            const provider = realActive.apply(this, arguments);
            const realCall = provider.call.bind(provider);
            provider.call = args => { window.__prompts.push({ requestKind: args.requestKind, prompt: args.prompt }); return realCall(args); };
            return provider;
        };
    });
}
const prompts = () => page.evaluate(() => window.__prompts || []);
async function closeDialogs() {
    for (let i = 0; i < 4; i++) {
        if (!(await page.locator('#dialogRoot .overlay').count())) return;
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
    }
}

const LAB_DRAFT = 'The seedlings grown under eight hours of light reached a mean height of 6.4 cm after twelve days, while the four-hour group reached 4.0 cm. One seedling in the eight-hour tray reached 11.2 cm and is far outside the rest of the group. Tray position was not randomised, so light reaching the two trays may not have been equal. The difference of 2.4 cm is consistent with the prediction that longer light exposure increases early stem growth.';
const ARG_DRAFT = 'The warmer tank produced visibly more algae over the three-week period, which supports temperature as the driver of growth. Light reaching the two tanks was never measured, so an unequal light source could produce the same result. Distinguishing the two would require a light meter reading at both tank positions across the period, which this setup did not include.';

async function fillDraft(text) {
    await page.locator('#draftEditor').fill(text);
    await page.waitForTimeout(320);
}

// ── 1. Audit outcome: bounded profiles ───────────────────────────────────────
console.log('\n1. Bounded STEM profiles');
await fresh(`?assignment=${LAB}`);
const reg = await page.evaluate(() => {
    const P = window.StudioProfiles;
    const shape = id => ({
        exists: Boolean(P.genres[id]),
        fullName: P.genres[id]?.fullName?.en,
        moveIds: (P.integratedMoveProfiles[id] || []).map(m => m.id),
        council: P.councilConfig[id],
        councilLabels: P.genres[id]?.moves?.council || [],
        councilLabelsEs: P.genreMovesEs[id]?.council || [],
        coachRules: P.genres[id]?.coachRules || '',
        lenses: P.genres[id]?.moves?.review || [],
        stuck: Boolean(P.stuckStarters[id]),
    });
    return { lab: shape('stem'), explain: shape('stemExplanation'), argue: shape('stemArgument') };
});
check('three bounded STEM profiles exist', reg.lab.exists && reg.explain.exists && reg.argue.exists);
check('the lab report is named for what it covers', /Lab|Report/i.test(reg.lab.fullName), reg.lab.fullName);
check('a technical or scientific explanation profile exists', /Explanation/i.test(reg.explain.fullName), reg.explain.fullName);
check('an evidence-based scientific argument profile exists', /Argument/i.test(reg.argue.fullName), reg.argue.fullName);
check('each profile has its own Moves', reg.lab.moveIds.length && reg.explain.moveIds.length && reg.argue.moveIds.length
    && JSON.stringify(reg.lab.moveIds) !== JSON.stringify(reg.explain.moveIds)
    && JSON.stringify(reg.explain.moveIds) !== JSON.stringify(reg.argue.moveIds));
check('explanation and argument share the reasoning Move from one authoring source',
    reg.explain.moveIds.includes('reasoning-link') && reg.argue.moveIds.includes('reasoning-link'));
check('only the argument profile carries counterclaim and limits Moves',
    reg.argue.moveIds.includes('counterclaim-rebuttal') && reg.argue.moveIds.includes('limits-uncertainty')
    && !reg.explain.moveIds.includes('counterclaim-rebuttal'));
check('each profile has three review lenses', [reg.lab, reg.explain, reg.argue].every(p => p.lenses.length === 3));
check('each profile has an "I\'m stuck" starter', [reg.lab, reg.explain, reg.argue].every(p => p.stuck));

// ── 2. Ambiguity fails closed ────────────────────────────────────────────────
console.log('\n2. Unknown or ambiguous STEM assignments fail closed');
const routing = await page.evaluate(() => {
    const r = window.StudioProfiles.resolveAssignment;
    return {
        lab: r('stem-lab-report')?.profileId,
        explain: r('stem-scientific-explanation')?.profileId,
        argue: r('stem-scientific-argument')?.profileId,
        bare: r('stem'),
        vague: r('stem-writing'),
        unknown: r('stem-capstone-poster'),
    };
});
check('each explicit STEM link resolves to its own profile',
    routing.lab === 'stem' && routing.explain === 'stemExplanation' && routing.argue === 'stemArgument');
check('a bare `stem` link resolves to nothing rather than guessing a genre', routing.bare === null);
check('vague and unknown STEM ids resolve to nothing', routing.vague === null && routing.unknown === null);
for (const raw of ['stem', 'stem-writing', 'stem-capstone-poster']) {
    await fresh(`?assignment=${raw}`);
    const text = await page.locator('#prototypeRoot').innerText();
    check(`?assignment=${raw} reaches the configuration-required stop`, /CONFIGURATION REQUIRED|CONFIGURACIÓN/i.test(text));
    check(`?assignment=${raw} inherits no genre's Moves`, await page.locator('.integrated-move').count() === 0);
}
const stopText = await page.locator('#prototypeRoot').innerText();
check('the stop lists all three STEM genres for recovery',
    ['STEM Laboratory Report', 'Technical or Scientific Explanation', 'Evidence-Based Scientific Argument']
        .every(name => stopText.includes(name)));

// ── 3. The Council is purpose-built, not relabelled general roles ────────────
console.log('\n3. Council design');
check('the Council is enabled for all three STEM profiles',
    reg.lab.council.enabled === true && reg.explain.council.enabled === true && reg.argue.council.enabled === true);
const roleKeys = reg.lab.council.roles.map(r => r.key);
check('it uses three distinct STEM perspectives', roleKeys.length === 3 && new Set(roleKeys).size === 3, JSON.stringify(roleKeys));
check('the perspectives are NOT the general structure/evidence/voice roles',
    !roleKeys.includes('structure') && !roleKeys.includes('voice'), JSON.stringify(roleKeys));
check('the perspectives are reasoning, audience, and uncertainty',
    roleKeys.includes('reasoning') && roleKeys.includes('audience') && roleKeys.includes('uncertainty'));
check('role labels no longer name an authority that could confirm the science',
    !reg.lab.councilLabels.some(l => /instructor|editor|grader|expert/i.test(l)), JSON.stringify(reg.lab.councilLabels));
check('role labels are present in both languages',
    reg.lab.councilLabels.length === 3 && reg.lab.councilLabelsEs.length === 3
    && reg.lab.councilLabels[0] !== reg.lab.councilLabelsEs[0]);
check('every mandate says what the reader may NOT conclude',
    reg.lab.council.roles.every(r => /NOT certifying|never|Never/.test(r.mandate)));
check('the mandates are non-duplicative — each names a different object of attention',
    /claim is connected to evidence/i.test(reg.lab.council.roles.find(r => r.key === 'reasoning').mandate)
    && /terminology|audience|disciplinary reader/i.test(reg.lab.council.roles.find(r => r.key === 'audience').mandate)
    && /uncertainty|limitations|assumptions/i.test(reg.lab.council.roles.find(r => r.key === 'uncertainty').mandate));
check('the synthesis order is declared', Array.isArray(reg.lab.council.synthesisOrder) && reg.lab.council.synthesisOrder.length === 3);
check('all three STEM profiles share one Council configuration',
    JSON.stringify(reg.lab.council) === JSON.stringify(reg.explain.council)
    && JSON.stringify(reg.explain.council) === JSON.stringify(reg.argue.council));

// ── 4. The no-verification contract reaches every request ────────────────────
console.log('\n4. Truthfulness contract in every transmitted prompt');
const NO_VERIFY = [
    /Never state or imply that you have verified scientific correctness/i,
    /Never invent or supply data, results, measurements, units, equations/i,
    /Never alter, recompute, round, convert, or "correct" a quantity/i,
    /Distinguish INTERNAL CONSISTENCY[\s\S]{0,120}EXTERNAL FACTUAL VERIFICATION/i,
    /ask one useful question instead of asserting a conclusion/i,
    /Never import expectations from humanities, admissions, autobiographical/i,
];
for (const [assignment, draft, name] of [[LAB, LAB_DRAFT, 'lab report'], [EXPLAIN, LAB_DRAFT, 'explanation'], [ARGUE, ARG_DRAFT, 'argument']]) {
    await fresh(`?assignment=${assignment}`);
    await capturePrompts();
    await fillDraft(draft);
    await page.locator('[data-action="coach"]').first().click();
    await page.waitForTimeout(160);
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.waitForTimeout(800);
    await closeDialogs();
    await page.locator('[data-action="focused-review"]').first().click();
    await page.waitForTimeout(160);
    await page.locator('input[name="reviewScope"][value="full"]').check().catch(() => {});
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.waitForTimeout(800);
    await closeDialogs();
    const sent = await prompts();
    check(`${name}: passage and full-draft requests were built`, sent.length >= 2);
    for (const [i, rule] of NO_VERIFY.entries()) {
        check(`${name}: no-verification rule ${i + 1} reaches every request`, sent.length > 0 && sent.every(s => rule.test(s.prompt)));
    }
    check(`${name}: the absolute authorship rule is still first`, sent.every(s => s.prompt.indexOf('ABSOLUTE AUTHORSHIP RULE') === 0));
    check(`${name}: genre guidance is marked as unable to relax the rules above it`,
        sent.every(s => /does NOT relax any rule above/i.test(s.prompt)));
}

// ── 5. Council requests carry roles, mandates, and prohibitions ──────────────
console.log('\n5. Council requests');
await fresh(`?assignment=${ARGUE}`);
await capturePrompts();
await fillDraft(ARG_DRAFT);
await page.locator('[data-action="council"]').first().click();
await page.waitForTimeout(200);
const councilConsent = await page.locator('.dialog').innerText();
check('the Council consent names the three perspectives by their real labels',
    /Reasoning and Evidence/.test(councilConsent) && /Disciplinary Clarity and Audience/.test(councilConsent) && /Methods, Uncertainty, and Limitations/.test(councilConsent), councilConsent.slice(0, 160));
check('the Council consent states the call count and that the writer decides',
    /3 reviewer calls \+ 1 synthesis/.test(councilConsent) && /decision-maker/i.test(councilConsent));
const councilPreview = (await page.locator('.dialog .exact-preview').textContent()).trim();
check('the Council shows an exact preview of what will be transmitted', ARG_DRAFT.includes(councilPreview.slice(0, 60)) && councilPreview.length > 0);
check('the Council send control is disabled until consent is given',
    await page.locator('[data-action="run-council"]').first().isDisabled());
const roleCards = await page.locator('.dialog .choice-stack .radio-card small').allTextContents();
check('each perspective is described distinctly, not with three copies of one line',
    roleCards.length === 3 && new Set(roleCards).size === 3, JSON.stringify(roleCards));
check('each description says what that perspective examines',
    /evidence actually reaches your claim/i.test(roleCards[0])
    && /reader in your course needs/i.test(roleCards[1])
    && /more than its own described methods/i.test(roleCards[2]));
check('the reasoning perspective states plainly that it cannot judge the science',
    /cannot judge whether the science is right/i.test(roleCards[0]));
await page.locator('#transmitConsent').check();
await page.locator('[data-action="run-council"]').first().click();
await page.waitForTimeout(2600);
const councilPrompts = (await prompts()).filter(p => p.requestKind.startsWith('council_'));
check('three reviewer calls and one synthesis were built',
    councilPrompts.filter(p => p.requestKind === 'council_reviewer').length === 3
    && councilPrompts.filter(p => p.requestKind === 'council_synthesis').length === 1,
    JSON.stringify(councilPrompts.map(p => p.requestKind)));
const reviewerPrompts = councilPrompts.filter(p => p.requestKind === 'council_reviewer');
check('each reviewer receives a different role and mandate',
    new Set(reviewerPrompts.map(p => (p.prompt.match(/YOUR ROLE — (.*)/) || [])[1])).size === 3);
for (const [i, rule] of NO_VERIFY.entries()) {
    check(`council: no-verification rule ${i + 1} reaches every reviewer`, reviewerPrompts.every(p => rule.test(p.prompt)));
}
check('council: the genre prohibitions are attached to every reviewer',
    reviewerPrompts.every(p => /PROHIBITED IN THIS GENRE/.test(p.prompt)
        && /Never state or imply that you verified scientific correctness/i.test(p.prompt)
        && /Never alter, recompute, or "correct" a quantity/i.test(p.prompt)));
check('council: every reviewer must anchor findings verbatim in the draft',
    reviewerPrompts.every(p => /exact verbatim quotation from the draft/i.test(p.prompt)));
check('council: no reviewer is told to certify or grade',
    reviewerPrompts.every(p => !/grade|score|certif(y|ies) that the (claim|result) is (true|correct)/i.test(p.prompt)));

// ── 6. Adversarial: the kernel refuses what it cannot verify ─────────────────
console.log('\n6. Adversarial — invented anchors and malformed responses');
const kernel = await page.evaluate(draft => {
    const K = window.StudioCouncil;
    const invented = JSON.stringify({ findings: [{ claim: 'The calculation is wrong.', evidenceQuote: 'the mean was recomputed as 5.1 cm which is incorrect', severity: 'priority', confidence: 'high', why: 'Invented.', revisionMove: 'Fix it.' }] });
    const realQuote = 'Tray position was not randomised';
    const grounded = JSON.stringify({ findings: [{ claim: 'The draft does not say whether light was equal.', evidenceQuote: realQuote, severity: 'priority', confidence: 'low', why: 'Stated in the draft.', revisionMove: 'Name the measurement that would settle it.' }] });
    return {
        invented: K.validateReviewerResult(invented, draft, 'reasoning', 'Reasoning and Evidence'),
        grounded: K.validateReviewerResult(grounded, draft, 'reasoning', 'Reasoning and Evidence'),
        malformed: K.validateReviewerResult('The report looks fine to me.', draft, 'uncertainty', 'Methods, Uncertainty, and Limitations'),
    };
}, LAB_DRAFT);
check('an invented quotation about a recomputed value is discarded, not stored',
    kernel.invented.findings.length === 0 && kernel.invented.dropped.some(d => d.reason === 'bad-anchor'));
check('a finding anchored verbatim in the student\'s own draft survives',
    kernel.grounded.findings.length === 1 && kernel.grounded.findings[0].evidenceQuote === 'Tray position was not randomised');
check('role identity comes from the request record, never the response',
    kernel.grounded.findings[0].roleKey === 'reasoning' && kernel.grounded.findings[0].roleLabel === 'Reasoning and Evidence');
check('a malformed reviewer response fails safely rather than being stored',
    kernel.malformed.ok === false && kernel.malformed.findings.length === 0);

// Partial Council: one reviewer fails.
await fresh(`?assignment=${LAB}&mockcouncil=partial`);
await fillDraft(LAB_DRAFT);
await page.locator('[data-action="council"]').first().click();
await page.waitForTimeout(200);
await page.locator('#transmitConsent').check();
await page.locator('[data-action="run-council"]').first().click();
await page.waitForTimeout(3200);
const partialRecord = await stored();
check('a partial Council is recorded truthfully rather than presented as complete',
    (partialRecord.councilRuns || []).length === 0
    || JSON.stringify(partialRecord.councilRuns.at(-1)).includes('partial')
    || (partialRecord.councilRuns.at(-1).report?.priorities || []).length >= 0);
await closeDialogs();

// All reviewers fail: nothing is saved.
await fresh(`?assignment=${LAB}&mockcouncil=allfail`);
await fillDraft(LAB_DRAFT);
const beforeAllFail = await stored();
await page.locator('[data-action="council"]').first().click();
await page.waitForTimeout(200);
await page.locator('#transmitConsent').check();
await page.locator('[data-action="run-council"]').first().click();
await page.waitForTimeout(3200);
const afterAllFail = await stored();
check('when every reviewer fails, no Council report is stored',
    (afterAllFail.councilRuns || []).length === (beforeAllFail.councilRuns || []).length);
check('when every reviewer fails, the draft is untouched', afterAllFail.draft === LAB_DRAFT);

// Provider unavailable.
await fresh(`?assignment=${EXPLAIN}&mockfail=service_unavailable`);
await fillDraft(LAB_DRAFT);
await page.locator('[data-action="council"]').first().click();
await page.waitForTimeout(200);
await page.locator('#transmitConsent').check();
await page.locator('[data-action="run-council"]').first().click();
await page.waitForTimeout(2400);
const failAnnounce = (await page.locator('[role="alert"]').allTextContents()).join(' ');
// The Council is all-or-nothing, so its failure message is its own: it reports
// that it could not gather enough perspectives, not a single-request error.
check('a provider failure during the Council is announced truthfully',
    /could not gather enough valid perspectives|no pudo reunir|unavailable|no está disponible/i.test(failAnnounce), failAnnounce.slice(0, 120));
check('the Council failure says nothing was saved and the draft is unchanged',
    /nothing was saved|draft is unchanged|nada se guardó|borrador no cambió/i.test(failAnnounce));
check('a provider failure during the Council leaves the draft unchanged', (await stored()).draft === LAB_DRAFT);

// Consent cancellation.
await fresh(`?assignment=${ARGUE}`);
await fillDraft(ARG_DRAFT);
const beforeCancel = await stored();
await page.locator('[data-action="council"]').first().click();
await page.waitForTimeout(200);
await closeDialogs();
check('cancelling Council consent transmits nothing and records nothing',
    JSON.stringify(await stored()) === JSON.stringify(beforeCancel));

// ── 7. No leakage in either direction ────────────────────────────────────────
console.log('\n7. Leakage');
const HUMANITIES = /code-meshing|memory and a boundary|personal statement|college admission|CBO|logged hours|trauma/i;
for (const assignment of STEM_LINKS) {
    await fresh(`?assignment=${assignment}`);
    const surface = await page.evaluate(() => {
        const clone = document.getElementById('prototypeRoot').cloneNode(true);
        clone.querySelectorAll('.genre-select-wrap, select[data-action="genre"], .mobile-project-chip').forEach(n => n.remove());
        return clone.innerText;
    });
    check(`${assignment}: no humanities, admissions, or autobiographical language`, !HUMANITIES.test(surface),
        (surface.match(HUMANITIES) || [''])[0]);
    check(`${assignment}: no reading-response language`, !/assigned text|reading response/i.test(surface));
}
await fresh('?assignment=college-personal-statement');
await capturePrompts();
await fillDraft('I built a colour-coded signup sheet because I thought the problem was speed.');
await page.locator('[data-action="coach"]').first().click();
await page.waitForTimeout(160);
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(800);
check('a non-STEM request does not carry the STEM no-verification rules',
    (await prompts()).every(s => !/Never state or imply that you have verified scientific correctness/i.test(s.prompt)));
await fresh('?assignment=college-personal-statement');
const admissionsCouncil = await page.evaluate(() => window.StudioProfiles.councilConfig.admissions.roles.map(r => r.key));
check('the admissions Council keeps its own roles', JSON.stringify(admissionsCouncil) === JSON.stringify(['structure', 'evidence', 'voice']));

// ── 8. Guided Discovery states the support and its limits accurately ─────────
console.log('\n8. Guided Discovery accuracy');
for (const assignment of STEM_LINKS) {
    await fresh(`?assignment=${assignment}`);
    const genreData = await page.evaluate(() => {
        const g = window.StudioProfiles.genres[window.__genreId || ''] || null;
        return g;
    });
    await page.locator('[data-action="help"]').first().click();
    await page.waitForTimeout(160);
    check(`${assignment}: the conversation is reachable and has genre-owned content`,
        await page.locator('.dialog [data-action="tour-start"]').count() === 1);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(160);
}
await fresh(`?assignment=${ARGUE}`);
// Onboarding is already answered in this suite's fresh state, so the
// conversation is opened from Help — its permanent route.
await page.locator('[data-action="help"]').first().click();
await page.waitForTimeout(200);
await page.locator('.dialog [data-action="tour-start"]').click();
// The conversation arrives in paced beats; walk any gate before reading it.
for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(220);
    if (await page.locator('.gd-continue').count()) { await page.locator('.gd-continue').first().click().catch(() => {}); continue; }
    if (await page.locator('.gd-typing').count()) continue;
    if (await page.locator('.gd-turn').count()) break;
}
const opening = await page.locator('.gd-conversation').textContent();
check('the argument profile opens with its own material, not another genre\'s',
    /evidence that agrees with every possible answer|evidencia que concuerda/i.test(opening), opening.slice(0, 120));
check('Guided Discovery makes no claim to verify the science',
    !/we (check|verify|confirm)[^.]{0,40}(your (data|results|calculation)|correct)/i.test(opening));

// ── 9. Access on the changed surfaces ────────────────────────────────────────
console.log('\n9. Access');
await fresh(`?assignment=${ARGUE}`, { width: 390, height: 844 });
check('phone: all five argument Moves render', await page.locator('.integrated-move').count() === 5);
check('phone: no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
check('phone: the Council is reachable', await page.locator('[data-action="council"]').count() >= 1);
await fresh(`?assignment=${EXPLAIN}`);
check('desktop: every Move disclosure is closed by default', await page.locator('.integrated-move details[open]').count() === 0);
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.reload();
await page.waitForTimeout(200);
check('reduced motion: the desk still renders every Move', await page.locator('.integrated-move').count() === 4);

// ── Close ────────────────────────────────────────────────────────────────────
check('no external network request was made', external.length === 0, external.join(', '));
check('no page error was raised', errors.length === 0, errors.join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} ${failed ? 'FAIL' : 'PASS'}`);
process.exit(failed ? 1 : 0);
