// report_attestation_test.mjs — Stage A.2 polish (H5) regression coverage
// The instructor/process report's Section 7 first-draft authorship attestation must be a
// REAL attestation tied to the recorded first-draft gate status — not an unconditional
// system stamp that contradicts Section 1.
//   - gate PASSED (draftSaved) → "☑  I completed my first draft before using AI feedback."
//   - gate NOT passed          → "☐ … — NOT documented …", and NO false ☑ claim
//   - Section 1 and Section 7 never contradict each other
//   - the other three general attestations are unchanged; Final Packet still generates
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
  await page.waitForTimeout(1100);
}
const report = () => page.evaluate(() => generateInstructorReport());

const CHECKED   = /☑  I completed my first draft before using AI feedback\./;
const UNCHECKED = /☐  I completed my first draft before using AI feedback\./;

// ── Gate PASSED ──
console.log('Gate PASSED (unassisted first draft saved)');
await seed(10, { tupana_draft: 'a real first draft of some words', tupana_draft_saved: 'true' });
let rep = await report();
check('PASSED: first-draft attestation is CHECKED (☑)', CHECKED.test(rep));
check('PASSED: not rendered as unchecked', !UNCHECKED.test(rep));
check('PASSED: Section 1 gate reads PASSED/YES', /Unassisted first draft saved : YES/.test(rep));
check('PASSED: no "NOT documented" attestation note', !/NOT documented: no unassisted first draft/.test(rep));

// ── Gate NOT passed ──
console.log('Gate NOT passed (no first draft saved)');
await seed(10, {}); // reached Stage 10 state but never saved a first draft
rep = await report();
check('NOT passed: first-draft attestation is UNCHECKED (☐)', UNCHECKED.test(rep));
check('NOT passed: NO false ☑ first-draft claim', !CHECKED.test(rep));
check('NOT passed: attestation explains it is NOT documented', /NOT documented: no unassisted first draft/.test(rep));
check('NOT passed: Section 1 gate reads NO / NOT DOCUMENTED', /Unassisted first draft saved : NO/.test(rep) && /NOT DOCUMENTED/.test(rep));

// ── No self-contradiction (the core property) ──
console.log('Section 1 ↔ Section 7 consistency');
check('not passed: report never asserts ☑ first-draft while Section 1 says NO',
      !(CHECKED.test(rep) && /Unassisted first draft saved : NO/.test(rep)));

// ── The other three general attestations stay present (not gated) ──
console.log('General attestations preserved');
check('responsibility attestation present',
      /☑  The draft, revisions, and final decisions are my own responsibility\./.test(rep));
check('support-tool attestation present',
      /☑  I used Tu Pana de Escritura as a writing support tool/.test(rep));
check('reviewed-report attestation present',
      /☑  I have reviewed this report before submitting it\./.test(rep));

// ── Final Packet still generates with the attestation correction ──
console.log('Final Packet still generates');
await seed(10, { tupana_draft: 'first', tupana_writing_s8: 'revised essay text here longer', tupana_draft_saved: 'true' });
const packetOk = await page.evaluate(() => {
  try { const p = buildSubmissionDiagnostic(); const rep = generateInstructorReport();
        return typeof rep === 'string' && rep.includes('SECTION 7 — AUTHORSHIP CONFIRMATION') && !!p; }
  catch (e) { return false; }
});
check('Final Packet report builds and includes Section 7', packetOk);

check('no page JS errors', errs.length === 0);
if (errs.length) console.log('  errors:', errs);

console.log(`\n  ${pass}/${pass + fail} PASS`);
await browser.close();
process.exit(fail ? 1 : 0);
