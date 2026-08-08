// Writing Studio — BOUNDED LIVE Gemini validation (founder-testing readiness pass).
// NOT part of the deterministic battery: refuses to run without STUDIO_LIVE=1.
// Uses only synthetic dummy writing; hard ceiling 30 provider calls; records
// request kind, genre, language, outcome, latency, validation, and usage counts.
// Raw payloads are not persisted anywhere; response text prints to stdout only
// for transient pedagogical review.
// Requires this worktree served at http://localhost:3001 (a Worker-allowed origin).
import { chromium } from 'playwright';

if (process.env.STUDIO_LIVE !== '1') {
    console.log('studio_live_check: refusing to run without STUDIO_LIVE=1 (live Gemini calls).');
    process.exit(0);
}

const ORIGIN = 'http://localhost:3001';
const KEY = 'tupana-studio:v1';
// Scope and ceiling are declared by the caller. The fall-readiness pass runs
// STUDIO_LIVE_SCOPE=fall with a ceiling of 6.
const SCOPE = process.env.STUDIO_LIVE_SCOPE || 'default';
const CALL_CEILING = Number(process.env.STUDIO_LIVE_CEILING || (SCOPE === 'fall' || SCOPE === 'reflect' || SCOPE === 'structure' ? 6 : 30));
let callsUsed = 0;
const results = [];
const browser = await chromium.launch({ headless: true });

const DRAFTS = {
    autobiographical: 'En la biblioteca del barrio, mi tía me corrigió con tres palabras: “aquí escuchamos primero.” I had treated translation as a quick exchange of words. Her phrase made me notice who was expected to adapt and whose knowledge counted. This synthetic draft connects that chosen moment to the history of public institutions serving multilingual neighborhoods, and it keeps “aquí escuchamos primero” exactly as she said it, porque esa frase carga la historia.',
    admissions: 'The first week at the neighborhood learning center, I designed a color-coded signup sheet because I thought efficiency was the problem. By Friday, I understood that the real problem was trust. Families did not need a faster form; they needed someone to explain what the form would change. I began sitting beside each visitor, listening before writing anything down. That shift now guides how I approach community technology and the questions I hope to study.',
    sop: 'My work on a synthetic transit-accessibility project taught me how technical decisions become public consequences. I entered focused on routing efficiency and left asking how disabled riders could shape the systems intended to serve them. I built the intake survey, coded ninety responses, and presented the findings to the project team. Graduate study in human-centered computing would let me investigate participatory design with the rigor this question deserves.',
    research: 'Los huertos comunitarios se describen a menudo como soluciones a la inseguridad alimentaria, pero mis fuentes sintéticas no coinciden en cuánto ayudan realmente. Una fuente mide cambios en la dieta; otra estudia la participación cívica. Puestas en conversación, sugieren que el beneficio es real pero distinto del que se suele afirmar. Este párrafo sintético modela cómo un trabajo de investigación pone las fuentes en diálogo en vez de resumirlas una por una.',
    neutral: 'This synthetic piece argues that the campus library should extend evening hours during exam weeks. It opens with the observed line outside the building at closing time, offers one usage statistic the writer collected, and addresses the cost objection directly. The conclusion asks the reader to weigh a modest expense against a measurable benefit for students who work day shifts.',
    cap200: 'Durante mis diez horas en la despensa de alimentos del vecindario, registré cada turno y escribí un diario breve después de cada visita. Para la tercera semana, mis notas mostraban un patrón: los voluntarios pasaban tanto tiempo explicando reglas de elegibilidad como entregando alimentos. Esa observación se conecta con el concepto del curso de barreras estructurales al acceso. Este reporte sintético usa solo horas registradas y notas reales del diario.',
    readingUg: 'In the assigned chapter the author claims that access improved after the policy took effect. On my own campus the same policy arrived and the line at the financial aid office got longer, which makes me doubt that access and availability mean the same thing here. The chapter treats them as interchangeable, and that is the assumption this synthetic response wants to question. The author writes that "participation rose sharply," but I only have this one line from the handout and not the surrounding pages.',
    readingGrad: 'Read alongside the earlier chapter, the argument depends on treating participation as an outcome rather than a process. That move is what makes the concluding claim available, and it is also what this synthetic response contests. If participation is a process, the evidence assembled here measures its residue rather than its occurrence, and the methodological consequence is that the study cannot distinguish sustained involvement from a single documented encounter. A competing reading would hold that the distinction collapses at the scale the study works in.',
    stemArgument: 'The warmer tank produced visibly more algae over the three-week period, which supports temperature as the driver of growth in this synthetic setup. Light reaching the two tanks was never measured, so an unequal light source could produce the same result. Distinguishing the two would require a light meter reading at both tank positions across the period, which this setup did not include. The mean difference was 2.4 cm of surface coverage across twelve observations.',
    stem: 'The basil seedlings exposed to eight hours of light grew an average of 2.4 centimeters more than the seedlings exposed to four hours. This result supports the prediction that longer light exposure increases early stem growth under otherwise controlled conditions. The small sample size and one unusually tall seedling limit the strength of the conclusion. A second synthetic trial with more plants would test whether the pattern persists.',
};

let page = null;
async function fresh(assignment, lang = 'en') {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(15000);
    // DRY PASS. STUDIO_LIVE_DRY=1 runs the exact same case list against the
    // deterministic mock provider, so the harness mechanics are rehearsed end
    // to end with zero provider calls and zero cost before any money is spent.
    const providerParam = process.env.STUDIO_LIVE_DRY === '1' ? 'mock' : 'gemini';
    await page.goto(`${ORIGIN}/studio.html?provider=${providerParam}${assignment ? `&assignment=${assignment}` : ''}`);
    // Onboarding answered: this harness exercises the Desk's AI surfaces, not
    // the first-run welcome (which makes no provider call of any kind).
    await page.evaluate(key => {
        localStorage.removeItem(key);
        localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
    }, KEY);
    await page.reload();
    if (lang !== 'en') await page.locator('.prototype-actions [data-action="language"]').selectOption(lang);
}
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);

function guardCeiling(planned) {
    if (callsUsed + planned > CALL_CEILING) {
        console.log(`CEILING: ${callsUsed} used + ${planned} planned exceeds ${CALL_CEILING}. Stopping.`);
        throw new Error('call ceiling');
    }
}

async function passageCase(assignment, lang, useVoice = false) {
    guardCeiling(2); // 1 call + possible 1 retry
    await fresh(assignment, lang);
    const draft = DRAFTS[assignment.includes('reading-response-under') ? 'readingUg' : assignment.includes('reading-response-grad') ? 'readingGrad' : assignment.includes('cap') ? 'cap200' : assignment.includes('research') ? 'research' : assignment.includes('sop') ? 'sop' : assignment.includes('statement') ? 'admissions' : assignment.includes('stem') ? 'stem' : assignment.includes('autobiographical') ? 'autobiographical' : 'neutral'];
    await page.locator('#draftEditor').fill(draft);
    await page.waitForTimeout(240);
    if (useVoice) {
        const phrase = 'the real problem was trust';
        await page.locator('#draftEditor').evaluate((el, selected) => {
            const start = el.value.indexOf(selected);
            el.focus(); el.setSelectionRange(start, start + selected.length);
            el.dispatchEvent(new Event('select', { bubbles: true }));
        }, phrase);
        await page.waitForTimeout(350);
        await page.locator('[data-action="protect-phrase"]').click();
        await page.keyboard.press('Escape');
        await page.waitForTimeout(150);
    }
    const sentence = draft.split('.')[0] + '.';
    await page.locator('#draftEditor').evaluate((el, selected) => {
        const start = el.value.indexOf(selected);
        el.focus(); el.setSelectionRange(start, start + selected.length);
        el.dispatchEvent(new Event('select', { bubbles: true }));
    }, sentence);
    await page.waitForTimeout(350);
    await page.locator('[data-action="passage-review"]').click();
    if (useVoice) {
        await page.locator('.voice-constraint summary, details.voice-constraint > summary').first().click().catch(() => {});
        await page.locator('#includeVoiceEntries').check().catch(() => {});
    }
    await page.locator('#transmitConsent').check();
    const started = Date.now();
    await page.locator('[data-action="submit-mock"]').click();
    const outcome = await Promise.race([
        page.waitForFunction(key => (JSON.parse(localStorage.getItem(key) || '{}').reviews || []).length === 1, KEY, { timeout: 90000 }).then(() => 'ok'),
        page.locator('.provider-error').waitFor({ timeout: 90000 }).then(() => 'failure'),
    ]).catch(() => 'timeout');
    const latency = Date.now() - started;
    const record = await stored();
    callsUsed += 1;
    const review = record.reviews?.[0];
    results.push({ case: `passage:${assignment}:${lang}${useVoice ? ':voice' : ''}`, kind: 'passage_analysis', outcome, latency, provider: review?.provider, truncated: review?.truncated, textLen: review?.suggestion?.length || 0, draftIntact: record.draft === draft || record.draft.startsWith(draft) });
    if (review) console.log(`\n===== RESPONSE [passage ${assignment} ${lang}] (${latency}ms) =====\n${review.suggestion}\n`);
    else console.log(`\n===== FAILED [passage ${assignment} ${lang}]: ${await page.locator('.provider-error').textContent().catch(() => outcome)}`);
}

async function fullDraftCase(assignment, lang) {
    guardCeiling(2);
    await fresh(assignment, lang);
    const draft = DRAFTS[assignment.includes('reading-response-grad') ? 'readingGrad' : assignment.includes('reading-response-under') ? 'readingUg' : assignment.includes('research') ? 'research' : assignment.includes('sop') ? 'sop' : 'neutral'];
    await page.locator('#draftEditor').fill(draft);
    await page.waitForTimeout(240);
    await page.locator('[data-action="focused-review"]').click();
    await page.locator('input[name="reviewScope"][value="full"]').check();
    await page.locator('#transmitConsent').check();
    const started = Date.now();
    await page.locator('[data-action="submit-mock"]').click();
    const outcome = await Promise.race([
        page.waitForFunction(key => (JSON.parse(localStorage.getItem(key) || '{}').reviews || []).length === 1, KEY, { timeout: 90000 }).then(() => 'ok'),
        page.locator('.provider-error').waitFor({ timeout: 90000 }).then(() => 'failure'),
    ]).catch(() => 'timeout');
    const latency = Date.now() - started;
    const record = await stored();
    callsUsed += 1;
    const review = record.reviews?.[0];
    results.push({ case: `fulldraft:${assignment}:${lang}`, kind: 'full_draft_review', outcome, latency, provider: review?.provider, truncated: review?.truncated, textLen: review?.suggestion?.length || 0, draftIntact: record.draft === draft });
    if (review) console.log(`\n===== RESPONSE [full-draft ${assignment} ${lang}] (${latency}ms) =====\n${review.suggestion}\n`);
    else console.log(`\n===== FAILED [full-draft ${assignment} ${lang}]: ${await page.locator('.provider-error').textContent().catch(() => outcome)}`);
}

async function councilCase(assignment, lang) {
    guardCeiling(SCOPE === 'fall' ? 4 : 8); // true cost 4; wider headroom outside the bounded pass
    await fresh(assignment, lang);
    const draft = DRAFTS[assignment.includes('scientific-argument') ? 'stemArgument' : assignment.includes('cap') ? 'cap200' : 'autobiographical'];
    await page.locator('#draftEditor').fill(draft);
    await page.waitForTimeout(240);
    await page.locator('[data-action="council"]').first().click();
    await page.locator('#transmitConsent').check();
    const started = Date.now();
    await page.locator('[data-action="run-council"]').click();
    const outcome = await Promise.race([
        page.waitForFunction(key => (JSON.parse(localStorage.getItem(key) || '{}').councilRuns || []).length === 1, KEY, { timeout: 180000 }).then(() => 'ok'),
        page.locator('.provider-error').waitFor({ timeout: 180000 }).then(() => 'failure'),
    ]).catch(() => 'timeout');
    const latency = Date.now() - started;
    const record = await stored();
    const run = record.councilRuns?.[0];
    callsUsed += run ? run.calls : 4;
    const anchorsValid = run ? run.findings.every(f => !f.quote || draft.toLowerCase().replace(/\s+/g, ' ').includes(f.quote.toLowerCase().replace(/[“”]/g, '"').replace(/\s+/g, ' ').slice(0, 40).split(' ').slice(0, 5).join(' '))) : null;
    results.push({ case: `council:${assignment}:${lang}`, kind: 'council', outcome, latency, status: run?.status, calls: run?.calls, findings: run?.findings?.length, dropped: run?.droppedCount, priorities: run?.report?.priorities?.length, disagreements: run?.report?.disagreements?.length, anchorsValid, draftIntact: record.draft === draft });
    if (run) console.log(`\n===== COUNCIL REPORT [${assignment} ${lang}] (${latency}ms, status ${run.status}, dropped ${run.droppedCount}) =====\nSUMMARY: ${run.report.summary}\n${run.findings.map(f => `- [${f.role}${f.corroborated ? ' ✓✓' : ''}${f.confidence === 'low' ? ' tentative' : ''}] ${f.suggestion}\n  QUOTE: “${f.quote || '(none)'}”${f.voiceNote ? `\n  VOICE: ${f.voiceNote}` : ''}`).join('\n')}\nPRESERVE: ${run.report.preserve.map(item => `“${item.quote}” — ${item.why}`).join(' | ') || '(none)'}\nDISAGREEMENTS: ${run.report.disagreements.map(item => `${item.question} [${item.positions.map(position => `${position.roleKey}: ${position.view}`).join(' vs ')}]`).join(' | ') || '(none)'}\n`);
    else console.log(`\n===== COUNCIL FAILED [${assignment} ${lang}]: ${await page.locator('.provider-error').textContent().catch(() => outcome)}`);
}

// ── Refinement A — bounded live validation of the reflection contract ───────
// The Ask Tu Pana pathway, because that is where the 1E defect was observed and
// where the contract now rides. Each case records ONLY what can be judged
// without keeping the writer's text: the lens the model recommended, the
// question it wrote, whether that question survived Tu Pana's validation, and
// whether any transport label or scaffolding survived into the visible prose.
const REFLECT_SENTINELS = ['<<TP-', 'TP-LENS', 'TP-QUESTION', 'TU PANA REFLECTION', 'cultural_knowledge',
    // Refinement B — the three additional transport labels and the structure
    // contract's own heading. None may survive into visible or stored text.
    'TP-NOTICED', 'TP-GUIDE', 'TP-WHY', 'TU PANA FEEDBACK STRUCTURE'];

// Genre-appropriate synthetic drafts. The earlier substring guess sent the
// generic library-hours paragraph to service-learning and graduate-SOP cases,
// which makes a live observation about genre-specific rationale worth less.
const COACH_DRAFT_BY_ASSIGNMENT = {
    'college-personal-statement': 'admissions',
    'research-paper': 'research',
    'graduate-sop': 'sop',
    'cap200-bronx-beautiful-service-learning': 'cap200',
    'reading-response-undergraduate': 'readingUg',
    'mixed-genre-autobiographical-essay': 'autobiographical',
};

async function coachCase(assignment, lang, question, label) {
    guardCeiling(2); // 1 call + the adapter's possible transparent retry
    await fresh(assignment, lang);
    const draft = DRAFTS[COACH_DRAFT_BY_ASSIGNMENT[assignment] || 'neutral'];
    await page.locator('#draftEditor').fill(draft);
    await page.waitForTimeout(240);
    await page.locator('[data-action="coach"]').first().click();
    await page.waitForTimeout(250);
    if (question) await page.locator('#coachQuestion').fill(question);
    const requestPreview = (await page.locator('#coachRequestPreview').textContent()) || '';
    await page.locator('#transmitConsent').check();
    const started = Date.now();
    await page.locator('[data-action="submit-mock"]').click();
    const outcome = await Promise.race([
        page.waitForFunction(key => (JSON.parse(localStorage.getItem(key) || '{}').reviews || []).length === 1, KEY, { timeout: 90000 }).then(() => 'ok'),
        page.locator('.provider-error').waitFor({ timeout: 90000 }).then(() => 'failure'),
    ]).catch(() => 'timeout');
    const latency = Date.now() - started;
    const record = await stored();
    callsUsed += 1;
    const review = record.reviews?.[0];
    const visible = await page.evaluate(() => document.body.innerText);
    const leaked = REFLECT_SENTINELS.filter(marker =>
        (review?.suggestion || '').includes(marker) || visible.includes(marker) || JSON.stringify(record).includes(marker));
    results.push({
        case: `coach:${label}:${assignment}:${lang}`, kind: 'passage_analysis', outcome, latency,
        requestDefaulted: review?.requestDefaulted, questionStored: review?.question,
        lens: review?.criticalKey, reflectionSource: review?.criticalSource,
        reflectionReason: review?.reflectionReason || null,
        reflectionQuestion: review?.criticalQuestionAsked || null,
        sentinelsLeaked: leaked, textLen: review?.suggestion?.length || 0,
        draftIntact: record.draft === draft,
        // Refinement B — what can be judged about the SHAPE without keeping the
        // writer's text: whether the structure arrived, how many questions, how
        // long the observation is, whether every question is interrogative, and
        // whether the collapsed rationale merely repeats the observation.
        structured: Boolean(review?.structured),
        structureReason: review?.structureReason || null,
        whyReason: review?.whyReason || null,
        residualDropped: review?.residualDropped ?? null,
        observationWords: review?.structured ? review.structured.observation.split(/\s+/).filter(Boolean).length : null,
        questionCount: review?.structured ? review.structured.questions.length : null,
        allInterrogative: review?.structured ? review.structured.questions.every(entry => entry.trim().endsWith('?')) : null,
        whyPresent: review?.structured ? Boolean(review.structured.why) : null,
        whyRepeatsObservation: review?.structured?.why ? review.structured.why.includes(review.structured.observation) : null,
    });
    if (review) {
        console.log(`\n===== RESPONSE [coach ${label} ${assignment} ${lang}] (${latency}ms) =====`);
        console.log(`REQUEST SENT: ${requestPreview}`);
        if (review.structured) {
            console.log(`NOTICED (${review.structured.observation.split(/\s+/).filter(Boolean).length} words):\n${review.structured.observation}`);
            console.log(`GUIDING QUESTIONS (${review.structured.questions.length}):`);
            review.structured.questions.forEach((entry, index) => console.log(`  ${index + 1}. ${entry}`));
            console.log(`WHY THIS MATTERS: ${review.structured.why || '(absent — reason: ' + (review.whyReason || 'n/a') + ')'}`);
        } else {
            console.log(`FEEDBACK (unstructured; reason=${review.structureReason}):\n${review.suggestion}`);
        }
        console.log(`REFLECTION: lens=${review.criticalKey} source=${review.criticalSource}${review.reflectionReason ? ` reason=${review.reflectionReason}` : ''}`);
        console.log(`QUESTION: ${review.criticalQuestionAsked || '(governed fallback shown)'}\n`);
    } else {
        console.log(`\n===== FAILED [coach ${label} ${assignment} ${lang}]: ${await page.locator('.provider-error').textContent().catch(() => outcome)}`);
    }
}

// Rerun subset after the model-parameter fix (first round used 15 calls incl.
// 2 diagnostic probes; passage + zero-call cases already validated).
// FALL-READINESS SCOPE — exactly 6 declared calls, the minimum that exercises
// the two genuinely new model-facing surfaces:
//   1 call  reading-response passage coaching (source-integrity rules, EN)
//   1 call  reading-response full-draft review (graduate configuration, ES)
//   4 calls STEM Council (3 reviewers + 1 synthesis) — newly operational
// 5 planned calls against a ceiling of 6: one call is deliberately reserved,
// because the Gemini adapter retries retryable categories transparently and a
// prior pass overran its bound by exactly that margin.
const FALL_CASES = [
    () => passageCase('reading-response-undergraduate', 'en'),
    () => councilCase('stem-scientific-argument', 'en'),
];
const DEFAULT_CASES = [
    () => passageCase('college-personal-statement', 'en', true),
    () => fullDraftCase('graduate-sop', 'en'),
    () => councilCase('mixed-genre-autobiographical-essay', 'en'),
    () => councilCase('cap200-bronx-beautiful-service-learning', 'es'),
];
// REFLECT SCOPE — the bounded matrix for the 2026-08-08 refinement package.
// 5 declared calls against a ceiling of 6; the sixth is reserved because the
// Gemini adapter retries retryable categories transparently.
//   1  EN, custom question inviting DIAGNOSIS and guiding questions
//   2  EN, custom question inviting PROPOSED LANGUAGE
//   3  ES, custom question
//   4  EN, pre-populated bounded request (writer typed nothing)
//   5  ES, pre-populated bounded request
const REFLECT_CASES = [
    () => coachCase('college-personal-statement', 'en',
        'What is the weakest sentence in this paragraph, and why is it weaker than the others?', 'diagnosis'),
    () => coachCase('college-personal-statement', 'en',
        'Is "the real problem was trust" the right wording here, or should I say it another way?', 'language'),
    () => coachCase('research-paper', 'es',
        '¿Qué evidencia concreta le falta a este párrafo para que un lector pueda seguirlo?', 'custom-es'),
    () => coachCase('college-personal-statement', 'en', '', 'default-en'),
    () => coachCase('research-paper', 'es', '', 'default-es'),
];
// STRUCTURE SCOPE — the bounded matrix for the response information hierarchy
// package. 5 declared calls against a ceiling of 6; the sixth is reserved
// because the Gemini adapter retries retryable categories transparently.
//   1  EN, custom question inviting DIAGNOSIS and guiding questions
//   2  EN, pre-populated bounded request (the writer typed nothing)
//   3  ES, custom question — Spanish, second genre
//   4  ES, custom question — Spanish, third genre (service-learning)
//   5  EN, custom question — fourth genre (graduate SOP)
// Four distinct genres, all on the standard coaching path.
const STRUCTURE_CASES = [
    () => coachCase('college-personal-statement', 'en',
        'What is the weakest sentence in this paragraph, and why is it weaker than the others?', 'diagnosis-en'),
    () => coachCase('college-personal-statement', 'en', '', 'default-en'),
    () => coachCase('research-paper', 'es',
        '¿Qué evidencia concreta le falta a este párrafo para que un lector pueda seguirlo?', 'custom-es'),
    () => coachCase('cap200-bronx-beautiful-service-learning', 'es',
        '¿Cómo conecto mejor lo que observé con el concepto del curso?', 'service-learning-es'),
    () => coachCase('graduate-sop', 'en',
        'Does this paragraph make my research question clear enough for an admissions committee?', 'sop-en'),
];
const cases = SCOPE === 'fall' ? FALL_CASES : SCOPE === 'reflect' ? REFLECT_CASES : SCOPE === 'structure' ? STRUCTURE_CASES : DEFAULT_CASES;
try {
    for (const run of cases) {
        try { await run(); } catch (caseError) {
            if (String(caseError).includes('call ceiling')) throw caseError;
            results.push({ case: 'case-error', error: String(caseError).slice(0, 160) });
        }
    }

    // Zero-call verifications. The reflect scope is deliberately narrow: these
    // check surfaces this package did not touch, and they were already
    // validated in the fall pass.
    if (SCOPE === 'reflect' || SCOPE === 'structure') throw new Error(`${SCOPE} scope complete`);
    await fresh('totally-unknown-live-check');
    const unknownStops = await page.evaluate(() => document.body.textContent.includes('not configured') || document.body.textContent.includes('no está configurado'));
    results.push({ case: 'unknown-assignment', kind: 'none', outcome: unknownStops ? 'stops-no-ai' : 'FAIL' });
    await fresh('reading-response-undergraduate');
    await page.locator('#draftEditor').fill(DRAFTS.readingUg);
    const readingBlocked = (await page.locator('.integrated-support').textContent()).includes('not available for reading responses');
    results.push({ case: 'reading-council-unavailable', kind: 'none', outcome: readingBlocked ? 'stated-unavailable-no-call' : 'FAIL' });
    await fresh('stem');
    const ambiguousStops = await page.evaluate(() => /CONFIGURATION REQUIRED/i.test(document.body.textContent));
    results.push({ case: 'ambiguous-stem-link', kind: 'none', outcome: ambiguousStops ? 'fails-closed-no-call' : 'FAIL' });
} catch (error) {
    console.log('STOPPED:', String(error));
}

console.log('\n===== LIVE CHECK SUMMARY =====');
console.log(JSON.stringify(results, null, 1));
console.log(`Provider calls used (from records): ${callsUsed} / ceiling ${CALL_CEILING}`);
await browser.close();
