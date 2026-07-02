// cap200_labels_test.mjs — Stage B.1 regression coverage
// Verifies CAP 200 Surface Label + Coach Entry Alignment:
//   - CAP 200 profile active → service-learning-aware stage labels, milestone
//     names, task-bar cues, and coach stage-entry messages
//   - default (personal-essay) flow keeps ORIGINAL labels + coach-entry wording
//   - NO CAP 200 label/entry leaks into the default/generic flow
//   - 10-stage engine intact; Stage 6 authorship + Stage 8 voice framing preserved
//   - selector + deep link + assignment persistence still resolve CAP 200
//
// Run: node cap200_labels_test.mjs   (requires `node test-server.js` on :3001)

import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const CAP = 'cap200-bronx-beautiful-service-learning';
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
    await p.evaluate(() => { try { localStorage.clear(); localStorage.setItem('tupana_mani_done','true'); localStorage.setItem('tupana_lab_done','true'); } catch(e){} });
    await p.goto(url);
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(800);
    return p;
}

// ── A. Default (personal-essay) flow keeps ORIGINAL labels + coach entries ──
console.log('\n── A. Default flow unchanged ──');
{
    const p = await freshPage(BASE + '/');
    const r = await p.evaluate(() => ({
        aid: buildChannelData().assignmentId,
        st1: stLabel(1),
        ms1: msLabel(MILESTONES[0]),
        entryOverride1: getStageEntryOverride(1, null),
        labelOverridesNull: [1,2,3,4,5,6,7,8,9,10].every(i => getStageLabelOverride(i, buildChannelData().assignmentId) === null),
        domNode1: document.querySelector('.stage-node[data-id="1"] .label-en')?.textContent?.trim(),
        domMs1: document.querySelector('.phase-label.show-en')?.textContent?.trim(),
        channelStageName: buildChannelData().stageName,
        stageCount: STAGES.length,
        draftPh: document.getElementById('draftArea')?.getAttribute('placeholder') || '',
        phOverrideNull: getDraftPlaceholderOverride(null) === null
    }));
    check('default assignmentId is null', r.aid === null);
    check('default draft-placeholder override is null (no leakage)', r.phOverrideNull === true);
    check('default draft placeholder keeps personal-essay starters', /La primera vez que|propias palabras/.test(r.draftPh));
    check('default draft placeholder has no CBO cue', !/CBO/.test(r.draftPh));
    check('default Stage 1 label = Anecdote / Anécdota', r.st1.en === 'Anecdote' && r.st1.es === 'Anécdota');
    check('default Milestone 1 = Find Your Story', r.ms1.en === 'Find Your Story');
    check('default has NO stage-entry override (falls back)', r.entryOverride1 === null);
    check('default: all 10 stage-label overrides null (no leakage)', r.labelOverridesNull === true);
    check('default DOM journey node 1 = Anecdote', r.domNode1 === 'Anecdote');
    check('default DOM milestone 1 = Find Your Story', r.domMs1 === '1. Find Your Story');
    check('default channelStageName = Anécdota / Anecdote', r.channelStageName === 'Anécdota / Anecdote');
    check('engine still 10 stages (default)', r.stageCount === 10);
    await p.close();
}

// ── B. CAP 200 (deep link) resolves service-learning labels + coach entries ──
console.log('\n── B. CAP 200 deep link ──');
{
    const p = await freshPage(BASE + '/?assignment=' + CAP);
    const r = await p.evaluate((CAP) => {
        const entries = {}; const labels = {};
        for (let i = 1; i <= 10; i++) { entries[i] = getStageEntryOverride(i, CAP); labels[i] = getStageLabelOverride(i, CAP); }
        return {
            aid: buildChannelData().assignmentId,
            st1: stLabel(1),
            ms1: msLabel(MILESTONES[0]),
            entry1: getStageEntryOverride(1, CAP),
            entry6: getStageEntryOverride(6, CAP),
            entry8: getStageEntryOverride(8, CAP),
            allLabels: [1,2,3,4,5,6,7,8,9,10].every(i => labels[i] && labels[i].en && labels[i].es),
            allEntries: [1,2,3,4,5,6,7,8,9,10].every(i => typeof entries[i] === 'string' && entries[i].length > 0),
            domNode1: document.querySelector('.stage-node[data-id="1"] .label-en')?.textContent?.trim(),
            domMs1: document.querySelector('.phase-label.show-en')?.textContent?.trim(),
            header: document.getElementById('headerSub')?.innerText?.replace(/\s+/g,' ').trim(),
            dropOpt1: document.querySelector('#mobileStageSelect option')?.textContent?.trim(),
            channelStageName: buildChannelData().stageName,
            stageCount: STAGES.length,
            stage6Id: (STAGES.find(s => s.id === 6) || {}).id,
            stage8Id: (STAGES.find(s => s.id === 8) || {}).id,
            draftPh: document.getElementById('draftArea')?.getAttribute('placeholder') || '',
            phOverride: getDraftPlaceholderOverride(CAP)
        };
    }, CAP);
    check('CAP 200 deep link sets assignmentId', r.aid === CAP);
    check('CAP draft-placeholder override present with CBO cue', typeof r.phOverride === 'string' && /CBO/.test(r.phOverride));
    check('CAP draft placeholder cues CBO + community/service', /CBO/.test(r.draftPh) && /comunitario|community/i.test(r.draftPh));
    check('CAP draft placeholder drops personal-essay starters', !/La primera vez que/.test(r.draftPh));
    check('CAP Stage 1 label = Community Starting Point', r.st1.en === 'Community Starting Point');
    check('CAP Milestone 1 = Community & Proposal', r.ms1.en === 'Community & Proposal');
    check('CAP Stage-1 coach entry mentions Community Starting Point', /Community Starting Point/.test(r.entry1));
    check('CAP Stage-1 coach entry does NOT say Anecdote/Anécdota', !/Anecdote|Anécdota/i.test(r.entry1));
    check('all 10 CAP stage labels present', r.allLabels === true);
    check('all 10 CAP coach entries present', r.allEntries === true);
    check('CAP Stage-6 entry preserves authorship framing (you write / sin el coach)', /without the coach|sin el coach|you write this draft/i.test(r.entry6));
    check('CAP Stage-8 entry preserves voice protection framing', /voice|voz|positionality|posicionalidad/i.test(r.entry8));
    check('CAP DOM journey node 1 = Community Starting Point', r.domNode1 === 'Community Starting Point');
    check('CAP DOM milestone 1 = Community & Proposal', r.domMs1 === '1. Community & Proposal');
    check('CAP header shows COMUNIDAD Y PROPUESTA', /COMUNIDAD Y PROPUESTA/i.test(r.header));
    check('CAP dropdown option 1 = Punto de partida comunitario (ES mode — VP2 M5 language-aware)', /Punto de partida comunitario/.test(r.dropOpt1));
    check('CAP channelStageName is service-learning label', /Community Starting Point/.test(r.channelStageName));
    check('engine still 10 stages (CAP)', r.stageCount === 10);
    check('Stage 6 still exists as the authorship-gate stage', r.stage6Id === 6);
    check('Stage 8 still exists as the voice-protection stage', r.stage8Id === 8);
    await p.close();
}

// ── C. Selector path (regular link) → choosing CAP 200 yields CAP labels ──
console.log('\n── C. Regular-link selector → CAP 200 ──');
{
    const p = await browser.newPage();
    p.on('pageerror', e => consoleErrs.push(String(e)));
    await p.goto(BASE + '/');
    await p.evaluate(() => { try { localStorage.clear(); } catch(e){} });
    await p.goto(BASE + '/');
    await p.waitForLoadState('networkidle');
    await p.waitForSelector('#projectSelector .project-option[data-assign="' + CAP + '"]', { timeout: 6000 });
    const optExists = await p.$('#projectSelector .project-option[data-assign="' + CAP + '"]');
    check('selector shows CAP 200 option', !!optExists);
    await p.click('#projectSelector .project-option[data-assign="' + CAP + '"]');
    await p.waitForTimeout(1000);
    const afterSel = await p.evaluate(() => ({ aid: buildChannelData().assignmentId, st1: stLabel(1).en }));
    check('selector choice sets CAP assignment', afterSel.aid === CAP);
    check('selector choice yields CAP Stage-1 label', afterSel.st1 === 'Community Starting Point');
    await p.close();
}

// ── D. Assignment persistence (reload without query keeps CAP labels) ──
console.log('\n── D. Persistence across reload ──');
{
    const p = await freshPage(BASE + '/?assignment=' + CAP);
    await p.goto(BASE + '/');   // reload WITHOUT the query
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(700);
    const r = await p.evaluate(() => ({ aid: buildChannelData().assignmentId, st1: stLabel(1).en }));
    check('assignment persists after reload without query', r.aid === CAP);
    check('CAP labels persist after reload', r.st1 === 'Community Starting Point');
    await p.close();
}

console.log(`\ncap200_labels_test: ${passed} passed, ${failed} failed`);
if (consoleErrs.length) console.log('  console/page errors:', consoleErrs.slice(0, 8));
await browser.close();
if (failed) process.exit(1);
