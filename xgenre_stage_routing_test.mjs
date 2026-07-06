// xgenre_stage_routing_test.mjs — Stage 7/10 cross-genre routing-inheritance guard
//
// Locks the single genre-independent chokepoint that makes EVERY writing genre
// inherit the Stage 7 (revision) and Stage 10 (reflection) truncation-stabilization
// config (gemini-2.5-flash + thinkingBudget:0 + 1536/2048), verified in the
// c0074a4 stabilization audit.
//
// The Worker honors the fix only when the frontend sends model 'gemini-2.5-flash'
// AND a stageId of 'stage.revision'/7 (S7) or 'stage.reflection'/10 (S10). That
// mapping is produced by two genre-INDEPENDENT functions:
//   - getStageId(n)            [genre-template.js] -> STAGE_IDS[n]
//   - selectGeminiModel(stageId) [ai-provider.js]  -> flash for {7,10,'stage.revision','stage.reflection'}
// Neither takes an assignmentId. This test proves that activating ANY registered
// genre (default + every review/link genre) leaves those emitted values unchanged,
// so no genre can bypass, rename, renumber, or short-circuit the stabilized route.
//
// Complements gemini_worker_test.mjs (which proves the Worker side in isolation):
// together they close the end-to-end cross-genre chain. Deterministic; no network,
// no Gemini calls — reads pure routing functions in-page.
//
// Run: node test-server.js   (on :3001), then  node xgenre_stage_routing_test.mjs

import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
let passed = 0, failed = 0;
function check(label, cond) {
    const ok = !!cond;
    if (ok) passed++; else failed++;
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
}

const browser = await chromium.launch();

async function pageFor(url) {
    const p = await browser.newPage();
    p.on('pageerror', e => console.log('    PAGEERROR:', String(e)));
    await p.goto(url);
    await p.evaluate(() => localStorage.clear());
    await p.goto(url);
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(600);
    return p;
}

// ── Canonical stage-id lock: guards against renaming/renumbering revision/reflection.
{
    console.log('\n── Canonical STAGE_IDS (renumber/rename guard) ──');
    const p = await pageFor(`${BASE}/`);
    const ids = await p.evaluate(() => ({
        s7:  (typeof STAGE_IDS === 'object') ? STAGE_IDS[7]  : '(no map)',
        s10: (typeof STAGE_IDS === 'object') ? STAGE_IDS[10] : '(no map)',
        gid7:  typeof getStageId === 'function' ? getStageId(7)  : '(no fn)',
        gid10: typeof getStageId === 'function' ? getStageId(10) : '(no fn)',
        // getStageId must be genre-independent: exactly one parameter (stageNumber).
        arity: typeof getStageId === 'function' ? getStageId.length : -1,
    }));
    check("STAGE_IDS[7] === 'stage.revision'",    ids.s7  === 'stage.revision');
    check("STAGE_IDS[10] === 'stage.reflection'", ids.s10 === 'stage.reflection');
    check("getStageId(7) === 'stage.revision'",   ids.gid7  === 'stage.revision');
    check("getStageId(10) === 'stage.reflection'", ids.gid10 === 'stage.reflection');
    check('getStageId is genre-independent (arity 1, no assignmentId)', ids.arity === 1);
    await p.close();
}

// ── Genre roster pulled from the live registry so future genres auto-cover.
//    Default (no assignment) + cap-200-first-draft link + every getReviewProfiles() id.
console.log('\n── Genre roster (from live registry) ──');
let ROSTER;
{
    const p = await pageFor(`${BASE}/`);
    const reviewIds = await p.evaluate(() =>
        (typeof getReviewProfiles === 'function') ? getReviewProfiles().map(x => x.assignmentId) : []
    );
    await p.close();
    ROSTER = [
        { name: 'default (no assignment)', assign: '' },
        { name: 'cap-200-first-draft (link-only)', assign: 'cap-200-first-draft' },
        ...reviewIds.map(id => ({ name: id, assign: id })),
    ];
    console.log('    roster:', ROSTER.map(r => r.name).join(' | '));
    // Guard: registry must contain the three known review genres (catches an
    // accidental empty roster that would make this suite vacuously pass).
    check('review registry non-empty (>=3 genres)', reviewIds.length >= 3);
    check('roster includes research-paper', reviewIds.includes('research-paper'));
    check('roster includes stem-lab-report', reviewIds.includes('stem-lab-report'));
    check('roster includes cap200 service-learning',
          reviewIds.includes('cap200-bronx-beautiful-service-learning'));
}

// ── For every genre: activating it must NOT change the emitted stageId/model at 7/10.
for (const g of ROSTER) {
    console.log(`\n── ${g.name} ──`);
    const url = g.assign ? `${BASE}/?assignment=${encodeURIComponent(g.assign)}` : `${BASE}/`;
    const p = await pageFor(url);
    const r = await p.evaluate(() => ({
        assignId: (typeof state === 'object' && state) ? (state.assignmentId || '') : '(no state)',
        m7s:  selectGeminiModel(getStageId(7)),
        m10s: selectGeminiModel(getStageId(10)),
        m7n:  selectGeminiModel(7),
        m10n: selectGeminiModel(10),
        m6:   selectGeminiModel(getStageId(6)),  // unrelated stage stays flash-lite
        sid7: getStageId(7),
        sid10: getStageId(10),
    }));
    check('assignment activated as expected', r.assignId === g.assign);
    check("emits stageId 'stage.revision' at S7",   r.sid7  === 'stage.revision');
    check("emits stageId 'stage.reflection' at S10", r.sid10 === 'stage.reflection');
    check('S7 model gemini-2.5-flash (string id)',  r.m7s  === 'gemini-2.5-flash');
    check('S10 model gemini-2.5-flash (string id)', r.m10s === 'gemini-2.5-flash');
    check('S7 model gemini-2.5-flash (numeric 7)',  r.m7n  === 'gemini-2.5-flash');
    check('S10 model gemini-2.5-flash (numeric 10)', r.m10n === 'gemini-2.5-flash');
    check('unrelated stage 6 stays gemini-2.5-flash-lite', r.m6 === 'gemini-2.5-flash-lite');
    await p.close();
}

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS`);
process.exit(failed ? 1 : 0);
