// a7_zero_call_invariants_test.mjs — A7 DRILL-GATING INVARIANTS
//
// This suite exists for ONE purpose: to gate the A7 emergency provider-shutoff
// drill. It is deliberately standalone so it can be run alone, immediately
// before the drill, as the drill's own precondition:
//
//     node a7_zero_call_invariants_test.mjs
//
// It asserts two independent things about the Gemini proxy Worker.
//
// L1 — STATIC DOMINANCE (over the reviewed source bytes)
//   The reviewed program cannot reach the provider without a truthy secret:
//   a closed egress inventory (exactly one outbound fetch), callGemini with one
//   definition and one call site, that call site dominated by the secret guard,
//   exactly one exported handler, and no background/back-edge egress mechanism.
//
// L2 — DETERMINISTIC ORACLE (the reviewed program, executed)
//   With the secret absent, the executed program performs ZERO outbound fetches
//   and emits the (P) "not configured" body exactly.
//
// TWO HARDENING RULES, both of which the pre-existing zero-call assertions in
// gemini_worker_test.mjs do NOT satisfy. They are the reason this suite exists
// rather than more cases in that file:
//
//   1. THE SPY COUNTS BEFORE IT PARSES. gemini_worker_test.mjs infers "no call"
//      from `captured === null`, but `captured` is assigned only AFTER
//      JSON.parse(opts.body) succeeds. An outbound call whose body failed to
//      parse would leave `captured` null and be silently scored as zero calls.
//      Here the counter increments as the first statement of the spy, before
//      anything is read, parsed, or awaited — and two positive controls prove
//      the counter is live rather than vacuously zero.
//
//   2. THE (P)/(U) DISTINGUISHABILITY INVARIANT IS ASSERTED. The secretless
//      response (P) and the upstream-auth-failure response (U) BOTH carry
//      HTTP 503 and category 'auth_error'. During the drill, (U) means a
//      provider call WAS made. The drill's live acceptance criterion is
//      therefore evaluated here as one predicate applied to both bodies: it
//      must accept (P) and REJECT (U). Asserting the (P) shape alone would not
//      establish that the criterion can tell them apart.
//
// A failure in this suite is a STOP: the oracle is unsound, so the drill does
// not run. No network, no key, no provider call — the outbound fetch is spied
// and never dispatched.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import worker from './server/gemini-worker/src/index.js';

let pass = 0, fail = 0;
const check = (l, c) => { console.log(`  ${c ? '✅' : '❌'} ${l}`); c ? pass++ : fail++; };

const SOURCE_PATH = fileURLToPath(new URL('./server/gemini-worker/src/index.js', import.meta.url));
const SRC = readFileSync(SOURCE_PATH, 'utf8');

// The exact byte sequence over which the A7 static dominance argument (L1) was
// derived. This pin is NOT a convenience. If the Worker changes, L1 no longer
// describes the shipped program and the drill's evidence base is void.
// The correct response to a failure here is A NEW SOURCE REVIEW — never a
// hash bump.
const REVIEWED_SOURCE_SHA256 =
    '7babf45a14c4871e1cd6ddd3e26ca425fe46a42e4cb33f60c8211687df01cac6';

const count = re => (SRC.match(re) || []).length;

// ── L4 acceptance predicate ───────────────────────────────────────────────────
// The exact conjunction the drill operator will evaluate against each live
// secretless response. Defined ONCE and applied to every body below, so that
// what this suite verifies and what the drill checks cannot drift apart.
function satisfiesL4(status, body) {
    return status === 503
        && body?.error === true
        && body?.category === 'auth_error'
        && body?.message === 'Gemini not configured'
        && !('status' in (body || {}))
        && !('upstreamStatus' in (body || {}));
}

// ── hardened egress spy ───────────────────────────────────────────────────────
let egressCalls = 0;
let egressTargets = [];

function installSpy(responder) {
    egressCalls = 0;
    egressTargets = [];
    globalThis.fetch = function spiedFetch(...args) {
        egressCalls += 1;                 // FIRST statement — before any read or parse
        egressTargets.push(String(args[0]));
        return responder(...args);
    };
}

const upstreamOk = () => async () => new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ text: 'coach reply' }] }, finishReason: 'STOP' }],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
}), { status: 200, headers: { 'content-type': 'application/json' } });

const upstreamAuthFailure = () => async () => new Response(JSON.stringify({
    error: { code: 403, status: 'PERMISSION_DENIED', message: 'upstream detail never forwarded' },
}), { status: 403, headers: { 'content-type': 'application/json' } });

const ALLOWED_ORIGIN = 'https://vikthor1.github.io';
const PAYLOAD = { prompt: 'a student paragraph', model: 'gemini-2.5-flash-lite', stageId: 2 };

async function callWorker({ env, origin = ALLOWED_ORIGIN, method = 'POST', payload = PAYLOAD }) {
    const init = { method, headers: { 'Content-Type': 'application/json', 'Origin': origin } };
    if (method === 'POST') init.body = JSON.stringify(payload);
    const res = await worker.fetch(new Request('https://vikthor1.github.io/', init), env);
    let body = null; try { body = await res.json(); } catch (_) {}
    return { status: res.status, body };
}

const origFetch = globalThis.fetch;
try {
    // ── L1.0 reviewed-source identity ─────────────────────────────────────────
    console.log('\n── L1: reviewed-source identity ──');
    const actualSha = createHash('sha256').update(readFileSync(SOURCE_PATH)).digest('hex');
    check('Worker source is byte-identical to the reviewed A7 source (7babf45a…01cac6)',
          actualSha === REVIEWED_SOURCE_SHA256);

    // ── L1.1 closed egress inventory ──────────────────────────────────────────
    console.log('\n── L1: closed egress inventory ──');
    check('exactly one outbound fetch call site in the Worker', count(/await fetch\(/g) === 1);
    check('exactly two fetch tokens total — the one egress plus the handler definition',
          count(/\bfetch\s*\(/g) === 2 && count(/async fetch\(/g) === 1);
    const FORBIDDEN_EGRESS = [
        'XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon', 'navigator',
        'import(', 'eval(', 'new Function',
    ];
    const presentEgress = FORBIDDEN_EGRESS.filter(t => SRC.includes(t));
    check(`no alternative egress mechanism in the Worker (${FORBIDDEN_EGRESS.length} checked)`,
          presentEgress.length === 0);
    const FORBIDDEN_BACKEDGE = ['waitUntil', 'setTimeout', 'setInterval', 'queueMicrotask'];
    const presentBackedge = FORBIDDEN_BACKEDGE.filter(t => SRC.includes(t));
    check('no back-edge: nothing can be scheduled to run after the response is returned',
          presentBackedge.length === 0);

    // ── L1.2 single definition, single call site ──────────────────────────────
    console.log('\n── L1: callGemini definition and call site ──');
    check('callGemini has exactly one definition', count(/function callGemini\(/g) === 1);
    check('callGemini has exactly one call site', count(/await callGemini\(/g) === 1);
    check('callGemini is referenced nowhere else', count(/callGemini/g) === 2);

    // ── L1.3 guard dominance (call-graph, NOT text order) ─────────────────────
    // callGemini is DEFINED above the handler, so lexical position proves
    // nothing on its own. Dominance is derived structurally: the sole egress
    // lives inside callGemini's body, and callGemini's sole call site lives in
    // the handler body AFTER the secret guard. With one definition and one call
    // site, no path reaches the provider without passing the guard first.
    console.log('\n── L1: secret-guard dominance ──');
    const iCallGeminiDef = SRC.indexOf('async function callGemini(');
    const iHandler       = SRC.indexOf('export default {');
    const iEgress        = SRC.indexOf('await fetch(');
    const iGuard         = SRC.indexOf('if (!env.GEMINI_API_KEY)');
    const iCallSite      = SRC.indexOf('await callGemini(');
    check('the sole egress lies inside callGemini\'s body',
          iCallGeminiDef > -1 && iHandler > iCallGeminiDef &&
          iEgress > iCallGeminiDef && iEgress < iHandler);
    check('the secret guard appears exactly once', count(/if \(!env\.GEMINI_API_KEY\)/g) === 1);
    check('the guard lies inside the exported handler', iGuard > iHandler);
    check('the callGemini call site lies inside the handler, AFTER the guard',
          iCallSite > iHandler && iCallSite > iGuard);
    check('GEMINI_API_KEY is read exactly twice — the guard and the key it passes',
          count(/env\.GEMINI_API_KEY/g) === 2);

    // ── L1.4 handler surface ──────────────────────────────────────────────────
    console.log('\n── L1: handler surface ──');
    check('exactly one default export', count(/export default/g) === 1);
    check('the exported handler declares exactly one entry point: fetch',
          Object.keys(worker).join(',') === 'fetch' && typeof worker.fetch === 'function');
    const NON_FETCH_HANDLERS = ['scheduled', 'queue', 'email', 'tail', 'trace', 'alarm'];
    check(`no second handler declared (${NON_FETCH_HANDLERS.length} checked)`,
          NON_FETCH_HANDLERS.every(h => !(h in worker)));
    check('the handler takes (request, env) only — no execution context to defer work onto',
          worker.fetch.length === 2);

    // ── L1.5 origin allowlist ─────────────────────────────────────────────────
    // The drill's observation requests must be sent from an allowlisted Origin,
    // or they never reach the guard and prove nothing (fail-closed route 5).
    console.log('\n── L1: origin allowlist ──');
    const originBlock = SRC.match(/const ALLOWED_ORIGINS = new Set\(\[([\s\S]*?)\]\);/);
    const origins = (originBlock?.[1].match(/'([^']+)'/g) || []).map(s => s.slice(1, -1));
    check('the allowlist holds exactly the four documented origins',
          origins.length === 4 &&
          origins.includes('https://vikthor1.github.io') &&
          origins.includes('https://tupana-preview.pages.dev') &&
          origins.includes('http://localhost:8000') &&
          origins.includes('http://localhost:3001'));
    check('the allowlist contains no wildcard', !origins.includes('*'));

    // ── L2.0 oracle soundness — POSITIVE CONTROLS ─────────────────────────────
    // Zero is only meaningful if the counter can reach one. Both controls run
    // WITH the secret present, so they exercise the path the drill removes.
    console.log('\n── L2: oracle soundness (positive controls) ──');
    installSpy(upstreamOk());
    let r = await callWorker({ env: { GEMINI_API_KEY: 'test-key-not-real' } });
    check('positive control: a configured request registers exactly one outbound call',
          egressCalls === 1);
    check('positive control: the counted call targets the Gemini endpoint',
          egressTargets[0]?.startsWith('https://generativelanguage.googleapis.com/'));
    check('positive control: the configured request succeeded (200)', r.status === 200);

    // The counter must not depend on the call completing, on the body being
    // readable, or on anything being parsed. This is the exact failure mode the
    // `captured === null` oracle cannot detect.
    installSpy(() => { throw new TypeError('upstream unreachable before any parse'); });
    r = await callWorker({ env: { GEMINI_API_KEY: 'test-key-not-real' } });
    check('positive control: a call that throws before any parsing is still counted',
          egressCalls === 1);
    check('positive control: the thrown call is reported as a network error, not as silence',
          r.status === 502 && r.body?.category === 'network_error');

    // ── L2.1 the drill condition: secret absent ───────────────────────────────
    console.log('\n── L2: zero calls with the secret absent ──');
    installSpy(upstreamOk());
    const undef = await callWorker({ env: {} });
    check('secret undefined: ZERO outbound calls', egressCalls === 0);
    check('secret undefined: HTTP 503', undef.status === 503);
    check('secret undefined: the response is not a 403 origin refusal', undef.status !== 403);

    installSpy(upstreamOk());
    const empty = await callWorker({ env: { GEMINI_API_KEY: '' } });
    check('secret empty string: ZERO outbound calls', egressCalls === 0);
    check('secret empty string: HTTP 503', empty.status === 503);

    // Every other reachable method path must also be egress-free without a
    // secret, so the drill cannot be defeated by a non-POST request.
    installSpy(upstreamOk());
    const opts = await callWorker({ env: {}, method: 'OPTIONS' });
    check('secretless CORS preflight: ZERO outbound calls', egressCalls === 0);
    check('secretless CORS preflight: 204', opts.status === 204);
    installSpy(upstreamOk());
    const get = await callWorker({ env: {}, method: 'GET' });
    check('secretless GET: ZERO outbound calls', egressCalls === 0);
    check('secretless GET: 405', get.status === 405);

    // ── L2.2 the (P) body, asserted exactly ───────────────────────────────────
    console.log('\n── L2: the (P) not-configured body ──');
    for (const [label, res] of [['undefined', undef], ['empty string', empty]]) {
        check(`(P) secret ${label}: body is exactly { error, category, message }`,
              Object.keys(res.body || {}).sort().join(',') === 'category,error,message');
        check(`(P) secret ${label}: error === true (boolean, not a string)`,
              res.body?.error === true);
        check(`(P) secret ${label}: category === 'auth_error'`,
              res.body?.category === 'auth_error');
        check(`(P) secret ${label}: message === 'Gemini not configured'`,
              res.body?.message === 'Gemini not configured');
        check(`(P) secret ${label}: satisfies the drill's live acceptance criterion`,
              satisfiesL4(res.status, res.body));
    }

    // ── L2.3 the (P)/(U) distinguishability invariant ─────────────────────────
    // (U) is the upstream-auth-failure branch: the secret WAS present and a
    // provider call WAS made. It arrives as HTTP 503 with category 'auth_error'
    // — identical to (P) on both. If the acceptance criterion could not reject
    // it, the drill could score a real provider call as proof of zero calls.
    console.log('\n── L2: (P)/(U) distinguishability ──');
    installSpy(upstreamAuthFailure());
    const u = await callWorker({ env: { GEMINI_API_KEY: 'test-key-not-real' } });
    check('(U) is produced only after a real outbound call', egressCalls === 1);
    check('(U) collides with (P) on HTTP status', u.status === 503 && undef.status === 503);
    check('(U) collides with (P) on category',
          u.body?.category === 'auth_error' && undef.body?.category === 'auth_error');
    check('(U) carries a status key that (P) never carries',
          'status' in (u.body || {}) && !('status' in (undef.body || {})));
    check('(U) carries an upstreamStatus key that (P) never carries',
          'upstreamStatus' in (u.body || {}) && !('upstreamStatus' in (undef.body || {})));
    check('(U) carries the distinct configuration-error message',
          u.body?.message === 'Coach configuration error.');
    check('DISTINGUISHABILITY INVARIANT: the acceptance criterion REJECTS (U)',
          satisfiesL4(u.status, u.body) === false);
    check('DISTINGUISHABILITY INVARIANT: it accepts (P) and rejects (U) — not both, not neither',
          satisfiesL4(undef.status, undef.body) === true && satisfiesL4(u.status, u.body) === false);

    // ── L2.4 the 403 discard rule ─────────────────────────────────────────────
    // A refused origin never reaches the guard, so its body is evidence of
    // nothing and must be discarded rather than read as (P).
    console.log('\n── L2: refused-origin discard rule ──');
    installSpy(upstreamOk());
    const refused = await callWorker({ env: {}, origin: 'https://not-allowed.example' });
    check('a refused origin makes ZERO outbound calls', egressCalls === 0);
    check('a refused origin is rejected with 403 origin_forbidden',
          refused.status === 403 && refused.body?.category === 'origin_forbidden');
    check('a 403 refusal never satisfies the acceptance criterion — it is discarded, not counted',
          satisfiesL4(refused.status, refused.body) === false);
} finally {
    globalThis.fetch = origFetch;
}

console.log(`\n  ${pass}/${pass + fail} PASS`);
if (fail) process.exit(1);
