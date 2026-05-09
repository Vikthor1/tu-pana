# Aider Preparation Notes — Tu Pana de Escritura

*Aider is not yet installed. This document records preparation so setup is fast when the time comes.*

---

## Safe first targets

Start Aider experiments on these files only:

| File | Why it's safe |
|------|--------------|
| `assets/js/config.js` | 14 lines. One object. No dependencies on other files. |
| `assets/js/storage.js` | 76 lines. Three isolated functions. |
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

## Before installing Aider

- [ ] `pip install aider-chat` (or `pipx install aider-chat`)
- [ ] Test first on `config.js` — smallest possible change
- [ ] Confirm Aider can read `docs/` context files
- [ ] Confirm commit format matches project git log style
