import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const results = [];
function check(name, val) {
    results.push({ name, val });
    console.log((val ? '  ✅' : '  ❌') + ' ' + name);
}

async function openAtStage(page, stage, extra = {}) {
    await page.goto(BASE);
    await page.evaluate(({ s, e }) => {
        localStorage.clear();
        localStorage.setItem('tupana_lab_done', 'true');
        localStorage.setItem('tupana_mani_done', 'true');
        localStorage.setItem('tupana_draft_saved', 'true');
        localStorage.setItem('tupana_stage', String(s));
        for (const [k, v] of Object.entries(e)) localStorage.setItem(k, v);
    }, { s: stage, e: extra });
    await page.reload();
    await page.waitForLoadState('networkidle');
}

const browser = await chromium.launch();

// ── Stage 10: no post-message Reflect button ──
console.log('\n── Stage 10: Reflect button suppressed on coach messages ──');
{
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await openAtStage(page, 10);
    // Inject a fake bot message
    await page.evaluate(() => { if (typeof addMsg === 'function') addMsg('Coach message.', 'bot'); });
    await page.waitForTimeout(600);
    check('No Reflect button after coach msg at Stage 10', await page.locator('.reflect-btn-wrap').count() === 0);
    // Even with _reflectStage set, should not show
    await page.evaluate(() => { state._reflectStage = 10; });
    await page.evaluate(() => { if (typeof addMsg === 'function') addMsg('Second coach message.', 'bot'); });
    await page.waitForTimeout(600);
    check('No Reflect button even with _reflectStage=10', await page.locator('.reflect-btn-wrap').count() === 0);
    check('No JS errors (Stage 10 post-message suppression)', errors.length === 0);
    await page.close();
}

// ── Stage 10 capstone panel injects correctly ──
console.log('\n── Stage 10: capstone panel appears ──');
{
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await openAtStage(page, 10);
    await page.evaluate(() => { if (typeof injectCapstonePanel === 'function') injectCapstonePanel(); });
    await page.waitForTimeout(300);
    check('Capstone panel rendered', await page.locator('.capstone-panel').count() === 1);
    check('10A self-assessment label present', await page.locator('.capstone-card-label').first().textContent().then(t => t.includes('10A')));
    check('No JS errors (capstone panel)', errors.length === 0);
    await page.close();
}

// ── 10C panel has AI advice reflection field ──
console.log('\n── Stage 10: 10C panel has AI advice reflection field ──');
{
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await openAtStage(page, 10);
    // Simulate 10B completed so 10C button appears
    await page.evaluate(() => {
        const d = { completed: true, coachPerspective: { coachPerspective: [{ dimension: 'Voice', rating: 'Strong', observation: 'Good.', suggestion: '' }], limitations: 'Test.' }, studentResponse: {} };
        localStorage.setItem('tupana_capstone', JSON.stringify(d));
    });
    await page.evaluate(() => { if (typeof showCapstoneCard10C === 'function') showCapstoneCard10C(); });
    await page.waitForTimeout(300);
    check('10C panel rendered', await page.locator('.capstone-10c-panel').count() === 1);
    check('AI advice field present', await page.locator('#capstone10cAiAdvice').count() === 1);
    check('AI advice label mentions coach advice', await page.locator('label[for="capstone10cAiAdvice"]').textContent().then(t => t.includes('advice') || t.includes('consejo')));
    check('AI Reflection section divider present', await page.locator('.capstone-10c-panel .capstone-divider').count() >= 1);
    check('No JS errors (10C panel)', errors.length === 0);
    await page.close();
}

// ── submitCapstone10C saves checkpoint entry ──
console.log('\n── Stage 10: submitCapstone10C stores checkpoint:true, stage:10 ──');
{
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await openAtStage(page, 10);
    await page.evaluate(() => {
        const d = { completed: true, coachPerspective: { coachPerspective: [{ dimension: 'Voice', rating: 'Strong', observation: '', suggestion: '' }], limitations: '' }, studentResponse: { agree: 'yes', aiAdvice: 'I questioned the coach on voice.' } };
        localStorage.setItem('tupana_capstone', JSON.stringify(d));
    });
    await page.evaluate(() => { if (typeof submitCapstone10C === 'function') submitCapstone10C(); });
    await page.waitForTimeout(300);
    const decisions = await page.evaluate(() => JSON.parse(localStorage.getItem('tupana_decisions') || '[]'));
    const entry = decisions.find(d => d.checkpoint === true && d.stage === 10);
    check('tupana_decisions has checkpoint:true stage:10 entry', !!entry);
    check('Entry has correct skill', !!entry && entry.skill.includes('AI advice evaluation'));
    check('Entry preserves written response in choice', !!entry && entry.choice.includes('questioned'));
    check('Entry has written:true flag', !!entry && entry.written === true);
    check('No JS errors (submitCapstone10C)', errors.length === 0);
    await page.close();
}

// ── Duplicate protection: second submitCapstone10C does not double-save ──
console.log('\n── Stage 10: duplicate protection (submit called twice) ──');
{
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await openAtStage(page, 10);
    await page.evaluate(() => {
        const d = { completed: true, coachPerspective: { coachPerspective: [], limitations: '' }, studentResponse: { aiAdvice: 'My reflection.' } };
        localStorage.setItem('tupana_capstone', JSON.stringify(d));
    });
    await page.evaluate(() => { if (typeof submitCapstone10C === 'function') { submitCapstone10C(); submitCapstone10C(); } });
    await page.waitForTimeout(300);
    const decisions = await page.evaluate(() => JSON.parse(localStorage.getItem('tupana_decisions') || '[]'));
    const stage10Entries = decisions.filter(d => d.checkpoint === true && d.stage === 10);
    check('Only one Stage 10 checkpoint entry saved (no duplicates)', stage10Entries.length === 1);
    check('No JS errors (duplicate protection)', errors.length === 0);
    await page.close();
}

// ── Skills Gains shows the Stage 10 skill in the toolkit ──
// The toolkit skill-gains section reads tupana_skills_acquired via getAcquiredSkills()
// against STAGE_SKILL_DEFS (writing-process skills by stage) — NOT tupana_decisions.
// (The former decision-based "AI advice evaluation" chip was superseded by the
// STAGE_SKILL_DEFS model; the decision skill still lives in the process report /
// decision log, covered elsewhere.) Stage 10's skill is 'process_reflection_evidence'.
console.log('\n── Skills Gains shows Stage 10 process-reflection skill ──');
{
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await openAtStage(page, 10, { tupana_skills_acquired: JSON.stringify(['process_reflection_evidence']) });
    // Stage 10 auto-opens the capstone modal (ui.js: injectCapstonePanel @700ms →
    // openCapstoneModal → #capstoneBg.on), which overlays the toolkit button. Dismiss
    // it first, exactly as a student would, so the real click is not intercepted.
    await page.waitForTimeout(900);
    await page.evaluate(() => { if (typeof closeCapstoneModal === 'function') closeCapstoneModal(); });
    const ctbBtn = page.locator('.ctb-toolkit-btn');
    if (await ctbBtn.isVisible()) await ctbBtn.click();
    else await page.locator('.mobile-toolkit-btn').click();
    await page.waitForSelector('#toolkitModal', { timeout: 3000 });
    check('Skills Gains chip count >= 1', await page.locator('.toolkit-skill-gain').count() >= 1);
    const skillTexts = await page.locator('.toolkit-skill-gain').allTextContents();
    check('Stage 10 process-reflection skill name shown', skillTexts.join(' ').includes('writing process using evidence'));
    check('No JS errors (Skills Gains Stage 10)', errors.length === 0);
    await page.close();
}

// ── Badges count Stage 10 as distinct checkpoint ──
console.log('\n── Badges: Stage 10 counts as distinct checkpoint ──');
{
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const cp10 = { q: 'AI Use Reflection (Stage 10)', choice: 'completed', t: new Date().toISOString(), checkpoint: true, stage: 10, skill: 'AI advice evaluation / reflective decision-making', written: true };
    await openAtStage(page, 10, { tupana_decisions: JSON.stringify([cp10]) });
    const badges = await page.locator('.skill-badge').allTextContents();
    check('Voice Guardian badge earned (1 checkpoint)', badges.join(' ').includes('Voice Guardian'));
    check('No JS errors (badge count Stage 10)', errors.length === 0);
    await page.close();
}

// ── Stage 4/7/8 Reflect behavior unaffected ──
console.log('\n── Regression: Stage 4/7/8 Reflect behavior unchanged ──');
{
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await openAtStage(page, 4);
    await page.evaluate(() => { if (typeof addMsg === 'function') addMsg('Coach msg.', 'bot'); });
    await page.waitForTimeout(600);
    check('Stage 4: Reflect button still appears', await page.locator('.reflect-btn-wrap').count() >= 1);
    check('No JS errors (Stage 4 regression)', errors.length === 0);
    await page.close();
}
{
    const page = await browser.newPage();
    await openAtStage(page, 7);
    await page.evaluate(() => { state._reflectStage = 7; });
    await page.evaluate(() => { if (typeof addMsg === 'function') addMsg('Coach msg.', 'bot'); });
    await page.waitForTimeout(600);
    check('Stage 7: gated Reflect button still appears', await page.locator('.reflect-btn-wrap').count() === 1);
    await page.close();
}

// ── Mi Toolkit regression ──
console.log('\n── Mi Toolkit regression ──');
{
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await openAtStage(page, 10);
    // Dismiss the auto-opened Stage 10 capstone modal (see note above) before the
    // toolkit interaction so its overlay does not intercept the click.
    await page.waitForTimeout(900);
    await page.evaluate(() => { if (typeof closeCapstoneModal === 'function') closeCapstoneModal(); });
    const ctbBtn = page.locator('.ctb-toolkit-btn');
    if (await ctbBtn.isVisible()) await ctbBtn.click();
    else await page.locator('.mobile-toolkit-btn').click();
    await page.waitForSelector('#toolkitModal', { timeout: 3000 });
    check('Mi Toolkit opens at Stage 10', await page.locator('#toolkitModal').isVisible());
    check('No JS errors (Mi Toolkit regression)', errors.length === 0);
    await page.close();
}

await browser.close();
const passed = results.filter(r => r.val).length;
const failed = results.filter(r => !r.val).length;
console.log(`\n── Results: ${passed} passed, ${failed} failed ──`);
