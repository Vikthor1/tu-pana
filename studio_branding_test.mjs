// Writing Studio — branding and header polish verification.
// Authentic brand asset, single identity, save truth in the work context, compact/full
// genre labels, dev-language audit, bilingual + appearance + responsive checks.
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

const errors = [];
let page = null;
async function fresh(options = {}) {
    if (page) await page.close();
    page = await browser.newPage({ viewport: options.viewport || { width: 1440, height: 960 }, reducedMotion: options.reducedMotion || 'no-preference' });
    page.setDefaultTimeout(9000);
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html`);
    // Desk suites: onboarding is answered so the Studio opens on the Desk.
    // The first-run welcome that precedes it for a genuinely new writer has
    // its own suite (studio_onboarding_test.mjs) and is covered there.
    await page.evaluate(key => { localStorage.removeItem(key); localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' })); }, KEY);
    await page.goto(`${ORIGIN}/studio.html${options.query || ''}`);
}

console.log('\n1–2. Authentic brand asset and reduced motion');
await fresh();
check('the original laptop-and-coffee asset renders (coffee cup, steam, laptop parts present)', await page.locator('.brand-icon .tp-av-coffee').count() === 1 && await page.locator('.brand-icon .tp-av-steam').count() === 3 && await page.locator('.brand-icon .tp-av-laptop').count() === 1);
check('icon is decorative to assistive technology', await page.locator('.brand-icon').getAttribute('aria-hidden') === 'true');
check('animation present by default (steam animates)', await page.locator('.brand-icon .tp-av-steam').first().evaluate(el => getComputedStyle(el).animationName !== 'none'));
await fresh({ reducedMotion: 'reduce' });
check('prefers-reduced-motion stops every brand animation', await page.evaluate(() => ['.tp-av-steam', '.tp-av-glow', '.tp-av-cursor', '.tp-av-line', '.tp-av-spark'].every(sel => getComputedStyle(document.querySelector(`.brand-icon ${sel}`)).animationName === 'none')));

console.log('\n3–4. One product identity');
await fresh();
check('exactly one rendered product title', await page.evaluate(() => (document.body.textContent.match(/Tu Pana Writing Studio/g) || []).length) === 1 && await page.locator('.product-title').count() === 1);
check('no redundant Writing Studio subtitle remains', await page.locator('.brand-copy small').count() === 0);
check('genre selector sits inside the identity block', await page.locator('.brand-copy .genre-select-wrap').count() === 1);

console.log('\n5–6. Truthful save status stays in the work context, not the brand banner');
check('brand banner contains no redundant save status or placeholder', await page.locator('.prototype-header .save-state, .prototype-header [data-save-state], .prototype-header [data-save-state-mark]').count() === 0);
check('fresh editor context carries the save status as an accessible live region', await page.locator('.editor-meta [data-save-state]').textContent() === 'Autosaved locally' && await page.locator('.editor-meta [data-save-state]').getAttribute('role') === 'status' && await page.locator('.editor-meta [data-save-state]').getAttribute('aria-live') === 'polite');
const savingText = await page.evaluate(() => {
    const editor = document.querySelector('#draftEditor');
    editor.value = 'typing…';
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    return document.querySelector('.editor-meta [data-save-state]').textContent;
});
check('typing shows Saving… in the editor before settling', savingText === 'Saving…');
await page.waitForTimeout(400);
check('editor settles back to Saved on this device', await page.locator('.editor-meta [data-save-state]').textContent() === 'Saved on this device');
await page.evaluate(() => { const original = Storage.prototype.setItem; window.__restore = () => { Storage.prototype.setItem = original; }; Storage.prototype.setItem = function () { throw new Error('quota'); }; });
await page.locator('#draftEditor').fill('fail this save');
await page.waitForTimeout(400);
check('failure remains visible in the editor and assertively announced', (await page.locator('.editor-meta [data-save-state]').textContent()).includes('Couldn’t save') && (await page.locator('#assertiveRegion').textContent()).includes('Couldn’t save'));
await page.evaluate(() => window.__restore());

console.log('\n7–8. Genre labels: compact face, full official names in menus');
const expected = {
    'mixed-genre-autobiographical-essay': ['Autobiographical Essay', 'Mixed-Genre Autobiographical Essay'],
    'college-personal-statement': ['College Essay', 'College Personal Statement'],
    'graduate-sop': ['Statement of Purpose', 'Graduate Statement of Purpose'],
    'cap200-bronx-beautiful-service-learning': ['Service-Learning Report', 'CAP 200 Service-Learning Report'],
    'research-paper': ['Research Paper', 'Research Paper'],
    'stem-lab-report': ['STEM Lab Report', 'STEM Laboratory Report'],
    'general-writing': ['General Writing', 'General Writing Project'],
};
for (const [assignment, [compact, full]] of Object.entries(expected)) {
    await fresh({ query: `?assignment=${assignment}` });
    const face = await page.locator('.genre-select-face').textContent();
    const ariaLabel = await page.locator('.genre-select').getAttribute('aria-label');
    const noClip = await page.locator('.genre-select-face').evaluate(el => el.scrollWidth <= el.clientWidth + 1 && !getComputedStyle(el).textOverflow.includes('ellipsis'));
    check(`${compact}: compact face, full name to AT, no destructive truncation`, face.includes(compact) && ariaLabel.includes(full) && noClip);
}
const optionTexts = await page.locator('.genre-select option').allTextContents();
check('open selector lists every full official assignment name', Object.values(expected).every(([, full]) => optionTexts.some(text => text === full)));
await page.locator('[data-action="settings"]').first().click();
const settingsOptions = await page.locator('#settingsGenre option').allTextContents();
check('Settings selector also shows full official names', Object.values(expected).every(([, full]) => settingsOptions.some(text => text === full)));
await page.keyboard.press('Escape');

console.log('\n9. Identity, routing, and provenance unchanged');
await fresh({ query: '?assignment=mixed-genre-autobiographical-essay' });
check('profile ids unchanged in the selector', (await page.locator('.genre-select option').evaluateAll(opts => opts.map(o => o.value))).join(',').includes('autobiographical,admissions,stem,sop,neutral,cap200,research'));
await page.locator('#draftEditor').fill('Provenance check draft with enough words for a council reading here.');
await page.waitForTimeout(240);
await page.locator('[data-action="council"]').first().click();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="run-council"]').click();
await page.waitForFunction(key => (JSON.parse(localStorage.getItem(key) || '{}').councilRuns || []).length === 1, KEY);
const run = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).councilRuns[0], KEY);
check('stored provenance still uses the untouched record label', run.genreLabel === 'Mixed-genre autobiographical essay' && run.genre === 'autobiographical');
check('unknown assignments still stop loudly', await (async () => { await fresh({ query: '?assignment=mystery-id' }); return (await page.locator('body').textContent()).includes('mystery-id'); })());

console.log('\n10. Development-language audit across rendered surfaces');
const PROHIBITED = /\b(prototype|prototipo|finalist|finalista|exploration|exploración|concept|concepto|candidate|candidato|experimental)\b/i;
async function surfaceText(actions) {
    await fresh();
    await page.locator('#draftEditor').fill('Synthetic audit draft with enough words to open review surfaces calmly.');
    await page.waitForTimeout(240);
    for (const action of actions) await page.locator(action).first().click();
    return page.evaluate(() => document.body.textContent);
}
const surfaces = [
    ['fresh desk', []],
    ['Settings', ['[data-action="settings"]']],
    ['Help + report', ['[data-action="help"]', '[data-action="help-report"]']],
    ['Review Center', ['[data-action="review-center"]']],
    ['My Work', ['[data-action="my-work"]']],
    ['version history', ['[data-action="version-history"]']],
    ['paste dialog', ['[data-action="paste"]']],
    ['reflection', ['.phase-strip [data-action="reflection"]']],
    ['finish', ['.phase-strip [data-action="finish"]']],
];
for (const [name, actions] of surfaces) {
    let text = '';
    try { text = await surfaceText(actions); } catch { text = await page.evaluate(() => document.body.textContent); }
    const match = text.match(PROHIBITED);
    check(`no development language on ${name}`, !match, match ? match[0] : '');
}

console.log('\n11. Bilingual header coherence');
await fresh({ query: '?assignment=graduate-sop' });
await page.locator('.prototype-actions [data-action="language"]').selectOption('es');
check('Spanish header stays identity-only while editor carries Spanish save truth', (await page.locator('.genre-select-face').textContent()).includes('Carta de propósito') && await page.locator('.prototype-header [data-save-state]').count() === 0 && (await page.locator('.editor-meta [data-save-state]').textContent()).toLowerCase().includes('guardado'));
await page.locator('.prototype-actions [data-action="language"]').selectOption('both');
check('both mode keeps one title and a coherent face', await page.locator('.product-title').count() === 1 && (await page.locator('.genre-select-face').textContent()).length > 0);

console.log('\n12–13. Appearance, responsive, keyboard, reflow');
for (const appearance of ['light', 'dark', 'system']) {
    await fresh();
    await page.locator('[data-action="settings"]').first().click();
    await page.locator(`[data-action="appearance-choice"][data-appearance="${appearance}"]`).click();
    await page.keyboard.press('Escape');
    check(`${appearance} appearance renders the icon and title without error`, await page.locator('.brand-icon svg').isVisible() && await page.locator('.product-title').isVisible());
}
await fresh({ viewport: { width: 390, height: 844 }, query: '?assignment=cap200-bronx-beautiful-service-learning' });
check('mobile: icon + title readable, no horizontal overflow', await page.locator('.brand-icon svg').isVisible() && await page.locator('.product-title').isVisible() && await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
check('mobile: full genre meaning via chip (compact text, full aria)', (await page.locator('.mobile-project-chip').textContent()).includes('Service-Learning Report') && (await page.locator('.mobile-project-chip').getAttribute('aria-label')).includes('CAP 200 Service-Learning Report'));
const smallTargets = await page.locator('button:visible, select:visible').evaluateAll(els => els.map(el => el.getBoundingClientRect()).filter(box => (box.width && box.width < 44) || (box.height && box.height < 44)));
check('mobile: all targets at least 44px', smallTargets.length === 0, JSON.stringify(smallTargets.slice(0, 2)));
const headerHeight = await page.locator('.prototype-header').evaluate(el => el.getBoundingClientRect().height);
check('mobile header stays compact (does not crowd the draft)', headerHeight <= 120, `${headerHeight}px`);
await fresh();
await page.keyboard.press('Tab');
let reachedGenre = false;
for (let i = 0; i < 8; i++) {
    if (await page.evaluate(() => document.activeElement?.classList.contains('genre-select'))) { reachedGenre = true; break; }
    await page.keyboard.press('Tab');
}
check('genre selector keyboard-reachable with visible focus', reachedGenre && await page.locator('.genre-select-wrap').evaluate(el => getComputedStyle(el, ':focus-within') !== null));
await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
check('200% text: header reflows without horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));

console.log('\nStability');
check('zero page errors across branding checks', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
