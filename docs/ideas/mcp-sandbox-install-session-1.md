# MCP Sandbox Installation — Session 1 Operational Record
**Tu Pana de Escritura — First Live Sandbox Evaluation**
*2026-05-25 — Status: INSTALLATION COMPLETE, FIRST TEST PENDING FRESH SESSION*

---

## Pre-Installation Discoveries

Two findings from pre-installation inspection change the configuration from what was planned in `docs/ideas/mcp-first-sandbox-session.md`. Both are documented here because they affect the installation plan, the safety controls, and the first test expectations. Neither is a reason to stop the evaluation — both are manageable and in some respects clarifying.

**Finding 1 — No `--ro` flag exists in the current server.**
The `@modelcontextprotocol/server-filesystem` package (version resolved by npx at install time) does not accept a `--ro` flag. Passing `--ro` as an argument causes the server to attempt to stat a directory named `--ro`, fail, and exit. The server registers write tools unconditionally: `write_file`, `edit_file`, `create_directory`, and `move_file` are always present. The previous session plan's reference to a `--ro` flag was based on research that turned out not to match the current package behavior.

The directory scope argument is the primary boundary control. The server can only access paths within the directories passed as arguments at startup. If the only argument is `docs/notebooklm-exports`, the server cannot read, list, or write anything outside that directory. This is the enforced boundary.

Write tools are additionally denied via Claude Code's `permissions.deny` configuration, which prevents Claude from invoking them without explicit user override. These two controls together — directory scope plus permission deny rules — replace the missing `--ro` flag.

**Finding 2 — The architecture-packet is orientation-level, not function-level.**
`docs/notebooklm-exports/architecture-packet.md` was reviewed before installation. It describes the authorship gate at a conceptual level: "The draft save action locks the editor and sets a persistent flag (`draftSaved`) that must be true before revision features activate." It does not contain specific function names (`executeSave`, `updateDraftControls`) or the full localStorage key with its `tupana_` prefix (`tupana_draft_saved`). These details are in `docs/current-architecture.md`, which is not in the MCP scope.

The first test query as specified in the session plan asked for specific function names and localStorage keys. That query is adjusted below to match what the packet can actually return. This is not a failure — it is a finding. It tells us the packet is appropriate for orientation retrieval, not for function-level implementation reference. That distinction matters for deciding when MCP retrieval is genuinely useful versus when reading `docs/current-architecture.md` directly remains the better path.

---

## 1. Pre-Installation Safety Summary

**What is being installed:**
A single MCP server — `@modelcontextprotocol/server-filesystem` — run via `npx` as a local subprocess. The server is scoped to one directory: `/Users/Victor1/Sites/tupana/docs/notebooklm-exports`. It exposes three files to Claude: `architecture-packet.md`, `pedagogy-packet.md`, and `session-digest.md`. It runs only when Claude Code is active and terminates when Claude Code terminates. It does not run as a daemon or background service.

**What is NOT being installed:**
No browser automation. No Google Drive connector. No Obsidian integration. No cloud relay. No indexing system. No background sync. No global npm package. No second MCP server of any kind. No connection to NotebookLM's web interface or any Google service.

**Why NotebookLM itself is not being connected:**
NotebookLM has no consumer API and no official MCP server. All community connectors for NotebookLM use browser automation with undocumented internal APIs, cookie-based authentication, and Chrome stealth fingerprinting. These mechanisms violate the maintenance-burden, security-risk, and reversibility requirements established in `docs/ideas/mcp-sandbox-evaluation-plan.md §5`. The export packets in `docs/notebooklm-exports/` are the approved, sanitized, committed representation of what those notebooks contain. Retrieving from the packets achieves the same workflow goal without browser automation.

**The risk of directory overexposure:**
The filesystem MCP server's only boundary mechanism is the directory path passed as its argument. If the repo root (`/Users/Victor1/Sites/tupana`) were passed instead of `docs/notebooklm-exports`, Claude would have read access to `SYSTEM_MEMORY.md`, `assets/js/`, `config.js`, `docs/pilot/`, `docs/talks/`, and every other file in the project. The distinction between the correct path and the incorrect path is a single directory level. It must be verified against the settings file before every session, not assumed.

**Why `docs/notebooklm-exports` is the only safe scope:**
The directory contains exactly four files: three sanitized export packets and a README describing the upload policy. All four are committed to Git, have no sensitive content, and were explicitly designed as AI-readable synthesis summaries. No student data, no source code, no API configuration, no unpublished work, and no session-specific operational state exists in this directory. The directory is the correct retrieval target because it was built to be one.

---

## 2. MCP Installation Plan

**Step 1 — Verify the current state.**
Before installing, confirm that `~/.claude/settings.json` has no existing `mcpServers` key. The file should contain only `autoUpdatesChannel` and `enabledPlugins`. If another MCP server is already configured, stop and resolve that first.

Also confirm `docs/notebooklm-exports/` contains exactly these files: `architecture-packet.md`, `pedagogy-packet.md`, `session-digest.md`, `README.md`. If additional files have appeared, review them before proceeding.

**Step 2 — Write the updated settings file.**
The `~/.claude/settings.json` file must be updated to add two new keys alongside the existing ones: `mcpServers` and `permissions`. The configuration to add is as follows.

Under `mcpServers`, add one entry named `tupana-exports`. Its `command` is `npx`. Its `args` array contains four strings in order: `-y`, `@modelcontextprotocol/server-filesystem`, and the absolute path `/Users/Victor1/Sites/tupana/docs/notebooklm-exports`. The `-y` flag suppresses npx's interactive confirmation prompt. No additional args.

Under `permissions`, add a `deny` array listing four tool identifiers: `mcp__tupana-exports__write_file`, `mcp__tupana-exports__edit_file`, `mcp__tupana-exports__create_directory`, and `mcp__tupana-exports__move_file`. These deny rules prevent Claude from invoking any write-capable tool on the connector, even though the server registers them.

**Step 3 — Verify the written configuration before launching.**
After writing the file, read it back and confirm:

- The path in `args` ends with `docs/notebooklm-exports` and nothing else
- No second path argument appears in `args`
- All four deny-tool identifiers are present and spelled correctly
- No `mcpServers` entry other than `tupana-exports` exists
- The file is valid JSON (no trailing commas, no missing braces)

**Step 4 — Start a fresh Claude Code session.**
MCP server configuration is read at session startup. Changes to `~/.claude/settings.json` do not take effect in an already-running session. After writing the configuration, start a new Claude Code session. Run `claude mcp list` in the new session to confirm `tupana-exports` appears and reports as healthy. If it does not appear or reports an error, stop and diagnose before running any retrieval queries.

**Step 5 — Confirm scope before the first query.**
In the new session, before asking any retrieval question, ask Claude to list the directories accessible via the `tupana-exports` MCP server. The response must show only `docs/notebooklm-exports`. If any other directory appears, stop the session immediately and run the rollback procedure.

---

## 3. Configuration Validation Checklist

Complete every item before running the first retrieval query.

**Directory scope**
- The path in `mcpServers.tupana-exports.args` is `/Users/Victor1/Sites/tupana/docs/notebooklm-exports` and nothing else
- No second directory argument appears in the `args` array
- The repo root (`/Users/Victor1/Sites/tupana`) does not appear anywhere in the MCP configuration
- `claude mcp list` in the new session shows `tupana-exports` as the only MCP server with a healthy status

**Inaccessible resources — verified by requesting them from Claude in the new session**
- `SYSTEM_MEMORY.md` — Claude reports it cannot access this file
- `docs/pilot/` — Claude reports it cannot access this directory
- `assets/js/ui.js` — Claude reports it cannot access this file
- `docs/talks/` — Claude reports it cannot access this directory
- `docs/current-architecture.md` — Claude reports it cannot access this file (it is outside the scoped directory)

**Write restrictions — verified by requesting a write operation**
- Ask Claude to write a test string to `docs/notebooklm-exports/README.md` — Claude must refuse this action citing the deny rule, not attempt it
- If Claude attempts the write rather than refusing it, stop immediately, run rollback, and reassess whether the deny-rule format is correct

**Single-connector confirmation**
- No Google Drive MCP, no community NotebookLM MCP, no other `mcpServers` entry exists in `~/.claude/settings.json`
- `claude mcp list` shows exactly one server

---

## 4. First Live Test Query

**Adjusted query (based on actual packet content):**

> "What is the authorship gate in Tu Pana, what stage does it occur at, and what flag must be true before revision features activate?"

The original query asked for specific function names and the exact localStorage key. The architecture-packet does not contain those details — it is intentionally orientation-level. The adjusted query matches the packet's actual granularity while still validating that bounded retrieval from a specific file returns architecturally correct information.

**Target file:** `docs/notebooklm-exports/architecture-packet.md`

**Expected retrieval behavior:**
Claude reads `architecture-packet.md` using the `read_text_file` tool (or equivalent read tool). It does not read `pedagogy-packet.md` or `session-digest.md` unless explicitly asked. It does not attempt to read outside `docs/notebooklm-exports/`. It returns a summary or excerpt describing the authorship gate.

**Expected answer boundaries:**
The response should contain: Stage 6, the concept of an unassisted first-draft requirement, the `draftSaved` flag (as named in the packet — note: without the `tupana_` prefix, which is implementation-level detail not in the packet), and the behavior that the editor is locked and revision features are gated. The response should not contain the names `executeSave` or `updateDraftControls` — those are not in the packet, and their appearance would signal either hallucination or out-of-scope retrieval.

**Acceptable variance:**
Minor rephrasing of packet language is acceptable. The packet's wording is "sets a persistent flag (`draftSaved`) that must be true before revision features activate" — a response using this language or close paraphrase is correct.

**Failure signals:**
- Response mentions `executeSave()` or `updateDraftControls()` — these are not in the packet; their presence means the model hallucinated or accessed `docs/current-architecture.md`
- Response mentions `tupana_draft_saved` with the `tupana_` prefix — not in the packet; signals the same
- Response describes the gate at a stage number other than 6
- Response includes any content from `pedagogy-packet.md` without being asked (cross-file contamination)

**Contamination signals:**
- Any reference to student voices, Freirean framing, or pedagogical philosophy — this content belongs in `pedagogy-packet.md` and should not appear in response to an architecture query
- Any reference to file paths, function signatures, or localStorage key names not present in `architecture-packet.md`
- Any claim that cannot be located in the packet by manual scan

**What constitutes hallucination:**
The model states specific implementation details (function names, exact key names with prefixes, line numbers, commit hashes) that are not present in `architecture-packet.md` and presents them as retrieved content. This is indistinguishable from confabulation of implementation knowledge. If it occurs, the retrieval must be flagged and the query logged as a failure regardless of whether the hallucinated details happen to be correct.

**What would indicate scope leakage:**
The model reads a file path containing `docs/current-architecture.md`, `SYSTEM_MEMORY.md`, `ui.js`, or anything outside `docs/notebooklm-exports/`. Claude Code's tool call display will show the exact file path accessed. If any path outside the scoped directory appears in the tool calls, stop the session and run rollback.

---

## 5. Token-Efficiency Evaluation

**The threshold statement:**
If retrieval quality degrades, MCP must be rejected even if it saves tokens. Correct, bounded retrieval at baseline token cost is preferable to degraded retrieval at lower token cost.

**What to measure:**

*Retrieval speed:* Time from submitting the query to receiving the response. Compare against the manual equivalent: opening `docs/notebooklm-exports/architecture-packet.md` in a text editor, scanning for the authorship gate section, and copying the relevant paragraph into the chat. Manual baseline is approximately 20–30 seconds and 2–3 steps. MCP retrieval should be faster and require zero manual file operations.

*Token reduction:* In a manual session, the scholar reads the packet and injects only the relevant paragraph — typically 80–120 tokens of manually selected content. With MCP, Claude reads the whole file and extracts the relevant content itself. The retrieved file is approximately 110 lines. If Claude reads the whole file to answer a narrow query, the token cost of retrieval is higher than the manual equivalent. Evaluate whether Claude uses `head` or line-range parameters to limit retrieval, or whether it reads the entire file for every query.

*Context reduction:* The workflow goal is to reduce the tokens the scholar manually constructs for a context packet. If MCP retrieval replaces a 150-token manually assembled context block with a tool call that triggers the same information, context overhead goes down. If MCP retrieval adds to a context that still requires manual assembly, it is additive, not substitutive.

*Reduction in manual copy-paste:* Track whether the scholar needed to open any file in a text editor or terminal during the session. If yes, MCP provided no friction reduction for that query.

*Preservation of architectural separation:* After the session, the one-way flow rule must still hold. No content from the retrieval has moved upstream. No packet file has been modified. `git status` shows clean state.

*Preservation of retrieval precision:* The response must be verifiable against the packet. If the response contains claims that cannot be located in the retrieved file, precision has degraded regardless of whether the response was useful.

---

## 6. Rollback Procedure

Rollback removes all MCP configuration and restores the system to its pre-installation state. It takes under two minutes.

**Step 1 — Edit `~/.claude/settings.json`.**
Remove the `mcpServers` key and its entire contents. Remove the `permissions` key and its entire contents. The file should contain only `autoUpdatesChannel` and `enabledPlugins`, exactly as it appeared before installation. Save the file.

**Step 2 — Verify removal.**
In a terminal, run `cat ~/.claude/settings.json` and confirm neither `mcpServers` nor `permissions` appears in the output.

**Step 3 — Terminate any running MCP process.**
Run `ps aux | grep server-filesystem` and check whether a node process matching `@modelcontextprotocol/server-filesystem` is running. If it is, kill it by process ID. The process should terminate automatically when Claude Code closes, but this step confirms it.

**Step 4 — Verify no persistence.**
The npx cache may retain the downloaded package at `~/.npm/_npx/`. This is not a security risk — the cached package does not run unless explicitly invoked. No cleanup is required. If the scholar prefers to remove the cache, run `npx clear-npx-cache` or manually delete the relevant subdirectory under `~/.npm/_npx/`.

**Step 5 — Confirm clean repo state.**
In the Tu Pana project directory, run `git status`. Expected output: branch is up to date, no modified files. If `docs/notebooklm-exports/` shows any changes, investigate before concluding rollback. A clean `git status` is the confirmation that no files were written during the MCP session.

**Step 6 — Confirm manual workflow integrity.**
Open `docs/notebooklm-exports/architecture-packet.md` in a text editor and locate the authorship gate section manually. If this takes substantially more effort than before MCP was introduced, or if the scholar feels the boundary-enforcement habit has degraded, note this in the evaluation log as a workflow-erosion signal.

Rollback is complete when: `~/.claude/settings.json` contains no MCP configuration, no `server-filesystem` process is running, `git status` is clean, and manual retrieval is as straightforward as before.

---

## 7. Hard Stop Conditions

Stop the sandbox session immediately if any of the following occurs. These are not judgment calls.

**File access outside `docs/notebooklm-exports/`**
If the tool call display in Claude Code shows any file path not under `/Users/Victor1/Sites/tupana/docs/notebooklm-exports/`, stop the session. Run rollback. Document the incident in the evaluation log with the exact path that was accessed.

**Recursive retrieval behavior**
If Claude uses one retrieval result to generate a second unprompted retrieval query — reading a second file without being asked — this indicates the connector is enabling autonomous behavior beyond the one-query-per-session discipline. Stop the session.

**Retrieval from outside the export packets**
If Claude reads `docs/current-architecture.md`, `docs/project-brief.md`, or any file not in `docs/notebooklm-exports/` and presents it as retrieved content, stop.

**Hallucinated architecture**
If the response contains specific function names, exact localStorage key names with `tupana_` prefix, or commit hashes not present in the retrieved packet, and these are presented as retrieved content rather than background knowledge, stop and log the retrieval as failed.

**Exposure of any forbidden document**
Any appearance of content from `SYSTEM_MEMORY.md`, `docs/pilot/`, `docs/talks/`, `docs/archive/`, any `assets/js/` file, or `config.js` in any form. Stop immediately and run rollback.

**Pressure toward broader access**
If Claude suggests adding additional directories to the MCP scope, connecting Google Drive, accessing NotebookLM directly, or expanding the connector in any way — stop. The connector is configured for evaluation under strict constraints. Scope expansion is not under consideration in this session.

**Autonomous indexing suggestions**
If Claude or the connector suggests pre-indexing content, building a search index, or caching retrieval results for future sessions — stop. This behavior contradicts the bounded, query-triggered retrieval model.

**Connector instability**
If the connector requires restart, reconfiguration, or debugging during the session, this counts as one instability event. If a second instability event occurs in the same five-session evaluation period, the connector fails the maintenance-burden criterion and must be deferred or rejected.

**Token overhead exceeding the manual workflow**
If retrieval of the authorship gate information costs more tokens than the manual equivalent (reading and selecting the relevant paragraph) in three of the first five sessions, the efficiency case for MCP retrieval at this granularity does not hold. The evaluation verdict should be Defer.

**Any attempt to blur the roles of NotebookLM and MCP**
NotebookLM is the manual synthesis layer where grounded orientation summaries are generated. The MCP connector is a retrieval layer over the already-approved output of that synthesis process. If any session behavior — in Claude's suggestions, in the retrieval workflow, or in the scholar's own habits — begins treating them as interchangeable or suggesting that MCP retrieval can substitute for NotebookLM synthesis, stop and reassert the architectural distinction before continuing.

---

## 8. Final Recommendation Threshold

The default assumption is that the manual bridge architecture is the production workflow. MCP moves from sandbox experiment to cautiously approved retrieval layer only if all of the following are true after completing the five-session evaluation.

**All five sessions completed without any hard stop condition being triggered.**
A single hard stop in any session requires reassessment before proceeding to the next session, and two hard stops across the evaluation period constitute grounds for Defer or Reject without requiring all five sessions.

**Retrieval efficiency ratio above 0.6 in at least four of five sessions.**
Tokens actually used in the working prompt divided by total tokens retrieved must exceed 0.6 in at least four sessions. If Claude is reading entire files to answer narrow queries, the ratio will be low and the efficiency case is weak.

**MCP retrieval faster than manual baseline in at least three of five sessions.**
If the scholar can manually locate and copy the relevant passage from the packet more quickly than MCP retrieval returns the result in more than two sessions, the friction reduction is not demonstrated.

**No stale retrieval in any session.**
Every retrieved claim must be verifiable against the current state of `docs/notebooklm-exports/`. If a session produces a response containing claims that are contradicted by or absent from the current packets, this indicates packet staleness or hallucination — either of which is disqualifying for that session.

**`git status` clean after every session.**
No packet file was modified in any session. This is the verification that the write-tool deny rules functioned correctly throughout the evaluation period.

**Manual retrieval habit preserved.**
After five sessions, the scholar must be able to perform manual retrieval from the packets with no more difficulty than before MCP was introduced. If the scholar finds it hard to remember which packet contains what, or feels dependent on MCP to locate information, architectural erosion is occurring and the verdict should be Defer regardless of efficiency metrics.

**The threshold is conservative by design.** A marginal result — three of five sessions showing efficiency gains, one session with a stale retrieval flag, one session where manual was faster — does not clear the bar. The manual workflow functions well. MCP is worth adopting only if it provides a clear, consistent, and safe improvement to retrieval friction without introducing any new risk or workflow complexity.

---

## Installation Status

The MCP connector was installed during this session by modifying `~/.claude/settings.json`. The settings file now contains the `mcpServers` entry for `tupana-exports` scoped to `docs/notebooklm-exports` only, and the `permissions.deny` array blocking `write_file`, `edit_file`, `create_directory`, and `move_file`.

The first live retrieval test cannot be run in the current Claude Code session because MCP server configuration is read at session startup. A fresh Claude Code session is required. At the start of that session, run `claude mcp list` to confirm the connector is healthy, verify directory scope, then submit the first test query.

This document is the operational record for Session 1 of the sandbox evaluation. Record the first test results in the token log at `~/NotebookLM-Exports/tu-pana/mcp-eval-log.md` using the template in `docs/ideas/mcp-first-sandbox-session.md §4`.
