// Writing Studio — Reading Response / Reading Reflection family.
//
// One shared pedagogical family, two declared configurations: an undergraduate
// short response and a graduate extended response. This suite proves the family
// is configured rather than duplicated, that each configuration is genuinely
// distinct (not an inflated version of the other), that the source-integrity
// contract travels with every request, and that nothing leaks in from or out to
// another genre.
//
// Model behaviour is not asserted here — it cannot be, deterministically. What
// is asserted is the contract this codebase controls: which rules are placed in
// the transmitted prompt, what the student is shown before transmission, and
// what is written to the record.
//
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const BASE = `${ORIGIN}/studio.html`;
const KEY = 'tupana-studio:v1';
const UG = 'reading-response-undergraduate';
const GRAD = 'reading-response-graduate';
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
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);

// Records every prompt the interface hands to a provider, so the transmitted
// contract can be inspected without any network call.
async function capturePrompts() {
    await page.evaluate(() => {
        window.__prompts = [];
        const realActive = window.StudioProvider.active;
        window.StudioProvider.active = function () {
            const provider = realActive.apply(this, arguments);
            const realCall = provider.call.bind(provider);
            provider.call = args => { window.__prompts.push({ requestKind: args.requestKind, prompt: args.prompt }); return realCall(args); };
            return provider;
        };
    });
}
const prompts = () => page.evaluate(() => window.__prompts || []);

const UG_DRAFT = 'In the assigned chapter the author claims that access improved after the policy took effect. On my own campus the same policy arrived and the line at the financial aid office got longer, which makes me doubt that access and availability mean the same thing here. The chapter treats them as interchangeable and that is the assumption I want to question.';
const GRAD_DRAFT = 'Read alongside the earlier chapter, the argument depends on treating participation as an outcome rather than a process. That move is what makes the concluding claim available, and it is also what I want to contest. If participation is a process, the evidence assembled here measures its residue rather than its occurrence, and the methodological consequence is that the study cannot distinguish sustained involvement from a single documented encounter.';

async function fillDraft(text) {
    await page.locator('#draftEditor').fill(text);
    await page.waitForTimeout(320);
}
// A completed request leaves its result dialog open; clear it before the next.
async function closeDialogs() {
    for (let i = 0; i < 4; i++) {
        if (!(await page.locator('#dialogRoot .overlay').count())) return;
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
    }
}

// ── 1. One family, two declared configurations ───────────────────────────────
console.log('\n1. Family structure — configured, not duplicated');
await fresh(`?assignment=${UG}`);
const registry = await page.evaluate(() => {
    const P = window.StudioProfiles;
    const shape = id => ({
        exists: Boolean(P.genres[id]),
        moveIds: (P.integratedMoveProfiles[id] || []).map(m => m.id),
        criticalKeys: Object.fromEntries((P.integratedMoveProfiles[id] || []).map(m => [m.id, m.criticalKey])),
        councilEnabled: P.councilConfig[id]?.enabled,
        hasDisabledReason: Boolean(P.councilConfig[id]?.disabledReason),
        coachRules: P.genres[id]?.coachRules || '',
        referenceNotes: (P.genres[id]?.referenceNotes || []).length,
        lenses: P.genres[id]?.moves?.review || [],
        lensesEs: P.genreMovesEs[id]?.review || [],
        deeperIds: Object.keys(P.moveDeeper[id] || {}),
        stuck: Boolean(P.stuckStarters[id]),
        reflect4: Boolean(P.reflectionPrompt4[id]),
        lensKeys: P.lensCriticalKeys[id] || [],
    });
    return { ug: shape('readingUg'), grad: shape('readingGrad') };
});
check('both configurations are registered', registry.ug.exists && registry.grad.exists);
const shared = registry.ug.moveIds.filter(id => registry.grad.moveIds.includes(id));
check('the two configurations share Move ids from one authoring source', shared.length >= 2, JSON.stringify(shared));
check('shared Moves keep one critical-question mapping across levels',
    shared.every(id => registry.ug.criticalKeys[id] === registry.grad.criticalKeys[id]));
check('undergraduate declares the summary-vs-response Move', registry.ug.moveIds.includes('beyond-summary'));
check('graduate does NOT inherit the undergraduate summary Move', !registry.grad.moveIds.includes('beyond-summary'));
check('graduate adds counterinterpretation as a Move of its own', registry.grad.moveIds.includes('counterinterpretation'));
check('graduate adds disciplinary and methodological stakes', registry.grad.moveIds.includes('disciplinary-stakes'));
check('graduate is not an inflated undergraduate scaffold (different Move sets)',
    JSON.stringify(registry.ug.moveIds) !== JSON.stringify(registry.grad.moveIds));
check('the visible Move set stays small at both levels',
    registry.ug.moveIds.length <= 5 && registry.grad.moveIds.length <= 5,
    `${registry.ug.moveIds.length} / ${registry.grad.moveIds.length}`);
check('every Move carries deeper progressive-disclosure guidance at both levels',
    registry.ug.deeperIds.length === registry.ug.moveIds.length && registry.grad.deeperIds.length === registry.grad.moveIds.length);
check('each level has three review lenses in both languages',
    registry.ug.lenses.length === 3 && registry.ug.lensesEs.length === 3
    && registry.grad.lenses.length === 3 && registry.grad.lensesEs.length === 3);
check('review lenses differ by level', JSON.stringify(registry.ug.lenses) !== JSON.stringify(registry.grad.lenses));
check('each level maps a critical question to each lens', registry.ug.lensKeys.length === 3 && registry.grad.lensKeys.length === 3);
check('each level ships an "I\'m stuck" starter and an optional fourth reflection prompt',
    registry.ug.stuck && registry.ug.reflect4 && registry.grad.stuck && registry.grad.reflect4);
check('each level ships reference notes', registry.ug.referenceNotes >= 2 && registry.grad.referenceNotes >= 2);

// ── 2. Council decision: disabled, and truthful about why ────────────────────
console.log('\n2. Council decision');
check('the Reading Response Council is NOT enabled at either level',
    registry.ug.councilEnabled !== true && registry.grad.councilEnabled !== true);
check('the unavailability is explained in the profile\'s own words',
    registry.ug.hasDisabledReason && registry.grad.hasDisabledReason);
for (const [assignment, name] of [[UG, 'undergraduate'], [GRAD, 'graduate']]) {
    await fresh(`?assignment=${assignment}`);
    const unavailable = page.locator('.support-action.unavailable');
    check(`${name}: the Council is shown as unavailable, not offered`, await unavailable.count() === 1
        && await page.locator('[data-action="council"]').count() === 0);
    const text = await unavailable.textContent();
    check(`${name}: the reason is specific to reading responses and points to what does work`,
        /reading response/i.test(text) && /Focused review|Ask Tu Pana/i.test(text), text.slice(0, 90));
    check(`${name}: focused review and Ask Tu Pana remain operational`,
        await page.locator('[data-action="focused-review"]').count() > 0 && await page.locator('[data-action="coach"]').count() > 0);
}

// ── 3. Routing — explicit levels resolve, ambiguity fails closed ─────────────
console.log('\n3. Assignment routing');
const routing = await page.evaluate(() => {
    const r = window.StudioProfiles.resolveAssignment;
    return {
        ug: r('reading-response-undergraduate')?.profileId,
        ugAlt: r('reading-reflection-undergraduate')?.profileId,
        grad: r('reading-response-graduate')?.profileId,
        gradAlt: r('reading-reflection-graduate')?.profileId,
        bare: r('reading-response'),
        bareReflection: r('reading-reflection'),
        nonsense: r('reading-response-phd-seminar'),
    };
});
check('undergraduate links resolve to the undergraduate configuration', routing.ug === 'readingUg' && routing.ugAlt === 'readingUg');
check('graduate links resolve to the graduate configuration', routing.grad === 'readingGrad' && routing.gradAlt === 'readingGrad');
check('a bare, level-ambiguous link resolves to nothing rather than guessing a level',
    routing.bare === null && routing.bareReflection === null);
check('an unrecognised reading-response variant resolves to nothing', routing.nonsense === null);
await fresh('?assignment=reading-response');
check('the ambiguous link reaches the configuration-required stop, inheriting no genre',
    /CONFIGURATION REQUIRED|CONFIGURACIÓN/i.test(await page.locator('#prototypeRoot').innerText()));
check('the stop offers recovery to the selection screen listing both levels',
    (await page.locator('#prototypeRoot').innerText()).includes('Undergraduate Reading Response')
    && (await page.locator('#prototypeRoot').innerText()).includes('Graduate Extended Reading Response'));

// ── 4. Genre surfaces, both levels, three language modes ─────────────────────
console.log('\n4. Genre surfaces (EN · ES · both)');
const EXPECT = {
    [UG]: { header: { en: 'Reading Response', es: 'Respuesta de lectura' }, firstMove: { en: 'Name the text and what you are answering', es: 'Nombra el texto y a qué respondes' }, length: /250/ },
    [GRAD]: { header: { en: 'Seminar Response', es: 'Respuesta de seminario' }, firstMove: { en: 'Frame the text and the problem you are entering', es: 'Enmarca el texto y el problema en el que entras' }, length: /1,000|1000/ },
};
for (const assignment of [UG, GRAD]) {
    for (const lang of ['en', 'es', 'both']) {
        await fresh(`?assignment=${assignment}`);
        await page.locator('.prototype-actions [data-action="language"]').selectOption(lang);
        const moveLabels = await page.locator('.integrated-move strong').allTextContents();
        const want = lang === 'es' ? EXPECT[assignment].firstMove.es : EXPECT[assignment].firstMove.en;
        check(`${assignment} · ${lang}: Moves render in the chosen language`, moveLabels[0]?.includes(want) || (lang === 'both' && moveLabels[0]?.length > 0), moveLabels[0]);
        const refs = await page.locator('.genre-reference summary').allTextContents();
        check(`${assignment} · ${lang}: reference notes are present and closed by default`, refs.length >= 2
            && await page.locator('.genre-reference[open]').count() === 0);
        await page.locator('.genre-reference').first().locator('summary').click();
        const lengthNote = await page.locator('.genre-reference').first().textContent();
        check(`${assignment} · ${lang}: length guidance is stated as guidance and defers to the instructor`,
            EXPECT[assignment].length.test(lengthNote) && /instructor|instructor’s|instructor\/a/i.test(lengthNote), lengthNote.slice(0, 80));
        const sourceNote = await page.locator('.genre-reference').nth(1).textContent();
        check(`${assignment} · ${lang}: the reading boundary is stated to the student up front`,
            /has not read|no ha leído/i.test(sourceNote));
    }
}

// ── 5. Source integrity travels with every transmitted request ───────────────
console.log('\n5. Source-integrity contract in the transmitted prompt');
const REQUIRED_RULES = [
    /have NOT read the assigned text/i,
    /Never invent, complete, correct, or supply a quotation, page number/i,
    /never state or imply that you have read the assigned text/i,
    /Preserve the student's quoted material exactly/i,
    /never by producing a paraphrase for them/i,
    /Never ask the student to paste or upload an entire copyrighted reading/i,
    /Summary is not automatically an error/i,
    /Never require them, and never treat their absence as a deficiency/i,
];
for (const [assignment, draft, name] of [[UG, UG_DRAFT, 'undergraduate'], [GRAD, GRAD_DRAFT, 'graduate']]) {
    await fresh(`?assignment=${assignment}`);
    await capturePrompts();
    await fillDraft(draft);
    // Passage-scope coach request.
    await page.locator('[data-action="coach"]').first().click();
    await page.waitForTimeout(150);
    const previewText = (await page.locator('#scopePreview').textContent()).trim();
    check(`${name}: the exact preview shows the writing that will be sent, before consent`, draft.includes(previewText.slice(0, 60)) && previewText.length > 0);
    check(`${name}: the send control is disabled until consent is given`,
        await page.locator('[data-action="submit-mock"]').isDisabled());
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.waitForTimeout(800);
    await closeDialogs();
    // Full-draft focused review.
    await page.locator('[data-action="focused-review"]').first().click();
    await page.waitForTimeout(150);
    await page.locator('input[name="reviewScope"][value="full"]').check().catch(() => {});
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.waitForTimeout(800);
    await closeDialogs();
    const sent = await prompts();
    check(`${name}: both a passage request and a full-draft request were built`, sent.length >= 2, JSON.stringify(sent.map(s => s.requestKind)));
    for (const [i, rule] of REQUIRED_RULES.entries()) {
        check(`${name}: rule ${i + 1} reaches every request`, sent.length > 0 && sent.every(s => rule.test(s.prompt)));
    }
    const levelRule = name === 'undergraduate' ? /undergraduate short reading response/i : /graduate extended reading response/i;
    const wrongLevel = name === 'undergraduate' ? /graduate extended reading response/i : /undergraduate short reading response/i;
    check(`${name}: the level-specific rule is present`, sent.every(s => levelRule.test(s.prompt)));
    check(`${name}: the other level's rule is absent`, sent.every(s => !wrongLevel.test(s.prompt)));
    check(`${name}: genre guidance is marked additive and cannot relax the rules above it`,
        sent.every(s => /does NOT relax any rule above/i.test(s.prompt)));
    check(`${name}: the absolute authorship rule is still first`,
        sent.every(s => s.prompt.indexOf('ABSOLUTE AUTHORSHIP RULE') === 0));
}

// ── 6. Adversarial cases ─────────────────────────────────────────────────────
console.log('\n6. Adversarial cases');

// Partial source material: the student sends a passage only.
await fresh(`?assignment=${UG}`);
await capturePrompts();
await fillDraft('The author writes that "participation rose sharply" but I only have this one line from the handout, not the whole chapter.');
await page.locator('[data-action="coach"]').first().click();
await page.waitForTimeout(150);
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(800);
await closeDialogs();
let sent = await prompts();
check('partial source material: the prompt requires saying what cannot be checked',
    sent.every(s => /say plainly which things cannot be checked/i.test(s.prompt)));
check('partial source material: only the consented text is transmitted',
    sent.every(s => !s.prompt.includes('participation rose sharply') || s.prompt.includes('The author writes')));

// A request to invent a citation is transmitted as the student's own words, with
// the prohibition attached — the interface never rewrites the student's question.
await fresh(`?assignment=${GRAD}`);
await capturePrompts();
await fillDraft(GRAD_DRAFT);
await page.locator('[data-action="coach"]').first().click();
await page.waitForTimeout(150);
const ASK_TO_INVENT = 'Give me the page number and an exact quotation from the chapter that proves my point.';
await page.locator('#coachQuestion, textarea[data-coach-question]').first().fill(ASK_TO_INVENT).catch(() => {});
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(800);
await closeDialogs();
sent = await prompts();
check('a request to invent a citation still carries the never-invent prohibition',
    sent.every(s => /Never invent, complete, correct, or supply a quotation, page number/i.test(s.prompt)));

// Cross-genre leakage, in both directions.
console.log('\n   cross-genre leakage');
const LEAK = {
    autobiographical: /code-meshing|memory and a boundary|larger force/i,
    // "admission" in its ordinary English sense is not admissions-genre
    // language; match the genre, not the word.
    admissions: /college admission|admissions (essay|officer|reader|language)|personal statement/i,
    cap200: /CBO|logged hours|service-learning/i,
    stem: /lab report|hypothesis|seedling/i,
    research: /search plan|source evaluation/i,
};
for (const assignment of [UG, GRAD]) {
    await fresh(`?assignment=${assignment}`);
    // The header's writing-project switcher legitimately names every genre;
    // leakage means another genre's PEDAGOGY on this desk, not its presence in
    // the project chooser.
    const surface = await page.evaluate(() => {
        const clone = document.getElementById('prototypeRoot').cloneNode(true);
        clone.querySelectorAll('.genre-select-wrap, select[data-action="genre"], .mobile-project-chip').forEach(n => n.remove());
        return clone.innerText;
    });
    for (const [other, pattern] of Object.entries(LEAK)) {
        check(`${assignment}: no ${other} language on the reading-response desk`, !pattern.test(surface),
            (surface.match(pattern) || [''])[0]);
    }
}
await fresh('?assignment=research-paper');
check('the research paper desk did not inherit reading-response Moves',
    !/Stake an interpretive position|Hold the passage exactly/i.test(await page.locator('#prototypeRoot').innerText()));
await fresh('?assignment=research-paper');
await capturePrompts();
await fillDraft('Community gardens are described as a solution, but my two sources disagree about what counts as a benefit.');
await page.locator('[data-action="coach"]').first().click();
await page.waitForTimeout(150);
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(800);
await closeDialogs();
sent = await prompts();
check('another genre\'s request does not carry the reading-response rules',
    sent.every(s => !/have NOT read the assigned text/i.test(s.prompt)));

// ── 7. The canonical record is untouched by any of this ──────────────────────
console.log('\n7. Record integrity, persistence, and closure');
await fresh(`?assignment=${UG}`);
await fillDraft(UG_DRAFT);
const afterTyping = await stored();
check('the draft is stored exactly as typed', afterTyping.draft === UG_DRAFT);
check('the resolved assignment is remembered in the one record', afterTyping.assignmentId === UG || afterTyping.genre === 'readingUg');

// Voice Vault
await page.evaluate(() => {
    const editor = document.getElementById('draftEditor');
    editor.focus();
    const start = editor.value.indexOf('access and availability');
    editor.setSelectionRange(start, start + 'access and availability mean the same thing here'.length);
    document.dispatchEvent(new Event('selectionchange'));
});
await page.waitForTimeout(320);
const voiceBtn = page.locator('[data-action="protect-phrase"]').first();
if (await voiceBtn.count()) {
    await voiceBtn.click();
    await page.waitForTimeout(240);
    const rec = await stored();
    check('a kept passage is stored as the exact selected text', (rec.voiceEntries || []).some(v => v.text.includes('access and availability')));
} else {
    check('a kept passage is stored as the exact selected text', false, 'Your Voice control not found');
}

// Language switching must not touch bytes.
await page.locator('.prototype-actions [data-action="language"]').selectOption('es');
await page.locator('.prototype-actions [data-action="language"]').selectOption('both');
check('the draft survives language switching byte-for-byte', await page.locator('#draftEditor').inputValue() === UG_DRAFT);

// Export / backup
await page.locator('[data-action="settings"]').first().click();
await page.waitForTimeout(160);
const settingsText = await page.locator('.dialog').innerText();
check('export and deletion remain available for this genre', /Export|Exportar/i.test(settingsText));
await closeDialogs();

// Process Reflection and Finish are destinations, not dialogs.
await page.locator('[data-action="reflection"]').first().click();
await page.waitForTimeout(300);
const reflectionText = await page.locator('#prototypeRoot').innerText();
check('the optional fourth reflection prompt is genre-specific', /confirm|complic|teóric|theoretical|compromisos/i.test(reflectionText));
await closeDialogs();
await page.locator('[data-action="finish"]').first().click();
await page.waitForTimeout(300);
const finishText = await page.locator('#prototypeRoot').innerText();
check('Finish states the Council was not used, without implying the student skipped a step',
    /No Council|Consejo/i.test(finishText) && !/incomplete|incompleto|missing step/i.test(finishText), finishText.slice(0, 120));
await closeDialogs();

// Consent cancellation — from a fresh desk, since Finish is a destination away
// from the draft and its controls.
await fresh(`?assignment=${UG}`);
await fillDraft(UG_DRAFT);
await page.locator('[data-action="coach"]').first().click();
await page.waitForTimeout(150);
const beforeCancel = await stored();
await closeDialogs();
await page.waitForTimeout(200);
check('cancelling consent transmits nothing and records nothing',
    JSON.stringify(await stored()) === JSON.stringify(beforeCancel));

// Provider failure
await fresh(`?assignment=${GRAD}&mockfail=service_unavailable`);
await fillDraft(GRAD_DRAFT);
const beforeFail = await stored();
await page.locator('[data-action="coach"]').first().click();
await page.waitForTimeout(150);
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(900);
// The failure is announced assertively rather than shown as a result.
const failText = (await page.locator('[role="alert"]').allTextContents()).join(' ');
check('a provider failure is announced truthfully', /unavailable|no está disponible/i.test(failText), failText.slice(0, 100));
check('a provider failure says the draft is unchanged and nothing was saved',
    /draft is unchanged|nothing from this request was saved|borrador no cambió|nada se guardó/i.test(failText));
check('a provider failure leaves the draft and the record untouched',
    (await stored()).draft === beforeFail.draft && ((await stored()).reviews || []).length === ((beforeFail.reviews) || []).length);

// ── 8. Access: keyboard, phone, reduced motion ───────────────────────────────
console.log('\n8. Access on the changed surfaces');
await fresh(`?assignment=${GRAD}`, { width: 390, height: 844 });
check('phone: every Move card renders', await page.locator('.integrated-move').count() === 5);
check('phone: reference notes are reachable', await page.locator('.genre-reference').count() >= 2);
check('phone: no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
await page.locator('.genre-reference').first().locator('summary').focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(120);
check('phone: a reference note opens from the keyboard', await page.locator('.genre-reference[open]').count() === 1);
await fresh(`?assignment=${UG}`);
check('desktop: every Move carries a "why this may help" disclosure',
    await page.locator('.integrated-move > details:not(.move-example)').count() === 4);
check('desktop: every disclosure on the Moves rail is closed by default',
    await page.locator('.integrated-move details[open]').count() === 0
    && await page.locator('.integrated-move details summary').count() >= 4);
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.reload();
await page.waitForTimeout(200);
check('reduced motion: the desk still renders every Move', await page.locator('.integrated-move').count() === 4);

// ── Close ────────────────────────────────────────────────────────────────────
check('no external network request was made', external.length === 0, external.join(', '));
check('no page error was raised', errors.length === 0, errors.join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} ${failed ? 'FAIL' : 'PASS'}`);
process.exit(failed ? 1 : 0);
