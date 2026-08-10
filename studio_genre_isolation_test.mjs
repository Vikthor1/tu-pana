// W1 — workspace and genre integrity.
//
// WHAT FAILED, AND WHERE THIS SUITE PINS IT
// The Studio partitioned only six fields per genre (`reflections`,
// `reflectionSavedAt`, `finishChecks`, `knowledgeChoice`, `knowledgeChoiceAt`,
// `onboardingSeenAt`). Everything else followed the writer across an assignment
// boundary:
//
//   - `state.draft` followed the writer into another genre and was then coached
//     under THAT genre's rules;
//   - `reviewCopy`, `revisionCycle` and `invitations` were reassigned in place;
//   - `assignmentId` / `assignmentNotice` went stale, describing an assignment
//     that was no longer open;
//   - reviews, Council runs and decisions carried a genre stamp but every
//     listing and count read the flat arrays, so one assignment's Review Center
//     reported another assignment's work;
//   - Your Voice entries carried a genre stamp honoured on only two of their
//     surfaces — so protected wording chosen for one assignment could enter
//     ANOTHER assignment's provider payload;
//   - the genre-switch guard was a ternary with the same expression in both
//     branches, validating nothing;
//   - opening a saved workspace under a different `?assignment=` silently
//     relabelled it.
//
// The founder-ruled behaviour for that last case (VC-OS decisions.log, Decision
// W, pre-gate answer 1) is asserted here in full: never silently relabel,
// reinterpret or mutate; a calm notice with an explicit choice; continuing the
// current workspace is the primary safe action; all existing data preserved
// either way.
//
// WHAT THIS SUITE DELIBERATELY DOES NOT CLAIM
// It does not test import/restore, which is a separate, separately gated track.
// It makes zero provider calls: the only provider path it exercises is the
// local mock, and the payload assertions read the prompt BUILDER's output.
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

async function fresh(query = '') {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(ORIGIN)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(BASE);
    await page.evaluate(([k, t]) => {
        localStorage.removeItem(k);
        localStorage.setItem(t, JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
        localStorage.setItem('tupana_draft', 'R0 GENRE ISOLATION SENTINEL');
    }, [KEY, TOUR_KEY]);
    await page.goto(`${BASE}${query}`);
}

// Seed an exact stored record, then open the Studio on it.
//
// The seed is installed with addInitScript, BEFORE any document script runs,
// and the previous page is closed first. Both details matter: the Studio saves
// on `beforeunload`, so the ordinary "setItem, then navigate" idiom is defeated
// — the outgoing page rewrites the record from its own in-memory state and the
// seed is silently lost. Closing the page (Playwright does not run beforeunload
// on close) and seeding pre-navigation is what makes the seeded record the one
// the Studio actually boots on. The sessionStorage guard keeps a later reload
// in the same tab from re-seeding over work the test just did.
async function seed(record, query = '') {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(ORIGIN)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.addInitScript(([k, t, json]) => {
        if (sessionStorage.getItem('tupana-test-seeded')) return;
        sessionStorage.setItem('tupana-test-seeded', '1');
        localStorage.setItem(k, json);
        localStorage.setItem(t, JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
        localStorage.setItem('tupana_draft', 'R0 GENRE ISOLATION SENTINEL');
    }, [KEY, TOUR_KEY, JSON.stringify(record)]);
    await page.goto(`${BASE}${query}`);
}

const stored = () => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), KEY);

// `savedAt` is a save-time clock stamp, and the Studio has always refreshed it
// on `beforeunload` — a pre-existing behaviour this wave does not touch. Every
// OTHER byte of the record is what "nothing was mutated" has to mean, so the
// comparison canonicalises that one field away rather than pretending it is
// stable. Nothing else is normalised.
const contentOf = async () => {
    const record = await stored();
    if (!record) return null;
    const { savedAt, ...rest } = record;
    return JSON.stringify(rest);
};

async function switchGenre(profileId) {
    await page.locator('select[data-action="genre"]').first().selectOption(profileId);
    await page.waitForTimeout(320);
}

async function typeDraft(text) {
    await page.locator('#draftEditor').fill(text);
    await page.waitForTimeout(320);
}

// One focused review through the LOCAL MOCK provider. This is the ordinary path
// that takes a draft snapshot, so the stamping under test is the stamping the
// product performs rather than something a seed asserted into place.
async function requestMockReview() {
    await page.locator('[data-action="focused-review"]').first().click();
    await page.waitForTimeout(280);
    await page.locator('input[name="reviewScope"][value="full"]').check();
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.waitForTimeout(1100);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
}

const DRAFT_ADM = 'My grandmother counted change on the corner of Southern Boulevard, and I learned arithmetic there.';
const DRAFT_SOP = 'My research question began in a clinic waiting room where no one shared the patients\' language.';
const DRAFT_STEM = 'We measured turbidity at three depths across six weeks and recorded every anomaly as observed.';

// ── 1. The draft is per genre, and byte-preserved ───────────────────────────
console.log('\n1. The draft belongs to its assignment');
await fresh('?assignment=college-personal-statement');
await typeDraft(DRAFT_ADM);
check('the admissions draft is saved under the admissions genre',
    (await stored()).genre === 'admissions' && (await stored()).draft === DRAFT_ADM);

await switchGenre('sop');
check('switching to the Statement of Purpose opens an EMPTY draft, not the other genre\'s writing',
    (await page.locator('#draftEditor').inputValue()) === '');
check('the admissions writing is parked under its own genre, byte for byte',
    (await stored()).genreStates?.admissions?.draft === DRAFT_ADM);

await typeDraft(DRAFT_SOP);
await switchGenre('admissions');
check('switching back restores the admissions draft byte for byte',
    (await page.locator('#draftEditor').inputValue()) === DRAFT_ADM);
check('and the Statement of Purpose draft is parked, byte for byte',
    (await stored()).genreStates?.sop?.draft === DRAFT_SOP);

await page.reload();
await page.waitForTimeout(320);
check('a reload still opens the admissions draft, unchanged',
    (await page.locator('#draftEditor').inputValue()) === DRAFT_ADM);

const afterRoundTrip = await stored();
check('neither draft was rewritten, trimmed, or re-encoded anywhere in the round trip',
    afterRoundTrip.draft === DRAFT_ADM && afterRoundTrip.genreStates.sop.draft === DRAFT_SOP);
check('the storage key and schema version are unchanged',
    afterRoundTrip.schema === 1 && afterRoundTrip.concept === 'integrated');

// ── 2. A three-genre isolation matrix ───────────────────────────────────────
console.log('\n2. Three genres, no bleed in any direction');
await fresh('?assignment=college-personal-statement');
await typeDraft(DRAFT_ADM);
await switchGenre('sop');
await typeDraft(DRAFT_SOP);
await switchGenre('stem');
await typeDraft(DRAFT_STEM);

const matrix = {};
for (const [id, expected] of [['admissions', DRAFT_ADM], ['sop', DRAFT_SOP], ['stem', DRAFT_STEM]]) {
    await switchGenre(id);
    matrix[id] = { seen: await page.locator('#draftEditor').inputValue(), expected };
}
for (const [id, { seen, expected }] of Object.entries(matrix)) {
    check(`${id} shows its own draft and no other genre's`, seen === expected, `${seen.slice(0, 40)}…`);
}
const allThree = await stored();
check('all three drafts survive simultaneously in one record',
    allThree.genreStates.admissions.draft === DRAFT_ADM
    && allThree.genreStates.sop.draft === DRAFT_SOP
    && allThree.draft === DRAFT_STEM,
    JSON.stringify(Object.keys(allThree.genreStates)));

// ── 3. reviewCopy, revisionCycle, invitations, assignmentId all follow suit ──
console.log('\n3. The rest of the workspace is partitioned too');
await seed({
    schema: 1, concept: 'integrated', lang: 'en', genre: 'admissions',
    draft: DRAFT_ADM, createdAt: '2026-08-01T10:00:00.000Z', savedAt: '2026-08-01T10:00:00.000Z',
    versions: [{ id: 'v-adm', signature: '10:x', words: 16, createdAt: '2026-08-01T10:00:00.000Z', reason: 'review copy', text: DRAFT_ADM, genre: 'admissions' }],
    reviewCopy: { snapshotId: 'v-adm', savedAt: '2026-08-01T10:00:00.000Z', genre: 'admissions', genreLabel: 'College personal statement' },
    revisionCycle: { focus: 'Tighten the opening paragraph.', closure: '', selectedSuggestion: null, updatedAt: '2026-08-01T10:00:00.000Z' },
    invitations: { moveReview: { moveKey: 'admissions:scene', createdAt: '2026-08-01T10:00:00.000Z', dismissed: false, draftSignature: 'x' }, finishReflection: null },
    assignmentId: 'college-personal-statement', assignmentNotice: null,
    reviews: [], decisions: [], councilRuns: [], voiceEntries: [], protectedPhrases: [],
    reflections: { changed: '', decision: '', voice: '', knowledge: '' }, finishChecks: {}, genreStates: {},
    notebookEntries: {}, notebookCoachRuns: [], moveNotes: {}, criticalViews: [], artifacts: {},
});
await switchGenre('sop');
const onSop = await stored();
check('the review copy does not follow into another assignment', onSop.reviewCopy === null, JSON.stringify(onSop.reviewCopy));
check('the revision focus does not follow', !onSop.revisionCycle?.focus, JSON.stringify(onSop.revisionCycle));
check('the move-review invitation does not follow', onSop.invitations?.moveReview === null, JSON.stringify(onSop.invitations));
check('the assignment id does not go stale — it is cleared, not carried', onSop.assignmentId === null, String(onSop.assignmentId));
check('all four are parked under the admissions genre, intact',
    onSop.genreStates.admissions.reviewCopy?.snapshotId === 'v-adm'
    && onSop.genreStates.admissions.revisionCycle.focus === 'Tighten the opening paragraph.'
    && onSop.genreStates.admissions.invitations.moveReview?.moveKey === 'admissions:scene'
    && onSop.genreStates.admissions.assignmentId === 'college-personal-statement');

await switchGenre('admissions');
const backOnAdm = await stored();
check('returning restores the review copy, revision focus, invitation and assignment id',
    backOnAdm.reviewCopy?.snapshotId === 'v-adm'
    && backOnAdm.revisionCycle.focus === 'Tighten the opening paragraph.'
    && backOnAdm.invitations.moveReview?.moveKey === 'admissions:scene'
    && backOnAdm.assignmentId === 'college-personal-statement');

// The assignment NOTICE is genre-scoped too: the CAP 200 legacy link carries one.
await fresh('?assignment=cap-200-first-draft');
check('the CAP 200 legacy link still carries its notice', Boolean((await stored()).assignmentNotice));
await switchGenre('admissions');
check('the notice does not describe an assignment that is no longer open',
    (await stored()).assignmentNotice === null);
await switchGenre('cap200');
check('and it returns with its own assignment', Boolean((await stored()).assignmentNotice));

// ── 4. Records written before the partition widened still open correctly ────
console.log('\n4. Existing saved records are compatible');
const LEGACY = {
    schema: 1, concept: 'integrated', lang: 'en', genre: 'admissions',
    draft: DRAFT_ADM, createdAt: '2026-07-01T09:00:00.000Z', savedAt: '2026-07-01T09:00:00.000Z',
    // The OLD six-field shape, exactly as it was written before this change.
    genreStates: { sop: { reflections: { changed: 'I reordered two paragraphs.', decision: '', voice: '', knowledge: '' }, reflectionSavedAt: '2026-07-01T09:00:00.000Z', finishChecks: { one: true }, knowledgeChoice: null, knowledgeChoiceAt: null, onboardingSeenAt: null } },
    reviews: [], decisions: [], councilRuns: [], versions: [], voiceEntries: [], protectedPhrases: [],
    reflections: { changed: '', decision: '', voice: '', knowledge: '' }, finishChecks: {},
    notebookEntries: {}, notebookCoachRuns: [], moveNotes: {}, criticalViews: [], artifacts: {},
};
await seed(LEGACY);
check('a legacy record opens with its draft intact',
    (await page.locator('#draftEditor').inputValue()) === DRAFT_ADM);
await switchGenre('sop');
check('a legacy six-field genre entry still restores its reflections',
    (await stored()).reflections.changed === 'I reordered two paragraphs.');
check('a legacy entry with no draft key restores an empty draft, not another genre\'s writing',
    (await page.locator('#draftEditor').inputValue()) === '');
check('the writing the legacy record held is parked under the genre that was active, not lost',
    (await stored()).genreStates.admissions.draft === DRAFT_ADM);
await switchGenre('admissions');
check('and it comes back byte for byte',
    (await page.locator('#draftEditor').inputValue()) === DRAFT_ADM);

// ── 5. Your Voice is active-genre only, on every surface and in the payload ──
console.log('\n5. Your Voice never crosses an assignment boundary');
const VOICE_ADM = 'aqui escuchamos primero';
const VOICE_SOP = 'the clinic had no interpreter that morning';
const VOICE_LEGACY = 'a sentence saved before genres were stamped';
await seed({
    schema: 1, concept: 'integrated', lang: 'en', genre: 'admissions',
    draft: DRAFT_ADM, createdAt: '2026-08-01T10:00:00.000Z', savedAt: '2026-08-01T10:00:00.000Z',
    voiceEntries: [
        { id: 'v1', text: VOICE_ADM, protectedAt: '2026-08-01T10:00:00.000Z', genre: 'admissions', reason: '' },
        { id: 'v2', text: VOICE_SOP, protectedAt: '2026-08-01T10:01:00.000Z', genre: 'sop', reason: '' },
        { id: 'v3', text: VOICE_LEGACY, protectedAt: '2026-07-01T10:00:00.000Z', reason: '' },
    ],
    protectedPhrases: [],
    reviews: [], decisions: [], councilRuns: [], versions: [], genreStates: {},
    reflections: { changed: '', decision: '', voice: '', knowledge: '' }, finishChecks: {},
    notebookEntries: {}, notebookCoachRuns: [], moveNotes: {}, criticalViews: [], artifacts: {},
});
// textContent, not innerText: the Your Voice reference lives inside a <details>,
// and collapsed text is still in the DOM. The strong claim for a leak test is
// that the other assignment's wording is not in the document AT ALL — not
// merely that it is currently folded away.
const admDom = await page.evaluate(() => document.body.textContent);
check('the admissions workspace carries the admissions entry', admDom.includes(VOICE_ADM));
check('the admissions workspace does NOT carry the Statement of Purpose entry anywhere in its DOM',
    !admDom.includes(VOICE_SOP));
check('an entry saved before genre stamping stays present under every genre', admDom.includes(VOICE_LEGACY));
// And it is genuinely readable, not just present: open the reference panel.
await page.locator('.your-voice-reference > summary').click();
await page.waitForTimeout(200);
const voicePanel = await page.locator('.your-voice-reference').innerText();
check('the opened Your Voice panel reads only this assignment\'s entries',
    voicePanel.includes(VOICE_ADM) && voicePanel.includes(VOICE_LEGACY) && !voicePanel.includes(VOICE_SOP),
    voicePanel);
check('and its count matches what it lists', /·\s*2\b/.test(voicePanel), voicePanel.split('\n')[0]);

// The exact consent preview a writer reads before opting in. The offer is a
// collapsed <details>; open it so the preview is read as the writer reads it.
await page.locator('[data-action="focused-review"]').click();
await page.waitForTimeout(280);
await page.locator('.voice-constraint > summary').click();
await page.waitForTimeout(200);
const previewText = await page.locator('.voice-entry-preview').innerText();
check('the exact consent preview lists only this assignment\'s entries',
    previewText.includes(VOICE_ADM) && !previewText.includes(VOICE_SOP), previewText);

// The payload itself — read from the real prompt builder, no request issued.
// Both builders are wrapped: a full-draft scope routes through
// buildFullDraftPrompt and a passage scope through buildPassagePrompt, and the
// claim under test — what protected wording reaches the provider — has to hold
// on whichever one the writer's chosen scope selects.
await page.evaluate(() => {
    window.__sent = [];
    for (const name of ['buildPassagePrompt', 'buildFullDraftPrompt']) {
        const original = window.StudioProvider[name];
        window.StudioProvider[name] = payload => { const p = original(payload); window.__sent.push(payload); return p; };
    }
});
await page.locator('#includeVoiceEntries').check();
await page.locator('input[name="reviewScope"][value="full"]').check();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(700);
const sentPayload = await page.evaluate(() => window.__sent[0] || null);
check('exactly one prompt was built for this request', (await page.evaluate(() => window.__sent.length)) === 1);
const sentTexts = (sentPayload?.voiceEntries || []).map(e => e.text);
check('the provider payload carries this assignment\'s protected wording',
    sentTexts.includes(VOICE_ADM), JSON.stringify(sentTexts));
check('the provider payload carries NO other assignment\'s protected wording',
    !sentTexts.includes(VOICE_SOP), JSON.stringify(sentTexts));
check('an unstamped legacy entry is still honoured', sentTexts.includes(VOICE_LEGACY));

const afterVoice = await stored();
check('every Your Voice record and its genre stamp survives — nothing was deleted or restamped',
    afterVoice.voiceEntries.length === 3
    && afterVoice.voiceEntries.map(e => e.genre).join(',') === 'admissions,sop,',
    JSON.stringify(afterVoice.voiceEntries.map(e => [e.id, e.genre])));

// Index provenance: the note control must open the entry it names.
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
await page.locator('.your-voice-reference > summary').click();
await page.waitForTimeout(200);
await page.locator('.your-voice-reference [data-action="voice-note"]').first().click();
await page.waitForTimeout(280);
const quoted = await page.locator('.voice-entry-quote').innerText();
check('opening a Your Voice note opens the entry that was displayed, not a shifted index',
    quoted.includes(VOICE_ADM), quoted);
await page.keyboard.press('Escape');

// ── 6. Saved reports and decisions are listed per assignment ────────────────
console.log('\n6. The Review Center reports this assignment\'s work');
const review = (id, genre) => ({
    id, type: 'focused', lens: 'Structure', scope: 'paragraph', words: 12,
    suggestion: `Suggestion recorded for ${genre}.`, createdAt: '2026-08-01T10:00:00.000Z',
    mock: true, provider: 'mock-local', requestKind: 'passage_analysis', genre,
    genreLabel: genre, genreLabelEs: genre, calls: 1,
});
await seed({
    schema: 1, concept: 'integrated', lang: 'en', genre: 'admissions',
    draft: DRAFT_ADM, createdAt: '2026-08-01T10:00:00.000Z', savedAt: '2026-08-01T10:00:00.000Z',
    reviews: [review('r-adm', 'admissions'), review('r-sop', 'sop'), review('r-legacy', undefined)],
    decisions: [
        { id: 'd1', sourceId: 'r-adm', suggestionIndex: 0, choice: 'accept', choiceLabel: 'Accept', sourceType: 'Focused review', suggestion: 'x', createdAt: '2026-08-01T10:00:00.000Z', genre: 'admissions', studentAuthored: true },
        { id: 'd2', sourceId: 'r-sop', suggestionIndex: 0, choice: 'reject', choiceLabel: 'Reject', sourceType: 'Focused review', suggestion: 'y', createdAt: '2026-08-01T10:00:00.000Z', genre: 'sop', studentAuthored: true },
    ],
    councilRuns: [], versions: [], voiceEntries: [], protectedPhrases: [], genreStates: {},
    reflections: { changed: '', decision: '', voice: '', knowledge: '' }, finishChecks: {},
    notebookEntries: {}, notebookCoachRuns: [], moveNotes: {}, criticalViews: [], artifacts: {},
});
await page.locator('[data-action="review-center"]').first().click();
await page.waitForTimeout(320);
const centerText = await page.locator('.dialog').innerText();
check('the Review Center shows this assignment\'s report', centerText.includes('Suggestion recorded for admissions.'));
check('the Review Center does NOT show another assignment\'s report', !centerText.includes('Suggestion recorded for sop.'));
check('an unstamped legacy report stays visible', centerText.includes('Suggestion recorded for undefined.'));
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

await switchGenre('sop');
await page.locator('[data-action="review-center"]').first().click();
await page.waitForTimeout(320);
const sopCenter = await page.locator('.dialog').innerText();
check('after switching, the other assignment\'s report is the one shown',
    sopCenter.includes('Suggestion recorded for sop.') && !sopCenter.includes('Suggestion recorded for admissions.'));
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

const recordsIntact = await stored();
check('no saved report or decision was deleted, moved, or restamped by any of this',
    recordsIntact.reviews.length === 3 && recordsIntact.decisions.length === 2
    && recordsIntact.reviews.map(r => r.id).join(',') === 'r-adm,r-sop,r-legacy');

// ── 7. A link that disagrees with the workspace: Decision W's ruling ────────
console.log('\n7. A different ?assignment= never relabels a saved workspace');
await fresh('?assignment=college-personal-statement');
await typeDraft(DRAFT_ADM);
const beforeLink = await contentOf();

await page.goto(`${BASE}?assignment=graduate-sop`);
await page.waitForTimeout(420);
check('a calm notice appears instead of a silent switch',
    await page.locator('[data-action="assignment-keep-current"]').count() === 1);
const noticeText = await page.locator('.dialog').innerText();
check('the notice names both assignments', /personal statement/i.test(noticeText) && /purpose/i.test(noticeText), noticeText);
check('the notice states that nothing has been changed', /nothing has been changed/i.test(noticeText), noticeText);
check('continuing the current workspace is presented as the primary action',
    await page.locator('.button.primary[data-action="assignment-keep-current"]').count() === 1);
check('opening the requested assignment is offered as the secondary action',
    await page.locator('.button.secondary[data-action="assignment-open-requested"]').count() === 1);
check('NOTHING was written — every byte of the record except the save clock is identical',
    (await contentOf()) === beforeLink);
check('the workspace is still the one the writer was in', (await stored()).genre === 'admissions');

await page.reload();
await page.waitForTimeout(420);
check('reloading the same link asks again rather than acting',
    await page.locator('[data-action="assignment-keep-current"]').count() === 1);
check('and still writes nothing', (await contentOf()) === beforeLink);

await page.locator('[data-action="assignment-keep-current"]').click();
await page.waitForTimeout(320);
check('choosing to continue closes the notice', await page.locator('.dialog').count() === 0);
check('choosing to continue changes nothing at all', (await contentOf()) === beforeLink);
check('the admissions draft is still on screen, byte for byte',
    (await page.locator('#draftEditor').inputValue()) === DRAFT_ADM);

// Now the other founder-approved choice.
await page.goto(`${BASE}?assignment=graduate-sop`);
await page.waitForTimeout(420);
await page.locator('[data-action="assignment-open-requested"]').click();
await page.waitForTimeout(420);
const afterOpen = await stored();
check('choosing to open the requested assignment switches to it', afterOpen.genre === 'sop');
check('and records the requested assignment id', afterOpen.assignmentId === 'graduate-sop');
check('the requested assignment opens empty, not with the other genre\'s writing',
    (await page.locator('#draftEditor').inputValue()) === '');
check('the previous workspace is preserved whole, byte for byte',
    afterOpen.genreStates.admissions.draft === DRAFT_ADM
    && afterOpen.genreStates.admissions.assignmentId === 'college-personal-statement');
await switchGenre('admissions');
check('and the writer can return to it unchanged',
    (await page.locator('#draftEditor').inputValue()) === DRAFT_ADM);

// A link matching the workspace is not a mismatch and must not interrupt.
await fresh('?assignment=college-personal-statement');
await typeDraft(DRAFT_ADM);
await page.goto(`${BASE}?assignment=college-personal-statement`);
await page.waitForTimeout(400);
check('re-opening the SAME assignment link shows no notice and keeps working',
    await page.locator('[data-action="assignment-keep-current"]').count() === 0
    && (await page.locator('#draftEditor').inputValue()) === DRAFT_ADM);

// An empty workspace has nothing to relabel, so a link may simply open.
await fresh('?assignment=college-personal-statement');
await page.goto(`${BASE}?assignment=graduate-sop`);
await page.waitForTimeout(400);
check('an untouched workspace opens the requested assignment without an interruption',
    await page.locator('[data-action="assignment-keep-current"]').count() === 0
    && (await stored()).genre === 'sop');

// ── 8. Unknown routes still fail closed, with no silent default ─────────────
console.log('\n8. Unknown genres and assignments fail closed');
await fresh('?assignment=definitely-not-configured');
const stopText = await page.locator('#prototypeRoot').innerText();
check('an unknown assignment reaches the configuration-required stop',
    /CONFIGURATION REQUIRED|CONFIGURACIÓN/i.test(stopText));
check('and inherits no genre\'s Moves', await page.locator('.integrated-move').count() === 0);
check('and does not silently become a configured genre',
    (await stored()).genre === 'unconfigured:definitely-not-configured');

// Defence in depth: the select only offers configured profiles, so an
// unrecognised value can only arrive by injection — and must still fail closed.
await fresh('?assignment=college-personal-statement');
await typeDraft(DRAFT_ADM);
await page.evaluate(() => {
    const select = document.querySelector('select[data-action="genre"]');
    const rogue = document.createElement('option');
    rogue.value = 'not-a-real-profile';
    select.appendChild(rogue);
    select.value = 'not-a-real-profile';
    select.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.waitForTimeout(360);
check('an unrecognised genre value fails closed rather than defaulting silently',
    (await stored()).genre === 'unconfigured:not-a-real-profile', (await stored()).genre);
check('the configuration-required stop is what the writer sees',
    /CONFIGURATION REQUIRED|CONFIGURACIÓN/i.test(await page.locator('#prototypeRoot').innerText()));
check('the writing that was open is parked, not destroyed',
    (await stored()).genreStates.admissions.draft === DRAFT_ADM);

// ── 9. Draft snapshots belong to the assignment that wrote them ─────────────
// A snapshot carries the writer's EXACT PRIOR TEXT, so a cross-genre listing
// would not merely miscount — it would show one assignment's writing inside
// another. This section drives real checkpoints through the ordinary review
// path rather than seeding them, so the stamping under test is the stamping the
// product actually performs.
console.log('\n9. Draft snapshots are per assignment');
await fresh('?assignment=college-personal-statement');
await typeDraft(DRAFT_ADM);
await requestMockReview();
await switchGenre('sop');
await typeDraft(DRAFT_SOP);
await requestMockReview();

const bothSnapshots = await stored();
check('each assignment holds its own exact snapshot',
    bothSnapshots.versions.length === 2
    && bothSnapshots.versions.filter(v => v.genre === 'admissions').length === 1
    && bothSnapshots.versions.filter(v => v.genre === 'sop').length === 1,
    JSON.stringify(bothSnapshots.versions.map(v => [v.genre, v.words])));
check('the two snapshots have distinct identities',
    bothSnapshots.versions[0].id !== bothSnapshots.versions[1].id);
check('each snapshot stored its own assignment\'s exact text',
    bothSnapshots.versions.find(v => v.genre === 'admissions').text === DRAFT_ADM
    && bothSnapshots.versions.find(v => v.genre === 'sop').text === DRAFT_SOP);

// On the Statement of Purpose: counts, history, and the DOM.
const sopEvidence = await page.locator('.integrated-support').innerText();
check('the SOP evidence panel counts one snapshot, not two', /1 recoverable draft snapshot/.test(sopEvidence), sopEvidence.match(/\d+ recoverable draft snapshots?/)?.[0]);
await page.locator('[data-action="version-history"]').first().click();
await page.waitForTimeout(300);
const sopHistory = await page.locator('.dialog').innerText();
check('SOP Draft history lists exactly one snapshot', (await page.locator('.dialog .version-row').count()) === 1);
check('SOP Draft history does not name the admissions snapshot', !sopHistory.includes(DRAFT_ADM.slice(0, 40)));
await page.locator('.dialog [data-action="view-snapshot"]').first().click();
await page.waitForTimeout(280);
check('the SOP snapshot viewer shows SOP text', (await page.locator('#snapshotText').textContent()) === DRAFT_SOP);
check('and the admissions draft text is absent from the entire SOP DOM',
    !(await page.evaluate(() => document.body.textContent)).includes(DRAFT_ADM));
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
await page.locator('[data-action="my-work"]').first().click().catch(() => {});
await page.waitForTimeout(300);
if (await page.locator('.dialog').count()) {
    const myWork = await page.locator('.dialog').innerText();
    check('My Work counts only this assignment\'s snapshots and reports', /\b1\b/.test(myWork), myWork.slice(0, 160));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
}

await switchGenre('admissions');
const admEvidence = await page.locator('.integrated-support').innerText();
check('switching back restores the admissions snapshot count', /1 recoverable draft snapshot/.test(admEvidence));
await page.locator('[data-action="version-history"]').first().click();
await page.waitForTimeout(300);
check('admissions Draft history lists exactly its own one snapshot', (await page.locator('.dialog .version-row').count()) === 1);
await page.locator('.dialog [data-action="view-snapshot"]').first().click();
await page.waitForTimeout(280);
check('the admissions snapshot viewer shows admissions text unchanged', (await page.locator('#snapshotText').textContent()) === DRAFT_ADM);
check('and the SOP draft text is absent from the entire admissions DOM',
    !(await page.evaluate(() => document.body.textContent)).includes(DRAFT_SOP));
await page.keyboard.press('Escape');
await page.waitForTimeout(200);

const afterSnapshotTour = await stored();
check('no snapshot, review, or record was deleted, rewritten, restamped, or duplicated',
    afterSnapshotTour.versions.length === 2
    && afterSnapshotTour.reviews.length === 2
    && JSON.stringify(afterSnapshotTour.versions.map(v => [v.id, v.genre, v.text]))
        === JSON.stringify(bothSnapshots.versions.map(v => [v.id, v.genre, v.text])));

// ── 10. Identical text in two assignments keeps distinct snapshot identity ───
// The de-duplication target used to be `versions.at(-1)` — the last snapshot in
// the flat array, whichever assignment wrote it — so identical text in a second
// assignment silently reused the FIRST assignment's snapshot id.
console.log('\n10. Identical text never reuses another assignment\'s snapshot');
const SAME = 'This paragraph is deliberately identical in both assignments so signatures collide.';
await fresh('?assignment=college-personal-statement');
await typeDraft(SAME);
await requestMockReview();
await switchGenre('sop');
await typeDraft(SAME);
await requestMockReview();
const collided = await stored();
const admSnap = collided.versions.find(v => v.genre === 'admissions');
const sopSnap = collided.versions.find(v => v.genre === 'sop');
check('both assignments produced a snapshot despite identical text',
    collided.versions.length === 2 && Boolean(admSnap) && Boolean(sopSnap),
    JSON.stringify(collided.versions.map(v => v.genre)));
check('their signatures genuinely collide (the hazard is real, not hypothetical)',
    admSnap.signature === sopSnap.signature, `${admSnap.signature}`);
check('and yet their identities are distinct — no cross-genre reuse',
    admSnap.id !== sopSnap.id, `${admSnap.id} vs ${sopSnap.id}`);
check('each assignment\'s review points at its OWN snapshot',
    collided.reviews.find(r => r.genre === 'admissions').snapshotId === admSnap.id
    && collided.reviews.find(r => r.genre === 'sop').snapshotId === sopSnap.id);

// A repeat checkpoint WITHIN one assignment still de-duplicates as before.
await requestMockReview();
const repeated = await stored();
check('an unchanged draft still reuses its own assignment\'s snapshot',
    repeated.versions.length === 2, `${repeated.versions.length}`);

// ── 11. An unstamped legacy snapshot is visible but never a reuse target ─────
console.log('\n11. Legacy unstamped snapshots keep their compatibility rule');
await seed({
    schema: 1, concept: 'integrated', lang: 'en', genre: 'admissions',
    draft: SAME, createdAt: '2026-07-01T09:00:00.000Z', savedAt: '2026-07-01T09:00:00.000Z',
    versions: [{ id: 'legacy-unstamped', signature: `${SAME.length}:${SAME.slice(0, 24)}`, words: 13, createdAt: '2026-07-01T09:00:00.000Z', reason: 'legacy checkpoint', text: SAME }],
    reviews: [], decisions: [], councilRuns: [], voiceEntries: [], protectedPhrases: [], genreStates: {},
    reflections: { changed: '', decision: '', voice: '', knowledge: '' }, finishChecks: {},
    notebookEntries: {}, notebookCoachRuns: [], moveNotes: {}, criticalViews: [], artifacts: {},
});
const legacyVisible = await page.locator('.integrated-support').innerText();
check('an unstamped legacy snapshot is still counted under the active assignment',
    /1 recoverable draft snapshot/.test(legacyVisible), legacyVisible.match(/\d+ recoverable draft snapshots?/)?.[0]);
await requestMockReview();
const afterLegacy = await stored();
check('a new stamped snapshot is written rather than reusing the unstamped legacy one',
    afterLegacy.versions.length === 2
    && afterLegacy.versions.some(v => v.id === 'legacy-unstamped' && !v.genre)
    && afterLegacy.versions.some(v => v.genre === 'admissions'),
    JSON.stringify(afterLegacy.versions.map(v => [v.id, v.genre ?? null])));
check('the legacy record was not rewritten, stamped, or migrated',
    JSON.stringify(afterLegacy.versions.find(v => v.id === 'legacy-unstamped'))
        === JSON.stringify({ id: 'legacy-unstamped', signature: `${SAME.length}:${SAME.slice(0, 24)}`, words: 13, createdAt: '2026-07-01T09:00:00.000Z', reason: 'legacy checkpoint', text: SAME }));
await switchGenre('sop');
check('and it stays visible under a different assignment too, as legacy records always have',
    /1 recoverable draft snapshot/.test(await page.locator('.integrated-support').innerText()));

// ── 12. The mismatch predicate covers ALL active writer work ────────────────
// The notice must fire on work the writer would recognise as theirs, and must
// NOT fire on system bookkeeping or on work parked under another assignment.
console.log('\n12. The mismatch notice follows the writer\'s work, not bookkeeping');

const emptyish = {
    schema: 1, concept: 'integrated', lang: 'en', genre: 'admissions',
    draft: '', createdAt: '2026-08-01T10:00:00.000Z', savedAt: '2026-08-01T10:00:00.000Z',
    versions: [], reviews: [], decisions: [], councilRuns: [], voiceEntries: [], protectedPhrases: [],
    reflections: { changed: '', decision: '', voice: '', knowledge: '' }, finishChecks: {},
    revisionCycle: { focus: '', closure: '', selectedSuggestion: null, updatedAt: null },
    invitations: { moveReview: null, finishReflection: null },
    notebookEntries: {}, notebookCoachRuns: [], moveNotes: {}, criticalViews: [], artifacts: {},
    genreStates: {},
};
const noticeShows = async () => (await page.locator('[data-action="assignment-keep-current"]').count()) === 1;

// (a) Reflection-only work must ask.
await seed({ ...emptyish, reflections: { changed: 'I reordered my second and third paragraphs.', decision: '', voice: '', knowledge: '' } },
    '?assignment=graduate-sop');
await page.waitForTimeout(360);
check('reflection-only work triggers the choice notice', await noticeShows());
check('and nothing was written for it', (await stored()).genre === 'admissions');

// (b) Revision-cycle work must ask.
await seed({ ...emptyish, revisionCycle: { focus: 'Try naming the moment instead of summarising it.', closure: '', selectedSuggestion: null, updatedAt: '2026-08-01T10:00:00.000Z' } },
    '?assignment=graduate-sop');
await page.waitForTimeout(360);
check('revision-choice-only work triggers the choice notice', await noticeShows());
check('and nothing was written for it', (await stored()).genre === 'admissions');

// (c) A brief revision note alone must ask.
await seed({ ...emptyish, revisionCycle: { focus: '', closure: 'I kept the phrase that sounded like me.', selectedSuggestion: null, updatedAt: '2026-08-01T10:00:00.000Z' } },
    '?assignment=graduate-sop');
await page.waitForTimeout(360);
check('revision-note-only work triggers the choice notice', await noticeShows());

// (d) A protected Your Voice entry alone must ask.
await seed({ ...emptyish, voiceEntries: [{ id: 'v1', text: 'aqui escuchamos primero', protectedAt: '2026-08-01T10:00:00.000Z', genre: 'admissions', reason: '' }] },
    '?assignment=graduate-sop');
await page.waitForTimeout(360);
check('a protected Your Voice entry alone triggers the choice notice', await noticeShows());

// (e) System bookkeeping alone must NOT ask.
await seed({ ...emptyish, assignmentId: 'college-personal-statement', onboardingSeenAt: '2026-08-01T10:00:00.000Z',
    invitations: { moveReview: { moveKey: 'admissions:scene', createdAt: '2026-08-01T10:00:00.000Z', dismissed: false, draftSignature: 'stale' }, finishReflection: null } },
    '?assignment=graduate-sop');
await page.waitForTimeout(360);
check('an assignment id, an onboarding timestamp and an unanswered invitation are NOT writer work',
    !(await noticeShows()) && (await stored()).genre === 'sop');

// (f) Work parked under ANOTHER assignment, with the active one truly empty.
await seed({
    ...emptyish, genre: 'sop', draft: '',
    genreStates: {
        admissions: {
            reflections: { changed: '', decision: '', voice: '', knowledge: '' }, reflectionSavedAt: null,
            finishChecks: {}, knowledgeChoice: null, knowledgeChoiceAt: null, onboardingSeenAt: null,
            draft: DRAFT_ADM, reviewCopy: null,
            revisionCycle: { focus: '', closure: '', selectedSuggestion: null, updatedAt: null },
            invitations: { moveReview: null, finishReflection: null },
            assignmentId: 'college-personal-statement', assignmentNotice: null,
        },
    },
}, '?assignment=stem-lab-report');
await page.waitForTimeout(400);
check('an empty active assignment follows a valid link silently, even with work parked elsewhere',
    !(await noticeShows()) && (await stored()).genre === 'stem');
check('and the parked work is byte-identical afterwards',
    (await stored()).genreStates.admissions.draft === DRAFT_ADM);
check('the parked assignment id is untouched too',
    (await stored()).genreStates.admissions.assignmentId === 'college-personal-statement');

// (g) A durable student selection alone must ask.
await seed({ ...emptyish, finishChecks: { 'exact-version': true } }, '?assignment=graduate-sop');
await page.waitForTimeout(360);
check('a durable finish-check selection alone triggers the choice notice', await noticeShows());

// ── 13. Historical cross-genre snapshot references stay closed ──────────────
// THE DEFECT THIS PINS, AND WHY FILTERING LISTINGS WAS NOT ENOUGH.
// Before W1 the draft followed the writer across a genre switch, and
// checkpointVersion() reused the last GLOBAL snapshot whenever the signature
// matched. Existing browser records can therefore already contain a shape that
// no new record can reach: a review stamped for one assignment whose
// `snapshotId` points at a snapshot stamped for ANOTHER. Listing filters do not
// close that door, because the review is legitimately visible under its own
// assignment — it is the ID it carries that crosses the boundary. Resolution is
// global by necessity (identity), so ownership has to be checked at the moment
// of EXPOSURE.
//
// This section seeds exactly that historical shape and proves the boundary
// holds at every exposure point, including handlers invoked defensively rather
// than through the interface.
console.log('\n13. Historical cross-genre snapshot references cannot expose foreign text');

const ADM_SECRET = 'ADMISSIONS_ONLY_MARKER my grandmother counted change on Southern Boulevard and I learned arithmetic there.';
const SOP_OWN = 'SOP_OWN_MARKER my research question began in a clinic waiting room with no interpreter present.';
const LEGACY_TEXT = 'LEGACY_UNSTAMPED_MARKER a checkpoint written before snapshots carried a genre stamp at all.';
const sig = t => `${t.length}:${t.slice(0, 24)}`;

const HISTORICAL = {
    schema: 1, concept: 'integrated', lang: 'en', genre: 'sop',
    draft: SOP_OWN, createdAt: '2026-07-01T09:00:00.000Z', savedAt: '2026-07-01T09:00:00.000Z',
    versions: [
        { id: 'v-adm-hist', signature: sig(ADM_SECRET), words: 16, createdAt: '2026-07-01T09:00:00.000Z', reason: 'before Council review', text: ADM_SECRET, genre: 'admissions', genreLabel: 'Mixed-genre autobiographical essay', genreLabelEs: 'Ensayo autobiográfico de género mixto' },
        { id: 'v-sop-own', signature: sig(SOP_OWN), words: 15, createdAt: '2026-07-02T09:00:00.000Z', reason: 'before Council review', text: SOP_OWN, genre: 'sop', genreLabel: 'Graduate statement of purpose', genreLabelEs: 'Declaración de propósito' },
        { id: 'v-legacy', signature: sig(LEGACY_TEXT), words: 15, createdAt: '2026-06-01T09:00:00.000Z', reason: 'legacy checkpoint', text: LEGACY_TEXT },
    ],
    reviews: [
        // The historical defect: stamped SOP, pointing at the admissions snapshot.
        { id: 'r-crosslink', type: 'focused', lens: 'Structure', scope: 'full', words: 15, suggestion: 'CROSSLINK_REVIEW_MARKER a saved suggestion from the pre-W1 era.', createdAt: '2026-07-03T09:00:00.000Z', mock: true, provider: 'mock-local', requestKind: 'full_draft_review', genre: 'sop', genreLabel: 'Graduate statement of purpose', genreLabelEs: 'Declaración de propósito', calls: 1, snapshotId: 'v-adm-hist' },
        // A correctly owned SOP review, to prove the guard is not a blanket ban.
        { id: 'r-owned', type: 'focused', lens: 'Evidence', scope: 'full', words: 15, suggestion: 'OWNED_REVIEW_MARKER a saved suggestion that points at its own snapshot.', createdAt: '2026-07-04T09:00:00.000Z', mock: true, provider: 'mock-local', requestKind: 'full_draft_review', genre: 'sop', genreLabel: 'Graduate statement of purpose', genreLabelEs: 'Declaración de propósito', calls: 1, snapshotId: 'v-sop-own' },
        // A legacy review pointing at the unstamped legacy snapshot.
        { id: 'r-legacy', type: 'focused', lens: 'Voice', scope: 'full', words: 15, suggestion: 'LEGACY_REVIEW_MARKER a saved suggestion from before genre stamping.', createdAt: '2026-06-02T09:00:00.000Z', mock: true, provider: 'mock-local', requestKind: 'full_draft_review', calls: 1, snapshotId: 'v-legacy' },
    ],
    // The review copy carries the same historical cross-link.
    reviewCopy: { snapshotId: 'v-adm-hist', savedAt: '2026-07-03T09:00:00.000Z', genre: 'sop', genreLabel: 'Graduate statement of purpose', genreLabelEs: 'Declaración de propósito' },
    decisions: [], councilRuns: [], voiceEntries: [], protectedPhrases: [], genreStates: {},
    reflections: { changed: '', decision: '', voice: '', knowledge: '' }, finishChecks: {},
    revisionCycle: { focus: '', closure: '', selectedSuggestion: null, updatedAt: null },
    invitations: { moveReview: null, finishReflection: null },
    notebookEntries: {}, notebookCoachRuns: [], moveNotes: {}, criticalViews: [], artifacts: {},
};
const HISTORICAL_JSON = JSON.stringify(HISTORICAL);
const NOTICE_EN = 'The draft checkpoint linked to this saved record belongs to another writing project, so it is not shown here. Nothing was deleted or changed.';

await seed(HISTORICAL);
// Observe the clipboard and the execCommand fallback without granting real
// clipboard access, so a write is provable rather than merely unobserved.
async function installClipboardSpy() {
    await page.evaluate(() => {
        window.__clip = [];
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: async text => { window.__clip.push(text); } },
        });
        window.__exec = [];
        const original = document.execCommand ? document.execCommand.bind(document) : () => false;
        document.execCommand = (command, ...rest) => { window.__exec.push(command); return original(command, ...rest); };
    });
}
// Fire a handler the way a stale DOM node or a manual invocation would, rather
// than through a control the interface currently offers.
async function defensivelyTrigger(action, snapshotId) {
    await page.evaluate(([action, snapshotId]) => {
        const button = document.createElement('button');
        button.setAttribute('data-action', action);
        button.setAttribute('data-snapshot', snapshotId);
        button.setAttribute('data-return-tab', 'history');
        button.id = '__defensive_trigger';
        document.getElementById('prototypeRoot').appendChild(button);
        button.click();
        button.remove();
    }, [action, snapshotId]);
    await page.waitForTimeout(320);
}

await installClipboardSpy();
await page.locator('[data-action="review-center"]').first().click();
await page.waitForTimeout(340);
const sopCenterHist = await page.locator('.dialog').innerText();
const sopCenterDom = await page.evaluate(() => document.body.textContent);

check('the cross-linked SOP review is still visible under its own assignment',
    sopCenterHist.includes('CROSSLINK_REVIEW_MARKER'));
check('the correctly owned SOP review is visible too',
    sopCenterHist.includes('OWNED_REVIEW_MARKER'));
check('the ownership-mismatch notice is shown for the foreign checkpoint',
    sopCenterHist.includes(NOTICE_EN), sopCenterHist.slice(0, 200));
check('no functional snapshot link is rendered for the foreign snapshot',
    (await page.locator('[data-action="view-snapshot"][data-snapshot="v-adm-hist"]').count()) === 0);
check('a functional snapshot link IS still rendered for the owned snapshot',
    (await page.locator('[data-action="view-snapshot"][data-snapshot="v-sop-own"]').count()) === 1);
check('the admissions snapshot exact text is absent from the entire SOP DOM',
    !sopCenterDom.includes(ADM_SECRET));
check('the foreign snapshot\'s genre label is absent from the SOP DOM too',
    !sopCenterDom.includes('Mixed-genre autobiographical essay'));

// Defensive: the viewer must refuse even when invoked directly.
await defensivelyTrigger('view-snapshot', 'v-adm-hist');
check('a defensively triggered viewer does not render the foreign exact text',
    (await page.locator('#snapshotText').count()) === 0);
check('and exposes no foreign snapshot metadata anywhere in the DOM',
    !(await page.evaluate(() => document.body.textContent)).includes(ADM_SECRET));
check('the writer is told calmly why, rather than seeing an empty dialog',
    (await page.evaluate(() => document.body.textContent)).includes(NOTICE_EN));
await page.keyboard.press('Escape');
await page.waitForTimeout(220);

// Defensive: the clipboard handler must refuse even when invoked directly.
await defensivelyTrigger('copy-snapshot', 'v-adm-hist');
const clipAfterForeign = await page.evaluate(() => ({ clip: window.__clip, exec: window.__exec }));
check('a defensively triggered copy writes nothing to the clipboard',
    clipAfterForeign.clip.length === 0, JSON.stringify(clipAfterForeign.clip));
check('and does not fall back to an execCommand copy either',
    !clipAfterForeign.exec.includes('copy'), JSON.stringify(clipAfterForeign.exec));

// The record itself is untouched by every refusal above.
check('the stored review and snapshot are byte-identical after the refusals',
    (await contentOf()) === JSON.stringify((() => { const { savedAt, ...rest } = HISTORICAL; return rest; })()),
    'record changed');

// The owned link still works normally — the guard is ownership, not paralysis.
await page.locator('[data-action="review-center"]').first().click();
await page.waitForTimeout(340);
await page.locator('[data-action="view-snapshot"][data-snapshot="v-sop-own"]').first().click();
await page.waitForTimeout(300);
check('an owned SOP review opens its own snapshot normally',
    (await page.locator('#snapshotText').textContent()) === SOP_OWN);
await page.locator('[data-action="copy-snapshot"][data-snapshot="v-sop-own"]').first().click();
await page.waitForTimeout(300);
check('and copying an owned snapshot still works',
    (await page.evaluate(() => window.__clip)).includes(SOP_OWN));
await page.keyboard.press('Escape');
await page.waitForTimeout(220);

// The unstamped legacy snapshot keeps the approved compatibility rule.
await page.locator('[data-action="review-center"]').first().click();
await page.waitForTimeout(340);
check('an unstamped legacy snapshot is still reachable from its review',
    (await page.locator('[data-action="view-snapshot"][data-snapshot="v-legacy"]').count()) === 1);
await page.locator('[data-action="view-snapshot"][data-snapshot="v-legacy"]').first().click();
await page.waitForTimeout(300);
check('and it opens and reads normally under the active assignment',
    (await page.locator('#snapshotText').textContent()) === LEGACY_TEXT);
await page.keyboard.press('Escape');
await page.waitForTimeout(220);

// The owning assignment can read its own snapshot normally.
await switchGenre('admissions');
await installClipboardSpy();
await page.locator('[data-action="version-history"]').first().click();
await page.waitForTimeout(320);
check('the admissions assignment lists its own historical snapshot',
    (await page.locator('.dialog [data-action="view-snapshot"][data-snapshot="v-adm-hist"]').count()) === 1);
check('and its history also carries the unstamped legacy snapshot, as compatibility requires',
    (await page.locator('.dialog [data-action="view-snapshot"][data-snapshot="v-legacy"]').count()) === 1);
check('but NOT the SOP assignment\'s snapshot',
    (await page.locator('.dialog [data-action="view-snapshot"][data-snapshot="v-sop-own"]').count()) === 0);
// Target the admissions snapshot explicitly: Draft history lists newest-first
// by array position, so `.first()` is the legacy record here, not this one.
await page.locator('.dialog [data-action="view-snapshot"][data-snapshot="v-adm-hist"]').click();
await page.waitForTimeout(300);
check('and reads its own exact text normally',
    (await page.locator('#snapshotText').textContent()) === ADM_SECRET);
await page.locator('[data-action="copy-snapshot"][data-snapshot="v-adm-hist"]').first().click();
await page.waitForTimeout(300);
check('and can copy it normally',
    (await page.evaluate(() => window.__clip)).includes(ADM_SECRET));
await page.keyboard.press('Escape');
await page.waitForTimeout(220);

const historicalAfter = await stored();
check('every historical record survived unchanged — none deleted, rewritten, restamped, detached, or duplicated',
    historicalAfter.versions.length === 3
    && historicalAfter.reviews.length === 3
    && JSON.stringify(historicalAfter.versions) === JSON.stringify(HISTORICAL.versions)
    && JSON.stringify(historicalAfter.reviews) === JSON.stringify(HISTORICAL.reviews),
    JSON.stringify(historicalAfter.versions.map(v => [v.id, v.genre ?? null])));
check('the cross-linked review still carries its original foreign snapshotId — nothing was detached',
    historicalAfter.reviews.find(r => r.id === 'r-crosslink').snapshotId === 'v-adm-hist');

// ── 14. Isolation ───────────────────────────────────────────────────────────
console.log('\n14. Isolation');
check('R0 sentinel untouched', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 GENRE ISOLATION SENTINEL');
check('zero external requests', external.length === 0, external.join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
