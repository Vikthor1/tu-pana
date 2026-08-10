// W1 — honest client failure semantics on the live provider adapter.
//
// WHAT FAILED, AND WHERE THIS SUITE PINS IT
// The Gemini adapter derived its failure category from the HTTP status alone
// and discarded the Worker's own JSON body, which already states a truthful
// `category` and, for upstream failures, the validated Gemini status enum as
// `upstreamStatus`. Two writer-visible consequences followed:
//
//   (a) A tripped spend/usage cap reaches the client as HTTP 429 carrying
//       `upstreamStatus: 'RESOURCE_EXHAUSTED'`. Status-only derivation showed
//       the transient `rate_limited` copy — "Wait a minute and try again" —
//       which is false: a cap trip is not transient, and the retry cannot
//       succeed.
//   (b) The Worker reports an upstream auth failure as `category: 'auth_error'`
//       carried on HTTP 503. Status-only derivation produced
//       `service_unavailable`, which is RETRYABLE — so `auth_error` was
//       unreachable on this path and two useless retries were spent first.
//
// This suite exercises the REAL production adapter (`createGeminiProvider`)
// against a stubbed `window.fetch`, the same zero-live-call technique
// studio_ask_question_test.mjs uses for the wire contract. No request ever
// leaves the page; the external-request assertion at the end proves it.
//
// DELIBERATELY UNCHANGED, AND ASSERTED HERE AS UNCHANGED:
//   - the `rate_limited` copy, byte for byte, in both languages;
//   - `rate_limited` remaining retryable, for genuinely transient limits;
//   - the status-derived fallback, which still governs whenever the body is
//     absent, unparseable, or declares a category the client does not know.
//
// NOT IN SCOPE (owned by the separately authorized Worker window): the Worker's
// missing-secret guard still returns HTTP 503 with no `category`, so it still
// degrades to `service_unavailable` here. That is asserted as the CURRENT
// truthful behaviour, not endorsed as the final one.
//
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const BASE = `${ORIGIN}/studio.html`;
const KEY = 'tupana-studio:v1';
const TOUR_KEY = 'tupana-studio:tour:v1';

// The founder-approved wording (VC-OS decisions.log, Decision W, pre-gate
// answer 2), reproduced byte for byte. Any future edit to this text must come
// from that entry, never from this file.
const QUOTA_ES = 'El Coach IA alcanzó su límite de uso por ahora, así que no está disponible. Tu trabajo está guardado. Puedes continuar todo el proceso de escritura con la Guía sin IA.';
const QUOTA_EN = 'The Live AI coach has reached its usage limit for now, so it isn\'t available. Your work is saved. You can continue the entire writing process with Built-in, no AI.';
// The retained transient copy, byte for byte as it shipped.
const RATE_ES = 'El coach está ocupado en este momento. Espera un minuto e inténtalo de nuevo — tu trabajo está guardado.';
const RATE_EN = 'The coach is busy right now. Wait a minute and try again — your work is saved.';

const browser = await chromium.launch({ headless: true });
let passed = 0;
let failed = 0;
const check = (label, condition, detail = '') => {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
    if (ok) passed++; else failed++;
};

const external = [];
const errors = [];
let page;
async function fresh(query = '') {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(ORIGIN)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(BASE);
    await page.evaluate(([k, t]) => {
        localStorage.removeItem(k);
        localStorage.setItem(t, JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
        localStorage.setItem('tupana_draft', 'R0 PROVIDER ERROR SENTINEL');
    }, [KEY, TOUR_KEY]);
    await page.goto(`${BASE}${query}`);
}

// Drive the real adapter once against a scripted HTTP failure and report what
// the writer would have been told. `body` === null means "no parseable body".
async function failWith({ status, body, lang = 'en' }) {
    return page.evaluate(async ([status, bodyJson, lang]) => {
        window.__fetchCalls = 0;
        window.fetch = async () => {
            window.__fetchCalls += 1;
            return {
                ok: false,
                status,
                json: async () => {
                    if (bodyJson === null) throw new SyntaxError('Unexpected token < in JSON at position 0');
                    return JSON.parse(bodyJson);
                },
            };
        };
        const provider = window.StudioProvider.createGeminiProvider({ proxyUrl: 'https://worker.invalid/proxy' });
        try {
            await provider.call({ requestKind: 'passage_analysis', prompt: 'synthetic', stageId: null, lang });
            return { threw: false, calls: window.__fetchCalls };
        } catch (error) {
            return {
                threw: true,
                category: error?.category ?? null,
                message: error?.message ?? null,
                retryable: error?.retryable ?? null,
                calls: window.__fetchCalls,
            };
        }
    }, [status, body === null ? null : JSON.stringify(body), lang]);
}

await fresh('?assignment=college-personal-statement&provider=gemini');

// ── 1. The body's declared category is preferred over the HTTP status ────────
console.log('\n1. A category declared in the body is believed');
const authViaBody = await failWith({ status: 503, body: { error: true, category: 'auth_error', status: 503, message: 'Coach configuration error.', upstreamStatus: null } });
check('the Worker\'s auth_error on HTTP 503 reaches the writer as auth_error',
    authViaBody.category === 'auth_error', String(authViaBody.category));
check('auth_error is non-retryable, so no second paid attempt is made',
    authViaBody.retryable === false && authViaBody.calls === 1, `retryable=${authViaBody.retryable} calls=${authViaBody.calls}`);
check('the writer is told the service is not configured and that they may continue without AI',
    /not configured/.test(authViaBody.message) && /continue the entire writing process without AI/.test(authViaBody.message),
    authViaBody.message);

const originViaBody = await failWith({ status: 403, body: { error: true, category: 'origin_forbidden', message: 'Origin not allowed' } });
check('the Worker\'s origin_forbidden on HTTP 403 stays origin_forbidden',
    originViaBody.category === 'origin_forbidden' && originViaBody.retryable === false, String(originViaBody.category));

// ── 2. upstreamStatus distinguishes a cap trip from a rate limit ─────────────
console.log('\n2. RESOURCE_EXHAUSTED is a cap trip, not a transient rate limit');
const capEn = await failWith({ status: 429, body: { error: true, category: 'rate_limited', status: 429, message: 'Too many requests. Wait briefly and try again.', upstreamStatus: 'RESOURCE_EXHAUSTED' } });
check('a 429 carrying RESOURCE_EXHAUSTED becomes quota_exhausted, not rate_limited',
    capEn.category === 'quota_exhausted', String(capEn.category));
check('quota_exhausted is NOT retryable — the adapter attempts exactly once',
    capEn.retryable === false && capEn.calls === 1, `retryable=${capEn.retryable} calls=${capEn.calls}`);
check('the English cap-trip copy is the founder-approved text, byte for byte',
    capEn.message === QUOTA_EN, JSON.stringify(capEn.message));
check('the cap-trip copy contains no retry invitation',
    !/try again|again later|inténtalo|intenta/i.test(capEn.message), capEn.message);
check('the cap-trip copy names the writer\'s real fallback control (Built-in, no AI)',
    /Built-in, no AI/.test(capEn.message) && /Your work is saved/.test(capEn.message), capEn.message);

const capEs = await failWith({ status: 429, body: { error: true, category: 'rate_limited', upstreamStatus: 'RESOURCE_EXHAUSTED' }, lang: 'es' });
check('the Spanish cap-trip copy is the founder-approved text, byte for byte',
    capEs.message === QUOTA_ES, JSON.stringify(capEs.message));
check('the Spanish cap-trip copy names Coach IA and Guía sin IA',
    /Coach IA/.test(capEs.message) && /Guía sin IA/.test(capEs.message), capEs.message);

// The promotion is deliberately narrow: it lifts rate_limited only.
const otherUpstream = await failWith({ status: 400, body: { error: true, category: 'bad_request', upstreamStatus: 'RESOURCE_EXHAUSTED' } });
check('RESOURCE_EXHAUSTED does not reinterpret any category other than rate_limited',
    otherUpstream.category === 'bad_request', String(otherUpstream.category));

// ── 3. HTTP 401 maps to auth_error; 403 stays origin_forbidden ──────────────
console.log('\n3. Status-derived mapping: 401 and 403');
const bare401 = await failWith({ status: 401, body: null });
check('HTTP 401 with no usable body maps to auth_error',
    bare401.category === 'auth_error', String(bare401.category));
check('and it is non-retryable', bare401.retryable === false && bare401.calls === 1, `calls=${bare401.calls}`);

const bare403 = await failWith({ status: 403, body: null });
check('HTTP 403 with no usable body stays origin_forbidden',
    bare403.category === 'origin_forbidden', String(bare403.category));
check('the origin_forbidden copy still tells the writer not to retry',
    /Do not retry/.test(bare403.message), bare403.message);

// ── 4. rate_limited is unchanged for genuinely transient limits ─────────────
console.log('\n4. Transient rate limiting is untouched');
page.setDefaultTimeout(30000);
const transient = await failWith({ status: 429, body: { error: true, category: 'rate_limited', message: 'Too many requests. Wait briefly and try again.', upstreamStatus: null } });
check('a 429 without RESOURCE_EXHAUSTED is still rate_limited',
    transient.category === 'rate_limited', String(transient.category));
check('rate_limited is still retryable — the adapter still makes three attempts',
    transient.retryable === true && transient.calls === 3, `retryable=${transient.retryable} calls=${transient.calls}`);
check('the English rate_limited copy is byte-identical to the shipped text',
    transient.message === RATE_EN, JSON.stringify(transient.message));
const transientEs = await failWith({ status: 429, body: null, lang: 'es' });
check('the Spanish rate_limited copy is byte-identical to the shipped text',
    transientEs.message === RATE_ES, JSON.stringify(transientEs.message));
page.setDefaultTimeout(9000);

// ── 5. Malformed, absent, and unrecognised bodies fall back safely ──────────
console.log('\n5. A malformed error body degrades to the status-derived category');
const malformed = await failWith({ status: 400, body: null });
check('an unparseable body falls back to the HTTP status (400 → bad_request)',
    malformed.category === 'bad_request', String(malformed.category));

const emptyBody = await failWith({ status: 502, body: {} });
check('a body with no category falls back to the HTTP status (502 → upstream_error)',
    emptyBody.category === 'upstream_error', String(emptyBody.category));

const unknownCategory = await failWith({ status: 400, body: { error: true, category: 'totally_made_up' } });
check('a category the client does not know is NOT trusted — the status governs',
    unknownCategory.category === 'bad_request', String(unknownCategory.category));

const nonStringCategory = await failWith({ status: 400, body: { error: true, category: { nested: 'object' } } });
check('a non-string category is ignored rather than thrown on',
    nonStringCategory.category === 'bad_request', String(nonStringCategory.category));

const nullBody = await failWith({ status: 503, body: null });
check('the missing-secret shape (HTTP 503, no category) still reads as service_unavailable',
    nullBody.category === 'service_unavailable', String(nullBody.category));

// ── 6. The category table and retry policy ──────────────────────────────────
console.log('\n6. Copy table and retry policy');
const table = await page.evaluate(([qEn, qEs]) => ({
    quotaEn: window.StudioProvider.errorMessage('quota_exhausted', 'en') === qEn,
    quotaEs: window.StudioProvider.errorMessage('quota_exhausted', 'es') === qEs,
    unknownFallsBack: window.StudioProvider.errorMessage('no_such_category', 'en')
        === window.StudioProvider.errorMessage('upstream_error', 'en'),
}), [QUOTA_EN, QUOTA_ES]);
check('errorMessage() serves the approved English cap-trip text', table.quotaEn);
check('errorMessage() serves the approved Spanish cap-trip text', table.quotaEs);
check('an unknown category still falls back to upstream_error copy', table.unknownFallsBack);

// ── 7. End to end through the real UI, with the deterministic mock ──────────
console.log('\n7. The cap trip reaches the writer calmly, and saves nothing');
await fresh('?assignment=college-personal-statement&mockfail=quota_exhausted');
await page.locator('#draftEditor').fill('A synthetic draft written before a cap trip is injected for this test.');
await page.waitForTimeout(280);
const beforeTrip = await page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
await page.locator('[data-action="focused-review"]').click();
await page.waitForTimeout(250);
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.locator('.provider-error').waitFor();
const tripText = await page.locator('.provider-error').textContent();
check('the writer sees the approved cap-trip sentence', tripText.includes(QUOTA_EN), tripText);
check('the writer is not invited to try again', !/try again/i.test(tripText), tripText);
const afterTrip = await page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
check('a capped request saves no review and no snapshot',
    afterTrip.reviews.length === 0 && afterTrip.versions.length === (beforeTrip?.versions?.length || 0));
check('the failure is recorded as a metadata-only provider event',
    afterTrip.providerEvents?.length === 1 && afterTrip.providerEvents[0].category === 'quota_exhausted',
    JSON.stringify(afterTrip.providerEvents));
check('the draft is byte-identical after the failure',
    afterTrip.draft === 'A synthetic draft written before a cap trip is injected for this test.');
check('the send control recovers, so the writer keeps agency',
    await page.locator('[data-action="submit-mock"]').isEnabled());

// ── 8. Isolation ────────────────────────────────────────────────────────────
console.log('\n8. Isolation');
check('R0 sentinel untouched', await page.evaluate(() => localStorage.getItem('tupana_draft')) === 'R0 PROVIDER ERROR SENTINEL');
check('zero external requests — every failure was scripted locally', external.length === 0, external.join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
