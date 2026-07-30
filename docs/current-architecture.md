# Tu Pana de Escritura — Current Architecture

Last updated: 2026-05-13 (post-Tier-2, post-Gemini-live, Mi Toolkit added)

## File map

```
tu-pana/
├── index.html              HTML shell only. No inline JS or CSS.
│
├── assets/
│   ├── css/
│   │   └── styles.css      All CSS. Mobile breakpoints appended at end.
│   └── js/
│       ├── config.js       CONFIG object: embed URLs, userId, Ollama settings (url, model, keepAlive, options).
│       ├── data.js         Pure data: ICONS, getIcon(), STAGES, STAGE_TRANSITIONS, STAGE_STEPS.
│       ├── genre-template.js  FEATURES flags, APP_CONFIG, STAGE_IDS (10 stable string IDs),
│       │                      AUTHORSHIP_GATE, mixedGenreAutobiographicalEssay template,
│       │                      genreTemplateRegistry, getActiveTemplate(), getStageId(),
│       │                      getTemplateStageData(), PROCESS_LOG_KEY, initSchemaVersion().
│       ├── prompts.js      MICRO_PROMPTS, STUCK_AFFIRMATIONS, PANA_HINTS, REVISION_SMALL/BIG,
│       │                   RESEARCH_STRATEGIES, VOICE_POLISH_ROUTES + display functions.
│       ├── ai-provider.js  AI_PROVIDER constant, buildCoachPrompt() layer assembler,
│       │                   sendCoachMessage() provider router.
│       ├── storage.js      exportData(), importData(), clearAllData() — includes all 10 per-stage keys.
│       ├── ui.js           state, DOM cache (D), ALL rendering + coaching functions.
│       └── app.js          Inline init sequence + dev bar.
│
├── docs/                   Project documentation (AI-readable, committed).
├── prompts/                QA and prompt library (committed).
├── README.md               Public-facing setup and usage guide.
└── .gitignore              Allowlist-style — ignores everything not explicitly permitted.
```

## Script load order

```html
<script src="assets/js/config.js"></script>         <!-- 1. CONFIG global -->
<script src="assets/js/data.js"></script>            <!-- 2. STAGES, ICONS, STAGE_TRANSITIONS, STAGE_STEPS -->
<script src="assets/js/genre-template.js"></script>  <!-- 3. FEATURES, STAGE_IDS, template registry -->
<script src="assets/js/prompts.js"></script>         <!-- 4. MICRO_PROMPTS, PANA_HINTS, REVISION_* -->
<script src="assets/js/ai-provider.js"></script>     <!-- 5. AI_PROVIDER, buildCoachPrompt, sendCoachMessage -->
<script src="assets/js/storage.js"></script>         <!-- 6. exportData, importData, clearAllData -->
<script src="assets/js/ui.js"></script>              <!-- 7. state, D, all render functions -->
<script src="assets/js/app.js"></script>             <!-- 8. init sequence (runs immediately, no wrapper) -->
```

Order matters. `ui.js` depends on data from files 1–6. `app.js` calls functions defined in `ui.js`.

## Key globals

| Symbol | Defined in | What it is |
|--------|-----------|------------|
| `CONFIG` | config.js | Embed URLs, userId, Ollama url/model/keepAlive/options |
| `STAGES` | data.js | Array of 10 stage objects `{id, es, en, desc}` |
| `STAGE_TRANSITIONS` | data.js | Per-stage CTA labels and completion text |
| `STAGE_STEPS` | data.js | Sub-steps within each stage |
| `ICONS` | data.js | SVG icon library (keyed by name) |
| `FEATURES` | genre-template.js | Feature flags: `geminiProvider=true` (live default), `genreSelection=false`, `instructorSettings=false`, `processLog=false` |
| `STAGE_IDS` | genre-template.js | Stable string IDs for each stage (e.g., `'stage.pitch'`) |
| `MICRO_PROMPTS` | prompts.js | Per-stage micro-task + sentence starter arrays |
| `PANA_HINTS` | prompts.js | Coach nudge strings |
| `RESEARCH_STRATEGIES` | prompts.js | Stage 4 clickable research starter cards |
| `VOICE_POLISH_ROUTES` | prompts.js | Stage 8 voice polish route definitions |
| `AI_PROVIDER` | ai-provider.js | `'gemini'` — Gemini Flash-Lite via Cloudflare Worker is the live default; Ollama and Offline also valid |
| `state` | ui.js | Runtime state: stage, done, draftSaved, lang, tone, etc. |
| `D` | ui.js | DOM cache object — avoids repeated getElementById calls |

## Runtime state object (`state`)

```js
{
  stage, done,          // current stage (1–10), Set of completed stage ids
  draftSaved,           // authorship gate flag (Stage 6)
  connected,            // provider readiness flag (set by Gemini/Ollama setCoachMode branches)
  lang, tone,           // 'es'|'en'|'both', 'gentle'|'direct'
  coachMode,            // 'offline'|'ollama'|'gemini' — persisted in localStorage
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
| `tupana_draft` | Student draft text (Stage 6 canonical save) |
| `tupana_writing_s1` … `tupana_writing_s10` | Per-stage textarea content — independent storage for each stage |
| `tupana_draft_saved` | Authorship gate flag |
| `tupana_chatlog` | Full chat log (max 120 entries), JSON |
| `tupana_theme` | `'light'`\|`'dark'` |
| `tupana_lang` | `'es'`\|`'en'`\|`'both'` |
| `tupana_tone` | `'gentle'`\|`'direct'` |
| `tupana_coach_mode` | `'offline'`\|`'ollama'`\|`'gemini'` |
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
| `tupana_process_log` | JSON — process event log; 8 events wired via `logProcessEvent()` |
| `tupana_schema_version` | `'1.0'` — stamped on first load by `initSchemaVersion()` |
| `tupana_template_id` | Active genre template ID (default: `'mixed_genre_autobiographical'`) |
| `tupana_completion_shown` | Completion celebration shown flag |
| `tupana_revision_checkpoint` | JSON — student-reported instructor direction, explicitly unverified, tied to assignment and first-draft signature |
| `tupana_full_draft_reviews` | JSON — privacy-safe full-draft review metadata (never draft text) |
| `tupana_ai_usage` | JSON — local aggregate AI request/token counts by request kind |
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
| `goToStage(id)` | ui.js | Central stage transition. Saves per-stage work, fires phase notes, injects panels, updates state. |
| `updateDraftControls()` | ui.js | Shows/hides Guardar and Continuar based on stage. Single source of truth for footer UI. |
| `executeSave()` | ui.js | Authorship gate. Locks editor, sets draftSaved flag, writes tupana_writing_s6. |
| `saveStageWork(stageNum, text)` / `loadStageWork(stageNum)` | ui.js | Per-stage writing storage. Called inside goToStage() on transition. |
| `initDL()` | ui.js | Provider router: Gemini fast-path → Ollama fast-path → `setCoachMode('offline')`. |
| `sendCoachMessage({message, stageId})` | ai-provider.js | Top-level outbound call from `submitChat()`. Delegates to `sendMsg()`. |
| `sendMsg(text)` | ui.js | Internal outbound: branches on gemini → ollama → offline. |
| `callLocalCoachProvider(text)` | ui.js | Ollama entry point. Reads state.lang + last bot message from chatlog. |
| `callOllamaDirect({...})` | ui.js | POST to CONFIG.ollamaUrl/api/chat. stream:false. Sends keep_alive + options from CONFIG. |
| `buildOllamaSystemPrompt(lang)` | ui.js | Full pedagogical system prompt. Stage-specific rules pulled from getActiveTemplate(). |
| `generateCoachResponse(text)` | ui.js | Raw-text getter for app-triggered coach calls (Stage 10). Returns text or null. |
| `addMsg(text, who, skipLog, msgType)` | ui.js | All chat messages go through here. |
| `buildMap()` | ui.js | Renders journey map from PHASES + STAGES. |
| `injectCapstonePanel()` | ui.js | Stage 10 only. Injects 10A/10B/10C card structure. |
| `generateInstructorReport()` | ui.js | Builds the plain-text instructor report for Stage 10 completion. |
| `injectResearchCard()` | prompts.js | Stage 4 only. Injects amber-guardrail research starter card with 4 clickable prompts. |
| `injectVoicePolishCard()` | prompts.js | Stage 8 only. Replaces revision panel. 5-route voice polish flow. |
| `initSelectionToCoach()` | ui.js | IIFE. Floating button on text selection in draftArea. Stage-aware framing, no auto-send. |
| `openMsgEvalDrawer(msgId)` | ui.js | Five Questions eval modal. Silent picks (no sendMsg). Centered overlay / bottom-sheet at ≤430px. |
| `getActiveTemplate()` | genre-template.js | Returns active genre template (default: mixedGenreAutobiographicalEssay). |
| `getStageId(stageNum)` | genre-template.js | Maps stage number (1–10) to stable string ID. |
| `openToolkitPanel()` | ui.js | Opens Mi Toolkit and provides the optional no-AI Tu Conocimiento entry point. Existing knowledge state remains local. |

## What this app is NOT

- Not a SPA. No router.
- No ES modules (`type="module"`). All scripts are classic globals.
- No TypeScript. No transpilation.
- No state management library. `state` is a plain object in ui.js.
- No CSS preprocessor. Styles are hand-authored vanilla CSS.
