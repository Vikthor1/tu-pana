# Student Usability-Testing Protocol — Tu Pana Writing Studio

**Deliverable 22 · For use AFTER founder approval of a future-state direction, on preview builds only.**

## Ground rules (non-negotiable)

- **No real student data enters the audit plane.** Participants write on provided neutral
  prompts or bring text they explicitly consent to use for testing; nothing is retained after
  the session; the browser profile is cleared in front of the participant.
- **Consent + minors.** Written consent; if any participant is under 18, founder resolves the
  AI-provider eligibility question FIRST (the Sprint-1 Gemini under-18 constraint applies to
  testing too, not just release). Default: use mock-AI mode for minors.
- **No instructor-power dynamics.** If participants are the founder's own students, testing must
  be outside graded context, explicitly optional, and never linked to course standing (mirrors
  the Pilot 1↔2 consent lessons).
- **Observer discipline.** The facilitator may not explain the interface. Every explanation a
  facilitator is tempted to give is a finding.

## Participants

- 5–8 per round (research saturation for usability); at least: 2 first-language-Spanish
  students, 2 mobile-primary users, 1 student with a screen reader or OS accessibility features
  enabled, and no more than 2 who have used Tu Pana before.
- Rounds are per-genre-family: (R1) default essay, (R2) admissions/SOP, (R3) CAP 200 + STEM.
  A direction must pass R1 before R2/R3 spend participant time.

## Method

Think-aloud, task-based, single 45–60 min session per participant, screen+voice recorded
locally with consent (recordings deleted after coding; only anonymized codes retained).
Facilitator uses the script; a second observer codes in real time against the ten questions.

### Task script (core — all rounds)

| # | Task (what we say) | What we measure |
|---|---|---|
| T1 | "Open this link and start working." | Time + taps to first typed word; onboarding drop-off; whether they can say what the app is for. |
| T2 | "Write a few sentences, then close the tab. Reopen it." | Do they trust it saved? Can they say where their work went? (P4/P5) |
| T3 | "Move to the next step, then go back to what you wrote first." | Nav vocabulary comprehension; back-path discovery; stranded-work check. |
| T4 | "You brought a draft from home — put it in." | Paste path; carry-forward comprehension; overwrite fear ("did I lose anything?"). |
| T5 | "Ask the coach for help with your opening." | Coach discoverability; disclosure comprehension ("what just got sent?"); acting on/rejecting advice. |
| T6 | "Get a full review of your draft. Then get a second opinion." | Chooser comprehension; Council vs lens distinction; re-entry without back-navigation. |
| T7 | "Decide what to do with one suggestion, then find that decision again later." | Decision grammar; decision persistence/legibility. |
| T8 | "Your work is done — hand it in the way your instructor asked." | Finish-surface timing; Process Note comprehension; export success. |
| T9 | "Switch the app to the language you prefer." | Preference discovery; coverage; whether both-languages mode was read or skimmed. |
| T10 | (Mobile participants) T1–T8 on their own phone. | Keyboard/editor behavior; touch targets; completion parity. |

### Ten-question probe

At three fixed moments (after T2, T6, T8) the facilitator asks the participant to answer,
unaided, as many of the founder's ten questions as apply. Score each 0 (couldn't), 1 (hesitant/
partially wrong), 2 (immediate and correct).

## Metrics + pass bar

- **Task success** (unaided completion): direction passes when ≥80% of participants complete
  T1–T8 unaided.
- **Ten-question score:** median ≥ 1.7 at all three probes; any question with median ≤1 is an
  automatic finding at P1/P2.
- **Trust probes:** T2 "is your work saved?" must reach 100% confident-yes by round exit.
- **Facilitator-explanation count:** target 0; each instance logged as a finding with the screen
  it occurred on.
- **Time-to-first-word** (T1): median ≤ 3 minutes including onboarding.

## Coding + output

Findings coded {task, screen, question-failed, severity, verbatim quote}; fed into the same
issue register schema as this audit (`issue-register.md`), tagged `source: student-test-R<n>`.
Each round produces a go/iterate memo. **No round result self-approves anything** — rounds
inform the founder's release decision; the founder lived-experience gate remains separate and
final.
