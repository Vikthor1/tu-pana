# Executive Assessment — Writing Studio UX Recovery Audit

**Deliverables 1–2 · Baseline `84182d3` · Branch `audit/ux-recovery-v1` · 2026-07-31 → 08-01**

## The one-paragraph verdict

The pedagogy works and the parts are strong — the Council's output, the coaching stack's
safety rules, the revision-loop design, and a footer navigation spine whose genre-resolved
labels are truthful through stages 1–9 (with a registered Stage-10 terminal exception). What
fails is the *product around the parts*: four progress
vocabularies, five navigation paradigms, a chat column doing triple duty as notice board and
status system, dialogs that stack on dialogs (5 of 9 Continue presses in every genre walk were
intercepted by a celebration or checkpoint overlay), a save message that is false at nine of
ten stages, no canonical draft, work that silently cannot follow the student across devices,
and a bilingual model that renders both languages almost everywhere regardless of the
preference the app already stores. These are not label problems; they are the accumulated cost
of building features without an owner for the experience between them. A first-time student
cannot be expected to decode this — the founder's C2 verdict said exactly that, and this
audit's evidence (85 findings: 2 P0, 27 P1, 32 P2, 24 P3, tracing to 8 systemic root causes)
confirms it is structural, not cosmetic.

## What is working (protect these)

1. **The Council.** Founder-passed output quality; disclosure, corroboration, verbatim anchors,
   preserve-first framing, decisions row — the strongest single surface in the product.
2. **The footer label resolver.** 70/70 observations use the active genre's destination name;
   movement truth holds at 63/70 stage states (stages 1–9 in seven genres). The seven Stage-10
   controls self-point and remain UX-048; protect the resolver, not the terminal behavior.
3. **The safety rule stack.** Authorship gate, no-prediction admissions rules, moment-of-consent
   disclosures on full-draft/capstone/Council sends, genre-leakage guards: real, tested,
   load-bearing.
4. **Quiet autosave.** The indicator exists and tells the truth; persistence across refresh held
   in every walk probe.
5. **The genre copy contract** (own copy → it; layer active + missing → neutral; never another
   genre's voice) — the 2026-08-01 layer works where it was applied.

## What is broken (the shape, not the list — the register has the list)

- **Attention has no manager** (RC-6). Overlays are shown by opacity with no dialog authority:
  reflection checkpoints interpose over open previews, phase toasts sit on save confirmations,
  stage 10 arrives three overlays deep. This single cause produced the founder's "I needed help
  to understand it" moment more than any other.
- **The work has no home** (RC-3). Per-stage keys with no metadata, no canonical marker, a
  heuristic picking the packet's essay, an unconfirmed import that can overwrite newer work,
  and an origin-locked store that reads as total loss on a second device. This cluster owns the
  P0 import-overwrite path and several P1 work-integrity/trust hazards; the separate P0 Reset path
  is RC-7.
- **The truth layer leaks** (RC-1/RC-7). "First draft saved — Revision unlocked" at stage 1;
  checkmarks that mean "clicked past"; ES and EN halves of one button naming different
  destinations; a typing indicator that never stops. Each small; together they teach the student
  the app's words don't mean things.
- **The AI loop ends at "decide"** (RC-3/RC-6). Decisions don't reach the Process Note; verification
  is built but never called; re-entry affordances die on reload. The best surface (Council) is
  wrapped in the least continuity.
- **Bilingual is concatenation, not resolution** (RC-5). The preference exists; ~360 surfaces
  bypass it; the AI-literacy lab and tutorial are English-gated in a Spanish-default app; the
  language of decision moments ignores the choice.
- **Genre is content-deep, not structure-deep** (RC-4). The copy contract works, but Council
  profiles, report surfaces, tutorial routes, milestones, and word-gates still speak essay
  under layered genres.

## Why July's remediations didn't finish the job (and couldn't)

The five-finding and two-finding sprints fixed exactly what they scoped — the walks verify every
one of those contracts holding. But each was a bounded patch at a seam, inside a governance
model whose unit of work is the batch (see `vcos-governance-assessment.md` §2–3). The failures
above are cross-cutting *systems* (attention, storage truth, status truth, language resolution)
that no bounded batch was ever authorized to own. This audit is the first artifact authorized to
name them; the provisional Concept B specification demonstrates one coherent way to own them,
while A, C, and the simplified hybrid remain open candidates.

## Release-readiness recommendation

**NOT READY for any release activity — and formally: the C2 admissions-journey FAIL stands, now
with 85 catalogued reasons.**

- **SaaS Sprint 1: keep paused** (unchanged). No backend work, no provider decision pressure.
- **Sprint 0 B3–B7: keep queued.** Running the release battery against an experience this audit
  recommends restructuring would validate surfaces scheduled for replacement.
- **The family preview (son's admissions use): may continue** — his journey is the best-served
  genre (bespoke copy, Council enabled, tutorial), the safety stack is live, and his work
  survives (G2 invariant protects it through any approved implementation). Two behaviors worth
  a heads-up to him: save messages at early stages overstate what saved ("first draft saved"),
  and his work lives only in that phone's browser — an export now and then is cheap insurance
  (Mi trabajo → backup).
- **R0 (11 immediate safety/trust items)** is separable from the future-state direction: the
  founder may authorize it as an independent Tier-2 sprint ahead of a concept decision. It now
  covers the original seven items plus undisclosed `maniSentence` transmission, false save/unlock
  messaging, silent write failures, and interim final-draft confirmation.
- **Everything else waits for the founder's exit-condition rulings** (README §Exit condition).
  Concept B is a provisional candidate, not an approved implementation. After concept
  exploration and founder selection, only the selected direction receives an implementation
  roadmap; student rounds + founder lived test precede any release-readiness reopening.

## Confidence and limits

Code inventories and rendered walks corroborated each other everywhere they overlapped (and the
walks falsified two code-side beliefs — Continue at stage 10, "only stage 8" review gating —
which is why both methods ran). Mock-AI mode means live-Gemini tone/latency/repetition remains
manually unverified (validation plan §3.4). The tutorial walk is shallow (own suite covers it).
No student data was used; every observation is reproducible from `journeys/audit_walk.mjs`
against this branch.
