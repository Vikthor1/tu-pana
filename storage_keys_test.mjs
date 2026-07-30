// storage_keys_test.mjs — Regression tests for P3 storage key reconciliation
// Verifies the prefix-based export/import/clear in assets/js/storage.js:
//   - source audit: every tupana_* key literal in the app is documented in the
//     storage.js inventory (static, dynamic pattern, or sessionStorage)
//   - export payload covers every tupana_* localStorage key, incl. dynamic
//   - clear removes every tupana_* key (localStorage + sessionStorage), no ghosts
//   - clear does not touch non-tupana keys
//   - import restores the full exported state (round-trip)
//   - import refuses non-tupana keys (backup files cannot write arbitrary keys)
//   - legacy backups (no schema version) get schema/template seeded
//   - cancelled clear (confirm=false) deletes nothing
// Manual QA checklist at the bottom of this file.

import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const BASE = 'http://127.0.0.1:3001';
const results = [];
let passed = 0, failed = 0;

function check(label, condition) {
    const ok = !!condition;
    results.push({ label, ok });
    if (ok) passed++; else failed++;
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
}

// ── Part 1: static source audit (no browser) ─────────────────────────────

const DOCUMENTED_STATIC = new Set([
    'tupana_draft','tupana_draft_saved','tupana_chatlog','tupana_mani_done',
    'tupana_lab_done','tupana_onboarding_complete','tupana_mani_sentence',
    'tupana_decisions','tupana_theme',
    'tupana_lang','tupana_tone','tupana_stage','tupana_process_note',
    'tupana_process_log','tupana_journey_expand','tupana_protected',
    'tupana_report_meta','tupana_mani_claimed','tupana_completion_shown',
    'tupana_capstone','tupana_schema_version','tupana_template_id',
    'tupana_skills_acquired','tupana_sessions','tupana_coach_mode',
    'tupana_eval_stats','tupana_eval_hint_seen','tupana_progress_collapsed',
    'tupana_fiveq_stage7_opened_once','tupana_spotlight_off',
    'tupana_assignment_id','tupana_project_chosen','tupana_ai_cue_seen',
]);
const DOCUMENTED_SESSION = new Set([
    'tupana_warn_dismissed','tupana_persist_warn','tupana_voice_challenge_shown',
]);
const DOCUMENTED_DYNAMIC = [
    /^tupana_writing_s\d*$/,    // tupana_writing_s<N> (bare prefix appears in template literals)
    /^tupana_writing_s$/,
    /^tupana_step_/,            // tupana_step_<stageId>
    /^tupana_reflect_shown_/,   // tupana_reflect_shown_<stageId>
];

const SOURCES = ['index.html','assets/js/ui.js','assets/js/app.js',
                 'assets/js/storage.js','assets/js/config.js','assets/js/prompts.js',
                 'assets/js/ai-provider.js','assets/js/data.js','assets/js/genre-template.js'];

console.log('Part 1 — source-code key audit');
const found = new Set();
for (const f of SOURCES) {
    let text = '';
    try { text = readFileSync(new URL(`./${f}`, import.meta.url), 'utf8'); } catch(e) { continue; }
    for (const m of text.matchAll(/tupana_[a-zA-Z0-9_]+/g)) found.add(m[0]);
}
const undocumented = [...found].filter(k =>
    !DOCUMENTED_STATIC.has(k) &&
    !DOCUMENTED_SESSION.has(k) &&
    !DOCUMENTED_DYNAMIC.some(rx => rx.test(k))
);
check('every tupana_* key literal in app sources is documented in the inventory',
      undocumented.length === 0);
if (undocumented.length) console.log('    undocumented keys:', undocumented.join(', '));
check('source audit scanned a plausible key population (>= 30 distinct keys)', found.size >= 30);

// ── Part 2: browser round-trip ───────────────────────────────────────────

console.log('Part 2 — export / clear / import round-trip');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(BASE);
await page.waitForTimeout(400);

const SEED = {
    tupana_draft: 'mi borrador', tupana_lang: 'es', tupana_tone: 'warm',
    tupana_coach_mode: 'gemini', tupana_eval_hint_seen: 'true',
    tupana_progress_collapsed: 'false', tupana_fiveq_stage7_opened_once: 'true',
    tupana_sessions: '[{"d":"2026-06-12"}]', tupana_eval_stats: '{"total":3}',
    tupana_spotlight_off: 'true', tupana_process_log: '[]',
    tupana_writing_s2: 'etapa dos', tupana_step_3: '2', tupana_reflect_shown_4: '1',
};

const r = await page.evaluate((seed) => {
    const out = {};
    localStorage.clear(); sessionStorage.clear();
    Object.entries(seed).forEach(([k, v]) => localStorage.setItem(k, v));
    localStorage.setItem('unrelated_key', 'survive-me');
    sessionStorage.setItem('tupana_warn_dismissed', '1');
    sessionStorage.setItem('tupana_persist_warn', '1');

    // export
    const payload = _buildTupanaExportPayload();
    out.exportHasAllSeeded = Object.keys(seed).every(k => payload[k] === seed[k]);
    out.exportOmitsUnrelated = !('unrelated_key' in payload);
    out.exportOmitsSessionKeys = !('tupana_warn_dismissed' in payload);

    // clear
    _clearTupanaStorage();
    const localGhosts = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('tupana_')) localGhosts.push(k);
    }
    const sessionGhosts = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith('tupana_')) sessionGhosts.push(k);
    }
    out.clearLeavesNoLocalGhosts = localGhosts.length === 0;
    out.clearLeavesNoSessionGhosts = sessionGhosts.length === 0;
    out.clearKeepsUnrelated = localStorage.getItem('unrelated_key') === 'survive-me';

    // import (round-trip)
    const restored = _applyTupanaBackup(payload);
    out.roundTripRestoresAll = Object.keys(seed).every(k => localStorage.getItem(k) === seed[k]);
    out.restoredCount = restored;

    // import refuses arbitrary keys
    localStorage.clear();
    _applyTupanaBackup({ evil_key: 'nope', window_hack: 'nope', tupana_draft: 'ok' });
    out.importRefusesForeignKeys =
        localStorage.getItem('evil_key') === null &&
        localStorage.getItem('window_hack') === null &&
        localStorage.getItem('tupana_draft') === 'ok';

    // legacy backup seeding
    localStorage.clear();
    _applyTupanaBackup({ tupana_draft: 'legacy' });
    out.legacySeedsSchema =
        localStorage.getItem('tupana_schema_version') === '1.0' &&
        localStorage.getItem('tupana_template_id') === 'mixed-genre-autobiographical-essay';

    // cancelled clear deletes nothing
    localStorage.clear();
    Object.entries(seed).forEach(([k, v]) => localStorage.setItem(k, v));
    const origConfirm = window.confirm;
    window.confirm = () => false;
    clearAllData();
    window.confirm = origConfirm;
    out.cancelledClearKeepsData = Object.keys(seed).every(k => localStorage.getItem(k) === seed[k]);

    return out;
}, SEED);

check('export payload contains every seeded tupana_* key (incl. dynamic)', r.exportHasAllSeeded);
check('export omits non-tupana keys', r.exportOmitsUnrelated);
check('export omits sessionStorage transient keys', r.exportOmitsSessionKeys);
check('clear leaves zero tupana_* ghosts in localStorage', r.clearLeavesNoLocalGhosts);
check('clear leaves zero tupana_* ghosts in sessionStorage', r.clearLeavesNoSessionGhosts);
check('clear does not touch non-tupana keys', r.clearKeepsUnrelated);
check('export → clear → import round-trip restores full state', r.roundTripRestoresAll);
check(`import restored expected key count (${r.restoredCount} = ${Object.keys(SEED).length})`,
      r.restoredCount === Object.keys(SEED).length);
check('import refuses non-tupana keys from backup file', r.importRefusesForeignKeys);
check('legacy backup without schema version gets schema/template seeded', r.legacySeedsSchema);
check('cancelled clear (confirm=false) deletes nothing', r.cancelledClearKeepsData);

await browser.close();

console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
process.exit(failed ? 1 : 0);

// ── Manual QA checklist ──────────────────────────────────────────────────
// [ ] Guardar/Exportar → Descargar mi trabajo downloads a JSON containing
//     tupana_lang / tupana_coach_mode / tupana_step_* when present
// [ ] Borrar todo (type BORRAR) → after reload, app is factory-fresh:
//     language selector defaults, onboarding hints reappear, coach mode default
// [ ] Importar trabajo guardado with a pre-P3 backup file → restores normally
