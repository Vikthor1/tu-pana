// stuck_menu_reachability_test.mjs — Batch 2 (verify-only) regression lock.
// Locks the confirmed behavior on baseline (resolved by commit f72408e):
// at 1280x720 the "Estoy atascado" menu's TOP actionable option stays visible,
// unclipped, and receives a REAL pointer click — in normal AND grown-input states.
// Also covers keyboard activation and dismissal. No production change; if the
// f72408e clamp regresses (menu overflows the panel / hides under the sticky band),
// these assertions fail. Run with the local server up: node test-server.js (:3001)
import { chromium } from 'playwright';
const BASE = 'http://localhost:3001';
const browser = await chromium.launch({ headless: true });
let pass = 0, fail = 0;
const check = (l, c) => { console.log(`  ${c ? '✅' : '❌'} ${l}`); c ? pass++ : fail++; };

async function freshWorkspace() {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto(BASE + '/');
    await page.evaluate(() => { try { localStorage.clear(); localStorage.setItem('tupana_mani_done','true'); localStorage.setItem('tupana_lab_done','true'); } catch(e){} });
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
    return { page, errs };
}

// Enable workspace + stuck button, instrument the handler, optionally grow the
// chat input, then open the menu. Returns the top option's geometry + hit test.
async function openMenu(page, grow) {
    return await page.evaluate((grow) => {
        if (typeof setCoachMode === 'function') setCoachMode('offline');
        window.__fired = null;
        const orig = window.handleStuckOption;
        window.handleStuckOption = function (o) { window.__fired = o; return orig && orig.apply(this, arguments); };
        if (grow) {
            const ci = document.getElementById('chatInput');
            ci.value = Array.from({ length: 10 }, (_, i) => 'Linea larga ' + (i + 1) + ' del mensaje del estudiante.').join('\n');
            ci.style.height = 'auto';
            ci.dispatchEvent(new Event('input', { bubbles: true }));
            ci.style.height = ci.scrollHeight + 'px';
        }
        showStuckTriage();
        const menu = document.getElementById('stuckTriage');
        const top = menu.querySelector('.stuck-option');           // first = visual TOP option
        const tb = top.getBoundingClientRect();
        const panelTop = Math.round(document.querySelector('.chat-panel').getBoundingClientRect().top);
        const cx = Math.round(tb.left + tb.width / 2), cy = Math.round(tb.top + tb.height / 2);
        const hit = document.elementFromPoint(cx, cy);
        const insideOption = !!(hit && (hit === top || top.contains(hit) || (hit.closest && hit.closest('.stuck-option') === top)));
        return {
            menuOpen: menu.classList.contains('on'),
            cx, cy, insideOption,
            topVisible: tb.top >= panelTop && tb.bottom <= window.innerHeight && tb.width > 0 && tb.height > 0,
        };
    }, grow);
}

for (const grow of [false, true]) {
    const label = grow ? 'grown-input' : 'normal';
    console.log(`\n── 1280x720 · ${label} · top option reachable ──`);
    const { page, errs } = await freshWorkspace();
    const m = await openMenu(page, grow);
    check(`[${label}] menu opens`, m.menuOpen);
    check(`[${label}] top option visible & unclipped (within panel + viewport)`, m.topVisible);
    check(`[${label}] elementFromPoint at top option === the option (not occluded)`, m.insideOption);
    await page.mouse.click(m.cx, m.cy);                       // REAL pointer click
    await page.waitForTimeout(150);
    const fired = await page.evaluate(() => window.__fired);
    check(`[${label}] real pointer click fires handleStuckOption('prompt')`, fired === 'prompt');
    check(`[${label}] no page/console errors`, errs.length === 0);
    await page.close();
}

// ── Keyboard activation ──
console.log('\n── 1280x720 · keyboard activation ──');
{
    const { page, errs } = await freshWorkspace();
    await openMenu(page, false);
    const kb = await page.evaluate(() => {
        const top = document.querySelector('#stuckTriage .stuck-option');
        top.focus();
        const focused = document.activeElement === top;
        return { focused };
    });
    check('top option is keyboard-focusable', kb.focused);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    const firedKb = await page.evaluate(() => window.__fired);
    check("Enter on focused top option fires handleStuckOption('prompt')", firedKb === 'prompt');
    check('no page/console errors', errs.length === 0);
    await page.close();
}

// ── Dismissal ──
console.log('\n── 1280x720 · dismissal ──');
{
    const { page } = await freshWorkspace();
    await openMenu(page, false);
    const dismissed = await page.evaluate(() => {
        document.querySelector('#stuckTriage .stuck-triage-close').click();
        return !document.getElementById('stuckTriage').classList.contains('on');
    });
    check('Close button dismisses the menu (.on removed)', dismissed);
    await page.close();
}

await browser.close();
console.log(`\n  ${pass}/${pass + fail} PASS`);
if (fail) process.exit(1);
