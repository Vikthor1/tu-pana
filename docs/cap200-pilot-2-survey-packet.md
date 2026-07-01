# Tu Pana CAP 200 Pilot 2 Survey Packet

## Opening note

This packet **adapts the existing Pilot 1 Tu Pana pre/post survey system** for the CAP 200 service-learning pilot ("Pilot 2"). It is an **adaptation packet, not a new instrument**.

- **Shared (carryover) items preserve comparison across pilots.** The paired confidence and AI scales (Parts B and C) and the Tu Pana experience scale (Part D) keep the exact Pilot 1 wording and 1–5 scale, so Pilot 1 ↔ Pilot 2 results remain comparable.
- **CAP 200-specific items evaluate the new service-learning genre layer** added in Stage B / Stage B.1 (CBO, service, evidence/data, course-concept connection, report structure, authorship clarity, and the Stage 7 cut-off residual).
- Each item is tagged **[Carryover from Pilot 1]**, **[Adapted for CAP 200]**, or **[New CAP 200-specific]**, and marked **(Core)** or **(Optional)** so you can run a shorter form.

---

## Source-system section

**Pilot 1 source files used (unchanged by this packet):**
- `docs/pilot/survey-instrument.md` — Pilot 1 pre/post instrument (v1.0, 2026-05-31).
- `docs/pilot/survey-builder.gs` — Pilot 1 Google Apps Script form/distribution builder (v1.0).

**Preserved from Pilot 1 (do not change — protects comparability):**
- Consent/transparency preamble (bilingual, identical on both forms).
- Participant-code system: `TPN-001…NNN`, auto-generated, pre-filled via URL, **students never type a code or student ID**.
- Distribution sheet: `Code | Pre-Survey URL | Post-Survey URL | Pre Submitted? | Post Submitted?`.
- Paired items **Part B** (writing confidence B1–B5) and **Part C** (AI & writing C1–C4, C2 reverse-scored).
- Post-only **Part D** (Tu Pana experience D1–D5) and **Part E** (reflection E1–E3).
- 1–5 Likert scale with identical labels (`Strongly Disagree · Muy en desacuerdo` → `Strongly Agree · Muy de acuerdo`).
- Apps Script form settings: email OFF, one-response-per-user OFF, summary OFF, response edits OFF.

**Adapted for CAP 200:**
- Form **titles** gain a "CAP 200 · Pilot 2" marker (described in the Apps Script change list — *not* applied to the `.gs` here).
- A small number of experience items reworded to the service-learning report (tagged [Adapted]).

**New for Pilot 2:**
- Pre-survey **Part F — CAP 200 Readiness** (service-learning-specific pre items).
- Post-survey **Part G — CAP 200 Service-Learning Experience** (genre-specific post items, incl. the Stage 7 cut-off item).
- One new reflection item (E4).
- An **Instructor Observation Checklist** (Pilot 1's survey system had none).

**Assumptions about the Google Forms / Apps Script workflow:**
- Pilot 2 runs in a **separate Google Sheet workbook** (the Apps Script is already designed to be re-pasted into a new sheet per class). This keeps Pilot 2 responses and codes separate from Pilot 1.
- The code→student mapping lives only in how you distribute links; it is **not** in the response data → data is **coded/de-identified, not anonymous** (see Data-use note).
- No product code, Worker, or app behavior is involved — this is instructor-facing survey material only.

---

## Pre-Use Student Survey

Give **before** the student opens Tu Pana for CAP 200. Scale items are 1–5 (`Strongly Disagree · Muy en desacuerdo` → `Strongly Agree · Muy de acuerdo`) unless noted.

**Participant Code · Código de participante** — [Carryover] (Core) — pre-filled; do not change.

### Part A — About You as a Writer · Sobre ti como escritor/a
- **A1** [Carryover] (Core) — *Which language(s) do you feel most comfortable writing in?* (checkbox: English/Inglés · Spanish/Español · Both equally/Ambos por igual · Other) / *¿En qué idioma(s) te sientes más cómodo/a escribiendo?*
- **A2** [Carryover] (Optional) — *Before this course, how many multi-page essays have you written in English for a college class?* (None / 1–2 / 3–5 / More than 5)
- **A3** [Carryover] (Core) — *Before using Tu Pana, have you used AI tools to help with writing?* (Never / Once or twice / Sometimes / Often)

### Part B — Writing Confidence · Confianza para escribir  *(paired — identical to Pilot 1)*
- **B1**–**B5** [Carryover] (Core) — B1 confident expressing ideas; B2 organize thoughts into clear structure; B3 write from own experience to make a real argument; B4 keep going when stuck; B5 comfortable writing in a mix of languages. *(Exact Pilot 1 wording — see `survey-instrument.md` §4A.)*

### Part C — AI and Writing · La IA y la escritura  *(paired — identical to Pilot 1)*
- **C1**–**C4** [Carryover] (Core) — C1 AI can help me become a better writer; **C2 (reverse-scored)** worry AI makes my writing less my own; C3 tell when AI advice is useful; C4 feel in control even when using AI. *(C2 covers the **voice/authorship concern** focus area — no new item needed.)*

### Part F — CAP 200 Readiness · Preparación para CAP 200  *(NEW — service-learning-specific)*
- **F1** [New] (Core) — *I feel ready to start my CAP 200 Service-Learning Report.* / *Me siento listo/a para empezar mi Reporte de Aprendizaje-Servicio de CAP 200.*
- **F2** [New] (Core) — *I understand what the CAP 200 assignment is asking me to do.* / *Entiendo lo que la tarea de CAP 200 me pide hacer.*
- **F3** [New] (Core) — *I feel confident I can connect my CBO/service, my data/evidence, and my course concepts in one report.* / *Me siento seguro/a de poder conectar mi CBO/servicio, mis datos/evidencia y los conceptos del curso en un solo reporte.*
- **F4** [New | reverse-scored] (Optional) — *I feel anxious about writing this report.* / *Me siento ansioso/a por escribir este reporte.* *(Reverse: a decrease pre→post is a positive signal.)*
- **F5** [New] (Core) — *I can reliably use Tu Pana on a device and browser I use for schoolwork.* / *Puedo usar Tu Pana de forma confiable en un dispositivo y navegador que uso para la escuela.* *(device/access)*
- **F6** [New | checkbox] (Optional) — *Before starting, what do you hope Tu Pana will help you with? (select all)* / *Antes de empezar, ¿en qué esperas que Tu Pana te ayude? (marca todas)* — understanding the assignment · planning my project/proposal · planning my data/evidence · organizing my report · connecting service to course ideas · revising · writing in my language(s) · staying motivated. *(expected help)*

**Comfort using AI as a writing coach** is captured by carryover C1/C4 (no new pre item added).

**Count:** Core pre ≈ 12 (CODE + A1 + A3 + B1–B5 + C1–C4 + F1–F3 + F5). Full pre ≈ 16 with optional A2/F4/F6. *(Exceeds a strict 8–12 only because Pilot 1 comparability requires the full paired B/C set — per the "unless the Pilot 1 structure requires otherwise" allowance; drop the (Optional) items for the short form.)*

---

## Post-Use Student Survey

Give **after** one meaningful Tu Pana session, or after the assigned draft milestone (or within 24 hours of meaningful use). Scale items 1–5, same labels.

**Participant Code · Código de participante** — [Carryover] (Core) — pre-filled; matches the pre-survey code.

### Part B — Writing Confidence  *(paired — identical to Pilot 1)*
- **B1**–**B5** [Carryover] (Core) — identical wording to the pre-survey (required for a valid pre→post delta).

### Part C — AI and Writing  *(paired — identical to Pilot 1)*
- **C1**–**C4** [Carryover] (Core) — identical wording; C2 reverse-scored.

### Part D — Your Experience with Tu Pana · Tu experiencia con Tu Pana  *(carryover, comparable to Pilot 1 post)*
- **D1** [Carryover] (Core) — helped me do my own writing rather than doing it for me. *(covers "revision helped without writing for me" + authorship)*
- **D2** [Carryover] (Core) — the step-by-step structure helped me develop my ideas.
- **D3** [Carryover] (Core) — I could communicate with Tu Pana in my preferred language.
- **D4** [Carryover] (Core) — feedback helped me make my own decisions about my writing.
- **D5** [Carryover] (Core) — I would use Tu Pana again for a future assignment. *(covers "would use again")*

### Part G — CAP 200 Service-Learning Experience · Experiencia de Aprendizaje-Servicio  *(NEW / adapted)*
- **G1** [New] (Core) — *Tu Pana helped me understand what to do next at each step.* / *Tu Pana me ayudó a entender qué hacer a continuación en cada paso.* *(next-action clarity)*
- **G2** [New] (Core) — *The CAP 200 step names, prompts, and the writing box made sense to me.* / *Los nombres de los pasos de CAP 200, las indicaciones y el cuadro de escritura tuvieron sentido para mí.* *(labels/prompts/placeholder)*
- **G3** [New] (Core) — *Tu Pana helped me understand the CBO / community issue / service framing of the project.* / *Tu Pana me ayudó a entender el enfoque de CBO / problema comunitario / servicio del proyecto.*
- **G4** [New] (Core) — *Tu Pana helped me connect my service experience to course concepts.* / *Tu Pana me ayudó a conectar mi experiencia de servicio con los conceptos del curso.*
- **G5** [New] (Core) — *Tu Pana helped me plan or think through my evidence/data (hours, journals, interviews, surveys, or observations).* / *Tu Pana me ayudó a planear o pensar mi evidencia/datos (horas, diarios, entrevistas, encuestas u observaciones).*
- **G6** [New] (Core) — *The report structure (introduction, methodology, results, discussion, conclusion) made sense to me.* / *La estructura del reporte (introducción, metodología, resultados, discusión, conclusión) tuvo sentido para mí.*
- **G7** [New] (Core) — *It was clear that at the First Draft step I write the draft myself, without the coach.* / *Quedó claro que en el paso del Primer Borrador yo escribo el borrador, sin el coach.* *(Stage 6 authorship clarity)*
- **G8** [Adapted from D1] (Optional) — *The revision help improved my writing without writing the report for me.* / *La ayuda de revisión mejoró mi escritura sin escribir el reporte por mí.* *(compare cautiously vs D1/D4)*
- **G9** [Adapted from C4] (Optional) — *Tu Pana kept my own voice and authorship.* / *Tu Pana mantuvo mi propia voz y autoría.* *(compare cautiously vs C4)*
- **G10** [New | multiple choice] (Core) — *Did a coach reply ever get cut off or stop in the middle — especially at the Revision step?* / *¿Alguna respuesta del coach se cortó o se detuvo a la mitad — especialmente en el paso de Revisión?* — **Never / Nunca · Once / Una vez · A few times / Algunas veces · Often / Con frecuencia.** *(Stage 7 truncation monitor)*
- **G11** [New] (Core) — *Tu Pana worked well on the device I used (phone or computer).* / *Tu Pana funcionó bien en el dispositivo que usé (teléfono o computadora).* *(mobile/device usability)*

### Part E — Reflection · Reflexión  *(open-ended; answer in English, Spanish, or both)*
- **E1** [Carryover] (Core) — *What was the most useful thing Tu Pana did for your writing?* *(covers "what helped most")*
- **E2** [Carryover] (Core) — *What would you change or improve about Tu Pana?*
- **E3** [Carryover] (Core) — *At the end of this process, do you feel the writing you completed is truly your own work? Why or why not?* *(authorship — most IRB-relevant)*
- **E4** [New] (Optional) — *What confused you, if anything, while using Tu Pana for this CAP 200 project?* / *¿Qué te confundió, si algo, al usar Tu Pana para este proyecto de CAP 200?* *(what confused)*

**Count:** Core post ≈ 14 scale items (B1–B5, C1–C4, D1–D5) + Core CAP items (G1–G7, G10, G11) + E1–E3. For a shorter form, drop the (Optional) items (G8, G9, E4) and keep D or G where they overlap — **do not drop B/C** (they carry the pre→post comparison).

---

## Instructor Observation Checklist

*(New for Pilot 2 — the Pilot 1 survey system had none; a separate tier-4 pilot-testing packet carries general observation groups. Quick yes/no or tally during/after a session.)*

1. Student reached the **CAP 200 flow** (header shows "Comunidad y propuesta" / stage says "Community Starting Point").
2. Student used the **deep link** successfully (landed in CAP 200 without the picker).
3. If the **selector** appeared, student chose "CAP 200 Service-Learning Project" (not Personal Essay).
4. Student understood the **mode labels** (Suave / Guía / Coach IA) without extra explanation.
5. Student understood work saves **locally, in this browser/device** (and to export a backup).
6. Student understood the **Stage 6 authorship** expectation (they write the first draft).
7. Student reported a **Stage 7 cut-off** (coach reply stopped mid-sentence). *(tally count)*
8. Student could use Tu Pana **on a phone** without trouble.
9. Student engaged meaningfully with the **CBO / service** framing.
10. Student engaged with **evidence/data** planning (hours, journals, interviews, surveys, observations).
11. Student connected **service to course concepts**.
12. Repeated student **questions** observed (note the top 1–3).
13. Student completed the intended **milestone** for the session.
14. Any **access/device** problems (browser, storage, link).
15. Any **language** friction (bilingual display too much / too little).

---

## Personalized-link / code workflow

Preserve the Pilot 1 coded-link workflow **as-is**:

- Codes are **system-generated** and delivered as **pre-filled URLs**. Students **do not type a code and never enter a student ID number.**
- Pilot 2 codes use the **`TPN2-###`** format (`TPN2-001`, `TPN2-002`, …) — the builder ships `CONFIG.CODE_PREFIX = 'TPN2'` by default, keeping the Pilot 1 `TPN-###` code style while marking Pilot 2 provenance.
- **Run Pilot 2 in a separate Google Sheet workbook** (paste the Apps Script into a fresh sheet) so Pilot 2 forms, codes, and responses do not mix with Pilot 1.
- **Provenance / merge-safety:** `TPN2` makes each code's pilot unambiguous if Pilot 1 + Pilot 2 data are ever merged. Switch `CONFIG.CODE_PREFIX` to `'TPN'` only if you deliberately want to mirror Pilot 1's exact prefix (rely on the separate workbook to distinguish pilots).
- Distribution sheet columns are unchanged: **`Code | Pre-Survey URL | Post-Survey URL | Pre Submitted? | Post Submitted?`** — distribute one row per student privately (Brightspace message/email); **do not share the sheet with students.**

### Apps Script Pilot-2 change list *(apply manually in the new workbook — NOT applied to `survey-builder.gs` here)*
1. `CONFIG.NUM_PARTICIPANTS` → your CAP 200 class size.
2. `CONFIG.CODE_PREFIX` → the shipped Pilot 2 builder uses `'TPN2'` (default); switch to `'TPN'` only to mirror Pilot 1's exact prefix.
3. Form titles in `buildPreSurvey_`/`buildPostSurvey_` (as shipped in the builder):
   - `Tu Pana CAP 200 Pilot 2 — Pre-Use Survey · Encuesta Inicial`
   - `Tu Pana CAP 200 Pilot 2 — Post-Use Survey · Encuesta Final`
4. Add the new items in code: **Part F** (F1–F6) after Part C in `buildPreSurvey_`; **Part G** (G1–G11) after Part D and **E4** in Part E of `buildPostSurvey_`. Use `addScaleItems_` for the Likert items; `addMultipleChoiceItem` for G10; `addCheckboxItem` for F6; `addParagraphTextItem` for E4.
5. Everything else — consent preamble, code system, `makePrefilledUrl_`, distribution/links sheets, `configureForm_` settings, `verifySurveySetup` — **unchanged**.

*(No `.gs` edits are made by this packet; the above is a description for whoever builds the Pilot 2 forms.)*

---

## Brightspace-ready survey posting language

### A. Pre-survey announcement
> 📋 **Antes de empezar Tu Pana / Before you start Tu Pana**
> Por favor completa esta breve encuesta **antes** de abrir Tu Pana para tu proyecto de CAP 200. Es voluntaria y no afecta tu calificación. Usa **tu enlace personal** — tu código ya viene puesto; no escribas tu número de estudiante. / Please complete this short survey **before** you open Tu Pana for your CAP 200 project. It's voluntary and does not affect your grade. Use **your personal link** — your code is already filled in; do not type your student number.

### B. Post-survey announcement
> 📋 **Después de usar Tu Pana / After using Tu Pana**
> Ahora que trabajaste en tu reporte con Tu Pana, por favor completa esta encuesta final con **tu mismo enlace personal / código**. Voluntaria; no afecta tu calificación. / Now that you've worked on your report with Tu Pana, please complete this final survey using **your same personal link / code**. Voluntary; does not affect your grade.

### C. Short bilingual reminder
> ⏰ Recordatorio: completa tu encuesta de Tu Pana con tu enlace personal. / Reminder: complete your Tu Pana survey using your personal link.

### D. "Use your assigned link — don't type a student number"
> Cada estudiante tiene un **enlace único** con un código ya incluido. **No escribas tu número de estudiante ni tu nombre** en la encuesta. Si tu código no aparece, avísale a tu instructor/a. / Each student has a **unique link** with a code already included. **Do not type your student number or name** in the survey. If your code doesn't appear, tell your instructor.

### E. Timing
> - **Pre-survey:** **antes** de abrir Tu Pana por primera vez / **before** opening Tu Pana for the first time.
> - **Post-survey:** después de **una sesión significativa** con Tu Pana o al terminar el borrador asignado (o dentro de 24 horas) / after **one meaningful session** with Tu Pana or after completing the assigned draft (or within 24 hours).

---

## Data-use / classroom-improvement note

*(Preserves the Pilot 1 consent/transparency stance — see `survey-instrument.md` §2 for the exact bilingual preamble, which should appear in each form's description.)*

- Purpose: **classroom improvement and pilot refinement** of Tu Pana for CAP 200 service-learning.
- **Do not collect names or emails** in the survey (email collection stays OFF). The code links pre↔post; the code→student mapping lives only in how you distribute links.
- **Data is coded / de-identified, NOT anonymous** — say "coded" or "de-identified," not "anonymous," because a distributed roster could in principle re-identify. Do not promise anonymity.
- If names/emails are ever collected for class logistics, state **why** and keep that separate from analysis data.
- If results are later used for **formal research or publication**, IRB review may be required — confirm scope before publishing.

---

## Comparison notes

- **Direct comparison (Pilot 1 ↔ Pilot 2):** B1–B5 and C1–C4 — identical wording and 1–5 scale, paired pre→post. D1–D5 compare **post-to-post** across pilots (they are post-only in both).
- **Compare cautiously (adapted):** G8 (vs D1/D4) and G9 (vs C4) restate authorship/voice for the service-learning context — treat as CAP-context confirmation, not a clean cross-pilot metric.
- **Pilot 2 only (interpret within Pilot 2):** all Part F items, all Part G items (incl. the G10 cut-off monitor), E4, and the Instructor Observation Checklist.
- **Scale/wording:** the 1–5 scale and labels are unchanged, so no scale conversion is needed. New items simply add dimensions; they do not alter the carryover items.
- **Minimum for reporting** (unchanged from Pilot 1): ≥5 paired responses; N=5–10 → Wilcoxon signed-rank; N>15 → paired t-test.

---

*Adapted from the Pilot 1 Tu Pana survey packet. Pilot 1 source files: `docs/pilot/survey-instrument.md`, `docs/pilot/survey-builder.gs`. Prepared after Tu Pana Stage B.1. Product main at packet creation: `063f316`. Stage B.1 live commit: `ab799b2`. VC-OS governed close: `ef4da22`. Date: 2026-07-01.*
