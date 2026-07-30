// milestone_simplification_test.mjs — calm-shell regression coverage
// Verifies the student-facing three-phase layer over the intact ten-stage
// engine. The legacy five-milestone detailed route remains available on demand.
//   - no page JS errors across stages
// Run with the local test server up:  node test-server.js  (port 3001)

import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:3001';
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
// The mobile progress strip follows the three student-facing phases.
const stripPct = () => page.locator('#currentTaskBar')
      .evaluate(el => el.style.getPropertyValue('--ctb-progress').trim());

// ── Phase 1: Start (stages 1–6) ──
console.log('Stage 1 → Start');
await openAt(1);
check('calm shell renders exactly 3 phases',
      await page.locator('.calm-phase').count() === 3);
check('Start is the current phase',
      await page.locator('#calmPhase1[aria-current="step"]').count() === 1);
check('detailed journey is hidden by default',
      await page.locator('#detailedJourney').evaluate(el => getComputedStyle(el).display) === 'none');
check('journey renders exactly 5 milestone groups',
      await page.locator('.journey-track .milestone-group').count() === 5);
const ctb1 = await ctbText();
check('task bar identifies the immediate focus, not a stage count',
      /Enfoque/.test(ctb1) && /Focus/.test(ctb1) && !/of 10|de 10|of 5|de 5/.test(ctb1));
check('progress strip = one third in Start', (await stripPct()).startsWith('33.33'));
const hdr = await page.locator('.journey-track .milestone-group .phase-label.show-en').allTextContents();
check('the 5 milestone names appear as headers',
      ['Find Your Story','Research & Plan','Write Your First Draft','Refine Your Essay','Reflect & Submit']
        .every(name => hdr.some(t => t.includes(name))));
const circleNums = (await page.locator('.journey-track .stage-circle').allTextContents())
      .map(s => s.trim()).filter(Boolean);
check('stage circles carry NO raw numeric labels', !circleNums.some(t => /^\d+$/.test(t)));
check('active milestone highlighted (.ms-active)',
      await page.locator('.milestone-group.ms-active').count() === 1);

// ── Stage 6 remains in Start and preserves the authorship gate ──
console.log('Stage 6 → Start (authorship gate)');
await openAt(6, { tupana_draft: 'word '.repeat(60), tupana_writing_s6: 'word '.repeat(60) });
const ctb6 = await ctbText();
check('Stage 6 remains in Start',
      await page.locator('#calmPhase1[aria-current="step"]').count() === 1);
check('task bar stays focus-oriented at Stage 6',
      /Enfoque/.test(ctb6) && /Focus/.test(ctb6) && !/Paso 3|Step 3/.test(ctb6));
check('Stage-6 authorship-gate icon preserved',
      await page.locator('.stage-node[data-id="6"] .stage-circle svg').count() === 1);
check('progress strip stays at one third through Stage 6', (await stripPct()).startsWith('33.33'));

// ── Phase 2: Revise (stages 7–9) ──
console.log('Stage 7 → Revise');
await openAt(7);
check('Revise is the current phase',
      await page.locator('#calmPhase2[aria-current="step"]').count() === 1);
check('progress strip = two thirds in Revise', (await stripPct()).startsWith('66.66'));

// ── Phase 3: Finish (stage 10) ──
console.log('Stage 10 → Finish');
await openAt(10);
const ctb10 = await ctbText();
check('Finish is the current phase',
      await page.locator('#calmPhase3[aria-current="step"]').count() === 1);
check('task bar stays focus-oriented at Stage 10',
      /Enfoque/.test(ctb10) && /Focus/.test(ctb10) && !/Paso 5|Step 5/.test(ctb10));
check('progress strip = 100% in Finish', await stripPct() === '100%');

check('no page JS errors across all stages', errs.length === 0);
if (errs.length) console.log('  errors:', errs);

console.log(`\n  ${pass}/${pass + fail} PASS`);
await browser.close();
process.exit(fail ? 1 : 0);
