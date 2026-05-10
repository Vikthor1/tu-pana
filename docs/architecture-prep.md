# Tu Pana de Escritura — Architecture Prep Notes

**Last updated:** 2026-05-10  
**Refactor:** Pre-Gemini architecture prep (v1.0 → v1.1 scaffolding)  
**App status:** Default mixed-genre ELL workflow unchanged. All future features disabled.

---

## What Changed in This Refactor

This was a scaffolding refactor, not a feature addition. The student-facing experience is identical. Two new files were added; three existing files were edited minimally.

### New Files

| File | Purpose |
|------|---------|
| `assets/js/genre-template.js` | Feature flags, app config, stable stage IDs, authorship gate, default genre template, template registry |
| `assets/js/ai-provider.js` | AI provider abstraction: `buildCoachPrompt()` layer assembler, `sendCoachMessage()` provider router |
| `docs/architecture-prep.md` | This file |

### Modified Files

| File | Change |
|------|--------|
| `index.html` | Added two `<script>` tags (genre-template.js after data.js; ai-provider.js after prompts.js) |
| `ui.js` | `buildOllamaSystemPrompt()` now derives stage rules from the active template instead of hard-coding them; `buildChannelData()` now includes `stageId` |
| `storage.js` | Export payload includes `tupana_schema_version`, `tupana_template_id`, `tupana_process_log`; import migration stamps legacy files as v1.0 |

### Script Load Order

```
config.js → data.js → genre-template.js → prompts.js → ai-provider.js → storage.js → ui.js → app.js
```

---

## Feature Flags

Defined in `genre-template.js` as the `FEATURES` object. All flags are `false`. No UI exposes them.

```javascript
const FEATURES = {
    genreSelection:      false,  // genre picker in UI
    courseModeSelection: false,  // course-mode picker in UI
    spanishL2Mode:       false,  // Spanish L2 course mode
    heritageSpanishMode: false,  // Heritage Spanish course mode
    geminiProvider:      false,  // Gemini Flash-Lite / Flash API
    instructorSettings:  false   // instructor configuration panel
};
```

To enable a future feature: set its flag to `true` here and wire up the corresponding handler.

---

## App Configuration Object

Defined in `genre-template.js` as `APP_CONFIG`. Internal reference only — not exposed to students.

```javascript
const APP_CONFIG = {
    appVersion:     '1.0',
    schemaVersion:  '1.0',
    courseMode:     'ell-academic-writing',
    genre:          'mixed-genre-autobiographical-essay',
    targetLanguage: 'english',
    studentLevel:   'first-year-college'
};
```

---

## Stable Stage IDs

Defined in `genre-template.js` as `STAGE_IDS`. Internal IDs independent of visible labels.

```javascript
const STAGE_IDS = {
    1:  'stage.anecdote',
    2:  'stage.connection',
    3:  'stage.topic_pitch',
    4:  'stage.research',
    5:  'stage.outline',
    6:  'stage.first_draft',
    7:  'stage.revision',
    8:  'stage.voice_polish',
    9:  'stage.checklist',
    10: 'stage.reflection'
};
```

Use `getStageId(stageNumber)` to look up the stable ID from a numeric stage. Use `getTemplateStageData(stageNumber)` to get the full template stage object (coachFocus, allowedSupport, blockedSupport).

---

## Authorship Gate

Defined in `genre-template.js` as `AUTHORSHIP_GATE`. Lives outside any specific genre template — it is a core writing-process engine rule.

```javascript
const AUTHORSHIP_GATE = {
    requiredBefore: ['stage.revision', 'stage.voice_polish', 'stage.checklist', 'stage.reflection'],
    requirement:    'student_saved_first_draft',
    gateStage:      6,
    message:        'Before I can give paragraph-level revision feedback, ...'
};
```

Primary enforcement: `updateDraftControls()` in `ui.js`.  
Secondary check: `sendCoachMessage()` in `ai-provider.js`.

---

## Default Genre Template

Defined in `genre-template.js` as `mixedGenreAutobiographicalEssay`. This is the only template.

Each stage entry has:
- `id` — stable stage ID (matches `STAGE_IDS`)
- `number` — numeric stage (1–10)
- `titleEs` / `titleEn` — display names (duplicated from `data.js STAGES` for template self-containment)
- `phase` — Discover / Build / Refine / Complete
- `coachFocus` — the coaching rule injected into the AI system prompt for this stage
- `allowedSupport` — what the coach is allowed to do
- `blockedSupport` — what the coach must never do

The `coachFocus` values are the exact strings formerly hard-coded inside `buildOllamaSystemPrompt()`.

---

## Genre Template Registry

```javascript
const genreTemplateRegistry = {
    'mixed-genre-autobiographical-essay': mixedGenreAutobiographicalEssay
};
```

Only one template exists. Future templates are added here and registered in `APP_CONFIG.genre`.

**To add a new genre template:**
1. Define the template object in a new file (e.g., `genre-personal-narrative.js`)
2. Add it to `genreTemplateRegistry`
3. Add its key to `APP_CONFIG.genre` options
4. Enable `FEATURES.genreSelection` when ready to expose the UI

---

## AI Provider Abstraction

Defined in `ai-provider.js`.

### Active provider

```javascript
const AI_PROVIDER = 'current';
// 'current' = use existing state.coachMode routing in ui.js
// Future: 'gemini' | 'ollama' | 'offline'
```

### Prompt layer assembler

`buildCoachPrompt({ baseRules, courseModeRules, genreRules, stageRules, studentProcessData, userMessage })` assembles a system prompt from discrete layers. Currently called indirectly — `buildOllamaSystemPrompt()` in `ui.js` does the layer assembly and calls `getActiveTemplate()` to get stage rules.

### Provider router

`sendCoachMessage({ message, stageId, studentContext, assignmentConfig })` is the intended single entry point for all AI coaching requests from the workflow. Currently it delegates to `sendMsg()` in `ui.js` (no behavior change).

---

## Where Gemini Integration Goes

When ready to add Gemini Flash-Lite:

1. **`FEATURES.geminiProvider = true`** in `genre-template.js`
2. **`AI_PROVIDER = 'gemini'`** in `ai-provider.js` (or read from `APP_CONFIG`)
3. **Implement `callGeminiProvider()`** in `ai-provider.js` — call the Gemini API, passing the output of `buildCoachPrompt()` as the system prompt
4. **Uncomment the `'gemini'` case** in `sendCoachMessage()`
5. **No changes needed** in `ui.js` `sendMsg()` or `app.js`

The pedagogical guardrails (authorship rules, no-sample-prose rule, etc.) live in `buildCoachPrompt()` / `buildOllamaSystemPrompt()` and are provider-agnostic — they will flow to Gemini automatically.

---

## Where Future Genre Templates Go

1. Create `assets/js/genre-[name].js`
2. Define the template object following the `mixedGenreAutobiographicalEssay` structure
3. Add a `<script>` tag after `genre-template.js` in `index.html`
4. Register in `genreTemplateRegistry`
5. Enable `FEATURES.genreSelection` when ready

---

## Where Future Course Modes Go

Course mode rules belong in the `courseModeRules` layer of `buildCoachPrompt()`. Currently unused (the ELL academic writing rules are baked into `baseRules`).

When adding Spanish L2 or Heritage Spanish:
1. Define the course-mode rules as a string
2. Pass as `courseModeRules` to `buildCoachPrompt()`
3. Enable the relevant `FEATURES` flag

---

## LocalStorage Schema Versioning

New key: `tupana_schema_version` (written on first load by `genre-template.js`).  
New key: `tupana_template_id` (written on first load; value = `'mixed-genre-autobiographical-essay'`).

Legacy data (no version key): treated as v1.0, stamped automatically. No migration needed — the data format is unchanged.

**Current schema version:** `1.0`

When the schema changes (new keys, key renames, format changes):
1. Increment `APP_CONFIG.schemaVersion`
2. Add a migration function in `genre-template.js` `initSchemaVersion()`
3. Document the migration here

---

## Process Log (Phase 2)

Key: `tupana_process_log` (defined in `genre-template.js`, not yet wired to events).

Intended entry format:
```json
{
  "timestamp": "2026-05-10T10:24:00",
  "stageId": "stage.first_draft",
  "actionType": "draft_saved",
  "studentGenerated": true,
  "aiGenerated": false,
  "summary": "Student saved first full draft."
}
```

Action types to implement in Phase 2: `draft_saved`, `stage_advanced`, `revision_decision`, `voice_protected`, `report_generated`.

The `tupana_process_log` key is included in `exportData()` / `importData()` in `storage.js`.
