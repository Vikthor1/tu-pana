# Tu Pana de Escritura — Project Brief

## What it is

A bilingual (Spanish/English) AI-assisted writing coach for multilingual students at Hostos Community College, CUNY. Students write a mixed-genre autobiographical essay through 10 guided stages. The app is static — no server, no build step, no login. All student data stays in the browser via `localStorage`.

## Pedagogical philosophy

Tu Pana is built on three commitments that must survive every future change:

1. **Anti-ghostwriting by design.** The app does not generate student text. The AI coach asks questions, reflects, and challenges — it does not write for students. Stage 6 has an explicit authorship gate: students must save their draft *before* they can advance to revision, documenting unassisted authorship at a fixed point.

2. **Student voice as non-negotiable.** The revision protocol (Stage 7–8) is built around the Five Questions, which center the student's *own* judgment about what to keep, change, or reject. The Voice Vault (Stage 8) lets students protect phrases from AI suggestions. Students rate coaching feedback rather than accepting it.

3. **Bilingual parity.** All student-facing language exists in both Spanish and English simultaneously. The language switcher (ES / EN / ES·EN) is a preference, not a gate. Do not add English-only features or strings without Spanish equivalents.

## The 10 stages

| # | Name | Key behavior |
|---|------|-------------|
| 1 | Anécdota | Personal moment — free writing |
| 2 | Conexión | Connecting experience to context |
| 3 | Tu Pitch | Topic pitch — 4–6 sentence argument in the student's own words |
| 4 | Investigación | Research questions and sources |
| 5 | Esquema | Essay outline |
| 6 | Borrador | **Authorship gate** — save before advancing |
| 7 | Revisión | Five Questions protocol + revision decisions log |
| 8 | Pulir Voz | Voice polish + Voice Vault |
| 9 | Checklist | Verify all submission materials are complete before turning in |
| 10 | Capstone | Self-assessment (10A) → Coach perspective (10B) → Student response (10C) → Instructor Report |

## Technical constraints (intentional, not incidental)

- No framework (React, Vue, etc.)
- No build step
- No backend
- No paid API in the public version
- AI coach connection is optional — offline mode is the default and is fully functional
- Data stored in `localStorage` only
- Designed to embed as an iframe in Brightspace (CUNY LMS)

## What must not change without deliberate review

- Stage 6 authorship gate logic (`executeSave`, `updateDraftControls`)
- The Five Questions array (`EVAL_QUESTIONS` in ui.js)
- The Voice Vault protect/locate/remove flow (`injectVoiceVaultPanel`, `renderVoiceVault`)
- Any student-facing string in Spanish
- The localStorage key names (renaming them breaks existing student sessions)
- The script load order: `config → data → genre-template → prompts → ai-provider → storage → ui → app`
