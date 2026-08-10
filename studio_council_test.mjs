// Writing Studio migration candidate — genre-configured Council behavior.
// Roles, availability, prohibitions, and revisit truth are profile-driven data
// translated from legacy council.js. Requires this worktree at 127.0.0.1:3001.
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
async function fresh(assignment) {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(8000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html`);
    // Desk suites: onboarding is answered so the Studio opens on the Desk. The
    // first-run welcome that precedes it for a genuinely new writer has its own
    // suite (studio_onboarding_test.mjs) and is covered there.
    await page.evaluate(key => { localStorage.removeItem(key); localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' })); localStorage.setItem('tupana_draft', 'R0 COUNCIL SENTINEL'); }, KEY);
    await page.goto(`${ORIGIN}/studio.html?assignment=${assignment}`);
    await page.locator('#draftEditor').fill('This synthetic draft is long enough for a Council reading and stays entirely synthetic.');
    await page.waitForTimeout(240);
}
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);

async function convene() {
    await page.locator('[data-action="council"]').first().click();
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="run-council"]').click();
    await page.waitForFunction(key => (JSON.parse(localStorage.getItem(key) || '{}').councilRuns || []).length === 1, KEY);
    return stored();
}

console.log('\nGenre-configured roles');
let record = await fresh('cap200-bronx-beautiful-service-learning').then(convene);
check('CAP 200 Council uses service-learning roles', record.councilRuns[0].roles.join('|').includes('Service-learning evidence reviewer'));
// SHIPPED-CONTRACT UPDATE (2026-08-06): a run still snapshots its own genre
// provenance; the label it snapshots is now the course-number-free one. The
// internal profile key is deliberately unchanged, so stored work still resolves.
check('the service-learning run stores its own genre provenance',
    record.councilRuns[0].genre === 'cap200' && /service-learning/i.test(record.councilRuns[0].genreLabel));
check('a newly stored run carries no course number in its label',
    !/CAP\s*-?\s*200/i.test(record.councilRuns[0].genreLabel), record.councilRuns[0].genreLabel);

record = await fresh('research-paper').then(convene);
check('research Council uses source-evidence roles, not autobiography', record.councilRuns[0].roles.join('|').includes('Source-evidence reviewer') && !record.councilRuns[0].roles.join('|').includes('cultural-integrity'));

record = await fresh('mixed-genre-autobiographical-essay').then(convene);
check('autobiographical Council keeps its canonical three reviewers', record.councilRuns[0].roles.join('|').includes('Voice and cultural-integrity reviewer'));
check('autobiographical Council pairs with the cultural critical question', record.councilRuns[0].criticalKey === 'cultural');

console.log('\nAvailability truth');
// SHIPPED-CONTRACT UPDATE (2026-08-05): STEM's Council is now built and
// operational, so the unavailable case is Reading Response, whose Council is
// deliberately not built. Both halves of the truthfulness contract are asserted.
await fresh('reading-response-undergraduate');
const railText = await page.locator('.integrated-support').textContent();
check('reading-response rail states Council unavailability plainly', /not available for reading responses|no está disponible para respuestas de lectura/.test(railText));
check('reading response offers no convene action', await page.locator('.integrated-support [data-action="council"]').count() === 0);
await fresh('stem-lab-report');
const stemRail = await page.locator('.integrated-support').textContent();
check('STEM no longer declares its Council unconfigured', !/Council is not configured for this genre/.test(stemRail));
check('STEM offers a convene action', await page.locator('.integrated-support [data-action="council"]').count() === 1);

console.log('\nProhibitions travel in built prompts (data-driven)');
const prompts = await page.evaluate(() => ({
    cap200: window.StudioProvider.buildCouncilReviewerPrompt({ genreName: 'CAP 200 service-learning report', lang: 'en', roleLabel: 'Service-learning evidence reviewer', prohibitions: window.StudioProfiles.councilConfig.cap200.prohibitions, text: 'draft' }),
    research: window.StudioProvider.buildCouncilReviewerPrompt({ genreName: 'Research paper', lang: 'en', roleLabel: 'Source-evidence reviewer', prohibitions: window.StudioProfiles.councilConfig.research.prohibitions, text: 'draft' }),
}));
check('CAP 200 reviewer prompt forbids invented hours and deficit framing', prompts.cap200.includes('inventing or embellishing service activities') && prompts.cap200.includes('deficit terms'));
check('research reviewer prompt forbids invented citations', prompts.research.includes('Never invent sources'));

console.log('\nRevisit truth after genre switch');
record = await fresh('graduate-sop').then(convene);
await page.locator('[data-action="close-dialog"]').first().click();
await page.locator('[data-action="settings"]').first().click();
await page.locator('#settingsGenre').selectOption('neutral');
// W1 — the assertion below MOVES, deliberately and visibly. This section has
// always been about one thing: a saved report keeps its OWN genre and is never
// relabelled by whatever project happens to be open. That claim is unchanged
// and is still asserted, one step further down — on the assignment the report
// belongs to. What changed is where the report is LISTED: the Review Center now
// reports the active assignment's work, so a General Writing session no longer
// shows a Statement of Purpose report. Nothing is weakened: the record is
// proven still present and unmodified while the other project is open, and the
// original provenance check runs verbatim once its own project is reopened.
await page.locator('[data-action="review-center"]').first().click();
const neutralCenter = await page.locator('.dialog').textContent();
check('the SOP report is not listed while General Writing is the open project',
    !/Graduate statement of purpose/.test(neutralCenter));
check('and the switch deleted nothing', await stored().then(r => r.councilRuns.length === 1));
await page.keyboard.press('Escape');
await page.locator('[data-action="settings"]').first().click();
await page.locator('#settingsGenre').selectOption('sop');
await page.locator('.integrated-support [data-action="review-tab"][data-tab="council"], .review-nav [data-tab="council"]').first().click();
const reportText = await page.locator('.dialog').textContent();
check('saved SOP report renders its stored genre when its own project is reopened', /Graduate statement of purpose/.test(reportText));
check('revisit after switch creates no new run', await stored().then(r => r.councilRuns.length === 1));

console.log('\nIsolation');
check('R0 sentinel untouched', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 COUNCIL SENTINEL');
check('no external requests', external.length === 0, external.join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
