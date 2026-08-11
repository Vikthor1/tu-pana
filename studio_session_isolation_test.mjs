// W1-C — session-side workspace isolation (the half the storage partition can't see).
//
// WHAT FAILED, AND WHERE THIS SUITE PINS IT
// W1's per-genre partition parks and restores STORED fields across an assignment
// boundary (studio_genre_isolation_test.mjs proves that). Two session-side
// channels slipped past it:
//
//   Finding 1 — in-session undo/redo history (`editHistories`) is a module-level
//   Map keyed by DOM id, created once per surface and never cleared on a
//   boundary. After a genre switch the incoming editor reused the outgoing
//   genre's undo stack, so one ↶ (or ↷) wrote the previous assignment's text
//   into the new assignment's editor and autosaved it there. Same root for
//   dialog-keyed surfaces (Move notes) and for a Danger-Zone-deleted draft.
//
//   Finding 2 — `packetCreatedAt` / `packetDraft` were per-genre in meaning but
//   sat OUTSIDE the widened partition, so a packet confirmation made under one
//   genre rendered as already-made under another, and creating a packet under
//   one genre silently overwrote another genre's only packet record.
//
// The fix clears `editHistories` + `activeEditSurface` on every boundary that
// already clears `captured` (genre-select, openRequestedAssignment, direct
// `?assignment=` link-open, deletePrototypeState) and adds the two packet fields
// to GENRE_SCOPED_DEFAULTS / store / load with `?? null` / `?? ''`.
// clear-on-boundary and park-with-active migration are founder-approved (W1-C).
//
// COVERAGE NOTE. Undo/redo history is per-page-load memory, so a full navigation
// (a direct `?assignment=` link) cannot carry it. That branch is therefore
// covered two ways: a behavioural check that the fresh-navigation switch yields a
// clean workspace, AND a source-level assertion that the branch calls
// resetEditHistories() (defence in depth for the in-page reachable variants).
// Every other boundary is proven by FORCE-DISPATCHING undo/redo after the switch
// and showing nothing crosses.
//
// This suite makes ZERO Tu Pana product-provider calls: it never invokes the
// coach, so the product provider ledger (`state.providerEvents`) stays empty; the
// isolation section asserts that ledger status explicitly, alongside zero
// external requests. Requires this worktree at http://127.0.0.1:3001.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const BASE = `${ORIGIN}/studio.html`;
const KEY = 'tupana-studio:v1';
const TOUR_KEY = 'tupana-studio:tour:v1';
const SRC = readFileSync(new URL('./assets/js/studio/studio-ui.js', import.meta.url), 'utf8');

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
        localStorage.setItem('tupana_draft', 'R0 SESSION ISOLATION SENTINEL');
    }, [KEY, TOUR_KEY]);
    await page.goto(`${BASE}${query}`);
}

// Seed an exact stored record BEFORE any document script runs (see the sibling
// genre-isolation suite for why addInitScript + a closed prior page is required).
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
        localStorage.setItem('tupana_draft', 'R0 SESSION ISOLATION SENTINEL');
    }, [KEY, TOUR_KEY, JSON.stringify(record)]);
    await page.goto(`${BASE}${query}`);
}

const stored = () => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), KEY);

async function switchGenre(profileId) {
    await page.locator('select[data-action="genre"]').first().selectOption(profileId);
    await page.waitForTimeout(320);
}

// Build a multi-entry undo stack without pointer input (works even under an
// overlay): each fill() fires one input event, so two fills leave an INTERIOR
// value (`base`) one undo step back from the full text — the prior-genre text
// that could cross a boundary.
async function typeDeep(sel, base, more) {
    await page.locator(sel).fill(base);
    await page.waitForTimeout(120);
    await page.locator(sel).fill(base + more);
    await page.waitForTimeout(180);
}

const editDisabled = (action, scope = '') => page.evaluate(([a, s]) => {
    const root = s ? document.querySelector(s) : document;
    const btn = (root || document).querySelector(`[data-action="${a}"]`);
    return !btn || btn.disabled;
}, [action, scope]);

// FORCE-DISPATCH: enable the control (so a cleared-history no-op is exercised
// through the REAL applyEditHistory path) and click it. Pre-fix this pulled the
// other genre's text in; post-fix the reseeded single-entry stack makes it inert.
async function forceEdit(action, scope = '') {
    const sel = scope ? `${scope} [data-action="${action}"]` : `[data-action="${action}"]`;
    await page.evaluate(s => { const b = document.querySelector(s); if (b) b.disabled = false; }, sel);
    await page.locator(sel).first().click({ force: true });
    await page.waitForTimeout(180);
}

// Drive the real UI to a created packet under the current genre.
async function createPacketViaUI(draftText) {
    await page.locator('#draftEditor').fill(draftText);
    await page.waitForTimeout(320);
    await page.locator('[data-action="reflection"]').first().click();
    await page.waitForTimeout(250);
    await page.locator('#reflection-changed').fill('I reordered two paragraphs for a clearer opening.');
    await page.locator('#reflection-decision').fill('I kept my own phrasing rather than a suggested rewrite.');
    await page.locator('#reflection-voice').fill('My register is plain and direct, and I kept it.');
    await page.waitForTimeout(120);
    await page.locator('[data-action="finish"]').first().click();   // saves reflection + enters Finish
    await page.waitForTimeout(300);
    await page.locator('#packetConfirm').check();
    await page.waitForTimeout(120);
    await page.locator('[data-action="create-packet"]').first().click();
    await page.waitForTimeout(300);
}

const ADM = 'Admissions opening sentence.';
const ADM_MORE = ' A second admissions clause never meant for another genre.';

// ── 1. Header-select boundary: force-dispatch undo AND redo prove nothing crosses
console.log('\n1. Header-select boundary clears in-session undo/redo');
await fresh('?assignment=college-personal-statement');
await typeDeep('#draftEditor', ADM, ADM_MORE);
const admStored1 = (await stored())?.draft || '';
check('after typing under admissions, in-session undo is available', !(await editDisabled('edit-undo')));
await switchGenre('sop');
check('after switching to SOP, undo is disabled', await editDisabled('edit-undo'));
check('after switching to SOP, redo is disabled', await editDisabled('edit-redo'));
await forceEdit('edit-undo');
let sopEditor1 = await page.locator('#draftEditor').inputValue();
check('force-dispatched undo does not pull admissions text into the SOP editor',
    !/admissions/i.test(sopEditor1) && sopEditor1.trim() === '', JSON.stringify(sopEditor1.slice(0, 40)));
await forceEdit('edit-redo');
sopEditor1 = await page.locator('#draftEditor').inputValue();
check('force-dispatched redo does not pull admissions text into the SOP editor',
    !/admissions/i.test(sopEditor1) && sopEditor1.trim() === '', JSON.stringify(sopEditor1.slice(0, 40)));
check('the SOP stored draft holds no admissions text', !/admissions/i.test((await stored())?.draft || ''));
await switchGenre('admissions');
const admBack1 = (await stored())?.draft || '';
check('the admissions draft is byte-identical after the round trip — nothing lost',
    admBack1 === admStored1 && /Admissions opening sentence\./.test(admBack1), JSON.stringify(admBack1.slice(0, 40)));

// ── 2. Within-genre undo positive control ────────────────────────────────────
console.log('\n2. Positive control — undo still works inside one genre');
await fresh('?assignment=college-personal-statement');
await typeDeep('#draftEditor', ADM, ADM_MORE);
check('undo is enabled after edits within a single genre', !(await editDisabled('edit-undo')));
await page.locator('[data-action="edit-undo"]').first().click();
await page.waitForTimeout(200);
const afterUndo = await page.locator('#draftEditor').inputValue();
check('one undo steps back to the interior value within the same genre',
    afterUndo.startsWith('Admissions opening sentence.') && afterUndo !== `${ADM}${ADM_MORE}`,
    JSON.stringify(afterUndo.slice(0, 60)));

// ── 3. Distinct symmetric redo test (within genre) ───────────────────────────
console.log('\n3. Symmetric redo restores the forward value within one genre');
await fresh('?assignment=college-personal-statement');
await typeDeep('#draftEditor', ADM, ADM_MORE);
await page.locator('[data-action="edit-undo"]').first().click();
await page.waitForTimeout(180);
const midUndo = await page.locator('#draftEditor').inputValue();
check('undo moved off the full text', midUndo !== `${ADM}${ADM_MORE}`);
check('redo is now available', !(await editDisabled('edit-redo')));
await page.locator('[data-action="edit-redo"]').first().click();
await page.waitForTimeout(180);
const afterRedo = await page.locator('#draftEditor').inputValue();
check('redo restores the full forward text (symmetric with undo)', afterRedo === `${ADM}${ADM_MORE}`,
    JSON.stringify(afterRedo.slice(0, 60)));

// ── 4. Direct ?assignment= link-open: behavioural + source-level ─────────────
console.log('\n4. Direct link-open switch: clean workspace + source-level reset');
await fresh();                                   // empty, no active work
await page.goto(`${BASE}?assignment=graduate-sop`);
await page.waitForTimeout(320);
check('after a direct SOP link-open with no prior work, undo is disabled', await editDisabled('edit-undo'));
const sopEditor4 = await page.locator('#draftEditor').inputValue().catch(() => '');
check('the freshly opened SOP editor is empty', sopEditor4.trim() === '', JSON.stringify(sopEditor4.slice(0, 40)));
const linkResolver = (() => {
    const i = SRC.indexOf('function resolveAssignmentFromLink()');
    return i === -1 ? '' : SRC.slice(i, i + 1400);
})();
check('the direct link-open switch branch invokes resetEditHistories() (source-level)',
    /loadActiveGenreState\(resolved\.profileId\);[\s\S]*resetEditHistories\(\)/.test(linkResolver));

// ── 5. openRequestedAssignment clears a LIVE in-page undo stack ──────────────
console.log('\n5. openRequestedAssignment clears a live in-page undo stack');
await seed({
    schema: 1, concept: 'integrated', lang: 'en', genre: 'admissions',
    draft: 'Existing admissions work so the calm notice appears.',
    createdAt: '2026-08-01T10:00:00.000Z', savedAt: '2026-08-01T10:00:00.000Z',
    reflections: { changed: '', decision: '', voice: '', knowledge: '' },
    versions: [], reviews: [], decisions: [], councilRuns: [], voiceEntries: [], protectedPhrases: [],
    finishChecks: {}, genreStates: {}, notebookEntries: {}, notebookCoachRuns: {}, moveNotes: {},
    criticalViews: [], artifacts: {}, revisionCycle: { focus: '', closure: '', selectedSuggestion: null, updatedAt: null },
    invitations: { moveReview: null, finishReflection: null },
    assignmentId: 'college-personal-statement', assignmentNotice: null,
}, '?assignment=graduate-sop');
check('a different assignment on existing work shows the calm open-requested choice',
    (await page.locator('[data-action="assignment-open-requested"]').count()) >= 1);
await typeDeep('#draftEditor', ADM, ADM_MORE);     // live stack in the shown admissions workspace
check('undo is available in the shown workspace before opening the requested genre',
    !(await editDisabled('edit-undo')));
await page.locator('[data-action="assignment-open-requested"]').first().click();
await page.waitForTimeout(320);
check('after opening the requested SOP assignment, undo is disabled', await editDisabled('edit-undo'));
await forceEdit('edit-undo');
const sopEditor5 = await page.locator('#draftEditor').inputValue().catch(() => '');
check('force-dispatched undo in the opened SOP workspace carries no admissions text',
    !/admissions/i.test(sopEditor5), JSON.stringify(sopEditor5.slice(0, 40)));

// ── 6. Dialog-keyed history cleared on a boundary (force-dispatch) ───────────
console.log('\n6. Dialog-surface undo history is cleared on a boundary');
await fresh('?assignment=college-personal-statement');
await page.locator('[data-action="integrated-move-note"]').first().click();
await page.waitForTimeout(250);
await typeDeep('#integratedMoveNote', 'Admissions move note.', ' Extra admissions clause.');
check('the dialog has an undo stack while the note is open', !(await editDisabled('edit-undo', '.dialog-edit-utility')));
await page.locator('[data-action="save-integrated-note"]').first().click();  // save: an unsaved note trips the dirty guard
await page.waitForTimeout(250);
await switchGenre('sop');
await page.locator('[data-action="integrated-move-note"]').first().click();
await page.waitForTimeout(250);
check('the SOP move-note dialog opens with its undo control disabled',
    await editDisabled('edit-undo', '.dialog-edit-utility'));
await forceEdit('edit-undo', '.dialog-edit-utility');
const dlgVal = await page.locator('#integratedMoveNote').inputValue().catch(() => '');
check('force-dispatched dialog undo cannot make the admissions note appear under SOP',
    !/admissions/i.test(dlgVal), JSON.stringify(dlgVal.slice(0, 40)));
await page.locator('[data-action="save-integrated-note"]').first().click();
await page.waitForTimeout(150);

// ── 7. Danger-Zone deletion: attempt undo, prove no resurrection or save ─────
console.log('\n7. Deletion clears in-session undo — no resurrection');
await fresh('?assignment=college-personal-statement');
await typeDeep('#draftEditor', ADM, ADM_MORE);
await page.locator('[data-action="settings"]').first().click();
await page.waitForTimeout(250);
await page.locator('#deleteConfirm').fill('DELETE');
await page.waitForTimeout(120);
await page.locator('[data-action="delete-state"]').first().click();
await page.waitForTimeout(320);
check('after Danger-Zone deletion, undo is disabled', await editDisabled('edit-undo'));
await forceEdit('edit-undo');
const afterDelete = await page.locator('#draftEditor').inputValue().catch(() => '');
check('force-dispatched undo after deletion resurrects no admissions text in the editor',
    !/admissions/i.test(afterDelete), JSON.stringify(afterDelete.slice(0, 40)));
const storedAfterDelete = await stored();
check('deletion + attempted undo left no admissions draft saved',
    !storedAfterDelete || !/admissions/i.test(storedAfterDelete.draft || ''),
    JSON.stringify((storedAfterDelete?.draft || '').slice(0, 40)));

// ── 8. Create an admissions packet through the UI; SOP shows nothing foreign ─
console.log('\n8. A UI-created packet parks with its genre');
const ADM_PACKET = 'The admissions packet draft, created through the real UI.';
await fresh('?assignment=college-personal-statement');
await createPacketViaUI(ADM_PACKET);
check('under admissions, the packet confirmation renders as already made',
    await page.locator('#packetConfirm').isChecked().catch(() => false));
check('under admissions, the packet-ready Download appears',
    (await page.locator('[data-action="download-packet"]').count()) >= 1);
const admPacketBytes = (await stored()).packetDraft;
check('the admissions packetDraft holds the created draft bytes', admPacketBytes === ADM_PACKET,
    JSON.stringify((admPacketBytes || '').slice(0, 30)));
await page.locator('[data-action="return-write"]').first().click();
await page.waitForTimeout(250);
await switchGenre('sop');
await page.locator('[data-action="finish"]').first().click();
await page.waitForTimeout(300);
check('under SOP, the confirmation is NOT pre-checked — no foreign confirmation',
    (await page.locator('#packetConfirm').isChecked().catch(() => false)) === false);
check('under SOP, no admissions "packet ready" Download section', (await page.locator('[data-action="download-packet"]').count()) === 0);
const sopRec8 = await stored();
check('SOP carries no packetCreatedAt / packetDraft of its own',
    !sopRec8.packetCreatedAt && !(sopRec8.packetDraft || '').length,
    JSON.stringify([sopRec8.packetCreatedAt, (sopRec8.packetDraft || '').slice(0, 16)]));

// ── 9. Create a SOP packet through the UI; admissions bytes survive ──────────
console.log('\n9. Creating a second genre packet does not overwrite the first');
await page.locator('[data-action="return-write"]').first().click();
await page.waitForTimeout(250);
await createPacketViaUI('The SOP packet draft, entirely different bytes.');
check('under SOP, its own packetDraft is the SOP bytes', (await stored()).packetDraft === 'The SOP packet draft, entirely different bytes.');
await page.locator('[data-action="return-write"]').first().click();
await page.waitForTimeout(250);
await switchGenre('admissions');
const admRec9 = await stored();
check('the admissions packet bytes survived — not overwritten by the SOP packet',
    admRec9.packetDraft === ADM_PACKET, JSON.stringify((admRec9.packetDraft || '').slice(0, 30)));
check('the admissions packetCreatedAt is still present', Boolean(admRec9.packetCreatedAt));

// ── 10. A legacy record without packet keys loads safely ─────────────────────
console.log('\n10. Legacy records without packet keys load safely');
await seed({
    schema: 1, concept: 'integrated', lang: 'en', genre: 'admissions',
    draft: 'A legacy admissions draft with no packet keys at all.',
    createdAt: '2026-07-01T10:00:00.000Z', savedAt: '2026-07-01T10:00:00.000Z',
    reflections: { changed: '', decision: '', voice: '', knowledge: '' },
    versions: [], reviews: [], decisions: [], councilRuns: [], voiceEntries: [], protectedPhrases: [],
    finishChecks: {}, genreStates: {}, notebookEntries: {}, notebookCoachRuns: {}, moveNotes: {},
    criticalViews: [], artifacts: {}, revisionCycle: { focus: '', closure: '', selectedSuggestion: null, updatedAt: null },
    invitations: { moveReview: null, finishReflection: null },
    assignmentId: 'college-personal-statement', assignmentNotice: null,
}, '?assignment=college-personal-statement');
const legacyRecord = await stored();
check('a legacy record loads with no packet state invented and the draft intact',
    (legacyRecord.packetCreatedAt === null || legacyRecord.packetCreatedAt === undefined)
    && !(legacyRecord.packetDraft || '').length
    && /legacy admissions draft/.test(legacyRecord.draft),
    JSON.stringify([legacyRecord.packetCreatedAt, (legacyRecord.packetDraft || '').slice(0, 12)]));

// ── 11. Isolation + product-provider ledger ──────────────────────────────────
console.log('\n11. Isolation and product-provider ledger');
check('R0 sentinel untouched', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 SESSION ISOLATION SENTINEL');
check('zero external requests (network)', external.length === 0, external.join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
// Product-provider ledger: `state.providerEvents` records every Tu Pana coach
// interaction. This suite never invoked the coach, so the ledger must be empty.
const ledgerEmptyAcrossRun = await page.evaluate(k => {
    const rec = JSON.parse(localStorage.getItem(k) || 'null');
    if (!rec) return true;
    const top = !rec.providerEvents || rec.providerEvents.length === 0;
    const parked = Object.values(rec.genreStates || {}).every(g => !g.providerEvents || g.providerEvents.length === 0);
    return top && parked;
}, KEY);
check('PRODUCT-PROVIDER LEDGER EMPTY — no Tu Pana provider event recorded (state.providerEvents)',
    ledgerEmptyAcrossRun);

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
