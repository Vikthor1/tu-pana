# Aider Preparation Notes — Tu Pana de Escritura

*Aider is installed via pipx (Python 3.9). Run from `/Users/Victor1/Sites/tupana`. Model and safety defaults are set in `.aider.conf.yml`.*

---

## Safe first targets

Start Aider experiments on these files only:

| File | Why it's safe |
|------|--------------|
| `assets/js/config.js` | 14 lines. One object. No dependencies on other files. |
| `assets/js/storage.js` | 76 lines. Three isolated functions. **Key-array edits: use Claude's Edit tool directly — see Known unreliable patterns.** |
| `assets/js/data.js` | ~282 lines. Pure data — no DOM, no state. |
| `assets/js/prompts.js` | ~373 lines. Coaching content — no stage logic. |

---

## Risky files (use with care)

| File | Why it's risky |
|------|---------------|
| `assets/js/ui.js` | ~4,480 lines. Contains authorship gate, all stage logic, Voice Vault, Capstone. Always name the exact function. Never ask Aider to refactor or clean up. |
| `assets/css/styles.css` | ~4,622 lines. Cascade order matters. Always name the exact selector or section. |
| `index.html` | ~955 lines. DOM IDs are contracts referenced by name in ui.js. Never rename or remove elements. |
| `assets/js/app.js` | 128 lines. Init sequence is order-sensitive. |

---

## Safe editing patterns

**Always:**
- Name the exact function or data structure: "edit the `showStuckMini` function in `prompts.js`"
- Include constraints in the Aider prompt: "do not touch `executeSave` or `updateDraftControls`"
- Review the full diff before accepting any change
- Run `prompts/qa-scenarios.md` after any change to `ui.js`

**Never:**
- Ask Aider to "refactor", "clean up", or "improve" a large file
- Ask Aider to add a new `<script>` tag or change the load order
- Ask Aider to rename any `tupana_*` localStorage key
- Accept a diff that touches more files than the task required

---

## Hermes model constraints

These constraints were confirmed during the first live Aider session (2026-05-09). Violations produce destructive output caught only by `--dry-run`.

| Constraint | Detail |
|-----------|--------|
| **Always use `--edit-format diff`** | Hermes fails the `whole` format on files longer than ~50 lines. It collapses content into `// ... rest of content ...` stubs, deleting the file body. |
| **Never use whole-file edit mode** | Do not omit `--edit-format diff`. The default `whole` format is unsafe with Hermes for any non-trivial file. |
| **Always target files explicitly** | Pass the file path as a positional argument: `aider docs/local-models.md`. Never let Aider infer what to edit. |
| **Single targeted line changes only** | Hermes is reliable for 1 line per SEARCH/REPLACE block. For 2+ coordinated changes in the same block, use `--dry-run` and strongly prefer Claude's Edit tool if output shows any ambiguity. |
| **Use `--dry-run` for all first attempts** | Any new task type or file not previously tested gets a dry-run before the live edit. Review the proposed diff before proceeding. |
| **Reject imperfect dry-run output immediately** | If the dry-run shows partial application, reordered expressions, spurious comments, or scope errors — discard entirely. Do not try to salvage it. |
| **Review `git diff` before committing** | After every live Aider edit, run `git diff` and confirm only the intended lines changed. |
| **No auto-commits** | `auto-commits: false` is set in `.aider.conf.yml`. Never override this. Human review and commit message are always required. |

### When to fall back to Claude's Edit tool

Discard Aider/Hermes output and apply directly if the dry-run shows any of these:

- **Partial application** — only some of the requested lines were changed
- **Order changes** — attributes, arguments, or expressions reordered without being asked
- **Spurious comments** — `// changed here`, `// modified`, or similar debug artifacts in production code
- **Extra deletions or additions** — REPLACE block touches more lines than the SEARCH warranted
- **Structural scope errors** — closing braces missing from or added to the REPLACE block

Seeing one of the above is not a Hermes failure — it is the `--dry-run` protocol working correctly. Discard the output, apply the edit directly with Claude's Edit tool, verify with `git diff`, and proceed normally.

**Confirmed on 2026-05-09** (data.js `getIcon` fix): Hermes correctly identified the `ah` line fix but missed the `style` fix, swapped attribute order, and added spurious inline comments. Dry-run prevented the write; Claude's Edit tool applied the correct 3-line change.

### Known unreliable patterns — skip dry-run, use Claude's Edit tool directly

Some task types have failed Hermes dry-runs three or more consecutive times with no clean output. For these, skip the dry-run entirely and apply with Claude's Edit tool, then verify with `git diff`.

| File | Task type | Failure mode observed | Confirmed |
|------|-----------|----------------------|-----------|
| `assets/js/storage.js` | Adding a key to `exportData()` or `clearAllData()` key arrays | Three consecutive failures (2026-05-09): SEARCH block omitted `tupana_lang`; wrong section targeted (forEach body instead of array); completely wrong section (blob/download code) with unwanted additions and deletions | 2026-05-09 (M1a, M1b, S2) |

**Protocol for known-unreliable patterns:** Apply the edit directly with Claude's Edit tool. Use unique surrounding context to disambiguate identical-looking lines (e.g., `tupana_lang` is present in `exportData`'s array but absent from `clearAllData`'s). Always run `git diff` after and confirm only the intended line changed before committing.

**Standard Aider invocation for Hermes:**

```bash
aider <file> \
  --edit-format diff \
  --message "..." \
  --dry-run \       # remove after reviewing dry-run output
  --yes-always
```

---

## Branching strategy

**For safe files** (`config.js`, `data.js`, `prompts.js`, `storage.js`): work directly on `main` if `git status` is clean.

**For any change to `ui.js`**: create a short-lived branch, merge after manual QA.

```bash
# Before any Aider session touching ui.js
git status                        # must be clean
git checkout -b dev/task-name

# After Aider applies changes — review diff, run QA, then:
git checkout main
git merge dev/task-name
git branch -d dev/task-name
```

---

## Context to pass Aider per task type

**For `ui.js` tasks:**
- `docs/project-brief.md`
- `docs/current-architecture.md` (Key functions table)
- The specific function excerpt (not the whole file)

**For `data.js` or `prompts.js` tasks:**
- The full file (small enough to fit)
- `docs/project-brief.md`

---

## Commit messages after Aider edits

Aider generates commits automatically. Rewrite the message to describe *why*:

```
# Too vague:
"Update prompts.js"

# Right:
"Add time-pressed variant to Stage 3 micro-prompts (single-task, no lists)"
```

---

## First-session checklist (completed 2026-05-09)

- [x] `pipx install aider-chat --python /opt/homebrew/bin/python3.9`
- [x] `.aider.conf.yml` configured: model, API base, safety defaults
- [x] Dry-run validated on `docs/local-models.md` — caught destructive whole-file output from Hermes
- [x] Confirmed `--edit-format diff` required for Hermes on files > ~50 lines
- [x] First code edit: `config.js` — single comment addition, clean SEARCH/REPLACE
- [x] Second code edit: `storage.js` — single key added to array, clean SEARCH/REPLACE
- [x] Third code edit: `data.js` — 3-line coordinated change; dry-run caught partial/incorrect output; Claude's Edit tool applied correctly. Confirmed Hermes reliable limit: 1 line per block.
