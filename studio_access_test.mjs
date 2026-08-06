// Writing Studio migration candidate — bilingual behavior, mobile recovery,
// keyboard interaction, and exact multilingual preservation.
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
async function fresh(viewport, query = '') {
    if (page) await page.close();
    page = await browser.newPage({ viewport });
    page.setDefaultTimeout(8000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html`);
    // Desk suites: onboarding is answered so the Studio opens on the Desk. The
    // first-run welcome that precedes it for a genuinely new writer has its own
    // suite (studio_onboarding_test.mjs) and is covered there.
    await page.evaluate(key => { localStorage.removeItem(key); localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' })); localStorage.setItem('tupana_draft', 'R0 ACCESS SENTINEL'); }, KEY);
    await page.goto(`${ORIGIN}/studio.html${query}`);
}

console.log('\nEspañol + English mode reaches the newer surfaces');
await fresh({ width: 1440, height: 960 });
await page.locator('.prototype-actions [data-action="language"]').selectOption('both');
await page.locator('#draftEditor').fill('Synthetic draft with enough words for the review-copy surface to appear.');
await page.waitForTimeout(240);
await page.locator('[data-action="review-center"]').first().click();
const cycleText = await page.locator('.revision-cycle-entry, .dialog').first().textContent();
check('revision-cycle surface renders both languages in both mode', /segunda mirada|copia de revisión/i.test(cycleText) && /second look|review copy/i.test(cycleText));
await page.keyboard.press('Escape');
await page.locator('[data-action="stuck"]').click();
const stuckText = await page.locator('.dialog').textContent();
check('stuck support renders both languages in both mode', /paso|apoyo|descanso/i.test(stuckText) && /step|support|break/i.test(stuckText));
await page.keyboard.press('Escape');

console.log('\nSpanish-only mode keeps newer surfaces Spanish');
await page.locator('.prototype-actions [data-action="language"]').selectOption('es');
await page.locator('[data-action="stuck"]').click();
const stuckEs = await page.locator('.dialog').textContent();
check('stuck choices render in Spanish under es mode', /No sé qué escribir/.test(stuckEs) && !/I don’t know what to write/.test(stuckEs));
await page.keyboard.press('Escape');

console.log('\nExact multilingual preservation across language switching');
const multilingual = 'Mi abuela decía: “aquí escuchamos primero” — y eso cambió cómo escribo. 语言也是权力。';
await page.locator('#draftEditor').fill(multilingual);
await page.waitForTimeout(240);
await page.locator('.prototype-actions [data-action="language"]').selectOption('en');
await page.locator('.prototype-actions [data-action="language"]').selectOption('both');
check('draft bytes survive language switching exactly', await page.locator('#draftEditor').inputValue() === multilingual);
await page.reload();
check('draft bytes survive reload in both mode', await page.locator('#draftEditor').inputValue() === multilingual);

console.log('\nMobile unknown-assignment recovery (390×844)');
await fresh({ width: 390, height: 844 }, '?assignment=unknown-course-link');
check('mobile unknown assignment stops loudly', /not configured|no está configurado/i.test(await page.locator('body').textContent()));
await page.locator('[data-action="settings"]').first().click();
await page.locator('#settingsGenre').selectOption('neutral');
check('mobile recovery reaches General Writing deliberately', await page.locator('#draftEditor').count() === 1);
const smallTargets = await page.locator('button:visible, select:visible').evaluateAll(els => els.map(el => el.getBoundingClientRect()).filter(box => (box.width && box.width < 44) || (box.height && box.height < 44)));
check('mobile recovery path keeps 44px targets', smallTargets.length === 0, JSON.stringify(smallTargets.slice(0, 3)));
check('mobile recovery has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));

console.log('\nDialog keyboard behavior');
await fresh({ width: 1440, height: 960 });
await page.locator('[data-action="settings"]').first().click();
check('settings dialog is modal with an accessible name', await page.locator('[role="dialog"][aria-modal="true"]').count() === 1);
await page.keyboard.press('Escape');
check('Escape closes the clean dialog and returns to the desk', await page.locator('[role="dialog"]').count() === 0);

console.log('\nIsolation');
check('R0 sentinel untouched', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 ACCESS SENTINEL');
check('no external requests', external.length === 0, external.join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
