// Writing Studio — bounded First-Contact Clarity and Header Cleanup checks.
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const BASE = `${ORIGIN}/studio.html`;
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
let page;
async function fresh(query = '', viewport = { width: 1440, height: 960 }) {
    if (page) await page.close();
    page = await browser.newPage({ viewport });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(ORIGIN)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(BASE);
    // Desk suites: onboarding is answered so the Studio opens on the Desk.
    // The first-run welcome that precedes it for a genuinely new writer has
    // its own suite (studio_onboarding_test.mjs) and is covered there.
    await page.evaluate(key => { localStorage.removeItem(key); localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' })); }, KEY);
    await page.goto(`${BASE}${query}`);
}

console.log('\nHeader save truth');
await fresh('?assignment=general-writing');
check('brand banner has no save-success line, mark, replacement badge, or placeholder', await page.locator('.prototype-header .save-state, .prototype-header [data-save-state], .prototype-header [data-save-state-mark]').count() === 0);
check('editor owns one accessible save-status surface', await page.locator('.editor-meta [data-save-state]').count() === 1 && await page.locator('.editor-meta [data-save-state]').getAttribute('role') === 'status');
await page.locator('#draftEditor').fill('A local save-status check.');
check('editor says Saving… during persistence', await page.locator('.editor-meta [data-save-state]').textContent() === 'Saving…');
await page.waitForTimeout(260);
check('editor says Saved on this device after persistence', await page.locator('.editor-meta [data-save-state]').textContent() === 'Saved on this device');

console.log('\nHumane zero states');
const reviewPanel = page.locator('.integrated-support > .panel').filter({ has: page.locator('h2', { hasText: 'Review Center' }) });
check('fresh Review Center hides zero report and decision counters but keeps every entry action', await reviewPanel.evaluate(panel => !/\b0\b|0 saved|0 decisions/i.test(panel.textContent)) && await reviewPanel.locator('[data-action="coach"]').isVisible() && await reviewPanel.locator('[data-action="focused-review"]').isVisible() && await reviewPanel.locator('[data-action="council"]').isVisible());
const evidencePanel = page.locator('.integrated-support > .panel').filter({ has: page.locator('h2', { hasText: 'Evidence so far' }) });
check('fresh Evidence hides zero artifact rows while Browse evidence and Process Reflection remain discoverable', await evidencePanel.locator('.artifact-row').count() === 0 && await evidencePanel.locator('[data-action="evidence-browser"]').isVisible() && await evidencePanel.locator('[data-action="reflection"]').isVisible());
check('Evidence uses affirmative, truthful language rather than chastising navigation copy', /Evidence grows from your own words, saved drafts, sources, and revision decisions/.test(await evidencePanel.textContent()) && !/Navigation never counts|never counts as evidence/i.test(await evidencePanel.textContent()));

console.log('\nFeedback choices');
await page.locator('[data-action="review-center"]').last().click();
const guide = page.locator('.feedback-choice-guide');
check('one comparison guide is present in Review Center and closed by default', await guide.count() === 1 && !(await guide.getAttribute('open')));
check('zero tab badges are absent while each review section stays reachable', !/\(0\)/.test(await page.locator('.review-nav').textContent()) && await page.locator('.review-nav button').count() === 3);
await guide.locator('summary').click();
const guideText = await guide.textContent();
check('guide distinguishes specific Ask, one-lens Focused review, and multi-perspective Council', /specific question about a passage, paragraph, or draft/.test(guideText) && /one careful lens/.test(guideText) && /several perspectives on a developed draft/.test(guideText));
check('guide says choices are optional, not steps, and preserves self/outside review', /optional choices, not steps/.test(guideText) && /instructor or another person/.test(guideText));
await page.keyboard.press('Escape');
await page.locator('#draftEditor').fill('This developed synthetic draft has enough exact words for several readers to examine without using real student work.');
await page.waitForTimeout(240);
await page.locator('[data-action="council"]').first().click();
const consentText = await page.locator('.transmission-facts').textContent();
check('Council consent states several calls, longer wait, reviewer roles, and student control', /3 reviewer calls \+ 1 synthesis/.test(consentText) && /takes longer/.test(consentText) && /decision-maker/.test(consentText));
await page.keyboard.press('Escape');

console.log('\nStatic genre-specific Move examples');
const profiles = [
    ['mixed-genre-autobiographical-essay', 'larger-force', 'Larger force', 'Fuerza mayor'],
    ['college-personal-statement', 'connection', 'Why it matters', 'Por qué importa'],
    ['stem-lab-report', 'reasoning', 'Limitation', 'Limitación'],
    ['graduate-sop', 'evidence', 'Forward link', 'Conexión futura'],
    ['general-writing', 'structure', 'Complication', 'Complicación'],
    ['cap200-bronx-beautiful-service-learning', 'community-course-bridge', 'Service observation', 'Observación del servicio'],
    ['research-paper', 'notes-patterns', 'Verify next', 'Verificar después'],
];
for (const [assignment, moveId, enNeedle, esNeedle] of profiles) {
    await fresh(`?assignment=${assignment}`);
    const card = page.locator(`.integrated-move:has(.move-example)`).filter({ has: page.locator('.move-example') });
    check(`${assignment}: exactly one demanding Move has a quick example`, await card.count() === 1);
    const move = await page.evaluate(id => window.StudioProfiles.integratedMoveProfiles[document.querySelector('.genre-select').value].find(item => item.id === id), moveId);
    check(`${assignment}: example is canonical to the intended Move and bilingual in data`, Boolean(move?.exampleEn?.length && move?.exampleEs?.length) && JSON.stringify(move.exampleEn).includes(enNeedle) && JSON.stringify(move.exampleEs).includes(esNeedle));
    const details = card.locator('.move-example');
    check(`${assignment}: example is closed, static, hypothetical, and ownership-protective`, !(await details.getAttribute('open')) && await details.locator('button, input, textarea, [data-action]').count() === 0 && /Hypothetical structure/.test(await details.textContent()) && /Use your own facts and wording/.test(await details.textContent()));
    const before = await page.evaluate(key => localStorage.getItem(key), KEY);
    await details.locator('summary').click();
    const after = await page.evaluate(key => localStorage.getItem(key), KEY);
    check(`${assignment}: viewing the example inserts and records nothing`, before === after && await page.locator('#draftEditor').inputValue() === '' && await page.locator('.integrated-move textarea').count() === 0);
}

console.log('\nSpanish and bilingual completeness');
await fresh('?assignment=graduate-sop');
await page.locator('.prototype-actions [data-action="language"]').selectOption('es');
await page.locator('[data-action="review-center"]').last().click();
await page.locator('.feedback-choice-guide summary').click();
check('Spanish feedback comparison is complete and natural', /¿Qué tipo de retroalimentación te ayudaría\?/.test(await page.locator('.feedback-choice-guide').textContent()) && /Son opciones voluntarias, no pasos/.test(await page.locator('.feedback-choice-guide').textContent()));
await page.keyboard.press('Escape');
const spanishExample = page.locator('.move-example');
await spanishExample.locator('summary').click();
check('Spanish example includes boundary and ownership copy', /Estructura hipotética/.test(await spanishExample.textContent()) && /Usa tus propios hechos y palabras/.test(await spanishExample.textContent()));
await page.locator('.prototype-actions [data-action="language"]').selectOption('both');
const bilingualExample = page.locator('.move-example');
await bilingualExample.locator('summary').click();
check('bilingual mode presents both languages coherently without duplicate controls', /Ver un ejemplo breve · See a quick example/.test(await bilingualExample.locator('summary').textContent()) && await bilingualExample.locator('summary').count() === 1);

console.log('\nArtifacts reveal counts only after genuine work');
await fresh('?assignment=mixed-genre-autobiographical-essay');
await page.locator('.integrated-move [data-action="integrated-move-note"]').first().click();
await page.locator('#integratedMoveNote').fill('A student-authored planning note for this exact genre.');
await page.locator('[data-action="save-integrated-note"]').click();
check('first genuine Move note reveals its count and Evidence record', await page.locator('.integrated-moves .evidence-count').textContent() === '1' && await page.locator('.integrated-support > .panel').filter({ has: page.locator('h2', { hasText: 'Evidence so far' }) }).locator('.artifact-row').count() === 1);

console.log('\nResponsive, accessibility, and no-call checks');
await fresh('?assignment=stem-lab-report', { width: 390, height: 844 });
await page.locator('[data-action="review-center"]').last().click();
await page.locator('.feedback-choice-guide summary').click();
check('mobile guide reflows without horizontal overflow and keeps 44px controls', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth) && await page.locator('.feedback-choice-guide summary').evaluate(el => el.getBoundingClientRect().height >= 44));
await page.keyboard.press('Escape');
check('Escape returns from Review Center and draft remains reachable', await page.locator('[role="dialog"]').count() === 0 && await page.locator('#draftEditor').isVisible());
await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
check('200% reflow has no horizontal page overflow', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
check('viewing explanations/examples made no external request and caused no page error', external.length === 0 && errors.length === 0, `${external.join(', ')} ${errors.join(' | ')}`);

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
