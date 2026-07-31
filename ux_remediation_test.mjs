// ux_remediation_test.mjs — founder UX-remediation brief (2026-07-31)
// Run with a local server on 127.0.0.1:3001.
//
// Verifies the five findings' required behavior:
//   F1 — save is separate from submission/data management; truthful messaging;
//        Process Note + Final Packet progressively disclosed; danger zone apart
//   F2 — navigation contract: Back / "Continue to: [stage]" from the ACTIVE
//        genre's stage names; no autobiographical CTA leakage
//   F3 — carry-forward on every path; empty editors explained; no silent
//        overwrite; refresh persistence
//   F4 — coach identity + stage rules derive from active genre; neutral
//        fallback; five-questions never enumerated by prompt contract
//   F5 — review re-entry: available across Stages 7–9 + post-review actions
import { chromium } from 'playwright';

const HOST = 'http://127.0.0.1:3001/';
const PROXY = 'https://tupana-gemini-proxy.dr-torres-velez.workers.dev/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
await page.route(PROXY, async route => {
    await route.fulfill({
        status: 200, contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ text: 'CURRENT MOVEMENT\nok\n\nTWO STRENGTHS\nok\n\nPRIORITY REVISIONS\nok\n\nBEST NEXT ACTION\nok', truncated: false,
            usage: { inputTokens: 100, outputTokens: 50, thoughtTokens: 0, cachedTokens: 0, totalTokens: 150 } })
    });
});

let passed = 0, failed = 0;
function check(label, condition) {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
    if (ok) passed += 1; else failed += 1;
}

async function boot(assignment, seed = {}) {
    await page.goto(HOST + (assignment ? `?assignment=${assignment}` : ''));
    await page.evaluate((seed) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('tupana_lab_done', 'true');
        localStorage.setItem('tupana_onboarding_complete', 'true');
        localStorage.setItem('tupana_mani_done', 'true');
        localStorage.setItem('tupana_ai_cue_seen', 'true');
        for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
    }, seed);
    await page.reload();
    await page.waitForTimeout(500);
}

const DRAFT = 'My interest in public health began the summer I translated at my grandmother\'s clinic appointments and realized the system spoke neither of our languages well enough to keep her safe.';

// ════ F2 — navigation contract ════
console.log('F2 — navigation contract');
await boot('college-personal-statement', { tupana_stage: '2', tupana_writing_s2: DRAFT });
const contBtn = await page.locator('#continueBtn').textContent();
check('admissions Stage 2 continue names its destination from the LAYER',
    /Continue to:/.test(contBtn) && !/Write My Pitch|Connect to History/.test(contBtn));
check('back control present and names the previous stage',
    await page.locator('#backBtn').isVisible() &&
    /Back to:/.test(await page.locator('#backBtn').textContent()));
await page.locator('#backBtn').click();
await page.waitForTimeout(400);
check('back control actually navigates to the previous stage',
    await page.evaluate(() => state.stage === 1));
check('no autobiographical CTA text anywhere in the admissions shell',
    !/Connect to History|Begin Research|Write My Pitch/.test(await page.locator('body').textContent()));

await boot('', { tupana_stage: '2', tupana_writing_s2: DRAFT });
check('default genre uses the same nav contract (Continue to: …)',
    /Continue to:/.test(await page.locator('#continueBtn').textContent()));
check('back hidden at Stage 1',
    await boot('', { tupana_stage: '1' }).then(() => page.locator('#backBtn').isHidden()));

// ════ F1 — save vs submission ════
console.log('\nF1 — save is not submission');
await boot('college-personal-statement', { tupana_stage: '1', tupana_writing_s1: DRAFT });
check('footer control is “My work”, not “Save / Export”',
    /My work/.test(await page.locator('#reportBtn').textContent()) &&
    !/Save \/ Export/.test(await page.locator('#reportBtn').textContent()));
await page.locator('#reportBtn').click();
await page.waitForTimeout(300);
const workText = await page.locator('.report-card').textContent();
check('work hub shows truthful save status for CURRENT stage writing',
    /Stage 1/.test(workText) && /words/.test(workText) && /saves automatically/i.test(workText));
check('no submission-readiness warnings on routine saving',
    await page.locator('#reportBody .packet-diag').count() === 0 &&
    !/Check before you submit|no written work found/i.test(workText));
check('final packet controls hidden outside the submission flow',
    await page.locator('#packetRecommended').isHidden());
check('Process Note not shown before the authorship draft exists',
    !/Process Note/.test(workText.replace(/Process report only/g, '')));
check('danger zone separate and collapsed',
    await page.locator('#dangerZone').count() === 1 &&
    await page.locator('#dangerZone .report-action-btn').isHidden());
check('backup lives in a secondary collapsed area',
    await page.locator('.report-other-options').count() === 1);
await page.locator('.report-close').click();

await boot('college-personal-statement', {
    tupana_stage: '9', tupana_draft: DRAFT, tupana_draft_saved: 'true',
    tupana_writing_s9: DRAFT + ' Revised with a sharper opening for the committee reader.'
});
await page.locator('#reportBtn').click();
await page.waitForTimeout(300);
const workText9 = await page.locator('.report-card').textContent();
check('Process Note offered once the authorship draft exists',
    /Process Note/.test(workText9));
check('submission entry appears only near the end (Stage 9+) and is explicit',
    /Prepare submission/.test(workText9));
await page.evaluate(() => openReport('submit'));
await page.waitForTimeout(300);
check('explicit submission flow shows the readiness diagnostic + packet',
    await page.locator('#reportBody .packet-diag').count() === 1 &&
    await page.locator('#packetRecommended').isVisible());
await page.locator('.report-close').click();

// ════ F3 — carry-forward ════
console.log('\nF3 — carry-forward and persistence');
await boot('graduate-sop', { tupana_stage: '1', tupana_writing_s1: DRAFT });
await page.evaluate(() => goToStage(2));   // direct path (map-style), NOT the preview
await page.waitForTimeout(900);
check('direct-path forward move still offers to bring work forward (card or strip)',
    (await page.locator('#transitionImportCard').count()) +
    (await page.locator('#priorWorkStrip').count()) >= 1);
const bringBtn = page.locator('#transitionImportCard .tic-btn-yes, #priorWorkStrip .pws-bring').first();
await bringBtn.click();
await page.waitForTimeout(300);
check('bring-forward copies the text without changing wording',
    (await page.locator('#draftArea').inputValue()).includes('translated at my grandmother'));
await page.reload();
await page.waitForTimeout(500);
check('carried-forward work survives refresh',
    (await page.locator('#draftArea').inputValue()).includes('translated at my grandmother'));
check('original stage-1 text NOT overwritten by the carry-forward', await page.evaluate(() =>
    (localStorage.getItem('tupana_writing_s1') || '').includes('translated at my grandmother')));

await boot('graduate-sop', { tupana_stage: '3', tupana_writing_s1: DRAFT });
check('empty later stage explains where earlier work lives (no blank mystery)',
    await page.locator('#priorWorkStrip').count() === 1 &&
    /Stage 1/.test(await page.locator('#priorWorkStrip').textContent()));

// ════ F4 — genre-derived coaching ════
console.log('\nF4 — coach identity and stage rules follow the genre');
await boot('college-personal-statement', { tupana_stage: '2', tupana_writing_s2: DRAFT });
const admissionsPrompt = await page.evaluate(() => buildOllamaSystemPrompt('English'));
check('admissions system prompt names the admissions genre, not autobiographical',
    /College Admissions/.test(admissionsPrompt) &&
    !/students writing autobiographical mixed-genre essays/.test(admissionsPrompt));
check('admissions Stage 2 rule is the layer’s own (workability, not memory/history)',
    !/connect a memory to a larger historical/i.test(admissionsPrompt));
check('five-questions presentation rule embedded (apply silently, never enumerate)',
    /FIVE QUESTIONS PRESENTATION RULE/.test(admissionsPrompt) &&
    /Never enumerate/.test(admissionsPrompt));
const cap200Prompt = await (async () => {
    await boot('cap200-bronx-beautiful-service-learning', { tupana_stage: '2' });
    return page.evaluate(() => buildOllamaSystemPrompt('English'));
})();
check('layer without its own stage focus gets the NEUTRAL fallback, never autobiographical',
    !/connect a memory to a larger historical/i.test(cap200Prompt) &&
    /larger purpose or context of this assignment/.test(cap200Prompt));
const defaultPrompt = await (async () => {
    await boot('', { tupana_stage: '2' });
    return page.evaluate(() => buildOllamaSystemPrompt('English'));
})();
check('default genre keeps its autobiographical coaching (no regression)',
    /connect a memory to a larger historical/i.test(defaultPrompt) &&
    /autobiographical mixed-genre essays/.test(defaultPrompt));

// ════ F5 — review re-entry ════
console.log('\nF5 — review re-entry');
await boot('graduate-sop', {
    tupana_stage: '8', tupana_draft: DRAFT, tupana_draft_saved: 'true',
    tupana_writing_s8: DRAFT + ' It taught me that access is designed, and I want to design it better. Since then I have shadowed two community health workers, kept a field journal in both languages, and built a small glossary of the phrases our clinic visits kept getting wrong, because language access is a patient-safety problem and not a courtesy.',
    tupana_coach_mode: 'gemini'
});
check('whole-draft review available at Stage 8 (no backward navigation needed)',
    await page.locator('#fullDraftReviewBtn').isVisible());
await page.locator('#fullDraftReviewBtn').click();
await page.locator('input[name="fullReviewLens"][value="structure"]').check();
await page.locator('#fullReviewSubmit').click();
await page.waitForSelector('#reviewNextActions', { timeout: 15000 });
const rna = await page.locator('#reviewNextActions').textContent();
check('post-review action card offers another review / Council / return to draft',
    /Another review/.test(rna) && /Review Council/.test(rna) && /Return to my draft/.test(rna));
await page.locator('#reviewNextActions .rna-btn[data-act="another"]').click();
await page.waitForTimeout(300);
check('“another review” reopens the chooser directly — no backward navigation',
    await page.locator('#fullDraftReviewModal').count() === 1);
await page.locator('#fullReviewClose').click();

check('no page JavaScript errors', errors.length === 0);
if (errors.length) console.log('    errors:', errors.slice(0, 3).join(' | '));

console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAILED` : ''}`);
await browser.close();
process.exit(failed ? 1 : 0);
