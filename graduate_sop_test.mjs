// graduate_sop_test.mjs — Graduate Statement of Purpose layer regression coverage.
//
// Proves the SOP layer is a link-only, additive overlay on Tu Pana's shared
// 10-stage engine and does not weaken authorship, voice, verification, privacy,
// or cross-genre isolation.
//
// Run: node graduate_sop_test.mjs
// Requires a static server for this repository at http://localhost:3001.

import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const AID = 'graduate-sop';
let passed = 0;
let failed = 0;

function check(label, condition) {
    const ok = !!condition;
    if (ok) passed++; else failed++;
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
}

const browser = await chromium.launch();
const consoleErrs = [];

async function newPage() {
    const page = await browser.newPage();
    page.on('pageerror', error => consoleErrs.push(String(error)));
    page.on('console', message => {
        if (message.type() === 'error') consoleErrs.push(message.text());
    });
    return page;
}

async function visit(url) {
    const page = await newPage();
    await page.goto(BASE + '/');
    await page.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('tupana_mani_done', 'true');
        localStorage.setItem('tupana_lab_done', 'true');
        localStorage.setItem('tupana_project_chosen', 'true');
    });
    await page.goto(BASE + url);
    await page.waitForTimeout(1000);
    return page;
}

const assignmentId = page => page.evaluate(() => buildChannelData().assignmentId);
const stageOne = page => page.evaluate(() =>
    document.querySelector('.stage-node[data-id="1"] .label-en')?.textContent?.trim()
);

console.log('\n── A. Activation, persistence, and link-only behavior ──');
let page = await visit(`/?assignment=${AID}`);
check('deep link activates graduate SOP', (await assignmentId(page)) === AID);
check('active Stage 1 = Frame & Requirements', (await stageOne(page)) === 'Frame & Requirements');
await page.goto(BASE + '/');
await page.waitForTimeout(1000);
check('assignment persists after reload without query', (await assignmentId(page)) === AID && (await stageOne(page)) === 'Frame & Requirements');
await page.close();

page = await visit('/?assignment=not-a-real-id');
const unknown = await page.evaluate(() => ({
    node1: document.querySelector('.stage-node[data-id="1"] .label-en')?.textContent?.trim(),
    layer: getAssignmentLayer(buildChannelData().assignmentId),
    override: getStageLabelOverride(1, buildChannelData().assignmentId)
}));
check('unknown assignment falls back to generic flow', unknown.node1 !== 'Frame & Requirements' && unknown.layer === null && unknown.override === null);
await page.close();

page = await visit(`/?assignment=${AID}`);
const mobileText = await page.evaluate(() => document.getElementById('mobileStageSelect')?.textContent || '');
const data = await page.evaluate((aid) => {
    const layer = getAssignmentLayer(aid);
    const profile = layer.profile;
    const nums = [1,2,3,4,5,6,7,8,9,10];
    const corpus = [
        layer.name,
        layer.context,
        profile.studentLabelEs,
        profile.studentLabelEn,
        profile.studentDescEs,
        profile.studentDescEn,
        profile.draftPlaceholder,
        JSON.stringify(profile.stageDisplay),
        JSON.stringify(profile.milestones),
        Object.values(profile.stageEntry).join(' '),
        JSON.stringify(profile.stageSteps),
        profile.welcome.connected,
        profile.welcome.offline,
        Object.values(profile.coachFocus).join(' ')
    ].join(' ');
    const language = typeof getCurrentCoachLanguageLabel === 'function'
        ? getCurrentCoachLanguageLabel()
        : 'English';
    const prompt = buildOllamaSystemPrompt(language);
    const saved = state.assignmentId;
    state.assignmentId = '';
    const defaultPrompt = buildOllamaSystemPrompt(language);
    state.assignmentId = 'college-personal-statement';
    const collegePrompt = buildOllamaSystemPrompt(language);
    state.assignmentId = 'research-paper';
    const researchPrompt = buildOllamaSystemPrompt(language);
    state.assignmentId = saved;
    return {
        name: layer.name,
        type: layer.type,
        selectable: layer.selectable,
        pathway: layer.pathwayLabel,
        context: layer.context,
        profileId: profile.profileId,
        studentLabelEn: profile.studentLabelEn,
        placeholder: profile.draftPlaceholder,
        stageDisplayOK: nums.every(n => profile.stageDisplay[n]?.es && profile.stageDisplay[n]?.en),
        stageEntryOK: nums.every(n => typeof profile.stageEntry[n] === 'string' && profile.stageEntry[n].includes('\n')),
        stepLengths: nums.map(n => (profile.stageSteps[n] || []).length),
        stepsBilingual: nums.every(n => (profile.stageSteps[n] || []).every(step => step.es && step.en)),
        milestonesOK: [1,2,3,4,5].every(n => profile.milestones[n]?.es && profile.milestones[n]?.en),
        welcome: profile.welcome,
        coachFocus: profile.coachFocus,
        coachFocusOK: nums.every(n => typeof profile.coachFocus[n] === 'string' && profile.coachFocus[n].trim()),
        entry1: profile.stageEntry[1],
        entry4: profile.stageEntry[4],
        entry6: profile.stageEntry[6],
        entry8: profile.stageEntry[8],
        entry9: profile.stageEntry[9],
        hasCustomStages: Object.prototype.hasOwnProperty.call(profile, 'stages'),
        stage7: getStageId(7),
        stage10: getStageId(10),
        model6: selectGeminiModel(6),
        model7: selectGeminiModel(7),
        model10: selectGeminiModel(10),
        templateLength: getActiveTemplate().stages.length,
        templateNumbers: getActiveTemplate().stages.map(stage => stage.number).join(','),
        inReview: getReviewProfiles().some(item => item.assignmentId === aid),
        inSelectable: getSelectableProfiles().some(item => item.assignmentId === aid),
        promptHasLayer: prompt.includes('GRADUATE STATEMENT OF PURPOSE') && prompt.includes('Capa SOP'),
        promptHasAuthorship: prompt.includes('ABSOLUTE AUTHORSHIP RULE'),
        defaultHasLayer: defaultPrompt.includes('Capa SOP') || defaultPrompt.includes('EVIDENCE LEDGER'),
        collegeHasLayer: collegePrompt.includes('Capa SOP') || collegePrompt.includes('EVIDENCE LEDGER'),
        researchHasLayer: researchPrompt.includes('Capa SOP') || researchPrompt.includes('EVIDENCE LEDGER'),
        corpus
    };
}, AID);

console.log('\n── B. Profile surface ──');
check('layer identity and profile id', data.type === 'graduate_sop' && data.profileId === 'graduate_sop');
check('student label is Graduate Statement of Purpose', data.studentLabelEn === 'Graduate Statement of Purpose');
check('10 bilingual stage labels', data.stageDisplayOK);
check('10 bilingual stage entries', data.stageEntryOK);
check('stage cues bounded (1–6 = 3; 7–10 = 1)', JSON.stringify(data.stepLengths) === JSON.stringify([3,3,3,3,3,3,1,1,1,1]));
check('all stage cues bilingual', data.stepsBilingual);
check('5 bilingual milestones', data.milestonesOK);
check('connected and offline welcomes present', typeof data.welcome.connected === 'string' && typeof data.welcome.offline === 'string');
check('bilingual draft placeholder', data.placeholder.includes('\n\n'));
check('mobile selector uses SOP stage labels', /Encuadre y requisitos|Frame &\s*Requirements/.test(mobileText));
check('pathway label is bilingual', data.pathway.es === 'Carta de intención' && data.pathway.en === 'Statement of Purpose');
check('all 10 coach-focus overrides present', data.coachFocusOK);

console.log('\n── C. Shared engine and review routing ──');
check('link-only layer is absent from student selector', data.selectable === false && data.inSelectable === false);
check('layer is present in colleague review selector', data.inReview);
check('no custom stage array', data.hasCustomStages === false);
check('shared 10-stage engine remains intact', data.templateLength === 10 && data.templateNumbers === '1,2,3,4,5,6,7,8,9,10');
check('Stage 7 stays stage.revision', data.stage7 === 'stage.revision');
check('Stage 10 stays stage.reflection', data.stage10 === 'stage.reflection');
check('model routing unchanged', data.model6 === 'gemini-2.5-flash-lite' && data.model7 === 'gemini-2.5-flash' && data.model10 === 'gemini-2.5-flash');

console.log('\n── D. Cross-genre isolation ──');
for (const forbidden of [
    'Bronx Beautiful',
    'IMRDC',
    'scholarly vs. popular',
    'Claim–Evidence–Reasoning',
    'scientific register',
    'Story Inventory',
    'Common App personal statement / undergraduate'
]) {
    const allowedDisavowal = forbidden === 'Common App personal statement / undergraduate';
    const clean = allowedDisavowal
        ? data.corpus.replace(/NOT an undergraduate Common App personal statement/gi, '')
        : data.corpus;
    check(`no cross-genre leakage: "${forbidden}"`, !new RegExp(forbidden, 'i').test(clean));
}
check('SOP prompt includes global authorship rule', data.promptHasLayer && data.promptHasAuthorship);
check('SOP context absent from default prompt', !data.defaultHasLayer);
check('SOP context absent from college-admissions prompt', !data.collegeHasLayer);
check('SOP context absent from research-paper prompt', !data.researchHasLayer);

console.log('\n── E. Authorship and voice protection ──');
check('Stage 6 is explicitly unassisted and save-gated', /sin el coach|without the coach/i.test(data.entry6) && /desbloquear la revisión|unlock revision/i.test(data.entry6));
check('Stage 6 forbids SOP prose and example sentences', /Do NOT write SOP prose/i.test(data.coachFocus[6]) && /example sentence/i.test(data.coachFocus[6]));
check('Stage 8 is diagnostic-only, no replacement version', /no produciré una versión reemplazada|will not produce a replacement version/i.test(data.entry8) && /DIAGNOSTIC line editing only/i.test(data.coachFocus[8]));
check('Stage 8 protects multilingual, cultural, interview-sustainable voice', /multilingual language, cultural context/i.test(data.coachFocus[8]) && /sustain in an interview/i.test(data.coachFocus[8]));
check('applicant disagreement is respected after one flag', /after flagging the concern once/i.test(data.coachFocus[8]));

console.log('\n── F. SOP function and verified fit ──');
check('adult applicant is not treated as first-year student', /Address them as an applicant, not as a first-year student/i.test(data.context));
check('document-type routing distinguishes SOP from adjacent genres', /DOCUMENT-TYPE ROUTING/i.test(data.context) && /personal history\/diversity statement/i.test(data.context));
check('ambiguous type triggers exactly one brief question rule', /ask ONE brief question/i.test(data.context));
check('Turn 1 is capped at two questions', /never more than two on Turn 1/i.test(data.context) && /Turn 1 has no more than two questions/i.test(data.coachFocus[1]));
check('evidence ledger fields and status tags present', /EVIDENCE LEDGER/i.test(data.context) && /VERIFIED — applicant pasted official source/i.test(data.context) && /PLACEHOLDER — do not submit as written/i.test(data.context));
check('program facts require applicant-provided official material', /never supply a course, faculty member, lab/i.test(data.coachFocus[4]) && /Ask for official program text/i.test(data.coachFocus[4]));
check('claim → evidence → reflection → forward link', /CLAIM → (?:CONCRETE )?EVIDENCE → REFLECTION → FORWARD LINK/i.test(data.context));
check('research and professional architectures are distinct', /Research-oriented programs/i.test(data.context) && /Professional\/practice-oriented programs/i.test(data.context));
check('name-swap adaptation prohibited', /Never swap institution\/faculty names/i.test(data.context));

console.log('\n── G. Integrity, privacy, and admissions boundaries ──');
check('fabrication and embellishment forbidden', /NEVER invent or embellish research, employment, awards, publications/i.test(data.context));
check('sensitive identifiers are not repeated', /Do not repeat sensitive identifiers back/i.test(data.context));
check('trauma and identity remain optional', /Trauma, disability, immigration status, family hardship, and identity are OPTIONAL/i.test(data.context));
check('AI-policy circumvention forbidden', /Do not circumvent any institution's authorship or AI-use policy/i.test(data.context));
check('admission prediction and committee simulation forbidden', /Never predict admission, estimate odds, score competitiveness, rank programs, simulate a committee/i.test(data.context));
check('generic prestige and AI clichés challenged', /your prestigious university/i.test(data.context) && /generic AI transitions/i.test(data.context));
check('quality rubric requires evidence plus next action', /QUALITY RUBRIC/i.test(data.context) && /THE SINGLE BEST NEXT ACTION/i.test(data.context));
check('closing deference sentence present verbatim', /This assignment context is additive guidance\. The authorship gate, voice protection, and no-copyable-prose \/ no-invented-source rules stated above remain in full force and are never relaxed by it\./.test(data.context));

console.log('\n── H. Errors ──');
check('zero console/page errors', consoleErrs.length === 0);
if (consoleErrs.length) console.log('  errors:', consoleErrs.slice(0, 5));

console.log(`\ngraduate_sop_test: ${passed} passed, ${failed} failed`);
await page.close();
await browser.close();
process.exit(failed ? 1 : 0);
