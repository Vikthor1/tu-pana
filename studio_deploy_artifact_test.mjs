// Deployment-artifact boundary — the backstop for scripts_build_preview_artifact.mjs.
//
// The preview allowlist is written by hand, on purpose: an explicit list is the
// thing a future maintainer can read and trust. The cost of writing it by hand is
// that it can drift out of step with the application. This suite pays that cost.
//
// It re-derives the static dependency closure of the served HTML surfaces straight
// from their markup and fails if the allowlist does not cover it. So adding a
// <script src> to studio.html without adding the file here turns this suite red at
// `npm test` — before the deployment, rather than as a 404 in front of a writer.
//
// Since the 2026-08-08 legacy retirement (Decision R, step 1) it also runs in the
// opposite direction. Every assertion that the legacy surface was SERVED became an
// assertion that it is EXCLUDED — inverted, not deleted. The audio closure is still
// derived from the literals in ui.js, but now to prove each derived path is absent
// from the artifact. Keeping the derivation is what keeps the claim non-vacuous: if
// ui.js ever stopped naming seven audio files, the count check fails loudly instead
// of the exclusion checks passing for the wrong reason.
//
// It also pins the exclusions. Repository internals returning HTTP 200 on
// tupana-preview.pages.dev is exactly the defect this boundary corrects; a future
// convenience edit that re-adds package.json or a test suite fails here.
//
// Static analysis plus builder execution — no browser, no network. Since W2
// (sanitized replacement rollbacks) this suite also RUNS the builder: it
// observes every guard refusing and verifies a mixed-provenance replacement
// artifact byte-for-byte from the artifact directory itself, because the
// worktree-read checks above it cannot catch a mixed artifact.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOUNDARY_OVERLAY, PREVIEW_ARTIFACT } from './scripts_build_preview_artifact.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
let passed = 0;
let failed = 0;
const check = (label, condition, detail = '') => {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
    if (ok) passed++; else failed++;
};

const allow = new Set(PREVIEW_ARTIFACT);
const read = p => readFileSync(`${ROOT}/${p}`, 'utf8');

// Local, same-origin references only. An external origin (the fonts CDN, the
// Gemini proxy Worker) is not a repository file and is not our concern here.
const localRefs = html => {
    const out = new Set();
    for (const m of html.matchAll(/<(?:script|link|img|audio|source|iframe)\b[^>]*\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
        const v = m[1];
        if (/^(?:https?:)?\/\//i.test(v) || /^(?:data|mailto|tel|blob|javascript):/i.test(v) || v.startsWith('#')) continue;
        out.add(v.split(/[?#]/)[0].replace(/^\.\//, ''));
    }
    return out;
};

// Served pages. The legacy application (index.html) and its tutorial
// (start-here.html) were retired from the artifact on 2026-08-08 and are asserted
// as excluded further down, in FORBIDDEN.
const SURFACES = ['studio.html', '404.html'];

// Consumed by Cloudflare as deployment configuration and never served as a path.
// Kept separate from SURFACES so "is this a page?" and "is this in the artifact?"
// stay different questions.
const CONTROL = ['_redirects'];

console.log('\nStudent-facing surfaces are in the artifact');
for (const s of SURFACES) check(`${s} is served`, allow.has(s));
check('the Studio is the only application surface',
    SURFACES.filter(s => s !== '404.html').join(',') === 'studio.html');

console.log('\n404.html is load-bearing for the boundary');
// Cloudflare Pages answers an unmatched path with index.html and HTTP 200 unless
// a 404.html exists. Without this file an excluded artifact is indistinguishable
// from a served one, so the exclusion cannot be demonstrated at all.
const notFound = read('404.html');
check('404.html is in the artifact', allow.has('404.html'));
check('404.html has no local dependency (cannot itself 404)', localRefs(notFound).size === 0,
    [...localRefs(notFound)].join(', '));
check('404.html carries inline styling only', /<style/i.test(notFound) && !/<link\b/i.test(notFound));
check('404.html links back to the Studio', /href=["']studio\.html["']/.test(notFound));

console.log('\nEvery declared dependency of every served surface is in the artifact');
for (const surface of SURFACES) {
    const refs = [...localRefs(read(surface))].sort();
    for (const ref of refs) {
        check(`${surface} → ${ref}`, allow.has(ref), 'declared in markup but absent from PREVIEW_ARTIFACT');
    }
    check(`${surface} declares ${refs.length} local dependenc${refs.length === 1 ? 'y' : 'ies'}`, true);
}

console.log('\nNo served surface links to a page the artifact does not serve');
// <a href> is navigation rather than a load, so it is not part of the closure
// above — but a served page whose link 404s is still a broken student-facing
// path, which is precisely what an over-narrow artifact would cause.
for (const surface of SURFACES) {
    const links = [...new Set([...read(surface).matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)]
        .map(m => m[1])
        .filter(v => !/^(?:https?:)?\/\//i.test(v) && !/^(?:data|mailto|tel|blob|javascript):/i.test(v) && !v.startsWith('#'))
        .map(v => v.split(/[?#]/)[0].replace(/^\.\//, ''))
        .filter(Boolean))].sort();
    for (const l of links) check(`${surface} ⇢ ${l}`, allow.has(l), 'linked but not served');
    if (!links.length) check(`${surface} has no internal page links`, true);
}
// The retired tutorial's exit is assembled in JS (APP_URL = 'index.html' +
// G.appQuery), invisible to the markup scan above. It used to be pinned as SERVED.
// Now it is pinned as excluded — and the target is still derived from the file
// rather than restated, so the check cannot pass by naming a path nothing uses.
const startHere = read('start-here.html');
const exitTarget = startHere.match(/APP_URL\s*=\s*'([^']+)'/)?.[1] ?? null;
check('retired tutorial exit target is still derivable from start-here.html',
    exitTarget !== null, 'APP_URL literal not found — the check below would be vacuous');
check(`retired tutorial exit target (${exitTarget}) is not served`,
    exitTarget !== null && !allow.has(exitTarget));

console.log('\nRoot entry — / reaches the Studio, and nothing else is rewritten');
// With the legacy application retired the artifact holds no index.html, so `/`
// would answer 404. _redirects supplies the front door. Cloudflare consumes it as
// deployment configuration and never serves it as a path.
for (const c of CONTROL) check(`${c} is in the artifact`, allow.has(c));
check('_redirects is not a served surface', !SURFACES.includes('_redirects'));
check('the artifact has no index.html for / to fall back on', !allow.has('index.html'));

const rules = read('_redirects').split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split(/\s+/));
check('_redirects declares exactly one rule', rules.length === 1, `found ${rules.length}`);

const [from, to, status] = rules[0] ?? [];
check('rule source is / exactly', from === '/', String(from));
check('rule destination is /studio.html', to === '/studio.html', String(to));
check('rule destination is itself served', allow.has(String(to).replace(/^\//, '')));
// 301 is cached by browsers indefinitely; the root-entry decision must stay
// reversible on a device already holding it.
check('rule is a 302, not a permanent redirect', status === '302', String(status));

// A splat, a placeholder, or a source that is a prefix of /studio.html would
// capture the ?assignment= links this package exists to preserve.
check('no rule uses a wildcard or placeholder',
    !rules.some(r => /[*:]/.test(r[0] ?? '')), rules.map(r => r[0]).join(' '));
check('no rule redirects /studio.html',
    !rules.some(r => (r[0] ?? '').replace(/^\//, '').split('?')[0] === 'studio.html'));

// A courtesy redirect from a retired path would erase the 404 that is the whole
// evidence of retirement.
for (const legacy of ['/index.html', '/start-here.html']) {
    check(`no rule rescues ${legacy}`, !rules.some(r => r[0] === legacy));
}

console.log('\nLegacy onboarding audio closure (assets/js/ui.js) is fully excluded');
// ui.js hardcodes each path; nothing interpolates into assets/audio. The closure is
// still derived here — inverted from "is served" to "is excluded" — because a
// hardcoded list of seven strings would keep passing after ui.js changed, and this
// way the count check fails first if the derivation ever stops matching.
const ui = read('assets/js/ui.js');
const audio = [...new Set([...ui.matchAll(/['"](assets\/audio\/[^'"]+)['"]/g)].map(m => m[1]))].sort();
for (const a of audio) check(`ui.js → ${a} is excluded`, !allow.has(a));
check('ui.js references 7 audio files', audio.length === 7, `found ${audio.length}`);
check('no dynamic assets/audio path construction', !/[`'"]assets\/audio\/[^'"`]*\$\{/.test(ui));
check('no assets/audio path survives in the artifact',
    !PREVIEW_ARTIFACT.some(p => p.startsWith('assets/audio/')));

console.log('\nCSS declares no external file dependency');
for (const css of [...allow].filter(p => p.endsWith('.css'))) {
    const urls = [...read(css).matchAll(/url\(\s*['"]?([^'")]+)/gi)].map(m => m[1]);
    const nonData = urls.filter(u => !/^data:/i.test(u));
    check(`${css}: every url() is inline data:`, nonData.length === 0, nonData.join(', '));
    check(`${css}: no @import`, !/@import/i.test(read(css)));
}

// The nineteen legacy-only runtime files retired from the preview on 2026-08-08.
// Named individually rather than matched by pattern: this is the list a future
// maintainer can read against the ruling, and re-adding any one of them must be a
// red suite rather than a quiet re-publication. They remain git-tracked — this
// asserts what is SERVED, not what the repository keeps.
const LEGACY_RETIRED = [
    'index.html',
    'start-here.html',
    'assets/css/styles.css',
    'assets/js/config.js',
    'assets/js/data.js',
    'assets/js/genre-template.js',
    'assets/js/prompts.js',
    'assets/js/ai-provider.js',
    'assets/js/storage.js',
    'assets/js/council.js',
    'assets/js/ui.js',
    'assets/js/app.js',
    'assets/audio/es/01-landing-welcome.mp3',
    'assets/audio/es/02-mani-intro.mp3',
    'assets/audio/es/03-mani-freire.mp3',
    'assets/audio/es/04-lab-step0.mp3',
    'assets/audio/es/05-lab-step1.mp3',
    'assets/audio/es/06-lab-step2.mp3',
    'assets/audio/es/07-lab-step3.mp3',
];

console.log('\nThe retired legacy application stays out of the artifact');
check('the retirement list names 19 files', LEGACY_RETIRED.length === 19,
    `${LEGACY_RETIRED.length}`);
for (const f of LEGACY_RETIRED) check(`retired: ${f}`, !allow.has(f));

console.log('\nRepository internals stay out of the artifact');
const FORBIDDEN = [
    'package.json', 'package-lock.json', 'test-server.js', 'run_test_suite.mjs',
    '.gitignore', '.nvmrc', 'README.md', 'faculty-tedtalk-script.md',
    'scripts_build_nav_matrix.mjs', 'scripts_build_preview_artifact.mjs',
    'studio_deploy_artifact_test.mjs', 'studio_live_check.mjs',
    'server/gemini-worker/src/index.js', 'server/gemini-worker/wrangler.toml',
    'server/gemini-worker/README.md', 'prompts/qa-scenarios.md',
    'docs/current-architecture.md', 'docs/assets/torres-velez-headshot.jpg',
    'explore.html', 'assets/js/exploration.js', 'assets/css/exploration.css',
];
for (const f of FORBIDDEN) check(`excluded: ${f}`, !allow.has(f));

console.log('\nExclusion holds by class, not just by example');
const classes = [
    // Retirement holds by class as well as by name: the legacy application's
    // stylesheet and scripts sit directly under assets/css and assets/js, while
    // every Studio script lives under assets/js/studio/, so the boundary is a
    // clean prefix test rather than a list to keep in step.
    ['no legacy onboarding audio', p => p.startsWith('assets/audio/')],
    ['no top-level assets/js script (legacy application)', p => /^assets\/js\/[^/]+\.js$/.test(p)],
    ['no legacy stylesheet', p => p === 'assets/css/styles.css'],
    ['no regression suite', p => /_test\.mjs$/.test(p)],
    ['no markdown', p => p.endsWith('.md')],
    ['no docs/**', p => p.startsWith('docs/')],
    ['no server/**', p => p.startsWith('server/')],
    ['no prompts/**', p => p.startsWith('prompts/')],
    ['no dotfile', p => p.split('/').some(s => s.startsWith('.'))],
    ['no lockfile or manifest', p => /^(package(-lock)?\.json|.*\.lock)$/.test(p)],
    ['no .mjs at all', p => p.endsWith('.mjs')],
    ['no source map', p => p.endsWith('.map')],
    ['no env or secret file', p => /(^|\/)\.env|\.dev\.vars|\.pem$|\.key$/.test(p)],
];
for (const [label, hit] of classes) {
    const found = PREVIEW_ARTIFACT.filter(hit);
    check(label, found.length === 0, found.join(', '));
}

console.log('\nAllowlist integrity');
check('no duplicate entries', new Set(PREVIEW_ARTIFACT).size === PREVIEW_ARTIFACT.length);
check('no absolute path', !PREVIEW_ARTIFACT.some(p => p.startsWith('/')));
check('no parent-directory escape', !PREVIEW_ARTIFACT.some(p => p.split('/').includes('..')));
check('no backslash separator', !PREVIEW_ARTIFACT.some(p => p.includes('\\')));
// Derived from SURFACES rather than restated, so adding a served page updates this
// assertion in one place instead of leaving it quietly stale.
const outsideScope = PREVIEW_ARTIFACT.filter(p =>
    !SURFACES.includes(p) && !CONTROL.includes(p) && !p.startsWith('assets/'));
check(`every entry is a declared surface (${SURFACES.join(', ')}), a control file (${CONTROL.join(', ')}), or under assets/`,
    outsideScope.length === 0, outsideScope.join(', '));

const trackedAtHead = new Set(
    execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n')
);
const untracked = PREVIEW_ARTIFACT.filter(p => !trackedAtHead.has(p));
check('every entry is git-tracked at HEAD', untracked.length === 0, untracked.join(', '));

// Retirement took the legacy application out of the ARTIFACT, not out of the
// repository — roughly forty legacy regression suites still exercise these files.
// If a later change deletes them from git, that is a separate decision, and this
// is where it surfaces rather than as forty unexplained suite failures.
const retiredButMissing = LEGACY_RETIRED.filter(p => !trackedAtHead.has(p));
check('every retired legacy file is still git-tracked at HEAD',
    retiredButMissing.length === 0, retiredButMissing.join(', '));

console.log('\nBoundary is a real narrowing');
check(`artifact is ${PREVIEW_ARTIFACT.length} files of ${trackedAtHead.size} tracked`,
    PREVIEW_ARTIFACT.length < trackedAtHead.size / 10,
    `${PREVIEW_ARTIFACT.length} vs ${trackedAtHead.size}`);
// Pinned deliberately. Growing the artifact should be a visible, deliberate event
// that updates this number, not something that happens by accumulation.
check('artifact is exactly 10 paths — 9 served + 1 deployment-control',
    PREVIEW_ARTIFACT.length === 10, `${PREVIEW_ARTIFACT.length}`);
check('exactly one of them is a control file',
    PREVIEW_ARTIFACT.filter(p => CONTROL.includes(p)).length === 1);

// ─────────────────────────────────────────────────────────────────────────────
// W2 — sanitized replacement rollbacks. Everything below EXECUTES the builder.
//
// Two historical preview surfaces predate 404.html/_redirects; their sanitized
// replacements carry the historical payload with exactly those two boundary
// files overlaid from HEAD. The commit hashes are pinned deliberately: they are
// the two surfaces the step-2a ruling names, they are permanent history on this
// branch, and a replacement that drifted to a different source commit must fail
// loudly here. `a51aaff` has NO replacement by founder ruling — its disposition
// belongs to the separately gated step-2b decision, not to this suite.
// ─────────────────────────────────────────────────────────────────────────────
const REPLACEMENT_TARGETS = [
    '6c8bc781193404af3e0a6e4a811c87815e8024cd', // Decision D surface
    'd8ff0b08728208bb7891c898ff466a5816922727', // 1E surface
];
const PRE_STUDIO = 'f5c2c1bde5b34454422e57162631396c28b3a0c9';   // initial commit — no Studio files
const HAS_BOUNDARY = '5d7303e2599cdeb50ccc303989995818122ddc80'; // carries 404.html + _redirects, is not HEAD

const BUILDER = join(ROOT, 'scripts_build_preview_artifact.mjs');
const runBuilder = args => {
    try {
        const out = execFileSync(process.execPath, [BUILDER, ...args],
            { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
        return { code: 0, out, err: '' };
    } catch (e) {
        return { code: e.status ?? 1, out: String(e.stdout ?? ''), err: String(e.stderr ?? '') };
    }
};
const gitShow = spec => execFileSync('git', ['show', spec], { cwd: ROOT, maxBuffer: 1 << 28 });
const headCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
const tmp = () => mkdtempSync(join(tmpdir(), 'tupana-artifact-test-'));
// A thrown comparison (missing file, failed build) must COUNT as a failed
// check, not abort the suite — the check total stays fixed either way.
const checkT = (label, fn) => {
    let ok = false, detail = '';
    try { ok = Boolean(fn()); } catch (e) { detail = e.message.split('\n')[0]; }
    check(label, ok, detail);
};

console.log('\nOverlay contract');
check('the overlay set is exactly 404.html + _redirects, nothing else',
    BOUNDARY_OVERLAY.join(',') === '404.html,_redirects', BOUNDARY_OVERLAY.join(','));
check('every overlay path is itself an allowlisted artifact path',
    BOUNDARY_OVERLAY.every(p => allow.has(p)));

console.log('\nBuilder fail-safes are observed refusing, not assumed');
const scratchDirs = [];
try {
    const refusal = (label, args, needle) => {
        const r = runBuilder(args);
        check(label, r.code !== 0 && r.err.includes(needle),
            r.code === 0 ? 'builder exited 0' : `stderr lacks "${needle}"`);
    };
    refusal('no arguments → usage refusal', [], 'usage:');
    refusal('unknown ref → refusal', [(scratchDirs.push(tmp()), scratchDirs.at(-1)), '--ref', 'no-such-ref-w2'], 'not a commit');
    const preloaded = tmp(); scratchDirs.push(preloaded);
    writeFileSync(join(preloaded, 'stale.txt'), 'stale');
    refusal('non-empty out-dir → refusal', [preloaded, '--ref', REPLACEMENT_TARGETS[0], '--overlay-boundary'], 'refusing to build into it');
    refusal('overlay of HEAD → refusal (HEAD needs no overlay)',
        [(scratchDirs.push(tmp()), scratchDirs.at(-1)), '--overlay-boundary'], 'HEAD already carries the boundary files');
    refusal('overlay of a commit that already has the boundary → refusal',
        [(scratchDirs.push(tmp()), scratchDirs.at(-1)), '--ref', HAS_BOUNDARY, '--overlay-boundary'], 'refusing an ambiguous overlay');
    refusal('overlay build with payload absent from target → refusal',
        [(scratchDirs.push(tmp()), scratchDirs.at(-1)), '--ref', PRE_STUDIO, '--overlay-boundary'], 'refusing to build a partial artifact');
    refusal('plain build of a boundary-lacking commit still refuses (overlay is required, not optional)',
        [(scratchDirs.push(tmp()), scratchDirs.at(-1)), '--ref', REPLACEMENT_TARGETS[0]], 'refusing to build a partial artifact');

    console.log('\nReplacement artifacts — mixed provenance verified from the artifact directory');
    for (const target of REPLACEMENT_TARGETS) {
        const short = target.slice(0, 7);
        const dir = tmp(); scratchDirs.push(dir);
        const r = runBuilder([dir, '--ref', target, '--overlay-boundary']);
        check(`${short}: builder exits 0`, r.code === 0, r.err.split('\n').find(l => l.trim()) ?? '');
        check(`${short}: report logs per-file overlay provenance`,
            r.out.includes(`overlay   ${BOUNDARY_OVERLAY.join(', ')} ← HEAD ${headCommit}`)
            && BOUNDARY_OVERLAY.every(p => r.out.includes(`${p}  [overlay ← HEAD ${headCommit.slice(0, 7)}]`)));
        const walk = d => readdirSync(d, { withFileTypes: true })
            .flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [relative(dir, join(d, e.name))]);
        checkT(`${short}: artifact holds exactly the allowlist, both directions`,
            () => walk(dir).sort().join('\n') === [...PREVIEW_ARTIFACT].sort().join('\n'));
        for (const p of PREVIEW_ARTIFACT.filter(p => !BOUNDARY_OVERLAY.includes(p))) {
            checkT(`${short}: ${p} is byte-identical to the historical commit`,
                () => Buffer.compare(readFileSync(join(dir, p)), gitShow(`${target}:${p}`)) === 0);
        }
        for (const p of BOUNDARY_OVERLAY) {
            checkT(`${short}: ${p} is byte-identical to HEAD (the overlay)`,
                () => Buffer.compare(readFileSync(join(dir, p)), gitShow(`${headCommit}:${p}`)) === 0);
        }
        checkT(`${short}: every dependency the ARTIFACT's studio.html declares is in the artifact`,
            () => {
                const refs = [...localRefs(readFileSync(join(dir, 'studio.html'), 'utf8'))];
                return refs.length > 0 && refs.every(p => allow.has(p));
            });
        checkT(`${short}: the ARTIFACT's 404.html is self-contained`,
            () => localRefs(readFileSync(join(dir, '404.html'), 'utf8')).size === 0);
        checkT(`${short}: the ARTIFACT's _redirects is the single exact 302 root rule`,
            () => {
                const rs = readFileSync(join(dir, '_redirects'), 'utf8').split('\n')
                    .map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => l.split(/\s+/));
                return rs.length === 1 && rs[0][0] === '/' && rs[0][1] === '/studio.html' && rs[0][2] === '302';
            });
    }
} finally {
    for (const d of scratchDirs) rmSync(d, { recursive: true, force: true });
}

console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
