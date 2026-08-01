# Genre-by-Stage Configuration Matrix — UX Recovery Audit (Agent B)

Date: 2026-07-31 · Worktree: `/Users/Victor1/Sites/tupana-audit` (read-only audit copy, post-`84182d3` genre copy layer)
Scope: every genre mode × all 10 stages; resolution-chain map; remaining default-essay leakage paths; structural-fit assessment. Fixed bugs documented in `docs/genre-alignment-report.md` are **not** re-reported; this file covers what the configuration IS now and what still leaks.

---

## 1. Genre inventory — 7 modes

Registered in `ASSIGNMENT_LAYERS` (`assets/js/genre-template.js:1340-1367`). No unlisted ids exist in code (verified: `getAssignmentLayer()` is a strict `hasOwnProperty` lookup; `app.js:14-27` rejects unknown ids to the default).

| # | Mode | id | Activation | Profile? | Own `coachFocus`? | Own `copy:{}`? | Council profile? | start-here tutorial? |
|---|------|----|-----------|----------|-------------------|----------------|------------------|----------------------|
| 0 | Default mixed-genre autobiographical essay | *(none)* | bare app | (template) | template default | default copy | `default` | yes (default entry) |
| 1 | CAP 200 First Draft (legacy) | `cap-200-first-draft` | link only | **NO** (context-only) | none → NEUTRAL | none → NEUTRAL | **MISSING → default** | **MISSING → default** |
| 2 | CAP 200 Bronx Beautiful Service-Learning | `cap200-bronx-beautiful-service-learning` | link + selectable:true (in-app chooser) | yes | **none → NEUTRAL_STAGE_FOCUS** | none → NEUTRAL | yes | yes |
| 3 | Research Paper | `research-paper` | link only | yes | yes (1–10) | none → NEUTRAL | yes | yes |
| 4 | STEM Lab Report | `stem-lab-report` | link only | yes | yes (1–10) | none → NEUTRAL | **MISSING → default** | yes |
| 5 | College Personal Statement | `college-personal-statement` | link only | yes | yes (1–10) | **yes (bespoke)** | yes | yes |
| 6 | Graduate SOP | `graduate-sop` | link only | yes | yes (1–10) | none → NEUTRAL | yes | yes |

Additional selector surfaces: `getSelectableProfiles()` (student first-run chooser — CAP 200 modern only), `getReviewProfiles()` / `REVIEW_PROFILE_ORDER` (`genre-template.js:1402-1430`, colleague `?review=colleague` — the 5 profiled layers, legacy excluded).

---

## 2. Resolution chain (the actual contract, mapped)

```
state.assignmentId  ←  app.js:14-27
    URL ?assignment=<id>  → if getAssignmentLayer(id) truthy: active + remembered
                            (localStorage tupana_assignment_id)
    ?assignment= / none / generic → clears remembered id
    unknown id → SILENT fallback to default essay (no warning; only cue = header chip "Ensayo")

_layerActive(id)  = !!getAssignmentLayer(id)                 genre-template.js:1614
_profileForAssignment(id) = layer.profile || null            genre-template.js:1439

── Seam A: stage/coach identity (Stage B.1 + F4, pre-copy-layer) ─────────────
getStageLabelOverride(stage,id)      profile.stageDisplay → NEUTRAL_STAGE_LABELS → null(default)   gt.js:1446
getMilestoneLabelOverride(n,id)      profile.milestones   → NEUTRAL_MILESTONES   → null(default)   gt.js:1457
getStageStepOverride(stage,step,id)  profile.stageSteps   → NEUTRAL_STAGE_STEPS (tokenized) → null gt.js:1474
getDraftPlaceholderOverride(id)      profile.draftPlaceholder → NEUTRAL_DRAFT_PLACEHOLDER → null   gt.js:1489
getStageEntryOverride(stage,id)      profile.stageEntry → null                                     gt.js:1468
resolveStageEntry(stage,id,default)  own → NEUTRAL_STAGE_ENTRY (tokenized) → default               gt.js:2007
getCoachFocusOverride(stage,id)      profile.coachFocus[stage] → null                              gt.js:1502
resolveCoachFocus(stage,id,default)  own → default(no layer) → NEUTRAL_STAGE_FOCUS                 gt.js:1533
getWelcomeOverride(id)               profile.welcome → null (caller's generic-neutral welcome)     gt.js:1545
getPathwayLabel(id)                  layer.pathwayLabel → null ("Ensayo/Essay" chip)               gt.js:1554

── Seam B: genre copy layer (84182d3) — contract: no layer → default copy;
   own copy → own; layer active + missing → NEUTRAL (never default essay) ────
_genreCopyOverride(id,key,stage)     profile.copy[key][stage]                                      gt.js:1930
getMicroPromptsFor    own → NEUTRAL_MICRO_PROMPTS[stage] || [6] → null(no layer)                   gt.js:1939
getPanaHintFor        own → NEUTRAL_PANA_HINTS[stage] → null                                       gt.js:1947
getRevisionMovesFor   own → {NEUTRAL_REVISION_SMALL/BIG} → null                                    gt.js:1956
getFollowupsFor       own → NEUTRAL_FOLLOWUPS[stage] → null                                        gt.js:1964
getStageDescFor       own → NEUTRAL_STAGE_DESC[stage] → null                                       gt.js:1973
getStageExampleFor    own → NULL (layered genres NEVER show another genre's worked example)        gt.js:1983
getStageSkillLabelFor own → NEUTRAL_STAGE_SKILLS[1-3] → null                                       gt.js:1990
getBadgeTextFor       own → NEUTRAL_BADGE_TEXT → null                                              gt.js:1999
applyGenreTokens      {workEs}/{workEn} → GENRE_WORK_NOUN[id] (walks strings/arrays/objects)       gt.js:1599
getWorkNoun           default "ensayo/essay" · per-genre noun · _neutral "trabajo/piece of writing" gt.js:1593

── Callers (fallback lives in the CALLER for Seam-B resolvers) ───────────────
prompts.js:119  prompts = genrePrompts || MICRO_PROMPTS[stage] || MICRO_PROMPTS[6]
prompts.js:304  hint    = genreHint    || PANA_HINTS[stage]
prompts.js:351  smallSet = moves?.small || REVISION_SMALL  (…BIG)
ui.js:5905      followups = genreFollowups || STAGES[].followups
ui.js:1948/1976 stage preview: pDesc || STAGES[].desc · layerExample ?? (default: STAGES[].example)
ui.js:1634/1639 msLabel()/stLabel() → override || MILESTONES/STAGES default
ui.js:2021      resolveStageEntry(id, assignmentId, STAGE_ENTRY_MESSAGES[id])
ui.js:3224      resolveCoachFocus(s.number, state.assignmentId, s.coachFocus) → system prompt Stage rules
ui.js:3236-3246 assignment context appended AFTER mandatory rules; genre identity line names layer
ui.js:4655      skillLabelFor → getStageSkillLabelFor || STAGE_SKILL_DEFS
ui.js:6747      computeBadges → getBadgeTextFor('story') || default (other badges genre-neutral)
council.js:158  getCouncilProfile(assignmentId) — unknown id → **DEFAULT autobiographical profile**
start-here.html:466-472  resolveGenreId — unknown id → **DEFAULT essay tutorial**
```

The Seam-B contract holds **inside the app's coaching surfaces**. The three chains that do NOT follow the contract are `getCouncilProfile` (inherit-default), start-here `resolveGenreId` (inherit-default), and every report/export/log surface that reads `STAGES[n]` raw (§5).

---

## 3. The matrix

### 3.1 Configuration source per genre × dimension (all 10 stages unless noted)

Legend: **OWN** = layer's own copy · **NEU** = neutral fallback (tokenized) · **DEF** = default essay copy (correct only for mode 0) · **—** = surface intentionally absent.

| Dimension (surface) | Default | cap-200-first-draft | CAP200 SL | research-paper | stem-lab | college-ps | graduate-sop |
|---|---|---|---|---|---|---|---|
| Stage labels (journey map, task bar, back btn, nav CTA) | DEF | NEU | OWN | OWN | OWN | OWN | OWN |
| Milestone names (header, map, packet M-labels) | DEF | NEU | OWN | OWN | OWN | OWN | OWN |
| Stage-entry coach message | DEF | NEU | OWN | OWN | OWN | OWN | OWN |
| Task-bar sub-step cues (3 cues st.1–6, 1 cue st.7–10) | DEF | NEU | OWN | OWN | OWN | OWN | OWN |
| Draft placeholder | DEF | NEU | OWN | OWN | OWN | OWN | OWN |
| Post-onboarding welcome | generic-neutral (ui.js:5210-5222) | generic-neutral | OWN | OWN | OWN | OWN | OWN |
| Coach system-prompt stage focus (×10) | DEF template | NEU (`NEUTRAL_STAGE_FOCUS`) | **NEU** (no coachFocus block) | OWN | OWN | OWN | OWN |
| Assignment context block (system prompt) | — | OWN (IMRDC first-draft) | OWN (built from profile) | OWN | OWN | OWN | OWN |
| Stuck-mini micro prompts | DEF (st.1–9; st.10→[6]) | NEU | NEU | NEU | NEU | **OWN st.1–9; st.10→NEU[6]** | NEU |
| Pana Hints | DEF (st.1–9; none at 10) | NEU (1–9) | NEU | NEU | NEU | **OWN 1–9** | NEU |
| Follow-up chips (“Seguir conversando”) | DEF (STAGES[].followups, 1–10) | NEU (1–10) | NEU | NEU | NEU | **OWN 1–10** | NEU |
| Revision moves (small/big, st.7) | DEF | NEU | NEU | NEU | NEU | NEU | NEU |
| Research card starters (st.4) | DEF tokenized | token-NEU | token | token | token | token | token |
| Voice-polish routes (st.8) | DEF tokenized | token | token | token | token | token | token |
| Stage-preview description | DEF (STAGES[].desc) | NEU | NEU | NEU | NEU | NEU | NEU |
| Stage-preview worked example | DEF (eviction-letter etc.) | — | — | — | — | — (no `copy.stageExample`) | — |
| Stage-completed transition text | DEF (STAGE_TRANSITIONS) | NEU generated (ui.js:1670) | NEU gen | NEU gen | NEU gen | NEU gen | NEU gen |
| Toolkit skill labels (st.1–3 autobiographical wording) | DEF | NEU | NEU | NEU | NEU | **OWN 1–3** | NEU |
| Badges (`story` cls; others neutral) | DEF “Story Founder” | NEU “Focus Founder” | NEU | NEU | NEU | **OWN “Story Founder/Meaning Builder”** | NEU |
| Phase celebrations (st.4/6/9) | shared-neutral (ui.js:6690) | same | same | same | same | same | same |
| Reflection checkpoints (st.4/7 …) | shared-neutral | same | same | same | same | same | same |
| EVAL_FEEDBACK (Five-Questions eval chips) | shared-neutral (ui.js:5601) | same | same | same | same | same | same |
| Five Questions strip / help / El Laboratorio / Tu Conocimiento | shared-neutral statics; “Experience as Evidence” swap under any layer (ui.js:4775-4809) | same | same | same | same | same | same |
| Full-draft review lenses (st.7–9) | shared-neutral, genre-fit lens defers to active assignment (ui.js:3871-3907) | same | same | same | same | same | same |
| Voice Vault (st.7–9) | shared-neutral | same | same | same | same | same | same |
| Council profile (audienceContext, mandates, synthesisOrder) | `default` | **DEF (missing)** | OWN | OWN | **DEF (missing)** | OWN | OWN |
| Capstone 10A/10B/10C criteria + ratings | shared-neutral (ui.js:655-674) | same | same | same | same | same | same |
| Process Note / instructor report / final packet stage names | DEF | **DEF leak** | **DEF leak** | **DEF leak** | **DEF leak** | **DEF leak** | **DEF leak** |
| Process-log `stage_advanced` summaries | DEF | **DEF leak** | **DEF leak** | **DEF leak** | **DEF leak** | **DEF leak** | **DEF leak** |
| Brightspace/Hostos submission framing | correct | plausible (CAP) | plausible (CAP) | **wrong ctx** | **wrong ctx** | **wrong ctx** | **wrong ctx** |
| start-here tutorial (genre card, myths, route map) | OWN | **DEF (missing)** | OWN | OWN (route drift) | OWN (route drift) | OWN (**route = default's**) | OWN (**route contradicts layer**) |
| Pathway chip | “Ensayo · Essay” | “CAP 200” | “CAP 200” | OWN | OWN | OWN | OWN |

### 3.2 Stage roles as presented per genre (labels EN; ES equivalents ship in the same object)

Engine's stable roles (the spine every resolver is written against, `genre-template.js:1618-1621`):
**1** starting material · **2** connection/purpose · **3** direction/claim · **4** evidence · **5** plan · **6** unassisted draft (authorship gate ⭐) · **7** revision · **8** voice · **9** readiness · **10** process reflection.

| St | Default essay | cap-200-first-draft (neutral) | CAP200 SL | Research Paper | STEM Lab | College PS | Graduate SOP |
|----|--------------|------------------------------|-----------|----------------|----------|-----------|--------------|
| 1 | Anecdote | Starting Point | Community Starting Point | Topic & Context | Lab Context | Story Inventory | Frame & Requirements |
| 2 | Connection | Connection & Purpose | Community Issue + Course | Research Question | Purpose & Question | Possibility Check | Trajectory Inventory |
| 3 | Topic Pitch | Central Idea | Project Proposal | Search Plan & Sources | Method Summary | Choose a Direction | Intellectual Direction |
| 4 | Research | Evidence & Sources | Evidence + Data Plan | Source Evaluation | Evidence & Data | **Meaning & Tension** | Evidence Map |
| 5 | Outline | Plan & Structure | Report Structure | Notes & Evidence | Result & Pattern | **Shape the Essay** | Architecture |
| 6 | First Draft ⭐ | First Draft ⭐ | First Draft ⭐ | First Draft ⭐ | First Draft ⭐ | First Draft ⭐ | First Draft ⭐ |
| 7 | Revision (Five Qs) | Revision | Revision with Evidence | **Argument & Thesis** | Scientific Explanation (CER) | Meaning & Structure | Developmental Review |
| 8 | Voice Polish | Voice & Style | Voice + Academic Style | Revision & Voice | Voice & Scientific Register | Specificity & Voice | Precision & Voice |
| 9 | Checklist | Final Check | Final Readiness Check | **Citations & Polish** | Final Readiness Check | Reflection & Integrity | Final Audit |
| 10 | My Writing Snapshot | Process Reflection | Process Reflection | Process Report | Process Reflection | Process Reflection | Process Reflection |

Student artifact per stage is genre-consistent with the label row (anecdote text / inventory list / proposal pitch / evidence-map notes / outline-plan / full unassisted draft / revised paragraphs / polished sentences / completed checklist / written reflection + generated report). Stage 6 artifact and gate are identical in all 7 modes (global `AUTHORSHIP_GATE`, `genre-template.js:57-67`). Stage 10 artifacts are identical machinery in all modes: 10A self-assessment (shared criteria), 10B AI perspective (`capstone_review`, genre-aware system prompt), 10C Process Note, final packet.

**Cells needing individual note (everything else is covered by §3.1 rows):**
- **All layered genres, st.10 stuck-mini**: `NEUTRAL_MICRO_PROMPTS` has no key 10 → resolver returns index-6 draft-writing prompts at the reflection stage (`gt.js:1943`). Off-role but genre-safe. P3.
- **All layered genres, st.10 Pana Hint**: none exists for any mode (PANA_HINTS and NEUTRAL_PANA_HINTS both end at 9) — consistent, no leak.
- **college-ps `copy.followups`** covers 1–10; `copy.microPrompts`/`panaHints` cover 1–9 (10 → neutral); `copy.skills` covers 1–3 only (4–10 use default STAGE_SKILL_DEFS labels, which are genre-neutral from stage 4 on — by design, only 1–3 are autobiographical).
- **Milestone grouping** (1–3 / 4–5 / 6 / 7–9 / 10) is hard-coded in `MILESTONES[].ids` (ui.js:1613-1619) for all genres; only names re-skin.
- **Word-count auto-advance thresholds** `STEP_WORD_THRESHOLDS` (data.js:279-282) are shared, essay-tuned numbers for every genre (st.1: 5/40 words) — silent, genre-blind pacing.
- **Review options** identical across genres: passage-coach menu (5 actions + Protect at 7–9), revision panel (st.7), voice-polish card (st.8), full-draft review (st.7–9, 5 lenses, ui.js:3961), Voice Vault (st.7–9), Council (any stage the draft-review modal offers it, gemini mode only).
- **Process evidence contribution** identical across genres: 8-core-event process log, `tupana_decisions`, capstone answers, Voice Vault contents → Process Note + instructor report + final packet. Genre affects only the (leaking) stage-name strings inside them (§5-L4).

---

## 4. Structural-fit assessment (stage STRUCTURE, not copy)

**Verdict: the 10-stage spine is genuinely genre-general for the five profiled layers — fit is achieved by real role reinterpretation, not just relabeling — but three structural elements remain essay-shaped for everyone, and the legacy CAP layer has label-only integrity.**

Per genre:
- **CAP 200 SL — good fit.** Proposal→evidence plan→IMRDC structure→draft→analysis revision maps naturally onto the spine; stage 3 (proposal) and 9 (IMRDC check) are genuinely service-learning stages, not renamed essay stages.
- **Research Paper — good fit with two visible seams.** The engine's "plan" slot (5) is spent on notes/evidence, so no stage is explicitly the outline; and the thesis/argument only becomes a named focus at stage 7 (“Argument & Thesis” occupying the *revision* slot). Coherent as a revision pass, but a student looking for "where do I outline / where do I form my thesis" has no stage named for it. Stage 9 (citations) is a real research stage.
- **STEM Lab — surprisingly good fit.** Context→purpose→method→data→result→draft→CER→register→check→reflection is an honest IMRaD-as-process walk. Mild forcing: CER (7) *after* the full draft (6) inverts how many instructors teach explanation-before-writeup, and stage 2 (purpose) vs 5 (result/pattern) presume the lab is already completed before the student arrives — true for reports, unstated in the UI.
- **College PS — good fit; the layer redefines roles** (4 = meaning/tension not evidence, 5 = shaping, 9 = integrity), which is exactly why it needed bespoke copy. Native fit — it *is* an essay.
- **Graduate SOP — good fit on paper, tonal strain in the frame.** Frame→inventory→direction→evidence map→architecture→draft→developmental review→line edit→audit→reflection is a credible professional workflow. Strain: the surrounding chrome addresses a "student" in a course (Brightspace/Hostos packet, "instructor connects the AI" offline welcome copy is avoided in its own welcome but the packet/report framing is not); the 5-milestone celebration register ("¡Bienvenido/a! Completaste Tu Conocimiento…") reads young for an adult applicant.
- **cap-200-first-draft — label-only integrity.** No profile: neutral names, neutral cues, neutral coachFocus + an IMRDC context block. Nothing is *wrong*, but nothing is service-learning-shaped on screen either (deliberate, per alignment report §4.5 — re-pointing is a founder decision).

Genre-equivalent stages across all modes: **1–3, 6, 8, 10** (starting material, focus, direction, gated draft, voice, reflection all translate honestly). Partially forced: **4–5** (evidence/plan slots get repurposed per genre — works, but each layer bends them), **7** (single "revision" slot must hold Five-Questions protocol / CER / thesis work / developmental review — the deepest role divergence), **9** (checklist vs citations vs audit vs integrity — same slot, four different jobs). Shared essay-shaped residue applying to every genre regardless of copy: the fixed 1-3/4-5/6/7-9/10 milestone grouping, the essay-tuned word-count auto-advance, and stage 7–10 having only one task cue (step index frozen).

---

## 5. Remaining leakage / misconfiguration findings

**P1 — misleads a core journey**

- **L1. Council runs a STEM lab report (and legacy CAP) as an autobiographical essay.** `COUNCIL_PROFILES` (council.js:78-153) has no `stem-lab-report` and no `cap-200-first-draft` entry; `getCouncilProfile()` (council.js:158-164) silently inherits the `default` profile for unknown ids. Reviewer and synthesis prompts then embed `GENRE AND AUDIENCE: A first-year college mixed-genre autobiographical essay moving from personal memory to social analysis…` (council.js:212, 244) and default `synthesisOrder ['structure','evidence','voice']`. The Council offer renders whenever gemini mode is on (ui.js:4300) — a lab-report student convening the Council receives wrong-genre review guidance end to end. Silent (no error, no UI cue).
- **L2. start-here tutorial route maps preview stage names that do not exist in the app — and for the SOP contradict the layer's own doctrine.** `college-personal-statement` route (start-here.html:366-368) is the *default essay's* route verbatim ('1 Memory', '2 Connection', '3 Pitch', '4 Dig deeper', '5 Outline') vs the layer's actual Story Inventory / Possibility Check / Choose a Direction / Meaning & Tension / Shape the Essay (genre-template.js:841-852). `graduate-sop` route (start-here.html:388-390) says **'1 Origin moment'** while the SOP layer's stage 1 is Frame & Requirements and its coachFocus explicitly forbids forcing origin stories (genre-template.js:1251, 1253). `research-paper` (start-here.html:432-434: '2 Context', '3 Pitch') and `stem-lab-report` (start-here.html:454-456: '2 Background', '3 Hypothesis') also drift from their in-app stage names. First-contact journey preview ≠ actual journey; for admissions this is the exact link the founder's son uses.
- **L3. `cap-200-first-draft` through start-here loses the genre entirely.** The id is absent from start-here `GENRES` (start-here.html:329-460); `resolveGenreId()` (466-472) silently serves the **autobiographical essay tutorial**, and `APP_URL` becomes `index.html` with `appQuery:''` (start-here.html:332) — on a browser with no remembered id, the student lands in the plain default-essay app: full wrong-genre journey with zero signal. (Direct `index.html?assignment=cap-200-first-draft` links still work.)

**P2 — wrong/stale content on a real surface, journey still recoverable**

- **L4. Every report/export/log surface prints default-essay stage names for layered genres.** All read `STAGES[n].es/.en` raw instead of `stLabel()`:
  - Process Note data + scaffold: ui.js:7201 → 7544 (“Comencé en la Etapa 1 (Anécdota / Anecdote)” inside a lab-report packet)
  - Submission-mode report: ui.js:7453, rendered via `openReport('submit')` (ui.js:7180) — “Etapa actual: 1 — Anécdota / Anecdote”
  - Copy/download report text: ui.js:7603
  - Final packet: ui.js:7961-7963 (“Stage 1 — Anecdote”)
  - Instructor report panel: ui.js:8193-8194
  - Process log: ui.js:2048 `Advanced to Stage N — Anecdote` (stored evidence consumed by the Tu Pana Process Report analyzer downstream)
  - Bug report URL: ui.js:8716-8719 (`stage_en=Anecdote`, telemetry only)
  `genre_leakage_test.mjs` harvests only `openReport('work')` (`buildWorkStatusHTML`), never submit mode — so this whole family is outside the guard.
- **L5. Institutional frame is hard-coded Hostos/Brightspace for all genres.** Final packet header “Tu Pana de Escritura — CUNY Hostos Community College” (ui.js:7988); packet/report instructions “paste and submit it in Brightspace” (ui.js:7288, 7920, 768-772; index.html:926, 967). Wrong context for admissions, SOP, research-paper, stem journeys used outside CAP courses.
- **L6. Unknown assignment id fails silently to the default essay** (app.js:14-27). A typoed genre link (`?assignment=stem-lab`) yields the complete autobiographical journey; only cue is the "Ensayo · Essay" pathway chip. Same silent-inherit shape as L1/L3.
- **L7. CAP 200 modern profile has no `coachFocus` block** → the model receives `NEUTRAL_STAGE_FOCUS` for all 10 stages (gt.js:1533-1539) while every student-facing surface speaks rich service-learning copy. Not a leak (never autobiographical), but the flagship selectable genre coaches from generic prompt lines; the profile's own `SERVICE_LEARNING_MOVES` context block carries all specificity.

**P3 — cosmetic/latent**

- **L8. Stage-10 stuck-mini in layered genres shows draft-writing micro-prompts** (fallback to NEUTRAL index 6, gt.js:1943) during the reflection stage.
- **L9. Latent default-fallback in caller chains.** `injectPanaHint` (prompts.js:304) and `injectFollowupPanel` (ui.js:5905) fall back to the *default essay set* whenever the genre resolver returns null. Benign today only because NEUTRAL coverage ⊇ default coverage (hints 1–9 both; followups 1–10 both); adding a default `PANA_HINTS[10]` (or removing a NEUTRAL key) would silently reopen the leak for every layered genre. The contract "layer active + missing → NEUTRAL, never default" is enforced by data coverage, not by code, at these two call sites.
- **L10. System prompt mandatory rules say “copied into the student's essay” for all genres** (ui.js prompt body) — model-facing only; genre identity line and stage rules already correct.
- **L11. El Laboratorio critique artifact is the bilingual-upbringing paragraph for every genre** (acknowledged in alignment report §6; framing neutralized, artifact autobiographical).
- **L12. `getActiveTemplate()` never varies** (registry holds only the default template, gt.js:190-201); its per-stage `allowedSupport`/`blockedSupport` arrays are dormant (not injected into the prompt) — harmless today, a trap if someone starts consuming them expecting genre awareness.

**P0** — none found: no path puts default-essay coaching *content* into a layered genre's live coach cards, and the authorship gate/voice protection are provably global.

---

## 6. Silent vs detectable failure map

| Missing configuration | Behavior | Detectability |
|---|---|---|
| Layer id not in `ASSIGNMENT_LAYERS` (typo link) | default essay app, no message | **Silent** (chip only) — L6 |
| Layer id not in `COUNCIL_PROFILES` | inherits default autobiographical Council | **Silent** — L1 |
| Layer id not in start-here `GENRES` | default essay tutorial + genre dropped at app link | **Silent** — L3 |
| Profile missing `copy.<key>` / whole `copy` block | NEUTRAL (tokenized) | Safe-by-design; guarded by `genre_leakage_test.mjs` (30/30) |
| Profile missing `stageDisplay`/`milestones`/`stageSteps`/`placeholder` | NEUTRAL | Safe; guarded |
| Profile missing `coachFocus` | NEUTRAL_STAGE_FOCUS | Safe but generic (L7); `coachfocus_governance_test` covers governance |
| Profile missing `welcome` | generic-neutral welcome (ui.js:5210) | Safe |
| NEUTRAL_* set missing a stage key that the default set has | **falls through to default essay copy** at prompts.js:304 / ui.js:5905 | **Silent, latent** — L9; no test asserts NEUTRAL coverage ⊇ default coverage |
| Report/packet/log surfaces | always default STAGES names | **Silent** — L4; outside the leakage guard's harvest set |
| Council/reviewer JSON failures | explicit blocked/aborted states | Detectable (council.js status machine) |

---

## 7. Cell accounting statement

7 modes × 10 stages = 70 stage-cells. Every cell's label, entry message, task cues, coach focus, micro-prompts, hints, follow-ups, revision moves, preview desc/example, skills, badges, milestones, placeholder, welcome, review options, process-evidence and celebration behavior is determined by the §3.1 dimension table + engine-shared rows, with the only cell-level exceptions listed in §3.2 notes (st.10 micro-prompt fallback; college-ps partial copy coverage 1–9/1–3; st.7–10 single-cue convention). No other per-cell special cases exist in code.
