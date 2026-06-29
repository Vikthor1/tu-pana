// final_packet_test.mjs — Batch 5 regression coverage
// One recommended export: the Final Submission Packet. Fixes the pilot's
// export confusion (students submitting "first draft only" / "no essay").
//   - getFinalEssay() resolves the REVISED essay (revision-stage text),
//     falling back to the first draft; "revised" only if it differs from draft
//   - buildSubmissionDiagnostic() flags: no essay / first-draft-only /
//     gate-not-passed / blank reflection
//   - generateInstructorReport() now leads with SUBMISSION CHECK + FINAL ESSAY
//     (so the Brightspace artifact actually contains the revised essay)
//   - Save/Export modal shows the diagnostic banner + a primary packet button
// Run with the local test server up:  node test-server.js  (port 3001)

import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
let pass = 0, fail = 0;
const check = (l, c) => { console.log(`  ${c ? '✅' : '❌'} ${l}`); c ? pass++ : fail++; };

async function seed(stage, kv) {
  await page.goto(BASE);
  await page.evaluate(([st, m]) => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('tupana_mani_done', 'true');
    localStorage.setItem('tupana_lab_done', 'true');
    localStorage.setItem('tupana_stage', String(st));
    Object.entries(m || {}).forEach(([k, v]) => localStorage.setItem(k, v));
  }, [stage, kv]);
  await page.reload();
  await page.waitForTimeout(1200);
}

// ── Scenario A: first draft only (the pilot bug) ──
console.log('Scenario A — first draft only');
await seed(10, { tupana_draft: 'FIRSTDRAFT alpha content', tupana_draft_saved: 'true' });
let r = await page.evaluate(() => {
  const e = getFinalEssay(); const d = buildSubmissionDiagnostic(); const rep = generateInstructorReport();
  return { revised: e.revised, stage: e.stage, ok: d.ok, warns: d.warnings.map(w => w.en).join(' | '), rep };
});
check('A: essay flagged as NOT revised (first draft only)', r.revised === false && r.stage === 6);
check('A: diagnostic NOT ok', r.ok === false);
check('A: warns "Only your FIRST draft"', /Only your FIRST draft/.test(r.warns));
check('A: report marks "FIRST DRAFT ONLY"', /FIRST DRAFT ONLY/.test(r.rep));
check('A: report FINAL ESSAY contains the draft text', /FIRSTDRAFT alpha content/.test(r.rep));

// ── Scenario B: revised essay present + complete ──
console.log('Scenario B — revised essay, complete packet');
await seed(10, {
  tupana_draft: 'FIRSTDRAFT alpha',
  tupana_writing_s8: 'REVISEDESSAY beta — much more developed text here',
  tupana_draft_saved: 'true',
  tupana_decisions: JSON.stringify([{ q: 'Voice', choice: 'good', t: '2026-06-29T12:00:00Z' }]),
  tupana_process_note: JSON.stringify({ mr_main_idea: 'x', mr_changed: 'y', mr_needs_work: 'z' })
});
r = await page.evaluate(() => {
  const e = getFinalEssay(); const d = buildSubmissionDiagnostic(); const rep = generateInstructorReport();
  return { revised: e.revised, ok: d.ok, rep };
});
check('B: essay flagged as revised', r.revised === true);
check('B: diagnostic OK (essay revised, gate passed, reflection done, decisions present)', r.ok === true);
check('B: report contains the REVISED essay text (not just first draft)', /REVISEDESSAY beta/.test(r.rep));
check('B: report marks "revised draft"', /revised draft/.test(r.rep));
check('B: report SUBMISSION CHECK says ready', /Ready to submit/.test(r.rep));
// H5: gate passed → Section 7 first-draft attestation is CHECKED.
check('B: Section 7 first-draft attestation CHECKED when gate passed',
      /☑  I completed my first draft before using AI feedback\./.test(r.rep));

// ── Scenario C: no essay at all ──
console.log('Scenario C — no essay');
await seed(2, {});
r = await page.evaluate(() => { const e = getFinalEssay(); const d = buildSubmissionDiagnostic(); const rep = generateInstructorReport(); return { txt: e.text, warns: d.warnings.map(w=>w.en).join(' | '), rep }; });
check('C: getFinalEssay returns empty', r.txt === '');
check('C: diagnostic warns "No essay found"', /No essay found/.test(r.warns));
// H5: gate NOT passed → Section 7 attestation must NOT falsely claim completion,
// and must stay consistent with Section 1's honest "NOT DOCUMENTED".
check('C: Section 7 first-draft attestation UNCHECKED when gate not passed',
      /☐  I completed my first draft before using AI feedback\./.test(r.rep));
check('C: Section 7 explains NOT documented (no unassisted first draft)',
      /NOT documented: no unassisted first draft/.test(r.rep));
check('C: Section 1 gate reads NOT DOCUMENTED (no self-contradiction)',
      /NOT DOCUMENTED/.test(r.rep) && !/☑  I completed my first draft/.test(r.rep));

// ── UI: modal shows diagnostic banner + recommended packet path ──
console.log('UI — Save/Export modal');
await seed(10, { tupana_draft: 'FIRSTDRAFT only', tupana_draft_saved: 'true' });
await page.evaluate(() => openReport());
await page.waitForTimeout(300);
check('modal renders diagnostic banner', await page.locator('#reportBody .packet-diag').count() === 1);
check('modal diagnostic is the WARN variant (first-draft-only)', await page.locator('#reportBody .packet-diag--warn').count() === 1);
check('modal has primary Final Packet button (exportFinalPacket)', await page.locator('button[onclick="exportFinalPacket()"]').count() === 1);
check('modal has Download Final Packet button', await page.locator('button[onclick="downloadFinalPacket()"]').count() === 1);
check('secondary exports moved under "Other options" details', await page.locator('.report-other-options').count() === 1);

check('no page JS errors', errs.length === 0);
if (errs.length) console.log('  errors:', errs);

console.log(`\n  ${pass}/${pass + fail} PASS`);
await browser.close();
process.exit(fail ? 1 : 0);
