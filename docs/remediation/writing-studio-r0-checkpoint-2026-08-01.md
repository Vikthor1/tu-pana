# Writing Studio R0 Safety/Trust Checkpoint

**Date:** August 1, 2026
**Branch:** `remediation/writing-studio-r0`
**Verified product base:** `84182d3d018b0722bd3d865d1cdd769d6c33eefe`
**Authority:** Founder review of UX Recovery Audit `346215665b01f4cca7b6d159cbd616388545ef2e`

## Scope boundary

This checkpoint implements only the authorized 11-item R0 safety/trust batch in the
current Writing Studio. It does not approve or implement Concept A, B, C, the simplified
hybrid, a final information architecture, or a final persistence model. The temporary
ten-stage interface remains present solely because redesign work is outside R0; it is not
recorded as an invariant or selected future direction.

No production deployment, merge, SaaS Sprint 1 work, comparative prototype, or VC-OS
doctrine change occurred. The Worker source contract was corrected and regression-tested,
but no Worker or application deployment occurred.

## Acceptance trace

| Criterion | Implemented behavior | Verification |
|---|---|---|
| R0.1 | Mobile English no longer hides `.ctb-en`; the current instruction renders at 390px. | `r0_safety_test.mjs` mobile computed-style assertion |
| R0.2 | Import presents artifact word/date preview, explicit Replace, automatic retained pre-import snapshot, and a safety download before replacement. Cancel does not write. | Preview/abort byte comparison/replacement/snapshot/download assertions; storage round-trip 13/13 |
| R0.3 | Header Reset and danger-zone clear use one typed BORRAR/DELETE dialog with an in-flow backup action. No product `localStorage.clear()` path remains. | Dialog-state, cancel-preservation, and source assertions |
| R0.4 | STEM lab report and legacy CAP 200 Council profiles are explicitly disabled; unknown configured genres are blocked and warn instead of inheriting the essay profile. | Council R0 assertions plus Council kernel 66/66 and UI 29/29 |
| R0.5 | 403 maps to permanent `origin_forbidden`, tells the student not to retry, and is excluded from provider/Council retry loops. 5xx remains transient. | 403 request-count/category/copy assertions and Council permanent-call assertion |
| R0.6 | The footer control exits hide-coach mode when it says Exit; draft-focus behavior remains separately owned. | Label/handler end-to-end click assertion |
| R0.7 | `#typingRow` boots without the `on` state and activates only when a request begins. | First-load DOM assertion |
| R0.8 | Routine `buildChannelData()` and Gemini chat prompts contain no `maniSentence` field or value. Explicit full-draft/capstone disclosures remain unchanged. | Captured request-payload assertion |
| R0.9 | Saved status names the current step artifact. Only a successfully stored Stage 6 authorship draft names revision support as available. | Early-stage rendered-status assertion plus source sweep |
| R0.10 | Student/evidence writes route through a shared checked write contract. Failure creates a persistent banner within the synchronous failure path, names unsaved work, retains failed values in memory, and offers an emergency export containing them. | Fault injection across chat, decisions, process note, capstone, Voice Vault, Council, and draft |
| R0.11 | Copy/download packet actions first show the exact heuristic-selected draft, stage, word count, and full read-only preview; explicit checkbox confirmation is required. Cancel creates no packet output. | Preview/disabled/abort/confirmed-output assertions |

## Control ownership audit

| Control | Label owner | Handler owner | Result |
|---|---|---|---|
| Footer Focus / Return to coach | Draft-focus state (`_syncFocusToggleBtn`) | `toggleDraftFocus()` | Enters/exits gentle draft focus. |
| Footer Exit in hide-coach mode | Hide-coach state (`toggleFocusMode`) | `toggleDraftFocus()` delegates to `toggleFocusMode()` when hide-coach is active | Restores the coach; label and action agree. |
| Header Reset | Shared destructive-data dialog | `resetApp()` delegates to `clearAllData()` | Backup offer + typed confirmation; no one-confirm deletion. |
| Danger-zone Clear my data | Shared destructive-data dialog | `clearAllData()` | Same friction and behavior as Header Reset. |
| Copy/Download Final Packet | Interim final-draft confirmation | `exportFinalPacket()` / `downloadFinalPacket()` | Packet output occurs only after explicit draft confirmation. |

## Verification result

- Complete sequential repository run: **39/39 suites passed**.
- Aggregate checks: **1,098/1,098 passed**.
- Focused R0 suite: **29/29 passed**.
- Syntax checks: `storage.js`, `ui.js`, `council.js`, `ai-provider.js`, and `app.js` passed.
- `git diff --check`: passed.
- The existing Node module-type warning in `gemini_worker_test.mjs` remains informational;
  its 32/32 assertions passed.

The regression run used the local bounded surface with mocked provider responses. It did
not call live Gemini, deploy the Worker, exercise Brightspace, or validate physical-device
storage constraints. Founder spot-check/lived experience remains the human exit gate above
the automated evidence.

## Stop condition

R0 implementation and technical verification end at this checkpoint. Comparative UX
exploration, prototype work, final redesign decisions, SaaS work, and production deployment
remain paused.
