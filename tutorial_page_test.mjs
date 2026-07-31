// tutorial_page_test.mjs — Start Here onboarding tutorial (admissions)
// Run with a local server on 127.0.0.1:3001.
//
// Covered:
//   - page loads with no JS errors; coach conversation starts on its own
//   - the authorship rule card renders before any interaction
//   - the student can tap through the entire script (asks + myth checks)
//   - the 10-stage route map renders with Stage 6 marked as the lock
//   - the accept/adapt/reject rehearsal validates every choice
//   - finale sets tupana_tutorial_done and links into the admissions layer
//   - skip link goes straight to the admissions layer
//   - replay resets the conversation
import { chromium } from 'playwright';

const URL = 'http://127.0.0.1:3001/start-here.html';
const APP_QUERY = 'assignment=college-personal-statement';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });  // phone-first
const errors = [];
page.on('pageerror', error => errors.push(String(error)));

let passed = 0, failed = 0;
function check(label, condition) {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
    if (ok) passed += 1; else failed += 1;
}

await page.goto(URL);
await page.evaluate(() => localStorage.removeItem('tupana_tutorial_done'));
await page.reload();
await page.waitForSelector('.msg', { timeout: 8000 });
await page.waitForSelector('.rule-card', { timeout: 8000 });

check('conversation opens without interaction and names Tu Pana',
    /Tu Pana/.test(await page.locator('.msg').first().textContent()));
check('the authorship rule card is one of the first things shown',
    /You write every word/.test(await page.locator('.rule-card').first().textContent()));
check('skip link goes straight into the admissions layer',
    (await page.locator('#skipLink').getAttribute('href')).includes(APP_QUERY));

// Tap through the full conversation, always choosing the first option,
// except the rehearsal where we choose Reject to verify it is respected.
let taps = 0;
let rejectSeen = false;
while (taps < 30) {
    const startVisible = await page.locator('#startBtn').count();
    if (startVisible) break;
    const buttons = page.locator('.choices button');
    try { await buttons.first().waitFor({ state: 'visible', timeout: 9000 }); } catch (e) { break; }
    const labels = await buttons.allTextContents();
    const rejectIdx = labels.findIndex(l => /Reject/.test(l));
    if (rejectIdx >= 0 && !rejectSeen) {
        rejectSeen = true;
        await buttons.nth(rejectIdx).click();
    } else {
        await buttons.first().click();
    }
    taps += 1;
}
await page.waitForSelector('#startBtn', { timeout: 10000 });
const transcript = await page.locator('#chat').textContent();

check('full conversation is finishable by tapping (reasonable length)', taps >= 5 && taps < 30);
check('route map rendered with Stage 6 as the lock',
    await page.locator('.route-stage.gate').count() === 1 &&
    /First draft/.test(await page.locator('.route-stage.gate').textContent()));
check('myth check answered and countered in the replies',
    /Myth/.test(transcript) && /locked until you’ve written your own first draft/.test(transcript));
check('rejecting coach feedback is validated as a respected move',
    rejectSeen && /power move/i.test(transcript));
check('no admissions-chance prediction promised anywhere',
    /refuse to even guess/.test(transcript));
check('privacy beat present: nothing sent unless explicitly asked',
    /only when you explicitly ask/.test(transcript));
check('five ground rules card appears before the finale',
    /The five rules/.test(transcript));
check('finale start button links into the admissions layer',
    (await page.locator('#startBtn').getAttribute('href')).includes(APP_QUERY));
check('completion flag stored', await page.evaluate(() =>
    localStorage.getItem('tupana_tutorial_done') === 'true'));

const beforeReplay = await page.locator('.msg').count();
await page.locator('#replayBtn').click();
await page.waitForSelector('.msg', { timeout: 8000 });
check('replay resets the conversation',
    (await page.locator('.msg').count()) < beforeReplay);

check('no page JavaScript errors', errors.length === 0);
if (errors.length) console.log('    errors:', errors.join(' | '));

console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAILED` : ''}`);
await browser.close();
process.exit(failed ? 1 : 0);
