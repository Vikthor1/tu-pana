# Tu Pana — Session Status

Last updated: 2026-05-15 (session 26, committed — Gemini Flash routing for Stages 7 + 10)

---

## Where we left off

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
