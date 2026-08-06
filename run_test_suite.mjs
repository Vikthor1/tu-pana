// run_test_suite.mjs — the one deterministic command for the tracked regression suite.
//
//   npm test
//
// What it does, in order:
//   1. Starts the local mock harness (test-server.js) on 127.0.0.1:3001 and waits
//      for it to answer. The tracked suites hardcode that origin.
//   2. Runs every tracked `*.mjs` suite sequentially against it.
//   3. Stops the harness and reports suites / checks / failures.
//
// Deliberately EXCLUDED, by name, and reported as excluded rather than silently
// skipped:
//   - studio_live_check.mjs        — the bounded LIVE Gemini validation. It makes
//                                    real provider calls, is separately gated by
//                                    STUDIO_LIVE=1, and is never part of this run.
//   - scripts_build_nav_matrix.mjs — a documentation generator, not a suite; it
//                                    writes docs/nav-audit-matrix.md.
//
// This run makes ZERO live AI calls. Every suite either mocks the provider at the
// Playwright route layer, stubs globalThis.fetch, or asserts that no external
// request was made at all.
//
// A suite is counted as failed if it exits non-zero OR prints any ❌ check.
// Both are required: not every suite calls process.exit(1) on failure.
//
// Counting rule. Every suite prints one check per line, INDENTED — either
// `  ${ok ? '✅' : '❌'} label` or badge_test.mjs's equivalent `'  ✅'` literal.
// Six suites additionally print an UNINDENTED ✅/❌ in their own closing summary
// line (genre_leakage, studio_contrast, studio_mobile_passage, studio_pacing,
// studio_tour, voice_vault). Counting every glyph therefore over-reports by
// exactly those 6. CHECK_LINE anchors on the leading indent so summary lines are
// excluded and the total is the real check count.

import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = 3001;
const ORIGIN = `http://127.0.0.1:${PORT}`;

// Indented glyph = one check. Unindented = a suite's own summary line.
const CHECK_PASS = /^[ \t]+✅/gm;
const CHECK_FAIL = /^[ \t]+❌/gm;

const EXCLUDED = new Set([
    'studio_live_check.mjs',
    'scripts_build_nav_matrix.mjs',
    'run_test_suite.mjs',
]);

const suites = readdirSync(ROOT)
    .filter(f => f.endsWith('.mjs') && !EXCLUDED.has(f))
    .sort();

console.log(`Tu Pana — tracked regression suite`);
console.log(`  node      ${process.version}`);
console.log(`  origin    ${ORIGIN}`);
console.log(`  suites    ${suites.length}`);
console.log(`  excluded  ${[...EXCLUDED].filter(f => f !== 'run_test_suite.mjs').join(', ')}`);
console.log(`  live AI   none — mocked providers only\n`);

// ── 1. harness ────────────────────────────────────────────────────────────────
const harness = spawn(process.execPath, [join(ROOT, 'test-server.js')], {
    cwd: ROOT,
    env: { ...process.env, TUPANA_TEST_PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
});
let harnessErr = '';
harness.stdout.on('data', () => {});
harness.stderr.on('data', d => { harnessErr += d; });

const stopHarness = () => { if (!harness.killed) harness.kill('SIGTERM'); };
process.on('exit', stopHarness);
process.on('SIGINT', () => { stopHarness(); process.exit(130); });

async function waitForHarness(timeoutMs = 20000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (harness.exitCode !== null) return false;
        try {
            const res = await fetch(`${ORIGIN}/studio.html`, { method: 'HEAD' });
            if (res.ok) return true;
        } catch { /* not up yet */ }
        await new Promise(r => setTimeout(r, 250));
    }
    return false;
}

if (!await waitForHarness()) {
    console.error(`✖ harness did not come up on ${ORIGIN}`);
    if (harnessErr.trim()) console.error(harnessErr.trim());
    stopHarness();
    process.exit(1);
}
console.log(`✔ harness up on ${ORIGIN}\n`);

// ── 2. suites ─────────────────────────────────────────────────────────────────
const runSuite = file => new Promise(resolve => {
    const child = spawn(process.execPath, [join(ROOT, file)], {
        cwd: ROOT,
        env: { ...process.env, STUDIO_LIVE: '' },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    child.on('close', code => {
        const passed = (out.match(CHECK_PASS) || []).length;
        const failed = (out.match(CHECK_FAIL) || []).length;
        resolve({ file, code, passed, failed, out });
    });
});

const results = [];
for (const file of suites) {
    const r = await runSuite(file);
    results.push(r);
    const ok = r.code === 0 && r.failed === 0;
    console.log(
        `${ok ? '✔' : '✖'} ${file.padEnd(46)} ${String(r.passed).padStart(4)} checks` +
        `${r.failed ? `  ${r.failed} FAILED` : ''}${r.code !== 0 ? `  exit ${r.code}` : ''}`
    );
    if (!ok) console.log(r.out.split('\n').filter(l => l.includes('❌')).map(l => `      ${l.trim()}`).join('\n'));
}

stopHarness();

// ── 3. totals ─────────────────────────────────────────────────────────────────
const checks = results.reduce((n, r) => n + r.passed + r.failed, 0);
const failedChecks = results.reduce((n, r) => n + r.failed, 0);
const failedSuites = results.filter(r => r.code !== 0 || r.failed > 0);

console.log(`\n─────────────────────────────────────────────`);
console.log(`  suites  ${results.length}`);
console.log(`  checks  ${checks}`);
console.log(`  failed  ${failedChecks} check(s) in ${failedSuites.length} suite(s)`);
console.log(`─────────────────────────────────────────────`);

process.exit(failedSuites.length ? 1 : 0);
