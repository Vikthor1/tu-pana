# Founder acceptance (physical iPhone) and filled-primary contrast — 2026-08-05

**Base:** `90b3270ca71f01925bf03b2950fbd89587f6b742` (mobile P1 checkpoint; clean).
**Branch / worktree:** `migrate/pedagogical-engine-2026-08` · `~/Sites/tupana-writing-studio-migration`.
**Scope:** record the founder's physical-device acceptance, and correct one dark-theme
contrast defect. No other product change.
**Live AI calls in this pass:** 0.

## Founder verdict — lived physical-device evidence

- **Device:** physical iPhone 17 Pro Max
- **Surface:** bounded family preview (`tupana-preview.pages.dev`)
- Mobile sentence selection and **Keep as my voice** work beautifully.
- The Passage Tray is accessible after native iPhone text selection.
- Initial AI-coach feedback is readable on mobile.
- **Verdict on both previously open mobile P1 concerns: PASS.**

**The physical-iPhone blocker is closed for these two specific defects only.**

What this evidence does **not** establish, and must not be read as establishing:

- VoiceOver or any other assistive technology was **not** tested;
- other iOS devices, iOS versions, and browsers were **not** tested;
- Android was **not** tested;
- representative-student testing has **not** occurred;
- no claim is made about learning outcomes, or about any defect other than the two named.

The mobile passage-selection and feedback-readability corrections themselves are recorded in
`mobile-passage-and-readability.md`; this document records that a real device confirmed them.

## The accessibility defect

Independently discovered during the previous pass's verification sweep and deliberately left
unfixed there as out of scope; corrected here under explicit authorization.

**Root cause: a token role collision.** `--jade` served two different jobs — an accent/text colour,
and a filled-button background. The dark theme re-values it to a *light* jade (`#55ae8a`) so it
reads as text on a dark surface. That is correct for the first job and wrong for the second: the
white label on a filled primary button then sat on a light green fill.

| Dark theme, before | Ratio | |
|---|---|---|
| `.button.primary` — white on `#55ae8a` | **2.69 : 1** | fails AA (needs 4.5) |
| `.button.primary:hover` — white on `#a7e0c8` | **1.49 : 1** | worse |

Light theme was never affected (white on `#176b52` = 6.44 : 1).

The same filled treatment appears in eight places, all of which carried the defect in dark:
`.button.primary` (and `:hover`), `.decision-button[aria-pressed="true"]`,
`.step-button[aria-current="step"] .step-number`, `.finalist-badge`, `.gd-unread`,
`.gd-compare-tabs button[aria-selected="true"]`, and `.gd-preview-badge`.

## The correction

Smallest coherent design-system change: give the **filled-primary role its own semantic tokens**,
rather than overloading `--jade` or replacing the brand colour.

```css
:root                      { --primary-bg: #176b52; --primary-bg-hover: #0d4b39; --primary-ink: #ffffff; }
dark / system-dark         { --primary-bg: #55ae8a; --primary-bg-hover: #6fbf9b; --primary-ink: #0c1f19; }
```

**Light values are exactly the jade the Studio already used, so light appearance is byte-for-byte
unchanged.** Dark keeps the *bright* jade fill and takes dark ink on it.

Both directions were evaluated, as instructed:

| Option | Dark result | Judgement |
|---|---|---|
| Darken the fill, keep a white label | white on `#176b52` = 6.44 : 1 | passes, but a dark-green button on a dark surface loses its affordance — it reads as another panel |
| **Keep the bright jade fill, use dark ink** | `#0c1f19` on `#55ae8a` = **6.37 : 1** | **chosen** — passes, the button stays the most prominent thing on the surface, and the jade identity is more visible, not less |

The jade tokens themselves are untouched; `--primary-bg` in dark resolves to the same value as
`--jade`, so the brand colour was not replaced.

### Two further defects found while verifying, and corrected

Both are the same class of root cause — a hardcoded colour that does not adapt — and both were
caught by the new regression sweep rather than by eye.

1. **Focus ring, dark theme.** `outline: 3px solid #0b70c9` was hardcoded. The ring is drawn outside
   the control at a 2 px offset, so it must contrast with the *surface behind it*: it measured
   **2.81 : 1** against `--surface`, below the 3 : 1 that WCAG 2.2 SC 1.4.11 asks of a focus
   indicator. Now `--focus-ring`: light `#0b70c9` (unchanged), dark `#5cb3ff` → **7.54 : 1** against
   the surface, **8.73 : 1** against the page.
2. **`.knowledge-onboarding small`.** Hardcoded `#3d5b73` on the tinted knowledge panel measured
   **1.70 : 1** in dark — effectively unreadable. Now uses the existing `--chip-ink` token, which was
   introduced in the previous pass for exactly this pairing: **8.20 : 1** in dark. Only the colour
   changed; the cultural-layer copy, behaviour, and hierarchy are untouched.

## Measured contrast — before and after

Composited against the real background, alpha included, measured in the running application.

| Surface / state | Theme | Before | After |
|---|---|---|---|
| Primary button label | Light | 6.44 : 1 | **6.44 : 1** (unchanged) |
| Primary button label | Dark | **2.69 : 1** ❌ | **6.37 : 1** ✅ |
| Primary button label | System (device dark) | **2.69 : 1** ❌ | **6.37 : 1** ✅ |
| Primary button hover | Light | 10.08 : 1 | **10.08 : 1** (unchanged) |
| Primary button hover | Dark | **1.49 : 1** ❌ | **7.83 : 1** ✅ |
| Selected decision button | Dark | 2.69 : 1 ❌ | **6.37 : 1** ✅ |
| Guided Discovery sample badge | Dark | 2.69 : 1 ❌ | **6.37 : 1** ✅ |
| New-message control | Dark | 2.69 : 1 ❌ | **6.37 : 1** ✅ |
| Focus ring vs. surface | Dark | **2.81 : 1** ❌ | **7.54 : 1** ✅ |
| Knowledge-panel small print | Dark | **1.70 : 1** ❌ | **8.20 : 1** ✅ |

Disabled primary buttons remain at `opacity: .46` with `cursor: not-allowed`. WCAG 2.2 exempts
inactive controls from contrast; the requirement met here is that disabled is *clearly
de-emphasised and distinguishable*, which is asserted.

## Verification

`studio_contrast_test.mjs` **49/49** — filled-primary label contrast in Light, Dark, and
System-derived dark; the same treatment wherever it appears; hover readable and visibly distinct
from default; disabled clearly de-emphasised; keyboard focus reachable, drawn, and distinguishable
from what it surrounds; a full sweep proving no other text on the desk falls below its AA
requirement in any theme; the jade identity preserved (dark `--primary-bg` still resolves to
`--jade`); no white-on-jade filled pairing left anywhere in the stylesheet; the physical-iPhone
passage-selection path and readable initial coach response unchanged; and 390 × 844, 430 × 932,
200 % reflow, reduced motion, 44 px targets, and horizontal-overflow protections all intact.

**Complete product suite: 61 suites / 2,155 checks / 0 failures.**

Zero network requests and zero AI calls: this is a CSS/theme correction and needed neither.

Screenshots reviewed internally at desktop 1280 × 900 and phone 390 × 844, in Light, Dark, and
System-derived dark (not committed — the repository's allowlist `.gitignore` excludes them).

## Files changed

- `assets/css/studio.css` — three filled-primary tokens, one focus-ring token, eight filled
  treatments switched to the tokens, one knowledge-panel ink switched to `--chip-ink`
- `studio_contrast_test.mjs` — new regression suite
- `.gitignore` — allowlist entry for the new suite
- this document, and the migration README index

No JavaScript, markup, content, or behaviour was changed.

## Unchanged

Information architecture, density, pedagogy, writing workflow, AI behaviour, Council behaviour,
passage-selection interaction, cultural layer, critical-AI-literacy layer, onboarding, genre
profiles, storage model, and the calm visual hierarchy. Production GitHub Pages, the shared Worker,
product `main` `0f66e46`, R0 `1462aea`, exploration `d8b92e8`, and VC-OS `08ae31a` are untouched.
Nothing merged, promoted, or pushed; no SaaS work, no new genres, no STEM Council change.

## Remaining evidence limitations

- Physical-device acceptance covers **one** device (iPhone 17 Pro Max), **one** browser, and the
  **two** named defects. Nothing broader is claimed.
- VoiceOver and other assistive technologies remain untested.
- The contrast corrections are verified by computed-style measurement in a desktop engine and by
  visual review; they have **not** been confirmed on the physical device — the founder's visual
  check below is what would establish that.
- Representative-student testing has not occurred.
- The migration branch is not pushed, and the VC-OS close protocol has not been run.

## Founder visual check (~90 seconds)

At `https://tupana-preview.pages.dev/studio.html`, look at the **primary buttons** — the filled
green ones such as **Continue: Process Reflection**, **Ask Tu Pana**, and **Start writing**:

1. **Light (Paper).** Tap the ◐ appearance control until you are in Paper. The primary buttons
   should look exactly as they always have: deep jade with a white label.
2. **Dark.** Tap ◐ to Dark. The primary buttons should now be *bright* jade with a **dark** label —
   still obviously the main action, still obviously Tu Pana green, and now comfortably readable.
3. **System.** Tap ◐ to System and set your phone to Dark. It should match step 2 exactly.
4. On a computer, **hover** a primary button in Dark — it should lighten slightly and stay readable.
5. Press **Tab** until a primary button is outlined. The focus ring should be clearly visible
   against the background in both Light and Dark.

**The question:** does the primary button still read as *the* action to take, and does it still look
like Tu Pana — in both appearances?
