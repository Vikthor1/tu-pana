// service_learning_test.mjs — Stage B regression coverage
// Verifies the two-level service-learning architecture added in Stage B:
//   - generic service_learning_project type/engine (institution-agnostic)
//   - CAP 200 / Bronx Beautiful PROFILE on top of it (course specifics isolated)
//   - minimal in-app project selector reachable through the REGULAR Tu Pana link
//   - existing default (autobiographical-essay) flow remains available + unbroken
//
// Architecture invariants under test:
//   - the 10-stage engine, Stage 6 authorship gate, and Stage 8 voice protection
//     are unchanged; the assignment context is ADDITIVE and the gate always wins
//   - CAP 200 strings live ONLY in the profile/config + selector labels, never in
//     the generic engine
//
// Run: node service_learning_test.mjs   (requires `node test-server.js` on :3001)

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

async function freshPage(url = BASE + '/') {
    const p = await browser.newPage();
    p.on('pageerror', e => console.log('    PAGEERROR:', String(e)));
    await p.goto(url);
    await p.evaluate(() => localStorage.clear());
    await p.goto(url);
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(800);
    return p;
}

// ── A. Generic service-learning engine (institution-agnostic) ──
console.log('\n── A. Generic engine ──');
{
    const p = await freshPage();
    const r = await p.evaluate(() => {
        const o = {};
        o.typeOk     = typeof serviceLearningProjectType === 'object' && serviceLearningProjectType.typeId === 'service_learning_project';
        o.schemaOk   = typeof SERVICE_LEARNING_PROFILE_SCHEMA === 'object';
        o.moves16    = Array.isArray(SERVICE_LEARNING_MOVES) && SERVICE_LEARNING_MOVES.length === 16;
        o.builderFn  = typeof buildServiceLearningContext === 'function';
        o.selectFn   = typeof getSelectableProfiles === 'function';
        const g = buildServiceLearningContext();
        o.genericText      = g.length > 200;
        o.genericArc       = /Project Basics/.test(g) && /Process Report/.test(g);
        o.genericStageMap  = /existing 10-step journey/.test(g);
        o.genericMustNot   = /must NEVER/.test(g) && /granting or simulating proposal approval/.test(g);
        o.genericDeference = /authorship gate/i.test(g) && /never relaxed/i.test(g);
        o.genericNoCap200  = !/cap\s*200|bronx beautiful|hostos|40%|5.?7 page|writing center/i.test(g);
        // portability: a different course profile drives different output
        const other = buildServiceLearningContext({ courseName: 'DEMO 101', requiredHours: 25, serviceType: 'indirect service', academicStructure: ['Intro', 'Body', 'Close'] });
        o.portableHours = /about 25 hours of indirect service/.test(other);
        o.portableStruct = /Intro · Body · Close/.test(other);
        return o;
    });
    Object.entries(r).forEach(([k, v]) => check('generic: ' + k, v));
    await p.close();
}

// ── B. CAP 200 / Bronx Beautiful profile (specifics isolated) ──
console.log('\n── B. CAP 200 profile ──');
{
    const p = await freshPage(BASE + '/?assignment=' + CAP);
    const r = await p.evaluate((CAP) => {
        const o = {};
        const layer = getAssignmentLayer(CAP);
        o.layerExists  = !!layer;
        o.shapeOk      = !!(layer && layer.id === CAP && layer.name && layer.context && layer.type === 'service_learning_project');
        o.selectable   = !!(layer && layer.selectable === true);
        o.profileIdOk  = !!(layer && layer.profile && layer.profile.profileId === 'cap200_bronx_beautiful_service_learning');
        o.hoursIs10    = layer && layer.profile && layer.profile.requiredHours === 10;          // configurable field
        o.hoursIsField = 'requiredHours' in SERVICE_LEARNING_PROFILE_SCHEMA;                    // not hard-coded globally
        const c = layer ? layer.context : '';
        o.cap200       = /CAP 200/.test(c);
        o.weight40     = /40% of the course grade/.test(c);
        o.report57     = /5.?7 page/.test(c);
        o.cbo          = /CBO|community-based organization/i.test(c);
        o.proposalTmpl = /structured project proposal using the provided template/.test(c);
        o.timeline     = /timeline for completion/.test(c);
        o.approvalGate = /approved before service begins/.test(c) && /do NOT grant approval/i.test(c);
        o.tenHours     = /about 10 hours of direct service/.test(c);
        o.dataReq      = /collects and analyzes real data/.test(c);
        o.evidence     = /logged service hours/.test(c) && /interview transcripts/.test(c) && /survey data/.test(c);
        o.imrdc        = /Introduction · Methodology · Results · Discussion · Conclusion/.test(c);
        o.feedback     = /detailed feedback and scores with a rubric/.test(c);
        o.revision     = /revisions are expected/.test(c);
        o.writingCtr   = /Hostos Writing Center/.test(c);
        o.concepts     = /critical thinking, problem solving/.test(c);
        o.cautions     = /Do not frame the assignment as only:/.test(c) && /volunteer-hours log/.test(c);
        o.deference    = /never relaxed by it/.test(c);
        // ISOLATION: the generic engine carries none of the above CAP 200 wording
        o.genericClean = !/cap\s*200|bronx beautiful|hostos|40%|5.?7 page|writing center/i.test(buildServiceLearningContext());
        // governance: authorship rule precedes the assignment block in the assembled prompt
        const sys = buildOllamaSystemPrompt('both');
        o.gateFirst    = sys.indexOf('ABSOLUTE AUTHORSHIP RULE') < sys.indexOf('ASSIGNMENT CONTEXT — CAP 200');
        // the older first-draft layer is untouched + still distinct
        const fd = getAssignmentLayer('cap-200-first-draft');
        o.firstDraftIntact = !!(fd && /FIRST DRAFT/.test(fd.context)) && fd.id !== CAP;
        return o;
    }, CAP);
    Object.entries(r).forEach(([k, v]) => check('cap200: ' + k, v));
    await p.close();
}

// ── C. Selector reachable through the REGULAR Tu Pana link ──
console.log('\n── C. In-app selector (regular link) ──');
{
    const p = await freshPage();                       // regular link, brand-new student
    check('selector: getSelectableProfiles includes CAP 200 with student copy',
        await p.evaluate((CAP) => {
            const list = getSelectableProfiles();
            const c = list.find(x => x.assignmentId === CAP);
            return !!(c && c.labelEn && c.labelEs && c.descEn && c.descEs);
        }, CAP));
    check('selector: shown on first run', await p.evaluate(() => !!document.getElementById('projectSelector')));
    check('selector: offers the default (essay) option', await p.evaluate(() => !!document.querySelector('.project-option[data-assign="__default__"]')));
    check('selector: offers the CAP 200 option', await p.evaluate((CAP) => !!document.querySelector(`.project-option[data-assign="${CAP}"]`), CAP));
    check('selector: short (exactly 2 options this sprint)', await p.evaluate(() => document.querySelectorAll('.project-option').length === 2));
    // select CAP 200
    await p.click(`.project-option[data-assign="${CAP}"]`);
    await p.waitForTimeout(700);
    check('selector: choosing CAP 200 activates the profile', await p.evaluate((CAP) => state.assignmentId === CAP, CAP));
    check('selector: choice persisted to tupana_assignment_id', await p.evaluate((CAP) => localStorage.getItem('tupana_assignment_id') === CAP, CAP));
    check('selector: tupana_project_chosen flag set', await p.evaluate(() => localStorage.getItem('tupana_project_chosen') === 'true'));
    check('selector: chains into the normal landing flow', await p.evaluate(() => !!document.getElementById('landingMoment') && !document.getElementById('projectSelector')));
    await p.close();

    // default choice → generic coach
    const p2 = await freshPage();
    await p2.click('.project-option[data-assign="__default__"]');
    await p2.waitForTimeout(600);
    check('selector: choosing default keeps the generic coach (no assignment id)',
        await p2.evaluate(() => state.assignmentId === null && localStorage.getItem('tupana_assignment_id') === null));
    check('selector: default still chains into landing', await p2.evaluate(() => !!document.getElementById('landingMoment')));
    await p2.close();

    // deep link skips the selector
    const p3 = await freshPage(BASE + '/?assignment=' + CAP);
    check('selector: deep link skips the selector', await p3.evaluate(() => !document.getElementById('projectSelector')));
    check('selector: deep link activates CAP 200 directly', await p3.evaluate((CAP) => state.assignmentId === CAP, CAP));
    await p3.close();

    // returning student (onboarding done) never sees it
    const p4 = await browser.newPage();
    await p4.goto(BASE + '/');
    await p4.evaluate(() => { localStorage.clear(); localStorage.setItem('tupana_mani_done', 'true'); localStorage.setItem('tupana_lab_done', 'true'); });
    await p4.goto(BASE + '/');
    await p4.waitForLoadState('networkidle');
    await p4.waitForTimeout(800);
    check('selector: returning student never sees the selector', await p4.evaluate(() => !document.getElementById('projectSelector')));
    await p4.close();
}

// ── D. Existing default flow remains available + unbroken ──
console.log('\n── D. Existing default flow intact ──');
{
    const p = await freshPage();                       // no assignment active
    const r = await p.evaluate(() => {
        const o = {};
        o.tenStages       = getActiveTemplate().stages.length === 10;                 // engine unchanged
        o.gate6           = AUTHORSHIP_GATE.gateStage === 6;                          // Stage 6 gate intact
        const sysGeneric  = buildOllamaSystemPrompt('both');
        o.noAssignBlock   = !/ASSIGNMENT CONTEXT —/.test(sysGeneric);                 // generic = no assignment block
        o.authorshipRule  = /ABSOLUTE AUTHORSHIP RULE/.test(sysGeneric);             // base rules still present
        o.voiceProtect    = /voice/i.test(sysGeneric);
        return o;
    });
    Object.entries(r).forEach(([k, v]) => check('default-flow: ' + k, v));
    await p.close();
}

console.log(`\n${passed}/${passed + failed} PASS` + (failed ? `  (${failed} FAILED)` : ''));
await browser.close();
process.exit(failed ? 1 : 0);
