# Comparative evaluation — five Writing Studio concepts

**Fourth-prototype checkpoint:** `e8678738dfab6ef42992fc0c16aee1c46a87680c`
**Evidence level:** implemented local prototype + automated Chromium walkthrough; founder and
representative-student evidence pending

## Shared contract across all concepts

All five concepts use synthetic examples, deterministic mock AI, explicit pre-send consent, and
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
- autobiographical, admissions, STEM, SOP, and neutral genre profiles in Integrated Desk, with no
  silent fallback; the earlier four concepts retain their existing explicit profiles;
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
| Safety-contract result | Shared four-concept walkthrough 155/155; unchanged R0 safety selection 277/277. No snapshot contract was weakened. Physical-iPhone item 10 remains open. |

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
| Safety-contract result | Shared four-concept walkthrough 155/155; unchanged R0 safety selection 277/277. No snapshot contract was changed. Physical-iPhone item 10 remains open. |

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
| Safety-contract result | Shared four-concept walkthrough 155/155; unchanged R0 safety selection 277/277. No snapshot contract was changed. Physical-iPhone item 10 remains open. |

## 4. Cuaderno y Borrador · Notebook & Draft

| Topic | Record |
|---|---|
| Core mental model | **Two kinds of work: think in a notebook; write one draft.** Genre-shaped preparation remains distinct from the student-authored canonical draft. |
| Navigation and artifact model | Three stable places—Notebook, Draft, and My Work. Notebook cards are suggested and skippable; evidence appears only when text exists. **Write my draft** creates one empty canonical draft. Notebook reference, dated snapshots, and Review Center stay one action away. |
| Removed or simplified | Universal ten-stage pre-draft buffers, competing stage drafts, automatic notebook assembly, navigation-as-completion, draft review before authorship begins, and a separate mobile Focus mode. |
| Audit root causes addressed | RC-1 receives two named work types and stable movement; RC-2 keeps coach/review history in Review Center; RC-3 uses one canonical draft plus visible, non-competing preparation; RC-4 uses structurally different cards for admissions, STEM, SOP, and neutral genres. Finish and reflection report only factual state. |
| Mobile behavior | Draft receives priority. Desktop notebook reference is not compressed; Notebook remains a stable one-action tab that preserves text and orientation. The app-owned Passage Tray remains fixed within 390 × 844. **No separate mobile Focus exists.** Physical-iPhone selection and keyboard behavior remain open. |
| Bilingual behavior | Full EN, ES, and Spanish-primary optional bilingual modes. Student text is unchanged. Claude/Fable's equal-prominence Dual recommendation is recorded as an open disagreement, not adopted doctrine. |
| Protected strengths | Council plurality, progressive disclosure through optional cards, admissions guidance, genre correctness, explicit consent/payload preview, student decision ownership, disclosure, voice/authorship protection, reflection separation, privacy, and typed deletion friction. |
| New risks | Students may confuse Notebook and Draft, put finished prose in Notebook or planning notes in Draft, experience **Write my draft** as a gate, treat suggested cards as compulsory stages, or lose draft context when opening Notebook on a phone. The pre-draft coach boundary may be too restrictive or too subtle. |
| Migration implications | High. Existing stage artifacts would need a separately governed read-only classification and recovery design. This prototype does not infer which material is notebook versus draft, transfer any real text, or implement migration. |
| Founder-test questions | Can students name the difference without instruction? Can they draft directly without feeling punished? Is **Write my draft** meaningful or obstructive? Does phone reference preserve orientation? Is novice scaffolding more discoverable than Desk and conceptually clearer than Hybrid? Is the real work more obvious than in Journey? |
| Safety-contract result | Four-concept walkthrough 155/155; exact notebook-to-draft non-transfer, isolated origin storage, R0 sentinel preservation, no external request, 390 × 844 geometry, and unchanged R0 selection 277/277 passed. No physical-iPhone claim is made. |

The bounded pre-draft coach rule is an exploration assumption: after exact payload preview and
consent, mock coaching may discuss only ideas already in the active card and ask questions. It may
not write draft prose, create a draft, or transfer text. Draft-level review begins only after the
student creates the canonical draft. This is reversible and requires student evidence.

## 5. Integrated Desk · Finalist

| Topic | Record |
|---|---|
| Core mental model | **My essay lives in the Draft. Moves and notes help me think.** One canonical Draft remains home; durable Move notes are reference-only supports, not a Notebook destination or alternate draft. |
| Navigation and artifact model | Desk's three primary places—Current Draft, Process Reflection, Finish—remain. Beside the Draft are optional genre Moves with persistent notes, Review Center, and Evidence so far. A visible **Ask Tu Pana** action opens passage/paragraph/full-draft disclosure; deeper history stays in Review Center. |
| Removed or simplified | No ten-stage corridor, Notebook top-level place, critical-AI destination, culture destination, coach column, chat notice stream, mandatory Move order, navigation completion, repeated disclosure wall, or automatic transfer/rewrite. One concise autobiographical-only knowledge-and-language onboarding is inline and revisitable. |
| Audit root causes addressed | RC-1 keeps one Draft and one primary movement grammar; RC-2 routes AI history to Review Center and makes coach access actionable; RC-3 persists notes, protected phrases, versions, decisions, and exact Draft state without competing drafts; RC-4 contrasts the canonical mixed-genre autobiographical profile with disciplinary STEM, keeps General neutral, and stops unknown ids rather than falling back. |
| Mobile behavior | Draft is first; optional supports stack below rather than compressing a split view. Ask Tu Pana remains adjacent to the editor. Passage Tray uses `visualViewport` and safe-area offsets. Focus is retained because only one canonical Draft exists; Exit and Passage Tray remain available. 390 × 844 emulation, target geometry, reduced motion, and local 200% text reflow passed. Physical iPhone and VoiceOver remain open. |
| Bilingual behavior | English-only and Spanish-only modes reduce density by replacing chrome rather than duplicating it. Optional bilingual mode keeps Spanish-primary chrome and adds secondary instructional text selectively. Student prose, notes, and rationales are never translated. Equal-prominence dual language remains an open Claude/Fable disagreement. |
| Protected strengths | Immutable R0 authorship/privacy/trust contracts; canonical Five Questions; Council plurality where configured; explicit purpose/reviewer/call count/payload/consent; critical judgment at authentic decisions; student rationale; culturally grounded and translingual voice; three required reflections; separate factual appendix; exact final-draft confirmation; isolated deletion. |
| New risks | Added Move explanations, onboarding, and critical prompts may restore density; notes may be mistaken for mini-drafts or a hidden Notebook; cultural relevance may feel imposed; Ask Tu Pana may still be missed; rationale may feel like homework; contextual Five Questions may be ignored; Focus may hide useful references. |
| Migration implications | High and unimplemented. Existing stage work would require separately authorized classification and recovery. The prototype does not read, infer, import, merge, or migrate real R0 work. |
| Founder-test questions | Is the Draft still unmistakable? Do notes remain one supporting mental model? Is coach access clearer? Is autobiographical onboarding relevant and skippable? Does contextual critical AI deepen judgment without fatigue? Does STEM remain free of autobiographical leakage? Is phone use understandable without facilitator explanation? |
| Safety-contract result | Five-concept automated journey 238/238 after the autobiographical and ordinary-path checks; unchanged R0 safety selection 277/277. Automated reachability is not comprehension evidence. |

### Principal comparison: Integrated Desk versus plain Desk

Plain Desk is the lower-density reference: three optional Move cards, Review Center, and factual
Evidence around one Draft. Integrated Desk adds durable Move notes, a concise relevant-genre
onboarding, explicit coach action, pre-send purpose/reviewer/call facts, one contextual canonical
critical prompt, and optional student rationale. It deliberately does not add another primary place.

The finalist is falsified if those additions make the Draft less obvious, create a compulsory
planning corridor, repeat disclosure content, turn AI reflection into a questionnaire, or make
mobile support obscure writing. It is supported—not proven—if novice testers can still say “my
essay lives in the Draft,” discover notes when useful, find coaching without mistaking the status
strip for a control, and explain an AI decision without facilitator instruction.

## Same-journey implementation coverage

| Task | Desk | Journey | Hybrid | Notebook & Draft | Integrated Desk |
|---|---|---|---|---|---|
| Start / paste synthetic writing | Canonical editor | Active-step artifact + carry-forward | Canonical editor | Genre-shaped notebook card with boundary warning | Canonical editor; optional genre lens and Moves never block drafting |
| Save, leave, return | Isolated draft record | Isolated artifacts + current mark | Isolated draft record | Separate isolated notebook entries + canonical draft | Isolated Draft + genre-keyed Move notes + ledger state |
| Find prior work | Version/evidence panel | Work rail + timestamps | Evidence panel | My Work + notebook cards + dated draft snapshots | Planning reference + Review Center + Evidence + dated versions |
| Back / Continue | Desk → Finish | Ten-step spine | Four-phase spine | Between skippable cards; Notebook ↔ Draft does not change evidence | Draft → Reflection → Finish; Move navigation never becomes completion |
| Create canonical draft | Exists from first word | Stage-owned artifact model | Exists from first word | Explicit empty draft; no notebook transfer | Exists from first word; notes never transfer |
| Passage coaching | Shared captured-passage sheet | Shared captured-passage sheet | Shared captured-passage sheet | Same, after student creates draft | Same + visible Ask Tu Pana and purpose/reviewer/call facts |
| Focused review | Shared Review Center | Shared Review Center | Shared Review Center | Same, after draft boundary | Same + one contextual canonical critical prompt |
| Council / revisit | Shared genre-specific history | Shared genre-specific history | Shared genre-specific history | Same, reload-proof after draft boundary | Saved history; autobiographical connection/evidence/voice roles configured, STEM unavailable explicitly |
| Act on suggestion | Shared decision grammar; never auto-rewrite | Same | Same | Same; notebook and draft text remain unchanged | Same + optional student rationale and traceable source/scope/prompt/version |
| Reflection | Three required + one optional | Same | Same | Same + separate notebook/draft factual evidence | Three required + genre-appropriate optional knowledge prompt; factual ledger aid |
| Final packet | Exact canonical draft | Exact marked current artifact | Exact canonical draft | Exact canonical draft; notebook is not silently included | Exact canonical Draft; notes excluded; separate reflection and appendix |

## Direct comparison and falsification questions

- Against Desk / Una Página simplicity: does Notebook preserve materially more novice scaffolding,
  or does its second work type merely add confusion to an otherwise obvious real draft?
- Against Hybrid's four-phase guidance: does the Notebook/Draft distinction create more conceptual
  clarity, or are broad phases easier to predict and navigate?
- Against Journey's ten-stage control: does Notebook retain useful preparation while making “Where
  is my real work?” substantially easier, or do its cards recreate the same treadmill?

Founder and representative-student testing must try to falsify, not confirm, the concept:

- Do students confuse Notebook and Draft?
- Do they put finished prose in Notebook or planning notes in Draft?
- Does **Write my draft** feel meaningful or obstructive?
- Does the Notebook recreate a compulsory stage treadmill?
- Can students begin drafting directly without being punished?
- Is notebook reference usable on a phone without obscuring the draft?
- Does the model preserve more useful novice scaffolding than Desk?
- Does it provide more conceptual clarity than Hybrid?
- Does it outperform Journey on “Where is my real work?”

## Founder decision should not yet be made

The automated comparison proves reachability and safety behavior, not first-time comprehension.
Founder testing, representative-student evidence, and physical-iPhone passage validation remain
required. Migration convenience and existing-test compatibility are recorded only as costs; they
are not evidence that the staged journey should win.
