// bilingual_warmth_test.mjs — Stage A.2 polish (H6) regression coverage
// Verifies language-aware coach warmth without erasing intentional translanguaging:
//   - STUCK_AFFIRMATIONS is language-keyed (es/en/both), parallel lengths
//   - pickAffirmation() returns a line in the student's current language
//       es   → Spanish-anchored (no English-only tells), en → English,
//       both → translanguaging café Spanglish (the original voice preserved)
//   - the rendered stuck-mini affirmation matches the active language
//   - HUMOR is language-keyed (es/en parallel arrays); pickHumor(key,lang) and
//     pickHumorPair(key) return language-correct, index-aligned text
//   - café warmth preserved across languages
//   - no new tupana_* key written by surfacing warmth
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
await page.evaluate(() => {
  localStorage.clear(); sessionStorage.clear();
  localStorage.setItem('tupana_mani_done', 'true');
  localStorage.setItem('tupana_lab_done', 'true');
  localStorage.setItem('tupana_stage', '1');
});
await page.reload();
await page.waitForTimeout(1000);

// ── Structure ──
console.log('STUCK_AFFIRMATIONS structure');
const aff = await page.evaluate(() => ({
  isObj: STUCK_AFFIRMATIONS && !Array.isArray(STUCK_AFFIRMATIONS) && typeof STUCK_AFFIRMATIONS === 'object',
  es: STUCK_AFFIRMATIONS.es, en: STUCK_AFFIRMATIONS.en, both: STUCK_AFFIRMATIONS.both
}));
check('STUCK_AFFIRMATIONS is language-keyed object', aff.isObj);
check('es/en/both arrays present and non-empty',
      Array.isArray(aff.es) && Array.isArray(aff.en) && Array.isArray(aff.both) &&
      aff.es.length > 0 && aff.es.length === aff.en.length && aff.en.length === aff.both.length);

// ── pickAffirmation() respects language ──
const picksIn = (lang) => page.evaluate((lg) => {
  state.lang = lg;
  const got = [];
  for (let i = 0; i < 40; i++) got.push(pickAffirmation());
  // Genre copy layer (2026-08-01): affirmations carry {workEs}/{workEn} tokens
  // that pickAffirmation() resolves for the active genre. Compare against the
  // RESOLVED pool — for the default essay this resolves to "ensayo"/"essay".
  return { got, pool: STUCK_AFFIRMATIONS[lg].map(x => applyGenreTokens(x, state.assignmentId)) };
}, lang);
for (const lang of ['es', 'en', 'both']) {
  const { got, pool } = await picksIn(lang);
  check(`pickAffirmation() in '${lang}' mode stays within the ${lang} pool`,
        got.every(g => pool.includes(g)));
}

// ── Spanish-anchored vs English ──
console.log('Spanish-anchored parity (not English-with-Spanish-labels)');
const enTells = /\b(sentence|the|panic|smaller|brave|dramatic)\b/i;
check("es affirmations carry no English-only tells",
      aff.es.every(s => !enTells.test(s)));
check('es affirmations are Spanish-anchored (accents/Spanish words present)',
      aff.es.every(s => /[áéíóúñ¿¡]|oración|página|café|pánico|ensayo|\{workEs\}/i.test(s)));
check('en affirmations are English', aff.en.some(s => /sentence/i.test(s)));
check('both affirmations preserve translanguaging café warmth',
      aff.both.some(s => /café|coffee/i.test(s)) && aff.both.some(s => /[áéíóúñ]/.test(s) && /[a-z]/i.test(s)));

// ── Rendered stuck-mini matches active language ──
console.log('Rendered stuck-mini affirmation matches active language');
async function renderedAff(lang) {
  return page.evaluate((lg) => {
    setLang(lg);
    if (D.draftArea) { D.draftArea.disabled = false; D.draftArea.value = ''; }
    stuckMiniIdx = {};
    showStuckMini();
    const el = document.querySelector('.stuck-mini .stuck-mini-affirmation');
    return el ? el.textContent.trim() : '';
  }, lang);
}
const resolved = await page.evaluate(() => ({
  es: STUCK_AFFIRMATIONS.es.map(x => applyGenreTokens(x, state.assignmentId)),
  en: STUCK_AFFIRMATIONS.en.map(x => applyGenreTokens(x, state.assignmentId))
}));
const rEs = await renderedAff('es');
check('es mode: rendered affirmation ∈ STUCK_AFFIRMATIONS.es (genre-resolved)', resolved.es.includes(rEs));
const rEn = await renderedAff('en');
check('en mode: rendered affirmation ∈ STUCK_AFFIRMATIONS.en (genre-resolved)', resolved.en.includes(rEn));
check('no unresolved work-noun token reaches the student', !/\{work(Es|En)\}/.test(rEs + rEn));

// ── HUMOR ──
console.log('HUMOR language-aware structure + pickers');
const humor = await page.evaluate(() => {
  const keys = Object.keys(HUMOR);
  const shaped = keys.every(k => Array.isArray(HUMOR[k].es) && Array.isArray(HUMOR[k].en) &&
                                 HUMOR[k].es.length === HUMOR[k].en.length && HUMOR[k].es.length > 0);
  const esPick = []; const enPick = [];
  for (let i = 0; i < 20; i++) { esPick.push(pickHumor('welcome_multi', 'es')); enPick.push(pickHumor('welcome_multi', 'en')); }
  const pair = pickHumorPair('overwhelmed');
  const pairAligned = HUMOR.overwhelmed.es.includes(pair.es) && HUMOR.overwhelmed.en.includes(pair.en) &&
                      HUMOR.overwhelmed.es.indexOf(pair.es) === HUMOR.overwhelmed.en.indexOf(pair.en);
  return { shaped, esOk: esPick.every(x => HUMOR.welcome_multi.es.includes(x)),
           enOk: enPick.every(x => HUMOR.welcome_multi.en.includes(x)), pairAligned,
           esCafe: HUMOR.welcome_multi.es.some(s => /café/i.test(s)) || HUMOR.overwhelmed.es.some(s => /café/i.test(s)) };
});
check('HUMOR keys all carry parallel es/en arrays', humor.shaped);
check('pickHumor(key,"es") stays in es pool', humor.esOk);
check('pickHumor(key,"en") stays in en pool', humor.enOk);
check('pickHumorPair() returns index-aligned es/en', humor.pairAligned);
check('café warmth preserved in Spanish humor', humor.esCafe);

// ── No new storage keys ──
const keys = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('tupana_')).sort());
check('no unexpected new tupana_* keys from warmth surfacing',
      !keys.includes('tupana_affirmation') && !keys.includes('tupana_humor'));
console.log('  tupana_ keys present:', keys.join(', '));

check('no page JS errors', errs.length === 0);
if (errs.length) console.log('  errors:', errs);

console.log(`\n  ${pass}/${pass + fail} PASS`);
await browser.close();
process.exit(fail ? 1 : 0);
