# Tu Pana de Escritura — Current Architecture

Last updated: 2026-05-09 (post-modularization, post-mobile pass)

## File map

```
tu-pana/
├── index.html              HTML shell only (~955 lines). No inline JS or CSS.
│
├── assets/
│   ├── css/
│   │   └── styles.css      All CSS (~4,622 lines). Mobile breakpoints appended at end.
│   └── js/
│       ├── config.js       14 lines. CONFIG object: embed URLs, userId, coach mode flag.
│       ├── data.js         ~282 lines. Pure data: ICONS, getIcon(), STAGES, STAGE_TRANSITIONS, STAGE_STEPS.
│       ├── prompts.js      ~373 lines. Coaching content + display functions (showStuckMini, etc.).
│       ├── storage.js      76 lines. exportData(), importData(), clearAllData().
│       ├── ui.js           ~4,480 lines. Everything else: state, DOM cache (D), all render functions.
│       └── app.js          128 lines. Inline init sequence. Runs immediately after DOM is ready.
│
├── docs/                   Project documentation (AI-readable, committed).
├── prompts/                QA and prompt library (committed).
├── README.md               Public-facing setup and usage guide.
└── .gitignore              Allowlist-style — ignores everything not explicitly permitted.
```

## Script load order

```html
<script src="assets/js/config.js"></script>   <!-- 1. CONFIG global -->
<script src="assets/js/data.js"></script>      <!-- 2. STAGES, ICONS, STAGE_TRANSITIONS, STAGE_STEPS -->
<script src="assets/js/prompts.js"></script>   <!-- 3. MICRO_PROMPTS, PANA_HINTS, REVISION_* -->
<script src="assets/js/storage.js"></script>   <!-- 4. exportData, importData, clearAllData -->
<script src="assets/js/ui.js"></script>        <!-- 5. state, D, all render functions -->
<script src="assets/js/app.js"></script>       <!-- 6. init sequence (runs immediately, no wrapper) -->
```

Order matters. `ui.js` depends on data from files 1–4. `app.js` calls functions defined in `ui.js`.

## Key globals

| Symbol | Defined in | What it is |
|--------|-----------|------------|
| `CONFIG` | config.js | Embed URLs, userId, coach mode |
| `STAGES` | data.js | Array of 10 stage objects `{id, es, en, desc}` |
| `STAGE_TRANSITIONS` | data.js | Per-stage CTA labels and completion text |
| `STAGE_STEPS` | data.js | Sub-steps within each stage |
| `ICONS` | data.js | SVG icon library (keyed by name) |
| `MICRO_PROMPTS` | prompts.js | Per-stage micro-task + sentence starter arrays |
| `PANA_HINTS` | prompts.js | Coach nudge strings |
| `state` | ui.js | Runtime state: stage, done, draftSaved, lang, tone, etc. |
| `D` | ui.js | DOM cache object — avoids repeated getElementById calls |

## Runtime state object (`state`)

```js
{
  stage, done,          // current stage (1–10), Set of completed stage ids
  draftSaved,           // authorship gate flag (Stage 6)
  connected, token,     // DirectLine connection
  lang, tone,           // 'es'|'en'|'both', 'gentle'|'direct'
  coachMode,            // 'offline'|'dify' — persisted in localStorage
  step,                 // sub-step within current stage
  welcomeShown,         // guards duplicate welcome messages
  offlineMsgShown,      // guards duplicate offline notices
  spotlightTarget,      // focus mode: 'coach'|'editor'|null
  draftFocus            // draft focus mode active
}
```

## localStorage keys

All keys use the `tupana_` prefix. **Do not rename** — renaming breaks existing student sessions.

| Key | What it holds |
|-----|--------------|
| `tupana_stage` | Current stage number |
| `tupana_draft` | Student draft text |
| `tupana_draft_saved` | Authorship gate flag |
| `tupana_chatlog` | Full chat log (max 120 entries), JSON |
| `tupana_theme` | `'light'`\|`'dark'` |
| `tupana_lang` | `'es'`\|`'en'`\|`'both'` |
| `tupana_tone` | `'gentle'`\|`'direct'` |
| `tupana_coach_mode` | `'offline'`\|`'dify'` |
| `tupana_mani_done` | Tu Conocimiento completed flag |
| `tupana_lab_done` | El Laboratorio completed flag |
| `tupana_mani_sentence` | Student's claimed language sentence |
| `tupana_mani_claimed` | JSON — claimed asset ids in Tu Conocimiento |
| `tupana_decisions` | JSON — revision decision log entries |
| `tupana_journey_expand` | Journey map expanded state |
| `tupana_sessions` | Session count + streak data |
| `tupana_capstone` | JSON — capstone ratings, reflections, student response |
| `tupana_step_N` | Sub-step for stage N (e.g., `tupana_step_7`) |
| `tupana_protected` | JSON — Voice Vault protected phrases |
| `tupana_report_meta` | JSON — `{studentName, assignmentTitle, courseSection}` |
| `tupana_process_note` | Process note textarea content |
| `tupana_completion_shown` | Completion celebration shown flag |
| `tupana_eval_stats` | Evaluation streak stats (via `EVAL_STATS_KEY` in ui.js) |
| `tupana_progress_collapsed` | Progress panel collapsed state (UI preference — survives reset) |
| `tupana_spotlight_off` | Spotlight feature disabled preference (UI preference — survives reset) |

## Mobile architecture

**Breakpoints:**

- `≤ 768px` — tap targets enlarged, modals tightened, report buttons wrap to 2-col grid
- `≤ 480px` — two-panel layout switches to single-panel tab interface

**Tab interface (≤480px):**

- `#mobileTabs` div with `#tabDraft` and `#tabChat` buttons
- `switchMobileTab(panel)` in ui.js toggles `mobile-panel-chat` class on `#main`
- CSS hides one panel at a time via `display:none !important`
- `notifyMobileChat()` adds a dot indicator to the Chat tab when the coach replies

**Key CSS:** Mobile additions are at the bottom of `styles.css` (clearly labeled with `2026-05-08` datestamp), after all existing rules.

## Stage logic summary

| Stage | Draft control state |
|-------|-------------------|
| 1–5 | Continuar enabled, Guardar hidden |
| 6 | Guardar shown full-width, Continuar disabled until draft saved |
| 7–9 | Guardar hidden, Continuar enabled; revision panels injected |
| 10 | No footer buttons; capstone panel takes over |

## Key functions to know before editing

| Function | File | Why it matters |
|----------|------|----------------|
| `goToStage(id)` | ui.js | Central stage transition. Fires phase notes, injects panels, updates state. |
| `updateDraftControls()` | ui.js | Shows/hides Guardar and Continuar based on stage. Single source of truth for footer UI. |
| `executeSave()` | ui.js | Authorship gate. Locks editor, sets draftSaved flag, triggers save ceremony modal. |
| `initDL()` | ui.js | DirectLine / Dify coach connection. Contains offline fallback path. |
| `addMsg(text, who, skipLog, msgType)` | ui.js | All chat messages go through here. |
| `buildMap()` | ui.js | Renders journey map from PHASES + STAGES. |
| `injectCapstonePanel()` | ui.js | Stage 10 only. Injects 10A/10B/10C card structure. |
| `generateInstructorReport()` | ui.js | Builds the plain-text instructor report for Stage 10 completion. |

## What this app is NOT

- Not a SPA. No router.
- No ES modules (`type="module"`). All scripts are classic globals.
- No TypeScript. No transpilation.
- No state management library. `state` is a plain object in ui.js.
- No CSS preprocessor. Styles are hand-authored vanilla CSS.
