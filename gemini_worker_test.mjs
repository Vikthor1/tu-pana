// gemini_worker_test.mjs — Batch 1 (Stage 7 truncation stabilization)
// Verifies the Cloudflare Worker's per-stage generation config and the
// MAX_TOKENS response-integrity flag, by driving worker.fetch() with a mocked
// upstream Gemini call. No network, no key.
//
// Covered:
//   - Stage 7 (stageId 'stage.revision' AND numeric 7) on gemini-2.5-flash:
//       generationConfig = { maxOutputTokens: 1536, thinkingConfig:{thinkingBudget:0} }
//   - Stage 10 ('stage.reflection'/10) on flash: 2048 + thinkingBudget:0 (Batch 4)
//   - Cross-genre passage analysis: Flash 1536 + thinkingBudget:0 at any stage
//   - Guided full-draft review: Flash 3072 + thinkingBudget:0 at any stage
//   - Flash-Lite + other flash stages: UNCHANGED (400 / 600, no thinkingConfig)
//   - upstream finishReason MAX_TOKENS  -> response { truncated: true }
//   - upstream finishReason STOP        -> response { truncated: false }
// Run: node gemini_worker_test.mjs
import worker from './server/gemini-worker/src/index.js';

let pass = 0, fail = 0;
const check = (l, c) => { console.log(`  ${c ? '✅' : '❌'} ${l}`); c ? pass++ : fail++; };

const ENV = { GEMINI_API_KEY: 'test-key-not-real' };
const ORIGIN = 'https://vikthor1.github.io';
let captured = null;

function mockUpstream({ finishReason = 'STOP', text = 'coach reply', status = 200 } = {}) {
    globalThis.fetch = async (_url, opts) => {
        captured = JSON.parse(opts.body);
        return new Response(JSON.stringify({
            candidates: [{ content: { parts: [{ text }] }, finishReason }],
            usageMetadata: {
                promptTokenCount: 2100,
                candidatesTokenCount: 180,
                thoughtsTokenCount: 0,
                cachedContentTokenCount: 120,
                totalTokenCount: 2280,
                promptText: 'must never be forwarded'
            },
        }), { status, headers: { 'content-type': 'application/json' } });
    };
}

async function callWorker(payload) {
    captured = null;
    const req = new Request('https://vikthor1.github.io/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
        body: JSON.stringify(payload),
    });
    const res = await worker.fetch(req, ENV);
    let body = null; try { body = await res.json(); } catch (_) {}
    return { status: res.status, body, gen: captured?.generationConfig };
}

const origFetch = globalThis.fetch;
try {
    // ── Stage 7 generation config ──
    console.log('\n── Stage 7 config ──');
    mockUpstream({ finishReason: 'STOP' });
    let r = await callWorker({ prompt: 'revise my draft', model: 'gemini-2.5-flash', stageId: 'stage.revision' });
    check('Stage 7 (stage.revision): maxOutputTokens = 1536', r.gen?.maxOutputTokens === 1536);
    check('Stage 7 (stage.revision): thinkingBudget = 0', r.gen?.thinkingConfig?.thinkingBudget === 0);

    mockUpstream({ finishReason: 'STOP' });
    r = await callWorker({ prompt: 'x', model: 'gemini-2.5-flash', stageId: 7 });
    check('Stage 7 (numeric 7): maxOutputTokens = 1536 + thinkingBudget 0',
          r.gen?.maxOutputTokens === 1536 && r.gen?.thinkingConfig?.thinkingBudget === 0);

    // ── Stage 10 generation config (Batch 4: capstone JSON was starved at 600) ──
    console.log('\n── Stage 10 config ──');
    mockUpstream({ finishReason: 'STOP' });
    r = await callWorker({ prompt: 'x', model: 'gemini-2.5-flash', stageId: 'stage.reflection' });
    check('Stage 10 (stage.reflection): maxOutputTokens = 2048', r.gen?.maxOutputTokens === 2048);
    check('Stage 10 (stage.reflection): thinkingBudget = 0', r.gen?.thinkingConfig?.thinkingBudget === 0);

    mockUpstream({ finishReason: 'STOP' });
    r = await callWorker({ prompt: 'x', model: 'gemini-2.5-flash', stageId: 10 });
    check('Stage 10 (numeric 10): maxOutputTokens = 2048 + thinkingBudget 0',
          r.gen?.maxOutputTokens === 2048 && r.gen?.thinkingConfig?.thinkingBudget === 0);

    // ── Whole-passage analysis at an ordinary early stage ──
    console.log('\n── Passage-analysis config ──');
    mockUpstream({ finishReason: 'STOP' });
    r = await callWorker({
        prompt: 'multi-sentence passage',
        model: 'gemini-2.5-flash',
        stageId: 'stage.frame_requirements',
        requestKind: 'passage_analysis'
    });
    check('Passage analysis: maxOutputTokens = 1536',
          r.gen?.maxOutputTokens === 1536);
    check('Passage analysis: thinkingBudget = 0',
          r.gen?.thinkingConfig?.thinkingBudget === 0);

    // ── Whole-draft review at an ordinary stage ──
    console.log('\n── Full-draft review config ──');
    mockUpstream({ finishReason: 'STOP' });
    r = await callWorker({
        prompt: 'a complete student draft',
        model: 'gemini-2.5-flash',
        stageId: 'stage.checklist',
        requestKind: 'full_draft_review'
    });
    check('Full-draft review: maxOutputTokens = 3072',
          r.gen?.maxOutputTokens === 3072);
    check('Full-draft review: thinkingBudget = 0',
          r.gen?.thinkingConfig?.thinkingBudget === 0);
    check('Worker returns privacy-safe aggregate token counts',
          r.body?.usage?.inputTokens === 2100 &&
          r.body?.usage?.outputTokens === 180 &&
          r.body?.usage?.cachedTokens === 120 &&
          !('promptText' in (r.body?.usage || {})));

    // ── Student-initiated Stage 10 coach perspective ──
    console.log('\n── Capstone-review config ──');
    mockUpstream({ finishReason: 'STOP' });
    r = await callWorker({
        prompt: 'a complete draft plus process evidence',
        model: 'gemini-2.5-flash',
        stageId: 'stage.reflection',
        requestKind: 'capstone_review'
    });
    check('Capstone review: maxOutputTokens = 2048',
          r.gen?.maxOutputTokens === 2048);
    check('Capstone review: thinkingBudget = 0',
          r.gen?.thinkingConfig?.thinkingBudget === 0);

    // ── Review Council (C1): reviewer + synthesis strict-JSON paths ──
    console.log('\n── Review Council config ──');
    mockUpstream({ finishReason: 'STOP' });
    r = await callWorker({
        prompt: 'one specialist reviewer over a complete draft',
        model: 'gemini-2.5-flash',
        stageId: 'stage.revision',
        requestKind: 'council_reviewer'
    });
    check('Council reviewer: maxOutputTokens = 1536',
          r.gen?.maxOutputTokens === 1536);
    check('Council reviewer: thinkingBudget = 0',
          r.gen?.thinkingConfig?.thinkingBudget === 0);

    mockUpstream({ finishReason: 'STOP' });
    r = await callWorker({
        prompt: 'synthesize validated findings into one report',
        model: 'gemini-2.5-flash',
        stageId: 'stage.checklist',
        requestKind: 'council_synthesis'
    });
    check('Council synthesis: maxOutputTokens = 2048',
          r.gen?.maxOutputTokens === 2048);
    check('Council synthesis: thinkingBudget = 0',
          r.gen?.thinkingConfig?.thinkingBudget === 0);

    mockUpstream({ finishReason: 'STOP' });
    r = await callWorker({
        prompt: 'x',
        model: 'gemini-2.5-flash-lite',
        stageId: 2,
        requestKind: 'council_reviewer'
    });
    check('Council kind on Flash-Lite: default config unchanged (400, no thinkingConfig)',
          r.gen?.maxOutputTokens === 400 && !('thinkingConfig' in (r.gen || {})));

    mockUpstream({ finishReason: 'STOP' });
    r = await callWorker({
        prompt: 'ordinary early-stage message',
        model: 'gemini-2.5-flash',
        stageId: 'stage.frame_requirements',
        requestKind: 'unrecognized'
    });
    check('Unknown request kind cannot change generation config',
          r.gen?.maxOutputTokens === 600 && r.gen?.thinkingConfig === undefined);

    // ── Flash-Lite + all other stages UNCHANGED ──
    console.log('\n── Flash-Lite / other stages unchanged ──');
    mockUpstream({ finishReason: 'STOP' });
    r = await callWorker({ prompt: 'x', model: 'gemini-2.5-flash-lite', stageId: 'stage.anecdote' });
    check('Flash-Lite other stage: still 400', r.gen?.maxOutputTokens === 400);
    check('Flash-Lite: NO thinkingConfig (unchanged)', r.gen?.thinkingConfig === undefined);

    mockUpstream({ finishReason: 'STOP' });
    r = await callWorker({ prompt: 'x', model: 'gemini-2.5-flash', stageId: 'stage.anecdote' });
    check('Flash non-7/10 stage: still 600 (default thinking)', r.gen?.maxOutputTokens === 600);
    check('Flash non-7/10 stage: NO thinkingConfig (unchanged)', r.gen?.thinkingConfig === undefined);

    // ── Response integrity: finishReason surfacing ──
    console.log('\n── MAX_TOKENS integrity ──');
    mockUpstream({ finishReason: 'MAX_TOKENS', text: 'partial coaching…' });
    r = await callWorker({ prompt: 'x', model: 'gemini-2.5-flash', stageId: 'stage.revision' });
    check('MAX_TOKENS upstream → response truncated: true', r.body?.truncated === true);
    check('MAX_TOKENS: partial text still returned (not dropped)', r.body?.text === 'partial coaching…');

    mockUpstream({ finishReason: 'STOP', text: 'complete coaching.' });
    r = await callWorker({ prompt: 'x', model: 'gemini-2.5-flash', stageId: 'stage.revision' });
    check('STOP upstream → response truncated: false', r.body?.truncated === false);
    check('STOP: text returned normally', r.body?.text === 'complete coaching.');

    // ── Input capacity: legitimate long-form writing must reach Gemini ──
    console.log('\n── Long-form input capacity ──');
    mockUpstream({ finishReason: 'STOP', text: 'long-form coaching.' });
    r = await callWorker({
        prompt: 'x'.repeat(40000),
        model: 'gemini-2.5-flash-lite',
        stageId: 'stage.frame_requirements'
    });
    check('40k-character SOP-sized prompt is accepted', r.status === 200);
    check('accepted long-form prompt reaches Gemini', captured?.contents?.[0]?.parts?.[0]?.text?.length === 40000);

    mockUpstream({ finishReason: 'STOP' });
    r = await callWorker({
        prompt: 'x'.repeat(128001),
        model: 'gemini-2.5-flash-lite',
        stageId: 'stage.frame_requirements'
    });
    check('request above 128k safety ceiling is rejected', r.status === 400);
    check('oversize response has a precise category', r.body?.category === 'prompt_too_large');
    check('oversize request is rejected before spending Gemini quota', captured === null);

    // ── W3: origin allowlist reconciliation (R-1.5) ──
    console.log('\n── W3 origin allowlist ──');
    async function callWorkerFrom(origin, payload, env = ENV) {
        captured = null;
        const req = new Request('https://vikthor1.github.io/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Origin': origin },
            body: JSON.stringify(payload),
        });
        const res = await worker.fetch(req, env);
        let body = null; try { body = await res.json(); } catch (_) {}
        return { status: res.status, body };
    }
    const SMALL = { prompt: 'x', model: 'gemini-2.5-flash-lite', stageId: 2 };
    mockUpstream({ finishReason: 'STOP' });
    let d = await callWorkerFrom('http://127.0.0.1:8000', SMALL);
    check('127.0.0.1:8000 origin is refused (403)', d.status === 403);
    check('127.0.0.1:8000 refusal states category origin_forbidden', d.body?.category === 'origin_forbidden');
    check('refused 127.0.0.1:8000 never reaches Gemini', captured === null);
    d = await callWorkerFrom('http://127.0.0.1:3001', SMALL);
    check('127.0.0.1:3001 origin is refused (403)', d.status === 403);
    check('refused 127.0.0.1:3001 never reaches Gemini', captured === null);
    mockUpstream({ finishReason: 'STOP' });
    d = await callWorkerFrom('http://localhost:3001', SMALL);
    check('localhost:3001 (mock test server) origin remains allowed', d.status === 200);
    mockUpstream({ finishReason: 'STOP' });
    d = await callWorkerFrom('https://tupana-preview.pages.dev', SMALL);
    check('tupana-preview.pages.dev origin remains allowed', d.status === 200);

    // ── W3: step-4 Worker-side error semantics ──
    console.log('\n── W3 quota / auth semantics ──');
    function mockUpstreamGeminiError({ httpStatus, statusEnum = null }) {
        globalThis.fetch = async (_url, opts) => {
            captured = JSON.parse(opts.body);
            const errBody = { error: { code: httpStatus, message: 'upstream detail never forwarded' } };
            if (statusEnum) errBody.error.status = statusEnum;
            return new Response(JSON.stringify(errBody),
                { status: httpStatus, headers: { 'content-type': 'application/json' } });
        };
    }
    mockUpstreamGeminiError({ httpStatus: 429, statusEnum: 'RESOURCE_EXHAUSTED' });
    r = await callWorker(SMALL);
    check('429 + RESOURCE_EXHAUSTED → category quota_exhausted', r.body?.category === 'quota_exhausted');
    check('quota_exhausted keeps HTTP 429', r.status === 429);
    check('quota_exhausted carries upstreamStatus RESOURCE_EXHAUSTED', r.body?.upstreamStatus === 'RESOURCE_EXHAUSTED');
    check('quota_exhausted forwards no upstream message text', !JSON.stringify(r.body).includes('never forwarded'));
    mockUpstreamGeminiError({ httpStatus: 429 });
    r = await callWorker(SMALL);
    check('429 without RESOURCE_EXHAUSTED enum stays rate_limited', r.body?.category === 'rate_limited');
    check('plain-429 rate_limited keeps HTTP 429', r.status === 429);
    mockUpstream({ finishReason: 'STOP' });
    d = await callWorkerFrom(ORIGIN, SMALL, {});
    check('missing GEMINI_API_KEY → 503', d.status === 503);
    check('missing-secret guard states category auth_error', d.body?.category === 'auth_error');
    check('missing-secret guard never calls upstream', captured === null);
} finally {
    globalThis.fetch = origFetch;
}

console.log(`\n  ${pass}/${pass + fail} PASS`);
if (fail) process.exit(1);
