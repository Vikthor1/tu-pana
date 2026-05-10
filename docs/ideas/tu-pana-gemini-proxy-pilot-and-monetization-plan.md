---
type: idea
project: tu-pana-de-escritura
status: active
created: 2026-05-10
tags:
  - tu-pana
  - gemini
  - ai-coach
  - pilot
  - monetization
  - proxy
  - obsidian
---

# Tu Pana Gemini Proxy Pilot and Monetization Plan

## 1. Current Status

Tu Pana de Escritura has now been fully integrated with a local Ollama AI coach.

The local Ollama setup is valuable because it allows private testing, debugging, prompt experimentation, stage-by-stage refinement, and controlled demonstrations from my own computer. It is especially useful as a local rehearsal system for developing and testing the AI coach without incurring API costs.

However, the current local Ollama setup is not ideal for sharing the app with colleagues, students, or outside testers. Because the AI coach runs locally on my own machine, other users cannot simply open a public web link and use the coach independently unless I intentionally expose my local machine as a server, which would create unnecessary security, reliability, and privacy complications.

The next deployable step is therefore to create a Gemini Flash-Lite / Flash setup behind a secure proxy.

## 2. Core Strategic Decision

For June pilot readiness, Gemini Flash-Lite / Flash behind a secure proxy should become the next milestone, not Copilot Studio.

Copilot Studio is no longer a practical path for the immediate pilot because CUNY is not currently providing the needed licenses. Copilot Studio may still matter later if institutional licensing changes, but it should not block the June pilot.

Gemini provides a faster, cheaper, and more controllable route to a usable web-based pilot.

The strategic shift is:

```text
Local Ollama testing
→ Gemini proxy pilot
→ paid web app / monetizable beta
→ possible mobile PWA or app-store route
```

## 3. Target Architecture

The target deployable architecture should be:

```text
Student browser
→ Tu Pana web app
→ Secure proxy endpoint
→ Gemini API
→ AI coach response
→ Tu Pana interface
```

This architecture keeps the Gemini API key hidden on the server/proxy side instead of exposing it in the public web app.

The public-facing Tu Pana app can remain a static web app, hosted through GitHub Pages, Vercel, Netlify, or a similar platform. The proxy can be hosted separately using a lightweight backend or serverless function.

Possible proxy hosting options include:

* Cloudflare Workers
* Vercel Serverless Functions
* Google Cloud Run
* Render
* Netlify Functions

The main purpose of the proxy is to:

* protect the Gemini API key;
* receive requests from the Tu Pana web app;
* decide whether to use Flash-Lite or Flash;
* send the request to Gemini;
* return the AI coach response;
* enforce usage caps and basic safety controls.

## 4. Model Routing Strategy

Use Gemini Flash-Lite for most coaching interactions.

Flash-Lite should handle:

* stage guidance;
* brainstorming support;
* anecdote-development coaching;
* bridge-sentence coaching;
* topic pitch feedback;
* research direction suggestions;
* outline feedback;
* checklist help;
* voice-polish suggestions;
* light paragraph-level feedback;
* general student-facing process coaching.

Use Gemini Flash only for heavier reasoning moments.

Flash should handle:

* Stage 7 paragraph-level revision diagnostics;
* Stage 10 Instructor Process Report generation;
* messy student input requiring stronger inference;
* complex synthesis across several stages;
* cases where the coach must infer process patterns from fragmented or uneven student work;
* moments when the student's paragraph requires deeper diagnostic feedback.

The guiding routing principle is:

```text
Most stages → Gemini Flash-Lite
Heavy reasoning moments → Gemini Flash
```

## 5. Estimated Development Time

Given that the local Ollama AI coach was integrated in approximately eight hours, the Gemini Flash-Lite / Flash proxy setup should be manageable within a similar or slightly longer range.

Estimated timeline:

```text
Fast working prototype:        4–6 hours
Solid pilot-ready version:     8–14 hours
Polished monetizable version:  20–40+ hours
```

The Gemini call itself should not be especially difficult. The more time-consuming parts will be:

* proxy deployment;
* secure API key handling;
* CORS restrictions;
* request and response limits;
* model routing;
* testing;
* usage monitoring;
* privacy-conscious logging.

## 6. Version Levels

### Version 1: Working Prototype

Estimated time: 4–6 hours

This version would prove that the architecture works.

It should include:

* one secure proxy endpoint;
* Gemini API key stored as an environment variable;
* Flash-Lite as the default model;
* basic request from Tu Pana to the proxy;
* basic response from Gemini back to Tu Pana;
* simple error message if Gemini fails.

This version is enough to confirm:

```text
Tu Pana web app
→ secure proxy
→ Gemini Flash-Lite
→ coach response
```

### Version 2: Summer Pilot Ready

Estimated time: 8–14 hours

This is the version to target for the June summer pilot.

It should include:

* Flash-Lite default routing;
* Flash escalation for Stage 7 and Stage 10;
* request size limits;
* output length limits;
* daily or per-session usage caps;
* hidden API key;
* clean fallback message if the model fails;
* basic cost/usage logging;
* CORS limited to the Tu Pana domain;
* realistic testing with several student workflows;
* no live web grounding;
* no full-draft server logging unless deliberately required.

This is the first version that should be shared with colleagues and then used with a 20-student summer course.

### Version 3: Monetizable Beta

Estimated time: 20–40+ hours

This version would move beyond a pilot into a more product-like system.

It would likely require:

* course access codes;
* user login or license keys;
* per-course or per-user limits;
* simple instructor dashboard or export function;
* payment or license workflow;
* privacy policy;
* terms of use;
* abuse/report button;
* better monitoring;
* stronger failure handling;
* possibly a database.

This is no longer just an AI integration. It becomes the beginning of a small SaaS-style educational technology product.

## 7. June Pilot Cost Expectations

For a 20-student summer pilot, expected Gemini API usage costs are likely to be very low.

Rough estimates:

```text
Low use:       under $1
Medium use:    around $1–$3
High use:      around $5–$10
Safe cushion:  $25–$75 total
```

The larger costs are not likely to come from Gemini model usage itself.

The bigger concerns are:

* secure proxy setup;
* API key protection;
* deployment;
* basic monitoring;
* privacy policy language;
* usage caps;
* testing time;
* documentation for pilot use.

## 8. Required Pilot Controls

Before sharing the Gemini-powered version with students, the following controls should be in place:

* hide the Gemini API key server-side;
* never place the API key in GitHub Pages or public JavaScript;
* restrict CORS to the Tu Pana domain;
* add token limits;
* add output length limits;
* add per-session or per-day usage caps;
* avoid Google Search grounding during the pilot;
* avoid storing full student writing on the proxy;
* log only minimal usage metadata where possible;
* preserve Ollama as a local testing fallback;
* preserve offline mode as a backup;
* create a clear failure message if Gemini is unavailable.

## 9. Privacy and Data Principles

The pilot should preserve Tu Pana's privacy-by-design structure.

The app should continue to avoid unnecessary server-side storage of student writing.

The proxy should ideally log only minimal technical metadata, such as:

* timestamp;
* stage number;
* model used;
* approximate token count;
* success or error status;
* anonymous session ID if needed.

The proxy should avoid storing:

* full student drafts;
* full paragraphs;
* personal narratives;
* student names;
* identifiable student information;
* full process records.

The guiding privacy principle is:

```text
Use the proxy to route AI coaching, not to collect student writing.
```

## 10. Recommended Implementation Passes

### Pass 1: Minimal Gemini Proxy

Create a minimal proxy endpoint.

The proxy should:

* use Node/Express, Cloudflare Worker, Vercel function, or similar;
* read GEMINI_API_KEY from an environment variable;
* accept prompt and stage metadata from Tu Pana;
* send request to Gemini;
* return Gemini response;
* use Flash-Lite as the default model;
* avoid storing student text.

Goal: Confirm that Tu Pana can receive a Gemini coach response through a secure proxy.

### Pass 2: Connect Tu Pana to Proxy

Modify the Tu Pana app so that it can use the Gemini proxy as another AI provider.

Add something like:

```text
AI_PROVIDER = "gemini-proxy";
```

Preserve the existing providers:

```text
offline mode
local Ollama mode
Gemini proxy mode
```

The goal is not to remove Ollama. The goal is to preserve Ollama as the local rehearsal system while adding Gemini as the deployable pilot system.

Goal: Allow the same Tu Pana interface to route coaching requests to Gemini through the proxy.

### Pass 3: Add Pilot Controls

After the basic connection works, add pilot controls.

These should include:

* Flash-Lite / Flash routing;
* Stage 7 and Stage 10 escalation;
* request length caps;
* response length caps;
* per-session call caps;
* CORS restrictions;
* simple usage counter;
* clear error/fallback messages;
* no full student-writing logs.

Goal: Make the Gemini version safe enough to share with a few colleagues and then with a 20-student summer pilot.

## 11. Suggested Model Routing Logic

A simple routing rule could look like this:

```text
Use Flash-Lite by default.

Use Flash only when:
- stage === 7;
- stage === 10;
- taskType === "revision-diagnostic";
- taskType === "instructor-process-report";
- messyInput === true;
- synthesisAcrossStages === true.
```

The app does not need complicated routing at first.

A basic version could be:

```text
Stages 1–6 → Flash-Lite
Stage 7    → Flash
Stage 8    → Flash-Lite
Stage 9    → Flash-Lite
Stage 10   → Flash
```

Later, this can become more nuanced.

## 12. Monetization Path

The Gemini Flash-Lite / Flash proxy architecture can support a quick monetization path.

However, the fastest monetization route is probably not the Apple App Store or Google Play Store.

The better sequence is:

```text
1. Summer pilot
2. Private instructor beta
3. Paid web-based course license
4. Mobile-friendly Progressive Web App
5. App-store packaging only later, if useful
```

The first monetizable version should probably be positioned as:

```text
Tu Pana de Escritura: Instructor Pilot Edition
```

## 13. Initial Product Positioning

Tu Pana should not be positioned as simply another AI writing app.

Its distinctive value is that it is:

* process-based;
* bilingual;
* culturally responsive;
* authorship-protective;
* designed around student writing first;
* aligned with multilingual and Latinx student success;
* structured around staged writing development;
* resistant to generic AI text generation;
* designed for instructors who want AI support without surrendering authorship.

Possible positioning:

```text
A bilingual AI writing coach that protects student authorship while guiding students through a structured, reflective writing process.
```

Alternative positioning:

```text
An authorship-protective AI writing coach for multilingual classrooms.
```

Alternative positioning:

```text
A process-based AI writing companion for culturally responsive writing pedagogy.
```

## 14. Possible Early Buyers

The strongest early market is likely not individual students, but instructors and programs.

Possible early buyers include:

* writing instructors;
* Spanish instructors;
* heritage language programs;
* community college faculty;
* summer bridge programs;
* writing centers;
* Latinx student success initiatives;
* AI literacy programs;
* first-year seminar programs;
* multilingual writing programs;
* educational technology pilots;
* grant-funded teaching innovation projects.

## 15. Early Pricing Ideas

Possible pricing models:

```text
Individual instructor pilot:  $49–$99 per course
Small cohort license:         $199–$499 per term
Department pilot:             $750–$2,500 per term
Custom implementation:        $2,500–$7,500+
```

The first paid pilots do not need to be expensive. The early goal is to validate:

* whether instructors will use it;
* whether students benefit from it;
* whether the cost remains manageable;
* whether the workflow is stable;
* whether the app has a clear pedagogical identity;
* whether the authorship-protection model is compelling.

## 16. Web App Before App Store

A web app should come before an app-store version.

Reasons:

* faster deployment;
* fewer approval barriers;
* easier iteration;
* easier classroom sharing;
* easier LMS linking;
* lower cost;
* better fit for writing assignments;
* avoids app-store policy complications too early;
* allows monetization through course licenses or instructor access.

A Progressive Web App may be the best intermediate step.

Students could:

* open Tu Pana in their browser;
* use it on phones, tablets, or laptops;
* add it to their phone home screen;
* experience it like an app without requiring Apple or Google app-store distribution.

## 17. App Store Route Later

The Apple App Store and Google Play Store may become useful later, but only after demand is clearer.

App-store packaging should come after:

* the summer pilot;
* private instructor testing;
* proof that instructors want the product;
* stable mobile-responsive design;
* access control;
* privacy policy;
* abuse/reporting tools;
* usage caps;
* payment or licensing logic.

The app-store route is not the fastest route to revenue.

The likely better route is:

```text
Faculty networks
→ pilot adoption
→ testimonials
→ paid web licenses
→ institutional pilots
→ PWA/mobile polish
→ app stores later if useful
```

## 18. Near-Term Priority

The next practical development milestone is:

```text
Replace the local-only AI endpoint with a secure Gemini proxy endpoint
while preserving Ollama as the local testing fallback.
```

This should not be framed as replacing Ollama.

It should be framed as adding a deployable AI provider.

The system should become:

```text
Offline mode:      fallback and non-AI mode
Ollama mode:       local development and private testing
Gemini proxy mode: shareable pilot and deployable classroom use
```

## 19. Immediate Next Actions

The next concrete actions are:

1. Create a minimal Gemini proxy.
2. Store the Gemini API key as an environment variable.
3. Connect Tu Pana to the proxy.
4. Add Flash-Lite as default model.
5. Add Flash routing for Stage 7 and Stage 10.
6. Preserve Ollama as local fallback.
7. Add basic caps and error handling.
8. Test with realistic student inputs.
9. Share with two or three trusted testers.
10. Prepare for 20-student summer pilot.

## 20. Claude Code Prompt Idea

A future Claude Code prompt could say:

```text
You are an expert software engineer and educational technology architect.

I have a static web app called Tu Pana de Escritura that already supports a local Ollama AI coach for testing. I now want to add a deployable Gemini Flash-Lite / Flash AI provider through a secure proxy.

Your task is to implement this carefully without breaking the existing Ollama or offline modes.

Goals:

1. Create or prepare a minimal secure Gemini proxy endpoint.
2. The Gemini API key must never appear in public client-side code.
3. Store the Gemini API key as an environment variable.
4. Add a new provider option called gemini-proxy.
5. Preserve existing Ollama local testing mode.
6. Preserve offline fallback mode.
7. Use Gemini Flash-Lite as the default model.
8. Use Gemini Flash only for heavier tasks, especially Stage 7 and Stage 10.
9. Add basic request-size and output-size limits.
10. Add simple error handling.
11. Do not store full student writing on the proxy.
12. Keep changes minimal, readable, and well documented.

Before editing, inspect the existing AI-provider logic and explain the smallest safe implementation plan. Then make the changes incrementally.
```

## 21. Guiding Principle

Ollama is the local rehearsal system.

Gemini Flash-Lite / Flash is the deployable pilot system.

The web app/PWA is the fastest monetization path.

App-store packaging should come later, only after pilot evidence and demand are clear.

The central strategic idea is:

```text
Build the smallest secure deployable version first.
Pilot it with real students.
Use the pilot to validate pedagogy, cost, and demand.
Only then build the product layer.
```
