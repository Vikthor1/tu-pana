// Refinement B — the response information hierarchy.
//
// WHAT FAILED, AND WHERE THIS SUITE PINS IT
// The feedback SUBSTANCE passed founder review: useful, answering the writer's
// inquiry, not writing for the student, guiding revision through questions.
// What did not pass was the shape. It arrived as one paragraph carrying an
// observation, its rationale, and two or three questions at once — hard to
// scan, hardest for the tired, stressed, or attention-limited writer this
// studio exists for.
//
// THE CONTRACT UNDER TEST
// In the SAME call that writes the feedback, the model declares which part is
// the observation, which parts are the questions, and which part is the
// rationale. It declares nothing else. Tu Pana owns the permitted fields, the
// validation, the length and count limits, the parsing, the rendering, the
// persistence, the fallbacks, and the decision controls. No second provider
// call is made and no Worker change is involved.
//
// The three outcomes this suite pins:
//   structure valid                     → the structured card;
//   structure invalid, prose valid      → the legacy paragraph, recorded;
//   neither valid                       → fail closed, as before.
//
// Zero live AI calls. ?mockstruct= exercises the contract deterministically,
// exactly as ?mockreflect= exercises the reflection contract and ?mockleak= the
// F1 response guard. Requires this worktree at http://127.0.0.1:3001.
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

async function fresh(query = '', viewport = { width: 1440, height: 960 }) {
    if (page) await page.close();
    page = await browser.newPage({ viewport });
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

async function setLanguage(value) {
    await page.locator('.prototype-actions [data-action="language"]').selectOption(value);
    await page.waitForTimeout(200);
}

async function chooseGenre(genreId) {
    await page.locator('.genre-select').selectOption(genreId);
    await page.waitForTimeout(250);
}

async function writeDraft(text = DRAFT) {
    await page.locator('#draftEditor').fill(text);
    await page.waitForTimeout(300);
}

// Ask Tu Pana, consent, wait for the card. Returns the Review Center dialog.
async function askCoach(question = 'What is the weakest sentence here?') {
    await page.locator('[data-action="coach"]').first().click();
    await page.waitForTimeout(250);
    if (question) await page.locator('#coachQuestion').fill(question);
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.locator('.review-card').first().waitFor();
    await page.waitForTimeout(200);
}

// A response the guard refuses: the same flow, but no card ever appears.
async function askRejected(question = 'What is the weakest sentence here?') {
    await page.locator('[data-action="coach"]').first().click();
    await page.waitForTimeout(250);
    if (question) await page.locator('#coachQuestion').fill(question);
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.waitForTimeout(1300);
}

async function storedReviews() {
    return page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}').reviews || [], KEY);
}

async function cardShape() {
    return page.evaluate(() => {
        const card = document.querySelector('.review-card');
        if (!card) return null;
        const structured = card.querySelector('.feedback-structured');
        const why = card.querySelector('details.feedback-why');
        const nodes = [...card.children].map(node => node.className || node.tagName.toLowerCase());
        return {
            html: card.innerHTML,
            text: card.innerText,
            hasStructured: Boolean(structured),
            headings: [...card.querySelectorAll('h4.feedback-heading')].map(node => node.textContent.trim()),
            firstHeadingTag: card.querySelector('h3, h4')?.tagName || null,
            observation: card.querySelector('.feedback-observation')?.textContent.trim() || null,
            observationLang: card.querySelector('.feedback-observation')?.getAttribute('lang') || null,
            listTag: card.querySelector('.feedback-questions')?.tagName || null,
            questions: [...card.querySelectorAll('.feedback-questions > li')].map(node => node.textContent.trim()),
            hasWhy: Boolean(why),
            whyOpen: why ? why.open : null,
            whySummary: why ? why.querySelector('summary')?.textContent.trim() : null,
            whyBody: why ? why.querySelector('.feedback-why-body')?.textContent.trim() : null,
            legacyParagraphs: [...card.querySelectorAll(':scope > p')].map(node => node.className),
            hasCritical: Boolean(card.querySelector('details.critical-moment')),
            decisions: [...card.querySelectorAll('.decision-button')].map(node => node.textContent.trim()),
            nextMove: card.querySelector('.revision-focus-suggestion')?.textContent.trim() || null,
            order: nodes,
        };
    });
}

const SENTINELS = ['<<TP-', 'TP-NOTICED', 'TP-GUIDE', 'TP-WHY', 'TP-LENS', 'TP-QUESTION', 'FEEDBACK STRUCTURE', 'AUTHORSHIP RULE', 'GENRE GUIDANCE'];

console.log('\nRefinement B — response information hierarchy\n');

// ── 1. The canonical structured card ─────────────────────────────────────────
console.log('1. Valid observation + two questions + rationale');
await fresh();
await chooseGenre('admissions');
await writeDraft();
await askCoach();
let shape = await cardShape();
check('card renders the structured body', shape.hasStructured);
check('exactly two section headings are visible by default', shape.headings.length === 2, JSON.stringify(shape.headings));
check('first heading is "What Tu Pana noticed"', /What Tu Pana noticed/.test(shape.headings[0]), shape.headings[0]);
check('second heading is "Questions to guide your revision"', /Questions to guide your revision/.test(shape.headings[1]), shape.headings[1]);
check('the observation is one visible paragraph', Boolean(shape.observation) && shape.observation.length > 40);
check('questions use real semantic list markup', shape.listTag === 'UL');
check('two guiding questions by default', shape.questions.length === 2, String(shape.questions.length));
check('every question is interrogative', shape.questions.every(question => question.trim().endsWith('?')));
check('each question is distinct', new Set(shape.questions).size === shape.questions.length);
check('"Why this matters" exists as a disclosure', shape.hasWhy);
check('"Why this matters" is COLLAPSED by default', shape.whyOpen === false);
check('collapsed rationale carries real content', (shape.whyBody || '').length > 40);
check('rationale does not repeat the observation verbatim', shape.whyBody !== shape.observation);
check('card title stays an h3 so the reveal target is unchanged', shape.firstHeadingTag === 'H3');

console.log('\n2. Required order inside the card');
const order = shape.order.join('|');
check('metadata precedes the feedback body', order.indexOf('review-meta') < order.indexOf('feedback-structured'));
check('the feedback body precedes the critical-reflection layer', order.indexOf('feedback-structured') < order.indexOf('critical-moment'));
check('the critical layer precedes the decision controls', order.indexOf('critical-moment') < order.indexOf('decision-row'));
check('"Choose your next move" comes last', shape.order[shape.order.length - 1].includes('revision-focus-suggestion'));

console.log('\n3. The accepted critical-reflection layer is untouched');
check('"Think critically about this response" is present', shape.hasCritical);
check('it is a separate disclosure, not nested inside "Why this matters"',
    await page.evaluate(() => !document.querySelector('.feedback-why details.critical-moment') && !document.querySelector('.critical-moment .feedback-why')));
check('Accept / Adapt / Reject / Decide later all present', shape.decisions.length === 4, JSON.stringify(shape.decisions));
check('"Choose your next move" label preserved', /Choose your next move/.test(shape.nextMove || ''), shape.nextMove);
let reviews = await storedReviews();
check('the model-selected lens is stored with this record', reviews[0].criticalSource === 'model' && Boolean(reviews[0].criticalKey));
check('the response-specific critical question is stored', typeof reviews[0].criticalQuestionAsked === 'string' && reviews[0].criticalQuestionAsked.endsWith('?'));

console.log('\n4. One call, one canonical record, no scaffolding leak');
check('exactly ONE provider call was made', await page.evaluate(() => window.__calls) === 1);
check('the record stores the structured fields', Boolean(reviews[0].structured?.observation) && Array.isArray(reviews[0].structured?.questions));
check('there is exactly one stored review, not a brief and a full one', reviews.length === 1);
check('suggestion is composed from the same fields, not a second answer',
    reviews[0].suggestion.includes(reviews[0].structured.observation)
    && reviews[0].structured.questions.every(question => reviews[0].suggestion.includes(question)));
check('responseLang is recorded on the record', ['en', 'es'].includes(reviews[0].responseLang));
check('structureReason is null on a clean structured record', reviews[0].structureReason === null);
const storedBlob = JSON.stringify(reviews);
check('no sentinel or scaffolding reaches the STORED record', SENTINELS.every(marker => !storedBlob.includes(marker)), storedBlob.slice(0, 120));
check('no sentinel or scaffolding reaches the VISIBLE card', SENTINELS.every(marker => !shape.text.includes(marker)));

console.log('\n5. Question counts — one, three, and the rejected fourth');
await fresh('?mockstruct=one');
await chooseGenre('admissions');
await writeDraft();
await askCoach();
shape = await cardShape();
check('a single valid question renders a valid card', shape.hasStructured && shape.questions.length === 1);

await fresh('?mockstruct=three');
await chooseGenre('admissions');
await writeDraft();
await askCoach();
shape = await cardShape();
check('three questions are accepted as the maximum', shape.hasStructured && shape.questions.length === 3);

await fresh('?mockstruct=four');
await chooseGenre('admissions');
await writeDraft();
await writeDraft();
await askRejected();
check('a FOURTH question is rejected, not silently truncated', await page.evaluate(() => !document.querySelector('.review-card')));
let stateAfter = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'), KEY);
check('the over-count response is not stored as feedback', (stateAfter.reviews || []).length === 0);
check('the rejection is recorded with its structural reason',
    (stateAfter.providerEvents || []).some(event => event.category === 'response_rejected' && event.structureReason === 'question-count'),
    JSON.stringify(stateAfter.providerEvents));
check('the recorded reason carries no response text', !JSON.stringify(stateAfter.providerEvents).includes('?'));

console.log('\n6. Malformed parts — what is fatal and what is not');
await fresh('?mockstruct=badobservation');
await chooseGenre('admissions');
await writeDraft();
await askRejected();
check('a malformed OBSERVATION fails the response closed', await page.evaluate(() => !document.querySelector('.review-card')));
stateAfter = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'), KEY);
check('no partial card is stored for a malformed observation', (stateAfter.reviews || []).length === 0);

await fresh('?mockstruct=badquestion');
await chooseGenre('admissions');
await writeDraft();
await askRejected();
check('a command disguised as a guiding question fails closed', await page.evaluate(() => !document.querySelector('.review-card')));

await fresh('?mockstruct=duplicate');
await chooseGenre('admissions');
await writeDraft();
await askRejected();
check('two identical questions are one thinking move, and fail closed', await page.evaluate(() => !document.querySelector('.review-card')));

await fresh('?mockstruct=leak');
await chooseGenre('admissions');
await writeDraft();
await askRejected();
check('scaffolding inside a guiding question fails closed', await page.evaluate(() => !document.querySelector('.review-card')));
stateAfter = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'), KEY);
check('no rule scaffolding is persisted from the rejected response', !JSON.stringify(stateAfter).includes('AUTHORSHIP RULE'));

console.log('\n7. The OPTIONAL rationale degrades alone');
await fresh('?mockstruct=badwhy');
await chooseGenre('admissions');
await writeDraft();
await askCoach();
shape = await cardShape();
check('a malformed rationale does NOT erase the observation', Boolean(shape.observation));
check('a malformed rationale does NOT erase the questions', shape.questions.length === 2);
check('the malformed rationale itself is dropped', !shape.hasWhy);
reviews = await storedReviews();
check('the drop is recorded as a category name', reviews[0].whyReason === 'length', String(reviews[0].whyReason));
check('the record is still a valid structured record', Boolean(reviews[0].structured?.observation));

await fresh('?mockstruct=nowhy');
await chooseGenre('admissions');
await writeDraft();
await askCoach();
shape = await cardShape();
check('an absent rationale still renders a complete usable card', shape.hasStructured && shape.questions.length === 2 && !shape.hasWhy);
check('the visible feedback is intelligible without the rationale', (shape.observation || '').length > 40);

console.log('\n8. Missing structure degrades to the legacy presentation');
await fresh('?mockstruct=legacy');
await chooseGenre('admissions');
await writeDraft();
await askCoach();
shape = await cardShape();
check('valid prose without structure still reaches the writer', !shape.hasStructured && shape.text.length > 60);
check('it renders calmly as the existing paragraph presentation', shape.legacyParagraphs.includes(''));
reviews = await storedReviews();
check('the record is stored in the legacy shape', reviews[0].structured === null);
check('the reason is recorded rather than silent', reviews[0].structureReason === 'missing');
check('the critical-reflection layer still works on a legacy-shaped record', shape.hasCritical);
check('decision controls still work on a legacy-shaped record', shape.decisions.length === 4);

console.log('\n9. Missing or malformed critical reflection keeps the universal fallback');
await fresh('?mockreflect=badlens');
await chooseGenre('admissions');
await writeDraft();
await askCoach();
reviews = await storedReviews();
check('an unusable lens falls back rather than failing the card', reviews[0].criticalSource === 'fallback');
check('the feedback itself survives a malformed reflection', Boolean(reviews[0].suggestion));
check('a fallback record still carries a critical prompt', Boolean(reviews[0].criticalPrompt));
shape = await cardShape();
check('the critical layer still renders under the fallback', shape.hasCritical);

console.log('\n10. Spanish and bilingual language markup');
await fresh();
await setLanguage('es');
await chooseGenre('admissions');
await writeDraft();
await askCoach('¿Cuál es la oración más débil?');
shape = await cardShape();
check('Spanish: the structured card renders', shape.hasStructured);
check('Spanish: heading is "Lo que Tu Pana notó"', /Lo que Tu Pana notó/.test(shape.headings[0]), shape.headings[0]);
check('Spanish: heading is "Preguntas para guiar tu revisión"', /Preguntas para guiar tu revisión/.test(shape.headings[1]), shape.headings[1]);
check('Spanish: rationale summary is "Por qué esto importa"', /Por qué esto importa/.test(shape.whySummary || ''), shape.whySummary);
check('Spanish: the response content is marked lang="es"', shape.observationLang === 'es');
check('Spanish: questions are interrogative in Spanish', shape.questions.every(question => question.trim().endsWith('?')));

await fresh();
await setLanguage('both');
await chooseGenre('admissions');
await writeDraft();
await askCoach('¿Cuál es la oración más débil?');
const bilingual = await page.evaluate(() => {
    const card = document.querySelector('.review-card');
    const heading = card.querySelector('h4.feedback-heading');
    const summary = card.querySelector('.feedback-why > summary');
    return {
        headingHtml: heading.innerHTML,
        headingEs: heading.querySelector('[lang="es"]')?.textContent.trim() || null,
        headingEn: heading.querySelector('[lang="en"]')?.textContent.trim() || null,
        summaryEs: summary?.querySelector('[lang="es"]')?.textContent.trim() || null,
        summaryEn: summary?.querySelector('[lang="en"]')?.textContent.trim() || null,
        separatorHidden: heading.querySelector('[aria-hidden="true"]') !== null,
    };
});
check('bilingual: Spanish half is attributed lang="es"', bilingual.headingEs === 'Lo que Tu Pana notó', bilingual.headingEs);
check('bilingual: English half is attributed lang="en"', bilingual.headingEn === 'What Tu Pana noticed', bilingual.headingEn);
check('bilingual: the separator is hidden from assistive technology', bilingual.separatorHidden);
check('bilingual: the rationale label is attributed in both languages', bilingual.summaryEs === 'Por qué esto importa' && bilingual.summaryEn === 'Why this matters');

console.log('\n11. Persistence, reload, and legacy-record compatibility');
// A record in exactly the shape saved BEFORE this refinement is seeded into
// storage first, so it is loaded from disk rather than written beside a live
// session. It must survive untouched, and a structured record added afterwards
// must sit beside it without either one changing the other.
// Seeded with addInitScript so the record is in storage BEFORE the application
// boots — the genuine "returning writer opens the studio" path. Writing it from
// an already-running page would be flushed away by that page's own save on
// unload, which would test the harness rather than the product.
if (page) await page.close();
page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
page.setDefaultTimeout(9000);
page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
page.on('pageerror', error => errors.push(String(error)));
const LEGACY_RECORD = {
        id: 'review-legacy-1', type: 'coach', lens: 'Legacy request', scope: 'full', words: 12,
        exactExcerpt: 'A legacy excerpt.', suggestion: 'Legacy paragraph feedback containing an observation, its reasoning, and a question all at once, exactly as it was stored before this refinement.',
        createdAt: '2026-07-01T12:00:00.000Z', mock: true, provider: 'mock-local', requestKind: 'passage_analysis',
        purpose: 'writing coach question', reviewer: 'Tu Pana mock coach', calls: 1,
        criticalKey: 'thinking', criticalSource: 'fallback', criticalQuestionAsked: null,
        criticalPrompt: 'What is this feedback assuming?', draftSignature: 'legacy', snapshotId: null,
        genre: 'admissions', genreLabel: 'College Personal Statement', question: 'Legacy question?',
};
await page.addInitScript(([key, record]) => {
    localStorage.setItem(key, JSON.stringify({ schema: 1, concept: 'integrated', genre: 'admissions', reviews: [record] }));
    localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
}, [KEY, LEGACY_RECORD]);
await page.goto(`${ORIGIN}/studio.html`);
await page.waitForTimeout(400);
await page.evaluate(() => {
    window.__calls = 0;
    const active = window.StudioProvider.active;
    window.StudioProvider.active = () => {
        const provider = active();
        const call = provider.call.bind(provider);
        return { ...provider, call: (...args) => { window.__calls += 1; return call(...args); } };
    };
});
check('a legacy record loads without any provider call to restructure it',
    await page.evaluate(() => window.__calls) === 0);
await chooseGenre('admissions');
await writeDraft();
await askCoach('What is the weakest sentence here?');
const both = await page.evaluate(() => [...document.querySelectorAll('.dialog .review-card')].map(card => ({
    id: card.dataset.reviewId,
    structured: Boolean(card.querySelector('.feedback-structured')),
    paragraphs: [...card.querySelectorAll(':scope > p')].filter(node => !node.className).map(node => node.textContent.trim()),
    critical: Boolean(card.querySelector('details.critical-moment')),
    decisions: card.querySelectorAll('.decision-button').length,
    title: card.querySelector('h3')?.textContent.trim(),
})));
check('both a legacy and a structured card survive reload', both.length === 2, String(both.length));
const legacyCard = both.find(card => card.id === 'review-legacy-1');
const structuredCard = both.find(card => card.id !== 'review-legacy-1');
check('the legacy record renders as one calm paragraph', legacyCard && !legacyCard.structured && legacyCard.paragraphs.length === 1);
check('the legacy paragraph text is unchanged', /exactly as it was stored before this refinement/.test(legacyCard.paragraphs[0]));
check('the legacy record keeps its own request label', legacyCard.title === 'Legacy request');
check('the legacy record keeps its critical layer and decision controls', legacyCard.critical && legacyCard.decisions === 4);
check('the structured record still renders structured after reload', structuredCard.structured);
reviews = await storedReviews();
const reloadedLegacy = reviews.find(review => review.id === 'review-legacy-1');
check('the legacy record was not mutated on load', reloadedLegacy.structured === undefined && reloadedLegacy.suggestion.startsWith('Legacy paragraph feedback'));
check('the legacy record keeps its own timestamp and snapshot fields', reloadedLegacy.createdAt === '2026-07-01T12:00:00.000Z' && reloadedLegacy.snapshotId === null);
check('the legacy record keeps its stored critical question', reloadedLegacy.criticalPrompt === 'What is this feedback assuming?');
check('exactly one call was made — for the NEW card only, never for the old one', await page.evaluate(() => window.__calls) === 1);

console.log('\n12. Correct association across multiple cards');
await page.locator('.dialog .review-card[data-review-id="review-legacy-1"] .decision-button').first().click();
await page.waitForTimeout(300);
const rationale = page.locator('#decisionRationale');
if (await rationale.count()) {
    await rationale.fill('Testing association.');
    await page.locator('#dialogRoot [data-action="save-integrated-decision"]').click();
    await page.waitForTimeout(400);
}
const decisions = await page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}').decisions || [], KEY);
check('the decision attaches to the card it was made on', decisions.length === 1 && decisions[0].sourceId === 'review-legacy-1', JSON.stringify(decisions.map(d => d.sourceId)));
check('the decision carries that card\'s own suggestion', /exactly as it was stored before this refinement/.test(decisions[0].suggestion));

console.log('\n13. Draft immutability and the duplicate-call guard');
await fresh();
await chooseGenre('admissions');
await writeDraft();
const beforeDraft = await page.evaluate(() => document.querySelector('#draftEditor').value);
await askCoach();
const afterDraft = await page.evaluate(() => document.querySelector('#draftEditor').value);
check('the draft is byte-identical after structured feedback', beforeDraft === afterDraft);
check('the stored draft is byte-identical too', await page.evaluate(key => JSON.parse(localStorage.getItem(key)).draft, KEY) === DRAFT);
// The in-flight guard: a second request while one is pending must not fire.
await page.evaluate(() => { window.__calls = 0; });
await page.locator('[data-action="close-dialog"]').last().click();
await page.waitForTimeout(300);
await page.locator('[data-action="coach"]').first().click();
await page.waitForTimeout(250);
await page.locator('#transmitConsent').check();
const runButton = page.locator('[data-action="submit-mock"]');
await runButton.click();
await runButton.click({ force: true }).catch(() => {});
await page.waitForTimeout(1500);
check('the duplicate-call guard still allows exactly one call', await page.evaluate(() => window.__calls) === 1, String(await page.evaluate(() => window.__calls)));

console.log('\n14. Keyboard operation and accessible disclosure state');
await fresh();
await chooseGenre('admissions');
await writeDraft();
await askCoach();
const keyboard = await page.evaluate(() => {
    const details = document.querySelector('details.feedback-why');
    const summary = details.querySelector('summary');
    return { tag: details.tagName, summaryTag: summary.tagName, initiallyOpen: details.open, focusable: summary.tabIndex >= 0 || summary.tagName === 'SUMMARY' };
});
check('the disclosure is a native <details>/<summary>', keyboard.tag === 'DETAILS' && keyboard.summaryTag === 'SUMMARY');
check('its state is exposed natively rather than by a custom control', keyboard.initiallyOpen === false && keyboard.focusable);
await page.locator('details.feedback-why > summary').focus();
const focusedBefore = await page.evaluate(() => document.activeElement.tagName);
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
check('Enter opens the rationale from the keyboard', await page.evaluate(() => document.querySelector('details.feedback-why').open));
check('focus stays on the control the writer operated', await page.evaluate(() => document.activeElement.tagName) === focusedBefore);
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
check('Enter closes it again', await page.evaluate(() => !document.querySelector('details.feedback-why').open));
check('no CSS animation is attached to the disclosure',
    await page.evaluate(() => {
        const style = getComputedStyle(document.querySelector('details.feedback-why'));
        return style.animationName === 'none' && (style.transitionDuration === '0s' || style.transitionProperty === 'none');
    }));

console.log('\n15. Reduced motion, and the mobile reveal still targets the card');
await fresh();
await page.emulateMedia({ reducedMotion: 'reduce' });
// The genre control is chosen at desk width because the mobile layout moves it
// into Settings; the request itself, and the reveal it triggers, then happen at
// 390×844 — which is what this section is actually about.
await chooseGenre('admissions');
await writeDraft();
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
await askCoach();
const mobile = await page.evaluate(() => {
    const card = document.querySelector('.review-card');
    const dialog = document.querySelector('.dialog');
    const structured = card.querySelector('.feedback-structured');
    const why = card.querySelector('details.feedback-why');
    const body = document.body;
    const footer = document.querySelector('.dialog-footer');
    const observation = card.querySelector('.feedback-observation').getBoundingClientRect();
    const list = card.querySelector('.feedback-questions').getBoundingClientRect();
    const footerBox = footer ? footer.getBoundingClientRect() : null;
    return {
        bodyOverflowsX: body.scrollWidth > window.innerWidth + 1,
        dialogOverflowsX: dialog.scrollWidth > dialog.clientWidth + 1,
        cardOverflowsX: card.scrollWidth > card.clientWidth + 1,
        structuredWidth: structured.getBoundingClientRect().width,
        cardWidth: card.getBoundingClientRect().width,
        whyOpen: why ? why.open : null,
        observationFontSize: parseFloat(getComputedStyle(card.querySelector('.feedback-observation')).fontSize),
        listFontSize: parseFloat(getComputedStyle(card.querySelector('.feedback-questions')).fontSize),
        cardFontSize: parseFloat(getComputedStyle(card).fontSize),
        defaultBlockBottom: list.bottom,
        observationTop: observation.top,
        footerTop: footerBox ? footerBox.top : null,
        freshClass: card.className,
    };
});
check('390×844: the page does not scroll sideways', !mobile.bodyOverflowsX);
check('390×844: the dialog does not scroll sideways', !mobile.dialogOverflowsX);
check('390×844: the card does not scroll sideways', !mobile.cardOverflowsX);
check('390×844: the structured body fits the card width', mobile.structuredWidth <= mobile.cardWidth + 1);
check('390×844: "Why this matters" stays collapsed on mobile', mobile.whyOpen === false);
check('390×844: observation text is NOT shrunk below the card body size', mobile.observationFontSize >= mobile.cardFontSize - 0.01, `${mobile.observationFontSize} vs ${mobile.cardFontSize}`);
check('390×844: question text is NOT shrunk below the card body size', mobile.listFontSize >= mobile.cardFontSize - 0.01, `${mobile.listFontSize} vs ${mobile.cardFontSize}`);
check('390×844: the default block is not obstructed by the sticky footer',
    mobile.footerTop === null || mobile.defaultBlockBottom <= mobile.footerTop + 1,
    `block bottom ${Math.round(mobile.defaultBlockBottom)} vs footer top ${mobile.footerTop === null ? 'n/a' : Math.round(mobile.footerTop)}`);
check('the reveal still finds the structured card by its review id',
    await page.evaluate(() => {
        const id = [...document.querySelectorAll('.review-card')][0].dataset.reviewId;
        const card = document.querySelector(`.dialog .review-card[data-review-id="${id}"]`);
        return Boolean(card) && card.querySelector('h3') !== null && card.querySelector('h3').closest('.review-card') === card;
    }));
check('the reveal announcement region is present', await page.evaluate(() => Boolean(document.querySelector('[role="status"], [aria-live]'))));
await page.emulateMedia({ reducedMotion: null });

console.log('\n16. Genres on the standard coaching path, and the Council boundary');
await page.setViewportSize({ width: 1440, height: 960 });
const GENRES = await (async () => {
    await fresh();
    return page.evaluate(() => Object.keys(window.StudioProfiles.genres));
})();
check('all eleven profiles are present', GENRES.length === 11, String(GENRES.length));
for (const genreId of GENRES) {
    await fresh();
    await chooseGenre(genreId);
    await writeDraft();
    await askCoach();
    const genreShape = await cardShape();
    check(`${genreId}: standard coaching feedback renders structured`, genreShape.hasStructured && genreShape.questions.length >= 1 && genreShape.questions.length <= 3,
        `structured=${genreShape.hasStructured} questions=${genreShape.questions.length}`);
    check(`${genreId}: no scaffolding leaked into the card`, SENTINELS.every(marker => !genreShape.text.includes(marker)));
}

console.log('\n17. Council keeps its own presentation contract');
const council = await page.evaluate(() => ({
    schemaUnchanged: typeof window.StudioCouncil?.validateReviewerPayload === 'function' || typeof window.StudioCouncil === 'object',
    providerHasStructure: typeof window.StudioProvider.validateFeedbackStructure === 'function',
    councilPromptCarriesStructure: window.StudioProvider.buildCouncilReviewerPrompt({
        genreName: 'x', lang: 'en', roleKey: 'structure', roleLabel: 'Structure', draft: 'T', prohibitions: [],
    }).includes('TU PANA FEEDBACK STRUCTURE'),
    synthesisCarriesStructure: window.StudioProvider.buildCouncilSynthesisPrompt({
        genreName: 'x', lang: 'en', validated: { findings: [], preserve: [] },
    }).includes('TU PANA FEEDBACK STRUCTURE'),
    fullDraftCarriesStructure: window.StudioProvider.buildFullDraftPrompt({
        genreName: 'x', lang: 'en', lensLabel: 'L', purpose: 'p', words: 5, text: 'T',
    }).includes('TU PANA FEEDBACK STRUCTURE'),
    passageCarriesStructure: window.StudioProvider.buildPassagePrompt({
        genreName: 'x', lang: 'en', scopeLabel: 'passage', text: 'T', question: 'Q',
    }).includes('TU PANA FEEDBACK STRUCTURE'),
}));
check('the structure contract is NOT added to the Council reviewer prompt', !council.councilPromptCarriesStructure);
check('the structure contract is NOT added to the Council synthesis prompt', !council.synthesisCarriesStructure);
check('the structure contract is NOT added to the whole-draft review contract', !council.fullDraftCarriesStructure);
check('the structure contract IS carried on the standard coaching path', council.passageCarriesStructure);

console.log('\n18. Pinned prompt digests and the reflection contract are unchanged');
const digests = await page.evaluate(async () => {
    const sha = async text => {
        const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    };
    const prompt = window.StudioProvider.buildPassagePrompt({
        genreName: 'x', lang: 'en', scopeLabel: 'passage', text: 'T', question: 'Q',
    });
    return {
        authorship: await sha(prompt.split('\n\n')[0]),
        protocol: await sha(prompt.split('[END SELECTED TEXT]\n\n')[1].split('\n\nSTUDENT REQUEST:')[0]),
        reflectionLast: prompt.trimEnd().endsWith(window.StudioProvider.REFLECTION_CONTRACT.trimEnd()),
        structureBeforeReflection: prompt.indexOf('TU PANA FEEDBACK STRUCTURE') < prompt.indexOf('TU PANA REFLECTION'),
        structureAfterRequest: prompt.indexOf('STUDENT REQUEST:') < prompt.indexOf('TU PANA FEEDBACK STRUCTURE'),
    };
});
check('AUTHORSHIP_RULES transmitted byte-for-byte (sha256)', digests.authorship === 'e55d987d986bd4d389ec2b139f5bcb5d3dc9de1d79dc32564764c0d77babb9d8', digests.authorship);
check('PASSAGE_READING_PROTOCOL transmitted byte-for-byte (sha256)', digests.protocol === 'cdb922d17ca71fddd46245191f4fe71e0047d999ac2105de00e5f0cd8c1e9150', digests.protocol);
check('the reflection contract is still the FINAL block', digests.reflectionLast);
check('the structure contract sits after the request and before the reflection block', digests.structureBeforeReflection && digests.structureAfterRequest);

console.log('\n19. Unit-level contract behaviour');
const units = await page.evaluate(() => {
    const P = window.StudioProvider;
    const build = (noticed, guides, why) => [noticed ? `<<TP-NOTICED: ${noticed}>>` : '']
        .concat(guides.map(guide => `<<TP-GUIDE: ${guide}>>`))
        .concat(why ? [`<<TP-WHY: ${why}>>`] : []).filter(Boolean).join('\n');
    const OBS = 'The middle of the passage stays general where a reader most needs a concrete moment to hold onto, which is what weakens the closing claim.';
    const WHY = 'A reader in this genre grants the claim when the evidence is visible, so a named moment carries more weight than a summary of the category it belongs to.';
    const ok = P.validateFeedbackStructure(P.splitCoachResponse(build(OBS, ['What did you see that morning?', 'Which detail would a reader need?'], WHY)));
    const four = P.validateFeedbackStructure(P.splitCoachResponse(build(OBS, ['A?', 'B?', 'C?', 'D?'].map(q => `${q.repeat(6)}`), WHY)));
    const none = P.validateFeedbackStructure(P.splitCoachResponse(build(OBS, [], WHY)));
    const noStructure = P.validateFeedbackStructure(P.splitCoachResponse('Just prose with no fields at all.'));
    const badWhy = P.validateFeedbackStructure(P.splitCoachResponse(build(OBS, ['What did you see that morning?', 'Which detail would a reader need?'], 'Short.')));
    const split = P.splitCoachResponse(`${build(OBS, ['What did you see that morning?', 'Which detail would a reader need?'], WHY)}\n\n<<TP-LENS: specificity>>\n<<TP-QUESTION: Does this ask for detail you already gave?>>`);
    return {
        okValid: ok.ok, okCount: ok.ok ? ok.questions.length : -1, okWhy: ok.ok ? Boolean(ok.why) : false,
        fourReason: four.reason, noneReason: none.reason, noStructureReason: noStructure.reason,
        badWhyOk: badWhy.ok, badWhyReason: badWhy.ok ? badWhy.whyReason : null,
        splitProse: split.prose, splitLens: split.lensRaw, splitGuides: split.guideRaw.length,
        composed: ok.ok ? P.composeFeedbackText(ok) : '',
    };
});
check('a well-formed block validates', units.okValid && units.okCount === 2 && units.okWhy);
check('a fourth question is rejected by count', units.fourReason === 'question-count');
check('zero questions are rejected by count', units.noneReason === 'question-count');
check('no structure at all reports "missing"', units.noStructureReason === 'missing');
check('a malformed rationale keeps the structure valid', units.badWhyOk && units.badWhyReason === 'length');
check('all five sentinels are stripped from the prose', units.splitProse === '' && units.splitLens === 'specificity' && units.splitGuides === 2);
check('composition is deterministic and contains every part', units.composed.includes('What did you see that morning?') && units.composed.includes('- '));

console.log('\n20. No live traffic, no page errors');
check('no request left this origin', external.length === 0, external.slice(0, 3).join(', '));
check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${failed === 0 ? '✅' : '❌'} ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
