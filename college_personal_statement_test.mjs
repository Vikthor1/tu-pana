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

// ── Diagnostics (K) ──
// A failing `zero console/page errors` check used to say only that something went wrong:
// the assertion is an aggregate over every page, and the payload was printed on a line
// carrying no ❌, which run_test_suite.mjs drops from failing suites. So a full-suite
// failure arrived with no way to tell which page, request, or resource was involved.
//
// DIAG records that context passively. It is READ-ONLY with respect to the assertion:
// the response/requestfailed listeners below NEVER write to consoleErrs, so the check
// still tests exactly what it tested before — pageerror plus console-error events.
const DIAG = [];
let DIAG_SEQ = 0;
let STAGE = 'pre-first-visit';
// Origin + path + search only: never a hash, credentials, body, header, or storage value.
const safeHref = (raw) => { try { const u = new URL(raw); return u.origin + u.pathname + u.search; } catch { return '(unparseable)'; } };
const safeUrl = (p) => { try { return safeHref(p.url()); } catch { return '(unavailable)'; } };
function pushDiag(origin, p, text, resourceUrl, location) {
    DIAG.push({
        seq: ++DIAG_SEQ, t: new Date().toISOString(), origin, stage: STAGE,
        pageUrl: safeUrl(p), resourceUrl: resourceUrl || null,
        text: String(text), location: location || null,
    });
}

async function newPage() {
    const p = await browser.newPage();
    p.on('pageerror', e => { pushDiag('pageerror', p, e, null, null); consoleErrs.push(String(e)); });
    p.on('console', m => { if (m.type() === 'error') { pushDiag('console.error', p, m.text(), null, m.location()); consoleErrs.push(m.text()); } });
    // Diagnostic-only. Deliberately NOT pushed into consoleErrs — a 404 that produces no
    // console error must not start failing this suite.
    p.on('response', r => { const s = r.status(); if (s >= 400) pushDiag(`response:${s}`, p, `HTTP ${s}`, safeHref(r.url()), null); });
    p.on('requestfailed', r => { pushDiag('requestfailed', p, (r.failure() && r.failure().errorText) || 'request failed', safeHref(r.url()), null); });
    return p;
}
// Visit with a clean, onboarded storage baseline (so the journey renders).
async function visit(url) {
    const p = await newPage();
    STAGE = `visit(${url}):goto-root`;
    await p.goto(BASE + '/');
    STAGE = `visit(${url}):seed-storage`;
    await p.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('tupana_mani_done', 'true');
        localStorage.setItem('tupana_lab_done', 'true');
        localStorage.setItem('tupana_project_chosen', 'true');
    });
    STAGE = `visit(${url}):goto-target`;
    await p.goto(BASE + url);
    STAGE = `visit(${url}):settle`;
    await p.waitForTimeout(1000);
    STAGE = `visit(${url}):active`;
    return p;
}
const node1 = (p) => p.evaluate(() => document.querySelector('.stage-node[data-id="1"] .label-en')?.textContent?.trim());
const aidOf = (p) => p.evaluate(() => buildChannelData().assignmentId);

// ── A. Activation + persistence ──
console.log('\n── A. Activation + persistence ──');
let p = await visit(`/?assignment=${AID}`);
check('link activates admissions (assignmentId + Story Inventory)', (await aidOf(p)) === AID && (await node1(p)) === 'Story Inventory');
// persist across reload WITHOUT the query param (do not clear storage between loads)
STAGE = 'A:reload-without-query';
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
// On failure the payload rides on the ❌ line itself, because run_test_suite.mjs prints
// only ❌ lines from a failing suite. Bounded and single-line by fixed constants so the
// runner's output stays readable and the record stays deterministic.
// The payload is assembled INSIDE the ceiling, not clipped to it at the end. Clipping the
// assembled line dropped whole trailing events and the `…+N more` marker, and the per-event
// clip cut `resource=` off network events — the one field this change exists to deliver.
// So each event is built from its critical fields first, optional context is added only
// while it fits, and an event that cannot carry its critical fields is omitted whole and
// counted in the marker rather than shown incomplete.
const DIAG_MAX_EVENTS = 5, DIAG_MAX_EVENT_CHARS = 160, DIAG_MAX_PAYLOAD_CHARS = 600;
const oneLine = (s) => String(s).replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 12) + '…[truncated]' : s);
const diagHasUrl = (e) => !!e.resourceUrl;
const diagAsserted = (e) => e.origin === 'pageerror' || e.origin === 'console.error';
// Critical first: sequence and origin, then whichever fields this event kind is
// responsible for — a resource URL for a network event, stage and page URL for an
// asserted one. Everything after that is context and may be cut or dropped.
function diagParts(e) {
    const req = diagHasUrl(e) ? [`resource=${e.resourceUrl}`] : [`stage=${e.stage}`, `page=${e.pageUrl}`];
    const opt = diagHasUrl(e) ? [`stage=${e.stage}`, `page=${e.pageUrl}`] : [];
    if (e.location && e.location.url) opt.push(`at=${safeHref(e.location.url)}:${e.location.lineNumber}:${e.location.columnNumber}`);
    opt.push(`t=${e.t}`, `msg=${e.text}`);
    return { head: `#${e.seq} ${e.origin}`, req, opt };
}
function diagEvent(e, budget) {
    const cap = Math.min(DIAG_MAX_EVENT_CHARS, budget);
    const { head, req, opt } = diagParts(e);
    let s = oneLine(head);
    if (s.length > cap) return null;   // cannot even carry sequence + origin
    for (let i = 0; i < req.length; i++) {
        const next = `${s} ${oneLine(req[i])}`;
        if (next.length <= cap) { s = next; continue; }
        // A critical field may be clipped and marked — a marked partial URL is evidence —
        // but it is never silently dropped, and neither are the critical fields after it.
        // An event that cannot carry ALL of them is omitted whole and counted in the
        // `…+N more` marker, so the line can never show an asserted event with a stage
        // identity but no page URL, which would read as adequate while failing §6 item 5.
        const room = cap - s.length - 1;
        if (room <= 13 || i < req.length - 1) return null;
        return `${s} ${clip(oneLine(req[i]), room)}`;
    }
    for (const seg of opt) {
        const next = `${s} ${oneLine(seg)}`;
        if (next.length <= cap) { s = next; continue; }
        const room = cap - s.length - 1;
        if (room > 13) s = `${s} ${clip(oneLine(seg), room)}`;
        break;
    }
    return s;
}
// The earliest asserted event and the earliest URL-bearing event: without them the line
// cannot carry the stage/page or the resource URL at all, whatever else it shows.
function diagMust() {
    const m = [];
    const a = DIAG.find(diagAsserted), u = DIAG.find(diagHasUrl);
    if (a) m.push(a);
    if (u && u !== a) m.push(u);
    return m;
}
// Ascending sequence counter, except that those two are each guaranteed a slot.
// Deterministic — no randomness, no time dependence.
function diagSelect() {
    const must = diagMust();
    const rest = DIAG.filter(e => !must.includes(e));
    return must.concat(rest.slice(0, Math.max(0, DIAG_MAX_EVENTS - must.length))).sort((x, y) => x.seq - y.seq);
}
function diagPayload() {
    const total = DIAG.length;
    // Reserve the widest marker this run could need, so it can never be the thing cut.
    const head = `events=${total}`;
    let left = DIAG_MAX_PAYLOAD_CHARS - ` | …+${total} more`.length - head.length;
    const sel = diagSelect(), must = diagMust(), done = new Map();
    const render = (e, budget) => {
        const one = diagEvent(e, Math.min(budget, left) - 3);
        if (one === null) return;
        done.set(e.seq, one);
        left -= one.length + 3;
    };
    // The guaranteed events are rendered FIRST, each against its own share, so a long
    // earlier event can never spend the budget they need.
    let n = must.length;
    for (const e of must) { if (n > 0) render(e, Math.floor(left / n)); n--; }
    // Then the rest, in ascending sequence, on whatever remains.
    for (const e of sel) { if (!done.has(e.seq)) render(e, left); }
    // The total is always stated, so a truncated payload never reads as complete.
    let out = head;
    for (const e of sel) if (done.has(e.seq)) out += ` | ${done.get(e.seq)}`;
    const omitted = total - done.size;
    if (omitted > 0) out += ` | …+${omitted} more`;
    // Never fires — the assembly above is bounded by construction. Kept so the ceiling
    // is enforced literally as well as structurally.
    return clip(oneLine(out), DIAG_MAX_PAYLOAD_CHARS);
}
const zeroErrors = consoleErrs.length === 0;
check('zero console/page errors across all cases' + (zeroErrors ? '' : ` — ${diagPayload()}`), zeroErrors);
if (consoleErrs.length) console.log('  errors:', consoleErrs.slice(0, 5));

console.log(`\ncollege_personal_statement_test: ${passed} passed, ${failed} failed`);
await browser.close();
process.exit(failed ? 1 : 0);
