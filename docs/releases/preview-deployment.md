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
of `studio.html`, `index.html`, and `start-here.html`, and from the audio literals
in `assets/js/ui.js`, then fails if the allowlist does not cover it. **Add a
`<script src>` and forget the allowlist, and `npm test` goes red** — before the
deploy, not as a 404 in front of a writer. It also pins the exclusions by class
(no `*_test.mjs`, no `.md`, no `docs/**`, `server/**`, `prompts/**`, no dotfile, no
lockfile, no `.map`, no env file), so a future convenience edit cannot quietly
re-publish internals.

## What is served, and why

**Writing Studio — the canonical surface.** `studio.html` plus its seven declared
dependencies. It has no fonts, no images, no audio, and makes no request to any
repository path; its only outbound origin is the Gemini proxy Worker.

**Legacy app (`index.html`) and tutorial (`start-here.html`).** Retained for
**continuity**, not because the Studio needs them — the Studio links to neither and
has its own tour. Writing done on this origin lives in *this origin's*
`localStorage`. Unpublishing `index.html` would leave that work present but
unreadable and unexportable, which is not an acceptable side effect of a
deployment-integrity fix.

> **This is a continuity decision, not a ruling that the legacy surface stays
> indefinitely.** Any retirement, migration, archival access path, or student
> notice is a separate decision requiring its own bounded authorization.

**Not served:** `explore.html` and the exploration prototype's CSS and JS — nothing
in either student-facing runtime references them, and the standing constraint is
that the exploration prototype must never be publicly reachable on a student-facing
surface.

## Scope of the boundary

It narrows what the preview *serves*. It is **not** a security certification of the
preview. Preview deployments remain **public** — the URL is the only barrier, which
is a limit and never a control. Access control, rate limiting, WAF, headers, and
the Worker's own origin allowlist are all out of scope and unchanged.
