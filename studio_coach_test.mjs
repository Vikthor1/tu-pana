// Writing Studio migration candidate — provider seam: consent-gated calls,
// provenance, metadata-only usage, and truthful provider-failure handling.
// Requires this worktree at http://127.0.0.1:3001.
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
async function fresh(query = '') {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(8000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html${query}`);
    await page.evaluate(key => { localStorage.removeItem(key); localStorage.setItem('tupana_draft', 'R0 COACH SENTINEL'); }, KEY);
    await page.reload();
}
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);

async function requestFocusedReview() {
    await page.locator('[data-action="focused-review"]').click();
    await page.locator('input[name="reviewScope"][value="full"]').check();
    await page.locator('#transmitConsent').check();
    await page.locator('[data-action="submit-mock"]').click();
}

console.log('\nConsent-gated focused review with provider provenance');
await fresh();
await page.locator('#draftEditor').fill('This synthetic draft has enough substance for a focused whole-draft reading and one clear direction.');
await page.waitForTimeout(240);
await page.locator('[data-action="focused-review"]').click();
check('submit stays disabled before explicit consent', await page.locator('[data-action="submit-mock"]').isDisabled());
await page.locator('input[name="reviewScope"][value="full"]').check();
await page.locator('#transmitConsent').check();
check('consent enables the send', await page.locator('[data-action="submit-mock"]').isEnabled());
await page.locator('[data-action="submit-mock"]').click();
await page.locator('.review-card, .review-feed article').first().waitFor();
let record = await stored();
check('review record carries provider provenance and request kind', record.reviews.length === 1 && record.reviews[0].provider === 'mock-local' && record.reviews[0].requestKind === 'full_draft_review' && record.reviews[0].mock === true);
check('usage is metadata-only counters by kind', record.usage && record.usage.requests === 1 && record.usage.byKind.full_draft_review === 1 && !JSON.stringify(record.usage).includes('synthetic draft'));
check('record stores no prompt text', !JSON.stringify(record.reviews[0]).includes('WHOLE-PASSAGE') && !JSON.stringify(record.reviews[0]).includes('AUTHORSHIP RULE'));

console.log('\nCouncil represents four calls and accounts for each');
await page.keyboard.press('Escape');
await page.locator('[data-action="council"], .support-action[data-action="council"]').first().click();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="run-council"]').click();
await page.waitForTimeout(1400);
record = await stored();
check('Council run recorded with provider provenance', record.councilRuns.length === 1 && record.councilRuns[0].provider === 'mock-local' && record.councilRuns[0].calls === 4);
check('usage counts three reviewer calls plus one synthesis', record.usage.byKind.council_reviewer === 3 && record.usage.byKind.council_synthesis === 1);

console.log('\nPrompt contracts (builders, not records)');
const prompts = await page.evaluate(() => {
    const passage = window.StudioProvider.buildPassagePrompt({ genreName: 'College personal statement', lang: 'en', scopeLabel: 'selected', text: 'exact passage', question: 'help me', voiceEntries: [{ text: 'mi voz exacta' }] });
    const council = window.StudioProvider.buildCouncilReviewerPrompt({ genreName: 'College personal statement', lang: 'en', roleLabel: 'Student voice advocate', prohibitions: ['Never predict admission outcomes or competitiveness, or compare the writer with other applicants.'], text: 'draft' });
    return { passage, council };
});
check('passage prompt carries the authorship rule and whole-passage protocol', prompts.passage.includes('ABSOLUTE AUTHORSHIP RULE') && prompts.passage.includes('WHOLE-PASSAGE READING PROTOCOL'));
check('opted-in Voice entries appear as protection constraints, exact text', prompts.passage.includes('STUDENT-PROTECTED VOICE') && prompts.passage.includes('mi voz exacta'));
check('admissions Council prompt carries the no-prediction prohibition', prompts.council.includes('Never predict admission outcomes'));

console.log('\nInjected provider failure is calm and truthful');
await fresh('?mockfail=rate_limited');
await page.locator('#draftEditor').fill('Synthetic draft written before a provider failure is injected for this test.');
await page.waitForTimeout(240);
const before = await stored();
await requestFocusedReview();
await page.locator('.provider-error').waitFor();
const errorText = await page.locator('.provider-error').textContent();
check('failure names the category message and the unchanged-draft boundary', /busy right now|ocupado en este momento/.test(errorText) && /unchanged|no cambió/.test(errorText));
check('failed request saves no review and no snapshot', await stored().then(r => r.reviews.length === 0 && r.versions.length === (before?.versions?.length || 0)));
check('failed request is recorded as a metadata-only provider event', await stored().then(r => r.providerEvents?.length === 1 && r.providerEvents[0].category === 'rate_limited'));
check('the send button recovers for another attempt', await page.locator('[data-action="submit-mock"]').isEnabled());
await page.keyboard.press('Escape');
await page.keyboard.press('Escape');

console.log('\nCouncil failure aborts without a partial record');
await page.locator('[data-action="council"], .support-action[data-action="council"]').first().click();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="run-council"]').click();
await page.locator('.provider-error').waitFor();
check('failed Council run stores nothing', await stored().then(r => r.councilRuns.length === 0));

console.log('\nIsolation');
check('R0 sentinel untouched', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 COACH SENTINEL');
check('zero external requests including under failure injection', external.length === 0, external.join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
