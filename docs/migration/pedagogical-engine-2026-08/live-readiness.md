# Live AI Coach and Council — founder-testing readiness pass

**Date:** 2026-08-04 · **Plane:** `migrate/pedagogical-engine-2026-08` at
`~/Sites/tupana-writing-studio-migration` · **Base for this pass:** `0ba5452d8f465c7a45c35ea80fee7480ac9d9a6f`

## Preflight (read-only, verified)

| Item | State |
|---|---|
| Migration worktree | clean, 0 modified files, HEAD `0ba5452` on `migrate/pedagogical-engine-2026-08` |
| Finalist base / R0 | `d8b92e8` / `1462aea`; finalist descends from R0; **R0 descends from redesign `84182d3`** |
| Product main | `0f66e46` == origin, tracked files clean |
| Exploration / redesign worktrees | clean, untouched |
| VC-OS | clean at `e32034a` |
| Worker (deployed) | live; **not modified in this pass**. Origin policy probed no-spend (promptless POST → 400/403 before any Gemini call): `https://tupana-preview.pages.dev` ALLOWED · `http://localhost:3001` ALLOWED · `http://localhost:8000` ALLOWED · `http://127.0.0.1:*` FORBIDDEN (403 `origin_forbidden`) |
| Family preview | current Production deployment `f90ad8be-bd77-4c1f-87af-290d50745032` (`https://f90ad8be.tupana-preview.pages.dev`), **source commit `1462aea`** — byte-identical to this checkpoint's legacy surface. Deploying the checkpoint therefore *adds* `studio.html` + studio assets and changes no existing user-facing file. |
| Rollback target | deployment `f90ad8be` (redeploy of the `1462aea` surface; also restorable from the Pages dashboard) |
| Browser-stored founder/son work | deployment does not touch browser localStorage; the legacy app files are byte-identical, so stored `tupana_*` work keeps its exact meaning. The studio's own record is `tupana-studio:v1` (separate). No Reset/Replace/destructive import is run in this pass. In-app legacy import remains preview-first with in-app rollback; a device-level backup before any in-app import remains recommended founder practice. |

## Phase 1 — AI-affordance matrix (candidate at `0ba5452`)

Provider seam facts at base: the Gemini adapter exists but **no configuration path selected it** —
every affordance was mock-only. "Live-capable" below means the seam reaches
`StudioProvider.active()` and needs only configuration plus the gaps fixed in this pass.

| # | Path | Entry point | Scope / payload | Prompt builder | requestKind | Consent | Response shape | Validation at base | Persistence | Failure at base | Status at base |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Selected-passage coaching | Passage Tray → Review passage; editor Ask Tu Pana | exact captured selection | `buildPassagePrompt` | `passage_analysis` | checkbox + exact preview + facts | free text | none (mock deterministic) | review record + snapshot on success | calm alert, nothing saved | live-capable |
| 2 | Paragraph coaching | same dialog, paragraph radio (only when real caret paragraph exists) | derived current paragraph | `buildPassagePrompt` | `passage_analysis` | same | free text | none | same | same | live-capable |
| 3 | Full-draft Ask Tu Pana | same dialog, full radio | entire draft | `buildPassagePrompt` | `passage_analysis` | same | free text | none | same | same | live-capable |
| 4 | Focused review (per-genre 3 lenses) | Review Center → Focused review; revision-cycle "Ask Tu Pana for feedback" | selected/paragraph/full | `buildFullDraftPrompt` (**gap: passage-scope requests carried the full-draft header** — fixed this pass) | `full_draft_review` when full, else `passage_analysis` | same + lens radio | free text (4-section contract) | none | same | same | live-capable |
| 5 | Move-contextual framing | collapsed opt-in inside scope dialog | adds exact student note + quotation | passage builder (`moveContext`) | inherits #1–3 | separate opt-in, off by default | — | — | provenance `moveContextIncluded` | — | live-capable |
| 6 | Your Voice constraint | collapsed opt-in inside scope dialog | adds exact protected entries | `voiceConstraintBlock` | inherits | separate exact-text opt-in | — | — | provenance `voiceEntriesIncluded` | — | live-capable |
| 7 | Council reviewers ×3 | Review Center/rail → Convene; revision-cycle chooser | full draft per reviewer | `buildCouncilReviewerPrompt` | `council_reviewer` | Council-specific consent naming 3+1 calls | **plain text at base** (mock strings) | none — **kernel absent at base** | all-or-nothing run record | calm alert, nothing saved | live-capable **only after Phase 3 kernel** |
| 8 | Council synthesis | automatic 4th call of a consented run | validated findings JSON only (no draft) | `buildCouncilSynthesisPrompt` | `council_synthesis` | covered by run consent | plain text at base | none at base | part of run record | run aborts | same as #7 |
| 9 | Convene again | saved-report card secondary action | fresh run | as #7/#8 | as #7/#8 | fresh consent required | — | — | new provenance record | — | as #7 |
| 10 | Revisit saved report | rail "Revisit report"; Evidence links; I'm Stuck "feedback" | none | none | **none — zero provider calls** (verified) | n/a | stored record | n/a | read-only | n/a | verified |
| 11 | Retry after failure | re-enabled send button; adapter-internal bounded retry (2×, retryable categories only) | same consented payload | same | same | same dialog still open | — | — | nothing saved until success | permanent categories never retried | live-capable |
| 12 | Cancel | dialog close/Escape during flight | — | — | — | — | — | **gap at base: in-flight response could still persist after close** — fixed this pass (stale-token) | must not persist | — | fixed this pass |
| 13 | I'm Stuck (all five needs) | Review Center | none | none | none | n/a | n/a | n/a | n/a | n/a | verified non-AI |
| 14 | Unknown assignment | any unrecognized id | no surfaces exist (loud stop) | — | — | — | — | — | — | — | verified: no AI reachable |
| 15 | STEM Council | rail + revision chooser | — | — | — | — | — | — | — | — | verified: stated-unavailable, zero calls |

Non-AI by construction (verified in suites): knowledge onboarding, Moves/notes, Evidence browser,
snapshots/comparison, reflection, Finish, packet, backup/export, legacy import, editing
utilities, appearance, spellcheck, Help preview.

Gaps identified at base and closed in this pass: provider selection configuration (none existed);
cancel/stale-response token; duplicate-submission token guard; consented-text/genre capture at
submit time (previously read at completion); passage-scope focused reviews mislabeled as
full-draft; truncation notice not surfaced; no client timeout; **Council structured-safety kernel
absent (mock plain strings; no schema/anchor/caps/corroboration validation)** — Phase 3.
