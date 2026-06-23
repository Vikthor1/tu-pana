// Tu Pana de Escritura — storage.js
// Data export, import, and clear-all utilities (export to JSON, restore from backup).
//
// ════════════════════════════════════════════════════════
//  KEY INVENTORY & DISPOSITION POLICY (P3, 2026-06-12)
// ════════════════════════════════════════════════════════
// Export, import, and clear are PREFIX-BASED: they operate on every
// localStorage key beginning with 'tupana_'. New keys added elsewhere in the
// app are covered automatically — the three operations cannot drift apart.
//
// Disposition policy:
//   - localStorage 'tupana_*'  → exported ✓ · imported ✓ · cleared ✓
//     No exceptions. clearAllData() is a full factory reset: the confirm
//     dialog promises permanent deletion, and on shared devices the next
//     student must get factory state (default language/theme/coach mode,
//     one-time hints re-shown, fresh schema seeded by genre-template.js).
//   - sessionStorage 'tupana_*' → NOT exported/imported (transient, tab-scoped)
//     but cleared ✓ by clearAllData(), so a reused tab doesn't suppress
//     first-run warnings for the next student.
//   - Import writes ONLY 'tupana_'-prefixed keys; anything else in the
//     backup file is ignored (a backup must not write arbitrary keys).
//
// Known keys at time of audit (documentation aid — runtime does not depend
// on this list; storage_keys_test.mjs checks source code against it):
//   Static (localStorage): tupana_draft, tupana_draft_saved, tupana_chatlog,
//     tupana_mani_done, tupana_lab_done, tupana_mani_sentence,
//     tupana_decisions, tupana_theme, tupana_lang, tupana_tone,
//     tupana_stage, tupana_process_note, tupana_process_log,
//     tupana_journey_expand, tupana_protected, tupana_report_meta,
//     tupana_mani_claimed, tupana_completion_shown, tupana_capstone,
//     tupana_schema_version, tupana_template_id, tupana_skills_acquired,
//     tupana_sessions, tupana_coach_mode, tupana_eval_stats,
//     tupana_eval_hint_seen, tupana_progress_collapsed,
//     tupana_fiveq_stage7_opened_once, tupana_spotlight_off,
//     tupana_assignment_id
//   Dynamic (localStorage): tupana_writing_s<N>, tupana_step_<stageId>,
//     tupana_reflect_shown_<stageId>
//   sessionStorage (transient): tupana_warn_dismissed, tupana_persist_warn,
//     tupana_voice_challenge_shown

const TUPANA_KEY_PREFIX = 'tupana_';

// All 'tupana_*' keys currently present in the given Storage object.
function _tupanaKeysIn(store) {
    const keys = [];
    try {
        for (let i = 0; i < store.length; i++) {
            const k = store.key(i);
            if (k && k.indexOf(TUPANA_KEY_PREFIX) === 0) keys.push(k);
        }
    } catch(e) {}
    return keys;
}

// Snapshot of all persistent Tu Pana state (localStorage only).
function _buildTupanaExportPayload() {
    const payload = {};
    _tupanaKeysIn(localStorage).forEach(k => {
        try { payload[k] = localStorage.getItem(k); } catch(e) {}
    });
    return payload;
}

// Restore a backup object. Writes only 'tupana_'-prefixed, non-null values.
// Returns the number of keys restored.
function _applyTupanaBackup(data) {
    let restored = 0;
    Object.keys(data).forEach(k => {
        if (k.indexOf(TUPANA_KEY_PREFIX) !== 0) return;
        if (data[k] === null || data[k] === undefined) return;
        try { localStorage.setItem(k, data[k]); restored++; } catch(e) {}
    });
    // Legacy backup files (pre-v1.0) have no schema version — mark them now.
    if (!data['tupana_schema_version']) {
        try { localStorage.setItem('tupana_schema_version', '1.0'); } catch(e) {}
    }
    if (!data['tupana_template_id']) {
        try { localStorage.setItem('tupana_template_id', 'mixed-genre-autobiographical-essay'); } catch(e) {}
    }
    return restored;
}

// Full factory reset: every 'tupana_*' key in localStorage AND sessionStorage.
function _clearTupanaStorage() {
    _tupanaKeysIn(localStorage).forEach(k => {
        try { localStorage.removeItem(k); } catch(e) {}
    });
    try {
        _tupanaKeysIn(sessionStorage).forEach(k => {
            try { sessionStorage.removeItem(k); } catch(e) {}
        });
    } catch(e) {}
}

// ════════════════════════════════════════════════════════
//  DATA EXPORT / IMPORT / CLEAR
// ════════════════════════════════════════════════════════
function exportData() {
    const payload = _buildTupanaExportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tupana-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data || typeof data !== 'object') throw new Error('Invalid file');
                _applyTupanaBackup(data);
                alert('Datos restaurados. La página se recargará.\nData restored. Page will reload.');
                location.reload();
            } catch(err) {
                alert('No se pudo leer el archivo. Asegúrate de que sea un archivo .json exportado de Tu Pana.\nCould not read file. Make sure it is a .json exported from Tu Pana.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearAllData() {
    const confirmed = confirm(
        '¿Estás seguro/a? Se borrarán permanentemente tu borrador, tu conversación con el coach, tus decisiones de revisión, y todas las respuestas de tu nota de proceso.\n\n' +
        'Are you sure? This will permanently delete your draft, your coach conversation, your revision decisions, and all your process note answers.'
    );
    if (!confirmed) return;
    const secondConfirm = prompt(
        'Escribe BORRAR para confirmar. / Type DELETE to confirm:'
    );
    if (secondConfirm !== 'BORRAR' && secondConfirm !== 'DELETE') {
        alert('Cancelado. No se borró nada. / Cancelled. Nothing was deleted.');
        return;
    }
    _clearTupanaStorage();
    alert('Todos tus datos han sido borrados. La página se recargará.\nAll your data has been deleted. Page will reload.');
    location.reload();
}
