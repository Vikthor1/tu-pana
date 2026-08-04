# Migration contract — Preserve / Adapt / Retire / Defer

**Definition of done for the pedagogical-engine migration.** The candidate is a production-structured
Writing Studio (`studio.html` + `assets/js/studio/`) whose student experience is the hardened
Integrated Desk finalist and whose instructional intelligence is translated from the legacy
application. Legacy files are read-only evidence. Line cites reference this plane at `d8b92e8`
(legacy files byte-identical to R0 `1462aea`).

Classifications: **Preserve** (sound and compatible — carry forward), **Adapt** (valuable — translate
into the finalist's interaction model), **Retire** (confusion, genre leakage, false state,
duplication, overload — must not return), **Defer** (valid but SaaS / instructor administration /
later research).

Cross-cutting invariants inherited from the finalist and R0 (bind every capability below): one
canonical draft; three primary destinations; exact-byte student text; no AI prose mutation; explicit
consent + exact payload preview before every send; no completion inferred from navigation or word
count; no AI-authored reflection; truthful provenance; local-only storage in an isolated namespace;
an uninterrupted non-AI path to Finish; unknown assignments stop loudly.

---

## C1. Supported assignments and genre profiles

- **Purpose:** each assignment genre gets its own instructional logic; no genre inherits another's prompts.
- **Legacy:** `ASSIGNMENT_LAYERS` (`genre-template.js:1340-1367`): default autobiography (= no layer), 2× CAP 200, research-paper, stem-lab-report, college-personal-statement, graduate-sop. Activation via `?assignment=` / remembered `tupana_assignment_id` (`app.js:14-26`). No neutral/General layer; **unknown id silently falls back to autobiography**.
- **Finalist interaction:** explicit profile registry — autobiographical (canonical), admissions, SOP, STEM, General Writing (explicit neutral), CAP 200 service-learning, research paper; profile carries Moves, optional onboarding, coach framing, review lenses, Council config, cultural/translingual notes, AI-literacy cues, reflection prompt 4, Finish expectations. Unknown → full-page configuration-required stop (`exploration.js:948-950` pattern).
- **Data:** studio record `assignmentId`; resolution from `?assignment=` → remembered → explicit selection.
- **AI:** profile feeds coach framing/Council config; no send by itself. **Consent:** n/a at profile level.
- **Must not return:** silent unknown→autobiography fallback (`app.js:22`); two competing CAP 200 layers rendered differently; `_layerActive` vs profile-presence mixed states.
- **Classification:** **Adapt** (registry translated; legacy pedagogical content preserved per-genre). Legacy `cap-200-first-draft` duplicate: **Retire** in the candidate (map its id to the service-learning profile via the import/link adapter with an explicit notice — decision recorded in target-architecture.md).
- **Acceptance:** every profile loads its own Moves/copy; leakage matrix across all genres × surfaces; unknown id stops loudly and inherits nothing; General Writing only by explicit selection.

## C2. Cultural and translingual onboarding (Tu Conocimiento)

- **Purpose:** name cultural, linguistic, family, community, historical, experiential knowledge as intellectual resources; protect disclosure choice.
- **Legacy:** gated first-run flow (`index.html:473-595`, `ui.js:4766-4884`): 5 assets must all be claimed **plus** a required Freirean sentence before proceeding (`ui.js:5389-5391`); only 1 of 5 assets genre-aware.
- **Finalist interaction:** one concise inline, skippable, revisitable knowledge-and-language invitation, **autobiographical profile only** (`exploration.js:1009-1016`); engage/Not-now; explicit "identity, trauma, family, migration, and cultural disclosure are always optional"; no gate, no required sentence, no modal.
- **Data:** `knowledgeChoice`/`knowledgeChoiceAt`/`onboardingSeenAt`, genre-scoped. **AI:** none. **Consent:** disclosure optionality stated in-surface.
- **Must not return:** all-5-claims + required-sentence gate before writing; universal cultural onboarding in neutral/disciplinary genres; celebration → Lab funnel.
- **Classification:** **Adapt.** The five assets' *content* (languages, community, journey, positionality, story-as-evidence) informs the invitation + autobiographical Move wording. The Freirean sentence becomes optional material inside the reflection knowledge prompt, never a gate. Mandatory-gate flow: **Retire.**
- **Acceptance:** invitation renders only in autobiographical; skippable with zero state loss; absent from STEM/SOP/admissions/General; wording preserves optionality; revisit path exists.

## C3. Brainstorming and prewriting guidance

- **Purpose:** genre-shaped movement from starting point to plan (legacy stages 1–5).
- **Legacy:** per-genre stage 1–5 pedagogy (inventory §5): autobiography anecdote→connection→pitch→research→outline; CAP 200 community project arc; research question/source arc; STEM lab arc; admissions story-inventory arc (no trauma demand, no odds); SOP trajectory/evidence-map arc. Delivered via stage navigation, stage-entry chat messages, micro-prompts, hints, word-count step advance.
- **Finalist interaction:** optional genre-shaped **Moves** with nudge + "Why this may help" + durable student note (`integratedMoveProfiles`, `exploration.js:326-473`). Direct drafting never punished; navigation creates no evidence.
- **Data:** `moveNotes` keyed `genre:moveId` with provenance + optional passage link. **AI:** none (notes are reference-only; optional framing is C6's consent flow). **Consent:** n/a.
- **Must not return:** compulsory stage sequence; stage-owned text buffers; word-count step inference (`ui.js:1055-1063`); "Paso N" copy coupling; stage-entry chat walls.
- **Classification:** **Adapt** — the finalist's 3–4 Moves per genre are thin (one nudge each); the migration enriches each Move with the legacy arc's distinct micro-guidance (e.g. SOP evidence-map tags, admissions possibility-check criteria, research source-evaluation questions) as progressive disclosure inside the Move, not as stages.
- **Acceptance:** each genre's Moves demonstrably carry that genre's legacy arc (traceability table); all optional; notes never transfer; zero cross-genre wording.

## C4. Genre-specific Moves and Move notes

- **Purpose:** durable, student-authored planning beside one canonical draft.
- **Legacy:** none as such — nearest analogue is per-stage buffers (competing drafts, hazard H1/H2).
- **Finalist interaction:** Preserve exactly: Move cards, Make a note, Planning notes reference, passage-linked Moves with exact/context/saved-only recovery truth (`exploration.js:674-703`), no empty-note evidence.
- **Classification:** **Preserve** (finalist-native; content enriched per C3).
- **Acceptance:** existing connected-tools suite behaviors + per-genre content checks.

## C5. Coach prompt construction and feedback lenses

- **Purpose:** genre-true, authorship-safe coaching; lens-focused whole-draft reading.
- **Legacy:** monolithic `buildOllamaSystemPrompt` (`ui.js:3236-3461`) — authorship rules, no-sample-prose, sentence-frame/transition/research/outline/review/voice-polish rules, anti-repetition, momentum/good-enough, language rule; genre context additive block; `resolveCoachFocus` neutral fallback; `FULL_DRAFT_LENSES` structure/evidence/fit/voice/audit (`ui.js:3893-3929`); requestKind system with Worker ceilings (`server/gemini-worker/src/index.js:92-119`).
- **Finalist interaction:** prompts assembled per-request from profile + scope; sent only through the consent gate; no chat column; responses land in Review Center records.
- **Data:** studio usage counters (namespaced), review records (metadata + excerpt only). **AI: yes.** **Consent:** every send gated (C6).
- **Must not return:** all-ten-stages-in-every-prompt; autobiographical negative examples sent to every genre (`ui.js:3286-3287`); enumerate-vs-never-enumerate contradiction (`ui.js:3273` vs `genre-template.js:149`); silent 240-char passage escalation (`ui.js:3557-3562`, `3722`).
- **Classification:** **Adapt** — safety rule blocks preserved verbatim where sound; genre framing from profile; lens set preserved (structure/evidence/fit/voice/audit); prompt assembled from the studio profile, scoped to the named payload.
- **Acceptance:** prompt builder unit checks: genre identity correct per profile; no default-essay examples under other genres; payload contains exactly the consented scope; lens instructions preserved.

## C6. Ask Tu Pana — passage and full-draft behavior

- **Purpose:** optional, scope-true coaching on a passage, paragraph, or the full draft.
- **Legacy:** floating selection toolbar with four one-click sends (no preview/consent) (`ui.js:3748-3882`); chip path; silent paste escalation; full-draft review modal **with** good disclosure + lens + purpose + same-draft override (`ui.js:4079-4257`); PASSAGE_READING_PROTOCOL (`ui.js:3547-3555`).
- **Finalist interaction:** Preserve exactly: app-owned Passage Tray; scope dialog with only-real scopes, exact preview, transmission facts, mandatory consent checkbox (`exploration.js:1582-1622`); optional linked-Move framing collapsed and unselected; visible Ask Tu Pana action, no chat column.
- **Data:** review records with scope/provenance/signature/snapshotId. **AI: yes.** **Consent:** mandatory per send; scope truth (Selected passage only for real app-captured selection).
- **Must not return:** one-click unconsented passage sends; silent escalation; permanent chat column; confused-keyword interceptor bypass; stage-gating of review affordances (7–9 only).
- **Classification:** **Preserve** (finalist flow) + **Adapt** (legacy PASSAGE_READING_PROTOCOL and full-draft review contract folded into the real prompt builder; word-count guidance thresholds preserved; provider failure surfaces per C10).
- **Acceptance:** existing corrections/connected-tools scope-truth checks; consent gate on every path; protocol text present in built prompts; no request without checkbox.

## C7. Review Center, Council, and report history

- **Purpose:** multi-perspective, verbatim-anchored, non-rewriting review with student-controlled cycles.
- **Legacy:** council.js kernel — roles with mandates/mustIgnore/prohibited (`council.js:41-66`), per-genre profiles incl. admissions voice-first + prohibitions and STEM disabled-with-reason (`council.js:78-163`), verbatim-anchor validation in code (`council.js:202-206`), corroboration recomputed in code (`council.js:356`), caps, parallel reviewers, partial/abort semantics, no autobiographical fallback for unknown profiles (`council.js:177-180`); UI: revisit-vs-convene-again, same-draft override, decisions accepted/adapted/rejected/deferred.
- **Finalist interaction:** Preserve exactly: rail states (unavailable/revisit/convene), saved-report re-entry without rerun or consent, separate Convene again with fresh consent, provenance stored per record, decision dialog with critical question + optional rationale.
- **Data:** `councilRuns`, `reviews`, `decisions` records with stored genre labels and signatures. **AI: yes** (3 reviewer calls + 1 synthesis, disclosed). **Consent:** separate Council consent naming call count.
- **Must not return:** mandatory Council; silent role fallback; regex role-attribution from prompt text (`ui.js:4413-4418`); Council traffic outside the record system; celebratory interruptions.
- **Classification:** **Preserve** (finalist UI + record shapes) + **Adapt** (kernel: real orchestration translated from council.js with its validation code; genre role/mandate content from council profiles mapped onto studio profiles; `resolved` decision and `verifications` seam carried as the revision-cycle re-verify hook). Dangling unwired legacy verification writes: wired into revision cycle or explicitly deferred.
- **Acceptance:** council behaviors from corrections suite; kernel validation checks (anchor rejection, caps, partial, disagreement non-resolution); genre config matrix incl. STEM stated-unavailable; admissions prohibitions present in built prompts.

## C8. Feedback decisions and critical-AI literacy

- **Purpose:** Accept/Adapt/Reject/Decide-later as authentic judgment moments; Five Questions at real decision points.
- **Legacy:** EVAL_QUESTIONS/EVAL_FEEDBACK (`ui.js:5613-5648`); Five Questions strip stage ≥7; reflection checkpoints at 4/7/8/10 with auto-open; El Laboratorio 4-step questionnaire (all answers 'b'); decision ring buffer capped 50 (`.slice(-50)` — hazard H5); tally semantics (`ui.js:6333-6344`).
- **Finalist interaction:** Preserve exactly: one contextual canonical question collapsed by default after a response; full framework behind second disclosure; STEM omits `cultural` from the contextual framework; decision → optional 500-char rationale; factual ledger (source, scope, question, decision, reason, time, signature, version); no repeated walls; no streaks.
- **Data:** `decisions`, `criticalViews`. **AI:** decisions record AI provenance; no send. **Consent:** n/a (local).
- **Must not return:** repeated Five-Questions walls/questionnaires; auto-opening checkpoints; 50-entry ring buffer destroying evidence; streak/max-streak counters; "Unlock my coach" framing; badges from decision counts.
- **Classification:** **Preserve** (finalist mechanism) + **Adapt** (canonical bilingual question wording and EVAL_FEEDBACK's substance available inside the optional disclosure; Lab's core artifact — critique of a smoothed AI paragraph — becomes optional profile-relevant material, not a gate). Lab-as-gate and eval streaks: **Retire.**
- **Acceptance:** contextual question selection per profile is data-driven (not label-regex — see architecture); ledger uncapped; canonical ES+EN wording preserved byte-exact where shown.

## C9. Your Voice / protected passages

- **Purpose:** student-controlled identification and protection of proud/meaningful exact wording, esp. translingual phrasing.
- **Legacy:** Voice Vault stages 7–9, ≤20 phrases ≤200 chars, `vaultSay` always answers, presence check, packet Section 4; **never injected into AI prompts**.
- **Finalist interaction:** Preserve exactly: Keep as my voice from the Passage Tray in any genre; exact bytes; optional student annotation; reference hidden until an entry exists; opt-in disclosure to a review with exact-text preview and the honesty line about enforcement.
- **Data:** `voiceEntries` (exact text, genre, reason). **AI:** included in a payload only after explicit opt-in; provenance recorded. **Consent:** separate exact-text opt-in per send.
- **Must not return:** stage-gating (7–9 only); silent failures on collapsed selection; 20-phrase hard cap without explanation (candidate keeps a cap but explains it).
- **Classification:** **Preserve** (finalist) + **Adapt** (legacy validation-ladder truthfulness — every failure answered — and packet inclusion of protected phrases).
- **Acceptance:** voice suite behaviors; byte-exact multilingual round-trip; opt-in provenance recorded on review records; packet lists exact phrases.

## C10. Provider integration and failure handling

- **Purpose:** truthful, consented live-AI capability with honest failure states.
- **Legacy:** Worker proxy + origin allowlist + requestKind ceilings; client retry policy (retryable categories, 2 retries, backoff), bilingual per-category error copy incl. origin_forbidden "do not retry" and prompt_too_large guidance (`ai-provider.js:58-107`); truncation notice; usage accounting metadata-only (`ai-provider.js:115-148`).
- **Finalist interaction:** provider seam behind the existing consent flows; failures render as calm, truthful states inside Review Center/dialog (not chat bubbles); cancel supported; no automatic retry beyond policy; non-AI paths always offered.
- **Data:** studio-namespaced usage aggregate (token counts only). **AI: yes.** **Consent:** unchanged (C6/C7).
- **Must not return:** silent fallback to a different scope/kind; unconsented requests of any kind.
- **Classification:** **Adapt** — provider adapter translated from `ai-provider.js` (same Worker contract and requestKinds, studio-owned usage key). In this plane the studio defaults to the **local mock provider**; the Gemini adapter is implemented and configuration-selected but not exercised by tests (no live-model claims, no Worker change).
- **Acceptance:** mock-provider failure injection renders each category's surface; no external request in any automated run; usage counters record kinds correctly under mock.

## C11. Draft snapshots, review copies, comparison, revision cycle

- **Purpose:** truthful versions; one encouraged revision cycle with humane comparison and equal exits.
- **Legacy:** none real — hazards H1/H2/H6 (eleven buffers, seeded copies, hash-inequality "revised"), in-memory undo only, `tupana_revision_checkpoint` is an exception declaration (student-reported, unverified — preserved concept).
- **Finalist interaction:** Preserve exactly: exact uncapped snapshots with reasons, recoverable vs metadata-only truth, reviewCopy pointer, Update review copy, Before/Current comparison (tabs on phone) with no scores, Choose what to work on, optional closure note, Keep revising / Finish for now.
- **Data:** `versions`, `reviewCopy`, `revisionCycle`. **AI:** none. **Consent:** n/a.
- **Must not return:** competing buffers; revision inferred from any text inequality; version dashboards/feeds; restore actions that mutate the draft.
- **Classification:** **Preserve** + **Adapt** (legacy student-reported instructor-exception concept carried into Finish truth reporting as an explicitly unverified student statement; snapshot growth handled — see architecture storage-pressure note).
- **Acceptance:** revision-cycle suite behaviors; copy-only recovery; storage-pressure degradation truthful.

## C12. Evidence records

- **Purpose:** browsable, non-surveillant, factual student-owned archive.
- **Legacy:** `tupana_process_log` (uncapped, never read — hazard H9), decision ring buffer, navigation-derived milestone counts (false).
- **Finalist interaction:** Preserve exactly: Evidence so far counts + Browse evidence five filters, entries reopen artifacts, explicit no-completion/no-streak/no-quality framing.
- **Classification:** **Preserve** (finalist). Legacy process-log event vocabulary: **Adapt** (facts worth recording — first save, review requested/completed, decision recorded — already covered by studio records; a separate event stream is redundant → **Retire** the parallel log).
- **Acceptance:** connected-tools archive checks; no derived scores anywhere.

## C13. Process Reflection

- **Purpose:** concise student-authored reflection supported by factual evidence.
- **Legacy:** three micro-reflections + 8-question Process Note sharing one key with competing "reflection status" definitions (hazard H12); auto-injected cards.
- **Finalist interaction:** Preserve exactly: three required concise prompts + optional genre-conditional fourth (knowledge prompt); factual evidence beside, never inside, student text; one dismissible invitation at Finish; no minimum length, scoring, or AI evaluation.
- **Classification:** **Preserve** (finalist). Legacy Q3–Q8 depth: **Retire** as required surface; the useful factual pre-fills (decision tally, coach-response counts) appear as evidence context only. Mani-sentence: optional knowledge-prompt material (C2).
- **Acceptance:** ordinary path reaches reflection with zero AI; no AI-written text; single truth definition of reflection completeness.

## C14. Finish and submission packet

- **Purpose:** distinct Save / Finish / Create packet / Backup / external Submit; truthful instructor-facing evidence.
- **Legacy:** valuable content with severe truth hazards: final-draft confirmation modal (preserve concept), packet sections (gate, decisions, Voice Vault, reflections, self-assessment), but unearned ☑ attestations (H13), false "does not include your draft text" claim (H7), navigation-derived "stages completed" (H4), two exports embedding two different essays (H7), diagnostic scanning only stage≥6 keys ("no written work found" while work exists).
- **Finalist interaction:** Preserve exactly: Finish page with truthful readiness statements ("No Council requested—optional"), exact final-draft confirmation, packet from exact `markedDraft`, student reflection separate from instructor evidence appendix, autobiographical student-controlled Finish checks that never gate.
- **Data:** `finishChecks`, `packetCreatedAt`, `packetDraft`. **AI:** none. **Consent:** packet is local; external submit is the student's action elsewhere.
- **Must not return:** unearned attestations; false content claims; navigation-derived completion lines; conflicting essay embeds; premature submission surfaces.
- **Classification:** **Adapt** — packet structure translated (gate evidence, decisions, Voice, reflection, optional student-reported exception) with every line derived from real studio records; single essay source (`packetDraft`); every attestation student-actioned or absent.
- **Acceptance:** packet content audit vs record state; no claim not backed by a record; confirmation flow required; Save/Finish/packet/Backup/Submit distinctly labeled.

## C15. Saving, backup, import/export, reset, recovery, storage errors

- **Purpose:** truthful local persistence and student-controlled data movement.
- **Legacy:** strong pieces: `tupanaSafeSetItem` failure banner naming the artifact + emergency backup (`storage.js:62-108`), batch rollback (`storage.js:105-127`), typed BORRAR/DELETE reset (`storage.js:349-384`), import preview modal. Hazards: destructive one-click replace with dead undo (H8), live-draft injection mutating the first draft in exports (H3), fabricated modifiedAt.
- **Finalist interaction:** Preserve exactly: 180 ms debounced save + save-state pills + saveFailed truth; export safety copy; typed-DELETE single-key deletion; add: studio import with preview and non-destructive safety (C17 covers legacy import; this covers studio-record import/export round-trip).
- **Must not return:** exports that alter records; replace-without-recoverable-undo; fabricated dates.
- **Classification:** **Preserve** (finalist) + **Adapt** (legacy failure-banner truthfulness: on save failure the studio surfaces a persistent alert with a working export action; studio import = preview → explicit replace with a pre-import snapshot that **is** restorable in-app).
- **Acceptance:** quota-failure simulation shows truthful state + working export; import preview shows exact effects; cancel is lossless; restore path proven.

## C16. Bilingual interface and content behavior

- **Purpose:** Spanish-primary bilingual experience; exact multilingual student text.
- **Legacy:** es/en/both with CSS dual-render; Spanish-primary insertion choices; translanguaging register in `both`; tone axis (gentle/direct) — with the Direct-tone-drops-Spanish defect.
- **Finalist:** copy dictionary + `instruction()` dual render, but **`uiText` ignores `both` and newer surfaces are effectively monolingual** (finalist gap).
- **Classification:** **Preserve** (es/en/both model, Spanish-primary stance) + **Adapt** (all studio surfaces routed through one bilingual helper honoring `both`; legacy warmth/starter Spanish-primary insertion rule carried into any starter text). Tone axis: **Defer** (not in the finalist; reintroduction is a lived-evidence question). Packet language: candidate keeps the finalist's packet with bilingual labels where the finalist has them; full packet localization remains deferred (matches exploration record).
- **Acceptance:** language switch round-trip preserves student bytes; new surfaces render in es/en/both; no English-only regressions on primary paths.

## C17. Legacy-work import (translation adapter)

- **Purpose:** recover a legacy student's real work into the studio without lies.
- **Legacy data:** keys per inventory §6; text in `tupana_draft` + `tupana_writing_s1..10`; decisions/chatlog/council/full-draft-review records; voice phrases; capstone/process-note; preferences.
- **Candidate interaction:** explicit student-invoked flow; read-only scan of legacy keys; preview names exactly what maps where and what does not map; never silent; writes only the studio record after confirmation; pre-import studio snapshot restorable in-app.
- **Mapping truth rules:** exact text preserved (draft → canonical draft; distinct later-stage buffers → snapshots labeled with real origin); provenance dates only where real (legacy records carry timestamps; buffers do not — labeled "date not recorded"); no completion/reflection/authorship evidence manufactured (`tupana_draft_saved` maps to a factual "legacy first-draft save recorded" evidence line, never to studio Finish state); seeded byte-identical stage copies (hazard H2) collapse to one; decisions map with their real timestamps; voice phrases map exact; chatlog does **not** import (no chat column — noted in preview as not imported); capstone/process-note answers import as read-only legacy reflection evidence, never pre-filling studio reflection.
- **AI:** none. **Consent:** the flow itself is explicit; nothing automatic.
- **Classification:** **Adapt** (new bounded adapter). Silent auto-migration: prohibited.
- **Acceptance:** fixture-based import tests: preview accuracy, cancel losslessness, no silent overwrite, byte preservation, truthful provenance labels, ambiguous-record flagging, rollback.

## C18. Unknown-assignment and unsupported-state handling

- **Classification:** **Preserve** (finalist loud stop + recovery path; STEM Council stated-unavailable). Legacy silent fallback: **Retire.**
- **Acceptance:** unknown id at boot and at switch both stop; recovery reaches profile selection; no inheritance.

## Retired outright (must not return anywhere)

Ten student-facing stages and stage navigation; per-stage text buffers; word-count step advance and thresholds; navigation-derived `state.done`/milestones; badges/skills/streaks/celebration interruptions (`computeBadges`, `PHASE_CELEBRATIONS`, eval streaks); spotlight coach-marks; persistent chat column and chat-injected pedagogy cards; auto-opened reflection checkpoints; Five-Questions strip as ambient surface; gated Tu Conocimiento + Lab funnel; readiness from `stageCoachResponses >= 3`; silent passage escalation; unearned packet attestations; one-click destructive import; `tupana_process_log` parallel stream; carry-forward buffer writes; timing-based card choreography.

## Deferred (valid, out of this plane)

Instructor administration/receipts, accounts/cloud sync/cross-device, analytics/billing (SaaS Sprint 1+); tone (gentle/direct) axis reintroduction; full packet/Spanish localization beyond finalist coverage; live Gemini tone/latency/failure validation; Worker changes incl. any new requestKinds; critical-question rotation under repeated live feedback; protected-phrase live-model enforcement; physical-device/VoiceOver/representative-student evidence; Brightspace integration; production restore/migration beyond the C17 adapter.
