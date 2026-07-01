/**
 * TU PANA DE ESCRITURA — CAP 200 PILOT 2 Survey Builder
 * Google Apps Script  v1.0  (2026-07-01)
 * File: docs/pilot/cap200-pilot-2-survey-builder.gs
 *
 * Adapted from docs/pilot/survey-builder.gs (Pilot 1, v1.0). Same engine,
 * same personalized-code workflow — CAP 200 service-learning items added.
 * Pilot 1 stays intact; this builds SEPARATE Pilot 2 forms.
 *
 * ══════════════════════════════════════════════════════════════
 * HOW TO USE — one-time setup
 * ══════════════════════════════════════════════════════════════
 * 1. Create a NEW Google Sheet — the Pilot 2 data workbook.
 *    (e.g. "Tu Pana Pilot 2 Data — CAP 200")  ← use a NEW sheet, not the Pilot 1 one,
 *    so Pilot 1 and Pilot 2 forms/codes/responses never mix.
 * 2. In that sheet: Extensions → Apps Script.
 * 3. Delete the placeholder code, paste this entire file, then File → Save.
 * 4. Close the editor and RELOAD the Google Sheet.
 *    A "Tu Pana CAP 200 Pilot 2" menu appears.
 * 5. Click  Tu Pana CAP 200 Pilot 2 → Build Pre + Post Surveys.
 * 6. Authorize when asked (create Forms + write Sheets only).
 * 7. Wait ~20–30 s for the confirmation dialog.
 *
 * ══════════════════════════════════════════════════════════════
 * WHAT GETS CREATED
 * ══════════════════════════════════════════════════════════════
 * In Google Drive:
 *   • "Tu Pana CAP 200 Pilot 2 — Pre-Use Survey · Encuesta Inicial"  (Form)
 *   • "Tu Pana CAP 200 Pilot 2 — Post-Use Survey · Encuesta Final"   (Form)
 * In the Spreadsheet:
 *   • "Distribution" sheet — Code | Pre-Survey URL | Post-Survey URL | Pre Submitted? | Post Submitted?
 *   • "Form Links" sheet   — edit/published URLs (your records)
 *   • Response sheets       — auto-created when students submit
 *
 * ══════════════════════════════════════════════════════════════
 * WHAT THE INSTRUCTOR SHOULD VERIFY (menu → Verify Setup)
 * ══════════════════════════════════════════════════════════════
 *   • Distribution sheet has one row per student, each with both URLs.
 *   • Open a Pre-Survey URL in an INCOGNITO window → the Participant Code
 *     (e.g. TPN2-001) is pre-filled; the student types nothing for it.
 *   • Submit a test response; confirm it lands in the response sheet; delete it
 *     before distributing.
 *
 * ══════════════════════════════════════════════════════════════
 * DISTRIBUTION
 * ══════════════════════════════════════════════════════════════
 *   • Send each student their unique Pre-Survey URL (before they open Tu Pana)
 *     and Post-Survey URL (after a meaningful session / the assigned draft).
 *   • The participant code arrives PRE-FILLED — students never type a code or a
 *     student ID. Do NOT share the Distribution sheet with students.
 *   • Alongside the survey links, post the CAP 200 app link (see CAP200_DEEP_LINK)
 *     using docs/cap200-brightspace-rollout-packet.md wording.
 *
 * ══════════════════════════════════════════════════════════════
 * RERUN BEHAVIOR
 * ══════════════════════════════════════════════════════════════
 *   • Re-running warns before deleting the Distribution / Form Links sheets, then
 *     creates NEW forms with NEW code URLs (same guard as Pilot 1). It does NOT
 *     delete forms already created in Drive — re-running leaves the old forms
 *     orphaned in Drive; trash them manually if you re-run. Only re-run to start
 *     fresh for a new class/section.
 *
 * ══════════════════════════════════════════════════════════════
 * SCOPE / ETHICS
 * ══════════════════════════════════════════════════════════════
 *   • For CLASSROOM IMPROVEMENT and pilot refinement — not formal research
 *     unless IRB review is handled separately.
 *   • Data is CODED / DE-IDENTIFIED, not anonymous: the code→student mapping
 *     exists only in how you distribute links. Do not promise anonymity.
 *   • No name/email/student-ID is collected (email collection stays OFF).
 *
 * ══════════════════════════════════════════════════════════════
 * ITEM SET (from docs/cap200-pilot-2-survey-packet.md)
 * ══════════════════════════════════════════════════════════════
 *   PRE : CODE · A1–A3 (carryover) · B1–B5 (carryover, paired) · C1–C4 (carryover,
 *         paired; C2 reverse) · F1–F5 (new CAP 200 readiness; F4 reverse)
 *   POST: CODE · B1–B5 · C1–C4 (paired) · D1–D5 (carryover experience) ·
 *         G1–G7,G11 (new CAP scale) · G10 (new, cut-off multiple-choice) ·
 *         E1–E3 (carryover reflection) · E4 (new: what confused)
 *   OMITTED optional items (documented, kept out to keep the forms practical):
 *     • F6 (expected-help checkbox) — nice-to-have baseline; add back if wanted.
 *     • G8 (revision-without-writing) — overlaps D1; add back for CAP emphasis.
 *     • G9 (voice/authorship kept)   — overlaps C4/D1; add back for CAP emphasis.
 *   REVERSE-SCORED: C2 and F4 (a pre→post decrease is a positive signal).
 */


// ═══════════════════════════════════════════════════════════════
// CONFIGURATION  — edit here before running
// ═══════════════════════════════════════════════════════════════
var CONFIG = {
  PILOT_NAME       : 'CAP 200 Pilot 2',
  NUM_CODES        : 30,            // DEFAULT_STUDENT_COUNT — number of unique participant codes
  CODE_PREFIX      : 'TPN2',        // Pilot-2 prefix → TPN2-001, TPN2-002, … (see note below)
  DIST_SHEET       : 'Distribution',
  LINKS_SHEET      : 'Form Links',
  COLLECT_EMAIL    : false,         // keep OFF — no email/identity capture
  CAP200_DEEP_LINK : 'https://vikthor1.github.io/tu-pana/?assignment=cap200-bronx-beautiful-service-learning',
  PRE_TITLE        : 'Tu Pana CAP 200 Pilot 2 — Pre-Use Survey · Encuesta Inicial',
  POST_TITLE       : 'Tu Pana CAP 200 Pilot 2 — Post-Use Survey · Encuesta Final',
};
// CODE_PREFIX NOTE: Pilot 2 uses 'TPN2' (not Pilot 1's 'TPN'). The builder matches
// pre/post by the exact code string within THIS workbook, so the prefix is free to
// change without breaking pairing. 'TPN2' makes a code's pilot unambiguous if Pilot 1
// and Pilot 2 data are ever merged, and prevents any TPN-001 vs TPN-001 collision.
// Continuity is preserved by keeping the same TPN-### FORMAT and the identical workflow.


// ═══════════════════════════════════════════════════════════════
// CONSENT PREAMBLE  — preserved verbatim from Pilot 1 (class-agnostic)
// ═══════════════════════════════════════════════════════════════
var CONSENT =
  'Consent to Participate in Research · Consentimiento para participar en investigación\n\n' +
  'This survey is part of a study on Tu Pana de Escritura, an AI writing coach for multilingual ' +
  'college students. Your participation is voluntary and will not affect your course grade. ' +
  'This survey does not collect your name, student ID, or email address. A participant code ' +
  'links your before-and-after responses for analysis; your name is not recorded in the survey data. ' +
  'Data may be used in academic research and presentations without identifying you. ' +
  'By completing and submitting this form, you consent to participate.\n\n' +
  'Esta encuesta forma parte de un estudio sobre Tu Pana de Escritura, una herramienta de ' +
  'escritura con IA para estudiantes universitarios multilingües. Tu participación es voluntaria ' +
  'y no afectará tu calificación. Esta encuesta no recoge tu nombre, número de estudiante ni ' +
  'correo electrónico. Un código de participante vincula tus respuestas antes y después con ' +
  'fines de análisis; tu nombre no queda registrado en los datos de la encuesta. ' +
  'Los datos pueden usarse en investigaciones y presentaciones académicas sin identificarte. ' +
  'Al completar y enviar este formulario, consientes participar.';

var SCALE_LOW  = 'Strongly Disagree · Muy en desacuerdo';
var SCALE_HIGH = 'Strongly Agree · Muy de acuerdo';
var SCALE_HELP =
  'Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).\n' +
  'Califica del 1 (Muy en desacuerdo) al 5 (Muy de acuerdo).';


// ═══════════════════════════════════════════════════════════════
// MENU
// ═══════════════════════════════════════════════════════════════
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tu Pana CAP 200 Pilot 2')
    .addItem('Build Pre + Post Surveys', 'buildSurveys')
    .addSeparator()
    .addItem('Verify Setup', 'verifySurveySetup')
    .addToUi();
}


// ═══════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════
function buildSurveys() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Guard against accidental re-run (same as Pilot 1). Re-running deletes the
  // Distribution sheet (incl. manual tracking in D/E) and creates new forms.
  var existingDist  = ss.getSheetByName(CONFIG.DIST_SHEET);
  var existingLinks = ss.getSheetByName(CONFIG.LINKS_SHEET);
  if (existingDist || existingLinks) {
    var proceed = ui.alert(
      '⚠️  Surveys already built',
      'The "' + CONFIG.DIST_SHEET + '" or "' + CONFIG.LINKS_SHEET + '" sheet already exists.\n\n' +
      'Running this script AGAIN will:\n' +
      '  • DELETE those sheets (including any manual tracking data)\n' +
      '  • CREATE new Google Forms with new participant code URLs\n' +
      '  • Leave the previous forms orphaned in Drive (trash them manually)\n\n' +
      'Only do this to start fresh for a new class/section.\n\n' +
      'Are you sure you want to continue?',
      ui.ButtonSet.YES_NO
    );
    if (proceed !== ui.Button.YES) {
      ui.alert('Cancelled — no changes made.');
      return;
    }
  }

  ui.alert(
    'Building ' + CONFIG.PILOT_NAME + ' surveys…\n\n' +
    'This takes about 20–30 seconds. Click OK and wait for the completion message.'
  );

  var pre  = buildPreSurvey_(ss);
  var post = buildPostSurvey_(ss);
  buildDistributionSheet_(ss, pre, post);
  buildLinksSheet_(ss, pre.form, post.form);

  ui.alert(
    '✓ Done — ' + CONFIG.PILOT_NAME + '!\n\n' +
    '• "Distribution" sheet → participant codes and URLs\n' +
    '• "Form Links" sheet  → edit links for both forms\n' +
    '• Both forms are now in your Google Drive\n\n' +
    'Distribute one row per student privately.\n' +
    'Also post the CAP 200 app link (see CAP200_DEEP_LINK) with the rollout wording.\n' +
    'Do not share the Distribution sheet with students.'
  );
}


// ═══════════════════════════════════════════════════════════════
// PRE-SURVEY
// ═══════════════════════════════════════════════════════════════
function buildPreSurvey_(ss) {
  var form = FormApp.create(CONFIG.PRE_TITLE);
  configureForm_(form, ss);
  form.setConfirmationMessage(
    'Thank you — your response has been recorded. · Gracias, tu respuesta ha sido guardada.'
  );

  // ── Participant Code ──────────────────────────────────────────────────────
  var codeItem = form.addTextItem()
    .setTitle('Participant Code · Código de participante')
    .setHelpText(
      'This code was assigned automatically. Do not change it.\n' +
      'Este código fue asignado automáticamente. No lo cambies.'
    )
    .setRequired(true);

  // ── Part A — About You as a Writer (carryover) ────────────────────────────
  form.addPageBreakItem()
    .setTitle('Part A — About You as a Writer · Sobre ti como escritor/a');

  form.addCheckboxItem()
    .setTitle(
      'A1. Which language(s) do you feel most comfortable writing in? ' +
      '(Select all that apply)\n' +
      '¿En qué idioma(s) te sientes más cómodo/a escribiendo? ' +
      '(Selecciona todas las que apliquen)'
    )
    .setChoiceValues([
      'English / Inglés',
      'Spanish / Español',
      'Both equally / Ambos por igual'
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(
      'A2. Before this course, how many multi-page essays or reports have you written ' +
      'in English for a college class?\n' +
      'Antes de este curso, ¿cuántos ensayos o reportes de varias páginas has escrito ' +
      'en inglés para una clase universitaria?'
    )
    .setChoiceValues([
      'None / Ninguno',
      '1–2',
      '3–5',
      'More than 5 / Más de 5'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle(
      'A3. Before using Tu Pana, have you used AI tools to help with writing? ' +
      '(e.g., ChatGPT, Grammarly, Copilot)\n' +
      'Antes de usar Tu Pana, ¿has usado herramientas de IA para ayudarte a ' +
      'escribir? (ej: ChatGPT, Grammarly, Copilot)'
    )
    .setChoiceValues([
      'Never / Nunca',
      'Once or twice / Una o dos veces',
      'Sometimes / A veces',
      'Often / Con frecuencia'
    ])
    .setRequired(true);

  // ── Part B — Writing Confidence (carryover, paired) ───────────────────────
  form.addPageBreakItem()
    .setTitle('Part B — Writing Confidence · Confianza para escribir')
    .setHelpText(SCALE_HELP);

  addScaleItems_(form, [
    'B1. I feel confident expressing my ideas in writing.\n' +
      'Me siento seguro/a expresando mis ideas por escrito.',
    'B2. I can organize my thoughts into a clear written structure.\n' +
      'Puedo organizar mis ideas en una estructura escrita clara.',
    'B3. I can write from my own experience in a way that makes a real argument.\n' +
      'Puedo escribir desde mi propia experiencia de forma que construya un argumento real.',
    'B4. When I get stuck while writing, I can find a way to keep going.\n' +
      'Cuando me quedo atascado/a al escribir, puedo encontrar la manera de seguir.',
    'B5. I feel comfortable writing in a mix of languages.\n' +
      'Me siento cómodo/a escribiendo en una mezcla de idiomas.'
  ]);

  // ── Part C — AI and Writing (carryover, paired; C2 reverse-scored) ────────
  form.addPageBreakItem()
    .setTitle('Part C — AI and Writing · La IA y la escritura')
    .setHelpText(SCALE_HELP);

  addScaleItems_(form, [
    'C1. AI tools can help me become a better writer.\n' +
      'Las herramientas de IA pueden ayudarme a convertirme en mejor escritor/a.',
    'C2. I worry that using AI will make my writing less my own.\n' +
      'Me preocupa que usar IA haga que mi escritura sea menos mía.',
    'C3. I can tell when AI advice is useful and when it isn\'t.\n' +
      'Puedo distinguir cuándo un consejo de IA es útil y cuándo no lo es.',
    'C4. I feel in control of my own writing even when I use AI tools.\n' +
      'Me siento en control de mi propia escritura incluso cuando uso IA.'
  ]);

  // ── Part F — CAP 200 Readiness (NEW; F4 reverse-scored) ───────────────────
  form.addPageBreakItem()
    .setTitle('Part F — CAP 200 Readiness · Preparación para CAP 200')
    .setHelpText(SCALE_HELP);

  addScaleItems_(form, [
    'F1. I feel ready to start my CAP 200 Service-Learning Report.\n' +
      'Me siento listo/a para empezar mi Reporte de Aprendizaje-Servicio de CAP 200.',
    'F2. I understand what the CAP 200 assignment is asking me to do.\n' +
      'Entiendo lo que la tarea de CAP 200 me pide hacer.',
    'F3. I feel confident I can connect my CBO/service, my data/evidence, and my ' +
      'course concepts in one report.\n' +
      'Me siento seguro/a de poder conectar mi CBO/servicio, mis datos/evidencia y ' +
      'los conceptos del curso en un solo reporte.',
    'F4. I feel anxious about writing this report. (reverse-scored)\n' +
      'Me siento ansioso/a por escribir este reporte.',
    'F5. I can reliably use Tu Pana on a device and browser I use for schoolwork.\n' +
      'Puedo usar Tu Pana de forma confiable en un dispositivo y navegador que uso para la escuela.'
  ]);

  return { form: form, codeItem: codeItem };
}


// ═══════════════════════════════════════════════════════════════
// POST-SURVEY
// ═══════════════════════════════════════════════════════════════
function buildPostSurvey_(ss) {
  var form = FormApp.create(CONFIG.POST_TITLE);
  configureForm_(form, ss);
  form.setConfirmationMessage(
    'Thank you — your response has been recorded. · Gracias, tu respuesta ha sido guardada.'
  );

  // ── Participant Code ──────────────────────────────────────────────────────
  var codeItem = form.addTextItem()
    .setTitle('Participant Code · Código de participante')
    .setHelpText(
      'This code matches your pre-survey code. Do not change it.\n' +
      'Este código coincide con tu encuesta inicial. No lo cambies.'
    )
    .setRequired(true);

  // ── Part B — Writing Confidence (identical to pre-survey — paired) ────────
  form.addPageBreakItem()
    .setTitle('Part B — Writing Confidence · Confianza para escribir')
    .setHelpText(SCALE_HELP);

  addScaleItems_(form, [
    'B1. I feel confident expressing my ideas in writing.\n' +
      'Me siento seguro/a expresando mis ideas por escrito.',
    'B2. I can organize my thoughts into a clear written structure.\n' +
      'Puedo organizar mis ideas en una estructura escrita clara.',
    'B3. I can write from my own experience in a way that makes a real argument.\n' +
      'Puedo escribir desde mi propia experiencia de forma que construya un argumento real.',
    'B4. When I get stuck while writing, I can find a way to keep going.\n' +
      'Cuando me quedo atascado/a al escribir, puedo encontrar la manera de seguir.',
    'B5. I feel comfortable writing in a mix of languages.\n' +
      'Me siento cómodo/a escribiendo en una mezcla de idiomas.'
  ]);

  // ── Part C — AI and Writing (identical to pre-survey — paired) ────────────
  form.addPageBreakItem()
    .setTitle('Part C — AI and Writing · La IA y la escritura')
    .setHelpText(SCALE_HELP);

  addScaleItems_(form, [
    'C1. AI tools can help me become a better writer.\n' +
      'Las herramientas de IA pueden ayudarme a convertirme en mejor escritor/a.',
    'C2. I worry that using AI will make my writing less my own.\n' +
      'Me preocupa que usar IA haga que mi escritura sea menos mía.',
    'C3. I can tell when AI advice is useful and when it isn\'t.\n' +
      'Puedo distinguir cuándo un consejo de IA es útil y cuándo no lo es.',
    'C4. I feel in control of my own writing even when I use AI tools.\n' +
      'Me siento en control de mi propia escritura incluso cuando uso IA.'
  ]);

  // ── Part D — Your Experience with Tu Pana (carryover) ─────────────────────
  form.addPageBreakItem()
    .setTitle('Part D — Your Experience with Tu Pana · Tu experiencia con Tu Pana')
    .setHelpText(SCALE_HELP);

  addScaleItems_(form, [
    'D1. Tu Pana helped me do my own writing rather than doing it for me.\n' +
      'Tu Pana me ayudó a realizar mi propio trabajo escrito, no lo escribió por mí.',
    'D2. The step-by-step structure helped me develop my ideas.\n' +
      'La estructura paso a paso me ayudó a desarrollar mis ideas.',
    'D3. I could communicate with Tu Pana in my preferred language.\n' +
      'Pude comunicarme con Tu Pana en el idioma que prefiero.',
    'D4. Tu Pana\'s feedback helped me make my own decisions about my writing.\n' +
      'Los comentarios de Tu Pana me ayudaron a tomar mis propias decisiones sobre mi escritura.',
    'D5. I would use Tu Pana again for a future writing assignment.\n' +
      'Usaría Tu Pana de nuevo para una futura tarea de escritura.'
  ]);

  // ── Part G — CAP 200 Service-Learning Experience (NEW) ────────────────────
  form.addPageBreakItem()
    .setTitle('Part G — CAP 200 Service-Learning Experience · Experiencia de Aprendizaje-Servicio')
    .setHelpText(SCALE_HELP);

  addScaleItems_(form, [
    'G1. Tu Pana helped me understand what to do next at each step.\n' +
      'Tu Pana me ayudó a entender qué hacer a continuación en cada paso.',
    'G2. The CAP 200 step names, prompts, and the writing box made sense to me.\n' +
      'Los nombres de los pasos de CAP 200, las indicaciones y el cuadro de escritura tuvieron sentido para mí.',
    'G3. Tu Pana helped me understand the CBO / community issue / service framing of the project.\n' +
      'Tu Pana me ayudó a entender el enfoque de CBO / problema comunitario / servicio del proyecto.',
    'G4. Tu Pana helped me connect my service experience to course concepts.\n' +
      'Tu Pana me ayudó a conectar mi experiencia de servicio con los conceptos del curso.',
    'G5. Tu Pana helped me plan or think through my evidence/data ' +
      '(hours, journals, interviews, surveys, or observations).\n' +
      'Tu Pana me ayudó a planear o pensar mi evidencia/datos ' +
      '(horas, diarios, entrevistas, encuestas u observaciones).',
    'G6. The report structure (introduction, methodology, results, discussion, conclusion) made sense to me.\n' +
      'La estructura del reporte (introducción, metodología, resultados, discusión, conclusión) tuvo sentido para mí.',
    'G7. It was clear that at the First Draft step I write the draft myself, without the coach.\n' +
      'Quedó claro que en el paso del Primer Borrador yo escribo el borrador, sin el coach.',
    'G11. Tu Pana worked well on the device I used (phone or computer).\n' +
      'Tu Pana funcionó bien en el dispositivo que usé (teléfono o computadora).'
  ]);

  // G10 — cut-off monitor (multiple choice, NOT a 1–5 scale)
  form.addMultipleChoiceItem()
    .setTitle(
      'G10. Did a coach reply ever get cut off or stop in the middle — ' +
      'especially at the Revision step?\n' +
      '¿Alguna respuesta del coach se cortó o se detuvo a la mitad — ' +
      'especialmente en el paso de Revisión?'
    )
    .setChoiceValues([
      'Never / Nunca',
      'Once / Una vez',
      'A few times / Algunas veces',
      'Often / Con frecuencia'
    ])
    .setRequired(true);

  // ── Part E — Reflection (carryover E1–E3 + new E4) ────────────────────────
  form.addPageBreakItem()
    .setTitle('Part E — Reflection · Reflexión')
    .setHelpText(
      'Answer in English, Spanish, or both — whatever feels most natural.\n' +
      'Responde en inglés, español, o ambos — lo que se sienta más natural.'
    );

  form.addParagraphTextItem()
    .setTitle(
      'E1. What was the most useful thing Tu Pana did for your writing?\n' +
      '¿Qué fue lo más útil que hizo Tu Pana para tu escritura?'
    )
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle(
      'E2. What would you change or improve about Tu Pana?\n' +
      '¿Qué cambiarías o mejorarías de Tu Pana?'
    )
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle(
      'E3. At the end of this process, do you feel the writing you completed is ' +
      'truly your own work? Why or why not?\n' +
      'Al final de este proceso, ¿sientes que el trabajo escrito que completaste es ' +
      'realmente tuyo? ¿Por qué sí o por qué no?'
    )
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle(
      'E4. What confused you, if anything, while using Tu Pana for this CAP 200 project?\n' +
      '¿Qué te confundió, si algo, al usar Tu Pana para este proyecto de CAP 200?'
    )
    .setRequired(false);

  return { form: form, codeItem: codeItem };
}


// ═══════════════════════════════════════════════════════════════
// DISTRIBUTION SHEET
// ═══════════════════════════════════════════════════════════════
function buildDistributionSheet_(ss, pre, post) {
  var existing = ss.getSheetByName(CONFIG.DIST_SHEET);
  if (existing) ss.deleteSheet(existing);
  var sheet = ss.insertSheet(CONFIG.DIST_SHEET, 0);

  var hdr = sheet.getRange(1, 1, 1, 5);
  hdr.setValues([['Code', 'Pre-Survey URL', 'Post-Survey URL', 'Pre Submitted?', 'Post Submitted?']]);
  hdr.setFontWeight('bold')
     .setFontFamily('Arial')
     .setFontSize(11)
     .setBackground('#2d7a5f')
     .setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  // Data rows — URLs via FormResponse.toPrefilledUrl() (official API).
  var rows = [];
  for (var i = 1; i <= CONFIG.NUM_CODES; i++) {
    var code    = CONFIG.CODE_PREFIX + '-' + padLeft_(i, 3);
    var preUrl  = makePrefilledUrl_(pre.form,  pre.codeItem,  code);
    var postUrl = makePrefilledUrl_(post.form, post.codeItem, code);
    rows.push([code, preUrl, postUrl, '', '']);
  }
  sheet.getRange(2, 1, rows.length, 5).setValues(rows);

  for (var r = 2; r <= rows.length + 1; r++) {
    if (r % 2 === 0) sheet.getRange(r, 1, 1, 5).setBackground('#f2ede6');
  }

  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 400);
  sheet.setColumnWidth(3, 400);
  sheet.setColumnWidth(4, 130);
  sheet.setColumnWidth(5, 130);

  var notesRow = rows.length + 3;
  sheet.getRange(notesRow, 1).setValue('NOTES').setFontWeight('bold');
  sheet.getRange(notesRow + 1, 1, 1, 5).merge()
    .setValue(
      'HOW TO DISTRIBUTE: Send each student their unique Pre-Survey URL (before they open Tu Pana) ' +
      'and Post-Survey URL (after a meaningful Tu Pana session or the assigned draft) via Brightspace or email. ' +
      'The participant code arrives pre-filled — students do not type anything. ' +
      'Also post the CAP 200 app link: ' + CONFIG.CAP200_DEEP_LINK + ' (use the rollout-packet wording). ' +
      'Columns D and E are for your manual tracking only.\n\n' +
      'ANALYSIS NOTE: C2 ("I worry that using AI will make my writing less my own") and F4 ' +
      '("I feel anxious about writing this report") are REVERSE-SCORED — a decrease pre→post is a positive signal. ' +
      'G10 is a frequency item that monitors the known Stage 7 coach-reply cut-off (not a 1–5 scale).\n\n' +
      'PRIVACY: Codes are not linked to any institutional record. The code→student mapping exists only in how ' +
      'you distribute links. Data is coded/de-identified, not anonymous. Do not share this sheet with students ' +
      'or include it in research data exports.'
    )
    .setWrap(true)
    .setBackground('#fdf3e3')
    .setFontSize(10);
}


// ═══════════════════════════════════════════════════════════════
// FORM LINKS SHEET
// ═══════════════════════════════════════════════════════════════
function buildLinksSheet_(ss, preForm, postForm) {
  var existing = ss.getSheetByName(CONFIG.LINKS_SHEET);
  if (existing) ss.deleteSheet(existing);
  var sheet = ss.insertSheet(CONFIG.LINKS_SHEET);

  var hdr = sheet.getRange(1, 1, 1, 3);
  hdr.setValues([['Form', 'Edit URL (your access)', 'Published URL (if needed)']]);
  hdr.setFontWeight('bold')
     .setFontFamily('Arial')
     .setBackground('#2d7a5f')
     .setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  sheet.getRange(2, 1, 2, 3).setValues([
    ['Pre-Survey',
     'https://docs.google.com/forms/d/' + preForm.getId() + '/edit',
     preForm.getPublishedUrl()],
    ['Post-Survey',
     'https://docs.google.com/forms/d/' + postForm.getId() + '/edit',
     postForm.getPublishedUrl()]
  ]);

  sheet.setColumnWidth(1, 110);
  sheet.setColumnWidth(2, 480);
  sheet.setColumnWidth(3, 480);

  sheet.getRange(5, 1, 1, 3).merge()
    .setValue(
      'Use the Edit URLs to modify or review forms after creation. ' +
      'Use the Published URLs only if you need to share a form without a pre-filled code ' +
      '(not recommended — codes allow pre/post pairing).'
    )
    .setWrap(true)
    .setFontSize(10)
    .setBackground('#fdf3e3');
}


// ═══════════════════════════════════════════════════════════════
// HELPERS  (unchanged from Pilot 1)
// ═══════════════════════════════════════════════════════════════
function configureForm_(form, ss) {
  form.setDescription(CONSENT);
  form.setCollectEmail(CONFIG.COLLECT_EMAIL);
  form.setLimitOneResponsePerUser(false);   // avoid CUNY Workspace login/identity capture
  form.setPublishingSummary(false);          // respondents can't see aggregate charts
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
}

function addScaleItems_(form, titles) {
  titles.forEach(function(title) {
    form.addScaleItem()
      .setTitle(title)
      .setBounds(1, 5)
      .setLabels(SCALE_LOW, SCALE_HIGH)
      .setRequired(true);
  });
}

function makePrefilledUrl_(form, codeItem, code) {
  var response = form.createResponse();
  response.withItemResponse(codeItem.createResponse(code));
  return response.toPrefilledUrl();
}

function verifySurveySetup() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var dist  = ss.getSheetByName(CONFIG.DIST_SHEET);
  var links = ss.getSheetByName(CONFIG.LINKS_SHEET);
  var lines = ['── ' + CONFIG.PILOT_NAME + ' Survey Setup Check ──\n'];

  if (!dist) {
    lines.push('✗  Distribution sheet not found.\n   Run "Build Pre + Post Surveys" first.');
  } else {
    var dataRows = dist.getLastRow() - 1;
    lines.push('✓  Distribution sheet: ' + dataRows + ' participant row(s)');
    var vals = dist.getRange(2, 1, dataRows, 3).getValues();
    var missing = vals.filter(function(r) { return !r[1] || !r[2]; }).length;
    if (missing === 0) {
      lines.push('✓  All rows have Pre-Survey and Post-Survey URLs');
    } else {
      lines.push('✗  ' + missing + ' row(s) missing URLs — re-run Build Pre + Post Surveys');
    }
  }

  if (links) {
    lines.push('\nForm edit links:');
    lines.push('  Pre-Survey:  ' + links.getRange(2, 2).getValue());
    lines.push('  Post-Survey: ' + links.getRange(3, 2).getValue());
  } else {
    lines.push('\n✗  Form Links sheet not found — run Build Pre + Post Surveys first.');
  }

  lines.push(
    '\n── Before distributing ──\n' +
    '1. Open the Distribution sheet.\n' +
    '2. Copy the ' + CONFIG.CODE_PREFIX + '-001 Pre-Survey URL.\n' +
    '3. Open it in an INCOGNITO / PRIVATE browser window.\n' +
    '4. Confirm the Participant Code field shows "' + CONFIG.CODE_PREFIX + '-001" pre-filled.\n' +
    '5. Repeat with ' + CONFIG.CODE_PREFIX + '-002 to confirm codes differ.\n' +
    '6. Submit a test response and confirm it appears in the response sheet.\n' +
    '7. Delete test responses before distributing to students.\n' +
    '8. Post the CAP 200 app link with the rollout wording:\n   ' + CONFIG.CAP200_DEEP_LINK
  );

  SpreadsheetApp.getUi().alert(lines.join('\n'));
}

function padLeft_(num, width) {
  var s = String(num);
  while (s.length < width) s = '0' + s;
  return s;
}
