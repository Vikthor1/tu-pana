# Tu Pana de Escritura: Future Strategy for Mi Toolkit · My Writing Toolkit

*Merged strategy document. Recorded 2026-05-13. Supersedes `mi-toolkit-writing-panel.md`.*

---

## Purpose of this document

This document maps a staged strategy for adding a future "My Toolkit / Mi Toolkit" feature to Tu Pana de Escritura. The feature would allow students to revisit the intellectual assets they claimed during onboarding and eventually see the writing and revision skills they are acquiring as they move through the app.

**The central strategic decision:**

> Do not build the full feature immediately.

The concept is pedagogically strong, but the app is currently close to being shareable with a small group of trusted testers. The immediate priority should be stabilization, bug fixing, mobile usability, and coherence of the existing onboarding, Laboratorio, stage navigation, and AI coach flows. The Toolkit feature should remain on the roadmap, beginning later with a tiny read-only implementation and expanding only after the core experience has been tested.

---

## Pedagogical Rationale

The Toolkit feature aligns deeply with the philosophy of Tu Pana de Escritura. The app is not built around the idea that students enter the writing process empty-handed. It is built around the idea that students bring intellectual, linguistic, cultural, familial, and experiential resources into academic writing.

The Toolkit would make this visible.

It would reinforce three key pedagogical principles:

1. **Students bring knowledge before the app or AI provides feedback.** The onboarding assets — language, community knowledge, journey, positionality, and story — are not decorative. They are epistemic resources.
2. **Writing is a process of learning by doing.** Students do not simply complete stages. They practice transferable writing moves: turning memory into scene, connecting experience to larger forces, revising without surrendering voice, and reflecting with evidence.
3. **The AI coach is not the author.** A visible Toolkit reinforces that authorship belongs to the student. The app and AI coach support the process, but the student's memory, voice, judgment, and knowledge remain central.

The feature should avoid a generic "badge" system. It should feel like a living writing toolkit, not a gamified reward board.

The underlying message:

> You are not entering the writing process empty-handed. You bring memory, language, community knowledge, lived experience, and interpretive power. As you move through the stages, you are also developing transferable writing skills.

This framing resists deficit models of writing instruction. Academic writing is not about replacing a student's voice with institutional language. It is about learning how to make their knowledge legible, persuasive, and self-directed.

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

### Why this matters

Recent development has shown that small UI changes can create secondary issues: buttons blocked by pseudo-elements, overlays appearing at the wrong time, full-screen moments where popups were expected, opacity applied to the wrong parent container, mobile navigation gaps, and visual hierarchy problems in El Laboratorio. These are normal development issues, but they suggest that the current priority should be stabilization rather than expansion.

### Stabilization checklist

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

### Recommended testing before Toolkit work

Run a full first-user smoke test from clean localStorage:

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

### Why this is the right first implementation

This version provides immediate pedagogical value while remaining technically low-risk. It only reads existing data (`tupana_mani_claimed`, `tupana_mani_sentence`) and does not add new storage keys, alter stage progression, change Gemini/Ollama/Offline behavior, or affect the AI coach.

### Feature name

**Recommended:** Mi Toolkit · My Writing Toolkit

Alternative names:
- Mis recursos · My Assets
- My Assets & Skills
- Mi caja de herramientas
- My Writing Toolkit

*"Mi Toolkit · My Writing Toolkit" feels accessible, bilingual, and practical. It avoids the overly academic feel of "skills portfolio" while conveying that students are carrying tools into the writing process.*

---

### Phase 1 UX Placement

**Desktop**

Place a small button near the journey/stage navigation area. The journey map answers: "Where am I in the writing process?" The Toolkit answers: "What am I bringing and building as I move?"

Good desktop placements:
- Near the journey map header
- Near the current-task-bar / stage title
- As a small persistent button beside the stage navigation area

Avoid placing it inside the chat — the Toolkit is not an AI feature. It is a student self-knowledge/process feature.

**Mobile**

Place a compact button near the mobile stage dropdown:

```
Stage 4 · Research ▼
Mi Toolkit
```

The Toolkit should open as a bottom sheet covering ~70–85% of screen height. It should not occupy permanent screen space.

---

### Phase 1 Panel Structure

**Section 1: What I Bring / Lo que traigo**

Display the assets claimed during onboarding as compact cards or chips.

| Asset | English | Spanish |
|-------|---------|---------|
| languages | Language | Lengua |
| community | Community Knowledge | Conocimiento comunitario |
| journey | Journey | Trayectoria |
| positionality | Positionality | Posicionalidad |
| story | Story | Historia |

Each item should display:
- Icon
- Bilingual label
- Short one-line explanation
- Claimed state

**Section 2: My Knowledge Claim / Mi afirmación de conocimiento**

Display the student's sentence from `tupana_mani_sentence`.

Label options:
- *My starting knowledge claim*
- *Mi punto de partida · My starting point*

Example display:

> "I know how my grandmother's kitchen taught me where migration, memory, and survival meet."

If the sentence is missing, show:

> Your knowledge claim will appear here after onboarding.

**Section 3: Skills Preview Placeholder**

Do not implement dynamic skills yet. Show only:

> Skills you practice will appear here as you move through the writing stages.

or:

> As you move through the stages, this space will show the writing moves you are learning by doing.

This reserves the conceptual space without requiring new logic.

---

### Phase 1 Implementation Scope

**Files likely touched:**
- `index.html`
- `assets/js/ui.js`
- `assets/css/styles.css`

**Data used (existing keys only):**
- `tupana_mani_claimed`
- `tupana_mani_sentence`
- `MANI_ASSET_DEFS` (existing constant)

**New storage keys:** None.

**Technical behavior:**
- Add Toolkit button
- Add Toolkit panel/drawer/bottom sheet
- Read claimed assets from localStorage
- Render asset list from existing `MANI_ASSET_DEFS`
- Read student's sentence from `tupana_mani_sentence`
- Include placeholder skills section
- Close button returns student to current screen
- No stage logic changes

**Commit message:**
```
ui: add writing toolkit panel for claimed assets
```

---

## Phase 2: Mobile Polish for Toolkit

### Purpose

Refine the Toolkit after the read-only version has been tested. The first version should prove the panel works; mobile polish comes after observing real behavior.

### Mobile design

Use a bottom sheet:
- Button near mobile stage dropdown
- Bottom sheet slides or appears from bottom
- Max height ~75–85% of viewport
- Internal scroll
- Close button at top
- No horizontal overflow
- Touch targets large enough
- Section headings clear

### Desktop design

Use either:
- Right-side drawer (best if it does not interfere with the chat)
- Centered modal panel
- Compact overlay near stage navigation

### Accessibility

- Real `<button>` for opening Toolkit
- Real `<button>` for closing Toolkit
- Clear `<h2>` heading inside panel
- `aria-labelledby` if modal/drawer pattern is used
- Escape-to-close optional but useful
- Reduced-motion support if animated
- Do not trap focus unless implemented correctly
- Screen readers should identify the asset list and knowledge sentence

For screen readers, skills should be announced as:

> Skill acquired: I can connect my experience to a larger social, cultural, or historical force.

**Commit message:**
```
ui: polish writing toolkit mobile panel
```

---

## Phase 3: Static Skill Definitions

### Purpose

Define the writing and revision skills students are acquiring across the app, without yet implementing dynamic tracking. This is a conceptual and pedagogical patch as much as a technical one.

### Skill map

| Stage | Skill ID | Skill Acquired | Student-Facing (EN) | Student-Facing (ES) |
|-------|----------|---------------|--------------------|--------------------|
| 1. Anecdote | `memory_to_scene` | Turning memory into scene | I can turn a memory into a focused scene. | Puedo convertir un recuerdo en una escena concreta. |
| 2. Connection | `experience_to_force` | Linking personal experience to larger forces | I can connect my experience to a larger social, cultural, or historical force. | Puedo conectar mi experiencia con una fuerza social, cultural o histórica más amplia. |
| 3. Topic Pitch | `naming_tension` | Naming a tension or question | I can name the tension that makes my story worth thinking about. | Puedo nombrar la tensión que hace que mi historia merezca ser pensada. |
| 4. Research | `research_with_authorship` | Searching without surrendering authorship | I can use research to deepen my thinking without letting sources replace my voice. | Puedo usar la investigación para profundizar mi pensamiento sin dejar que las fuentes reemplacen mi voz. |
| 5. Outline | `organizing_argument` | Organizing an argument | I can organize my ideas before drafting. | Puedo organizar mis ideas antes de redactar. |
| 6. First Draft | `author_owned_draft` | Producing an author-owned draft | I can write a first draft that belongs to me. | Puedo escribir un primer borrador que me pertenece. |
| 7. Revision | `critical_feedback_use` | Using feedback critically | I can use feedback without giving up control of my writing. | Puedo usar retroalimentación sin perder el control de mi escritura. |
| 8. Voice Polish | `protecting_voice` | Protecting voice and language | I can revise for clarity while protecting my voice, rhythm, and language. | Puedo revisar para lograr claridad mientras protejo mi voz, mi ritmo y mi lengua. |
| 9. Checklist | `self_evaluation` | Evaluating readiness | I can check my work using my own judgment. | Puedo revisar mi trabajo usando mi propio criterio. |
| 10. Reflection | `process_reflection_evidence` | Reflecting with evidence | I can explain my writing process using evidence from what I did. | Puedo explicar mi proceso de escritura usando evidencia de lo que hice. |

### Technical implementation

Add a constant `STAGE_SKILL_DEFS`. Each skill should have:

```js
STAGE_SKILL_DEFS = {
  memory_to_scene: {
    skillId: 'memory_to_scene',
    stageId: 'stage.anecdote',
    stageNumber: 1,
    skillNameEn: 'Turning memory into scene',
    skillNameEs: 'Convertir recuerdo en escena',
    labelEn: 'I can turn a memory into a focused scene.',
    labelEs: 'Puedo convertir un recuerdo en una escena concreta.'
  },
  // ...
}
```

At this phase the Toolkit still shows the skills section as placeholder. Skills are defined but not yet unlocked.

**Commit message:**
```
ui: add static writing skill definitions
```

---

## Phase 4: Dynamic Skill Unlocking

### Purpose

Allow the Toolkit to show skills as students move through stages.

### Timing

Do not implement until:
- Read-only Toolkit works
- Mobile Toolkit is stable
- Static skill definitions are reviewed
- Small tester feedback confirms the Toolkit is useful

### Storage key

Add one new key: `tupana_skills_acquired`

**Recommended storage — simple array first:**

```json
["memory_to_scene", "experience_to_force", "naming_tension"]
```

**Fuller structure if timestamps are needed later:**

```json
[
  {
    "stageId": "stage.anecdote",
    "stageNum": 1,
    "skillId": "memory_to_scene",
    "timestamp": "2026-05-12T14:23:00.000Z"
  }
]
```

Do not store long text redundantly in localStorage. Store IDs and render labels from `STAGE_SKILL_DEFS`.

### Unlocking logic

Best recommendation: use **stage entry for most skills**, but use **meaningful gates where they already exist**.

| Stage | Unlock trigger |
|-------|---------------|
| 1–5 | On first entry to stage |
| 6 | Only after `executeSave()` — draft saved |
| 7–9 | On first entry to stage |
| 10 | When reflection panel is opened or completed |

### Technical caution

This patch touches stage logic — it is higher risk than the read-only panel. Keep it narrow:
- Add skill storage helper
- Hook into existing `goToStage()` or equivalent
- Avoid altering gates
- Avoid changing current stage behavior

**Commit message:**
```
feat: track acquired writing skills by stage
```

---

## Phase 5: "New Skill Acquired" Micro-Message

### Purpose

Make the student aware of the skill they are practicing without turning the app into a game.

### Language

Avoid: "Achievement unlocked!", "Badge earned!", "Level up!"

Prefer:
- New writing move practiced
- New skill acquired
- You practiced a writing move

Example bilingual notification:

> New skill acquired · Nueva habilidad
> You connected personal experience to a larger force.
> Conectaste tu experiencia con una fuerza más amplia.

### UX behavior

- Brief non-blocking toast
- Appears only once per skill
- Does not interrupt writing
- Does not compete with Gemini chat
- Respects `prefers-reduced-motion`
- Visible enough to register, not flashy

### Technical behavior

- When new skill ID is added to `tupana_skills_acquired`, trigger a small notification
- Do not trigger on reload for already-acquired skills
- Add the skill to Toolkit display immediately

**Commit message:**
```
ui: show new writing skill notification
```

---

## Phase 6: Stage 10 Reflection Integration

### Purpose

Use the Toolkit to strengthen the final reflection without letting the AI write the reflection for the student.

### Student-facing integration

In Stage 10, show a reminder:

> You began this process by naming what you bring. Look at your Toolkit before writing your final reflection.

Then display:
- Claimed assets
- Knowledge claim sentence
- Acquired skills

Possible reflection prompts:
- Which asset helped you most as you wrote this essay?
- Which writing skill did you practice most?
- What evidence from your process shows that?

### AI guardrail

The AI coach can ask:
- Which skill helped you most?
- Where do you see evidence of that skill?
- Which asset shaped your argument?

The AI **must not** write:
- The student's final reflection
- A paragraph for the student
- A ready-to-submit self-assessment

### Technical integration

The Stage 10 coach context can include a compact summary of claimed assets, knowledge sentence, and acquired skill IDs. Keep it short to avoid prompt bloat.

**Commit message:**
```
ui: connect writing toolkit to Stage 10 reflection
```

---

## Full Feature Roadmap

| Version | What it adds | New storage keys |
|---------|-------------|-----------------|
| 0 — Stabilize | No Toolkit. Fix bugs, test with trusted users. | None |
| 1 — Read-only Toolkit | Button, panel, claimed assets, knowledge sentence, placeholder skills. | None |
| 2 — Mobile polish | Refined bottom sheet, scrolling, close behavior, accessibility. | None |
| 3 — Static skills | `STAGE_SKILL_DEFS` constant, student-facing language. No unlock logic. | None |
| 4 — Dynamic skills | `tupana_skills_acquired`, unlock by stage, display in Toolkit. | `tupana_skills_acquired` |
| 5 — Micro-message | Small notification when skill first acquired. | None |
| 6 — Stage 10 integration | Toolkit evidence in final reflection support; AI prompts only, not author. | None |

---

## Development Complexity

**Overall complexity:** Medium — pedagogically rich, technically safe if divided into small patches.

| Phase | Complexity | Risk |
|-------|-----------|------|
| Read-only Toolkit | Low–Medium | Low |
| Mobile polish | Low–Medium | Medium |
| Static skill map | Low | Low |
| Dynamic skill tracking | Medium | Medium |
| New skill notification | Medium | Medium |
| Stage 10 integration | Medium | Medium–High |

### Main technical risks

| Risk | Mitigation |
|------|-----------|
| Mobile clutter | Button/drawer only — no permanent panel |
| Stage logic bugs | Dynamic tracking must not interfere with existing gates |
| Over-gamification | Use "skills practiced" or "writing moves," not badges or rewards |
| Storage complexity | Store IDs only, not duplicated text |
| Prompt bloat | Keep assets/skills summary compact if sent to Gemini |
| Distraction from core writing | Toolkit supports writing; it should not become another task |
| Pedagogical flattening | Keep connection to language, memory, community, positionality, and lived knowledge explicit |
| False progress | Use "practiced" or "started building," not "mastered" |

---

## Recommended Near-Term Strategy

**Do now:**
- Finish stabilizing existing flows
- Conduct trusted testing
- Record friction points
- Keep Toolkit idea in Obsidian/project memory

**Do next, after testing:**
Build Version 1 — read-only Toolkit. This is the best first version because it gives students a place to review what they claimed without adding stage-tracking complexity.

**Do later:**
Add dynamic skills only after the Toolkit has proven useful and the app's main flow is stable.

---

## Recommended First Implementation Prompt

*Use this only after the current app feels stable enough for another feature patch.*

---

**BEGIN CLAUDE PROMPT**

**Title:** Add Read-Only Writing Toolkit Panel for Claimed Assets

Use Dr. Torres-Vélez's token-saving workflow: inspect only the files/functions needed, make one narrow patch, no opportunistic edits, run checks, commit only if browser verification passes.

**Current goal:**
Add the smallest first version of Mi Toolkit · My Writing Toolkit.

This version should only show:
1. The assets the student claimed during onboarding.
2. The student's one-sentence knowledge claim.
3. A placeholder section saying skills will appear as the student moves through the writing stages.

Do not add dynamic skill tracking yet.
Do not add new localStorage keys.
Do not add skill notifications.
Do not alter stage logic.
Do not alter Gemini/Ollama/Offline.
Do not touch the Cloudflare Worker.
Do not change stage guardrails.

**Likely files:**
- `index.html`
- `assets/js/ui.js`
- `assets/css/styles.css`

**Use existing data:**
- `tupana_mani_claimed`
- `tupana_mani_sentence`
- `MANI_ASSET_DEFS`

**Expected behavior:**
- Add a small button labeled Mi Toolkit · My Writing Toolkit.
- On desktop, open a small drawer or modal panel.
- On mobile, the same panel should behave like a compact bottom sheet or responsive modal.
- The panel should show claimed assets. Each asset should display: icon, bilingual label, short one-line explanation, and claimed state.
- The panel should show the student's sentence if available.
- If no assets are claimed yet, show a gentle empty state.
- The skills section should be placeholder only: "Skills you practice will appear here as you move through the stages."
- The panel should close cleanly and return the student to the current stage.

**Verification:**
- Run selection-to-coach regression (18 tests).
- Run secret exposure check.
- Browser-test desktop and mobile.
- Confirm no provider behavior changes.
- Confirm no new storage keys.

**Commit message:**
```
ui: add writing toolkit panel for claimed assets
```

**END CLAUDE PROMPT**

---

## Final Strategic Recommendation

The Toolkit is worth building, but not all at once.

1. Stabilize first.
2. Test with a few trusted users.
3. Add read-only Toolkit.
4. Observe whether students use it.
5. Then add acquired skills.
6. Only later connect it to Stage 10 reflection.

This protects the app from feature creep while preserving the pedagogical power of the idea.
