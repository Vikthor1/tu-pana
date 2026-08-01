# Writing Studio UX Recovery Audit — package index

**Authoritative audit commit `3462156` · Baseline commit `84182d3` · Evidence-gathering dates
2026-07-31 → 2026-08-01 · Final QA/operational closeout 2026-08-01 · Founder-authorized UX
Recovery and Exploration Mode · Founder R0 acceptance addendum 2026-08-01.**

Boundaries honored: production untouched (Pages still serves `main`); no merges or SaaS backend
work; no real student data anywhere in this package (all walk text is synthetic); no destructive
migrations. After audit closeout, R0 commit `1462aea` was pushed and deployed only to the bounded
Cloudflare family preview; deployment identity and founder results are recorded in
`founder-r0-acceptance-2026-08-01.md`. SaaS Sprint 1 remains paused. **Nothing in this package
approves a future architecture or production implementation.**

## Deliverables (brief item → file)

| # | Deliverable | File |
|---|---|---|
| 1 | Executive assessment | `executive-assessment.md` |
| 2 | Release-readiness recommendation | `executive-assessment.md` §Release readiness |
| 3 | Screen, state, genre, component inventory | `inventory/screens-and-navigation.md` + `inventory/bilingual-visual-a11y.md` + `inventory/genre-stage-matrix.md` |
| 4 | Current-state journey maps | `journeys/journey-maps.md` |
| 5 | Navigation map | `navigation-map.md` |
| 6 | Student-artifact & persistence map | `inventory/persistence-and-save-model.md` |
| 7 | Genre-by-stage configuration matrix | `inventory/genre-stage-matrix.md` |
| 8 | Issue register (evidence + severity) | `issue-register.md` |
| 9 | Root-cause analysis | `root-cause-analysis.md` |
| 10 | Target experience principles | `target-experience-principles.md` |
| 11 | Future-state concepts (A/B/C + simplified hybrid) | `future-state-concepts.md` |
| 12 | Future-state decision framing + provisional candidate | `future-state-concepts.md` §Decision status |
| 13 | Proposed navigation & IA | `proposed-navigation-ia.md` |
| 14 | Proposed save/persistence model | `proposed-save-persistence-model.md` |
| 15 | Proposed coach/review/Council model | `proposed-ai-experience-model.md` |
| 16 | Proposed progressive-disclosure model | `proposed-progressive-disclosure.md` |
| 17 | Bilingual content strategy | `bilingual-content-strategy.md` |
| 18 | Design-system & accessibility recommendations | `design-system-a11y-recommendations.md` |
| 19 | Prioritized remediation roadmap | `remediation-roadmap.md` |
| 20 | Acceptance criteria | `acceptance-criteria.md` |
| 21 | Automated + manual validation plan | `validation-plan.md` |
| 22 | Student usability-testing protocol | `usability-testing-protocol.md` |
| 23 | VC-OS governance-friction report | `vcos-governance-assessment.md` |

Supporting: `inventory/ai-interaction-model.md` (AI touchpoint/disclosure inventory feeding
#3/#8/#15) · `evidence/` (10 journey-walk observation logs + 370 screenshots across 7 genres
desktop, 2 mobile, tutorial) · `journeys/audit_walk.mjs` (the observational walker — promoted to
a CI artifact in the validation plan) · `closeout/validate-audit.mjs` (read-only package and
traceability validator) · `closeout/test-results-2026-08-01.md` (38-suite consolidated result) ·
`closeout/closeout-report.md` (final QA decision summary) ·
`founder-r0-acceptance-2026-08-01.md` (R0 PASS-with-concerns record) ·
`evidence/founder-ux-exploration-evidence-2026-08-01.md` (physical-device P1 and binding
exploration evidence).

## Evidence status and provenance

Five parallel expert code-side inventories (screens/nav, genre matrix, persistence, AI interaction,
bilingual/visual/a11y) over the audit worktree at `84182d3`; a rendered-product Playwright
walker driving the full journey per genre against a local server with the AI proxy mocked
(desktop 1280×900 + mobile 390×844; language-mode sweeps; first-entry with NO seeded state);
baseline test sweep (38/38 — `genre_leakage_test` and `tutorial_page_test` required quiet
individual reruns per the known load-flake protocol).

These rendered walks and code inspections are **expert evidence, not student usability
research**. Student research remains pending under `usability-testing-protocol.md` and is
required before any future-state direction or release can pass its lived-experience gate.

Known original-audit coverage limits (stated, not silent): the tutorial walk captured only its opening beats
(its own suite covers the flow 39/39; its language gap is confirmed by both code and rendered
evidence); live-Gemini behavior (tone, latency, the founder-observed five-questions repetition
under real replies) was NOT reproduced — mock-mode only; validation plan §3.4 assigns it a
manual live spot-check. Device-switching beyond viewport emulation and Brightspace embedding
were not exercised. Only the admissions tutorial variant was walked; the remaining tutorial
variants were not. Device switching was reasoned from origin-scoped storage and viewport
emulation, not exercised on two physical devices. Brightspace embedding was not exercised.

Post-audit founder evidence adds a physical iPhone 17 Pro Max observation: passage coaching is
present but unreliable because its actions are offscreen and native selection collapses while
scrolling. This is the independent P1 release blocker defined in the founder acceptance addendum.

## Exit condition — what the founder must rule on (nothing proceeds without this)

1. Future-state mental model + direction (Concepts A, B, C, and the simplified hybrid remain
   legitimate exploration candidates; B is provisional, not presumed).
2. Navigation architecture (`proposed-navigation-ia.md`).
3. Stage & artifact model (work rail + current-draft marker).
4. Save/submission separation (`proposed-save-persistence-model.md`).
5. Coach/review/Council experience incl. the maniSentence strip-vs-disclose choice
   (`proposed-ai-experience-model.md`).
6. Bilingual strategy (`bilingual-content-strategy.md`).
7. R0 is deployed to the bounded preview and accepted **PASS-with-concerns**; its completion does
   not lift the independent mobile-passage-coaching P1 release block
   (`founder-r0-acceptance-2026-08-01.md`).
8. Acceptance criteria (`acceptance-criteria.md`).
9. VC-OS tuning: the permanent UX Exploration Mode proposal + test-tier split + invariant-vs-
   revisable decision markers (`vcos-governance-assessment.md` §7).

SaaS Sprint 1 stays blocked until the approved remediation is implemented and passes founder
AND student lived-experience validation (never self-approved).
