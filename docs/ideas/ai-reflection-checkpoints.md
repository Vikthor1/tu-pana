# Future Feature Revision — Redesign Coach Evaluation as Strategic AI Reflection Checkpoints

*Recorded 2026-05-13.*

---

## Purpose

Tu Pana de Escritura's Gemini coach is currently performing very well. It is staying within the app's authorship, research, multilingual voice, and process-writing guardrails. This is a major success. However, this success changes the purpose of the student evaluation layer.

If the coach is consistently behaving responsibly, it is no longer appropriate to ask students to repeatedly evaluate the coach's output as if the system is constantly dangerous or unreliable. That would create unnecessary friction, interrupt writing flow, and possibly turn critical AI literacy into a repetitive compliance task.

The stronger recommendation is to redesign the current "evaluate the coach" feature into a smaller number of **strategic AI reflection checkpoints**.

---

## Core Recommendation

Do not keep frequent coach-output evaluation as a recurring quality-control task.

Instead, implement a strategic **"Pause and Reflect" / "Question the Coach"** model that appears only at selected moments in the writing process.

The purpose should shift from:

> "Evaluate every coach response."

to:

> "Pause at key moments to decide whether the coach helped you think, revise, protect your voice, and remain the author."

---

## Rationale

Because Gemini's guardrails are working well, the app should preserve student trust in the coach while still teaching students that AI advice must pass through their own judgment. The goal is not to make students suspicious of every response. The goal is to help them develop **metacognitive control** over how they use AI during writing.

This fits Tu Pana's larger pedagogy:

- The student writes first.
- The AI responds second.
- The AI helps the student think but does not replace the student's thinking.
- The student remains the author.
- The student decides which advice to accept, question, revise, or reject.
- Multilingual voice and cultural knowledge remain protected.
- Research advice must be verified rather than accepted blindly.

---

## Why the Current Evaluation Model Should Change

A frequent evaluation layer may have been useful while testing the coach's guardrails. But once the guardrails are working well, asking students to evaluate too often can become pedagogically inefficient.

**Problems with frequent evaluation:**

- Interrupts the student's writing flow
- Makes the app feel like a survey tool
- Distracts from drafting and revision
- Makes critical AI literacy feel repetitive rather than intellectually meaningful
- Trains students to click through evaluation prompts without real reflection
- Focuses students too much on judging the tool rather than developing judgment as writers

The evaluation layer should therefore become **less frequent, more intentional, and more directly tied to writing decisions**.

---

## Recommended Feature Name

**Preferred:** Pause and Reflect / Pausa y reflexiona

Other options:
- Question the Coach / Cuestiona al coach
- AI Reflection Check / Pausa crítica de IA
- Did the Coach Help You Think?
- Critical AI Moment / Momento crítico de IA

---

## Best Implementation Direction

Replace frequent coach-output evaluation with **three required reflection checkpoints** plus one optional checkpoint.

| Stage | Checkpoint | Status |
|-------|-----------|--------|
| 4. Research | Research Reflection | Required |
| 7. Revision | Revision Reflection | Optional |
| 8. Voice Polish | Voice Reflection | Required |
| 10. Mi Cierre de Proceso | Final AI Use Reflection | Required |

---

## Checkpoint Details

### Stage 4 — Research Reflection (Required)

**Purpose:** Help students evaluate whether AI research guidance is responsible.

**Prompt:**

> Before using research advice from an AI coach, pause and ask: Did the coach help me search and verify sources, or did it act as if sources do not need to be checked?

**Student reflection question:**

> Did the coach invent sources, or did it help you think about where and how to search?

**Answer options:**
- The coach suggested search terms or databases.
- The coach reminded me to verify sources.
- The coach gave me citations I still need to check.
- The coach seemed too confident about sources.
- I am not sure how to verify the research yet.

---

### Stage 7 — Revision Reflection (Optional)

**Purpose:** Help students distinguish between useful revision guidance and authorship replacement.

**Prompt:**

> Before accepting revision advice, pause and ask: Is the coach helping me make my own choices, or is it taking over the writing?

**Student reflection question:**

> Did the coach help you revise your own paragraph, or did it start writing for you?

**Answer options:**
- It helped me notice what I could improve.
- It asked useful questions.
- It gave me strategies without replacing my paragraph.
- It started to sound like it was rewriting for me.
- I need to decide which advice fits my voice.

*Note: Trigger this checkpoint only after major paragraph-level feedback, not after every exchange.*

---

### Stage 8 — Voice Reflection (Required)

**Purpose:** Help students evaluate whether AI advice protects multilingual voice, cultural knowledge, and rhetorical intention.

**Prompt:**

> Before polishing your language, pause and ask: Did the coach protect your voice, or did it push your writing toward sounding generic?

**Student reflection question:**

> Did the coach help clarify your writing while preserving your voice?

**Answer options:**
- It helped me make my meaning clearer.
- It respected my Spanish, Spanglish, or family language.
- It did not treat my voice as a mistake.
- It made the writing sound too generic.
- It suggested removing language that matters to me.

---

### Stage 10 — Final AI Use Reflection (Required)

**Purpose:** Make AI evaluation part of the student's process reflection rather than a repeated pop-up.

**Prompt:**

> Think about one moment when you accepted, questioned, or rejected the coach's advice. What did you decide, and why?

**Student response frame:**

> One piece of advice I accepted was…
> One piece of advice I questioned was…
> One piece of advice I rejected or changed was…
> I made that decision because…

*This is the most important AI literacy reflection because it asks the student to narrate their own agency.*

---

## Recommended Frequency

**Required:**
- Stage 4: one research reflection
- Stage 8: one voice reflection
- Stage 10: one final AI-use reflection

**Optional:**
- Stage 7: one revision reflection after significant paragraph-level feedback
- Small "Reflect" button available after any coach response, but never required

**Avoid:**
- Mandatory evaluation after every coach response
- Repeated pop-ups after every message
- Long evaluation forms
- Ratings that feel disconnected from writing
- Generic "Was this helpful?" feedback as the main critical literacy mechanism

---

## Recommended UI Change

Replace the current frequent evaluation button with a lighter system:

1. After selected coach responses, show a small **reflection card**.
2. The card should have a short title, one question, and a few answer choices.
3. The card should also allow a short written reflection when appropriate.
4. The student should be able to return immediately to writing.
5. The reflection should be saved as part of the process record when useful.
6. The app should not interrupt every exchange.

**UI copy:**

> **Pause and Reflect**
> Before you use this advice, ask: Did it help you think like the author of your own essay?

> **Pausa y reflexiona**
> Antes de usar este consejo, pregúntate: ¿me ayudó a pensar como autor/a de mi propio ensayo?

**Button labels:**

| English | Spanish |
|---------|---------|
| Reflect | Pausa crítica |
| Save reflection | Guardar reflexión |
| Return to writing | Volver a escribir |
| Continue writing | Continuar escribiendo |
| Skip for now | Saltar por ahora |

---

## Pedagogical Principle

The critical AI literacy layer should **support writing, not compete with it**.

Students should not feel that they are constantly evaluating the software. Instead, they should learn to evaluate the relationship between AI advice and their own writing decisions.

The key question is not:

> Was the coach good or bad?

The better question is:

> What did I do with the coach's advice as a writer?

This keeps the student's agency at the center.

---

## Literature and Citation Notes

The following sources support this redesign. Citations should be verified before use in grant or award materials.

**Metacognition in writing instruction**

Boston University's Writing Program describes metacognition as essential to writing instruction because it helps students activate prior knowledge, apply strategies during writing and research, reflect on strengths and challenges, and understand differences across genres, disciplines, and courses. This supports designing reflection as a writing strategy rather than a quality-control mechanism.

> Boston University Writing Program, "Metacognition in the Writing Classroom."
> Source to verify: https://www.bu.edu/teaching-writing/resources-for-teaching-writing/guides-tips/metacognition-in-the-writing-classroom/

The Johns Hopkins Writing Program frames writing for metacognition as encouraging "thinking about thinking," citing Kimberly Tanner's "Promoting Student Metacognition" and Kathleen Blake Yancey's *Reflection in the Writing Classroom*.

> Johns Hopkins University Writing Program, "Writing for Metacognition: Encouraging thinking about thinking."
> Source to verify: https://krieger.jhu.edu/writing-program/writing-in-the-majors/teaching-writing/writing-for-metacognition/

**Critical AI literacy frameworks**

The University of Virginia's Fostering AI Literacy guide identifies critical evaluation of AI outputs as a core competency: students should review and evaluate AI-generated results for accuracy, relevance, bias, and quality. This supports keeping some AI-output evaluation — as purposeful learning activity rather than constant interruption.

> University of Virginia Pressbooks, "Critical Evaluation of AI Outputs – Fostering AI Literacy: A Guide for Educators in Higher Education."
> Source to verify: https://pressbooks.library.virginia.edu/ai-literacy/chapter/critical-evaluation-of-ai-outputs/

The Open University's 2025 Critical AI Literacy Framework defines AI literacy as including the ability to critically evaluate AI technologies, communicate and collaborate effectively with AI, and use AI safely and effectively to support learning. This supports Tu Pana's shift from tool-rating to reflective AI collaboration.

> The Open University, "Critical AI Literacy Framework 2025."
> Source to verify: https://www.open.ac.uk/blogs/learning-design/wp-content/uploads/2025/01/OU-Critical-AI-Literacy-framework-2025-external-sharing.pdf

A 2025 scoping review by Veldhuis and colleagues proposes opportunities for critical AI literacies through learning activities, inclusive perspectives, and pragmatic curriculum integration. This supports integrating critical reflection into learning activities rather than treating AI literacy as an abstract add-on.

> Veldhuis et al., "Critical Artificial Intelligence literacy: A scoping review and framework synthesis." *International Journal of Child-Computer Interaction*, 2025.
> Source to verify: https://www.sciencedirect.com/science/article/pii/S2212868924000771

**Desirable difficulties**

Bjork and Bjork argue that learning can improve when students encounter well-designed challenges that require effortful processing. For Tu Pana, this means occasional reflective pauses are useful, while constant evaluation prompts may become undesirable friction.

> Bjork, E. L., & Bjork, R. A. "Creating Desirable Difficulties to Enhance Learning."
> Source to verify: https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf

---

## Implementation Rule

> Do not keep the current frequent coach-output evaluation system as the default.

Replace it with strategic AI reflection checkpoints at Stage 4, Stage 8, and Stage 10, with an optional Stage 7 revision reflection. Keep a small optional "Reflect" button available after coach responses, but do not require students to evaluate every response.

This preserves critical AI literacy while protecting the writing process.

---

## Future Claude Implementation Prompt

*Use this when ready to implement the redesign.*

---

**BEGIN CLAUDE PROMPT**

Implement a redesign of Tu Pana's coach-output evaluation layer.

Do not make students evaluate every coach response. Replace frequent coach evaluation with strategic AI reflection checkpoints. Required checkpoints should appear at:
- Stage 4 — Research
- Stage 8 — Voice Polish
- Stage 10 — Mi cierre de proceso

An optional Stage 7 revision reflection may appear after major paragraph-level feedback.

The goal is to help students ask whether the coach helped them think, revise, verify evidence, preserve voice, and remain the author.

Keep a small optional Reflect button after coach responses, but do not make evaluation mandatory after every response.

Rename the feature from "Evaluate the coach" to **Pause and Reflect / Pausa y reflexiona** or **Question the Coach / Cuestiona al coach**.

Preserve all authorship, voice, research, and process-writing guardrails. Do not redesign the app broadly. Do not add long surveys. Do not interrupt writing flow unnecessarily.

Store reflections in the process record only where useful, especially Stage 10.

**END CLAUDE PROMPT**
