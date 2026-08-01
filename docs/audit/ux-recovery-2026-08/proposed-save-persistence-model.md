# Proposed Save & Persistence Model — Tu Pana Writing Studio

**Deliverable 14 · UX Recovery Audit · 2026-08 · Audit branch `audit/ux-recovery-v1`**
**Provisional candidate:** Concept B "The Honest Journey" (`future-state-concepts.md`) plus the two adopted
Concept-A elements — the **always-visible work rail** and the **explicit current-draft marker**.
**Evidence base:** `inventory/persistence-and-save-model.md` (findings F-1…F-16), principles
P4 / P5 / P12 (`target-experience-principles.md`).
**Scope:** future-state comparison specification only; not approved for implementation. No code changes in this document. All UI labels are
given as 'Spanish · English' pairs, matching the app's bilingual span system.

---

## 0. The model in one page

Per-stage keys (`tupana_writing_s1..s10`) remain the working truth; `tupana_draft` remains the
write-once Stage-6 authorship snapshot. Three structures are added around them, none of which
remodels existing data:

1. **A sidecar metadata store** (`tupana_artifact_meta`) recording, for every writing artifact,
   its last-modified timestamp and word count. This is what makes freshness legible (work rail),
   recency comparable (current-draft staleness detection), and imports describable (preview).
2. **An explicit current-draft marker** (`tupana_current_draft`). The packet consumes the marked
   text verbatim. `getFinalEssay()`'s stage-number heuristic is retired: with no marker, the
   Finish space blocks the packet behind a version picker; it never guesses.
3. **A snapshot ring** (`tupana_snapshots`) written before every overwrite-class event
   (import, restore, "bring here" over existing text, clear) so that every destructive path has
   a recoverable copy by construction (P4 acceptance form).

Every write in the app routes through one wrapper (`safeSet`) with a truthful three-state
indicator and a hard failure banner — no silent `catch(e){}` anywhere. Backup/import/clear leave
the routine "Mi trabajo · My Work" hub and move to 'Ajustes · Settings'. The origin-scoped
reality of localStorage gets a named, recurring surface: the card
**'Tu trabajo vive en este navegador · Your work lives in this browser'**.

---

## 1. The eight separated concerns

Each concern gets exactly one home, one trigger, and one truthful status source (P5, P12).
No concern's controls appear inside another concern's surface.

| # | Concern | Location | Trigger | Truthful status source |
|---|---|---|---|---|
| 1 | **Automatic persistence** | Editor header chip (no panel; zero clicks) | Keystroke debounce ≤5 s, blur, visibilitychange, pagehide, stage exit | `safeSet` result + dirty flag. Three states: 'Escribiendo… · Writing…' (dirty), '✓ Guardado hace un momento · Saved a moment ago' (last write OK, timestamp from `tupana_artifact_meta`), '⚠ No se pudo guardar · Couldn't save' (write threw). Never optimistic: the chip renders only from the last actual write result. |
| 2 | **Manual reassurance** | Work rail (always visible, §2) + 'Mi trabajo · My Work' hub in mode=work | Student glance / footer button | Per-artifact timestamps and word counts read from `tupana_artifact_meta`; the hub renders the same rows as the rail from the same source (P12: two surfaces, one source). |
| 3 | **Backup + restore** | 'Ajustes · Settings' → 'Copia de seguridad · Backup' section; plus contextual nudge cards (never modal) after Stage-6 save, after each Council run, and when `tupana_last_export` is older than 5 days of active work | Explicit tap; nudges are dismissible cards in the status rail | `tupana_last_export` timestamp, shown as 'Última copia: hace N días · Last backup: N days ago'. 'Nunca · Never' is displayed, not hidden. |
| 4 | **Process documentation** | Finish space (Process Note), micro-reflections in-flow at draft-save / S9 / S10 (unchanged placement) | Appears once `tupana_draft_saved` is true | Self-assembles from the decision ledger (`tupana_decisions` + `tupana_decisions_summary`); counts always exact (§5). |
| 5 | **Final review** | Finish space, section 'Revisar antes de entregar · Review before submitting' | `draftSaved && stage ≥ 9 && current-draft marker resolvable` | The marked draft's stage, timestamp, and word count; the packet diagnostic reads the identical marker record the packet builder reads. |
| 6 | **Export (report-only)** | Finish space, submit mode only | Explicit 'Preparar entrega · Prepare submission' act | Rendered from the same marker + ledger as concern 5. |
| 7 | **Submission (packet)** | Finish space, submit mode; primary recommended path | Same gate as 5 | Packet essay = marked draft text verbatim (§3). Diagnostic failures warn **before** copy, listing the failing check by name. |
| 8 | **Destructive management** | 'Ajustes · Settings' → separate screen 'Zona de datos · Data zone'. **Removed entirely from the My-Work hub** in both modes. | Two explicit navigations (Settings, then Data zone) | The clear flow states exactly which artifact families will be destroyed with live counts ("10 etapas, 214 decisiones, 1 borrador sellado…"), and the typed-confirm button stays disabled until either a backup is downloaded in-flow or the student ticks 'Entiendo que no hay copia · I understand there is no copy'. |

**Evidence:** inventory §4 — backup buried under 'Otras opciones' while the danger zone rides
along in every hub open (F-3, F-16). **Student consequence:** the destructive control is more
discoverable than the protective one. **Root cause:** one modal hosting four concerns.
**Systemic recommendation:** the table above — one home per concern; the hub keeps only
concerns 2 and (as an entry door) 5–7. **Acceptance test:** automated walk asserts the My-Work
hub DOM contains zero export/import/clear controls in mode=work; Settings contains no packet or
submission controls; the P5 acceptance form ("save affordance at stages 1–8 contains zero
submission, email, backup, or deletion controls") passes on every stage.

---

## 2. The work rail (adopted Concept-A element 1)

**Placement:** persistent side rail on desktop; bottom drawer with handle + notification dot on
mobile. Visible on every screen including stage transitions — the prior-work strip generalized
from "when the editor is empty" to "always".

**Contents (one row per artifact that exists, rendered from `tupana_artifact_meta`):**

- One row per non-empty `tupana_writing_s<N>`: stage name (genre-correct label), word count,
  freshness label. **Threshold: ≥1 character.** The 30-character minimum is retired (kills F-13).
- The current stage's row is **always** present even when empty ('Vacío aquí · Empty here').
- 'Primer borrador (sellado) · First draft (sealed)' row once `tupana_draft` exists, with its
  save date and a lock glyph.
- Compact status rows: Voice Vault count, decisions count (exact, §5), last Council run date.
- The current-draft marker pin on exactly one row (§3).

**Freshness labels** (computed from timestamps, re-rendered on the minute):
'hace un momento · a moment ago' (<2 min) → 'hace N min · N min ago' → 'hoy · today' →
'ayer · yesterday' → 'hace N días · N days ago'. Artifacts predating the metadata migration
show 'antes de la actualización · before the update' — never a fabricated time (P12).

**Empty-state rules — an unexplained blank editor is impossible by construction:**

1. Editor empty + any earlier artifact exists → the rail highlights the most recent one:
   'Tu trabajo más reciente está en {etapa} · Your latest work is in {stage}', with two actions:
   'Ir allí · Go there' and 'Traerlo aquí · Bring it here' (bring-here follows §4's overwrite
   rules: if the destination has ≥1 character, a snapshot is written first and the card shows
   what will be replaced).
2. Editor empty + no artifact anywhere in this origin → the rail shows the origin-reality card
   (§8): 'Este navegador no tiene trabajo guardado. ¿Empezaste en otro lugar? ·
   This browser has no saved work. Did you start somewhere else?' with the import journey.
3. Rail highlight dismissal persists per stage in `tupana_artifact_meta` (not in-memory), and
   re-arms whenever the stage's own text changes or the student returns after >24 h.

**Evidence:** inventory §2.3 items 1–4 (residual blank-editor holes) and F-1. **Student
consequence:** blank editor read as lost work. **Root cause:** explanation surfaces were
conditional (empty-editor-only, ≥30 chars, in-memory dismissal). **Systemic recommendation:**
the rail above — unconditional presence, 1-char threshold, persistent dismissal state, and a
defined message for the no-work-anywhere case. **Acceptance test:** state-machine walk
enumerates every (stage, editor-empty?, artifacts-present?) combination and asserts that
whenever the editor is empty, exactly one of rules 1–2 renders; zero combinations render a bare
editor with work present anywhere in the store.

---

## 3. The current-draft marker (adopted Concept-A element 2)

**Record:** `tupana_current_draft` = `{ stage, signature (normalized-text hash), markedAt,
markedBy: 'auto-stage6' | 'student' }`.

**When it is set:**

- **Automatically once**, at the Stage-6 `executeSave` ceremony: the sealed first draft's stage
  becomes the marked version ('Por ahora, tu versión actual es tu primer borrador · For now,
  your current version is your first draft'). This guarantees the marker always resolves from
  Stage 6 onward — the packet gate never dead-ends.
- **By the student, explicitly**, from any writing-stage row in the work rail or the editor
  header: 'Marcar como versión actual · Mark as current version'. Marking re-computes the
  signature and moves the pin; the previous marked text is not snapshotted (it still lives in
  its own stage key — nothing is overwritten by marking).

**How it is displayed:** pin + label 'Versión actual ✓ · Current version ✓' on exactly one rail
row; the same chip in the editor header when the student is editing the marked stage; the Finish
space names it in full: 'Tu entrega usará: {etapa}, {N} palabras, guardada {fecha} ·
Your submission will use: {stage}, {N} words, saved {date}'.

**How the packet consumes it:** the packet builder reads `tupana_current_draft`, verifies the
signature still matches that stage's stored text, and inserts that text verbatim. The
`getFinalEssay()` candidate-ranking heuristic (revised-ness → stage number → length) is retired.
If the marker record is missing or its stage key was emptied, the Finish space **blocks** the
packet behind a version picker listing every non-empty candidate with timestamp and word count
('Elige tu versión actual para continuar · Choose your current version to continue'). No
heuristic fallback exists in any path.

**If the student edits a different stage after marking:** editing the *marked* stage simply
updates its text and signature — the marker follows the stage, no prompt. Editing any *other*
writing stage so that its timestamp becomes newer than the marked artifact's causes: (a) that
rail row gains the tag 'Más reciente que tu versión marcada · Newer than your marked version';
(b) entering the Finish space triggers a reconcile prompt showing both versions side by side
(stage, date, words) with exactly two actions — 'Mantener la marcada · Keep the marked one' /
'Marcar esta más nueva · Mark this newer one'. Keeping records a `markedBy: 'student'`
re-confirmation so the prompt does not repeat until recency changes again.

**Evidence:** F-6 and inventory §2.4 — s8 beats a newer s7 rewrite, discoverable only inside the
packet body. **Student consequence:** submitting an older text than the one last worked on.
**Root cause:** no stored designation of "final" + no timestamps, forcing a guess at packet
time. **Systemic recommendation:** stored marker + sidecar timestamps + blocking picker instead
of any guess. **Acceptance test:** scripted journey — write s7, mark it, rewrite s8, open
Finish: reconcile prompt must appear; choose "keep marked"; packet body must equal
`tupana_writing_s7` byte-for-byte; delete the marker key in devtools and reopen Finish: the
picker must block the packet.

---

## 4. Import / restore redesign

**Export format change (backward-compatible additions):** the backup JSON gains a `_meta`
envelope — `{ exportedAt, origin, appVersion, schema, assignmentId, wordCountsByStage,
draftPresent }`. Legacy backups without `_meta` remain importable; the preview then computes
counts from the payload and labels the date 'desconocida (copia antigua) · unknown (old
backup)'.

**Import flow (replaces the current pick → apply → reload):**

1. **Pick file** → parse. Parse failure: named error, nothing written.
2. **Preview screen** (full screen, not a toast): two columns — 'En este archivo · In this
   file' vs 'En este navegador · In this browser': export date, origin, assignment, per-stage
   word counts, first-draft present, decisions count. Rows where the file is older than local
   are tagged '⚠ más antiguo · older'.
3. **Explicit choice — replace-only semantics.** Merge is retired: applying a backup replaces
   the entire `tupana_` prefix (keys present locally but absent from the file are deleted), so
   hybrid states (new stage pointer over old texts) cannot be constructed. The single action is
   'Reemplazar todo lo de este navegador con este archivo · Replace everything in this browser
   with this file', plus 'Cancelar · Cancel'. When the local store is factory-fresh the copy
   softens ('Cargar mi trabajo · Load my work') but the semantics are identical.
4. **Automatic pre-import safety export**, always, before any write: a snapshot of the current
   store is written to the `tupana_snapshots` ring (reason: `pre-import`) **and** a file
   download `tupana-copia-de-seguridad-antes-de-importar-YYYY-MM-DD.json` is triggered. The
   confirm button enables only after the snapshot write succeeds.
5. Apply → reload. Post-boot, a status-rail card confirms what happened: 'Se cargó la copia del
   {fecha}. Tu trabajo anterior está en Ajustes → Restaurar · Loaded the backup from {date}.
   Your previous work is in Settings → Restore'.

**Restore (new, in Settings):** lists the snapshot ring (§5) with reason + date; restoring
writes a `pre-restore` snapshot first, then replaces the prefix from the chosen snapshot. Every
restore is therefore itself undoable one level.

**Evidence:** F-2 (`storage.js:114-136`, `_applyTupanaBackup` merge, no confirm/preview/safety
copy) and F-9 (1–9-char silent overwrite in the bring-here card — same class; §2's snapshot-
before-overwrite rule closes it at ≥1 char). **Student consequence:** picking an older or wrong
file — or another student's on a shared device — instantly and unrecoverably overwrites newer
work. **Root cause:** import treated as a low-stakes settings action instead of the single most
destructive write in the app. **Systemic recommendation:** preview + explicit replace + always-
on safety snapshot; no write path applies foreign data without both. **Acceptance test:**
import an older backup over newer work: the preview must tag the older rows, the snapshot ring
must gain a `pre-import` entry whose stage texts equal the pre-import store, and Settings →
Restore must reproduce the pre-import state exactly. Import a file missing `tupana_draft` over
a store that has one: after apply, `tupana_draft` must be absent (replace, not merge).

---

## 5. Versioning & retention

**Snapshot ring (`tupana_snapshots`):** entries `{ ts, reason, keys: {…} }` covering writing
keys + draft + marker only (not chatlog/telemetry — the ring protects *work*, and this bounds
its size). Written at: `pre-import`, `pre-restore`, `pre-clear` (the clear flow's last act
before wipe is a downloaded file, not a stored snapshot — the store is about to die),
`bring-here overwrite` (destination ≥1 char), and `mark-change` when a reconcile prompt's
choice discards recency. Ring size: max 10 entries or 1 MB serialized, oldest evicted with a
visible count in Settings ('las copias más antiguas se eliminan al llegar a 10 · oldest
snapshots are removed at 10') — eviction is disclosed, never silent.

**Decision-log retention (replaces the 50-cap):** `tupana_decisions` keeps full entries with no
fixed cap. At 500 entries **or** when the storage budget (below) crosses 80%, the oldest 100
entries are **compacted, not discarded**: exact per-stage, per-decision-type tallies are added
into `tupana_decisions_summary`, and the log panel renders a labeled first row — 'Las primeras
{N} decisiones se resumieron para ahorrar espacio; los totales siguen siendo exactos · The
first {N} decisions were summarized to save space; totals remain exact'. Every tally consumer
(Process Note, report, packet diagnostic) reads `summary + live log`, so counts never
undercount (F-4 closed). The same pattern applies to the chatlog's 120-cap: entries may still
rotate, but message counts come from an uncapped counter `tupana_chat_counts`, and the chat
panel labels rotation ('los primeros mensajes ya no se muestran · earliest messages no longer
shown'). Council history keeps its per-project cap, but each dropped run's decisions and
verifications are already mirrored in the decisions ledger before the run body is evicted, and
the Council history header shows 'N revisiones anteriores archivadas · N earlier reviews
archived' (F-12 disclosed).

**Storage-quota strategy:** `safeSet` maintains a running serialized-size estimate against a
4 MB working budget. At 80%: status-rail notice + backup nudge + decision-log compaction runs.
At write failure: §6's hard banner. Telemetry-class keys (`tupana_process_log`,
`tupana_sessions`, `tupana_eval_stats`) get their own caps (process_log rotates at 1000 events
into a counters summary) so telemetry can never crowd out student writing.

**Evidence:** F-4 (`log.slice(-50)` at every write), F-10, F-12; inventory §1.5 (no
timestamps, no migration machinery). **Student consequence:** the packet's AI-literacy evidence
silently undercounts on exactly the long, engaged projects it exists to document. **Root
cause:** flat caps chosen for quota safety with no summarization layer. **Systemic
recommendation:** compaction-with-exact-tallies as the universal cap pattern; disclosure
wherever anything rotates. **Acceptance test:** seed 620 decisions; the Process Note tally must
equal 620 exactly; the log panel must show the compaction row with N=100-multiples; report and
packet diagnostic counts must match the Process Note (P12 single-source check).

---

## 6. Write-failure and Safari-eviction honesty

**Single write path:** every `localStorage.setItem` in app code is replaced by `safeSet(key,
value)`; a lint/test guard (`storage_keys_test.mjs` extended) fails the suite on any bare
`setItem` outside `storage.js`. On throw, `safeSet` records the failure, and:

- The editor chip enters '⚠ No se pudo guardar · Couldn't save' (already truthful for autosave;
  now every write feeds it).
- A persistent banner (not a toast) states what happened, what survived, and the one next step
  (P10): 'Este navegador no está guardando tu trabajo. Lo que ves sigue aquí mientras no
  cierres la pestaña. Descarga una copia ahora. · This browser is not saving your work. What
  you see is still here until you close this tab. Download a copy now.' The download button
  builds the export from **in-memory state merged over storage**, so the copy contains the
  unsaved text.
- The hub line 'Tu escritura se guarda automáticamente en este navegador' is suppressed while
  the failure state is active — the app never claims autosave while writes fail (F-5, P12).

**Safari/ITP eviction:** on every boot (iframe or not), the app calls
`navigator.storage.persist()`. If persistence is not granted and the browser is ITP-class, a
status-rail item appears — 'Safari puede borrar tu trabajo tras 7 días sin visitar. Descarga
una copia. · Safari can erase your work after 7 days away. Download a copy.' — dismissible for
7 days via a dated localStorage key (not sessionStorage, so the dismissal itself survives the
session; the iframe-only `tupana_persist_warn` path is retired). Additionally, if the gap since
the last `tupana_sessions` entry exceeds 5 days at boot, the backup nudge (§1 concern 3) fires
regardless of browser.

**Evidence:** F-5 (silent `catch(e){}` everywhere but autosave), F-7 (warning iframe-only +
collapsed tip), F-14 (no unsaved state). **Student consequence:** app claims local autosave in
private mode / under quota while nothing lands; standalone-Safari students never hear about
eviction. **Root cause:** per-callsite error handling and an iframe-scoped warning heuristic.
**Systemic recommendation:** one write wrapper, one failure surface, boot-time persistence
request everywhere. **Acceptance test:** run the journey with a storage mock that throws: chip
must show the failure state within one write, banner must appear, export must contain the text
typed after the first failure, and no surface anywhere may display '✓ Guardado' or the
autosave reassurance line while the mock throws.

---

## 7. Origin/device reality surface

**The card:** 'Tu trabajo vive en este navegador · Your work lives in this browser' — body copy
names the three facts students currently have to discover by loss: it is not an account; a
different browser, device, or link is a different place; a downloaded copy is how work travels.

**Where it appears:**

1. **Onboarding**, as its own step before first writing (one screen, one fact set — P2), ending
   with 'Entendido · Got it'.
2. **Factory-fresh boot** when the store is empty: the work rail's rule-2 state (§2) leads with
   '¿Empezaste en otro lugar? · Did you start somewhere else?' and offers
   'Cargar una copia (.json) · Load a backup (.json)' → the §4 import journey (which, on a
   factory-fresh store, is one confirmation). This is the F-1 moment: a returning student on a
   new origin/device now meets an explanation and a recovery door instead of silent onboarding
   over an apparently empty app.
3. **'Ajustes · Settings'**, pinned atop the Backup section, showing the origin string itself
   ('Guardado en: tupana-preview.pages.dev · Stored at: tupana-preview.pages.dev') — making
   preview-vs-production visible for the first time.
4. **Finish space**, as 'Llévate tu trabajo · Take your work with you' with a one-tap export —
   the end-of-journey moment when leaving the device is most likely.

**Journey it offers:** export here → move the file (email/drive/USB — the copy names examples)
→ open the app there → the factory-fresh boot's 'Load a backup' door → §4 preview → replace.

**Evidence:** F-1 and inventory §5 — no origin cue, no blank-here-≠-gone messaging, migration
path reachable only by prior knowledge. **Student consequence:** the founder's son's statement
lives only in one origin's store; any other entry point reads as total loss and invites a
duplicate start while the real store ages toward eviction. **Root cause:** the app's true
storage model was never stated anywhere a student would meet it before losing work.
**Systemic recommendation:** the four surfaces above plus the import door on empty boot.
**Acceptance test:** walk a factory-fresh origin with a valid backup file: from first paint, the
student must reach a restored, stage-correct workspace in ≤4 interactions (card → load → preview
→ confirm) without opening any collapsed section; onboarding must not begin until the student
declines the "started somewhere else?" door.

---

## 8. Disposition of every existing key (all 44 names/families)

Prefix-scoped export/import/clear semantics are retained: every kept and new `tupana_` key
participates automatically. New keys introduced by this model: `tupana_artifact_meta`,
`tupana_current_draft`, `tupana_snapshots`, `tupana_decisions_summary`, `tupana_chat_counts`,
`tupana_last_export`, `tupana_eviction_notice` (dated dismissal). Schema stamp moves to `'2.0'`
and is **read at boot** for the first time: a `'1.0'`/absent store triggers the one-time
migration (seed `tupana_artifact_meta` with 'before the update' entries for existing artifacts;
seed `tupana_current_draft` from `tupana_draft` if saved and unmarked).

### 8.1 Student writing artifacts (13)

| Key | Disposition | Notes |
|---|---|---|
| `tupana_writing_s<N>` (family) | **KEEP** | Unchanged format; timestamps live in the sidecar, not in the value — no data rewrite. |
| `tupana_draft` | **KEEP** | Still write-once at Stage 6; seeds the initial current-draft marker. |
| `tupana_draft_saved` | **KEEP** | Same gates. |
| `tupana_protected` | **KEEP** | Removal gains a 6-second undo toast (closes F-15); writes via `safeSet`. |
| `tupana_mani_sentence` | **KEEP** | |
| `tupana_process_note` | **KEEP** | Whole-object writes via `safeSet`; multi-tab race accepted for v2 (F-8 deferred, disclosed in roadmap). |
| `tupana_capstone` | **KEEP** | |
| `tupana_council_runs` | **KEEP** | Cap retained; archived-run count disclosed; decisions/verifications mirrored to the ledger before eviction (§5). |
| `tupana_full_draft_reviews` | **KEEP** | |
| `tupana_decisions` | **KEEP** | 50-cap slice removed; compaction into `tupana_decisions_summary` (§5). |
| `tupana_chatlog` | **KEEP** | 120-rotation retained but disclosed; exact counts move to `tupana_chat_counts`. |
| `tupana_revision_checkpoint` | **KEEP** | Signature invalidation now checks against the *marked* draft. |
| `tupana_report_meta` | **KEEP** | |

### 8.2 Journey/position state (17)

| Key | Disposition | Notes |
|---|---|---|
| `tupana_stage` | **KEEP** | |
| `tupana_step_<stageId>` (family) | **KEEP** | |
| `tupana_completion_shown` | **KEEP** | |
| `tupana_skills_acquired` | **KEEP** | |
| `tupana_lab_done` | **KEEP** | |
| `tupana_mani_done` | **KEEP** | |
| `tupana_mani_claimed` | **KEEP** | |
| `tupana_onboarding_complete` | **KEEP** | Onboarding now includes the origin-reality step (§7.1). |
| `tupana_project_chosen` | **KEEP** | |
| `tupana_tutorial_done` | **KEEP** | Still written by `start-here.html`. |
| `tupana_assignment_id` | **KEEP** | Also echoed into export `_meta`. |
| `tupana_template_id` | **KEEP** | |
| `tupana_schema_version` | **KEEP — now consulted** | Bump to `'2.0'`; boot migration as above; import back-fill logic extends to seed the sidecar for legacy backups. |
| `tupana_process_log` | **KEEP** | Rotates at 1000 events into counters (§5 quota strategy). |
| `tupana_sessions` | **KEEP** | Also feeds the 5-day-gap backup nudge (§6). |
| `tupana_eval_stats` | **KEEP** | |
| `tupana_ai_usage` | **KEEP** | |

### 8.3 Preferences & one-time-hint flags (11)

`tupana_lang`, `tupana_tone`, `tupana_theme`, `tupana_coach_mode`, `tupana_journey_expand`,
`tupana_progress_collapsed`, `tupana_spotlight_off`, `tupana_fiveq_stage7_opened_once`,
`tupana_eval_hint_seen`, `tupana_ai_cue_seen`, `tupana_reflect_shown_<stageId>` (family) —
**all KEEP**, unchanged semantics, writes routed through `safeSet`. All still reset by clear
(deliberate shared-device behavior).

### 8.4 sessionStorage (3)

| Key | Disposition | Notes |
|---|---|---|
| `tupana_warn_dismissed` | **KEEP** | Per-tab dismissal of the in-tab warning remains correctly session-scoped. |
| `tupana_persist_warn` | **RETIRE** | The iframe-only Safari warning is replaced by the universal boot-time persistence check with a dated localStorage dismissal (`tupana_eviction_notice`, §6) — the warning must outlive the session that dismissed it. |
| `tupana_voice_challenge_shown` | **KEEP** | |

**No key is renamed and none are merged**: Concept B's explicit constraint is no persistence
remodel, so in-flight student work (including the founder's son's admissions statement) boots
into the new model untouched, gaining only sidecar metadata.

**Evidence:** inventory §1 (44 names/families; schema stamp written, never read). **Student
consequence (of acting otherwise):** any rename/merge forces a migration of live student data
for zero student-visible benefit. **Root cause of the current gap:** versioning existed as a
stamp without a reader. **Systemic recommendation:** additive keys only; the stamp becomes a
real gate with exactly one defined migration. **Acceptance test:** boot a captured pre-change
localStorage fixture (real journey snapshot): every 1.1–1.3 key must survive byte-identical
except additive sidecar entries; `storage_keys_test.mjs` updated to the new inventory (44 + 7)
and green; export → clear → import round-trip must reproduce the store exactly, including the
new keys.

---

## 9. How the P0 overwrite and P1 apparent-loss hazards become structurally impossible

- **F-1 (P1 origin-scoped invisibility):** an empty store can no longer render a bare editor or
  unexplained onboarding — the work rail's rule-2 state and the factory-fresh boot door (§7.2)
  are unconditional, and the origin string is displayed in Settings. The loss *mechanism*
  (origin-scoped storage) remains by design; the loss *experience* (silence) is removed at
  every entry point, and the export journey is offered at the four moments it matters.
- **F-2 (P0 unconfirmed merge-import):** the merge write path no longer exists; the only apply
  operation is preview → explicit replace → mandatory pre-import snapshot + safety download.
  An import that destroys newer work without a recoverable copy is unreachable in the redesign.

Traceability: F-1 §7 · F-2 §4 · F-3 §1(#8) · F-4/F-10/F-12 §5 · F-5/F-7/F-14 §6 · F-6 §3 ·
F-9 §2/§4 · F-13 §2 · F-15 §8.1 · F-16 §1(#3). F-8 (multi-tab) and F-11 beyond the schema-gate
(future migrations) are consciously deferred to the roadmap; both are disclosed here rather
than silently out of scope.
