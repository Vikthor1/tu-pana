# Fall-readiness pass — authentic work, Reading Response, STEM Council, first-use onboarding

**Founder direction (2026-08-05):** the accepted Writing Studio candidate is the protected
baseline for completing fall-readiness toward bounded student-facing family testing. It is **not**
authorized for production promotion, merge, or SaaS implementation. This pass implements four
product tasks in the migration plane only.

**Plane:** branch `migrate/pedagogical-engine-2026-08`, worktree
`~/Sites/tupana-writing-studio-migration`. Product `main` (`0f66e46`), R0 (`1462aea`), exploration
(`d8b92e8`), production GitHub Pages, and the shared Worker are untouched.

---

## 1. Remove fake-text testing affordances

### What was found

| Surface | Finding |
|---|---|
| Editor actions, empty draft | **"See a sample" / "Ver un ejemplo"** button calling `useSample()`, which wrote a whole synthetic essay from `genres[id].sample` straight into the canonical draft. |
| Paste dialog | Opened **pre-filled with that same synthetic essay**, in both the textarea and the exact-preview element. Its confirm button read **"Replace draft with this synthetic text" / "Reemplazar con este texto sintético"**. |
| Simulated-coach banner | "Practice preview — the coach is simulated on this device. **Do not paste real coursework.**" |
| Profile registry | Seven `sample:` fields holding ready-made draft prose, existing only to be injected. |
| Inherited dead paths | `notebookSample()`, `useNotebookSample()`, and "Paste synthetic notebook material" — unreachable (`concept` is a const) but shipped in the bundle. |

### What changed

The sample control and `useSample()` are gone, and the `sample:` fields are removed from all seven
profiles, so **no code path can put prose the writer did not write into the canonical draft**.

The paste dialog opens empty, with the placeholder "Paste your own draft here…", and its exact
preview mirrors what the writer actually supplied — restoring the meaning "exact preview" carries
everywhere else in the Studio.

The banner keeps saying plainly that the coach is simulated, and drops the coursework line: in mock
mode nothing is transmitted, so it protected nothing while framing the app as something to test.

The dead notebook sample paths are removed too, so the fake-text layer is absent from the bundle
rather than merely unreachable.

### What was deliberately kept

Guided Discovery's demonstrations, and the Moves' example structures. Both are **labelled
pedagogy**, not testing invitations. A Move's example ships as "See a quick example" / "Ver un
ejemplo breve" beside "Hypothetical structure—not suggested content. Use your own facts and
wording." Test fixtures and synthetic drafts inside the automated suites are untouched; coverage
was not reduced.

### Regression evidence

`studio_authentic_work_test.mjs` — **133 checks**. Sweeps every production-facing state (seven
genres × English/Spanish/both-mode × desktop and phone; selection screen, unknown-assignment stop,
Moves, Review Center, Ask Tu Pana, focused review, Council, Evidence, Reflection, Finish, Settings,
Help, I'm stuck, paste dialog).

The matcher is **proved non-vacuous**: it is run against the exact strings removed here and must
still catch them, and against the legitimate pedagogy it must never ban. One asymmetry was found
and fixed while building it — the Spanish list originally banned `ejemplo`, which would have
outlawed the Move example structure.

---

## 2. Reading Response / Reading Reflection

One shared pedagogical family, **two declared configurations**. Moves, deeper guidance,
source-integrity rules, and reference notes are authored once; the levels differ by declared
configuration, never by a second engine. Two Move ids are literally shared.

| | Undergraduate | Graduate |
|---|---|---|
| Link | `reading-response-undergraduate` (alias `reading-reflection-undergraduate`) | `reading-response-graduate` (alias `reading-reflection-graduate`) |
| Typical length | ~250–500 words | ~1,000–1,700 words / ~two pages |
| Moves | 4 | 5 |
| Move 1 | Name the text and what you are answering | Frame the text and the problem you are entering |
| Move 2 | Say what you think, not only what it says | Stake an interpretive position |
| Move 3 | Hold the passage exactly, then explain it | Represent the evidence precisely |
| Move 4 | Say why it matters, and what is still open | Take the strongest competing reading seriously |
| Move 5 | — | Name the disciplinary and methodological stakes |

The graduate configuration is **not an inflated undergraduate one**. It drops the
summary-versus-response Move a novice needs, reframes the claim Move as taking a position with its
standpoint made explicit, and adds counterinterpretation and disciplinary/methodological stakes as
Moves of their own.

Length guidance ships as a **closed reference note** stating that the instructor's directions
govern. It is never a gate, never a submission rule, never counted as evidence.

### Source integrity now actually reaches the model

`genreContext` was a seam the prompt builders accepted but **nothing populated**, so genre rules
never travelled with a request. Profiles may now declare `coachRules`, carried on every passage,
full-draft, Council reviewer, and Council synthesis request under the existing additive header that
cannot relax the authorship rules above it.

For this family the rules state that Tu Pana **has not read the assigned text**; must never invent,
complete, or supply a quotation, page number, citation, or bibliographic detail; must never imply
it verified a reading; must say what cannot be checked from what it received; must preserve quoted
material exactly; must not launder copied language through paraphrase; must not ask for a whole
copyrighted reading; must not treat all summary as error; and must never require — or penalise the
absence of — a cultural, multilingual, community, or lived-experience connection.

### Council decision — DISABLED

No bounded, separately coherent Council configuration exists for responding to someone else's text.
Building one would mean relabelling general-writing roles or shipping an unproven source-integrity
surface. The profile states this in its own words rather than the generic line, and points to what
does work. **Focused review and Ask Tu Pana are fully operational** and carry the same rules.

### Routing fails closed

A bare `reading-response` / `reading-reflection` link is deliberately unmapped: guessing the level
hands a seminar writer a novice scaffold, or the reverse. It reaches the configuration-required
stop, which lists both levels.

### Evidence

`studio_reading_response_test.mjs` — **118 checks**: family structure, routing, every genre surface
in three language modes, the transmitted prompt contract, and adversarial cases (partial source
material, a request to invent a citation, cross-genre leakage both directions, consent
cancellation, provider failure, record integrity, phone/keyboard/reduced-motion).

---

## 3. STEM audit and Council operationalization

### Audit findings

1. The `stem` profile inherited the legacy **"STEM Lab Report & Scientific Explanation"** layer
   (`genre-template.js:676-807`, read-only at R0) but was labelled for the lab report alone — one
   profile silently covering two disciplinary genres.
2. `?assignment=stem` resolved to it **without asking which**.
3. The Council was `enabled: false` with **no roles at all**; it had never been operational.
4. Its display labels — **"Lab instructor"**, **"Scientific clarity editor"** — named an authority
   that can confirm scientific correctness.
5. **No discipline rules reached the model on any STEM request**, because `genreContext` was never
   populated (see §2).
6. One Move example called the linking concept "the **verified** scientific concept", which reads
   as a claim this system cannot make. Reworded.

Passage coaching and full-draft review were active and genre-specific via lenses and Moves, and no
humanities/admissions/autobiographical leakage was found on the STEM desk.

### Three bounded profiles

| Profile | Link | Moves |
|---|---|---|
| Lab or methods report | `stem-lab-report`, `stem-methods-report` | 3 (unchanged) |
| Technical or scientific explanation | `stem-scientific-explanation`, `scientific-explanation` | 4 |
| Evidence-based scientific argument | `stem-scientific-argument`, `evidence-based-scientific-argument` | 5 |

Explanation and argument share the reasoning Move from one authoring source; only the argument
profile carries counterclaim and limits-and-uncertainty Moves, because only it has a live
disagreement to settle.

**A "research summary" profile was deliberately not added** — it would overlap the existing
Research Paper profile, and no current product need calls for it.

### Failure boundaries

A bare `stem`, a vague `stem-writing`, and any unrecognised STEM id resolve to nothing and reach
the configuration-required stop, which lists all three genres and inherits no Moves.

Closing this needed a second fix: the resolver's fallback assigned the raw id straight to
`state.genre`, so **any id equal to an internal profile key bypassed the alias map entirely** —
which is why `?assignment=stem` still reached the lab report after the alias was withdrawn. The
alias map is now the only route from a link to a profile.

### The Council

Purpose-built, not general roles renamed:

| Perspective | Examines | Explicitly may not conclude |
|---|---|---|
| **Reasoning and Evidence** | whether each claim connects to evidence the student supplied, and where the reasoning is missing or overstated | that any claim is scientifically true, any calculation correct, or any result valid |
| **Disciplinary Clarity and Audience** | terminology, causal explanation, organization, what the intended reader needs | evidence quality and limitations (another reader's job); never replaces a chosen technical term |
| **Methods, Uncertainty, and Limitations** | qualifiers, assumptions, procedural explanation, scope, uncertainty, limitations | never invents a method, control, source of error, or what the true result should have been |

Synthesis order `reasoning > uncertainty > audience`. Shared by all three STEM profiles.

It runs on the **existing approved AI pathway** — same consent gate, exact preview,
verbatim-anchor validation, caps, code-recomputed corroboration, preserved disagreement,
all-or-nothing truth, safe persistence. **No Worker change, no new external service, no
data-retention change, and no architectural change was required**, so no boundary decision was
escalated.

Each perspective now **describes itself distinctly before consent**. All three previously showed
the student "Looks for one strength and one question" — three purpose-built readers presented as
one generic offer. The reasoning perspective now says plainly that it cannot judge whether the
science is right.

### The truthfulness contract

Carried on every STEM request (passage, full-draft, reviewer, synthesis): never imply verification
of scientific correctness, a calculation, a measurement, a design, or an external source; never
invent data, results, units, equations, methods, controls, or citations; never alter, recompute, or
"correct" a quantity the student wrote; distinguish internal consistency from external factual
verification and name which is being done; ask a question when evidence is insufficient; import no
humanities, admissions, or autobiographical expectations; do not flatten disciplinary terseness.

### Evidence

`studio_stem_council_test.mjs` — **105 checks**, including adversarial kernel cases: an invented
quotation about a recomputed value is discarded rather than stored; a verbatim-anchored finding
survives with role identity taken from the request record; a malformed reviewer response fails
safely; an all-reviewer failure stores nothing; a provider failure announces truthfully and leaves
the draft unchanged.

---

## 4. First-use Guided Discovery onboarding

A genuinely new writer — configured project, empty workspace, no onboarding answer — meets a calm
welcome **before the Desk's full choice architecture**: Guided Discovery as the primary action, "Go
straight to my Desk" as an equally visible secondary, and a truthful line that the conversation can
be restarted from Help.

It is a **surface, not a gate**: no modal, nothing blocked, no penalty for skipping, no second
prompt afterwards. The accepted conversation is unchanged — same pacing, warmth, restrained humour,
live annotated previews, progressive disclosure.

### Existing writers are protected

`shouldOfferWelcome` now fires only when work **exists** — a draft, versions, reviews, Council runs,
Move notes, kept Voice entries, or an applied legacy import. Those writers keep the quiet,
dismissible invitation below the editor and are never interrupted merely because a preference key
is absent. Their record is never modified, cleared, migrated, or reinterpreted; the only observed
difference across an onboarding decision is the record's own `savedAt` timestamp.

Onboarding state remains **interface preference** in its own key (`tupana-studio:tour:v1`) beside
the Studio record, never inside it, and is never process evidence or student work.

### Two defects found and fixed

- Leaving the conversation returned the writer to the welcome, because it was still rendered behind
  the dialog and nothing re-rendered on close. Starting is itself the answer, so the underlying
  surface becomes the Desk immediately.
- Closing the conversation dropped keyboard focus onto `<body>` when opened from the welcome, since
  focus restoration only handled the Help origin. It now lands on the writing surface.

### Genre, language, and isolation

The welcome renders inside the resolved project, names it, and skipping lands on that project's
Desk — verified for reading-response, STEM, and admissions routes. English, Spanish, and both-mode
all render, and the language choice survives the skip. Demonstrations stay labelled Sample/Muestra,
inert, and outside the canonical draft, notes, evidence, Voice Vault, versions, exports, and packet.

**Cross-device synchronisation of onboarding state was deliberately not built.** Recorded as a SaaS
account-level consideration.

### Evidence

`studio_onboarding_test.mjs` — **73 checks**.

---

## Shipped-contract updates

Deliberate, founder-authorized changes to previously-asserted behaviour:

1. **STEM Council availability.** `studio_profiles_test`, `studio_council_test`, and
   `studio_tour_test` asserted the STEM Council was unavailable. Reading Response is now the
   genuinely unavailable case and carries those truthfulness checks; positive STEM Council coverage
   was added alongside.
2. **First-contact entry surface.** `studio_tour_test` asserted a fresh project shows the welcome
   card below the editor. A fresh project now shows the first-run surface; existing and imported
   work now receive the quiet card (previously they received nothing).
3. **Density gate.** Previously one measurement of the fresh Desk. Now two: the welcome (121 words)
   and the Desk reached by skipping (≤205, the established budget).
4. **Desk suites seed onboarding as answered.** Sixteen suites test the Desk, not onboarding; the
   welcome that precedes it has its own suite.

---

## Deferred / recorded for the pre-SaaS UX audit

- A bare load with no `?assignment` activates the canonical autobiographical default rather than
  requiring a choice. **Pre-existing** — verified identical on `79bb01a` — and now more visible
  because onboarding names the project. Not changed here; it would reopen accepted routing.
- Inherited dead concept renderers (`renderNotebookWorkspace`, `renderDeskWorkspace`,
  `renderJourneyWorkspace`, `renderHybridWorkspace`) remain unreachable behind `const concept =
  'integrated'`. Their fake-text affordances are removed; the renderers themselves are audit debt.
- `package.json` and `test-server.js` remain gitignored, so the Playwright toolchain version is
  still not captured in the repo. **Not touched by this pass**, per direction.
- Cross-device onboarding state (SaaS account-level).
- A Reading Response Council, if a bounded and provably safe configuration is ever authorized.

## Known limitations

No claim is made about live model behaviour beyond the bounded validation recorded below. The
deterministic suites assert the contract this codebase controls — which rules are placed in the
transmitted prompt, what the student is shown before consent, and what the validation kernel
refuses to store — not what the model says.

Acceptance to date remains **one founder, one device, one browser**. VoiceOver and other assistive
technology, other iOS devices and versions, Android, other browsers, and representative-student
testing have not occurred.
