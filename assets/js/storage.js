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
//     tupana_mani_done, tupana_lab_done, tupana_onboarding_complete,
//     tupana_mani_sentence,
//     tupana_decisions, tupana_theme, tupana_lang, tupana_tone,
//     tupana_stage, tupana_process_note, tupana_process_log,
//     tupana_journey_expand, tupana_protected, tupana_report_meta,
//     tupana_mani_claimed, tupana_completion_shown, tupana_capstone,
//     tupana_schema_version, tupana_template_id, tupana_skills_acquired,
//     tupana_sessions, tupana_coach_mode, tupana_eval_stats,
//     tupana_eval_hint_seen, tupana_progress_collapsed,
//     tupana_fiveq_stage7_opened_once, tupana_spotlight_off,
//     tupana_assignment_id, tupana_project_chosen, tupana_ai_cue_seen,
//     tupana_full_draft_reviews, tupana_ai_usage, tupana_revision_checkpoint,
//     tupana_council_runs, tupana_tutorial_done (written by start-here.html),
//     tupana_backup_manifest, tupana_pre_import_snapshot
//   Dynamic (localStorage): tupana_writing_s<N>, tupana_step_<stageId>,
//     tupana_reflect_shown_<stageId>
//   sessionStorage (transient): tupana_warn_dismissed, tupana_persist_warn,
//     tupana_voice_challenge_shown

const TUPANA_KEY_PREFIX = 'tupana_';
const TUPANA_PRE_IMPORT_SNAPSHOT_KEY = 'tupana_pre_import_snapshot';
const _tupanaUnsavedWrites = new Map();
const _tupanaFailedArtifacts = new Set();

function _tupanaArtifactLabel(key, fallback) {
    if (fallback) return fallback;
    if (key === 'tupana_chatlog') return 'coach conversation';
    if (key === 'tupana_decisions') return 'revision decisions';
    if (key === 'tupana_process_note') return 'process note';
    if (key === 'tupana_capstone') return 'final reflection';
    if (key === 'tupana_protected') return 'Voice Vault';
    if (key === 'tupana_council_runs') return 'Review Council work';
    if (key === 'tupana_draft' || /^tupana_writing_s\d+$/.test(key)) return 'draft';
    return 'student work';
}

function _renderStorageFailureBanner() {
    if (typeof document === 'undefined' || !document.body) {
        if (typeof setTimeout === 'function') setTimeout(_renderStorageFailureBanner, 0);
        return;
    }
    let banner = document.getElementById('storageFailureBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'storageFailureBanner';
        banner.className = 'storage-failure-banner';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('aria-live', 'assertive');
        const message = document.createElement('span');
        message.id = 'storageFailureMessage';
        const exportBtn = document.createElement('button');
        exportBtn.type = 'button';
        exportBtn.textContent = 'Descargar respaldo de emergencia · Download emergency backup';
        exportBtn.addEventListener('click', exportEmergencyData);
        banner.append(message, exportBtn);
        document.body.prepend(banner);
    }
    const names = Array.from(_tupanaFailedArtifacts);
    const message = banner.querySelector('#storageFailureMessage');
    if (message) message.textContent = `No se guardó: ${names.join(', ')}. No cierres esta página. · Not saved: ${names.join(', ')}. Do not close this page.`;
}

// Shared R0 write contract. Failed values remain in memory and are folded into
// the emergency export, so a quota/private-mode failure never disappears silently.
function tupanaSafeSetItem(key, value, artifactLabel) {
    try {
        localStorage.setItem(key, value);
        _tupanaUnsavedWrites.delete(key);
        return true;
    } catch (error) {
        const artifact = _tupanaArtifactLabel(key, artifactLabel);
        _tupanaUnsavedWrites.set(key, String(value));
        _tupanaFailedArtifacts.add(artifact);
        _renderStorageFailureBanner();
        console.error('[Tu Pana] Storage write failed', { key, artifact, error });
        return false;
    }
}

function tupanaSafeWriteBatch(entries, artifactLabel) {
    const before = new Map();
    entries.forEach(([key]) => {
        try { before.set(key, localStorage.getItem(key)); } catch (e) { before.set(key, null); }
    });
    let ok = true;
    entries.forEach(([key, value]) => {
        if (!tupanaSafeSetItem(key, value, artifactLabel)) ok = false;
    });
    if (!ok) {
        entries.forEach(([key, value]) => {
            try {
                const oldValue = before.get(key);
                if (oldValue === null) localStorage.removeItem(key);
                else localStorage.setItem(key, oldValue);
            } catch (error) {}
            _tupanaUnsavedWrites.set(key, String(value));
        });
        _tupanaFailedArtifacts.add(_tupanaArtifactLabel(entries[0] && entries[0][0], artifactLabel));
        _renderStorageFailureBanner();
    }
    return ok;
}

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
function _buildTupanaExportPayload(options = {}) {
    const payload = {};
    _tupanaKeysIn(localStorage).forEach(k => {
        try { payload[k] = localStorage.getItem(k); } catch(e) {}
    });
    _tupanaUnsavedWrites.forEach((value, key) => { payload[key] = value; });
    if (options.includeLiveDraft !== false && typeof document !== 'undefined') {
        const area = document.getElementById('draftArea');
        if (area && area.value) {
            let stage = 0;
            try { stage = Number((typeof state !== 'undefined' && state.stage) || localStorage.getItem('tupana_stage') || 0); } catch (e) {}
            if (stage) payload[`tupana_writing_s${stage}`] = area.value;
            if (stage === 6) payload.tupana_draft = area.value;
        }
    }
    if (options.includeManifest !== false) {
        const exportedAt = new Date().toISOString();
        const artifacts = Object.keys(payload)
            .filter(k => k === 'tupana_draft' || /^tupana_writing_s\d+$/.test(k) || [
                'tupana_chatlog', 'tupana_decisions', 'tupana_process_note',
                'tupana_capstone', 'tupana_protected', 'tupana_council_runs'
            ].includes(k))
            .map(k => ({ key: k, words: _tupanaWordCount(payload[k]), modifiedAt: exportedAt }));
        payload.tupana_backup_manifest = JSON.stringify({ version: 1, exportedAt, artifacts });
    }
    return payload;
}

function _tupanaWordCount(value) {
    const text = String(value == null ? '' : value).replace(/[{}[\]":,]/g, ' ');
    return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// Restore a backup object. Writes only 'tupana_'-prefixed, non-null values.
// Returns the number of keys restored.
function _applyTupanaBackup(data) {
    let restored = 0;
    Object.keys(data).forEach(k => {
        if (k.indexOf(TUPANA_KEY_PREFIX) !== 0) return;
        if (data[k] === null || data[k] === undefined) return;
        if (tupanaSafeSetItem(k, data[k], _tupanaArtifactLabel(k))) restored++;
    });
    // Legacy backup files (pre-v1.0) have no schema version — mark them now.
    if (!data['tupana_schema_version']) {
        tupanaSafeSetItem('tupana_schema_version', '1.0', 'backup metadata');
    }
    if (!data['tupana_template_id']) {
        tupanaSafeSetItem('tupana_template_id', 'mixed-genre-autobiographical-essay', 'backup metadata');
    }
    return restored;
}

// Full factory reset: every 'tupana_*' key in localStorage AND sessionStorage.
function _clearTupanaStorage() {
    let ok = true;
    _tupanaKeysIn(localStorage).forEach(k => {
        try { localStorage.removeItem(k); } catch(e) { ok = false; }
    });
    try {
        _tupanaKeysIn(sessionStorage).forEach(k => {
            try { sessionStorage.removeItem(k); } catch(e) { ok = false; }
        });
    } catch(e) { ok = false; }
    return ok && _tupanaKeysIn(localStorage).length === 0;
}

// ════════════════════════════════════════════════════════
//  DATA EXPORT / IMPORT / CLEAR
// ════════════════════════════════════════════════════════
function _downloadTupanaPayload(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
}

function exportData(prefix = 'tupana-backup') {
    const payload = _buildTupanaExportPayload();
    return _downloadTupanaPayload(payload, `${prefix}-${new Date().toISOString().slice(0,10)}.json`);
}

function exportEmergencyData() {
    return _downloadTupanaPayload(
        _buildTupanaExportPayload(),
        `tupana-emergency-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
}

function _closeR0SafetyOverlay(id) {
    const overlay = document.getElementById(id);
    if (overlay) overlay.remove();
}

function _importArtifactRows(data, file) {
    let manifest = {};
    try { manifest = JSON.parse(data.tupana_backup_manifest || '{}'); } catch (e) {}
    const byKey = new Map((manifest.artifacts || []).map(item => [item.key, item]));
    const fallbackDate = manifest.exportedAt || (file.lastModified ? new Date(file.lastModified).toISOString() : 'Date unavailable');
    return Object.keys(data)
        .filter(k => k === 'tupana_draft' || /^tupana_writing_s\d+$/.test(k) || [
            'tupana_chatlog', 'tupana_decisions', 'tupana_process_note',
            'tupana_capstone', 'tupana_protected', 'tupana_council_runs'
        ].includes(k))
        .sort()
        .map(k => {
            const meta = byKey.get(k) || {};
            return { key: k, words: Number.isFinite(meta.words) ? meta.words : _tupanaWordCount(data[k]), date: meta.modifiedAt || fallbackDate };
        });
}

function _tupanaEscapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _formatBackupDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Sin fecha registrada · No date recorded' : date.toLocaleString();
}

function _replaceTupanaBackup(data) {
    const snapshotRaw = (() => { try { return localStorage.getItem(TUPANA_PRE_IMPORT_SNAPSHOT_KEY); } catch (e) { return null; } })();
    try {
        _tupanaKeysIn(localStorage).forEach(k => {
            if (k !== TUPANA_PRE_IMPORT_SNAPSHOT_KEY) localStorage.removeItem(k);
        });
    } catch (error) {
        _tupanaFailedArtifacts.add('backup replacement');
        _renderStorageFailureBanner();
        return false;
    }
    let ok = true;
    Object.keys(data).forEach(k => {
        if (k.indexOf(TUPANA_KEY_PREFIX) !== 0 || k === TUPANA_PRE_IMPORT_SNAPSHOT_KEY || data[k] == null) return;
        if (!tupanaSafeSetItem(k, data[k], _tupanaArtifactLabel(k, 'imported work'))) ok = false;
    });
    if (!data.tupana_schema_version) ok = tupanaSafeSetItem('tupana_schema_version', '1.0', 'backup metadata') && ok;
    if (!data.tupana_template_id) ok = tupanaSafeSetItem('tupana_template_id', 'mixed-genre-autobiographical-essay', 'backup metadata') && ok;
    if (snapshotRaw) tupanaSafeSetItem(TUPANA_PRE_IMPORT_SNAPSHOT_KEY, snapshotRaw, 'pre-import snapshot');
    return ok;
}

function _openImportPreview(data, file) {
    _closeR0SafetyOverlay('importPreviewOverlay');
    const rows = _importArtifactRows(data, file);
    const overlay = document.createElement('div');
    overlay.id = 'importPreviewOverlay';
    overlay.className = 'r0-safety-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'importPreviewTitle');
    overlay.innerHTML = `<div class="r0-safety-card">
        <h2 id="importPreviewTitle">Revisar antes de reemplazar · Review before replacing</h2>
        <p>Esta copia reemplazará el trabajo de Tu Pana en este navegador. Primero crearemos una instantánea y descargaremos un respaldo de seguridad. · This backup will replace Tu Pana work in this browser. First we will create a snapshot and download a safety backup.</p>
        <ul class="r0-preview-list">${rows.length ? rows.map(row => `<li><strong>${_tupanaEscapeHtml(row.key)}</strong> — ${row.words} palabras · words — ${_tupanaEscapeHtml(_formatBackupDate(row.date))}</li>`).join('') : '<li>No student-work artifacts found · No se encontraron artefactos</li>'}</ul>
        <div class="r0-safety-actions">
            <button type="button" data-action="cancel">Cancelar · Cancel</button>
            <button type="button" data-action="backup">Descargar trabajo actual · Download current work</button>
            <button type="button" class="r0-danger" data-action="replace">Reemplazar · Replace</button>
        </div>
    </div>`;
    overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => _closeR0SafetyOverlay(overlay.id));
    overlay.querySelector('[data-action="backup"]').addEventListener('click', () => exportData('tupana-pre-import-safety'));
    overlay.querySelector('[data-action="replace"]').addEventListener('click', () => {
        const current = _buildTupanaExportPayload({ includeManifest: true });
        const snapshot = JSON.stringify({ createdAt: new Date().toISOString(), data: current });
        if (!tupanaSafeSetItem(TUPANA_PRE_IMPORT_SNAPSHOT_KEY, snapshot, 'pre-import snapshot')) return;
        _downloadTupanaPayload(current, `tupana-pre-import-safety-${new Date().toISOString().slice(0,10)}.json`);
        if (!_replaceTupanaBackup(data)) return;
        alert('Datos reemplazados con respaldo de seguridad. La página se recargará.\nWork replaced with a safety backup. The page will reload.');
        location.reload();
    });
    document.body.appendChild(overlay);
    overlay.querySelector('[data-action="cancel"]').focus();
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
                const importable = Object.keys(data).some(k => k.indexOf(TUPANA_KEY_PREFIX) === 0);
                if (!importable) throw new Error('No Tu Pana data');
                _openImportPreview(data, file);
            } catch(err) {
                alert('No se pudo leer el archivo. Asegúrate de que sea un archivo .json exportado de Tu Pana.\nCould not read file. Make sure it is a .json exported from Tu Pana.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearAllData() {
    _closeR0SafetyOverlay('clearDataOverlay');
    const overlay = document.createElement('div');
    overlay.id = 'clearDataOverlay';
    overlay.className = 'r0-safety-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'clearDataTitle');
    overlay.innerHTML = `<div class="r0-safety-card">
        <h2 id="clearDataTitle">Borrar todo el trabajo · Erase all work</h2>
        <p>Esto borra permanentemente el borrador, la conversación, las decisiones y la nota de proceso de este navegador. Descarga un respaldo primero. · This permanently erases the draft, conversation, decisions, and process note from this browser. Download a backup first.</p>
        <button type="button" data-action="backup">Descargar respaldo · Download backup</button>
        <label for="clearDataPhrase"><strong>Escribe BORRAR o DELETE para confirmar · Type BORRAR or DELETE to confirm</strong></label>
        <input class="r0-safety-input" id="clearDataPhrase" autocomplete="off">
        <div class="r0-safety-actions">
            <button type="button" data-action="cancel">Cancelar · Cancel</button>
            <button type="button" class="r0-danger" data-action="erase" disabled>Borrar permanentemente · Erase permanently</button>
        </div>
    </div>`;
    const input = overlay.querySelector('#clearDataPhrase');
    const erase = overlay.querySelector('[data-action="erase"]');
    input.addEventListener('input', () => { erase.disabled = !['BORRAR', 'DELETE'].includes(input.value.trim()); });
    overlay.querySelector('[data-action="backup"]').addEventListener('click', () => exportData());
    overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => _closeR0SafetyOverlay(overlay.id));
    erase.addEventListener('click', () => {
        if (!['BORRAR', 'DELETE'].includes(input.value.trim())) return;
        if (!_clearTupanaStorage()) {
            alert('No se pudo borrar todo. Tu trabajo puede seguir en este navegador; descarga un respaldo y avisa a tu instructor/a.\nNot everything could be erased. Your work may remain in this browser; download a backup and notify your instructor.');
            return;
        }
        alert('Todos tus datos han sido borrados. La página se recargará.\nAll your data has been deleted. Page will reload.');
        location.reload();
    });
    document.body.appendChild(overlay);
    input.focus();
}
