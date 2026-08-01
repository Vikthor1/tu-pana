# Target Experience Principles — Tu Pana Writing Studio

**Deliverable 10 · Audit branch `audit/ux-recovery-v1` · Baseline `84182d3`**

These principles convert the founder's target ("calm, coherent, purposeful, predictable,
forgiving…") into behavior that can be designed to and tested against. Each principle has an
acceptance form — the observable fact that proves it holds. Vague verbs ("simplify," "polish")
are banned; every principle states what a student sees or can do.

## P1 — The ten questions are answerable on every screen, without help

At any point in any genre, on any device, in either language, a first-time student can answer:
where am I · what am I doing here · what should I do next · what will this button do · was my
work saved · where is my earlier work · how do I go backward · how do I return to my draft or
review · what did the AI contribute · what decisions remain mine.

**Acceptance form:** for every screen/state in the inventory, each of the ten questions maps to a
specific visible element (not a modal the student must open, not memory of a tutorial). A
screen/state with an unmapped question is a defect, severity ≥ P2.

## P2 — One thing asks for attention at a time

No stacked overlays; no coach message competing with a modal competing with a toast. Onboarding
is a sequence, not a pile. A spotlight, an offer, and a celebration never fire on the same
transition.

**Acceptance form:** at no reachable moment do two blocking surfaces intercept the same click;
automated walk asserts a single visible blocking layer per state.

## P3 — Movement and action are different vocabularies

Controls that move the student (back, continue, return to draft) look and speak one way,
consistently, everywhere. Controls that act on work (save, protect, review, export) look and
speak another. A student can predict "this takes me somewhere" vs "this does something" from the
control itself.

**Acceptance form:** the navigation map classifies every control as movement or action; no
control is both; labels state destination ("Continue to: Voice Polish") or effect ("Protect this
phrase") — never abstractions ("Manage," "Options," "Report").

## P4 — The draft is never lost, hidden, or ambiguous

There is one student-legible answer to "where is my work?" Work carries forward visibly; an
empty editor always explains itself when prior work exists; the current version is always
identifiable; nothing the student wrote is silently overwritten — by the app or by an import.

**Acceptance form:** every editor-empty state either truly has no prior work or displays the
prior-work affordance; every overwrite path (import, restore, carry-forward "bring") shows what
will be replaced and keeps a recoverable copy; refresh/return restores the exact working state.

## P5 — Saving is quiet; finishing is deliberate; destruction is distant

Automatic persistence is continuous and truthfully indicated. Reassurance ("is it saved?") costs
one glance. Backup/restore is available but out of the daily path. The end-of-process surface
(process note, packet, export, submission checks) appears only when the journey reaches it.
Destructive controls live behind explicit intent plus friction, never adjacent to routine
actions, and always offer a safety copy first.

**Acceptance form:** the save affordance at stages 1–8 contains zero submission, email, backup,
or deletion controls; the finish surface is reachable only by an explicit "prepare to finish"
act; clear-data offers an export in the same dialog.

## P6 — Show what the moment needs, hold the rest

Instructional content, AI-literacy teaching, review options, and advanced controls appear when
they first become useful, in units a student can absorb (progressive disclosure — collapsed,
contextual, or deferred). The screen a student writes on is dominated by their writing.

**Acceptance form:** measured visible-word budget per screen state (writing screen ≤ ~150 words
of chrome outside the student's own text; any modal ≤ ~250 words); everything removed from
first-view remains reachable within two acts, discoverably.

## P7 — The genre is the product, not a skin

A STEM lab report student, an admissions student, and an essay student each experience an app
that speaks their assignment's language in stage names, coaching, examples, reviews, and
process evidence. Missing genre content shows neutral scaffolding or an explicit configuration
notice — never another genre's voice.

**Acceptance form:** genre-by-stage matrix has no cell that silently inherits another genre's
copy; leakage guard tests stay green; a seeded config-gap renders the neutral fallback plus a
detectable (logged) config warning.

## P8 — One AI relationship: ask → hear → decide → revise → verify

Coach, passage help, focused lenses, and the Council are one escalating conversation with one
decision grammar (accept / adapt / reject — the student's call, always) and one memory: decisions
persist, reach the Process Note, and can be revisited; a review can be re-entered from wherever
the student is; what was sent to the AI is disclosed at the moment of sending, every path, no
exceptions; what the AI contributed is visible in the process record.

**Acceptance form:** every AI touchpoint feeds the same decision store; the last report is
reachable from every stage ≥ its creation; each send path has a moment-of-consent disclosure
naming what leaves the device; the Process Note renders AI contributions and student decisions
without manual reconstruction.

## P9 — Both languages are first-class; neither is homework

Bilingual support is a right of the product, but reading twice is not the price of using it. The
student chooses how language appears (Spanish-led, English-led, or both), the choice persists,
and every surface honors it — including dynamically built ones. Terminology is stable per
language across the whole journey.

**Acceptance form:** language preference applies to 100% of surfaces (measured by walk); on
matched app-owned copy, each single-language mode renders no more than 60% of the full bilingual
word count with no unintended duplicate translation. Optional bilingual first-view content stays
inside P6's absolute word budgets and introduces no marquee, overflow, or clipped control. A
terminology table (draft/borrador, save/guardar, review/revisión, stage names…) has exactly one
term per concept per language, verified against rendered output.

## P10 — Calm is measurable

Restraint in motion, color, and celebration: transitions under ~250ms, one accent color doing
one job, achievement moments that never block work. Error and offline states say what happened,
what survived (usually: everything — it's local), and the one next step.

**Acceptance form:** no blocking celebration overlays; every failure state in the inventory has
a what-happened + work-status + next-step message; motion audit lists zero transitions that move
content the student is reading.

## P11 — The phone is a real writing desk

The mobile layout is a designed experience, not a compressed desktop: writing, coaching,
reviewing, and finishing are all completable on a 390px screen with the keyboard up, with touch
targets ≥44px and no horizontal scroll.

**Acceptance form:** the full journey walk passes on mobile viewport for every genre; editor
remains visible and scrolled-to with virtual keyboard open; all controls reachable.

## P12 — Trust is earned by truth

Every status the app displays (saved, current version, review count, what was sent, what's left)
is computed from real state and is never optimistic, stale, or contradictory. If two surfaces
describe the same fact, they render from the same source.

**Acceptance form:** no status string is hard-coded where state exists; contradictory-state walk
(the C2 finding class) shows zero instances; stale data is labeled stale (the Council view-last
pattern generalized).
