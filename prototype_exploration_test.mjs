// Comparative Writing Studio prototypes — local functional, responsive, and safety checks.
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3001/explore.html';
const browser = await chromium.launch({ headless: true });
let passed = 0;
let failed = 0;
const check = (label, condition, detail = '') => {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
    if (ok) passed++; else failed++;
};

const landing = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await landing.goto(BASE);
check('comparison hub exposes exactly three concepts', await landing.locator('.concept-card').count() === 3);
check('comparison hub exposes the same eleven-task journey', await landing.locator('.task-grid li').count() === 11);
await landing.close();

for (const concept of ['desk', 'journey', 'hybrid']) {
    console.log(`\n${concept.toUpperCase()} concept`);
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    const externalRequests = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => {
        if (!request.url().startsWith('http://127.0.0.1:3001/')) externalRequests.push(request.url());
    });
    await page.goto(`${BASE}?concept=${concept}`);
    await page.evaluate(name => {
        localStorage.setItem('tupana_draft', 'R0 SENTINEL — MUST SURVIVE');
        localStorage.removeItem(`tupana-explore:writing-studio-ux-2026-08:${name}:v1`);
    }, concept);
    await page.reload();

    check('orientation answers where the student is', Boolean((await page.locator('.location-pill').textContent()).trim()));
    check('orientation answers what happens next', Boolean((await page.locator('.orientation-text span').textContent()).trim()));
    check('one sample action starts writing', await page.locator('[data-action="sample"]').isVisible());
    await page.locator('[data-action="sample"]').click();
    const sample = await page.locator('#draftEditor').inputValue();
    check('synthetic sample enters the editor', sample.length > 180);

    const continuityMarker = `\n\nSynthetic continuity marker for ${concept}.`;
    await page.locator('#draftEditor').fill(sample + continuityMarker);
    await page.waitForTimeout(260);
    await page.reload();
    check('save, leave, and return restores exact writing', (await page.locator('#draftEditor').inputValue()).endsWith(continuityMarker));
    check('R0 storage sentinel remains untouched', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 SENTINEL — MUST SURVIVE');

    const selected = 'the real problem was trust';
    await page.locator('#draftEditor').evaluate((editor, passage) => {
        const start = editor.value.indexOf(passage);
        editor.focus();
        editor.setSelectionRange(start, start + passage.length);
        editor.dispatchEvent(new Event('select', { bubbles: true }));
    }, selected);
    await page.waitForTimeout(50);
    check('selection immediately opens app-owned passage action', await page.locator('#passageBar').isVisible());
    await page.locator('#draftEditor').evaluate(editor => editor.setSelectionRange(editor.value.length, editor.value.length));
    check('captured passage survives native selection collapse', (await page.locator('#passageExcerpt').textContent()) === selected);
    await page.locator('[data-action="passage-review"]').click();
    check('passage consent offers selected, paragraph, and full draft', await page.locator('input[name="reviewScope"]').count() === 3);
    check('exact selected text appears before transmission', (await page.locator('#scopePreview').textContent()) === selected);
    check('mock send is disabled before consent', await page.locator('[data-action="submit-mock"]').isDisabled());
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.waitForTimeout(350);
    check('mock coach result is re-enterable in Review Center', await page.locator('.review-card').count() >= 1);
    await page.locator('[data-action="decision"][data-choice="adapt"]').first().click();
    check('adapt decision persists in one decision ledger', await page.locator('[data-action="review-tab"][data-tab="decisions"]').textContent().then(text => /\(1\)/.test(text)));
    await page.locator('[data-action="close-dialog"]').first().click();

    await page.locator('[data-action="focused-review"]').click();
    check('focused review uses genre-aware lenses', await page.locator('input[name="reviewLens"]').count() === 3);
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.waitForTimeout(350);
    check('focused review returns to persistent history', await page.locator('.review-card').count() >= 2);
    await page.locator('[data-action="close-dialog"]').first().click();

    await page.locator('[data-action="council"]').first().click();
    check('Council identifies three genre-configured reviewers', await page.locator('.choice-stack .radio-card').count() === 3);
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="run-council"]').click();
    await page.waitForTimeout(80);
    check('Council report is persisted and revisitable', await page.locator('.review-card').count() >= 1 && /\(1\)/.test(await page.locator('[data-tab="council"]').textContent()));
    await page.locator('[data-action="close-dialog"]').first().click();

    await page.locator('[data-action="reflection"]').first().click();
    check('reflection has exactly three required student prompts', await page.locator('#reflectionForm textarea[required]').count() === 3);
    check('optional cultural/community prompt is separate', await page.locator('#reflection-knowledge:not([required])').count() === 1);
    await page.locator('#reflection-changed').fill('I clarified the evidence and explained why the shift matters.');
    await page.locator('#reflection-decision').fill('I adapted one question because it helped me add evidence without replacing my words.');
    await page.locator('#reflection-voice').fill('I kept the sentence that names trust because its plain rhythm sounds like me.');
    await page.locator('[data-action="finish"]').click();
    check('Finish separates student reflection from instructor appendix', await page.getByRole('heading', { name: /Student reflection/ }).count() === 1 && await page.getByRole('heading', { name: /Instructor evidence appendix/ }).count() === 1);
    check('packet draft preview is exact', (await page.locator('#finalDraftPreview').textContent()).endsWith(continuityMarker));
    await page.locator('#packetConfirm').check();
    await page.locator('[data-action="create-packet"]').click();
    check('deliberate Finish creates a local packet only after confirmation', await page.locator('[data-action="download-packet"]').isVisible());

    await page.locator('[data-action="language"]').selectOption('es');
    check('Spanish preference applies without reload', /Guardado|Autoguardado/.test(await page.locator('body').textContent()));
    await page.locator('[data-action="genre"]').selectOption('stem');
    await page.locator('[data-action="return-write"]').click();
    const stemChrome = await page.locator('.support-stack').textContent();
    check('STEM guidance has no autobiographical fallback', !/anecdote|admissions reader|your story|tu historia/i.test(stemChrome) && /evidencia|laboratorio|métodos/i.test(stemChrome));

    await page.locator('[data-action="settings"]').click();
    check('Settings contains one explicit Danger Zone deletion path', await page.getByRole('heading', { name: /Zona de peligro/ }).count() === 1);
    check('mobile Focus decision is documented in the interface', (await page.locator('.packet-section').textContent()).length > 40);
    await page.locator('#deleteConfirm').fill('DELETE');
    await page.locator('[data-action="delete-state"]').click();
    check('deletion removes only this concept record', await page.evaluate(name => localStorage.getItem(`tupana-explore:writing-studio-ux-2026-08:${name}:v1`) === null && localStorage.getItem('tupana_draft') === 'R0 SENTINEL — MUST SURVIVE', concept));
    check('no network request leaves the local origin', externalRequests.length === 0, externalRequests.join(', '));
    check('no page JavaScript errors', errors.length === 0, errors.join(' | '));
    await page.close();
}

console.log('\nMobile, keyboard, and accessibility geometry');
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobile.goto(`${BASE}?concept=desk`);
await mobile.locator('[data-action="sample"]').click();
const mobilePassage = 'the real problem was trust';
await mobile.locator('#draftEditor').evaluate((editor, passage) => {
    const start = editor.value.indexOf(passage);
    editor.focus(); editor.setSelectionRange(start, start + passage.length);
    editor.dispatchEvent(new Event('select', { bubbles: true }));
}, mobilePassage);
await mobile.waitForTimeout(50);
const passageGeometry = await mobile.locator('#passageBar').evaluate(el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, width: r.width, viewport: { w: innerWidth, h: innerHeight } };
});
check('mobile passage action stays inside current visual viewport', passageGeometry.top >= 0 && passageGeometry.bottom <= passageGeometry.viewport.h && passageGeometry.width <= passageGeometry.viewport.w);
check('mobile layout has no horizontal overflow', await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
const smallTargets = await mobile.locator('button:visible, a.switch-link:visible').evaluateAll(elements => elements.map(el => ({ name: el.getAttribute('aria-label') || el.textContent.trim(), rect: el.getBoundingClientRect() })).filter(item => item.rect.width < 44 || item.rect.height < 44));
check('visible mobile controls meet 44px target minimum', smallTargets.length === 0, JSON.stringify(smallTargets.slice(0, 5)));
const unnamed = await mobile.locator('button:visible').evaluateAll(elements => elements.filter(el => !(el.getAttribute('aria-label') || el.textContent.trim())).length);
check('visible buttons have accessible names', unnamed === 0);
await mobile.locator('[data-action="passage-review"]').focus();
await mobile.keyboard.press('Enter');
check('passage action is keyboard operable', await mobile.locator('[role="dialog"]').isVisible());
await mobile.keyboard.press('Escape');
check('Escape closes dialog and restores working context', !(await mobile.locator('[role="dialog"]').isVisible()));
check('Desk deliberately retains Focus on mobile', await mobile.locator('[data-action="focus"]').isVisible());
await mobile.goto(`${BASE}?concept=journey`);
check('Journey deliberately omits Focus control on mobile', !(await mobile.locator('[data-action="focus"]').isVisible()));
await mobile.goto(`${BASE}?concept=hybrid`);
check('Hybrid deliberately omits separate Focus control', await mobile.locator('[data-action="focus"]').count() === 0);
await mobile.close();

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
process.exit(failed ? 1 : 0);
