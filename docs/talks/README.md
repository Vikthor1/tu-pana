# docs/talks/ — Dissemination Layer

*Added 2026-05-25 — Phase 1 refinement. Part of the Tu Pana AI-assisted memory architecture.*

---

## Purpose

This folder holds **public-facing and presentation-facing derivative artifacts** — faculty talks, keynote segments, workshop scripts, outreach materials, and other rhetorical outputs produced for dissemination.

These files are generated downstream from the Phase 1 synthesis pipeline. They are not canonical architecture memory, and they are not NotebookLM upload sources by default.

---

## What belongs here

- Faculty talk segments and keynote scripts
- Workshop outlines and facilitation guides
- Conference presentation notes
- Outreach summaries for non-technical audiences
- Podcast-derived dissemination materials
- Student-facing onboarding guides and orientation materials
- Any public-facing rhetorical artifact about Tu Pana's pedagogy, design, or impact

---

## What does NOT belong here

| Do not put here | Where it lives instead |
|-----------------|----------------------|
| Canonical pedagogical docs | `docs/project-brief.md` |
| Architecture memory | `docs/current-architecture.md` |
| NotebookLM upload packets | `docs/notebooklm-exports/` |
| Session workflow templates | `docs/workflow/` |
| Design principles | `docs/decisions/` |
| Pilot testing materials | `docs/pilot/` |
| Raw SYSTEM_MEMORY briefings | Project root (local-only, never committed) |

---

## How this layer fits into the Phase 1 architecture

Information flows in one direction through the pipeline:

```
LAYER 0: Canonical docs
  docs/project-brief.md
  docs/current-architecture.md
  docs/decisions/architecture-principles.md
          │
          ▼ human-curated export
LAYER 1: NotebookLM synthesis
  docs/notebooklm-exports/pedagogy-packet.md
  docs/notebooklm-exports/architecture-packet.md
  docs/notebooklm-exports/session-digest.md
          │
          ▼ targeted query → grounded summary
LAYER 2: Claude rhetorical generation
  [session context packet + NLM grounding]
          │
          ▼ review and save
LAYER 3: Public-facing artifact  ←  YOU ARE HERE
  docs/talks/[artifact].md
```

**The arrow does not reverse automatically.**

A talk segment generated from NotebookLM synthesis and Claude rhetorical drafting is a downstream product. It captures a rhetorical moment — a particular framing for a particular audience. It is not a primary source of architectural or pedagogical truth. If a talk segment articulates something worth preserving as a canonical principle, that principle should be written directly into `docs/project-brief.md` or `docs/decisions/architecture-principles.md` by hand — not inferred backward from the talk.

---

## NotebookLM upload policy for this folder

**Do not upload files from `docs/talks/` to the operational notebooks by default.**

The two operational notebooks (`Tu Pana: Pedagogical Core` and `Tu Pana: Architecture & Design Decisions`) are grounded in primary sources. Uploading derivative rhetorical artifacts into them would create a feedback loop: synthesis generated from the primary sources would be re-ingested as if it were primary, inflating and distorting the notebooks over time.

**Exception — future dissemination notebook only:** If a dedicated `Tu Pana: Public Communication & Dissemination` notebook is intentionally created in Phase 2, selected talk files may be appropriate sources for that notebook. That decision requires deliberate review, not automatic upload.

**No recursive upload.** This applies to all artifact types in this folder — faculty talks, student guides, workshop scripts, and onboarding materials alike. No dissemination artifact should be uploaded back into an operational notebook regardless of how accurately it describes the project.

---

## File naming convention

```
YYYY-MM-DD-[short-slug]-[type].md

Examples:
  2026-05-25-tu-pana-ai-pedagogy-talk-segment.md
  2026-09-12-hostos-opening-keynote-draft.md
  2026-11-04-writing-center-workshop-script.md
```

---

## Canonical truth reminder

Files in `docs/talks/` are version-controlled and visible in Obsidian, but they are **derivative artifacts, not authoritative sources.** If a talk file and a canonical doc disagree about a project claim, the canonical doc is correct. Update the talk file; do not modify canonical docs to match rhetorical framing.
