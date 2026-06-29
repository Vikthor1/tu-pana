// pause_reflect_rework_test.mjs — Batch 2 regression coverage
// Verifies the reframed reflection checkpoint ("Pause and Reflect" → warm,
// non-punitive "Before You Continue · Quick check"):
//   - trigger button reads "Quick check" (not "Pausa crítica")
//   - modal header reads "Before You Continue" / "Antes de seguir"
//   - prompt uses the warm "Before moving on, check this: … This helps you …" pattern
//   - picking an option still logs to tupana_decisions with checkpoint:true
//     and a clean instructor label "Revision Check (Stage N)"
//   - the .reflect-btn / .reflect-btn-wrap structure (relied on by other
//     tests) is preserved
// Run with the local test server up:  node test-server.js  (port 3001)

import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
let pass = 0, fail = 0;
const check = (l, c) => { console.log(`  ${c ? '✅' : '❌'} ${l}`); c ? pass++ : fail++; };

async function openAt(stage) {
  await page.goto(BASE);
  await page.evaluate((st) => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('tupana_mani_done', 'true');
    localStorage.setItem('tupana_lab_done', 'true');
    localStorage.setItem('tupana_stage', String(st));
  }, stage);
  await page.reload();
  await page.waitForTimeout(1200);
}

console.log('Stage 4 — warm "Before You Continue" check + clean logging');
await openAt(4);
// surface the reflect button via a bot message (renderReflectButton fires at +400ms)
await page.evaluate(() => { if (typeof addMsg === 'function') addMsg('Coach test message.', 'bot'); });
await page.waitForTimeout(700);

const btnText = await page.locator('.reflect-btn').first().evaluate(el => el.textContent);
check('trigger button reads "Quick check" / "Revisión rápida"',
      /Quick check/.test(btnText) && /Revisi/.test(btnText) && !/crítica/.test(btnText));
check('.reflect-btn-wrap structure preserved',
      await page.locator('.reflect-btn-wrap').count() >= 1);

await page.locator('.reflect-btn').first().click();
await page.waitForSelector('#reflectModal', { timeout: 3000 });
const headerText = await page.locator('#reflectModal .eval-modal-header').evaluate(el => el.textContent);
check('modal header "Before You Continue" / "Antes de seguir"',
      /Before You Continue/.test(headerText) && /Antes de seguir/.test(headerText) && !/Pause and Reflect/.test(headerText));
const intro = await page.locator('#reflectModal .eval-modal-intro').evaluate(el => el.textContent);
check('prompt uses warm "Before moving on, check this" pattern',
      /Before moving on, check this/.test(intro) && /This (helps|keeps) you|This keeps your/.test(intro));

await page.locator('#reflectModal .reflect-option-btn').first().click();
await page.waitForTimeout(900); // option handler logs then removes overlay at +700ms
const decisions = await page.evaluate(() => JSON.parse(localStorage.getItem('tupana_decisions') || '[]'));
const last = decisions[decisions.length - 1] || {};
check('option pick logged with checkpoint:true + stage 4',
      last.checkpoint === true && last.stage === 4);
check('decision q uses clean instructor label "Revision Check (Stage 4)"',
      last.q === 'Revision Check (Stage 4)');
check('choice still recorded as option_N (shape unchanged)',
      /^option_\d+$/.test(last.choice || ''));

check('no page JS errors', errs.length === 0);
if (errs.length) console.log('  errors:', errs);

console.log(`\n  ${pass}/${pass + fail} PASS`);
await browser.close();
process.exit(fail ? 1 : 0);
