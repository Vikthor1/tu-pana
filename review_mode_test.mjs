// review_mode_test.mjs — Colleague Review Mode regression coverage
// Encodes the hard Pilot 2 invariant + review-mode behavior:
//   A. Normal student flow NEVER exposes Research Paper / STEM through a selector;
//      getSelectableProfiles() excludes them; selectable:false unchanged.
//   B. getReviewProfiles() lists CAP 200 + Research Paper + STEM with succinct
//      review display labels, without touching layer flags.
//   C. ?review=colleague (canonical) shows the review selector — heading, subtitle,
//      bilingual do-not-share guardrail, all four succinct card titles — plus the
//      visible "Modo de revisión · Review mode" badge; ?review=true is an alias.
//      Review mode is URL-scoped only (never persisted).
//   D. Direct review links (?review=colleague&assignment=<id>) activate the
//      pathway directly with the badge and are never blocked by the selector.
//   E. Normal student deep links activate WITHOUT badge or selector (unchanged).
//   F. No cross-genre leakage into the student first-run chooser; zero console errors.
//
// Run: node review_mode_test.mjs   (requires `node test-server.js` on :3001)

import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
let passed = 0, failed = 0;
function check(label, cond) {
    const ok = !!cond;
    if (ok) passed++; else failed++;
    console.log(`  ${ok ? '✅' : '❌'} ${label}`);
}

const browser = await chromium.launch();
const consoleErrs = [];

async function visit(url, opts = {}) {
    const p = await browser.newPage();
    p.on('pageerror', e => consoleErrs.push(url + ' :: ' + String(e)));
    p.on('console', m => { if (m.type() === 'error') consoleErrs.push(url + ' :: ' + m.text()); });
    await p.goto(BASE + '/');
    await p.evaluate((onboarded) => {
        localStorage.clear();
        if (onboarded) { localStorage.setItem('tupana_mani_done','true'); localStorage.setItem('tupana_lab_done','true'); localStorage.setItem('tupana_project_chosen','true'); }
    }, opts.onboarded !== false);
    await p.goto(BASE + url);
    await p.waitForTimeout(1100);
    const r = await p.evaluate(() => ({
        badge: !!document.getElementById('reviewModeBadge'),
        badgeText: document.getElementById('reviewModeBadge')?.textContent || '',
        selector: !!document.getElementById('projectSelector'),
        selectorText: document.getElementById('projectSelector')?.innerText || '',
        aid: buildChannelData().assignmentId,
        reviewKeysStored: Object.keys(localStorage).filter(k => /review/i.test(k)).join(',') || 'none',
        node1: document.querySelector('.stage-node[data-id="1"] .label-en')?.textContent?.trim(),
        selectable: getSelectableProfiles().map(x => x.assignmentId),
        review: (typeof getReviewProfiles === 'function') ? getReviewProfiles() : null,
        rpFlag: getAssignmentLayer('research-paper')?.selectable,
        stemFlag: getAssignmentLayer('stem-lab-report')?.selectable,
        cpsFlag: getAssignmentLayer('college-personal-statement')?.selectable
    }));
    if (opts.keep) return { page: p, r };
    await p.close();
    return r;
}

// ── A. Normal student invariant ──
console.log('\n── A. Normal student invariant ──');
let r = await visit('/', { onboarded: false });
check('first-run chooser is the STUDENT selector (Elige tu proyecto), no review copy', r.selector && /Elige tu proyecto/.test(r.selectorText) && !/Modo de revisión/.test(r.selectorText));
check('student chooser lists NO Research Paper / STEM / Admissions', !/Research Paper/.test(r.selectorText) && !/STEM/.test(r.selectorText) && !/Admissions/.test(r.selectorText));
check('getSelectableProfiles() = CAP only', r.selectable.join() === 'cap200-bronx-beautiful-service-learning');
check('research-paper + stem-lab-report remain selectable:false', r.rpFlag === false && r.stemFlag === false);
check('college-personal-statement remains selectable:false', r.cpsFlag === false);
check('no badge in student first-run', !r.badge);
r = await visit('/');
check('onboarded bare URL: no selector, no badge', !r.selector && !r.badge);

// ── B. Review profile list ──
console.log('\n── B. getReviewProfiles() ──');
check('exists and lists CAP, research, STEM, admissions in order', Array.isArray(r.review) && r.review.map(p => p.assignmentId).join() === 'cap200-bronx-beautiful-service-learning,research-paper,stem-lab-report,college-personal-statement');
check('succinct EN review labels', r.review.map(p => p.labelEn).join('|') === 'Service-Learning Report|Research Paper|STEM Lab Report|College Admissions Essay');
check('succinct ES review labels (Trabajo de investigación)', r.review.map(p => p.labelEs).join('|') === 'Informe de aprendizaje-servicio|Trabajo de investigación|Informe de laboratorio STEM|Ensayo de admisión universitaria');
check('listing does not change layer flags', r.rpFlag === false && r.stemFlag === false && r.cpsFlag === false);

// ── C. Review selector via canonical link + alias ──
console.log('\n── C. Review selector ──');
r = await visit('/?review=colleague');
check('?review=colleague shows review heading', r.selector && /Modo de revisión · Review mode/.test(r.selectorText));
check('subtitle: Compara los caminos de escritura', /Compara los caminos de escritura/.test(r.selectorText));
check('bilingual guardrail note present', /No compartas este enlace con estudiantes durante Pilot 2/.test(r.selectorText) && /Do not share this link with students during Pilot 2/.test(r.selectorText));
check('Default card titled Autobiographical Mixed-Genre Essay', /Autobiographical Mixed-Genre Essay/.test(r.selectorText) && /Ensayo autobiográfico de género mixto/.test(r.selectorText));
check('cards: Service-Learning Report + Research Paper + STEM Lab Report + College Admissions Essay', /Service-Learning Report/.test(r.selectorText) && /Research Paper/.test(r.selectorText) && /STEM Lab Report/.test(r.selectorText) && /College Admissions Essay/.test(r.selectorText));
check('visible review badge', r.badge && /Modo de revisión · Review mode/.test(r.badgeText));
check('review mode NOT persisted (no review keys in storage)', r.reviewKeysStored === 'none');
r = await visit('/?review=true');
check('?review=true alias shows selector + badge', r.selector && /Modo de revisión/.test(r.selectorText) && r.badge);

// ── D. Direct review assignment links ──
console.log('\n── D. Direct review links ──');
r = await visit('/?review=colleague&assignment=stem-lab-report');
check('STEM activates directly (Lab Context)', r.aid === 'stem-lab-report' && r.node1 === 'Lab Context');
check('badge appears', r.badge);
check('selector does not block direct review', !r.selector);
r = await visit('/?review=colleague&assignment=college-personal-statement');
check('Admissions activates directly (Story Inventory)', r.aid === 'college-personal-statement' && r.node1 === 'Story Inventory');
check('admissions review badge appears', r.badge);
check('selector does not block admissions direct review', !r.selector);
// link-hub navigation from the selector
{
    const { page: p } = await visit('/?review=colleague', { keep: true });
    await p.click('.project-option[data-assign="research-paper"]');
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(900);
    const nav = await p.evaluate(() => ({ url: location.search, aid: buildChannelData().assignmentId, badge: !!document.getElementById('reviewModeBadge') }));
    check('card click navigates to ?review=colleague&assignment=research-paper', nav.url === '?review=colleague&assignment=research-paper');
    check('pathway active + badge after navigation', nav.aid === 'research-paper' && nav.badge);
    await p.close();
}

// ── E. Normal deep links unchanged ──
console.log('\n── E. Normal student deep links (no badge, no selector) ──');
for (const [q, label] of [
    ['/?assignment=stem-lab-report', 'Lab Context'],
    ['/?assignment=research-paper', 'Topic & Context'],
    ['/?assignment=cap200-bronx-beautiful-service-learning', 'Community Starting Point'],
    ['/?assignment=college-personal-statement', 'Story Inventory']
]) {
    r = await visit(q);
    check(`${q} activates (${label}), no badge, no selector`, r.node1 === label && !r.badge && !r.selector);
}

// ── F. Errors ──
check('zero console/page errors across all cases', consoleErrs.length === 0);
if (consoleErrs.length) console.log('  errors:', consoleErrs.slice(0, 5));
console.log(`\nreview_mode_test: ${passed} passed, ${failed} failed`);
await browser.close();
process.exit(failed ? 1 : 0);
