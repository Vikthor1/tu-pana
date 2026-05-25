---
Last updated: 2026-05-25
Source: docs/current-architecture.md
Upload-safe: YES
Sanitized: internal URLs, config values, and API endpoint details removed
Next review: after Tier 4 completion or major architectural change
---

# Tu Pana de Escritura — Architecture Overview

*This document describes the app's structure, design decisions, and architectural constraints at an orientation level. It is not a live code reference — consult `docs/current-architecture.md` for the authoritative technical detail.*

---

## Overall structure

Tu Pana is a vanilla JavaScript single-page web application with no build step, no framework, and no backend. It runs as a static site. The HTML shell, all styling, and all application logic are loaded directly by the browser from static files.

The application is organized into eight JavaScript modules loaded in a specific order, with a single CSS file and a single HTML shell:

- **HTML shell** — structure only; no inline JavaScript or CSS
- **CSS** — all styling in one file; mobile breakpoints appended at the end
- **JavaScript modules** — eight files, loaded in dependency order (see below)

---

## Module structure and responsibilities

Eight JavaScript files are loaded in strict order. Each has a defined responsibility and must not absorb concerns from adjacent files.

| Module | Responsibility |
|--------|---------------|
| `config.js` | Application configuration (connection settings, model preferences) |
| `data.js` | Pure data: stage definitions, icons, stage transition labels, sub-steps |
| `genre-template.js` | Feature flags, stable stage IDs, genre template registry, schema versioning |
| `prompts.js` | Coach prompts, research strategies, voice polish routes, affirmations |
| `ai-provider.js` | AI provider abstraction: prompt assembly, provider routing |
| `storage.js` | Export, import, and clear functions for all persistent data |
| `ui.js` | Runtime state, DOM cache, all rendering and coaching functions |
| `app.js` | Initialization sequence and development tooling |

The load order is enforced: each module depends on globals defined by the modules before it. `ui.js` depends on data from all six preceding modules. `app.js` calls functions defined in `ui.js`.

---

## Key design decisions

**No framework, no build step.** The app uses vanilla JavaScript with classic global scripts — no React, Vue, Angular, TypeScript, or bundler. All scripts are globals; there are no ES modules. This is intentional: the app needs to run in any browser, be debuggable without tooling, and be maintainable by a solo developer without a build pipeline.

**No backend.** All student data is stored locally in the browser via `localStorage`. There is no server, no database, no authentication, and no cloud sync. The AI coach connection is optional — offline mode is the default and is fully functional without any internet connection. This design prioritizes student privacy and equity: students in low-connectivity environments can use the full app.

**Feature flags.** The `genre-template.js` module introduces a `FEATURES` flags object that gates experimental functionality. At the time of this writing, the live flag is `geminiProvider: true`; flags for genre selection, instructor settings, and process logging remain `false` pending further development. New capabilities are added behind flags before being enabled.

**Stable stage IDs.** Each of the ten stages has both a numeric index (1–10) and a stable string identifier (e.g., `'stage.pitch'`, `'stage.authorship'`). The string IDs are used for AI context injection and event logging, so they must not change once established. The numeric indexes drive UI logic.

**AI provider abstraction.** The `ai-provider.js` module isolates AI provider logic from the rest of the app. The current live provider is Gemini Flash-Lite, accessed via a proxy. Ollama (local model) and offline mode are also supported. Switching providers requires changes only in `ai-provider.js` and `config.js`, not in the UI layer.

**Authorship gate.** Stage 6 enforces an unassisted first-draft requirement. The draft save action locks the editor and sets a persistent flag (`draftSaved`) that must be true before revision features activate. This gate has academic integrity and IRB implications and is architecturally protected — it must not be weakened.

---

## Ten-stage flow and draft control states

| Stage | Name | Draft control state |
|-------|------|-------------------|
| 1–5 | Anécdota through Esquema | Advance button enabled; save button hidden |
| 6 | Borrador (Authorship Gate) | Save button shown full-width; advance button disabled until draft saved |
| 7–9 | Revisión through Checklist | Save button hidden; advance button enabled; revision panels injected |
| 10 | Capstone | No footer buttons; capstone modal takes over |

---

## Persistent storage model

All student data is stored in `localStorage` with a consistent `tupana_` prefix. Key categories:

- **Writing content** — per-stage textarea content stored independently (`tupana_writing_s1` through `tupana_writing_s10`); Stage 6 canonical save in `tupana_draft`
- **Progress state** — current stage, draft saved flag, completion flags for onboarding modules
- **Session data** — chat log (max 120 entries), session count, streak data
- **Revision work** — decision log, Voice Vault protected phrases, evaluation ratings
- **Capstone** — structured JSON with ratings, reflections, and student response
- **Preferences** — language setting, tone preference, coach mode, UI preferences
- **Schema** — version stamp and active template ID for future migration safety

**Key constraint:** localStorage key names must not be renamed. Renaming them would silently break active student sessions by making their saved progress unreadable.

---

## Mobile architecture

The app uses two breakpoints:

- **≤ 768px** — touch targets enlarged, modals tightened
- **≤ 480px** — layout switches from two-panel (draft left, chat right) to a tabbed single-panel interface

On small screens, a tab bar allows students to switch between the Draft panel and the Coach panel. Tab state persists through certain actions (e.g., after completing onboarding, the app automatically switches to the Chat tab).

---

## What this app is not

These are deliberate architectural decisions, not gaps:

- Not a single-page app with a router — navigation is stage-based, not URL-based
- No ES modules — all scripts are classic globals
- No TypeScript — no transpilation step
- No state management library — `state` is a plain JavaScript object
- No CSS preprocessor — styles are hand-authored vanilla CSS
- No versioning scheme beyond git — the commit log is the release history
