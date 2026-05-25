# Tu Pana — Session Status

Last updated: 2026-05-25 (Phase 1 AI memory architecture complete; talks dissemination layer added)

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
- ✓ Worker `MAX_PROMPT_CHARS` raised to 32000 (system prompt is ~14–16k chars)
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
