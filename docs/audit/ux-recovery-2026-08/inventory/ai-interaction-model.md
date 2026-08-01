# AI Interaction Model — Tu Pana Writing Studio (Agent D, UX Recovery Audit 2026-08)

Audit worktree: `/Users/Victor1/Sites/tupana-audit` (read-only). All line numbers refer to files in this worktree.
Scope: coach chat + passage coaching + full-draft lenses + Review Council + capstone compare, treated as ONE experience, plus every supporting AI-literacy surface (Five Questions, Voice Vault, Tu Conocimiento, reflection checkpoints, lab) and the Worker contract.

---

## 0. Provider spine (shared by every touchpoint)

- **Provider router:** `assets/js/ai-provider.js` — `AI_PROVIDER = 'gemini'` (:12), `generateCoachResponse()` (:231) routes gemini → `callGeminiProviderViaProxy()` (:206) → `fetch(CONFIG.geminiProxyUrl)` (:150). Ollama fallback path; DirectLine/offline returns `null`.
- **Wire payload (data-minimized, TP-SR-02):** `{ prompt, stageId, requestKind, responseFormat:'text', model }` (:153–162). `studentContext`/`assignmentConfig` accepted by the function signature but deliberately not transmitted.
- **Model selection (client):** `selectGeminiModel()` (:48) — Flash for requestKinds {passage_analysis, full_draft_review, capstone_review, council_reviewer, council_synthesis} and stages 7/10 (`stage.revision`, `stage.reflection`); Flash-Lite otherwise.
- **Retry:** up to 2 retries with jittered backoff for {rate_limited, service_unavailable, upstream_error, network_error} (:74–80, :212–223).
- **Truncation integrity:** Worker flags `finishReason === 'MAX_TOKENS'` → client appends bilingual ✂️ cutoff notice (:107–109, :199–201).
- **Local accounting:** `tupana_ai_usage` — aggregate token counts only, bucketed by kind (:113–144). Never prompts/draft/response. Surfaces in "AI activity" summary (`ui.js:7504`).
- **Modes:** `setCoachMode()` `ui.js:2958` — `gemini` ("Coach IA · Live AI"), `ollama` (hidden button, `index.html:278`), `offline` ("Guía sin IA · Built-in, no AI"). In offline mode `state.connected` stays false → chat input and send are dead (`ui.js:3567`, `:3107`); guidance comes from the Stuck triage / micro-prompts (no AI). Mode-toggle titles carry a one-line disclosure per mode (`index.html:277–279`).

---

## 1. Touchpoint inventory

### T1 — Coach chat (free conversation)
- **Where/when:** right panel, all stages, whenever mode ≠ offline. Default mode is gemini (`index.html:279` `active`).
- **What is sent (gemini):** `ui.js:3141–3161` — `buildOllamaSystemPrompt()` (full rule stack: Five-Questions-never-enumerate rule :3250, absolute authorship rule, no-sample-prose, sentence-frame, transition, citation, outline rules; genre layer appended additively :3231–3244) + Stage-8 voice-polish reminder when applicable (:3146) + interface language + **`buildChannelData()` JSON** (:2928–2956: assignmentId, stage, stageId, stageName, draftSaved, maniDone, labDone, **`maniSentence` — the student's Tu Conocimiento sentence, up to 280 chars**, wordCount, tone, response counters) + the student message.
- **Genre/stage awareness:** per-stage `coachFocus` resolved genre-first with neutral fallback (`resolveCoachFocus`, `genre-template.js:1533`; consumed at `ui.js:3224`); coach identity line names the active genre (:3242).
- **Disclosure:** one-time first-send cue (`maybeShowFirstAiSendCue`, :3093–3104: "your message and the relevant text from your writing are sent…"); mode-button tooltip; welcome copy. The `maniSentence` field is never specifically named (see Finding F1).
- **What comes back:** free-form coaching text; render-time "Live AI / Local AI" chip on the bubble (`_appendLiveModeChip` :3079 — display-only, not persisted; restored transcripts lose the chip, acknowledged in the code comment :3074–3078).
- **Repetition bounding:** stage-entry welcomes once per stage (:2017–2031); system-note dedup with ×N counters (:2812); humor lines used sparingly; app-orientation keyword intercept answers "how do I use this" locally without an AI call (:3658–3693).
- **Student control:** Five-Questions evaluation of the last reply (T4); nothing is auto-inserted into the draft.
- **Failure:** categorized bilingual error message (`getGeminiErrorMessage`, ai-provider.js:83–103) + one-tap "Switch to Built-in, no AI" button in the error bubble (`_renderOfflineFallbackBtn` :3026, flushes autosave before claiming "your work is saved").
- **Process evidence:** `coach_message_sent` process-log events; full transcript (Coach vs "Yo · Me") exported in the report (`formatChatForReport` :7572); response counts feed Process Note Q3.

### T2 — Suggested questions ("Seguir conversando" chips)
- `injectFollowupPanel()` `ui.js:5899` — collapsed `<details>` after coach exchanges; genre-resolved follow-up questions (`getFollowupsFor`); clicking sends `'[Follow-up] ' + question` as a normal chat message (:5938–5943). Same disclosure/failure envelope as T1. Collapsed-by-default keeps it from competing with the exchange.

### T3 — Stuck triage & micro-prompts (non-AI, same surface)
- `prompts.js` MICRO_PROMPTS/STUCK_AFFIRMATIONS + stuck triage menu (`ui.js:6554+`). Fully local; the designated offline path ("I'm stuck" button, `ui.js:3044`). No sends, no disclosure needed. Works in every mode — good continuity floor.

### T4 — Five Questions system (Conocimiento / Accuracy / Voice / Specificity / Thinking)
- **Definitions:** `EVAL_QUESTIONS` `ui.js:5592–5598`; rich per-choice feedback `EVAL_FEEDBACK` :5601–5627.
- **Where it appears:** `#fiveQStrip` reference strip revealed at Stage 7+ (`index.html:305`; `ui.js:2106–2131`), auto-opens once on first Stage-7 entry (flag `tupana_fiveq_stage7_opened_once`); "Evaluate last coach response" button inside the strip (:2110–2121) → `evalLastCoachMessage()` :5953 renders the eval bar on the latest bot message only, pruning stale un-used bars (:5970–5974); eval card `injectEvalCard()` :5854 (Stage 7+); one-time hint before first bar (:5995–6003).
- **Repetition triggers/bounding:** evaluation is intentional (stage-level button) rather than per-message; the system prompt's mandatory "FIVE QUESTIONS PRESENTATION RULE" (:3250–3251) forbids the AI from enumerating the five questions in replies — the never-enumerate remediation is present and load-bearing.
- **Where picks land:** `tupana_decisions` → decision log, badges, `tallyDecisions()` :6312 (accepted/thinking/questioned/checks — the Batch-3 counter-bug fix is in place) → Process Note Q5 static line (:7402) and report summary (:7470).

### T5 — Passage coaching (selection → coach seam)
- **Entry:** selecting text in the draft textarea at ANY stage pops `#passageCoachMenu` (`initSelectionToCoach` `ui.js:3726–3860`): Qué funciona / Fortalecer / Claridad / Voz / **Proteger** (vault, stages 7–9 only) / **Preguntar…** (attaches selection as a removable context chip on the composer, :3548–3562).
- **What is sent:** `[STUDENT-SELECTED PASSAGE] … [END] + PASSAGE_READING_PROTOCOL (:3524) + action instruction` with `requestKind: 'passage_analysis'` (:3840–3854); "Ask…" path builds the same wrapper around the student's question (:3701–3710). Pasting ≥240 chars with ≥2 sentence boundaries into chat silently upgrades to `passage_analysis`/Flash (`_looksLikeMultiSentencePassage` :3535–3540).
- **Disclosure:** the sent excerpt is shown in the visible user bubble (`↳ "…"`); covered generically by the first-send cue. No per-action "this will be sent" note on the menu itself.
- **Availability honesty:** quick actions disable when not connected; Ask/Protect stay usable (local) (:3783–3788).
- **Timing note:** the menu is not stage-gated — it appears during Stages 1–6, including the Stage-6 unassisted-draft window before the authorship save (the gate governs stage advancement, not passage sends). See F13.
- **Process evidence:** `passage_coach_action` events (char count only); usage counter "Pasajes".

### T6 — Guided full-draft review (lenses)
- **Lenses (`FULL_DRAFT_LENSES` `ui.js:3871–3907`):** structure (Estructura y trayectoria), evidence (Evidencia y especificidad), fit (Encaje con la tarea), voice (Voz y claridad), audit (Auditoría final — "Sugerido ahora" at Stage 9, :4076/:4086).
- **Entry points:** `#fullDraftReviewBtn` in the draft footer (`index.html:207`), visible only Stages 7–9 (F5 remediation, :3956–3963); disabled <50 words / no live coach / while waiting, with truthful title text (:3967–3978). Also re-entered from the post-review action card (T6b) and Council buttons.
- **Chooser UX (`openFullDraftReview` :4057):** word count + length guidance (:3981), **explicit privacy note ("all N words will be sent… Tu Pana does not store the draft or response on a server", :4105–4109)**, radio lens cards, ≥1 prior review ⇒ required purpose textarea ("What changed…?", :4127–4132), ≥2 reviews ⇒ "you already have several wide-angle perspectives" nudge toward passage work (:4111–4116), unchanged-draft (FNV signature :3917) ⇒ notice + explicit override checkbox (:4117–4137), "Work with a passage" off-ramp (:4139/:4150).
- **What is sent:** assignment/genre name, stage, lens, student purpose, word count, FULL draft, whole-draft review contract with 4 fixed sections (CURRENT MOVEMENT / TWO STRENGTHS / PRIORITY REVISIONS ≤3 / BEST NEXT ACTION), `requestKind:'full_draft_review'` (:4183–4220).
- **After success:** metadata-only record (`tupana_full_draft_reviews`, last 10 — never draft text, :3945) + `_appendReviewNextActions()` card (:4240–4272): another review / Review Council / view last Council report / return to draft. **The card is appended directly to the DOM, not via `addMsg` — it does not survive a reload** (F4).
- **Failure:** `outcome.ok` false ⇒ nothing recorded, no next-actions; the chat shows the categorized error + offline-fallback button.
- **Student control:** none captured — there is no accept/adapt/reject on lens findings (F5); the reply is plain chat text evaluable via Five Questions only.

### T7 — Review Council
- **Kernel:** `assets/js/council.js` — 3 fixed roles (structure/evidence/voice, :41–66) + synthesizer; hard caps in code (`COUNCIL_LIMITS` :17–33); verbatim-anchor validation (`councilAnchorValid` :186) drops unanchored findings before synthesis; synthesis restricted to provided sourceIds, corroboration recomputed (:326–389); parallel reviewers, 1 retry each, ≥2 survivors or abort (:404–473).
- **Entry conditions:** review dialog open (⇒ Stage 7–9, ≥50 words, live coach) AND `state.coachMode === 'gemini'` (`_councilOfferHtml` `ui.js:4299` — **not offered in Ollama mode** despite the injectable `callFn`, F10) AND enabled genre profile (`getCouncilProfile` council.js:158 — default/graduate-sop/service-learning/research-paper/college-personal-statement all enabled; unknown ids inherit default; `enabled:false` blocks in code). Kernel re-checks ≥50 words (:408).
- **Disclosure (strong):** offer block states the complete draft "will be sent to the Live AI coach **three times** — once per perspective — and the validated observations will be sent once more for the synthesis. Tu Pana does not store your draft or the responses on a server" (`ui.js:4310–4314`). This matches the actual 3×draft + 1×findings traffic exactly.
- **Unchanged-draft friction:** same-signature run ⇒ launch disabled until "convene it again anyway" checkbox (:4315–4322, :4330–4333).
- **Progress:** per-role chips reading…/reading complete/unavailable, synthesis row, "usually under a minute", Cancel; closing the dialog cancels and logs `council_run_aborted` (:4345–4376, :4010–4014).
- **Report:** stale-version note when signature differs (:4550), partial note naming unavailable perspectives (:4556), summary, preserve ("What is working — protect it"), Fix-first, collapsed secondary, disagreements framed as "Your call — the Council does not agree" (:4584), calm empty state (:4563).
- **Student decisions:** per finding Accept / Adapt / Reject / Decide later (`_COUNCIL_DECISIONS` :4480; `recordCouncilDecision` council.js:522 → `tupana_council_runs`; `council_decision_recorded` process event). **`recordCouncilVerification` (improved/partial/active re-review loop, council.js:538) is exported but never called from ui.js — the verify-after-revision loop is dormant** (F3).
- **Reopen/view-last:** "View last report" exists only inside the review dialog (:4321, :4335–4338) plus the ephemeral next-actions button. Outside Stages 7–9 (e.g., Stage 10) the last Council report is unreachable (F2/F3).
- **History:** last 5 runs per project, metadata + findings + decisions, no draft text beyond anchored quotes (council.js:495–519).
- **Failure:** distinct abort copy for too-few-reviewers vs generic; always "your draft is unchanged and nothing was saved" (:4457–4478). No differentiation of rate-limit vs config failure (see F7).

### T8 — Capstone "Compare with the Coach" (Stage 10, requestKind `capstone_review`)
- Gated behind evidence-first reflections (three sentences required before the self-check opens, :708–716).
- **Disclosure (strong, specific):** "your latest draft (up to 18,000 characters) and your Stage 10 self-assessment … will be sent to the Live AI coach… Tu Pana does not store that content on a server" (:1002–1006).
- **Send:** system prompt + channel data **with `maniSentence` explicitly destructured out to match the disclosure** (:1265) + ratings + reflections + draft `slice(0,18000)` (:1225–1240). Returns strict JSON, 8 dimensions + a mandatory limitations paragraph ("I cannot fully judge the cultural, community, or lived meaning…"); non-JSON falls back to raw display; offline renders a no-AI panel (:1288–1293, :1394).
- **Student control:** 10C "My Response to the Coach" — agree / disagree / what the coach might be missing about voice, community knowledge, language, intention + optional Critical AI Reflection; saved as a Stage-10 checkpoint decision (:1440–1576). "Tú tienes la última palabra."

### T9 — Voice Vault (protection, local-only)
- Stages 7–9 (`VAULT_STAGES` `ui.js:376`), reachable from the vault panel button, the edit toolbar, and the passage menu Protect action; last non-empty selection remembered across blur; every attempt answers visibly (`vaultSay` :454; founder "button does nothing" fix documented :360–372). ≤20 phrases, 3–200 chars, dedup; green/red presence dot against the live draft (:541–558); jump-to-phrase.
- **Nothing is sent to any AI**, and — the flip side — **protected phrases are never injected into coach/lens/Council prompts**, so the AI systems don't know what the student marked as untouchable (F11). Phrases do land in the instructor report/attestation (:7947, :8188) and `voice_vault_phrase_added` events.

### T10 — Tu Conocimiento (identity assets, `mani*`)
- 5-asset affirmation activity (:2746–2807 area); genre-neutral copy under layers; the summary sentence `tupana_mani_sentence` feeds: channel data on **every** gemini chat send (280-char cap, :2940), Process Note Q8 (:7403), report "Mi Conocimiento" section (:7474). The Council/lens/capstone prompts do NOT include it (capstone strips it deliberately).

### T11 — Reflection checkpoints & micro-reflections
- `REFLECTION_CHECKPOINTS` stages 4/7/8/10 (`ui.js:5637–5730`); auto-open once ever at 4 and 7 only (`AUTO_REFLECTION_STAGES` :5839); Stage 8's surfaces only after a Voice-Polish route is chosen (`_reflectStage` handshake, :5741–5743, cleared on stage entry :2047); Stage 10's lives in the capstone flow. All optional/skippable; picks stored as `checkpoint:true` decisions → "checks" bucket (never miscounted as Questioned — Batch-3 fix) → badges, decision log, report.
- Micro-reflections (`MICRO_REFLECTIONS` :7332): main_idea (Stage 6 post-save area), changed (Stage 9 entry), needs_work (Stage 10 entry) — sub-keys of `tupana_process_note`, pre-filling the Process Note. No AI involvement.

### T12 — Lab (AI-judgment guide)
- `#labBg` onboarding lab (`openLab` :5545); completion/exit logged (`onboarding_guide_completed` / `_exited`); `labDone` flag travels in channel data so the coach knows whether the student did the judgment training. Optional, skippable, local.

### T13 — Process Note / My work / Final Packet (the landing zone)
- `openReport('work')` vs `openReport('submit')` split (F1 remediation, :7106–7111). Report contains: summary tallies, Tu Conocimiento sentence, full draft, **full coach transcript**, decision log, 8-question Process Note with truthful static lines (Q2 authorship framing, Q5 eval tallies), AI-activity summary by requestKind incl. Council counts (:7504–7525). Instructor report adds protected phrases, stages completed, reflection status.
- **Gap:** Council findings and the student's Accept/Adapt/Reject/Defer decisions never appear in the Process Note, decision log, report, or packet — only aggregate request counts and process-log lines (F2).

---

## 2. Disclosure map (every send of student content)

| # | Send | Student content transmitted | Disclosure at the moment of action | Verdict |
|---|------|------------------------------|-------------------------------------|---------|
| D1 | Chat message (gemini) | message text + channel-data JSON incl. `maniSentence` (≤280 chars of student prose) | mode-toggle tooltip; one-time first-send cue ("your message and the relevant text from your writing"); welcome line | Generic. `maniSentence` never named — **under-disclosed, recurring** (F1) |
| D2 | Passage quick action / Ask | selected passage verbatim | excerpt echoed in the visible user bubble; first-send cue | Adequate-by-echo; no explicit "will be sent" on the menu (P3) |
| D3 | Pasted multi-sentence chat text | the pasted text (student typed it into chat) | inherent | OK; silent model upgrade only (F12) |
| D4 | Full-draft review | entire draft + purpose sentence | explicit pre-send privacy note with live word count, "not stored on a server" | **Model disclosure** |
| D5 | Council reviewers ×3 | entire draft ×3 | explicit "three times — once per perspective" note | **Model disclosure** |
| D6 | Council synthesis | validated findings incl. verbatim draft quotes | "the validated observations will be sent once more" | **Model disclosure** |
| D7 | Capstone compare | draft ≤18,000 chars + 3 reflections + optional ratings | explicit itemized note; `maniSentence` stripped to keep the note literally true | **Model disclosure** |
| D8 | Ollama (local) sends | same shapes, to localhost | mode tooltip ("requires Ollama running locally") | OK (local) |

**Verdict: no fully undisclosed sends of student prose (no P0).** One recurring under-disclosed field (D1 `maniSentence`, F1 / P1-low). The D4–D7 disclosures are the app's best pattern — specific, quantified, at the moment of consent — and D1 predates that standard.

---

## 3. Worker contract map (`server/gemini-worker/src/index.js`)

| requestKind | Model (client) | maxOutputTokens | thinking |
|---|---|---|---|
| passage_analysis | flash | 1536 | off |
| full_draft_review | flash | 3072 | off |
| capstone_review | flash | 2048 | off |
| council_reviewer | flash | 1536 | off |
| council_synthesis | flash | 2048 | off |
| (none) + stage 7 / `stage.revision` | flash | 1536 | off |
| (none) + stage 10 / `stage.reflection` | flash | 2048 | off |
| any other flash request | flash | 600 | default (ON) |
| flash-lite conversation | flash-lite | 400 | default |

- Client stage ids (`STAGE_IDS`, genre-template.js:40) match the Worker's `isStage7/isStage10` string forms. `KNOWN_REQUEST_KINDS` (worker :246) currently equals the client's `FLASH_REQUEST_KINDS` (ai-provider.js:50) equals `_recordGeminiUsage`'s bucket list (ai-provider.js:131). **Three hand-synced lists, no shared constant, no version handshake** — a client-only addition silently lands in the flash 600-token thinking-ON config, the exact starvation failure the comments document (F6).
- `MAX_PROMPT_CHARS` 128k; over-limit returns `prompt_too_large`, whose student copy is passage-phrased ("Esta selección es demasiado extensa… choose the section") even for a full-draft/Council send (F8). No client-side pre-check except the capstone's 18k slice.
- **Rejections as the student sees them:** 429 → auto-retry ×2 then "the coach is receiving too many requests, wait a moment"; 401/403 upstream → "configuration issue, notify your instructor"; 5xx/network → "Live AI coach temporarily unavailable… continue with Built-in, no AI" + one-tap offline switch. All bilingual, none lose work.
- **Origin not allowlisted (F7):** worker returns 403 `{error:'Origin not allowed'}` **without CORS headers** (:200–202) → the browser cannot read it → client fetch rejects → `network_error` → retried twice (~5.5 s+) → generic "temporarily unavailable, try again" for what is a permanent configuration failure. In a Council run this multiplies: 3 reviewers × (kernel retry 2) × (provider retries 3) = up to 18 doomed fetches before "The Council could not complete enough readings… try again" — misleading advice.
- Allowlist: localhost:8000/3001 (dev), tupana-preview.pages.dev, vikthor1.github.io (:29–37). `responseFormat` is transmitted by the client but never read by the Worker (dead field, drift bait).
- Worker never logs/stores prompts or student text; forwards only the Gemini status enum, never upstream message bodies (:141–146) — good echo-prevention.

---

## 4. Sequence narrative — is this one experience?

**Stages 1–5 (think):** chat + follow-up chips + stuck micro-prompts + Tu Conocimiento + lab. Genre/stage awareness flows through one prompt builder; the coach cannot hand over prose (rule stack). Passage menu is technically live here too.
**Stage 6 (authorship gate):** unassisted draft, save unlocks revision. Editor locks after save; the coach's identity as "responder, not writer" is structurally enforced.
**Stages 7–9 (the review triangle):** Five Questions strip auto-opens once; Voice Vault appears; passage menu gains Protect; the footer Review button opens ONE shared dialog housing both the lens chooser and the Council offer — this shared dialog is the strongest "one system" move in the app. After any lens reply, the next-actions card explicitly routes: another lens ↔ Council ↔ last Council report ↔ back to draft. Escalation logic is legible: passage < lens < Council, with the chooser itself nudging down (passage off-ramp) and up (Council offer) appropriately.
**Stage 10 (own it):** capstone evidence-first → optional compare → 10C response → Process Note → packet.

**Where it stops being one system:**
1. **Decide → revise → re-review is severed for the Council.** Decisions are captured beautifully, then go nowhere: no verification pass on re-run (dormant `recordCouncilVerification`), no presence in the Process Note/report, no way to even *see* the last report after Stage 9. The student's most structured accept/adapt/reject work evaporates from their own evidence trail.
2. **Three different decision grammars.** Chat replies → Five-Questions good/warn/flag; lens reviews → no decision capture at all; Council → Accept/Adapt/Reject/Defer. A student who learns "my judgment is recorded" in the Council finds that a full-draft review — the same draft, the same stakes — records nothing.
3. **The systems don't share state.** The coach's channel data knows nothing of Council findings, lens purposes, or Voice Vault phrases; the Council doesn't receive vault-protected phrases or the student's prior decisions. A student cannot say "help me act on Council finding 2" without re-pasting it.
4. **Re-entry affordances are ephemeral.** The next-actions card and Council trigger are DOM-only; a reload mid-revision returns the student to a chat with no visible path back to the Council report other than rediscovering the footer button.
5. **Attribution is legible live, weaker over time.** Live-AI chips are render-time only; the exported transcript preserves Coach/Me labels, and the AI-activity summary counts every kind — but a restored session shows AI text without the mode chip.

**What already works as one system (protect it):** the single review dialog; the disclosure pattern on D4–D7; signature-based unchanged-draft friction in both lens and Council paths with student override; truthful disabled-state reasons everywhere; the calm Council failure states ("nothing was saved"); the authorship rule stack applied uniformly across every requestKind.

---

## 5. Findings (severity-tagged)

| ID | Sev | Finding | Evidence | Student consequence |
|----|-----|---------|----------|---------------------|
| F1 | **P1** | `maniSentence` (student-written Tu Conocimiento sentence, ≤280 chars) is transmitted with EVERY live-AI chat message but is never named in any disclosure; the capstone path strips it specifically to keep its own disclosure true — proving the team's standard, which the chat path doesn't meet. | ui.js:2940, :3154; contrast :1265, :1002–1006 | A student who wrote something personal/identifying in Tu Conocimiento shares it with Gemini on every message without knowing; not P0 only because the generic first-send cue ("relevant text from your writing") arguably covers it. |
| F2 | **P1** | Council findings and the student's Accept/Adapt/Reject/Defer decisions never reach the Process Note, decision log, report, or Final Packet — only aggregate request counts. | council.js:522–535; ui.js:7445–7501, :7580 (decisions source = `tupana_decisions` only), :7521 | The most pedagogically valuable AI-judgment evidence the app collects is invisible to the student's own process story and to the instructor; Process Note Q4/Q5 ("what did you accept/reject?") must be reconstructed from memory while the exact answer sits in localStorage. |
| F3 | **P2** | The Council's verify loop is dormant and the last report is unreachable outside Stages 7–9. `recordCouncilVerification` is never called; "View last report" exists only inside the review dialog. | council.js:538–551 (no ui.js caller); ui.js:4321, :4335 | "Decide → revise → re-review" ends at decide; at Stage 10 a student cannot re-open the report they are supposed to have acted on. |
| F4 | **P2** | Post-review re-entry affordances (`#reviewNextActions`, Council offer) are DOM-only and not persisted in the chatlog; lost on reload. | ui.js:4240–4272 (direct `appendChild`, no `addMsg`) | After a refresh mid-revision the explicit path back into lenses/Council disappears; the student must rediscover the footer button — the exact class of continuity failure the F5 remediation targeted. |
| F5 | **P2** | No accept/adapt/reject capture on full-draft lens reviews — decision grammar inconsistent across coach (5Q eval), lenses (nothing), Council (4-way). | ui.js:4215–4233 vs :4480–4517 | Student control feels arbitrary; lens priorities (up to 3 per review) generate no decision record for the Process Note even though structurally identical Council findings do. |
| F6 | **P2** | requestKind contract is hand-synced across three lists (client model map, worker known-kinds/budgets, usage buckets) with no shared source or handshake; unknown kinds silently fall to flash 600-token thinking-ON — the documented JSON-starvation failure mode. | ai-provider.js:50, :131; worker index.js:90–117, :246–255 | A future kind added client-side ships truncated/garbled output (worst case: a new Council-style JSON call validates to zero findings) with no error anyone can see. |
| F7 | **P2** | Disallowed-origin 403 carries no CORS headers → surfaces client-side as retryable `network_error` → generic "temporarily unavailable, try again" after ~6 s of retries; a Council run burns up to 18 doomed fetches then advises "try again." | worker index.js:200–202; ai-provider.js:74, :164–166; ui.js:4461 | On any future origin misconfiguration (new deploy, renamed preview) every student sees a transient-looking error that retrying can never fix, with no signal to tell the instructor. |
| F8 | **P3** | `prompt_too_large` student copy is passage-phrased; no client-side length pre-check for full-draft/Council sends (>128k chars ≈ 20k+ words). | ai-provider.js:94–96; worker :231–239 | A student with a very long draft is told to "choose the section you want to work on" by a dialog that just promised a whole-draft reading. Rare but incoherent. |
| F9 | **P3** | AI-attribution chip is render-time only; restored transcripts show AI replies without the Live-AI label (known/accepted limitation). | ui.js:3074–3090 | Attribution legibility decays across sessions; the exported transcript's Coach/Me labels are the durable record. |
| F10 | **P3** | Council is gemini-only even though the kernel takes an injected `callFn` and Ollama routes through the same `generateCoachResponse`; in Ollama mode the offer silently doesn't render. | ui.js:4299 | Local-AI users get no Council and no explanation — inconsistent with the review dialog rendering for them. Likely intentional (quality), but it is invisible policy. |
| F11 | **P3** | Voice Vault protection is never communicated to any AI prompt (chat, lens, Council); the voice reviewer may recommend revising a phrase the student explicitly protected. | ui.js:374–612 (no prompt-side reads); council.js prompts | The app's own protection signal and its AI feedback can contradict each other; the student must arbitrate a conflict the system created. |
| F12 | **P3** | Silent model/kind upgrade for pasted multi-sentence chat text. | ui.js:3535–3540, :3700 | Benign (better reading quality); worth documenting because it changes token cost and Worker budget path without UI trace beyond usage buckets. |
| F13 | **P3** | Passage coaching is available during Stages 1–6, including the Stage-6 unassisted-draft window pre-save; the authorship gate governs stage advancement and stage-7+ requestKinds only (secondary check merely warns). | ui.js:3726–3860; ai-provider.js:253–261; genre-template.js:57–68 | A student can obtain sentence-level AI feedback on the "unassisted" first draft before saving it, softening the gate's meaning. May be accepted doctrine (feedback ≠ prose), but it is undocumented. |
| F14 | **P3** | Council abort copy never distinguishes rate-limiting from other failures, though the chat path does. | ui.js:4457–4478 | A rate-limited student is told to "try again in a moment" — accidentally correct — but a quota-exhausted class gets the same advice en masse. |

No P0 findings. The remediated items this audit re-verified as present and working: neutral `coachFocus` fallback (ui.js:3219–3227), Five-Questions never-enumerate rule (:3250), review re-entry across 7–9 (:3958), post-review action row (:4240), Voice Vault 7–9 + passage-menu Protect + never-silent responses (:357–612), Council disclosure/progress/decisions/unchanged-draft friction (:4298–4618).

---

## 6. Recommended repair order (Agent D's view)

1. **F1** — either name the Tu Conocimiento sentence in the first-send cue/mode tooltip, or strip it from chat channel data as the capstone already does (one-line change, matches existing standard).
2. **F2 + F3** — surface Council runs + decisions in the Process Note/report and add a persistent "Council" entry point (or at least Stage-10 read access + wire `recordCouncilVerification` into a re-run diff).
3. **F5** — reuse the Council decision row on lens PRIORITY REVISIONS to unify the decision grammar.
4. **F4** — persist the next-actions card (or a compact equivalent) via the chatlog restore path.
5. **F6 + F7** — single exported kind/budget table + a readable CORS-carrying 403 (`category:'origin_not_allowed'`, non-retryable) so the client can say "tell your instructor" instead of "try again."
