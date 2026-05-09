# Architecture Principles — Tu Pana de Escritura

*Last updated: 2026-05-09*

These are commitments that must survive every future change. Not preferences — constraints with real consequences.

---

## 1. No build step

Files are served as-is. No Webpack, Vite, Rollup, or compiler of any kind. This keeps deployment trivial (any static host) and debugging direct (DevTools reads actual source).

## 2. No frameworks

Vanilla JS and CSS only. No React, Vue, Svelte, Alpine, or component library. Readable by any developer without framework knowledge; no dependency churn.

## 3. No ES modules (`type="module"`)

All scripts are classic globals. `type="module"` would change scoping semantics, break the load-order dependency pattern, and require a bundler for production.

## 4. Script load order is fixed

```
config → data → prompts → storage → ui → app
```

Each file depends on globals from files before it. Any new script must be placed consistent with its dependencies. The order is documented in `docs/current-architecture.md`.

## 5. localStorage key names are permanent

Renaming a `tupana_*` key silently erases existing student sessions. Keys are listed in `docs/current-architecture.md`. Add new keys; never rename or remove existing ones while students may have active sessions.

## 6. Bilingual parity is non-negotiable

All student-facing language exists in both Spanish and English. If you add an English string, add the Spanish equivalent. Spanish-speaking students are the primary audience; English is not the default.

## 7. The Stage 6 authorship gate must not be bypassed

`executeSave()` and `updateDraftControls()` in `ui.js` implement the authorship gate — the mechanism by which students document unassisted first-draft authorship. This has academic integrity and IRB implications. Do not simplify, remove, or shortcut this logic without explicit pedagogical review.

## 8. The Five Questions are fixed protocol

`EVAL_QUESTIONS` in `ui.js` defines the revision feedback protocol. Changing these questions changes the pedagogical protocol itself, not just the UI. Any change requires explicit review of pedagogical implications.

## 9. Offline-first design

The AI coach connection is optional. All 10 stages must work fully without it. Offline mode is the designed default, not a fallback.

## 10. No new runtime dependencies

The app is dependency-free at runtime. Adding any runtime dependency (CDN library, polyfill, framework) requires explicit justification and review against pedagogical constraints.

## 11. JSON is the internal data standard

App data lives as JS object/array literals. If serialization is needed for tooling, serialize to JSON on demand. Do not restructure source files around TOON, YAML, GraphQL, or any external schema format.
