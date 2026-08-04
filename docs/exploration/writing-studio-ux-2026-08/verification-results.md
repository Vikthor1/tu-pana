# Verification results — local comparative prototypes

**Finalist starting checkpoint:** `4bf3ead00a39835871b75a9acf45f783f6bcef53`
**Notebook checkpoint in history:** `e8678738dfab6ef42992fc0c16aee1c46a87680c`
**Bounded-correction starting checkpoint:** `90931c13b8e1c660e7ab4a33fe8fc4f8989dffb3`
**Date:** 2026-08-03
**Environment:** local static server; headless Chromium; synthetic content; deterministic mock AI

## Prototype journey suite

Command:

```bash
node prototype_exploration_test.mjs
```

Result: **238/238 PASS**.

## Bounded Integrated Desk correction suite

Command:

```bash
node prototype_integrated_corrections_test.mjs
```

Result: **48/48 PASS**.

The focused suite verifies the six authorized corrections without adding a destination or ordinary
writing prerequisite:

- saved Council revisitation creates no consent surface or duplicate run; **Convene again** remains
  separate, and rail report/decision truth refreshes immediately;
- mock feedback is linked to a locally recoverable, read-only exact Draft snapshot; viewing and
  copying earlier wording never mutates the active Draft; old textless records are labeled
  metadata-only checkpoints;
- dirty Move-note and paste text receives an inline **Discard changes / Keep editing** decision in
  the existing dialog, while unchanged dialogs close immediately;
- the 390 × 844 orientation control identifies the writing project, reaches Settings, switches to
  STEM, removes the autobiographical invitation, and recovers an unknown assignment through direct
  explicit selection with no overflow or new sub-44px correction control;
- Council genre, role, scope, timestamp, and mock provenance remain the stored autobiographical
  values after switching the active project to SOP;
- no-selection coaching exposes only real scopes and an exact matching preview; real passage
  selection restores the selected/paragraph/full choices without changing the Draft;
- native browser/device spellcheck defaults on for Draft, Notebook/reference, Move-note, rationale,
  and Process Reflection writing; the isolated Settings preference creates no review, evidence,
  readiness, Council, or packet claim; multilingual text remains byte-exact.

The suite exercised the full comparative journey in Desk, Journey, Hybrid, Notebook & Draft, and
Integrated Desk:

- comparison entry, visible orientation, synthetic start, exact save/reload continuity;
- preservation of an existing R0 sentinel key;
- immediate passage capture, exact-text retention after selection collapse, three scope choices,
  exact preview, Cancel/Clear affordances, and consent-before-mock-send;
- focused review, Council convening/re-entry, decision persistence, and no external request;
- exactly three required student reflection prompts and one optional knowledge prompt;
- separate student reflection and instructor appendix, exact packet draft, deliberate confirmation;
- immediate Spanish behavior, STEM genre correctness, one namespaced Danger Zone path;
- concept-local deletion that leaves the R0 sentinel unchanged;
- no page JavaScript errors and no non-local network requests;
- 390 × 844 viewport containment, no horizontal overflow, 44px visible control targets,
  accessible button names, keyboard activation, Escape close, and each concept's mobile Focus
  decision.

Notebook-specific assertions also passed:

- five skippable admissions cards; navigation did not mark evidence;
- exact save/reload of notebook text and truthful saving/saved status;
- My Work retrieval, pre-draft exact payload preview/consent, question-only mock coaching, and no
  draft creation by the coach;
- direct drafting after one card, an exactly empty canonical draft at creation, and exact
  notebook-to-draft non-transfer in stored state;
- one-action Notebook/Draft movement, exact draft reload, live word truth, dated snapshots, and
  reload-proof Review Center/Council history;
- passage capture near the bottom of a long draft, exact preview and three scopes;
- decision evidence without prose mutation, three required reflection prompts, separate appendix,
  exact final-draft confirmation, and distinct Save/Finish/Create packet/Backup/external Submit;
- structurally appropriate STEM notebook cards, Spanish-primary optional bilingual mode, isolated
  deletion, R0 sentinel preservation, and zero external requests;
- mobile draft priority, no compressed desktop split, stable Notebook tab, current switcher item in
  view, no Focus control, 44px targets, no overflow, and Passage Tray containment at 390 × 844.

Integrated Desk-specific assertions also passed:

- three primary Desk destinations, one canonical Draft, direct drafting without Move completion,
  persistent genre-keyed notes, useful-content evidence, and exact note-to-Draft non-transfer;
- canonical mixed-genre autobiographical availability; concise inline onboarding with
  engage/skip/revisit, translingual permission, and explicit disclosure choice;
- four autobiographical Moves, exact multilingual phrase protection, culturally appropriate
  connection/evidence/voice Council roles, culturally situated critical-risk cues, and four
  student-controlled genre Finish checks;
- visible Ask Tu Pana; passage/paragraph/full-draft selection; exact purpose, reviewer or Council
  roles, represented call count, payload, decision ownership, and consent;
- canonical contextual Five Question, optional remaining framework, Accept/Adapt/Reject/Decide-later
  ledger, optional student rationale, related version, and no prose mutation;
- two saved focused/coach reviews, reload-proof Council, factual Evidence so far, three required
  reflections, genre-appropriate optional fourth prompt, exact Finish, and full reload continuity;
- autobiographical/STEM contrast, no autobiographical leakage into STEM, SOP, admissions, or
  General Writing, and explicit unavailable STEM Council profile;
- General Writing neutrality and a loud configuration stop for an unknown assignment id, with no
  fallback to autobiography or General Writing;
- ordinary non-AI path from immediate typing through reflection and Finish with onboarding
  unanswered, no Move notes, no mock calls, no new mandatory action, and optional Council/AI status
  stated without failure language;
- isolated storage deletion, R0 sentinel preservation, zero external requests, and zero page errors;
- mobile Draft priority, adjacent coach action, Focus availability, switcher containment, 44px
  buttons/disclosures, dialog focus, Escape, reduced motion, no overflow, local 200% text-size
  reflow, and Passage Tray containment at 390 × 844.

## Density and interruption signals

At a 1440 × 960 first viewport with empty English state, the local text-node harness measured:

| Surface | First-viewport visible words | Steps before student can type in Draft |
|---|---:|---:|
| Plain Desk | 168–172 across final reruns | 0 |
| Integrated Desk before correction (`90931c1`) | 175 | 0 |
| Integrated Desk after resilience-utilities pass | 185 | 0 |
| Audited original stage-1 chrome | ≈205 single-language / ≈330 bilingual | 18 onboarding clicks in the audited desktop walk before the studio |

The original numbers come from the audit's bilingual/visual inventory and navigation walk; the
prototype numbers use a different local DOM viewport harness and are comparative signals, not a
universal law. Integrated Desk also passed these structural interruption checks: one blocking
dialog maximum; inline cultural onboarding only for the autobiographical path; no full Five
Questions wall until optional disclosure; no automatic Move sequence; no navigation-as-completion;
no celebratory decision interruption; no coach-chat accumulation; and no repeated simultaneously
visible disclosure wall. English-only and Spanish-only replace primary chrome, while bilingual
density increases only after explicit choice.

## Student-agency and resilience utilities

`prototype_integrated_agency_test.mjs` passed **27/27** against the local Integrated Desk.
It verifies compact pointer Undo/Redo and Edit-menu Select all on the active Draft; no editing
utility evidence/snapshot/AI/Council/decision side effect; exact-byte local Your Voice text plus
optional student reason; default-off and explicit exact-preview Voice inclusion in a mock review;
all five no-AI stuck choices; reversible Focus and no-timer break truth; writing-free instructor
summary; System/Paper/Dark persistence; Help’s local-only safe report preview; R0 sentinel and
network isolation; no page errors; and 390 × 844 header target/overflow geometry.

The measured +10 visible words from the hardened 175 baseline is the secondary Review Center
invitation “I’m stuck · Need one small next step?” in the ordinary viewport. Appearance, Help,
editing options, Voice, report preview, and spelling details stay hidden until invoked. This is a
comparative signal, not a comprehension result.

## Bounded Revision Cycle

`prototype_integrated_revision_cycle_test.mjs` passed **22/22** against the local Integrated Desk.
It verifies exact review-copy persistence and read-only viewing; continued live-Draft editability;
deliberate update with earlier snapshot retention; self-review, saved-feedback, mock-coach, and
Council as optional sibling paths; existing exact-scope consent and no silent Council rerun;
one student-authored revision focus; protected Voice as a student-defined preservation context;
desktop exact-text comparison; mobile Before / Current comparison controls; optional local brief
note feeding factual—not AI-authored—Process Reflection evidence; native spelling/theme/Edit/Stuck/
Help preservation; R0 sentinel; no external requests; no page errors; 44px tabs; and no 390 × 844
overflow.

The revision cycle remains dialog/Finish-context disclosure. The 1440 × 960 fresh ordinary Draft
measurement remains **185** visible words, with zero mandatory actions, zero entry interruption,
and three primary destinations. Its comparison does not calculate scores, grades, improvement, or
quality rankings. These checks are functional evidence, not proof that students understand a first
draft as revisable or experience the language as encouraging.

## Unchanged R0 safety-contract selection

All suites ran from the exact R0-rooted exploration worktree without assertion changes:

| Suite | Result |
|---|---:|
| `r0_safety_test.mjs` | 29/29 PASS |
| `passage_coach_test.mjs` | 26/26 PASS |
| `full_draft_review_test.mjs` | 34/34 PASS |
| `council_kernel_test.mjs` | 66/66 PASS |
| `council_ui_test.mjs` | 29/29 PASS |
| `genre_leakage_test.mjs` | 30/30 PASS |
| `voice_vault_test.mjs` | 28/28 PASS |
| `final_packet_test.mjs` | 22/22 PASS |
| `storage_keys_test.mjs` | 13/13 PASS |
| **Total** | **277/277 PASS** |

No safety assertion, mixed test file, or experience snapshot was changed. The prototype uses a
new test file and entry point, leaving the R0 experience intact for contract verification.

The first concurrent safety run produced a single byte-identity failure in `r0_safety_test.mjs`;
the unchanged suite immediately passed **29/29** when rerun alone, and the table records the final
isolated results. No assertion or product source was changed in response.

## Native spelling-assistance boundary

Automated checks confirm `spellcheck` state, isolated preference persistence, absence of new
evidence/readiness side effects, and byte-exact multilingual persistence. Native underlines,
English/Spanish dictionary behavior, replacement UI, and whether device suggestions can be
ignored comfortably are browser/OS behavior outside automation and remain open on desktop Safari,
desktop Chromium, and a physical iPhone. Tu Pana performs no spelling request and does not treat a
native suggestion as AI feedback or a judgment.

## Mobile passage P1 acceptance status

Viewport checks are implementation evidence, not physical-iPhone validation.

| Binding requirement | Local prototype status | Still required |
|---|---|---|
| 1. Select near bottom and reach action without upward scroll | App-owned fixed action stays inside 390 × 844 viewport | Physical iPhone + long draft + keyboard |
| 2. Capture the complete intended paragraph | Exact selected string persisted after native selection was programmatically collapsed | Physical iOS selection behavior |
| 3. Display exact passage before transmission | PASS in all five concepts | Physical-device confirmation |
| 4. Opening action does not alter draft | PASS by exact save/reload and preview checks | Physical-device confirmation |
| 5. Cancel leaves draft unchanged | Implemented; dialog closes without write | Physical-device confirmation |
| 6. Remain visible above keyboard without obscuring work | `visualViewport` offset plus fixed safe-area placement implemented; viewport geometry passed | Real iOS keyboard and scrolling |
| 7. Clear English and Spanish labels | PASS in immediate language switch | Founder comprehension on device |
| 8. Keyboard and screen-reader accessible | Keyboard activation, focus trap, Escape, labels, target geometry passed | VoiceOver physical-device test |
| 9. Preserve consent, disclosure, voice, Council | Consent/preview and Council exercised; R0 protections 277/277 | Lived-experience confirmation |
| 10. Physical iPhone verification | **NOT RUN / OPEN** | Required; emulation cannot close P1 |

No claim of physical-iPhone passage validation is made.

## Connected Writing Tools hardening

Exact base: `dc52940ff73aca0aed03f6e791f5eabc13f9e193`.

| Verification | Result |
|---|---:|
| Connected Writing Tools focused browser suite | 29/29 PASS |
| Revision Cycle regression | 22/22 PASS |
| Student Agency regression | 27/27 PASS |
| Integrated correction regression | 48/48 PASS |
| Complete five-concept comparative journey | 238/238 PASS |
| R0 safety selection | 29/29 PASS |
| Passage-coaching selection | 26/26 PASS |
| Storage-isolation selection | 13/13 PASS |
| Voice Vault selection | 28/28 PASS |
| Genre-leakage selection | 30/30 PASS |
| JavaScript syntax / diff whitespace | PASS |

Focused assertions cover student-authored/genre-correct Move notes, blank-click non-evidence,
exact quotation plus surrounding-context recovery after edits, optional Move framing with a retained
general path, exact preview/consent/provenance, filtered student-owned Evidence re-entry, no silent
mock or Council rerun, dismissible nonmodal invitations, exact multilingual/Your Voice persistence,
R0 sentinel isolation, and no external requests.

At 390 × 844, the Passage Tray's Move action and evidence filters remain 44px or larger, keyboard
reachable, Escape-safe, and free of page-level horizontal overflow. The complete comparison retains
accessible names, reduced-motion behavior, and its available 200% local reflow check. This is
browser automation, not physical-iPhone, safe-area, native-selection, VoiceOver, or lived
comprehension evidence.

The established 1440 × 960 harness remains plain Desk **168** visible words and fresh Integrated
Desk **185**. Connected behavior adds zero first-viewport words, zero mandatory pre-writing actions,
zero blocking entry interruptions, and zero primary destinations. The archive, optional Move
framing, and invitations are revealed only inside the existing Passage Tray, Evidence, Review
Center, and Finish contexts.

## Accessibility and responsive limits

Completed: keyboard activation of passage coaching; modal focus trap implementation; Escape
close; accessible names for visible buttons; minimum target geometry; mobile overflow; responsive
editor priority; `prefers-reduced-motion`; semantic headings, field labels, dialog roles, and live
regions; and a local 200% text-size reflow check. Desktop Notebook and Draft plus the 390 × 844
mobile Draft were previously captured and visually inspected. Integrated Desk passed equivalent
automated geometry; its separate visual walkthrough is recorded below.

Not completed: axe-core (not installed in the R0 workspace), VoiceOver/NVDA, Safari's real visual
viewport and selection behavior, physical mobile keyboard, zoom/reflow above the local 200% text
check and through 400%, Windows high
contrast, or cognitive usability with students.

## Browser-walkthrough limit

The Browser skill was initialized and its troubleshooting path completed, but the in-app backend
exposed no available browser instance. The automated local Chromium walkthrough and separate
Playwright screenshot inspection completed instead. No manual in-app-browser walkthrough is
claimed, and automated reachability is not comprehension evidence.
