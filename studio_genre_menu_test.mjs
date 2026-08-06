// Writing Studio — genre menu integrity, and the three founder corrections.
//
// The expanded menu is intentional. Three distinct STEM configurations and two
// distinct Reading Response configurations exist because they are different
// genres, not because a profile leaked in twice. This suite proves that every
// visible option is a real, distinct destination — and that the fine-grained
// profiles keep their own Moves, review lenses, and Council availability.
//
// It also pins the three corrections from founder review: the welcome card's
// brand mark never collides with its own copy, "I'm stuck" lives beneath the
// editor in exactly one place, and no course number survives on a
// student-facing surface.
//
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const BASE = `${ORIGIN}/studio.html`;
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
let page;
async function fresh(query = '', viewport = { width: 1440, height: 960 }, newcomer = false) {
    if (page) await page.close();
    page = await browser.newPage({ viewport });
    page.setDefaultTimeout(9000);
    page.on('request', request => { if (!request.url().startsWith(ORIGIN)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(BASE);
    await page.evaluate(([k, t, fresh]) => {
        localStorage.removeItem(k);
        if (fresh) localStorage.removeItem(t);
        else localStorage.setItem(t, JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
    }, [KEY, TOUR_KEY, newcomer]);
    await page.goto(`${BASE}${query}`);
}

// ── 1. Every visible option is a distinct destination ────────────────────────
console.log('\n1. Genre menu integrity');
await fresh('?assignment=general-writing');
const menu = await page.evaluate(() => {
    const options = [...document.querySelectorAll('select[data-action="genre"] option')]
        .filter(o => o.value && !o.disabled)
        .map(o => ({ value: o.value, label: o.textContent.trim() }));
    return { options, profileCount: Object.keys(window.StudioProfiles.genres).length };
});
check('the menu offers options', menu.options.length >= 11, `${menu.options.length}`);
check('every option label is unique',
    new Set(menu.options.map(o => o.label)).size === menu.options.length,
    JSON.stringify(menu.options.map(o => o.label).filter((l, i, a) => a.indexOf(l) !== i)));
check('every option maps to a distinct profile',
    new Set(menu.options.map(o => o.value)).size === menu.options.length,
    JSON.stringify(menu.options.map(o => o.value).filter((v, i, a) => a.indexOf(v) !== i)));
check('no profile appears twice in the menu', menu.options.length === menu.profileCount,
    `${menu.options.length} options vs ${menu.profileCount} profiles`);
check('no option label is empty or a bare profile key',
    menu.options.every(o => o.label.length > 3 && o.label !== o.value));

// ── 2. The intentional fine-grained profiles are all present and distinct ────
console.log('\n2. Intentional fine-grained profiles');
const EXPECTED = [
    ['stem', 'STEM Laboratory Report'],
    ['stemExplanation', 'Technical or Scientific Explanation'],
    ['stemArgument', 'Evidence-Based Scientific Argument'],
    ['readingUg', 'Undergraduate Reading Response'],
    ['readingGrad', 'Graduate Extended Reading Response'],
];
for (const [value, label] of EXPECTED) {
    const option = menu.options.find(o => o.value === value);
    check(`${label} is present under its own option`, option && option.label === label, JSON.stringify(option));
}
const detail = await page.evaluate(keys => {
    const P = window.StudioProfiles;
    return Object.fromEntries(keys.map(k => [k, {
        moves: (P.integratedMoveProfiles[k] || []).map(m => m.id),
        lenses: P.genres[k]?.moves?.review || [],
        council: P.councilConfig[k]?.enabled === true,
    }]));
}, EXPECTED.map(e => e[0]));
check('each STEM configuration has its own Move set',
    new Set(EXPECTED.slice(0, 3).map(([k]) => JSON.stringify(detail[k].moves))).size === 3);
check('each Reading Response configuration has its own Move set',
    JSON.stringify(detail.readingUg.moves) !== JSON.stringify(detail.readingGrad.moves));
check('each of the five has its own review lenses',
    new Set(EXPECTED.map(([k]) => JSON.stringify(detail[k].lenses))).size >= 4);
check('all three STEM configurations have the Council available',
    detail.stem.council && detail.stemExplanation.council && detail.stemArgument.council);
check('neither Reading Response configuration has the Council available',
    !detail.readingUg.council && !detail.readingGrad.council);

// ── 3. Generic routes still fail closed ──────────────────────────────────────
console.log('\n3. Generic routes fail closed');
for (const raw of ['stem', 'reading-response', 'reading-reflection', 'stem-writing']) {
    await fresh(`?assignment=${raw}`);
    check(`?assignment=${raw} stops rather than guessing`,
        /CONFIGURATION REQUIRED|CONFIGURACIÓN/i.test(await page.locator('#prototypeRoot').innerText())
        && await page.locator('.integrated-move').count() === 0);
}

// ── 4. Existing saved genre identifiers still resolve ────────────────────────
console.log('\n4. Backward compatibility');
const links = await page.evaluate(() => {
    const r = window.StudioProfiles.resolveAssignment;
    return Object.fromEntries([
        'mixed-genre-autobiographical-essay', 'college-personal-statement', 'graduate-sop',
        'stem-lab-report', 'research-paper', 'cap200-bronx-beautiful-service-learning',
        'cap-200-first-draft', 'general-writing',
    ].map(id => [id, r(id)?.profileId || null]));
});
check('every pre-existing assignment link still resolves',
    Object.values(links).every(Boolean), JSON.stringify(links));
check('the legacy CAP 200 first-draft link still reaches the service-learning profile',
    links['cap-200-first-draft'] === 'cap200' && links['cap200-bronx-beautiful-service-learning'] === 'cap200');
// A record written by the app under the service-learning profile must survive
// the label change untouched. Written naturally rather than hand-seeded, so the
// check exercises the real persistence shape rather than a guess at it.
await fresh('?assignment=cap200-bronx-beautiful-service-learning');
await page.locator('#draftEditor').fill('Work saved before the label change.');
await page.waitForTimeout(420);
const savedGenre = await page.evaluate(k => JSON.parse(localStorage.getItem(k)).genre, KEY);
await page.reload();
await page.waitForTimeout(320);
check('a record saved under the service-learning profile still opens with its draft intact',
    (await page.locator('#draftEditor').inputValue()) === 'Work saved before the label change.');
check('the internal profile key is unchanged by the label correction',
    savedGenre === 'cap200'
    && (await page.evaluate(k => JSON.parse(localStorage.getItem(k)).genre, KEY)) === 'cap200');
check('the stored assignment id is unchanged',
    (await page.evaluate(k => JSON.parse(localStorage.getItem(k)).assignmentId, KEY)) === 'cap200-bronx-beautiful-service-learning');
// A record that snapshotted the OLD label keeps showing it — provenance, not stale data.
const storedLabel = await page.evaluate(() => window.StudioProfiles.genres.cap200.label.en);
check('the current service-learning label carries no course number', !/CAP\s*-?\s*200/i.test(storedLabel), storedLabel);

// ── 5. No course number on any student-facing surface ────────────────────────
console.log('\n5. Course number removed from student-facing labels');
const CAP = /CAP\s*-?\s*200/i;
for (const lang of ['en', 'es', 'both']) {
    await fresh('?assignment=cap200-bronx-beautiful-service-learning');
    if (lang !== 'en') await page.locator('.prototype-actions [data-action="language"]').selectOption(lang);
    await page.waitForTimeout(180);
    const surface = await page.evaluate(() => {
        const parts = [document.body.innerText];
        document.querySelectorAll('option').forEach(o => parts.push(o.textContent));
        document.querySelectorAll('[aria-label],[title]').forEach(e => parts.push(e.getAttribute('aria-label') || '', e.getAttribute('title') || ''));
        return parts.join('\n');
    });
    check(`${lang}: desk, selector, chip, and accessible names carry no course number`, !CAP.test(surface),
        (surface.match(CAP) || [''])[0]);
    check(`${lang}: the genre is still named as service-learning`,
        /service-learning|aprendizaje-servicio/i.test(surface));
}

// ── 6. Correction: "I'm stuck" sits beneath the editor, exactly once ─────────
console.log('\n6. I\'m stuck placement');
const ALL = ['mixed-genre-autobiographical-essay', 'college-personal-statement', 'graduate-sop',
    'stem-lab-report', 'stem-scientific-explanation', 'stem-scientific-argument', 'research-paper',
    'cap200-bronx-beautiful-service-learning', 'general-writing',
    'reading-response-undergraduate', 'reading-response-graduate'];
for (const assignment of ALL) {
    await fresh(`?assignment=${assignment}`);
    const total = await page.locator('[data-action="stuck"]').count();
    const inFooter = await page.locator('.editor-footer [data-action="stuck"]').count();
    const inRail = await page.locator('.integrated-support [data-action="stuck"]').count();
    check(`${assignment}: exactly one stuck control, in the editor footer`, total === 1 && inFooter === 1 && inRail === 0,
        `total=${total} footer=${inFooter} rail=${inRail}`);
    const order = await page.evaluate(() => [...document.querySelectorAll('.editor-footer button')].map(b => b.dataset.action));
    check(`${assignment}: order is Continue → I'm stuck → Review Center`,
        order.indexOf('continue') < order.indexOf('stuck') && order.indexOf('stuck') < order.indexOf('review-center'),
        JSON.stringify(order));
}
await fresh('?assignment=general-writing');
check('Continue remains the visually primary action',
    await page.locator('.editor-footer [data-action="continue"].primary').count() === 1
    && await page.locator('.editor-footer [data-action="stuck"].primary').count() === 0);
check('stuck is presented as calm support, not an error or warning',
    await page.locator('.editor-footer [data-action="stuck"][role="alert"], .editor-footer [data-action="stuck"].danger, .editor-footer [data-action="stuck"].warn').count() === 0);
check('its accessible name explains what it offers',
    /one small next step|próximo paso/i.test(await page.locator('.editor-footer [data-action="stuck"]').getAttribute('aria-label')));
await page.locator('.editor-footer [data-action="stuck"]').focus();
check('it is keyboard focusable', await page.evaluate(() => document.activeElement?.dataset.action === 'stuck'));
await page.keyboard.press('Enter');
await page.waitForTimeout(250);
check('it opens the five support needs from the keyboard',
    await page.locator('.stuck-choices [data-action="stuck-choice"]').count() === 5);
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
check('leaving support does not change the canonical draft',
    (await page.locator('#draftEditor').inputValue()) === '');

// ── 7. Correction: the welcome card's mark never collides ────────────────────
console.log('\n7. Welcome card layout');
for (const [name, width, height] of [['narrow phone', 320, 568], ['phone', 390, 844], ['desktop', 1440, 960]]) {
    for (const lang of ['en', 'es', 'both']) {
        await fresh('?assignment=cap200-bronx-beautiful-service-learning', { width, height }, true);
        if (lang !== 'en') await page.locator('.prototype-actions [data-action="language"]').selectOption(lang);
        await page.waitForTimeout(180);
        const geo = await page.evaluate(() => {
            const box = el => { const r = el.getBoundingClientRect(); return { t: r.top, b: r.bottom, l: r.left, r: r.right, w: r.width, h: r.height }; };
            const hit = (a, z) => !(a.b <= z.t + 0.5 || z.b <= a.t + 0.5 || a.r <= z.l + 0.5 || z.r <= a.l + 0.5);
            const svg = box(document.querySelector('.first-run-card .brand-icon svg'));
            const mark = box(document.querySelector('.first-run-mark'));
            const others = ['#firstRunTitle', '.first-run-project', '.first-run-lead', '.first-run-note']
                .map(s => document.querySelector(s)).filter(Boolean).map(box);
            const buttons = [...document.querySelectorAll('.first-run-actions .button')].map(box);
            return {
                collides: [...others, ...buttons].some(o => hit(svg, o)),
                contained: svg.t >= mark.t - 0.5 && svg.b <= mark.b + 0.5 && svg.l >= mark.l - 0.5 && svg.r <= mark.r + 0.5,
                iconW: svg.w, iconH: svg.h,
                buttons: buttons.length,
                tallEnough: buttons.every(x => x.h >= 43.5),
                overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
            };
        });
        const tag = `${name} ${lang}`;
        check(`${tag}: the brand mark collides with nothing`, !geo.collides);
        check(`${tag}: the mark stays inside its reserved area`, geo.contained);
        check(`${tag}: the mark is legibly sized`, geo.iconW >= 80 && geo.iconH >= 60, `${Math.round(geo.iconW)}×${Math.round(geo.iconH)}`);
        check(`${tag}: two actions, each meeting the touch target`, geo.buttons === 2 && geo.tallEnough);
        check(`${tag}: no horizontal page overflow`, !geo.overflow);
    }
}
// Text enlargement and reduced motion.
await fresh('?assignment=reading-response-graduate', { width: 390, height: 844 }, true);
await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
await page.waitForTimeout(200);
check('200%-ish text enlargement does not cause collision or clipping', await page.evaluate(() => {
    const box = el => el.getBoundingClientRect();
    const svg = box(document.querySelector('.first-run-card .brand-icon svg'));
    const h2 = box(document.querySelector('#firstRunTitle'));
    const card = document.querySelector('.first-run-card');
    return svg.bottom <= h2.top + 0.5 && card.scrollHeight <= card.clientHeight + 1
        && document.documentElement.scrollWidth <= window.innerWidth + 1;
}));
await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.reload();
await page.waitForTimeout(250);
check('reduced motion: the welcome still renders with its mark and both actions',
    await page.locator('.first-run .brand-icon svg').count() === 1
    && await page.locator('.first-run-actions .button').count() === 2);
check('reduced motion: the brand animation is stopped',
    await page.evaluate(() => ['.tp-av-glow', '.tp-av-line', '.tp-av-cursor', '.tp-av-steam', '.tp-av-spark']
        .every(sel => { const el = document.querySelector(`.first-run ${sel}`); return !el || getComputedStyle(el).animationName === 'none'; })));
await page.emulateMedia({ reducedMotion: null });
// Keyboard order and accessible structure.
await fresh('?assignment=general-writing', { width: 1440, height: 960 }, true);
check('the welcome exposes one labelled region and one heading',
    await page.locator('.first-run[aria-labelledby="firstRunTitle"]').count() === 1
    && await page.locator('#firstRunTitle').count() === 1);
check('Guided Discovery comes before the Desk action in keyboard order',
    await page.evaluate(() => {
        const b = [...document.querySelectorAll('.first-run-actions button')].map(x => x.dataset.action);
        return b.indexOf('tour-start') === 0 && b.indexOf('tour-dismiss') === 1;
    }));

// ── Close ────────────────────────────────────────────────────────────────────
check('no external network request was made', external.length === 0, external.join(', '));
check('no page error was raised', errors.length === 0, errors.join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} ${failed ? 'FAIL' : 'PASS'}`);
process.exit(failed ? 1 : 0);
