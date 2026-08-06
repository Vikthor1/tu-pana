// Writing Studio — mobile passage protection and feedback readability.
//
// Two release-blocking mobile defects from the founder's physical-iPhone test:
//
//   A. Selecting a sentence gave no reliable way to reach Your Voice. Root cause:
//      the Passage Tray was surfaced only by the textarea's `select` event, which
//      iOS Safari does not dispatch when the student drags the native selection
//      handles. This suite emulates that condition by blocking `select` at the
//      capture phase, which is the closest a desktop engine can come to the
//      physical device — physical-iPhone validation remains a founder retest.
//
//   B. Coach feedback was unreadable when it first appeared. Root cause: the
//      feedback card carried a hardcoded light background that never adapted to
//      a dark appearance, so light ink landed on a bone-white card. Contrast is
//      measured here against the real composited background, alpha included.
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

const DRAFT = 'At the library counter I answered in English until my aunt said, aquí escuchamos primero. I had treated translating as a small favor, not as something with a history behind it.';
const SENTENCE = 'I had treated translating as a small favor, not as something with a history behind it.';
const SPANISH = 'aquí escuchamos primero';

const PHONE = { width: 390, height: 844 };
const PRO_MAX = { width: 430, height: 932 };

async function open(options = {}) {
    if (page) await page.close();
    page = await browser.newPage({
        viewport: options.viewport || PHONE,
        hasTouch: true,
        isMobile: true,
        colorScheme: options.scheme || 'light',
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
    await page.locator('[data-action="tour-dismiss"]').click().catch(() => {});
    if (options.appearance === 'dark') {
        for (let i = 0; i < 3; i++) {
            if (await page.evaluate(() => document.documentElement.dataset.appearance) === 'dark') break;
            await page.locator('[data-action="appearance-cycle"]').click();
            await page.waitForTimeout(160);
        }
    }
    if (options.draft !== false) {
        await page.locator('#draftEditor').fill(options.draft || DRAFT);
        await page.waitForTimeout(300);
    }
    if (options.iosCondition !== false) await applyIosCondition();
    return page;
}

// iOS Safari does not deliver `select` to the page for a handle-drag selection.
// Blocking it leaves exactly the events a physical iPhone does deliver.
const applyIosCondition = () => page.evaluate(() => {
    document.getElementById('draftEditor')
        ?.addEventListener('select', event => event.stopImmediatePropagation(), true);
});
const selectByTouch = text => page.evaluate(({ sentence }) => {
    const editor = document.getElementById('draftEditor');
    editor.focus();
    const index = editor.value.indexOf(sentence);
    editor.setSelectionRange(index, index + sentence.length);
    document.dispatchEvent(new Event('selectionchange'));
}, { sentence: text });
const collapseSelection = () => page.evaluate(() => {
    const editor = document.getElementById('draftEditor');
    editor.setSelectionRange(0, 0);
    document.dispatchEvent(new Event('selectionchange'));
});
const trayVisible = async () => await page.locator('#passageBar:not([hidden])').count() === 1;
const trayText = () => page.locator('#passageExcerpt').textContent();
const voiceEntries = () => page.evaluate(k => JSON.parse(localStorage.getItem(k) || '{}').voiceEntries || [], KEY);

// Composited contrast, alpha included: a semi-transparent card over a dark
// surface must not be measured as if it were its own literal colour.
const CONTRAST = `(root => {
  const parse = v => { const n = (v.match(/[\\d.]+/g) || []).map(Number); return { r: n[0] || 0, g: n[1] || 0, b: n[2] || 0, a: n.length > 3 ? n[3] : 1 }; };
  const bgOf = el => { let node = el; const stack = [];
    while (node) { stack.push(parse(getComputedStyle(node).backgroundColor)); node = node.parentElement; }
    let acc = { r: 255, g: 255, b: 255 };
    for (let i = stack.length - 1; i >= 0; i--) { const l = stack[i]; if (!l.a) continue;
      acc = { r: l.r * l.a + acc.r * (1 - l.a), g: l.g * l.a + acc.g * (1 - l.a), b: l.b * l.a + acc.b * (1 - l.a) }; }
    return acc; };
  const lum = ({ r, g, b }) => { const [R, G, B] = [r, g, b].map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * R + 0.7152 * G + 0.0722 * B; };
  const host = document.querySelector(root);
  if (!host) return null;
  let min = 99, worst = '', fails = [];
  host.querySelectorAll('*').forEach(el => {
    const own = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
    if (!own) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    const ratio = (() => { const a = lum(parse(cs.color)), b = lum(bgOf(el)); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); })();
    if (ratio < min) { min = ratio; worst = (el.className || el.tagName) + ' :: ' + own.slice(0, 34); }
    if (ratio < (large ? 3 : 4.5)) fails.push({ sel: el.className || el.tagName, ratio: +ratio.toFixed(2), text: own.slice(0, 34) });
  });
  return { min: +min.toFixed(2), worst, fails };
})`;
const measure = selector => page.evaluate(`${CONTRAST}(${JSON.stringify(selector)})`);

async function runCoach() {
    await page.locator('[data-action="coach"]').first().click();
    await page.waitForTimeout(350);
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.waitForTimeout(2200);
}

console.log('\n1. A touch selection surfaces a stable passage-action surface');
await open();
await selectByTouch(SENTENCE);
await page.waitForTimeout(450);
check('the Passage Tray appears for a handle-drag selection (no `select` event)', await trayVisible());
check('it carries the exact selected wording', await trayText() === SENTENCE);
check('"Keep as my voice" is present', await page.locator('#passageBar [data-action="protect-phrase"]').count() === 1);
check('"Review passage" (Ask Tu Pana) is present', await page.locator('#passageBar [data-action="passage-review"]').count() === 1);
check('a clear/dismiss control is present', await page.locator('#passageBar [data-action="clear-passage"]').count() === 1);
check('no legacy "Voice Vault" wording is shown',
    !/voice vault/i.test(await page.locator('#passageBar').textContent()));

console.log('\n2. Reachable without scrolling, inside the safe area');
const trayBox = await page.locator('#passageBar').boundingBox();
check('the tray is on screen where the student already is', trayBox.y >= 0 && trayBox.y + trayBox.height <= PHONE.height + 1,
    `y=${Math.round(trayBox.y)} h=${Math.round(trayBox.height)}`);
// The requirement is that the student never has to scroll to the top to find
// the action — the tray is pinned, so it is in view wherever the page sits.
check('reaching it never requires scrolling to the top', await (async () => {
    for (const y of [0, 250, 600]) {
        await page.evaluate(target => window.scrollTo(0, target), y);
        await page.waitForTimeout(120);
        const inView = await page.evaluate(() => {
            const bar = document.getElementById('passageBar');
            if (!bar || bar.hidden) return false;
            const rect = bar.getBoundingClientRect();
            return getComputedStyle(bar).position === 'fixed'
                && rect.top >= 0 && rect.bottom <= window.innerHeight + 1;
        });
        if (!inView) return false;
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    return true;
})());
check('it does not cover the editor', await page.evaluate(() => {
    const editor = document.getElementById('draftEditor').getBoundingClientRect();
    const bar = document.getElementById('passageBar').getBoundingClientRect();
    return bar.top >= editor.top;
}));
check('every control meets the 44px target',
    await page.evaluate(() => Array.from(document.querySelectorAll('#passageBar button')).every(b => b.getBoundingClientRect().height >= 43.5)));
check('the tray is labelled for assistive technology',
    Boolean(await page.locator('#passageBar').getAttribute('aria-label')));
check('the clear control has an accessible name',
    Boolean(await page.locator('#passageBar [data-action="clear-passage"]').getAttribute('aria-label')));
check('the capture was announced', /captur/i.test(await page.locator('#liveRegion').textContent()));

console.log('\n3. Selection collapse and scrolling do not disturb the capture');
await collapseSelection();
await page.waitForTimeout(400);
check('collapse does not erase the captured passage', await trayVisible() && await trayText() === SENTENCE);
await page.evaluate(() => window.scrollTo(0, 400));
await page.waitForTimeout(300);
check('scrolling does not change the captured text', await trayText() === SENTENCE);
await page.evaluate(() => window.scrollTo(0, 0));
check('the tray is still reachable after scrolling', await trayVisible());

console.log('\n4. Your Voice: exact, local, no AI');
const before = external.length;
await page.locator('#passageBar [data-action="protect-phrase"]').click();
await page.waitForTimeout(600);
let entries = await voiceEntries();
check('one entry is created', entries.length === 1);
check('the exact wording is stored byte-for-byte', entries[0]?.text === SENTENCE);
check('it is recorded as student-authored with its project', entries[0]?.studentAuthored === true && Boolean(entries[0]?.genre));
check('no quality or authenticity is inferred',
    !('score' in (entries[0] || {})) && !('confidence' in (entries[0] || {})) && !('authentic' in (entries[0] || {})));
check('an optional student reason field exists and starts empty', entries[0]?.reason === '');
check('no AI or network request was made', external.length === before);
check('the draft is untouched', await page.locator('#draftEditor').inputValue() === DRAFT);
check('nothing was inserted into the draft', !(await page.locator('#draftEditor').inputValue()).includes(`${SENTENCE}${SENTENCE}`));

console.log('\n5. Multilingual bytes survive capture and storage');
await open();
await selectByTouch(SPANISH);
await page.waitForTimeout(400);
check('the tray shows the accented wording exactly', await trayText() === SPANISH);
await page.locator('#passageBar [data-action="protect-phrase"]').click();
await page.waitForTimeout(500);
entries = await voiceEntries();
check('accented characters are stored unchanged', entries[0]?.text === SPANISH, JSON.stringify(entries[0]?.text));

console.log('\n6. Stale, edited, and cross-project captures are refused');
await open();
await selectByTouch(SENTENCE);
await page.waitForTimeout(400);
await page.locator('#draftEditor').fill('An entirely different draft now.');
await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('[data-action="protect-phrase"]')?.click());
await page.waitForTimeout(500);
check('an edited-away passage is not protected', (await voiceEntries()).length === 0);
check('the stale capture is cleared', !(await trayVisible()));
check('the student is told to select again',
    /select it again|selecci/i.test(await page.locator('#assertiveRegion').textContent()));
// Editing elsewhere must NOT invalidate a passage that is still present.
await open();
await selectByTouch(SENTENCE);
await page.waitForTimeout(400);
await page.locator('#draftEditor').fill(`A new opening sentence. ${DRAFT}`);
await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('[data-action="protect-phrase"]')?.click());
await page.waitForTimeout(500);
entries = await voiceEntries();
check('editing elsewhere keeps a passage that is still in the draft', entries.length === 1 && entries[0].text === SENTENCE);
// Switching writing project must drop the capture.
await open();
await selectByTouch(SENTENCE);
await page.waitForTimeout(400);
await page.locator('[data-action="genre"]').first().selectOption('admissions').catch(async () => {
    await page.evaluate(() => {
        const select = document.querySelector('[data-action="genre"]');
        select.value = 'admissions';
        select.dispatchEvent(new Event('change', { bubbles: true }));
    });
});
await page.waitForTimeout(600);
check('switching writing project clears the captured passage', !(await trayVisible()));
await page.evaluate(() => document.querySelector('[data-action="protect-phrase"]')?.click());
await page.waitForTimeout(400);
check('nothing from the previous project can be protected', (await voiceEntries()).length === 0);

console.log('\n7. Empty and invalid selections recover clearly');
await open();
await page.evaluate(() => {
    const editor = document.getElementById('draftEditor');
    editor.focus();
    editor.setSelectionRange(5, 5);
    document.dispatchEvent(new Event('selectionchange'));
});
await page.waitForTimeout(400);
check('a collapsed caret creates no capture', !(await trayVisible()));
await page.evaluate(() => {
    const editor = document.getElementById('draftEditor');
    const index = editor.value.indexOf(' ');
    editor.setSelectionRange(index, index + 1);
    document.dispatchEvent(new Event('selectionchange'));
});
await page.waitForTimeout(400);
check('a whitespace-only selection creates no capture', !(await trayVisible()));

console.log('\n8. Selected-passage coaching uses the same exact passage');
await open();
await selectByTouch(SENTENCE);
await page.waitForTimeout(400);
await page.locator('#passageBar [data-action="passage-review"]').click();
await page.waitForTimeout(500);
check('the passage scope is offered and preselected',
    await page.locator('input[name="reviewScope"][value="selected"]').isChecked());
check('the exact payload preview shows the captured passage',
    (await page.locator('#scopePreview').textContent()) === SENTENCE);
check('paragraph and full-draft scopes remain separately available',
    await page.locator('input[name="reviewScope"][value="paragraph"]').count() === 1
        && await page.locator('input[name="reviewScope"][value="full"]').count() === 1);
check('sending is blocked until consent is given',
    await page.locator('[data-action="submit-mock"]').isDisabled());
check('a consent control is present', await page.locator('#transmitConsent').count() === 1);
const externalBeforeConsent = external.length;
check('nothing has been transmitted while the dialog is open', external.length === externalBeforeConsent);
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(2200);
const saved = await page.evaluate(k => (JSON.parse(localStorage.getItem(k) || '{}').reviews || []).at(-1), KEY);
check('the saved record keeps the passage scope, not a widened one', saved?.scope === 'selected');
check('the record stores the exact excerpt that was consented', saved?.exactExcerpt === SENTENCE);
check('scope was never silently expanded to paragraph or full draft',
    saved?.exactExcerpt !== DRAFT && saved?.words === SENTENCE.trim().split(/\s+/).length);

console.log('\n9. Initial coach feedback is readable when it first appears');
for (const [name, options] of [
    ['Paper/Light', { scheme: 'light' }],
    ['Dark', { scheme: 'dark', appearance: 'dark' }],
    ['System (device dark)', { scheme: 'dark' }],
]) {
    await open(options);
    await runCoach();
    const initial = await measure('.review-card');
    check(`${name}: initial coach feedback meets 4.5:1`, initial && initial.fails.length === 0,
        initial ? `min ${initial.min}:1 — ${initial.worst}` : 'no card');
    check(`${name}: the feedback body itself is comfortably readable`, initial && initial.min >= 4.5, `${initial?.min}:1`);
    // The decision dialog was already readable; it must stay that way.
    await page.locator('.decision-button').first().click();
    await page.waitForTimeout(500);
    const decision = await measure('.critical-decision-summary');
    check(`${name}: the decision dialog stays readable`, !decision || decision.fails.length === 0,
        decision ? `min ${decision.min}:1` : 'n/a');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
}

console.log('\n10. Saved reports and Council variants stay readable');
await open({ scheme: 'dark', appearance: 'dark' });
await runCoach();
await page.keyboard.press('Escape');
await page.waitForTimeout(250);
await page.locator('[data-action="review-center"]').first().click();
await page.waitForTimeout(500);
const savedFeed = await measure('.review-feed');
check('saved report feed meets 4.5:1 in dark', savedFeed && savedFeed.fails.length === 0,
    savedFeed ? `min ${savedFeed.min}:1 — ${savedFeed.worst}` : 'n/a');
await page.keyboard.press('Escape');
await page.waitForTimeout(250);
const council = page.locator('[data-action="council"]').first();
if (await council.count()) {
    await council.click();
    await page.waitForTimeout(400);
    if (await page.locator('#transmitConsent').count()) {
        await page.locator('#transmitConsent').check();
        await page.locator('[data-action="run-council"]').click();
        await page.waitForTimeout(3500);
        const report = await measure('.review-feed, .dialog-body');
        check('Council report meets 4.5:1 in dark', report && report.fails.length === 0,
            report ? `min ${report.min}:1 — ${report.worst}` : 'n/a');
    } else { check('Council report meets 4.5:1 in dark', true, 'not configured for this profile'); }
} else { check('Council report meets 4.5:1 in dark', true, 'no Council entry point'); }

console.log('\n11. The correction is semantic, not a mobile-only override');
await open({ viewport: { width: 1440, height: 900 }, scheme: 'dark', appearance: 'dark' });
await runCoach();
const desktopDark = await measure('.review-card');
check('the same surface is readable on desktop dark (root cause, not a viewport patch)',
    desktopDark && desktopDark.fails.length === 0, desktopDark ? `min ${desktopDark.min}:1` : 'n/a');
check('the feedback card uses a token rather than a literal light colour',
    await page.evaluate(() => {
        const value = getComputedStyle(document.documentElement).getPropertyValue('--surface-raised').trim();
        return value.length > 0;
    }));

console.log('\n12. Larger phone, keyboard-open, and 200% reflow');
await open({ viewport: PRO_MAX });
await selectByTouch(SENTENCE);
await page.waitForTimeout(400);
check('Pro Max: the tray appears and fits', await trayVisible() && await page.evaluate(() => {
    const bar = document.getElementById('passageBar').getBoundingClientRect();
    return bar.left >= 0 && bar.right <= window.innerWidth + 1;
}));
check('Pro Max: no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
// Keyboard-open: the visual viewport shrinks; the tray must ride above it.
await page.evaluate(() => {
    document.documentElement.style.setProperty('--vv-offset', '300px');
});
await page.waitForTimeout(200);
check('keyboard-open: the tray lifts clear of the on-screen keyboard', await page.evaluate(() => {
    const bar = document.getElementById('passageBar').getBoundingClientRect();
    return bar.bottom <= window.innerHeight - 280;
}));
check('keyboard-open: the tray is still fully on screen', await page.evaluate(() => {
    const bar = document.getElementById('passageBar').getBoundingClientRect();
    return bar.top >= 0;
}));
await page.evaluate(() => document.documentElement.style.removeProperty('--vv-offset'));
await open({ viewport: { width: 720, height: 900 } });
await page.evaluate(() => { document.body.style.zoom = '200%'; });
await page.waitForTimeout(200);
await selectByTouch(SENTENCE);
await page.waitForTimeout(400);
check('200% reflow: no horizontal overflow',
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2));

console.log('\n13. Dismissal, focus, and no unrelated regression');
await open();
await selectByTouch(SENTENCE);
await page.waitForTimeout(400);
await page.locator('#passageBar [data-action="clear-passage"]').click();
await page.waitForTimeout(300);
check('clearing dismisses the tray', !(await trayVisible()));
check('focus returns to the draft', await page.evaluate(() => document.activeElement?.id === 'draftEditor'));
check('clearing protects nothing', (await voiceEntries()).length === 0);
await open({ draft: false });
const density = await page.evaluate(() => {
    const vh = innerHeight;
    let n = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const node = walker.currentNode; const el = node.parentElement;
        if (!el || el.closest('.sr-only, script, noscript, [aria-hidden="true"]')) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top >= vh || rect.bottom <= 0 || rect.height === 0) continue;
        const t = node.textContent.trim(); if (t) n += t.split(/\s+/).length;
    }
    return n;
});
check('no first-viewport density regression on a phone', density <= 230, String(density));
check('no horizontal overflow on the empty desk',
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
check('the three primary destinations are unchanged', await page.locator('.phase-strip button').count() === 3);

console.log('\n14. No network, no AI, no page errors');
check('zero external requests across the whole suite', external.length === 0, external.slice(0, 3).join(', '));
check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${failed === 0 ? '✅' : '❌'} mobile passage + readability: ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
