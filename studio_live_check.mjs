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
const CALL_CEILING = 30;
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
    stem: 'The basil seedlings exposed to eight hours of light grew an average of 2.4 centimeters more than the seedlings exposed to four hours. This result supports the prediction that longer light exposure increases early stem growth under otherwise controlled conditions. The small sample size and one unusually tall seedling limit the strength of the conclusion. A second synthetic trial with more plants would test whether the pattern persists.',
};

let page = null;
async function fresh(assignment, lang = 'en') {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(15000);
    await page.goto(`${ORIGIN}/studio.html?provider=gemini${assignment ? `&assignment=${assignment}` : ''}`);
    await page.evaluate(key => localStorage.removeItem(key), KEY);
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
    const draft = DRAFTS[assignment.includes('cap') ? 'cap200' : assignment.includes('research') ? 'research' : assignment.includes('sop') ? 'sop' : assignment.includes('statement') ? 'admissions' : assignment.includes('stem') ? 'stem' : assignment.includes('autobiographical') ? 'autobiographical' : 'neutral'];
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
    const draft = DRAFTS[assignment.includes('research') ? 'research' : assignment.includes('sop') ? 'sop' : 'neutral'];
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
    guardCeiling(8); // 4 calls + retry headroom
    await fresh(assignment, lang);
    const draft = DRAFTS[assignment.includes('cap') ? 'cap200' : 'autobiographical'];
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

// Rerun subset after the model-parameter fix (first round used 15 calls incl.
// 2 diagnostic probes; passage + zero-call cases already validated).
const cases = [
    () => passageCase('college-personal-statement', 'en', true),
    () => fullDraftCase('graduate-sop', 'en'),
    () => councilCase('mixed-genre-autobiographical-essay', 'en'),
    () => councilCase('cap200-bronx-beautiful-service-learning', 'es'),
];
try {
    for (const run of cases) {
        try { await run(); } catch (caseError) {
            if (String(caseError).includes('call ceiling')) throw caseError;
            results.push({ case: 'case-error', error: String(caseError).slice(0, 160) });
        }
    }

    // Zero-call verifications
    await fresh('totally-unknown-live-check');
    const unknownStops = await page.evaluate(() => document.body.textContent.includes('not configured') || document.body.textContent.includes('no está configurado'));
    results.push({ case: 'unknown-assignment', kind: 'none', outcome: unknownStops ? 'stops-no-ai' : 'FAIL' });
    await fresh('stem-lab-report');
    await page.locator('#draftEditor').fill(DRAFTS.stem);
    const stemBlocked = (await page.locator('.integrated-support').textContent()).includes('Council is not configured');
    results.push({ case: 'stem-council-unavailable', kind: 'none', outcome: stemBlocked ? 'stated-unavailable-no-call' : 'FAIL' });
} catch (error) {
    console.log('STOPPED:', String(error));
}

console.log('\n===== LIVE CHECK SUMMARY =====');
console.log(JSON.stringify(results, null, 1));
console.log(`Provider calls used (from records): ${callsUsed} / ceiling ${CALL_CEILING}`);
await browser.close();
