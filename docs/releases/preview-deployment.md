# Preview deployment — the artifact boundary

*Applies to the bounded Cloudflare Pages preview `tupana-preview` only. Production
(`main` via GitHub Pages) is a different path and is **not** covered here — see
`release-checklist.md`.*

---

## What changed, and why

Through 2026-08-08 the preview was deployed as `git archive <commit>` — the whole
tracked tree, 231 files. Everything in the repository was therefore publicly
retrievable at `https://tupana-preview.pages.dev/<path>`, and verified so: the
regression suites, `run_test_suite.mjs`, `test-server.js`, `package.json`, the
lockfile, `.gitignore`, `.nvmrc`, `README.md`, all of `docs/**` and `prompts/**`,
and the Worker source and `wrangler.toml` all returned HTTP 200.

No credential was ever in that tree — the provider key lives server-side in the
Worker, and repeated scans found none — so this was **exposure of internals, not
a secret leak**. It was still wrong: repository internals are not deployment
artifacts.

The correction is an **explicit allowlist** in `scripts_build_preview_artifact.mjs`.
A denylist would need extending every time the repository grows. An allowlist only
needs extending when the *application* grows, which is rarer and more visible.

## Two lists, two questions

| File | Question it answers |
|---|---|
| `.gitignore` | What does git **track**? |
| `scripts_build_preview_artifact.mjs` → `PREVIEW_ARTIFACT` | What does Cloudflare **serve**? |

They are deliberately different. Neither of those two files is itself deployed.
**Adding a runtime file means editing both.**

## Building and deploying

```bash
# 1. clean tree, suite green
npm test

# 2. build the artifact OUTSIDE the repository (never into the worktree)
node scripts_build_preview_artifact.mjs /tmp/tupana-artifact

# 3. deploy
npx wrangler pages deploy /tmp/tupana-artifact \
  --project-name=tupana-preview \
  --branch=main \
  --commit-hash="$(git rev-parse HEAD)" \
  --commit-dirty=false
```

The builder prints `sha256  path` for every file, which is what post-deploy
byte-identity checks compare against.

### It fails closed

The builder exits non-zero, rather than shipping something partial, when:

- an allowlist path is absent from its source commit (the target commit for
  payload files; `HEAD` for the overlay pair under `--overlay-boundary`);
- the worktree is dirty and you are building `HEAD` (the recorded `--commit-hash`
  would otherwise describe bytes that were never uploaded);
- `--overlay-boundary` is given for `HEAD` (which needs no overlay), for a target
  that already contains either boundary file (ambiguous provenance), or while
  either overlay source file is dirty in the worktree;
- the out-dir already contains files (a stale build must not contribute to a new one);
- the written set does not match the allowlist **exactly, in both directions**;
- an allowlist entry would escape the artifact root, is duplicated, or lands empty.

Content is read with `git show <ref>:<path>`, never from the working tree, so
uncommitted edits, untracked scratch files, and ignored local material
(`node_modules/`, `.env`, `.dev.vars`, `.DS_Store`, `.wrangler/`) cannot reach the
artifact even by accident.

### The backstop

`studio_deploy_artifact_test.mjs` re-derives the dependency closure from the markup
of the served surfaces, then fails if the allowlist does not cover it. **Add a
`<script src>` and forget the allowlist, and `npm test` goes red** — before the
deploy, not as a 404 in front of a writer. It also pins the exclusions by class
(no `*_test.mjs`, no `.md`, no `docs/**`, `server/**`, `prompts/**`, no dotfile, no
lockfile, no `.map`, no env file, no `assets/audio/**`, no top-level
`assets/js/*.js`), so a future convenience edit cannot quietly re-publish internals
or the retired application.

Since W2 it also **executes** the builder: every automatable refusal it exercises
(usage, unknown ref, non-empty out-dir, overlay of `HEAD`, overlay of a commit
that already has the boundary, missing payload, plain build of a boundary-lacking
commit) is observed refusing on each run, and both sanitized replacement
artifacts are built into a temp dir and verified byte-for-byte **from the
artifact directory** — payload against the historical commit, overlay pair
against `HEAD` — because worktree-read checks cannot catch a mixed artifact.
The two dirty-tree guards require mutating the worktree and were observed
refusing **manually** (W2 evidence record); the overlay-source-absent-from-`HEAD`
branch is untestable at a `HEAD` that carries both boundary files and rests on
code review.

## Sanitized replacement rollbacks

Two historical preview surfaces are preserved as full-tree deployments that expose
repository internals, and both predate `404.html`/`_redirects`. Deleting the
exposed deployments is a **separately gated founder decision (step 2b)** that must
never leave a rollback gap — so sanitized replacements are created **first**:

```bash
# payload from the historical commit; ONLY 404.html + _redirects from HEAD
node scripts_build_preview_artifact.mjs /tmp/tupana-replacement \
  --ref <historical-commit> --overlay-boundary

# deploy as NON-PRODUCTION (branch ≠ main) so the serving alias never moves
npx wrangler pages deploy /tmp/tupana-replacement \
  --project-name=tupana-preview \
  --branch=rollback-<short-hash> \
  --commit-hash=<historical-commit-full> \
  --commit-dirty=false
```

- **The deploy must be non-production.** `--branch=main` would repoint
  `tupana-preview.pages.dev` at the replacement. A `rollback-*` branch name
  creates a preview deployment with its own immutable
  `<id>.tupana-preview.pages.dev` URL and leaves the alias serving what it served
  before — verify the alias byte-identical before and after.
- **One `--commit-hash` cannot describe a mixed artifact.** It records the
  payload commit; the overlay's true provenance lives in the builder's per-file
  report and the inventory below. Record both, or the replacement's description
  is partially false.
- **Verify on the immutable URL only, by content:** never-existed control first,
  then every excluded path must answer 404 **and** a body byte-identical to
  `404.html`; every served path byte-identical to the builder report. Never probe
  the canonical host.
- `a51aaff` has **no replacement by founder ruling** — its disposition (and
  `ed6dead8`'s) belongs to the step-2b deletion ruling.

### W2 replacement inventory

Bounded, durable record of the W2 sanitized-replacement work and its immediate
context — **not** a complete historical inventory of `tupana-preview`
deployments, and **not** the step-2b deletion inventory. Step 2b remains
separately gated and requires its own full inventory of the exposed historical
deployments plus `ed6dead8`; nothing here prepares or substitutes for it.
Ids are recorded **after** the deployment exists, never predicted.

| Deployment id | Source commit | Overlay | Purpose |
|---|---|---|---|
| `591679e9` | `6c18e1c` | — | Studio-only preview (Decision S); rollback anchor |
| `71ab741e` | `5d7303e` | — | Serving deployment behind the alias (W1-C release) |
| *pending — not yet deployed* | `6c8bc78` | `404.html`, `_redirects` ← HEAD | Sanitized replacement rollback (Decision D surface) |
| *pending — not yet deployed* | `d8ff0b0` | `404.html`, `_redirects` ← HEAD | Sanitized replacement rollback (1E surface) |

## The artifact — 10 paths

Nine served, one consumed as configuration.

| Path | Purpose |
|---|---|
| `studio.html` | The Writing Studio. The only application surface. |
| `assets/css/studio.css` | Its stylesheet. Every `url()` is an inline `data:`; no `@import`. |
| `assets/js/studio/studio-profiles.js` | Genre profiles — the eleven configurations. |
| `assets/js/studio/studio-provider.js` | Provider seam. Its one outbound `fetch` is the Gemini proxy Worker. |
| `assets/js/studio/studio-council.js` | Council safety kernel. |
| `assets/js/studio/studio-import.js` | Legacy-record import (reads `localStorage`, not the network). |
| `assets/js/studio/studio-tour.js` | Guided Discovery. |
| `assets/js/studio/studio-ui.js` | The desk itself. |
| `404.html` | Load-bearing boundary evidence — see below. |
| `_redirects` | Root entry. **Configuration, not a served path.** |

`studio.html` declares exactly the seven dependencies above and nothing more: no
fonts, no images, no audio, no request to any repository path.

## The legacy application was retired — 2026-08-08

Founder Decision R, step 1. The preview previously served *Tu Pana de Escritura*
(`index.html`) and its tutorial (`start-here.html`) alongside the Studio, on a
**continuity** assumption: unpublishing them would leave writing done on this origin
present in `localStorage` but unreadable.

That assumption was discharged by ruling. The pilots are complete, continuing access
to the legacy application is no longer a product requirement, and **both pilots ran
on production** (`vikthor1.github.io/tu-pana`) — this preview was created as a
household preview and never served an enrolled student. Retirement withdraws a
served interface; it destroys no data.

**Nineteen legacy-only files left the artifact**, none of them a Studio dependency:
`index.html`, `start-here.html`, `assets/css/styles.css`, nine legacy
`assets/js/*.js`, and seven `assets/audio/es/*.mp3`.

> **They remain git-tracked.** This boundary governs what Cloudflare *serves*, not
> what the repository *keeps* — roughly forty legacy regression suites still
> exercise those files. Removing them from the repository is a different decision.
> The backstop asserts both directions: excluded from the artifact, still tracked at
> `HEAD`.

**No export, migration, or recovery mechanism is part of this.** Any such window is
a separate founder ruling and must not be built, offered, or described as planned.

## The root entry

With no `index.html`, `/` would answer 404 — not an acceptable front door. A single
`_redirects` rule sends `/` to `/studio.html` with a **302**:

- **302, not 301.** A permanent redirect is cached by browsers indefinitely and
  would be effectively unrecallable from a device already holding it. The
  root-entry decision stays reversible.
- **The rule matches `/` exactly**, so existing `/studio.html?assignment=…` links
  are untouched.
- **No retired path is redirected.** `index.html` and `start-here.html` return a
  hard 404, and that 404 is the evidence of retirement — a courtesy redirect would
  erase it.

Cloudflare consumes `_redirects` as deployment configuration; it is not retrievable
as a path.

**`404.html`.** Load-bearing, not decoration. Cloudflare Pages answers any unmatched
path with `index.html` and **HTTP 200** unless a `404.html` exists — so without it an
excluded file is byte-indistinguishable from a served one and the exclusion cannot be
demonstrated at all. It is self-contained (inline CSS, no script, font, or image) so
it can never itself 404. It now offers exactly one destination: the page whose whole
job is honesty about absence must not itself link to something absent.

> Verify exclusion by **content**, not by status code. A 200 here never meant the file
> was still there; it meant Pages had fallen back. The first verification pass of this
> package reported 31 false failures for exactly that reason — the third time a
> post-deploy probe, rather than the product, has been the defect.

**Not served:** `explore.html` and the exploration prototype's CSS and JS — nothing
in either student-facing runtime references them, and the standing constraint is
that the exploration prototype must never be publicly reachable on a student-facing
surface.

## Scope of the boundary

It narrows what the preview *serves*. It is **not** a security certification of the
preview. Preview deployments remain **public** — the URL is the only barrier, which
is a limit and never a control. Access control, rate limiting, WAF, headers, and
the Worker's own origin allowlist are all out of scope and unchanged.
