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

- an allowlist path is absent from the commit;
- the worktree is dirty and you are building `HEAD` (the recorded `--commit-hash`
  would otherwise describe bytes that were never uploaded);
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
