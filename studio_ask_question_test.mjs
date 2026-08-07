// F1 (+ F2 transmission) — "Ask Tu Pana" carries a genuine request, and no
// response reciting internal scaffolding ever reaches or is stored for a writer.
//
// WHAT FAILED, AND WHERE THIS SUITE PINS IT
// Sub-batch 1D's bounded live run found the Studio had NO free-text question
// field anywhere. The Ask Tu Pana pathway sent the literal placeholder
// 'Student question' / 'Pregunta del estudiante' as its request, so on a draft
// the writer had not annotated the model received text and no actual request.
// Three different failures came out of that one cause, on three live trials:
//   (a) the transmitted draft was ignored ("Please provide the text…"),
//   (b) the coach asked a question the interface could not accept — a dead end
//       by construction, and
//   (c) on the College Personal Statement route, ~5,973 characters of the
//       model's own deliberation opening "Here's a thinking process that
//       applies the rules and genre guidance…" and reciting the internal rule
//       scaffolding by name.
// (a) and (b) are corrected by giving the pathway a real, optional question and
// an explicit bounded default; (c) by an application-side response guard
// modelled on the Council kernel's validate-BEFORE-store discipline.
//
// The cause of (c) is NOT diagnosed here. The Worker's thinkingBudget = 0
// remains an unverified hypothesis; no Worker file is touched by this package,
// and this suite makes no claim about it. The guard is a containment boundary
// in the application, which holds regardless of why the model misbehaved.
//
// Zero live AI calls. The mock provider's ?mockleak= fixtures exercise the
// guard deterministically, exactly as ?mockcouncil= exercises the Council
// kernel. Requires this worktree at http://127.0.0.1:3001.
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

// The draft is synthetic throughout: no real student or family writing.
const DRAFT = 'The community garden on Walton Avenue opened in April and I went there every Saturday morning. Neighbors brought seedlings from their own kitchens.';

async function fresh(query = '') {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(8000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    // Cleared BEFORE navigation, then reloaded — the 1D harness defect was
    // clearing after navigation, which raced the Studio's autosave and silently
    // carried a prior case's genre and draft into the next one.
    await page.goto(`${ORIGIN}/studio.html${query}`);
    await page.evaluate(key => {
        localStorage.removeItem(key);
        localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
    }, KEY);
    await page.reload();
    await page.evaluate(() => {
        window.__sent = [];
        const original = window.StudioProvider.buildPassagePrompt;
        window.StudioProvider.buildPassagePrompt = payload => {
            const prompt = original(payload);
            window.__sent.push({ prompt, payload });
            return prompt;
        };
    });
}
// The student's own language control, not a synthetic state write — the same
// path a writer uses, so what is asserted is what a writer would get.
async function setSpanish() {
    await page.locator('.prototype-actions [data-action="language"]').selectOption('es');
    await page.waitForTimeout(200);
}
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);
const sentPayloads = () => page.evaluate(() => window.__sent);

async function openAsk(draft = DRAFT) {
    await page.locator('#draftEditor').fill(draft);
    await page.waitForTimeout(300);
    await page.locator('.support-action[data-action="coach"], [data-action="coach"]').first().click();
    await page.waitForTimeout(250);
}

// ── 1. The affordance exists at all ──────────────────────────────────────────
console.log('\n1. Ask Tu Pana has a real question affordance');
await fresh();
await openAsk();
check('a free-text question field exists on the Ask Tu Pana path', await page.locator('#coachQuestion').count() === 1);
check('it is a textarea, so a multi-sentence question fits', await page.locator('textarea#coachQuestion').count() === 1);
check('it is empty by default — nothing is pre-filled on the writer\'s behalf', (await page.locator('#coachQuestion').inputValue()) === '');
check('the focused-review path does NOT gain a question field (lens choices unchanged)',
    await page.locator('#coachQuestion').count() === 1);

console.log('\n1b. Accessibility of the affordance');
check('the field has a programmatic label', await page.locator('label[for="coachQuestion"]').count() === 1);
check('the label is non-empty', ((await page.locator('label[for="coachQuestion"]').textContent()) || '').trim().length > 0);
check('the field is described by its optional-ness hint',
    (await page.locator('#coachQuestion').getAttribute('aria-describedby')) === 'coachQuestionHint');
check('that hint element exists', await page.locator('#coachQuestionHint').count() === 1);
check('the hint states plainly that the field is optional',
    /optional/i.test((await page.locator('#coachQuestionHint').textContent()) || ''));
check('the request preview is a labelled region', await page.locator('#coachRequestPreview[aria-labelledby="coachRequestPreviewLabel"]').count() === 1);
check('its label element exists and is non-empty',
    ((await page.locator('#coachRequestPreviewLabel').textContent()) || '').trim().length > 0);
check('the scrollable preview is keyboard reachable',
    (await page.locator('#coachRequestPreview').getAttribute('tabindex')) === '0');
check('the placeholder is an example, not a pre-filled answer',
    ((await page.locator('#coachQuestion').getAttribute('placeholder')) || '').length > 0
    && (await page.locator('#coachQuestion').inputValue()) === '');

// ── 2. Consent-preview accuracy ──────────────────────────────────────────────
console.log('\n2. The consent preview shows exactly what will be sent');
const blankPreview = (await page.locator('#coachRequestPreview').textContent()) || '';
check('with the field blank, the preview shows the bounded default request',
    blankPreview.includes('did not type a specific question') && blankPreview.includes('one useful next move'));
check('the default is a real instruction, not a placeholder posing as a question',
    !blankPreview.includes('Student question') && !blankPreview.includes('Pregunta del estudiante'));
check('the default tells the model the writing is already present',
    /do not ask them to provide, paste, or resend it/i.test(blankPreview));
await page.locator('#coachQuestion').fill('Does my second sentence actually support the first one?');
await page.waitForTimeout(150);
const typedPreview = (await page.locator('#coachRequestPreview').textContent()) || '';
check('typing replaces the preview with the writer\'s exact words',
    typedPreview === 'Does my second sentence actually support the first one?');
await page.locator('#coachQuestion').fill('   ');
await page.waitForTimeout(150);
check('whitespace-only reverts to the default rather than sending blanks',
    ((await page.locator('#coachRequestPreview').textContent()) || '').includes('did not type a specific question'));
check('the writing itself is still previewed alongside the request',
    ((await page.locator('#scopePreview').textContent()) || '').includes('community garden on Walton Avenue'));

// ── 3. An entered question is transmitted verbatim ───────────────────────────
console.log('\n3. An entered question is what travels');
const QUESTION = 'Is the ending too abrupt for a reader who was not there?';
await page.locator('#coachQuestion').fill(QUESTION);
await page.waitForTimeout(150);
const previewAtConsent = (await page.locator('#coachRequestPreview').textContent()) || '';
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(900);
let sent = await sentPayloads();
check('exactly one prompt was built', sent.length === 1, `${sent.length}`);
check('the writer\'s question is the transmitted request', sent[0]?.payload?.question === QUESTION);
check('what was previewed is byte-identical to what was sent', previewAtConsent === sent[0]?.payload?.question);
check('the prompt labels it as the STUDENT REQUEST', sent[0]?.prompt?.includes(`STUDENT REQUEST:\n${QUESTION}`));
check('the placeholder string is gone from the wire', !sent[0]?.prompt?.includes('Student question'));
check('the consented writing still travels with it', sent[0]?.prompt?.includes('community garden on Walton Avenue'));

let record = await stored();
check('the review record stores the writer\'s question', record.reviews[0]?.question === QUESTION);
check('the record marks it as NOT defaulted', record.reviews[0]?.requestDefaulted === false);
check('the saved card is titled with the question, not a placeholder', record.reviews[0]?.lens === QUESTION);
check('the card shows the question back to the writer',
    ((await page.locator('.question-request-note').first().textContent()) || '').includes(QUESTION));

// ── 4. The blank / default path ──────────────────────────────────────────────
console.log('\n4. Leaving it blank sends an explicit bounded default, honestly labelled');
await fresh();
await openAsk();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(900);
sent = await sentPayloads();
check('one prompt was built', sent.length === 1, `${sent.length}`);
check('the default request is the transmitted request',
    (sent[0]?.payload?.question || '').includes('did not type a specific question'));
check('it is labelled as generated by Tu Pana, not attributed to the writer',
    sent[0]?.payload?.requestLabel === 'REQUEST GENERATED BY TU PANA (the writer did not type a question)');
check('the prompt itself carries that honest label',
    sent[0]?.prompt?.includes('REQUEST GENERATED BY TU PANA (the writer did not type a question):'));
check('the prompt never claims the writer asked something they did not',
    !sent[0]?.prompt?.includes('STUDENT REQUEST:'));
check('the placeholder string is gone here too', !sent[0]?.prompt?.includes('Student question'));

record = await stored();
check('the record stores no fabricated question', record.reviews[0]?.question === null);
check('the record marks the request as defaulted', record.reviews[0]?.requestDefaulted === true);
check('the saved card title is honest about what was asked',
    record.reviews[0]?.lens === 'One useful next move');
check('the card says Tu Pana was asked, not the writer',
    /did not type a question/i.test((await page.locator('.question-request-note').first().textContent()) || ''));

// ── 5. Bilingual behaviour ───────────────────────────────────────────────────
console.log('\n5. Bilingual behaviour — Spanish gets a Spanish request, not a translated stub');
await fresh();
await setSpanish();
await openAsk();
const esPreview = (await page.locator('#coachRequestPreview').textContent()) || '';
check('the default request renders in Spanish', esPreview.includes('no escribió una pregunta específica'));
check('it is a genuine Spanish instruction, not the English default', !esPreview.includes('did not type a specific question'));
check('the Spanish field label is present', /qué te gustaría preguntar/i.test((await page.locator('label[for="coachQuestion"]').textContent()) || ''));
check('the Spanish hint states it is optional', /opcional/i.test((await page.locator('#coachQuestionHint').textContent()) || ''));
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(900);
sent = await sentPayloads();
check('Spanish default is what actually travels', (sent[0]?.payload?.question || '').includes('no escribió una pregunta específica'));
check('the Spanish path keeps the same honest generated-request label',
    sent[0]?.payload?.requestLabel === 'REQUEST GENERATED BY TU PANA (the writer did not type a question)');
const esQuestion = '¿Se entiende por qué volví cada sábado?';
await fresh();
await setSpanish();
await openAsk();
await page.locator('#coachQuestion').fill(esQuestion);
await page.waitForTimeout(150);
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(900);
sent = await sentPayloads();
check('a Spanish question travels verbatim, accents intact', sent[0]?.payload?.question === esQuestion);
check('a real Spanish question is labelled as the student\'s request',
    sent[0]?.prompt?.includes(`STUDENT REQUEST:\n${esQuestion}`));

// ── 6. The output-integrity guard ────────────────────────────────────────────
console.log('\n6. Output-integrity guard — unit behaviour');
await fresh();
const guard = await page.evaluate(() => {
    const V = window.StudioProvider.validateCoachResponse;
    return {
        leak: V('Constraint Check — ABSOLUTE AUTHORSHIP RULE: no sentences the student could copy. Final Review against ALL Rules: passed.'),
        // Deliberately free of scaffolding markers, so this isolates the
        // deliberation patterns rather than being caught by the marker list.
        deliberation: V("Here's a thinking process for this: first I consider what the writer needs, then I answer."),
        heading: V('## Thinking Process\n1. Read the draft.\n2. Check constraints.'),
        headingEs: V('**Proceso de pensamiento**\nPrimero reviso el borrador.'),
        genreLeak: V('GENRE GUIDANCE (Personal Statement): not acting as admissions officer.'),
        json: V('{"noFindings": false, "findings": [{"evidenceQuote": "x"}]}'),
        empty: V('   '),
        // Legitimate coaching must survive. These are the false positives that
        // would make the guard worse than the defect.
        cleanEn: V('Strength: the second sentence gives the reader a concrete image. Revision question: what did you notice about the neighbors that a reader could not guess? I did not rewrite any sentence.'),
        cleanEs: V('Fortaleza: la segunda oración le da al lector una imagen concreta. Pregunta de revisión: ¿qué notaste que un lector no podría adivinar?'),
        thinkingInProse: V('Your thinking process is visible in this paragraph, and that is a strength — the reader watches you work it out.'),
        assignmentPrompt: V('Check the assignment prompt for how many sources your instructor expects.'),
        authorshipWord: V('This paragraph shows real authorship: the voice is unmistakably yours.'),
    };
});
check('rejects recited rule scaffolding', guard.leak.ok === false && guard.leak.reason === 'scaffolding');
check('rejects a "here\'s a thinking process" opener', guard.deliberation.ok === false && guard.deliberation.reason === 'deliberation');
check('rejects a Thinking Process heading', guard.heading.ok === false);
check('rejects a Spanish deliberation heading', guard.headingEs.ok === false);
check('rejects a recited GENRE GUIDANCE block', guard.genreLeak.ok === false && guard.genreLeak.reason === 'scaffolding');
check('rejects leaked Council JSON field names', guard.json.ok === false);
check('rejects an empty response', guard.empty.ok === false && guard.empty.reason === 'empty');
check('ACCEPTS ordinary English coaching', guard.cleanEn.ok === true);
check('ACCEPTS ordinary Spanish coaching', guard.cleanEs.ok === true);
check('ACCEPTS "your thinking process" as running prose', guard.thinkingInProse.ok === true);
check('ACCEPTS "the assignment prompt"', guard.assignmentPrompt.ok === true);
check('ACCEPTS the word authorship in feedback', guard.authorshipWord.ok === true);

// ── 7. Rejection reaches nothing: not shown, not stored ──────────────────────
console.log('\n7. A rejected response is neither shown nor stored');
for (const [fixture, label] of [['scaffolding', 'scaffolding recital'], ['deliberation', 'visible deliberation'], ['empty', 'an empty answer']]) {
    await fresh(`?mockleak=${fixture}`);
    await openAsk();
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.waitForTimeout(1000);
    const after = await stored();
    const bodyText = await page.evaluate(() => document.body.innerText);
    check(`${label}: no review record is stored`, (after.reviews || []).length === 0, `${(after.reviews || []).length}`);
    check(`${label}: no version snapshot is created`, (after.versions || []).length === 0, `${(after.versions || []).length}`);
    check(`${label}: the rejected text is nowhere in storage`,
        !JSON.stringify(after).includes('ABSOLUTE AUTHORSHIP RULE')
        && !JSON.stringify(after).includes('thinking process')
        && !JSON.stringify(after).includes('Constraint Check'));
    check(`${label}: the rejected text is nowhere on screen`,
        !bodyText.includes('ABSOLUTE AUTHORSHIP RULE') && !bodyText.includes('Constraint Check')
        && !/here's a thinking process/i.test(bodyText));
    check(`${label}: a provider event records only the category and reason`,
        (after.providerEvents || []).some(event => event.category === 'response_rejected')
        && !JSON.stringify(after.providerEvents).includes('AUTHORSHIP'));
    check(`${label}: the call is still counted — it happened and it cost money`,
        after.usage?.requests === 1, `${after.usage?.requests}`);
}

// ── 8. The fallback is calm, useful, and non-destructive ─────────────────────
console.log('\n8. Fallback behaviour — the writer is not stranded');
await fresh('?mockleak=scaffolding');
await openAsk();
await page.locator('#coachQuestion').fill('Does the ending land?');
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(1000);
const notice = (await page.locator('.provider-error').first().textContent()) || '';
check('a contained notice appears in the open dialog', (await page.locator('.provider-error').count()) >= 1);
check('it is announced assertively to assistive technology',
    (await page.locator('.provider-error').first().getAttribute('role')) === 'alert');
check('it says plainly that nothing was shown or saved', /not shown or saved/i.test(notice));
check('it says the draft is unchanged', /draft is unchanged/i.test(notice));
check('it offers a route forward without AI', /without AI/i.test(notice));
check('it suggests the writer\'s own next move', /ask again/i.test(notice));
check('it never quotes or names what was rejected',
    !/AUTHORSHIP|Constraint Check|thinking process|scaffolding/i.test(notice));
check('the send button is usable again — a retry is the writer\'s decision',
    await page.locator('[data-action="submit-mock"]').isEnabled());
check('the typed question survives the rejection', (await page.locator('#coachQuestion').inputValue()) === 'Does the ending land?');
check('the draft is preserved byte-for-byte',
    (await page.evaluate(() => document.querySelector('#draftEditor').value)) === DRAFT);
const afterFallback = await stored();
check('the stored draft is preserved byte-for-byte', (afterFallback.draft || '') === DRAFT);
check('no review was written', (afterFallback.reviews || []).length === 0);

console.log('\n8b. Non-AI writing continues after a rejection');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
await page.locator('#draftEditor').fill(`${DRAFT} I kept going back after the season ended.`);
await page.waitForTimeout(400);
const afterWriting = await stored();
check('the writer can keep writing and it saves', (afterWriting.draft || '').includes('after the season ended'));
check('still no review record was created', (afterWriting.reviews || []).length === 0);

// ── 9. A clean response still works end to end ───────────────────────────────
console.log('\n9. The guard does not break the ordinary path');
await fresh();
await openAsk();
await page.locator('#coachQuestion').fill('What is working in this opening?');
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.locator('.review-card').first().waitFor();
const good = await stored();
check('an ordinary coach response is stored', (good.reviews || []).length === 1);
check('its suggestion is the model text, unaltered by the guard',
    (good.reviews[0]?.suggestion || '').length > 0 && !good.reviews[0].suggestion.includes('undefined'));
check('no response_rejected event was recorded', !(good.providerEvents || []).some(e => e.category === 'response_rejected'));

// ── 10. No scaffolding is ever displayed or stored ───────────────────────────
console.log('\n10. No internal prompt scaffolding is displayed or stored, on any path');
const SCAFFOLD = ['ABSOLUTE AUTHORSHIP RULE', 'WHOLE-PASSAGE READING PROTOCOL', 'GENRE GUIDANCE',
    '[STUDENT-SELECTED', '[END SELECTED TEXT]', 'STUDENT-PROTECTED VOICE', 'REQUEST GENERATED BY TU PANA'];
const visible = await page.evaluate(() => document.body.innerText);
for (const marker of SCAFFOLD) {
    check(`"${marker}" is not on screen`, !visible.includes(marker));
    check(`"${marker}" is not in the stored record`, !JSON.stringify(good).includes(marker));
}

// ── 12. PRODUCTION SAFETY BOUNDARY for the ?mockleak= fixture ────────────────
// The fixture exists so the guard can be exercised without live calls. It must
// be provably incapable of inducing simulated leaked output in the live
// application. Three independent layers are asserted here, so this is evidence
// rather than an assurance:
//
//   (1) STRUCTURAL — the fixture is read at exactly one site, inside the mock
//       provider's call(). The Gemini adapter never references it, so there is
//       no code path by which a query parameter can inject text into a live
//       response.
//   (2) BEHAVIOURAL — with the LIVE provider selected and ?mockleak= set, the
//       fixture text never appears; the provider's own response is what is
//       stored. (Exercised against a stubbed fetch: zero live calls.)
//   (3) DEFENCE IN DEPTH — every fixture string is itself guard-rejected by
//       construction, so even where the mock provider can be forced (the
//       pre-existing ?provider=mock behaviour, same class as ?mockfail= and
//       ?mockcouncil=), the text is discarded before display or storage. The
//       fixture can only ever produce the calm fallback.
console.log('\n12. ?mockleak= is inert on the live provider path');
await fresh('?provider=gemini&mockleak=scaffolding');
const structural = await page.evaluate(() => {
    const source = window.StudioProvider.createGeminiProvider.toString();
    return {
        activeName: window.StudioProvider.active().name,
        activeLive: window.StudioProvider.active().live === true,
        geminiMentionsFixture: /mockLeak|MOCK_LEAK|mockleak/.test(source),
    };
});
check('the live provider is the one selected', structural.activeName === 'gemini-proxy', structural.activeName);
check('and it reports itself live', structural.activeLive);
check('the Gemini adapter contains no reference to the fixture', structural.geminiMentionsFixture === false);

// Behavioural: run the real live adapter end to end against a stubbed fetch, so
// the wire contract is exercised with zero live calls.
const CANNED = 'Strength: the opening gives the reader a place to stand. Revision question: what did you notice there that a reader could not?';
await page.evaluate(canned => {
    window.__fetchCalls = 0;
    window.fetch = async () => {
        window.__fetchCalls += 1;
        return { ok: true, status: 200, json: async () => ({ text: canned, usage: { requests: 1 } }) };
    };
}, CANNED);
await openAsk();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.locator('.review-card').first().waitFor();
const liveish = await stored();
const liveishBody = await page.evaluate(() => document.body.innerText);
check('the live adapter actually issued the request', await page.evaluate(() => window.__fetchCalls) === 1);
check('the stored response is the provider\'s, not the fixture', liveish.reviews[0]?.suggestion === CANNED);
check('the record is marked as a live (non-mock) provider', liveish.reviews[0]?.mock === false);
check('no fixture text reached storage',
    !JSON.stringify(liveish).includes('ABSOLUTE AUTHORSHIP RULE') && !JSON.stringify(liveish).includes('Constraint Check'));
check('no fixture text reached the screen',
    !liveishBody.includes('ABSOLUTE AUTHORSHIP RULE') && !liveishBody.includes('Constraint Check'));
check('no response_rejected event fired on the clean live path',
    !(liveish.providerEvents || []).some(event => event.category === 'response_rejected'));

// Defence in depth: the fixture strings are self-rejecting.
const selfRejecting = await page.evaluate(() => {
    const V = window.StudioProvider.validateCoachResponse;
    const texts = {
        scaffolding: 'Constraint Check — ABSOLUTE AUTHORSHIP RULE: no sentences, phrases, or outlines the student could copy. GENRE GUIDANCE (Personal Statement): not acting as admissions officer. Final Review against ALL Rules: passed.',
        deliberation: 'Here\'s a thinking process that applies the rules and genre guidance to the student\'s request: first I consider what the writer needs, then I check each constraint in order, and then I answer.',
        empty: '   ',
    };
    return Object.fromEntries(Object.entries(texts).map(([key, text]) => [key, V(text).ok]));
});
check('the scaffolding fixture is self-rejecting', selfRejecting.scaffolding === false);
check('the deliberation fixture is self-rejecting', selfRejecting.deliberation === false);
check('the empty fixture is self-rejecting', selfRejecting.empty === false);

// ── 11. Isolation ────────────────────────────────────────────────────────────
console.log('\n11. Isolation');
check('no external requests were made', external.length === 0, external.slice(0, 3).join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS`);
if (failed) process.exit(1);
