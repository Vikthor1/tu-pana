// college_personal_statement_test.mjs — College Admissions Personal Essay
// (Common App Personal Statement) genre-layer regression coverage.
//
// Proves the admissions layer is an ADDITIVE overlay on the shared 10-stage engine:
//   A. Activation + persistence (link-only; reload without query; unknown → generic)
//   B. Surface: 10 bilingual stage labels, entries, bounded step cues, 5 milestones,
//      welcome copy, pathway label, draft placeholder, mobile stage labels
//   C. Terminology: College Admissions Personal Essay / Common App Personal
//      Statement — NEVER "statement of purpose"
//   D. Cross-genre isolation (no CAP/research/STEM content in; no admissions out)
//   E. Shared-routing inheritance (Stage 7 = stage.revision, Stage 10 =
//      stage.reflection; no custom stage array; no model/proxy change; in roster)
//   F. Pedagogy (bounded inventory; small first action; no trauma demand; compare a
//      few; no admissions score; structure plurality; no Ivy/prestige formula)
//   G. Authorship (Stage 6 gate framing; coach rules forbid prose generation)
//   H. Voice (Stage 8 preserves language/perspective/register/multilingual voice)
//   I. Integrity (no invented memories, manufactured adversity, prediction, prestige,
//      "impress Harvard/Ivy", or AI-use hiding)
//   J. Process (Stage 10 on shared reflection route; compatible structured schema)
//   K. Zero console/page errors
//
// Run: node college_personal_statement_test.mjs   (requires `node test-server.js` on :3001)

import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const AID = 'college-personal-statement';
let passed = 0, failed = 0;
function check(label, cond) {
    const ok = !!cond;
    if (ok) passed++; else failed++;
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
}

const browser = await chromium.launch();
const consoleErrs = [];

async function newPage() {
    const p = await browser.newPage();
    p.on('pageerror', e => consoleErrs.push(String(e)));
    p.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text()); });
    return p;
}
// Visit with a clean, onboarded storage baseline (so the journey renders).
async function visit(url) {
    const p = await newPage();
    await p.goto(BASE + '/');
    await p.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('tupana_mani_done', 'true');
        localStorage.setItem('tupana_lab_done', 'true');
        localStorage.setItem('tupana_project_chosen', 'true');
    });
    await p.goto(BASE + url);
    await p.waitForTimeout(1000);
    return p;
}
const node1 = (p) => p.evaluate(() => document.querySelector('.stage-node[data-id="1"] .label-en')?.textContent?.trim());
const aidOf = (p) => p.evaluate(() => buildChannelData().assignmentId);

// ── A. Activation + persistence ──
console.log('\n── A. Activation + persistence ──');
let p = await visit(`/?assignment=${AID}`);
check('link activates admissions (assignmentId + Story Inventory)', (await aidOf(p)) === AID && (await node1(p)) === 'Story Inventory');
// persist across reload WITHOUT the query param (do not clear storage between loads)
await p.goto(BASE + '/');
await p.waitForTimeout(1000);
check('persists after reload without ?assignment=', (await aidOf(p)) === AID && (await node1(p)) === 'Story Inventory');
await p.close();
p = await visit('/?assignment=not-a-real-id');
const unk = await p.evaluate(() => ({
    node1: document.querySelector('.stage-node[data-id="1"] .label-en')?.textContent?.trim(),
    layerNull: getAssignmentLayer(buildChannelData().assignmentId) === null,
    override1: getStageLabelOverride(1, buildChannelData().assignmentId)
}));
check('unknown id → generic (no admissions overlay)', unk.node1 !== 'Story Inventory' && unk.layerNull && unk.override1 === null);
await p.close();

// ── B–K. Single admissions-active page for profile/prompt inspection ──
p = await visit(`/?assignment=${AID}`);
const mobileText = await p.evaluate(() => document.getElementById('mobileStageSelect')?.innerText || '');
const D = await p.evaluate((AID) => {
    const layer = getAssignmentLayer(AID);
    const prof = layer.profile;
    const nums = [1,2,3,4,5,6,7,8,9,10];
    const corpus = [
        JSON.stringify(prof.stageDisplay), JSON.stringify(prof.milestones),
        Object.values(prof.stageEntry).join(' '), JSON.stringify(prof.stageSteps),
        prof.welcome.connected, prof.welcome.offline, prof.draftPlaceholder,
        Object.values(prof.coachFocus).join(' '), layer.context, layer.name
    ].join(' ');
    const lang = (typeof getCurrentCoachLanguageLabel === 'function') ? getCurrentCoachLanguageLabel() : 'English';
    const prompt = buildOllamaSystemPrompt(lang);
    // default + research prompts (admissions must not leak into them)
    const saved = state.assignmentId;
    state.assignmentId = ''; const defaultPrompt = buildOllamaSystemPrompt(lang);
    state.assignmentId = 'research-paper'; const researchPrompt = buildOllamaSystemPrompt(lang);
    state.assignmentId = saved;
    return {
        name: layer.name, context: layer.context, selectable: layer.selectable,
        studentLabelEn: prof.studentLabelEn,
        hasStages: 'stages' in prof, hasCapstone: 'capstone' in prof, hasReflectionSchema: 'reflection' in prof,
        stageDisplayOK: nums.every(n => prof.stageDisplay[n]?.es && prof.stageDisplay[n]?.en),
        stageEntryOK: nums.every(n => typeof prof.stageEntry[n] === 'string' && prof.stageEntry[n].includes('\n')),
        stepsLen: nums.map(n => (prof.stageSteps[n] || []).length),
        stepsBilingual: nums.every(n => (prof.stageSteps[n] || []).every(s => s.es && s.en)),
        milestonesOK: [1,2,3,4,5].every(n => prof.milestones[n]?.es && prof.milestones[n]?.en),
        welcome: prof.welcome, pathway: layer.pathwayLabel, placeholder: prof.draftPlaceholder,
        entry1: prof.stageEntry[1], entry2: prof.stageEntry[2], entry5: prof.stageEntry[5], entry6: prof.stageEntry[6], entry8: prof.stageEntry[8],
        cf: prof.coachFocus,
        stageId7: getStageId(7), stageId10: getStageId(10),
        model7: selectGeminiModel(7), model10: selectGeminiModel(10), model6: selectGeminiModel(6),
        activeTemplateLen: getActiveTemplate().stages.length,
        activeStageNums: getActiveTemplate().stages.map(s => s.number).join(','),
        inReviewRoster: getReviewProfiles().map(x => x.assignmentId).includes(AID),
        inSelectable: getSelectableProfiles().map(x => x.assignmentId).includes(AID),
        corpus,
        promptHasAdmContext: prompt.includes('College Admissions Personal Essay — Common App'),
        promptHasAuthorship: prompt.includes('ABSOLUTE AUTHORSHIP RULE'),
        defaultHasAdm: defaultPrompt.includes('College Admissions Personal Essay — Common App') || defaultPrompt.includes('Help the student build a bounded inventory'),
        researchHasAdm: researchPrompt.includes('College Admissions Personal Essay — Common App') || researchPrompt.includes('Help the student build a bounded inventory'),
        researchCf1Intact: getCoachFocusOverride(1, 'research-paper')?.includes('name their topic'),
        defaultEntry1Null: getStageEntryOverride(1, '') === null
    };
}, AID);

// ── B. Surface ──
console.log('\n── B. Surface ──');
check('10 stage labels bilingual', D.stageDisplayOK);
check('10 stage-entry messages bilingual', D.stageEntryOK);
check('bounded step cues (1–6 = 3, 7–10 = 1)', JSON.stringify(D.stepsLen) === JSON.stringify([3,3,3,3,3,3,1,1,1,1]));
check('step cues bilingual', D.stepsBilingual);
check('5 milestones bilingual', D.milestonesOK);
check('welcome connected + offline', typeof D.welcome.connected === 'string' && typeof D.welcome.offline === 'string');
check('pathway label es + en', D.pathway.es && D.pathway.en);
check('draft placeholder bilingual', typeof D.placeholder === 'string' && D.placeholder.includes('\n\n'));
check('mobile stage selector uses active genre labels', /historias|Story Inventory/.test(mobileText));
await p.close();

// ── C. Terminology ──
console.log('\n── C. Terminology ──');
check('name = Common App Personal Statement', /Common App Personal Statement/.test(D.name));
check('studentLabelEn = College Admissions Personal Essay', D.studentLabelEn === 'College Admissions Personal Essay');
check('admissions in authoritative review roster', D.inReviewRoster);
check('NO "statement of purpose" anywhere (except explicit disavowal)', !/statement of purpose/i.test(D.corpus.replace(/NOT a graduate "statement of purpose"/i, '')));

// ── D. Cross-genre isolation ──
console.log('\n── D. Cross-genre isolation ──');
for (const b of ['Bronx', 'IMRDC', 'aprendizaje-servicio', 'research question', 'pregunta de investigación', 'scholarly vs. popular', 'informe de laboratorio', 'lab report', 'Claim–Evidence–Reasoning', 'scientific register'])
    check(`no cross-genre content in corpus: "${b}"`, !new RegExp(b, 'i').test(D.corpus));
check('admissions does NOT leak into default prompt', !D.defaultHasAdm);
check('admissions does NOT leak into research prompt', !D.researchHasAdm);
check('research coachFocus(1) intact', D.researchCf1Intact);
check('default stage-entry(1) still null', D.defaultEntry1Null);

// ── E. Shared-routing inheritance ──
console.log('\n── E. Shared-routing inheritance ──');
check('Stage 7 → stage.revision', D.stageId7 === 'stage.revision');
check('Stage 10 → stage.reflection', D.stageId10 === 'stage.reflection');
check('Stage 7/10 → gemini-2.5-flash (model unchanged)', D.model7 === 'gemini-2.5-flash' && D.model10 === 'gemini-2.5-flash');
check('Stage 6 stays gemini-2.5-flash-lite', D.model6 === 'gemini-2.5-flash-lite');
check('no custom stages array on profile', D.hasStages === false);
check('shared engine intact (10 stages, 1..10)', D.activeTemplateLen === 10 && D.activeStageNums === '1,2,3,4,5,6,7,8,9,10');
check('selectable:false (not in student selector)', D.selectable === false && D.inSelectable === false);

// ── F. Pedagogy ──
console.log('\n── F. Pedagogy ──');
check('story inventory bounded ("three" / "stop after three")', /three/i.test(D.entry1) && /may stop after three|puedes parar después de tres/i.test(D.entry1));
check('first action small (no trauma demand in Stage 1)', !/trauma|adversity|biggest challenge|most painful/i.test(D.entry1) && /Do NOT demand trauma/i.test(D.cf[1]));
check('compare no more than three (Stage 2)', /no more than three/i.test(D.cf[2]) && /hasta tres|up to three/i.test(D.entry2));
check('no numerical admissions score (Stage 2 forbids scoring)', /Do NOT score/i.test(D.cf[2]));
check('structure plurality (Stage 5)', /narrative, montage, braided/i.test(D.cf[5]) && /fórmula ganadora|winning formula/i.test(D.entry5));
check('no Ivy/prestige formula taught', /do NOT rank structures by admissions value/i.test(D.cf[5]) && /teach a single "winning" or "Ivy" structure/i.test(D.cf[5]));

// ── G. Authorship ──
console.log('\n── G. Authorship ──');
check('Stage 6 gate framing preserved (without the coach / unlock on save)', /sin el coach|without the coach/i.test(D.entry6) && /desbloquear la revisión|unlock revision/i.test(D.entry6));
check('coach rules forbid prose generation (Stage 6)', /do NOT write essay prose/i.test(D.cf[6]) && /until the student has saved a first draft/i.test(D.cf[6]));
check('global authorship rule present in assembled admissions prompt', D.promptHasAuthorship && D.promptHasAdmContext);

// ── H. Voice ──
console.log('\n── H. Voice ──');
check('Stage 8 preserves language/perspective/voice', /protect your language and community knowledge|protejo tu idioma/i.test(D.entry8));
check('Stage 8 forbids generic-consultant rewrite + protects code-switching', /do NOT rewrite into generic consultant voice/i.test(D.cf[8]) && /code-switching/i.test(D.cf[8]));

// ── I. Admissions integrity ──
console.log('\n── I. Admissions integrity ──');
check('no invented memories', /never invent memories/i.test(D.context));
check('no manufactured adversity', /never manufacture or intensify adversity/i.test(D.context));
check('no admission prediction', /never predict admission/i.test(D.context));
check('no prestige optimization ("no single Ivy essay")', /no single "Ivy essay"/i.test(D.context));
check('no "impress Harvard"/Ivy claim', /claim it will "impress Harvard"/i.test(D.context));
check('AI-use transparency never hidden', /Support transparent AI-use reflection and never help hide/i.test(D.context));

// ── J. Process ──
console.log('\n── J. Process ──');
check('Stage 10 stays on shared reflection route', D.stageId10 === 'stage.reflection' && /shared reflection route/i.test(D.cf[10]));
check('does not write the reflection for the student', /Do NOT write the reflection for the student/i.test(D.cf[10]));
check('no admissions-specific reflection schema/capstone override', D.hasCapstone === false && D.hasReflectionSchema === false);

// ── K. Errors ──
check('zero console/page errors across all cases', consoleErrs.length === 0);
if (consoleErrs.length) console.log('  errors:', consoleErrs.slice(0, 5));

console.log(`\ncollege_personal_statement_test: ${passed} passed, ${failed} failed`);
await browser.close();
process.exit(failed ? 1 : 0);
