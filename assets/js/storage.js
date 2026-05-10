// Tu Pana de Escritura — storage.js
// Data export, import, and clear-all utilities (export to JSON, restore from backup).

// ════════════════════════════════════════════════════════
//  DATA EXPORT / IMPORT / CLEAR
// ════════════════════════════════════════════════════════
function exportData() {
    const payload = {};
    const keys = ['tupana_draft','tupana_draft_saved','tupana_chatlog','tupana_mani_done',
                  'tupana_lab_done','tupana_mani_sentence','tupana_decisions','tupana_theme',
                  'tupana_lang', 'tupana_stage','tupana_process_note','tupana_journey_expand',
                  'tupana_protected','tupana_report_meta','tupana_mani_claimed','tupana_completion_shown',
                  'tupana_capstone'];
    keys.forEach(k => {
        try { payload[k] = localStorage.getItem(k); } catch(e) {}
    });
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
                Object.keys(data).forEach(k => {
                    if (data[k] !== null && data[k] !== undefined) {
                        localStorage.setItem(k, data[k]);
                    }
                });
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
    const keys = ['tupana_draft','tupana_draft_saved','tupana_chatlog','tupana_mani_done',
                  'tupana_lab_done','tupana_mani_sentence','tupana_decisions','tupana_theme',
                  'tupana_stage','tupana_process_note','tupana_journey_expand',
                  'tupana_protected','tupana_report_meta','tupana_mani_claimed','tupana_completion_shown'];
    keys.forEach(k => { try { localStorage.removeItem(k); } catch(e) {} });
    alert('Todos tus datos han sido borrados. La página se recargará.\nAll your data has been deleted. Page will reload.');
    location.reload();
}

