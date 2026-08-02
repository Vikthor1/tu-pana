# Evidence checkpoints — Writing Studio UX exploration window

Append-only record for `writing-studio-ux-2026-08`. Checkpoints are evidence, not approvals,
closes, implementation authorizations, or concept selections.

---

## 2026-08-01 — exploration plane established

- **Prototype commit:** not yet applicable; plane root
  `1462aea172b89013d3ea7d70a0c933cba856737e`
- **Concept:** shared exploration plane
- **Hypothesis:** three disposable local concepts can be compared without touching production,
  family preview state, R0 work, real student data, shared Worker, or VC-OS.
- **Classification:** branch/worktree creation is authorized exploration-plane setup; production,
  data safety, authorship, disclosure, privacy, bilingual support, and safety assertions remain
  `INVARIANT`; prototype architecture and experience snapshots are `REVISABLE-WITH-EVIDENCE`.
- **Verified authorization:** R0 branch `remediation/writing-studio-r0` at exact root `1462aea`;
  VC-OS authorization commit `e32034a69e364cae9ff42949f4b2e7f637dcfbc7`; product `main`
  remained `0f66e46565f90627e15c91727527a7fd0ceda7c4`.
- **Safety results:** no product mutation occurred before verification; unrelated untracked files
  in the existing product worktree were left untouched.
- **Snapshot changes:** none.
- **Comparative/user evidence:** none.
- **Concerns:** physical-iPhone P1, founder comparison, and representative-student evidence open.
- **Next reversible test:** implement the same eleven-task journey in Desk, Journey, and Hybrid,
  using separate exact storage keys and mock AI.

---

## 2026-08-01 — Concept 1: Draft-centered Desk

- **Prototype commit:** `9e878e2fcb18bba2e4d71d50a5d6c20e2774f7f3`
- **Concept:** Draft-centered Desk
- **Hypothesis:** first-time students will understand one canonical draft plus contextual moves
  more quickly than stage-owned drafts, while still finding Council, focused review, prior work,
  reflection evidence, and Finish.
- **Classification:** one-draft workspace, two-place navigation, supporting move cards, and mobile
  Focus are `REVISABLE-WITH-EVIDENCE`. Exact text preservation, no automatic rewriting, consent,
  disclosure, isolated synthetic storage, bilingual access, genre correctness, and typed deletion
  friction are invariant protections.
- **Safety results:** shared prototype suite 98/98; unchanged R0 safety selection 277/277. Exact R0
  sentinel survived start, save/reload, reviews, Finish, and concept deletion. No external request.
- **Snapshot changes:** none. The concept uses a new `explore.html` entry and new test file; no R0
  snapshot or mixed contract file changed.
- **Comparative/user evidence:** functional automation only. One canonical editor survived reload;
  move notes remained supporting artifacts; Council/review/decision evidence re-entered through one
  center; final packet used the canonical text exactly.
- **Concerns:** move-card accretion, optional guidance being skipped, version visibility, and mobile
  Focus reducing orientation. No founder/student comprehension evidence yet.
- **Next reversible test:** founder tests blank start, return, review re-entry, and Finish; then
  compare first-time “where is my real work?” accuracy with Journey and Hybrid.

---

## 2026-08-01 — Concept 2: Clarified staged journey

- **Prototype commit:** `9e878e2fcb18bba2e4d71d50a5d6c20e2774f7f3`
- **Concept:** Clarified staged journey (Concept B control)
- **Hypothesis:** a single truthful ten-step spine, always-visible work rail, explicit current mark,
  and stage-independent Review Center may preserve the validated pedagogy without the existing
  architecture's ambiguity.
- **Classification:** ten visible steps, artifact ownership, current-version mark, work rail, and
  omission of mobile Focus are `REVISABLE-WITH-EVIDENCE`. Safety/trust protections remain invariant.
- **Safety results:** shared prototype suite 98/98; unchanged R0 safety selection 277/277. Navigation
  did not mark completion; carried-forward work stayed visible; packet used the marked artifact;
  no network request or R0-key mutation occurred.
- **Snapshot changes:** none.
- **Comparative/user evidence:** functional automation only. Back/Continue preserved work across
  steps, current-version status remained visible, and earlier artifacts were re-enterable.
- **Concerns:** ten-step burden persists; carried-forward artifacts may still appear to compete;
  current marker/work rail may add a new explanation layer. No evidence that student comprehension
  beats the other concepts.
- **Next reversible test:** founder asks a first-time student to identify the real work and current
  version at steps 2, 7, and 10 without explanation.

---

## 2026-08-01 — Concept 3: Simplified hybrid

- **Prototype commit:** `9e878e2fcb18bba2e4d71d50a5d6c20e2774f7f3`
- **Concept:** Simplified hybrid
- **Hypothesis:** four broad phases can retain purposeful sequencing and genre-aware moves while one
  canonical draft removes version ambiguity.
- **Classification:** phase count, contextual-move placement, single Review Center, and no separate
  mobile Focus are `REVISABLE-WITH-EVIDENCE`. Safety/trust protections remain invariant.
- **Safety results:** shared prototype suite 98/98; unchanged R0 safety selection 277/277. Canonical
  draft continuity, exact passage consent, decision ownership, reflection separation, packet truth,
  and isolated deletion passed.
- **Snapshot changes:** none.
- **Comparative/user evidence:** functional automation only. Four-phase Back/Continue, contextual
  moves, Review Center, and Finish were reachable without alternate drafts.
- **Concerns:** phases may be too broad; contextual pedagogy may be overlooked; hybrid may feel like
  Desk with a smaller progress bar rather than a coherent model. Exact phase count has no student
  evidence.
- **Next reversible test:** founder compares four phases with three and asks students to predict the
  next useful move at each boundary.

---

## 2026-08-01 — shared mobile passage, reflection, and verification checkpoint

- **Prototype commit:** `9e878e2fcb18bba2e4d71d50a5d6c20e2774f7f3`
- **Concept:** shared comparison contract across Desk, Journey, and Hybrid
- **Hypothesis:** architecture-independent passage capture, one decision grammar, and concise
  evidence-assisted reflection can be preserved across all three mental models.
- **Classification:** app-owned action placement and presentation are revisable; exact selection
  capture, preview, consent, cancellation, three distinct scopes, no auto-rewrite, no AI-authored
  reflection, and separate evidence appendix are invariant behaviors for this comparison.
- **Safety results:** prototype 98/98; R0 safety 277/277. Exact passage remained after programmatic
  selection collapse; fixed action fit 390 × 844; visible controls met 44px geometry; keyboard
  activation/Escape passed; three required prompts and separate appendix passed.
- **Snapshot changes:** none.
- **Comparative/user evidence:** Chromium emulation and automation only. In-app browser unavailable.
  No physical-iPhone, VoiceOver, founder, or student result.
- **Concerns:** binding mobile acceptance requirement 10 is open. Real iOS keyboard, native
  selection, safe-area, scroll anchoring, and VoiceOver may differ from Chromium emulation.
- **Next reversible test:** physical iPhone 17 Pro Max walk using a long synthetic draft, selection
  near the bottom, keyboard open, all three scopes, Cancel, consent, VoiceOver, ES/EN labels, and
  draft byte comparison. Do not close the P1 from emulation.

---

## Current checkpoint status

All three concepts are available locally. No winner is selected. Founder testing,
representative-student evidence, physical-iPhone passage validation, binding experience-contract
approval, and separately governed production implementation authorization remain outside this
checkpoint.

---

## 2026-08-02 — Concept 4: Cuaderno y Borrador · Notebook & Draft

- **Prototype commit:** `e8678738dfab6ef42992fc0c16aee1c46a87680c`
- **Concept:** additive fourth prototype, Cuaderno y Borrador · Notebook & Draft
- **Evidence source:** Claude/Fable's independent package at
  `/Users/Victor1/.codex/attachments/255c2074-8e12-4b1d-8074-be509c56aa65/pasted-text.txt`.
  Its counterproposal and shared foundations are design evidence, not implementation authority,
  selection, or settled doctrine.
- **Hypothesis:** first-time students may understand preparation and authorship more clearly when
  genre-shaped, skippable notebook cards remain distinct from one student-created canonical draft,
  and when **Write my draft** begins that draft empty without transferring notebook prose.
- **Classification:** Notebook/Draft places, card set, authorship-boundary wording, direct-draft
  path, dated snapshots, bounded desktop split, mobile stable tab, no separate Focus, and the
  pre-draft coach rule are `REVISABLE-WITH-EVIDENCE`. Exact text preservation, no automatic
  transfer/rewrite, consent and payload preview, isolated synthetic storage, privacy, disclosure,
  decision ownership, genre correctness, bilingual access, reflection authorship, separate evidence
  appendix, and typed deletion friction remain `INVARIANT` for this exploration.
- **Bounded coach assumption:** before a draft exists, mock coaching may discuss only ideas already
  in the active card and ask questions after exact preview and consent. It may not generate draft
  prose, create a draft, or transfer notebook text. Draft review, passage coaching, lenses, and
  Council unlock only after the student creates the draft. This is reversible and not settled
  doctrine.
- **Safety results:** four-concept suite 155/155; unchanged R0 selection 277/277. Exact notebook-to-
  draft non-transfer, one empty draft at creation, live save truth, exact reload, origin isolation,
  R0 sentinel preservation, concept-local deletion, no external request, 390 × 844 containment,
  44px controls, keyboard activation, Escape, and accessible names passed.
- **Snapshot changes:** none. Only exploration JavaScript, CSS, and the prototype-focused test were
  changed for this checkpoint. No R0 test or experience snapshot was edited.
- **Comparative/user evidence:** functional Chromium automation and local desktop/mobile screenshot
  inspection only. The prototype supports the complete eleven-task journey. In-app Browser exposed
  no connected instance. No founder, representative-student, physical-iPhone, or VoiceOver evidence
  exists.
- **Open bilingual disagreement:** Claude/Fable recommends equal-prominence Dual presentation. This
  prototype preserves the exploration's coherent Spanish-primary bilingual density. Neither is
  selected; comparative evidence is required.
- **Concerns:** students may confuse Notebook and Draft, place finished prose in Notebook or plans in
  Draft, experience **Write my draft** as obstruction, treat cards as compulsory stages, or lose
  orientation when opening notebook reference on a phone. Direct drafting may feel punished despite
  being available. The bounded coach may be too restrictive or insufficiently legible.
- **Next reversible test:** use synthetic material with the founder and representative students to
  test the nine falsification questions in the comparative evaluation, especially unprompted
  “Where is my real work?”, direct drafting, phone reference, and whether Notebook adds useful
  scaffolding beyond Desk without recreating Journey.

---

## 2026-08-02 — four-concept comparative verification checkpoint

- **Prototype commit:** `e8678738dfab6ef42992fc0c16aee1c46a87680c`
- **Concept:** shared comparison across Desk, Journey, Hybrid, and Notebook & Draft
- **Hypothesis:** the same authorship, consent, passage, review, decision, reflection, completion,
  genre, bilingual, mobile, and storage contracts can remain reachable across four materially
  different mental models without selecting one.
- **Classification:** the comparison hub, current-item switcher scrolling, live evidence counts, and
  documentation are `REVISABLE-WITH-EVIDENCE`; the existing safety contracts remain invariant.
- **Safety results:** prototype 155/155; R0 safety 277/277. Initial sandbox-only Chromium launch
  denial was environmental and cleared by rerunning unchanged suites with approved host browser
  execution; no product assertion failed. Final diff check and scope audit found no Worker, live
  Gemini, SaaS, production, R0 branch, family-preview, or VC-OS mutation.
- **Snapshot changes:** none.
- **Comparative/user evidence:** automation proves functional reachability, exact continuity, and
  safety behavior, not comprehension. Visual inspection corrected stale live counts and an initially
  offscreen current switcher item before the final green run.
- **Concerns:** physical-iPhone native selection, iOS keyboard/safe-area behavior, VoiceOver, founder
  comprehension, and representative-student testing remain open. Emulation does not close the P1.
- **Next reversible test:** founder runs the same eleven tasks in all four concepts without
  facilitator explanation and records predictions, errors, hesitation, recovery, and the nine
  Notebook falsification questions. Do not select a winner from automated results.

## Current checkpoint status — 2026-08-02 additive extension

All four concepts are available locally. No winner is selected. Nothing was pushed, deployed,
merged, promoted, or implemented in production. Founder testing, representative-student evidence,
physical-iPhone passage validation, VoiceOver, binding experience-contract approval, migration, and
separately governed production implementation authorization remain outside this checkpoint.
