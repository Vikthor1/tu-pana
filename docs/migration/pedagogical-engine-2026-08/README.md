# Pedagogical-engine migration and productionization — 2026-08

**Plane:** branch `migrate/pedagogical-engine-2026-08`, worktree
`/Users/Victor1/Sites/tupana-writing-studio-migration`
**Status:** isolated implementation plane; no merge, push, deploy, promotion, Worker change,
production change, or SaaS work authorized from this plane.

## Governing principle

The hardened Integrated Desk finalist defines how students experience the product. The legacy
Writing Studio is a read-only source of pedagogical capabilities, genre knowledge, content, and
safety behavior. Legacy structures are translated into the finalist's calmer architecture; they are
never ported wholesale, and the legacy interface patterns (ten student-facing stages, stage-owned
text buffers, repeated question walls, chat accumulation) do not return.

## Exact migration base (verified 2026-08-04)

| Fact | Value |
|---|---|
| Finalist checkpoint (base of this branch) | `d8b92e862c39ad020dce37e294a19ca6e47e8387` — "Explore connected writing tools in Integrated Desk" (2026-08-04) |
| Finalist source branch / worktree | `explore/writing-studio-ux-2026-08` at `/Users/Victor1/Sites/tupana-writing-studio-exploration` (clean at base time) |
| Student Agency utilities checkpoint | `19f1584fe8f034c0b61818c5d3ff5163476e09fa` (2026-08-04) |
| Revision Cycle checkpoint | `dc52940ff73aca0aed03f6e791f5eabc13f9e193` (2026-08-04) |
| Connected Writing Tools checkpoint | `d8b92e8` (same as finalist checkpoint) |
| Legacy Writing Studio source | `index.html` + `assets/js/{app,config,data,genre-template,prompts,storage,ui,council,ai-provider}.js` at R0 commit `1462aea172b89013d3ea7d70a0c933cba856737e` (`remediation/writing-studio-r0`); the exploration branch is purely additive, so legacy files in this plane are byte-identical to R0 |
| R0 safety-contract checkpoint | `1462aea` — R0 verdict PASS-with-concerns; `r0_safety_test.mjs` assertions immutable |
| Product `main` | `0f66e46` == `origin/main` (untouched) |
| VC-OS state | `main` == `origin/main` == `e32034a` (session close that opened window `writing-studio-ux-2026-08`); VC-OS is not modified from this plane |
| Family preview | `tupana-preview.pages.dev` (serves `8e22fc7` surface) — not used by this plane |
| Production Pages / Worker | untouched; Worker version per Sprint-0 records; no redeploy from this plane |

Other worktrees at base time: `~/Sites/tupana` (main, only known pre-existing untracked LaTeX
artifacts in `docs/`), `~/Sites/tupana-redesign` (clean, `experiment/redesign-v1` @ `84182d3`),
`~/Sites/tupana-audit` (clean, `docs/r0-founder-acceptance` @ `4e1fdee`). None are modified by this
migration.

## Baseline verification at `d8b92e8` (this worktree, server 127.0.0.1:3001)

- `prototype_exploration_test.mjs` **238/238 PASS**
- `prototype_integrated_corrections_test.mjs` **48/48 PASS**
- `prototype_integrated_agency_test.mjs` **27/27 PASS**
- `prototype_integrated_revision_cycle_test.mjs` **22/22 PASS**
- `prototype_integrated_connected_tools_test.mjs` **29/29 PASS**
- Unchanged legacy selection: `r0_safety_test.mjs` **29/29**, `passage_coach_test.mjs` **26/26**,
  `storage_keys_test.mjs` **13/13**, `voice_vault_test.mjs` **28/28**, `genre_leakage_test.mjs`
  **30/30**
- Protected density baseline: fresh English 1440 × 960 Integrated Desk **185 visible words**
  (plain Desk 168); mandatory actions before typing **0**; blocking entry interruptions **0**;
  primary destinations **3** (Current Draft · Process Reflection · Finish).

## Protected finalist contracts

One canonical draft; three primary destinations only; calm first viewport at the density baseline;
progressive disclosure; existing visual language/branding; mobile-safe passage coaching via the
app-owned Passage Tray; genre-aware Moves with student-authored notes; Your Voice exact-text
protection; browsable non-surveillant Evidence; Ask Tu Pana as optional support (no chat column);
Review Center + Council history with truthful provenance and revisit-without-rerun; truthful review
copies and accessible Before/Current comparison; one encouraged revision cycle with equal exits;
I'm Stuck and agency utilities; compact editing support; System/Paper/Dark appearance; native
spellcheck; Help/Report a problem; exact saving, consent, provenance, privacy, and all R0 safety
contracts; an uninterrupted non-AI route from beginning to Finish.

## Documents in this directory

- `migration-contract.md` — Preserve/Adapt/Retire/Defer inventory (definition of done)
- `target-architecture.md` — genre profiles, canonical state, legacy adapter design
- `verification.md` — per-slice and comparative verification results
- `handoff.md` — final handoff report and founder test script
