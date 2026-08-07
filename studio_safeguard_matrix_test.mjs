// B1 + B2 + B3 + B7 — the profile-safeguard matrix.
//
// B1: one canonical source of profile safeguards, reaching every applicable AI
//     pathway rather than only the Council.
// B2: autobiographical and General Writing (`neutral`) safeguards, authored and
//     approved by the founder 2026-08-06, declared through that SAME canonical
//     source. Coverage is now ELEVEN of eleven profiles across all five
//     student-reachable pathways. B2 also introduces the only genuinely
//     Council-format-specific rule in the product (autobiographical), carried
//     as an ADDITIVE Council rule — appended, never duplicated.
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
// ELEVEN distinct profiles are a founder-accepted product property. One generic
// rule set for all eleven is explicitly rejected, so every profile is asserted
// to carry ITS OWN marker and NO other profile's — in both directions.
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
    autobiographical: 'Pain is not the source of good autobiographical writing',
    neutral: 'no genre profile is active for this draft',
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
// Every profile is now covered. Kept as an explicit empty set so that a future
// regression which drops a profile's safeguards has to change this line rather
// than quietly reduce the count.
const UNCOVERED = [];

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

console.log('\n2. B2 — every one of the eleven profiles carries its safeguards on all five pathways');
// Parameterized over the profiles the app actually loads, not over a hand-kept
// list: a new profile that declares no safeguards fails here immediately.
check('a distinguishing marker is registered for all eleven profiles',
    profileIds.every(id => Object.hasOwn(MARKERS, id)) && Object.keys(MARKERS).length === profileIds.length,
    `markers ${Object.keys(MARKERS).length} vs profiles ${profileIds.length}: ${profileIds.filter(id => !Object.hasOwn(MARKERS, id)).join(', ')}`);
for (const id of profileIds) {
    const missing = PATHWAYS.filter(p => !matrix[id][p.key].includes(MARKERS[id])).map(p => p.key);
    check(`${id}: safeguards reach all 5 pathways`, missing.length === 0, `missing on ${missing.join(', ')}`);
}
check('11/11 profiles × 5 pathways all carry a genre safeguard',
    profileIds.length === 11
    && profileIds.every(id => PATHWAYS.every(p => matrix[id][p.key].includes(MARKERS[id]))));

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

console.log('\n5. B2 — the two profiles that were uncovered after B1 are now covered');
check('no profile remains on the uncovered list', UNCOVERED.length === 0, UNCOVERED.join(', '));
check('all eleven profiles declare coachRules',
    await page.evaluate(() => Object.values(window.StudioProfiles.genres).filter(g => g.coachRules).length) === 11);
for (const id of ['autobiographical', 'neutral']) {
    check(`${id}: declares coachRules through the canonical source`,
        await page.evaluate(key => Boolean(window.StudioProfiles.genres[key].coachRules), id));
    check(`${id}: emits GENRE GUIDANCE on every pathway`,
        PATHWAYS.every(p => matrix[id][p.key].includes('GENRE GUIDANCE')));
}

// The specific harms the founder authorized these texts to prevent. Asserted by
// their exact transmitted sentences, on all five pathways, so a reword cannot
// silently drop one.
const B2_AUTOBIOGRAPHICAL = [
    ['no invented lived experience', 'Never invent, complete, intensify, dramatize, or supply any part of the writer\'s life'],
    ['no inference of unstated identity, status, or diagnosis', 'Never infer or name what the writer did not say'],
    ['no disclosure pressure for a stronger essay', 'Never encourage disclosure in order to strengthen the writing'],
    ['trauma is not the price of authenticity', 'Pain is not the source of good autobiographical writing'],
    ['the writer keeps authority over meaning', 'The writer retains authority over what happened and what the experience means to them'],
    ['uncertainty is not converted into fact', 'Never convert "I think", "maybe", "I don\'t remember", or "someone told me" into settled fact'],
    ['declining is an authorship decision, and a non-disclosing route exists', 'offer a route that does not require disclosure'],
    ['translingual and cultural language is not flattened', 'are meaningful writing choices, not errors by default'],
    ['craft is supported without manufacturing content', 'never by adding material of your own'],
    ['no clinical screening, and no override of universal safety rules', 'not a counselor, evaluator, or clinical screener'],
    ['voluntary lived-experience writing stays fully welcome', 'None of this places personal, cultural, community, family, political, or identity-related material off-limits'],
];
for (const [label, sentence] of B2_AUTOBIOGRAPHICAL) {
    const missing = PATHWAYS.filter(p => !matrix.autobiographical[p.key].includes(sentence)).map(p => p.key);
    check(`autobiographical: ${label} — all 5 pathways`, missing.length === 0, `missing on ${missing.join(', ')}`);
}

const B2_NEUTRAL = [
    ['the assignment is acknowledged as unseen', 'You have not seen the assignment, the rubric, the syllabus, the course'],
    ['no invented content, hypotheticals clearly labeled', 'A clearly labeled hypothetical example may be used to explain a writing principle'],
    ['no invented requirements', 'Never invent a requirement.'],
    ['names the missing context instead of guessing or stalling', 'Do not guess, and do not stall.'],
    ['suggestion is distinguished from disciplinary requirement', 'Distinguish a writing suggestion you are offering from a requirement set by an instructor'],
    ['no outcome prediction', 'Never predict or estimate an outcome'],
    ['no assumptions imported from another Tu Pana genre', 'Never import another genre\'s expectations'],
    ['meaning and voice preserved, writer decides on adaptation', 'let the writer decide'],
    ['writer-reported context is attributed, never upgraded', 'Never upgrade what the writer reported into a fact you verified'],
    ['still useful for drafting and revision, not a refusal layer', 'Not knowing the assignment is not a reason to be unhelpful'],
];
for (const [label, sentence] of B2_NEUTRAL) {
    const missing = PATHWAYS.filter(p => !matrix.neutral[p.key].includes(sentence)).map(p => p.key);
    check(`neutral: ${label} — all 5 pathways`, missing.length === 0, `missing on ${missing.join(', ')}`);
}

console.log('\n5b. B2 — the one genuinely Council-specific rule is additive, not duplicated');
const COUNCIL_ONLY = 'COUNCIL-SPECIFIC: never frame a disagreement between reviewers as a question';
check('autobiographical Council reviewer carries the Council-specific rule',
    matrix.autobiographical.council_reviewer.includes(COUNCIL_ONLY));
check('it is listed under PROHIBITED IN THIS GENRE, the additive Council carrier',
    matrix.autobiographical.council_reviewer.includes('PROHIBITED IN THIS GENRE'));
check('it never reaches the four single-coach pathways, which have no panel',
    PATHWAYS.filter(p => p.key !== 'council_reviewer')
        .every(p => !matrix.autobiographical[p.key].includes(COUNCIL_ONLY)));
check('it is NOT in coachRules, so the de-duplication filter cannot remove it',
    await page.evaluate(() => !window.StudioProfiles.genres.autobiographical.coachRules.includes('COUNCIL-SPECIFIC')));
// Scoped to the PROHIBITED block itself: the generic RULES: section further
// down uses the same bullet character, so a whole-prompt count would measure
// the wrong thing.
const autoProhibitedBlock = matrix.autobiographical.council_reviewer
    .split('PROHIBITED IN THIS GENRE:\n')[1].split('\nRULES:')[0];
const autoProhibitedBullets = (autoProhibitedBlock.match(/^- /gm) || []).length;
check('autobiographical PROHIBITED block lists exactly one rule — the eleven shared rules are suppressed',
    autoProhibitedBullets === 1, `${autoProhibitedBullets} listed`);
check('and that one listed rule is the Council-specific one',
    autoProhibitedBlock.includes(COUNCIL_ONLY));
check('the canonical source declares 11 shared + 1 Council-only for autobiographical',
    await page.evaluate(() => window.StudioProfiles.councilConfig.autobiographical.prohibitions.length) === 12);
check('neutral has no Council-specific rule and no PROHIBITED block',
    !matrix.neutral.council_reviewer.includes('PROHIBITED IN THIS GENRE'));
check('neutral protection is still present on the Council path',
    matrix.neutral.council_reviewer.includes(MARKERS.neutral));

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

console.log('\n8a. The nine pre-B2 safeguard sets and the two universal contracts, byte-for-byte');
// SHA-256 of each text as it stood at 9dc2020 (the pre-B2 commit), verified
// equal there before being recorded here. A single character changed anywhere
// in these eleven texts fails this section — which is stricter than the prefix
// checks below, and is the actual preservation guarantee B2 was required to
// honor. AUTHORSHIP_RULES and PASSAGE_READING_PROTOCOL are extracted from a
// real built prompt, not from source, so the assertion covers what is
// transmitted rather than what is declared.
// F2 (2026-08-07) — cap200 is the ONE deliberate, founder-authorized exception
// to this section. It gained a direct-request refusal clause, so its pre-B2
// digest 651ad12c42b49dadb7a479511ae800e7e638fecc7420cdab6f36f04c69bc2f1a no
// longer holds and is re-baselined below rather than relaxed away. The two
// sentences that existed before F2 are separately asserted verbatim further
// down, so this remains a preservation guarantee: F2 must be ADDITIVE. Every
// other entry keeps its original pre-B2 digest untouched.
const PRE_B2_SHA256 = {
    admissions: 'a6ecc4e80f71d9f9edcc61dc2490ddf7b5ccb95051173c342a7c92c9afa7d857',
    sop: '1e13a5c3dbe94743acdf1557fa6a7c98a75f3a492e0bc5528ff653e08a85b637',
    cap200: 'bac5d093262218ea6aafa4d2285062993e617ce61c71101d9e6e14e2d8f9e00c',
    research: '6657ba9ea5b48bed48f879666434a38a48f38975a1ae92e3597c159121b32981',
    stem: 'd8b742999fc4f654e6a161416325b23f7641b7c341d1dab6b610cf5604f8f0d4',
    stemExplanation: '2f0398b34c812ae2fa17f1e37c66e296cd6ef16206c0198e791b7ded729e13f7',
    stemArgument: 'c73154f6f08bd0d96f448ed7f9df6d68d2a0c20b38f1c7b26e121a265ee18c37',
    readingUg: 'a647759e53043d06cc87297b5b50526c38ce93deea1693b5d2c3bf6ea5656532',
    readingGrad: '67110f053b05f3273c17419093db961b2fe155a617f895d3b5fc431368c3aea8',
};
const UNIVERSAL_SHA256 = {
    AUTHORSHIP_RULES: 'e55d987d986bd4d389ec2b139f5bcb5d3dc9de1d79dc32564764c0d77babb9d8',
    PASSAGE_READING_PROTOCOL: 'cdb922d17ca71fddd46245191f4fe71e0047d999ac2105de00e5f0cd8c1e9150',
};
const digests = await page.evaluate(async ids => {
    const sha = async text => {
        const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
    };
    const out = { nine: {}, universal: {} };
    for (const id of ids) out.nine[id] = await sha(window.StudioProfiles.genres[id].coachRules);
    const prompt = window.StudioProvider.buildPassagePrompt({
        genreName: 'x', lang: 'en', scopeLabel: 'passage', text: 'T', question: 'Q',
    });
    out.universal.AUTHORSHIP_RULES = await sha(prompt.split('\n\n')[0]);
    out.universal.PASSAGE_READING_PROTOCOL = await sha(
        prompt.split('[END SELECTED TEXT]\n\n')[1].split('\n\nSTUDENT REQUEST:')[0]);
    return out;
}, Object.keys(PRE_B2_SHA256));
for (const [id, expected] of Object.entries(PRE_B2_SHA256)) {
    const label = id === 'cap200'
        ? 'cap200: safeguard text pinned at its post-F2 baseline (sha256)'
        : `${id}: safeguard text unchanged by B2 (sha256)`;
    check(label, digests.nine[id] === expected, digests.nine[id]);
}

// F2 is additive, and that is asserted rather than assumed: both sentences that
// existed before it must still travel verbatim, and the new clause must reach
// every student-reachable pathway exactly as the rest of the set does.
const F2_CLAUSE = 'If the writer asks you directly to invent, inflate, round up, or embellish service hours';
const cap200Pathways = matrix.cap200;
check('cap200 keeps its pre-F2 embellishment prohibition verbatim',
    (cap200Pathways.ask_tupana || '').includes('Never suggest inventing or embellishing service activities, hours, partners, or data.'));
check('cap200 keeps its pre-F2 deficit-framing prohibition verbatim',
    (cap200Pathways.ask_tupana || '').includes('Never recommend framing the community in deficit terms.'));
const f2Missing = PATHWAYS.filter(p => !(cap200Pathways[p.key] || '').includes(F2_CLAUSE)).map(p => p.key);
check('F2 direct-request refusal clause reaches all 5 pathways', f2Missing.length === 0, `missing on ${f2Missing.join(', ')}`);
check('F2 clause names accurate reporting as the redirect, not just a refusal',
    (cap200Pathways.ask_tupana || '').includes('Redirect to accurate reporting'));
check('F2 forbids follow-up questions that presuppose the invented amount',
    (cap200Pathways.ask_tupana || '').includes('do not ask follow-up questions that treat the invented amount as real'));
// The founder boundary for this package: F2 was NOT broadened mechanically.
for (const id of ['research', 'admissions', 'sop', 'neutral', 'autobiographical']) {
    check(`${id} did not inherit the cap200 F2 clause`,
        !(matrix[id]?.ask_tupana || '').includes(F2_CLAUSE));
}
for (const [name, expected] of Object.entries(UNIVERSAL_SHA256)) {
    check(`${name}: transmitted byte-for-byte as before B2 (sha256)`,
        digests.universal[name] === expected, digests.universal[name]);
}

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

console.log('\n10b. The same wiring check on a B2 profile — autobiographical, the highest-stakes route');
await page.evaluate(() => {
    localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
    localStorage.removeItem('tupana-studio:v1');
});
await page.goto(`${ORIGIN}/studio.html?assignment=mixed-genre-autobiographical-essay&provider=mock`);
await page.evaluate(() => {
    window.__sent = [];
    const original = window.StudioProvider.buildPassagePrompt;
    window.StudioProvider.buildPassagePrompt = payload => { const p = original(payload); window.__sent.push(p); return p; };
});
await page.locator('#draftEditor').fill('Mi tia said aqui escuchamos primero, and I did not understand it then.');
await page.waitForTimeout(300);
await page.locator('[data-action="focused-review"]').click();
await page.waitForTimeout(250);
await page.locator('input[name="reviewScope"][value="paragraph"]').check();
await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(800);
const autoSent = await page.evaluate(() => window.__sent);
check('the real autobiographical focused-review path built one prompt', autoSent.length === 1, `${autoSent.length}`);
const autoPrompt = autoSent[0] || '';
check('that real prompt carries the B2 autobiographical safeguards', autoPrompt.includes(MARKERS.autobiographical));
check('that real prompt refuses invented lived experience',
    autoPrompt.includes('Never invent, complete, intensify, dramatize, or supply any part of the writer\'s life'));
check('that real prompt refuses disclosure pressure',
    autoPrompt.includes('Never encourage disclosure in order to strengthen the writing'));
check('that real prompt keeps universal AUTHORSHIP_RULES above the genre set',
    autoPrompt.indexOf('ABSOLUTE AUTHORSHIP RULE') === 0
    && autoPrompt.indexOf(MARKERS.autobiographical) > autoPrompt.indexOf('ABSOLUTE AUTHORSHIP RULE'));
check('that real prompt still marks genre guidance as additive, not a replacement',
    autoPrompt.includes('GENRE GUIDANCE (additive; it does NOT relax any rule above)'));
check('that real prompt carries no other genre\'s safeguards',
    Object.entries(MARKERS).filter(([id]) => id !== 'autobiographical').every(([, m]) => !autoPrompt.includes(m)));
check('that real single-coach prompt carries no Council-specific rule', !autoPrompt.includes(COUNCIL_ONLY));

console.log('\n11. Isolation');
check('no external requests', external.length === 0, external.join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
