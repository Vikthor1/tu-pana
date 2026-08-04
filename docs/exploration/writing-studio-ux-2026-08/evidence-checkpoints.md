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

---

## 2026-08-03 — founder evidence and provisional finalist direction

- **Starting checkpoint:** `4bf3ead00a39835871b75a9acf45f783f6bcef53`
- **Evidence classification:** founder evidence and provisional preference; not final architecture
  approval, production authorization, or a selected product.
- **Finding:** Desk and Notebook were the two strongest concepts. Desk is the preferred
  architectural foundation. “Moves for this moment” read as optional novice guidance. Current
  Draft, Process Reflection, Finish, Review Center, and Evidence so far were especially clear.
  Desk remained clear in browser phone emulation.
- **Synthesis evidence:** Notebook showed the value of durable preparation material available beside
  the Draft. Its prompts offered more writing space but thinner guidance and another top-level mental
  model. The preferred reversible synthesis is Desk with persistent notes attached to genre-specific
  Moves.
- **Interaction correction:** the green informational strip under the editor was mistaken for an
  interactive coach surface. Integrated Desk adds a visibly actionable **Ask Tu Pana** affordance;
  the strip remains informational and visually quieter.
- **Mobile limit:** browser phone emulation does not close physical-iPhone selection, iOS keyboard,
  native selection, safe-area, visual-viewport, or VoiceOver requirements.
- **Next reversible test:** compare plain Desk with Integrated Desk without facilitator explanation,
  then test the same distinctions in Notebook, Hybrid, and Journey. Preference alone cannot promote
  the architecture.

---

## 2026-08-03 — Concept 5: Integrated Desk · Finalist

- **Concept:** additive final planned prototype, visually labeled **Finalist under evaluation**.
- **Hypothesis:** Desk can retain one unmistakable canonical Draft while adding durable Move notes,
  novice genre scaffolding, culturally and translingually responsive guidance where appropriate,
  contextual critical-AI judgment, and visible coaching—without restoring density, interruptions,
  or another navigation model.
- **Classification:** one Draft, exact persistence, authorship, payload disclosure, consent, no
  automatic rewrite/transfer, truthful evidence, student-authored reflection, separate appendix,
  final-draft confirmation, genre correctness, isolated deletion, and no external calls are
  `INVARIANT`. Move wording, note presentation, onboarding timing, contextual-question selection,
  rationale length, visible coach placement, Council availability message, and Focus behavior are
  `REVISABLE-WITH-EVIDENCE`.
- **Student-experience lens:** retained Current Draft → Process Reflection → Finish and one Review
  Center. Moves, Planning notes, and Evidence remain supporting surfaces. Direct drafting is never
  punished or blocked. No navigation action creates completion evidence.
- **Writing-process lens:** preparation appears as three optional, genre-shaped Moves with concise
  nudge, rationale, and durable note. Notes never transfer. Review, decision, reflection, version,
  and Finish boundaries support iterative revision without ten destinations.
- **Critical-AI-literacy lens:** canonical Five Questions were traced to `assets/js/ui.js`,
  `index.html`, the project brief, and reflection-checkpoint design note. Exact purpose, scope,
  reviewer/roles, represented calls, preview, ownership, and consent precede mock calls. One relevant
  canonical question follows; the remainder stays behind progressive disclosure. The factual ledger
  records source, scope, prompt, decision, optional student reason, time, and Draft version.
- **Culturally sustaining/translingual lens:** admissions offers concise, skippable, revisitable
  knowledge-and-language onboarding plus Moves that protect disclosure choice and code-meshed voice.
  STEM instead uses disciplinary knowledge, data, methods, and evidence, with no cultural/identity
  prompt leakage. No personal disclosure is required.
- **Accessibility/mobile lens:** Draft and Ask Tu Pana precede supporting panels on mobile; controls
  and disclosures meet local 44px geometry; dialog focus, Escape, names, reduced motion, no overflow,
  and a local 200% text-size reflow check pass. Passage Tray stays in the 390 × 844 emulated viewport.
  These are not physical-iPhone or VoiceOver evidence.
- **Trust lens:** one isolated key
  `tupana-explore:writing-studio-ux-2026-08:integrated:v1`; exact Move-note non-transfer; no AI prose
  mutation; explicit Save/Finish/Create packet/Backup/external Submit meanings; one typed Danger Zone
  deletion path; no R0 key read/enumeration/deletion.
- **Evidence/test lens:** five-concept functional journey, contrasting-genre leakage, critical
  mapping, decision ledger, exact reload, origin isolation, no external request, responsive,
  keyboard, focus, reduced-motion, target, overflow, and reflow assertions were added without
  editing R0 safety assertions.
- **Density/interruption signal:** Integrated Desk keeps three primary destinations and one inline
  first-use surface only in admissions. The full Five Questions remain hidden until requested;
  one blocking dialog maximum was observed; English-only and Spanish-only replace primary chrome;
  bilingual density increases only by explicit choice. Compared with plain Desk, the finalist adds
  one inline onboarding card, note actions, one coach action, and post-response disclosure. Compared
  with the audited original, it omits ten destinations, milestone/progress vocabularies, repeated
  question walls, chat notices, and celebratory decision interruptions. Visible-word counts are
  comparative signals documented in verification, not universal thresholds.
- **Source record:** immutable contracts came from R0 safety/product sources; canonical pedagogy from
  the source files named in the traceability record; founder findings from this authorization;
  durable preparation from Notebook and Claude/Fable design evidence; all layout, selection, and
  presentation details are reversible prototype assumptions.
- **Concerns:** notes may become mini-drafts or a hidden Notebook; added pedagogy may make Desk dense;
  cultural onboarding may feel imposed; critical prompts or rationale may feel like homework; coach
  action may still be missed; STEM Council absence may reduce usefulness; mobile Focus may hide
  reference material.
- **Next reversible test:** use `integrated-finalist-falsification.md` with the founder and
  representative students, then run physical-iPhone/VoiceOver checks. Do not select or promote from
  automation.

---

## 2026-08-03 — five-concept comparative verification checkpoint

- **Concept:** shared local comparison across Desk, Journey, Hybrid, Notebook & Draft, and
  Integrated Desk.
- **Safety results:** prototype suite 218/218 after the final rerun; unchanged R0 safety selection
  results are recorded in `verification-results.md`. Exact integrated Draft/Move-note non-transfer,
  full reload continuity, factual decision ledger, STEM leakage boundary, R0 sentinel preservation,
  local-only requests, dialog ceiling, 390 × 844 geometry, targets, focus, Escape, reduced motion,
  and local 200% text reflow passed.
- **Snapshot changes:** none. Existing four-concept behavior assertions remain green.
- **Comparative/user evidence:** automation proves functional reachability and state/safety
  behavior. It does not prove first-time comprehension, cultural welcome, critical judgment,
  cognitive calm, or mobile lived experience.
- **Open evidence:** physical iPhone with native selection and keyboard, real safe-area and visual
  viewport, VoiceOver and other physical assistive technology, unprompted founder comprehension,
  representative students, live Gemini tone/latency/failure, production migration, and final
  architecture approval.
- **Boundary status:** no winner selected; no push, deploy, merge, promotion, migration, product-main
  change, R0-branch change, family-preview change, Worker/live Gemini call, SaaS work, or VC-OS
  change.

---

## 2026-08-03 — Integrated Desk Path A correction: canonical autobiography

- **Correction classification:** founder-required evidence correction. The prior Integrated Desk
  checkpoint records admissions as the culturally responsive Path A. That path is superseded for
  the finalist by the canonical mixed-genre autobiographical essay; the prior entry remains visible
  because this log is append-only.
- **Blocker resolved:** the original autobiographical profile was not represented in the four prior
  prototypes and was never folded into General Writing. Integrated Desk now exposes it explicitly.
  General Writing remains a neutral, explicitly selected profile. Unknown assignment ids stop for
  genre configuration and inherit neither autobiography nor General Writing.
- **Canonical evidence consulted:** `assets/js/genre-template.js`, `assets/js/data.js`, `index.html`
  Tu Conocimiento, `assets/js/ui.js`, `assets/js/council.js`, the project brief and genre pathway,
  audit root-cause/progressive-disclosure/bilingual/leakage records, and pilot/colleague-review
  packets. The resulting element-by-element mapping is in
  `autobiographical-pedagogy-traceability.md`.
- **Pedagogical translation:** the ten-stage route was not restored. Four optional Moves preserve
  the canonical arc: choose a memory and boundary; connect it to a larger historical/social/
  cultural/linguistic/economic/political force; test experience with research/context; and protect
  language and voice. Notes persist beside one canonical Draft and never transfer into it.
- **Cultural and translingual contract:** first-use onboarding is inline, optional, revisitable, and
  permits English, Spanish, or code-meshing. It names cultural, linguistic, family, community,
  historical, and experiential knowledge as possible resources while explicitly making identity,
  trauma, family, migration, and cultural disclosure optional. Exact student-selected phrases can
  be protected without mock-AI judgment or prose mutation.
- **Review and critical-AI behavior:** focused lenses address personal-to-social connection,
  evidence/historical grounding, and voice/translingual integrity. Council roles translate the
  canonical structure, evidence/context, and voice/cultural-integrity mandates. Contextual cues ask
  whether mock output might genericize, flatten, stereotype, depoliticize, or misread situated
  writing; the canonical Five Question remains the decision prompt.
- **Reflection and Finish:** factual Evidence may report notes, protected exact phrases, reviews,
  decisions, and student-marked checks but never understanding. The optional reflection prompt
  names cultural, linguistic, family, community, historical, or experiential knowledge only if the
  student chose to use it. A student-controlled autobiographical Finish check covers connection,
  traceable sources, intended voice, and disclosure boundaries without gating or rewriting.
- **Targeted safety result:** five-concept suite **233/233 PASS**. This includes autobiographical
  availability; onboarding relevance/optionality; exact multilingual preservation; no compelled
  disclosure; correct review/Council configuration; zero autobiographical Move/onboarding leakage
  into STEM, SOP, admissions, and neutral profiles; and loud unknown-assignment failure. Unchanged
  R0 safety selection remains **277/277 PASS**.
- **Evidence limit:** functional routing and byte preservation do not prove that students experience
  the onboarding as welcoming, the four-Move translation as pedagogically sufficient, or the risk
  cues as culturally accurate. Founder, representative-student, physical-iPhone, and VoiceOver
  evidence remain open. No concept is selected or promoted.

---

## 2026-08-03 — Product-restraint governing clarification

- **Constraint:** the primary student job is developing one piece of writing, in the student's own
  voice, without losing control. Cultural responsiveness, translingual behavior, critical AI
  literacy, reflection, and evidence remain subordinate to that job and do not become destinations
  or compliance workflows.
- **Ordinary path:** automated coverage confirms immediate typing with onboarding unanswered, zero
  Move notes, zero mock-AI calls, exact local save, Process Reflection, and Finish. No Council or AI
  activity is shown as an optional choice rather than failed readiness. Mandatory actions before
  typing remain zero; the three primary Integrated Desk destinations are unchanged.
- **Density signal:** at 1440 × 960 the same local harness measured 168–172 first-viewport words in
  plain Desk across final reruns and 175 in Integrated Desk. Blocking entry interruptions are 0/0.
  The +3-to-+7-word result is a comparative signal, not comprehension evidence.
- **Progressive disclosure:** cultural intelligence remains mainly inside assignment-specific Moves,
  review/Council interpretation, and voice protection. Exact phrase protection appears after
  selection. Critical AI prompts appear only after mock AI; one contextual question is collapsed by
  default and the rest are optional. No tutorial, declaration, or new primary concept was added.
- **Review record:** `product-restraint-review.md` identifies every visible addition, why it earned
  space, what remains quiet, and the final values-versus-modules review. The cultural invitation and
  Ask Tu Pana placement remain reversible lived-evidence hypotheses.
- **Verification result:** final five-concept suite **238/238 PASS**; unchanged R0 safety selection
  **277/277 PASS**.

---

## 2026-08-03 — Integrated Desk bounded correction checkpoint

- **Starting prototype commit:** `90931c13b8e1c660e7ab4a33fe8fc4f8989dffb3`.
- **Independent evidence:** Fable's complete critique at
  `/Users/Victor1/.codex/attachments/5e64076d-cd94-44b8-91fd-c4d2910b5857/pasted-text.txt`.
  Its governing verdict is preserved: **Integrated Desk passes with concerns for founder/student
  testing.** The architecture remains calm; the bounded weakness was the feedback → decision →
  revision → revisit loop plus local truth/usability defects. This evidence does not select or
  promote the architecture.
- **Corrected F1 — Council revisitation/live truth:** the Integrated rail now opens a saved report
  directly when one exists. Revisit creates no consent prompt and no new mock run. **Convene again**
  is a separate secondary action inside Council history and begins a new consent flow. Report and
  decision counts re-render immediately and survive reload.
- **Corrected F2 — version truth:** new Integrated checkpoints store exact canonical text,
  timestamp, word count, signature, reason/phase, and genre. Evidence/Review Center provides a
  hidden read-only viewer and copy action; reports and decisions link to the associated snapshot.
  Viewing never restores or mutates the active Draft. Older records without text are explicitly
  **metadata-only checkpoints**, not recoverable snapshots. Production restore/migration is not
  implied.
- **Corrected F4 — dirty text:** Move-note, rationale, and paste/replace text compare against their
  opening value. Dirty Cancel, close, Escape, or backdrop interaction reveals an inline **Discard
  changes / Keep editing** choice inside the existing dialog; unchanged dialogs dismiss
  immediately. Temporary text creates no saved evidence. No second modal was introduced.
- **Corrected F5 — mobile genre reachability:** at 390 × 844, a compact orientation control names
  the current writing project and reaches the existing Settings surface. Settings can change the
  comparison genre; unknown assignments provide the same direct recovery path. Autobiographical,
  neutral, and disciplinary reflection/Finish/onboarding state is kept genre-scoped, while Move
  notes remain genre-keyed. General remains neutral and unknown ids fail loudly. Production may
  assign genres through links; this control exists for honest prototype comparison.
- **Corrected F7 — report provenance:** focused-review and Council runs store genre id, resolved
  labels, roles, payload scope, timestamp, mock provenance, and linked snapshot. History renders
  those stored facts after the active genre changes. Old records without provenance say that the
  genre was not stored rather than inferring the current project.
- **Corrected F8 — scope truth:** **Selected passage** appears only for an app-captured selection.
  Current paragraph appears only when a real editor caret identifies one; otherwise the full Draft
  is the only available scope and the interface explains how selection adds passage coaching.
  Preview text and word counts match the named scope; Cancel/Clear never changes the Draft.
- **Native spelling boundary:** student-authored Draft, Notebook/reference, Move-note, rationale,
  paste, and Process Reflection fields opt into browser/device spellcheck by default. The optional
  isolated Settings preference is quiet and creates no Tu Pana request, evidence, readiness,
  Council, instructor-appendix, or packet claim. Multilingual text and protected phrases remain
  exact. Native English/Spanish suggestion UI remains open for desktop and physical-iPhone tests.
- **Deliberately unchanged test-first findings:** F3 remains open on one decision dialog per
  finding, whether **Decide later** should become one click, and whether inline rationale expansion
  reduces fatigue. F6 remains open on first-time **Ask Tu Pana** discoverability and whether moving
  it upward would compromise calmness. The optional cultural invitation is unchanged. Reflection
  has no minimum length, scoring, AI evaluation, extra prompt, or inferred quality.
- **Deferred production requirements:** critical-question rotation/suppression under repeated live
  feedback; Spanish packet scaffolding and full packet localization; production restore and data
  migration; protected-phrase use in live-model prompting/constraints; appropriate translingual
  welcome outside autobiography; live Gemini tone, usefulness, latency, failure, stereotyping,
  flattening, and factual reliability; account/cloud/device synchronization; and physical
  assistive-technology testing.
- **Density/calmness evidence:** the same 1440 × 960 fresh English harness measured plain Desk at
  168 visible words and Integrated Desk at 175 both before and after this correction. Mandatory
  actions before typing remain 0; blocking entry interruptions remain 0; primary destinations
  remain 3. No Culture, AI Literacy, Notebook, Versions, or Spelling destination and no dominant
  first-viewport CTA was added. The only ordinary mobile addition is the compact current-project
  orientation control required to recover genre selection; version/spelling/correction controls
  stay behind existing progressive-disclosure surfaces.
- **Automated results:** targeted correction suite **48/48 PASS**; complete five-concept suite
  **238/238 PASS**; unchanged R0 safety selection **277/277 PASS**; JavaScript syntax, final diff,
  isolated storage sentinel, local-only request, keyboard/Escape/focus, 44px target, overflow,
  reduced-motion, and available 200% reflow checks passed.
- **Evidence limits:** automation proves functional reachability, exact persistence, isolation, and
  locally inspectable truth. It does not close decision fatigue, coach discoverability, founder or
  representative-student comprehension, physical-iPhone native selection/keyboard/safe-area/
  visual-viewport behavior, VoiceOver/physical assistive technology, or native spelling suggestion
  behavior. Those lived findings remain open.
- **Boundary status:** correction only; no sixth concept, architecture selection, production
  implementation, push, deploy, merge, promotion, migration, family-preview change, Worker/live
  Gemini call, SaaS work, R0/product-main mutation, or VC-OS mutation.

---

## 2026-08-04 — Integrated Desk student agency and resilience utilities checkpoint

- **Scope:** bounded additive refinement of the hardened Integrated Desk finalist only. Desk,
  Journey, Hybrid, and Notebook & Draft remain unchanged. The recovery target was the student
  purpose of legacy editing controls, “I’m stuck” triage, Voice Vault, appearance choice, and a
  bug-report safety valve—not their stage logic, screen structure, modal chains, or density.
- **Editing:** compact Undo / Redo and the collapsed **Edit** menu act on the active student writing
  surface (Draft, student note, rationale, paste, or reflection where present). History is
  in-session only and never creates evidence, snapshots, AI, Council, readiness, or instructor
  records. Browser/device clipboard limitations answer truthfully and direct the student to the
  device Edit menu; no false copy, cut, or paste confirmation is made.
- **Stuck support:** the Review Center’s secondary **I’m stuck · Need one small next step?** opens
  one accessible choice surface with five needs. It offers a genre-aware optional micro-task and
  existing Move, reopens saved feedback rather than creating a duplicate request, offers reversible
  Focus for overwhelm, confirms a local no-timer return point for breaks, and previews a
  writing-free local instructor summary. It remains useful without AI and never inserts prose.
- **Your Voice:** selection now offers **Keep as my voice** for any Integrated genre. The exact
  student-selected phrase or passage is local, byte-preserved, optionally annotated by the student,
  and visible later only after an entry exists. It is neither a quality score nor an inferred cultural
  claim. A reviewer sees Voice entries only after the student opens the optional disclosure,
  inspects the exact entries, and separately consents; the local mock records the request without
  claiming live-model enforcement.
- **Appearance and Help:** a compact labelled header control cycles System default / Paper / Dark;
  Settings offers the full local preference and keeps native spelling assistance quiet. Help offers
  separate Report a problem and Share feedback routes. The resulting preview can contain only an
  optional student description and opt-in safe technical context (prototype version, genre id,
  browser/device category). It explicitly excludes all student writing and is never sent.
- **Restraint/density:** Current Draft, Process Reflection, and Finish remain the only primary
  destinations; no entry interruption, required action, empty Voice panel, permanent editing ribbon,
  chat column, or added first-viewport dominant CTA exists. The same fresh 1440 × 960 harness now
  measures plain Desk **168** visible words and Integrated Desk **185** (+10 versus the hardened
  175 baseline). The only measured visible addition is the quiet Review Center stuck invitation;
  appearance, Help, Edit choices, report route, Voice reference, and Settings detail are progressive
  disclosure. Mandatory actions before typing remain **0** and blocking entry interruptions **0**.
- **Functional evidence:** new agency suite **27/27 PASS**; Integrated corrections **48/48 PASS**;
  complete five-concept journey **238/238 PASS**. The new suite covers exact Draft undo/redo,
  context Edit menu, absent evidence side effects, phrase protection and optional reason, opt-in
  Voice preview, each no-AI stuck route, temporary Focus, local break truth, writing-free instructor
  summary, appearance persistence, Help local-preview exclusion, R0 sentinel preservation, no
  external requests, and 390 × 844 target/overflow checks.
- **Spelling boundary:** native browser/device spellcheck remains default-on where supported for
  student fields. It sends no Tu Pana request, makes no evidence/readiness/quality claim, and does
  not mutate text. Its actual English/Spanish suggestion interface remains a desktop and physical
  iPhone/browser test, not an automated Tu Pana result.
- **Open lived evidence and deferred production work:** physical-iPhone selection, keyboard,
  safe-area, and native spelling UI; VoiceOver and physical assistive technology; founder and
  representative-student comprehension of I’m stuck, Your Voice, and appearance controls; whether
  optional Voice constraints help live feedback; live Gemini behavior; a real privacy-reviewed
  report endpoint; cross-device synchronization; production-grade editing/restore; and any SaaS or
  migration work all remain open and unimplemented.
- **Boundary status:** no push, deploy, merge, promotion, migration, selection, product-main/R0/
  VC-OS/family-preview mutation, Worker/live Gemini call, or SaaS work.

---

## 2026-08-04 — Integrated Desk bounded Revision Cycle checkpoint

- **Exact base:** Student Agency and Resilience Utilities checkpoint
  `19f1584fe8f034c0b61818c5d3ff5163476e09fa`, verified clean before work. This is an additive
  Integrated Desk refinement, not a sixth concept, final lock, architecture decision, or stage
  sequence.
- **Current-map evidence:** exact local snapshots were already read-only/recoverable and linked to
  mock review/Council records; Review Center already re-opened saved reports without a rerun;
  Process Reflection accepted factual evidence only; Finish confirmed an exact Draft separately
  from packet creation. Binding contracts retained: one canonical editable Draft, exact snapshots,
  explicit payload/consent, no automatic rewrite, no AI reflection, decisions separate from prose,
  protected Voice, local-only storage, and distinct Save/Finish/packet/Submit meanings.
- **Minimal translation:** a `reviewCopy` pointer names one existing exact snapshot as the local
  review copy; `revisionCycle` stores only optional student-authored focus/brief-note text. Review
  Center and Finish expose the entry; existing Review Center, snapshot viewer, protected Voice,
  Process Reflection, and Finish surfaces carry the rest. No new workspace, primary destination,
  timeline, version dashboard, score, grading signal, feed, checklist, chat, or required sequence
  was added.
- **Cycle behavior:** **Ready for a second look** opens a calm local explanation and **Save a review
  copy**. It stores exact current Draft text, keeps the live Draft editable, and never calls the
  copy final, locked, complete, ready, or submitted. If the Draft later changes, **Update review
  copy** is a deliberate action; the prior exact snapshot remains recoverable in local history.
- **Choice, not funnel:** after saving, self-review, saved feedback, exact-scope Tu Pana mock
  feedback, and separately consented genre-configured Council are sibling choices. Saved-feedback
  re-entry does not make a new call; Council preserves availability blocking, revisit truth, roles,
  cost disclosure, and consent. Students may proceed to Finish with no AI/Council use.
- **Revision bridge and comparison:** self-review or any saved finding can open **Choose what to
  work on** for one optional student-authored focus. Existing Accept/Adapt/Reject/Decide-later
  remains intact. Your Voice appears only as exact student-defined preservation context. Comparison
  presents the exact review copy and exact live Draft, side-by-side on desktop and Before/Current
  tabs on phone. It makes no difference score, grade, improvement claim, red/green judgment, or
  norm against multilingual/culturally situated phrasing.
- **Closure:** optional brief revision note asks what changed, what sounded like the student, or
  what to revisit later. It creates factual local evidence only; Process Reflection remains wholly
  student-authored. Keep revising and Finish for now are explicit, equal exits; another review is
  always deliberate.
- **Verification:** focused revision-cycle suite **22/22 PASS**; agency suite **27/27 PASS**;
  correction suite **48/48 PASS**; complete five-concept suite **238/238 PASS**. Coverage includes
  exact-copy/viewability/live editability, deliberate update and history retention, optional paths,
  consent/no silent Council call, student-controlled focus/Voice, factual reflection evidence,
  no external requests, R0 sentinel, native spellcheck/theme/Edit/Stuck/Help preservation, mobile
  Before/Current tabs, target size, overflow, and zero page errors.
- **Density/restraint:** fresh ordinary Draft state remains **185 visible words** (plain Desk 168),
  unchanged from the student-agency checkpoint because the Revision Cycle is only exposed in Review
  Center/Finish context. Mandatory actions before typing: 0. Blocking entry interruptions: 0.
  Primary destinations: 3.
- **Open evidence:** physical-iPhone comparison interaction, native selection/keyboard/safe-area,
  VoiceOver, high-zoom beyond local checks, founder and student comprehension of “review copy,”
  whether the cycle feels encouraging rather than burdensome, value of one-revision framing across
  genres, live Gemini behavior, production storage/migration/restore, and real instructor-feedback
  routing remain unvalidated and unimplemented.
- **Boundary status:** local mock/synthetic exploration only; no push, deploy, merge, promotion,
  migration, production/R0/VC-OS/family-preview/Worker/live-Gemini change, SaaS work, or prototype
  selection.
