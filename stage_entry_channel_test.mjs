// stage_entry_channel_test.mjs — Stage A.2 polish (H4) regression coverage
// Verifies that each stage entry produces exactly ONE automatic guidance channel
// (the STAGE_ENTRY_MESSAGES "stage-intro" chat bubble) and no longer auto-stacks a
// near-identical Pana Hint card. Also confirms the single channel still carries the
// Stage-6 authorship framing and Stage-8 voice framing, and that the Stage-6 entry
// message no longer contains the duplicate import parenthetical (H3).
//
//   - on stage entry: exactly 1 ".msg.msg-type-stage-intro" bubble
//   - on stage entry: 0 ".pana-hint" cards (auto Pana Hint suppressed)
//   - Stage 6 entry text: authorship framing present, NO import parenthetical (H3)
//   - Stage 8 entry text: voice framing present
//   - injectPanaHint() is still defined (retained for on-demand/future use)
//   - no page JS errors
// Run with the local test server up:  node test-server.js  (port 3001)

import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
let pass = 0, fail = 0;
const check = (l, c) => { console.log(`  ${c ? '✅' : '❌'} ${l}`); c ? pass++ : fail++; };

async function freshLoad() {
  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('tupana_mani_done', 'true');
    localStorage.setItem('tupana_lab_done', 'true');
    // Seed a saved first draft so nothing gate-related interferes with navigation.
    localStorage.setItem('tupana_draft', 'word '.repeat(60));
    localStorage.setItem('tupana_draft_saved', 'true');
  });
  await page.reload();
  await page.waitForTimeout(1000);
}

// Drive a real stage transition in-page (init does not call goToStage on reload),
// after clearing the chat stream + log so the one-time stage-intro guard re-fires.
async function enterStage(n) {
  await page.evaluate((id) => {
    try { localStorage.setItem('tupana_chatlog', '[]'); } catch (e) {}
    const cm = document.getElementById('chatMessages');
    if (cm) cm.innerHTML = '';
    state.draftSaved = true;     // keep nav unobstructed for stages 7+
    state.welcomeShown = true;   // suppress the one-time welcome-back strip so the
                                 // only .welcome-strip left is the stage-intro channel
    goToStage(id);
  }, n);
  await page.waitForTimeout(950); // stage-intro fires at +400ms
}

// stage-intro / welcome render as compact ".welcome-strip" (not full ".msg" bubbles).
// After enterStage() clears the stream and only goToStage runs, the lone strip is the
// stage-intro. The chat-log count (msgType==='stage-intro' && stage===id) is the
// unambiguous proof of a single automatic entry channel.
const stripCount = () => page.locator('#chatMessages .welcome-strip').count();
const panaCount  = () => page.locator('#chatMessages .pana-hint').count();
const introLogCount = (id) => page.evaluate((sid) => {
  try { return JSON.parse(localStorage.getItem('tupana_chatlog') || '[]')
        .filter(e => e.msgType === 'stage-intro' && e.stage === sid).length; }
  catch (e) { return -1; }
}, id);
const introText = async () => {
  if ((await stripCount()) === 0) return '';
  return (await page.locator('#chatMessages .welcome-strip .welcome-strip-text').first().textContent()) || '';
};

await freshLoad();

// One channel per entry, across a representative spread of stages.
for (const n of [1, 2, 4, 6, 8]) {
  console.log(`Stage ${n} entry`);
  await enterStage(n);
  check(`stage ${n}: exactly one stage-intro logged`, (await introLogCount(n)) === 1);
  check(`stage ${n}: exactly one entry strip rendered`, (await stripCount()) === 1);
  check(`stage ${n}: no auto Pana Hint card`, (await panaCount()) === 0);
}

// Stage 6 — authorship framing preserved, import parenthetical removed (H3).
console.log('Stage 6 — authorship framing + H3 import-parenthetical removal');
await enterStage(6);
const t6 = await introText();
check('stage 6: authorship framing present ("without the coach")', /without the coach/i.test(t6));
check('stage 6: "Write without stopping" preserved', /Write without stopping/i.test(t6));
check('stage 6: NO import parenthetical (H3)', !/import/i.test(t6) && !/importar/i.test(t6));

// Stage 8 — voice framing preserved in the single channel.
console.log('Stage 8 — voice framing preserved');
await enterStage(8);
const t8 = await introText();
check('stage 8: voice framing present ("voice protection")', /voice protection/i.test(t8));

// Pana Hint code retained (not deleted) for future/on-demand use.
check('injectPanaHint() still defined (retained, not deleted)',
      await page.evaluate(() => typeof injectPanaHint === 'function'));
check('PANA_HINTS still defined (retained, not deleted)',
      await page.evaluate(() => typeof PANA_HINTS === 'object' && PANA_HINTS !== null));

check('no page JS errors', errs.length === 0);
if (errs.length) console.log('  errors:', errs);

console.log(`\n  ${pass}/${pass + fail} PASS`);
await browser.close();
process.exit(fail ? 1 : 0);
