# Tu Pana Writing Studio — Student-Artifact & Persistence Map + Save/Finish/Submission Model Assessment

**UX Recovery Audit — Agent C · 2026-07-31**
**Repo:** `/Users/Victor1/Sites/tupana-audit` (read-only audit worktree, post-remediation `09c7a91` model)
**Ground truth sources:** `assets/js/ui.js`, `assets/js/storage.js`, `assets/js/app.js`, `assets/js/council.js`, `assets/js/ai-provider.js`, `assets/js/genre-template.js`, `index.html`, `start-here.html`

---

## 1. Complete localStorage key inventory

All persistence is prefix-scoped: export, import, and clear operate on **every key beginning `tupana_`** (`assets/js/storage.js:44-96`). This means **every key below survives refresh, is included in the .json backup, is written by import, and is destroyed by clearAllData()** — no exceptions. Column notes therefore focus on write/read timing and overwrite risk. No key carries per-key versioning; the only version marker is the app-wide `tupana_schema_version` (see §1.4).

**Count: 38 static localStorage keys + 3 dynamic key families (≈50+ concrete keys at end of journey) + 3 sessionStorage keys = 44 distinct names/families.**

### 1.1 Student writing artifacts (the work itself)

| Key | Stores | Written | Read | Overwrite risk |
|---|---|---|---|---|
| `tupana_writing_s<N>` (N=1–10) | Per-stage editor text — **the working truth** | Autosave ≤30 s cadence + blur + visibilitychange/pagehide (`ui.js:2374-2403`); on every stage exit (`ui.js:2042`); on import-offer accept (`ui.js:8856,8887,8894`); prior-work-strip "Traerla aquí" (`ui.js:8809`) | `loadStageWork()` on stage entry/reload (`ui.js:4631-4639`) | Last-write-wins across tabs; "Sí, traerlo" replaces up to 9 chars of existing next-stage text (§6 F-9); restoring an old backup overwrites newer values silently (§6 F-2) |
| `tupana_draft` | **Frozen Stage-6 unassisted first draft** (authorship gate) | Once, by `executeSave()` at Stage 6 only (`ui.js:2582`); write-once in practice (save button gated on `state.draftSaved`, editor disabled after) | Seed fallback for stages ≥6 (`ui.js:4636`), packet final-essay resolution (`ui.js:7720`), reports, revision-signature (`ui.js:7745`) | Very low in-app (locked). Import can replace it silently. |
| `tupana_draft_saved` | `'true'` flag — authorship gate passed | `executeSave()` (`ui.js:2583`) | Gates: Stage 7+ nav (`ui.js:2168`), Process Note section in hub (`ui.js:7145`), submission section (`ui.js:7155`), packet diagnostic (`ui.js:7891`), AI full-draft affordances (`ai-provider.js:256`) | Low |
| `tupana_protected` | Voice Vault entries (protected phrases, id + text) | `saveProtected()` on protect/remove, Stages 7–9 (`ui.js:407-412`) | Vault panel render, instructor report (`ui.js:7947`) | Low; whole-array rewrite (multi-tab race) |
| `tupana_mani_sentence` | "Tu Conocimiento" student sentence | Input handler in mani prompt (`ui.js:5405`) | Report builders, completion screens (`ui.js:2930,7197,8415`) | Low |
| `tupana_process_note` | Process Note answers Q3–Q8 **and** the 3 in-flow micro-reflections (`mr_*` sub-keys) | Debounced 400 ms per-field autosave (`ui.js:7307-7319`), micro-reflection save | Process Note modal, reports/packet | Whole-object read-modify-write; multi-tab race |
| `tupana_capstone` | Stage-10 self-assessment: ratings, reflections, `coachPerspective`, `studentResponse`, `completed`, `finalComplete`, `instrReportGenerated` | `saveCapstoneData()`/`_saveCapstoneRaw()` throughout Stage 10 (`ui.js:677-681,8364`) | Capstone panel restore (`app.js:79-91`), report, completion trigger (`ui.js:872`) | Whole-object rewrite |
| `tupana_council_runs` | Council runs per project: findings metadata, report, per-finding decisions, verifications (no draft text beyond anchored quotes) | `saveCouncilRun()`, `recordCouncilDecision()`, `recordCouncilVerification()` (`council.js:480-549`) | Council history UI | **Capped** at `COUNCIL_LIMITS.historyMax` per project (oldest silently dropped) |
| `tupana_full_draft_reviews` | Guided full-draft review history — **metadata only** (lens, word count, signature; never draft text) (`ui.js:3862-3919`) | On each full-draft review run | Review-purpose prompts (repeat/unchanged detection) | Low |
| `tupana_decisions` | Revision-decision log + checkpoint entries (AI-literacy evidence) | Eval cards, checkpoints, Stage-10 reflection — **every write is `log.slice(-50)`** (`ui.js:1570,5806,6156,6292`) | Decision log panel, tallies in Process Note/report/packet diagnostic | **Silent truncation at 50 entries** (§6 F-4) |
| `tupana_chatlog` | Coach conversation (both sides), msg ids, evals, stage tags | `saveChatEntry()` — **capped at 120 entries** (`ui.js:6371,6402-6410`) | `restoreChatLog()` on load; report message counts | Silent truncation at 120; read-modify-write race |
| `tupana_revision_checkpoint` | Student-reported "instructor said no revision needed" exception: mode, note, draft signature, assignmentId | Revision completion gate (`ui.js:7738-7833`) | `hasStudentReportedRevisionException()` (`ui.js:7758-7765`) — invalidated if draft signature or assignment changes | Low |
| `tupana_report_meta` | Student name / assignment title / course section typed into instructor-report form | `oninput` (`ui.js:8230-8249`) | `generateInstructorReport()` | Low |

### 1.2 Journey/position state

| Key | Stores | Written / read | Notes |
|---|---|---|---|
| `tupana_stage` | Current stage 1–10 | `goToStage()` (`ui.js:2056`); boot restore (`app.js:32-53`) | >10 triggers legacy-12-stage reset to Stage 1. Multi-tab last-write-wins. |
| `tupana_step_<stageId>` | Sub-step within a stage | `setStep` (`ui.js:1048`), read on stage entry (`ui.js:1039`) | |
| `tupana_completion_shown` | Process Note finished → completion celebration gate | `finishProcessNote()` (`ui.js:7245`); read at `ui.js:871,7274` | Gate for the persistent completion state |
| `tupana_skills_acquired` | Toolkit skill ids (Stage-6 skill gated on real save) | `unlockStageSkill()` (`ui.js:4667`) | |
| `tupana_lab_done`, `tupana_mani_done`, `tupana_mani_claimed`, `tupana_onboarding_complete`, `tupana_project_chosen`, `tupana_tutorial_done` (written by `start-here.html:619`) | Onboarding / AI-literacy-lab / knowledge-claims / tutorial completion flags | Various; read at boot (`app.js:139-162`) | Clearing these re-triggers onboarding for the next student — intentional factory-reset behavior |
| `tupana_assignment_id`, `tupana_template_id`, `tupana_schema_version` | Active genre layer; template identity; schema stamp `'1.0'` | URL param → persisted (`app.js:14-26`, `ui.js:5108-5118`); schema seeded once (`genre-template.js:2042-2044`); import back-fills legacy backups (`storage.js:77-82`) | **`tupana_schema_version` is written but never checked at boot — no migration machinery exists** |
| `tupana_process_log` | Structured process events (stage_advanced, first_draft_saved, …) | `logProcessEvent()` (`ui.js:4700-4712`) | Append-only, uncapped |
| `tupana_sessions` | Session timestamps (streak), capped 30 | `trackSession()` (`ui.js:6786-6801`) | |
| `tupana_eval_stats` | Eval totals/streaks per question | `updateEvalStats()` (`ui.js:6181-6220`) | |
| `tupana_ai_usage` | Aggregate Gemini token accounting (never text) | `_recordGeminiUsage()` (`ai-provider.js:113-145`) | |

### 1.3 Preferences & one-time-hint flags

`tupana_lang`, `tupana_tone`, `tupana_theme`, `tupana_coach_mode`, `tupana_journey_expand`, `tupana_progress_collapsed`, `tupana_spotlight_off`, `tupana_fiveq_stage7_opened_once`, `tupana_eval_hint_seen`, `tupana_ai_cue_seen`, `tupana_reflect_shown_<stageId>` — written at the interaction that sets them, read at boot/stage entry. Low risk; all reset by clear (deliberate for shared devices).

### 1.4 sessionStorage (transient, tab-scoped; NOT exported/imported; cleared by clearAllData)

`tupana_warn_dismissed` (`ui.js:1900`, `app.js:95`), `tupana_persist_warn` (`app.js:114-115`), `tupana_voice_challenge_shown` (`ui.js:6277`).

### 1.5 Versioning & migration reality

- Single app-wide stamp `tupana_schema_version = '1.0'`, seeded once (`genre-template.js:2042`), back-filled on legacy import (`storage.js:77-79`), **never read for migration decisions**.
- The only live migrations: stage>10 → reset to Stage 1 (`app.js:33-38`); chatlog entries get ids/evals back-filled (`ui.js:6418-6426`).
- No per-artifact timestamps on `tupana_writing_s<N>` / `tupana_draft` — "which is newer" is **unknowable** to both app and student (drives F-6).

---

## 2. Student-artifact flow map (journey trace)

### 2.1 The draft-text model — what is actually canonical

Current truth is a **hybrid, three-layer model**, not one canonical draft and not clean per-stage artifacts:

1. **Per-stage working texts** `tupana_writing_s1..s10` — the live truth. Autosaved; each stage owns its own text.
2. **Frozen first draft** `tupana_draft` — write-once snapshot at the Stage-6 ceremony (`ui.js:2561-2612`). Stages ≥6 with no per-stage key **seed from it silently** (`ui.js:4636`). Merely visiting a stage ≥7 and leaving materializes `writing_s<N>` as a copy of the draft (`ui.js:2042`).
3. **Computed "final essay"** — never stored. `getFinalEssay()` (`ui.js:7718-7736`) re-derives it at packet time: candidates = s7/s8/s9 + current unsaved editor; prefers *revised-vs-first-draft* (normalized comparison), then **higher stage number**, then length. There is no stored designation of "this is my final version."

### 2.2 Carry-forward behavior by artifact

| Artifact | Carries forward automatically? | Offered? | Shown as context? | Silent-overwrite exposure | Recovery of earlier version |
|---|---|---|---|---|---|
| Stage texts s1–s5 | **No** — each early stage starts empty | Yes: forward-transition import card when prior stage ≥30 chars (`ui.js:2086-2093`, `_offerTransitionImport` `ui.js:8821`); prior-work strip when editor empty and nearest earlier stage ≥30 chars (`ui.js:8774-8818`) | Strip names stage + word count | "Sí, traerlo" replaces next-stage text when it is 1–9 chars (`ui.js:8825,8853-8858`) | Earlier stage text remains in its own key; reachable via "Ir a esa etapa" or stage map |
| First draft → stages 7–10 | **Yes, silently** (seed fallback `ui.js:4636`) | n/a | Restore toast "Borrador anterior restaurado" at ≥6 (`ui.js:4736`) | None (draft locked) | `tupana_draft` immutable; always in packet as "first draft" |
| Revision text s7↔s8↔s9 | No auto-copy; forward moves get the import card; backward moves show that stage's own text | Yes (same card, with above/below/keep options when destination ≥10 chars, `ui.js:8860-8897`) | Prior-work strip | Merge choices are explicit; but nothing warns that the *packet* may pick a different stage than the one being edited (F-6) | Per-stage keys persist; no in-app diff/history beyond in-memory undo (`ui.js:2408-2439`, lost on reload/stage switch) |
| Vault phrases | Persist across stages 7–9, panel injected per stage (`ui.js:2145`) | — | Count badge + list; status per phrase (still-in-draft indicator) | Removal is one click, no confirm (minor) | None once removed |
| Council runs/decisions | Persist per project | — | History in council UI | Oldest runs dropped at cap | None past cap |
| Full-draft reviews | Metadata persists | — | Purpose prompts reference history | — | n/a (no text stored) |
| Process Note + micro-reflections | Persist; merged into packet | Hub button appears once `draftSaved` | Per-field saved indicator | Whole-object races only | No history |
| Decisions/checkpoints | Persist **up to 50** | — | Decision log panel | **Oldest silently discarded** | None |
| Tutorial/lab/onboarding state | Persist | — | — | — | — |

### 2.3 Blank-editor inventory (all nav paths)

Post-remediation, the F3 fix (`ui.js:2082-2094`, strip `ui.js:8768-8818`) covers most paths. Residual holes:

1. **Earlier work of 1–29 chars**: both the transition offer (≥30, `ui.js:2088`) and the strip (`_nearestEarlierWork` ≥30, `ui.js:8777`) ignore it → blank editor with real (small) work present, unexplained. Low content value; P3.
2. **Strip dismissal persistence**: `_priorStripDismissed` is in-memory per pageload but per-stage (`ui.js:8773`); after dismissing, re-entering the same stage in the same session shows nothing even if the student forgot. P3.
3. **Different origin/device**: the big one — editor is blank because the *storage* is different, and nothing in-app explains it (§5, F-1).
4. **Import of a partial/foreign backup**: can yield stage pointer + blank stage texts combinations the strip explains only partially (F-2).
5. Stage ≥6 always falls back to `tupana_draft`, so once the first draft exists, revision stages are never blank; a student who deletes everything at s7 (autosaved `''`) later meets a blank s7 — but the strip fires (editor empty + earlier work exists). Explained. OK.

### 2.4 "How does a student know which version is current?"

Partially answered, not fully: the work-hub inventory lists words-per-stage (`_workStageInventory`, `ui.js:7112-7132`) and the current editor count — good. But **nothing shows which stage's text `getFinalEssay()` will select as the packet essay** until the submit-mode diagnostic, and the selection prefers stage number over recency (no timestamps). A student who polishes at s8, then goes back and substantially rewrites at s7, submits the **older s8 text** (both count as "revised"; sort at `ui.js:7730` breaks ties by stage desc). See F-6.

---

## 3. Save/finish/submission surface as shipped

### 3.1 Automatic persistence & indicator truthfulness

- Autosave: ≤30 s cadence during typing, immediate on blur/visibilitychange/pagehide (`ui.js:2340-2403`). Refuses the locked Stage-6 editor. Stage transitions save the outgoing stage first (`ui.js:2042`).
- Indicator (`#autosaveStatus`, `ui.js:2344-2364`) is **truthful**: "✓ Guardado" only after a successful write; explicit error state pointing at backup on failure. Gaps: no "unsaved changes" state between writes (up to 30 s of exposure on hard crash/power loss, P3), and **only autosave surfaces write failures** — every other `setItem` in the codebase is `try{}catch(e){}` silent (F-5).
- Hub copy "Tu escritura se guarda automáticamente en este navegador" (`ui.js:7137`) is accurate and correctly scoped ("in this browser… nothing is sent").

### 3.2 Manual save affordances

- The only manual "save" is the **Stage-6 ceremony** (Guardar → confirm modal → `executeSave`, `ui.js:2543-2612`) — deliberately a one-time authorship event, not a routine save. Correct post-remediation: routine reassurance moved to the hub instead of a fake save button. No manual save exists elsewhere; reassurance = autosave indicator + hub status.

### 3.3 "Mi trabajo" hub (`openReport`, `ui.js:7167-7188`; modal `index.html:902-970`)

- **mode=work** (footer button, `index.html:214`): Save-status section (current editor words + per-stage inventory + first-draft status) → Process Note section **only if `draftSaved`** → "Preparar entrega →" section **only if `draftSaved && stage ≥ 9`** (`ui.js:7123-7164`). Packet buttons and report-only group hidden (`ui.js:7182-7185`).
- **mode=submit** (from the work hub's gate, or the journey-complete card `ui.js:7290`): packet diagnostic (`buildPacketDiagnosticHTML`, `ui.js:7898-7912`) + AI-activity summary + full report + packet copy/download (`index.html:918-927`) + report-only copy/download/email group.
- **Always present in BOTH modes** (static modal footer): "Otras opciones" collapsed details holding backup export/import (`index.html:929-941`), and the "Zona de peligro" collapsed details holding Clear my data (`index.html:955-963`), plus the collapsed Safari-7-day tip (`index.html:965-968`).

### 3.4 Backup / restore

- Export: full prefix snapshot to `tupana-backup-YYYY-MM-DD.json` (`storage.js:101-112`). Solid.
- Import: file picker → JSON parse → **immediate merge-apply + reload** (`storage.js:114-136`). **No confirmation, no preview, no pre-import auto-backup, merge (not replace) semantics** (`_applyTupanaBackup`, `storage.js:69-84`) — see F-2.

### 3.5 Export / email / packet

- Packet = `generateInstructorReport()` (essay resolved by `getFinalEssay()` + process report + submission check); copy warns *after* copying if diagnostics fail (`ui.js:7917-7926`) — acceptable, explicit.
- Report-only copy/download/email exist solely in submit mode. Email = `mailto:` with body truncated to 1800 chars + auto-download of the full .txt (`ui.js:7685-7692`) — honest about the truncation.

### 3.6 Destructive clear

`clearAllData()` (`storage.js:138-154`): collapsed danger-zone summary labeled "cannot be undone" → hint "download a backup first" → `confirm()` naming what dies → typed `BORRAR`/`DELETE` prompt → full prefix wipe of local+session storage → reload. Friction is real and bilingual. Residuals: no *offered* one-click backup inside the flow itself, and the danger zone rides along in every routine hub open (F-3).

### 3.7 Process Note timing

Appears in the hub the moment it can mean something (after the Stage-6 authorship save); deep completion is prompted only after the instructor report is generated (`closeCapstoneModal`, `ui.js:863-877`); `finishProcessNote` is itself gated on revision evidence (`ui.js:7238-7247`). Micro-reflections are injected in-flow at draft-save/S9/S10 (`ui.js:2154-2155,2609`). Timing is now correct.

---

## 4. Assessment against the target separation

| Concern | Earliest moment it's relevant | When it first appears | Verdict |
|---|---|---|---|
| Automatic persistence | First keystroke | First keystroke (autosave) | ✅ Aligned |
| Manual reassurance | First worry ("did it save?") | Autosave indicator + hub always via footer | ✅ Aligned; indicator lacks an "unsaved" state (P3) |
| Backup | First substantial work / any Safari-in-Brightspace session | Hub, but **buried under collapsed "Otras opciones"** while the tip says "export regularly" | ⚠️ Mistimed discoverability — never surfaced proactively at moments of accumulated value (e.g., after Stage-6 save) except on autosave *failure* |
| Process documentation | After authorship draft exists | Hub gated on `draftSaved`; micro-reflections in-flow | ✅ Aligned |
| Final review | Near the end | Submit mode gated `draftSaved && stage≥9` | ✅ Aligned |
| Export (report-only) | Submission time | Submit mode only | ✅ Aligned |
| Submission | Stage 9–10 | Submit mode; packet primary, single recommended path | ✅ Aligned |
| Destructive management | Device handoff / end of course — essentially *never* during writing | **Every hub open, from day one**, in both modes (collapsed) | ⚠️ Still co-located with routine reassurance; collapsed + double-confirm mitigates but does not separate |

The remediation genuinely de-conflated the earlier model. The remaining conflations are: (a) backup + import + clear all live in the same modal as routine save reassurance; (b) backup is *less* discoverable than the destructive control's summary line; (c) submission-adjacent "report only" options and backup share one "Otras opciones" mental bucket in submit mode.

---

## 5. Multi-device / multi-origin reality

- All state is **origin-scoped localStorage**. Work created at `tupana-preview.pages.dev` (the founder's son's link `…/start-here?assignment=college-personal-statement`), `localhost`, and any production origin are **three unrelated stores**. Nothing is synced; there are no accounts by design (`index.html:638-639` states this).
- **What the student experiences on switching**: the app boots at Stage 1 in factory state, runs first-visit onboarding (project selector / landing moment, `app.js:138-162`), and shows an empty editor. **No message ever says "you may have work in another browser/device/link."** The prior-work strip cannot help — the other origin's keys are invisible. To the student this is indistinguishable from total data loss.
- Even *same device, different entry URL* triggers it (preview link vs production link; http vs https; `www.` vs apex).
- Warnings that do exist: the once-per-session Brightspace/Safari tip fires **only inside an iframe** (`app.js:113-123`); the 7-day-eviction tip is a collapsed `<details>` at the bottom of the hub (`index.html:965-968`); the privacy note in onboarding says "only in this browser."
- **Only migration path**: manual `exportData()` → transfer file → `importData()` on the other origin — correctly described in the backup hint (`index.html:935`) but reachable only if the student already knows to open the hub → Otras opciones *before* leaving the first device. The import side then applies with merge semantics and no confirmation (F-2).

---

## 6. Findings (severity-tagged)

**P0 — demonstrated irreversible loss / overwrite**

- **F-2 · P0 — `importData()` applies a backup silently, with merge semantics and no safety copy** (`storage.js:114-136`, `_applyTupanaBackup` `storage.js:69-84`). Picking an older or wrong file (or another student's backup on a shared device) instantly overwrites newer `tupana_writing_s*`/`tupana_draft` values; keys present locally but absent from the file survive, producing hybrid states (e.g., new stage pointer over old texts). No confirm, no preview ("this file is from DATE, contains N words at stages…"), no automatic pre-import export. Unrecoverable unless the student manually exported first.

**P1 — likely loss of student work/evidence or trust-breaking gaps**

- **F-1 · P1 — Origin-scoped work is invisible and unexplained across devices/origins.** No origin-identity cue, no "blank here ≠ gone" messaging on first-run boot (`app.js:138-162`), no proactive export prompt before the student leaves. Student consequence: the founder's son's statement lives only in `tupana-preview.pages.dev` storage on one browser profile; opening any other origin/device presents fresh onboarding over an empty app — reads as lost work, invites a duplicate start, and the real store can then age out (Safari 7-day) with nothing exported. The switch does not itself delete or overwrite the original store, so the package-wide rubric classifies it P1.
- **F-3 · P1 — Clear-data friction is good but incomplete.** `storage.js:138-154` + `index.html:955-963`: collapsed danger zone, confirm, typed keyword — yet the flow only *tells* the student to back up; it does not offer a one-tap "Download backup, then delete," and the control is present in every routine hub open from day one. Recoverability after the typed word: zero.
- **F-4 · P1 — `tupana_decisions` hard-capped at 50 with silent truncation at every write** (`ui.js:1570,5806,6156,6292`). The decision log is the packet's AI-literacy evidence; long projects silently shed their earliest decisions, and the report/Process-Note tallies undercount with no indication to student or instructor.
- **F-5 · P1 — Write failures are silent everywhere except the autosave path.** All persistence except `autosaveFlush` (`ui.js:2374-2388`) swallows exceptions (`catch(e) {}`): chatlog, decisions, process note, capstone, vault, council. Under quota pressure or Safari private mode, the app keeps claiming "auto-saves in this browser" (`ui.js:7137`, `index.html:980`) while nothing lands.
- **F-6 · P1 — The submitted "final essay" is chosen by heuristic, prefers stage number over recency, and the student is never shown which version was picked while still editing.** `getFinalEssay()` (`ui.js:7718-7736`): both s7 and s8 count as "revised" ⇒ s8 wins even if the student's newest rewrite is in s7. No timestamps exist to do better (§1.5). Student consequence: submitting an older text than the one they last worked on, discoverable only by reading the packet body.
- **F-7 · P1 — Safari/ITP 7-day eviction risk is disclosed only in a collapsed hub tip and an iframe-only chat message** (`index.html:965-968`, `app.js:116-121`). A student using standalone Safari (not inside Brightspace) — the likeliest personal-device case — never sees the warning that their entire project can be silently evicted after 7 days of not visiting.

**P2 — plausible loss/confusion under normal behavior**

- **F-8 · P2 — Multi-tab last-write-wins races.** Chatlog, decisions, process note, capstone, and `tupana_stage` are all read-modify-write with no `storage`-event sync. Two tabs (common in Brightspace) can interleave/clobber each other; per-stage texts silently revert to the other tab's version on its next flush.
- **F-9 · P2 — Import-offer "Sí, traerlo" replaces existing destination text of 1–9 chars without warning** (`hasNextText` threshold 10, `ui.js:8825,8853-8858`). Small in bytes, but it is a genuine silent overwrite path in the one card designed to prevent exactly that.
- **F-10 · P2 — Chatlog capped at 120 entries** (`ui.js:6371`): earliest coach exchanges vanish; report message counts and any instructor read-back of early process are silently partial.
- **F-11 · P2 — No migration machinery**: `tupana_schema_version` is written, back-filled, and never consulted (`genre-template.js:2042`, `storage.js:77-79`). Any future format change meets un-versioned per-key data with no upgrade path; today's exposure is latent but structural.
- **F-12 · P2 — Council run history capped** (`council.js:515`) — oldest runs (with their decisions/verifications) dropped without notice; the "council + decisions" evidence trail is bounded.

**P3 — polish**

- **F-13 · P3 — 1–29-char earlier work leaves a blank editor unexplained** (thresholds at `ui.js:2088` and `ui.js:8777`).
- **F-14 · P3 — No "unsaved changes" indicator state**; up to 30 s exposure on hard crash (`ui.js:2340,2390-2397`); undo history is in-memory only and dies on stage switch/reload (`ui.js:2408-2439`).
- **F-15 · P3 — Vault phrase removal is one un-confirmed click** (`ui.js:555`) with no undo.
- **F-16 · P3 — Backup discoverability**: "export regularly" is the advice, but the button sits behind a collapsed `<details>` two levels into a modal; no post-Stage-6 or post-council "good moment to back up" nudge exists.

---

## 7. Direct answers to the audit questions

- **Key count**: 38 static + 3 dynamic families (+3 sessionStorage) — inventory in storage.js's own comment matches the code (verified by grep; `storage_keys_test.mjs` guards the list).
- **One-canonical-draft vs per-stage?** Neither purely: **per-stage keys are the working truth; `tupana_draft` is a write-once Stage-6 snapshot; the "final" is computed at packet time and never stored.** The model is coherent internally but invisible to students at exactly one point — final-version selection (F-6).
- **Most dangerous loss paths, ranked**: (1) origin/device switch with no explanation and no proactive backup (F-1); (2) unconfirmed merge-import (F-2); (3) Safari 7-day eviction unwarned outside iframes (F-7); (4) decision-log truncation corroding the packet's evidence (F-4); (5) silent quota failures (F-5).
- **Can a student meet an unexplained blank editor while work exists?** Within one origin: only in the <30-char edge and after strip dismissal (P3). **Across origins: yes, always, and it is the app's single worst experience** (F-1).
