// polishing_sprint_test.mjs — Fall 2026 calm-shell regression coverage
// Run with a local server on port 3001.

import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3001/?assignment=cap-200-first-draft';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));

let passed = 0;
let failed = 0;
function check(label, condition) {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
    if (ok) passed += 1;
    else failed += 1;
}

console.log('First visit');
await page.goto(BASE);
await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
});
await page.reload();
await page.waitForSelector('#landingMoment');

check('welcome offers one primary start-writing action',
    await page.locator('#landingContinueBtn').count() === 1);
check('three-minute guide is visibly optional',
    /3-minute guide/.test(await page.locator('#landingTourBtn').textContent()));
check('legacy manifesto does not block the editor',
    await page.locator('#maniBg.on').count() === 0);

await page.locator('#landingContinueBtn').click();
await page.waitForSelector('#landingMoment', { state: 'detached' });
await page.waitForTimeout(550);

const completion = await page.evaluate(() => ({
    onboarding: localStorage.getItem('tupana_onboarding_complete'),
    lab: localStorage.getItem('tupana_lab_done'),
    activeElement: document.activeElement?.id,
}));
check('direct start records onboarding completion', completion.onboarding === 'true');
check('direct start does not claim the optional guide was completed', completion.lab === null);
check('draft receives focus after direct start', completion.activeElement === 'draftArea');

console.log('Three-phase shell');
check('exactly three student-facing phases render',
    await page.locator('.calm-phase').count() === 3);
check('phase 1 is current at Stage 1',
    await page.locator('#calmPhase1[aria-current="step"]').count() === 1);
check('detailed route is collapsed by default',
    await page.locator('#detailedJourney').evaluate(el => getComputedStyle(el).display) === 'none');

await page.locator('#calmPathToggle').click();
check('route toggle exposes the detailed pedagogy',
    await page.locator('#detailedJourney').evaluate(el => getComputedStyle(el).display) !== 'none');
check('route toggle reports its state accessibly',
    await page.locator('#calmPathToggle').getAttribute('aria-expanded') === 'true');

await page.evaluate(() => goToStage(7));
check('Stage 7 maps to Revise',
    await page.locator('#calmPhase2[aria-current="step"]').count() === 1);
await page.evaluate(() => goToStage(10));
check('Stage 10 maps to Finish',
    await page.locator('#calmPhase3[aria-current="step"]').count() === 1);
check('no page JavaScript errors', errors.length === 0);
if (errors.length) console.log('    errors:', errors);

console.log('Phone layout');
const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
await phone.goto(BASE);
await phone.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
});
await phone.reload();
await phone.waitForSelector('#landingMoment');

check('phone welcome fits without horizontal overflow',
    await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
check('phone primary action is visible without opening the guide',
    await phone.locator('#landingContinueBtn').isVisible());
await phone.locator('#landingContinueBtn').click();
await phone.waitForSelector('#landingMoment', { state: 'detached' });
await phone.waitForTimeout(550);

check('phone keeps all three phase markers visible',
    await phone.locator('.calm-phase-marker').count() === 3);
check('phone hides the detailed selector until requested',
    await phone.locator('#mobileStageNav').evaluate(el => getComputedStyle(el).display) === 'none');
await phone.locator('#calmPathToggle').click();
check('phone reveals one compact detailed selector on request',
    await phone.locator('#mobileStageNav').evaluate(el => getComputedStyle(el).display) === 'flex' &&
    await phone.locator('#detailedJourney').evaluate(el => getComputedStyle(el).display) === 'none');
check('phone workspace fits without horizontal overflow',
    await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
await phone.close();

console.log(`\n${passed}/${passed + failed} PASS`);
await browser.close();
process.exit(failed ? 1 : 0);
