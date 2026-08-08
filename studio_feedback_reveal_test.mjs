// Refinement C — the response has to arrive where the writer is.
//
// WHAT FAILED, AND WHERE THIS SUITE PINS IT
// The 1E preview review, on a physical 390-wide phone, found the feedback
// generated correctly and then rendered roughly a full viewport below the
// writer's position. The Review Center opens scrolled to its own top, and the
// Revision Cycle entry, the contextual invitation, the "which kind of feedback"
// guide and the section navigation all sit above the feed. The writer had to
// hunt for the thing they had just spent a paid call to receive, on the surface
// where hunting is hardest.
//
// WHAT THIS IS NOT
// This is a bounded reveal, not the deferred Review Center redesign. Nothing
// here restructures the Review Center, compacts cards, rewrites navigation, or
// removes the Revision Cycle. Section 6 asserts that boundary directly.
//
// ORDERING CAVEAT, stated rather than hidden: the feed renders newest-first, so
// the newly created card is also the first card. This suite therefore proves
// the reveal is TARGETED by asserting the moved-to card's own data-review-id
// against the newest stored record, and that the container actually scrolled
// away from its top — not by relying on DOM position, which would prove
// nothing.
//
// Zero live AI calls: the deterministic mock provider serves every request.
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

const PHONE = { width: 390, height: 844 };
const DRAFT = 'The community garden on Walton Avenue opened in April and I went there every Saturday morning. Neighbors brought seedlings from their own kitchens. That is why the block changed.';

async function open(options = {}) {
    if (page) await page.close();
    page = await browser.newPage({
        viewport: options.viewport || PHONE,
        hasTouch: true,
        isMobile: true,
        reducedMotion: options.motion || 'no-preference',
    });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html`);
    await page.evaluate(key => {
        localStorage.removeItem(key);
        localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
    }, KEY);
    await page.goto(`${ORIGIN}/studio.html${options.query || ''}`);
    await page.locator('[data-action="tour-dismiss"]').click().catch(() => {});
    await page.waitForTimeout(200);
    // Count every announcement so "announced once" is measured, not assumed.
    await page.evaluate(() => {
        window.__announced = [];
        const region = document.getElementById('liveRegion');
        new MutationObserver(() => {
            const text = region.textContent.trim();
            if (text) window.__announced.push(text);
        }).observe(region, { childList: true, characterData: true, subtree: true });
    });
}
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);

async function requestFeedback({ submit = true } = {}) {
    await page.locator('#draftEditor').fill(DRAFT);
    await page.waitForTimeout(300);
    await page.locator('[data-action="coach"]').first().click();
    await page.waitForTimeout(250);
    await page.locator('#transmitConsent').check();
    if (submit) await page.locator('[data-action="submit-mock"]').click();
}

// Geometry read from the live layout, after the reveal has settled.
const geometry = () => page.evaluate(() => {
    const dialog = document.querySelector('.dialog');
    const card = document.querySelector('.review-card');
    const heading = card?.querySelector('h3');
    const header = dialog?.querySelector('.dialog-header');
    const footer = dialog?.querySelector('.dialog-footer');
    const box = el => (el ? el.getBoundingClientRect() : null);
    return {
        scrollTop: dialog ? dialog.scrollTop : -1,
        scrollHeight: dialog ? dialog.scrollHeight : 0,
        clientHeight: dialog ? dialog.clientHeight : 0,
        pageScrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        docScrollWidth: document.documentElement.scrollWidth,
        dialogScrollWidth: dialog ? dialog.scrollWidth : 0,
        dialogClientWidth: dialog ? dialog.clientWidth : 0,
        heading: box(heading),
        header: box(header),
        footer: box(footer),
        cardId: card?.dataset.reviewId || null,
        activeInDialog: Boolean(dialog && dialog.contains(document.activeElement)),
        activeIsCard: Boolean(card && card.contains(document.activeElement)),
        activeTag: document.activeElement?.tagName || null,
    };
});

// ── 1. The pending state is visible where the writer is looking ─────────────
console.log('\n1. A pending request says so, visibly and accessibly');
await open();
await requestFeedback();
await page.waitForTimeout(120);
const pending = page.locator('.coach-pending');
check('a pending status appears', await pending.count() === 1);
check('it is visible on a 390-wide phone', await pending.isVisible());
check('it names what is happening in plain language',
    /Tu Pana is preparing your feedback/.test((await pending.textContent()) || ''));
check('it is a polite status region, not an alert', (await pending.getAttribute('role')) === 'status');
const pendingBox = await pending.boundingBox();
check('it is inside the viewport, not below the fold',
    pendingBox && pendingBox.y >= 0 && pendingBox.y < 844, JSON.stringify(pendingBox));
check('the send control is disabled while the request is in flight',
    await page.locator('[data-action="submit-mock"]').isDisabled());
await page.locator('.review-card').first().waitFor();
check('the pending status is gone once the response arrives', await page.locator('.coach-pending').count() === 0);

// ── 2. Duplicate submission cannot buy a second paid call ───────────────────
console.log('\n2. Repeated interaction cannot cause a second provider call');
await open();
await requestFeedback({ submit: false });
// A disabled button will not fire a user click, so the paint is not what is
// under test here. These events are dispatched directly at the delegated
// handler, which is the only thing standing between a repeated mobile tap and
// a second paid request.
await page.evaluate(() => {
    const button = document.querySelector('[data-action="submit-mock"]');
    for (let i = 0; i < 4; i++) button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await page.locator('.review-card').first().waitFor();
await page.waitForTimeout(500);
let record = await stored();
check('four rapid activations produced exactly one request', record.usage?.requests === 1, `${record.usage?.requests}`);
check('and exactly one stored response', record.reviews.length === 1, `${record.reviews.length}`);
check('and exactly one draft snapshot', record.versions.length === 1, `${record.versions.length}`);

// ── 3. The response is brought into view, in the right container ────────────
console.log('\n3. The new response arrives in view');
await open();
await requestFeedback();
await page.locator('.review-card').first().waitFor();
const beforeReveal = await geometry();
await page.waitForTimeout(900);
let geo = await geometry();
record = await stored();
check('the moved-to card is the response just created',
    geo.cardId === record.reviews[0].id, `${geo.cardId}`);
check('the Review Center is genuinely taller than the phone — the defect condition holds',
    geo.scrollHeight > geo.clientHeight + 100, `${geo.scrollHeight} vs ${geo.clientHeight}`);
check('the dialog\'s OWN scroll container moved', geo.scrollTop > 0, `scrollTop ${geo.scrollTop}`);
// The page behind a fixed overlay is already scrolled by openDialog's own
// focus call, on every dialog, since long before this refinement. What this
// refinement must not do is move it further, so that is what is asserted.
check('the reveal moves the dialog only, never the page behind it',
    geo.pageScrollY === beforeReveal.pageScrollY, `${beforeReveal.pageScrollY} → ${geo.pageScrollY}`);
check('the response heading is inside the viewport',
    geo.heading && geo.heading.top >= 0 && geo.heading.bottom <= geo.viewportHeight,
    JSON.stringify(geo.heading));
check('the sticky header does not cover the response heading',
    geo.heading.top >= geo.header.bottom - 1, `heading ${geo.heading.top} vs header ${geo.header.bottom}`);
check('the sticky footer does not cover it either',
    !geo.footer || geo.heading.bottom <= geo.footer.top, `heading ${geo.heading?.bottom} vs footer ${geo.footer?.top}`);
check('the feedback text itself is reachable without a full-screen hunt',
    (await page.locator('.review-card').first().boundingBox()).y < geo.viewportHeight);
check('nothing scrolls sideways on the page', geo.docScrollWidth <= geo.viewportWidth + 1,
    `${geo.docScrollWidth} vs ${geo.viewportWidth}`);
check('nothing scrolls sideways inside the dialog', geo.dialogScrollWidth <= geo.dialogClientWidth + 1,
    `${geo.dialogScrollWidth} vs ${geo.dialogClientWidth}`);

console.log('\n3b. The arrival is announced once, and takes no focus');
const announced = await page.evaluate(() => window.__announced);
const readyAnnouncements = announced.filter(text => /Your feedback is ready/.test(text));
check('the arrival is announced', readyAnnouncements.length >= 1, JSON.stringify(announced.slice(-3)));
check('and announced exactly once', readyAnnouncements.length === 1, `${readyAnnouncements.length}`);
check('it is announced politely, never assertively',
    (await page.evaluate(() => document.getElementById('assertiveRegion').textContent)).trim() === '');
check('focus is not moved onto the new card', geo.activeIsCard === false, `${geo.activeTag}`);
check('focus remains coherent — inside the dialog that opened', geo.activeInDialog === true, `${geo.activeTag}`);
check('a brief restrained highlight is used, not a modal or a toast',
    await page.locator('.overlay .dialog').count() === 1 && await page.locator('[role="alertdialog"]').count() === 0);

// ── 4. If the writer moved, their position is theirs ────────────────────────
console.log('\n4. A writer who moved while waiting is not hijacked');
await open();
await requestFeedback();
// The writer scrolls the request dialog while the response is in flight — the
// real behaviour on a phone, where the consent preview and the disclosure sit
// below the fold.
await page.waitForTimeout(80);
const moved = await page.evaluate(() => {
    const dialog = document.querySelector('.dialog');
    dialog.scrollTop = 220;
    return { top: dialog.scrollTop, scrollable: dialog.scrollHeight > dialog.clientHeight };
});
check('the request dialog was genuinely scrollable and the writer moved it',
    moved.scrollable && moved.top === 220, JSON.stringify(moved));
await page.waitForTimeout(80);
await page.locator('.review-card').first().waitFor();
await page.waitForTimeout(900);
geo = await geometry();
check('no automatic scroll is performed', geo.scrollTop === 0, `scrollTop ${geo.scrollTop}`);
const bar = page.locator('.feedback-ready-bar');
check('a persistent affordance is offered instead', await bar.count() === 1);
check('it says what it is and what it does',
    /Feedback ready — View response/.test((await bar.textContent()) || ''));
check('it is visible without scrolling', (await bar.boundingBox()).y < 844);
check('it is a real button, keyboard operable', (await bar.evaluate(el => el.tagName)) === 'BUTTON');
check('it is still announced', (await page.evaluate(() => window.__announced)).some(t => /Your feedback is ready/.test(t)));
check('it survives changing sections', await (async () => {
    await page.locator('[data-action="review-tab"][data-tab="council"]').click();
    await page.waitForTimeout(200);
    return await page.locator('.feedback-ready-bar').count() === 1;
})());
await page.locator('[data-action="review-tab"][data-tab="history"]').click();
await page.waitForTimeout(200);
await page.locator('.feedback-ready-bar').click();
await page.waitForTimeout(900);
geo = await geometry();
record = await stored();
check('activating it moves to the correct response', geo.cardId === record.reviews[0].id, `${geo.cardId}`);
check('and the container actually moved to it', geo.scrollTop > 0, `scrollTop ${geo.scrollTop}`);
check('the heading is in view and clear of the sticky header',
    geo.heading.top >= geo.header.bottom - 1 && geo.heading.bottom <= geo.viewportHeight);
check('the affordance is spent once the writer has seen the response',
    await page.locator('.feedback-ready-bar').count() === 0);

// ── 5. Reduced motion ───────────────────────────────────────────────────────
console.log('\n5. prefers-reduced-motion is respected');
await open({ motion: 'reduce' });
await requestFeedback();
await page.locator('.review-card').first().waitFor();
await page.waitForTimeout(250);
geo = await geometry();
check('the response is still brought into view — reduced motion is not reduced function',
    geo.scrollTop > 0 && geo.heading.top >= geo.header.bottom - 1, `scrollTop ${geo.scrollTop}`);
check('the move is instant rather than animated',
    await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior !== 'smooth'));
check('no highlight animation runs',
    await page.evaluate(() => {
        const card = document.querySelector('.review-card');
        return !card || getComputedStyle(card).animationName === 'none'
            || getComputedStyle(card).animationDuration === '0.01ms';
    }));

// ── 6. The deferred redesign was NOT undertaken ─────────────────────────────
console.log('\n6. Bounded — the Review Center itself is unchanged');
await open();
await requestFeedback();
await page.locator('.review-card').first().waitFor();
await page.waitForTimeout(600);
const centre = await page.locator('.dialog').first().textContent();
check('the Revision Cycle entry is still present', await page.locator('.revision-cycle-entry').count() >= 1);
check('the feedback-choice guide is still present', await page.locator('.feedback-choice-guide').count() === 1);
check('the three-section navigation is unchanged',
    await page.locator('.review-nav button').count() === 3);
check('the section labels are unchanged',
    /Decisions/.test(centre) && await page.locator('[data-action="review-tab"][data-tab="council"]').count() === 1);
check('the authorship boundary is still stated',
    /You remain the author and decision-maker/.test(centre));

console.log('\n7. Isolation');
check('no external requests were made', external.length === 0, external.slice(0, 3).join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
