// voice_vault_test.mjs — Voice Vault save path (founder finding 2026-08-01:
// "when you select a sentence, the button for saving it in the vault does nothing")
//
// Contract verified here:
//   1. Protection is offered at every revision stage (7–9), not Stage 8 only.
//   2. Selecting a sentence surfaces a Protect action right there (passage menu).
//   3. Protect works from the passage menu, the draft toolbar, and the vault.
//   4. A selection that is dropped on blur still protects (remembered selection).
//   5. No attempt is silent: every path answers in the vault's status line.
//   6. Protection survives reload and is genre-independent.
//
// Requires a local server on 127.0.0.1:3001 (node test-server.js).
import { chromium } from 'playwright';

const HOST = 'http://127.0.0.1:3001/';
let passed = 0, failed = 0;
function check(label, condition, detail) {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : `\n       ↳ ${detail}`}`);
    if (ok) passed += 1; else failed += 1;
}

const DRAFT = [
    'La clinica de mi abuela hablaba un idioma que ella no entendia del todo.',
    'Yo traducia cada palabra con miedo y con cuidado, una por una.',
    'Ese verano decidi estudiar salud publica para que nadie mas tuviera que traducir su propio dolor.',
].join('\n');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e)));

async function boot(assignment, stage) {
    await page.goto(HOST + (assignment ? `?assignment=${assignment}` : ''));
    await page.evaluate(([d, st]) => {
        localStorage.clear(); sessionStorage.clear();
        ['tupana_lab_done', 'tupana_onboarding_complete', 'tupana_mani_done', 'tupana_ai_cue_seen']
            .forEach(k => localStorage.setItem(k, 'true'));
        localStorage.setItem('tupana_stage', String(st));
        localStorage.setItem('tupana_draft_saved', 'true');
        localStorage.setItem('tupana_draft', d);
        localStorage.setItem('tupana_writing_s6', d);
        localStorage.setItem('tupana_writing_s' + st, d);
    }, [DRAFT, stage]);
    await page.reload();
    await page.waitForTimeout(1300);
    await page.evaluate(() => { document.querySelectorAll('[id$="Bg"].on, .phase-toast.on').forEach(n => n.classList.remove('on')); });
}
const selectLine = () => page.locator('#draftArea').click({ clickCount: 3 });
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('tupana_protected') || '[]'));
const vaultStatus = () => page.evaluate(() => document.getElementById('vaultStatus')?.textContent?.trim() || '');

// ── 1. Availability across revision stages ──
console.log('availability');
for (const stage of [7, 8, 9]) {
    await boot(null, stage);
    check(`stage ${stage}: vault panel present`, await page.locator('#voiceVault').count() === 1);
    check(`stage ${stage}: toolbar Protect visible`,
        await page.evaluate(() => getComputedStyle(document.getElementById('etbProtectBtn')).display !== 'none'));
}
await boot(null, 5);
check('stage 5: vault panel absent (protection belongs to revision)',
    await page.locator('#voiceVault').count() === 0);
check('stage 5: toolbar Protect hidden',
    await page.evaluate(() => getComputedStyle(document.getElementById('etbProtectBtn')).display === 'none'));

// ── 2. Selecting a sentence surfaces Protect where the student is looking ──
console.log('selection affordance');
await boot(null, 7);
await selectLine();
await page.waitForTimeout(200);
check('passage menu appears on selection',
    await page.evaluate(() => getComputedStyle(document.getElementById('passageCoachMenu')).display !== 'none'));
check('passage menu offers Protect during revision stages',
    await page.locator('#passageCoachMenu [data-passage-action="protect"]').isVisible());
check('Protect stays enabled without a live coach connection',
    await page.evaluate(() => !document.querySelector('#passageCoachMenu [data-passage-action="protect"]').disabled));

// ── 3. Protect from the passage menu actually saves ──
await page.locator('#passageCoachMenu [data-passage-action="protect"]').click();
await page.waitForTimeout(300);
let saved = await stored();
check('passage-menu Protect saves the selected phrase at Stage 7', saved.length === 1,
    JSON.stringify(saved));
check('saved text is the sentence the student selected',
    saved[0] && /Ese verano decidi estudiar salud publica/.test(saved[0].text), saved[0]?.text);
check('the vault confirms the save in its own status line',
    /protegida|protected/i.test(await vaultStatus()), await vaultStatus());
check('the saved phrase is listed in the vault',
    (await page.locator('#vaultPhraseList .vault-phrase').count()) === 1);

// ── 4. Toolbar + inline buttons, and the remembered selection ──
console.log('other entry points');
await boot(null, 8);
await selectLine();
await page.locator('#etbProtectBtn').click();
await page.waitForTimeout(250);
check('toolbar Protect saves the selection', (await stored()).length === 1);

await boot(null, 8);
await selectLine();
// Blur the textarea the way a real click elsewhere does, dropping the selection.
await page.evaluate(() => { document.getElementById('draftArea').blur(); document.getElementById('chatInput')?.focus(); });
await page.evaluate(() => { const a = document.getElementById('draftArea'); a.setSelectionRange(0, 0); });
await page.locator('#vaultInlineProtectBtn').click();
await page.waitForTimeout(250);
check('a selection dropped on blur is still protected (remembered selection)',
    (await stored()).length === 1, JSON.stringify(await stored()));

// ── 5. No silent failures ──
console.log('never silent');
await boot(null, 8);
await page.evaluate(() => { const a = document.getElementById('draftArea'); a.focus(); a.setSelectionRange(0, 0); });
await page.locator('#vaultInlineProtectBtn').click();
await page.waitForTimeout(250);
check('clicking Protect with nothing selected explains what to do',
    /selecciona|select/i.test(await vaultStatus()), await vaultStatus());
check('and saves nothing', (await stored()).length === 0);

await boot(null, 8);
await selectLine();
await page.locator('#etbProtectBtn').click();
await page.waitForTimeout(200);
await selectLine();
await page.locator('#etbProtectBtn').click();
await page.waitForTimeout(250);
check('protecting the same phrase twice says so instead of doing nothing',
    /ya está protegida|already protected/i.test(await vaultStatus()), await vaultStatus());
check('and does not duplicate the entry', (await stored()).length === 1);

// ── 6. Persistence + the Voice Polish route + other genres ──
console.log('persistence, polish route, genres');
await page.reload();
await page.waitForTimeout(1300);
check('protected phrases survive a reload', (await stored()).length === 1);
check('and are re-rendered in the vault',
    (await page.locator('#vaultPhraseList .vault-phrase').count()) === 1);

await boot(null, 8);
await selectLine();
await page.evaluate(() => { try { injectVoicePolishCard(); } catch (e) {} });
await page.waitForTimeout(200);
const protectRoute = page.locator('.vp-route-protect');
if (await protectRoute.count()) {
    await protectRoute.click();
    await page.waitForTimeout(250);
    check('the Voice Polish "Protect this phrase" button protects the selection',
        (await stored()).length === 1, JSON.stringify(await stored()));
} else {
    check('the Voice Polish "Protect this phrase" button exists', false, 'route button not found');
}

for (const assignment of ['college-personal-statement', 'stem-lab-report', 'graduate-sop']) {
    await boot(assignment, 8);
    await selectLine();
    await page.locator('#passageCoachMenu [data-passage-action="protect"]').click();
    await page.waitForTimeout(250);
    check(`${assignment}: protection works in this genre`, (await stored()).length === 1);
}

check('no page errors during the whole vault walk', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));

await browser.close();
console.log(`\n${failed === 0 ? '✅' : '❌'} voice vault: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
