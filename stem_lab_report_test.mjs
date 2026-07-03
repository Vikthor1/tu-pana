// stem_lab_report_test.mjs — STEM Lab Report & Scientific Explanation layer regression coverage
// Verifies the stem-lab-report overlay (LINK-ONLY, selectable:false):
//   - ?assignment=stem-lab-report → STEM stage labels, milestone names, task-bar
//     cues, coach stage-entry messages, draft placeholder, pathway label,
//     channelStageName, and persistence across reload without the query param
//   - default (personal-essay) flow keeps ORIGINAL labels + NO STEM leakage
//   - CAP 200 and Research Paper flows show NO STEM leakage
//   - STEM mode carries NO CBO/service-learning and NO personal-essay language
//   - stem-lab-report NEVER appears in the bare-app selector (selectable:false)
//   - 10-stage engine intact; Stage 6 authorship gate blocks the student path
//     and unlocks only after a saved draft; Stage 8 voice framing preserved
//   - assembled system prompt: mandatory rules byte-identical to default and
//     positioned BEFORE the STEM context; per-stage coachFocus replaced with
//     science-writing rules; safety boundaries present (no data fabrication,
//     no science-answer checking, no correctness/validity verification, no
//     grading, no lab-calculation solving, AI-use transparency protected)
//   - final packet / instructor report: gate-tied attestation honest in both
//     gate states; process evidence populates; no correctness/grading language
//
// Run: node stem_lab_report_test.mjs   (requires `node test-server.js` on :3001)

import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const STEM = 'stem-lab-report';
const CAP  = 'cap200-bronx-beautiful-service-learning';
const RP   = 'research-paper';
let passed = 0, failed = 0;
function check(label, cond) {
    const ok = !!cond;
    if (ok) passed++; else failed++;
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
}

const browser = await chromium.launch();
const consoleErrs = [];

async function freshPage(url = BASE + '/') {
    const p = await browser.newPage();
    p.on('pageerror', e => consoleErrs.push(String(e)));
    p.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text()); });
    await p.goto(url);
    await p.evaluate(() => { try { localStorage.clear(); localStorage.setItem('tupana_mani_done','true'); localStorage.setItem('tupana_lab_done','true'); localStorage.setItem('tupana_project_chosen','true'); } catch(e){} });
    await p.goto(url);
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(800);
    return p;
}

// ── A. Default (personal-essay) flow unchanged, no STEM leakage ──
console.log('\n── A. Default flow unchanged, no STEM leak ──');
{
    const p = await freshPage(BASE + '/');
    const r = await p.evaluate(() => ({
        aid: buildChannelData().assignmentId,
        node1: document.querySelector('.stage-node[data-id="1"] .label-en')?.textContent?.trim(),
        labelOverridesNull: [1,2,3,4,5,6,7,8,9,10].every(i => getStageLabelOverride(i, null) === null),
        focusOverridesNull: [1,2,3,4,5,6,7,8,9,10].every(i => getCoachFocusOverride(i, null) === null),
        phNull: getDraftPlaceholderOverride(null) === null,
        welcomeNull: getWelcomeOverride(null) === null,
        bodyHasStem: /Lab Context|Contexto del laboratorio|Scientific Explanation \(CER\)|Voice & Scientific Register/.test(document.body.innerText),
        prompt: buildOllamaSystemPrompt('English')
    }));
    check('default: assignmentId null', r.aid === null);
    check('default: DOM node 1 = Anecdote', r.node1 === 'Anecdote');
    check('default: all label/focus/placeholder/welcome overrides null', r.labelOverridesNull && r.focusOverridesNull && r.phNull && r.welcomeNull);
    check('default: no STEM text in page', !r.bodyHasStem);
    check('default: prompt contains NO STEM context', !/STEM LAB REPORT|lab or experiment|science-answer checker/.test(r.prompt));
    await p.close();
}

// ── B. STEM deep link: activation, rendering, persistence ──
console.log('\n── B. STEM deep link activation + rendering + persistence ──');
{
    const p = await freshPage(BASE + '/?assignment=' + STEM);
    const r = await p.evaluate((ID) => {
        const labels = {}, entries = {}, steps = {}, mss = {};
        [1,2,3,4,5,6,7,8,9,10].forEach(i => { labels[i] = getStageLabelOverride(i, ID); entries[i] = getStageEntryOverride(i, ID); steps[i] = getStageStepOverride(i, 0, ID); });
        [1,2,3,4,5].forEach(m => { mss[m] = getMilestoneLabelOverride(m, ID); });
        return {
            aid: buildChannelData().assignmentId,
            st1en: stLabel(1).en, st7en: stLabel(7).en, st8en: stLabel(8).en, st10en: stLabel(10).en,
            ms1en: msLabel(MILESTONES[0]).en, ms4en: mss[4]?.en,
            allLabels: [1,2,3,4,5,6,7,8,9,10].every(i => labels[i] && labels[i].en && labels[i].es),
            allEntries: [1,2,3,4,5,6,7,8,9,10].every(i => typeof entries[i] === 'string' && entries[i].length > 0),
            allSteps: [1,2,3,4,5,6,7,8,9,10].every(i => steps[i] && steps[i].en && steps[i].es),
            allMs: [1,2,3,4,5].every(m => mss[m] && mss[m].en && mss[m].es),
            entry1: entries[1], entry4: entries[4], entry6: entries[6], entry7: entries[7], entry8: entries[8],
            entriesJoined: [1,2,3,4,5,6,7,8,9,10].map(i => entries[i]).join(' '),
            domNode1: document.querySelector('.stage-node[data-id="1"] .label-en')?.textContent?.trim(),
            domNode7: document.querySelector('.stage-node[data-id="7"] .label-en')?.textContent?.trim(),
            domMs1: document.querySelector('.phase-label.show-en')?.textContent?.trim(),
            dropOpt1: document.querySelector('#mobileStageSelect option')?.textContent?.trim(),
            channelStageName: buildChannelData().stageName,
            draftPh: document.getElementById('draftArea')?.getAttribute('placeholder') || '',
            pathway: getPathwayLabel(ID),
            stageCount: STAGES.length
        };
    }, STEM);
    check('deep link sets assignmentId', r.aid === STEM);
    check('Stage 1 = Lab Context', r.st1en === 'Lab Context');
    check('Stage 7 = Scientific Explanation (CER)', r.st7en === 'Scientific Explanation (CER)');
    check('Stage 8 = Voice & Scientific Register', r.st8en === 'Voice & Scientific Register');
    check('Stage 10 = Process Reflection', r.st10en === 'Process Reflection');
    check('all 10 labels + 10 entries + 10 cues + 5 milestones present', r.allLabels && r.allEntries && r.allSteps && r.allMs);
    check('Milestone 1 = Context & Question', r.ms1en === 'Context & Question');
    check('Milestone 4 = Explain & Revise (CER)', r.ms4en === 'Explain & Revise (CER)');
    check('Stage-1 entry = Lab Context, no Anecdote/Anécdota', /Lab Context/.test(r.entry1) && !/Anecdote|Anécdota/i.test(r.entry1));
    check('Stage-4 entry: never invents data/measurements', /never invent data, measurements|nunca invento datos/i.test(r.entry4));
    check('Stage-6 entry preserves authorship framing (sin el coach)', /without the coach|sin el coach/i.test(r.entry6));
    check('Stage-7 entry names Claim–Evidence–Reasoning', /Claim, Evidence, Reasoning|Afirmación, Evidencia, Razonamiento/.test(r.entry7));
    check('Stage-8 entry preserves voice protection (sin borrar)', /without erasing your language|sin borrar tu idioma/i.test(r.entry8));
    check('STEM entries carry NO CBO/service-learning language', !/CBO|service-learning|aprendizaje-servicio/i.test(r.entriesJoined));
    check('draft placeholder cues own data/observations', /your own data and observations|tus propios datos/i.test(r.draftPh));
    check('draft placeholder: no CBO, no essay starter', !/CBO/.test(r.draftPh) && !/La primera vez que/.test(r.draftPh));
    check('DOM node 1 = Lab Context', r.domNode1 === 'Lab Context');
    check('DOM node 7 = Scientific Explanation (CER)', r.domNode7 === 'Scientific Explanation (CER)');
    check('DOM milestone 1 = 1. Context & Question', r.domMs1 === '1. Context & Question');
    check('dropdown option 1 = Contexto del laboratorio', /Contexto del laboratorio/.test(r.dropOpt1 || ''));
    check('channelStageName carries STEM label', /Lab Context/.test(r.channelStageName));
    check('pathway label = Lab Report / Informe de laboratorio', r.pathway && r.pathway.en === 'Lab Report' && r.pathway.es === 'Informe de laboratorio');
    check('engine still 10 stages', r.stageCount === 10);

    // Stage-6 gate on the STUDENT path, then unlock + persistence
    const g1 = await p.evaluate(() => {
        onStageClick(STAGES[6]);
        const lastSys = Array.from(document.querySelectorAll('.live-sys-notes')).pop()?.textContent || '';
        return { stage: state.stage,
                 node7locked: document.querySelector('.stage-node[data-id="7"]')?.classList.contains('locked'),
                 gateMsg: /guarda tu primer borrador|saved first draft/i.test(lastSys) };
    });
    check('gate: Stage 7 blocked via student path before draft saved', g1.stage !== 7);
    check('gate: node 7 locked + gate message shown', g1.node7locked === true && g1.gateMsg === true);
    await p.evaluate(() => { try { localStorage.setItem('tupana_draft_saved','true'); localStorage.setItem('tupana_stage','6'); localStorage.setItem('tupana_draft','Mis datos del laboratorio muestran un patrón.'); } catch(e){} });
    await p.goto(BASE + '/'); // no query param — persistence check
    await p.waitForLoadState('networkidle'); await p.waitForTimeout(800);
    const g2 = await p.evaluate(() => { onStageClick(STAGES[6]); return { stage: state.stage, aid: buildChannelData().assignmentId }; });
    check('assignment persists across reload without query param', g2.aid === STEM);
    check('gate: Stage 7 unlocks after saved draft', g2.stage === 7);
    await p.close();
}

// ── C. Assembled system prompt: hierarchy + STEM safety boundaries ──
console.log('\n── C. System prompt hierarchy + coach safety boundaries ──');
{
    const p = await freshPage(BASE + '/?assignment=' + STEM);
    const r = await p.evaluate(() => {
        const stemPrompt = buildOllamaSystemPrompt('English');
        const saved = state.assignmentId; state.assignmentId = null;
        const defPrompt = buildOllamaSystemPrompt('English');
        state.assignmentId = saved;
        const F = {}; for (let i = 1; i <= 10; i++) F[i] = (stemPrompt.match(new RegExp('^Stage ' + i + ': .*$', 'm')) || [''])[0];
        return { stemPrompt, defPrompt, F };
    });
    const P = r.stemPrompt, D = r.defPrompt, F = r.F;
    const mandatory = ['ABSOLUTE AUTHORSHIP RULE', 'NO SAMPLE STUDENT PROSE', 'SENTENCE-FRAME RULE', 'TRANSITION HELP RULE'];
    check('all 4 mandatory blocks present', mandatory.every(m => P.includes(m)));
    check('mandatory blocks byte-identical to default prompt', mandatory.every(m => P.slice(P.indexOf(m), P.indexOf(m) + 400) === D.slice(D.indexOf(m), D.indexOf(m) + 400)));
    check('STEM context appears AFTER all mandatory rules', mandatory.every(m => P.indexOf('ASSIGNMENT CONTEXT') > P.indexOf(m)));
    check('deference closer present (rules never relaxed)', /remain in full force and are never relaxed/.test(P));
    check('Stage 1 focus = lab context (no memory/anecdote)', /lab or experiment/.test(F[1]) && !/memory|anecdote/i.test(F[1]));
    check('Stage 4 focus: NEVER invent/estimate/complete data; no solving calculations', /NEVER invent, estimate, complete/.test(F[4]) && /Do not solve lab calculations/.test(F[4]));
    check('Stage 5 focus: does not tell what the data shows', /do not tell them what the data shows/.test(F[5]));
    check('Stage 6 focus: unassisted draft, gate language intact', /unassisted first-draft stage/.test(F[6]) && /until the student has saved a first draft/.test(F[6]));
    check('Stage 7 focus: CER canonical questions present', /Where is the evidence for this claim\?/.test(F[7]) && /What course concept explains this pattern\?/.test(F[7]) && /limitation might affect how strongly/.test(F[7]));
    check('Stage 7 focus: no correctness confirmation; student reasons', /do not confirm the explanation is scientifically correct/.test(F[7]));
    check('Stage 8 focus: preserve voice; no replacement prose; no flattening', /preserving their language, perspective, and voice/.test(F[8]) && /Do not rewrite sentences into polished replacement prose/.test(F[8]));
    check('Stage 9 focus: no certification, no grading', /do not certify the report as scientifically correct/.test(F[9]) && /do not grade it/.test(F[9]));
    check('Stage 10 focus: no correct/complete/verified/graded claims', /do not claim the report is correct, complete, verified, or graded/.test(F[10]));
    check('no essay residue in any stage line', [1,2,3,4,5,6,7,8,9,10].every(i => !/anecdote|bridge sentence|pitch|autobiographical/i.test(F[i])));
    const authorshipClause = /(do not|don't|never)\s[^.]*\b(write|generate|invent|supply|rewrite|build|solve|tell|certify|confirm|declare|judge|grade|claim|correct)/i;
    check('every STEM stage line carries an authorship-protective clause', [1,2,3,4,5,6,7,8,9,10].every(i => authorshipClause.test(F[i])));
    const ctx = P.slice(P.indexOf('ASSIGNMENT CONTEXT'));
    check('missing-evidence-first: ask before commenting on results', /ask the student for it before commenting on results/.test(ctx));
    check('no fabrication (incl. calculations/constants, not even as examples)', /NEVER invent, fabricate, estimate, complete, or adjust data, observations, measurements, results, calculations, constants/.test(ctx) && /not even as examples/.test(ctx));
    check('not a science-answer checker or grader', /not a science-answer checker or grader/.test(ctx));
    check('no correctness confirmation / validity verification / grade prediction', /do not confirm or reject the scientific correctness/.test(ctx) && /do not verify experimental validity/.test(ctx) && /do not predict or assign a grade/.test(ctx));
    check('"is this right?" redirect to data/concepts/instructor', /redirect them to their own data, their course concepts/.test(ctx));
    check('no solving lab calculations', /Do not solve lab calculations for the student/.test(ctx));
    check('AI-use transparency protected', /Never remove, weaken, or help hide AI-use transparency/.test(ctx));
    await p.close();
}

// ── D. Final packet / process evidence under STEM ──
console.log('\n── D. Final packet + gate-tied attestation ──');
{
    const DRAFT = 'Purpose: my lab asked whether plant growth changes with light. My claim is that light increased growth because photosynthesis converts light to energy. One limitation is temperature was not controlled.';
    const p = await freshPage(BASE + '/?assignment=' + STEM);
    await p.evaluate((d) => {
        localStorage.setItem('tupana_stage', '10');
        localStorage.setItem('tupana_draft', d);
        localStorage.setItem('tupana_draft_saved', 'true');
        localStorage.setItem('tupana_writing_s7', d + ' REVISED after CER feedback.');
        localStorage.setItem('tupana_decisions', JSON.stringify([{ q: 'Where is the evidence for this claim?', choice: 'accepted', stage: 7, t: 1751400000000 }]));
    }, DRAFT);
    await p.reload(); await p.waitForTimeout(1200);
    let r = await p.evaluate(() => ({ aid: buildChannelData().assignmentId, rep: generateInstructorReport(), revised: getFinalEssay().revised }));
    check('packet: STEM active at Stage 10', r.aid === STEM);
    check('packet: report generates end-to-end', typeof r.rep === 'string' && r.rep.includes('END OF REPORT'));
    check('packet: authorship gate PASSED + attestation ☑', /Authorship gate\s*:\s*PASSED/.test(r.rep) && /☑\s+I completed my first draft/.test(r.rep));
    check('packet: student CER content present as student work', r.rep.includes('My claim is that light increased growth'));
    check('packet: revised draft recognized', r.revised === true && /Revised draft present/.test(r.rep));
    check('packet: decision log shows CER coaching question', /Where is the evidence for this claim\?/.test(r.rep));
    check('packet: no correctness-verification language', !/scientifically (correct|verified|accurate)|verified the (science|results|data|experiment)/i.test(r.rep));
    check('packet: not auto-submitted (process evidence framing)', /has NOT been automatically submitted/.test(r.rep));
    // gate NOT passed → honest attestation
    await p.evaluate(() => { localStorage.removeItem('tupana_draft_saved'); localStorage.removeItem('tupana_writing_s7'); localStorage.setItem('tupana_stage', '6'); });
    await p.reload(); await p.waitForTimeout(1000);
    r = await p.evaluate(() => ({ rep: generateInstructorReport() }));
    check('packet: gate not passed → NOT DOCUMENTED + ☐ attestation', /Authorship gate\s*:\s*NOT DOCUMENTED/.test(r.rep) && /☐\s+I completed my first draft/.test(r.rep) && /NOT documented: no unassisted first draft was saved/.test(r.rep));
    await p.close();
}

// ── E. Cross-genre leakage + selector exclusion ──
console.log('\n── E. CAP/research no-leak + selector exclusion ──');
for (const [id, expect1] of [[CAP, 'Community Starting Point'], [RP, 'Topic & Context']]) {
    const p = await freshPage(BASE + '/?assignment=' + id);
    const r = await p.evaluate(() => ({
        node1: document.querySelector('.stage-node[data-id="1"] .label-en')?.textContent?.trim(),
        bodyHasStem: /Contexto del laboratorio|Scientific Explanation \(CER\)|Voice & Scientific Register/.test(document.body.innerText),
        promptHasStem: /STEM LAB REPORT|science-answer checker/.test(buildOllamaSystemPrompt('English'))
    }));
    check(`${id}: node 1 = ${expect1}`, r.node1 === expect1);
    check(`${id}: no STEM text in page or prompt`, !r.bodyHasStem && !r.promptHasStem);
    await p.close();
}
{
    const p = await browser.newPage();
    p.on('pageerror', e => consoleErrs.push(String(e)));
    await p.goto(BASE + '/');
    await p.evaluate(() => { try { localStorage.clear(); } catch(e){} });
    await p.goto(BASE + '/');
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => ({
        selectable: getSelectableProfiles().map(x => x.assignmentId),
        selectorHasStem: /Informe de laboratorio/.test(document.body.innerText)
    }));
    check('selectable profiles exclude stem-lab-report', !r.selectable.includes('stem-lab-report'));
    check('first-run selector shows no STEM card', !r.selectorHasStem);
    await p.close();
}

check('zero console/page errors across all pathways', consoleErrs.length === 0);
if (consoleErrs.length) console.log('  errors:', consoleErrs.slice(0, 5));
console.log(`\nstem_lab_report_test: ${passed} passed, ${failed} failed`);
await browser.close();
process.exit(failed ? 1 : 0);
