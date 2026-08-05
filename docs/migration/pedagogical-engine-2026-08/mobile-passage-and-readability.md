# Mobile passage protection and feedback readability — 2026-08-05

**Base:** `e48a06f15fa8a6f3f4d8860eba8624532e747831` (pacing checkpoint; clean).
**Branch / worktree:** `migrate/pedagogical-engine-2026-08` · `~/Sites/tupana-writing-studio-migration`.
**Scope:** the founder's two P1 mobile blockers, and nothing else. No mobile redesign.
**Live AI calls in this pass:** 0.

## Founder verdict recorded

- Desktop / Desk experience: **PASS**
- Guided Discovery and paced conversational delivery: **PASS**
- Mobile experience: **PASS-with-two-P1-blockers**

## A. Sentence-level Your Voice on a physical iPhone

### Reproduced failure

The Passage Tray already existed, with **Keep as my voice**, **Use a Move**, **Review passage**, and
a clear control. It was never reached on a phone because it was surfaced by exactly one signal:

```js
editor.addEventListener('select', () => captureSelection(editor));
```

**iOS Safari does not dispatch `select` to the page when the student selects by touch and drags the
native selection handles.** Desktop mouse selection fires it, and so does the programmatic
`setSelectionRange()` that browser automation uses — which is why every emulated suite passed while
the physical device failed. Selecting a sentence on an iPhone therefore captured nothing, the tray
stayed hidden, and sentence-level protection was unreachable. Paragraph and full-draft Review Center
paths were unaffected, which matches the founder's report exactly.

Reproduced deterministically by blocking `select` at the capture phase — the closest a desktop
engine can come to the device:

| | Passage Tray | "Keep as my voice" reachable |
|---|---|---|
| Baseline `e48a06f` under the iOS condition | **no** | **no** |
| This checkpoint under the iOS condition | yes | yes |

### Correction

The existing tray was kept — it already satisfies the required interaction (app-owned, pinned,
safe-area aware, 44 px targets, exact excerpt, separate passage/paragraph/full-draft scopes, no
dependency on Safari's native menu, no permanent editor toolbar). What changed is **how it is
surfaced**:

- a document-level `selectionchange` listener, which iOS does fire, captures when the draft editor
  is the active element;
- `pointerup` / `touchend` / `keyup` on the editor as belt-and-braces;
- both paths converge on the same `captureSelection`, debounced 180 ms so a touch drag settles
  before the tray is rebuilt under the student's finger;
- an identical re-report is ignored, so the tray does not thrash mid-gesture.

`select` is still handled; desktop behavior is unchanged.

### Selection capture and stale validation

A capture now records exact bytes, paragraph context, the full draft, `start`/`end` offsets, capture
time, **the draft signature at capture**, and **the active writing project**.

`validateCapture()` runs before Your Voice, before passage coaching, and before a Move link:

| Condition | Result |
|---|---|
| Text still at the recorded offsets | accepted |
| Text moved but still present in the draft (ordinary editing elsewhere) | accepted |
| Text no longer in the draft | refused — **stale** |
| Writing project changed since capture | refused — **cross-project** |
| Empty or whitespace-only | refused — **empty** |

A refusal clears the capture, announces the reason assertively, and returns focus to the draft so
the student can select again. Nothing is silently widened from sentence to paragraph or full draft,
and a capture never survives a project switch.

Selection **collapse** is not invalidation: tapping elsewhere, or ordinary scrolling, leaves the
captured passage exactly as it was — which is the behavior a phone needs, since iOS collapses
selections readily.

### Your Voice and passage coaching

Unchanged contracts, now reachable: exact wording saved locally, optional student-authored reason,
the same truthful Voice/Evidence record as desktop, no AI call, no inference of authenticity or
quality, nothing inserted into the draft. Passage coaching opens the existing consent flow with the
exact captured text in the payload preview, requires explicit consent, and stores `scope: "selected"`
with the consented excerpt.

## B. Initial coach-feedback readability

### Reproduced failure

Measured against the real composited background on a 390 × 844 phone:

| Appearance | Coach feedback body | Result |
|---|---|---|
| Paper / Light | 15.76 : 1 | passes |
| **System, device in dark mode** | **1.15 : 1** | **fails** |
| **Dark** | **1.15 : 1** | **fails** |

Ten elements inside the feedback card failed AA in dark, including the feedback body (1.15), the
metadata line (1.70), the provenance chip (1.37), and the snapshot link (1.47).

**Root cause:** `.review-card` carried a hardcoded `background: #fffefb`. Every comparable surface
in this stylesheet has a dark-appearance override; this one and `.packet-preview` were omitted. In a
dark appearance the ink turns light while the card stays bone-white, so coach feedback rendered as
light text on a near-white card. The decision dialog stayed readable because it uses
`var(--surface)`, which is exactly what the founder observed.

The founder reported it as "Paper/Light"; the phone was on the **System** appearance with the device
in dark mode. The defect also exists on desktop — it is simply less often encountered there.

### Correction — semantic, not a viewport patch

Three tokens, defined in `:root` and re-valued in both dark blocks:

| Token | Light | Dark | Used by |
|---|---|---|---|
| `--surface-raised` | `#fffefb` | `#252d28` | `.review-card`, `.packet-preview`, `.evidence-chip` |
| `--chip-ink` | `#244d70` | `#bcd8ef` | `.mock-label`, `.critical-moment > summary`, `.location-pill`, `.reflection-intro`, `.evidence-chip`, `.critical-framework li.current` |
| `--warn-ink` | `#6c3e16` | `#f0c99a` | `.critical-risk` |

Five hardcoded chip inks and two hardcoded card backgrounds were replaced. No one-off mobile
override was added; the fix is at the token, so desktop dark is corrected by the same change.

### Verified ratios after the correction

Minimum composited contrast across every text node in each surface, 390 × 844:

| Surface | Paper/Light | Dark | System (device dark) |
|---|---|---|---|
| Initial coach response | 5.32 : 1 | 6.65 : 1 | 6.65 : 1 |
| Focused review | 5.32 : 1 | 6.65 : 1 | 6.65 : 1 |
| Saved report feed | 5.32 : 1 | 6.65 : 1 | 6.65 : 1 |
| Council report | 5.32 : 1 | 6.65 : 1 | 6.65 : 1 |
| Decision dialog | 6.14 : 1 | pass | pass |

All body text meets AA 4.5 : 1. Hierarchy between body, metadata, quotations, chips, and actions is
preserved; quotations keep their distinct mango-tinted treatment and remain readable.

### One pre-existing defect found and NOT fixed here

`.button.primary` renders white on `--jade` (`#55ae8a`) in a dark appearance — **2.69 : 1**, below
AA for control text. This is **pre-existing**, **app-wide** (every primary button, not only
feedback), and unrelated to the founder's report. Correcting it means changing a core brand colour
or the primary button's ink across the whole Studio, which this bounded pass explicitly must not do.
**Flagged for a founder decision**, not silently changed and not silently ignored.

## Verification

`studio_mobile_passage_test.mjs` **69/69**, covering the twenty required conditions: a touch
selection surfacing the tray under the iOS condition; reachability at any scroll position without
going to the top; collapse and scrolling not disturbing the capture; edit, project-switch, and stale
invalidation; empty and whitespace recovery; exact multilingual bytes through capture and storage;
the Voice record with no AI request; passage coaching using the identical captured text behind exact
preview and consent; scope never widening; paragraph and full-draft paths unchanged; the tray under
a simulated open keyboard and inside the safe area; targets, dismissal, focus return, accessible
names, and announcement; initial-feedback contrast in all three appearances; saved report, decision
dialog, and Council variants; the semantic fix holding on desktop dark; Pro Max 430 × 932; 200 %
reflow; and no density or overflow regression.

**Battery: 60 suites / 2,106 checks / 0 failures**, including the Guided Discovery pacing and route
suites.

**Physical-iPhone validation remains PENDING founder retest.** Emulation cannot close this P1: the
whole defect was that a desktop engine dispatches an event a phone does not. The suite reproduces
the condition deterministically, which is evidence the cause is understood and corrected — not
evidence the device behaves.

## Unchanged

Guided Discovery dialogue, humor, branches, pacing, previews, and scroll model; canonical draft
behavior; genre profiles and coach prompts; Review Center information architecture; Council behavior
and availability; provider configuration; consent contracts; paragraph and full-draft review;
revision cycle; Evidence, Process Reflection, and Finish; branding and header. Production, the
Worker, product `main` `0f66e46`, R0 `1462aea`, exploration `d8b92e8`, and VC-OS `08ae31a` are
untouched. Fake testing text, Reading Response profiles, and STEM prompt-choice content were
explicitly deferred and not addressed.

## Physical-iPhone founder script (~3 minutes)

On your iPhone, at `https://tupana-preview.pages.dev/studio.html`:

1. Type or paste a few sentences into the draft.
2. **Tap and hold one sentence** and drag the native handles to select it — the way you actually
   would. Within about a fifth of a second, the dark **Passage captured** tray should appear at the
   bottom of the screen showing that exact sentence.
3. Tap elsewhere so iOS collapses the selection, then scroll a little. **The tray should stay**, and
   still show the same sentence.
4. Tap **Keep as my voice**. Open Evidence and confirm the entry holds your exact wording.
5. Select a different sentence and tap **Review passage**. Confirm the preview shows exactly that
   sentence, that you must consent before anything is sent, and that the scope says passage — not
   paragraph or full draft.
6. Now edit the draft so the sentence you captured no longer exists, then try **Keep as my voice**.
   It should refuse and ask you to select again rather than saving something stale.
7. With the on-screen keyboard **open**, select a sentence. The tray should sit above the keyboard,
   fully visible.
8. Ask for coach feedback. **When the response first appears, is it readable?** Check it in Paper,
   in Dark, and with your phone's own appearance on System.

**The question:** can you now protect a sentence on your phone without fighting the interface, and
is the feedback readable the moment it arrives?
