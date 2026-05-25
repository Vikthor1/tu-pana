# MCP Sandbox Evaluation Plan
**Tu Pana de Escritura — AI-Assisted Scholarly Workflow**
*Version 1.0 — 2026-05-25*
*Status: EVALUATION ONLY — Do not implement without completing all criteria herein*

---

## Document Purpose

This document defines a controlled evaluation protocol for determining whether Model Context Protocol (MCP) connectors can safely reduce retrieval friction in the Tu Pana de Escritura scholarly AI workflow without compromising architectural integrity, privacy, or token economy.

**This document does not implement MCP. It defines the conditions under which a controlled sandbox test may proceed.**

---

## 1. Purpose of the MCP Sandbox

### 1.1 Why MCP Is Being Evaluated Now

The current Tu Pana de Escritura workflow has completed Phase 1 of its AI-assisted memory architecture. All canonical documentation is stable, all NotebookLM synthesis notebooks are tested and verified, and all one-way data flows have been validated through live workflow tests. The system has produced conference abstracts, faculty talk segments, and bilingual student materials — all grounded in controlled synthesis, not speculative retrieval.

Only now, with architectural stability confirmed, is it appropriate to ask whether MCP connectors could reduce the cognitive and mechanical overhead of the retrieval step — the moment when a scholar must manually locate, copy, and inject context into a working session.

MCP is not being evaluated because the current workflow is broken. It is being evaluated because the workflow is mature enough to define clear boundaries for a bounded automation experiment.

### 1.2 Why the Manual Workflow Succeeded First

The manual bridge architecture succeeded because it forced deliberate review at every boundary crossing. When a scholar must manually extract content from a canonical document and decide which fragment to inject into a working prompt, that scholar exercises three critical judgments:

1. **Relevance filtering** — Is this piece of context actually needed for this task?
2. **Boundary enforcement** — Am I about to cross a data-flow boundary I should not cross?
3. **Canonicity verification** — Is this source current, authoritative, and appropriate for this use?

Automation collapses these three deliberate acts into a single opaque retrieval call. This is only acceptable when the system has proven, through manual operation, that it knows what "correct retrieval" looks like. That proof now exists.

### 1.3 Why Automation Before Stability Would Have Been Premature

If MCP had been introduced before Phase 1 was complete:

- There would have been no stable canonical document set to bound retrieval against
- NotebookLM notebooks would not yet have been tested for synthesis quality
- Dissemination artifacts would not yet have been separated from synthesis layers
- There would have been no baseline to compare automated retrieval against
- Any retrieval error would have been invisible, with no reference point to detect contamination

Automation introduced into an unstable architecture does not stabilize it — it makes instability harder to observe. The current evaluation is safe to conduct precisely because the manual architecture is so well understood.

---

## 2. Current Workflow Architecture

### 2.1 The Five Layers

The current workflow is a strict five-layer pipeline. Information flows in one direction only.

```
Layer 1: Canonical Sources
         ↓
Layer 2: NotebookLM Synthesis
         ↓
Layer 3: Claude / ChatGPT Transformation
         ↓
Layer 4: Dissemination Artifacts
         ↓
Layer 5: Obsidian / Local Scholarly Archive
```

**Layer 1 — Canonical Sources**
GitHub repository `docs/` directory. Contains `project-brief.md`, `current-architecture.md`, `notebooklm-exports/` (sanitized packets), `session-status.md`, and `phase1-memory-architecture.md`. These are the authoritative sources of truth. Nothing derived from downstream layers may be introduced back into this layer.

**Layer 2 — NotebookLM Synthesis**
Three notebooks: `Tu Pana: Pedagogical Core`, `Tu Pana: Architecture & Design Decisions`, and `Intellectual Projects: Cross-Domain Synthesis`. Each notebook receives only sanitized, approved content from Layer 1. Notebooks produce oriented synthesis for human-directed queries only. They are never recipients of content from Layers 3, 4, or 5.

**Layer 3 — Claude / ChatGPT Transformation**
AI transformation of NLM-oriented synthesis into task-appropriate outputs: talk segments, student guides, abstract drafts. Human review is required before any output moves downstream. This layer consumes from Layer 2 and produces into Layer 4. It does not write back to Layers 1 or 2.

**Layer 4 — Dissemination Artifacts**
`docs/talks/`, conference submissions, student-facing materials. These are rhetorical outputs. They are not canonical documentation. They must never be uploaded into Layer 2 notebooks or treated as authoritative in Layer 3 prompts.

**Layer 5 — Obsidian / Local Scholarly Archive**
Local vault mirroring `docs/` structure for human-readable project memory. Contains DOCX copies and companion markdown for dissemination outputs. Not connected to any AI system. Archival only.

### 2.2 Why the Current Workflow Is Stable Enough for Controlled Experimentation

The following conditions have been verified:

- All five layers are defined, documented, and operationally tested
- Two live workflow tests have passed with correct one-way flow preserved
- Forbidden-upload policy is documented and enforced manually
- `SYSTEM_MEMORY.md` is excluded from all AI-accessible systems
- `docs/pilot/` materials containing sensitive student and IRB data are not in any notebook
- Token budget guidelines (`≤ 800 tokens from NLM per session`, `≤ 2000 tokens total context packet`) have been established and followed
- All canonical documents are current, versioned, and committed to Git

These conditions mean that the boundaries MCP would need to respect are already defined and tested. The evaluation asks only whether MCP can operate within those boundaries automatically.

---

## 3. Non-Negotiable Architectural Principles

These principles apply to any MCP integration and cannot be relaxed for convenience, performance, or feature gain. Any MCP implementation that cannot satisfy all of these principles must be rejected.

**3.1 One-Way Information Flow**
Information moves from canonical sources toward dissemination artifacts, never in reverse. MCP may assist retrieval at the Layer 1 → Layer 3 boundary. It must never write, summarize back, or feed output from Layer 3 or Layer 4 back into Layer 1 or Layer 2.

**3.2 No Recursive NotebookLM Contamination**
Under no circumstances may content generated by Claude, ChatGPT, or any MCP-mediated transformation be uploaded into a NotebookLM notebook. The notebooks contain only sanitized canonical source packets. This rule has no exceptions.

**3.3 Token Minimization**
Every MCP retrieval must justify its token cost against the manual alternative. Retrievals that return general summaries, encyclopedic overviews, or speculative context are token-wasteful and must be flagged as failures. Bounded, targeted retrieval of specific facts or structural information is the only acceptable use pattern.

**3.4 Manual Review Before Ingestion**
No MCP-retrieved content enters a working prompt without human review. Automated injection of retrieved content into active prompts is prohibited during the evaluation period. MCP surfaces candidate content; the scholar decides whether and how to use it.

**3.5 Canonical Truth Locations**
The canonical truth about the Tu Pana system lives in two places only: the GitHub repository (`docs/` directory) and `SYSTEM_MEMORY.md` (local only, never committed). MCP may retrieve from NotebookLM notebooks as a synthesis layer, but retrieved content is not itself canonical. The scholar must always verify retrieved claims against committed documentation before treating them as authoritative.

**3.6 Separation Between Synthesis and Dissemination**
MCP must not treat `docs/talks/` artifacts, conference abstracts, or student-facing materials as retrievable synthesis sources. These are outputs, not inputs. Mixing them into retrieval pools creates circular reference loops and gradually degrades the quality of synthesis.

**3.7 Privacy-First Design**
No student data, no pilot participant information, no IRB-sensitive records, no institutional correspondence, and no personally identifiable information may enter any MCP-accessible retrieval space. This applies even to anonymized or aggregated forms unless explicitly reviewed by the scholar.

**3.8 No Direct Student-Data Exposure**
`docs/pilot/` is an absolute exclusion zone. Its contents include tester instructions, feedback form links, observation checklists, and potential participant data. No MCP connector may have read access to this directory or any file within it, under any configuration.

---

## 4. Sandbox Boundaries

### 4.1 What MCP MAY Access

MCP connectors, during the evaluation period, are permitted access to **the three NotebookLM notebooks only**, and only through their official read API, if such an interface is supported:

- `Tu Pana: Pedagogical Core`
- `Tu Pana: Architecture & Design Decisions`
- `Intellectual Projects: Cross-Domain Synthesis`

Access is read-only. The evaluation will test whether retrieval from these notebooks — which already contain sanitized, approved content — can be made less friction-intensive without violating the principles in Section 3.

### 4.2 What MCP MUST NEVER Access

The following resources are categorically excluded from any MCP retrieval configuration. This list is not a default setting — it is a hard architectural constraint. Any MCP connector that cannot be configured to exclude all of these must be rejected.

| Resource | Reason for Exclusion |
|---|---|
| `SYSTEM_MEMORY.md` | Local AI briefing file; contains operational state, never to be ingested by automated systems |
| `docs/pilot/` | Contains student-facing materials, feedback forms, and potential IRB-sensitive data |
| `docs/archive/` | Historical versions; describes earlier app iterations that are no longer accurate |
| `docs/talks/` | Dissemination artifacts; rhetorical outputs that must not re-enter synthesis layer |
| Runtime application code (`assets/js/`, `index.html`) | Live student-facing code; no relationship to scholarly synthesis workflow |
| `config.js` or any file containing API endpoints, secrets, or tokens | Security boundary; absolute exclusion |
| Student writing or draft content | Privacy and IRB constraint; no student data in automated retrieval |
| Unpublished manuscripts | Pre-publication scholarly work; not appropriate for AI retrieval systems |
| Institutional records or correspondence | Confidentiality obligations |
| Obsidian vault (`~/Documents/Obsidian/`) | Local human-readable archive; not designed as an AI retrieval source |
| `docs/notebooklm-exports/` (the source packets themselves) | These are inputs to NotebookLM, not synthesis outputs; retrieving them directly bypasses the synthesis layer |

---

## 5. MCP Connector Selection Criteria

Any MCP connector considered for this evaluation must satisfy all of the following criteria. Partial satisfaction is not acceptable during the evaluation phase.

**5.1 Read-Only Preferred**
The connector must not have write, modify, create, or delete capabilities in any accessible resource. If a connector requires write access for any purpose (logging, caching, sync), it must be disqualified unless the write target is an isolated, disposable evaluation log with no connection to canonical systems.

**5.2 Local-First**
The connector must operate locally or through a connection to a service the scholar already controls (e.g., a Google API the scholar authenticates personally). It must not relay data through third-party intermediaries beyond the target service. Cloud relay architectures that route queries through unknown servers are disqualified.

**5.3 No Cloud Relay**
Retrieved content must not pass through any server other than the source service (NotebookLM) and the local Claude Code client. Any architecture that buffers, caches, or processes retrieved content on an intermediate server is disqualified.

**5.4 Minimal Permissions**
The connector must request the minimum OAuth or API scope required for read access. It must not request access to Google Drive root, Gmail, Calendar, or any resource outside the target notebooks. Scope creep at the authentication layer is a disqualifying condition.

**5.5 Uninstallable**
The connector must be trivially removable. Uninstallation must restore the system to its pre-installation state with no residual configuration, no cached data, no background processes, and no modified settings files. If uninstallation requires manual cleanup, the connector is not acceptable.

**5.6 Transparent Documentation**
The connector's source code must be publicly available, actively maintained, and readable by a developer with general programming competence. Black-box connectors — those whose retrieval logic cannot be inspected — are disqualified.

**5.7 Active Maintenance**
The connector must have been updated within the past six months and must have an active maintainer who responds to security disclosures. Abandoned or unmaintained connectors introduce long-term dependency risk.

**5.8 Bounded Retrieval**
The connector must support query-scoped retrieval — the ability to ask for a specific piece of information rather than triggering a broad index scan. Connectors that retrieve full-document content, all-notebook summaries, or unfiltered corpus dumps are not appropriate for token-minimization goals.

**5.9 No Autonomous Indexing**
The connector must not autonomously index, crawl, or pre-cache content from connected resources. Retrieval must be triggered by explicit scholar-initiated queries only. Background indexing introduces stale retrieval risk and potentially exposes content to systems that have not been reviewed for each session.

---

## 6. Threat Model

This section identifies the failure modes that the evaluation protocol is specifically designed to detect. Each threat is described with its mechanism, its detection signal, and its consequence for architectural integrity.

**6.1 Prompt Injection**
*Mechanism:* A retrieved document contains text that, when inserted into a prompt, functions as an instruction to the language model — overriding intended behavior, revealing system prompts, or redirecting task execution.
*Detection signal:* Model behavior departs from expected output in a way that correlates with recently retrieved content.
*Consequence:* Severe. Could compromise guardrails, reveal `SYSTEM_MEMORY.md` content if accessible, or produce outputs that violate pedagogical constraints.

**6.2 Retrieval Contamination**
*Mechanism:* Content from a dissemination artifact (e.g., a conference abstract) enters the retrieval pool and is treated as canonical architectural documentation.
*Detection signal:* Retrieved content references pedagogical framing or architectural details in rhetorical rather than technical language; claims cannot be verified in `docs/project-brief.md` or `docs/current-architecture.md`.
*Consequence:* High. Degrades synthesis quality over time and introduces circular reference loops.

**6.3 Recursive Summarization Drift**
*Mechanism:* A summary produced in Session N is retrieved in Session N+1, summarized again, and the compressed version is used as context in Session N+2. Each cycle removes nuance, introduces paraphrase errors, and drifts further from canonical truth.
*Detection signal:* Retrieved claims cannot be matched to specific passages in canonical documents.
*Consequence:* High. Produces confident but inaccurate architectural claims that are difficult to trace back to their source.

**6.4 Accidental Canonization of Rhetorical Artifacts**
*Mechanism:* A faculty talk segment or student guide, written for communicative effectiveness rather than technical precision, is retrieved and treated as an authoritative description of the system.
*Detection signal:* Retrieved content uses persuasive, audience-facing language rather than technical specification language; includes claims about "what AI cannot do" framed for lay audiences.
*Consequence:* Moderate to high. Introduces imprecise framing into technical workflows; could weaken guardrail language if used as system prompt context.

**6.5 Token Inflation**
*Mechanism:* MCP retrieval returns broader context than necessary, increasing prompt length without improving synthesis quality.
*Detection signal:* Token count in MCP-assisted sessions exceeds token count in equivalent manual sessions by more than 20%.
*Consequence:* Moderate. Directly contradicts the token-minimization goal; may indicate that manual retrieval is still more efficient.

**6.6 Dependency Fragility**
*Mechanism:* The MCP connector becomes a required component of the workflow — sessions cannot proceed without it, or retrieval quality degrades so much in manual mode that the scholar loses the ability to operate manually.
*Detection signal:* Scholar finds manual retrieval substantially harder after MCP introduction; session startup fails when connector is unavailable.
*Consequence:* High. Violates the removability principle and creates single-point-of-failure dependency.

**6.7 Context Pollution**
*Mechanism:* Retrieved content from one retrieval task persists in model context and influences subsequent, unrelated tasks within the same session.
*Detection signal:* Model references retrieved content in response to queries that did not trigger retrieval; earlier retrieved framing colors later analytical outputs.
*Consequence:* Moderate. Reduces precision of targeted outputs and introduces confounds into multi-task sessions.

**6.8 Stale Retrieval**
*Mechanism:* NotebookLM notebooks have not been updated to reflect the current canonical document state; retrieved synthesis reflects a prior architectural version.
*Detection signal:* Retrieved content references features, stage counts, or function names that have been deprecated or renamed in recent commits.
*Consequence:* Moderate to high. Could produce implementation advice based on outdated architecture; particularly dangerous for Stage logic, localStorage keys, or guardrail specifications.

**6.9 Excessive Abstraction**
*Mechanism:* The MCP connector retrieves high-level summaries instead of specific, bounded facts. The scholar receives a general orientation paragraph when they needed a specific function signature or localStorage key name.
*Detection signal:* Retrieved content cannot be used directly in a working prompt without substantial additional processing; retrieval rate (useful facts per 100 tokens retrieved) is below 50%.
*Consequence:* Moderate. Makes MCP less useful than manual retrieval; may increase cognitive overhead rather than reducing it.

**6.10 Hallucinated Authority**
*Mechanism:* Retrieved content presents a synthesized claim with the rhetorical confidence of a primary source, when in fact the claim is a NotebookLM inference not directly supported by canonical text.
*Detection signal:* Retrieved claim cannot be verified in `docs/project-brief.md`, `docs/current-architecture.md`, or committed git history; claim is stated without hedging language.
*Consequence:* High. Introduces unverifiable "facts" into scholarly workflows; particularly dangerous for IRB-related claims about student data handling.

---

## 7. Evaluation Tasks

The following five retrieval tasks are drawn directly from the Tu Pana de Escritura architecture and represent the kinds of queries a scholar might direct to a NotebookLM notebook during a real working session. Each task defines an expected output, a correctness criterion, and a contamination check.

### Task 1 — Authorship Gate Architecture

**Query:** "What is the authorship gate in Tu Pana, and which functions enforce it?"

**Expected output:** A bounded description referencing Stage 6, `executeSave()`, `updateDraftControls()`, the `tupana_draft_saved` localStorage key, and the IRB/academic integrity rationale. No more than 200 tokens.

**Correctness criterion:** All referenced functions and localStorage keys must match entries in `docs/current-architecture.md`. No function names not present in canonical docs may appear.

**Contamination check:** Retrieved content must not reference student writing examples, pilot participant behavior, or dissemination-artifact descriptions of how students "feel" about the gate.

**Failure signal:** Retrieved content includes rhetorical language about "trust" or "student ownership" from the faculty talk segment rather than technical specification language.

---

### Task 2 — Voice Vault Save Flow

**Query:** "How does the Voice Vault phrase protection flow work? What are the two affordances and what function do both call?"

**Expected output:** Reference to `#vaultInlineProtectBtn` (primary), `#etbProtectBtn` (secondary), and `protectSelectedPhrase()` as the shared handler. Should include `tupana_protected` key, max 20 phrases, 3–200 char validation. No more than 150 tokens.

**Correctness criterion:** The `_pendingSel` pattern (text frozen at mouseup to survive focus change) must be mentioned or implicitly consistent with the described flow. Retrieved content must not describe a flow that requires auto-send behavior.

**Contamination check:** Retrieved content must not conflate Voice Vault with the selection-to-coach floating button, which is a distinct feature serving a different purpose.

**Failure signal:** Retrieved content describes only the toolbar button (secondary affordance) and omits the inline Voice Vault panel button added in Session 40.

---

### Task 3 — Dissemination Layer Rules

**Query:** "What are the rules governing what can and cannot be uploaded to NotebookLM notebooks?"

**Expected output:** Clear enumeration of forbidden upload categories (student data, pilot materials, `docs/pilot/`, unpublished manuscripts, API/config data, source code, `SYSTEM_MEMORY.md`, `docs/archive/`, `docs/talks/`, agent instruction files). Should reference the one-query-per-session limit and the `≤ 800 token NLM context` guideline. No more than 200 tokens.

**Correctness criterion:** The seven forbidden-upload categories from `docs/phase1-memory-architecture.md` must all be present or implied. The one-way flow rule must be explicit.

**Contamination check:** Retrieved content must not suggest that conference abstracts or talk segments may be uploaded "for reference." These are explicitly forbidden as potentially circular.

**Failure signal:** Retrieved content includes a permissive statement like "you can upload derivative materials as long as they don't include student data" — a synthesis error that contradicts the architectural policy.

---

### Task 4 — Freire Pedagogical Framing

**Query:** "What is the Freirean grounding for Tu Pana's AI coaching design? How does it relate to authorship and student voice?"

**Expected output:** A grounded synthesis referencing dialogue, conscientization, and the principle that students are knowledge-holders, not empty vessels. Should connect this to the anti-ghostwriting architecture and the Voice Vault as a mechanism for preserving student voice as intellectual evidence. No more than 250 tokens.

**Correctness criterion:** Retrieved framing must be consistent with the pedagogical principles in `docs/project-brief.md`. It must not attribute specific quotes to Freire without a canonical source citation.

**Contamination check:** Retrieved content must not import language from the Freire Conference 2026 abstract (a dissemination artifact) as if it were canonical pedagogical documentation.

**Failure signal:** Retrieved content includes persuasive rhetoric written for a conference audience — "Tu Pana represents a new paradigm..." — rather than grounded pedagogical specification.

---

### Task 5 — Bilingual Parity Architecture

**Query:** "How is bilingual parity implemented in Tu Pana? What CSS and JS mechanisms enforce it?"

**Expected output:** Reference to `data-lang` attribute on `<html>`, `state.lang` values (`'es' | 'en' | 'both'`), `setLang()`, `.show-es`/`.show-en` CSS classes, `.lang-sep` separator class, and the 3-button lang switcher. Should note that bilingual parity is a non-negotiable principle in `docs/project-brief.md`. No more than 200 tokens.

**Correctness criterion:** All CSS class names and JS function names must match the canonical architecture documentation. The description must distinguish between CSS-layer visibility switching and JS-layer state management.

**Contamination check:** Retrieved content must not present bilingual parity as merely a "feature" or "option" — it is a pedagogical non-negotiable, and retrieval must reflect that framing.

**Failure signal:** Retrieved content describes a language toggle as a user preference feature, omitting its status as a core architectural and pedagogical constraint rooted in the app's commitment to code-switching as a rhetorical resource.

---

## 8. Token-Maximization Evaluation

### 8.1 Principle

> **The MCP layer exists to reduce cognitive and token overhead, not to create autonomous research behavior.**

Every retrieval must be evaluated not only for correctness but for efficiency. An MCP integration that returns correct content at twice the token cost of manual retrieval is not an improvement — it is a regression dressed as automation.

### 8.2 Retrieval Logging Framework

For each MCP-assisted retrieval during the evaluation period, the following data must be logged manually by the scholar in a session evaluation log (not committed to the repository):

| Field | Description | How to Measure |
|---|---|---|
| **Query** | The exact query submitted to the MCP connector | Record verbatim |
| **Tokens Retrieved** | Estimated token count of the returned content | Use Claude's token counter or `len(text)/4` approximation |
| **Tokens Used** | Tokens actually injected into the working prompt | Record only the fragment used, not the full retrieval |
| **Usefulness Score** | Did the retrieved content directly enable the task? | Scale: 0 (not useful) / 1 (partially useful) / 2 (directly useful) |
| **Redundancy Flag** | Was this content already in context from session start? | Yes / No |
| **Manual Baseline** | Estimated time and effort to retrieve the same content manually | Record in seconds and number of steps |
| **MCP Retrieval Time** | Time from query submission to content available | Record in seconds |
| **Prompt Complexity Impact** | Did adding retrieved content make the prompt harder to reason over? | Yes / No / Neutral |
| **Synthesis Quality Impact** | Did the retrieved content improve the quality of the AI's output? | Yes / No / Unclear |
| **Boundary Observation** | Did the retrieval stay within permitted boundaries? | Yes / No (if No, record what was accessed) |

### 8.3 Session-Level Evaluation Summary

At the end of each evaluation session, compute:

- **Retrieval efficiency ratio** = `Tokens Used / Tokens Retrieved` (target: > 0.6)
- **Usefulness density** = `Sum of Usefulness Scores / Number of Retrievals` (target: ≥ 1.5)
- **MCP advantage** = Sessions where MCP retrieval was faster AND more precise than the manual baseline
- **Token overhead** = Additional tokens consumed beyond manual baseline (target: ≤ 15% overhead)

### 8.4 Evaluation Threshold

If, after five evaluation sessions, the retrieval efficiency ratio is below 0.4 in more than two sessions, or if the MCP advantage is achieved in fewer than three of five sessions, the evaluation should be suspended and the manual workflow should continue without MCP augmentation.

---

## 9. Failure Conditions

The evaluation fails immediately and MCP integration must be suspended if any of the following conditions are observed. These are not soft warnings — they are hard stops.

| Failure Condition | Description |
|---|---|
| **Forbidden content access** | MCP connector retrieves or attempts to retrieve content from any resource listed in Section 4.2 |
| **Dissemination artifact treated as canonical truth** | Retrieved content from `docs/talks/` or any conference abstract is injected into a working session as architectural documentation |
| **Generalized summary instead of bounded retrieval** | Connector returns a broad overview paragraph when a specific fact (function name, localStorage key, stage ID) was queried |
| **Significant token overhead** | MCP-assisted sessions consume more than 25% additional tokens compared to equivalent manual sessions on average over three sessions |
| **Excessive maintenance burden** | Connector requires reconfiguration, re-authentication, or troubleshooting in more than one of five evaluation sessions |
| **Workflow clarity degradation** | Scholar finds it harder to explain the workflow architecture after MCP introduction than before |
| **Opaque automation** | Connector performs retrieval steps the scholar cannot inspect, describe, or reproduce manually |
| **Speculative querying** | MCP integration encourages the scholar to query for content they would not have needed in a manual session — broadening scope rather than reducing friction |
| **Architectural destabilization** | Any aspect of the five-layer workflow becomes less clear, less enforced, or less well-understood as a result of MCP operation |
| **Boundary erosion** | A situation arises where the scholar is uncertain whether a retrieval crossed a permitted boundary — indicating that the boundaries are not sufficiently enforced by connector configuration |

---

## 10. Success Conditions

MCP integration is acceptable only if **all** of the following conditions are satisfied after the full evaluation period. Partial success does not constitute success.

| Success Condition | Verification Method |
|---|---|
| **Architectural separation preserved** | One-way flow remains intact; no content has moved against the intended direction | Manual review of session logs |
| **Retrieval friction reduced** | MCP-assisted retrieval is measurably faster than manual retrieval in ≥ 3 of 5 evaluation tasks | Retrieval logging framework (Section 8) |
| **Token usage bounded** | Total token overhead across all evaluation sessions is ≤ 15% above the manual baseline | Token log comparison |
| **Full system comprehensibility** | Scholar can explain every component of the MCP-assisted workflow without reference to documentation | Verbal self-audit at session end |
| **Removability confirmed** | Connector can be uninstalled in under 5 minutes with zero residual configuration | Timed uninstall test |
| **Human review maintained** | No retrieved content has entered a working prompt without explicit scholar review | Session log review |
| **Security risk unchanged** | No new attack surface has been created; no sensitive data has been exposed | Boundary audit against Section 4.2 |
| **Canonical truth unchanged** | `docs/project-brief.md` and `docs/current-architecture.md` remain the sole authoritative sources; no retrieved synthesis has been treated as equally authoritative | Spot-check against canonical docs |

---

## 11. Decision Rubric

After completing the five evaluation sessions and reviewing all session logs against Sections 9 and 10, the scholar must arrive at one of three decisions. This decision should be documented in `docs/ideas/` as a brief addendum to this evaluation plan.

### 11.1 Adopt Cautiously

**Conditions for adoption:**
- All success conditions in Section 10 are met
- Zero hard-stop failures from Section 9 occurred
- Token overhead is consistently below 10%
- Scholar finds MCP-assisted sessions meaningfully less cognitively demanding

**What adoption means:**
Continue using the connector for the specific notebooks and query types validated in the evaluation. Do not expand the access scope, do not add additional connectors, and do not reduce manual review. Re-evaluate after 10 production sessions.

### 11.2 Defer

**Conditions for deferral:**
- Some success conditions are met but not all
- No hard-stop failures occurred, but one or more soft concerns emerged
- Token overhead is between 15–25%
- The evaluation revealed areas where MCP connectors have not matured to the required specification

**What deferral means:**
The current manual workflow continues unchanged. The evaluation plan is preserved for future reference. MCP is re-evaluated when either: (a) the scholar's retrieval workload increases substantially, or (b) a connector becomes available that better meets the selection criteria in Section 5.

### 11.3 Reject

**Conditions for rejection:**
- Any hard-stop failure from Section 9 occurred
- Multiple success conditions from Section 10 were not met
- Scholar found the evaluation process itself to be cognitively or architecturally destabilizing

**What rejection means:**
MCP integration is not pursued for this workflow. The current manual bridge continues. This decision is not permanent — it may be revisited after significant changes to the available connector ecosystem — but it cannot be reversed without repeating the full evaluation protocol.

---

## 12. Recommended Next Steps

The recommendation is not to install MCP now. The recommendation is to begin the evaluation only after the following preparatory conditions are met.

**Step 1 — Identify one candidate connector**
Research available MCP connectors for Google Drive or NotebookLM access. Evaluate each against the criteria in Section 5 before attempting installation. This research should produce a written one-page connector assessment before any installation occurs.

**Step 2 — Local-only installation in a clean environment**
If a candidate connector passes the criteria assessment, install it in a local Claude Code environment that does not have access to the runtime Tu Pana codebase. Do not install in the production development environment.

**Step 3 — Configure access to one notebook only**
Begin evaluation with a single notebook: `Tu Pana: Architecture & Design Decisions`. This notebook has the most bounded content and the clearest correctness criteria. Do not enable access to other notebooks until the first notebook has passed all five evaluation tasks.

**Step 4 — One query per evaluation session**
During the evaluation period, limit MCP-assisted retrieval to one query per working session. Log the result using the framework in Section 8. Do not allow retrieval to become habitual before the evaluation is complete.

**Step 5 — Complete all five evaluation tasks before drawing conclusions**
Do not conclude that MCP is working after one or two successful retrievals. The threat model in Section 6 contains failure modes that only manifest over multiple sessions. The full five-task evaluation must be completed before the decision rubric in Section 11 is applied.

**Step 6 — Evaluate before integrating into production sessions**
The evaluation sessions must be separate from productive working sessions. Do not evaluate MCP while also using it to complete real scholarly tasks. This conflation makes it impossible to distinguish MCP's contribution from the scholar's own reasoning.

**Step 7 — Document the decision**
Whatever the outcome, the decision must be documented in a brief addendum to this file. Future versions of `SYSTEM_MEMORY.md` should reflect the outcome only after the evaluation is complete and the decision has been made.

---

## 13. Final Architectural Warning

---

> ### ⚠ Warning: The Silent Erosion Risk
>
> **The greatest risk of MCP in scholarly workflows is not technical failure — it is the silent erosion of architectural discipline.**
>
> Technical failures are visible. A connector that exposes forbidden content, inflates tokens catastrophically, or introduces obvious prompt injection will be caught. These failures announce themselves.
>
> Architectural erosion does not announce itself. It accumulates quietly across sessions. The scholar begins querying for context they would previously have retrieved manually — and with the retrieval comes a subtle shift: the system becomes slightly more autonomous, the scholar becomes slightly less deliberate, and the boundary between "what I retrieved" and "what I decided" begins to blur.
>
> Over time, this erosion manifests as:
> - NotebookLM synthesis being treated as canonical documentation
> - Dissemination artifacts being retrieved alongside technical specifications
> - Retrieved content entering prompts without the scholar's full awareness of its origin
> - The manual workflow becoming harder to perform because the scholar has lost the habit
> - Architectural boundaries that were enforced by deliberate human action becoming enforced only by configuration settings that the scholar no longer actively reviews
>
> The Tu Pana workflow was built on deliberate design choices made by a scholar who understands every component. The value of that understanding is not incidental — it is the foundation on which the workflow's integrity rests. MCP should only be adopted if it can reduce friction without reducing understanding.
>
> **If, at any point in the evaluation, the scholar finds themselves unable to describe exactly what MCP retrieved, why it was retrieved, and whether the boundary constraints were respected — the evaluation should stop immediately.**
>
> Automation that outpaces comprehension is not infrastructure. It is risk.

---

*Document status: EVALUATION PROTOCOL — No implementation has occurred.*
*Next review: After five evaluation sessions, or upon identification of a qualifying connector.*
*Maintained by: Prof. Victor Torres-Vélez, Hostos Community College — Tu Pana de Escritura Project*
