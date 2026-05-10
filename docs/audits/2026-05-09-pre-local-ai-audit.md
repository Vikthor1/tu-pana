# Pre-Local-AI Integration Audit

**Date:** 2026-05-09
**Auditor:** Claude Sonnet (read-only; no code changes during audit)
**Scope:** All application files + all documentation files
**Trigger:** First Aider + Hermes workflow validated; local-AI integration is next milestone. Baseline recorded before that work begins.
**Status at audit time:** Codebase is production-stable. All previous session edits (config.js, storage.js, data.js, prompts.js) committed and pushed.

---

## Files Audited

| File | Lines | Method |
|------|-------|--------|
| `index.html` | ~955 | Partial read + Explore agent |
| `assets/js/config.js` | 14 | Full read |
| `assets/js/data.js` | ~282 | Full read |
| `assets/js/prompts.js` | ~373 | Full read |
| `assets/js/storage.js` | 76 | Full read |
| `assets/js/ui.js` | ~4,480 | Explore agent (targeted queries) |
| `assets/js/app.js` | 128 | Full read |
| `assets/css/styles.css` | ~4,622 | Explore agent (targeted queries) |
| `docs/project-brief.md` | — | Full read |
| `docs/current-architecture.md` | — | Full read |
| `docs/workflow/aider-prep.md` | — | Full read |
| `prompts/qa-scenarios.md` | — | Full read |

---

## Must Fix

These findings represent data integrity issues or documentation that actively misleads. Fix before or alongside local-AI integration work.

---

### M1 — `tupana_capstone` missing from `exportData()` and `clearAllData()`

**File:** `assets/js/storage.js`
**Lines:** 9–12 (exportData keys), 68–71 (clearAllData keys)

`tupana_capstone` is the Stage 10 Capstone localStorage key. It is absent from both arrays. This means:
- Student capstone text is NOT included in the JSON backup download
- Full data reset does NOT clear the capstone text

Capstone is the final deliverable of the workflow. This is the highest-priority data integrity bug.

**Fix:** Add `'tupana_capstone'` to both arrays — two separate single-line edits, each with a dry-run.

---

### M2 — Wrong global constant names in `docs/current-architecture.md`

**File:** `docs/current-architecture.md`

| Documented name | Actual name in data.js |
|----------------|------------------------|
| `TRANSITIONS` | `STAGE_TRANSITIONS` |
| `STEPS` | `STAGE_STEPS` |

Any future AI session reading the architecture doc will look for the wrong names and fail to locate them.

**Fix:** Edit both names in `current-architecture.md` to match the actual constants.

---

### M3 — Three undocumented localStorage keys in `ui.js`

**File:** `assets/js/ui.js`

The following keys are used in ui.js but absent from `docs/current-architecture.md` and the storage.js key arrays:

| Key | Purpose |
|-----|---------|
| `tupana_eval_stats` | Evaluation streak stats (via `EVAL_STATS_KEY` constant) |
| `tupana_progress_collapsed` | Collapsed state of progress panel |
| `tupana_spotlight_off` | Spotlight feature opt-out |

These are UI preference keys — they are legitimately excluded from clearAllData (preferences should survive a reset). But they must be documented so future sessions do not treat them as orphaned or unknown keys.

**Fix:** Add all three to the localStorage key inventory in `docs/current-architecture.md`.

---

### M4 — Wrong stage names in `docs/project-brief.md`

**File:** `docs/project-brief.md`

| Stage | Documented name | Actual name (from data.js STAGES) |
|-------|----------------|----------------------------------|
| Stage 3 | "Tema" | "Tu Pitch" / "Topic Pitch" |
| Stage 9 | "Tu Voz" | "Checklist" / "Checklist" |

**Fix:** Update both stage names in project-brief.md.

---

## Should Fix

These findings are low-risk improvements worth scheduling, but not blockers.

---

### S1 — `renderEvalStreak()` called twice in `app.js`

**File:** `assets/js/app.js`
**Lines:** ~40 and ~80

`renderEvalStreak()` is called at initialization and again during the Stage 10 restore sequence. The first call (line ~40) is redundant — Stage 10 state has not been restored yet at that point, so the streak renders with stale or default data before being re-rendered correctly at line ~80.

The duplicate causes a flash (brief incorrect render), not a logic error. No student-facing impact on stable connections.

**Fix:** Remove the line ~40 call. Single-line Aider edit, safe for dry-run.

---

### S2 — `tupana_tone` missing from `exportData()`

**File:** `assets/js/storage.js`
**Lines:** 9–12

`tupana_tone` stores the student's selected coaching tone (gentle vs. direct). It is used across multiple stages and set via `setCoachMode()`. It is absent from the export backup.

Students who export their data and restore it in a new session will lose their tone preference.

**Fix:** Add `'tupana_tone'` to the exportData keys array. Single-line Aider edit.

Note: `tupana_tone` should NOT be added to `clearAllData` — tone is a preference, not content data. Same pattern as `tupana_lang`.

---

### S3 — `tupana_sessions` missing from `exportData()`

**File:** `assets/js/storage.js`

`tupana_sessions` is used in ui.js for session tracking. It is absent from exportData. Less critical than capstone or tone, but worth including for completeness.

**Fix:** Add `'tupana_sessions'` to the exportData keys array.

---

## Note / Monitor

These are known quirks in the codebase. They are not bugs — the app is working correctly. Document them so future sessions do not misdiagnose them.

---

### N1 — `MICRO_PROMPTS` Stage 10 fallback reaches Stage 6 prompts

**File:** `assets/js/prompts.js`

The `showStuckMini()` function uses `stuckMiniIdx[stage]` to track prompt cycling per stage. If called at Stage 10, and Stage 10 has no dedicated micro-prompts in `MICRO_PROMPTS`, the function falls back to Stage 6 (the last defined stage in the map).

Stage 6 is the authorship gate — its stuck prompts are about finishing and submitting. At Stage 10 (Capstone), this context is wrong.

**However:** Stage 10 hides draft controls including the stuck mini button. The fallback is almost certainly unreachable in normal use.

**Action:** Monitor only. If a future session adds stuck mini support to Stage 10, add Stage 10 entries to `MICRO_PROMPTS` at that time.

---

### N2 — `app.js` Stage 10 restore uses chained `setTimeout` delays

**File:** `assets/js/app.js`

The Stage 10 restore sequence chains multiple `setTimeout` calls (400ms, 200ms, 700ms) to sequence DOM operations during page load. This is fragile — it assumes DOM operations complete within fixed time windows.

No reported failures. MacBook Air M2 is well within timing tolerance. Flag only if the capstone restore ever fails silently or partially.

**Action:** Monitor only. Do not refactor unless symptoms appear.

---

### N3 — Duplicated key arrays in `storage.js`

**File:** `assets/js/storage.js`

`exportData()` and `clearAllData()` each maintain their own hardcoded key arrays. When a new localStorage key is added, it must be added to the correct array(s) manually — there is no shared source of truth.

This is a structural note, not a bug. The current approach is simple and transparent. The risk is forgetting to update one array when adding a new key (as happened with `tupana_capstone`, `tupana_tone`, `tupana_sessions`).

**Action:** When adding a new key, always check both arrays. Document the intentional omissions (tone, lang, UI preferences) in a comment.

---

### N4 — Stage 6 authorship gate is solid; no bypass path

**File:** `assets/js/ui.js`

`executeSave()` and `updateDraftControls()` were examined. The authorship gate at Stage 6 enforces completion before progression. No bypass path was found. The gate is working as designed.

**Action:** None. Confirmed solid, no changes needed.

---

### N5 — `copilotEmbedPanel` and `difyEmbedPanel` present in DOM

**File:** `index.html`

Both AI chat embed panels are present in the DOM but hidden by default (`display:none` or equivalent). They are safely sandboxed — neither panel is visible or active unless explicitly triggered by matching coach mode logic.

**Action:** None. When local-AI integration begins, add a `localEmbedPanel` or equivalent alongside these; do not repurpose either existing panel.

---

## CSS and Accessibility — Clean

**File:** `assets/css/styles.css`

- Mobile breakpoints at `≤768px` and `≤480px`, labeled `2026-05-08` — current
- 40 root CSS custom properties, all active
- `:focus-visible` coverage on 45+ selectors
- `display:none !important` used only for language gating and mobile panel switching — no accessibility violations

No findings. CSS is clean.

---

## `index.html` — Clean

- Script load order: `config → data → prompts → storage → ui → app` (lines 801–806) — correct
- All required IDs present: `fiveQStrip`, `mobileTabs`, `tabDraft`, `tabChat`, `draftWarning`, `devPreviewBar`
- `lang="es"` on `<html>`, skip link present, aria coverage comprehensive

No findings.

---

## Recommended Fix Order

Execute in this sequence to minimize risk and keep each change testable in isolation:

1. Fix `current-architecture.md` global names (M2) — docs only, zero risk
2. Add three undocumented keys to architecture docs (M3) — docs only, zero risk
3. Fix `project-brief.md` stage names (M4) — docs only, zero risk
4. Add `tupana_capstone` to `exportData` (M1a) — single-line Aider, dry-run
5. Add `tupana_capstone` to `clearAllData` (M1b) — single-line Aider, dry-run
6. Add `tupana_tone` to `exportData` (S2) — single-line Aider, dry-run
7. Remove duplicate `renderEvalStreak()` from app.js line ~40 (S1) — single-line Aider, dry-run
8. Add `tupana_sessions` to `exportData` (S3) — optional; lower priority

Do not proceed to local-AI integration work until items 1–6 are complete.

---

## Audit Integrity Notes

- No code was modified during this audit
- All findings were verified by cross-referencing at least two sources (code vs. documentation, or two code files)
- The data.js, prompts.js, storage.js edits committed earlier in this session are reflected in the current state; this audit was conducted after those commits
- ui.js and styles.css were audited via targeted Explore agent queries, not full file reads — line numbers are approximate
