# Tu Pana — Current Development Workflow

*Last updated: 2026-05-09*

## The actual workflow (right now)

This is a solo-developer project. The workflow is intentionally minimal.

### Before starting a session

1. Read `docs/current-architecture.md` if you haven't touched the code in a while.
2. Run `git status` — confirm the working tree is clean.
3. Start a local server: `python3 -m http.server 8000`

### During a session

- Edit files directly in your editor or via Claude Code.
- Test changes in the browser as you go.
- Reference `prompts/qa-scenarios.md` for structured verification.
- Commit small, logical units — not hour-long batches.

### Before pushing to main

Run `docs/releases/release-checklist.md`. Every time, no exceptions.

### Deployment

```bash
git push origin main
```

GitHub Pages deploys automatically. No build step, no CI, no Actions.

---

## AI collaboration (current)

Claude (Claude Code) is the primary AI tool. Pattern:

1. Describe the task clearly. For `ui.js`, always specify the function name.
2. Review the diff before accepting.
3. Test the change manually.
4. Commit.

ChatGPT is a secondary tool — useful for alternative perspectives or when Claude context is saturated. See `docs/workflow/ai-roles.md` for the full breakdown.

---

## What is NOT active yet

- **Hermes** — not installed. Design: `docs/hermes-role.md` and `docs/workflow/hermes-onboarding.md`.
- **Aider** — not installed. Preparation notes: `docs/workflow/aider-prep.md`.
- **Obsidian** — not yet configured. Setup plan: `docs/obsidian-workflow.md`.

---

## What must be updated after any significant change

| Changed | Update |
|---------|--------|
| File map, globals, or localStorage keys | `docs/current-architecture.md` |
| New UI component or stage behavior | `prompts/qa-scenarios.md` |
| New file that should deploy to GitHub Pages | `.gitignore` allowlist |
