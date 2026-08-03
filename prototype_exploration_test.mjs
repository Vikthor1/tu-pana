// Comparative Writing Studio prototypes — local functional, responsive, and safety checks.
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3001/explore.html';
const browser = await chromium.launch({ headless: true });
let passed = 0;
let failed = 0;
const check = (label, condition, detail = '') => {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
    if (ok) passed++; else failed++;
};
const visibleWordCount = page => page.evaluate(() => {
    const words = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || !node.textContent.trim()) continue;
        const style = getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const visible = Array.from(range.getClientRects()).some(rect => rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth);
        if (visible) words.push(...node.textContent.trim().split(/\s+/));
    }
    return words.length;
});

const landing = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await landing.goto(BASE);
check('comparison hub exposes exactly five concepts', await landing.locator('.concept-card').count() === 5);
check('comparison hub exposes the same eleven-task journey', await landing.locator('.task-grid li').count() === 11);
check('comparison hub links to Notebook & Draft', await landing.locator('a[href="?concept=notebook"]').count() === 1);
check('comparison hub labels Integrated Desk as under evaluation', await landing.locator('a[href="?concept=integrated"]').count() === 1 && /Finalist under evaluation/.test(await landing.locator('.finalist-card').textContent()));
await landing.close();

for (const concept of ['desk', 'journey', 'hybrid']) {
    console.log(`\n${concept.toUpperCase()} concept`);
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    const externalRequests = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => {
        if (!request.url().startsWith('http://127.0.0.1:3001/')) externalRequests.push(request.url());
    });
    await page.goto(`${BASE}?concept=${concept}`);
    await page.evaluate(name => {
        localStorage.setItem('tupana_draft', 'R0 SENTINEL — MUST SURVIVE');
        localStorage.removeItem(`tupana-explore:writing-studio-ux-2026-08:${name}:v1`);
    }, concept);
    await page.reload();

    check('orientation answers where the student is', Boolean((await page.locator('.location-pill').textContent()).trim()));
    check('orientation answers what happens next', Boolean((await page.locator('.orientation-text span').textContent()).trim()));
    check('one sample action starts writing', await page.locator('[data-action="sample"]').isVisible());
    await page.locator('[data-action="sample"]').click();
    const sample = await page.locator('#draftEditor').inputValue();
    check('synthetic sample enters the editor', sample.length > 180);

    const continuityMarker = `\n\nSynthetic continuity marker for ${concept}.`;
    await page.locator('#draftEditor').fill(sample + continuityMarker);
    await page.waitForTimeout(260);
    await page.reload();
    check('save, leave, and return restores exact writing', (await page.locator('#draftEditor').inputValue()).endsWith(continuityMarker));
    check('R0 storage sentinel remains untouched', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 SENTINEL — MUST SURVIVE');

    const selected = 'the real problem was trust';
    await page.locator('#draftEditor').evaluate((editor, passage) => {
        const start = editor.value.indexOf(passage);
        editor.focus();
        editor.setSelectionRange(start, start + passage.length);
        editor.dispatchEvent(new Event('select', { bubbles: true }));
    }, selected);
    await page.waitForTimeout(50);
    check('selection immediately opens app-owned passage action', await page.locator('#passageBar').isVisible());
    await page.locator('#draftEditor').evaluate(editor => editor.setSelectionRange(editor.value.length, editor.value.length));
    check('captured passage survives native selection collapse', (await page.locator('#passageExcerpt').textContent()) === selected);
    await page.locator('[data-action="passage-review"]').click();
    check('passage consent offers selected, paragraph, and full draft', await page.locator('input[name="reviewScope"]').count() === 3);
    check('exact selected text appears before transmission', (await page.locator('#scopePreview').textContent()) === selected);
    check('mock send is disabled before consent', await page.locator('[data-action="submit-mock"]').isDisabled());
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.waitForTimeout(350);
    check('mock coach result is re-enterable in Review Center', await page.locator('.review-card').count() >= 1);
    await page.locator('[data-action="decision"][data-choice="adapt"]').first().click();
    check('adapt decision persists in one decision ledger', await page.locator('[data-action="review-tab"][data-tab="decisions"]').textContent().then(text => /\(1\)/.test(text)));
    await page.locator('[data-action="close-dialog"]').first().click();

    await page.locator('[data-action="focused-review"]').click();
    check('focused review uses genre-aware lenses', await page.locator('input[name="reviewLens"]').count() === 3);
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
    await page.waitForTimeout(350);
    check('focused review returns to persistent history', await page.locator('.review-card').count() >= 2);
    await page.locator('[data-action="close-dialog"]').first().click();

    await page.locator('[data-action="council"]').first().click();
    check('Council identifies three genre-configured reviewers', await page.locator('.choice-stack .radio-card').count() === 3);
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="run-council"]').click();
    await page.waitForTimeout(80);
    check('Council report is persisted and revisitable', await page.locator('.review-card').count() >= 1 && /\(1\)/.test(await page.locator('[data-tab="council"]').textContent()));
    await page.locator('[data-action="close-dialog"]').first().click();

    await page.locator('[data-action="reflection"]').first().click();
    check('reflection has exactly three required student prompts', await page.locator('#reflectionForm textarea[required]').count() === 3);
    check('optional cultural/community prompt is separate', await page.locator('#reflection-knowledge:not([required])').count() === 1);
    await page.locator('#reflection-changed').fill('I clarified the evidence and explained why the shift matters.');
    await page.locator('#reflection-decision').fill('I adapted one question because it helped me add evidence without replacing my words.');
    await page.locator('#reflection-voice').fill('I kept the sentence that names trust because its plain rhythm sounds like me.');
    await page.locator('[data-action="finish"]').click();
    check('Finish separates student reflection from instructor appendix', await page.getByRole('heading', { name: /Student reflection/ }).count() === 1 && await page.getByRole('heading', { name: /Instructor evidence appendix/ }).count() === 1);
    check('packet draft preview is exact', (await page.locator('#finalDraftPreview').textContent()).endsWith(continuityMarker));
    await page.locator('#packetConfirm').check();
    await page.locator('[data-action="create-packet"]').click();
    check('deliberate Finish creates a local packet only after confirmation', await page.locator('[data-action="download-packet"]').isVisible());

    await page.locator('[data-action="language"]').selectOption('es');
    check('Spanish preference applies without reload', /Guardado|Autoguardado/.test(await page.locator('body').textContent()));
    await page.locator('[data-action="genre"]').selectOption('stem');
    await page.locator('[data-action="return-write"]').click();
    const stemChrome = await page.locator('.support-stack').textContent();
    check('STEM guidance has no autobiographical fallback', !/anecdote|admissions reader|your story|tu historia/i.test(stemChrome) && /evidencia|laboratorio|métodos/i.test(stemChrome));

    await page.locator('[data-action="settings"]').click();
    check('Settings contains one explicit Danger Zone deletion path', await page.getByRole('heading', { name: /Zona de peligro/ }).count() === 1);
    check('mobile Focus decision is documented in the interface', (await page.locator('.packet-section').textContent()).length > 40);
    await page.locator('#deleteConfirm').fill('DELETE');
    await page.locator('[data-action="delete-state"]').click();
    check('deletion removes only this concept record', await page.evaluate(name => localStorage.getItem(`tupana-explore:writing-studio-ux-2026-08:${name}:v1`) === null && localStorage.getItem('tupana_draft') === 'R0 SENTINEL — MUST SURVIVE', concept));
    check('no network request leaves the local origin', externalRequests.length === 0, externalRequests.join(', '));
    check('no page JavaScript errors', errors.length === 0, errors.join(' | '));
    await page.close();
}

console.log('\nNOTEBOOK concept');
const notebook = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const notebookErrors = [];
const notebookExternalRequests = [];
notebook.on('pageerror', error => notebookErrors.push(String(error)));
notebook.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:3001/')) notebookExternalRequests.push(request.url());
});
await notebook.goto(`${BASE}?concept=notebook`);
await notebook.evaluate(() => {
    localStorage.setItem('tupana_draft', 'R0 SENTINEL — MUST SURVIVE');
    localStorage.removeItem('tupana-explore:writing-studio-ux-2026-08:notebook:v1');
});
await notebook.reload();

check('switcher includes all five concepts', await notebook.locator('.concept-switcher a[href*="concept="]').count() === 5);
check('Notebook is the truthful starting place', (await notebook.locator('.location-pill').textContent()).trim() === 'Notebook');
check('admissions notebook has five genre-shaped cards', await notebook.locator('[data-action="notebook-card"]').count() === 5);
check('draft does not exist before student creates it', await notebook.locator('#draftEditor').count() === 0 && /Doesn.t exist yet/.test(await notebook.locator('.orientation-next').textContent()));
check('draft review and Passage Tray are unavailable before draft creation', await notebook.locator('[data-action="review-center"]').count() === 0 && await notebook.locator('#passageBar:not([hidden])').count() === 0);

const notebookNote = 'Synthetic prewriting: I mistook speed for usefulness, then learned that listening creates trust.';
await notebook.locator('#notebookEditor').fill(notebookNote);
check('notebook save status truthfully shows an in-progress write', /Saving locally/.test(await notebook.locator('[data-save-state]').last().textContent()));
check('notebook evidence count updates while typing', (await notebook.locator('#notebookPlaceCount').textContent()).trim() === '1/5' && (await notebook.locator('#activeNotebookEvidence').textContent()).trim() === '✓');
await notebook.waitForTimeout(230);
check('notebook save status becomes saved only after persistence', /Saved on this device/.test(await notebook.locator('[data-save-state]').last().textContent()));
await notebook.locator('[data-action="notebook-card"][data-card="1"]').click();
check('navigation alone does not mark a notebook card complete', await notebook.locator('.done-mark').evaluateAll(nodes => nodes.filter(node => node.textContent.trim() === '✓').length) === 1);
await notebook.locator('[data-action="notebook-card"][data-card="0"]').click();
await notebook.locator('[data-action="paste-notebook"]').click();
check('notebook paste warns at the authorship boundary', /starts empty|comienza vacío/i.test(await notebook.locator('[role="dialog"]').textContent()));
const pastedNotebook = `${notebookNote}\nSynthetic pasted context stays in the notebook only.`;
await notebook.locator('#pasteNotebookText').fill(pastedNotebook);
check('notebook paste shows exact-text preview', await notebook.locator('#pasteNotebookPreview').textContent() === pastedNotebook);
await notebook.locator('[data-action="save-notebook-paste"]').click();
await notebook.reload();
check('save, leave, and return restores exact notebook material', await notebook.locator('#notebookEditor').inputValue() === pastedNotebook);

await notebook.locator('[data-action="my-work"]').click();
check('My Work finds earlier notebook work without browser history', /1\/5 cards with useful work/.test(await notebook.locator('[role="dialog"]').textContent()));
await notebook.locator('[data-action="close-dialog"]').first().click();
await notebook.locator('[data-action="notebook-coach"]').click();
check('notebook coach previews only the active card payload', await notebook.locator('#notebookPayloadPreview').textContent() === pastedNotebook);
check('notebook coach requires explicit consent', await notebook.locator('[data-action="submit-notebook-coach"]').isDisabled());
await notebook.locator('#transmitConsent').check();
await notebook.locator('[data-action="submit-notebook-coach"]').click();
check('pre-draft coach asks a question without generating prose', /Question to consider/.test(await notebook.locator('.notebook-coach-history').textContent()) && /will not turn the note into draft prose/i.test(await notebook.locator('.notebook-coach-history').textContent()));
check('notebook coach does not create the draft', await notebook.locator('#draftEditor').count() === 0);

await notebook.locator('[data-action="create-draft"]').first().click();
check('direct drafting is allowed without completing every card', await notebook.locator('#draftEditor').isVisible());
check('canonical draft begins exactly empty', await notebook.locator('#draftEditor').inputValue() === '');
const boundaryState = await notebook.evaluate(() => JSON.parse(localStorage.getItem('tupana-explore:writing-studio-ux-2026-08:notebook:v1')));
check('notebook-to-draft non-transfer is exact in storage', boundaryState.draft === '' && boundaryState.draftDeclared === true && boundaryState.notebookEntries['admissions:anecdote'].text === pastedNotebook);

const longDraft = `${Array.from({ length: 22 }, (_, index) => `Synthetic paragraph ${index + 1}. The student develops one idea in their own words and keeps notebook planning separate from canonical prose.`).join('\n\n')}\n\nNear the bottom, the student names the real problem was trust and decides to explain that turn with precise evidence.`;
await notebook.locator('#draftEditor').fill(longDraft);
check('canonical draft word count updates truthfully while typing', /words/.test(await notebook.locator('#orientationDraftWords').textContent()) && !/^0 /.test(await notebook.locator('#orientationDraftWords').textContent()));
await notebook.waitForTimeout(230);
await notebook.locator('[data-action="place-notebook"]').first().click();
check('Notebook remains reachable in one action after draft creation', await notebook.locator('#notebookEditor').isVisible() && await notebook.locator('#notebookEditor').inputValue() === pastedNotebook);
await notebook.locator('[data-action="place-draft"]').click();
check('Draft returns exactly unchanged in one action', await notebook.locator('#draftEditor').inputValue() === longDraft);
await notebook.reload();
check('exact canonical draft continuity survives reload', await notebook.locator('#draftEditor').inputValue() === longDraft);

const notebookSelected = 'the real problem was trust';
await notebook.locator('#draftEditor').evaluate((editor, passage) => {
    editor.scrollTop = editor.scrollHeight;
    const start = editor.value.lastIndexOf(passage);
    editor.focus(); editor.setSelectionRange(start, start + passage.length);
    editor.dispatchEvent(new Event('select', { bubbles: true }));
}, notebookSelected);
await notebook.waitForTimeout(50);
check('bottom passage opens an app-owned Passage Tray without a navigation jump', await notebook.locator('#passageBar').isVisible() && /Near the bottom/.test(await notebook.locator('#draftEditor').inputValue()));
await notebook.locator('#draftEditor').evaluate(editor => editor.setSelectionRange(editor.value.length, editor.value.length));
check('Notebook Passage Tray preserves exact text after selection collapse', await notebook.locator('#passageExcerpt').textContent() === notebookSelected);
await notebook.locator('[data-action="passage-review"]').click();
check('Notebook passage consent has selected, paragraph, and full-draft scopes', await notebook.locator('input[name="reviewScope"]').count() === 3);
check('Notebook passage exact preview is preserved', await notebook.locator('#scopePreview').textContent() === notebookSelected);
await notebook.locator('#transmitConsent').check();
await notebook.locator('[data-action="submit-mock"]').click();
await notebook.waitForTimeout(350);
check('Notebook coach result is reload-proof review history', await notebook.locator('.review-card').count() >= 1);
await notebook.locator('[data-action="decision"][data-choice="later"]').first().click();
check('Decide later records evidence without rewriting the draft', await notebook.locator('[data-tab="decisions"]').textContent().then(text => /\(1\)/.test(text)) && await notebook.evaluate(text => JSON.parse(localStorage.getItem('tupana-explore:writing-studio-ux-2026-08:notebook:v1')).draft === text, longDraft));
await notebook.locator('[data-action="close-dialog"]').first().click();

await notebook.locator('[data-action="focused-review"]').click();
check('focused review identifies exact payload and genre lens', await notebook.locator('#scopePreview').textContent() === notebookSelected && await notebook.locator('input[name="reviewLens"]:checked').count() === 1);
await notebook.locator('#transmitConsent').check();
await notebook.locator('[data-action="submit-mock"]').click();
await notebook.waitForTimeout(350);
await notebook.locator('[data-action="close-dialog"]').first().click();
check('focused review creates a dated canonical-draft snapshot', await notebook.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('tupana-explore:writing-studio-ux-2026-08:notebook:v1'));
    return saved.versions.length >= 1 && Boolean(saved.versions[0].createdAt) && saved.versions[0].words > 0;
}));

await notebook.locator('[data-action="council"]').first().click();
check('Notebook Council previews the exact full draft before consent', await notebook.locator('.exact-preview').textContent() === longDraft);
await notebook.locator('#transmitConsent').check();
await notebook.locator('[data-action="run-council"]').click();
await notebook.waitForTimeout(80);
check('Notebook Council report persists and is revisitable', /\(1\)/.test(await notebook.locator('[data-tab="council"]').textContent()));
await notebook.locator('[data-action="close-dialog"]').first().click();
await notebook.reload();
await notebook.locator('[data-action="review-center"]').first().click();
await notebook.locator('[data-action="review-tab"][data-tab="council"]').click();
check('Council history survives reload', await notebook.locator('.review-card').count() === 1);
await notebook.locator('[data-action="close-dialog"]').first().click();

await notebook.locator('[data-action="continue"]').click();
check('Notebook reflection has three required student-authored prompts', await notebook.locator('#reflectionForm textarea[required]').count() === 3);
check('Notebook optional knowledge prompt stays separate', await notebook.locator('#reflection-knowledge:not([required])').count() === 1);
await notebook.locator('#reflection-changed').fill('I clarified the turn and added concrete evidence in my own words.');
await notebook.locator('#reflection-decision').fill('I decided later on one question because I need to verify the evidence first.');
await notebook.locator('#reflection-voice').fill('I preserved the plain sentence about trust because it sounds like me.');
await notebook.locator('[data-action="finish"]').click();
check('Notebook Finish separates student reflection and instructor evidence', await notebook.getByRole('heading', { name: /Student reflection/ }).count() === 1 && await notebook.getByRole('heading', { name: /Instructor evidence appendix/ }).count() === 1);
check('Notebook Finish distinguishes Save, Finish, packet, Backup, and external Submit', /Save[\s\S]*Finish[\s\S]*Create local packet[\s\S]*Backup[\s\S]*External Submit/.test(await notebook.locator('.action-meanings').textContent()));
check('Notebook final-draft confirmation previews exact canonical draft', await notebook.locator('#finalDraftPreview').textContent() === longDraft);
await notebook.locator('#packetConfirm').check();
await notebook.locator('[data-action="create-packet"]').click();
check('Notebook final packet is created locally only after confirmation', await notebook.locator('[data-action="download-packet"]').isVisible());

await notebook.locator('[data-action="language"]').selectOption('es');
await notebook.locator('[data-action="genre"]').selectOption('stem');
await notebook.locator('[data-action="return-write"]').click();
await notebook.locator('[data-action="place-notebook"]').first().click();
const stemNotebook = await notebook.locator('.notebook-card-list').textContent();
check('STEM notebook uses structural genre cards without autobiographical fallback', /Contexto científico/.test(stemNotebook) && /Hipótesis/.test(stemNotebook) && !/Anécdota|tu historia/i.test(stemNotebook));
await notebook.locator('[data-action="language"]').selectOption('both');
check('optional bilingual mode preserves coherent Spanish-primary density', /Contexto científico/.test(await notebook.locator('.notebook-card-list').textContent()) && /Your notebook stays beside you/.test(await notebook.locator('.authorship-card').textContent()));

await notebook.locator('[data-action="settings"]').click();
check('Notebook Settings has one clear Danger Zone deletion path', await notebook.getByRole('heading', { name: /Zona de peligro/ }).count() === 1);
check('Notebook documents the no-Focus mobile decision', /No hay modo Enfoque separado/.test(await notebook.locator('.packet-section').first().textContent()));
await notebook.locator('#deleteConfirm').fill('DELETE');
await notebook.locator('[data-action="delete-state"]').click();
check('Notebook deletion removes only its isolated key and preserves R0 sentinel', await notebook.evaluate(() => localStorage.getItem('tupana-explore:writing-studio-ux-2026-08:notebook:v1') === null && localStorage.getItem('tupana_draft') === 'R0 SENTINEL — MUST SURVIVE'));
check('Notebook makes no external network requests', notebookExternalRequests.length === 0, notebookExternalRequests.join(', '));
check('Notebook produces no page JavaScript errors', notebookErrors.length === 0, notebookErrors.join(' | '));
await notebook.close();

console.log('\nINTEGRATED DESK finalist');
const integrated = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const integratedErrors = [];
const integratedExternalRequests = [];
integrated.on('pageerror', error => integratedErrors.push(String(error)));
integrated.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:3001/')) integratedExternalRequests.push(request.url());
});
await integrated.goto(`${BASE}?concept=integrated`);
await integrated.evaluate(() => {
    localStorage.setItem('tupana_draft', 'R0 SENTINEL — MUST SURVIVE');
    localStorage.removeItem('tupana-explore:writing-studio-ux-2026-08:integrated:v1');
});
await integrated.reload();

const densityDesk = await browser.newPage({ viewport: { width: 1440, height: 960 } });
await densityDesk.goto(`${BASE}?concept=desk`);
await densityDesk.evaluate(() => localStorage.removeItem('tupana-explore:writing-studio-ux-2026-08:desk:v1'));
await densityDesk.reload();
const plainDeskInitialWords = await visibleWordCount(densityDesk);
const integratedInitialWords = await visibleWordCount(integrated);
console.log(`  ℹ️ density signal — plain Desk ${plainDeskInitialWords} visible words; Integrated Desk ${integratedInitialWords}; audited original stage-1 chrome ≈205 single-language / ≈330 bilingual`);
check('Integrated initial density stays below the audited original single-language stage-1 chrome signal', integratedInitialWords < 205);
check('Integrated adds guidance without doubling plain Desk initial density', integratedInitialWords < plainDeskInitialWords * 2);
await densityDesk.close();

check('Integrated Desk is labeled as a finalist under evaluation, not selected', /Finalist under evaluation/.test(await integrated.locator('.prototype-header').textContent()) && !/selected product/i.test(await integrated.locator('body').textContent()));
check('Integrated Desk retains exactly three primary Desk destinations', await integrated.locator('.phase-strip .phase-tab').count() === 3 && /Current draft/.test(await integrated.locator('.phase-strip').textContent()));
check('canonical mixed-genre autobiographical profile is available and selected for Path A', await integrated.locator('[data-action="genre"] option[value="autobiographical"]').count() === 1 && await integrated.locator('[data-action="genre"]').inputValue() === 'autobiographical');
check('cultural onboarding is brief, inline, optional, and not a blocking dialog', await integrated.locator('.knowledge-onboarding').isVisible() && await integrated.locator('[role="dialog"]').count() === 0 && await integrated.locator('.knowledge-actions button').count() === 2);
check('cultural onboarding names canonical knowledge resources and protects disclosure choice', /cultural, linguistic, family, community, historical, and experiential knowledge/i.test(await integrated.locator('.knowledge-onboarding').textContent()) && /always optional/i.test(await integrated.locator('.knowledge-onboarding').textContent()));
check('cultural onboarding explicitly permits multilingual and translingual expression', /English, Spanish, or code-mesh/.test(await integrated.locator('.knowledge-onboarding').textContent()));
await integrated.locator('[data-action="knowledge-choice"][data-choice="engage"]').click();
check('knowledge and language lens remains revisitable after engagement', await integrated.locator('.knowledge-revisit').isVisible());
check('autobiographical path exposes four skippable genre-specific Moves', await integrated.locator('.integrated-move').count() === 4 && /Connect memory to a larger force/.test(await integrated.locator('.integrated-moves').textContent()) && /optional guidance/.test(await integrated.locator('.integrated-moves').textContent()));

const moveNote = 'Synthetic planning note: connect language access to institutional power without disclosing a private family story.';
await integrated.locator('[data-action="integrated-move-note"][data-move="1"]').click();
check('Move note dialog explains the reference-only authorship boundary', /never transfers into or changes the canonical draft/.test(await integrated.locator('[role="dialog"]').textContent()));
check('Integrated Desk never shows more than one blocking dialog', await integrated.locator('[role="dialog"]').count() === 1);
await integrated.locator('#integratedMoveNote').fill(moveNote);
await integrated.locator('[data-action="save-integrated-note"]').click();
check('useful Move content—not navigation—creates planning evidence', /1 Move notes with content/.test(await integrated.locator('.integrated-support').textContent()));
check('saved Move note becomes a compact reference beside the Draft', await integrated.locator('.planning-reference').isVisible());
check('canonical Draft remains exactly empty after saving a Move note', await integrated.locator('#draftEditor').inputValue() === '');

const integratedDraft = `${Array.from({ length: 22 }, (_, index) => `Synthetic paragraph ${index + 1}. The writer connects a chosen memory to language access, institutional history, and power without exposing private details.`).join('\n\n')}\n\nNear the bottom, the writer explains that the real problem was trust and keeps the phrase aquí escuchamos primero because its rhythm carries culturally situated meaning.`;
await integrated.locator('#draftEditor').fill(integratedDraft);
await integrated.waitForTimeout(230);
check('student may draft directly without completing Moves or receiving warnings', await integrated.locator('#draftEditor').inputValue() === integratedDraft && await integrated.locator('.integrated-move').count() === 4);
check('visible Ask Tu Pana is actionable near the editor', await integrated.locator('.coach-entry [data-action="coach"]').isVisible());
await integrated.locator('.coach-entry [data-action="coach"]').click();
check('coach entry previews purpose, reviewer, one mock call, and decision ownership', /Purpose/.test(await integrated.locator('.transmission-facts').textContent()) && /Tu Pana mock writing coach/.test(await integrated.locator('.transmission-facts').textContent()) && /1/.test(await integrated.locator('.transmission-facts').textContent()) && /remain the author and decision-maker/.test(await integrated.locator('.transmission-facts').textContent()));
check('coach entry without a selection offers only truthful paragraph and full-draft scopes', await integrated.locator('input[name="reviewScope"]').count() === 2 && await integrated.locator('input[name="reviewScope"][value="selected"]').count() === 0 && (await integrated.locator('#scopePreview').textContent()).length > 0);
check('coach request remains disabled until explicit consent', await integrated.locator('[data-action="submit-mock"]').isDisabled());
await integrated.locator('[data-action="close-dialog"]').first().click();

const protectedPhrase = 'aquí escuchamos primero';
await integrated.locator('#draftEditor').evaluate((editor, passage) => {
    const start = editor.value.lastIndexOf(passage);
    editor.focus(); editor.setSelectionRange(start, start + passage.length);
    editor.dispatchEvent(new Event('select', { bubbles: true }));
}, protectedPhrase);
await integrated.waitForTimeout(50);
check('autobiographical Passage Tray offers exact student-controlled phrase protection', await integrated.locator('[data-action="protect-phrase"]').isVisible() && await integrated.locator('#passageExcerpt').textContent() === protectedPhrase);
await integrated.locator('[data-action="protect-phrase"]').click();
check('protecting a multilingual phrase preserves exact text without changing the Draft', await integrated.evaluate(({ draft, phrase }) => {
    const saved = JSON.parse(localStorage.getItem('tupana-explore:writing-studio-ux-2026-08:integrated:v1'));
    return saved.draft === draft && saved.protectedPhrases.length === 1 && saved.protectedPhrases[0].text === phrase;
}, { draft: integratedDraft, phrase: protectedPhrase }) && /1 student-protected voice phrases/.test(await integrated.locator('.integrated-support').textContent()));

const integratedPassage = 'the real problem was trust';
await integrated.locator('#draftEditor').evaluate((editor, passage) => {
    editor.scrollTop = editor.scrollHeight;
    const start = editor.value.lastIndexOf(passage);
    editor.focus(); editor.setSelectionRange(start, start + passage.length);
    editor.dispatchEvent(new Event('select', { bubbles: true }));
}, integratedPassage);
await integrated.waitForTimeout(50);
check('bottom selection opens the persistent app-owned Passage Tray', await integrated.locator('#passageBar').isVisible());
await integrated.locator('#draftEditor').evaluate(editor => editor.setSelectionRange(editor.value.length, editor.value.length));
check('Passage Tray preserves exact text after native selection collapse', await integrated.locator('#passageExcerpt').textContent() === integratedPassage);
await integrated.locator('[data-action="passage-review"]').click();
check('Passage Tray consent previews the exact selected payload', await integrated.locator('#scopePreview').textContent() === integratedPassage);
await integrated.locator('#transmitConsent').check();
await integrated.locator('[data-action="submit-mock"]').click();
await integrated.waitForTimeout(350);
check('deterministic mock feedback returns without rewriting the Draft', await integrated.locator('.review-card').count() === 1 && await integrated.evaluate(text => JSON.parse(localStorage.getItem('tupana-explore:writing-studio-ux-2026-08:integrated:v1')).draft === text, integratedDraft));
check('critical AI literacy starts collapsed with one contextual action', await integrated.locator('.critical-moment').count() === 1 && !(await integrated.locator('.critical-moment').evaluate(el => el.open)));
await integrated.locator('.critical-moment > summary').click();
check('contextual prompt retains canonical Five Questions wording', /Does this still sound like the specific person who wrote it/.test(await integrated.locator('.critical-moment').textContent()));
check('autobiographical voice prompt surfaces the risk of genericizing or flattening situated language', /genericize or flatten multilingual, family, community, or dialectal meaning/.test(await integrated.locator('.critical-moment').textContent()));
check('remaining framework stays behind optional progressive disclosure', await integrated.locator('.critical-framework').count() === 1 && !(await integrated.locator('.critical-framework').evaluate(el => el.open)));
await integrated.locator('[data-action="decision"][data-choice="adapt"]').first().click();
check('student decision opens a lightweight optional rationale—not an automatic rewrite', await integrated.locator('#decisionRationale').isVisible() && await integrated.locator('[role="dialog"]').count() === 1);
const rationale = 'I will adapt the question because the Spanish phrase protects my voice while the surrounding evidence needs more specificity.';
await integrated.locator('#decisionRationale').fill(rationale);
await integrated.locator('[data-action="save-integrated-decision"]').click();
await integrated.locator('[data-action="review-tab"][data-tab="decisions"]').click();
check('decision ledger preserves source, scope, critical prompt, and student rationale', /selected/.test(await integrated.locator('.review-feed').textContent()) && /Critical prompt/.test(await integrated.locator('.review-feed').textContent()) && (await integrated.locator('.review-feed').textContent()).includes(rationale));
check('decision remains separate from unchanged canonical prose', await integrated.evaluate(text => JSON.parse(localStorage.getItem('tupana-explore:writing-studio-ux-2026-08:integrated:v1')).draft === text, integratedDraft));
await integrated.locator('[data-action="close-dialog"]').first().click();

await integrated.locator('[data-action="focused-review"]').click();
check('focused review identifies exact payload and one genre-aware lens', await integrated.locator('input[name="reviewLens"]').count() === 3 && /one chosen genre-aware review lens/i.test(await integrated.locator('.transmission-facts').textContent()));
await integrated.locator('#transmitConsent').check();
await integrated.locator('[data-action="submit-mock"]').click();
await integrated.waitForTimeout(350);
check('focused review is saved in reload-proof Review Center history', await integrated.locator('.review-card').count() === 2);
await integrated.locator('[data-action="close-dialog"]').first().click();

await integrated.locator('[data-action="council"]').first().click();
check('autobiographical Council disclosure names canonical role translations, exact full payload, and four represented mock calls', /Connection and structure reviewer/.test(await integrated.locator('.transmission-facts').textContent()) && /Evidence and historical-context reviewer/.test(await integrated.locator('.transmission-facts').textContent()) && /Voice and cultural-integrity reviewer/.test(await integrated.locator('.transmission-facts').textContent()) && /3 reviewer calls \+ 1 synthesis/.test(await integrated.locator('.transmission-facts').textContent()) && await integrated.locator('.exact-preview').textContent() === integratedDraft);
await integrated.locator('#transmitConsent').check();
await integrated.locator('[data-action="run-council"]').click();
check('mock Council report is persisted and revisitable', /\(1\)/.test(await integrated.locator('.dialog [data-tab="council"]').textContent()));
await integrated.locator('.critical-moment > summary').click();
check('Council critical prompt names stereotyping, depoliticizing, and misreading risks', /stereotype, depoliticize, or misread culturally situated knowledge/.test(await integrated.locator('.critical-moment').textContent()));
await integrated.locator('[data-action="close-dialog"]').first().click();
check('Evidence so far reports factual activity without claiming understanding', /1 Move notes with content/.test(await integrated.locator('.integrated-support').textContent()) && !/understood|mastered|learned/i.test(await integrated.locator('.integrated-support').textContent()));

await integrated.locator('[data-action="continue"]').click();
check('Integrated reflection has three required student-authored prompts and one optional knowledge prompt', await integrated.locator('#reflectionForm textarea[required]').count() === 3 && await integrated.locator('#reflection-knowledge:not([required])').count() === 1);
await integrated.locator('#reflection-changed').fill('I made the turn from efficiency to trust more precise with evidence I selected.');
await integrated.locator('#reflection-decision').fill('I adapted one mock question because it protected my voice and identified a real evidence gap.');
await integrated.locator('#reflection-voice').fill('I preserved aquí escuchamos primero because the phrase carries the rhythm I intended.');
await integrated.locator('#reflection-knowledge').fill('Language choice and community knowledge shaped the explanation, without requiring private disclosure.');
await integrated.locator('[data-action="finish"]').click();
check('Finish separates student reflection from system-generated instructor evidence', await integrated.getByRole('heading', { name: /Student reflection/ }).count() === 1 && await integrated.getByRole('heading', { name: /Instructor evidence appendix/ }).count() === 1);
check('Integrated Finish distinguishes Save, Finish, packet, Backup, and external Submit', /Save[\s\S]*Finish[\s\S]*Create local packet[\s\S]*Backup[\s\S]*External Submit/.test(await integrated.locator('.action-meanings').textContent()));
check('final-draft confirmation previews the exact canonical Draft', await integrated.locator('#finalDraftPreview').textContent() === integratedDraft);
check('autobiographical Finish presents four genre-appropriate student checks without app inference', await integrated.locator('.genre-finish-check input').count() === 4 && /historical, social, cultural, linguistic, economic, or political force/.test(await integrated.locator('.genre-finish-check').textContent()) && /Your check—not an app inference/.test(await integrated.locator('.genre-finish-check').textContent()));
for (const checkbox of await integrated.locator('.genre-finish-check input').all()) await checkbox.check();
await integrated.locator('#packetConfirm').check();
await integrated.locator('[data-action="create-packet"]').click();
check('local packet appears only after deliberate exact-draft confirmation', await integrated.locator('[data-action="download-packet"]').isVisible());
await integrated.reload();
const persistedIntegrated = await integrated.evaluate(() => JSON.parse(localStorage.getItem('tupana-explore:writing-studio-ux-2026-08:integrated:v1')));
check('reload restores exact Draft, Move note, protected phrase, reviews, Council, decision, rationale, reflection, Finish checks, versions, and packet', persistedIntegrated.draft === integratedDraft && persistedIntegrated.moveNotes['autobiographical:larger-force'].text === moveNote && persistedIntegrated.protectedPhrases[0].text === protectedPhrase && persistedIntegrated.reviews.length === 2 && persistedIntegrated.councilRuns.length === 1 && persistedIntegrated.decisions.length === 1 && persistedIntegrated.decisions[0].rationale === rationale && persistedIntegrated.reflections.changed.length > 0 && Object.values(persistedIntegrated.finishChecks).filter(Boolean).length === 4 && persistedIntegrated.versions.length >= 1 && persistedIntegrated.packetDraft === integratedDraft);
check('critical-prompt evidence records opening only, not claimed understanding', persistedIntegrated.criticalViews.length >= 1 && persistedIntegrated.criticalViews.every(view => Boolean(view.openedAt) && !('understood' in view)));
check('Move note never transfers into canonical Draft after reload', !persistedIntegrated.draft.includes(moveNote) && persistedIntegrated.moveNotes['autobiographical:larger-force'].text === moveNote);
check('English/Spanish code-meshed student text survives save and reload byte-for-byte', persistedIntegrated.draft === integratedDraft && persistedIntegrated.draft.includes('aquí escuchamos primero'));

await integrated.locator('[data-action="genre"]').selectOption('stem');
await integrated.locator('[data-action="return-write"]').click();
const stemSupport = await integrated.locator('.integrated-support').textContent();
check('STEM path uses disciplinary Moves with no cultural-onboarding leakage', /Question and prediction/.test(stemSupport) && /Separate observation from interpretation/.test(stemSupport) && await integrated.locator('.knowledge-onboarding').count() === 0 && !/family story|cultural disclosure|admissions reader/i.test(stemSupport));
check('unavailable STEM Council profile fails explicitly instead of inventing roles', /Council is not configured for this genre/.test(stemSupport) && await integrated.locator('.support-action.unavailable').count() === 1);
await integrated.locator('[data-action="reflection"]').first().click();
check('STEM optional reflection asks about disciplinary knowledge, not identity disclosure', /disciplinary knowledge, data, or observations/.test(await integrated.locator('label[for="reflection-knowledge"]').textContent()) && !/family|community|cultural/i.test(await integrated.locator('label[for="reflection-knowledge"]').textContent()));
await integrated.locator('[data-action="return-write"]').click();

for (const [genre, expected] of [['admissions', 'Choose what you want to reveal'], ['sop', 'Trace a supported direction'], ['neutral', 'Clarify purpose and audience']]) {
    await integrated.locator('[data-action="genre"]').selectOption(genre);
    const support = await integrated.locator('.integrated-support').textContent();
    check(`${genre} profile has its own guidance with zero autobiographical onboarding or Move leakage`, support.includes(expected) && await integrated.locator('.knowledge-onboarding').count() === 0 && !/Choose a memory and a boundary|Connect memory to a larger force|Protect language and voice/.test(support));
}
check('General Writing remains explicitly neutral rather than an autobiographical fallback', await integrated.locator('[data-action="genre"]').inputValue() === 'neutral' && /Clarify purpose and audience/.test(await integrated.locator('.integrated-support').textContent()) && !/identity|family|trauma|memory|cultural disclosure/i.test(await integrated.locator('.integrated-support').textContent()));

await integrated.locator('[data-action="genre"]').selectOption('stem');
await integrated.locator('[data-action="language"]').selectOption('es');
const spanishVisibleWords = (await integrated.locator('body').innerText()).trim().split(/\s+/).length;
check('Spanish-only mode replaces primary chrome instead of duplicating every control', /Borrador actual/.test(await integrated.locator('.phase-strip').textContent()) && !/Current draft/.test(await integrated.locator('.phase-strip').textContent()));
await integrated.locator('[data-action="language"]').selectOption('both');
const bilingualVisibleWords = (await integrated.locator('body').innerText()).trim().split(/\s+/).length;
check('optional bilingual mode is coherent and denser only by explicit choice', bilingualVisibleWords > spanishVisibleWords && /Select words in the draft/.test(await integrated.locator('body').textContent()));

await integrated.locator('[data-action="language"]').selectOption('en');
await integrated.locator('.icon-button[data-action="settings"]').click();
check('Integrated Settings documents Focus and one isolated Danger Zone path', /Integrated Desk keeps Focus/.test(await integrated.locator('[role="dialog"]').textContent()) && await integrated.getByRole('heading', { name: /Danger Zone|Zona de peligro/ }).count() === 1);
await integrated.locator('#deleteConfirm').fill('DELETE');
await integrated.locator('[data-action="delete-state"]').click();
check('Integrated deletion removes only its namespaced record and preserves R0 sentinel', await integrated.evaluate(() => localStorage.getItem('tupana-explore:writing-studio-ux-2026-08:integrated:v1') === null && localStorage.getItem('tupana_draft') === 'R0 SENTINEL — MUST SURVIVE'));
check('Integrated Desk makes no external network requests', integratedExternalRequests.length === 0, integratedExternalRequests.join(', '));
check('Integrated Desk produces no page JavaScript errors', integratedErrors.length === 0, integratedErrors.join(' | '));
await integrated.close();

const unknownContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await unknownContext.addInitScript(() => localStorage.setItem('tupana-explore:writing-studio-ux-2026-08:integrated:v1', JSON.stringify({ schema: 1, concept: 'integrated', genre: 'mystery-genre' })));
const unknown = await unknownContext.newPage();
const unknownExternalRequests = [];
unknown.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:3001/')) unknownExternalRequests.push(request.url());
});
await unknown.goto(`${BASE}?concept=integrated`);
check('unknown assignment fails loudly and names the unresolved genre id', /This writing genre is not configured/.test(await unknown.locator('main').textContent()) && /mystery-genre/.test(await unknown.locator('main').textContent()));
check('unknown assignment inherits neither autobiography nor General Writing', await unknown.locator('.integrated-moves').count() === 0 && !/Choose a memory and a boundary|Clarify purpose and audience/.test(await unknown.locator('main').textContent()));
check('unknown assignment makes no external request while awaiting explicit selection', unknownExternalRequests.length === 0, unknownExternalRequests.join(', '));
await unknownContext.close();

const ordinaryContext = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const ordinary = await ordinaryContext.newPage();
const ordinaryExternalRequests = [];
ordinary.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:3001/')) ordinaryExternalRequests.push(request.url());
});
await ordinary.goto(`${BASE}?concept=integrated`);
const ordinaryPrimaryPlaces = await ordinary.locator('.phase-strip .phase-tab').count();
check('ordinary Integrated path allows immediate writing without answering cultural onboarding', await ordinary.locator('.knowledge-onboarding').isVisible() && await ordinary.locator('#draftEditor').isEditable());
const ordinaryDraft = 'Synthetic ordinary-path draft. The student writes one piece in their own voice and chooses not to invoke optional support.';
await ordinary.locator('#draftEditor').fill(ordinaryDraft);
await ordinary.waitForTimeout(230);
await ordinary.locator('[data-action="continue"]').click();
check('ordinary path reaches Process Reflection with zero Move, onboarding, or AI actions', await ordinary.locator('#reflectionForm').isVisible() && await ordinary.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('tupana-explore:writing-studio-ux-2026-08:integrated:v1'));
    return saved.knowledgeChoice === null && Object.keys(saved.moveNotes).length === 0 && saved.reviews.length === 0 && saved.councilRuns.length === 0 && saved.decisions.length === 0;
}));
await ordinary.locator('#reflection-changed').fill('I clarified the purpose in my own words.');
await ordinary.locator('#reflection-decision').fill('I chose not to use optional AI review for this draft.');
await ordinary.locator('#reflection-voice').fill('I kept the language that sounded like me.');
await ordinary.locator('[data-action="finish"]').click();
const ordinaryReadiness = ordinary.locator('.finish-grid').first().locator('.check-list');
check('ordinary non-AI path reaches Finish without implying optional Council or AI is missing', await ordinary.locator('[data-action="create-packet"]').isEnabled() && /No Council requested—optional/.test(await ordinaryReadiness.textContent()) && /No AI decisions—AI is optional/.test(await ordinaryReadiness.textContent()));
check('ordinary path adds zero mandatory action before writing and no new primary destination', ordinaryPrimaryPlaces === 3 && await ordinary.locator('.knowledge-onboarding button[required]').count() === 0 && await ordinary.locator('[role="dialog"]').count() === 0);
check('ordinary no-AI path makes no external request', ordinaryExternalRequests.length === 0, ordinaryExternalRequests.join(', '));
await ordinaryContext.close();

console.log('\nMobile, keyboard, and accessibility geometry');
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobile.goto(`${BASE}?concept=desk`);
await mobile.locator('[data-action="sample"]').click();
const mobilePassage = 'the real problem was trust';
await mobile.locator('#draftEditor').evaluate((editor, passage) => {
    const start = editor.value.indexOf(passage);
    editor.focus(); editor.setSelectionRange(start, start + passage.length);
    editor.dispatchEvent(new Event('select', { bubbles: true }));
}, mobilePassage);
await mobile.waitForTimeout(50);
const passageGeometry = await mobile.locator('#passageBar').evaluate(el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, width: r.width, viewport: { w: innerWidth, h: innerHeight } };
});
check('mobile passage action stays inside current visual viewport', passageGeometry.top >= 0 && passageGeometry.bottom <= passageGeometry.viewport.h && passageGeometry.width <= passageGeometry.viewport.w);
check('mobile layout has no horizontal overflow', await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
const smallTargets = await mobile.locator('button:visible, a.switch-link:visible').evaluateAll(elements => elements.map(el => ({ name: el.getAttribute('aria-label') || el.textContent.trim(), rect: el.getBoundingClientRect() })).filter(item => item.rect.width < 44 || item.rect.height < 44));
check('visible mobile controls meet 44px target minimum', smallTargets.length === 0, JSON.stringify(smallTargets.slice(0, 5)));
const unnamed = await mobile.locator('button:visible').evaluateAll(elements => elements.filter(el => !(el.getAttribute('aria-label') || el.textContent.trim())).length);
check('visible buttons have accessible names', unnamed === 0);
await mobile.locator('[data-action="passage-review"]').focus();
await mobile.keyboard.press('Enter');
check('passage action is keyboard operable', await mobile.locator('[role="dialog"]').isVisible());
await mobile.keyboard.press('Escape');
check('Escape closes dialog and restores working context', !(await mobile.locator('[role="dialog"]').isVisible()));
check('Desk deliberately retains Focus on mobile', await mobile.locator('[data-action="focus"]').isVisible());
await mobile.goto(`${BASE}?concept=journey`);
check('Journey deliberately omits Focus control on mobile', !(await mobile.locator('[data-action="focus"]').isVisible()));
await mobile.goto(`${BASE}?concept=hybrid`);
check('Hybrid deliberately omits separate Focus control', await mobile.locator('[data-action="focus"]').count() === 0);
await mobile.goto(`${BASE}?concept=notebook`);
await mobile.evaluate(() => localStorage.removeItem('tupana-explore:writing-studio-ux-2026-08:notebook:v1'));
await mobile.reload();
await mobile.locator('[data-action="create-draft"]').first().click();
await mobile.locator('#draftEditor').fill(`${'Synthetic mobile paragraph. '.repeat(120)}Near the bottom is a passage for exact coaching.`);
await mobile.waitForTimeout(230);
check('Notebook mobile gives the draft priority', await mobile.locator('#draftEditor').isVisible() && (await mobile.locator('#draftEditor').boundingBox()).y < 700);
check('Notebook mobile does not compress the desktop reference split', !(await mobile.locator('.notebook-reference').isVisible()));
check('Notebook remains a stable one-action mobile tab', await mobile.locator('[data-action="place-notebook"]').first().isVisible());
const currentSwitcher = await mobile.locator('.concept-switcher [aria-current="page"]').boundingBox();
check('Notebook current switcher item begins inside the mobile viewport', currentSwitcher.x >= 0 && currentSwitcher.x + currentSwitcher.width <= 390);
check('Notebook deliberately omits separate Focus control', await mobile.locator('[data-action="focus"]').count() === 0);
const notebookOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
check('Notebook mobile has no horizontal overflow at 390×844', notebookOverflow);
const notebookTargets = await mobile.locator('button:visible, a.switch-link:visible').evaluateAll(elements => elements.map(el => ({ name: el.getAttribute('aria-label') || el.textContent.trim(), rect: el.getBoundingClientRect() })).filter(item => item.rect.width < 44 || item.rect.height < 44));
check('Notebook visible mobile controls meet 44px target minimum', notebookTargets.length === 0, JSON.stringify(notebookTargets.slice(0, 5)));
await mobile.locator('#draftEditor').evaluate(editor => {
    const passage = 'a passage for exact coaching';
    const start = editor.value.indexOf(passage);
    editor.scrollTop = editor.scrollHeight;
    editor.focus(); editor.setSelectionRange(start, start + passage.length);
    editor.dispatchEvent(new Event('select', { bubbles: true }));
});
await mobile.waitForTimeout(50);
const notebookTrayGeometry = await mobile.locator('#passageBar').evaluate(el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, width: r.width, viewport: { w: innerWidth, h: innerHeight } };
});
check('Notebook mobile Passage Tray stays within the visual viewport', notebookTrayGeometry.top >= 0 && notebookTrayGeometry.bottom <= notebookTrayGeometry.viewport.h && notebookTrayGeometry.width <= notebookTrayGeometry.viewport.w);

await mobile.goto(`${BASE}?concept=integrated`);
await mobile.evaluate(() => localStorage.removeItem('tupana-explore:writing-studio-ux-2026-08:integrated:v1'));
await mobile.reload();
await mobile.locator('[data-action="knowledge-choice"][data-choice="skip"]').click();
await mobile.locator('#draftEditor').fill(`${'Synthetic mobile paragraph keeps one canonical draft and calm optional guidance. '.repeat(120)}Near the bottom is an exact passage for Integrated Desk coaching.`);
await mobile.waitForTimeout(230);
check('Integrated mobile gives the canonical Draft priority over supporting notes', await mobile.locator('#draftEditor').isVisible() && (await mobile.locator('#draftEditor').boundingBox()).y < 700 && (await mobile.locator('.integrated-support').boundingBox()).y > (await mobile.locator('#draftEditor').boundingBox()).y);
const integratedCoachBox = await mobile.locator('.coach-entry').boundingBox();
check('Integrated mobile keeps the actionable coach entry adjacent to the editor', await mobile.locator('.coach-entry [data-action="coach"]').isVisible() && integratedCoachBox.y < 844);
const integratedSwitcher = await mobile.locator('.concept-switcher [aria-current="page"]').boundingBox();
check('Integrated current switcher item begins inside the mobile viewport', integratedSwitcher.x >= 0 && integratedSwitcher.x + integratedSwitcher.width <= 390);
check('Integrated deliberately retains Focus on mobile', await mobile.locator('[data-action="focus"]').isVisible());
check('Integrated mobile has no horizontal overflow at 390×844', await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
const integratedTargets = await mobile.locator('button:visible, a.switch-link:visible, summary:visible').evaluateAll(elements => elements.map(el => ({ name: el.getAttribute('aria-label') || el.textContent.trim(), rect: el.getBoundingClientRect() })).filter(item => item.rect.width < 44 || item.rect.height < 44));
check('Integrated visible mobile controls and disclosures meet 44px target minimum', integratedTargets.length === 0, JSON.stringify(integratedTargets.slice(0, 8)));
const integratedUnnamed = await mobile.locator('button:visible').evaluateAll(elements => elements.filter(el => !(el.getAttribute('aria-label') || el.textContent.trim())).length);
check('Integrated visible buttons have accessible names', integratedUnnamed === 0);
await mobile.locator('#draftEditor').evaluate(editor => {
    const passage = 'exact passage for Integrated Desk coaching';
    const start = editor.value.indexOf(passage);
    editor.scrollTop = editor.scrollHeight;
    editor.focus(); editor.setSelectionRange(start, start + passage.length);
    editor.dispatchEvent(new Event('select', { bubbles: true }));
});
await mobile.waitForTimeout(50);
const integratedTrayGeometry = await mobile.locator('#passageBar').evaluate(el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, width: r.width, viewport: { w: innerWidth, h: innerHeight } };
});
check('Integrated Passage Tray stays inside the emulated mobile visual viewport', integratedTrayGeometry.top >= 0 && integratedTrayGeometry.bottom <= integratedTrayGeometry.viewport.h && integratedTrayGeometry.width <= integratedTrayGeometry.viewport.w);
await mobile.locator('[data-action="passage-review"]').focus();
await mobile.keyboard.press('Enter');
await mobile.waitForTimeout(50);
check('Integrated disclosure dialog receives focus and remains the only dialog', await mobile.locator('[role="dialog"]').isVisible() && await mobile.locator('[role="dialog"]').count() === 1 && await mobile.locator('[role="dialog"]').evaluate(dialog => dialog.contains(document.activeElement)));
await mobile.keyboard.press('Escape');
check('Integrated Escape closes disclosure and restores passage context', await mobile.locator('[role="dialog"]').count() === 0 && await mobile.locator('#passageBar').isVisible());
await mobile.emulateMedia({ reducedMotion: 'reduce' });
check('Integrated honors reduced-motion preference', await mobile.evaluate(() => {
    const duration = getComputedStyle(document.querySelector('.button')).transitionDuration;
    const seconds = duration.endsWith('ms') ? parseFloat(duration) / 1000 : parseFloat(duration);
    return matchMedia('(prefers-reduced-motion: reduce)').matches && seconds <= 0.001;
}));
await mobile.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
check('Integrated reflows without horizontal overflow at a local 200% text-size check', await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
await mobile.evaluate(() => { document.documentElement.style.fontSize = ''; });
await mobile.close();

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
process.exit(failed ? 1 : 0);
