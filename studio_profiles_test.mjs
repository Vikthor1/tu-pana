// Writing Studio migration candidate — assignment classification and genre-profile
// loading. Requires this worktree at http://127.0.0.1:3001.
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

const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const external = [];
const errors = [];
page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
page.on('pageerror', error => errors.push(String(error)));

async function fresh(url) {
    await page.goto(`${ORIGIN}/studio.html`);
    await page.evaluate(key => {
        localStorage.removeItem(key);
        // Desk suites: onboarding is answered so the Studio opens on the Desk.
        // The first-run welcome that precedes it for a genuinely new writer has
        // its own suite (studio_onboarding_test.mjs) and is covered there.
        localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
        localStorage.setItem('tupana_draft', 'R0 PROFILES SENTINEL');
        localStorage.setItem('tupana_assignment_id', 'college-personal-statement');
    }, KEY);
    await page.goto(url);
}
const bodyText = () => page.evaluate(() => document.body.textContent);

console.log('\nCanonical default and legacy assignment links');
await fresh(`${ORIGIN}/studio.html`);
const activeProfile = () => page.locator('.genre-select').first().inputValue();
check('no assignment defaults to the canonical autobiographical profile', await activeProfile() === 'autobiographical');
check('canonical default is not silently General Writing', await activeProfile() !== 'neutral');
check('knowledge-and-language invitation appears only here', await page.locator('.knowledge-onboarding, [data-action="knowledge-choice"]').count() > 0);
check('legacy remembered key is never auto-applied', await activeProfile() !== 'admissions');
let text = await bodyText();

await fresh(`${ORIGIN}/studio.html?assignment=college-personal-statement`);
text = await bodyText();
check('college-personal-statement link loads the admissions profile', text.includes('College personal statement'));
check('admissions shows its own Moves', text.includes('Choose what you want to reveal'));
check('admissions has zero autobiographical Move leakage', !text.includes('Choose a memory and a boundary') && !text.includes('memoria y un límite'));
check('admissions has no cultural onboarding card', await page.locator('[data-action="knowledge-choice"]').count() === 0);

await fresh(`${ORIGIN}/studio.html?assignment=graduate-sop`);
text = await bodyText();
check('graduate-sop link loads the SOP profile', text.includes('Graduate statement of purpose'));
check('SOP shows its own Moves', text.includes('Trace a supported direction'));
check('SOP has zero autobiographical or admissions leakage', !text.includes('memory and a boundary') && !text.includes('want to reveal'));

await fresh(`${ORIGIN}/studio.html?assignment=stem-lab-report`);
text = await bodyText();
check('stem-lab-report link loads the STEM profile', text.includes('STEM lab report'));
// SHIPPED-CONTRACT UPDATE (2026-08-05): STEM now has a purpose-built Council.
check('STEM offers its own Council rather than declaring it unconfigured',
    !text.includes('Council is not configured for this genre') && !text.includes('El Consejo no está configurado'));
check('STEM has zero autobiographical vocabulary', !text.includes('memory') && !text.includes('memoria') && !text.includes('anécdota'));

await fresh(`${ORIGIN}/studio.html?assignment=mixed-genre-autobiographical-essay`);
text = await bodyText();
check('explicit autobiographical link resolves to the canonical profile', text.includes('Mixed-genre autobiographical essay'));

await fresh(`${ORIGIN}/studio.html?assignment=research-paper`);
text = await bodyText();
check('research-paper link loads the research profile', text.includes('Research paper') || text.includes('Trabajo de investigación'));
check('research profile shows research Moves, not autobiography', !text.includes('memory and a boundary'));

await fresh(`${ORIGIN}/studio.html?assignment=cap200-bronx-beautiful-service-learning`);
text = await bodyText();
check('CAP 200 service-learning link loads the service-learning profile', text.includes('CAP 200'));
check('CAP 200 has zero autobiographical leakage', !text.includes('memory and a boundary'));

await fresh(`${ORIGIN}/studio.html?assignment=cap-200-first-draft`);
text = await bodyText();
check('legacy cap-200-first-draft alias maps to the service-learning profile', text.includes('CAP 200'));
const notice = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}').assignmentNotice, KEY);
check('legacy CAP 200 alias records an explicit notice', Boolean(notice && notice.en && notice.en.includes('service-learning')));

console.log('\nUnknown assignments stop loudly');
await fresh(`${ORIGIN}/studio.html?assignment=totally-unknown-course`);
text = await bodyText();
check('unknown assignment renders a configuration-required stop', text.includes('not configured') || text.includes('Genre selection required') || text.includes('no está configurado'));
check('the unknown id is named in the stop', text.includes('totally-unknown-course'));
check('unknown assignment inherits no autobiographical Moves', !text.includes('Choose a memory and a boundary'));
check('unknown assignment inherits no General Writing guidance', !text.includes('Clarify purpose and audience'));
check('recovery reaches the writing-project selection', await page.locator('[data-action="settings"]').count() > 0);
await page.locator('.genre-config-error [data-action="settings"], [data-action="settings"]').first().click();
// Adapted for the branding pass: selectors now show the official full assignment name.
check('selection lists General Writing as an explicit choice', (await bodyText()).includes('General Writing Project'));

console.log('\nProfile memory and explicit switching');
await fresh(`${ORIGIN}/studio.html?assignment=graduate-sop`);
await page.goto(`${ORIGIN}/studio.html`);
text = await bodyText();
check('the resolved profile is remembered without the link parameter', text.includes('Graduate statement of purpose'));
await page.locator('[data-action="settings"]').first().click();
await page.locator('#settingsGenre').selectOption('neutral');
text = await bodyText();
check('General Writing activates only by explicit selection', text.includes('General writing project'));

console.log('\nIsolation');
const sentinel = await page.evaluate(() => [localStorage.getItem('tupana_draft'), localStorage.getItem('tupana_assignment_id')]);
check('R0 draft sentinel untouched by profile routing', sentinel[0] === 'R0 PROFILES SENTINEL');
check('legacy remembered assignment key untouched', sentinel[1] === 'college-personal-statement');
check('no external requests during profile routing', external.length === 0, external.join(', '));
check('zero page errors across all profile loads', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
