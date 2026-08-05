# First-contact clarity and header cleanup checkpoint

**Date:** 2026-08-04  
**Plane:** `migrate/pedagogical-engine-2026-08`  
**Exact base:** `73cf7e4f4501a75709c9baa3289f1f1a6934a2f1`  
**Scope:** bounded clarity correction; no architecture, provider, storage, routing, Worker, or production change

## What changed

1. The brand header no longer renders the duplicate “Saved on this device” pill or a replacement badge. Save truth remains beside the active writing surface with `Saving…`, `Saved on this device`, and failure copy. That surface is now an explicit polite status region; the existing assertive failure region and backup route remain intact.
2. Review Center contains one closed-by-default comparison: Ask Tu Pana answers a specific question about a selected scope; Focused review uses one careful lens; the Council brings several perspectives to a developed draft. The copy says these are optional choices, not steps, and names self-review and outside/instructor feedback as equally valid.
3. Council consent still shows the exact payload, roles, student control, and `3 reviewer calls + 1 synthesis`; it now also says plainly that several calls take longer. No request kind, prompt, provider route, validation, persistence, or consent behavior changed.
4. Seven static profile-owned examples were added, one for each supported genre’s most cognitively demanding Move. They are closed by default, labeled as hypothetical structure, contain no insert/copy/send action, and end with an ownership cue.
5. Review Center, Move notes, Evidence, decisions, reports, Council, and draft-history surfaces no longer expose zero badges or numeric zero rows. Entry actions remain available. Counts reappear only after a genuine saved artifact exists.
6. Evidence now explains its contract affirmatively: it grows from student words, saved drafts, sources, and revision decisions—not simply from navigation.

## Feedback-choice copy

English:

- **Ask Tu Pana** — For a specific question about a passage, paragraph, or draft.
- **Focused review** — For one careful lens, such as structure, evidence, or voice.
- **The Council** — For several perspectives on a developed draft.
- These are optional choices, not steps. Reviewing it yourself or using feedback from an instructor or another person are equally valid.

Spanish:

- **Preguntar a Tu Pana** — Para una pregunta específica sobre un pasaje, párrafo o borrador.
- **Lectura enfocada** — Para una sola mirada cuidadosa, como estructura, evidencia o voz.
- **El Consejo** — Para varias perspectivas sobre un borrador desarrollado.
- Son opciones voluntarias, no pasos. Revisarlo por tu cuenta o usar comentarios de un instructor u otra persona son alternativas igualmente válidas.

## Move-example inventory

| Profile | Move | Static pattern |
|---|---|---|
| Mixed-genre autobiography | Connect memory to a larger force | chosen moment · larger force · bridge question · privacy boundary |
| College personal statement | Connect moment to insight | moment · shift · why it matters · privacy choice |
| Graduate statement of purpose | Pair claims with evidence | claim · evidence · reflection · forward link |
| STEM laboratory report | Link evidence to the claim | claim · data · reasoning · limitation |
| General Writing | Sketch a useful sequence | purpose · claim · evidence · complication · conclusion |
| CAP 200 service-learning | Connect community issue to a course concept | service observation · larger issue · verified course concept · connection to test |
| Research paper | Find patterns across notes | what I know · what a source says · tension · my interpretation · verify next |

Every pattern has complete English and Spanish data. Bilingual mode renders one disclosure/control with Spanish-primary paired copy. No example contains a fabricated source, citation, statistic, program fact, course, faculty member, quotation, or student history.

## Zero-state inventory

- Review rail: “Feedback is optional”; all three feedback actions and Review options & history remain reachable.
- Review Center tabs: labels remain; `(0)` badges are absent.
- Evidence rail: no zero rows; Browse evidence and Process Reflection remain reachable.
- Moves: no zero note badge; optional Move cards remain reachable.
- Versions, decisions, Council, Voice, and saved reports: no zero badge/table; their natural entry point remains.
- After a genuine record exists, its factual count and filtered record appear immediately and survive reload.

Navigation, panel opening, and example viewing still create no Evidence record.

## Density and interruption

Fresh English, 1440×960:

- prior branded checkpoint: **208** visible first-viewport words;
- corrected checkpoint: **205** visible first-viewport words;
- full-page gate: **≤498**, passed;
- primary destinations: **3**;
- mandatory actions before typing: **0**;
- blocking entry interruptions: **0**.

The comparison and examples are inside closed `<details>` elements and therefore add no fresh-state visible words. Removing the header save pill accounts for the net reduction.

## Verification

- First-contact suite: **48/48**.
- Branding/header suite: **45/45**.
- Connected Writing Tools: **30/30**, fresh viewport **205** words.
- Corrections: **47/47** after replacing its obsolete visible-zero assertion with the binding hidden-zero contract.
- Studio journey: **29/29** after targeting the pre-existing “Why this may help” disclosure explicitly rather than every `<details>` element.
- Complete battery: **57 suites / 1,851 checks / 0 failures** (55 unchanged suites passed in the stable full run; the two precisely updated suites passed on their final rerun).
- JavaScript syntax and `git diff --check`: pass.
- External requests from explanation/example checks: **0**.
- Live-provider calls in this pass: **0**; estimated provider cost **$0**.

Local screenshots (synthetic data only) were reviewed under `/private/tmp/tupana-first-contact-screenshots`: fresh first contact; Review Center before/after feedback; Evidence before/after; one example for every profile; 390×844 phone; Paper and Dark; English, Spanish, and bilingual. The settled Dark capture corrected an initial mid-transition screenshot artifact; computed and visual contrast were then rechecked.

## Evidence limits

The in-app browser connection was unavailable, so the visual evidence uses the repository’s established local headless-Chromium harness and local image inspection. It does not establish physical-iPhone selection/keyboard/safe-area behavior, VoiceOver or another physical assistive-technology session, representative-student comprehension, founder comprehension, or live-provider quality/latency/failure behavior.

## Deployment boundary

The pre-pass family preview deployment `b058711e-3658-44ba-9b28-8dd7258417fc` is preserved as the immediate rollback target. Earlier documented rollback targets remain:

- `ac390d62-4e4e-40fe-b6a0-51f6da1beab0` — live-AI readiness checkpoint;
- `f90ad8be-bd77-4c1f-87af-290d50745032` — pre-Studio R0 surface.

Deployment is permitted only after the final local checkpoint commit; no production deployment, Worker change, git push, merge, or architecture selection belongs to this pass.
