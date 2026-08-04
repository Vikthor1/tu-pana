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
    await page.evaluate(key => { localStorage.removeItem(key); localStorage.setItem('tupana_draft', 'R0 COUNCIL SENTINEL'); }, KEY);
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
check('CAP 200 run stores its own genre provenance', record.councilRuns[0].genre === 'cap200' && record.councilRuns[0].genreLabel.includes('CAP 200'));

record = await fresh('research-paper').then(convene);
check('research Council uses source-evidence roles, not autobiography', record.councilRuns[0].roles.join('|').includes('Source-evidence reviewer') && !record.councilRuns[0].roles.join('|').includes('cultural-integrity'));

record = await fresh('mixed-genre-autobiographical-essay').then(convene);
check('autobiographical Council keeps its canonical three reviewers', record.councilRuns[0].roles.join('|').includes('Voice and cultural-integrity reviewer'));
check('autobiographical Council pairs with the cultural critical question', record.councilRuns[0].criticalKey === 'cultural');

console.log('\nAvailability truth');
await fresh('stem-lab-report');
const railText = await page.locator('.integrated-support').textContent();
check('STEM rail states Council unavailability plainly', /Council is not configured for this genre|El Consejo no está configurado/.test(railText));
check('STEM offers no convene action', await page.locator('.integrated-support [data-action="council"]').count() === 0);

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
await page.locator('.integrated-support [data-action="review-tab"][data-tab="council"], .review-nav [data-tab="council"]').first().click();
const reportText = await page.locator('.dialog').textContent();
check('saved SOP report renders its stored genre after switching to General Writing', /Graduate statement of purpose/.test(reportText));
check('revisit after switch creates no new run', await stored().then(r => r.councilRuns.length === 1));

console.log('\nIsolation');
check('R0 sentinel untouched', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 COUNCIL SENTINEL');
check('no external requests', external.length === 0, external.join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
