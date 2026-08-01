# Verification results — local comparative prototypes

**Prototype:** `9e878e2fcb18bba2e4d71d50a5d6c20e2774f7f3`  
**Date:** 2026-08-01  
**Environment:** local static server; headless Chromium; synthetic content; deterministic mock AI

## Prototype journey suite

Command:

```bash
node prototype_exploration_test.mjs
```

Result: **98/98 PASS**.

The suite exercised the same full journey in Desk, Journey, and Hybrid:

- comparison entry, visible orientation, synthetic start, exact save/reload continuity;
- preservation of an existing R0 sentinel key;
- immediate passage capture, exact-text retention after selection collapse, three scope choices,
  exact preview, Cancel/Clear affordances, and consent-before-mock-send;
- focused review, Council convening/re-entry, decision persistence, and no external request;
- exactly three required student reflection prompts and one optional knowledge prompt;
- separate student reflection and instructor appendix, exact packet draft, deliberate confirmation;
- immediate Spanish behavior, STEM genre correctness, one namespaced Danger Zone path;
- concept-local deletion that leaves the R0 sentinel unchanged;
- no page JavaScript errors and no non-local network requests;
- 390 × 844 viewport containment, no horizontal overflow, 44px visible control targets,
  accessible button names, keyboard activation, Escape close, and each concept's mobile Focus
  decision.

## Unchanged R0 safety-contract selection

All suites ran from the exact R0-rooted exploration worktree without assertion changes:

| Suite | Result |
|---|---:|
| `r0_safety_test.mjs` | 29/29 PASS |
| `passage_coach_test.mjs` | 26/26 PASS |
| `full_draft_review_test.mjs` | 34/34 PASS |
| `council_kernel_test.mjs` | 66/66 PASS |
| `council_ui_test.mjs` | 29/29 PASS |
| `genre_leakage_test.mjs` | 30/30 PASS |
| `voice_vault_test.mjs` | 28/28 PASS |
| `final_packet_test.mjs` | 22/22 PASS |
| `storage_keys_test.mjs` | 13/13 PASS |
| **Total** | **277/277 PASS** |

No safety assertion, mixed test file, or experience snapshot was changed. The prototype uses a
new test file and entry point, leaving the R0 experience intact for contract verification.

## Mobile passage P1 acceptance status

Viewport checks are implementation evidence, not physical-iPhone validation.

| Binding requirement | Local prototype status | Still required |
|---|---|---|
| 1. Select near bottom and reach action without upward scroll | App-owned fixed action stays inside 390 × 844 viewport | Physical iPhone + long draft + keyboard |
| 2. Capture the complete intended paragraph | Exact selected string persisted after native selection was programmatically collapsed | Physical iOS selection behavior |
| 3. Display exact passage before transmission | PASS in all three concepts | Physical-device confirmation |
| 4. Opening action does not alter draft | PASS by exact save/reload and preview checks | Physical-device confirmation |
| 5. Cancel leaves draft unchanged | Implemented; dialog closes without write | Physical-device confirmation |
| 6. Remain visible above keyboard without obscuring work | `visualViewport` offset plus fixed safe-area placement implemented; viewport geometry passed | Real iOS keyboard and scrolling |
| 7. Clear English and Spanish labels | PASS in immediate language switch | Founder comprehension on device |
| 8. Keyboard and screen-reader accessible | Keyboard activation, focus trap, Escape, labels, target geometry passed | VoiceOver physical-device test |
| 9. Preserve consent, disclosure, voice, Council | Consent/preview and Council exercised; R0 protections 277/277 | Lived-experience confirmation |
| 10. Physical iPhone verification | **NOT RUN / OPEN** | Required; emulation cannot close P1 |

No claim of physical-iPhone passage validation is made.

## Accessibility and responsive limits

Completed: keyboard activation of passage coaching; modal focus trap implementation; Escape
close; accessible names for visible buttons; minimum target geometry; mobile overflow; responsive
editor priority; `prefers-reduced-motion`; semantic headings, field labels, dialog roles, and live
regions.

Not completed: axe-core (not installed in the R0 workspace), VoiceOver/NVDA, Safari's real visual
viewport and selection behavior, physical mobile keyboard, zoom/reflow at 200–400%, Windows high
contrast, or cognitive usability with students.

## Browser-walkthrough limit

The in-app browser backend exposed no available browser instance in this session. The automated
local Chromium walkthrough completed instead. No manual in-app-browser walkthrough is claimed.
