/**
 * TU PANA DE ESCRITURA — Survey Builder
 * Google Apps Script  v1.0  (2026-05-31)
 * File: docs/pilot/survey-builder.gs
 *
 * ══════════════════════════════════════════════════════════════
 * HOW TO USE — one-time setup
 * ══════════════════════════════════════════════════════════════
 * 1. Create a NEW Google Sheet — this will be your pilot data workbook.
 *    (Name it something like "Tu Pana Pilot Data — LAC 118 Summer 2026")
 *
 * 2. In that sheet: Extensions → Apps Script
 *
 * 3. Delete all placeholder code, paste this entire file, then
 *    File → Save  (or Ctrl/Cmd + S).
 *
 * 4. Close the script editor and RELOAD the Google Sheet.
 *    A "Tu Pana Surveys" menu will appear in the menu bar.
 *
 * 5. Click  Tu Pana Surveys → Build Pre + Post Surveys
 *
 * 6. When Google asks for authorization, click "Review Permissions"
 *    and allow. The script needs permission to create Forms and
 *    write to Sheets — it does nothing else.
 *
 * 7. Wait ~20–30 seconds. A dialog will confirm when done.
 *
 * ══════════════════════════════════════════════════════════════
 * WHAT GETS CREATED
 * ══════════════════════════════════════════════════════════════
 * In your Google Drive:
 *   • "Tu Pana de Escritura — Encuesta Inicial · Pre-Survey"  (Form)
 *   • "Tu Pana de Escritura — Encuesta Final · Post-Survey"   (Form)
 *
 * In your Spreadsheet:
 *   • "Distribution" sheet — Code | Pre-Survey URL | Post-Survey URL
 *     (Distribute one row per student. Do NOT share this sheet.)
 *   • "Form Links" sheet  — edit links for both forms (your records)
 *   • Response sheets     — auto-created when students submit
 *
 * ══════════════════════════════════════════════════════════════
 * AFTER RUNNING
 * ══════════════════════════════════════════════════════════════
 * 1. Open the "Distribution" sheet.
 * 2. Copy each student's Pre-Survey URL and Post-Survey URL.
 * 3. Distribute privately (Brightspace message, email, etc.) —
 *    one unique pair per student.
 * 4. Students click their link → code arrives pre-filled → they
 *    do not type anything for the code field.
 * 5. Track completion in the Pre/Post Submitted columns manually.
 *
 * ══════════════════════════════════════════════════════════════
 * REUSE FOR OTHER CLASSES
 * ══════════════════════════════════════════════════════════════
 * The survey is class-agnostic. For a new class:
 *   • Create a new Google Sheet, paste this script again, and run.
 *   • New forms + new distribution codes are generated fresh.
 *   • Adjust NUM_PARTICIPANTS if the class size differs.
 */


// ═══════════════════════════════════════════════════════════════
// CONFIGURATION  — edit here before running
// ═══════════════════════════════════════════════════════════════
var CONFIG = {
  NUM_PARTICIPANTS : 30,          // Number of unique participant codes to generate
  CODE_PREFIX      : 'TPN',       // Code format: TPN-001, TPN-002, …
  DIST_SHEET       : 'Distribution',
  LINKS_SHEET      : 'Form Links',
};


// ═══════════════════════════════════════════════════════════════
// CONSENT PREAMBLE  — appears at the top of both forms
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
    .createMenu('Tu Pana Surveys')
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

  ui.alert(
    'Building surveys…\n\n' +
    'This takes about 20–30 seconds. Click OK and wait for the completion message.'
  );

  var pre  = buildPreSurvey_(ss);
  var post = buildPostSurvey_(ss);
  buildDistributionSheet_(ss, pre, post);
  buildLinksSheet_(ss, pre.form, post.form);

  ui.alert(
    '✓ Done!\n\n' +
    '• "Distribution" sheet → participant codes and URLs\n' +
    '• "Form Links" sheet  → edit links for both forms\n' +
    '• Both forms are now in your Google Drive\n\n' +
    'Distribute one row per student privately.\n' +
    'Do not share this sheet with students.'
  );
}


// ═══════════════════════════════════════════════════════════════
// PRE-SURVEY
// ═══════════════════════════════════════════════════════════════
function buildPreSurvey_(ss) {
  var form = FormApp.create('Tu Pana de Escritura — Encuesta Inicial · Pre-Survey');
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

  // ── Part A — About You as a Writer ───────────────────────────────────────
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
      'A2. Before this course, how many multi-page essays have you written ' +
      'in English for a college class?\n' +
      'Antes de este curso, ¿cuántos ensayos de varias páginas has escrito ' +
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

  // ── Part B — Writing Confidence ───────────────────────────────────────────
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

  // ── Part C — AI and Writing ───────────────────────────────────────────────
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

  return { form: form, codeItem: codeItem };
}


// ═══════════════════════════════════════════════════════════════
// POST-SURVEY
// ═══════════════════════════════════════════════════════════════
function buildPostSurvey_(ss) {
  var form = FormApp.create('Tu Pana de Escritura — Encuesta Final · Post-Survey');
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

  // ── Part B — Writing Confidence (identical to pre-survey) ─────────────────
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

  // ── Part C — AI and Writing (identical to pre-survey) ────────────────────
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

  // ── Part D — Tu Pana Experience ───────────────────────────────────────────
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

  // ── Part E — Reflection ────────────────────────────────────────────────────
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

  return { form: form, codeItem: codeItem };
}


// ═══════════════════════════════════════════════════════════════
// DISTRIBUTION SHEET
// ═══════════════════════════════════════════════════════════════
function buildDistributionSheet_(ss, pre, post) {
  var existing = ss.getSheetByName(CONFIG.DIST_SHEET);
  if (existing) ss.deleteSheet(existing);
  var sheet = ss.insertSheet(CONFIG.DIST_SHEET, 0);

  // Header
  var hdr = sheet.getRange(1, 1, 1, 5);
  hdr.setValues([['Code', 'Pre-Survey URL', 'Post-Survey URL', 'Pre Submitted?', 'Post Submitted?']]);
  hdr.setFontWeight('bold')
     .setFontFamily('Arial')
     .setFontSize(11)
     .setBackground('#2d7a5f')
     .setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  // Data rows — URLs generated via FormResponse.toPrefilledUrl() (official API, avoids
  // manual entry-ID construction which can silently produce unresolvable URLs).
  var rows = [];

  for (var i = 1; i <= CONFIG.NUM_PARTICIPANTS; i++) {
    var code    = CONFIG.CODE_PREFIX + '-' + padLeft_(i, 3);
    var preUrl  = makePrefilledUrl_(pre.form,  pre.codeItem,  code);
    var postUrl = makePrefilledUrl_(post.form, post.codeItem, code);
    rows.push([code, preUrl, postUrl, '', '']);
  }

  sheet.getRange(2, 1, rows.length, 5).setValues(rows);

  // Alternating row shading
  for (var r = 2; r <= rows.length + 1; r++) {
    if (r % 2 === 0) {
      sheet.getRange(r, 1, 1, 5).setBackground('#f2ede6');
    }
  }

  // Column widths
  sheet.setColumnWidth(1, 90);
  sheet.setColumnWidth(2, 400);
  sheet.setColumnWidth(3, 400);
  sheet.setColumnWidth(4, 130);
  sheet.setColumnWidth(5, 130);

  // Notes block below data
  var notesRow = rows.length + 3;
  sheet.getRange(notesRow, 1).setValue('NOTES').setFontWeight('bold');
  var notesCell = sheet.getRange(notesRow + 1, 1, 1, 5);
  notesCell.merge()
    .setValue(
      'HOW TO DISTRIBUTE: Send each student their unique Pre-Survey URL (Week 1, before they open Tu Pana) ' +
      'and Post-Survey URL (Week 4, after their final writing assignment is submitted) via Brightspace or email. ' +
      'The participant code arrives pre-filled — students do not need to type anything. ' +
      'Columns D and E are for your manual tracking only.\n\n' +
      'ANALYSIS NOTE: C2 ("I worry that using AI will make my writing less my own") is REVERSE-SCORED. ' +
      'A decrease may indicate reduced fear about AI threatening authorship. A stable high score or increase ' +
      'may also reflect growing critical awareness — document both patterns rather than treating one direction ' +
      'as the only positive outcome.\n\n' +
      'PRIVACY: Student codes are not linked to any institutional record. ' +
      'The mapping between a code and a specific student exists only in how you chose to distribute. ' +
      'Do not share this sheet with students or include it in research data exports.'
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
    [
      'Pre-Survey',
      'https://docs.google.com/forms/d/' + preForm.getId() + '/edit',
      preForm.getPublishedUrl()
    ],
    [
      'Post-Survey',
      'https://docs.google.com/forms/d/' + postForm.getId() + '/edit',
      postForm.getPublishedUrl()
    ]
  ]);

  sheet.setColumnWidth(1, 110);
  sheet.setColumnWidth(2, 480);
  sheet.setColumnWidth(3, 480);

  // Note
  sheet.getRange(5, 1, 1, 3).merge()
    .setValue(
      'Use the Edit URLs to modify or review forms after creation. ' +
      'Use the Published URLs only if you need to share the form without a pre-filled code ' +
      '(not recommended — codes allow pre/post pairing).'
    )
    .setWrap(true)
    .setFontSize(10)
    .setBackground('#fdf3e3');
}


// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Shared form settings applied to both pre and post forms.
 */
function configureForm_(form, ss) {
  form.setDescription(CONSENT);
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  // Link responses to the same spreadsheet as this script
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
}

/**
 * Adds a list of scale items (1–5) to a form, all with the same bounds and labels.
 */
function addScaleItems_(form, titles) {
  titles.forEach(function(title) {
    form.addScaleItem()
      .setTitle(title)
      .setBounds(1, 5)
      .setLabels(SCALE_LOW, SCALE_HIGH)
      .setRequired(true);
  });
}

/**
 * Generates a pre-filled Google Forms URL using the official FormResponse API.
 * Using createResponse().toPrefilledUrl() is the API-supported approach —
 * it avoids manual entry-ID construction, which can produce silently broken URLs
 * if the internal field ID does not match the URL entry parameter.
 * codeItem must be the TextItem object returned directly by form.addTextItem().
 */
function makePrefilledUrl_(form, codeItem, code) {
  var response = form.createResponse();
  response.withItemResponse(codeItem.createResponse(code));
  return response.toPrefilledUrl();
}

/**
 * Checks that the Distribution sheet and Form Links sheet are in place, counts
 * participant rows, and prints a pre-distribution checklist. Run from the menu.
 */
function verifySurveySetup() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var dist  = ss.getSheetByName(CONFIG.DIST_SHEET);
  var links = ss.getSheetByName(CONFIG.LINKS_SHEET);
  var lines = ['── Tu Pana Survey Setup Check ──\n'];

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
    '2. Copy the TPN-001 Pre-Survey URL.\n' +
    '3. Open it in an INCOGNITO / PRIVATE browser window.\n' +
    '4. Confirm the Participant Code field shows "TPN-001" pre-filled.\n' +
    '5. Repeat with TPN-002 to confirm codes differ.\n' +
    '6. Submit a test response and confirm it appears in the response sheet.\n' +
    '7. Delete test responses before distributing to students.'
  );

  SpreadsheetApp.getUi().alert(lines.join('\n'));
}

/**
 * Zero-pads a number to the specified width.
 * Uses a loop instead of padStart() for broadest Apps Script compatibility.
 */
function padLeft_(num, width) {
  var s = String(num);
  while (s.length < width) s = '0' + s;
  return s;
}
