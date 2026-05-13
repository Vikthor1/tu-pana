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
