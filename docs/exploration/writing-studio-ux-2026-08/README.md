# Writing Studio UX Exploration — founder review guide

**Window:** `writing-studio-ux-2026-08`
**Fourth-prototype checkpoint:** `e8678738dfab6ef42992fc0c16aee1c46a87680c`
**Finalist starting checkpoint:** `4bf3ead00a39835871b75a9acf45f783f6bcef53`
**Bounded-correction starting checkpoint:** `90931c13b8e1c660e7ab4a33fe8fc4f8989dffb3`
**Status:** local comparative prototypes; no concept selected; no production implementation

## Run locally

From this worktree:

```bash
cd /Users/Victor1/Sites/tupana-writing-studio-exploration
python3 -m http.server 3001 --bind 127.0.0.1
```

Open <http://127.0.0.1:3001/explore.html>.

The comparison hub links all five concepts. The switcher at the top of every prototype makes
cross-concept movement one action. Each concept has one separate local-storage record:

```text
tupana-explore:writing-studio-ux-2026-08:desk:v1
tupana-explore:writing-studio-ux-2026-08:journey:v1
tupana-explore:writing-studio-ux-2026-08:hybrid:v1
tupana-explore:writing-studio-ux-2026-08:notebook:v1
tupana-explore:writing-studio-ux-2026-08:integrated:v1
```

The prototype does not enumerate, import, or read R0 `tupana_*` storage. Settings → Danger Zone
can export or delete only the active concept's synthetic record. Do not paste real coursework.

## Direct entry points

- [Comparison hub](../../../explore.html)
- [Draft-centered Desk](../../../explore.html?concept=desk)
- [Clarified staged journey](../../../explore.html?concept=journey)
- [Simplified hybrid](../../../explore.html?concept=hybrid)
- [Cuaderno y Borrador · Notebook & Draft](../../../explore.html?concept=notebook)
- [Integrated Desk · Finalist](../../../explore.html?concept=integrated)

When served locally, use the corresponding `http://127.0.0.1:3001/explore.html?...` URL.

## Founder comparison journey

Use a fresh concept or delete only that concept's data in Settings → Danger Zone before each
walk. Use the same synthetic text and assignment genre in all five.

1. Start with synthetic writing. In Notebook & Draft, begin with prewriting; in the other concepts,
   begin with the canonical editor or active artifact.
2. Paste synthetic writing and inspect the boundary warning. In Notebook & Draft, paste into one
   notebook card and verify that it is preparation, not a draft.
3. Add a distinctive synthetic sentence, leave for the comparison hub, return, and verify it.
4. Find the earlier artifact, version, review, or decision without using browser history.
5. Move forward and backward. In Notebook & Draft, choose **Write my draft** and verify that the
   canonical draft starts exactly empty while notebook material remains visible and recoverable.
6. On a phone, select a passage near the bottom of a long synthetic draft. Open the app-owned
   passage action without scrolling upward; compare selected passage, paragraph, and full draft;
   verify the exact preview; cancel; repeat and consent to mock coaching.
7. Request a focused review and identify what text and lens the mock reviewer received.
8. Convene the mock Council, return to writing, then revisit the saved Council report.
9. Accept, adapt, reject, or defer one suggestion. Verify that the decision is recorded without
   any automatic rewrite of the draft.
10. Complete the three required reflection prompts; leave the optional fourth blank; save and
    return once.
11. Open Finish, distinguish Save / Finish / Create packet / Backup / external Submit, confirm the
    exact included draft, and create the local packet. Compare student reflection with the separate
    instructor evidence appendix.

For Integrated Desk, repeat the complete path in two contrasting profiles. In the required
mixed-genre autobiographical path, choose or skip the concise knowledge-and-language lens, open a
Move, save a reference-only planning note, protect an exact multilingual phrase, use the visible
**Ask Tu Pana** action, open one contextual canonical Five Question, and save an
Accept/Adapt/Reject/Decide-later rationale. Inspect the autobiographical Council and Finish check.
In STEM, confirm that onboarding and autobiographical prompts are absent, Move guidance is
disciplinary, and unavailable Council configuration is stated plainly. Also inspect admissions,
SOP, and General Writing for zero autobiographical leakage, and verify that an unknown assignment
stops for explicit genre selection. At reload, compare the exact Draft, Move note, protected phrase,
reviews, decisions, rationale, reflection, Finish checks, versions, and packet.

At three points—after return, after Council, and after Finish—ask the student to answer without
help: Where am I? What am I doing? What happens next? What will this button do? Was my work saved?
Where is earlier work? How do I go back? How do I revisit review? What did AI contribute? What
decisions remain mine?

For the corrected Integrated Desk loop, run one Council, close the report, and choose **Revisit
report** from the rail. Confirm that it opens the saved report without consent or another run, then
find the separate **Convene again** action. Revise the Draft after feedback and inspect the linked
read-only prior snapshot; copying prior wording must not replace the active Draft. On a phone, use
the compact writing-project control to switch autobiography → STEM and recover an unknown genre.
In Settings, verify the quiet browser/device spelling explanation; native suggestion quality itself
still requires desktop and physical-iPhone observation.

For the bounded student-agency refinement, the Integrated Desk also keeps three quiet utilities
outside its primary destinations: compact in-session **Undo / Redo** plus an **Edit** menu on the
active writing field; **I’m stuck · Need one small next step?** in Review Center; and **Your Voice**
only after the student explicitly keeps selected wording. Undo is temporary editing control, not
durable snapshot restore. Your Voice stores exact student-selected text locally; it is not a quality
score and is included with a mock review only after a separate exact-text opt-in. The header’s
appearance icon cycles System / Paper / Dark; Settings exposes the same three choices and native
browser/device spelling preference. **Help** offers local-only Report a problem and Share feedback
previews; neither sends nor attaches writing.

For the bounded Revision Cycle, open **Review Center** and choose **Ready for a second look**.
Saving a review copy stores exact local text but never locks the live Draft or claims it is final.
Choose self-review, saved feedback, optional Tu Pana feedback, or the separately consented Council
where configured. Pick one revision only if useful, then compare the review copy with the current
Draft. On a phone, use the accessible Before / Current switch rather than a compressed split view.
The short revision note is optional; it contributes only factual evidence to Process Reflection.
**Keep revising** and **Finish for now** are equally valid exits.

### Founder revision-cycle test

With a short synthetic first draft, ask a founder or student to open Review Center and save a review
copy without coaching. Then ask: “What did that do—did it lock or judge my draft?” Have them choose
self-review, name one revision, make it, compare Before / Current, and choose either Keep revising
or Finish for now. Repeat once with an existing saved report and once on a phone. Observe whether
they can explain that feedback is optional, the exact copy is recoverable, their live Draft remains
the real work, and preservation of a multilingual or meaningful phrase feels supported rather than
treated as an exception. Record burden, pressure to use AI, and any confusion between review copy,
Finish, and submission; do not treat automated reachability as comprehension evidence.

## Evidence and results

- [Comparative evaluation](comparative-evaluation.md)
- [Append-only evidence checkpoints](evidence-checkpoints.md)
- [Verification results](verification-results.md)
- [Critical-AI-literacy traceability](critical-ai-literacy-traceability.md)
- [Autobiographical pedagogy traceability](autobiographical-pedagogy-traceability.md)
- [Culturally responsive genre comparison](culturally-responsive-genre-comparison.md)
- [Product-restraint review](product-restraint-review.md)
- [Integrated finalist falsification questions](integrated-finalist-falsification.md)

Automated local verification commands:

```bash
node prototype_exploration_test.mjs
node prototype_integrated_corrections_test.mjs
node prototype_integrated_agency_test.mjs
node prototype_integrated_revision_cycle_test.mjs
```

## Founder evidence governing the finalist

The founder classified Desk and Notebook as the two strongest concepts and provisionally preferred
Desk as the architectural foundation. Desk's Current Draft, Process Reflection, Finish, Review
Center, Evidence so far, and optional “Moves for this moment” were especially clear, including in
browser phone emulation. Notebook demonstrated the value of durable preparation beside the draft,
but added a top-level mental model and offered thinner guidance. The requested reversible synthesis
is Desk plus persistent notes attached to genre-specific Moves. The founder also found that the
green informational strip looked interactive even though it was not; Integrated Desk therefore
adds an explicit **Ask Tu Pana** action while keeping the strip informational.

This is founder evidence and a provisional preference, not architecture approval. Browser phone
emulation does not close physical-iPhone selection, keyboard, safe-area, visual-viewport, or
VoiceOver requirements.

Claude/Fable's independent package at
`/Users/Victor1/.codex/attachments/255c2074-8e12-4b1d-8074-be509c56aa65/pasted-text.txt`
is treated as design evidence only. Its Notebook recommendation is not a product decision. This
prototype uses the bounded exploration assumption that a pre-draft mock coach may discuss only
ideas already present in an explicitly previewed notebook-card payload and ask questions; it may
not generate draft prose, create a draft, or transfer notebook text. Draft review unlocks only after
the student creates the draft. This assumption is reversible and requires student evidence.

## Boundaries still open

- No physical-iPhone validation has occurred. Viewport emulation does not close the P1.
- No VoiceOver, NVDA, Safari/iOS keyboard, device-switch, or Brightspace exercise has occurred.
- No founder or representative-student comparison evidence has been gathered yet.
- Founder preference evidence exists, but unprompted founder comprehension of the integrated
  experience has not yet been tested.
- Mock AI is deterministic and local. It does not validate live-model tone, latency, or failure.
- Prototype storage is intentionally disposable and is not a migration implementation.
- Whether Notebook and Draft are distinguishable without facilitation, whether **Write my draft**
  is meaningful or obstructive, and whether optional cards recreate a treadmill remain open.
- Claude/Fable's equal-prominence bilingual recommendation is not adopted as doctrine. The current
  Spanish-primary coherent-density standard remains in the prototype; this disagreement is open.
- No deployment, family preview, Worker call, push, merge, production change, or VC-OS change was
  made.
