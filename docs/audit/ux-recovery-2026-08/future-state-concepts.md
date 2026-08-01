# Future-State Concepts — Tu Pana Writing Studio

**Deliverables 11–12 · Four legitimate exploration directions + provisional decision framing.
Each concept addresses the whole student journey. Evidence base: the five inventory documents in
`inventory/` and the journey-walk evidence in `evidence/`; no concept has student-comparison
evidence or implementation approval.**

## What any concept must solve (from the evidence)

1. **Four progress vocabularies** (3 phases / 5 milestones / 10 etapas / 3 in-stage steps) and
   **five coexisting navigation paradigms**; the footer spine is the most consistently truthful,
   with a known self-pointing Stage-10 exception
   (inventory/screens-and-navigation.md).
2. **No canonical draft.** Working truth lives in per-stage keys; the "final essay" is picked by
   a heuristic at packet time that can prefer an older stage-8 text over a newer stage-7 rewrite,
   invisibly (inventory/persistence-and-save-model.md).
3. **The chat column is also the notice board** (~18 injected component types), so guidance,
   status, refusals, and review results compete in one scrolling stream; on mobile, refusals go
   to a hidden tab with no notification dot.
4. **The AI loop ends at "decide."** Council decisions never reach the Process Note or packet;
   the verify-after-revision seam exists in code and is never called; re-entry affordances are
   DOM-only and vanish on reload (inventory/ai-interaction-model.md).
5. **Onboarding is a pile, not a path** — first entry renders project selector + lab + manifesto
   + preview machinery stacked (walk evidence, first-entry screenshots); reflection checkpoints
   interpose over open stage-preview dialogs mid-transition (walk evidence, `interposed-dialog`).
6. **Bilingual preference exists but ~360 surfaces bypass it**; the AI-literacy lab and the
   start-here tutorial are English-primary; EN-mode phones render an empty task bar (P1)
   (inventory/bilingual-visual-a11y.md).
7. **Genre integrity is content-deep but not structure-deep**: five layers reinterpret the
   10-stage spine honestly, but milestones, word-count gates, report surfaces, and the Council's
   default profile still speak essay (inventory/genre-stage-matrix.md).
8. **Trust leaks**: navigation recorded as completion; "saved" celebrations styled differently
   in every surface; destructive reset one native confirm away from the header.
9. **Mobile passage coaching is physically unreliable**: on iPhone 17 Pro Max the actions appear
   but sit far above a bottom-of-draft selection; scrolling to them collapses or truncates the
   native selection. Every candidate must preserve the captured passage and keep app-owned coach
   actions inside the visual viewport (evidence/founder-ux-exploration-evidence-2026-08-01.md).
10. **Reflection is duplicated and report truth is inconsistent**: the current finish flow
    end-loads many overlapping prompts, omits Council decisions, and can report readiness or
    completion without the underlying reflection/completion evidence. Every candidate must test
    concise evidence-assisted reflection without inventing student reasoning (same evidence).

---

## Concept A — **The Desk** (draft-centered workspace)

**Core mental model:** *One piece of writing, one desk.* The student owns a single canonical
draft from minute one. The ten stages become guided *moves* applied to that draft (find your
story, connect it, pitch it, research it…), each producing a named **card** (anecdote, pitch,
outline) pinned beside the draft — not ten separate editors.

- **Navigation model:** two places — **Desk** (write, coach, review) and **Finish** (process
  note, packet, export). A journey rail shows the moves in order with true completion (work
  exists ≠ clicked past). Movement = rail; action = toolbar. No stage-preview modals.
- **Stage/artifact model:** canonical draft + typed cards. Cards are context, never competing
  drafts; "bring into draft" is an explicit insert with visible diff.
- **Save/persistence model:** continuous autosave to the draft + an automatic, visible version
  timeline (every move completion snapshots a version; restore is one tap, never destructive).
- **Coach/review/Council model:** one Help rail with legible escalation (ask → passage help →
  focused lens → Council), one decision grammar (accept/adapt/reject) persisted in a decisions
  ledger the Process Note renders automatically.
- **Process Note/submission:** Finish space assembles itself from the ledger + versions; the
  student reviews and signs rather than reconstructs.
- **Mobile:** desk-first; rail and cards become bottom drawers; editor keeps keyboard-safe
  viewport priority.
- **Advantages:** eliminates the stranded-work and no-canonical-draft classes *by construction*;
  matches students' Google-Docs mental model; ten-questions answers become trivial ("where is my
  work" = the desk).
- **Tradeoffs:** the staged pre-writing pedagogy must be re-expressed as moves/cards without
  losing its sequencing power; receipts, word-count gates, and 38 suites' worth of stage
  semantics need remapping; largest content rewrite.
- **Migration risk: HIGH.** Persistence remodel (per-stage keys → draft+cards+versions) with a
  compulsory, well-tested import of existing localStorage journeys (the founder's son's work
  must survive).

## Concept B — **The Honest Journey** (stage-centered, radically clarified)

**Core mental model:** *Same pedagogy, one truthful spine.* Keep the 10-stage engine and
per-stage artifacts; delete every competing structure around them.

- **Navigation model:** ONE progress vocabulary (10 steps, displayed inside 3 acts — "Start /
  Revise / Finish"; milestones become private analytics, not UI). One spine: Back / Continue-to
  (already truthful) + one always-available journey map (currently buried behind two disclosure
  toggles). Stage-preview modals become inline step headers; nothing interposes on a transition
  — reflection checkpoints move INTO the step as its closing prompt, never over another dialog.
  Chat stops being the notice board: statuses, refusals, and offers move to a persistent,
  calm status rail with a mobile notification dot.
- **Stage/artifact model:** per-stage artifacts stay, plus two additions: a permanent
  **work rail** listing every artifact with its stage and freshness (visible on all screens —
  the prior-work strip generalized from "when editor is empty" to "always"), and an explicit
  **current-draft marker** from stage 6 on: the packet uses the marked draft, never a heuristic;
  marking is student-visible ("This is my current version ✓").
- **Save/persistence model:** keep quiet autosave + truthful indicator; complete the F1
  separation — backup/import/email/danger leave the routine hub entirely (Settings); import
  gains preview + confirmation + automatic pre-import safety export; origin/device reality gets
  an honest surface ("your work lives in this browser — take it with you" card at Finish and in
  Settings).
- **Coach/review/Council model:** one **Review center** drawer, stage-independent from stage 7
  (reachable at 10; report history persisted, not DOM-only); single decision grammar everywhere;
  decisions + verification statuses flow into the Process Note automatically (the built-but-
  unused `recordCouncilVerification` seam finally called); the Five Questions become a per-review
  habit prompt instead of a repeating chat enumeration.
- **Process Note/submission:** unchanged in placement (Finish, stage ≥9) but self-assembling
  from the decision ledger; submission checks appear only in Finish.
- **Bilingual:** keep the existing 3-way preference; migrate all ~360 bypassing surfaces to the
  `{es,en}` span system; lab + start-here get full Spanish; language choice moves to onboarding
  step 1 and persists.
- **Mobile:** one nav (steps sheet), keyboard-safe editor, dot-notified status rail, 44px
  targets, EN task-bar bug dead.
- **Advantages:** preserves the validated pedagogy, the Council, receipts semantics, and most of
  the 38-suite safety net; every P0/P1/P2 *class* found by this audit has a home in it; the
  founder's son's in-flight work survives untouched; implementable as a sequence of bounded,
  testable batches (roadmap in `remediation-roadmap.md`).
- **Tradeoffs:** ten stops remain ten stops — genres where stages are repurposed (STEM 4–5,
  SOP 7/9) stay slightly costumey until Concept C's config work; per-stage artifacts still
  require the current-draft marker discipline.
- **Migration risk: MEDIUM.** No persistence remodel; experience-snapshot tests rewritten
  batch-by-batch; safety contracts untouched.

## Concept C — **Genre Journeys** (per-genre-family journeys on a shared core)

**Core mental model:** *The assignment shapes the journey.* The engine gains variable journey
definitions: essay family keeps 10 steps; admissions/SOP run a 6-step arc (story → fit → draft →
review → polish → finish); STEM runs an IMRaD-shaped sequence; CAP 200 runs its report arc.
Desk, Review center, Finish space, and the AI stack are one shared core under all of them.

- **Navigation/save/AI models:** inherited from Concept B's spine (single vocabulary, work rail,
  Review center, self-assembling Process Note) — C is B with a configurable journey length.
- **Advantages:** resolves the last genre-integrity residue (forced stages, essay-shaped
  milestones/word-gates); makes the SaaS story per-department honest ("your assignment's
  journey," not "our essay's journey with your labels").
- **Tradeoffs:** journey-config authoring + QA per family; receipts/analytics need family
  dimensions; risks diluting the single Tu Pana method the CAP 200 evidence base is built on;
  content load is the real cost (Agent B: only admissions has bespoke coaching copy today —
  five families of bespoke journeys is a large authoring commitment).
- **Migration risk: HIGH** overall, but **incremental by family** if built on B (each family
  migrates alone behind its `?assignment=` link).

---

## Simplified hybrid — **One Draft, Optional Guide**

**Core mental model:** *My draft is the work; the guide helps when I need it.* A single canonical
draft occupies the main workspace. The existing ten-stage pedagogy survives as an optional,
collapsible guide grouped into three acts, but stages do not own ten separate editors and are not
the student's primary storage model.

- **Navigation/artifact model:** Desk / Guide / Finish. The guide records evidence and decisions;
  the draft remains canonical throughout. A student may follow every guided move or return
  directly to the draft without creating competing versions.
- **Advantages:** tests whether the strongest part of A (one obvious home for work) can coexist
  with the validated pedagogical sequence and review loop; potentially less content/config work
  than A or C and less mental-model risk than B.
- **Tradeoffs:** requires a real persistence migration and careful rules for how guided artifacts
  inform—but never overwrite—the canonical draft; receipts and current stage analytics need
  reinterpretation.
- **Migration risk: MEDIUM–HIGH.** It is a legitimate exploration candidate, not a compromise
  already selected for implementation.

---

## Decision status — **four legitimate candidates; B is provisional**

**No future-state concept is approved by this audit.** Concept B (The Honest Journey), with A's
work rail and current-draft marker, is the most developed *provisional comparison candidate*.
Concept A, Concept C, and the simplified One Draft / Optional Guide hybrid remain legitimate
exploration candidates for the founder's decision.

Why B originally led:

1. It gives every major finding class an implementation home while preserving the Council,
   authorship protections, and the existing staged pedagogy.
2. It avoids an immediate persistence migration and preserves more of the 38-suite baseline.
3. It decomposes cleanly into VC-OS Tier-2 batches and therefore appeared easier to govern.
4. It offered the shortest apparent route back toward the paused SaaS sequence.

Those are meaningful delivery constraints, but points 2–4 are **governance compatibility,
migration convenience, and schedule considerations—not student evidence**. They materially
influenced the original recommendation and must not be mistaken for proof that B is the best
student experience.

The unresolved risk is fundamental: **B retains the ten-stage, per-stage-artifact model.** A
work rail and current-draft marker may clarify that model, or they may add another explanation
layer while preserving the original student question: “Which box is my real work?” The audit's
rendered walks and code inspection cannot answer that. No student comparison of these concepts
has occurred.

**Exploration gate before implementation:** compare at least B, A, and the simplified hybrid at
prototype fidelity on first-entry, return-to-earlier-work, draft revision, review re-entry, and
final-version selection. Include Concept C when a genre family is in the founder's near-term
scope. Use the usability protocol's unaided tasks and ten-question probes; select a direction on
student comprehension and work-trust evidence first, then migration/governance cost. If B does
not let first-time students immediately identify one real home and one current version, its
retained artifact model fails the gate and should not proceed merely because it is easier to
batch. Every candidate must also satisfy the ten mobile passage-coaching acceptance requirements
in `evidence/founder-ux-exploration-evidence-2026-08-01.md`, including validation on physical
iPhone hardware; viewport simulation alone cannot close that P1.
