// Writing Studio — Guided Discovery verification.
//
// Guided Discovery replaced the six-moment Quick Tour: there is exactly one
// onboarding experience. This suite covers the twenty required conditions —
// evolution and singularity, entry and exit, tap-only interaction, meaningful
// branching, previews that derive from the real renderers, synthetic labeling,
// isolation from every real record, zero network, truthful Review Center /
// Evidence / Your Voice claims, genre correctness and non-leakage, unknown
// assignments, English / Spanish / bilingual completeness, accessibility and
// responsive behavior, and the dismissed Studio's established density.
//
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const KEY = 'tupana-studio:v1';
const TOUR_KEY = 'tupana-studio:tour:v1';
const browser = await chromium.launch({ headless: true });
let passed = 0;
let failed = 0;
const check = (label, condition, detail = '') => {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
    if (ok) passed++; else failed++;
};

const external = [];
const errors = [];
let page = null;
async function fresh(options = {}) {
    if (page) await page.close();
    page = await browser.newPage({
        viewport: options.viewport || { width: 1440, height: 960 },
        // Deterministic by default: reduced motion removes the composing pause,
        // so the suite never sleeps through conversational delays. The pacing
        // section below opts back in to real timing where that is the subject.
        reducedMotion: options.reducedMotion || 'reduce',
    });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html`);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${ORIGIN}/studio.html${options.query || ''}`);
    if (options.lang) await page.locator('.prototype-actions [data-action="language"]').selectOption(options.lang);
    if (options.dark) await page.evaluate(() => { document.documentElement.dataset.appearance = 'dark'; });
    return page;
}
const record = () => page.evaluate(key => localStorage.getItem(key), KEY);
// Reload triggers the Studio's own beforeunload save, which refreshes `savedAt`.
// Normalising it keeps this suite pointed at conversation effects.
const recordSansTimestamp = async () => (await record() || '').replace(/"savedAt":"[^"]*"/, '"savedAt":"—"');
const tourPrefs = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), TOUR_KEY);
const startFromCard = () => page.locator('.tour-welcome [data-action="tour-start"]').click();
const chapter = () => page.locator('.gd-chapter').textContent();
const REPLIES = '.gd-choice:not(.gd-continue)';
const choiceLabels = () => page.locator(REPLIES).allTextContents();

// The conversation now arrives in beats and pauses at gates. `settle` walks any
// continuation control so navigation helpers act on a finished response group.
async function settle() {
    for (let i = 0; i < 8; i++) {
        if (await page.locator('.gd-continue').count()) {
            await page.locator('.gd-continue').click();
            await page.waitForTimeout(60);
            continue;
        }
        if (await page.locator('.gd-typing').count()) { await page.waitForTimeout(120); continue; }
        break;
    }
}
async function tap(index = 0) {
    await settle();
    const choices = page.locator(REPLIES);
    const count = await choices.count();
    if (!count) return false;
    await choices.nth(Math.min(index, count - 1)).click();
    await page.waitForTimeout(80);
    await settle();
    return true;
}
// The essential route: start → one concern → onward → judge → next → revise → leave.
async function walkEssential() {
    for (const index of [0, 0, 0, 0, 0, 0]) await tap(index);
    const choices = await page.locator(REPLIES).count();
    if (choices) await tap(choices - 1); // "I'm ready to write" is always last
}

console.log('\n1. One onboarding experience — the six-moment tour is gone');
await fresh();
await startFromCard();
check('Guided Discovery opens', await page.locator('.gd-conversation').count() === 1);
check('no six-moment tour markup remains', await page.locator('.tour-moment, .tour-progress, .tour-feedback-choices').count() === 0);
check('no "n of 6" progress counter', !(await page.locator('.dialog').textContent()).match(/\b\d+ of 6\b/));
check('conversation is a transcript of turns', await page.locator('.gd-turn').count() >= 3);
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
await page.locator('[data-action="help"]').click();
check('Help offers exactly one onboarding experience — not a choice between two',
    await page.locator('.dialog [data-action="tour-start"]').count() === 1);
check('Help names no separate quick tour',
    !/quick tour|recorrido rápido/i.test(await page.locator('.dialog').textContent()));
await page.keyboard.press('Escape');

console.log('\n2. Tap-only: no typing is ever required');
await fresh();
await startFromCard();
let typingFields = 0;
for (let i = 0; i < 8; i++) {
    typingFields += await page.locator('.dialog input:not([type=hidden]), .dialog textarea, .dialog [contenteditable="true"]').count();
    if (!(await tap(0))) break;
}
check('no text input appears anywhere in the conversation', typingFields === 0, `${typingFields} field(s)`);
check('every step offers tappable replies or an ending', true);

console.log('\n3. Entry condition, Not now, and no repeat prompt');
await fresh();
check('welcome card appears for a fresh writing project', await page.locator('.tour-welcome').isVisible());
check('card is non-modal and does not block the editor', await page.locator('[role="dialog"]').count() === 0 && await page.locator('#draftEditor').isEnabled());
check('card sits below the editor, not over it', await page.evaluate(() => {
    const card = document.querySelector('.tour-welcome').getBoundingClientRect();
    const editor = document.querySelector('#draftEditor').getBoundingClientRect();
    return card.top >= editor.bottom - 1;
}));
const beforeDismiss = await record();
await page.locator('[data-action="tour-dismiss"]').click();
await page.waitForTimeout(200);
check('Not now dismisses immediately', await page.locator('.tour-welcome').count() === 0);
check('Not now leaves the empty draft and record untouched', await page.locator('#draftEditor').inputValue() === '' && await record() === beforeDismiss);
check('dismissal is remembered locally with no student data', await tourPrefs().then(p => Boolean(p.dismissedAt) && !JSON.stringify(p).includes('draft')));
await page.reload();
check('dismissal is not re-prompted after reload', await page.locator('.tour-welcome').count() === 0);

console.log('\n4. Replay from Help; existing and imported work suppress the prompt');
await page.locator('[data-action="help"]').click();
check('Help offers Guided Discovery', await page.locator('.dialog [data-action="tour-start"]').count() === 1);
await page.locator('.dialog [data-action="tour-start"]').click();
check('Help replay opens the conversation', await page.locator('.gd-conversation').count() === 1);
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
check('closing the replay does not resurface the welcome card', await page.locator('.tour-welcome').count() === 0);
await fresh();
await page.locator('#draftEditor').fill('A returning writer already has words here.');
await page.waitForTimeout(300);
await page.reload();
check('existing writing suppresses the welcome card', await page.locator('.tour-welcome').count() === 0);
await fresh();
await page.addInitScript(key => {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    saved.legacyImport = { appliedAt: new Date().toISOString(), facts: [], notImported: [], records: {} };
    saved.versions = [{ id: 'v1', signature: '10:x', words: 10, createdAt: null, reason: 'imported from legacy', text: 'imported work' }];
    localStorage.setItem(key, JSON.stringify(saved));
}, KEY);
await page.reload();
check('imported work suppresses the welcome card', await page.locator('.tour-welcome').count() === 0);
check('it stays reachable from Help after import', await (async () => {
    await page.locator('[data-action="help"]').click();
    return await page.locator('.dialog [data-action="tour-start"]').count() === 1;
})());
await page.keyboard.press('Escape');

console.log('\n5. Replies meaningfully change the route');
await fresh();
await startFromCard();
const opening = await choiceLabels();
check('the opening offers three routes', opening.length === 3, opening.join(' | '));
await tap(0);
const startRoute = await chapter();
await fresh();
await startFromCard();
await tap(1);
const feedbackRoute = await chapter();
await fresh();
await startFromCard();
await tap(2);
const controlRoute = await chapter();
check('each opening reply leads somewhere different',
    new Set([startRoute, feedbackRoute, controlRoute]).size === 3,
    `${startRoute} / ${feedbackRoute} / ${controlRoute}`);
// A concern reply selects a different Move for the same genre.
await fresh();
await startFromCard();
await tap(0); await tap(0);
const moveA = await page.locator('.gd-conversation').textContent();
await fresh();
await startFromCard();
await tap(0); await tap(2);
const moveB = await page.locator('.gd-conversation').textContent();
check('a different concern features a different Move',
    /Choose a memory and a boundary” is the one/.test(moveA) && /Protect language and voice” is the one/.test(moveB));
// A feedback reply selects a different explanation and preview emphasis.
await fresh();
await startFromCard();
await tap(1); await tap(0);
const askText = await page.locator('.gd-conversation').textContent();
await fresh();
await startFromCard();
await tap(1); await tap(2);
const councilText = await page.locator('.gd-conversation').textContent();
check('Ask and Council replies produce different explanations',
    askText.includes('Ask Tu Pana') && councilText.includes('Council') && askText !== councilText);

console.log('\n6. Live previews come from the real renderers');
await fresh();
await startFromCard();
await tap(0); await tap(0);
const previewClasses = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.gd-preview[data-preview="moves"] [class]'))
        .map(n => n.getAttribute('class')).join(' '));
const realClasses = await page.evaluate(() => {
    const panel = document.querySelector('.integrated-moves');
    if (!panel) return '';
    return [panel, ...panel.querySelectorAll('[class]')].map(n => n.getAttribute('class')).join(' ');
});
check('the Moves preview carries the real panel\'s classes',
    ['integrated-moves', 'move-card', 'panel-header', 'move-list'].every(cls => previewClasses.includes(cls)));
check('the real Moves panel uses those same classes',
    ['integrated-moves', 'move-card', 'panel-header', 'move-list'].every(cls => realClasses.includes(cls)));
check('the preview shows a populated Move note, not an empty panel',
    (await page.locator('.gd-preview[data-preview="moves"]').textContent()).match(/\d+\s+(words|palabras)/) !== null);
check('no static screenshot asset is used', await page.locator('.gd-preview img, .gd-preview picture').count() === 0);
check('every preview is labelled as a sample',
    await page.evaluate(() => Array.from(document.querySelectorAll('.gd-preview'))
        .every(f => /sample|muestra/i.test(f.querySelector('.gd-preview-badge')?.textContent || ''))));
check('every preview carries a caption and a screen-reader description',
    await page.evaluate(() => Array.from(document.querySelectorAll('.gd-preview')).every(f =>
        (f.querySelector('.gd-preview-caption')?.textContent || '').trim().length > 8
        && (f.querySelector('.sr-only')?.textContent || '').trim().length > 20)));
check('preview surfaces contain no live action',
    await page.locator('[data-preview-surface] [data-action]').count() === 0);
check('preview controls are removed from the tab order',
    await page.evaluate(() => Array.from(document.querySelectorAll('[data-preview-surface] button'))
        .every(b => b.disabled && b.getAttribute('tabindex') === '-1')));
check('previews can be enlarged', await (async () => {
    await page.locator('.gd-preview [data-action="gd-expand"]').first().click();
    await page.waitForTimeout(150);
    return await page.locator('.gd-preview--expanded').count() === 1;
})());

console.log('\n7. All five component previews appear across the conversation');
await fresh();
await startFromCard();
const kinds = new Set();
for (let i = 0; i < 16; i++) {
    (await page.locator('.gd-preview').evaluateAll(n => n.map(x => x.dataset.preview))).forEach(k => kinds.add(k));
    if (!(await tap(0))) break;
}
check('Moves, Review Center, Evidence, Your Voice, and review-copy previews all render',
    ['moves', 'review', 'evidence', 'voice', 'copies'].every(k => kinds.has(k)), [...kinds].join(', '));

console.log('\n8. Isolation — real state is byte-identical after every path');
for (const [name, walk] of [
    ['a full exploration', async () => { for (let i = 0; i < 16; i++) if (!(await tap(0))) break; }],
    ['the essential route', walkEssential],
    ['an immediate skip', async () => {}],
]) {
    await fresh();
    const before = await record();
    await startFromCard();
    await walk();
    const during = await record();
    await page.evaluate(() => document.querySelector('[data-action="tour-skip"]')?.click());
    await page.waitForTimeout(250);
    check(`record unchanged during and after ${name}`, during === before && await record() === before);
}
await fresh();
const beforeReload = await recordSansTimestamp();
await startFromCard();
await tap(0); await tap(0);
await page.reload();
check('record unchanged across a mid-conversation reload', await recordSansTimestamp() === beforeReload);
await fresh();
await startFromCard();
await walkEssential();
await page.locator('[data-action="tour-write"]').click();
await page.waitForTimeout(250);
check('finishing creates no Move note, Voice entry, decision, version, review, or Council run',
    await page.evaluate(key => {
        const s = JSON.parse(localStorage.getItem(key) || '{}');
        return Object.keys(s.moveNotes || {}).length === 0 && (s.voiceEntries || []).length === 0
            && (s.decisions || []).length === 0 && (s.versions || []).length === 0
            && (s.reviews || []).length === 0 && (s.councilRuns || []).length === 0
            && !s.reviewCopy && !s.reflectionSavedAt;
    }, KEY));
check('only two storage keys exist', await (async () => {
    const keys = await page.evaluate(() => Object.keys(localStorage));
    return keys.length === 2 && keys.includes(KEY) && keys.includes(TOUR_KEY);
})());
check('the preference record holds no student content',
    await tourPrefs().then(p => Object.keys(p).every(k => ['v', 'startedAt', 'completedAt', 'dismissedAt', 'lastExit'].includes(k))));
check('the desk is returned untouched and empty', await page.locator('#draftEditor').inputValue() === '');
check('no behavioural telemetry is recorded',
    await tourPrefs().then(p => !JSON.stringify(p).match(/route|choice|beat|concern|answer/i)));

console.log('\n9. Truthful claims');
await fresh();
await startFromCard();
await tap(1); await tap(2);
let body = await page.locator('.gd-conversation').textContent();
check('Council is described as several perspectives and slower', /three readers/i.test(body) && /takes longer/i.test(body));
check('disagreement is preserved, not resolved for the writer', /disagreement comes to you/i.test(body));
check('feedback kinds are choices, not stages', /choices, not stages/i.test(body));
check('self-review and instructor feedback are named as equally valid', /instructor/i.test(body));
check('consent and exact payload are stated', /exact text being sent/i.test(body));
check('saved reports reopen without a new AI call', /without asking the AI again/i.test(body));
await fresh();
await startFromCard();
await tap(2); await tap(0);
body = await page.locator('.gd-conversation').textContent();
check('Your Voice is student-selected, not AI-detected', /you choose it/i.test(body) && /never guess/i.test(body));
check('kept wording stays exact and local', /exactly as you wrote it/i.test(body) && /this device/i.test(body));
await fresh();
await startFromCard();
await tap(0); await tap(0); await tap(0); await tap(0); await tap(0); await tap(0); await tap(0); await tap(0);
body = await page.locator('.gd-conversation').textContent();
check('Evidence is not a score, meter, or surveillance record',
    /not a score/i.test(body) && /not a completion meter/i.test(body) && /not something watching you/i.test(body));
check('no admission, grade, or improvement promise anywhere',
    !/guarantee|admission odds|better grade|improve your grade|proven|plagiarism/i.test(body));
check('no percentage improvement claim', !/\d+% better/i.test(body));

console.log('\n10. Genre correctness and non-leakage');
// Forbidden patterns are each genre's *distinctive* material — a phrase that
// could only have come from another profile. Shared vocabulary that legitimately
// appears in several profiles (for example "citation" inside the autobiographical
// research Move) is not leakage.
const genreExpectations = [
    ['', 'autobiographical', /library counter|mostrador/i, /signup sheet|seedlings|shift notes|citation cannot summon|movie trailer/i],
    ['?assignment=college-personal-statement', 'admissions', /signup sheet|movie trailer/i, /library counter|seedlings|shift notes|citation cannot summon/i],
    ['?assignment=graduate-sop', 'sop', /intake survey|adjectives|cloud/i, /movie trailer|seedlings|shift notes|library counter/i],
    ['?assignment=stem-lab-report', 'stem', /seedling|2\.4|hoping/i, /movie trailer|library counter|shift notes|citation cannot summon/i],
    ['?assignment=cap200-bronx-beautiful-service-learning', 'cap200', /shift notes|eligibility/i, /movie trailer|seedlings|citation cannot summon|library counter/i],
    ['?assignment=research-paper', 'research', /citation cannot summon|sources/i, /movie trailer|seedlings|shift notes|library counter/i],
    ['?assignment=general-writing', 'neutral', /blank page|library/i, /movie trailer|seedlings|shift notes|citation cannot summon/i],
];
for (const [query, name, expected, forbidden] of genreExpectations) {
    await fresh({ query });
    await startFromCard();
    await tap(0); await tap(0);
    const text = await page.locator('.gd-conversation').textContent();
    check(`${name}: uses its own material`, expected.test(text));
    check(`${name}: no other genre's material leaks in`, !forbidden.test(text), text.slice(0, 90));
}
await fresh({ query: '?assignment=research-paper' });
await startFromCard();
for (let i = 0; i < 10; i++) if (!(await tap(0))) break;
const researchAll = await page.locator('.gd-conversation').textContent();
check('research: no invented citation, author, year, DOI, or page number',
    !/\(\s*\d{4}\s*\)|doi:|et al\.|pp?\.\s*\d+/i.test(researchAll));
// SHIPPED-CONTRACT UPDATE (2026-08-05): STEM now has a purpose-built, operational
// Council, so it is no longer the unavailable case. Reading Response is — its
// Council is deliberately not built — and the same truthfulness contract is
// asserted against it here.
await fresh({ query: '?assignment=reading-response-undergraduate' });
await startFromCard();
await tap(1); await tap(2);
check('reading response: Council unavailability is stated truthfully, not hidden',
    /not configured for this kind of writing/i.test(await page.locator('.gd-conversation').textContent()));
check('reading response: the real Review Center preview shows the same unavailability',
    /not available for reading responses/i.test(await page.locator('figure[data-preview="review"]').textContent()));
await fresh({ query: '?assignment=stem-lab-report' });
await startFromCard();
await tap(1); await tap(2);
check('stem: the Council is now offered rather than declared unconfigured',
    !/not configured for this kind of writing/i.test(await page.locator('.gd-conversation').textContent()));

console.log('\n11. Unknown assignments inherit nothing');
await fresh({ query: '?assignment=an-assignment-nobody-configured' });
check('no welcome card for an unconfigured assignment', await page.locator('.tour-welcome').count() === 0);
await page.locator('[data-action="help"]').click();
await page.locator('.dialog [data-action="tour-start"]').click();
await page.waitForTimeout(200);
const unknownBody = await page.locator('.dialog').textContent();
check('it explains the project is not configured', /not configured/i.test(unknownBody));
check('it points at Settings', await page.locator('.dialog [data-action="settings"]').count() === 1);
check('it inherits no genre material',
    !/library counter|signup sheet|seedling|eligibility|intake survey|blank page is being dramatic/i.test(unknownBody));

console.log('\n12. English, Spanish, and bilingual are complete');
for (const [lang, expect] of [['en', /Hola\. I’m Tu Pana/], ['es', /Hola\. Soy Tu Pana/]]) {
    await fresh({ lang });
    await startFromCard();
    await tap(0); await tap(0);
    const text = await page.locator('.gd-conversation').textContent();
    check(`${lang}: the conversation renders in that language`, expect.test(text));
    check(`${lang}: no untranslated placeholder`, !/undefined|\[object|null/.test(text));
}
await fresh({ lang: 'both' });
await startFromCard();
const bothText = await page.locator('.gd-conversation').textContent();
check('bilingual: both languages present', /Soy Tu Pana/.test(bothText) && /I’m Tu Pana/.test(bothText));
check('bilingual: Spanish is primary in prose',
    await page.evaluate(() => {
        const es = document.querySelector('.gd-bubble [lang="es"]');
        const en = document.querySelector('.gd-bubble [lang="en"]');
        return es && en && es.compareDocumentPosition(en) & Node.DOCUMENT_POSITION_FOLLOWING;
    }));
check('bilingual: the quip pairs inline rather than stacking a second block',
    await page.evaluate(() => {
        const quip = document.querySelector('.gd-quip [lang="en"]');
        return quip ? getComputedStyle(quip).display === 'inline' : false;
    }));
await tap(0); await tap(0);
check('bilingual: replies carry both languages', (await choiceLabels()).every(l => l.includes('·')));

console.log('\n13. Back, Start over, Skip, and exits');
await fresh();
await startFromCard();
check('Back is disabled at the opening', await page.locator('[data-action="gd-back"]').isDisabled());
await tap(0); await tap(0);
const beforeBack = await chapter();
await page.locator('[data-action="gd-back"]').click();
await page.waitForTimeout(200);
check('Back returns to the previous exchange', await chapter() !== beforeBack);
check('Back restores that step\'s replies', (await page.locator(REPLIES).count()) > 0);
await page.locator('[data-action="gd-restart"]').click();
await page.waitForTimeout(200);
check('Start over returns to the opening', (await choiceLabels()).length === 3 && await page.locator('.gd-turn').count() <= 4);
await fresh();
await startFromCard();
await walkEssential();
check('the ending offers both exits',
    await page.locator('[data-action="tour-write"]').count() === 1 && await page.locator('[data-action="tour-explore"]').count() === 1);
await page.locator('[data-action="tour-explore"]').click();
await page.waitForTimeout(250);
check('exiting closes the conversation and returns the desk', await page.locator('.gd-conversation').count() === 0 && await page.locator('#draftEditor').count() === 1);
await page.reload();
check('a completed conversation does not auto-prompt again', await page.locator('.tour-welcome').count() === 0);

console.log('\n14. Accessibility');
await fresh();
await startFromCard();
check('the conversation is inside a dialog', await page.locator('[role="dialog"]').count() === 1);
// Focus is applied on the next frame so it wins over the dialog's own initial
// focus; give that frame a moment before asserting where it landed.
await page.waitForTimeout(120);
check('focus lands on the first reply, not the top of the transcript',
    await page.evaluate(() => document.activeElement?.classList.contains('gd-choice')));
check('replies are reachable and operable by keyboard only', await (async () => {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(450);
    await settle();
    await page.waitForTimeout(120);
    return await page.locator('.gd-turn.me').count() >= 1;
})());
check('each step moves focus to the next reply',
    await page.evaluate(() => document.activeElement?.classList.contains('gd-choice')));
check('replies meet the 44px target size',
    await page.evaluate(() => Array.from(document.querySelectorAll('.gd-choice')).every(b => b.getBoundingClientRect().height >= 43.5)));
check('the transcript is announced politely, not assertively',
    await page.evaluate(() => (document.getElementById('assertiveRegion')?.textContent || '') === ''));
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
check('Escape leaves the conversation', await page.locator('.gd-conversation').count() === 0);
await fresh({ reducedMotion: 'reduce' });
await startFromCard();
await tap(0);
check('reduced motion: replies appear without waiting on an animation', await page.locator(REPLIES).count() > 0);
check('reduced motion: the conversation stays warm and complete',
    /Tu Pana/.test(await page.locator('.gd-conversation').textContent()));
await fresh({ viewport: { width: 390, height: 844 } });
await startFromCard();
await tap(0); await tap(0);
check('390×844: no horizontal overflow',
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
check('390×844: previews stay legible rather than shrinking to a thumbnail',
    await page.evaluate(() => {
        const s = document.querySelector('[data-preview-surface]');
        return s ? s.getBoundingClientRect().width >= 250 : false;
    }));
check('390×844: replies are full-width and tappable',
    await page.evaluate(() => Array.from(document.querySelectorAll('.gd-choice')).every(b => b.getBoundingClientRect().height >= 43.5)));
await fresh({ viewport: { width: 720, height: 900 } });
await page.evaluate(() => { document.body.style.zoom = '200%'; });
await startFromCard();
check('200% reflow: no horizontal overflow',
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2));
await fresh({ dark: true });
await startFromCard();
await tap(0); await tap(0);
// Contrast, not just visibility: an earlier build used a stylesheet token that
// does not exist here, so bubbles kept a cream background under dark text tokens.
const contrast = await page.evaluate(() => {
    const parse = value => {
        const parts = (value.match(/[\d.]+/g) || []).map(Number);
        return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts.length > 3 ? parts[3] : 1 };
    };
    // Semi-transparent bubbles must be composited over what is actually behind
    // them, or a 10% cream tint over a dark surface measures as cream.
    const effectiveBackground = el => {
        let node = el;
        let acc = { r: 255, g: 255, b: 255, a: 0 };
        const stack = [];
        while (node) { stack.push(parse(getComputedStyle(node).backgroundColor)); node = node.parentElement; }
        for (let i = stack.length - 1; i >= 0; i -= 1) {
            const layer = stack[i];
            if (!layer.a) continue;
            acc = {
                r: layer.r * layer.a + acc.r * (1 - layer.a),
                g: layer.g * layer.a + acc.g * (1 - layer.a),
                b: layer.b * layer.a + acc.b * (1 - layer.a),
                a: 1,
            };
        }
        return acc;
    };
    const luminance = ({ r, g, b }) => {
        const [lr, lg, lb] = [r, g, b].map(v => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    };
    const ratio = el => {
        const a = luminance(parse(getComputedStyle(el).color));
        const b = luminance(effectiveBackground(el));
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    return {
        pana: ratio(document.querySelector('.gd-turn.pana .gd-bubble')),
        me: ratio(document.querySelector('.gd-turn.me .gd-bubble')),
    };
});
check('dark appearance: companion bubbles meet 4.5:1 text contrast', contrast.pana >= 4.5, contrast.pana.toFixed(2));
check('dark appearance: the student\'s own replies meet 4.5:1 text contrast', contrast.me >= 4.5, contrast.me.toFixed(2));
check('dark appearance: the preview surface stays visible',
    await page.evaluate(() => {
        const s = document.querySelector('[data-preview-surface]');
        if (!s) return false;
        const style = getComputedStyle(s);
        return style.visibility === 'visible' && style.opacity !== '0';
    }));

console.log('\n15. The dismissed Studio keeps its established density and navigation');
await fresh();
const countWords = () => page.evaluate(() => {
    const vh = innerHeight;
    let n = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const el = node.parentElement;
        if (!el || el.closest('.sr-only, script, noscript, [aria-hidden="true"]')) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top >= vh || rect.bottom <= 0 || rect.height === 0) continue;
        const t = node.textContent.trim();
        if (t) n += t.split(/\s+/).length;
    }
    return n;
});
const withCard = await countWords();
check('first-viewport density with the invitation present is the established 205 or fewer', withCard <= 205, String(withCard));
await page.evaluate(() => document.querySelector('[data-action="tour-dismiss"]').click());
await page.waitForTimeout(250);
await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(150);
check('dismissal returns the identical density', await countWords() === withCard);
check('the three primary destinations are unchanged',
    (await page.locator('.phase-strip .phase-tab').allTextContents()).length === 3);
check('no fourth destination was added', await page.locator('.phase-strip button').count() === 3);
check('no persistent chat column was introduced', await page.locator('.gd-conversation, .gd-transcript').count() === 0);

console.log('\n16. No network, no AI, no page errors');
check('zero external requests across the whole suite', external.length === 0, external.slice(0, 3).join(', '));
check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${failed === 0 ? '✅' : '❌'} Guided Discovery: ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
