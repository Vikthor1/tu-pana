# Gemini Provider Integration Plan for Tu Pana de Escritura

> **Status: MOSTLY DONE — 2026-05-15**
> Gemini Flash-Lite live via Cloudflare Worker (`tupana-gemini-proxy.dr-torres-velez.workers.dev`). `FEATURES.geminiProvider = true`. Full guardrail prompt sent. Flash routing active for Stages 7+10 (`8e82733`). Valid modes: `offline | ollama | gemini`. Remaining: monetization / access codes (Tier 4+, blocked on pilot).
> **Last updated:** 2026-05-15
> **Companion doc:** `docs/ideas/tu-pana-gemini-proxy-pilot-and-monetization-plan.md` (proxy/cost/monetization strategy)

---

## 1. Purpose

This document prepares a technically sound, pedagogically safe Gemini Flash-Lite / Flash integration for Tu Pana de Escritura. It records the implementation sequence, required guardrails, prompt strategy, test matrix, and known risks so that when the integration work begins, no architectural decisions need to be re-derived.

Gemini should become a second AI provider inside Tu Pana's existing coaching architecture — not a replacement for that architecture, and not a general-purpose chatbot attached to the app.

---

## 2. Current State

| Component | Status |
|---|---|
| `generateCoachResponse()` | Exists in `ai-provider.js`; returns raw text for Ollama, `null` for others |
| `sendCoachMessage()` | Typed student chat entry point; delegates to `sendMsg()` |
| `callOllamaDirect()` | Working local provider; validated through Playwright tests |
| Demo/offline responses | Aligned with 10 stages (corrected 2026-05-11) |
| Stage 10 structured output | Parses JSON directly from Ollama; no raw-text fallback used |
| `FEATURES.geminiProvider` | `false` — Gemini disabled, placeholder commented in `ai-provider.js` |
| Regression tests | All passing as of commit `e961ce6` |

**Completed guardrail fixes that Gemini must inherit:**
- Stage 3: pitch/tension framing (not "how did you feel?")
- Stage 4: no fake sources, no bibliographic examples
- Stage 8: no copy-paste-ready sentence rewrites; no partial-sentence substitutions; user-message preamble for recency advantage
- Stage 10: structured JSON coach perspective, 8 dimensions
- Five Questions: evaluation is app-level and silent — model never sees eval picks
- Selection-to-Coach: stage-aware framing inserted into chat input; model sees the framing as the student's message

---

## 3. Core Principle

**Gemini runs inside Tu Pana's corrected pedagogical architecture. It does not replace the architecture.**

Every rule that exists to protect student authorship, prevent ghostwriting, prevent fake citations, and preserve multilingual voice applies to Gemini exactly as it does to Ollama. The model changes; the rules do not.

---

## 4. Why Gemini Should Be a Provider, Not a Separate Agent

Tu Pana's coaching behavior is determined by:

1. The system prompt built by `buildOllamaSystemPrompt()` (or its successor `buildCoachPrompt()`)
2. The stage template rules from `getActiveTemplate()` / `getTemplateStageData()`
3. The student message content (typed or Selection-to-Coach prefilled)
4. The `_stageReminder` preamble for stages where recency matters (Stage 8)

A separate Gemini chatbot would bypass all four layers. Students would get unguarded responses — no authorship guardrail, no fake-source block, no Voice Polish rule. That would be a research integrity failure, not just a bug.

**What should happen:**

```
Tu Pana frontend
  → submitChat() → sendCoachMessage() → generateCoachResponse()
    → Gemini proxy endpoint (new)
      → Gemini API
        → raw text response
          → addMsg() → chat panel
```

**What must not happen:**

```
Tu Pana frontend
  → Gemini API directly (exposed API key)

Tu Pana frontend
  → Gemini with a generic system prompt (no Tu Pana rules)
```

---

## 5. Secure Proxy Requirement

The Gemini API key must never appear in frontend JavaScript or be committed to GitHub.

**Requirement:** A serverless proxy intercepts requests from the frontend, appends the API key server-side, forwards to Gemini, and returns the response.

**Proxy options (in order of preference for this project):**

| Option | Notes |
|---|---|
| **Netlify Function** | Simplest for GitHub Pages → Netlify migration; free tier adequate for pilot |
| **Vercel Serverless Function** | Good alternative; same free-tier range |
| **Cloudflare Worker** | Lowest latency; slightly more setup |
| **Google Cloud Run** | Most control; more infrastructure overhead for a solo faculty project |
| **Google AI Studio runtime** | Only if the project moves to a full-stack host |

**Proxy contract:**
- Accept: `{ message, systemPrompt, model, options }` from frontend
- Forward: Gemini API call server-side
- Return: `{ text }` or `{ error }`
- Do not log full student text server-side (see §12)
- Validate origin to reject non-app requests

**Frontend change required:** Add `CONFIG.geminiProxyUrl` in `config.js`. No other frontend change needed to wire the proxy.

---

## 6. Recommended Model Strategy

| Model | Use | Reason |
|---|---|---|
| **Gemini 2.0 Flash-Lite** | Default for pilot | Lowest cost and latency; adequate for most coaching turns |
| **Gemini 2.0 Flash** | Quality fallback | Use if Flash-Lite struggles with: bilingual consistency, Stage 8 nuance, Stage 10 structured JSON, or complex Stage 3 pitch analysis |

**Decision rule:** Start with Flash-Lite for all 10 stages. Upgrade to Flash only if test matrix reveals consistent failures in a specific stage (see §14). Do not use Flash everywhere — cost difference matters for a pilot with real students.

`CONFIG.geminiModel` should be switchable without a code deploy (e.g., set in `config.js` or via proxy environment variable).

---

## 7. Prompt and System Instruction Strategy

Use the same layered structure already designed in `buildCoachPrompt()` (`ai-provider.js`):

```
Layer 1: Base Tu Pana rules
  (authorship, no ghostwriting, no fake sources, bilingual parity)
Layer 2: Course/mode rules
  (classroom context, IRB-adjacent care)
Layer 3: Genre template rules
  (from getTemplateStageData() for the current stage)
Layer 4: Stage-specific rules
  (coachFocus, allowedSupport, blockedSupport for current stage)
Layer 5: Selected student context
  (current stage name, word count, draft-saved state)
Layer 6: Current student message
  (typed text, or Selection-to-Coach prefilled frame + quoted selection)
```

**Token discipline:**
- Do not send full chat history unless the turn requires it (translation followup is the main exception)
- Keep each layer compact — rule lists, not paragraphs
- Use the `_stageReminder` preamble pattern for stages where recency matters (confirmed effective for Stage 8 with Ollama; apply same approach for Gemini)
- Cap `maxOutputTokens` at 400 for standard coaching turns (matches current `num_predict: 400`)

**Gemini-specific note:** Gemini's system instruction field is separate from the conversation turns. Place the full guardrail prompt in `systemInstruction`, not in the first `user` turn. This keeps the student message clean.

---

## 8. Stage-Specific Guardrails to Preserve

All of the following must be present in the Gemini system instruction, exactly as they exist in `buildOllamaSystemPrompt()`:

| Rule | Stage(s) | Description |
|---|---|---|
| ABSOLUTE AUTHORSHIP RULE | All | No copy-ready prose; overrides everything |
| NO SAMPLE STUDENT PROSE | All | No example sentences, model sentences, polished replacement wording |
| SENTENCE-FRAME RULE | All | Frames use blanks only; no student content inserted |
| RESEARCH AND CITATION RULE | 4 | No invented sources, titles, authors, DOIs, journal names; give search strategies; explicit format ban (`Author:/Title:/Journal:/Year:`) |
| RESEARCH (positive permission) | 4 | If student pastes a real source, coach may help format/check it; must never fill in missing fields |
| Stage 3 pitch framing | 3 | Tension/argument only; not "how did you feel?"; not Stage 1/2 memory work |
| OUTLINE RULE + EXAMPLE BAN | 5 | Blank scaffold or questions only; no slash-separated examples |
| REVIEW/REWRITE RULE | 7 | Name strength, ask question, suggest detail type; no replacement sentence |
| VOICE POLISH RULE | 8 | Forbidden: "Here is a better version:", "Try this instead:", any finished sentence in student's voice, partial-sentence substitutions |
| Stage 8 `_stageReminder` | 8 | Preamble in user message: `[STAGE 8 — VOICE POLISH] ...` for recency advantage |
| LANGUAGE RULE | All | Respond in `state.lang`; do not default to Spanish |

**Five Questions evaluation is app-level.** Model never receives eval pick data. This rule requires no model configuration — it is enforced by the app's silent-eval flow.

---

## 9. Structured Output Plan for Stage 10

Stage 10 coach perspective uses direct JSON parsing. Gemini supports constrained output via `responseMimeType: "application/json"` + `responseSchema`. This should eliminate the raw-text/fallback errors that required manual JSON extraction with Ollama.

**Proposed JSON shape (unchanged from current Ollama contract):**

```json
{
  "coachPerspective": [
    {
      "dimension": "Opening / Anecdote",
      "rating": "Strong | Developing | Needs attention",
      "observation": "One sentence about what the student did.",
      "suggestion": "One question or specific direction — not a rewrite."
    }
  ],
  "limitationNote": "One sentence reminding the student this is not a grade."
}
```

**8 dimensions (match current `CAPSTONE_CRITERIA`):**
1. Opening / Anecdote
2. Connection / Bridge
3. Research / Sources
4. Argument / Tension
5. Voice / Bilingual Expression
6. Structure / Flow
7. Reflection / Awareness
8. Readiness for Submission

**Implementation note:** When calling Gemini for Stage 10, pass `responseMimeType` and `responseSchema` in the generation config. The proxy should forward these fields. `handleCoachPerspectiveResponse()` already parses this JSON — no change needed if the shape is preserved.

---

## 10. Cost-Control Rules

| Rule | Rationale |
|---|---|
| Use Flash-Lite by default | Lowest cost; adequate for most turns |
| Cap `maxOutputTokens: 400` | Matches current coaching response length; prevents verbose drift |
| Do not send full chat history | Each turn is largely independent; only send prev bot message for translation-followup context (matches existing `getLastBotMessage()` pattern) |
| Send only current stage context | Stage name + word count + draft-saved state; not full draft |
| Use selected text when available | Selection-to-Coach already sends a quoted excerpt; no need to send full textarea |
| Summarize process state | Boolean flags (`draftSaved`, `maniDone`) not raw text |
| Compare Flash-Lite vs Flash costs during pilot | Log model + approximate token count per call (no student content); decide after 50+ turns |

**Cost reference (as of 2026):** Gemini 2.0 Flash-Lite is ~15× cheaper per token than Flash. For a 5-student pilot with ~30 coaching turns per student, Flash-Lite should cost under $0.05 total. Flash would be ~$0.75. Neither is a concern at pilot scale, but the pattern matters at class scale.

---

## 11. Privacy and Logging Rules

Tu Pana is designed for use with immigrant community college students. Privacy is a non-negotiable design constraint.

| Rule | Reason |
|---|---|
| Proxy must not log full student message or draft content by default | Student writing may contain sensitive personal narrative (immigration experience, family, legal status) |
| Proxy may log: model name, token counts, stage number, timestamp | Operational debugging only; no student content |
| If error logging is needed: log error type + stage, not message content | Enough to diagnose failures |
| App remains localStorage-first | All student data stays on device; no server-side storage |
| Instructor Process Report generated client-side | Never sent to proxy or third-party service |
| Chatlog not sent to proxy | Only current message is sent (with optional previous bot turn for translation context) |
| Privacy statement should note Gemini usage if enabled | Required for institutional adoption; add to `docs/project-brief.md` before pilot |

---

## 12. Minimal Implementation Sequence

Complete in this order. Do not skip ahead.

```
1.  Verify regression tests are green (Playwright: sel_to_coach_test.mjs + prior suites).
2.  Create proxy endpoint (Netlify / Vercel / Cloudflare Worker).
    - Accept: { message, systemPrompt, model, options }
    - Forward to Gemini API server-side with GEMINI_API_KEY env var
    - Return: { text } or { error }
3.  Add CONFIG.geminiProxyUrl = '' to config.js (empty string = disabled).
4.  Add callGeminiProvider() to ai-provider.js:
    - POST to CONFIG.geminiProxyUrl
    - Return raw text on success
    - Return null on failure (falls back to demo/offline)
5.  Add Gemini branch in generateCoachResponse():
    - if (FEATURES.geminiProvider && CONFIG.geminiProxyUrl) → callGeminiProvider()
    - else → existing Ollama / null path
6.  Keep FEATURES.geminiProvider = false until proxy is live and tested.
7.  Test one ordinary chat exchange (Stage 1 or 2; no guardrail complexity).
8.  Test Stage 4 fake-source prompt (send a message asking for citations).
9.  Test Stage 8 no-rewrite prompt (send a Voice Polish turn asking to rewrite a sentence).
10. Test Stage 10 structured output (full capstone flow; confirm JSON parses cleanly).
11. Compare Flash-Lite vs Flash on Stage 8 and Stage 10.
12. Only then enable FEATURES.geminiProvider = true for small pilot group.
```

---

## 13. Test Matrix: Ollama vs Gemini Flash-Lite vs Gemini Flash

| Test Area | Ollama | Gemini Flash-Lite | Gemini Flash | Notes |
|---|---|---|---|---|
| Stage 3 pitch/tension coaching | ✅ Verified 2026-05-11 | — | — | Must name tension; no "how did you feel?" |
| Stage 4 fake-source guardrail | ✅ Verified 2026-05-11 | — | — | No author/title/journal; search strings only |
| Stage 7 revision (Five Questions) | ✅ Verified | — | — | No replacement sentences |
| Stage 8 no-rewrite Voice Polish | ✅ Verified 2026-05-11 | — | — | No partial-sentence substitutions |
| Five Questions evaluation | App-level | App-level | App-level | Independent of model |
| Stage 10 structured JSON output | ✅ Verified | — | — | Confirm 8 dimensions parse; check `limitationNote` |
| Bilingual response stability | ✅ Verified | — | — | Responds in state.lang; no default-to-Spanish |
| Selection-to-Coach framing | ✅ Verified 2026-05-11 | — | — | Stage-aware frame respected in model response |
| Latency (first token) | ~2–6s cold | — | — | Flash-Lite expected faster than Flash |
| Cost per turn | ~$0.00 (local) | — | — | Log tokens during pilot |

Fill in Gemini columns after Step 10 of the implementation sequence.

---

## 14. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Flash-Lite ignores Stage 8 Voice Polish rule | Medium | Use `_stageReminder` preamble in user message; test specifically before enabling |
| Flash-Lite generates JSON-adjacent but unparseable Stage 10 output | Medium | Use `responseMimeType: "application/json"` + `responseSchema`; eliminates raw-text fallback need |
| Proxy key exposed in frontend error messages | Low | Proxy must never return the API key in error payloads; validate this during proxy testing |
| Student draft content logged server-side inadvertently | Low | Review proxy code before deployment; default to no-log for message body |
| Flash-Lite flattens bilingual voice ("correct" student's code-switching) | Medium | Test with a message containing deliberate code-switching; check response for corrections |
| Cost exceeds free-tier during pilot | Very low | Flash-Lite at 30 turns × 5 students = ~150 turns; well within free tier |
| Gemini responses longer than Ollama (more verbose) | Medium | `maxOutputTokens: 400` cap; test that this is enforced by the proxy |
| FEATURES.geminiProvider accidentally enabled in main branch | Low | Code review gate before any PR that changes this flag |

---

## 15. What Not to Do

- **Do not expose the Gemini API key in frontend JavaScript or HTML.**
- **Do not bypass `generateCoachResponse()`** — all AI calls must go through the provider abstraction.
- **Do not bypass `getTemplateStageData()` stage rules** — Gemini must receive the same stage guardrails as Ollama.
- **Do not create a separate Gemini chatbot** attached to Tu Pana outside the provider architecture.
- **Do not send full student chat history** unless the turn specifically requires it (translation followup).
- **Do not enable `FEATURES.geminiProvider = true`** before the Stage 4 and Stage 8 guardrail tests pass.
- **Do not remove the Ollama / demo / offline fallback** — these are essential for classroom use when network or API is unavailable.
- **Do not use Gemini for the Five Questions eval flow** — evaluation picks are app-level and must remain silent (no model call).
- **Do not skip the bilingual stability test** — this app serves multilingual students; a model that corrects code-switching is harmful.

---

## 16. Open Questions Before Implementation

1. **Proxy host decision:** Netlify (simplest for Pages migration) vs Vercel vs Cloudflare Worker. Depends on whether the project moves off GitHub Pages.
2. **Flash-Lite model ID:** Confirm the current stable model ID (`gemini-2.0-flash-lite` or `gemini-2.0-flash-lite-001`). Model IDs change at GA; pin to a specific version in `CONFIG.geminiModel`.
3. **Stage 10 schema registration:** Does the proxy need to forward `responseSchema` to Gemini, or can it be hardcoded server-side? Hardcoding server-side is safer (less client surface area).
4. **Privacy statement:** Does the institution require a disclosure about third-party AI processing? Needed before any pilot with real students.
5. **Ollama as default vs Gemini as default:** For the pilot, Ollama (local) remains safer for privacy. Gemini should be opt-in via dev bar or instructor setting, not the default student experience.
6. **`keep_alive` equivalent for Gemini:** Not applicable — Gemini is stateless API. Cold-start latency will be consistent (~300–800ms for Flash-Lite). No warm-up needed.

---

## 17. Recommended Next Coding Patch

When ready to implement (after regression tests remain green):

```
Patch scope:
1. config.js       — Add CONFIG.geminiProxyUrl = '' and CONFIG.geminiModel = 'gemini-2.0-flash-lite'
2. ai-provider.js  — Add callGeminiProvider() stub (returns null until proxy is live)
3. ai-provider.js  — Add disabled Gemini branch in generateCoachResponse()
4. genre-template.js — FEATURES.geminiProvider remains false

No other files touched.
No proxy code in frontend.
No API key anywhere in the repo.
```

Commit message: `feat(ai): add disabled Gemini provider stub and proxy URL config`

This patch creates the wiring without enabling anything. The feature flag stays false until the proxy is live and tested.
