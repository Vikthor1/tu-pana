# Validation Plan — automated + manual

**Deliverable 21 · Applies to any approved future-state implementation; also usable against the current build.**

## 1. Test-tier split (prerequisite; see governance assessment §7)

Before redesign implementation starts, classify every existing suite/assertion:

- **Safety contracts (never relax):** genre leakage guard; disclosure-before-send (full-draft,
  capstone, Council, and the chat channel-data gap once fixed); authorship gate; no-prediction/
  no-prestige admissions rules; persistence integrity (no silent overwrite, refresh survival,
  export/import round-trip); privacy (no student prose in metadata-only paths); Worker
  budget/kind contract; clear-data friction.
- **Experience snapshots (rewritten with the approved redesign):** nav labels/CTA formats, hub
  layout, stage-preview modal behavior, review chooser composition, milestone copy, etc.
  These are regenerated from the approved design's acceptance criteria, not preserved.

## 2. Automated layers

1. **Unit/contract (existing pattern, Node + Playwright):** keep all safety contracts green at
   every commit. Add the missing ones found by this audit: council-profile fallback detection,
   report/export surfaces under layered genres, tutorial route-vs-layer consistency,
   channel-data disclosure, import-confirmation, decision-log retention.
2. **Journey walker (new, delivered at `journeys/audit_walk.mjs`):** observational Playwright
   walk of every genre × stage × (desktop/mobile) × (es/en/both) producing screenshots + a JSON
   observation log. Promote from audit tool to CI artifact: run per release candidate; diff the
   observation JSON against the previous accepted run (labels, overlay stacking, blank-editor
   states, visible-word budgets, blocked clicks). A new blocking overlay or an unexplained empty
   editor fails the run.
3. **Ten-questions assertions:** for each screen state in the inventory, an assertion maps the
   ten student questions to concrete visible selectors (P1 acceptance form in
   `target-experience-principles.md`). Generated from the screen inventory so new screens
   without a mapping fail by default.
4. **Word-budget lint:** walker-derived visible-word counts per state checked against the P6
   budgets; regressions fail.
5. **A11y sweep:** axe-core pass per screen state in the walker (contrast, roles, focus order),
   plus scripted keyboard-only journey completion.
6. **Worker/client drift probe (existing B2 recipe):** curl probe of every requestKind against
   the deployed Worker before any preview/release sign-off; assert config (tokens, thinking)
   matches the client contract. Never trust "deployed" claims.

## 3. Manual layers (cannot be automated, by doctrine)

1. **Founder lived-experience test** — unchanged, final, never self-approved. Scripted only by
   the journey list, not by expected results.
2. **Student usability rounds** — per `usability-testing-protocol.md`; ≥80% unaided completion +
   ten-questions median ≥1.7 before the founder release decision.
3. **Per-genre hand sweep** — one full journey per genre per release candidate, desktop + one
   phone, one in Spanish-led mode, one in English-led; sweeper answers the ten questions aloud
   at three fixed checkpoints and files divergences into the issue register.
4. **Live-AI spot check** — mock-mode tests cannot vouch for live Gemini tone/latency/truncation;
   one live session per genre family on the preview Worker (metadata-only observation, no student
   data), including one forced-failure (origin, rate limit) to verify honest error surfaces.

## 4. Cadence

- Per commit: safety contracts.
- Per release candidate: full sweep + walker diff + a11y + drift probe + per-genre hand sweep.
- Per direction milestone: student round + founder test.
- Known-flake protocol stands: suites that fail in a bulk run are rerun individually
  (gtimeout 90+) before a FAIL is believed; `genre_leakage_test` is the heaviest and flakes
  first under load.
