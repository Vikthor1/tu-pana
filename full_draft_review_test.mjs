// full_draft_review_test.mjs — guided whole-draft review regression coverage
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
        body: JSON.stringify({
            text: 'CURRENT MOVEMENT\nA focused map.\n\nTWO STRENGTHS\nTwo anchored strengths.\n\nPRIORITY REVISIONS\nOne priority.\n\nBEST NEXT ACTION\nRevise the transition.',
            truncated: false,
            usage: {
                inputTokens: 2100,
                outputTokens: 180,
                thoughtTokens: 0,
                cachedTokens: 120,
                totalTokens: 2280
            }
        })
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

const draft =
    'My interest in computing began in a family where mathematics shaped everyday decisions. ' +
    'My mother used operations research to organize scarce family time while working full time, and I learned that an algorithm could carry a deeply human purpose. ' +
    'Later, in a community technology project, I saw how careful systems design could either expand access or reproduce an existing barrier. ' +
    'Those experiences now guide my goal of studying human-centered computing at the graduate level. ' +
    'I want to investigate how public institutions can build technical systems that are rigorous, accountable, and responsive to the people who depend on them. ' +
    'Graduate study will help me connect my technical preparation with research that serves communities.';

async function prepareStage(targetPage, text = draft, stage = 7) {
    await targetPage.goto(BASE);
    await targetPage.evaluate(({ text, stage }) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('tupana_lab_done', 'true');
        localStorage.setItem('tupana_onboarding_complete', 'true');
        localStorage.setItem('tupana_draft_saved', 'true');
        localStorage.setItem('tupana_draft', text);
        localStorage.setItem(`tupana_writing_s${stage}`, text);
        localStorage.setItem('tupana_stage', String(stage));
        localStorage.setItem('tupana_coach_mode', 'gemini');
    }, { text, stage });
    await targetPage.reload();
    await targetPage.waitForTimeout(450);
}

console.log('Stage placement and first review');
await prepareStage(page);
check('full-draft review is available at Stage 7',
    await page.locator('#fullDraftReviewBtn').isVisible() &&
    await page.locator('#fullDraftReviewBtn').isEnabled());

await page.locator('#fullDraftReviewBtn').click();
check('review opens with five explicit lenses',
    await page.locator('#fullDraftReviewModal input[name="fullReviewLens"]').count() === 5);
check('first review has no arbitrary quota language',
    !/remaining|left|quota|límite|restante/i.test(await page.locator('#fullDraftReviewModal').textContent()));
check('comfortable-length guidance keeps the review available',
    await page.locator('.full-review-length--comfortable').isVisible() &&
    await page.locator('#fullReviewSubmit').isDisabled());
check('student sees an explicit whole-draft transmission disclosure before sending',
    await page.locator('.full-review-privacy').isVisible() &&
    /se enviarán al Coach IA|will be sent to the Live AI coach/i.test(
        await page.locator('.full-review-privacy').textContent()
    ));
const fullReviewTrap = await page.evaluate(() => {
    const modal = document.getElementById('fullDraftReviewModal');
    const focusable = getDialogFocusables(modal);
    focusable.at(-1)?.focus();
    return document.activeElement === focusable.at(-1);
});
await page.keyboard.press('Tab');
check('whole-draft dialog traps keyboard focus',
    fullReviewTrap && await page.evaluate(() => document.activeElement?.id === 'fullReviewClose'));

await page.locator('input[name="fullReviewLens"][value="structure"]').check();
check('choosing a lens enables the first review',
    await page.locator('#fullReviewSubmit').isEnabled());
await page.locator('#fullReviewSubmit').click();
await page.waitForTimeout(500);

check('whole-draft review sends through full Gemini Flash',
    requests[0]?.model === 'gemini-2.5-flash' &&
    requests[0]?.requestKind === 'full_draft_review');
check('request contains the complete draft and full-reading contract',
    requests[0]?.prompt?.includes(draft) &&
    requests[0]?.prompt?.includes('READ ALL OF IT BEFORE RESPONDING') &&
    requests[0]?.prompt?.includes('Later paragraphs may develop, qualify, or answer') &&
    requests[0]?.prompt?.includes('at most three high-impact priorities'));
check('prompt preserves authorship and genre fit',
    requests[0]?.prompt?.includes('Do not rewrite') &&
    requests[0]?.prompt?.includes('Graduate Statement of Purpose') &&
    requests[0]?.prompt?.includes('Do not import expectations from another genre'));
const firstBubble = await page.locator('.msg.user .msg-bubble').last().textContent();
check('student sees a compact request summary, not the full hidden prompt',
    firstBubble.includes('Full-draft review') &&
    firstBubble.includes('Structure & trajectory') &&
    !firstBubble.includes('MANDATORY WHOLE-DRAFT REVIEW CONTRACT'));

const storedAfterFirst = await page.evaluate(() => ({
    reviews: localStorage.getItem('tupana_full_draft_reviews') || '',
    usage: localStorage.getItem('tupana_ai_usage') || ''
}));
check('review history stores metadata but not the student draft',
    storedAfterFirst.reviews.includes('"lens":"structure"') &&
    storedAfterFirst.reviews.includes('"signature"') &&
    !storedAfterFirst.reviews.includes(draft));
check('privacy-safe usage accounting stores aggregate counts only',
    storedAfterFirst.usage.includes('"full_draft_review"') &&
    storedAfterFirst.usage.includes('"inputTokens":2100') &&
    !storedAfterFirst.usage.includes(draft));

console.log('Purposeful follow-up without a hard cap');
await page.locator('#fullDraftReviewBtn').click();
check('unchanged follow-up is recognized',
    /has not changed|no ha cambiado/i.test(await page.locator('#fullDraftReviewModal').textContent()));
check('follow-up asks what changed or what to inspect',
    await page.locator('#fullReviewPurpose').isVisible());
await page.locator('input[name="fullReviewLens"][value="voice"]').check();
await page.locator('#fullReviewPurpose').fill('Please inspect whether the personal and research threads now feel connected.');
check('same draft still needs an explicit different-lens choice',
    await page.locator('#fullReviewSubmit').isDisabled());
await page.locator('#fullReviewSameDraftOverride').check();
check('explicit purpose and override permit the review',
    await page.locator('#fullReviewSubmit').isEnabled());
await page.locator('#fullReviewSubmit').click();
await page.waitForTimeout(500);
check('second full review is allowed rather than blocked',
    requests.length === 2 && requests[1]?.requestKind === 'full_draft_review');

await page.locator('#fullDraftReviewBtn').click();
const thirdModalText = await page.locator('#fullDraftReviewModal').textContent();
check('after several reviews, focused passage work is recommended',
    /Passage review may be more useful|revisión de un pasaje puede ser más útil/i.test(thirdModalText));
check('the recommendation remains soft and review controls remain present',
    await page.locator('#fullReviewPassage').isVisible() &&
    await page.locator('#fullReviewSubmit').count() === 1);
await page.locator('#fullReviewClose').click();

console.log('Long drafts and stage placement');
const longDraft = Array.from({ length: 3105 }, (_, i) => `word${i}`).join(' ');
await page.locator('#draftArea').fill(longDraft);
await page.locator('#fullDraftReviewBtn').click();
const longText = await page.locator('#fullDraftReviewModal').textContent();
check('drafts above 3,000 words receive guidance rather than rejection',
    /Extended draft|Borrador extenso/i.test(longText) &&
    /You can review it in full|Puedes revisarlo completo/i.test(longText) &&
    await page.locator('#fullReviewSubmit').count() === 1);
await page.locator('#fullReviewClose').click();

await page.evaluate(() => {
    localStorage.setItem('tupana_writing_s8', localStorage.getItem('tupana_draft') || '');
    localStorage.setItem('tupana_stage', '8');
});
await page.reload();
await page.waitForTimeout(350);
// UX remediation F5 (founder brief 2026-07-31): review access is available
// across the whole Revise phase (7–9) so a student never has to navigate
// backward to rediscover it. Stage 8 now EXPOSES the whole-draft action.
check('full-draft action stays available at Stage 8 (F5 re-entry contract)',
    await page.locator('#fullDraftReviewBtn').isVisible());

await page.evaluate(() => {
    localStorage.setItem('tupana_writing_s9', localStorage.getItem('tupana_draft') || '');
    localStorage.setItem('tupana_stage', '9');
});
await page.reload();
await page.waitForTimeout(350);
check('full-draft review returns for the Stage 9 final audit',
    await page.locator('#fullDraftReviewBtn').isVisible());
await page.locator('#fullDraftReviewBtn').click();
check('Stage 9 gently recommends the final-audit lens without auto-selecting it',
    await page.locator('input[value="audit"][data-recommended="true"]').count() === 1 &&
    await page.locator('input[name="fullReviewLens"]:checked').count() === 0);
await page.locator('#fullReviewClose').click();

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
    const genreContext = await browser.newContext({ viewport: { width: 1050, height: 820 } });
    const genrePage = await genreContext.newPage();
    let genreRequest = null;
    await genrePage.route(PROXY, async route => {
        genreRequest = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ text: 'Genre-aware full-draft response.', truncated: false })
        });
    });
    await genrePage.goto(genreUrl);
    await genrePage.evaluate(text => {
        localStorage.clear();
        localStorage.setItem('tupana_lab_done', 'true');
        localStorage.setItem('tupana_onboarding_complete', 'true');
        localStorage.setItem('tupana_draft_saved', 'true');
        localStorage.setItem('tupana_draft', text);
        localStorage.setItem('tupana_writing_s7', text);
        localStorage.setItem('tupana_stage', '7');
        localStorage.setItem('tupana_coach_mode', 'gemini');
    }, draft);
    await genrePage.reload();
    await genrePage.waitForTimeout(300);
    await genrePage.locator('#fullDraftReviewBtn').click();
    await genrePage.locator('input[name="fullReviewLens"][value="fit"]').check();
    await genrePage.locator('#fullReviewSubmit').click();
    await genrePage.waitForTimeout(320);
    check(`${genreName}: shared review is available and genre-aware`,
        genreRequest?.requestKind === 'full_draft_review' &&
        genreRequest?.model === 'gemini-2.5-flash' &&
        genreRequest?.prompt?.includes('Assignment or genre:') &&
        genreRequest?.prompt?.includes('Do not import expectations from another genre'));
    await genreContext.close();
}

console.log('Phone fit');
const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
await prepareStage(phone);
await phone.locator('#fullDraftReviewBtn').click();
const modalBox = await phone.locator('.full-review-modal-card').boundingBox();
check('phone review sheet stays inside the viewport',
    modalBox && modalBox.x >= 0 && modalBox.x + modalBox.width <= 390);
check('phone lenses and actions are comfortably tappable',
    await phone.locator('.full-review-lens').evaluateAll(items =>
        items.every(item => item.getBoundingClientRect().height >= 44)) &&
    await phone.locator('.full-review-actions button').evaluateAll(items =>
        items.every(item => item.getBoundingClientRect().height >= 44)));
check('phone has no horizontal overflow',
    await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
await phone.close();

check('no page JavaScript errors', errors.length === 0);
if (errors.length) console.log('    errors:', errors);

console.log(`\n${passed}/${passed + failed} PASS`);
await browser.close();
process.exit(failed ? 1 : 0);
