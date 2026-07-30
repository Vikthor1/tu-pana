# Tu Pana de Escritura

A bilingual (Spanish/English) AI-assisted writing coach for multilingual students at Hostos Community College, CUNY. Students write a mixed-genre autobiographical essay through 10 guided stages. At Stage 10, they complete a self-assessment and generate a downloadable Instructor Process Report.

The app is fully static — no server, no build step, no login. All student data stays in the browser.

---

## Architecture

The app is modular. `index.html` is an HTML shell that loads external files:

```
index.html                  HTML only — structure and modals
assets/
  css/
    styles.css              All CSS, including mobile breakpoints
  js/
    config.js               AI coach connection settings (edit this to change coach mode)
    data.js                 Stage definitions, icons, transitions — pure data
    prompts.js              Coaching content: micro-prompts, hints, revision guides
    storage.js              Export, import, and clear-all utilities
    ui.js                   All rendering, state, DOM interactions — the main module
    app.js                  Initialization sequence — runs once on page load
```

**Script load order is fixed:** `config → data → prompts → storage → ui → app`

---

## Files you can edit safely

| File | What to edit |
|------|-------------|
| `config.js` | Switch coach mode (`useCopilotEmbed`, `difyEmbedUrl`), change userId |
| `data.js` | Stage names, transition labels, sub-steps, word thresholds |
| `prompts.js` | Coaching text, micro-prompts, stuck affirmations, revision categories |
| `docs/*.md` | Project documentation |
| `prompts/qa-scenarios.md` | QA test scenarios |

## Files that require care

| File | Why |
|------|-----|
| `ui.js` | 4,400+ lines; contains all stage logic, authorship gate, Voice Vault, Capstone. Edit specific named functions only. |
| `styles.css` | 4,600+ lines; mobile additions at the bottom. Cascade order matters. |
| `index.html` | DOM IDs are referenced by name in ui.js. Do not rename or remove elements. |
| `app.js` | Init sequence assumes all globals from files 1–5 are ready. Order-sensitive. |

## Files that must not be changed casually

- **Stage 6 save gate** — `executeSave()` and `updateDraftControls()` in ui.js. This is the authorship documentation mechanism. It has IRB and academic integrity implications.
- **The Five Questions** — `EVAL_QUESTIONS` array in ui.js. Changing these changes the revision protocol.
- **`localStorage` key names** — renaming them silently erases existing student sessions.
- **Student-facing Spanish strings** — all bilingual content must be updated in both languages simultaneously.

---

## Local development

```bash
python3 -m http.server 8000
```

Open: `http://localhost:8000`

Add `?dev=true` to show the dev preview bar (onboarding modal shortcuts):

```
http://localhost:8000?dev=true
```

> Opening via `file://` works for basic testing, but a local server avoids CORS issues with iframe embeds.

---

## AI coach configuration

The live coach uses Gemini through a Cloudflare Worker, so the API key never
appears in browser-served code. Configure `geminiProxyUrl` in
`assets/js/config.js`; Worker setup and deployment details are in
`server/gemini-worker/README.md`. The built-in guide remains available when
the live coach is unavailable.

---

## GitHub Pages deployment

Settings → Pages:

| Setting | Value |
|---------|-------|
| Source | Deploy from a branch |
| Branch | `main` |
| Folder | `/ (root)` |

No build step, no Actions workflow required. All files in the allowlist (`.gitignore`) deploy automatically.

---

## Pilot workflow

The app embeds in Brightspace as an iframe or external tool link. Students work through 10 stages. At Stage 10, they generate an **Instructor Process Report** documenting their writing process, then copy or download it and submit via Brightspace alongside their final essay.

---

## Privacy

Drafts, chat history, revision decisions, and process notes are stored locally
in the browser. When a student asks the live coach for help, the message and
the writing explicitly included for that coaching request are sent through the
Cloudflare proxy to Gemini; Tu Pana does not store that writing on a server.
Writing or saving a draft never sends it automatically. Whole-draft coaching
occurs only after the student opens a disclosed review action and confirms it.
Local usage accounting stores aggregate token counts only.

---

## AI coach

- **Coach IA / Live AI** — Gemini through the configured Cloudflare Worker.
- **Guía sin IA / Built-in, no AI** — stage-aware guidance that keeps the
  writing workflow usable without a live model.
- **Local AI / Ollama** — retained for local development; not shown in the
  normal student mode selector.

Stages 7 and 9 offer a guided whole-draft reading. Students choose one lens;
follow-up readings ask for a revision purpose, and unchanged drafts require an
explicit different-lens choice. These are soft pedagogical safeguards, not a
hard usage quota. Drafts over 3,000 words remain reviewable, with guidance to
focus the lens or work with a passage when that would produce better feedback.

---

## Development workflow (planned)

Future changes will follow this pipeline:

```
Claude / ChatGPT → Hermes (local orchestrator) → Aider → Git
```

- **Claude / ChatGPT** — generates plans, diffs, and targeted edits
- **Hermes** — routes tasks to the correct file, enforces constraints, passes Obsidian project memory as context
- **Aider** — applies changes to the codebase
- **Git** — commits the result with a descriptive message

See `docs/hermes-role.md` for the full integration plan. **Hermes and Obsidian integration are not yet implemented** — this workflow describes the target state.

For now, use `docs/` and `prompts/qa-scenarios.md` as the manual equivalent: read them before making changes, and update them when the architecture changes.

---

## Project documentation

| File | Contents |
|------|---------|
| `docs/project-brief.md` | What Tu Pana is, pedagogical philosophy, hard constraints |
| `docs/current-architecture.md` | File map, globals, localStorage keys, stage logic, key functions |
| `docs/hermes-role.md` | Planned Hermes / Obsidian / Aider integration |
| `prompts/qa-scenarios.md` | Manual QA test scenarios for all 10 stages + mobile + edge cases |
