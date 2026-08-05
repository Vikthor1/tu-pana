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

## Phase 2 — live provider connection (implemented)

Provider resolution lives inline in `studio.html` (no secret; the Worker holds the key):
live Gemini activates only on `tupana-preview.pages.dev` hosts or by explicit
`?provider=gemini`; every other origin defaults to the deterministic mock. Automation runs on
`127.0.0.1` — an origin the deployed Worker additionally refuses — so live cannot activate
accidentally in tests. Hardening delivered: consent-time capture of genre/draft/signature/snapshot
(mid-flight edits and genre switches never rewrite records); dialog close cancels in-flight
requests (stale responses persist nothing; metadata-only `cancelled` events); duplicate-submit
blocked; passage-scope focused reviews carry a truthful scoped contract; truncation renders a
visible note; 45s per-attempt timeout; bounded retry (2×, retryable categories only; permanent
categories never retried); usage metadata-only; provider-aware truthful labeling (banner, consent,
transmission facts, buttons) and record-derived card provenance (`Tu Pana AI` vs `Mock`).
**Deployed-Worker contract finding:** per-kind output ceilings engage only when the legacy
`model` parameter accompanies the request kind (probes: promptless/OK-probe → default 400-token
cap, truncated; with `model: gemini-2.5-flash` → untruncated). The adapter now sends the legacy
`selectGeminiModel` mapping. The Worker itself was not modified.

## Phase 3 — Council safety kernel (implemented: `assets/js/studio/studio-council.js`)

Ported from legacy `council.js`: strict JSON schemas (reviewer + synthesis); verbatim-anchor
validation against the consented draft with smart-quote/whitespace/case normalization; role
identity from the requested role record only; caps (5 findings/role, 3 priorities, 4 secondary,
3 preserve, 2 disagreements, 40-word quotes); corroboration recomputed in code; low-confidence
propagation; disagreements preserved as writer-owned questions; phantom `sourceIds` discarded;
partial reports truthful (≥2 valid reviewers, missing perspective named); synthesis validated
with one content retry, else nothing saved; empty-findings shortcut skips synthesis and records
the actual call count; dropped-anchor counts disclosed in the report card. Role mandates ported
into `councilConfig` per genre.

## Phase 4 — bounded live validation (2026-08-04, synthetic writing only)

**Call ledger: 25 of the 30-call ceiling** (13 round 1 + 2 diagnostic probes + 10 round 2).
Estimated spend from usage counters: **≈ US$0.05–0.10** against the US$2.00 ceiling.
No raw payloads retained; response texts reviewed transiently.

| Case | Kind | Lang | Outcome | Latency | Validation |
|---|---|---|---|---|---|
| Autobiographical passage | passage_analysis | es | OK | 0.8–1.0s | grounded, 1 question, no rewrite, Spanish |
| Admissions passage + Voice constraints | passage_analysis | en | OK | 0.8s | Voice entries sent as constraints; concise |
| STEM passage | passage_analysis | en | OK | 0.7s | disciplinary (units), zero cultural leakage |
| SOP full draft | full_draft_review | en | OK | 2.4–3.3s | 4 sections complete, untruncated, anchored, no rewrite |
| Research full draft | full_draft_review | es | OK | 2.3s | Spanish response, sources-in-conversation framing |
| General Writing full draft | full_draft_review | both | OK | 2.4s | Spanish-primary response in both mode (noted) |
| Autobiography Council | council ×4 | en | **complete** | 6.4s | kernel-validated; 4 findings, 3 priorities, 0 dropped; PRESERVE protects "aquí escuchamos primero" + "porque esa frase carga la historia" with reasons |
| CAP 200 Council | council ×4 | es | **complete** | 6.2s | fully Spanish; 6 findings; evidence roles cite logged-hours/diario; no deficit framing; 0 dropped |
| Unknown assignment | none | — | stops, zero AI reachable | — | — |
| STEM Council | none | — | stated-unavailable, zero calls | — | — |

Pedagogical evaluation of live responses: correct genre identity in every case; no
autobiographical or cultural leakage into SOP/STEM/research/General; no trauma pressure in
admissions; no invented personal history or sources; no reflection written for the student; no
replacement prose (strategies + questions only); quotations anchored (kernel-guaranteed);
concrete and prioritized; multilingual phrases actively preserved; no grading/readiness/
improvement claims; clear bounded next actions. Observations: live Councils produced no
disagreements in these runs (disagreement is preserved when present, never manufactured); the EN
Council's PRESERVE repeated one quote from two roles (cosmetic; within the 3-item cap);
both-mode responses are Spanish-primary by design of the language signal.

Round-1 findings this pass fixed before sign-off: default-cap truncation via the missing model
parameter (above) — the kernel correctly refused to persist the truncated Council JSON in the
meantime, which is exactly the designed failure behavior.

## Phase 5 — failure and adversarial results

`studio_kernel_test.mjs` 38/38: kernel units (anchors incl. smart quotes, caps, role identity,
phantom-source discard, corroboration recomputation, low-confidence propagation, single-role
non-corroboration); end-to-end fixtures — malformed (abort, nothing saved), missing fields
(dropped, truthful empty report), invented quotation (discarded, never rendered, disclosure note),
partial reviewer failure (truthful partial report naming the missing perspective), total failure
(abort + boundary), synthesis failure after one retry (all-or-nothing, nothing saved), cancel
before response (no record, no snapshot, metadata event), mid-flight edit (record keeps consented
text; live draft keeps the edit), duplicate submit blocked, timeout and origin-forbidden copy
(do-not-retry), simulated storage quota failure (saveFailed truth, no false success). Response
arriving after genre switch is covered by consent-time capture (records store consented genre).

## Phase 6 — bounded family-preview deployment (2026-08-04)

- **Deployed:** the exact verified checkpoint surface (`index.html`, `start-here.html`,
  `studio.html`, `assets/` — 21 hashed user-facing files + audio) from clean checkpoint
  `91b9424` to Cloudflare Pages project `tupana-preview` only.
- **New deployment:** `ac390d62` (`https://ac390d62.tupana-preview.pages.dev`), serving
  `https://tupana-preview.pages.dev`.
- **Rollback target:** prior Production deployment `f90ad8be-bd77-4c1f-87af-290d50745032`
  (source `1462aea`) — restorable from the Pages dashboard or by redeploying that surface.
- **Byte identity:** all 21 files verified sha256-identical between the checkpoint and the
  canonical domain (one transient propagation lag observed and re-verified clean).
- **Change scope:** the legacy files were already byte-identical to the previous deployment
  (source `1462aea`), so this deploy *adds* the Studio and changes no existing user-facing file;
  the son's link and stored browser work are untouched. Browser localStorage is never affected by
  deployment; no Reset/Replace/import was run.
- **Post-deploy verification (15/15):** studio boot; live provider resolution on the preview host;
  truthful live banner; assignment routing; bilingual switch; legacy `start-here` +
  `index.html` routes intact; 390×844 entry without overflow + project chip; consent dialog with
  exact preview; **live passage call and complete kernel-validated live Council on the preview
  origin (CORS end-to-end, 5 Worker POSTs)**; saved-report revisit with zero provider calls;
  draft byte-intact; usage metadata-only.
- **Final call ledger: 30 / 30** (13 round 1 + 2 diagnostic probes + 10 round 2 + 5 post-deploy
  smoke). Estimated total spend ≈ **US$0.06–0.12** of the US$2.00 ceiling.
- **Not changed:** production GitHub Pages (main, `0f66e46`), the shared Worker (probe-only +
  normal request traffic; zero configuration or code changes), VC-OS (`e32034a`), product main,
  R0, exploration, redesign branches. The migration branch remains local-only (no upstream).

## Founder test script — live AI affordances on the family preview

Open `https://tupana-preview.pages.dev/studio.html` (the live coach activates on this host; the
banner says so). Use synthetic or throwaway text for the first pass.

1. **Non-AI first.** Type immediately; reload; confirm exact persistence. Walk to Process
   Reflection and Finish without touching AI — nothing should shame the choice.
2. **Passage coaching (live).** Select one meaningful sentence → Passage Tray → Review passage.
   Before the checkbox, read the exact preview: is what will be sent exactly what you chose? Send
   once. Is the response grounded in your words, question-shaped, with no rewritten prose?
3. **Voice constraints.** Protect a phrase (Keep as my voice), then repeat a passage request and
   opt in to the Voice constraint. Does the disclosure name the exact entries?
4. **Full-draft review (live).** Review Center → Focused review → full draft + a lens. Expect the
   four labeled sections, anchored quotes, and no model paragraph.
5. **The Council (live).** Convene it on ~80+ words. Expect three perspectives + synthesis:
   priorities with verbatim quotes from YOUR draft, a Worth preserving section, corroboration
   marks, and any disagreement phrased as your call. Close the report, revisit from the rail —
   no consent, no new calls. Find Convene again — fresh consent.
6. **Genres.** Repeat 2 and 5 in `?assignment=college-personal-statement` and
   `?assignment=cap200-bronx-beautiful-service-learning` (Spanish interface). Confirm the
   feedback speaks each genre's language and protects multilingual phrasing. Confirm
   `?assignment=stem-lab-report` states the Council is not configured, and an unknown
   `?assignment=` stops loudly.
7. **Failure honesty.** Turn on airplane mode mid-request (or just cancel the dialog while it
   reads): the draft must be unchanged, nothing saved, the message calm.
8. **Phone.** Repeat 2 at 390×844 on your phone. (The ten physical-iPhone P1 requirements remain
   a separate open gate.)

## Readiness statement and remaining limitations

Every intended AI affordance — passage, paragraph, and full-draft coaching, Move-contextual
framing, Voice constraints, focused-review lenses, and the three-reviewer-plus-synthesis
Council — now runs against real Gemini through the existing Worker contract, behind explicit
consent with exact payload preview, with structured-response validation, truthful persistence,
and recoverable failure. This is founder-testing readiness, **not** release readiness: no
physical-iPhone/VoiceOver/assistive-technology evidence, no representative-student evidence, no
Brightspace or cross-device evidence, live quality observed across 30 bounded synthetic calls
only (latency 0.7–6.4s in these runs; long-session behavior, rate-limit behavior under real
load, and repeated-feedback fatigue remain unobserved), Council disagreement behavior seen only
as absent-when-not-present, and the production release + SaaS Sprint 1 remain separately
governed and paused. The founder gate is never self-approved.
