// r0_safety_test.mjs — Writing Studio R0 safety/trust closeout
// Requires the repository served at http://127.0.0.1:3001.
import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const HOST = 'http://127.0.0.1:3001/';
const PROXY = 'https://tupana-gemini-proxy.dr-torres-velez.workers.dev/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
let passed = 0, failed = 0;
function check(label, value) {
    const ok = Boolean(value);
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
    if (ok) passed++; else failed++;
}

async function boot(seed = {}, query = '') {
    await page.goto(HOST + query);
    await page.evaluate(seed => {
        localStorage.clear(); sessionStorage.clear();
        localStorage.setItem('tupana_lab_done', 'true');
        localStorage.setItem('tupana_onboarding_complete', 'true');
        localStorage.setItem('tupana_mani_done', 'true');
        Object.entries(seed).forEach(([k, v]) => localStorage.setItem(k, v));
    }, seed);
    await page.reload();
    await page.waitForTimeout(300);
}

console.log('R0.1 + R0.7 — mobile task truth and boot state');
await page.setViewportSize({ width: 390, height: 844 });
await boot({ tupana_lang: 'en', tupana_stage: '2' });
check('English mobile task instruction is visible and non-empty', await page.evaluate(() => {
    const el = document.getElementById('ctbInstruction');
    const en = el && el.querySelector('.ctb-en');
    return !!(el && en && getComputedStyle(en).display !== 'none' && en.textContent.trim());
}));
check('typing indicator is off before a coach request begins', !(await page.locator('#typingRow').evaluate(el => el.classList.contains('on'))));

console.log('\nR0.3 + R0.6 — reset friction and control ownership');
await page.setViewportSize({ width: 1280, height: 900 });
await boot({ tupana_writing_s1: 'work that must survive cancel' });
await page.evaluate(() => resetApp());
check('header Reset opens the shared typed-confirmation dialog', await page.locator('#clearDataOverlay').isVisible());
check('Reset dialog offers backup in the same surface', await page.locator('#clearDataOverlay [data-action="backup"]').isVisible());
check('destructive act is disabled before BORRAR/DELETE', await page.locator('#clearDataOverlay [data-action="erase"]').isDisabled());
await page.locator('#clearDataPhrase').fill('DELETE');
check('exact typed confirmation enables destruction', await page.locator('#clearDataOverlay [data-action="erase"]').isEnabled());
await page.locator('#clearDataOverlay [data-action="cancel"]').click();
check('cancelling Reset preserves work', await page.evaluate(() => localStorage.getItem('tupana_writing_s1') === 'work that must survive cancel'));
await page.evaluate(() => toggleFocusMode());
check('hide-coach mode gives the footer control a truthful Exit label', /Exit/.test(await page.locator('#focusToggle').textContent()));
await page.locator('#focusToggle').click();
check('pressing that Exit control restores the coach', !(await page.locator('.workspace').evaluate(el => el.classList.contains('focus-mode'))));

console.log('\nR0.2 — import preview, snapshot, and replace');
await boot({ tupana_writing_s1: 'current browser work', tupana_draft: 'current draft' });
const beforeCancel = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)]))));
await page.evaluate(() => _openImportPreview({
    tupana_writing_s2: 'incoming backup has six useful words here',
    tupana_draft: 'incoming final draft words',
    tupana_schema_version: '1.0'
}, { lastModified: Date.parse('2026-08-01T12:00:00Z') }));
check('import preview shows word counts, dates, and explicit Replace',
    /words/.test(await page.locator('#importPreviewOverlay').textContent()) &&
    /2026/.test(await page.locator('#importPreviewOverlay').textContent()) &&
    /Replace/.test(await page.locator('#importPreviewOverlay [data-action="replace"]').textContent()));
await page.locator('#importPreviewOverlay [data-action="cancel"]').click();
const afterCancel = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)]))));
check('aborting import leaves the store byte-identical', beforeCancel === afterCancel);
await page.evaluate(() => _openImportPreview({
    tupana_writing_s2: 'incoming backup has six useful words here',
    tupana_draft: 'incoming final draft words',
    tupana_schema_version: '1.0'
}, { lastModified: Date.parse('2026-08-01T12:00:00Z') }));
const downloadPromise = page.waitForEvent('download');
page.once('dialog', dialog => dialog.accept());
await page.locator('#importPreviewOverlay [data-action="replace"]').click();
await downloadPromise;
await page.waitForLoadState('load');
check('confirmed import creates a retained pre-import snapshot', !!(await page.evaluate(() => localStorage.getItem('tupana_pre_import_snapshot'))));
check('confirmed import replaces work with incoming artifacts', await page.evaluate(() =>
    localStorage.getItem('tupana_writing_s2') === 'incoming backup has six useful words here' &&
    localStorage.getItem('tupana_writing_s1') === null));

console.log('\nR0.4 — Council profile safety');
const warnings = [];
page.on('console', msg => { if (msg.type() === 'warning') warnings.push(msg.text()); });
await boot({
    tupana_stage: '7', tupana_draft_saved: 'true', tupana_draft: 'word '.repeat(60),
    tupana_writing_s7: 'word '.repeat(60), tupana_coach_mode: 'gemini'
}, '?assignment=stem-lab-report');
await page.evaluate(() => openFullDraftReview());
check('STEM does not receive the autobiographical Council fallback', await page.locator('#councilOffer').count() === 0);
check('missing/disabled Council configuration produces a detectable warning', warnings.some(text => /Council unavailable|config gap/.test(text)));
const councilPermanent = await page.evaluate(async () => {
    let calls = 0;
    const err = Object.assign(new Error('origin'), { category: 'origin_forbidden' });
    const result = await runCouncilKernel({ draftText: 'word '.repeat(60), assignmentId: null, stage: 7, langLabel: 'English', callFn: async () => { calls++; throw err; } });
    return { calls, reason: result.reason };
});
check('permanent Council failures do not retry reviewer calls', councilPermanent.calls === 3 && councilPermanent.reason === 'permanent-config-error');

console.log('\nR0.5 — permanent versus transient provider errors');
await page.unroute(PROXY).catch(() => {});
let proxyCalls = 0;
await page.route(PROXY, async route => {
    proxyCalls++;
    await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: true, category: 'origin_forbidden', message: 'Origin not allowed' }) });
});
const permanentError = await page.evaluate(async () => {
    try { await callGeminiProviderViaProxy({ prompt: 'test' }); return null; }
    catch (error) { return { category: error.category, message: getGeminiErrorMessage(error) }; }
});
check('403 is named as permanent origin configuration failure', permanentError?.category === 'origin_forbidden' && /not authorized|no está autorizado/.test(permanentError.message));
check('403 produces no automatic retry', proxyCalls === 1);
check('5xx remains classified as transient/retryable', await page.evaluate(() =>
    _statusToGeminiCategory(503) === 'service_unavailable' && _GEMINI_RETRYABLE.has('service_unavailable')));
await page.unroute(PROXY);

console.log('\nR0.8 + R0.9 — disclosure and truthful save status');
let sentBody = null;
await page.route(PROXY, async route => {
    sentBody = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: 'ok', truncated: false, usage: {} }) });
});
await boot({ tupana_stage: '1', tupana_writing_s1: 'stage one notes', tupana_mani_sentence: 'SECRET-MANI-SENTENCE', tupana_coach_mode: 'gemini', tupana_ai_cue_seen: 'true' });
await page.evaluate(() => sendMsg('ordinary question'));
check('routine AI request contains no maniSentence field or value', sentBody && !sentBody.prompt.includes('maniSentence') && !sentBody.prompt.includes('SECRET-MANI-SENTENCE'));
const statusSweep = await page.evaluate(() => [1, 2, 3, 4, 5, 7, 8, 9, 10].every(stage => {
    state.stage = stage;
    localStorage.setItem(`tupana_writing_s${stage}`, `saved work for step ${stage}`);
    updateSavedNotice();
    const text = document.getElementById('savedNotice').textContent;
    return text.includes(`Step ${stage} work`) && !/first draft|revision.*available/i.test(text);
}));
check('stages 1–5 and 7–10 name their saved artifact without false draft/unlock claims', statusSweep);
await page.unroute(PROXY);

console.log('\nR0.10 — visible storage failure and emergency export');
const failure = await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    const blocked = new Set(['tupana_chatlog', 'tupana_decisions', 'tupana_process_note', 'tupana_capstone', 'tupana_protected', 'tupana_council_runs', 'tupana_writing_s4']);
    Storage.prototype.setItem = function(key, value) {
        if (blocked.has(key)) throw new DOMException('Injected quota failure', 'QuotaExceededError');
        return original.call(this, key, value);
    };
    saveChatEntry('unsaved chat', 'user');
    tupanaSafeSetItem('tupana_decisions', '[{"choice":"adapted"}]', 'revision decisions');
    tupanaSafeSetItem('tupana_process_note', '{"q1":"unsaved"}', 'process note');
    _saveCapstoneRaw({ reflections: { cultural: 'unsaved' } });
    saveProtected([{ text: 'voice phrase', id: 1 }]);
    saveCouncilRun('default', { draftSignature: 'x', profileId: 'default', stage: 7, wordCount: 60, status: 'complete', reviewers: [], report: {} });
    saveStageWork(4, 'unsaved stage work');
    const payload = _buildTupanaExportPayload({ includeLiveDraft: false });
    Storage.prototype.setItem = original;
    return {
        keys: Array.from(blocked).every(key => Object.prototype.hasOwnProperty.call(payload, key)),
        message: document.getElementById('storageFailureMessage')?.textContent || '',
        exportButton: !!document.querySelector('#storageFailureBanner button')
    };
});
check('faults across all seven stores produce one persistent visible banner', /Not saved/.test(failure.message) && failure.exportButton);
check('emergency payload contains every failed in-memory value', failure.keys);

console.log('\nR0.11 — explicit packet-draft confirmation');
await boot({
    tupana_stage: '9', tupana_draft_saved: 'true', tupana_draft: 'first draft words',
    tupana_writing_s8: 'This revised candidate has exactly seven useful words.'
});
await page.evaluate(() => {
    window.__packetCopies = 0;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { window.__packetCopies++; } } });
    exportFinalPacket();
});
check('packet is not generated/copied before confirmation', await page.evaluate(() => window.__packetCopies === 0));
const confirmText = await page.locator('#finalDraftConfirmOverlay').textContent();
check('confirmation identifies heuristic stage, word count, and exact preview', /Step 8/.test(confirmText) && /8 palabras/.test(confirmText) && /revised candidate/.test(await page.locator('.r0-final-preview').inputValue()));
check('packet action disabled until explicit confirmation', await page.locator('#finalDraftConfirmOverlay [data-action="confirm"]').isDisabled());
await page.locator('#finalDraftConfirmOverlay [data-action="cancel"]').click();
check('cancelling packet confirmation changes no output', await page.evaluate(() => window.__packetCopies === 0));
await page.evaluate(() => exportFinalPacket());
await page.locator('#finalDraftConfirmCheck').check();
page.once('dialog', dialog => dialog.accept());
await page.locator('#finalDraftConfirmOverlay [data-action="confirm"]').click();
await page.waitForTimeout(50);
check('confirmed packet action proceeds exactly once', await page.evaluate(() => window.__packetCopies === 1));

const uiSource = readFileSync(new URL('./assets/js/ui.js', import.meta.url), 'utf8');
const htmlSource = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
check('application has no single-call localStorage.clear reset path', !/localStorage\.clear\s*\(/.test(uiSource + htmlSource));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
process.exit(failed ? 1 : 0);
