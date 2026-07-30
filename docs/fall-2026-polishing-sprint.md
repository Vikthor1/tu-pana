# Tu Pana Fall 2026 Polishing Sprint

**Branch:** `experiment/redesign-v1`  
**Status:** Implemented and locally verified  
**Purpose:** Reduce student friction without weakening Tu Pana's authorship,
critical-AI-literacy, or process-documentation commitments.

## Design decision

The ten-stage instructional engine remains the source of truth for prompts,
gates, saved work, reflections, reports, and genre-specific routing. The
student-facing shell now uses progressive disclosure:

| Visible phase | Internal stages | Student purpose |
| --- | --- | --- |
| Start | 1–6 | Develop ideas and write the protected first draft |
| Revise | 7–9 | Evaluate guidance, protect voice, and strengthen the work |
| Finish | 10 | Reflect, document AI use, and prepare the submission |

The existing detailed route remains available through **View path**, but is
collapsed by default. On phones, that control reveals one compact stage
selector instead of the full desktop route.

## First-visit experience

- Replaced the required manifesto → activity → laboratory sequence with one
  welcome card.
- Made **Start writing** the primary action.
- Kept the Five Questions laboratory as an optional three-minute guide.
- States the authorship contract before entry: the student writes and makes
  every change.
- States the storage model before entry: the draft stays in the current
  browser.
- Sends keyboard focus to the draft after the direct-start action.

## Data integrity

Added `tupana_onboarding_complete` so a student who chooses the direct path is
not falsely recorded as having completed the optional laboratory.
`tupana_lab_done` retains its original meaning and remains a backward-compatible
signal for returning students.

## Interface changes

- Added the three-phase progress indicator with current, completed, and
  accessible states.
- Changed the current-task label from a numbered milestone to the immediate
  writing focus.
- Gave the draft more horizontal space than the coach on desktop.
- Simplified the header and hid the redundant marketing subtitle.
- Added responsive first-visit and progress treatments for phone layouts.

## Preserved commitments

- Ten internal stages and all stage routing
- Stage 6 unassisted-draft authorship gate
- Stage 7 revision routing and Stage 8 voice protection
- Stage 10 process reflection and final packet
- Local export/import/clear behavior
- Assignment and genre-specific overlays
- Bilingual and translanguaging support
- Existing coach-governance rules

## Verification

- New polishing-sprint regression: 20/20
- Three-phase compatibility regression: 19/19
- Storage-key and round-trip audit: 13/13
- Full existing Tu Pana regression suite: passed
- In-app browser visual review: welcome and editor-first desktop experience
- Responsive assertions: 390 × 844 phone viewport, no horizontal overflow

No production deployment or VC-OS canonical-state edit is included in this
branch.
