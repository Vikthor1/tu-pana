/**
 * TU PANA DE ESCRITURA — Bug Report Form Builder
 * Google Apps Script  v1.0  (2026-06-04)
 * File: docs/pilot/create_bug_report_form.gs
 *
 * ══════════════════════════════════════════════════════════════
 * HOW TO USE — one-time setup
 * ══════════════════════════════════════════════════════════════
 * 1. Create a NEW Google Sheet — this will collect bug reports.
 *    (Name it something like "Tu Pana — Bug Reports")
 *
 * 2. In that sheet: Extensions → Apps Script
 *
 * 3. Delete all placeholder code, paste this entire file, then
 *    File → Save  (or Ctrl/Cmd + S).
 *
 * 4. Close the script editor and RELOAD the Google Sheet.
 *    A "Tu Pana Bug Form" menu will appear in the menu bar.
 *
 * 5. Click  Tu Pana Bug Form → Build Bug Report Form
 *
 * 6. When Google asks for authorization, click "Review Permissions"
 *    and allow. The script needs permission to create a Form and
 *    write to this Sheet — it does nothing else.
 *
 * 7. Wait ~10–15 seconds. A dialog will confirm when done and
 *    show you the Published URL.
 *
 * ══════════════════════════════════════════════════════════════
 * WHAT GETS CREATED
 * ══════════════════════════════════════════════════════════════
 * In your Google Drive:
 *   • "Tu Pana — Reportar un problema / Report a Problem"  (Form)
 *
 * In your Spreadsheet:
 *   • "Form Links" sheet — edit URL + published URL (your records)
 *   • A response sheet — auto-created when students submit
 *
 * ══════════════════════════════════════════════════════════════
 * AFTER RUNNING — activating the bug report button
 * ══════════════════════════════════════════════════════════════
 * 1. Open the "Form Links" sheet.
 * 2. Copy the Published URL (column C, row 2).
 * 3. Open Tu Pana's  assets/js/config.js
 * 4. Set:   bugReportUrl: '<paste published URL here>'
 * 5. Save and deploy (git commit + push to GitHub Pages).
 * 6. Test: open the app, click the bug report button (header).
 *    It should open the form in a new tab.
 *
 * ══════════════════════════════════════════════════════════════
 * PRIVACY REMINDER
 * ══════════════════════════════════════════════════════════════
 * • The form does NOT collect Google account emails.
 * • No name, student ID, or course section is required.
 * • Students are instructed not to paste their draft or
 *   private information.
 * • The technical context fields are optional and populated
 *   automatically by Tu Pana — students do not fill them.
 * • This form is NOT for grades or institutional reporting.
 *
 * ══════════════════════════════════════════════════════════════
 * REUSE
 * ══════════════════════════════════════════════════════════════
 * To regenerate (e.g., after a form is accidentally deleted):
 * run Build Bug Report Form again from the same sheet.
 * A new form will be created and the Form Links sheet updated.
 */


// ═══════════════════════════════════════════════════════════════
// CONFIGURATION  — edit here before running if needed
// ═══════════════════════════════════════════════════════════════
var CONFIG_BUG = {
  LINKS_SHEET : 'Form Links',
};


// ═══════════════════════════════════════════════════════════════
// MENU
// ═══════════════════════════════════════════════════════════════
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Tu Pana Bug Form')
    .addItem('Build Bug Report Form', 'buildBugReportForm')
    .addToUi();
}


// ═══════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════
function buildBugReportForm() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  ui.alert(
    'Building bug report form…\n\n' +
    'This takes about 10–15 seconds. Click OK and wait for the completion message.'
  );

  var form = buildForm_(ss);
  var linksSheet = buildLinksSheet_(ss, form);

  var publishedUrl = form.getPublishedUrl();
  var editUrl = 'https://docs.google.com/forms/d/' + form.getId() + '/edit';

  Logger.log('─── Tu Pana Bug Report Form ───');
  Logger.log('Edit URL:      ' + editUrl);
  Logger.log('Published URL: ' + publishedUrl);
  Logger.log('Spreadsheet:   ' + ss.getUrl());
  Logger.log('');
  Logger.log('Next step: copy the Published URL into CONFIG.bugReportUrl in assets/js/config.js');

  ui.alert(
    '✓ Done!\n\n' +
    'Published URL (paste into CONFIG.bugReportUrl):\n' + publishedUrl + '\n\n' +
    'Edit URL (to modify the form later):\n' + editUrl + '\n\n' +
    '• "Form Links" sheet → both URLs saved for your records\n' +
    '• Student responses will appear in a new sheet automatically\n\n' +
    'NEXT STEP:\n' +
    '1. Copy the Published URL above\n' +
    '2. Open assets/js/config.js and set:  bugReportUrl: \'<url>\'\n' +
    '3. Save, commit, and push → the bug report button will activate'
  );
}


// ═══════════════════════════════════════════════════════════════
// FORM BUILDER
// ═══════════════════════════════════════════════════════════════
function buildForm_(ss) {
  var form = FormApp.create('Tu Pana — Reportar un problema / Report a Problem');

  form.setDescription(
    'Usa este formulario para contarme rápidamente si algo en Tu Pana no funcionó ' +
    'o si una parte te confundió. No incluyas información privada ni pegues todo tu trabajo. ' +
    'Esto no afecta tu nota.\n\n' +
    'Use this form to quickly tell me if something in Tu Pana did not work or if a part ' +
    'confused you. Please do not include private information or paste your full assignment. ' +
    'This does not affect your grade.'
  );

  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(true);

  // Link responses to the same spreadsheet as this script
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  form.setConfirmationMessage(
    'Gracias. Tu reporte ayuda a mejorar Tu Pana.\n\n' +
    'Thank you. Your report helps improve Tu Pana.'
  );

  // ── Q1: What happened? ───────────────────────────────────────────────────
  form.addMultipleChoiceItem()
    .setTitle(
      '1. ¿Qué pasó? / What happened?'
    )
    .setChoiceValues([
      'Algo no funcionó / Something did not work',
      'Me confundí / I got confused',
      'Perdí o no pude encontrar mi trabajo / I lost or could not find my work',
      'La página se veía mal / The page looked wrong',
      'El audio, los botones o el texto no funcionaron como esperaba / Audio, buttons, or text did not behave as expected'
    ])
    .showOtherOption(true)
    .setRequired(true);

  // ── Q2: Where did it happen? ─────────────────────────────────────────────
  // Optional — Tu Pana may append stage context automatically via URL parameters
  form.addTextItem()
    .setTitle(
      '2. ¿Dónde ocurrió? / Where did it happen?'
    )
    .setHelpText(
      'Describe la etapa o el lugar en la app donde pasó el problema. ' +
      'Puedes dejar esto en blanco.\n' +
      'Describe the stage or place in the app where it happened. ' +
      'You can leave this blank.'
    )
    .setRequired(false);

  // ── Q3: What were you trying to do? ─────────────────────────────────────
  form.addParagraphTextItem()
    .setTitle(
      '3. ¿Qué estabas tratando de hacer? / What were you trying to do?'
    )
    .setRequired(false);

  // ── Q4: Brief description (required) ─────────────────────────────────────
  form.addParagraphTextItem()
    .setTitle(
      '4. Cuéntame brevemente qué falló o qué te confundió. / ' +
      'Tell me briefly what went wrong or what was confusing.'
    )
    .setHelpText(
      'No pegues todo tu trabajo ni información privada.\n' +
      'Please do not paste your full assignment or private information.'
    )
    .setRequired(true);

  // ── Q5: Device ────────────────────────────────────────────────────────────
  form.addMultipleChoiceItem()
    .setTitle(
      '5. ¿Qué dispositivo estabas usando? / What device were you using?'
    )
    .setChoiceValues([
      'Teléfono / Phone',
      'Tableta / Tablet',
      'Computadora portátil o de escritorio / Laptop or desktop',
      'No estoy seguro/a/e / Not sure'
    ])
    .setRequired(false);

  // ── Q6: Follow-up preference ──────────────────────────────────────────────
  form.addMultipleChoiceItem()
    .setTitle(
      '6. ¿Quieres que te dé seguimiento? / Would you like me to follow up with you?'
    )
    .setChoiceValues([
      'No, solo quiero reportar el problema / No, this is just to report the issue',
      'Sí, me gustaría recibir ayuda / Yes, I would like help'
    ])
    .setRequired(true);

  // ── Q7: Contact (optional) ────────────────────────────────────────────────
  form.addTextItem()
    .setTitle(
      '7. Información de contacto opcional / Optional contact information'
    )
    .setHelpText(
      'Incluye tu correo solo si quieres seguimiento. No es obligatorio.\n' +
      'Only include your email if you want a follow-up. This is not required.'
    )
    .setRequired(false);

  // ── Technical context section ─────────────────────────────────────────────
  // These fields are pre-filled automatically by Tu Pana via URL parameters.
  // Students do not need to fill them out manually.
  form.addPageBreakItem()
    .setTitle(
      'Contexto técnico añadido por Tu Pana / Technical context added by Tu Pana'
    )
    .setHelpText(
      'Tu Pana puede completar estos campos automáticamente. ' +
      'No necesitas escribir nada aquí.\n' +
      'Tu Pana may fill these in automatically. ' +
      'You do not need to type anything here.'
    );

  form.addTextItem()
    .setTitle('Número de etapa / Stage number')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Título de etapa / Stage title')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Idioma / Language')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Proveedor / Provider')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Fecha y hora / Timestamp')
    .setRequired(false);

  return form;
}


// ═══════════════════════════════════════════════════════════════
// FORM LINKS SHEET
// ═══════════════════════════════════════════════════════════════
function buildLinksSheet_(ss, form) {
  var existing = ss.getSheetByName(CONFIG_BUG.LINKS_SHEET);
  if (existing) ss.deleteSheet(existing);
  var sheet = ss.insertSheet(CONFIG_BUG.LINKS_SHEET);

  var hdr = sheet.getRange(1, 1, 1, 3);
  hdr.setValues([['Form', 'Edit URL (your access)', 'Published URL → paste into CONFIG.bugReportUrl']]);
  hdr.setFontWeight('bold')
     .setFontFamily('Arial')
     .setBackground('#2d7a5f')
     .setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  sheet.getRange(2, 1, 1, 3).setValues([[
    'Bug Report Form',
    'https://docs.google.com/forms/d/' + form.getId() + '/edit',
    form.getPublishedUrl()
  ]]);

  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(2, 480);
  sheet.setColumnWidth(3, 480);

  // Activation instructions
  sheet.getRange(4, 1, 1, 3).merge()
    .setValue(
      'HOW TO ACTIVATE:\n' +
      '1. Copy the Published URL (column C above).\n' +
      '2. Open  assets/js/config.js  in the Tu Pana repo.\n' +
      '3. Set:  bugReportUrl: \'<paste URL here>\'\n' +
      '4. Save, commit, and push to GitHub Pages.\n' +
      '5. Test: open the live app → click the bug report button in the header.\n\n' +
      'PRIVACY NOTE:\n' +
      '• The form does not collect Google account emails or student IDs.\n' +
      '• Students are instructed not to paste their draft or private information.\n' +
      '• The technical context section is populated by Tu Pana, not by students.\n' +
      '• Do not require students to identify themselves to submit a report.'
    )
    .setWrap(true)
    .setFontSize(10)
    .setBackground('#fdf3e3');

  return sheet;
}
