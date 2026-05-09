# Testing Philosophy — Tu Pana de Escritura

*Last updated: 2026-05-09*

## The approach

This is a solo-developer project. Testing infrastructure is intentionally minimal. The goal is confidence that the pedagogically critical paths work correctly before any push to main — not comprehensive coverage.

## No automated test suite (intentional)

Setting up and maintaining a test suite (Jest, Playwright, etc.) for a static single-page app with complex state in localStorage and UI driven by DOM events would cost more in maintenance than it saves. Until the project has multiple contributors or automated deployment gates, manual testing against `prompts/qa-scenarios.md` is the appropriate level of rigor.

This is a conscious decision, not a gap.

## What gets tested before every push

Run `prompts/qa-scenarios.md` — or at minimum the sections relevant to what changed:

| Change made | What to test |
|-------------|-------------|
| Anything | Fresh start flow (Tu Conocimiento → El Lab → Stage 1) |
| Always | Stage 6 authorship gate (Guardar, editor lock, Continuar enable) |
| Any layout change | Mobile at ≤480px (tab interface, panel switching) |
| Any string change | Both ES and EN language modes |
| Any stage logic | That stage + the stages immediately before and after |
| Any change to `ui.js` | The named function + `updateDraftControls()` (called from many places) |

## Critical paths that must never break

1. **Stage 6 authorship gate** — `executeSave()`, `updateDraftControls()`. See `docs/decisions/architecture-principles.md` §7.
2. **localStorage persistence** — all `tupana_*` keys must survive page reload.
3. **Language toggle** — ES / EN / ES·EN must affect all visible student-facing text.
4. **Mobile tab interface** — at ≤480px, draft and chat panels must both be reachable.

## What `stress-test-runner.js` is

A local automated script for stress-testing localStorage edge cases. Useful after changes to `storage.js` or any function that reads/writes localStorage. It is a supplement, not a replacement, for the manual QA scenarios in `prompts/qa-scenarios.md`.

## AI coach testing

The AI coach (DirectLine / Dify) is external. Always test the **offline path** first — it is the default and must be fully functional. Test the online path only when changing `initDL()` or `config.js`.
