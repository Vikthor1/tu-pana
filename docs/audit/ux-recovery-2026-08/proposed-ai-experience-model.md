# Proposed AI Experience Model — Tu Pana Writing Studio

**Deliverable 15 · UX Recovery Audit 2026-08 · Provisional Concept B "The Honest Journey" spec
(future-state-concepts.md; not approved for implementation) · Governing principles: P8 (one AI relationship), P12 (trust is
earned by truth) · Evidence base: inventory/ai-interaction-model.md (touchpoints T1–T13,
findings F1–F14, disclosure map D1–D8).**

This document specifies future-state **behavior only** — what a student sees and can do. It
proposes no code. All labels are bilingual, written as 'Spanish · English' pairs. The Council's
report itself — preserve-first section, corroboration counts, verbatim anchors,
disagreements-as-your-call — is **explicitly out of scope for redesign**: it is the
demonstrated-quality asset (C2 verdict: Council PASS, journey FAIL). Everything here redesigns
the *access, memory, and continuity around* that asset.

---

## 1. The model in one paragraph

One AI relationship, one loop: **ask → hear → decide → revise → verify.** Coach chat, passage
help, focused lenses, the Review Council, and the Stage-10 capstone compare are rungs of a
single escalation ladder, presented in one place per context. Every AI output that proposes
something answers to **one decision grammar** — Aceptar / Adaptar / Rechazar / Decidir después ·
Accept / Adapt / Reject / Decide later — and every decision lands in **one persistent ledger**
that (a) is visible to the student at all times in the Review center, (b) drives the
verify-after-revision loop (`recordCouncilVerification`: improved / partial / active), and
(c) renders the Process Note's AI-attribution and decision sections automatically. Every send
path has a moment-of-consent disclosure that is *literally true*; every failure state says what
happened, what survived, and the one next step — and permanent failures never dress as
transient ones.

---

## 2. The escalation ladder

One ladder, five rungs plus a floor. Each rung's surface names the rung below (the off-ramp)
and the rung above (the escalation) — the pattern the current review-dialog chooser already
demonstrates and this model generalizes.

| Rung | Name (label) | Stages | Where it appears | Off-ramp / escalation shown |
|---|---|---|---|---|
| R0 | Atascos y micro-ideas · Stuck help (no AI) | 1–10, every mode incl. offline | "Estoy atascado · I'm stuck" button in the chat panel | Escalate: "Pregúntale al coach · Ask the coach" (R1) when a live mode is on |
| R1 | Coach (conversación) · Coach chat | 1–10, mode ≠ offline | Chat panel | Escalate: passage menu hint after a reply that quotes the draft |
| R2 | Ayuda con un pasaje · Passage help | 1–5 and 7–9 (see §2.1) | Select text in the editor → passage menu | Down: "Solo pregunta · Just ask" (chip → R1). Up: after 2 passage actions in a session, one-line offer "¿Una lectura completa? · A full reading?" (R3, stages 7–9 only) |
| R3 | Lente enfocada · Focused lens (full draft) | 7–9 | Footer "Revisar mi borrador · Review my draft" → shared review dialog (kept) | Down: "Trabaja con un pasaje · Work with a passage" (kept). Up: Council offer in the same dialog (kept) |
| R4 | Consejo de Revisión · Review Council | 7–9 (launch); reports readable 7–10 | Same shared review dialog (kept) + Review center | Down: lens chooser in the same dialog. After report: decision rows (§3) |
| R5 | Comparar con el coach · Compare with the Coach | 10 | Capstone flow, after evidence-first reflections (kept) | Down: Review center read access to prior reports (§5) |

The **shared review dialog housing R3+R4 is preserved unchanged in concept** — the audit
identified it as the strongest "one system" move in the app. What changes is that its outputs
and re-entry points stop being ephemeral (§5).

### 2.1 Change — close the Stage-6 passage-help hole

- **Evidence:** F13 — the passage menu's AI quick actions are live during the Stage-6
  unassisted-draft window before the authorship save; the gate governs stage advancement only.
- **Student consequence:** sentence-level AI feedback is obtainable on the draft the app calls
  "unassisted," softening the gate the whole pedagogy stands on.
- **Root cause:** the passage seam checks connection, not the authorship gate.
- **Recommendation:** during Stage 6 pre-save, the passage menu still opens but its AI actions
  render disabled with the truthful reason "Primero tu borrador sin ayuda — guárdalo y estas
  opciones se abren · Your unassisted draft comes first — save it and these options open."
  Proteger and non-AI options unaffected. Stages 1–5 passage help remains available (feedback ≠
  prose is standing doctrine; this model documents rather than reverses it).
- **Acceptance test:** at Stage 6 with no authorship save, selecting text shows the menu with AI
  actions disabled and the bilingual reason visible; after the save, the same selection shows
  them enabled. Stages 1–5 behavior unchanged.

---

## 3. One decision grammar

**Aceptar · Accept — Adaptar · Adapt — Rechazar · Reject — Decidir después · Decide later.**
Four verbs, one visual row, everywhere an AI proposes something. The Five Questions remain a
separate instrument with a distinct job (§7): the decision row records *what I'll do with
this*; the Five Questions evaluate *how good this was*.

| AI output class | Today | Future state |
|---|---|---|
| Council findings | 4-way row (kept) | Unchanged UI; entries now written to the ledger (§4) |
| Lens PRIORITY REVISIONS (≤3 per review) | No capture (F5) | Each priority line gets the identical 4-way row, inline in the review reply |
| Lens BEST NEXT ACTION | No capture | Same 4-way row (one per review) |
| Chat / follow-up-chip replies | 5Q eval only | A "⋯" affordance on any coach bubble opens "¿Qué harás con esto? · What will you do with this?" — the same 4-way row, on demand, never auto-shown (protects P2/P10 calm) |
| Passage-help replies | Nothing | Same "⋯" on-demand row as chat |
| Capstone compare (10C) | Agree/disagree response form (kept) | Kept as-is; the 10C response is written to the ledger as one `capstone` entry |

### Change — unify the grammar

- **Evidence:** F5 + inventory §4.2 — three grammars coexist: 5Q good/warn/flag (chat), nothing
  (lenses), 4-way (Council). "Decide later" currently dead-ends (decide-loop dead end).
- **Student consequence:** a student who learns "my judgment is recorded" at the Council finds a
  structurally identical lens priority records nothing; deferred decisions vanish.
- **Root cause:** each touchpoint grew its own capture; no shared store.
- **Recommendation:** the Council's existing 4-way row becomes the single component. **Decidir
  después is a queue, not a dismissal:** deferred entries appear as a status-rail chip
  "Pendientes: N · To decide: N", as a section in the Review center, are re-offered once at
  entry to Stages 8, 9, and 10, and are listed (never blocking) in the Process Note assembly as
  "N sin decidir · N undecided."
- **Acceptance test:** every AI output class above can produce a ledger entry through the same
  four verbs; deferring a Council finding at Stage 7 makes it reappear in the status rail, the
  Review center, and once at Stage 8 entry, and it is listed at Process Note time if still
  undecided.

---

## 4. The persistent decision ledger

One append-only store per project. **Schema sketch (spec, not code):**

```
tupana_ai_ledger  (per project, append-only, localStorage like all student data)
entry = {
  id,               // unique, sortable
  ts,               // ISO timestamp of the AI output
  source,           // 'chat' | 'passage' | 'lens' | 'council' | 'capstone'
  refId,            // councilRunId+findingId · lensReviewId+priorityIndex · chat msgId
  stageId,          // stage at decision time
  lens,             // lens id for source='lens'; reviewer role for council findings
  excerpt,          // ≤160 chars verbatim from the AI output (the finding/priority line)
  draftSignature,   // FNV signature of the draft the output referred to
  decision,         // 'accepted' | 'adapted' | 'rejected' | 'later' | null (undecided)
  decisionTs,
  verification,     // null | { verdict: 'improved'|'partial'|'active', ts, signature }
  note              // optional student note ≤200 chars ("what I did instead")
}
```

No draft text beyond the ≤160-char verbatim excerpt (same restraint as the current Council
history). Existing `tupana_decisions` (5Q + checkpoints) remains; the report reads both.

**Where the student sees it:** the Review center (§5) has a "Mis decisiones · My decisions" tab
— chronological, filterable by source, each entry tappable to reopen its origin (the Council
report finding, the lens reply, the chat bubble). Aggregate counts feed the existing badges.

**How it feeds the Process Note (automatic, F2 fix):**

- **Evidence:** F2 (P1) — Council findings and decisions never reach the Process Note, decision
  log, report, or packet; Q4/Q5 must be reconstructed from memory while the answer sits in
  localStorage.
- **Student consequence:** the most pedagogically valuable judgment evidence the app collects is
  invisible in the student's own process story.
- **Root cause:** Council decisions write to `tupana_council_runs` only; report renderers read
  `tupana_decisions` only.
- **Recommendation:** the Process Note pre-fills Q4/Q5 from the ledger: "Acepté N, adapté N,
  rechacé N, N pendientes · I accepted N, adapted N, rejected N, N pending," followed by the
  decided entries (excerpt + verb + note + verification verdict). The student edits or adds
  prose on top; nothing is reconstructed from memory. The instructor report and Final Packet
  render the same section from the same store (P12: two surfaces, one source).
- **Acceptance test:** decide 3 Council findings and 2 lens priorities, revise, open the Process
  Note — Q4/Q5 arrive pre-filled with those 5 entries, verbs, and verification verdicts, with
  zero manual reconstruction; the packet shows the identical list.

**How `recordCouncilVerification` enters the loop (F3 fix, verify rung):**

- **Evidence:** F3 — `recordCouncilVerification` (improved/partial/active) is exported and never
  called; "decide → revise → re-review" ends at decide.
- **Student consequence:** revision work is never confirmed; the loop the pedagogy promises has
  no closing move.
- **Root cause:** no caller; no surface owns the comparison moment.
- **Recommendation:** on any Council re-run (and any same-lens re-review) where the draft
  signature has changed and prior decided findings exist, the new report opens with a strip
  "Desde tu último Consejo · Since your last Council": each previously accepted/adapted finding
  gets a verdict — **Mejorado · Improved** (no reviewer re-raised an anchored finding on that
  passage/theme), **Parcial · Partial** (re-raised but reduced or only partially corroborated),
  **Activo · Active** (substantially re-raised). Verdicts are computed from the new run's
  anchored findings — never optimistic — recorded via `recordCouncilVerification` into the
  ledger, and shown with the anchor so the student can disagree in their note. Rejected
  findings are listed without verdict ("Tu decisión se mantiene · Your call stands").
- **Acceptance test:** accept a finding at Stage 7, revise the passage, reconvene at Stage 8 —
  the report opens with the "Since your last Council" strip showing that finding as
  Improved/Partial/Active; the verdict appears in the ledger, the Review center, and the
  Process Note Q4 pre-fill.

---

## 5. Review center — persistent, reachable, honest about age

- **Evidence:** F3 + F4 — "View last report" exists only inside the Stage 7–9 review dialog; the
  post-review next-actions card is DOM-only and dies on reload; at Stage 10 the last Council
  report is unreachable.
- **Student consequence:** a reload mid-revision strands the student; at the stage where they
  must *own* the work (10), they cannot reopen the report they were supposed to act on.
- **Root cause:** re-entry affordances rendered directly into the DOM instead of from stored
  state; report access coupled to the launch dialog.
- **Recommendation — the Review center is a drawer, not a dialog:** a persistent entry
  "Revisión · Review" in the status rail, visible at every stage ≥7 **including 10** and in
  Finish. It contains four tabs, all rendered from stores on every load:
  1. **Informes · Reports** — history: last 5 Council runs + last 10 lens reviews (metadata +
     findings, current storage limits kept). Each row shows date, lens/roles, and a freshness
     label computed from signatures: "Actual · Current" or **"De una versión anterior · From an
     earlier version"** (the existing stale-version note generalized to the list level, P12).
  2. **Mis decisiones · My decisions** — the ledger view (§4).
  3. **Pendientes · To decide** — the decide-later queue.
  4. **Convocar · Convene** — launch buttons for lens and Council; at Stage 10 this tab shows
     read-only guidance "En la etapa 10 comparas y cierras — vuelve a la 9 para otra revisión ·
     At Stage 10 you compare and close — return to 9 for another review" (launching stays 7–9;
     reading is 7–10).
  The post-review next-actions card remains, but it is rendered from the review store through
  the normal chat-restore path, so it survives reload; its buttons deep-link into the Review
  center tabs.
- **Acceptance test:** run a lens review at Stage 8, reload the page — the next-actions card is
  still in the transcript and "Revisión · Review" opens the report. Advance to Stage 10 — the
  same entry point opens the last Council report, labeled "De una versión anterior · From an
  earlier version" if the draft has since changed. No affordance in the Review center exists
  only in the DOM.

---

## 6. Disclosure completion — moment of consent on every path

Target: **every send path meets the D4–D7 standard** (specific, quantified, at the moment of
consent, literally true). The D4–D7 texts themselves are preserved verbatim.

### 6.1 The chat channel-data gap (F1) — resolution: **strip, matching the capstone**

- **Evidence:** F1 (P1) — `maniSentence` (the student's Tu Conocimiento sentence, ≤280 chars of
  personal prose) rides on **every** live-AI chat send and is never named in any disclosure.
  The capstone path destructures it out specifically so its own disclosure stays literally true.
- **Student consequence:** a student who wrote something personal or identifying in Tu
  Conocimiento shares it with Gemini on every message without knowing.
- **Root cause:** D1 predates the D4–D7 disclosure standard; channel data grew a prose field
  after the first-send cue was written.
- **Recommendation — Option A, strip it:** routine chat sends exclude `maniSentence` from
  channel data, exactly as the capstone already does. Chosen over Option B (disclose it
  explicitly) because: (1) it matches the app's own demonstrated standard — the capstone strips
  rather than discloses, and TP-SR-02's wire payload is deliberately data-minimized; (2) this is
  the most personal free-prose field in the app, where opt-in beats notice; (3) a disclosure
  naming it would have to survive being read on the *first* send and remembered for hundreds —
  disclosure fatigue makes Option B honest on paper and false in effect; (4) the pedagogical
  cost is near zero: the coach's identity-awareness is recoverable through an explicit,
  default-off toggle in the Tu Conocimiento panel — "Compartir mi frase con el coach IA · Share
  my sentence with the AI coach" — whose own label is the moment-of-consent, and the student
  can always paste the sentence into chat deliberately. The first-send cue is then reworded to
  be literally true: "Se envía tu mensaje, el texto que selecciones y tu etapa actual — nada
  más · Your message, any text you select, and your current stage are sent — nothing else."
- **Acceptance test:** with the toggle off (default), a captured chat payload contains no
  `maniSentence`; with it on, the Tu Conocimiento panel shows the sharing state and the payload
  contains it; the first-send cue text matches the payload contents field-for-field.

### 6.2 Remaining disclosure repairs

- **Passage menu (D2):** one-line footer on the menu itself — "Este pasaje se enviará al coach ·
  This passage will be sent to the coach" — so consent precedes the tap, not just echoes after.
  *Test:* the line is visible in the open menu before any action is chosen.
- **Silent passage upgrade (F12/D3):** when pasted multi-sentence text upgrades to
  `passage_analysis`, the user bubble gains a small chip "leído como pasaje · read as a
  passage." *Test:* pasting a 3-sentence paragraph shows the chip; a one-line message doesn't.
- **Voice Vault in review sends (new, from §8):** the D4/D5 privacy notes gain one clause when
  phrases are attached: "…incluidas tus N frases protegidas, marcadas como no-reescribir ·
  …including your N protected phrases, marked do-not-rewrite." *Test:* with 3 phrases present
  in the draft, the review dialog note names "3"; with none, the clause is absent.

---

## 7. Five Questions — a habit, not a recitation

- **Evidence:** inventory T4 — evaluation is a stage-level button plus a reference strip; the
  never-enumerate rule stops the AI from reciting the five questions, but nothing builds the
  *habit* of applying one at the moments that matter most (reviews).
- **Student consequence:** the judgment framework and the highest-stakes AI outputs (reviews)
  meet only if the student remembers the strip exists.
- **Root cause:** the 5Q system is anchored to chat, not to the review loop.
- **Recommendation — one habit prompt per review:**
  - **Trigger:** fires once per review report (lens or Council), at the moment the student
    records their first decision on it or closes the report — never during typing, never over
    another surface (P2).
  - **Form:** a single compact card in the chat stream: "Pasa una pregunta por esta revisión ·
    Run one question over this review" with the five questions as five small chips; tapping one
    opens only that question's good/warn/flag row for the report as a whole. One tap total.
  - **Frequency cap:** at most 1 per review report, at most 3 per session; "Ahora no · Not now"
    suppresses it permanently for that report. The strip and the existing per-message
    "Evaluate last coach response" button remain for deliberate use; the never-enumerate prompt
    rule stays load-bearing.
  - Picks land in `tupana_decisions` exactly as today (tallies, Q5, report unchanged).
- **Acceptance test:** completing a lens review and accepting one priority produces exactly one
  habit card; dismissing it never re-shows it for that report; a session with four reviews
  shows at most three cards; chat replies never enumerate the five questions.

---

## 8. Voice Vault reaches the reviewers — without leaking a word

- **Evidence:** F11 — protected phrases are never injected into any AI prompt; the voice
  reviewer can recommend rewriting a phrase the student explicitly protected.
- **Student consequence:** the app's own protection signal and its AI feedback contradict each
  other; the student arbitrates a conflict the system created.
- **Root cause:** the vault is a local-only feature with no prompt-side read.
- **Recommendation:** on **full-draft sends only** (lens, Council reviewers, capstone), append a
  compact block to the prompt: "FRASES PROTEGIDAS · PROTECTED PHRASES (the student marked these
  as their voice — do not propose rewording them; you may comment on placement): 1. '…' 2. '…'"
  listing only phrases **currently present in the sent draft** (the existing green-dot presence
  check). **No-leak guarantee by construction:** these sends already contain the full draft, and
  every attached phrase is verbatim a substring of it — zero characters of student prose leave
  the device that were not already leaving. Chat and passage sends, which do not carry the full
  draft, get **no** vault context (attaching phrases there *would* be a leak; the passage path's
  Protect action is the vault's presence in that context). Downstream behavior: Council findings
  whose proposed change falls inside a protected span are re-framed by the synthesis contract as
  placement/context observations or surfaced under preserve-first with a "Protegido ·
  Protected" tag; they never appear as rewrite instructions. Disclosure updated per §6.2.
- **Acceptance test:** protect a phrase at Stage 7, run a voice-lens review and a Council — no
  finding proposes rewording the protected span; the report's preserve section can tag it
  "Protegido · Protected"; a captured chat payload after the same protection contains no vault
  content; the review dialog disclosure named the phrase count before sending.

---

## 9. Error honesty — permanent failures stop impersonating transient ones

- **Evidence:** F7 — the Worker's disallowed-origin 403 carries no CORS headers, so the browser
  can't read it; the client sees `network_error`, retries (~6 s), and shows "temporarily
  unavailable — try again." A Council run burns up to 18 doomed fetches, then advises retry.
  F14 — Council abort copy never distinguishes rate-limiting. F8 — `prompt_too_large` speaks
  passage language to a whole-draft promise.
- **Student consequence:** on any origin misconfiguration every student sees a transient-looking
  error that retrying can never fix, with no signal that reaches the instructor.
- **Root cause:** the one unreadable error response collapses a permanent category into the
  retryable bucket.
- **Recommendation — a readable, non-retryable origin failure plus one honest voice per
  category.** The 403 becomes readable (CORS headers, category `origin_not_allowed`) and the
  client treats it as **non-retryable**. The student-facing states:

| State | Student sees | Retry behavior |
|---|---|---|
| Origin not allowed | "Este enlace no está autorizado para usar el coach IA — avisa a tu instructor · This link isn't authorized to use the AI coach — tell your instructor" + a copyable diagnostic line (origin + date) + one-tap "Guía sin IA · Built-in, no AI" | Never auto-retried; no "try again" |
| AI unavailable (5xx / network) | "El coach IA no está disponible ahora — tu trabajo está guardado aquí · The Live AI coach is unavailable right now — your work is saved here" + retry + offline switch (current pattern, kept) | Auto-retry ×2, then the message |
| Rate-limited | "El coach está recibiendo muchas solicitudes — espera un momento · The coach is getting many requests — wait a moment" with a visible "reintentando (2 de 3) · retrying (2 of 3)" counter | Auto-retry with backoff, counter shown |
| Offline mode (chosen) | Not an error: chat input replaced by "Guía sin IA activa — el botón 'Estoy atascado' funciona siempre · Built-in guide active — the 'I'm stuck' button always works" | n/a |
| Cancelled mid-Council | "Cancelaste el Consejo — nada se guardó y tu borrador no cambió. Se habían completado X de 3 lecturas · You cancelled the Council — nothing was saved and your draft is unchanged. X of 3 readings had finished" | n/a |
| Council abort, rate-limited | Distinct copy: "…espera un minuto y convócalo de nuevo · wait a minute and reconvene" | Reconvene allowed |
| Council abort, origin | The origin message above — never "try again" | Launch disabled with reason |
| Draft too large | Pre-send check in the review dialog: "Tu borrador supera el límite de lectura completa (~N palabras) — trabaja con un pasaje · Your draft exceeds the whole-reading limit (~N words) — work with a passage," shown **before** consent, whole-draft-phrased | Send never attempted |

  Every state keeps the current guarantees: bilingual, work-never-lost sentence, one next step
  (P10 acceptance form).
- **Acceptance test:** from a non-allowlisted origin, a chat send shows the instructor message
  within one request (no retry storm) and a Council launch is disabled with the same reason —
  zero doomed reviewer fetches; a simulated 429 shows the retry counter and rate-limit copy;
  cancelling a Council mid-run states readings completed and "nothing was saved"; an over-limit
  draft is stopped in the dialog before any send.

---

## 10. AI attribution in the Process Note — rendered from the ledger

- **Evidence:** F2 + F9 + P1's tenth question ("what did the AI contribute?") — attribution is
  legible live (mode chips) but decays across sessions, and the Process Note carries only
  aggregate request counts.
- **Student consequence:** the student signs a process story that can't say precisely what the
  AI contributed and what they decided about it.
- **Root cause:** attribution was display-time state, never durable state.
- **Recommendation:** a new Process Note section "Qué aportó la IA — y qué decidí · What the AI
  contributed — and what I decided," rendered entirely from stores, never typed:
  1. Activity by rung (from the existing usage buckets): conversations, passage readings, lens
     reviews (with lens names), Council runs (with roles), capstone compare.
  2. Every decided ledger entry: excerpt · verb · student note · verification verdict.
  3. Protected phrases honored: "N frases protegidas — ninguna reescrita por sugerencia de la IA
     · N protected phrases — none rewritten at the AI's suggestion" (from vault + ledger).
  4. The standing truth line, kept: the AI never wrote prose; the authorship rule stack applies
     to every request kind.
  Supporting durability fix (F9): the live/local mode is stored with each transcript message so
  restored sessions keep the "IA en vivo · Live AI" chip — attribution stops decaying.
- **Acceptance test:** after a journey with 2 lens reviews, 1 Council run (4 decisions), and 3
  protected phrases, the Process Note renders the attribution section with those exact counts
  and entries with zero typing; reloading a saved session shows mode chips on old AI messages
  identical to when they were sent.

---

## 11. What this model deliberately preserves

Unchanged, verified working by this audit (inventory §5 close-out list):

- The Council report's **preserve-first structure, corroboration recomputation, verbatim-anchor
  validation, and "Tu decisión · Your call" disagreement framing** — access changes, the report
  does not.
- The **shared review dialog** as the single home of R3+R4.
- The **D4–D7 disclosure texts** (specific, quantified, moment-of-consent) — now the standard
  every path meets rather than the exception.
- **Signature-based unchanged-draft friction** with explicit student override, in both lens and
  Council paths.
- Truthful disabled-state reasons; calm Council failure states ("nothing was saved"); the
  authorship rule stack across every request kind; the Five-Questions never-enumerate rule;
  Stuck triage as the no-AI continuity floor; local-only token accounting.

## 12. Findings coverage

F1 §6.1 · F2 §4 · F3 §4/§5 · F4 §5 · F5 §3 · F7 §9 · F8 §9 · F9 §10 · F11 §8 · F12 §6.2 ·
F13 §2.1 · F14 §9. (F6 — the hand-synced requestKind contract — and F10 — Council's silent
gemini-only policy — are engineering/policy items assigned to the remediation roadmap, not
experience-model changes; F10's minimum experience fix is one truthful sentence in the review
dialog when in Ollama mode: "El Consejo requiere el coach IA en vivo · The Council requires the
Live AI coach.")
