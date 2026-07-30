// passage_coach_test.mjs — contextual passage-coaching regression coverage
// Run with a local server on 127.0.0.1:3001.

import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3001/?assignment=graduate-sop';
const PROXY = 'https://tupana-gemini-proxy.dr-torres-velez.workers.dev/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
const requests = [];
page.on('pageerror', error => errors.push(String(error)));
await page.route(PROXY, async route => {
    requests.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ text: 'Focused coach response.', truncated: false })
    });
});

let passed = 0;
let failed = 0;
function check(label, condition) {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
    if (ok) passed += 1;
    else failed += 1;
}

async function selectPassage(targetPage, passage) {
    await targetPage.locator('#draftArea').fill(
        `My work in a community health clinic taught me to connect careful research with human needs. ${passage} I now want advanced training that joins evidence with public service.`
    );
    await targetPage.locator('#draftArea').evaluate((area, selected) => {
        const start = area.value.indexOf(selected);
        area.focus();
        area.setSelectionRange(start, start + selected.length);
        area.dispatchEvent(new Event('select', { bubbles: true }));
    }, passage);
}

await page.goto(BASE);
await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('tupana_lab_done', 'true');
});
await page.reload();
await page.waitForTimeout(700);

console.log('One-tap contextual action');
const clarityPassage = 'I learned that data is useful only when it changes how we listen.';
await selectPassage(page, clarityPassage);
check('selecting text opens the passage action bar',
    await page.locator('#passageCoachMenu').isVisible());
check('action bar offers Strength, Clarity, Voice, and Ask',
    await page.locator('#passageCoachMenu [data-passage-action]').count() === 4);

await page.locator('[data-passage-action="clarity"]').click();
await page.waitForTimeout(500);
check('Clarity sends immediately without a second Send click', requests.length === 1);
check('request contains the exact selected passage',
    requests[0]?.prompt?.includes(clarityPassage));
check('request asks for one clarity issue and preserves authorship',
    requests[0]?.prompt?.includes('single most important clarity issue') &&
    requests[0]?.prompt?.includes('Do not rewrite'));
const quickBubble = await page.locator('.msg.user .msg-bubble').last().textContent();
check('student sees a compact anchored action, not hidden instructions',
    /Claridad · Clarity/.test(quickBubble) &&
    quickBubble.includes('I learned that data') &&
    !quickBubble.includes('single most important clarity issue'));

console.log('Open-ended question with passage context');
const questionPassage = 'I now want advanced training that joins evidence with public service.';
await selectPassage(page, questionPassage);
await page.locator('[data-passage-action="ask"]').click();
check('Ask carries the passage into a removable context chip',
    await page.locator('#passageContextChip').isVisible() &&
    (await page.locator('#passageContextExcerpt').textContent()).includes('advanced training'));
check('Ask leaves the question field empty and focused',
    await page.locator('#chatInput').evaluate(el => el === document.activeElement && el.value === ''));

await page.locator('#chatInput').fill('What should I do to explain this connection more clearly?');
await page.locator('#sendBtn').click();
await page.waitForTimeout(500);
check('custom question sends with the selected passage', requests.length === 2 &&
    requests[1]?.prompt?.includes(questionPassage) &&
    requests[1]?.prompt?.includes('What should I do to explain this connection more clearly?'));
check('passage chip clears after sending',
    await page.locator('#passageContextChip').evaluate(el => el.hidden));

console.log('Phone fit');
const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
await phone.goto(BASE);
await phone.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('tupana_lab_done', 'true');
});
await phone.reload();
await phone.waitForTimeout(500);
await selectPassage(phone, clarityPassage);
const box = await phone.locator('#passageCoachMenu').boundingBox();
check('phone action bar stays inside the viewport',
    box && box.x >= 0 && box.x + box.width <= 390);
check('phone has no horizontal overflow',
    await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
await phone.close();

check('no page JavaScript errors', errors.length === 0);
if (errors.length) console.log('    errors:', errors);

console.log(`\n${passed}/${passed + failed} PASS`);
await browser.close();
process.exit(failed ? 1 : 0);
