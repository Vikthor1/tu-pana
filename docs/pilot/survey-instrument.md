# Tu Pana de Escritura — Pre/Post Survey Instrument

**Version:** 1.0 (2026-05-31)  
**Status:** Draft — awaiting review before Google Forms build  
**Location:** `docs/pilot/survey-instrument.md`  
**Apps Script spec:** See Section 4 — each question is annotated with its Google Forms type for direct script generation.

---

## Section 1 — Design Principles

- **Class-agnostic:** No course name, assignment title, or genre referenced. Transfers unchanged to any class using Tu Pana.
- **Bilingual:** Every item appears in English and Spanish side by side, matching the app's design.
- **Paired items:** Parts B and C appear identically on both forms. The pre/post delta is the core measurement.
- **Participant code:** Auto-assigned via Google Apps Script. Distributed as unique pre-filled URLs. Students see their code pre-filled and are instructed not to change it. No name, email, or student ID collected.
- **IRB scope:** Voluntary, de-identified/coded, no grade impact, data for academic research and tool improvement.

---

## Section 2 — Consent Preamble
*(Identical text on both forms. Placed in the form description field.)*

**Consent to Participate in Research · Consentimiento para participar en investigación**

This survey is part of a study on Tu Pana de Escritura, an AI writing coach for multilingual college students. Your participation is voluntary and will not affect your course grade. This survey does not collect your name, student ID, or email address. A participant code links your before-and-after responses for analysis; your name is not recorded in the survey data. Data may be used in academic research and presentations without identifying you. By completing and submitting this form, you consent to participate.

*Esta encuesta forma parte de un estudio sobre Tu Pana de Escritura, una herramienta de escritura con IA para estudiantes universitarios multilingües. Tu participación es voluntaria y no afectará tu calificación. Esta encuesta no recoge tu nombre, número de estudiante ni correo electrónico. Un código de participante vincula tus respuestas antes y después con fines de análisis; tu nombre no queda registrado en los datos de la encuesta. Los datos pueden usarse en investigaciones y presentaciones académicas sin identificarte. Al completar y enviar este formulario, consientes participar.*

---

## Section 3 — Participant Code System

**How it works:**
1. Apps Script generates N unique codes (default: 30; configurable at top of script).
2. Both forms are created with a required short-answer field labeled "Participant Code."
3. Script generates pre-filled URLs for each code using the Google Forms API (`FormResponse.toPrefilledUrl()`).
4. Output: a Google Sheet with three columns — `Code | Pre-Survey URL | Post-Survey URL`
5. Instructor distributes one row per student (e.g., via Brightspace message or email).
6. Student clicks their pre-survey link → code arrives pre-filled → they do not type anything.
7. Same code is used for post-survey link → pairs are matched in the response sheet by code.

**Code format:** `TPN-001` through `TPN-NNN`  
**Field behavior:** Required field, pre-filled, labeled with instruction not to change it.  
**Privacy:** Survey data does not include names, student IDs, or emails. The instructor-distributed roster that maps codes to students is kept separately and is not included in research data. The survey data is de-identified at the point of analysis.

---

## Section 4 — Survey Forms

### 4A — PRE-SURVEY

**Form title:** Tu Pana de Escritura — Encuesta Inicial · Pre-Survey  
**Form description:** [Consent preamble from Section 2]  
**Collect email addresses:** OFF  
**Limit to 1 response:** OFF (code uniqueness handles this)

---

**[SHORT_ANSWER | required | pre-filled via URL]**  
`CODE`  
Participant Code · Código de participante  
*This code was assigned automatically. Do not change it.*  
*Este código fue asignado automáticamente. No lo cambies.*

---

**[SECTION BREAK]**  
Part A — About You as a Writer · Sobre ti como escritor/a

---

**[CHECKBOX | required]**  
`A1`  
Which language(s) do you feel most comfortable writing in? *(Select all that apply)*  
¿En qué idioma(s) te sientes más cómodo/a escribiendo? *(Selecciona todas las que apliquen)*

- English / Inglés
- Spanish / Español
- Both equally / Ambos por igual
- Another language / Otro idioma *(allow "Other" with free text)*

---

**[MULTIPLE_CHOICE | required]**  
`A2`  
Before this course, how many multi-page essays have you written in English for a college class?  
Antes de este curso, ¿cuántos ensayos de varias páginas has escrito en inglés para una clase universitaria?

- None / Ninguno
- 1–2
- 3–5
- More than 5 / Más de 5

---

**[MULTIPLE_CHOICE | required]**  
`A3`  
Before using Tu Pana, have you used AI tools to help with writing? *(e.g., ChatGPT, Grammarly, Copilot)*  
Antes de usar Tu Pana, ¿has usado herramientas de IA para ayudarte a escribir? *(ej: ChatGPT, Grammarly, Copilot)*

- Never / Nunca
- Once or twice / Una o dos veces
- Sometimes / A veces
- Often / Con frecuencia

---

**[SECTION BREAK]**  
Part B — Writing Confidence · Confianza para escribir  
*Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).*  
*Califica del 1 (Muy en desacuerdo) al 5 (Muy de acuerdo).*

---

**[SCALE 1–5 | required | low_label="Strongly Disagree · Muy en desacuerdo" | high_label="Strongly Agree · Muy de acuerdo"]**  
`B1`  
I feel confident expressing my ideas in writing.  
Me siento seguro/a expresando mis ideas por escrito.

**[SCALE 1–5 | required | same labels]**  
`B2`  
I can organize my thoughts into a clear written structure.  
Puedo organizar mis ideas en una estructura escrita clara.

**[SCALE 1–5 | required | same labels]**  
`B3`  
I can write from my own experience in a way that makes a real argument.  
Puedo escribir desde mi propia experiencia de forma que construya un argumento real.

**[SCALE 1–5 | required | same labels]**  
`B4`  
When I get stuck while writing, I can find a way to keep going.  
Cuando me quedo atascado/a al escribir, puedo encontrar la manera de seguir.

**[SCALE 1–5 | required | same labels]**  
`B5`  
I feel comfortable writing in a mix of languages.  
Me siento cómodo/a escribiendo en una mezcla de idiomas.

---

**[SECTION BREAK]**  
Part C — AI and Writing · La IA y la escritura  
*Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).*  
*Califica del 1 (Muy en desacuerdo) al 5 (Muy de acuerdo).*

---

**[SCALE 1–5 | required | same labels]**  
`C1`  
AI tools can help me become a better writer.  
Las herramientas de IA pueden ayudarme a convertirme en mejor escritor/a.

**[SCALE 1–5 | required | same labels | REVERSE_SCORED]**  
`C2`  
I worry that using AI will make my writing less my own.  
Me preocupa que usar IA haga que mi escritura sea menos mía.  
*(Analysis note: reverse-score this item — a decrease from pre to post is a positive outcome.)*

**[SCALE 1–5 | required | same labels]**  
`C3`  
I can tell when AI advice is useful and when it isn't.  
Puedo distinguir cuándo un consejo de IA es útil y cuándo no lo es.

**[SCALE 1–5 | required | same labels]**  
`C4`  
I feel in control of my own writing even when I use AI tools.  
Me siento en control de mi propia escritura incluso cuando uso IA.

---

### 4B — POST-SURVEY

**Form title:** Tu Pana de Escritura — Encuesta Final · Post-Survey  
**Form description:** [Consent preamble from Section 2]  
**Collect email addresses:** OFF  
**Limit to 1 response:** OFF

---

**[SHORT_ANSWER | required | pre-filled via URL]**  
`CODE`  
Participant Code · Código de participante  
*This code matches your pre-survey code. Do not change it.*  
*Este código coincide con tu encuesta inicial. No lo cambies.*

---

**[SECTION BREAK]**  
Part B — Writing Confidence · Confianza para escribir  
*(Same items as pre-survey — identical wording required for valid comparison.)*  
*Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).*  
*Califica del 1 (Muy en desacuerdo) al 5 (Muy de acuerdo).*

---

**[SCALE 1–5 | required | low_label="Strongly Disagree · Muy en desacuerdo" | high_label="Strongly Agree · Muy de acuerdo"]**  
`B1`  
I feel confident expressing my ideas in writing.  
Me siento seguro/a expresando mis ideas por escrito.

**[SCALE 1–5 | required | same labels]**  
`B2`  
I can organize my thoughts into a clear written structure.  
Puedo organizar mis ideas en una estructura escrita clara.

**[SCALE 1–5 | required | same labels]**  
`B3`  
I can write from my own experience in a way that makes a real argument.  
Puedo escribir desde mi propia experiencia de forma que construya un argumento real.

**[SCALE 1–5 | required | same labels]**  
`B4`  
When I get stuck while writing, I can find a way to keep going.  
Cuando me quedo atascado/a al escribir, puedo encontrar la manera de seguir.

**[SCALE 1–5 | required | same labels]**  
`B5`  
I feel comfortable writing in a mix of languages.  
Me siento cómodo/a escribiendo en una mezcla de idiomas.

---

**[SECTION BREAK]**  
Part C — AI and Writing · La IA y la escritura  
*(Same items as pre-survey.)*  
*Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).*  
*Califica del 1 (Muy en desacuerdo) al 5 (Muy de acuerdo).*

---

**[SCALE 1–5 | required | same labels]**  
`C1`  
AI tools can help me become a better writer.  
Las herramientas de IA pueden ayudarme a convertirme en mejor escritor/a.

**[SCALE 1–5 | required | same labels | REVERSE_SCORED]**  
`C2`  
I worry that using AI will make my writing less my own.  
Me preocupa que usar IA haga que mi escritura sea menos mía.

**[SCALE 1–5 | required | same labels]**  
`C3`  
I can tell when AI advice is useful and when it isn't.  
Puedo distinguir cuándo un consejo de IA es útil y cuándo no lo es.

**[SCALE 1–5 | required | same labels]**  
`C4`  
I feel in control of my own writing even when I use AI tools.  
Me siento en control de mi propia escritura incluso cuando uso IA.

---

**[SECTION BREAK]**  
Part D — Your Experience with Tu Pana · Tu experiencia con Tu Pana  
*Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).*  
*Califica del 1 (Muy en desacuerdo) al 5 (Muy de acuerdo).*

---

**[SCALE 1–5 | required | same labels]**  
`D1`  
Tu Pana helped me do my own writing rather than doing it for me.  
Tu Pana me ayudó a realizar mi propio trabajo escrito, no lo escribió por mí.

**[SCALE 1–5 | required | same labels]**  
`D2`  
The step-by-step structure helped me develop my ideas.  
La estructura paso a paso me ayudó a desarrollar mis ideas.

**[SCALE 1–5 | required | same labels]**  
`D3`  
I could communicate with Tu Pana in my preferred language.  
Pude comunicarme con Tu Pana en el idioma que prefiero.

**[SCALE 1–5 | required | same labels]**  
`D4`  
Tu Pana's feedback helped me make my own decisions about my writing.  
Los comentarios de Tu Pana me ayudaron a tomar mis propias decisiones sobre mi escritura.

**[SCALE 1–5 | required | same labels]**  
`D5`  
I would use Tu Pana again for a future writing assignment.  
Usaría Tu Pana de nuevo para una futura tarea de escritura.

---

**[SECTION BREAK]**  
Part E — Reflection · Reflexión  
*Answer in English, Spanish, or both — whatever feels most natural.*  
*Responde en inglés, español, o ambos — lo que se sienta más natural.*

---

**[PARAGRAPH | not required]**  
`E1`  
What was the most useful thing Tu Pana did for your writing?  
¿Qué fue lo más útil que hizo Tu Pana para tu escritura?

**[PARAGRAPH | not required]**  
`E2`  
What would you change or improve about Tu Pana?  
¿Qué cambiarías o mejorarías de Tu Pana?

**[PARAGRAPH | not required]**  
`E3`  
At the end of this process, do you feel the writing you completed is truly your own work? Why or why not?  
Al final de este proceso, ¿sientes que el trabajo escrito que completaste es realmente tuyo? ¿Por qué sí o por qué no?

---

## Section 5 — Analysis Guide

### Paired comparisons (pre → post)

| Scale | Items | What a change means |
|-------|-------|---------------------|
| Writing Self-Efficacy | B1–B5 (sum or mean) | Increase = students feel more confident as writers after Tu Pana |
| AI Critical Confidence | C1, C3, C4 (sum) | Increase = students feel more agency with AI |
| AI Concern | C2 (single item, reverse-scored) | A decrease may indicate reduced fear about AI and authorship. A stable high score or increase may also reflect growing critical awareness — document both patterns rather than treating one direction as the only positive outcome. |

**Minimum for reporting:** 5 paired responses. With N=5–10, use Wilcoxon signed-rank test (nonparametric). With N>15, a paired t-test is appropriate.

### Post-only measures

| Scale | Items | What it measures |
|-------|-------|-----------------|
| Pedagogy Fidelity | D1 | Did the tool honor the student-writes-first principle? |
| Structure Effectiveness | D2 | Did the 10-stage scaffold help? |
| Language Access | D3 | Did bilingual design serve the student? |
| Coaching Quality | D4 | Did feedback preserve student agency? |
| Retention | D5 | Would they return? |

### Qualitative
- E1: Positive experience signal → feeds award application narrative
- E2: Iteration signal → feeds next development cycle
- E3: Authorship perception → most IRB-relevant qualitative item; documents that students claimed their own work

---

## Section 6 — Timing (4-week summer course)

| Week | Action |
|------|--------|
| Week 1, Day 1 | Distribute pre-survey links before students open Tu Pana |
| Weeks 1–3 | Students work through Tu Pana's 10 stages |
| Week 4 | Final writing assignment submitted; distribute post-survey links same day or within 24 hours |

*This timing is for LAC 118. For longer courses, the pre/post window can expand — the instrument does not change.*

---

*Next: Apps Script to build both forms automatically and generate the distribution sheet.*
