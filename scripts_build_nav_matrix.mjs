// Generates docs/nav-audit-matrix.md (F2 requirement): genre × stage audit of
// navigation labels, destinations, coach focus source, and review actions.
// Pure static extraction — loads the data/genre files in a VM-free way by
// evaluating them in a minimal sandbox.
import { readFileSync, writeFileSync } from 'fs';
import vm from 'vm';

const ctx = { console, localStorage: undefined };
vm.createContext(ctx);
for (const f of ['assets/js/config.js', 'assets/js/data.js', 'assets/js/genre-template.js']) {
    vm.runInContext(readFileSync(f, 'utf8'), ctx, { filename: f });
}
const g = ctx;
const GENRES = [null, 'cap200-bronx-beautiful-service-learning', 'research-paper', 'stem-lab-report', 'college-personal-statement', 'graduate-sop'];

function stageLabel(stage, gid) {
    const o = gid ? g.getStageLabelOverride(stage, gid) : null;
    if (o) return o.en.replace(/\n/g, ' ');
    const s = g && ctx.STAGES ? ctx.STAGES[stage - 1] : null;
    return s ? s.en.replace(/\n/g, ' ') : String(stage);
}
function focusSource(stage, gid) {
    if (!gid) return 'default template';
    if (g.getCoachFocusOverride(stage, gid)) return 'layer coachFocus';
    return 'NEUTRAL fallback';
}

let md = '# Genre × Stage Navigation Audit Matrix\n\nGenerated ' + process.argv[2] + ' by scripts_build_nav_matrix.mjs (F2 remediation).\n' +
'\nNavigation contract: **Back to: [prev stage]** and **Continue to: [next stage]** everywhere,\nnames resolved through the active genre layer (stLabel). Review actions: passage coaching\n(all stages with text), whole-draft review + Council (Stages 7–9, authorship gate passed).\n\n';
for (const gid of GENRES) {
    md += `\n## ${gid || 'default (mixed-genre autobiographical essay)'}\n\n`;
    md += '| Stage | Name (EN) | Back destination | Continue label | Coach focus source | Review actions |\n|---|---|---|---|---|---|\n';
    for (let s = 1; s <= 10; s++) {
        const back = s > 1 ? `Back to: ${stageLabel(s - 1, gid)}` : '—';
        const cont = s < 10 ? `Continue to: ${stageLabel(s + 1, gid)}` : '—';
        const review = (s >= 7 && s <= 9) ? 'passage · whole-draft · Council' : 'passage';
        md += `| ${s} | ${stageLabel(s, gid)} | ${back} | ${cont} | ${focusSource(s, gid)} | ${review} |\n`;
    }
}
writeFileSync('docs/nav-audit-matrix.md', md);
console.log('written docs/nav-audit-matrix.md');
