// Bounded Integrated Desk review-copy and revision-cycle checks.
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3001/studio.html';
const KEY = 'tupana-studio:v1';
const browser = await chromium.launch({ headless: true });
let passed = 0;
let failed = 0;
const check = (label, condition, detail = '') => {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
    if (ok) passed++; else failed++;
};

const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const external = [];
const errors = [];
page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:3001/')) external.push(request.url()); });
page.on('pageerror', error => errors.push(String(error)));
await page.goto(BASE);
// Desk suites: onboarding is answered so the Studio opens on the Desk. The
// first-run welcome that precedes it for a genuinely new writer has its own
// suite (studio_onboarding_test.mjs) and is covered there.
await page.evaluate(key => { localStorage.removeItem(key); localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' })); localStorage.setItem('tupana_draft', 'R0 REVISION-CYCLE SENTINEL'); }, KEY);
await page.reload();

console.log('\nReview copy truth and optional paths');
const before = 'Before copy: aquí escuchamos primero. Mi abuela named the bridge, and I decide what this phrase means.';
const after = `${before}\n\nCurrent draft: I add one concrete moment without standardizing the original wording.`;
await page.locator('#draftEditor').fill(before);
await page.waitForTimeout(180);
await page.locator('[data-action="review-center"]').first().click();
check('review copy entry is inside Review Center, not a primary destination or first-viewport CTA', await page.locator('.revision-cycle-center').isVisible() && await page.locator('.phase-strip .phase-tab').count() === 3);
await page.locator('[data-action="revision-cycle"]').click();
check('first review-copy action is truthful about reflection rather than finality', /not a final lock/i.test(await page.locator('.dialog').textContent()) && await page.locator('[data-action="save-review-copy"]').isVisible());
await page.locator('[data-action="save-review-copy"]').click();
let stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
const reviewId = stored.reviewCopy?.snapshotId;
check('Save a review copy stores exact local snapshot text and leaves live Draft editable', Boolean(reviewId) && stored.versions.find(v => v.id === reviewId)?.text === before && await page.locator('#draftEditor').inputValue() === before);
check('review-copy chooser offers self, existing feedback, coach, and Council as legitimate optional paths', await page.locator('.revision-paths [data-action="revision-self-review"]').isVisible() && await page.locator('.revision-paths [data-action="revision-existing-feedback"]').isVisible() && await page.locator('.revision-paths [data-action="revision-ask-feedback"]').isVisible() && await page.locator('.revision-paths [data-action="revision-council"]').isVisible());
await page.locator('[data-action="revision-self-review"]').click();
check('self-review offers one student-chosen revision, with no score or obligation', /Pick one revision to try/i.test(await page.locator('.dialog').textContent()) && /do not need to fix everything/i.test(await page.locator('.dialog').textContent()) && !/grade|improvement/i.test(await page.locator('.dialog').textContent()));
await page.locator('#revisionFocus').fill('Add one specific moment while keeping “aquí escuchamos primero.”');
await page.locator('[data-action="save-revision-focus"]').click();
stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
check('student-authored revision focus saves without changing canonical prose', stored.revisionCycle.focus.includes('specific moment') && stored.draft === before);

console.log('\nComparison, update truth, and optional closure');
await page.locator('#draftEditor').fill(after);
await page.waitForTimeout(180);
await page.locator('[data-action="review-center"]').first().click();
await page.locator('[data-action="revision-cycle"]').click();
check('changed live text offers deliberate Update review copy rather than duplicate/false final history', await page.locator('[data-action="update-review-copy"]').isVisible() && /changed since this copy/i.test(await page.locator('.dialog').textContent()));
await page.locator('[data-action="compare-review-copy"]').click();
check('desktop comparison exposes exact review-copy and exact current text without quality scoring', await page.locator('.compare-before pre').textContent() === before && await page.locator('.compare-current pre').textContent() === after && /not scored/i.test(await page.locator('.dialog').textContent()) && !/\bgrade\b|improvement/i.test(await page.locator('.dialog').textContent()));
check('comparison labels review-copy time and current Draft as editable', /Review copy saved/.test(await page.locator('.dialog').textContent()) && /Still editable/.test(await page.locator('.compare-current').textContent()));
await page.locator('[data-action="revision-brief-reflection"]').click();
await page.locator('#revisionClosure').fill('I kept the phrase because it sounds like me; I would revisit the ending later.');
await page.locator('[data-action="save-revision-closure"]').click();
stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
check('brief revision note is student-authored local evidence, not auto-filled Process Reflection', stored.revisionCycle.closure.includes('sounds like me') && stored.reflections.changed === '');
check('Process Reflection receives factual revision-cycle evidence without an AI-authored claim', await page.locator('.evidence-chips').textContent().then(text => /Exact review copy saved locally/.test(text) && /Student-authored brief revision note/.test(text)));
await page.locator('[data-action="return-write"]').click();
await page.locator('[data-action="review-center"]').first().click();
await page.locator('[data-action="revision-cycle"]').click();
await page.locator('[data-action="update-review-copy"]').click();
stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
check('updated review copy points to exact current text while original snapshot remains recoverable', stored.versions.find(v => v.id === stored.reviewCopy.snapshotId)?.text === after && stored.versions.some(v => v.id === reviewId && v.text === before));

console.log('\nFeedback, Council, and protected voice remain student-controlled');
await page.locator('[data-action="revision-ask-feedback"]').click();
check('ask-feedback path preserves existing exact-scope consent rather than transmitting silently', await page.locator('#transmitConsent').isVisible() && await page.locator('[data-action="submit-mock"]').isDisabled());
await page.locator('[data-action="close-dialog"]').first().click();
await page.locator('[data-action="review-center"]').first().click();
await page.locator('[data-action="revision-cycle"]').click();
await page.locator('[data-action="revision-council"]').click();
check('Council path preserves separate consent and has not silently created a run', await page.locator('#transmitConsent').isVisible() && (await page.evaluate(key => JSON.parse(localStorage.getItem(key)).councilRuns.length, KEY)) === 0);
await page.locator('[data-action="close-dialog"]').first().click();
await page.locator('#draftEditor').evaluate(el => { const phrase = 'aquí escuchamos primero'; const start = el.value.indexOf(phrase); el.focus(); el.setSelectionRange(start, start + phrase.length); el.dispatchEvent(new Event('select', { bubbles: true })); });
await page.waitForTimeout(80);
await page.locator('[data-action="protect-phrase"]').click();
await page.locator('[data-action="review-center"]').first().click();
await page.locator('[data-action="revision-cycle"]').click();
await page.locator('[data-action="revision-self-review"]').click();
check('revision focus makes protected Voice visible as a student-defined constraint, not a norm', /Your Voice is here if useful/.test(await page.locator('.dialog').textContent()) && /you decide what to preserve/.test(await page.locator('.dialog').textContent()));
await page.locator('[data-action="close-dialog"]').first().click();

check('revision cycle preserves native spellcheck, theme, edit utilities, stuck support, Help, and R0 sentinel', await page.locator('#draftEditor').evaluate(el => el.spellcheck) && await page.locator('[data-action="appearance-cycle"]').count() === 1 && await page.locator('[data-action="edit-undo"]').count() >= 1 && await page.locator('[data-action="stuck"]').count() === 1 && await page.locator('[data-action="help"]').count() === 1 && await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 REVISION-CYCLE SENTINEL');
check('revision-cycle path creates no external request or page error', external.length === 0 && errors.length === 0, `${external.join(', ')} ${errors.join(' | ')}`);
await page.locator('[data-action="review-center"]').first().click();
await page.locator('[data-action="revision-cycle"]').click();
await page.locator('[data-action="compare-review-copy"]').click();
await page.locator('[data-action="finish-from-revision"]').click();
check('Finish for now is a deliberate non-AI exit that preserves the exact live Draft', await page.locator('.finish-page').isVisible() && await page.locator('#finalDraftPreview').textContent() === after);
await page.close();

console.log('\nMobile comparison and calmness');
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobile.goto(BASE);
await mobile.evaluate(key => { localStorage.removeItem(key); localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' })); }, KEY);
await mobile.reload();
await mobile.locator('#draftEditor').fill('Mobile review copy: aquí escuchamos primero.');
await mobile.locator('[data-action="review-center"]').first().click();
await mobile.locator('[data-action="revision-cycle"]').click();
await mobile.locator('[data-action="save-review-copy"]').click();
await mobile.locator('[data-action="compare-review-copy"]').click();
check('mobile comparison uses accessible Before/Current controls rather than squeezed columns', await mobile.locator('.compare-mobile-tabs [role="tab"]').count() === 2 && await mobile.locator('.compare-before').isVisible() && !(await mobile.locator('.compare-current').isVisible()));
await mobile.locator('[data-action="compare-view"][data-view="current"]').click();
check('mobile Current switch preserves orientation, 44px targets, and no horizontal overflow', await mobile.locator('.compare-current').isVisible() && await mobile.locator('[data-action="compare-view"][data-view="current"]').evaluate(el => el.getBoundingClientRect().height >= 44) && await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
await mobile.locator('[data-action="compare-view"][data-view="before"]').press('Enter');
check('mobile comparison tabs are keyboard-operable and Escape closes the single dialog', await mobile.locator('.compare-before').isVisible() && (await mobile.locator('[role="dialog"]').count()) === 1);
await mobile.keyboard.press('Escape');
check('Escape returns from comparison without changing the live mobile Draft', (await mobile.locator('[role="dialog"]').count()) === 0 && await mobile.locator('#draftEditor').inputValue() === 'Mobile review copy: aquí escuchamos primero.');
await mobile.close();
await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
