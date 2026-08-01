# Design System & Accessibility Recommendations — Tu Pana Writing Studio

**Deliverable 18 · UX Recovery Audit 2026-08 · Direction-independent accessibility contracts;
provisional Concept B component examples are not an implementation decision.**
Evidence base: `inventory/bilingual-visual-a11y.md` (Agent E — rendered Playwright
measurements at 1280×900 and 375×667, computed WCAG 2.1 ratios), `target-experience-
principles.md` (P2, P3, P5, P6, P10, P11, P12), `future-state-concepts.md` §B.
Companion: `bilingual-content-strategy.md` (Deliverable 17) — the SR/aria decisions here
implement its single-language accessible-name rule.

All proposed color values below were re-verified computationally (WCAG 2.1 relative
luminance) during drafting; ratios shown are computed, not estimated. No code changes are
made by this document.

**Classification legend:** **[S] Structural** = changes the model; without it the same defect
class recurs on the next sprint. **[P] Polish** = bounded fix inside the current model.

---

## 0. Decisions at a glance

| # | Class | Decision |
|---|---|---|
| DS-1 | S | ~65 button classes collapse to **one base + 5 variants + 2 sizes** |
| DS-2 | S | ~16 modal families collapse to **one dialog component** with class-keyed focus containment |
| DS-3 | S | 36 card classes collapse to **3 card types** |
| DS-4 | S | ≥8 status patterns collapse to **status rail + autosave indicator + field validation** |
| DS-5 | S | `--text-muted` retuned: light `#7A6C60`, dark `#9A8D7A` (both AA) |
| DS-6 | S | Primary buttons get an `--on-amber` ink token (dark mode: dark ink, 5.29:1) + AA-safe light gradient |
| DS-7 | P | `--amber-text` → `#A55412`; `--sky` demoted from text duty (or `#3D6FA3` as text) |
| DS-8 | S | Motion ≤250ms; **content-stability rule** — no animation moves text being read |
| DS-9 | S | Focus traps keyed to `[role="dialog"][aria-modal="true"]`, not an ID list |
| DS-10 | S | Journey map becomes keyboard-first: real buttons, list semantics, `aria-current` |
| DS-11 | P | 44px floor completed — modal closes, toast close, toolbar, toggles |
| DS-12 | S | SR strategy: single-language names (D17), live-region restructure of chat |
| DS-13 | P | Bespoke interactive divs → native `<button>`; title-only affordances surfaced |
| DS-14 | S | Keyboard-safe editor viewport contract (`visualViewport` + guaranteed writing lines) |
| DS-15 | P | EN-mode mobile task-bar fix (one line of CSS — ship first) |
| DS-16 | S | Mobile step navigation reachable in one tap (steps sheet in the tab bar) |
| DS-17 | S | Marquee deleted; single-language rendering + 2-line clamp with tap-to-expand |
| DS-18 | P | `dev-preview-bar` excluded from production builds |

---

## 1. Component consolidation

### DS-1 [S] — Buttons: one base, five variants, two sizes

**Evidence.** 65 distinct `*btn*` classes (~60 real button styles) — `save-btn, continue-btn,
footer-btn, etb-btn, lab-next-btn, mani-proceed-btn, capstone-*-btn ×6, report-action-btn,
pn-modal-btn, stage-preview-btn, reflect-btn, rna-btn, tic-btn, vp-route-btn,
council-decision-btn…` (VIS-1, inventory §2.2). At least **five different "primary"
treatments** coexist (grad-amber `save-btn`, solid `continue-btn--ready`,
`save-ceremony-btn primary`, `pn-modal-btn primary`, `report-action-btn primary`).

**Consequence.** Every cross-cutting fix (44px targets, focus rings, dark mode, contrast)
must be re-applied per family — and was demonstrably missed in several (A11Y-4's close
buttons; VIS-6's dark primaries). Students cannot predict control weight: "primary" looks
five ways.

**Root cause.** Each feature sprint shipped its own button family instead of variants of a
base; nothing in the stylesheet made that expensive.

**Recommendation.** Target set — exactly:
- **Base `.btn`**: token typography (`--text-ui`), token radius, focus-ring grammar,
  ≥44×44px interactive area, disabled/busy states.
- **Five variants:**
  1. `--primary` — the single amber treatment (DS-6 ink/gradient), one per view maximum;
  2. `--secondary` — bordered neutral (the current footer-btn look);
  3. `--quiet` — text/ghost, for tertiary and in-chat actions;
  4. `--danger` — rose family, only inside the F1-isolated danger surfaces (P5);
  5. `--icon` — square icon-only, mandatory `aria-label` (single-language per D17),
     44×44 minimum — this is the variant modal closes and toolbar buttons use.
- **Two sizes:** default; `--compact` (visual height 36px for dense toolbars, but hit area
  padded to ≥44px — the hit area never shrinks).
- Movement-vs-action styling hooks per P3: navigation controls take `--secondary/--quiet` +
  destination labels; work-acting controls take `--primary/--danger` + effect labels.
- Migration is mechanical: a mapping table (old class → base+variant) per feature area; old
  class names may remain as aliases during migration but define no properties of their own.

**Acceptance test.** Stylesheet audit: button-styling classes ≤12 (base + variants + sizes +
states); rendered walk shows exactly one `--primary` per view; every button family passes
the same automated checks (44px, focus-visible, dark-mode contrast) *once*, via the base.

### DS-2 [S] — One modal family with focus containment

**Evidence.** ~16 modal/overlay families: 10 static overlays with correct `inert`/
`aria-hidden` discipline (`setOverlayOpen`, `ui.js:108–142`), dynamic `toolkit-modal-bg` /
`eval-modal-bg` / `welcome-bg`, and **two overlays styled entirely with inline `cssText` and
lacking `role="dialog"`** (`projectSelector` `ui.js:5030`, `maniCelebration` `ui.js:5313`)
(VIS-2). The Tab trap covers only the 9 static IDs (`getOpenStaticDialog`, `ui.js:3575–3590`);
dynamic dialogs announce `aria-modal="true"` while Tab walks into the background (A11Y-1).

**Consequence.** Keyboard users escape into a background SRs say doesn't exist — worst of
both; theming and a11y fixes must be re-done per family; two overlays are invisible to the
token system and dark mode (hardcoded `rgba(42,33,28,0.78)`).

**Root cause.** The dialog *contract* (role, trap, inert, restore, close affordance) lives in
scattered per-family code instead of one component.

**Recommendation.** One `.dialog` component, used by every blocking surface:
- Structure: backdrop, container (`role="dialog"` `aria-modal="true"`
  `aria-labelledby` required), header, body, footer, close.
- **Focus containment built in** (see DS-9), focus restore on close, `inert` + `aria-hidden`
  background via a generalized `setOverlayOpen`.
- **Escape policy is declared, not coded per dialog**: `data-escape="close"` (default) |
  `"guard"` (confirm before discard) | `"locked"` (the deliberate stage-preview policy —
  kept, but now visible in markup and testable).
- Close button = `.btn--icon` (44×44, DS-1); `--shadow-modal` reserved to this layer (kept);
  tokens only — the two `cssText` overlays are rebuilt on the component and get roles.
- One blocking layer at a time enforced at the component level (P2): opening a `.dialog`
  while one is open is a programming error that throws in dev builds.

**Acceptance test.** DOM audit at every reachable state: all blocking surfaces are `.dialog`
instances with role/labelledby; Tab cycles inside every open dialog (dynamic ones included:
toolkit, help, eval, reflect, revision gate, council cards, project selector, welcome, mani
celebration); Escape behavior matches the declared policy; automated walk asserts ≤1 visible
blocking layer per state; zero `cssText`-styled overlays remain.

### DS-3 [S] — Card set: three types

**Evidence.** 36 `*card*` classes (guide-card, research-card, eval-card, voice-polish-card,
transfer cards, modal cards…) (inventory §2.2).

**Consequence.** Same re-application tax as buttons; selectable cards (Mani assets) were
hand-rolled as `tabindex="0" role="button"` divs with bespoke key handling (A11Y-6).

**Root cause.** Same as DS-1 — no base component.

**Recommendation.** Exactly three types: **info card** (static content; may host a
disclosure per D17-3), **choice card** (selectable/actionable — rendered as or wrapping a
native `<button>`, focus-ring grammar, pressed/selected state; Mani assets and concept-
picker cards migrate here), **status card** (one visual grammar for state summaries — feeds
DS-4). All token-styled, all theme-aware.

**Acceptance test.** Card classes ≤6 (3 types + modifiers); every selectable card is
keyboard-operable via native semantics with no per-card key handler; dark-mode walk shows no
un-themed card.

### DS-4 [S] — One status-message pattern

**Evidence.** ≥8 coexisting patterns: `autosave-status(+saved/error)`, `etb-status` +
separate `etb-status-live`, `chat-status`, `system-note` (with dedup/archival), `saved-notice`,
`vault-status`, `capstone-evidence-status`, `phase-toast` — each with its own placement,
color, and lifetime (inventory §2.2). The chat column doubles as the notice board (~18
injected component types; refusals on mobile land in a hidden tab) (future-state item 3).
The setup banner is a raw hardcoded-bilingual `<div>` unlike any other pattern.

**Consequence.** A student cannot build one mental model of "where the app talks to me"
(P1's ten questions); SRs double-announce nested `role="status"` inside the live chat region
(A11Y-5); statuses compete with coaching (P2).

**Root cause.** Every feature invented its own channel because no shared channel existed.

**Recommendation.** Exactly three channels, per Concept B:
1. **Status rail** (persistent, calm — the Concept B surface): system notices, refusals,
   offers, vault/capstone/phase state, celebrations (non-blocking, P10). One visual grammar
   per entry: icon + what-happened + work-status + one next step (P10's failure form). One
   `aria-live="polite"` region for the rail; `assertive` reserved exclusively for
   data-loss-risk errors. On mobile the rail is a dot-notified sheet — the dot change is
   *announced* via the rail's live region (fixes RES-5).
2. **Autosave indicator**: one, adjacent to the draft, truthful (P12), answering "was my
   work saved" in one glance (P5). `saved-notice`/`autosave-status` variants merge here.
3. **Field validation**: adjacent to the control it validates, `aria-describedby`-linked.

Chat stops carrying status: `system-note` class of content moves to the rail; the chat
stream carries conversation only.

**Acceptance test.** Inventory sweep: every status-bearing string renders through one of the
three channels; zero status text originates in chat; every failure state shows
what-happened + work-status + next-step; SR run announces each status exactly once; walk
asserts a refusal on mobile produces a rail dot *and* an announcement.

---

## 2. Token fixes (verified values)

### DS-5 [S] — `--text-muted` retuned to AA

**Evidence.** Light `#9E9086`: **2.75:1** on `--bg-base`, 2.92 on panel, 3.09 on white. Dark
`#6A6050`: **2.49:1** on `--bg-raised` (VIS-5). Used **109 times**, and the quiet-twin
convention assigns it to the English half of bilingual copy (`styles.css:6519–6523`).

**Consequence.** Most hints/microcopy — and an entire language in both-mode — render below
AA legibility, for the exact population (tired students on phones) least able to absorb it.

**Root cause.** The muted step was tuned for atmosphere against `--bg-raised` white and then
reused on darker bases; no contrast gate exists in the token layer.

**Recommendation.** Retune the token — one change fixes all 109+ uses:
- Light: `--text-muted: #7A6C60` → **4.51 on `#F5F1EB` base · 4.78 on `#FAF8F5` panel ·
  5.07 on white** (all AA).
- Dark: `--text-muted: #9A8D7A` → **4.73 on `#2A241C` raised · 5.84 on `#12100E` base**.
- Add a checked-in contrast test (the audit's computation script) over every
  text-token × background-token pair so regressions fail CI, not students.
- Per D17-3, the both-mode secondary language stops using muted at all and moves to
  `--text-sub` (6.1:1) — muted returns to true tertiary microcopy only.

**Acceptance test.** Token contrast suite: all text tokens ≥4.5:1 on every background token
they are used against (≥3:1 only where usage is verified ≥18.66px bold/24px); rendered
spot-checks of hint text at 375px dark mode.

### DS-6 [S] — Primary-button ink: `--on-amber` pair token

**Evidence.** Dark mode: white on `--amber #D4823A` = **2.98:1** — and Save/Continue, the two
most important controls, use `--grad-amber` + `#fff` (VIS-6). Light mode passes on the base
color (4.58) but the gradient midpoint `#D4722A` sits at ≈3.1.

**Consequence.** The app's two highest-stakes controls are its least legible in dark mode.

**Root cause.** Button ink is hardcoded `#fff` per family instead of paired with the amber
token, so the dark-theme amber brightening silently broke contrast.

**Recommendation.**
- New pair token `--on-amber`: light `#FFFFFF`, dark `#2A211C`. Verified: dark ink on
  `#D4823A` = **5.29:1**; on hover-gradient peak `#E8A060` = **7.22:1**. All primary
  variants (DS-1) use `var(--on-amber)` — never literal `#fff`.
- Light gradient retuned so white passes across its whole span:
  `--grad-amber: linear-gradient(135deg, #A85212 0%, #B85C1A 50%, #A85212 100%)` —
  white = **5.41 / 4.58 / 5.41** (midpoint is the current base amber; endpoints darken
  slightly, amber identity kept).
- Focus-ring exception on filled amber (amber-dk ring) kept as documented.

**Acceptance test.** Computed contrast of button ink against *every gradient stop* ≥4.5 in
both themes; rendered screenshot diff of Save/Continue in dark mode; grep: zero literal
`#fff`/`white` color declarations inside primary-button rules.

### DS-7 [P] — Small accent text: `--amber-text`, `--sky`

**Evidence.** `--amber-text #D4722A` on base = 2.99 — used 68 times including 0.62rem
uppercase phase labels; `--sky #6C9ECF` = 2.67 on panel, fails everywhere it is text
(VIS-7).

**Consequence.** Journey phase labels and stage numbers — orientation microcopy — are
sub-AA at tiny sizes.

**Root cause.** Accent colors promoted to text duty without a size-aware gate.

**Recommendation.** `--amber-text: #A55412` (light) → **4.81 on base / 5.11 on panel**
(AA at any size); dark `--amber-text #E8A060` already passes on dark grounds — verify in the
DS-5 suite. `--sky`: either retire from text duty (borders/fills only) or introduce
`--sky-text: #3D6FA3` → **4.66 base / 4.95 panel** for its text uses. Jade/success text
uses at 3.2/3.15 are re-checked by the same suite and retuned only where used small.

**Acceptance test.** DS-5 token suite covers these pairs; rendered check of phase labels at
0.62rem passes 4.5:1.

### DS-8 [S] — Motion budget and content stability

**Evidence.** Token layer already defines 0.15/0.25/0.4s speeds; 22 `prefers-reduced-motion`
blocks (good). But the task bar ships a **9s × 2-cycle marquee** (`styles.css:6737–6754`)
that scrolls the primary instruction while the student reads it (§1.5); celebrations have
historically blocked work (C2 findings).

**Consequence.** Violates P10 twice: motion above ~250ms, and motion that moves content the
student is reading — on the ADHD-critical orientation surface.

**Root cause.** Animation used to *compensate for* overlong copy instead of fixing the copy
(the marquee is the symptom; D17 is the cure).

**Recommendation.** Two rules, enforced by audit:
1. **≤250ms**: all UI transitions bind to `--transition-fast/medium`; `--transition-slow`
   (0.4s) is reserved for full-surface theatrical moments (welcome), never for controls or
   feedback. Nothing loops.
2. **Content-stability rule**: no animation may translate, resize, or reflow an element
   containing text the student may currently be reading — no marquees (DS-17), no layout
   shift when a status arrives (the rail reserves its space), no scroll hijacking of the
   editor. Celebrations never block input (P10).

**Acceptance test.** Motion audit script lists every CSS animation/transition >250ms or
`infinite`; the list is empty except the documented welcome exception; walk asserts zero
layout shift (CLS ≈0) on status arrival and stage transitions; reduced-motion blocks remain.

---

## 3. Accessibility completion

### DS-9 [S] — Focus containment for ALL dialogs

**Evidence.** Trap checks only 9 static IDs (`ui.js:3575–3590`); dynamic dialogs
(`toolkitModal` 8460, `helpModal` 8594, `evalModal` 6038, `reflectModal` 5762,
`revisionCompletionGate` 7797, council cards, `projectSelector` 5030 — no role,
`landingMoment` 5124, `maniCelebration` 5313 — no role) have `aria-modal` but no containment
(A11Y-1).

**Consequence.** Keyboard focus leaves "modal" dialogs into a background SRs report as
unavailable.

**Root cause.** Trap membership is an ID allowlist; new dialogs don't join it.

**Recommendation.** Key the trap to the contract, not the roster: the global keydown handler
traps Tab inside the topmost element matching `[role="dialog"][aria-modal="true"]:not([hidden])`
(the DS-2 component guarantees the markup). `setOverlayOpen`'s inert discipline generalizes
to the same selector. The role-less overlays get roles by migrating onto DS-2. Existing
correct traps (full-review, stuck menu) fold into the shared implementation.

**Acceptance test.** Automated keyboard walk opens every dialog in the inventory and asserts:
Tab/Shift-Tab cycle stays inside; first focus lands on the dialog's first meaningful control;
close restores focus to the invoker. Zero `aria-modal` elements without containment.

### DS-10 [S] — Journey map: keyboard and semantics

**Evidence.** Rendered check: **10 `.stage-node` elements, 0 tabbable, role=null**
(`buildMap`, `ui.js:1746–1789`); tooltips hover-only (`showTip`, 2288); the ≤480px `<select>`
alternative doesn't exist on desktop (A11Y-2).

**Consequence.** Keyboard and SR users cannot navigate stages at all on desktop — a P1 hole
in the app's central orientation surface.

**Root cause.** Map built as decorated divs with click/mouseenter listeners.

**Recommendation.** The map renders as `<ol>` of `<li><button>` steps:
- Accessible name per D17 (single-language): "Paso 3 · Tu Pitch — completado" resolved to
  the preference; state in the name or `aria-describedby`, never color-only.
- `aria-current="step"` on the active step; disabled/locked steps are real disabled buttons
  with reason text.
- Arrow-key navigation within the list (roving tabindex), Enter/Space activates — same
  pattern as the existing stuck-menu implementation (proven in-house, `ui.js:6559–6678`).
- Tooltip content moves to `aria-describedby` text revealed on **focus as well as hover**;
  nothing is hover-only or `title`-only.

**Acceptance test.** Keyboard-only walk reaches and activates every unlocked stage from the
map on desktop and tablet; axe/ARIA audit: list semantics, `aria-current` present, zero
role-less interactive nodes; hover-tooltip content readable via keyboard focus.

### DS-11 [P] — 44px touch floor, completed

**Evidence.** Measured at 375×667: `phaseToastClose` **20×24**; modal closes 27–33px
(`pn-modal-close`, `completion-close`, `capstone-modal-close`); `previewBackBtn` 24h;
`report-close` 30h; edit-toolbar buttons 30w; `calmPathToggle`/`bug-report-btn` 38×38
(A11Y-4). ~40 deliberate 44px rules exist — the close-button class was simply missed.

**Consequence.** The hardest-to-hit controls are the ones that dismiss blocking surfaces —
misses reopen/misfire at moments of wanting out.

**Root cause.** Per-family buttons (DS-1's root cause) — the 44px sweep had to find every
family and didn't.

**Recommendation.** All listed controls migrate to `.btn--icon` (44×44 minimum, DS-1) or gain
padded hit areas where visual size is constrained (toolbar `--compact`: visual 36, hit ≥44).
Floor applies to **every** interactive element including modal closes, toast dismissals, and
disclosure toggles — enforced by an automated rendered-size audit, not convention.

**Acceptance test.** Playwright sweep at 375×667 over every interactive element in every
reachable state: bounding hit area ≥44×44 (visual exceptions must still measure ≥44 on the
hit target). The A11Y-4 list measures compliant.

### DS-12 [S] — Screen-reader strategy (consistent with Deliverable 17)

**Evidence.** ~108 hardcoded "ES · EN" aria-labels are double-read in the wrong voice
(A11Y-3); `chatMessages` is one big `aria-live="polite"` region receiving injected
interactive panels and nested `role="status"` notes — double announcements and replayed
long responses (A11Y-5); only ~39 inline `lang` attributes exist across both files.

**Consequence.** SR users get every control name twice (half mispronounced), full coach
responses replayed, and announcements of UI they haven't reached — the preference D17
establishes visually is defeated aurally.

**Root cause.** Accessible names were authored in the join convention; the chat container
doubles as the live channel for everything inside it.

**Recommendation.**
1. **Single-language accessible names everywhere** (D17-2's rule, restated as the design-
   system contract): names come from the resolver; `both` mode names in Spanish (primary);
   `<html lang>` stays synced (existing `setLang` behavior); any visible secondary-language
   span carries `lang` so incidental reading uses the right voice.
2. **Live-region restructure:** the live region wraps **only appended message text**;
   interactive panels (follow-ups, eval bars, reflect buttons) are appended outside the live
   wrapper (or `aria-live="off"`) and announced once via a short rail notice ("Nuevas
   opciones de revisión disponibles"); nested `role="status"` items move to the DS-4 rail —
   one announcement per event, ever.
3. **TTS buttons** keep `es-US` preference but follow the resolved language of the string
   they read.

**Acceptance test.** NVDA + VoiceOver pass: each control name announced once in the correct
language voice; a seeded coach reply announces its text once; injected panels do not
self-announce; status events announce exactly once (rail). Automated: zero aria-labels
containing "·"; live-region count and placement match the spec.

### DS-13 [P] — Native semantics for bespoke interactive elements

**Evidence.** `.mani-asset` cards are `tabindex="0" role="button"` divs with a bespoke
overlay-scoped key handler (A11Y-6); `title`-only affordances (journey circle "Puerta de
autoría", toolbar shortcuts) invisible to touch/SR; `bug-report-btn` uses `aria-disabled`
while its onclick still fires (A11Y-7).

**Consequence.** Fragile keyboard behavior that works only in one overlay state; affordances
whole user classes can't discover; a control that says disabled but isn't.

**Root cause.** Div-first construction; `title` used as the only label channel.

**Recommendation.** Mani assets become DS-3 choice cards on native `<button>` (bespoke key
handler deleted). Every `title`-only affordance gains a visible label, a focus-revealed
tooltip, or `aria-describedby` text. `aria-disabled` elements guard their handlers (announce
why via the rail instead of silently firing or silently ignoring).

**Acceptance test.** Grep: zero `role="button"` on non-button elements; zero interactive
elements whose only name/description channel is `title`; disabled-state audit shows behavior
matches announcement.

---

## 4. Responsive / mobile spec

### DS-14 [S] — Keyboard-safe editor viewport

**Evidence.** At 375×667: 224px of chrome, 257px textarea (~38% of viewport); with the iOS
keyboard (~260px) the writing surface is **≈100px — about 4 lines**. No `visualViewport`
handling exists; fixed bottom `mobile-tabs` and the 58/42 split don't adapt while typing
(inventory §4.1, RES-2).

**Consequence.** P11 fails at its core clause: the phone is not a writing desk with the
keyboard up — 4 lines is transcription, not composition.

**Root cause.** Layout designed against the layout viewport; the visual viewport (the thing
the keyboard shrinks) is never observed.

**Recommendation.** A viewport contract:
- Add `interactive-widget=resizes-content` to the viewport meta; add a `visualViewport`
  resize/scroll listener that toggles a `keyboard-open` root class.
- While `keyboard-open` **and the draft editor is focused**: `mobile-tabs` hide (they return
  on blur — nothing is lost, P4); progress + task bar collapse to one 32px orientation line
  (step name only, per D17 single-language); the editor is guaranteed **≥8 visible text
  lines (~160px)** and auto-scrolled so the caret is never under the keyboard.
- While `keyboard-open` and the **chat input** is focused: message list keeps ≥3 recent
  messages visible above the input.
- Applies to every text-entry surface (draft, chat, reflection prompts, process note).

**Acceptance test.** Playwright with emulated keyboard inset (visualViewport height 407):
focused editor shows ≥8 lines and the caret; tabs absent while typing, restored on blur;
chat shows ≥3 messages while composing; full journey walk passes at 390px with keyboard
simulation (P11 acceptance form).

### DS-15 [P] — EN-mode empty task bar (ship first)

**Evidence.** Confirmed rendered bug (RES-1, P1): ≤640px base CSS hides `.ctb-en`
(`styles.css:5407`); `html[data-lang="en"]` hides `.ctb-es` with `!important` (6481) but the
EN-mode rule (6483–6487) never restores `display`. Measured: task instruction = `""` at
375px in EN mode.

**Consequence.** English-preferring phone users have no "what do I do now" line — on the
ADHD-critical orientation surface.

**Root cause.** Mobile trimming and language mode were authored as independent CSS layers
with no combined-state test.

**Recommendation.** Immediate: add `html[data-lang="en"] .ctb-en { display: inline !important; }`
to the ≤640px block. Structural supersession: D17-2 single-language rendering makes the
per-language hide/show CSS unnecessary — the task bar renders one string per mode.

**Acceptance test.** 375px walk in all three modes: task instruction non-empty and correct
at every stage; regression test pinned so the combined state (mobile × language mode) stays
covered.

### DS-16 [S] — Stage navigation in one tap

**Evidence.** On phones the journey map is `display:none` ≤480px; the stage `<select>` is
hidden until "Ver ruta" is opened (`styles.css:8019–8020`) — two taps plus prior knowledge
(RES-3).

**Consequence.** P1's "where am I / how do I go backward" have no one-act mobile answer.

**Root cause.** Mobile nav was an afterthought disclosure rather than a designed surface.

**Recommendation.** Per Concept B "one nav (steps sheet)": the bottom tab bar gains a
persistent **steps control** (44px, labeled per D17 — "Pasos"/"Steps") that opens a bottom
sheet listing the 10 steps with true completion state, `aria-current`, and the DS-10
semantics; one tap to open, one tap to move. The hidden `<select>` and the "Ver ruta"
double-disclosure retire. The sheet is a DS-2 dialog (trap, Escape, 44px rows).

**Acceptance test.** From any stage at 375px: current step visible in the tab bar; any
unlocked step reachable in exactly two taps (open sheet, tap step); keyboard/SR pass on the
sheet; "Ver ruta"-gated select no longer exists.

### DS-17 [S] — No marquee; what replaces it

**Evidence.** 9s×2 marquee for overflowing bilingual task instructions
(`styles.css:6737–6754`); ≤480px already neutralizes it to a 2-line clamp (6831–6845);
measured single-language instruction lengths: 13 words (es) / 12 (en) vs 27 (both) —
single-language fits (§1.3, §1.5).

**Consequence.** Scrolling text on the orientation surface — the single clearest P10
violation — exists only to accommodate double-length copy.

**Root cause.** Copy model problem solved as an animation problem.

**Recommendation.** Delete `ctb-marquee` entirely. Under D17, the task bar renders one
language (or quiet-twin stacked in both mode, where the *primary* line is the fitting
single-language string). Overflow rule for genuinely long instructions at any width:
**2-line clamp + tap/Enter to expand** the full instruction in place (the ≤480px clamp
pattern generalized to all widths, made interactive and announced via `aria-expanded`).
Nothing in the task bar ever animates horizontally.

**Acceptance test.** Grep: `ctb-marquee` absent from CSS and JS; rendered walk at 320–1280px
in all modes: no horizontal animation anywhere; clamped instructions expand by tap and
keyboard; task bar full text always reachable.

### DS-18 [P] — Production chrome only

**Evidence.** `dev-preview-bar` (`index.html:1037–1041`) renders in production layouts,
EN-only, consuming bottom space on phones (RES-6).

**Consequence.** Dev affordances compete with student UI for the scarcest space on the
smallest screens.

**Root cause.** No build/flag separation between dev instrumentation and shipped UI.

**Recommendation.** The preview bar renders only behind an explicit dev flag (query param or
build flag); production DOM contains neither the bar nor its listeners.

**Acceptance test.** Production build walk: element absent from DOM at all viewports; dev
flag restores it.

---

## 5. Structural-vs-polish classification (full table)

| Rec | Classification | Why | Priority | Depends on |
|---|---|---|---|---|
| DS-1 buttons | **Structural** | Per-family re-application tax is the root cause of A11Y-4/VIS-6 recurrence | P1 | — |
| DS-2 modal family | **Structural** | Dialog contract in one place ends the trap/role/theme drift class | P1 | DS-1 (icon btn) |
| DS-3 cards | **Structural** | Same base-component argument; fixes A11Y-6 by construction | P2 | DS-1 |
| DS-4 status pattern | **Structural** | Changes where the app talks; prerequisite for P2/P10/P12 compliance | P1 | Concept B rail |
| DS-5 text-muted | **Structural** | One token, 109+ uses, includes the quiet-language convention | P1 | — |
| DS-6 on-amber | **Structural** | Pair-token model prevents theme-drift contrast breaks | P1 | — |
| DS-7 amber-text/sky | Polish | Bounded token retune | P2 | DS-5 suite |
| DS-8 motion rules | **Structural** | A rule + audit, not a fix list; prevents the next marquee | P1 | — |
| DS-9 traps by contract | **Structural** | Allowlist → contract; new dialogs safe by default | P1 | DS-2 |
| DS-10 journey map | **Structural** | Semantics change, enables mobile sheet reuse | P1 | — |
| DS-11 44px completion | Polish | Sweep over a known list; DS-1 prevents recurrence | P1 | DS-1 helps |
| DS-12 SR strategy | **Structural** | Naming + live-region model, spans every surface | P1 | D17-2, DS-4 |
| DS-13 native semantics | Polish | Bounded element list | P2 | DS-3 |
| DS-14 keyboard viewport | **Structural** | New layout contract; P11 unreachable without it | P0/P1 | — |
| DS-15 EN task bar | Polish (fix) / superseded structurally by D17 | One-line CSS now | **P1 — immediate R0** | — |
| DS-16 one-tap nav | **Structural** | Replaces the mobile nav model | P1 | DS-2, DS-10 |
| DS-17 marquee removal | **Structural** | Removes a mechanism class, tied to the copy-model fix | P1 | D17 batches M1–M4 |
| DS-18 dev bar | Polish | Build hygiene | P2 | — |

**Protect while consolidating** (inventory §5): the token/type-scale layer, the two-family
focus-ring grammar, the 22 reduced-motion blocks, `setOverlayOpen`'s inert discipline (it
generalizes — don't rewrite it), the ≤480px tab layout, and the existing interface/
reachability test suites.
