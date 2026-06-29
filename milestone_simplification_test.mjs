// milestone_simplification_test.mjs — Batch 1 regression coverage
// Verifies the student-facing milestone layer (5 milestones over the internal
// 10 stages) renders correctly while the internal stage machine is untouched:
//   - journey map shows exactly 5 milestone groups with the 5 milestone names
//   - current-task bar reads "Paso N de 5 · <name>" / "Step N of 5 · <name>"
//     (never "of 10")
//   - stage circles carry NO raw 1–10 numbers (clean upcoming / check / gate)
//   - the Stage-6 authorship-gate icon is preserved (gate stays its own milestone)
//   - stage→milestone mapping: S1→M1, S6→M3, S10→M5
//   - no page JS errors across stages
// Run with the local test server up:  node test-server.js  (port 3001)

import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
let pass = 0, fail = 0;
const check = (l, c) => { console.log(`  ${c ? '✅' : '❌'} ${l}`); c ? pass++ : fail++; };

async function openAt(stage, extra) {
  await page.goto(BASE);
  await page.evaluate(([st, kv]) => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('tupana_mani_done', 'true');
    localStorage.setItem('tupana_lab_done', 'true');
    localStorage.setItem('tupana_stage', String(st));
    Object.entries(kv || {}).forEach(([k, v]) => localStorage.setItem(k, v));
  }, [stage, extra]);
  await page.reload();
  await page.waitForTimeout(1200);
}
// #ctbStage holds both .show-es and .show-en spans; read textContent (not
// innerText) so the assertion is language-mode-independent.
const ctbText = () => page.locator('#ctbStage').evaluate(el => el.textContent);

// ── Milestone 1: Find Your Story (stages 1–3) ──
console.log('Stage 1 → Milestone 1');
await openAt(1);
check('journey renders exactly 5 milestone groups',
      await page.locator('.journey-track .milestone-group').count() === 5);
const ctb1 = await ctbText();
check('task bar: Paso 1 / Step 1', /Paso 1/.test(ctb1) && /Step 1/.test(ctb1));
check('task bar: milestone name "Find Your Story"', /Find Your Story/.test(ctb1));
check('task bar: "of 5 / de 5", never "of 10"',
      /of 5/.test(ctb1) && /de 5/.test(ctb1) && !/of 10/.test(ctb1));
const hdr = await page.locator('.journey-track .milestone-group .phase-label.show-en').allTextContents();
check('the 5 milestone names appear as headers',
      ['Find Your Story','Research & Plan','Write Your First Draft','Refine Your Essay','Reflect & Submit']
        .every(name => hdr.some(t => t.includes(name))));
const circleNums = (await page.locator('.journey-track .stage-circle').allTextContents())
      .map(s => s.trim()).filter(Boolean);
check('stage circles carry NO raw numeric labels', !circleNums.some(t => /^\d+$/.test(t)));
check('active milestone highlighted (.ms-active)',
      await page.locator('.milestone-group.ms-active').count() === 1);

// ── Milestone 3: Write Your First Draft (stage 6 — authorship gate) ──
console.log('Stage 6 → Milestone 3 (authorship gate)');
await openAt(6, { tupana_draft: 'word '.repeat(60), tupana_writing_s6: 'word '.repeat(60) });
const ctb6 = await ctbText();
check('task bar: Paso 3 / Step 3', /Paso 3/.test(ctb6) && /Step 3/.test(ctb6));
check('task bar: "Write Your First Draft"', /Write Your First Draft/.test(ctb6));
check('Stage-6 authorship-gate icon preserved',
      await page.locator('.stage-node[data-id="6"] .stage-circle svg').count() === 1);

// ── Milestone 5: Reflect & Submit (stage 10) ──
console.log('Stage 10 → Milestone 5');
await openAt(10);
const ctb10 = await ctbText();
check('task bar: Paso 5 / Step 5 · Reflect & Submit',
      /Paso 5/.test(ctb10) && /Step 5/.test(ctb10) && /Reflect & Submit/.test(ctb10));

check('no page JS errors across all stages', errs.length === 0);
if (errs.length) console.log('  errors:', errs);

console.log(`\n  ${pass}/${pass + fail} PASS`);
await browser.close();
process.exit(fail ? 1 : 0);
