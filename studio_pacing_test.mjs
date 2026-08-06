// Writing Studio — Guided Discovery conversational pacing and scroll orientation.
//
// A response group no longer lands all at once: the student's reply appears, a
// decorative composing indicator runs briefly, messages arrive one at a time,
// a live preview arrives as its own conversational event, and the explanation
// after it waits for the student. Following the conversation is chat-like:
// it follows while you are reading the newest part, and stops the moment you
// scroll up to re-read, offering "New message ↓" instead of yanking you back.
//
// Timing strategy: everything that is about ORDER runs under reduced motion,
// where the composing pause is zero — the suite never sleeps through
// conversational delays. Only the section that is genuinely about duration uses
// real timing, and it is bounded to a few seconds.
//
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
const REPLIES = '.gd-choice:not(.gd-continue)';

async function open(options = {}) {
    if (page) await page.close();
    page = await browser.newPage({
        viewport: options.viewport || { width: 1440, height: 900 },
        reducedMotion: options.motion || 'reduce',
    });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html`);
    // Desk suites: onboarding is answered so the Studio opens on the Desk.
    // The first-run welcome that precedes it for a genuinely new writer has
    // its own suite (studio_onboarding_test.mjs) and is covered there.
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' })); });
    await page.goto(`${ORIGIN}/studio.html${options.query || ''}`);
    if (options.lang) await page.locator('.prototype-actions [data-action="language"]').selectOption(options.lang);
    // Onboarding is answered in this suite's fresh state; Help is the permanent
    // route into the same conversation.
    await page.locator('[data-action="help"]').first().click();
    await page.waitForTimeout(160);
    await page.locator('.dialog [data-action="tour-start"]').click();
    await page.waitForTimeout(options.motion === 'no-preference' ? 2400 : 200);
    return page;
}
const counts = async () => ({
    turns: await page.locator('.gd-turn').count(),
    previews: await page.locator('.gd-preview').count(),
    composing: await page.locator('.gd-typing').count(),
    gate: await page.locator('.gd-continue').count(),
    replies: await page.locator(REPLIES).count(),
});
const scrollState = () => page.evaluate(() => {
    const dialog = document.querySelector('.dialog');
    return { top: Math.round(dialog.scrollTop), max: Math.round(dialog.scrollHeight - dialog.clientHeight) };
});
async function settle() {
    for (let i = 0; i < 8; i++) {
        if (await page.locator('.gd-continue').count()) { await page.locator('.gd-continue').click(); await page.waitForTimeout(60); continue; }
        if (await page.locator('.gd-typing').count()) { await page.waitForTimeout(120); continue; }
        break;
    }
}
async function tap(index = 0) {
    await settle();
    const choices = page.locator(REPLIES);
    const count = await choices.count();
    if (!count) return false;
    await choices.nth(Math.min(index, count - 1)).click();
    await page.waitForTimeout(80);
    return true;
}

console.log('\n1. A response group no longer arrives all at once');
await open({ motion: 'no-preference' });
// Step into the Moves route: that group carries a message, a live preview, and
// a pause — the shape this correction is about.
await page.locator(REPLIES).first().click();
await page.waitForSelector(REPLIES, { timeout: 6000 });
await page.waitForTimeout(200);
const baseline = (await counts()).turns;
await page.locator(REPLIES).first().click();
const frames = [];
for (let i = 0; i < 16; i++) { frames.push({ at: i * 170, ...(await counts()) }); await page.waitForTimeout(170); }
const turnCounts = [...new Set(frames.map(f => f.turns))];
check('messages arrive in separate steps rather than in one jump', turnCounts.length >= 3, turnCounts.join('→'));
check('the group is not delivered in a single frame',
    frames[0].turns < frames[frames.length - 1].turns, `${frames[0].turns} → ${frames[frames.length - 1].turns}`);
check('a composing indicator is shown between messages', frames.some(f => f.composing === 1));
check('the group ends with either replies or a continuation control',
    frames[frames.length - 1].replies > 0 || frames[frames.length - 1].gate > 0);
const firstArrival = frames.find(f => f.turns > baseline + 1);
check('the first companion message arrives inside a second',
    firstArrival && firstArrival.at <= 1200, firstArrival ? `${firstArrival.at}ms` : 'never');
check('the live preview arrives after that message, not with it',
    frames.some(f => f.previews === 0 && f.turns > baseline) && frames.some(f => f.previews === 1));

console.log('\n2. The composing indicator is brief, decorative, and skippable');
await open({ motion: 'no-preference' });
await page.locator(REPLIES).first().click();
await page.waitForTimeout(60);
const composingStart = Date.now();
let sawComposing = false;
for (let i = 0; i < 40; i++) {
    if (await page.locator('.gd-typing').count()) { sawComposing = true; break; }
    await page.waitForTimeout(25);
}
check('a composing indicator appears', sawComposing);
let gone = null;
for (let i = 0; i < 60; i++) {
    if (!(await page.locator('.gd-typing').count())) { gone = Date.now() - composingStart; break; }
    await page.waitForTimeout(25);
}
check('the pause is under a second, not a multi-second wait', gone !== null && gone < 1200, `${gone}ms`);
check('the indicator is hidden from assistive technology',
    await page.locator('.gd-typing').count() === 0
        || await page.locator('.gd-typing').first().getAttribute('aria-hidden') === 'true');
check('nothing is labelled "thinking" or presented as a generated reply',
    !/thinking|pensando|generating|generando/i.test(await page.locator('.dialog').textContent()));
// Skippability: tap the indicator to bring the next message forward.
await open({ motion: 'no-preference' });
await page.locator(REPLIES).first().click();
await page.waitForTimeout(80);
const beforeSkip = (await counts()).turns;
if (await page.locator('.gd-typing').count()) {
    await page.locator('.gd-typing').click();
    await page.waitForTimeout(90);
    check('tapping the indicator reveals the next message immediately', (await counts()).turns > beforeSkip);
} else {
    check('tapping the indicator reveals the next message immediately', false, 'indicator not present to tap');
}

console.log('\n3. Reduced motion removes the wait without breaking the order');
await open({ motion: 'reduce' });
const opened = await counts();
check('reduced motion: the opening group is present with no composing indicator',
    opened.composing === 0 && opened.turns >= 3 && opened.replies === 3);
await tap(0); await tap(0);
const paused = await counts();
check('reduced motion: the sequence still stops after the preview',
    paused.gate === 1 && paused.previews === 1 && paused.replies === 0);
await page.locator('.gd-continue').click();
await page.waitForTimeout(120);
check('reduced motion: continuing delivers the rest of the group',
    (await counts()).replies > 0 && (await counts()).gate === 0);

console.log('\n4. Order within a group: reply → message → preview → pause');
await open({ motion: 'reduce' });
await tap(0);
await tap(0);
const order = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('.gd-turn'));
    return nodes.map(n => n.classList.contains('me') ? 'me'
        : n.querySelector('.gd-preview') ? 'preview' : 'pana');
});
const tail = order.slice(order.lastIndexOf('me'));
check('the student\'s own reply is first in the group', tail[0] === 'me');
check('a companion message precedes the preview', tail.indexOf('pana') > 0 && tail.indexOf('pana') < tail.indexOf('preview'));
check('the live preview is a beat of its own', tail.includes('preview'));
check('the conversation pauses at the preview instead of burying it',
    await page.locator('.gd-continue').count() === 1);
check('the continuation control names what it does',
    /what am i seeing|qué estoy viendo/i.test(await page.locator('.gd-continue').textContent()));
check('no replies are offered until the group has finished',
    await page.locator(REPLIES).count() === 0);

console.log('\n5. At most three automatic beats follow one student choice');
for (const [name, path] of [['moves', [0, 0]], ['review', [1, 2]], ['voice', [2, 0]], ['evidence', [0, 0, 0, 0, 0, 0, 0]]]) {
    await open({ motion: 'reduce' });
    let worst = 0;
    for (const index of path) {
        await settle();
        const before = (await counts()).turns;
        const choices = page.locator(REPLIES);
        if (!(await choices.count())) break;
        await choices.nth(Math.min(index, await choices.count() - 1)).click();
        await page.waitForTimeout(220);
        // The student's own bubble plus whatever arrived on its own, measured
        // before any gate is taken.
        const added = (await counts()).turns - before - 1;
        worst = Math.max(worst, added);
    }
    check(`${name} route: no more than three automatic beats after a choice`, worst <= 3, `${worst}`);
}

console.log('\n6. No route imposes an unreasonable fixed delay');
await open({ motion: 'no-preference' });
const started = Date.now();
await page.locator(REPLIES).first().click();
await page.waitForSelector(`${REPLIES}, .gd-continue`, { timeout: 6000 });
const toInteractive = Date.now() - started;
check('a student is offered something to do within a few seconds', toInteractive < 4000, `${toInteractive}ms`);

console.log('\n7. Scroll orientation: following, and not being dragged');
await open({ motion: 'no-preference', viewport: { width: 1440, height: 700 } });
await page.locator(REPLIES).first().click();
await page.waitForTimeout(2600);
let state = await scrollState();
check('a conversation read at the bottom follows new arrivals',
    state.max - state.top <= 72, `${state.top}/${state.max}`);
check('no new-message control while the student is following', await page.locator('.gd-unread').count() === 0);
// Now scroll up deliberately, mid-group. A real wheel gesture, because
// auto-follow is only switched off by evidence of an actual gesture — a
// programmatic scrollTop assignment is exactly what must NOT stop it.
await page.locator(REPLIES).first().click();
await page.waitForTimeout(300);
await page.mouse.move(700, 350);
await page.mouse.wheel(0, -1200);
await page.waitForTimeout(250);
const held = await scrollState();
await page.waitForTimeout(2600);
const afterArrival = await scrollState();
check('scrolling up suppresses auto-follow — the reading position is kept',
    afterArrival.top === held.top, `${held.top} → ${afterArrival.top}`);
check('a new-message control appears instead', await page.locator('.gd-unread').count() === 1);
check('the new-message control has an accurate accessible name',
    /new message|mensaje nuevo/i.test(await page.locator('.gd-unread').getAttribute('aria-label') || ''));
check('content is never inserted above the reading position', afterArrival.top <= held.top);
await page.locator('.gd-unread').click();
await page.waitForTimeout(800);
const jumped = await scrollState();
check('activating it moves to the newest message', jumped.max - jumped.top <= 72, `${jumped.top}/${jumped.max}`);
check('the control disappears once the student is current', await page.locator('.gd-unread').count() === 0);
// Returning by scrolling also clears it.
await settle();
await page.mouse.move(700, 350);
await page.mouse.wheel(0, -1200);
await page.waitForTimeout(250);
if (await page.locator(REPLIES).count()) { await page.locator(REPLIES).first().click(); await page.waitForTimeout(1800); }
const pillShown = await page.locator('.gd-unread').count();
check('a later arrival while scrolled up also offers the control', pillShown === 1);
await page.mouse.wheel(0, 4000);
await page.waitForTimeout(600);
check('scrolling back down clears the new-message control',
    await page.locator('.gd-unread').count() === 0);
check('following resumes once the student is back at the newest message', await (async () => {
    const before = (await scrollState());
    await page.locator(REPLIES).first().click().catch(() => {});
    await page.waitForTimeout(2400);
    const after = await scrollState();
    return after.top >= before.top;
})());

check('a programmatic scroll is not mistaken for a student gesture', await (async () => {
    await open({ motion: 'no-preference', viewport: { width: 1440, height: 700 } });
    await page.locator(REPLIES).first().click();
    await page.waitForTimeout(2600);
    // Not a gesture: following must continue and no control may appear.
    await page.evaluate(() => { const d = document.querySelector('.dialog'); d.scrollTop = Math.max(0, d.scrollTop - 30); });
    await page.waitForTimeout(150);
    await page.locator(REPLIES).first().click();
    await page.waitForTimeout(2600);
    const state = await scrollState();
    return state.max - state.top <= 72 && await page.locator('.gd-unread').count() === 0;
})());

console.log('\n8. Focus stays where the student put it');
await open({ motion: 'no-preference' });
await page.waitForTimeout(150);
check('focus rests on the first reply after opening',
    await page.evaluate(() => document.activeElement?.classList.contains('gd-choice')));
await page.locator(REPLIES).first().click();
// While messages arrive, focus must not be dragged into a bubble or a preview.
const focusDuring = [];
for (let i = 0; i < 8; i++) {
    focusDuring.push(await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return 'none';
        if (el.closest('.gd-preview')) return 'preview';
        if (el.closest('.gd-turn')) return 'bubble';
        if (el.classList.contains('gd-choice')) return 'control';
        return el.tagName.toLowerCase();
    }));
    await page.waitForTimeout(180);
}
check('focus is never moved into an arriving bubble or preview',
    !focusDuring.includes('bubble') && !focusDuring.includes('preview'), focusDuring.join(','));
await settle();
await page.waitForTimeout(150);
check('focus lands on a control once the group is finished',
    await page.evaluate(() => document.activeElement?.classList.contains('gd-choice')
        || document.activeElement?.classList.contains('button')));
check('preview controls remain outside the tab order',
    await page.evaluate(() => Array.from(document.querySelectorAll('[data-preview-surface] button'))
        .every(b => b.getAttribute('tabindex') === '-1')));

console.log('\n9. Announcements are useful and not repetitive');
await open({ motion: 'reduce' });
await tap(0);
await page.waitForTimeout(150);
const announced = await page.evaluate(() => document.getElementById('liveRegion')?.textContent || '');
check('a meaningful companion message is announced', announced.trim().length > 10, announced.slice(0, 50));
check('the composing dots are never announced', !/•|\.\.\./.test(announced));
check('nothing is announced assertively', await page.evaluate(() => (document.getElementById('assertiveRegion')?.textContent || '')) === '');
await tap(0);
await settle();
await page.waitForTimeout(150);
const previewAnnounce = await page.evaluate(() => document.getElementById('liveRegion')?.textContent || '');
check('a preview is announced by its caption, not by its markup',
    !/Edit note|Make a note|Why this may help/i.test(previewAnnounce), previewAnnounce.slice(0, 60));

console.log('\n10. Pending reveals are cancelled by every exit route');
// Back
await open({ motion: 'no-preference' });
await page.locator(REPLIES).first().click();
await page.waitForTimeout(280);
await page.locator('[data-action="gd-back"]').click();
const afterBack = (await counts()).turns;
await page.waitForTimeout(2400);
check('Back cancels anything still arriving', (await counts()).turns === afterBack, `${afterBack} → ${(await counts()).turns}`);
check('Back leaves no composing indicator behind', await page.locator('.gd-typing').count() === 0);
// Start over
await open({ motion: 'no-preference' });
await page.locator(REPLIES).first().click();
await page.waitForTimeout(280);
await page.locator('[data-action="gd-restart"]').click();
await page.waitForTimeout(2400);
check('Start over cancels pending reveals and returns to the opening',
    (await page.locator(REPLIES).allTextContents()).length === 3 && (await counts()).turns <= 4);
// Skip and close
await open({ motion: 'no-preference' });
await page.locator(REPLIES).first().click();
await page.waitForTimeout(280);
await page.locator('[data-action="tour-skip"]').click();
await page.waitForTimeout(2400);
check('Skip during a pending reveal closes cleanly', await page.locator('.gd-conversation').count() === 0);
check('no stray message appears on the desk afterwards', await page.locator('.gd-turn').count() === 0);
await open({ motion: 'no-preference' });
await page.locator(REPLIES).first().click();
await page.waitForTimeout(280);
await page.keyboard.press('Escape');
await page.waitForTimeout(2400);
check('Escape during a pending reveal cancels it', await page.locator('.gd-conversation').count() === 0);
check('the new-message control does not outlive the conversation', await page.locator('.gd-unread').count() === 0);
// Reload
await open({ motion: 'no-preference' });
await page.locator(REPLIES).first().click();
await page.waitForTimeout(280);
await page.reload();
await page.waitForTimeout(1200);
check('reload during a pending reveal leaves a clean desk', await page.locator('.gd-conversation').count() === 0);

console.log('\n11. Language and writing-project changes never mix a group');
await open({ motion: 'reduce' });
await tap(0);
await page.waitForTimeout(120);
await page.locator('.prototype-actions [data-action="language"]').selectOption('es');
await page.waitForTimeout(400);
const group = await page.evaluate(() => {
    const turns = Array.from(document.querySelectorAll('.gd-turn'));
    const lastMe = turns.map(t => t.classList.contains('me')).lastIndexOf(true);
    return turns.slice(lastMe + 1).map(t => t.textContent.trim()).join(' ');
});
check('the current group is rebuilt in the new language', /difícil|empezar/i.test(group), group.slice(0, 60));
check('no message is left arriving in the old language', await page.locator('.gd-typing').count() === 0);
check('replies follow the new language', (await page.locator(REPLIES).allTextContents()).some(t => /No sé|Tengo|preocupa/i.test(t)));

console.log('\n12. Repeated tapping never duplicates a message');
await open({ motion: 'no-preference' });
for (let i = 0; i < 5; i++) {
    await page.locator(REPLIES).first().click({ force: true, timeout: 1200 }).catch(() => {});
    await page.waitForTimeout(40);
}
await page.waitForTimeout(3000);
await settle();
check('five rapid taps produce at most one extra exchange',
    await page.locator('.gd-turn.me').count() <= 2, String(await page.locator('.gd-turn.me').count()));

console.log('\n13. Pacing changes nothing about isolation');
await open({ motion: 'reduce' });
const before = await page.evaluate(k => localStorage.getItem(k), KEY);
for (let i = 0; i < 12; i++) if (!(await tap(0))) break;
await settle();
const during = await page.evaluate(k => localStorage.getItem(k), KEY);
check('the record is untouched while the conversation runs', during === before);
await page.evaluate(() => document.querySelector('[data-action="tour-skip"]')?.click());
await page.waitForTimeout(250);
check('the record is untouched after exiting', await page.evaluate(k => localStorage.getItem(k), KEY) === before);
check('only the two known keys exist', await (async () => {
    const keys = await page.evaluate(() => Object.keys(localStorage));
    return keys.length === 2 && keys.includes(KEY);
})());
check('no timer wrote anything to the desk', await page.locator('#draftEditor').inputValue() === '');

console.log('\n14. Bilingual and mobile pacing stay coherent');
for (const lang of ['es', 'both']) {
    await open({ motion: 'reduce', lang });
    await tap(0); await tap(0);
    check(`${lang}: the group still pauses at the preview`, await page.locator('.gd-continue').count() === 1);
    check(`${lang}: the continuation control is in the right language`,
        lang === 'es'
            ? /qué estoy viendo/i.test(await page.locator('.gd-continue').textContent())
            : /qué estoy viendo.*what am i seeing/i.test(await page.locator('.gd-continue').textContent()));
}
await open({ motion: 'reduce', viewport: { width: 390, height: 844 } });
await tap(0); await tap(0);
check('mobile: the sequence pauses at the preview', await page.locator('.gd-continue').count() === 1);
check('mobile: the continuation control meets the 44px target',
    await page.evaluate(() => document.querySelector('.gd-continue').getBoundingClientRect().height >= 43.5));
check('mobile: no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
await page.locator('.gd-continue').click();
await page.waitForTimeout(200);
check('mobile: tap-to-enlarge still works on a preview', await (async () => {
    const expand = page.locator('.gd-preview [data-action="gd-expand"]').first();
    if (!(await expand.count())) return false;
    await expand.click();
    await page.waitForTimeout(150);
    return await page.locator('.gd-preview--expanded').count() === 1;
})());
await open({ motion: 'reduce', viewport: { width: 720, height: 900 } });
await page.evaluate(() => { document.body.style.zoom = '200%'; });
await page.waitForTimeout(150);
check('200% reflow: no horizontal overflow',
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2));

console.log('\n15. No network, no AI, no page errors');
check('zero external requests across the whole suite', external.length === 0, external.slice(0, 3).join(', '));
check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${failed === 0 ? '✅' : '❌'} Guided Discovery pacing: ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
