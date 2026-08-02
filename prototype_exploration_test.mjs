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

const landing = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await landing.goto(BASE);
check('comparison hub exposes exactly four concepts', await landing.locator('.concept-card').count() === 4);
check('comparison hub exposes the same eleven-task journey', await landing.locator('.task-grid li').count() === 11);
check('comparison hub links to Notebook & Draft', await landing.locator('a[href="?concept=notebook"]').count() === 1);
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

check('switcher includes all four concepts', await notebook.locator('.concept-switcher a[href*="concept="]').count() === 4);
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
await mobile.close();

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
process.exit(failed ? 1 : 0);
