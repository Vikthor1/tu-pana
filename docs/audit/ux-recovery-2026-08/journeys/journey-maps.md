# Tu Pana Writing Studio — Current-State Journey Maps

**UX Recovery Audit 2026-08 — Deliverable 4**

Sources: observational walks `../evidence/walk-*.json` (7 genres desktop, 2 mobile, 1 tutorial; automated Playwright-style walker against the local mock AI server — the orange "MOCK SERVER" banner visible in every screenshot is capture apparatus, not product UI) and the control-level inventory `../inventory/screens-and-navigation.md`. Screenshot citations are relative to `../evidence/`. Walk data is what the walker *observed on screen*; where a code-level explanation exists, the inventory finding ID (F-1…F-22) is cross-referenced rather than re-derived.

**The founder's ten student questions** (scorecard key, from inventory §6):
Q1 Where am I? · Q2 What am I doing? · Q3 What comes next? · Q4 What will this button do? · Q5 Was my work saved? · Q6 Where is my earlier work? · Q7 How do I go back? · Q8 How do I return to my draft review? · Q9 What did the AI contribute? · Q10 What decisions remain mine?

Scorecard values: **Y** = answerable from the visible screen; **P** = answerable only via an extra interaction, a hidden surface, or with a misleading nuance; **N** = not answerable / actively misanswered on the observed screen.

---

## 1. Master journey map (desktop, all genres)

All seven genre walks traversed the identical skeleton; only stage names, preview copy, and two Council outcomes differed (see §2). Phase-by-phase, using the default-genre walk (`../evidence/walk-default.json`) as the canonical citation and noting genre ranges.

### Phase 0 — First entry: the project selector

- **What the student sees:** a dimmed studio behind a centered "Elige tu proyecto · Choose your project" card with 2 options and **no close, skip, or explanation of consequences** (`screens/default/01-first-entry.jpg`; inventory #23, F-20). The page behind it already carries ~1,086–1,093 visible words (first-entry `bodyWords`, all 7 walks). Header already asserts a position: "Paso 1 de 5 · Encuentra tu historia" — before any project exists.
- **Must understand:** that this choice sets the genre overlay; that it is not reversible from any visible control; that the greyed-out app behind it is theirs.
- **Word burden:** ~1,090 words on screen at second zero.
- **Confusion risks:** forced choice with no "just let me look around"; deep-link users skip it (`deepLinkStillShowsSelector: false`), so two students in one classroom see different first screens.
- **Scorecard:** Q1 P (header claims "Paso 1 de 5" of a journey not yet begun) · Q2 P · Q3 N · Q4 P (cards don't say what choosing does) · Q5–Q10 N/na.

### Phase 0b — Onboarding: landing card (and the 18-click corridor)

- **What the student sees:** the landing card "Trae tus palabras. Conserva tu voz." with three CTAs — Empezar a escribir / Ver guía de 3 minutos / Escuchar — its own private language switcher, and the trust line about local-only saving (`screens/default/03-after-lab-skip.jpg`).
- **What the walker recorded:** every desktop walk needed **18 recorded onboarding clicks** to reach the studio (`post-onboarding.onboardingClicks: 18`, all 7 walks), with 17–18 consecutive `onboarding-blocked` probes in which the clicked control (`#labSkip`, the Lab's skip link — present in the DOM, `labSkipVisible: true` from first entry) received the click but nothing advanced; the landing card sat unchanged across screenshots `screens/default/03…19-after-lab-skip.jpg`. This is an automation artifact in the strict sense (a human would press the green button), but it is *evidence of the real hazard*: controls belonging to one onboarding layer remain click-targetable while a different onboarding layer owns the screen (two unlinked onboarding systems, inventory F-15; overlay stack of 10+ registered surfaces, inventory §0).
- **Must understand:** three vocabularies are already live — the landing card's 1-2-3 (Escribe/Decide/Revisa), the header's "Paso 1 de 5", and the calm bar's 3 phases.
- **Scorecard:** Q1 P · Q2 Y (the card's promise is clear) · Q3 P (two doors, no cost shown) · Q4 P · Q5 P (trust line answers it pre-emptively) · Q6–Q10 na.

### Phase 1 — Stages 1–5 (Comenzar): the empty-editor treadmill

- **What the student sees:** task bar "Enfoque · <stage> 1/3", placeholder-filled editor, coach panel right, footer spine with destination-named CTAs — `Continuar a: Conexión`, `← Volver a: Anécdota` etc. (`screens/default/21-stage-01.jpg` … `30-stage-05.jpg`; F2 genre resolution holds in all 70 stage observations, while terminal movement truth fails in the seven Stage-10 observations below).
- **Every stage starts empty.** From Stage 2 on, every single stage observation in all 7 walks shows the prior-work strip: "Tu escritura de la Etapa N (…, 68 palabras) está guardada. Esta etapa empieza vacía. Traerla aquí / Ir a esa etapa / ×" (`priorWorkStrip` non-null at S2–S10 × 7 walks). The F3 remediation works — but the student re-answers "where is my earlier work?" ten times per essay.
- **Word burden (visibleWords, default walk):** 1,018 → 1,167 → 1,161 → 1,436 → 1,447 (S1→S5). The Stage-4 jump (+275) is the research card + tap-to-ask starters landing in the chat column (chatVisibleWords 92 → 312).
- **Misleading saved notice (all stages, all walks):** after every per-stage save probe the progress drawer shows **"Primer borrador guardado · First draft saved — Revisión desbloqueada"** — including after saving Stage-1 anecdote words (`save` steps, S1–S10 × 7 walks). A student who saved 20 words of anecdote is told their *first draft* is saved and *revision is unlocked*. This is the single most repeated untruthful sentence in the product.
- **The 4→5 double interposition:** pressing Continue at Stage 4 is intercepted by the "Antes de seguir: tu investigación · Before You Continue: your research" reflection checkpoint (`click-blocked @S4`, `screens/default/28-blocked-continue-s4.jpg` — checkpoint covering the editor while the footer still shows "Continuar a: Esquema"); after arriving at Stage 5 **the same dialog appears again** (`interposed-dialog @after-advance-5`, `screens/default/29-interposed-after-advance-5-1.jpg`), now stacked with a "NUEVA HABILIDAD" skill toast. Identical pattern in all 7 genres.
- **Scorecard (S1–S5):** Q1 P (three vocabularies: "Paso 2 de 5" header vs "Etapa" gates vs 1/3 dots — F-4) · Q2 Y (task bar is good) · Q3 Y (Continue names destination) · Q4 Y footer / N for the checkpoint that hijacks Continue · Q5 **N** (autosave badge says ✓ Guardado, but the drawer's "First draft saved" is false at these stages) · Q6 Y (strip) · Q7 Y (Back names destination) · Q8 na · Q9 Y (Coach IA chips on live replies) · Q10 P (checkpoint options imply decisions, but their consequence is invisible).

### Phase 2 — Stage 6 (Primer Borrador): the authorship gate

- **What the student sees:** starred task ("⭐ Escribe sin parar…"), Save button drops its bilingual label to bare "Guardar" (`stage @6`, all walks), Continue disabled pre-save with no inline reason (F-12).
- **Observed interception:** pressing Continue after save is blocked by the **phase celebration toast stacked on top of the save-confirmation modal** — screenshot `screens/default/32-blocked-continue-s6.jpg` shows "Lo preparaste todo · You built the foundation" floating over a half-visible "Yes, protect my draft / Cancel" dialog. Two ceremonial surfaces compete for the same click at the journey's most important moment.
- **Word burden:** ~1,497–1,578 visible words.
- **Scorecard:** Q1 Y (milestone framing is strongest here) · Q2 Y · Q3 P (Continue disabled, silent) · Q4 **N** (Continue press lands on a toast; Save opens a modal that opens a ceremony that offers a fork) · Q5 Y — this is the one stage where save language is truthful · Q6 Y · Q7 Y · Q8 na · Q9 Y · Q10 Y (the "no one writes this for you" copy).

### Phase 3 — Stages 7–9 (Revisar): review loop and Council

- **What the student sees:** Five-Questions strip appears (fiveQ true from S7, all walks), footer gains "Revisar borrador" (reviewBtnVisible S7–S9, hidden again at S10 — F5 remediation observed exactly as coded), Voice Vault below editor, and yet another Continue interception: reflection checkpoint at S7 (`click-blocked @S7`, top element `reflect-option-btn`, `screens/default/34-blocked-continue-s7.jpg`), phase toast at S8 and S9 (`37-…`, `39-blocked-continue-s9.jpg`), plus the "Antes de seguir: tu revisión" dialog re-appearing after arrival at S8 (`35-interposed-after-advance-8-1.jpg`). **Across the whole walk, 5 of 9 Continue presses were intercepted by something other than the promised stage preview** (S4, S6, S7, S8, S9 in every genre).
- **Review flow observed:** chooser modal with 5 lenses + purpose + Council offer with exact-word-count disclosure ("tu borrador completo (131 palabras) se enviará al Coach IA tres veces…", `review-chooser`, `screens/default/43-review-chooser.jpg`); lens result renders in the *chat column* with the "¿Y AHORA?" next-actions card (`44-lens-review-result.jpg`); Council report modal with per-finding Aceptar/Adaptar/Rechazar/Decidir después and "Volver a escribir" (`45-council-report.jpg`); post-Council re-entry works — footer button still present, next-actions card still present (`46-post-council.jpg`). The known cross-reload gap (next-actions card is DOM-only, F-8) is corroborated by the refresh probe: after reload at S3 the editor kept its 68 words but every injected card was gone (`refresh-probe`, `screens/default/26-refresh-return.jpg`).
- **Word burden:** the big jump — 1,877 → 1,902 → 1,953 (default S7–S9); chat column alone 557 → 713. Admissions peaks higher (2,170 at S9).
- **Scorecard (S7–S9):** Q1 P · Q2 Y · Q3 Y · Q4 P (Continue still ambushed at 7/8/9) · Q5 N (same false "first draft saved" notice keeps firing on per-stage saves) · Q6 Y · Q7 Y · Q8 **Y in-session / N after reload** (F-8) · Q9 Y (review results carry word counts + Coach IA attribution; Council disclosure is exemplary) · Q10 Y (decision buttons are the app at its best).

### Phase 4 — Stage 10 (Finalizar): the modal ambush

- **What the student sees on arrival:** three stacked layers — the auto-opened capstone modal ("Mi cierre de proceso", 10A self-assessment), a phase celebration toast *on top of it* ("Tu revisión va tomando forma"), and a skill toast on top of that (`screens/default/40-stage-10.jpg`). The 10A panel header adds a **fourth position vocabulary**: "Step 5 of 5 · Reflect & Submit".
- **The self-pointing Continue:** the footer still shows a Continue button whose label names the stage the student is already on — `Continuar a: Mi Cierre de Proceso · Continue to: My Writing Snapshot` (stage @10, all 7 walks; research variant: "Reporte del proceso / Process Report") — and its ES and EN halves are two *different* names for the same thing. The inventory (§5.1) says Continue is hidden at Stage 10; the walks show it visible and self-referential — a truthfulness regression the inventory's code-read missed. Q3/Q4 fail simultaneously: the button promises to take you where you already are.
- **Word burden peak:** 2,387–2,593 visible words (default 2,387; admissions 2,593 — the highest single screen in the study).
- **Not directly observed:** the capstone→process-note→revision-gate→celebration chain (F-9) — the walker did not complete 10A; the chain's shape is from inventory §3.5/§7.3 only.
- **Scorecard:** Q1 P ("Paso 5 de 5" vs "Etapa 10" vs "Finalizar") · Q2 P (buried under 3 layers) · Q3 **N** (self-pointing Continue) · Q4 **N** (✕ may spawn a modal — F-9; Continue goes nowhere) · Q5 N (false notice still fires at S10) · Q6 Y · Q7 Y (Back truthful) · Q8 N (review button gone at S10, observed) · Q9 P (10B disclosure exists per inventory; not observed) · Q10 Y (10A/10C are authorship-affirming).

### Phase 5 — Mi trabajo, submit mode, export

- **Observed early (S2):** hub opens with save status; **the danger zone is already visible inside the hub at Stage 2** (`work-hub-early`, `dangerVisible: true`, all walks; `screens/default/47-work-hub-stage2.jpg`) — collapsed styling per F1 remediation, but present from day one. ~141–161 words.
- **Observed late (S9):** "Preparar entrega →" appears (`work-hub-late`, `prepControl: true`, all walks).
- **Submit mode:** 1,197–1,674 words of readiness diagnostic, AI-activity summary ("Actividad del Coach IA en este navegador: 5 solicitudes"), full report and packet controls; the warn banner correctly says "No completaste ninguna reflexión del proceso" (`submit-mode`, `screens/default/49-submit-mode.jpg`). Honest, complete — and the longest wall of text in the app after Stage 10 itself.
- **Scorecard:** Q1 Y · Q2 Y · Q3 Y · Q4 Y · Q5 **Y — this hub is where Q5 is finally answered truthfully** · Q6 Y (per-stage word inventory) · Q7 Y · Q8 na · Q9 Y (AI request counts) · Q10 Y.

### Language modes (probe at S3)

`both` mode costs ~+200 visible words over single-language (default: EN 1,153 / ES 1,158 / ES·EN 1,356 vs baseline 1,134; same +~18% in all genres). The bilingual default is the right pedagogy but is a measurable +18% word tax on every screen (`language` steps, all walks).

---

## 2. Per-genre divergence table

The skeleton, interpositions, blocked-Continue pattern, saved-notice bug, strip behavior, and refresh/alt-path results were **identical in all 7 walks**. Divergences observed:

| Genre (slug) | Header at entry ("Paso 1 de 5 ·…") | S1→S10 stage names (first / last) | Continue label at S10 (self-pointing) | Council offered? | Council report observed? | Peak words (S10) | Submit-mode words |
|---|---|---|---|---|---|---|---|
| default | Encuentra tu historia | Anécdota → Mi Cierre de Proceso | Mi Cierre de Proceso · My Writing Snapshot | Yes | **Yes** (83-word report) | 2,387 | 1,197 |
| admissions | Encuentra tu historia | Inventario de historias → Reflexión del proceso | Reflexión del proceso · Process Reflection | Yes | **Yes** | 2,593 | 1,674 |
| sop | Encuadre y trayectoria | Encuadre y requisitos → Reflexión del proceso | Reflexión del proceso · Process Reflection | Yes | **Yes** | 2,491 | 1,480 |
| cap200-first-draft | Encuentra tu enfoque | Punto de partida → Reflexión del proceso | Reflexión del proceso · Process Reflection | Yes | **No — offer shown, no report/post-council step captured** | 2,389 | 1,213 |
| cap200-service | Comunidad y propuesta | Punto de partida comunitario → Reflexión del proceso | Reflexión del proceso · Process Reflection | Yes | **Yes** | 2,406 | 1,359 |
| research | Tema y pregunta | Tema y contexto → Reporte del proceso | Reporte del proceso · Process Report | Yes | **No — same gap as cap200-first-draft** | 2,453 | 1,461 |
| stem | Contexto y pregunta | Contexto del laboratorio → Voz y registro científico (S8) → Reflexión del proceso | Reflexión del proceso · Process Reflection | Yes | **No — same gap** | 2,451 | 1,390 |

Notes:
- Every genre's Back/Continue labels resolve through its own layer at all 10 stages (70/70
  genre-correct names). Movement truth is 63/70: the S10 label self-points and is wrong in all 7.
- Under the mock Live-AI server the Council offer rendered for **all 7 genres** — so the walks could not observe the F-17 condition (genres without a council profile / Guía-sin-IA users get no offer and no explanation); that finding stands on the inventory's code evidence alone. The three walks with no captured Council report (cap200-first-draft, research, stem) show the run either not attempted or not completing after "Consejo de revisión" was displayed — the next-actions card was present in `lens-review-result` for all three, so the *entry* to Council existed; the *completion* evidence does not. Treat Council reliability in those genres as unverified.
- Tutorial routing: only the admissions genre was walked through `start-here.html` (see §4); the other five variants of the tutorial script were not exercised.

---

## 3. Mobile journey maps (390×844)

Two short walks: `walk-default-mobile.json`, `walk-admissions-mobile.json` (4 steps each).

### 3a. Default mobile

1. **Stage 2, Draft tab** (`screens/default-mobile/01-stage2.jpg`): header compresses to logo + ES select + theme/reset/help/bug icons; the calm bar shrinks to numbered dots 1·2·3 with an **unlabeled chevron** as the only route to stage navigation — the walk recorded `stageSelect: false` (the 10-stage select exists with all 10 options in the DOM but is *not visible* at rest). Task bar shows "Enfoque · Conexión 1/3" plus the marquee'd instruction. The draft warning strip, editor with 5-line placeholder, footer buttons (Enfoque / Mi trabajo / Volver a: Anécdota / Continuar a: Tu Pitch) and the Borrador/Tu Pana tabs fill one screen — ~910 body words on a phone.
2. **Tu Pana tab** (`02-tab-chat.jpg`): the entire chat column — progress drawer, strips, input.
3. **Back to Draft** (`03-tab-draft.jpg`): state preserved.
4. **Work hub** (`04-work-hub.jpg`): full-screen modal, 59 words — the leanest screen in the entire study.
- **Confusion risks specific to mobile:** stage navigation is invisible until the chevron is found; gate refusals land in the hidden chat tab with no notification dot (F-6 — not directly probed by this walk but the tab/dot structure it depends on is confirmed on screen); `confirmStagePreview` lands on the chat tab (F-22).
- **Scorecard (mobile stage screen):** Q1 P (dots 1·2·3 only) · Q2 Y · Q3 Y (Continue label truthful) · Q4 Y · Q5 P (strip present; drawer with the notice is a tab away) · Q6 N at rest (strip appears only when editor empty; earlier work otherwise a hidden-select away) · Q7 Y · Q8 N (no review button observed on mobile footer at S2 — expected, stage <7) · Q9/Q10 P (chat tab away).

### 3b. Admissions mobile

Identical skeleton; the 10 select options are the admissions layer's names (Inventario de historias … Reflexión del proceso), 917 body words at S2, hub 61 words (`screens/admissions-mobile/01…04`). Divergence from default: names only.

---

## 4. Tutorial journey map (start-here.html, admissions variant)

Two steps captured (`walk-tutorial.json`): the opening screen (`screens/tutorial/01-open.jpg`) and one choice click ("Fair. So what CAN you do?" → `02-choice-1.jpg`).

- **What the student sees:** single-column conversational script — "Before you write a word, *pana*…", genre chip "College Admissions Essay · Ensayo de admisión", progress "3 / 23", coach bubbles making the no-ghostwriting deal, two forced-choice buttons, and the persistent skip link "I've done this before — skip to the app · Ya lo conozco". Copy is **English-dominant** with Spanish accents — the inverse of the app's ES-first rendering; a student who starts here and lands in the app experiences a language-priority flip on top of the onboarding repeat.
- **Journey shape (from inventory §4, not re-walked):** 23 steps across 7 chapters → finale writes `tupana_tutorial_done` → `index.html?assignment=…` → **the app ignores the flag and runs its own full first-run chain** (F-15). The tutorial graduate's reward for 23 steps is the project selector, the landing card, and optionally the Lab.
- **Promise risk:** the script teaches the Council unconditionally (chapter 5); walks confirmed the Council offer only under Live-AI (F-17), and 3 of 7 genre walks captured no completed Council run (§2).
- **Scorecard (tutorial screens):** Q1 Y (progress bar + chapter label) · Q2 Y · Q3 P (forced choices, both leading forward) · Q4 Y · Q5–Q8 na (no work exists) · Q9 P (the deal is *about* Q9/Q10 but describes a Council the student may never see) · Q10 Y.

---

## 5. Ten-questions scorecard — consolidated

| Journey phase | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Project selector | P | P | N | P | – | – | – | – | – | – |
| Landing/onboarding | P | Y | P | P | P | – | – | – | – | – |
| Stages 1–5 | P | Y | Y | Y/N | **N** | Y | Y | – | Y | P |
| Stage 6 gate | Y | Y | P | **N** | **Y** | Y | Y | – | Y | Y |
| Stages 7–9 + review | P | Y | Y | P | N | Y | Y | Y/N* | Y | Y |
| Stage 10 finale | P | P | **N** | **N** | N | Y | Y | N | P | Y |
| Work hub / submit | Y | Y | Y | Y | **Y** | Y | Y | – | Y | Y |
| Mobile stage screen | P | Y | Y | Y | P | N | Y | N | P | P |
| Tutorial | Y | Y | P | Y | – | – | – | – | P | Y |

\* Y in-session, N after reload (F-8, corroborated by refresh probe).

**Reading of the grid:** the footer spine and the work hub answer nearly everything; Q5 ("Was my work saved?") is answered *falsely* for 9 of 10 stages by the recycled "First draft saved — Revision unlocked" notice and truthfully only at Stage 6 and inside the hub; Q3/Q4 collapse exactly where ceremony density peaks (Stage 6 toast-over-modal, Stage 10 self-pointing Continue + auto-modal stack); and no phase answers all ten at once.

## 6. The three worst observed moments

1. **Stage 6, Continue pressed:** celebration toast intercepts the click on top of the save-confirmation modal — two ritual surfaces fighting over the student's most consequential tap (`../evidence/screens/default/32-blocked-continue-s6.jpg`).
2. **Stage 10 arrival:** capstone modal + phase toast + skill toast stacked three deep, while the footer's Continue points at the stage the student is already on (`../evidence/screens/default/40-stage-10.jpg`).
3. **Every save, stages 1–5 and 7–10:** "Primer borrador guardado · First draft saved — Revisión desbloqueada" after saving non-draft stage work — the app's most-repeated sentence is untrue 9 stages out of 10 (save steps, all 7 walks; drawer visible in `../evidence/screens/default/23-stage-02.jpg` context).
