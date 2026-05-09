# Tu Pana de Escritura — QA Scenarios

Use these scenarios to verify app behavior before tagging a release or after any significant change.
Each scenario is designed for manual testing without automation infrastructure.

---

## BASELINE: Fresh start

**Precondition:** Clear all `tupana_*` keys from localStorage (or use the "Borrar mis datos" button in the report modal).

1. Open `index.html` (or `http://localhost:8000`).
2. Tu Conocimiento modal appears automatically. ✓
3. Student can claim at least one asset (language, family knowledge, etc.). ✓
4. Completing Tu Conocimiento opens El Laboratorio. ✓
5. El Laboratorio questions appear sequentially (one at a time). ✓
6. Completing El Laboratorio closes the modal and enters Stage 1. ✓
7. Welcome message appears in the chat panel. ✓

---

## STAGE PROGRESSION: Linear path

For each stage 1 through 5:
- Write text in the draft area.
- Click Continuar. Stage preview modal appears.
- Confirm. Stage advances. Journey map updates. ✓

**Stage 6 authorship gate:**
1. Arrive at Stage 6 (Borrador).
2. Confirm that Continuar is **disabled**. ✓
3. Confirm that Guardar is shown full-width (dominant CTA). ✓
4. Write at least a few words.
5. Click Guardar. Save ceremony modal appears. ✓
6. Complete save ceremony. Editor becomes read-only. Continuar becomes enabled. ✓
7. Click Continuar. Stage 7 loads. Revision panel appears. ✓

**Stage 7 (Revisión):**
1. Five Questions strip is visible. ✓
2. AI sends a message → eval card appears below it with 3 response buttons. ✓
3. Clicking an eval button sends the response and logs it. ✓
4. Decision log entries appear. Log is collapsible. ✓

**Stage 8 (Pulir Voz):**
1. Voice Vault panel appears in draft area. ✓
2. Select a phrase in the textarea → Protect button activates. ✓
3. Click Protect → phrase added to vault with green dot. ✓
4. Click the phrase in the vault → it scrolls into view and is selected in textarea. ✓
5. Delete the phrase from textarea → dot turns amber (missing). ✓

**Stage 10 (Capstone):**
1. 10A card appears: student rates 8 dimensions. ✓
2. Submit 10A → 10B card appears (Coach Perspective). ✓
3. Request coach perspective → loading state → results render. ✓ (or offline fallback renders) ✓
4. Submit 10B → 10C card appears. ✓
5. Student responds to each dimension in 10C. ✓
6. Submit 10C → completion celebration modal appears. ✓
7. "Generate Report for Brightspace" button appears in chat. ✓
8. Click it → Instructor Report panel slides in. ✓
9. Enter name + assignment title → report preview updates. ✓
10. Copy and Download buttons work. ✓

---

## SESSION RESTORE: Reload mid-flow

1. Start from Stage 3.
2. Type some text. Navigate to Stage 5.
3. Reload the page.
4. App restores to Stage 5. ✓
5. Draft text is intact. ✓
6. Journey map shows stages 1–4 completed. ✓
7. Chat log restored — welcome/system entries collapsed in a `<details>` pill. ✓
8. Stage badge in draft panel header shows correct stage. ✓

**Stage 8 restore:**
1. Protect a phrase at Stage 8. Reload.
2. Voice Vault re-appears. Protected phrase is listed. ✓

**Stage 10 restore:**
1. Complete 10A and 10B. Reload.
2. Coach perspective data re-renders automatically. ✓
3. If instructor report was generated, panel re-injects. ✓

---

## DATA: Export / Import / Clear

**Export:**
1. Click Reporte → Export data.
2. `.json` file downloads. Open it — all `tupana_*` keys present. ✓

**Import:**
1. Clear all data (start fresh).
2. Import the exported `.json`.
3. Page reloads. Previous stage, draft, and chat log restored. ✓

**Clear:**
1. Click Reporte → Borrar mis datos.
2. First confirm dialog. Cancel → nothing changes. ✓
3. Confirm again. Type `DELETE` or `BORRAR`. ✓
4. Page reloads at Stage 1, onboarding re-triggers. ✓

---

## LANGUAGE: ES / EN / ES·EN switching

1. Click EN button in header. All show-en elements visible. show-es hidden. ✓
2. Click ES button. Reverse. ✓
3. Click ES·EN. Both visible. ✓
4. Reload. Language preference restored. ✓
5. Journey map labels, current task bar, CTAs — all respond correctly in each mode. ✓

---

## TONE: Gentle / Direct

1. Click tone toggle. Label changes from Suave to Directo. ✓
2. Reload. Tone preference restored. ✓
3. AI coach responses adapt tone label (coaching tone itself depends on agent config). ✓

---

## THEME: Light / Dark

1. Click sun/moon icon in header.
2. `data-theme="dark"` set on `<html>`. Color scheme switches. ✓
3. Reload. Theme restored. ✓

---

## MOBILE: Tab interface (≤ 480px viewport)

Resize browser to 375px wide (or use DevTools mobile emulation).

1. Journey map hidden. ✓
2. Mobile tab bar appears at top. "Borrador" tab active. ✓
3. Draft panel visible. Chat panel hidden. ✓
4. Click "Coach" tab. Chat panel appears. Draft hidden. ✓
5. AI sends a message while on Draft tab → notification dot appears on Coach tab. ✓
6. Click Coach tab → dot disappears. ✓
7. All tap targets are at least 44×44px (use DevTools to verify). ✓
8. Chat input font-size is 16px minimum (no iOS auto-zoom). ✓

**Modals at mobile width:**
- Report modal, process note modal, stage preview modal — all scrollable, close correctly. ✓
- Report action buttons wrap to 2-column grid. ✓

---

## OFFLINE MODE

1. Set `CONFIG.useCopilotEmbed = false` and `CONFIG.difyEmbedUrl = ''` in config.js.
2. Reload. "AI coach is currently offline" banner does NOT appear (it only shows for misconfigured DirectLine). ✓
3. Chat input is disabled. Offline affirmations or prompts display on coach side. ✓
4. All 10 stages still navigable. ✓
5. Instructor report generates without AI content (uses cached or null coach perspective). ✓

---

## ACCESSIBILITY

1. Tab through the entire interface with keyboard only. No focus traps outside modals. ✓
2. Skip link ("Saltar al contenido") visible on first Tab keypress. Activates correctly. ✓
3. All buttons have `aria-label` attributes (check with browser accessibility inspector). ✓
4. System notes have `role="status"` and `aria-live="polite"`. ✓
5. Modals have `role="dialog"` and `aria-modal="true"`. ✓
6. Eval card buttons have bilingual aria-labels. ✓

---

## DEV BAR

1. Open `http://localhost:8000?dev=true`.
2. Dev preview bar visible at bottom. ✓
3. "Tu Conocimiento" and "El Laboratorio" buttons open modals regardless of completion state. ✓
4. Reload without `?dev=true`. Bar hidden. ✓

---

## EDGE CASES

- Student clicks Continuar at Stage 6 before saving → button is disabled, nothing happens. ✓
- Student reloads at Stage 10 after capstone is partially complete → correct sub-panel restores. ✓
- Student goes to Stage 10, then clicks a previous stage in the journey map → `onStageClick` blocks backward navigation at Stage 10. ✓
- Draft saved at Stage 6, student clears all data, reloads → `draftSaved` is false, Guardar is required again. ✓
- Very long draft (> 1400 chars) sent to coach perspective → AI receives first 1400 chars only (expected truncation). ✓
