# Acceptance Criteria — approved-direction implementation

**Deliverable 20 · Binding per roadmap batch. A batch closes only when every criterion listed
for it holds and is evidenced (test id, walker-diff artifact, or manual-sweep record). The
principle acceptance forms in `target-experience-principles.md` (P1–P12) apply globally; this
file adds the batch-specific, checkable statements. The founder lived-experience gate sits
above all of this and is never replaced by it.**

## Global invariants (every batch, non-negotiable)

- G1. All safety-contract suites green (leakage, disclosure, authorship, persistence integrity,
  Worker budget/kind, clear-data friction) — never relaxed to make a batch pass.
- G2. No student-authored text is modified, moved, or deleted by any migration; existing
  localStorage journeys (including the founder's son's admissions work) load correctly
  post-batch — verified by a seeded fixture replaying a pre-batch store.
- G3. Production untouched; preview-only publication; no merge without founder approval.
- G4. Walker sweep runs at batch close; its observation diff is reviewed and attached.

## R0 — Immediate safety and trust corrections

- R0.1 On a 390px viewport in EN mode, the task-instruction bar displays the current step's
  instruction text (regression test at ≤640px × each language mode).
- R0.2 Applying a backup shows a preview (word counts + dates per artifact) and requires an
  explicit "Reemplazar · Replace" act; a pre-import snapshot exists and a safety file download
  was offered before any write; aborting leaves the store byte-identical.
- R0.3 Header Reset requires typed confirmation (BORRAR/DELETE) and offers an export in the same
  dialog; no single-confirm path to `localStorage.clear()` exists anywhere.
- R0.4 With `?assignment=stem-lab-report` or `cap-200-first-draft`, either the Council is not
  offered, or its reviewer prompts contain zero autobiographical-essay framing (string
  assertion); an unprofiled genre logs a detectable config warning.
- R0.5 A 403/origin failure renders a non-retry message naming the cause class; no automatic
  retries fire; a transient 5xx renders a retryable message; the two are distinguishable in test.
- R0.6 In hide-coach mode the exit control's label matches its actual handler result; pressing
  it restores the coach; no control in the app has a label owned by one system and a handler
  owned by another (control-ownership audit table updated).
- R0.7 On first load, no typing indicator is visible before the first coach message begins.
- R0.8 Routine chat requests contain no `maniSentence`; if a future explicit share control is
  enabled, the immediately preceding disclosure names that exact student-authored field and the
  request-payload test proves no undisclosed prose travels.
- R0.9 Every save/status message names the artifact actually saved and the capability actually
  unlocked; stages 1–5 and 7–10 contain zero false "first draft saved / revision unlocked" claims.
- R0.10 Fault injection across chat, decisions, process note, capstone, vault, Council, and draft
  stores produces a persistent visible failure within 1s, names the unsaved artifact, and offers
  an export containing available in-memory work; no write exception is swallowed silently.
- R0.11 Packet generation cannot proceed until the student sees the exact heuristic-selected
  draft (stage, word count, and preview) and explicitly confirms it; cancel leaves state and
  packet outputs unchanged. R2 replaces this interim gate with a persistent current-draft mark.

## R1 — Navigation spine

- R1.1 Exactly one progress vocabulary renders anywhere ("Paso N de 10" + 3 acts); the strings
  "Etapa", "Hito", "de 5" (as progress), and per-stage "Paso X de 3" appear nowhere in UI,
  packets, or reports (sweep assertion).
- R1.2 Each step declares an artifact-specific completion rule in configuration (required
  artifact/checkpoint evidence and, where pedagogy permits, an explicit student "Mark complete"
  action). A step shows "done" only when that declared rule is satisfied and the completion
  record stores its evidence, timestamp, and method. Merely visiting, navigating past, or typing
  an arbitrary character never marks a step done; navigation state and completion state are
  separately asserted.
- R1.3 From every screen: the map opens in one act (tap or Enter); every step node is tabbable
  with `aria-current` on the active step; a locked step's node states its lock reason inline.
- R1.4 At no reachable moment do two blocking surfaces exist simultaneously; walker asserts a
  single visible blocking layer per state across all genres (the `interposed-dialog`
  observation class count = 0).
- R1.5 Onboarding is ≤3 sequential surfaces, language choice first, each dismissible/skippable
  where the spec says; lab and manifesto never appear stacked with anything.
- R1.6 Refusals, save events, celebrations, and technical status render in the status rail —
  `#chatMessages` receives conversation messages only (message-class assertion); on mobile,
  a rail event sets the dot within 1s.
- R1.7 Every movement control names its destination; every action control names its effect;
  the ten-questions selector map exists for every screen state (P1 acceptance form) with zero
  unmapped questions.

## R2 — Work rail + current-draft truth

- R2.1 The work rail lists every artifact with ≥1 character, with step name and freshness label,
  on every screen including empty-editor states (walker: zero blank-editor-with-prior-work
  observations on any nav path, any genre).
- R2.2 Exactly one artifact carries the current-draft mark from step 6 onward; the packet body
  equals the marked text verbatim (byte comparison test); `getFinalEssay()`-style heuristic
  selection is absent from the packet path.
- R2.3 Editing any other stage after marking renders the "newer than your marked version" tag
  within the rail and a reconcile prompt in Finish; marking is one student act from the rail.
- R2.4 Every overwrite-class event (bring-forward, restore, import, mark-switch) writes a
  snapshot first; restore of any snapshot is one act and never destructive (snapshot-ring test).
- R2.5 Refresh/return at any step restores editor content, scroll-to step, rail state, and any
  open review exactly (walker refresh probes at 3 steps × 3 genres).

## R3 — Save / finish / destruction separation

- R3.1 The routine hub ("Mi trabajo") at steps 1–8 contains zero submission checks, backup,
  import, email, or destructive controls (DOM assertion); its word count ≤250.
- R3.2 Finish space is enterable only via the explicit prepare act at step ≥9; submission
  warnings appear only there.
- R3.3 A blocked write shows the failure banner within 1s, names what is unsaved, and its export
  includes the in-memory text (fault-injection test); `navigator.storage.persist()` requested at
  boot; eviction notice appears with a date on eligible browsers.
- R3.4 A factory-fresh boot renders the "Did you start somewhere else?" card with a working
  import door; Settings displays the origin string.

## R4 — One AI relationship

- R4.1 Every send path (chat, passage, lens, Council, capstone) has a moment-of-consent
  disclosure naming exactly what leaves the device; routine chat sends contain no
  `maniSentence` unless the share toggle is on (request-payload assertions; toggle default off).
- R4.2 Lens reviews, Council findings, and chat suggestions all offer Aceptar/Adaptar/Rechazar/
  Decidir después; every decision persists to the ledger and survives reload.
- R4.3 The Review center opens from every step 7–10; report history lists all runs with stale
  labels; the post-review action row re-renders after reload.
- R4.4 Process Note AI sections render from the ledger with zero manual re-entry; the packet's
  AI-attribution block equals the ledger's contribution summary.
- R4.5 A Council re-run on a changed draft renders the "Since your last Council" strip with
  improved/partial/active verdicts computed via `recordCouncilVerification` (fixture test).
- R4.6 The Five Questions habit card appears at most once per review and ≤3 times per session;
  the questions are never enumerated into chat by any other path.
- R4.7 Vault-protected phrases appear in full-draft reviewer prompts as do-not-rewrite context
  only when they are substrings of the sent draft (payload assertion — no extra prose leaves).

## R5 — Bilingual

- R5.1 100% of rendered strings resolve through the `{es,en}` resolver (bypass sweep = 0 hits);
  aria-labels are single-language per preference; `<html lang>` tracks the preference.
- R5.2 On matched states and app-owned copy only, ES and EN modes each render no more than 60%
  of the visible words in both-language mode and contain no duplicated translation outside an
  explicitly requested language-learning aid. Both-language mode is evaluated against the P6
  per-state absolute word budgets and must introduce no marquee, horizontal overflow, clipped
  control, or more than two text lines in a movement/action control. The harness reports all
  three modes; dynamic student and AI-authored text is excluded from the density ratio.
- R5.3 Lab and start-here complete their full flows in Spanish (walker pass in ES).
- R5.4 Terminology registry test: one term per concept per language across all rendered
  surfaces; step-10 naming is uniform.
- R5.5 Tone and language vary independently in `t()` fixtures (direct-tone Spanish exists).

## R6 — Design system + a11y

- R6.1 Button variants ≤6, dialogs = 1 family, all dialogs trap Tab and restore focus on close
  (axe + keyboard tests across every walker state).
- R6.2 All text/background token pairs ≥4.5:1 (computed assertion, light + dark).
- R6.3 All interactive targets ≥44×44 CSS px including modal closes (geometry sweep).
- R6.4 Keyboard-only completion of the full journey on desktop; no marquee/auto-scrolling text
  anywhere; transitions ≤250ms and never move content under the reading position.
- R6.5 With the virtual keyboard open on a 390px viewport, ≥8 lines of the editor remain visible
  and the caret stays in view (visualViewport test).

## R7 — Genre integrity completion

- R7.1 Every report/export surface renders the active layer's step names (leakage guard extended
  to Process Note, submission report, packet, instructor panel, process log — zero default-name
  hits under a layer).
- R7.2 start-here routes render the active layer's own steps; unknown `?assignment=` values show
  an explicit notice and a choice, never a silent essay fallback.
- R7.3 Institution framing (Hostos/Brightspace) renders only for genres configured with it.
- R7.4 Genres promoted to bespoke copy pass their own voice checks; genres remaining NEUTRAL
  contain zero foreign-genre vocabulary (existing guard, maintained).

## Release-readiness reopening (after R4 at the earliest)

- RR.1 Student usability round: ≥80% unaided completion of T1–T8; ten-questions median ≥1.7;
  100% confident-yes on "is your work saved?".
- RR.2 Founder lived-experience test: PASS on the full journey for at least the two launch
  genres — the gate is the founder's verdict, never inferred from RR.1 or any suite.
- RR.3 Only then: Sprint 0 B3–B7 resume, then C3–C5, then the SaaS Sprint 1 pause is
  reconsidered.
