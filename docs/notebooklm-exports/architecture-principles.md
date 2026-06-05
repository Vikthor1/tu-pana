---
Last updated: 2026-06-05
Status: Updated for Session 64 / Pilot-ready state
Source: docs/decisions/architecture-principles.md (canonical), docs/notebooklm-exports/architecture-packet.md, pedagogy-packet.md
Upload-safe: YES
Note: This document records durable principles for future decisions — not a changelog. For current state, see architecture-packet.md and session-digest.md.
Next review: after pilot completion or any substantive change to pedagogy, mobile architecture, or privacy model
---

# Tu Pana de Escritura — Architecture Principles

These are commitments that must survive every future change. Not preferences — constraints with real consequences. When a patch proposal conflicts with a principle here, the principle wins unless an explicit superseding decision is made and logged in `docs/decisions/`.

---

## 1. Core Product Principle

Tu Pana de Escritura is a bilingual/translingual writing companion for multilingual students at Hostos Community College. Its purpose is to support student authorship and reflective writing development — not to generate student text. Every design decision should be evaluated against this purpose first.

The app's full official name is **Tu Pana de Escritura**. On mobile, the visible short-form brand is **Tu Pana** — an intentional design decision, not truncation. Screen readers and desktop displays always show the full name.

---

## 2. Pedagogical Architecture Principles

**AI asks; the student writes.** The AI coach's role is to surface thinking through questions, challenges, and structured frameworks. It never writes for the student. This is not a technical limitation — it is the core pedagogical commitment.

**Student voice is protected by design.** The Five Questions revision protocol asks students to judge AI advice, not accept it. The Voice Vault lets students mark language as off-limits for AI modification. The Evaluar bar renders after every coach response so students can evaluate before using.

**Freirean/dialogic onboarding is not decoration.** The Tu Conocimiento and El Laboratorio onboarding modules establish the relational and epistemic contract before any writing begins. Tu Conocimiento asserts that student knowledge — cultural, lived, linguistic, community — is legitimate scholarly material. El Laboratorio establishes the dialogic learning contract: Tu Pana asks, the student thinks. These modules are not skippable for first-time users.

**"Tu Conocimiento" is the epistemic starting point.** The app begins with students claiming their own knowledge assets, not a blank page. This is structural, not cosmetic — it positions the student as an intellectual agent before the AI coach appears.

**The staged writing process is the learning architecture.** The 10-stage scaffold (Anécdota → Capstone) is not a progress bar — it is the pedagogy. Stage sequencing, stage entry messages, and the stage transition guidance sequence (coach spotlight → import card → editor spotlight) are all part of the learning design.

**Stage 6 is the authorship gate.** Students must save an unassisted first draft before revision features unlock. This gate has academic integrity and IRB implications and must not be weakened, bypassed, or removed without explicit pedagogical review.

**Evaluation should strengthen authorship, not automate judgment.** The Five Questions criteria (Accuracy, Voice, Specificity, Thinking, Cultural Knowledge) ask students to exercise judgment. Any future evaluation feature must be designed around student agency, not AI scoring.

---

## 3. Language and Translingual Principles

**Spanish-default, not Spanish-only.** The app is Spanish-first by design — Spanish is the first option in all language displays, the default language mode, and the language of onboarding audio. English and bilingual/Spanglish (ES-EN) modes are fully supported as legitimate student pathways, not secondary options.

**Language choice should be visible and low-friction.** The language selector (ES / EN / BI) is always accessible. On mobile, it is a compact native dropdown that preserves all three modes. Hiding or reducing language options to save space is not acceptable.

**Code-switching is a rhetorical resource.** The bilingual/Spanglish (BI) mode treats mixed-language writing as legitimate expression, not error. The Voice Vault protects student-authored phrases including Spanish and Spanglish from AI modification. No feature may be designed that implicitly pressures students toward English.

**UI language should reduce shame.** Stage entry messages, coach responses, and system text should welcome students into the writing process, not frame errors or inadequacy. The Stage 8 Voice Polish stage is organized around protecting, not correcting, student voice.

---

## 4. Mobile-First UX Principles

**Mobile is a primary use case, not a fallback.** Hostos students are phone-primary. The app must be fully usable on a phone without any desktop accommodations. Any new feature must be designed for ≤480px first.

**The mobile header should prioritize brand clarity and usable controls.** The header contains the brand name, language selector, and utility buttons (Help, Bug Report). Clutter in the mobile header directly reduces usability. The current layout reclaimed ~70px of horizontal space by switching the language control to a native select at ≤480px — this was the right trade.

**"Tu Pana" is the intentional mobile short-form brand.** The full name "Tu Pana de Escritura" (~150px at 1rem) does not fit the mobile header alongside other necessary controls. "Tu Pana" is the colloquial name students and instructors already use. The `aria-label="Tu Pana de Escritura"` on the heading element preserves the full accessible name. Any change to header markup must preserve both the `.h1-short` / `.h1-full` pattern and the aria-label.

**Stage orientation on mobile comes from the current-task-bar.** The mobile tab bar and current-task-bar provide stage context. The banner subtitle is not the primary orientation source on mobile. Redundant stage text in the header adds clutter without adding information.

**Targeted changes over global redesign.** Mobile layout issues should be fixed at the affected breakpoint with the minimum necessary CSS. Changes should not cascade into desktop layouts unless desktop also has a problem. CSS-only fixes are preferred when no logic change is needed.

---

## 5. Accessibility Principles

**Reduced motion must be respected.** Any animation (including the header branding icon) must include a `prefers-reduced-motion` rule that disables or reduces the animation. No exceptions.

**Decorative SVGs and icons should be hidden from screen readers.** SVGs that are purely decorative should carry `aria-hidden="true"`. Icons that substitute for text labels (e.g., the mobile bug-report emoji) must have accessible alternatives preserved through `aria-label` on the parent control.

**Full accessible names must be preserved when visual text is shortened.** When the mobile title shows "Tu Pana," the `<h1>` carries `aria-label="Tu Pana de Escritura"`. This pattern applies to any future case where visual text is abbreviated for layout reasons.

**Native controls are preferred when they reduce risk and improve accessibility.** The native `<select>` element for mobile language selection was chosen specifically because it is OS-accessible, keyboard-navigable, and screen-reader-compatible without additional code. Custom dropdowns introduce new accessibility surfaces to maintain.

**Focus states and tap targets matter.** Minimum tap target size for interactive elements is 36px (height). Focus-visible styles must remain visible. These are non-negotiable for a student population that may include users with motor or visual accessibility needs.

---

## 6. Technical Architecture Principles

**No build step.** Files are served as-is. No Webpack, Vite, Rollup, or compiler of any kind. This keeps deployment trivial (any static host, including GitHub Pages) and debugging direct.

**No frameworks.** Vanilla JavaScript and CSS only. No React, Vue, Svelte, Alpine, or component library. Readable without framework knowledge; no dependency churn.

**No ES modules (`type="module"`).** All scripts are classic globals. Module scoping would break the load-order dependency pattern and require a bundler for production.

**Script load order is fixed.** `config → data → genre-template → prompts → ai-provider → storage → ui → app`. Each file depends on globals from files before it. New scripts must respect this order.

**localStorage key names are permanent.** Renaming any `tupana_*` key silently erases existing student sessions. Add new keys as needed; never rename or remove existing keys while students may have active sessions.

**Configuration is separate from behavior.** `config.js` holds connection settings and the bug-report URL. Provider routing, UI behavior, and prompts do not belong in `config.js`. `CONFIG.bugReportUrl` is the single activation point for the bug-report feature — do not hard-code form URLs elsewhere.

**Offline-first design.** All 10 stages must work fully without any AI connection. Offline mode is the designed default, not a fallback. Any future feature must degrade gracefully when offline.

**No new runtime dependencies without explicit justification.** The app is dependency-free at runtime. Adding any runtime dependency requires explicit justification reviewed against pedagogical constraints and the no-build-step principle.

**Prefer CSS-only fixes for visual/layout issues.** When a layout or mobile issue can be resolved with CSS, do not introduce JavaScript. The iOS Safari chat scroll fix (Patch 22) and the mobile language selector (compact native select) are examples of the right approach.

**Static GitHub Pages deployment is the production environment for the pilot.** Changes are deployed by pushing to `main`. No CI pipeline, no deployment gate. The commit log is the release history.

---

## 7. Privacy and Data-Minimization Principles

**Collect only what is needed.** The app stores student work locally in `localStorage`. No data is transmitted to any server except coach messages to the Gemini proxy. The proxy receives only the structured coaching prompt — not raw student text unless the student has chosen to share it for coaching.

**Survey codes are anonymous and student-distributed.** Pilot participants use TPN-NNN codes pre-filled via unique form URLs. No names, student IDs, or email addresses are collected in survey data. The instructor-held roster mapping codes to students is kept separately and is never included in research data.

**localStorage is local.** Student data does not sync to any cloud service, is not accessible to instructors through the app, and cannot be retrieved by the institution. Instructors see only what students explicitly export or copy. This should be communicated clearly in the privacy note during onboarding.

**Bug-report context must remain minimal and non-identifying.** The only parameters sent to the bug-report form are: stage number, stage name (English), language setting, provider/mode, and timestamp. No student writing, chat content, draft text, names, emails, or IDs. Future enhancements to bug-report context must stay within these bounds.

**No API keys or secrets in public-facing code or exports.** The Gemini API key lives only in the Cloudflare Worker as a secret. It must never appear in `config.js`, `index.html`, or any committed file. This principle applies to all future external service integrations.

**Changes should be auditable and reversible.** The commit log is the audit trail. Patches that suppress features (e.g., Ollama hidden for pilot) must be documented as reversible suppressions, not permanent removals.

---

## 8. Pilot-Readiness Principles

**Pilot reliability matters more than feature expansion.** Once the pilot begins, no new patches should be opened unless they address a confirmed blocking issue. Feature requests and enhancements are post-pilot decisions.

**Student-facing confusion must be addressed before adding features.** The pre-pilot UX assessment (session 54) identified 14 friction points; 5 were patched before the pilot. Any future iteration cycle should begin with the same kind of assessment before adding new surface area.

**Bug reporting should be visible but not intrusive.** The 🐞 button is in the header, accessible at all times, but small enough not to dominate the interface. The mobile emoji-only display is the right balance.

**Survey instruments must reflect the actual current app experience.** Questions about language choice (D3), step-by-step structure (D2), and authorship (D1, E3) are calibrated to what students actually experienced in Tu Pana. If the app changes substantively before the pilot, the survey should be reviewed for continued alignment.

**NotebookLM exports should remain curated, not raw.** The export packet is a derived summary layer. Raw source code, internal session logs, student data, and speculative ideas do not belong in NotebookLM sources.

---

## 9. Decision Rule for Future Patches

Before opening a new patch, apply this checklist:

1. **Does it protect student authorship?** No patch may weaken the Stage 6 gate, allow AI to generate student text, or reduce student control over their own writing.
2. **Does it reduce friction for Hostos students?** Changes should make the app easier to use for phone-primary, multilingual, first-generation students — not more complex.
3. **Does it preserve bilingual/translingual flexibility?** All three language modes (ES / EN / BI) must remain available and low-friction after the change.
4. **Does it improve mobile usability without adding clutter?** Mobile header space is a scarce resource. Any addition must be justified against the space it costs.
5. **Is it reversible?** Prefer suppressions over removals for pilot-scoped changes. Document the reversal path in `docs/decisions/`.
6. **Does it avoid collecting unnecessary data?** No new storage keys or data transmission without explicit review of privacy implications.
7. **Is it necessary for the pilot?** Post-pilot ideas belong in the backlog. During the pilot window, only blocking issues justify new patches.

---

*Canonical source: `docs/decisions/architecture-principles.md` — consult that file for the implementation-level technical constraints. This export expands the canonical with pedagogical, mobile, accessibility, language, privacy, and pilot principles for NotebookLM orientation use.*
