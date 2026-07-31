// tutorial_page_test.mjs — Start Here onboarding tutorial (all genre layers)
// Run with a local server on 127.0.0.1:3001.
//
// Covered:
//   - deep pass (admissions): auto-start, rule card first, full tap-through,
//     Stage 6 lock in the route map, myth counters, Reject validated as a
//     respected move, no prediction language, mandatory privacy beat, ground
//     rules, CTA + skip into the right layer, completion flag, replay reset
//   - every genre: loads by ?assignment=, shows its label chip, tap-through
//     reaches the finale, transcript carries its genre-specific integrity
//     marker, CTA + skip carry the genre's app query
//   - bare URL → default essay experience (CTA to bare index.html)
//   - remembered app layer (tupana_assignment_id) resolves when no param
//   - no page JS errors anywhere
import { chromium } from 'playwright';

const HOST = 'http://127.0.0.1:3001/start-here.html';
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

// Tap through the whole conversation; returns { taps, transcript, rejectSeen }.
async function tapThrough({ preferReject = false } = {}) {
    let taps = 0, rejectSeen = false;
    while (taps < 30) {
        if (await page.locator('#startBtn').count()) break;
        const buttons = page.locator('.choices button');
        try { await buttons.first().waitFor({ state: 'visible', timeout: 9000 }); } catch (e) { break; }
        const labels = await buttons.allTextContents();
        const rejectIdx = labels.findIndex(l => /Reject/.test(l));
        if (preferReject && rejectIdx >= 0 && !rejectSeen) {
            rejectSeen = true;
            await buttons.nth(rejectIdx).click();
        } else {
            await buttons.first().click();
        }
        taps += 1;
    }
    await page.waitForSelector('#startBtn', { timeout: 10000 });
    return { taps, transcript: await page.locator('#chat').textContent(), rejectSeen };
}

async function open(query, seed) {
    await page.goto(HOST + (query || ''));
    await page.evaluate((seed) => {
        localStorage.clear();
        if (seed) localStorage.setItem('tupana_assignment_id', seed);
    }, seed || null);
    await page.reload();
    await page.waitForSelector('.rule-card', { timeout: 8000 });
}

// ── Deep pass: admissions ──
console.log('Deep pass — college-personal-statement');
await open('?assignment=college-personal-statement');
check('conversation opens without interaction and names Tu Pana',
    /Tu Pana/.test(await page.locator('.msg').first().textContent()));
check('the authorship rule card is one of the first things shown',
    /You write every word/.test(await page.locator('.rule-card').first().textContent()));
check('genre chip names the admissions layer',
    /College Admissions/.test(await page.locator('#genreChip').textContent()));
check('skip link goes into the admissions layer',
    (await page.locator('#skipLink').getAttribute('href')).includes('assignment=college-personal-statement'));

const deep = await tapThrough({ preferReject: true });
check('full conversation is finishable by tapping (reasonable length)', deep.taps >= 5 && deep.taps < 30);
check('route map rendered with Stage 6 as the lock',
    await page.locator('.route-stage.gate').count() === 1 &&
    /First draft/.test(await page.locator('.route-stage.gate').textContent()));
check('myth check answered and countered in the replies',
    /Myth/.test(deep.transcript) && /locked until you’ve written your own first draft/.test(deep.transcript));
check('rejecting coach feedback is validated as a respected move',
    deep.rejectSeen && /power move/i.test(deep.transcript));
check('no admissions-chance prediction promised anywhere',
    /refuse to even guess/.test(deep.transcript));
check('privacy beat present on the mandatory path',
    /only when you explicitly ask/.test(deep.transcript));
check('five ground rules card appears before the finale',
    /The five rules/.test(deep.transcript));
check('finale start button links into the admissions layer',
    (await page.locator('#startBtn').getAttribute('href')).includes('assignment=college-personal-statement'));
check('completion flag stored', await page.evaluate(() =>
    localStorage.getItem('tupana_tutorial_done') === 'true'));
const beforeReplay = await page.locator('.msg').count();
await page.locator('#replayBtn').click();
await page.waitForSelector('.msg', { timeout: 8000 });
check('replay resets the conversation',
    (await page.locator('.msg').count()) < beforeReplay);

// ── Per-genre passes ──
const GENRE_CASES = [
    { id: 'graduate-sop', chip: /Statement of Purpose/, marker: /Specific beats impressive/ },
    { id: 'cap200-bronx-beautiful-service-learning', chip: /Service-Learning/, marker: /deficit framing/ },
    { id: 'research-paper', chip: /Research Paper/, marker: /fabricated citations|never invent or complete sources/i },
    { id: 'stem-lab-report', chip: /Lab Report/, marker: /Unexpected results aren’t failure|cardinal sin of science/ }
];
for (const g of GENRE_CASES) {
    console.log(`\nGenre pass — ${g.id}`);
    await open(`?assignment=${g.id}`);
    check(`${g.id}: genre chip labels the layer`, g.chip.test(await page.locator('#genreChip').textContent()));
    const run = await tapThrough();
    check(`${g.id}: tap-through reaches the finale`, run.taps >= 5 && run.taps < 30);
    check(`${g.id}: genre-specific integrity marker present`, g.marker.test(run.transcript));
    check(`${g.id}: CTA carries the genre query`,
        (await page.locator('#startBtn').getAttribute('href')).includes(`assignment=${g.id}`));
    check(`${g.id}: skip carries the genre query`,
        (await page.locator('#skipLink').getAttribute('href')).includes(`assignment=${g.id}`));
}

// ── Resolution boundaries ──
console.log('\nResolution boundaries');
await open('');
check('bare URL falls back to the default essay experience',
    /Tu ensayo|Your Essay/.test(await page.locator('#genreChip').textContent()));
check('bare URL CTA goes to the bare app (no assignment query)',
    (await page.locator('#skipLink').getAttribute('href')) === 'index.html');

await open('', 'graduate-sop');
check('remembered app layer (tupana_assignment_id) resolves without a param',
    /Statement of Purpose/.test(await page.locator('#genreChip').textContent()) &&
    (await page.locator('#skipLink').getAttribute('href')).includes('assignment=graduate-sop'));

await open('?assignment=not-a-real-layer');
check('unknown assignment id falls back to the default experience',
    /Tu ensayo|Your Essay/.test(await page.locator('#genreChip').textContent()));

check('no page JavaScript errors', errors.length === 0);
if (errors.length) console.log('    errors:', errors.join(' | '));

console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAILED` : ''}`);
await browser.close();
process.exit(failed ? 1 : 0);
