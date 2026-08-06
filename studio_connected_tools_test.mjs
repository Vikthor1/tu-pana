// Writing Studio migration candidate (forked Integrated Desk behaviors) — Connected Writing Tools checks.
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
page.setDefaultTimeout(7000);
const external = [];
const errors = [];
page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:3001/')) external.push(request.url()); });
page.on('pageerror', error => errors.push(String(error)));
await page.goto(BASE);
await page.evaluate(key => {
    localStorage.removeItem(key);
    // Desk suites: onboarding is answered so the Studio opens on the Desk.
    // The first-run welcome that precedes it for a genuinely new writer has
    // its own suite (studio_onboarding_test.mjs) and is covered there.
    localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
    localStorage.setItem('tupana_draft', 'R0 CONNECTED-TOOLS SENTINEL');
}, KEY);
await page.reload();

console.log('\nCalm fresh state');
const freshWords = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const words = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || !node.textContent.trim()) continue;
        const style = getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        if (Array.from(range.getClientRects()).some(rect => rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth)) words.push(...node.textContent.trim().split(/\s+/));
    }
    return words.length;
});
check('three primary destinations remain the only primary navigation', await page.locator('.phase-strip .phase-tab').count() === 3);
check('fresh state has no invitation, evidence archive, or Voice panel open', await page.locator('.contextual-invitation').count() === 0 && await page.locator('.evidence-archive').count() === 0 && await page.locator('.your-voice-reference').count() === 0);
// Studio density gate (documented adaptation, 2026-08-04): removing the exploration
// scaffolding (concept switcher + shorter banner, ~90px, −20 chrome words) raises the fold,
// so previously below-fold finalist surface (editor privacy line, Ask Tu Pana entry, footer)
// enters the 1440×960 viewport: 185 → 208 visible words with ZERO added surface words.
// The gate is therefore (a) fold-independent: full-page words must never exceed the finalist's
// 498-word baseline, and (b) a viewport ceiling at 215 to catch future first-screen bloat.
const fullPageWords = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let count = 0;
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || !node.textContent.trim()) continue;
        const style = getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
        // Progressive disclosure stays undisclosed: content inside a closed
        // <details> is not visible surface and does not count toward density.
        const closedDetails = parent.closest('details:not([open])');
        if (closedDetails && !parent.closest('summary')) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (!rect.width && !rect.height) continue;
        count += node.textContent.trim().split(/\s+/).length;
    }
    return count;
});
check('fresh English full-page density never exceeds the finalist baseline (498 words)', fullPageWords <= 498, `${fullPageWords} full-page words`);
check('fresh English first-viewport density stays under the 215-word ceiling', freshWords <= 215, `${freshWords} visible words`);

console.log('\nPassage-linked Move notes');
const draft = 'Opening context stays here. Aquí escuchamos primero, and the bridge between memory and public language matters. Closing context stays here.';
const quote = 'Aquí escuchamos primero';
await page.locator('#draftEditor').fill(draft);
await page.waitForTimeout(220);
await page.locator('#draftEditor').evaluate((el, selected) => {
    const start = el.value.indexOf(selected);
    el.focus(); el.setSelectionRange(start, start + selected.length);
    el.dispatchEvent(new Event('select', { bubbles: true }));
}, quote);
check('accessible Passage Tray offers a compact genre-aware Move action only after deliberate selection', await page.locator('[data-action="passage-moves"]').isVisible() && await page.locator('#passageExcerpt').textContent() === quote);
await page.locator('[data-action="passage-moves"]').click();
check('passage Move choices are current-project actions, not abstract categories or cultural leakage', /Connect memory|Ask what historical/.test(await page.locator('.passage-move-choices').textContent()) && !/lab report|program fit/i.test(await page.locator('.passage-move-choices').textContent()));
await page.locator('[data-action="passage-move"][data-move="1"]').click();
check('Move note shows the exact linked quotation and says it remains reference-only', await page.locator('.linked-passage blockquote').textContent() === quote && /Reference only/i.test(await page.locator('.dialog').textContent()));
await page.locator('[data-action="save-integrated-note"]').click();
let stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
check('clicking a Move without student writing creates no evidence record', !stored.moveNotes['autobiographical:larger-force']);

await page.locator('#draftEditor').evaluate((el, selected) => {
    const start = el.value.indexOf(selected);
    el.focus(); el.setSelectionRange(start, start + selected.length);
    el.dispatchEvent(new Event('select', { bubbles: true }));
}, quote);
await page.locator('[data-action="passage-moves"]').click();
await page.locator('[data-action="passage-move"][data-move="1"]').click();
const studentNote = 'Connect this phrase to language access; preserve “escuchamos” exactly.';
await page.locator('#integratedMoveNote').fill(studentNote);
await page.locator('[data-action="save-integrated-note"]').click();
stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
const linked = stored.moveNotes['autobiographical:larger-force'];
check('saved Move evidence is student-authored and links exact quote plus recovery context, not offsets alone', linked.text === studentNote && linked.provenance === 'student' && linked.passageLink.quote === quote && Boolean(linked.passageLink.before) && Boolean(linked.passageLink.after) && !('start' in linked.passageLink));
await page.locator('#draftEditor').fill(`New lead. ${draft} New ending.`);
await page.waitForTimeout(220);
await page.locator('[data-action="evidence-browser"]').click();
check('ordinary edits preserve a truthful exact passage link when the quotation still exists', /Exact quotation is still in the current draft/i.test(await page.locator('.evidence-entry').first().textContent()) && await page.locator('.evidence-entry blockquote').first().textContent() === quote);

console.log('\nEvidence archive and optional Move framing');
check('Evidence is a filtered reference rather than a timeline, score, or compliance meter', await page.locator('.evidence-filters button').count() === 5 && /not a completion meter/i.test(await page.locator('.dialog').textContent()) && !/streak|score|percent|complete 100/i.test(await page.locator('.dialog').textContent()));
await page.locator('[data-action="close-dialog"]').first().click();
await page.locator('#draftEditor').evaluate((el, selected) => {
    const start = el.value.indexOf(selected);
    el.focus(); el.setSelectionRange(start, start + selected.length);
    el.dispatchEvent(new Event('select', { bubbles: true }));
}, quote);
await page.locator('[data-action="passage-review"]').click();
check('Ask Tu Pana retains plain passage help while offering linked Move framing unselected', await page.locator('input[name="moveContext"]').count() === 1 && !(await page.locator('input[name="moveContext"]').isChecked()) && /general passage-help path stays available/i.test(await page.locator('.move-context-offer').textContent()));
check('optional framing discloses the exact student note and linked quotation before consent', await page.locator('.move-context-offer').textContent().then(text => text.includes(studentNote) && text.includes(quote)) && await page.locator('[data-action="submit-mock"]').isDisabled());
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(330);
stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
check('general-help path records no Move context and creates one consented local mock review', stored.reviews.length === 1 && stored.reviews[0].moveContextIncluded === null && stored.reviews[0].scope === 'selected');
await page.locator('[data-action="close-dialog"]').first().click();

console.log('  ↳ deliberate Move-framed request');
await page.locator('#draftEditor').evaluate((el, selected) => {
    const start = el.value.indexOf(selected);
    el.focus(); el.setSelectionRange(start, start + selected.length);
    el.dispatchEvent(new Event('select', { bubbles: true }));
}, quote);
await page.locator('[data-action="passage-review"]').click();
await page.locator('.move-context-offer > summary').click();
await page.locator('input[name="moveContext"]').check();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(330);
stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
check('student can deliberately include exact Move framing without changing the draft', stored.reviews.length === 2 && stored.reviews[1].moveContextIncluded.noteText === studentNote && stored.reviews[1].moveContextIncluded.quote === quote && stored.draft.includes(quote));
check('saved report preserves scope, genre, mock provenance, and optional Move provenance', stored.reviews[1].genre === 'autobiographical' && stored.reviews[1].calls === 1 && stored.reviews[1].mock === true && stored.reviews[1].moveContextIncluded.studentAuthored === true);

console.log('\nInvitations, Council restraint, and archive re-entry');
check('Move-review invitation appears only inside user-opened Review Center', await page.locator('.contextual-invitation').isVisible() && await page.locator('.dialog .contextual-invitation').count() === 1);
await page.locator('[data-action="dismiss-invitation"][data-invitation="move-review"]').click();
check('Not now removes the invitation while Focused review remains naturally discoverable', await page.locator('.contextual-invitation').count() === 0 && await page.locator('.review-nav [data-tab="history"]').isVisible());
const councilBefore = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).councilRuns.length, KEY);
await page.locator('[data-action="review-tab"][data-tab="council"]').click();
check('Council remains optional and requires a distinct consented run', await page.locator('.dialog [data-action="council"]').isVisible() && (await page.evaluate(key => JSON.parse(localStorage.getItem(key)).councilRuns.length, KEY)) === councilBefore);
await page.locator('[data-action="close-dialog"]').first().click();
await page.locator('[data-action="evidence-browser"]').click();
await page.locator('[data-action="evidence-filter"][data-filter="reviews"]').click();
check('saved reviews are dated and link back to Review Center without creating a new call', await page.locator('.evidence-entry').count() === 2 && await page.locator('[data-action="evidence-open-review"]').first().isVisible());
const reviewsBeforeReentry = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).reviews.length, KEY);
await page.locator('[data-action="evidence-open-review"]').first().click();
check('archive re-entry opens saved records and does not silently rerun AI', await page.locator('.review-card').count() === 2 && (await page.evaluate(key => JSON.parse(localStorage.getItem(key)).reviews.length, KEY)) === reviewsBeforeReentry);
await page.locator('[data-action="close-dialog"]').first().click();

console.log('\nVoice, Finish invitation, isolation, and no-network truth');
await page.locator('#draftEditor').evaluate((el, selected) => {
    const start = el.value.indexOf(selected);
    el.focus(); el.setSelectionRange(start, start + selected.length);
    el.dispatchEvent(new Event('select', { bubbles: true }));
}, quote);
await page.locator('[data-action="protect-phrase"]').click();
stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
check('Your Voice preserves exact multilingual bytes and remains absent from earlier AI payloads', stored.voiceEntries[0].text === quote && stored.reviews.every(review => !review.voiceEntriesIncluded?.length));
await page.locator('.phase-strip [data-action="finish"]').click();
check('Finish invitation appears only after a user reaches Finish with student-created evidence and remains non-blocking', await page.locator('.finish-reflection-invitation').isVisible() && await page.locator('[data-action="dismiss-invitation"][data-invitation="finish-reflection"]').isVisible() && await page.locator('[data-action="create-packet"]').isDisabled());
await page.locator('[data-action="dismiss-invitation"][data-invitation="finish-reflection"]').click();
check('Not now removes Finish invitation while Process Reflection remains available in the existing architecture', await page.locator('.finish-reflection-invitation').count() === 0 && await page.locator('[data-action="reflection"]').count() >= 1);
check('connected tools preserve R0 sentinel and make no external request or page error', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 CONNECTED-TOOLS SENTINEL' && external.length === 0 && errors.length === 0, `${external.join(', ')} ${errors.join(' | ')}`);
await page.close();

console.log('\nMobile passage and archive behavior');
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
mobile.setDefaultTimeout(7000);
await mobile.goto(BASE);
await mobile.evaluate(key => { localStorage.removeItem(key); localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' })); }, KEY);
await mobile.reload();
await mobile.locator('#draftEditor').fill(`Phone context. ${quote}. Phone ending.`);
await mobile.locator('#draftEditor').evaluate((el, selected) => {
    const start = el.value.indexOf(selected);
    el.focus(); el.setSelectionRange(start, start + selected.length);
    el.dispatchEvent(new Event('select', { bubbles: true }));
}, quote);
check('mobile Passage Tray keeps Move, Voice, review, and Clear controls inside the visual viewport', await mobile.locator('[data-action="passage-moves"]').isVisible() && await mobile.locator('[data-action="passage-moves"]').evaluate(el => el.getBoundingClientRect().height >= 44) && await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
await mobile.locator('[data-action="passage-moves"]').click();
check('mobile Move choices have accessible names, 44px targets, and one dialog', await mobile.locator('.passage-move-choices .radio-card').first().getAttribute('aria-label').then(label => label || mobile.locator('.passage-move-choices .radio-card').first().textContent()) && await mobile.locator('.passage-move-choices .radio-card').first().evaluate(el => el.getBoundingClientRect().height >= 44) && await mobile.locator('[role="dialog"]').count() === 1);
await mobile.keyboard.press('Escape');
check('Escape returns focus without mutating the multilingual draft', await mobile.locator('[role="dialog"]').count() === 0 && await mobile.locator('#draftEditor').inputValue() === `Phone context. ${quote}. Phone ending.`);
await mobile.locator('[data-action="clear-passage"]').click();
await mobile.locator('[data-action="evidence-browser"]').click();
check('mobile evidence filters reflow without horizontal page overflow and remain keyboard reachable', await mobile.locator('.evidence-filters button').first().evaluate(el => el.getBoundingClientRect().height >= 44) && await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
await mobile.locator('.evidence-filters button').first().press('Tab');
await mobile.keyboard.press('Escape');
check('mobile archive closes cleanly and ordinary non-AI writing remains available', await mobile.locator('[role="dialog"]').count() === 0 && await mobile.locator('#draftEditor').isVisible());
await mobile.close();

await browser.close();
console.log(`\nFresh density: ${freshWords} visible words`);
console.log(`${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
