# Stage A.1: Pilot-friction sweep before CAP 200

## Purpose

This branch addresses remaining **pilot-reported student friction** after the Stage A
"Core UIX Stabilization" merge (`1c4f7dd`), and lands it **before** any Stage B / CAP 200
service-learning genre work begins.

It is a bounded stabilization pass — mobile/accessibility polish, submission and
save/resume clarity, and lightweight coach-copy trims — over the already-validated Stage A
architecture (5 student-facing milestones over the intact internal 10-stage engine, with the
Stage-6 authorship gate preserved).

**Stage B was not started.** No CAP 200 service-learning genre logic was added; the
assignment layer and `genre-template.js` were not touched. The gate holds.

## Pedagogical rationale

These changes reduce friction without weakening Tu Pana's core pedagogy: students still write
an unassisted first draft, receive guided support, reflect on their process, and submit a
packet that preserves authorship and revision evidence.

## Batch summary

- **Batch 1 — Mobile / accessibility polish.** Raised all identified sub-44px tap targets to
  44px (mobile language selector 32→44, Final Packet buttons 36→44 regression, Quick Check
  pill, edit-toolbar, confirm-dialog buttons, header icons at ≤375px). Prevented iOS focus
  auto-zoom on the draft textarea (0.95→1rem at ≤430px) and the mobile stage dropdown
  (0.88→1rem). Mobile label `Etapa · Stage` → `Paso · Step` (matches the milestone task bar).
- **Batch 2 — Submission clarity + save/resume reassurance.** Final Packet copy now states
  nothing is submitted automatically — the student must copy/download and paste it; completion
  card terminology unified to "Final Packet" (was "report"). Save/device-switch guidance made
  bilingually symmetric (English banner gained the autosave + same-device line); backup→import
  tied to the switching-devices scenario. No cloud sync implied.
- **Batch 3 — Bounded coach copy trims.** Voice Polish taught once instead of 3×; Stage-6
  entry leads with the authorship action (revisit/import demoted to optional); removed the
  draft-saved modal's duplicate "checkpoint, not a final version" line; shortened the longest
  onboarding card and trimmed the Lab "Why this matters" enumeration; differentiated the
  "Before You Continue" checkpoint titles (`: your research / your revision / your voice`);
  condensed the Stage-10 10A intro. Copy only — no coach logic changed.
- **Batch 5 — Stale Skills-Gains fixture tests fixed and tracked.** `badge_test` and
  `milestone_gate_test` asserted the Skills-Gains chip but seeded only legacy
  `tupana_decisions`; both now also seed `tupana_skills_acquired:['research_with_authorship']`
  to match the live model. Added both to the `.gitignore` test allowlist so the now-green
  regression guards are durable (same pattern the Stage A merge used for its 6 tests).

## Files changed

- `assets/css/styles.css`
- `index.html`
- `assets/js/ui.js`
- `assets/js/prompts.js`
- `.gitignore`
- `badge_test.mjs`
- `milestone_gate_test.mjs`

## Validation

**Green on the final branch state:**

- The 6 tracked Stage A regression tests: `milestone_simplification` 12/12,
  `pause_reflect_rework` 8/8, `decision_counter` 16/16, `reflection_inflow` 11/11,
  `final_packet` 18/18, `stage10_completion` 22/22.
- The two fixed fixtures: **`badge_test` 15/15** and **`milestone_gate_test` 22/22** (were
  14/15 and 21/22 on stale fixtures; app was already correct).
- Additional suite files: `skills_gains` 22/22, `autosave` 24/24, `storage_keys` 13/13,
  `help_panel` 34/34, `beyond_toolkit` 21/21, `chat_scroll` 17/17, `gemini_fallback` 14/14,
  `phase_toast` 9/9, `progress_panel` 27/27.
- **Mobile smoke** (custom, viewports 430 / 375 / 480): 21/21 — no horizontal overflow, all
  checked targets ≥44px, zero JS errors; mobile label confirmed `Paso · Step`.
- The Playwright flows assert "no JS errors" across stages, so the desktop journey, Stage-6
  gate, Quick Check, Final Packet, and reload paths are automation-covered.

**Could not reconfirm on this host:**

- **`toolkit_test.mjs`** — Chromium OOM-crashed mid-run on this host ("Target page, context or
  browser has been closed"), with the crash point moving with machine load (line 105 → 129)
  and **identical behavior when Batch 3 was stashed**. It is the heaviest test (8 sequential
  full-app page loads against one shared browser); the code paths it covers were **not touched**
  by this branch; it was **29/29 at the recon baseline**. This is environmental (memory
  pressure, ~46% free with heavy pageout history), **not an assertion failure / not a
  regression**. Recommend re-running `node toolkit_test.mjs` on a calmer machine to reconfirm.

**Deferred (pre-existing):**

- **`stage10_reflection_test.mjs`** — a pre-existing test-harness issue (the test must dismiss
  the Stage-10 capstone overlay before clicking the toolkit, plus the same fixture migration).
  Not a one-line fix; out of scope for this sweep.

**Real-device note:** iPhone-like viewport was validated in Chromium emulation; an actual
iPhone visual pass is still recommended before student rollout.

## Risk assessment

- **No state-machine changes** — the internal 10-stage engine is untouched.
- **No packet-generation logic changes** — `generateInstructorReport()` / `getFinalEssay()` /
  `buildSubmissionDiagnostic()` unchanged; only surrounding copy.
- **No authorship-gate logic changes** — Stage 6 gate behavior preserved.
- **No CAP 200 genre logic** — Stage B not started.
- **No storage model changes** — no new localStorage keys; export/import/clear paths unchanged.
- Reflection-checkpoint recurrence (`oncePerStage`) intentionally **not** changed — behavioral,
  not copy; deferred.

## Review checklist

- [ ] Run or review the mobile / iPhone flow (tap targets, no zoom-on-focus, no overflow).
- [ ] Reconfirm `toolkit_test.mjs` on a calmer machine if possible (expected 29/29).
- [ ] Confirm the coach copy feels lighter but still pedagogically strong.
- [ ] Confirm the Final Packet copy reads clearly (what's submitted, nothing auto-sent).

---

**Recommended next step:** review branch, optionally reconfirm `toolkit_test.mjs`, then merge
if no concerns. Stage B remains gated.
