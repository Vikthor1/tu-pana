# Prioritized Remediation Roadmap

**Deliverable 19 · Implements Concept B ("The Honest Journey") if approved. Nothing here is
authorized to build until the founder approves the direction and each batch's scope. SaaS
Sprint 1 stays paused throughout; Sprint 0 B3–B7 resume only after the approved remediation
passes founder + student lived-experience validation.**

Batches are sized for the existing VC-OS Tier-2 sprint model (bounded scope, own tests, own
close). Order is by student risk, then by dependency. Each batch names its exit gate; the
detailed behavior specs live in the proposal documents and `acceptance-criteria.md`.

---

## R0 — Immediate safety and trust corrections (candidate for approval INDEPENDENT of direction)

These protect student work and truth today, in the current UI, whatever direction is chosen.

1. EN-mode mobile empty task bar — rendered P1 blocker and one-line CSS fix (DS-15).
2. Backup import: preview + explicit replace confirmation + automatic pre-import snapshot +
   safety download (kills the silent-overwrite P0).
3. Header Reset: move out of one-native-confirm reach — same typed-confirmation friction as the
   danger zone, plus in-flow backup offer.
4. Council profile fallback: STEM lab report + legacy CAP 200 stop inheriting the
   autobiographical-essay Council profile — explicit neutral profile or Council disabled for
   unprofiled genres, plus a config-gap console warning + test.
5. Origin-403 vs transient error: distinguishable, honest messages; no doomed 18-fetch Council
   retry against a permanent config failure.
6. Focus-button collision: the dead/lying "Salir · Exit" control in hide-coach mode gets one
   owner and one truthful label.
7. `#typingRow` boot state: the coach stops appearing to type forever on first load.
8. Undisclosed `maniSentence` transmission: strip it from routine chat payloads by default;
   sharing it requires an exact moment-of-consent disclosure. This is R0 because undisclosed
   student-prose transmission is a present consent failure and does not depend on the future
   Review-center architecture. R4 later supplies the durable share control and unified ledger.
9. False save/unlock messaging: stage 1–5 and stage 7–10 saves must name the artifact actually
   saved and must not claim revision is unlocked when it is not. This is R0 because the repeated
   false status directly damages save trust; R1 later relocates status into the single rail.
10. Silent storage-write failures: every student-work/evidence write path must surface a minimum
    persistent failure banner naming what is not saved and offering an export escape. This is R0
    because silent loss can consume a whole session. R3 later consolidates the persistence-status
    architecture, persistence request, and eviction handling.
11. Interim final-draft confirmation: before packet generation, show the exact candidate selected
    by the current heuristic (stage, word count, excerpt/full preview) and require the student to
    confirm it as the packet draft. This is R0 because the current heuristic can silently submit
    an older version. R2 later replaces the heuristic with a persistent current-draft marker.

**Exit gate:** targeted tests per fix + founder spot-check on preview. R0 is direction-independent;
its eleven items remove present safety/trust hazards without selecting a future-state concept.

## R1 — One truthful navigation spine

Single progress vocabulary (10 steps in 3 acts; milestones out of UI); journey map always
available (one tap/keyboard reachable, proper roles); stage-preview modals become inline step
headers; reflection checkpoints move inside their step (nothing interposes over any dialog,
enforced by walker assertion); status rail replaces chat-as-notice-board (refusals, saves,
gating, phase changes — with mobile notification dot); onboarding becomes one-surface-at-a-time
sequence with language choice first; navigation-≠-completion (checkmarks mean work exists).
Spec: `proposed-navigation-ia.md`, `proposed-progressive-disclosure.md`.

**Exit gate:** walker diff shows zero stacked blocking surfaces + ten-questions map for every
screen; experience-snapshot tests rewritten for the new spine; founder lived test of one full
genre journey.

## R2 — Work rail + current-draft truth

Sidecar artifact metadata; always-visible work rail with freshness; explicit current-draft
marker; packet consumes the marked draft (heuristic retired); snapshot ring before every
overwrite-class event; carry-forward simplified to rail actions ("view / bring forward"), import
offers retired as a separate mechanism. Spec: `proposed-save-persistence-model.md`.

**Exit gate:** blank-editor-with-prior-work impossible in walker sweep across all genres and nav
paths; no-silent-overwrite safety tests; refresh/return exactness.

## R3 — Save quiet, finish deliberate, destruction distant

Backup/import/email/danger leave the routine hub for Settings + a dedicated danger screen;
Finish space owns process note, packet, export, submission checks (stage ≥9 entry unchanged);
write-failure banner + storage persistence request + dated eviction notice; origin/device
honesty card ("your work lives in this browser") in Settings, Finish, and the factory-fresh
boot ("Did you start somewhere else?" + import door). Spec: `proposed-save-persistence-model.md`.

**Exit gate:** P5 acceptance form — save affordance at stages 1–8 contains zero
submission/backup/danger content (walker-asserted); save-status truth tests.

## R4 — One AI relationship

Review center drawer persistent + reachable stages 7–10; report history with stale labels;
unified decision grammar incl. lens reviews; decision ledger feeding Process Note + AI
attribution automatically; verification loop live (`recordCouncilVerification` — "Since your
last Council" strip); Five Questions as capped habit card; maniSentence stripped from routine
chat sends (share toggle default-off); Voice Vault phrases as do-not-rewrite context on
full-draft sends; error states per class. Council report format untouched.
Spec: `proposed-ai-experience-model.md`.

**Exit gate:** disclosure tests cover every send path; ledger → Process Note render test;
reload-survival of re-entry affordances; founder lived test of the full review loop.

## R5 — Bilingual done right

Migration batches M0–M9 from `bilingual-content-strategy.md`: single `{es,en}` representation +
`L()` resolver; decision-moment modals first; aria-labels single-language; lab + start-here full
Spanish parity; terminology registry applied (Paso, cierre, revisión-reserved, Toolkit);
`t()` tone/language decoupling; both-mode quiet-twin density rules.

**Exit gate:** word-count harness — ES and EN each render no more than 60% of matched full
bilingual app-owned copy, with zero duplicate translations outside explicit aids; optional
bilingual mode meets P6 absolute word budgets with no marquee/overflow/clipped controls; zero
bypass surfaces in walker language sweep; terminology registry test.

## R6 — Design system + accessibility completion

Component consolidation (buttons 65→6, one dialog family with contract-keyed focus traps, cards
36→3, one status pattern); contrast token fixes (verified values in D18); motion + content-
stability rules; journey map keyboard/roles; 44px floor; visualViewport keyboard contract;
marquee deleted. Spec: `design-system-a11y-recommendations.md`.

**Exit gate:** axe-core sweep green on every walker state; keyboard-only journey completion;
token contrast assertions.

## R7 — Genre integrity completion

Report/export surfaces render layered stage names (the P2 family: Process Note, submission
report, packet, instructor panel, process log); tutorial routes match the active layer (SOP
"Origin moment" contradiction fixed; cap-200-first-draft stops dropping its genre); unknown
`?assignment=` ids get an explicit notice instead of silently becoming the essay;
Hostos/Brightspace framing becomes per-genre config; founder decides which genres graduate from
NEUTRAL to bespoke coaching copy (admissions pattern), starting with CAP 200 (the founder
already flagged wanting a glance at its neutral-fallback coaching).

**Exit gate:** leakage guard extended to report/export surfaces + tutorial; per-genre hand sweep.

---

## Sequencing rules

- R0 may ship alone, before direction approval, as its own Tier-2 sprint (founder call).
- R1 → R2 → R3 → R4 is the dependency spine (each builds on the previous surface).
- R5 and R6 can interleave after R1 (their specs don't depend on R2–R4 internals); their
  string/component migrations should ride each batch's rewritten surfaces to avoid double work.
- R7 lands last (its surfaces are reshaped by R3/R4 first).
- After R4: student usability round R1-cohort (protocol, deliverable 22) + founder lived test on
  the full journey → only then the release-readiness question reopens (Sprint 0 B3–B7, then C3–C5).
- Every batch: safety contracts stay green throughout; experience snapshots regenerate per batch;
  walker diff runs at every batch close.
