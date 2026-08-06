// Writing Studio migration candidate — ordinary non-AI writing journey.
// The complete student path from empty draft to local packet with zero AI use,
// zero consent dialogs, and zero readiness shaming, across contrasting genres.
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const KEY = 'tupana-studio:v1';
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
let page = null;

// Each journey runs in a fresh browser context (clean storage), because the
// studio, like the finalist, saves on beforeunload — clearing localStorage on a
// live page would be resurrected by the in-memory state on navigation.
async function fresh(assignment) {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(7000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html`);
    await page.evaluate(key => {
        localStorage.removeItem(key);
        // Desk suites: onboarding is answered so the Studio opens on the Desk.
        // The first-run welcome that precedes it for a genuinely new writer has
        // its own suite (studio_onboarding_test.mjs) and is covered there.
        localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
        localStorage.setItem('tupana_draft', 'R0 JOURNEY SENTINEL');
    }, KEY);
    await page.goto(assignment ? `${ORIGIN}/studio.html?assignment=${assignment}` : `${ORIGIN}/studio.html`);
}
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);

async function ordinaryJourney(assignment, draftText, label) {
    console.log(`\nOrdinary non-AI journey — ${label}`);
    await fresh(assignment);
    check(`${label}: typing needs zero mandatory actions`, await page.locator('#draftEditor').isEnabled() && await page.locator('.dialog').count() === 0);
    await page.locator('#draftEditor').fill(draftText);
    await page.waitForTimeout(280);
    await page.reload();
    check(`${label}: exact draft survives reload`, await page.locator('#draftEditor').inputValue() === draftText);
    check(`${label}: no consent surface appears in the ordinary path`, await page.locator('.consent-box:visible').count() === 0);
    await page.locator('.phase-strip [data-action="reflection"]').click();
    for (const key of ['changed', 'decision', 'voice']) {
        await page.locator(`#reflection-${key}`).fill(`Student-authored response about ${key}.`);
    }
    await page.locator('[data-action="save-reflection"]').click();
    await page.locator('.phase-strip [data-action="finish"], [data-action="finish"]').first().click();
    const finishText = await page.locator('.finish-page').textContent();
    check(`${label}: Finish reports Council and AI as optional, never failed readiness`, /No Council requested—optional|Council evidence is included/.test(finishText) && /No AI decisions—AI is optional|Suggestion decisions/.test(finishText));
    await page.locator('#packetConfirm').check();
    await page.locator('[data-action="create-packet"]').click();
    const record = await stored();
    check(`${label}: packet embeds the exact confirmed draft`, record.packetDraft === draftText && Boolean(record.packetCreatedAt));
    check(`${label}: journey used zero AI — no reviews, Council runs, or decisions`, record.reviews.length === 0 && record.councilRuns.length === 0 && record.decisions.length === 0);
    check(`${label}: reflection is student-authored text only`, record.reflections.changed.includes('Student-authored'));
}

await ordinaryJourney('mixed-genre-autobiographical-essay', 'En la biblioteca aprendí que escuchar viene primero. That lesson still shapes how I write today, and this synthetic draft develops it with one concrete scene.', 'autobiographical');
await ordinaryJourney('stem-lab-report', 'The seedlings under longer light grew measurably taller than the control group. This synthetic report separates that observation from its interpretation and names one limitation.', 'STEM');
await ordinaryJourney('research-paper', 'My sources disagree about how much community gardens reduce food insecurity. This synthetic paragraph places two of them in conversation and names the tension between their measures.', 'research');

console.log('\nGenre-true Moves with deeper legacy guidance');
await fresh('mixed-genre-autobiographical-essay');
await page.locator('.integrated-move details:not(.move-example) > summary').first().click();
let deeper = await page.locator('.integrated-move .move-deeper').first().textContent();
check('autobiographical Move discloses deeper legacy guidance (three-element memory)', /specific place, a specific person or relationship/.test(deeper));
check('deeper guidance never uses compulsory framing', !/you must|debes\b/i.test(deeper));
await fresh('graduate-sop');
const sopCards = page.locator('.integrated-move');
await sopCards.nth(1).locator('details:not(.move-example) > summary').click();
deeper = await sopCards.nth(1).locator('.move-deeper').textContent();
check('SOP evidence Move carries the CLAIM→EVIDENCE→REFLECTION→FORWARD LINK map with honesty tags', /CLAIM → CONCRETE EVIDENCE → REFLECTION → FORWARD LINK/.test(deeper) && /\[VERIFIED\]/.test(deeper));
await fresh('college-personal-statement');
await page.locator('.integrated-move details:not(.move-example) > summary').first().click();
deeper = await page.locator('.integrated-move .move-deeper').first().textContent();
check('admissions disclosure Move keeps the bounded no-trauma-demand inventory', /stop after three/.test(deeper) && /trauma/.test(deeper));

console.log('\nGenre-true stuck support');
await fresh('cap200-bronx-beautiful-service-learning');
await page.locator('#draftEditor').fill('Synthetic service-learning draft grounded in logged hours.');
await page.locator('[data-action="stuck"]').click();
await page.locator('[data-action="stuck-choice"][data-choice="idea"], [data-choice="idea"]').first().click();
const microtask = await page.locator('.stuck-microtask').textContent();
check('CAP 200 stuck starter speaks service-learning evidence, not memories', /hour logged|hora registrada|journal note|nota de diario/.test(microtask) && !/memory|memoria/.test(microtask));

console.log('\nIsolation and stability');
check('R0 sentinel untouched across all journeys', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 JOURNEY SENTINEL');
check('no external requests across all journeys', external.length === 0, external.join(', '));
check('zero page errors across all journeys', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
