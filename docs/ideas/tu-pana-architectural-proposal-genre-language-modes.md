---
type: idea
project: tu-pana-de-escritura
status: active
created: 2026-05-10
tags:
  - tu-pana
  - architecture
  - refactor
  - genre
  - templates
  - course-mode
  - feature-flags
  - obsidian
---

# Tu Pana de Escritura: Architectural Proposal for Future Genre and Language Modes

## Core Architectural Goal

The next architectural step for *Tu Pana de Escritura* should not be to add genre selection, Spanish L2, or Heritage Spanish immediately.

The next step should be to prepare the app so those features can be added later with less friction.

The core goal:

> Turn the current app into a template-driven writing-process engine, with the existing mixed-genre autobiographical essay preserved as the default template.

This protects the working app while preparing it for future expansion.

---

## Guiding Principle

The app should separate **core functionality** from **pedagogical configuration**.

### Core App Engine

The engine should handle:

- navigation
- stage progression
- saving and loading
- localStorage
- AI coach calls
- draft gates
- process logging
- checklist behavior
- report generation
- UI rendering

### Pedagogical Configuration

The configurable layer should handle:

- course mode
- genre template
- stage titles
- stage instructions
- coach prompts
- revision criteria
- checklist items
- reflection questions
- instructor report categories
- target language
- proficiency level

This structure allows the same engine to support different genres and language-learning modes later.

---

## Preserve the Current App as the Default

The current version should remain the default experience.

Default configuration:

```text
Course Mode: ELL / English Academic Writing
Genre: Mixed-Genre Autobiographical Essay
Target Language: English
Student Level: First-Year / Community College
```

The app should behave exactly as it does now unless future feature flags are activated.

---

## Recommended Configuration Object

Create one central assignment configuration object.

Example:

```javascript
const currentAssignmentConfig = {
  appVersion: "1.0",
  schemaVersion: "1.0",
  courseMode: "ell-academic-writing",
  genre: "mixed-genre-autobiographical-essay",
  targetLanguage: "english",
  studentLevel: "first-year-college",
  stages: [],
  coachRules: {},
  checklist: [],
  reflectionQuestions: [],
  instructorReport: {}
};
```

This gives future course modes and genres a clear place to plug into the app.

---

## Move Stage Data into a Genre Template

Stage names, stage descriptions, instructions, coach guidance, checklist language, and report categories should be moved out of the main app logic and into a default genre template.

Suggested first template: `mixedGenreAutobiographicalEssay`

Example structure:

```javascript
export const mixedGenreAutobiographicalEssay = {
  templateId: "mixed-genre-autobiographical-essay",
  templateName: "Mixed-Genre Autobiographical Essay",
  templateDescription: "Guides students from personal memory to social analysis.",
  stages: [
    {
      id: "stage.memory_or_entry_point",
      title: "Find a Memory",
      phase: "Discover",
      studentInstructions: "...",
      coachFocus: "...",
      allowedSupport: ["questions", "feedback", "revision guidance"],
      blockedSupport: ["write paragraph", "generate draft", "invent story"]
    }
  ]
};
```

Later, new templates can be added without rewriting the engine.

---

## Use Stable Stage IDs

The app logic should not depend on visible stage names.

Instead of relying on labels such as:

```text
Stage 1: Anecdote
Stage 6: First Draft
Stage 8: Voice Polish
```

Use stable internal IDs:

```text
stage.memory_or_entry_point
stage.connection
stage.topic_pitch
stage.source_exploration
stage.organization
stage.first_draft
stage.revision
stage.voice_polish
stage.checklist
stage.reflection
```

This allows different genres to rename stages while preserving the same underlying workflow.

| Stable Stage ID | Mixed-Genre Essay | Film Response |
|---|---|---|
| stage.memory_or_entry_point | Find a Memory | Choose a Scene |
| stage.connection | Build the Social Connection | Describe What You Notice |
| stage.topic_pitch | Pitch Your Topic | Build an Interpretation |
| stage.first_draft | Write the First Draft | Write the First Draft |
| stage.reflection | Writing Process Reflection | Viewing and Writing Reflection |

---

## Make the Draft Gate Genre-Independent

The unassisted first draft gate should become part of the core engine, not a rule tied only to the mixed-genre essay.

Reusable authorship gate:

```javascript
const authorshipGate = {
  requiredBefore: ["paragraph_revision", "voice_polish", "instructor_report"],
  requirement: "student_saved_first_draft",
  message: "Before I can give paragraph-level revision feedback, you need to save a first draft that you wrote yourself."
};
```

This same gate should eventually apply to:

- reading responses
- film responses
- argumentative essays
- research reflections
- Spanish L2 writing
- Heritage Spanish writing
- service-learning reflections

---

## Build Prompt Packs in Layers

Avoid one giant AI coach prompt.

Instead, build the coach prompt from layers:

```text
Base Coach Rules
+ Course Mode Rules
+ Genre Template Rules
+ Stage-Specific Rules
+ Student Process Data
+ Current User Message
```

Example:

```javascript
const coachPrompt = buildCoachPrompt({
  baseRules,
  courseModeRules,
  genreRules,
  stageRules,
  studentProcessData,
  userMessage
});
```

This makes future combinations easier, such as:

```text
Spanish L2 + Film Response
Heritage Spanish + Language Autobiography
ELL + Reading Response
General Writing + Argumentative Essay
```

---

## Separate Course Mode from Genre

Do not create separate apps for every future use case.

Instead, separate two dimensions:

```text
Course Mode = learner context / language-learning context
Genre       = assignment type
```

Future example:

```javascript
const writingContext = {
  courseMode: "heritage-spanish",
  genre: "film-media-response",
  targetLanguage: "spanish",
  proficiencyLevel: "intermediate-advanced"
};
```

This allows flexible combinations later:

```text
ELL + Reading Response
ELL + Research Reflection
Spanish L2 + Film Response
Heritage Spanish + Language Autobiography
General Writing + Argumentative Essay
```

---

## Move Student-Facing Text into Content Files

Student-facing text should not be scattered across the app code.

Move the following into content or configuration files:

- button labels
- stage titles
- stage instructions
- coach welcome messages
- blocked-request messages
- checklist language
- reflection prompts
- celebration messages
- instructor report headings

Suggested structure:

```text
/content
  uiText.en.js
  uiText.es.js
  blockedMessages.js
  celebrationMessages.js
```

This will make future bilingual, Spanish L2, and Heritage Spanish modes easier to implement.

---

## Version the Saved Data

Because *Tu Pana* uses localStorage, saved student data should include a schema version.

Example:

```javascript
const savedProject = {
  schemaVersion: "1.0",
  appVersion: "1.0",
  templateId: "mixed-genre-autobiographical-essay",
  courseMode: "ell-academic-writing",
  createdAt: "...",
  updatedAt: "...",
  stages: {},
  drafts: {},
  processLog: []
};
```

This will make future updates safer and reduce the risk of breaking older saved work.

---

## Make the Process Log a First-Class Object

The process log should be structured, not just stored as scattered text.

Example:

```javascript
processLog: [
  {
    timestamp: "2026-05-10T10:24:00",
    stageId: "stage.first_draft",
    actionType: "draft_saved",
    studentGenerated: true,
    aiGenerated: false,
    summary: "Student saved first full draft."
  }
]
```

This will help generate instructor reports across different genres and modes.

---

## Create a Template Registry

Use a registry so the app can load templates by ID.

Initial version:

```javascript
const genreTemplateRegistry = {
  "mixed-genre-autobiographical-essay": mixedGenreAutobiographicalEssay
};
```

Future version:

```javascript
const genreTemplateRegistry = {
  "mixed-genre-autobiographical-essay": mixedGenreAutobiographicalEssay,
  "reading-response": readingResponse,
  "film-media-response": filmMediaResponse,
  "service-learning-reflection": serviceLearningReflection,
  "argumentative-essay": argumentativeEssay,
  "research-based-reflection": researchBasedReflection
};
```

---

## Add Feature Flags

Use feature flags so future functionality can be scaffolded without changing the current student-facing app.

Example:

```javascript
const FEATURES = {
  genreSelection: false,
  courseModeSelection: false,
  spanishL2Mode: false,
  heritageSpanishMode: false,
  instructorSettings: false
};
```

This allows development to proceed safely and incrementally.

---

## Suggested Future File Structure

A possible long-term structure:

```text
tu-pana/
  index.html
  assets/
    css/
      styles.css
    js/
      app.js
      state.js
      storage.js
      ui.js
      coach.js
      prompts.js
      reports.js
      config.js
      featureFlags.js
  templates/
    genres/
      mixedGenreAutobiographicalEssay.js
    courseModes/
      ellAcademicWriting.js
    language/
      en.js
      es.js
  docs/
    architecture.md
    genre-template-spec.md
    course-mode-spec.md
```

This structure does not need to be fully implemented immediately. It should guide the refactor gradually.

---

## Recommended Implementation Order

1. Add feature flags.
2. Add a central app configuration object.
3. Move stage titles and instructions into the default genre template.
4. Create stable stage IDs.
5. Make the draft gate genre-independent.
6. Create a template registry with only the current mixed-genre template.
7. Move coach prompt pieces into layered prompt modules.
8. Move student-facing UI text into content/config files.
9. Add schema versioning to localStorage.
10. Document the architecture in the project notes.

---

## What Not to Do Yet

Do not implement the full future feature set immediately.

Avoid:

- adding many genres at once
- adding Spanish L2 mode immediately
- adding Heritage Spanish mode immediately
- redesigning the UI around mode selection
- adding user accounts
- adding cloud storage
- adding payments
- creating a complex instructor dashboard
- rewriting the app in React unless absolutely necessary

The current app works. The priority is to protect it while preparing it for future growth.

---

## Immediate Development Goal for Claude

The safest next coding goal:

> Refactor *Tu Pana* so that the current mixed-genre autobiographical essay is represented as a default genre template, while preserving the current UI and behavior exactly.

Claude should:

1. Preserve all current functionality.
2. Avoid visible UI changes unless necessary.
3. Keep the current mixed-genre essay as the default.
4. Move hard-coded pedagogical language into template/config structures.
5. Add scaffolding for future genre and course-mode selection.
6. Keep future features disabled through feature flags.
7. Update documentation after the refactor.
8. Confirm that no student-facing behavior has changed.

---

## Bottom Line

The architectural change needed now is not to add genre selection or SLL modes immediately.

The needed change is:

> Build a template-driven foundation where the current mixed-genre essay is simply the first default template.

This prepares *Tu Pana* for:

- genre selection
- Spanish L2 mode
- Heritage Spanish mode
- additional assignment templates
- instructor customization
- stronger process reports
- future monetization

without forcing a premature rebuild.
