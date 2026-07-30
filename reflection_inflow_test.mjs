// reflection_inflow_test.mjs — Batch 4 regression coverage
// In-flow micro-reflections (after first draft / after revision / before submit)
// reduce Q3–Q8 skip rate. Stored as sub-keys of tupana_process_note (no new
// localStorage key). The deeper Q3–Q8 note is preserved. The report shows
// reflection status (COMPLETED / PARTIAL / BLANK).
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

// ── #1: after first draft saved (executeSave) ──
console.log('Stage 6 — micro-reflection after first draft saved');
await openAt(6, { tupana_writing_s6: 'word '.repeat(60) });
await page.evaluate(() => { D.draftArea.value = 'word '.repeat(60); executeSave(); });
await page.waitForTimeout(1300);
check('main_idea micro-reflection appears after save',
      await page.locator('.micro-reflect[data-mr="mr_main_idea"]').count() === 1);

// type into it → autosaves to tupana_process_note sub-key
await page.fill('#mr-mr_main_idea', 'My essay is about my grandmother and migration.');
await page.waitForTimeout(700);
const pn = await page.evaluate(() => JSON.parse(localStorage.getItem('tupana_process_note') || '{}'));
check('answer saved under tupana_process_note.mr_main_idea',
      /grandmother/.test(pn.mr_main_idea || ''));
check('NO new top-level localStorage key (still inside tupana_process_note)',
      await page.evaluate(() => !Object.keys(localStorage).some(k => /^tupana_mr_/.test(k))));
const rs1 = await page.evaluate(() => reflectionStatus());
check('reflectionStatus = PARTIAL after 1 of 3', rs1.status === 'PARTIAL' && rs1.filled === 1);

// ── #2 + #3: stage 9 ("changed") and stage 10 ("needs_work") ──
// These fire on navigation via goToStage() — the real student path (Continue
// button). app.js's reload-restore intentionally bypasses goToStage, like the
// existing research/voice cards, so we simulate forward navigation.
console.log('Stage 9 / Stage 10 — remaining micro-reflections (via navigation)');
await openAt(8, {
  tupana_draft_saved: 'true',
  tupana_draft: 'word '.repeat(60),
  // Stage 10 requires a changed draft or a student-reported instructor
  // exception. Seed a revised version so this test reaches the reflection it
  // is designed to inspect without bypassing the student-facing checkpoint.
  tupana_writing_s7: 'A changed draft with a clearer purpose, stronger evidence, and a deliberate conclusion.'
});
await page.evaluate(() => goToStage(9));
await page.waitForTimeout(1000);
check('changed micro-reflection appears when navigating to Stage 9',
      await page.locator('.micro-reflect[data-mr="mr_changed"]').count() === 1);
await page.evaluate(() => goToStage(10));
await page.waitForTimeout(1300);
check('needs_work micro-reflection appears when navigating to Stage 10',
      await page.locator('.micro-reflect[data-mr="mr_needs_work"]').count() === 1);

// ── report integration: status + answers + Q3–Q8 preserved ──
console.log('Report integration');
await openAt(10, {
  tupana_draft_saved: 'true', tupana_draft: 'word '.repeat(60),
  tupana_process_note: JSON.stringify({
    mr_main_idea: 'Main idea text.', mr_changed: 'I added a scene.', mr_needs_work: 'The intro.',
    q3: 'I got help with structure.', q8: 'My family language matters.'
  })
});
const instr = await page.evaluate(() => generateInstructorReport());
check('instructor report shows "Reflection status : COMPLETED"', /Reflection status : COMPLETED \(3 of 3/.test(instr));
check('instructor report lists in-flow reflection answers', /I added a scene/.test(instr) && /The intro/.test(instr));
check('instructor report PRESERVES deeper Q3–Q8 note', /I got help with structure/.test(instr) && /My family language matters/.test(instr));
const rsBlank = await page.evaluate(() => { localStorage.setItem('tupana_process_note','{}'); return reflectionStatus(); });
check('reflectionStatus = BLANK when nothing filled', rsBlank.status === 'BLANK' && rsBlank.filled === 0);

check('no page JS errors', errs.length === 0);
if (errs.length) console.log('  errors:', errs);

console.log(`\n  ${pass}/${pass + fail} PASS`);
await browser.close();
process.exit(fail ? 1 : 0);
