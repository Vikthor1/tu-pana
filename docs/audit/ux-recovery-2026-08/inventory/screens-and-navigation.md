# Tu Pana Writing Studio — Screen/State/Component Inventory & Navigation Map

**UX Recovery Audit 2026-08 — Agent A deliverable**
Audit worktree: `/Users/Victor1/Sites/tupana-audit` (app code treated as read-only).
Sources examined: `index.html` (1,043 lines), `start-here.html` (659 lines), `assets/js/ui.js` (8,920 lines), `assets/js/app.js`, `assets/js/data.js`, `assets/js/prompts.js`, `assets/css/styles.css`, plus targeted reads of `council.js`, `storage.js`, `genre-template.js`.

Scope note: the five previously remediated findings (save conflation F1, nav CTA truthfulness F2, stranded work F3, coach leakage F4, review re-entry F5 — commits `09c7a91`/`84182d3`) are described in their **current** shape; residual gaps are flagged as new findings, not rediscoveries.

---

## 0. Product shape at a glance

- **2 HTML pages**: `index.html` (the studio) and `start-here.html` (standalone conversational tutorial; 6 genre variants of one script).
- **10-stage engine** (`STAGES`, data.js:47–158) presented through **three simultaneous student-facing vocabularies**:
  - 3 **phases** — Comenzar/Start (1–6) · Revisar/Revise (7–9) · Finalizar/Finish (10) — calm progress bar (index.html:51–84);
  - 5 **milestones** ("Paso N de 5" in header; "Hito N" in Help) — `MILESTONES` ui.js:1613–1619;
  - 10 **stages/etapas** ("Etapa N") — journey map, stage preview number, gate messages, mobile selector;
  - plus 3 **in-stage steps** ("1/3" dots) in the current-task bar (`STAGE_STEPS`, data.js:224–275).
- **10 static overlays** registered for inert/aria management (`STATIC_OVERLAY_IDS`, ui.js:94–105), plus 3 unregistered static elements (setup banner, tooltip, dev preview bar) and **~35 dynamically injected surfaces** (modals, cards, strips, toasts, menus) created in `ui.js`/`prompts.js`.
- **Persistence**: everything in `localStorage` (per-stage slots `tupana_writing_s1..s10`, `tupana_draft`, chatlog, decisions, capstone, council runs, ~30 keys). No accounts, no server storage. Draft work survives every in-app navigation; the only destructive paths are the header Reset button, "Borrar mis datos" in the report hub danger zone, and browser storage clearing.

---

## 1. Persistent screen regions (index.html)

| # | Region | id / selector | Purpose | Visibility rules | States |
|---|--------|---------------|---------|------------------|--------|
| 1 | App header | `.app-header` (index.html:20–46) | Brand, pathway chip, language switcher (ES/EN/ES·EN buttons ≥481px; `#langSelectMobile` select ≤480px), theme toggle, **Reset app**, **? Help**, **🐞 bug report** | Always | Bug button has `is-unavailable`/enabled states via `_initBugReportBtn()` (ui.js:8727–8744); pathway chip populated by `renderPathwayChip()` (ui.js:1697) |
| 2 | Calm three-phase progress bar | `#calmProgress` (index.html:51–84) | "Where am I" at phase granularity; display-only (no click nav on phases) | Always | active/done phase classes via `updateCalmProgress()` (ui.js:1125); `Ver ruta · View path` toggle reveals region 3 |
| 3 | Detailed journey map | `#detailedJourney` / `#journeyTrack` (index.html:87–95), built by `buildMap()` (ui.js:1724) | 10 stage nodes grouped under 5 milestone labels; click-to-navigate | Collapsed behind `toggleDetailedPath()` (`body.path-details-open`); inside it, far-future stages dimmed behind `Ver todo · Show all` (`toggleJourneyView()`, ui.js:1862) | Node states: done (✓), active, locked (7+ pre-save), dimmed (>= current+3), Stage-6 pencil "Puerta de autoría" icon. Hover tooltip `#tooltip` (`showTip`, ui.js:2288) |
| 4 | Mobile stage navigator | `#mobileStageNav` / `#mobileStageSelect` (index.html:98–102), built by `buildMobileNav()` (ui.js:1819) | ≤480px `<select>` of all 10 stages in 5 optgroups + Toolkit button | ≤480px only | Selection routes through `onStageClick`; **select value silently resets to current stage when gated** (ui.js:1853–1860) |
| 5 | Current task bar | `#currentTaskBar` (index.html:105–124), `updateCurrentTaskBar()` (ui.js:1063) | "Enfoque · <stage>" + one in-stage step instruction + 1/3 step dots + Toolkit button | Always (desktop) | Step dots done/active; mobile marquee scroll for overflow (`refreshMarqueeHint`, ui.js:1158) |
| 6 | Draft panel (left) | `#draftPanel` (index.html:130–229) | The student's writing surface | Always (Draft tab on mobile) | Sub-components: draft warning strip (dismissible, sessionStorage), edit toolbar (undo/redo/cut/copy/paste + conditional Protect btn), `#draftArea` textarea (disabled at Stage 6 post-save), word count (switches to "N/10 palabras para guardar" only at Stage 6 pre-save), autosave status (`✓ Guardado` / `⚠ No se pudo guardar…`, ui.js:2344), CSS-only "Empieza a escribir aquí" cue, footer buttons (Enfoque, Revisar borrador, Mi trabajo, Guardar, Volver, Continuar) |
| 7 | Chat/coach panel (right) | `#chatPanel` (index.html:232–441) | Coach conversation + progress drawer + Five Questions strip + input | Always (Tu Pana tab on mobile); de-emphasized by draft-focus; hidden by aggressive focus-mode | Sub-components: chat header (status, tone toggle Suave/Directo, coach-mode toggle Guía sin IA / Coach IA / hidden Ollama), collapsed "Mi progreso" drawer (saved notice, badges, streak, decision log), `#fiveQStrip` (hidden until Stage 7), messages stream, typing indicator, input row + "Estoy atascado" + stuck triage popup, passage context chip |
| 8 | Mobile panel tabs | `#mobileTabs` (index.html:446–453), `switchMobileTab()` (ui.js:235) | Borrador/Draft ↔ Tu Pana bottom tabs | ≤480px | `has-notification` dot on chat tab set only by `notifyMobileChat()` for **bot** messages (ui.js:280, 2723) — not for system notes |

---

## 2. Static overlays & fixed elements (index.html)

All rows below use `setOverlayOpen()` (ui.js:108–129) for open/close + inert/aria-hidden + focus-restore unless noted.

| # | Overlay | id | Purpose | Triggered by | Dismissed by | States / notes |
|---|---------|----|---------|--------------|--------------|----------------|
| 9 | Setup banner | `#setupBanner` (index.html:15–17) | "AI coach not connected" warning | **Never — no code toggles it** (only cached in `D`, ui.js:34) | n/a | **Dead element** (finding F-19) |
| 10 | Phase celebration toast | `#phaseToast` (index.html:458–468) | Milestone celebration at stages 4, 6, 9 (`PHASE_CELEBRATIONS`, ui.js:6690) | `goToStage()` → `showPhaseCelebration()` | ✕ or "Continuar · Continue" CTA (both call `dismissPhaseToast()`); **no auto-dismiss** | Deferred coach spotlight fires on dismissal (ui.js:6722–6730) |
| 11 | Tooltip | `#tooltip` (index.html:471) | Stage node hover description | mouseenter on stage node | mouseleave | Hover-only; no touch equivalent (F-20) |
| 12 | Tu Conocimiento (identity affirmation) | `#maniBg` (index.html:476–595) | Claim 5 cultural assets + write one rooted-knowledge sentence | Optional: Toolkit → "Explorar Tu Conocimiento" (`openMani({standalone:true})`); dev bar; **not in the default first-run chain** | Proceed button (gated: all 5 claimed + non-empty sentence, `maniProceed()` ui.js:5366); Escape closes without proceeding (ui.js:3634) | Asset cards: unclaimed→claimed (✓, toast `#maniClaimToast`); sentence autosaves (`tupana_mani_sentence`) with "Saved · Guardado" flash; proceed label changes standalone vs chained |
| 13 | Mani celebration | `#maniCelebration` (dynamic, ui.js:5307) | Full-screen affirmation after completing Tu Conocimiento | `maniProceed()` | Its single CTA (standalone: "Volver a escribir"; chained: "Continue to the Lab") | One-shot guard against ghost taps |
| 14 | El Laboratorio (Five Questions lab) | `#labBg` (index.html:600–785) | 4-step AI-judgment practice wizard (welcome → read AI paragraph → 5 quiz questions → summary) | Landing card "Ver guía de 3 minutos" (`openLab()`); mani chain; dev bar | Two skip links ("Ya hice esto…", "Skip — I know the Five Questions"), Escape, or completing step 3 ("Unlock my coach") — all route through `closeLab()` → `finishFirstRun('tour')` | Step 2 Continue disabled until all 5 questions answered; audio Escuchar buttons (Spanish-only); completion sets `tupana_lab_done` |
| 15 | Draft-save confirmation | `#confirmBg` (index.html:788–806) | "¿Guardar tu borrador? / Save your first draft?" checkpoint framing | Stage-6 `#saveBtn` click (ui.js:2543) | Cancelar / backdrop click / Escape; "Sí, proteger mi borrador" → `executeSave()` | Single state |
| 16 | Draft-saved ceremony | `#modalBg` (index.html:809–845) | "Borrador protegido" celebration + next-step choice | `executeSave()` (ui.js:2561) | Two CTAs via `saveCeremonyNext()`: **"Comenzar la revisión →"** (→ `goToStage(7)` + privacy note) or **"Leer mi borrador primero"** (stays at Stage 6, adds system note); Escape also closes (no next step chosen) | "Read my draft first" leaves the student facing a **disabled** grey textarea (F-14) |
| 17 | Stage preview modal | `#stagePreviewBg` (index.html:848–885) | Interstitial before advancing: what you finished + what comes next + example | `#continueBtn` → `showStagePreview(stage+1)` (ui.js:1920); **not** shown for map/select navigation (those call `goToStage` directly via `onStageClick`) | "Continuar a: <next stage>" (`confirmStagePreview()`) or "Volver a esta etapa" (`dismissStagePreview()`). **Escape deliberately does nothing** (ui.js:3629); backdrop click does nothing | States: completed-milestone line shown only when moving forward; collapsible "Ver ejemplo" (default genre example suppressed under any genre layer); CTA label always names destination (F2 remediation, `getStageNavCta` ui.js:1659) |
| 18 | Mi trabajo / report hub | `#reportBg` (index.html:902–970) | Two-mode hub (F1 remediation): `openReport()` = save status + backup; `openReport('submit')` = submission flow | Footer "Mi trabajo" button; "Preparar entrega →" (work-mode, Stage 9+ only); Journey Complete card | "Cerrar" button, backdrop? no (close button + Escape via global handler ui.js:3632) | **work mode**: save-status section w/ per-stage word inventory (`buildWorkStatusHTML` ui.js:7123), Process Note entry (draft saved only), submission entry (Stage 9+ only); packet + report-only groups hidden. **submit mode**: readiness diagnostic banner (ok/warn, `buildPacketDiagnosticHTML` ui.js:7898), AI activity summary, full report, packet copy/download. Both modes: "Otras opciones" (backup .json / import) and collapsed **"Zona de peligro"** with "Borrar mis datos" |
| 19 | Process Note modal | `#pnModalBg` (index.html:975–997) | Deep Q&A process documentation; autosaves per field | "Abrir mi nota de proceso" (report hub); auto-opens 450 ms after closing the capstone modal once instructor report generated (`closeCapstoneModal`, ui.js:863–877) | "Cerrar", ✕, Escape; **"Completar · Complete"** → `finishProcessNote()` → revision-gate check → completion celebration | Per-field saved indicators |
| 20 | Completion celebration | `#completionBg` (index.html:1002–1017) | End-of-journey celebration | `finishProcessNote()` (once revision evidence exists) | ✕ / "Continuar" → `dismissCompletionCelebration()` → injects Journey Complete card | Gate: `tupana_completion_shown` |
| 21 | Capstone modal | `#capstoneBg` (index.html:1022–1034) | Container for Stage-10 panels: 10A self-assessment, 10B coach perspective, 10C response, instructor report panel | Auto at Stage 10 entry (`injectCapstonePanel`, ui.js:879); persistent chat card "Mi cierre de proceso →" reopens it | ✕ / Escape → `closeCapstoneModal()` (which may chain-open Process Note) | 10A: 3 required evidence textareas (≥8 chars each) gate the optional self-check ratings; "Nombré mi proceso" → done state + "Comparar con el coach" (10B, sends draft ≤18k chars + self-assessment to AI, disclosure shown) + "Generar Reporte para Brightspace" trigger. 10B: coach perspective table + limitation note (offline variant exists, `renderCoachPerspectiveOffline` ui.js:1381). 10C: agree/disagree/missing/AI-advice textareas + "Guardar mi cierre de proceso" + Copy |
| 22 | Dev preview bar | `#devPreviewBar` (index.html:1037–1041) | Buttons to open Mani/Lab | Visible only with `?dev=true` (app.js:174) | n/a | Ships in production DOM (F-21) |

---

## 3. Dynamically created surfaces (ui.js / prompts.js)

### 3.1 Onboarding & orientation

| # | Surface | Created by | Trigger | Dismissal | States / notes |
|---|---------|-----------|---------|-----------|----------------|
| 23 | Project selector | `showProjectSelector(review)` (ui.js:5029) | First run with no chosen project (app.js:149–157); or `?review=colleague` without `?assignment` (review variant) | Picking a card (student: `chooseProject()` → landing; review: **navigates** to `?review=colleague&assignment=…`) — **no close/skip control** | Student vs colleague variants; colleague variant carries "do not share with students" warning |
| 24 | Landing moment / welcome card | `showLandingMoment()` (ui.js:5123) | After project choice, or first run with project already set | "Empezar a escribir" (quick path) or "Ver guía de 3 minutos" (→ Lab). No ✕; no Escape handler | Contains its own language switcher; trust line "Tu Pana never changes your text" |
| 25 | Welcome-back message | `showWelcomeBack()` (ui.js:5224) | Returning sessions (1.8 s after boot) | n/a (chat strip) | Stage name + saved-word count + optional humor line |
| 26 | Startup strip | `_injectStartupMsg()` (ui.js:3006) | Boot when onboarded + empty chatlog | n/a | "Tu Pana is starting. You can begin writing…" |
| 27 | First-AI-send cue | `maybeShowFirstAiSendCue()` (ui.js:3093) | First live-AI message ever (`tupana_ai_cue_seen`) | n/a | Privacy disclosure strip |
| 28 | Live-mode chip | `_appendLiveModeChip()` (ui.js:3079) | Rendered on live coach replies | n/a | "Coach IA · Live AI" attribution; **deliberately not persisted** — restored messages carry no chip |
| 29 | Coach spotlight | `scheduleCoachSpotlight()` (ui.js:6935) | After `confirmStagePreview()` on a new stage (once per stage per load; opt-out `tupana_spotlight_off`) | "Entendido" button, outside click, Escape, or 5 s timeout | Sequence: coach spotlight → (queued transition-import card) → editor spotlight ("Ahora escribe aquí"); "No mostrar otra vez" opt-out button |
| 30 | Post-onboarding chat flash | `flashChatFocus()` (ui.js:5552) | After lab close | 3.2 s timeout or any click | Highlight only |
| 31 | Review-mode badge | `renderReviewBadge()` (ui.js:4997) | `?review=colleague|true` | n/a (fixed, pointer-events none) | Informational |

### 3.2 Stage work cards (chat-injected)

| # | Surface | Created by | Trigger | Notes |
|---|---------|-----------|---------|-------|
| 32 | Stage-entry welcome strip | `injectStageEntryWelcome()` (ui.js:2017) | Every stage entry, once per stage (dedup via chatlog `stage-intro`) | Compact strip, not a bot bubble (coach-leakage remediation); genre-layer aware |
| 33 | Research card (Stage 4) | `injectResearchCard()` (prompts.js:451) | Stage 4 entry | 4 tap-to-ask starters; guardrail "cannot invent sources" |
| 34 | Revision panel (Stage 7) | `injectRevisionPanel()` (prompts.js:343) | Stage 7 entry | Small-change buttons open; big-change collapsed "(optional)"; picking one sends a chat message + arms Stage-7 reflection checkpoint |
| 35 | Voice-polish card (Stage 8) | `injectVoicePolishCard()` (prompts.js:525) | Stage 8 entry | 4 routes pre-fill chat input template; "Proteger esta frase" route protects current selection or shows how-to note |
| 36 | Voice Vault panel | `injectVoiceVaultPanel()` (ui.js:414) | Stages 7–9 (below the textarea) | `<details>` open by default; count badge; per-phrase green/grey presence dot; find/remove actions; `vaultSay()` status never fails silently (ui.js:454–516); max 20 phrases, 3–200 chars |
| 37 | Micro-reflections | `injectMicroReflection()` (ui.js:7359) | After save (main_idea), Stage 9 (changed), Stage 10 (needs_work) | One-question inline cards, autosave into `tupana_process_note` |
| 38 | Capstone chat trigger | ui.js:1018–1027 | Stage 10 | Persistent "Mi cierre de proceso →" reopen card |
| 39 | Journey Complete card | `injectJourneyCompleteCard()` (ui.js:7272) | Completion flag + revision evidence; survives reload | 3-step submission instructions + "Abrir Mi trabajo" → `openReport('submit')` |

### 3.3 Feedback & evaluation surfaces

| # | Surface | Created by | Trigger | Dismissal | Notes |
|---|---------|-----------|---------|-----------|-------|
| 40 | Passage coach menu | `initSelectionToCoach()` (ui.js:3726) | Selecting text in the draft textarea | Deselect/blur (240 ms delay) | Toolbar: Qué funciona / Fortalecer / Claridad / Voz (each = one-tap AI request), Proteger (stages 7–9 only), Preguntar… (attaches passage as removable chip `#passageContextChip`) |
| 41 | Full-draft review modal | `openFullDraftReview()` (ui.js:4057) | Footer "Revisar borrador" (visible stages 7–9, F5 remediation ui.js:3956) or `#reviewNextActions` buttons | ✕, backdrop click, Escape (`closeFullDraftReview`; aborts an in-flight Council run with logged event) | States: lens chooser (5 lenses, `FULL_DRAFT_LENSES` ui.js:3871; "Sugerido ahora" = audit at Stage 9) → purpose textarea required from 2nd review → same-draft override checkbox → privacy disclosure with exact word count. Word gating <50; guidance banners at >2000/>3000 words |
| 42 | Council offer (inside #41) | `_councilOfferHtml()` (ui.js:4298) | Only when `coachMode==='gemini'` AND genre has a council profile | — | Disclosure: draft sent 3×+1; same-draft re-run needs override; "Ver último informe" |
| 43 | Council progress state | `_renderCouncilProgress()` (ui.js:4345) | "Convocar al consejo" | Cancelar (logs abort) or ✕ | Per-role chips reading…/complete/unavailable; synthesis row |
| 44 | Council report state | `_renderCouncilReport()` (ui.js:4520) | Run completes, or "Ver último informe" | ✕ or "Volver a escribir" (focus → draft) | Sections: stale-note (old draft), partial-note (failed roles), summary, preserve, fix-first priorities, collapsed secondary, disagreements ("Tu decisión"); per-finding Accept/Adapt/Reject decision buttons persisted via `recordCouncilDecision` |
| 45 | Review next-actions card | `_appendReviewNextActions()` (ui.js:4240) | After a successful full-draft review | Replaced on next review | "Otra revisión / cambiar lente", "Consejo de revisión", "Ver último informe del consejo" (conditional), "Volver a mi borrador". **DOM-only — not in chatlog; vanishes on reload** (F-13) |
| 46 | Five-Questions strip | `#fiveQStrip` (static shell index.html:305, revealed ui.js:2106) | Stage 7+ | Collapsible `<details>` | Auto-opens once at first Stage-7 entry; contains "Evaluar la última respuesta del coach" button (`evalLastCoachMessage`, ui.js:5953) |
| 47 | Per-message eval bar | `renderMsgEvalBar()` (ui.js:5988) | Via #46 button (latest bot msg) or restore of already-evaluated msgs | Unevaluated bars pruned when re-triggered | 5 question chips (C/A/V/S/T) → opens #48; one-time hint strip |
| 48 | Message eval drawer (modal) | `openMsgEvalDrawer()` (ui.js:6028) | Chip click | Cerrar, backdrop | Sí/Parcialmente/No choices; feedback copy per pick; writes msg evals + `tupana_decisions` |
| 49 | Legacy eval card | `injectEvalCard()` (ui.js:5854) | Stage ≥7 (call sites in coach-response path) | Collapsible header | 5 rows × good/warn/flag buttons (`evalPick`) — a **third** evaluation surface |
| 50 | Reflection checkpoint modal | `openReflectionCheckpoint()` (ui.js:5759) | Auto-once at stages 4 and 7 entry (ui.js:5839–5852); "Revisión rápida · Quick check" button after milestone actions at 7/8 | "Saltar por ahora", backdrop, Escape; auto-closes 700 ms after a pick | 5 options, stored as checkpoint decisions |
| 51 | Voice challenge | `injectVoiceChallenge()` (ui.js:6258) | Probabilistic in revision stages | — | Voice-comparison prompt card |
| 52 | Follow-up panel | `injectFollowupPanel()` (ui.js:5899) | After coach responses | Collapsed `<details>` "Seguir conversando" | Genre-aware suggested questions; tap = send |
| 53 | Stuck triage popup | `#stuckTriage` (static, index.html:396–426; shown `showStuckTriage()` ui.js:6556) | "Estoy atascado" button | Cerrar, Escape, outside pointerdown | 5 intent-grouped options: starter (→ #54), feedback (→ sends chat msg), overwhelmed (→ hide-coach focus mode), break (→ focus mode), instructor (→ copies progress summary to clipboard) |
| 54 | Stuck mini card | `showStuckMini()` (prompts.js:110) | Triage "No sé qué escribir" | ✕, or "Usar este inicio" (inserts starter into draft) | Rotating genre-aware micro-prompts; language-resolved starters |
| 55 | System notes (live) | `addSys()` (ui.js:2812) | Gate refusals, tips, confirmations | Auto-archives previous note into collapsed "Mensajes anteriores" | Deduped with ×N counters; **does not set the mobile chat-tab notification dot** |
| 56 | Technical panel | `getSysTechPanel()`/`addToTechPanel()` (ui.js:2869) | `msgType==='system'` messages | Collapsed `<details>` at chat bottom | Coach-leakage remediation: connection/app-state noise kept out of the coach stream |
| 57 | Skill toast | `showSkillToast()` (ui.js:4671) | First entry to each stage (Stage 6 on save) | ✕ or 3.8 s auto-dismiss | "Nueva habilidad · New skill" |
| 58 | Wave unlock animation | `executeSave()` (ui.js:2598) | First-draft save | 1.3 s auto-remove | Decorative |
| 59 | Offline fallback button | `_renderOfflineFallbackBtn()` (ui.js:3026) | Live-AI error bubble | Click (switches to Guía sin IA + flushes autosave) | Live errors only; restored errors lack the button |

### 3.4 Work-continuity surfaces (F3 remediation, current shape)

| # | Surface | Created by | Trigger | Notes |
|---|---------|-----------|---------|-------|
| 60 | Transition import card | `_offerTransitionImport()` (ui.js:8821) | **Every** forward stage transition with ≥30 chars in the previous stage (armed inside `goToStage`, ui.js:2086–2093 — map, preview, and back-then-forward paths all covered) | Empty destination: "Sí, traerlo / No, empezar de nuevo". Non-empty destination: "Añadirlo arriba / abajo / Mantener solo mi texto". Escape dismisses. Chains into editor spotlight when queued |
| 61 | Prior-work strip | `updatePriorWorkStrip()` (ui.js:8782) | Whenever the editor is empty and earlier-stage writing (≥30 chars) exists | "Traerla aquí" / "Ir a esa etapa" / ✕ (dismiss per stage-visit). An empty editor is never unexplained |

### 3.5 Stage-10 output surfaces

| # | Surface | Created by | Trigger | Notes |
|---|---------|-----------|---------|-------|
| 62 | Instructor report panel | `injectInstructorReportPanel()` (ui.js:8166) | "Generar Reporte para Brightspaces" trigger in 10A done-state; restored on reload | Lives **inside** the capstone modal. Gated by revision evidence (`hasCompletionRevisionEvidence`) — otherwise closes capstone and opens the revision gate. Name/title/course fields, system-recorded evidence rows, live preview, Copy / .txt / .md downloads |
| 63 | Revision completion gate | `openRevisionCompletionGate()` (ui.js:7794) | `goToStage(10)` without a changed draft; `finishProcessNote()`; instructor report generation | "Volver a revisar" (→ Stage 9, focus draft) or student-attested instructor-exception path (note ≥12 chars + confirm checkbox; recorded as unverified declaration). ✕/backdrop/Escape close without passing |
| 64 | 10B coach perspective / 10C response panels | `renderCoachPerspectiveData` (ui.js:1316) / `showCapstoneCard10C` (ui.js:1439) | "Comparar con el coach" / "Responder al coach" | 10B has offline and parse-fallback variants (ui.js:1381, 1408); 10C = final-word textareas + save + copy |

### 3.6 Toolkit & help

| # | Surface | Created by | Trigger | Dismissal | Notes |
|---|---------|-----------|---------|-----------|-------|
| 65 | Mi Toolkit modal | `openToolkitPanel()` (ui.js:8409) | Toolkit buttons (task bar, mobile nav) | ✕, backdrop, Escape (focus-restoring) | Claimed assets, mani sentence, per-stage skills, AI-literacy transfer cards, "Explorar/Volver a Tu Conocimiento" |
| 66 | Help panel | `openHelpPanel()` (ui.js:8547) | header "?" | ✕, backdrop, Escape | Current-position line (Hito + Paso), 13 collapsible sections incl. privacy (open by default), milestone-grouped 10-stage list, troubleshooting |
| 67 | Bug report | `openBugReport()` (ui.js:8711) | header 🐞 | n/a — opens external form URL in new tab | **Currently disabled**: `CONFIG.bugReportUrl` empty → button rendered `aria-disabled` "coming soon" |

---

## 4. start-here.html (standalone tutorial)

One-column conversational script (coach bubbles + choice buttons), 6 genre variants resolved from `?assignment=` → remembered `tupana_assignment_id` → default (start-here.html:465–473). Chapters: The deal → Myth check (3 quizzes) → The route (10-stage map w/ Stage-6 "lock 🔒" chip) → You're the boss (accept/adapt/reject rehearsal) → The Council → Ground rules → Finale.

- **Entry**: direct link (e.g., `start-here.html?assignment=college-personal-statement`).
- **Exit**: sticky "I've done this before — skip to the app" link and finale "Empecemos — Start writing →" — both → `index.html` + genre query. "Replay this intro" restarts.
- **State**: writes `localStorage.tupana_tutorial_done` at finale (start-here.html:619) — **no code in the app ever reads this key** (only a comment in storage.js:38). The app runs its own first-run chain (project selector → landing → optional lab) regardless, so a tutorial graduate immediately hits a second onboarding layer.
- Progress bar with chapter label + step count; choices are forced (no free text); every quiz choice leads to the same corrective copy (by design).

---

## 5. Navigation map — every control, with truth assessment

Persistence column: does student work survive the transition? (All in-app transitions persist via `saveStageWork` on stage switch + 30 s autosave + blur/pagehide flush, ui.js:2033–2043, 2374–2403.)

### 5.1 Core forward/back spine

| Control | Rendered label (ES · EN) | Handler → destination | Work persists? | Discoverable? | Label truthful? |
|---|---|---|---|---|---|
| Continue button `#continueBtn` | `Continuar a: <next-stage name>` (genre-layer resolved; bare `Continuar · Continue` fallback; `✓` prefix when stage-ready heuristic fires) | `showStagePreview(stage+1)` → preview modal → `confirmStagePreview()` → `goToStage()` | Yes (outgoing stage saved before switch) | Visible by default (hidden at Stage 10; **disabled** at Stage 6 pre-save) | **Yes** (F2 remediation). Nuance: it opens a preview first, not the stage directly — the interstitial's own CTA repeats the same truthful label, so the promise is kept. Disabled state at Stage 6 offers no inline reason (F-12) |
| Stage-preview CTA `#previewContinueBtn` | `Continuar a: <stage>` | `confirmStagePreview()` → `goToStage(id)`; mobile also switches to chat tab | Yes | In modal | Yes |
| Stage-preview back `#previewBackBtn` | `Volver a esta etapa · Go back to this stage` | `dismissStagePreview()` (stays put) | Yes | In modal | Yes |
| Back button `#backBtn` | `← Volver a: <prev-stage name>` | `goToStage(stage-1)` (never gated) | Yes | Visible from Stage 2 on, fixed location (F2) | Yes |
| Journey-map stage node | Stage name (ES/EN) under milestone header | `onStageClick(s)` → `goToStage` (gates: draft-save for 7+, no skipping >1 ahead) | Yes | **Two clicks deep**: "Ver ruta" toggle, then possibly "Ver todo" for dimmed nodes | Mostly — locked/dimmed states signal gating, but refusals surface only as chat system notes |
| Mobile stage select `#mobileStageSelect` | `Paso · Step` label; options = stage names grouped by milestone | change → `onStageClick`; **resets to current stage if gated** | Yes | Visible ≤480px | **Partially** — gated selections snap back with the explanation in the (possibly hidden) chat tab and no notification dot (F-6) |
| Calm phase items | Comenzar/Revisar/Finalizar | none (display only) | n/a | Always visible | Yes (not styled as buttons) |
| `Ver ruta · View path` `#calmPathToggle` | as labeled | `toggleDetailedPath()` reveals stage map | n/a | Visible | Yes |
| `Ver todo · Show all` `#journeyToggle` | `Ver todo/Ver menos` | `toggleJourneyView()` | n/a | Only when detailed path open | Yes (aria says "Show N more stages") |
| Save button `#saveBtn` (Stage 6 only) | `Guardar · Save` → confirmation modal → saved state `Primer borrador guardado` | confirm → `executeSave()` (locks editor, opens ceremony) | Yes — also writes `tupana_draft` | Visible at Stage 6; disabled <10 words with title explaining | Yes (F1: ceremony copy says "checkpoint, not final version") |
| Save ceremony primary | `Comenzar la revisión → · Start Revising →` | `saveCeremonyNext('revise')` → `goToStage(7)` | Yes | In modal | Yes |
| Save ceremony secondary | `Leer mi borrador primero · Read my draft first` | closes modal, system note; stays at locked Stage 6 | Yes | In modal | **Mostly** — the "reading" happens in a disabled grey textarea that reads as broken (F-14) |

### 5.2 Review & Council

| Control | Label | Handler → destination | Persists? | Discoverable? | Truthful? |
|---|---|---|---|---|---|
| `#fullDraftReviewBtn` | `Revisar borrador · Review draft` | `openFullDraftReview()` (modal) | Yes | Footer, stages 7–9 (F5); disabled states carry reason in `title` | Yes — and the modal discloses exactly how many words go to the AI before sending |
| `Trabajar un pasaje · Work with a passage` | as labeled | closes modal, focuses draft, system note explains selection flow | Yes | In review modal | Yes |
| `Revisar este borrador · Review this draft` | as labeled | `submitFullDraftReview()` → AI → chat reply + `#reviewNextActions` | Yes | Enabled only when lens (+purpose/override when required) chosen | Yes |
| `Convocar al consejo · Convene the Council` | as labeled | `launchCouncilRun()` → progress → report | Yes | Bottom of review modal; **only Live-AI + council-profile genres** | Yes when present; the tutorial promises the Council unconditionally (F-17) |
| `Cancelar` (council progress) | as labeled | aborts run, closes modal, logged | Yes | In modal | Yes |
| `Volver a escribir · Return to writing` (council report) | as labeled | closes modal, focus draft | Yes | In modal | Yes |
| `#reviewNextActions` buttons | `Otra revisión…`, `Consejo de revisión`, `Ver último informe del consejo`, `Volver a mi borrador` | reopen review modal (scrolled/auto-clicking last-report), or focus draft | Yes | Appended after review reply; **not restored after reload** (F-13) | Yes |
| Passage menu actions | `Qué funciona / Fortalecer / Claridad / Voz / Proteger / Preguntar…` | one-tap AI request; Protect → Voice Vault; Ask → context chip + chat focus | Yes | Appears on any draft selection | Yes |

### 5.3 Report / submission / Stage 10

| Control | Label | Handler → destination | Persists? | Discoverable? | Truthful? |
|---|---|---|---|---|---|
| `#reportBtn` | `Mi trabajo · My work` (aria/title spells out "save status, backup, and submission") | `openReport()` work hub | Yes | Footer, always | Yes (F1) |
| `Preparar entrega → · Prepare submission →` | as labeled | `openReport('submit')` | Yes | Inside work hub, Stage 9+ & draft saved | Yes |
| `Copiar mi paquete final` / `Descargar paquete final` | as labeled | clipboard/.txt of full packet; warns if diagnostics fail | Yes | Submit mode only (F1) | Yes — packet note says nothing is sent automatically |
| `Otras opciones` → backup/import | `Descargar copia de seguridad (.json)` / `Importar trabajo guardado` | `exportData()`/`importData()` (storage.js) | Yes | Collapsed group | Yes |
| Danger zone | `Zona de peligro — no se puede deshacer` → `Borrar mis datos` | `clearAllData()` | **Destroys all** | Collapsed, red-styled (F1) | Yes — explicitly warns, tells student to back up first |
| Capstone 10A submit | `✓ Nombré mi proceso` | done-state + reveals compare + report trigger | Yes | In capstone | Yes |
| `⇄ Comparar con el coach` | as labeled | `requestCoachPerspective()` (AI call; disclosure present) | Yes | After 10A | Yes |
| `Generar Reporte para Brightspace` | as labeled | `injectInstructorReportPanel(true)` (may bounce to revision gate) | Yes | In 10A done-state | Mostly — can instead open the revision gate, which is explained inside the gate |
| Capstone ✕ | `Cerrar` | `closeCapstoneModal()` — **may auto-open Process Note 450 ms later** | Yes | In modal | **No** — a close control that spawns a new required-feeling dialog (F-9) |
| Process Note `Completar · Complete` | as labeled | `finishProcessNote()` → possibly revision gate → completion celebration | Yes | In modal | Mostly (same chaining caveat) |
| Revision gate primary | `Volver a revisar · Return to revise` | Stage 9 + draft focus | Yes | In gate | Yes |
| Revision gate exception | `Registrar excepción y continuar` | records student attestation, continues | Yes | Collapsed disclosure | Yes — explicitly says Tu Pana does not verify it |
| Journey Complete CTA | `Abrir Mi trabajo` → | `openReport('submit')` | Yes | Persistent chat card | Yes |

### 5.4 Header & global

| Control | Label | Handler → destination | Persists? | Discoverable? | Truthful? |
|---|---|---|---|---|---|
| Reset button (header) | Icon-only ↻; title `Reiniciar desde el inicio · Reset to onboarding` | `resetApp()` → native `confirm()` → **`localStorage.clear()` + reload** | **NO — erases every key** | Always visible, adjacent to theme/help | **No** — "Reset to onboarding" undersells total permanent data destruction; single native confirm is the only guard (F-1) |
| Theme toggle | sun/moon icon | `toggleTheme()` | Yes | Visible | Yes |
| Language ES/EN/ES·EN + mobile select | as labeled | `setLang()` | Yes | Visible | Yes |
| `?` help | `Ayuda · Help` | `openHelpPanel()` | Yes | Visible | Yes |
| 🐞 `Problema · Problem?` | as labeled | no-op (aria-disabled, "coming soon") | n/a | Visible | Yes (title says coming soon) but a dead control in the header (F-16) |
| Tone toggle | `Suave · Gentle` / `Directo · Direct` | `toggleTone()` | Yes | Chat header | Yes |
| Coach-mode toggle | `Guía sin IA · Built-in, no AI` / `Coach IA · Live AI` (+hidden Ollama) | `setCoachMode()` — instant switch | Yes | Chat header | Yes; titles disclose data flow per mode |
| Footer `Enfoque · Focus` `#focusToggle` | `Enfoque` ↔ `Coach` (draft-focus system) — **but rewritten to `Salir · Exit` by the other focus system** | `toggleDraftFocus()` (gentle de-emphasis only) | Yes | Footer | **No, when hide-coach focus mode is active** — see F-2 |
| Focus hint `Mostrar coach` | as labeled | `toggleFocusMode()` (exits hide-coach mode) | Yes | Only visible inside hide-coach mode | Yes |
| `Estoy atascado · I'm stuck` | as labeled | `showStuckTriage()` | Yes | Chat input area (disabled until a coach mode initializes) | Yes |
| Mobile tabs Borrador / Tu Pana | as labeled | `switchMobileTab()` | Yes | ≤480px | Yes |
| Toolkit buttons (task bar / mobile) | `Mi Toolkit · Toolkit` | `openToolkitPanel()` | Yes | Visible | Yes |
| Skip link | `Saltar al contenido · Skip to content` | `#main` | n/a | Focus-revealed | Yes |

### 5.5 Cross-page

| Control | Label | Destination | Persists? | Truthful? |
|---|---|---|---|---|
| start-here finale `Empecemos — Start writing →` | as labeled | `index.html?assignment=<genre>` | localStorage shared per-origin — yes | Yes, though "start writing" lands on the in-app onboarding chain first (F-15) |
| start-here `I've done this before — skip to the app` | as labeled | same | Yes | Yes |
| `Replay this intro · Repasar` | as labeled | restarts script in place | Yes | Yes |

---

## 6. Findings

Severity: **P0** data loss/privacy · **P1** blocks or misleads a core journey · **P2** substantial confusion · **P3** polish. Judged against the first-time student's ten questions (Where am I? / What am I doing? / What next? / What will this button do? / Was my work saved? / Where is my earlier work? / How do I go back? / How do I return to my draft-review? / What did the AI contribute? / What decisions remain mine?).

### P1

- **F-1 — Header Reset button: total, permanent data destruction one native confirm away, behind an icon whose tooltip says "Reset to onboarding".** `resetApp()` (ui.js:6856–6860) runs `localStorage.clear()` + reload; the button (index.html:43) is icon-only, sits between the theme toggle and Help, and its title ("Reiniciar desde el inicio · Reset to onboarding") does not predict erasing all drafts, chat history, decisions, capstone, and council records. The `confirm()` text is honest, but it is the entire safety net — no export nudge, no typed confirmation, no undo. Contrast: the in-app "Borrar mis datos" was deliberately moved into a collapsed, red-styled danger zone (F1 remediation) while this equally destructive control stayed in the everyday header. *Student consequence: "Was my work saved?" becomes moot; a reflexive OK on a mis-tap ends the project.*

- **F-2 — The footer Focus button lies (and dies) when hide-coach focus mode is on.** Two focus systems write the same `#focusToggle` button: `toggleFocusMode()` (aggressive, hides the coach panel; ui.js:6865–6875) rewrites its label to `Salir · Exit`, but the button's actual handler is `toggleDraftFocus()` (index.html:204) — the *gentle* system, whose `enterDraftFocus()` no-ops while focus-mode is active (ui.js:6882–6890). Path to the trap: stuck-triage "Me siento abrumado/a" or "Necesito un descanso" turns on hide-coach mode (ui.js:6616–6658). The student now sees a button labeled "Salir · Exit" that either does nothing or merely relabels itself back to "Enfoque"; the coach panel stays hidden. The only true exits are the small `Mostrar coach` hint button or the Escape key. *Student consequence: the students most likely to have pressed "I'm overwhelmed" are stranded in a stripped screen with a dead Exit control — a direct "What will this button do? / How do I go back?" failure.*

### P2

- **F-3 — The coach appears to be typing forever on first load.** `#typingRow` ships with class `typing on` (index.html:375) and `.typing.on{display:flex}` (styles.css:2107); nothing in the boot path (`initDL` → `setCoachMode` → `_injectStartupMsg`, app.js:110/ui.js:3053) calls `showTyping(false)` — the first call sites are inside `sendMsg`/coach-perspective flows (ui.js:3132 etc.). Until the student sends something, three animated dots with the coach avatar promise a message that never comes. *Student consequence: first-time students wait for the "coach" instead of writing — undermining the entire "your words first" opening move.*

- **F-4 — Four progress vocabularies, with "Paso" meaning two different things.** Phases (Comenzar/Revisar/Finalizar), milestones ("Paso 2 de 5" in the header, ui.js:2054; "Hito N" in Help, ui.js:8556), stages ("Etapa N" in gate refusals ui.js:1926/2170, the stage-preview number badge, `tupana_stage`), and in-stage steps ("1/3" dots + the mobile selector labeled "Paso · Step" whose options are *stages*, index.html:99). The header can say "Paso 2 de 5" while the mobile bar's "Paso" selector shows 10 entries and a refusal message says "Completa la Etapa 4". *Student consequence: "Where am I?" has three simultaneous, mutually untranslated answers.*

- **F-5 — Navigation is recorded as completion.** `goToStage()` marks the previous stage done on any forward move (`state.done.add(id - 1)`, ui.js:2045) with no work-presence check, and boot marks every stage below the saved stage done (app.js:42–44). Checkmarks in the journey map, "stages completed" in the instructor report (ui.js:8195), and milestone celebrations therefore mean "was clicked past", not "was done". *Student consequence: false "done" signals; instructor-facing evidence overstates progress.*

- **F-6 — On mobile, gated navigation looks like a silent failure.** Gate refusals from `onStageClick`/`showStagePreview` are delivered via `addSys()` into the chat panel; on a phone showing the Draft tab, the select just snaps back to the current stage (ui.js:1858) and the explanation renders in the hidden Tu Pana tab. `notifyMobileChat()` sets the tab notification dot only for `bot` messages (ui.js:2723), not system notes. *Student consequence: "the dropdown is broken" instead of "save your draft first".*

- **F-7 — Evaluation paradigm proliferation.** Four overlapping ways to judge coach output — the Five-Questions strip + "Evaluar la última respuesta" (ui.js:2110–2131, 5953), the per-message eval bar + drawer modal (ui.js:5988/6028), the legacy stage-level eval card (`injectEvalCard`, ui.js:5854), and reflection-checkpoint modals (ui.js:5759) — plus capstone 10A/10C. They write to two stores (`tupana_chatlog` evals, `tupana_decisions`) whose counts feed badges, the decision log, and reports. *Student consequence: "What decisions remain mine?" is answered by five competing widgets; decision counters are hard to trust or reconcile (the pilot already flagged untrustworthy tallies).*

- **F-8 — The post-review "way back in" card does not survive a reload.** `#reviewNextActions` (ui.js:4240–4272) is appended to the chat DOM but never written to the chatlog, so after a refresh the explicit re-entry affordance to "another review / Council / last Council report" disappears; the student is back to knowing (or not) that the footer `Revisar borrador` button reopens everything, and that "Ver último informe" lives *inside* that modal. F5's remediation holds within a session but not across sessions. *Student consequence: "How do I get back to my review?" regresses to discovery after every reload.*

- **F-9 — Close buttons that open new dialogs at Stage 10.** Once the instructor report has been generated, clicking ✕ on the capstone modal auto-opens the Process Note modal 450 ms later (`closeCapstoneModal`, ui.js:863–877); "Completar" in the Process Note can bounce into the Revision Completion Gate (`finishProcessNote`, ui.js:7238–7247), and "Generar Reporte" can close the capstone and open the gate (ui.js:8166–8174). The sequencing rationale is documented in code comments, but from the student's side, dismiss/complete controls trigger unrequested modals. *Student consequence: the final stretch feels like a modal ambush; "What will this button do?" is unanswerable for the ✕.*

### P3

- **F-10 — Stage-preview modal is Escape-proof and backdrop-proof by design** (ui.js:3628–3629; no backdrop handler on `#stagePreviewBg`). The only exits are the two buttons. Defensible pedagogically, but it is the sole modal in the app that ignores both conventions, and keyboard users get no hint why Escape is dead.
- **F-11 — Council-run cancellation via ✕ discards three in-flight AI readings with no confirm** (`closeFullDraftReview`, ui.js:4010–4014). Logged, but a student closing "just to peek at the draft" loses the run (partial results are not kept).
- **F-12 — Disabled Continue at Stage 6 pre-save has no attached explanation.** `D.continueBtn.disabled = !state.draftSaved` (ui.js:2210) with no title/tooltip on the disabled state; the reason lives in the footer note and in gate messages triggered only from other paths.
- **F-13 — (rolled into F-8, listed for traceability).**
- **F-14 — "Leer mi borrador primero" returns the student to a disabled, greyed textarea** (`executeSave` sets `draftArea.disabled=true`, ui.js:2569; ceremony secondary just closes). Reading happens in what looks like a broken editor; there is no read-only view affordance.
- **F-15 — Two unlinked onboarding systems.** `start-here.html` writes `tupana_tutorial_done` (start-here.html:619) which nothing reads (only a comment in storage.js:38). Tutorial graduates land in the full in-app first-run chain (project selector → landing card → optional Lab) that re-teaches overlapping content (rules, saving, the lock). ~10 minutes of onboarding surfaces before the first sentence for a diligent student.
- **F-16 — A visible dead control in the header:** the 🐞 bug button renders in production as `aria-disabled` "coming soon" (index.html:45; ui.js:8727–8744). First-time students get a broken-looking affordance exactly when they hit problems.
- **F-17 — The tutorial promises the Council unconditionally**, but the offer renders only in Live-AI mode for genres with a council profile (`_councilOfferHtml`, ui.js:4298–4301). A Guía-sin-IA student, or one in a profile-less genre, will search for a feature that cannot appear and gets no explanation of its absence.
- **F-18 — Journey map hover tooltips have no touch equivalent** (`showTip` bound to mouseenter only, ui.js:1786); stage descriptions are unreachable on tablets/phones (mobile select shows names only).
- **F-19 — `#setupBanner` is dead code** (index.html:15; cached ui.js:34; never shown). The "AI not connected" state it was built for now surfaces only via per-message errors and the fallback button.
- **F-20 — Project selector has no skip/close** (ui.js:5029–5104): first-run students must choose a project before seeing anything; the "default essay" card is the de-facto escape but is not labeled as such.
- **F-21 — Dev preview bar ships in the production DOM** (index.html:1037–1041), gated only by `?dev=true`; `openMani`/`openLab` are one query param away for any student.
- **F-22 — `confirmStagePreview()` on mobile always lands on the chat tab** (ui.js:2003), including at writing-heavy stages; the student who pressed "Continue to: First Draft" arrives looking at the coach, not the editor (the editor spotlight only partially compensates and only once per stage).

### Remediated areas — current shape (verified, no rediscovery)

- **F1 save conflation**: routine save status (autosave badge, work hub inventory, truthful Stage-6-not-saved-yet copy) is fully separated from submission (`openReport('submit')` only) and destruction (collapsed danger zone). Holds. Residual: the header Reset button (F-1) never received the same treatment.
- **F2 nav CTA labels**: every forward/back control names its destination through the active genre layer (`getStageNavCta`/`stLabel`); `STAGE_TRANSITIONS` task-verb CTAs are correctly confined to the default genre's preview completed-text. Holds.
- **F3 stranded work**: import offer armed inside `goToStage` for all forward paths + persistent prior-work strip; an empty editor is never unexplained. Holds. Residual: strip dismissal is per-page-load (`_priorStripDismissed` Set), so it reappears every reload — acceptable, arguably correct.
- **F4 coach leakage**: system noise routed to the collapsed tech panel; welcome/stage-intro rendered as strips, not coach bubbles; live-AI replies get an attribution chip (live-only, by documented design). Holds; the non-persisted chip means restored transcripts lose AI attribution (accepted limitation worth revisiting for the "What did the AI contribute?" question).
- **F5 review re-entry**: button visible across stages 7–9 with reasoned disabled states + next-actions card. Holds in-session; F-8 covers the cross-session gap.

---

## 7. Structural observations on the navigation model

1. **Five coexisting navigation paradigms**: (a) linear footer spine (Back/Continue + preview interstitial); (b) random-access journey map (progressively disclosed behind two toggles); (c) mobile select; (d) chat-embedded action cards that navigate (save ceremony, review next-actions, Journey Complete, capstone trigger); (e) modal-chained flows at Stage 10. A student's mental model must hold all five; (a) is the most consistently truthful, discoverable, and explained, but its Stage-10 Continue self-points (UX-048).
2. **The chat stream is also the app's notice board**: gate refusals, privacy notes, confirmations, stage intros, cards, panels, and evaluation widgets all compete inside one scrolling column — the single most crowded surface in the product (18 distinct injected component types counted in §3).
3. **Modal depth at the finale**: capstone modal → instructor report panel (inside it) → close → process note modal → revision gate (conditionally) → completion celebration → journey-complete card. Six chained surfaces guard the last click.
4. **State is navigation**: because `done` is set by traversal (F-5), the map's semantics degrade the moment a student explores; the map cannot be trusted as a to-do list.
5. **The primary autosave path is durable, but the storage model is not globally safe** — stage
   slots + flush-on-hide held in rendered refresh probes, while silent import overwrite, header
   Reset, swallowed non-autosave write failures, heuristic final-draft selection, and browser
   eviction remain registered hazards (UX-002/003/012/014/015).
