# Tu Pana Fall 2026 Polishing Sprint

**Branch:** `experiment/redesign-v1`  
**Status:** Implemented, verified, and Worker capacity deployed
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

## Passage coaching and long-form reliability

- Raised the Gemini proxy prompt ceiling from 32,000 to 128,000 characters.
  This preserves an abuse-protection boundary while accommodating the graduate
  Statement of Purpose instructions plus long-form student writing.
- Added a precise `prompt_too_large` error category for the exceptional request
  that still exceeds the new ceiling.
- Replaced the two-step selection transfer with a contextual passage toolbar.
  **What works** now unambiguously identifies an existing strength, while
  **Strengthen**, **Clarity**, and **Voice** send distinct authorship-safe
  coaching requests immediately.
- **Ask…** carries the selected passage into the chat composer as a visible,
  removable context chip. The student types only the question.
- Added one mandatory whole-passage reading contract across the autobiographical
  mixed genre, service learning, research paper, STEM, college admissions, and
  graduate SOP layers. The coach must account for later sentences, avoid asking
  for information already present, distinguish sentence- from passage-level
  problems, and state the rhetorical purpose of any opening-focused advice.
- Directly pasted multi-sentence writing inherits the same system-level
  whole-passage rule, even when the student does not use the contextual toolbar.
- Every passage-analysis request now uses full Gemini Flash at any stage.
  The Worker disables hidden thinking for this request type and provides a
  1,536-token completion ceiling so visible coaching finishes cleanly.
- Quick-action user messages show the intent and a short excerpt; internal
  coaching instructions are not exposed as clutter in the conversation.
- The contextual toolbar fits within a 390-pixel phone viewport.

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
- Passage-coaching regression: 25/25, covering every current genre layer
- Gemini Worker regression, including long-form capacity and passage response
  completion: 22/22
- Three-phase compatibility regression: 19/19
- Storage-key and round-trip audit: 13/13
- Full existing Tu Pana regression suite: all 29 test files passed
- In-app browser visual review: five-action desktop toolbar is clear and balanced
- Responsive assertions: 390 × 844 phone viewport, five 44-pixel actions, no
  horizontal overflow

The Gemini Worker capacity update was deployed on 2026-07-30 and verified
against the public endpoint with a synthetic 40,000-character request. The
passage-analysis completion profile was deployed as Worker version
`5284786b-34fc-40e6-bd84-19ae96c697c0` and returned a complete,
non-truncated live response. The
student-interface changes remain on `experiment/redesign-v1` for review before
the Fall release is merged.
