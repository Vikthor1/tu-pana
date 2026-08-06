// Writing Studio — first-use onboarding.
//
// Guided Discovery is the default first surface for a genuinely new writer with
// an empty workspace, and it is a SURFACE, not a gate: nothing is blocked, and
// going straight to the Desk is one click away.
//
// The case this suite exists to protect is the second one. A writer whose
// workspace predates the onboarding flag must NOT be interrupted merely because
// a preference key is absent. Their draft, notes, evidence, versions, and
// imported work are already there; they get a quiet, dismissible invitation
// instead, and their record is never modified, cleared, migrated, or
// reinterpreted.
//
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const BASE = `${ORIGIN}/studio.html`;
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
let page;
// A genuinely new arrival: both the Studio record and the onboarding preference
// are absent, exactly as they are for someone opening the link for the first time.
async function newcomer(query = '?assignment=general-writing', viewport = { width: 1440, height: 960 }) {
    if (page) await page.close();
    page = await browser.newPage({ viewport });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(ORIGIN)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(BASE);
    await page.evaluate(keys => keys.forEach(k => localStorage.removeItem(k)), [KEY, TOUR_KEY]);
    await page.goto(`${BASE}${query}`);
}
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);
// `savedAt` is the record's own save timestamp, not student work. Every other
// field must survive an onboarding decision untouched.
const workOf = record => { const copy = { ...(record || {}) }; delete copy.savedAt; return JSON.stringify(copy); };
const prefs = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), TOUR_KEY);

// The conversation arrives in paced beats: a composing indicator, then one
// message at a time, pausing at gates. Read it only once a group has finished.
async function settle() {
    for (let i = 0; i < 16; i++) {
        if (await page.locator('.gd-continue').count()) { await page.locator('.gd-continue').first().click().catch(() => {}); await page.waitForTimeout(90); continue; }
        if (await page.locator('.gd-typing').count()) { await page.waitForTimeout(160); continue; }
        if (!(await page.locator('.gd-choice').count())) { await page.waitForTimeout(160); continue; }
        break;
    }
}

// ── 1. A new writer meets the welcome before the Desk ────────────────────────
console.log('\n1. First arrival, empty workspace');
await newcomer();
check('the welcome is the first surface', await page.locator('.first-run').count() === 1);
check('the Desk\'s full choice architecture is not shown behind it',
    await page.locator('#draftEditor').count() === 0 && await page.locator('.integrated-moves').count() === 0);
check('it is not a modal and blocks nothing', await page.locator('#dialogRoot .overlay').count() === 0);
const firstRunText = await page.locator('.first-run').innerText();
check('a primary action begins Guided Discovery', await page.locator('.first-run [data-action="tour-start"].primary').count() === 1);
check('a clear secondary action goes straight to the Desk', await page.locator('.first-run [data-action="tour-dismiss"]').count() === 1);
check('it says truthfully that the tour can be reopened from Help', /from Help|desde Ayuda/i.test(firstRunText));
check('it says the conversation needs no typing and can be left at any point',
    /no typing|sin escribir/i.test(firstRunText) && /leave at any point|salir en cualquier momento/i.test(firstRunText));
check('it says demonstrations use examples, never the writer\'s writing',
    /uses examples, never your writing|Usa ejemplos, nunca tu escritura/i.test(firstRunText));
check('it is not a slideshow, checklist, or philosophy statement',
    await page.locator('.first-run ol, .first-run ul, .first-run [role="tablist"]').count() === 0
    && firstRunText.split(/\s+/).length < 90, `${firstRunText.split(/\s+/).length} words`);
check('the writing project stays visible through onboarding', /General writing project/i.test(firstRunText));
check('nothing has been written to the Studio record yet', (await stored()) === null || !(await stored()).draft);

// ── 2. Skipping goes straight to work, with no penalty or repetition ─────────
console.log('\n2. Skipping');
await page.locator('[data-action="tour-dismiss"]').click();
await page.waitForTimeout(300);
check('skipping lands directly on the Desk', await page.locator('#draftEditor').count() === 1 && await page.locator('.first-run').count() === 0);
check('skipping shows no penalty, warning, or incomplete state',
    !/skipped|incomplete|you should|deberías|incompleto/i.test(await page.locator('#prototypeRoot').innerText()));
check('the quiet invitation is not shown instead — that would be a second prompt',
    await page.locator('.tour-welcome').count() === 0);
check('the skip is remembered as an interface preference', Boolean((await prefs()).dismissedAt));
check('onboarding state lives outside the Studio record',
    !JSON.stringify(await stored() || {}).includes('dismissedAt'));
await page.reload();
await page.waitForTimeout(300);
check('a returning visit does not ask again', await page.locator('.first-run').count() === 0 && await page.locator('.tour-welcome').count() === 0);
check('the returning visit lands on the Desk', await page.locator('#draftEditor').count() === 1);

// ── 3. Guided Discovery remains reachable from Help, always ──────────────────
console.log('\n3. Help remains the permanent route back');
await page.locator('[data-action="help"]').first().click();
await page.waitForTimeout(200);
check('Help offers Guided Discovery', await page.locator('.dialog [data-action="tour-start"]').count() === 1);
await page.locator('.dialog [data-action="tour-start"]').click();
await page.waitForTimeout(400);
await settle();
check('Guided Discovery starts from Help after a skip', await page.locator('.gd-conversation').count() === 1);
check('it is the accepted paced conversation, not a slideshow',
    await page.locator('.gd-turn').count() >= 1 && await page.locator('.gd-choice').count() >= 1);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check('leaving the conversation returns to the Desk with the draft intact',
    await page.locator('#draftEditor').count() === 1);

// ── 4. Starting, completing, leaving, resuming, restarting ───────────────────
console.log('\n4. The conversation itself');
await newcomer();
await page.locator('.first-run [data-action="tour-start"]').click();
await page.waitForTimeout(400);
await settle();
check('starting from the welcome opens the conversation', await page.locator('.gd-conversation').count() === 1);
check('starting is remembered immediately, so a reload does not re-prompt', Boolean((await prefs()).startedAt));
await page.reload();
await page.waitForTimeout(400);
check('reloading mid-conversation returns to the Desk, not the welcome',
    await page.locator('.first-run').count() === 0 && await page.locator('#draftEditor').count() === 1);
await newcomer();
await page.locator('.first-run [data-action="tour-start"]').click();
await page.waitForTimeout(400);
await settle();
for (let i = 0; i < 10; i++) {
    await settle();
    const choices = page.locator('.gd-choice:not(.gd-continue)');
    if (!(await choices.count())) break;
    await choices.last().click().catch(() => {});
    await page.waitForTimeout(140);
}
await settle();
check('the conversation can be walked to an exit without typing anything',
    await page.locator('.gd-conversation, #draftEditor').count() >= 1);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
check('after the conversation the Desk is the surface', await page.locator('#draftEditor').count() === 1);
check('the welcome does not return', await page.locator('.first-run').count() === 0);

// ── 5. An existing writer is never interrupted ───────────────────────────────
console.log('\n5. A migrated workspace with real work and no onboarding flag');
await newcomer();
await page.locator('[data-action="tour-dismiss"]').click();
await page.waitForTimeout(250);
await page.locator('#draftEditor').fill('A paragraph I already wrote before this onboarding existed, in my own words.');
await page.waitForTimeout(400);
const existingRecord = await stored();
// Remove ONLY the onboarding preference, exactly as a pre-flag workspace looks.
await page.evaluate(key => localStorage.removeItem(key), TOUR_KEY);
await page.reload();
await page.waitForTimeout(400);
check('the existing writer is NOT interrupted by the welcome surface', await page.locator('.first-run').count() === 0);
check('the existing writer lands on their Desk with their draft intact',
    (await page.locator('#draftEditor').inputValue()) === 'A paragraph I already wrote before this onboarding existed, in my own words.');
check('they receive a quiet, dismissible invitation instead', await page.locator('.tour-welcome').count() === 1);
check('the invitation is below the writing surface, not over it',
    await page.evaluate(() => {
        const editor = document.getElementById('draftEditor').getBoundingClientRect();
        const card = document.querySelector('.tour-welcome').getBoundingClientRect();
        return card.top >= editor.top;
    }));
check('the invitation can be dismissed', await page.locator('.tour-welcome [data-action="tour-dismiss"]').count() === 1);
check('the existing record was not modified, cleared, or migrated',
    workOf(await stored()) === workOf(existingRecord));
await page.locator('.tour-welcome [data-action="tour-dismiss"]').click();
await page.waitForTimeout(250);
check('dismissing the invitation leaves the record untouched',
    workOf(await stored()) === workOf(existingRecord));
check('the invitation does not return', await page.locator('.tour-welcome').count() === 0);

// Every other kind of existing work also suppresses the welcome surface.
for (const [label, seed] of [
    ['a saved version', record => ({ ...record, versions: [{ id: 'v1', createdAt: new Date().toISOString(), words: 5, text: 'earlier text', reason: 'checkpoint' }] })],
    ['a kept Your Voice entry', record => ({ ...record, voiceEntries: [{ id: 'v', text: 'aquí escuchamos primero', reason: '', protectedAt: new Date().toISOString(), genre: 'neutral' }] })],
    ['a legacy import', record => ({ ...record, legacyImport: { appliedAt: new Date().toISOString() } })],
]) {
    await newcomer();
    await page.locator('[data-action="tour-dismiss"]').click();
    await page.waitForTimeout(250);
    const base = await stored();
    const seeded = seed(base);
    await page.addInitScript(([key, tourKey, next]) => {
        localStorage.setItem(key, JSON.stringify(next));
        localStorage.removeItem(tourKey);
    }, [KEY, TOUR_KEY, seeded]);
    await page.goto(`${BASE}?assignment=general-writing`);
    await page.waitForTimeout(400);
    check(`${label} suppresses the welcome surface`, await page.locator('.first-run').count() === 0);
    check(`${label} receives the quiet invitation instead`, await page.locator('.tour-welcome').count() === 1);
}

// ── 6. Genre and language survive onboarding ─────────────────────────────────
console.log('\n6. Genre and language context');
for (const [assignment, expectMove] of [
    ['reading-response-graduate', 'Frame the text and the problem you are entering'],
    ['stem-scientific-argument', 'Turn the question into an arguable claim'],
    ['college-personal-statement', 'Choose what you want to reveal'],
]) {
    await newcomer(`?assignment=${assignment}`);
    check(`${assignment}: the welcome appears for the routed genre`, await page.locator('.first-run').count() === 1);
    await page.locator('[data-action="tour-dismiss"]').click();
    await page.waitForTimeout(300);
    const firstMove = await page.locator('.integrated-move strong').first().innerText();
    check(`${assignment}: skipping returns to the intended genre`, firstMove === expectMove, firstMove);
}
// An unconfigured assignment must not get a welcome for a genre it does not have.
await newcomer('?assignment=nothing-configured');
check('an unconfigured assignment gets the configuration stop, not a welcome',
    await page.locator('.first-run').count() === 0
    && /CONFIGURATION REQUIRED|CONFIGURACIÓN/i.test(await page.locator('#prototypeRoot').innerText()));
// No assignment link at all. The Studio's canonical default project is active
// (pre-existing behaviour, unchanged by onboarding), so the welcome must name
// which project it is and leave the switcher reachable rather than implying the
// writer chose it.
await newcomer('');
check('with no link, the welcome names the active project rather than leaving it implicit',
    await page.locator('.first-run').count() === 1
    && /Mixed-genre autobiographical essay/i.test(await page.locator('.first-run').innerText()));
check('with no link, the project switcher remains reachable from the header',
    await page.locator('select[data-action="genre"]').count() >= 1);

for (const lang of ['en', 'es', 'both']) {
    await newcomer('?assignment=research-paper');
    await page.locator('.prototype-actions [data-action="language"]').selectOption(lang);
    await page.waitForTimeout(200);
    const text = await page.locator('.first-run').innerText();
    check(`${lang}: the welcome renders in the chosen language`,
        lang === 'es' ? /Bienvenido/.test(text) : /Welcome to your Writing Studio/.test(text));
    if (lang === 'both') check('both: the welcome carries both languages', /Welcome/.test(text) && /Bienvenido/.test(text));
    await page.locator('[data-action="tour-dismiss"]').click();
    await page.waitForTimeout(250);
    check(`${lang}: the language choice survives the skip`,
        await page.evaluate(() => document.querySelector('.prototype-actions [data-action="language"]').value) === lang);
}

// ── 7. Demonstrations never touch the writer's work ──────────────────────────
console.log('\n7. Isolation');
await newcomer('?assignment=stem-lab-report');
const beforeTour = await page.evaluate(key => localStorage.getItem(key), KEY);
await page.locator('.first-run [data-action="tour-start"]').click();
await page.waitForTimeout(400);
for (let i = 0; i < 8; i++) {
    await settle();
    if (await page.locator('.gd-preview').count()) break;
    const choices = page.locator('.gd-choice:not(.gd-continue)');
    if (!(await choices.count())) break;
    await choices.first().click().catch(() => {});
    await page.waitForTimeout(140);
}
await settle();
check('a live preview rendered', await page.locator('.gd-preview').count() > 0);
check('every preview is labelled as an example',
    await page.locator('.gd-preview').evaluateAll(nodes => nodes.length > 0
        && nodes.every(n => /sample|muestra/i.test(n.querySelector('.gd-preview-badge')?.textContent || ''))));
check('the Studio record is byte-identical after the demonstration',
    (await page.evaluate(key => localStorage.getItem(key), KEY)) === beforeTour);
const after = await stored();
check('no draft, note, voice entry, version, review, or decision was created',
    !(after?.draft || '').trim()
    && !(after?.versions || []).length && !(after?.reviews || []).length
    && !(after?.councilRuns || []).length && !(after?.voiceEntries || []).length
    && !(after?.decisions || []).length
    && !Object.keys(after?.moveNotes || {}).length);
check('onboarding state carries no student work', JSON.stringify(await prefs()).length < 200,
    JSON.stringify(await prefs()));

// ── 8. Access ────────────────────────────────────────────────────────────────
console.log('\n8. Access');
await newcomer('?assignment=general-writing', { width: 390, height: 844 });
check('phone: the welcome renders', await page.locator('.first-run').count() === 1);
check('phone: no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
check('phone: both actions meet the 44px target',
    await page.locator('.first-run .button').evaluateAll(ns => ns.length === 2 && ns.every(n => n.getBoundingClientRect().height >= 43.5)));
await newcomer();
await page.keyboard.press('Tab');
const reachable = await page.evaluate(() => {
    const order = [];
    const focusable = [...document.querySelectorAll('.first-run button')];
    return focusable.length === 2 && focusable.every(el => el.tabIndex >= 0) && order.length === 0;
});
check('desktop: both welcome actions are keyboard-focusable', reachable);
await page.locator('.first-run [data-action="tour-start"]').focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
await settle();
check('the welcome can be started from the keyboard', await page.locator('.gd-conversation').count() === 1);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
check('Escape from the conversation restores focus to the Studio',
    await page.evaluate(() => document.activeElement && document.activeElement !== document.body));
await newcomer();
check('the welcome has one labelled region and one heading',
    await page.locator('.first-run[aria-labelledby="firstRunTitle"]').count() === 1
    && await page.locator('#firstRunTitle').count() === 1);
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.reload();
await page.waitForTimeout(300);
check('reduced motion: the welcome still renders and both actions remain',
    await page.locator('.first-run').count() === 1 && await page.locator('.first-run .button').count() === 2);

// ── Close ────────────────────────────────────────────────────────────────────
check('no external network request was made', external.length === 0, external.join(', '));
check('no page error was raised', errors.length === 0, errors.join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} ${failed ? 'FAIL' : 'PASS'}`);
process.exit(failed ? 1 : 0);
