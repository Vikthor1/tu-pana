# Target architecture — Writing Studio migration candidate

## Placement

| Surface | Files | Status |
|---|---|---|
| Legacy Writing Studio | `index.html`, `assets/js/{app,config,data,genre-template,prompts,storage,ui,council,ai-provider}.js` | **Read-only evidence.** Untouched. |
| Finalist prototype | `explore.html`, `assets/js/exploration.js`, `assets/css/exploration.css` | **Behavioral reference.** Untouched; its suites keep pinning it. |
| Migration candidate | `studio.html`, `assets/css/studio.css`, `assets/js/studio/*.js` | New. Forked from the Integrated Desk paths of `exploration.js` (behavior-preserving), then productionized per the migration contract. |

Forking the finalist rather than rewriting it is deliberate: the finalist's behavior is pinned by
364 checks; the fork starts from proven code, drops the four non-selected concepts and exploration
scaffolding, and then adds the translated pedagogy in bounded slices.

## Modules (plain scripts, repo idiom; load order in `studio.html`)

1. `assets/js/studio/studio-profiles.js` — the pedagogical engine as data: profile registry
   (autobiographical, admissions, sop, stem, general, cap200-service-learning, research), each with
   bilingual labels, Moves (id, criticalKey, nudge, why, prompt, es/en), optional onboarding block,
   coach framing (identity line, focus, genre rules), review lenses, Council config (roles,
   mandates, prohibitions, synthesis order, enabled/disabledReason — translated from `council.js`),
   contextual-question map (data-driven, replacing the label-regex `integratedCriticalKey`),
   reflection prompt 4, Finish checks, work-noun tokens. Assignment-id aliases map legacy link ids
   (`college-personal-statement`, `graduate-sop`, `stem-lab-report`, `research-paper`,
   `cap200-bronx-beautiful-service-learning`, `cap-200-first-draft` → cap200 profile with notice) to
   profiles. Unknown ids resolve to a loud stop.
2. `assets/js/studio/studio-core.js` — state record, load/save (debounced, truthful failure),
   snapshots/signatures, bilingual text helper (one function, honors es/en/both), escape, announce.
3. `assets/js/studio/studio-provider.js` — provider seam: `createMockProvider()` (deterministic,
   failure-injectable via `?mockfail=`) and `createGeminiProvider()` (same Worker contract and
   requestKinds as `ai-provider.js`; studio-owned usage key inside the studio record). Prompt
   builders (passage protocol, full-draft contract, council reviewer/synthesis) live here, fed by
   the active profile. Provider selection: `STUDIO_CONFIG.provider` — **mock in this plane**.
4. `assets/js/studio/studio-council.js` — council orchestration + validation translated from
   `council.js` (anchor validation, caps, corroboration recomputed in code, partial/abort), driven
   by profile Council config, records into the studio record.
5. `assets/js/studio/studio-import.js` — bounded legacy adapter (contract C17): scan → preview →
   confirm → apply, with restorable pre-import snapshot.
6. `assets/js/studio/studio-ui.js` — the Integrated Desk interface (fork of the integrated paths).

## Canonical state — one record, `tupana-studio:v1`

Deliberately outside the legacy `tupana_` underscore namespace: legacy prefix-based
export/import/clearAllData (`storage.js:45`) can never touch it, and the studio never enumerates
storage. Shape = finalist integrated record minus dead concept fields (`step`, `phase`, `place`,
`artifacts`, `notebook*`, `draftDeclared`, `protectedPhrases` legacy mirror), plus:
`assignmentId` (replaces prototype `genre` as the resolved identity; `genre` retained as the
profile key), `usage` (metadata-only token aggregate), `providerEvents` (failure records, truthful),
`legacyImport` (provenance of an applied import + restorable pre-import snapshot pointer).
`schema: 1` with a `studio: true` marker. Versions remain uncapped exact snapshots; on quota
pressure the save path degrades truthfully (persistent alert + working export), never silently.

## Assignment resolution

`?assignment=<id>` → alias map → profile; resolved id remembered inside the studio record (not a
separate key). No param → remembered id → else explicit selection screen (General Writing is a
choice there, never a fallback). Unknown/retired ids → configuration-required stop with recovery to
selection. The legacy remembered key `tupana_assignment_id` is read (read-only) once as a
*suggestion* shown on the selection screen — never auto-applied.

## Legacy-data translation (C17 summary)

Student-invoked from Settings; read-only scan of `tupana_*` keys; preview table (what maps, what is
collapsed as byte-identical seeding, what is not imported and why); explicit confirm; pre-import
studio snapshot stored in-record and restorable from Settings. Truth rules as in the contract.

## Verification plan

New suites (Playwright, same harness): `studio_core_test.mjs`, `studio_profiles_test.mjs`,
`studio_journey_test.mjs` (non-AI path + Moves + Voice + Evidence + Stuck), `studio_coach_test.mjs`,
`studio_council_test.mjs`, `studio_revision_test.mjs`, `studio_closure_test.mjs` (reflection/finish/
packet), `studio_access_test.mjs` (bilingual/a11y/mobile/unknown states), `studio_import_test.mjs`.
Plus full reruns of all existing suites (which pin legacy + finalist, both untouched).
Density gate: fresh English 1440×960 studio first viewport ≤ the finalist's 185-word baseline ±
noise; mandatory pre-typing actions 0; blocking interruptions 0; primary destinations 3.
