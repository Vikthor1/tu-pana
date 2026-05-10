---
type: idea
project: tu-pana-de-escritura
status: active
created: 2026-05-10
tags:
  - tu-pana
  - genre
  - writing-process
  - templates
  - expansion
  - authorship
  - obsidian
---

# Tu Pana de Escritura: Genre Selection Pathway

## Core Idea

The next major expansion of *Tu Pana de Escritura* should be **genre selectability**.

The current app is built around the mixed-genre autobiographical essay. That should remain the flagship genre because it showcases the app's strongest commitments: student voice, memory, identity, social analysis, authorship protection, and process-based writing.

However, *Tu Pana* can become more useful and reusable if instructors can select from a small library of assignment genres.

The long-term vision:

> *Tu Pana* becomes a configurable writing-process coach organized around **genre**, **assignment purpose**, and **authorship protection**.

---

## Why Genre Selection Matters

Genre selection may be the most immediately useful expansion after stabilizing the current app.

It would allow instructors to use *Tu Pana* for more than one assignment type without turning the app into a generic AI writing assistant.

Instead of being only:

> An app for a mixed-genre autobiographical essay.

It becomes:

> A protected writing-process platform for common classroom genres.

This would increase adoption because instructors usually think in terms of assignments:

- reading response
- film response
- reflection paper
- argumentative essay
- service-learning reflection
- research-based reflection
- oral history reflection
- language autobiography
- portfolio reflection

Genre selection makes the app easier to explain, easier to reuse, and easier to pilot across different courses.

---

## Core Principle

Genre selection should not weaken the app's core pedagogy.

Across every genre, the rule remains:

> The student writes first. The AI responds second.

The app should continue to prevent AI from replacing the student's writing labor.

The AI should not:

- write full paragraphs
- generate introductions
- generate conclusions
- create full outlines
- rewrite entire drafts
- translate complete drafts
- invent sources
- complete self-reflections for students

The AI can:

- ask guiding questions
- help students clarify purpose
- help students notice genre expectations
- identify weak evidence or unclear reasoning
- support paragraph-level revision
- explain patterns
- help students reflect on process
- generate instructor-facing process evidence

---

## Recommended First Genre Library

The first version should not include too many genres. A small set of deeply designed templates is better than a long list of superficial options.

Recommended first genre set:

1. **Mixed-Genre Autobiographical Essay**
2. **Reading Response**
3. **Film / Media Response**
4. **Service-Learning Reflection**
5. **Argumentative Essay**
6. **Research-Based Reflection**

These genres cover a wide range of humanities, composition, ESL/ELL, language-learning, social science, and community college assignments.

---

## Genre Template Logic

Each genre should modify the app in five main areas:

1. Stage names
2. Stage instructions
3. Coach questions
4. Revision criteria
5. Instructor report categories

The underlying workflow remains the same.

The app should not become an open-ended chatbot. It should remain a structured writing-process environment.

---

## Example Genre Pathways

### 1. Mixed-Genre Autobiographical Essay

Purpose:

> Help students connect a personal memory to a broader historical, social, cultural, or political force.

Suggested stages:

1. Find a Memory
2. Build the Social Connection
3. Pitch Your Topic
4. Explore Sources
5. Organize the Essay
6. Write the First Draft
7. Revise with the Five Questions
8. Protect and Polish Your Voice
9. Final Checklist
10. Writing Process Reflection

---

### 2. Reading Response

Purpose:

> Help students move from comprehension to interpretation, response, and connection to course themes.

Suggested stages:

1. Identify the Main Idea
2. Choose a Passage or Claim
3. Explain Your Response
4. Connect to Course Themes
5. Organize Your Response
6. Write the First Draft
7. Revise Summary, Evidence, and Analysis
8. Polish Voice and Clarity
9. Final Checklist
10. Reading and Writing Reflection

---

### 3. Film / Media Response

Purpose:

> Help students analyze a scene, image, dialogue, character, or media technique and connect it to course concepts.

Suggested stages:

1. Choose a Scene or Moment
2. Describe What You Notice
3. Build an Interpretation
4. Connect to Course Concepts
5. Organize Your Response
6. Write the First Draft
7. Revise Evidence and Analysis
8. Polish Voice and Clarity
9. Final Checklist
10. Viewing and Writing Reflection

---

### 4. Service-Learning Reflection

Purpose:

> Help students connect community-based experience to course concepts, civic learning, identity, and structural analysis.

Suggested stages:

1. Describe the Experience
2. Identify a Moment of Learning
3. Connect Experience to Course Concepts
4. Consider Community and Structure
5. Organize the Reflection
6. Write the First Draft
7. Revise Reflection and Analysis
8. Polish Voice and Responsibility
9. Final Checklist
10. Civic Learning Reflection

---

### 5. Argumentative Essay

Purpose:

> Help students develop a claim, support it with evidence, consider stakes, and address counterarguments.

Suggested stages:

1. Identify the Issue
2. Develop a Claim
3. Consider Stakes and Audience
4. Gather Evidence
5. Organize Reasons and Counterarguments
6. Write the First Draft
7. Revise Claim, Evidence, and Reasoning
8. Polish Voice and Academic Clarity
9. Final Checklist
10. Argument Process Reflection

---

### 6. Research-Based Reflection

Purpose:

> Help students connect personal, course-based, or community questions to credible sources and reflective analysis.

Suggested stages:

1. Identify Your Question
2. Explain Why It Matters
3. Explore Sources
4. Connect Evidence to Experience or Course Themes
5. Organize the Reflection
6. Write the First Draft
7. Revise Evidence, Reflection, and Analysis
8. Polish Voice and Clarity
9. Final Checklist
10. Research Process Reflection

---

## Market and Pedagogical Value

Genre selection would make *Tu Pana* more reusable.

A single-genre app may be used once per semester. A genre-selectable app could be used several times in the same course.

This could increase value for:

- individual instructors
- ESL/ELL programs
- Spanish and world-language programs
- writing programs
- community college courses
- service-learning courses
- humanities and social science courses
- AI literacy initiatives

Genre selection also makes the app easier to explain:

> Choose the assignment genre, and *Tu Pana* guides students through a protected writing process without writing the assignment for them.

---

## Relationship to SLL / Multilingual Expansion

Genre selection and SLL expansion should eventually work together.

Future configuration model:

```text
Course Mode:
- ELL / English Academic Writing
- Spanish L2
- Heritage Spanish
- General Writing

Genre:
- Mixed-Genre Autobiographical Essay
- Reading Response
- Film / Media Response
- Service-Learning Reflection
- Argumentative Essay
- Research-Based Reflection

Examples:

  Mode: Heritage Spanish
  Genre: Language Autobiography
  Level: Intermediate / Advanced

  Mode: Spanish L2
  Genre: Film Response
  Level: Intermediate

  Mode: ELL Academic Writing
  Genre: Research-Based Reflection
  Level: First-Year College
```

The long-term structure:

```text
Tu Pana = language mode + genre mode + authorship-protected writing process.
```

---

## Development Pathway

Recommended development order:

1. Stabilize the current mixed-genre autobiographical essay version.
2. Modularize stage names, instructions, prompts, and reports.
3. Create a `genreTemplates` structure.
4. Preserve the current mixed-genre essay as the default template.
5. Add 3–5 additional genre templates.
6. Test genre switching locally.
7. Pilot one or two new genres in real courses.
8. Collect instructor and student feedback.
9. Refine the most useful templates.
10. Later combine genre selection with language-learning modes.

---

## Suggested Technical Structure

Possible future structure:

```text
/templates
  mixedGenreAutobiographicalEssay.js
  readingResponse.js
  filmMediaResponse.js
  serviceLearningReflection.js
  argumentativeEssay.js
  researchBasedReflection.js
```

Each template should include:

```text
templateId
templateName
templateDescription
stageTitles
stageInstructions
coachPrompts
revisionCriteria
checklistItems
reflectionQuestions
instructorReportCategories
```

This will allow new genres to be added without rewriting the whole app.

---

## Key Risk

The biggest risk is making the app too generic.

If *Tu Pana* becomes an open-ended writing chatbot, it loses its strongest identity.

The solution is to keep genre templates structured, limited, and pedagogically intentional.

The app should not ask:

> What do you want me to write?

It should ask:

> What kind of assignment are you working on, and where are you in the writing process?

---

## Bottom Line

Genre selection is a strong development pathway because it expands the usefulness of *Tu Pana* while preserving its core identity.

The best next version should keep the mixed-genre autobiographical essay as the flagship template and add a small genre library for common classroom assignments.

The long-term product identity becomes:

> *Tu Pana de Escritura* is a genre-aware, authorship-protected AI writing-process coach for multilingual and language-learning classrooms.
