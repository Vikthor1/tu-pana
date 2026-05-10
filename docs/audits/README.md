# Audit Directory — Tu Pana de Escritura

## Purpose

Audit documents are point-in-time snapshots of the codebase taken before major workflow changes or integration milestones. They are not automatically triggered by any process — each is created deliberately before a scoped change that warrants a baseline record.

## What audits are for

- Record the state of the code at a meaningful checkpoint
- Surface discrepancies between documentation and actual code
- Identify data integrity issues before adding new features
- Give future AI sessions (and future contributors) a clear picture of what was known and when
- Preserve findings even after the underlying bugs are fixed

## What audits are NOT for

- A trigger to refactor or rewrite working code
- A to-do list that must be completed before development can continue
- A judgment on code quality — the codebase is production-stable; findings are maintenance notes
- Auto-generated output — each file is reviewed and approved before commit

## Stability principle

This project favors stability over elegance. Audit findings are categorized:
- **Must Fix** — data integrity issues or documentation that actively misleads
- **Should Fix** — low-risk improvements worth scheduling
- **Note / Monitor** — known quirks, not bugs; fix only if symptoms appear

Never treat a "Note / Monitor" item as a blocker.

## Naming convention

```
YYYY-MM-DD-<milestone-slug>.md
```

Example: `2026-05-09-pre-local-ai-audit.md`

The milestone slug names the event that prompted the audit, not the changes made during it.

## Reading an audit

Each audit names the exact file paths, line numbers, and constants observed at the time of writing. Code moves — treat line numbers as approximate pointers, not stable anchors. Always verify current state before acting on a finding.
