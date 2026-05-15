---
type: idea
project: tu-pana-de-escritura
status: phases-4-5-complete
created: 2026-05-12
tags:
  - tu-pana
  - toolkit
  - writing-process
  - features
  - roadmap
  - pedagogy
  - authorship
  - onboarding
  - student-assets
  - obsidian
---

# Tu Pana de Escritura: Future Strategy for "My Toolkit" Assets and Skills Feature

## Purpose of This Document

This document maps a staged strategy for adding a future **"My Toolkit / Mi Toolkit"** feature to *Tu Pana de Escritura*. The feature would allow students to revisit the intellectual assets they claimed during onboarding and eventually see the writing and revision skills they are acquiring as they move through the app.

The central strategic decision is this:

> **Do not build the full feature immediately.**

The concept is pedagogically strong, but the app is currently close to being shareable with a small group of trusted testers. The immediate priority should be stabilization, bug fixing, mobile usability, and coherence of the existing onboarding, Laboratorio, stage navigation, and AI coach flows. The Toolkit feature should remain on the roadmap, beginning later with a tiny read-only implementation and expanding only after the core experience has been tested.

---

## Pedagogical Rationale

The Toolkit feature aligns deeply with the philosophy of *Tu Pana de Escritura*. The app is not built around the idea that students enter the writing process empty-handed. It is built around the idea that students bring intellectual, linguistic, cultural, familial, and experiential resources into academic writing.

The Toolkit would make this visible.

It would reinforce three key pedagogical principles:

1. **Students bring knowledge before the app or AI provides feedback.**
   The onboarding assets — language, community knowledge, journey, positionality, and story — are not decorative. They are epistemic resources.

2. **Writing is a process of learning by doing.**
   Students do not simply complete stages. They practice transferable writing moves: turning memory into scene, connecting experience to larger forces, revising without surrendering voice, and reflecting with evidence.

3. **The AI coach is not the author.**
   A visible Toolkit reinforces that authorship belongs to the student. The app and AI coach support the process, but the student's memory, voice, judgment, and knowledge remain central.

The feature should avoid a generic "badge" system. It should feel like a living writing toolkit, not a gamified reward board.

---

## Strategic Recommendation

The feature should be developed in three broad phases:

1. Stabilization before new feature work
2. Tiny read-only Toolkit implementation
3. Full Toolkit with acquired skills, stage integration, and reflection support

The full version should not be built until after a small trusted testing round.

---

## Phase 0: Stabilize Before Building the Toolkit

### Goal

Before adding a new conceptual layer, the existing app should feel stable, coherent, and usable across desktop and mobile.

### Why This Matters

Recent development has shown that small UI changes can create secondary issues:

- buttons blocked by pseudo-elements
- overlays appearing at the wrong time
- full-screen moments where popups were expected
- opacity applied to the wrong parent container
- mobile navigation gaps
- visual hierarchy problems in El Laboratorio

These are normal development issues, but they suggest that the current priority should be stabilization rather than expansion.

### Stabilization Checklist

Before building even the tiny Toolkit, confirm:

- [ ] Onboarding first welcome message behaves correctly
- [ ] Asset claiming works one asset at a time
- [ ] In-card asset celebrations work
- [ ] "Next asset" button works reliably
- [ ] One-sentence gate works
- [ ] Post-sentence celebration requires manual dismissal
- [ ] El Laboratorio shows one question at a time
- [ ] El Laboratorio feedback is visually spotlighted
- [ ] Mobile stage navigator works
- [ ] Chat focus cue after onboarding works smoothly
- [ ] Gemini coach responds reliably
- [ ] Stage guardrails remain intact
- [ ] Selection-to-Coach regression passes
- [ ] No API keys are exposed
- [ ] Mobile layout has no major friction

### Recommended Testing Before Toolkit Work

Run a full first-user smoke test from clean `localStorage`:

1. First welcome message
2. Tu Conocimiento asset claiming
3. Sentence gate
4. Celebration
5. El Laboratorio
6. Main app entry
7. Chat focus cue
8. Stage navigation
9. Gemini chat
10. Selection-to-Coach
11. Mobile stage navigator

Then share with 2–3 trusted testers before adding new conceptual features.

---

## Phase 1: Tiny Read-Only Toolkit

### Purpose

Create the smallest possible version of the Toolkit without introducing new stage logic, new skill tracking, or new storage complexity.

### Why This Is the Right First Implementation

This version would provide immediate pedagogical value while remaining technically low-risk. It would only read existing data:

- `tupana_mani_claimed`
- `tupana_mani_sentence`

It would not add new storage keys, alter stage progression, change Gemini/Ollama/Offline behavior, or affect the AI coach.

### Feature Name

**Recommended:** `Mi Toolkit · My Writing Toolkit`

Alternative names considered:

- Mis recursos · My Assets
- My Assets & Skills
- Mi caja de herramientas
- My Writing Toolkit

`Mi Toolkit · My Writing Toolkit` feels accessible, bilingual, and practical. It avoids the overly academic feel of "skills portfolio" while still conveying that students are carrying tools into the writing process.

### Phase 1 User Experience

The Toolkit opens from a small button.

**Desktop placement:** Near the journey/stage navigation area or current-stage header.

The journey map answers: *Where am I in the writing process?*
The Toolkit answers: *What am I bringing and building as I move?*

**Mobile placement:** A compact button near the mobile stage dropdown. On mobile, the Toolkit should open as a bottom sheet or modal panel — not permanent screen space.

### Phase 1 Panel Structure

**Section 1: What I Bring / Lo que traigo**

Display the assets claimed during onboarding. Each item as a compact card or chip with icon, bilingual name, short description, and claimed state.

Possible asset labels:

- Language / Lengua
- Community Knowledge / Conocimiento comunitario
- Journey / Trayectoria
- Positionality / Posicionalidad
- Story / Historia

**Section 2: My Knowledge Claim / Mi afirmación de conocimiento**

Display the student's sentence from `tupana_mani_sentence`.

Label: `Mi punto de partida · My starting point`

Example display:
> "I know how my grandmother's kitchen taught me where migration, memory, and survival meet."

If the sentence is missing, show:
> *Your knowledge claim will appear here after onboarding.*

**Section 3: Skills Preview Placeholder**

Do not implement dynamic skills yet. Include only:
> *Skills you practice will appear here as you move through the writing stages.*

This reserves the conceptual space without requiring new logic.

### Phase 1 Implementation Scope

**Files likely touched:** `index.html`, `assets/js/ui.js`, `assets/css/styles.css`

**Data used:** Existing keys only — `tupana_mani_claimed`, `tupana_mani_sentence`

**New storage keys:** None.

**Technical behavior:**

- Add Toolkit button
- Add Toolkit panel / drawer / bottom sheet
- Read claimed assets from `localStorage`
- Render asset list from existing `MANI_ASSET_DEFS`
- Read student's sentence from `tupana_mani_sentence`
- Include placeholder skills section
- Close button returns student to current screen
- No stage logic changes

**Commit message:** `ui: add writing toolkit panel for claimed assets`

---

## Phase 2: Mobile Polish for Toolkit

### Purpose

Refine the Toolkit after the read-only version exists and has been tested on actual devices.

### Mobile Design

Use a bottom sheet on mobile:

- Button near mobile stage dropdown
- Bottom sheet slides or appears from bottom
- Max height ~75–85% of viewport
- Internal scroll
- Close button at top
- No horizontal overflow
- Touch targets large enough
- Section headings clear

### Desktop Design

Use either a right-side drawer, a centered modal panel, or a compact overlay near stage navigation. A side drawer is best if it does not interfere with the chat.

### Accessibility

- Real `<button>` for opening and closing the Toolkit
- Clear heading
- `aria-labelledby` if modal/drawer pattern is used
- Escape-to-close optional but useful
- Reduced-motion support if animated
- Do not trap focus unless implemented correctly
- Screen readers can identify asset list and knowledge sentence

**Commit message:** `ui: polish writing toolkit mobile panel`

---

## Phase 3: Static Skill Definitions

### Purpose

Define the writing and revision skills students are acquiring across the app, without yet implementing dynamic tracking. This is a conceptual/pedagogical step as much as a technical one.

### Skill Map

| Stage | Skill ID | Student-facing skill (EN) | Student-facing skill (ES) |
|---|---|---|---|
| 1. Anecdote | `memory_to_scene` | I can turn a memory into a focused scene. | Puedo convertir un recuerdo en una escena concreta. |
| 2. Connection | `experience_to_force` | I can connect my experience to a larger social, cultural, or historical force. | Puedo conectar mi experiencia con una fuerza social, cultural o histórica más amplia. |
| 3. Topic Pitch | `naming_tension` | I can name the tension that makes my story worth thinking about. | Puedo nombrar la tensión que hace que mi historia merezca ser pensada. |
| 4. Research | `research_with_authorship` | I can use research to deepen my thinking without letting sources replace my voice. | Puedo usar la investigación para profundizar mi pensamiento sin dejar que las fuentes reemplacen mi voz. |
| 5. Outline | `organizing_argument` | I can organize my ideas before drafting. | Puedo organizar mis ideas antes de redactar. |
| 6. First Draft | `author_owned_draft` | I can write a first draft that belongs to me. | Puedo escribir un primer borrador que me pertenece. |
| 7. Revision | `critical_feedback_use` | I can use feedback without giving up control of my writing. | Puedo usar retroalimentación sin perder el control de mi escritura. |
| 8. Voice Polish | `protecting_voice` | I can revise for clarity while protecting my voice, rhythm, and language. | Puedo revisar para lograr claridad mientras protejo mi voz, mi ritmo y mi lengua. |
| 9. Checklist | `self_evaluation` | I can check my work using my own judgment. | Puedo revisar mi trabajo usando mi propio criterio. |
| 10. Reflection | `process_reflection_evidence` | I can explain my writing process using evidence from what I did. | Puedo explicar mi proceso de escritura usando evidencia de lo que hice. |

### Technical Implementation

Add a constant `STAGE_SKILL_DEFS`. Each skill should have:

```js
{
  skillId,
  stageId,
  stageNumber,
  labelEn,
  labelEs,
  shortEn,
  shortEs
}
```

At this phase, the Toolkit can still show skills as "Coming soon" or "Skills will appear as you move through the stages."

**Commit message:** `ui: add static writing skill definitions`

---

## Phase 4: Dynamic Skill Unlocking

### Purpose

Allow the Toolkit to show skills as students move through the writing stages.

### Timing

Do not implement until:

- read-only Toolkit works
- mobile Toolkit is stable
- static skill definitions are reviewed
- small tester feedback confirms the Toolkit is useful

### Storage Key

Add one new key: `tupana_skills_acquired`

### Recommended Storage Model

```js
["memory_to_scene", "experience_to_force", "naming_tension"]
```

Store IDs only — not duplicated text. The app renders labels from `STAGE_SKILL_DEFS`.

### Unlocking Logic

**Best recommendation:** Use stage entry for most skills, but use meaningful gates where they already exist.

- Stage 1: unlock on entering Stage 1
- Stage 6: unlock only after draft is saved
- Stage 10: unlock when reflection panel is opened or completed

### Technical Caution

This patch touches stage logic and is higher risk. Keep it narrow:

- add skill storage helper
- hook into existing `goToStage()` or equivalent
- avoid altering gates
- avoid changing current stage behavior

**Commit message:** `feat: track acquired writing skills by stage`

---

## Phase 5: "New Skill Acquired" Micro-Message

### Purpose

Make the student aware of the skill they are practicing without turning the app into a game.

### Recommended Language

Avoid: *"Achievement unlocked!" / "Badge earned!" / "Level up!"*

Prefer:

- New writing move practiced
- New skill acquired
- You practiced a writing move
- You are learning by doing

### Example Message

```
New skill acquired · Nueva habilidad
You connected personal experience to a larger force.
Conectaste tu experiencia con una fuerza más amplia.
```

### UX Behavior

- Brief non-blocking toast
- Appears only once per skill
- Does not interrupt writing
- Does not compete with Gemini chat
- Respects reduced-motion
- Visible enough to register, not flashy

### Technical Behavior

- When a new skill ID is added to `tupana_skills_acquired`, trigger a small notification
- Do not trigger on reload for already-acquired skills
- Add the skill to Toolkit immediately

**Commit message:** `ui: show new writing skill notification`

---

## Phase 6: Stage 10 Reflection Integration

### Purpose

Use the Toolkit to strengthen the final reflection without letting the AI write the reflection for the student.

### Why This Matters

Stage 10 asks students to reflect on their process. The Toolkit can provide concrete evidence:

- assets claimed
- knowledge sentence
- skills practiced
- process actions

### Student-Facing Integration

In Stage 10, show a reminder:

> *You began this process by naming what you bring. Look at your Toolkit before writing your final reflection.*

Display: claimed assets, knowledge claim sentence, acquired skills.

Possible reflection prompt:

> Which asset helped you most as you wrote this essay?
> Which writing skill did you practice most?
> What evidence from your process shows that?

### AI Guardrail

Do not let Gemini generate the reflection for the student. The AI coach can ask:

- Which skill helped you most?
- Where do you see evidence of that skill?
- Which asset shaped your argument?

It must **not** write the student's final reflection, generate a paragraph for the student, or produce a ready-to-submit self-assessment.

### Technical Integration

The Stage 10 coach context can include a compact summary of claimed assets, knowledge sentence, and acquired skill IDs. Keep it short to avoid prompt bloat.

**Commit message:** `ui: connect writing toolkit to Stage 10 reflection`

---

## Full Feature Roadmap

| Version | What it adds |
|---|---|
| **0** | No Toolkit yet. Stabilize existing onboarding, fix bugs, test with trusted users. |
| **1** | Toolkit button + panel + claimed assets + knowledge sentence + placeholder skills section. No new storage keys. |
| **2** | Refined mobile bottom sheet, improved scrolling, better close behavior, responsive spacing, accessibility improvements. |
| **3** | Static skill definitions by stage, student-facing bilingual language. No unlocking logic yet. |
| **4** | `tupana_skills_acquired` + unlock skills by stage + display acquired skills in Toolkit. |
| **5** | Small notification when a skill is first acquired. No gamified badge overload. |
| **6** | Toolkit evidence in Stage 10 reflection support. AI coach references assets/skills as prompts, not as text to write. |

---

## Development Complexity

**Overall: Medium.** The concept is pedagogically rich, but the technical implementation can be safe if divided into small patches.

| Phase | Complexity | Risk |
|---|---|---|
| Read-only Toolkit | Low–Medium | Low |
| Mobile polish | Low–Medium | Medium |
| Static skill map | Low | Low |
| Dynamic skill tracking | Medium | Medium |
| New skill notification | Medium | Medium |
| Stage 10 integration | Medium | Medium–High |

### Main Technical Risks

1. **Mobile clutter** — The Toolkit should not become another permanent panel that crowds the screen.
2. **Stage logic bugs** — Dynamic skill tracking must not interfere with existing gates.
3. **Over-gamification** — The feature must not reduce decolonial pedagogy to badges.
4. **Storage complexity** — Store IDs, not duplicated text.
5. **Prompt bloat** — If assets/skills are sent to Gemini, keep the summary compact.
6. **Distraction from core writing** — The Toolkit should support writing, not become another task students must manage.

---

## Recommended Near-Term Strategy

**Do now:**

- Finish stabilizing existing flows
- Conduct trusted testing with 2–3 users
- Record friction points
- Keep Toolkit idea in Obsidian / project memory

**Do next, after testing:**

Build Version 1: Read-only Toolkit. This is the best first version because it gives students a place to review what they claimed without adding stage-tracking complexity.

**Do later:**

Add dynamic skills only after the Toolkit has proven useful and the app's main flow is stable.

---

## Recommended First Implementation Prompt

Use this only after the current app feels stable enough for another feature patch.

```
Title: Add Read-Only Writing Toolkit Panel for Claimed Assets

Use Dr. Torres-Velez's token-saving workflow: inspect only the files/functions needed,
make one narrow patch, no opportunistic edits, run checks, commit only if browser
verification passes.

Current goal:
Add the smallest first version of Mi Toolkit · My Writing Toolkit.

This version should only show:
1. The assets the student claimed during onboarding.
2. The student's one-sentence knowledge claim.
3. A placeholder section saying skills will appear as the student moves through stages.

Do not add dynamic skill tracking yet.
Do not add new localStorage keys.
Do not add skill notifications.
Do not alter stage logic.
Do not alter Gemini/Ollama/Offline behavior.
Do not touch the Cloudflare Worker.
Do not change stage guardrails.

Likely files:
  index.html
  assets/js/ui.js
  assets/css/styles.css

Use existing data:
  tupana_mani_claimed
  tupana_mani_sentence
  MANI_ASSET_DEFS

Expected behavior:
- Add a small button labeled "Mi Toolkit · My Writing Toolkit"
- On desktop, open a small drawer or modal panel
- On mobile, the same panel should behave like a compact bottom sheet or responsive modal
- The panel should show claimed assets
- The panel should show the student's sentence if available
- If no assets are claimed yet, show a gentle empty state
- The skills section should be placeholder only:
  "Skills you practice will appear here as you move through the stages."
- The panel should close cleanly and return the student to the current stage

Verification:
- Run selection-to-coach regression
- Run secret exposure check
- Browser-test desktop and mobile
- Confirm no provider behavior changes
- Confirm no new storage keys

Commit message: ui: add writing toolkit panel for claimed assets
```

---

## Final Strategic Recommendation

The Toolkit is worth building, but not all at once.

1. **Stabilize first.**
2. **Test with a few trusted users.**
3. **Add read-only Toolkit.**
4. **Observe whether students use it.**
5. **Then add acquired skills.**
6. **Only later connect it to Stage 10 reflection.**

This protects the app from feature creep while preserving the pedagogical power of the idea.
