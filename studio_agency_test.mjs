// Writing Studio migration candidate (forked Integrated Desk behaviors) — student-agency and resilience utilities.
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3001/studio.html';
const KEY = 'tupana-studio:v1';
const browser = await chromium.launch({ headless: true });
let passed = 0;
let failed = 0;
const check = (label, condition, detail = '') => {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
    if (ok) passed++; else failed++;
};

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const external = [];
const errors = [];
page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:3001/')) external.push(request.url()); });
page.on('pageerror', error => errors.push(String(error)));
await page.goto(BASE);
await page.evaluate(key => { localStorage.removeItem(key); localStorage.setItem('tupana_draft', 'R0 AGENCY SENTINEL'); }, KEY);
await page.reload();

console.log('\nIn-session editing stays separate from evidence');
const draft = 'Aquí escuchamos primero. This exact wording remains the student’s.';
await page.locator('#draftEditor').fill(draft);
await page.waitForTimeout(180);
const beforeEditing = await page.evaluate(key => {
    const state = JSON.parse(localStorage.getItem(key));
    return [state.versions.length, state.reviews.length, state.councilRuns.length, state.decisions.length];
}, KEY);
await page.locator('[data-action="edit-undo"]').first().click();
check('pointer Undo returns the active Draft to its in-session prior value', await page.locator('#draftEditor').inputValue() === '');
await page.locator('[data-action="edit-redo"]').first().click();
check('pointer Redo restores the exact active Draft text', await page.locator('#draftEditor').inputValue() === draft);
await page.locator('.editor-actions .edit-menu summary').click();
check('compact Edit menu exposes Cut, Copy, Paste, and Select all without a toolbar ribbon', await page.locator('.editor-actions .edit-menu-popover button').count() === 4);
await page.locator('.editor-actions [data-action="edit-select-all"]').click();
check('Edit menu Select all uses the active student-writing surface', await page.locator('#draftEditor').evaluate(el => el.selectionStart === 0 && el.selectionEnd === el.value.length));
const afterEditing = await page.evaluate(key => {
    const state = JSON.parse(localStorage.getItem(key));
    return [state.versions.length, state.reviews.length, state.councilRuns.length, state.decisions.length];
}, KEY);
check('editing utilities create no snapshots, AI records, Council records, or decisions', JSON.stringify(beforeEditing) === JSON.stringify(afterEditing));

console.log('\nYour Voice is student-owned and opt-in');
await page.locator('#draftEditor').evaluate(el => { el.focus(); el.setSelectionRange(0, 'Aquí escuchamos primero.'.length); el.dispatchEvent(new Event('select', { bubbles: true })); });
await page.waitForTimeout(80);
check('selection surfaces Keep as my voice for a passage', await page.locator('[data-action="protect-phrase"]').isVisible());
await page.locator('[data-action="protect-phrase"]').click();
check('Your Voice reference remains hidden until an entry exists, then appears in existing support', await page.locator('.your-voice-reference').isVisible() && /Aquí escuchamos primero\./.test(await page.locator('.your-voice-reference').textContent()));
await page.locator('.your-voice-reference').evaluate(el => { el.open = true; });
await page.locator('[data-action="voice-note"]').first().click({ force: true });
await page.locator('#voiceReason').fill('This rhythm sounds like me.');
await page.locator('[data-action="save-voice-note"]').click();
const voiceState = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
check('Your Voice preserves exact bytes and an optional student reason locally', voiceState.voiceEntries.length === 1 && voiceState.voiceEntries[0].text === 'Aquí escuchamos primero.' && voiceState.voiceEntries[0].reason === 'This rhythm sounds like me.');
await page.locator('[data-action="focused-review"]').click();
check('Voice entries are not attached by default to a mock request', !(await page.locator('#includeVoiceEntries').isChecked()));
await page.locator('.voice-constraint summary').click();
await page.locator('#includeVoiceEntries').check();
check('optional Voice constraint previews exact text before mock consent', /Aquí escuchamos primero\./.test(await page.locator('.voice-entry-preview').textContent()) && !(await page.locator('#transmitConsent').isChecked()));
await page.locator('[data-action="close-dialog"]').first().click();

console.log('\nStuck support is locally useful without AI');
await page.locator('[data-action="stuck"]').click();
check('I’m stuck offers the five requested student needs', await page.locator('.stuck-choices [data-action="stuck-choice"]').count() === 5);
await page.locator('[data-action="stuck-choice"][data-choice="idea"]').click();
check('no-idea triage gives one genre-aware micro-task without inserting prose', /detail that only you can name/.test(await page.locator('.dialog').textContent()) && await page.locator('#draftEditor').inputValue() === draft);
await page.locator('[data-action="stuck-open-move"]').click();
check('micro-task can route to an existing optional Move rather than a chat chain', await page.locator('#integratedMoveNote').isVisible());
await page.locator('[data-action="close-dialog"]').first().click();
await page.locator('[data-action="stuck"]').click();
await page.locator('[data-action="stuck-choice"][data-choice="feedback"]').click();
check('feedback triage does not manufacture an AI call when no saved report exists', /No saved feedback yet/.test(await page.locator('.dialog').textContent()) && (await page.evaluate(key => JSON.parse(localStorage.getItem(key)).reviews.length, KEY)) === 0);
await page.locator('[data-action="return-write"]').click();
await page.locator('[data-action="stuck"]').click();
await page.locator('[data-action="stuck-choice"][data-choice="overwhelmed"]').click();
check('overwhelmed triage offers one reversible Focus action without changing the Draft', /Focus hides optional supports/.test(await page.locator('.dialog').textContent()) && await page.locator('#draftEditor').inputValue() === draft);
await page.locator('[data-action="stuck-focus"]').click();
check('temporary Focus can be entered from stuck support without a new workflow', await page.locator('body').evaluate(el => el.classList.contains('focus-mode')));
await page.locator('[data-action="exit-focus"]').click();
await page.locator('[data-action="stuck"]').click();
await page.locator('[data-action="stuck-choice"][data-choice="break"]').click();
check('break triage states truthful local save and a no-timer return path', /saved on this device/i.test(await page.locator('.dialog').textContent()) && /no timer/i.test(await page.locator('.dialog').textContent()));
await page.locator('[data-action="return-write"]').click();
await page.locator('[data-action="stuck"]').click();
await page.locator('[data-action="stuck-choice"][data-choice="instructor"]').click();
const summary = await page.locator('.safe-summary').textContent();
check('instructor-help summary excludes draft text and sensitive writing artifacts', !summary.includes('Aquí escuchamos primero') && /Draft word count/.test(summary));
await page.locator('[data-action="return-write"]').click();

console.log('\nAppearance and local Help remain progressive disclosure');
check('quick appearance control is compact and labelled with current and next action', /Appearance:/.test(await page.locator('[data-action="appearance-cycle"]').getAttribute('aria-label')));
await page.locator('[data-action="appearance-cycle"]').click();
check('appearance cycle persists Paper preference locally', await page.evaluate(key => JSON.parse(localStorage.getItem(key)).appearance === 'light', KEY) && await page.locator('html').getAttribute('data-appearance') === 'light');
await page.locator('[data-action="appearance-cycle"]').click();
check('dark appearance is a local visual preference and leaves Draft bytes unchanged', await page.locator('html').getAttribute('data-appearance') === 'dark' && await page.locator('#draftEditor').inputValue() === draft);
await page.locator('[data-action="help"]').click();
check('Help exposes separate Report a problem and Share feedback routes', await page.locator('[data-action="help-report"]').isVisible() && await page.locator('[data-action="help-feedback"]').isVisible());
await page.locator('[data-action="help-report"]').click();
await page.locator('#reportDescription').fill('The sample control did not respond.');
await page.locator('#reportTechContext').check();
await page.locator('[data-action="preview-local-report"]').click();
const reportPreview = await page.locator('.safe-summary').textContent();
check('local report preview states no send and omits the Draft, notes, Voice, reports, and reflection', /"sent": false/.test(reportPreview) && !reportPreview.includes(draft) && !reportPreview.includes('voiceEntries'));
await page.locator('[data-action="return-write"]').click();
await page.locator('[data-action="focused-review"]').click();
await page.locator('.voice-constraint summary').click();
await page.locator('#includeVoiceEntries').check();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(320);
check('explicit consent records optional Voice entries only on the chosen mock request', await page.evaluate(key => {
    const state = JSON.parse(localStorage.getItem(key));
    return state.reviews.length === 1 && state.reviews[0].voiceEntriesIncluded?.length === 1 && state.reviews[0].voiceEntriesIncluded[0].text === 'Aquí escuchamos primero.';
}, KEY));
await page.locator('[data-action="close-dialog"]').first().click();
check('agency utility path keeps the R0 sentinel untouched and makes no external request', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 AGENCY SENTINEL' && external.length === 0, external.join(', '));
check('agency utility path produces no JavaScript errors', errors.length === 0, errors.join(' | '));

await page.close();

console.log('\nMobile utility reflow');
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobile.goto(BASE);
await mobile.evaluate(key => localStorage.removeItem(key), KEY);
await mobile.reload();
check('mobile keeps compact appearance and Help controls at 44px without horizontal overflow', await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth) && await mobile.locator('[data-action="appearance-cycle"]').evaluate(el => el.getBoundingClientRect().height >= 44) && await mobile.locator('[data-action="help"]').evaluate(el => el.getBoundingClientRect().height >= 44));
await mobile.close();
await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
