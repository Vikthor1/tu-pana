# Founder R0 Acceptance Record — August 1, 2026

**Status: PASS-with-concerns.** This is a documentation-only post-audit addendum. It does not
amend the R0 product commit, approve a future UX architecture, begin exploration, or lift the
Writing Studio release block.

## Deployment identity

R0 commit `1462aea172b89013d3ea7d70a0c933cba856737e` was pushed and deployed only
to the bounded Cloudflare family preview at <https://tupana-preview.pages.dev>.

| Fact | Verified value |
|---|---|
| Cloudflare deployment | `f90ad8be-bd77-4c1f-87af-290d50745032` |
| Cloudflare source metadata | `1462aea` |
| Static-file identity | All 19 user-facing files byte-identical to the authorized commit |
| Production GitHub Pages | Not modified or deployed |
| Shared production Worker | Not redeployed |

The preview returned HTTP 200 for the app, admissions tutorial, and R0 UI asset; the admissions
query string was preserved; and the existing Worker returned a successful, non-mutating CORS
preflight for the preview origin. Earlier statements that R0 was local, unpushed, or undeployed
are superseded by this dated record.

## Founder physical-device spot check

| Check | Result | Founder evidence |
|---|---|---|
| A1 — English mobile task instruction | **PASS** | Visible on the physical mobile device. |
| A2 — Reset typed-confirmation flow | **PASS** | Header Reset opened the shared typed-confirmation flow. |
| A3 — Import preview and cancellation | **PASS** | Preview and nondestructive cancellation behaved as required. |
| A4 — Truthful save messaging | **PASS** | Visible save status was truthful. |
| A5 — Focus-mode exit behavior | **Not physically verified on mobile** | The Focus control was not visible on mobile. Automated coverage verifies Exit when the control is available. This is a visibility/scope concern, not evidence that Exit failed. |
| A6 — Explicit final-packet draft confirmation | **PASS** | Exact-draft confirmation appeared before packet output. |
| A7 — Council/admissions journey and disclosure | **PASS** | Council and the refined admissions journey remained strong. |

The founder accepted R0 as **PASS-with-concerns**. Whether Focus belongs on mobile is a revisable
experience decision for exploration; it does not reopen R0 by itself.

## Reset conclusion

R0 Reset passes because the header control opens the typed-confirmation flow. For the future
experience, remove the redundant header Reset and retain one clearly explained deletion pathway
in Settings / Danger Zone. This future simplification is not an R0 product change.

## Process Report finding

The report has pedagogical value, but its reflection burden is excessive and duplicative after
drafting and revision: approximately three in-flow reflections, six Process Note answers, three
Stage-10 evidence reflections, eight ratings, three coach-perspective answers, and four
authorship confirmations.

Truth and integration defects to resolve in the future experience:

- “READY — no issues detected” can appear while reflection is partial and six Process Note
  questions are blank.
- All ten stages can appear done when the application may still infer completion from navigation
  rather than meaningful artifact completion.
- Council activity and decisions are absent because the decision-ledger integration is incomplete.
- “CUNY Hostos Community College” is hardcoded where genre or institution may not warrant it,
  and course-section context is missing.
- The submission note says draft text is absent while the complete final work is included.
- “Process report present” is treated as equivalent to “process reflection complete.”

The intended direction is **evidence-assisted reflection**, never AI-invented reflection:

- Assemble factual evidence from actual activity: tools used, review types, accepted/adapted/
  rejected suggestions, Voice Vault selections, revision snapshots, Council decisions, and
  existing student-authored in-flow reflections.
- Never generate or prepopulate the student's reasoning, feelings, or justification.
- Require approximately three substantial student-authored responses:
  1. What changed most in your writing, and why?
  2. Which AI suggestion did you accept, adapt, or reject, and what guided that decision?
  3. What did you preserve because it sounds or feels distinctly like you?
- Offer an optional fourth prompt about cultural, linguistic, family, or community knowledge.
- Offer Save and return later; make deeper reflection optional or instructor-configurable.
- Separate concise student reflection from a comprehensive instructor-facing system-evidence
  appendix.

## New P1 — physical-device mobile passage coaching

On an iPhone 17 Pro Max, passage-level Send to Coach options do appear after the student selects
text. The defect is not missing functionality. The actions sit far above a selection made near
the bottom of a long draft. Reaching them requires upward scrolling; during that scroll, iOS
frequently collapses the native selection or reduces it to the final word. The intended passage
therefore cannot be sent reliably.

Classification:

- **P1 mobile core-journey defect**
- **Independent release blocker**
- **Binding UX-exploration requirement**
- **Physical-device founder evidence**

Do not expand R0 into an architectural patch cycle unless a genuinely architecture-neutral fix
is demonstrated. Do not depend on modifying iOS's native Cut/Copy/Paste menu. The binding
requirements and ten physical-device acceptance checks live in
[`evidence/founder-ux-exploration-evidence-2026-08-01.md`](evidence/founder-ux-exploration-evidence-2026-08-01.md).

## Governance and release status

Protect the Council, progressive disclosure, and the improved admissions journey. Treat
reflection fatigue, report truth, Reset redundancy, mobile Focus visibility, and mobile
passage-selection reliability as evidence for the authorized future UX Exploration Window—not
as reasons to revert the improvements.

R0 remains **PASS-with-concerns**. The mobile passage-coaching P1 independently preserves the
release block until the selected future experience resolves it and passes physical-iPhone
validation. No architecture is selected by this record.
