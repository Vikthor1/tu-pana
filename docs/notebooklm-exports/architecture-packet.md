---
Last updated: 2026-06-05
Source: docs/current-architecture.md, 01_projects/tupana/context.md (VC-OS), git log
Upload-safe: YES
Sanitized: internal URLs, config values, API endpoint details, and Cloudflare Worker configuration removed
Next review: after pilot completion or major architectural change
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

## Mobile architecture (updated June 2026)

The app uses two breakpoints:

- **≤ 768px** — touch targets enlarged, modals tightened
- **≤ 480px** — layout switches from two-panel (draft left, chat right) to a tabbed single-panel interface; language selector switches from 3-button pill to compact native dropdown

On small screens, a tab bar allows students to switch between the Draft panel and the Coach panel. Tab state persists through certain actions (e.g., after completing onboarding, the app automatically switches to the Chat tab).

**Mobile header (as of 2026-06-05, commits f2cb715 + 8cb30b5):**

| Element | Desktop | Mobile (≤480px) |
|---------|---------|-----------------|
| App title | "Tu Pana de Escritura" (full) | "Tu Pana" (short form; aria-label preserves full name) |
| Branding icon | Animated laptop-and-coffee icon in banner | Same icon, header simplified |
| Language selector | 3-button pill (ES · EN · BI) | Native `<select>` (~48px wide) with options ES / EN / BI |
| Bug report button | "🐞 Problema · Problem?" | "🐞" (emoji only; label hidden ≤640px) |

The mobile language selector uses a native `<select>` element (`#langSelectMobile`) distinct from the desktop 3-button group (`#langSwitcher`). Both are kept in sync by the shared `setLang()` function — the single source of truth for all language switching. Any code that changes the language must call `setLang()` rather than directly manipulating DOM elements.

---

## Deployment status

**GitHub Pages:** Verified live as of 2026-06-05 (session 63). The app is hosted as a static site on GitHub Pages from the main branch. No server, no CI pipeline, no build step — the site is the repo. Deployment is automatic on every push to main.

**Brightspace iframe:** Designed for iframe embedding in CUNY Brightspace. The `allow-downloads` sandbox attribute must be set by CUNY admin for downloads to work in Safari — this is a known constraint documented in the app's active risks. In-app copy-to-clipboard is the fallback.

---

## Bug report system (activated 2026-06-05, commit cd0168e)

A student-facing bug report button appears in the app header. When activated, it opens a Google Form in a new tab. The form URL is stored in `CONFIG.bugReportUrl` in `assets/js/config.js` — the single activation point.

Privacy: the only query parameters sent to the form are stage number, stage name (English), language setting, provider/mode, and timestamp. No student writing, chat content, draft text, name, email, or ID is ever sent. These bounds are enforced by the app and must be maintained for any future enhancement to the bug report feature.

When the URL is empty (not configured), the button displays an `aria-disabled="true"` state and shows a bilingual message instructing students to tell the instructor. The button remains keyboard-discoverable in the disabled state.

---

## Pilot configuration (Summer 2026)

For the LAC 118 pilot, the app has been configured as follows:

- **Visible coach modes:** Offline and Gemini only. The Ollama button is hidden from the student interface via `style="display:none"` in `index.html`. This is a pilot-scoped suppression, not a permanent removal — the Ollama code path remains intact and must be restored after the pilot if instructor/dev use is desired.
- **Stage 1 entry message:** Explicitly inoculates against ChatGPT-expectation mismatch with "Tu Pana makes questions — it does not write the essay for you" before the first coach interaction.
- **Progress panel:** Collapsed by default. Students can expand it; the state persists across sessions via `tupana_progress_collapsed`.

---

## What this app is not

These are deliberate architectural decisions, not gaps:

- Not a single-page app with a router — navigation is stage-based, not URL-based
- No ES modules — all scripts are classic globals
- No TypeScript — no transpilation step
- No state management library — `state` is a plain JavaScript object
- No CSS preprocessor — styles are hand-authored vanilla CSS
- No versioning scheme beyond git — the commit log is the release history
- No backend, no authentication, no cloud sync — all student data is local to the student's device
