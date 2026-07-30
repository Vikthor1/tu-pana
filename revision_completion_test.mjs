import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3001';
const PROXY = 'https://tupana-gemini-proxy.dr-torres-velez.workers.dev/';
let pass = 0, fail = 0;
const check = (label, condition) => {
    const ok = !!condition;
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
    ok ? pass++ : fail++;
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
const capstoneRequests = [];
page.on('pageerror', error => errors.push(String(error)));
await page.route(PROXY, async route => {
    capstoneRequests.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
            text: JSON.stringify({
                coachPerspective: [{
                    dimension: 'Opening / Point of Entry',
                    rating: 'Taking shape',
                    observation: 'The opening establishes a clear purpose.',
                    suggestion: 'Check whether the final paragraph completes that purpose.'
                }],
                limitations: 'This is one limited coach perspective.'
            }),
            truncated: false,
            usage: {
                inputTokens: 900,
                outputTokens: 120,
                thoughtTokens: 0,
                cachedTokens: 0,
                totalTokens: 1020
            }
        })
    });
});

async function seed(extra = {}, query = '') {
    await page.goto(BASE + '/' + query);
    await page.evaluate(values => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('tupana_mani_done', 'true');
        localStorage.setItem('tupana_lab_done', 'true');
        localStorage.setItem('tupana_draft_saved', 'true');
        localStorage.setItem('tupana_stage', '9');
        Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, value));
    }, extra);
    await page.reload();
    await page.waitForTimeout(900);
}

const firstDraft = 'My first draft has a clear purpose and several supporting details.';
const revisedDraft = 'My revised draft has a clearer purpose, stronger evidence, and a more deliberate conclusion.';

console.log('\n── Genuine revision checkpoint ──');
await seed({ tupana_draft: firstDraft, tupana_writing_s9: firstDraft });
const blocked = await page.evaluate(() => goToStage(10));
check('identical first draft cannot enter Stage 10', blocked === false && await page.locator('#revisionCompletionGate').count() === 1);
check('checkpoint accurately explains that a changed version was not detected',
      (await page.locator('#revisionCompletionGate').innerText()).includes('changed version'));
await page.locator('.revision-gate-primary').click();
await page.waitForTimeout(180);
check('Return to revise closes checkpoint and focuses the editor',
      await page.locator('#revisionCompletionGate').count() === 0 &&
      await page.evaluate(() => document.activeElement === document.getElementById('draftArea')));

await page.evaluate(text => {
    localStorage.setItem('tupana_writing_s9', '  ' + text.replaceAll(' ', '   ') + '\n');
    document.getElementById('draftArea').value = '  ' + text.replaceAll(' ', '   ') + '\n';
}, firstDraft);
check('whitespace-only changes do not count as revision',
      await page.evaluate(() => getFinalEssay().revised) === false);

await page.evaluate(({ first, revised }) => {
    localStorage.setItem('tupana_writing_s7', revised);
    localStorage.setItem('tupana_writing_s9', first);
    document.getElementById('draftArea').value = first;
}, { first: firstDraft, revised: revisedDraft });
const chosen = await page.evaluate(() => getFinalEssay());
check('a real Stage 7 revision wins over a later seeded first draft',
      chosen.revised === true && chosen.stage === 7 && chosen.text.includes('stronger evidence'));
check('real revision can enter Stage 10', await page.evaluate(() => goToStage(10)) === true);
check('Stage 10 does not show a premature completion celebration',
      await page.locator('#phaseToast.on').count() === 0);

console.log('\n── Student-reported instructor direction ──');
await seed({ tupana_draft: firstDraft, tupana_writing_s9: firstDraft });
await page.evaluate(() => goToStage(10));
await page.locator('.revision-exception summary').click();
await page.locator('.revision-gate-secondary').click();
check('empty exception is rejected', await page.locator('.revision-exception-error:not([hidden])').count() === 1);
await page.locator('#revisionExceptionNote').fill('My instructor approved this version for the assignment.');
await page.locator('#revisionExceptionConfirm').check();
await page.locator('.revision-gate-secondary').click();
await page.waitForTimeout(250);
check('documented exception permits Stage 10', await page.evaluate(() => state.stage) === 10);
const exceptionReport = await page.evaluate(() => generateInstructorReport());
check('exception is accurately labeled as an unverified student statement',
      exceptionReport.includes('Student statement — not independently verified') &&
      exceptionReport.includes('Student statement about instructor direction: My instructor approved this version') &&
      !exceptionReport.includes('Instructor-approved revision exception'));

console.log('\n── Evidence-first Stage 10 ──');
await seed({
    tupana_draft: firstDraft,
    tupana_writing_s9: revisedDraft,
    tupana_mani_sentence: 'PRIVATE TOOLKIT SENTENCE THAT IS NOT NEEDED FOR THE CAPSTONE',
    tupana_stage: '10'
});
await page.waitForTimeout(300);
const order = await page.evaluate(() => {
    const panel = document.querySelector('.capstone-panel');
    return {
        reflection: panel.querySelector('#capstoneR1').compareDocumentPosition(panel.querySelector('.capstone-rating-btn')) & Node.DOCUMENT_POSITION_FOLLOWING,
        disabled: panel.querySelector('.capstone-rating-btn').disabled
    };
});
check('written evidence appears before ratings', !!order.reflection);
check('optional ratings stay disabled until evidence is written', order.disabled);
await page.locator('#capstoneSubmitBtn').click();
check('direct submit focuses first missing evidence field',
      await page.evaluate(() => document.activeElement?.id) === 'capstoneR1');
await page.locator('#capstoneR1').fill('I clarified the purpose of my opening.');
await page.locator('#capstoneR2').fill('My conclusion still needs a sharper implication.');
await page.locator('#capstoneR3').fill('I kept the phrasing that sounds like my own voice.');
check('ratings unlock after three evidence sentences',
      await page.locator('.capstone-rating-btn:disabled').count() === 0);
await page.locator('#capstoneSubmitBtn').click();
check('self-assessment completes without requiring ratings',
      await page.evaluate(() => JSON.parse(localStorage.getItem('tupana_capstone')).completed) === true);
check('Stage 10 discloses the draft and reflection transmission before Compare',
      await page.locator('.capstone-ai-disclosure').isVisible() &&
      /se enviarán al Coach IA|will be sent to the Live AI coach/i.test(
          await page.locator('.capstone-ai-disclosure').textContent()
      ));
await page.locator('#capstoneCompareBtn').click();
await page.waitForTimeout(400);
const capstoneUsage = await page.evaluate(() => JSON.parse(localStorage.getItem('tupana_ai_usage') || '{}'));
check('Stage 10 perspective uses a distinct disclosed request kind',
      capstoneRequests.at(-1)?.requestKind === 'capstone_review' &&
      capstoneUsage.byKind?.capstone_review?.requests === 1);
check('Stage 10 sends the disclosed draft and reflections, but not unrelated Toolkit writing',
      capstoneRequests.at(-1)?.prompt?.includes(revisedDraft) &&
      capstoneRequests.at(-1)?.prompt?.includes('I clarified the purpose of my opening.') &&
      !capstoneRequests.at(-1)?.prompt?.includes('PRIVATE TOOLKIT SENTENCE'));
await page.locator('.capstone-modal-close').click();
await page.locator('.capstone-reopen-btn').click();
await page.keyboard.press('Escape');
await page.waitForTimeout(80);
check('Stage 10 Escape closes the dialog and returns focus to its opener',
      await page.locator('#capstoneBg.on').count() === 0 &&
      await page.evaluate(() => document.activeElement?.classList.contains('capstone-reopen-btn')));

console.log('\n── Shared across genre layers ──');
for (const assignment of ['graduate-sop', 'service-learning', 'stem-lab-report', 'college-personal-statement']) {
    await seed({ tupana_draft: firstDraft, tupana_writing_s9: firstDraft }, `?assignment=${assignment}`);
    const result = await page.evaluate(() => goToStage(10));
    check(`${assignment}: shared revision checkpoint applies`, result === false && await page.locator('#revisionCompletionGate').count() === 1);
}

console.log('\n── Keyboard and focus ──');
await seed({ tupana_draft: firstDraft });
await page.evaluate(() => {
    setCoachMode('offline');
    document.getElementById('stuckBtn').disabled = false;
    document.getElementById('stuckBtn').focus();
    showStuckTriage();
});
await page.waitForTimeout(80);
check('stuck menu exposes expanded state', await page.locator('#stuckBtn').getAttribute('aria-expanded') === 'true');
check('stuck menu moves focus to its first action',
      await page.evaluate(() => document.activeElement === document.querySelector('#stuckTriage .stuck-option')));
await page.keyboard.press('ArrowDown');
check('ArrowDown moves through menu actions',
      await page.evaluate(() => document.activeElement === document.querySelectorAll('#stuckTriage .stuck-option')[1]));
await page.keyboard.press('Escape');
check('Escape closes stuck menu and returns focus',
      await page.locator('#stuckTriage.on').count() === 0 &&
      await page.evaluate(() => document.activeElement?.id) === 'stuckBtn');
await page.locator('.help-btn').focus();
await page.locator('.help-btn').click();
await page.keyboard.press('Escape');
check('Help Escape closes the dialog and returns focus to Help',
      await page.locator('#helpModal').count() === 0 &&
      await page.evaluate(() => document.activeElement?.classList.contains('help-btn')));

check('no uncaught page errors', errors.length === 0);
if (errors.length) console.log(errors.join('\n'));

await browser.close();
console.log(`\n${pass}/${pass + fail} PASS${fail ? ` — ${fail} FAIL` : ''}`);
process.exit(fail ? 1 : 0);
