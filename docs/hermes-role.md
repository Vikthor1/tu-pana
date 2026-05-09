# Hermes Role — Tu Pana Development Workflow

## What Hermes is (in this context)

Hermes is a local orchestration layer that will sit between AI assistants (Claude, ChatGPT) and code-editing tools (Aider). It is not yet implemented. This document describes its *intended* role so that the architecture can be designed to receive it cleanly.

## The target workflow

```
Idea / Bug / Task
       │
       ▼
Claude or ChatGPT         ← writes plan, generates diff, identifies files
       │
       ▼
Hermes (local)            ← receives structured output, routes to Aider
       │
       ▼
Aider                     ← applies changes to the codebase
       │
       ▼
Git                       ← commits the result
```

## What Hermes will handle

- Receiving structured task descriptions from Claude/ChatGPT
- Routing tasks to the correct file(s) in the Tu Pana codebase
- Passing Obsidian project memory as context to the AI (so the AI knows the current state without re-reading all files)
- Enforcing constraints (e.g., "do not touch student-facing strings", "do not alter Stage 6 authorship gate")
- Logging what changed and why (audit trail that feeds back into Obsidian memory)

## What Hermes will NOT do

- Generate student content or alter the pedagogical logic
- Replace the AI assistant — it routes and enforces, it does not reason
- Touch localStorage keys or rename them
- Introduce new dependencies into the app

## Source of truth: JSON

The app's internal data (STAGES, TRANSITIONS, EVAL_QUESTIONS, etc.) is already expressed as JavaScript object/array literals in `data.js` and `ui.js`. These are the authoritative definitions.

For Hermes integration, these should remain as JS literals. If structured data extraction is ever needed for Obsidian notes or Hermes routing, serialize to JSON on demand — do not restructure the source files around a data format.

**TOON note:** TOON may later be explored as an optional JSON → TOON → LLM compression layer for reducing token cost when passing large data structures to the AI. This is exploratory. No TOON dependencies should be introduced into the app itself. The app must continue to function with zero TOON involvement.

## Obsidian integration

Obsidian will serve as long-term project memory — a human-readable, AI-consumable knowledge base that Hermes can reference when building AI prompts. Files in `docs/` are designed to be importable into the Obsidian vault with no modification.

Suggested Obsidian vault structure (not yet created):

```
Tu Pana/
  project-brief.md       ← mirrors docs/project-brief.md
  current-architecture.md
  hermes-role.md
  sessions/              ← per-session change logs
  decisions/             ← ADR-style records of significant choices
```

## What to prepare now (before Hermes exists)

1. Keep `docs/` files current — they are the seed of Obsidian memory.
2. Keep `prompts/qa-scenarios.md` updated as the app evolves — Hermes will use QA scenarios to validate changes before committing.
3. When making a change, note it in a session log (even a simple one) — Hermes will eventually automate this.
4. Keep the `.gitignore` allowlist current — Hermes needs to know exactly which files are canonical.

## Aider integration notes

Aider works best when given:
- The specific file to edit
- A clear, bounded task
- Context about what must not change

The module split (config / data / prompts / storage / ui / app) makes Aider targeting cleaner. A task that only affects coaching content goes to `prompts.js`. A task that only affects data goes to `data.js`. `ui.js` is large and should be edited with care — always specify the function name in the task description.
