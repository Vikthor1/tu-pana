# Mi Toolkit · My Writing Toolkit — Feature Proposal

*Recommendation from Dr. Torres-Vélez. Recorded 2026-05-13.*

---

The best implementation is a persistent, lightweight "My Toolkit" panel that students can open at any point, especially on mobile, without disrupting the stage workflow or the chat. Avoid making this feel like a game badge system. It should feel more like a living writer's notebook: "Here is what I brought; here is what I am learning by doing."

---

## Recommendation

Build the feature as **Mi Toolkit · My Writing Toolkit** with two main sections:

1. **What I Bring / Lo que traigo** — The five intellectual assets claimed during onboarding.
2. **What I'm Learning / Lo que estoy aprendiendo** — Skills unlocked as the student moves through stages.

This framing is stronger than "badges" because it keeps the emphasis on intellectual growth, authorship, and process rather than gamification.

---

## 1. UX Placement

### Desktop

Place a small button near the journey/stage navigation area: **Mi Toolkit · My Writing Toolkit**

It should sit close to the existing journey map because it complements navigation. The journey map answers: "Where am I in the writing process?" The toolkit answers: "What am I carrying and developing as I move?"

Good desktop placements:
- Near the journey map header
- Near the mobile stage navigator equivalent
- As a small persistent button beside the stage title/current task bar

Avoid placing it inside the chat — the toolkit is not an AI feature. It is a student self-knowledge/process feature.

### Mobile

Use a bottom sheet or slide-up drawer.

On mobile, the toolkit should open from a compact button:

> Toolkit

or

> Mi Toolkit

This button could sit near the mobile stage dropdown. It should not occupy vertical space all the time. A bottom sheet works well because students can quickly open it, review, and close it without losing their place.

---

## 2. Interaction Model

**Best pattern:**
- Desktop: side drawer or compact modal panel
- Mobile: bottom sheet

A drawer/bottom sheet feels more like a reference panel than an interruption. Students may want to check their toolkit while staying oriented in the writing stage.

**Recommended behavior:**
- Button: **Mi Toolkit · My Writing Toolkit**
- Opens panel
- Panel has two tabs or stacked sections:
  - Assets I Bring
  - Skills I'm Building
- Close button returns student to current stage
- No AI call
- No backend
- Reads from localStorage and stage state

---

## 3. Information Architecture

### Section 1: What I Bring

Show claimed onboarding assets as compact cards/chips:

| Asset | Label |
|-------|-------|
| Language | Lengua |
| Community Knowledge | Conocimiento comunitario |
| Journey | Trayectoria |
| Perspective | Perspectiva |
| Story | Historia |

Each item can show:
- Icon
- Bilingual label
- Short one-line explanation
- Claimed state

Also show the student's sentence from `tupana_mani_sentence`:

> My starting knowledge claim: "…"

This is pedagogically important because the student did not merely click five assets — they named knowledge in their own words.

### Section 2: What I'm Learning

Show stage-based skill entries that appear progressively as the student enters or completes stages.

Avoid "achievement unlocked" language unless very subtle. Use:
- "New skill acquired"
- "New writing move practiced"

This keeps the feature aligned with learning rather than gamification.

---

## 4–5. Skill Mapping and Stage Alignment

One skill mapped to each of the ten stages. Language should be concise, affirming, and tied to process.

| Stage | Skill Acquired | Student-Facing Language |
|-------|---------------|------------------------|
| 1. Anecdote | Turning memory into scene | I can turn a memory into a focused scene. |
| 2. Connection | Linking personal experience to larger forces | I can connect my experience to a larger social, cultural, or historical force. |
| 3. Topic Pitch | Naming a tension or question | I can name the tension that makes my story worth thinking about. |
| 4. Research | Searching without surrendering authorship | I can use research to deepen my thinking without letting sources replace my voice. |
| 5. Outline | Organizing an argument | I can organize my ideas before drafting. |
| 6. First Draft | Producing an author-owned draft | I can write a first draft that belongs to me. |
| 7. Revision | Using feedback critically | I can use feedback without giving up control of my writing. |
| 8. Voice Polish | Protecting voice and language | I can revise for clarity while protecting my voice, rhythm, and language. |
| 9. Checklist | Evaluating readiness | I can check my work using my own judgment. |
| 10. Reflection | Reflecting with evidence | I can explain my writing process using evidence from what I did. |

For a more bilingual interface, each skill could include Spanish underneath:

> I can protect my voice while revising.
> Puedo proteger mi voz mientras reviso.

Keep the default compact to avoid crowding.

---

## 6. Pedagogical Framing

This feature should make explicit that Tu Pana is not "teaching students from zero." It is helping them recognize and use what they already bring.

The underlying message:

> You are not entering the writing process empty-handed. You bring memory, language, community knowledge, lived experience, and interpretive power. As you move through the stages, you are also developing transferable writing skills.

That framing matters because it resists deficit models of writing instruction. It tells students that academic writing is not about replacing their voice with institutional language. It is about learning how to make their knowledge legible, persuasive, and self-directed.

This also reinforces the app's AI guardrails: the AI coach is not the author. The student is the author. The toolkit visually documents that authorship.

---

## 7. Mobile-First Design

Top of stage area:

```
Stage 4 · Research ▼
Mi Toolkit
```

Tapping Mi Toolkit opens a bottom sheet covering ~70–85% of screen height. Should be scrollable with a clear close button.

**Mobile bottom sheet structure:**

```
Mi Toolkit · My Writing Toolkit

What I Bring
  · Language
  · Community Knowledge
  · Journey
  · Perspective
  · Story

My Knowledge Claim
  · Student's sentence

What I'm Learning
  · Stage 1 skill
  · Stage 2 skill
  · Current/new skill highlighted
```

Should not stay open by default. It is a reference space students access when needed.

---

## 8. Data / Storage

Keep it simple.

**Existing keys used:**
- `tupana_mani_claimed`
- `tupana_mani_sentence`
- `tupana_stage`
- `tupana_process_log`

**Add only one new key:** `tupana_skills_acquired`

**Recommended structure (simple array first):**

```json
["memory_to_scene", "experience_to_force", "research_with_authorship"]
```

The app maps IDs to labels from a constant in JavaScript:

```js
SKILL_DEFS = { memory_to_scene: {...}, experience_to_force: {...} }
```

The fuller structure (if timestamps are needed later):

```json
[
  {
    "stageId": "stage.anecdote",
    "stageNum": 1,
    "skillId": "memory_to_scene",
    "timestamp": "2026-05-12T..."
  }
]
```

Do not store long text redundantly in localStorage. Store IDs and render labels from code.

---

## 9. Accessibility

Key requirements:
- Toolkit button must be a real `<button>`
- Bottom sheet/drawer must have a clear heading
- Close button must be keyboard accessible
- Use `aria-labelledby` if implemented as a modal/drawer
- Do not rely on color alone to indicate acquired skills
- Use clear labels: "Acquired" / "Practiced"
- Respect `prefers-reduced-motion`
- Touch targets large enough on mobile
- Keep scrolling inside the panel predictable
- Avoid auto-opening the toolkit repeatedly

For screen readers, announce skills as:

> Skill acquired: I can connect my experience to a larger social, cultural, or historical force.

---

## 10. Implementation Sequence

### Patch 1: Read-only toolkit panel
Add the button and panel. Show claimed assets and the student's knowledge sentence. No skill tracking yet.

*Why first:* Uses existing localStorage keys. Low risk. Establishes the UI container.

### Patch 2: Add static skill definitions
Add a `SKILL_DEFS` constant mapped to stages. Display: "Skills will appear here as you move through the stages." No unlock logic yet.

### Patch 3: Unlock skills on stage entry
When the student first enters a stage, add the corresponding skill ID to `tupana_skills_acquired`.

### Patch 4: Show "New skill acquired" micro-message
Add a small non-blocking notification when a skill is first acquired.

### Patch 5: Integrate with Stage 10
In Stage 10, show the student's claimed assets and acquired skills as reflection support. Do not let the AI write the reflection — use them as prompts.

### Patch 6: Polish mobile UX
Adjust bottom sheet height, scrolling, touch targets, and visual density after real testing.

---

## 11. Risks and Tradeoffs

| Risk | Mitigation |
|------|-----------|
| Clutter | Use a button/drawer, not a permanent panel |
| Over-gamification | Use "skills practiced" or "writing moves" instead of "rewards" |
| Storage complexity | Store skill IDs only, not full text |
| Mobile crowding | Compact button + bottom sheet; no persistent bar |
| False progress | Use "practiced" or "started building," not "mastered" |
| Pedagogical flattening | Keep connection to language, memory, community, positionality, and lived knowledge explicit |

---

## 12. Recommended First Patch

The smallest best first patch:

> Add a read-only "Mi Toolkit · My Writing Toolkit" button and panel that shows the assets already claimed and the student's knowledge sentence.

**Why this first:**
- Uses existing data
- Does not require new localStorage keys
- Does not affect stage logic
- Gives students an immediate review space
- Establishes the UI container where skills can later appear

**First patch scope:**
- Add toolkit button
- Add drawer/bottom sheet panel
- Read from `tupana_mani_claimed`
- Read from `tupana_mani_sentence`
- Render claimed assets from existing `MANI_ASSET_DEFS`
- Add placeholder section: "Skills will appear here as you move through the stages."
- No skill unlock logic yet

**Commit message:**
```
ui: add writing toolkit panel for claimed assets
```

That is the safest and most pedagogically coherent starting point.
