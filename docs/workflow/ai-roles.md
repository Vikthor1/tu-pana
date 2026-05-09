# AI Tool Roles — Tu Pana de Escritura

*Last updated: 2026-05-09*

Overlap is the enemy of coherent AI collaboration. This document defines who does what.

---

## Strategic layer (reasoning, planning, review)

### Claude (Claude Code / claude.ai)
**Role:** Primary AI assistant. Architecture decisions, code review, complex edits, documentation, session orchestration.

**Use for:**
- Planning new features or refactors
- Complex edits to `ui.js` (always specify function name)
- Writing or revising project documentation
- Reviewing diffs before commit
- "Is this safe to change?" questions

**Do not use for:**
- Autonomous large-batch changes without human diff review

### ChatGPT
**Role:** Secondary strategic AI. Alternative perspectives, second opinions, overflow when Claude context is saturated.

**Use for:**
- Brainstorming alternative approaches
- Reviewing pedagogical language in student-facing strings
- Second-opinion architecture questions

**Do not use for:**
- Primary code editing (Claude Code is better suited)
- Final decisions on constraints or architecture

---

## Orchestration layer (NOT YET ACTIVE)

### Hermes
**Status:** Not installed.
**Intended role:** Local orchestrator that routes tasks from AI assistants to Aider, enforces constraints, and passes project memory as context.
**Docs:** `docs/hermes-role.md`, `docs/workflow/hermes-onboarding.md`

---

## Implementation layer (NOT YET ACTIVE)

### Aider
**Status:** Not installed.
**Intended role:** Apply AI-generated changes to the codebase under human supervision. Human reviews every diff before commit.
**Docs:** `docs/workflow/aider-prep.md`

---

## Experimental / local model layer

### Kimi / Qwen / Hermes (via Ollama)
**Role:** Local model experiments. Context compression testing. Not integrated into the development loop.

**Use for:**
- Inspecting small, isolated files: `config.js`, `data.js`, `prompts.js`, `storage.js`, `app.js`
- TOON compression experiments (future, exploratory only)

**Do not use for:**
- Editing `ui.js`, `styles.css`, or `index.html` — too large for comfortable local-model inspection
- Any task requiring full-app context

---

## Version control

### Git
**Role:** Authoritative source of truth for what actually changed. Every significant change gets a commit.

**Rules:**
- One logical change per commit
- Commit messages say *why*, not just *what*
- Never force-push to main
- Never skip pre-commit checks

---

## Memory / knowledge layer

### Obsidian
**Status:** Not yet configured. Setup plan: `docs/obsidian-workflow.md`.
**Intended role:** Human-readable, AI-consumable project memory. Mirrors `docs/` with no modification needed.

---

## Internal data standard

### JSON (app runtime)
The app's internal data (STAGES, TRANSITIONS, EVAL_QUESTIONS, etc.) lives as JS object/array literals in `data.js` and `ui.js`. These are authoritative.

If serialization is needed for Obsidian notes or Hermes context, serialize to JSON on demand. Do not restructure source files around any external data format.

---

## TOON — scope boundary

TOON is an optional, future, experimental JSON → TOON → LLM compression layer.

- Not integrated into the app
- Not a dependency of any kind
- Not on the active roadmap
- Relevant only as a potential Hermes/Aider context-optimization experiment

The app must function with zero TOON involvement. Never add TOON as a runtime dependency.
