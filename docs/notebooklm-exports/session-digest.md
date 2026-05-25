---
Last updated: 2026-05-25
Covers: Sessions 1–40, through Phase 1 Day 4 (2026-05-25)
Source: docs/session-status.md, SYSTEM_MEMORY.md, docs/current-architecture.md, git history
Upload-safe: YES
Next review: after Tier 4 completion or major architecture milestone
---

# Tu Pana de Escritura — Session Digest

*This is a quarterly milestone summary prepared for NotebookLM orientation. It is not a per-session log and does not replace canonical sources. GitHub docs, Obsidian, and SYSTEM_MEMORY.md remain authoritative. See §7 for what this digest should not be used for.*

---

## 1. Project Identity

Tu Pana de Escritura is a bilingual Spanish/English AI-assisted writing coach built for multilingual, immigrant, and Latinx students at Hostos Community College, a Hispanic-Serving Institution in the Bronx within the City University of New York system. The app guides students through ten structured writing stages, producing a mixed-genre autobiographical essay that combines personal narrative, historical and social analysis, and reflective metacognition.

The app is static — no server, no login, no cloud sync. All student data is stored locally in the browser. It is designed for iframe embedding in Brightspace, CUNY's learning management system. Offline mode is the designed default: all ten stages function without any AI connection. AI coach connectivity is optional and additive.

The project is led by Prof. Victor Torres-Vélez and is being prepared for award submission. Tier 4 requires real student pilots.

---

## 2. Major Tiers Completed

Development proceeded in three implementation tiers, all now complete.

**Tier 1 — Pre-pilot blockers:** Process log wiring (eight lifecycle events), Stage 10 Ollama branch, and the AI routing architecture (`submitChat()` → `sendCoachMessage()` → `sendMsg()`). These established the structural foundation for a live AI coach.

**Tier 2 — UX before pilot:** Six major UX features added: Stage 10 reflection and instructor-report improvements; the Five Questions evaluation modal (centered overlay / mobile bottom-sheet, silent picks); a Stage 4 research guidance card with an amber-guardrail and four bilingual clickable starters; mobile stage navigation with a progress strip; the Stage 8 Voice Polish card (five-route flow, replacing the generic revision panel at that stage); and Selection-to-Coach (a floating button that appears on draft text selection and pre-fills a stage-aware coaching frame, without auto-sending).

**Tier 3 — Architecture:** The live AI provider became Gemini Flash-Lite via a Cloudflare Worker proxy, with the full pedagogical guardrail prompt assembled and sent on every request. The provider abstraction layer (`ai-provider.js`) was introduced, along with feature flags (`genre-template.js`), a stable stage ID system, per-stage writing storage (each of the ten stages maintains its own independent textarea content), schema versioning, and the AI literacy layer (milestone-based reflection checkpoints, Skills Gains display, badge alignment, transferable AI literacy cards, and the Stage 10 capstone AI reflection field).

Additionally, the app was modularized from a single large script file into eight dedicated JavaScript modules with a fixed load order.

---

## 3. Key Architectural Decisions

Several decisions made during development are permanent constraints, not preferences.

The app uses vanilla JavaScript with no framework, no build step, and no bundler. This was chosen deliberately: the app must run in any browser, be debuggable with standard browser tools, and be maintainable without a build pipeline.

The Stage 6 authorship gate — which requires students to save an unassisted first draft before unlocking revision features — is structurally enforced in the code and has academic integrity and IRB implications. It must not be weakened.

All ten stages must function fully in offline mode. The AI coach connection is additive, not required. This reflects an equity commitment to students in low-connectivity environments.

All student-facing text exists in both Spanish and English. Bilingual parity is non-negotiable. The localStorage key names use a consistent prefix and must never be renamed while students may have active sessions, as renaming silently erases saved progress.

The feature flag system (`FEATURES` in `genre-template.js`) gates future capabilities behind explicit flags. At the time of this digest, `geminiProvider` is the only live flag; genre selection, instructor settings, and process logging remain off.

---

## 4. Current AI Provider Architecture

The live default provider is Gemini, accessed through an intermediary proxy layer rather than a direct frontend connection, which keeps API credentials off the client. The proxy handles error categorization and returns structured responses to the frontend.

The frontend uses intelligent model selection: the higher-capability Gemini Flash model is used at Stage 7 (revision) and Stage 10 (capstone), where reasoning demands are greatest; the lighter Flash-Lite model handles all other stages. The retry logic handles transient failures with exponential backoff.

Ollama (a local model runner) is also supported as a secondary provider for development and low-connectivity use cases. Valid provider modes are `offline`, `ollama`, and `gemini`.

---

## 5. Current Memory and Workflow Architecture

The project uses a layered memory system. `SYSTEM_MEMORY.md`, located at the project root, is a local-only file (not committed to git) that serves as the fast re-entry briefing for AI-assisted coding sessions — it contains current Tier status, the most recent commit, key functions, and WHERE WE LEFT OFF. It is updated after every session and is the recommended starting point for any new session.

The committed canonical sources are `docs/project-brief.md` (pedagogical philosophy), `docs/current-architecture.md` (file map, globals, key functions, localStorage keys), and `docs/session-status.md` (detailed per-session changelog). These are readable in Obsidian since the project root is the Obsidian vault.

As of Phase 1 (initiated 2026-05-25), a NotebookLM synthesis layer has been added downstream of these canonical sources. Export packets (`docs/notebooklm-exports/`) are curated, sanitized summaries prepared for upload to NotebookLM. They are orientation-level documents — not live references and not canonical sources.

---

## 6. Current State and Next Milestone

As of Session 40 (latest pushed commit: `b2d5f78`), Tiers 1, 2, and 3 are fully complete and pushed to the main branch. The most recent change was a Voice Vault discoverability improvement — an inline "Protect selected phrase" button added directly inside the Voice Vault panel at Stage 8.

The next milestone is **Tier 4: Pilot Logistics**, which requires real students. No further blocking code work exists. Tier 4 items include: recruiting and facilitating a five-student pilot; collecting pre/post surveys; exporting the revision decision log for IRB documentation; gathering student testimonials; and producing accessibility, privacy, and instructor-reflection documentation.

Phase 1 of the AI-assisted memory architecture was also completed in parallel with the code freeze, establishing the NotebookLM synthesis layer and context-packet workflow described in `docs/phase1-memory-architecture.md`.

---

## 7. What This Digest Should Not Be Used For

This digest is an orientation document. It should not be used for:

- **Active coding sessions** — use `SYSTEM_MEMORY.md` and `docs/current-architecture.md` directly
- **Debugging** — consult the source code and test files
- **Current code state** — this digest is a milestone snapshot; it does not reflect individual commits after its last-updated date
- **Canonical architectural decisions** — verify against `docs/current-architecture.md` and `docs/decisions/architecture-principles.md`
- **Anything involving student data, pilot outcomes, or IRB materials** — those sources are categorically excluded from this document and from NotebookLM

If a NotebookLM answer derived from this digest conflicts with what you observe in the codebase or canonical docs, trust the codebase and canonical docs. Update this digest; do not modify the canonical source to match the digest.
