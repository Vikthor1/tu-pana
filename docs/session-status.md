# Tu Pana — Session Status

Last updated: 2026-07-31 (Start Here tutorial generalized to all genre layers)

## Start Here tutorial — cross-genre generalization (2026-07-31)

- `start-here.html` now serves every genre layer from one conversation engine
  with a per-genre configuration (same config-over-fork pattern as the app):
  default essay · college-personal-statement · graduate-sop · CAP 200
  service-learning · research-paper · stem-lab-report.
- Genre resolution: `?assignment=` param → remembered `tupana_assignment_id`
  (set by the app) → default essay. Unknown ids fall back to default. A genre
  chip in the header names the active layer; CTA and skip carry its query.
- Per-genre content: what-this-is intro · why-authenticity-matters framing ·
  three myth-or-real checks (the authorship myth is shared; the other two are
  the layer's own integrity hazards — e.g. research: fabricated citations and
  summary-as-paper; STEM: adjusting results and jargon-as-rigor; service-
  learning: padded hours and deficit framing; SOP: impressive-over-specific) ·
  route-map stage labels · rehearsal sample sentence + coach note · the
  genre's authenticity ground rule. Shared beats (rule card, Stage 6 lock,
  accept/adapt/reject rehearsal, Council, mandatory privacy bubble, finale)
  are identical across layers.
- ~~Worker dev origin `http://172.20.10.2:8000` (LAN phone access)~~ —
  superseded the same day: the family member is out of state, so local-network
  access could never work. Replaced by the family-preview deployment below;
  the LAN origin was removed from the allowlist in the same change.

## Family-preview deployment — Cloudflare Pages (2026-07-31)

- Founder-authorized remote access for family use (son in Michigan, founder in
  Puerto Rico): the branch's static app + tutorial deployed to Cloudflare
  Pages project `tupana-preview` → **https://tupana-preview.pages.dev**
  (same Cloudflare account as the Worker; deployed via
  `wrangler pages deploy` from a staged copy of index.html, start-here.html,
  and assets/ only — no tests, docs, or server code).
- This is a bounded personal preview, NOT the release: Sprint 0 B3–B7 still
  gate the real launch, the GitHub Pages production site is untouched, and
  the project can be deleted when the preview retires. Re-deploying after new
  branch commits requires re-staging + `wrangler pages deploy` (the preview
  does NOT auto-track the branch).
- Worker allowlist: added `https://tupana-preview.pages.dev`, removed the
  LAN origin; deployed version `ce5538f8` and probe-verified from the new
  origin. Pages pretty-URL 308 redirects preserve query strings
  (`?assignment=` intact); tutorial, app, JS/CSS/audio assets all verified
  live over HTTPS.
- Entry link for the family user:
  `https://tupana-preview.pages.dev/start-here?assignment=college-personal-statement`.
  Work saves in that browser's localStorage under the pages.dev origin — same
  browser + device rule applies; export/import backup available in the app.
- Verification: `tutorial_page_test.mjs` 39/39 — deep admissions pass plus
  per-genre passes (chip, tap-through, integrity marker, CTA/skip targets)
  plus resolution boundaries (bare URL, remembered layer, unknown id).

## Start Here tutorial — `start-here.html` (2026-07-31)

- Standalone, self-contained interactive onboarding page (single file, inline
  CSS/JS, no dependencies, works offline once served). Built as the intended
  first touch for the admissions layer: share `start-here.html` as the entry
  link; the finale and the always-visible skip link both land on
  `index.html?assignment=college-personal-statement`.
- Form: the tutorial IS a coach conversation — Tu Pana bubbles with a typing
  cadence, and the student answers by tapping (questions, three myth-or-real
  calls, and an accept/adapt/reject rehearsal on a sample sentence where every
  choice — including Reject — is validated). Teaches the app's core
  interaction by being it.
- Content beats: the authorship rule card · why generic AI essays fail ·
  10-stage route map with Stage 6 marked as the lock · the three feedback
  levels (passage / full-draft / Council) · Council behavior incl. surfaced
  disagreement · a mandatory privacy bubble (nothing sent unless explicitly
  asked; local-first) · five ground rules · finale with start button + replay.
- Voice: English-primary with natural Spanish (the app's register), teen-direct,
  no predictions, no prestige coaching. Phone-first layout, reduced-motion
  respected, keyboard focus visible, skippable at all times.
- Sets `tupana_tutorial_done` locally (documented in the storage inventory;
  start-here.html added to the storage-key source audit).
- Verification: `tutorial_page_test.mjs` 14/14 on a phone viewport (auto-start,
  rule card first, full tap-through, route lock, myth counters, Reject
  validated, no prediction language, privacy beat mandatory-path, CTA/skip
  targets, completion flag, replay, no page errors). One content defect caught
  by the suite and fixed: the privacy explanation originally lived behind an
  optional tap; it is now a mandatory bubble.

## Review Council — admissions enablement (2026-07-31, founder override)

- `college-personal-statement` Council profile enabled by explicit founder
  authorization (personal/family use of the link-only layer). The Sprint 1
  provider/eligibility decision still governs **commercial** availability of
  admissions Council access — that gate is a distribution decision recorded in
  VC-OS decisions.log, not a code flag. The Council adds no new transmission
  category: the admissions layer already sends drafts to Gemini via passage
  coaching and full-draft review.
- Admissions profile: voice-first synthesis order; structure reads for
  moment→reflection movement (not five-paragraph form); evidence means lived
  scenes, not credential lists; hard prohibitions in every reviewer prompt —
  never predict outcomes or competitiveness, never suggest undisclosed
  achievements, never push toward prestige-coded admissions-speak.
- Verification: kernel 65/65 (enabled-profile assertions + the enabled:false
  mechanism re-covered via an injected test profile); Council UI 29/29
  (admissions offer + per-prompt safeguard assertions); full sweep green.

## Review Council C2 — student experience (2026-07-31)

- The shared **Review draft** dialog (Stages 7/9) now offers the Council below
  the single-lens option: three perspectives (structure, evidence, voice) plus
  one prioritized synthesis. Availability: Live AI (gemini) mode + an enabled
  Council genre profile; the blocked admissions profile renders no offer.
- Disclosure before launch (B1 doctrine): the full draft is sent three times —
  once per perspective — and validated observations once more for synthesis;
  nothing stored on a server.
- Progress: three named perspective chips (reading → complete/unavailable),
  a synthesis row, and Cancel; closing the dialog cancels the run.
- Report: preserve-first ("what is working — protect it"), then ≤3 "fix first"
  findings — each with role attribution, ✓✓ corroboration when two or more
  perspectives agree, verbatim evidence quote, why-it-matters, a suggested
  strategy (never replacement prose), tentative-reading marker for low
  confidence, and a voice-protection note when set — then collapsed secondary
  observations, then disagreements framed as "Your call" questions.
- Decisions: Accept / Adapt / Reject / Decide later per finding, persisted to
  the stored run and restored on reopen; every launch, completion, abort, and
  decision writes a metadata-only process event.
- Repeat friction: an unchanged draft requires an explicit override to convene
  the Council again; "View last report" reopens the stored report, labeled as
  from an earlier version when the draft has changed.
- Failure isolation: one unavailable perspective → labeled partial report;
  fewer than two survivors → calm abort, nothing saved.
- Verification: new `council_ui_test.mjs` 27/27 (offer/disclosure, call
  routing, report shape, decisions persistence, repeat friction, stale label,
  partial + abort paths, genre/mode boundaries, no page errors); full sweep
  green (see commit).
- Worker with `council_reviewer`/`council_synthesis` configs DEPLOYED for the
  founder lived-experience gate — version `15368cc4-ede9-4c56-b984-c0c2f5308649`;
  post-deploy `council_reviewer` probe returned `thoughtTokens: 0` (thinking
  off per spec). The live `main` frontend never sends these kinds, so no
  shipped behavior changes.

## Review Council C1 — kernel without UI (2026-07-31)

- Governing design: VC-OS `01_projects/tupana/business/council-design-review.md`
  (founder-approved 2026-07-31). Three fixed specialist reviewers (structure,
  evidence, voice) plus one synthesizer over an existing draft; critique only,
  never rewriting; findings capped and evidence-anchored.
- New `assets/js/council.js` — pure kernel (no DOM, no direct provider calls):
  - `COUNCIL_LIMITS` enforced in code: ≤5 findings per reviewer, ≤3 priorities,
    ≤4 secondary, ≤3 preserve notes, ≤2 surfaced disagreements, run history 5.
  - Evidence anchors are deterministic: every finding and preserve note must
    quote the draft verbatim (whitespace/case/curly-quote normalized);
    unverifiable quotes are dropped in validation, never rendered.
  - Synthesis may only merge validated reviewer findings: items with unknown
    `sourceIds` are discarded; corroboration is recomputed from source roles,
    never trusted from the model; low confidence propagates.
  - Genre configuration over forks: `COUNCIL_PROFILES` for default essay,
    graduate SOP, CAP 200 service-learning, and research paper;
    `college-personal-statement` is `enabled:false` pending the Sprint 1
    provider/eligibility decision (blocked in code before any model call).
  - Orchestration with injected `callFn`: parallel reviewers, one retry each,
    failure isolation (run proceeds with ≥2 survivors, labeled `partial`;
    fewer aborts), one synthesis call, graceful refusal for blocked genres and
    <50-word drafts.
  - Local-first history: `tupana_council_runs` stores metadata, findings,
    accept/adapt/reject/defer/resolve decisions, and improved/partial/active
    verification verdicts. No draft text beyond anchored quotes; storage.js
    prefix export/import covers the key automatically.
- Worker: `council_reviewer` (1536, thinking off) and `council_synthesis`
  (2048, thinking off) generation configs; request-kind normalization moved to
  an allowlist Set. NOT yet deployed — deploys with C2 when the first caller
  exists (current live Worker `2e3c39b4` treats the kinds as ordinary
  requests, which no shipped client sends).
- `ai-provider.js`: both kinds route to Flash and are recorded distinctly in
  `tupana_ai_usage.byKind`.
- `index.html` loads `council.js` before `ui.js`; nothing calls it yet (C2).
- Verification: new `council_kernel_test.mjs` 63/63 (pure node — profiles,
  anchors, JSON parsing, reviewer/synthesis validation, orchestration failure
  isolation, storage vocabulary); `gemini_worker_test.mjs` extended to 32/32
  (council configs + Flash-Lite unchanged).

## Sprint 0 B2 — Worker/client drift verification (2026-07-31)

- Question: does the deployed Worker match `server/gemini-worker/src/index.js`
  at branch head `691d3e1`?
- Finding: **drift confirmed.** The previously deployed version
  (`b3cf5571`, 2026-07-30 18:41 UTC) predated commit `691d3e1`
  (2026-07-30 22:30 UTC) and lacked the `capstone_review` request kind. A live
  probe with `requestKind: "capstone_review"` returned `thoughtTokens: 243` —
  the request fell through to the default Flash config (600-token ceiling,
  thinking enabled), exactly the truncation failure mode the Stage 10 JSON
  ceiling exists to prevent.
- Impact before fix: none for the live site (the deployed `main` frontend never
  sends `capstone_review`); the branch frontend's Stage 10 Compare would have
  received thinking-starved, truncated output.
- Fix: redeployed the Worker from the branch source. New version
  `2e3c39b4-db34-4a3e-91d9-b610f5731dda`. The change is purely additive
  (one generation-config branch + request-kind normalization); response shape
  (`{text, truncated, usage}`) verified identical before and after.
- Post-deploy probe: same `capstone_review` request now returns
  `thoughtTokens: 0` with a complete reply — thinking disabled per spec.
- All 32 local test suites pass at `691d3e1` (independent rerun, Node v26;
  one suite requires a per-suite timeout guard when run in bulk).

## Fall 2026 polishing sprint — completion integrity and calm final flow

- Branch: `experiment/redesign-v1`
- Stage 10 now requires a changed artifact across every genre layer.
  Whitespace-only changes do not pass, and genuine earlier revisions
  take precedence over later seeded copies of the first draft.
- The checkpoint returns students to revision without deleting work. A
  student-reported instructor exception is available when revision is not
  required and is labeled in the report as not independently verified.
- Stage 10 is evidence-first: students write three short process statements
  before optional ratings become available.
- The capstone coach now reads the latest complete draft and process evidence,
  not a 1,400-character visible-textarea excerpt.
- The premature Stage 10 completion interruption was removed. Genre-neutral
  completion language appears only after the real final sequence.
- Ordinary coach replies now use one anchored observation, one priority next
  move, and at most one question, normally within 120–220 words.
- Save/Export exposes a collapsed, local-only AI activity summary without
  quota language.
- Keyboard polish: the stuck menu supports focus entry, arrow/Home/End/Escape,
  outside dismissal, and focus return; Help and capstone modals restore focus.
- Verification: revision completion 26/26; Stage 10 completion 22/22; Stage 10
  reflection 28/28; final packet 22/22; shared routing 65/65; full-draft review
  32/32; stuck menu 14/14; storage 13/13. Live browser visual and keyboard
  checks passed.
- No Worker change was required for this pass. Frontend remains local on the
  experiment branch pending release review.

## Fall 2026 polishing sprint — guided full-draft review

- Branch: `experiment/redesign-v1`
- Stages 7 and 9 now expose one shared **Review draft** action across the
  autobiographical, service-learning, research, STEM, college-admissions, and
  graduate-SOP pathways.
- The student chooses one of five lenses: structure/trajectory,
  evidence/specificity, assignment fit, voice/clarity, or final audit. The
  coach must read the complete draft, anchor observations, return at most
  three revision priorities, and never rewrite.
- There is no student-facing quota. Follow-up reviews ask what changed or what
  should be inspected; an unchanged draft requires an explicit different-lens
  choice. After several wide-angle reviews, passage coaching is recommended
  but another purposeful full reading remains available.
- Drafts up to 2,000 words receive a comfortable-length cue; 2,000–3,000 and
  3,000+ drafts receive increasingly focused guidance but are not rejected.
- Full-draft review uses Gemini 2.5 Flash with a 3,072-token output safety
  ceiling and thinking disabled. The existing 128,000-character request
  ceiling remains an abuse boundary far above normal five-page assignments.
- The Worker returns sanitized usage counts. The browser stores aggregate
  totals by request kind in `tupana_ai_usage`; no draft text, response text,
  IP address, or student identifier is added to usage records.
- Worker version `b3cf5571-bdca-477d-9112-fc7f537b870d` is deployed. A live
  synthetic 1,500-word full-draft request returned `200`,
  `truncated:false`, all four required review sections, and sanitized usage
  totals (`4,177` input / `97` output tokens).
- Verification: dedicated workflow 32/32; Worker 25/25; passage coaching
  25/25; truncation 8/8; recovery 14/14; shared routing 65/65; storage 13/13;
  broader pathway regressions passed for SOP, college admissions,
  service-learning, STEM, Stage 10, and colleague review mode.

### Carried forward — shared passage coaching

- The ambiguous **Strength** action is split into **What works** and
  **Strengthen**; Clarity, Voice, and Ask remain shared across all genre layers.
- Selected passages and directly pasted multi-sentence writing follow one
  mandatory whole-passage protocol: read later sentences, do not ask for
  information already supplied, distinguish sentence-level from passage-level
  issues, and state the rhetorical purpose of opening-focused advice.
- Passage analysis uses Gemini 2.5 Flash at every stage. Worker
  `requestKind: "passage_analysis"` uses a 1,536-token ceiling with thinking
  disabled so the visible answer completes.
- Previous Worker version `5284786b-34fc-40e6-bd84-19ae96c697c0` passed live
  passage verification; the full-draft version above supersedes it.

---

## Phase 1 AI-Assisted Memory Architecture — COMPLETE (2026-05-25)

**Latest pushed commit: `3fbca71` — `docs: add talks dissemination layer to Phase 1 architecture`**

### Phase 1 commits on origin/main

| Commit | Content |
|--------|---------|
| `f6a9094` | export packets + context-packet template |
| `ce2b266` | NotebookLM workflow section in obsidian-workflow |
| `0f4aae0` | session digest |
| `74f1fbe` | Phase 1 architecture plan |
| `3fbca71` | talks dissemination layer |

### NotebookLM notebooks — created and tested

| Notebook | Grounding test result |
|----------|-----------------------|
| `Tu Pana: Pedagogical Core` | ✓ Correctly synthesized authorship, anti-ghostwriting, Stage 6 gate, Voice Vault, bilingual parity |
| `Tu Pana: Architecture & Design Decisions` | ✓ Correctly synthesized offline-first architecture, authorship gate, guardrails, Five Questions, provider routing |
| `Intellectual Projects: Cross-Domain Synthesis` | ✓ Correctly understood itself as a controlled cross-domain synthesis scaffold |

### Key architecture rules (enforce every session)
- **NotebookLM is synthesis/orientation only** — one query per session max; NLM-derived content ≤ 800 tokens in context packet
- **`docs/talks/`** — public-facing rhetorical artifacts; do NOT upload back into operational NLM notebooks by default
- **No MCP yet** — do not begin MCP integration until repeated manual retrieval patterns justify it
- **Canonical truth:** GitHub `docs/`, Obsidian vault, `SYSTEM_MEMORY.md`

### Next recommended action
- Use the Phase 1 workflow in real sessions (see `docs/workflow/context-packet-template.md` and `docs/phase1-memory-architecture.md §7`)
- Keep NotebookLM as synthesis/orientation only
- Proceed to Tier 4: pilot logistics (requires real students — see Tier 4 section below)

---

## Where we left off

**Session 38 (2026-05-19) — Gemini error-handling and recovery (commit `f6832a9`, deployed to Cloudflare):**

- **Problem:** All Gemini failures — rate limits, outages, auth errors — collapsed into one generic 502 with no category. Students saw the same hardcoded bilingual unavailable message regardless of cause. No retry logic existed.
- **Worker fix (`server/gemini-worker/src/index.js`):** `callGemini()` now preserves the upstream Gemini HTTP status and extracts the Gemini status enum (e.g. `RESOURCE_EXHAUSTED`) from error bodies. The catch block maps status → `category` and returns `{ error, category, status, message, upstreamStatus }` with the correct HTTP status code instead of always returning 502.
- **Frontend fix (`assets/js/ai-provider.js`):** `callGeminiProviderViaProxy()` refactored into `_callGeminiOnce()` + retry loop. Added `_GEMINI_RETRYABLE`, `getGeminiErrorMessage()`, `_statusToGeminiCategory()`, and `_mkGeminiErr()`. Retries transient failures (429, 5xx, network_error) up to 2× with ~1.5s / ~4s backoff + jitter. Non-retryable categories (bad_request, auth_error, invalid_response) fail immediately.
- **Frontend fix (`assets/js/ui.js`):** One line — `addMsg(getGeminiErrorMessage(err), 'bot')` replaces the old hardcoded generic string.
- **Deployment:** `wrangler deploy` succeeded. Live Worker: `https://tupana-gemini-proxy.dr-torres-velez.workers.dev` (Cloudflare Version ID `fa632aa1-3081-4757-979a-09f421a913c7`).
- **Smoke tests passed:** Normal request → 200 + text; empty prompt → 400; bad origin → CORS blocked; model allowlist/upstream error → structured `{ category: "service_unavailable", ... }` confirmed live.
- **Unchanged:** Offline/Ollama paths, duplicate-send guard (`state.waiting`), all pedagogy and stage behavior.
- **Operational notes:** Rotate `GEMINI_API_KEY` with `wrangler secret put GEMINI_API_KEY`; future deploys require `npx wrangler@latest deploy` from `server/gemini-worker/`.

---

**Session 37 (2026-05-19) — AI literacy checkpoint auto-popup (commit `432a776`, pushed to `main`):**

- **Change:** `assets/js/ui.js` only (~+18 lines).
- **New constant:** `AUTO_REFLECTION_STAGES = new Set([4, 7, 8])`.
- **New helper:** `maybeOpenStageEntryReflectionCheckpoint(stageId)` — looks up the checkpoint object from `REFLECTION_CHECKPOINTS`, checks/sets `localStorage.tupana_reflect_shown_N`, then calls `openReflectionCheckpoint(cp)` after 1200ms.
- **Hook:** `goToStage()` calls the helper at the end, so the popup fires when students press Continuar to enter Stage 4, 7, or 8.
- **Once-only:** `tupana_reflect_shown_N` key prevents repeat. Page-reload init path bypasses `goToStage()`, so reloads do not re-fire.
- **Unchanged:** Manual "Reflect · Pausa crítica" pill button, Stage 10 exclusion, all other stage behavior.
- **Tests:** 8 Playwright assertions passed, no JS errors.

---

**Session 36 (2026-05-18) — Capstone modal popup (commit `0bbf37a`, pushed to `main`):**

- **Problem:** "Mi cierre de proceso" (Stage 10 self-assessment + coach perspective + student response + instructor report) rendered inside the cramped chat panel, making it hard to read and fill in.
- **Fix:** Added a dedicated fixed modal overlay (`.capstone-bg` / `#capstoneBg`) with a scrollable body (`#capstoneModalBody`). All four capstone panels (10A, 10B, 10C, instructor report) now append to the modal body and call `openCapstoneModal()` instead of `D.chatMessages.appendChild`.
- **Reopen button:** A persistent `.capstone-chat-trigger` card with a "Mi cierre de proceso · Writing Snapshot →" button stays in the chat panel so students can dismiss the modal and return at any time.
- **Mobile:** Modal gets full 96svh height with internal scrolling (same pattern as lab-bg/mani-bg).
- **Close button:** `✕` in the modal header calls `closeCapstoneModal()` — modal hides, chat trigger remains.
- Files changed: `index.html` (modal HTML), `assets/js/ui.js` (functions + 6 append sites redirected), `assets/css/styles.css` (modal + trigger CSS, mobile override).

---

**Session 35 (2026-05-18) — Auto-switch to chat tab after lab onboarding on mobile (commit `6e90d5a`, pushed to `main`):**

- **Problem:** On mobile (≤480px), when the Laboratorio onboarding closed, the app stayed on whatever panel the student was on. The coach's welcome message appeared in the chat panel but the student couldn't see it.
- **Fix:** Added `if (window.innerWidth <= 480) switchMobileTab('chat');` in `closeLab()`, before `flashChatFocus()` and the welcome message. Student now lands on chat immediately after completing the lab.
- File changed: `assets/js/ui.js` only (1 line added).

---

**Session 34 (2026-05-18) — Mobile lab onboarding Safari ghost-touch bug (commits `8da3f1b`, pushed to `main`):**

- **Root cause:** `mani-bg` (z-index 500) sits above `lab-bg` (z-index 400) in the stacking order. After `mani-bg` loses its `.on` class it becomes `opacity: 0; pointer-events: none` — but iOS Safari's touch hit-testing routes taps to the higher z-index element anyway, re-firing `maniProceed()`. This re-triggered the "You claimed your assets..." celebration overlay mid-lab. Pressing "Continue to the Lab" on the re-triggered overlay called `openLab()` while the lab was already open, resetting `labCurrent = 0` (back to the Welcome step).
- **Fix 1 — `maniProceed()` re-entry guard:** Checks `maniBg.classList.contains('on')` before proceeding. Also explicitly sets `proceedBtn.disabled = true; proceedBtn.style.pointerEvents = 'none'` to bypass CSS inheritance issues in Safari.
- **Fix 2 — `showManiCelebration()` one-shot guard:** Returns immediately if `#maniCelebration` already exists in the DOM. `dismiss()` is now a strict one-shot function (`let dismissed = false` flag) — ghost-tap on "Continue to the Lab" is a no-op.
- **Fix 3 — `openLab()` re-entry guard:** Returns immediately if `labBg` already has `.on`, preventing any future code path from resetting lab progress mid-session.
- File changed: `assets/js/ui.js` only (10 lines added/changed).

**Next steps:**
- Share pilot packet with Tier 4 testers
- Tier 4 pilot logistics (requires real students)

---

**Session 33 (2026-05-18) — Safari cross-browser fix for pilot packet (commit `f0dc053`, pushed to `main`):**

- **Problem 1 — Collapsibles broken in Safari:** `display: flex` on `<summary>` silently breaks WebKit's toggle handler — Safari requires `display: block` (or `list-item`) to register clicks. All sections showed open with no toggle possible.
- **Fix:** Changed `summary` to `display: block; position: relative; padding: 13px 50px 13px 20px`. The `::after` chevron changed from `display: block; flex-shrink: 0` (inline in flex row) to `position: absolute; right: 14px; top: 50%; transform: translateY(-50%)`. Rotation on open: `translateY(-50%) rotate(180deg)`. Added `summary::marker { content: none }` alongside the existing `-webkit-details-marker` rule.
- **Problem 2 — Buttons less impactful in Safari:** Safari renders `box-shadow` softer than Chrome; font anti-aliasing on dark backgrounds makes bold text appear thinner.
- **Fix:** Added `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; position: relative` to `.feedback-button`. Primary button: layered double shadow (`rgba(45,122,95,0.55)` + `rgba(0,0,0,0.25)`) + `border: 2px solid rgba(255,255,255,0.18)` for dimensional pop. Secondary button: `border: 2px solid rgba(30,26,20,0.12)` + layered shadow.
- File changed: `docs/pilot/tier-4-pilot-testing-packet.html` only.
- Public URL: `https://vikthor1.github.io/tu-pana/docs/pilot/tier-4-pilot-testing-packet.html`

**Next steps:**
- Share pilot packet URL with Tier 4 testers
- Tier 4 pilot logistics (requires real students)

---

**Session 32 (2026-05-18) — Pilot packet usability polish (commit `7b9e7f7`, pushed to `main`):**

- **Form position fix (pending from session 31):** Moved `.feedback-embed` (iframe + fallback) from after the Privacy section into `<section id="feedback">`, directly after the `.form-summary` card. Clicking quick-nav "Submit Feedback" now lands the tester at the embedded form immediately.
- **Sample Writing Prompt removed:** Entire section (bilingual prompt + tester callout) deleted — duplicate of ready-made test texts, unnecessary cognitive load.
- **Quick-nav fix:** First item changed from `href="#open-app"` / "1. Open App" to `href="#hero"` / "1. Open Tu Pana" — the link now actually scrolls to the hero with the app button.
- **Hero secondary button softened:** "Submit Feedback Later / Enviar comentarios" — communicates test-first sequence.
- **Recommended short-test callout:** Gold callout added after time badges in `#testing-route`: "Recommended first test / Primera prueba recomendada" — reassures testers that 10 stages aren't required.
- **"Short on time? Use these." callout:** Gold callout added before collapsed `<details>` in `#test-texts` — makes the value unmistakable without auto-opening the section.
- **Mobile quick-nav:** Added `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch` + `flex: 0 0 auto` on label and buttons at 480px breakpoint — prevents nav from wrapping into multiple lines on small screens.
- File changed: `docs/pilot/tier-4-pilot-testing-packet.html` only.

---

**Session 29 (2026-05-18) — Local QA fix: `beyond_toolkit_test.mjs` stale fixture (no commit — test file untracked):**

- **What failed**: `beyond_toolkit_test.mjs` "Checkpoint skill chip present" — pre-existing since Session 27.
- **Why**: Session 27 refactored `openToolkitPanel()` to read `tupana_skills_acquired` (JSON array of skill IDs) instead of `tupana_decisions` checkpoint objects. The test still seeded the old key.
- **Fix applied locally**: Updated the "Assignment skills and transferable cards are distinct" block to seed `tupana_skills_acquired: ["research_with_authorship"]`. Updated assertions from checkpoint-specific text ("Research verification") to current skill-chip pattern (`research` / `investigación` from `STAGE_SKILL_DEFS`).
- **Results**: beyond_toolkit 21/21 ✅ · toolkit 29/29 ✅ · skills_gains 22/22 ✅ · help_panel 34/34 ✅
- **Tracking note**: All `.mjs` test files are excluded by the repo's allowlist-style `.gitignore`. `git ls-files | grep mjs` returns nothing. The fix lives locally only. A future repo-structure decision may be needed if QA tests should become tracked project assets.

**Next steps:**
- Tier 4 pilot logistics (requires real students)
- Or next from ideas folder

---

**Session 28 (2026-05-18) — Mi Toolkit Phase 2: bottom-sheet mobile polish (commit `8ae882f`, pushed to `main`):**

- `.mobile-toolkit-btn` touch target raised 36px → 44px (≤480px block)
- `.toolkit-close` touch target raised 30px → 44px (≤430px block)
- `@keyframes toolkitSlideUp` replaces `pnModalIn` for bottom-sheet card — native slide-up instead of scale+fade
- `.toolkit-modal-bg` animation set to `none` on mobile
- Bottom-sheet card: `max-width: 100%` (overrides desktop 560px cap)
- `.toolkit-modal-card::before` drag-handle pill: 36×4px, centered, `var(--border-mid)`
- `overflow-x: hidden` on `.toolkit-modal-card` globally
- 375px: tightened section/chip/claim-block padding
- `prefers-reduced-motion`: toolkit modal + card animation suppressed
- Files changed: `assets/css/styles.css` only
- Tests: toolkit 29/29 ✅ · help panel 34/34 ✅ · skills gains 22/22 ✅
- `beyond_toolkit_test.mjs` has a pre-existing failure ("Checkpoint skill chip present") — Session 27 switched chips from `tupana_decisions` to `tupana_skills_acquired`; test still seeds old key. Not a regression.

---

**Session 27 (2026-05-15) — Toolkit dynamic skill unlocking + micro-toast, Phases 4–5 (commit `a225a20`, pushed to `main`):**

- `STAGE_SKILL_DEFS` (10 entries, one per stage) added to `data.js` — each entry has `skillId`, `stageNum`, `labelEs`, `labelEn`.
- `getAcquiredSkills()`, `unlockStageSkill(stageNum)`, `showSkillToast(def)` added to `ui.js`.
- `goToStage()` end hook: `if (id !== 6) unlockStageSkill(id);` — Stage 1–5, 7–10 unlock on stage entry.
- `executeSave()` hook: `unlockStageSkill(6);` — Stage 6 "author-owned draft" skill gates on first save (IRB/authorship integrity constraint).
- Micro-toast: `.skill-toast` / `.skill-toast--visible` CSS transition, 3.8s display, bilingual, reduced-motion safe, non-blocking.
- `openToolkitPanel()` skills section replaced: now reads `tupana_skills_acquired` via `getAcquiredSkills()`. Renders chips in stage order; shows bilingual empty state when none earned. Legacy `tupana_decisions` checkpoint entries do not generate chips.
- `tupana_skills_acquired` added to `storage.js` export/import/clear key arrays.
- `styles.css`: skill-toast CSS appended (24 lines with reduced-motion block).
- `skills_gains_test.mjs` rewritten: new seed logic, 22/22 ✅. `toolkit_test.mjs`: 29/29 ✅ (no regressions).
- Files changed: `data.js` · `ui.js` · `storage.js` · `styles.css`

**Next steps:**
- Tier 4 pilot logistics (requires real students)
- Or next from ideas folder ranking

---

**Session 26 (2026-05-15) — Gemini Flash routing for Stages 7 and 10 (commit `8e82733`, pushed to `main`):**

- `selectGeminiModel(stageId)` added to `assets/js/ai-provider.js` — returns `'gemini-2.5-flash'` for `stage.revision` (7) and `stage.reflection` (10); `'gemini-2.5-flash-lite'` for all other stages. Accepts both stage number and stable string ID.
- `callGeminiProviderViaProxy()` now calls `selectGeminiModel()` instead of reading `CONFIG.geminiModel` directly.
- `sendMsg()` Gemini path now passes `stageId: getStageId(state.stage)` (stable string) instead of the raw number — consistent with `requestCoachPerspective()`, which already did this correctly.
- Worker `maxOutputTokens` raised 400 → 600 when Flash is used. Stage 10 capstone JSON (8 dimensions × 3 fields each) was tight at 400 tokens. Worker redeployed to Cloudflare.
- Files changed: `assets/js/ai-provider.js` · `assets/js/ui.js` · `server/gemini-worker/src/index.js`
- No guardrail changes · no stage logic changes · no localStorage changes · no UI changes.
- Ranked #1 in ideas folder review (2026-05-15): smallest effort, highest quality payoff at the two most critical stages before pilot.

**Next steps (session 27):**
- Tier 4 pilot logistics — requires real students
- OR: Toolkit Dynamic Skill Unlocking (ranked #2 in ideas folder)

---

All Tier 1, Tier 2, and Tier 3 items are complete and pushed to `main`.

**Session 23 (2026-05-13) — Milestone-based reflection checkpoints (first patch):**
- `REFLECTION_CHECKPOINTS[]` data structure added to `ui.js` — 4 checkpoints (stages 4, 7, 8, 10)
- `renderReflectButton(msgId)` — single optional "Reflect · Pausa crítica" button per bot message (stages 4+); replaces auto-inject of 5-question eval bar
- `openReflectionCheckpoint(cp)` — modal using existing eval-modal CSS; picks stored to `tupana_decisions` with `checkpoint:true` flag
- CSS: `.reflect-btn-wrap`, `.reflect-btn`, `.reflect-option-btn`, etc. — no new localStorage keys
- Tests: toolkit 29/29 ✅ · structural 18/18 ✅ · no API key ✅ · authorship gate intact ✅

**Session 23 patch 2 — Skills Gains tab wired:**
- `openToolkitPanel()`: computes `skillsHtml` from `tupana_decisions` filtered for `checkpoint:true`; deduplicates by stage; renders `.toolkit-skill-gain` chips (bilingual, EN+ES) or `.toolkit-skills-empty` if none earned
- `REFLECTION_CHECKPOINTS`: added `skillsGainsLabelEs` to all 4 entries
- CSS: `.toolkit-skill-gain`, `.toolkit-skill-gain-name`, `.toolkit-skill-check`, `.toolkit-skill-gain-desc`, `.toolkit-skills-empty`
- `toolkit_test.mjs`: selector updated `.toolkit-skills-placeholder` → `.toolkit-skills-empty` (29/29 ✅)
- `skills_gains_test.mjs`: added (20/20 ✅)

**Session 23 patch 3 — Badge alignment with milestone model:**
- `computeBadges()`: counts distinct checkpoint stages via Set; Voice Guardian = 1+ checkpoint OR legacy ≥5; Editor = 3+ OR legacy ≥10; 4 other badges unchanged
- `badge_test.mjs` added (15/15 ✅); toolkit 29/29 ✅

**Session 23 patch 4 — Milestone gating for reflection checkpoints:**
- `state._reflectStage: 0` added to `state` object in `ui.js`
- `renderReflectButton()` gated: stages 5/6/9 suppressed (no checkpoint); stage 10 suppressed (capstone flow); stages 7/8 require `state._reflectStage === state.stage`, flag consumed after first button shown
- `selectRevisionFocus()` in `prompts.js`: sets `state._reflectStage = 7` after sending revision focus message
- `selectPolishRoute()` in `prompts.js`: sets `state._reflectStage = 8` at end (protect route returns early — never sets flag)
- `openReflectionCheckpoint()`: added `closeReflect`/`onEscReflect` for Escape key dismiss; skip button, backdrop click, and Escape all share one close path
- `milestone_gate_test.mjs`: 22/22 ✅ · toolkit 29/29 ✅ · skills gains 20/20 ✅ · badges 15/15 ✅

**Session 24 (2026-05-13) — Stage 10 AI reflection in capstone flow:**
- New freetext field added to `showCapstoneCard10C()`: "Reflexión crítica de IA · Critical AI Reflection" with bilingual frame hint; autosaves to `tupana_capstone.studentResponse.aiAdvice`
- `submitCapstone10C()`: saves `{ checkpoint:true, stage:10, skill:'AI advice evaluation / reflective decision-making', written:true, choice:aiAdviceText }` to `tupana_decisions` once; calls `renderBadges()` + `renderDecisionLog()`; duplicate-safe guard
- `exportCapstone()`: includes `aiAdvice` in 10C export text when present
- CSS: `.capstone-reflection-hint` (muted frame text below label)
- `stage10_reflection_test.mjs` added (28/28 ✅) · milestone gate 22/22 ✅ · badges 15/15 ✅ · skills gains 20/20 ✅

**Session 24 patch 2 (2026-05-13) — Transferable AI literacy cards:**
- Mi Toolkit "What I'm Learning" section renamed to "Habilidades practicadas en este ensayo · Skills practiced in this essay"
- New "Más allá de este ensayo · Beyond This Essay" section added below, with 5 static bilingual transfer cards:
  1. AI is not a source (verification)
  2. AI may sound neutral but is not (bias/cultural framing)
  3. Not everything belongs in a prompt (privacy)
  4. Use AI without surrendering judgment (authorship/dependency)
  5. Ask whether AI belongs in this situation (appropriateness)
- No new storage keys. No checkboxes. No pop-ups. Static read-only display.
- CSS: `.toolkit-transfer-intro`, `.toolkit-transfer-card`, `.toolkit-transfer-principle`, `.toolkit-transfer-skill`, `.toolkit-transfer-desc`
- `toolkit_test.mjs`: section count 2 → 3 (29/29 ✅); `beyond_toolkit_test.mjs` added (21/21 ✅)

**Session 24 patch 3 (2026-05-13) — Spanish copy pass; critical AI literacy layer complete:**
- Beyond This Essay cards: principles tightened; Card 2 "pero no lo es" → "pero no es neutral"; Card 3 "pertenece a un prompt" → "debe compartirse en un prompt"; Card 5 "Pregunta si" → "Pregúntate si", "pertenece" → "corresponde"; desc lines removed (skill lines now self-contained and concise)
- English updated to match Card 2 and Cards 3–5 for bilingual parity
- beyond toolkit 21/21 ✅

**Critical AI literacy layer is now complete across all 7 components:**
1. Milestone-based reflection checkpoints (2996677)
2. Skills Gains display (3fb3023)
3. Badge alignment (c83a382)
4. Stage 7/8 milestone gating (28f5091)
5. Stage 10 capstone AI reflection (6fffa82)
6. Beyond This Essay transferable cards (fef44ef)
7. Spanish copy final pass (this commit)

**Session 25 (2026-05-13) — Help / Ayuda orientation panel + app-confusion fallback (commit `d177119`, pushed to `origin/main`):**

Files changed: `index.html` · `assets/js/ui.js` · `assets/css/styles.css`

- **Help button** — `?` button added to `<header>` (38×38 pill); matches `.theme-toggle` / `.reset-btn` pattern; calls `openHelpPanel()` via `onclick`; mobile tap targets raised to 44×44 at ≤480px and ≤375px breakpoints
- **`openHelpPanel()`** — bilingual modal (9 sections) rendered via the existing `toolkit-modal-bg` / `toolkit-modal-card` pattern; reuses `.toolkit-close` button, Escape key, and backdrop-click close paths
  - Sections: What is Tu Pana · How to send a message · Spanish is valid · How to advance stages · Mi Toolkit · 10-stage list · Coach not responding · Work preservation · Questions for your instructor
  - Stage-aware current stage line: reads `state.stage` and `STAGES[state.stage - 1].es/en`; shown in `.help-current-stage` block above the sections
  - 10-stage list: each item shows bilingual name + one-line description; current stage highlighted with `.help-stage-current`
- **`submitChat()` app-confusion fallback** — keyword intercept runs before `sendCoachMessage()`; ~13 EN/ES phrases (`'how do i'`, `'cómo funciona'`, `'no entiendo cómo'`, etc.); on match: adds user bubble via `addMsg(t, 'user')`, returns bilingual local response pointing to `?` button, re-enables send button, returns — AI never called; optional stage-specific note appended for Stages 6, 8, and 10; normal essay messages pass through unchanged
- **CSS** — `.help-btn` (new; hover: jade border/color); `.help-modal-card` (max-width 520px); `.help-current-stage`, `.help-section`, `.help-section-title`, `.help-section-body`, `.help-stage-list`, `.help-stage-item`, `.help-stage-num`, `.help-stage-current`
- **No changes to:** provider routing, Gemini Worker, guardrail prompt, Voice Vault, Mi Toolkit, Stage 10 capstone/report logic, the 10-stage workflow, or any localStorage keys
- **No API keys or secrets exposed**
- **Tests:** `help_panel_test.mjs` 34/34 ✅ · prior suites (toolkit 29 · beyond toolkit 21 · milestone gate 22 · skills gains 20 · badges 15 · stage 10 reflection 28) 135/135 ✅

**Next steps (session 26):**
- Tier 4 pilot logistics — requires real students

**All 18 Playwright selection-to-coach tests passing (last run 2026-05-11).**

---

## Tier completion status

### Tier 1 — Pre-pilot blockers: ALL COMPLETE
- ✓ Process log wiring (8 events in `logProcessEvent()`)
- ✓ Stage 10 Ollama branch (`generateCoachResponse()` → `handleCoachPerspectiveResponse()`)
- ✓ AI routing — `submitChat()` → `sendCoachMessage()` → `sendMsg()`

### Tier 2 — UX before pilot: ALL COMPLETE
- ✓ Stage 10 reflection + instructor-report breathing room (commit `4def495`)
- ✓ Five Questions eval modal — centered overlay / bottom-sheet ≤430px, silent picks (commit `9c37797`)
- ✓ Stage 4 research guidance card — amber guardrail + 4 bilingual starters (commit `26849cc`)
- ✓ Mobile stage navigation — progress strip + "de 10 / of 10" label ≤480px (commit `052b516`)
- ✓ Stage 8 Voice Polish card — 5-route flow, replaces revision panel at Stage 8 (commit `70933b0`)
- ✓ Selection-to-Coach — floating button on draft selection, stage-aware framing, no auto-send (commit `e961ce6`)

### Regressions fixed (sessions 2026-05-11 / 2026-05-12)
- Stage 3 coaching scoped to pitch/tension — no "how did you feel?" bleed from Stage 1/2
- Stage 4 fake-source block hardened — no formatted citations even as examples
- Five Questions eval picks now silent (no sendMsg)
- Mobile Next auto-switches to Coach tab (≤480px)
- Stage 8 anti-rewrite: VOICE POLISH RULE block + `[STAGE 8 — VOICE POLISH]` user-message preamble
- Demo/Offline response alignment — DEMO_RESPONSES updated to current stage names
- Dify + Demo + Copilot + DirectLine provider paths fully removed
- Light bone-white theme restored as default (no OS dark-mode fallback)
- Onboarding: progressive asset claiming, in-card celebrations, manual progression, lab sequence fix
- Mobile stage navigator (select dropdown ≤480px)
- Active coach status dot pulse (Ollama + Gemini only)
- Post-onboarding chat focus highlight

### Tier 3 — Architecture: ALL COMPLETE
- ✓ Gemini Flash-Lite live via Cloudflare Worker proxy (`tupana-gemini-proxy.dr-torres-velez.workers.dev`)
- ✓ Full guardrail prompt (all rules) assembled and sent through Gemini path
- ✓ `FEATURES.geminiProvider = true`; `AI_PROVIDER = 'gemini'`; default mode is `'gemini'`
- ✓ `requestCoachPerspective()` Gemini branch — Stage 10 coach perspective works on Gemini
- ✓ Worker `MAX_PROMPT_CHARS` raised to 128000 so long-form genre instructions
  and student passages fit without approaching Gemini 2.5's model capacity
- ✓ All legacy providers removed — valid modes: `offline | ollama | gemini`
- ✓ No API key in any frontend file

---

## Next — Tier 4: Pilot Logistics (requires real students)

No more blocking code work. All remaining items require real students.

1. 5-student pilot recruitment and facilitation
2. Pre/post surveys (design + collect)
3. Revision decision log export for IRB
4. Student testimonials
5. Accessibility documentation
6. Privacy documentation
7. Instructor reflection

---

## Dev environment

- Serve: `python3 -m http.server 8000` from `/Users/Victor1/Sites/tupana/`
- Ollama: `OLLAMA_ORIGINS="http://localhost:8000,http://127.0.0.1:8000" ollama serve`
- Model: `qwen2.5:7b` (set in `CONFIG.ollamaModel` in `config.js`)
- Dev timing log: append `?dev=true` to URL
- Gemini: live via Cloudflare Worker — no local setup needed
