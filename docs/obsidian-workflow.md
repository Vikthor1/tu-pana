# Obsidian Workflow — Tu Pana de Escritura

*Last updated: 2026-05-09*

The goal of Obsidian in this project is narrow: make re-entry fast after long gaps between sessions. It is not a second system of record, not a task manager, not a second README.

---

## Vault setup

**Open the project root** (`/Users/Victor1/Sites/tupana`) directly as an Obsidian vault. The `docs/` and `prompts/` folders appear as-is. No migration, no duplication, no configuration needed.

---

## Plugins

**None required.** Obsidian's default search, graph view, and backlinks are sufficient for this project.

If you add one later, limit to:
- **Git** — auto-syncs notes with git commits. Only worthwhile if you write session notes in Obsidian.

**Do not install:** Dataview, Kanban, Templater, Excalidraw, or any plugin requiring configuration or maintenance. They cost more cognitive overhead than they save for a solo developer.

---

## What you'll see in the vault

```
docs/
  project-brief.md              ← Start here after a long gap
  current-architecture.md       ← File map, globals, key functions
  hermes-role.md                ← Hermes integration design
  obsidian-workflow.md          ← This file
  workflow/
    current-workflow.md         ← How work actually happens
    ai-roles.md                 ← Who does what
    hermes-onboarding.md        ← Brief for Hermes/Ollama context injection
    aider-prep.md               ← Aider setup notes
  decisions/
    architecture-principles.md  ← Constraints that must survive every change
  testing/
    testing-philosophy.md       ← What to test and when
  releases/
    release-checklist.md        ← Pre-push verification
  ideas/                        ← Parking lot for deferred ideas
prompts/
  qa-scenarios.md               ← Manual QA checklist (active)
archive/                        ← Historical files; DO NOT inject as AI context
  README.md                     ← Explains what is archived and why
```

---

## Re-entry workflow

### After a gap of more than two weeks

1. Open `docs/project-brief.md` — confirm what must not change.
2. Open `docs/current-architecture.md` — refresh the file map and key functions.
3. Run `git log --oneline -10` in terminal — see what changed last.
4. Start coding.

### After a recent session (less than two weeks)

1. Run `git log --oneline -10` — what changed last?
2. Open the relevant file.
3. Start coding.

### After ending a session with structural changes

If you changed: new function in `ui.js`, new localStorage key, new stage behavior:
- Update `docs/current-architecture.md`.
- Update `prompts/qa-scenarios.md` if a new UI path was added.

You do not need to write session notes unless they are personally useful to you.

---

## Prompts

- `prompts/qa-scenarios.md` — manual QA checklist. Update when new stage behaviors are added.
- Agent prompts (`agent-prompt-revised.md`, etc.) are excluded from git (see `.gitignore`). To see them in Obsidian, keep them locally and link from Obsidian — do not commit them.

---

## Release notes

There is no versioning scheme yet. The git log serves as the release history.

When versioning becomes necessary (stable pilot vs. in-development), add `CHANGELOG.md` at the project root and allowlist it in `.gitignore`.

---

## How AI systems should consume project memory

### Claude / ChatGPT session startup

Paste in this order:
1. `SYSTEM_MEMORY.md` — comprehensive re-entry briefing (tier status, key functions, guardrails, what changed last)
2. `docs/session-status.md` — WHERE WE LEFT OFF and next task
3. The specific file excerpt being worked on (never full `ui.js`)

`docs/project-brief.md` and `docs/current-architecture.md` are secondary references — use them when architectural constraints matter, not every session.

**Never inject from `archive/`** — describes earlier app versions and will produce incorrect outputs.
`SYSTEM_MEMORY.md` is local-only and kept up to date — it is the recommended AI context doc.

### Hermes (when active)

System context injection:
1. `docs/workflow/hermes-onboarding.md`
2. Task description
3. Relevant file excerpt (never the full `ui.js`)

### The key property

Because `docs/` files are committed to git, Obsidian always reflects the authoritative state of project documentation. Any AI session reading from `docs/` reads the same ground truth as the developer.

---

## What Obsidian does not replace

- `git log` — Obsidian does not track code changes.
- `prompts/qa-scenarios.md` — the active QA checklist lives in the repo.
- Your own judgment — Obsidian is a reading aid, not a decision system.

---

## NotebookLM Workflow

*Added 2026-05-25 — Phase 1 manual-bridge architecture. No MCP. No automation.*

### Role of NotebookLM in this architecture

NotebookLM is a **synthesis and orientation layer** — not a canonical source of truth, not a live code reference, and not a session tool for active development.

Use it to answer questions like:
- "What is the core philosophical claim of this project?" (grant writing, award applications, IRB)
- "What were the non-negotiable architectural constraints and why?" (re-entry after a long gap)
- "How do the projects I am working on connect thematically?" (cross-project synthesis, talks)

Do not use it for:
- Active coding sessions — use `SYSTEM_MEMORY.md` + Claude Code directly
- Debugging — use the code and tests
- Current project state — NLM sources are milestone-level snapshots, not live documents
- Anything where the answer is already in `SYSTEM_MEMORY.md`

**Canonical truth always lives in GitHub docs, Obsidian, and `SYSTEM_MEMORY.md`. NotebookLM is downstream of all three.**

---

### Phase 1 notebooks

| Notebook name | Purpose | When to use |
|--------------|---------|------------|
| `Tu Pana: Pedagogical Core` | Philosophical and pedagogical grounding | Grant writing, award applications, IRB rationale, faculty communication |
| `Tu Pana: Architecture & Design Decisions` | Sanitized architecture overview and design principles | Re-entry after a long gap, architecture orientation, new milestone planning |
| `Intellectual Projects: Cross-Domain Synthesis` | Thematic synthesis across projects (stub — unpopulated until needed) | Cross-project grant writing, invited talks, when project connections matter |

**Sources in each notebook are milestone-level documents.** They reflect the project at the time of the last upload, not the current commit.

---

### Token-maximization rules for NotebookLM

1. **One query per session maximum.** If you need more than one, your session is under-prepared — read `SYSTEM_MEMORY.md` more carefully before querying.
2. **One specific question per query.** No open-ended "summarize everything" requests.
3. **Extract only what answers the question.** Discard the rest of the NLM response.
4. **Distill into 2–3 sentences** before pasting into a context packet. Never paste a full NLM response block.
5. **Context packet cap:** NLM-derived content ≤ 800 tokens; total context packet ≤ 2000 tokens.
6. **Skip NLM entirely** when the gap since the last session is under two weeks — `SYSTEM_MEMORY.md` + `git log` is faster and more current.

---

### Export-staging workflow

Export packets (the files uploaded to NLM) live in two places:

1. **In the repo** — `docs/notebooklm-exports/` — version-controlled, visible in this vault, committed alongside code
2. **Local staging buffer** — `~/NotebookLM-Exports/[project]/` — date-stamped copies, local only, never committed

Before uploading anything to NotebookLM:
1. Review the file in the current session — do not assume it is current
2. Confirm it passes the forbidden-content checklist (see `docs/notebooklm-exports/README.md`)
3. Copy it to `~/NotebookLM-Exports/[project]/[name]-[YYYY-MM].md` as the upload buffer
4. Upload from the local staging folder, not directly from the repo

**Update export packets** after each Tier completion or before a high-stakes submission — not after routine sessions.

---

### Forbidden upload categories

Never upload to any NotebookLM notebook:

- Source code (`assets/js/*.js`, `assets/css/`, `server/`, `index.html`)
- Configuration files (`config.js`, any `.env` adjacent files)
- `SYSTEM_MEMORY.md` — dynamic, changes every session, high stale risk
- `docs/pilot/` — FERPA-adjacent pilot testing materials
- `docs/archive/` — describes old app versions, injects false history
- `docs/audits/` — internal process notes
- Agent instruction files (`agent-knowledge-*.md`, `agent-prompt-*.md`)
- Student writing samples, student names, or any student-identifiable information
- Unpublished manuscript text (book chapters, article drafts)
- Confidential institutional materials

---

### The one-way rule

**NotebookLM output is never copied directly into canonical docs.**

If a NotebookLM synthesis gives you an insight worth keeping, you write it yourself into the relevant canonical document (`docs/project-brief.md`, `docs/current-architecture.md`, etc.). The synthesis layer is downstream — information flows toward it, never back from it.

---

### Why a manual bridge before MCP

Phase 1 uses deliberate, manual exports rather than automated MCP retrieval for three reasons:

1. **Safety discipline.** Manually reviewing files before upload is the entire privacy and accuracy mechanism. Automation removes the review step.
2. **Stability.** NotebookLM does not have a stable official public API. Phase 1 assumes only the manual web interface.
3. **Learning what is worth automating.** After running Phase 1 for one or two milestones, you will know which queries recur and which exports need freshness. That is the right basis for deciding what Phase 2 automation should do — not a pre-emptive guess.

When a stable NLM API exists and you have identified what to automate, Phase 2 can slot an automated export step between the canonical sources and the NLM layer without restructuring anything.
