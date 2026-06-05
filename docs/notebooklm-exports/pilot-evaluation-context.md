---
Last updated: 2026-06-05
Source: docs/pilot/survey-instrument.md, docs/pilot/survey-builder.gs, 01_projects/tupana/context.md (VC-OS)
Upload-safe: YES
Note: This document does not contain any student data, participant identifiers, or survey responses.
Next review: after pilot completion, before any award or IRB submission
---

# Tu Pana de Escritura — Pilot Evaluation and Survey Context

*This document prepares NotebookLM to support pilot planning, pre/post survey construction, evaluation framing, and course-facing language. It does not contain any student data.*

---

## 1. Pilot Overview

**App:** Tu Pana de Escritura (mobile short-form: "Tu Pana")
**Pilot class:** LAC 118: Caribbean Society and Culture — Summer 2026, 4-week course
**Institution:** Hostos Community College, CUNY (Bronx, NY)
**Lead:** Prof. Victor Torres-Vélez
**Format:** Students use Tu Pana to write a mixed-genre autobiographical essay over 4 weeks, working through all 10 stages. Pre-survey is administered on Day 1 before students open the app. Post-survey is administered after the final writing assignment is submitted in Week 4.

**The survey instrument is class-agnostic.** It does not reference LAC 118, the essay genre, or any course-specific content. It will transfer unchanged to future courses.

---

## 2. What the Pilot Is Trying to Learn

The pilot has three evaluation goals:

**Goal 1 — Writing self-efficacy.** Does sustained use of Tu Pana change how confident students feel about their own writing? Items B1–B5 measure this on a 1–5 scale, pre and post.

**Goal 2 — AI literacy and critical agency.** Does Tu Pana help students develop a more critical, agentic relationship with AI — one where they feel in control of their writing and can evaluate AI advice rather than accept it wholesale? Items C1–C4 measure this, with C2 reverse-scored (reduced worry about AI threatens authorship = positive outcome).

**Goal 3 — Pedagogy fidelity.** Did the app actually behave as designed? Did it help students do their own writing rather than doing it for them? Did the step-by-step structure help? Did the bilingual design work? Items D1–D5 measure this post-survey only.

**Secondary goals (qualitative):** Items E1–E3 collect open-ended reflection. E3 ("At the end of this process, do you feel the writing you completed is truly your own work?") is the most IRB-relevant item and feeds award/grant narrative. E1 feeds award narrative. E2 feeds the next development cycle.

---

## 3. Participant Code System

The pilot uses student-generated codes rather than names, emails, or student IDs.

**How it works:**

1. The Apps Script (`docs/pilot/survey-builder.gs`) generates N unique participant codes (default: 30; configurable).
2. Both the pre-survey and post-survey forms are created with a required "Participant Code" field.
3. The script generates pre-filled URLs for each code using the Google Forms API.
4. Output: a Google Sheet with columns: Code | Pre-Survey URL | Post-Survey URL.
5. The instructor (Dr. Torres-Vélez) distributes one row per student — via Brightspace message or email.
6. Students click their pre-survey link → code arrives pre-filled → they do not type anything.
7. The same code on the post-survey link matches responses for paired analysis.

**Code format:** `TPN-001` through `TPN-NNN`

**Privacy design:** Survey data never includes names, student IDs, or email addresses. The instructor-held roster that maps codes to students is kept separately and is not included in research data. The survey data is de-identified at the point of analysis. This is an IRB-appropriate design for voluntary research with FERPA-adjacent student populations.

---

## 4. Survey Structure

### Pre-Survey

**Part A — About You as a Writer** (context items, pre-only)
- A1: Language comfort (checkbox, multiple)
- A2: Prior essay writing experience in English (scale)
- A3: Prior AI tool use (scale)

**Part B — Writing Confidence** (paired; identical wording on pre and post)
- B1: Confidence expressing ideas in writing
- B2: Organizing thoughts into written structure
- B3: Writing from personal experience to build a real argument
- B4: Persistence when stuck
- B5: Comfort writing in a mix of languages

**Part C — AI and Writing** (paired; identical wording on pre and post)
- C1: AI can help me become a better writer
- C2: I worry AI will make my writing less my own *(reverse-scored: decrease = positive outcome)*
- C3: I can tell when AI advice is useful
- C4: I feel in control of my own writing when using AI

### Post-Survey (adds Parts D and E)

**Part D — Your Experience with Tu Pana** (post-only; direct app evaluation)
- D1: Tu Pana helped me do my own writing rather than doing it for me
- D2: The step-by-step structure helped me develop my ideas
- D3: I could communicate with Tu Pana in my preferred language
- D4: Tu Pana's feedback helped me make my own decisions
- D5: I would use Tu Pana again

**Part E — Reflection** (post-only; open-ended, optional)
- E1: What was the most useful thing Tu Pana did for your writing?
- E2: What would you change or improve?
- E3: At the end of this process, do you feel the writing is truly your own? Why or why not?

---

## 5. Survey Language and Design Principles

- **Bilingual throughout.** Every item appears in English and Spanish side by side. Students may answer in English, Spanish, or both.
- **Consent preamble is identical on both forms.** Placed in the form description. Explains: voluntary, no grade impact, no name/ID collected, coded data only, may be used in research without identifying participants.
- **Timing:** Pre-survey distributed on Day 1 before students open Tu Pana. Post-survey distributed at final submission (Week 4, same day or within 24 hours).

---

## 6. Analysis Guide (Summary)

| Comparison | Items | What a pre→post change means |
|------------|-------|------------------------------|
| Writing Self-Efficacy | B1–B5 (sum or mean) | Increase = students feel more confident as writers |
| AI Critical Agency | C1, C3, C4 (sum) | Increase = students feel more in control with AI |
| AI Concern (reverse) | C2 (single item) | Decrease = less fear that AI threatens authorship |

**Minimum for reporting:** 5 paired responses. With N=5–10, use Wilcoxon signed-rank test (nonparametric). With N>15, paired t-test is appropriate.

**Post-only D items** measure pedagogy fidelity — whether the app actually behaved as designed. D1 is the most direct IRB-relevant item alongside E3.

---

## 7. Aligning Google Forms with the App Experience

When building or reviewing the survey forms, keep the following app experience in mind:

**What students actually did in Tu Pana:**
- Completed an onboarding sequence (Tu Conocimiento → El Laboratorio) before any writing
- Worked through 10 stages, each with a bilingual orientation message from the coach
- Received AI coaching questions at each stage — not AI-generated text
- Evaluated each AI response with the Evaluar · Evaluate bar (Five Questions criteria)
- Had the option to switch between Español, English, and bilingual (ES-EN/BI) modes at any time
- Saved and exported their work at Stage 6 (authorship gate: draft saved before revision)
- Used a bug report button to flag issues (🐞 Problema · Problem? in the header)

**What students did NOT experience:**
- AI writing for them
- A login or account creation
- Cloud sync or teacher surveillance of in-session writing
- Ollama as a provider option (hidden for the pilot; only Offline and Gemini were visible)

**Language experience context (for D3 item):**
Students could switch between ES, EN, and BI (bilingual/Spanglish) at any point. The app is Spanish-default but fully functional in English and bilingual mode. On mobile, the language selector was a compact dropdown (ES / EN / BI). Any student who felt constrained by the language options should flag this in E2.

**Authorship context (for D1 and E3 items):**
The app was explicitly designed so that Tu Pana makes questions, not essays. Stage 1 opened with a visible framing message to this effect. The authorship gate at Stage 6 required students to save their own draft before revision features unlocked. E3 asks students to reflect on this directly.

---

## 8. Immediate Next Step

**Build the Google Forms:**

1. Create a new Google Sheet (e.g., "Tu Pana Pilot Data — LAC 118 Summer 2026").
2. In the sheet, go to Extensions → Apps Script and paste the contents of `docs/pilot/survey-builder.gs`.
3. Run `Tu Pana Surveys → Build Pre + Post Surveys` from the custom menu.
4. Run `Tu Pana Surveys → Verify Setup` and test TPN-001/TPN-002 links in an incognito window.
5. Share the Distribution sheet with Dr. Torres-Vélez for student distribution.
6. Distribute pre-survey links to LAC 118 students on Day 1 before they open Tu Pana.

**Do not distribute the Apps Script file itself to students.** It is an instructor-run tool.

---

## 9. What This Document Should Not Be Used For

- Not a source for student data or pilot outcomes — no survey responses or student writing are included.
- Not a substitute for the canonical `docs/pilot/survey-instrument.md` when building the forms — use the full instrument spec for question wording.
- Not an IRB protocol document — this is a planning and orientation document.
- Not a final analysis guide — the analysis section above is a planning aid; consult a methodologist for final statistical choices.
