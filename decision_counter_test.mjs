// decision_counter_test.mjs — Batch 3 regression coverage
// Fixes the report summary counter discrepancy: Pause-and-Reflect / Revision
// Check decisions (checkpoint:true, choice 'option_N') were written to the
// decision log but EXCLUDED from the Accepted/Thinking/Questioned summary,
// while the log RENDER mislabeled them as "Questioned" (else-branch). So
// reports showed Questioned 0 while the log listed "Questioned" rows.
//
// Correct behavior (this test):
//   - every decision is counted exactly once: accepted+thinking+questioned+checks == total
//   - checkpoints land in their OWN "revision checks" bucket (NOT Questioned)
//   - dimension good/warn/flag still tally as accepted/thinking/questioned
//   - the decision log + both report renderers label checkpoints
//     "Revision check", never "Questioned"
// Run with the local test server up:  node test-server.js  (port 3001)

import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
let pass = 0, fail = 0;
const check = (l, c) => { console.log(`  ${c ? '✅' : '❌'} ${l}`); c ? pass++ : fail++; };

// Fixture: 2 accepted (good), 1 thinking (warn), 1 questioned (flag),
// 3 revision checks (checkpoint). total = 7.
const T = '2026-06-29T12:00:00.000Z';
const FIX = [
  { q: 'Voice',                       choice: 'good', t: T },
  { q: 'Accuracy',                    choice: 'good', t: T },
  { q: 'Thinking',                    choice: 'warn', t: T },
  { q: 'Voice',                       choice: 'flag', t: T },
  { q: 'Revision Check (Stage 4)',    choice: 'option_1', checkpoint: true, stage: 4,  t: T },
  { q: 'Revision Check (Stage 7)',    choice: 'option_4', checkpoint: true, stage: 7,  t: T },
  { q: 'Final Reflection (Stage 10)', choice: 'completed', checkpoint: true, stage: 10, t: T },
];

await page.goto(BASE);
await page.evaluate((fix) => {
  localStorage.clear(); sessionStorage.clear();
  localStorage.setItem('tupana_mani_done', 'true');
  localStorage.setItem('tupana_lab_done', 'true');
  localStorage.setItem('tupana_stage', '10');
  localStorage.setItem('tupana_draft_saved', 'true');
  localStorage.setItem('tupana_draft', 'word '.repeat(80));
  localStorage.setItem('tupana_decisions', JSON.stringify(fix));
}, FIX);
await page.reload();
await page.waitForTimeout(1400);

// ── tallyDecisions() invariant ──
const tally = await page.evaluate(() => tallyDecisions(JSON.parse(localStorage.getItem('tupana_decisions'))));
check('accepted = 2', tally.accepted === 2);
check('thinking = 1', tally.thinking === 1);
check('questioned = 1 (only the dimension flag, not the checkpoints)', tally.questioned === 1);
check('checks = 3 (the 3 checkpoints)', tally.checks === 3);
check('total = 7', tally.total === 7);
check('RECONCILES: accepted+thinking+questioned+checks === total',
      tally.accepted + tally.thinking + tally.questioned + tally.checks === tally.total);

// ── chat decision log render ──
const logHtml = await page.evaluate(() => { renderDecisionLog(); return document.getElementById('decisionLogItems').innerHTML; });
check('decision log shows "Revision check" rows (checkpoints not mislabeled)', /Revision check/.test(logHtml));
check('decision log uses neutral .check dot for checkpoints', /decision-dot check/.test(logHtml));

// ── instructor process report (plain text) ──
const instr = await page.evaluate(() => generateInstructorReport());
check('instructor report: "✓ Accepted ... : 2"', /✓ Accepted\s*:\s*2/.test(instr));
check('instructor report: "✗ Questioned ... : 1" (NOT 4)', /✗ Questioned \/ flagged\s*:\s*1/.test(instr));
check('instructor report: "◆ Revision checks ... : 3"', /◆ Revision checks .*:\s*3/.test(instr));
const qInLog = (instr.match(/✗ Questioned —/g) || []).length;
check('instructor decision-log lists exactly 1 "Questioned" row (the flag)', qInLog === 1);
const rcInLog = (instr.match(/◆ Revision check —/g) || []).length;
check('instructor decision-log lists 3 "Revision check" rows', rcInLog === 3);

// ── student process report (getReportText) ──
const rep = await page.evaluate(() => getReportText());
check('student report summary counts revision checks', /3 revision checks/.test(rep));
check('student report decision list labels checkpoints "Revision check"',
      (rep.match(/Revision check/g) || []).length >= 3);

check('no page JS errors', errs.length === 0);
if (errs.length) console.log('  errors:', errs);

console.log(`\n  ${pass}/${pass + fail} PASS`);
await browser.close();
process.exit(fail ? 1 : 0);
