// stage10_completion_test.mjs — Regression tests for P4 Journey Complete card
// Verifies:
//   - returning student at Stage 10 with tupana_completion_shown=true sees the
//     persistent Journey Complete card (reload path via injectCapstonePanel)
//   - card is bilingual, carries the 3 submission steps, leads with Copy all
//   - card CTA opens the Save/Export (report) modal
//   - no card when the completion flag is absent
//   - live path: finishProcessNote → celebration → dismiss → card appears
//   - injection is idempotent (never more than one card)
//   - no uncaught page errors
// Manual QA checklist at the bottom of this file.

import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const results = [];
let passed = 0, failed = 0;

function check(label, condition) {
    const ok = !!condition;
    results.push({ label, ok });
    if (ok) passed++; else failed++;
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e)));

async function seed(extra) {
    await page.goto(BASE);
    await page.evaluate((kv) => {
        localStorage.clear(); sessionStorage.clear();
        localStorage.setItem('tupana_mani_done', 'true');
        localStorage.setItem('tupana_lab_done', 'true');
        localStorage.setItem('tupana_stage', '10');
        Object.entries(kv || {}).forEach(([k, v]) => localStorage.setItem(k, v));
    }, extra);
    await page.reload();
    await page.waitForTimeout(1500); // app.js stage-10 restore runs at 400–700ms timeouts
}

// ── Reload path: completed student returns at Stage 10 ───────────────────
console.log('Reload path — flag set, card persists');
await seed({
    tupana_completion_shown: 'true',
    tupana_draft_saved: 'true',
    tupana_draft: 'This is the protected first draft.',
    tupana_writing_s9: 'This is the meaningfully revised final draft.'
});

check('Journey Complete card rendered on reload at Stage 10',
      await page.locator('#journeyCompleteCard').count() === 1);
check('card is bilingual (ES + EN badge spans)',
      await page.locator('#journeyCompleteCard .journey-complete-badge [lang="es"]').count() === 1 &&
      await page.locator('#journeyCompleteCard .journey-complete-badge [lang="en"]').count() === 1);
const steps = await page.locator('#journeyCompleteCard .journey-complete-steps li').count();
check('card carries exactly 3 submission steps', steps === 3);
const stepsText = await page.locator('#journeyCompleteCard .journey-complete-steps').innerText();
check('steps lead with Copy (clipboard before download — iframe constraint)',
      stepsText.indexOf('Copiar mi paquete final') !== -1 &&
      stepsText.indexOf('Copiar mi paquete final') < stepsText.indexOf('Descargar paquete final'));
check('steps mention Brightspace submission', stepsText.includes('Brightspace'));

// CTA opens the Save/Export modal (JS click — capstone modal may overlay)
await page.evaluate(() => document.querySelector('#journeyCompleteCard .journey-complete-cta').click());
await page.waitForTimeout(300);
check('CTA opens Save/Export modal (#reportBg.on)',
      await page.locator('#reportBg.on').count() === 1);
await page.evaluate(() => closeReport());

// Idempotence
await page.evaluate(() => injectJourneyCompleteCard());
check('re-injection is a no-op (still exactly one card)',
      await page.locator('#journeyCompleteCard').count() === 1);

// ── Negative path: no flag, no card, no premature trigger ────────────────
console.log('Negative path — no completion flag');
await seed({
    tupana_draft_saved: 'true',
    tupana_draft: 'This is the protected first draft.',
    tupana_writing_s9: 'This is the meaningfully revised final draft.'
});
check('no card at Stage 10 when completion flag absent',
      await page.locator('#journeyCompleteCard').count() === 0);

// Guard: closing the capstone modal BEFORE report generation must not fire
await page.click('.capstone-modal-close');
await page.waitForTimeout(900);
check('closing capstone modal without report generated does NOT open process note',
      await page.locator('#pnModalBg.on').count() === 0);

// ── Live path: REAL UI EVENTS end-to-end (Option A trigger wiring) ───────
// 10A submit → generate report → close capstone (✕) → process note fires →
// Completar → celebration → Continuar → Journey Complete card
console.log('Live path — real student flow via button clicks only');
await page.click('.capstone-reopen-btn');               // reopen capstone modal
await page.waitForTimeout(300);
await page.locator('#capstoneR1').fill('I clarified the central purpose.');
await page.locator('#capstoneR2').fill('The conclusion still needs attention.');
await page.locator('#capstoneR3').fill('I protected the wording that sounds like me.');
await page.locator('.capstone-rating-btn').first().click();  // optional rating
await page.click('#capstoneSubmitBtn');                 // 10A: "Nombré mi proceso"
await page.waitForTimeout(400);
check('report trigger button appears after 10A submit',
      await page.locator('.instr-report-trigger-btn').count() === 1);
await page.click('.instr-report-trigger-btn');          // generate instructor report
await page.waitForTimeout(400);
check('instructor report panel generated',
      await page.locator('#instrReportPanel').count() === 1);
check('process note does NOT interrupt while capstone modal is open',
      await page.locator('#pnModalBg.on').count() === 0);
await page.click('.capstone-modal-close');              // leave with artifact in hand
await page.waitForTimeout(900);                         // trigger fires at 450ms
check('capstone modal closed', await page.locator('#capstoneBg.on').count() === 0);
check('process note modal fires on capstone close after report generation',
      await page.locator('#pnModalBg.on').count() === 1);
await page.click('.pn-modal-btn.primary');              // "Completar · Complete"
await page.waitForTimeout(600);                         // celebration at 300ms
check('completion flag set by real Completar click',
      await page.evaluate(() => localStorage.getItem('tupana_completion_shown')) === 'true');
check('process note modal closed on finish',
      await page.locator('#pnModalBg.on').count() === 0);
check('celebration overlay shown', await page.locator('#completionBg.on').count() === 1);
check('card not yet present while celebration is up',
      await page.locator('#journeyCompleteCard').count() === 0);
await page.click('.completion-cta');                    // "Continuar · Continue"
await page.waitForTimeout(300);
check('celebration dismissed', await page.locator('#completionBg.on').count() === 0);
check('card appears after dismissing celebration',
      await page.locator('#journeyCompleteCard').count() === 1);

// Once-per-load guard: reopening and closing capstone must not re-fire
await page.evaluate(() => openCapstoneModal());
await page.click('.capstone-modal-close');
await page.waitForTimeout(900);
check('completed flow does not re-fire process note on later capstone closes',
      await page.locator('#pnModalBg.on').count() === 0);

check('no uncaught page errors in entire flow', pageErrors.length === 0);
if (pageErrors.length) console.log('    pageerrors:', pageErrors.join(' | '));

await browser.close();

console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
process.exit(failed ? 1 : 0);

// ── Manual QA checklist ──────────────────────────────────────────────────
// [ ] Complete 10C on a real device → celebration → Continuar → card visible
//     under the capstone trigger in chat
// [ ] Card CTA opens Guardar/Exportar; Copiar todo puts report on clipboard
// [ ] Reload at Stage 10 → card still there; light + dark themes legible
// [ ] Help → "Las 10 etapas" mentions the Journey Complete card
