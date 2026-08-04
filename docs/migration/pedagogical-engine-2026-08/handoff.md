# Migration handoff — pedagogical-engine migration and productionization pass

**Status: implementation complete in the isolated migration plane. NOT merged, NOT pushed, NOT
deployed, NOT promoted, NOT production-ready by declaration.** Founder review is the next gate.

## Exact commits

| What | Commit |
|---|---|
| Legacy Writing Studio source | R0 `1462aea` (`remediation/writing-studio-r0`); byte-identical in this plane |
| Hardened finalist base | `d8b92e8` (`explore/writing-studio-ux-2026-08`, Connected Writing Tools checkpoint) |
| Migration plane branch | `migrate/pedagogical-engine-2026-08` at `/Users/Victor1/Sites/tupana-writing-studio-migration` |
| Phase 1–3 docs checkpoint | `a8b84da` |
| Slice 1 — finalist fork → studio | `10edf51` |
| Slice 2 — profile registry + classification | `1956a3b` |
| Slice 3 — ordinary non-AI journey | `9000ade` |
| Slice 4 — provider seam | `f0b9f10` |
| Slice 5 — genre-configured Council | `6961e5e` |
| Slice 8 — bilingual both-mode + access | `8659b20` |
| Slice 9 — legacy import adapter | `cd4e854` |
| Verification + handoff docs | (final commit of this pass) |

Slices 6 (review copies / revision cycle / comparison) and 7 (Reflection / Finish / packet) were
**inherited intact from the finalist fork** and are pinned by `studio_revision_cycle_test.mjs`
(22 checks) and the closure legs of `studio_journey_test.mjs`; no code change was needed, so they
have no separate commit.

Product `main` (`0f66e46`), VC-OS (`e32034a`), `experiment/redesign-v1`, the R0 branch, the
exploration branch, the family preview, production Pages, and the Worker are all untouched.

## What the candidate is

`studio.html` + `assets/css/studio.css` + `assets/js/studio/{studio-profiles,studio-provider,studio-import,studio-ui}.js` —
a behavior-preserving fork of the hardened Integrated Desk finalist, productionized:

- **One canonical draft, three destinations** (Current Draft · Process Reflection · Finish),
  Review Center, Evidence, Moves rail, Passage Tray, Your Voice, revision cycle, agency
  utilities, appearance modes, native spellcheck, Help — all finalist behavior, pinned by the
  four cloned hardened suites.
- **Isolated storage**: one record, `tupana-studio:v1`, outside the legacy `tupana_` namespace;
  the legacy factory reset, export, and import can never touch it, and the studio never
  enumerates storage.
- **Explicit pedagogy registry** (`studio-profiles.js`): seven genre profiles; unknown ids stop.
- **Provider seam** (`studio-provider.js`): mock default; Gemini adapter configuration-selected,
  speaking the deployed Worker's existing contract; never exercised by automation.
- **Bounded legacy import** (`studio-import.js`): preview-first, byte-exact, provenance-truthful,
  read-only toward legacy keys, in-app rollback.

## Preserve / Adapt / Retire / Defer matrix

The full matrix is `migration-contract.md` (C1–C18). Outcome summary:

- **Preserved exactly** (finalist contracts, verified): canonical draft and exact persistence;
  three destinations; progressive disclosure; passage-linked Moves and reference-only notes;
  Your Voice exact-text protection with opt-in disclosure; Evidence browser with no
  completion/streak/quality inference; scope-true consent-gated Ask Tu Pana; Council
  revisit-without-rerun and convene-again-with-fresh-consent; exact snapshots with
  recoverable-vs-metadata-only truth; review copy + Before/Current comparison with no scores;
  equal Keep revising / Finish for now exits; three student reflection prompts + optional
  fourth; truthful Finish ("No Council requested—optional"); exact-draft confirmation before
  packet; I'm Stuck five needs; Undo/Redo in-session truth; System/Paper/Dark; native
  spellcheck; Help/report local-preview exclusions; R0 safety contracts.
- **Adapted (translated into the finalist model)**: genre layers → explicit profile registry
  with alias links; legacy stage 1–5 arcs → per-Move deeper progressive disclosure; Tu
  Conocimiento → the optional autobiographical knowledge-and-language invitation (assets inform
  Move/onboarding wording; Freirean sentence material lives in the optional reflection prompt);
  coach prompt contracts (authorship rules, whole-passage protocol, full-draft four-section
  contract) → per-request prompt builders; council.js role mandates/prohibitions/synthesis
  orders → profile Council config; provider retry/error taxonomy and bilingual failure copy;
  usage accounting (metadata-only, in-record); legacy work → bounded import adapter;
  student-reported revision exception concept → preserved as read-only imported evidence.
- **Retired (must-not-return list verified absent)**: ten student-facing stages; per-stage text
  buffers; word-count step inference; navigation-derived completion/milestones; badges, streaks,
  celebration interruptions, spotlights; chat column and chat-injected pedagogy; auto-opened
  reflection checkpoints and Five-Questions walls; gated Tu Conocimiento + Lab funnel;
  conversation-volume readiness; silent 240-char passage escalation; unearned packet
  attestations; one-click destructive import; silent unknown-assignment fallback to
  autobiography; duplicate CAP 200 layer (aliased with an explicit notice).
- **Deferred (explicitly)**: live Gemini validation and everything it gates (tone, latency,
  failure realism, five-questions behavior); the structured Council anchor-validation kernel
  (councilAnchorValid, caps, corroboration recomputation — validates provider JSON the
  deterministic mock does not produce; council.js is the cited translation source); tone
  (gentle/direct) axis; full packet localization; critical-question rotation under repeated live
  feedback; accounts/sync/instructor administration/receipts (SaaS Sprint 1+); physical-device,
  VoiceOver, representative-student, Brightspace evidence; production release of any kind.

## Genre-by-genre pedagogy traceability

| Profile | Link ids | Moves (source arc) | Council | Contract held |
|---|---|---|---|---|
| Mixed-genre autobiographical (canonical default) | `mixed-genre-autobiographical-essay`, none | memory-boundary · larger-force · research-context · voice-language (default template stages 1–8, `genre-template.js:83-183`) | connection/evidence/voice-cultural-integrity roles; cultural question | optional knowledge invitation; no compelled disclosure; code-meshing protected |
| College personal statement | `college-personal-statement` | disclosure · language · connection (admissions profile `:829-1135`: bounded story inventory, possibility-check criteria, no-trauma-demand) | voice-first order + no-prediction/no-unstated-achievements/no-prestige prohibitions (`council.js:146-162`) | no odds, no prestige normalization |
| Graduate SOP | `graduate-sop` | trajectory · evidence · fit (SOP profile `:1171-1327`: evidence map + [VERIFIED]/[STATED]/[MISSING] tags) | evidence-first + no-prediction/no-unstated-experience | no forced origin story |
| STEM lab report | `stem-lab-report` | question · observation · reasoning (STEM profile `:681-791`: observation/interpretation separation, never-invent-data) | **stated unavailable** (`council.js:134-137`) | zero cultural/autobiographical leakage |
| CAP 200 service-learning | `cap200-bronx-beautiful-service-learning`, `cap-200-first-draft` (aliased + notice) | community-starting-point · course-bridge · evidence-data-plan · imrdc-structure (service-learning layer `:374-495`) | evidence-first + never-invent-hours + no-deficit-framing (`council.js:104-118`) | community dignity; data never invented |
| Research paper | `research-paper` | focused-question · search-plan · source-evaluation · notes-patterns (research layer `:524-640`) | evidence-first + never-invent-citations (`council.js:119-131`) | community knowledge counts; sources never invented |
| General Writing | explicit selection only (`general-writing`) | purpose · evidence · structure (neutral set `genre-template.js:1515-1928`) | neutral roles | never a fallback |
| Unknown id | any unrecognized | none — loud configuration-required stop | none | inherits nothing |

Every Move carries bilingual nudge/why/prompt plus a `moveDeeper` paragraph translating that
genre's distinct legacy micro-guidance as progressive disclosure.

## Density and calm comparison (protected contract)

| Signal | Finalist (base) | Studio candidate |
|---|---|---|
| First-viewport visible words (1440×960, fresh EN) | 185 | 208 — **zero added surface words**; removing ~90px of exploration chrome (switcher + banner, −20 words) raises the fold over the already-designed editor column. Gate re-expressed fold-independently. |
| Full-page visible words (closed disclosure excluded) | 498 | ≤498 (suite-enforced; measured below baseline) |
| Mandatory actions before typing | 0 | 0 |
| Blocking entry interruptions | 0 | 0 |
| Primary destinations | 3 | 3 |
| Both-language density | Spanish-only on newer surfaces (defect) | grows only by the student's explicit Español + English choice |

## Migration/import limitations (stated to the student in-product where relevant)

- Legacy per-stage buffers carry no dates; imported snapshots say "date not recorded."
- The live-draft candidate prefers the ceremonially saved legacy first draft; with no saved
  draft, the highest-stage distinct buffer is proposed — always shown exactly in the preview.
- The legacy chat log, navigation progress, milestones, badges, and streaks are not imported.
- Legacy decisions/council/review/reflection records import as read-only evidence blobs, not as
  first-class studio records (their schemas differ; nothing is reinterpreted).
- The adapter never modifies legacy keys; a student can keep using the legacy app afterward.

## Remaining evidence this pass does NOT provide

No physical-iPhone, VoiceOver/assistive-technology, representative-student, founder
lived-experience, live-Gemini, Brightspace, cross-device, or institutional evidence exists for
the candidate. Browser emulation does not close the mobile passage-coaching P1's ten
physical-device acceptance requirements. Automated green is reachability and state truth, not
comprehension or welcome. **Never self-approve the founder gate.**

## Founder test script (complete journey, ~25 minutes, synthetic text only)

Serve this worktree: `node test-server.js` (port 3001), open `http://127.0.0.1:3001/studio.html`.

1. **Ordinary writing.** Open with no link parameter. Type immediately. Confirm nothing asks
   anything of you first. Reload — is every byte back? Where do you believe your essay lives?
2. **Genres.** Open `?assignment=college-personal-statement`, then `?assignment=stem-lab-report`,
   then `?assignment=cap200-bronx-beautiful-service-learning`, then `?assignment=research-paper`.
   In each: do the Moves speak this assignment's language? Open "Why this may help" and its
   deeper paragraph — is that your pedagogy? Does anything smell of the autobiographical essay?
3. **Unknown link.** Open `?assignment=quiz-3`. Does the stop feel clear and recoverable, not
   broken? Recover via Settings.
4. **Moves + passage.** In autobiography, select a meaningful synthetic phrase → Use a Move →
   save a note. Protect the same phrase as Your Voice. Find both again from Evidence.
5. **Ask Tu Pana.** Ask about the passage. Before consenting, can you say exactly what would be
   sent? Decline once; consent once. Then run a focused review (full draft) and record one
   Accept/Adapt/Reject decision with a reason.
6. **Council.** Convene it (mock). Close the report, revisit it from the rail — no consent, no
   rerun? Find "Convene again" and confirm it asks fresh consent. Switch genre in Settings and
   confirm the old report still names its own genre.
7. **Failure.** Open `studio.html?mockfail=rate_limited`, try a review. Is the message calm and
   truthful? Is your draft untouched? Remove the parameter and confirm recovery.
8. **Revision cycle.** Save a review copy, revise, compare Before/Current (also at phone width),
   write the optional note, choose Finish for now.
9. **Closure.** Complete the three reflections, skip the fourth, Finish, confirm the exact
   draft, create the packet. Does Finish ever shame the non-AI path?
10. **Bilingual.** Switch to Español, then Español + English. Do the revision cycle, I'm Stuck,
    and Help speak both languages now? Is your multilingual text byte-exact?
11. **Legacy import.** In a browser profile holding real legacy work (or the test fixture),
    Settings → Preview legacy import. Is the preview honest about what maps, what collapses,
    what is not imported? Apply, inspect, then Restore pre-import state.
12. **Phone pass.** Repeat 1, 4, 5, and 8 at 390×844. The physical-iPhone pass remains a
    separate, still-open requirement.

Record comprehension, hesitation, and burden separately from reachability. The candidate ships
only after founder selection, lived-experience validation, and a separately governed release
decision — none of which this pass provides.
