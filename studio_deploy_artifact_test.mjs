// Deployment-artifact boundary — the backstop for scripts_build_preview_artifact.mjs.
//
// The preview allowlist is written by hand, on purpose: an explicit list is the
// thing a future maintainer can read and trust. The cost of writing it by hand is
// that it can drift out of step with the application. This suite pays that cost.
//
// It re-derives the static dependency closure of the three student-facing HTML
// surfaces straight from their markup, and from the audio literals in ui.js, and
// fails if the allowlist does not cover it. So adding a <script src> to studio.html
// without adding the file here turns this suite red at `npm test` — before the
// deployment, rather than as a 404 in front of a writer.
//
// It also pins the exclusions. Repository internals returning HTTP 200 on
// tupana-preview.pages.dev is exactly the defect this boundary corrects; a future
// convenience edit that re-adds package.json or a test suite fails here.
//
// Pure static analysis — no browser, no network, no harness dependency.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PREVIEW_ARTIFACT } from './scripts_build_preview_artifact.mjs';

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

const SURFACES = ['studio.html', 'index.html', 'start-here.html', '404.html'];

console.log('\nStudent-facing surfaces are in the artifact');
for (const s of SURFACES) check(`${s} is served`, allow.has(s));

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
// The tutorial's exit is assembled in JS (APP_URL = 'index.html' + G.appQuery),
// so the markup scan above cannot see it. Pin it explicitly.
check('start-here.html JS exit target index.html is served',
    !/APP_URL\s*=\s*'index\.html'/.test(read('start-here.html')) || allow.has('index.html'));

console.log('\nLegacy onboarding audio closure (assets/js/ui.js)');
// ui.js hardcodes each path; nothing interpolates into assets/audio. If that ever
// changes, the template literal below stops matching and this check goes silent —
// so assert the count too, and assert no dynamic construction crept in.
const ui = read('assets/js/ui.js');
const audio = [...new Set([...ui.matchAll(/['"](assets\/audio\/[^'"]+)['"]/g)].map(m => m[1]))].sort();
for (const a of audio) check(`ui.js → ${a}`, allow.has(a));
check('ui.js references 7 audio files', audio.length === 7, `found ${audio.length}`);
check('no dynamic assets/audio path construction', !/[`'"]assets\/audio\/[^'"`]*\$\{/.test(ui));

console.log('\nCSS declares no external file dependency');
for (const css of [...allow].filter(p => p.endsWith('.css'))) {
    const urls = [...read(css).matchAll(/url\(\s*['"]?([^'")]+)/gi)].map(m => m[1]);
    const nonData = urls.filter(u => !/^data:/i.test(u));
    check(`${css}: every url() is inline data:`, nonData.length === 0, nonData.join(', '));
    check(`${css}: no @import`, !/@import/i.test(read(css)));
}

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
const outsideScope = PREVIEW_ARTIFACT.filter(p => !SURFACES.includes(p) && !p.startsWith('assets/'));
check(`every entry is a declared surface (${SURFACES.join(', ')}) or under assets/`,
    outsideScope.length === 0, outsideScope.join(', '));

const trackedAtHead = new Set(
    execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n')
);
const untracked = PREVIEW_ARTIFACT.filter(p => !trackedAtHead.has(p));
check('every entry is git-tracked at HEAD', untracked.length === 0, untracked.join(', '));

console.log('\nBoundary is a real narrowing');
check(`artifact is ${PREVIEW_ARTIFACT.length} files of ${trackedAtHead.size} tracked`,
    PREVIEW_ARTIFACT.length < trackedAtHead.size / 4,
    `${PREVIEW_ARTIFACT.length} vs ${trackedAtHead.size}`);

console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
