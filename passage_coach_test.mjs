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
// Contract change 2026-08-01 (Voice Vault repair): the menu also carries a
// local "Protect" action, hidden outside the revision stages (7–9). Coaching
// actions are still exactly five, and Protect is not visible here at Stage 1.
check('action bar separates What works from Strengthen',
    await page.locator('#passageCoachMenu [data-passage-action]:not([data-passage-action="protect"])').count() === 5 &&
    await page.locator('[data-passage-action="works"]').isVisible() &&
    await page.locator('[data-passage-action="strengthen"]').isVisible());
check('Protect is not offered outside the revision stages',
    !(await page.locator('[data-passage-action="protect"]').isVisible()));

await page.locator('[data-passage-action="clarity"]').click();
await page.waitForTimeout(500);
check('Clarity sends immediately without a second Send click', requests.length === 1);
check('request contains the exact selected passage',
    requests[0]?.prompt?.includes(clarityPassage));
check('request asks for one clarity issue and preserves authorship',
    requests[0]?.prompt?.includes('single most important clarity issue') &&
    requests[0]?.prompt?.includes('Do not rewrite'));
check('request requires full-passage reading before diagnosis',
    requests[0]?.prompt?.includes('Read the entire selected passage') &&
    requests[0]?.prompt?.includes('Never ask for information the selection already provides') &&
    requests[0]?.prompt?.includes('what rhetorical job the proposed change would serve'));
check('passage analysis uses full Flash outside the Revision stage',
    requests[0]?.model === 'gemini-2.5-flash' &&
    requests[0]?.requestKind === 'passage_analysis');
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
check('custom passage questions inherit the reading protocol and full Flash',
    requests[1]?.prompt?.includes('WHOLE-PASSAGE READING PROTOCOL') &&
    requests[1]?.model === 'gemini-2.5-flash' &&
    requests[1]?.requestKind === 'passage_analysis');
check('passage chip clears after sending',
    await page.locator('#passageContextChip').evaluate(el => el.hidden));

console.log('Directly pasted passage');
const directlyPastedPassage =
    'Information technologies shape many areas of contemporary life. ' +
    'My interest became more concrete while watching my mother use operations research to organize scarce family time. ' +
    'That experience taught me to see computing as a way of connecting mathematical reasoning with human needs. ' +
    'Can you help me make this passage stronger?';
await page.locator('#chatInput').fill(directlyPastedPassage);
await page.locator('#sendBtn').click();
await page.waitForTimeout(500);
check('a directly pasted multi-sentence passage uses full Flash',
    requests.length === 3 &&
    requests[2]?.model === 'gemini-2.5-flash' &&
    requests[2]?.requestKind === 'passage_analysis');
check('direct-paste review receives the global whole-passage rule',
    requests[2]?.prompt?.includes('WHOLE-PASSAGE REVIEW RULE') &&
    requests[2]?.prompt?.includes('never ask for information the student already supplied later') &&
    requests[2]?.prompt?.includes(directlyPastedPassage));

console.log('Cross-genre shared behavior');
const genreUrls = [
    ['Autobiographical mixed genre', 'http://127.0.0.1:3001/'],
    ['Service learning', 'http://127.0.0.1:3001/?assignment=cap200-bronx-beautiful-service-learning'],
    ['Research paper', 'http://127.0.0.1:3001/?assignment=research-paper'],
    ['STEM', 'http://127.0.0.1:3001/?assignment=stem-lab-report'],
    ['College admissions', 'http://127.0.0.1:3001/?assignment=college-personal-statement'],
    ['Graduate SOP', BASE]
];
for (const [genreName, genreUrl] of genreUrls) {
    const genreContext = await browser.newContext({ viewport: { width: 1100, height: 800 } });
    const genrePage = await genreContext.newPage();
    let genreRequest = null;
    await genrePage.route(PROXY, async route => {
        genreRequest = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ text: 'Genre-aware passage response.', truncated: false })
        });
    });
    await genrePage.goto(genreUrl);
    await genrePage.evaluate(() => {
        localStorage.setItem('tupana_lab_done', 'true');
        localStorage.setItem('tupana_onboarding_complete', 'true');
    });
    await genrePage.reload();
    await genrePage.waitForTimeout(350);
    await selectPassage(genrePage, clarityPassage);
    await genrePage.locator('[data-passage-action="strengthen"]').click();
    await genrePage.waitForTimeout(350);
    check(`${genreName}: Strengthen uses the shared whole-passage contract`,
        genreRequest?.prompt?.includes('WHOLE-PASSAGE READING PROTOCOL') &&
        genreRequest?.prompt?.includes('single highest-impact way') &&
        genreRequest?.model === 'gemini-2.5-flash' &&
        genreRequest?.requestKind === 'passage_analysis');
    await genreContext.close();
}

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
check('phone action bar keeps all five actions comfortably tappable',
    await phone.locator('#passageCoachMenu [data-passage-action]:not([data-passage-action="protect"])').count() === 5 &&
    await phone.locator('#passageCoachMenu [data-passage-action]:visible').evaluateAll(buttons =>
        buttons.every(button => button.getBoundingClientRect().height >= 44)
    ));
check('phone has no horizontal overflow',
    await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
await phone.close();

check('no page JavaScript errors', errors.length === 0);
if (errors.length) console.log('    errors:', errors);

console.log(`\n${passed}/${passed + failed} PASS`);
await browser.close();
process.exit(failed ? 1 : 0);
