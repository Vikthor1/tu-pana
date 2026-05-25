# Phase 1: AI-Assisted Project-Memory Architecture

*Designed for Victor Torres-Vélez — solo academic developer, 2026-05-24*
*Grounded in existing Tu Pana infrastructure at `/Users/Victor1/Sites/tupana/`*

---

## 1. Folder Structure

### GitHub Repo (`tupana/docs/`)

Your existing `docs/` structure is sound. Add exactly one subdirectory:

```
docs/
  project-brief.md              ← CANONICAL (committed, read-only for NLM)
  current-architecture.md       ← CANONICAL (committed, read-only for NLM)
  session-status.md             ← CANONICAL (committed, updated each session)
  architecture-prep.md          ← CANONICAL (committed)
  obsidian-workflow.md          ← CANONICAL (update with NLM section — see §7)
  hermes-role.md                ← CANONICAL (committed)
  notebooklm-exports/           ← NEW: curated NLM upload staging
    README.md                   ← upload policy, forbidden categories
    pedagogy-packet.md          ← curated from project-brief (safe to upload)
    architecture-packet.md      ← curated from current-architecture (sanitized)
    session-digest.md           ← quarterly human-curated changelog summary
  workflow/                     ← CANONICAL (as-is)
    context-packet-template.md  ← NEW: reusable Claude session template
    ai-roles.md                 ← CANONICAL
    hermes-onboarding.md        ← CANONICAL
    aider-prep.md               ← CANONICAL
  decisions/                    ← CANONICAL (as-is)
  testing/                      ← CANONICAL (as-is)
  releases/                     ← CANONICAL (as-is)
  ideas/                        ← CANONICAL (as-is)
  pilot/                        ← CANONICAL, FERPA-adjacent (never upload)
  audits/                       ← CANONICAL, internal (never upload)
```

`SYSTEM_MEMORY.md` stays at project root, local-only, never committed. It is a **fast re-entry aid**, not a NLM source.

### Obsidian Vault Strategy

Keep Tu Pana's vault as the project root — it already works. Do not change it.

For multi-project scaling, open a **second vault** at `/Users/Victor1/000 Nvim Writing Space/` as "Intellectual Projects." It already contains your research-proposal workflow and will house book and academic writing context. These are two separate vaults — do not link them. One project, one vault.

For the book prospectus, no Obsidian vault needed yet. LaTeX in `Documents/Manual Library/` + Claude sessions + your memory system is sufficient. Add Obsidian only if the writing process demands navigation of a large note corpus.

### Local NotebookLM Export Staging (NOT in any repo)

```
~/NotebookLM-Exports/            ← local only, never committed, never synced
  tu-pana/
    [curated export files, timestamped]
  book-prospectus/
    [safe summaries only — no manuscript text]
  cuny-proposal/
    [when active]
  _templates/
    export-packet-template.md    ← what every export file must include
```

This folder is your upload buffer. Nothing goes to NotebookLM that hasn't passed through here with deliberate review. If a file sits in `~/NotebookLM-Exports/` for more than a week without being uploaded, it needs to be updated before upload.

### Claude Context Packets

Context packets are **ephemeral** — created at session start, discarded after the session. They are not stored. The **template** is stored at `docs/workflow/context-packet-template.md` (see §6). Filling in a fresh packet from the template takes 5 minutes and is the entire session-start discipline.

### Multi-Project Scaling Path

When a new project reaches maturity (≥ 5 sessions of active work), it gets:

- A `SYSTEM_MEMORY.md` at its root (local, non-committed)
- A `docs/notebooklm-exports/` subfolder with `README.md` + initial packets
- A NotebookLM notebook (1–2 per project)
- An entry in `~/NotebookLM-Exports/[project-name]/`

Book and research projects get only the NotebookLM notebook — no `SYSTEM_MEMORY.md` unless they involve code.

---

## 2. Tu Pana File Classification

### Remain Canonical Only (never upload to NotebookLM)

| File / Folder | Reason |
|---|---|
| `index.html` | Full source, too large, contains student-facing UI markup |
| `assets/js/*.js` | Source code — dynamic, not useful for NLM synthesis |
| `assets/css/styles.css` | Styling only |
| `SYSTEM_MEMORY.md` | Local briefing, changes every session, stale risk |
| `server/` | Cloudflare Worker, API key proximity |
| `config.js` | Contains API URL configuration |
| `docs/pilot/` | FERPA-adjacent, student materials |
| `docs/audits/` | Internal process notes |
| `docs/ideas/` | Speculative, unvalidated |
| `*.mjs` test files | Internal QA tooling |
| Agent instruction files (`agent-knowledge-*.md`) | Internal prompt engineering — upload risks prompt injection via NLM synthesis |
| `stress-test-*.js` | Internal tooling |
| `docs/archive/` | Describes older app versions — injects false history |

### Safe to Export to NotebookLM (after review)

| File | Status |
|---|---|
| `docs/notebooklm-faculty-podcast-source-packet.md` | **Already prepared** — upload as-is |
| `docs/project-brief.md` | Safe as-is — pure pedagogy, zero secrets |
| `docs/decisions/architecture-principles.md` | Safe — design constraints, no code |
| `docs/notebooklm-exports/pedagogy-packet.md` | Create from project-brief (see §10) |
| `docs/notebooklm-exports/architecture-packet.md` | Create from current-architecture (sanitized) |
| `docs/notebooklm-exports/session-digest.md` | Create once per milestone (see §10) |
| `README.md` (project root) | Check before upload — may contain GitHub URLs |

### Never Upload to NotebookLM

- Student writing samples of any kind (current or past)
- API keys, tokens, or any `.env` adjacent content
- `server/` directory or any Cloudflare Worker content
- Anything from `docs/pilot/` (pilot testing materials, feedback forms, student-adjacent data)
- The book prospectus manuscript (unpublished, copyright, academic integrity)
- CUNY proposal drafts (confidential until submitted)
- LaTeX source files from `Documents/Manual Library/`
- `SYSTEM_MEMORY.md` (stale risk and internal implementation detail)
- Any Playwright test output files or screenshots

---

## 3. NotebookLM Notebook Structure

**Phase 1: Three Notebooks Only**

### Notebook 1 — `Tu Pana: Pedagogical Core`

**Purpose:** Ground every conversation about what Tu Pana *is* and *why it exists*. Use for grant writing, award applications, IRB rationale, faculty communication, and philosophical orientation.

**Sources to upload:**
- `docs/notebooklm-faculty-podcast-source-packet.md`
- `docs/project-brief.md`
- `docs/notebooklm-exports/pedagogy-packet.md` (once created)

**Do not use for:** Code architecture questions, debugging, live implementation decisions.

**Refresh trigger:** Upload new sources when a major pedagogical revision occurs (not every session).

### Notebook 2 — `Tu Pana: Architecture & Design Decisions`

**Purpose:** Ground architectural orientation queries — how the system is structured, what constraints survived, what was decided and why. Not a live code reference.

**Sources to upload:**
- `docs/notebooklm-exports/architecture-packet.md` (once created)
- `docs/decisions/architecture-principles.md`
- `docs/notebooklm-exports/session-digest.md` (once created — quarterly update)

**Do not use for:** Active coding sessions, debugging, live state queries. For those, use `SYSTEM_MEMORY.md` + Claude Code directly.

**Refresh trigger:** After each major milestone (Tier completion), update `session-digest.md` and re-upload.

### Notebook 3 — `Intellectual Projects: Cross-Domain Synthesis`

**Purpose:** A synthesis layer across your academic work — connecting the book, the research proposals, the OER work, and the software project thematically. Use for grant writing where project connections matter, for keynote/talk preparation, and for understanding your own scholarly arc.

**Sources to upload (Phase 1 stubs only):**
- A one-page `cross-project-overview.md` you write (not uploaded from any existing file)
- Add book/proposal export packets here in Phase 2 — do not rush this notebook

**Naming convention:** All source files uploaded to this notebook must carry a project prefix in filename (`tupana-`, `book-`, `cuny-`, etc.) so the notebook can distinguish sources.

**Refresh trigger:** When beginning a new grant application, award submission, or talk.

**Phase 2 Notebook Stubs (do not create yet):**
- `Book: Research & Argumentation Layer`
- `Tu Pana: Session History & Evolution`
- `Research Proposals: Active Pipeline`

**Naming Convention for All Notebooks:**
`[Project Scope]: [Layer Name]` — human-readable, not date-suffixed. Dates belong in the source files, not notebook names. This way the notebook is a stable reference point.

---

## 4. Safe-Source Pipeline Architecture

Information flows in one direction only. Feedback never flows backward from NotebookLM into canonical sources.

```
LAYER 0: CANONICAL TRUTH
  GitHub repo (committed docs/)
  Obsidian vault (mirrors docs/)
  Local SYSTEM_MEMORY.md (dynamic, non-committed)
          │
          │  HUMAN-CURATED EXPORT
          │  (you review, sanitize, date-stamp)
          ▼
LAYER 1: EXPORT STAGING
  ~/NotebookLM-Exports/[project]/
  docs/notebooklm-exports/
          │
          │  MANUAL UPLOAD
          │  (deliberate, timestamped, category-checked)
          ▼
LAYER 2: NOTEBOOKLM SYNTHESIS
  Notebook 1 (Pedagogy)
  Notebook 2 (Architecture)
  Notebook 3 (Cross-Domain)
          │
          │  TARGETED QUERY → EXTRACT RELEVANT SUMMARY ONLY
          │  (1 query per session, paste only what's relevant)
          ▼
LAYER 3: CLAUDE CONTEXT PACKET
  Ephemeral session document (< 2000 tokens total)
  Assembled from: NLM summary + SYSTEM_MEMORY excerpt + task description
          │
          │  IMPLEMENTATION SESSION
          ▼
LAYER 4: CODE + DOCS
  Claude Code edits files
  You review and accept changes
          │
          │  CANONICAL DOC UPDATES (after each session)
          ▼
LAYER 0: CANONICAL TRUTH (updated)
  docs/current-architecture.md updated
  SYSTEM_MEMORY.md updated
  docs/session-status.md updated
```

The discipline is simple: **the arrow never reverses.** NotebookLM synthesis is never manually copied back into `docs/` as a canonical update. If NotebookLM gives you an insight worth preserving, you write it yourself into the canonical doc.

---

## 5. Token-Maximization Policy for NotebookLM

### Retrieval Limits

- **One NotebookLM query per session maximum.** If you need more than one query, your session is under-prepared — stop, read `SYSTEM_MEMORY.md` more carefully.
- Query format: one specific, concrete question. No open-ended "summarize the project" queries.
- Extract from NLM response: only the specific paragraph(s) that answer the question. Discard the rest.

### Context Packet Size Constraints

- NLM-derived content in a context packet: **≤ 800 tokens** (approximately 600 words)
- Total context packet: **≤ 2000 tokens**
- Task description: ≤ 100 tokens (one sentence)
- Architecture constraints: ≤ 300 tokens (3–5 bullets)
- File excerpt (if needed): ≤ 500 tokens (specific function or section, never full `ui.js`)

### When NOT to Use NotebookLM

- **Pure coding tasks** — you need SYSTEM_MEMORY.md + the specific file, not synthesis
- **Sessions less than two weeks from last session** — your git log + SYSTEM_MEMORY is faster and more current
- **Debugging** — NLM never helps with bugs; use the code and tests
- **Anything where the answer is in SYSTEM_MEMORY.md** — that file exists precisely so you don't have to go further
- **New sessions immediately after committing** — the code is the truth; NLM lags

### How to Avoid Token Inflation

- NLM is orientation-level context, not implementation-level context. It answers "what is this project philosophically?" not "where is this function?"
- Paste NLM output into the packet as a 2–3 sentence distillation, not as a quoted block
- If you find yourself pasting more than 3 paragraphs from NLM into a context packet, stop — you are over-loading context, not grounding it
- The session-digest.md notebook source should never exceed 1500 words — if it does, it's a document, not a digest

### Refresh Policy

Update NLM notebook sources:
- After each Tier completion (not each session)
- Before a major award submission, grant application, or IRB filing
- When pedagogy changes fundamentally (not cosmetically)

Never upload a source file that hasn't been reviewed in the current session.

---

## 6. Reusable Claude Context-Packet Template

Save this to `docs/workflow/context-packet-template.md`. Fill it fresh every session in 5 minutes.

```markdown
# Context Packet — [Project] — [YYYY-MM-DD]

## Task
[One sentence. What specifically must happen. E.g., "Add Stage 11 scaffolding hook to goToStage() in ui.js."]

## Architecture Constraints
[2–4 bullets — only constraints directly relevant to this task]
- [e.g., "Guardrail: coach cannot generate prose — this rule must survive every change"]
- [e.g., "No build step — vanilla JS only, no imports or bundlers"]
- [e.g., "Stage 6 authorship gate: draftSaved === true required before revision feedback"]

## Recent Context
[1–3 bullets from git log or SYSTEM_MEMORY — what changed recently that matters here]
- [e.g., "Session 40 (commit b2d5f78): Voice Vault inline protect button added"]
- [e.g., "SYSTEM_MEMORY §3 covers current modular file structure"]

## Pedagogical Rules (only if task touches coaching logic, prompts, or AI behavior)
- [specific rule that applies — e.g., "ABSOLUTE AUTHORSHIP RULE: no copy-ready prose"]

## Files Allowed to Edit
- `assets/js/[filename].js` — [what it contains, why it's the right place]

## Files Forbidden to Edit
- `assets/js/ui.js` (full file) — too large; extract only the relevant function
- `assets/js/genre-template.js` — only if task explicitly changes template structure

## Tests Required Before Final Report
- [ ] [specific Playwright test file, e.g., `node --experimental-vm-modules ...toolkit_test.mjs`]
- [ ] [specific manual QA step, e.g., "Stage 8 anti-rewrite: select a phrase, verify coach asks question not rewrites"]

## NotebookLM Grounding (leave blank if not used this session)
[2–3 sentence distillation from NLM query, if orientation was needed]
```

Fill this in 5 minutes or less. If it's taking longer, you're over-preparing — the task is not well-defined yet.

---

## 7. Typical Coding Session Workflow

```
1. IDENTIFY TASK (2 min)
   Read docs/session-status.md → confirm "WHERE WE LEFT OFF" and next task.
   If gap > 2 weeks: also run `git log --oneline -5`.

2. ORIENT (3 min)
   Read SYSTEM_MEMORY.md (§1 Project Identity + §3 Architecture + WHERE WE LEFT OFF).
   Confirm: Tier status, latest commit, next task.
   Skip full re-read if gap < 1 week.

3. DECIDE: NOTEBOOKLM OR NOT (1 min)
   Query NLM ONLY IF one of these is true:
   - You need philosophical/pedagogical grounding (grant, award, IRB, talk)
   - You need architectural orientation after a gap > 4 weeks
   - You are starting a new milestone and want synthesis of prior decisions
   OTHERWISE: skip to step 5.

4. NOTEBOOKLM QUERY (5 min, if needed)
   Open relevant notebook. Ask ONE specific question.
   Extract ONLY the relevant 2–3 paragraphs.
   Distill into 2–3 sentences for context packet.

5. DRAFT CONTEXT PACKET (5 min)
   Fill template from docs/workflow/context-packet-template.md.
   Total packet < 2000 tokens. NLM content < 800 tokens.

6. OPEN CLAUDE CODE SESSION
   Paste context packet.
   Provide specific file excerpt (not full ui.js — extract the function).
   State task clearly in one sentence.

7. IMPLEMENT
   Review every change before accepting.
   Verify pedagogical guardrails survive if touching coaching logic.
   Do not accept changes to forbidden files.

8. TEST
   Run relevant Playwright test OR follow qa-scenarios.md for the affected path.
   Confirm no regression in adjacent stages.

9. UPDATE CANONICAL DOCS (5 min — do not skip)
   New function, key, or stage behavior? → Update docs/current-architecture.md.
   Update SYSTEM_MEMORY.md WHERE WE LEFT OFF section.
   Update docs/session-status.md.
   Commit: `git commit -m "feat/fix: [description]"`

10. OPTIONAL: EXPORT PACKET MAINTENANCE
    Only if reaching a Tier milestone: update session-digest.md and
    re-upload to NLM Notebook 2. Do not do this mid-sprint.
```

Total overhead from this workflow: approximately 15 minutes. Steps 3–4 are skipped in most coding sessions.

---

## 8. Future-Proofing Analysis

**MCP Integration (Phase 2+)**
Phase 1's manual bridge does exactly what MCP would do — it is a slow-motion MCP. The clean separation between canonical docs, export staging, and NLM means that when NotebookLM releases a stable API, you slot in an automated export step between Layers 0 and 1 without restructuring anything. The context-packet template works identically whether NLM is queried manually or via MCP. Your Phase 1 discipline is practicing the information-flow hygiene that makes Phase 2 automation safe.

**Multiple Simultaneous Projects**
The 3-notebook structure with project-prefixed source filenames scales cleanly. Each new active project (book, proposal, new app) gets: one `notebooklm-exports/` folder, one NLM notebook, and a `SYSTEM_MEMORY.md` if it involves code. The cross-project notebook absorbs thematic synthesis across all of them. The context-packet template is project-agnostic — only the "Architecture Constraints" and "Files" sections change per project.

**Book-Writing Workflows**
The book prospectus exports only a one-page **synthesis summary** to NLM — never the manuscript, never the LaTeX source. The NLM notebook serves for grant writing (connecting the book to funding priorities) and talk preparation (orienting you on your own argument quickly). The manuscript stays in `Documents/Manual Library/` under pdflatex — your existing system is correct.

**Academic Research Continuity**
The research-proposal workflow already has its own folder structure and Fish commands. Add a `notebooklm-exports/` subfolder per proposal when you need NLM synthesis for a specific grant. The cross-project NLM notebook is the synthesis layer across all proposals. Nothing about the existing `wp-*` workflow changes.

**AI-Provider Changes**
Nothing in Phase 1 is Claude-specific. The context-packet template works verbatim for ChatGPT, Gemini, or any future provider. If Anthropic changes Claude Code significantly, the workflow is unaffected — you are feeding a template, not relying on provider-specific features. The token-maximization policy is if anything more relevant under a different provider with a smaller context window.

---

## 9. Risk Analysis

| Risk | Severity | Mitigation |
|---|---|---|
| **Token bloat from NLM pasting** | High | Strict 800-token cap on NLM-derived content per packet; distill, don't quote |
| **Stale NLM summaries** | Medium | Timestamp every export packet; update only at milestones; NLM never touches current code state |
| **Hallucinated NLM synthesis** | Medium | NLM is orientation only — never the authority on code or architecture; verify against canonical docs before acting |
| **Uploading sensitive content** | High | Explicit forbidden list (§2); `notebooklm-exports/README.md` as gate; `~/NotebookLM-Exports/` buffer as review point |
| **Dependency fragility** | Low | Phase 1 is fully manual; zero automation; NLM is optional, not in the critical path |
| **FERPA / privacy leakage** | High | Pilot materials (`docs/pilot/`) never leave the repo; student writing samples are categorically excluded from all exports; no exceptions |
| **Workflow complexity creep** | Medium | Phase 1 adds exactly two new habits: (a) maintain export packets, (b) use NLM for orientation queries. All other existing habits unchanged. |
| **Archive injection** | Medium | `docs/archive/` already labeled "DO NOT inject as AI context" — same policy applies to NLM upload |
| **Export packet staleness** | Low | Session-digest.md is a quarterly summary, not a per-session log — low maintenance burden |

---

## 10. Implementation Checklist

Execute over 3–4 days. Total time: approximately 3–4 hours.

### Day 1 — Repository Structure (60 min)

- [ ] Create `docs/notebooklm-exports/` in Tu Pana repo
- [ ] Write `docs/notebooklm-exports/README.md`:
  - what this folder is (NLM upload staging, committed to repo)
  - upload policy (must be reviewed before upload)
  - forbidden categories (no source code, no pilot materials, no API config, no student data)
- [ ] Create `docs/notebooklm-exports/pedagogy-packet.md`:
  - Curate from `docs/project-brief.md` — restructure as a 600–800 word NLM-ready overview
  - Do not write new content; synthesize and tighten what exists
  - Add frontmatter: `Last updated: 2026-05-24 | Source: project-brief.md | Upload-safe: YES`
- [ ] Create `docs/notebooklm-exports/architecture-packet.md`:
  - Curate from `docs/current-architecture.md`
  - Strip all internal URLs, API endpoints, and config values
  - Keep: file structure table, stage logic table, key function names (no signatures), design decisions
  - Add frontmatter with date and source
- [ ] Create `docs/workflow/context-packet-template.md` from the template in §6
- [ ] Commit: `docs: add notebooklm-exports folder and context-packet template`

### Day 2 — NotebookLM Setup (45 min)

- [ ] Open NotebookLM — create notebook "Tu Pana: Pedagogical Core"
  - Upload: `pedagogy-packet.md`, `notebooklm-faculty-podcast-source-packet.md`
  - Test one query: "What is Tu Pana's core philosophical claim about student authorship?"
  - Verify: answer is grounded, no hallucination, cites sources correctly
- [ ] Create notebook "Tu Pana: Architecture & Design Decisions"
  - Upload: `architecture-packet.md`
  - Upload `docs/decisions/architecture-principles.md` (review first — safe to upload)
  - Test one query: "What are the non-negotiable constraints on how the AI coach behaves?"
  - Verify: answer reflects the authorship gate and guardrail structure correctly
- [ ] Create notebook stub "Intellectual Projects: Cross-Domain Synthesis"
  - No sources yet — add a note in the notebook: "Phase 2 — add sources after first cross-project synthesis need"
  - Do not populate until you have a concrete reason (grant, talk, IRB)

### Day 3 — Local Infrastructure (30 min)

- [ ] Create `~/NotebookLM-Exports/` local folder
  - Create `~/NotebookLM-Exports/tu-pana/` subfolder
  - Copy the export packets there with date-stamped filenames: `pedagogy-packet-2026-05.md`
  - Create `~/NotebookLM-Exports/_templates/export-packet-template.md` (minimal: frontmatter + upload checklist)
- [ ] Update `docs/obsidian-workflow.md` — add a "NotebookLM" section after "How AI systems should consume project memory":
  - State which notebooks exist and their purposes
  - State the query policy (one query per session, orientation only)
  - State forbidden categories
- [ ] Commit the obsidian-workflow.md update

### Day 4 — Session Digest + Dry Run (60 min)

- [ ] Write `docs/notebooklm-exports/session-digest.md`:
  - Not per-session notes — a quarterly milestone summary covering Sessions 1–40
  - Structure: Project identity → Tiers completed → Key architectural decisions → Current state
  - Target length: 600–900 words. Write it fresh from your understanding, not by pasting from SYSTEM_MEMORY
  - Add frontmatter: `Covers: Sessions 1–40 (through 2026-05-23) | Next update: after Tier 4`
  - Upload to Notebook 2 after writing
- [ ] Run one full dry-run of the §7 workflow:
  - Identify a real upcoming task (next session, Tier 4 pilot prep)
  - Fill the context-packet template
  - Optionally query NLM for architectural context
  - Do not implement — just verify the workflow is smooth and the packet is tight
- [ ] Commit session-digest.md

### Ongoing (after Phase 1 is live)

- [ ] At each Tier completion: update `session-digest.md` + re-upload to NLM Notebook 2
- [ ] Before any grant application or award submission: query NLM Notebook 1 for grounding language
- [ ] When SYSTEM_MEMORY.md is updated: do NOT also update NLM — they serve different functions
- [ ] Review `notebooklm-exports/` contents once per semester; archive what is stale

---

## Notes

**You already built Phase 0 without naming it.** `SYSTEM_MEMORY.md`, `docs/obsidian-workflow.md`, and the faculty podcast source packet are all Phase 1 primitives. Day 1 formalizes the folder around work you've already done.

**The biggest risk in your specific setup is archive injection.** `docs/archive/` is already labeled correctly, but the project root also contains several older `.html.pre-alignment`, `.backup`, and `.original` files that could find their way into context by accident. Those are worth gitignoring explicitly or moving into `archive/`.

**The session-digest.md is the highest-leverage item in the checklist.** One 700-word quarterly digest uploaded to NLM Notebook 2 eliminates the need to re-orient a new AI session architecturally after a long gap — query NLM once, get grounded, and the context packet writes itself.
