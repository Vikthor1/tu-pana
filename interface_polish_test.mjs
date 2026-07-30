// interface_polish_test.mjs — shared accessibility and responsive-polish coverage.
// Requires a static server for this repository at http://127.0.0.1:3001.

import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3001';
const OVERLAYS = [
    'phaseToast', 'maniBg', 'labBg', 'confirmBg', 'modalBg',
    'stagePreviewBg', 'reportBg', 'pnModalBg', 'completionBg', 'capstoneBg'
];

let passed = 0;
let failed = 0;
function check(label, condition) {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
    if (ok) passed += 1;
    else failed += 1;
}

const browser = await chromium.launch({ headless: true });
const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
desktop.on('pageerror', error => errors.push(String(error)));

await desktop.goto(`${BASE}/?assignment=graduate-sop`);
await desktop.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('tupana_onboarding_complete', 'true');
    localStorage.setItem('tupana_project_chosen', 'true');
});
await desktop.reload();
await desktop.waitForTimeout(500);

console.log('\n── Closed overlays and dialog names ──');
const closedState = await desktop.evaluate(ids => ids.map(id => {
    const node = document.getElementById(id);
    return {
        id,
        exists: Boolean(node),
        hidden: node?.getAttribute('aria-hidden'),
        inert: node?.hasAttribute('inert'),
        open: node?.classList.contains('on')
    };
}), OVERLAYS);
check('every static overlay exists', closedState.every(row => row.exists));
check('every closed overlay is hidden from assistive technology',
    closedState.every(row => row.hidden === 'true' && row.inert && !row.open));

const dialogNames = await desktop.evaluate(() =>
    Array.from(document.querySelectorAll('[role="dialog"][aria-labelledby]')).map(dialog => {
        const id = dialog.getAttribute('aria-labelledby');
        return { dialog: dialog.id, label: id, hasLabel: Boolean(id && document.getElementById(id)?.textContent.trim()) };
    })
);
check('every static dialog has a resolvable visible name',
    dialogNames.length >= 8 && dialogNames.every(row => row.hasLabel));

console.log('\n── Stage 10 language polish ──');
await desktop.evaluate(() => {
    setLang('es');
    injectCapstonePanel();
});
await desktop.waitForTimeout(120);
check('Spanish mode shows only the Spanish writing-snapshot labels',
    await desktop.locator('#capstoneChatTrigger .show-es:visible').count() === 2 &&
    await desktop.locator('#capstoneChatTrigger .show-en:visible').count() === 0 &&
    await desktop.locator('#capstoneModalTitle .show-en:visible').count() === 0);
await desktop.evaluate(() => setLang('en'));
check('English mode shows only the English writing-snapshot labels',
    await desktop.locator('#capstoneChatTrigger .show-en:visible').count() === 2 &&
    await desktop.locator('#capstoneChatTrigger .show-es:visible').count() === 0 &&
    await desktop.locator('#capstoneModalTitle .show-es:visible').count() === 0);
await desktop.evaluate(() => {
    closeCapstoneModal({ suppressCompletion: true });
    setLang('es');
});

console.log('\n── Save / Export keyboard flow ──');
await desktop.locator('#reportBtn').focus();
await desktop.locator('#reportBtn').click();
await desktop.waitForTimeout(120);
check('Save / Export opens with correct accessible state',
    await desktop.locator('#reportBg.on[aria-hidden="false"]:not([inert])').count() === 1);
check('focus moves into Save / Export',
    await desktop.evaluate(() => document.activeElement?.classList.contains('report-close')));

const trapState = await desktop.evaluate(() => {
    const dialog = document.getElementById('reportBg');
    const focusable = getDialogFocusables(dialog);
    focusable.at(-1)?.focus();
    return { last: document.activeElement === focusable.at(-1), firstClass: focusable[0]?.className || '' };
});
await desktop.keyboard.press('Tab');
check('Tab wraps inside Save / Export',
    trapState.last && await desktop.evaluate(() => document.activeElement?.classList.contains('report-close')));
await desktop.keyboard.press('Escape');
await desktop.waitForTimeout(80);
check('Escape closes Save / Export accessibly',
    await desktop.locator('#reportBg[aria-hidden="true"][inert]:not(.on)').count() === 1);
check('closing Save / Export returns focus to its opener',
    await desktop.evaluate(() => document.activeElement?.id === 'reportBtn'));

console.log('\n── Optional guide keyboard controls ──');
await desktop.evaluate(() => openLab());
await desktop.waitForTimeout(120);
check('guide opens as a named dialog',
    await desktop.locator('#labBg.on[role="dialog"][aria-labelledby="labTitle"][aria-hidden="false"]').count() === 1);
check('guide skip controls are native buttons',
    await desktop.locator('#labBg .lab-skip').count() === 2 &&
    await desktop.locator('#labBg button.lab-skip').count() === 2);
check('all Five Questions choices are native buttons',
    await desktop.locator('#labBg .lab-choice').count() ===
    await desktop.locator('#labBg button.lab-choice').count());
check('guide moves focus to its top action',
    await desktop.evaluate(() => document.activeElement?.matches('.lab-top-skip .lab-skip')));

await desktop.evaluate(() => {
    labShowStep(2);
    labChoose(1, 'b');
});
check('answered choices cannot be activated twice by keyboard',
    await desktop.locator('#labQ1 .lab-choice:disabled').count() === 3);
await desktop.evaluate(() => closeLab());
await desktop.waitForTimeout(80);
check('guide closes with inert accessibility state',
    await desktop.locator('#labBg[aria-hidden="true"][inert]:not(.on)').count() === 1);
check('exiting early does not claim the optional guide was completed',
    await desktop.evaluate(() =>
        localStorage.getItem('tupana_onboarding_complete') === 'true' &&
        localStorage.getItem('tupana_lab_done') === null
    ));

console.log('\n── Phone tabs and shared genre layout ──');
const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
phone.on('pageerror', error => errors.push(String(error)));
await phone.goto(`${BASE}/?assignment=graduate-sop`);
await phone.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('tupana_onboarding_complete', 'true');
    localStorage.setItem('tupana_project_chosen', 'true');
});
await phone.reload();
await phone.waitForTimeout(450);

check('phone tabs identify their controlled panels',
    await phone.locator('#tabDraft[aria-controls="draftPanel"]').count() === 1 &&
    await phone.locator('#tabChat[aria-controls="chatPanel"]').count() === 1);
await phone.locator('#tabDraft').focus();
await phone.keyboard.press('ArrowRight');
check('right arrow selects and focuses Tu Pana',
    await phone.locator('#tabChat[aria-selected="true"][tabindex="0"]').count() === 1 &&
    await phone.evaluate(() => document.activeElement?.id === 'tabChat'));
await phone.keyboard.press('ArrowLeft');
check('left arrow selects and focuses Draft',
    await phone.locator('#tabDraft[aria-selected="true"][tabindex="0"]').count() === 1 &&
    await phone.evaluate(() => document.activeElement?.id === 'tabDraft'));
check('Statement of Purpose phone shell has no horizontal overflow',
    await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));

const reviewIds = await phone.evaluate(() =>
    typeof getReviewProfiles === 'function' ? getReviewProfiles().map(profile => profile.assignmentId) : []
);
const genreIds = ['', 'cap-200-first-draft', ...reviewIds];
let allGenresFit = true;
for (const assignment of genreIds) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on('pageerror', error => errors.push(`${assignment || 'generic'}: ${String(error)}`));
    const query = assignment ? `?assignment=${encodeURIComponent(assignment)}` : '?assignment=generic';
    await page.goto(`${BASE}/${query}`);
    await page.evaluate(() => {
        localStorage.setItem('tupana_onboarding_complete', 'true');
        localStorage.setItem('tupana_project_chosen', 'true');
    });
    await page.reload();
    await page.waitForTimeout(180);
    const fit = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth <= window.innerWidth,
        header: document.querySelector('.app-header')?.scrollWidth <= document.querySelector('.app-header')?.clientWidth + 1,
        task: document.getElementById('currentTaskBar')?.scrollWidth <= document.getElementById('currentTaskBar')?.clientWidth + 1
    }));
    allGenresFit &&= Boolean(fit.document && fit.header && fit.task);
    await page.close();
}
check(`all ${genreIds.length} writing pathways fit the phone viewport`, allGenresFit);
check('no page JavaScript errors', errors.length === 0);
if (errors.length) console.log('    errors:', errors);

await phone.close();
await desktop.close();
await browser.close();

console.log(`\n${passed}/${passed + failed} PASS`);
process.exit(failed ? 1 : 0);
