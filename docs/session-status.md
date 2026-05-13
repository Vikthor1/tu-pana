# Tu Pana — Session Status

Last updated: 2026-05-13 (commit `352c19e`, pushed to `main`)

---

## Where we left off

All Tier 1, Tier 2, and Tier 3 items are complete and pushed to `main`.

**Tier 3 last completed:** Laboratorio Feedback Spotlight — answered-question opacity fix so feedback stays readable after choices recede (commit `352c19e`, 2026-05-12).

**All 18 Playwright selection-to-coach tests passing.**

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
