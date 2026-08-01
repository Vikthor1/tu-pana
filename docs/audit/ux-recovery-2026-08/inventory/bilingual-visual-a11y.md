# Bilingual Experience + Visual / Responsive / Accessibility Audit
**Agent E — UX Recovery Audit, 2026-08. Read-only code audit of `/Users/Victor1/Sites/tupana-audit` (index.html, start-here.html, assets/js/ui.js 8,920 ln, assets/js/data.js, assets/css/styles.css 8,052 ln). Rendered measurements taken with Playwright (Chromium, 1280×900 and 375×667) against the actual app with onboarding pre-seeded.**

Severity follows the package-wide rubric: **P0** = demonstrated irreversible loss/overwrite, privacy exposure, or destructive action · **P1** = blocks/materially misleads a core journey or violates a trust/equity contract · **P2** = substantial confusion or cognitive burden · **P3** = consistency/a11y polish.

---

## 1. Bilingual model

### 1.1 What the architecture actually is

The app is **not** "always both languages." It has a real 3-way preference:

- `state.lang: 'es' | 'en' | 'both'`, **default `'es'`** (`ui.js:17`, `index.html:2` `data-lang="es"`), persisted in `localStorage('tupana_lang')` (`ui.js:332–355`).
- Switchers: desktop 3-button group ES / EN / ES·EN (`index.html:32–36`), mobile `<select>` ES/EN/BI shown at ≤480px (`index.html:37–41`, hidden/shown at `styles.css:6572` / `6871–6880`), and a third switcher inside the landing welcome overlay (`ui.js:5124–5140`).
- Mechanism: copy is authored as `<span class="show-es">…</span><span class="lang-sep"> · </span><span class="show-en">…</span>`; CSS on `html[data-lang]` hides the non-selected half (`styles.css:6471–6495`). Task bar uses a parallel `ctb-es/ctb-sep/ctb-en` system; journey map labels use `label-es/label-en`.
- `setLang()` also updates `document.documentElement.lang` (es/en) for AT and rebuilds the mobile `<select>` (plain-text labels built per mode, `ui.js:1827–1850`).
- The AI coach **is** language-aware: the system prompt ends with "The current interface language is: ${lang} / Respond in ${lang}…" where lang ∈ English / Spanish / "Bilingual (Spanish and English)" (`ui.js:3195–3199`, prompt tail after `ui.js:3303`). Stuck-starters insert single-language text into the draft by mode (`prompts.js:123–127`), warmth lines are per-language (`prompts.js:67–106`), and there is regression coverage (`bilingual_starter_test.mjs`, `bilingual_warmth_test.mjs`).

**So the architecture already answers the "preference vs always-both" question in favor of preference. The problem is coverage: a large second population of strings bypasses the system entirely.**

### 1.2 The bypass population (the real defect)

Four distinct bypass patterns, quantified:

| Pattern | Where | Scale |
|---|---|---|
| Hardcoded `"ES · EN"` single strings (aria-labels, titles, addSys messages, modal headers, button text) | ui.js | **~324 lines** contain " · " joins with no `lang-sep` markup (vs 322 lines using the toggle spans) |
| Hardcoded `"ES / EN"` joined strings | data.js `followups` (all 10 stages), setup banner (`index.html:16`), persistence tip (`index.html:967`) | **39** joins in data.js alone |
| Static modals authored as fixed bilingual prose (no spans at all) | confirm modal `index.html:791–804`, mani/Tu Conocimiento `476–595`, El Laboratorio `600–785`, pn-modal `975–997`, completion modal `1002–1017`, phase toast CTA `466` | 6 of the 10 static overlays |
| Single-language-only source strings | data.js stage `desc` fields (EN-only), `translang` (ES-only); El Laboratorio content (EN-primary); start-here.html (EN-primary, **zero** show-es/show-en spans — grep = 0) | entire onboarding + tutorial layer |

Additional structural quirks:

- **`t()` is tone, not translation** (`ui.js:294`). Many calls pass a *bilingual* string as the "gentle" variant and an *English-only* string as "direct" (e.g. `ui.js:497,500,504,507`): switching tone to Direct silently switches system feedback to English-only even for an ES-mode student. Language and tone are entangled.
- **AI/system chat messages are filtered by heuristic, not by source fields**: `wrapBilingualHtml()` (`ui.js:2754–2799`) regex-detects "Spanish line \n English line" (accent test + 200-word English wordlist + length ratio >0.35). When the heuristic misses (single-line " · " joins, accent-less Spanish, asymmetric translations), both languages render in every mode. Correct behavior depends on string *shape*.

### 1.3 Measured reading burden (rendered, Playwright)

Words a student actually reads per surface, by language mode:

| Surface | both | es | en | Toggle coverage |
|---|---|---|---|---|
| Main screen, stage 1 (draft panel) | 92 | 41 | 42 | good (−55%) |
| Main screen (chat panel incl. greeting) | 170 | 133 | 132 | partial (−22%) |
| Current-task bar | 27 | 13 | 12 | good |
| Calm 3-phase progress bar | 38 | 17 | 17 | good |
| Draft-ownership warning | 49 | 24 | 26 | good |
| Help modal | 426 | 198 | 212 | good (−53%) |
| Stage-preview modal (→ stage 2) | 90 | 58 | 60 | partial |
| Draft-saved celebration modal | 155 | 126 | 127 | **weak (−19%)** |
| "I'm stuck" triage menu | 97 | 84 | 82 | **weak (−13%)** |
| Save-confirm modal (`confirmBg`) | 69 | **69** | **69** | **zero — fully hardcoded** |

Headline numbers: in **bilingual mode a stage-1 screen carries ~330 visible words of chrome** (header 15 + progress 38 + task bar 27 + draft panel 92 + chat 170) before the student writes anything; choosing ES-only should halve that but only removes ~38% (≈205 remain), because hardcoded joins survive the toggle. At the emotional peak of the journey — the save-your-first-draft decision — the modal ignores language preference entirely (69 words in every mode, both languages interleaved line-by-line).

### 1.4 Semantic equivalence & terminology

- **Stage 10 has three names**: ES "Mi cierre de proceso" ("my process closing"), EN "My Writing Snapshot" (different metaphor), and CTA "Write My Reflection" (`data.js:152, 213–218`; `ui.js:916–917, 1024`). A student, an instructor, and the export packet can each be talking about a differently-named artifact.
- **Etapa vs Paso vs Step**: task bar says "Etapa 1 · Stage 1" (`index.html:107`), the mobile nav label says "Paso · Step" (`index.html:99`), genre templates say "Paso 8" (`genre-template.js:439`). Two Spanish words for the same unit.
- **"Revisión" collision**: stage 7 "Revisión / Revision" vs "Revisar borrador · Review draft" (full-draft review, `index.html:212`) vs "Consejo de revisión · Review Council" (`ui.js:4252,4307`). In Spanish, *revisión* covers both "revision" and "review," so three different features share one Spanish noun.
- **Mixed-language brand terms in ES mode**: "Mi Toolkit" (`index.html:101,121`), mobile button label literally "Toolkit" (EN-only). Voice Vault is properly "Bóveda de voz."
- **Mani (Tu Conocimiento) asset cards are not equivalent**: full English paragraphs vs one-line Spanish summaries (e.g. `index.html:504–505` — EN 3 sentences, ES 1 short sentence). Spanish-dominant students get the abridged version of the identity-affirmation content, in the module whose entire point is linguistic dignity.
- **El Laboratorio is EN-primary** (P1 equity issue): step headings ("Your coach is powerful."), all 5 question labels, all choice buttons, and all feedback cards (`index.html:622–775`) are English-only with Spanish garnish. The critical-AI-literacy training — the pedagogical heart — is effectively English-gated. Footer buttons "Skip — I know the Five Questions", "Begin →" EN-only (`index.html:780–781`).
- **start-here.html tutorial**: EN-primary voice throughout, no language system, no `setLang` (grep for show-es/lang-sep = 0 matches). Skip link "I've done this before — skip to the app · Ya lo conozco."
- EN-only leaks elsewhere: dev preview bar (`index.html:1037–1041`), "Preview Onboarding"; Freire quote EN-only (`index.html:590`); `aria-label="Write one thing rooted in your experience…"` EN-only (`index.html:579`).
- ES-only leaks: "Continuar al Laboratorio →" (`index.html:587`), `translang` field (`data.js`), mani claim labels.

### 1.5 Overflow-prone long labels

The bilingual join makes labels ~2.2× longer, and the codebase already fights this: a **marquee animation** for the current-task bar when the bilingual instruction overflows (`styles.css:6737–6754`, `ctb-marquee`, 9s × 2 cycles), a right-edge fade mask on the journey scroll, `continue-btn-label-es/en` split classes, and a mobile-only default that **drops the English half of the task instruction at ≤640px** (`styles.css:5407`). A marquee is the clearest possible symptom that the copy model, not the layout, is the problem.

### 1.6 Verdict (evidence-based)

**A language preference with contextual bilingual support beats always-both — and the codebase already agrees**: the preference exists, defaults to ES, drives the AI coach, and where the span system is used it cuts reading load 50–55%. What's missing is **enforcement as an invariant**: one canonical bilingual-string representation (`{es,en}` fields resolved at render time, like `STAGE_STEPS`/`STAGE_TRANSITIONS` already do) instead of four ad-hoc encodings. The ~324 hardcoded joins in ui.js, the 6 hardcoded static modals, the EN-primary onboarding/tutorial, and the tone-entangled `t()` are migration work, not a redesign. "Both" should remain a supported mode (translanguaging is pedagogically core here) but with the ADHD-B7 stacked-quiet-twin grammar (`styles.css:6503–6526`) generalized, rather than inline " · " interleaving.

**Findings:**
- **P1 — BIL-1**: Save-confirm modal, draft-saved celebration, stuck menu, and completion/phase celebration copy ignore language preference (0–19% reduction). These are the highest-stakes decision moments. (`index.html:788–845`, `396–426`, `1002–1017`)
- **P1 — BIL-2**: El Laboratorio (Five Questions training) and start-here tutorial are EN-primary with no language-mode support; the app's core AI-literacy pedagogy is English-gated for a Spanish-default product. (`index.html:600–785`, `start-here.html`)
- **P1 — BIL-3**: ~324 hardcoded " · " joins in ui.js + 39 " / " joins in data.js bypass the toggle; four incompatible bilingual encodings coexist (spans, ·-joins, /-joins, `{es,en}` objects). No single source of truth.
- **P1 — BIL-4**: `t(gentle, direct)` conflates tone with language; Direct-tone strings are EN-only (`ui.js:294, 497–515`).
- **P1 — BIL-5**: Chat bilingual filtering is heuristic (`wrapBilingualHtml`, `ui.js:2754`); correctness depends on string shape and a hand-rolled English-word regex.
- **P1 — BIL-6**: data.js stage `desc` EN-only / `translang` ES-only / `followups` always-both — stage-instruction surfaces are mode-inconsistent by construction.
- **P2 — BIL-7**: Terminology drift (Stage-10 triple name, Etapa/Paso, *revisión* collision, "Toolkit" untranslated).
- **P2 — BIL-8**: Mani asset cards ES text is an abridgment, not a translation (`index.html:497–555`).

---

## 2. Visual system

### 2.1 Tokens (genuinely good)

`styles.css:1–95` defines a real token layer: theme-aware palette (light + `[data-theme="dark"]`), an **8-step type scale** (`--text-micro` 0.70rem → `--text-subtitle` 0.95rem, consolidated in "Visual Polish 2 M1"), 4 radii, 5 shadows (modal shadow reserved for the modal layer, M2), a documented **two-family focus-ring grammar** (amber = act, jade = coach/system, rose = destructive, M6), and 3 transition speeds. Token adoption is high but not complete: 401 of 489 `font-size:` declarations use scale vars (≈82%); 231 of 269 `border-radius:` use radius vars (≈86%). Display sizes ≥1rem and chips are deliberately literal.

### 2.2 Component proliferation (the debt)

- **65 distinct `*btn*` classes** in styles.css (≈60 actual button styles after removing containers): `save-btn, continue-btn, footer-btn, etb-btn, lab-next-btn, mani-proceed-btn, capstone-*-btn ×6, report-action-btn, pn-modal-btn, stage-preview-btn, reflect-btn, rna-btn, tic-btn, vp-route-btn, council-decision-btn…` Nearly every feature sprint shipped its own button family instead of variants of a base.
- **~16 modal/overlay families**: 10 static overlays (`STATIC_OVERLAY_IDS`, `ui.js:94–105`) + dynamic `toolkit-modal-bg` (reused by toolkit/help/revision-gate/full-review), `eval-modal-bg` (eval + reflect), `welcome-bg`, plus **two overlays styled entirely with inline `cssText`** — `projectSelector` (`ui.js:5030`) and `maniCelebration` (`ui.js:5313`) — which also lack `role="dialog"`.
- **36 `*card*` classes** (modal cards + guide-card, research-card, eval-card, voice-polish-card, transfer cards…).
- Inline styles: **90 `style="` attributes in index.html**, **123 style/cssText manipulations in ui.js** — a parallel un-themed styling channel (several hardcode colors like `rgba(42,33,28,0.78)` that don't invert in dark mode).
- **Primary vs secondary action clarity is locally good** (amber gradient primary vs bordered tertiary in the draft footer; danger zone isolated in report modal per F1) but globally inconsistent: at least 5 different "primary" treatments (grad-amber `save-btn`, solid `continue-btn--ready`, `save-ceremony-btn primary`, `pn-modal-btn primary`, `report-action-btn primary`).
- **Status messaging: ≥8 coexisting patterns** — `autosave-status(+saved/error)`, `etb-status` + separate `etb-status-live` live region, `chat-status`, `system-note` with dedup/archival `collapsed-sys`, `saved-notice`, `vault-status`, `capstone-evidence-status`, `phase-toast`. Each has its own placement, color, and lifetime; a student cannot build one mental model of "where the app talks to me."
- Empty/error states exist and are styled (`vault-empty` `ui.js:444`, setup banner `index.html:15`, `offline-fallback-btn`, `copilot-fallback`), but the setup banner is a raw hardcoded-bilingual `<div>` unlike any other status pattern.

**Findings:**
- **P1 — VIS-1**: ~60 button styles / ~16 modal patterns / 36 card classes; no base-component + variant system. This is why every sprint's fixes (44px targets, focus rings, dark mode) must be re-applied per family — several families got missed (see §3).
- **P2 — VIS-2**: Two fully inline-styled overlays (`ui.js:5030, 5313`) sit outside tokens, dark theme, and the dialog a11y contract.
- **P2 — VIS-3**: 213 inline style attributes/manipulations across index.html/ui.js bypass the token system.
- **P3 — VIS-4**: Residual literal font sizes (0.55–0.65rem chips) below the documented scale floor.

### 2.3 Contrast (computed, WCAG 2.1)

| Pair (usage) | Ratio | Verdict |
|---|---|---|
| Light `--text-primary` #2A211C on `--bg-base` | 14.0 | AA/AAA |
| Light `--text-sub` on panel | 6.1 | AA |
| **Light `--text-muted` #9E9086 on `--bg-base` #F5F1EB** | **2.75** | **FAIL** (2.92 on panel; 3.09 on white) |
| **Light `--amber-text` #D4722A on `--bg-base`** | **2.99** | **FAIL** (3.17 on panel = large-only) |
| Light `--sky` #6C9ECF on panel | 2.67 | FAIL |
| Light jade-text / success-text on panel | 3.2 / 3.15 | large-only |
| Light white on `--amber` #B85C1A (primary btns) | 4.58 | AA (but gradient midpoint #D4722A ≈3.1) |
| Dark `--text-muted` #6A6050 on `--bg-raised` | **2.49** | **FAIL** (3.08 on base) |
| **Dark white on `--amber` #D4823A (primary btns: Save/Continue use `--grad-amber` + #fff)** | **2.98** | **FAIL** |

Why this matters more here than usual: `--text-muted` appears **109 times**, and the bilingual "quiet twin" convention explicitly demotes the **English half of the copy to `--text-muted`** (`styles.css:6519–6523`, plus dozens of inline `color:var(--text-muted)` on `lang="en"` spans). The design system literally renders one language below AA contrast. `--amber-text` (68 uses) styles the 0.62rem uppercase journey phase labels — small text at 2.99.

**Findings:**
- **P1 — VIS-5**: `--text-muted` fails AA on every light background and on dark raised surfaces; it is the assigned color of English text in bilingual mode and of most hints/microcopy.
- **P1 — VIS-6**: Dark-mode primary buttons (white on amber gradient) fail AA at 2.98; Save/Continue are the two most important controls in the app.
- **P2 — VIS-7**: `--amber-text` on base fails at small sizes (phase labels, stage numbers); `--sky` fails everywhere it's used as text.

---

## 3. Accessibility

### 3.1 What's genuinely strong

Skip link (`index.html:12`); real landmarks (header / 2 labeled navs / main / labeled tab-panels); 7 aria-live regions in index.html incl. dedicated `etb-status-live` assertive channel; `setOverlayOpen()` keeps `inert` + `aria-hidden` synced with visual state on all 10 static overlays and restores focus on close (`ui.js:108–142`); a global Tab trap + Escape hierarchy for static dialogs (`ui.js:3575–3640` — deliberate policy choices like "stage preview can't be Escaped"); full-review modal has its own correct trap (`ui.js:4016–4042`); stuck-triage menu has `role="menu"`, arrow-key navigation and focus return (`ui.js:6559–6678`); reduced-motion is taken seriously (**22 `prefers-reduced-motion` blocks**); focus-visible styling is systematic (77 `:focus-visible` rules; the 9 `outline: none` occurrences are paired with `:focus-visible` replacements); iOS zoom prevented via 16px inputs; TTS read-aloud buttons with `es-US` voice preference.

### 3.2 Gaps

- **A11Y-1 (P1) — Focus-trap coverage stops at the static overlays.** `getOpenStaticDialog()` (`ui.js:3575–3590`) checks only the 9 static IDs. Dynamic dialogs get `role="dialog" aria-modal="true"` but **no Tab containment**: `toolkitModal` (`ui.js:8460`), `helpModal` (`ui.js:8594`), `evalModal` (`ui.js:6038`), `reflectModal` (`ui.js:5762`), `revisionCompletionGate` (`ui.js:7797`), council offer/report cards, `projectSelector` (`ui.js:5030`, also **no role at all**), `landingMoment` welcome (`ui.js:5124`), `maniCelebration` (`ui.js:5313`, no role). Tab walks into the inert-looking background; `aria-modal` on the overlay simultaneously tells SRs the background is unavailable — worst of both.
- **A11Y-2 (P1) — Journey map is mouse-only.** Rendered check: **10 `.stage-node` elements, 0 tabbable, role=null** (`buildMap`, `ui.js:1746–1789` — click + mouseenter on plain divs). Keyboard/SR users cannot navigate stages on desktop; the mobile `<select>` alternative only renders ≤480px. Tooltips are hover-only (`showTip`, `ui.js:2288`).
- **A11Y-3 (P1) — Bilingual aria-labels defeat the language preference for SR users.** **61 aria-labels in index.html + ~47 in ui.js** are hardcoded "ES · EN" (e.g. `index.html:143 "Deshacer · Undo"`). `setLang` flips `<html lang>`, so in ES mode every control name is read twice with the English half in a Spanish voice (and vice-versa). Inline `lang` attributes exist on only ~39 spans total across both files — the exception, not the rule.
- **A11Y-4 (P2) — Touch/click targets below 44px** (measured at 375×667): `phaseToastClose` 20×24 (worst); modal close ✕ buttons 27–33px (`pn-modal-close`, `completion-close`, `capstone-modal-close`); `previewBackBtn` height 24; `report-close` 30h; edit-toolbar buttons 30px wide (44 tall — borderline acceptable); `calmPathToggle` and `bug-report-btn` 38×38. Deliberate 44px work exists (≈40 rules incl. the mobile lang `<select>` at 49×44) but the close-button class was missed across four modal families.
- **A11Y-5 (P2) — `chatMessages` is one big `aria-live="polite"` region** (`index.html:373`) that also receives injected interactive panels (follow-ups, reflect buttons, eval bars) — long coach responses replayed in full, and live-region announcements of UI the user hasn't reached. The separate `system-note` role=status items nested inside a live region double-announce.
- **A11Y-6 (P2) — `.mani-asset` claim cards** are `tabindex="0" role="button"` divs; `claimAsset(this)` is click-bound with a `handleManiKey` keydown added (`ui.js:5299`) — verified present, but Enter/Space handling exists only while the mani overlay is open; the pattern is bespoke rather than `<button>`.
- **A11Y-7 (P3) — `title`-attribute-only affordances** (journey circle "Puerta de autoría", edit toolbar shortcuts) are invisible to touch and SR users; `bug-report-btn` uses `aria-disabled` with an onclick that still fires.

---

## 4. Responsive

### 4.1 Strategy (coherent, 3-tier)

- **≤768px**: workspace goes from 2 columns to stacked rows `58% / 42%` draft/chat (`styles.css:6778`); 44px tap-target overrides; 16px chat input (no iOS zoom); header decrowding (M3 ghost icons).
- **≤640px**: task bar compresses; **English half of task instruction dropped by default** (`styles.css:5405–5407`) with a `data-lang="both"` restore (`6498–6500`).
- **≤480px**: tab interface — journey map hidden entirely, `mobile-tabs` (Borrador / Tu Pana, both 44px, bottom-placed for thumb reach) switch panels; mobile stage `<select>` + Toolkit button row; lang switcher → 44px `<select>`; brand shortens to "Tu Pana"; welcome sheet becomes bottom-sheet with `svh` + `safe-area-inset-bottom`; draft cue moves below textarea to avoid placeholder overlap; marquee neutralized to 2-line clamp (`6831–6845`).
- Also: 720/430/375px tweak tiers; `overflow-x:hidden` guards + verified **no horizontal scroll at 375px**; `-webkit-fill-available` for iOS chrome collapse; `interface_polish_test.mjs` and `stuck_menu_reachability_test.mjs` exercise some of this.

Rendered at 375×667 (post-onboarding, warning dismissed): header 65 + progress 55 + task bar 51 + toolbar 53 = **224px of chrome; draft textarea gets 257px** (~38% of viewport) before the virtual keyboard. With the keyboard up (~260px on iOS) the writing surface is ≈100px — about 4 lines. No `visualViewport` handling exists (grep: only decorative `scrollIntoView` calls), so the fixed bottom `mobile-tabs` and the 42%-chat split don't adapt while typing.

### 4.2 Mobile findings

- **RES-1 (P1, confirmed rendered bug)** — **EN-mode phones have an empty task bar.** At ≤640px the base CSS hides `.ctb-en` (`styles.css:5407`); `html[data-lang="en"]` hides `.ctb-es` with `!important` (`6481`) but the EN-mode rule (`6483–6487`) sets only color/size/weight — **never restores `display`**. Measured at 375px: task instruction = `""` in EN mode (vs full text in ES and both). English-preferring phone users lose the "what do I do now" line entirely — on the ADHD-critical orientation surface.
- **RES-2 (P1)** — No virtual-keyboard strategy: no `visualViewport` listener, no `interactive-widget` viewport-meta, chat panel fixed at 42% row. Typing in chat on a phone leaves a few lines of visible conversation; typing in the draft leaves ~100px of text visible.
- **RES-3 (P1)** — Stage navigation on phones depends on a native `<select>` that is **hidden until the student opens "Ver ruta"** (`.mobile-stage-nav{display:none}` → shown only under `.path-details-open`, `styles.css:8019–8020`): two taps and prior knowledge to reach any stage; the journey map itself is display:none at ≤480.
- **RES-4 (P2)** — Bilingual "both" mode on phones re-inflates everything the mobile tiers trimmed (`6498` restores `ctb-en`), producing the marquee/clamp behavior; measured mobile body text 1,005 words (both) vs 889 (es) with overlays present.
- **RES-5 (P2)** — `notifyMobileChat` badge (`ui.js:280–287`) is the only signal a coach reply arrived while on the Draft tab; it's a dot with no live-region announcement (SR users on mobile get nothing).
- **RES-6 (P3)** — `dev-preview-bar` (`index.html:1037`) still renders in production layouts, consuming bottom space on phones.

---

## 5. Structural vs surface, prioritized

**Structural (change the model, not the pixels):**
1. **BIL-3/BIL-1** — adopt ONE bilingual string representation (`{es,en}` resolved at render), migrate the ~324 ui.js joins + 6 static modals + data.js fields; celebration/confirm modals first (they're the worst offenders at the highest-stakes moments).
2. **BIL-2** — language-mode support for El Laboratorio + start-here (the pedagogy is currently English-gated).
3. **RES-1** — one-line CSS fix (`html[data-lang="en"] .ctb-en{display:inline!important}` in the ≤640 block) — ship immediately.
4. **A11Y-1/A11Y-2** — extend the existing trap to dynamic dialogs (they already share `toolkit-modal-bg`/`eval-modal-bg` classes — trap on class, not ID list); make stage nodes buttons.
5. **VIS-5/VIS-6** — retune `--text-muted` (≈#7A6C60 passes 4.5 on bg-base) and dark `--amber`/white pairing; this fixes ~109+68 usages including the "quiet English" convention, no per-component work.
6. **RES-2** — visualViewport-aware bottom UI.

**Surface polish (real but not blocking):** button/modal/card consolidation (VIS-1..3), close-button target sizes (A11Y-4), terminology table (BIL-7), live-region hygiene (A11Y-5), dev bar removal (RES-6).

**What to protect (working well, don't regress):** the token + focus-ring + reduced-motion system, `setOverlayOpen` inert discipline, the ES-default with AI-language mirroring, the stacked quiet-twin bilingual grammar (fix its contrast, keep its shape), the ≤480 tab layout and 44px sweep, and the existing bilingual regression tests.
