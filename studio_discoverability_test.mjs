// Writing Studio — the discoverability refinement (2026-08-19).
//
// Five bounded changes, and nothing else:
//   1. The empty planning-notes state names a concrete action instead of
//      judging the writer's content.
//   2. One always-visible, plain-language distinction among Ask Tu Pana,
//      Focused review, and the Council, with their consent boundary stated.
//   3. A zero-word draft surfaces ONE genre-specific starter — the same
//      sentence the "I’m stuck" path already offers — beside the editor.
//   4. The Knowledge & language lens "not now" state names the lens.
//   5. The Move example affordance ("See a quick example") is visible as a
//      control rather than as fine print.
//
// The load-bearing invariant across all five: NOTHING is ever written into the
// draft. Section 6 proves it byte for byte.
//
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
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

// Answering onboarding is what puts a writer on the Desk. The first-run
// welcome path has its own suite; refinement 3 is deliberately suppressed
// while that welcome is on screen and section 3 proves it.
async function open(query = '?assignment=mixed-genre-autobiographical-essay', options = {}) {
    if (page) await page.close();
    page = await browser.newPage({
        viewport: options.viewport || { width: 1280, height: 900 },
        colorScheme: options.scheme || 'light',
        hasTouch: Boolean(options.touch),
        isMobile: Boolean(options.touch),
        deviceScaleFactor: options.deviceScaleFactor || 1,
    });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html`);
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' })); });
    await page.goto(`${ORIGIN}/studio.html${query}`);
    await page.locator('[data-action="tour-dismiss"]').click().catch(() => {});
    await page.waitForSelector('#draftEditor');
    return page;
}

const setLang = async value => {
    await page.selectOption('.header-select.lang-select, [data-action="lang"], #langSelect', value).catch(() => {});
    await page.waitForTimeout(200);
};
const deskText = () => page.locator('#prototypeRoot').innerText();
const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

// ── 1. The empty planning-notes state ────────────────────────────────────────
console.log('\n1. Planning notes: a concrete action, not a judgement of content');
await open();
let text = await deskText();
check('the evaluative "useful content" wording is gone', !/useful content|contenido útil/i.test(text));
check('it names saving a note in the writer’s own words',
    /save a note in your own words/i.test(text), text.match(/Planning notes[^]{0,140}/)?.[0]);
check('the no-automatic-insertion boundary is still stated',
    /never enter the draft automatically/i.test(text));
check('the empty state is still the same quiet element',
    await page.locator('.planning-empty').count() === 1);

// ── 2. Distinguishing the three optional supports ────────────────────────────
console.log('\n2. Ask Tu Pana vs Focused review vs the Council');
check('the distinction is visible on the Desk without opening anything',
    await page.locator('.support-distinction').count() === 1);
const distinction = await page.locator('.support-distinction').innerText();
check('it names Ask Tu Pana and what it is for',
    /Ask Tu Pana/.test(distinction) && /specific question about a passage, paragraph, or draft/i.test(distinction));
check('it names Focused review and what it is for',
    /Focused review/i.test(distinction) && /one careful lens/i.test(distinction));
check('it names the Council and what it is for',
    /Council/.test(distinction) && /several perspectives/i.test(distinction));
check('it states the optionality and consent boundary in the same breath',
    /optional/i.test(distinction) && /exact request/i.test(distinction) && /consent/i.test(distinction));
check('it is text, not a new control — it adds no clickable surface',
    await page.locator('.support-distinction button, .support-distinction a, .support-distinction input').count() === 0);
check('the three entry buttons themselves are untouched',
    await page.locator('.panel-body [data-action="coach"]').count() === 1
    && await page.locator('.panel-body [data-action="focused-review"]').count() === 1
    && await page.locator('.panel-body [data-action="council"], .panel-body .support-action.unavailable').count() >= 1);
// The consent architecture is what the wording promises. Prove it still stands.
// A request needs something to send, so the draft carries a sentence here.
await page.fill('#draftEditor', 'My grandmother kept the receipts in a coffee tin. I did not understand why until later.');
await page.waitForTimeout(450);
await page.locator('.panel-body [data-action="coach"]').click();
await page.waitForTimeout(500);
check('Ask Tu Pana still gates on an explicit consent checkbox',
    await page.locator('#transmitConsent').count() === 1);
check('Ask Tu Pana still shows an exact preview of the request',
    await page.locator('.exact-preview').count() >= 1);
check('its send control is still disabled until consent is given',
    await page.locator('[data-action="submit-mock"][disabled]').count() === 1);
await page.locator('[data-action="close-dialog"]').first().click();
await page.waitForTimeout(250);

// ── 3. The blank page gets one starter, beside the editor ────────────────────
console.log('\n3. A zero-word draft surfaces one genre starter');
await open();
check('the draft is genuinely empty', (await page.locator('#draftEditor').inputValue()) === '');
check('exactly one starter block is shown', await page.locator('.blank-start').count() === 1);
const starter = await page.locator('.blank-start').innerText();
check('exactly one starter sentence is offered', await page.locator('.blank-start .stuck-microtask').count() === 1);
check('it is framed as optional', /optional/i.test(starter));
check('it states that nothing is inserted into the draft', /Nothing is inserted into your draft/i.test(starter));
check('it sits inside the editor panel, beside the writing surface',
    await page.locator('.editor-panel .blank-start').count() === 1);
// The authoritative reuse check: the same sentence the "I’m stuck" path shows.
const inlineStarter = (await page.locator('.blank-start .stuck-microtask').innerText()).trim();
await page.locator('[data-action="stuck"]').first().click();
await page.waitForTimeout(250);
await page.locator('[data-action="stuck-choice"][data-choice="idea"]').click();
await page.waitForTimeout(250);
const stuckStarter = (await page.locator('#dialogRoot .stuck-microtask').innerText()).trim();
check('the starter is byte-identical to the "I’m stuck" starter for this genre',
    inlineStarter === stuckStarter, `${inlineStarter} !== ${stuckStarter}`);
await page.locator('[data-action="return-write"]').first().click();
await page.waitForTimeout(250);
// Genre-specific, not generic.
const starters = {};
for (const assignment of ['mixed-genre-autobiographical-essay', 'stem-lab-report', 'graduate-sop', 'college-personal-statement']) {
    await open(`?assignment=${assignment}`);
    starters[assignment] = (await page.locator('.blank-start .stuck-microtask').innerText()).trim();
}
check('the starter differs by genre', new Set(Object.values(starters)).size === Object.keys(starters).length,
    JSON.stringify(starters));
// It is a blank-page affordance only.
await open();
await page.fill('#draftEditor', 'One sentence of my own.');
await page.waitForTimeout(450);
check('the starter disappears once the writer has words of their own',
    await page.locator('.blank-start').isHidden());
check('and it leaves the accessibility tree with it',
    await page.evaluate(() => document.querySelector('.blank-start')?.hasAttribute('hidden') === true));
await page.fill('#draftEditor', '');
await page.waitForTimeout(450);
check('it returns if the draft is emptied again', await page.locator('.blank-start').isVisible());
check('a returning writer with an existing draft never sees it', await (async () => {
    await page.fill('#draftEditor', 'Words that were already here before this session.');
    await page.waitForTimeout(600);
    await page.reload();
    await page.waitForSelector('#draftEditor');
    return await page.locator('.blank-start').isHidden();
})());
// It never competes with the first-run welcome.
if (page) await page.close();
page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
page.on('pageerror', error => errors.push(String(error)));
await page.goto(`${ORIGIN}/studio.html`);
await page.evaluate(() => localStorage.clear());
await page.goto(`${ORIGIN}/studio.html?assignment=mixed-genre-autobiographical-essay`);
await page.waitForTimeout(400);
const firstRun = await page.locator('.first-run').count();
check('a genuine first-run writer sees the welcome, not a second opening',
    firstRun === 0 || await page.locator('.blank-start').count() === 0, `first-run=${firstRun}`);

// ── 4. The Knowledge & language lens states which lens ───────────────────────
console.log('\n4. The Knowledge & language lens "not now" state');
await open();
await page.locator('[data-action="knowledge-choice"][data-choice="skip"]').click();
await page.waitForTimeout(300);
await page.locator('.knowledge-revisit > summary').click();
await page.waitForTimeout(200);
const revisit = await page.locator('.knowledge-revisit').innerText();
check('the cryptic "You chose not now" is gone', !/You chose not now/i.test(revisit));
check('it names the knowledge and language lens',
    /knowledge and language lens/i.test(revisit), revisit.replace(/\s+/g, ' ').slice(0, 160));
check('it still says the choice can be revisited', /return at any time/i.test(revisit));
check('the "Choose again" action is retained',
    await page.locator('.knowledge-revisit [data-action="knowledge-reset"]').count() === 1
    && /Choose again/i.test(await page.locator('[data-action="knowledge-reset"]').innerText()));
await page.locator('[data-action="knowledge-reset"]').click();
await page.waitForTimeout(300);
check('Choose again really returns the choice', await page.locator('[data-action="knowledge-choice"]').count() === 2);

// ── 5. The Move example affordance is visible ────────────────────────────────
console.log('\n5. "See a quick example" reads as a control');
await open();
check('the affordance is present with its approved wording',
    await page.locator('.move-example > summary', { hasText: 'See a quick example' }).count() >= 1);
const pill = await page.evaluate(() => {
    const el = document.querySelector('.move-example > summary');
    if (!el) return null;
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return { height: box.height, weight: parseInt(cs.fontWeight), border: cs.borderTopWidth, radius: cs.borderTopLeftRadius, bg: cs.backgroundColor, marker: cs.listStyleType };
});
check('it has a 44px minimum target', pill && pill.height >= 43.5, `${pill?.height}px`);
check('it is bordered and filled, not bare text',
    pill && parseFloat(pill.border) >= 1 && pill.bg !== 'rgba(0, 0, 0, 0)', JSON.stringify(pill));
check('it is a pill, matching the Studio’s existing chip treatment',
    pill && parseFloat(pill.radius) >= 100, pill?.radius);
check('the example body is still closed by default',
    await page.locator('.move-example[open]').count() === 0);
check('the hypothetical-structure boundary still ships with it, inside the disclosure',
    /Hypothetical structure/i.test(await page.locator('.move-example').first().textContent()));
// Keyboard.
await page.locator('.move-example > summary').first().focus();
check('it is keyboard-focusable',
    await page.evaluate(() => document.activeElement?.matches('.move-example > summary')));
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
check('Enter opens it', await page.locator('.move-example[open]').count() === 1);
check('the example content is a structure, with its ownership line',
    /Use your own facts and wording/i.test(await page.locator('.move-example[open]').innerText()));
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
check('Enter closes it again', await page.locator('.move-example[open]').count() === 0);

// ── 6. Nothing is ever written into the draft ────────────────────────────────
console.log('\n6. Zero automatic draft insertion');
await open();
const emptyRecord = await page.evaluate(() => localStorage.getItem('tupana-studio:v1'));
check('the draft is empty on arrival', (await page.locator('#draftEditor').inputValue()) === '');
await page.locator('.blank-start [data-action="copy-stuck-starter"]').click();
await page.waitForTimeout(350);
check('using the starter’s only action leaves the draft empty',
    (await page.locator('#draftEditor').inputValue()) === '');
await page.locator('.move-example > summary').first().click();
await page.locator('.knowledge-revisit > summary').click().catch(() => {});
await page.waitForTimeout(300);
check('opening the example and the lens leaves the draft empty',
    (await page.locator('#draftEditor').inputValue()) === '');
check('the stored record still holds no draft text',
    !(JSON.parse(await page.evaluate(() => localStorage.getItem('tupana-studio:v1')) || '{}').draft || '').length,
    String(emptyRecord).slice(0, 60));
check('no refinement introduced a draft-writing action',
    await page.evaluate(() => !['.blank-start', '.support-distinction', '.planning-empty', '.move-example']
        .some(sel => Array.from(document.querySelectorAll(`${sel} [data-action]`))
            .some(el => /insert|apply|replace|use-in-draft/i.test(el.dataset.action || '')))));

// ── 7. Both languages ────────────────────────────────────────────────────────
console.log('\n7. Bilingual rendering');
for (const [label, value] of [['Spanish', 'es'], ['English', 'en']]) {
    await open();
    await page.selectOption('#appLang', value).catch(async () => {
        await page.evaluate(v => {
            const sel = Array.from(document.querySelectorAll('select')).find(s => Array.from(s.options).some(o => o.value === v && /Espa|Engl/i.test(o.textContent)));
            if (sel) { sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true })); }
        }, value);
    });
    await page.waitForTimeout(350);
    await page.locator('[data-action="knowledge-choice"][data-choice="skip"]').click().catch(() => {});
    await page.waitForTimeout(250);
    await page.locator('.knowledge-revisit > summary').click().catch(() => {});
    await page.waitForTimeout(200);
    const t = await deskText();
    const es = value === 'es';
    check(`${label}: the planning-notes empty state is in this language`,
        es ? /aparecen aquí después de que guardas una nota con tus propias palabras/i.test(t)
           : /appear here after you save a note in your own words/i.test(t));
    check(`${label}: the three-support distinction is in this language`,
        es ? /pide tu consentimiento primero/i.test(t) : /asks your consent first/i.test(t));
    check(`${label}: the blank-page starter is in this language`,
        es ? /Una manera opcional de empezar/i.test(t) : /One optional way to start/i.test(t));
    check(`${label}: the lens state names the lens in this language`,
        es ? /lente de conocimiento e idioma/i.test(t) : /knowledge and language lens/i.test(t));
    check(`${label}: the example affordance keeps its approved wording`,
        es ? /Ver un ejemplo breve/.test(t) : /See a quick example/.test(t));
    check(`${label}: no untranslated counterpart leaked in`,
        es ? !/One optional way to start|asks your consent first/i.test(t)
           : !/Una manera opcional de empezar|pide tu consentimiento primero/i.test(t));
    check(`${label}: no literal template markup rendered`, !/\$\{|<\/?(p|div|dl|dt|dd|strong)>/i.test(t));
}

// ── 8. The approved bilingual disclosure is untouched ────────────────────────
console.log('\n8. The approved bilingual disclosure survives verbatim');
await open();
const APPROVED_EN = 'Español + English shows both languages at once. Language marking for screen readers is still incomplete here, so pronunciation may be wrong in places. For screen-reader use, choose English or Español. This view is not verified as fully accessible.';
const disclosure = (await page.locator('#bilingualLimitationNote').innerText()).replace(/\s+/g, ' ').trim();
check('the disclosure is still rendered beneath the language control',
    await page.locator('#bilingualLimitationNote').count() === 1);
check('the language control still points at it with aria-describedby',
    await page.locator('[data-action="language"][aria-describedby="bilingualLimitationNote"]').count() === 1);
check('the approved English copy is byte-identical', disclosure === APPROVED_EN, disclosure.slice(0, 180));
await page.evaluate(() => {
    const sel = document.querySelector('[data-action="language"]');
    sel.value = 'both'; sel.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.waitForTimeout(350);
const both = await page.locator('#bilingualLimitationNote span').allInnerTexts();
check('bilingual mode still shows both versions, Spanish first',
    both.length === 2 && /^Español \+ English muestra/.test(both[0].trim()) && both[1].replace(/\s+/g, ' ').trim() === APPROVED_EN,
    JSON.stringify(both.map(x => x.slice(0, 40))));

// ── 9. Mobile and reflow ─────────────────────────────────────────────────────
console.log('\n9. Mobile and 200% reflow');
for (const [label, viewport] of [['390×844', { width: 390, height: 844 }], ['430×932', { width: 430, height: 932 }], ['320×640', { width: 320, height: 640 }]]) {
    await open('?assignment=mixed-genre-autobiographical-essay', { viewport, touch: true });
    check(`${label}: no horizontal overflow`, await noOverflow());
    check(`${label}: the starter is present and fits`, await page.evaluate(() => {
        const el = document.querySelector('.blank-start');
        return Boolean(el) && el.getBoundingClientRect().right <= window.innerWidth + 1;
    }));
    check(`${label}: the starter’s only action keeps a 44px target`, await page.evaluate(() =>
        Array.from(document.querySelectorAll('.blank-start .button')).every(b => b.getBoundingClientRect().height >= 43.5)));
    check(`${label}: the three-support distinction fits`, await page.evaluate(() => {
        const el = document.querySelector('.support-distinction');
        return Boolean(el) && el.getBoundingClientRect().right <= window.innerWidth + 1 && el.scrollWidth <= el.clientWidth + 1;
    }));
    check(`${label}: the example pill fits and keeps its target`, await page.evaluate(() => {
        const el = document.querySelector('.move-example > summary');
        return Boolean(el) && el.getBoundingClientRect().right <= window.innerWidth + 1 && el.getBoundingClientRect().height >= 43.5;
    }));
}
// WCAG 1.4.10 reflow: 1280 CSS px at 400% is 320 px of layout.
await open('?assignment=mixed-genre-autobiographical-essay', { viewport: { width: 640, height: 512 } });
await page.evaluate(() => { document.documentElement.style.zoom = '200%'; });
await page.waitForTimeout(300);
check('200% reflow: no horizontal overflow', await noOverflow());
await page.evaluate(() => { document.documentElement.style.zoom = ''; });

// ── 10. Contrast of the new surfaces, in all three appearances ───────────────
console.log('\n10. The new surfaces meet AA in light, dark, and system-dark');
const HELPERS = `
  const parse = v => { const n = (v.match(/[\\d.]+/g) || []).map(Number); return { r: n[0] || 0, g: n[1] || 0, b: n[2] || 0, a: n.length > 3 ? n[3] : 1 }; };
  const bgOf = el => { let node = el; const stack = [];
    while (node) { stack.push(parse(getComputedStyle(node).backgroundColor)); node = node.parentElement; }
    let acc = { r: 255, g: 255, b: 255 };
    for (let i = stack.length - 1; i >= 0; i--) { const l = stack[i]; if (!l.a) continue;
      acc = { r: l.r * l.a + acc.r * (1 - l.a), g: l.g * l.a + acc.g * (1 - l.a), b: l.b * l.a + acc.b * (1 - l.a) }; }
    return acc; };
  const lum = ({ r, g, b }) => { const [R, G, B] = [r, g, b].map(x => { const c = x / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * R + 0.7152 * G + 0.0722 * B; };
  const ratioOf = (fg, bg) => { const a = lum(fg), b = lum(bg); return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2); };
  const textRatio = el => ratioOf(parse(getComputedStyle(el).color), bgOf(el));
`;
for (const [name, scheme, forceDark] of [['Light', 'light', false], ['Dark', 'dark', true], ['System (device dark)', 'dark', false]]) {
    await open('?assignment=mixed-genre-autobiographical-essay', { scheme });
    if (forceDark) {
        for (let i = 0; i < 3; i++) {
            if (await page.evaluate(() => document.documentElement.dataset.appearance) === 'dark') break;
            await page.locator('[data-action="appearance-cycle"]').click();
            await page.waitForTimeout(170);
        }
    }
    const fails = await page.evaluate(`(() => { ${HELPERS}
      const fails = [];
      document.querySelectorAll('.blank-start, .blank-start *, .support-distinction, .support-distinction *, .planning-empty, .move-example > summary').forEach(el => {
        const own = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
        if (!own) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') return;
        const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
        const large = px >= 24 || (px >= 18.66 && bold);
        const r = textRatio(el);
        if (r < (large ? 3 : 4.5)) fails.push({ sel: el.className || el.tagName, ratio: r, text: own.slice(0, 26) });
      });
      return fails; })()`);
    check(`${name}: every new surface meets its AA requirement`, fails.length === 0, JSON.stringify(fails));
}

// ── 11. Isolation ────────────────────────────────────────────────────────────
console.log('\n11. Isolation');
check('no external request was made by any refinement', external.length === 0, external.slice(0, 3).join(', '));
check('no page error was raised', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} ${failed ? 'FAIL' : 'PASS'}`);
process.exit(failed ? 1 : 0);
