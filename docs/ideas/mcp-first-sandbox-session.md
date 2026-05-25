# MCP First Sandbox Session Plan
**Tu Pana de Escritura — Controlled Retrieval Experiment**
*Version 1.0 — 2026-05-25*
*Status: PRE-INSTALLATION PLANNING — No MCP installed. No runtime code modified.*

---

## Critical Finding: NotebookLM Has No Consumer API

Before any evaluation matrix is meaningful, one architectural fact must be stated plainly:

> **Google's NotebookLM product has no public consumer API and no official MCP server.**

The only NotebookLM API that exists is a Google Cloud **enterprise** product (NotebookLM Enterprise API) for managing notebook CRUD operations via Google Cloud credentials — not for querying notebook synthesis outputs, and not accessible to a solo scholar without an enterprise account.

This means:
- "MCP that queries NotebookLM notebooks directly" does not exist as a safe, official option
- All community connectors claiming to access NotebookLM use **browser automation** (Patchright/Chrome stealth fingerprinting, cookie-based authentication, undocumented internal APIs)
- The official Google Drive MCP (`@modelcontextprotocol/server-gdrive`) was **archived by Anthropic in May 2025** and is no longer actively maintained

**Architectural reframe (valid and sound):**

The evaluation plan in `docs/ideas/mcp-sandbox-evaluation-plan.md` defined the NotebookLM notebooks as the target retrieval layer. But what makes those notebooks valuable is not their UI — it is the sanitized synthesis content that has already been extracted from them and committed to the repository as:

```
docs/notebooklm-exports/
  architecture-packet.md    ← sanitized Tu Pana architecture synthesis
  pedagogy-packet.md        ← sanitized pedagogical core synthesis
  session-digest.md         ← quarterly milestone summary
  README.md                 ← upload policy and forbidden-content list
```

These three packets **are** the approved synthesis layer. They were extracted from the notebooks, reviewed by the scholar, sanitized, and committed precisely so they could serve as reliable retrieval sources. Filesystem MCP pointed exclusively at this directory achieves the same workflow goal — reducing retrieval friction — without browser automation, without cloud relay, without abandoned connectors, and without any new security surface.

**This is not a compromise. This is the architecturally correct answer.**

---

## 1. Recommendation Matrix

| Connector / Approach | Local-first? | Read-only configurable? | Requires cloud relay? | Requires browser session / cookies? | Maintenance burden | Security risk | Token-efficiency compatible? | Reversible uninstall? | Recommended? |
|---|---|---|---|---|---|---|---|---|---|
| **Filesystem MCP → `docs/notebooklm-exports/` only** | ✓ Yes | ✓ Yes (ro flag) | ✗ No | ✗ No | Low | Low | ✓ High | ✓ Yes (<2 min) | **YES** |
| Google Drive MCP (`server-gdrive`) | ✗ No | ✓ Yes | ✓ Yes (OAuth) | ✗ No | **Very high** (archived May 2025) | Medium | Low | Yes | **NO** |
| Community NotebookLM MCP (browser automation) | ✗ No | ✗ No (can ingest) | ✗ No (but Chrome) | ✓ Required | **Very high** (undocumented APIs, breaks on UI changes) | **High** (stealth fingerprinting, cookie exposure) | Low (unpredictable) | Difficult | **NO** |
| Fetch MCP → NotebookLM shared URLs | ✓ Yes | ✓ Yes | ✓ Yes (HTTP) | ✓ Required (Google auth) | Medium | Medium (auth tokens in transit) | **Low** (HTML scraping, unreliable format) | ✓ Yes | **NO** |
| Continue manual (no MCP) | ✓ Yes | N/A | ✗ No | ✗ No | None | None | Baseline | N/A | **BASELINE — always available** |

---

## 2. Selected Candidate

**`@modelcontextprotocol/server-filesystem`**
Scoped exclusively to: `docs/notebooklm-exports/` (read-only)

### Why this one

- **Official and maintained.** Published by Anthropic under `@modelcontextprotocol/server-filesystem`. Actively maintained. Source code is public and inspectable.
- **Local-only.** Runs as a local process. No network calls, no OAuth handshake, no cloud relay. All retrieval happens on the scholar's machine.
- **Read-only configurable.** The `ro` flag restricts the mounted directory to read operations only. No file creation, modification, or deletion is possible.
- **Bounded scope.** The server is launched with an explicit directory argument. It cannot access anything outside the specified path. If scoped to `docs/notebooklm-exports/`, it cannot read `SYSTEM_MEMORY.md`, `docs/pilot/`, source code, or any other resource.
- **Reversible in under two minutes.** Uninstalling means removing one JSON entry from Claude Code's settings file and confirming the process is not running. No residual state.
- **Token-efficient.** The export packets are pre-sanitized and bounded in size. `architecture-packet.md` and `pedagogy-packet.md` are designed to fit within the ≤ 800-token NLM context budget. Filesystem MCP retrieves exact file content — no generative summarization, no token inflation from synthesis drift.
- **Architecturally coherent.** The export packets were explicitly created as the approved retrieval artifacts for this workflow. Using Filesystem MCP to access them is not a workaround — it is the intended use of those files.

### Why NOT the others

**Google Drive MCP:** Archived by Anthropic in May 2025. Using an abandoned connector in a privacy-conscious scholarly workflow violates the active-maintenance requirement in `docs/ideas/mcp-sandbox-evaluation-plan.md §5.7`. Additionally, it requires OAuth, cloud relay, and exposes Google Drive credentials — all of which increase the attack surface beyond what the manual workflow requires.

**Community NotebookLM MCP (browser automation):** Violates four hard constraints simultaneously: requires a live browser session (cookies), uses undocumented internal APIs (breaks without warning on NotebookLM UI updates), has no meaningful read-only mode (the connector can also ingest sources), and is high-maintenance by design. The stealth fingerprinting mechanism (Patchright) is itself a security antipattern in a scholarly environment.

**Fetch MCP:** Cannot authenticate to NotebookLM without a Google session cookie. Even if authentication were solved, the returned content would be raw HTML requiring further parsing — poor token efficiency, fragile, and producing unreliable content.

### Specific risks that remain

Even with the safest option selected, three risks must be actively managed:

1. **Scope creep via path traversal.** The filesystem MCP server is launched with a directory argument, but if misconfigured — if the repo root is passed instead of `docs/notebooklm-exports/` — Claude gains read access to the entire repository including `SYSTEM_MEMORY.md`, `assets/js/`, `config.js`, and `docs/pilot/`. **The directory argument must be verified before every session.**

2. **Stale packet risk.** The export packets in `docs/notebooklm-exports/` reflect the state of the NotebookLM notebooks at the time of last export. If the notebooks have been updated but the packets have not been re-exported and re-committed, MCP retrieval returns outdated synthesis. **Before any MCP session, confirm the packet timestamps are current.**

3. **Habit erosion.** If the scholar begins relying on Filesystem MCP retrieval for every session, the deliberate review step — manually reading the packet and deciding what to inject — is gradually bypassed. The scholar loses the boundary-enforcement habit that protects against retrieval contamination. **One query per session maximum. Manual sessions must continue to be practiced.**

### What must NEVER be enabled

- **The server must never be launched with the repo root** (`/Users/Victor1/Sites/tupana/`) as the directory argument. Only `docs/notebooklm-exports/` is permitted.
- **No write flag.** The `ro` option must always be present. Any configuration without read-only enforcement must be rejected before the session begins.
- **No connection to `docs/pilot/`, `docs/talks/`, `docs/archive/`, or `assets/`.** These paths are architecturally forbidden. They must not be added as secondary roots under any circumstances.

---

## 3. Exact Sandbox Scope

### Target file for first test
`docs/notebooklm-exports/architecture-packet.md`

This packet is the sanitized synthesis of the `Tu Pana: Architecture & Design Decisions` notebook — the correct starting point specified in `docs/ideas/mcp-sandbox-evaluation-plan.md §12`.

### First test query

> "What functions enforce the authorship gate in Tu Pana, and what localStorage key tracks whether the first draft has been saved?"

**Why this query:**
- It has a precise, verifiable expected answer (`executeSave()`, `updateDraftControls()`, `tupana_draft_saved`, Stage 6)
- It maps directly to Evaluation Task 1 from the evaluation plan (§7, Task 1)
- It is bounded — the answer requires only one or two sentences of source content
- It can be verified against `docs/current-architecture.md` without ambiguity
- It represents a realistic retrieval need (a scholar resuming work and needing to confirm a function name before editing)

**Expected retrieval output:** ≤ 150 tokens, containing references to `executeSave()`, `updateDraftControls()`, `tupana_draft_saved`, and Stage 6. No rhetorical framing, no student-facing language, no dissemination artifacts.

**Correctness verification:** Cross-check every function name, localStorage key, and stage reference against `docs/current-architecture.md §Key Functions` and committed `ui.js`. Any discrepancy signals stale packet content and requires manual review.

### How to measure token usage

1. Before the session: note the baseline token count for the manual equivalent (manually opening `architecture-packet.md`, reading the relevant section, and copying the answer into the prompt). Estimate: ~30 seconds, ~80–120 tokens injected manually.
2. During MCP retrieval: Claude Code will display the tool call and returned content. Record the character count of the returned fragment. Divide by 4 for a token approximation.
3. After the session: compare MCP-retrieved tokens (full return) vs. tokens actually used in the working prompt (the fragment selected for injection).
4. Log both values in the token logging template below.

### How to judge retrieval quality

A retrieval is **successful** if:
- It returns a fragment containing the specific answer to the query
- All named functions and keys match canonical documentation
- The returned content does not include rhetorical, student-facing, or dissemination-layer language
- The scholar can use the returned content directly without further processing

A retrieval is **unsuccessful** if:
- It returns a generalized summary paragraph instead of specific technical facts
- It returns content from outside the queried file
- It returns content that cannot be verified in `docs/current-architecture.md`
- It returns more than 300 tokens for a query whose answer requires ≤ 100 tokens

### When the experiment must stop

Stop immediately if any of the following occurs:
- Claude reads or attempts to read any file outside `docs/notebooklm-exports/`
- Any file in `docs/notebooklm-exports/` is modified (check with `git status` after the session)
- The connector fails to start and requires troubleshooting exceeding 5 minutes
- Retrieved content cannot be verified against `docs/current-architecture.md`
- The scholar feels uncertain about what was retrieved or whether boundaries were respected

---

## 4. Token Logging Template

Use this template manually after each evaluation retrieval. Store the log locally outside the repo (e.g., `~/NotebookLM-Exports/tu-pana/mcp-eval-log.md`). Do not commit retrieval logs.

```
## MCP Retrieval Log — [DATE] Session [N]

### Query
[Exact query submitted]

### Target file
[docs/notebooklm-exports/filename.md]

### Tokens retrieved (full return)
[character count / 4 = approx. tokens]

### Tokens used in prompt (fragment selected)
[character count / 4 = approx. tokens]

### Retrieval efficiency ratio
[Tokens used / Tokens retrieved] — target: > 0.6

### Usefulness score
[ ] 0 — Not useful (answer not in retrieved content)
[ ] 1 — Partially useful (answer present but required additional processing)
[ ] 2 — Directly useful (answer used as-is in working prompt)

### Manual baseline comparison
Estimated manual retrieval time: [seconds]
Estimated manual tokens injected: [approx.]
MCP retrieval time: [seconds]
MCP advantage: [Yes / No / Marginal]

### Prompt complexity impact
[ ] Simpler than manual (retrieved content integrated cleanly)
[ ] Neutral
[ ] More complex (retrieved content required filtering or reformatting)

### Synthesis quality impact
[ ] Improved (output quality was measurably better with retrieved context)
[ ] Unchanged
[ ] Unclear

### Boundary observation
[ ] Retrieval stayed within docs/notebooklm-exports/ — confirmed
[ ] No files modified — confirmed (git status clean)
[ ] No forbidden paths accessed — confirmed

### Stop condition triggered?
[ ] No — session continued normally
[ ] Yes — reason: [describe]

### Session verdict
[ ] Continue evaluation
[ ] Defer
[ ] Stop and reject
```

---

## 5. Installation Reference (Pre-Verified, Not Yet Executed)

This section records what installation would look like — for verification before the scholar begins. No installation is performed by this document.

**Package:** `@modelcontextprotocol/server-filesystem` (npm)
**Run method:** `npx` (no global install required — reduces residual state risk)

**Claude Code settings entry** (add to `~/.claude/settings.json` under `mcpServers`):

```json
{
  "mcpServers": {
    "tupana-exports": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "--ro",
        "/Users/Victor1/Sites/tupana/docs/notebooklm-exports"
      ]
    }
  }
}
```

**Critical verification before enabling:**
- Confirm `--ro` flag is present (read-only enforcement)
- Confirm the path ends at `docs/notebooklm-exports` — not the repo root
- Confirm no additional directory arguments are present
- Confirm no other MCP servers are listed in `mcpServers`

---

## 6. Rollback Plan

Rollback is a two-step operation that takes under two minutes and leaves no residual state.

### Step 1 — Remove the server configuration
Open `~/.claude/settings.json`. Remove the `"tupana-exports"` entry from `mcpServers`. If `mcpServers` becomes an empty object `{}`, it may be removed entirely.

Save the file.

### Step 2 — Verify no lingering access
Run the following verification sequence:

```bash
# Confirm Claude Code no longer lists the server
claude mcp list

# Confirm no background node/npx process is running
ps aux | grep "server-filesystem"

# Confirm export packets were not modified during the session
cd /Users/Victor1/Sites/tupana
git status
# Expected: "nothing to commit, working tree clean" (or only untracked LaTeX build artifacts)
# If docs/notebooklm-exports/ shows any modifications: STOP and investigate before proceeding

# Confirm no new files were created in the exports directory
ls docs/notebooklm-exports/
# Expected: architecture-packet.md  pedagogy-packet.md  README.md  session-digest.md
```

### Step 3 — Confirm manual workflow integrity
After rollback, perform one manual retrieval session (open `docs/notebooklm-exports/architecture-packet.md` in a text editor, locate the authorship gate information, and copy it manually into a Claude prompt). If this takes more effort than before MCP was introduced, or if the scholar feels the habit has degraded, note this in the evaluation log as a workflow-erosion signal.

### Rollback is complete when:
- `claude mcp list` returns no servers
- `git status` shows no modifications to `docs/notebooklm-exports/`
- Manual retrieval session completes without friction
- No node processes related to `server-filesystem` are running

---

## 7. Stop Conditions (Reference Card)

These conditions trigger immediate session termination regardless of where the session is in the evaluation sequence.

| Condition | Detection Method | Action |
|---|---|---|
| File access outside `docs/notebooklm-exports/` | Claude's tool calls show a path outside the scoped directory | Stop session, run rollback, document incident |
| Any file modified in exports directory | `git status` shows changes after session | Stop, investigate, run rollback |
| Connector fails to start | Error on first tool call or `claude mcp list` shows server as unavailable | Do not debug beyond 5 minutes; continue manually |
| Retrieved content unverifiable | Answer cannot be matched to `docs/current-architecture.md` | Flag as stale packet, stop MCP use, re-export packets before next session |
| Retrieval returns forbidden resource | Any reference to `SYSTEM_MEMORY.md`, `docs/pilot/`, student data, or source code appears in returned content | Immediate rollback; reject MCP for this workflow |
| Scholar uncertainty about boundary | Scholar cannot confidently state what was retrieved and why it was within bounds | Stop session; review rollback plan |
| Token overhead > 25% vs manual baseline | Token log shows consistent overhead across two sessions | Defer verdict; continue manually |

---

## 8. Evaluation Checklist

Complete this checklist before beginning the first live sandbox session.

### Pre-session checklist
- [ ] `docs/ideas/mcp-sandbox-evaluation-plan.md` fully read — criteria understood
- [ ] Export packets are current — `git log docs/notebooklm-exports/` confirms recent commit date
- [ ] `git status` is clean — no uncommitted changes in repo
- [ ] `~/.claude/settings.json` inspected — confirms no existing `mcpServers` entries
- [ ] Configuration entry prepared (Section 5) and verified for `--ro` flag and correct path
- [ ] Token logging template copied to `~/NotebookLM-Exports/tu-pana/mcp-eval-log.md`
- [ ] Manual baseline timed — open `architecture-packet.md`, locate authorship gate answer, note seconds elapsed

### During session
- [ ] Only one query submitted this session
- [ ] Query matches the pre-specified first test query exactly (Section 3)
- [ ] Tool call path confirmed as within `docs/notebooklm-exports/` only
- [ ] Token counts recorded immediately after retrieval

### Post-session
- [ ] Token log entry completed
- [ ] `git status` verified clean (no exports modified)
- [ ] Session verdict recorded (continue / defer / stop)
- [ ] If continuing: next query pre-specified before closing session
- [ ] If deferring or stopping: rollback executed and verified

---

## Architectural Note on the Scope Reframe

The evaluation plan in `docs/ideas/mcp-sandbox-evaluation-plan.md` framed the evaluation target as "the three NotebookLM notebooks." The research conducted for this session plan reveals that those notebooks cannot be accessed via any safe, maintained, official MCP connector.

The export packets in `docs/notebooklm-exports/` are not a substitute for the notebooks — they are the notebooks' approved synthesis output, already committed to the repository as the canonical retrieval source. The Filesystem MCP approach tests the same workflow hypothesis the evaluation plan intended: *can Claude retrieve synthesized, bounded content from the approved synthesis layer with less friction than manual copy-paste?*

The notebooks themselves remain the authoritative source for new synthesis work. The packets remain the approved read layer for existing Claude sessions. This distinction is preserved and not blurred by the Filesystem MCP approach.

If, in a future evaluation cycle, Google releases a stable NotebookLM API or a maintained MCP connector that meets all criteria in Section 5 of the evaluation plan, this session plan should be updated to reflect that option. Until then, Filesystem MCP → `docs/notebooklm-exports/` is the only evaluation-approved path.

---

*Document status: PRE-INSTALLATION PLANNING COMPLETE — Awaiting scholar decision to begin sandbox session.*
*No MCP has been installed. No runtime code has been modified. No SYSTEM_MEMORY.md modified.*
*Next step: Scholar reviews this document, completes pre-session checklist, then decides whether to install.*
