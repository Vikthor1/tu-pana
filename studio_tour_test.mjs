// Writing Studio — interactive quick tour verification.
// Entry conditions, isolation from every real record, no network, genre-correct
// demonstration material, bilingual completeness, accessibility, and exits.
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const KEY = 'tupana-studio:v1';
const TOUR_KEY = 'tupana-studio:tour:v1';
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
async function fresh(options = {}) {
    if (page) await page.close();
    page = await browser.newPage({ viewport: options.viewport || { width: 1440, height: 960 }, reducedMotion: options.reducedMotion || 'no-preference' });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html`);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${ORIGIN}/studio.html${options.query || ''}`);
    if (options.lang) await page.locator('.prototype-actions [data-action="language"]').selectOption(options.lang);
}
const record = () => page.evaluate(key => localStorage.getItem(key), KEY);
// Reload triggers the Studio's own beforeunload save, which refreshes `savedAt`.
// Normalising it keeps this suite pointed at tour effects rather than that
// pre-existing behavior.
const recordSansTimestamp = async () => (await record() || '').replace(/"savedAt":"[^"]*"/, '"savedAt":"—"');
const tourPrefs = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), TOUR_KEY);
const startFromCard = () => page.locator('.tour-welcome [data-action="tour-start"]').click();
async function walkAll() {
    for (let i = 0; i < 5; i++) { await page.locator('[data-action="tour-next"]').click(); await page.waitForTimeout(60); }
}

console.log('\n1–2. Entry condition and Not now');
await fresh();
check('welcome card appears for a fresh writing project', await page.locator('.tour-welcome').isVisible());
check('card is non-modal and does not block the editor', await page.locator('[role="dialog"]').count() === 0 && await page.locator('#draftEditor').isEnabled());
check('card sits below the editor, not over it', await page.evaluate(() => {
    const card = document.querySelector('.tour-welcome').getBoundingClientRect();
    const editor = document.querySelector('#draftEditor').getBoundingClientRect();
    return card.top >= editor.bottom - 1;
}));
const beforeDismiss = await record();
await page.locator('[data-action="tour-dismiss"]').click();
await page.waitForTimeout(200);
check('Not now dismisses immediately', await page.locator('.tour-welcome').count() === 0);
check('Not now leaves the empty draft and record untouched', await page.locator('#draftEditor').inputValue() === '' && await record() === beforeDismiss);
check('dismissal is remembered locally with no student data', await tourPrefs().then(p => Boolean(p.dismissedAt) && !JSON.stringify(p).includes('draft')));
await page.reload();
check('dismissal is not re-prompted after reload', await page.locator('.tour-welcome').count() === 0);

console.log('\n3–4. Replay from Help, no repeat auto-prompt');
await page.locator('[data-action="help"]').click();
check('Help offers the tour', await page.locator('.dialog [data-action="tour-start"]').count() === 1);
await page.locator('.dialog [data-action="tour-start"]').click();
check('Help replay opens the tour', await page.locator('.tour-title').count() === 1 && await page.locator('.tour-progress').textContent() === '1 of 6');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
check('closing the replay does not resurface the welcome card', await page.locator('.tour-welcome').count() === 0);

console.log('\n5. Existing and imported work suppress the automatic prompt');
await fresh();
await page.locator('#draftEditor').fill('A returning writer already has words here.');
await page.waitForTimeout(300);
await page.reload();
check('existing writing suppresses the welcome card', await page.locator('.tour-welcome').count() === 0);
await fresh();
// Injected through an init script: the Studio's own beforeunload save would
// otherwise overwrite a record edited in the live page before the reload.
await page.addInitScript(key => {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    saved.legacyImport = { appliedAt: new Date().toISOString(), facts: [], notImported: [], records: {} };
    saved.versions = [{ id: 'v1', signature: '10:x', words: 10, createdAt: null, reason: 'imported from legacy', text: 'imported work' }];
    localStorage.setItem(key, JSON.stringify(saved));
}, KEY);
await page.reload();
check('imported work suppresses the welcome card', await page.locator('.tour-welcome').count() === 0);
check('the tour stays reachable from Help after import', await (async () => { await page.locator('[data-action="help"]').click(); return await page.locator('.dialog [data-action="tour-start"]').count() === 1; })());
await page.keyboard.press('Escape');

console.log('\n6–7. Isolation from real records and storage');
await fresh();
await page.locator('#draftEditor').fill('Isolation baseline draft that must never change.');
await page.waitForTimeout(300);
await page.reload();
const baseline = await record();
await page.locator('[data-action="help"]').click();
await page.locator('.dialog [data-action="tour-start"]').click();
await page.locator('[data-action="tour-next"]').click();
await page.locator('[data-action="tour-reveal-move"]').click();
await page.locator('[data-action="tour-next"]').click();
await page.locator('[data-action="tour-keep-suggested"]').click();
await page.locator('[data-action="tour-next"]').click();
await page.locator('[data-action="tour-feedback"][data-choice="council"]').click();
await page.locator('[data-action="tour-next"]').click();
await page.locator('[data-action="tour-decide"][data-choice="accept"]').click();
await page.locator('[data-action="tour-next"]').click();
await page.locator('[data-action="tour-compare"][data-choice="after"]').click();
check('every interaction leaves the record byte-identical', await record() === baseline);
const parsed = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
check('no real Move note, Voice entry, decision, review, Council run, or version was created',
    Object.keys(parsed.moveNotes || {}).length === 0 && (parsed.voiceEntries || []).length === 0
    && (parsed.decisions || []).length === 0 && (parsed.reviews || []).length === 0
    && (parsed.councilRuns || []).length === 0 && (parsed.versions || []).length === 0);
check('reflection, Finish, and packet state untouched', !parsed.reflectionSavedAt && !parsed.packetCreatedAt && parsed.packetDraft === '' && Object.keys(parsed.finishChecks || {}).length === 0);
check('only the tour preference key is added beside the record', await page.evaluate(() => Object.keys(localStorage).sort().join(',')) === 'tupana-studio:tour:v1,tupana-studio:v1');
await page.locator('[data-action="tour-write"]').click();
await page.waitForTimeout(200);
check('completing the tour leaves the record byte-identical', await record() === baseline);
check('the real draft is unchanged after the tour', await page.locator('#draftEditor').inputValue() === 'Isolation baseline draft that must never change.');
await page.locator('[data-action="help"]').click();
await page.locator('.dialog [data-action="tour-start"]').click();
await page.locator('[data-action="tour-next"]').click();
const baselineSansTimestamp = (baseline || '').replace(/"savedAt":"[^"]*"/, '"savedAt":"—"');
await page.reload();
check('reloading mid-tour leaves the record byte-identical', await recordSansTimestamp() === baselineSansTimestamp);
check('reloading mid-tour returns to the untouched Studio', await page.locator('.tour-title').count() === 0 && await page.locator('#draftEditor').inputValue() === 'Isolation baseline draft that must never change.');

console.log('\n8–9. No network, and demonstrations are unmistakable');
check('no external request from any tour path', external.length === 0, external.join(', '));
await page.locator('[data-action="help"]').click();
await page.locator('.dialog [data-action="tour-start"]').click();
const demoLabels = await page.locator('.tour-demo-label').count();
check('the demonstration layer is labeled on the first moment', demoLabels >= 1 && /Demonstration — not your writing\. Nothing here is saved\./.test(await page.locator('.tour-demo-label').first().textContent()));
await page.locator('[data-action="tour-next"]').click();
await page.locator('[data-action="tour-next"]').click();
await page.locator('[data-action="tour-next"]').click();
await page.locator('[data-action="tour-feedback"][data-choice="ask"]').click();
check('simulated feedback explains rather than requests', /would open a consent step/.test(await page.locator('.tour-result').textContent()));
await page.locator('[data-action="tour-next"]').click();
await page.locator('[data-action="tour-decide"][data-choice="adapt"]').click();
check('simulated decision states nothing was saved', /Demonstration only — your draft is unchanged and nothing was recorded\./.test(await page.locator('.tour-result').textContent()));
check('still no external request after simulated AI moments', external.length === 0);
await page.keyboard.press('Escape');

console.log('\n10–11. Genre-correct material, no leakage, unknown never inherits');
const genreExpectations = {
    'mixed-genre-autobiographical-essay': { must: /aquí escuchamos primero/, mustNot: /seedling|eligibility rules|intake survey/i },
    'college-personal-statement': { must: /what the form would change/, mustNot: /trauma|abuela|seedling/i },
    'graduate-sop': { must: /coded the responses myself/, mustNot: /aquí escuchamos|pantry/i },
    'stem-lab-report': { must: /2\.4 centimeters/, mustNot: /aunt|memory|community pantry/i },
    'cap200-bronx-beautiful-service-learning': { must: /eligibility rules/, mustNot: /seedling|admissions/i },
    'research-paper': { must: /civic participation/, mustNot: /seedling|aunt|signup sheet/i },
    'general-writing': { must: /exam weeks/, mustNot: /aunt|seedling|eligibility/i },
};
for (const [assignment, { must, mustNot }] of Object.entries(genreExpectations)) {
    await fresh({ query: `?assignment=${assignment}` });
    await startFromCard();
    await page.waitForTimeout(120);
    const text = await page.locator('.tour-moment').textContent();
    check(`${assignment}: correct example, no cross-genre leakage`, must.test(text) && !mustNot.test(text));
}
await fresh({ query: '?assignment=research-paper' });
await startFromCard();
await walkAll();
const researchText = await page.locator('.tour-moment').textContent();
check('research demonstration invents no citation or source', !/\(\d{4}\)|et al\.|doi|https?:\/\//i.test(researchText));
await fresh({ query: '?assignment=unknown-course-id' });
check('unknown assignment shows no welcome card', await page.locator('.tour-welcome').count() === 0);
await page.locator('[data-action="help"]').click();
await page.locator('.dialog [data-action="tour-start"]').click();
const unknownText = await page.locator('.dialog').textContent();
check('unknown assignment asks for a writing project instead of inheriting one', /not configured yet|todavía no está configurada/.test(unknownText));
check('unknown assignment inherits no autobiographical material', !/aquí escuchamos|memory|abuela/i.test(unknownText));

console.log('\n8b. The tour makes no call even when the live provider is active');
await fresh({ query: '?provider=gemini' });
check('live Gemini adapter is the active provider for this check', await page.evaluate(() => window.STUDIO_CONFIG?.provider) === 'gemini');
const externalBeforeLiveTour = external.length;
await startFromCard();
for (let i = 1; i <= 6; i++) {
    if (i === 2) await page.locator('[data-action="tour-reveal-move"]').click();
    if (i === 3) await page.locator('[data-action="tour-keep-suggested"]').click();
    if (i === 4) for (const choice of ['ask', 'focused', 'council']) await page.locator(`[data-action="tour-feedback"][data-choice="${choice}"]`).click();
    if (i === 5) for (const choice of ['accept', 'adapt', 'reject', 'later']) await page.locator(`[data-action="tour-decide"][data-choice="${choice}"]`).click();
    if (i === 6) await page.locator('[data-action="tour-compare"][data-choice="after"]').click();
    if (i < 6) await page.locator('[data-action="tour-next"]').click();
    await page.waitForTimeout(60);
}
await page.locator('[data-action="tour-explore"]').click();
await page.waitForTimeout(400);
check('a complete tour under the live provider still makes zero requests', external.length === externalBeforeLiveTour, external.slice(-3).join(', '));

console.log('\n12. English, Spanish, and bilingual completeness');
await fresh({ query: '?assignment=graduate-sop', lang: 'es' });
await startFromCard();
let esComplete = true;
for (let i = 0; i < 6; i++) {
    const text = await page.locator('.tour-moment').textContent();
    if (!/[áéíóúñ¿¡]/i.test(text) || /Why this helps/.test(text)) esComplete = false;
    if (i < 5) await page.locator('[data-action="tour-next"]').click();
    await page.waitForTimeout(60);
}
check('every Spanish moment is fully translated', esComplete);
await fresh({ query: '?assignment=graduate-sop', lang: 'both' });
await startFromCard();
check('bilingual mode pairs Spanish-primary with English', await page.locator('.tour-moment [lang="es"]').count() > 0 && await page.locator('.tour-moment [lang="en"]').count() > 0);
await fresh();
await startFromCard();
check('English tour renders without Spanish leakage in copy', /Why this helps/.test(await page.locator('.tour-moment').textContent()));

console.log('\n13. Accessibility, keyboard, responsive, themes');
check('the tour is a labeled modal dialog', await page.locator('[role="dialog"][aria-modal="true"]').count() === 1);
check('progress is stated without implying a requirement', await page.locator('.tour-progress').textContent() === '1 of 6' && await page.locator('[data-action="tour-skip"]').count() === 1);
check('Back is disabled on the first moment', await page.locator('[data-action="tour-back"]').isDisabled());
await page.locator('[data-action="tour-next"]').click();
check('moment change moves focus to the new heading', await page.evaluate(() => document.activeElement?.id) === 'tourMomentTitle');
await page.waitForTimeout(120);
check('a live announcement accompanies the moment change', /Step 2 of 6/.test(await page.locator('#liveRegion').textContent()));
await page.locator('[data-action="tour-back"]').click();
check('Back returns to the previous moment', await page.locator('.tour-progress').textContent() === '1 of 6');
await page.keyboard.press('Escape');
check('Escape closes the tour and returns to the desk', await page.locator('[role="dialog"]').count() === 0 && await page.locator('#draftEditor').isEnabled());
await fresh({ reducedMotion: 'reduce' });
await startFromCard();
check('reduced motion removes the moment transition', await page.locator('.tour-moment').evaluate(el => getComputedStyle(el).animationName === 'none'));
await fresh({ viewport: { width: 390, height: 844 } });
check('mobile welcome card fits without horizontal overflow', await page.locator('.tour-welcome').isVisible() && await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
await startFromCard();
await page.waitForTimeout(150);
check('mobile tour has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
const smallTargets = await page.locator('.dialog button:visible').evaluateAll(els => els.map(el => el.getBoundingClientRect()).filter(box => box.height && box.height < 44));
check('mobile tour controls meet 44px', smallTargets.length === 0, JSON.stringify(smallTargets.slice(0, 2)));
await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
check('200% text keeps the tour free of horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
await fresh();
await page.locator('[data-action="settings"]').first().click();
await page.locator('[data-action="appearance-choice"][data-appearance="dark"]').click();
await page.keyboard.press('Escape');
await startFromCard();
check('dark appearance renders the tour', await page.locator('.tour-title').isVisible() && await page.locator('.tour-demo').first().isVisible());

console.log('\n14–15. No effect on evidence surfaces or resting density');
await fresh();
await startFromCard();
await walkAll();
await page.locator('[data-action="tour-explore"]').click();
await page.waitForTimeout(200);
const afterTour = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'), KEY);
check('Evidence, reflection, Finish, and packet remain empty after a full tour',
    (afterTour.decisions || []).length === 0 && (afterTour.reviews || []).length === 0
    && !afterTour.reflectionSavedAt && !afterTour.packetCreatedAt);
await page.locator('.phase-strip [data-action="finish"]').click();
check('Finish readiness is unaffected by the tour', !/Council requested/.test('') && await page.locator('[data-action="create-packet"]').isDisabled());
const densityAfterTour = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let words = 0;
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || !node.textContent.trim()) continue;
        const style = getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
        const closed = parent.closest('details:not([open])');
        if (closed && !parent.closest('summary')) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (!rect.width && !rect.height) continue;
        words += node.textContent.trim().split(/\s+/).length;
    }
    return words;
});
await fresh();
// Scroll the card into view first so this measures the product's own behavior
// rather than the harness's automatic scroll-into-view before a click.
await page.locator('.tour-welcome').scrollIntoViewIfNeeded();
const scrollBeforeDismiss = await page.evaluate(() => window.scrollY);
await page.locator('[data-action="tour-dismiss"]').click();
await page.waitForTimeout(150);
check('dismissing does not scroll the page under the writer', await page.evaluate(() => window.scrollY) === scrollBeforeDismiss);

// Density is compared as a steady state: a fresh load with the card present, and
// a fresh load with the dismissal already remembered. Measuring on load avoids
// the scroll position left behind by clicking a below-fold control.
const measureViewportWords = () => page.evaluate(() => {
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
await fresh();
const densityWithCard = await measureViewportWords();
await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ v: 1, dismissedAt: new Date().toISOString() })), TOUR_KEY);
await page.reload();
check('the welcome card is gone on a fresh load after dismissal', await page.locator('.tour-welcome').count() === 0);
const dismissedDensity = await measureViewportWords();
check('first-viewport density returns to the documented baseline after dismissal', dismissedDensity <= 215, `${dismissedDensity} visible words`);
check('the welcome card itself adds no first-viewport words (it sits below the fold)', densityWithCard === dismissedDensity, `${densityWithCard} with card vs ${dismissedDensity} without`);
check('the tour adds no fourth primary destination', await page.locator('.phase-strip .phase-tab').count() === 3);
check('no page errors across every tour path', errors.length === 0, errors.slice(0, 2).join(' | '));
check('no external request across the whole suite', external.length === 0, external.join(', '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
