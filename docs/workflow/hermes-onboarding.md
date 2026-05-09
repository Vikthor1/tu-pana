# Hermes Onboarding Brief — Tu Pana de Escritura

*For local model context injection via Ollama. Optimized for efficient context use. Read fully before acting on any task.*

---

## What this project is

A bilingual (Spanish/English) AI-assisted writing coach for community college students. Students write a mixed-genre autobiographical essay through 10 guided stages. The app is fully static: no server, no build step, no login. All data lives in browser `localStorage`. Deployed on GitHub Pages.

Test server (local only): `python3 -m http.server 8000`

---

## File map and safe inspection targets

| File | Lines | Safety |
|------|-------|--------|
| `assets/js/config.js` | 14 | **Safe** — CONFIG object only |
| `assets/js/storage.js` | 76 | **Safe** — three isolated functions |
| `assets/js/app.js` | 128 | **Caution** — init sequence, order-sensitive |
| `assets/js/data.js` | ~282 | **Safe** — pure data: STAGES, ICONS, TRANSITIONS |
| `assets/js/prompts.js` | ~373 | **Safe** — coaching content, no stage logic |
| `assets/js/ui.js` | ~4,480 | **Large** — target by function name only, never full file |
| `assets/css/styles.css` | ~4,622 | **Large** — target by selector only, never full file |
| `index.html` | ~955 | **Caution** — DOM IDs are contracts referenced in ui.js |

`ui.js` and `styles.css` are too large for full local-model inspection. When given a task in these files, request the specific function or selector excerpt — not the whole file.

---

## NEVER do any of the following

- Rename any `tupana_*` localStorage key — silently destroys student sessions
- Change the script load order: `config → data → prompts → storage → ui → app`
- Modify `executeSave()` or `updateDraftControls()` without explicit human sign-off — authorship gate with IRB implications
- Add `type="module"` to any script tag — breaks the global scope model
- Add any runtime dependency (CDN library, framework, package)
- Write student-facing Spanish text without also providing the English equivalent
- Rewrite or refactor large sections — only edit the named function or data structure

---

## SHOULD help with

- Coaching content edits in `prompts.js` (micro-prompts, hints, revision categories)
- Data updates in `data.js` (stage names, transition labels, step definitions)
- Small targeted edits to named functions in `ui.js`
- Config changes in `config.js`
- Documentation updates in `docs/`

---

## Key constraints (every edit)

1. No build step — files served as-is
2. No frameworks — vanilla JS only
3. All student-facing text must be bilingual (ES + EN)
4. Offline mode must always work (coach connection is optional)
5. Edit only what is named in the task — nothing adjacent

---

## How to orient quickly

To understand the system before any edit, read these two files in order:

1. `docs/project-brief.md` — what the app is and its pedagogical constraints
2. `docs/current-architecture.md` — file map, globals, localStorage keys, key functions

These two files are sufficient context for most tasks.

---

## Architecture in one paragraph

Single HTML file loads six JS files as classic globals (no modules, no bundler). A `state` object in `ui.js` drives all runtime behavior. `D` is a DOM cache object. `STAGES`, `TRANSITIONS`, and coaching content are defined in `data.js` and `prompts.js`. All student data persists in `localStorage` under `tupana_*` keys. The AI coach (DirectLine or Dify embed) is optional — the app works fully without it.
