# Tu Pana de Escritura

A static, browser-based writing process web app for bilingual students at CUNY Hostos Community College. Tu Pana guides students through a structured 10-stage mixed-genre essay process: personal anecdote, historical connection, topic pitch, research, outlining, unassisted first draft, revision with the Five Questions protocol, voice polish, submission checklist, and final self-assessment. Students generate a downloadable process report for instructor review.

---

## Current Pilot Version

- Plain HTML, CSS, and JavaScript — no framework
- Single file: `index.html`
- No backend
- No database
- No login or user accounts
- No server-side student data storage (all data stays in the browser via `localStorage`)
- No build step
- No paid API dependency in the public version
- AI coach connection is optional; the app works fully offline without it

---

## Local Preview

```bash
python3 -m http.server 8000
```

Then open: [http://localhost:8000](http://localhost:8000)

> Opening `index.html` directly via `file://` also works for basic testing, but `python3 -m http.server` more closely matches the GitHub Pages environment.

---

## GitHub Pages Deployment

Recommended settings in **Settings → Pages**:

| Setting | Value |
|---|---|
| Source | Deploy from a branch |
| Branch | `main` |
| Folder | `/ (root)` |

Expected URL pattern:

```
https://YOUR-GITHUB-USERNAME.github.io/tu-pana/
```

No build step, no configuration files, no Actions workflow required.

---

## Pilot Workflow

The app is designed to be linked or embedded in Brightspace as an iframe or external tool link. Students work through the 10 writing stages inside the app. At Stage 10, they complete a self-assessment and generate an **Instructor Process Report** that documents their writing process. They copy or download the report and submit it through Brightspace alongside their final essay, as directed by the instructor.

---

## AI Coach (Optional)

The AI coach connects via Microsoft Copilot Studio and the Bot Framework Direct Line API. The `CONFIG.directLineSecret` field in `index.html` is intentionally blank in this public version. To enable the live coach, an instructor pastes their own Direct Line secret into that field in a private copy of the file. The app runs fully without the coach connected.

---

## Privacy

All student writing, chat history, revision decisions, and process data are stored exclusively in the student's own browser (`localStorage`). No data is transmitted to any server by the app itself. The Direct Line API call, if the coach is configured, sends only the student's chat messages to the configured bot endpoint.
