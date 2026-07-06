// gemini_fallback_test.mjs — Regression tests for P2 Gemini→Offline fallback button
// Verifies:
//   - when the Gemini proxy is unreachable, the coach error bubble contains a
//     bilingual "Cambiar a modo Offline · Switch to Offline Mode" button
//   - clicking it switches to Offline mode in one tap (status, toggle buttons,
//     localStorage tupana_coach_mode) and shows a confirmation strip
//   - the button disables after use; exactly one button renders per error
//   - restored chatlogs (reload) do NOT re-render the button (live errors only)
//   - no uncaught page errors anywhere in the flow
// Manual QA checklist at the bottom of this file.

import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const results = [];
let passed = 0, failed = 0;

function check(label, condition) {
    const ok = !!condition;
    results.push({ label, ok });
    if (ok) passed++; else failed++;
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e)));

// Block the Gemini proxy — simulates Cloudflare Worker outage.
await page.route('**tupana-gemini-proxy**', route => route.abort());

// Onboarded student in Gemini mode.
await page.goto(BASE);
await page.evaluate(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('tupana_mani_done', 'true');
    localStorage.setItem('tupana_lab_done', 'true');
    localStorage.setItem('tupana_stage', '1');
    localStorage.setItem('tupana_coach_mode', 'gemini');
});
await page.reload();
await page.waitForTimeout(800);

console.log('Setup — Gemini mode active, proxy blocked');
check('status shows Coach IA · Live AI before failure',   // IA Sprint Batch 2 wording
      (await page.locator('#chatStatus').innerText()).includes('Coach IA'));

// Send a message → proxy fails after retries → error bubble + fallback button.
console.log('Failure path — error bubble renders fallback button');
await page.fill('#chatInput', 'Hola coach, ¿me ayudas con mi anécdota?');
await page.click('#sendBtn');
await page.waitForSelector('.offline-fallback-btn', { timeout: 25000 });

check('fallback button rendered in coach error bubble',
      await page.locator('.msg.bot .msg-bubble .offline-fallback-btn').count() === 1);
check('exactly one fallback button on the page',
      await page.locator('.offline-fallback-btn').count() === 1);
check('button is bilingual (ES + EN spans)',
      await page.locator('.offline-fallback-btn .show-es').count() === 1 &&
      await page.locator('.offline-fallback-btn .show-en').count() === 1);
check('error bubble text present (Gemini unavailable message)',
      (await page.locator('.msg.bot .msg-bubble').last().innerText()).length > 0);

// One-tap recovery.
console.log('Recovery — one tap to Offline mode');
const stripsBefore = await page.locator('.welcome-strip').count();
await page.click('.offline-fallback-btn');
await page.waitForTimeout(400);

check('localStorage tupana_coach_mode switched to offline',
      await page.evaluate(() => localStorage.getItem('tupana_coach_mode')) === 'offline');
check('status shows Guía sin IA · Built-in, no AI after click',   // IA Sprint Batch 2 wording
      (await page.locator('#chatStatus').innerText()).includes('Guía sin IA'));
check('offline coach-mode toggle is active/aria-pressed',
      await page.locator('.coach-mode-btn[data-mode="offline"]').getAttribute('aria-pressed') === 'true');
check('confirmation strip appears (Guía sin IA activada — Localization QA wording)',
      await page.locator('.welcome-strip').count() === stripsBefore + 1 &&
      (await page.locator('.welcome-strip').last().innerText()).includes('Guía sin IA activada'));
check('button disabled after use',
      await page.locator('.offline-fallback-btn').isDisabled());
check('stuck button enabled in offline mode',
      !(await page.locator('#stuckBtn').isDisabled()));

// Restore path: reload — error text restores from chatlog, button must NOT.
console.log('Restore path — button is live-error-only');
await page.reload();
await page.waitForTimeout(800);
check('restored chatlog does not re-render fallback button',
      await page.locator('.offline-fallback-btn').count() === 0);
check('restored chatlog still shows the error message text',
      (await page.locator('#chatMessages').innerText()).includes('no está disponible') ||
      (await page.locator('#chatMessages').innerText()).includes('temporarily unavailable'));

check('no uncaught page errors in entire flow', pageErrors.length === 0);
if (pageErrors.length) console.log('    pageerrors:', pageErrors.join(' | '));

await browser.close();

console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
process.exit(failed ? 1 : 0);

// ── Manual QA checklist ──────────────────────────────────────────────────
// [ ] With WiFi off (real device), send a Gemini message → error + button appear
// [ ] Tap button → status pill shows ● Offline, Offline toggle highlights,
//     confirmation strip explains "Estoy atascado" guidance path
// [ ] Help panel → "El coach no responde" section mentions the fallback button
// [ ] iPhone Safari: button is tappable (36px target), visible in dark + light themes
