// Refinement A — the contextual critical-AI-literacy question.
//
// WHAT FAILED, AND WHERE THIS SUITE PINS IT
// The 1E preview review found the critical lens under a coach response chosen
// from the STUDENT'S PLANNING MOVE rather than from the response. On the
// observed case the writer asked "What is the weakest sentence…?", the coach
// diagnosed the sentence and offered guiding questions, and the interface asked
// the writer to evaluate it through:
//
//     Voice — Does this still sound like the specific person who wrote it?
//
// Voice is the right question only when a response proposes or rewrites
// language. Here it was pedagogically inert: the writer was invited to judge
// something the response had never done, which teaches the opposite of critical
// AI literacy — that the evaluation ritual is decoration.
//
// THE CONTRACT UNDER TEST
// Gemini writes the feedback and, in the SAME call, recommends one lens from a
// fixed five and writes one question about its own answer. Tu Pana owns
// everything else: the permitted lens set, validation, the fallback, rendering,
// and the decision controls. No second provider call is made, and no Worker
// change is involved — the contract rides in the prompt this application
// already builds and the answer rides back in the response text it already
// receives.
//
// Zero live AI calls. ?mockreflect= exercises the contract deterministically,
// exactly as ?mockcouncil= exercises the Council kernel and ?mockleak= the F1
// response guard. Requires this worktree at http://127.0.0.1:3001.
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

// Synthetic throughout: no real student or family writing.
const DRAFT = 'The community garden on Walton Avenue opened in April and I went there every Saturday morning. Neighbors brought seedlings from their own kitchens. That is why the block changed.';

async function fresh(query = '') {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html${query}`);
    await page.evaluate(key => {
        localStorage.removeItem(key);
        localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
    }, KEY);
    await page.reload();
    // Count provider calls at the seam itself, so "one call, not two" is an
    // observation of the application rather than an assumption about it.
    await page.evaluate(() => {
        window.__calls = 0;
        const active = window.StudioProvider.active;
        window.StudioProvider.active = () => {
            const provider = active();
            const call = provider.call.bind(provider);
            return { ...provider, call: (...args) => { window.__calls += 1; return call(...args); } };
        };
    });
}
async function setSpanish() {
    await page.locator('.prototype-actions [data-action="language"]').selectOption('es');
    await page.waitForTimeout(200);
}
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);
const calls = () => page.evaluate(() => window.__calls);

async function ask(question = '', draft = DRAFT) {
    await page.locator('#draftEditor').fill(draft);
    await page.waitForTimeout(300);
    await page.locator('[data-action="coach"]').first().click();
    await page.waitForTimeout(250);
    if (question) await page.locator('#coachQuestion').fill(question);
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.locator('.review-card').first().waitFor();
    await page.waitForTimeout(150);
}
async function openCritical() {
    await page.locator('.critical-moment > summary').first().click();
    await page.waitForTimeout(120);
}
const criticalText = () => page.locator('.critical-moment').first().textContent();
const primaryQuestion = () => page.locator('.critical-primary').first().textContent();

// ── 1. The contract states the selection rules explicitly ────────────────────
console.log('\n1. The coaching contract carries the lens-selection rules');
await fresh();
const contract = await page.evaluate(() => window.StudioProvider.buildPassagePrompt({
    genreName: 'x', lang: 'en', scopeLabel: 'passage', text: 'T', question: 'Q',
}));
check('the reflection block is part of the same prompt — no second call is set up',
    contract.includes('TU PANA REFLECTION'));
check('voice is restricted to responses that propose or rewrite language',
    /voice — ONLY if you proposed, reworded, or rewrote any language/.test(contract));
check('accuracy is tied to factual, academic, source or citation claims',
    /accuracy — if you introduced a factual, academic, source, or citation claim/.test(contract));
check('specificity is tied to asking for concrete evidence or detail',
    /specificity — if you asked for concrete evidence, examples, or detail/.test(contract));
check('cultural knowledge is tied to lived, familial, linguistic or community experience',
    /cultural_knowledge — if you interpreted lived, familial, linguistic, or community experience/.test(contract));
check('thinking is tied to diagnosis, relationships, or guiding questions',
    /thinking — if you diagnosed a problem, explained a relationship, or offered guiding questions/.test(contract));
check('the question must evaluate the feedback that was actually given',
    /evaluate the feedback you just gave/.test(contract));
check('the question must stay connected to the request the writer made',
    /stay connected to the request stated above/.test(contract));
check('the question must serve accept / adapt / reject / investigate / defer',
    /accept, adapt, reject, investigate further, or defer/.test(contract));
check('the question may never imply the response is correct',
    /MUST NEVER: imply your feedback is correct/.test(contract));
check('the question may never encourage acceptance', /encourage accepting it/.test(contract));
check('the question may never supply replacement prose',
    /contain replacement prose or any sentence the writer could copy/.test(contract));
check('the block is appended after the request, leaving the pinned contracts above untouched',
    contract.indexOf('TU PANA REFLECTION') > contract.indexOf('STUDENT REQUEST:'));
check('the full-draft pathway carries the same contract',
    (await page.evaluate(() => window.StudioProvider.buildFullDraftPrompt({
        genreName: 'x', lang: 'en', lensLabel: 'L', purpose: 'p', words: 3, text: 'T',
    }))).includes('TU PANA REFLECTION'));

// ── 2. Each lens reaches the writer as the response earns it ─────────────────
console.log('\n2. The lens follows the response, not the planning move');
const LENSES = [
    ['thinking', 'Thinking', /guiding questions/i, 'a diagnosis with guiding questions'],
    ['voice', 'Voice', /keep the way you actually speak/i, 'a response that proposes language'],
    ['accuracy', 'Accuracy', /verified that date/i, 'a response introducing a factual claim'],
    ['specificity', 'Specificity', /concrete detail/i, 'a response asking for concrete detail'],
    ['cultural', 'Cultural knowledge', /from your own community/i, 'a culturally situated interpretation'],
];
for (const [fixture, principle, questionPattern, shape] of LENSES) {
    await fresh(`?mockreflect=${fixture}`);
    await ask('What is the weakest sentence here?');
    await openCritical();
    const text = await criticalText();
    const record = (await stored()).reviews[0];
    check(`${shape} → ${principle}`, text.includes(principle), text.slice(0, 90));
    check(`${shape} → the question is about that response`, questionPattern.test(await primaryQuestion()));
    check(`${shape} → the record stores the recommended lens`, record.criticalKey === (fixture === 'cultural' ? 'cultural' : fixture), record.criticalKey);
    check(`${shape} → the record marks the question as the response's own`, record.criticalSource === 'model');
    check(`${shape} → exactly one provider call was made`, await calls() === 1, `${await calls()}`);
}

// The defect case, stated as the regression it is.
console.log('\n2b. The observed 1E defect specifically');
await fresh('?mockreflect=thinking');
await ask('What is the weakest sentence here?');
await openCritical();
const defectText = await criticalText();
check('a diagnosis with guiding questions is no longer paired with the Voice lens',
    !/^\s*Voice/m.test(await page.locator('.critical-moment .panel-kicker').first().textContent()));
check('the canonical Voice question is not the primary question here',
    !/Does this still sound like the specific person who wrote it/.test(await primaryQuestion()));
check('the Five Questions framework is still reachable, one disclosure deeper',
    await page.locator('.critical-framework').count() === 1);
check('and it still contains the Voice question in full',
    /Does this still sound like the specific person who wrote it/.test(defectText));
check('only one primary question is shown', await page.locator('.critical-primary').count() === 1);

// ── 3. Custom question and pre-populated static request ──────────────────────
console.log('\n3. Both request routes carry a contextual question');
await fresh('?mockreflect=thinking');
const CUSTOM = 'Does my last sentence actually follow from the two before it?';
await ask(CUSTOM);
let record = (await stored()).reviews[0];
check('a custom student question still produces a response-specific reflection',
    record.criticalSource === 'model' && record.criticalQuestionAsked.length > 10);
check('the writer\'s own question is stored beside it, unchanged', record.question === CUSTOM);
check('the two are distinct fields — the reflection never overwrites the request',
    record.criticalQuestionAsked !== record.question);

await fresh('?mockreflect=specificity');
await ask('');
record = (await stored()).reviews[0];
check('the pre-populated bounded request also produces a reflection', record.criticalSource === 'model');
check('and it is still honestly marked as defaulted', record.requestDefaulted === true && record.question === null);

// ── 4. Bilingual ─────────────────────────────────────────────────────────────
console.log('\n4. English and Spanish');
await fresh('?mockreflect=thinking');
await setSpanish();
await ask('¿Cuál es la oración más débil?');
await openCritical();
const es = await primaryQuestion();
check('a Spanish session gets a Spanish reflection question', /¿/.test(es) && /preguntas guía/i.test(es));
check('it is not the English question translated at render time',
    !/Do these guiding questions/.test(es));
record = (await stored()).reviews[0];
check('the stored question is the Spanish one the writer saw', record.criticalQuestionAsked === es.trim());

await fresh('?mockreflect=thinking');
await ask('What is the weakest sentence here?');
await openCritical();
check('an English session gets the English question', /Do these guiding questions/.test(await primaryQuestion()));

// ── 5. Validation: the reflection fails alone, never with the feedback ───────
console.log('\n5. A malformed reflection costs the reflection and nothing else');
const FALLBACK_EN = 'Does this response answer the question you asked? What would you accept, adapt, reject, or investigate further?';
const INVALID = [
    ['badlens', 'a lens outside the permitted five'],
    ['noquestion', 'a lens with no question'],
    ['shortquestion', 'a question too short to be usable'],
    ['endorsement', 'a question that tells the writer the AI was right'],
    ['unsafe', 'a question reciting internal scaffolding'],
    ['markup', 'a question carrying markup'],
    ['missing', 'no reflection block at all'],
];
for (const [fixture, shape] of INVALID) {
    await fresh(`?mockreflect=${fixture}`);
    await ask('What is the weakest sentence here?');
    await openCritical();
    const after = await stored();
    record = after.reviews[0];
    const body = await page.evaluate(() => document.body.innerText);
    check(`${shape}: the coaching feedback is preserved and displayed`,
        record.suggestion.length > 40 && body.includes(record.suggestion.slice(0, 40)));
    check(`${shape}: the universal fallback question is shown`, (await primaryQuestion()).trim() === FALLBACK_EN);
    check(`${shape}: the record marks the reflection as fallback`, record.criticalSource === 'fallback', record.criticalSource);
    check(`${shape}: no malformed reflection question is stored`, record.criticalQuestionAsked === null);
    check(`${shape}: only the rejection category is recorded, never the text`,
        typeof record.reflectionReason === 'string' && record.reflectionReason.length < 20, record.reflectionReason);
    check(`${shape}: no lens is asserted that was never derived`,
        (await page.locator('.critical-moment .panel-kicker').count()) === 0);
    check(`${shape}: the response is still a normal, decidable record`,
        (after.providerEvents || []).every(event => event.category !== 'response_rejected'));
}

console.log('\n5b. The unsafe fixture proves the reflection is guarded, not merely parsed');
await fresh('?mockreflect=unsafe');
await ask('What is the weakest sentence here?');
const unsafeState = JSON.stringify(await stored());
const unsafeBody = await page.evaluate(() => document.body.innerText);
check('the scaffolding-bearing question never reaches storage', !unsafeState.includes('ABSOLUTE AUTHORSHIP RULE'));
check('the scaffolding-bearing question never reaches the screen', !unsafeBody.includes('ABSOLUTE AUTHORSHIP RULE'));

// ── 6. No transport scaffolding is ever rendered or stored ───────────────────
console.log('\n6. The transport contract is invisible to the writer');
await fresh('?mockreflect=thinking');
await ask('What is the weakest sentence here?');
await openCritical();
const cleanState = JSON.stringify(await stored());
const cleanBody = await page.evaluate(() => document.body.innerText);
for (const marker of ['<<TP-LENS', '<<TP-QUESTION', 'TU PANA REFLECTION', 'TP-LENS', 'cultural_knowledge']) {
    check(`"${marker}" is not on screen`, !cleanBody.includes(marker));
    check(`"${marker}" is not in the stored record`, !cleanState.includes(marker));
}
record = (await stored()).reviews[0];
check('the stored feedback is the prose only, with the trailer stripped',
    !record.suggestion.includes('<<') && !record.suggestion.includes('>>'));
check('the visible feedback ends with the coaching, not a label',
    /\?$|\.$/.test(record.suggestion.trim()));

// ── 7. The question belongs to the record, permanently ──────────────────────
console.log('\n7. The question is inseparable from the response it evaluates');
record = (await stored()).reviews[0];
check('it is saved inside the same record as the feedback', typeof record.criticalQuestionAsked === 'string');
check('alongside the writer\'s request', record.question === 'What is the weakest sentence here?');
check('alongside the genre', Boolean(record.genre) && Boolean(record.genreLabel));
check('alongside the draft snapshot used', Boolean(record.snapshotId));
check('alongside the draft signature at consent time', Boolean(record.draftSignature));
const snapshot = (await stored()).versions.find(v => v.id === record.snapshotId);
check('and that snapshot is the consented text', typeof snapshot?.text === 'string' && snapshot.text.includes('Walton Avenue'));

const before = record.criticalQuestionAsked;
await page.reload();
await page.waitForTimeout(600);
await page.locator('[data-action="review-center"]').first().click().catch(async () => {
    await page.locator('[data-action="focused-review"]').first().click();
});
await page.waitForTimeout(400);
const reloaded = (await stored()).reviews[0];
check('a reload does not regenerate the question', reloaded.criticalQuestionAsked === before);
check('a reload does not detach it from its record', reloaded.criticalSource === 'model' && reloaded.id === record.id);
check('a reload issues no provider call', await page.evaluate(() => window.__calls === undefined || window.__calls === 0));

console.log('\n7b. A newer response never inherits an older question');
await fresh('?mockreflect=thinking');
await ask('What is the weakest sentence here?');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
await page.goto(`${ORIGIN}/studio.html?mockreflect=voice`);
await page.waitForTimeout(500);
await page.locator('[data-action="coach"]').first().click();
await page.waitForTimeout(250);
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(900);
const two = (await stored()).reviews;
check('two records exist', two.length === 2, `${two.length}`);
check('each keeps its own lens', two[0].criticalKey === 'thinking' && two[1].criticalKey === 'voice',
    `${two[0].criticalKey} / ${two[1].criticalKey}`);
check('each keeps its own question', two[0].criticalQuestionAsked !== two[1].criticalQuestionAsked);

// ── 8. The decision controls are intact and carry the same question ─────────
console.log('\n8. Decision controls, preserved');
await fresh('?mockreflect=thinking');
await ask('What is the weakest sentence here?');
const feed = await page.locator('.review-card').first().textContent();
check('"Think critically about this response" is preserved',
    /Think critically about this response/.test(feed));
await openCritical();
check('"View the Five Questions" is preserved', /View the Five Questions/.test(await criticalText()));
check('the authorship boundary line is preserved',
    /You remain the author and decision-maker\. No response changes your draft\./.test(await page.locator('.critical-moment').first().textContent()));
for (const label of ['Accept', 'Adapt', 'Reject', 'Decide later']) {
    check(`"${label}" is present`, await page.locator(`.decision-button:text-is("${label}")`).count() >= 1);
}
check('"Choose your next move" replaces "Pick one revision to try" on the card',
    await page.locator('.revision-focus-suggestion:text-is("Choose your next move")').count() >= 1);
check('the superseded label is gone from the card',
    !(await page.locator('.review-card').first().textContent()).includes('Pick one revision to try'));

await page.locator('.decision-button[data-choice="adapt"]').first().click();
await page.waitForTimeout(250);
const decisionDialog = await page.locator('.dialog').first().textContent();
record = (await stored()).reviews[0];
check('the decision dialog repeats the SAME contextual question',
    decisionDialog.includes(record.criticalQuestionAsked));
check('it does not re-derive a canonical Five Questions question',
    !/Does this still sound like the specific person who wrote it/.test(decisionDialog));
await page.locator('[data-action="save-integrated-decision"]').click();
await page.waitForTimeout(300);
const saved = (await stored()).decisions[0];
check('the decision saves', saved?.choice === 'adapt');
check('the decision record carries the same question', saved.criticalQuestionAsked === record.criticalQuestionAsked);
check('and its provenance', saved.criticalSource === 'model');

// ── 9. Unit behaviour of the parser and validator ───────────────────────────
console.log('\n9. Split-then-validate, as a unit');
await fresh();
const unit = await page.evaluate(() => {
    const S = window.StudioProvider.splitCoachResponse;
    const V = window.StudioProvider.validateReflection;
    const out = {};
    out.clean = S('Feedback prose here.\n\n<<TP-LENS: thinking>>\n<<TP-QUESTION: Does this help you see the gap?>>');
    out.doubled = S('Prose.\n<<TP-LENS: voice>>\n<<TP-QUESTION: First?>>\nMore prose.\n<<TP-LENS: thinking>>\n<<TP-QUESTION: Second one, does it?>>');
    out.none = S('Just coaching prose with no trailer at all.');
    out.alias = V({ lensRaw: 'cultural_knowledge', questionRaw: 'Does this miss what you know from home?' });
    out.internalKey = V({ lensRaw: 'cultural', questionRaw: 'Does this miss what you know from home?' });
    out.badLens = V({ lensRaw: 'tone', questionRaw: 'Does this help?' });
    out.notAQuestion = V({ lensRaw: 'thinking', questionRaw: 'This is a statement about your draft.' });
    out.tooLong = V({ lensRaw: 'thinking', questionRaw: `Does this help ${'x'.repeat(300)}?` });
    out.longQuote = V({ lensRaw: 'voice', questionRaw: 'Would you use "the afternoon light fell across the counter and nobody said anything at all about it"?' });
    out.shortQuote = V({ lensRaw: 'voice', questionRaw: 'Does "aquí escuchamos primero" still sound like you?' });
    out.endorse = V({ lensRaw: 'thinking', questionRaw: 'The feedback is correct, right?' });
    out.endorseEs = V({ lensRaw: 'thinking', questionRaw: '¿Deberías aceptar esta respuesta?' });
    out.scaffold = V({ lensRaw: 'thinking', questionRaw: 'Does GENRE GUIDANCE change what you accept?' });
    out.markup = V({ lensRaw: 'thinking', questionRaw: 'Does <b>this</b> help?' });
    out.spanish = V({ lensRaw: 'thinking', questionRaw: '¿Te ayudan estas preguntas a ver la conexión que falta?' });
    return out;
});
check('a clean trailer is split off the prose', unit.clean.prose === 'Feedback prose here.' && unit.clean.lensRaw === 'thinking');
check('the prose keeps no sentinel residue', !unit.clean.prose.includes('<<'));
check('a doubled block leaves no sentinel in the prose', !unit.doubled.prose.includes('<<') && !unit.doubled.prose.includes('>>'));
check('and the last block wins', unit.doubled.lensRaw === 'thinking' && /Second one/.test(unit.doubled.questionRaw));
check('no trailer is reported honestly, prose untouched',
    unit.none.hadTrailer === false && unit.none.prose === 'Just coaching prose with no trailer at all.');
check('the contract-facing lens name resolves', unit.alias.ok === true && unit.alias.key === 'cultural');
check('the internal lens key resolves to the same lens', unit.internalKey.ok === true && unit.internalKey.key === 'cultural');
check('a lens outside the five is refused', unit.badLens.ok === false && unit.badLens.reason === 'lens');
check('a statement is refused — it must be a question', unit.notAQuestion.ok === false && unit.notAQuestion.reason === 'form');
check('an over-long question is refused', unit.tooLong.ok === false && unit.tooLong.reason === 'length');
check('a long quoted span is refused as replacement prose', unit.longQuote.ok === false && unit.longQuote.reason === 'quoted-prose');
check('a short quotation of the writer\'s own words is ACCEPTED', unit.shortQuote.ok === true);
check('an endorsement is refused', unit.endorse.ok === false && unit.endorse.reason === 'endorsement');
check('a Spanish endorsement is refused', unit.endorseEs.ok === false && unit.endorseEs.reason === 'endorsement');
check('a question reciting scaffolding is refused', unit.scaffold.ok === false && unit.scaffold.reason === 'unsafe');
check('a question carrying markup is refused', unit.markup.ok === false && unit.markup.reason === 'markup');
check('ordinary Spanish is ACCEPTED', unit.spanish.ok === true);

console.log('\n10. Isolation');
check('no external requests were made', external.length === 0, external.slice(0, 3).join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
