# UX Remediation Completion Report — founder brief 2026-07-31

Scope: five findings from the founder's C2 lived-experience test (Council PASS ·
admissions journey FAIL pending remediation). All fixes are cross-genre and
live in shared sources — no admissions-only conditionals were added.
Baseline before editing: `8e22fc7`, 35/35 suites, preview live.

## Finding 1 — Save conflated with submission and data management
- **Root cause:** the footer button was labeled "Guardar / Exportar · Save /
  Export" but opened `openReport()`, which unconditionally rendered the
  submission-readiness diagnostic, the eight-question Process Note, the Final
  Submission Packet, backup/import, email, and Clear-my-data. Its diagnostics
  read only the Stage-6 canonical draft, so writing pasted at Stage 1 was
  reported as "no written work found" — derived truthfully from the wrong
  question. The quiet autosave confirmation already existed (`#autosaveStatus`,
  "✓ Guardado · Saved" on every autosave) — the ambush was the button.
- **Systemic fix:** `openReport(mode)`. Default `'work'` = **My work** hub:
  truthful save status built from the CURRENT stage editor plus a per-stage
  inventory of everything saved; explicit "nothing is sent or submitted from
  here"; backup/import in a collapsed secondary area; Clear-my-data in its own
  collapsed, red **danger zone**; Process Note offered only after the
  authorship draft exists; "Prepare submission →" appears only at Stage 9+
  with a saved draft. `'submit'` = the explicit final-review flow (diagnostic,
  AI-activity summary, full report, packet). Footer button renamed
  **Mi trabajo · My work**; the journey-complete CTA enters the submit flow.
- **Files:** `index.html`, `assets/js/ui.js`, `assets/css/styles.css`.
- **Tests:** `ux_remediation_test.mjs` F1 block (8 checks: truthful status, no
  submission warnings on save, packet hidden, Process Note gating both sides,
  danger zone separation, explicit submit flow); `final_packet_test` 22/22
  (now drives `openReport('submit')`); `interface_polish_test` 23/23.

## Finding 2 — Misleading, genre-specific navigation language
- **Root cause:** `STAGE_TRANSITIONS` (data.js) hard-codes default-essay CTA
  verbs ("Connect to History", "Write My Pitch", "Begin Research") and
  completed-milestone copy, keyed by destination stage, with no genre
  resolution; consumed by both the stage-preview modal and the main continue
  button.
- **Systemic fix:** one navigation contract in one place: `getStageNavCta()`
  renders **Continue to: [next-stage name]** with the name resolved through
  the active genre layer (`stLabel` → `getStageLabelOverride`) — for every
  genre including the default. `getStageCompletedText()` keeps the default
  genre's richer completed copy and gives layered genres a neutral, truthful
  line. A consistent **Back to: [previous stage]** control was added beside
  Continue (hidden at Stage 1; going back never gates).
- **Audit matrix:** `docs/nav-audit-matrix.md`, generated from the live
  configuration by `scripts_build_nav_matrix.mjs` — genre × stage × back
  destination × continue label × coach-focus source × review actions, all six
  genres. No transition anywhere depends on autobiographical language unless
  the default autobiographical genre is active.
- **Tests:** remediation suite F2 block (6 checks incl. no-autobiographical-CTA
  sweep of the admissions shell); `xgenre_stage_routing` 65/65.

## Finding 3 — Student work stranded between stages
- **Root cause:** the bring-your-work-forward offer existed
  (`_offerTransitionImport`: bring / add-above / add-below / keep) but was
  armed ONLY in the stage-preview path (`confirmStagePreview`); map
  navigation and back-then-forward moves silently produced empty editors.
- **Systemic fix:** arming moved into `goToStage()` itself — every forward
  transition with ≥30 characters of prior work now gets the same offer — plus
  a persistent **prior-work strip** whenever an editor is empty and earlier-
  stage writing exists ("Your Stage N writing (X words) is saved. This stage
  starts empty." with Bring-it-here / Go-to-that-stage). Carrying forward
  copies text verbatim; the earlier stage's copy is never modified; combining
  with existing text remains an explicit student choice (never silent
  overwrite).
- **Tests:** remediation suite F3 block (5 checks: direct-path offer, verbatim
  carry, refresh persistence, source preservation, empty-editor explanation).

## Finding 4 — Genre and stage-specific coaching leaking
- **Root causes:** (1) the system prompt's identity line said "students
  writing autobiographical mixed-genre essays" for EVERY genre; (2) a layer
  without its own per-stage coachFocus silently inherited the default essay's
  autobiographical stage rules (admissions/SOP/research/STEM each carry full
  1–10 coverage, but CAP 200 did not — and future genres would not); (3) the
  default Stage-7 rule told the coach to organize feedback around the
  enumerated Five Questions, so the coach kept restating all five in chat, and
  the framework's "Thinking" hint carried default-genre wording.
- **Systemic fix:** identity line now names the active layer;
  `resolveCoachFocus()` + `NEUTRAL_STAGE_FOCUS` (genre-template.js) provide an
  explicit neutral fallback — a layered genre can never inherit
  autobiographical stage coaching; a mandatory **Five Questions presentation
  rule** in the system prompt (apply the framework silently, never enumerate
  it; the interface presents it); the "Thinking" hint re-worded genre-neutral.
  Config is centralized in the genre registry: a future genre defines labels +
  coachFocus or gets the neutral fallback, never another genre's language.
- **Tests:** remediation suite F4 block (5 checks incl. cross-genre isolation
  and default-genre no-regression); `coachfocus_governance` 9/9;
  `service_learning` 58/58 (CAP 200 under neutral fallback).

## Finding 5 — Review and Council hard to rediscover
- **Root cause:** the whole-draft review entry existed only at Stages 7 and 9
  (button and function guard), and a completed review ended with no
  re-entry affordance — backward navigation was the only path back.
- **Systemic fix:** review access across the whole Revise phase (7–9), and a
  compact **"What next?"** action card after every completed review: Another
  review / change focus · Review Council · View last Council report (when one
  exists) · Return to my draft. Council output, history, stale labels, and
  Accept/Adapt/Reject persistence are untouched (`council_ui_test` 29/29).
- **Tests:** remediation suite F5 block (3 checks); `full_draft_review` 34/34
  (Stage-8 assertion updated from "hidden" to the new availability contract).

## Verification summary
- New `ux_remediation_test.mjs`: 30/30.
- Full sweep after remediation: see commit message (all suites).
- Manual evidence: phone-viewport screenshots of the admissions navigation and
  the My-work hub; the remediation suite drives desktop viewport end-to-end.
- **Honest remaining concerns:** (1) the full manual mobile+desktop sweep of
  every genre listed in the brief has been covered by automated flows plus
  spot screenshots, not a human hand on every screen — the founder's next
  lived-experience test is that human pass, by design. (2) The review chooser
  was not visually redesigned (options were already card-scannable; its
  preamble text is unchanged) — flagged for the founder's next pass rather
  than silently descoped. (3) The five-questions presentation rule governs
  the prompt; live Gemini behavior should be confirmed in the founder's test.
  (4) CAP 200 now coaches from the neutral fallback rather than inherited
  autobiographical lines — a behavior change in a shipped course pathway,
  consistent with the brief, but worth one founder glance.

Production GitHub Pages untouched. Changes published to the family preview
only. SaaS Sprint 1 remains paused pending the founder's UX gate.
