# Branding and header polish pass — 2026-08-04

**Base:** `2575d5b` (clean; preflight verified all planes: product main `0f66e46`, R0 `1462aea`,
exploration clean, VC-OS `e32034a`, preview `ac390d62`, rollback `f90ad8be`).
**Scope:** visual polish only — no navigation, density, feature, AI, pedagogy, or storage change.
No AI calls were needed or made.

## Restored brand identity

**Source of the icon:** the original animated laptop-and-coffee companion from the legacy
application — SVG markup from `index.html` (header `.header-logo`, lines ~21–24) and its
`tp-av-*` CSS system from `assets/css/styles.css` (~4966–5021), carried over **verbatim**:
warm cream badge circle, jade laptop with typing lines and blinking cursor, coffee cup with
three rising steam curls, and the spark. All five animations (`tpAvGlow/Line/Cursor/Steam/Spark`)
are preserved at their original gentle timings and are fully disabled under
`prefers-reduced-motion: reduce` (suite-verified). The icon is decorative (`aria-hidden`), 52×44
desktop / 44×37 mobile, self-contained (no external assets, no layout shift, contrast carried by
its own badge in every appearance mode).

## Header: before → after

Before: generic "TP" monogram square · large "Tu Pana Writing Studio" · a smaller redundant
"Writing Studio" line · save pill and genre select mixed into the right-hand control cluster.

After (desktop):

```text
[laptop+coffee icon]  Tu Pana Writing Studio            ✓ Saved on this device   [Idioma] ◐ ? ⚙
                      [Autobiographical Essay ▾]
```

One rendered product title (suite-asserted); no subtitle; the genre control sits inside the
identity block as a quiet compact pill; save status is a right-aligned status area with a mark +
text (never color alone); Settings/appearance/Help stay visually secondary. Mobile (≤820px):
identity row (icon + full title, wrapping allowed) above a controls row; the genre pill and save
pill yield to the existing orientation chip (compact label, full name in `aria-label`) and the
editor's own save line; header ≈109px, no overlap, no overflow, 44px targets (initial
grid-cascade overlap was caught in the screenshot review and fixed with stacked grid rows).

## Save status

`✓ Saved on this device` · `… Saving…` · `! Couldn't save — keep this page open and export a
backup from Settings.` (es: `Guardado en este dispositivo` / `Guardando…` / `No se pudo guardar —
mantén esta página abierta y exporta una copia desde Configuración.`) State is text + a bordered
mark glyph; `role="status"` on the pill; the assertive storage-failure announcement and all backup
behavior are unchanged.

## Genre labels (full official name ↔ compact header label)

| Profile id | Full assignment name (menus + AT) | Compact header label |
|---|---|---|
| `autobiographical` | Mixed-Genre Autobiographical Essay | Autobiographical Essay |
| `admissions` | College Personal Statement | College Essay |
| `sop` | Graduate Statement of Purpose | Statement of Purpose |
| `cap200` | CAP 200 Service-Learning **Report** | Service-Learning Report |
| `research` | Research Paper | Research Paper |
| `stem` | STEM Laboratory Report | STEM Lab Report |
| `neutral` | General Writing Project | General Writing |

(Deliberate deviation from the suggested "Service-Learning Reflection": the CAP 200 assignment is
pedagogically an IMRDC *report*; reflection is one part of it — the label keeps the truthful genre
name.) Spanish equivalents ship alongside. The closed control shows the compact label via a
styled face; the real `<select>` remains fully keyboard/AT-accessible with **full official names
as the option text and the selected value AT reads**; `stored record provenance still uses the
untouched `label` field` (suite-asserted: a Council run records `Mixed-genre autobiographical
essay` exactly as before). Profile ids, routing, aliases, prompts, and Council configuration are
unchanged.

## Development-language audit (rendered surfaces)

Swept and replaced contextually across banner, consent, Settings, Danger Zone, paste dialog,
draft history, Finish, packet text, Help, report preview, delete announcement, provenance
fallbacks, meta description, and the Finish "five actions" card: `prototype`, `concept`,
`candidate`, `exploration`, `finalist`, `synthetic state` → "Tu Pana Writing Studio" / "Writing
Studio" / "this device" / ordinary feature language. The practice-mode banner now reads "Practice
preview — the coach is simulated on this device." The audit is suite-enforced across nine
surfaces in EN and ES (`studio_branding_test.mjs`). Internal identifiers, CSS class names, code
comments, docs, and test descriptions were deliberately left alone. Two latent bugs found and
fixed during the sweep: the Danger-Zone export referenced a removed constant (would have thrown),
and export/packet filenames carried prototype naming.

## Verification

`studio_branding_test.mjs` **44/44**: authentic asset presence + decorative marking; reduced
motion; single title; no subtitle; truthful save states incl. simulated failure; mark-not-color;
all 7 genres' compact/full/AT/no-truncation checks; open-selector and Settings full names;
provenance untouched; unknown-assignment stop; 9-surface EN/ES dev-language audit; bilingual
header coherence; light/dark/system; 390×844 icon/title/chip/44px/height; keyboard reach with
visible focus; 200% reflow. Screenshots reviewed by eye (desktop paper EN, desktop dark ES,
desktop both-mode longest label, mobile paper + dark before/after the overlap fix, saving,
save-failure, Settings full names). Full battery results recorded in the final report.
