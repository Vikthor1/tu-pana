// Writing Studio migration candidate — Council safety kernel + adversarial
// provider behavior. Validation is application code: anchors, caps, role
// identity, corroboration, all-or-nothing persistence, stale/cancel truth.
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const KEY = 'tupana-studio:v1';
const DRAFT = 'La biblioteca del barrio enseñó una lección que still shapes this draft today. The second paragraph develops the same synthetic idea with one concrete scene and a limitation the writer names honestly.';
const browser = await chromium.launch({ headless: true });
let passed = 0;
let failed = 0;
const check = (label, condition, detail = '') => {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
    if (ok) passed++; else failed++;
};

const errors = [];
const external = [];
let page = null;
async function fresh(query = '') {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html${query}`);
    await page.evaluate(key => { localStorage.removeItem(key); localStorage.setItem('tupana_draft', 'R0 KERNEL SENTINEL'); }, KEY);
    await page.reload();
    await page.locator('#draftEditor').fill(DRAFT);
    await page.waitForTimeout(240);
}
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);
async function convene() {
    await page.locator('[data-action="council"]').first().click();
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="run-council"]').click();
}

console.log('\nKernel unit validation (application code, not prompt hope)');
await fresh();
const unit = await page.evaluate(draft => {
    const kernel = window.StudioCouncil;
    const results = {};
    results.anchorExact = kernel.anchorValid('La biblioteca del barrio enseñó', draft);
    results.anchorSmartQuotes = kernel.anchorValid('“la biblioteca del barrio  enseñó”'.replace(/[“”]/g, ''), draft);
    results.anchorAbsent = !kernel.anchorValid('this wording never existed in the draft', draft);
    results.anchorTooShort = !kernel.anchorValid('La bib', draft);
    results.fences = kernel.parseJsonLoose('```json\n{"a":1}\n```')?.a === 1;
    const overCap = kernel.validateReviewerResult(JSON.stringify({ findings: Array.from({ length: 7 }, () => ({ claim: 'c', evidenceQuote: 'La biblioteca del barrio enseñó', severity: 'priority', confidence: 'high' })) }), draft, 'structure', 'Structure reviewer');
    results.capsEnforced = overCap.ok && overCap.findings.length === 5 && overCap.dropped.some(item => item.reason === 'over-cap');
    results.roleFromRequest = overCap.findings.every(finding => finding.roleKey === 'structure' && finding.roleLabel === 'Structure reviewer');
    const invented = kernel.validateReviewerResult(JSON.stringify({ findings: [{ claim: 'c', evidenceQuote: 'quotation invented by the model entirely', severity: 'priority' }] }), draft, 'voice', 'V');
    results.inventedDropped = invented.ok && invented.findings.length === 0 && invented.dropped.some(item => item.reason === 'bad-anchor');
    const synthFindings = [
        { id: 'structure-1', roleKey: 'structure', claim: 'claim A', evidenceQuote: 'La biblioteca del barrio enseñó', confidence: 'high', revisionMove: 'move', why: 'why' },
        { id: 'evidence-1', roleKey: 'evidence', claim: 'claim B', evidenceQuote: 'one concrete scene', confidence: 'low', revisionMove: 'move', why: 'why' },
    ];
    const synth = kernel.validateSynthesisResult(JSON.stringify({
        summary: 'ok',
        priorities: [
            { claim: 'merged', sourceIds: ['structure-1', 'evidence-1'], revisionMove: 'm' },
            { claim: 'phantom', sourceIds: ['made-up-9'], revisionMove: 'm' },
        ],
        secondary: [], preserve: [], disagreements: [{ question: 'q?', positions: [{ roleKey: 'structure', view: 'a' }, { roleKey: 'evidence', view: 'b' }] }],
    }), synthFindings, [], draft);
    results.phantomSourceDiscarded = synth.ok && synth.report.priorities.length === 1;
    results.corroborationRecomputed = synth.report.priorities[0].corroborated === true && synth.report.priorities[0].roles.length === 2;
    results.lowConfidencePropagates = synth.report.priorities[0].confidence === 'low';
    results.disagreementPreserved = synth.report.disagreements.length === 1 && synth.report.disagreements[0].positions.length === 2;
    const single = kernel.validateSynthesisResult(JSON.stringify({ summary: 's', priorities: [{ claim: 'x', sourceIds: ['structure-1'] }], secondary: [], preserve: [], disagreements: [] }), synthFindings, [], draft);
    results.singleRoleNotCorroborated = single.ok && single.report.priorities[0].corroborated === false;
    return results;
}, DRAFT);
for (const [name, value] of Object.entries(unit)) check(`kernel: ${name}`, value === true);

console.log('\nHealthy mock run produces a grounded structured report');
await convene();
await page.waitForFunction(key => (JSON.parse(localStorage.getItem(key) || '{}').councilRuns || []).length === 1, KEY);
let record = await stored();
let run = record.councilRuns[0];
check('report saved with summary, priorities, preserve, disagreement', Boolean(run.report?.summary) && run.report.priorities.length >= 1 && run.report.preserve.length >= 1 && run.report.disagreements.length === 1);
check('every anchored quotation is a real substring of the consented draft', run.findings.every(f => !f.quote || DRAFT.toLowerCase().includes(f.quote.toLowerCase())) && run.report.preserve.every(p => DRAFT.toLowerCase().includes(p.quote.toLowerCase())));
check('reviewers recorded from role records with complete status', run.reviewers.length === 3 && run.reviewers.every(r => r.status === 'complete') && run.status === 'complete');
check('actual call count recorded (3 reviewers + 1 synthesis)', run.calls === 4);
const reportText = await page.locator('.review-card').first().textContent();
check('disagreement renders as the writer\'s call, not a resolution', /does not agree|no coincide/.test(reportText));

console.log('\nAdversarial: invented quotations can never appear as student text');
await fresh('?mockcouncil=badanchor');
await convene();
await page.waitForFunction(key => (JSON.parse(localStorage.getItem(key) || '{}').councilRuns || []).length === 1, KEY);
record = await stored();
run = record.councilRuns[0];
check('all bad-anchor findings discarded; truthful empty report saved', run.findings.length === 0 && run.droppedCount === 3);
check('the invented quotation appears nowhere in the record', !JSON.stringify(run).includes('appears nowhere in the submitted draft'));
check('dropped-items note renders truthfully', /discarded|descartó/.test(await page.locator('.review-card').first().textContent()));

console.log('\nAdversarial: malformed and missing-field responses');
await fresh('?mockcouncil=malformed');
await convene();
await page.locator('.provider-error').waitFor();
check('all-malformed reviewers abort with nothing saved', await stored().then(r => r.councilRuns.length === 0));
await fresh('?mockcouncil=missingfields');
await convene();
await page.waitForFunction(key => (JSON.parse(localStorage.getItem(key) || '{}').councilRuns || []).length === 1, KEY);
check('missing-field findings dropped, truthful empty report', await stored().then(r => r.councilRuns[0].findings.length === 0 && r.councilRuns[0].droppedCount === 3));

console.log('\nAdversarial: partial and total reviewer failure');
await fresh('?mockcouncil=partial');
await convene();
await page.waitForFunction(key => (JSON.parse(localStorage.getItem(key) || '{}').councilRuns || []).length === 1, KEY);
record = await stored();
run = record.councilRuns[0];
check('one failed reviewer yields a truthful partial report', run.status === 'partial' && run.reviewers.filter(r => r.status === 'failed').length === 1);
check('partial note names the missing perspective', /Partial report|Informe parcial/.test(await page.locator('.review-card').first().textContent()));
await fresh('?mockcouncil=allfail');
await convene();
await page.locator('.provider-error').waitFor();
check('total failure saves nothing and states the boundary', await stored().then(r => r.councilRuns.length === 0) && /unchanged|no cambió/.test(await page.locator('.provider-error').textContent()));

console.log('\nAdversarial: synthesis failure is all-or-nothing');
await fresh('?mockcouncil=synthfail');
await convene();
await page.locator('.provider-error').waitFor();
check('invalid synthesis (after one retry) saves no report', await stored().then(r => r.councilRuns.length === 0));
check('synthesis failure surfaces calmly with draft-unchanged boundary', /unchanged|no cambió/.test(await page.locator('.provider-error').textContent()));

console.log('\nCancellation and stale responses');
await fresh();
await page.locator('[data-action="focused-review"]').click();
await page.locator('input[name="reviewScope"][value="full"]').check();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
record = await stored();
check('cancel before the response persists no review and no snapshot', record.reviews.length === 0 && record.versions.length === 0);
check('cancelled request recorded as metadata-only event', record.providerEvents?.some(event => event.category === 'cancelled'));

await fresh();
await page.locator('[data-action="focused-review"]').click();
await page.locator('input[name="reviewScope"][value="full"]').check();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.evaluate(() => { document.querySelector('#draftEditor'); });
await page.locator('#draftEditor').fill(`${DRAFT} EDITED WHILE IN FLIGHT.`);
await page.waitForTimeout(600);
record = await stored();
check('mid-flight edits never rewrite the record: excerpt and snapshot are the consented text', record.reviews.length === 1 && record.reviews[0].exactExcerpt === DRAFT.slice(0, 180) && record.versions.some(v => v.id === record.reviews[0].snapshotId && v.text === DRAFT));
check('the live draft keeps the mid-flight edit', record.draft.includes('EDITED WHILE IN FLIGHT'));

console.log('\nFailure-category copy (timeout, origin-forbidden non-retry)');
await fresh('?mockfail=timeout');
await page.locator('[data-action="focused-review"]').click();
await page.locator('input[name="reviewScope"][value="full"]').check();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.locator('.provider-error').waitFor();
check('timeout renders its own calm truthful copy', /took too long|tardó demasiado/.test(await page.locator('.provider-error').textContent()));
await fresh('?mockfail=origin_forbidden');
await page.locator('[data-action="focused-review"]').click();
await page.locator('input[name="reviewScope"][value="full"]').check();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.locator('.provider-error').waitFor();
check('origin-forbidden says do-not-retry', /Do not retry|No lo reintentes/.test(await page.locator('.provider-error').textContent()));

console.log('\nStorage failure while saving a report is truthful');
await fresh();
await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    window.__restoreSetItem = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function () { throw new Error('QuotaExceededError (simulated)'); };
});
await convene();
await page.waitForTimeout(900);
// Branding pass: failure copy is now “Couldn't save” / “No se pudo guardar”.
const saveFailedShown = await page.evaluate(() => document.body.textContent.includes('Couldn’t save') || document.body.textContent.includes('No se pudo guardar'));
check('quota failure surfaces the saveFailed truth instead of false success', saveFailedShown);
await page.evaluate(() => window.__restoreSetItem());

console.log('\nIsolation');
check('R0 sentinel untouched', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 KERNEL SENTINEL');
check('zero external requests across all adversarial paths', external.length === 0, external.join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
