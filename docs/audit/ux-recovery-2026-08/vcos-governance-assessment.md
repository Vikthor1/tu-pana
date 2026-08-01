# VC-OS Governance Assessment — UX Recovery Audit

**Deliverable 23 · Audit branch `audit/ux-recovery-v1` · Baseline `84182d3` · 2026-07-31/08-01**

Scope: how VC-OS governance behaved across the Tu Pana campaigns that produced the current
experience, judged against one question — *did the rules allocate friction to real consequence,
and did they help or hinder the product becoming usable?* Evidence is the decisions.log lineage,
the supplied Tier 0–3 VC-OS governance-by-consequence doctrine (an external governance artifact,
not stored in this product repository), the close contract, and the observed
shape of the 2026-07-31 → 08-01 remediation cycle.

---

## 1. Where VC-OS correctly protected quality and safety

These are load-bearing and none of the recommendations below weaken them.

| Protection | Evidence it worked |
|---|---|
| **Never-self-approve lived-experience gate** | The single most valuable control in the record. At C2, 36/36 automated suites were green and the Council passed — and the founder's lived test still returned *journey FAIL* with five systemic findings. Automated green ≠ usable; only this gate caught that. |
| **Test-first boundary discipline** | The tutorial suite caught a privacy beat that was skippable before commit; the genre-leakage guard caught a token-mapper bug that silently killed coaching cards (`applyGenreTokens` array regression). Real defects, caught pre-ship. |
| **Deployment-drift verification (B2 pattern)** | Live probe found the deployed Worker predated the client contract (`capstone_review` falling to default config with thinking on). "Capacity deployed" claims in docs were wrong; the probe was right. Never trust the push. |
| **Privacy and disclosure invariants** | Student-name redaction (31 occurrences/27 files) in the teaching-feedback plane; disclosure-before-send contracts on full-draft, capstone, and Council transmissions; metadata-only receipts. These are Tier 3 done right. |
| **Push-at-close discipline** | The Codex worktree deletion (external tool erased the working directory; branch survived only because commits existed in the main repo's object store) validated the "push experiment branches at every close" rule the hard way. |

## 2. Where VC-OS encouraged premature closure

**The unit of work is the batch; the unit of student experience is the journey.** The record shows
a repeating cycle: bounded sprint → N/N suites PASS → govern-close → founder lived test → new
systemic findings → new bounded sprint. Concretely: `09c7a91` closed a five-finding remediation
with a green board; the very next founder test surfaced two more cross-genre defects (`84182d3`) —
whose root cause ("seams were made genre-aware but not the content") was a *continuation of the
same architectural problem*, not a new one. Each close was locally true ("scope complete") and
globally misleading ("experience recovered").

Nothing in the close contract asks: *does the sum of closed batches equal a usable whole?* The
lived-experience gate partially compensates, but it fires late (after build), and every FAIL it
produces is scoped into another bounded patch sprint rather than a mandate to re-examine
architecture. This audit is the first artifact in the lineage authorized to ask the architectural
question directly.

## 3. Where VC-OS prevented (or taxed) cross-cutting UX work

- **Tier 2 presumes a bounded, pre-scoped sprint.** Cross-cutting experience work is by nature
  unbounded at authorization time — you don't know the blast radius until you've audited. Under
  the current doctrine, honest UX work either (a) gets pre-shrunk into a scope that fits the
  authorization ("fix these five findings"), or (b) trips "doubt escalates" and stops for the
  founder repeatedly. Both happened in July.
- **Shipped-contract tests encode current UX as law.** Two remediation commits each required
  documented "shipped-contract test updates" — the tests correctly froze *behavior*, but the frozen
  behavior included experience decisions now known to be wrong (e.g., stage-8 review assertion
  inverted per F5). Cost of change scales with breadth of change, which structurally favors local
  patches over systemic redesign. There is no test tier that distinguishes *safety contract*
  (never violate) from *experience snapshot* (expected to churn during redesign).
- **Frozen scopes required founder revision to escape.** B9 (Academic Studio) shipped correctly
  only because the founder personally revised a frozen scope mid-campaign. The mechanism for
  "the scope itself is wrong" is founder intervention, not a governed path.

## 4. Where prior decisions were treated as immutable design constraints

decisions.log constraints have one standing: recorded = binding. This is correct for safety
invariants (authorship gate, no-prediction rules, disclosure-before-send) and wrong for design
choices that were simply the best guess of their sprint (the both-languages-always label format,
the 10-stage presentation, the save-hub layout, stage-keyed CTA copy). The 2026-07-31 close even
records "standing cross-genre contracts: nav contract, neutral coachFocus fallback,
save/submission separation, review re-entry" — four *experience patterns days old* now carrying
doctrine weight. There is no vocabulary for "decided, revisable with evidence" vs "invariant."
This audit's authorization ("prior decisions are evidence and history; they are not immutable
design constraints") is exactly the missing distinction — but it currently exists only as a
one-off founder prompt, not as a governed mode.

## 5. Approval friction that did not reduce meaningful risk

- **Governed-close ceremony for analysis-only work.** Batch audits and design reviews (no repo
  writes, no transmission) carry the same close overhead as mutating sprints. Tier 0 exists in
  doctrine but close practice doesn't use it.
- **Preview iteration pays near-production ceremony.** The family preview is household-bounded,
  static, and disposable by decision #3 — yet every content iteration pays restage + redeploy +
  origin-verification + record. The doctrine's "external transmission = Tier 3" is right as a
  default and too blunt for a *pre-authorized, bounded* preview channel (see §7).
- **"Doubt escalates" during exploration.** Correct posture for canonical/production planes;
  inside an isolated worktree whose writes are non-canonical by construction, it converts every
  novel act into a founder stop and makes exploration serial on founder attention.

## 6. Preview experimentation vs production release — the missing distinction

The tier system classifies by consequence *class* (network, canonical, destructive) but has no
concept of a **plane** whose consequences are bounded by construction. A redeploy of
`tupana-preview.pages.dev` (household audience, disposable project, retire-by-release-decision)
and a deploy of production Pages are both "external transmission." The result in practice:
either preview iteration is over-governed, or — the real risk — ceremony fatigue eventually
erodes respect for the gate that actually matters (production). Distinguishing the planes
*strengthens* the production gate.

## 7. Proposal: permanent bounded **UX Exploration Mode** (founder decision required — Tier 3)

A standing mode the founder can open per campaign, replacing one-off authorization prompts like
the one that launched this audit.

**Opening an Exploration Window (one founder act) fixes four things in writing:**
1. **Protected invariants** — non-negotiable regardless of creative freedom: no production
   deploys/merges; no real student data; no destructive/irreversible migrations; no weakening of
   privacy, security, authorship, or student-agency protections; no silent rewriting of student
   work; bilingual support preserved; disclosure-before-send preserved; `external-side-effect-
   boundary` untouched.
2. **The exploration plane** — a named branch/worktree + (optionally) ONE named preview channel
   with a bounded audience, pre-authorized for repeated redeploys *within the window*. Writes to
   this plane are non-canonical by construction; "doubt escalates" is replaced there by "doubt is
   an experiment: try it reversibly and record it."
3. **Evidence checkpoints instead of batch closes** — the window produces findings, prototypes,
   and comparisons, committed to the exploration branch as they land. No govern-close per
   iteration; one consolidated close when the window ends. Checkpoints are append-only evidence,
   never approvals.
4. **The exit** — the founder selects a direction from presented alternatives. Nothing promotes
   automatically. **Promotion re-enters full normal governance**: authorized implementation
   sprint, safety-contract tests intact, Regression Guard, lived-experience gate, release gates.
   Prototype code is presumed disposable; anything promoted is re-implemented or re-reviewed to
   product standard.

**Supporting doctrine changes (all Tier 3, all founder-decided):**
- Add an *exploration plane* class to the VC-OS read/mutate boundary doctrine (writes non-canonical by
  construction; enumerated preview channel as a bounded transmission exception recorded per-window).
- Split the test suite's contract vocabulary: **safety contracts** (leakage guards, disclosure,
  authorship, persistence integrity — never relax) vs **experience snapshots** (expected to be
  rewritten when the founder approves a redesign; updating them inside an approved redesign needs
  documentation, not renegotiation).
- Add a decisions.log constraint marker distinguishing **invariant** from **revisable-with-evidence**,
  so future sprints know which prior decisions bind and which merely inform.

**What this mode explicitly does NOT change:** production release gates, founder approval of
merges, privacy/security/data-integrity rules, the lived-experience gate (it remains the exit
criterion for any promoted redesign), or the emptiness of `external-side-effect-boundary`.

### 7.1 Final contract classification for founder review

The closeout uses three explicit classes. This is a proposal for a later founder-governed VC-OS
change; it does **not** modify VC-OS in this audit.

| Class | Meaning | Examples | Exploration treatment |
|---|---|---|---|
| **Immutable safety contract** | A protection whose weakening can expose student work, privacy, authorship, agency, security, or production integrity | disclosure-before-send; no silent rewriting; authorship gate; admissions no-prediction/no-prestige rules; no real student data in experiments; no destructive migration; persistence round-trip and no-silent-overwrite; production merge/deploy gates | Must remain green in every experiment. A prototype that cannot preserve it is rejected; the contract is never rewritten to make a concept pass. |
| **Revisable experience decision** | A current design choice that may be replaced when evidence supports a better student experience | ten-stage presentation; per-stage artifacts; milestone and progress vocabulary; navigation controls; save-hub layout; status rail; dialog shape; bilingual density/presentation; future-state concept | May change inside an authorized Exploration Window. The change and evidence are recorded; founder selection is still required before implementation. |
| **Experience snapshot** | A test or fixture describing a particular approved UI/output, not a safety property | exact CTA wording/format, modal composition, hub layout, milestone copy, stage-preview behavior, screenshot baselines | Preserved as history, then regenerated only after a founder-approved experience decision. It must never be promoted to immutable status merely because it is currently green. |

Classification is by consequence, not file or suite: one test file may contain both immutable
assertions and revisable snapshots and must be split or annotated before redesign work begins.

## 8. Governance friction encountered by THIS audit

Logged per the audit brief ("document the conflict; do not quietly narrow the audit"):

1. **Checkpoint/record skew at start.** The product checkpoint (`84182d3`, pushed, suites green)
   was ahead of its VC-OS governance record — the 2026-08-01 sprint's decisions.log entry and
   context.md close were still pending when this audit was authorized. The audit proceeded from
   the *verified product checkpoint* per the founder's instruction; the pending governed close
   should still be completed. No production or data-safety conflict — recorded, not escalated.
2. **Gitignore allowlist vs audit artifacts.** The product repo's allowlist gitignore requires
   explicit `!` entries for every new audit path — right default for a student-facing repo,
   mild ongoing tax on evidence-heavy audit work (screenshots, JSON logs). Handled with a scoped
   allowlist entry for `docs/audit/`; an Exploration Mode should pre-authorize its evidence paths.
3. **No plane for this audit's preview needs.** Any prototype the audit wants founder eyes on
   must either ride the existing household preview channel (whose recorded purpose is the son's
   admissions use) or request a new Tier 3 authorization. This is §6 in miniature; resolved here
   by keeping prototypes local-only (screenshots + local server) unless the founder asks to see
   them hosted.
4. **No conflicts requiring escalation** were encountered involving production, student data,
   privacy, or irreversibility.

## 9. Closeout position

The bounded UX Exploration Mode proposal stands. It is deliberately narrower than a governance
rewrite: it creates a reversible evidence plane while leaving production, data-safety, founder
approval, and lived-experience gates untouched. The next action is a founder decision on whether
VC-OS should later adopt the three-class vocabulary and Exploration Window mechanism. This audit
made no VC-OS doctrine, policy, decisions-log, boundary, or tooling change.
