// C1-core — context-safe bilingual rendering.
//
// The audit's A1 finding: in `Español + English` mode, uiText() returns one
// flat "es · en" string with no language attribution, and documentElement.lang
// is 'es', so assistive technology pronounces the English half as Spanish.
// C1-core does NOT fix that by changing uiText(): a blind change would emit
// literal markup into aria-labels, titles, placeholders, live regions,
// comparisons, and persisted records. It adds a separate markup-returning
// primitive and converts only confirmed markup sinks — A3's disclosure first.
//
// This suite is the regression boundary. It proves, in all three language
// modes, that markup appears where it was deliberately introduced and NOWHERE
// else — and that nothing persisted changed shape.
//
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const KEY = 'tupana-studio:v1';
const browser = await chromium.launch({ headless: true });
let passed = 0;
let failed = 0;
const check = (label, condition, detail = '') => {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
    if (ok) passed++; else failed++;
};

const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const external = [];
const errors = [];
page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
page.on('pageerror', error => errors.push(String(error)));

// `provider=gemini` selects the LIVE COPY only. This suite never submits, so
// no request is ever issued — the external-request assertion at the end proves
// it. Mock copy is exercised separately because A3 must distinguish them.
async function fresh(lang, provider = 'gemini') {
    await page.goto(`${ORIGIN}/studio.html`);
    await page.evaluate(key => {
        localStorage.removeItem(key);
        localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
        localStorage.setItem('tupana_draft', 'R0 BILINGUAL SENTINEL');
    }, KEY);
    await page.goto(`${ORIGIN}/studio.html?assignment=college-personal-statement&provider=${provider}`);
    await page.locator('.prototype-actions [data-action="language"]').selectOption(lang);
    await page.waitForTimeout(150);
}

// Type a draft and open the coach consent dialog, where A3 now renders.
async function openConsent() {
    await page.locator('#draftEditor').fill(
        'My grandmother sold pasteles on the corner of Southern Boulevard for eleven years. I learned arithmetic from her change tin before I learned it in school.');
    await page.waitForTimeout(300);
    await page.locator('[data-action="focused-review"]').click();
    await page.waitForTimeout(300);
}

// Every plain-text sink in the live DOM. If the C1 primitive ever leaks into
// one of these, the student sees literal angle brackets or the screen reader
// announces markup.
const collectTextSinks = () => {
    const out = { aria: [], title: [], placeholder: [], live: [], value: [] };
    document.querySelectorAll('[aria-label]').forEach(el => out.aria.push(el.getAttribute('aria-label')));
    document.querySelectorAll('[title]').forEach(el => out.title.push(el.getAttribute('title')));
    document.querySelectorAll('[placeholder]').forEach(el => out.placeholder.push(el.getAttribute('placeholder')));
    document.querySelectorAll('[aria-live], [role="status"], [role="alert"]').forEach(el => out.live.push(el.textContent));
    document.querySelectorAll('input, textarea, option').forEach(el => out.value.push(el.value));
    return out;
};

const MARKUP = /<\s*span|<\/\s*span|lang\s*=\s*"/i;
const ESCAPED = /&lt;\s*span|&amp;lt;/i;

console.log('\n1. Bilingual mode — language spans reach the disclosure and nothing else');
await fresh('both');
await openConsent();

const consentHtml = await page.locator('.consent-box').first().innerHTML();
check('bilingual consent line carries an explicit Spanish span', /<span lang="es">/.test(consentHtml));
check('bilingual consent line carries an explicit English span', /<span lang="en">/.test(consentHtml));
check('the separator is hidden from assistive technology', /aria-hidden="true"/.test(consentHtml));
const consentText = await page.locator('.consent-box').first().textContent();
check('the rendered consent text shows no literal markup', !/[<>]/.test(consentText), consentText.slice(0, 90));
check('bilingual order stays Spanish-primary', consentText.indexOf('El texto que se muestra') < consentText.indexOf('The writing shown above'));

const sinks = await page.evaluate(collectTextSinks);
for (const [name, values] of Object.entries(sinks)) {
    check(`no markup leaks into any ${name} sink (${values.length} inspected)`,
        values.every(v => !MARKUP.test(String(v ?? ''))),
        (values.find(v => MARKUP.test(String(v ?? ''))) || '').slice(0, 80));
    check(`no escaped markup leaks into any ${name} sink`,
        values.every(v => !ESCAPED.test(String(v ?? ''))));
}

console.log('\n2. Persistence is untouched — markup never reaches a stored record');
const stored = await page.evaluate(key => localStorage.getItem(key), KEY);
check('the persisted record contains no span markup', !/<span|lang="/.test(stored || ''));
check('the persisted record still parses as the v1 schema', await page.evaluate(key => {
    const parsed = JSON.parse(localStorage.getItem(key) || '{}');
    return parsed.schema === 1 && parsed.concept === 'integrated';
}, KEY));
check('the R0 sentinel outside the Studio namespace is untouched',
    await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 BILINGUAL SENTINEL');

console.log('\n3. English-only mode is unchanged in meaning and behavior');
await fresh('en');
await openConsent();
const enHtml = await page.locator('.consent-box').first().innerHTML();
const enText = await page.locator('.consent-box').first().textContent();
check('English mode emits no language spans at all', !/<span lang=/.test(enHtml));
check('English mode shows the English disclosure', /The writing shown above is sent only because you chose to send it/.test(enText));
check('English mode shows no Spanish', !/El texto que se muestra/.test(enText));
check('English mode renders no literal markup', !/[<>]/.test(enText));

console.log('\n4. Spanish-only mode is unchanged in meaning and behavior');
await fresh('es');
await openConsent();
const esHtml = await page.locator('.consent-box').first().innerHTML();
const esText = await page.locator('.consent-box').first().textContent();
check('Spanish mode emits no language spans at all', !/<span lang=/.test(esHtml));
check('Spanish mode shows the Spanish disclosure', /El texto que se muestra arriba se envía únicamente/.test(esText));
check('Spanish mode shows no English', !/The writing shown above/.test(esText));
check('Spanish mode renders no literal markup', !/[<>]/.test(esText));

console.log('\n5. Mock mode carries the same context-safe treatment');
await fresh('both', 'mock');
await openConsent();
const mockHtml = await page.locator('.consent-box').first().innerHTML();
const mockText = await page.locator('.consent-box').first().textContent();
check('mock bilingual consent line is also correctly attributed', /<span lang="es">/.test(mockHtml) && /<span lang="en">/.test(mockHtml));
check('mock copy is truthfully different from live copy', /not sent for AI processing/.test(mockText) && !/travels from your browser/.test(mockText));
check('mock renders no literal markup', !/[<>]/.test(mockText));
const mockSinks = await page.evaluate(collectTextSinks);
check('no markup leaks into any text sink in mock mode',
    Object.values(mockSinks).flat().every(v => !MARKUP.test(String(v ?? ''))));

console.log('\n6. uiText() remains the plain-text default — the primitive is additive');
// The escaped-HTML majority of call sites must still be escaped, not converted.
// The genre chip and orientation bar are uiText consumers that were NOT part of
// A3 and must therefore still render as flat text in bilingual mode.
await fresh('both');
const orientation = await page.locator('.orientation-bar').first().innerHTML();
check('an unconverted uiText surface still renders flat (no spans)', !/<span lang=/.test(orientation));
const flat = await page.evaluate(() => {
    const el = document.querySelector('.orientation-bar');
    return el ? el.textContent : '';
});
check('the unconverted surface shows no literal markup either', !/[<>]/.test(flat));

console.log("\n7. Isolation");
check('no external requests', external.length === 0, external.join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
