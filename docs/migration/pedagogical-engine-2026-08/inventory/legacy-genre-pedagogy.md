# Legacy inventory — genre & stage pedagogy (agent report, 2026-08-04)

Source: read-only inventory of the legacy Writing Studio at R0 `1462aea` (files in this plane are
byte-identical to R0). Line references are against this plane's working tree at base `d8b92e8`.

## 1. Assignment / genre layers

### 1.1 Two distinct layering systems coexist

| System | Where | What it controls |
|---|---|---|
| **Genre *template*** (`genreTemplateRegistry`) | `assets/js/genre-template.js:74-201` | The 10-stage engine's `coachFocus` / `allowedSupport` / `blockedSupport`. Registry has exactly **one** entry: `mixed-genre-autobiographical-essay` (`:190-192`). `getActiveTemplate()` (`:199-201`) reads `APP_CONFIG.genre` (`:31`) and always returns the autobiographical essay. `FEATURES.genreSelection` is `false` (`:11`), so template switching is dead code. |
| **Assignment *layers*** (`ASSIGNMENT_LAYERS`) | `genre-template.js:1340-1367` | Everything students actually see per genre. This is the live system. |

### 1.2 Assignment layer registry — full inventory

`ASSIGNMENT_LAYERS` (`genre-template.js:1340-1367`), 6 ids:

| id | Object | Lines | `selectable` | `pathwayLabel` | `profile`? | `copy:{}`? | per-stage `coachFocus`? |
|---|---|---|---|---|---|---|---|
| `cap-200-first-draft` | inline literal | `1341-1355` | *absent* (falsy) | CAP 200 / CAP 200 | **no** | no | no |
| `cap200-bronx-beautiful-service-learning` | `cap200ServiceLearningLayer` | `501-510`, profile `374-495` | **true** | CAP 200 | yes | no | **no** |
| `research-paper` | `researchPaperLayer` | `646-662`, profile `524-640` | false (link-only) | Trabajo de investigación / Research Paper | yes | no | yes (`628-639`) |
| `stem-lab-report` | `stemLabReportLayer` | `798-815`, profile `681-791` | false | Informe de laboratorio / Lab Report | yes | no | yes (`779-790`) |
| `college-personal-statement` | `collegePersonalStatementLayer` | `1142-1159`, profile `829-1135` | false | Ensayo de admisión / Admissions Essay | yes | **yes** (`951-1134`) | yes (`931-942`) |
| `graduate-sop` | `graduateSopLayer` | `1264-1328`, profile `1171-1262` | false | Carta de intención / Statement of Purpose | yes | no | yes (`1250-1261`) |

There is **no "general writing" / neutral layer**. "No layer" *is* the default autobiographical essay. The neutral content set (§3) exists only as a fallback *inside* an active layer, never as a selectable id.

### 1.3 Activation

`app.js:14-26` is the sole resolution point:

- `?assignment=<id>` → if `getAssignmentLayer(id)` is truthy, `state.assignmentId = id` and the id is persisted to `localStorage.tupana_assignment_id` (`app.js:22-25`).
- `?assignment=` (empty), `?assignment=none`, `?assignment=generic` → `localStorage.removeItem('tupana_assignment_id')` (`app.js:16-18`).
- No param → the remembered key from `localStorage.tupana_assignment_id` is used, without re-persisting (`app.js:20-24`).
- **Unknown id → silently ignored.** `getAssignmentLayer` returns `null` for unknown ids (`genre-template.js:1370-1372`), the `if` at `app.js:22` fails, `state.assignmentId` stays unset, and the app is the *default autobiographical essay*, not a neutral genre. There is no error, toast, or log.

Two selector surfaces read the registry:
- `getSelectableProfiles()` (`genre-template.js:1381-1392`) — student first-run chooser; filters `selectable && profile`, so today it yields **only CAP 200**.
- `getReviewProfiles()` (`genre-template.js:1416-1430`) with `REVIEW_PROFILE_ORDER` / `REVIEW_PROFILE_LABELS` (`:1402-1415`) — colleague/evaluator mode `?review=colleague` (`app.js:131-148`), lists all 5 profile-bearing layers.

### 1.4 What a layer object contains

Layer shell: `id`, `name`, `type`, `pathwayLabel {es,en}`, `selectable`, `profile`, `context` (the additive system-prompt body).

Profile fields actually consumed (all optional; every resolver is null-safe):
`studentLabelEs/En`, `studentDescEs/En`, `draftPlaceholder` (bilingual `"ES\n\nEN"`), `stageDisplay{1..10:{es,en}}`, `milestones{1..5:{es,en}}`, `stageEntry{1..10: "ES\nEN"}`, `stageSteps{1..10:[{es,en}]}`, `welcome{connected,offline}`, `coachFocus{1..10:string}`, `copy{...}`.

The **service-learning meta-layer**: `SERVICE_LEARNING_PROFILE_SCHEMA` (`:223-243`, 19 fields), `SERVICE_LEARNING_MOVES` (`:248-265`, 16 moves tagged with engine stages), `SERVICE_LEARNING_PRINCIPLES` (`:268-273`), `SERVICE_LEARNING_COACH_MUST_NOT` (`:276-285`), `buildServiceLearningContext(profile)` (`:307-364`) composing the CAP 200 `context` at load (`:509`). Note `:319-328`: emits a "Step N: <moves>" integration map into the prompt.

### 1.5 Prompt injection

`buildOllamaSystemPrompt()` (`ui.js:3236-3268+`):
- Per-stage focus lines from `getActiveTemplate().stages` with `resolveCoachFocus(s.number, state.assignmentId, s.coachFocus)` (`ui.js:3246-3249`).
- Layer `context` appended as `ASSIGNMENT CONTEXT — <name>` block after all mandatory rules (`ui.js:3256-3260`).
- Coach identity line: `working on: <layer.name>` when layered, else literal `'writing autobiographical mixed-genre essays'` (`ui.js:3264-3266`).

## 2. The ten-stage engine

### 2.1 Stable ids and default labels

`STAGE_IDS` (`genre-template.js:40-51`) and `STAGES` (`data.js:47-158`):

| # | Stable id | Default ES / EN | Phase | Purpose |
|---|---|---|---|---|
| 1 | `stage.anecdote` | Anécdota / Anecdote | Discover | Specific anecdote/identity moment (`data.js:48`) |
| 2 | `stage.connection` | Conexión / Connection | Discover | Connect memory to larger historical/social/cultural context (`data.js:58`) |
| 3 | `stage.topic_pitch` | Tu Pitch / Topic Pitch | Build | 4–6 sentence pitch in own words (`data.js:68`) |
| 4 | `stage.research` | Investigación / Research | Build | Find sources; coach suggests, student searches (`data.js:76`) |
| 5 | `stage.outline` | Esquema / Outline | Build | Student's own rough outline; feedback only (`data.js:89`) |
| 6 | `stage.first_draft` | Primer Borrador / First Draft | Build | ⭐ Unassisted first draft; unlocks revision (`data.js:101`) |
| 7 | `stage.revision` | Revisión / Revision | Refine | Paragraph-level feedback via Five Questions (`data.js:113`) |
| 8 | `stage.voice_polish` | Pulir Voz / Voice Polish | Refine | Compare original vs revised; protect voice (`data.js:126`) |
| 9 | `stage.checklist` | Checklist | Complete | Verify submission materials (`data.js:139`) |
| 10 | `stage.reflection` | Mi Cierre de Proceso / My Writing Snapshot | Complete | Reflect before submitting (`data.js:152`) |

Default `coachFocus`/`allowedSupport`/`blockedSupport` per stage: `genre-template.js:83-183`. Stage 1 focus is prescriptive (3 required elements + ≤2-question turn discipline, `:89`); Stage 3 forbids regressing to Stage 1/2 questions (`:109-111`); Stage 8 encodes code-switching/Spanglish protection + Voice Vault honoring (`:159-161`).

### 2.2 Authorship gate

`AUTHORSHIP_GATE` (`genre-template.js:57-67`): requires `student_saved_first_draft` before stages 7–10; `gateStage: 6`. Enforced twice by **numeric** stage: `showStagePreview` (`ui.js:1926-1932`) and `onStageClick` (`ui.js:2170-2176`), both `targetId >= 7 && !state.draftSaved`. Declarative spec (`requiredBefore` stable ids) is read by nothing — spec and enforcement diverged.

### 2.3 Presentation layers over the 10 stages

- **4 phases** (`PHASES`, `ui.js:1599-1604`: Encontrar 1-3, Construir 4-6, Afinar 7-9, Completar 10) but the calm progress bar uses an incompatible 3-way `phaseForStage()`: `<=6 → 1`, `<=9 → 2`, else 3 (`ui.js:1121-1125`).
- **5 milestones** (`MILESTONES`, `ui.js:1615-1621`): M1=1-3, M2=4-5, M3=6 (the gate), M4=7-9, M5=10. Header "Paso N de 5" (`ui.js:2056`).
- **3 sub-steps per stage** (`STAGE_STEPS`, `data.js:224-275`), rendered as dots + "1/3" (`ui.js:1100-1118`).

### 2.4 Per-stage pedagogy attachments (all side effects of `goToStage()`, `ui.js:2035-2167`)

| Stage | Attached |
|---|---|
| all | stage-entry chat message once per stage (`ui.js:2019-2033`, `2103`) |
| 4 | Research card (`ui.js:2137`; `prompts.js:440-484`) + auto reflection checkpoint |
| 7 | Revision panel (`ui.js:2140`; `prompts.js:343-400`) + Five Questions strip + one-time auto-open (`ui.js:2108-2134`) + auto reflection checkpoint |
| 8 | Voice Polish card (`ui.js:2143`; `prompts.js:509-599`), 5 routes |
| 7-9 | Voice Vault panel (`ui.js:2145-2149`) |
| 9 | micro-reflection `'changed'` (`ui.js:2156`) |
| 10 | capstone panel 10A/10B/10C (`ui.js:2152`), micro-reflection `'needs_work'` (`ui.js:2157`) |
| ≠6 | `unlockStageSkill(id)` on entry; stage 6's skill unlocks only in `executeSave()` (`ui.js:2159-2161`, `4684-4693`) |

**Five Questions strip**: stage ≥ 7 only (`ui.js:2108`; boot `app.js:67-70`). Markup `index.html:305-372`: ①Accuracy ②Voice ③Specificity ④Thinking ⑤Conocimiento. Runtime `EVAL_QUESTIONS` (`ui.js:5613-5619`) + `EVAL_FEEDBACK` (`ui.js:5622-5648`).

**Reflection checkpoints**: `REFLECTION_CHECKPOINTS` (`ui.js:5658-5751`) at stages 4, 7, 8, 10. Stages 4/7 auto-open once via `AUTO_REFLECTION_STAGES` (`ui.js:5860-5873`, flag `tupana_reflect_shown_<id>`). Stage 8 requires a Voice-Polish route pick (`prompts.js:643`), stage 7 a revision-focus pick (`prompts.js:430`), gated in `renderReflectButton` (`ui.js:5756-5765`). Each carries `skill`, labels, prompt, question, 5 bilingual options; stage 10 adds `writtenFrame` (`ui.js:5747`).

### 2.5 State / buffers by stage

- **Every stage 1-10 owns its own text buffer**: `tupana_writing_s<N>` via `saveStageWork/loadStageWork` (`ui.js:4651-4663`). Stages ≥6 fall back to `tupana_draft` when their buffer is absent (`ui.js:4659-4660`).
- **Stage 6 alone** writes the canonical draft: `executeSave()` writes `tupana_draft` + `tupana_draft_saved='true'` + `tupana_writing_s6` (`ui.js:2582-2612`).
- Per-stage step index: `tupana_step_<stageId>` (`ui.js:1040-1052`).
- Transient `state._reflectStage` set in `prompts.js` (`:430`, `:643`), consumed in `ui.js` (`:5762-5765`), cleared on stage entry (`ui.js:2049`).
- Stages 7-9 are what `getFinalEssay()` scans for a "revised" text (`ui.js:7742-7760`).
- Stage 10 owns `tupana_capstone` (`app.js:79-91`).

## 3. Genre copy-layer contract (`genre-template.js:1560-2013`)

### 3.1 Three-way rule (verbatim at `:1569-1574`)

```
no active layer            → the default autobiographical copy (unchanged);
layer defines its own copy → the layer's copy;
layer active, copy missing → NEUTRAL copy (never the default essay's).
```

Predicate `_layerActive(assignmentId)` = `!!(assignmentId && getAssignmentLayer(assignmentId))` (`:1614-1616`) — keys off the **active layer**, not profile presence (covers profile-less `cap-200-first-draft`). Same shape for coach focus: `resolveCoachFocus(stageId, assignmentId, defaultFocus)` (`:1533-1539`) → layer override → caller default → `NEUTRAL_STAGE_FOCUS[stageId]` (`:1515-1526`). Every resolver returns `null` = "caller keeps its own default" (`:1434-1437`).

### 3.2 `{workEs}` / `{workEn}` tokens

`GENRE_WORK_NOUN` (`:1581-1590`): per-id `{es,en}`; `_default` = ensayo/essay, `_neutral` = trabajo/piece of writing. `applyGenreTokens()` (`:1599-1612`) recursively rewrites strings, arrays, objects.

### 3.3 Per-profile `copy:{}` hook

`_genreCopyOverride(assignmentId, key, stageId)` (`:1930-1936`) reads `layer.profile.copy[key][stageId]`:

| Key | Resolver | Neutral fallback | Notes |
|---|---|---|---|
| `microPrompts` | `:1939-1944` | `NEUTRAL_MICRO_PROMPTS` `:1623-1669` (stages 1-9) | missing stage → `NEUTRAL_MICRO_PROMPTS[6]` (`:1943`) |
| `panaHints` | `:1947-1953` | `NEUTRAL_PANA_HINTS` `:1671-1744` (1-9), `{gentle,direct}×{title,body,action}` | |
| `revisionMoves` | `:1956-1961` | `NEUTRAL_REVISION_SMALL` (8) + `NEUTRAL_REVISION_BIG` (7) `:1746-1764` | no profile ships this |
| `followups` | `:1964-1970` | `NEUTRAL_FOLLOWUPS` `:1767-1818` (1-10) | `'ES / EN'` single strings |
| `stageDesc` | `:1973-1979` | `NEUTRAL_STAGE_DESC` `:1821-1832` | no profile ships this |
| `stageExample` | `:1983-1987` | **none** — returns `null` | layered genre shows its own example or none (`ui.js:1976-1980`) |
| `skills` | `:1990-1996` | `NEUTRAL_STAGE_SKILLS` `:1917-1921` (stages 1-3 only) | |
| `badges` | `:1999-2004` | `NEUTRAL_BADGE_TEXT` `:1924-1927` (`story`, `bridge`) | |

Profile-level sets: `stageDisplay` (`:1446-1455` / `NEUTRAL_STAGE_LABELS` `:1861-1872`), `milestones` (`:1457-1466` / `:1850-1856`), `stageEntry` (`:1468-1472`, `:2007-2013` / `:1835-1846`), `stageSteps` (`:1474-1487` / `:1876-1911`), `draftPlaceholder` (`:1489-1496` / `:1913-1914`), `coachFocus` (`:1502-1506` / `:1515-1526`), `welcome` (`:1545-1550` / caller default `ui.js:5228-5240`), `pathwayLabel` (`:1554-1558` / `ui.js:1702-1703`).

**Only `collegePersonalStatementProfile` ships `copy:{}`** (`:951-1134`): microPrompts 1-9, panaHints 1-9, followups 1-10, badges, skills 1-3. Rationale `:944-950`: its stage roles diverge (4 = meaning/tension, 5 = shaping, 9 = reflection+integrity).

### 3.4 Consumer map

`prompts.js:104,117,302,349,353,455,531`; `ui.js:1072,1637,1643,1691,1702,1945,1950,1978,2023,4679,5228,5924,6768`. `stLabel()` (`ui.js:1641-1646`) is the single stage-name funnel; `msLabel()` (`ui.js:1636-1640`) the milestone one.

## 4. Cultural / translingual pedagogy

### 4.1 Tu Conocimiento (identity affirmation)

Markup `index.html:473-595`; logic `ui.js:4766-4884`, `5389-5439`.

- Title: "Tú ya produces conocimiento. / You already produce knowledge." (`index.html:481`).
- **Five claimable assets**, `MANI_ORDER = ['languages','community','journey','positionality','story']` (`ui.js:4771`). Card copy `index.html:497-555`: Languages ("Code-switching is not a mistake…"), Community ("You are a primary source."), Journey, Positionality, Story as Evidence ("your life *is* where the argument starts").
- Each claim fires a bilingual toast tying the asset to a downstream writing act (`MANI_ASSET_DEFS`, `ui.js:4776-4812`).
- **Freirean writing prompt** (`index.html:562-582`) → `tupana_mani_sentence`, autosaved (`ui.js:5416-5439`). Epigraph: Freire (`index.html:590`).
- **Gate**: `maniProceed()` requires all 5 claimed **and** non-empty sentence (`ui.js:5389-5391`, `:4852-4858`). Completion → celebration → `openLab()` unless `tupana_lab_done` (`ui.js:5400-5408`).
- **Genre awareness**: only `story` has a `neutral:` variant (`ui.js:4801-4810`) via `maniAssetDef()`/`applyManiGenreCopy()` (`ui.js:4814-4837`).

### 4.2 El Laboratorio (AI-judgment onboarding)

`index.html:598-780+`; `ui.js:5444-5608`. 4 steps, ~3 min, skippable (`index.html:613`).
- Step 0: "Your coach is powerful. Your judgment is more powerful." + privacy disclosure naming Gemini proxy, warning against immigration status / SSN / medical info (`index.html:622-639`).
- Step 1: generic AI paragraph about growing up bilingual, to be critiqued (`index.html:647-654`).
- Step 2: Five Questions applied to it, each choice → reasoning card (`index.html:664-730+`).
- Completion writes `tupana_lab_done`, calls `finishFirstRun('tour')` (`ui.js:5597-5608`).

### 4.3 Bilingual presentation model

1. **CSS-class dual render** — `show-es`/`lang-sep`/`show-en` spans toggled by `documentElement.dataset.lang`. `setLang(pref)` (`ui.js:332-347`) accepts `'es'|'en'|'both'`, persists `tupana_lang`, sets `<html lang>`; switcher `index.html:32-40`.
2. **`"ES\nEN"` string convention** for coach messages — `wrapBilingualHtml()` (`ui.js:2779`).
3. **`'ES / EN'` single-string convention** for follow-up chips.

Language-aware insertion: `showStuckMini()` (`prompts.js:126-129`) inserts single-language starters (Spanish-primary); same in `selectPolishRoute` (`prompts.js:635`), `useResearchStarter` (`prompts.js:497`).

**Warmth register** `STUCK_AFFIRMATIONS` (`prompts.js:74-96`): `es` / `en` / `both` = intentional translanguaging café Spanglish (`prompts.js:67-73`), with `{workEs}/{workEn}` tokens.

**Tone axis**: `t(gentle, direct)` (`ui.js:294-296`), persisted `tupana_tone`; every Pana Hint has both variants.

### 4.4 Code-meshing support

- Stage 1/2 `translang` fields (`data.js:48,58`) — only these stages carry `translang`.
- Stage 8 default coachFocus mandates preserving code-switching/Spanglish/family language; `blockedSupport` includes flatten voice / replace dialectal phrasing / rewrite for academic register (`genre-template.js:159-161`).
- **Voice Vault**: `tupana_protected`, stages 7-9 (`ui.js:2145-2148`, `357-370+`).
- Admissions layer: code-switching = choice not error, never auto-delete/italicize/demand translation (`genre-template.js:939`, `1155`). SOP: coaching language vs statement language separately negotiated (`:1310-1311`).
- Follow-up chips keep a translingual question in every genre incl. neutral (`:1771`, `:1077`; `data.js:55`).

### 4.5 Where autobiographical framing lives / how genres avoid it

**Default-only autobiographical content**: `STAGES[].desc/.example/.followups/.translang` (`data.js:47-158` — eviction letter, mother's shaking hands, South Bronx displacement); `STAGE_TRANSITIONS` (`data.js:164-219`); `STAGE_STEPS` (`data.js:224-275`); `STAGE_SKILL_DEFS` 1-3 (`data.js:286-297`); `MICRO_PROMPTS` (`prompts.js:10-65`); `PANA_HINTS` (`prompts.js:188-297`); `REVISION_SMALL/BIG` (`prompts.js:323-341`); `STAGE_ENTRY_MESSAGES` (`prompts.js:651-661`); `MILESTONES` (`ui.js:1615-1621`); default placeholder (`index.html:191`); system-prompt negative examples (`ui.js:3286-3287`); badges "Story Founder"/"Bridge Builder" (`ui.js:6773, 6783`).

**Three seams added by remediations**: Stage B.1 display/entry overrides (`genre-template.js:1432-1506`); F4 `NEUTRAL_STAGE_FOCUS` (`:1508-1539`); genre copy layer 2026-08-01 (`:1560-2013`, founder finding verbatim at `:1563-1567`). Plus per-surface guards: worked examples suppressed under a layer (`ui.js:1976-1980`); transitions neutralized (`ui.js:1661-1683`); Tu Conocimiento `story` neutralized (`ui.js:4814-4837`).

## 5. Brainstorming / prewriting (stages 1-5) per genre

- **Default autobiographical**: 1 anecdote (place/person/shift, sensory detail) · 2 bridge to historical/social force · 3 pitch naming tension ("My essay argues that ___ because ___") · 4 research keywords/databases, never invented sources · 5 student-authored outline, feedback only. (`genre-template.js:83-132`; `data.js:225-249`; `prompts.js:11-41`, `188-297`, `652-656`.)
- **CAP 200 service-learning**: 1 Community Starting Point · 2 Community Issue + Course Concept bridge · 3 Project Proposal (coach never approves) · 4 Evidence + Data Plan (never invents data) · 5 IMRDC structure. (`genre-template.js:410-420, 432-436, 449-474`.) No per-stage coachFocus — relies on NEUTRAL + composed context.
- **Research paper**: 1 Topic & Assignment Context · 2 focused arguable question (too broad/narrow/workable) · 3 Search Plan & Source Types (incl. community knowledge) · 4 Source Evaluation · 5 Notes & Patterns ("What I know / What a source says / What I think this means"). (`genre-template.js:536-546, 559-563, 576-600, 629-633`.)
- **STEM lab report**: 1 Lab Context · 2 Purpose & testable Question · 3 Method Summary (reproducible; coach doesn't correct the science) · 4 Evidence & Data (observation vs interpretation; never invents/cleans data) · 5 Result & Pattern + report plan. (`genre-template.js:693-703, 716-720, 731-755, 780-784`.)
- **College personal statement**: 1 Story Inventory (bounded; no trauma demand) · 2 Possibility Check (concreteness/reflection/ownership/word-limit — not admission odds) · 3 Choose a Direction (provisional, non-predictive) · 4 Meaning & Tension (no forced redemption) · 5 Shape the Essay (8 shapes; no "winning formula"). (`genre-template.js:841-851, 866-870, 881-905, 932-936`; own stage 1-5 micro-prompts/hints `:953-1039`.)
- **Graduate SOP**: 1 Frame & Requirements (document-type routing) · 2 Trajectory Inventory (no CV-in-paragraphs) · 3 Intellectual Direction · 4 Evidence Map CLAIM→EVIDENCE→REFLECTION→FORWARD LINK with `[VERIFIED]/[STATED]/[MISSING]/[PLACEHOLDER]` · 5 Architecture (moves + word budget). (`genre-template.js:1179-1189, 1199-1203, 1211-1235, 1251-1255`; context `1272-1327`.)
- **Neutral**: 1 real starting point · 2 connect to assignment purpose · 3 central idea/claim/tension · 4 real evidence, never invented · 5 own plan. (`genre-template.js:1516-1520`, `1836-1840`, `1878-1901`, `1625-1648`, `1673-1711`.)

## 6. localStorage keys touched by pedagogy systems

Canonical inventory documented in `storage.js:28-43`. Genre: `tupana_assignment_id`, `tupana_project_chosen`, `tupana_template_id`, `tupana_schema_version`. Stage engine: `tupana_stage`, `tupana_step_<stageId>`, `tupana_writing_s<1..10>`, `tupana_draft`, `tupana_draft_saved`, `tupana_journey_expand`. Onboarding: `tupana_mani_claimed`, `tupana_mani_done`, `tupana_mani_sentence`, `tupana_lab_done`, `tupana_onboarding_complete`, `tupana_tutorial_done`. Pedagogy artifacts: `tupana_decisions`, `tupana_reflect_shown_<stageId>`, `tupana_fiveq_stage7_opened_once`, `tupana_skills_acquired`, `tupana_protected`, `tupana_capstone`, `tupana_process_note`, `tupana_process_log`, `tupana_revision_checkpoint`, `tupana_full_draft_reviews`, `tupana_council_runs`, `tupana_eval_stats`, `tupana_eval_hint_seen`, `tupana_ai_usage`, `tupana_ai_cue_seen`, `tupana_completion_shown`, `tupana_sessions`, `tupana_chatlog`. Preferences: `tupana_lang`, `tupana_tone`, `tupana_theme`, `tupana_coach_mode`, `tupana_progress_collapsed`, `tupana_spotlight_off`. Backup: `tupana_backup_manifest`, `tupana_pre_import_snapshot`, `tupana_report_meta`. sessionStorage: `tupana_warn_dismissed`, `tupana_persist_warn`, `tupana_voice_challenge_shown`.

All writes via `tupanaSafeSetItem(key, value, artifactLabel)` (`storage.js:90-108`) with failure banner naming the lost artifact (`_tupanaArtifactLabel`, `storage.js:50-60`).

## 7. Hazards for migration

### 7.1 Pedagogy coupled to stage navigation
- Every pedagogical artifact injected as a side effect of `goToStage()` (`ui.js:2035-2167`) with hard-coded numeric checks and setTimeout delays. No registry of "what stage N offers".
- Authorship gate enforced twice numerically (`ui.js:1926`, `2170`) while the declarative `AUTHORSHIP_GATE.requiredBefore` is read by nothing.
- `state._reflectStage` set by card interaction in `prompts.js`, consumed in `ui.js`, cleared on stage entry — stage 7/8 reflection silently unreachable if the card is never touched.
- Skip-ahead guard hard-coded in two places with different conditions (`ui.js:1934-1940` vs `2178-2182`).
- Layer `stageEntry` strings hard-code "Paso N:" prefixes; `SERVICE_LEARNING_MOVES` embeds stage numbers in data.

### 7.2 Completion inferred from navigation and word count
- `state.done` populated purely by navigation (`ui.js:2047`; boot loop `app.js:42-44`). Milestone counts and the instructor report line report navigation, not writing.
- Sub-step progress inferred from word count: `autoAdvanceStepOnWordCount` (`ui.js:1055-1063`) + `STEP_WORD_THRESHOLDS` (`data.js:279-282`); runs only for stages ≤ 6. Consequence: stages 7-10 ship exactly one task cue per profile (documented in-code).
- "Revised" inferred by string comparison: `getFinalEssay()` (`ui.js:7742-7760`); `hasCompletionRevisionEvidence()` (`ui.js:7791-7793`) gates Stage 10 on it (a typo counts as revision).
- Badges earned by counters (`computeBadges()`, `ui.js:6754-6792`). Stage 6 skill is the sole work-gated unlock (`ui.js:2159-2161`, `4684-4693`).

### 7.3 Genre-leakage seams
- **Unknown assignment id → default autobiographical essay, silently** (`app.js:22`, `genre-template.js:1371`). Neutral set unreachable without a valid layer id.
- `_layerActive` vs `_profileForAssignment` are different predicates; `cap-200-first-draft` (layer, no profile) gets a mixed state that exists in production.
- `STAGES[].desc/.example` remain the substrate fallback; `stLabel()` reads `STAGES` first (`ui.js:1642`).
- `STAGE_TRANSITIONS` default-only, keyed by target stage number, patched over at `ui.js:1672-1683`.
- Historical leak documented in-code: `closeLab` stage-entry-presence CAP-200 detection (`genre-template.js:611-614`, `1540-1544`).
- **Neutral coverage gaps**: no stage 10 in `NEUTRAL_MICRO_PROMPTS`/`NEUTRAL_PANA_HINTS` (micro falls back to `[6]`; hints render nothing); `NEUTRAL_STAGE_SKILLS` covers only 1-3 — stages 4-10 fall through to autobiography-adjacent default skill labels under every layer.
- `revisionMoves`/`stageDesc`/`stageExample` hooks implemented but unused.
- **Hard-coded default-flavored strings bypass the copy layer**: `REFLECTION_CHECKPOINTS` (`ui.js:5658-5751`), `EVAL_FEEDBACK` (`ui.js:5622-5648`), `PHASE_CELEBRATIONS` (`ui.js:6713-6726`), 3 of 6 badge names, `RESEARCH_STRATEGIES` JSTOR/ProQuest list (`prompts.js:447-448`), revision-panel prose (`prompts.js:368-395`), Voice Polish card body (`prompts.js:554-595`).
- System-prompt negative examples are autobiographical, sent to every genre (`ui.js:3286-3287`).
- El Laboratorio worked example is a bilingual-upbringing paragraph shown to every genre (`index.html:647-654`).
- Tu Conocimiento only 1 of 5 assets genre-aware (`ui.js:4801-4810`).
- Guard suite `genre_leakage_test.mjs` also asserts the default genre keeps its own voice — over-neutralization is a regression too.

### 7.4 Duplicated content
- Stage-entry copy triplicated per genre (`stageEntry` ≈ `stageSteps[stage][0]` ≈ `welcome` first sentence).
- Stage 6/8 boilerplate copy-pasted verbatim across all five profiles (`:476-479`, `:602-605`, `:756-760`, `:906-910`, `:1237-1239`, `:1902-1906`).
- `NEUTRAL_FOLLOWUPS[10]` byte-identical to `STAGES[10].followups`; `NEUTRAL_MICRO_PROMPTS[6..9]` largely duplicate `MICRO_PROMPTS[6..9]`; `NEUTRAL_STAGE_ENTRY[8]/[10]` byte-identical to `STAGE_ENTRY_MESSAGES[8]/[10]`.
- `serviceLearningProjectType` (`genre-template.js:288-301`) assembled, never referenced.
- Two phase models + a third 5-milestone model over the same 10 stages.
- Two selector lists over the same registry with different labels.
- **Two CAP 200 layers ship simultaneously** (legacy `cap-200-first-draft` profile-less + comprehensive service-learning), both link-reachable, rendering differently.
