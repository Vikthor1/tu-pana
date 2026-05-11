// Tu Pana de Escritura — ui.js
// All DOM state and rendering: state object, DOM cache (D), tone/lang toggles, journey map,
// draft panel, edit toolbar, chat messages, DirectLine, capstone, report, spotlight, and more.


// ════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════
const state = {
    stage:      1,
    done:       new Set(),
    draftSaved: false,
    connected:  false,
    waiting:    false,
    convId:     null,
    token:      null,
    watermark:  null,
    pollTimer:  null,
    showAllJourney: false,
    tone:       'gentle',  // 'gentle' | 'direct'
    lang:       'es',      // 'es' | 'en' | 'both'
    coachMode:  localStorage.getItem('tupana_coach_mode') || 'gemini',   // 'offline' | 'ollama' | 'gemini'
    coachPerspectiveCallback: null,
    step:       1,
    welcomeShown:    false,
    offlineMsgShown: false,
    spotlightTarget:        null,   // 'coach' | 'editor' | null
    spotlightStageId:       null,
    pendingSpotlightStageId: null,  // deferred when a phase toast is showing
    draftFocus:             false
};

// ════════════════════════════════════════════════════════
//  DOM
// ════════════════════════════════════════════════════════
const el = id => document.getElementById(id);
const D = {
    setupBanner:  el('setupBanner'),
    journeyTrack: el('journeyTrack'),
    journeyToggle:     el('journeyToggle'),
    journeyToggleText: el('journeyToggleText'),

    headerSub:    el('headerSub'),
    wordCount:    el('wordCount'),
    draftArea:    el('draftArea'),
    saveBtn:      el('saveBtn'),
    saveBtnLabel: el('saveBtnLabel'),
    savedNotice:  el('savedNotice'),
    continueBtn:  el('continueBtn'),
    chatMessages: el('chatMessages'),
    typingRow:    el('typingRow'),
    chatInput:    el('chatInput'),
    sendBtn:      el('sendBtn'),
    stuckBtn:     el('stuckBtn'),
    stuckTriage:  el('stuckTriage'),
    chatStatus:   el('chatStatus'),
    badgeStrip:   el('badgeStrip'),
    streakBar:    el('streakBar'),
    chatProgress:      el('chatProgress'),
    chatProgressToggle: el('chatProgressToggle'),
    chatProgressToggleText: el('chatProgressToggleText'),
    chatProgressBody:  el('chatProgressBody'),
    phaseToast:   el('phaseToast'),
    phaseToastBadge: el('phaseToastBadge'),
    phaseToastTitle: el('phaseToastTitle'),
    phaseToastBody:  el('phaseToastBody'),
    tooltip:      el('tooltip'),
    modalBg:      el('modalBg'),
    modalClose:   el('modalClose'),
    stagePreviewBg:       el('stagePreviewBg'),
    previewStageNum:      el('previewStageNum'),
    previewTitle:         el('previewTitle'),
    previewSubtitle:      el('previewSubtitle'),
    previewDesc:          el('previewDesc'),
    previewCompleted:     el('previewCompleted'),
    previewCompletedText: el('previewCompletedText'),
    previewCtaLabel:      el('previewCtaLabel'),
    previewExampleBox:    el('previewExampleBox'),
    previewExampleText:   el('previewExampleText'),
    previewContinueBtn:   el('previewContinueBtn'),
    previewBackBtn:       el('previewBackBtn'),
    confirmBg:    el('confirmBg'),
    confirmCancel: el('confirmCancel'),
    confirmOk:    el('confirmOk'),
    toneToggle:       el('toneToggle'),
    toneToggleLabel:  el('toneToggleLabel'),
    pnModalBg:   el('pnModalBg'),
    pnModalBody: el('pnModalBody'),
    completionBg: el('completionBg')
};

// ════════════════════════════════════════════════════════
//  MOBILE PANEL TABS
// ════════════════════════════════════════════════════════
function switchMobileTab(panel) {
    const workspace = el('main');
    const tabDraft  = el('tabDraft');
    const tabChat   = el('tabChat');
    if (!workspace || !tabDraft || !tabChat) return;
    const toChat = panel === 'chat';
    workspace.classList.toggle('mobile-panel-chat', toChat);
    tabDraft.classList.toggle('mobile-tab-active', !toChat);
    tabChat.classList.toggle('mobile-tab-active', toChat);
    tabDraft.setAttribute('aria-selected', String(!toChat));
    tabChat.setAttribute('aria-selected', String(toChat));
    if (toChat) tabChat.classList.remove('has-notification');
}

// Called internally when the AI coach sends a message, to nudge student to look
function notifyMobileChat() {
    const tabChat   = el('tabChat');
    const workspace = el('main');
    if (!tabChat || !workspace) return;
    if (window.innerWidth <= 480 && !workspace.classList.contains('mobile-panel-chat')) {
        tabChat.classList.add('has-notification');
    }
}

// ════════════════════════════════════════════════════════
//  TONE TOGGLE
// ════════════════════════════════════════════════════════

// t(gentle, direct) — return text based on current tone setting
function t(gentle, direct) {
    return state.tone === 'direct' ? direct : gentle;
}

function toggleTone() {
    state.tone = state.tone === 'gentle' ? 'direct' : 'gentle';
    try { localStorage.setItem('tupana_tone', state.tone); } catch(e) {}
    if (D.toneToggleLabel) {
        D.toneToggleLabel.innerHTML = state.tone === 'direct'
            ? '<span class="show-es">Directo</span><span class="lang-sep"> · </span><span class="show-en">Direct</span>'
            : '<span class="show-es">Suave</span><span class="lang-sep"> · </span><span class="show-en">Gentle</span>';
    }
    if (D.toneToggle) {
        D.toneToggle.classList.toggle('direct', state.tone === 'direct');
        D.toneToggle.setAttribute('aria-pressed', state.tone === 'direct' ? 'true' : 'false');
    }
    const msg = state.tone === 'direct'
        ? 'Modo directo activado. Respuestas más concisas y orientadas a la tarea. · Direct mode on. Responses will be more concise and task-focused.'
        : 'Modo suave activado. Respuestas más lentas y reconfortantes. · Gentle mode on. Responses will be more reassuring and paced.';
    addSys(msg);
}

function initTone() {
    try {
        const saved = localStorage.getItem('tupana_tone');
        if (saved === 'direct' || saved === 'gentle') state.tone = saved;
    } catch(e) {}
    if (D.toneToggleLabel) {
        D.toneToggleLabel.innerHTML = state.tone === 'direct'
            ? '<span class="show-es">Directo</span><span class="lang-sep"> · </span><span class="show-en">Direct</span>'
            : '<span class="show-es">Suave</span><span class="lang-sep"> · </span><span class="show-en">Gentle</span>';
    }
    if (D.toneToggle) {
        D.toneToggle.classList.toggle('direct', state.tone === 'direct');
        D.toneToggle.setAttribute('aria-pressed', state.tone === 'direct' ? 'true' : 'false');
    }
}

function setLang(pref) {
    state.lang = pref;
    document.documentElement.dataset.lang = pref;
    try { localStorage.setItem('tupana_lang', pref); } catch(e) {}
    document.querySelectorAll('.lang-btn').forEach(b => {
        const active = b.dataset.lang === pref;
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    // Update html lang attribute for AT
    document.documentElement.lang = pref === 'en' ? 'en' : 'es';
}

function initLang() {
    try {
        const saved = localStorage.getItem('tupana_lang');
        if (saved === 'es' || saved === 'en' || saved === 'both') state.lang = saved;
    } catch(e) {}
    setLang(state.lang);
}

// ════════════════════════════════════════════════════════
//  VOICE VAULT — Stage 8 phrase protection system
// ════════════════════════════════════════════════════════
const PROTECTED_KEY = 'tupana_protected';

function loadProtected() {
    try { return JSON.parse(localStorage.getItem(PROTECTED_KEY) || '[]'); } catch(e) { return []; }
}
function saveProtected(arr) {
    try { localStorage.setItem(PROTECTED_KEY, JSON.stringify(arr)); } catch(e) {}
}

function injectVoiceVaultPanel() {
    if (document.getElementById('voiceVault')) return;
    const wrap = document.querySelector('.draft-textarea-wrap');
    if (!wrap) return;
    const vaultEl = document.createElement('details');
    vaultEl.className = 'voice-vault';
    vaultEl.id = 'voiceVault';
    vaultEl.setAttribute('open', '');
    vaultEl.innerHTML = `
        <summary>
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 1.5L2.5 4v4.5C2.5 11.7 5 14.2 8 15c3-0.8 5.5-3.3 5.5-6.5V4L8 1.5z"/><path d="M5.5 8.5l2 2 3-3"/></svg>
            <span class="show-es">Bóveda de voz</span><span class="lang-sep"> · </span><span class="show-en">Voice Vault</span>
            <span class="vault-count-badge empty" id="vaultCountBadge">0</span>
            <span class="vault-toggle-arrow" aria-hidden="true">▾</span>
        </summary>
        <div class="voice-vault-body">
            <p class="voice-vault-hint">
                <span class="show-es">Selecciona un fragmento en tu borrador, luego haz clic en <strong>Proteger</strong> en la barra de herramientas. El punto verde confirma que la frase sigue en tu borrador.</span>
                <span class="lang-sep"> · </span>
                <span class="show-en">Select a phrase in your draft, then click <strong>Protect</strong> in the toolbar. A green dot confirms the phrase is still in your draft.</span>
            </p>
            <div class="vault-phrase-list" id="vaultPhraseList" role="list" aria-label="Frases protegidas · Protected phrases">
                <div class="vault-empty"><span class="show-es">Aún no has protegido ninguna frase.</span><span class="lang-sep"> · </span><span class="show-en">No phrases protected yet.</span></div>
            </div>
        </div>`;
    wrap.insertAdjacentElement('afterend', vaultEl);
    renderVoiceVault();
}

function protectSelectedPhrase() {
    if (state.stage !== 8) return;
    const area = D.draftArea;
    const start = area.selectionStart, end = area.selectionEnd;
    if (start === end) return;
    const text = area.value.slice(start, end).trim();
    if (text.length < 3) {
        showEditStatus(t('Selecciona al menos 3 caracteres · Too short', 'Select at least 3 characters'));
        return;
    }
    if (text.length > 200) {
        showEditStatus(t('Frase demasiado larga · Too long', 'Phrase too long — choose something shorter'));
        return;
    }
    const phrases = loadProtected();
    if (phrases.some(p => p.text.toLowerCase() === text.toLowerCase())) {
        showEditStatus(t('Ya protegida · Already protected', 'Already protected'));
        return;
    }
    if (phrases.length >= 20) {
        showEditStatus(t('Máximo 20 frases · Max 20', 'Maximum 20 phrases'));
        return;
    }
    const id = Date.now();
    phrases.push({ text, id, savedAt: new Date().toISOString() });
    saveProtected(phrases);
    renderVoiceVault();
    updateProtectBtn();
    showEditStatus(t('✓ Protegida · Protected', '✓ Phrase protected'));
    sendAppEvent('phraseProtected', { phrase: text, totalProtected: phrases.length });
    logProcessEvent('voice_vault_phrase_added', `Voice Vault: phrase protected (${text.length} chars). Total: ${phrases.length}.`);
}

function renderVoiceVault() {
    const list    = document.getElementById('vaultPhraseList');
    const badge   = document.getElementById('vaultCountBadge');
    const toolbar = document.getElementById('vaultToolbarCount');
    if (!list) return;

    const phrases = loadProtected();
    const draft   = D.draftArea.value;

    if (badge) {
        badge.textContent = phrases.length;
        badge.classList.toggle('empty', phrases.length === 0);
    }
    if (toolbar) {
        toolbar.textContent = phrases.length || '';
        toolbar.style.display = phrases.length ? '' : 'none';
    }

    if (!phrases.length) {
        list.innerHTML = '<div class="vault-empty"><span class="show-es">Aún no has protegido ninguna frase.</span><span class="lang-sep"> · </span><span class="show-en">No phrases protected yet.</span></div>';
        return;
    }

    list.innerHTML = phrases.map(p => {
        const found      = draft.toLowerCase().includes(p.text.toLowerCase());
        const statusCls  = found ? 'found' : 'missing';
        const statusTip  = found
            ? t('Presente en el borrador', 'Present in draft')
            : t('No encontrada — puede haber cambiado', 'Not found — may have changed');
        const display = p.text.length > 52 ? p.text.slice(0, 52) + '…' : p.text;
        return `<div class="vault-phrase" role="listitem">
            <span class="vault-phrase-status ${statusCls}" title="${statusTip}" aria-label="${statusTip}"></span>
            <button class="vault-phrase-text" onclick="findProtectedPhrase(${p.id})"
                title="${escapeHtml(p.text)}"
                aria-label="${t('Ir a la frase', 'Go to phrase')}: ${escapeHtml(p.text)}">
                ${escapeHtml(display)}
            </button>
            <button class="vault-phrase-remove" onclick="removeProtectedPhrase(${p.id})"
                aria-label="${t('Quitar protección', 'Remove protection')}: ${escapeHtml(display)}">✕</button>
        </div>`;
    }).join('');
}

function findProtectedPhrase(id) {
    const p = loadProtected().find(x => x.id === id);
    if (!p) return;
    const draft = D.draftArea.value;
    const idx   = draft.toLowerCase().indexOf(p.text.toLowerCase());
    if (idx === -1) {
        showEditStatus(t('No encontrada · Not found in draft', 'Phrase not found in draft'));
        return;
    }
    D.draftArea.focus();
    D.draftArea.setSelectionRange(idx, idx + p.text.length);
    const linesBefore = draft.slice(0, idx).split('\n').length - 1;
    const lineH = parseInt(getComputedStyle(D.draftArea).lineHeight) || 28;
    D.draftArea.scrollTop = Math.max(0, linesBefore * lineH - 60);
    showEditStatus(t('↑ Localizada en el borrador · Found', '↑ Located in draft'));
}

function removeProtectedPhrase(id) {
    saveProtected(loadProtected().filter(p => p.id !== id));
    renderVoiceVault();
    updateProtectBtn();
}

function updateProtectBtn() {
    const btn = el('etbProtectBtn');
    const sep = el('etbProtectSep');
    const isS8 = state.stage === 8;
    if (!btn) return;
    const show = isS8;
    btn.style.display = show ? '' : 'none';
    if (sep) sep.style.display = show ? '' : 'none';
    if (show) {
        const hasSel = D.draftArea.selectionStart !== D.draftArea.selectionEnd;
        btn.disabled = !hasSel;
    }
}

// Occasional light humor — one per category, used sparingly
const HUMOR = {
    welcome_multi: [
        'The coffee is still warm. Let\'s keep going.',
        'Your draft waited patiently. That is more than can be said for the coffee.',
        'Good to have you back. The screen was getting lonely.'
    ],
    overwhelmed: [
        'This part asks your brain to stretch a little. Café first, then we connect the dots.',
        'Revision is not punishment. It is just your draft asking for a little more care.'
    ],
    draft_saved: [
        'The draft is not messy because you failed. It is messy because thinking happened.',
        'No need to sound like a textbook wearing a blazer. Keep your voice.'
    ]
};

// ════════════════════════════════════════════════════════
//  CAPSTONE SELF-ASSESSMENT — Mi cierre de proceso
// ════════════════════════════════════════════════════════

const CAPSTONE_CRITERIA = [
    { key: 'opening',    es: 'Apertura / Anécdota',               en: 'Opening / Anecdote',             text: 'My opening gives the reader a specific moment, image, or situation to enter.' },
    { key: 'connection', es: 'Conexión',                           en: 'Connection',                     text: 'I connect my experience or example to a larger issue, question, or context.' },
    { key: 'evidence',   es: 'Evidencia / Especificidad',          en: 'Evidence / Specificity',         text: 'I use details, examples, observations, or sources to support my ideas.' },
    { key: 'voice',      es: 'Voz',                                en: 'Voice',                          text: 'The writing still sounds like me.' },
    { key: 'revision',   es: 'Revisión',                           en: 'Revision',                       text: 'I made at least one meaningful change, not just small corrections.' },
    { key: 'ai',         es: 'Criterio sobre la IA',               en: 'AI Judgment',                    text: 'I accepted, changed, or rejected suggestions thoughtfully.' },
    { key: 'cultural',   es: 'Conocimiento / Conocimiento cultural', en: 'Conocimiento / Cultural Knowledge', text: 'I used knowledge from my life, language, community, or experience in a way that matters.' },
    { key: 'nextstep',   es: 'Próximo paso',                       en: 'Next Step',                      text: 'I know what still needs work.' }
];

const CAPSTONE_RATINGS = [
    { val: 'developing', es: 'Todavía en desarrollo', en: 'Still developing' },
    { val: 'taking',     es: 'Va tomando forma',      en: 'Taking shape' },
    { val: 'strong',     es: 'Fuerte',                en: 'Strong' },
    { val: 'vstrong',    es: 'Muy fuerte',            en: 'Very strong' }
];

function loadCapstoneData() {
    try { return JSON.parse(localStorage.getItem('tupana_capstone') || '{}'); } catch(e) { return {}; }
}

function _saveCapstoneRaw(data) {
    try { localStorage.setItem('tupana_capstone', JSON.stringify(data)); } catch(e) {}
}

function setCapstoneRating(criterion, val, btn) {
    const group = btn.closest('.capstone-rating-group');
    if (group) {
        group.querySelectorAll('.capstone-rating-btn').forEach(b => {
            b.classList.remove('selected');
            b.setAttribute('aria-pressed', 'false');
        });
    }
    btn.classList.add('selected');
    btn.setAttribute('aria-pressed', 'true');
    const data = loadCapstoneData();
    if (!data.ratings) data.ratings = {};
    data.ratings[criterion] = val;
    _saveCapstoneRaw(data);
}

function saveCapstoneReflection(key, value) {
    const data = loadCapstoneData();
    if (!data.reflections) data.reflections = {};
    data.reflections[key] = value;
    _saveCapstoneRaw(data);
}

function submitCapstone() {
    const done       = document.getElementById('capstoneDoneMsg');
    const btn        = document.getElementById('capstoneSubmitBtn');
    const compareBtn = document.getElementById('capstoneCompareBtn');
    if (done) done.classList.add('on');
    if (btn)  btn.style.display = 'none';
    if (compareBtn) compareBtn.style.display = 'inline-flex';
    state.done.add(10);
    buildMap();
    const data = loadCapstoneData();
    data.completed = true;
    _saveCapstoneRaw(data);
    logProcessEvent('capstone_self_assessment_completed', 'Stage 10A self-assessment submitted.');

    // Inject report trigger into done-message
    if (done && !document.getElementById('instrReportTrigger')) {
        const trigger = document.createElement('div');
        trigger.id = 'instrReportTrigger';
        trigger.innerHTML = `
            <button class="instr-report-trigger-btn" onclick="injectInstructorReportPanel(true)"
                aria-label="Generar Reporte de Proceso para Brightspace · Generate Process Report for Brightspace">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="12" height="14" rx="1.5"/><path d="M5 6h6M5 9h6M5 12h4"/></svg>
                <span class="show-es">Generar Reporte para Brightspace</span>
                <span class="lang-sep"> · </span>
                <span class="show-en">Generate Report for Brightspace</span>
            </button>
            <span class="instr-report-trigger-sub">
                <span class="show-es">Revisa y entrega este reporte con tu ensayo.</span>
                <span class="lang-sep"> · </span>
                <span class="show-en">Review and submit this report with your essay.</span>
            </span>`;
        done.appendChild(trigger);
    }
}

function exportCapstone() {
    const data        = loadCapstoneData();
    const ratings     = data.ratings          || {};
    const reflections = data.reflections      || {};
    const coach       = data.coachPerspective || null;
    const resp        = data.studentResponse  || {};
    const dateStr     = new Date().toLocaleDateString('es', { year:'numeric', month:'long', day:'numeric' });

    const ratingLabel = val => {
        const r = CAPSTONE_RATINGS.find(r => r.val === val);
        return r ? `${r.en} / ${r.es}` : '—';
    };

    let text = `# My Writing Snapshot / Mi cierre de proceso\n`;
    text += `${dateStr}\n\n`;
    text += `Este cierre de proceso incluye mi autoevaluación, una perspectiva limitada del coach y mi respuesta a esa perspectiva. No es una calificación.\n`;
    text += `This writing snapshot includes my self-assessment, a limited coach perspective, and my response to that perspective. It is not a grade.\n\n`;

    text += `---\n## 10A — My Self-Assessment / Mi autoevaluación\n\n`;
    CAPSTONE_CRITERIA.forEach(c => {
        text += `**${c.en} / ${c.es}**\n"${c.text}"\n`;
        text += `My rating: ${ratingLabel(ratings[c.key])}\n\n`;
    });
    text += `**One thing I improved / Una cosa que mejoré:**\n${reflections.improved || '—'}\n\n`;
    text += `**One thing that still needs work / Una cosa que todavía necesita trabajo:**\n${reflections.needs || '—'}\n\n`;
    text += `**One decision I made to protect my voice / Una decisión que tomé para proteger mi voz:**\n${reflections.voice || '—'}\n\n`;

    if (coach && Array.isArray(coach.coachPerspective)) {
        text += `---\n## 10B — Coach Perspective / Perspectiva del coach\n`;
        text += `(Second opinion only. Not a grade. The coach cannot verify lived experience, cultural knowledge, or community context.)\n\n`;
        coach.coachPerspective.forEach(row => {
            text += `**${row.dimension}**\n`;
            text += `Coach rating: ${row.rating}\n`;
            if (row.observation) text += `Observation: ${row.observation}\n`;
            if (row.suggestion)  text += `Suggestion: ${row.suggestion}\n`;
            text += '\n';
        });
        const lim = coach.limitations || 'I cannot fully judge the cultural, community, or lived meaning of your examples. You and your professor are better positioned to decide whether those examples represent your experience accurately and respectfully.';
        text += `Coach limitation note: ${lim}\n\n`;
    }

    if (resp.agree || resp.disagree || resp.missing) {
        text += `---\n## 10C — My Response to the Coach / Mi respuesta al coach\n\n`;
        text += `**Where I agree / Donde estoy de acuerdo:**\n${resp.agree || '—'}\n\n`;
        text += `**Where I disagree / Donde no estoy de acuerdo:**\n${resp.disagree || '—'}\n\n`;
        text += `**What the coach might be missing / Lo que el coach podría estar pasando por alto:**\n${resp.missing || '—'}\n\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
        ['capstoneCopiedFlash','capstoneCopiedFlash2'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2200); }
        });
    }).catch(() => {
        window.prompt('Copia este texto · Copy this text:', text);
    });
}

function injectCapstonePanel() {
    if (document.querySelector('.capstone-panel')) return;

    const data             = loadCapstoneData();
    const savedRatings     = data.ratings     || {};
    const savedReflections = data.reflections || {};
    const selfDone         = !!data.completed;
    const coachGenerated   = !!(data.coachPerspective);

    const criteriaHTML = CAPSTONE_CRITERIA.map(c => {
        const btns = CAPSTONE_RATINGS.map(r => {
            const sel = savedRatings[c.key] === r.val;
            return `<button class="capstone-rating-btn${sel ? ' selected' : ''}"
                aria-pressed="${sel}"
                onclick="setCapstoneRating('${c.key}','${r.val}',this)"
            ><span lang="es">${r.es}</span></button>`;
        }).join('');
        return `
        <div class="capstone-criterion">
            <div class="capstone-criterion-label">
                <span class="capstone-criterion-key">${c.en} / ${c.es}</span> — "${c.text}"
            </div>
            <div class="capstone-rating-group" role="group" aria-label="Rating para ${c.en}">${btns}</div>
        </div>`;
    }).join('');

    // Compare button: shown if self-assessment done but coach not yet generated
    const compareVisible = selfDone && !coachGenerated;

    const panel = document.createElement('div');
    panel.className = 'capstone-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Mi cierre de proceso · My Writing Snapshot — self-assessment');
    panel.innerHTML = `
        <div class="capstone-card-label">10A · Mi autoevaluación · My Self-Assessment</div>
        <div class="capstone-panel-title" lang="es">Mi cierre de proceso</div>
        <div class="capstone-panel-subtitle" lang="en">My Writing Snapshot — Stage 10 of 10</div>

        <div class="capstone-intro">
            <strong>Ya hiciste el trabajo difícil.</strong>
            Redactar, revisar, decidir qué se queda. Este paso nombra qué cambió.
            <span style="display:block;margin-top:4px;color:var(--text-muted);">You've done the hard work — drafting, revising, deciding what stays. Now name what changed.</span>
            <details class="lab-expander" style="margin-top:10px;">
                <summary>¿Qué es esta reflexión? · What is this? <span class="lab-exp-arrow">▾</span></summary>
                <div class="lab-expander-body">
                    <p>Esto no es una calificación. Es una reflexión corta sobre tu proceso de escritura. Tu criterio tiene la última palabra.</p>
                    <p style="color:var(--text-muted)">This is not a grade. It is a short reflection on your writing process. Name what improved, what you protected, and what still needs attention before you submit. Your judgment matters.</p>
                </div>
            </details>
        </div>

        <div class="capstone-section-label">Auto-evaluación · Self-Check</div>
        ${criteriaHTML}

        <hr class="capstone-divider">
        <div class="capstone-section-label">
            Reflexiones cortas · Short Reflections
            <span style="font-weight:400;text-transform:none;font-size:0.71rem"> — opcional · optional</span>
        </div>

        <div class="capstone-reflection-field">
            <label class="capstone-reflection-label" for="capstoneR1">
                Una cosa que mejoré fue… / One thing I improved is…
            </label>
            <textarea class="capstone-reflection-text" id="capstoneR1" rows="2"
                aria-label="Una cosa que mejoré · One thing I improved"
                oninput="saveCapstoneReflection('improved',this.value)"
            >${escapeHtml(savedReflections.improved || '')}</textarea>
        </div>

        <div class="capstone-reflection-field">
            <label class="capstone-reflection-label" for="capstoneR2">
                Una cosa que todavía necesita trabajo es… / One thing that still needs work is…
            </label>
            <textarea class="capstone-reflection-text" id="capstoneR2" rows="2"
                aria-label="Una cosa que todavía necesita trabajo · One thing that still needs work"
                oninput="saveCapstoneReflection('needs',this.value)"
            >${escapeHtml(savedReflections.needs || '')}</textarea>
        </div>

        <div class="capstone-reflection-field">
            <label class="capstone-reflection-label" for="capstoneR3">
                Una decisión que tomé para proteger mi voz fue… / One decision I made to protect my voice was…
            </label>
            <textarea class="capstone-reflection-text" id="capstoneR3" rows="2"
                aria-label="Una decisión para proteger mi voz · A decision to protect my voice"
                oninput="saveCapstoneReflection('voice',this.value)"
            >${escapeHtml(savedReflections.voice || '')}</textarea>
        </div>

        <div class="capstone-action-row">
            <button class="capstone-submit-btn" id="capstoneSubmitBtn"
                onclick="submitCapstone()"
                aria-label="Completar autoevaluación · Complete self-assessment"
                ${selfDone ? 'style="display:none"' : ''}>
                ✓ Nombré mi proceso · I named my process
            </button>
            <button class="capstone-compare-btn" id="capstoneCompareBtn"
                onclick="requestCoachPerspective()"
                aria-label="Comparar con la perspectiva del coach · Compare with the coach"
                style="display:${compareVisible ? 'inline-flex' : 'none'}">
                ⇄ Comparar con el coach · Compare with the Coach
            </button>
        </div>

        <div class="capstone-done-msg${selfDone ? ' on' : ''}" id="capstoneDoneMsg" role="status">
            <div class="capstone-done-title">Autoevaluación completa. / Self-assessment complete.</div>
            <span lang="es">Nombraste tu propio proceso. Ahora puedes comparar tu lectura con una perspectiva limitada del coach — o exportar directamente.</span>
            <br><span lang="en" style="color:var(--text-muted)">You named your own process. You can now compare your reading with a limited coach perspective — or export directly.</span>
        </div>
    `;

    D.chatMessages.appendChild(panel);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
}

// ════════════════════════════════════════════════════════
//  CURRENT TASK BAR — step state & rendering
// ════════════════════════════════════════════════════════

function loadStepForStage(stageId) {
    try { return Math.max(1, parseInt(localStorage.getItem(`tupana_step_${stageId}`) || '1', 10)); } catch(e) { return 1; }
}

function setStep(n) {
    const steps = STAGE_STEPS[state.stage];
    if (!steps) return;
    const clamped = Math.max(1, Math.min(n, steps.length));
    if (clamped === state.step) return;
    state.step = clamped;
    try { localStorage.setItem(`tupana_step_${state.stage}`, String(clamped)); } catch(e) {}
    updateCurrentTaskBar();
}

let _stepAdvanceTimer = null;
function autoAdvanceStepOnWordCount(wordCount) {
    if (state.stage > 6) return;
    const thresholds = STEP_WORD_THRESHOLDS[state.stage];
    if (!thresholds) return;
    let target = 1;
    if (wordCount >= thresholds[1]) target = 3;
    else if (wordCount >= thresholds[0]) target = 2;
    if (target > state.step) setStep(target);
}

function updateCurrentTaskBar() {
    const s     = STAGES[state.stage - 1];
    const steps = STAGE_STEPS[state.stage];
    if (!s || !steps) return;

    const step     = state.step;
    const total    = steps.length;
    const stepData = steps[step - 1] || steps[0];

    const ctbStage = document.getElementById('ctbStage');
    if (ctbStage) ctbStage.innerHTML =
        `<span class="show-es">Etapa ${state.stage}<span class="ctb-of-total"> de 10</span> · ${escapeHtml(s.es.replace('\n', ' '))}</span>` +
        `<span class="lang-sep"> / </span>` +
        `<span class="show-en">Stage ${state.stage}<span class="ctb-of-total"> of 10</span> · ${escapeHtml(s.en)}</span>`;

    // Mobile progress strip — set CSS variable consumed by ::after on current-task-bar
    const ctbBar = document.getElementById('currentTaskBar');
    if (ctbBar) ctbBar.style.setProperty('--ctb-progress', `${(state.stage / 10) * 100}%`);

    const ctbInstr = document.getElementById('ctbInstruction');
    if (ctbInstr) {
        ctbInstr.innerHTML =
            `<span class="ctb-es">${escapeHtml(stepData.es)}</span>` +
            `<span class="ctb-sep" aria-hidden="true"> · </span>` +
            `<span class="ctb-en">${escapeHtml(stepData.en)}</span>`;
        ctbInstr.title = `${stepData.es} · ${stepData.en}`;
        setTimeout(refreshMarqueeHint, 60);
    }

    const ctbDots = document.getElementById('ctbDots');
    if (ctbDots) {
        ctbDots.innerHTML = '';
        for (let i = 1; i <= total; i++) {
            const dot = document.createElement('span');
            dot.className = 'ctb-dot';
            if (i < step)        dot.classList.add('done');
            else if (i === step) dot.classList.add('active');
            ctbDots.appendChild(dot);
        }
    }
}

function refreshMarqueeHint() {
    const el = document.getElementById('ctbInstruction');
    if (!el) return;

    // Unwrap any existing inner marquee span
    const existing = el.querySelector('.ctb-marquee-inner');
    if (existing) {
        while (existing.firstChild) el.insertBefore(existing.firstChild, existing);
        existing.remove();
    }
    el.classList.remove('ctb-marquee', 'ctb-marquee-done');
    if (el._marqueeHandler) {
        el.removeEventListener('click', el._marqueeHandler);
        el._marqueeHandler = null;
    }

    if (window.innerWidth > 480) return;

    requestAnimationFrame(() => {
        const overflow = el.scrollWidth - el.offsetWidth;
        if (overflow > 4) {
            const inner = document.createElement('span');
            inner.className = 'ctb-marquee-inner';
            inner.style.setProperty('--ctb-scroll', `-${overflow + 16}px`);
            while (el.firstChild) inner.appendChild(el.firstChild);
            el.appendChild(inner);
            el.classList.add('ctb-marquee');

            // Stop after 2 cycles — mark as done so tap-to-replay is obvious
            inner.addEventListener('animationend', () => {
                el.classList.add('ctb-marquee-done');
            }, { once: true });

            // Tap anywhere on the bar restarts the scroll
            el._marqueeHandler = (e) => {
                e.stopPropagation();
                el.classList.remove('ctb-marquee-done');
                inner.style.animation = 'none';
                void inner.offsetWidth; // force reflow to restart
                inner.style.animation = '';
                inner.addEventListener('animationend', () => {
                    el.classList.add('ctb-marquee-done');
                }, { once: true });
            };
            el.addEventListener('click', el._marqueeHandler);
        }
    });
}

// ── 10B: Coach Perspective ──────────────────────────────

async function requestCoachPerspective() {
    const compareBtn = document.getElementById('capstoneCompareBtn');
    if (compareBtn) { compareBtn.disabled = true; compareBtn.textContent = 'Generando... / Generating...'; }

    const data        = loadCapstoneData();
    const ratings     = data.ratings || {};
    const draft       = D.draftArea ? D.draftArea.value.trim() : '';
    const ratingLabel = val => {
        const r = CAPSTONE_RATINGS.find(r => r.val === val);
        return r ? r.en : 'Not rated';
    };
    const ratingsText = CAPSTONE_CRITERIA.map(c =>
        `- ${c.en}: ${ratingLabel(ratings[c.key])}`
    ).join('\n');

    const prompt =
`[CAPSTONE_COACH_REQUEST] The student has completed their Stage 10 self-assessment. Provide a structured coach perspective using the same 8 rubric dimensions. Respond ONLY with valid JSON — no prose, no introduction, no explanation outside the JSON.

STUDENT SELF-ASSESSMENT:
${ratingsText}

STUDENT DRAFT (excerpt, up to 1400 characters):
${draft.slice(0, 1400)}

Required JSON format (fill in all 8 dimensions; use only these rating values: "Still developing", "Taking shape", "Strong", "Very strong"):
{"coachPerspective":[{"dimension":"Opening / Anecdote","rating":"...","observation":"...","suggestion":"..."},{"dimension":"Connection","rating":"...","observation":"...","suggestion":"..."},{"dimension":"Evidence / Specificity","rating":"...","observation":"...","suggestion":"..."},{"dimension":"Voice","rating":"...","observation":"...","suggestion":"..."},{"dimension":"Revision","rating":"...","observation":"...","suggestion":"..."},{"dimension":"AI Judgment","rating":"...","observation":"...","suggestion":"..."},{"dimension":"Conocimiento / Cultural Knowledge","rating":"...","observation":"...","suggestion":"..."},{"dimension":"Next Step","rating":"...","observation":"...","suggestion":"..."}],"limitations":"I cannot fully judge the cultural, community, or lived meaning of your examples. You and your professor are better positioned to decide whether those examples represent your experience accurately and respectfully."}`;

    // Ollama path: raw text via shared generateCoachResponse(), then route to
    // handleCoachPerspectiveResponse() instead of addMsg().
    if (state.coachMode === 'ollama') {
        state.waiting = true;
        showTyping(true);
        try {
            const reply = await generateCoachResponse({ prompt, stageId: getStageId(state.stage) });
            handleCoachPerspectiveResponse(reply || '');
        } catch(err) {
            console.error('coachPerspective:ollama', err);
            showTyping(false);
            state.waiting = false;
            renderCoachPerspectiveOffline();
        }
        return;
    }

    if (!state.connected) {
        renderCoachPerspectiveOffline();
        return;
    }

    // DirectLine path (Copilot / Bot Framework)
    state.coachPerspectiveCallback = text => handleCoachPerspectiveResponse(text);
    state.waiting = true;
    showTyping(true);

    try {
        await fetch(`${DL}/conversations/${state.convId}/activities`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${state.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'message',
                from: { id: CONFIG.userId, name: CONFIG.userName },
                text: prompt,
                channelData: { ...buildChannelData(), capstoneCoachRequest: true }
            })
        });
    } catch(err) {
        console.error('coachRequest:', err);
        showTyping(false);
        state.waiting = false;
        state.coachPerspectiveCallback = null;
        renderCoachPerspectiveOffline();
    }
}

function handleCoachPerspectiveResponse(text) {
    showTyping(false);
    state.waiting = false;
    D.sendBtn.disabled = false;

    let parsed = null;
    try { parsed = JSON.parse(text); } catch(e) {
        const m = text.match(/\{[\s\S]*"coachPerspective"[\s\S]*\}/);
        if (m) { try { parsed = JSON.parse(m[0]); } catch(e2) {} }
    }

    if (parsed && Array.isArray(parsed.coachPerspective) && parsed.coachPerspective.length > 0) {
        const data = loadCapstoneData();
        data.coachPerspective = parsed;
        _saveCapstoneRaw(data);
        renderCoachPerspectiveData(parsed, false);
    } else {
        renderCoachPerspectiveFallback(text);
    }
}

function renderCoachPerspectiveData(parsed, isRestore) {
    if (document.querySelector('.capstone-10b-panel')) return;

    const rows = parsed.coachPerspective.map(row => `
        <div class="coach-rubric-row">
            <div class="coach-rubric-dim">${escapeHtml(row.dimension)}</div>
            <div><span class="coach-rubric-rating-chip">${escapeHtml(row.rating)}</span></div>
            <div class="coach-rubric-obs">${escapeHtml(row.observation || '')}</div>
            ${row.suggestion ? `<div class="coach-rubric-sugg">→ ${escapeHtml(row.suggestion)}</div>` : ''}
        </div>`).join('');

    const limitations = parsed.limitations ||
        'I cannot fully judge the cultural, community, or lived meaning of your examples. You and your professor are better positioned to decide whether those examples represent your experience accurately and respectfully.';

    const data       = loadCapstoneData();
    const savedResp  = data.studentResponse || {};
    const resp10cDone = !!data.finalComplete;

    const panel = document.createElement('div');
    panel.className = 'capstone-10b-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Coach Perspective · Perspectiva del coach — 10B');
    panel.innerHTML = `
        <div class="capstone-card-label">10B · Perspectiva del coach · Coach Perspective</div>
        <div class="capstone-panel-title">Coach Perspective</div>

        <div class="capstone-pre-note" aria-live="polite">
            <span lang="es">El coach ofrecerá ahora una posible lectura de tu borrador. Esto <strong>no es una calificación</strong>. Puede notar patrones útiles, pero también puede pasar por alto contexto importante de tu vida, lengua, comunidad o intención. <strong>Léelo de manera crítica.</strong></span>
            <br><span lang="en" style="color:var(--text-muted)">The coach will now offer one possible reading of your draft. This is <strong>not a grade</strong>. It may notice useful patterns, but it may also miss important context from your life, language, community, or intention. <strong>Read it critically.</strong></span>
        </div>

        <div class="capstone-section-label">Lectura del coach · Coach Reading</div>
        ${rows}

        <div class="capstone-limitation-box" role="note">
            <div class="capstone-limitation-label">Nota de limitación del coach · Coach Limitation Note</div>
            <span lang="en">${escapeHtml(limitations)}</span>
            <br><span lang="es" style="color:var(--text-muted)">No puedo juzgar completamente el significado cultural, comunitario o vivido de tus ejemplos. Tú y tu profesor/a están en mejor posición para decidir si esos ejemplos representan tu experiencia de manera precisa y respetuosa.</span>
        </div>

        <div class="capstone-action-row">
            <button class="capstone-respond-btn" id="capstoneRespondBtn"
                onclick="showCapstoneCard10C()"
                aria-label="Responder al coach · Respond to the coach"
                ${resp10cDone || savedResp.agree || savedResp.disagree || savedResp.missing ? 'style="display:none"' : ''}>
                Mi respuesta al coach · My Response to the Coach →
            </button>
        </div>
    `;

    // Hide compare button in 10A now that 10B is here
    const compareBtn = document.getElementById('capstoneCompareBtn');
    if (compareBtn) compareBtn.style.display = 'none';

    D.chatMessages.appendChild(panel);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;

    // If restoring and 10C was already started, re-inject 10C
    if (isRestore && (resp10cDone || savedResp.agree || savedResp.disagree || savedResp.missing)) {
        setTimeout(() => showCapstoneCard10C(), 150);
    }
}

function renderCoachPerspectiveOffline() {
    if (document.querySelector('.capstone-10b-panel')) return;
    const compareBtn = document.getElementById('capstoneCompareBtn');
    if (compareBtn) {
        compareBtn.disabled = false;
        compareBtn.innerHTML = '⇄ Comparar con el coach · Compare with the Coach';
    }
    const panel = document.createElement('div');
    panel.className = 'capstone-10b-panel';
    panel.setAttribute('role', 'status');
    panel.innerHTML = `
        <div class="capstone-card-label">10B · Perspectiva del coach · Coach Perspective</div>
        <div class="capstone-pre-note">
            <span lang="en">The coach perspective requires a live AI connection. The coach is not connected right now. You can export your self-assessment directly, or ask your instructor to connect the coach.</span>
            <br><span lang="es" style="color:var(--text-muted)">La perspectiva del coach requiere conexión con IA. El coach no está conectado en este momento. Puedes exportar tu autoevaluación directamente o pedir a tu instructor que lo conecte.</span>
        </div>
        <div class="capstone-action-row">
            <button class="capstone-export-btn" onclick="exportCapstone()"
                aria-label="Copiar mi cierre de proceso · Copy my writing snapshot">
                ↗ Copiar mi autoevaluación / Copy My Self-Assessment
            </button>
        </div>
    `;
    D.chatMessages.appendChild(panel);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
}

function renderCoachPerspectiveFallback(rawText) {
    if (document.querySelector('.capstone-10b-panel')) return;
    const panel = document.createElement('div');
    panel.className = 'capstone-10b-panel';
    panel.setAttribute('role', 'region');
    panel.innerHTML = `
        <div class="capstone-card-label">10B · Perspectiva del coach · Coach Perspective</div>
        <div class="capstone-pre-note">
            <span lang="en">The coach returned a response that could not be formatted as a structured rubric. The raw response is shown below. Read it critically — it is one perspective, not a grade.</span>
            <br><span lang="es" style="color:var(--text-muted)">El coach devolvió una respuesta que no se pudo formatear como rúbrica. Se muestra el texto a continuación. Léelo de manera crítica — es una perspectiva, no una calificación.</span>
        </div>
        <div class="capstone-limitation-box">
            <div class="capstone-limitation-label">Nota de limitación · Limitation Note</div>
            I cannot fully judge the cultural, community, or lived meaning of your examples. You and your professor are better positioned to decide whether those examples represent your experience accurately and respectfully.
        </div>
        <div style="background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 13px;font-size:0.80rem;line-height:1.5;color:var(--text-sub);margin-top:8px;white-space:pre-wrap;">${escapeHtml(rawText)}</div>
        <div class="capstone-action-row" style="margin-top:12px">
            <button class="capstone-respond-btn" onclick="showCapstoneCard10C()"
                aria-label="Responder al coach · Respond to the coach">
                Mi respuesta al coach · My Response to the Coach →
            </button>
        </div>
    `;
    const compareBtn = document.getElementById('capstoneCompareBtn');
    if (compareBtn) compareBtn.style.display = 'none';
    D.chatMessages.appendChild(panel);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
}

// ── 10C: My Response to the Coach ───────────────────────

function showCapstoneCard10C() {
    if (document.querySelector('.capstone-10c-panel')) return;

    const respondBtn = document.getElementById('capstoneRespondBtn');
    if (respondBtn) respondBtn.style.display = 'none';

    const data      = loadCapstoneData();
    const savedResp = data.studentResponse || {};
    const finalDone = !!data.finalComplete;

    const panel = document.createElement('div');
    panel.className = 'capstone-10c-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Mi respuesta al coach · My Response to the Coach — 10C');
    panel.innerHTML = `
        <div class="capstone-card-label">10C · Mi respuesta al coach · My Response to the Coach</div>
        <div class="capstone-panel-title">Mi respuesta · My Response</div>
        <div class="capstone-intro">
            <em>Tú tienes la última palabra. / You have the final word.</em>
        </div>

        <div class="capstone-reflection-field">
            <label class="capstone-reflection-label" for="capstone10cAgree">
                ¿En qué estás de acuerdo con el coach? / Where do you agree with the coach?
            </label>
            <textarea class="capstone-reflection-text" id="capstone10cAgree" rows="2"
                aria-label="Donde estoy de acuerdo · Where I agree"
                oninput="saveCapstoneStudentResponse('agree',this.value)"
            >${escapeHtml(savedResp.agree || '')}</textarea>
        </div>

        <div class="capstone-reflection-field">
            <label class="capstone-reflection-label" for="capstone10cDisagree">
                ¿En qué no estás de acuerdo con el coach? / Where do you disagree with the coach?
            </label>
            <textarea class="capstone-reflection-text" id="capstone10cDisagree" rows="2"
                aria-label="Donde no estoy de acuerdo · Where I disagree"
                oninput="saveCapstoneStudentResponse('disagree',this.value)"
            >${escapeHtml(savedResp.disagree || '')}</textarea>
        </div>

        <div class="capstone-reflection-field">
            <label class="capstone-reflection-label" for="capstone10cMissing">
                ¿Qué podría estar pasando por alto el coach sobre tu voz, tu conocimiento comunitario, tu lengua o tu intención? / What might the coach be missing about your voice, community knowledge, language, or intention?
            </label>
            <textarea class="capstone-reflection-text" id="capstone10cMissing" rows="2"
                aria-label="Qué podría estar pasando por alto el coach · What the coach might be missing"
                oninput="saveCapstoneStudentResponse('missing',this.value)"
            >${escapeHtml(savedResp.missing || '')}</textarea>
        </div>

        <div class="capstone-action-row">
            <button class="capstone-final-btn" id="capstoneFinalBtn"
                onclick="submitCapstone10C()"
                aria-label="Guardar mi cierre de proceso · Save my writing snapshot"
                ${finalDone ? 'style="display:none"' : ''}>
                ✓ Guardar mi cierre de proceso · Save My Writing Snapshot
            </button>
            <button class="capstone-export-btn" onclick="exportCapstone()"
                aria-label="Copiar mi cierre de proceso completo · Copy full writing snapshot">
                ↗ Copiar / Copy
            </button>
            <span class="capstone-copied-flash" id="capstoneCopiedFlash2" aria-live="polite">
                ✓ Copiado · Copied
            </span>
        </div>

        <div class="capstone-final-done${finalDone ? ' on' : ''}" id="capstoneFinalDone" role="status">
            <div class="capstone-final-done-title">Tomaste la decisión final. / You made the final decision.</div>
            <span lang="es">El coach ofreció una perspectiva, pero tú nombraste lo que importa en tu propio proceso. Tu voz importa.</span>
            <br><span lang="en" style="color:var(--text-muted)">The coach offered one perspective, but you named what matters in your own process. Tu voz importa.</span>
        </div>
    `;

    D.chatMessages.appendChild(panel);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
}

function saveCapstoneStudentResponse(key, value) {
    const data = loadCapstoneData();
    if (!data.studentResponse) data.studentResponse = {};
    data.studentResponse[key] = value;
    _saveCapstoneRaw(data);
}

function submitCapstone10C() {
    const btn  = document.getElementById('capstoneFinalBtn');
    const done = document.getElementById('capstoneFinalDone');
    if (btn)  btn.style.display = 'none';
    if (done) done.classList.add('on');
    const data = loadCapstoneData();
    data.finalComplete = true;
    _saveCapstoneRaw(data);
}

function pickHumor(key) {
    const arr = HUMOR[key];
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
}

// ════════════════════════════════════════════════════════
//  JOURNEY MAP
// ════════════════════════════════════════════════════════
const PHASES = [
    { label: 'Encontrar', en: 'Discover', ids: [1, 2, 3] },
    { label: 'Construir', en: 'Build',    ids: [4, 5, 6] },
    { label: 'Afinar',    en: 'Refine',   ids: [7, 8, 9] },
    { label: 'Completar', en: 'Complete', ids: [10] }
];

function buildMap() {
    D.journeyTrack.innerHTML = '';
    let dimmedCount = 0;

    PHASES.forEach((phase, pi) => {
        const group = document.createElement('div');
        group.className = 'phase-group';

        const labelRow = document.createElement('div');
        labelRow.className = 'phase-label-row';
        labelRow.innerHTML = `<span class="phase-label show-es" lang="es">${phase.label}</span><span class="phase-label show-en" lang="en">${phase.en}</span>`;
        group.appendChild(labelRow);

        const nodesRow = document.createElement('div');
        nodesRow.className = 'phase-nodes';

        phase.ids.forEach(id => {
            const s = STAGES.find(st => st.id === id);
            if (!s) return;

            const node = document.createElement('div');
            node.className = 'stage-node';
            node.dataset.id = s.id;

            if      (state.done.has(s.id))                                   node.classList.add('done');
            else if (s.id === state.stage)                                   node.classList.add('active');
            else if (s.id > 6 && !state.draftSaved && s.id > state.stage)   node.classList.add('locked');

            const isFarFuture = s.id > state.stage + 2 && !state.done.has(s.id);
            if (isFarFuture) {
                node.classList.add('dimmed');
                dimmedCount++;
            }

            const circle = document.createElement('div');
            circle.className = 'stage-circle';
            if (state.done.has(s.id)) {
                circle.innerHTML = '<svg viewBox="0 0 16 16" style="width:10px;height:10px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round" aria-hidden="true"><path d="M2 8l4 4 8-8"/></svg>';
            } else if (s.id === 6 && !state.done.has(6)) {
                circle.innerHTML = '<svg viewBox="0 0 16 16" style="width:10px;height:10px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round" aria-hidden="true"><path d="M2 12l8-8 4 4-8 8zM6 8l4 4"/></svg>';
                circle.title = 'Puerta de autoría · Authorship gate';
            } else {
                circle.textContent = s.id;
            }

            const stageLabel = document.createElement('div');
            stageLabel.className = 'stage-label';
            stageLabel.innerHTML = `<span class="label-es" lang="es">${s.es.replace('\n','<br>')}</span><span class="label-en" lang="en">${s.en}</span>`;

            node.append(circle, stageLabel);
            nodesRow.appendChild(node);

            node.addEventListener('mouseenter', e => showTip(e, s));
            node.addEventListener('mouseleave', hideTip);
            node.addEventListener('click', () => onStageClick(s));
        });

        group.appendChild(nodesRow);
        D.journeyTrack.appendChild(group);
    });

    // Apply compact class unless user chose to see all
    D.journeyTrack.classList.toggle('compact', !state.showAllJourney);

    // Update toggle button
    if (state.showAllJourney) {
        D.journeyToggleText.textContent = 'Ver menos · Show less';
        
        D.journeyToggle.setAttribute('aria-label', 'Ver menos etapas · Show fewer stages');
        D.journeyToggle.setAttribute('title', 'Ver menos etapas · Show fewer stages');
    } else {
        const n = dimmedCount;
        D.journeyToggleText.textContent = 'Ver todo · Show all';
        
        D.journeyToggle.setAttribute('aria-label', `Ver ${n} etapas más · Show ${n} more stages`);
        D.journeyToggle.setAttribute('title', `Ver ${n} etapas más · Show ${n} more stages`);
        D.journeyToggle.style.display = n > 0 ? 'inline-flex' : 'none';
    }

    const active = D.journeyTrack.querySelector('.stage-node.active');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

}

function toggleJourneyView() {
    state.showAllJourney = !state.showAllJourney;
    try {
        localStorage.setItem('tupana_journey_expand', state.showAllJourney ? 'true' : 'false');
    } catch(e) {}
    D.journeyToggle.classList.toggle('expanded', state.showAllJourney);
    buildMap();
}

function toggleChatProgress() {
    const container = D.chatProgress;
    if (!container) return;
    const isCollapsed = container.classList.toggle('collapsed');
    if (D.chatProgressToggleText) {
        D.chatProgressToggleText.textContent = isCollapsed ? 'Mi progreso · My progress' : 'Ocultar progreso · Hide progress';
    }
    try {
        localStorage.setItem('tupana_progress_collapsed', isCollapsed ? 'true' : 'false');
    } catch(e) {}
}

function initChatProgress() {
    try {
        const collapsed = localStorage.getItem('tupana_progress_collapsed') === 'true';
        if (collapsed && D.chatProgress) {
            D.chatProgress.classList.add('collapsed');
            if (D.chatProgressToggleText) D.chatProgressToggleText.textContent = 'Mi progreso · My progress';
        }
    } catch(e) {}
}

function dismissDraftWarning() {
    const warning = document.getElementById('draftWarning');
    if (warning) warning.style.display = 'none';
    try { sessionStorage.setItem('tupana_warn_dismissed', '1'); } catch(e) {}
}

const PHASE_COMPLETION_NOTES = {
    4:  { es: 'Fase 1 completa — Encontrar', en: 'You found your story and made it your argument. Phase 2 (Construir) begins: research and outlining — two tools that serve your story, not replace it.' },
    7:  { es: 'Fase 2 completa — Construir', en: 'You wrote your draft without help. That draft is yours in a way nothing else will be. Phase 3 (Afinar) begins: revision using the Five Questions — you decide what stays.' },
    10: { es: 'Fase 3 completa — Afinar · Fase 4 (Completar) comienza', en: 'You revised with judgment and protected your voice. One step remains: Mi cierre de proceso — name what changed, what you protected, and what still needs attention. This is not a grade. Your judgment matters.' }
};

// Track pending stage advance from preview modal
let pendingStageId = null;

function showStagePreview(targetId) {
    // Dismiss any open phase celebration toast when student clicks Continue
    dismissPhaseToast();
    // Authorship gate check
    if (targetId >= 7 && !state.draftSaved) {
        addSys(t(
            `⭐ Para llegar a la Etapa ${targetId}, primero necesitas guardar tu primer borrador sin ayuda en el panel izquierdo. Ese borrador es el corazón de todo lo que viene después. / To reach Stage ${targetId}, first save your unassisted first draft in the left panel. That draft is the foundation of everything that follows.`,
            `⭐ Etapa ${targetId} requires a saved first draft. Write and save your draft in the left panel first.`
        ));
        return;
    }
    // Prevent skipping more than one stage ahead
    if (targetId > state.stage + 1 && !state.done.has(targetId - 1)) {
        addSys(t(
            `Completa la Etapa ${state.stage} antes de avanzar a la Etapa ${targetId}. Cada etapa construye sobre la anterior — no hay atajos que valgan la pena. / Complete Stage ${state.stage} before moving to Stage ${targetId}. Each stage builds on the last — there are no shortcuts worth taking.`,
            `Complete Stage ${state.stage} before advancing to Stage ${targetId}.`
        ));
        return;
    }
    const s = STAGES[targetId - 1];
    if (!s) return;
    pendingStageId = targetId;
    D.previewStageNum.textContent = s.id;
    D.previewTitle.innerHTML = `<span class="show-es">${escapeHtml(s.es.replace('\n', ' '))}</span><span class="lang-sep"> / </span><span class="show-en">${escapeHtml(s.en)}</span>`;
    D.previewDesc.textContent = s.desc;

    // Completed milestone text (what the student just finished)
    const tr = STAGE_TRANSITIONS[targetId];
    if (tr) {
        D.previewCompletedText.innerHTML =
            `<span class="show-es">${escapeHtml(tr.completedEs)}</span>` +
            `<span class="lang-sep"> · </span>` +
            `<span class="show-en">${escapeHtml(tr.completedEn)}</span>`;
        D.previewCompleted.removeAttribute('hidden');
        D.previewCtaLabel.innerHTML =
            `<span class="show-es">${escapeHtml(tr.ctaEs)}</span>` +
            `<span class="lang-sep"> · </span>` +
            `<span class="show-en">${escapeHtml(tr.ctaEn)}</span>`;
        D.previewContinueBtn.setAttribute('aria-label',
            `${tr.ctaEs} · ${tr.ctaEn}`);
    } else {
        D.previewCompleted.setAttribute('hidden', '');
        D.previewCtaLabel.innerHTML =
            '<span class="show-es">Continuar</span><span class="lang-sep"> · </span><span class="show-en">Continue</span>';
        D.previewContinueBtn.setAttribute('aria-label', 'Continuar · Continue');
    }

    if (s.example) {
        D.previewExampleText.textContent = s.example;
        D.previewExampleBox.removeAttribute('hidden');
        D.previewExampleBox.removeAttribute('open'); // collapsed by default each open
    } else {
        D.previewExampleBox.setAttribute('hidden', '');
    }
    D.stagePreviewBg.classList.add('on');
    setTimeout(() => D.previewContinueBtn.focus(), 100);
}

function confirmStagePreview() {
    if (!pendingStageId) return;
    D.stagePreviewBg.classList.remove('on');
    const id = pendingStageId;
    pendingStageId = null;
    goToStage(id);
    scheduleCoachSpotlight(id);
    // Mobile: bring student to coach tab so new stage instructions / cards are visible
    if (window.innerWidth <= 480) switchMobileTab('chat');
}

function dismissStagePreview() {
    D.stagePreviewBg.classList.remove('on');
    pendingStageId = null;
}

function goToStage(id) {
    exitDraftFocus();   // stage transition — coach takes visual priority
    const prev = state.stage;

    // Persist current stage's textarea content before switching
    saveStageWork(prev, D.draftArea.value);

    if (id > 1) state.done.add(id - 1);
    state.stage = id;
    logProcessEvent('stage_advanced', `Advanced to Stage ${id}${STAGES[id - 1] ? ' — ' + STAGES[id - 1].en : ''}.`);
    state.step  = loadStepForStage(id);
    const s = STAGES[id - 1];
    if (D.headerSub) {
        D.headerSub.innerHTML = `<span class="show-es">TU COACH DE ESCRITURA</span><span class="lang-sep">&nbsp;·&nbsp;</span><span class="show-en">YOUR WRITING COACH</span>&nbsp;—&nbsp;<span class="header-stage-inline"><span class="show-es">Etapa ${id} · ${s.es.replace('\n', ' ')}</span><span class="lang-sep"> / </span><span class="show-en">Stage ${id} · ${s.en}</span></span>`;
    }
    try { localStorage.setItem('tupana_stage', String(id)); } catch(e) {}
    buildMap();
    updateCurrentTaskBar();

    // Phase completion note (system log — only for true phase boundaries)
    if (PHASE_COMPLETION_NOTES[id]) {
        const note = PHASE_COMPLETION_NOTES[id];
        setTimeout(() => addSys(`${note.es} · ${note.en}`), 400);
    }
    // Celebration toast — fires at any significant milestone, not only phase boundaries
    if (PHASE_CELEBRATIONS[id]) {
        showPhaseCelebration(id);
    }
    // Stage 12: open dedicated Process Note modal with breathing room
    if (id === 12) {
        setTimeout(() => {
            const alreadyShown = (() => {
                try { return localStorage.getItem('tupana_completion_shown') === 'true'; } catch(e) { return false; }
            })();
            if (!alreadyShown) openProcessNoteModal();
        }, 800);
    }
    renderBadges();
    renderEvalStreak();
    updateDraftControls();

    // Load the new stage's writing content
    const _newContent = loadStageWork(id);
    D.draftArea.value = _newContent;
    editHistoryInit(_newContent);
    D.draftArea.dispatchEvent(new Event('input'));

    // Inject Pana Hint for the new stage
    setTimeout(() => injectPanaHint(id), 500);

    // Show Five Questions reference strip from Stage 7 onward
    if (id >= 7) {
        const fqs = document.getElementById('fiveQStrip');
        if (fqs) fqs.classList.remove('hidden');
    }

    // Inject research guidance card at Stage 4
    if (id === 4) setTimeout(() => injectResearchCard(), 700);

    // Inject revision panel for Stage 7; Stage 8 gets the voice polish card instead
    if (id === 7) setTimeout(() => injectRevisionPanel(id), 700);

    // Inject Stage 8 voice polish step-by-step card
    if (id === 8) setTimeout(() => injectVoicePolishCard(), 700);

    // Inject Voice Vault at Stage 8 (Voice Polish)
    if (id === 8) setTimeout(() => injectVoiceVaultPanel(), 800);
    updateProtectBtn();

    // Inject self-assessment capstone panel at stage 10
    if (id === 10) setTimeout(() => injectCapstonePanel(), 700);

    // Notify AI of stage change
    sendAppEvent('stageChange', {
        stage: id,
        stageName: s.es.replace('\n', ' ') + ' / ' + s.en,
        previousStage: Math.max(1, prev),
        tone: state.tone
    });

}

function onStageClick(s) {
    if (s.id >= 7 && !state.draftSaved) {
        addSys(t(
            `⭐ Para llegar a la Etapa ${s.id}, primero guarda tu primer borrador sin ayuda en el panel izquierdo. Ese borrador es tuyo — nada puede reemplazarlo. / To reach Stage ${s.id}, first save your unassisted first draft in the left panel. That draft is yours — nothing can replace it.`,
            `⭐ Stage ${s.id} requires a saved first draft. Write and save your draft first.`
        ));
        return;
    }
    // Prevent skipping more than one stage ahead unless already done
    if (s.id > state.stage + 1 && !state.done.has(s.id - 1) && s.id !== state.stage) {
        addSys(t(
            `Completa la Etapa ${state.stage} antes de avanzar a la Etapa ${s.id}. Cada etapa existe por una razón. / Complete Stage ${state.stage} before advancing to Stage ${s.id}. Each stage exists for a reason.`,
            `Complete Stage ${state.stage} before advancing to Stage ${s.id}.`
        ));
        return;
    }
    if (s.id !== state.stage) goToStage(s.id);
}

// Show/hide Save vs Continue button based on current stage
function updateDraftControls() {
    if (!D.saveBtn || !D.continueBtn) return;
    const isS6  = state.stage === 6;
    const isS10 = state.stage === 10;

    // The editor is locked ONLY at Stage 6 after the first draft is saved.
    // At all other stages the student can write, revise, or paste freely.
    if (isS6 && state.draftSaved) {
        D.draftArea.disabled = true;
        D.saveBtn.disabled = true;
    } else {
        D.draftArea.disabled = false;
    }

    // Stage 6 footer prominence: make Guardar the visual dominant action
    const draftFooter = document.querySelector('.draft-footer');
    if (draftFooter) {
        draftFooter.classList.toggle('draft-footer--s6', isS6);
    }

    if (isS6) {
        D.saveBtn.style.display = 'flex';
        D.continueBtn.style.display = 'flex';
        D.continueBtn.disabled = !state.draftSaved;
        // Reset save button state if draft not yet saved
        if (!state.draftSaved) {
            D.saveBtn.classList.remove('saved');
            D.saveBtnLabel.innerHTML = '<span class="tp-icon" style="width:16px;height:16px"><svg viewBox="0 0 64 64"><path class="tp-fill-paper" d="M14 7h33l7 7v43H14z"/><path d="M47 7v8h7M22 23h21M22 31h16"/><circle class="tp-fill-jade" cx="43" cy="45" r="10"/><path d="M38 45l4 4 7-8"/></svg></span> Guardar';
            D.saveBtn.disabled = false;
        }
    } else if (isS10) {
        D.saveBtn.style.display = 'none';
        D.continueBtn.style.display = 'none';
    } else {
        D.saveBtn.style.display = 'none';
        D.continueBtn.style.display = 'flex';
        D.continueBtn.disabled = false;
    }

    // Stage-specific continue button label
    const nextStage = state.stage + 1;
    const tr = STAGE_TRANSITIONS[nextStage];
    if (tr && !isS10) {
        const ctaArrow = '<span class="tp-icon" style="width:16px;height:16px"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 32h36"/><path d="M36 20l14 12-14 12"/></svg></span>';
        D.continueBtn.innerHTML =
            `${ctaArrow}<span class="show-es">${escapeHtml(tr.ctaEs)}</span>` +
            `<span class="lang-sep"> · </span>` +
            `<span class="show-en">${escapeHtml(tr.ctaEn)}</span>`;
        D.continueBtn.setAttribute('aria-label', `${tr.ctaEs} · ${tr.ctaEn}`);
    } else if (!isS10) {
        D.continueBtn.innerHTML =
            '<span class="tp-icon" style="width:16px;height:16px"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 32h36"/><path d="M36 20l14 12-14 12"/></svg></span>' +
            '<span class="show-es"> Continuar</span><span class="lang-sep"> · </span><span class="show-en">Continue</span>';
        D.continueBtn.setAttribute('aria-label', 'Continuar · Continue');
    }

    // Footer note only relevant at Stage 6
    const footerNote = document.getElementById('draftFooterNote');
    if (footerNote) {
        footerNote.style.display = isS6 ? 'block' : 'none';
    }
    updateEditToolbarBtns();
}

function showTip(e, s) {
    const r = e.currentTarget.getBoundingClientRect();
    D.tooltip.innerHTML = `<strong>${s.id}. <span class="show-es">${s.es.replace('\n', ' ')}</span><span class="lang-sep"> / </span><span class="show-en">${s.en}</span></strong>${s.desc}`;
    D.tooltip.style.left = `${Math.min(r.left, window.innerWidth - 230)}px`;
    D.tooltip.style.top  = `${r.bottom + 7}px`;
    D.tooltip.classList.add('on');
}
function hideTip() { D.tooltip.classList.remove('on'); }

// ════════════════════════════════════════════════════════
//  DRAFT PANEL
// ════════════════════════════════════════════════════════
D.draftArea.addEventListener('input', () => {
    const w = D.draftArea.value.trim().split(/\s+/).filter(Boolean).length;
    D.wordCount.innerHTML = w < 10 && state.stage === 6 && !state.draftSaved
        ? `<span class="show-es">${w}/10 palabras para guardar</span><span class="lang-sep"> · </span><span class="show-en">${w}/10 words to save</span>`
        : `<span class="show-es">${w} palabras</span><span class="lang-sep"> · </span><span class="show-en">words</span>`;
    D.saveBtn.disabled = w < 10 || state.draftSaved;
    clearTimeout(_stepAdvanceTimer);
    _stepAdvanceTimer = setTimeout(() => autoAdvanceStepOnWordCount(w), 900);
    if (!_editHistory.restoring) editHistorySchedule();
    if (state.spotlightTarget === 'editor') dismissEditorSpotlight();
    enterDraftFocus();
    if (state.stage === 8) renderVoiceVault();
});

D.draftArea.addEventListener('focus', () => {
    enterDraftFocus();
});

// Selection tracking for the Protect toolbar button
D.draftArea.addEventListener('mouseup', updateProtectBtn);
D.draftArea.addEventListener('keyup',   updateProtectBtn);
D.draftArea.addEventListener('select',  updateProtectBtn);

// ════════════════════════════════════════════════════════
//  EDIT TOOLBAR — Undo / Redo / Cut / Copy / Paste
// ════════════════════════════════════════════════════════
const _editHistory = { stack: [], index: -1, maxSize: 100, restoring: false };
let _editHistoryTimer = null;

function editHistoryInit(initialValue) {
    _editHistory.stack = [initialValue];
    _editHistory.index = 0;
    updateEditToolbarBtns();
}

function editHistorySchedule() {
    clearTimeout(_editHistoryTimer);
    _editHistoryTimer = setTimeout(() => editHistoryCapture(), 800);
}

function editHistoryCapture() {
    if (_editHistory.restoring) return;
    const val = D.draftArea.value;
    if (_editHistory.stack[_editHistory.index] === val) return;
    _editHistory.stack.splice(_editHistory.index + 1);
    _editHistory.stack.push(val);
    if (_editHistory.stack.length > _editHistory.maxSize) {
        _editHistory.stack.shift();
    }
    _editHistory.index = _editHistory.stack.length - 1;
    updateEditToolbarBtns();
}

function editHistoryUndo() {
    if (_editHistory.index <= 0) return;
    _editHistory.restoring = true;
    _editHistory.index--;
    D.draftArea.value = _editHistory.stack[_editHistory.index];
    D.draftArea.dispatchEvent(new Event('input'));
    _editHistory.restoring = false;
    updateEditToolbarBtns();
    D.draftArea.focus();
}

function editHistoryRedo() {
    if (_editHistory.index >= _editHistory.stack.length - 1) return;
    _editHistory.restoring = true;
    _editHistory.index++;
    D.draftArea.value = _editHistory.stack[_editHistory.index];
    D.draftArea.dispatchEvent(new Event('input'));
    _editHistory.restoring = false;
    updateEditToolbarBtns();
    D.draftArea.focus();
}

function updateEditToolbarBtns() {
    const undoBtn  = el('editUndo'),  redoBtn  = el('editRedo');
    const cutBtn   = el('editCut'),   copyBtn  = el('editCopy'), pasteBtn = el('editPaste');
    if (!undoBtn) return;
    const locked = D.draftArea.disabled;
    undoBtn.disabled  = locked || _editHistory.index <= 0;
    redoBtn.disabled  = locked || _editHistory.index >= _editHistory.stack.length - 1;
    cutBtn.disabled   = locked;
    copyBtn.disabled  = false;
    pasteBtn.disabled = locked;
    updateProtectBtn();
}

let _editStatusTimer;
function showEditStatus(msg) {
    const vis  = el('editToolbarStatus');
    const live = el('editToolbarStatusLive');
    if (vis)  vis.textContent  = msg;
    if (live) live.textContent = msg;
    clearTimeout(_editStatusTimer);
    _editStatusTimer = setTimeout(() => {
        if (vis)  vis.textContent  = '';
        if (live) live.textContent = '';
    }, 3000);
}

async function editCut() {
    const area = D.draftArea;
    if (area.disabled) return;
    const start = area.selectionStart, end = area.selectionEnd;
    if (start === end) {
        showEditStatus('Selecciona texto primero. · Select text first.');
        area.focus();
        return;
    }
    const selected = area.value.slice(start, end);
    try {
        await navigator.clipboard.writeText(selected);
        area.setRangeText('', start, end, 'start');
        area.dispatchEvent(new Event('input'));
        editHistoryCapture();
        showEditStatus('Cortado. · Cut.');
    } catch(e) {
        showEditStatus('Para cortar, usa Ctrl+X (Windows) · Cmd+X (Mac).');
    }
    area.focus();
}

async function editCopy() {
    const area = D.draftArea;
    const start = area.selectionStart, end = area.selectionEnd;
    if (start === end) {
        showEditStatus('Selecciona texto primero. · Select text first.');
        area.focus();
        return;
    }
    const selected = area.value.slice(start, end);
    try {
        await navigator.clipboard.writeText(selected);
        showEditStatus('Copiado. · Copied.');
    } catch(e) {
        showEditStatus('Para copiar, usa Ctrl+C (Windows) · Cmd+C (Mac).');
    }
    area.focus();
}

async function editPaste() {
    const area = D.draftArea;
    if (area.disabled) return;
    try {
        const text = await navigator.clipboard.readText();
        if (!text) { showEditStatus('Nada en el portapapeles. · Nothing to paste.'); area.focus(); return; }
        const start = area.selectionStart, end = area.selectionEnd;
        area.setRangeText(text, start, end, 'end');
        area.dispatchEvent(new Event('input'));
        editHistoryCapture();
        showEditStatus('Pegado. · Pasted.');
    } catch(e) {
        showEditStatus('Para pegar: Ctrl+V (Windows) · Cmd+V (Mac).');
    }
    area.focus();
}

D.saveBtn.addEventListener('click', () => {
    if (state.draftSaved) return;
    D.saveBtn.classList.add('saving');
    setTimeout(() => D.saveBtn.classList.remove('saving'), 700);
    D.confirmBg.classList.add('on');
    D.confirmOk.focus();
});

D.confirmCancel.addEventListener('click', () => D.confirmBg.classList.remove('on'));
D.confirmBg.addEventListener('click', e => { if (e.target === D.confirmBg) D.confirmBg.classList.remove('on'); });

D.confirmOk.addEventListener('click', () => {
    D.confirmBg.classList.remove('on');
    executeSave();
});

function executeSave() {
    // Authorship gate: only Stage 6 can be saved as the unassisted first draft
    if (state.stage !== 6) {
        addSys('Guarda tu borrador solo en la Etapa 6. / Save your draft only at Stage 6.');
        return;
    }
    state.draftSaved = true;
    setStep(3);
    D.draftArea.disabled = true;
    D.saveBtn.disabled = true;
    D.saveBtn.classList.add('saved');
    D.saveBtnLabel.textContent = 'Primer borrador guardado · First draft saved';
    D.savedNotice.classList.add('on');
    D.saveBtn.setAttribute('aria-label', 'Borrador guardado · Draft saved');
    updateDraftControls();

    // Hide the footer note since draft is now saved
    const footerNote = document.querySelector('.draft-footer-note');
    if (footerNote) footerNote.classList.add('hidden');

    try {
        localStorage.setItem('tupana_draft',       D.draftArea.value);
        localStorage.setItem('tupana_draft_saved', 'true');
        localStorage.setItem('tupana_writing_s6',  D.draftArea.value);
    } catch(e) {}
    logProcessEvent('first_draft_saved', `Unassisted first draft saved. Word count: ${D.draftArea.value.trim().split(/\s+/).filter(Boolean).length}.`);

    D.modalBg.classList.add('on');
    // Move focus to the Continue button for keyboard/screen-reader users
    setTimeout(() => {
        const firstBtn = D.modalBg.querySelector('.save-ceremony-btn.primary');
        if (firstBtn) firstBtn.focus();
    }, 80);

    // Wave unlock animation
    const wave = document.createElement('div');
    wave.className = 'wave-unlock';
    wave.innerHTML = '<div class="wave-unlock-ring"></div>';
    document.body.appendChild(wave);
    setTimeout(() => wave.remove(), 1300);

    // Notify AI of draft save milestone
    sendAppEvent('draftSaved', {
        wordCount: D.draftArea.value.trim().split(/\s+/).filter(Boolean).length,
        stage: state.stage,
        draftText: D.draftArea.value.trim()
    });

    // Show decision log for revision tracking
    renderDecisionLog();

    if (state.connected) {
        const draftText = D.draftArea.value.trim();
        setTimeout(() => sendMsg(
            `[DRAFT SAVED — UNASSISTED FIRST DRAFT]\n\n${draftText}\n\n` +
            `[END OF DRAFT]\n\n` +
            `This is my complete unassisted first draft. I wrote it without AI help. ` +
            `Please tell me what you notice — what is working and where I might focus my revision.`
        ), 900);
    }
    renderBadges();
}

// Save ceremony next-step handler
function saveCeremonyNext(choice) {
    D.modalBg.classList.remove('on');
    if (choice === 'revise') {
        goToStage(7);
        // Ask coach for initial feedback on the saved draft
        setTimeout(() => {
            if (state.connected) {
                sendMsg(t(
                    'Acabo de guardar mi primer borrador. ¿Qué notas en él? ¿Qué está funcionando y en qué debería enfocarme para la revisión? / I just saved my first draft. What do you notice? What is working, and what should I focus on for revision?',
                    'I just saved my first draft. What do you notice? What is working, and what should I focus on for revision?'
                ));
            }
        }, 600);
    } else if (choice === 'review') {
        addSys(t(
            'Tu borrador guardado está en el panel de la izquierda. Léelo, siéntete bien con lo que escribiste, y cuando estés listo/a haz clic en "Comenzar la revisión". / Your saved draft is in the left panel. Read it, feel good about what you wrote, and when you\'re ready click "Start Revising".',
            'Your saved draft is in the left panel. Read it, feel good about what you wrote, then click "Start Revising".'
        ));
    }
}

// Theme toggle
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// ════════════════════════════════════════════════════════
//  CHAT MESSAGES
// ════════════════════════════════════════════════════════
function addMsg(text, who, skipLog, msgType) {
    const msgId = makeMsgId();
    if (!skipLog) saveChatEntry(text, who, msgId, {}, msgType);

    // System messages (connection status, app state) go to the technical panel only
    if (msgType === 'system') {
        addToTechPanel(text);
        return msgId;
    }

    // Welcome/greeting messages render as compact strips — not full bot bubbles
    if (msgType === 'welcome') {
        const strip = document.createElement('div');
        strip.className = 'welcome-strip';
        strip.setAttribute('role', 'status');
        strip.dataset.msgId = msgId;
        const iconSpan = document.createElement('span');
        iconSpan.className = 'welcome-strip-icon';
        iconSpan.setAttribute('aria-hidden', 'true');
        iconSpan.innerHTML = getIcon('guide-lighthouse', 14);
        const textSpan = document.createElement('span');
        textSpan.className = 'welcome-strip-text';
        textSpan.innerHTML = wrapBilingualHtml(text);
        strip.append(iconSpan, textSpan);
        D.chatMessages.appendChild(strip);
        D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
        return msgId;
    }

    if (who === 'bot') {
        logProcessEvent('coach_response_received', 'Coach response received.');
    }

    const wrap = document.createElement('div');
    wrap.className = `msg ${who}${msgType ? ' msg-type-' + msgType : ''}`;
    wrap.dataset.msgId = msgId;

    const av = document.createElement('div');
    av.className = 'msg-avatar';
    av.setAttribute('aria-hidden', 'true');
    av.innerHTML = who === 'bot'
        ? `<span class="tp-icon" style="width:16px;height:16px" aria-hidden="true"><svg viewBox="0 0 64 64" aria-hidden="true"><rect fill="#5f8a65" stroke="#315642" stroke-width="3" x="6" y="6" width="40" height="30" rx="4"/><rect fill="#fffaf0" x="11" y="11" width="30" height="16" rx="2"/><path fill="none" stroke="#c68642" stroke-width="2.5" stroke-linecap="round" d="M15 17h20M15 21h16M15 25h12"/><path fill="#e8ddc8" stroke="#315642" stroke-width="2.5" d="M3 36h58l5 10H-2z"/><ellipse fill="#eadfce" stroke="#315642" stroke-width="2" cx="52" cy="48" rx="9" ry="3"/><path fill="#fff7ea" stroke="#315642" stroke-width="2" d="M45 36h14l-3 12c-1 3-8 3-9 0z"/><ellipse fill="#6b4329" opacity="0.9" cx="52" cy="37" rx="6" ry="2"/></svg></span>`
        : getIcon('student-page', 16);

    const content = document.createElement('div');
    content.className = 'msg-content';

    const bub = document.createElement('div');
    bub.className = 'msg-bubble';
    // Use bilingual wrapping for bot messages; keep textContent for student safety
    if (who === 'bot') {
        bub.innerHTML = wrapBilingualHtml(text);
    } else {
        bub.textContent = text;
    }

    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = formatMsgTime(null, false);

    content.append(bub, time);
    wrap.append(av, content);
    D.chatMessages.appendChild(wrap);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;

    // Current coach message prominence: mark latest bot message as current
    if (who === 'bot') {
        const prevCurrent = D.chatMessages.querySelector('.msg-current');
        if (prevCurrent) {
            prevCurrent.classList.remove('msg-current');
            prevCurrent.removeAttribute('role');
            prevCurrent.removeAttribute('aria-label');
        }
        wrap.classList.add('msg-current');
        wrap.setAttribute('role', 'article');
        wrap.setAttribute('aria-label', 'Instrucción actual del coach · Current coach instruction');
    }

    // Coach is speaking — let student see the message without editor competing
    if (who === 'bot') { exitDraftFocus(); notifyMobileChat(); }

    // Activate coach spotlight on the first bot message after a stage transition
    // Guard: don't override if the Pana Hint spotlight is already active
    if (who === 'bot' && state.spotlightTarget === 'coach' && !document.body.classList.contains('spotlight-coach')) {
        _activateCoachSpotlightOn(wrap);
    }

    // inject inline eval bar after bot messages in revision stages (7+)
    if (who === 'bot' && state.stage >= 7) {
        setTimeout(() => renderMsgEvalBar(msgId, {}), 400);
    }
    // inject follow-up questions after every bot message
    if (who === 'bot') {
        setTimeout(injectFollowupPanel, 600);
    }

    return msgId;
}

const _sysDedup = new Map();

function wrapBilingualHtml(text) {
    if (!text || typeof text !== 'string') return '';
    // Heuristic to detect "Spanish line / English line" bilingual messages
    const looksLikeEnglish = (str) => {
        if (!/^[A-Za-z]/.test(str)) return false;
        if (/[áéíóúñ¿¡ü]/i.test(str)) return false;
        // Require at least one common English word to avoid false positives on accent-less Spanish
        const commonEn = /\b(the|and|you|your|this|that|with|for|from|have|has|is|are|was|were|be|been|being|do|does|did|will|would|should|could|can|may|might|must|shall|write|essay|draft|stage|coach|help|please|thank|because|about|through|between|before|after|during|within|without|under|over|into|onto|upon|above|across|along|around|behind|below|beneath|beside|beyond|inside|outside|until|since|while|when|where|what|which|who|whom|whose|why|how|not|no|yes|ok|good|great|well|very|just|only|even|also|still|yet|already|never|always|sometimes|often|usually|really|actually|probably|maybe|perhaps|certainly|definitely|absolutely|completely|totally|almost|nearly|quite|rather|pretty|fairly|enough|more|most|less|least|much|many|some|any|all|none|each|every|both|either|neither|one|two|first|last|next|previous|then|now|here|there|thus|therefore|however|although|though|whereas|unless|so|but|or|nor|if|than|as|like|such|these|those|them|their|they|we|us|our|i|me|my|he|him|his|she|her|it|its)\b/i;
        return commonEn.test(str);
    };
    const lines = text.split('\n');
    if (lines.length === 2) {
        const a = lines[0].trim();
        const b = lines[1].trim();
        const aHasSpanish = /[áéíóúñ¿¡ü]/i.test(a);
        const bHasSpanish = /[áéíóúñ¿¡ü]/i.test(b);
        const aIsEnglish = looksLikeEnglish(a);
        const bIsEnglish = looksLikeEnglish(b);
        // Length ratio: translations are usually within 40% of each other
        const lenRatio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
        const similarLength = lenRatio > 0.35;
        if (similarLength && ((aHasSpanish && bIsEnglish) || (aIsEnglish && bHasSpanish))) {
            const es = aHasSpanish ? a : b;
            const en = aIsEnglish ? a : b;
            return `<span class="show-es">${escapeHtml(es)}</span>` +
                   `<span class="lang-sep"> · </span>` +
                   `<span class="show-en">${escapeHtml(en)}</span>`;
        }
    }
    // Multi-paragraph bilingual: split on double newline
    const paras = text.split(/\n\n+/);
    if (paras.length >= 2) {
        const mid = Math.ceil(paras.length / 2);
        const first = paras.slice(0, mid).join('\n\n');
        const second = paras.slice(mid).join('\n\n');
        const firstSpanish = /[áéíóúñ¿¡ü]/i.test(first);
        const secondEnglish = looksLikeEnglish(second.split('\n')[0].trim());
        const lenRatio = Math.min(first.length, second.length) / Math.max(first.length, second.length);
        if (firstSpanish && secondEnglish && lenRatio > 0.35) {
            return `<span class="show-es">${escapeHtml(first).replace(/\n/g, '<br>')}</span>` +
                   `<span class="lang-sep"> · </span>` +
                   `<span class="show-en">${escapeHtml(second).replace(/\n/g, '<br>')}</span>`;
        }
    }
    return escapeHtml(text).replace(/\n/g, '<br>');
}

function getLiveSysNotesContainer() {
    let container = document.getElementById('liveSysNotes');
    if (!container) {
        container = document.createElement('div');
        container.id = 'liveSysNotes';
        container.className = 'live-sys-notes';
        D.chatMessages.appendChild(container);
    }
    return container;
}

function addSys(text) {
    const key = text.trim().slice(0, 100);
    if (_sysDedup.has(key)) {
        const entry = _sysDedup.get(key);
        entry.count++;
        if (entry.countEl) {
            entry.countEl.textContent = `×${entry.count}`;
            entry.countEl.setAttribute('aria-label', `Repeated ${entry.count} times`);
        }
        return;
    }
    const p = document.createElement('p');
    p.className = 'system-note';
    p.setAttribute('role', 'status');
    p.setAttribute('aria-live', 'polite');
    const textSpan = document.createElement('span');
    textSpan.innerHTML = wrapBilingualHtml(text);
    const countEl = document.createElement('span');
    countEl.className = 'sys-note-count';
    countEl.setAttribute('aria-hidden', 'true');
    p.append(textSpan, countEl);

    const container = getLiveSysNotesContainer();
    // Archive previous visible note into collapsed group
    const prevVisible = container.querySelector('.system-note:not(.sys-archived)');
    if (prevVisible) {
        // Remove archived note from dedup so duplicates create fresh visible notes
        for (const [k, entry] of _sysDedup) {
            if (entry.el === prevVisible) { _sysDedup.delete(k); break; }
        }
        prevVisible.classList.add('sys-archived');
        prevVisible.classList.remove('system-note');
        prevVisible.classList.add('collapsed-sys-item');
        let archive = container.querySelector('.collapsed-sys');
        if (!archive) {
            archive = document.createElement('details');
            archive.className = 'collapsed-sys';
            const summary = document.createElement('summary');
            summary.setAttribute('aria-label',
                'Mensajes del sistema anteriores. Presiona para expandir. · Earlier system messages. Press to expand.');
            summary.innerHTML =
                '<span class="collapsed-sys-label">Mensajes anteriores · Earlier messages</span>' +
                '<span class="collapsed-sys-hint">Mostrar · Show</span>';
            archive.appendChild(summary);
            container.insertBefore(archive, container.firstChild);
        }
        archive.appendChild(prevVisible);
    }
    container.appendChild(p);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
    _sysDedup.set(key, { count: 1, countEl, el: p });
}

// ── Technical-details panel ──────────────────────────────
// Collects system/status messages that are not student-facing.
// Rendered as a closed <details> at the bottom of the chat area.

function getSysTechPanel() {
    let panel = document.getElementById('sysTechPanel');
    if (!panel) {
        panel = document.createElement('details');
        panel.id = 'sysTechPanel';
        panel.className = 'sys-tech-panel';
        const summary = document.createElement('summary');
        summary.setAttribute('aria-label',
            'Detalles técnicos de la sesión. Presiona para expandir. · Session technical details. Press to expand.');
        summary.innerHTML =
            '<span class="sys-tech-label">Detalles técnicos · Technical details</span>' +
            '<span class="sys-tech-hint">Mostrar · Show</span>';
        const body = document.createElement('div');
        body.id = 'sysTechBody';
        body.className = 'sys-tech-body';
        panel.append(summary, body);
    }
    D.chatMessages.appendChild(panel); // always keep at bottom
    return panel;
}

const _techDedup = new Map();

function addToTechPanel(text) {
    getSysTechPanel();
    const body = document.getElementById('sysTechBody');
    const key = text.trim().slice(0, 100);
    if (_techDedup.has(key)) {
        const entry = _techDedup.get(key);
        entry.count++;
        if (entry.countEl) {
            entry.countEl.textContent = `×${entry.count}`;
            entry.countEl.setAttribute('aria-label', `Repeated ${entry.count} times`);
        }
        return;
    }
    const item = document.createElement('p');
    item.className = 'sys-tech-item';
    const label = document.createElement('span');
    label.className = 'sys-tech-item-label';
    label.textContent = text.split('\n')[0];
    const countEl = document.createElement('span');
    countEl.className = 'sys-tech-count';
    countEl.setAttribute('aria-hidden', 'true');
    item.append(label, countEl);
    body.appendChild(item);
    _techDedup.set(key, { count: 1, countEl, el: item });
}

function addSysTech(text) {
    addToTechPanel(text);
}

function showTyping(on) {
    D.typingRow.classList.toggle('on', on);
    if (on) D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
}

// ════════════════════════════════════════════════════════
//  DIRECT LINE API
// ════════════════════════════════════════════════════════
const DL = 'https://directline.botframework.com/v3/directline';

// Build channelData with full app context for AI stage awareness
function buildChannelData() {
    let maniSentence = '';
    try { maniSentence = localStorage.getItem('tupana_mani_sentence') || ''; } catch(e) {}
    return {
        app: 'tupana',
        stage: state.stage,
        stageId: getStageId(state.stage),
        stageName: STAGES[state.stage - 1] ? STAGES[state.stage - 1].es.replace('\n', ' ') + ' / ' + STAGES[state.stage - 1].en : '',
        draftSaved: state.draftSaved,
        maniDone: localStorage.getItem('tupana_mani_done') === 'true',
        labDone: localStorage.getItem('tupana_lab_done') === 'true',
        maniSentence: maniSentence.slice(0, 280),
        wordCount: D.draftArea ? D.draftArea.value.trim().split(/\s+/).filter(Boolean).length : 0,
        tone: state.tone
    };
}

// Send app-context event to the AI (stage changes, draft saves, onboarding completion)
async function sendAppEvent(eventName, eventValue) {
    if (!state.connected || !state.convId) return;
    try {
        await fetch(`${DL}/conversations/${state.convId}/activities`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${state.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'event',
                name: eventName,
                from: { id: CONFIG.userId, name: CONFIG.userName },
                value: eventValue,
                channelData: buildChannelData()
            })
        });
    } catch(err) { console.error('appEvent:', err); }
}


function setCoachMode(mode) {
    if (!['offline', 'ollama', 'gemini'].includes(mode)) mode = 'offline';
    state.coachMode = mode;
    localStorage.setItem('tupana_coach_mode', mode);

    // Sync toggle button states
    document.querySelectorAll('.coach-mode-btn').forEach(btn => {
        const on = btn.dataset.mode === mode;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', String(on));
    });

    const chatMessages  = document.getElementById('chatMessages');
    const typingRow     = document.getElementById('typingRow');
    const chatInputWrap = document.querySelector('.chat-input-wrap');

    if (mode === 'ollama') {
        // Local Ollama AI: native chat, direct browser-to-Ollama call, no iframe
        if (chatMessages)  chatMessages.style.display  = '';
        if (typingRow)     typingRow.style.display     = '';
        if (chatInputWrap) chatInputWrap.style.display = '';

        state.connected = true;
        D.chatStatus.innerHTML = '● <span class="show-es">Local · Ollama</span><span class="lang-sep"> · </span><span class="show-en">Local AI · Ollama</span>';
        D.chatStatus.classList.remove('idle');

    } else if (mode === 'gemini') {
        // Gemini via Cloudflare Worker proxy: native chat UI, no iframe
        if (chatMessages)  chatMessages.style.display  = '';
        if (typingRow)     typingRow.style.display     = '';
        if (chatInputWrap) chatInputWrap.style.display = '';

        state.connected = true;
        D.chatStatus.innerHTML = '● <span class="show-es">Gemini AI</span><span class="lang-sep"> · </span><span class="show-en">Gemini AI</span>';
        D.chatStatus.classList.remove('idle');

    } else {
        // Offline mode: native chat with built-in stage guidance
        if (chatMessages)  chatMessages.style.display  = '';
        if (typingRow)     typingRow.style.display     = '';
        if (chatInputWrap) chatInputWrap.style.display = '';
    }
}


async function initDL() {
    // ── Gemini mode — skip all remote provider initialization ──
    if (state.coachMode === 'gemini' && FEATURES.geminiProvider) {
        setCoachMode('gemini');
        return;
    }

    // ── Local Ollama mode — skip all remote provider initialization ──
    if (state.coachMode === 'ollama') {
        setCoachMode('ollama');
        return;
    }

    // ── DirectLine / offline fallback ──────────────────────────
    if (!CONFIG.directLineSecret) {
        D.setupBanner.classList.remove('hidden');
        D.chatStatus.textContent = 'Setup needed';
        D.chatStatus.classList.add('idle');
        showTyping(false);
        if (!state.offlineMsgShown) {
            state.offlineMsgShown = true;
            addMsg(
                'El coach en vivo aún no está conectado — el instructor necesita agregar la clave.\nCoach offline for now. Keep writing; your draft is safe.',
                'bot', false, 'system'
            );
        }
        return;
    }

    try {
        D.chatStatus.textContent = '● Conectando...';

        const tRes  = await fetch(`${DL}/tokens/generate`, {
            method:'POST', headers:{ Authorization:`Bearer ${CONFIG.directLineSecret}` }
        });
        const tData = await tRes.json();
        state.token = tData.token;

        const cRes  = await fetch(`${DL}/conversations`, {
            method:'POST', headers:{ Authorization:`Bearer ${state.token}` }
        });
        const cData = await cRes.json();
        state.convId    = cData.conversationId;
        state.connected = true;

        D.chatStatus.textContent = '● En línea · Online';
        D.sendBtn.disabled = false;
        D.stuckBtn.disabled = false;

        startPolling();

    } catch(err) {
        console.error(err);
        D.chatStatus.textContent = '● Error de conexión';
        D.chatStatus.classList.add('idle');
        showTyping(false);
        addMsg('Tuve un problema conectándome. Verifica la configuración.\nThere was a connection error. Please check the setup.', 'bot');
    }
}

async function sendMsg(text) {
    if (!state.connected || state.waiting) return;
    if (text !== '__INIT__') {
        addMsg(text, 'user');
        logProcessEvent('coach_message_sent', 'Student sent message to coach.');
    }
    state.waiting = true;
    showTyping(true);
    D.sendBtn.disabled = true;

    // Ollama local AI mode: raw text via shared generateCoachResponse()
    if (state.coachMode === 'ollama') {
        try {
            const reply = await generateCoachResponse({ prompt: text });
            if (reply) addMsg(reply, 'bot');
        } catch(err) {
            console.error('ollama:', err);
            addMsg(getOllamaFriendlyError(err), 'bot');
        } finally {
            showTyping(false);
            state.waiting = false;
            D.sendBtn.disabled = false;
        }
        return;
    }

    // Gemini via Cloudflare Worker proxy
    if (state.coachMode === 'gemini') {
        try {
            const _gLang    = getCurrentCoachLanguageLabel();
            const _gCtx     = buildChannelData();
            const _gRemind  = (_gCtx.stageId === 'stage.voice_polish')
                ? '[STAGE 8 — VOICE POLISH: Do NOT write any version of the student\'s sentence. Do not produce replacement prose, partial rewrites, or "for example" sentences. Quote the student\'s exact words only. Ask questions and name the revision route.]\n\n'
                : '';
            const geminiPrompt =
                buildOllamaSystemPrompt(_gLang) +
                '\n\n---\n\n' +
                _gRemind +
                'Current interface language: ' + _gLang +
                '\n\nCurrent Tu Pana context:\n' + JSON.stringify(_gCtx, null, 2) +
                '\n\nStudent message:\n' + text +
                '\n\nRespond as Tu Pana de Escritura following the stage-specific rules and the language rule above.';
            const reply = await generateCoachResponse({ prompt: geminiPrompt, stageId: state.stage });
            if (reply) addMsg(reply, 'bot');
        } catch(err) {
            console.error('gemini:', err);
            addMsg('El coach Gemini no está disponible en este momento. / Gemini coach is unavailable right now.', 'bot');
        } finally {
            showTyping(false);
            state.waiting = false;
            D.sendBtn.disabled = false;
        }
        return;
    }

    try {
        await fetch(`${DL}/conversations/${state.convId}/activities`, {
            method:'POST',
            headers:{ Authorization:`Bearer ${state.token}`, 'Content-Type':'application/json' },
            body: JSON.stringify({
                type:'message',
                from:{ id: CONFIG.userId, name: CONFIG.userName },
                text: text === '__INIT__' ? '' : text,
                channelData: buildChannelData()
            })
        });
    } catch(err) {
        console.error(err);
        showTyping(false);
        state.waiting = false;
        D.sendBtn.disabled = false;
    }
}

// ════════════════════════════════════════════════════════
//  LOCAL OLLAMA PROVIDER
//  callLocalCoachProvider() is the single entry point.
//  To migrate to a local proxy later, either change CONFIG.ollamaUrl
//  or replace callOllamaDirect() with callLocalProxy() — nothing else changes.
// ════════════════════════════════════════════════════════

function getCurrentCoachLanguageLabel() {
    if (state.lang === 'en')   return 'English';
    if (state.lang === 'both') return 'Bilingual (Spanish and English)';
    return 'Spanish';
}

function getLastBotMessage() {
    try {
        const log = JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || '[]');
        for (let i = log.length - 1; i >= 0; i--) {
            const e = log[i];
            if (e.who === 'bot' && e.msgType !== 'welcome' && e.msgType !== 'system') {
                return e.text || '';
            }
        }
    } catch(e) {}
    return '';
}

function buildOllamaSystemPrompt(lang) {
    // Derive stage-specific rules from the active genre template.
    // Swapping templates automatically updates coaching rules for the new genre.
    const _stageRules = getActiveTemplate().stages
        .map(s => `Stage ${s.number}: ${s.coachFocus}`)
        .join('\n');

    return `You are Tu Pana de Escritura, a bilingual writing-process coach for multilingual students writing autobiographical mixed-genre essays.

You help students think, revise, reflect, and improve their own writing. The student writes first; you respond second.

ABSOLUTE AUTHORSHIP RULE — this overrides everything else:
Do not produce any sentence, phrase, outline item, paragraph, bridge sentence, thesis sentence, introduction sentence, conclusion sentence, topic sentence, or revised sentence that could be copied into the student's essay.
This rule applies even when:
- the student asks for an example;
- the student asks you to rewrite;
- the student asks you to make it sound academic;
- the student asks for an outline;
- the student asks for a stronger version;
- the student asks for a sentence starter;
- you are tempted to say "For example."
Never write "For example:" or "Example:" or "for example" followed by student-like content. Use blanks or questions instead.
Never provide sample autobiographical content such as:
"Growing up..." / "My family's journey..." / "When my abuela..." / "I remember..." / "This shaped who I am..."
If your response includes quotation marks around a full sentence that you generated, you are probably violating this rule. Only quote the student's own words when referring to them.
You may provide only:
- questions the student can answer;
- blank frames with blanks only (no student content inserted);
- checklists of what the student's own sentence should do;
- descriptions of rhetorical moves without wording them as sentences;
- names of rhetorical strategies;
- feedback about what is working and what needs more specificity.

You must not write the student's work for them. Never produce full essays, full drafts, full paragraphs, introductions, conclusions, outlines, citations, bibliographies, self-assessments, or process reports for the student.

NO SAMPLE STUDENT PROSE — this is mandatory:
Do not provide example sentences, model sentences, sample introductions, sample conclusions, sample paragraphs, thesis statements, bridge sentences, topic sentences, or polished replacement wording that the student could copy directly into the essay.
When a student asks you to write, rewrite, translate into polished prose, make it sound academic, or provide an example sentence, do not give copy-ready wording. Do not include a sample sentence after refusing.
Instead, give one or more of:
- a question the student can answer in their own words;
- a sentence frame with blanks only (e.g., "When I think about ___, I remember ___ because ___");
- a checklist of what the student's own sentence should include;
- a description of the rhetorical move the sentence needs to make;
- two or three options for what the sentence could *do*, described in terms of strategy, not exact wording.

SENTENCE-FRAME RULE — this is mandatory:
Sentence frames must use blanks only. Do not insert the student's specific words, names, phrases, or content into a frame.
Not acceptable: "When I think about entering a new chapter in my life, I remember my abuela saying, 'mijo, no te dejes,' because ___."
Acceptable: "When I think about ___, I remember ___ because ___."
The goal is to help the student generate their own words, not to hand them a sentence that is already most of the way written.

RESEARCH AND CITATION RULE — this is mandatory:
You must never invent sources, article titles, book titles, authors, journals, publishers, dates, page numbers, quotations, URLs, or DOIs.
If the student asks for sources, citations, bibliography entries, article recommendations, or scholarly references, do not provide fabricated citations — not even as examples, not even labeled as hypothetical, not even framed as "what a citation might look like."
Explicitly forbidden — never produce any response in this format, in any language:
  Autor: [name] / Título: [title] / Revista: [journal] / Año: [year]
  Author: [name] / Title: [title] / Journal: [journal] / Year: [year]
  Any formatted entry that resembles a bibliography, works-cited list, or reference list entry.
Instead, provide:
- search keywords and ready-to-use search strings;
- database suggestions (e.g., library catalog, JSTOR, Google Scholar, ProQuest, ERIC, WorldCat);
- source types to look for (e.g., oral history archives, government reports, news journalism, ethnographies);
- questions to guide the research process;
- advice on how to evaluate whether a source is credible.
You may name broad, real, well-known databases or tools, but do not claim that a specific article exists. This app has no verified source data.
If the student asks for "three scholarly sources," respond with three search strings or search strategies, not three citations.
If the student pastes a real source — providing the actual title, actual author, actual journal, actual year, and actual DOI or URL — you may help them check or format that citation using only the details they provided. Never invent or fill in any field the student did not supply.

OUTLINE RULE — this is mandatory:
Do not create a completed outline for the student. Do not write section titles with instructional descriptions.
If the student asks you to make an outline, ask them to draft their own first, or provide a blank scaffold where every slot is a ___ or a question only.
Do not write "For example:" or "Example:" followed by any content.
Not allowed — section label with any description or instruction:
  "Introduction: Introduce the memory and its significance."
  "Body Paragraph 1: Describe the memory in detail."
  "Conclusion: Reflect on what this experience means to you."
Not allowed — any sample autobiographical phrase in an outline:
  "Growing up, my family's journey..."
Not allowed — any scaffold item where you have filled in the content or instruction.
Allowed only:
  "Memory: ___ / Larger issue: ___ / Research direction: ___ / Reflection: ___"
  Or: ask the student to name one idea for each section themselves.
If you are about to write any label followed by a colon and an explanation, stop and replace it with ___ or a question the student answers.

OUTLINE EXAMPLE BAN — this is mandatory:
When responding to an outline request, do not use the word "example" followed by any filled-in content.
Do not provide sample titles, sample memories, sample larger issues, sample research directions, or sample reflections.
Do not provide slash-separated filled examples.
Not allowed: "The Cultural Dance of My Mother / Maintaining Traditions in the Diaspora / How dance connects families across generations / Personal insights on cultural preservation"
Not allowed: "Growing up between two cultures..."
Not allowed: any filled-in outline item, no matter how generic.
Allowed scaffold:
  Title: ___
  Memory: ___
  Larger issue: ___
  Research direction: ___
  Reflection: ___
Allowed questions:
  What title might fit your memory?
  What memory will open the essay?
  What larger issue does that memory connect to?
  What research direction could help you understand that issue?
  What reflection will close the essay?

REVIEW/REWRITE RULE — this is mandatory:
When the student asks you to review, revise, rewrite, improve, polish, strengthen, clarify, or make something more academic, do not provide a rewritten version.
Instead:
1. Name one specific strength in the student's own sentence.
2. Ask one or two questions that help the student identify what to improve.
3. Suggest what kind of detail the student could add in their own words.
4. Optionally provide a blank frame with blanks only.
Do not write a replacement sentence. Do not write "try this version." Do not write "for now, let's try rewriting it as..." Do not paraphrase or polish the student's sentence.

Your role is to ask questions, identify possibilities, give targeted feedback, and support revision without replacing the student's authorship.

VOICE POLISH RULE — Stage 8 specific, this is mandatory:
At Stage 8 (Voice Polish), when a student pastes a sentence and asks you to polish, improve, clarify, make it more specific, or keep their voice, do not provide a rewritten sentence, a polished alternative, a translated rephrasing, or any finished prose the student could copy and paste in place of their own.
Forbidden in Stage 8:
  "Here is a better version: ..."
  "Try this instead: ..."
  "You could say: ..."
  "Al ver por primera vez..." or any full sentence written in the student's voice that substitutes for theirs.
  Any complete sentence that reads as finished writing, even if labeled as an example or suggestion.
  Any partial sentence that begins with the student's words and ends with new descriptive content you invented (e.g., inserting "keeping a secret," "overwhelmed," "disconnected," or any new phrase or adjective into the student's sentence structure).
  Any modified or paraphrased version of the student's sentence, even if labeled a "frame" or "example."
  Taking the student's opening words and adding or substituting new content — this is rewriting, even if done partially.
When referring to the student's sentence, quote it exactly using quotation marks, or describe it as "your sentence about ___." Do not produce a version of it with any word changed or added.
Allowed in Stage 8:
  Name one specific strength in the student's own sentence.
  Ask one or two questions about what the sentence could show more clearly.
  Name the type of detail the sentence could add — sensory, historical, emotional, specific.
  Offer a blank frame with placeholders only and no student content: "When I saw ___, I felt ___ because ___."
  Explain why a specific word or phrase in the student's sentence is working (quote their exact phrase).
  Name the revision route — "make it more specific" / "protect this phrase" — but do not execute the revision.
The student writes the revision. The coach identifies the route.

PERSONA BOUNDARIES — this is mandatory:
Stay entirely focused on the student's writing task and the current stage. Do not mention food, beverages, coffee, café, or daily routines. Do not open or close responses with social pleasantries unrelated to writing ("Hope your day is going well," "Have a coffee and try again," etc.). If the student is stuck or frustrated, respond by making the task smaller — one sentence, one question, one specific detail — not by making casual references. Every sentence in your response should advance the student's writing work.

ANTI-REPETITION RULE — this is mandatory:
Before responding, consider what has already been discussed. Do not repeat a question you have already asked. Do not give the same checklist or framework twice. If the student has already answered a question, acknowledge their answer and move forward. When giving feedback, reference specific words or phrases from what the student actually wrote — not a generic version of their stage. If the response you are about to give could apply to any student at any stage, it is too generic: make it specific to this student's actual message.

LANGUAGE RULE — this is mandatory:
The current interface language is: ${lang}
Respond in ${lang} unless one of these specific exceptions applies:
- The student explicitly asks for a translation or an English/Spanish version of your response.
- The student asks for bilingual help or code-switching support.
- The stage prompt specifically invites bilingual reflection.
Do NOT default to Spanish simply because the app is bilingual or the student's writing contains Spanish words.
When the student writes in a mixed-language style, preserve their multilingual phrasing, but keep your coaching explanation in ${lang}.
If the student asks for an English or Spanish version of your previous response, restate or translate your immediately previous coaching response. Do not invent a new student anecdote or example.

Stage-specific rules:
${_stageRules}

Style: Be warm, direct, and encouraging. Use clear language. Preserve the student's linguistic identity. Prefer questions, checklists, and targeted feedback over rewriting. Keep responses concise unless the student asks for more detail.`;
}

async function callOllamaDirect({ text, context, baseUrl, model, lang, prevBotMsg }) {
    const url = baseUrl.replace(/\/$/, '') + '/api/chat';
    const messages = [
        { role: 'system', content: buildOllamaSystemPrompt(lang) }
    ];
    if (prevBotMsg) {
        messages.push({ role: 'assistant', content: prevBotMsg });
    }
    const _stageReminder = (context && context.stageId === 'stage.voice_polish')
        ? '[STAGE 8 — VOICE POLISH: Do NOT write any version of the student\'s sentence. Do not produce replacement prose, partial rewrites, or "for example" sentences. Quote the student\'s exact words only. Ask questions and name the revision route.]\n\n'
        : '';
    messages.push({
        role: 'user',
        content:
            _stageReminder +
            'Current interface language: ' + lang +
            '\n\nCurrent Tu Pana context:\n' + JSON.stringify(context, null, 2) +
            '\n\nStudent message:\n' + text +
            '\n\nRespond as Tu Pana de Escritura following the stage-specific rules and the language rule above.'
    });
    const promptChars = messages.reduce((n, m) => n + m.content.length, 0);
    const t0 = performance.now();
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            stream:     false,
            keep_alive: CONFIG.ollamaKeepAlive || '10m',
            options:    CONFIG.ollamaOptions   || { temperature: 0.4, top_p: 0.85, num_predict: 400, num_ctx: 4096 },
            messages
        })
    });
    if (!res.ok) throw new Error('ollama_http_' + res.status);
    const data = await res.json();
    const reply = (data.message && data.message.content) ? data.message.content : '';
    if (location.search.includes('dev=true')) {
        console.info('[Tu Pana Ollama]', {
            ms:            Math.round(performance.now() - t0),
            model:         CONFIG.ollamaModel,
            promptChars,
            responseChars: reply.length
        });
    }
    return reply;
}

async function callLocalCoachProvider(text) {
    const context    = buildChannelData();
    const lang       = getCurrentCoachLanguageLabel();
    const prevBotMsg = getLastBotMessage();
    return callOllamaDirect({
        text,
        context,
        baseUrl: CONFIG.ollamaUrl,
        model:   CONFIG.ollamaModel,
        lang,
        prevBotMsg
    });
}

function getOllamaFriendlyError(err) {
    const msg = (err && err.message) ? err.message : '';
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
        return 'El coach local no está disponible. Abre Ollama o ejecuta `ollama serve`, luego intenta de nuevo.\nLocal AI is not running yet. Open Ollama or run `ollama serve`, then try again.';
    }
    if (msg === 'ollama_http_404') {
        return 'El modelo local no está instalado. Ejecuta `ollama pull qwen2.5:7b` en tu terminal y vuelve a intentar.\nThe local model may not be installed. Try running `ollama pull qwen2.5:7b`, then try again.';
    }
    if (msg.startsWith('ollama_http_')) {
        return 'El coach local respondió con un error inesperado. Revisa la consola para más detalles.\nThe local AI returned an unexpected error. Check the browser console for details.';
    }
    return 'El coach local tuvo un problema. Intenta de nuevo.\nLocal AI encountered a problem. Please try again.';
}

// Stage 10 provider-specific coach perspective can be routed through Ollama in a later phase.

function startPolling() {
    state.pollTimer = setInterval(async () => {
        if (!state.connected) return;
        try {
            const url = `${DL}/conversations/${state.convId}/activities` +
                        (state.watermark ? `?watermark=${state.watermark}` : '');
            const res  = await fetch(url, { headers:{ Authorization:`Bearer ${state.token}` }});
            const data = await res.json();
            state.watermark = data.watermark;

            const botMsgs = (data.activities || []).filter(
                a => a.type === 'message' && a.from.id !== CONFIG.userId
            );
            if (botMsgs.length) {
                showTyping(false);
                state.waiting = false;
                D.sendBtn.disabled = false;
                if (state.coachPerspectiveCallback) {
                    const cb = state.coachPerspectiveCallback;
                    state.coachPerspectiveCallback = null;
                    cb(botMsgs[0].text || '');
                    botMsgs.slice(1).forEach(m => { if (m.text) addMsg(m.text, 'bot'); });
                } else {
                    botMsgs.forEach(m => { if (m.text) addMsg(m.text, 'bot'); });
                }
            }
        } catch(err) { console.error('poll:', err); }
    }, 1200);
}

// ════════════════════════════════════════════════════════
//  CHAT INPUT
// ════════════════════════════════════════════════════════
D.chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 110) + 'px';
    D.sendBtn.disabled = !this.value.trim() || !state.connected || state.waiting;
});

D.chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitChat(); }
});
D.sendBtn.addEventListener('click', submitChat);

// Global keyboard shortcuts
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        // Dismiss spotlight before other modal checks
        if (state.spotlightTarget === 'coach') { dismissCoachSpotlight(); return; }
        if (state.spotlightTarget === 'editor') { dismissEditorSpotlight(); return; }
        // Never close the stage preview modal via Escape — student must read and click Continue
        if (D.stagePreviewBg.classList.contains('on')) return;
        // Close save ceremony modal
        D.modalBg.classList.remove('on');
        D.confirmBg.classList.remove('on');
        document.getElementById('labBg').classList.remove('on');
        document.getElementById('maniBg').classList.remove('on');
        document.getElementById('reportBg').classList.remove('on');
        if (D.pnModalBg) D.pnModalBg.classList.remove('on');
        if (D.completionBg) D.completionBg.classList.remove('on');
        // Exit focus mode
        const workspace = document.querySelector('.workspace');
        if (workspace && workspace.classList.contains('focus-mode')) {
            toggleFocusMode();
        }
    }
});

function submitChat() {
    const t = D.chatInput.value.trim();
    if (!t || D.sendBtn.disabled) return;
    D.chatInput.value = '';
    D.chatInput.style.height = 'auto';
    D.sendBtn.disabled = true;
    sendCoachMessage({ message: t, stageId: getStageId(state.stage) });
}

// ════════════════════════════════════════════════════════
//  SELECTION-TO-COACH
//  Floating action appears when text is selected in the
//  draft editor. Inserts selected text into chat input
//  with stage-aware framing. Never auto-sends.
// ════════════════════════════════════════════════════════
(function initSelectionToCoach() {
    const btn = document.createElement('button');
    btn.id    = 'sendSelToCoachBtn';
    btn.className = 'sel-to-coach-btn';
    btn.setAttribute('aria-label', 'Enviar texto seleccionado al coach · Send selected text to coach');
    btn.innerHTML =
        '<span class="show-es">Enviar al coach</span>' +
        '<span class="lang-sep"> · </span>' +
        '<span class="show-en">Send to Coach</span>';
    btn.style.display = 'none';
    document.body.appendChild(btn);

    // Stage-aware framing — never asks the coach to rewrite
    const FRAMES = {
        2: 'Can you help me connect this to a larger issue — without rewriting it?\n\n',
        3: 'Can you help me check the tension or argument here — without rewriting it?\n\n',
        4: 'Can you help me turn this into search terms or source types? Do not invent sources or citations.\n\n',
        7: 'Can you help me revise this passage — without rewriting it for me?\n\n',
        8: 'Can you help me polish this sentence — without giving me a replacement version?\n\n',
        9: 'Can you help me check this before my final reflection?\n\n',
    };
    const DEFAULT_FRAME = 'Can you help me think about this — without rewriting it?\n\n';

    function getFrame()        { return FRAMES[state.stage] || DEFAULT_FRAME; }
    function getSelectedText() {
        return D.draftArea.value.substring(
            D.draftArea.selectionStart,
            D.draftArea.selectionEnd
        ).trim();
    }

    function positionBtn() {
        const rect = D.draftArea.getBoundingClientRect();
        const bw   = btn.offsetWidth || 160;
        btn.style.top  = (rect.top + 8) + 'px';
        btn.style.left = Math.max(8, rect.right - bw - 8) + 'px';
    }

    let _pendingSel = '';

    function showBtn(sel) {
        _pendingSel = sel;
        btn.style.display = '';
        requestAnimationFrame(positionBtn);   // measure after paint so offsetWidth is real
    }

    function hideBtn() { btn.style.display = 'none'; _pendingSel = ''; }

    function onSelChange() {
        const sel = getSelectedText();
        sel.length > 0 ? showBtn(sel) : hideBtn();
    }

    D.draftArea.addEventListener('mouseup', onSelChange);
    D.draftArea.addEventListener('keyup',   onSelChange);

    // Delay hide so click on the button fires before blur hides it
    let _hideTimer = null;
    D.draftArea.addEventListener('blur',   () => { _hideTimer = setTimeout(hideBtn, 200); });
    btn.addEventListener('mousedown', () => clearTimeout(_hideTimer));
    btn.addEventListener('focus',     () => clearTimeout(_hideTimer));
    btn.addEventListener('blur', hideBtn);

    btn.addEventListener('click', () => {
        const sel = _pendingSel || getSelectedText();
        if (!sel) return;
        D.chatInput.value = getFrame() + '“' + sel + '”';
        D.chatInput.dispatchEvent(new Event('input'));  // update send-btn state + height
        hideBtn();
        if (window.innerWidth <= 480) switchMobileTab('chat');
        D.chatInput.focus();
    });

    // Reposition if window resizes while button is visible
    window.addEventListener('resize', () => { if (btn.style.display !== 'none') positionBtn(); });
})();

// ════════════════════════════════════════════════════════
//  PER-STAGE WRITING STORAGE
//  Each stage saves its textarea content independently.
//  Stage 6 also writes to tupana_draft (authorship gate).
//  Stages 7–10 seed from tupana_draft when no stage-specific
//  content exists yet (first time the student reaches revision).
// ════════════════════════════════════════════════════════
function saveStageWork(stageNum, text) {
    try { localStorage.setItem(`tupana_writing_s${stageNum}`, text); } catch(e) {}
}

function loadStageWork(stageNum) {
    try {
        const perStage = localStorage.getItem(`tupana_writing_s${stageNum}`);
        if (perStage !== null) return perStage;
        // Stages 6+: fall back to saved first draft (backward compat + revision seeding)
        if (stageNum >= 6) return localStorage.getItem('tupana_draft') || '';
        return '';
    } catch(e) { return ''; }
}

// ════════════════════════════════════════════════════════
//  PROCESS LOG — structured event writer
//  Key and schema defined in genre-template.js (PROCESS_LOG_KEY).
//  Called at each of the 8 core pilot-evidence events.
// ════════════════════════════════════════════════════════
function logProcessEvent(actionType, summary) {
    try {
        const log = JSON.parse(localStorage.getItem(PROCESS_LOG_KEY) || '[]');
        log.push({
            timestamp:   new Date().toISOString(),
            stageId:     getStageId(state.stage),
            stageNumber: state.stage,
            actionType:  actionType,
            summary:     summary
        });
        localStorage.setItem(PROCESS_LOG_KEY, JSON.stringify(log));
    } catch(e) {}
}

// ════════════════════════════════════════════════════════
//  RESTORE DRAFT
// ════════════════════════════════════════════════════════
function restoreDraft() {
    try {
        // Load stage-specific content for the current stage
        const stageContent = loadStageWork(state.stage);
        if (stageContent) D.draftArea.value = stageContent;

        // Restore authorship gate UI state if first draft was saved
        if (localStorage.getItem('tupana_draft_saved') === 'true') {
            state.draftSaved = true;
            D.saveBtn.classList.add('saved');
            D.saveBtnLabel.textContent = 'Primer borrador guardado · First draft saved';
            D.savedNotice.classList.add('on');
            const w = D.draftArea.value.trim().split(/\s+/).filter(Boolean).length;
            D.wordCount.innerHTML = `<span class="show-es">${w} palabras</span><span class="lang-sep"> · </span><span class="show-en">words</span>`;
            renderDecisionLog();
            if (state.stage >= 6) {
                addSys('↩ Borrador anterior restaurado · Previous draft restored from this device.');
            }
        }
    } catch(e) {}
    updateDraftControls();
}

// ════════════════════════════════════════════════════════
//  TU CONOCIMIENTO — identity affirmation
// ════════════════════════════════════════════════════════
let maniClaimed = 0;
const MANI_TOTAL = 5;

const MANI_ASSET_DEFS = {
    languages: {
        nameEn: 'My Language(s)', nameEs: 'Mis Idiomas',
        toastEn: 'This helps protect your voice during revision.',
        toastEs: 'Esto ayuda a proteger tu voz durante la revisión.'
    },
    community: {
        nameEn: 'My Community', nameEs: 'Mi Comunidad',
        toastEn: 'Your writing now has a clearer social context.',
        toastEs: 'Tu escritura ahora tiene un contexto social más claro.'
    },
    journey: {
        nameEn: 'My Journey', nameEs: 'Mi Trayectoria',
        toastEn: 'Your lived experience is part of your evidence.',
        toastEs: 'Tu experiencia vivida es parte de tu evidencia.'
    },
    positionality: {
        nameEn: 'Positionality', nameEs: 'Mi Posicionalidad',
        toastEn: 'Your perspective is now visible in the writing process.',
        toastEs: 'Tu perspectiva ahora es visible en el proceso de escritura.'
    },
    story: {
        nameEn: 'Story as Evidence', nameEs: 'Mi Historia como Evidencia',
        toastEn: 'Your story now has a stronger role in your argument.',
        toastEs: 'Tu historia ahora tiene un papel más fuerte en tu argumento.'
    }
};

const MANI_SUMMARIES = [
    'These claims help the coach protect your voice. · Estas reclamaciones ayudan al coach a proteger tu voz.',
    'These claims help the coach protect your voice. · Estas reclamaciones ayudan al coach a proteger tu voz.',
    'Your revision lens is getting stronger. · Tu lente de revisión se fortalece.',
    'Your revision lens is getting stronger. · Tu lente de revisión se fortalece.',
    'Almost there — one more to strengthen your foundation. · Casi llegas — una más para fortalecer tu base.',
    'You have built a strong foundation for revising with your own judgment. · Has construido una base sólida para revisar con tu propio criterio.'
];

function getClaimedAssets() {
    try {
        const raw = localStorage.getItem('tupana_mani_claimed');
        if (raw) return JSON.parse(raw);
    } catch(e) {}
    return [];
}

function saveClaimedAssets(arr) {
    try { localStorage.setItem('tupana_mani_claimed', JSON.stringify(arr)); } catch(e) {}
}

function updateManiCounter(count) {
    const counter = document.getElementById('maniCounter');
    const btn     = document.getElementById('maniProceedBtn');
    const note    = document.getElementById('maniFreireNote');
    const card    = document.getElementById('maniCard');
    const summary = MANI_SUMMARIES[count] || MANI_SUMMARIES[0];

    if (count === MANI_TOTAL) {
        counter.classList.add('all');
        counter.textContent = `All ${MANI_TOTAL} claimed · Las ${MANI_TOTAL} reclamadas — ${summary}`;
        btn.classList.add('on');
        note.classList.add('on');
        card.classList.add('all-claimed');
        try { localStorage.setItem('tupana_mani_done', 'true'); } catch(e) {}
    } else {
        counter.classList.remove('all');
        counter.textContent = `${count} of ${MANI_TOTAL} claimed · ${count} de ${MANI_TOTAL} reclamados — ${summary}`;
        btn.classList.remove('on');
        note.classList.remove('on');
        card.classList.remove('all-claimed');
    }

    counter.classList.remove('pulse');
    void counter.offsetWidth;
    counter.classList.add('pulse');
    setTimeout(() => counter.classList.remove('pulse'), 900);
}

function showClaimToast(assetKey) {
    const def = MANI_ASSET_DEFS[assetKey];
    if (!def) return;
    const toast = document.getElementById('maniClaimToast');
    toast.innerHTML = `<strong>You claimed ${def.nameEn} · Reclamaste ${def.nameEs}</strong><br>${def.toastEn}<br>${def.toastEs}`;
    toast.classList.add('on');
    setTimeout(() => toast.classList.remove('on'), 3200);
}

function claimAsset(el) {
    if (el.classList.contains('claimed')) return;
    const assetKey = el.getAttribute('data-asset');
    if (!assetKey) return;

    el.classList.add('claimed');
    el.setAttribute('aria-label', `${MANI_ASSET_DEFS[assetKey].nameEn}, claimed · ${MANI_ASSET_DEFS[assetKey].nameEs}, reclamado`);

    const claimed = getClaimedAssets();
    if (!claimed.includes(assetKey)) {
        claimed.push(assetKey);
        saveClaimedAssets(claimed);
    }

    maniClaimed = claimed.length;
    updateManiCounter(maniClaimed);
    showClaimToast(assetKey);
}

function restoreManiClaims() {
    const claimed = getClaimedAssets();
    maniClaimed = claimed.length;
    const grid = document.getElementById('maniGrid');
    if (!grid) return;

    claimed.forEach(key => {
        const el = grid.querySelector(`.mani-asset[data-asset="${key}"]`);
        if (el) {
            el.classList.add('claimed');
            el.setAttribute('aria-label', `${MANI_ASSET_DEFS[key].nameEn}, claimed · ${MANI_ASSET_DEFS[key].nameEs}, reclamado`);
        }
    });

    updateManiCounter(maniClaimed);
}

function handleManiKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        claimAsset(e.currentTarget);
    }
}

function showLandingMoment() {
    const overlay = document.createElement('div');
    overlay.id = 'landingMoment';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:999;
        background: linear-gradient(135deg, #2A211C 0%, #1C1410 100%);
        display:flex; align-items:center; justify-content:center;
        opacity:0; transition: opacity 0.6s ease;
        padding: 40px 24px; text-align: center;
    `;
    overlay.innerHTML = `
        <div style="max-width:560px;">
            <div style="font-family:'Literata',Georgia,serif; font-size:2.0rem; font-style:italic; color:#F0EBE3; line-height:1.4; margin-bottom:20px;">
                "Tu historia es donde comienza el argumento."
            </div>
            <div style="font-family:'Source Sans 3',system-ui,sans-serif; font-size:1.05rem; color:#B0A898; letter-spacing:0.04em; margin-bottom:32px;">
                "Your story is where the argument begins."
            </div>
            <button id="landingContinueBtn" style="
                font-family:'Source Sans 3',system-ui,sans-serif; font-size:0.95rem; font-weight:600;
                background: rgba(184,92,26,0.85); color:#fff; border:none; border-radius:40px;
                padding: 10px 28px; cursor:pointer; letter-spacing:0.03em;
                transition: background 0.2s ease;
            " aria-label="Continuar · Continue">
                Continuar · Continue
            </button>
        </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    function dismissLanding() {
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.remove(); openMani(); }, 600);
    }

    // Manual dismiss via button
    const btn = overlay.querySelector('#landingContinueBtn');
    if (btn) btn.addEventListener('click', dismissLanding);

    // Auto-dismiss after 5 s if student does not click
    setTimeout(dismissLanding, 5000);
}

function showWelcomeBack() {
    if (state.welcomeShown) return;
    state.welcomeShown = true;

    let stage = 1;
    try { stage = parseInt(localStorage.getItem('tupana_stage') || '1', 10) || 1; } catch(e) {}
    const stageName = (STAGES.find(s => s.id === stage) || STAGES[0]);
    const draftSaved = localStorage.getItem('tupana_draft_saved') === 'true';
    const draftWords = (() => {
        try {
            const d = localStorage.getItem('tupana_draft') || '';
            return d.trim().split(/\s+/).filter(Boolean).length;
        } catch(e) { return 0; }
    })();
    const sessionInfo = trackSession();
    const isReturn = sessionInfo.total > 1;

    const greeting = isReturn
        ? `¡Bienvenido/a de vuelta! — Etapa ${stage}: ${stageName.es}\nWelcome back — Stage ${stage}: ${stageName.en}`
        : `¡Hola! Tu Pana de Escritura está aquí — Etapa ${stage}: ${stageName.es}\nHello! Tu Pana is here — Stage ${stage}: ${stageName.en}`;

    let draftLine = '';
    if (draftSaved && draftWords > 0) {
        draftLine = `\n\nBorrador guardado · Draft saved: ${draftWords} ${draftWords === 1 ? 'palabra · word' : 'palabras · words'}.`;
        draftLine += t(
            '\nContinúa revisando — tu historia sigue aquí.',
            '\nKeep revising — your story is still here.'
        );
    } else if (draftWords > 0) {
        draftLine = `\n\n${draftWords} ${draftWords === 1 ? 'palabra en progreso · word in progress' : 'palabras en progreso · words in progress'}.`;
        draftLine += t(
            '\nSigue escribiendo en tu propia voz.',
            '\nKeep writing in your own voice.'
        );
    } else {
        draftLine = t(
            '\n\nEmpieza en el panel de la izquierda — tus palabras primero.\nStart in the left panel — your words first.',
            '\n\nStart writing in the left panel.\nYour words first — then bring your questions.'
        );
    }

    let humorLine = '';
    if (isReturn) {
        const humor = pickHumor('welcome_multi');
        if (humor) humorLine = `\n\n${humor}`;
    }

    addMsg(greeting + draftLine + humorLine, 'bot', false, 'welcome');
}

function openMani() {
    document.getElementById('maniBg').classList.add('on');
    restoreManiClaims();
    // attach keyboard listeners once
    const grid = document.getElementById('maniGrid');
    if (grid) {
        grid.querySelectorAll('.mani-asset:not([data-mani-key])').forEach(el => {
            el.setAttribute('data-mani-key', '1');
            el.addEventListener('keydown', handleManiKey);
        });
    }
}

function maniProceed() {
    document.getElementById('maniBg').classList.remove('on');
    // Notify AI of Tu Conocimiento completion
    let maniSentence = '';
    try { maniSentence = localStorage.getItem('tupana_mani_sentence') || ''; } catch(e) {}
    sendAppEvent('tuConocimientoComplete', {
        maniDone: true,
        maniSentence: maniSentence.slice(0, 280)
    });
    // short pause then open El Laboratorio
    setTimeout(() => {
        if (localStorage.getItem('tupana_lab_done') !== 'true') openLab();
    }, 350);
}

// ── Tu Conocimiento writing prompt ──
const maniPromptInput = document.getElementById('maniPromptInput');
const maniPromptSaved = document.getElementById('maniPromptSaved');
let maniPromptSaveTimer = null;

function initManiPrompt() {
    try {
        const saved = localStorage.getItem('tupana_mani_sentence');
        if (saved && maniPromptInput) maniPromptInput.value = saved;
    } catch(e) {}
}

if (maniPromptInput) {
    maniPromptInput.addEventListener('input', () => {
        const text = maniPromptInput.value.trim();
        try {
            localStorage.setItem('tupana_mani_sentence', maniPromptInput.value);
        } catch(e) {}
        if (text.length > 0) {
            maniPromptSaved.classList.add('on');
            clearTimeout(maniPromptSaveTimer);
            maniPromptSaveTimer = setTimeout(() => {
                maniPromptSaved.classList.remove('on');
            }, 2000);
        } else {
            maniPromptSaved.classList.remove('on');
        }
    });
}

// ════════════════════════════════════════════════════════
//  EL LABORATORIO — onboarding wizard
// ════════════════════════════════════════════════════════
const LAB_TOTAL_STEPS = 4;   // 0=welcome, 1=read, 2=questions, 3=summary
let labCurrent = 0;
let labAnswers  = { 1: null, 2: null, 3: null, 4: null, 5: null };

function buildLabProgress() {
    const wrap = el('labProgress');
    wrap.innerHTML = '';
    for (let i = 0; i < LAB_TOTAL_STEPS; i++) {
        const d = document.createElement('div');
        d.className = 'lab-dot' + (i < labCurrent ? ' done' : i === labCurrent ? ' active' : '');
        wrap.appendChild(d);
    }
}

function labShowStep(n) {
    document.querySelectorAll('.lab-step').forEach(s => s.classList.remove('on'));
    const step = el('labStep' + n);
    if (step) step.classList.add('on');
    labCurrent = n;
    buildLabProgress();

    // scroll lab body to top
    el('labBody').scrollTop = 0;

    const btn = el('labNextBtn');
    const skip = el('labSkip');

    if (n === 0) {
        btn.textContent = 'Begin →';
        btn.disabled = false;
        btn.classList.remove('unlock');
        skip.style.display = 'inline';
    } else if (n === 1) {
        btn.textContent = 'Apply the Five Questions →';
        btn.disabled = false;
        btn.classList.remove('unlock');
        skip.style.display = 'inline';
    } else if (n === 2) {
        btn.textContent = 'Continue →';
        btn.disabled = true;   // enabled once all 4 answered
        btn.classList.remove('unlock');
        skip.style.display = 'inline';
    } else if (n === 3) {
        btn.textContent = 'Unlock my coach';
        btn.disabled = false;
        btn.classList.add('unlock');
        skip.style.display = 'none';
    }
}

function labNext() {
    if (labCurrent < LAB_TOTAL_STEPS - 1) {
        labShowStep(labCurrent + 1);
    } else {
        closeLab();
    }
}

function labChoose(qNum, val) {
    // mark answer
    labAnswers[qNum] = val;

    // style choices
    const q = el('labQ' + qNum);
    q.querySelectorAll('.lab-choice').forEach(c => c.classList.remove('selected-good', 'selected-warn'));
    const allChoices = q.querySelectorAll('.lab-choice');
    // Q1: b is best; Q2: b best; Q3: b best; Q4: b best; Q5: b best
    const goodIdx = { 1:'b', 2:'b', 3:'b', 4:'b', 5:'b' };
    const choiceMap = { a: 0, b: 1, c: 2 };
    const chosen = allChoices[choiceMap[val]];
    chosen.classList.add(val === goodIdx[qNum] ? 'selected-good' : 'selected-warn');

    // show feedback
    el('labFb' + qNum).classList.add('on');
    q.classList.add('answered');

    // show next-question button if not the last question
    if (qNum < 5) {
        let nextBtn = q.querySelector('.lab-next-q-btn');
        if (!nextBtn) {
            nextBtn = document.createElement('button');
            nextBtn.className = 'lab-next-q-btn';
            nextBtn.textContent = 'Continuar · Continue';
            nextBtn.onclick = () => {
                el('labQ' + (qNum + 1)).classList.add('on');
                setTimeout(() => el('labQ' + (qNum + 1)).scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
            };
            el('labFb' + qNum).appendChild(nextBtn);
        }
        nextBtn.classList.add('on');
    }

    // enable next if all 5 answered
    const allDone = [1,2,3,4,5].every(n => labAnswers[n] !== null && labAnswers[n] !== undefined);
    if (allDone) el('labNextBtn').disabled = false;

    // scroll the question into view gently
    setTimeout(() => q.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

function openLab() {
    el('labBg').classList.add('on');
    labShowStep(0);
}

function closeLab() {
    el('labBg').classList.remove('on');
    try { localStorage.setItem('tupana_lab_done', 'true'); } catch(e) {}

    // Notify AI that onboarding is complete
    let maniSentence = '';
    try { maniSentence = localStorage.getItem('tupana_mani_sentence') || ''; } catch(e) {}
    sendAppEvent('onboardingComplete', {
        maniDone: true,
        labDone: true,
        maniSentence: maniSentence.slice(0, 280)
    });

    // Post-onboarding welcome from the coach
    const welcomeMsg = state.connected
        ? '¡Bienvenido/a! You\'ve completed Tu Conocimiento and El Laboratorio. I can see the assets you claimed and the sentence you wrote about your own knowledge. We\'re at Stage 1 — Anecdote. Write a few sentences in the draft panel about a specific memory, then tell me what you\'re thinking. Tu voz importa.'
        : '¡Bienvenido/a! You\'ve completed the orientation. Head to Stage 1 and start writing in the draft panel on the left — write your first ideas in your own words. Your coach will be ready once the instructor connects the AI.';
    setTimeout(() => addMsg(welcomeMsg, 'bot', false, 'welcome'), 600);
}

// ════════════════════════════════════════════════════════
//  FIVE-QUESTION EVAL CARD (injected after bot responses in Stage 7+)
// ════════════════════════════════════════════════════════
const EVAL_QUESTIONS = [
    { key: 'cultural',    cls: 'q-cultural',    icon: 'positionality-compass', label: 'Conocimiento',        abbr: 'C',  hint: '¿Está generalizando o perdiendo algo que tú sabes desde tu comunidad? / Does it miss what you know from your own community?' },
    { key: 'accuracy',    cls: 'q-accuracy',    icon: 'accuracy-target',       label: 'Accuracy',           abbr: 'A',  hint: 'Any factual or academic claim here that needs a real source?' },
    { key: 'voice',       cls: 'q-voice',       icon: 'voice-thread',          label: 'Voice',               abbr: 'V',  hint: 'Does this still sound like the specific person who wrote it?' },
    { key: 'specificity', cls: 'q-specificity', icon: 'specificity-highlighter', label: 'Specificity',      abbr: 'S',  hint: 'Are there concrete details, or does it stay too abstract?' },
    { key: 'thinking',    cls: 'q-thinking',    icon: 'thinking-brain',        label: 'Thinking',            abbr: 'T',  hint: 'Does this deepen the connection to the larger issue?' }
];

// Immediate feedback shown when a student picks an eval choice on a message
const EVAL_FEEDBACK = {
    cultural: {
        good: 'Buena lectura. El coach respetó lo que sabes desde tu experiencia y comunidad. / Good read. The coach respected what you know from your experience and community.',
        warn: 'Pausa. ¿Hay algo que el coach generalizó, simplificó, o reescribió que tú viviste de otra manera? Lo que tú sabes desde tu comunidad no es una opinión — es evidencia. / Pause. Did the coach generalize something you experienced differently? What you know from your community is not an opinion — it is evidence.',
        flag: 'Tu conocimiento comunitario es evidencia, no solo contexto. Si el coach lo borró, lo suavizó, o lo reemplazó con lenguaje genérico, protégelo. Solo tú sabes lo que viviste. / Your community knowledge is evidence, not just context. If the coach erased, softened, or replaced it with generic language, protect it. Only you know what you lived.'
    },
    accuracy: {
        good: 'Parece sólido — pero verifica la fuente antes de entregar. La IA suena confiada incluso cuando no tiene cita. / Looks solid — but verify the source before submitting. AI sounds confident even without a real citation.',
        warn: 'Doble-check: ¿esta afirmación académica tiene una cita real detrás — o es la IA sonando segura? / Double-check: does this academic claim have a real citation behind it — or is the AI just sounding confident?',
        flag: 'La IA hace afirmaciones confiadas sin fuentes verificadas. Antes de usar esto, encuéntrale una cita real. Si no puedes, no lo uses. / AI makes confident claims without verified sources. Before using this, find a real citation. If you cannot, do not use it.'
    },
    voice: {
        good: 'Esta parte todavía suena como tú. Eso es lo más difícil de proteger en la revisión. Consérvalo. / This part still sounds like you. That is the hardest thing to protect in revision. Keep it.',
        warn: '¿Esta oración la escribiste tú o la escribió el coach por ti? Lee tu borrador original y compara. La diferencia es importante. / Did you write this sentence or did the coach write it for you? Read your original and compare. The difference matters.',
        flag: 'Tu voz es tu argumento. No es estilo — es evidencia de quién está hablando. Si el coach la borró y la reemplazó con prosa académica genérica, reclámala. / Your voice is your argument. It is not style — it is evidence of who is speaking. If the coach erased it and replaced it with generic academic prose, reclaim it.'
    },
    specificity: {
        good: 'Hay detalles concretos aquí. El lector puede imaginar la escena. Eso es exactamente lo que hace el argumento visible. / There are concrete details here. The reader can picture the scene. That is exactly what makes the argument visible.',
        warn: '¿Falta algo concreto — una escena, un nombre, una fecha, un sonido, un olor? La abstracción suena bien pero no convence. / Is something concrete missing — a scene, a name, a date, a sound, a smell? Abstraction sounds smooth but does not persuade.',
        flag: 'Esta parte se queda abstracta. La abstracción no persuade — el lector necesita tocar la historia, no leer sobre ella. Agrega el detalle específico que esta oración está evitando. / This part stays abstract. Abstraction does not persuade — the reader needs to touch the story, not read about it. Add the specific detail this sentence is avoiding.'
    },
    thinking: {
        good: 'Esta conexión profundiza. El lector aprende algo nuevo sobre cómo tu experiencia se conecta con algo más grande. / This connection deepens. The reader learns something new about how your experience connects to something larger.',
        warn: '¿El coach realmente conectó tu experiencia con el contexto mayor — o solo lo mencionó? Mencionar no es analizar. ¿Qué revela tu historia sobre la estructura más grande? / Did the coach actually connect your experience to the larger context — or just mention it? Mentioning is not analyzing. What does your story reveal about the larger structure?',
        flag: 'Esta conexión suena genérica — podría aplicarse a cualquier estudiante. La conexión debe salir de TU historia específica. Si no la sientes como tuya, no la uses. Escríbela tú mismo/a. / This connection sounds generic — it could apply to any student. The connection must come from YOUR specific story. If you do not feel it as yours, do not use it. Write it yourself.'
    }
};

function injectEvalCard() {
    if (state.stage < 7) return;

    const card = document.createElement('div');
    card.className = 'eval-card';

    const hdr = document.createElement('div');
    hdr.className = 'eval-card-header';
    hdr.innerHTML = `
        <span class="eval-card-title">${getIcon('critical-lens', 16)} Evalúa esta respuesta · Evaluate this response</span>
        <span class="eval-card-toggle">▾</span>`;
    hdr.addEventListener('click', () => card.classList.toggle('collapsed'));
    // Card starts open; student manually collapses it. No auto-collapse for accessibility.

    const body = document.createElement('div');
    body.className = 'eval-card-body';

    EVAL_QUESTIONS.forEach(q => {
        const row = document.createElement('div');
        row.className = 'eval-row';
        row.innerHTML = `
            <span class="eval-q-label ${q.cls}"><span class="eval-q-icon">${getIcon(q.icon, 18)}</span>${q.label}</span>
            <span class="eval-q-hint">${q.hint}</span>
            <div class="eval-btns">
                <button class="eval-btn" title="Strong — keep it" aria-label="Aceptar esta retroalimentación · Accept this feedback" onclick="evalPick(this,'good')"><svg viewBox="0 0 16 16" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round" aria-hidden="true"><path d="M2 8l4 4 8-8"/></svg></button>
                <button class="eval-btn" title="Needs more thought" aria-label="Pensar más sobre esta retroalimentación · Think more about this feedback" onclick="evalPick(this,'warn')"><svg viewBox="0 0 16 16" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M8 5v1M8 8v3"/></svg></button>
                <button class="eval-btn" title="Flag this — don't use as-is" aria-label="Cuestionar esta retroalimentación · Question this feedback" onclick="evalPick(this,'flag')"><svg viewBox="0 0 16 16" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round" aria-hidden="true"><path d="M3 2v12M3 3l10 4-10 4"/></svg></button>
            </div>`;
        body.appendChild(row);
    });

    const footer = document.createElement('div');
    footer.className = 'eval-card-footer';
    footer.textContent = 'Tu criterio es la última palabra — no el coach. Acepta lo que fortalece tu argumento. Cuestiona lo que borra tu voz. / Your judgment is final. Accept what strengthens your argument. Flag what erases your voice.';

    card.append(hdr, body, footer);
    D.chatMessages.appendChild(card);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
}

function removeFollowupPanels() {
    document.querySelectorAll('.followup-panel').forEach(p => p.remove());
}

function injectFollowupPanel() {
    const s = STAGES.find(st => st.id === state.stage);
    if (!s || !s.followups || s.followups.length === 0) return;

    removeFollowupPanels();

    // Render as a collapsed <details> to avoid competing with the main coach exchange.
    // Student expands it when they want a suggested question.
    const details = document.createElement('details');
    details.className = 'followup-panel';
    details.setAttribute('aria-label', 'Seguir conversando · Keep talking');

    const summary = document.createElement('summary');
    summary.className = 'followup-title followup-summary';
    summary.innerHTML = `${getIcon('thinking-brain', 14)} Seguir conversando · Keep talking`;
    details.appendChild(summary);

    const chips = document.createElement('div');
    chips.className = 'followup-chips';

    s.followups.forEach((q, i) => {
        const chip = document.createElement('button');
        chip.className = 'followup-chip';
        chip.setAttribute('aria-label', `Preguntar: ${q}`);
        chip.innerHTML = `<span class="tp-icon" style="width:12px;height:12px"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="4"/><path d="M32 12v12M32 40v12M12 32h12M40 32h12"/></svg></span> ${q}`;
        chip.addEventListener('click', () => sendFollowup(q, i));
        chips.appendChild(chip);
    });

    details.appendChild(chips);
    D.chatMessages.appendChild(details);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
}

function sendFollowup(question, index) {
    removeFollowupPanels();
    // Send as a user message so the AI responds with a Socratic follow-up
    // The [Follow-up] prefix helps the AI distinguish guided questions from free-form input
    sendMsg('[Follow-up] ' + question);
}

// ════════════════════════════════════════════════════════
//  INLINE MESSAGE EVALUATION (Five Questions per response)
//  Each bot message gets a compact eval bar. Tapping a
//  question opens inline feedback. State is persisted to
//  the chatlog entry and restores on reload.
// ════════════════════════════════════════════════════════

function renderMsgEvalBar(msgId, evals) {
    const msgWrap = D.chatMessages.querySelector(`[data-msg-id="${msgId}"]`);
    if (!msgWrap) return;
    // Don't duplicate
    if (msgWrap.querySelector('.msg-eval-bar')) return;

    const bar = document.createElement('div');
    bar.className = 'msg-eval-bar';

    const prompt = document.createElement('span');
    prompt.className = 'msg-eval-prompt';
    prompt.textContent = 'Evaluar · Evaluate';
    bar.appendChild(prompt);

    EVAL_QUESTIONS.forEach(q => {
        const btn = document.createElement('button');
        btn.className = 'msg-eval-q';
        const current = evals && evals[q.key];
        if (current) btn.classList.add('active-' + current);
        btn.setAttribute('aria-label', `${q.label}: ${q.hint}`);
        btn.innerHTML = `${getIcon(q.icon, 12)} ${q.abbr}`;
        btn.addEventListener('click', () => openMsgEvalDrawer(msgId, q.key, evals));
        bar.appendChild(btn);
    });

    msgWrap.appendChild(bar);
}

function openMsgEvalDrawer(msgId, qKey, evals) {
    // Remove any existing eval modal (body-level) or legacy inline drawer
    document.getElementById('evalModal')?.remove();
    const msgWrap = D.chatMessages.querySelector(`[data-msg-id="${msgId}"]`);
    if (msgWrap) msgWrap.querySelector('.msg-eval-drawer')?.remove();

    const q = EVAL_QUESTIONS.find(x => x.key === qKey);
    if (!q) return;

    // Backdrop — click outside card to dismiss
    const overlay = document.createElement('div');
    overlay.className = 'eval-modal-bg';
    overlay.id = 'evalModal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `Evaluar: ${q.label} · Evaluate: ${q.label}`);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    const card = document.createElement('div');
    card.className = 'eval-modal-card';

    // Modal header
    const header = document.createElement('div');
    header.className = 'eval-modal-header';
    header.textContent = 'Evaluando lo que dice el coach · Evaluating what the coach says';
    card.appendChild(header);

    // Intro explanation
    const intro = document.createElement('p');
    intro.className = 'eval-modal-intro';
    intro.innerHTML =
        'Antes de usar esta sugerencia, evalúala. <strong>Tu criterio es parte del trabajo.</strong> · ' +
        'Before using this suggestion, evaluate it. <strong>Your judgment is part of the work.</strong>' +
        '<br><span class="eval-modal-sub">No tienes que aceptar todo lo que dice el coach. · You do not have to accept everything the coach says.</span>';
    card.appendChild(intro);

    // Criterion label + icon
    const qTitle = document.createElement('div');
    qTitle.className = 'eval-modal-q ' + q.cls;
    qTitle.innerHTML = `${getIcon(q.icon, 16)} ${q.label}`;
    card.appendChild(qTitle);

    // Hint text
    const hint = document.createElement('p');
    hint.className = 'eval-modal-hint';
    hint.textContent = q.hint;
    card.appendChild(hint);

    // Choice buttons
    const choices = document.createElement('div');
    choices.className = 'eval-modal-choices';
    const current = evals && evals[qKey];
    [
        { type: 'good', label: 'Sí / Yes' },
        { type: 'warn', label: 'Parcialmente / Partly' },
        { type: 'flag', label: 'No / No' }
    ].forEach(c => {
        const b = document.createElement('button');
        b.className = 'eval-modal-choice' + (current === c.type ? ' picked-' + c.type : '');
        b.textContent = c.label;
        b.addEventListener('click', () => evalMsgPick(msgId, qKey, c.type));
        choices.appendChild(b);
    });
    card.appendChild(choices);

    // Feedback if already answered
    if (current && EVAL_FEEDBACK[qKey] && EVAL_FEEDBACK[qKey][current]) {
        const fb = document.createElement('div');
        fb.className = 'eval-modal-feedback ' + current;
        const raw = EVAL_FEEDBACK[qKey][current];
        const parts = raw.split(/\.\s+(?=[A-Z])/);
        let fbTitle = parts[0];
        let fbBody = parts.slice(1).join('. ');
        if (!fbBody) { fbTitle = raw; fbBody = ''; }
        fb.innerHTML =
            `<div class="eval-modal-fb-title">${escapeHtml(fbTitle)}</div>` +
            (fbBody ? `<div class="eval-modal-fb-body">${wrapBilingualHtml(fbBody)}</div>` : '') +
            `<div class="eval-modal-fb-action">Tu criterio es la última palabra. · Your judgment is final.</div>`;
        card.appendChild(fb);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'eval-modal-close';
    closeBtn.setAttribute('aria-label', 'Cerrar · Close');
    closeBtn.textContent = 'Cerrar · Close';
    closeBtn.addEventListener('click', () => overlay.remove());
    card.appendChild(closeBtn);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Focus first choice for keyboard/screen-reader users
    const firstChoice = card.querySelector('.eval-modal-choice');
    if (firstChoice) setTimeout(() => firstChoice.focus(), 40);
}

function evalMsgPick(msgId, qKey, choice) {
    // Update chatlog
    updateMsgEval(msgId, qKey, choice);

    // Update stats
    updateEvalStats(msgId, qKey, choice);

    // Re-render the bar with new state
    const msgWrap = D.chatMessages.querySelector(`[data-msg-id="${msgId}"]`);
    if (msgWrap) {
        const oldBar = msgWrap.querySelector('.msg-eval-bar');
        if (oldBar) oldBar.remove();
        document.getElementById('evalModal')?.remove();
        msgWrap.querySelector('.msg-eval-drawer')?.remove();

        // Read back evals from chatlog
        let evals = {};
        try {
            const log = JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || '[]');
            const entry = log.find(e => e.id === msgId);
            if (entry) evals = entry.evals || {};
        } catch(e) {}

        renderMsgEvalBar(msgId, evals);
        openMsgEvalDrawer(msgId, qKey, evals);
    }

    // Update legacy decision log for backward compat
    try {
        const log = JSON.parse(localStorage.getItem('tupana_decisions') || '[]');
        const q = EVAL_QUESTIONS.find(x => x.key === qKey);
        log.push({ q: q ? q.label : qKey, choice: choice, t: new Date().toISOString() });
        localStorage.setItem('tupana_decisions', JSON.stringify(log.slice(-50)));
    } catch(e) {}
    const _evalQ = EVAL_QUESTIONS.find(x => x.key === qKey);
    logProcessEvent('feedback_evaluated', `Feedback evaluated: "${_evalQ ? _evalQ.label : qKey}" — ${choice}.`);

    renderDecisionLog();
    renderBadges();
    renderEvalStreak();
}

function updateMsgEval(msgId, qKey, choice) {
    try {
        const log = JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || '[]');
        const entry = log.find(e => e.id === msgId);
        if (entry) {
            if (!entry.evals) entry.evals = {};
            entry.evals[qKey] = choice;
            localStorage.setItem(CHAT_LOG_KEY, JSON.stringify(log));
        }
    } catch(e) {}
}

// ════════════════════════════════════════════════════════
//  EVAL HABIT STATS & STREAKS
// ════════════════════════════════════════════════════════
const EVAL_STATS_KEY = 'tupana_eval_stats';

function loadEvalStats() {
    try {
        return JSON.parse(localStorage.getItem(EVAL_STATS_KEY) || '{}');
    } catch(e) { return {}; }
}

function saveEvalStats(stats) {
    try { localStorage.setItem(EVAL_STATS_KEY, JSON.stringify(stats)); } catch(e) {}
}

function updateEvalStats(msgId, qKey, choice) {
    const stats = loadEvalStats();
    if (!stats.total) stats.total = 0;
    if (!stats.streak) stats.streak = 0;
    if (!stats.maxStreak) stats.maxStreak = 0;
    if (!stats.lastMsgId) stats.lastMsgId = '';
    if (!stats.byQuestion) stats.byQuestion = {};

    // Per-question totals
    if (!stats.byQuestion[qKey]) stats.byQuestion[qKey] = { total: 0, streak: 0, maxStreak: 0 };
    stats.byQuestion[qKey].total++;

    // Streak: consecutive bot messages with at least one eval
    // Only increment if this is a new message (not re-evaluating same message)
    const isNewMsg = stats.lastMsgId !== msgId;
    if (isNewMsg) {
        stats.streak++;
        stats.lastMsgId = msgId;
        stats.byQuestion[qKey].streak++;
    }
    if (stats.streak > stats.maxStreak) stats.maxStreak = stats.streak;
    if (stats.byQuestion[qKey].streak > stats.byQuestion[qKey].maxStreak) {
        stats.byQuestion[qKey].maxStreak = stats.byQuestion[qKey].streak;
    }
    stats.total++;

    saveEvalStats(stats);
}

function renderEvalStreak() {
    const bar = D.streakBar;
    if (!bar) return;
    const stats = loadEvalStats();

    // Build eval habit line
    let html = '';
    if (stats.total > 0) {
        const streakText = stats.streak > 1
            ? `Racha: <strong>${stats.streak}</strong> seguidas · Streak: <strong>${stats.streak}</strong> in a row`
            : `Has evaluado <strong>${stats.total}</strong> respuestas · <strong>${stats.total}</strong> responses evaluated`;
        html += `<span>${streakText}</span>`;
    }

    // Also show session streak if present (from trackSession)
    let sessions = [];
    try { sessions = JSON.parse(localStorage.getItem('tupana_sessions') || '[]'); } catch(e) {}
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const weekCount = sessions.filter(t => t > weekAgo).length;
    if (weekCount > 0) {
        if (html) html += `<span style="color:var(--border)">|</span>`;
        html += `<span>Sesiones · Sessions: ${weekCount}/7</span>`;
    }

    if (html) {
        bar.innerHTML = html;
        bar.classList.add('on');
    }
}

// ════════════════════════════════════════════════════════
//  TWO-RESPONSE VOICE CHALLENGE (stub for expansion)
//  Occasional mini-activity: pick which of two paragraphs
//  preserves the student's voice better.
// ════════════════════════════════════════════════════════
function injectVoiceChallenge() {
    // STUB: To be expanded with actual challenge content.
    // Triggered occasionally in Stage 8 (Voice Polish) when
    // the student has completed several evals in a row.
    //
    // Usage:
    //   if (state.stage === 8 && shouldTriggerVoiceChallenge()) {
    //       renderVoiceChallengeCard();
    //   }
    //
    // The challenge shows two paragraphs side by side:
    //   A) A bland, generic revision
    //   B) A revision that keeps the student's voice
    // Student picks B, gets positive reinforcement.
}

function shouldTriggerVoiceChallenge() {
    const stats = loadEvalStats();
    // Trigger once per session after 5+ evals in stage 8
    return stats.total >= 5 && state.stage === 8 && !sessionStorage.getItem('tupana_voice_challenge_shown');
}

function evalPick(btn, type) {
    // toggle within its group of 3
    const group = btn.closest('.eval-btns').querySelectorAll('.eval-btn');
    group.forEach(b => b.classList.remove('active-good','active-warn','active-flag'));
    btn.classList.add('active-' + type);

    // Store in local decision log
    const row = btn.closest('.eval-row');
    const label = row.querySelector('.eval-q-label').textContent.trim();
    try {
        const log = JSON.parse(localStorage.getItem('tupana_decisions') || '[]');
        log.push({ q: label, choice: type, t: new Date().toISOString() });
        localStorage.setItem('tupana_decisions', JSON.stringify(log.slice(-50)));
    } catch(e) {}

    // Update the visible decision log
    renderDecisionLog();
    renderBadges();
}

// ════════════════════════════════════════════════════════
//  REVISION DECISION LOG
// ════════════════════════════════════════════════════════
function renderDecisionLog() {
    const container = document.getElementById('decisionLog');
    const itemsWrap = document.getElementById('decisionLogItems');
    if (!container || !itemsWrap) return;

    try {
        const log = JSON.parse(localStorage.getItem('tupana_decisions') || '[]');
        const accepted = log.filter(d => d.choice === 'good').length;
        const questioned = log.filter(d => d.choice === 'flag').length;
        const thinking = log.filter(d => d.choice === 'warn').length;
        const total = log.length;

        // Update header with count and toggle
        let header = container.querySelector('.decision-log-header');
        if (!header) {
            header = document.createElement('div');
            header.className = 'decision-log-header';
            container.insertBefore(header, itemsWrap);
            header.addEventListener('click', () => container.classList.toggle('collapsed'));
        }
        header.innerHTML = `<span>Mis decisiones de revisión · My revision decisions ${total ? `(${total} total)` : ''}</span><span class="decision-log-toggle">${container.classList.contains('collapsed') ? '▸ Mostrar · Show' : '▾ Ocultar · Hide'}</span>`;

        if (!log.length) {
            itemsWrap.innerHTML = '<div style="color:var(--text-muted); font-style:italic;">Tus decisiones aparecerán aquí cuando evalúes la retroalimentación del coach. · Your decisions will appear here when you evaluate coach feedback.</div>';
            container.classList.add('on');
            return;
        }
        itemsWrap.innerHTML = log.slice(-8).reverse().map(d => {
            const dotClass = d.choice === 'good' ? 'good' : d.choice === 'warn' ? 'warn' : 'flag';
            const label = d.choice === 'good' ? 'Acepté · Accepted' : d.choice === 'warn' ? 'Pensando más · Thinking more' : 'Cuestioné · Questioned';
            const time = new Date(d.t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            return `<div class="decision-log-item"><span class="decision-dot ${dotClass}"></span><span>${d.q}: <strong>${label}</strong> <span style="color:var(--text-muted)">— ${time}</span></span></div>`;
        }).join('');
        container.classList.add('on');
    } catch(e) {}
}

// ════════════════════════════════════════════════════════
//  CHAT LOG PERSISTENCE
// ════════════════════════════════════════════════════════
const CHAT_LOG_KEY = 'tupana_chatlog';
const CHAT_LOG_MAX = 120;

// ════════════════════════════════════════════════════════
//  TIME FORMATTING — bilingual, student-friendly
// ════════════════════════════════════════════════════════
function formatMsgTime(isoString, showDate) {
    const d = isoString ? new Date(isoString) : new Date();
    const timeOpts = { hour: 'numeric', minute: '2-digit', hour12: true };
    const dateOpts = { month: 'short', day: 'numeric' };
    const timeStr = d.toLocaleTimeString('en-US', timeOpts);
    const dateStrEs = d.toLocaleDateString('es-ES', dateOpts);
    const dateStrEn = d.toLocaleDateString('en-US', dateOpts);
    if (showDate) {
        return `${dateStrEs} · ${dateStrEn} — ${timeStr}`;
    }
    return timeStr;
}

function formatSessionDivider(isoString) {
    if (!isoString) return '↩ Sesión anterior · Previous session';
    const d = new Date(isoString);
    const opts = { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
    const es = d.toLocaleDateString('es-ES', opts);
    const en = d.toLocaleDateString('en-US', opts);
    return `↩ ${es} · ${en}`;
}

function makeMsgId() {
    return 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

function saveChatEntry(text, who, id, evals, msgType) {
    try {
        const log = JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || '[]');
        const entry = { text, who, t: new Date().toISOString(), id: id || makeMsgId(), evals: evals || {} };
        if (msgType) entry.msgType = msgType;
        log.push(entry);
        if (log.length > CHAT_LOG_MAX) log.splice(0, log.length - CHAT_LOG_MAX);
        localStorage.setItem(CHAT_LOG_KEY, JSON.stringify(log));
    } catch(e) {}
}

function restoreChatLog() {
    try {
        const log = JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || '[]');
        if (!log.length) return;

        // Migrate old entries: assign IDs and empty evals if missing
        let needsSave = false;
        log.forEach(entry => {
            if (!entry.id) { entry.id = makeMsgId(); needsSave = true; }
            if (!entry.evals) { entry.evals = {}; needsSave = true; }
        });
        if (needsSave) {
            localStorage.setItem(CHAT_LOG_KEY, JSON.stringify(log));
        }

        // Divider with timestamp of first restored message
        const firstTs = log[0].t || null;
        const startDiv = document.createElement('div');
        startDiv.className = 'session-divider';
        startDiv.innerHTML = `<span>${formatSessionDivider(firstTs)}</span>`;
        D.chatMessages.appendChild(startDiv);

        // Classify each entry as collapsible (welcome/system) or substantive
        const WELCOME_PATTERNS = [
            /^¡Bienvenido\/a de vuelta!/,
            /^¡Hola! · Hello! Tu Pana/,
            /^¡Hola! Tu Pana de Escritura/,
            /^Hola\. Soy Tu Pana de Escritura/,
            /^¡Bienvenido\/a! You've completed/,
            /^El coach en vivo aún no está conectado/
        ];
        function isCollapsibleEntry(entry) {
            if (entry.msgType === 'welcome' || entry.msgType === 'system') return true;
            if (entry.who !== 'bot') return false;
            return WELCOME_PATTERNS.some(re => re.test(entry.text));
        }

        // Separate into collapsible and substantive, keeping order
        const collapsible = log.filter(isCollapsibleEntry);
        const substantive = log.filter(e => !isCollapsibleEntry(e));

        // Render collapsed group if 2+ collapsible entries exist
        if (collapsible.length >= 2) {
            const details = document.createElement('details');
            details.className = 'collapsed-sys';
            const summary = document.createElement('summary');
            summary.setAttribute('aria-label',
                `${collapsible.length} mensajes anteriores del sistema ocultos. Presiona para expandir. · ` +
                `${collapsible.length} earlier system messages hidden. Press to expand.`
            );
            summary.innerHTML =
                `<span class="collapsed-sys-label">` +
                `${collapsible.length} mensajes del sistema · system messages` +
                `</span><span class="collapsed-sys-hint">Mostrar · Show</span>`;
            details.appendChild(summary);
            collapsible.forEach(entry => {
                const p = document.createElement('p');
                p.className = 'collapsed-sys-item';
                p.textContent = (entry.t ? formatMsgTime(entry.t, true) + ' — ' : '') + entry.text.split('\n')[0];
                details.appendChild(p);
            });
            D.chatMessages.appendChild(details);
        } else if (collapsible.length === 1) {
            // Single collapsible: also use collapsed group for consistency
            const details = document.createElement('details');
            details.className = 'collapsed-sys';
            const summary = document.createElement('summary');
            summary.setAttribute('aria-label',
                '1 mensaje del sistema anterior oculto. Presiona para expandir. · 1 earlier system message hidden. Press to expand.');
            summary.innerHTML =
                `<span class="collapsed-sys-label">1 mensaje del sistema · system message</span>` +
                `<span class="collapsed-sys-hint">Mostrar · Show</span>`;
            details.appendChild(summary);
            const entry = collapsible[0];
            const p = document.createElement('p');
            p.className = 'collapsed-sys-item';
            p.textContent = (entry.t ? formatMsgTime(entry.t, true) + ' — ' : '') + entry.text.split('\n')[0];
            details.appendChild(p);
            D.chatMessages.appendChild(details);
        }

        // Render substantive messages in order
        substantive.forEach(entry => {
            const msgType = entry.msgType || (entry.who === 'bot' ? 'coach' : 'student');
            const wrap = document.createElement('div');
            wrap.className = `msg ${entry.who} msg-type-${msgType} msg-restored`;
            wrap.dataset.msgId = entry.id;

            const av = document.createElement('div');
            av.className = 'msg-avatar';
            av.setAttribute('aria-hidden', 'true');
            av.innerHTML = entry.who === 'bot' ? getIcon('guide-lighthouse', 16) : getIcon('student-page', 16);

            const content = document.createElement('div');
            content.className = 'msg-content';

            const bub = document.createElement('div');
            bub.className = 'msg-bubble';
            if (entry.who === 'bot') {
                bub.innerHTML = wrapBilingualHtml(entry.text);
            } else {
                bub.textContent = entry.text;
            }

            const time = document.createElement('div');
            time.className = 'msg-time';
            time.textContent = entry.t ? formatMsgTime(entry.t, true) : '';
            time.style.opacity = '0.5';

            content.append(bub, time);
            wrap.append(av, content);
            D.chatMessages.appendChild(wrap);

            // Restore inline eval bar for bot messages that have evals
            if (entry.who === 'bot' && Object.keys(entry.evals || {}).length > 0) {
                renderMsgEvalBar(entry.id, entry.evals);
            }
        });

        // Promote the last substantive bot message to "current"
        const botMsgs = D.chatMessages.querySelectorAll('.msg.bot.msg-restored');
        const lastBot = botMsgs[botMsgs.length - 1];
        if (lastBot) {
            lastBot.classList.add('msg-current');
            lastBot.setAttribute('role', 'article');
            lastBot.setAttribute('aria-label', 'Instrucción actual del coach · Current coach instruction');
        }

        const endDiv = document.createElement('div');
        endDiv.className = 'session-divider';
        const now = new Date();
        const nowOpts = { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
        const nowEs = now.toLocaleDateString('es-ES', nowOpts);
        const nowEn = now.toLocaleDateString('en-US', nowOpts);
        endDiv.innerHTML = `<span>Nueva sesión · New session — ${nowEs} · ${nowEn}</span>`;
        D.chatMessages.appendChild(endDiv);
        D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
    } catch(e) {}
}

// ════════════════════════════════════════════════════════
//  STUCK TRIAGE MENU
// ════════════════════════════════════════════════════════
function showStuckTriage() {
    D.stuckTriage.classList.add('on');
}
function hideStuckTriage() {
    D.stuckTriage.classList.remove('on');
}
function handleStuckOption(option) {
    hideStuckTriage();
    const stage = state.stage;
    if (option === 'prompt') {
        showStuckMini();
        return;
    } else if (option === '_legacy_prompt') {
        const prompts = {
            1: t(
                'Escribe 3 oraciones sobre un sonido de tu infancia. No importa la gramática — solo la imagen. / Write 3 sentences about a sound from your childhood. Grammar does not matter here — just the image.',
                'Write 3 sentences: a sound, a place, and one person. No grammar rules. Just the scene.'
            ),
            2: t(
                'Describe un lugar donde te sentiste "entre dos mundos." ¿Qué veías? ¿Qué escuchabas? / Describe a place where you felt "between two worlds." What did you see? What did you hear?',
                'Name the larger force behind your personal moment. One sentence: "My experience connects to ______."'
            ),
            3: t(
                'Completa esta oración con tus propias palabras: Mi ensayo es sobre ______ porque ______. No tiene que ser perfecto. / Complete this: My essay is about ______ because ______. It does not have to be perfect.',
                'State the tension in one sentence: "My essay argues that [experience] reveals [structural issue]."'
            ),
            4: t(
                'Escribe una pregunta que todavía no puedes responder sobre tu tema. A veces la pregunta es el comienzo. / Write one question you still cannot answer about your topic. Sometimes the question is the beginning.',
                'Write the one research question you most need to answer. Then name one source that might address it.'
            ),
            5: t(
                'Haz una lista de 5 momentos de tu historia, en orden. Luego decide: ¿cuál es el punto de giro? / List 5 moments from your story in order. Then decide: which one is the turning point?',
                'List your 5 sections. For each, write one sentence: what does this section do for the reader?'
            ),
            6: t(
                'Escribe un párrafo sobre el momento más específico de tu historia. No pienses en el ensayo — solo escribe el momento. / Write one paragraph about the most specific moment in your story. Do not think about the essay — just write the moment.',
                'Write the most specific scene you remember. Keep going without stopping. You can revise later.'
            ),
            7: t(
                'Pega aquí un párrafo de tu borrador. No tienes que arreglarlo — solo compártelo y trabajamos juntos. / Paste one paragraph from your draft. You do not have to fix it — just share it and we\'ll work through it together.',
                'Paste one paragraph. I will identify what is working and what needs one specific change.'
            ),
            8: t(
                'Lee tu borrador en voz alta. ¿Qué oración suena más como tú — y cuál suena más como alguien intentando sonar académico? / Read your draft out loud. Which sentence sounds most like you — and which sounds like someone trying to sound academic?',
                'Read aloud. Which sentence sounds most like you? Protect it. Which sounds like a textbook? Revise it.'
            ),
            9: t(
                'Haz una lista de todo lo que necesitas entregar. ¿Qué falta? ¿Qué ya tienes? / List everything you need to submit. What is missing? What do you already have?',
                'List all submission requirements. Check off what is done. Name the one thing still missing.'
            )
        };
        const msg = prompts[stage] || t(
            'Empieza con lo que sabes. Una oración es suficiente para comenzar. / Start with what you know. One sentence is enough to begin.',
            'Start with one sentence about what you know. Then write the next one.'
        );
        addSys(msg);
    } else if (option === 'overwhelmed') {
        const humor = pickHumor('overwhelmed');
        addSys(t(
            `Entiendo. Tomemos un respiro. Voy a activar el modo enfoque para que solo veas tu borrador. ${humor ? humor + ' ' : ''}/ I understand. Let's take a breath. I'm turning on focus mode so you only see your draft. ${humor || ''}`,
            `Modo enfoque activado. Solo tu borrador. Vuelve cuando estés listo/a. / Focus mode on. Just your draft. Come back when you're ready.`
        ));
        if (!document.querySelector('.workspace').classList.contains('focus-mode')) {
            toggleFocusMode();
        }
        state.showAllJourney = true;
        buildMap();
        addSys(t(
            'Cuando estés listo/a, presiona Salir del enfoque para volver al coach. / When you\'re ready, press Exit focus to return to the coach.',
            'Press Exit focus when ready to continue.'
        ));
    } else if (option === 'feedback') {
        sendMsg(t(
            'No entiendo bien la retroalimentación que me diste. ¿Puedes explicarlo de otra manera, con un ejemplo más concreto? / I don\'t fully understand the feedback you gave me. Can you explain it another way, with a more concrete example?',
            'No entiendo la retroalimentación. Explícalo de otra manera. / I don\'t understand the feedback. Please explain it differently.'
        ));
    } else if (option === 'instructor') {
        const draft = (() => { try { return localStorage.getItem('tupana_draft') || ''; } catch(e) { return ''; } })();
        const decisions = (() => { try { return JSON.parse(localStorage.getItem('tupana_decisions') || '[]'); } catch(e) { return []; } })();
        const summary = `RESUMEN PARA INSTRUCTOR/A · SUMMARY FOR INSTRUCTOR\nEtapa actual · Current stage: ${stage}\nBorrador · Draft: ${draft ? draft.trim().split(/\s+/).filter(Boolean).length + ' palabras · words' : 'No guardado · Not saved'}\nDecisiones de revisión · Revision decisions: ${decisions.length}\n`;
        navigator.clipboard.writeText(summary).then(() => {
            addSys(t(
                'He copiado un resumen de tu progreso al portapapeles. Pégalo en un correo a tu instructor/a para que te pueda apoyar. / I\'ve copied a summary of your progress to the clipboard. Paste it into an email to your instructor for support.',
                'Progress summary copied to clipboard. Paste it into an email to your instructor.'
            ));
        }).catch(() => {
            addSys(t(
                'No se pudo copiar automáticamente. Abre tu Reporte de Proceso para ver todo tu progreso y compártelo con tu instructor/a. / Could not copy automatically. Open your Process Report to see all your progress and share it with your instructor.',
                'Could not copy. Open your Process Report to share your progress.'
            ));
        });
    } else if (option === 'break') {
        addSys(t(
            'Está bien tomar un descanso. El borrador, tu historia, y Tu Pana estarán aquí cuando vuelvas. / It is okay to take a break. Your draft, your story, and Tu Pana will all be here when you return.',
            'Toma el descanso que necesitas. El borrador espera. / Take the break you need. The draft will wait.'
        ));
        if (!document.querySelector('.workspace').classList.contains('focus-mode')) {
            toggleFocusMode();
        }
    }
}

// ════════════════════════════════════════════════════════
//  ENGAGEMENT: PHASE CELEBRATIONS, BADGES, SESSIONS
// ════════════════════════════════════════════════════════
const PHASE_CELEBRATIONS = {
    4:  {
        badge:   'Encontrar · Discovery',
        titleEs: 'Encontraste tu historia',
        titleEn: 'You found your story',
        body:    'Has identificado una memoria específica y conectado tu experiencia personal con un contexto más grande. Ese movimiento — de <em>mi historia</em> a <em>nuestro mundo</em> — es donde comienza el ensayo. / You have identified a specific memory and connected your personal experience to a larger context. That move — from <em>my story</em> to <em>our world</em> — is where the essay begins.'
    },
    6:  {
        badge:   'Construir · Building',
        titleEs: 'Lo preparaste todo',
        titleEn: 'You built the foundation',
        body:    'Investigaste, conectaste y organizaste. Ahora llegas al momento más importante: escribir sin ayuda. Nadie puede escribir este borrador por ti — y Tu Pana no lo intentará. Este borrador será tuyo de una manera que nada más lo será. / You researched, connected, and outlined. Now comes the most important moment: writing without help. No one can write this draft for you — and Tu Pana will not try. This draft will be yours in a way nothing else will be.'
    },
    // Stage 7: the draft-saved modal handles this milestone with more depth and a required read pause.
    9:  {
        badge:   'Afinar · Refining',
        titleEs: 'Dos rondas de revisión',
        titleEn: 'Two rounds of revision done',
        body:    'Revisaste con criterio y recibiste retroalimentación. Ahora viene la revisión más importante: la de tu voz. Pregúntate qué cambió, qué se perdió, y qué solo tú sabes que debe quedarse. Esta etapa no trata de corregir — trata de proteger. / You revised with judgment and received feedback. Now comes the most important revision: your voice. Ask what changed, what was lost, and what only you know must stay. This stage is not about correcting — it is about protecting.'
    },
    10: {
        badge:   'Completar · Completing',
        titleEs: 'Llegaste al final con dignidad',
        titleEn: 'You reached the end with dignity',
        body:    'Tu ensayo, tu nota de proceso, y tu registro de decisiones están listos. No solo completaste una tarea — documentaste cómo usaste la IA con criterio. / Your essay, your process note, and your decision log are ready. You did not just complete an assignment — you documented how you used AI with judgment.'
    }
};

function showPhaseCelebration(stageId) {
    const cel = PHASE_CELEBRATIONS[stageId];
    if (!cel || !D.phaseToast) return;
    D.phaseToastBadge.innerHTML = `${getIcon('luminous-page', 16)} ${cel.badge}`;
    D.phaseToastTitle.innerHTML = `${cel.titleEs} · ${cel.titleEn}`;
    D.phaseToastBody.innerHTML = cel.body;
    D.phaseToast.classList.add('on');
    // No auto-dismiss — student must click Continue or the X to close
}

function dismissPhaseToast() {
    if (D.phaseToast) D.phaseToast.classList.remove('on');
    // Trigger any spotlight that was deferred while the toast was showing
    if (state.pendingSpotlightStageId != null) {
        const id = state.pendingSpotlightStageId;
        state.pendingSpotlightStageId = null;
        scheduleCoachSpotlight(id);
    }
}

function computeBadges() {
    const badges = [];
    const decisions = (() => { try { return JSON.parse(localStorage.getItem('tupana_decisions') || '[]'); } catch(e) { return []; } })();
    const draftSaved = localStorage.getItem('tupana_draft_saved') === 'true';
    const stage = state.stage;
    const done = state.done;

    if (done.has(3) || stage > 3) {
        badges.push({ cls: 'story',  text: 'Fundador/a de Historia · Story Founder', icon: 'community-map' });
    }
    if (draftSaved) {
        badges.push({ cls: 'arch',   text: 'Arquitecto/a del Ensayo · Essay Architect', icon: 'first-draft-door' });
    }
    if (decisions.length >= 5) {
        badges.push({ cls: 'voice',  text: 'Guardián/a de la Voz · Voice Guardian', icon: 'voice-thread' });
    }
    if (done.has(8) || stage > 8) {
        badges.push({ cls: 'bridge', text: 'Constructor/a de Puentes · Bridge Builder', icon: 'language-bridge' });
    }
    if (decisions.length >= 10) {
        badges.push({ cls: 'editor', text: 'Editor/a con Criterio · Editor with Judgment', icon: 'critical-lens' });
    }
    if (done.has(9) || stage >= 9) {
        badges.push({ cls: 'doc',    text: 'Documentalista del Proceso · Process Documentarian', icon: 'process-timeline' });
    }
    return badges;
}

function renderBadges() {
    const strip = D.badgeStrip;
    if (!strip) return;
    const badges = computeBadges();
    if (!badges.length) {
        strip.classList.remove('on');
        return;
    }
    strip.innerHTML = badges.map(b => `<span class="skill-badge ${b.cls}">${getIcon(b.icon, 14)} ${b.text}</span>`).join('');
    strip.classList.add('on');
}

function trackSession() {
    const now = Date.now();
    const today = new Date().toDateString();
    let sessions = [];
    try { sessions = JSON.parse(localStorage.getItem('tupana_sessions') || '[]'); } catch(e) {}

    // Only count a new session if last session was > 30 minutes ago or on a different day
    const lastTs = sessions.length ? sessions[sessions.length - 1] : 0;
    const isNewSession = !lastTs || (now - lastTs) > 30 * 60 * 1000;

    if (isNewSession) {
        sessions.push(now);
        // Keep last 30 sessions
        if (sessions.length > 30) sessions = sessions.slice(-30);
        try { localStorage.setItem('tupana_sessions', JSON.stringify(sessions)); } catch(e) {}
    }

    // Count sessions in last 7 days
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const weekCount = sessions.filter(t => t > weekAgo).length;

    // Render streak bar
    const bar = D.streakBar;
    if (bar && weekCount > 0) {
        bar.innerHTML = `<span>Sesiones esta semana · Sessions this week:</span>${sessions.slice(-7).map(t => {
            const d = new Date(t);
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
            const isRecent = (now - t) < 24 * 60 * 60 * 1000;
            return `<span class="streak-dot${isRecent ? ' active' : ''}" title="${d.toLocaleDateString()}"></span>`;
        }).join('')}<span style="margin-left:4px; font-weight:600; color:var(--amber-text);">${weekCount}</span>`;
        bar.classList.add('on');
    }

    return { total: sessions.length, week: weekCount, isNew: isNewSession };
}

// ════════════════════════════════════════════════════════
//  MIXED-GENRE ESSAY DEFINITION TOGGLE
// ════════════════════════════════════════════════════════
function toggleEssayDef() {
    const popup   = el('essayDefPopup');
    const toggle  = el('essayDefToggle');
    if (!popup || !toggle) return;
    const isOpen  = popup.classList.toggle('on');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

// ════════════════════════════════════════════════════════
//  THEME TOGGLE
// ════════════════════════════════════════════════════════
function initTheme() {
    const saved = localStorage.getItem('tupana_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('tupana_theme', next); } catch(e) {}
    updateThemeIcon(next);
}
function updateThemeIcon(theme) {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const sunSvg = '<span class="tp-icon" style="width:16px;height:16px"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="tp-fill-mango" cx="32" cy="32" r="14"/><path d="M32 7v6M32 51v6M7 32h6M51 32h6M14 14l4 4M46 46l4 4M14 50l4-4M46 18l4-4"/></svg></span>';
    const moonSvg = '<span class="tp-icon" style="width:16px;height:16px"><svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-mango" d="M36 10a18 18 0 1 0 18 28 22 22 0 1 1-18-28z"/></svg></span>';
    btn.innerHTML = theme === 'dark' ? moonSvg : sunSvg;
}
function resetApp() {
    if (!confirm('Reset the app to the beginning?\n\nAll progress, draft text, and coach history will be cleared.\n\n¿Reiniciar la app desde el inicio? Se borrará todo el progreso.')) return;
    localStorage.clear();
    location.reload();
}

// ════════════════════════════════════════════════════════
//  FOCUS MODE
// ════════════════════════════════════════════════════════
function toggleFocusMode() {
    const workspace = document.querySelector('.workspace');
    workspace.classList.toggle('focus-mode');
    const focusToggle = document.getElementById('focusToggle');
    if (focusToggle) {
        const inFocus = workspace.classList.contains('focus-mode');
        focusToggle.innerHTML = `<span class="tp-icon" style="width:14px;height:14px"><svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-sky" d="M24 12 9 5M40 12l15-7M24 17 7 18M40 17l17 1"/><path class="tp-fill-mango" d="M25 10h14v11H25z"/><path d="M28 10V7h8v3"/><path d="M25 21h14"/><path class="tp-fill-paper" d="M22 21h20l5 37H17z"/><path d="M26 21l-3 37M38 21l3 37"/><path d="M20 33h24M19 45h26M16 58h32"/><path class="tp-fill-teal" d="M29 33h6v9h-6z"/><path d="M32 21v37"/></svg></span> ${inFocus ? 'Salir' : 'Enfoque'}`;
        focusToggle.setAttribute('aria-label', inFocus ? 'Salir del enfoque · Exit focus' : 'Modo enfoque · Focus mode');
        focusToggle.setAttribute('title', inFocus ? 'Salir del enfoque · Exit focus' : 'Modo enfoque · Focus mode');
    }
}

// ════════════════════════════════════════════════════════
//  DRAFT FOCUS MODE (persistent, gentle writing state)
//  body.draft-focus-active — de-emphasizes chat, highlights editor
//  Does NOT hide anything; all content remains accessible.
// ════════════════════════════════════════════════════════
function enterDraftFocus() {
    if (state.draftFocus) return;
    // Don't layer on top of aggressive focus-mode (hide-coach) or active spotlight
    if (document.querySelector('.workspace').classList.contains('focus-mode')) return;
    if (state.spotlightTarget) return;
    state.draftFocus = true;
    document.body.classList.add('draft-focus-active');
    _syncFocusToggleBtn();
}

function exitDraftFocus() {
    if (!state.draftFocus) return;
    state.draftFocus = false;
    document.body.classList.remove('draft-focus-active');
    _syncFocusToggleBtn();
}

function toggleDraftFocus() {
    if (state.draftFocus) { exitDraftFocus(); } else { enterDraftFocus(); }
}

function _syncFocusToggleBtn() {
    const btn = document.getElementById('focusToggle');
    if (!btn) return;
    const lbl = btn.querySelector('.focus-toggle-label');
    if (state.draftFocus) {
        btn.setAttribute('aria-label', 'Volver al coach · Return to coach');
        btn.setAttribute('title', 'Volver al coach · Return to coach');
        if (lbl) lbl.textContent = 'Coach';
    } else {
        btn.setAttribute('aria-label', 'Enfocarse en el borrador · Focus on draft');
        btn.setAttribute('title', 'Enfocarse en el borrador · Focus on draft');
        if (lbl) lbl.textContent = 'Enfoque';
    }
}

// ════════════════════════════════════════════════════════
//  FOCUS SPOTLIGHT SYSTEM
//  Uses body class + opacity dimming — no z-index tricks
// ════════════════════════════════════════════════════════
const _spotlightSeen = new Set();
let _spotlightTimer = null;

function _spotlightClearTimer() {
    if (_spotlightTimer) { clearTimeout(_spotlightTimer); _spotlightTimer = null; }
}

function shouldShowSpotlight(stageId) {
    if (_spotlightSeen.has(stageId)) return false;
    try { if (localStorage.getItem('tupana_spotlight_off') === 'true') return false; } catch(e) {}
    return true;
}

function scheduleCoachSpotlight(stageId) {
    if (!shouldShowSpotlight(stageId)) return;
    state.spotlightTarget  = 'coach';
    state.spotlightStageId = stageId;
    _spotlightClearTimer();
    // If a phase celebration toast is open, defer until the student dismisses it
    if (D.phaseToast && D.phaseToast.classList.contains('on')) {
        state.pendingSpotlightStageId = stageId;
        return;
    }
    // Wait 900ms so the Pana Hint (injected at 500ms) has time to appear
    _spotlightTimer = setTimeout(() => {
        if (state.spotlightTarget !== 'coach') return;
        if (document.body.classList.contains('spotlight-coach')) return; // already active
        const hints = D.chatMessages.querySelectorAll('.pana-hint');
        const el = hints.length ? hints[hints.length - 1] : null;
        if (el) {
            _activateCoachSpotlightOn(el);
        } else {
            // No Pana Hint yet: wait up to 7s for a bot message, then just clear
            _spotlightTimer = setTimeout(() => {
                if (state.spotlightTarget === 'coach') dismissCoachSpotlight();
            }, 7000);
        }
    }, 900);
}

function _spotlightDocClickHandler(e) {
    const tgt = state.spotlightTarget;
    if (!tgt) return;
    if (e.target.closest('#spotlightOptOut')) return;
    if (tgt === 'coach') {
        if (!e.target.closest('.spotlight-target') && !e.target.closest('#spotlightCoachLabel')) {
            dismissCoachSpotlight();
        }
    } else if (tgt === 'editor') {
        dismissEditorSpotlight();
    }
}

function _activateCoachSpotlightOn(_msgEl) {
    // Highlight the entire chat messages window so all coach guidance is visible,
    // not just the most recently injected element.
    _spotlightClearTimer();
    D.chatMessages.classList.add('spotlight-target');
    const label = document.createElement('div');
    label.className = 'spotlight-label';
    label.id = 'spotlightCoachLabel';
    label.innerHTML =
        '<span class="spotlight-label-text">Lee esto primero · Read this first.</span>' +
        '<button class="spotlight-label-btn" onclick="confirmCoachSpotlight()" ' +
        'aria-label="Entendido, ir al editor · Got it, go to editor">Entendido</button>';
    D.chatMessages.appendChild(label);
    document.body.classList.add('spotlight-coach');
    _appendSpotlightOptOut();
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
    setTimeout(() => document.addEventListener('click', _spotlightDocClickHandler), 80);
    _spotlightTimer = setTimeout(() => {
        if (state.spotlightTarget === 'coach') dismissCoachSpotlight();
    }, 5000);
}

function dismissCoachSpotlight() {
    _spotlightClearTimer();
    document.removeEventListener('click', _spotlightDocClickHandler);
    D.chatMessages.querySelectorAll('.spotlight-target').forEach(el => el.classList.remove('spotlight-target'));
    document.getElementById('spotlightCoachLabel')?.remove();
    document.body.classList.remove('spotlight-coach');
    _removeSpotlightOptOut();
    if (state.spotlightStageId !== null) _spotlightSeen.add(state.spotlightStageId);
    state.spotlightTarget  = null;
    state.spotlightStageId = null;
}

// Called only by the explicit "Entendido" button — the student has read the hints
// and deliberately chosen to move to the draft editor.
function confirmCoachSpotlight() {
    _spotlightClearTimer();
    document.removeEventListener('click', _spotlightDocClickHandler);
    D.chatMessages.querySelectorAll('.spotlight-target').forEach(el => el.classList.remove('spotlight-target'));
    document.getElementById('spotlightCoachLabel')?.remove();
    document.body.classList.remove('spotlight-coach');
    _activateEditorSpotlight();
}

function _activateEditorSpotlight() {
    state.spotlightTarget = 'editor';
    const wrap = document.querySelector('.draft-textarea-wrap');
    if (wrap) {
        wrap.classList.add('spotlight-target');
        const label = document.createElement('div');
        label.className = 'spotlight-label';
        label.id = 'spotlightEditorLabel';
        label.setAttribute('aria-live', 'polite');
        label.innerHTML = '<span class="spotlight-label-text">Ahora escribe aquí · Now write here.</span>';
        wrap.appendChild(label);
    }
    document.body.classList.add('spotlight-editor');
    requestAnimationFrame(() => {
        if (D.draftArea && !D.draftArea.disabled) D.draftArea.focus();
    });
    setTimeout(() => document.addEventListener('click', _spotlightDocClickHandler), 80);
    _spotlightClearTimer();
    _spotlightTimer = setTimeout(() => {
        if (state.spotlightTarget === 'editor') dismissEditorSpotlight();
    }, 5000);
}

function dismissEditorSpotlight() {
    _spotlightClearTimer();
    document.removeEventListener('click', _spotlightDocClickHandler);
    document.querySelector('.draft-textarea-wrap')?.classList.remove('spotlight-target');
    document.getElementById('spotlightEditorLabel')?.remove();
    _removeSpotlightOptOut();
    document.body.classList.remove('spotlight-editor');
    if (state.spotlightStageId !== null) _spotlightSeen.add(state.spotlightStageId);
    state.spotlightTarget  = null;
    state.spotlightStageId = null;
    // Spotlight said "write here" — carry that intent into persistent draft focus
    setTimeout(enterDraftFocus, 80);
}

function _appendSpotlightOptOut() {
    if (document.getElementById('spotlightOptOut')) return;
    const btn = document.createElement('button');
    btn.className = 'spotlight-opt-out';
    btn.id = 'spotlightOptOut';
    btn.textContent = "No mostrar otra vez · Don't show again";
    btn.setAttribute('aria-label', "No mostrar otra vez · Don't show again");
    btn.onclick = _disableSpotlight;
    document.body.appendChild(btn);
}

function _removeSpotlightOptOut() {
    document.getElementById('spotlightOptOut')?.remove();
}

function _disableSpotlight() {
    if (state.spotlightTarget === 'coach') {
        D.chatMessages.querySelectorAll('.spotlight-target').forEach(el => el.classList.remove('spotlight-target'));
        document.getElementById('spotlightCoachLabel')?.remove();
        document.body.classList.remove('spotlight-coach');
        state.spotlightTarget = 'editor';
    }
    dismissEditorSpotlight();
    try { localStorage.setItem('tupana_spotlight_off', 'true'); } catch(e) {}
    addSysTech('Las guías visuales han sido desactivadas. / Visual guides have been disabled.');
}

//  INIT
// ════════════════════════════════════════════════════════
//  PROCESS REPORT GENERATION
// ════════════════════════════════════════════════════════
function openReport() {
    const bg = document.getElementById('reportBg');
    const body = document.getElementById('reportBody');
    body.innerHTML = buildReportHTML();
    bg.classList.add('on');
}
function closeReport() {
    document.getElementById('reportBg').classList.remove('on');
}

function gatherProcessNoteData() {
    const draft = (() => { try { return localStorage.getItem('tupana_draft') || ''; } catch(e) { return ''; } })();
    const chatLog = (() => { try { return JSON.parse(localStorage.getItem('tupana_chatlog') || '[]'); } catch(e) { return []; } })();
    const decisions = (() => { try { return JSON.parse(localStorage.getItem('tupana_decisions') || '[]'); } catch(e) { return []; } })();
    const maniSentence = (() => { try { return localStorage.getItem('tupana_mani_sentence') || ''; } catch(e) { return ''; } })();
    const draftSaved = (() => { try { return localStorage.getItem('tupana_draft_saved') === 'true'; } catch(e) { return false; } })();
    const wordCount = draft.trim().split(/\s+/).filter(Boolean).length;
    const stage = state.stage;
    const stageName = STAGES[stage - 1] ? STAGES[stage - 1].es.replace('\n', ' ') + ' / ' + STAGES[stage - 1].en : '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const accepted = decisions.filter(d => d.choice === 'good').length;
    const questioned = decisions.filter(d => d.choice === 'flag').length;
    const thinking = decisions.filter(d => d.choice === 'warn').length;
    const botMsgs = chatLog.filter(m => m.who === 'bot').length;
    return { draftSaved, wordCount, stage, stageName, maniSentence, accepted, questioned, thinking, botMsgs, dateStr };
}

function openProcessNoteModal() {
    if (!D.pnModalBg || !D.pnModalBody) return;
    const data = gatherProcessNoteData();
    D.pnModalBody.innerHTML = `
      <div class="report-note-box">
        <p>Completa cada sección directamente aquí. Tu trabajo se guarda automáticamente en este navegador. <em>Revisa y reescribe en tus propias palabras antes de entregar.</em></p>
        <p>Complete each section directly here. Your work auto-saves in this browser. <em>Review and rewrite in your own words before submitting.</em></p>
        ${buildProcessNoteHTML(data)}
      </div>
    `;
    D.pnModalBg.classList.add('on');
    // Focus the first textarea for accessibility
    setTimeout(() => {
        const firstTextarea = D.pnModalBody.querySelector('.report-pn-text');
        if (firstTextarea) firstTextarea.focus();
    }, 100);
}

function closeProcessNoteModal() {
    if (D.pnModalBg) D.pnModalBg.classList.remove('on');
}

function finishProcessNote() {
    closeProcessNoteModal();
    try { localStorage.setItem('tupana_completion_shown', 'true'); } catch(e) {}
    setTimeout(showCompletionCelebration, 300);
}

function showCompletionCelebration() {
    if (D.completionBg) D.completionBg.classList.add('on');
}

function dismissCompletionCelebration() {
    if (D.completionBg) D.completionBg.classList.remove('on');
}

function loadProcessNoteAnswers() {
    try {
        return JSON.parse(localStorage.getItem('tupana_process_note') || '{}');
    } catch(e) {
        return {};
    }
}

let _pnSaveTimers = {};
function saveProcessNoteAnswer(key, value) {
    clearTimeout(_pnSaveTimers[key]);
    _pnSaveTimers[key] = setTimeout(() => {
        const answers = loadProcessNoteAnswers();
        answers[key] = value;
        try { localStorage.setItem('tupana_process_note', JSON.stringify(answers)); } catch(e) {}
        // Show saved indicator
        const indicator = document.getElementById('pn-saved-' + key);
        if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => indicator.classList.remove('show'), 1200);
        }
    }, 400);
}

function buildProcessNoteHTML(data) {
    const { draftSaved, wordCount, stage, stageName, maniSentence, accepted, questioned, thinking, botMsgs, dateStr } = data;
    const answers = loadProcessNoteAnswers();

    const section = (num, titleEs, titleEn, staticHtml, key, placeholder) => `
      <div class="report-pn-section">
        <div class="report-pn-title">${num}. ${titleEs} · ${titleEn}</div>
        ${staticHtml ? `<div class="report-pn-static">${staticHtml}</div>` : ''}
        <textarea class="report-pn-text" id="pn-${key}" placeholder="${placeholder}" oninput="saveProcessNoteAnswer('${key}', this.value)">${escapeHtml(answers[key] || '')}</textarea>
        <span class="report-pn-saved" id="pn-saved-${key}">Guardado · Saved</span>
      </div>
    `;

    const q2Static = `Comencé en la Etapa ${stage} (${stageName}). ${draftSaved ? `Guardé mi primer borrador de ${wordCount} palabras antes de recibir retroalimentación con IA. / I saved my first draft of ${wordCount} words before receiving AI feedback.` : 'Aún no he guardado mi primer borrador. / I have not saved my first draft yet.'}`;
    const q5Static = `De ${accepted + questioned + thinking} evaluaciones de retroalimentación, acepté ${accepted}, cuestioné ${questioned}, y pensé más sobre ${thinking}. / Of ${accepted + questioned + thinking} feedback evaluations, I accepted ${accepted}, questioned ${questioned}, and thought more about ${thinking}.`;
    const q8Static = maniSentence
        ? `Recuerdo lo que escribí en Tu Conocimiento: "${escapeHtml(maniSentence)}" / I remember what I wrote in Tu Conocimiento: "${escapeHtml(maniSentence)}"`
        : '';

    return `
      <div class="report-pn-section">
        <div class="report-pn-title">1. ¿Qué herramienta de IA usaste? · What AI tool did you use?</div>
        <div class="report-pn-static">Usé Tu Pana de Escritura, un coach de escritura bilingüe integrado en el proceso de redacción de mi ensayo de género mixto. / I used Tu Pana de Escritura, a bilingual writing coach integrated into my mixed-genre essay writing process.</div>
      </div>

      <div class="report-pn-section">
        <div class="report-pn-title">2. ¿En qué etapa del proceso usaste la IA? · At what stage did you use AI?</div>
        <div class="report-pn-static">${q2Static}</div>
      </div>

      ${section(3, '¿Qué tipo de ayuda recibiste?', 'What kind of help did you receive?',
        `Recibí ${botMsgs} respuestas del coach de escritura. La retroalimentación se centró en: / I received ${botMsgs} responses from the writing coach. The feedback focused on:`,
        'q3',
        'Menciona las etapas donde recibiste ayuda: brainstorming, conexión personal-contexto, pitch, esquema, revisión de párrafos, oración puente, revisión de voz, gramática, checklist... / Mention the stages where you received help...')}

      ${section(4, '¿Qué sugerencia aceptaste y por qué?', 'What suggestion did you accept and why?',
        '', 'q4',
        'Describe una sugerencia específica que te dio el coach y que decidiste incorporar. Explica por qué mejoró tu ensayo. / Describe one specific suggestion the coach gave that you decided to incorporate...')}

      ${section(5, '¿Qué sugerencia rechazaste o modificaste?', 'What suggestion did you reject or modify?',
        q5Static, 'q5',
        'Describe una sugerencia que no te convenció o que adaptaste a tu propia voz. Explica tu razonamiento. / Describe one suggestion you were not convinced by or that you adapted to your own voice...')}

      ${section(6, '¿Cómo protegiste tu propia voz?', 'How did you protect your own voice?',
        '', 'q6',
        'Menciona detalles específicos de tu ensayo que decidiste mantener a pesar de las sugerencias: una frase en español, un detalle familiar, un momento sensorial... / Mention specific details from your essay you chose to keep despite coach suggestions...')}

      ${section(7, '¿Qué parte del ensayo final todavía suena más como tú?', 'What part of the final essay still sounds most like you?',
        '', 'q7',
        'Identifica el párrafo, la oración o el detalle que sientes que representa mejor tu voz. / Identify the paragraph, sentence, or detail that best represents your voice.')}

      ${section(8, 'Reflexión final', 'Final reflection',
        q8Static, 'q8',
        'Reflexiona sobre cómo tu conocimiento previo —lingüístico, familiar, comunitario— se refleja en tu ensayo final. / Reflect on how your prior knowledge is reflected in your final essay.')}
    `;
}

function buildReportHTML() {
    const draft = (() => { try { return localStorage.getItem('tupana_draft') || ''; } catch(e) { return ''; } })();
    const chatLog = (() => { try { return JSON.parse(localStorage.getItem('tupana_chatlog') || '[]'); } catch(e) { return []; } })();
    const decisions = (() => { try { return JSON.parse(localStorage.getItem('tupana_decisions') || '[]'); } catch(e) { return []; } })();
    const maniSentence = (() => { try { return localStorage.getItem('tupana_mani_sentence') || ''; } catch(e) { return ''; } })();
    const draftSaved = (() => { try { return localStorage.getItem('tupana_draft_saved') === 'true'; } catch(e) { return false; } })();
    const wordCount = draft.trim().split(/\s+/).filter(Boolean).length;
    const stage = state.stage;
    const stageName = STAGES[stage - 1] ? STAGES[stage - 1].es.replace('\n', ' ') + ' / ' + STAGES[stage - 1].en : '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const accepted = decisions.filter(d => d.choice === 'good').length;
    const questioned = decisions.filter(d => d.choice === 'flag').length;
    const thinking = decisions.filter(d => d.choice === 'warn').length;
    const botMsgs = chatLog.filter(m => m.who === 'bot').length;
    const userMsgs = chatLog.filter(m => m.who === 'user').length;

    return `
      <div class="report-section">
        <div class="report-section-header">Resumen · Summary</div>
        <div class="report-section-body">
Fecha · Date: ${dateStr}
Etapa actual · Current stage: ${stage} — ${stageName}
Borrador guardado · Draft saved: ${draftSaved ? 'Sí · Yes' : 'No'}
Palabras en borrador · Draft words: ${wordCount}
Mensajes con el coach · Coach messages: ${botMsgs} respuestas · responses, ${userMsgs} mensajes del estudiante · student messages
Decisiones de revisión · Revision decisions: ${decisions.length} total (${accepted} aceptadas · accepted, ${questioned} cuestionadas · questioned, ${thinking} pensando · thinking)
        </div>
      </div>

      ${maniSentence ? `
      <div class="report-section">
        <div class="report-section-header">Mi Conocimiento · My Knowledge (from Tu Conocimiento)</div>
        <div class="report-section-body">${escapeHtml(maniSentence)}</div>
      </div>` : ''}

      <div class="report-section">
        <div class="report-section-header">Mi Borrador · My Draft${draftSaved ? '' : ' — NO GUARDADO · NOT SAVED'}</div>
        <div class="report-section-body ${draft ? '' : 'empty'}">${draft ? escapeHtml(draft) : 'Aún no has guardado un borrador. · You have not saved a draft yet.'}</div>
      </div>

      <div class="report-section">
        <div class="report-section-header">Conversación con el Coach · Coach Conversation</div>
        <div class="report-section-body ${chatLog.length ? '' : 'empty'}">${chatLog.length ? formatChatForReport(chatLog) : 'Aún no hay conversaciones. · No conversations yet.'}</div>
      </div>

      <div class="report-section">
        <div class="report-section-header">Mis Decisiones de Revisión · My Revision Decisions</div>
        <div class="report-section-body ${decisions.length ? '' : 'empty'}">${decisions.length ? formatDecisionsForReport(decisions) : 'Aún no has evaluado retroalimentación. · You have not evaluated any feedback yet.'}</div>
      </div>

      <div class="report-note-box">
        <h4>Nota de Proceso · Process Note</h4>
        <p>Completa cada sección directamente aquí. Tu trabajo se guarda automáticamente en este navegador. <em>Revisa y reescribe en tus propias palabras antes de entregar.</em></p>
        <p>Complete each section directly here. Your work auto-saves in this browser. <em>Review and rewrite in your own words before submitting.</em></p>
        ${buildProcessNoteHTML({ draftSaved, wordCount, stage, stageName, maniSentence, accepted, questioned, thinking, botMsgs, dateStr })}
      </div>
    `;
}

function generateProcessNoteScaffold(data) {
    const { draftSaved, wordCount, stage, stageName, maniSentence, accepted, questioned, thinking, botMsgs, dateStr } = data;
    const answers = data.answers || {};

    const ans = (key, fallback) => {
        const val = (answers[key] || '').trim();
        return val || fallback;
    };

    return `Tu Pana de Escritura — Nota de Proceso · Process Note
Generado el · Generated: ${dateStr}

=== 1. ¿Qué herramienta de IA usaste? · What AI tool did you use? ===
Usé Tu Pana de Escritura, un coach de escritura bilingüe integrado en el proceso de redacción de mi ensayo de género mixto. / I used Tu Pana de Escritura, a bilingual writing coach integrated into my mixed-genre essay writing process.

=== 2. ¿En qué etapa del proceso usaste la IA? · At what stage did you use AI? ===
Comencé en la Etapa ${stage} (${stageName}). ${draftSaved ? `Guardé mi primer borrador de ${wordCount} palabras antes de recibir retroalimentación con IA. / I saved my first draft of ${wordCount} words before receiving AI feedback.` : 'Aún no he guardado mi primer borrador. / I have not saved my first draft yet.'}

=== 3. ¿Qué tipo de ayuda recibiste? · What kind of help did you receive? ===
Recibí ${botMsgs} respuestas del coach de escritura. La retroalimentación se centró en: / I received ${botMsgs} responses from the writing coach. The feedback focused on:
${ans('q3', '[PENDIENTE · PENDING: menciona las etapas donde recibiste ayuda / mention the stages where you received help]')}

=== 4. ¿Qué sugerencia aceptaste y por qué? · What suggestion did you accept and why? ===
${ans('q4', '[PENDIENTE · PENDING: describe una sugerencia específica que aceptaste y por qué / describe one specific suggestion you accepted and why]')}

=== 5. ¿Qué sugerencia rechazaste o modificaste? · What suggestion did you reject or modify? ===
De ${accepted + questioned + thinking} evaluaciones de retroalimentación, acepté ${accepted}, cuestioné ${questioned}, y pensé más sobre ${thinking}. / Of ${accepted + questioned + thinking} feedback evaluations, I accepted ${accepted}, questioned ${questioned}, and thought more about ${thinking}.
${ans('q5', '[PENDIENTE · PENDING: describe una sugerencia que rechazaste o modificaste / describe one suggestion you rejected or modified]')}

=== 6. ¿Cómo protegiste tu propia voz? · How did you protect your own voice? ===
${ans('q6', '[PENDIENTE · PENDING: menciona detalles específicos que mantuviste / mention specific details you chose to keep]')}

=== 7. ¿Qué parte del ensayo final todavía suena más como tú? · What part of the final essay still sounds most like you? ===
${ans('q7', '[PENDIENTE · PENDING: identifica el párrafo, oración o detalle que representa mejor tu voz / identify the paragraph, sentence, or detail that best represents your voice]')}

=== 8. Reflexión final · Final reflection ===
${maniSentence ? `Recuerdo lo que escribí en Tu Conocimiento: "${maniSentence}" / I remember what I wrote in Tu Conocimiento: "${maniSentence}"` : ''}
${ans('q8', '[PENDIENTE · PENDING: reflexiona sobre cómo tu conocimiento previo se refleja en tu ensayo / reflect on how your prior knowledge is reflected in your final essay]')}

---
Nota: Esta nota de proceso fue completada dentro de Tu Pana de Escritura y exportada para entrega.
Note: This process note was completed inside Tu Pana de Escritura and exported for submission.
`;
}

function formatChatForReport(log) {
    return log.map(entry => {
        const time = entry.t ? new Date(entry.t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
        const who = entry.who === 'bot' ? 'Coach' : 'Yo · Me';
        return `[${time}] ${who}:\n${entry.text}\n`;
    }).join('\n');
}

function formatDecisionsForReport(decisions) {
    return decisions.map(d => {
        const time = new Date(d.t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const label = d.choice === 'good' ? 'Acepté · Accepted' : d.choice === 'warn' ? '? Pensando más · Thinking more' : 'Cuestioné · Questioned';
        return `${time} — ${d.q}: ${label}`;
    }).join('\n');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

let currentReportText = '';

function getReportText() {
    const draft = (() => { try { return localStorage.getItem('tupana_draft') || ''; } catch(e) { return ''; } })();
    const chatLog = (() => { try { return JSON.parse(localStorage.getItem('tupana_chatlog') || '[]'); } catch(e) { return []; } })();
    const decisions = (() => { try { return JSON.parse(localStorage.getItem('tupana_decisions') || '[]'); } catch(e) { return []; } })();
    const maniSentence = (() => { try { return localStorage.getItem('tupana_mani_sentence') || ''; } catch(e) { return ''; } })();
    const draftSaved = (() => { try { return localStorage.getItem('tupana_draft_saved') === 'true'; } catch(e) { return false; } })();
    const wordCount = draft.trim().split(/\s+/).filter(Boolean).length;
    const stage = state.stage;
    const stageName = STAGES[stage - 1] ? STAGES[stage - 1].es.replace('\n', ' ') + ' / ' + STAGES[stage - 1].en : '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dateStrEn = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const accepted = decisions.filter(d => d.choice === 'good').length;
    const questioned = decisions.filter(d => d.choice === 'flag').length;
    const thinking = decisions.filter(d => d.choice === 'warn').length;
    const botMsgs = chatLog.filter(m => m.who === 'bot').length;
    const userMsgs = chatLog.filter(m => m.who === 'user').length;

    const processNote = generateProcessNoteScaffold({
        draftSaved, wordCount, stage, stageName, maniSentence,
        accepted, questioned, thinking, botMsgs, userMsgs, dateStr,
        answers: loadProcessNoteAnswers()
    });

    const chatText = formatChatForReport(chatLog);
    const decisionsText = formatDecisionsForReport(decisions);

    return `================================================================================
  MI REPORTE DE PROCESO · MY PROCESS REPORT
  Tu Pana de Escritura
  ${dateStr} · ${dateStrEn}
================================================================================

[ RESUMEN · SUMMARY ]
--------------------------------------------------------------------------------
Etapa actual · Current stage: ${stage} — ${stageName}
Borrador guardado · Draft saved: ${draftSaved ? 'Sí · Yes' : 'No · No'}
Palabras en borrador · Draft words: ${wordCount}
Mensajes con el coach · Coach messages: ${botMsgs} responses, ${userMsgs} student messages
Decisiones de revisión · Revision decisions: ${decisions.length} total (${accepted} accepted, ${questioned} questioned, ${thinking} thinking)

${maniSentence ? `[ MI CONOCIMIENTO · MY KNOWLEDGE ]
--------------------------------------------------------------------------------
${maniSentence}

` : ''}[ MI BORRADOR · MY DRAFT ]
--------------------------------------------------------------------------------
${draftSaved ? `(Borrador guardado · Draft saved — ${wordCount} palabras · words)` : '[ ATENCION · ATTENTION ] BORRADOR NO GUARDADO · DRAFT NOT SAVED'}

${draft || '[Sin borrador · No draft]'}

[ CONVERSACION CON EL COACH · COACH CONVERSATION ]
--------------------------------------------------------------------------------
${chatText || '[Sin conversaciones · No conversations]'}

[ MIS DECISIONES DE REVISION · MY REVISION DECISIONS ]
--------------------------------------------------------------------------------
${decisionsText || '[Sin decisiones · No decisions]'}

================================================================================
[ NOTA DE PROCESO · PROCESS NOTE (auto-generated scaffold) ]
================================================================================
${processNote}

================================================================================
FIN DEL REPORTE · END OF REPORT
================================================================================`;
}

function copyReport() {
    const text = getReportText();
    navigator.clipboard.writeText(text).then(() => {
        alert('Reporte copiado al portapapeles. Pégalo en un documento o correo.\nReport copied to clipboard. Paste it into a document or email.');
    }).catch(() => {
        alert('No se pudo copiar automáticamente. Usa "Descargar .txt" en su lugar.\nCould not copy automatically. Use "Download .txt" instead.');
    });
}

function downloadReport() {
    const text = getReportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tupana-process-report-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function emailReport() {
    const text = getReportText();
    const subject = encodeURIComponent('Mi Reporte de Proceso — Tu Pana de Escritura');
    const body = encodeURIComponent(text.slice(0, 1800) + '\n\n[El reporte completo está adjunto como .txt · Full report attached as .txt]');
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    // Also trigger download since mailto body is limited
    setTimeout(downloadReport, 500);
}

// ════════════════════════════════════════════════════════
//  INSTRUCTOR REPORT — Instructor Visibility Lite
// ════════════════════════════════════════════════════════
const REPORT_META_KEY = 'tupana_report_meta';

function loadReportMeta() {
    try { return JSON.parse(localStorage.getItem(REPORT_META_KEY) || '{}'); } catch(e) { return {}; }
}
function saveReportMeta(meta) {
    try { localStorage.setItem(REPORT_META_KEY, JSON.stringify(meta)); } catch(e) {}
}

function generateInstructorReport() {
    const meta       = loadReportMeta();
    const capstone   = loadCapstoneData();
    const decisions  = (() => { try { return JSON.parse(localStorage.getItem('tupana_decisions') || '[]'); } catch(e) { return []; } })();
    const chatLog    = (() => { try { return JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || '[]'); } catch(e) { return []; } })();
    const draft      = (() => { try { return localStorage.getItem('tupana_draft') || ''; } catch(e) { return ''; } })();
    const draftSaved = (() => { try { return localStorage.getItem('tupana_draft_saved') === 'true'; } catch(e) { return false; } })();
    const protected_ = loadProtected();
    const pnAnswers  = loadProcessNoteAnswers();
    const wc         = draft.trim().split(/\s+/).filter(Boolean).length;

    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });

    const accepted   = decisions.filter(d => d.choice === 'good').length;
    const questioned = decisions.filter(d => d.choice === 'flag').length;
    const thinking   = decisions.filter(d => d.choice === 'warn').length;
    const botMsgs    = chatLog.filter(m => m.who === 'bot').length;
    const userMsgs   = chatLog.filter(m => m.who === 'user').length;

    const stagesCompleted = Array.from({ length: 10 }, (_, i) => i + 1)
        .filter(i => state.done.has(i) || i < state.stage);
    const finalStageObj = STAGES[state.stage - 1];
    const finalStageName = finalStageObj
        ? `Stage ${state.stage} — ${finalStageObj.en}`
        : `Stage ${state.stage}`;

    // na: for required student-written fields (Process Note Q3–Q8)
    const na = (val, fallback = '[Not filled in — student completes this via the Process Note button in the app]') =>
        (val && val.trim()) ? val.trim() : fallback;

    // naOpt: for genuinely optional fields (Stage 10 short reflections)
    const naOpt = val => (val && val.trim()) ? val.trim() : '— (optional, not filled in)';

    const ratingLabel = val => {
        const r = CAPSTONE_RATINGS.find(r => r.val === val);
        return r ? r.en : 'Not rated';
    };

    const ratings      = capstone.ratings        || {};
    const reflections  = capstone.reflections    || {};
    const studentResp  = capstone.studentResponse || {};

    const line = (n) => '='.repeat(n);

    let r = '';
    r += `${line(72)}\n`;
    r += `  STUDENT WRITING PROCESS REPORT\n`;
    r += `  Tu Pana de Escritura — CUNY Hostos Community College\n`;
    r += `  Generated: ${dateStr} at ${timeStr}\n`;
    r += `${line(72)}\n\n`;

    r += `STUDENT INFORMATION\n`;
    r += `${line(40)}\n`;
    r += `Name / Identifier : ${na(meta.studentName, 'Not provided')}\n`;
    r += `Assignment Title  : ${na(meta.assignmentTitle, 'Not provided')}\n`;
    r += `Course / Section  : ${na(meta.courseSection, 'Not provided')}\n\n`;

    r += `${line(72)}\n`;
    r += `SECTION 1 — FIRST DRAFT GATE  [System-recorded]\n`;
    r += `${line(72)}\n`;
    r += `Unassisted first draft saved : ${draftSaved ? 'YES' : 'NO — not completed'}\n`;
    r += `Word count at save           : ${draftSaved ? wc + ' words' : 'N/A'}\n`;
    r += `Authorship gate              : ${draftSaved
        ? 'PASSED — student completed first draft before AI revision feedback'
        : 'NOT PASSED — draft was not saved before accessing revision stages'}\n`;
    r += `Note: This gate is enforced by the app and cannot be bypassed.\n\n`;

    r += `${line(72)}\n`;
    r += `SECTION 2 — STAGE PROGRESS  [System-recorded]\n`;
    r += `${line(72)}\n`;
    r += `Final stage reached  : ${finalStageName}\n`;
    r += `Stages completed     : ${stagesCompleted.join(' · ') || 'None'}\n`;
    r += `All 10 stages done   : ${state.done.has(10) ? 'Yes' : 'No'}\n\n`;

    r += `${line(72)}\n`;
    r += `SECTION 3 — AI FEEDBACK ENGAGEMENT  [System-recorded]\n`;
    r += `${line(72)}\n`;
    r += `Coach responses received   : ${botMsgs}\n`;
    r += `Student messages sent      : ${userMsgs}\n`;
    r += `Feedback evaluations total : ${decisions.length}\n`;
    r += `  ✓ Accepted               : ${accepted}\n`;
    r += `  ? Thinking more about    : ${thinking}\n`;
    r += `  ✗ Questioned / flagged   : ${questioned}\n`;
    if (decisions.length) {
        r += `\nDecision log (most recent first, up to 20):\n`;
        const choiceLabel = c => c === 'good' ? '✓ Accepted' : c === 'warn' ? '? Thinking more' : '✗ Questioned';
        decisions.slice(-20).reverse().forEach((d, i) => {
            const ts = d.t ? new Date(d.t).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true }) : '';
            r += `  ${i + 1}. ${choiceLabel(d.choice)} — "${d.q}"${ts ? ' (' + ts + ')' : ''}\n`;
        });
    }
    r += `\n`;

    r += `${line(72)}\n`;
    r += `SECTION 4 — VOICE VAULT: Phrases and passages chosen to protect  [System-recorded]\n`;
    r += `${line(72)}\n`;
    if (protected_.length) {
        protected_.forEach((p, i) => {
            const kind = p.text.length > 60 ? '[passage]' : '[phrase] ';
            r += `  ${i + 1}. ${kind} "${p.text}"\n`;
        });
    } else {
        r += `  No phrases or passages recorded.\n`;
    }
    r += `\n`;

    r += `${line(72)}\n`;
    r += `SECTION 5 — PROCESS REFLECTIONS  [Student-written via Process Note]\n`;
    r += `${line(72)}\n`;
    r += `NOTE: These fields are filled by the student using the Process Note button\n`;
    r += `in the app's draft footer. If a field shows "[Not filled in]", the student\n`;
    r += `has not yet completed that question — it does not indicate a system error.\n`;
    r += `See Section 6 for Stage 10 self-assessment data (separate from this section).\n\n`;
    const q3 = na(pnAnswers.q3); const q4 = na(pnAnswers.q4);
    const q5 = na(pnAnswers.q5); const q6 = na(pnAnswers.q6);
    const q7 = na(pnAnswers.q7); const q8 = na(pnAnswers.q8);
    r += `Q3. What kind of AI help did you receive?\n${q3}\n\n`;
    r += `Q4. What suggestion did you accept and why?\n${q4}\n\n`;
    r += `Q5. What suggestion did you reject or modify?\n${q5}\n\n`;
    r += `Q6. How did you protect your own voice?\n${q6}\n\n`;
    r += `Q7. What part of the final essay still sounds most like you?\n${q7}\n\n`;
    r += `Q8. Final reflection (prior knowledge, community, language):\n${q8}\n\n`;

    r += `${line(72)}\n`;
    r += `SECTION 6 — SELF-ASSESSMENT  [Student-written, Stage 10]\n`;
    r += `${line(72)}\n`;
    r += `10A — Self-Check Ratings\n`;
    CAPSTONE_CRITERIA.forEach(c => {
        r += `  ${c.en.padEnd(36)} : ${ratingLabel(ratings[c.key])}\n`;
    });
    r += `\n10A — Short Reflections (optional)\n`;
    r += `One thing I improved:\n${naOpt(reflections.improved)}\n\n`;
    r += `One thing that still needs work:\n${naOpt(reflections.needs)}\n\n`;
    r += `One decision I made to protect my voice:\n${naOpt(reflections.voice)}\n\n`;

    const has10C = studentResp.agree || studentResp.disagree || studentResp.missing;
    r += `10C — My Response to the Coach Perspective\n`;
    if (has10C) {
        r += `Where I agree:\n${naOpt(studentResp.agree)}\n\n`;
        r += `Where I disagree:\n${naOpt(studentResp.disagree)}\n\n`;
        r += `What the coach might be missing:\n${naOpt(studentResp.missing)}\n\n`;
    } else {
        r += `  Not yet completed — student has not yet compared with the coach perspective.\n\n`;
    }

    r += `${line(72)}\n`;
    r += `SECTION 7 — AUTHORSHIP CONFIRMATION\n`;
    r += `${line(72)}\n`;
    r += `☑  I completed my first draft before using AI feedback.\n`;
    r += `☑  The draft, revisions, and final decisions are my own responsibility.\n`;
    r += `☑  I used Tu Pana de Escritura as a writing support tool, not as a\n`;
    r += `   replacement for my own judgment.\n`;
    r += `☑  I have reviewed this report before submitting it.\n\n`;

    r += `${line(72)}\n`;
    r += `SUBMISSION NOTE\n`;
    r += `${line(72)}\n`;
    r += `This report was generated client-side by Tu Pana de Escritura.\n`;
    r += `It has NOT been automatically submitted anywhere.\n`;
    r += `Copy or download it and submit it in Brightspace with your assignment\n`;
    r += `as instructed by your professor.\n\n`;
    r += `This report does not include your draft text or full chat history.\n`;
    r += `For the full document (draft + chat), use the Reporte button in the app.\n`;
    r += `${line(72)}\n`;
    r += `END OF REPORT\n`;
    r += `${line(72)}\n`;

    return r;
}

function injectInstructorReportPanel(scrollTo) {
    if (document.getElementById('instrReportPanel')) {
        if (scrollTo) {
            document.getElementById('instrReportPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
    }

    const meta = loadReportMeta();
    const draftSaved = (() => { try { return localStorage.getItem('tupana_draft_saved') === 'true'; } catch(e) { return false; } })();
    const decisions  = (() => { try { return JSON.parse(localStorage.getItem('tupana_decisions') || '[]'); } catch(e) { return []; } })();
    const chatLog    = (() => { try { return JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || '[]'); } catch(e) { return []; } })();
    const protected_ = loadProtected();
    const accepted   = decisions.filter(d => d.choice === 'good').length;
    const questioned = decisions.filter(d => d.choice === 'flag').length;
    const thinking   = decisions.filter(d => d.choice === 'warn').length;
    const botMsgs    = chatLog.filter(m => m.who === 'bot').length;
    const draft      = (() => { try { return localStorage.getItem('tupana_draft') || ''; } catch(e) { return ''; } })();
    const wc         = draft.trim().split(/\s+/).filter(Boolean).length;
    const finalStageObj = STAGES[state.stage - 1];
    const finalStageName = finalStageObj ? `${state.stage} — ${finalStageObj.en}` : state.stage;
    const stagesDone = Array.from({ length: 10 }, (_,i) => i + 1).filter(i => state.done.has(i) || i < state.stage);

    logProcessEvent('instructor_report_generated', 'Instructor Process Report generated for Stage 10.');

    const panel = document.createElement('div');
    panel.className = 'instr-panel';
    panel.id = 'instrReportPanel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Instructor Process Report · Reporte de Proceso para el Instructor');

    panel.innerHTML = `
        <div class="instr-panel-title">
            <span class="show-es">Reporte de Proceso para el Instructor</span>
            <span class="lang-sep"> · </span>
            <span class="show-en">Instructor Process Report</span>
        </div>
        <p class="instr-panel-sub">
            <span class="show-es">Revisa este reporte antes de entregarlo. Cópialo o descárgalo y entrégalo en Brightspace junto con tu ensayo.</span>
            <span class="lang-sep"> · </span>
            <span class="show-en">Review this report before submitting. Copy or download it and submit it in Brightspace with your essay.</span>
        </p>

        <div class="instr-section-label">
            <span class="show-es">Información del estudiante</span>
            <span class="lang-sep"> · </span>
            <span class="show-en">Student Information</span>
        </div>
        <div class="instr-field-row">
            <label class="instr-field-label" for="instrName">
                <span class="show-es">Nombre / Identificador</span><span class="lang-sep"> · </span><span class="show-en">Name / Student ID</span>
            </label>
            <input type="text" class="instr-field-input" id="instrName"
                value="${escapeHtml(meta.studentName || '')}"
                placeholder="Your name or student ID..."
                oninput="saveReportMeta({...loadReportMeta(), studentName: this.value}); refreshInstrPreview()"
                autocomplete="name" />
        </div>
        <div class="instr-field-row">
            <label class="instr-field-label" for="instrAssignment">
                <span class="show-es">Título del trabajo</span><span class="lang-sep"> · </span><span class="show-en">Assignment Title</span>
            </label>
            <input type="text" class="instr-field-input" id="instrAssignment"
                value="${escapeHtml(meta.assignmentTitle || '')}"
                placeholder="Assignment or essay title..."
                oninput="saveReportMeta({...loadReportMeta(), assignmentTitle: this.value}); refreshInstrPreview()" />
        </div>
        <div class="instr-field-row">
            <label class="instr-field-label" for="instrCourse">
                <span class="show-es">Curso / Sección</span><span class="lang-sep"> · </span><span class="show-en">Course / Section</span>
            </label>
            <input type="text" class="instr-field-input" id="instrCourse"
                value="${escapeHtml(meta.courseSection || '')}"
                placeholder="e.g. ENG 111 — Section 01"
                oninput="saveReportMeta({...loadReportMeta(), courseSection: this.value}); refreshInstrPreview()" />
        </div>

        <div class="instr-divider"></div>

        <div class="instr-section-label">
            <span class="show-es">Evidencia del proceso</span><span class="lang-sep"> · </span><span class="show-en">Process Evidence</span>
            <span class="instr-sys-badge">System-recorded</span>
        </div>
        <div class="instr-evidence" role="list">
            <div class="instr-evidence-row" role="listitem">
                <span class="instr-evidence-key"><span class="show-es">Borrador sin ayuda guardado</span><span class="lang-sep"> · </span><span class="show-en">Unassisted draft saved</span></span>
                <span class="instr-evidence-val ${draftSaved ? 'ok' : 'warn'}">${draftSaved ? 'YES — ' + wc + ' words' : 'NO'}</span>
            </div>
            <div class="instr-evidence-row" role="listitem">
                <span class="instr-evidence-key"><span class="show-es">Etapa final alcanzada</span><span class="lang-sep"> · </span><span class="show-en">Final stage reached</span></span>
                <span class="instr-evidence-val ok">Stage ${escapeHtml(String(finalStageName))}</span>
            </div>
            <div class="instr-evidence-row" role="listitem">
                <span class="instr-evidence-key"><span class="show-es">Etapas completadas</span><span class="lang-sep"> · </span><span class="show-en">Stages completed</span></span>
                <span class="instr-evidence-val">${stagesDone.join(' · ') || '—'}</span>
            </div>
            <div class="instr-evidence-row" role="listitem">
                <span class="instr-evidence-key"><span class="show-es">Respuestas del coach</span><span class="lang-sep"> · </span><span class="show-en">Coach responses received</span></span>
                <span class="instr-evidence-val">${botMsgs}</span>
            </div>
            <div class="instr-evidence-row" role="listitem">
                <span class="instr-evidence-key"><span class="show-es">Decisiones de retroalimentación</span><span class="lang-sep"> · </span><span class="show-en">Feedback decisions</span></span>
                <span class="instr-evidence-val">${decisions.length} total — ${accepted} accepted · ${thinking} reconsidered · ${questioned} questioned</span>
            </div>
            <div class="instr-evidence-row" role="listitem">
                <span class="instr-evidence-key"><span class="show-es">Frases protegidas (Bóveda de voz)</span><span class="lang-sep"> · </span><span class="show-en">Voice Vault phrases</span></span>
                <span class="instr-evidence-val">${protected_.length ? protected_.length + ' phrase' + (protected_.length > 1 ? 's' : '') : 'None recorded'}</span>
            </div>
        </div>

        <div class="instr-divider"></div>

        <div class="instr-section-label">
            <span class="show-es">Confirmación de autoría</span><span class="lang-sep"> · </span><span class="show-en">Authorship Confirmation</span>
        </div>
        <ul class="instr-check-list" role="list">
            <li class="instr-check-item" role="listitem">
                <input type="checkbox" id="instrAuth1" aria-required="true">
                <label for="instrAuth1"><span class="show-es">Completé mi primer borrador antes de recibir retroalimentación con IA.</span><span class="lang-sep"> · </span><span class="show-en">I completed my first draft before using AI feedback.</span></label>
            </li>
            <li class="instr-check-item" role="listitem">
                <input type="checkbox" id="instrAuth2" aria-required="true">
                <label for="instrAuth2"><span class="show-es">El borrador, las revisiones y las decisiones finales son mi responsabilidad.</span><span class="lang-sep"> · </span><span class="show-en">The draft, revisions, and final decisions are my own responsibility.</span></label>
            </li>
            <li class="instr-check-item" role="listitem">
                <input type="checkbox" id="instrAuth3" aria-required="true">
                <label for="instrAuth3"><span class="show-es">Usé Tu Pana como herramienta de apoyo, no como reemplazo de mi propio criterio.</span><span class="lang-sep"> · </span><span class="show-en">I used Tu Pana as a writing support tool, not a replacement for my own judgment.</span></label>
            </li>
            <li class="instr-check-item" role="listitem">
                <input type="checkbox" id="instrAuth4" aria-required="true">
                <label for="instrAuth4"><span class="show-es">Revisé este reporte antes de entregarlo.</span><span class="lang-sep"> · </span><span class="show-en">I reviewed this report before submitting it.</span></label>
            </li>
        </ul>

        <div class="instr-divider"></div>

        <div class="instr-section-label">
            <span class="show-es">Vista previa del reporte</span><span class="lang-sep"> · </span><span class="show-en">Report Preview</span>
        </div>
        <div class="instr-preview-wrap">
            <div class="instr-preview-head">
                <span class="instr-preview-head-label"><span class="show-es">Texto completo para entregar</span><span class="lang-sep"> · </span><span class="show-en">Full text for submission</span></span>
                <span class="instr-copy-flash" id="instrCopyFlash">
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8l4 4 8-8"/></svg>
                    <span class="show-es">Copiado</span><span class="lang-sep"> · </span><span class="show-en">Copied</span>
                </span>
            </div>
            <pre class="instr-preview" id="instrReportPreview" aria-label="Report text preview · Vista previa del reporte" tabindex="0"></pre>
        </div>

        <div class="instr-action-row" role="group" aria-label="Report actions · Acciones del reporte">
            <button class="instr-primary-btn" onclick="copyInstructorReport()" aria-label="Copiar reporte para Brightspace · Copy report for Brightspace">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="9" height="10" rx="1.5"/><path d="M3 12V3a1 1 0 011-1h6"/></svg>
                <span class="show-es">Copiar para Brightspace</span><span class="lang-sep"> · </span><span class="show-en">Copy for Brightspace</span>
            </button>
            <button class="instr-secondary-btn" onclick="downloadInstructorReport()" aria-label="Descargar reporte como .txt · Download report as .txt">
                <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v8M5 8l3 3 3-3"/><path d="M3 13h10"/></svg>
                <span>Download .txt</span>
            </button>
            <button class="instr-secondary-btn" onclick="downloadInstructorReportMd()" aria-label="Descargar reporte como .md · Download as .md">
                <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v8M5 8l3 3 3-3"/><path d="M3 13h10"/></svg>
                <span>Download .md</span>
            </button>
        </div>

        <div class="instr-brightspace-note" role="note">
            <strong><span class="show-es">Instrucciones para Brightspace</span><span class="lang-sep"> · </span><span class="show-en">Brightspace Submission Instructions</span></strong><br>
            <span class="show-es">Copia o descarga este reporte y entrégalo en Brightspace junto con tu ensayo, según las instrucciones de tu profesor/a. Esta aplicación <em>no entrega automáticamente</em> a Brightspace.</span>
            <span class="lang-sep"> · </span>
            <span class="show-en">Copy or download this report and submit it in Brightspace with your assignment as instructed by your professor. This app does <em>not</em> submit directly to Brightspace.</span>
        </div>`;

    D.chatMessages.appendChild(panel);

    // Generate initial preview
    refreshInstrPreview();

    if (scrollTo) {
        setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }

    // Mark as generated in capstone data so it restores on reload
    const cd = loadCapstoneData();
    cd.instrReportGenerated = true;
    _saveCapstoneRaw(cd);
}

function refreshInstrPreview() {
    const pre = document.getElementById('instrReportPreview');
    if (!pre) return;
    pre.textContent = generateInstructorReport();
}

function copyInstructorReport() {
    const text = generateInstructorReport();
    navigator.clipboard.writeText(text).then(() => {
        const flash = document.getElementById('instrCopyFlash');
        if (flash) { flash.classList.add('show'); setTimeout(() => flash.classList.remove('show'), 2400); }
    }).catch(() => {
        window.prompt(
            t('Copia este texto · Copy this text:', 'Copy this text:'),
            text
        );
    });
}

function _downloadInstrAs(ext, mimeType) {
    const text = generateInstructorReport();
    const date = new Date().toISOString().slice(0,10);
    const blob = new Blob([text], { type: mimeType + ';charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `tupana-instructor-report-${date}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
function downloadInstructorReport()   { _downloadInstrAs('txt', 'text/plain'); }
function downloadInstructorReportMd() { _downloadInstrAs('md',  'text/markdown'); }

