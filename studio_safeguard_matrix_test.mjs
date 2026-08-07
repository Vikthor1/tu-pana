// B1 + B3 + B7 — the profile-safeguard matrix.
//
// B1: one canonical source of profile safeguards, reaching every applicable AI
//     pathway rather than only the Council.
// B3: admissions and Graduate SOP prohibitions against predicting acceptance,
//     admission, selection, or any other outcome, on everyday coaching paths
//     as well as Council.
// B7: the coverage comment now tells the truth, including about what is NOT
//     covered.
//
// ARCHITECTURE UNDER TEST — established empirically, not assumed:
//   • FIVE student-reachable pathways: Ask Tu Pana, passage review, focused
//     review, full-draft review, Council (reviewer), and Council synthesis.
//   • FOUR wire request kinds actually emitted by studio-ui.js:
//     passage_analysis, full_draft_review, council_reviewer, council_synthesis.
//   • A FIFTH kind, `capstone_review`, is DECLARED in the provider's model map
//     but has ZERO references in studio-ui.js. It is legacy surface carried
//     from the ten-stage application, unreachable from the Studio. It is
//     asserted as such — not deleted, not counted as a live path, and not
//     invented into one.
//
// ELEVEN distinct profiles are a founder-accepted product property. B2 is NOT
// in this batch: `autobiographical` and `neutral` still carry no safeguards,
// and that gap is asserted explicitly so no future run can mistake silence for
// coverage.
//
// Zero live AI calls: prompts are constructed from the loaded modules.
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const browser = await chromium.launch({ headless: true });
let passed = 0;
let failed = 0;
const check = (label, condition, detail = '') => {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
    if (ok) passed++; else failed++;
};

const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const external = [];
const errors = [];
page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
page.on('pageerror', error => errors.push(String(error)));
await page.goto(`${ORIGIN}/studio.html?provider=mock`);

// One phrase unique to each profile's safeguards. Used in both directions:
// the profile's own marker must be present, every other marker must be absent.
// The three STEM configurations deliberately share a preamble, so their markers
// are the assignment-specific tails that actually distinguish them.
const MARKERS = {
    admissions: 'prestige-coded or culturally narrow template',
    sop: 'Never claim experience or preparation the draft does not state',
    cap200: 'service activities, hours, partners, or data',
    research: 'Never invent sources, titles, authors, quotations',
    stem: 'LAB OR METHODS REPORT',
    stemExplanation: 'technical or scientific EXPLANATION',
    stemArgument: 'EVIDENCE-BASED SCIENTIFIC ARGUMENT',
    readingUg: 'undergraduate short reading response',
    readingGrad: 'graduate extended reading response',
};
// B2 gap — deliberately uncovered in this batch.
const UNCOVERED = ['autobiographical', 'neutral'];

// The five student-reachable pathways, with the wire kind each one emits.
const PATHWAYS = [
    { key: 'ask_tupana', kind: 'passage_analysis', builder: 'buildPassagePrompt' },
    { key: 'passage_review', kind: 'passage_analysis', builder: 'buildPassagePrompt' },
    { key: 'focused_review_full', kind: 'full_draft_review', builder: 'buildFullDraftPrompt' },
    { key: 'council_reviewer', kind: 'council_reviewer', builder: 'buildCouncilReviewerPrompt' },
    { key: 'council_synthesis', kind: 'council_synthesis', builder: 'buildCouncilSynthesisPrompt' },
];

// Build every profile × pathway prompt exactly as the app would.
const matrix = await page.evaluate(pathways => {
    const P = window.StudioProfiles;
    const V = window.StudioProvider;
    const out = {};
    for (const id of Object.keys(P.genres)) {
        const genre = P.genres[id];
        const config = P.councilConfig[id] || {};
        const genreContext = genre.coachRules || undefined;
        out[id] = {};
        for (const path of pathways) {
            const base = { genreName: genre.label.en, lang: 'en', genreContext };
            let prompt;
            if (path.builder === 'buildPassagePrompt') {
                prompt = V.buildPassagePrompt({ ...base, scopeLabel: 'passage', text: 'STUDENT DRAFT TEXT', question: 'Help me here.' });
            } else if (path.builder === 'buildFullDraftPrompt') {
                prompt = V.buildFullDraftPrompt({ ...base, lensLabel: 'Structure', purpose: 'review', words: 3, text: 'STUDENT DRAFT TEXT' });
            } else if (path.builder === 'buildCouncilReviewerPrompt') {
                prompt = V.buildCouncilReviewerPrompt({ ...base, roleLabel: 'Reviewer', roleMandate: 'Mandate', prohibitions: config.prohibitions || [], text: 'STUDENT DRAFT TEXT' });
            } else {
                prompt = V.buildCouncilSynthesisPrompt({ ...base, synthesisOrder: config.synthesisOrder || [], findingsJson: '{}' });
            }
            out[id][path.key] = prompt;
        }
    }
    return out;
}, PATHWAYS);

const profileIds = Object.keys(matrix);

console.log('\n1. Eleven distinct profiles remain');
check('exactly eleven profiles', profileIds.length === 11, `${profileIds.length}`);
const labels = await page.evaluate(() => Object.values(window.StudioProfiles.genres).map(g => g.label.en));
check('all eleven labels are distinct', new Set(labels).size === 11, `${new Set(labels).size} distinct`);

console.log('\n2. Every covered profile carries its safeguards on all five pathways');
for (const [id, marker] of Object.entries(MARKERS)) {
    const missing = PATHWAYS.filter(p => !matrix[id][p.key].includes(marker)).map(p => p.key);
    check(`${id}: safeguards reach all 5 pathways`, missing.length === 0, `missing on ${missing.join(', ')}`);
}

console.log('\n3. B3 — no outcome prediction, on every pathway, for admissions and SOP');
const B3 = 'Never predict or estimate whether the writer will be accepted, admitted, selected, funded, interviewed, waitlisted, deferred, or rejected';
for (const id of ['admissions', 'sop']) {
    const missing = PATHWAYS.filter(p => !matrix[id][p.key].includes(B3)).map(p => p.key);
    check(`${id}: outcome-prediction prohibition reaches all 5 pathways`, missing.length === 0, `missing on ${missing.join(', ')}`);
    // Prompt strings use a straight apostrophe, matching AUTHORSHIP_RULES and
    // the STEM/Reading texts. Only student-facing UI copy uses the typographic
    // form. Asserted literally so a silent character swap would fail here.
    check(`${id}: refuses a chances rating in any form`,
        PATHWAYS.every(p => matrix[id][p.key].includes("never rate the draft's chances")));
    check(`${id}: answers the direct question instead of deflecting silently`,
        PATHWAYS.every(p => matrix[id][p.key].includes('say plainly that you cannot know')));
}
check('admissions keeps its pre-existing competitiveness prohibition verbatim',
    PATHWAYS.every(p => matrix.admissions[p.key].includes('Never predict admission outcomes or competitiveness, or compare the writer with other applicants.')));
check('sop keeps its pre-existing admission-chances prohibition verbatim',
    PATHWAYS.every(p => matrix.sop[p.key].includes('Never predict admission chances.')));

console.log('\n4. No cross-genre leakage, in either direction');
for (const id of profileIds) {
    const foreign = Object.entries(MARKERS).filter(([other, marker]) => other !== id
        && PATHWAYS.some(p => matrix[id][p.key].includes(marker))).map(([other]) => other);
    check(`${id}: carries no other profile's safeguards`, foreign.length === 0, `leaked: ${foreign.join(', ')}`);
}

console.log('\n5. B2 gap is real and asserted, not silently claimed as covered');
for (const id of UNCOVERED) {
    check(`${id}: still declares no coachRules (B2, not in this batch)`,
        await page.evaluate(key => !window.StudioProfiles.genres[key].coachRules, id));
    check(`${id}: therefore emits no GENRE GUIDANCE on any pathway`,
        PATHWAYS.every(p => !matrix[id][p.key].includes('GENRE GUIDANCE')));
}
check('exactly nine of eleven profiles are covered after B1',
    await page.evaluate(() => Object.values(window.StudioProfiles.genres).filter(g => g.coachRules).length) === 9);

console.log('\n6. De-duplication — no prohibition is transmitted twice in one prompt');
const dupes = await page.evaluate(() => {
    const P = window.StudioProfiles;
    const V = window.StudioProvider;
    const report = [];
    for (const id of Object.keys(P.genres)) {
        const genre = P.genres[id];
        const config = P.councilConfig[id] || {};
        const prompt = V.buildCouncilReviewerPrompt({
            genreName: genre.label.en, lang: 'en', genreContext: genre.coachRules || undefined,
            roleLabel: 'Reviewer', prohibitions: config.prohibitions || [], text: 'DRAFT',
        });
        for (const rule of (config.prohibitions || [])) {
            let count = 0;
            let index = prompt.indexOf(rule);
            while (index !== -1) { count++; index = prompt.indexOf(rule, index + 1); }
            if (count > 1) report.push(`${id}: "${rule.slice(0, 40)}…" ×${count}`);
        }
    }
    return report;
});
check('no Council prohibition appears twice in a Council prompt', dupes.length === 0, dupes.join(' | '));
check('admissions Council suppresses the duplicated PROHIBITED block (carried by GENRE GUIDANCE)',
    !matrix.admissions.council_reviewer.includes('PROHIBITED IN THIS GENRE'));
check('admissions protection is still present on the Council path',
    matrix.admissions.council_reviewer.includes(B3));
check('STEM Council keeps its purpose-built prohibition block (not verbatim-duplicated)',
    matrix.stem.council_reviewer.includes('PROHIBITED IN THIS GENRE'));
check('a Council prompt built without genre context still lists its prohibitions',
    await page.evaluate(() => window.StudioProvider.buildCouncilReviewerPrompt({
        genreName: 'Research paper', lang: 'en', roleLabel: 'r',
        prohibitions: window.StudioProfiles.councilConfig.research.prohibitions, text: 'd',
    }).includes('PROHIBITED IN THIS GENRE')));

console.log('\n7. Universal contracts are unchanged and still universal');
for (const id of profileIds) {
    check(`${id}: AUTHORSHIP_RULES on all four non-synthesis pathways`,
        PATHWAYS.filter(p => p.key !== 'council_synthesis')
            .every(p => matrix[id][p.key].includes('ABSOLUTE AUTHORSHIP RULE — this overrides everything else:')));
}
check('PASSAGE_READING_PROTOCOL still rides the passage pathways',
    profileIds.every(id => matrix[id].ask_tupana.includes('WHOLE-PASSAGE READING PROTOCOL — mandatory:')));
check('genre guidance is still marked additive, never relaxing the rules above it',
    profileIds.filter(id => !UNCOVERED.includes(id))
        .every(id => matrix[id].ask_tupana.includes('GENRE GUIDANCE (additive; it does NOT relax any rule above)')));

console.log('\n8. STEM and Reading Response safeguards preserved byte-for-byte');
const preserved = await page.evaluate(() => {
    const g = window.StudioProfiles.genres;
    return {
        stemPrefix: g.stem.coachRules.startsWith('This is scientific and technical writing. Support the WRITING; you cannot and must not adjudicate the science.'),
        stemCount: [g.stem, g.stemExplanation, g.stemArgument].filter(p => p.coachRules).length,
        readingPrefix: g.readingUg.coachRules.startsWith('This is a reading response: the student is responding to a text assigned to them.'),
        readingCount: [g.readingUg, g.readingGrad].filter(p => p.coachRules).length,
        stemCouncilEnabled: window.StudioProfiles.councilConfig.stem.enabled === true,
        readingUgCouncil: window.StudioProfiles.councilConfig.readingUg.enabled,
        readingGradCouncil: window.StudioProfiles.councilConfig.readingGrad.enabled,
        stemProhibitions: window.StudioProfiles.councilConfig.stem.prohibitions.length,
    };
});
check('the three STEM configurations retain their coachRules', preserved.stemCount === 3);
check('the STEM preamble is unchanged', preserved.stemPrefix);
check('both Reading Response configurations retain their coachRules', preserved.readingCount === 2);
check('the Reading Response preamble is unchanged', preserved.readingPrefix);
check('the purpose-built STEM Council stays enabled', preserved.stemCouncilEnabled);
check('the STEM Council keeps all five prohibitions', preserved.stemProhibitions === 5);
check('the Reading Response Councils stay deliberately disabled',
    preserved.readingUgCouncil !== true && preserved.readingGradCouncil !== true);

console.log('\n9. Provider contract — the four emitted kinds and the legacy fifth');
const contract = await page.evaluate(async origin => {
    const ui = await fetch(`${origin}/assets/js/studio/studio-ui.js`).then(r => r.text());
    const provider = await fetch(`${origin}/assets/js/studio/studio-provider.js`).then(r => r.text());
    const declared = [...provider.matchAll(/^\s{8}([a-z_]+): 'gemini/gm)].map(m => m[1]);
    return {
        declared,
        emitted: ['passage_analysis', 'full_draft_review', 'council_reviewer', 'council_synthesis']
            .filter(kind => ui.includes(`'${kind}'`)),
        capstoneInUi: (ui.match(/capstone_review/g) || []).length,
        capstoneDeclared: declared.includes('capstone_review'),
    };
}, ORIGIN);
check('the provider declares five wire request kinds', contract.declared.length === 5, contract.declared.join(', '));
check('studio-ui.js emits exactly four of them', contract.emitted.length === 4, contract.emitted.join(', '));
check('capstone_review is still declared in the provider contract', contract.capstoneDeclared);
check('capstone_review has zero references in the student UI — legacy, unreachable',
    contract.capstoneInUi === 0, `${contract.capstoneInUi} reference(s)`);

console.log('\n10. The wiring is real — a live request path carries the genre safeguard');
await page.evaluate(() => {
    localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
    localStorage.removeItem('tupana-studio:v1');
});
await page.goto(`${ORIGIN}/studio.html?assignment=college-personal-statement&provider=mock`);
await page.evaluate(() => {
    window.__sent = [];
    const original = window.StudioProvider.buildPassagePrompt;
    window.StudioProvider.buildPassagePrompt = payload => { const p = original(payload); window.__sent.push(p); return p; };
});
await page.locator('#draftEditor').fill('A real draft paragraph written for this wiring check.');
await page.waitForTimeout(300);
await page.locator('[data-action="focused-review"]').click();
await page.waitForTimeout(250);
await page.locator('input[name="reviewScope"][value="paragraph"]').check();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(800);
const sent = await page.evaluate(() => window.__sent);
check('the real focused-review path built one prompt', sent.length === 1, `${sent.length}`);
check('that real prompt carries the admissions safeguards', (sent[0] || '').includes(MARKERS.admissions));
check('that real prompt carries the B3 outcome-prediction prohibition', (sent[0] || '').includes(B3));
check('that real prompt carries no other genre\'s safeguards',
    Object.entries(MARKERS).filter(([id]) => id !== 'admissions').every(([, m]) => !(sent[0] || '').includes(m)));

console.log('\n11. Isolation');
check('no external requests', external.length === 0, external.join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
