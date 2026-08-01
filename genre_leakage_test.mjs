// genre_leakage_test.mjs — cross-genre language alignment guard (founder finding 2026-08-01)
//
// "Some cards are still displaying language that belongs to the autobiographical
// essay layer." This suite renders the student-facing surfaces of EVERY genre
// mode — cards, buttons, checkpoints, celebrations, modals — and fails if any
// of them speaks another genre's language.
//
// Requires a local server on 127.0.0.1:3001 (node test-server.js).
import { chromium } from 'playwright';

const HOST = 'http://127.0.0.1:3001/';
const PROXY = 'https://tupana-gemini-proxy.dr-torres-velez.workers.dev/';

let passed = 0, failed = 0;
function check(label, condition, detail) {
    const ok = Boolean(condition);
    console.log(`  ${ok ? '✅' : '❌'} ${label}${ok || !detail ? '' : `\n       ↳ ${detail}`}`);
    if (ok) passed += 1; else failed += 1;
}

// ── Vocabulary that belongs to ONE genre and must not appear in the others ──
const AUTOBIO = [
    /anécdota/i, /anecdot/i, /autobiogr/i, /desalojo/i, /eviction/i,
    /tu historia/i, /mi historia/i, /your story/i, /my story/i, /this story/i,
];
const ESSAY_WORD   = [/\bensayos?\b/i, /\bessays?\b/i];
const MEMORY_WORD  = [/\brecuerdos?\b/i, /\bmemorias?\b/i, /\bmemory\b/i, /\bmemories\b/i];
const SCENE_WORD   = [/\bescenas?\b/i, /\bscenes?\b/i];
const BRONX        = [/South Bronx/i, /Bronx Beautiful/i];
const OTHER_GENRES = {
    lab:        [/lab report/i, /informe de laboratorio/i, /Claim–Evidence–Reasoning/i],
    service:    [/service-learning/i, /aprendizaje.servicio/i],
    admissions: [/admissions reader/i, /Common App/i],
    sop:        [/statement of purpose/i, /carta de propósito/i],
    research:   [/trabajo de investigación/i],
};

const GENRES = [
    {
        id: 'cap200-bronx-beautiful-service-learning', label: 'CAP 200 service learning',
        banned: [...AUTOBIO, ...ESSAY_WORD, ...MEMORY_WORD, ...SCENE_WORD,
                 ...OTHER_GENRES.lab, ...OTHER_GENRES.admissions, ...OTHER_GENRES.sop],
    },
    {
        id: 'cap-200-first-draft', label: 'CAP 200 first draft (profile-less layer)',
        banned: [...AUTOBIO, ...ESSAY_WORD, ...MEMORY_WORD, ...SCENE_WORD,
                 ...OTHER_GENRES.lab, ...OTHER_GENRES.admissions, ...OTHER_GENRES.sop],
    },
    {
        id: 'research-paper', label: 'research paper',
        banned: [...AUTOBIO, ...ESSAY_WORD, ...MEMORY_WORD, ...SCENE_WORD, ...BRONX,
                 ...OTHER_GENRES.lab, ...OTHER_GENRES.service, ...OTHER_GENRES.admissions, ...OTHER_GENRES.sop],
    },
    {
        id: 'stem-lab-report', label: 'STEM lab report',
        banned: [...AUTOBIO, ...ESSAY_WORD, ...MEMORY_WORD, ...SCENE_WORD, ...BRONX,
                 ...OTHER_GENRES.service, ...OTHER_GENRES.admissions, ...OTHER_GENRES.sop],
    },
    {
        // A personal statement IS an essay about the writer's own story, so the
        // narrative vocabulary is native here. Other genres' vocabulary is not.
        id: 'college-personal-statement', label: 'college personal statement',
        banned: [/autobiogr/i, /desalojo/i, /eviction/i, ...BRONX,
                 ...OTHER_GENRES.lab, ...OTHER_GENRES.service, ...OTHER_GENRES.sop, ...OTHER_GENRES.research],
    },
    {
        id: 'graduate-sop', label: 'graduate statement of purpose',
        banned: [...AUTOBIO, ...MEMORY_WORD, ...SCENE_WORD, ...BRONX,
                 ...OTHER_GENRES.lab, ...OTHER_GENRES.service, ...OTHER_GENRES.admissions],
    },
];

const DRAFT = [
    'El primer paso de mi trabajo fue registrar lo que observe con cuidado durante tres semanas.',
    'Los datos que reuni muestran un patron que todavia estoy tratando de explicar con precision.',
    'Mi conclusion provisional conecta ese patron con lo que discutimos en clase sobre el tema.',
].join('\n');

const browser = await chromium.launch({ headless: true });

async function boot(page, assignment, stage) {
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
        localStorage.setItem('tupana_skills_acquired',
            JSON.stringify(['memory_to_scene', 'experience_to_force', 'naming_tension', 'author_owned_draft']));
    }, [DRAFT, stage]);
    await page.reload();
    await page.waitForTimeout(900);
}

// Render every student-facing surface reachable at this stage and return its text.
async function harvest(page, stage) {
    return await page.evaluate((st) => {
        const out = [];
        const push = (where, node) => {
            if (!node) return;
            const txt = (node.innerText || node.textContent || '').trim();
            if (txt) out.push({ where, txt });
        };
        // Persistent chrome: task bar, journey map, badges, progress, footer.
        push('task bar', document.getElementById('currentTaskBar'));
        push('journey map', document.getElementById('journeyMap'));
        push('badge strip', document.getElementById('badgeStrip'));
        push('draft footer', document.querySelector('.draft-footer'));
        push('five questions strip', document.getElementById('fiveQStrip'));
        push('draft placeholder', { textContent: document.getElementById('draftArea')?.placeholder || '' });
        push('continue button', document.getElementById('continueBtn'));
        push('back button', document.getElementById('backBtn'));
        push('prior work strip', document.getElementById('priorWorkStrip'));

        // Coach cards for this stage (injected directly — no live model needed).
        // Injector failures are reported, not swallowed: a card that throws
        // renders nothing, which would look like "no leakage" here.
        const thrown = [];
        const run = (name, fn) => { try { fn(); } catch (e) { thrown.push(`${name}: ${e && e.message}`); } };
        const chat = document.getElementById('chatMessages');
        if (chat) {
            run('injectStageEntryWelcome', () => injectStageEntryWelcome(st));
            run('injectPanaHint', () => injectPanaHint(st));
            run('injectFollowupPanel', () => injectFollowupPanel());
            run('showStuckMini', () => showStuckMini());
            if (st === 4) run('injectResearchCard', () => injectResearchCard());
            if (st === 7) run('injectRevisionPanel', () => injectRevisionPanel(st));
            if (st === 8) run('injectVoicePolishCard', () => injectVoicePolishCard());
            if (st >= 7 && st <= 9) run('injectVoiceVaultPanel', () => injectVoiceVaultPanel());
            if (st === 10) run('injectCapstonePanel', () => injectCapstonePanel());
            push('coach cards', chat);
            push('voice vault', document.getElementById('voiceVault'));
            push('capstone modal', document.getElementById('capstoneModalBody'));
        }

        // Celebrations + checkpoints.
        try { showPhaseCelebration(st); } catch (e) {}
        push('phase celebration', document.getElementById('phaseToast'));
        try {
            const cp = (typeof REFLECTION_CHECKPOINTS !== 'undefined')
                && REFLECTION_CHECKPOINTS.find(c => c.stageId === st);
            if (cp) openReflectionCheckpoint(cp);
        } catch (e) {}
        push('reflection checkpoint', document.querySelector('.reflect-modal-bg, #reflectModal, .reflection-checkpoint'));
        try { showSkillToast(skillLabelFor(STAGE_SKILL_DEFS.find(s => s.stageNum === st))); } catch (e) {}
        push('skill toast', document.querySelector('.skill-toast'));

        // Modals: stage preview (next stage), toolkit, my-work hub.
        try { if (st < 10) showStagePreview(st + 1); } catch (e) {}
        push('stage preview', document.getElementById('stagePreviewBg'));
        try { dismissStagePreview(); } catch (e) {}
        try { openToolkitPanel(); } catch (e) {}
        push('toolkit', document.getElementById('toolkitModal'));
        try { document.getElementById('toolkitModal')?.remove(); } catch (e) {}
        run('openReport', () => openReport('work'));
        push('my work hub', document.getElementById('reportBg'));
        if (thrown.length) out.push({ where: '__thrown__', txt: thrown.join(' | ') });
        return out;
    }, stage);
}

for (const genre of GENRES) {
    console.log(`\n═══ ${genre.label} (${genre.id}) ═══`);
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await page.route(PROXY, r => r.fulfill({
        status: 200, contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ text: 'ok', truncated: false })
    }));

    const hits = [], thrownAll = [];
    for (const stage of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
        await boot(page, genre.id, stage);
        const surfaces = await harvest(page, stage);
        for (const s of surfaces) {
            if (s.where === '__thrown__') { thrownAll.push(`stage ${stage}: ${s.txt}`); continue; }
            for (const rx of genre.banned) {
                const m = s.txt.match(rx);
                if (m) {
                    const i = s.txt.indexOf(m[0]);
                    hits.push(`stage ${stage} · ${s.where} · "${m[0]}" — …${s.txt.slice(Math.max(0, i - 45), i + 55).replace(/\s+/g, ' ')}…`);
                }
            }
        }
    }
    const unique = [...new Set(hits)];
    check(`${genre.label}: no foreign-genre language on any rendered surface`,
        unique.length === 0, unique.slice(0, 8).join('\n       ↳ '));
    check(`${genre.label}: no page errors while rendering every surface`,
        pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
    check(`${genre.label}: every card renders without throwing`,
        thrownAll.length === 0, thrownAll.slice(0, 5).join('\n       ↳ '));
    await page.close();
}

// ── The default genre must KEEP its own voice (no over-neutralization) ──
console.log('\n═══ default autobiographical essay (must be unchanged) ═══');
{
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await boot(page, null, 1);
    const text = (await harvest(page, 1)).map(s => s.txt).join('\n');
    check('default keeps its anecdote framing', /anécdota|anecdote/i.test(text));
    const defaultExample = await page.evaluate(() => {
        showStagePreview(1);
        const box = document.getElementById('previewExampleBox');
        const txt = document.getElementById('previewExampleText').textContent;
        dismissStagePreview();
        return { hidden: box.hasAttribute('hidden'), txt };
    });
    check('default keeps its worked example in the stage preview',
        !defaultExample.hidden && /desalojo|eviction letter/i.test(defaultExample.txt),
        JSON.stringify(defaultExample).slice(0, 160));
    const layeredExample = await (async () => {
        await boot(page, 'stem-lab-report', 1);
        return page.evaluate(() => {
            showStagePreview(1);
            const hidden = document.getElementById('previewExampleBox').hasAttribute('hidden');
            const txt = document.getElementById('previewExampleText').textContent;
            dismissStagePreview();
            return { hidden, txt };
        });
    })();
    check('a layered genre shows no worked example rather than another genre\'s',
        layeredExample.hidden && !/desalojo|eviction/i.test(layeredExample.txt),
        JSON.stringify(layeredExample).slice(0, 160));
    await boot(page, null, 3);
    const t3 = (await harvest(page, 3)).map(s => s.txt).join('\n');
    check('default keeps its essay vocabulary', /ensayo|essay/i.test(t3));
    await page.close();
}

// ── The work noun follows the genre ──
console.log('\n═══ work-noun resolution ═══');
{
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const expected = {
        null: 'essay',
        'stem-lab-report': 'lab report',
        'graduate-sop': 'statement of purpose',
        'research-paper': 'research paper',
        'cap200-bronx-beautiful-service-learning': 'report',
        'college-personal-statement': 'personal essay',
    };
    for (const [id, noun] of Object.entries(expected)) {
        const assignment = id === 'null' ? null : id;
        await boot(page, assignment, 3);
        const got = await page.evaluate(() => getWorkNoun(state.assignmentId).en);
        check(`work noun for ${assignment || 'default'} is "${noun}"`, got === noun, `got "${got}"`);
    }
    // Tokens must never reach the student.
    await boot(page, 'stem-lab-report', 3);
    const raw = await page.evaluate(() => {
        try { showStuckMini(); } catch (e) {}
        try { injectPanaHint(3); } catch (e) {}
        try { injectFollowupPanel(); } catch (e) {}
        return document.getElementById('chatMessages').innerText;
    });
    check('no unresolved {workEs}/{workEn} tokens are rendered', !/\{work(Es|En)\}/.test(raw));
    check('lab report genre says "lab report" in its coaching cards', /lab report|informe de laboratorio/i.test(raw));
    await page.close();
}

await browser.close();
console.log(`\n${failed === 0 ? '✅' : '❌'} genre leakage: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
