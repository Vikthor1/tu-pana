# Issue Register — Tu Pana Writing Studio UX Recovery Audit

**Deliverable 8 · 2026-07-31 · Audit worktree `/Users/Victor1/Sites/tupana-audit` (app code read-only).**

One deduplicated register of every distinct finding across the five inventory documents and the rendered journey walks. Where two sources found the same defect, entries are merged and both are cited.

**Source key** (all paths relative to `docs/audit/ux-recovery-2026-08/`):
- **[A F-n]** `inventory/screens-and-navigation.md` · **[B Ln]** `inventory/genre-stage-matrix.md` · **[C F-n]** `inventory/persistence-and-save-model.md` · **[D Fn]** `inventory/ai-interaction-model.md` · **[E xxx-n]** `inventory/bilingual-visual-a11y.md` · **[W]** rendered walks `evidence/walk-*.json` + screenshots under `evidence/screens/`.
- **RC-n** → `root-cause-analysis.md`. **R0–R7** → `remediation-roadmap.md` batches (Concept B).

**Severity rubric (final, package-wide):** **P0** demonstrated irreversible loss/overwrite, privacy exposure, or destructive action · **P1** blocks or materially misleads a core journey, creates a credible but not yet demonstrated loss risk, or violates a student-consent/trust contract · **P2** substantial confusion / cognitive burden · **P3** consistency / a11y-polish.
Normalization notes: UX-003 remains P0 because it is an immediately reachable irreversible deletion path; UX-001 is P1 because a second origin makes work *appear* absent but does not itself delete or overwrite the original store. BIL-1/BIL-2/RES-1 are P1 under this final rubric. Items marked **⟲F1..F5** are *residual gaps* of the July remediations (`09c7a91`/`84182d3`) — the fixed behavior itself is verified holding and is not re-reported.

**Scope note on walk evidence:** walks were run against a mock AI server; 7 genres desktop (1280×900), 2 mobile (390×844), 1 tutorial. All step names below (`first-entry`, `interposed-dialog`, `click-blocked`, `save`, `language`, …) are step objects inside the named `evidence/walk-<slug>.json`.

---

## Summary counts (severity × classification)

| Classification | P0 | P1 | P2 | P3 | Total |
|---|---|---|---|---|---|
| persistence | 2 | 6 | 4 | 4 | **16** |
| visual (incl. a11y) | 0 | 7 | 7 | 3 | **17** |
| systemic | 0 | 4 | 7 | 2 | **13** |
| content | 0 | 4 | 2 | 3 | **9** |
| AI-routing | 0 | 3 | 2 | 4 | **9** |
| cross-genre | 0 | 0 | 3 | 3 | **6** |
| architectural | 0 | 1 | 3 | 2 | **6** |
| stage-specific | 0 | 0 | 2 | 3 | **5** |
| genre-specific | 0 | 2 | 2 | 0 | **4** |
| **Total** | **2** | **27** | **32** | **24** | **85** |

---

## P0 — data loss / privacy / irreversible

### UX-002 · P0 · persistence — `importData()` applies a backup silently, merge semantics, no safety copy
- **Repro:** any genre/stage; hub → Otras opciones → Importar; pick an older/wrong/foreign `.json`.
- **Evidence:** [C F-2] `storage.js:114–136` (parse → apply → reload, no confirm), `_applyTupanaBackup` `storage.js:69–84` (merge, not replace).
- **Expected vs actual:** expected — preview ("file from DATE, N words at stages…"), explicit replace confirmation, automatic pre-import snapshot; actual — instant overwrite of newer `tupana_writing_s*`/`tupana_draft`; keys absent from the file survive, producing hybrid states.
- **Student consequence:** one wrong file pick (common on shared devices) destroys newer work unrecoverably.
- **Root cause:** RC-3 (+RC-7 — the *clear* path got typed confirmation, the equally destructive *import* path got none). **Direction:** R0 item 2 now; full redesign `proposed-save-persistence-model.md` §4, §9.

### UX-003 · P0 · persistence — Header Reset: total permanent destruction one native confirm away, mislabeled ⟲F1
- **Repro:** any genre/stage; header ↻ icon between theme toggle and Help; tooltip "Reiniciar desde el inicio · Reset to onboarding".
- **Evidence:** [A F-1] `resetApp()` `ui.js:6856–6860` (`localStorage.clear()` + reload); `index.html:43`. Severity elevated from source P1 per this register's rubric (irreversible loss of all drafts/chat/decisions/capstone/council).
- **Expected vs actual:** expected — same friction as the danger zone (collapsed placement, typed confirm, backup offer); actual — icon-only everyday header control + one reflexive native `confirm()`. Residual gap: F1 remediation moved "Borrar mis datos" into the danger zone but never touched this equally destructive sibling.
- **Student consequence:** a mis-tap plus a reflexive OK ends the project.
- **Root cause:** RC-7. **Direction:** R0 item 3 (typed confirmation + in-flow backup offer).

---

## P1 — blocks or materially misleads a core journey

### UX-001 · P1 · persistence — Origin-scoped work is invisible and unexplained across devices/origins
- **Repro:** any genre, any stage; open the app from a second browser, device, or a different URL of the same deploy (preview vs production, http vs https, `www.` vs apex).
- **Evidence:** [C F-1] `app.js:138–162` (factory boot, no "work may exist elsewhere" message); C §5 multi-origin analysis; `index.html:965–968` (only tip is a collapsed hub detail); iframe-only Safari warning `app.js:113–123`.
- **Expected vs actual:** expected — the app tells a student on a fresh origin that their work may live in another browser/link and offers the import door; actual — fresh onboarding over an empty editor, indistinguishable from total loss.
- **Student consequence:** the founder's son's personal statement lives only in `tupana-preview.pages.dev` storage in one profile; any other entry point reads as lost work, invites a duplicate start, and the real store can then age out (Safari 7-day) with nothing exported. The origin switch itself does not delete or overwrite the original store, so this is P1 rather than P0.
- **Root cause:** RC-3. **Direction:** R3 origin/device honesty card + "Did you start somewhere else?" boot door (`proposed-save-persistence-model.md` §7, §9).

### UX-004 · P1 · systemic — Checkpoints/celebrations interpose over transitions and block the Continue button (rendered)
- **Repro:** all 7 genres, desktop, any language. Continue at stages 4, 6, 7, 8, 9; arrive at stages 5 and 8.
- **Evidence:** [W] every desktop walk: `click-blocked` at stages 4/6/7/8/9 + `interposed-dialog` `after-advance-5` ("Antes de seguir: tu investigación") and `after-advance-8` ("…tu revisión"). Screenshots `evidence/screens/default/28-blocked-continue-s4.jpg` (reflection checkpoint covering the whole screen, Continue unreachable), `29-interposed-after-advance-5-1.jpg` (the *stage-4* checkpoint still open **over the arrival at stage 5**, with a "Nueva habilidad" toast popping under it and the prior-work strip behind — three simultaneous notification surfaces), `32-blocked-continue-s6.jpg` (phase-celebration toast stacked **on top of the save-confirm modal**, both cut off). Code: auto checkpoints `ui.js:5839–5852`; `PHASE_CELEBRATIONS` `ui.js:6690` (no auto-dismiss); related [A F-9].
- **Expected vs actual:** expected — one surface at a time, and a dialog titled "Before you continue" appears before continuing; actual — dialogs stack over dialogs at exactly the transition moments, block the primary CTA, and the "before" dialog is still on screen after the student has already advanced.
- **Student consequence:** the primary button intermittently "doesn't work"; the student answers a stage-4 question while looking at stage 5; celebrations interrupt the save ceremony.
- **Root cause:** RC-6. **Direction:** R1 — checkpoints live inside their step; walker-asserted "nothing interposes over any dialog" (`proposed-navigation-ia.md` §4).

### UX-005 · P1 · systemic — The footer Focus button lies (and dies) in hide-coach focus mode
- **Repro:** default genre (any), desktop or mobile; Estoy atascado → "Me siento abrumado/a" or "Necesito un descanso"; then press the footer button now labeled "Salir · Exit".
- **Evidence:** [A F-2] two focus systems write one `#focusToggle`: `toggleFocusMode()` `ui.js:6865–6875` rewrites the label, but the handler is `toggleDraftFocus()` (`index.html:204`) whose `enterDraftFocus()` no-ops during focus mode (`ui.js:6882–6890`); trap path `ui.js:6616–6658`.
- **Expected vs actual:** "Salir · Exit" should exit; it does nothing (only the small `Mostrar coach` hint or Escape exits).
- **Student consequence:** the students who just pressed "I'm overwhelmed" are stranded in a stripped screen with a dead Exit control.
- **Root cause:** RC-1. **Direction:** R0 item 6 (one owner, one truthful label).

### UX-006 · P1 · content — "Primer borrador guardado — Revisión desbloqueada" shown for stage 1–5 saves (rendered) ⟲F1
- **Repro:** all 7 genres, desktop; write anything at stage 1–5; open Mi progreso drawer.
- **Evidence:** [W] every desktop walk, `save` steps at stages 1,2,3,4,5: `savedNotice: "Primer borrador guardado · First draft saved — Revisión desbloqueada"` — identical from stage 1 (no first draft exists; revision is NOT unlocked) through stage 10.
- **Expected vs actual:** expected — the saved-notice reflects what is saved (stage work) and what is unlocked (nothing yet); actual — a single-purpose Stage-6 string renders for every save, falsely claiming the authorship milestone has been passed.
- **Student consequence:** at stage 2 the app claims "first draft saved / revision unlocked"; when the stage-7 gate then refuses navigation, the app has contradicted itself — direct damage to save-status trust the F1 remediation was meant to restore.
- **Root cause:** RC-1 (+RC-8: 36 green suites froze the wrong string). **Direction:** R0 truthful interim messaging now; R1 status rail with per-event truthful save messages (`proposed-navigation-ia.md` §5).

### UX-007 · P1 · AI-routing — Council silently reviews STEM lab reports and legacy CAP as autobiographical essays
- **Repro:** `?assignment=stem-lab-report` or `cap-200-first-draft`, stage 7–9, Live-AI mode → Revisar borrador → Convocar al consejo.
- **Evidence:** [B L1] `COUNCIL_PROFILES` has no entry for either id; `getCouncilProfile()` `council.js:158–164` inherits `default`; prompts embed "first-year college mixed-genre autobiographical essay…" (`council.js:212, 244`). [W] `walk-stem.json`/`walk-cap200-first-draft.json` `review-chooser` steps: `councilOffer: True` with full disclosure rendered — offer present, wrong profile behind it, zero UI cue.
- **Expected vs actual:** expected — genre-correct review or an explicit "Council not available for this assignment"; actual — wrong-genre mandates and synthesis order end to end, silently.
- **Student consequence:** a lab-report student receives structure/evidence/voice guidance calibrated for a personal essay and has no way to know.
- **Root cause:** RC-4. **Direction:** R0 item 4 (explicit neutral profile or disable + config-gap warning + test).

### UX-008 · P1 · genre-specific — start-here tutorial route maps contradict the actual in-app journeys
- **Repro:** `start-here.html?assignment=college-personal-statement` (the founder's son's link), `graduate-sop`, `research-paper`, `stem-lab-report`; compare route chapter to in-app stage names.
- **Evidence:** [B L2] admissions route = default essay's route verbatim (`start-here.html:366–368` '1 Memory…5 Outline' vs layer's Story Inventory…Shape the Essay, `genre-template.js:841–852`); SOP route says "1 Origin moment" (`start-here.html:388–390`) while the SOP layer's coachFocus explicitly forbids forcing origin stories (`genre-template.js:1251–1253`); research/stem drift (`start-here.html:432–434, 454–456`).
- **Expected vs actual:** first-contact preview should match the journey; it previews stages that do not exist and, for SOP, contradicts the layer's own doctrine.
- **Student consequence:** the first thing an admissions student learns about the route is wrong; trust debt before stage 1.
- **Root cause:** RC-4. **Direction:** R7 (tutorial routes match the active layer).

### UX-009 · P1 · genre-specific — `cap-200-first-draft` loses its genre entirely through start-here
- **Repro:** `start-here.html?assignment=cap-200-first-draft` on a browser with no remembered id; finish or skip the tutorial.
- **Evidence:** [B L3] id absent from start-here `GENRES` (`start-here.html:329–460`); `resolveGenreId()` (`466–472`) silently serves the essay tutorial; `APP_URL` drops the assignment (`start-here.html:332`).
- **Expected vs actual:** the genre link should carry the genre; the student lands in the plain default-essay app with zero signal.
- **Student consequence:** a full wrong-genre journey from a legitimate course link.
- **Root cause:** RC-4. **Direction:** R7.

### UX-010 · P1 · AI-routing — Tu Conocimiento sentence transmitted with every live-AI chat message, never disclosed
- **Repro:** any genre; complete Tu Conocimiento; send any chat message in Coach IA mode.
- **Evidence:** [D F1] `maniSentence` (≤280 chars of student prose) in channel data `ui.js:2940, 3154`; contrast the capstone path which *strips it specifically* to keep its disclosure literally true (`ui.js:1265, 1002–1006`) — the team's own standard, unmet on the highest-frequency path.
- **Expected vs actual:** every send of student prose is named at the moment of consent (the D4–D7 pattern); actual — a generic first-send cue only.
- **Student consequence:** something personal/identifying written in the identity-affirmation module is shared with Gemini on every message without the student knowing.
- **Root cause:** RC-7. **Direction:** R0 strips `maniSentence` from routine sends or adds exact moment-of-consent disclosure now; R4 supplies the durable share-toggle and unified send contract (`proposed-ai-experience-model.md` §6.1).

### UX-011 · P1 · AI-routing — Council findings and Accept/Adapt/Reject decisions never reach the student's evidence trail
- **Repro:** any council-profiled genre; run the Council, record decisions; open Process Note / report / packet.
- **Evidence:** [D F2] decisions stored `council.js:522–535` but report/Note/packet read only `tupana_decisions` and aggregate counts (`ui.js:7445–7501, 7521, 7580`).
- **Expected vs actual:** Process Note Q4/Q5 ("what did you accept/reject?") should render the recorded answers; actual — the student reconstructs from memory while the exact data sits in localStorage.
- **Student consequence:** the most structured AI-judgment evidence the app collects is invisible to the student's own process story and to the instructor.
- **Root cause:** RC-3. **Direction:** R4 decision ledger feeding Process Note + attribution (`proposed-ai-experience-model.md` §4, §10).

### UX-012 · P1 · persistence — The submitted "final essay" is chosen by heuristic; no canonical marker; stage number beats recency
- **Repro:** any genre; substantially rewrite at s7 after polishing at s8; generate the packet.
- **Evidence:** [C F-6] `getFinalEssay()` `ui.js:7718–7736` (revised-vs-draft, then higher stage, then length); no timestamps exist to do better (C §1.5); selection surfaced only in the submit-mode diagnostic.
- **Expected vs actual:** the student designates (or at least sees, while editing) which version submits; actual — the packet can silently contain an older text than the one last worked on.
- **Student consequence:** submitting the wrong version, discoverable only by reading the packet body.
- **Root cause:** RC-3. **Direction:** R0 requires an interim preview + explicit final-draft confirmation before packet generation; R2 supplies the current-draft marker and retires the heuristic (`proposed-save-persistence-model.md` §3).

### UX-013 · P1 · persistence — Decision log hard-capped at 50, silently truncated at every write
- **Repro:** any long project; make >50 eval/checkpoint decisions; compare tallies.
- **Evidence:** [C F-4] every write is `log.slice(-50)` (`ui.js:1570, 5806, 6156, 6292`).
- **Expected vs actual:** AI-literacy evidence is complete or its bounds disclosed; actual — earliest decisions silently shed; report/Note tallies undercount with no indication.
- **Student consequence:** the packet's evidence corrodes exactly on the most engaged students. (The pilot already flagged untrustworthy tallies.)
- **Root cause:** RC-3. **Direction:** R2 versioning/retention rules (`proposed-save-persistence-model.md` §5).

### UX-014 · P1 · persistence — Write failures are silent everywhere except the autosave path
- **Repro:** Safari private mode or quota pressure; chat, decide, fill the Process Note.
- **Evidence:** [C F-5] all persistence except `autosaveFlush` (`ui.js:2374–2388`) swallows exceptions (`catch(e){}`): chatlog, decisions, process note, capstone, vault, council.
- **Expected vs actual:** the app claims "auto-saves in this browser" (`ui.js:7137`, `index.html:980`) — it should stop claiming that when writes fail; actual — nothing lands and nothing says so.
- **Student consequence:** an entire session's evidence can be lost while every indicator stays green.
- **Root cause:** RC-3. **Direction:** R0 establishes a minimum no-silent-write-failure banner and export escape now; R3 supplies the unified persistence-status architecture and storage-persistence request (`proposed-save-persistence-model.md` §6).

### UX-015 · P1 · persistence — Safari 7-day eviction disclosed only in a collapsed hub tip and an iframe-only message
- **Repro:** standalone Safari (not inside Brightspace), personal device — the likeliest home case.
- **Evidence:** [C F-7] `index.html:965–968` (collapsed `<details>`), `app.js:113–123` (fires only in iframes).
- **Expected vs actual:** the student most at risk gets the warning; actual — that student never sees it.
- **Student consequence:** a whole project silently evicted after a week's absence.
- **Root cause:** RC-3. **Direction:** R3 dated eviction notice (`proposed-save-persistence-model.md` §6).

### UX-016 · P1 · persistence — Destruction co-located with routine reassurance; backup less discoverable than delete
- **Repro:** any genre, from stage 1: footer "Mi trabajo" → the danger zone rides along in every open.
- **Evidence:** [C F-3] `storage.js:138–154`, `index.html:955–963`; no one-tap "download backup, then delete" inside the flow. [W] all desktop walks, `work-hub-early` at **stage 2**: `dangerVisible: True` (also `work-hub-late`, `submit-mode`); e.g. `evidence/screens/default/47-work-hub-stage2.jpg`.
- **Expected vs actual:** destructive management belongs at device-handoff/end-of-course, far from day-one save reassurance; actual — present from the first hub open, while backup hides under collapsed "Otras opciones" [C F-16 → UX-077].
- **Student consequence:** the routine "was my work saved?" surface always carries a loaded weapon.
- **Root cause:** RC-7. **Direction:** R3 — backup/import/danger leave the routine hub for Settings + dedicated danger screen (`proposed-navigation-ia.md` IA-10).

### UX-017 · P1 · visual — EN-mode phones have an EMPTY task instruction bar (rendered CSS bug)
- **Repro:** any genre, viewport ≤640px, language = EN; look at the current-task bar.
- **Evidence:** [E RES-1] base ≤640 CSS hides `.ctb-en` (`styles.css:5407`); `html[data-lang="en"]` hides `.ctb-es` with `!important` (`6481`) but the EN rule (`6483–6487`) never restores `display`. Measured at 375px: task instruction = `""` in EN, full in ES/both.
- **Expected vs actual:** the "what do I do now" line shows in the chosen language; actual — English-preferring phone users get nothing on the ADHD-critical orientation surface.
- **Student consequence:** no current-task guidance for an entire language population on phones.
- **Root cause:** RC-5. **Direction:** R0 item 1 — one-line CSS fix, ship immediately.

### UX-018 · P1 · content — Highest-stakes decision modals ignore language preference entirely
- **Repro:** any genre, language = ES or EN; reach the Stage-6 save-confirm, draft-saved ceremony, stuck-triage menu, completion celebration.
- **Evidence:** [E BIL-1] save-confirm 69 words in **every** mode (0% reduction); ceremony −19%; stuck menu −13% (`index.html:788–845, 396–426, 1002–1017`; measured table E §1.3).
- **Expected vs actual:** the moments of maximum emotional load honor the chosen language; actual — fully hardcoded bilingual prose, both languages interleaved line-by-line.
- **Student consequence:** double reading burden at the authorship-gate decision and when asking for help while stuck.
- **Root cause:** RC-5. **Direction:** R5 — decision-moment modals are migration batch priority M-first (`bilingual-content-strategy.md` M0–M9).

### UX-019 · P1 · content — El Laboratorio and the start-here tutorial are English-gated pedagogy
- **Repro:** ES-mode student; open the 3-minute guide (Lab) or any start-here link.
- **Evidence:** [E BIL-2] Lab step headings, all 5 question labels, choices, feedback EN-only with Spanish garnish (`index.html:600–785`); start-here has zero show-es/show-en spans. [W] `walk-tutorial.json` `tutorial-choice-1`: rendered choice "Fair. So what CAN you do?" (EN) on the admissions tutorial.
- **Expected vs actual:** the critical-AI-literacy training of a Spanish-default product works in Spanish; actual — the pedagogical heart requires English.
- **Student consequence:** the Five-Questions judgment training — the app's equity core — excludes its primary population.
- **Root cause:** RC-5. **Direction:** R5 (lab + start-here full Spanish parity).

### UX-020 · P1 · systemic — No single bilingual source of truth: 4 encodings, ~363 bypass joins, heuristic chat filtering; language toggle removes only ~15% mid-journey (rendered)
- **Repro:** any genre, mid-journey (stage 3+); switch ES↔EN↔both and count what changes.
- **Evidence:** [E BIL-3] ~324 hardcoded " · " joins in ui.js + 39 " / " joins in data.js; four incompatible encodings (spans, ·-joins, /-joins, `{es,en}` objects). [E BIL-5] `wrapBilingualHtml()` `ui.js:2754–2799` regex-detects language by string *shape*. [E BIL-6] data.js `desc` EN-only / `translang` ES-only / `followups` always-both. [W] every desktop walk `language` steps: both ≈1356–1373 body words → es ≈1158–1172 / en ≈1134–1153 — **a 15% reduction where the span system promises 50–55%** (fresh chrome measured −38–55% in E §1.3; accumulated chat strings bypass the toggle).
- **Expected vs actual:** choosing one language halves the reading load; actual — most of the screen ignores the preference, and correctness depends on string shape.
- **Student consequence:** the language preference is a promise the product mostly doesn't keep; bilingual-mode chrome ≈330 words before writing anything.
- **Root cause:** RC-5. **Direction:** R5 — single `{es,en}` representation + `L()` resolver,
  single-language duplicate suppression, and P6-bounded optional bilingual density.

### UX-021 · P1 · content — `t()` conflates tone with language: Direct tone silently switches feedback to English-only
- **Repro:** ES mode; set tone toggle to Directo; trigger vault/system feedback.
- **Evidence:** [E BIL-4] `t(gentle, direct)` `ui.js:294`; direct variants EN-only at e.g. `ui.js:497, 500, 504, 507`.
- **Expected vs actual:** tone and language are orthogonal; actual — a tone choice changes the language of system feedback.
- **Student consequence:** an ES-mode student who prefers directness is punished with English.
- **Root cause:** RC-5. **Direction:** R5 (`t()` tone/language decoupling).

### UX-022 · P1 · visual (a11y) — Focus-trap and dialog-role coverage stops at the 10 static overlays
- **Repro:** keyboard/SR user; open Toolkit, Help, eval drawer, reflection checkpoint, revision gate, council cards, project selector, landing welcome, mani celebration.
- **Evidence:** [E A11Y-1] `getOpenStaticDialog()` `ui.js:3575–3590` checks only static IDs; dynamic dialogs get `aria-modal="true"` but no Tab containment; `projectSelector` (`ui.js:5030`) and `maniCelebration` (`ui.js:5313`) have **no role at all** and are styled by inline cssText outside the token/dark-mode contract [E VIS-2 → UX-051].
- **Expected vs actual:** every dialog traps focus and declares itself; actual — Tab walks into a background that `aria-modal` simultaneously declares unavailable — worst of both.
- **Student consequence:** keyboard/SR students get lost inside the app's most frequent surfaces, including the mandatory first-run selector.
- **Root cause:** RC-6. **Direction:** R6 — one dialog family, contract-keyed traps (trap on class, not ID list).

### UX-023 · P1 · visual (a11y) — Journey map is mouse-only: 0 of 10 stage nodes tabbable; tooltips hover-only
- **Repro:** desktop keyboard user; Ver ruta; try to reach any stage node. Tablet user: try to read a stage description.
- **Evidence:** [E A11Y-2] rendered: 10 `.stage-node`, 0 tabbable, role=null (`buildMap` `ui.js:1746–1789`, click+mouseenter on divs); [A F-18] `showTip` mouseenter-only `ui.js:1786, 2288`; mobile `<select>` alternative only exists ≤480px.
- **Expected vs actual:** random-access navigation is operable by keyboard/touch/SR; actual — desktop keyboard and tablet users cannot use the map at all.
- **Student consequence:** an entire nav paradigm is unavailable to non-mouse users.
- **Root cause:** RC-1. **Direction:** R6 (nodes become buttons with roles); R1 makes the map one tap away.

### UX-024 · P1 · visual (a11y) — ~108 hardcoded bilingual aria-labels defeat the language preference for SR users
- **Repro:** ES mode + VoiceOver; focus any control (e.g. "Deshacer · Undo").
- **Evidence:** [E A11Y-3] 61 aria-labels in index.html + ~47 in ui.js hardcode "ES · EN"; `<html lang>` flips with `setLang`, so every control name reads twice with the wrong-language half in the wrong voice; only ~39 inline `lang` spans exist.
- **Expected vs actual:** single-language accessible names matching the preference; actual — doubled, mis-voiced names on every control.
- **Student consequence:** SR experience is systematically twice as long and garbled.
- **Root cause:** RC-5. **Direction:** R5 (aria-labels single-language via the same `L()` resolver).

### UX-025 · P1 · visual — `--text-muted` fails WCAG AA everywhere it's used — and it is the assigned color of English text in bilingual mode
- **Repro:** light theme, any screen; measure hint/microcopy and the "quiet twin" English half.
- **Evidence:** [E VIS-5] 2.75:1 on `--bg-base` (2.92 panel; dark raised 2.49); 109 usages; quiet-twin convention demotes the EN half to muted (`styles.css:6519–6523`).
- **Expected vs actual:** both languages readable at AA; actual — the design system renders one language below AA contrast.
- **Student consequence:** low-vision and any-vision-in-sunlight students lose hints and the second language.
- **Root cause:** RC-5 (contrast choice is the bilingual grammar's). **Direction:** R6 token retune (≈#7A6C60 passes; verified values in the design-system doc).

### UX-026 · P1 · visual — Dark-mode primary buttons (Save/Continue) fail AA at 2.98:1
- **Repro:** dark theme; look at the two most important controls in the app.
- **Evidence:** [E VIS-6] white on `--amber` #D4823A / `--grad-amber`.
- **Expected vs actual:** primary CTAs meet AA in both themes; actual — they fail in dark mode (and the light gradient midpoint sits ≈3.1).
- **Student consequence:** the main action path is the hardest thing to read.
- **Root cause:** RC-1 (per-family styling; contrast fixes never swept this family). **Direction:** R6.

### UX-027 · P1 · visual — No virtual-keyboard strategy on phones: ~100px of writing surface while typing
- **Repro:** iPhone-class viewport; focus the draft textarea or chat input.
- **Evidence:** [E RES-2] rendered at 375×667: 224px chrome, textarea 257px; minus ~260px keyboard ≈ 4 lines; no `visualViewport` handling exists (grep), fixed bottom tabs and 42% chat split don't adapt.
- **Expected vs actual:** the writing app protects the writing surface while writing; actual — it keeps its chrome instead.
- **Student consequence:** phone-first students (the pilot population) write through a letterbox.
- **Root cause:** RC-1. **Direction:** R6 visualViewport keyboard contract.

### UX-028 · P1 · systemic — Phone stage navigation is hidden two taps deep behind "Ver ruta"
- **Repro:** ≤480px, any genre, stage 2; look for a way to change stages.
- **Evidence:** [E RES-3] `.mobile-stage-nav{display:none}` shown only under `.path-details-open` (`styles.css:8019–8020`); journey map itself display:none ≤480. [W] `walk-default-mobile.json`/`walk-admissions-mobile.json` `mobile-stage2`: `stageSelect: false` while `mobileTabs: true` (`evidence/screens/default-mobile/01-stage2.jpg`).
- **Expected vs actual:** stage movement is one visible control; actual — invisible until the student already knows the toggle.
- **Student consequence:** mobile students are effectively locked to the linear spine without knowing an alternative exists.
- **Root cause:** RC-1. **Direction:** R1 (journey map always one tap away, all form factors).

### UX-029 · P1 · architectural — Component proliferation: ~60 button styles, ~16 modal families, 36 card classes, ≥8 status patterns
- **Repro:** n/a (codebase-wide); visible as inconsistent primaries, missed fixes per family.
- **Evidence:** [E VIS-1] 65 `*btn*` classes; ~16 modal/overlay families; 36 `*card*` classes; ≥8 status-message patterns; ≥5 competing "primary" treatments; every sprint shipped its own family, so 44px/contrast/focus fixes must be re-applied per family and several were missed (see UX-026, UX-054).
- **Expected vs actual:** base components + variants; actual — a new family per feature sprint.
- **Student consequence:** no single mental model of "where the app talks to me" or "what a primary action looks like"; a11y regressions structurally recur.
- **Root cause:** RC-1. **Direction:** R6 consolidation (buttons 65→6, one dialog family, one status pattern).

---

## P2 — substantial confusion / cognitive burden

### UX-030 · P2 · visual — The coach appears to be typing forever on first load
- **Evidence:** [A F-3] `#typingRow` ships `class="typing on"` (`index.html:375`; `styles.css:2107`); no boot-path `showTyping(false)`.
- **Expected vs actual:** typing dots mean a message is coming; actual — they animate from boot until the student sends something.
- **Consequence:** first-time students wait for the coach instead of writing — inverting the "your words first" opening. **Root cause:** RC-6 (UI state not driven by app state). **Direction:** R0 item 7.

### UX-031 · P2 · systemic — Four progress vocabularies; "Paso" means two different things
- **Repro:** any genre; compare header, mobile selector, gate refusals, step dots.
- **Evidence:** [A F-4] phases / milestones ("Paso 2 de 5", `ui.js:2054`; "Hito N" in Help `ui.js:8556`) / stages ("Etapa N", `ui.js:1926/2170`) / in-stage steps ("1/3"; mobile selector labeled "Paso · Step" listing *stages*, `index.html:99`). [W] every walk `first-entry.headerSub`: "Paso 1 de 5 · …" while the task bar says "Etapa/Enfoque". Overlaps [E BIL-7 → UX-057].
- **Expected vs actual:** one answer to "Where am I?"; actual — three simultaneous, mutually untranslated answers.
- **Consequence:** permanent low-grade disorientation, worst for the ADHD students the product targets. **Root cause:** RC-1. **Direction:** R1 single vocabulary (10 steps in 3 acts; milestones out of UI).

### UX-032 · P2 · systemic — Navigation is recorded as completion
- **Evidence:** [A F-5] `goToStage()` marks previous stage done on any forward move (`ui.js:2045`), boot back-fills (`app.js:42–44`); checkmarks + instructor report "stages completed" (`ui.js:8195`) mean "was clicked past".
- **Expected vs actual:** done = work exists; actual — done = traversed. The map cannot be trusted as a to-do list; instructor-facing evidence overstates progress.
- **Root cause:** RC-3. **Direction:** R1 (completion means evidence, `proposed-navigation-ia.md` §1.2).

### UX-033 · P2 · systemic — On mobile, gated navigation is a silent failure (explanation lands in the hidden tab, no dot)
- **Evidence:** [A F-6] gate refusals go through `addSys()` into the chat panel; the mobile select snaps back (`ui.js:1853–1860`); `notifyMobileChat()` fires only for `bot` messages (`ui.js:280, 2723`). [E RES-5] the dot has no live-region announcement either.
- **Expected vs actual:** a refusal is explained where the student is looking; actual — "the dropdown is broken."
- **Root cause:** RC-2. **Direction:** R1 status rail + mobile notification-dot rule (`proposed-navigation-ia.md` §5.4).

### UX-034 · P2 · systemic — Evaluation/decision paradigm proliferation: 4 eval surfaces, 3 decision grammars, lens reviews capture nothing
- **Evidence:** [A F-7] Five-Questions strip + per-message eval bar/drawer + legacy eval card + reflection checkpoints, writing to two stores (`ui.js:2110–2131, 5953, 5988/6028, 5854, 5759`). [D F5] chat→good/warn/flag, lens reviews→no capture at all (`ui.js:4215–4233`), Council→Accept/Adapt/Reject/Defer (`ui.js:4480–4517`).
- **Expected vs actual:** one legible "my judgment is recorded" grammar; actual — five competing widgets and a review type that records nothing.
- **Consequence:** "What decisions remain mine?" has no stable answer; counters hard to trust (pilot-flagged). **Root cause:** RC-1. **Direction:** R4 unified grammar + ledger (`proposed-ai-experience-model.md` §3–4).

### UX-035 · P2 · systemic — Post-review re-entry affordances are DOM-only and vanish on reload ⟲F5
- **Evidence:** [A F-8][D F4] `#reviewNextActions` appended via `appendChild`, never written to the chatlog (`ui.js:4240–4272`); after refresh the path back to lenses/Council/last report disappears; F5 remediation holds in-session only.
- **Expected vs actual:** re-entry survives a reload; actual — rediscovery of the footer button after every refresh, mid-revision.
- **Root cause:** RC-6. **Direction:** R4 persistent Review center (`proposed-ai-experience-model.md` §5).

### UX-036 · P2 · stage-specific — Stage-10 close buttons open new dialogs (modal ambush at the finale)
- **Evidence:** [A F-9] capstone ✕ auto-opens Process Note 450 ms later (`ui.js:863–877`); "Completar" can bounce into the revision gate (`ui.js:7238–7247`); "Generar Reporte" can close the capstone and open the gate (`ui.js:8166–8174`); six chained surfaces guard the last click (A §7.3).
- **Expected vs actual:** ✕ closes; actual — dismiss/complete controls spawn unrequested modals.
- **Root cause:** RC-6. **Direction:** R1/R3 Finish space (`proposed-navigation-ia.md` §7) — the chain becomes a visible checklist, not stacked modals.

### UX-037 · P2 · AI-routing — Council verify loop dormant; last report unreachable outside stages 7–9
- **Evidence:** [D F3] `recordCouncilVerification` exported, never called (`council.js:538–551`); "Ver último informe" exists only inside the review dialog (`ui.js:4321, 4335`), which only opens at 7–9.
- **Expected vs actual:** decide → revise → re-review; actual — the loop ends at decide, and at Stage 10 the student cannot reopen the report they acted on.
- **Root cause:** RC-3. **Direction:** R4 (verification loop live; report history with stale labels).

### UX-038 · P2 · architectural — requestKind contract hand-synced across three lists; unknown kinds silently starve
- **Evidence:** [D F6] client model map (`ai-provider.js:50`), usage buckets (`:131`), Worker known-kinds/budgets (`index.js:90–117, 246–255`); unknown kinds fall to flash/600-token/thinking-ON — the documented JSON-starvation mode.
- **Expected vs actual:** one exported table or a version handshake; actual — a client-only addition ships truncated output no one can see fail.
- **Root cause:** RC-8. **Direction:** R4 (single exported kind/budget table).

### UX-039 · P2 · AI-routing — Disallowed-origin 403 masquerades as a transient error; a Council run burns up to 18 doomed fetches
- **Evidence:** [D F7] Worker 403 without CORS headers (`index.js:200–202`) → client `network_error` → retries → "temporarily unavailable, try again" for a permanent config failure; 3 reviewers × retries multiply it.
- **Expected vs actual:** "tell your instructor" for permanent failures; actual — advice that can never work, en masse on any future origin misconfiguration.
- **Root cause:** RC-8. **Direction:** R0 item 5 / R4 §9 error honesty.

### UX-040 · P2 · persistence — Multi-tab last-write-wins races on every read-modify-write store
- **Evidence:** [C F-8] chatlog, decisions, process note, capstone, `tupana_stage` — no `storage`-event sync; two Brightspace tabs interleave/clobber.
- **Root cause:** RC-3. **Direction:** R2 (sidecar metadata enables detection); `proposed-save-persistence-model.md` §5.

### UX-041 · P2 · persistence — Chatlog capped at 120 entries; earliest exchanges silently vanish
- **Evidence:** [C F-10] `ui.js:6371, 6402–6410`; report message counts silently partial.
- **Root cause:** RC-3. **Direction:** R2 retention rules.

### UX-042 · P2 · architectural — `tupana_schema_version` written, back-filled, never read; no migration machinery
- **Evidence:** [C F-11] `genre-template.js:2042`, `storage.js:77–79`; per-key data un-versioned.
- **Expected vs actual:** any future format change meets an upgrade path; actual — latent structural exposure (and the redesign itself will need one).
- **Root cause:** RC-8. **Direction:** R2 (versioning §5 — prerequisite for every other batch's storage changes).

### UX-043 · P2 · persistence — Council history cap silently drops oldest runs with their decisions/verifications
- **Evidence:** [C F-12] `council.js:515` (`COUNCIL_LIMITS.historyMax`).
- **Root cause:** RC-3. **Direction:** R2 retention; R4 ledger makes decisions durable independent of run history.

### UX-044 · P2 · cross-genre — Every report/export/log surface prints default-essay stage names for layered genres
- **Repro:** any layered genre; open Process Note scaffold, submit-mode report, packet, instructor panel, process log.
- **Evidence:** [B L4] all read `STAGES[n]` raw instead of `stLabel()`: `ui.js:7201→7544, 7453, 7603, 7961–7963, 8193–8194, 2048` ("Comencé en la Etapa 1 (Anécdota)" inside a lab-report packet); the leakage guard harvests only work-mode, so the family sits outside the test.
- **Expected vs actual:** the artifact of record speaks the genre's language; actual — the essay's.
- **Consequence:** instructor-facing documents contradict everything the student saw. **Root cause:** RC-4 (+RC-8). **Direction:** R7 (guard extended to report/export surfaces).

### UX-045 · P2 · cross-genre — Hostos/Brightspace institutional frame hard-coded for all genres
- **Evidence:** [B L5] packet header `ui.js:7988`; "paste and submit it in Brightspace" `ui.js:7288, 7920, 768–772`; `index.html:926, 967`. Wrong for admissions/SOP/independent journeys — including the founder's son's use.
- **Root cause:** RC-4. **Direction:** R7 (per-genre institutional config).

### UX-046 · P2 · genre-specific — Unknown `?assignment=` id silently becomes the default essay
- **Evidence:** [B L6] `app.js:14–27`; a typoed link (`?assignment=stem-lab`) yields the full autobiographical journey; only cue is the "Ensayo" chip.
- **Root cause:** RC-4. **Direction:** R7 (explicit notice on unknown ids).

### UX-047 · P2 · genre-specific — Flagship selectable genre (CAP 200 SL) coaches from generic NEUTRAL prompt lines
- **Evidence:** [B L7] profile has no `coachFocus` block → `NEUTRAL_STAGE_FOCUS` for all 10 stages (`genre-template.js:1533–1539`) while every student-facing surface speaks rich service-learning copy.
- **Expected vs actual:** the AI's stage guidance matches the on-screen pedagogy; actual — generic coaching under bespoke chrome.
- **Root cause:** RC-4. **Direction:** R7 (founder decides which genres graduate to bespoke coaching copy — CAP 200 first, already founder-flagged).

### UX-048 · P2 · stage-specific — Stage-10 Continue is self-referential: "Continue to: Process Reflection" while on Process Reflection ⟲F2
- **Repro:** all 7 genres, desktop, stage 10; read the primary footer CTA.
- **Evidence:** [W] every desktop walk, `stage` step stage 10: default `'Continuar a: Mi Cierre de Proceso · Continue to: My Writing Snapshot'`; all layered genres `'…: Reflexión del proceso · …: Process Reflection'` (e.g. `evidence/screens/default/40-stage-10.jpg`). Contradicts A §1's "hidden at Stage 10" — the rendered app shows it. Also exhibits the Stage-10 triple naming ([E BIL-7 → UX-057]).
- **Expected vs actual:** the F2 contract — every CTA truthfully names its destination; actual — the last stage's primary button promises to take you where you already are (and in default, under a *different name* for the same stage).
- **Consequence:** at the journey's most confusing moment, the primary action is a lie; students click it expecting progress. **Root cause:** RC-1 (+RC-8: no test asserts the terminal state). **Direction:** R1 (terminal stage gets a Finish-space CTA, not a Continue).

### UX-049 · P2 · systemic — On-screen word load grows monotonically ~1000 → ~2600 words by stage 10; the submit-mode modal alone is up to 1,674 words
- **Repro:** any genre, desktop, both-mode; walk stages 1→10; open Preparar entrega.
- **Evidence:** [W] `visibleWords` per `stage` step: default 1018 (s1) → 1877 (s7) → 2387 (s10); admissions peaks 2593; `chatVisibleWords` 16 → 965 (chat never sheds). `submit-mode.bodyWords`: 1197 (default) to **1674** (admissions) in a single modal (`evidence/screens/default/49-submit-mode.jpg`). Corroborates [A §7.2] chat-as-notice-board (18 injected component types in one column).
- **Expected vs actual:** disclosure progressive, load roughly constant; actual — everything accumulates; the end of the journey is its most crowded screen.
- **Consequence:** ADHD-hostile by accretion; the students most in need of calm get the least. **Root cause:** RC-2 (+RC-5 doubles it). **Direction:** R1 status rail + `proposed-progressive-disclosure.md` word-budget ledger; R3 Finish space breaks up submit-mode.

### UX-050 · P2 · systemic — Onboarding is a stack of unlinked systems: tutorial → project selector → landing → lab; `tutorial_done` unread; selector unskippable; walker needed 18 clicks to get out
- **Repro:** first run, default genre (bare app URL) — the selector intercepts before anything else; tutorial graduates re-onboard.
- **Evidence:** [A F-15] `tupana_tutorial_done` written (`start-here.html:619`), read by nothing (comment only, `storage.js:38`); ~10 min of surfaces before the first sentence. [A F-20] `showProjectSelector` has no skip/close (`ui.js:5029–5104`). [W] `walk-default.json` `first-entry`: `projectSelector` shown (z-index 999) over a 1,086-word screen; `onboarding-blocked`/`onboarding` pairs — **18 clicks** recorded before `post-onboarding` in every desktop walk (`onboardingClicks: 18`); deep links skip the selector (`deepLinkStillShowsSelector: False` — correct).
- **Expected vs actual:** one onboarding, one surface at a time, skippable, remembering what the tutorial already taught; actual — layered gate-keeping the student (and an automated walker) must fight through.
- **Root cause:** RC-1 (+RC-6 for the overlay-exit ambiguity). **Direction:** R1 one-surface-at-a-time sequence with language first (`proposed-progressive-disclosure.md` §3).

### UX-051 · P2 · architectural — All overlays permanently mounted (`display:flex`, `visibility:visible`, `opacity:0`, `pointer-events:none`); shown/hidden by opacity with no dialog manager; two overlays inline-styled outside every contract
- **Repro:** inspect any walk's `overlays` snapshot at any step.
- **Evidence:** [W] every walk, every step: `labBg`/`maniBg`/`stagePreviewBg`/`modalBg`/`reportBg` all report `display:flex, visibility:visible, opacity:0, pointerEvents:none` while "closed" — semantic state is only inferable from opacity; the walker's 18-click lab exit (UX-050) and its `shown` heuristic disagreements are the measurable symptom. [E VIS-2] `projectSelector` (`ui.js:5030`) and `maniCelebration` (`ui.js:5313`) styled entirely by inline `cssText`, no `role="dialog"`, outside tokens/dark theme. [A §2] 10 registered statics + 3 unregistered + ~35 dynamic surfaces with per-surface open/close conventions.
- **Expected vs actual:** one dialog layer with a manager owning stacking, exclusivity, and semantic open state; actual — CSS-opacity conventions per family; anything keying on display (tests, AT heuristics, tab order beyond the 9 static IDs) misreads the app.
- **Consequence:** produces UX-004 stacking, UX-022 trap gaps, UX-062/063 policy divergence — and makes rendered testing unreliable. **Root cause:** RC-6 (this *is* RC-6's core evidence). **Direction:** R1/R6 (one dialog family; walker assertion "zero stacked blocking surfaces").

### UX-052 · P2 · cross-genre — Essay-shaped structural residue for every genre: hard-coded milestone grouping, essay-tuned word thresholds, single task cue at stages 7–10
- **Evidence:** [B §4] `MILESTONES[].ids` 1-3/4-5/6/7-9/10 hard-coded (`ui.js:1613–1619`); `STEP_WORD_THRESHOLDS` shared essay numbers (`data.js:279–282`) silently pace every genre; stages 7–10 have one frozen cue; stage-7 "revision" slot must hold Five-Questions protocol / CER / thesis / developmental review (deepest role divergence).
- **Expected vs actual:** structure participates in genre adaptation, not just copy; actual — copy re-skins, structure stays essay.
- **Root cause:** RC-4. **Direction:** R1 (milestones leave the UI) + R7; Concept C is the long-run answer (`future-state-concepts.md`).

### UX-053 · P2 · persistence — Import-offer "Sí, traerlo" replaces existing destination text of 1–9 chars without warning ⟲F3
- **Evidence:** [C F-9] `hasNextText` threshold 10 (`ui.js:8825, 8853–8858`) — a genuine silent-overwrite path in the card designed to prevent exactly that.
- **Root cause:** RC-3. **Direction:** R2 snapshot ring before every overwrite-class event.

### UX-054 · P2 · visual (a11y) — Touch targets below 44px on the close buttons of four modal families (worst: 20×24)
- **Evidence:** [E A11Y-4] measured at 375×667: `phaseToastClose` 20×24; modal ✕ 27–33px; `previewBackBtn` h24; edit-toolbar 30px wide; deliberate 44px work exists elsewhere — the close-button class was simply missed per family.
- **Root cause:** RC-1. **Direction:** R6 44px floor.

### UX-055 · P2 · visual (a11y) — `chatMessages` is one big polite live region that also receives interactive panels
- **Evidence:** [E A11Y-5] `index.html:373`; long replies replayed in full; nested `role=status` notes double-announce; injected buttons announced before reachable.
- **Root cause:** RC-2. **Direction:** R1 status rail (announcements leave the transcript) + R6 live-region hygiene.

### UX-056 · P2 · visual (a11y) — Tu Conocimiento claim cards are bespoke `div role="button"` widgets
- **Evidence:** [E A11Y-6] `tabindex="0"` divs + `handleManiKey` (`ui.js:5299`) — works, but a hand-rolled pattern where `<button>` was available.
- **Root cause:** RC-1. **Direction:** R6 component consolidation.

### UX-057 · P2 · content — Terminology drift: Stage 10 has three names; *revisión* covers three features; Etapa/Paso collision; "Toolkit" untranslated
- **Evidence:** [E BIL-7] ES "Mi cierre de proceso" / EN "My Writing Snapshot" / CTA "Write My Reflection" (`data.js:152, 213–218`; `ui.js:916–917, 1024`); stage-7 Revisión vs "Revisar borrador" vs "Consejo de revisión" (`index.html:212`; `ui.js:4252,4307`); "Mi Toolkit" EN-only (`index.html:101,121`). Rendered corroboration: UX-048's default stage-10 CTA carries two of the three names in one label.
- **Consequence:** student, instructor, and export packet can talk about differently-named artifacts.
- **Root cause:** RC-5. **Direction:** R5 terminology registry + test.

### UX-058 · P2 · content — Tu Conocimiento asset cards: Spanish text is an abridgment, not a translation
- **Evidence:** [E BIL-8] EN 3 sentences vs ES 1 short line (`index.html:497–555`) — in the module whose entire point is linguistic dignity.
- **Root cause:** RC-5. **Direction:** R5 (full-equivalence pass; flagged as a values issue, not polish).

### UX-059 · P2 · visual — Both-mode on phones re-inflates everything the mobile tiers trimmed (marquee/clamp symptom)
- **Evidence:** [E RES-4] `styles.css:6498` restores `ctb-en`; 1,005 body words (both) vs 889 (es) at 375px; the task-bar **marquee animation** (`styles.css:6737–6754`) exists solely to scroll bilingual overflow — the copy model fighting the layout [E §1.5].
- **Root cause:** RC-5. **Direction:** R5 quiet-twin density rules; R6 deletes the marquee.

### UX-060 · P2 · visual — `--amber-text` and `--sky` fail contrast at the small sizes they're used at
- **Evidence:** [E VIS-7] amber 2.99 on base (68 uses incl. 0.62rem phase labels); sky 2.67 everywhere it's text.
- **Root cause:** RC-1. **Direction:** R6 token fixes.

### UX-061 · P2 · visual — 213 inline style attributes/manipulations bypass the token system (several hardcode non-inverting dark-mode colors)
- **Evidence:** [E VIS-3] 90 `style="` in index.html + 123 cssText/style writes in ui.js.
- **Root cause:** RC-1. **Direction:** R6.

---

## P3 — consistency / a11y-polish

### UX-062 · P3 · stage-specific — Stage-preview modal is Escape-proof and backdrop-proof, uniquely in the app
- **Evidence:** [A F-10] `ui.js:3628–3629`; no backdrop handler; keyboard users get no hint why Escape is dead. **RC-6.** **Direction:** R1 dissolves previews into inline step headers.

### UX-063 · P3 · AI-routing — Closing the review dialog mid-Council discards three in-flight AI readings without confirm
- **Evidence:** [A F-11] `closeFullDraftReview` `ui.js:4010–4014`; partial results not kept. **RC-6.** **Direction:** R4 review center (runs survive the dialog).

### UX-064 · P3 · stage-specific — Disabled Continue at Stage 6 pre-save has no attached reason
- **Evidence:** [A F-12] `ui.js:2210`, no title/tooltip on the disabled state. **RC-1.** **Direction:** R1 (truthful disabled reasons everywhere — pattern already exists on the review button).

### UX-065 · P3 · stage-specific — "Leer mi borrador primero" leaves the student in a disabled grey textarea that reads as broken
- **Evidence:** [A F-14] `executeSave` sets `draftArea.disabled=true` (`ui.js:2569`); no read-only view affordance. **RC-1.** **Direction:** R1/R2 (read view of the frozen draft in the work rail).

### UX-066 · P3 · visual — Dead surfaces ship in production: disabled 🐞 bug button, never-shown `#setupBanner`, dev preview bar
- **Evidence:** [A F-16] `index.html:45`, `ui.js:8727–8744` (aria-disabled "coming soon" exactly where students go with problems); [A F-19] `index.html:15` (no code toggles it); [A F-21]+[E RES-6] `index.html:1037–1041` (`?dev=true` one query param away; consumes phone bottom space). **RC-1.** **Direction:** R1 disposition map (`proposed-navigation-ia.md` §8).

### UX-067 · P3 · content — Council availability is invisible policy: tutorial promises it unconditionally; Ollama mode silently never offers it
- **Evidence:** [A F-17] offer renders only in gemini mode + profiled genres (`ui.js:4298–4301`) while start-here teaches it to everyone; [D F10] kernel accepts an injected `callFn`, so the restriction is policy, not capability — and it's undocumented on screen. **RC-7.** **Direction:** R4 (visible availability states); R7 (tutorial conditional copy).

### UX-068 · P3 · systemic — Continuing to a new stage on mobile always lands on the chat tab, even at writing stages
- **Evidence:** [A F-22] `confirmStagePreview` `ui.js:2003`; the student who pressed "Continue to: First Draft" arrives looking at the coach. **RC-2.** **Direction:** R1 (destination tab follows the step's primary activity).

### UX-069 · P3 · cross-genre — Stage-10 stuck-mini shows draft-writing micro-prompts at the reflection stage in every layered genre
- **Evidence:** [B L8] NEUTRAL_MICRO_PROMPTS has no key 10 → index-6 fallback (`genre-template.js:1943`). **RC-4.** **Direction:** R7.

### UX-070 · P3 · architectural — The "layer active + missing → NEUTRAL, never default" contract is enforced by data coverage, not code
- **Evidence:** [B L9] `prompts.js:304` and `ui.js:5905` fall back to *default essay* sets when resolvers return null; benign only while NEUTRAL coverage ⊇ default coverage; no test asserts it. **RC-8.** **Direction:** R7 (coverage assertion in the leakage guard).

### UX-071 · P3 · cross-genre — System-prompt mandatory rules say "copied into the student's **essay**" for all genres
- **Evidence:** [B L10] model-facing only; genre identity line elsewhere is correct. **RC-4.** **Direction:** R7.

### UX-072 · P3 · cross-genre — El Laboratorio's critique artifact is the bilingual-upbringing paragraph for every genre
- **Evidence:** [B L11] framing neutralized, artifact autobiographical (acknowledged in the alignment report). **RC-4.** **Direction:** R7 (or R5 while rebuilding the lab for language parity — one rebuild, both fixes).

### UX-073 · P3 · architectural — Dormant per-stage `allowedSupport`/`blockedSupport` arrays are a consumption trap
- **Evidence:** [B L12] registry holds only the default template (`genre-template.js:190–201`); arrays never injected into prompts; future consumers would get non-genre-aware data. **RC-8.** **Direction:** R7 (delete or wire — decide once).

### UX-074 · P3 · persistence — Earlier work of 1–29 chars leaves a blank editor unexplained ⟲F3
- **Evidence:** [C F-13] thresholds at `ui.js:2088` and `ui.js:8777`. **RC-3.** **Direction:** R2 (work rail shows every artifact regardless of size).

### UX-075 · P3 · persistence — No "unsaved changes" indicator state; undo history dies on stage switch/reload
- **Evidence:** [C F-14] up to 30 s exposure (`ui.js:2340, 2390–2397`); in-memory undo (`ui.js:2408–2439`). **RC-3.** **Direction:** R2.

### UX-076 · P3 · persistence — Voice Vault phrase removal is one unconfirmed click, no undo
- **Evidence:** [C F-15] `ui.js:555`. **RC-3.** **Direction:** R2 snapshot ring.

### UX-077 · P3 · persistence — Backup export buried two levels deep while the advice says "export regularly"; no good-moment nudges
- **Evidence:** [C F-16] collapsed `<details>` inside a modal (`index.html:929–941`); no post-Stage-6/post-Council nudge; only surfaced proactively on autosave *failure*. **RC-7.** **Direction:** R3.

### UX-078 · P3 · content — `prompt_too_large` copy is passage-phrased even for full-draft/Council sends; no client pre-check
- **Evidence:** [D F8] `ai-provider.js:94–96`; worker `:231–239`; a whole-draft dialog telling the student to "choose the section". **RC-8.** **Direction:** R4.

### UX-079 · P3 · systemic — AI-attribution chip is render-time only; restored transcripts show AI text unlabeled ⟲F4
- **Evidence:** [D F9][A §6 F4-residual] `ui.js:3074–3090` (documented accepted limitation); the exported transcript's Coach/Me labels are the durable record — the on-screen one decays. **RC-6.** **Direction:** R4 (attribution rendered from the ledger).

### UX-080 · P3 · AI-routing — Voice Vault protection never reaches any AI prompt; the voice reviewer can attack a protected phrase
- **Evidence:** [D F11] no prompt-side reads (`ui.js:374–612`; council.js prompts); the app's own protection signal and its AI feedback can contradict each other. **RC-1.** **Direction:** R4 §8 (do-not-rewrite context on full-draft sends, without leaking a word into chat sends).

### UX-081 · P3 · AI-routing — Pasted multi-sentence chat text silently upgrades model/kind
- **Evidence:** [D F12] `_looksLikeMultiSentencePassage` `ui.js:3535–3540, 3700`; benign quality-wise, undisclosed cost/routing change. **RC-7.** **Direction:** R4 disclosure completion.

### UX-082 · P3 · AI-routing — Passage coaching is live during Stage 6's "unassisted" pre-save window
- **Evidence:** [D F13] menu not stage-gated (`ui.js:3726–3860`); gate governs advancement, not sends (`ai-provider.js:253–261`); softens the authorship gate's meaning, undocumented. **RC-7.** **Direction:** R4 §2.1 (close or explicitly doctrine-ize the hole — founder call).

### UX-083 · P3 · content — Council abort copy never distinguishes rate-limiting from other failures
- **Evidence:** [D F14] `ui.js:4457–4478`; a quota-exhausted class is told "try again in a moment" en masse. **RC-8.** **Direction:** R4 §9.

### UX-084 · P3 · visual — Residual literal font sizes below the documented scale floor (0.55–0.65rem chips)
- **Evidence:** [E VIS-4]. **RC-1.** **Direction:** R6.

### UX-085 · P3 · visual (a11y) — `title`-attribute-only affordances invisible to touch and SR; `aria-disabled` button whose onclick still fires
- **Evidence:** [E A11Y-7] journey "Puerta de autoría" circle, toolbar shortcuts; `bug-report-btn`. **RC-1.** **Direction:** R6.

---

## Verified-holding remediations (not registered; context only)

Re-verified present and working by the inventories: F1 hub work/submit split with truthful save copy [A §6, C §3.3]; F2 destination-named CTAs through the genre layer [A §5.1]; F3 transition-import card + prior-work strip on all forward paths [A §3.4, C §2.3]; F4 system-noise tech panel + strip-form intros [A §6]; F5 review button across 7–9 with reasoned disabled states [A §6, D §5]. Their residual gaps are registered above as UX-003, UX-006 (F1); UX-048 (F2); UX-053, UX-074 (F3); UX-079 (F4); UX-035 (F5).
