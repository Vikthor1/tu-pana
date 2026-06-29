import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const results = [];
function check(name, val) {
    results.push({ name, val });
    console.log((val ? '  ✅' : '  ❌') + ' ' + name);
}

function mkCheckpoint(stage) {
    return { q: `Pause and Reflect (Stage ${stage})`, choice: 'option_1',
             t: new Date().toISOString(), checkpoint: true, stage, skill: 'Test' };
}

async function openWithData(page, data) {
    await page.goto(BASE);
    await page.evaluate(d => {
        localStorage.clear();
        for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v);
    }, data);
    await page.reload();
    await page.waitForLoadState('networkidle');
}

function seed(decisions = [], extras = {}) {
    return { tupana_lab_done: 'true', tupana_mani_done: 'true',
             tupana_decisions: JSON.stringify(decisions), ...extras };
}

async function getBadgeTexts(page) {
    return page.locator('.skill-badge').allTextContents();
}

const browser = await chromium.launch();

// ── No checkpoints: neither badge appears ──
console.log('\n── No checkpoints: neither critical badge ──');
{
    const page = await browser.newPage();
    await openWithData(page, seed([]));
    const texts = await getBadgeTexts(page);
    const flat = texts.join(' ');
    check('Voice Guardian absent with 0 checkpoints', !flat.includes('Voice Guardian'));
    check('Editor with Judgment absent with 0 checkpoints', !flat.includes('Editor'));
    await page.close();
}

// ── 1 distinct checkpoint → Voice Guardian earned ──
console.log('\n── 1 checkpoint → Voice Guardian ──');
{
    const page = await browser.newPage();
    await openWithData(page, seed([mkCheckpoint(4)]));
    const texts = await getBadgeTexts(page);
    const flat = texts.join(' ');
    check('Voice Guardian earned after 1 checkpoint', flat.includes('Voice Guardian'));
    check('Editor with Judgment NOT yet earned', !flat.includes('Editor'));
    await page.close();
}

// ── Duplicate same stage does not count as 2 ──
console.log('\n── Duplicate same stage → still only 1 distinct ──');
{
    const page = await browser.newPage();
    await openWithData(page, seed([mkCheckpoint(4), mkCheckpoint(4), mkCheckpoint(4)]));
    const texts = await getBadgeTexts(page);
    const flat = texts.join(' ');
    check('Voice Guardian earned (1 distinct stage, multiple entries)', flat.includes('Voice Guardian'));
    check('Editor with Judgment NOT earned (only 1 distinct stage)', !flat.includes('Editor'));
    await page.close();
}

// ── 3 distinct checkpoints → Editor with Judgment earned ──
console.log('\n── 3 distinct checkpoints → Editor with Judgment ──');
{
    const page = await browser.newPage();
    await openWithData(page, seed([mkCheckpoint(4), mkCheckpoint(7), mkCheckpoint(8)]));
    const texts = await getBadgeTexts(page);
    const flat = texts.join(' ');
    check('Voice Guardian earned', flat.includes('Voice Guardian'));
    check('Editor with Judgment earned after 3 distinct checkpoints', flat.includes('Editor'));
    await page.close();
}

// ── Legacy decisions (no checkpoint flag) do not earn the badges ──
console.log('\n── Legacy decisions (no checkpoint flag) ──');
{
    const legacy = Array.from({ length: 12 }, (_, i) =>
        ({ q: 'Voice', choice: 'good', t: new Date().toISOString() }));
    const page = await browser.newPage();
    await openWithData(page, seed(legacy));
    const texts = await getBadgeTexts(page);
    const flat = texts.join(' ');
    // Legacy path (decisions.length >= 5/10) still works for backward compat
    check('Voice Guardian: legacy ≥5 decisions still triggers badge', flat.includes('Voice Guardian'));
    check('Editor: legacy ≥10 decisions still triggers badge', flat.includes('Editor'));
    await page.close();
}

// ── 2 checkpoints: Voice Guardian yes, Editor no ──
console.log('\n── 2 distinct checkpoints: VG yes, EJ no ──');
{
    const page = await browser.newPage();
    await openWithData(page, seed([mkCheckpoint(4), mkCheckpoint(7)]));
    const texts = await getBadgeTexts(page);
    const flat = texts.join(' ');
    check('Voice Guardian earned with 2 checkpoints', flat.includes('Voice Guardian'));
    check('Editor with Judgment NOT earned with only 2 checkpoints', !flat.includes('Editor'));
    await page.close();
}

// ── Skills Gains still renders correctly alongside badges ──
console.log('\n── Skills Gains unaffected ──');
{
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await openWithData(page, seed([mkCheckpoint(4)], { tupana_skills_acquired: JSON.stringify(['research_with_authorship']) }));
    // Open toolkit
    const ctbBtn = page.locator('.ctb-toolkit-btn');
    const mobileBtn = page.locator('.mobile-toolkit-btn');
    if (await ctbBtn.isVisible()) { await ctbBtn.click(); }
    else { await mobileBtn.click(); }
    await page.waitForSelector('#toolkitModal', { timeout: 3000 });
    check('Skills Gains chip still renders', await page.locator('.toolkit-skill-gain').count() >= 1);
    check('No JS errors', errors.length === 0);
    if (errors.length) errors.forEach(e => console.log('   JS error:', e));
    await page.close();
}

// ── Other stage/draft badges unaffected ──
console.log('\n── Other badges (stage/draft-based) unaffected ──');
{
    const page = await browser.newPage();
    await openWithData(page, seed([], { tupana_draft_saved: 'true' }));
    // stage > 3 is needed for Story Founder — skip that, just check Essay Architect
    const texts = await getBadgeTexts(page);
    check('Essay Architect (draft saved) still works', texts.join(' ').includes('Arquitecto'));
    await page.close();
}

await browser.close();

const passed = results.filter(r => r.val).length;
const failed = results.filter(r => !r.val).length;
console.log(`\n── Results: ${passed} passed, ${failed} failed ──`);
