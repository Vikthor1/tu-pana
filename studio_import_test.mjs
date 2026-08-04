// Writing Studio migration candidate — bounded legacy-work import.
// Preview-first, exact text, truthful provenance, no silent overwrite, rollback.
// Requires this worktree at http://127.0.0.1:3001.
import { chromium } from 'playwright';

const ORIGIN = 'http://127.0.0.1:3001';
const KEY = 'tupana-studio:v1';
const browser = await chromium.launch({ headless: true });
let passed = 0;
let failed = 0;
const check = (label, condition, detail = '') => {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
    if (ok) passed++; else failed++;
};

const LEGACY_DRAFT = 'Mi primer borrador guardado — “aquí escuchamos primero” carries the history.';
const LEGACY_S8 = 'A genuinely revised stage-8 text with new wording the first draft lacks.';
const LEGACY_FIXTURE = {
    tupana_draft: LEGACY_DRAFT,
    tupana_draft_saved: 'true',
    tupana_writing_s6: LEGACY_DRAFT,           // byte-identical seeded copy — must collapse
    tupana_writing_s7: LEGACY_DRAFT,           // byte-identical seeded copy — must collapse
    tupana_writing_s8: LEGACY_S8,
    tupana_protected: JSON.stringify([{ text: 'aquí escuchamos primero', id: 1, savedAt: '2026-07-20T10:00:00.000Z' }]),
    tupana_decisions: JSON.stringify([{ q: 'voice', choice: 'good', t: 1753000000000 }]),
    tupana_process_note: JSON.stringify({ q3: 'A legacy reflection answer.' }),
    tupana_mani_sentence: 'Mi trabajo es sobre el idioma porque el idioma es poder.',
    tupana_chatlog: JSON.stringify([{ text: 'hola', who: 'user', t: 1 }, { text: 'coach reply', who: 'bot', t: 2 }]),
    tupana_assignment_id: 'college-personal-statement',
};

const external = [];
const errors = [];
let page = null;
async function fresh() {
    if (page) await page.close();
    page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    page.setDefaultTimeout(8000);
    page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`${ORIGIN}/studio.html`);
    await page.evaluate(({ key, fixture }) => {
        localStorage.removeItem(key);
        for (const [legacyKey, value] of Object.entries(fixture)) localStorage.setItem(legacyKey, value);
    }, { key: KEY, fixture: LEGACY_FIXTURE });
    await page.reload();
}
const stored = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), KEY);
const legacySnapshot = () => page.evaluate(keys => Object.fromEntries(keys.map(k => [k, localStorage.getItem(k)])), Object.keys(LEGACY_FIXTURE));

console.log('\nPreview truth');
await fresh();
await page.locator('[data-action="settings"]').first().click();
await page.locator('[data-action="legacy-import"]').click();
const preview = await page.locator('.dialog').textContent();
check('preview collapses byte-identical seeded stage copies', /identical copies collapsed/.test(preview) && /tupana_writing_s6, tupana_writing_s7/.test(preview));
check('preview labels buffer snapshots date-not-recorded', /date not recorded|fecha no registrada/i.test(preview));
check('preview says the chat log is deliberately not imported', /Coach conversation \(2 messages\)/.test(preview) && /no chat column/.test(preview));
check('preview treats the legacy first-draft flag as a fact, not completion', /does not mark anything finished/.test(preview));
check('preview surfaces the remembered assignment as a suggestion only', /not switched automatically/.test(preview));
check('preview shows the exact Voice entry', preview.includes('aquí escuchamos primero'));

console.log('\nCancel is lossless');
await page.locator('[data-action="close-dialog"]').first().click();
let record = await stored();
check('cancel imports nothing', !record?.legacyImport && (record?.versions?.length || 0) === 0 && (record?.voiceEntries?.length || 0) === 0);

console.log('\nApply maps truthfully');
await page.locator('[data-action="settings"]').first().click();
await page.locator('[data-action="legacy-import"]').click();
await page.locator('[data-action="legacy-import-apply"]').click();
record = await stored();
check('legacy saved draft becomes the live draft byte-exactly (studio draft was empty)', record.draft === LEGACY_DRAFT);
check('distinct revised buffer becomes an exact snapshot with truthful provenance', record.versions.some(v => v.text === LEGACY_S8 && v.legacyImport && v.dateNotRecorded && /tupana_writing_s8/.test(v.reason)));
check('collapsed copies produce no duplicate snapshots', record.versions.filter(v => v.text === LEGACY_DRAFT).length === 0 && record.versions.length === 1);
check('Voice entry imports exact text with its real legacy date', record.voiceEntries.some(v => v.text === 'aquí escuchamos primero' && v.protectedAt === '2026-07-20T10:00:00.000Z' && v.legacyImport));
check('legacy reflection stays read-only evidence, never pre-filling Studio reflection', record.reflections.changed === '' && record.legacyImport.records.processNote.q3 === 'A legacy reflection answer.');
check('no completion, packet, or finish state is manufactured', !record.packetCreatedAt && record.packetDraft === '' && !record.finishChecks?.connection);
check('import facts include the authorship-gate fact and decision count', record.legacyImport.facts.some(f => f.includes('first-draft save')) && record.legacyImport.facts.some(f => f.includes('1 legacy revision decisions')));
check('a restorable pre-import snapshot is stored', typeof record.legacyImport.preImportSnapshot === 'string' && record.legacyImport.preImportSnapshot.length > 2);

console.log('\nLegacy record is untouched (read-only adapter)');
const legacyAfter = await legacySnapshot();
check('every legacy key survives byte-exactly', Object.entries(LEGACY_FIXTURE).every(([k, v]) => legacyAfter[k] === v));

console.log('\nRollback');
await page.locator('[data-action="settings"]').first().click();
await page.locator('[data-action="legacy-import-restore"]').click();
record = await stored();
check('restore returns the exact pre-import record', !record.legacyImport && record.draft === '' && record.versions.length === 0 && record.voiceEntries.length === 0);
check('restore leaves legacy keys untouched too', await legacySnapshot().then(after => Object.entries(LEGACY_FIXTURE).every(([k, v]) => after[k] === v)));

console.log('\nNo silent overwrite when the Studio draft has content');
await fresh();
const STUDIO_DRAFT = 'Existing Studio work that must never be replaced silently.';
await page.locator('#draftEditor').fill(STUDIO_DRAFT);
await page.waitForTimeout(240);
await page.locator('[data-action="settings"]').first().click();
await page.locator('[data-action="legacy-import"]').click();
check('preview states the existing draft is preserved', /nothing is overwritten|nada se sobrescribe/i.test(await page.locator('.dialog').textContent()));
await page.locator('[data-action="legacy-import-apply"]').click();
record = await stored();
check('existing Studio draft survives byte-exactly', record.draft === STUDIO_DRAFT);
check('legacy draft arrives as a recoverable snapshot instead', record.versions.some(v => v.text === LEGACY_DRAFT && v.legacyImport));

console.log('\nEmpty-browser truthfulness');
if (page) await page.close();
page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
page.on('pageerror', error => errors.push(String(error)));
await page.goto(`${ORIGIN}/studio.html`);
await page.locator('[data-action="settings"]').first().click();
await page.locator('[data-action="legacy-import"]').click();
check('with no legacy work the preview says so and changes nothing', /No legacy Writing Studio work was found|No se encontró trabajo/.test(await page.locator('.dialog').textContent()));

console.log('\nIsolation');
check('no external requests during import flows', external.length === 0, external.join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
