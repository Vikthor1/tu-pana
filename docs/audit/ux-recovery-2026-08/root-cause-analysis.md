# Root-Cause Analysis — Tu Pana Writing Studio UX Recovery Audit

**Deliverable 9 · 2026-07-31.** Companion to `issue-register.md` (UX-001…UX-085). Every register item is assigned to exactly one primary root cause below (secondary contributions noted). The question each cluster answers is not "what is broken" but "what machine keeps producing this class of breakage" — and why the July remediations (`09c7a91`, `84182d3`), which genuinely fixed their five named findings, could not have prevented these.

**The July pattern, stated once:** each remediation was a bounded fix applied *at a seam* — a new card, a new panel, a new mode split, a new label resolver — layered onto the architecture that produced the defect. The fixes hold (re-verified by all five inventories). But every one of them added another parallel pattern to the pile (import card, tech panel, next-actions card, two-mode hub, CTA resolver), which is itself the first root cause. Symptom-level repair at seams cannot converge while the generators below keep running.

---

## RC-1 — Accretion without an owner: every sprint ships a new parallel system

**Description.** No one owns "the" progress vocabulary, "the" navigation model, "the" evaluation grammar, "the" status channel, "the" button, "the" onboarding. So each feature sprint added its own: 4 progress vocabularies (phases / milestones / stages / in-stage steps — with "Paso" meaning two different things), 5 navigation paradigms, 4 evaluation surfaces writing to 2 stores with 3 decision grammars, ≥8 status-message patterns, ~60 button styles / ~16 modal families / 36 card classes, 2 onboarding systems that don't read each other's flags, and 2 focus systems fighting over one button.

**Mechanism.** Additive development with no deletion step and no base-component layer. Because every family is bespoke, cross-cutting obligations (44px targets, contrast, focus rings, dark mode, disabled-state reasons) must be re-applied per family — and are statistically always missed somewhere (dark primary buttons UX-026, modal close targets UX-054). Because every vocabulary is bespoke, no surface can translate another's claims ("Paso 2 de 5" vs "Completa la Etapa 4"), and single-purpose elements get reused beyond their truth (the Stage-6 saved-notice string firing at stage 1, UX-006).

**Explains:** UX-005, UX-006, UX-023, UX-026, UX-027, UX-028, UX-029, UX-031, UX-034, UX-048, UX-050, UX-054, UX-056, UX-060, UX-061, UX-064, UX-065, UX-066, UX-080, UX-084, UX-085.

**Why it survived July.** The July fixes were themselves accretions: F3 added an import card *and* a strip; F4 added a tech panel; F5 added a next-actions card. Each correct in isolation; each one more pattern a student must model. Nothing in the remediation contract required retiring a system when adding one.

**Structural removal.** R1 (single progress vocabulary, one movement spine, milestones out of the UI; screen-by-screen disposition map that *deletes* dead surfaces), R4 (one decision grammar + one ledger), R6 (buttons 65→6, one dialog family, one status pattern — making cross-cutting fixes single-point), R1 §3.1 (one onboarding sequence). The real removal is procedural: Concept B's control ledger (`proposed-navigation-ia.md` §10) enumerates every surviving control — anything not on it dies, and future additions must displace, not accrete.

---

## RC-2 — Chat as universal delivery channel

**Description.** The coach transcript is also the app's notice board, control panel, and archive: gate refusals, save confirmations, privacy notes, stage intros, research cards, revision panels, eval widgets, re-entry buttons, completion instructions — 18 distinct injected component types in one scrolling column.

**Mechanism.** Injecting into chat is the cheapest delivery mechanism, so everything routes there. Consequences follow mechanically: (a) the column only grows — rendered walks show on-screen words climbing ~1000 → ~2600 by stage 10 with `chatVisibleWords` 16 → 965, because a transcript never sheds; (b) anything delivered there is invisible when the panel is hidden — mobile Draft-tab users get gate refusals in a tab they aren't looking at, with the notification dot reserved for bot messages (UX-033); (c) SR users get one giant polite live region announcing interactive panels they can't reach yet (UX-055); (d) arriving anywhere on mobile lands on the chat tab because chat is where the app talks (UX-068).

**Explains:** UX-033, UX-049, UX-055, UX-068 (+ secondary: UX-035's affordances live in chat because everything does).

**Why it survived July.** F4 (coach leakage) moved *system noise* out of the coach voice — into a collapsed tech panel *inside the same column*. It fixed the voice confusion and preserved the channel monopoly.

**Structural removal.** R1 status rail (`proposed-navigation-ia.md` §5): refusals, saves, gating, and phase changes move to a dedicated, announced, mobile-dotted rail; chat returns to being a conversation. R3's Finish space dismantles the 1,674-word submit modal. Exit gate is measurable: the progressive-disclosure word-budget ledger.

---

## RC-3 — Storage is a pile of keys, not a model of the work

**Description.** ~44 localStorage names/families with no per-artifact timestamps, no canonical-draft marker, no versioning that's ever read, silent caps (50 decisions, 120 chat entries, N council runs), silent write failure everywhere but one path, origin-scoped invisibility, and merge-import with no confirmation. The work exists only as bytes under keys; nothing models "artifact, age, provenance, canonicity."

**Mechanism.** Because "which is newer" is unknowable (no timestamps), the packet picks the final essay by heuristic and stage number beats recency (UX-012). Because completion isn't evidenced by artifacts, traversal is recorded as done (UX-032). Because no store is authoritative about identity, a different origin is a factory reset with no explanation (UX-001) and an imported file is truth without question (UX-002). Because caps and write failures are silent, the evidence trail corrodes invisibly on exactly the most engaged students (UX-013, UX-014, UX-041, UX-043). Because Council decisions live in their own key with no ledger, the app's best pedagogical evidence never reaches the Process Note (UX-011, UX-037).

**Explains:** UX-001, UX-002, UX-011, UX-012, UX-013, UX-014, UX-015, UX-032, UX-037, UX-040, UX-041, UX-043, UX-053, UX-074, UX-075, UX-076.

**Why it survived July.** F1 fixed the *presentation* of save state (hub modes, truthful copy) — the storage model underneath was untouched. F3 papered the visible symptom (blank editors) with offer cards; the per-stage-keys-without-metadata design that creates stranded work is intact, so new edge cases keep leaking (UX-053, UX-074).

**Structural removal.** R0 supplies the independent import guard, minimum write-failure warning,
and interim final-draft confirmation; R2 adds sidecar artifact metadata, a work rail, a current-
draft marker, and snapshots; R3 adds the durable persistence-status model, eviction notice, and
origin honesty card. `proposed-save-persistence-model.md` §9 states the test: the P0 import
overwrite and P1 apparent-loss hazards become *structurally impossible*, not merely warned-about.

---

## RC-4 — Genre layer as content overlay on an essay-shaped engine, with silent fallbacks

**Description.** Genres were added as copy overlays (`ASSIGNMENT_LAYERS`) onto a fixed 10-stage essay engine. The Seam-B copy contract is genuinely good *inside coaching surfaces* — but every chain outside it (Council profiles, start-here routes, report/export/log surfaces, institutional framing, system-prompt rules) resolves independently, and every miss fails **silently to the autobiographical essay**.

**Mechanism.** Inherit-default is the universal fallback: unknown id → essay app (UX-046); missing council profile → essay Council with the offer still rendered (UX-007 — walk-confirmed `councilOffer: True` for STEM); missing tutorial entry → essay tutorial that also drops the genre from the app link (UX-009); report surfaces read `STAGES[n]` raw → essay stage names in a lab-report packet (UX-044). Meanwhile structure never adapts at all: milestone grouping, word-count pacing, the single stage-7 "revision" slot (UX-052). Nothing can *fail loudly* because no chain knows it's supposed to be genre-resolved.

**Explains:** UX-007, UX-008, UX-009, UX-044, UX-045, UX-046, UX-047, UX-052, UX-069, UX-071, UX-072.

**Why it survived July.** `84182d3` built the copy layer and its leakage guard — but the guard harvests only the surfaces the sprint touched (work-mode hub), and the sprint's scope was coaching copy. The chains outside the seam were never in scope, and their silent-inherit shape means no test, student, or founder walk *sees* the miss without knowing to look.

**Structural removal.** R0 item 4 (Council fallback becomes explicit/neutral or disabled + config-gap warning) immediately; R7 completes it (report/export surfaces via `stLabel()`, tutorial routes from the layer, unknown-id notice, per-genre institutional config, leakage guard extended to every export surface + a NEUTRAL-coverage assertion for UX-070). The doctrine change: **a genre gap must be loud** — never inherit the essay silently. Concept C (`future-state-concepts.md`) is the eventual structural answer to UX-052.

---

## RC-5 — Bilingual by concatenation instead of by resolution

**Description.** The app has a real 3-way language preference and a working span system — but a second, larger population of strings is authored as concatenated bilingual text: ~324 " · " joins in ui.js, 39 " / " joins in data.js, 6 fully hardcoded static modals, EN-primary Lab and tutorial, EN-only aria-labels, tone strings that double as language switches, and a regex heuristic deciding at render time whether chat text "looks bilingual."

**Mechanism.** When bilinguality lives in the *string* rather than the *data model*, every surface makes its own choice, and the preference becomes unenforceable: rendered walks show single-language mode removing only ~15% of on-screen words mid-journey (1356→1158) against a 50–55% design intent; the highest-stakes modals ignore the preference entirely; SR users hear every control twice; the mobile task bar can end up *empty* in EN mode because one CSS rule pair forgot to restore display; a marquee animation exists solely to scroll the doubled copy; the English half is systematically demoted to a contrast-failing color.

**Explains:** UX-017, UX-018, UX-019, UX-020, UX-021, UX-024, UX-025, UX-057, UX-058, UX-059.

**Why it survived July.** No July finding was bilingual; the genre-copy sprint even added strings in the same mixed encodings. The regression tests that exist (`bilingual_starter_test.mjs` etc.) test specific features, not the encoding invariant — so the four encodings kept coexisting under green tests (see RC-8).

**Structural removal.** R5: one `{es,en}` representation + `L()` resolver, migration batches
M0–M9 from `bilingual-content-strategy.md` (decision-moment modals first), tone/language
decoupling, terminology registry, Lab/tutorial parity, and single-language aria-labels. Its
word-count harness requires single-language duplicate suppression and evaluates optional
bilingual mode against absolute P6 budgets, converting the invariant from convention to test.

---

## RC-6 — Overlay/opacity show-hide architecture with no dialog manager; DOM as state

**Description.** Every overlay is permanently mounted (`display:flex; visibility:visible; opacity:0; pointer-events:none`) and "opened" by opacity; open/close, stacking, exclusivity, Escape policy, focus trapping, and re-entry are per-surface conventions. Separately, several UI facts exist *only* in the DOM: the review next-actions card, the AI-attribution chip, the typing indicator's boot state.

**Mechanism.** With no manager owning "what is open," nothing prevents two blocking surfaces at once — rendered walks caught the stage-4 reflection checkpoint blocking Continue, surviving *across* the transition to stage 5, and a celebration toast stacked on top of the save-confirm modal (UX-004); Stage 10's close buttons chain-open dialogs because chaining is each surface's private logic (UX-036). With semantic state inferable only from opacity, tests, walkers, and AT heuristics misread the app (the walker needed 18 clicks to conclude onboarding exit; `aria-modal` on untrapped dialogs tells SRs the background is gone while Tab walks into it — UX-022, UX-051). With DOM as the only record, a reload deletes real affordances (UX-035, UX-079) and ships a lying boot state (UX-030). Policy divergence is free: one modal is Escape-proof (UX-062), another discards three AI readings on ✕ (UX-063).

**Explains:** UX-004, UX-022, UX-030, UX-035, UX-036, UX-051, UX-062, UX-063, UX-079.

**Why it survived July.** F5 made the review *button* persistent but stored the next-actions card in the DOM — the remediation used the architecture it needed to replace, so the fix decays at every reload. No July finding was about dialogs as a system; each surface's behavior looked locally reasonable.

**Structural removal.** R1 (previews → inline headers; checkpoints inside their step; **walker-asserted invariant: zero stacked blocking surfaces**), R4 (review center persisted from the ledger, not the DOM), R6 (one dialog family with contract-keyed traps and a single open/close/stacking owner). The walker harness built for this audit becomes the permanent enforcement instrument.

---

## RC-7 — Disclosure/consent and destruction/friction designed per-feature, not per-architecture

**Description.** The app contains the *gold standard* (D4–D7: "your complete draft (N words) will be sent three times…", capstone stripping `maniSentence` to keep its note literally true) and, on adjacent paths, the opposite: `maniSentence` silently attached to every chat send; header Reset destroying everything behind one native confirm while its sibling got a typed-confirmation danger zone; import applying silently while clear requires typing BORRAR; backup advice "export regularly" with the button two collapsed levels deep; Council availability as invisible policy; silent model upgrades; the Stage-6 passage-help hole.

**Mechanism.** Each feature negotiated its own consent/friction level at build time. There is no architectural rule of the form "every send of student prose names its payload at the moment of consent" or "every irreversible act gets the same friction tier" — so the standard exists wherever a sprint happened to set it, and nowhere else. New features inherit nothing.

**Explains:** UX-003, UX-010, UX-016, UX-067, UX-077, UX-081, UX-082 (+ secondary on UX-002, UX-015).

**Why it survived July.** F1 applied the friction principle to exactly one control ("Borrar mis datos") because exactly one control was in the finding. Reset and import weren't named, so they kept their 2025 behavior — the definition of symptom-at-the-seam.

**Structural removal.** R0 items 2–3 (reset/import join the friction tier now); R3 (destruction physically leaves the routine path — a tiering by *screen*, not by per-control judgment); R4 §6 (disclosure completion: one moment-of-consent contract covering every send path, with disclosure tests as the exit gate — the D4 pattern promoted from best instance to law).

---

## RC-8 — Contracts by convention; a test suite that freezes behavior, including wrong behavior

**Description.** Critical agreements are hand-synced parallel lists or data coincidences: requestKind lives in three lists across client and Worker with unknown kinds silently mis-budgeted; the "NEUTRAL, never default" genre contract is enforced by data coverage, not code; `tupana_schema_version` is written and never read; the Worker's 403 is unreadable by design; dormant config arrays await a consumer that would misuse them. Meanwhile 36–38 suites run green — because the tests assert *current* behavior: the leakage guard harvests only work-mode; the storage test guards the key list, not semantics; no test asserts "the saved notice tells the truth at stage 1," "stage 10's CTA isn't self-referential," or "single-language mode halves the words."

**Mechanism.** Hand-synced seams drift silently by construction (the only failure signal is a student-visible malfunction with no error). And a green suite actively *defends* defects: any fix to UX-006 or UX-048 changes output that no test covers but every future refactor is checked against; the suite's authority ("38 suites green" as the ship gate) converts "unspecified" into "correct." This is how a product can pass every gate while the rendered walk shows the primary CTA lying at stage 10 in all seven genres.

**Explains:** UX-038, UX-039, UX-042, UX-070, UX-073, UX-078, UX-083 (+ secondary on UX-006, UX-044, UX-048).

**Why it survived July.** It *is* the July survival mechanism in miniature: each remediation added tests for its own fix, ratifying the surrounding behavior as baseline. Bounded sprints + behavior-freezing tests = local convergence, global drift.

**Structural removal.** Cross-cutting, so it rides every batch rather than owning one: R2's versioning makes schema a read contract (UX-042); R4 exports one kind/budget table and a readable non-retryable 403 (UX-038/039); R7 extends the leakage guard to export surfaces + NEUTRAL-coverage assertion (UX-070/073). The deeper change is in the roadmap's sequencing rules: **experience snapshots regenerate per batch and the walker diff runs at every close** — tests move from freezing implementation output to asserting student-facing invariants (nothing interposes; CTAs name real destinations; single-language halves words; save messages are true). Acceptance criteria in `acceptance-criteria.md` are written in exactly that register.

---

## Coverage check

All 85 register items map to a primary RC: RC-1 ×21 · RC-2 ×4 · RC-3 ×16 · RC-4 ×11 · RC-5 ×10 · RC-6 ×9 · RC-7 ×7 · RC-8 ×7. (Secondary contributions noted inline; sums count primaries only.)

## The three that matter most

If only three generators could be shut down: **RC-3** (it owns the P0 import-overwrite path and
the packet's integrity), **RC-6** (it owns the defects that physically block the primary CTA, and
it is why fixes decay), and **RC-1** (it is the meta-cause: until additions displace instead of
accrete, every batch — including remediation — will otherwise deposit another layer). The other
P0, destructive Reset, belongs to RC-7. RC-5 is the largest single population by word count and
the clearest equity issue, but it is a migration with a known shape, not an open design problem.
