---
Last updated: 2026-05-25
Source: docs/project-brief.md
Upload-safe: YES
Next review: after Tier 4 completion or substantive pedagogy change
---

# Tu Pana de Escritura — Pedagogical Synthesis

## What the app is

Tu Pana de Escritura ("Your Writing Companion") is a bilingual Spanish/English AI-assisted writing coach designed for multilingual students at Hostos Community College, a Hispanic-Serving Institution in the Bronx that is part of the City University of New York. The app guides students through ten structured stages of writing, culminating in a mixed-genre autobiographical essay that combines personal narrative, historical and social analysis, and reflective metacognition.

The app is static — it runs entirely in the browser, requires no login, and stores all student data locally on the student's device. It is designed to be embedded as an iframe within Brightspace, CUNY's learning management system, so that students can use it without leaving the course environment.

## Core pedagogical philosophy

Tu Pana is built on three non-negotiable commitments that must survive every future change to the app.

**1. Anti-ghostwriting by design.** The app does not generate student text under any circumstances. The AI coach asks questions, reflects ideas back to the student, challenges assumptions, and offers structured frameworks — but it never writes for the student. This is not a technical limitation; it is a deliberate pedagogical and ethical choice. The app is built on the conviction that the intellectual labor of writing belongs to the student, and that an AI coach which generates text bypasses the thinking process that makes writing educationally meaningful.

To enforce this commitment structurally, Stage 6 includes an explicit authorship gate: students must save their draft — documenting an unassisted first draft at a fixed point in the process — before they can advance to revision. This gate has academic integrity and IRB implications and must not be weakened or bypassed.

**2. Student voice as non-negotiable.** The revision protocol in Stages 7 and 8 is organized around the Five Questions — a fixed set of evaluative criteria centered on Accuracy, Voice, Specificity, Thinking, and Cultural Knowledge. These questions ask the student to judge their own work, not to accept the AI's assessment. Students rate coaching feedback, log revision decisions, and have the option to protect phrases from AI suggestions using the Voice Vault — a feature in Stage 8 that lets students mark and preserve their own language as off-limits for AI modification. This architecture positions the student as the authority over their own writing.

**3. Bilingual parity.** All student-facing language in the app exists in both Spanish and English simultaneously. The language switcher — available as ES, EN, or ES·EN (both) — is a preference setting, not an access gate. Code-switching and bilingual expression are treated as legitimate rhetorical resources, not errors to be corrected. Any future feature must include Spanish and English equivalents; English-only additions are not permitted.

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

## What must not change without deliberate review

The Stage 6 authorship gate logic, the Five Questions revision protocol, the Voice Vault flow, all student-facing Spanish language, localStorage key names (renaming them would break active student sessions), and the script load order are all frozen as non-negotiable design constraints. Any future modification to these elements requires a deliberate architectural review, not a routine edit.
