# AI Coach App Knowledge Layer — Future Implementation Plan

**Status:** Idea — not scheduled  
**Created:** 2026-05-13  
**Do not implement until:** Phase 3 data is collected from real student pilots

---

## Purpose

Tu Pana de Escritura currently has two lightweight non-AI orientation tools:

1. A static bilingual Help / Ayuda modal (? button in the header) — implemented in Session 25, commit `d177119`
2. A local keyword-based app-confusion fallback inside `submitChat()` — same commit

These are intentionally minimal. They answer the immediate need ("what is this app?") without touching the AI pipeline.

This document describes the longer-term architecture for a **context-aware AI Coach App Knowledge layer** — a future capability where the coach can answer student questions about how Tu Pana works, stage by stage, without weakening its core pedagogical guardrails. This layer should not be built until the app's main writing-coaching flow is stable and real student confusion data has been collected.

---

## Why Not Implement the Full Layer Yet

- The 10-stage coaching flow is still being refined. Injecting app-help content into every prompt adds noise and token cost before the base prompts are locked.
- We do not yet know which app questions students actually ask. Building a knowledge base from assumptions produces the wrong content.
- Premature prompt injection risks diluting the authorship guardrails that are central to the project's pedagogical identity.
- The static Help modal and local fallback already cover first-contact confusion at zero AI cost. There is no evidence yet that they are insufficient.

**Rule:** collect real confusion data first, then build the layer that answers it.

---

## Absolute Constraints — Non-Negotiable Across All Phases

These constraints apply to every phase below. No phase may relax them.

- No full app manual injected into every Gemini or Ollama prompt
- No weakening of authorship guardrails
- No bypassing Stage 6 (Draft Reflection) or any other gated stage
- No AI-generated student prose inserted into the draft
- No fabricated citations, invented sources, or example text that could be mistaken for research
- No replacement writing in the student's voice
- Stage-aware help must **explain the app**, not do the assignment
- When the coach enters Guide Mode, it answers the app question briefly and then **redirects the student back to their own writing task**

---

## Phase 1: Static Help / Ayuda Modal

**Status: Complete — commit `d177119`**

- ? button in header opens a bilingual modal
- 9 sections covering app basics, the 10-stage sequence, toolkit, data persistence, and instructor escalation
- Stage-aware: current stage highlighted using `state.stage` and `STAGES` metadata
- No AI involvement. No prompt changes. No storage keys.

**Exit criterion:** deployed and tested (34/34 ✅)

---

## Phase 2: Local App-Confusion Fallback in `submitChat()`

**Status: Complete — commit `d177119`**

- ~13 EN/ES keyword phrases intercepted before `sendCoachMessage()` is called
- Returns a local bilingual response pointing the student to the ? button
- Stage-specific notes for Stages 6, 8, and 10
- Normal essay messages pass through unchanged; AI never called for intercepted messages

**Exit criterion:** deployed and tested (34/34 ✅); no regressions in prior suites (135/135 ✅)

---

## Phase 3: Canonical App-Help Knowledge Document

**Status: Not started — requires pilot data**

### Goal

Create `docs/app-help-knowledge.md` — a single source of truth for what the app does, stage by stage, in plain bilingual language. This file is the foundation for all later phases.

### How to build it

1. Run the 5-student pilot (Tier 4).
2. Log every app-confusion message that reaches the coach (those not caught by the Phase 2 keyword filter).
3. Categorize by stage and question type.
4. Write canonical bilingual answers for each category.
5. Organize the document into structured stage-aware snippets (one section per stage, one per cross-stage topic).

### Document structure (proposed)

```
# Tu Pana App Help — Canonical Knowledge

## Cross-stage topics
- What is Tu Pana?
- How do I send a message?
- Can I write in Spanish?
- How do I move to the next stage?
- What is Mi Toolkit?
- Will I lose my work?

## Stage 1 — Anécdota
## Stage 2 — Conexión
## Stage 3 — Tu Pitch
## Stage 4 — Investigación
## Stage 5 — Borrador
## Stage 6 — Reflexión sobre el borrador
## Stage 7 — Revisión
## Stage 8 — Pulir tu voz
## Stage 9 — Reflexión sobre el proceso
## Stage 10 — Capstone
```

**Exit criterion:** document written, reviewed, and contains at least one canonical answer per stage drawn from real student confusion data.

---

## Phase 4: Context-Aware Tu Pana Guide Mode

**Status: Not started**

### Concept

When a student asks an app question that passes through the keyword filter (ambiguous or novel phrasing), the coach should be able to recognize it as an app question, answer it briefly using the canonical knowledge, and then redirect the student to their writing task.

This is **Guide Mode** — a lightweight intent fork inside the coach's response logic, not a separate system.

### Design principles

- Guide Mode answers are short: 2–4 sentences maximum.
- Every Guide Mode response ends with a redirect: "Now, back to your writing — [stage-specific prompt]."
- Guide Mode never generates student prose, never invents sources, and never discusses stages the student hasn't reached yet.
- Guide Mode is invisible to the student — it is the same coach voice, briefly shifting register.

### What Guide Mode is NOT

- It is not a chatbot FAQ system.
- It is not a help desk.
- It is not a replacement for the ? button.
- It does not handle instructor questions, grading questions, or assignment logistics.

---

## Phase 5: Stage-Aware Snippet Selection

**Status: Not started — depends on Phase 3**

### Goal

Convert the canonical `docs/app-help-knowledge.md` sections into short, injectable snippets — one per stage, pre-written in bilingual plain language.

### Implementation sketch

```js
const APP_HELP_SNIPPETS = {
  1: "In Stage 1 (Anécdota), your task is to write a personal memory...",
  2: "In Stage 2 (Conexión), you connect that memory to a larger context...",
  // etc.
};
```

These snippets live in `data.js` or a new `app-help.js` module. They are **not** injected into the system prompt by default — they are only pulled when app-help intent is detected (Phase 6).

**Exit criterion:** snippets written, reviewed for bilingual accuracy, and confirmed not to contain any student-prose templates or example citations.

---

## Phase 6: App-Help Intent Detection

**Status: Not started — depends on Phase 3 data**

### Goal

Detect, with reasonable precision, when a student message is asking about the app rather than about their essay.

### Approach options (choose one based on pilot data)

| Option | Method | Cost | Risk |
|---|---|---|---|
| A | Expanded keyword list (extends Phase 2) | Zero | Misses novel phrasing |
| B | Lightweight regex patterns per stage | Zero | Brittle across languages |
| C | Short local classifier (embeddings, no API) | Low | Requires training data |
| D | Add intent detection to the system prompt | Token cost | May confuse the coach |

**Recommended starting point:** Option A (expanded keywords), informed by the real questions collected in Phase 3. Advance to Option B or C only if keyword coverage proves inadequate after the second pilot round.

**Exit criterion:** detection precision ≥ 90% on held-out pilot questions; false positive rate (normal essay messages classified as app-help) < 5%.

---

## Phase 7: Prompt Integration

**Status: Not started — depends on Phases 5 and 6**

### Goal

When app-help intent is detected, inject only the relevant stage-aware snippet into the coach's context — not the full app manual.

### Integration point

Inject at the top of the user message context block, not in the system prompt:

```
[APP CONTEXT — Stage 4]
In Stage 4, the coach suggests research directions. The student searches and evaluates sources independently...
[END APP CONTEXT]

Student message: "how do I find sources for my essay?"
```

### Constraints

- Injection is **conditional** — only when intent is detected.
- Injected text is drawn only from the canonical snippets (Phase 5) — no ad-hoc generation.
- The system prompt guardrails (authorship gate, voice rules, anti-rewrite rules, citation block) are not modified.
- Total injected text per turn: ≤ 200 tokens.
- Injection is logged to `logProcessEvent()` for auditing.

**Exit criterion:** integration tested across all 10 stages; guardrails verified intact; no regression in coaching behavior for normal essay messages.

---

## Testing Scenarios by Stage

These scenarios should be tested before any phase beyond Phase 2 is shipped:

| Stage | App question to test | Expected behavior |
|---|---|---|
| 1 | "what am I supposed to do here?" | Guide Mode: explains Anécdota task, redirects to writing |
| 2 | "I don't understand the connection thing" | Guide Mode: explains Stage 2, redirects |
| 3 | "what is a pitch" | Guide Mode: explains pitch, redirects |
| 4 | "how do I find sources" | Guide Mode: explains research stage, reminds coach suggests not finds |
| 5 | "should I start a new paragraph?" | Passes through as essay question — not intercepted |
| 6 | "what do I do in stage 6" | Guide Mode: explains Draft Reflection, does not skip the stage |
| 7 | "how do I revise" | Passes through as essay question — not intercepted |
| 8 | "can you rewrite this for me" | Blocked by Voice Polish guardrail — not a Guide Mode case |
| 9 | "what is the process reflection" | Guide Mode: explains Stage 9, redirects |
| 10 | "how do I finish" | Guide Mode: explains Capstone card sequence, redirects |

Additional regression tests for every phase:
- Normal essay message at each stage → not intercepted, reaches AI normally
- All prior test suites pass with no regressions

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Guide Mode generates student prose | Hard constraint in system prompt: coach never writes for the student |
| Snippet injection dilutes coaching focus | Snippets are ≤ 200 tokens; injected only when intent detected |
| Keyword/intent detection false positives disrupt essay coaching | Phase 3 data collection establishes baseline; < 5% false positive threshold required before shipping |
| App knowledge goes stale as stages change | Canonical doc (`app-help-knowledge.md`) is the single source; snippets regenerated from it, not maintained separately |
| Students use app-help questions to avoid writing | Guide Mode always redirects to the writing task; coach does not engage in extended app support dialogue |
| Gemini Worker prompt grows too large | Injection is conditional and capped at 200 tokens; system prompt is not modified |

---

## Success Criteria

The full AI Coach App Knowledge layer is considered ready to ship when all of the following are true:

- [ ] Canonical `docs/app-help-knowledge.md` exists and covers all 10 stages plus cross-stage topics
- [ ] At least one full pilot round has been completed and confusion data has been collected
- [ ] Stage-aware snippets are written, bilingual, and reviewed
- [ ] App-help intent detection precision ≥ 90%, false positive rate < 5% on held-out data
- [ ] Prompt injection is conditional, capped at 200 tokens, and logged
- [ ] All prior test suites pass without regression
- [ ] Guide Mode response always ends with a redirect to the student's writing task
- [ ] Authorship guardrails, Voice Polish rules, citation block, and Stage 6 gate are verified intact
- [ ] No student prose, no invented sources, no replacement writing in any Guide Mode response reviewed during QA

---

## Recommended Implementation Sequence

```
Phase 1  ✅  Static Help / Ayuda modal              (complete — d177119)
Phase 2  ✅  Local app-confusion fallback            (complete — d177119)
Phase 3  ⏳  Pilot → collect confusion data → write docs/app-help-knowledge.md
Phase 4  ⬜  Design Guide Mode intent fork
Phase 5  ⬜  Write stage-aware snippets from Phase 3 doc
Phase 6  ⬜  Build intent detection (start with expanded keywords)
Phase 7  ⬜  Conditional prompt injection + logging
         ⬜  Full cross-stage regression testing
         ⬜  (Optional) Retrieval-based app guide if snippet count > ~30
```

Do not begin Phase 3 without pilot data. Do not begin Phase 4 without Phase 3 complete. Each phase gate is a hard dependency.

---

## Strong Recommendation

**Do not inject app knowledge into the coach prompt until Phases 3–6 are complete.**

The current static Help modal and local fallback are sufficient for early pilots. They cost nothing at inference time, cannot hallucinate, and cannot weaken guardrails. Any improvement on those two properties requires the data and precision work in Phases 3–6 to justify the added complexity.

The coach's job is to help students write their own essays in their own voices. App orientation is a secondary concern. Build the knowledge layer only after the coaching is proven to work.
