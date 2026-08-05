# Guided Discovery — conversational pacing and scroll orientation — 2026-08-05

**Base:** `e7d41ab3cb41b191afa50db5f79868016e546edb` (Guided Discovery checkpoint; clean).
**Branch / worktree:** `migrate/pedagogical-engine-2026-08` · `~/Sites/tupana-writing-studio-migration`.
**Scope:** delivery only. Content, branching, humor, genre behavior, live previews, pedagogy, and
isolation are unchanged. No new dialogue was written and no joke was added to fill a pause.
**Live AI calls in this pass:** 0.

Two founder findings from the lived review: a whole response group landed at once, so a live
preview and the explanation of it arrived together and had to be untangled after the fact; and the
conversation moved the reading position around while the student was still reading.

## What changed

| | Before (`e7d41ab`) | After |
|---|---|---|
| Arrival | one 380 ms wait, then the entire group at once | one message at a time, each preceded by a brief composing indicator |
| Live preview | appeared inside the same burst | arrives as its own conversational event |
| After a preview | explanation landed on top of it | the conversation pauses for **What am I seeing?** |
| Automatic beats | unbounded (up to six) | at most **three** after one student choice, then a pause |
| Scrolling | jumped to the very bottom on every render | follows only while the student is at the newest message |
| Scrolled up | dragged back down | reading position kept; **New message ↓** offered |
| Focus | moved on every render | moves only after a deliberate action, never into a bubble or preview |
| Announcements | last turn re-announced per render | one polite announcement per message that actually arrived |
| Cancellation | one `clearTimeout` | generation-token reveal queue, invalidated by every exit route |

## The reveal state model

`enterBeat` no longer appends a group. It loads the beat's turns into a **queue** and hands control
to `pumpReveal`, a small state machine where exactly one of three things is true:

```
                 ┌───────────────────────────────────────────┐
  student reply  │  queue empty  → replies are offered        │
   (immediate)   │  next is gated → pause, show continuation  │
        │        │  otherwise     → compose, then reveal one  │
        ▼        └───────────────────────────────────────────┘
   [me bubble] → composing → [message] → composing → [preview] → GATE
                                                                  │
                        "What am I seeing?" ────────────────────┘
                                    │
                        → [quip] → [explanation] → [truth] → replies
```

**Gates** are computed, not hand-placed: `markGates` marks the turn *following* any preview turn.
A second gate appears automatically once `AUTO_LIMIT` (3) messages have arrived on their own. The
marker is consumed when the student passes it, so a gate never repeats.

**Cancellation** uses a module-level `generation` counter. Every scheduled reveal captures the value
it was queued under and abandons itself silently if it no longer matches. `invalidatePending()`
bumps the counter, clears the timer, and empties the queue; it runs on Back, Start over, Skip, Exit,
Escape, close, comparison toggle, and language or writing-project change. Reload ends the page
outright. A stale message therefore cannot arrive after the thing it belonged to is gone, and the
reveal path touches no real record, so no timer can mutate student state even in principle.

**Repeat taps** cannot duplicate a message: replies exist only when the queue is empty and no gate
is pending, and `gd-choose` re-checks that before acting.

## Timing and continuation rules

- **Composing indicator: 420–680 ms**, derived from the length of the message about to arrive
  (`COMPOSING_MIN + words × 6`, clamped). Deterministic — no randomness, so tests are reproducible
  and the indicator never misrepresents work that is not happening.
- It is decorative: `aria-hidden`, never labelled "thinking", never presented as a live human or a
  generated reply, and not a `.gd-turn` — nothing has been said yet.
- Pointer users can **tap it to bring the next message forward**.
- **At most three** messages arrive automatically after one student choice.
- The explanation after a live preview **always** waits for the student.
- Continuation controls are conversational, not a Next button on every bubble: *What am I seeing?* /
  *¿Qué estoy viendo?* after a preview, *Keep going* / *Sigue* at the auto-limit.
- Measured: the first companion message lands well inside a second; a student is offered something
  to do within a few seconds on every route; the shortest accepted path is unchanged in substance.

Under **reduced motion** the composing pause is zero and the arrival animation is removed, but the
gates remain — the logical sequence is preserved, only the decoration is gone.

## Scroll orientation

`scroll` events are ambiguous: our own smooth follow emits them, and so does the browser clamping
`scrollTop` while the conversation is re-rendered. Two earlier heuristics (a time window, then a
direction test) both produced wrong answers in practice — the second one stopped the conversation
following on a phone the moment a tall preview arrived, and wrongly offered "New message ↓" to a
student who was looking straight at it.

The rule that holds: **auto-follow is only ever switched off by evidence of an actual gesture** —
`wheel`, `touchmove`, a scrolling key, or a scrollbar drag. Everything else leaves following alone.
Conversely, sitting at the newest message is unambiguous however it happened, so it always resumes
following and retires the affordance.

When following, the conversation scrolls **only enough to reveal what arrived**:

- a tall arrival (a live preview) is revealed **from its top**, with a strip of the preceding
  message still visible for context, rather than by jumping to the bottom;
- anything else brings the new item and the replies just inside the usable area — measured against
  the scrollport and **discounting the dialog's sticky footer**, which otherwise hides them;
- the target is clamped so it can never scroll backwards: content is never moved above the
  student's current reading position.

When not following, nothing moves. A **New message ↓** control appears — pinned to the viewport
(clear of the safe area, and of the taller stacked footer on a phone), with the accessible name
"New message below. Jump to the newest message." Activating it goes to the newest message and
removes the control; so does scrolling back down.

## Focus and accessibility

- Focus **never follows an arriving message** into a bubble or a preview (asserted by sampling the
  active element throughout a group's arrival).
- It moves only after a deliberate action, and only onto the control that action produced —
  otherwise the control the student just activated disappears and focus falls to the document body.
  The move is deferred by one frame so it wins over the dialog's own initial focus, which would
  otherwise land a keyboard user on the close button.
- The polite live region carries **one announcement per message that actually arrived**. The
  composing dots are never announced. A preview is announced by its caption ("Sample shown: …"),
  never by reading out the component's markup.
- Preview controls remain disabled and out of the tab order.
- Escape, Back, Start over, Skip, and both exits are unchanged and cancel pending reveals.
- Verified at 390 × 844, 200 % reflow, both themes, 44 px targets, and with no horizontal overflow.
  Tap-to-enlarge still works on a preview.

## Deterministic timing tests

`studio_pacing_test.mjs` **72/72**. Everything about **order** runs under reduced motion, where the
composing pause is zero — the suite never sleeps through conversational delays. Only the section
genuinely about **duration** uses real timing, and it is bounded to a few seconds.

Covered: a group no longer arrives in one frame; the order reply → message → preview → pause; the
indicator is brief, decorative, hidden from assistive technology, and skippable; reduced motion
removes the wait without breaking order; at most three automatic beats on the Moves, Review Center,
Your Voice, and Evidence routes; no unreasonable fixed delay; following while at the bottom;
a gesture suppressing auto-follow and preserving the reading position; a programmatic scroll *not*
being mistaken for a gesture; the new-message control appearing, jumping, and clearing both ways;
focus stability; useful non-repetitive announcements; cancellation by Back, Start over, Skip,
Escape, and reload; no duplicate from five rapid taps; unchanged isolation; bilingual and mobile
pacing; and zero network requests.

`studio_tour_test.mjs` **114/114** — the accepted route, component-drift, humor, genre, truthfulness,
and state-integrity checks all still pass, with the suite made pacing-aware (it now walks
continuation controls and runs deterministically under reduced motion).

## Bugs found and fixed during the pass

- **The gate never released.** Passing a gate cleared the flag but not the marker on the waiting
  turn, so the queue immediately re-gated and the rest of the group was unreachable.
- **Following stopped on a phone.** A tall preview arriving made the conversation stop following and
  offer "New message ↓" to a student who was already at the bottom. Cause: re-render clamping and
  our own smooth-scroll animation were being read as student gestures.
- **Focus landed on the close button.** The dialog performs its own initial focus a frame later and
  was overwriting ours, so a keyboard user opening the conversation started on `×`.
- **The composing placeholder counted as a message.** It carried `.gd-turn`, which made it
  indistinguishable from a real turn for any selector; it is now its own element.
- **The pill collided with the mobile footer**, which stacks and is taller than the desktop one.

## Checkpoint and bounded-preview deployment

**Checkpoint:** `857e339527bf5cc25b9da9c34cc0d34e123c1155` on `migrate/pedagogical-engine-2026-08`.

**Deployment:** `5445135c` to Cloudflare Pages project `tupana-preview`
(`https://5445135c.tupana-preview.pages.dev`), serving `https://tupana-preview.pages.dev`.

**All 22 user-facing files verified sha256-identical** to the checkpoint on both the deployment URL
and the canonical alias. Only three files changed on the wire (`studio.css`, `studio-tour.js`,
`studio-ui.js`); the canonical alias needed about a minute to finish propagating them, as in the
previous pass.

**Rollback targets, newest first:** `d6bf13b3` (Guided Discovery — the immediate rollback target),
`1a9bbdcc` (Quick Tour), `ca07932d` (first-contact clarity), `b058711e` (branding), `ac390d62`
(live-AI readiness), `f90ad8be` (pre-Studio R0 surface).

**Post-deploy smoke on the live preview host: 26/26, provider-call ledger ZERO.** No live AI call
was needed or made. Covered: live provider resolution on this host; the opening group arriving in
stages; the pause at the live preview; following the tall preview into view; continuing; a real
wheel gesture preserving the reading position; the new-message control appearing and jumping;
record untouched after exit; untouched desk; Review Center still connected and consent-gated; Help
replay; the admissions, STEM, and research genre links carrying their own material; Spanish and
bilingual pacing; dark appearance; mobile following and no overflow; and the son's `start-here`
legacy route still serving.

## Unchanged

Dialogue, conversation map, humor inventory, English/Spanish genre content, all five live previews
and their synthetic records, truthful claims, and the essential and curious routes. Production
(GitHub Pages from product `main` `0f66e46`), the Worker, R0 (`1462aea`), the exploration branch
(`d8b92e8`), and VC-OS (`08ae31a`) are untouched. No SaaS, analytics, sound, vibration, badges, or
notifications; no permanent chat interface; no change to provider, Council, storage, revision,
reflection, or Finish behavior.

## Founder test (~2 minutes) — is it paced, or is it slow?

1. Open the preview fresh and take the conversation. Does each message feel like it *arrives*, or
   like you are waiting for it?
2. Choose **Help me get started**, then a difficulty. Watch the Moves preview arrive on its own.
   Does the pause before **What am I seeing?** feel like breathing room or like a gate you have to
   open?
3. Tap the little composing dots while they are running. It should jump straight to the next
   message — does that feel available, or hidden?
4. While a group is still arriving, scroll up to re-read something. Does the conversation leave you
   alone? Does **New message ↓** appear, and does it take you back where you expect?
5. Do the same on your phone, and try **Enlarge this sample** on a preview.
6. Turn on Reduce Motion and take it again. Is it still warm, and does it still make sense?

**The question:** does the conversation now feel naturally paced — or does it feel slow? If any
single pause feels long, say which one; the composing range and the auto-limit are one constant
each.
