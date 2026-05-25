# Context Packet — [Project] — [YYYY-MM-DD]

*Fill this in 5 minutes or less before every Claude Code session. If it is taking longer, the task is not yet well-defined — stop and clarify first. Total packet must stay under 2000 tokens.*

---

## Task

[One sentence. What specifically must happen.]

*Example: "Add a Stage 11 scaffolding hook to `goToStage()` in `ui.js`."*

---

## Architecture Constraints

[2–4 bullets. Only constraints directly relevant to this task. Skip irrelevant ones.]

- [e.g., "Guardrail: coach cannot generate prose — this rule must survive every change"]
- [e.g., "No build step — vanilla JS only, no imports or bundlers"]
- [e.g., "Stage 6 authorship gate: `draftSaved === true` required before revision feedback"]
- [e.g., "Bilingual parity: any new student-facing string needs both Spanish and English"]

---

## Recent Context

[1–3 bullets from `git log` or `SYSTEM_MEMORY.md`. What changed recently that matters here.]

- [e.g., "Session 40 (commit `b2d5f78`): Voice Vault inline protect button added to panel"]
- [e.g., "SYSTEM_MEMORY §3 covers current modular file structure — consult before editing"]

---

## Pedagogical Rules

*Include only if the task touches coaching logic, AI prompts, or any behavior affecting students.*

- [e.g., "ABSOLUTE AUTHORSHIP RULE: no copy-ready prose of any kind; overrides everything"]
- [e.g., "VOICE POLISH RULE: quote student's exact words — never append or invent continuations"]

---

## Files Allowed to Edit

- `assets/js/[filename].js` — [what it contains and why it is the right place for this change]

---

## Files Forbidden to Edit

- `assets/js/ui.js` (full file) — too large to send in full; extract only the specific function being changed
- `assets/js/genre-template.js` — only if task explicitly requires a template structure change
- [add others as relevant]

---

## Tests Required Before Final Report

- [ ] [Playwright test file, e.g., `node --experimental-vm-modules node_modules/.bin/jest toolkit_test.mjs`]
- [ ] [Manual QA step, e.g., "Stage 8: select a phrase, confirm coach asks a question rather than rewriting"]
- [ ] [Smoke test, e.g., "Reload at Stage 6 — confirm draft is restored and authorship gate state is correct"]

---

## NotebookLM Grounding

*Leave blank if not used this session. Fill only if you queried NotebookLM for orientation.*

[2–3 sentence distillation of the relevant NLM answer. Do not paste the full NLM response — distill it.]

---

## Usage notes

- Paste this packet at the start of a Claude Code session, before any file excerpts.
- After the packet, provide only the specific function or section being changed — never full `ui.js`.
- After the session, update `SYSTEM_MEMORY.md`, `docs/current-architecture.md` (if structure changed), and `docs/session-status.md`.
- See `docs/phase1-memory-architecture.md` §7 for the full session workflow.
