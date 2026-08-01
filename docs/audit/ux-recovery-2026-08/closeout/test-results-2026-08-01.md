# Consolidated Product Test Results — Audit Closeout

**Branch:** `audit/ux-recovery-v1`

**Product baseline:** `84182d3d018b0722bd3d865d1cdd769d6c33eefe`

**Run date:** 2026-08-01 (America/New_York)

**Runtime:** Node v24.4.0 · Playwright 1.60.x · Chromium headless shell 1223

**Scope:** all 38 existing root `*test.mjs` suites, sequential; no product source changes.

## Result

**PASS — 38/38 suites; 1,068/1,068 reported assertions/checks; 0 product assertion failures.**

The first sandboxed diagnostic attempt produced macOS Chromium IPC permission failures
(`MachPortRendezvousServer … Permission denied`) in browser suites; two non-browser suites
completed. This was an execution-environment denial, not a product result. The complete suite
was rerun with the required browser permission, sequentially.

In that complete run, 37 suites passed. `genre_leakage_test.mjs` reached the generic 180-second
harness ceiling without an assertion failure. Per the documented known-load-flake protocol, it
was rerun alone with a 900-second ceiling: 2026-08-01 00:51:11–00:56:24 ET, **30/30 passed**.
`tutorial_page_test.mjs`, the other documented heavy suite, completed in the main quiet run at
**39/39 passed**.

| Suite | Result |
|---|---:|
| `badge_test.mjs` | 15/15 PASS |
| `bilingual_starter_test.mjs` | 9/9 PASS |
| `bilingual_warmth_test.mjs` | 19/19 PASS |
| `cap200_labels_test.mjs` | 37/37 PASS |
| `coachfocus_governance_test.mjs` | 9/9 PASS |
| `college_personal_statement_test.mjs` | 58/58 PASS |
| `council_kernel_test.mjs` | 65/65 PASS |
| `council_ui_test.mjs` | 29/29 PASS |
| `decision_counter_test.mjs` | 16/16 PASS |
| `final_packet_test.mjs` | 22/22 PASS |
| `full_draft_review_test.mjs` | 34/34 PASS |
| `gemini_fallback_test.mjs` | 14/14 PASS |
| `gemini_truncation_test.mjs` | 8/8 PASS |
| `gemini_worker_test.mjs` | 32/32 PASS |
| `genre_leakage_test.mjs` | 30/30 PASS (isolated rerun) |
| `graduate_sop_test.mjs` | 57/57 PASS |
| `interface_polish_test.mjs` | 23/23 PASS |
| `milestone_gate_test.mjs` | 22/22 PASS |
| `milestone_simplification_test.mjs` | 19/19 PASS |
| `passage_coach_test.mjs` | 26/26 PASS |
| `pause_reflect_rework_test.mjs` | 8/8 PASS |
| `polishing_sprint_test.mjs` | 26/26 PASS |
| `reflection_inflow_test.mjs` | 11/11 PASS |
| `report_attestation_test.mjs` | 14/14 PASS |
| `review_mode_test.mjs` | 37/37 PASS |
| `revision_completion_test.mjs` | 29/29 PASS |
| `service_learning_test.mjs` | 58/58 PASS |
| `stage10_completion_test.mjs` | 22/22 PASS |
| `stage10_reflection_test.mjs` | 28/28 PASS |
| `stage8_sequencing_test.mjs` | 10/10 PASS |
| `stage_entry_channel_test.mjs` | 22/22 PASS |
| `stem_lab_report_test.mjs` | 70/70 PASS |
| `storage_keys_test.mjs` | 13/13 PASS |
| `stuck_menu_reachability_test.mjs` | 14/14 PASS |
| `tutorial_page_test.mjs` | 39/39 PASS |
| `ux_remediation_test.mjs` | 30/30 PASS |
| `voice_vault_test.mjs` | 28/28 PASS |
| `xgenre_stage_routing_test.mjs` | 65/65 PASS |

## Non-failing observation

`gemini_worker_test.mjs` emitted Node's existing package-module-type warning. It did not affect
the 32/32 result, and closeout did not change `package.json` because product/configuration changes
were explicitly out of scope.
