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
        localStorage.setItem('tupana_draft_saved', 'true'); // allow advancing
        localStorage.setItem('tupana_stage', String(s));
        for (const [k, v] of Object.entries(e)) localStorage.setItem(k, v);
    }, { s: stage, e: extra });
    await page.reload();
    await page.waitForLoadState('networkidle');
}

// Inject a fake bot message and wait for the reflect-btn-wrap to appear or not
async function injectBotMsg(page) {
    await page.evaluate(() => {
        // Call addMsg directly via global
        if (typeof addMsg === 'function') {
            addMsg('Coach test message.', 'bot');
        }
    });
    await page.waitForTimeout(600); // let setTimeout(renderReflectButton, 400) fire
}

const browser = await chromium.launch();

// ── Stage 4: Reflect button still appears (no gate) ──
console.log('\n── Stage 4: Reflect button appears on every bot message ──');
{
    const page = await browser.newPage();
    await openAtStage(page, 4);
    await injectBotMsg(page);
    check('Reflect button present at Stage 4 (normal msg)', await page.locator('.reflect-btn-wrap').count() >= 1);
    await injectBotMsg(page);
    check('Reflect button present on 2nd Stage 4 msg', await page.locator('.reflect-btn-wrap').count() >= 2);
    await page.close();
}

// ── Stage 5/6/9: no checkpoint, no button ──
console.log('\n── Stages 5, 6, 9: no Reflect button (no checkpoint defined) ──');
for (const stage of [5, 6, 9]) {
    const page = await browser.newPage();
    const extra = stage === 6 ? {} : {};
    await openAtStage(page, stage, extra);
    await injectBotMsg(page);
    check(`No Reflect button at Stage ${stage}`, await page.locator('.reflect-btn-wrap').count() === 0);
    await page.close();
}

// ── Stage 7: no button on ordinary message ──
console.log('\n── Stage 7: no Reflect button on ordinary bot message ──');
{
    const page = await browser.newPage();
    await openAtStage(page, 7);
    await injectBotMsg(page);
    check('No Reflect button at Stage 7 without milestone trigger', await page.locator('.reflect-btn-wrap').count() === 0);
    await page.close();
}

// ── Stage 7: button appears after _reflectStage = 7 is set ──
console.log('\n── Stage 7: Reflect button appears after milestone trigger ──');
{
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await openAtStage(page, 7);
    // Simulate the milestone: set state._reflectStage = 7
    await page.evaluate(() => { state._reflectStage = 7; });
    await injectBotMsg(page);
    check('Reflect button appears after Stage 7 milestone set', await page.locator('.reflect-btn-wrap').count() === 1);
    // _reflectStage should be consumed — second bot msg should NOT show another button
    await injectBotMsg(page);
    check('Second Stage 7 bot msg does NOT show Reflect (flag consumed)', await page.locator('.reflect-btn-wrap').count() === 1);
    check('No JS errors (Stage 7 milestone)', errors.length === 0);
    await page.close();
}

// ── Stage 8: no button on ordinary message ──
console.log('\n── Stage 8: no Reflect button on ordinary bot message ──');
{
    const page = await browser.newPage();
    await openAtStage(page, 8);
    await injectBotMsg(page);
    check('No Reflect button at Stage 8 without milestone trigger', await page.locator('.reflect-btn-wrap').count() === 0);
    await page.close();
}

// ── Stage 8: button appears after _reflectStage = 8 is set ──
console.log('\n── Stage 8: Reflect button appears after voice-polish milestone ──');
{
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await openAtStage(page, 8);
    await page.evaluate(() => { state._reflectStage = 8; });
    await injectBotMsg(page);
    check('Reflect button appears after Stage 8 milestone set', await page.locator('.reflect-btn-wrap').count() === 1);
    await injectBotMsg(page);
    check('Second Stage 8 msg does NOT show Reflect (flag consumed)', await page.locator('.reflect-btn-wrap').count() === 1);
    check('No JS errors (Stage 8 milestone)', errors.length === 0);
    await page.close();
}

// ── Stage 10: no Reflect button at all ──
console.log('\n── Stage 10: Reflect button suppressed (capstone flow) ──');
{
    const page = await browser.newPage();
    await openAtStage(page, 10);
    await injectBotMsg(page);
    // Even with _reflectStage = 10 set, should still be suppressed
    await page.evaluate(() => { state._reflectStage = 10; });
    await injectBotMsg(page);
    check('No Reflect button at Stage 10 (suppressed)', await page.locator('.reflect-btn-wrap').count() === 0);
    await page.close();
}

// ── Checkpoint click still opens modal at Stage 7 ──
console.log('\n── Reflect button at Stage 7 opens correct checkpoint modal ──');
{
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await openAtStage(page, 7);
    await page.evaluate(() => { state._reflectStage = 7; });
    await injectBotMsg(page);
    await page.locator('.reflect-btn').first().click();
    await page.waitForSelector('#reflectModal', { timeout: 3000 });
    check('Checkpoint modal opens at Stage 7', await page.locator('#reflectModal').isVisible());
    check('Modal shows Revision judgment skill', await page.locator('#reflectModal').textContent().then(t => t.includes('Revision judgment')));
    check('Modal has skip button', await page.locator('.eval-modal-close').isVisible());
    await page.keyboard.press('Escape');
    check('Modal closes on Escape', await page.locator('#reflectModal').count() === 0);
    check('No JS errors (Stage 7 checkpoint)', errors.length === 0);
    await page.close();
}

// ── Skills Gains and badges still work ──
console.log('\n── Skills Gains and badges unaffected ──');
{
    const cp4 = { q: 'Pause and Reflect (Stage 4)', choice: 'option_1', t: new Date().toISOString(), checkpoint: true, stage: 4, skill: 'Research verification' };
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await openAtStage(page, 4, { tupana_decisions: JSON.stringify([cp4]), tupana_skills_acquired: JSON.stringify(['research_with_authorship']) });
    const badges = await page.locator('.skill-badge').allTextContents();
    check('Voice Guardian badge still rendered', badges.join(' ').includes('Voice Guardian'));
    // Open toolkit
    const ctbBtn = page.locator('.ctb-toolkit-btn');
    if (await ctbBtn.isVisible()) await ctbBtn.click();
    else await page.locator('.mobile-toolkit-btn').click();
    await page.waitForSelector('#toolkitModal', { timeout: 3000 });
    check('Skills Gains chip still renders', await page.locator('.toolkit-skill-gain').count() >= 1);
    check('No JS errors (regression)', errors.length === 0);
    await page.close();
}

await browser.close();
const passed = results.filter(r => r.val).length;
const failed = results.filter(r => !r.val).length;
console.log(`\n── Results: ${passed} passed, ${failed} failed ──`);
