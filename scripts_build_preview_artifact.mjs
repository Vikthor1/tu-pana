// scripts_build_preview_artifact.mjs — build the bounded preview deployment artifact.
//
//   node scripts_build_preview_artifact.mjs <out-dir> [--ref <commit-ish>] [--overlay-boundary]
//
// WHY THIS EXISTS
// ---------------
// Until 2026-08-08 the preview was deployed as `git archive <commit>` — the whole
// tracked tree, 231 files. That published the regression suites, the runner, the
// local mock server, package.json + lockfile, .gitignore, .nvmrc, README.md,
// docs/**, prompts/**, and the Worker source and wrangler.toml, all reachable and
// all returning HTTP 200 on tupana-preview.pages.dev. No credential was ever in
// that tree — the provider key lives server-side in the Worker — but repository
// internals are not deployment artifacts and had no business being served.
//
// The correction is this file: an EXPLICIT ALLOWLIST. A denylist would need
// extending every time the repository grows; an allowlist only ever needs
// extending when the *application* grows, which is the smaller and more visible
// event. Everything not named below is simply never uploaded.
//
// .gitignore governs what git TRACKS. This file governs what Cloudflare SERVES.
// They are different questions and they are deliberately not the same list.
//
// SAFETY PROPERTIES
// -----------------
//   - Content comes from `git show <ref>:<path>`, never from the working tree, so
//     uncommitted edits, untracked scratch files, and ignored local material
//     (node_modules/, .env, .dev.vars, .DS_Store, .wrangler/) cannot reach the
//     artifact even by accident.
//   - A missing allowlist entry is a HARD FAILURE. Shipping the Studio without
//     studio-ui.js must never be something this script does quietly.
//   - Building from HEAD requires a clean worktree, so the deployment's recorded
//     --commit-hash always describes the bytes actually uploaded.
//   - The out-dir must not already hold files, so a previous build can never
//     contribute a stale extra file to this one.
//   - After writing, the on-disk set is compared against the allowlist in BOTH
//     directions. Extra file = failure, not a warning.
//
// ADDING A RUNTIME FILE
// ---------------------
// Add it to PREVIEW_ARTIFACT below. studio_deploy_artifact_test.mjs re-derives the
// dependency closure from the HTML and will fail if you add a <script src> or
// <link href> and forget this list — that suite is the backstop, not this comment.
//
// SANITIZED REPLACEMENT ROLLBACKS (--overlay-boundary)
// ----------------------------------------------------
// Two historical preview surfaces predate 404.html and _redirects, so a faithful
// rebuild of either would ship without the boundary that makes "excluded"
// demonstrable — without a 404.html, Pages answers every unmatched path with a
// soft-404 at HTTP 200, and an excluded file is indistinguishable from a served
// one. Their sanitized replacements are built with --overlay-boundary: every
// payload file comes from the historical commit, and ONLY 404.html and
// _redirects are supplied from HEAD. The overlay is narrow (that fixed pair,
// never anything else), logged (the report names each file's source commit),
// and guarded (it refuses a target that is HEAD, a target that already contains
// either boundary file, and a dirty working copy of the consumed HEAD paths).
//
// See docs/releases/preview-deployment.md.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// THE ALLOWLIST — every file the preview serves, and nothing else.
// Each group is one student-facing surface plus its verified static closure.
// ─────────────────────────────────────────────────────────────────────────────
export const PREVIEW_ARTIFACT = [
    // ── Writing Studio (the only application surface) ────────────────────────
    // studio.html declares exactly these seven dependencies and nothing more:
    // no fonts, no images, no audio, and no fetch to any repository path. Its
    // only outbound origin is the Gemini proxy Worker.
    'studio.html',
    'assets/css/studio.css',
    'assets/js/studio/studio-profiles.js',
    'assets/js/studio/studio-provider.js',
    'assets/js/studio/studio-council.js',
    'assets/js/studio/studio-import.js',
    'assets/js/studio/studio-tour.js',
    'assets/js/studio/studio-ui.js',

    // ── Not-found page ───────────────────────────────────────────────────────
    // Load-bearing for the boundary, not decoration. Without a 404.html,
    // Cloudflare Pages answers every unmatched path with index.html and HTTP 200,
    // so an excluded file is indistinguishable from a served one and "excluded"
    // cannot be demonstrated. Self-contained, so it can never itself 404.
    //
    // It now offers exactly one destination. It used to also link the legacy
    // application; that link was removed with the surface, because the one page
    // whose whole job is to be honest about absence must not point at something
    // absent.
    '404.html',

    // ── Root entry (deployment configuration, NOT a served path) ─────────────
    // The tenth path, and the only one Cloudflare consumes rather than serves.
    // With the legacy application retired there is no index.html, so `/` would
    // otherwise answer 404 — an unacceptable front door. One rule, `/` matched
    // exactly, 302 to the Studio. See the file itself for why 302 and why no
    // retired legacy path is redirected.
    '_redirects',
];

// The narrow overlay set for sanitized replacement rollbacks — exactly the two
// boundary files above and never anything else. A replacement's payload must
// stay byte-identical to its historical commit, or it is not a rollback target;
// it is a new deployment wearing an old commit's name.
export const BOUNDARY_OVERLAY = ['404.html', '_redirects'];

// ─────────────────────────────────────────────────────────────────────────────
// THE RETIREMENT — 2026-08-08, founder Decision R, step 1.
//
// The preview served the legacy application *Tu Pana de Escritura* alongside the
// Studio, on a CONTINUITY assumption: unpublishing it would leave writing done on
// this origin present in localStorage but unreadable. That assumption was
// discharged by ruling — the pilots are complete, continuing access to the legacy
// app is no longer a product requirement, and BOTH pilots ran on production
// (vikthor1.github.io/tu-pana), not on this preview, which never served an
// enrolled student. Retirement withdraws a served interface; it destroys no data.
//
// Nineteen legacy-only files left the artifact here, none of them a Studio
// dependency (the closure above is re-derived from markup by the backstop suite):
//
//   index.html · start-here.html · assets/css/styles.css
//   assets/js/{config,data,genre-template,prompts,ai-provider,storage,council,
//              ui,app}.js                                              (9 files)
//   assets/audio/es/0{1..7}-*.mp3                                      (7 files)
//
// They remain GIT-TRACKED. This list governs what Cloudflare serves, not what the
// repository keeps, and roughly forty legacy regression suites still exercise
// those files. Removing them from the repository is a different decision that
// nothing here authorizes.
//
// studio_deploy_artifact_test.mjs pins all nineteen as excluded BY NAME and the
// whole of assets/audio/** as excluded BY CLASS, so re-adding one is a red suite
// rather than a quiet re-publication.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Everything below is the builder CLI. It runs ONLY when this file is invoked
// directly, so studio_deploy_artifact_test.mjs can import PREVIEW_ARTIFACT above
// without building anything.
// ─────────────────────────────────────────────────────────────────────────────

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (!invokedDirectly) {
    // imported for the allowlist only
} else {

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const gitBytes = (...args) => execFileSync('git', args, { cwd: ROOT, maxBuffer: 1 << 28 });

const die = (msg, detail = []) => {
    console.error(`\n✖ ${msg}`);
    for (const d of detail) console.error(`    ${d}`);
    console.error('');
    process.exit(1);
};

// ── arguments ────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const overlayIdx = argv.indexOf('--overlay-boundary');
const overlay = overlayIdx !== -1;
const refIdx = argv.indexOf('--ref');
const ref = refIdx === -1 ? 'HEAD' : argv[refIdx + 1];
// Skip both the flag and its value by INDEX. Filtering on `refIdx + 1` without
// first checking for -1 silently discards argv[0] — the out-dir — whenever --ref
// is omitted, which is the common invocation.
const skip = refIdx === -1 ? new Set() : new Set([refIdx, refIdx + 1]);
if (overlay) skip.add(overlayIdx);
const outArg = argv.filter((_, i) => !skip.has(i))[0];

if (!outArg || !ref) {
    die('usage: node scripts_build_preview_artifact.mjs <out-dir> [--ref <commit-ish>] [--overlay-boundary]');
}

const OUT = resolve(outArg);
let commit;
try {
    commit = git('rev-parse', '--verify', `${ref}^{commit}`);
} catch {
    die(`not a commit: ${ref}`);
}

const headCommit = git('rev-parse', 'HEAD');
const tracked = new Set(git('ls-tree', '-r', '--name-only', commit).split('\n'));

// ── guards: the overlay is only for commits that PREDATE the boundary ────────
// A target that is HEAD needs no overlay (HEAD carries the boundary files), and
// a target that already contains either boundary file would make the artifact's
// provenance ambiguous — which 404.html is this? Refuse both; a plain build
// serves those commits.
if (overlay) {
    if (commit === headCommit) {
        die('--overlay-boundary builds a sanitized replacement of a HISTORICAL commit — HEAD already carries the boundary files; build it without the flag');
    }
    const present = BOUNDARY_OVERLAY.filter(p => tracked.has(p));
    if (present.length) {
        die(`target commit ${commit.slice(0, 7)} already contains boundary file(s) — refusing an ambiguous overlay`, present);
    }
}

// ── guard: bytes consumed from HEAD must not be shadowed by uncommitted edits ─
// The deployment records --commit-hash, and the report records each file's
// source commit. `git show` reads committed objects, so a dirty working copy can
// never reach the artifact — but a build that silently ignored the edit sitting
// in the worktree would hand the operator provenance they do not expect. So:
// whenever HEAD bytes are consumed, the paths being consumed must be clean —
// the whole tree for a HEAD build, exactly the overlay pair for an overlay
// build. (Overlay checks only its consumed paths on purpose: an unrelated dirty
// file cannot change overlay bytes, and the backstop suite executes overlay
// builds — a whole-tree check there would fail the deterministic suite on any
// dirty development tree.)
if (commit === headCommit) {
    const dirty = git('status', '--porcelain');
    if (dirty) {
        die('worktree is dirty — commit or stash before building from HEAD',
            dirty.split('\n').slice(0, 20));
    }
} else if (overlay) {
    const dirty = git('status', '--porcelain', '--', ...BOUNDARY_OVERLAY);
    if (dirty) {
        die('overlay source file(s) are dirty in the worktree — commit or restore them before overlaying from HEAD',
            dirty.split('\n'));
    }
}

// ── guard: out-dir must not already contain files ────────────────────────────
if (existsSync(OUT)) {
    const walk = dir => readdirSync(dir, { withFileTypes: true })
        .flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
    const existing = walk(OUT);
    if (existing.length) {
        die(`out-dir already contains ${existing.length} file(s) — refusing to build into it`,
            existing.slice(0, 10).map(f => relative(OUT, f)));
    }
}

// ── guard: no allowlist entry may escape the artifact root ───────────────────
const escaping = PREVIEW_ARTIFACT.filter(p => {
    const target = resolve(OUT, p);
    return p.startsWith('/') || p.includes('..') || !(target + sep).startsWith(OUT + sep);
});
if (escaping.length) die('allowlist entries escape the artifact root', escaping);

// ── guard: every allowlist entry must exist in its source commit ─────────────
// Payload paths must exist in the target commit; under --overlay-boundary the
// two boundary paths are sourced from HEAD instead and must exist THERE.
const overlaid = new Set(overlay ? BOUNDARY_OVERLAY : []);
const missing = PREVIEW_ARTIFACT.filter(p => !overlaid.has(p) && !tracked.has(p));
if (missing.length) {
    die(`${missing.length} allowlist path(s) absent from ${commit.slice(0, 7)} — refusing to build a partial artifact`, missing);
}
if (overlay) {
    const headTracked = new Set(git('ls-tree', '-r', '--name-only', headCommit).split('\n'));
    const absent = BOUNDARY_OVERLAY.filter(p => !headTracked.has(p));
    if (absent.length) {
        die(`overlay source(s) absent from HEAD ${headCommit.slice(0, 7)} — nothing to overlay`, absent);
    }
}

const dupes = PREVIEW_ARTIFACT.filter((p, i) => PREVIEW_ARTIFACT.indexOf(p) !== i);
if (dupes.length) die('duplicate allowlist entries', [...new Set(dupes)]);

// ── write ────────────────────────────────────────────────────────────────────
const digests = [];
let bytes = 0;
for (const path of PREVIEW_ARTIFACT) {
    const source = overlaid.has(path) ? headCommit : commit;
    const content = gitBytes('show', `${source}:${path}`);
    const target = join(OUT, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    digests.push([createHash('sha256').update(content).digest('hex'), path, source]);
    bytes += content.length;
}

// ── verify: what landed is exactly what was allowed, both directions ─────────
const walkOut = dir => readdirSync(dir, { withFileTypes: true })
    .flatMap(e => e.isDirectory() ? walkOut(join(dir, e.name)) : [relative(OUT, join(dir, e.name))]);
const written = walkOut(OUT).sort();
const allowed = [...PREVIEW_ARTIFACT].sort();
const extra = written.filter(p => !allowed.includes(p));
const absent = allowed.filter(p => !written.includes(p));
if (extra.length || absent.length) {
    die('artifact does not match the allowlist', [
        ...extra.map(p => `unexpected: ${p}`),
        ...absent.map(p => `not written: ${p}`),
    ]);
}
for (const p of written) {
    if (!statSync(join(OUT, p)).size && !p.endsWith('.gitkeep')) die(`empty file in artifact: ${p}`);
}

// ── report ───────────────────────────────────────────────────────────────────
// Under --overlay-boundary this report IS the provenance log: one deployment
// hash cannot describe a mixed artifact, so each file names its source commit
// and the inventory in docs/releases/preview-deployment.md records the pairing.
const payloadCount = written.length - overlaid.size;
console.log(`Tu Pana — preview deployment artifact`);
console.log(`  commit    ${commit}`);
if (overlay) console.log(`  overlay   ${BOUNDARY_OVERLAY.join(', ')} ← HEAD ${headCommit}`);
console.log(`  out       ${OUT}`);
if (overlay) {
    console.log(`  files     ${written.length} = ${payloadCount} from ${commit.slice(0, 7)} (of ${tracked.size} tracked — ${tracked.size - payloadCount} excluded) + ${overlaid.size} overlaid`);
} else {
    console.log(`  files     ${written.length} (of ${tracked.size} tracked — ${tracked.size - written.length} excluded)`);
}
console.log(`  bytes     ${bytes.toLocaleString()}\n`);
for (const [sha, path, source] of digests) {
    console.log(`  ${sha}  ${path}${source === commit ? '' : `  [overlay ← HEAD ${source.slice(0, 7)}]`}`);
}
console.log(`\n✔ artifact matches the allowlist exactly${overlay
    ? ` — ${payloadCount} file(s) from ${commit.slice(0, 7)}, ${overlaid.size} overlaid from HEAD ${headCommit.slice(0, 7)}`
    : ''}`);

}
