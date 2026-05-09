# Release Checklist — Tu Pana de Escritura

Run this before every `git push origin main`. Takes about 10 minutes.

---

## 1. Local server

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser with `tupana_*` localStorage cleared (or use a clean profile).

---

## 2. Core flow

- [ ] Tu Conocimiento modal appears on fresh load
- [ ] El Laboratorio opens after Tu Conocimiento completes
- [ ] Stage 1 loads after El Laboratorio completes
- [ ] Welcome message appears in the chat panel

---

## 3. Stage 6 authorship gate *(run every release, no exceptions)*

- [ ] Continuar is disabled on arrival at Stage 6
- [ ] Guardar is shown full-width as the dominant CTA
- [ ] Guardar with draft text → save ceremony modal appears
- [ ] After ceremony: editor is read-only, Continuar is enabled
- [ ] Continuar → Stage 7 loads with revision panel

---

## 4. Language modes

- [ ] ES mode: only Spanish visible in student-facing text
- [ ] EN mode: only English visible
- [ ] ES·EN mode: both visible simultaneously

---

## 5. Mobile at ≤480px

- [ ] Tab interface appears (Borrador / Mi Pana tabs)
- [ ] Switching tabs works
- [ ] Chat notification dot appears when coach responds

---

## 6. Browser console

- [ ] No JS errors on fresh load
- [ ] No errors during stage progression

---

## Documentation check

- [ ] Changed file map, globals, or localStorage keys → updated `docs/current-architecture.md`
- [ ] Added new UI component or stage behavior → updated `prompts/qa-scenarios.md`
- [ ] Added a new file that should deploy → added it to `.gitignore` allowlist

---

## Commit and push

```bash
git add <specific files only>
git commit -m "Description of what changed and why"
git push origin main
```

GitHub Pages deploys automatically. Verify at your Pages URL after ~60 seconds.

---

## Out of scope for this checklist

- AI coach behavior (DirectLine / Dify) — test separately per coach configuration
- Brightspace iframe embedding — test separately in Brightspace
- Cross-browser testing beyond Chrome/Firefox — deferred until pilot rollout
