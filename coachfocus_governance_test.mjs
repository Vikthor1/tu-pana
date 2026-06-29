// coachfocus_governance_test.mjs — Stage A.2 / B2 governance coverage
// The genre/assignment layer plugs its per-stage coachFocus strings into the
// system prompt. This test makes that seam safe BEFORE Stage B uses it:
//   1. PROMPT HIERARCHY: the absolute authorship rule appears BEFORE the
//      stage-focus hints, and the hints are explicitly marked SUBORDINATE
//      (the old authoritative "Stage-specific rules:" heading is gone).
//   2. POSITIVE GUARD: every active-template coachFocus carries an
//      authorship-protective clause (a "do not write/generate/rewrite/…"
//      style constraint or equivalent).
//   3. NEGATIVE GUARD: no active coachFocus contains a positive-ghostwriting
//      directive (offering copyable example prose / a model the student can use).
// genre-template.js is NOT edited by this fix — this test guards its content.
// Run with the local test server up:  node test-server.js  (port 3001)

import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
let pass = 0, fail = 0;
const check = (l, c) => { console.log(`  ${c ? '✅' : '❌'} ${l}`); c ? pass++ : fail++; };

await page.goto(BASE);
await page.waitForTimeout(800); // let all scripts load

console.log('B2 — CoachFocus governance seam');

// ── 1. Prompt hierarchy ────────────────────────────────────────────────
const prompt = await page.evaluate(() => buildOllamaSystemPrompt('English'));
const iAuthorship = prompt.indexOf('ABSOLUTE AUTHORSHIP RULE');
const iHints = prompt.indexOf('Stage focus hints (SUBORDINATE');
check('absolute authorship rule is present in the system prompt', iAuthorship >= 0);
check('subordinate stage-focus heading is present', iHints >= 0);
check('authorship rule appears BEFORE the stage-focus hints',
      iAuthorship >= 0 && iHints >= 0 && iAuthorship < iHints);
check('old authoritative "Stage-specific rules:" heading is gone',
      !/Stage-specific rules:/.test(prompt));
check('subordinate heading states the hints never override the mandatory rules',
      /NEVER relax or override the mandatory rules above/i.test(prompt));

// ── 2 & 3. Per-stage coachFocus guards ─────────────────────────────────
const stages = await page.evaluate(() =>
  getActiveTemplate().stages.map(s => ({ number: s.number, coachFocus: String(s.coachFocus || '') })));
check('active template exposes coachFocus for every stage (>=10)', stages.length >= 10);

// Positive: each coachFocus carries an authorship-protective clause.
const PROTECT = /(\bdo not (write|generate|rewrite|invent|provide|flatten|compose|draft)\b)|(\bnever (write|generate|rewrite|compose)\b)|(the student writes\b)|(in their own words)|(do not [^.]*\bfor them\b)/i;
const unprotected = stages.filter(s => !PROTECT.test(s.coachFocus)).map(s => s.number);
check('every active coachFocus carries an authorship-protective clause' +
      (unprotected.length ? ` (missing: ${unprotected.join(',')})` : ''),
      unprotected.length === 0);

// Negative: no coachFocus offers copyable example/model prose to the student.
// (Phrases chosen so they do NOT collide with the negated clauses already present,
//  e.g. "...or copy-paste-ready version" / "do not write ... for them".)
const GHOSTWRITE = [
  /here is (an?|your|the|one) (example|sample|model|sentence|version|paragraph)/i,
  /you can (use|copy|adapt|paste) (this|the|that|it|the following)/i,
  /\b(i'?ll|i will|let me) (write|draft|compose|create)\b/i,
  /(example|model|sample) (thesis|sentence|paragraph|outline) (you|the student|they) can (use|adapt|copy)/i,
];
const leaky = stages.filter(s => GHOSTWRITE.some(rx => rx.test(s.coachFocus))).map(s => s.number);
check('no active coachFocus offers copyable example/model prose' +
      (leaky.length ? ` (violations: ${leaky.join(',')})` : ''),
      leaky.length === 0);

check('no page JS errors', errs.length === 0);
if (errs.length) console.log('  errors:', errs);

console.log(`\n  ${pass}/${pass + fail} PASS`);
await browser.close();
process.exit(fail ? 1 : 0);
