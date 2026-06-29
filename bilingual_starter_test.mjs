// bilingual_starter_test.mjs — Stage A.2 / B3 regression coverage
// The "I'm stuck" helper (showStuckMini) inserts a sentence starter into the
// student's draft via useStarter(). Before B3 the starter was English-only, so a
// Spanish-mode student got English seeded into their Spanish draft. This verifies
// language-aware insertion:
//   - English mode inserts the English starter (unchanged behavior)
//   - Spanish mode inserts the Spanish starter and NO English starter text
//   - Both mode inserts the Spanish starter (Spanish-primary convention)
//   - no new tupana_* key (only the existing per-stage writing key may appear)
// Run with the local test server up:  node test-server.js  (port 3001)

import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
let pass = 0, fail = 0;
const check = (l, c) => { console.log(`  ${c ? '✅' : '❌'} ${l}`); c ? pass++ : fail++; };

async function bootAt(stage, lang) {
  await page.goto(BASE);
  await page.evaluate((st) => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('tupana_mani_done', 'true');
    localStorage.setItem('tupana_lab_done', 'true');
    localStorage.setItem('tupana_stage', String(st));
  }, stage);
  await page.reload();
  await page.waitForTimeout(1000);
  await page.evaluate((lg) => setLang(lg), lang);
}

// Render a fresh stuck-mini (prompt index 0), capture the prompt's ES/EN starters
// and the rendered data-starter, then click "Use this starter" and read the draft.
async function runStarter() {
  await page.evaluate(() => {
    if (D.draftArea) { D.draftArea.disabled = false; D.draftArea.value = ''; }
    stuckMiniIdx = {};          // force prompt index 0 for determinism
    showStuckMini();
  });
  await page.waitForSelector('.stuck-mini-primary', { timeout: 3000 });
  const info = await page.evaluate(() => {
    const p = MICRO_PROMPTS[state.stage][0];
    return {
      es: p.starter.es,
      en: p.starter.en,
      dataStarter: document.querySelector('.stuck-mini-primary').getAttribute('data-starter'),
    };
  });
  await page.evaluate(() => document.querySelector('.stuck-mini-primary').click());
  await page.waitForTimeout(250);
  info.inserted = await page.evaluate(() => D.draftArea.value);
  return info;
}

console.log('B3 — bilingual micro-prompt starters');

// ── English mode (unchanged behavior) ──────────────────────────────────
await bootAt(1, 'en');
let keysBefore = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('tupana_')));
let r = await runStarter();
check('EN mode: data-starter is the English starter', r.dataStarter === r.en);
check('EN mode: English starter inserted into draft', r.inserted.includes(r.en));

// ── Spanish mode (the core fix) ────────────────────────────────────────
await bootAt(1, 'es');
r = await runStarter();
check('ES mode: data-starter is the Spanish starter', r.dataStarter === r.es);
check('ES mode: Spanish starter inserted into draft', r.inserted.includes(r.es));
check('ES mode: NO English starter text injected into the Spanish draft',
      !r.inserted.includes(r.en));

// ── Both mode (Spanish-primary convention) ─────────────────────────────
await bootAt(1, 'both');
r = await runStarter();
check('BOTH mode: inserts the Spanish starter (Spanish-primary)', r.inserted.includes(r.es));
check('BOTH mode: does NOT inject English-only starter text', !r.inserted.includes(r.en));

// ── No new tupana_* key (only the existing per-stage writing key may appear) ──
let keysAfter = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('tupana_')));
const newKeys = keysAfter.filter(k => !keysBefore.includes(k));
check('no unexpected new tupana_* key (only tupana_writing_sN may appear)' +
      (newKeys.length ? ` — saw: ${newKeys.join(',')}` : ''),
      newKeys.every(k => /^tupana_writing_s\d+$/.test(k) || k === 'tupana_lang'));

check('no page JS errors', errs.length === 0);
if (errs.length) console.log('  errors:', errs);

console.log(`\n  ${pass}/${pass + fail} PASS`);
await browser.close();
process.exit(fail ? 1 : 0);
