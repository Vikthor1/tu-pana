# Interactive Quick Tour — 2026-08-05

**Base:** `6fd979f0f7bec6decf7972149379999a60541545` (first-contact clarity checkpoint; clean).
**Scope:** one optional, isolated onboarding layer. No change to navigation, pedagogy, routing,
provider configuration, prompts, validation, consent, storage schema, or any real record.
**Live AI calls in this pass:** 0.

## Core promise (rendered in the tour's closing moment)

> Strong writing grows through choices: what to develop, what feedback to use, what language to
> protect, and when to revise. Tu Pana helps you practice those choices. The writing remains yours.

Rendered as: **"Tu Pana supports the process. You remain the writer."** with each moment carrying
one concrete "why this helps" line. The tour claims no grade effect, no guaranteed improvement, no
authorship detection, no plagiarism prevention, and no demonstrated learning outcome.

## Architecture decision

The tour runs as **one bounded demonstration dialog**, not as spotlights over the live interface.
Spotlighting the real Studio would have to point at the student's own draft and real controls,
which conflicts with the hard requirements that the tour never display or touch real writing and
never create real records. The demonstration layer instead carries its own genre-appropriate
excerpt, is labeled on every moment, and vanishes completely on exit. Interactions are real
(reveal, select-and-keep, choose, decide, compare) — only the material is synthetic.

## Entry behavior

A quiet, non-modal card renders **inside the editor panel, below the editor** (verified: its top
edge is at or below the editor's bottom edge, so it never covers the writing surface):

> **Meet your writing desk**
> Take a one-minute tour of how Tu Pana helps you develop, review, and revise your own writing.
> [Take a quick tour] [Not now]

It appears only when the writing project is configured, no work exists, and the student has not
already answered. "Not now" dismisses immediately, preserves the empty draft, records the
dismissal locally, and never re-prompts. Existing writing, snapshots, reviews, Council runs,
evidence, or an applied legacy import all suppress it. The tour stays available from **Help →
Take the quick tour**.

**Measured density effect: zero.** Fresh English 1440×960 reads **205 visible first-viewport
words with the card present** — identical to the documented first-contact baseline — because the
card sits below the fold. Dismissal returns the identical 205.

## The six moments

| # | Title | Interaction | Truthful boundary stated |
|---|---|---|---|
| 1 | Your draft stays at the center. | Reads the labeled demonstration excerpt | Saving is local; nothing is sent unless asked |
| 2 | Moves offer a way into the work. | Reveals what one genre Move asks | A Move note stays yours and never enters the draft on its own |
| 3 | You decide what sounds like you. | Selects text (or the suggested phrase) and keeps it | Tu Pana does not judge authenticity; kept wording is exact, local, and reaches AI only by later choice and consent |
| 4 | Choose only the feedback you need. | Chooses Ask Tu Pana / Focused review / Council | Each shows what the real consent step *would* display; optional choices, not steps; self-review and instructor feedback equally valid |
| 5 | Feedback becomes useful when you judge it. | Accept / Adapt / Reject / Decide later | Recorded in the demonstration only; the draft is unchanged and nothing entered the real record |
| 6 | Writing grows through another look. | Before / Current comparison | No score, grade, or improvement claim; you read the difference |

Every moment offers **Back, Next, Skip tour**, and close; moment six offers **Start writing** and
**Explore on my own**. A quiet `1 of 6` orients without implying obligation.

**Measured length:** 573 rendered English words across all six moments — about **60–90 seconds at
a scanning pace** (headline, skim, interact), or roughly two minutes if every word is read
linearly. Around a quarter of that total is the demonstration excerpt and sample recommendation,
which are manipulated rather than read. Copy was trimmed once against an initial 635-word draft;
no truthful boundary was removed in the trim, only wording.

## Genre adaptation

One shared architecture; each profile supplies `tourExample` (excerpt, an exact phrase inside it,
the Move to feature, a synthetic recommendation, and a before/current pair). Future genres supply
tour-safe data through the profile without touching tour code.

| Profile | Featured Move | Demonstration focus |
|---|---|---|
| Mixed-Genre Autobiographical Essay | Connect memory to a larger force | A chosen library moment and a translingual phrase; invitational, never compulsory |
| College Personal Statement | Connect moment to insight | A signup-sheet realization; no trauma, no fabricated life story |
| Graduate Statement of Purpose | Pair claims with evidence | Concrete work the writer did; evidence-grounded |
| STEM Laboratory Report | Link evidence to the claim | A measurement plus a stated limitation |
| CAP 200 Service-Learning Report | Connect community issue to a course concept | The writer's own shift notes; no invented service |
| Research Paper | Find patterns across notes | Two sources in tension; **no invented citation, author, or DOI** (suite-asserted) |
| General Writing Project | Sketch a useful sequence | A neutral library-hours argument |
| Unknown assignment | — | No welcome card; Help replay explains the project is not configured and points to Settings. **Never inherits autobiography** (suite-asserted). |

## Isolation proof

- Only two localStorage keys ever exist: the Studio record and `tupana-studio:tour:v1`, which
  holds a version plus dismissal/start/completion timestamps and no student data.
- The Studio record is **byte-identical** before and after: every interaction, full completion,
  skip, close, and mid-tour reload (reload compared with the Studio's own `savedAt` normalized,
  since its beforeunload save is pre-existing behavior).
- After a full tour: zero Move notes, Voice entries, decisions, reviews, Council runs, versions;
  reflection, Finish checks, and packet state untouched; Finish readiness unchanged.
- Zero external requests across the entire suite, including the simulated AI moments.
- `studio-tour.js` contains no `fetch`, no provider reference, and no reference to the canonical
  state key.

## Verification

`studio_tour_test.mjs` **62/62**, covering all sixteen required conditions: entry condition,
non-blocking placement, "Not now", local memory, no repeat prompt, Help replay, existing- and
imported-work suppression, record isolation across every path including mid-tour reload, no
network, unmistakable demonstration labeling, seven genres with cross-genre leakage guards, no
invented sources, unknown-assignment handling, English/Spanish/bilingual completeness, dialog
semantics, focus movement and live announcement per moment, Back/Skip/Escape, reduced motion,
390×844, 44px targets, 200% reflow, dark appearance, unaffected evidence surfaces, restored
density, and no fourth destination.

Screenshots reviewed: fresh desktop and mobile entry, all six moments, dark, Spanish, bilingual
(before and after a control-label refinement), mobile moments, STEM and admissions examples,
reduced motion, unknown assignment, and return to the untouched desk.

Two harness artifacts were corrected during verification rather than accepted as product results:
clicking a below-fold control makes the harness scroll the page (density is therefore measured on
load, in steady state), and a record edited in a live page is overwritten by the Studio's own
beforeunload save (the imported-work fixture is injected through an init script instead).
