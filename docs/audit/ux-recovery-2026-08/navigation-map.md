# Tu Pana Writing Studio — Condensed Navigation Map

**UX Recovery Audit 2026-08 — Deliverable 5**

Synthesized from the control inventory (`inventory/screens-and-navigation.md`, cited as **INV §n / F-n**) and the observational walks (`evidence/walk-*.json` + `evidence/screens/<slug>/`, cited as **WALK step / shot**). This map records what a control *says*, what it *does*, and whether the two match — it does not re-derive behavior from code.

Persistence baseline (INV §5): every in-app transition persists work (per-stage slots + 30 s autosave + blur/pagehide flush). Confirmed in the wild: refresh at Stage 3 kept 68/68 editor words (WALK refresh-probe, all 7 genres, `evidence/screens/default/26-refresh-return.jpg`); back-to-2/forward-to-5 alt-paths kept all words with no import dialogs (WALK alt-path steps). The **only** destructive edges are the header Reset, the danger-zone Clear, and the browser itself.

---

## 1. Nodes

**Pages:** `start-here.html` (tutorial, 6 script variants) · `index.html` (the studio).

**Spaces inside the studio (always-on regions, INV §1):** Header · Calm 3-phase bar · Detailed journey map (collapsed) · Mobile stage select (collapsed behind chevron; WALK mobile `stageSelect:false`, `evidence/screens/default-mobile/01-stage2.jpg`) · Current task bar · **Draft panel** · **Chat/coach panel** (also the app's notice board — 18 injected component types, INV §7.2) · Mobile tabs Borrador/Tu Pana.

**Overlays/dialogs (student-facing, in journey order):** Project selector → Landing card → (optional) Lab → (optional) Tu Conocimiento + celebration · Stage-preview interstitial · Reflection checkpoints ("Antes de seguir…") · Phase celebration toasts · Skill toasts · Save-confirmation → Save ceremony · Full-draft review modal (lens chooser → result / Council progress → Council report) · Mi trabajo hub (work mode ⇄ submit mode) · Capstone modal (10A/10B/10C + instructor report panel) · Process Note modal · Revision completion gate · Completion celebration · Toolkit · Help · Stuck triage (+ mini card).

---

## 2. Edges — every control that moves the student

Columns: rendered label (ES · EN) → trigger → destination · work-persistence · discoverability · truthfulness. Ratings: ✓ true · ± nuance · ✗ misleads. Walk evidence is from all 7 desktop genre walks unless noted.

### 2.1 Forward/back spine (the one paradigm that mostly works)

| Edge | Label as rendered | Trigger → destination | Persists | Discoverable | Truthful |
|---|---|---|---|---|---|
| Continue | `Continuar a: <next stage>` — genre-resolved in 70/70 stage observations; movement-truthful in 63/70 (WALK stage steps) | click → stage-preview modal → `confirmStagePreview` → next stage | Yes | Footer, always | **±** F2's genre resolver holds, but **5 of 9 presses were intercepted** by a checkpoint (S4, S7) or celebration toast (S6, S8, S9) before the preview appeared (WALK click-blocked; `evidence/screens/default/32-blocked-continue-s6.jpg` shows the toast sitting on the save-confirm modal). At S10 the label self-points: `Continuar a: Mi Cierre de Proceso · Continue to: My Writing Snapshot` — destination = current location, and ES/EN halves name it differently (WALK stage@10, all genres). INV §5.1 believed Continue hidden at S10; walks falsify that → **✗ at S10** |
| Preview CTA / back | `Continuar a: <stage>` / `Volver a esta etapa` | modal buttons | Yes | In modal | ✓ (WALK stage-preview ×4/walk, modal 35–58 words). Escape/backdrop dead by design (F-10) |
| Back | `← Volver a: <prev stage>` | direct `goToStage(-1)`, never gated | Yes | Footer from S2 (WALK backBtnVisible) | ✓ 63/63 observations |
| Journey-map node | stage name under milestone | click → stage (gated: draft-save for 7+, no skip >1) | Yes | **2 toggles deep** (`Ver ruta`, then `Ver todo`) (INV §1.3) | ± refusals surface only as chat system notes |
| Mobile select | `Paso · Step` + 10 stage names | change → same gates; **snaps back silently when gated** | Yes | Behind unlabeled chevron; not visible at rest (WALK mobile) | **✗ on gate** — explanation lands in hidden chat tab, no dot (F-6) |
| Save (S6) | `Guardar` → confirm → ceremony | `executeSave` → locks editor → ceremony fork | Yes + `tupana_draft` | Footer S6 | ✓ copy; **±** ceremony fork: "Leer mi borrador primero" strands student at a disabled grey textarea (F-14) |
| Save (other stages) | `Guardar · Save` | per-stage slot save | Yes | Footer | **✗ feedback**: drawer notice reads "Primer borrador guardado — Revisión desbloqueada" after *every* stage's save, S1–S10 (WALK save steps ×70) |
| Prior-work strip | `Traerla aquí` / `Ir a esa etapa` / × | import text / jump to stage | Yes | Auto-appears whenever editor empty + earlier work exists — observed at S2–S10 in all walks | ✓ (F3 remediation verified) |
| Transition import card | `Sí, traerlo` / `Añadirlo arriba/abajo` / … | import into destination stage | Yes | Auto on forward transitions | ✓ (INV §3.4; walks recorded null because probes moved between non-empty↔empty in covered patterns) |

### 2.2 Review & Council

| Edge | Label | Trigger → destination | Persists | Discoverable | Truthful |
|---|---|---|---|---|---|
| Review draft | `Revisar borrador · Review draft` | footer (S7–S9 only, WALK reviewBtnVisible) → lens-chooser modal | Yes | Footer S7–S9; **gone at S10** (observed) | ✓; modal discloses exact word count before sending (WALK review-chooser disclosure: "…(131 palabras) se enviará al Coach IA tres veces…") |
| Run review | `Revisar este borrador` | → AI → result **in chat column** + "¿Y AHORA?" card | Yes | In modal | ✓ |
| Next-actions card | `Otra revisión…` / `Consejo de revisión` / `Ver último informe` / `Volver a mi borrador` | reopen modal / focus draft | Yes | Appended after review; **DOM-only, dies on reload** (F-8; refresh probe corroborates injected-card loss) | ✓ while alive |
| Convene Council | `Convocar al consejo` | progress state → report modal | Yes | Bottom of review modal; Live-AI + council-profile genres only (F-17 — mock server showed it for all 7; tutorial promises it unconditionally) | ± offer honest; **completion unverified in 3/7 genre walks** (cap200-first-draft, research, stem captured no council-report step) |
| Council report | `Aceptar/Adaptar/Rechazar/Decidir después` per finding; `Volver a escribir` | record decision / close+focus draft | Yes (decisions persisted) | In modal (`evidence/screens/default/45-council-report.jpg`) | ✓ — the app's best Q9/Q10 surface |
| Cancel / ✕ mid-run | `Cancelar` / ✕ | aborts 3 in-flight readings, no confirm | Yes (run lost) | In modal | ± (F-11) |
| Passage menu | `Qué funciona / Fortalecer / Claridad / Voz / Proteger / Preguntar…` | one-tap AI asks; Protect→Vault; Ask→context chip | Yes | On any draft selection | ✓ |

### 2.3 Hub, Stage 10, export

| Edge | Label | Trigger → destination | Persists | Discoverable | Truthful |
|---|---|---|---|---|---|
| My work | `Mi trabajo · My work` | footer → hub work-mode | Yes | Footer always (mobile too: 59–61-word hub, `evidence/screens/default-mobile/04-work-hub.jpg`) | ✓ (F1 holds; hub is where "Was my work saved?" gets its only fully truthful answer) |
| Prepare submission | `Preparar entrega →` | hub → submit mode | Yes | Inside hub, appears S9+ (WALK work-hub-late prepControl) | ✓ diagnostic banner honest ("No completaste ninguna reflexión…", WALK submit-mode) |
| Packet / backup / import | `Copiar/Descargar paquete` · `.json` backup/import | clipboard/download | Yes | Submit mode / collapsed group | ✓ |
| Danger zone | `Zona de peligro` → `Borrar mis datos` | destroys all | **NO** | Collapsed but **visible in hub from Stage 2** (WALK work-hub-early dangerVisible:true ×7) | ✓ copy, ± placement |
| Capstone chain | 10A `✓ Nombré mi proceso` → 10B compare → report trigger; ✕ | see INV §3.5 | Yes | Auto-opens at S10 **under a phase toast + skill toast** (`evidence/screens/default/40-stage-10.jpg`) | **✗ for ✕**: close spawns Process Note 450 ms later; Complete can bounce to revision gate (F-9) |
| Revision gate | `Volver a revisar` / exception path | S9 + focus / attested continue | Yes | In gate | ✓ (self-declared exception labeled as unverified) |

### 2.4 Header & global

| Edge | Label | Destination | Persists | Truthful |
|---|---|---|---|---|
| Reset ↻ | title: `Reiniciar desde el inicio · Reset to onboarding` | native confirm → **`localStorage.clear()`** | **NO — total loss** | **✗** — top-severity mismatch (F-1); one reflexive OK from everyday header position |
| Language ES/EN/ES·EN | as labeled | re-render; ES·EN costs ~+18% words on every screen (WALK language: 1,134 baseline → 1,356 both) | Yes | ✓ |
| Focus toggle | `Enfoque` ↔ rewritten to `Salir · Exit` by hide-coach mode | gentle de-emphasis only; **no-ops while hide-coach active** | Yes | **✗** in hide-coach mode — dead Exit button for students who pressed "I'm overwhelmed" (F-2) |
| Help `?` / Toolkit / theme / tone / coach-mode / `Estoy atascado` | as labeled | panels/toggles/triage | Yes | ✓ (coach-mode titles disclose data flow) |
| 🐞 `Problema` | aria-disabled "coming soon" | none | n/a | ± dead control in header (F-16) |
| Mobile tabs | `Borrador` / `Tu Pana` | panel switch | Yes | ✓; **gate refusals land on hidden tab without a dot** (F-6); preview-confirm lands on chat tab (F-22) |

### 2.5 Cross-page

| Edge | Label | Destination | Truthful |
|---|---|---|---|
| Tutorial finale / skip link | `Empecemos — Start writing →` / `I've done this before — skip to the app` | `index.html?assignment=…` | ± "start writing" actually lands on project selector → landing → (Lab): the flag the tutorial writes is read by nothing (F-15). Walk evidence of the cost: every desktop walk logged **18 onboarding clicks** and 17–18 blocked probes before the studio (WALK post-onboarding; `evidence/screens/default/03…19-after-lab-skip.jpg`) |
| Deep link `?assignment=` | n/a | skips selector (WALK `deepLinkStillShowsSelector:false`) | ✓ but creates two different first-screens per classroom |

---

## 3. Five-paradigms diagnosis

The student must hold **five navigation grammars** at once (INV §7.1, confirmed end-to-end by the walks):

1. **Footer spine** (Back/Continue + preview interstitial) — the most discoverable and persistent
   paradigm; 70/70 names are genre-resolved and 63/70 movement states are truthful. Its failures
   are interception by ceremony surfaces (5 of 9 presses) and the seven S10 self-pointing labels.
2. **Journey map** (+ mobile select) — random access, hidden behind two toggles on desktop and an unlabeled chevron on mobile; refusals whispered into the chat column; checkmarks mean "clicked past", not "done" (F-5), so the map can't be trusted as a to-do list.
3. **Mobile select** — same gates, worse feedback: silent snap-back with the explanation on the hidden tab (F-6).
4. **Chat-embedded action cards** — save ceremony, review next-actions, Journey Complete, capstone trigger: real navigation controls living inside a scrolling conversation, some of which (next-actions) evaporate on reload (F-8). The chat column is simultaneously coach, notice board, and nav bar — 16→965 words of accumulation across a walk (WALK chatVisibleWords).
5. **Stage-10 modal chain** — capstone → instructor report → (✕) → process note → revision gate → celebration → journey-complete card: six chained surfaces where close buttons open dialogs (F-9), stacked at arrival three-deep under toasts.

**Diagnosis:** paradigm 1 is the product's spine and is healthy; paradigms 2–3 are underexposed duplicates of it; paradigm 4 overloads the coach relationship with system chrome; paradigm 5 inverts user control precisely at the finish line. Recovery should collapse 2–4 into the spine's grammar (named destinations, visible refusal reasons, persistent re-entry points) and flatten 5 into one sequential, closable surface.

---

## 4. One-page text diagram

```
start-here.html (tutorial ×6 variants, 23 steps, forced choices)
 │  "skip to the app" / finale  → writes tupana_tutorial_done (read by NOTHING — F-15)
 ▼
index.html ── first run ──► [Project selector]──choice──► [Landing card]
 (deep link ?assignment=  skips selector)        │   Empezar a escribir ──────────┐
                                                 │   Ver guía de 3 minutos ► [Lab]│ skip/complete
                                                 ▼                                ▼
        ┌────────────────────────────  THE STUDIO  ────────────────────────────────┐
        │ Header: lang | theme | ↻RESET(✗ wipes all — F-1) | ? | 🐞(dead)          │
        │ Calm bar 1·2·3 ─ "Ver ruta"► [Journey map (2 toggles deep, ✓=visited)]   │
        │ Task bar "Enfoque · <stage> 1/3"                    [Mi Toolkit]         │
        │ ┌───────────────┐            ┌─────────────────────────────────────────┐ │
        │ │ DRAFT PANEL   │            │ CHAT PANEL = coach + notice board + nav │ │
        │ │ prior-work    │ selection► │  system notes | strips | eval widgets   │ │
        │ │ strip (S2–10) │  passage   │  [next-actions card ¿Y AHORA? —          │ │
        │ │ editor        │  menu      │   dies on reload F-8]                    │ │
        │ └───────────────┘            └─────────────────────────────────────────┘ │
        │ Footer: Enfoque(✗ in hide-coach) | Revisar borrador(S7–9) | Mi trabajo   │
        │         ← Volver a: <prev>   |   Continuar a: <next> ─┐                  │
        └───────────────────────────────────────────────────────┼──────────────────┘
                 S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8 → S9 → S10│
                 ▲ every hop: [Stage preview] (Esc dead F-10)    │
                 ▲ ambushes: [checkpoint S4,S7] [phase toast S6,S8,S9]
                 S6: Guardar ► [confirm] ► [ceremony] ─► S7  or "read first"► locked editor (F-14)
                 S7–9: Revisar borrador ► [Lens chooser (5) ─► result in chat
                            └─► Convocar al consejo ► [progress] ► [Council report:
                                 Aceptar/Adaptar/Rechazar ... Volver a escribir]]
                 S10: AUTO ► [Capstone 10A►10B►10C + report panel]  (+toast+toast stack)
                        ✕ ──450ms──► [Process Note] ─Completar─► [Revision gate]─► S9
                        └─► [Completion celebration] ► [Journey Complete card] ► hub(submit)
                 Continue@S10 ──► itself (✗ self-pointing)
        Mi trabajo ► [Hub: work mode ⇄ (S9+) submit mode | backup/import | ⚠ Borrar mis datos]
        Estoy atascado ► [triage] ─overwhelmed/break─► hide-coach mode (exit: "Mostrar coach"/Esc only)
Persistence: all edges keep work EXCEPT header ↻Reset and hub Borrar (+ browser eviction).
```
