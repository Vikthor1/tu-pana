// audit_walk.mjs — UX Recovery Audit: rendered-product journey walker
// OBSERVATIONAL, not pass/fail. Walks every genre layer through the student
// journey against the audit worktree server (127.0.0.1:3002), capturing
// screenshots + a structured observation log per genre.
// Output: ../evidence/screens/<genre>/*.jpg + ../evidence/walk-<genre>.json
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HOST = 'http://127.0.0.1:3002/';
const PROXY = 'https://tupana-gemini-proxy.dr-torres-velez.workers.dev/';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const EVID = path.join(HERE, '..', 'evidence');
const SHOTS = path.join(EVID, 'screens');
fs.mkdirSync(SHOTS, { recursive: true });

const GENRES = [
    { id: '', slug: 'default', council: true },
    { id: 'college-personal-statement', slug: 'admissions', council: true },
    { id: 'graduate-sop', slug: 'sop', council: true },
    { id: 'cap-200-first-draft', slug: 'cap200-first-draft', council: false },
    { id: 'cap200-bronx-beautiful-service-learning', slug: 'cap200-service', council: true },
    { id: 'research-paper', slug: 'research', council: true },
    { id: 'stem-lab-report', slug: 'stem', council: false },
];

const NEUTRAL_TEXT =
    'This is my working text for this step. I am putting down my own ideas in my own words ' +
    'so I can see what I actually think before anyone else responds to it. The point I care ' +
    'about most is still rough, but writing it here helps me find where the real center is, ' +
    'and what I want a reader to carry away when they finish.';

function reviewerBody(role) {
    if (role === 'voice') return JSON.stringify({ role, noFindings: true, findings: [], preserve: [{ quote: 'what I actually think', why: 'Writer-owned phrasing.' }] });
    return JSON.stringify({
        role, noFindings: false,
        findings: [{ dimension: role === 'structure' ? 'through-line' : 'specificity', severity: 'priority', confidence: 'high',
            claim: 'The central point arrives late.', evidenceQuote: 'where the real center is',
            whyItMatters: 'Readers decide early.', revisionMove: 'Name the point in the first two sentences.', voiceNote: '' }],
        preserve: []
    });
}
const synthesisBody = JSON.stringify({
    summary: 'A clear working draft whose main point arrives late.',
    priorities: [{ sourceIds: ['structure-1', 'evidence-1'], dimension: 'through-line', claim: 'The point arrives late.',
        evidenceQuote: 'where the real center is', whyItMatters: 'Readers decide early.',
        revisionMove: 'Open with the point.', confidence: 'high', voiceNote: '' }],
    secondary: [], preserve: [{ sourceIds: ['voice-p1'], quote: 'what I actually think', why: 'Own voice.' }],
    disagreements: [{ question: 'Open with story or point?', positions: ['Point first', 'Story first'] }]
});

const browser = await chromium.launch({ headless: true });

async function makePage(viewport) {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.route(PROXY, async route => {
        const payload = JSON.parse(route.request().postData() || '{}');
        const role = /YOUR ROLE — Structure/.test(payload.prompt || '') ? 'structure'
            : /YOUR ROLE — Evidence/.test(payload.prompt || '') ? 'evidence'
                : /YOUR ROLE — Voice/.test(payload.prompt || '') ? 'voice' : null;
        const text = payload.requestKind === 'council_reviewer' ? reviewerBody(role)
            : payload.requestKind === 'council_synthesis' ? synthesisBody
                : 'CURRENT MOVEMENT\nThe draft moves from setup to point.\n\nTWO STRENGTHS\nOwn voice; concrete aim.\n\nPRIORITY REVISIONS\nName the point earlier.\n\nBEST NEXT ACTION\nRewrite the opening two sentences.';
        await route.fulfill({ status: 200, contentType: 'application/json',
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ text, truncated: false, usage: { inputTokens: 100, outputTokens: 50, thoughtTokens: 0, cachedTokens: 0, totalTokens: 150 } }) });
    });
    return { ctx, page, errors };
}

function wc(s) { return (s || '').trim().split(/\s+/).filter(Boolean).length; }

async function safeText(page, sel) {
    try { const l = page.locator(sel); if (await l.count() === 0) return null; return (await l.first().innerText()).trim(); }
    catch { return null; }
}
// True rendered visibility: the app hides overlays with opacity:0 while keeping
// display:flex, which fools Playwright's isVisible() — check computed style.
async function vis(page, sel) {
    try {
        return await page.evaluate((s) => {
            const el = document.querySelector(s);
            if (!el) return false;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
        }, sel);
    } catch { return false; }
}

// Reflection checkpoints (#reflectModal) and similar eval dialogs interpose on
// stage transitions; answer them and record the interposition as evidence.
async function clearInterposers(page, note, snap, ctxLabel) {
    for (let i = 0; i < 4; i++) {
        if (!(await vis(page, '#reflectModal'))) break;
        note('interposed-dialog', { at: ctxLabel, label: await page.locator('#reflectModal').getAttribute('aria-label').catch(() => null),
            shot: await snap(`interposed-${ctxLabel}-${i + 1}`) });
        const opt = page.locator('#reflectModal .reflect-option-btn:visible').first();
        if (await opt.count()) await opt.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(300);
        const go = page.locator('#reflectModal button:visible').filter({ hasText: /Continuar|Continue|Seguir|Listo|Guardar|Save|Cerrar|Close/i }).last();
        if (await go.count()) await go.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(400);
    }
}

async function run() {
    for (const g of GENRES) {
        const obs = { genre: g.id || '(default)', slug: g.slug, viewport: 'desktop-1280x900', steps: [], errors: [] };
        const dir = path.join(SHOTS, g.slug);
        fs.mkdirSync(dir, { recursive: true });
        const { ctx, page, errors } = await makePage({ width: 1280, height: 900 });
        let shotN = 0;
        const snap = async (name, fullPage = false) => {
            shotN += 1;
            const f = path.join(dir, `${String(shotN).padStart(2, '0')}-${name}.jpg`);
            try { await page.screenshot({ path: f, type: 'jpeg', quality: 55, fullPage }); } catch {}
            return path.relative(EVID, f);
        };
        const note = (step, data) => obs.steps.push({ step, ...data });

        const overlayState = () => page.evaluate(() => {
            const out = {};
            for (const id of ['projectSelector', 'labBg', 'maniBg', 'setupBanner', 'stagePreviewBg', 'modalBg', 'reportBg']) {
                const el = document.getElementById(id);
                if (!el) { out[id] = null; continue; }
                const cs = getComputedStyle(el);
                out[id] = { display: cs.display, visibility: cs.visibility, opacity: cs.opacity, zIndex: cs.zIndex,
                    pointerEvents: cs.pointerEvents, cls: el.className,
                    shown: cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 };
            }
            const pt = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
            out.topElementAtCenter = pt ? (pt.id || pt.className || pt.tagName) : null;
            return out;
        }).catch(() => ({}));

        try {
            // ── J1: true first entry (no seeds) ──────────────────────────
            await page.goto(HOST + (g.id ? `?assignment=${g.id}` : ''));
            await page.waitForTimeout(1200);
            note('first-entry', {
                overlays: await overlayState(),
                labSkipVisible: await vis(page, '#labSkip'),
                bodyWords: wc(await safeText(page, 'body')),
                headerSub: await safeText(page, '#headerSub'),
                shot: await snap('first-entry', true),
            });
            // try to move through whatever onboarding is in the way (up to 3 overlays, 18 clicks)
            let clicks = 0;
            while (clicks < 18) {
                clicks += 1;
                try {
                    if (await vis(page, '#projectSelector')) {
                        const target = g.id ? `#projectSelector .project-option[data-assign="${g.id}"]` : '#projectSelector .project-option[data-assign="__default__"]';
                        const opt = page.locator(await page.locator(target).count() ? target : '#projectSelector .project-option');
                        note('onboarding', { action: 'projectSelector', optionsShown: await page.locator('#projectSelector .project-option').count(),
                            deepLinkStillShowsSelector: Boolean(g.id), shot: await snap('project-selector', true) });
                        await opt.first().click({ timeout: 5000 });
                        await page.waitForTimeout(700); continue;
                    }
                    if (await vis(page, '#labSkip')) {
                        try { await page.locator('#labSkip').click({ timeout: 4000 }); }
                        catch (e) { note('onboarding-blocked', { control: '#labSkip', interceptedBy: String(e).match(/<[^>]+>|intercepts pointer events/g)?.slice(0, 2), overlays: await overlayState() });
                            await page.evaluate(() => closeLab()).catch(() => {}); }
                        await page.waitForTimeout(500); note('onboarding', { action: 'labSkip', shot: await snap('after-lab-skip') }); continue;
                    }
                    if (await vis(page, '#labNextBtn')) { await page.locator('#labNextBtn').click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(350); continue; }
                    if (await vis(page, '#maniBg')) {
                        if (await vis(page, '#maniPromptInput')) await page.locator('#maniPromptInput').fill('Escribo con mi propia voz y mis propias palabras.').catch(() => {});
                        if (await vis(page, '#maniProceedBtn')) { await page.locator('#maniProceedBtn').click({ timeout: 4000 }).catch(() => {}); await page.waitForTimeout(500); note('onboarding', { action: 'maniProceed', shot: await snap('after-mani') }); continue; }
                    }
                } catch (e) { note('onboarding-blocked', { error: String(e).slice(0, 200), overlays: await overlayState() }); break; }
                break;
            }
            note('post-onboarding', { onboardingClicks: clicks, overlays: await overlayState(), shot: await snap('post-onboarding', true) });

            // ── J2: seeded stage-by-stage walk 1→10 ─────────────────────
            await page.evaluate(() => { localStorage.clear(); sessionStorage.clear();
                for (const k of ['tupana_lab_done', 'tupana_onboarding_complete', 'tupana_mani_done', 'tupana_ai_cue_seen']) localStorage.setItem(k, 'true');
                localStorage.setItem('tupana_coach_mode', 'gemini'); localStorage.setItem('tupana_stage', '1'); });
            await page.reload(); await page.waitForTimeout(600);

            for (let s = 1; s <= 10; s++) {
                const stageObs = {
                    stage: s,
                    taskBar: await safeText(page, '#currentTaskBar'),
                    continueBtn: await safeText(page, '#continueBtn'),
                    backBtnVisible: await vis(page, '#backBtn'),
                    backBtn: await safeText(page, '#backBtn'),
                    saveBtn: await safeText(page, '#saveBtnLabel'),
                    autosave: await safeText(page, '#autosaveStatus'),
                    fiveQ: await vis(page, '#fiveQStrip'),
                    reviewBtnVisible: await vis(page, '#fullDraftReviewBtn'),
                    reviewBtn: await safeText(page, '#fullDraftReviewBtn'),
                    priorWorkStrip: await safeText(page, '#priorWorkStrip'),
                    importCard: await safeText(page, '#transitionImportCard'),
                    editorPlaceholder: await page.locator('#draftArea').getAttribute('placeholder').catch(() => null),
                    editorValueWords: wc(await page.locator('#draftArea').inputValue().catch(() => '')),
                    editorDisabled: await page.locator('#draftArea').isDisabled().catch(() => null),
                    visibleWords: wc(await safeText(page, 'body')),
                    chatVisibleWords: wc(await safeText(page, '#chatMessages')),
                };
                stageObs.shot = await snap(`stage-${String(s).padStart(2, '0')}`);
                note('stage', stageObs);

                // type work at every stage where the editor is usable
                if (!stageObs.editorDisabled && await vis(page, '#draftArea')) {
                    await page.locator('#draftArea').fill(NEUTRAL_TEXT + ` (stage ${s})`);
                    await page.waitForTimeout(300);
                    if (await vis(page, '#saveBtn')) { await page.locator('#saveBtn').click(); await page.waitForTimeout(500); }
                    note('save', { stage: s, savedNotice: await safeText(page, '#savedNotice'), autosave: await safeText(page, '#autosaveStatus') });
                }
                if (s === 3) { // persistence probe
                    await page.reload(); await page.waitForTimeout(600);
                    note('refresh-probe', { stage: s, editorWordsAfterReload: wc(await page.locator('#draftArea').inputValue().catch(() => '')),
                        priorWorkStrip: await safeText(page, '#priorWorkStrip'), shot: await snap('refresh-return') });
                }
                if (s === 10) break;
                // advance
                if (await vis(page, '#continueBtn')) {
                    try { await page.locator('#continueBtn').click({ timeout: 8000 }); }
                    catch { note('click-blocked', { control: 'continueBtn', stage: s, overlays: await overlayState(), shot: await snap(`blocked-continue-s${s}`) });
                        await page.evaluate(n => goToStage(n), s + 1).catch(() => {}); }
                    await page.waitForTimeout(600);
                    if (await vis(page, '#stagePreviewBg')) {
                        note('stage-preview', { toStage: s + 1, title: await safeText(page, '#previewTitle'),
                            cta: await safeText(page, '#previewCtaLabel'), completed: await safeText(page, '#previewCompletedText'),
                            descWords: wc(await safeText(page, '#previewDesc')), modalWords: wc(await safeText(page, '#stagePreviewBg')),
                            shot: s <= 2 ? await snap(`preview-to-${s + 1}`) : undefined });
                        if (await vis(page, '#previewContinueBtn')) {
                            try { await page.locator('#previewContinueBtn').click({ timeout: 6000 }); }
                            catch { await clearInterposers(page, note, snap, `preview-to-${s + 1}`);
                                await page.locator('#previewContinueBtn').click({ timeout: 6000 }).catch(() => {}); }
                            await page.waitForTimeout(700);
                        }
                    }
                    if (await vis(page, '#transitionImportCard')) {
                        note('import-offer', { atStage: s + 1, text: await safeText(page, '#transitionImportCard'), shot: await snap(`import-offer-s${s + 1}`) });
                        const yes = page.locator('#transitionImportCard .tic-btn-yes');
                        if (await yes.count()) { await yes.click(); await page.waitForTimeout(400); }
                    }
                    await clearInterposers(page, note, snap, `after-advance-${s + 1}`);
                    const st = await page.evaluate(() => { try { return state.stage; } catch { return null; } }).catch(() => null);
                    if (st !== s + 1) { note('nav-stall', { expected: s + 1, actual: st }); await page.evaluate(n => goToStage(n), s + 1).catch(() => {}); await page.waitForTimeout(500); }
                } else {
                    note('nav-stall', { expected: s + 1, reason: 'no continue button' });
                    await page.evaluate(n => goToStage(n), s + 1).catch(() => {});
                    await page.waitForTimeout(500);
                }
            }

            // ── J3: alternate-path blank-editor probe ────────────────────
            await page.evaluate(() => goToStage(2)).catch(() => {});
            await page.waitForTimeout(500);
            note('alt-path-back-to-2', { editorWords: wc(await page.locator('#draftArea').inputValue().catch(() => '')),
                priorWorkStrip: await safeText(page, '#priorWorkStrip'), importCard: await safeText(page, '#transitionImportCard'),
                shot: await snap('alt-path-stage2') });
            await page.evaluate(() => goToStage(5)).catch(() => {});
            await page.waitForTimeout(500);
            note('alt-path-fwd-to-5', { editorWords: wc(await page.locator('#draftArea').inputValue().catch(() => '')),
                priorWorkStrip: await safeText(page, '#priorWorkStrip'), importCard: await safeText(page, '#transitionImportCard'),
                shot: await snap('alt-path-stage5') });

            // ── J4: review chooser + lens review + Council ───────────────
            await page.evaluate(t => { localStorage.setItem('tupana_stage', '7'); localStorage.setItem('tupana_draft', t);
                localStorage.setItem('tupana_draft_saved', 'true'); localStorage.setItem('tupana_writing_s7', t); }, NEUTRAL_TEXT.repeat(2));
            await page.reload(); await page.waitForTimeout(600);
            if (await vis(page, '#fullDraftReviewBtn')) {
                await page.locator('#fullDraftReviewBtn').click(); await page.waitForTimeout(500);
                note('review-chooser', { modalWords: wc(await safeText(page, '#fullDraftReviewModal')),
                    lensCount: await page.locator('#fullDraftReviewModal input[name="fullReviewLens"]').count(),
                    councilOffer: await vis(page, '#councilOffer'),
                    disclosure: await safeText(page, '.council-disclosure'),
                    shot: await snap('review-chooser', true) });
                const lens = page.locator('input[name="fullReviewLens"]').first();
                if (await lens.count()) {
                    await lens.check();
                    if (await vis(page, '#fullReviewSubmit')) {
                        await page.locator('#fullReviewSubmit').click(); await page.waitForTimeout(1200);
                        note('lens-review-result', { chatTail: (await safeText(page, '#chatMessages') || '').slice(-600),
                            nextActions: await safeText(page, '#reviewNextActions'), shot: await snap('lens-review-result') });
                    }
                }
                // Council
                if (g.council) {
                    if (await vis(page, '#fullDraftReviewBtn')) { await page.locator('#fullDraftReviewBtn').click(); await page.waitForTimeout(400); }
                    if (await vis(page, '#councilLaunch')) {
                        await page.locator('#councilLaunch').click();
                        await page.waitForSelector('.council-section', { timeout: 20000 }).catch(() => {});
                        note('council-report', { visible: await vis(page, '.council-section'),
                            reportWords: wc(await safeText(page, '#fullDraftReviewModal')),
                            decisions: await page.locator('#fullDraftReviewModal button').allInnerTexts().catch(() => []),
                            shot: await snap('council-report', true) });
                        const close = page.locator('#fullReviewClose');
                        if (await close.count()) { await close.click(); await page.waitForTimeout(400); }
                        note('post-council-reentry', { reviewBtn: await safeText(page, '#fullDraftReviewBtn'),
                            nextActions: await safeText(page, '#reviewNextActions'), shot: await snap('post-council') });
                    } else note('council-report', { visible: false, reason: 'no #councilLaunch offer' });
                }
            } else note('review-chooser', { reason: 'review button not visible at stage 7' });

            // ── J5: “Mi trabajo” hub — early vs late ─────────────────────
            await page.evaluate(() => { localStorage.setItem('tupana_stage', '2'); });
            await page.reload(); await page.waitForTimeout(500);
            if (await vis(page, '#reportBtn')) {
                await page.locator('#reportBtn').click(); await page.waitForTimeout(500);
                note('work-hub-early', { reportBtn: await safeText(page, '#reportBtn'), title: await safeText(page, '#reportTitle'),
                    bodyWords: wc(await safeText(page, '#reportBody')), dangerVisible: await vis(page, '#dangerZone'),
                    headings: await page.locator('#reportBody h1, #reportBody h2, #reportBody h3, #reportBody summary').allInnerTexts().catch(() => []),
                    shot: await snap('work-hub-stage2', true) });
                const rc = page.locator('#reportBg [aria-label*="err"], #reportBg .modal-close, #reportBg button:has-text("Cerrar")').first();
                if (await rc.count()) await rc.click().catch(() => {});
                await page.keyboard.press('Escape').catch(() => {});
                await page.waitForTimeout(300);
            }
            await page.evaluate(() => { localStorage.setItem('tupana_stage', '9'); });
            await page.reload(); await page.waitForTimeout(500);
            if (await vis(page, '#reportBtn')) {
                await page.locator('#reportBtn').click(); await page.waitForTimeout(500);
                const prep = page.locator('#reportBody button, #reportBody a').filter({ hasText: /Preparar|entrega|submission/i }).first();
                note('work-hub-late', { bodyWords: wc(await safeText(page, '#reportBody')), prepControl: await prep.count() > 0,
                    dangerVisible: await vis(page, '#dangerZone'),
                    headings: await page.locator('#reportBody h1, #reportBody h2, #reportBody h3, #reportBody summary').allInnerTexts().catch(() => []),
                    shot: await snap('work-hub-stage9', true) });
                if (await prep.count()) {
                    await prep.click(); await page.waitForTimeout(600);
                    note('submit-mode', { bodyWords: wc(await safeText(page, '#reportBody')), dangerVisible: await vis(page, '#dangerZone'),
                        text: (await safeText(page, '#reportBody') || '').slice(0, 800), shot: await snap('submit-mode', true) });
                }
            }

            // ── J6: language switching ───────────────────────────────────
            await page.evaluate(() => { localStorage.setItem('tupana_stage', '2'); });
            await page.reload(); await page.waitForTimeout(500);
            const bothWords = wc(await safeText(page, 'body'));
            for (const [btn, tag] of [['#langBtnEn', 'en'], ['#langBtnEs', 'es'], ['#langBtnBoth', 'both']]) {
                if (await vis(page, btn)) {
                    await page.locator(btn).click(); await page.waitForTimeout(500);
                    note('language', { mode: tag, bodyWords: wc(await safeText(page, 'body')), bothBaseline: bothWords,
                        continueBtn: await safeText(page, '#continueBtn'), shot: await snap(`lang-${tag}`) });
                } else note('language', { mode: tag, available: false });
            }
        } catch (e) {
            obs.errors.push('WALK-ABORT: ' + String(e));
            try { await snap('abort-state', true); } catch {}
        }
        obs.errors.push(...errors);
        fs.writeFileSync(path.join(EVID, `walk-${g.slug}.json`), JSON.stringify(obs, null, 2));
        console.log(`✔ ${g.slug}: ${obs.steps.length} observations, ${obs.errors.length} page errors`);
        await ctx.close();
    }

    // ── Mobile pass: default + admissions ────────────────────────────────
    for (const g of GENRES.filter(x => ['default', 'admissions'].includes(x.slug))) {
        const obs = { genre: g.id || '(default)', slug: g.slug + '-mobile', viewport: 'mobile-390x844', steps: [], errors: [] };
        const dir = path.join(SHOTS, g.slug + '-mobile');
        fs.mkdirSync(dir, { recursive: true });
        const { ctx, page, errors } = await makePage({ width: 390, height: 844 });
        let shotN = 0;
        const snap = async (name, fullPage = false) => {
            shotN += 1; const f = path.join(dir, `${String(shotN).padStart(2, '0')}-${name}.jpg`);
            try { await page.screenshot({ path: f, type: 'jpeg', quality: 55, fullPage }); } catch {}
            return path.relative(EVID, f);
        };
        try {
            await page.goto(HOST + (g.id ? `?assignment=${g.id}` : ''));
            await page.evaluate(() => { localStorage.clear();
                for (const k of ['tupana_lab_done', 'tupana_onboarding_complete', 'tupana_mani_done', 'tupana_ai_cue_seen']) localStorage.setItem(k, 'true');
                localStorage.setItem('tupana_coach_mode', 'gemini'); localStorage.setItem('tupana_stage', '2'); });
            await page.reload(); await page.waitForTimeout(700);
            obs.steps.push({ step: 'mobile-stage2', mobileTabs: await vis(page, '#mobileTabs'), stageSelect: await vis(page, '#mobileStageSelect'),
                stageSelectOptions: await page.locator('#mobileStageSelect option').allInnerTexts().catch(() => []),
                bodyWords: wc(await safeText(page, 'body')), shot: await snap('stage2', true) });
            for (const [tab, name] of [['#tabChat', 'chat'], ['#tabDraft', 'draft']]) {
                if (await vis(page, tab)) { await page.locator(tab).click(); await page.waitForTimeout(400);
                    obs.steps.push({ step: 'mobile-tab-' + name, shot: await snap('tab-' + name) }); }
            }
            if (await vis(page, '#reportBtn')) { await page.locator('#reportBtn').click(); await page.waitForTimeout(500);
                obs.steps.push({ step: 'mobile-work-hub', bodyWords: wc(await safeText(page, '#reportBody')), shot: await snap('work-hub', true) }); }
        } catch (e) { obs.errors.push('WALK-ABORT: ' + String(e)); }
        obs.errors.push(...errors);
        fs.writeFileSync(path.join(EVID, `walk-${g.slug}-mobile.json`), JSON.stringify(obs, null, 2));
        console.log(`✔ ${g.slug}-mobile: ${obs.steps.length} observations, ${obs.errors.length} page errors`);
        await ctx.close();
    }

    // ── Tutorial (start-here) pass: admissions ───────────────────────────
    {
        const obs = { genre: 'college-personal-statement', slug: 'tutorial', steps: [], errors: [] };
        const dir = path.join(SHOTS, 'tutorial'); fs.mkdirSync(dir, { recursive: true });
        const { ctx, page, errors } = await makePage({ width: 390, height: 844 });
        let shotN = 0;
        const snap = async (name) => { shotN += 1; const f = path.join(dir, `${String(shotN).padStart(2, '0')}-${name}.jpg`);
            try { await page.screenshot({ path: f, type: 'jpeg', quality: 55, fullPage: true }); } catch {} return path.relative(EVID, f); };
        try {
            await page.goto(HOST + 'start-here.html?assignment=college-personal-statement');
            await page.waitForTimeout(1500);
            obs.steps.push({ step: 'tutorial-open', bodyWords: wc(await safeText(page, 'body')), shot: await snap('open') });
            for (let i = 0; i < 12; i++) {
                const choice = page.locator('button:visible').first();
                if (await choice.count() === 0) break;
                const label = await choice.innerText().catch(() => '');
                await choice.click().catch(() => {});
                await page.waitForTimeout(900);
                obs.steps.push({ step: `tutorial-choice-${i + 1}`, clicked: label.slice(0, 80), url: page.url(),
                    shot: i % 3 === 0 ? await snap(`choice-${i + 1}`) : undefined });
                if (!page.url().includes('start-here')) { obs.steps.push({ step: 'tutorial-exit', url: page.url(), shot: await snap('exit') }); break; }
            }
        } catch (e) { obs.errors.push('WALK-ABORT: ' + String(e)); }
        obs.errors.push(...errors);
        fs.writeFileSync(path.join(EVID, 'walk-tutorial.json'), JSON.stringify(obs, null, 2));
        console.log(`✔ tutorial: ${obs.steps.length} observations, ${obs.errors.length} page errors`);
        await ctx.close();
    }

    await browser.close();
}

await run();
console.log('DONE');
