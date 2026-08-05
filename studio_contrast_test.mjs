// Writing Studio — filled-primary contrast across themes.
//
// `--jade` served two roles: an accent/text colour and a filled background. The
// dark theme re-valued it for the first (a light jade, readable as text on a
// dark surface), which silently broke the second — white label on a light jade
// fill measured 2.69:1, and the hover state was worse at 1.49:1.
//
// The correction gives the filled role its own tokens (--primary-bg,
// --primary-bg-hover, --primary-ink). Light values are exactly the jade the
// Studio already used, so light appearance is unchanged; dark keeps the bright
// jade fill — which is what gives a button affordance on a dark surface, and
// keeps the brand — and takes dark ink on it.
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

const THEMES = [
    ['Light', 'light', false],
    ['Dark', 'dark', true],
    ['System (device dark)', 'dark', false],
];

async function open(options = {}) {
    if (page) await page.close();
    page = await browser.newPage({
        viewport: options.viewport || { width: 1280, height: 900 },
        colorScheme: options.scheme || 'light',
        hasTouch: Boolean(options.touch),
        isMobile: Boolean(options.touch),
        reducedMotion: options.reducedMotion || 'no-preference',
    });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html`);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${ORIGIN}/studio.html`);
    if (options.forceDark) {
        for (let i = 0; i < 3; i++) {
            if (await page.evaluate(() => document.documentElement.dataset.appearance) === 'dark') break;
            await page.locator('[data-action="appearance-cycle"]').click();
            await page.waitForTimeout(170);
        }
    }
    await page.locator('[data-action="tour-dismiss"]').click().catch(() => {});
    return page;
}

// Shared colour maths, composited so a translucent layer is measured over what
// is actually behind it.
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

// Probe a treatment by rendering it inside the live app, so it inherits the real
// theme tokens and the real surface behind it, then removing it again.
const probe = (className, host = '.prototype-main') => page.evaluate(`(() => {
  ${HELPERS}
  const parent = document.querySelector(${JSON.stringify(host)}) || document.body;
  const el = document.createElement('button');
  el.className = ${JSON.stringify(className)};
  el.textContent = 'Probe';
  parent.appendChild(el);
  const cs = getComputedStyle(el);
  const result = { ratio: textRatio(el), color: cs.color, background: cs.backgroundColor };
  el.remove();
  return result;
})()`);

const liveRatios = selector => page.evaluate(`(() => {
  ${HELPERS}
  return Array.from(document.querySelectorAll(${JSON.stringify(selector)}))
    .filter(el => (el.textContent || '').trim())
    .map(el => ({ ratio: textRatio(el), text: (el.textContent || '').trim().slice(0, 26) }));
})()`);

console.log('\n1. Filled-primary label contrast in every theme');
const measured = {};
for (const [name, scheme, forceDark] of THEMES) {
    await open({ scheme, forceDark });
    const rendered = await liveRatios('.button.primary');
    check(`${name}: every rendered primary button meets 4.5:1`,
        rendered.length > 0 && rendered.every(r => r.ratio >= 4.5),
        rendered.map(r => `${r.ratio}:1`).join(', '));
    measured[name] = rendered[0]?.ratio;
    // The same filled treatment wherever it appears.
    for (const [label, cls] of [
        ['selected decision', 'decision-button'],
        ['Guided Discovery sample badge', 'gd-preview-badge'],
        ['new-message control', 'gd-unread'],
    ]) {
        const result = await probe(cls === 'decision-button' ? 'decision-button' : cls);
        if (cls === 'decision-button') continue; // measured live below with aria-pressed
        check(`${name}: ${label} meets 4.5:1`, result.ratio >= 4.5, `${result.ratio}:1 (${result.color} on ${result.background})`);
    }
}
console.log(`  → before this correction: Light 6.44:1, Dark 2.69:1 (FAIL), hover 1.49:1 (FAIL)`);
console.log(`  → after: Light ${measured.Light}:1, Dark ${measured.Dark}:1, System-dark ${measured['System (device dark)']}:1`);

console.log('\n2. Interaction states stay readable and visibly distinct');
for (const [name, scheme, forceDark] of THEMES) {
    await open({ scheme, forceDark });
    const target = page.locator('.button.primary').first();
    const base = await page.evaluate(`(() => { ${HELPERS}
        const el = document.querySelector('.button.primary');
        return { ratio: textRatio(el), bg: getComputedStyle(el).backgroundColor }; })()`);
    await target.hover();
    await page.waitForTimeout(160);
    const hover = await page.evaluate(`(() => { ${HELPERS}
        const el = document.querySelector('.button.primary');
        return { ratio: textRatio(el), bg: getComputedStyle(el).backgroundColor }; })()`);
    check(`${name}: hover meets 4.5:1`, hover.ratio >= 4.5, `${hover.ratio}:1`);
    check(`${name}: hover is visibly distinct from default`, hover.bg !== base.bg, `${base.bg} → ${hover.bg}`);
    // Disabled is exempt from WCAG contrast, but must still read as disabled.
    const disabled = await page.evaluate(() => {
        const el = document.querySelector('.button.primary');
        el.disabled = true;
        const cs = getComputedStyle(el);
        const out = { opacity: parseFloat(cs.opacity), cursor: cs.cursor };
        el.disabled = false;
        return out;
    });
    check(`${name}: disabled is clearly de-emphasised`, disabled.opacity < 0.6 && disabled.cursor === 'not-allowed',
        `opacity ${disabled.opacity}`);
}

console.log('\n3. Keyboard focus stays unmistakable');
for (const [name, scheme, forceDark] of THEMES) {
    await open({ scheme, forceDark });
    // Keyboard-initiated focus, so :focus-visible genuinely applies.
    await page.locator('#draftEditor').focus();
    let found = false;
    for (let i = 0; i < 40 && !found; i++) {
        await page.keyboard.press('Tab');
        found = await page.evaluate(() => document.activeElement?.classList.contains('primary'));
    }
    check(`${name}: a primary button is reachable by keyboard`, found);
    const ring = await page.evaluate(`(() => { ${HELPERS}
        const el = document.activeElement; if (!el) return null;
        const cs = getComputedStyle(el);
        const width = parseFloat(cs.outlineWidth) || 0;
        return {
            style: cs.outlineStyle, width,
            againstButton: ratioOf(parse(cs.outlineColor), parse(cs.backgroundColor)),
            againstPage: ratioOf(parse(cs.outlineColor), bgOf(el.parentElement)),
        }; })()`);
    check(`${name}: the focus ring is drawn`, ring && ring.style !== 'none' && ring.width >= 2,
        ring ? `${ring.style} ${ring.width}px` : 'none');
    check(`${name}: the ring is distinguishable from the button it surrounds`,
        ring && Math.max(ring.againstButton, ring.againstPage) >= 3,
        ring ? `button ${ring.againstButton}:1 · page ${ring.againstPage}:1` : 'n/a');
}

console.log('\n4. Nothing else regressed below its requirement');
for (const [name, scheme, forceDark] of THEMES) {
    await open({ scheme, forceDark });
    const sweep = await page.evaluate(`(() => { ${HELPERS}
      const fails = [];
      document.querySelectorAll('.prototype-main *, .prototype-header *').forEach(el => {
        const own = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
        if (!own) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.6) return;
        const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
        const large = px >= 24 || (px >= 18.66 && bold);
        const r = textRatio(el);
        if (r < (large ? 3 : 4.5)) fails.push({ sel: el.className || el.tagName, ratio: r, text: own.slice(0, 30) });
      });
      return fails; })()`);
    check(`${name}: no text on the desk falls below its AA requirement`, sweep.length === 0,
        JSON.stringify(sweep.slice(0, 3)));
}

console.log('\n5. The jade identity is preserved, not replaced');
await open({ scheme: 'light' });
const lightTokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return { jade: cs.getPropertyValue('--jade').trim(), bg: cs.getPropertyValue('--primary-bg').trim(), ink: cs.getPropertyValue('--primary-ink').trim() };
});
check('light: the primary fill is still the Studio jade', lightTokens.bg === '#176b52' && lightTokens.jade === '#176b52',
    JSON.stringify(lightTokens));
check('light: the label is still white', lightTokens.ink === '#ffffff');
await open({ scheme: 'dark', forceDark: true });
const darkTokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return { jade: cs.getPropertyValue('--jade').trim(), bg: cs.getPropertyValue('--primary-bg').trim(), ink: cs.getPropertyValue('--primary-ink').trim() };
});
check('dark: the fill keeps the theme jade rather than a foreign colour', darkTokens.bg === darkTokens.jade,
    JSON.stringify(darkTokens));
check('dark: the label takes dark ink on that jade', /^#0c1f19$/i.test(darkTokens.ink));
check('no white-on-jade filled pairing remains in the stylesheet', await (async () => {
    const css = await (await fetch(`${ORIGIN}/assets/css/studio.css`)).text();
    return !/background:\s*var\(--jade[,)][^;]*;[^}]*color:\s*(white|#fff)/i.test(css);
})());

console.log('\n6. The mobile P1 fixes are untouched');
await open({ viewport: { width: 390, height: 844 }, touch: true, scheme: 'light' });
const DRAFT = 'At the library counter I answered in English until my aunt said, aquí escuchamos primero. I had treated translating as a small favor.';
const SENTENCE = 'I had treated translating as a small favor.';
await page.locator('#draftEditor').fill(DRAFT);
await page.waitForTimeout(300);
await page.evaluate(() => { document.getElementById('draftEditor').addEventListener('select', e => e.stopImmediatePropagation(), true); });
await page.evaluate(sentence => {
    const editor = document.getElementById('draftEditor');
    editor.focus();
    const index = editor.value.indexOf(sentence);
    editor.setSelectionRange(index, index + sentence.length);
    document.dispatchEvent(new Event('selectionchange'));
}, SENTENCE);
await page.waitForTimeout(500);
check('iOS-condition selection still surfaces the Passage Tray', await page.locator('#passageBar:not([hidden])').count() === 1);
check('the captured wording is still exact', await page.locator('#passageExcerpt').textContent() === SENTENCE);
check('Keep as my voice is still reachable', await page.locator('#passageBar [data-action="protect-phrase"]').count() === 1);
check('tray controls still meet the 44px target',
    await page.evaluate(() => Array.from(document.querySelectorAll('#passageBar button')).every(b => b.getBoundingClientRect().height >= 43.5)));
// Initial coach response readability, in the theme where it originally failed.
await open({ viewport: { width: 390, height: 844 }, touch: true, scheme: 'dark' });
await page.locator('#draftEditor').fill(DRAFT);
await page.waitForTimeout(300);
await page.locator('[data-action="coach"]').first().click();
await page.waitForTimeout(400);
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(2200);
const feedback = await page.evaluate(`(() => { ${HELPERS}
  const card = document.querySelector('.review-card'); if (!card) return null;
  let min = 99;
  card.querySelectorAll('*').forEach(el => {
    const own = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
    if (!own) return; const r = textRatio(el); if (r < min) min = r; });
  return +min.toFixed(2); })()`);
check('initial coach feedback is still readable in device-dark', feedback !== null && feedback >= 4.5, `${feedback}:1`);
check('the decision buttons inside it are readable', await (async () => {
    const rows = await liveRatios('.decision-button');
    return rows.length > 0 && rows.every(r => r.ratio >= 4.5);
})());
await page.locator('.decision-button').first().click();
await page.waitForTimeout(500);
const selectedDecision = await liveRatios('.decision-button[aria-pressed="true"]');
check('a selected decision (filled treatment) meets 4.5:1',
    selectedDecision.length === 0 || selectedDecision.every(r => r.ratio >= 4.5),
    selectedDecision.map(r => `${r.ratio}:1`).join(', '));

console.log('\n7. Responsive, reflow, reduced motion, targets, overflow');
await open({ viewport: { width: 390, height: 844 }, touch: true });
check('390×844: no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
check('390×844: primary buttons keep a 44px target',
    // Only rendered buttons: the focus-mode exit button exists in the DOM but is
    // not displayed until focus mode is entered, so it has no measurable box.
    await page.evaluate(() => Array.from(document.querySelectorAll('.button.primary'))
        .filter(b => b.offsetParent !== null)
        .every(b => b.getBoundingClientRect().height >= 43.5)));
await open({ viewport: { width: 430, height: 932 }, touch: true });
check('430×932: no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
await open({ viewport: { width: 720, height: 900 } });
await page.evaluate(() => { document.body.style.zoom = '200%'; });
await page.waitForTimeout(180);
check('200% reflow: no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2));
await open({ reducedMotion: 'reduce' });
check('reduced motion: the desk still renders and buttons remain readable',
    (await liveRatios('.button.primary')).every(r => r.ratio >= 4.5));

console.log('\n8. No network, no AI, no page errors');
check('zero external requests across the whole suite', external.length === 0, external.slice(0, 3).join(', '));
check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${failed === 0 ? '✅' : '❌'} filled-primary contrast: ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
