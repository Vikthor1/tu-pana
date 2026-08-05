# Guided Discovery — 2026-08-05

**Base:** `e8391d5f2fcfb24a3a28a19abb061378eb0e0c04` (Quick Tour checkpoint; clean).
**Branch / worktree:** `migrate/pedagogical-engine-2026-08` · `~/Sites/tupana-writing-studio-migration`.
**Scope:** one onboarding layer, evolved in place. No change to navigation, pedagogy, routing,
provider configuration, prompts, validation, consent, storage schema, or any real record.
**Live AI calls in this pass:** 0.

Authorized by the founder's Quick Tour verdict, `PASS-with-concern`: the tour was elegant, clear,
isolated, and technically accepted, but **less engaging and less informatively conversational** than
the legacy tutorial built for the founder's son — whose strength was a chat-like exchange with two
or three pre-populated replies that let a student steer without typing. The tour should feel like a
journey of discovery, not another preparatory chore.

## What replaced what

The six-moment Quick Tour is **gone**, not supplemented. There is exactly one onboarding
experience, entered from the same two places (the empty-desk welcome card and Help). The tour's
truthful content was carried forward into the conversation rather than discarded; its isolation
architecture was kept intact and extended.

## Design comparison: legacy tutorial vs. Quick Tour

The legacy tutorial is `start-here.html` (a separate full page, R0-era, describing the retired
ten-stage architecture). Read for its **interaction design**, not its content.

| | Legacy tutorial (`start-here.html`) | Quick Tour (`4db9c5f`) | Guided Discovery (this pass) |
|---|---|---|---|
| Form | Chat transcript, coach bubbles + your replies | Six sequential moment cards | Chat transcript, companion + tappable replies |
| Agency | Two or three pre-written replies; no typing | Next / Back through a fixed sequence | Two or three replies that change route, example, order, and depth |
| Recognition vs. recall | Recognize your own situation in a reply | Read an explanation | Recognize your situation; the route follows it |
| Pacing | Typing indicator, one message at a time | Whole card at once | Typing indicator, one message at a time |
| Continuity | Named chapters, narrative arc | Six independent topics | One miniature writing journey with a quiet chapter label |
| Discovery | Information revealed by interacting | Information presented | Information revealed by interacting, plus live component previews |
| Stakes | "No grade, just vibes" | Neutral | Explicitly "no wrong answer"; every reply is affirmed |
| Isolation | Weak — page-level, wrote `tupana_tutorial_done` | Strong — proven byte-identical | Strong — proven byte-identical, extended to previews |
| Truthfulness | Some overstatement ("readers can smell it") | Audited, conservative | Audited, conservative |
| Bilingual | Spanish sprinkled into English | Full EN / ES / both | Full EN / ES / both, with humor written natively in each |
| Architecture fit | Describes ten retired stages | Fits the Integrated Desk | Fits the Integrated Desk; shows its real components |

**Recovered from the legacy tutorial:** the texting-with-a-friend impression; two or three
pre-populated replies; meaningful direction without typing; recognition over recall; conversational
warmth; narrative continuity; information revealed through interaction; low fear of choosing wrong;
engagement that does not feel like schoolwork.

**Deliberately not ported:** the myth/real quiz format (the product-restraint boundary prohibits
quizzes — recognition replaced testing); the ten-stage route map (retired architecture); the
progress bar and `n / n` counter (implies a task to finish, which is the "chore" feeling the
founder named); a few tonal registers that do not scale from a teenage writer to a graduate student.

**Preserved from the Quick Tour:** complete isolation from real work, truthful claims,
accessibility, bilingual behavior, genre safety, responsive design, no AI calls, replayability,
state integrity, and a calm return to the writing desk.

## Central interaction model

Tu Pana offers one short message at a time. The student answers by tapping one of two or three
prewritten replies; the chosen reply appears as their own message in the transcript. **No typing is
required anywhere** (suite-asserted: no input, textarea, or contenteditable exists in the
conversation at any step). Back, Start over, Skip, and close are always available; exiting returns
to an untouched desk.

The chat form exists **only inside Guided Discovery**. No persistent chat column was restored to the
Studio, no fourth destination was added, and the dismissed Studio's density is unchanged.

## Conversation map

```
                       ┌─ "Help me get started."        → Moves
   Hello ──────────────┼─ "Show me how feedback works." → Review Center
   (genre quip)        └─ "Show me how I stay in control." → Your Voice
                                        │
        ┌───────────────────────────────┴───────────────────────────────┐
        │  PILLARS — the opening reply chooses which one you meet first  │
        │                                                               │
        │  Moves          ← 3 genre-owned concerns choose the Move       │
        │                   [PREVIEW: moves]                            │
        │  Review Center  ← 3 kinds of help choose the emphasis          │
        │                   [PREVIEW: review]                           │
        │  Your Voice     ← keep a phrase, or ask why it matters         │
        │                   [PREVIEW: voice]                            │
        └───────────────────────────────┬───────────────────────────────┘
                                        │  (first pillar joins the spine)
                      ┌─────────────────▼─────────────────┐
                      │  Your call   → Accept / Adapt / Reject
                      │  Revision    → [PREVIEW: copies] + Earlier/Current
                      └─────────────────┬─────────────────┘
                                        │
                            ┌───────────▼───────────┐
                            │  Anything else?       │◄──────┐
                            │  ≤2 unseen branches   │       │ curiosity
                            │  + "I'm ready" (always last)  │ loops back
                            └───────────┬───────────┘───────┘
                                        │
                    Evidence (optional) → [PREVIEW: evidence]
                                        │
                                     Ready → map + promise + Start writing
```

**Essential route: 7 taps, ~519 rendered words, 2 live previews** — roughly two minutes at a
discovery pace. Curious students reach all five previews; the offer beat shows at most two
curiosity branches so **"I'm ready to write" is always present and always last**. No route can trap
a student: every beat has replies, and Skip and close work everywhere.

Every route reaches the safety truths, because they sit on the shared spine: nothing changes the
draft automatically, nothing is sent without the exact payload and consent, and the decision is the
student's. Pillar-specific truths ride with their pillar.

## Live annotated previews

Previews are rendered by the **real Studio panel renderers**, not by a parallel copy of their
markup, so they cannot drift from the application.

`studio-ui.js` exposes `renderTourPreview(kind, seed)` through the tour context:

1. the canonical `state` is swapped for a synthetic one built from the active genre profile;
2. the **real** renderer runs — `renderIntegratedMovesPanel`, `renderReviewPanel`,
   `renderEvidencePanel`, `renderYourVoiceReference`, `evidenceArchiveBody('copies')`;
3. `state` is restored in `finally`;
4. `previewLock` makes `saveState` a no-op for the whole window, so a synthetic value cannot reach
   `localStorage` even if a renderer asked for a save;
5. the returned markup is **sanitized**: every `data-action` is renamed to `data-demo-action`, every
   control is `disabled` and given `tabindex="-1"`, and every `id` is stripped.

The swap is strictly synchronous — no `await`, no timer, single-threaded — so nothing can interleave
between the swap and the restore.

| Preview | Real renderer | Synthetic data | Teaches |
|---|---|---|---|
| `moves` | `renderIntegratedMovesPanel` | one Move note with content | optional, a nudge not a task; example is structure; the note stays out of the draft |
| `review` | `renderReviewPanel` | one saved report | four options, not stages; Council is slower; unavailability is stated where true |
| `voice` | `renderYourVoiceReference` | one kept phrase + the writer's reason | the student selects it; exact wording; local; consent before it ever travels |
| `evidence` | `renderEvidencePanel` | Move note, kept phrase, decision, snapshot | a record of choices — never a score, meter, or surveillance |
| `copies` | `evidenceArchiveBody('copies')` | one review copy | exact earlier text; comparison without a verdict |

Each preview carries a **Sample** badge, a visible caption, an equivalent screen-reader
description, and an **Enlarge** control that gives the sample the full width of the sheet on a
phone rather than shrinking it to a thumbnail. Preview surfaces are `pointer-events: none` and
contain **no live action** (suite-asserted). The Earlier/Current comparison and the enlarge control
are the conversation's own controls, rendered outside the preview surface.

**No static screenshot asset was introduced** (suite-asserted: no `img` or `picture` in any
preview).

Evidence previews are always **populated** — never a wall of zero counters.

## Genre-specific discovery

One shared conversational architecture; each profile owns its content under `discovery`:
an opening quip, three concerns (each naming the Move it routes to, with its own reply), a Move
note, a Your Voice reason, and a decision rationale. A future **Reading Response Essay** profile
supplies the same fields and needs no change to Guided Discovery.

| Profile | Opening concerns route to | Preview emphasis |
|---|---|---|
| Mixed-Genre Autobiographical | memory-boundary · larger-force · voice-language | a chosen library moment; translingual phrase protected |
| College Personal Statement | disclosure · connection · language | a signup-sheet realization; no trauma, no odds |
| Graduate Statement of Purpose | trajectory · evidence · fit | concrete work done; program fit only from what is verifiable |
| STEM Laboratory Report | question · observation · reasoning | a measurement with a stated limitation; **Council truthfully unavailable** |
| CAP 200 Service-Learning | imrdc-structure · community-course-bridge · evidence-data-plan | the writer's own shift notes; nothing invented |
| Research Paper | focused-question · notes-patterns · source-evaluation | two sources in tension; **no invented citation, author, year, DOI, or page** |
| General Writing | purpose · structure · evidence | a neutral library-hours argument; inherits nothing |
| Unknown assignment | — | no welcome card; Help explains it is unconfigured and points to Settings; **inherits nothing** |

STEM is the clearest case for the live-preview architecture: the conversation says the Council is
not configured for this kind of writing, and the **real Review Center preview shows exactly the same
message**, because it is the real component. The Council quip is suppressed there — no joke is
forced into a field that has none.

## Humor and tone review

Conducted against the eight required questions before deployment. Three findings were acted on.

1. **Does each humorous moment reduce tension or clarify something?** Yes — every retained line
   carries a product truth (see inventory). Two lines were changed for rhythm and clarity.
2. **Respectful to a teenage admissions writer?** Yes. The admissions line mocks the *expectation*
   (life as a movie trailer), never the student.
3. **Credible to a graduate student?** Mostly. "Homework wearing a tiny hat" is the most whimsical
   line and is the one most likely to divide adult readers — flagged for the founder rather than
   silently cut, since it is the founder's own example and it lands a real truth.
4. **Natural in English and Spanish?** Yes — each line was written natively in both. None is a
   literal translation; the blank-page and notebook lines in particular use different images.
5. **Is any student, identity, community, discipline, or difficulty the target?** No. The
   autobiographical and CAP 200 profiles keep humor strictly on writing, notebooks, and revision —
   nothing about family, culture, community conditions, service, or anything lived.
6. **Warm with motion disabled?** Yes — the typing indicator and message animation are the only
   motion, both removed under `prefers-reduced-motion`, and the conversation is unchanged.
7. **Memorable without becoming performative?** Yes at the current density (below).
8. **Quiet stretches between humorous moments?** Yes, after a fix.

**Findings acted on**

- *Two quips in one exchange.* The Moves beat carried both "nudge, not homework wearing a tiny hat"
  and "your notes will not sneak into the draft." Broke the every-two-or-three-exchanges rule.
  The second became a plain truthful line; the truth is unchanged, the rhythm is fixed.
- *Repeated legal register.* "Think roundtable, not courtroom" (Council) and "The earlier draft is
  not on trial" (comparison) can appear in the same conversation and read as a bit. The comparison
  line became "not the villain here — just where you were standing."
- *Ambiguous self-reference.* The research line originally ended "I have tested this. It does not
  work," which could be misread as Tu Pana admitting it fabricates sources. It now ends "no matter
  how confident the citation looks" — which is the actual critical-AI point.

**Measured rhythm, essential route:** 4 humorous beats across 8 exchanges — Hello 😊, Starting ·,
Moves 😊, Your call ·, Your call ·, Revision 😊, Anything else ·, Ready 😊. Two consecutive quiet
beats sit in the middle.

### Humor inventory

Shared lines (`studio-tour.js`):

| # | English | Spanish | Purpose |
|---|---|---|---|
| 1 | A Move is a nudge, not homework wearing a tiny hat. | Una Movida es un empujoncito, no una tarea disfrazada. | Moves are optional, not assigned work |
| 2 | Revision is useful. Bulldozing the sentences you love is not. | Revisar es útil. Arrasar con las frases que quieres, no. | why Your Voice exists |
| 3 | One lens, one purpose — no feedback avalanche. | Una lente, un propósito. Sin avalancha de comentarios. | a focused review is narrow on purpose |
| 4 | Think roundtable, not courtroom. You still make the decision. | Piensa en mesa redonda, no en tribunal. La decisión sigue siendo tuya. | Council advises; the writer decides |
| 5 | The earlier draft is not the villain here. It is just where you were standing. | El borrador anterior no es el villano. Es simplemente donde estabas parado/a. | comparison carries no verdict |
| 6 | Receipts for your thinking — not grades wearing a disguise. | Recibos de tu pensamiento, no calificaciones disfrazadas. | Evidence is a record, not a score |
| 7 | The blank page has been acting dramatic this whole time. You know where to begin now. | La página en blanco lleva todo este rato haciendo drama. Ya sabes por dónde empezar. | closing release of tension |

Genre openings (`studio-profiles.js`, `discovery.openingQuip`):

| Profile | English | Spanish | Purpose |
|---|---|---|---|
| Autobiographical | Seventeen notebooks, four napkins, one voice memo. The draft can still be one thing. | Diecisiete libretas, cuatro servilletas y una nota de voz. El borrador todavía puede ser uno solo. | one canonical draft; warmth kept on the notebook, never on lived experience |
| Admissions | Your life does not have to become a movie trailer. No slow motion required. | Tu vida no tiene que volverse un tráiler de película. No hace falta cámara lenta. | resists the dramatized-life expectation |
| SOP | "Passionate, dedicated, driven." A beautiful cloud with nothing to stand on. | «Apasionado, dedicado, comprometido». Una nube preciosa sin dónde pararse. | evidence beats adjectives |
| STEM | A lab report says what happened — not what everyone was hoping would happen. | Un informe de laboratorio dice lo que pasó, no lo que todos esperaban que pasara. | observation vs. hope |
| CAP 200 | Your shift notes have been waiting patiently. Let's give them somewhere to go. | Tus notas de turno llevan rato esperando. Vamos a darles a dónde ir. | warmth on the notebook only — never on service or community |
| Research | A citation cannot summon a source that does not exist — no matter how confident the citation looks. | Una cita no puede invocar una fuente que no existe, por muy segura que se vea. | the anti-fabrication rule |
| General Writing | The blank page is being dramatic. We don't have to join it. | La página en blanco se cree muy dramática. No tenemos que seguirle el juego. | lowers the stakes of starting |

**Rejected — clever but unhelpful:**

- "Your planning notes won't sneak into the draft while you're not looking." *Good line; cut because
  it was the second quip in one exchange. The truth it carried is now stated plainly.*
- "The earlier draft is not on trial." *Founder example; cut only to avoid a second courtroom
  metaphor in the same conversation.*
- "A citation cannot summon a source that does not exist. I have tested this. It does not work."
  *Funnier; cut because it could read as Tu Pana admitting to fabrication.*

**Bilingual treatment:** humor is written natively in both languages, never translated literally. In
`both` mode a quip renders as one compact paired line (Spanish primary, English inline and smaller)
rather than as two stacked blocks — suite-asserted via computed `display: inline`. Prose keeps the
stacked Spanish-primary pairing.

## Companion behavior

The laptop-and-coffee companion from the branding pass appears beside the conversation, **once per
run of consecutive messages** rather than stamped on every bubble. It never laughs at an answer,
implies disappointment, praises tour compliance, nags, pleads, or becomes more animated when
ignored. All motion is removed under `prefers-reduced-motion`, and the conversation is unchanged
without it.

## Isolation proof

- Only two localStorage keys ever exist: the Studio record and `tupana-studio:tour:v1`, which holds
  a version plus dismissal / start / completion timestamps and no student content.
- The Studio record is **byte-identical** across a full exploration, the essential route, an
  immediate skip, and a mid-conversation reload (with the Studio's own `savedAt` normalized, since
  its beforeunload save is pre-existing behavior).
- After finishing: zero Move notes, Voice entries, decisions, versions, reviews, Council runs, no
  review copy, no reflection timestamp.
- **Zero external requests** across the entire suite, including every preview and the simulated
  feedback moments.
- `studio-tour.js` contains no `fetch`, no provider reference, and no reference to the canonical
  state key.
- No analytics or behavioral telemetry: the preference record is asserted to contain no route,
  choice, beat, concern, or answer field.

## Verification

`studio_tour_test.mjs` **112/112**, covering all twenty required conditions: evolution and
singularity of the onboarding experience; entry, dismissal, no repeat prompt, Help replay, and
suppression by existing or imported work; tap-only interaction; replies that measurably change the
route, the featured Move, and the explanation; previews that carry the real panel's classes;
populated rather than empty previews; no static screenshot; sample labeling, captions, and
screen-reader descriptions; inert preview surfaces; all five component previews; isolation across
every path; truthful Review Center, Evidence, and Your Voice claims; no admission, grade,
improvement, or percentage promise; seven genres with distinctive-material leakage guards; no
invented research source; STEM Council unavailability in both the conversation and the real preview;
unknown-assignment handling; English / Spanish / bilingual completeness including inline quip
pairing; Back, Start over, Skip, and both exits; dialog semantics, focus placement on the next
reply, keyboard-only operation, 44px targets, polite announcement, Escape; reduced motion; 390×844;
200% reflow; dark appearance; and the dismissed Studio's density and navigation.

**Density: unchanged.** Fresh English 1440×960 reads **202 first-viewport words** with the
invitation present and **202** after dismissal — measured identically on the clean `e8391d5`
baseline (202 / 202 English, 209 / 209 Spanish). The invitation sits below the fold. A dismissal
measured without returning scroll to the top reads 445 in **both** builds; that is the documented
harness artifact (clicking a below-fold control scrolls the page), not a product change.

**Battery: 58 suites / 1,965 checks / 0 failures** — the whole repository, run against the final
code state. No suite was skipped and no flake recurred (the `studio_revision_cycle_test.mjs`
bulk-run flake seen mid-pass returned 22/22 in the final battery and 3/3 in isolation).

Screenshots reviewed internally (not committed — the repository's allowlist `.gitignore` excludes
them): opening; Moves preview; the decision beat; revision with the review-copy preview; Evidence
preview; Review Center on the Council reply; STEM Council unavailability; Your Voice preview;
Spanish; bilingual; dark; mobile 390×844 including an enlarged preview; admissions, research, and
CAP 200 openings; and the closing map.

## Checkpoint and bounded-preview deployment

**Checkpoint:** `b717d79ec32b513c809e964dc1876507380b8cde` on `migrate/pedagogical-engine-2026-08`
(local only — the remote backup branch remains at `e8391d5`; pushing the new commit needs separate
founder authorization).

**Deployment:** `d6bf13b3` to Cloudflare Pages project `tupana-preview`
(`https://d6bf13b3.tupana-preview.pages.dev`), serving `https://tupana-preview.pages.dev`.

**All 22 user-facing files verified sha256-identical** to the checkpoint on both the deployment URL
and the canonical alias: `studio.html`, `index.html`, `start-here.html`, `explore.html`, the five
studio modules, the ten legacy modules, and both stylesheets. A first pass appeared to show a
mismatch on three files; re-checking with cache-busting and redirect-following showed the canonical
alias had simply not finished propagating.

**Rollback targets, newest first:** `1a9bbdcc` (Quick Tour), `ca07932d` (first-contact clarity),
`b058711e` (branding), `ac390d62` (live-AI readiness), `f90ad8be` (pre-Studio R0 surface). The
`1a9bbdcc` deployment and the whole chain are preserved and restorable from the Pages dashboard.

**Post-deploy smoke on the live preview host: 19/19, with a provider-call ledger of ZERO.** No live
AI call was needed or made in this pass — the Review Center and Council entry points were verified
present and consent-gated without invoking them. Covered: studio boot; live provider resolution
(`gemini` on this host); the invitation; the conversation; **all five live previews rendering with
the live adapter active and zero requests to the Worker**; record unchanged after exit; untouched
desk; Review Center and Council entry points intact; the son's `?assignment=college-personal-statement`
link routing with its own genre material; STEM Council unavailability truthful; the Spanish route;
mobile without overflow; the son's `start-here.html` legacy tutorial still serving its genre; and no
page errors.

## Unchanged

Production (GitHub Pages, built from product `main` `0f66e46` — no build triggered; the Cloudflare
account holds only the `tupana-preview` project), the Worker (zero requests this pass), R0
(`1462aea`), the exploration worktree and its remote (`d8b92e8`), the migration remote (`e8391d5`),
and VC-OS (`main` == `origin/main` == `08ae31a`, clean). Nothing merged, nothing promoted, no SaaS
work, no analytics.

## Founder test script (~4 minutes)

Open `https://tupana-preview.pages.dev/studio.html`.

1. Open the preview in a browser where you have not used the Studio (or clear its site data).
   Does **Want Tu Pana to show you around?** read as an invitation you could ignore?
2. Take it. At the opening — does the first message sound like a companion or like a manual?
3. Pick **Help me get started**, then whichever difficulty is truest. Does the reply feel like it
   heard you? Does the Moves preview look like the real thing?
4. At **Your call**, choose **Reject it**. Does rejecting feel respected rather than discouraged?
5. At **Anything else?**, choose one more thing, then leave with **I'm ready to write**.
   Is the closing map useful — could you now find Moves, the Review Center, and Evidence?
6. Confirm your desk is exactly as you left it.
7. Replay from **Help**, take a different opening route, and use **Back** and **Start over**.
   Do the choices feel like they actually change the path?
8. Repeat once in Español, once in bilingual mode, and once with a different project link
   (for example `?assignment=graduate-sop` and `?assignment=stem-lab-report` — check that the
   Council is honestly described as unavailable there).
9. On your phone: take it once, and use **Enlarge this sample** on a preview.

**The questions to answer:** Did at least one moment make you smile without slowing you down? Does
Tu Pana feel like a companion with personality rather than a sequence of cards? Can you remember a
product truth partly because of how it was said? Do the choices feel meaningful? Does it teach
without feeling like instruction? Do you arrive at the desk wanting to try something?

And the one that matters most: **does this feel like a journey of discovery rather than another
thing to finish?**
