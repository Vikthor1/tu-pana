# Writing Studio UX Exploration — founder review guide

**Window:** `writing-studio-ux-2026-08`  
**Fourth-prototype checkpoint:** `e8678738dfab6ef42992fc0c16aee1c46a87680c`
**Status:** local comparative prototypes; no concept selected; no production implementation

## Run locally

From this worktree:

```bash
cd /Users/Victor1/Sites/tupana-writing-studio-exploration
python3 -m http.server 3001 --bind 127.0.0.1
```

Open <http://127.0.0.1:3001/explore.html>.

The comparison hub links all four concepts. The switcher at the top of every prototype makes
cross-concept movement one action. Each concept has one separate local-storage record:

```text
tupana-explore:writing-studio-ux-2026-08:desk:v1
tupana-explore:writing-studio-ux-2026-08:journey:v1
tupana-explore:writing-studio-ux-2026-08:hybrid:v1
tupana-explore:writing-studio-ux-2026-08:notebook:v1
```

The prototype does not enumerate, import, or read R0 `tupana_*` storage. Settings → Danger Zone
can export or delete only the active concept's synthetic record. Do not paste real coursework.

## Direct entry points

- [Comparison hub](../../../explore.html)
- [Draft-centered Desk](../../../explore.html?concept=desk)
- [Clarified staged journey](../../../explore.html?concept=journey)
- [Simplified hybrid](../../../explore.html?concept=hybrid)
- [Cuaderno y Borrador · Notebook & Draft](../../../explore.html?concept=notebook)

When served locally, use the corresponding `http://127.0.0.1:3001/explore.html?...` URL.

## Founder comparison journey

Use a fresh concept or delete only that concept's data in Settings → Danger Zone before each
walk. Use the same synthetic text and assignment genre in all four.

1. Start with synthetic writing. In Notebook & Draft, begin with prewriting; in the other concepts,
   begin with the canonical editor or active artifact.
2. Paste synthetic writing and inspect the boundary warning. In Notebook & Draft, paste into one
   notebook card and verify that it is preparation, not a draft.
3. Add a distinctive synthetic sentence, leave for the comparison hub, return, and verify it.
4. Find the earlier artifact, version, review, or decision without using browser history.
5. Move forward and backward. In Notebook & Draft, choose **Write my draft** and verify that the
   canonical draft starts exactly empty while notebook material remains visible and recoverable.
6. On a phone, select a passage near the bottom of a long synthetic draft. Open the app-owned
   passage action without scrolling upward; compare selected passage, paragraph, and full draft;
   verify the exact preview; cancel; repeat and consent to mock coaching.
7. Request a focused review and identify what text and lens the mock reviewer received.
8. Convene the mock Council, return to writing, then revisit the saved Council report.
9. Accept, adapt, reject, or defer one suggestion. Verify that the decision is recorded without
   any automatic rewrite of the draft.
10. Complete the three required reflection prompts; leave the optional fourth blank; save and
    return once.
11. Open Finish, distinguish Save / Finish / Create packet / Backup / external Submit, confirm the
    exact included draft, and create the local packet. Compare student reflection with the separate
    instructor evidence appendix.

At three points—after return, after Council, and after Finish—ask the student to answer without
help: Where am I? What am I doing? What happens next? What will this button do? Was my work saved?
Where is earlier work? How do I go back? How do I revisit review? What did AI contribute? What
decisions remain mine?

## Evidence and results

- [Comparative evaluation](comparative-evaluation.md)
- [Append-only evidence checkpoints](evidence-checkpoints.md)
- [Verification results](verification-results.md)

Claude/Fable's independent package at
`/Users/Victor1/.codex/attachments/255c2074-8e12-4b1d-8074-be509c56aa65/pasted-text.txt`
is treated as design evidence only. Its Notebook recommendation is not a product decision. This
prototype uses the bounded exploration assumption that a pre-draft mock coach may discuss only
ideas already present in an explicitly previewed notebook-card payload and ask questions; it may
not generate draft prose, create a draft, or transfer notebook text. Draft review unlocks only after
the student creates the draft. This assumption is reversible and requires student evidence.

## Boundaries still open

- No physical-iPhone validation has occurred. Viewport emulation does not close the P1.
- No VoiceOver, NVDA, Safari/iOS keyboard, device-switch, or Brightspace exercise has occurred.
- No founder or representative-student comparison evidence has been gathered yet.
- Mock AI is deterministic and local. It does not validate live-model tone, latency, or failure.
- Prototype storage is intentionally disposable and is not a migration implementation.
- Whether Notebook and Draft are distinguishable without facilitation, whether **Write my draft**
  is meaningful or obstructive, and whether optional cards recreate a treadmill remain open.
- Claude/Fable's equal-prominence bilingual recommendation is not adopted as doctrine. The current
  Spanish-primary coherent-density standard remains in the prototype; this disagreement is open.
- No deployment, family preview, Worker call, push, merge, production change, or VC-OS change was
  made.
