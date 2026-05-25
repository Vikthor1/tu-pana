# NotebookLM Exports — Upload Policy

This folder contains curated, NotebookLM-safe synthesis documents derived from canonical project sources.

**Canonical sources live in `docs/` and the project repo. These export packets are derived summaries — they do not replace the originals.**

---

## What this folder is

Files here are prepared specifically for upload to Google NotebookLM as grounding sources. They are committed to the repo so they are version-controlled and visible in Obsidian — but their purpose is outbound synthesis, not internal documentation.

Each file must be reviewed before upload. If a file has not been reviewed since the last major milestone, treat it as stale and update it before uploading.

---

## Files in this folder

| File | Derived from | Purpose | Status |
|------|-------------|---------|--------|
| `pedagogy-packet.md` | `docs/project-brief.md` | Philosophical and pedagogical grounding | Upload-safe |
| `architecture-packet.md` | `docs/current-architecture.md` | Sanitized architecture overview | Upload-safe |
| `session-digest.md` | Human-curated milestone summary | Project evolution and key decisions | Create after Tier 4 |

---

## Upload checklist (review before every upload)

Before uploading any file to NotebookLM, confirm:

- [ ] No API keys, tokens, or secrets
- [ ] No internal service URLs or endpoint addresses
- [ ] No student writing samples, names, or personally identifiable information
- [ ] No pilot testing materials or feedback form data
- [ ] No unpublished manuscript text
- [ ] No source code beyond brief illustrative snippets
- [ ] File was reviewed in the current session (not just assumed to be current)
- [ ] Frontmatter `Last updated` date is accurate

---

## Forbidden categories — never upload to NotebookLM

These categories are categorically excluded regardless of content:

- `assets/js/*.js` — source code
- `assets/css/styles.css` — source code
- `server/` — contains Cloudflare Worker and API configuration
- `config.js` — contains API URL configuration
- `docs/pilot/` — FERPA-adjacent pilot testing materials
- `docs/audits/` — internal process notes
- `docs/archive/` — describes older app versions; injects false history
- `SYSTEM_MEMORY.md` — dynamic local briefing, changes every session
- `docs/ideas/` — speculative, unvalidated
- Agent instruction files (`agent-knowledge-*.md`, `agent-prompt-*.md`) — internal prompt engineering
- Any Playwright test files or test output
- Any `.env`, backup, or pre-alignment files

---

## Refresh schedule

Update and re-upload these files:
- After each major Tier completion
- Before any grant application, award submission, or IRB filing
- When the pedagogical philosophy changes substantively (not cosmetically)

Do not update after every session. These are milestone-level documents, not session logs.

---

## Relationship to canonical sources

```
docs/project-brief.md          ──► pedagogy-packet.md       (curated synthesis)
docs/current-architecture.md   ──► architecture-packet.md   (sanitized overview)
[human-written quarterly]       ──► session-digest.md        (milestone summary)
```

If you find a discrepancy between a canonical source and an export packet, the canonical source wins. Update the export packet, not the canonical source.
