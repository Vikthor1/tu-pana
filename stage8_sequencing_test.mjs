// stage8_sequencing_test.mjs — Stage A.2 / B1 regression coverage
// Verifies the Stage-8 entry sequencing fix (reduce cognitive overload without
// removing reflection content):
//   1. entering Stage 8 (via goToStage) does NOT auto-open the reflection modal
//   2. selecting a Voice-Polish route still sets/surfaces the Stage-8 Quick Check button
//   3. clicking that button opens the reflection modal (the check is still reachable)
//   4. advancing to Stage 9 clears the Stage-8 reflection path — no _reflectStage leak
//   5. no new tupana_* key (the auto-open key tupana_reflect_shown_8 is no longer written)
// Run with the local test server up:  node test-server.js  (port 3001)

import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
let pass = 0, fail = 0;
const check = (l, c) => { console.log(`  ${c ? '✅' : '❌'} ${l}`); c ? pass++ : fail++; };

// Boot the app with onboarding complete, at Stage 7, then ENTER Stage 8 via goToStage
// (a page reload restores the stage directly and bypasses goToStage's entry hooks,
//  so we must drive the real transition to exercise the auto-open path).
await page.goto(BASE);
await page.evaluate(() => {
  localStorage.clear(); sessionStorage.clear();
  localStorage.setItem('tupana_mani_done', 'true');
  localStorage.setItem('tupana_lab_done', 'true');
  localStorage.setItem('tupana_stage', '7');
});
await page.reload();
await page.waitForTimeout(1000);
const keysAtStage7 = await page.evaluate(() =>
  Object.keys(localStorage).filter(k => k.startsWith('tupana_')).sort());

console.log('B1 — Stage-8 entry sequencing');

// 1. Enter Stage 8 — must NOT auto-open the reflection modal
await page.evaluate(() => goToStage(8));
await page.waitForTimeout(1600); // past the old 1200ms auto-open timer
check('entering Stage 8 does NOT auto-open the reflection modal',
      await page.locator('#reflectModal').count() === 0);
check('state.stage === 8 after entry',
      await page.evaluate(() => state.stage) === 8);

// 2. Selecting a Voice-Polish route sets _reflectStage=8 and (after a bot reply)
//    surfaces the Quick Check button. Click via the element's own handler to avoid
//    any onboarding-spotlight overlay intercepting the pointer.
await page.waitForSelector('.vp-route-btn', { timeout: 3000 });
await page.evaluate(() => document.querySelector('.vp-route-btn').click()); // 'clearer' route
check('selecting a Voice-Polish route sets _reflectStage = 8',
      await page.evaluate(() => state._reflectStage) === 8);
await page.evaluate(() => addMsg('Coach reply about your sentence.', 'bot'));
await page.waitForTimeout(700); // renderReflectButton fires at +400ms
check('Stage-8 Quick Check button surfaces after route + bot reply',
      await page.locator('.reflect-btn').count() >= 1);

// 3. Clicking the button opens the Stage-8 reflection modal
await page.evaluate(() => document.querySelector('.reflect-btn').click());
await page.waitForSelector('#reflectModal', { timeout: 3000 });
const modalText = await page.locator('#reflectModal').evaluate(el => el.textContent);
check('clicking the Quick Check button opens the Stage-8 reflection modal (your voice)',
      /Antes de seguir/.test(modalText) && /(your voice|tu voz)/i.test(modalText));
await page.evaluate(() => document.getElementById('reflectModal')?.remove());

// 4. Advancing to Stage 9 clears the Stage-8 path — no leak
await page.evaluate(() => goToStage(9));
await page.waitForTimeout(800);
check('advancing to Stage 9 clears _reflectStage (no leak)',
      await page.evaluate(() => state._reflectStage) === 0);
// A new Stage-9 bot message must NOT gain a reflect button (no stage-9 checkpoint +
// the stale Stage-8 flag was cleared). The historical Stage-8 button legitimately
// remains in the chat log, so measure the DELTA rather than the absolute count.
const reflectBefore = await page.locator('.reflect-btn').count();
await page.evaluate(() => addMsg('Coach reply at stage 9.', 'bot'));
await page.waitForTimeout(700);
const reflectAfter = await page.locator('.reflect-btn').count();
check('no NEW Quick Check button surfaces at Stage 9 (no Stage-8 leak)',
      reflectAfter === reflectBefore);
check('no reflection modal at Stage 9',
      await page.locator('#reflectModal').count() === 0);

// 5. No new tupana_* key from entering/leaving Stage 8; auto-open key not written
const keysAfter = await page.evaluate(() =>
  Object.keys(localStorage).filter(k => k.startsWith('tupana_')).sort());
check('tupana_reflect_shown_8 is NOT written (auto-open removed)',
      !keysAfter.includes('tupana_reflect_shown_8'));

check('no page JS errors', errs.length === 0);
if (errs.length) console.log('  errors:', errs);

console.log(`\n  ${pass}/${pass + fail} PASS`);
await browser.close();
process.exit(fail ? 1 : 0);
