# Cross-genre language alignment + Voice Vault repair

**Founder findings, 2026-08-01**

> 1. Some cards are still displaying language that belongs to the autobiographical essay layer.
> 2. The vault appears to be not working. When you select a sentence, the button for saving it in the vault does nothing.
> 3. This kind of genre language bleeding needs to be addressed at all levels — cards, buttons, checkpoints, celebrations, and any other area where this might surface.

Branch `experiment/redesign-v1`, worktree `~/Sites/tupana-redesign`. Production Pages untouched.

---

## 1. What was actually wrong

### 1.1 Genre bleeding

The July 31 remediation made the **stage/coach seams** genre-aware (stage names, navigation
CTAs, `coachFocus`, coach identity line). It did not touch the **coaching content** those
seams sit on. Every genre layer therefore inherited the default autobiographical essay's
writing vocabulary the moment a card, chip, hint, celebration or modal rendered:

| Surface | Where it came from | What a lab-report / SOP / CAP student saw |
|---|---|---|
| "Stuck" micro-prompt card | `MICRO_PROMPTS` (prompts.js) | "Name one moment you remember" · "Connect the memory to the larger issue" |
| Pana Hint guide card | `PANA_HINTS` (prompts.js) | "An anecdote has three things: a place, a person, and a moment when something shifted" |
| Revision focus panel | `REVISION_SMALL` / `REVISION_BIG` | "Move this anecdote earlier or later" · "you decide what your essay needs" |
| Follow-up question chips | `STAGES[].followups` (data.js) | "What physical sense is missing from my anecdote?" |
| Stage-preview modal | `STAGES[].desc` / `.example` | The eviction-letter / South Bronx worked example, verbatim |
| Stage-preview modal (initial markup) | static `index.html` | "Connect your personal memory to a larger historical…" — persisted at Stage 10 where no preview is opened |
| Task bar + back button + help panel | `STAGE_STEPS`, `STAGES` labels | "Etapa 1 · Anécdota", "Relee tu anécdota" |
| Draft placeholder | static `index.html` | "Recuerdo el día que… / I remember the day when…" |
| Toolkit skill unlock toast | `STAGE_SKILL_DEFS` (data.js) | "I can turn a memory into a focused scene" |
| Progress badges | `computeBadges()` | "Fundador/a de Historia · Story Founder" |
| Stuck affirmation | `STUCK_AFFIRMATIONS` | "Esto no es el ensayo entero" |
| Research card | `RESEARCH_STRATEGIES` | "What types of sources should I look for in this essay?" |
| Voice Polish route | `VOICE_POLISH_ROUTES` | "Why does this sentence matter in my essay?" |
| Phase-completion note | `phaseCompletionNote()` | "research and outlining serve your story" |
| Welcome-back line | `showWelcomeBack()` | "Keep revising — your story is still here" |
| Five Questions (strip + help) | static `index.html` | "the specific person who lived this story" |
| Tu Conocimiento asset | static `index.html` + `MANI_ASSET_DEFS` | "Your personal experience isn't just anecdote" |
| El Laboratorio feedback | static `index.html` | "The mixed-genre essay asks you to show…" |
| Journey-complete card | `injectJourneyCompleteCard()` | pointed at a button named "Guardar / Exportar" that was renamed "Mi trabajo" on 2026-07-31 |

The worst case was the **legacy `cap-200-first-draft` layer**, which has an assignment
context but no profile: every profile-driven override returned null, so it ran the default
essay's stage names, task cues, placeholder and milestones end to end.

### 1.2 The Voice Vault

Four independent causes, all reproduced before fixing:

- **(a) Wrong range.** Protection existed only at Stage 8. Revision now spans Stages 7–9
  (F5, July 31), so a student selecting a sentence at Stage 7 or 9 had no protect
  affordance at all — the toolbar button was `display:none` and no vault panel existed.
- **(b) No affordance at the moment of selection.** What *does* appear when you select a
  sentence is the passage-coach menu (What works / Strengthen / Clarity / Voice / Ask).
  It had no Protect action, so the natural gesture led nowhere.
- **(c) Silent early returns.** `protectSelectedPhrase()` returned with no message when the
  stage was wrong or the selection was collapsed. A click on a button that blurs the
  textarea (Safari/iOS collapses the selection on blur) produced exactly the reported
  symptom: nothing at all.
- **(d) Invisible confirmation.** Success was announced only in the small edit-toolbar
  status line, which is easy to miss and off-screen when the vault is scrolled away.

Additionally, the Voice Polish card's button labelled **"Proteger esta frase · Protect this
phrase"** never protected anything — it only printed a how-to note.

---

## 2. What was built

### 2.1 The genre copy layer (`assets/js/genre-template.js`)

One resolution contract, identical in shape to the existing `resolveCoachFocus()`:

```
no active layer            → the default autobiographical copy (unchanged)
layer defines its own copy → the layer's copy
layer active, copy missing → NEUTRAL copy (never the default essay's)
```

The rule keys off the **active layer**, not off the presence of a profile, so the
profile-less `cap-200-first-draft` layer is covered too.

**Work-noun tokens.** `{workEs}` / `{workEn}` resolve to the active genre's name for the
thing being written, so one neutral sentence reads correctly in every genre:

| assignment | ES | EN |
|---|---|---|
| (default) | ensayo | essay |
| cap-200-first-draft, cap200-bronx-beautiful-service-learning | informe | report |
| research-paper | trabajo de investigación | research paper |
| stem-lab-report | informe de laboratorio | lab report |
| college-personal-statement | ensayo personal | personal essay |
| graduate-sop | carta de propósito | statement of purpose |

Two tokens rather than one because bilingual strings carry both languages in a single
string. `applyGenreTokens()` walks strings, arrays and objects.

**Neutral content sets** (written against the engine's stable stage roles — starting point ·
connection · direction · evidence · plan · unassisted draft · revision · voice · readiness ·
process): `NEUTRAL_MICRO_PROMPTS`, `NEUTRAL_PANA_HINTS`, `NEUTRAL_REVISION_SMALL/BIG`,
`NEUTRAL_FOLLOWUPS`, `NEUTRAL_STAGE_DESC`, `NEUTRAL_STAGE_ENTRY`, `NEUTRAL_STAGE_LABELS`,
`NEUTRAL_STAGE_STEPS`, `NEUTRAL_DRAFT_PLACEHOLDER`, `NEUTRAL_MILESTONES`,
`NEUTRAL_STAGE_SKILLS`, `NEUTRAL_BADGE_TEXT`.

**Resolvers:** `getMicroPromptsFor`, `getPanaHintFor`, `getRevisionMovesFor`,
`getFollowupsFor`, `getStageDescFor`, `getStageExampleFor`, `getStageSkillLabelFor`,
`getBadgeTextFor`, `resolveStageEntry`, plus neutral fallbacks folded into the existing
`getStageLabelOverride`, `getMilestoneLabelOverride`, `getStageStepOverride`,
`getDraftPlaceholderOverride`.

**Per-genre override hook:** any profile may add a `copy: { microPrompts, panaHints,
revisionMoves, followups, stageDesc, stageExample, skills, badges }` block to replace the
neutral set for that genre.

**The admissions layer uses it (founder-approved 2026-08-01).** `college-personal-statement`
now ships its own micro-prompts, Pana Hints, follow-up chips, badges and skill labels,
because that layer's stage ROLES differ from the engine's generic ones (Stage 4 is
meaning/tension, not evidence gathering; Stage 5 is shaping; Stage 9 is reflection +
integrity) — the neutral copy would be off-target there, and narrative vocabulary is native
to a personal statement. The copy holds every prohibition the layer already carries: no
admissions prediction, no prestige framing, no trauma demand ("No story is required of
you… a story you can tell calmly usually writes better than one that still hurts"), and no
copyable prose — starters are openers with blanks.

**Worked examples.** The default essay's eviction-letter example is *default-only*. A
layered genre shows its own example (via `copy.stageExample`) or none — never another
genre's sample writing. Showing nothing is deliberate: a fabricated model passage in a
personal statement or lab report would also cut against the authorship gate.

### 2.2 Voice Vault repair (`assets/js/ui.js`, `assets/js/prompts.js`, `styles.css`)

- **Range:** `VAULT_STAGES = [7, 8, 9]` (`vaultAvailable()`); the panel is injected on entry
  to any of them and removed when leaving; restored on reload at any of them.
- **Protect at the point of selection:** a **Proteger · Protect** action was added to the
  passage-coach menu, shown during Stages 7–9. It is a local save, so unlike the coaching
  actions it stays enabled with no AI connection.
- **Remembered selection:** `rememberDraftSelection()` / `currentDraftSelection()` keep the
  last non-empty selection, so a click that blurs the textarea still protects what the
  student chose.
- **Never silent:** `vaultSay()` answers every attempt — success, nothing selected, too
  short, too long, already protected, wrong stage — in the vault's own `role="status"` line
  *and* the toolbar status, opens the vault, and flashes/scrolls it into view on success.
- **The Protect button now protects:** the Voice Polish "Protect this phrase" route saves the
  current selection when there is one, and falls back to the how-to note when there is not.
- The toolbar/inline buttons stay clickable without a selection (they explain instead of
  looking broken) and gain an `--armed` style when a selection is ready.

---

## 3. Verification

New suites (both gitignore-allowlisted):

- **`genre_leakage_test.mjs`** — walks all **7 genre modes × 10 stages**, renders task bar,
  journey map, badges, footer, buttons, placeholder, coach cards (stage entry, Pana Hint,
  follow-ups, stuck-mini, research card, revision panel, voice polish card, vault, capstone),
  phase celebrations, reflection checkpoints, skill toasts, stage-preview modal, toolkit and
  the "Mi trabajo" hub — then fails on any foreign-genre vocabulary. It also fails if a card
  *throws* (a card that renders nothing would otherwise read as "no leakage"), asserts the
  default genre keeps its own voice, and asserts no `{workEs}/{workEn}` token ever reaches a
  student.
- **`voice_vault_test.mjs`** — availability across 7–9 and absence at 5; the passage menu's
  Protect action; saving from the passage menu, the toolbar, the inline button and the Voice
  Polish route; the remembered-selection path; every not-silent message; persistence across
  reload; and protection in three genres.

Results: see §5.

---

## 4. Deliberate calls worth the founder's eye

1. **Neutral by default, bespoke where it matters.** Every layered genre without its own
   copy gets one carefully written *neutral* set rather than six bespoke ones — that removes
   the misalignment the founder reported and keeps the copy honest, but it does not give
   each genre idiomatic flavour. The admissions layer is the exception (founder-approved,
   §2.1). The `copy:` hook is where the other genres' flavour goes, genre by genre.
2. **Personal statement keeps narrative vocabulary.** "Story", "essay", "memory" and "scene"
   are native to a Common App personal statement, so the guard permits them there and bans
   them elsewhere. Only cross-genre contamination (lab report, service-learning, SOP) is
   banned in that layer.
3. **Shared AI-literacy copy was neutralized globally**, for the default genre too: the Five
   Questions strip, the help-panel cards, `EVAL_FEEDBACK`, the El Laboratorio feedback and
   the Tu Conocimiento "Story as Evidence" card. These teach AI critique, not genre, and the
   narrative phrasing ("the person who lived this story") was the leak. The default genre's
   *writing* copy — anecdote framing, worked examples, milestones, its essay vocabulary — is
   untouched and asserted unchanged by the guard.
4. **Tu Conocimiento's "Story as Evidence"** becomes "Experience as Evidence" **only under a
   layer**; the default keeps the original card.
5. **Legacy `cap-200-first-draft`** now runs neutral stage names/cues rather than the default
   essay's. It was not re-pointed at the modern CAP profile — that would change what the
   assignment *means*, which is a founder decision, not a copy fix.

---

## 5. Results

- **`genre_leakage_test.mjs` — 30 passed, 0 failed.** All six layered genres plus the
  profile-less legacy CAP layer render every surface at all ten stages with no
  foreign-genre vocabulary, no page errors and no card throwing; the default genre keeps
  its anecdote framing, its worked example and its essay vocabulary; work nouns resolve
  correctly for all six assignments; no token ever reaches a student.
- **`voice_vault_test.mjs` — 28 passed, 0 failed.**

- **Full regression — all 36 pre-existing suites accounted for, all green.** Three needed
  updating for shipped-contract changes, each rerun to green afterwards:
  - `bilingual_warmth_test` 19/19 — affirmations now carry `{workEs}/{workEn}`, so pool
    membership is checked against the *resolved* pool (for the default genre this resolves
    back to "ensayo"/"essay"); a new assertion proves no token reaches a student.
  - `interface_polish_test` 23/23 — emptying the stage-preview title in static markup left
    the dialog without an accessible name; a neutral static title ("Siguiente etapa / Next
    stage", replaced on open) restores it. Real regression, caught by the suite.
  - `passage_coach_test` 26/26 — the passage menu now has a sixth action (Protect), hidden
    outside Stages 7–9; the count assertions were narrowed to the five coaching actions and
    a new assertion proves Protect is absent outside the revision stages.
- Re-verified after the admissions copy block landed: `college_personal_statement` 58/58,
  `graduate_sop` 57/57, `stem_lab_report` 70/70, `cap200_labels` 37/37, `voice_vault` 28/28,
  `genre_leakage` 30/30.

---

## 6. Remaining concerns (honest list)

- **Live-model language is not covered by these suites.** The coach's own replies come from
  Gemini via the system prompt; `resolveCoachFocus` + the genre identity line already steer
  it, but only a live per-genre conversation confirms the model does not slip into essay
  vocabulary. That is a founder/lived-experience check.
- **Neutral copy is a floor, not a ceiling.** A STEM student reads "your lab report" in the
  right places, but the coaching *moves* are genre-neutral. Admissions now has bespoke copy;
  CAP 200, research paper, STEM and the SOP do not. If any of them feels thin, that genre's
  `copy:` block is the fix — the seam is built and proven.
- **The admissions copy has not been read by a student yet.** It is new prose; the guard
  proves it does not leak and the layer suites still pass, but only your son reading it tells
  you whether it sounds right.
- **The El Laboratorio sample paragraph** is still the bilingual-upbringing paragraph for
  every genre. It teaches AI critique with one fixed artifact; its framing was neutralized,
  but the artifact itself remains autobiographical.
- **Mobile hand-sweep.** Everything here was verified at 1280×900 plus the existing mobile
  regression suites. A per-genre phone sweep is still the founder's test.
- The vault's 20-phrase cap, 200-character limit and Stage 7–9 range are unchanged product
  decisions, now merely stated out loud to the student when they bind.
