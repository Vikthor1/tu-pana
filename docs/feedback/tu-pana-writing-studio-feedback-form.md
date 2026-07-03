# Tu Pana Writing Studio — Colleague Review Feedback (Form Specification)

**Status:** Spec approved for script generation · form NOT yet created · packet placeholder link NOT yet replaced
**Companion script:** `docs/feedback/create-tu-pana-writing-studio-feedback-form.gs` (creates this form in Google Drive; founder runs it manually)
**Replaces (eventually):** the long temporary placeholder Google Form linked from `docs/colleague-review-evaluator-packet.html` — only after the founder creates and approves the new form and its URL.

---

## Form metadata

| Field | Value |
|---|---|
| **Title** | Tu Pana Writing Studio — Colleague Review Feedback |
| **Description** | Thank you for reviewing Tu Pana Writing Studio / Tu Pana de Escritura. This short form takes about **3–5 minutes**. Your feedback will help decide what to refine before broader faculty review, future pilots, and possible course/program adoption. Responses are anonymous unless you choose to share contact information at the end. |
| **Audience** | Faculty colleagues, WAC/WID and writing program staff, chairs, program directors, administrators, ed-tech/instructional design staff, learning center staff |
| **Completion target** | 3–5 minutes · 12 questions · one required paragraph only |
| **Privacy** | Anonymous by default. No forced Google sign-in. No automatic email collection. Contact details only via the optional final questions. |
| **Confirmation message** | Thank you for reviewing Tu Pana Writing Studio. Your feedback will help shape the next version of the studio, the next pilot steps, and the faculty-facing materials. |

**Design principles applied** (from the survey-completion research pass, 2026-07-03): open with a simple multiple-choice question; closed-ended questions carry the survey; exactly one required open-ended question, placed late, with cost-lowering microcopy; stated completion time; purpose in the first sentence; optional contact at the end; every question mapped to a decision the team will actually make.

---

## Questions

### Q1. What best describes your role?
- **Type:** Multiple choice · **Required:** Yes
- **Options:** Faculty instructor · Writing / WAC / WID program staff · Department chair or program director · Administrator · Educational technology / instructional design staff · Student support / tutoring / learning center staff · Other (with text)
- **Why:** Segments every other answer by reviewer authority and vantage point; simple-MC opener maximizes completion.

### Q2. What did you review?
- **Type:** Checkboxes · **Required:** Yes
- **Options:** Evaluator packet only · Review-mode selector · Autobiographical Mixed-Genre Essay pathway · Service-Learning Report pathway · Research Paper pathway · STEM Lab Report pathway · I have not opened the app yet
- **Why:** Weights feedback by depth of contact; identifies which pathways actually get reviewed.

### Q3. After reviewing the packet/app, how clear is Tu Pana Writing Studio's purpose?
- **Type:** Linear scale 1–5 · **Required:** Yes
- **Labels:** 1 = Not clear yet · 5 = Very clear
- **Why:** Direct check on the packet's messaging layer (brand, origin, evidence framing).

### Q4. How relevant is the problem Tu Pana addresses to your own context?
- **Type:** Linear scale 1–5 · **Required:** Yes
- **Labels:** 1 = Not relevant to my context · 5 = Highly relevant
- **Why:** Problem–fit signal; low scores from high-authority roles flag a positioning gap, not a product gap.

### Q5. Which parts of Tu Pana feel most valuable? (select up to 3)
- **Type:** Checkboxes (help text: "Select up to 3.") · **Required:** Yes
- **Options:** Authorship gate — students must draft before AI feedback · Process evidence and AI-use transparency · Bilingual English/Spanish access · Respect for student voice and code-switching · Genre-specific writing pathways · Support for first-generation/multilingual students · Faculty-facing review controls and assignment-specific links · Other (with text)
- **Why:** Forced prioritization ranks the value proposition — feeds packaging language for the pre-pricing stage.

### Q6. How much would you trust this approach compared with generic AI writing tools or AI detectors?
- **Type:** Linear scale 1–5 · **Required:** Yes
- **Labels:** 1 = I would not trust it yet · 5 = I would trust it for a pilot
- **Why:** Trust versus the two incumbents (generic AI, detectors) is the core adoption barrier; this is the single strongest go/no-go signal.

### Q7. Where could you imagine Tu Pana fitting?
- **Type:** Checkboxes · **Required:** Yes
- **Options:** One assignment in one course · Multiple assignments in one course · First-year writing or writing-intensive course · WAC/WID initiative · Service-learning / community-engaged course · Research paper support · STEM lab/report writing · Tutoring or writing center support · Not sure yet
- **Why:** Maps directly onto the packaging paths (guided faculty pilot vs. department/program pilot vs. writing-center/toolkit path).

### Q8. What is the most important thing to improve before broader faculty review or adoption?
- **Type:** Paragraph (help text: "One sentence is plenty.") · **Required:** Yes — the only required open question
- **Why:** The single highest-value answer in the form: a ranked must-fix list from the exact audience adoption depends on.

### Q9. What felt strongest or most promising?
- **Type:** Paragraph · **Required:** No
- **Why:** Surfaces the assets to lead with in faculty-facing materials; optional keeps completion cost low.

### Q10. Would you be open to a follow-up conversation or pilot discussion?
- **Type:** Multiple choice · **Required:** Yes
- **Options:** Yes — I would like to discuss a possible course pilot · Yes — I would like to share feedback but not pilot yet · Maybe later · No, not at this time
- **Why:** The conversion question; builds the pilot pipeline directly.

### Q11. Optional — your name and email, only if you'd welcome follow-up
- **Type:** Short answer · **Required:** No
- **Why:** Contact strictly opt-in; preserves the anonymity default.

### Q12. Optional — your course, program, or institutional context
- **Type:** Short answer · **Required:** No
- **Why:** Turns a "yes" from Q10 into an actionable conversation starter.

---

## Visual branding (lightweight companion, not a webpage clone)

Google Forms cannot reproduce the packet's custom design; the goal is a form that visually *echoes* the evaluator packet, not one that recreates it. No custom CSS, no embedding tricks, no dependencies.

- **Header image:** `docs/feedback/assets/tu-pana-feedback-form-header.png` — 1600×400 (Google Forms' recommended banner size), ~38 KB, generated locally from the packet's own design tokens: bone paper background `#f7f4ef`, ink Georgia title, jade `#2d7a5f` subtitle and rules, gold `#c8882a` accent dots, muted italic tagline. Text: "Tu Pana Writing Studio · Colleague Review Feedback · A bilingual writing studio where students do the writing — and AI never writes it for them."
- **Theme color:** set to Tu Pana jade — `#2d7a5f`, or the closest green Google Forms offers if exact hex entry is unavailable.
- **Background:** choose the closest warm/light option Google offers for the selected theme color (echoes the packet's paper background).
- **Structure:** keep the form as one concise section; do not add section headers/pages that lengthen perceived effort. Visual connection comes from the header + theme color, brevity stays the priority.

## How the data guides next steps

- **Q3 + Q4 low** → refine packet messaging before widening faculty review (docs sprint, not app sprint).
- **Q5 ranking** → the top-3 value props become the packaging headline for the pre-pricing stage (guided faculty pilot → department/program pilot → instructor toolkit → support model → pricing).
- **Q6 low among chairs/admins** → prioritize trust artifacts (process-evidence samples, Pilot 2 results) over feature work.
- **Q7 clusters** → choose which packaging path to build first.
- **Q8 aggregate** → the founder-gated candidate list gets re-ranked by external demand rather than internal intuition.
- **Q10–Q12** → named pilot pipeline; each "discuss a pilot" response is a direct next conversation.

## Deployment sequence (after founder approval)

1. Founder runs the companion Apps Script once (instructions in the `.gs` header) — creates the form in their own Google Drive.
2. Founder applies the visual branding manually in the Forms editor (Customize theme 🎨): upload the header image above, set theme color to jade, pick the closest warm/light background.
3. Founder reviews the created form in the Forms editor; adjusts wording if desired.
4. Founder approves the respondent URL.
5. Only then: a separate approved change replaces the packet's temporary placeholder link.
