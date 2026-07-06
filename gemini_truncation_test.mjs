// gemini_truncation_test.mjs — Batch 1 (Stage 7 truncation stabilization)
// Frontend response-integrity: a Worker reply flagged truncated (MAX_TOKENS) must
// carry a bilingual continuation affordance; a normal (STOP / no flag) reply is
// returned verbatim. Drives the REAL callGeminiProviderViaProxy() -> _callGeminiOnce()
// in-page with window.fetch mocked to return the proxy response shape.
// Run with the local test server up:  node test-server.js  (port 3001)
import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
let pass = 0, fail = 0;
const check = (l, c) => { console.log(`  ${c ? '✅' : '❌'} ${l}`); c ? pass++ : fail++; };

await page.goto(BASE + '/');
await page.evaluate(() => { try { localStorage.clear(); localStorage.setItem('tupana_mani_done','true'); localStorage.setItem('tupana_lab_done','true'); } catch(e){} });
await page.goto(BASE + '/');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);

// Call the real proxy wrapper with a mocked proxy response.
async function callWithProxyResponse(proxyJson) {
    return await page.evaluate(async (proxyJson) => {
        const orig = window.fetch;
        window.fetch = async () => new Response(JSON.stringify(proxyJson),
            { status: 200, headers: { 'content-type': 'application/json' } });
        try {
            return await callGeminiProviderViaProxy({ prompt: 'hola coach', stageId: 'stage.revision' });
        } finally {
            window.fetch = orig;
        }
    }, proxyJson);
}

const ES_NOTICE = 'se cortó antes de terminar';
const EN_NOTICE = 'cut off before it finished';

console.log('\n── truncated:true → cutoff affordance appended ──');
{
    const r = await callWithProxyResponse({ text: 'Respuesta parcial de coaching…', truncated: true });
    check('original partial text is preserved', r.includes('Respuesta parcial de coaching…'));
    check('bilingual cutoff notice appended (ES)', r.includes(ES_NOTICE));
    check('bilingual cutoff notice appended (EN)', r.includes(EN_NOTICE));
}

console.log('\n── truncated:false → verbatim (normal STOP path) ──');
{
    const r = await callWithProxyResponse({ text: 'Respuesta completa de coaching.', truncated: false });
    check('returns text verbatim', r === 'Respuesta completa de coaching.');
    check('no cutoff notice', !r.includes(ES_NOTICE) && !r.includes(EN_NOTICE));
}

console.log('\n── no truncated field → backward-compatible (old Worker) ──');
{
    const r = await callWithProxyResponse({ text: 'Reply from an older Worker.' });
    check('returns text verbatim when field absent', r === 'Reply from an older Worker.');
    check('no cutoff notice when field absent', !r.includes(ES_NOTICE) && !r.includes(EN_NOTICE));
}

check('no page/console errors', errs.length === 0);
if (errs.length) console.log('  errors:', errs.slice(0, 3));

await browser.close();
console.log(`\n  ${pass}/${pass + fail} PASS`);
if (fail) process.exit(1);
