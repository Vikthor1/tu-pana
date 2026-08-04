// Bounded Integrated Desk correction checks (C1–C6 + native spellcheck truth).
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

console.log('\nIntegrated correction contracts');
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const errors = [];
const external = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:3001/')) external.push(request.url()); });
await page.goto(BASE);
await page.evaluate(key => {
    localStorage.setItem('tupana_draft', 'R0 CORRECTION SENTINEL');
    localStorage.removeItem(key);
}, KEY);
await page.reload();

const draftA = 'Snapshot A — La abuela named this place “el puente” because language carried history.\n\nThe student explains that the real problem was trust and preserves aquí escuchamos primero.';
await page.locator('#draftEditor').fill(draftA);
await page.waitForTimeout(240);
check('native spellcheck is on by default for the canonical Draft', await page.locator('#draftEditor').evaluate(el => el.spellcheck));

// C1 + C2: a Council run creates one exact snapshot and the rail refreshes immediately.
await page.locator('[data-action="council"]').click();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="run-council"]').click();
const afterCouncil = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
check('one Council run stores exact genre and snapshot provenance', afterCouncil.councilRuns.length === 1 && afterCouncil.councilRuns[0].genre === 'autobiographical' && Boolean(afterCouncil.councilRuns[0].snapshotId));
check('Council snapshot stores exact canonical text and facts', afterCouncil.versions.some(version => version.id === afterCouncil.councilRuns[0].snapshotId && version.text === draftA && version.words > 0 && version.signature && version.reason === 'before Council review'));
check('rail refreshes saved-report and decision counts immediately', /1 saved reports/.test(await page.locator('.integrated-support').textContent()) && /Revisit report/.test(await page.locator('.integrated-support').textContent()) && await page.locator('.integrated-support section.panel:has([data-action="coach"]) .evidence-count').textContent() === '0');
await page.locator('[data-action="close-dialog"]').first().click();
await page.locator('.integrated-support [data-action="review-tab"][data-tab="council"]').click();
check('Revisit report opens saved Council history without consent', await page.locator('.dialog #transmitConsent').count() === 0 && await page.locator('.dialog .review-card').count() === 1);
check('Revisit creates no duplicate run', await page.evaluate(key => JSON.parse(localStorage.getItem(key)).councilRuns.length, KEY) === 1);
check('Convene again is a distinct secondary action', await page.locator('.dialog [data-action="convene-again"]').isVisible() && /separate consent step/.test(await page.locator('.review-secondary-action').textContent()));
await page.locator('.dialog [data-action="convene-again"]').click();
check('Convene again—not revisit—opens a fresh consent step', await page.locator('#transmitConsent').isVisible() && await page.locator('[data-action="run-council"]').isDisabled());
await page.locator('[data-action="close-dialog"]').first().click();

const draftB = `${draftA}\n\nSnapshot B adds disciplinary context but leaves the earlier wording recoverable.`;
await page.locator('#draftEditor').fill(draftB);
await page.waitForTimeout(240);
await page.locator('[data-action="version-history"]').click();
check('draft history stays behind Evidence and names exact records snapshots', /Draft snapshot/.test(await page.locator('.dialog').textContent()) && /Read-only local prototype history/.test(await page.locator('.dialog').textContent()));
await page.locator('.dialog [data-action="view-snapshot"]').first().click();
check('read-only viewer exposes exact prior wording A', await page.locator('#snapshotText').textContent() === draftA && await page.locator('[data-action="copy-snapshot"]').isVisible());
check('viewing snapshot A leaves active draft B unchanged', await page.evaluate(key => JSON.parse(localStorage.getItem(key)).draft, KEY) === draftB);
await page.locator('.dialog [data-action="version-history"]').click();
await page.addInitScript(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved.versions.some(version => version.id === 'legacy-metadata-only')) {
        saved.versions.push({ id: 'legacy-metadata-only', signature: 'legacy:24', words: 24, createdAt: new Date().toISOString(), phase: 1 });
        localStorage.setItem(key, JSON.stringify(saved));
    }
}, KEY);
await page.reload();
await page.locator('[data-action="version-history"]').click();
const legacyRow = page.locator('.version-row').filter({ hasText: 'Metadata-only checkpoint' });
check('legacy textless record is labeled metadata-only, never a recoverable snapshot', await legacyRow.count() === 1 && /not a recoverable snapshot/.test(await legacyRow.textContent()));
await legacyRow.locator('[data-action="view-snapshot"]').click();
check('legacy viewer truthfully says exact text was not stored', /Text was not stored/.test(await page.locator('.checkpoint-note').textContent()) && await page.locator('#snapshotText').count() === 0);
await page.locator('[data-action="close-dialog"]').first().click();

// C3: dirty text gets an inline decision; unchanged dialogs still dismiss immediately.
await page.locator('[data-action="integrated-move-note"]').first().click();
check('Move-note writing keeps native spellcheck enabled', await page.locator('#integratedMoveNote').evaluate(el => el.spellcheck));
const unsavedNote = 'Unsaved planning fragment — todavía no es evidencia.';
await page.locator('#integratedMoveNote').fill(unsavedNote);
await page.keyboard.press('Escape');
check('dirty Escape shows one inline discard choice without stacking a modal', await page.locator('[role="dialog"]').count() === 1 && await page.locator('.dirty-confirm').count() === 1);
await page.locator('[data-action="keep-editing"]').click();
check('Keep editing preserves the exact unsaved Move-note text', await page.locator('#integratedMoveNote').inputValue() === unsavedNote);
await page.locator('.overlay').click({ position: { x: 4, y: 4 } });
check('dirty backdrop dismissal also requires an explicit choice', await page.locator('.dirty-confirm').count() === 1);
await page.locator('[data-action="discard-dialog"]').click();
check('Discard changes closes without creating Move-note evidence', await page.locator('[role="dialog"]').count() === 0 && Object.keys(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).moveNotes, KEY)).length === 0);
await page.locator('[data-action="integrated-move-note"]').first().click();
await page.keyboard.press('Escape');
check('unchanged text dialog closes immediately', await page.locator('[role="dialog"]').count() === 0);

await page.locator('[data-action="paste"]').click();
await page.locator('#pasteDraft').fill('Meaningful unsaved replacement text.');
await page.keyboard.press('Escape');
check('paste/replace text receives the same dirty-loss protection', await page.locator('.dirty-confirm').count() === 1);
await page.locator('[data-action="discard-dialog"]').click();
check('discarding paste text never changes the canonical Draft', await page.locator('#draftEditor').inputValue() === draftB);

// C5: history remains labeled from the run, not from the current project.
await page.locator('.icon-button[data-action="settings"]').click();
await page.locator('#settingsGenre').selectOption('sop');
await page.locator('.integrated-support [data-action="review-tab"][data-tab="council"]').click();
const historicalCouncil = await page.locator('.dialog .review-card').first().textContent();
check('historical Council remains autobiographical after switching to SOP', /Mixed-genre autobiographical essay/.test(historicalCouncil) && /Connection and structure reviewer/.test(historicalCouncil) && /Voice and cultural-integrity reviewer/.test(historicalCouncil));
check('historical Council retains timestamp, full scope, and mock-call provenance', /full/.test(historicalCouncil) && /4 mock calls represented/.test(historicalCouncil));
check('switching projects does not create another Council run', await page.evaluate(key => JSON.parse(localStorage.getItem(key)).councilRuns.length, KEY) === 1);
await page.locator('.dialog [data-action="decision"][data-choice="adapt"]').first().click();
check('student-authored rationale uses native spellcheck', await page.locator('#decisionRationale').evaluate(el => el.spellcheck));
await page.locator('#decisionRationale').fill('I will preserve the situated phrase and revise the surrounding evidence myself.');
await page.keyboard.press('Escape');
check('dirty student rationale receives the same inline discard protection', await page.locator('.dirty-confirm').count() === 1 && await page.locator('[role="dialog"]').count() === 1);
await page.locator('[data-action="keep-editing"]').click();
await page.locator('[data-action="save-integrated-decision"]').click();
check('dialog-only decision refreshes the rail count immediately', await page.locator('.integrated-support section.panel:has([data-action="coach"]) .evidence-count').textContent() === '1');
await page.locator('[data-action="close-dialog"]').first().click();

// C6: no fabricated passage or paragraph after reload; real selection restores all exact scopes.
await page.reload();
await page.locator('.coach-entry [data-action="coach"]').click();
check('Ask Tu Pana with no captured selection shows no Selected passage option', await page.locator('input[name="reviewScope"][value="selected"]').count() === 0);
check('after reload with no meaningful caret, full Draft is the only scope', await page.locator('input[name="reviewScope"]').count() === 1 && await page.locator('input[name="reviewScope"][value="full"]').count() === 1 && await page.locator('#scopePreview').textContent() === draftB);
await page.locator('[data-action="close-dialog"]').first().click();
const selected = 'the real problem was trust';
await page.locator('#draftEditor').evaluate((editor, passage) => {
    const start = editor.value.indexOf(passage);
    editor.focus();
    editor.setSelectionRange(start, start + passage.length);
    editor.dispatchEvent(new Event('select', { bubbles: true }));
}, selected);
await page.waitForTimeout(50);
await page.locator('[data-action="passage-review"]').click();
check('real selection adds Selected passage with exact preview', await page.locator('input[name="reviewScope"][value="selected"]').count() === 1 && await page.locator('#scopePreview').textContent() === selected);
await page.locator('[data-action="close-dialog"]').first().click();
await page.locator('[data-action="clear-passage"]').click();
check('Cancel and Clear selection leave the exact Draft unchanged', await page.locator('#draftEditor').inputValue() === draftB);

// Native spelling utility is isolated, quiet, non-evidentiary, and byte-preserving.
await page.locator('.icon-button[data-action="settings"]').click();
check('Settings states browser/device spellcheck provenance and no Tu Pana transmission', /Spelling suggestions come from your browser or device/.test(await page.locator('.dialog').textContent()) && /does not send your writing/.test(await page.locator('.dialog').textContent()));
const beforeSpellToggle = await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key));
    return { versions: saved.versions.length, reviews: saved.reviews.length, decisions: saved.decisions.length, councils: saved.councilRuns.length, packet: saved.packetCreatedAt };
}, KEY);
await page.locator('[data-action="native-spellcheck"]').uncheck();
await page.locator('[data-action="close-dialog"]').first().click();
check('native spellcheck preference persists only in isolated concept state', await page.evaluate(key => JSON.parse(localStorage.getItem(key)).nativeSpellcheck, KEY) === false && await page.locator('#draftEditor').evaluate(el => !el.spellcheck));
const afterSpellToggle = await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key));
    return { versions: saved.versions.length, reviews: saved.reviews.length, decisions: saved.decisions.length, councils: saved.councilRuns.length, packet: saved.packetCreatedAt };
}, KEY);
check('spellcheck preference creates no evidence, readiness, review, Council, or packet claim', JSON.stringify(beforeSpellToggle) === JSON.stringify(afterSpellToggle));
const multilingual = 'Exact bytes: aquí escuchamos primero — हिन्दी — 中文 — café\u0301 — “voz propia”.';
await page.locator('#draftEditor').fill(multilingual);
await page.waitForTimeout(240);
await page.reload();
check('multilingual Draft text remains byte-for-byte exact with native spellcheck off', await page.locator('#draftEditor').inputValue() === multilingual);
check('R0 sentinel remains untouched throughout corrections', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 CORRECTION SENTINEL');
check('correction path makes no external network requests', external.length === 0, external.join(', '));
check('correction path produces no JavaScript errors', errors.length === 0, errors.join(' | '));
await page.close();

console.log('\nMobile genre reachability and isolation');
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mobileExternal = [];
mobile.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:3001/')) mobileExternal.push(request.url()); });
await mobile.goto(BASE);
await mobile.evaluate(key => localStorage.removeItem(key), KEY);
await mobile.reload();
check('mobile identifies the current writing project in a 44px orientation control', await mobile.locator('.mobile-project-chip').isVisible() && /Mixed-genre autobiographical essay/.test(await mobile.locator('.mobile-project-chip').textContent()) && (await mobile.locator('.mobile-project-chip').boundingBox()).height >= 44);
await mobile.locator('.mobile-project-chip').click();
await mobile.locator('#settingsGenre').selectOption('stem');
check('mobile can switch to STEM and cultural invitation disappears', /STEM lab report/.test(await mobile.locator('.mobile-project-chip').textContent()) && await mobile.locator('.knowledge-onboarding').count() === 0);
check('mobile STEM displays disciplinary Moves with zero autobiography leakage', /Question and prediction/.test(await mobile.locator('.integrated-support').textContent()) && !/Choose a memory|family disclosure|cultural performance/i.test(await mobile.locator('.integrated-support').textContent()));
await mobile.addInitScript(key => {
    if (sessionStorage.getItem('unknown-injected')) return;
    const saved = JSON.parse(localStorage.getItem(key));
    saved.genre = 'unconfigured-assignment';
    localStorage.setItem(key, JSON.stringify(saved));
    sessionStorage.setItem('unknown-injected', 'true');
}, KEY);
await mobile.reload();
check('unknown-genre stop exposes a direct mobile-safe recovery action', await mobile.locator('[data-action="settings"]').filter({ hasText: 'Choose writing project' }).isVisible());
await mobile.locator('[data-action="settings"]').filter({ hasText: 'Choose writing project' }).click();
await mobile.locator('#settingsGenre').selectOption('neutral');
check('unknown-genre recovery reaches neutral General Writing without fallback', /General writing/.test(await mobile.locator('.mobile-project-chip').textContent()) && /Clarify purpose and audience/.test(await mobile.locator('.integrated-support').textContent()) && await mobile.locator('.knowledge-onboarding').count() === 0);
check('mobile correction introduces no horizontal overflow', await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
const smallTargets = await mobile.locator('button:visible, select:visible, a.switch-link:visible').evaluateAll(elements => elements.map(el => ({ name: el.getAttribute('aria-label') || el.textContent.trim(), box: el.getBoundingClientRect() })).filter(item => item.box.width < 44 || item.box.height < 44));
check('mobile correction introduces no sub-44px interactive target', smallTargets.length === 0, JSON.stringify(smallTargets.slice(0, 4)));
check('mobile genre comparison makes no external request', mobileExternal.length === 0, mobileExternal.join(', '));
await mobile.close();

// Verify native spellcheck defaults on all remaining student-authored surface families.
// (Studio adaptation: the exploration notebook concept does not exist in the studio;
// its notebook-editor spellcheck check is dropped. Studio student surfaces are covered below.)
const surfaces = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await surfaces.goto(BASE);
await surfaces.evaluate(key => localStorage.removeItem(key), KEY);
await surfaces.reload();
await surfaces.locator('[data-action="reflection"]').first().click();
check('Process Reflection uses native spellcheck by default', await surfaces.locator('#reflectionForm textarea').evaluateAll(fields => fields.every(field => field.spellcheck)));
await surfaces.close();

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
