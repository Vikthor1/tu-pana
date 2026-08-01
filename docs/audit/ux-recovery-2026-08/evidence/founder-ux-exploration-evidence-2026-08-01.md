# Founder Physical-Device and Reflection Evidence — August 1, 2026

**Evidence type:** founder lived-experience observation on physical iPhone 17 Pro Max plus
inspection of the generated Process Report. This post-audit evidence supplements—but does not
alter—the original rendered-walk severity totals. It is binding input to the authorized UX
Exploration Window and does not approve implementation or a concept.

Canonical acceptance record:
[`../founder-r0-acceptance-2026-08-01.md`](../founder-r0-acceptance-2026-08-01.md).

## Protected strengths

- The admissions journey is substantially clearer and more effective.
- My Work communicates save status and the Process Note more calmly.
- Backup and destructive-data controls are progressively disclosed.
- Council, review choices, AI-coach prompts, and final-stage guidance remain strong.

These are protected strengths across Concept A, Concept B, and the simplified hybrid.

## P1: mobile passage coaching loses the intended selection

### Observation

On physical iPhone hardware, Send to Coach actions appear after text selection, but they are
positioned far above a passage selected near the bottom of a long draft. The student must scroll
upward. iOS commonly collapses the native selection during the scroll or reduces it to the final
word. This is an offscreen-action-placement and selection-state-preservation defect—not missing
functionality.

### Classification and release consequence

- Severity: **P1** under the audit rubric because a mobile core journey becomes unreliable.
- Status: **independent release blocker** after R0 acceptance.
- Evidence: physical iPhone 17 Pro Max, not viewport emulation.
- Scope: binding for comparative exploration; not authorization to reopen R0 or select an
  architecture.

### Required future behavior

1. Immediately capture the exact range and text when a nonempty selection is detected.
2. Present an app-owned persistent action bar inside the visible mobile editor, preferably fixed
   above the keyboard or at the bottom of the visual viewport.
3. Never require upward scrolling to reach passage coaching.
4. Preserve the captured passage if iOS collapses its native selection.
5. Keep the passage visibly highlighted or show a clear captured-text preview before transmission.
6. Offer **Review selected passage**, **Review current paragraph**, and **Review full draft**.
7. Keep full-draft sharing separate and explicit.
8. Provide **Cancel** and **Clear selection**.
9. If free-text selection cannot be consistently reliable, provide a dedicated tap-to-select-
   paragraph mode.

Do not depend on adding commands to iOS's native Cut/Copy/Paste menu.

### Binding acceptance requirements

1. On physical iPhone hardware, a student can select a paragraph near the bottom of a long draft
   and reach passage coaching without scrolling upward.
2. The complete intended paragraph—not merely the final word—is captured.
3. The exact passage is displayed before transmission.
4. Opening the action menu does not alter the draft.
5. Cancel leaves the draft unchanged.
6. The control remains visible above the mobile keyboard without obscuring the working area.
7. Labels are clear in English and Spanish.
8. The interaction is keyboard- and screen-reader accessible.
9. Existing consent, disclosure, voice-protection, and Council behavior remain intact.
10. Verification uses physical iPhone hardware, not only a simulated viewport.

## Reflection and report evidence

The current Process Report end-loads duplicative reflection after an already demanding drafting
and revision journey. An explanation of why reflection matters would help but would not resolve
the duplication. Exploration must test a shorter evidence-assisted model that:

- carries forward factual system evidence and existing student-authored reflections;
- surfaces actual Council, lens, and coach decisions for the student to select and discuss;
- never invents or prewrites student reasoning;
- requires approximately three high-value responses, with deeper reflection optional or
  instructor-configurable;
- offers Save and return later; and
- separates concise student reflection from an instructor-facing system-evidence appendix.

Exploration must also correct the report's truth inconsistencies: readiness versus partial
reflection, navigation versus completion, missing Council decisions, hardcoded institutional
framing, the false claim that draft text is absent, and report presence versus reflection
completion.

## Other revisable experience evidence

- Header Reset passed R0 but is redundant beside Settings / Danger Zone; explore one future
  deletion pathway.
- Focus Exit passed automated coverage when available; its mobile control was not visible in the
  founder check. Decide whether mobile Focus belongs in the selected experience rather than
  treating absence as proof that the handler failed.

## Exploration constraint

An architecture-neutral remedy may be evaluated if genuinely independent of the future model,
but this evidence does not authorize an R0 patch cycle. Any concept that cannot satisfy all ten
mobile acceptance requirements fails the exploration gate regardless of migration convenience.
