# Proposed Progressive Disclosure Model — Concept B "The Honest Journey"

**Deliverable 16 · UX Recovery Audit 2026-08 · Provisional Concept B spec only — no code changes
or implementation approval.**
Companion to `proposed-navigation-ia.md` (surface names and dispositions used here are defined
there: step header, prompt slot, status rail, step-tools zone, work rail, Review center, Finish
space, Settings). Budgets implement P6: **writing screen ≤150 words of chrome outside the
student's own text; any modal/drawer ≤250 words** — measured in the student's chosen language
mode. Evidence cites the five inventory files and `target-experience-principles.md`.

---

## 1. The model's units and laws

**Disclosure units** (every piece of content is assigned exactly one):

| Unit | Behavior | Cap |
|---|---|---|
| **Line** | Always visible, one line | ≤12 words |
| **Card** | Visible in a dedicated slot, collapsible to a line | ≤60 words expanded |
| **Collapsed group** | `<details>`-style; header line always visible, body on demand | header ≤8, body ≤120 |
| **Drawer/sheet** | Opened by an explicit tap; one at a time | ≤250 words |
| **Space** | Full-screen destination (Finish, Settings) | ≤250 words per section |
| **Deferred** | Does not exist in the DOM until its trigger fires | — |

**Laws:**

1. **One blocking surface at a time** (P2). The prompt slot holds at most one card (FIFO queue);
   a drawer opening closes any open drawer; no surface auto-opens another.
2. **First appearance = first usefulness.** Every content class below names its trigger; nothing
   renders "in case it's needed later."
3. **Collapse is remembered per step** (a re-expanded header stays expanded for that visit only);
   **everything removed from first view is reachable within two acts** (P6 acceptance form):
   named entry point → content, no memory required.
4. **Budgets are tested, not aspired to:** the automated walk counts visible words per screen
   state in ES-only, EN-only, and both modes.

---

## 2. Disclosure rules per content class

Column key — **First appears:** the trigger event. **Unit:** from §1. **Collapses to:** the
steady-state footprint. **Budget:** words in chosen language mode.

| # | Content class | First appears | Unit | Collapses to | Budget |
|---|---|---|---|---|---|
| 1 | Instructions (step purpose, task cues, examples) | Arrival at the step | Step header card + task-bar cue | One-line header + cue | Header ≤25 expanded / ≤12 collapsed; example `<details>` ≤80; cue ≤12 |
| 2 | Bilingual density | Language choice = onboarding surface 1 | Mode-wide rendering rule | — | Single-language mode renders **only** the chosen language; see §2.2 |
| 3 | Coach questions / Five Questions | Strip: first arrival at step 7. Habit prompt: after each review reply. Lab: first live-AI activation | Collapsed group (strip); line (habit prompt); overlay wizard (lab, deferred) | Strip header line | Strip header ≤8, body ≤120; habit prompt ≤12; lab per-panel ≤250 |
| 4 | Review choices (lenses, purpose, Council) | Tap `Revisar borrador` (steps 7–10) | Drawer | Closed drawer; footer button line | Drawer ≤250 incl. disclosure; Council offer/absence line ≤25 |
| 5 | Process Note questions | Micro-reflections at their journey moments; full note in Finish section 4 (step ≥9) | Card (prompt slot); space section (Finish) | Collapsed section rows with done-states | One question card ≤40; Finish shows **one question expanded at a time**, others as answered/unanswered rows |
| 6 | Submission checks | Entering the Finish space | Space section (diagnostic banner + checklist) | Per-section done-state lines | Diagnostic ≤120; never rendered outside Finish |
| 7 | Backup controls (export/import) | Opening Settings; plus the take-it-with-you card at Finish | Space section (Settings) | Settings row line | Section ≤80; Finish card ≤50; import preview dialog ≤250 |
| 8 | Email (packet by mail) | Finish section 7, collapsed group | Collapsed group | Header line `Enviar por correo · Send by email` | Header ≤8; body ≤60 incl. the 1800-char truncation note shown **before** send |
| 9 | Danger actions (clear data, reset) | Settings danger zone, collapsed | Collapsed group → confirm dialog | Header line `Zona de peligro · Danger zone` | Header ≤8; dialog ≤100 incl. typed-word field + export offer |
| 10 | Advanced options (tone default, coach mode detail, Ollama, theme) | Opening Settings (coach-mode + tone quick toggles stay in chat header as lines) | Space rows (Settings) | Row lines | ≤10 per row; per-mode data disclosure ≤25 |
| 11 | Technical status (connection, mode changes, storage internals) | Status rail entry at the event; history on opening the notices drawer | Line (rail) + collapsed group (drawer) | Rail line | Rail line ≤12; drawer entry ≤30; `Detalles técnicos` group header ≤4 |

### 2.1 Instructions (class 1)

- Step header expanded on first arrival; collapses on first keystroke or header tap; the genre
  example is **never** open by default and never renders another genre's example.
- The three in-stage cues appear **one at a time** in the task bar (current behavior kept);
  cue text ≤12 words.
- AI-literacy teaching (lab content, transfer cards) is **deferred** (class 3 / Toolkit); it
  never occupies the writing screen.
- **Acceptance test:** walk at each step, ES-only: writing-screen chrome ≤150 words with header
  collapsed and ≤175 on first arrival (header expanded); example closed by default in 70/70
  genre-step cells; every deferred instruction reachable in ≤2 acts (Toolkit → card, or header
  tap → details).

### 2.2 Bilingual density (class 2)

- Language choice is **onboarding surface 1** (§3); the 3-way preference (ES-led / EN-led /
  ES·EN) persists and drives **100% of surfaces** — static, dynamic, chat, overlays, tutorial,
  lab — via one canonical `{es,en}` representation (retires the ~324 hardcoded " · " joins and
  the shape-dependent `wrapBilingualHtml` heuristic; bilingual inventory BIL findings).
- Single-language mode renders **zero words** of the other language except proper nouns.
- Both-mode uses the stacked quiet-twin grammar (primary line + muted twin,
  `styles.css:6503–6526` generalized), never inline interleaving; both-mode budget = ≤1.9× the
  single-language count for the same state.
- **Evidence anchor:** stage-1 screen today carries ~330 chrome words in both-mode and ES-only
  removes only ~38% (≈205 remain) because hardcoded joins survive the toggle.
- **Acceptance test:** P9 acceptance form — walk measures per-screen visible words: ES-only ≈
  half of both (±10%); zero mixed-language lines in single-language mode outside proper nouns;
  the terminology table (paso/step, borrador/draft, guardar/save, revisar/review…) verified
  against rendered output with exactly one term per concept per language.

### 2.3 Coach questions / Five Questions (class 3)

- **The strip** (`Cinco Preguntas · Five Questions`) first renders at step 7 arrival, collapsed;
  auto-expands exactly once (first arrival), then stays collapsed.
- **The habit prompt** replaces enumeration: after each review/coach reply at steps 7+, one line
  under the reply — `Evalúa esta respuesta · Evaluate this reply` — opens the eval drawer. The
  system-prompt never-enumerate rule stays; the legacy eval card is deleted (nav spec §8 #49), so
  the message eval bar + drawer is the **only** evaluation grammar.
- **The lab** is deferred: offered as a card when the student first switches to `Coach IA · Live
  AI` (or first taps `Evalúa esta respuesta`, whichever comes first) — `Practica juzgar a la IA —
  3 minutos · Practice judging AI — 3 minutes` — skippable, repeatable from the Toolkit.
- **Acceptance test:** steps 1–6 render zero Five-Questions content; step-7 first arrival shows
  the strip expanded once and collapsed on next entry; every review reply carries exactly one
  habit-prompt line; lab card appears only after its trigger and never blocks; evaluation writes
  land in the single decision store.

### 2.4 Review choices (class 4)

- Nothing review-shaped exists before step 7 except the disabled footer button with its inline
  reason line (`Disponible desde el Paso 7 · Available from Step 7`).
- The drawer opens with the **lens chooser only**; the purpose field appears from the second
  review on (current rule kept); the same-draft override appears only when the signature matches;
  the pre-send disclosure with live word count renders before every send (D4–D7 pattern kept
  verbatim).
- Council: one offer block when available; one absence line when not; the progress and report
  states replace the drawer body — never stack over it.
- **Acceptance test:** drawer word count ≤250 in every state (chooser / progress / report ≤250
  per view); walk before step 7 finds zero lens/Council strings; disclosure precedes every send
  event in the event log.

### 2.5 Process Note questions (class 5)

- The note is **assembled, not confronted**: micro-reflections (one question, ≤40 words, prompt
  slot, skippable) fire at their journey moments — after the step-6 save (main idea), step 9
  (what changed), step 10 (what still needs work) — and autosave into the note.
- Finish section 4 shows the note as rows: answered (with the student's text, editable) and
  unanswered; **one question expanded at a time**; `Completar · Complete` activates when required
  rows are answered.
- Council/review decisions and verification statuses render into the note automatically from the
  decision store (P8) — the student reviews and signs rather than reconstructs.
- **Acceptance test:** a student who answered all micro-reflections opens Finish section 4 and
  finds every answer pre-filled; the section never shows more than one expanded question;
  decisions appear without any manual re-entry; each micro-reflection card ≤40 words and
  skippable.

### 2.6 Submission checks (class 6)

- Exist **only** inside the Finish space (P5): the readiness diagnostic, packet contents list,
  instructor-report gate states. The work rail, `Mi trabajo` drawer, and save affordances contain
  zero submission language at steps 1–8.
- **Acceptance test:** P5 acceptance form — walk of steps 1–8 finds no submission/email/packet
  string outside Finish; the diagnostic renders ≤120 words; Finish is reachable only via the
  three explicit entries (nav spec §7).

### 2.7 Backup controls (class 7)

- Settings section `Copia de seguridad · Backup`: export line + import line. Import opens a
  preview dialog (what will be replaced, per-step word counts) + confirmation + **automatic
  pre-import safety export** — no silent overwrite (P4).
- The origin/device truth card (`Tu trabajo vive en este navegador — llévalo contigo · Your work
  lives in this browser — take it with you`, ≤50 words) renders in Settings and Finish only.
- **Acceptance test:** no backup control rendered outside Settings (export also allowed inside
  the two danger dialogs as the safety offer); seeded import shows preview naming every slot it
  would replace and writes the safety export before applying.

### 2.8 Email (class 8)

- One collapsed group in Finish section 7. Expanded body states: what the mail contains, the
  1800-character truncation, and that the full `.txt` downloads alongside — **before** the
  `mailto:` fires.
- **Acceptance test:** email affordance absent everywhere except Finish section 7; expansion
  ≤60 words; truncation note visible in the expanded state prior to any send.

### 2.9 Danger actions (class 9)

- Two actions, both in the Settings danger zone, both behind: collapsed group → dialog with
  (a) plain-outcome sentence, (b) `Descargar copia primero · Download a copy first` button,
  (c) typed word `BORRAR` to enable the destructive button. The header Reset is gone (nav spec
  IA-10); no native `confirm()` remains as a sole guard.
- **Acceptance test:** zero destructive controls within one interaction of routine controls;
  both paths require the typed word; the export offer is inside the same dialog (P5 acceptance
  form); dialog ≤100 words.

### 2.10 Advanced options (class 10)

- Chat header keeps exactly two quick toggles as lines (tone `Suave · Gentle / Directo · Direct`;
  coach mode `Guía sin IA · Built-in, no AI / Coach IA · Live AI` with per-mode data disclosure
  in the expanded Settings row, ≤25 words). Ollama row exists **only** in Settings → advanced,
  collapsed. Theme toggle stays in the header (one icon, no words).
- **Acceptance test:** writing-screen chrome from these controls ≤8 words total; Ollama string
  absent from the DOM outside Settings; each Settings row ≤10 words with disclosures ≤25.

### 2.11 Technical status (class 11)

- Never in the coach stream (the tech panel moves to the notices drawer's `Detalles técnicos ·
  Technical details` collapsed group). The typing indicator renders only while a request is
  pending. Connection loss = one rail line + the offline fallback button on the affected reply
  (also on restored replies). Every failure line follows P10's grammar: what happened + what
  survived + one next step, ≤30 words.
- **Acceptance test:** boot with empty chatlog shows no typing indicator; seeded connection
  failure produces exactly one rail entry and zero chat system notes; every failure string in
  the inventory maps to the three-part grammar within budget.

---

## 3. Onboarding sequence redesign

**Strictly one surface at a time. Nothing stacks** (today: project selector + lab + manifesto +
preview machinery render on first entry — walk evidence, first-entry screenshots; ~10 minutes of
surfaces before the first sentence for a diligent student, F-15).

### 3.1 The sequence

| Order | Surface | Content | Skippable? | Skipped when |
|---|---|---|---|---|
| 1 | **Language choice** — first, always | One card: `¿En qué idioma trabajamos? · Which language shall we work in?` — three options (Español / English / Los dos · Both), ES visually first, one tap, persists | No (one tap; ES preselected — Enter accepts) | `tupana_lang` already set (e.g., by the tutorial) |
| 2 | **Assignment confirm** (project selector) | Card list incl. `Ensayo general — empezar ya · General essay — start now` as the labeled default | Yes (`Empezar con el ensayo general`) | Link carries a valid `?assignment=` (chip shows it; unknown ids get the notice card, nav spec §8 #23) |
| 3 | **One welcome card** (landing moment, merged) | The deal (your words first, AI never writes for you), trust line, two choices: `Empezar a escribir · Start writing` (primary) / `Ver guía de 3 minutos · See the 3-minute guide` (secondary, → Lab now instead of deferred) | Yes (primary button **is** the skip) | `tupana_tutorial_done` is set (the app now reads it — F-15 closed) |
| → | **The writing screen.** Step-1 header expanded (that is the instruction); CSS `Empieza a escribir aquí · Start writing here` cue; nothing else. | | | |

Maximum surfaces before typing is possible: **3** (returning/tutorial-graduate path: **0–1**).
Each surface ≤250 words; each is the only blocking layer while visible.

### 3.2 Deferred into the journey (with triggers)

| Content | Deferred to |
|---|---|
| El Laboratorio (Five-Questions practice) | First `Coach IA` activation or first eval tap (§2.3); also welcome-card secondary and Toolkit |
| Tu Conocimiento (identity affirmation) | One-time invite card in the prompt slot at the end of step 1 (`Reclama lo que ya sabes — 2 minutos · Claim what you already know — 2 minutes`, skippable); always in Toolkit |
| First-AI-send privacy cue | First live send (unchanged), now naming every transmitted field incl. the Tu Conocimiento sentence |
| Five-Questions strip | Step 7 arrival (§2.3) |
| Coach spotlight sequence | **Deleted** (nav spec §8 #29) — the step header carries orientation |
| Review, Council, Process Note, submission, backup, email, danger | Their classes' triggers (§2.4–2.9) — none exist at onboarding |

### 3.3 Tutorial hand-off (`start-here.html`)

The tutorial writes `tupana_tutorial_done` **and** the chosen language and assignment id; the app
reads all three: a graduate arriving by link sees at most the assignment-confirm card (and only
if the link lost its `?assignment=`). The tutorial's route map shows the genre layer's real step
names (L2), in the 10-in-3-acts vocabulary, with full Spanish parity.

### 3.4 Acceptance tests (sequence)

1. Automated first-run walk: exactly one visible blocking surface per state, from first paint to
   first keystroke; surface count ≤3; each ≤250 words in chosen mode.
2. Tutorial-graduate walk (all 6 genre links): zero repeated teaching surfaces; time-to-typing
   path = link → (≤1 card) → editor.
3. Language chosen at surface 1 is honored by surfaces 2–3 and everything after (no embedded
   language switcher on the welcome card).
4. Skipping everything skippable and typing immediately triggers no follow-up overlay; deferred
   items appear only on their §3.2 triggers, one at a time, in the prompt slot.
5. Seeded `?dev=true` in production build renders nothing (dev bar excluded).

---

## 4. Word-budget ledger (writing screen, chosen-language mode)

Steady state (headers collapsed), steps 1–6 — the P6 ≤150 allocation:

| Region | Allocation |
|---|---|
| App header (chip, controls, aria-visible text) | 12 |
| Progress header (acts + `Paso N de 10` + `Mapa`) | 14 |
| Task bar (step name + one cue) | 20 |
| Step header (collapsed line) | 12 |
| Work rail (chips + labels) | 15 |
| Draft toolbar + autosave badge + word count | 14 |
| Footer spine (Back/Continue/Mi trabajo/Focus/Review*) | 24 |
| Status rail strip | 12 |
| Chat panel chrome (header toggles, input, stuck button, step-tools headers) | 25 |
| **Total** | **148 ≤ 150** |

\* Review button counted from step 7; steps 1–6 bank its words against the Five-Questions strip
header. First-arrival states may exceed by the expanded step header only (≤175 total). Every
modal/drawer/space-section budget is stated in §2. Baseline for comparison: today's stage-1
screen carries ~330 chrome words in both-mode, ~205 in ES-only (bilingual inventory §"words per
surface").

**Acceptance test (global):** the walk suite measures every screen state in the inventory across
all 7 genre modes × 3 language modes × 2 viewports; any state over its ledger budget, any stacked
blocking surfaces, or any deferred item rendering before its trigger is a build-failing defect,
severity per P1/P2/P6.
