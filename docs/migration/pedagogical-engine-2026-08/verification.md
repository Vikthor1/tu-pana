# Verification record — pedagogical-engine migration pass

**Date:** 2026-08-04 · **Plane:** `migrate/pedagogical-engine-2026-08` · **Harness:** local
`test-server.js` on 127.0.0.1:3001 serving this worktree; Playwright headless Chromium; Node v26.

## Full battery — 54 suites, 1,720 checks, 0 failures

**Legacy + product suites (39 suites, 1,098 checks — legacy app untouched, byte-identical to R0):**
badge 15 · bilingual_starter 9 · bilingual_warmth 19 · cap200_labels 37 · coachfocus_governance 9 ·
college_personal_statement 58 · council_kernel 66 · council_ui 29 · decision_counter 16 ·
final_packet 22 · full_draft_review 34 · gemini_fallback 14 · gemini_truncation 8 ·
gemini_worker 32 · genre_leakage 30 · graduate_sop 57 · interface_polish 23 · milestone_gate 22 ·
milestone_simplification 19 · passage_coach 26 · pause_reflect_rework 8 · polishing_sprint 26 ·
r0_safety 29 · reflection_inflow 11 · report_attestation 14 · review_mode 37 ·
revision_completion 29 · service_learning 58 · stage_entry_channel 22 · stage10_completion 22 ·
stage10_reflection 28 · stage8_sequencing 10 · stem_lab_report 70 · storage_keys 13 ·
stuck_menu_reachability 14 · tutorial_page 39 · ux_remediation 30 · voice_vault 28 ·
xgenre_stage_routing 65 — **ALL PASS.**

**Finalist prototype suites (5 suites, 364 checks — exploration surface untouched):**
prototype_exploration 238 · prototype_integrated_corrections 48 · prototype_integrated_agency 27 ·
prototype_integrated_revision_cycle 22 · prototype_integrated_connected_tools 29 — **ALL PASS.**

**Studio candidate suites (10 suites, 258 checks — new):**
studio_corrections 47 · studio_connected_tools 30 · studio_agency 27 · studio_revision_cycle 22 ·
studio_profiles 33 · studio_journey 29 · studio_coach 18 · studio_council 14 · studio_access 14 ·
studio_import 24 — **ALL PASS.**

## Comparative journeys (finalist = behavioral reference, legacy = capability source)

| Journey | Verdict vs finalist | Evidence |
|---|---|---|
| Mixed-genre autobiography (canonical) | preserved exactly + extended (deeper Move guidance, disclosed) | studio_corrections, studio_journey, studio_profiles |
| College admissions | preserved + extended (alias link, deeper guidance, Council prohibitions in prompts) | studio_profiles, studio_coach, studio_council |
| Statement of purpose | preserved + extended (evidence-map deeper guidance) | studio_journey, studio_council |
| STEM writing | preserved exactly (Council stated-unavailable; zero cultural leakage) | studio_profiles, studio_council, studio_journey |
| General Writing | preserved (explicit selection only, never a fallback) | studio_profiles, studio_access |
| CAP 200 service-learning | **intentional addition** for a documented pedagogical reason: the legacy pilot genre was absent from the finalist; translated per contract C1/C3 | studio_profiles, studio_journey, studio_council |
| Research paper | **intentional addition**, same reason | studio_profiles, studio_journey, studio_council |
| Unknown/unsupported assignment | preserved (loud stop, recovery, zero inheritance) — legacy's silent autobiography fallback retired | studio_profiles, studio_access |
| Fully non-AI session (start → Finish → packet) | preserved exactly, three genres end-to-end | studio_journey |
| Passage coaching | preserved (scope truth, consent, tray) | studio suites + finalist corrections clone |
| Full-draft review | preserved + adapted (real prompt contract, provider provenance) | studio_coach |
| Council + revisit | preserved (revisit-no-rerun, convene-again fresh consent) + adapted (async provider orchestration — documented suite adaptation) | studio_corrections, studio_council |
| Self-review / outside-feedback revision + comparison + Finish | preserved (inherited slice 6/7) | studio_revision_cycle, studio_journey |
| Your Voice + multilingual preservation | preserved + extended (both-mode on newer surfaces; byte-exact incl. CJK) | studio_agency, studio_access |
| Backup, import preview, cancellation, recovery | extended (legacy import adapter with preview/rollback; studio export; typed-DELETE) | studio_import, studio_corrections |
| Storage failure | preserved (saveFailed truth path) — quota-pressure simulation not exercised beyond the finalist's saveFailed handling | inherited finalist behavior |

## Density and calm (protected contract)

Fresh English 1440×960: finalist 185 first-viewport words / 498 full-page; studio 208 / ≤498.
The +23 viewport words are entirely pre-existing finalist surface revealed by removing ~90px of
exploration chrome (concept switcher + longer banner, −20 words); zero surface words were added.
Gates now suite-enforced: full-page ≤ 498 (closed progressive disclosure excluded — deeper Move
guidance is undisclosed until opened) and a 215-word viewport ceiling. Mandatory pre-typing
actions 0 · blocking interruptions 0 · primary destinations 3 · both-language density grows only
by explicit student choice.

## Documented test adaptations (all in-suite, commented)

1. Cloned suites point at `studio.html` / `tupana-studio:v1`.
2. Notebook-concept spellcheck check dropped (no notebook concept in the studio).
3. Density gate re-expressed fold-independently (above).
4. Corrections suite awaits the now genuinely asynchronous Council (record contract unchanged).

## Also verified locally

Responsive 390×844 (targets ≥44px, no horizontal overflow, unknown-assignment recovery, mobile
Before/Current tabs); keyboard-only dialog behavior (focus trap, Escape, dirty-guard);
accessible names/status announcements to browser automation; exact multilingual byte
preservation across language switch + reload; zero non-consensual external requests in every
suite (request interception on every page); R0 sentinel keys untouched in every studio suite;
reduced-motion and local 200% reflow coverage carried by the finalist suites over shared CSS.

## Not claimed

No physical-iPhone, VoiceOver or other physical assistive technology, representative-student,
founder lived-experience, live-Gemini, Brightspace, or cross-device validation occurred.
Automated green proves reachability, state truth, and isolation — not comprehension, welcome, or
the mobile passage-coaching P1's ten physical-device requirements.
