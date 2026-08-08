// A3 — truthful processor and data-treatment disclosure.
//
// Three tiers, all rendered through the C1-core bilingual primitive:
//   1. a short consent-time line in both consent dialogs;
//   2. an expandable "What happens to my writing?" at the consent moment;
//   3. a fuller Help explanation.
//
// The content constraints are founder rulings, not style preferences, so they
// are asserted as hard boundaries: Google Gemini is named, NO zero-retention
// claim is made, NO geographic claim is made in either direction, the writing
// is never implied to stay inside Tu Pana, and live and mock are distinguished
// truthfully.
//
// It also pins the EXACT-PREVIEW claim the disclosure makes — that the request
// carries the previewed writing plus explicitly attached content and nothing
// else from the draft — by capturing the payload the app actually builds.
//
// Zero live AI calls: `provider=gemini` selects live COPY only and is never
// submitted; the submit path runs on the deterministic mock.
//
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

const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const external = [];
const errors = [];
page.on('request', request => { if (!request.url().startsWith(`${ORIGIN}/`)) external.push(request.url()); });
page.on('pageerror', error => errors.push(String(error)));

const PARA_A = 'My grandmother sold pasteles on the corner of Southern Boulevard for eleven years.';
const PARA_B = 'ZEBRAFISH_MARKER the second paragraph is deliberately distinctive so its absence can be proven.';

async function fresh(lang = "en", provider = "gemini") {
    await page.goto(`${ORIGIN}/studio.html`);
    await page.evaluate(key => {
        localStorage.removeItem(key);
        localStorage.setItem('tupana-studio:tour:v1', JSON.stringify({ v: 2, dismissedAt: '2026-01-01T00:00:00.000Z' }));
        localStorage.setItem('tupana_draft', 'R0 DISCLOSURE SENTINEL');

    }, KEY);
    await page.goto(`${ORIGIN}/studio.html?assignment=college-personal-statement&provider=${provider}`);
    await page.locator('.prototype-actions [data-action="language"]').selectOption(lang);
    await page.waitForTimeout(150);
}

async function openReviewConsent(scope = 'full') {
    await page.locator('#draftEditor').fill(`${PARA_A}\n\n${PARA_B}`);
    await page.waitForTimeout(300);
    await page.locator('[data-action="focused-review"]').click();
    await page.waitForTimeout(250);
    await page.locator(`input[name="reviewScope"][value="${scope}"]`).check();
    await page.waitForTimeout(200);
}

const dialogText = () => page.locator('.dialog').first().textContent();

// ── 1. Tier 1: the consent-time line ────────────────────────────────────────
console.log('\n1. Tier 1 — the consent-time data-path line');
await fresh('en', 'gemini');
await openReviewConsent();
let text = await page.locator('.consent-box').first().textContent();
check('names Google Gemini at the consent moment', /Google Gemini/.test(text));
check('names the transit path rather than implying the writing stays in Tu Pana',
    /travels from your browser through Tu Pana’s coach service to Google Gemini/.test(text));
check('says Gemini generates the coaching feedback, not the writing',
    /which generates the coaching feedback/.test(text) && !/writes (your|the student)/i.test(text));
check('states the service is not designed to store or log the writing',
    /not designed to store or log your writing/.test(text));
check('the consent line stays short at the consent moment', text.length < 420, `${text.length} chars`);

console.log('\n   Council consent dialog carries the same line');
await page.locator('[data-action="close-dialog"]').first().click();
await page.waitForTimeout(150);
await page.locator('[data-action="council"]').first().click();
await page.waitForTimeout(300);
const councilText = await dialogText();
check('Council consent names Google Gemini', /Google Gemini/.test(councilText));
check('Council consent carries the same data-path sentence',
    /travels from your browser through Tu Pana’s coach service to Google Gemini/.test(councilText));
check('Council consent carries the expandable disclosure', await page.locator('.a3-disclosure').count() >= 1);

// ── 2. Tier 2: the expandable ───────────────────────────────────────────────
console.log('\n2. Tier 2 — the expandable "What happens to my writing?"');
await fresh('en', 'gemini');
await openReviewConsent();
check('the expandable is present at the consent moment', await page.locator('.a3-disclosure').count() === 1);
check('it is collapsed by default, keeping consent calm',
    await page.locator('.a3-disclosure').first().evaluate(el => !el.open));
const summary = await page.locator('.a3-disclosure summary').first().textContent();
check('its summary asks the student\'s question', /What happens to my writing\?/.test(summary));
await page.locator('.a3-disclosure summary').first().click();
await page.waitForTimeout(120);
const disclosure = await page.locator('.a3-disclosure').first().textContent();

// Refinement B (2026-08-08) — this tier is now TWO layers. The 1E founder
// review found the copy accurate but too long and too architectural to be the
// first thing a student reads while deciding whether to consent. Nothing was
// dropped from the product: each fact below is asserted at the layer where it
// now lives, and the layers themselves are asserted to be reachable. The eight
// assertions that used to live in this block are RELOCATED, not removed —
// four to the secondary layer immediately below, four to Tier 3 in section 3 —
// and the primary layer gains a boundary check that they are not there.
const primary = await page.locator('.a3-disclosure > .a3-disclosure-list').first().textContent();
console.log('\n2a. Primary layer — what a student needs in order to consent');
check('drafts are described as browser-local', /stay in this browser on this device/.test(primary));
check('the AI boundary is stated as a choice the student makes',
    /Nothing is sent to AI unless you choose to request feedback/.test(primary));
check('the consent preview promise is made before sending',
    /Before sending, you will see exactly which portion of your writing/.test(primary));
check('attached notes are named as part of what is shared',
    /any notes you chose to attach \u2014 will be shared/.test(primary));
check('nothing else from the draft is included', /No other part of your draft is included/.test(primary));
check('Google Gemini is named in the primary layer, not buried',
    /sent to Google Gemini to generate the feedback/.test(primary));
check('Gemini is said to generate the feedback, never the writing',
    !/(writes|generates) (your|the student\u2019s) (writing|draft)/i.test(primary));
check('AI is stated to be optional', /without using AI at all/.test(primary));
check('the primary layer is short enough to read at the consent moment',
    primary.length < 700, `${primary.length} chars`);

console.log('\n2b. Primary layer carries no architectural vocabulary');
// This is a comprehension boundary, not obscurity: every phrase below is still
// asserted verbatim in Tier 3 (section 3). It must not be in the layer a
// student reads while deciding.
for (const phrase of ['Cloudflare Worker', 'CPU time', 'tracing', 'export', 'endpoint', 'Worker']) {
    check(`primary layer omits "${phrase}"`, !primary.includes(phrase));
}

console.log('\n2c. Secondary layer — "More about privacy and processing"');
check('a secondary disclosure exists', await page.locator('.a3-disclosure .a3-more').count() === 1);
check('it is collapsed by default', await page.locator('.a3-more').first().evaluate(el => !el.open));
check('its summary names privacy and processing',
    /More about privacy and processing/.test((await page.locator('.a3-more > summary').first().textContent()) || ''));
check('its summary is keyboard reachable and operable',
    await page.locator('.a3-more > summary').first().evaluate(el => {
        el.focus();
        return document.activeElement === el;
    }));
await page.locator('.a3-more > summary').first().click();
await page.waitForTimeout(120);
check('activating it by keyboard-equivalent opens it', await page.locator('.a3-more').first().evaluate(el => el.open));
const secondary = await page.locator('.a3-more .a3-disclosure-list').first().textContent();
check('the relay hop is named without architecture vocabulary',
    /Cloudflare relays the approved request and Google Gemini generates the feedback/.test(secondary));
check('the no-store, no-log posture is stated', /not designed to store or log your writing/.test(secondary));
check('content-free aggregate retention is disclosed, not hidden',
    /Content-free aggregate operational information may be retained/.test(secondary));
check('the paid-terms position is stated', /Google does not use prompts or responses to improve its products/.test(secondary));
check('temporary abuse-monitoring retention is disclosed',
    /temporarily retain prompts and responses for abuse monitoring/.test(secondary));
check('technical operating processing is disclosed',
    /processes technical information required to operate the service/.test(secondary));
check('it explicitly refuses a zero-retention promise', /This is not a zero-retention promise/.test(secondary));
check('the qualification is not weakened into a guarantee',
    !/(never|not) retained|no retention|nothing is kept/i.test(secondary));
check('the whole tier still refuses a zero-retention promise', /This is not a zero-retention promise/.test(disclosure));

// ── 3. Tier 3: the Help explanation ─────────────────────────────────────────
console.log('\n3. Tier 3 — the fuller Help explanation');
await fresh('en', 'gemini');
await page.locator('[data-action="help"]').first().click();
await page.waitForTimeout(250);
check('Help offers the disclosure route', await page.locator('[data-action="help-disclosure"]').count() === 1);
await page.locator('[data-action="help-disclosure"]').click();
await page.waitForTimeout(250);
const help = await dialogText();
for (const heading of ['While you write', 'When you ask for AI help', 'Storage and logging',
    'How Google handles the request', 'What we do not claim', 'What you control']) {
    check(`Help section present: ${heading}`, help.includes(heading));
}
check('browser-storage deletion is described precisely',
    /deletes the copy kept by this browser. That copy cannot be recovered unless you previously created a backup/.test(help));
check('Help names Google Gemini', /Google Gemini/.test(help));
check('Help refuses a zero-retention promise', /This is not a zero-retention promise/.test(help));
check('Help states platform processing is outside Tu Pana\'s configuration',
    /Google and Cloudflare may also perform their own platform processing under their applicable terms/.test(help));

// RELOCATED FROM TIER 2 by Refinement B. These are the full technical account,
// and Tier 3 is where the full technical account belongs. Each was asserted in
// the tier-2 block before 2026-08-08 and is asserted here now, verbatim and
// unweakened, so the simplification provably lost no disclosed fact.
check('Help states no AI processing happens while typing',
    /does not send your writing for AI processing while you type/.test(help));
check('Help describes the request composition exactly',
    /includes the portion of your writing and any other content you explicitly chose to attach, all shown in the consent preview/.test(help));
check('Help discloses the coaching instructions as part of the request',
    /the instructions Tu Pana needs to provide genre-specific coaching/.test(help));
check('Help names the Cloudflare Worker hop', /runs as a Cloudflare Worker/.test(help));
check('Help states logging, tracing and export are disabled',
    /content logging, tracing, and export are disabled/.test(help));
check('Help discloses the content-free aggregate metrics by name',
    /content-free aggregate operational metrics such as request counts, errors, and CPU time/.test(help));
check('Help discloses temporary abuse-monitoring logging',
    /temporarily log prompts and responses for abuse monitoring/.test(help));
check('Help discloses technical usage processing',
    /technical usage information needed to operate and maintain the service/.test(help));

// ── 4. Hard content boundaries ──────────────────────────────────────────────
console.log('\n4. Founder-ruled content boundaries');
const allCopy = `${disclosure}\n${help}`;
check('no model version is named anywhere in the disclosure',
    !/2\.5|Flash-Lite|Flash\b|Pro\b/.test(allCopy), (allCopy.match(/2\.5|Flash-Lite|Flash\b|Pro\b/) || [''])[0]);
check('no affirmative zero-retention claim',
    !/(never|not) (retained|stored) anywhere|nothing is ever (kept|stored|retained)|zero retention(?! promise)/i.test(allCopy));
check('no claim that writing never leaves the device once live',
    !/never leaves (this|your) (device|browser)/i.test(disclosure));
// The disclaimer sentence itself contains BOTH "country" and "region", so each
// occurrence of it accounts for two geographic words. Any excess means a
// geographic claim was made somewhere else.
check('the only geographic mention is the explicit disclaimer',
    (allCopy.match(/countr(y|ies)|region/gi) || []).length
    === (allCopy.match(/in a particular country or region/gi) || []).length * 2);
check('no jurisdiction is named', !/United States|Europe|European Union|\bEU\b|Ireland|Iowa/i.test(allCopy));
check('does not claim the writing stays inside Tu Pana',
    !/stays (inside|within) Tu Pana|only Tu Pana (sees|receives)/i.test(allCopy));

console.log('\n4b. Bilingual markup survives the new layer');
await fresh('both', 'gemini');
await openReviewConsent();
await page.locator('.a3-disclosure summary').first().click();
await page.locator('.a3-more > summary').first().click();
await page.waitForTimeout(150);
const langMarkup = await page.evaluate(() => {
    const scope = document.querySelector('.a3-more .a3-disclosure-list');
    const items = [...scope.querySelectorAll('li')];
    return {
        items: items.length,
        everyItemAttributed: items.every(li =>
            li.querySelector('span[lang="es"]') && li.querySelector('span[lang="en"]')),
        separatorsHidden: [...scope.querySelectorAll('span[aria-hidden="true"]')].every(el => el.textContent.includes('\u00b7')),
        noLooseText: items.every(li => !/[A-Za-z]/.test([...li.childNodes]
            .filter(n => n.nodeType === 3).map(n => n.textContent).join(''))),
    };
});
check('every secondary item carries both attributed language runs',
    langMarkup.items === 4 && langMarkup.everyItemAttributed, JSON.stringify(langMarkup));
check('the separator stays hidden from assistive technology', langMarkup.separatorsHidden);
check('no unattributed text leaks between the language runs', langMarkup.noLooseText);

console.log('\n   Mock mode is distinguished truthfully');
await fresh('en', 'mock');
await openReviewConsent();
await page.locator('.a3-disclosure summary').first().click();
await page.waitForTimeout(120);
const mockDisclosure = await page.locator('.a3-disclosure').first().textContent();
check('mock says the writing is not sent for AI processing',
    /Your writing is not sent for AI processing/.test(mockDisclosure));
check('mock names both endpoints it does not call',
    /No request is made to Tu Pana’s coach service or to an AI provider/.test(mockDisclosure));
check('mock still tells the truth about what live mode would do',
    /connected to the live coach service, the writing you consent to send travels to Google Gemini/.test(mockDisclosure));
check('mock does not claim a live data path is happening now',
    /This copy is not connected/.test(mockDisclosure));
check('mock avoids the live-only paid-terms paragraph', !/paid Gemini terms/.test(mockDisclosure));

// ── 5. The exact-preview claim, verified against the built payload ──────────
console.log('\n5. The exact-preview claim is true of the payload the app builds');
await fresh('en', 'mock');
// Wrap the prompt builders to capture exactly what the app hands the provider.
// This observes; it does not alter the payload or the product path.
await page.evaluate(() => {
    window.__payloads = [];
    const provider = window.StudioProvider;
    for (const name of ['buildPassagePrompt', 'buildFullDraftPrompt']) {
        const original = provider[name];
        provider[name] = payload => { window.__payloads.push({ name, payload }); return original(payload); };
    }
});
await openReviewConsent('paragraph');
const previewed = await page.locator('#scopePreview').textContent();
check('the consent dialog shows an exact preview of the scope', previewed.length > 0);
// Paragraph scope previews the paragraph at the cursor. Whichever one that is,
// the OTHER must never travel — that is the claim under test.
const withheld = previewed.includes('ZEBRAFISH_MARKER') ? PARA_A : PARA_B;
check('the preview shows one paragraph, not the whole draft',
    !(previewed.includes(PARA_A) && previewed.includes(PARA_B)));
check('the preview excludes the paragraph that will not be sent', !previewed.includes(withheld));
check('no Your Voice entry is attached by default',
    await page.locator('#includeVoiceEntries').count() === 0
    || !(await page.locator('#includeVoiceEntries').isChecked()));

await page.locator('#transmitConsent').check();
await page.locator('[data-action="submit-mock"]').click();
await page.waitForTimeout(800);
const captured = await page.evaluate(() => window.__payloads);
check('exactly one provider payload was built', captured.length === 1, `${captured.length}`);
const payload = captured[0]?.payload || {};
check('the transmitted text is exactly the previewed scope, byte for byte',
    payload.text === previewed, `sent ${JSON.stringify((payload.text || '').slice(0, 40))}`);
check('the unpreviewed paragraph is absent from the transmitted text', !(payload.text || '').includes(withheld));
check('no unattached Your Voice entry rides along', (payload.voiceEntries || []).length === 0);
check('no unattached Move note rides along', !payload.moveContext);
const builtPrompt = await page.evaluate(p => window.StudioProvider.buildPassagePrompt(p), payload);
check('the unpreviewed paragraph is absent from the entire built prompt', !builtPrompt.includes(withheld));
check('no STUDENT-PROTECTED VOICE block appears when nothing was attached',
    !/STUDENT-PROTECTED VOICE/.test(builtPrompt));
check('no STUDENT PLANNING CONTEXT block appears when nothing was attached',
    !/STUDENT PLANNING CONTEXT/.test(builtPrompt));
check('the prompt does carry the genre coaching instructions the disclosure describes',
    /GENRE GUIDANCE/.test(builtPrompt));
check('the prompt carries the universal authorship rule the disclosure relies on',
    /ABSOLUTE AUTHORSHIP RULE/.test(builtPrompt));

console.log('\n6. Isolation');
check('no external requests', external.length === 0, external.join(', '));
check('zero page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
console.log(`\n${passed}/${passed + failed} PASS${failed ? ` — ${failed} FAIL` : ''}`);
if (failed) process.exit(1);
