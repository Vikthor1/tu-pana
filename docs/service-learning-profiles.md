# Service-Learning Profiles (Stage B)

Tu Pana helps students transform service hours and community-based inquiry into
**academically grounded, ethically reflective, evidence-based writing.** Stage B
adds a reusable service-learning layer with **CAP 200 / Bronx Beautiful** as the
first concrete course profile.

## Two-level architecture

The design is deliberately two levels so course specifics never become the
architecture:

1. **Generic type — `service_learning_project`** (`assets/js/genre-template.js`)
   Institution-agnostic. Holds the reusable service-learning *moves*, coaching
   *principles*, the *“coach must never”* guardrails, and a context *builder*.
   It contains **no course-specific strings.**
   - `SERVICE_LEARNING_PROFILE_SCHEMA` — the fields a course profile may fill.
   - `SERVICE_LEARNING_MOVES` — 16 transferable moves, each mapped (`stages`) onto
     Tu Pana’s existing 10 steps. **This adds no engine stages.**
   - `serviceLearningProjectType` — the type object bundling the above.
   - `buildServiceLearningContext(profile)` — composes a profile into the additive
     **ASSIGNMENT CONTEXT** the coach prompt receives. Absent fields degrade
     gracefully, so the same engine serves very different courses.

2. **Course profile — `cap200_bronx_beautiful_service_learning`** (same file)
   A configuration object that fills the schema with CAP 200 values (40% weight,
   5–7 page report, student-selected CBO, structured proposal + template, timeline,
   approval-before-service gate, **10 configurable service hours**, direct service,
   required data collection + analysis, evidence types, IMRDC structure, instructor
   feedback + rubric, expected revisions, Hostos Writing Center, critical thinking
   / problem solving, and genre cautions). It is registered in `ASSIGNMENT_LAYERS`
   as `cap200-bronx-beautiful-service-learning` with a backward-compatible
   `{ id, name, context, … }` shape, so the existing `ui.js` prompt-injection point
   consumes it unchanged.

**CAP 200 is a profile, not the generic service-learning architecture.** All CAP 200
wording lives in the profile/config and the short selector labels — never in the
generic engine. (`service_learning_test.mjs` enforces this isolation.)

## How students reach it (regular link + selector)

Students use the **regular Tu Pana web link**. On first run, when no profile is
active, a minimal in-app selector (“Choose your project”) offers the default
autobiographical essay and the CAP 200 Service-Learning Project. Choosing CAP 200
activates the profile and persists it via the existing `tupana_assignment_id` key.

- No separate deployment and no separate public link.
- Optional low-risk deep link (already supported by `app.js`):
  `…/?assignment=cap200-bronx-beautiful-service-learning` — skips the selector and
  activates CAP 200 directly. A returning student or a prior choice also skips it.
- The selector is intentionally minimal: it helps students *choose*, it does not
  explain the assignment. Full assignment complexity stays in the coach context,
  revealed progressively as the student works.

## What stays locked

The 10-stage engine, the **Stage 6 authorship gate**, and **Stage 8 voice
protection** are global and unchanged. The assignment context is **additive only**
and is injected *after* every mandatory rule, so it can never relax the authorship
gate, voice protection, or the no-copyable-prose / no-invented-data rules. The
coach never grants proposal approval, never replaces instructor feedback, never
invents hours/CBO details/data/sources, and never grades.

## Adding another college / course

Add a new profile object filling the fields you need, register it in
`ASSIGNMENT_LAYERS`, and (to surface it in the selector) flag it `selectable: true`
with short `studentLabelEs/En` + `studentDescEs/En`. `getSelectableProfiles()`
picks it up automatically — **no selector redesign.** Useful fields:

`courseName · institution · projectLabel · requiredHours · serviceType ·
proposalRequired/proposalDetail · approvalRequired · dataRequirement ·
reflectionRequirement · academicStructure · finalDeliverable · assignmentWeight ·
courseConcepts · supportResources · evidenceTypes · revisionExpectation ·
feedbackProcess · instructorCautions`

Leave a field out and the builder simply omits that line.

## Tests

`service_learning_test.mjs` (58 assertions) covers the generic engine, the CAP 200
profile + isolation, the selector through the regular link, and preservation of the
existing default flow. Run with `node test-server.js` on `:3001`, then
`node service_learning_test.mjs`.
