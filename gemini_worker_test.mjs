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
            usageMetadata: { candidatesTokenCount: 42 },
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
} finally {
    globalThis.fetch = origFetch;
}

console.log(`\n  ${pass}/${pass + fail} PASS`);
if (fail) process.exit(1);
