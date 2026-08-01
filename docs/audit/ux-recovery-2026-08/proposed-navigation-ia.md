# Proposed Navigation & Information Architecture — Concept B "The Honest Journey"

**Deliverable 13 · UX Recovery Audit 2026-08 · Provisional Concept B spec only — no code changes.**
Documents the comparison-ready Concept B candidate in `future-state-concepts.md`, plus the two
elements adopted from Concept A: the always-visible work rail and the explicit current-draft
marker. It is not an approved implementation direction. Evidence citations refer to
`inventory/screens-and-navigation.md` (surface numbers #1–#67,
findings F-1…F-22), `inventory/genre-stage-matrix.md` (L1–L12), `inventory/ai-interaction-model.md`,
`inventory/persistence-and-save-model.md`, and `target-experience-principles.md` (P1–P12).

Every change carries a five-part block: **Evidence → Student consequence → Root cause →
Systemic recommendation → Acceptance test.** Labels are given as `Español · English` pairs.

---

## 1. The single progress vocabulary (IA-1)

### 1.1 The vocabulary

One counted unit, one grouping, everywhere:

| Unit | Visible name | Count | Where it appears | Replaces |
|---|---|---|---|---|
| **Step** | `Paso N de 10 · Step N of 10` | 10 | Task bar counter, journey map nodes, gate reasons, Help position line, Back/Continue labels, reports/packet/process log | "Etapa N", "Paso N de 5", "Hito N" |
| **Act** | `Comenzar · Start` (steps 1–6) · `Revisar · Revise` (7–9) · `Finalizar · Finish` (10) | 3 | Calm progress bar (unchanged placement), journey-map group headers, act-completion notices | 5-milestone grouping in map/header/Help |

Rules:

1. **The word `Paso · Step` is reserved for the 10 journey units.** The three in-stage cues
   (`STAGE_STEPS` dots) keep their dots and cue text but lose any counted noun in visible text;
   their accessibility label is `Tarea 1 de 3 en este paso · Task 1 of 3 in this step` (aria only).
2. **`Etapa`, `Hito`, and `Paso N de 5` are banned strings** in rendered UI, reports, packets,
   process log, and gate messages. Step names resolve through `stLabel()` (genre layer → neutral →
   default) on **every** surface, including the report/packet/log family that currently reads
   `STAGES[n]` raw (closes L4).
3. **Milestones become private analytics.** `MILESTONES` may survive as an internal analytics
   dimension (celebration triggers, telemetry) but renders no student-facing text. Genre-authored
   milestone names (genre-stage-matrix §3.1 row "Milestone names") are retired from UI; genre
   identity is carried by the genre step names, which are richer (matrix §3.2).
4. **Act names are already the calm bar's names** (Comenzar/Revisar/Finalizar) — no new nouns
   are introduced; two of four vocabularies are deleted, one is demoted to aria.

- **Evidence:** F-4 (header "Paso 2 de 5" while mobile "Paso" selector lists 10 stages while a
  refusal says "Completa la Etapa 4"); bilingual inventory ("Etapa vs Paso vs Step — two Spanish
  words for the same unit"); L4 (default-essay stage names in every report surface).
- **Student consequence:** "Where am I?" has three simultaneous, mutually untranslated answers;
  instructor-facing documents name steps the student never saw.
- **Root cause:** four counting systems shipped in layers (phases, `MILESTONES`, `STAGES`,
  `STAGE_STEPS`) with no single owner of the word "Paso".
- **Systemic recommendation:** one rendering helper is the sole source of position strings
  (`Paso N de 10 — <stLabel>` + act); all surfaces, including exports, call it; a lint/walk test
  bans the retired strings.
- **Acceptance test:** automated walk over all screens, all 7 genre modes, both languages:
  (a) zero occurrences of `Etapa`, `Hito`, `de 5` in rendered text; (b) the position string is
  byte-identical across task bar, Help, and map for the same state; (c) packet/process-note/
  instructor-report/process-log render genre step names for a layered genre (seeded run).

### 1.2 Completion means evidence, not traversal (IA-2)

| State | Definition | Map rendering |
|---|---|---|
| `hecho · done` | Work evidence exists for the step (≥30 chars in its slot, or its defined artifact: save event for 6, review event for 7–9, capstone/PN events for 10) | ✓ node |
| `visitado · visited` | Student entered the step; no work evidence | hollow node |
| `actual · current` | Current step | ring highlight |
| `bloqueado · locked` | Gate unmet (draft-save for 7+; no skipping >1 ahead) | lock glyph + inline reason |

The instructor report and packet report **work-evidence counts**, never traversal counts.

- **Evidence:** F-5 (`state.done.add(id-1)` on any forward move; boot marks everything below the
  saved stage done; instructor report counts "stages completed" from it).
- **Student consequence:** false "done" checkmarks; instructor evidence overstates progress; the
  map cannot be used as a to-do list.
- **Root cause:** navigation events and work events write the same `done` set.
- **Systemic recommendation:** separate `visited` (navigation) from `done` (computed from work
  evidence at render time — no stored flag to go stale; P12).
- **Acceptance test:** walk that clicks forward through steps 1–5 without typing shows five
  `visitado` nodes and zero ✓; typing 30+ chars in step 2 flips exactly that node to ✓;
  instructor report shows "work evidence in N steps" equal to the ✓ count.

---

## 2. The one movement spine (IA-3)

Three movement affordances exist. **No other surface navigates between steps** (chat cards,
selects, and modal CTAs lose that power except where listed in §8).

### 2.1 Back / Continue (footer of the draft panel — placement unchanged)

| Control | Label | States |
|---|---|---|
| Back | `← Volver a: <paso anterior> · Back to: <previous step>` | Hidden at step 1. Never gated. |
| Continue | `Continuar a: <paso siguiente> → · Continue to: <next step> →` (`✓` prefix when work evidence exists) | Hidden at step 10. **Disabled states always carry the reason inline under the button**, not only in `title`: step 6 pre-save renders `Se activa al guardar tu borrador · Unlocks when you save your draft` (closes F-12). |

`Continuar a:` now **moves immediately** — no interstitial (see §3). On mobile, arrival lands on
the **Draft tab** for writing steps 1–6 and 8, and on the Draft tab with the step-tools zone
peeked for 7 and 9–10 — never on the chat tab by default (closes F-22).

### 2.2 The journey map — always one tap away

- **Trigger:** one control in the progress header: `Mapa · Map` (replaces `Ver ruta · View path`).
  It is the **only** disclosure layer: the second toggle `Ver todo · Show all` and the dimming of
  far-future steps are **deleted**; all 10 nodes render always, grouped under the 3 act headers.
- **Desktop:** opens as a panel below the calm bar (current `#detailedJourney` position).
- **Mobile (≤480px):** opens as a bottom sheet listing all 10 steps grouped by act; **replaces
  the `<select>` navigator (#4) entirely.**
- **Node behavior:** tap an unlocked node → `goToStage`; tap a **locked node → the reason renders
  inline inside the map/sheet, attached to that node** (`Guarda tu borrador en el Paso 6 para
  entrar aquí · Save your draft in Step 6 to enter here`) — never only in the chat stream, and the
  control never silently snaps back (closes F-6 at the source).
- **Node detail on touch:** tapping a node's `ⓘ` expands its one-line description inside the
  sheet (replaces the hover-only tooltip #11; closes F-18).

- **Evidence:** §7.1 of the screens inventory (five coexisting navigation paradigms; only the
  footer spine consistently truthful); #3 (map two clicks deep); #4/F-6 (silent snap-back with the
  explanation in a hidden tab); F-18 (hover-only tooltips); F-22 (Continue lands on chat tab).
- **Student consequence:** the student must hold five mental models; on a phone, gated navigation
  reads as "the dropdown is broken".
- **Root cause:** navigation accreted per-surface (map, select, chat cards, modal chains) with no
  declared spine; refusal messaging was welded to the chat column.
- **Systemic recommendation:** declare the spine (Back / Continue / Map) as the only inter-step
  movers; all gate refusals render at the point of refusal plus the status rail (§5), never only
  in chat.
- **Acceptance test:** (a) grep-walk: no chat-injected element carries a `goToStage` handler
  except the two whitelisted cards in §8 (save ceremony, Journey Complete); (b) mobile walk: a
  gated tap in the steps sheet renders the reason inside the sheet within the same interaction,
  chat tab unchanged; (c) map is reachable in exactly one tap from every screen state; (d) all 10
  nodes present with no secondary toggle.

---

## 3. Stage-preview modals → inline step headers (IA-4)

The `#stagePreviewBg` interstitial (#17) is **deleted**. Its content moves into a **step header
card** rendered at the top of the draft panel on every step arrival:

| Element | Content | Budget (per language mode) |
|---|---|---|
| Line 1 | `Paso N de 10 — <nombre del paso> · Step N of 10 — <step name>` | — |
| Line 2 | Step purpose (genre-resolved `getStageDescFor` → neutral) | ≤25 words |
| Transition line | `Terminaste: <paso anterior> ✓ · You finished: <previous step> ✓` — only on a forward move with work evidence | ≤12 words |
| `Ver ejemplo · See example` | Collapsed `<details>`; own-genre example only; absent when the layer defines none (never another genre's example — preserves the `getStageExampleFor` contract) | ≤80 words expanded |

Behavior: expanded on first arrival at a step; collapses to Line 1 after the student types or
taps the header; re-expandable by tapping Line 1. Nothing blocks; Escape is irrelevant because
there is no modal (dissolves F-10). The stage-entry welcome strip (#32) merges into this header —
one arrival surface, not two.

- **Evidence:** #17 (Escape-proof, backdrop-proof modal — the only one in the app); F-10; walk
  evidence `interposed-dialog` (checkpoints firing over open previews); concepts doc requirement
  "stage-preview modals become inline step headers".
- **Student consequence:** every Continue press costs a modal; keyboard users find a dead Escape;
  transitions are the moment other dialogs collide.
- **Root cause:** orientation content was attached to the *transition* instead of the
  *destination*.
- **Systemic recommendation:** orientation always lives at the destination, inline, collapsible;
  transitions perform movement only.
- **Acceptance test:** walk asserts zero blocking layers during any step transition; arriving at
  any step in any genre shows the header with genre-resolved name/purpose; the collapsed header
  contributes ≤12 words to the writing-screen chrome budget (P6).

---

## 4. Reflection checkpoints live inside the step (IA-5)

Reflection checkpoints (#50) stop being modals. They render as an **inline closing-prompt card**
in a fixed slot of the draft panel, directly above the footer spine:

- **Timing:** the auto checkpoints (steps 4 and 7) arm on step entry but **render only after the
  first qualifying student action in that step** (a typed change, a chosen revision move) — never
  on the transition itself, so they can never interpose over another surface (the walk-evidence
  `interposed-dialog` class dies structurally).
- **Step 8's** checkpoint keeps its handshake (renders after a Voice-Polish route is chosen), in
  the same slot. **Step 10's** lives inside the Finish space (§7).
- **Dismissal:** `Responder · Answer` (one tap per option, card thanks and collapses) or
  `Saltar por ahora · Skip for now`. Skipped checkpoints remain reachable via
  `Revisión rápida · Quick check` in the step-tools zone (§5.3).
- Micro-reflections (#37) render in the **same slot** with the same grammar; slot rule: **at most
  one card at a time**, queued FIFO.

- **Evidence:** walk evidence `interposed-dialog` (checkpoint over open stage-preview dialog);
  #50 (auto-once at 4/7 entry); P2 (one thing asks for attention at a time).
- **Student consequence:** two blocking surfaces intercept one click; the reflection reads as an
  interruption instead of a closing act.
- **Root cause:** checkpoints trigger on stage-entry timers concurrent with transition UI.
- **Systemic recommendation:** a single "prompt slot" component owns all inline prompts
  (checkpoints, micro-reflections, transition-import offers) with a FIFO queue and a
  one-visible-at-a-time invariant.
- **Acceptance test:** automated walk asserts a single visible blocking layer per state across
  all transitions (P2 acceptance form); a seeded step-4 entry mid-transition shows no checkpoint
  until a keystroke occurs; skipped checkpoints reappear from `Revisión rápida`.

---

## 5. The status rail replaces chat-as-notice-board (IA-6)

### 5.1 Anatomy

- **Rail strip:** one line, fixed. Desktop: directly beneath the current task bar, spanning both
  panels. Mobile: pinned directly above the tab bar. Shows the latest notice (≤12 words per
  language) + an unread-count chip.
- **Notices drawer:** tapping the strip opens `Avisos · Notices` (desktop: right-side drawer;
  mobile: bottom sheet). History grouped `Hoy · Today` / `Antes · Earlier`, **persisted** to its
  own localStorage key (survives reload). Collapsed group at the bottom:
  `Detalles técnicos · Technical details` (absorbs the tech panel #56).

### 5.2 What moves into the rail (and out of chat/overlays)

| Content | Today | Future home |
|---|---|---|
| Gate refusals | `addSys()` chat notes (#55), invisible on mobile Draft tab | Rail entry **plus** inline reason at the refusing control (§2.2) |
| Save failures / storage warnings | chat + autosave badge | Rail entry (`⚠ No se pudo guardar — toca para ver opciones · Couldn't save — tap for options`); the quiet `✓ Guardado · Saved` badge stays in the draft panel (P5: reassurance costs one glance) |
| Act/phase celebrations | `#phaseToast` blocking overlay, no auto-dismiss (#10) | Rail entry + a one-line banner inside the next step header, auto-collapsing 6 s; **no overlay** (P10: celebrations never block work) |
| Skill unlocks | `#skillToast` (#57) | Rail entry; the skill lands in the Toolkit |
| Connection/mode changes, privacy confirmations, tips | chat system notes / tech panel (#55/#56) | Rail (`Detalles técnicos` group for connection noise) |
| Review/Council completion | chat reply only | Rail entry `Informe listo — Abrir · Report ready — Open` → Review center (§6) |

**The chat stream carries only:** the student's messages, coach replies (with the persisted
live-AI attribution chip — see §8 #28), review replies, and the three whitelisted persistent
cards (§8). Stage tool cards move to the step-tools zone (§5.3).

### 5.3 Step-tools zone

A fixed, collapsible zone at the **top of the coach panel** labeled
`Herramientas del paso · Step tools`, holding the per-step working cards — research card (step 4),
revision panel (7), voice-polish routes (8), `Revisión rápida · Quick check` — instead of
appending them into the scroll where they drown and scroll away.

### 5.4 Mobile notification dots — the rule

| Dot | Set by | Cleared by |
|---|---|---|
| Chat tab dot | **Bot/coach messages only** (unchanged) | Opening the chat tab |
| Rail dot (on the rail strip) | **Every unread rail entry — including refusals and system notices** | Opening the notices drawer |

No notice can ever be delivered only to a hidden surface with no dot (closes F-6's delivery half).

- **Evidence:** §7.2 of the screens inventory (18 injected component types in one scrolling
  column); #55 (system notes don't set the chat dot); F-6; #10 (blocking celebration with no
  auto-dismiss); concepts doc ("the chat column is also the notice board").
- **Student consequence:** guidance, status, refusals, and results compete in one stream;
  refusals vanish on mobile; celebrations block the screen.
- **Root cause:** chat was the only always-present writable surface, so every subsystem wrote to
  it.
- **Systemic recommendation:** a single `notify()` API with two channels (rail, chat) and a
  routing table; writing app status into the chat stream becomes structurally impossible.
- **Acceptance test:** (a) seeded gate refusal on mobile Draft tab → rail dot within 500 ms, chat
  tab dot unchanged, reason visible at the control; (b) reload → notices drawer still lists the
  day's entries; (c) walk asserts zero `system`-class nodes appended to the chat stream; (d) act
  celebration fires while typing → no overlay appears, caret keeps focus.

---

## 6. The Review center (IA-7)

One drawer, stage-independent from step 7 **through step 10** (extends the current 7–9 window;
the concepts doc requires reachability at 10).

**Entry points (all of them):**

1. Footer `Revisar borrador · Review draft` — visible steps 7–10; disabled earlier with inline
   reason (`Disponible desde el Paso 7 · Available from Step 7`).
2. Status-rail entry after any completed review/Council run (`Informe listo — Abrir`).
3. The persisted post-review next-actions row in chat (#45 — now written to the chatlog, so it
   survives reload; closes F-8).
4. Finish space link `Ver mi último informe · See my last report` (§7).

**Inside the drawer:**

- Lens chooser (5 lenses, unchanged), purpose field, same-draft override, pre-send disclosure
  with live word count (the D4–D7 disclosure pattern is preserved verbatim — it is the app's best
  pattern per the AI inventory).
- **`Historial de revisiones · Review history`:** persisted list of lens runs and Council reports
  with timestamps and a stale flag when the draft has changed since (`Informe de una versión
  anterior · Report from an earlier version` — generalizes the Council view-last pattern, P12).
- Council offer when available; **when unavailable, a one-line explanation renders in its place**
  (`El Consejo funciona con Coach IA y esta asignación aún no tiene panel ·
  The Council needs Live AI and this assignment has no panel yet`) — closes F-17. (The Council
  must also stop inheriting the default essay profile for unprofiled genres — L1; absence of a
  profile shows this notice instead of running wrong-genre review.)
- Closing the drawer during an in-flight Council run asks one confirm
  (`¿Cancelar la lectura del Consejo? · Cancel the Council's reading?`) and keeps completed
  role readings as a partial report (closes F-11).
- **One decision grammar:** Accept / Adapt / Reject on Council findings stays; lens-review
  replies gain the same three buttons; all decisions write to the one decision store; the
  built-but-unused `recordCouncilVerification` seam is called when a re-review covers a finding
  the student accepted (the loop becomes ask → hear → decide → revise → **verify**, P8).

- **Evidence:** F-8/#45 (next-actions row not persisted); AI inventory ("three different decision
  grammars"; "the verify-after-revision seam exists in code and is never called"); F-11; F-17; L1.
- **Student consequence:** "How do I get back to my review?" regresses to discovery after every
  reload; decisions recorded in one surface and not another teach that judgment sometimes counts.
- **Root cause:** review affordances were DOM-side effects of a reply, not state; decision capture
  was built per-surface.
- **Systemic recommendation:** review history and decisions are state, rendered wherever needed
  (drawer, chat row, Process Note) from the same store (P12: two surfaces describing one fact
  render from one source).
- **Acceptance test:** run a review → reload → next-actions row and history list both present;
  accept a Council finding → revise → re-run → verification status recorded and visible in the
  Process Note preview; Guía-sin-IA mode at step 7 shows the Council-absence line, not a missing
  feature; canceling a run mid-flight preserves completed role readings.

---

## 7. The Finish space (IA-8)

`openReport('submit')` and the stage-10 modal chain become one full-screen space:
`Finalizar y entregar · Finish & submit`. **Entry is always an explicit act** (P5):

1. `Preparar entrega → · Prepare submission →` inside `Mi trabajo` (step 9+, draft saved) — the
   primary entry.
2. The step-10 header button `Abrir Finalizar y entregar · Open Finish & submit`.
3. The Journey Complete card (#39).

**Structure — a visible checklist, not a modal chain.** The six chained surfaces of the current
finale (capstone → instructor report → process note → revision gate → celebration → journey card;
inventory §7.3) flatten into sections on one page, each with a done-state, completable in any
order the gates allow:

| Section | Content | Gate |
|---|---|---|
| 1. `Mi autoevaluación · My self-assessment` | Capstone 10A (3 evidence fields + optional ratings) | — |
| 2. `La perspectiva del coach · The coach's view` | 10B compare (with its disclosure; offline variant) | 10A done |
| 3. `Mi respuesta · My response` | 10C final-word fields | 10B run |
| 4. `Mi nota de proceso · My process note` | Process Note, pre-filled from micro-reflections + decision ledger; student reviews and completes rather than reconstructs (P8) | — |
| 5. `Revisión hecha · Revision evidence` | The revision gate as an **in-place section state**: green when evidence exists; otherwise shows `Volver a revisar · Return to revise` + the attested-exception disclosure. It is a section, never a modal over a modal (closes F-9's gate hop) | — |
| 6. `Reporte para mi instructor/a · Report for my instructor` | Instructor report fields + preview + copy/.txt/.md | Section 5 green or exception recorded |
| 7. `Mi paquete final · My final packet` | Diagnostic banner, packet copy/download, collapsed `Enviar por correo · Send by email` (with its 1800-char truncation note) | — |

Closing the space is just closing it — **no surface auto-opens another** (closes F-9). The
completion celebration overlay (#20) is deleted; completion renders as the Journey Complete card
plus a rail entry. Submission checks appear **only** here (P5). Institutional framing
(Hostos/Brightspace strings) renders only for CAP-context genres; other genres get neutral
submission wording (closes L5 at the UI layer; text source is a founder decision).

**The packet uses the marked current draft (§9), never a heuristic.**

- **Evidence:** F-9 (✕ opens Process Note 450 ms later; Completar bounces into the gate); §7.3
  (six chained surfaces guard the last click); persistence inventory (final-essay-picking
  heuristic can prefer an older stage-8 text, invisibly); L5.
- **Student consequence:** the final stretch is a modal ambush; "What will this button do?" is
  unanswerable for ✕; the wrong draft can ship.
- **Root cause:** finale tasks were built as sequential modals encoding order in close-handlers;
  the packet had no student-declared source of truth.
- **Systemic recommendation:** finale = one space with sections + explicit gates rendered as
  section states; packet source = explicit marker.
- **Acceptance test:** walk from step 10: at no point do two overlays stack; closing the space
  from any section opens nothing; a run with a stale stage-8 text and a newer marked stage-7
  rewrite packets the marked draft; each section reachable and completable in gate-legal order of
  the student's choosing.

---

## 8. Screen-by-screen disposition map

Every surface from the inventory (§1 regions #1–8, §2 overlays #9–22, §3 dynamic #23–67,
start-here). **Keep** = survives as-is or with label changes only · **Merge** · **Move** ·
**Delete**.

| # | Surface | Disposition | Future home / behavior |
|---|---|---|---|
| 1 | App header | **Keep, edited** | Brand, pathway chip, language switcher, theme toggle, `?` Help, new `Ajustes · Settings` gear. **Reset button removed** → Settings danger zone (IA-10). Bug button removed from DOM until `bugReportUrl` is configured (F-16). |
| 2 | Calm three-phase bar | **Keep, edited** | Same 3 acts + new `Paso N de 10` counter + `Mapa · Map` control (replaces `Ver ruta`). Display-only acts unchanged. |
| 3 | Detailed journey map | **Keep, promoted** | The one map (§2.2): single disclosure, all 10 nodes, act grouping, inline lock reasons, tap-`ⓘ` descriptions. `Ver todo` toggle deleted. |
| 4 | Mobile stage `<select>` | **Delete** | Replaced by the steps bottom sheet (§2.2). |
| 5 | Current task bar | **Keep, edited** | `Paso N de 10 — <name>` + cue text + unnamed dots (aria `Tarea n de 3`) + Toolkit button. |
| 6 | Draft panel | **Keep, extended** | + step header card (§3), + prompt slot (§4), + work rail chips (§9), + current-draft marker (§9). Footer spine per §2.1. |
| 7 | Chat panel | **Keep, narrowed** | Conversation only (§5.2) + step-tools zone (§5.3) + Five-Questions strip (step 7+). `Mi progreso` drawer content (badges, streak, decision log) **moves to Toolkit**. |
| 8 | Mobile tabs | **Keep** | Dot rule per §5.4. |
| 9 | Setup banner | **Delete** | Dead element (F-19); connection state lives in the rail. |
| 10 | Phase celebration toast | **Delete as overlay** | Rail entry + auto-collapsing step-header banner (§5.2). |
| 11 | Tooltip | **Delete** | Node `ⓘ` expansion inside map/sheet (F-18). |
| 12 | Tu Conocimiento (manifesto) | **Keep, repositioned** | Optional overlay; entries: Toolkit + a one-time inline invite card in the prompt slot at the end of step 1. Never in the first-run chain (see Deliverable 16 §3). |
| 13 | Mani celebration | **Merge** | Final panel inside the mani overlay itself; no second full-screen surface. |
| 14 | El Laboratorio | **Keep, deferred** | Not in first-run; offered at the moment it becomes useful (first live-AI activation / first evaluation — Deliverable 16 §3). Full Spanish (P9). Skip links kept. |
| 15 | Draft-save confirmation | **Keep** | Step-6 checkpoint framing unchanged. |
| 16 | Draft-saved ceremony | **Keep, edited** | Secondary CTA `Leer mi borrador primero · Read my draft first` opens a **read-only reading view**: enabled scroll, `Lectura · Reading` chip, persistent `Comenzar la revisión → · Start revising →` button — not a disabled grey textarea (closes F-14). |
| 17 | Stage preview modal | **Delete** | Inline step headers (§3). |
| 18 | Mi trabajo / report hub | **Split** | Work mode → work rail drawer (§9). Submit mode → Finish space (§7). Backup/import/email/danger → Settings + Finish space §7 row 7 (email) per IA-10. |
| 19 | Process Note modal | **Move** | Finish space section 4; auto-open chaining deleted. |
| 20 | Completion celebration | **Delete as overlay** | Journey Complete card + rail entry. |
| 21 | Capstone modal | **Move** | Sections 1–3 of the Finish space; no modal container. |
| 22 | Dev preview bar | **Delete from production DOM** | Build-time exclusion; `?dev=true` no longer reaches students (F-21). |
| 23 | Project selector | **Keep, edited** | Onboarding surface 2 (Deliverable 16 §3); skipped when the link carries `?assignment=`; the default card explicitly labeled `Ensayo general — empezar ya · General essay — start now` (F-20). Colleague review variant kept. Unknown `?assignment=` ids render a notice card (`No reconocimos esa asignación — elige aquí · We didn't recognize that assignment — choose here`) instead of silently defaulting (L6). |
| 24 | Landing moment | **Merge** | One welcome card = onboarding surface 3; its embedded language switcher deleted (language is surface 1). |
| 25 | Welcome-back message | **Keep** | Single chat strip; also seeds the rail with the last save state. |
| 26 | Startup strip | **Merge into #25** | One boot strip total. |
| 27 | First-AI-send cue | **Keep, edited** | Moment-of-consent disclosure now **names every field that leaves the device, including the Tu Conocimiento sentence** (AI-inventory F1). |
| 28 | Live-mode chip | **Keep, persisted** | Written to chatlog so restored transcripts keep AI attribution (P8 "what did the AI contribute"). |
| 29 | Coach spotlight sequence | **Delete** | The step header answers "what am I doing here"; the existing CSS "Empieza a escribir aquí" cue covers first-write. No spotlight chain. |
| 30 | Post-onboarding chat flash | **Delete** | — |
| 31 | Review-mode badge | **Keep** | — |
| 32 | Stage-entry welcome strip | **Merge** | Into the step header (§3). |
| 33 | Research card (step 4) | **Move** | Step-tools zone (§5.3). |
| 34 | Revision panel (step 7) | **Move** | Step-tools zone. |
| 35 | Voice-polish card (step 8) | **Move** | Step-tools zone. |
| 36 | Voice Vault panel | **Keep** | Below textarea, steps 7–9, unchanged (never-silent status kept). |
| 37 | Micro-reflections | **Move** | Prompt slot (§4); FIFO with checkpoints; still autosave into the Process Note. |
| 38 | Capstone chat trigger card | **Delete** | Finish entries per §7 (step-10 header + Mi trabajo + Journey Complete card). |
| 39 | Journey Complete card | **Keep** | Whitelisted persistent chat card → Finish space. |
| 40 | Passage coach menu | **Keep** | Unchanged (5 actions + Protect 7–9). |
| 41 | Full-draft review modal | **Keep, promoted** | Becomes the Review center drawer (§6), steps 7–10. |
| 42 | Council offer | **Keep, edited** | Absence explained inline (§6); no default-profile inheritance (L1). |
| 43 | Council progress | **Keep, edited** | Close asks one confirm; partial results kept (F-11). |
| 44 | Council report | **Keep, edited** | Decisions → single store → Process Note; verification seam wired (§6). |
| 45 | Review next-actions row | **Keep, persisted** | Written to chatlog (F-8). |
| 46 | Five-Questions strip | **Keep** | Step 7+, collapsed; the per-review habit prompt (Deliverable 16 §2.3). |
| 47 | Per-message eval bar | **Keep** | **The** single message-evaluation surface. |
| 48 | Message eval drawer | **Keep** | — |
| 49 | Legacy eval card | **Delete** | F-7: one evaluation grammar; its store writes migrate to the decision store. |
| 50 | Reflection checkpoint modal | **Convert** | Inline closing prompt (§4). |
| 51 | Voice challenge | **Keep** | Collapsed chat card, probabilistic, unchanged. |
| 52 | Follow-up panel | **Keep** | Collapsed `<details>` after coach replies, unchanged. |
| 53 | Stuck triage popup | **Keep, edited** | The two focus-mode routes now drive the **single** focus system (see F-2 row below). |
| 54 | Stuck mini card | **Keep** | — |
| 55 | System notes (`addSys`) | **Move** | Status rail (§5); chat pathway removed. |
| 56 | Technical panel | **Move** | `Detalles técnicos` group in the notices drawer. |
| 57 | Skill toast | **Move** | Rail entry + Toolkit record. |
| 58 | Wave unlock animation | **Keep** | 1.3 s, decorative, non-blocking — within P10. |
| 59 | Offline fallback button | **Keep, extended** | Also rendered on restored error bubbles. |
| 60 | Transition import card | **Keep, moved** | Renders in the prompt slot (§4); no spotlight chaining. Offer wording unchanged (add above/below/keep mine). |
| 61 | Prior-work strip | **Generalize** | Absorbed by the always-visible work rail (§9); the empty-editor explanation becomes a work-rail highlight state. |
| 62 | Instructor report panel | **Move** | Finish space section 6. |
| 63 | Revision completion gate | **Convert** | Finish space section 5 — an in-place section state, never a stacked modal. |
| 64 | 10B/10C panels | **Move** | Finish space sections 2–3. |
| 65 | Mi Toolkit | **Keep, extended** | + `Mi progreso` content (badges, streak, decision log) from #7; + skills record. |
| 66 | Help panel | **Keep, edited** | Position line reads `Paso N de 10 — <name> (<act>)`; milestone-grouped list becomes act-grouped. |
| 67 | Bug report button | **Delete until configured** | Rendered only when `CONFIG.bugReportUrl` is non-empty (F-16). |
| — | Focus systems (`#focusToggle` + hide-coach mode) | **Merge** | One focus system: the footer button toggles coach-panel visibility with a truthful label pair `Ocultar coach · Hide coach` ↔ `Mostrar coach · Show coach`; the same control exits the stuck-triage focus state; Escape still works (closes F-2). |
| — | Typing indicator | **Keep, fixed** | Visible **only** while a request is actually pending; never on boot (F-3). |
| — | Header Reset | **Move** | Settings danger zone: typed confirmation word `BORRAR`, export offer inside the same dialog, label `Borrar todo y empezar de cero · Erase everything and start over` (closes F-1; matches the F1-remediation standard the in-app danger zone already meets). |
| — | `start-here.html` tutorial | **Keep, linked** | The app **reads `tupana_tutorial_done`**: graduates skip the welcome card and the Lab offer (only language — if unset — and assignment confirm remain; closes F-15). Route maps render the genre layer's real step names (closes L2); `cap-200-first-draft` id resolves to a genre entry or a visible redirect notice, never the silent default essay (L3). Full Spanish parity (P9). |

**New surfaces introduced (complete list):** Settings (`Ajustes · Settings`), status rail +
notices drawer (§5), steps bottom sheet (§2.2), work rail (§9), Finish space (§7), read-only
reading view (#16). Nothing else is added.

### IA-10 — Settings: routine path cleared of backup/email/danger

`Ajustes · Settings` (header gear; full-screen on mobile, drawer on desktop) holds: language,
theme, tone default, coach mode (with per-mode data disclosure), hidden-Ollama advanced row,
`Copia de seguridad · Backup` (.json export / import — import shows a preview + confirmation +
**automatic pre-import safety export**, per the persistence inventory's import risk), the
"your work lives in this browser" card (`Tu trabajo vive en este navegador — llévalo contigo ·
Your work lives in this browser — take it with you`, also shown in Finish space), and the danger
zone (clear data + the relocated Reset, both with typed confirm + export offer).

- **Evidence:** F-1 (header Reset = `localStorage.clear()` behind one native confirm); concepts
  doc ("complete the F1 separation — backup/import/email/danger leave the routine hub entirely");
  persistence inventory (import overwrite risk; 7-day Safari eviction).
- **Student consequence:** a mis-tap beside the theme toggle can end the project; backup controls
  sit in the daily save-status path.
- **Root cause:** destructive and archival controls accreted onto whatever surface existed
  (header, report hub) instead of a settings home.
- **Systemic recommendation:** one Settings surface owns configuration + archival + destruction;
  the daily path (draft panel, work rail) contains zero submission/email/backup/deletion controls
  (P5 acceptance form).
- **Acceptance test:** walk of steps 1–8 finds no backup/email/delete/reset control outside
  Settings and Finish; both destructive actions require the typed word and show the export offer
  in the same dialog; import shows preview + writes a safety export before applying.

---

## 9. Work rail + current-draft marker (IA-9 — adopted from Concept A)

- **Work rail:** a one-line chip row under the draft toolbar, **visible on every screen state**
  (the prior-work strip #61 generalized from "when editor is empty" to "always"). One chip per
  step artifact with ≥30 chars: `P2 ✓ hace 2 días · P2 ✓ 2 days ago` (step number, freshness).
  Tapping a chip opens a mini-menu: `Ver · View` (read-only peek), `Traer aquí · Bring here`
  (explicit insert with the existing above/below/keep-mine grammar), `Ir al Paso N · Go to Step N`
  (movement, so labeled). When the editor is empty and prior work exists, the rail highlights and
  prepends `Tu trabajo anterior está aquí · Your earlier work is here` — the empty editor is never
  unexplained (P4). Mobile: horizontally scrollable chip row. Overflow: chips beyond five collapse
  into `+N más · +N more` opening the `Mi trabajo` drawer.
- **`Mi trabajo · My work` drawer** (footer button kept): the full per-step inventory with word
  counts and save status (current work-mode hub content), plus `Preparar entrega →` at step 9+.
- **Current-draft marker (from step 6 on):** each draft-bearing artifact (6, 7, 8 slots and
  `tupana_draft`) can carry the marker `Esta es mi versión actual ✓ · This is my current
  version ✓` — exactly one holder at any time; set automatically on save/carry-forward, movable by
  the student from the work rail or `Mi trabajo`. **The packet and 10B compare read the marked
  draft only.** If the marked draft is older than a newer edit elsewhere, the Finish diagnostic
  says so (`Editaste el Paso 7 después de marcar esta versión — ¿cuál es la actual? · You edited
  Step 7 after marking this version — which is current?`).

- **Evidence:** persistence inventory (packet heuristic can prefer an older stage-8 text over a
  newer stage-7 rewrite, invisibly); concepts doc (work rail + marker named as the two Concept-A
  adoptions); P4 acceptance form.
- **Student consequence:** "Where is my earlier work?" needs memory; the shipped essay can be the
  wrong version with no signal.
- **Root cause:** per-stage keys with no student-legible index and no declared canonical version.
- **Systemic recommendation:** the artifact index and the version marker are first-class state,
  rendered by rail, drawer, and Finish diagnostics from one source (P12).
- **Acceptance test:** every editor-empty state with prior work shows the highlighted rail; a
  seeded stale-marker scenario surfaces the which-is-current diagnostic before packet copy; the
  packet text equals the marked slot byte-for-byte; exactly one marker exists at all times.

---

## 10. Movement vs action — the vocabulary rule (IA-12)

**Rule.** Every surviving control is exactly one of:

- **Movement** — changes where the student is (step, tab, or a named surface). Label = direction
  verb + named destination: `Continuar a: X` / `Volver a: X` / `Ir a X` / `Abrir X` / `Cerrar`.
  Visual grammar: quiet/tertiary weight, arrow or chevron permitted.
- **Action** — changes work or state. Label = verb + object: `Guardar borrador`, `Proteger esta
  frase`. Visual grammar: filled/primary weight, never an arrow.

No control is both (P3). The two current both-class offenders are resolved by design: Continue no
longer opens a preview (§3), and the capstone ✕ no longer opens the Process Note (§7).
Abstraction labels (`Manage`, `Options`, `Report`) are banned; collapsed groups name their
contents (`Copia de seguridad`, not `Otras opciones`).

### Control ledger (every surviving control)

| Control | Class | Label `ES · EN` |
|---|---|---|
| Continue (footer) | Movement | `Continuar a: <paso> → · Continue to: <step> →` |
| Back (footer) | Movement | `← Volver a: <paso> · Back to: <step>` |
| Map control (progress header) | Movement | `Mapa · Map` |
| Map node (unlocked) | Movement | `Ir a: Paso N — <nombre> · Go to: Step N — <name>` (aria) |
| Map node `ⓘ` | Movement (opens detail) | `Ver descripción · See description` (aria) |
| Mobile tabs | Movement | `Borrador · Draft` / `Tu Pana` |
| Status rail strip | Movement | `Avisos (N) · Notices (N)` |
| Rail entry "report ready" | Movement | `Abrir informe · Open report` |
| Work-rail chip → view | Movement | `Ver · View` |
| Work-rail chip → go | Movement | `Ir al Paso N · Go to Step N` |
| Work-rail chip → bring | **Action** | `Traer aquí · Bring here` |
| `Mi trabajo` (footer) | Movement | `Mi trabajo · My work` (opens the drawer of that name) |
| Prepare submission | Movement | `Preparar entrega → · Prepare submission →` (destination: Finish space) |
| Finish sections nav | Movement | Section names (§7 table) |
| Save (step 6) | **Action** | `Guardar borrador · Save draft` |
| Save-confirm primary | **Action** | `Sí, proteger mi borrador · Yes, protect my draft` |
| Ceremony primary | Movement | `Comenzar la revisión → · Start revising →` |
| Ceremony secondary | Movement | `Leer mi borrador primero · Read my draft first` (destination: reading view) |
| Review (footer) | Movement | `Revisar borrador · Review draft` (opens Review center) |
| Run review | **Action** | `Revisar este borrador · Review this draft` |
| Convene Council | **Action** | `Convocar al consejo · Convene the Council` |
| Cancel Council run | **Action** | `Cancelar la lectura · Cancel the reading` |
| Council report exit | Movement | `Volver a escribir · Return to writing` |
| Accept/Adapt/Reject | **Action** | `Aceptar · Accept` / `Adaptar · Adapt` / `Rechazar · Reject` |
| Passage menu items | **Action** | `Qué funciona · What works` / `Fortalecer · Strengthen` / `Claridad · Clarity` / `Voz · Voice` / `Proteger esta frase · Protect this phrase` / `Preguntar sobre esto · Ask about this` |
| Voice Vault find/remove | **Action** | `Buscar en el borrador · Find in draft` / `Quitar · Remove` |
| Checkpoint options | **Action** | option text; skip = `Saltar por ahora · Skip for now` |
| Quick check (step tools) | Movement (opens prompt) | `Revisión rápida · Quick check` |
| Five-Q eval button | Movement (opens drawer) | `Evaluar esta respuesta · Evaluate this reply` |
| Eval drawer picks | **Action** | `Sí · Yes` / `Parcialmente · Partly` / `No · No` |
| Stuck button | Movement (opens triage) | `Estoy atascado · I'm stuck` |
| Focus toggle (footer) | **Action** (changes layout state) | `Ocultar coach · Hide coach` ↔ `Mostrar coach · Show coach` |
| Toolkit | Movement | `Mi Toolkit · Toolkit` |
| Help | Movement | `Ayuda · Help` |
| Settings | Movement | `Ajustes · Settings` |
| Language / theme / tone / coach-mode | **Action** | current labels kept (each states its effect; coach-mode titles keep per-mode data disclosure) |
| Backup export | **Action** | `Descargar copia de seguridad (.json) · Download backup (.json)` |
| Import | **Action** | `Importar trabajo guardado · Import saved work` |
| Email packet (Finish, collapsed) | **Action** | `Enviar por correo · Send by email` |
| Packet copy/download | **Action** | `Copiar mi paquete final · Copy my final packet` / `Descargar paquete final · Download final packet` |
| Clear data (Settings) | **Action** | `Borrar mis datos · Erase my data` |
| Reset (Settings) | **Action** | `Borrar todo y empezar de cero · Erase everything and start over` |
| Mark current version | **Action** | `Marcar como mi versión actual · Mark as my current version` |
| 10A submit | **Action** | `✓ Nombré mi proceso · ✓ I named my process` |
| 10B compare | **Action** | `⇄ Comparar con el coach · Compare with the coach` |
| Instructor report generate | **Action** | `Generar reporte · Generate report` |
| Journey Complete CTA | Movement | `Abrir Finalizar y entregar · Open Finish & submit` |
| start-here exits | Movement | `Empecemos — escribir → · Let's start — write →` / `Ya hice esto — ir a la app · I've done this — go to the app` |

- **Evidence:** P3 acceptance form; F2-remediation precedent (destination-naming CTAs already
  hold); the capstone ✕ (F-9 — a close control that navigates); `Otras opciones` abstraction
  label in #18.
- **Student consequence:** without the split, "What will this button do?" requires trial.
- **Root cause:** no declared control taxonomy; labels written per-feature.
- **Systemic recommendation:** the control ledger above ships as a design artifact; new controls
  must declare a class before merge; a walk test snapshots labels against the ledger.
- **Acceptance test:** navigation-map regeneration classifies 100% of rendered controls as
  exactly one class; zero controls trigger both a state change and a navigation in one activation
  (except movement's inherent focus change); zero banned abstraction labels rendered.

---

## 11. Coverage statement

All inventory surfaces #1–#67, both HTML pages, the two focus systems, the typing indicator, and
the header Reset are dispositioned in §8; findings F-1 through F-22 and leakage items L1–L6 each
have a closing mechanism named in §§1–10 (L7–L12 are copy/config work outside navigation IA and
remain with the genre workstream). New surfaces are limited to the six listed in §8. Word-budget
obligations for every surface named here are specified in `proposed-progressive-disclosure.md`.
