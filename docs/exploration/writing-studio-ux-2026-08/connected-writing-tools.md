# Integrated Desk — Connected Writing Tools hardening

Base checkpoint: `dc52940ff73aca0aed03f6e791f5eabc13f9e193`
Status: bounded local exploration; no architecture promotion or production decision

## Before / after map

| Existing tool | Before this pass | Connected behavior after this pass |
|---|---|---|
| Moves | A genre Move could hold a durable student note beside the Draft. | A deliberately captured passage can open only the active genre's Moves. A saved student note keeps the exact quotation, paragraph, nearby before/after context, capture time, and Draft signature. Clicking a Move without writing saves nothing. |
| Ask Tu Pana | Passage, paragraph, and full-Draft requests had exact preview and consent. | When the selected passage has a linked Move note, the request may include that exact student note as optional framing. It is off by default, fully previewed, and the general passage-help path always remains. |
| Review Center / Council | Reports, decisions, Council history, and exact linked snapshots were reload-proof and revisitable. | A saved Move note can produce one quiet invitation inside Review Center. Report links from Evidence reopen saved records; neither route creates a new mock call. Council remains a separate, consented choice. |
| Evidence so far | Factual counts and Draft-history access were visible in the rail. | The same panel adds a progressively disclosed, filtered student reference for Move notes, Your Voice, decisions, review copies/comparison, and saved reviews. It is explicitly not a completion meter or activity timeline. |
| Your Voice | Exact student-selected language stayed local and could optionally be disclosed to a reviewer. | Exact entries are also findable in the Evidence reference, while preserving their student-defined meaning, genre provenance, and default no-transmission rule. |
| Snapshots / comparison | Exact snapshots, one review copy, and Before / Current comparison already existed. | Review-copy evidence links directly to the exact read-only copy and the existing humane comparison; no version dashboard or restore action was added. |
| Process Reflection / Finish | Factual evidence could support three student-authored responses. | On the first relevant Finish visit, meaningful student-created evidence may produce a dismissible, nonmodal invitation to Process Reflection. It writes nothing, infers nothing, and does not block Finish. |

Passage recovery never relies on character offsets alone. If the exact quotation still exists, the
reference says so. If only nearby context remains, it says the quotation may have changed. If
neither can be found, it shows the saved quotation without claiming a current location.

## Invitations and restraint

Invitations occur only after a student-chosen action and only in the artifact's natural home:

- saving a review copy keeps the existing optional second-look chooser and now offers **Not now**;
- saving a substantive Move note can reveal one invitation when the student later opens Review
  Center;
- reaching Finish with relevant student-created evidence can reveal one Process Reflection
  invitation.

Each new invitation is nonmodal, dismissible, and can be hidden for the current Draft. Dismissal
does not remove the underlying Focused Review or Process Reflection route. No invitation appears
while the student is actively composing, and none uses word count, time, or activity totals to claim
readiness.

## Deliberately rejected

- a fourth destination, new workspace, evidence dashboard, compliance timeline, streak, or score;
- a fragile inline-selection toolbar; the existing app-owned Passage Tray is reused;
- automatic Move-note creation, offset-only passage links, or navigation-as-evidence;
- automatic Move framing, prompt selection, review, Council run, Draft rewrite, or transmission;
- a generic banner, composition-time prompt, readiness inference, or forced second review;
- a version feed, restore/promotion control, improvement percentage, or quality ranking;
- AI-authored evidence or Process Reflection text;
- changes to themes, spellcheck, Edit, Help, I’m Stuck, primary navigation, genre pedagogy, or the
  Revision Cycle beyond the minimal connection points.

## Functional evidence

- Connected Writing Tools: `prototype_integrated_connected_tools_test.mjs` — **29/29 PASS**.
- Revision Cycle: **22/22 PASS**.
- Student Agency utilities: **27/27 PASS**.
- Integrated correction suite: **48/48 PASS**.
- Complete five-concept comparison: **238/238 PASS**.
- Unchanged selections rerun: R0 safety **29/29**, passage coaching **26/26**, storage isolation
  **13/13**, Voice Vault **28/28**, and genre leakage **30/30**.
- JavaScript syntax and `git diff --check`: PASS.
- Fresh 1440 × 960 English Integrated Desk: **185 visible words**, unchanged; plain Desk remains
  **168** in the comparative harness. Mandatory pre-writing actions: 0. Blocking entry
  interruptions: 0. Primary destinations: 3.

The focused suite covers exact multilingual bytes and provenance, no silent mock call, R0 sentinel
preservation, no external requests, 390 × 844 target/overflow behavior, keyboard/Escape, and
screen-reader names available to browser automation. Existing suites retain reduced motion and
local 200% reflow coverage.

## Open human-validation questions

- Does **Use a Move** in the Passage Tray feel helpful or make the tray too crowded on a physical
  iPhone above the real keyboard and safe area?
- Can a first-time student explain that the Move note is their planning reference and is not sent
  with passage help unless they choose it?
- After substantial revisions, do the exact/context/saved-only passage-link messages feel honest
  and useful rather than technical?
- Does **My writing evidence** feel like a personal reference, or like surveillance/compliance?
- Are the Review Center and Finish invitations timely, easy to dismiss, and quiet after dismissal?
- Can VoiceOver and other assistive technology distinguish passage actions, optional framing,
  evidence filters, and saved-report re-entry without losing Draft orientation?
- Do multilingual and culturally situated writers experience connection as voice support rather
  than pressure to explain or standardize language?
- Do representative students still experience self-review and instructor feedback as equally
  legitimate to mock AI and Council?

Physical-iPhone selection/keyboard/safe-area behavior, VoiceOver, founder and student comprehension,
live Gemini usefulness/failure behavior, and production migration remain explicitly open.

## Brief founder test script

1. In autobiography, select one culturally or linguistically meaningful synthetic passage and
   choose **Use a Move**. Save a note, revise text around the quotation, and find the note again.
2. Ask Tu Pana about the passage once through general help and once with the Move note explicitly
   included. Ask what would be transmitted each time.
3. Open **Evidence so far → Browse evidence**. Find the Move note, one Your Voice entry, one saved
   review, and a review copy without using browser history or generating new feedback.
4. Dismiss the Review Center invitation, keep writing, then reach Finish and dismiss the reflection
   invitation. Confirm that ordinary writing, self-review, Finish, and Council-free completion still
   feel legitimate.
5. Repeat the Passage Tray and Evidence tasks at 390 × 844 and on a physical iPhone.

Ask: **Did these connections appear when helpful and then get out of the way, or did they feel like
the product was monitoring and directing the writer?** Record comprehension and burden separately
from automated reachability.
