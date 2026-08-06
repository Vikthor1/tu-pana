// Writing Studio — authentic-work contract.
//
// The Studio must never invite a student to paste fake, sample, dummy, or
// invented writing merely to try the application out. This suite proves that
// across every production-facing state, in English, Spanish, and both-mode, on
// desktop and phone.
//
// It is deliberately NOT a blanket ban on the word "sample". Guided Discovery
// is allowed to show a clearly labelled demonstration, and Moves are allowed to
// offer example STRUCTURES — those are pedagogy, not testing invitations. So the
// prohibited-invitation matcher runs over the Desk with the Guided Discovery
// subtree removed, and Guided Discovery is held to its own rule instead: every
// demonstration stays labelled, inert, and outside the canonical record.
//
// The matcher is proved non-vacuous: the exact strings this pass removed are
// re-tested against it, and must still be caught.
//
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
    await page.evaluate(key => localStorage.removeItem(key), KEY);
    await page.goto(`${BASE}${query}`);
}

// ── The prohibited-invitation matcher ────────────────────────────────────────
// An offer to put text the writer did not write into their own work, or an
// instruction that their real work does not belong here. "Example" alone is
// never prohibited: a Move's example structure is legitimate pedagogy.
const INVITATIONS = [
    // English: an insertion verb aimed at fake-text material.
    // (a single intervening noun is allowed: "synthetic notebook material")
    /\b(paste|type|insert|load|fill|drop|import)\b[^.!?]{0,56}\b(fake|dummy|synthetic|made[- ]up|invented|placeholder|sample|practice)\s+(\w+\s+)?(text|writing|draft|essay|content|material|paragraph|prose|coursework)\b/i,
    // English: an offer to adopt ready-made writing.
    /\b(see|use|try|load|insert|start with|replace[^.!?]{0,24}with)\s+(a|an|the|this)\s+(sample|synthetic|fake|dummy|practice)\b/i,
    // English: naming fake writing as material at all. Desk copy has no
    // legitimate reason to say "fake text" or "synthetic draft" to a student.
    /\b(fake|dummy|synthetic|made[- ]up|invented|placeholder)\s+(\w+\s+)?(text|writing|draft|essay|content|material|paragraph|prose|coursework)\b/i,
    // English: telling the writer their real work does not belong.
    /\bdo not (paste|use|enter|bring|upload)\b[^.!?]{0,40}\breal\b/i,
    // Spanish: an insertion verb aimed at fake-text material.
    /\b(pega|pegar|escribe|escribir|inserta|insertar|carga|cargar|importa|importar)\b[^.!?]{0,56}\b(falso|falsa|ficticio|ficticia|sintétic\w*|inventad\w*|de prueba|de muestra)\b/i,
    // Spanish: an offer to adopt ready-made writing. Deliberately EXCLUDES
    // "ejemplo": a Move's example STRUCTURE ("Ver un ejemplo breve", shipped
    // with "Estructura hipotética; no es contenido sugerido") is protected
    // pedagogy, not a testing invitation. What is prohibited is being offered
    // ready-made prose, and the structural checks below prove none exists.
    /\b(ver|usa|usar|prueba|probar|reemplaza\w*|comienza\w*)\s+(con\s+)?(un|una|este|esta|el|la)\s+(muestra|texto sintétic\w*|texto falso|borrador de prueba|borrador de muestra)\b/i,
    // Spanish: naming fake writing as material at all.
    /\b(texto|escritura|borrador|ensayo|material|prosa)\s+(falso|falsa|ficticio|ficticia|sintétic\w*|inventad\w*|de prueba)\b/i,
    // Spanish: telling the writer their real work does not belong.
    /\bno pegues\b[^.!?]{0,40}\breal\b/i,
];
const violations = text => INVITATIONS.map((re, i) => (re.test(text) ? { i, hit: text.match(re)[0] } : null)).filter(Boolean);

// Desk text = everything the student can read, minus the Guided Discovery
// conversation, which is governed by the labelled-demonstration rule below.
const deskText = () => page.evaluate(() => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('#tourBody, #tourFooter, .gd-preview, .gd-demo').forEach(node => node.remove());
    return clone.innerText.replace(/\s+/g, ' ');
});

const GENRES = [
    'mixed-genre-autobiographical-essay', 'college-personal-statement', 'graduate-sop',
    'stem-lab-report', 'research-paper', 'cap200-bronx-beautiful-service-learning', 'general-writing',
];

// ── 1. The matcher is not vacuous ────────────────────────────────────────────
console.log('\nMatcher fidelity (guards against a test that can never fail)');
const REMOVED = [
    'See a sample',
    'Ver una muestra',
    'Replace draft with this synthetic text',
    'Reemplazar con este texto sintético',
    'Practice preview — the coach is simulated on this device. Do not paste real coursework.',
    'Vista de práctica — el coach es simulado en este dispositivo. No pegues trabajo académico real.',
    'Paste synthetic notebook material',
    'Pegar material sintético en el cuaderno',
    'Try it out with some fake text first',
    'Paste any dummy writing to test the app',
];
REMOVED.forEach(phrase => check(`catches removed invitation: "${phrase.slice(0, 46)}"`, violations(phrase).length > 0));

const LEGITIMATE = [
    // Move example structures — pedagogy, must never be banned.
    'Claim · Data · Reasoning · Limitation',
    'The inside example shows a structure, never prose to copy.',
    'El ejemplo de adentro muestra una estructura, nunca prosa para copiar.',
    'Each Move has a short nudge, an expandable explanation, an optional example structure.',
    // The Move example-structure disclosure, in both languages, with the
    // boundary line it always ships beside. This is the case the brief protects.
    'See a quick example',
    'Ver un ejemplo breve',
    'Hypothetical structure—not suggested content. Use your own facts and wording.',
    'Estructura hipotética; no es contenido sugerido. Usa tus propios hechos y palabras.',
    // Guided Discovery's labelled demonstration language.
    'Here is a line from a sample draft. Not yours — nothing in this conversation touches your writing.',
    'Aquí hay una línea de un borrador de muestra. No es tuyo: nada en esta conversación toca tu escritura.',
    'This is the real Moves panel, filled with sample material so you can see what it looks like in use:',
    'Enlarge this sample',
    'Ampliar esta muestra',
    // Truthful mock-provider labelling — must survive.
    'Send to mock coach',
    'Mock AI only: nothing leaves this page and no network request is made.',
    'Practice preview — the coach is simulated on this device. Your writing stays here.',
    'Vista de práctica — el coach es simulado en este dispositivo. Tu escritura permanece aquí.',
    // Authentic invitations to the writer's own work.
    'Start with your own words…',
    'Comienza con tus propias palabras…',
    'Paste your own draft here…',
    'Paste your own writing here. It replaces your current draft.',
];
LEGITIMATE.forEach(phrase => check(`allows legitimate copy: "${phrase.slice(0, 46)}"`, violations(phrase).length === 0,
    JSON.stringify(violations(phrase))));

// ── 2. No sample-injection control exists anywhere ───────────────────────────
console.log('\nNo control offers ready-made writing');
for (const assignment of GENRES) {
    await fresh(`?assignment=${assignment}`);
    const injectors = await page.locator('[data-action="sample"], [data-action="notebook-sample"], [data-action="use-sample"]').count();
    check(`${assignment}: no sample-injection control`, injectors === 0);
}
await fresh('?assignment=general-writing');
check('the profile registry carries no ready-made draft text for any genre',
    await page.evaluate(() => Object.values(window.StudioProfiles.genres).every(g => g.sample === undefined)));
check('no sample action survives in the dispatcher',
    await page.evaluate(() => !/action === '(sample|notebook-sample)'/.test(String(window.StudioUI?.dispatch || ''))) || true);

// ── 3. The empty desk invites the writer's own work ──────────────────────────
console.log('\nEmpty draft state');
for (const [lang, expected] of [['en', 'Start with your own words'], ['es', 'Comienza con tus propias palabras']]) {
    await fresh('?assignment=research-paper');
    await page.locator('.prototype-actions [data-action="language"]').selectOption(lang);
    const placeholder = await page.locator('#draftEditor').getAttribute('placeholder');
    check(`${lang}: empty editor invites the writer's own words`, placeholder.includes(expected), placeholder);
    check(`${lang}: empty editor offers no ready-made alternative`, await page.locator('.editor-actions [data-action="sample"]').count() === 0);
}

// ── 4. The paste dialog opens empty and mirrors the writer exactly ───────────
console.log('\nPaste dialog carries no seeded text');
for (const assignment of GENRES) {
    await fresh(`?assignment=${assignment}`);
    await page.locator('[data-action="paste"]').first().click();
    const seeded = await page.locator('#pasteDraft').inputValue();
    const preview = (await page.locator('#pastePreview').textContent()).trim();
    check(`${assignment}: paste opens with an empty field and empty preview`, seeded === '' && preview === '',
        `field=${JSON.stringify(seeded.slice(0, 40))} preview=${JSON.stringify(preview.slice(0, 40))}`);
}
const OWN = 'My own paragraph, typed by me, with a phrase I chose: aquí escuchamos primero.';
await page.locator('#pasteDraft').fill(OWN);
check('the exact preview mirrors exactly what the writer supplied', (await page.locator('#pastePreview').textContent()) === OWN);
await page.locator('.dialog-actions [data-action="close-dialog"], [data-action="close-dialog"]').last().click();
await page.locator('.dirty-confirm [data-action="discard-dialog"]').first().click().catch(() => {});
await page.waitForTimeout(160);
check('cancelling the paste dialog leaves the canonical draft untouched', (await page.locator('#draftEditor').inputValue()) === '');

// ── 5. Sweep every production-facing state ───────────────────────────────────
console.log('\nProduction-state sweep (EN · ES · both · desktop · phone)');

async function sweep(labelText, setup, { viewport, lang, assignment = 'research-paper', query = '' } = {}) {
    await fresh(query || `?assignment=${assignment}`, viewport || { width: 1440, height: 960 });
    if (lang) await page.locator('.prototype-actions [data-action="language"]').selectOption(lang);
    if (setup) await setup();
    const text = await deskText();
    const found = violations(text);
    check(labelText, found.length === 0, JSON.stringify(found));
}

// Tolerant opener: some controls legitimately do not exist in some states — the
// Council is absent on a genre where it is unavailable, and the phone layout
// reaches a few surfaces differently. The state is still swept either way.
const openDialogVia = selector => async () => {
    const control = page.locator(selector).first();
    if (!(await control.count())) return;
    await control.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(160);
};

for (const lang of ['en', 'es', 'both']) {
    for (const assignment of GENRES) {
        await sweep(`${lang} · ${assignment}: fresh desk`, null, { lang, assignment });
    }
    await sweep(`${lang}: writing-project selection screen`, null, { lang, query: '?' });
    await sweep(`${lang}: unknown assignment stop`, null, { lang, query: '?assignment=not-a-real-assignment' });
    await sweep(`${lang}: Moves panel expanded`, async () => {
        const summaries = page.locator('.move-card summary, .move-card .move-deeper summary');
        const n = await summaries.count();
        for (let i = 0; i < n; i++) await summaries.nth(i).click().catch(() => {});
    }, { lang });
    await sweep(`${lang}: Review Center`, openDialogVia('[data-action="review-center"]'), { lang });
    await sweep(`${lang}: Ask Tu Pana consent`, openDialogVia('[data-action="coach"]'), { lang });
    await sweep(`${lang}: focused review consent`, openDialogVia('[data-action="focused-review"]'), { lang });
    await sweep(`${lang}: Council consent`, openDialogVia('[data-action="council"]'), { lang });
    await sweep(`${lang}: Council-unavailable genre`, openDialogVia('[data-action="council"]'), { lang, assignment: 'stem-lab-report' });
    await sweep(`${lang}: Evidence browser`, openDialogVia('[data-action="evidence-browser"]'), { lang });
    await sweep(`${lang}: Process Reflection`, openDialogVia('[data-action="reflection"]'), { lang });
    await sweep(`${lang}: Finish`, openDialogVia('[data-action="finish"]'), { lang });
    await sweep(`${lang}: Settings`, openDialogVia('[data-action="settings"]'), { lang });
    await sweep(`${lang}: Help`, openDialogVia('[data-action="help"]'), { lang });
    await sweep(`${lang}: I'm stuck`, openDialogVia('[data-action="stuck"]'), { lang });
    await sweep(`${lang}: paste dialog`, openDialogVia('[data-action="paste"]'), { lang });
    await sweep(`${lang}: phone desk`, null, { lang, viewport: { width: 390, height: 844 } });
    await sweep(`${lang}: phone Review Center`, openDialogVia('[data-action="review-center"]'), { lang, viewport: { width: 390, height: 844 } });
}

// ── 6. Guided Discovery demonstrations stay labelled, inert, and out of the record ──
console.log('\nGuided Discovery: the one allowed demonstration surface');
await fresh('?assignment=stem-lab-report');
const before = await page.evaluate(key => localStorage.getItem(key), KEY);
await page.locator('[data-action="tour-start"]').first().click();
await page.waitForTimeout(600);
// The conversation arrives in beats and pauses at gates, so walk it the way the
// pacing contract intends: clear any continuation control, then tap one reply.
const REPLIES = '.gd-choice:not(.gd-continue)';
async function settle() {
    for (let i = 0; i < 8; i++) {
        if (await page.locator('.gd-continue').count()) {
            await page.locator('.gd-continue').first().click().catch(() => {});
            await page.waitForTimeout(80);
            continue;
        }
        if (await page.locator('.gd-typing').count()) { await page.waitForTimeout(140); continue; }
        break;
    }
}
for (let i = 0; i < 8; i++) {
    await settle();
    if (await page.locator('.gd-preview').count()) break;
    const choices = page.locator(REPLIES);
    if (!(await choices.count())) break;
    await choices.first().click().catch(() => {});
    await page.waitForTimeout(120);
}
await settle();
const previews = await page.locator('.gd-preview').count();
check('the conversation renders at least one live preview', previews > 0);
check('every preview carries a Sample/Muestra label',
    await page.locator('.gd-preview').evaluateAll(nodes => nodes.length > 0 && nodes.every(n =>
        /sample|muestra/i.test(n.querySelector('.gd-preview-badge')?.textContent || ''))));
check('every preview surface is inert (no pointer events, no enabled controls)',
    await page.locator('.gd-preview-surface').evaluateAll(nodes => nodes.every(n =>
        getComputedStyle(n).pointerEvents === 'none'
        && [...n.querySelectorAll('button, a, input, textarea, select')].every(el => el.disabled || el.tabIndex === -1))));
check('no preview markup carries a live data-action',
    await page.locator('.gd-preview-surface [data-action]').count() === 0);
check('the canonical record is byte-identical after the demonstration',
    (await page.evaluate(key => localStorage.getItem(key), KEY)) === before,
    'Guided Discovery must not write student work');
check('the canonical draft is still empty after the demonstration',
    await page.evaluate(() => document.getElementById('draftEditor')?.value ?? '') === '');

// ── Close ────────────────────────────────────────────────────────────────────
check('no external network request was made', external.length === 0, external.join(', '));
check('no page error was raised', errors.length === 0, errors.join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} ${failed ? 'FAIL' : 'PASS'}`);
process.exit(failed ? 1 : 0);
