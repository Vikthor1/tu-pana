# Comparative evaluation — three Writing Studio concepts

**Shared prototype checkpoint:** `9e878e2`  
**Evidence level:** implemented local prototype + automated Chromium walkthrough; founder and
representative-student evidence pending

## Shared contract across all concepts

All three concepts use synthetic examples, deterministic mock AI, explicit pre-send consent, and
one isolated storage record per concept. None sends a network request. All preserve student prose
verbatim and record review choices without applying a rewrite. Every concept includes:

- visible location, current task, next action, save truth, and familiar Back/Continue movement;
- exact-text passage capture before native selection can collapse, with an app-owned action inside
  the current visual viewport;
- selected-passage, current-paragraph, and full-draft choices with distinct word counts, exact
  preview, Cancel, Clear selection, and consent;
- a Review Center for mock coach, focused review, Council history, and accept/adapt/reject/later;
- three required student-authored reflection prompts, one optional knowledge prompt, factual
  activity evidence, and no AI-authored reflective content;
- a deliberate Finish space separating quiet saving, packet creation, and external submission;
- exact final-draft confirmation plus separate student reflection and instructor evidence appendix;
- admissions, STEM, SOP, and neutral genre profiles, with no autobiographical fallback;
- English, Spanish, and Spanish-primary optional bilingual presentation;
- one Settings → Danger Zone deletion path scoped to the active concept only.

## 1. Draft-centered Desk

| Topic | Record |
|---|---|
| Core mental model | **One piece of writing, one desk.** The draft is canonical from the first word. |
| Navigation and artifact model | Two primary places—Desk and Finish. Pedagogical work is expressed as supporting move cards, review history, decision evidence, and local version facts around the draft. Supporting notes never become drafts or navigation destinations. |
| Removed or simplified | Ten student-facing destinations, per-stage editors, progress vocabulary, stage previews, a separate work hub, and chat as a notice board. |
| Audit root causes addressed | RC-1 is reduced by one movement model; RC-2 by keeping notices outside conversation; RC-3 by one canonical draft and isolated structured state; RC-4 by explicit genre profiles; report/reflection defects by evidence-assisted Finish. |
| Mobile behavior | Editor comes first; supporting panels follow. The app-owned captured-passage bar is fixed above the visual viewport bottom. **Mobile Focus is retained** because one editor remains the sole workspace; Exit and passage actions stay visible. |
| Bilingual behavior | ES and EN are full single-language modes. Optional bilingual mode uses Spanish-primary chrome and stacked ES/EN instructional guidance where it adds value, rather than duplicating every control label. Student text is never translated. |
| Protected strengths | Council plurality, progressive disclosure, admissions-specific guidance, disclosure, student decision ownership, Voice/identity emphasis, bilingual choice, exact final-draft confirmation, and typed deletion friction. |
| New risks | Move cards may become an unstructured pile; students may skip useful sequencing; a single draft can make experimentation feel risky unless versions become more visible; mobile Focus could reduce orientation if Exit fails to remain salient. |
| Migration implications | High. Existing stage artifacts would need a read-only, recoverable mapping into one canonical draft plus cards and snapshots. Prototype storage is not that migration. |
| Founder-test questions | Does “Desk” make the real work immediately obvious? Can a first-time student discover enough pedagogy without a prescribed route? Do move cards feel supportive or optional enough to ignore? Does mobile Focus help or hide too much? |
| Safety-contract result | Shared prototype walkthrough 98/98; unchanged R0 safety selection 277/277. No snapshot contract was weakened. Physical-iPhone item 10 remains open. |

## 2. Clarified staged journey

| Topic | Record |
|---|---|
| Core mental model | **Ten truthful steps, one visible spine.** Each step owns an artifact, while one marked version is explicitly current. |
| Navigation and artifact model | A ten-step list with Back/Continue, evidence-based completion marks, always-visible work rail, timestamps, and one current-version badge. Moving does not mark work complete. Review Center and Finish are re-enterable rather than stage-locked. |
| Removed or simplified | Competing phase/milestone vocabularies, stage-preview modals, hidden prior-work strips, heuristic final-draft choice, review as a single-stage event, and navigation-as-completion. |
| Audit root causes addressed | RC-1 gets one progress and movement grammar; RC-2 keeps review/status outside chat; RC-3 gains visible artifacts and current-version truth; RC-4 receives genre-configured lenses and Council roles. |
| Mobile behavior | Editor is first, ten-step path follows, and captured-passage actions stay in the viewport. **Mobile Focus is omitted** because hiding the step/version spine would weaken orientation; the ordinary mobile editor already has priority. |
| Bilingual behavior | Step names, orientation, actions, genre moves, review roles, reflection, Finish, and Settings respond immediately to ES/EN/both preference. Both is Spanish-primary, with secondary instructional guidance only. |
| Protected strengths | The full staged pedagogy, Council, progressive disclosure, admissions profile, review lenses, decision agency, disclosures, voice protection principles, and R0 trust gates. |
| New risks | Ten stops may still be too many; carried-forward step artifacts can still look like competing drafts; the current marker and work rail may add explanation rather than remove ambiguity; neutralized step names may feel generic in specialized genres. |
| Migration implications | Medium. Existing stage artifacts align conceptually, but completion evidence, timestamps, current-version marking, decision integration, and Finish truth require new data contracts. |
| Founder-test questions | Can a first-time student identify which box is the real/current work without explanation? Does the work rail solve ambiguity or add another system? Are ten steps calming when they are truthful? Does omitting mobile Focus feel like a loss? |
| Safety-contract result | Shared prototype walkthrough 98/98; unchanged R0 safety selection 277/277. No snapshot contract was changed. Physical-iPhone item 10 remains open. |

## 3. Simplified hybrid

| Topic | Record |
|---|---|
| Core mental model | **One draft through four purposeful phases.** The draft is primary; a smaller guide supplies the next useful moves. |
| Navigation and artifact model | Discover → Draft → Strengthen → Finish, familiar Back/Continue, one canonical draft, contextual moves beneath it, one Review Center, and one Finish space. Move notes are evidence, not alternate drafts. |
| Removed or simplified | Ten visible stages, per-stage editors, detailed work rail, multiple completion vocabularies, and a separate Focus mode. |
| Audit root causes addressed | RC-1 is reduced to four phases and one action grammar; RC-2 keeps AI activity in Review Center; RC-3 uses one canonical draft; RC-4 makes each phase's moves and lenses genre-aware; final report truth comes from actual state. |
| Mobile behavior | Editor first, phase strip remains horizontally reachable, moves stack below, and passage actions stay in viewport. **No separate mobile Focus exists**: the ordinary four-phase mobile workspace is designed as the focused state. |
| Bilingual behavior | Full ES/EN interaction and Spanish-primary optional bilingual mode. Phase names, genre moves, Review Center, reflection, and Finish switch immediately; student prose is byte-preserved. |
| Protected strengths | Council, guided sequencing, progressive disclosure, admissions and STEM genre correctness, agency, disclosure, voice protection principles, bilingual choice, and deliberate completion. |
| New risks | Four phases may be too broad to communicate the pedagogy; contextual moves might be overlooked; phase completion needs a stronger evidence definition; no explicit Focus may disappoint desktop students accustomed to it. |
| Migration implications | Medium–high. Stage artifacts must be reconciled into one draft plus move evidence, but the four-phase mapping could retain instructional analytics without exposing ten destinations. |
| Founder-test questions | Is four the right cognitive unit, or does a different count emerge? Do students understand when to use contextual moves? Does the hybrid feel coherent or like Desk plus a smaller stage bar? Is the normal mobile workspace focused enough? |
| Safety-contract result | Shared prototype walkthrough 98/98; unchanged R0 safety selection 277/277. No snapshot contract was changed. Physical-iPhone item 10 remains open. |

## Same-journey implementation coverage

| Task | Desk | Journey | Hybrid |
|---|---|---|---|
| Start / paste synthetic writing | Canonical editor | Active-step artifact + carry-forward | Canonical editor |
| Save, leave, return | Isolated draft record | Isolated artifacts + current mark | Isolated draft record |
| Find prior work | Version/evidence panel | Work rail + timestamps | Evidence panel |
| Back / Continue | Desk → Finish | Ten-step spine | Four-phase spine |
| Passage coaching | Shared captured-passage sheet | Shared captured-passage sheet | Shared captured-passage sheet |
| Focused review | Shared Review Center | Shared Review Center | Shared Review Center |
| Council / revisit | Shared genre-specific history | Shared genre-specific history | Shared genre-specific history |
| Act on suggestion | Shared decision grammar; never auto-rewrite | Same | Same |
| Reflection | Three required + one optional | Same | Same |
| Final packet | Exact canonical draft | Exact marked current artifact | Exact canonical draft |

## Founder decision should not yet be made

The automated comparison proves reachability and safety behavior, not first-time comprehension.
Founder testing, representative-student evidence, and physical-iPhone passage validation remain
required. Migration convenience and existing-test compatibility are recorded only as costs; they
are not evidence that the staged journey should win.
