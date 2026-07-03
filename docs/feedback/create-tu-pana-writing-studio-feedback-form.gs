/**
 * TU PANA WRITING STUDIO — Colleague Review Feedback Form Builder
 * Google Apps Script  v1.0  (2026-07-03)
 * File: docs/feedback/create-tu-pana-writing-studio-feedback-form.gs
 * Spec:  docs/feedback/tu-pana-writing-studio-feedback-form.md  (the reviewed contract —
 *        this script encodes it 1:1; if they ever disagree, the spec wins)
 *
 * ══════════════════════════════════════════════════════════════
 * HOW TO USE — one-time setup (founder runs this manually)
 * ══════════════════════════════════════════════════════════════
 * 1. Go to https://script.google.com while signed in to the Google
 *    account whose Drive should own the form.
 * 2. New project → delete the placeholder code → paste this entire file.
 * 3. Run ▶ createTuPanaWritingStudioFeedbackForm  (authorize when asked —
 *    it only needs Forms/Drive access for the account running it).
 * 4. Open View → Logs (or Executions): the script logs TWO urls —
 *      EDIT URL       — review and adjust the form here first
 *      RESPONDENT URL — the link that will eventually replace the
 *                       packet's temporary placeholder
 * 5. BRAND THE FORM (manual — the Forms API cannot set themes):
 *    open the EDIT URL → Customize theme (🎨 palette icon, top right):
 *      a. Header image → Upload → choose
 *         docs/feedback/assets/tu-pana-feedback-form-header.png
 *         (1600×400, generated from the packet's design tokens)
 *      b. Theme color → Tu Pana jade #2d7a5f (or the closest green
 *         if the picker offers no custom hex entry)
 *      c. Background → the closest warm/light option offered
 *    Goal: the form ECHOES the evaluator packet — do not attempt
 *    webpage-like styling; brevity beats decoration.
 * 6. REVIEW THE FORM BEFORE SHARING. Nothing is published, emailed, or
 *    linked anywhere by this script. The evaluator packet keeps its old
 *    placeholder link until the founder explicitly approves the new URL
 *    and a separate approved edit swaps it.
 *
 * What this script does NOT do: no credentials/secrets; no external APIs
 * beyond the standard FormApp service; no email collection; no forced
 * sign-in; no response limits that would force sign-in; no auto-sharing.
 * Running it twice creates a second, independent form (no overwrite).
 */

function createTuPanaWritingStudioFeedbackForm() {
  var form = FormApp.create('Tu Pana Writing Studio — Colleague Review Feedback');

  form.setDescription(
    'Thank you for reviewing Tu Pana Writing Studio / Tu Pana de Escritura. ' +
    'This short form takes about 3–5 minutes. Your feedback will help decide ' +
    'what to refine before broader faculty review, future pilots, and possible ' +
    'course/program adoption. Responses are anonymous unless you choose to ' +
    'share contact information at the end.'
  );

  // Anonymity defaults: no email collection, no sign-in requirement.
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false); // true would force Google sign-in
  try {
    form.setRequireLogin(false); // only meaningful on Workspace domains; harmless elsewhere
  } catch (e) {
    // Consumer accounts don't support this setting; the default is already "no sign-in".
  }

  form.setConfirmationMessage(
    'Thank you for reviewing Tu Pana Writing Studio. Your feedback will help ' +
    'shape the next version of the studio, the next pilot steps, and the ' +
    'faculty-facing materials.'
  );

  // ── Q1 · role (required multiple choice; simple opener) ──
  form.addMultipleChoiceItem()
    .setTitle('What best describes your role?')
    .setChoiceValues([
      'Faculty instructor',
      'Writing / WAC / WID program staff',
      'Department chair or program director',
      'Administrator',
      'Educational technology / instructional design staff',
      'Student support / tutoring / learning center staff'
    ])
    .showOtherOption(true)
    .setRequired(true);

  // ── Q2 · what was reviewed (required checkboxes) ──
  form.addCheckboxItem()
    .setTitle('What did you review?')
    .setChoiceValues([
      'Evaluator packet only',
      'Review-mode selector',
      'Autobiographical Mixed-Genre Essay pathway',
      'Service-Learning Report pathway',
      'Research Paper pathway',
      'STEM Lab Report pathway',
      'I have not opened the app yet'
    ])
    .setRequired(true);

  // ── Q3 · clarity of purpose (required 1–5 scale) ──
  addScale_(form,
    "After reviewing the packet/app, how clear is Tu Pana Writing Studio's purpose?",
    'Not clear yet', 'Very clear');

  // ── Q4 · problem relevance (required 1–5 scale) ──
  addScale_(form,
    'How relevant is the problem Tu Pana addresses to your own context?',
    'Not relevant to my context', 'Highly relevant');

  // ── Q5 · most valuable parts (required checkboxes, capped at 3) ──
  form.addCheckboxItem()
    .setTitle('Which parts of Tu Pana feel most valuable?')
    .setHelpText('Select up to 3.')
    .setChoiceValues([
      'Authorship gate — students must draft before AI feedback',
      'Process evidence and AI-use transparency',
      'Bilingual English/Spanish access',
      'Respect for student voice and code-switching',
      'Genre-specific writing pathways',
      'Support for first-generation/multilingual students',
      'Faculty-facing review controls and assignment-specific links'
    ])
    .showOtherOption(true)
    .setValidation(
      FormApp.createCheckboxValidation()
        .requireSelectAtMost(3)
        .build()
    )
    .setRequired(true);

  // ── Q6 · trust vs incumbents (required 1–5 scale) ──
  addScale_(form,
    'How much would you trust this approach compared with generic AI writing tools or AI detectors?',
    'I would not trust it yet', 'I would trust it for a pilot');

  // ── Q7 · where it could fit (required checkboxes) ──
  form.addCheckboxItem()
    .setTitle('Where could you imagine Tu Pana fitting?')
    .setChoiceValues([
      'One assignment in one course',
      'Multiple assignments in one course',
      'First-year writing or writing-intensive course',
      'WAC/WID initiative',
      'Service-learning / community-engaged course',
      'Research paper support',
      'STEM lab/report writing',
      'Tutoring or writing center support',
      'Not sure yet'
    ])
    .setRequired(true);

  // ── Q8 · most important improvement (the ONLY required open question) ──
  form.addParagraphTextItem()
    .setTitle('What is the most important thing to improve before broader faculty review or adoption?')
    .setHelpText('One sentence is plenty.')
    .setRequired(true);

  // ── Q9 · strongest/most promising (optional paragraph) ──
  form.addParagraphTextItem()
    .setTitle('What felt strongest or most promising?')
    .setRequired(false);

  // ── Q10 · follow-up interest (required multiple choice) ──
  form.addMultipleChoiceItem()
    .setTitle('Would you be open to a follow-up conversation or pilot discussion?')
    .setChoiceValues([
      'Yes — I would like to discuss a possible course pilot',
      'Yes — I would like to share feedback but not pilot yet',
      'Maybe later',
      'No, not at this time'
    ])
    .setRequired(true);

  // ── Q11–Q12 · strictly optional contact (preserves anonymity default) ──
  form.addTextItem()
    .setTitle("Optional — your name and email, only if you'd welcome follow-up")
    .setRequired(false);

  form.addTextItem()
    .setTitle('Optional — your course, program, or institutional context')
    .setRequired(false);

  // ── Output: the two URLs the founder needs. Nothing is shared/published. ──
  Logger.log('EDIT URL (review the form here first): ' + form.getEditUrl());
  Logger.log('RESPONDENT URL (goes into the packet ONLY after founder approval): ' + form.getPublishedUrl());
  return form;
}

/** Adds a required 1–5 linear scale with endpoint labels (per spec: endpoints only). */
function addScale_(form, title, lowLabel, highLabel) {
  form.addScaleItem()
    .setTitle(title)
    .setBounds(1, 5)
    .setLabels(lowLabel, highLabel)
    .setRequired(true);
}
