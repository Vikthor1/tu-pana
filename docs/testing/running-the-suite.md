# Running the regression suite

One command, one runtime, no live AI calls. A second party with this repository
and nothing else should be able to reproduce the recorded result.

## Runtime

**Node 24.19.0 LTS (Krypton).** Pinned in `.nvmrc` and in `package.json` →
`engines.node` (`>=24.19.0 <25`).

Node **26.0.0** is recorded only as the *previously observed local environment*
on the founder's machine. It is not the supported runtime and is not the version
the recorded baseline was verified on.

```sh
nvm use            # reads .nvmrc → 24.19.0
node --version     # expect v24.19.0
```

## Install

```sh
npm ci                          # exact versions from package-lock.json
npx playwright install chromium # browser binary; cached outside the repo
```

`npm ci` installs strictly from the tracked lockfile and fails if the lockfile
and `package.json` disagree. Do not use `npm install` for a reproduction run —
it may resolve newer versions.

The Playwright **browser binary** is not in the lockfile. It lives in a
machine-level cache (`~/Library/Caches/ms-playwright` on macOS) and must be
installed separately, as above. `playwright` 1.60.0 pins the Chromium build it
downloads, so this step is reproducible even though it is not a package install.

## Run

```sh
npm test
```

That is the whole command. It:

1. starts the local mock harness (`test-server.js`) on `127.0.0.1:3001` and waits
   for it to answer;
2. runs every tracked `*.mjs` suite sequentially against that origin;
3. stops the harness and prints suites / checks / failures.

Port **3001 must be free.** The suites hardcode `http://127.0.0.1:3001` and
`http://localhost:3001`, and those are also the dev-only origins the Gemini
Worker admits. `test-server.js` accepts `TUPANA_TEST_PORT` for diagnosing a busy
port, but a suite run on any other port will fail — free 3001 instead.

## What is excluded, and why

The runner excludes two files **by name** and prints them as excluded rather
than silently skipping them:

| File | Why |
|---|---|
| `studio_live_check.mjs` | The bounded **live Gemini** validation. It makes real provider calls that cost money. It is separately gated behind `STUDIO_LIVE=1` and is never part of this run. |
| `scripts_build_nav_matrix.mjs` | A documentation generator (writes `docs/nav-audit-matrix.md`), not a suite. |

## Zero live AI calls

This run makes **no** provider call. Every suite either intercepts the Worker
URL at the Playwright route layer and fulfils it locally, stubs `globalThis.fetch`
before driving the Worker module directly, or asserts that no external request
was made at all. Several suites assert `external.length === 0` as an explicit
check. The runner additionally clears `STUDIO_LIVE` in each suite's environment.

## Recorded baseline

| | |
|---|---|
| Branch | `migrate/pedagogical-engine-2026-08` |
| Commit | the commit that introduces this file — recorded exactly, with the clean-clone proof, in the VC-OS close for sub-batch 1A |
| Runtime | Node v24.19.0, npm 11.17.0, darwin arm64 |
| Suites | **66** |
| Checks | **2,704** |
| Failures | **0** |

Reproduced from a clean isolated clone at that commit, with dependencies
installed by `npm ci` from the tracked lockfile. A commit hash is deliberately
not hardcoded here — this file cannot name the commit that contains it. The
governed close record is the tie to the exact commit.

A suite counts as failed if it exits non-zero **or** prints any `❌` check. Both
are required: not every suite calls `process.exit(1)` on failure.

**Counting rule.** Every suite prints one check per line, *indented*. Six suites
(`genre_leakage`, `studio_contrast`, `studio_mobile_passage`, `studio_pacing`,
`studio_tour`, `voice_vault`) additionally print an *unindented* ✅/❌ in their own
closing summary line. Counting every glyph therefore over-reports by exactly 6
(2,710 instead of 2,704). The runner anchors on the leading indent, so summary
lines are excluded. This was verified against the affected suites' own
self-reported totals.

Investigate any deviation from these totals rather than normalising it.

## Known, unfixed, and out of scope here

- **`npm audit` reports 3 advisories** (1 low, 2 moderate) in transitive
  dependencies of `express` 4.22.1 — `body-parser` and `qs`, all denial-of-service
  class. They are **not fixed here**: this harness is a loopback-bound local mock
  server that is never deployed and never internet-facing, and changing dependency
  versions would move the toolchain the recorded baseline was verified against.
  Recorded for a separate toolchain decision.
- **Dev origins.** The harness requires `http://127.0.0.1:3001` and
  `http://localhost:3001`, both currently present in the Worker's
  `ALLOWED_ORIGINS`. Any later removal of dev origins must keep the local suite
  runnable or move it off the Worker path.
- Dependencies and generated artifacts are **not** committed: `node_modules/`,
  `.env`, `.env.*`, `.dev.vars*` remain ignored.
