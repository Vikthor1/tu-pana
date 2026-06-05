---
Last updated: 2026-06-05
Source: docs/project-brief.md, 01_projects/tupana/context.md (VC-OS)
Upload-safe: YES
Next review: after pilot completion or substantive pedagogy change
---

# Tu Pana de Escritura — Pedagogical Synthesis

## What the app is

Tu Pana de Escritura ("Your Writing Companion") is a bilingual Spanish/English AI-assisted writing coach designed for multilingual students at Hostos Community College, a Hispanic-Serving Institution in the Bronx that is part of the City University of New York. The app guides students through ten structured stages of writing, culminating in a mixed-genre autobiographical essay that combines personal narrative, historical and social analysis, and reflective metacognition.

The app is static — it runs entirely in the browser, requires no login, and stores all student data locally on the student's device. It is designed to be embedded as an iframe within Brightspace, CUNY's learning management system, so that students can use it without leaving the course environment.

**Brand name:** The full official name is *Tu Pana de Escritura*. On mobile devices, the visible header label is *Tu Pana* — a deliberate short form that fits the mobile header layout and matches how students and instructors already refer to the app. Screen readers and desktop displays always show the full name. The short form is intentional branding, not truncation.

**Current status (2026-06-05):** The app is pilot-ready. Tiers 1, 2, and 3 are complete. The app is deployed on GitHub Pages and verified live. The first pilot is scheduled for LAC 118: Caribbean Society and Culture, Summer 2026 (4-week course). The next task is building the pre/post pilot survey Google Forms.

## Core pedagogical philosophy

Tu Pana is built on four non-negotiable commitments that must survive every future change to the app.

**1. Anti-ghostwriting by design.** The app does not generate student text under any circumstances. The AI coach asks questions, reflects ideas back to the student, challenges assumptions, and offers structured frameworks — but it never writes for the student. This is not a technical limitation; it is a deliberate pedagogical and ethical choice. The app is built on the conviction that the intellectual labor of writing belongs to the student, and that an AI coach which generates text bypasses the thinking process that makes writing educationally meaningful.

To enforce this commitment structurally, Stage 1 opens with an explicit framing ("Tu Pana makes questions — it does not write the essay for you"), and Stage 6 includes an authorship gate: students must save their draft — documenting an unassisted first draft at a fixed point in the process — before they can advance to revision. This gate has academic integrity and IRB implications and must not be weakened or bypassed.

**2. Student voice as non-negotiable.** The revision protocol in Stages 7 and 8 is organized around the Five Questions — a fixed set of evaluative criteria centered on Accuracy, Voice, Specificity, Thinking, and Cultural Knowledge. These questions ask the student to judge their own work, not to accept the AI's assessment. Students rate coaching feedback, log revision decisions, and have the option to protect phrases from AI suggestions using the Voice Vault — a feature in Stage 8 that lets students mark and preserve their own language as off-limits for AI modification. This architecture positions the student as the authority over their own writing.

**3. Bilingual parity and Spanish-default design.** The app is Spanish-first by default. All student-facing language exists in both Spanish and English simultaneously. The language selector — available as ES (Spanish), EN (English), or BI (bilingual/Spanglish) — is a preference setting, not an access gate. Code-switching and bilingual expression are treated as legitimate rhetorical resources, not errors to be corrected. On mobile, the language selector is a compact native dropdown (ES / EN / BI) that preserves all three modes. Spanish is the first option in all displays. Any future feature must include Spanish and English equivalents; English-only additions are not permitted.

**4. Freirean / dialogic onboarding.** Before any writing begins, students complete two onboarding modules that establish the relational and philosophical contract of the app. In *Tu Conocimiento* ("Your Knowledge"), students claim four personal knowledge assets — cultural knowledge, lived experience, language resources, and community knowledge — establishing that their lives are legitimate scholarly raw material. In *El Laboratorio* ("The Laboratory"), students answer a Freirean-style question about knowledge and authority, establishing the dialogic learning contract: Tu Pana will ask questions, not provide answers. The onboarding is not skippable for first-time users. Audio narration in Spanish accompanies the onboarding for accessibility.

## The ten stages

Tu Pana guides students through a structured ten-stage writing process:

1. **Anécdota** — students write from a personal moment; free, exploratory writing
2. **Conexión** — connecting personal experience to larger social or historical context
3. **Tu Pitch** — developing a 4–6 sentence argument in the student's own voice
4. **Investigación** — formulating research questions and identifying relevant sources
5. **Esquema** — building an essay outline from the work done in stages 1–4
6. **Borrador** — the authorship gate; students must save their first draft before advancing
7. **Revisión** — structured revision using the Five Questions protocol and a decision log
8. **Pulir Voz** — voice polish with access to the Voice Vault for protecting key phrases
9. **Checklist** — verifying all submission materials are complete before turning in
10. **Capstone** — a three-part reflective sequence: self-assessment (10A), AI coach perspective (10B), student response (10C), followed by generation of an Instructor Process Report

## The Instructor Process Report

At Stage 10 completion, the app generates a structured plain-text report that documents the student's full process: session engagement, revision decisions, authorship confirmation, Voice Vault contents, evaluation ratings, and the student's own self-assessment and final response. This report is designed to be submitted to the instructor alongside the final essay and AI transcript, providing evidence of the student's authentic authorship and intellectual engagement.

## Intentional technical constraints

The app is deliberately low-infrastructure: no frontend framework, no build step, no backend server, no paid API required for its core functionality. Offline mode is the default; AI coach connectivity is optional. This design serves equity goals — students can use the app in environments with unreliable internet, and the app functions fully without any AI connection. These constraints are not temporary limitations; they reflect the app's values as a tool designed for students in resource-constrained environments.

## The AI coach as Socratic writing companion

The AI coach in Tu Pana is explicitly framed to students as a guide that asks questions, not an assistant that produces text. This framing is structural, not cosmetic:

- Stage 1 entry shows a visible message: "Tu Pana makes questions — it does not write the essay for you."
- The Evaluar · Evaluate bar appears after every coach response, prompting students to assess AI advice against five criteria before using it.
- Students explicitly evaluate coach responses and log revision decisions; acceptance of AI advice is never assumed.
- Stage 8 includes the Voice Vault for protecting student-authored phrases from AI modification.
- The transition authorship guardrail prohibits the AI from generating copy-ready transition sentences using the student's own topic, evidence, or family content.

The result is an app where the AI's pedagogical function is to surface thinking — not to supply it.

## Mobile-first pilot refinements

For the Summer 2026 pilot, the app's mobile interface has been hardened for phone-primary use. Key refinements (June 2026):

- **Header:** Animated branding icon (laptop and coffee) added to the main header. On mobile, the visible title is "Tu Pana"; full name "Tu Pana de Escritura" is in the accessible label.
- **Language selector:** On small screens (≤480px), the three-button language pill is replaced by a compact native dropdown (ES / EN / BI), reclaiming horizontal space for the title and utility buttons.
- **Chat scroll:** iOS Safari touch-scroll bug patched; chat is fully scrollable on iPhone.
- **Progress panel:** Collapsed by default on first open, so the chat area has maximum height on small screens.
- **Bug report:** A 🐞 Problema · Problem? button in the header opens a Google Form for student-reported issues. On mobile, only the emoji is visible; the full label appears on desktop.
- **Stage orientation:** Each stage opens with a bilingual entry message in the coach panel, orienting the student before they write. A stage-to-stage import card offers (but never forces) carrying previous-stage work forward.

## What must not change without deliberate review

The Stage 6 authorship gate logic, the Five Questions revision protocol, the Voice Vault flow, all student-facing Spanish language, localStorage key names (renaming them would break active student sessions), and the script load order are all frozen as non-negotiable design constraints. Any future modification to these elements requires a deliberate architectural review, not a routine edit.

The onboarding modules (Tu Conocimiento, El Laboratorio) are also frozen as first-time-user experiences: their dialogic structure, question wording, and Freirean framing must be preserved.
