# Bilingual Content Strategy — Tu Pana Writing Studio

**Deliverable 17 · UX Recovery Audit 2026-08 · Direction-independent language strategy;
provisional Concept B surfaces are examples, not an implementation decision.**
Evidence base: `inventory/bilingual-visual-a11y.md` (Agent E, rendered measurements),
`target-experience-principles.md` (P6, P9, P10), `future-state-concepts.md` §B-Bilingual.
Governing principle: **P9 — both languages are first-class; neither is homework.**

This is a strategy document. No code changes are made here; each decision carries an
acceptance test the remediation batches must pass.

---

## 0. Decisions at a glance

| # | Decision |
|---|---|
| D17-1 | Language preference becomes **onboarding step 1** — a Spanish-led, three-card full-screen choice, before any other onboarding surface. |
| D17-2 | **One canonical string representation** — `{es, en}` records resolved at render time by a single resolver — replaces all four coexisting encodings, including dynamic builders, aria-labels, data.js fields, El Laboratorio, and start-here. |
| D17-3 | **"Both" mode is redefined**: primary language prominent, secondary on demand, with three string classes (chrome renders primary-only; instruction renders stacked quiet-twin; long-form renders behind a per-block disclosure). |
| D17-4 | **One term per concept per language**, fixed in a verified terminology table. Stage 10's triple naming resolves to one metaphor ("cierre / closing"). |
| D17-5 | **Mixed-language state rules**: student text is never transformed; mode switches are total and instant; chat bilingualism comes from source tags, never a heuristic. |
| D17-6 | **Tone and language decouple**: `t()` selects tone *within* the resolved language, never across languages. |
| D17-7 | **Migration in nine bounded batches**, highest-stakes moments first, measured by the per-screen word-count harness (single-language ≈ half of both-mode). |

---

## 1. D17-1 — Language preference is onboarding step 1

**Evidence.** The 3-way preference (`es | en | both`, default `es`) already exists, persists
(`localStorage('tupana_lang')`), and drives the AI coach (`ui.js:17, 332–355, 3195–3199`).
But a first-time student meets it only as a small header toggle, *after* landing in a stacked
onboarding pile (future-state-concepts.md, evidence item 5), and the tutorial (`start-here.html`)
has no language system at all — zero `show-es`/`show-en` spans (bilingual-visual-a11y.md §1.4).

**Consequence.** The single choice that halves reading load on every subsequent screen
(measured −50–55% where the span system works, §1.3) is the one choice students are never
asked to make. Spanish-dominant students get an English-primary tutorial before they ever see
the toggle.

**Root cause.** The preference was retrofitted as a display filter, not designed as the first
act of the relationship.

**Recommendation.**
- **Placement:** the first interactive surface of `start-here.html` and (for students who
  arrive at `index.html` cold) the first step of the welcome sequence — before project
  selector, Laboratorio, manifesto, or any preview machinery. One step, one question (P2).
- **Exact presentation:** a full-screen step titled **"¿En qué idioma quieres trabajar? ·
  Which language do you want to work in?"** — this title is the *one* legitimately bilingual
  surface in the app, because the preference is not yet known. Below it, three cards, each a
  real `<button>` ≥44px, **each written only in its own language**:
  1. **Español** — "Todo en español. Puedes cambiar cuando quieras." *(listed first,
     visually pre-focused: Spanish-led default preserved)*
  2. **English** — "Everything in English. You can change anytime."
  3. **Español + English** — "Español primero, con el inglés disponible en cada elemento."
     *(honest description of the D17-3 behavior — not "everything twice")*
- **Behavior:** selection writes `tupana_lang` immediately, re-renders the step's own chrome
  as confirmation, and applies to start-here, the lab, and the app (one storage key, all
  three surfaces). No "skip" — the ES default is the pre-focused card, so one keypress
  (Enter) continues Spanish-led. The header switcher remains for later changes.

**Acceptance test.** Playwright: fresh profile → first rendered interactive surface is the
language step; selecting each card sets `tupana_lang`, flips `<html lang>`, and every
subsequent onboarding surface (tutorial, lab, welcome) renders in that mode; keyboard-only
path completes the step; the choice survives reload and deep links (`?assignment=…`).

---

## 2. D17-2 — One canonical string representation: `{es, en}` resolved at render

**Evidence.** Four incompatible encodings coexist (BIL-3): toggle spans (322 lines), hardcoded
`" · "` joins (~324 lines in ui.js), `" / "` joins (39 in data.js), and `{es,en}`-like objects
(`STAGE_STEPS`, `STAGE_TRANSITIONS`, stage `es`/`en` name fields — the pattern that already
works). Six static modals are fixed bilingual prose; data.js `desc` is EN-only and `translang`
ES-only (BIL-6); ~108 aria-labels are hardcoded "ES · EN" (A11Y-3); El Laboratorio and
start-here are English-primary (BIL-2, P1); chat filtering is a shape-detecting heuristic
(BIL-5). The save-confirm modal renders 69 words in *every* mode (§1.3).

**Consequence.** ES-only mode removes only ~38% of stage-1 chrome instead of ~50% (≈205 of
~330 words survive); the highest-stakes moments (first-save confirm, celebration, stuck menu)
ignore the preference entirely; screen-reader users hear every control name twice, half of it
in the wrong voice; correctness of chat rendering depends on string shape.

**Root cause.** No single source of truth for bilingual strings — each sprint invented its own
encoding, so the language preference is an invariant with no enforcement point.

**Recommendation.**
- **Canonical form:** every user-facing string is authored as a record
  `{ es: "…", en: "…" }` (tone-variant strings extend this per D17-6). Stage data, followups,
  modal copy, button labels, aria-labels, status messages, and celebration copy all migrate to
  this form. `translang` folds into the stage record as a normal `{es,en}` field with a real
  English translation (it is currently ES-only).
- **One resolver.** A single function (call it `L(str)`) is the only path from record to DOM:
  - mode `es` → Spanish string only; mode `en` → English string only;
  - mode `both` → the D17-3 rendering per string class (never inline `" · "` interleaving);
  - static HTML keeps the `show-es/show-en` span mechanism but those spans become the
    *output contract* of the system, not a hand-authored convention — a lint pass verifies
    every static bilingual span pair has both halves.
- **Dynamic builders included.** `addSys`, modal header/body builders, button factories,
  `buildMap` labels, mobile `<select>` labels, toast text — all call `L()`. No string literal
  containing `" · "` or `" / "` as a language join may be passed to a DOM sink (lint gate).
- **aria-labels: single-language, always.** The accessible name is the resolved preference
  (in `both` mode: Spanish, the primary), matching `document.documentElement.lang` so the SR
  voice is correct. No `" · "` ever appears in an accessible name. Any element whose *visible*
  content includes the secondary language carries `lang` on that span (per File 2, DS-12).
- **Chat / AI responses.** The existing system-prompt hook ("Respond in ${lang}",
  `ui.js:3195–3199`) remains the authority for single modes — and in those modes the
  `wrapBilingualHtml` heuristic is **disabled** (nothing to filter; today it can mis-fire on
  accent-less Spanish). In `both` mode the prompt contract requires delimited output
  (`[ES] … [EN] …`); rendering splits on the delimiter into the stacked quiet-twin form —
  **parsing by contract, not by accent-counting regex**. Stored legacy messages without tags
  render as-authored (grandfather clause), never re-guessed.
- **El Laboratorio and start-here reach full Spanish parity.** Every step heading, question
  label, choice button, feedback card, and footer control in the lab (`index.html:600–785`)
  and the entire tutorial get authored Spanish of **equal depth** — translation, not
  abridgment (the Mani asset cards' one-line ES summaries vs three-sentence EN paragraphs,
  BIL-8, are re-authored to parity). Both surfaces read the shared `tupana_lang` key and
  render through the same resolver. The Five-Questions pedagogy stops being English-gated.

**Acceptance test.** (a) Grep gates: zero `" · "`/`" / "` language joins reaching DOM sinks in
ui.js/data.js outside the resolver; zero aria-labels containing `"·"`. (b) Rendered walk in
each mode: 100% of inventoried surfaces (including save-confirm, celebration, stuck menu,
completion modal, phase toast, lab, start-here) contain only the selected language.
(c) `bilingual_starter_test.mjs` / `bilingual_warmth_test.mjs` stay green; a new suite seeds
each mode and asserts the save-confirm modal word count differs by mode (today: 69/69/69).
(d) VoiceOver/NVDA spot-check: control names announced once, in the document language.

---

## 3. D17-3 — What "both" means going forward

**Evidence.** Both-mode stage-1 chrome is ~330 words vs ~205 (es) — and on phones both-mode
re-inflates everything the mobile tiers trimmed, producing the marquee (RES-4, §1.5). The
ADHD-B7 "stacked quiet twin" grammar (`styles.css:6503–6526`) already renders primary-over-
secondary instead of inline interleaving — but demotes the secondary to `--text-muted`, which
fails AA at 2.75:1 (VIS-5): the design system literally renders one language below legibility.

**Consequence.** Both-mode users pay ~2.2× label length everywhere; P6's ≤150-word chrome
budget is unreachable; the secondary language is simultaneously *always present* and
*unreadable* — the worst version of bilingual support.

**Root cause.** "Both" was implemented as "concatenate everything" instead of as a designed
reading mode.

**Recommendation.** Both mode is kept — translanguaging is pedagogically core (§1.6) — and it
serves: students actively building the second language with the first as anchor; families
reading over the shoulder at different proficiencies; instructors reviewing a student's
screen. Its rendering contract, per string class:

1. **Chrome** (buttons, tabs, nav labels, status lines, aria): renders **primary language
   only**, even in both mode. A "Guardar" button does not need "· Save" appended to be
   honest; the mode governs *content*, not control labels. This alone removes the majority
   of the 2.2× inflation and every overflow symptom.
2. **Instructional content** (current-task bar, stage descriptions, coach guidance lines,
   modal body copy ≤2 sentences): **stacked quiet twin** — primary line at full contrast,
   secondary line beneath at `--text-sub` (not `--text-muted`; File 2 DS-5 fixes the token,
   this rule stops using the failing one for language), one type-scale step smaller. This
   generalizes the existing B7 grammar; inline `" · "` interleaving is retired.
3. **Long-form content** (help modal, El Laboratorio steps, tutorial sections, celebration
   prose): **primary only, secondary on demand** — each block carries a 44px disclosure
   ("English ▸" / "Español ▸", labeled in the *target* language), collapsed by default,
   state remembered per block for the session. Two acts to reach, discoverable (P6).

**Density guarantee (the P6 mechanism):** classes 1 and 3 add zero words to first view; only
class 2 — the one to three instructional strings active at a time — carries the secondary
line. Single-language modes suppress duplicate translation completely; optional bilingual mode
is governed by P6's absolute per-state budgets rather than an incompatible ratio target. The
writing screen stays inside P6's ≤~150-word chrome budget in every mode.

**Acceptance test.** Word-count harness per screen: on matched app-owned copy, ES and EN each
render no more than 60% of the full bilingual source words and no unintended duplicate
translation; optional bilingual first view meets the P6 absolute budget (writing screen ≤150
chrome words); no marquee/clamp trigger fires in any mode at 375px; disclosure blocks open with
keyboard and announce state (`aria-expanded`).

---

## 4. D17-4 — Terminology: one term per concept per language

**Evidence.** Stage 10 has three names (ES "Mi cierre de proceso" / EN "My Writing Snapshot" /
CTA "Write My Reflection" — `data.js:152, 213–218`, `ui.js:916–917, 1024`). "Etapa," "Paso,"
and "Step" name the same unit in three surfaces (`index.html:107, 99`, `genre-template.js:439`).
*Revisión* covers three features in Spanish (stage 7, full-draft review, Review Council —
BIL-7). "Toolkit" ships untranslated in ES mode.

**Consequence.** A student, an instructor, and the export packet can each name a different
artifact for the same work product; Spanish speakers cannot tell the revision stage from the
review feature from the Council by name alone.

**Root cause.** Per-sprint copywriting with no terminology registry.

**Recommendation.** The following table is the registry. Rendered output is verified against
it; new copy that introduces a second term for a listed concept fails review.

| Concept | Español (only term) | English (only term) | Retires |
|---|---|---|---|
| Journey unit | **Paso** ("Paso 3") | **Step** ("Step 3") | "Etapa," "Stage" as labels |
| Journey acts (Concept B) | **Empezar / Revisar / Terminar** | **Start / Revise / Finish** | milestone labels in UI |
| The student's text | **borrador** | **draft** | — |
| Persisting it | **guardar** | **save** | — |
| Step 7 (changing your draft) | **Revisión** | **Revision** | — |
| Whole-draft evaluative read | **Lectura completa** | **Full review** | "Revisar borrador · Review draft" |
| The multi-reviewer feature | **El Consejo** | **The Council** | "Consejo de revisión · Review Council" |
| Step 10 (one metaphor: closing) | **Mi cierre de proceso** | **My Process Closing** | "My Writing Snapshot" |
| Step 10 CTA | **Escribir mi cierre** | **Write my closing** | "Write My Reflection" |
| Process artifact | **Nota de proceso** | **Process Note** | — |
| Tools drawer | **Mis herramientas** | **My Toolkit** | bare "Toolkit," "Mi Toolkit" |
| Voice archive (brand) | **Bóveda de voz** | **Voice Vault** | — |
| The coach (brand) | **Tu Pana** | **Tu Pana** | — |
| Steps 1–9 names | Anécdota · Conexión · Tu Pitch · Investigación · Esquema · Primer borrador · Revisión · Pulir voz · Checklist | Anecdote · Connection · Topic Pitch · Research · Outline · First Draft · Revision · Voice Polish · Checklist | — (already consistent; normalize the `\n` in stored names) |

Rules: brand terms (Tu Pana, El Consejo, Bóveda de voz / Voice Vault) are names, not
translations — they render with correct `lang` marking but are never re-translated per
surface. The *revisión* collision is resolved by reserving **Revisión** exclusively for step
7 and renaming the two features (Lectura completa, El Consejo).

**Acceptance test.** A rendered-text sweep (Playwright, all screens, each mode, each genre)
finds zero occurrences of the "Retires" column; grep finds zero "Snapshot"/"Etapa"/"Consejo
de revisión" in data.js/ui.js/index.html copy paths; the packet, the step header, and the CTA
for step 10 all print the same name.

---

## 5. D17-5 — Mixed-language state rules

**Evidence.** Students are explicitly invited to code-switch (`data.js:48, 58` —
"El código-alternado es válido"); the coach mirrors interface language; chat history is
filtered by shape (BIL-5); switching modes mid-journey is common (three switchers exist).

**Consequence.** Without explicit rules, mode switches and code-switched student text produce
unpredictable mixtures — e.g., Direct tone silently anglicizing feedback (BIL-4), heuristic
misses rendering both languages in single modes.

**Root cause.** Rules exist implicitly in scattered code paths, never as a contract.

**Recommendation — the five rules:**
1. **Student text is inviolable.** Anything the student wrote renders verbatim — in the
   draft, the Vault, Council quotes, the Process Note, the packet — regardless of mode.
   Code-switching is never flagged, "corrected," or filtered.
2. **Mode switches are total and instant.** After `setLang`, no surface (including open
   modals, chat chrome, task bar, aria) retains the previous mode. No reload required.
3. **The coach speaks the interface language** (existing hook); verbatim quotes from the
   student's draft stay in the student's language inside that response. In both mode:
   delimited ES-then-EN per D17-2.
4. **New system output is source-tagged at creation** (`{es,en}` or single-language-tagged);
   rendering never infers language from content. Legacy stored messages render as-authored.
5. **Inserted text follows the student:** stuck-starters and any text placed *into the
   draft* use the student's active writing language where detectable, else the interface
   language (current `prompts.js:123–127` behavior, kept and documented).

**Acceptance test.** Scripted walk: write code-switched draft text → run Lectura completa →
switch mode mid-session → open packet: draft text byte-identical everywhere; zero
previous-mode chrome strings; chat renders correctly for a seeded accent-less Spanish
response (the heuristic's known miss) because no heuristic runs.

---

## 6. D17-6 — Tone and language decouple

**Evidence.** `t(gentle, direct)` (`ui.js:294`) receives a bilingual string as "gentle" and an
English-only string as "direct" (`ui.js:497–515`).

**Consequence.** An ES-mode student who chooses Direct tone gets English system feedback —
tone preference silently overrides language preference (violates P9's "every surface honors
it").

**Root cause.** Tone variants were authored as alternate literals instead of alternate
*renderings* of the same record, so language rode along with tone.

**Recommendation.** Tone-variant strings extend the canonical record:
`{ es: { gentle, direct }, en: { gentle, direct } }`. Resolution order is fixed: **language
first, then tone**. `t()` becomes a selector over the resolved language's variants; it can
never return a string from the other language. Records without tone variants serve their
single string in both tones.

**Acceptance test.** With mode=es and tone=direct, every `t()`-served surface renders
Spanish; grep: zero `t()` call sites passing raw string literals; a regression test seeds
both tones × three modes across the `ui.js:497–515` message family.

---

## 7. D17-7 — Migration order and measurement

**Evidence.** The bypass population is quantified and localized (§1.2); the worst offenders
sit at the highest-stakes moments (BIL-1); the rendered P1 EN-task-bar blocker is a one-line CSS
fix (RES-1).

**Consequence.** This is migration work, not redesign (§1.6 verdict) — it can ship as bounded
batches, each independently testable, compatible with the Concept B roadmap.

**Root cause of ordering:** fix what students hit at decision moments first; convert the
representation before mass-migrating call sites so nothing migrates twice.

**Recommendation — batches, in order:**

| Batch | Scope | Gate |
|---|---|---|
| **M0** | Ship RES-1 EN task-bar CSS fix immediately (also File 2 DS-15) | Task instruction non-empty at 375px in all three modes |
| **M1** | Land `L()` resolver + canonical record + lint gates; migrate the **P1 decision-moment set**: save-confirm modal, draft-saved celebration, stuck menu, completion modal, phase toast (BIL-1) | Those five surfaces' word counts differ by mode; celebration ≤250 modal words (P6) |
| **M2** | All aria-labels (61 index.html + ~47 ui.js) to single-language via resolver | Zero "·" in accessible names; SR spot-check |
| **M3** | data.js: `desc` → `{es,en}`, `followups` split from `" / "` joins, `translang` folded with EN parity | Stage-instruction surfaces mode-consistent in walk |
| **M4** | The ~324 ui.js `" · "` join call sites, in feature-area chunks (status/system messages → modals → buttons/labels) | Grep gate reaches zero; per-chunk walk |
| **M5** | El Laboratorio full Spanish parity + Mani cards re-authored to equal depth | Lab completable entirely in Spanish; ES/EN word counts per card within ±20% |
| **M6** | start-here.html adopts the language system; full tutorial parity | Tutorial walk passes in all three modes |
| **M7** | D17-1 onboarding step 1 (depends on M6 so the step lands in a bilingual tutorial) | D17-1 acceptance test |
| **M8** | `t()` decoupling (D17-6) | D17-6 acceptance test |
| **M9** | Chat source-tagging + heuristic retirement + both-mode delimiter contract (D17-5) | Heuristic code deleted; seeded-miss test passes |

**Measurement (continuous, not end-of-project):** extend `journeys/audit_walk.mjs` into a
word-count harness that runs per batch and records, for every inventoried screen/state ×
mode: visible chrome words, toggle coverage %, and budget compliance. Success criteria:

- **Single-language duplicate suppression:** on every matched legacy-both app-owned surface,
  ES and EN each render no more than **60% of full bilingual source words**, with zero unintended
  translation duplicates (P9 acceptance form).
- **Optional bilingual density:** first-view bilingual content meets the same P6 absolute
  per-state word budgets as other modes and introduces no marquee, horizontal overflow, clipped
  control, or movement/action label longer than two lines.
- **Coverage = 100%**: zero surfaces render the non-selected language in single modes.
- Terminology sweep (D17-4) green.
- Existing bilingual regression suites green throughout.

---

*Protect while migrating (per inventory §5): the ES default, the AI language mirroring, the
stacked quiet-twin grammar (fix its contrast, keep its shape), the existing bilingual tests,
and the mobile ≤480 tab layout.*
