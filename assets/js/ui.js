// Tu Pana de Escritura — ui.js
// All DOM state and rendering: state object, DOM cache (D), tone/lang toggles, journey map,
// draft panel, edit toolbar, chat messages, capstone, report, spotlight, and more.


// ════════════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════════════
const state = {
    stage:      1,
    done:       new Set(),
    draftSaved: false,
    connected:  false,
    waiting:    false,
    showAllJourney: false,
    tone:       'gentle',  // 'gentle' | 'direct'
    lang:       'es',      // 'es' | 'en' | 'both'
    coachMode:  localStorage.getItem('tupana_coach_mode') || 'gemini',   // 'offline' | 'ollama' | 'gemini'
    step:       1,
    welcomeShown:    false,
    spotlightTarget:        null,   // 'coach' | 'editor' | null
    spotlightStageId:       null,
    pendingSpotlightStageId: null,  // deferred when a phase toast is showing
    draftFocus:             false,
    _reflectStage:          0,      // set by milestone actions (selectRevisionFocus, selectPolishRoute)
    assignmentId:           null    // active CAP-200-style assignment layer id, or null = generic coach (set in app.js)
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
    fullDraftReviewBtn: el('fullDraftReviewBtn'),
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
    completionBg: el('completionBg'),
    mobileStageSelect: el('mobileStageSelect')
};

// Static overlays stay mounted in the DOM so their visual transitions remain
// smooth. Keep their accessibility state in sync with their visual state:
// opacity and pointer-events alone do not hide content from assistive tech.
const STATIC_OVERLAY_IDS = [
    'phaseToast',
    'maniBg',
    'labBg',
    'confirmBg',
    'modalBg',
    'stagePreviewBg',
    'reportBg',
    'pnModalBg',
    'completionBg',
    'capstoneBg'
];
const _overlayReturnFocus = new WeakMap();

function setOverlayOpen(target, open, options = {}) {
    const overlay = typeof target === 'string' ? document.getElementById(target) : target;
    if (!overlay) return;
    if (open) {
        if (options.rememberFocus !== false && document.activeElement instanceof HTMLElement) {
            _overlayReturnFocus.set(overlay, document.activeElement);
        }
        overlay.removeAttribute('inert');
        overlay.setAttribute('aria-hidden', 'false');
        overlay.classList.add('on');
        return;
    }
    overlay.classList.remove('on');
    overlay.setAttribute('inert', '');
    overlay.setAttribute('aria-hidden', 'true');
    if (options.restoreFocus) {
        const targetToRestore = _overlayReturnFocus.get(overlay);
        if (targetToRestore && document.contains(targetToRestore)) {
            setTimeout(() => targetToRestore.focus(), 40);
        }
    }
}

function initStaticOverlayAccessibility() {
    STATIC_OVERLAY_IDS.forEach(id => {
        const overlay = document.getElementById(id);
        if (overlay && !overlay.classList.contains('on')) setOverlayOpen(overlay, false);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStaticOverlayAccessibility);
} else {
    initStaticOverlayAccessibility();
}

// ════════════════════════════════════════════════════════
//  READ-ALOUD / ESCUCHAR — Patch 11
// ════════════════════════════════════════════════════════
const _ttsSupported = (typeof window !== 'undefined')
    && ('speechSynthesis' in window)
    && ('SpeechSynthesisUtterance' in window);
let _ttsActiveBtn = null;

// Patch 12: shared HTML5 Audio instance for onboarding narration (one at a time)
const _onboardingAudio = new Audio();
let _onboardingAudioBtn = null;

function _getEsLang() {
    const voices = window.speechSynthesis.getVoices();
    const esUS = voices.find(v => v.lang === 'es-US');
    return esUS ? 'es-US' : 'es-ES';
}

function speakStaticInstruction(text, lang, btn) {
    if (!_ttsSupported) return;
    window.speechSynthesis.cancel();
    if (_ttsActiveBtn && _ttsActiveBtn !== btn) _setTtsBtnIdle(_ttsActiveBtn);
    _ttsActiveBtn = btn;
    _setTtsBtnPlaying(btn);
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = (lang === 'en') ? 'en-US' : _getEsLang();
    utt.onend  = () => { if (_ttsActiveBtn === btn) { _setTtsBtnIdle(btn); _ttsActiveBtn = null; } };
    utt.onerror = () => { if (_ttsActiveBtn === btn) { _setTtsBtnIdle(btn); _ttsActiveBtn = null; } };
    window.speechSynthesis.speak(utt);
}

function stopStaticInstructionSpeech() {
    if (!_ttsSupported) return;
    window.speechSynthesis.cancel();
    if (_ttsActiveBtn) { _setTtsBtnIdle(_ttsActiveBtn); _ttsActiveBtn = null; }
}

function _setTtsBtnIdle(btn) {
    const isEs = state.lang !== 'en';
    btn.textContent = isEs ? '🔊 Escuchar' : '🔊 Listen';
    btn.setAttribute('aria-label', isEs ? 'Escuchar instrucciones' : 'Listen to instructions');
    btn.dataset.ttsPlaying = 'false';
}

function _setTtsBtnPlaying(btn) {
    const isEs = state.lang !== 'en';
    btn.textContent = isEs ? '⏹ Detener' : '⏹ Stop';
    btn.setAttribute('aria-label', isEs ? 'Detener lectura' : 'Stop reading');
    btn.dataset.ttsPlaying = 'true';
}

function _makeTtsBtn(textEs, textEn) {
    return null; // TTS permanently disabled — audio assets handle onboarding narration (see _makeAudioBtn)
}

function _makeAudioBtn(src) {
    if (!FEATURES.audioInstructions) return null;
    if (state.lang === 'en') return null;  // English audio files don't exist yet
    const btn = document.createElement('button');
    btn.className = 'tts-listen-btn';
    btn.type = 'button';
    btn.dataset.ttsPlaying = 'false';
    _setTtsBtnIdle(btn);
    btn.addEventListener('click', () => {
        if (_onboardingAudioBtn === btn && !_onboardingAudio.paused) {
            _stopOnboardingAudio();
        } else {
            _playOnboardingAudio(src, btn);
        }
    });
    return btn;
}

function _playOnboardingAudio(src, btn) {
    if (_onboardingAudioBtn && _onboardingAudioBtn !== btn) _setTtsBtnIdle(_onboardingAudioBtn);
    _onboardingAudioBtn = btn;
    _setTtsBtnPlaying(btn);
    _onboardingAudio.src = src;
    _onboardingAudio.onended = () => { if (_onboardingAudioBtn === btn) { _setTtsBtnIdle(btn); _onboardingAudioBtn = null; } };
    _onboardingAudio.onerror = () => { if (_onboardingAudioBtn === btn) { _setTtsBtnIdle(btn); _onboardingAudioBtn = null; } };
    _onboardingAudio.play().catch(() => { _setTtsBtnIdle(btn); _onboardingAudioBtn = null; });
}

function _stopOnboardingAudio() {
    _onboardingAudio.pause();
    if (_onboardingAudioBtn) { _setTtsBtnIdle(_onboardingAudioBtn); _onboardingAudioBtn = null; }
}

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
    tabDraft.tabIndex = toChat ? -1 : 0;
    tabChat.tabIndex = toChat ? 0 : -1;
    if (toChat) tabChat.classList.remove('has-notification');
    // Scroll to latest message after the panel becomes visible.
    // Uses inline scrollBehavior override (not scrollTo({behavior:'instant'})) because
    // behavior:'instant' is not consistently supported in Opera iOS WebKit builds.
    // CSS scroll-behavior:smooth is respected by scrollTop= on modern browsers, so we
    // must suppress it explicitly to guarantee an instant jump.
    // A 80ms setTimeout second pass handles Opera's longer layout-settle time after
    // display:none → display:flex (single rAF is not always sufficient).
    if (toChat && D.chatMessages) {
        const _scrollNow = () => {
            const m = D.chatMessages;
            if (!m) return;
            m.style.scrollBehavior = 'auto';
            m.scrollTop = m.scrollHeight;
            m.style.scrollBehavior = '';
        };
        requestAnimationFrame(() => {
            _scrollNow();
            setTimeout(_scrollNow, 80);
        });
    }
}

el('mobileTabs')?.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const showChat = event.key === 'ArrowRight' || event.key === 'End';
    switchMobileTab(showChat ? 'chat' : 'draft');
    el(showChat ? 'tabChat' : 'tabDraft')?.focus();
});

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
    const ms = document.getElementById('langSelectMobile');
    if (ms) ms.value = pref;
    // Update html lang attribute for AT
    document.documentElement.lang = pref === 'en' ? 'en' : 'es';
    // VP2 M5: the mobile stage <select> holds plain text (no show-es/show-en
    // spans), so rebuild its labels in the newly selected language mode.
    try { buildMobileNav(); } catch(e) {}
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
            <span class="orient-tag" aria-hidden="true"><span class="show-es">Apoyo</span><span class="lang-sep"> · </span><span class="show-en">Support</span></span>
            <span class="vault-toggle-arrow" aria-hidden="true">▾</span>
        </summary>
        <div class="voice-vault-body">
            <p class="voice-vault-hint">
                <span class="show-es">Selecciona un fragmento de tu borrador y haz clic en el botón de abajo para protegerlo. El punto verde confirma que la frase sigue en tu texto.</span>
                <span class="lang-sep"> · </span>
                <span class="show-en">Select a phrase from your draft above, then click the button below to protect it. A green dot confirms the phrase is still in your text.</span>
            </p>
            <button class="vault-protect-inline" id="vaultInlineProtectBtn"
                onclick="protectSelectedPhrase()" disabled
                aria-label="Proteger frase seleccionada · Protect selected phrase"
                title="Proteger frase seleccionada · Protect selected phrase">
                <svg viewBox="0 0 16 16" style="width:13px;height:13px;flex-shrink:0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 1.5L2.5 4v4.5C2.5 11.7 5 14.2 8 15c3-0.8 5.5-3.3 5.5-6.5V4L8 1.5z"/><path d="M5.5 8.5l2 2 3-3"/></svg>
                <span class="show-es">Proteger frase seleccionada</span><span class="lang-sep"> · </span><span class="show-en">Protect selected phrase</span>
            </button>
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
    const btn       = el('etbProtectBtn');
    const sep       = el('etbProtectSep');
    const inlineBtn = el('vaultInlineProtectBtn');
    const isS8      = state.stage === 8;
    if (!btn) return;
    const show = isS8;
    btn.style.display = show ? '' : 'none';
    if (sep) sep.style.display = show ? '' : 'none';
    if (show) {
        const hasSel = D.draftArea.selectionStart !== D.draftArea.selectionEnd;
        btn.disabled = !hasSel;
        if (inlineBtn) inlineBtn.disabled = !hasSel;
    } else {
        if (inlineBtn) inlineBtn.disabled = true;
    }
}

// Occasional light humor — one per category, used sparingly
// H6 (Stage A.2 polish): coach humor/warmth, language-aware. These lines surface inside
// bilingual messages (es line / en line, CSS show-es/show-en gated), so each key carries
// parallel es[] and en[] arrays of equal length. Spanish keeps its café warmth in Spanish
// (not English with Spanish labels). pickHumorPair() picks one aligned es/en pair.
const HUMOR = {
    welcome_multi: {
        es: [
            'El café sigue caliente. Sigamos.',
            'Tu borrador te esperó con paciencia. El café, no tanto.',
            'Qué bueno tenerte de vuelta. La pantalla se estaba sintiendo sola.'
        ],
        en: [
            'The coffee is still warm. Let\'s keep going.',
            'Your draft waited patiently. That is more than can be said for the coffee.',
            'Good to have you back. The screen was getting lonely.'
        ]
    },
    overwhelmed: {
        es: [
            'Esta parte le pide a tu cerebro que se estire un poco. Primero el café, luego conectamos las ideas.',
            'Revisar no es un castigo. Es tu borrador pidiéndote un poco más de cuidado.'
        ],
        en: [
            'This part asks your brain to stretch a little. Café first, then we connect the dots.',
            'Revision is not punishment. It is just your draft asking for a little more care.'
        ]
    },
    draft_saved: {
        es: [
            'El borrador no está desordenado porque fallaste. Está desordenado porque hubo pensamiento.',
            'No necesitas sonar como un libro de texto con saco y corbata. Conserva tu voz.'
        ],
        en: [
            'The draft is not messy because you failed. It is messy because thinking happened.',
            'No need to sound like a textbook wearing a blazer. Keep your voice.'
        ]
    }
};

// ════════════════════════════════════════════════════════
//  CAPSTONE SELF-ASSESSMENT — Mi cierre de proceso
// ════════════════════════════════════════════════════════

const CAPSTONE_CRITERIA = [
    { key: 'opening',    es: 'Apertura / Punto de entrada',       en: 'Opening / Point of Entry',       text: 'My opening gives the reader a clear situation, purpose, question, or point of entry.' },
    { key: 'connection', es: 'Conexión',                           en: 'Connection',                     text: 'I connect my experience or example to a larger issue, question, or context.' },
    { key: 'evidence',   es: 'Evidencia / Especificidad',          en: 'Evidence / Specificity',         text: 'I use details, examples, observations, or sources to support my ideas.' },
    { key: 'voice',      es: 'Voz',                                en: 'Voice',                          text: 'The writing still sounds like me.' },
    { key: 'revision',   es: 'Revisión',                           en: 'Revision',                       text: 'I made and can explain at least one revision beyond spacing or formatting.' },
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
    updateCapstoneEvidenceState();
}

function _capstoneEvidenceReady(reflections) {
    const r = reflections || {};
    return ['improved', 'needs', 'voice'].every(key => String(r[key] || '').trim().length >= 8);
}

function updateCapstoneEvidenceState() {
    const ready = _capstoneEvidenceReady((loadCapstoneData().reflections || {}));
    document.querySelectorAll('.capstone-rating-btn').forEach(btn => {
        btn.disabled = !ready;
    });
    const status = document.getElementById('capstoneEvidenceStatus');
    if (status) {
        status.classList.toggle('ready', ready);
        status.textContent = ready
            ? '✓ Evidencia lista. Ahora puedes hacer la autoevaluación opcional. · Evidence ready. You may now use the optional self-check.'
            : 'Escribe una oración breve en cada espacio para abrir la autoevaluación. · Write one short sentence in each space to open the self-check.';
    }
    return ready;
}

function submitCapstone() {
    if (!updateCapstoneEvidenceState()) {
        const fields = [
            document.getElementById('capstoneR1'),
            document.getElementById('capstoneR2'),
            document.getElementById('capstoneR3')
        ];
        const missing = fields.find(field => !field || field.value.trim().length < 8);
        if (missing) {
            missing.setAttribute('aria-invalid', 'true');
            missing.focus();
        }
        const error = document.getElementById('capstoneEvidenceError');
        if (error) error.hidden = false;
        return;
    }
    document.querySelectorAll('.capstone-reflection-text').forEach(field => field.removeAttribute('aria-invalid'));
    const evidenceError = document.getElementById('capstoneEvidenceError');
    if (evidenceError) evidenceError.hidden = true;
    const done       = document.getElementById('capstoneDoneMsg');
    const btn        = document.getElementById('capstoneSubmitBtn');
    const compareBtn = document.getElementById('capstoneCompareBtn');
    const disclosure = document.querySelector('.capstone-ai-disclosure');
    if (done) done.classList.add('on');
    if (btn)  btn.style.display = 'none';
    if (compareBtn) compareBtn.style.display = 'inline-flex';
    if (disclosure) disclosure.style.display = 'block';
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
                <span class="show-es">Revisa y entrega este reporte con tu trabajo escrito.</span>
                <span class="lang-sep"> · </span>
                <span class="show-en">Review and submit this report with your written work.</span>
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

    text += `---\n## 10A — My Evidence and Self-Assessment / Mi evidencia y autoevaluación\n\n`;
    text += `**One thing I improved / Una cosa que mejoré:**\n${reflections.improved || '—'}\n\n`;
    text += `**One thing that still needs work / Una cosa que todavía necesita trabajo:**\n${reflections.needs || '—'}\n\n`;
    text += `**One decision I made to protect my voice / Una decisión que tomé para proteger mi voz:**\n${reflections.voice || '—'}\n\n`;
    text += `### Optional Self-Check / Autoevaluación opcional\n\n`;
    CAPSTONE_CRITERIA.forEach(c => {
        text += `**${c.en} / ${c.es}**\n"${c.text}"\n`;
        text += `My rating: ${ratingLabel(ratings[c.key])}\n\n`;
    });

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

    if (resp.agree || resp.disagree || resp.missing || resp.aiAdvice) {
        text += `---\n## 10C — My Response to the Coach / Mi respuesta al coach\n\n`;
        text += `**Where I agree / Donde estoy de acuerdo:**\n${resp.agree || '—'}\n\n`;
        text += `**Where I disagree / Donde no estoy de acuerdo:**\n${resp.disagree || '—'}\n\n`;
        text += `**What the coach might be missing / Lo que el coach podría estar pasando por alto:**\n${resp.missing || '—'}\n\n`;
        if (resp.aiAdvice) {
            text += `**AI advice I accepted, questioned, or rejected / Consejo de IA que acepté, cuestioné o rechacé:**\n${resp.aiAdvice}\n\n`;
        }
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

function openCapstoneModal() {
    const bg = el('capstoneBg');
    if (!bg) return;
    _capstoneReturnFocus = document.activeElement;
    setOverlayOpen(bg, true, { rememberFocus: false });
    setTimeout(() => bg.querySelector('.capstone-modal-close')?.focus(), 80);
}

// P4 follow-up (Option A, founder decision 2026-06-12): the Stage 10 completion
// sequence (process note → celebration → Journey Complete card) arms on first
// successful instructor report generation and fires here — the first moment the
// student leaves the capstone modal with the report artifact in hand. Firing on
// close rather than on generation is deliberate: the capstone modal (z 350)
// would cover the process-note modal (z 200), and the student is mid copy/
// download. Once per page load (in-memory guard, no new storage key); re-arms
// on reload until the process note is completed (tupana_completion_shown).
let _completionPromptFired = false;
let _capstoneReturnFocus = null;
function closeCapstoneModal(options = {}) {
    setOverlayOpen('capstoneBg', false);
    const returnTarget = _capstoneReturnFocus && document.contains(_capstoneReturnFocus)
        ? _capstoneReturnFocus
        : document.querySelector('.capstone-reopen-btn');
    if (returnTarget) setTimeout(() => returnTarget.focus(), 40);
    if (_completionPromptFired || options.suppressCompletion) return;
    try {
        const done = localStorage.getItem('tupana_completion_shown') === 'true';
        if (!done && loadCapstoneData().instrReportGenerated) {
            _completionPromptFired = true;
            setTimeout(() => openProcessNoteModal(), 450);
        }
    } catch(e) {}
}

function injectCapstonePanel() {
    if (document.querySelector('.capstone-panel')) return;

    const data             = loadCapstoneData();
    const savedRatings     = data.ratings     || {};
    const savedReflections = data.reflections || {};
    const evidenceReady    = _capstoneEvidenceReady(savedReflections);
    const selfDone         = !!data.completed && evidenceReady;
    const coachGenerated   = !!(data.coachPerspective);

    const criteriaHTML = CAPSTONE_CRITERIA.map(c => {
        const btns = CAPSTONE_RATINGS.map(r => {
            const sel = savedRatings[c.key] === r.val;
            return `<button class="capstone-rating-btn${sel ? ' selected' : ''}"
                aria-pressed="${sel}"
                ${evidenceReady ? '' : 'disabled'}
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
        <div class="capstone-panel-subtitle" lang="en">My Writing Snapshot — Step 5 of 5 · Reflect &amp; Submit</div>

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
            <p style="margin:10px 0 0;font-size:0.77rem;color:var(--text-muted);line-height:1.4;">
                <span class="show-es">Completa esta reflexión y luego genera tu reporte.</span>
                <span class="lang-sep"> · </span>
                <span class="show-en">Complete this reflection, then generate your report.</span>
            </p>
        </div>

        <div class="capstone-section-label">
            Empieza con evidencia · Start with evidence
            <span class="capstone-required-note"> — una oración en cada espacio · one sentence in each space</span>
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

        <div class="capstone-evidence-status${evidenceReady ? ' ready' : ''}" id="capstoneEvidenceStatus" role="status">
            ${evidenceReady
                ? '✓ Evidencia lista. Ahora puedes hacer la autoevaluación opcional. · Evidence ready. You may now use the optional self-check.'
                : 'Escribe una oración breve en cada espacio para abrir la autoevaluación. · Write one short sentence in each space to open the self-check.'}
        </div>
        <div class="capstone-evidence-error" id="capstoneEvidenceError" role="alert" hidden>
            Completa los tres espacios con una oración breve antes de continuar. · Complete all three spaces with one short sentence before continuing.
        </div>

        <hr class="capstone-divider">
        <div class="capstone-section-label">
            Autoevaluación opcional · Optional Self-Check
        </div>
        <p class="capstone-reflection-hint">Primero nombraste la evidencia de tu proceso. Ahora, si te ayuda, puedes valorar cada dimensión. · You named evidence from your process first. Now, if useful, you may rate each dimension.</p>
        ${criteriaHTML}

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
        <div class="capstone-ai-disclosure" role="note" style="display:${compareVisible ? 'block' : 'none'}">
            <span class="show-es">Si eliges comparar, tu borrador más reciente (hasta 18,000 caracteres) y tu autoevaluación de la Etapa 10 (estas tres reflexiones y cualquier valoración opcional) se enviarán al Coach IA para generar la perspectiva. Tu Pana no guarda ese contenido en un servidor.</span>
            <span class="lang-sep"> · </span>
            <span class="show-en">If you choose Compare, your latest draft (up to 18,000 characters) and your Stage 10 self-assessment (these three reflections and any optional ratings) will be sent to the Live AI coach to generate its perspective. Tu Pana does not store that content on a server.</span>
        </div>

        <div class="capstone-done-msg${selfDone ? ' on' : ''}" id="capstoneDoneMsg" role="status">
            <div class="capstone-done-title">Autoevaluación completa. / Self-assessment complete.</div>
            <span lang="es">Nombraste tu propio proceso. Ahora puedes comparar tu lectura con una perspectiva limitada del coach — o exportar directamente.</span>
            <br><span lang="en" style="color:var(--text-muted)">You named your own process. You can now compare your reading with a limited coach perspective — or export directly.</span>
        </div>
    `;

    el('capstoneModalBody').appendChild(panel);
    openCapstoneModal();

    if (!document.getElementById('capstoneChatTrigger')) {
        const trigger = document.createElement('div');
        trigger.id = 'capstoneChatTrigger';
        trigger.className = 'capstone-chat-trigger';
        trigger.innerHTML =
            `<span class="capstone-chat-trigger-label"><span class="show-es" lang="es">Tu reflexión de cierre está lista</span><span class="lang-sep"> · </span><span class="show-en" lang="en">Your writing snapshot is ready</span></span>` +
            `<button class="capstone-reopen-btn" onclick="openCapstoneModal()" aria-label="Abrir mi cierre de proceso · Open my writing snapshot"><span class="show-es" lang="es">Mi cierre de proceso</span><span class="lang-sep"> · </span><span class="show-en" lang="en">Writing Snapshot</span> →</button>`;
        D.chatMessages.appendChild(trigger);
        D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
    }

    // P4: returning students who already finished 10C see the persistent
    // Journey Complete card with submission steps (no-op until the flag is set).
    injectJourneyCompleteCard();
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
    const stepOverride = (typeof getStageStepOverride === 'function')
        ? getStageStepOverride(state.stage, step - 1, state.assignmentId) : null;
    const stepData = stepOverride || steps[step - 1] || steps[0];

    const sL = stLabel(state.stage);
    const ctbStage = document.getElementById('ctbStage');
    if (ctbStage) ctbStage.innerHTML =
        `<span class="show-es">Enfoque · ${escapeHtml(sL.es)}</span>` +
        `<span class="lang-sep"> / </span>` +
        `<span class="show-en">Focus · ${escapeHtml(sL.en)}</span>`;

    // The student-facing strip follows the same three-phase model as the calm
    // progress bar. The detailed ten-stage engine remains unchanged.
    const phase = phaseForStage(state.stage);
    const ctbBar = document.getElementById('currentTaskBar');
    if (ctbBar) ctbBar.style.setProperty('--ctb-progress', `${phase * (100 / 3)}%`);
    updateCalmProgress();

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
        // De-overwhelm B4: tiny "1/3" count from the SAME step/total the dots use —
        // display-only orientation (no new state, no gating, no grading language).
        if (total > 1) {
            const count = document.createElement('span');
            count.className = 'ctb-dot-count';
            count.textContent = `${Math.min(step, total)}/${total}`;
            ctbDots.appendChild(count);
        }
    }
}

function phaseForStage(stageId) {
    if (stageId <= 6) return 1;
    if (stageId <= 9) return 2;
    return 3;
}

function updateCalmProgress() {
    const phase = phaseForStage(state.stage);
    document.querySelectorAll('.calm-phase').forEach(item => {
        const itemPhase = Number(item.dataset.phase);
        item.classList.toggle('active', itemPhase === phase);
        item.classList.toggle('done', itemPhase < phase);
        if (itemPhase === phase) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
    });
    const progress = document.getElementById('calmProgress');
    if (progress) progress.style.setProperty('--calm-progress', `${(phase - 1) * 50}%`);
}

function toggleDetailedPath() {
    const isOpen = document.body.classList.toggle('path-details-open');
    const btn = document.getElementById('calmPathToggle');
    const label = document.getElementById('calmPathToggleText');
    if (btn) {
        btn.setAttribute('aria-expanded', String(isOpen));
        btn.setAttribute(
            'aria-label',
            isOpen
                ? 'Ocultar la ruta detallada · Hide detailed path'
                : 'Mostrar la ruta detallada · Show detailed path'
        );
    }
    if (label) {
        label.innerHTML = isOpen
            ? '<span class="show-es">Ocultar ruta</span><span class="lang-sep"> · </span><span class="show-en">Hide path</span>'
            : '<span class="show-es">Ver ruta</span><span class="lang-sep"> · </span><span class="show-en">View path</span>';
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
    const reflections = data.reflections || {};
    const draft       = getFinalEssay().text.trim();
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

STUDENT PROCESS EVIDENCE:
- One thing improved: ${reflections.improved || 'Not provided'}
- One thing that still needs work: ${reflections.needs || 'Not provided'}
- One decision made to protect voice: ${reflections.voice || 'Not provided'}

STUDENT'S LATEST COMPLETE DRAFT:
${draft.slice(0, 18000)}

Required JSON format (fill in all 8 dimensions; use only these rating values: "Still developing", "Taking shape", "Strong", "Very strong"; keep each observation and suggestion to one concise sentence):
{"coachPerspective":[{"dimension":"Opening / Point of Entry","rating":"...","observation":"...","suggestion":"..."},{"dimension":"Connection","rating":"...","observation":"...","suggestion":"..."},{"dimension":"Evidence / Specificity","rating":"...","observation":"...","suggestion":"..."},{"dimension":"Voice","rating":"...","observation":"...","suggestion":"..."},{"dimension":"Revision","rating":"...","observation":"...","suggestion":"..."},{"dimension":"AI Judgment","rating":"...","observation":"...","suggestion":"..."},{"dimension":"Conocimiento / Cultural Knowledge","rating":"...","observation":"...","suggestion":"..."},{"dimension":"Next Step","rating":"...","observation":"...","suggestion":"..."}],"limitations":"I cannot fully judge the cultural, community, or lived meaning of your examples. You and your professor are better positioned to decide whether those examples represent your experience accurately and respectfully."}`;

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

    // Gemini via Cloudflare Worker proxy
    if (state.coachMode === 'gemini') {
        state.waiting = true;
        showTyping(true);
        try {
            const _gLang = getCurrentCoachLanguageLabel();
            const { maniSentence: _unusedManiSentence, ..._gCtx } = buildChannelData();
            const geminiPrompt =
                buildOllamaSystemPrompt(_gLang) +
                '\n\n---\n\n' +
                'Current interface language: ' + _gLang +
                '\n\nCurrent Tu Pana context:\n' + JSON.stringify(_gCtx, null, 2) +
                '\n\n' + prompt;
            maybeShowFirstAiSendCue();
            const reply = await generateCoachResponse({
                prompt: geminiPrompt,
                stageId: getStageId(state.stage),
                requestKind: 'capstone_review'
            });
            handleCoachPerspectiveResponse(reply || '');
        } catch(err) {
            console.error('coachPerspective:gemini', err);
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
    const disclosure = document.querySelector('.capstone-ai-disclosure');
    if (disclosure) disclosure.style.display = 'none';

    el('capstoneModalBody').appendChild(panel);
    openCapstoneModal();

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
    el('capstoneModalBody').appendChild(panel);
    openCapstoneModal();
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
    el('capstoneModalBody').appendChild(panel);
    openCapstoneModal();
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

        <hr class="capstone-divider">
        <div class="capstone-section-label">
            Reflexión crítica de IA · Critical AI Reflection
            <span style="font-weight:400;text-transform:none;font-size:0.71rem"> — opcional · optional</span>
        </div>

        <div class="capstone-reflection-field">
            <label class="capstone-reflection-label" for="capstone10cAiAdvice">
                Piensa en un momento en que aceptaste, cuestionaste, cambiaste o rechazaste el consejo del coach. / Think about one moment when you accepted, questioned, changed, or rejected the coach's advice.
            </label>
            <div class="capstone-reflection-hint">
                <span lang="es">Un consejo que acepté fue… · Un consejo que cuestioné fue… · Una razón de mi decisión fue…</span>
                <br><span lang="en" style="color:var(--text-muted)">One piece of advice I accepted was… / One piece of advice I questioned was… / One reason for my decision was…</span>
            </div>
            <textarea class="capstone-reflection-text" id="capstone10cAiAdvice" rows="3"
                aria-label="Reflexión crítica de IA · Critical AI reflection"
                oninput="saveCapstoneStudentResponse('aiAdvice',this.value)"
            >${escapeHtml(savedResp.aiAdvice || '')}</textarea>
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

    el('capstoneModalBody').appendChild(panel);
    openCapstoneModal();
    const mb = el('capstoneModalBody');
    setTimeout(() => { mb.scrollTop = mb.scrollHeight; }, 50);
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

    // Save Stage 10 AI reflection as a checkpoint entry (once per session)
    try {
        const log = JSON.parse(localStorage.getItem('tupana_decisions') || '[]');
        const alreadySaved = log.some(d => d.checkpoint === true && d.stage === 10);
        if (!alreadySaved) {
            const aiAdvice = (data.studentResponse && data.studentResponse.aiAdvice) || '';
            log.push({
                q: 'AI Use Reflection (Stage 10)',
                choice: aiAdvice || 'completed',
                t: new Date().toISOString(),
                checkpoint: true,
                stage: 10,
                skill: 'AI advice evaluation / reflective decision-making',
                written: true
            });
            localStorage.setItem('tupana_decisions', JSON.stringify(log.slice(-50)));
        }
    } catch(e) {}
    logProcessEvent('capstone_ai_reflection_completed', 'Stage 10 AI use reflection submitted.');
    renderBadges();
    renderDecisionLog();
}

// Single humor line in one language ('en' → English, anything else → Spanish-primary).
function pickHumor(key, lang) {
    const grp = HUMOR[key];
    if (!grp) return '';
    const arr = grp[lang === 'en' ? 'en' : 'es'] || [];
    if (arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
}
// One aligned es/en humor pair (same index) for bilingual show-es/show-en rendering.
function pickHumorPair(key) {
    const grp = HUMOR[key];
    if (!grp || !grp.es || grp.es.length === 0) return { es: '', en: '' };
    const i = Math.floor(Math.random() * grp.es.length);
    return { es: grp.es[i] || '', en: (grp.en && grp.en[i]) || '' };
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

// ════════════════════════════════════════════════════════
//  STUDENT-FACING MILESTONES  (Batch 1 — milestone simplification)
//  A presentation layer over the internal 10 stages. The 10-stage
//  state machine, logs, reports, and authorship gate are UNCHANGED —
//  this only reframes what the student SEES so the journey reads as
//  5 milestones, not a 10-step compliance sequence. Stage 6 (the
//  unassisted first-draft authorship gate) is its own milestone (M3).
//  Map flow-aligned per founder decision 2026-06-29.
// ════════════════════════════════════════════════════════
const MILESTONES = [
    { n: 1, es: 'Encuentra tu historia',      en: 'Find Your Story',        ids: [1, 2, 3] },
    { n: 2, es: 'Investiga y planifica',      en: 'Research & Plan',        ids: [4, 5] },
    { n: 3, es: 'Escribe tu primer borrador', en: 'Write Your First Draft', ids: [6] },
    { n: 4, es: 'Pule tu ensayo',             en: 'Refine Your Essay',      ids: [7, 8, 9] },
    { n: 5, es: 'Reflexiona y entrega',       en: 'Reflect & Submit',       ids: [10] }
];
const TOTAL_MILESTONES = MILESTONES.length;
// Internal stage id (1–10) → its student-facing milestone object.
function milestoneForStage(stageId) {
    return MILESTONES.find(m => m.ids.includes(stageId)) || MILESTONES[0];
}
// How many milestones are fully complete (all their stages in state.done).
function milestonesCompletedCount() {
    return MILESTONES.filter(m => m.ids.every(id => state.done.has(id))).length;
}

// ── Stage B.1: profile-aware label helpers ──
// Return the active profile's label override when one exists, else the default
// MILESTONES / STAGES label. Keeps CAP-200 (or any future profile) copy in the
// profile layer; the default essay flow is untouched. See genre-template.js.
function msLabel(ms) {
    const o = (typeof getMilestoneLabelOverride === 'function')
        ? getMilestoneLabelOverride(ms.n, state.assignmentId) : null;
    return o ? { es: o.es, en: o.en } : { es: ms.es, en: ms.en };
}
function stLabel(stageId) {
    const s = STAGES.find(x => x.id === stageId) || STAGES[stageId - 1] || STAGES[0];
    const o = (typeof getStageLabelOverride === 'function')
        ? getStageLabelOverride(stageId, state.assignmentId) : null;
    return o ? { es: o.es, en: o.en } : { es: s.es, en: s.en };
}
// Stage B.1 add-on: set the draft-area placeholder from the active profile's
// override, else restore the original (cached from the DOM). Default flow keeps
// its personal-essay placeholder; CAP 200 cues the service-learning project.
let _defaultDraftPlaceholder = null;
function applyDraftPlaceholder() {
    if (!D.draftArea) return;
    if (_defaultDraftPlaceholder === null) _defaultDraftPlaceholder = D.draftArea.getAttribute('placeholder') || '';
    const o = (typeof getDraftPlaceholderOverride === 'function') ? getDraftPlaceholderOverride(state.assignmentId) : null;
    D.draftArea.setAttribute('placeholder', o || _defaultDraftPlaceholder);
}

// Read-only pathway chip (IA Sprint Batch 1): shows which pathway is active —
// default essay, CAP 200, or Research Paper. INFORMATIONAL ONLY: no click handler,
// no assignment mutation, no persistence. Same-text labels (CAP 200) render once,
// bilingual labels use the standard show-es/show-en language-toggle spans.
function renderPathwayChip() {
    const chip = document.getElementById('pathwayChip');
    if (!chip) return;
    const l = (typeof getPathwayLabel === 'function' && getPathwayLabel(state.assignmentId))
        || { es: 'Ensayo', en: 'Essay' };
    chip.innerHTML = (l.es === l.en)
        ? escapeHtml(l.es)
        : `<span class="show-es">${escapeHtml(l.es)}</span><span class="lang-sep"> · </span><span class="show-en">${escapeHtml(l.en)}</span>`;
}
// Mobile-safe chat placeholder (Visual Polish Q6): the desktop placeholder text
// truncates awkwardly at phone widths. Display-only swap at boot — no chat
// behavior, no send path, no storage change.
function applyMobileChatPlaceholder() {
    if (!D.chatInput) return;
    if (window.matchMedia('(max-width: 480px)').matches) {
        D.chatInput.setAttribute('placeholder', 'Escribe aquí · Type here');
    }
}
// state.assignmentId is resolved in app.js, which loads after ui.js — defer the
// first render to DOMContentLoaded (fires after all classic end-of-body scripts).
function _initHeaderChipAndPlaceholder() { renderPathwayChip(); applyMobileChatPlaceholder(); }
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initHeaderChipAndPlaceholder);
} else {
    _initHeaderChipAndPlaceholder();
}

function buildMap() {
    D.journeyTrack.innerHTML = '';
    let dimmedCount = 0;

    MILESTONES.forEach((ms) => {
        const group = document.createElement('div');
        group.className = 'phase-group milestone-group';
        // Milestone-level state for header emphasis
        if (ms.ids.every(id => state.done.has(id)))  group.classList.add('ms-done');
        if (ms.ids.includes(state.stage))            group.classList.add('ms-active');

        const labelRow = document.createElement('div');
        labelRow.className = 'phase-label-row';
        const mL = msLabel(ms);
        labelRow.innerHTML =
            `<span class="phase-label show-es" lang="es">${ms.n}. ${escapeHtml(mL.es)}</span>` +
            `<span class="phase-label show-en" lang="en">${ms.n}. ${escapeHtml(mL.en)}</span>`;
        group.appendChild(labelRow);

        const nodesRow = document.createElement('div');
        nodesRow.className = 'phase-nodes';

        ms.ids.forEach(id => {
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
                // Milestone model: no raw stage numbers — an empty outlined
                // circle reads as "upcoming" without the 10-step feel. The
                // stage name below + hover tooltip still identify each step.
                circle.classList.add('stage-circle--upcoming');
            }

            const stageLabel = document.createElement('div');
            stageLabel.className = 'stage-label';
            const sL = stLabel(s.id);
            stageLabel.innerHTML = `<span class="label-es" lang="es">${escapeHtml(sL.es).replace('\n','<br>')}</span><span class="label-en" lang="en">${escapeHtml(sL.en)}</span>`;

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

    buildMobileNav();
}

function buildMobileNav() {
    const sel = D.mobileStageSelect;
    if (!sel) return;
    sel.innerHTML = '';
    // Language-mode-aware label (VP2 M5): a native <select> cannot use the
    // show-es/show-en span toggles, so build the text per state.lang — Spanish
    // first in bilingual mode, matching the app-wide ES · EN convention.
    // msLabel/stLabel keep it pathway-aware (Default / CAP 200 / Research).
    const biLabel = (es, en) => {
        const e = es.replace(/\n/g, ' '), n = en.replace(/\n/g, ' ');
        if (state.lang === 'es') return e;
        if (state.lang === 'en') return n;
        return `${e} · ${n}`;
    };
    // Group stages under their student-facing milestone so the dropdown
    // reads as 5 milestones, not a flat list of 10 stages.
    MILESTONES.forEach(ms => {
        const og = document.createElement('optgroup');
        const mL = msLabel(ms);
        og.label = `${ms.n}. ${biLabel(mL.es, mL.en)}`;
        ms.ids.forEach(id => {
            const s = STAGES.find(st => st.id === id);
            if (!s) return;
            const sL = stLabel(s.id);
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = biLabel(sL.es, sL.en);
            if (s.id === state.stage) opt.selected = true;
            og.appendChild(opt);
        });
        sel.appendChild(og);
    });
}

if (D.mobileStageSelect) {
    D.mobileStageSelect.addEventListener('change', () => {
        const id = parseInt(D.mobileStageSelect.value, 10);
        const s = STAGES.find(st => st.id === id);
        if (s) onStageClick(s);
        D.mobileStageSelect.value = state.stage;
    });
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
    const _cpToggleBtn = document.getElementById('chatProgressToggle');
    if (_cpToggleBtn) _cpToggleBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
    try {
        localStorage.setItem('tupana_progress_collapsed', isCollapsed ? 'true' : 'false');
    } catch(e) {}
}

function initChatProgress() {
    try {
        // Default is collapsed (set in HTML). Only expand if student explicitly opened it before.
        if (localStorage.getItem('tupana_progress_collapsed') === 'false' && D.chatProgress) {
            D.chatProgress.classList.remove('collapsed');
            if (D.chatProgressToggleText) D.chatProgressToggleText.textContent = 'Ocultar progreso · Hide progress';
            const _cpBtn = document.getElementById('chatProgressToggle');
            if (_cpBtn) _cpBtn.setAttribute('aria-expanded', 'true');
        }
    } catch(e) {}
}

function dismissDraftWarning() {
    const warning = document.getElementById('draftWarning');
    if (warning) warning.style.display = 'none';
    try { sessionStorage.setItem('tupana_warn_dismissed', '1'); } catch(e) {}
}

// Phase-completion notes (system log). Milestone NAMES resolve through msLabel at
// display time (Localization QA sprint), so CAP 200 / Research Paper students see
// their own pathway's milestone vocabulary instead of the default essay names.
function phaseCompletionNote(id) {
    const done = milestoneForStage(id - 1), next = milestoneForStage(id);
    const dL = msLabel(done), nL = msLabel(next);
    const NOTES = {
        4:  { es: `Paso ${done.n} completo — ${dL.es}. Ahora empieza el Paso ${next.n} (${nL.es}): la investigación y el esquema sirven tu historia, no la reemplazan.`, en: `Step ${done.n} complete — ${dL.en}. Step ${next.n} (${nL.en}) begins: research and outlining serve your story; they do not replace it.` },
        7:  { es: `Paso ${done.n} completo — ${dL.es}. Lo escribiste sin ayuda, y ese borrador es tuyo como ninguna otra cosa. Ahora empieza el Paso ${next.n} (${nL.es}): la revisión con las Cinco Preguntas — tú decides qué se queda.`, en: `Step ${done.n} complete — ${dL.en}. You wrote it without help, and that draft is yours like nothing else. Step ${next.n} (${nL.en}) begins: revision with the Five Questions — you decide what stays.` },
        10: { es: `Paso ${done.n} completo — ${dL.es}. Revisaste con criterio y protegiste tu voz. Queda el Paso ${next.n} (${nL.es}): nombra qué cambió, qué protegiste y qué todavía necesita atención. Esto no es una nota — tu criterio importa.`, en: `Step ${done.n} complete — ${dL.en}. You revised with judgment and protected your voice. Step ${next.n} (${nL.en}) remains: name what changed, what you protected, and what still needs attention. This is not a grade — your judgment matters.` }
    };
    return NOTES[id] || null;
}

// Track pending stage advance from preview modal
let pendingStageId = null;

function showStagePreview(targetId) {
    // Dismiss any open phase celebration toast when student clicks Continue
    dismissPhaseToast();
    // Authorship gate check
    if (targetId >= 7 && !state.draftSaved) {
        addSys(t(
            `⭐ Para seguir, primero necesitas guardar tu primer borrador sin ayuda en el panel izquierdo. Ese borrador es el corazón de todo lo que viene después. / To continue, first save your unassisted first draft in the left panel. That draft is the foundation of everything that follows.`,
            `⭐ This step requires a saved first draft. Write and save your draft in the left panel first.`
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
    const pL = stLabel(s.id);
    const pStep = (typeof getStageStepOverride === 'function') ? getStageStepOverride(s.id, 0, state.assignmentId) : null;
    D.previewStageNum.textContent = s.id;
    D.previewTitle.innerHTML = `<span class="show-es">${escapeHtml(pL.es.replace('\n', ' '))}</span><span class="lang-sep"> / </span><span class="show-en">${escapeHtml(pL.en)}</span>`;
    D.previewDesc.textContent = pStep ? (pStep.es + ' / ' + pStep.en) : s.desc;

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
    setOverlayOpen(D.stagePreviewBg, true);
    setTimeout(() => D.previewContinueBtn.focus(), 100);
}

function confirmStagePreview() {
    if (!pendingStageId) return;
    setOverlayOpen(D.stagePreviewBg, false);
    const id = pendingStageId;
    pendingStageId = null;

    // Capture previous stage text BEFORE goToStage (which saves and reloads the textarea)
    const prevStage = state.stage;
    const prevText  = (D.draftArea ? D.draftArea.value : '').trim();

    if (goToStage(id) === false) return;
    scheduleCoachSpotlight(id);
    // Mobile: bring student to coach tab so new stage instructions / cards are visible
    if (window.innerWidth <= 480) switchMobileTab('chat');

    // Queue import offer (Patch 26). Fires AFTER coach spotlight so the guidance
    // order is: stage instructions → import choice → drafting space.
    _pendingImport = null;
    _importCompletionAction = null;
    if (prevText.length >= 30) {
        const nextText = (D.draftArea ? D.draftArea.value : '').trim();
        _pendingImport = { prevText, nextStage: id, nextText };
        // If the coach spotlight won't show (already seen), fire import directly.
        if (!shouldShowSpotlight(id)) {
            setTimeout(_showPendingImport, 600);
        }
    }
}

function dismissStagePreview() {
    setOverlayOpen(D.stagePreviewBg, false, { restoreFocus: true });
    pendingStageId = null;
}

function injectStageEntryWelcome(id) {
    // Stage B.1: use the active profile's coach stage-entry override when present
    // (CAP 200), else the default STAGE_ENTRY_MESSAGES. Default flow unchanged.
    const override = (typeof getStageEntryOverride === 'function')
        ? getStageEntryOverride(id, state.assignmentId) : null;
    const msg = override || STAGE_ENTRY_MESSAGES[id];
    if (!msg) return;
    try {
        const log = JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || '[]');
        if (log.some(e => e.msgType === 'stage-intro' && e.stage === id)) return;
    } catch(e) {}
    addMsg(msg, 'bot', false, 'stage-intro');
}

function goToStage(id, options = {}) {
    if (id === 10 && !options.skipRevisionGate && !hasCompletionRevisionEvidence()) {
        openRevisionCompletionGate(() => goToStage(10, { skipRevisionGate: true }));
        return false;
    }
    exitDraftFocus();   // stage transition — coach takes visual priority
    const prev = state.stage;

    // Persist current stage's textarea content before switching
    saveStageWork(prev, D.draftArea.value);
    _autosaveSettle(); // transition save above just persisted the outgoing stage

    if (id > 1) state.done.add(id - 1);
    state.stage = id;
    state._reflectStage = 0; // Stage A.2 / B1: clear any stale milestone-reflection flag on entry so a Stage-8 (or 7) check never leaks into a later stage. The in-stage milestone action (selectRevisionFocus/selectPolishRoute) re-sets it for the current stage.
    logProcessEvent('stage_advanced', `Advanced to Stage ${id}${STAGES[id - 1] ? ' — ' + STAGES[id - 1].en : ''}.`);
    state.step  = loadStepForStage(id);
    const s = STAGES[id - 1];
    if (D.headerSub) {
        const ms = milestoneForStage(id);
        const mL = msLabel(ms);
        D.headerSub.innerHTML = `<span class="show-es">TU COACH DE ESCRITURA</span><span class="lang-sep">&nbsp;·&nbsp;</span><span class="show-en">YOUR WRITING COACH</span>&nbsp;—&nbsp;<span class="header-stage-inline"><span class="show-es">Paso ${ms.n} de ${TOTAL_MILESTONES} · ${escapeHtml(mL.es)}</span><span class="lang-sep"> / </span><span class="show-en">Step ${ms.n} of ${TOTAL_MILESTONES} · ${escapeHtml(mL.en)}</span></span>`;
    }
    try { localStorage.setItem('tupana_stage', String(id)); } catch(e) {}
    buildMap();
    updateCurrentTaskBar();

    // Phase completion note (system log — only for true phase boundaries)
    {
        const note = phaseCompletionNote(id);
        if (note) setTimeout(() => addSys(`${note.es} · ${note.en}`), 400);
    }
    // Celebration toast — fires at any significant milestone, not only phase boundaries
    if (PHASE_CELEBRATIONS[id]) {
        showPhaseCelebration(id);
    }
    // P4 follow-up: the legacy `id === 12` process-note trigger (unreachable in
    // the 10-stage app) was removed 2026-06-12. The single completion trigger
    // now lives in closeCapstoneModal() — armed by instructor report generation.
    renderBadges();
    renderEvalStreak();
    updateDraftControls();

    // Load the new stage's writing content
    const _newContent = loadStageWork(id);
    D.draftArea.value = _newContent;
    editHistoryInit(_newContent);
    D.draftArea.dispatchEvent(new Event('input'));

    // Stage-entry welcome (Patch 3): canned one-time orientation in the chat stream.
    // H4 (Stage A.2 polish): this is the SINGLE automatic stage-entry guidance channel.
    // The Pana Hint is no longer auto-pushed on entry (it duplicated this message at
    // every stage). PANA_HINTS / injectPanaHint() are retained for on-demand/future use;
    // STAGE_ENTRY_MESSAGES carries the Stage-6 authorship framing and Stage-8 voice framing.
    setTimeout(() => injectStageEntryWelcome(id), 400);

    // Show Five Questions reference strip from Stage 7 onward.
    // Also inject the stage-level "Evaluar" call-to-action (once) so students
    // evaluate intentionally rather than rating every individual message.
    if (id >= 7) {
        const fqs = document.getElementById('fiveQStrip');
        if (fqs) {
            fqs.classList.remove('hidden');
            if (!fqs.querySelector('.five-q-eval-action')) {
                const evalBtn = document.createElement('button');
                evalBtn.className = 'five-q-eval-action';
                evalBtn.setAttribute('aria-label',
                    'Evaluar la última respuesta del coach · Evaluate the last coach response');
                evalBtn.innerHTML =
                    '<span class="show-es">Evaluar la última respuesta del coach</span>' +
                    '<span class="lang-sep"> · </span>' +
                    '<span class="show-en">Evaluate last coach response</span>';
                evalBtn.addEventListener('click', evalLastCoachMessage);
                const body = fqs.querySelector('.five-q-body');
                if (body) body.appendChild(evalBtn);
            }
            // Auto-open the strip once on first Stage 7 entry so the student
            // discovers the Five Questions and the Evaluar action naturally.
            // Only fires once (localStorage flag); student closing it is respected.
            if (id === 7 && !localStorage.getItem('tupana_fiveq_stage7_opened_once')) {
                const fqDetails = fqs.querySelector('.five-q-details');
                if (fqDetails) fqDetails.open = true;
                try { localStorage.setItem('tupana_fiveq_stage7_opened_once', '1'); } catch(e) {}
            }
        }
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

    // In-flow micro-reflections (Batch 4): after revision (entering checklist)
    // and before final submit (Stage 10). Lightweight, autosave, optional.
    if (id === 9)  setTimeout(() => injectMicroReflection('changed'), 700);
    if (id === 10) setTimeout(() => injectMicroReflection('needs_work'), 1000);

    // Unlock writing skill for this stage.
    // Stage 6 is intentionally excluded — its skill unlocks only after executeSave().
    if (id !== 6) unlockStageSkill(id);

    // Auto-open AI literacy reflection checkpoint at key stage entries (once per stage ever)
    maybeOpenStageEntryReflectionCheckpoint(id);

    return true;
}

function onStageClick(s) {
    if (s.id >= 7 && !state.draftSaved) {
        addSys(t(
            `⭐ Para seguir, primero guarda tu primer borrador sin ayuda en el panel izquierdo. Ese borrador es tuyo — nada puede reemplazarlo. / To continue, first save your unassisted first draft in the left panel. That draft is yours — nothing can replace it.`,
            `⭐ This step requires a saved first draft. Write and save your draft first.`
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
            D.saveBtnLabel.innerHTML = '<span class="tp-icon" style="width:16px;height:16px"><svg viewBox="0 0 64 64"><path class="tp-fill-paper" d="M14 7h33l7 7v43H14z"/><path d="M47 7v8h7M22 23h21M22 31h16"/><circle class="tp-fill-jade" cx="43" cy="45" r="10"/><path d="M38 45l4 4 7-8"/></svg></span> <span class="show-es">Guardar</span><span class="lang-sep"> · </span><span class="show-en">Save</span>';
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

    // Stage-readiness cue (Patch 2): subtle signal when enough stage work is present.
    // stageCoachResponses >= 3 mirrors the coach's own "move forward" threshold.
    // Excluded at Stage 6 (authorship gate owns that button) and Stage 10 (no button).
    const _stageCoachCount = (() => {
        try {
            const log = JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || '[]');
            return log.filter(e => e.who === 'bot' && e.msgType !== 'welcome' && e.msgType !== 'stage-intro' && e.msgType !== 'system' && e.stage === state.stage).length;
        } catch(e) { return 0; }
    })();
    const _isReady = !isS6 && !isS10 && _stageCoachCount >= 3 && !!(D.draftArea && D.draftArea.value.trim().length > 0);
    D.continueBtn.classList.toggle('continue-btn--ready', _isReady);

    if (tr && !isS10) {
        const ctaArrow = '<span class="tp-icon" style="width:16px;height:16px"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 32h36"/><path d="M36 20l14 12-14 12"/></svg></span>';
        const pfx = _isReady ? '✓ ' : '';
        D.continueBtn.innerHTML =
            `${ctaArrow}<span class="show-es">${pfx}${escapeHtml(tr.ctaEs)}</span>` +
            `<span class="lang-sep"> · </span>` +
            `<span class="show-en">${pfx}${escapeHtml(tr.ctaEn)}</span>`;
        const ariaPrefix = _isReady ? 'Listo/a · Ready — ' : '';
        D.continueBtn.setAttribute('aria-label', `${ariaPrefix}${tr.ctaEs} · ${tr.ctaEn}`);
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
    updateFullDraftReviewButton();
}

function showTip(e, s) {
    const r = e.currentTarget.getBoundingClientRect();
    const tL = stLabel(s.id);
    const tStep = (typeof getStageStepOverride === 'function') ? getStageStepOverride(s.id, 0, state.assignmentId) : null;
    const tDesc = tStep ? (tStep.es + ' / ' + tStep.en) : s.desc;
    D.tooltip.innerHTML = `<strong>${s.id}. <span class="show-es">${escapeHtml(tL.es).replace('\n', ' ')}</span><span class="lang-sep"> / </span><span class="show-en">${escapeHtml(tL.en)}</span></strong>${escapeHtml(tDesc)}`;
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
        : `<span class="show-es">${w} palabras</span><span class="lang-sep"> · </span><span class="show-en">${w} words</span>`;
    D.saveBtn.disabled = w < 10 || state.draftSaved;
    clearTimeout(_stepAdvanceTimer);
    _stepAdvanceTimer = setTimeout(() => autoAdvanceStepOnWordCount(w), 900);
    if (!_editHistory.restoring) editHistorySchedule();
    if (state.spotlightTarget === 'editor') dismissEditorSpotlight();
    enterDraftFocus();
    if (state.stage === 8) renderVoiceVault();
    _autosaveSchedule();
    updateFullDraftReviewButton();
});

D.draftArea.addEventListener('focus', () => {
    enterDraftFocus();
});

// Selection tracking for the Protect toolbar button
D.draftArea.addEventListener('mouseup', updateProtectBtn);
D.draftArea.addEventListener('keyup',   updateProtectBtn);
D.draftArea.addEventListener('select',  updateProtectBtn);

// ════════════════════════════════════════════════════════
//  P1: AUTOSAVE (pre-pilot patch plan 2026-06-12)
//  Persists the active stage textarea to the existing tupana_writing_s<N> key:
//  at most every 30 s while the student keeps writing, immediately on blur,
//  and on page hide (Brightspace reload / Safari refresh / mobile tab
//  suspension fire pagehide or visibilitychange before unload). No new
//  storage keys; never touches tupana_draft / tupana_draft_saved / skill
//  unlocks — the Stage 6 authorship gate runs exclusively through
//  executeSave(), and a locked Stage 6 textarea is disabled, so autosave
//  cannot fire there (the flush also refuses disabled editors outright).
// ════════════════════════════════════════════════════════
const AUTOSAVE_INTERVAL_MS = 30000;
let _autosaveTimer = null;
let _autosaveDirty = false;

function _setAutosaveStatus(mode) {
    const elS = document.getElementById('autosaveStatus');
    if (!elS) return;
    elS.classList.remove('autosave-status--saved', 'autosave-status--error');
    if (mode === 'saved') {
        elS.classList.add('autosave-status--saved');
        elS.innerHTML = '<span class="show-es">✓ Guardado</span><span class="lang-sep"> · </span><span class="show-en">Saved</span>';
        clearTimeout(_setAutosaveStatus._fade);
        _setAutosaveStatus._fade = setTimeout(() => {
            if (elS.classList.contains('autosave-status--saved')) {
                elS.classList.remove('autosave-status--saved');
                elS.innerHTML = '';
            }
        }, 2600);
    } else if (mode === 'error') {
        elS.classList.add('autosave-status--error');
        elS.innerHTML = '<span class="show-es">⚠ No se pudo guardar — descarga tu trabajo (Guardar / Exportar)</span><span class="lang-sep"> · </span><span class="show-en">Could not save — download your work (Save / Export)</span>';
    } else {
        elS.innerHTML = '';
    }
}

// Cancels any pending autosave without writing — used when another save path
// (stage-transition save, executeSave) has just persisted the same content.
function _autosaveSettle() {
    clearTimeout(_autosaveTimer);
    _autosaveTimer = null;
    _autosaveDirty = false;
}

function autosaveFlush() {
    if (!_autosaveDirty) return true;
    // A disabled editor is the locked Stage 6 first draft — never write past it.
    if (D.draftArea.disabled) { _autosaveSettle(); return true; }
    clearTimeout(_autosaveTimer);
    _autosaveTimer = null;
    let ok = false;
    try {
        localStorage.setItem(`tupana_writing_s${state.stage}`, D.draftArea.value);
        ok = true;
    } catch(e) { ok = false; }
    if (ok) { _autosaveDirty = false; _setAutosaveStatus('saved'); }
    else    { _setAutosaveStatus('error'); }
    return ok;
}

function _autosaveSchedule() {
    _autosaveDirty = true;
    // One pending timer at a time — not reset per keystroke, so writes land at
    // most every AUTOSAVE_INTERVAL_MS during continuous typing, and at latest
    // AUTOSAVE_INTERVAL_MS after any unsaved change.
    if (_autosaveTimer) return;
    _autosaveTimer = setTimeout(() => { _autosaveTimer = null; autosaveFlush(); }, AUTOSAVE_INTERVAL_MS);
}

D.draftArea.addEventListener('blur', autosaveFlush);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') autosaveFlush();
});
window.addEventListener('pagehide', autosaveFlush);

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
        // H2 (iPhone QA 2026-06-12): iOS may refuse clipboard.readText after the
        // system paste bubble is dismissed — guide touch users to the native
        // long-press path instead of desktop-only keyboard shortcuts.
        showEditStatus('Mantén presionado el área de texto y elige "Pegar". · Press and hold the writing area and choose "Paste". (Teclado: Ctrl+V / Cmd+V)');
    }
    area.focus();
}

D.saveBtn.addEventListener('click', () => {
    if (state.draftSaved) return;
    D.saveBtn.classList.add('saving');
    setTimeout(() => D.saveBtn.classList.remove('saving'), 700);
    setOverlayOpen(D.confirmBg, true);
    D.confirmOk.focus();
});

D.confirmCancel.addEventListener('click', () => setOverlayOpen(D.confirmBg, false, { restoreFocus: true }));
D.confirmBg.addEventListener('click', e => {
    if (e.target === D.confirmBg) setOverlayOpen(D.confirmBg, false, { restoreFocus: true });
});

D.confirmOk.addEventListener('click', () => {
    setOverlayOpen(D.confirmBg, false);
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
    _autosaveSettle(); // ceremony save above just persisted s6; cancel any pending autosave
    logProcessEvent('first_draft_saved', `Unassisted first draft saved. Word count: ${D.draftArea.value.trim().split(/\s+/).filter(Boolean).length}.`);
    unlockStageSkill(6); // Author-owned draft — gated on actual save, not stage entry

    setOverlayOpen(D.modalBg, true);
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

    // Show decision log for revision tracking
    renderDecisionLog();

    // In-flow micro-reflection #1 — capture the main idea right after the
    // first draft is locked in (Batch 4). Lightweight, autosaves, optional.
    setTimeout(() => injectMicroReflection('main_idea'), 1000);

    renderBadges();
}

// Save ceremony next-step handler
function saveCeremonyNext(choice) {
    setOverlayOpen(D.modalBg, false);
    if (choice === 'revise') {
        goToStage(7);
        setTimeout(() => {
            addSys(
                'Tu primer borrador quedó guardado en este navegador y no se envió al Coach IA. Si quieres una lectura completa, usa “Revisar borrador” y elige un lente.\n' +
                'Your first draft is saved in this browser and was not sent to the Live AI coach. If you want a whole-draft reading, use “Review draft” and choose one lens.'
            );
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

    // Welcome/greeting messages and stage-intro orientation notes render as compact strips — not full bot bubbles
    if (msgType === 'welcome' || msgType === 'stage-intro') {
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
        if (msgType === 'stage-intro') {
            const _parts = text.split('\n');
            const _ttsBtn = _makeTtsBtn(_parts[0] || text, _parts[1] || _parts[0] || text);
            if (_ttsBtn) strip.appendChild(_ttsBtn);
        }
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

    // Refresh continue-button readiness cue after each coach message (Patch 2)
    if (who === 'bot') { setTimeout(updateDraftControls, 0); }

    // Activate coach spotlight on the first bot message after a stage transition
    // Guard: don't override if the Pana Hint spotlight is already active
    if (who === 'bot' && state.spotlightTarget === 'coach' && !document.body.classList.contains('spotlight-coach')) {
        _activateCoachSpotlightOn(wrap);
    }

    // milestone-based reflection checkpoint button (stages 4+)
    if (who === 'bot' && state.stage >= 4) {
        setTimeout(() => renderReflectButton(msgId), 400);
    }
    // inject follow-up questions after every bot message
    if (who === 'bot') {
        setTimeout(injectFollowupPanel, 600);
    }
    // Evaluar bars are no longer injected automatically on each bot message.
    // Students use the "Evaluar última respuesta" action inside the Five Questions
    // strip (visible Stage 7+) to evaluate intentionally. This converts repeated
    // per-message bars into a single, purposeful stage-level metacognitive action.
    // The restore path (below) still re-renders bars for messages the student
    // already evaluated in a prior session, preserving their saved picks.

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

// Build channelData with full app context for AI stage awareness
function buildChannelData() {
    let maniSentence = '';
    try { maniSentence = localStorage.getItem('tupana_mani_sentence') || ''; } catch(e) {}
    return {
        app: 'tupana',
        assignmentId: state.assignmentId || null,
        stage: state.stage,
        stageId: getStageId(state.stage),
        stageName: (function(){ const l = stLabel(state.stage); return l ? l.es.replace('\n', ' ') + ' / ' + l.en : ''; })(),
        draftSaved: state.draftSaved,
        maniDone: localStorage.getItem('tupana_mani_done') === 'true',
        labDone: localStorage.getItem('tupana_lab_done') === 'true',
        maniSentence: maniSentence.slice(0, 280),
        wordCount: D.draftArea ? D.draftArea.value.trim().split(/\s+/).filter(Boolean).length : 0,
        tone: state.tone,
        priorCoachResponses: (() => {
            try {
                const log = JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || '[]');
                return log.filter(e => e.who === 'bot' && e.msgType !== 'welcome' && e.msgType !== 'stage-intro' && e.msgType !== 'system').length;
            } catch(e) { return 0; }
        })(),
        stageCoachResponses: (() => {
            try {
                const log = JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || '[]');
                return log.filter(e => e.who === 'bot' && e.msgType !== 'welcome' && e.msgType !== 'stage-intro' && e.msgType !== 'system' && e.stage === state.stage).length;
            } catch(e) { return 0; }
        })()
    };
}

function setCoachMode(mode) {
    if (!['offline', 'ollama', 'gemini'].includes(mode)) mode = 'offline';
    state.coachMode = mode;
    localStorage.setItem('tupana_coach_mode', mode);
    if (D.stuckBtn) D.stuckBtn.disabled = false;

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
        D.chatStatus.innerHTML = '<span class="status-dot" aria-hidden="true">●</span> <span class="show-es">Local · Ollama</span><span class="lang-sep"> · </span><span class="show-en">Local AI · Ollama</span>';
        D.chatStatus.classList.remove('idle');

    } else if (mode === 'gemini') {
        // Gemini via Cloudflare Worker proxy: native chat UI, no iframe
        if (chatMessages)  chatMessages.style.display  = '';
        if (typingRow)     typingRow.style.display     = '';
        if (chatInputWrap) chatInputWrap.style.display = '';

        state.connected = true;
        D.chatStatus.innerHTML = '<span class="status-dot" aria-hidden="true">●</span> <span class="show-es">Coach IA</span><span class="lang-sep"> · </span><span class="show-en">Live AI</span>';
        D.chatStatus.classList.remove('idle');

    } else {
        // Offline mode: native chat with built-in stage guidance
        if (chatMessages)  chatMessages.style.display  = '';
        if (typingRow)     typingRow.style.display     = '';
        if (chatInputWrap) chatInputWrap.style.display = '';
        D.chatStatus.innerHTML = '<span class="status-dot" aria-hidden="true">●</span> <span class="show-es">Guía sin IA</span><span class="lang-sep"> · </span><span class="show-en">Built-in, no AI</span>';
        D.chatStatus.classList.remove('idle');
    }
    updateFullDraftReviewButton();
}

function _injectStartupMsg() {
    try {
        const onboardingDone =
            localStorage.getItem('tupana_onboarding_complete') === 'true' ||
            localStorage.getItem('tupana_lab_done') === 'true';
        if (!onboardingDone) return;
        const log = JSON.parse(localStorage.getItem('tupana_chatlog') || '[]');
        if (log.length > 0) return;
        addMsg(
            'Tu Pana está iniciando. Puedes comenzar a escribir en el borrador mientras tu guía se conecta.\n' +
            'Tu Pana is starting. You can begin writing in the draft area while your coach connects.',
            'bot', true, 'welcome'
        );
    } catch(e) {}
}

// P2 (pre-pilot patch plan 2026-06-12): one-tap recovery when the Gemini coach
// errors. Renders a switch-to-Offline button inside the error bubble. Live
// errors only — restored chatlogs show the error text without the button (the
// coach-mode toggle remains the standing recovery path).
function _renderOfflineFallbackBtn(msgId) {
    try {
        const bubble = D.chatMessages.querySelector(`.msg[data-msg-id="${msgId}"] .msg-bubble`);
        if (!bubble || bubble.querySelector('.offline-fallback-btn')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'offline-fallback-btn';
        btn.setAttribute('aria-label', 'Cambiar a Guía sin IA · Switch to Built-in, no AI');
        btn.innerHTML = '<span class="show-es">Cambiar a Guía sin IA</span><span class="lang-sep"> · </span><span class="show-en">Switch to Built-in, no AI</span>';
        btn.addEventListener('click', () => {
            btn.disabled = true;
            setCoachMode('offline');
            // P1 carry-forward: flush any unsaved draft right now so the
            // "Tu trabajo está guardado" line below is literally true at the
            // moment it is shown (a failed write surfaces the error indicator).
            autosaveFlush();
            addMsg(
                'Guía sin IA activada. Tu trabajo está guardado. Usa el botón "Estoy atascado" para recibir orientación en cada etapa.\n' +
                'Built-in, no AI mode is on. Your work is saved. Use the "I\'m stuck" button for guidance at each stage.',
                'bot', true, 'welcome'
            );
        });
        bubble.appendChild(btn);
        D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
    } catch(e) {}
}

async function initDL() {
    if (state.coachMode === 'gemini' && FEATURES.geminiProvider) {
        setCoachMode('gemini');
        _injectStartupMsg();
        return;
    }
    if (state.coachMode === 'ollama') {
        setCoachMode('ollama');
        _injectStartupMsg();
        return;
    }
    setCoachMode('offline');
}

// One-time, non-blocking first-live-AI-send cue (IA Sprint Batch 2). The first time
// a real student message goes to the live AI coach, a small strip explains that the
// message and the relevant text from their writing are sent to the AI. Purely
// informational: it never blocks or delays the send, requires no student action,
// and changes no provider, payload, or default-mode behavior. Persistent flag
// tupana_ai_cue_seen (additive key); a per-load guard keeps it once-per-session
// even if storage is unavailable.
// De-overwhelm B5: render-time AI-attribution chip on LIVE coach replies only.
// Display-only — reads state.coachMode at the moment the reply renders; NOTHING is
// persisted (no chatlog field, no storage), so replies restored after a reload carry
// no chip. That live-only limitation is deliberate: persistent per-message
// attribution needs a chatlog schema change and separate approval.
function _appendLiveModeChip(msgId) {
    try {
        const bubble = D.chatMessages.querySelector(`.msg[data-msg-id="${msgId}"] .msg-bubble`);
        if (!bubble || bubble.querySelector('.msg-mode-chip')) return;
        const chip = document.createElement('span');
        chip.className = 'msg-mode-chip';
        chip.innerHTML = state.coachMode === 'gemini'
            ? '<span class="show-es">Coach IA</span><span class="lang-sep"> · </span><span class="show-en">Live AI</span>'
            : '<span class="show-es">IA local</span><span class="lang-sep"> · </span><span class="show-en">Local AI</span>';
        bubble.appendChild(chip);
    } catch(e) {}
}

let _aiCueShownThisLoad = false;
function maybeShowFirstAiSendCue() {
    if (_aiCueShownThisLoad) return;
    _aiCueShownThisLoad = true;
    try {
        if (localStorage.getItem('tupana_ai_cue_seen') === 'true') return;
        localStorage.setItem('tupana_ai_cue_seen', 'true');
    } catch(e) {}
    addMsg(
        'Coach IA en vivo: tu mensaje y el texto relevante de tu escritura se envían a la IA para generar la respuesta. Tu Pana no guarda tu escritura en un servidor.\nLive AI coach: your message and the relevant text from your writing are sent to the AI to generate the response. Tu Pana does not store your writing on a server.',
        'bot', false, 'welcome'
    );
}

async function sendMsg(text, options) {
    if (!state.connected || state.waiting) return;
    if (text !== '__INIT__') {
        addMsg((options && options.displayText) || text, 'user');
        logProcessEvent('coach_message_sent', 'Student sent message to coach.');
        if (state.coachMode === 'gemini') maybeShowFirstAiSendCue();
    }
    state.waiting = true;
    showTyping(true);
    D.sendBtn.disabled = true;
    updateFullDraftReviewButton();

    // Ollama local AI mode: raw text via shared generateCoachResponse()
    if (state.coachMode === 'ollama') {
        let outcome = { ok: false };
        try {
            const reply = await generateCoachResponse({ prompt: text });
            if (reply) {
                const _mid = addMsg(reply, 'bot');
                _appendLiveModeChip(_mid);
                outcome = { ok: true };
            }
        } catch(err) {
            console.error('ollama:', err);
            addMsg(getOllamaFriendlyError(err), 'bot');
        } finally {
            showTyping(false);
            state.waiting = false;
            D.sendBtn.disabled = false;
            updateFullDraftReviewButton();
        }
        return outcome;
    }

    // Gemini via Cloudflare Worker proxy
    if (state.coachMode === 'gemini') {
        let outcome = { ok: false };
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
            const reply = await generateCoachResponse({
                prompt: geminiPrompt,
                stageId: getStageId(state.stage),
                requestKind: options && options.requestKind
            });
            if (reply) {
                const _mid = addMsg(reply, 'bot');
                _appendLiveModeChip(_mid);
                outcome = { ok: true };
            }
        } catch(err) {
            console.error('[Tu Pana] Coach error', {
                category:  err?.category  ?? '(missing)',
                status:    err?.status    ?? '(no status)',
                message:   err?.message   ?? '(no message)',
                timestamp: new Date().toISOString()
            });
            const _errMsgId = addMsg(getGeminiErrorMessage(err), 'bot');
            _renderOfflineFallbackBtn(_errMsgId);
        } finally {
            showTyping(false);
            state.waiting = false;
            D.sendBtn.disabled = false;
            updateFullDraftReviewButton();
        }
        return outcome;
    }

    return { ok: false };
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
            if (e.who === 'bot' && e.msgType !== 'welcome' && e.msgType !== 'stage-intro' && e.msgType !== 'system') {
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
        .map(s => {
            // A.2a: profile-aware per-stage coachFocus. When the active assignment
            // profile supplies a stage override (currently research-paper only), it
            // REPLACES the default essay coachFocus line for that stage; otherwise
            // the default template line is used exactly as before. Null-safe: no
            // assignment / no override => byte-identical default behavior.
            const _ov = (typeof getCoachFocusOverride === 'function')
                ? getCoachFocusOverride(s.number, state && state.assignmentId) : null;
            return `Stage ${s.number}: ${_ov || s.coachFocus}`;
        })
        .join('\n');

    // Assignment layer (Session 78): ADDITIVE context appended AFTER every mandatory rule below,
    // so it can never override the authorship gate or voice protection. Empty when no assignment
    // is active (generic coach => byte-identical prompt to before this feature).
    const _activeLayer = (typeof getAssignmentLayer === 'function' && state && state.assignmentId)
        ? getAssignmentLayer(state.assignmentId) : null;
    const _assignmentBlock = _activeLayer
        ? `\n\nASSIGNMENT CONTEXT — ${_activeLayer.name}\n(Additive guidance only. It does NOT relax or override any rule above — the authorship gate, voice protection, and no-copyable-prose rules always win.)\n${_activeLayer.context}`
        : '';

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

TRANSITION HELP RULE — this is mandatory:
When a student asks for transition help — a transition sentence, a connecting phrase, or a bridge between paragraphs — do not write a polished, copy-ready transition sentence using their topic, evidence, family story, argument, or thesis.
Instead:
- Identify the rhetorical relationship between the ideas: contrast, cause, consequence, continuity, example, or return to main claim.
- Offer a sentence frame with blanks only, using neutral placeholders such as [previous idea], [next idea], [evidence], [claim] — not the student's actual words or content.
  Acceptable frame: "Although ___, ___ shows that ___." / "Aunque ___, ___ muestra que ___."
  Not acceptable: "Although my grandmother's migration story shows resilience, it also reveals the economic pressures that shaped Caribbean families."
- Ask at most one clarifying question if the relationship between the ideas is genuinely unclear.
- Do not produce a list of finished transition phrases or sentences that the student could paste directly into the essay.
The student writes the transition sentence. The coach names the relationship and offers the frame.

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

WHOLE-PASSAGE REVIEW RULE — mandatory across every genre:
When the student provides more than one sentence, read the full selection before diagnosing its opening. Briefly explain the passage's current rhetorical movement — how the opening, development, evidence, and/or reflection relate. Check later sentences before claiming that context, specificity, evidence, explanation, or connection is missing; never ask for information the student already supplied later in the passage. If the highest-impact issue is in the first sentence, state the rhetorical purpose of changing it (such as creating a more situated hook, clarifying the focus, or reaching distinctive evidence sooner) and explain why. Distinguish a sentence-level problem from a passage-level problem. Ground feedback in exact language from relevant parts of the passage, choose one highest-impact next move, and do not rewrite.

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

FEEDBACK SCOPE AND MOMENTUM RULE — this is mandatory for all stages, especially Stages 1–5:
Tu Pana is not an optimizer. More revision is not always better. The goal is authorship, confidence, and process completion — not a perfect anecdote.

RESPONSE SCOPE:
- Offer no more than 2 improvement areas per response. Pick the single most impactful one. Do not list every possible improvement.
- Ask no more than 1–2 questions per response. Prefer one strong guiding question. Do not stack multiple questions in a single response. If the student appears uncertain or is early in the stage, ask exactly one question. Zero questions is sometimes the right response when the student has done enough and needs to move forward, not reflect further.
- If the student asks what to focus on first, name one specific priority area and stop.
- For ordinary coaching, use three compact moves and then stop: one observation anchored in the student's exact words, one highest-impact next move, and at most one guiding question.
- Keep an ordinary response near 120–220 words. If the student asks a direct, narrow question, prefer 120 words or fewer. Exceed this only when the student explicitly asks for more detail, starts the separate whole-draft review workflow, or the structured Stage 10 coach-perspective request explicitly requires all rubric dimensions.
- Do not restate the assignment, summarize the entire draft, or repeat context the student already supplied unless that context is necessary to explain the one chosen next move.

REVISION-CYCLE AWARENESS:
The student context includes a field called stageCoachResponses — the count of coach responses given in the current stage only. This count resets to 0 each time the student advances to a new stage.
Use it to modulate your feedback within this stage:
- stageCoachResponses 0 (first response in this stage): Give a structured response. Name one specific strength in the student's actual words. Identify at most 2 improvement areas. Ask 1 focused question — at most 2. Stop there.
- stageCoachResponses 1–2: The student has had time to revise or reflect. Acknowledge what is concretely stronger before anything else. Offer at most 1 narrowly targeted refinement. Ask one question or name the single next step. Begin shifting toward forward momentum.
- stageCoachResponses 3 or more: If the core stage task is present in the student's writing, affirm that clearly and specifically. Do not introduce new critique. Tell the student they have enough to move forward. Invite them to continue to the next stage when they are ready. Use language like: "You have enough to move forward with this idea. Keep your own wording and continue to the next stage when you are ready." / "Ya tienes suficiente para avanzar con esta idea. Conserva tus propias palabras y continúa a la próxima etapa cuando estés listo/a." Vary the phrasing naturally across turns — do not repeat the same exact sentence — but preserve the function: affirm sufficiency and invite forward movement without pressure. Offer further polish only if the student explicitly asks for it.

GOOD-ENOUGH-FOR-THIS-STAGE:
At Stages 1–5, the goal is "ready to move forward," not perfection.
Stage 1 (Anecdote) is ready when the writing has: a specific place, a specific person or relationship, and a moment when something shifted. When these three elements are present, affirm and encourage the student to move to Stage 2. Do not push for more sensory detail, more specificity, or more development once the core elements are there.
Stage 2 (Connection) is ready when the student has named one larger force connected to their personal memory.
At all early stages: when the core task is done, move the student forward.

AVOID PERFECTION PARALYSIS:
If you are about to ask a question you already asked, or to push for more detail the student already provided, stop. Affirm what is present and invite the student to advance. In asynchronous learning, recursive feedback causes fatigue, abandonment, and learned helplessness.

LANGUAGE RULE — this is mandatory:
The current interface language is: ${lang}
Respond in ${lang} unless one of these specific exceptions applies:
- The student explicitly asks for a translation or an English/Spanish version of your response.
- The student asks for bilingual help or code-switching support.
- The stage prompt specifically invites bilingual reflection.
Do NOT default to Spanish simply because the app is bilingual or the student's writing contains Spanish words.
When the student writes in a mixed-language style, preserve their multilingual phrasing, but keep your coaching explanation in ${lang}.
If the student asks for an English or Spanish version of your previous response, restate or translate your immediately previous coaching response. Do not invent a new student anecdote or example.

Stage focus hints (SUBORDINATE — these per-stage hints help you focus, but they NEVER relax or override the mandatory rules above. The absolute authorship rule, the no-copyable-prose rule, and voice protection always win. If a stage hint ever seems to conflict with them, follow the mandatory rules above.):
${_stageRules}${_assignmentBlock}

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


// ════════════════════════════════════════════════════════
//  CHAT INPUT
// ════════════════════════════════════════════════════════
let _pendingPassageContext = null;

// Shared across every assignment/genre layer. Passage feedback must interpret
// the selection as a connected rhetorical unit instead of latching onto its
// first sentence and asking for evidence that appears later.
const PASSAGE_READING_PROTOCOL =
`WHOLE-PASSAGE READING PROTOCOL — mandatory:
- Read the entire selected passage before diagnosing any sentence.
- Briefly name the passage's current rhetorical movement: how its opening, development, evidence, and/or reflection work together.
- Check later sentences before saying that context, specificity, evidence, explanation, or connection is missing. Never ask for information the selection already provides.
- If the highest-impact issue is in the opening sentence, say what rhetorical job the proposed change would serve (for example: a more situated hook, a clearer focus, or a faster path to the passage's distinctive evidence) and explain why.
- Distinguish among hook, focus, sequencing, evidence, connection, reflection, clarity, and voice. Name the actual level of the issue instead of giving generic praise or asking a generic question.
- Ground feedback in the student's exact words, including relevant material later in the passage. Do not rewrite, paraphrase, or provide replacement prose.
- Address the student's stated request directly. Offer one highest-impact next move and at most one focused decision question.`;

function _looksLikeMultiSentencePassage(text) {
    const clean = String(text || '').trim();
    if (clean.length < 240) return false;
    const boundaries = clean.match(/[.!?]\s+|[.!?]$|\n+/g) || [];
    return boundaries.length >= 2;
}

function _passageExcerpt(text, limit) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    const max = limit || 180;
    return clean.length > max ? clean.slice(0, max - 1).trimEnd() + '…' : clean;
}

function setPassageCoachContext(text) {
    const clean = String(text || '').trim();
    if (!clean) return;
    _pendingPassageContext = clean;
    const chip = document.getElementById('passageContextChip');
    const excerpt = document.getElementById('passageContextExcerpt');
    if (excerpt) excerpt.textContent = '“' + _passageExcerpt(clean, 150) + '”';
    if (chip) chip.hidden = false;
}

function clearPassageCoachContext() {
    _pendingPassageContext = null;
    const chip = document.getElementById('passageContextChip');
    if (chip) chip.hidden = true;
}

D.chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 110) + 'px';
    D.sendBtn.disabled = !this.value.trim() || !state.connected || state.waiting;
});

D.chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitChat(); }
});
D.sendBtn.addEventListener('click', submitChat);

function getOpenStaticDialog() {
    const priority = [
        'completionBg',
        'pnModalBg',
        'reportBg',
        'capstoneBg',
        'labBg',
        'maniBg',
        'modalBg',
        'confirmBg',
        'stagePreviewBg'
    ];
    return priority
        .map(id => document.getElementById(id))
        .find(overlay => overlay?.classList.contains('on')) || null;
}

function getDialogFocusables(dialog) {
    return Array.from(dialog.querySelectorAll(
        'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), summary, a[href], [tabindex]:not([tabindex="-1"])'
    )).filter(node => node.offsetParent !== null);
}

// Global keyboard shortcuts
document.addEventListener('keydown', e => {
    const openDialog = getOpenStaticDialog();
    if (e.key === 'Tab' && openDialog) {
        const focusable = getDialogFocusables(openDialog);
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (!first) {
            e.preventDefault();
            return;
        }
        if (!openDialog.contains(document.activeElement)) {
            e.preventDefault();
            (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
        }
        return;
    }
    if (e.key === 'Escape') {
        if (openDialog?.id === 'capstoneBg') {
            closeCapstoneModal();
            return;
        }
        // Dismiss spotlight before other modal checks
        if (state.spotlightTarget === 'coach') { dismissCoachSpotlight(); return; }
        if (state.spotlightTarget === 'editor') { dismissEditorSpotlight(); return; }
        // Never close the stage preview modal via Escape — student must read and click Continue
        if (openDialog?.id === 'stagePreviewBg') return;
        if (openDialog?.id === 'completionBg') { dismissCompletionCelebration(); return; }
        if (openDialog?.id === 'pnModalBg') { closeProcessNoteModal(); return; }
        if (openDialog?.id === 'reportBg') { closeReport(); return; }
        if (openDialog?.id === 'labBg') { closeLab(); return; }
        if (openDialog?.id === 'maniBg') {
            _stopOnboardingAudio();
            setOverlayOpen(openDialog, false, { restoreFocus: true });
            return;
        }
        if (openDialog?.id === 'modalBg' || openDialog?.id === 'confirmBg') {
            setOverlayOpen(openDialog, false, { restoreFocus: true });
            return;
        }
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

    // Keyword-based app-orientation fallback — intercept before AI
    const lower = t.toLowerCase();
    const CONFUSED_KEYWORDS = [
        'how do i', 'how does this', 'what is this', 'what do i do', 'what should i do',
        'where do i', 'where is the', "i don't understand", "i don't know what",
        'confused', 'not working', "doesn't work", "don't know how",
        'ayuda con la app', 'cómo funciona', 'no entiendo cómo', 'qué hago aquí',
        'qué tengo que hacer aquí', 'no sé cómo usar', 'no funciona la app'
    ];
    // A question attached to a selected passage is unambiguously about the
    // student's writing, even if it begins with "What should I do…".
    if (!_pendingPassageContext && CONFUSED_KEYWORDS.some(kw => lower.includes(kw))) {
        clearPassageCoachContext();
        addMsg(t, 'user');
        const isEs = state.lang !== 'en';
        let stageNote = '';
        if (state.stage === 6) {
            stageNote = isEs
                ? ' En la Etapa 6, completa los campos de reflexión en la tarjeta de tarea antes de continuar.'
                : ' In Stage 6, complete the reflection fields in the task card before continuing.';
        } else if (state.stage === 8) {
            stageNote = isEs
                ? ' En la Etapa 8, el coach te ayuda a fortalecer tu voz — no reescribirá tu texto por ti.'
                : ' In Stage 8, the coach helps you strengthen your voice — it will not rewrite your text for you.';
        } else if (state.stage === 10) {
            stageNote = isEs
                ? ' En la Etapa 10, completa los cuatro campos de la tarjeta final para terminar tu trabajo.'
                : ' In Stage 10, complete the four fields in the final card to finish your written work.';
        }
        const fallback = isEs
            ? `Parece que tienes una pregunta sobre cómo usar Tu Pana.${stageNote} Haz clic en el botón **?** (arriba a la derecha) para ver la guía de orientación. Si tienes una pregunta sobre tu escritura, escríbela y el coach te ayudará.`
            : `It looks like you have a question about how to use Tu Pana.${stageNote} Click the **?** button (top right) to open the orientation guide. If you have a question about your writing, type it and the coach will help.`;
        addMsg(fallback, 'bot');
        D.sendBtn.disabled = false;
        return;
    }

    let message = t;
    let displayMessage = t;
    // A student may paste a passage directly into chat instead of attaching it
    // through the contextual toolbar. Substantial multi-sentence writing still
    // deserves full passage reasoning and the full Flash model.
    let requestKind = _looksLikeMultiSentencePassage(t) ? 'passage_analysis' : undefined;
    if (_pendingPassageContext) {
        const passage = _pendingPassageContext;
        requestKind = 'passage_analysis';
        message =
            '[STUDENT-SELECTED PASSAGE]\n' + passage +
            '\n[END SELECTED PASSAGE]\n\n' +
            PASSAGE_READING_PROTOCOL +
            '\n\nStudent question: ' + t;
        displayMessage = t + '\n\n↳ “' + _passageExcerpt(passage, 220) + '”';
        clearPassageCoachContext();
    }
    sendCoachMessage({
        message,
        displayMessage,
        stageId: getStageId(state.stage),
        requestKind
    });
}

// ════════════════════════════════════════════════════════
//  PASSAGE COACH
//  Selecting text reveals contextual, authorship-safe actions.
//  Quick actions send in one step; "Ask" carries the passage
//  into the composer as a removable context chip.
// ════════════════════════════════════════════════════════
(function initSelectionToCoach() {
    const menu = document.createElement('div');
    menu.id = 'passageCoachMenu';
    menu.className = 'passage-coach-menu';
    menu.setAttribute('role', 'toolbar');
    menu.setAttribute('aria-label', 'Consultar este pasaje · Ask about this passage');
    menu.innerHTML = `
        <span class="passage-coach-title"><span class="show-es">Consultar pasaje</span><span class="lang-sep"> · </span><span class="show-en">Ask about passage</span></span>
        <div class="passage-coach-actions">
            <button type="button" data-passage-action="works" aria-label="Qué funciona · What works"><span class="show-es">Qué funciona</span><span class="lang-sep"> · </span><span class="show-en">What works</span></button>
            <button type="button" data-passage-action="strengthen" aria-label="Fortalecer · Strengthen"><span class="show-es">Fortalecer</span><span class="lang-sep"> · </span><span class="show-en">Strengthen</span></button>
            <button type="button" data-passage-action="clarity"><span class="show-es">Claridad</span><span class="lang-sep"> · </span><span class="show-en">Clarity</span></button>
            <button type="button" data-passage-action="voice"><span class="show-es">Voz</span><span class="lang-sep"> · </span><span class="show-en">Voice</span></button>
            <button type="button" data-passage-action="ask" class="passage-coach-ask"><span class="show-es">Preguntar…</span><span class="lang-sep"> · </span><span class="show-en">Ask…</span></button>
        </div>`;
    menu.style.display = 'none';
    document.body.appendChild(menu);

    const ACTIONS = {
        works: {
            label: 'Qué funciona · What works',
            instruction: 'Identify the most important thing that already works in this passage. Explain how it contributes to the passage as a whole, using exact evidence from the student’s words. Do not invent a weakness and do not rewrite.'
        },
        strengthen: {
            label: 'Fortalecer · Strengthen',
            instruction: 'Identify the single highest-impact way the student could strengthen this passage. Classify the issue precisely as hook, focus, sequencing, evidence, connection, reflection, clarity, or voice. Explain the purpose of the change and give one actionable revision route, but do not execute the revision or provide replacement prose.'
        },
        clarity: {
            label: 'Claridad · Clarity',
            instruction: 'Identify the single most important clarity issue only after checking how the full selection develops it. Explain its location and effect, then ask one focused question that helps the student revise. Do not ask for material already present and do not offer replacement prose.'
        },
        voice: {
            label: 'Voz · Voice',
            instruction: 'Check how the student’s voice develops across this entire passage. Name one phrase that sounds distinctively theirs and one possible voice risk, if present. Consider later sentences before diagnosing the opening. Quote exact words only; do not rewrite.'
        }
    };

    function getSelectedText() {
        return D.draftArea.value.substring(
            D.draftArea.selectionStart,
            D.draftArea.selectionEnd
        ).trim();
    }

    function positionMenu() {
        const rect = D.draftArea.getBoundingClientRect();
        const menuWidth = menu.offsetWidth || 470;
        menu.style.top = Math.max(8, rect.top + 10) + 'px';
        menu.style.left = Math.max(8, Math.min(rect.right - menuWidth - 10, window.innerWidth - menuWidth - 8)) + 'px';
    }

    let _pendingSel = '';

    function showMenu(sel) {
        _pendingSel = sel;
        menu.style.display = '';
        menu.querySelectorAll('[data-passage-action]').forEach(actionBtn => {
            actionBtn.disabled = actionBtn.dataset.passageAction !== 'ask' && (!state.connected || state.waiting);
        });
        requestAnimationFrame(positionMenu);
    }

    function hideMenu() {
        menu.style.display = 'none';
        _pendingSel = '';
    }

    function onSelChange() {
        const sel = getSelectedText();
        sel.length > 0 ? showMenu(sel) : hideMenu();
    }

    D.draftArea.addEventListener('mouseup', onSelChange);
    D.draftArea.addEventListener('keyup',   onSelChange);
    D.draftArea.addEventListener('select',  onSelChange);

    let _hideTimer = null;
    D.draftArea.addEventListener('blur', () => { _hideTimer = setTimeout(hideMenu, 240); });
    menu.addEventListener('mousedown', () => clearTimeout(_hideTimer));
    menu.addEventListener('focusin', () => clearTimeout(_hideTimer));
    menu.addEventListener('focusout', () => { _hideTimer = setTimeout(hideMenu, 180); });

    menu.addEventListener('click', event => {
        const actionBtn = event.target.closest('[data-passage-action]');
        if (!actionBtn) return;
        const sel = _pendingSel || getSelectedText();
        if (!sel) return;
        const actionKey = actionBtn.dataset.passageAction;

        if (actionKey === 'ask') {
            setPassageCoachContext(sel);
            hideMenu();
            if (window.innerWidth <= 480) switchMobileTab('chat');
            D.chatInput.focus();
            return;
        }

        const action = ACTIONS[actionKey];
        if (!action || !state.connected || state.waiting) return;
        const prompt =
            '[STUDENT-SELECTED PASSAGE]\n' + sel +
            '\n[END SELECTED PASSAGE]\n\n' +
            PASSAGE_READING_PROTOCOL +
            '\n\nREQUESTED PASSAGE ACTION:\n' + action.instruction;
        const displayMessage = action.label + '\n“' + _passageExcerpt(sel, 240) + '”';
        hideMenu();
        if (window.innerWidth <= 480) switchMobileTab('chat');
        logProcessEvent('passage_coach_action', `Student requested ${actionKey} feedback on a selected passage (${sel.length} chars).`);
        sendCoachMessage({
            message: prompt,
            displayMessage,
            stageId: getStageId(state.stage),
            requestKind: 'passage_analysis'
        });
    });

    window.addEventListener('resize', () => {
        if (menu.style.display !== 'none') positionMenu();
    });
})();

// ════════════════════════════════════════════════════════
//  GUIDED FULL-DRAFT REVIEW
//  Available at the two moments when a whole-draft reading is pedagogically
//  useful: Stage 7 revision and Stage 9 final readiness. The workflow uses
//  purpose prompts rather than a hard quota. Students can always continue,
//  including with a long or unchanged draft, after making the intended use
//  explicit. Stored review history contains metadata only — never draft text.
// ════════════════════════════════════════════════════════
const FULL_DRAFT_REVIEW_KEY = 'tupana_full_draft_reviews';
const FULL_DRAFT_LENSES = {
    structure: {
        es: 'Estructura y trayectoria',
        en: 'Structure & trajectory',
        descEs: 'Cómo avanza el texto y dónde pierde impulso.',
        descEn: 'How the draft moves and where it loses momentum.',
        instruction: 'Prioritize the draft’s overall movement, organization, sequencing, paragraph roles, transitions, and through-line. Diagnose relationships across sections rather than editing sentences.'
    },
    evidence: {
        es: 'Evidencia y especificidad',
        en: 'Evidence & specificity',
        descEs: 'Dónde la evidencia convence y dónde falta precisión.',
        descEn: 'Where evidence persuades and where precision is missing.',
        instruction: 'Prioritize the quality, placement, specificity, and interpretation of evidence or concrete detail. Distinguish missing evidence from evidence that is present but not yet connected to the draft’s purpose.'
    },
    fit: {
        es: 'Encaje con la tarea',
        en: 'Assignment fit',
        descEs: 'Qué tan bien cumple el género y sus requisitos.',
        descEn: 'How well the draft meets its genre and requirements.',
        instruction: 'Prioritize fit with the active assignment or genre, its audience, purpose, required moves, and stated constraints. Do not impose conventions from a different genre.'
    },
    voice: {
        es: 'Voz y claridad',
        en: 'Voice & clarity',
        descEs: 'Dónde la voz se siente propia y dónde se nubla el sentido.',
        descEn: 'Where the voice feels distinct and where meaning blurs.',
        instruction: 'Prioritize voice, clarity, and rhetorical effectiveness across the whole draft. Preserve culturally meaningful language, dialect, code-switching, and the student’s distinctive phrasing. Do not rewrite or standardize their prose.'
    },
    audit: {
        es: 'Auditoría final',
        en: 'Final requirements audit',
        descEs: 'Qué está listo y qué revisar antes de entregar.',
        descEn: 'What is ready and what to check before submitting.',
        instruction: 'Prioritize final readiness. Check the whole draft against the active genre and assignment requirements, distinguish high-impact gaps from optional polish, and never invent a missing requirement.'
    }
};

function _fullDraftWordCount(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function _fullDraftProjectId() {
    return state.assignmentId || 'mixed-genre-autobiographical-essay';
}

function _fullDraftSignature(text) {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    let hash = 2166136261;
    for (let i = 0; i < normalized.length; i++) {
        hash ^= normalized.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return `${normalized.length}:${(hash >>> 0).toString(16)}`;
}

function _loadFullDraftReviewState() {
    try {
        const saved = JSON.parse(localStorage.getItem(FULL_DRAFT_REVIEW_KEY) || '{}');
        return {
            version: 1,
            projects: saved.projects && typeof saved.projects === 'object' ? saved.projects : {}
        };
    } catch(e) {
        return { version: 1, projects: {} };
    }
}

function _getFullDraftReviews() {
    const saved = _loadFullDraftReviewState();
    const project = saved.projects[_fullDraftProjectId()];
    return project && Array.isArray(project.reviews) ? project.reviews : [];
}

function _saveFullDraftReview(record) {
    try {
        const saved = _loadFullDraftReviewState();
        const projectId = _fullDraftProjectId();
        const prior = saved.projects[projectId];
        const reviews = prior && Array.isArray(prior.reviews) ? prior.reviews : [];
        saved.projects[projectId] = { reviews: reviews.concat(record).slice(-10) };
        localStorage.setItem(FULL_DRAFT_REVIEW_KEY, JSON.stringify(saved));
    } catch(e) {}
}

function updateFullDraftReviewButton() {
    if (!D.fullDraftReviewBtn || !D.draftArea) return;
    const availableStage = state.stage === 7 || state.stage === 9;
    D.fullDraftReviewBtn.hidden = !availableStage;
    if (!availableStage) return;

    const words = _fullDraftWordCount(D.draftArea.value);
    const liveCoachAvailable = state.coachMode !== 'offline' && state.connected;
    D.fullDraftReviewBtn.disabled = words < 50 || !liveCoachAvailable || state.waiting;
    const reason = words < 50
        ? 'Añade al menos 50 palabras · Add at least 50 words'
        : !liveCoachAvailable
            ? 'Activa el Coach IA · Turn on Live AI'
            : state.waiting
                ? 'El coach está respondiendo · The coach is responding'
                : 'Una revisión completa y enfocada · One focused full-draft review';
    D.fullDraftReviewBtn.title = reason;
    D.fullDraftReviewBtn.setAttribute('aria-label',
        words < 50 ? 'Revisar borrador — añade al menos 50 palabras · Review draft — add at least 50 words'
                   : 'Revisar el borrador completo · Review full draft');
}

function _fullDraftWordGuidance(words) {
    if (words > 3000) {
        return {
            cls: 'full-review-length--very-long',
            html: '<strong><span class="show-es">Borrador extenso.</span><span class="lang-sep"> · </span><span class="show-en">Extended draft.</span></strong> ' +
                  '<span class="show-es">Puedes revisarlo completo. Para observaciones más precisas, elige un solo lente; después puedes trabajar un pasaje.</span>' +
                  '<span class="lang-sep"> / </span><span class="show-en">You can review it in full. For more precise feedback, choose one lens; you can work with a passage afterward.</span>'
        };
    }
    if (words > 2000) {
        return {
            cls: 'full-review-length--long',
            html: '<strong><span class="show-es">Lectura amplia.</span><span class="lang-sep"> · </span><span class="show-en">Wide-angle reading.</span></strong> ' +
                  '<span class="show-es">Este largo está bien. Un solo lente ayudará al coach a priorizar.</span>' +
                  '<span class="lang-sep"> / </span><span class="show-en">This length is fine. One lens will help the coach prioritize.</span>'
        };
    }
    return {
        cls: 'full-review-length--comfortable',
        html: '<span class="show-es">Este borrador tiene un largo cómodo para una revisión completa y enfocada.</span>' +
              '<span class="lang-sep"> / </span><span class="show-en">This draft is a comfortable length for one focused whole-draft review.</span>'
    };
}

let _fullReviewLastFocus = null;

function closeFullDraftReview() {
    const modal = document.getElementById('fullDraftReviewModal');
    if (!modal) return;
    if (_councilActive) {
        _councilActive.cancelled = true;
        _councilActive = null;
        logProcessEvent('council_run_aborted', 'Student closed the review dialog while the Review Council was reading.');
    }
    modal.remove();
    document.removeEventListener('keydown', _fullReviewKeydown);
    if (_fullReviewLastFocus && typeof _fullReviewLastFocus.focus === 'function') {
        _fullReviewLastFocus.focus();
    }
    _fullReviewLastFocus = null;
}

function _fullReviewKeydown(event) {
    const modal = document.getElementById('fullDraftReviewModal');
    if (!modal) return;
    if (event.key === 'Escape') {
        event.preventDefault();
        closeFullDraftReview();
    } else if (event.key === 'Tab') {
        const focusable = getDialogFocusables(modal);
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (!first) {
            event.preventDefault();
        } else if (!modal.contains(document.activeElement)) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
        } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
}

function _updateFullDraftSubmitState(modal, sameDraft, needsPurpose) {
    const lens = modal.querySelector('input[name="fullReviewLens"]:checked');
    const purpose = modal.querySelector('#fullReviewPurpose');
    const override = modal.querySelector('#fullReviewSameDraftOverride');
    const validPurpose = !needsPurpose || (purpose && purpose.value.trim().length >= 8);
    const validOverride = !sameDraft || (override && override.checked);
    const submit = modal.querySelector('#fullReviewSubmit');
    if (submit) submit.disabled = !lens || !validPurpose || !validOverride || state.waiting;
}

function openFullDraftReview() {
    if (state.stage !== 7 && state.stage !== 9) return;
    const draft = D.draftArea.value.trim();
    const words = _fullDraftWordCount(draft);
    if (words < 50) {
        addSys('Añade al menos 50 palabras antes de pedir una lectura del borrador completo.\nAdd at least 50 words before requesting a whole-draft reading.');
        return;
    }
    if (state.coachMode === 'offline' || !state.connected) {
        addSys('Activa el Coach IA o la IA local para revisar el borrador completo.\nTurn on Live AI or Local AI to review the full draft.');
        return;
    }

    closeFullDraftReview();
    const reviews = _getFullDraftReviews();
    const signature = _fullDraftSignature(draft);
    const sameDraft = reviews.some(review => review.signature === signature);
    const needsPurpose = reviews.length > 0;
    const guidance = _fullDraftWordGuidance(words);
    const recommendedLens = state.stage === 9 ? 'audit' : '';
    _fullReviewLastFocus = document.activeElement;

    const lensCards = Object.entries(FULL_DRAFT_LENSES).map(([key, lens]) => `
        <label class="full-review-lens">
            <input type="radio" name="fullReviewLens" value="${key}" ${key === recommendedLens ? 'data-recommended="true"' : ''}>
            <span class="full-review-lens-copy">
                <strong><span class="show-es">${escapeHtml(lens.es)}</span><span class="lang-sep"> · </span><span class="show-en">${escapeHtml(lens.en)}</span></strong>
                <small><span class="show-es">${escapeHtml(lens.descEs)}</span><span class="lang-sep"> / </span><span class="show-en">${escapeHtml(lens.descEn)}</span></small>
            </span>
            ${key === recommendedLens ? '<span class="full-review-recommended"><span class="show-es">Sugerido ahora</span><span class="lang-sep"> · </span><span class="show-en">Suggested now</span></span>' : ''}
        </label>`).join('');

    const modal = document.createElement('div');
    modal.id = 'fullDraftReviewModal';
    modal.className = 'toolkit-modal-bg full-review-modal-bg';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'fullReviewTitle');
    modal.innerHTML = `
        <div class="toolkit-modal-card full-review-modal-card">
            <div class="toolkit-modal-top full-review-modal-top">
                <div>
                    <p class="full-review-eyebrow"><span class="show-es">Lectura de texto completo</span><span class="lang-sep"> · </span><span class="show-en">Whole-draft reading</span></p>
                    <h2 class="toolkit-modal-title" id="fullReviewTitle"><span class="show-es">¿Qué necesitas ver con más claridad?</span><span class="lang-sep"> · </span><span class="show-en">What do you need to see more clearly?</span></h2>
                </div>
                <button type="button" class="toolkit-close" id="fullReviewClose" aria-label="Cerrar · Close">×</button>
            </div>
            <p class="full-review-intro"><span class="show-es">El coach leerá las <strong>${words.toLocaleString()}</strong> palabras completas y responderá con prioridades, no con una reescritura.</span><span class="lang-sep"> / </span><span class="show-en">The coach will read all <strong>${words.toLocaleString()}</strong> words and respond with priorities—not a rewrite.</span></p>
            <div class="full-review-privacy" role="note">
                <span class="show-es">Al elegir “Revisar este borrador”, las <strong>${words.toLocaleString()}</strong> palabras completas se enviarán al Coach IA para esta lectura. Tu Pana no guarda el borrador ni la respuesta en un servidor.</span>
                <span class="lang-sep"> · </span>
                <span class="show-en">When you choose “Review this draft,” all <strong>${words.toLocaleString()}</strong> words will be sent to the Live AI coach for this reading. Tu Pana does not store the draft or response on a server.</span>
            </div>
            <div class="full-review-length ${guidance.cls}">${guidance.html}</div>
            ${reviews.length >= 2 ? `
                <div class="full-review-notice">
                    <strong><span class="show-es">Ya tienes varias perspectivas generales.</span><span class="lang-sep"> · </span><span class="show-en">You already have several wide-angle perspectives.</span></strong>
                    <span class="show-es"> La revisión de un pasaje puede ser más útil ahora. Si otra lectura completa tiene un propósito específico, puedes continuar.</span>
                    <span class="lang-sep"> / </span><span class="show-en"> Passage review may be more useful now. If another full reading has a specific purpose, you can continue.</span>
                </div>` : ''}
            ${sameDraft ? `
                <div class="full-review-notice full-review-notice--same">
                    <strong><span class="show-es">Este borrador no ha cambiado desde una revisión anterior.</span><span class="lang-sep"> · </span><span class="show-en">This draft has not changed since an earlier review.</span></strong>
                    <span class="show-es"> Puedes pedir otro lente si eso es lo que necesitas.</span>
                    <span class="lang-sep"> / </span><span class="show-en"> You can request another lens if that is what you need.</span>
                </div>` : ''}
            <fieldset class="full-review-fieldset">
                <legend><span class="show-es">Elige un lente</span><span class="lang-sep"> · </span><span class="show-en">Choose one lens</span></legend>
                <div class="full-review-lens-grid">${lensCards}</div>
            </fieldset>
            ${needsPurpose ? `
                <label class="full-review-purpose-label" for="fullReviewPurpose">
                    <strong><span class="show-es">¿Qué cambió o qué debe examinar el coach ahora?</span><span class="lang-sep"> · </span><span class="show-en">What changed, or what should the coach inspect now?</span></strong>
                    <textarea id="fullReviewPurpose" rows="3" maxlength="500" placeholder="Ej.: Reorganicé los párrafos 2–4; verifica si la transición ahora funciona. / E.g., I reorganized paragraphs 2–4; check whether the transition now works."></textarea>
                    <small><span class="show-es">Una frase basta. Esto hace que la nueva lectura tenga un propósito distinto.</span><span class="lang-sep"> / </span><span class="show-en">One sentence is enough. This gives the new reading a distinct purpose.</span></small>
                </label>` : ''}
            ${sameDraft ? `
                <label class="full-review-override">
                    <input type="checkbox" id="fullReviewSameDraftOverride">
                    <span><span class="show-es">Quiero otro lente sobre este borrador sin cambios.</span><span class="lang-sep"> · </span><span class="show-en">I want a different lens on this unchanged draft.</span></span>
                </label>` : ''}
            <div class="full-review-actions">
                <button type="button" class="full-review-passage-btn" id="fullReviewPassage"><span class="show-es">Trabajar un pasaje</span><span class="lang-sep"> · </span><span class="show-en">Work with a passage</span></button>
                <button type="button" class="full-review-submit" id="fullReviewSubmit" disabled><span class="show-es">Revisar este borrador</span><span class="lang-sep"> · </span><span class="show-en">Review this draft</span></button>
            </div>
            ${_councilOfferHtml(words, signature)}
        </div>`;
    document.body.appendChild(modal);

    modal.addEventListener('click', event => {
        if (event.target === modal) closeFullDraftReview();
    });
    modal.querySelector('#fullReviewClose').addEventListener('click', closeFullDraftReview);
    modal.querySelector('#fullReviewPassage').addEventListener('click', () => {
        closeFullDraftReview();
        if (window.innerWidth <= 480) switchMobileTab('draft');
        D.draftArea.focus();
        addSys('Selecciona el pasaje que quieres trabajar y elige una acción breve.\nSelect the passage you want to work with and choose a focused action.');
    });
    modal.querySelectorAll('input[name="fullReviewLens"]').forEach(input => {
        input.addEventListener('change', () => _updateFullDraftSubmitState(modal, sameDraft, needsPurpose));
    });
    modal.querySelector('#fullReviewPurpose')?.addEventListener('input', () =>
        _updateFullDraftSubmitState(modal, sameDraft, needsPurpose));
    modal.querySelector('#fullReviewSameDraftOverride')?.addEventListener('change', () =>
        _updateFullDraftSubmitState(modal, sameDraft, needsPurpose));
    modal.querySelector('#fullReviewSubmit').addEventListener('click', () =>
        submitFullDraftReview({ modal, draft, words, signature, needsPurpose }));
    _wireCouncilOffer(modal, { draft, words, signature });

    document.addEventListener('keydown', _fullReviewKeydown);
    setTimeout(() => modal.querySelector('input[name="fullReviewLens"]')?.focus(), 0);
}

async function submitFullDraftReview({ modal, draft, words, signature, needsPurpose }) {
    const selected = modal.querySelector('input[name="fullReviewLens"]:checked');
    if (!selected || state.waiting) return;
    const lensKey = selected.value;
    const lens = FULL_DRAFT_LENSES[lensKey];
    if (!lens) return;
    const purpose = needsPurpose
        ? (modal.querySelector('#fullReviewPurpose')?.value || '').trim()
        : 'First whole-draft review with this lens.';
    const layer = typeof getAssignmentLayer === 'function' ? getAssignmentLayer(state.assignmentId) : null;
    const assignmentName = layer?.name || getActiveTemplate()?.templateName || 'Mixed-Genre Autobiographical Essay';
    const stageLabel = stLabel(state.stage);
    const prompt =
        '[FULL-DRAFT REVIEW]\n' +
        `Assignment or genre: ${assignmentName}\n` +
        `Stage: ${state.stage} — ${stageLabel?.en || ''}\n` +
        `Selected lens: ${lens.en}\n` +
        `Student purpose for this reading: ${purpose}\n` +
        `Draft word count: ${words}\n\n` +
        '[STUDENT DRAFT — READ ALL OF IT BEFORE RESPONDING]\n' +
        draft +
        '\n[END STUDENT DRAFT]\n\n' +
        'MANDATORY WHOLE-DRAFT REVIEW CONTRACT:\n' +
        '- Read the entire draft before diagnosing any part. Later paragraphs may develop, qualify, or answer something introduced earlier.\n' +
        '- Apply the active assignment/genre and current-stage rules already provided in the Tu Pana system prompt. Do not import expectations from another genre.\n' +
        `- Lens instruction: ${lens.instruction}\n` +
        '- Do not rewrite, line-edit, or produce replacement prose. Do not add facts, experiences, evidence, sources, or language the student did not provide.\n' +
        '- Ground every important observation in an exact anchor from the student’s draft (a short quotation or a precise paragraph/location reference).\n' +
        '- Never request information that appears elsewhere in the draft. If an element is present but poorly connected, name the connection problem accurately.\n' +
        '- Prioritize. Do not turn the response into a line-by-line inventory.\n\n' +
        'Use exactly these four labeled sections in the current interface language:\n' +
        '1. CURRENT MOVEMENT — map what the draft currently does in 2–3 sentences.\n' +
        '2. TWO STRENGTHS — two specific strengths, each with a draft anchor and its effect.\n' +
        '3. PRIORITY REVISIONS — at most three high-impact priorities. For each: location, effect on the reader, and one revision route the student can carry out.\n' +
        '4. BEST NEXT ACTION — one concrete action the student should do next.\n' +
        'End after BEST NEXT ACTION. Do not add a rewritten model paragraph.';

    const visiblePurpose = needsPurpose ? `\n${_passageExcerpt(purpose, 180)}` : '';
    const displayMessage = `Full-draft review · ${lens.es} / ${lens.en}\n${words.toLocaleString()} words${visiblePurpose}`;
    modal.querySelector('#fullReviewSubmit').disabled = true;
    closeFullDraftReview();
    if (window.innerWidth <= 480) switchMobileTab('chat');
    logProcessEvent('full_draft_review_requested',
        `Student requested a ${lensKey} whole-draft review at Stage ${state.stage} (${words} words).`);
    const outcome = await sendCoachMessage({
        message: prompt,
        displayMessage,
        stageId: getStageId(state.stage),
        requestKind: 'full_draft_review'
    });
    if (outcome?.ok) {
        _saveFullDraftReview({
            timestamp: new Date().toISOString(),
            stage: state.stage,
            lens: lensKey,
            wordCount: words,
            signature,
            purpose: needsPurpose ? purpose.slice(0, 500) : ''
        });
        logProcessEvent('full_draft_review_completed',
            `Coach completed a ${lensKey} whole-draft review at Stage ${state.stage} (${words} words).`);
    }
    updateFullDraftReviewButton();
}

// ════════════════════════════════════════════════════════
//  REVIEW COUNCIL — UI (C2)
//  Three specialist perspectives + one synthesized, capped report, launched
//  from the shared Review-draft dialog. Kernel logic lives in council.js;
//  this section only renders, wires decisions, and injects the provider call.
//  Availability: Live AI (gemini) mode + an enabled Council genre profile.
// ════════════════════════════════════════════════════════
let _councilActive = null;   // { cancelled } while a run is in flight

function _councilProjectId() {
    return _fullDraftProjectId();
}

function _councilLastRun() {
    const runs = loadCouncilRuns(_councilProjectId());
    return runs.length ? runs[runs.length - 1] : null;
}

const _COUNCIL_ROLE_LABELS = {
    structure: { es: 'Estructura', en: 'Structure' },
    evidence:  { es: 'Evidencia',  en: 'Evidence' },
    voice:     { es: 'Voz',        en: 'Voice' }
};

function _councilOfferHtml(words, signature) {
    if (state.coachMode !== 'gemini') return '';
    const profile = getCouncilProfile(state.assignmentId || null);
    if (!profile) return '';
    const last = _councilLastRun();
    const sameCouncil = !!(last && last.draftSignature === signature);
    return `
        <div class="council-offer" id="councilOffer">
            <div class="council-offer-head">
                <strong><span class="show-es">Consejo de revisión</span><span class="lang-sep"> · </span><span class="show-en">Review Council</span></strong>
                <span class="council-offer-sub"><span class="show-es">Tres perspectivas — estructura, evidencia y voz — más una síntesis priorizada.</span><span class="lang-sep"> / </span><span class="show-en">Three perspectives — structure, evidence, and voice — plus one prioritized synthesis.</span></span>
            </div>
            <div class="council-disclosure" role="note">
                <span class="show-es">Si convocas al consejo, tu borrador completo (<strong>${words.toLocaleString()}</strong> palabras) se enviará al Coach IA <strong>tres veces</strong> — una por perspectiva — y las observaciones validadas se enviarán una vez más para la síntesis. Tu Pana no guarda tu borrador ni las respuestas en un servidor.</span>
                <span class="lang-sep"> · </span>
                <span class="show-en">If you convene the Council, your complete draft (<strong>${words.toLocaleString()}</strong> words) will be sent to the Live AI coach <strong>three times</strong> — once per perspective — and the validated observations will be sent once more for the synthesis. Tu Pana does not store your draft or the responses on a server.</span>
            </div>
            ${sameCouncil ? `
                <label class="council-same-draft">
                    <input type="checkbox" id="councilSameDraftOverride">
                    <span><span class="show-es">Este borrador no ha cambiado desde el último consejo. Quiero convocarlo de nuevo de todos modos.</span><span class="lang-sep"> · </span><span class="show-en">This draft has not changed since the last Council. I want to convene it again anyway.</span></span>
                </label>` : ''}
            <div class="council-offer-actions">
                ${last ? `<button type="button" class="council-view-last" id="councilViewLast"><span class="show-es">Ver último informe</span><span class="lang-sep"> · </span><span class="show-en">View last report</span></button>` : ''}
                <button type="button" class="council-launch" id="councilLaunch" ${sameCouncil ? 'disabled' : ''}><span class="show-es">Convocar al consejo</span><span class="lang-sep"> · </span><span class="show-en">Convene the Council</span></button>
            </div>
        </div>`;
}

function _wireCouncilOffer(modal, ctx) {
    const launch = modal.querySelector('#councilLaunch');
    if (!launch) return;
    const override = modal.querySelector('#councilSameDraftOverride');
    if (override) {
        override.addEventListener('change', () => { launch.disabled = !override.checked; });
    }
    launch.addEventListener('click', () => launchCouncilRun(modal, ctx));
    modal.querySelector('#councilViewLast')?.addEventListener('click', () => {
        const last = _councilLastRun();
        if (last) _renderCouncilReport(modal, last, { stale: last.draftSignature !== ctx.signature });
    });
}

function _councilCard(modal) {
    return modal.querySelector('.full-review-modal-card');
}

function _renderCouncilProgress(modal, words) {
    const card = _councilCard(modal);
    if (!card) return;
    const chips = Object.entries(_COUNCIL_ROLE_LABELS).map(([key, l]) => `
        <div class="council-chip" id="councilChip-${key}" data-status="reading">
            <span class="council-chip-name"><span class="show-es">${l.es}</span><span class="lang-sep"> · </span><span class="show-en">${l.en}</span></span>
            <span class="council-chip-status"><span class="show-es">leyendo…</span><span class="lang-sep"> · </span><span class="show-en">reading…</span></span>
        </div>`).join('');
    card.innerHTML = `
        <div class="toolkit-modal-top full-review-modal-top">
            <div>
                <p class="full-review-eyebrow"><span class="show-es">Consejo de revisión</span><span class="lang-sep"> · </span><span class="show-en">Review Council</span></p>
                <h2 class="toolkit-modal-title" id="fullReviewTitle"><span class="show-es">El consejo está leyendo tu borrador</span><span class="lang-sep"> · </span><span class="show-en">The Council is reading your draft</span></h2>
            </div>
            <button type="button" class="toolkit-close" id="fullReviewClose" aria-label="Cerrar · Close">×</button>
        </div>
        <p class="council-progress-note" role="status"><span class="show-es">Tres lecturas independientes de tus <strong>${words.toLocaleString()}</strong> palabras, después una síntesis. Suele tardar menos de un minuto.</span><span class="lang-sep"> / </span><span class="show-en">Three independent readings of your <strong>${words.toLocaleString()}</strong> words, then one synthesis. This usually takes under a minute.</span></p>
        <div class="council-chips">${chips}</div>
        <div class="council-synthesis-row" id="councilSynthesisRow" hidden>
            <span class="show-es">Sintetizando las observaciones validadas…</span><span class="lang-sep"> · </span><span class="show-en">Synthesizing the validated observations…</span>
        </div>
        <div class="council-progress-actions">
            <button type="button" class="council-cancel" id="councilCancel"><span class="show-es">Cancelar</span><span class="lang-sep"> · </span><span class="show-en">Cancel</span></button>
        </div>`;
    card.querySelector('#fullReviewClose').addEventListener('click', closeFullDraftReview);
    card.querySelector('#councilCancel').addEventListener('click', () => {
        if (_councilActive) { _councilActive.cancelled = true; _councilActive = null; }
        logProcessEvent('council_run_aborted', 'Student cancelled the Review Council while it was reading.');
        closeFullDraftReview();
    });
    setTimeout(() => card.querySelector('#councilCancel')?.focus(), 0);
}

function _setCouncilChip(modal, roleKey, status) {
    const chip = modal.querySelector(`#councilChip-${roleKey}`);
    if (!chip) return;
    chip.dataset.status = status;
    const label = chip.querySelector('.council-chip-status');
    if (!label) return;
    label.innerHTML = status === 'done'
        ? '<span class="show-es">lectura completa</span><span class="lang-sep"> · </span><span class="show-en">reading complete</span>'
        : status === 'failed'
            ? '<span class="show-es">no disponible</span><span class="lang-sep"> · </span><span class="show-en">unavailable</span>'
            : '<span class="show-es">leyendo…</span><span class="lang-sep"> · </span><span class="show-en">reading…</span>';
}

function _councilRoleFromPrompt(prompt) {
    if (/YOUR ROLE — Structure/.test(prompt)) return 'structure';
    if (/YOUR ROLE — Evidence/.test(prompt)) return 'evidence';
    if (/YOUR ROLE — Voice/.test(prompt)) return 'voice';
    return null;
}

async function launchCouncilRun(modal, { draft, words, signature }) {
    if (_councilActive) return;
    const token = { cancelled: false };
    _councilActive = token;
    maybeShowFirstAiSendCue();
    logProcessEvent('council_run_requested',
        `Student convened the Review Council at Stage ${state.stage} (${words} words).`);
    _renderCouncilProgress(modal, words);

    const callFn = async ({ prompt, requestKind }) => {
        const roleKey = requestKind === 'council_reviewer' ? _councilRoleFromPrompt(prompt) : null;
        if (requestKind === 'council_synthesis') {
            const row = modal.querySelector('#councilSynthesisRow');
            if (row) row.hidden = false;
        }
        try {
            const reply = await generateCoachResponse({
                prompt,
                stageId: getStageId(state.stage),
                requestKind
            });
            if (roleKey && !token.cancelled) _setCouncilChip(modal, roleKey, 'done');
            if (!reply) throw new Error('empty council reply');
            return reply;
        } catch (err) {
            if (roleKey && !token.cancelled) _setCouncilChip(modal, roleKey, 'failed');
            throw err;
        }
    };

    let result = null;
    try {
        result = await runCouncilKernel({
            draftText: draft,
            assignmentId: state.assignmentId || null,
            stage: state.stage,
            langLabel: getCurrentCoachLanguageLabel(),
            callFn
        });
    } catch (err) {
        console.error('council:run', err);
        result = { status: 'aborted', reason: 'unexpected-error' };
    }
    if (token.cancelled) return;   // modal closed or cancelled; event already logged
    _councilActive = null;

    if (!result || result.status === 'blocked' || result.status === 'aborted') {
        const reason = result?.reason || 'unknown';
        logProcessEvent('council_run_aborted', `Review Council run did not complete (${reason}).`);
        _renderCouncilAbort(modal, reason);
        return;
    }

    const record = saveCouncilRun(_councilProjectId(), { ...result, draftSignature: signature });
    logProcessEvent('council_run_completed',
        `Review Council ${result.status} at Stage ${state.stage}: ${result.report.priorities.length} priorities, ${result.report.secondary.length} secondary, ${result.report.preserve.length} preserve notes.`);
    _renderCouncilReport(modal, record || { ...result, id: null, decisions: {}, draftSignature: signature }, { stale: false });
}

function _renderCouncilAbort(modal, reason) {
    const card = _councilCard(modal);
    if (!card) return;
    const message = reason === 'too-few-reviewers'
        ? '<span class="show-es">El consejo no pudo completar suficientes lecturas. Tu borrador no cambió y no se guardó nada. Puedes intentarlo de nuevo o usar una revisión de un solo lente.</span><span class="lang-sep"> / </span><span class="show-en">The Council could not complete enough readings. Your draft is unchanged and nothing was saved. You can try again or use a single-lens review.</span>'
        : '<span class="show-es">El consejo no pudo terminar esta vez. Tu borrador no cambió y no se guardó nada. Puedes intentarlo de nuevo en un momento.</span><span class="lang-sep"> / </span><span class="show-en">The Council could not finish this time. Your draft is unchanged and nothing was saved. You can try again in a moment.</span>';
    card.innerHTML = `
        <div class="toolkit-modal-top full-review-modal-top">
            <div>
                <p class="full-review-eyebrow"><span class="show-es">Consejo de revisión</span><span class="lang-sep"> · </span><span class="show-en">Review Council</span></p>
                <h2 class="toolkit-modal-title" id="fullReviewTitle"><span class="show-es">El consejo no pudo completar la lectura</span><span class="lang-sep"> · </span><span class="show-en">The Council could not complete its reading</span></h2>
            </div>
            <button type="button" class="toolkit-close" id="fullReviewClose" aria-label="Cerrar · Close">×</button>
        </div>
        <div class="council-abort-note" role="alert">${message}</div>
        <div class="council-progress-actions">
            <button type="button" class="council-cancel" id="councilAbortClose"><span class="show-es">Volver a escribir</span><span class="lang-sep"> · </span><span class="show-en">Return to writing</span></button>
        </div>`;
    card.querySelector('#fullReviewClose').addEventListener('click', closeFullDraftReview);
    card.querySelector('#councilAbortClose').addEventListener('click', closeFullDraftReview);
    setTimeout(() => card.querySelector('#councilAbortClose')?.focus(), 0);
}

const _COUNCIL_DECISIONS = [
    { key: 'accepted', es: 'Aceptar',         en: 'Accept' },
    { key: 'adapted',  es: 'Adaptar',         en: 'Adapt' },
    { key: 'rejected', es: 'Rechazar',        en: 'Reject' },
    { key: 'deferred', es: 'Decidir después', en: 'Decide later' }
];

function _councilRolesLine(roles, corroborated) {
    const names = (roles || []).map(r => {
        const l = _COUNCIL_ROLE_LABELS[r];
        return l ? `${l.es} · ${l.en}` : r;
    }).join(' + ');
    return corroborated
        ? `<span class="council-corroboration" title="Más de una perspectiva señaló esto · More than one perspective flagged this">✓✓ ${escapeHtml(names)}</span>`
        : `<span class="council-single-role">${escapeHtml(names)}</span>`;
}

function _councilFindingHtml(finding, key, decisions) {
    const chosen = decisions && decisions[key] ? decisions[key].decision : null;
    const buttons = _COUNCIL_DECISIONS.map(d => `
        <button type="button" class="council-decision-btn${chosen === d.key ? ' council-decision-btn--chosen' : ''}"
                data-finding="${key}" data-decision="${d.key}" aria-pressed="${chosen === d.key}">
            <span class="show-es">${d.es}</span><span class="lang-sep"> · </span><span class="show-en">${d.en}</span>
        </button>`).join('');
    return `
        <div class="council-finding" data-finding-key="${key}">
            <div class="council-finding-head">
                <span class="council-dimension">${escapeHtml(finding.dimension)}</span>
                ${_councilRolesLine(finding.roles, finding.corroborated)}
                ${finding.confidence === 'low' ? '<span class="council-low-confidence"><span class="show-es">lectura tentativa</span><span class="lang-sep"> · </span><span class="show-en">tentative reading</span></span>' : ''}
            </div>
            <p class="council-claim">${escapeHtml(finding.claim)}</p>
            <blockquote class="council-quote">“${escapeHtml(finding.evidenceQuote)}”</blockquote>
            ${finding.whyItMatters ? `<p class="council-why">${escapeHtml(finding.whyItMatters)}</p>` : ''}
            ${finding.revisionMove ? `<p class="council-move"><strong><span class="show-es">Estrategia sugerida:</span><span class="lang-sep"> · </span><span class="show-en">Suggested strategy:</span></strong> ${escapeHtml(finding.revisionMove)}</p>` : ''}
            ${finding.voiceNote ? `<p class="council-voice-note" role="note"><strong><span class="show-es">Protege tu voz:</span><span class="lang-sep"> · </span><span class="show-en">Protect your voice:</span></strong> ${escapeHtml(finding.voiceNote)}</p>` : ''}
            <div class="council-decisions" role="group" aria-label="Tu decisión sobre esta observación · Your decision on this finding">${buttons}</div>
        </div>`;
}

function _renderCouncilReport(modal, record, { stale }) {
    const card = _councilCard(modal);
    if (!card) return;
    const report = record.report || { priorities: [], secondary: [], preserve: [], disagreements: [], summary: '' };
    const failed = (record.reviewers || []).filter(r => r.status !== 'ok').map(r => {
        const l = _COUNCIL_ROLE_LABELS[r.roleKey];
        return l ? `${l.es} · ${l.en}` : r.roleKey;
    });
    const priorities = report.priorities.map((f, i) => _councilFindingHtml(f, `p${i + 1}`, record.decisions)).join('');
    const secondary = report.secondary.map((f, i) => _councilFindingHtml(f, `s${i + 1}`, record.decisions)).join('');
    const preserve = report.preserve.map(p => `
        <div class="council-preserve-item">
            <blockquote class="council-quote">“${escapeHtml(p.quote)}”</blockquote>
            ${p.why ? `<p>${escapeHtml(p.why)}</p>` : ''}
        </div>`).join('');
    const disagreements = report.disagreements.map(d => `
        <div class="council-disagreement">
            <p class="council-disagreement-q">${escapeHtml(d.question)}</p>
            ${(d.positions || []).map(p => `<p class="council-disagreement-pos">— ${escapeHtml(p)}</p>`).join('')}
        </div>`).join('');
    const empty = !report.priorities.length && !report.secondary.length && !report.preserve.length;

    card.innerHTML = `
        <div class="toolkit-modal-top full-review-modal-top">
            <div>
                <p class="full-review-eyebrow"><span class="show-es">Consejo de revisión</span><span class="lang-sep"> · </span><span class="show-en">Review Council</span></p>
                <h2 class="toolkit-modal-title" id="fullReviewTitle"><span class="show-es">Informe del consejo</span><span class="lang-sep"> · </span><span class="show-en">Council report</span></h2>
            </div>
            <button type="button" class="toolkit-close" id="fullReviewClose" aria-label="Cerrar · Close">×</button>
        </div>
        ${stale ? `
            <div class="council-stale-note" role="note">
                <span class="show-es">Este informe corresponde a una versión anterior de tu borrador.</span>
                <span class="lang-sep"> · </span>
                <span class="show-en">This report is from an earlier version of your draft.</span>
            </div>` : ''}
        ${failed.length ? `
            <div class="council-partial-note" role="note">
                <span class="show-es">${failed.length === 1 ? 'Una perspectiva no estuvo disponible' : 'Perspectivas no disponibles'}: ${escapeHtml(failed.join(', '))}. El informe se basa en las lecturas completadas.</span>
                <span class="lang-sep"> / </span>
                <span class="show-en">${failed.length === 1 ? 'One perspective was unavailable' : 'Unavailable perspectives'}: ${escapeHtml(failed.join(', '))}. The report is based on the completed readings.</span>
            </div>` : ''}
        ${report.summary ? `<p class="council-summary">${escapeHtml(report.summary)}</p>` : ''}
        ${empty ? `
            <div class="council-empty-note" role="note">
                <span class="show-es">El consejo no encontró problemas prioritarios en sus mandatos. Eso también es información: tu borrador sostiene esta lectura.</span>
                <span class="lang-sep"> / </span>
                <span class="show-en">The Council found no priority problems within its mandates. That is information too: your draft holds up to this reading.</span>
            </div>` : ''}
        ${preserve ? `
            <section class="council-section council-section--preserve">
                <h3><span class="show-es">Lo que ya funciona — protégelo</span><span class="lang-sep"> · </span><span class="show-en">What is working — protect it</span></h3>
                ${preserve}
            </section>` : ''}
        ${priorities ? `
            <section class="council-section">
                <h3><span class="show-es">Revisa primero</span><span class="lang-sep"> · </span><span class="show-en">Fix first</span></h3>
                ${priorities}
            </section>` : ''}
        ${secondary ? `
            <details class="council-secondary">
                <summary><span class="show-es">Observaciones adicionales (${report.secondary.length})</span><span class="lang-sep"> · </span><span class="show-en">Additional observations (${report.secondary.length})</span></summary>
                ${secondary}
            </details>` : ''}
        ${disagreements ? `
            <section class="council-section council-section--disagreement">
                <h3><span class="show-es">Tu decisión — el consejo no coincide</span><span class="lang-sep"> · </span><span class="show-en">Your call — the Council does not agree</span></h3>
                ${disagreements}
            </section>` : ''}
        <div class="council-report-actions">
            <button type="button" class="council-return" id="councilReturn"><span class="show-es">Volver a escribir</span><span class="lang-sep"> · </span><span class="show-en">Return to writing</span></button>
        </div>`;

    card.querySelector('#fullReviewClose').addEventListener('click', closeFullDraftReview);
    card.querySelector('#councilReturn').addEventListener('click', () => {
        closeFullDraftReview();
        if (window.innerWidth <= 480) switchMobileTab('draft');
        D.draftArea?.focus();
    });
    if (record.id) {
        card.querySelectorAll('.council-decision-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const findingKey = btn.dataset.finding;
                const decision = btn.dataset.decision;
                if (!recordCouncilDecision(_councilProjectId(), record.id, findingKey, decision)) return;
                record.decisions[findingKey] = { decision };
                logProcessEvent('council_decision_recorded',
                    `Student marked Council finding ${findingKey} as ${decision}.`);
                const group = btn.closest('.council-decisions');
                group.querySelectorAll('.council-decision-btn').forEach(b => {
                    const on = b === btn;
                    b.classList.toggle('council-decision-btn--chosen', on);
                    b.setAttribute('aria-pressed', String(on));
                });
            });
        });
    }
    setTimeout(() => card.querySelector('#fullReviewClose')?.focus(), 0);
}

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
//  STAGE SKILL UNLOCKING (Mi Toolkit — Phase 4)
//  Stage 6 is gated on executeSave(); all others unlock on stage entry.
//  STAGE_SKILL_DEFS is defined in data.js.
// ════════════════════════════════════════════════════════
function getAcquiredSkills() {
    try { return JSON.parse(localStorage.getItem('tupana_skills_acquired') || '[]'); } catch(e) { return []; }
}

function unlockStageSkill(stageNum) {
    if (!stageNum || typeof STAGE_SKILL_DEFS === 'undefined') return;
    const def = STAGE_SKILL_DEFS.find(s => s.stageNum === stageNum);
    if (!def) return;
    const acquired = getAcquiredSkills();
    if (acquired.includes(def.skillId)) return; // already unlocked — no toast
    acquired.push(def.skillId);
    try { localStorage.setItem('tupana_skills_acquired', JSON.stringify(acquired)); } catch(e) {}
    showSkillToast(def);
}

function showSkillToast(def) {
    document.querySelector('.skill-toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'skill-toast';
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML =
        `<span class="skill-toast-label"><span class="show-es">Nueva habilidad</span><span class="lang-sep"> · </span><span class="show-en">New skill</span></span>` +
        `<span class="skill-toast-text"><span class="show-es">${escapeHtml(def.labelEs)}</span><span class="lang-sep"> · </span><span class="show-en">${escapeHtml(def.labelEn)}</span></span>` +
        `<button class="skill-toast-dismiss" aria-label="Cerrar · Dismiss">×</button>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('skill-toast--visible')));
    let timer;
    let gone = false;
    function dismissToast() {
        if (gone) return;
        gone = true;
        clearTimeout(timer);
        toast.classList.remove('skill-toast--visible');
        setTimeout(() => toast.remove(), 500);
    }
    timer = setTimeout(dismissToast, 3800);
    toast.querySelector('.skill-toast-dismiss').addEventListener('click', dismissToast);
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
        const restoredWords = D.draftArea.value.trim().split(/\s+/).filter(Boolean).length;
        D.wordCount.innerHTML = restoredWords < 10 && state.stage === 6 && !state.draftSaved
            ? `<span class="show-es">${restoredWords}/10 palabras para guardar</span><span class="lang-sep"> · </span><span class="show-en">${restoredWords}/10 words to save</span>`
            : `<span class="show-es">${restoredWords} palabras</span><span class="lang-sep"> · </span><span class="show-en">${restoredWords} words</span>`;

        // Restore authorship gate UI state if first draft was saved
        if (localStorage.getItem('tupana_draft_saved') === 'true') {
            state.draftSaved = true;
            D.saveBtn.classList.add('saved');
            D.saveBtnLabel.textContent = 'Primer borrador guardado · First draft saved';
            D.savedNotice.classList.add('on');
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
const MANI_ORDER = ['languages', 'community', 'journey', 'positionality', 'story'];
let maniAwaitingNext  = false;
let maniJustClaimedKey = null;
let maniStandalone = false;

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

function updateProceedBtn() {
    const btn = document.getElementById('maniProceedBtn');
    if (!btn) return;
    const allClaimed  = maniClaimed === MANI_TOTAL;
    const hasSentence = maniPromptInput ? maniPromptInput.value.trim().length > 0 : false;
    btn.classList.toggle('on', allClaimed && hasSentence);
}

function updateManiCounter(count) {
    const counter = document.getElementById('maniCounter');
    const note    = document.getElementById('maniFreireNote');
    const card    = document.getElementById('maniCard');

    if (count === MANI_TOTAL) {
        counter.classList.add('all');
        counter.textContent = `All ${MANI_TOTAL} claimed · Las ${MANI_TOTAL} reclamadas`;
        note.classList.add('on');
        card.classList.add('all-claimed');
        try { localStorage.setItem('tupana_mani_done', 'true'); } catch(e) {}
    } else {
        counter.classList.remove('all');
        counter.textContent = `Asset ${count + 1} of ${MANI_TOTAL} · Recurso ${count + 1} de ${MANI_TOTAL}`;
        note.classList.remove('on');
        card.classList.remove('all-claimed');
    }

    counter.classList.remove('pulse');
    void counter.offsetWidth;
    counter.classList.add('pulse');
    setTimeout(() => counter.classList.remove('pulse'), 900);
    updateProceedBtn();
}

function updateManiAssetVisibility(claimed, focusActive = false) {
    const grid = document.getElementById('maniGrid');
    if (!grid) return;
    const nextKey = MANI_ORDER.find(k => !claimed.includes(k));
    grid.querySelectorAll('.mani-asset').forEach(el => {
        const key = el.getAttribute('data-asset');
        const isActive = key === nextKey;
        el.classList.toggle('mani-asset--active', isActive);
        el.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    const prompt = document.getElementById('maniPrompt');
    if (prompt) {
        prompt.classList.toggle('hidden', !!nextKey);
        if (!nextKey) {
            const _freireWrap = document.getElementById('maniFreireAudioWrap');
            if (_freireWrap && !_freireWrap.dataset.wired) {
                _freireWrap.dataset.wired = '1';
                const btn = _makeAudioBtn('assets/audio/es/03-mani-freire.mp3');
                if (btn) _freireWrap.appendChild(btn);
            }
        }
    }
    if (focusActive && nextKey) {
        const activeEl = grid.querySelector(`.mani-asset[data-asset="${nextKey}"]`);
        if (activeEl) activeEl.focus();
    }
}

function showClaimToast(assetKey) {
    const def = MANI_ASSET_DEFS[assetKey];
    if (!def) return;
    const toast = document.getElementById('maniClaimToast');
    toast.innerHTML = `<strong>You claimed ${def.nameEn} · Reclamaste ${def.nameEs}</strong><br>${def.toastEn}<br>${def.toastEs}`;
    toast.classList.add('on');
    setTimeout(() => toast.classList.remove('on'), 4800);
}

function claimAsset(el) {
    if (el.classList.contains('claimed')) return;
    const assetKey = el.getAttribute('data-asset');
    if (!assetKey) return;

    el.classList.add('claimed');
    el.setAttribute('aria-label', `${MANI_ASSET_DEFS[assetKey].nameEn}, claimed · ${MANI_ASSET_DEFS[assetKey].nameEs}, reclamado`);
    el.setAttribute('tabindex', '-1');

    const claimed = getClaimedAssets();
    if (!claimed.includes(assetKey)) {
        claimed.push(assetKey);
        saveClaimedAssets(claimed);
    }

    maniClaimed = claimed.length;
    maniAwaitingNext  = true;
    maniJustClaimedKey = assetKey;
    updateManiCounter(maniClaimed);

    const def = MANI_ASSET_DEFS[assetKey];
    const isLast  = maniClaimed === MANI_TOTAL;
    const btnLabel = isLast
        ? 'Continue to your sentence · Continúa con tu oración'
        : 'Next asset · Próximo recurso';

    const celebDiv = document.createElement('div');
    celebDiv.className = 'mani-asset-celebration';
    celebDiv.setAttribute('role', 'status');
    celebDiv.innerHTML =
        `<div class="mac-message">You claimed ${def.nameEn} · Reclamaste ${def.nameEs}</div>` +
        `<div class="mac-sub">${def.toastEn}<br><span style="opacity:0.85">${def.toastEs}</span></div>` +
        `<button class="mani-next-btn" type="button">${btnLabel}</button>`;
    el.appendChild(celebDiv);

    const nextBtn = celebDiv.querySelector('.mani-next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', e => { e.stopPropagation(); maniNextAsset(); });
        setTimeout(() => nextBtn.focus(), 80);
    }
}

function maniNextAsset() {
    maniAwaitingNext  = false;
    maniJustClaimedKey = null;
    // hide intro audio after first asset — narration is the same for all assets (sequence index 0 only)
    _stopOnboardingAudio();
    const _introWrap = document.getElementById('maniIntroAudioWrap');
    if (_introWrap) _introWrap.style.display = 'none';
    const grid = document.getElementById('maniGrid');
    if (grid) grid.querySelectorAll('.mani-asset-celebration').forEach(p => p.remove());
    updateManiAssetVisibility(getClaimedAssets(), true);
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
    updateManiAssetVisibility(claimed);
}

function handleManiKey(e) {
    if (e.target.tagName === 'BUTTON') return;
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        claimAsset(e.currentTarget);
    }
}

// ════════════════════════════════════════════════════════
//  REVIEW MODE (colleague/evaluator) — URL-scoped ONLY, never persisted.
//  ?review=colleague (canonical, published) or ?review=true (alias) marks the
//  session as a faculty/staff review session: a review-only pathway selector
//  (link hub over the existing ?assignment= boot path) plus a visible badge.
//  Normal student flow — bare links, assignment-specific links, the Stage B
//  first-run chooser — is untouched when the parameter is absent.
// ════════════════════════════════════════════════════════
function isReviewMode() {
    try {
        const params = new URLSearchParams(location.search);
        const v = params.get('review');
        return v === 'colleague' || v === 'true';
    } catch (e) { return false; }
}

// Visible review-mode badge — informational only (role=status, no pointer
// events, nothing stored). Rendered once at boot when isReviewMode().
function renderReviewBadge() {
    if (document.getElementById('reviewModeBadge')) return;
    const b = document.createElement('div');
    b.id = 'reviewModeBadge';
    b.setAttribute('role', 'status');
    b.setAttribute('aria-label', 'Modo de revisión para colegas · Colleague review mode');
    b.style.cssText = `
        position:fixed; left:12px; bottom:12px; z-index:950;
        pointer-events:none;
        background: var(--amber, #b8860b); color:#fff;
        font-family:'Source Sans 3',system-ui,sans-serif;
        font-size:0.72rem; font-weight:700; letter-spacing:0.04em;
        padding:5px 12px; border-radius:999px;
        box-shadow: var(--shadow-md, 0 2px 8px rgba(0,0,0,0.25));
    `;
    b.textContent = 'Modo de revisión · Review mode';
    document.body.appendChild(b);
}

// ════════════════════════════════════════════════════════
//  PROJECT SELECTOR (Stage B) — minimal genre/profile chooser
//  Regular-link access to a service-learning profile. Subtractive by design:
//  one short question + compact option cards, then it chains into the normal
//  landing → onboarding flow. Shown once on first run when no profile is active;
//  a deep link (?assignment=…) or a prior choice skips it (gated in app.js).
//  Bilingual labels (shown before the language step, so both are always visible).
//  REVIEW VARIANT: showProjectSelector(true) renders the colleague/evaluator
//  selector instead — getReviewProfiles() cards (incl. link-only layers) that
//  NAVIGATE to ?review=colleague&assignment=<id>, applying state through the
//  existing boot path. It mutates nothing and persists nothing itself. The
//  no-argument student call sites keep the original behavior byte-for-byte.
// ════════════════════════════════════════════════════════
function showProjectSelector(review) {
    const overlay = document.createElement('div');
    overlay.id = 'projectSelector';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:999;
        background: rgba(42,33,28,0.78);
        backdrop-filter: blur(14px) saturate(1.2);
        display:flex; align-items:center; justify-content:center;
        opacity:0; transition: opacity 0.6s ease;
        padding: 40px 24px; overflow-y:auto;
    `;

    const profiles = review
        ? ((typeof getReviewProfiles === 'function') ? getReviewProfiles() : [])
        : ((typeof getSelectableProfiles === 'function') ? getSelectableProfiles() : []);
    const card = (id, labelEs, labelEn, descEs, descEn) => `
        <button class="project-option" data-assign="${id}" style="
            display:block; width:100%; text-align:left; cursor:pointer;
            background: var(--bg-base); border: 1px solid var(--border-hi);
            border-radius: var(--radius-md); padding: 16px 18px; margin-bottom: 12px;
            transition: border-color 0.2s ease;
        " onmouseover="this.style.borderColor='var(--jade)'" onmouseout="this.style.borderColor='var(--border-hi)'">
            <div style="font-family:'Source Sans 3',system-ui,sans-serif; font-size:1.0rem; font-weight:600; color:var(--text-primary); margin-bottom:4px;">${labelEs} · ${labelEn}</div>
            <div style="font-family:'Source Sans 3',system-ui,sans-serif; font-size:0.8rem; color:var(--text-sub); line-height:1.4;">${descEs} · ${descEn}</div>
        </button>`;

    let cards = review
        ? card('__default__',
            'Ensayo autobiográfico de género mixto', 'Autobiographical Mixed-Genre Essay',
            'El camino base de Tu Pana: memoria, análisis y conocimiento comunitario.', 'Tu Pana’s base pathway: memory, analysis, and community knowledge.')
        : card('__default__',
            'Ensayo personal', 'Personal Essay',
            'Tu ensayo autobiográfico con Tu Pana.', 'Your Tu Pana autobiographical essay.');
    profiles.forEach(p => { cards += card(p.assignmentId, p.labelEs, p.labelEn, p.descEs, p.descEn); });

    const heading = review
        ? `<div style="font-family:'Source Sans 3',system-ui,sans-serif; font-size:1.2rem; font-weight:700; color:var(--text-primary); margin-bottom:4px;">Modo de revisión · Review mode</div>
           <div style="font-family:'Source Sans 3',system-ui,sans-serif; font-size:0.85rem; color:var(--text-sub); margin-bottom:10px;">Compara los caminos de escritura · Compare writing pathways</div>
           <div style="font-family:'Source Sans 3',system-ui,sans-serif; font-size:0.78rem; color:var(--text-sub); line-height:1.45; margin-bottom:18px; border-left:3px solid var(--amber, #b8860b); padding-left:10px;">Solo para colegas/evaluadores. No compartas este enlace con estudiantes durante Pilot 2.<br>For colleagues/evaluators only. Do not share this link with students during Pilot 2.</div>`
        : `<div style="font-family:'Source Sans 3',system-ui,sans-serif; font-size:1.2rem; font-weight:700; color:var(--text-primary); margin-bottom:4px;">Elige tu proyecto · Choose your project</div>
           <div style="font-family:'Source Sans 3',system-ui,sans-serif; font-size:0.85rem; color:var(--text-sub); margin-bottom:22px;">¿En qué vas a trabajar? · What are you working on?</div>`;

    overlay.innerHTML = `
        <div style="
            max-width:560px; width:100%;
            background: var(--bg-raised);
            border: 1px solid var(--border-hi);
            border-radius: var(--radius-lg);
            padding: 34px 34px 28px;
            box-shadow: var(--shadow-lg);
        ">
            ${heading}
            ${cards}
        </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    let _picked = false;
    overlay.querySelectorAll('.project-option').forEach(btn => {
        btn.addEventListener('click', () => {
            if (_picked) return;          // guard against double-tap (iOS Safari)
            _picked = true;
            const id = btn.getAttribute('data-assign');
            if (review) {
                // Link hub: navigate into the existing ?assignment= boot path.
                // No chooseProject, no state application here; review stays URL-scoped.
                const assign = (id === '__default__') ? 'generic' : id;
                location.href = location.pathname + '?review=colleague&assignment=' + encodeURIComponent(assign);
                return;
            }
            chooseProject(id === '__default__' ? null : id);
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.remove(); showLandingMoment(); }, 450);
        });
    });
    setTimeout(() => { const f = overlay.querySelector('.project-option'); if (f) f.focus(); }, 600);
}

// Records the student's project choice. Non-default ids set the active assignment
// layer (persisted via the existing tupana_assignment_id key); default clears any
// stale assignment so the app is the generic coach. tupana_project_chosen makes
// the selector idempotent across a mid-onboarding reload.
function chooseProject(assignmentId) {
    try { localStorage.setItem('tupana_project_chosen', 'true'); } catch(e) {}
    if (assignmentId && typeof getAssignmentLayer === 'function' && getAssignmentLayer(assignmentId)) {
        state.assignmentId = assignmentId;
        try { localStorage.setItem('tupana_assignment_id', assignmentId); } catch(e) {}
    } else {
        state.assignmentId = null;
        try { localStorage.removeItem('tupana_assignment_id'); } catch(e) {}
    }
    applyDraftPlaceholder();   // Stage B.1: reflect the chosen project in the draft placeholder
}

function showLandingMoment() {
    const overlay = document.createElement('div');
    overlay.id = 'landingMoment';
    overlay.className = 'welcome-bg';
    const langEsPressed   = state.lang === 'es'   ? 'true' : 'false';
    const langEnPressed   = state.lang === 'en'   ? 'true' : 'false';
    const langBothPressed = state.lang === 'both' ? 'true' : 'false';
    overlay.innerHTML = `
        <div class="welcome-card">
            <div class="welcome-topline">
                <span class="welcome-eyebrow"><span class="show-es">Tu espacio de escritura</span><span class="lang-sep"> · </span><span class="show-en">Your writing space</span></span>
                <div class="welcome-languages" role="group" aria-label="Idioma · Language">
                <button class="lang-btn" data-lang="es" onclick="setLang('es')" aria-pressed="${langEsPressed}">Español</button>
                <button class="lang-btn" data-lang="en" onclick="setLang('en')" aria-pressed="${langEnPressed}">English</button>
                <button class="lang-btn" data-lang="both" onclick="setLang('both')" aria-pressed="${langBothPressed}">ES–EN</button>
                </div>
            </div>

            <div class="welcome-copy">
                <h2><span class="show-es">Trae tus palabras. Conserva tu voz.</span><span class="lang-sep"> · </span><span class="show-en">Bring your words. Keep your voice.</span></h2>
                <p><span class="show-es">Tu Pana te ayuda a tomar decisiones de revisión. Tú haces la escritura.</span><span class="lang-sep"> · </span><span class="show-en">Tu Pana helps you make revision decisions. You do the writing.</span></p>
            </div>

            <ol class="welcome-steps" aria-label="Cómo funciona · How it works">
                <li><span class="welcome-step-num">1</span><span><strong><span class="show-es">Escribe</span><span class="lang-sep"> · </span><span class="show-en">Write</span></strong><small><span class="show-es">Empieza con tus propias palabras.</span><span class="lang-sep"> · </span><span class="show-en">Start with your own words.</span></small></span></li>
                <li><span class="welcome-step-num">2</span><span><strong><span class="show-es">Decide</span><span class="lang-sep"> · </span><span class="show-en">Decide</span></strong><small><span class="show-es">Cuestiona, usa o rechaza la orientación.</span><span class="lang-sep"> · </span><span class="show-en">Question, use, or reject guidance.</span></small></span></li>
                <li><span class="welcome-step-num">3</span><span><strong><span class="show-es">Revisa</span><span class="lang-sep"> · </span><span class="show-en">Revise</span></strong><small><span class="show-es">Haz y guarda los cambios tú mismo/a.</span><span class="lang-sep"> · </span><span class="show-en">Make and save the changes yourself.</span></small></span></li>
            </ol>

            <div class="welcome-trust">
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5L2.5 4v4.5C2.5 11.7 5 14.2 8 15c3-.8 5.5-3.3 5.5-6.5V4L8 1.5z"/><path d="M5.5 8.5l2 2 3-3"/></svg>
                <span><span class="show-es">Tu borrador se guarda en este navegador. Tu Pana nunca cambia tu texto sin que tú lo hagas.</span><span class="lang-sep"> · </span><span class="show-en">Your draft stays in this browser. Tu Pana never changes your text unless you do it.</span></span>
            </div>

            <div class="welcome-actions">
                <button id="landingContinueBtn" class="welcome-primary" aria-label="Empezar a escribir · Start writing">
                    <span class="show-es">Empezar a escribir</span><span class="lang-sep"> · </span><span class="show-en">Start writing</span>
                    <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h11M10 5l4 4-4 4"/></svg>
                </button>
                <button id="landingTourBtn" class="welcome-secondary" aria-label="Ver la guía opcional de tres minutos · View optional three-minute guide">
                    <span class="show-es">Ver guía de 3 minutos</span><span class="lang-sep"> · </span><span class="show-en">View 3-minute guide</span>
                </button>
                <div id="landingTtsWrap"></div>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    const _landingTtsWrap = overlay.querySelector('#landingTtsWrap');
    if (_landingTtsWrap) {
        const _landingAudioBtn = _makeAudioBtn('assets/audio/es/01-landing-welcome.mp3');
        if (_landingAudioBtn) _landingTtsWrap.appendChild(_landingAudioBtn);
    }
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    function dismissLanding(next) {
        _stopOnboardingAudio();
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            if (next === 'tour') {
                openLab();
            } else {
                logProcessEvent('onboarding_quick_start', 'Student chose the direct start-writing path.');
                finishFirstRun('quick');
            }
        }, 320);
    }

    // Direct writing is the primary path. The authorship/AI-judgment lesson is
    // still available, but it no longer blocks the student's first sentence.
    const btn = overlay.querySelector('#landingContinueBtn');
    if (btn) {
        btn.addEventListener('click', () => dismissLanding('quick'));
        setTimeout(() => btn.focus(), 450);
    }
    const tourBtn = overlay.querySelector('#landingTourBtn');
    if (tourBtn) tourBtn.addEventListener('click', () => dismissLanding('tour'));
}

function finishFirstRun(path) {
    try { localStorage.setItem('tupana_onboarding_complete', 'true'); } catch(e) {}
    if (window.innerWidth <= 480) switchMobileTab('draft');

    const wOverride = (typeof getWelcomeOverride === 'function') ? getWelcomeOverride(state.assignmentId) : null;
    let welcomeMsg;
    if (wOverride) {
        welcomeMsg = state.connected ? wOverride.connected : wOverride.offline;
    } else if (path === 'tour') {
        welcomeMsg = state.connected
            ? 'Listo. Empieza en tu borrador con tus propias palabras. Cuando quieras orientación, selecciona un pasaje o hazle una pregunta al coach.\nReady. Begin in your draft with your own words. When you want guidance, select a passage or ask the coach a question.'
            : 'Listo. Empieza en tu borrador con tus propias palabras. La Guía sin IA estará disponible cuando la necesites.\nReady. Begin in your draft with your own words. Built-in guidance is available whenever you need it.';
    } else {
        welcomeMsg = state.connected
            ? 'Empieza en el borrador. Tus palabras van primero; el coach espera hasta que tú pidas ayuda.\nStart in the draft. Your words come first; the coach waits until you ask for help.'
            : 'Empieza en el borrador con tus propias palabras. Tu trabajo se guarda automáticamente en este navegador.\nStart in the draft with your own words. Your work saves automatically in this browser.';
    }
    setTimeout(() => addMsg(welcomeMsg, 'bot', false, 'welcome'), 300);
    setTimeout(() => {
        if (D.draftArea) D.draftArea.focus();
    }, 480);
}

function showWelcomeBack() {
    if (state.welcomeShown) return;
    state.welcomeShown = true;

    let stage = 1;
    try { stage = parseInt(localStorage.getItem('tupana_stage') || '1', 10) || 1; } catch(e) {}
    const stageName = stLabel(stage);   // Stage B.1: CAP-200-aware when active, default otherwise
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
        const humor = pickHumorPair('welcome_multi');
        if (humor.es || humor.en) humorLine = `\n\n${humor.es}\n${humor.en}`;
    }

    addMsg(greeting + draftLine + humorLine, 'bot', false, 'welcome');
}

function openMani(options = {}) {
    maniStandalone = options.standalone === true;
    setOverlayOpen('maniBg', true);
    initManiPrompt();
    restoreManiClaims();
    const proceedBtn = document.getElementById('maniProceedBtn');
    if (proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.style.pointerEvents = '';
        proceedBtn.textContent = maniStandalone
            ? 'Guardar y volver a escribir · Save and return to writing'
            : 'Continuar al Laboratorio →';
    }
    const _maniAudioWrap = document.getElementById('maniIntroAudioWrap');
    if (_maniAudioWrap && !_maniAudioWrap.dataset.wired) {
        _maniAudioWrap.dataset.wired = '1';
        const btn = _makeAudioBtn('assets/audio/es/02-mani-intro.mp3');
        if (btn) _maniAudioWrap.appendChild(btn);
    }
    // attach keyboard listeners once
    const grid = document.getElementById('maniGrid');
    if (grid) {
        grid.querySelectorAll('.mani-asset:not([data-mani-key])').forEach(el => {
            el.setAttribute('data-mani-key', '1');
            el.addEventListener('keydown', handleManiKey);
        });
        const active = grid.querySelector('.mani-asset--active');
        const focusTarget = active || grid.querySelector('.mani-asset');
        if (focusTarget) setTimeout(() => focusTarget.focus(), 120);
    }
}

function showManiCelebration(onDone, options = {}) {
    if (document.getElementById('maniCelebration')) return;  // already showing
    const standalone = options.standalone === true;
    const nextLabel = standalone
        ? 'Volver a escribir · Return to writing'
        : 'Continue to the Lab · Sigue al laboratorio';
    const overlay = document.createElement('div');
    overlay.id = 'maniCelebration';
    overlay.style.cssText = `
        position:fixed; inset:0; z-index:1000;
        background: rgba(42,33,28,0.78);
        backdrop-filter: blur(14px) saturate(1.2);
        display:flex; align-items:center; justify-content:center;
        opacity:0; transition: opacity 0.5s ease;
        padding: 40px 24px;
    `;
    overlay.innerHTML = `
        <div style="
            max-width:520px; width:100%;
            background: var(--bg-raised);
            border: 1px solid var(--border-hi);
            border-radius: var(--radius-lg);
            padding: 48px 40px 40px;
            text-align: center;
            box-shadow: var(--shadow-lg);
        ">
            <div style="font-family:'Literata',Georgia,serif; font-size:2.0rem; font-style:italic; color:var(--text-primary); line-height:1.4; margin-bottom:20px;">
                You claimed your assets, and you named what you bring. Your memory, language, and lived knowledge belong in this conversation.
            </div>
            <div style="font-family:'Source Sans 3',system-ui,sans-serif; font-size:1.05rem; color:var(--text-sub); letter-spacing:0.04em; margin-bottom:32px;">
                Reclamaste tus recursos y nombraste lo que traes. Tu memoria, tu lengua y tu conocimiento vivido pertenecen a esta conversación.
            </div>
            <button id="maniCelebrationBtn" style="
                font-family:'Source Sans 3',system-ui,sans-serif; font-size:0.95rem; font-weight:600;
                background: rgba(184,92,26,0.85); color:#fff; border:none; border-radius:40px;
                padding: 10px 28px; cursor:pointer; letter-spacing:0.03em;
                transition: background 0.2s ease;
            " aria-label="${nextLabel}">
                ${nextLabel}
            </button>
        </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });

    let dismissed = false;
    function dismiss() {
        if (dismissed) return;  // one-shot guard: prevents double openLab() from ghost tap
        dismissed = true;
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.remove(); onDone(); }, 500);
    }

    const btn = overlay.querySelector('#maniCelebrationBtn');
    if (btn) {
        btn.addEventListener('click', dismiss);
        setTimeout(() => btn.focus(), 600);
    }
}

function maniProceed() {
    if (maniClaimed < MANI_TOTAL) return;
    if (!maniPromptInput || maniPromptInput.value.trim().length === 0) return;
    _stopOnboardingAudio();
    const maniBgEl = document.getElementById('maniBg');
    if (!maniBgEl.classList.contains('on')) return;  // already dismissed — Safari ghost-touch guard
    const proceedBtn = document.getElementById('maniProceedBtn');
    if (proceedBtn) { proceedBtn.disabled = true; proceedBtn.style.pointerEvents = 'none'; }
    setOverlayOpen(maniBgEl, false);
    const standalone = maniStandalone;
    maniStandalone = false;
    showManiCelebration(() => {
        if (standalone) {
            logProcessEvent('knowledge_activity_completed', 'Student completed the optional Tu Conocimiento activity.');
            addSys('Tu Conocimiento quedó guardado en Mi Toolkit. · Tu Conocimiento is saved in My Toolkit.');
            D.draftArea?.focus();
        } else if (localStorage.getItem('tupana_lab_done') !== 'true') {
            openLab();
        }
    }, { standalone });
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
    updateProceedBtn();
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
        updateProceedBtn();
    });
}

// ════════════════════════════════════════════════════════
//  EL LABORATORIO — onboarding wizard
// ════════════════════════════════════════════════════════
const LAB_TOTAL_STEPS = 4;   // 0=welcome, 1=read, 2=questions, 3=summary
const _LAB_AUDIO_SRCS = [
    'assets/audio/es/04-lab-step0.mp3',
    'assets/audio/es/05-lab-step1.mp3',
    'assets/audio/es/06-lab-step2.mp3',
    'assets/audio/es/07-lab-step3.mp3',
];
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
    _stopOnboardingAudio();
    document.querySelectorAll('.lab-step').forEach(s => s.classList.remove('on'));
    const step = el('labStep' + n);
    if (step) step.classList.add('on');
    labCurrent = n;
    buildLabProgress();

    const _labAudioWrap = document.getElementById('labAudioWrap' + n);
    if (_labAudioWrap && !_labAudioWrap.dataset.wired) {
        _labAudioWrap.dataset.wired = '1';
        const audioBtn = _makeAudioBtn(_LAB_AUDIO_SRCS[n]);
        if (audioBtn) _labAudioWrap.appendChild(audioBtn);
    }

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
        closeLab({ completed: true });
    }
}

function labChoose(qNum, val) {
    // hide step-2 audio after first question — narration is the same for all questions (sequence index 0 only)
    if (qNum === 1) {
        _stopOnboardingAudio();
        const _audioWrap = document.getElementById('labAudioWrap2');
        if (_audioWrap) _audioWrap.style.display = 'none';
    }
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
    allChoices.forEach(choice => { choice.disabled = true; });

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
                el('labQ' + qNum).classList.remove('on');
                el('labBody').scrollTop = 0;
                el('labQ' + (qNum + 1)).classList.add('on');
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
    if (el('labBg').classList.contains('on')) return;  // already open — don't reset progress
    setOverlayOpen('labBg', true);
    labShowStep(0);
    setTimeout(() => el('labBg')?.querySelector('.lab-top-skip .lab-skip')?.focus(), 80);
}

function flashChatFocus() {
    if (state.spotlightTarget) return;
    document.body.classList.add('post-onboarding-focus');
    D.chatMessages.classList.add('post-onboarding-chat');
    let _focusTimer = setTimeout(clearFocus, 3200);
    let _cleared = false;
    function clearFocus() {
        if (_cleared) return;
        _cleared = true;
        clearTimeout(_focusTimer);
        document.removeEventListener('click', clearFocus);
        // Patch 6: swap to exiting classes so transition stays active during fade-out
        document.body.classList.add('post-onboarding-exiting');
        D.chatMessages.classList.add('post-onboarding-chat-exiting');
        document.body.classList.remove('post-onboarding-focus');
        D.chatMessages.classList.remove('post-onboarding-chat');
        setTimeout(() => {
            document.body.classList.remove('post-onboarding-exiting');
            D.chatMessages.classList.remove('post-onboarding-chat-exiting');
        }, 520);
    }
    setTimeout(() => document.addEventListener('click', clearFocus), 300);
}

function closeLab(options = {}) {
    const completed = options.completed === true;
    _stopOnboardingAudio();
    setOverlayOpen('labBg', false, { restoreFocus: true });
    if (completed) {
        try { localStorage.setItem('tupana_lab_done', 'true'); } catch(e) {}
        logProcessEvent('onboarding_guide_completed', 'Student completed the optional AI-judgment guide.');
    } else {
        logProcessEvent('onboarding_guide_exited', `Student exited the optional AI-judgment guide at step ${labCurrent + 1} of ${LAB_TOTAL_STEPS}.`);
    }
    finishFirstRun('tour');
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

// ════════════════════════════════════════════════════════
//  MILESTONE-BASED REFLECTION CHECKPOINTS
//  Appear as a single optional button after bot messages
//  (stages 4+). Each checkpoint maps to a specific writing
//  milestone and critical AI literacy skill. Picks are stored
//  in tupana_decisions with checkpoint:true for report inclusion.
// ════════════════════════════════════════════════════════

const REFLECTION_CHECKPOINTS = [
    {
        stageId: 4,
        titleEs: 'Antes de seguir: tu investigación',
        titleEn: 'Before You Continue: your research',
        reportLabel: 'Revision Check',
        skill: 'Research verification',
        skillsGainsLabel: 'I practiced checking whether AI research advice needs verification.',
        skillsGainsLabelEs: 'Practiqué verificar si el consejo de investigación del coach necesita comprobación.',
        promptEs: 'Antes de seguir, revisa esto: ¿sabes de dónde viene cada dato y cada fuente que vas a usar? Esto mantiene la investigación tuya — algo que puedes explicar y defender.',
        promptEn: 'Before moving on, check this: do you know where each fact and source you plan to use actually comes from? This keeps your research yours — something you can explain and stand behind.',
        questionEs: '¿El coach te ayudó a pensar en dónde y cómo buscar, o hizo que la investigación pareciera ya terminada?',
        questionEn: 'Did the coach help you think about where and how to search, or did it make research sound already finished?',
        options: [
            { es: 'El coach sugirió términos de búsqueda o bases de datos.', en: 'The coach suggested search terms or databases.' },
            { es: 'El coach me recordó verificar las fuentes.', en: 'The coach reminded me to verify sources.' },
            { es: 'El coach me dio citas que todavía necesito verificar.', en: 'The coach gave me citations I still need to check.' },
            { es: 'El coach pareció demasiado seguro sobre las fuentes.', en: 'The coach seemed too confident about sources.' },
            { es: 'No estoy seguro/a de cómo verificar la investigación todavía.', en: 'I am not sure how to verify the research yet.' }
        ],
        writtenFrame: null,
        required: false,
        oncePerStage: true
    },
    {
        stageId: 7,
        titleEs: 'Antes de seguir: tu revisión',
        titleEn: 'Before You Continue: your revision',
        reportLabel: 'Revision Check',
        skill: 'Revision judgment',
        skillsGainsLabel: 'I practiced deciding whether AI revision advice supported my own choices as a writer.',
        skillsGainsLabelEs: 'Practiqué decidir si el consejo de revisión del coach apoyó mis propias decisiones como escritor/a.',
        promptEs: 'Antes de seguir, revisa esto: ¿tu trabajo presenta una idea clara que un lector pueda seguir? Esto ayuda a que tu mejor pensamiento se note.',
        promptEn: 'Before moving on, check this: does your written work make one clear claim a reader can follow? This helps your strongest thinking come through.',
        questionEs: '¿El coach te ayudó a revisar tu propio párrafo, o empezó a escribir por ti?',
        questionEn: 'Did the coach help you revise your own paragraph, or did it start writing for you?',
        options: [
            { es: 'Me ayudó a notar lo que podía mejorar.', en: 'It helped me notice what I could improve.' },
            { es: 'Me hizo preguntas útiles.', en: 'It asked useful questions.' },
            { es: 'Me dio estrategias sin reemplazar mi párrafo.', en: 'It gave me strategies without replacing my paragraph.' },
            { es: 'Empezó a sonar como si estuviera reescribiendo por mí.', en: 'It started to sound like it was rewriting for me.' },
            { es: 'Necesito decidir qué consejo encaja con mi voz.', en: 'I need to decide which advice fits my voice.' }
        ],
        writtenFrame: null,
        required: false,
        oncePerStage: false
    },
    {
        stageId: 8,
        titleEs: 'Antes de seguir: tu voz',
        titleEn: 'Before You Continue: your voice',
        reportLabel: 'Revision Check',
        skill: 'Voice protection',
        skillsGainsLabel: 'I practiced checking whether AI advice protected my voice, language, and cultural knowledge.',
        skillsGainsLabelEs: 'Practiqué verificar si el consejo del coach protegió mi voz, lenguaje y conocimiento cultural.',
        promptEs: 'Antes de seguir, revisa esto: ¿cuál oración suena menos como tú — y cómo la dirías con tu propia voz? Esto te ayuda a ganar claridad sin perderte a ti mismo/a.',
        promptEn: 'Before moving on, check this: which sentence sounds least like you — and how would you say it in your own voice? This helps you get clearer without losing yourself.',
        questionEs: '¿El coach te ayudó a aclarar tu escritura preservando tu voz?',
        questionEn: 'Did the coach help clarify your writing while preserving your voice?',
        options: [
            { es: 'Me ayudó a hacer mi significado más claro.', en: 'It helped me make my meaning clearer.' },
            { es: 'Respetó mi español, spanglish, o lengua familiar.', en: 'It respected my Spanish, Spanglish, or family language.' },
            { es: 'No trató mi voz como un error.', en: 'It did not treat my voice as a mistake.' },
            { es: 'Hizo que la escritura sonara demasiado genérica.', en: 'It made the writing sound too generic.' },
            { es: 'Sugirió eliminar lenguaje que me importa.', en: 'It suggested removing language that matters to me.' }
        ],
        writtenFrame: null,
        required: false,
        oncePerStage: false
    },
    {
        stageId: 10,
        titleEs: 'Antes de entregar',
        titleEn: 'Before You Submit',
        reportLabel: 'Final Reflection',
        skill: 'AI advice evaluation',
        skillsGainsLabel: 'I practiced explaining how I accepted, questioned, changed, or rejected AI advice.',
        skillsGainsLabelEs: 'Practiqué explicar cómo acepté, cuestioné, cambié o rechacé el consejo del coach.',
        promptEs: 'Antes de entregar, revisa esto: mirando todo tu proceso, ¿cuál es una decisión sobre el consejo del coach de la que te sientes bien? Esto te ayuda a reconocer el trabajo que es tuyo.',
        promptEn: 'Before you submit, check this: looking back over your whole process, what is one decision about the coach\'s advice that you feel good about? This helps you own the work that is yours.',
        questionEs: '¿Cómo describirías tu decisión más importante sobre el consejo del coach?',
        questionEn: 'How would you describe your most important decision about the coach\'s advice?',
        options: [
            { es: 'Acepté el consejo y mejoró mi trabajo.', en: 'I accepted the advice and it improved my work.' },
            { es: 'Cuestioné el consejo y lo modifiqué.', en: 'I questioned the advice and modified it.' },
            { es: 'Rechacé el consejo porque no encajaba con mi voz.', en: 'I rejected the advice because it did not fit my voice.' },
            { es: 'Usé parte del consejo y descarté el resto.', en: 'I used part of the advice and discarded the rest.' },
            { es: 'El coach me ayudó a pensar sin decirme qué escribir.', en: 'The coach helped me think without telling me what to write.' }
        ],
        writtenFrame: 'Un consejo que acepté fue… · One piece of advice I accepted was… / Un consejo que cuestioné fue… · One piece of advice I questioned was… / Una razón de mi decisión fue… · One reason for my decision was…',
        required: false,
        oncePerStage: false
    }
];

function renderReflectButton(msgId) {
    const msgWrap = D.chatMessages.querySelector(`[data-msg-id="${msgId}"]`);
    if (!msgWrap || msgWrap.querySelector('.reflect-btn-wrap')) return;
    const cp = REFLECTION_CHECKPOINTS.find(c => c.stageId === state.stage);
    // No checkpoint defined for this stage (e.g., 5, 6, 9) — skip
    if (!cp) return;
    // Stage 10 checkpoint belongs in the capstone panel flow, not post-message
    if (state.stage === 10) return;
    // Stages 7 and 8 require a milestone action (revision focus or voice-polish route)
    if (state.stage === 7 || state.stage === 8) {
        if (state._reflectStage !== state.stage) return;
        state._reflectStage = 0; // consume — show once per milestone trigger
    }
    const wrap = document.createElement('div');
    wrap.className = 'reflect-btn-wrap';
    const btn = document.createElement('button');
    btn.className = 'reflect-btn';
    btn.setAttribute('aria-label', 'Antes de seguir · Before you continue');
    btn.textContent = 'Revisión rápida · Quick check';
    btn.addEventListener('click', () => {
        if (cp) openReflectionCheckpoint(cp);
        else openMsgEvalDrawer(msgId, EVAL_QUESTIONS[0].key, {});
    });
    wrap.appendChild(btn);
    msgWrap.appendChild(wrap);
}

function openReflectionCheckpoint(cp) {
    document.getElementById('reflectModal')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'eval-modal-bg';
    overlay.id = 'reflectModal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `${cp.titleEs} · ${cp.titleEn}`);

    const card = document.createElement('div');
    card.className = 'eval-modal-card';

    const header = document.createElement('div');
    header.className = 'eval-modal-header';
    header.textContent = `${cp.titleEs} · ${cp.titleEn}`;
    card.appendChild(header);

    const skillLabel = document.createElement('div');
    skillLabel.className = 'reflect-skill-label';
    skillLabel.innerHTML = `<span class="show-es">Habilidad practicada</span><span class="lang-sep"> · </span><span class="show-en">Skill practiced</span>: <strong>${escapeHtml(cp.skill)}</strong>`;
    card.appendChild(skillLabel);

    const prompt = document.createElement('p');
    prompt.className = 'eval-modal-intro';
    prompt.innerHTML = `<span class="show-es">${escapeHtml(cp.promptEs)}</span><span class="lang-sep"> · </span><span class="show-en">${escapeHtml(cp.promptEn)}</span>`;
    card.appendChild(prompt);

    const question = document.createElement('p');
    question.className = 'eval-modal-hint';
    question.innerHTML = `<span class="show-es">${escapeHtml(cp.questionEs)}</span><span class="lang-sep"> · </span><span class="show-en">${escapeHtml(cp.questionEn)}</span>`;
    card.appendChild(question);

    const opts = document.createElement('div');
    opts.className = 'reflect-options';
    cp.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'reflect-option-btn';
        btn.setAttribute('aria-pressed', 'false');
        btn.innerHTML = `<span class="show-es">${escapeHtml(opt.es)}</span><span class="lang-sep"> · </span><span class="show-en">${escapeHtml(opt.en)}</span>`;
        btn.addEventListener('click', () => {
            opts.querySelectorAll('.reflect-option-btn').forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
            btn.classList.add('selected');
            btn.setAttribute('aria-pressed', 'true');
            try {
                const log = JSON.parse(localStorage.getItem('tupana_decisions') || '[]');
                log.push({ q: `${cp.reportLabel || cp.titleEn} (Stage ${cp.stageId})`, choice: `option_${idx + 1}`, t: new Date().toISOString(), checkpoint: true, stage: cp.stageId, skill: cp.skill });
                localStorage.setItem('tupana_decisions', JSON.stringify(log.slice(-50)));
            } catch(e) {}
            logProcessEvent('feedback_evaluated', `Reflection checkpoint Stage ${cp.stageId} (${cp.skill}): option ${idx + 1}.`);
            renderBadges();
            renderDecisionLog();
            setTimeout(() => overlay.remove(), 700);
        });
        opts.appendChild(btn);
    });
    card.appendChild(opts);

    const skipBtn = document.createElement('button');
    skipBtn.className = 'eval-modal-close';
    skipBtn.setAttribute('aria-label', 'Saltar por ahora · Skip for now');
    skipBtn.textContent = 'Saltar por ahora · Skip for now';
    card.appendChild(skipBtn);

    overlay.appendChild(card);

    const closeReflect = () => { overlay.remove(); document.removeEventListener('keydown', onEscReflect); };
    const onEscReflect = e => { if (e.key === 'Escape') closeReflect(); };
    skipBtn.addEventListener('click', closeReflect);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeReflect(); });
    document.addEventListener('keydown', onEscReflect);

    document.body.appendChild(overlay);
    setTimeout(() => card.querySelector('.reflect-option-btn')?.focus(), 40);
}

// Stage 8 intentionally excluded (Stage A.2 / B1): the Stage-8 "Before You Continue"
// check surfaces via the reflect button after a Voice-Polish route is chosen
// (selectPolishRoute sets _reflectStage = 8), NOT as an auto-opening modal on entry —
// Stage-8 entry was over-saturated. Stages 4 and 7 still auto-open once.
const AUTO_REFLECTION_STAGES = new Set([4, 7]);

function maybeOpenStageEntryReflectionCheckpoint(stageId) {
    try {
        if (!AUTO_REFLECTION_STAGES.has(stageId)) return;
        const key = `tupana_reflect_shown_${stageId}`;
        if (localStorage.getItem(key) === 'true') return;
        const cp = REFLECTION_CHECKPOINTS.find(c => c.stageId === stageId);
        if (!cp) return;
        localStorage.setItem(key, 'true');
        // 1200ms: after stage-specific cards (700–800ms) have rendered
        setTimeout(() => openReflectionCheckpoint(cp), 1200);
    } catch(e) {}
}

function injectEvalCard() {
    if (state.stage < 7) return;

    const card = document.createElement('div');
    card.className = 'eval-card';

    const hdr = document.createElement('div');
    hdr.className = 'eval-card-header';
    hdr.innerHTML = `
        <span class="eval-card-title">${getIcon('critical-lens', 16)} Evalúa esta respuesta · Evaluate this response</span>
        <span class="orient-tag" aria-hidden="true"><span class="show-es">Apoyo</span><span class="lang-sep"> · </span><span class="show-en">Support</span></span>
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
//  STAGE-LEVEL EVAL TRIGGER
//  Called by the "Evaluar última respuesta" button inside
//  the Five Questions strip. Surfaces the eval bar on the
//  most recent bot message only — removing any stale bars
//  from earlier messages that the student never used.
// ════════════════════════════════════════════════════════

function evalLastCoachMessage() {
    const botMsgs = D.chatMessages.querySelectorAll('.msg.bot[data-msg-id]');
    if (!botMsgs.length) return;
    const lastMsg = botMsgs[botMsgs.length - 1];
    const msgId = lastMsg.dataset.msgId;
    if (!msgId) return;

    // Read any existing picks from chatlog
    let evals = {};
    try {
        const log = JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || '[]');
        const entry = log.find(e => e.id === msgId);
        if (entry) evals = entry.evals || {};
    } catch(e) {}

    // Remove eval bars from all messages that haven't been evaluated
    // (active-* class present = student already picked something — keep those)
    D.chatMessages.querySelectorAll('.msg-eval-bar').forEach(bar => {
        const wrap = bar.closest('[data-msg-id]');
        const hasPick = bar.querySelector('[class*="active-"]');
        if (!hasPick && wrap && wrap.dataset.msgId !== msgId) bar.remove();
    });

    // Render or refresh the bar on the latest message
    renderMsgEvalBar(msgId, evals);
    lastMsg.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ════════════════════════════════════════════════════════
//  INLINE MESSAGE EVALUATION (Five Questions per response)
//  renderMsgEvalBar is called explicitly via evalLastCoachMessage
//  (stage-level trigger) or by the session restore path for
//  messages the student already evaluated.
// ════════════════════════════════════════════════════════

function renderMsgEvalBar(msgId, evals) {
    const msgWrap = D.chatMessages.querySelector(`[data-msg-id="${msgId}"]`);
    if (!msgWrap) return;
    // Don't duplicate
    if (msgWrap.querySelector('.msg-eval-bar')) return;

    // One-time explanatory micro-text (Patch 21)
    const EVAL_HINT_KEY = 'tupana_eval_hint_seen';
    if (!localStorage.getItem(EVAL_HINT_KEY)) {
        const hint = document.createElement('p');
        hint.className = 'msg-eval-hint-once';
        hint.textContent =
            'Antes de usar la respuesta, revísala con estas preguntas. · ' +
            'Before using the response, review it with these questions.';
        msgWrap.appendChild(hint);
        try { localStorage.setItem(EVAL_HINT_KEY, '1'); } catch(e) {}
    }

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
//  DECISION CLASSIFICATION  (Batch 3 — counter-bug fix)
//  Single source of truth so summary COUNTS and per-row LABELS always
//  agree. Five-Questions evaluations carry choice good/warn/flag →
//  accepted/thinking/questioned. Pause-and-Reflect / Revision Check
//  entries carry checkpoint:true (choice 'option_N' or free text) →
//  their own "checks" bucket. Before this fix, checkpoints were dropped
//  from the counts but fell through an else-branch and rendered as
//  "Questioned" — so reports showed Accepted 0 / Questioned 0 while the
//  decision log listed rows as "Questioned". tallyDecisions() counts
//  every entry exactly once; decisionRowLabel() labels each correctly.
// ════════════════════════════════════════════════════════
function tallyDecisions(decisions) {
    const t = { accepted: 0, thinking: 0, questioned: 0, checks: 0, total: 0 };
    (decisions || []).forEach(d => {
        if (!d) return;
        t.total++;
        if      (d.checkpoint === true) t.checks++;
        else if (d.choice === 'good')   t.accepted++;
        else if (d.choice === 'warn')   t.thinking++;
        else if (d.choice === 'flag')   t.questioned++;
    });
    return t;
}
function decisionRowLabel(d) {
    if (d && d.checkpoint === true) return { es: 'Revisión · Revision check', plain: '◆ Revision check', dot: 'check' };
    if (d && d.choice === 'good')   return { es: 'Acepté · Accepted',          plain: '✓ Accepted',       dot: 'good' };
    if (d && d.choice === 'warn')   return { es: 'Pensando más · Thinking more', plain: '? Thinking more', dot: 'warn' };
    return { es: 'Cuestioné · Questioned', plain: '✗ Questioned', dot: 'flag' };
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
            const rl = decisionRowLabel(d);
            const time = new Date(d.t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            return `<div class="decision-log-item"><span class="decision-dot ${rl.dot}"></span><span>${d.q}: <strong>${rl.es}</strong> <span style="color:var(--text-muted)">— ${time}</span></span></div>`;
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
        const entry = { text, who, t: new Date().toISOString(), id: id || makeMsgId(), evals: evals || {}, stage: state.stage };
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
            if (entry.msgType === 'welcome' || entry.msgType === 'stage-intro' || entry.msgType === 'system') return true;
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
    D.stuckBtn?.setAttribute('aria-expanded', 'true');
    setTimeout(() => D.stuckTriage.querySelector('.stuck-option')?.focus(), 20);
}
function hideStuckTriage(returnFocus = true) {
    D.stuckTriage.classList.remove('on');
    D.stuckBtn?.setAttribute('aria-expanded', 'false');
    if (returnFocus) D.stuckBtn?.focus();
}
function handleStuckOption(option) {
    hideStuckTriage(false);
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
                'Completa esta oración con tus propias palabras: Mi trabajo es sobre ______ porque ______. No tiene que ser perfecto. / Complete this: My work is about ______ because ______. It does not have to be perfect.',
                'State the tension in one sentence: "My work argues that [experience] reveals [structural issue]."'
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
                'Escribe un párrafo sobre el momento más específico de tu historia. No pienses en el texto completo — solo escribe el momento. / Write one paragraph about the most specific moment in your story. Do not think about the whole piece — just write the moment.',
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
        const humor = pickHumorPair('overwhelmed');
        addSys(t(
            `Entiendo. Tomemos un respiro. Voy a activar el modo enfoque para que solo veas tu borrador. ${humor.es ? humor.es + ' ' : ''}/ I understand. Let's take a breath. I'm turning on focus mode so you only see your draft. ${humor.en || ''}`,
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

function initStuckTriageKeyboard() {
    if (!D.stuckTriage || !D.stuckBtn || D.stuckTriage.dataset.keyboardReady) return;
    D.stuckTriage.dataset.keyboardReady = 'true';
    D.stuckTriage.addEventListener('keydown', event => {
        const items = Array.from(D.stuckTriage.querySelectorAll('.stuck-option, .stuck-triage-close'));
        const current = items.indexOf(document.activeElement);
        if (event.key === 'Escape') {
            event.preventDefault();
            hideStuckTriage(true);
        } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            let next = current;
            if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = items.length - 1;
            else if (event.key === 'ArrowDown') next = (current + 1 + items.length) % items.length;
            else next = (current - 1 + items.length) % items.length;
            items[next]?.focus();
        }
    });
    document.addEventListener('pointerdown', event => {
        if (!D.stuckTriage.classList.contains('on')) return;
        if (!D.stuckTriage.contains(event.target) && event.target !== D.stuckBtn) hideStuckTriage(false);
    });
}

// ════════════════════════════════════════════════════════
//  ENGAGEMENT: PHASE CELEBRATIONS, BADGES, SESSIONS
// ════════════════════════════════════════════════════════
const PHASE_CELEBRATIONS = {
    4:  {
        badge:   'Encontrar · Discovery',
        titleEs: 'Encontraste una dirección',
        titleEn: 'You found a direction',
        body:    'Ya nombraste el enfoque, el propósito y el contexto que orientan tu trabajo. Esa dirección te permite investigar y construir con intención. / You have named the focus, purpose, and context guiding your work. That direction lets you research and build with intention.'
    },
    6:  {
        badge:   'Construir · Building',
        titleEs: 'Lo preparaste todo',
        titleEn: 'You built the foundation',
        body:    'Exploraste, conectaste y organizaste tus ideas. Ahora llega el momento más importante: escribir sin ayuda. Nadie puede escribir este borrador por ti — y Tu Pana no lo intentará. / You explored, connected, and organized your ideas. Now comes the most important moment: writing without help. No one can write this draft for you — and Tu Pana will not try.'
    },
    // Stage 7: the draft-saved modal handles this milestone with more depth and a required read pause.
    9:  {
        badge:   'Afinar · Refining',
        titleEs: 'Tu revisión va tomando forma',
        titleEn: 'Your revision is taking shape',
        body:    'Revisaste ideas, evidencia, estructura y voz con criterio. Ahora haz una auditoría final: confirma los requisitos, protege lo que debe quedarse y decide qué todavía necesita atención. / You revised ideas, evidence, structure, and voice with judgment. Now make a final audit: confirm the requirements, protect what should stay, and decide what still needs attention.'
    }
};

function showPhaseCelebration(stageId) {
    const cel = PHASE_CELEBRATIONS[stageId];
    if (!cel || !D.phaseToast) return;
    D.phaseToastBadge.innerHTML = `${getIcon('luminous-page', 16)} ${cel.badge}`;
    D.phaseToastTitle.innerHTML = `${cel.titleEs} · ${cel.titleEn}`;
    D.phaseToastBody.innerHTML = cel.body;
    setOverlayOpen(D.phaseToast, true);
    // No auto-dismiss — student must click Continue or the X to close
}

function dismissPhaseToast() {
    if (D.phaseToast) setOverlayOpen(D.phaseToast, false, { restoreFocus: true });
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

    // Count distinct checkpoint stages (mirrors Skills Gains dedup logic)
    const _cpStages = new Set();
    for (const d of decisions) { if (d.checkpoint === true) _cpStages.add(d.stage); }
    const checkpointCount = _cpStages.size;

    if (done.has(3) || stage > 3) {
        badges.push({ cls: 'story',  text: 'Fundador/a de Historia · Story Founder', icon: 'community-map' });
    }
    if (draftSaved) {
        badges.push({ cls: 'arch',   text: 'Arquitecto/a del Borrador · Draft Architect', icon: 'first-draft-door' });
    }
    // Earned by completing 1+ distinct reflection checkpoints, or by legacy ≥5 decisions
    if (checkpointCount >= 1 || decisions.length >= 5) {
        badges.push({ cls: 'voice',  text: 'Guardián/a de la Voz · Voice Guardian', icon: 'voice-thread' });
    }
    if (done.has(8) || stage > 8) {
        badges.push({ cls: 'bridge', text: 'Constructor/a de Puentes · Bridge Builder', icon: 'language-bridge' });
    }
    // Earned by completing 3+ distinct reflection checkpoints, or by legacy ≥10 decisions
    if (checkpointCount >= 3 || decisions.length >= 10) {
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
    const theme = saved || 'light';
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
    if (!confirm('¿Borrar todo el trabajo y empezar de nuevo? No hay forma de deshacer.\n\nErase all work and start over? This cannot be undone.')) return;
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
        focusToggle.innerHTML = `<span class="tp-icon" style="width:14px;height:14px"><svg viewBox="0 0 64 64" aria-hidden="true"><path class="tp-fill-sky" d="M24 12 9 5M40 12l15-7M24 17 7 18M40 17l17 1"/><path class="tp-fill-mango" d="M25 10h14v11H25z"/><path d="M28 10V7h8v3"/><path d="M25 21h14"/><path class="tp-fill-paper" d="M22 21h20l5 37H17z"/><path d="M26 21l-3 37M38 21l3 37"/><path d="M20 33h24M19 45h26M16 58h32"/><path class="tp-fill-teal" d="M29 33h6v9h-6z"/><path d="M32 21v37"/></svg></span> ${inFocus ? '<span class="show-es">Salir</span><span class="lang-sep"> · </span><span class="show-en">Exit</span>' : '<span class="focus-toggle-label"><span class="show-es">Enfoque</span><span class="lang-sep"> · </span><span class="show-en">Focus</span></span>'}`;
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
        if (lbl) lbl.innerHTML = '<span class="show-es">Enfoque</span><span class="lang-sep"> · </span><span class="show-en">Focus</span>';
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
    // Step 2 of guidance sequence (Patch 26): show import card if queued.
    // No editor spotlight follows this path (student dismissed without "Entendido").
    if (_pendingImport) setTimeout(_showPendingImport, 200);
}

// Called only by the explicit "Entendido" button — the student has read the hints
// and deliberately chosen to move to the draft editor.
function confirmCoachSpotlight() {
    _spotlightClearTimer();
    document.removeEventListener('click', _spotlightDocClickHandler);
    D.chatMessages.querySelectorAll('.spotlight-target').forEach(el => el.classList.remove('spotlight-target'));
    document.getElementById('spotlightCoachLabel')?.remove();
    document.body.classList.remove('spotlight-coach');
    // Patch 26 guidance sequence: if an import card is queued, show it as step 2.
    // The editor spotlight fires as step 3 only after the student makes their import choice.
    if (_pendingImport) {
        _showPendingImport(_activateEditorSpotlight);
    } else {
        _activateEditorSpotlight();
    }
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
    // Import card still needed even when spotlight is disabled (Patch 26).
    if (_pendingImport) setTimeout(_showPendingImport, 200);
}

//  INIT
// ════════════════════════════════════════════════════════
//  PROCESS REPORT GENERATION
// ════════════════════════════════════════════════════════
function openReport() {
    const bg = document.getElementById('reportBg');
    const body = document.getElementById('reportBody');
    body.innerHTML = buildPacketDiagnosticHTML() + buildAIActivitySummaryHTML() + buildReportHTML();
    setOverlayOpen(bg, true);
    setTimeout(() => bg.querySelector('.report-close')?.focus(), 80);
}
function closeReport() {
    setOverlayOpen('reportBg', false, { restoreFocus: true });
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
    const { accepted, questioned, thinking, checks } = tallyDecisions(decisions);
    const botMsgs = chatLog.filter(m => m.who === 'bot').length;
    return { draftSaved, wordCount, stage, stageName, maniSentence, accepted, questioned, thinking, checks, botMsgs, dateStr };
}

function openProcessNoteModal() {
    // #pnModalBg / #pnModalBody sit below the script tag in index.html, so the
    // D cache holds null — resolve at call time. Pre-P4 the early return made
    // the entire 10C process-note modal (and with it the Stage 10 completion
    // sequence) unreachable in production.
    const bg   = D.pnModalBg   || document.getElementById('pnModalBg');
    const body = D.pnModalBody || document.getElementById('pnModalBody');
    if (!bg || !body) return;
    const data = gatherProcessNoteData();
    body.innerHTML = `
      <div class="report-note-box">
        <p>Completa cada sección directamente aquí. Tu trabajo se guarda automáticamente en este navegador. <em>Revisa y reescribe en tus propias palabras antes de entregar.</em></p>
        <p>Complete each section directly here. Your work auto-saves in this browser. <em>Review and rewrite in your own words before submitting.</em></p>
        ${buildProcessNoteHTML(data)}
      </div>
    `;
    setOverlayOpen(bg, true);
    // Focus the first textarea for accessibility
    setTimeout(() => {
        const firstTextarea = body.querySelector('.report-pn-text');
        if (firstTextarea) firstTextarea.focus();
    }, 100);
}

function closeProcessNoteModal() {
    const bg = D.pnModalBg || document.getElementById('pnModalBg');
    if (bg) setOverlayOpen(bg, false, { restoreFocus: true });
}

function finishProcessNote() {
    if (!hasCompletionRevisionEvidence()) {
        closeProcessNoteModal();
        openRevisionCompletionGate(() => openProcessNoteModal());
        return;
    }
    closeProcessNoteModal();
    try { localStorage.setItem('tupana_completion_shown', 'true'); } catch(e) {}
    setTimeout(showCompletionCelebration, 300);
}

function showCompletionCelebration() {
    // #completionBg sits below the script tag in index.html, so the D cache
    // holds null — resolve at call time (pre-P4 this made the celebration a
    // silent no-op; root cause of the audit's "no done-state" finding).
    const bg = D.completionBg || document.getElementById('completionBg');
    if (bg) {
        setOverlayOpen(bg, true);
        setTimeout(() => bg.querySelector('.completion-cta')?.focus(), 80);
    }
}

function dismissCompletionCelebration() {
    const bg = D.completionBg || document.getElementById('completionBg');
    if (bg) setOverlayOpen(bg, false, { restoreFocus: true });
    injectJourneyCompleteCard();
}

// P4 (pre-pilot patch plan 2026-06-12): persistent "Journey Complete" card with
// 3-step submission instructions. Renders in the chat surface once the process
// note (10C) is finished (gate: tupana_completion_shown). Survives reloads via
// injectCapstonePanel(); also fires when the celebration overlay closes.
// Copy-to-clipboard leads the instructions — Brightspace iframe downloads may
// be blocked by LMS sandbox policy (see Active Risks in project context).
function injectJourneyCompleteCard() {
    try {
        if (localStorage.getItem('tupana_completion_shown') !== 'true') return;
        if (!hasCompletionRevisionEvidence()) return;
        if (document.getElementById('journeyCompleteCard')) return;
        const card = document.createElement('div');
        card.id = 'journeyCompleteCard';
        card.className = 'journey-complete-card';
        card.setAttribute('role', 'region');
        card.setAttribute('aria-label', 'Proceso completo — cómo entregar tu paquete final · Journey complete — how to submit your Final Packet');
        card.innerHTML = `
            <div class="journey-complete-badge"><span class="show-es" lang="es">Proceso completo</span><span class="lang-sep"> · </span><span class="show-en" lang="en">Journey Complete</span></div>
            <div class="journey-complete-title"><span class="show-es" lang="es">Último paso: entrega tu paquete final</span><span class="lang-sep"> · </span><span class="show-en" lang="en">Last step: submit your Final Packet</span></div>
            <ol class="journey-complete-steps">
                <li><span lang="es">Abre <strong>Guardar / Exportar</strong> (botón abajo, o en el pie de página).</span><br><span lang="en">Open <strong>Save / Export</strong> (button below, or in the footer).</span></li>
                <li><span lang="es">Toca <strong>Copiar mi paquete final</strong> — copia tu trabajo escrito y tu reporte de proceso juntos. Si las descargas funcionan en tu dispositivo, también puedes usar <strong>Descargar paquete final</strong>.</span><br><span lang="en">Tap <strong>Copy my Final Submission Packet</strong> — it copies your written work and process report together. If downloads work on your device, you can also use <strong>Download Final Packet</strong>.</span></li>
                <li><span lang="es">Pega y entrega el paquete final en Brightspace, según las instrucciones de tu instructor/a.</span><br><span lang="en">Paste and submit the Final Packet in Brightspace, following your instructor's directions.</span></li>
            </ol>
            <button type="button" class="journey-complete-cta" onclick="openReport()" aria-label="Abrir Guardar / Exportar · Open Save / Export">
                <span class="show-es" lang="es">Abrir Guardar / Exportar</span><span class="lang-sep"> · </span><span class="show-en" lang="en">Open Save / Export</span> →
            </button>`;
        D.chatMessages.appendChild(card);
        D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
    } catch(e) {}
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

// ════════════════════════════════════════════════════════
//  IN-FLOW MICRO-REFLECTIONS  (Batch 4 — reflection simplification)
//  Three short, well-timed reflections embedded in the writing journey
//  (after first draft, after revision, before submit). They reduce the
//  ~80% skip rate of the deeper Q3–Q8 Process Note by being lightweight,
//  in-flow, and one question each. Answers are stored as SUB-KEYS inside
//  the existing tupana_process_note object (no new localStorage key), so
//  export/import/clear already cover them and the deep Q3–Q8 note is
//  preserved unchanged for students who want to go further.
// ════════════════════════════════════════════════════════
const MICRO_REFLECTIONS = {
    main_idea: {
        key: 'mr_main_idea',
        promptEs: 'Antes de seguir, una reflexión rápida: ¿cuál es tu idea principal ahora mismo, en una oración?',
        promptEn: 'A quick reflection before you go on: what is your main idea right now, in one sentence?',
        benefitEs: 'Esto te ayuda a mantener tu trabajo enfocado mientras revisas.',
        benefitEn: 'This helps you keep your work focused as you revise.',
        placeholder: 'Tu idea principal en una oración… · Your main idea in one sentence…'
    },
    changed: {
        key: 'mr_changed',
        promptEs: 'Reflexión rápida: ¿qué cambiaste en tu texto gracias a la retroalimentación?',
        promptEn: 'Quick reflection: what did you change in your text because of feedback?',
        benefitEs: 'Esto te ayuda a ver tu propio crecimiento como escritor/a.',
        benefitEn: 'This helps you see your own growth as a writer.',
        placeholder: 'Un cambio que hiciste por la retroalimentación… · One change you made because of feedback…'
    },
    needs_work: {
        key: 'mr_needs_work',
        promptEs: 'Antes de entregar, una última reflexión: ¿qué parte de tu texto todavía necesita atención?',
        promptEn: 'One last reflection before you submit: what part of your text still needs attention?',
        benefitEs: 'Reconocer esto es parte de ser un/a escritor/a fuerte — no tienes que arreglarlo todo hoy.',
        benefitEn: 'Naming this is part of being a strong writer — you do not have to fix everything today.',
        placeholder: 'Una parte que todavía necesita trabajo… · One part that still needs work…'
    }
};

function injectMicroReflection(id) {
    const cfg = MICRO_REFLECTIONS[id];
    if (!cfg || !D.chatMessages) return;
    // One card per reflection key (guards against re-injection on re-entry)
    if (document.querySelector(`.micro-reflect[data-mr="${cfg.key}"]`)) return;
    const answers = loadProcessNoteAnswers();
    const card = document.createElement('div');
    card.className = 'micro-reflect';
    card.dataset.mr = cfg.key;
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Reflexión rápida · Quick reflection');
    card.innerHTML =
        `<div class="micro-reflect-prompt"><span class="show-es">${escapeHtml(cfg.promptEs)}</span><span class="lang-sep"> · </span><span class="show-en">${escapeHtml(cfg.promptEn)}</span></div>` +
        `<textarea class="micro-reflect-text" id="mr-${cfg.key}" rows="2" placeholder="${escapeHtml(cfg.placeholder)}" oninput="saveProcessNoteAnswer('${cfg.key}', this.value)">${escapeHtml(answers[cfg.key] || '')}</textarea>` +
        `<div class="micro-reflect-benefit"><span class="show-es">${escapeHtml(cfg.benefitEs)}</span><span class="lang-sep"> · </span><span class="show-en">${escapeHtml(cfg.benefitEn)}</span></div>` +
        `<span class="report-pn-saved" id="pn-saved-${cfg.key}">Guardado · Saved</span>`;
    D.chatMessages.appendChild(card);
    D.chatMessages.scrollTop = D.chatMessages.scrollHeight;
}

// Reflection completion status from the 3 in-flow micro-reflections.
function reflectionStatus() {
    const a = loadProcessNoteAnswers();
    const keys = Object.values(MICRO_REFLECTIONS).map(m => m.key);
    const filled = keys.filter(k => (a[k] || '').trim().length > 0).length;
    const status = filled === 0 ? 'BLANK' : filled === keys.length ? 'COMPLETED' : 'PARTIAL';
    return { filled, total: keys.length, status };
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
        <div class="report-pn-static">Usé Tu Pana de Escritura, un coach de escritura bilingüe integrado en el proceso de redacción de mi trabajo escrito. / I used Tu Pana de Escritura, a bilingual writing coach integrated into the writing process for my written work.</div>
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
        'Describe una sugerencia específica que te dio el coach y que decidiste incorporar. Explica por qué mejoró tu trabajo. / Describe one specific suggestion the coach gave that you decided to incorporate...')}

      ${section(5, '¿Qué sugerencia rechazaste o modificaste?', 'What suggestion did you reject or modify?',
        q5Static, 'q5',
        'Describe una sugerencia que no te convenció o que adaptaste a tu propia voz. Explica tu razonamiento. / Describe one suggestion you were not convinced by or that you adapted to your own voice...')}

      ${section(6, '¿Cómo protegiste tu propia voz?', 'How did you protect your own voice?',
        '', 'q6',
        'Menciona detalles específicos de tu trabajo que decidiste mantener a pesar de las sugerencias: una frase en español, un detalle familiar, un momento sensorial... / Mention specific details from your work you chose to keep despite coach suggestions...')}

      ${section(7, '¿Qué parte de tu trabajo final todavía suena más como tú?', 'What part of your final work still sounds most like you?',
        '', 'q7',
        'Identifica el párrafo, la oración o el detalle que sientes que representa mejor tu voz. / Identify the paragraph, sentence, or detail that best represents your voice.')}

      ${section(8, 'Reflexión final', 'Final reflection',
        q8Static, 'q8',
        'Reflexiona sobre cómo tu conocimiento previo —lingüístico, familiar, comunitario— se refleja en tu trabajo final. / Reflect on how your prior knowledge is reflected in your final work.')}
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

    const { accepted, questioned, thinking, checks } = tallyDecisions(decisions);
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
Decisiones de revisión · Revision decisions: ${decisions.length} total (${accepted} aceptadas · accepted, ${questioned} cuestionadas · questioned, ${thinking} pensando · thinking${checks ? `, ${checks} chequeos de revisión · revision checks` : ''})
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

function buildAIActivitySummaryHTML() {
    let usage = null;
    try { usage = JSON.parse(localStorage.getItem('tupana_ai_usage') || 'null'); } catch(e) {}
    if (!usage || !Number(usage.requests)) return '';
    const byKind = usage.byKind || {};
    const count = key => Math.max(0, Number(byKind[key]?.requests || 0));
    const inputTokens = Math.max(0, Number(usage.inputTokens || 0));
    const outputTokens = Math.max(0, Number(usage.outputTokens || 0));
    return `
      <details class="ai-activity-summary">
        <summary>
            <span class="show-es">Actividad del Coach IA en este navegador: ${Number(usage.requests)} solicitudes</span>
            <span class="lang-sep"> · </span>
            <span class="show-en">Live AI activity on this browser: ${Number(usage.requests)} requests</span>
        </summary>
        <div class="ai-activity-body">
            <p><span class="show-es">Resumen privado guardado solo en este navegador; no es una cuota ni una calificación.</span><span class="lang-sep"> · </span><span class="show-en">Private summary stored only on this browser; it is not a quota or a grade.</span></p>
            <div>Conversación · Conversation: ${count('conversation')} &nbsp;·&nbsp; Pasajes · Passages: ${count('passage_analysis')} &nbsp;·&nbsp; Borradores completos · Whole drafts: ${count('full_draft_review')} &nbsp;·&nbsp; Perspectiva final · Final perspective: ${count('capstone_review')} &nbsp;·&nbsp; Consejo de revisión · Review Council: ${count('council_reviewer') + count('council_synthesis')}</div>
            <div class="ai-activity-tokens">Uso agregado · Aggregate use: ${inputTokens.toLocaleString()} input tokens · ${outputTokens.toLocaleString()} output tokens</div>
        </div>
      </details>`;
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
Usé Tu Pana de Escritura, un coach de escritura bilingüe integrado en el proceso de redacción de mi trabajo escrito. / I used Tu Pana de Escritura, a bilingual writing coach integrated into the writing process for my written work.

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

=== 7. ¿Qué parte de tu trabajo final todavía suena más como tú? · What part of your final work still sounds most like you? ===
${ans('q7', '[PENDIENTE · PENDING: identifica el párrafo, oración o detalle que representa mejor tu voz / identify the paragraph, sentence, or detail that best represents your voice]')}

=== 8. Reflexión final · Final reflection ===
${maniSentence ? `Recuerdo lo que escribí en Tu Conocimiento: "${maniSentence}" / I remember what I wrote in Tu Conocimiento: "${maniSentence}"` : ''}
${ans('q8', '[PENDIENTE · PENDING: reflexiona sobre cómo tu conocimiento previo se refleja en tu trabajo / reflect on how your prior knowledge is reflected in your final work]')}

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
        return `${time} — ${d.q}: ${decisionRowLabel(d).es}`;
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

    const { accepted, questioned, thinking, checks } = tallyDecisions(decisions);
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
Decisiones de revisión · Revision decisions: ${decisions.length} total (${accepted} accepted, ${questioned} questioned, ${thinking} thinking${checks ? `, ${checks} revision checks` : ''})

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
    // Patch 7: delay cleanup — Safari needs time to process the download before the URL is revoked
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
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

// ════════════════════════════════════════════════════════
//  FINAL SUBMISSION PACKET  (Batch 5 — export simplification)
//  The pilot showed students submitting inconsistent artifacts (one a
//  report with no essay, one a report with only the FIRST draft). Root
//  cause: no export included the REVISED final essay — the student report
//  embedded tupana_draft (the locked Stage-6 first draft) and the
//  instructor report had no essay at all. getFinalEssay() resolves the
//  revised essay (latest revision-stage textarea, falling back to the
//  first draft) and buildSubmissionDiagnostic() flags missing-essay /
//  first-draft-only / blank-reflection / gate-not-passed so the student
//  is warned BEFORE submitting. One recommended path: the Final Packet.
// ════════════════════════════════════════════════════════
function getFinalEssay() {
    const read = k => { try { return localStorage.getItem(k) || ''; } catch(e) { return ''; } };
    const draft = read('tupana_draft');
    const normalizedDraft = normalizeRevisionText(draft);
    const candidates = [];
    for (const s of [7, 8, 9]) { const v = read('tupana_writing_s' + s); if (v.trim()) candidates.push({ text: v, stage: s }); }
    // Include unsaved work at every revision/finalization stage.
    try { if (D.draftArea && [7, 8, 9].includes(state.stage) && D.draftArea.value.trim()) candidates.push({ text: D.draftArea.value, stage: state.stage }); } catch(e) {}
    if (candidates.length) {
        // Prefer a genuine revision over a later stage that merely contains the
        // seeded first draft. Within that group, prefer the latest stage.
        candidates.forEach(c => { c.revised = normalizeRevisionText(c.text) !== normalizedDraft; });
        candidates.sort((a, b) => (Number(b.revised) - Number(a.revised)) || (b.stage - a.stage) || (b.text.length - a.text.length));
        const top = candidates[0];
        return { text: top.text, stage: top.stage, revised: top.revised };
    }
    if (draft.trim()) return { text: draft, stage: 6, revised: false };
    return { text: '', stage: 0, revised: false };
}

const REVISION_CHECKPOINT_KEY = 'tupana_revision_checkpoint';

function normalizeRevisionText(text) {
    return String(text || '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

function _revisionDraftSignature() {
    const text = normalizeRevisionText((() => { try { return localStorage.getItem('tupana_draft') || ''; } catch(e) { return ''; } })());
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return `${text.length}:${(hash >>> 0).toString(16)}`;
}

function getRevisionCheckpoint() {
    try { return JSON.parse(localStorage.getItem(REVISION_CHECKPOINT_KEY) || 'null'); } catch(e) { return null; }
}

function hasStudentReportedRevisionException() {
    const record = getRevisionCheckpoint();
    return !!(record &&
        ['student_reported_instructor_exception', 'instructor_exception'].includes(record.mode) &&
        String(record.note || '').trim().length >= 12 &&
        record.draftSignature === _revisionDraftSignature() &&
        String(record.assignmentId || '') === String((state && state.assignmentId) || ''));
}

function hasCompletionRevisionEvidence() {
    return getFinalEssay().revised || hasStudentReportedRevisionException();
}

let _revisionGateReturnFocus = null;
let _revisionGateKeydown = null;
function closeRevisionCompletionGate(returnFocus = true) {
    document.getElementById('revisionCompletionGate')?.remove();
    if (_revisionGateKeydown) {
        document.removeEventListener('keydown', _revisionGateKeydown);
        _revisionGateKeydown = null;
    }
    if (returnFocus && _revisionGateReturnFocus && document.contains(_revisionGateReturnFocus)) {
        _revisionGateReturnFocus.focus();
    }
}

function returnToRevisionFromGate() {
    closeRevisionCompletionGate(false);
    if (state.stage === 10) goToStage(9, { skipRevisionGate: true });
    if (window.innerWidth <= 480) switchMobileTab('draft');
    setTimeout(() => {
        D.draftArea?.focus();
        D.draftArea?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 120);
}

function openRevisionCompletionGate(continueAction) {
    document.getElementById('revisionCompletionGate')?.remove();
    _revisionGateReturnFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.id = 'revisionCompletionGate';
    overlay.className = 'toolkit-modal-bg revision-gate-bg';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'revisionGateTitle');
    overlay.innerHTML = `
        <div class="toolkit-modal-card revision-gate-card">
            <div class="toolkit-modal-top">
                <div>
                    <div class="revision-gate-eyebrow">Pausa de revisión · Revision checkpoint</div>
                    <h2 class="toolkit-modal-title" id="revisionGateTitle">Antes de tu cierre de proceso · Before your writing snapshot</h2>
                </div>
                <button class="toolkit-close" type="button" aria-label="Cerrar · Close">×</button>
            </div>
            <p><strong>No encontramos una versión diferente todavía.</strong> Tu primer borrador sigue protegido. Para continuar, guarda una versión con cambios que puedas explicar en tu reflexión final.</p>
            <p class="revision-gate-en">We have not detected a changed version yet. Your first draft remains protected. To continue, save a version with changes you can explain in your final reflection.</p>
            <button class="revision-gate-primary" type="button">Volver a revisar · Return to revise</button>
            <details class="revision-exception">
                <summary>Mi instructor/a indicó que no necesito una versión revisada · My instructor said I do not need a revised version</summary>
                <p>Usa esta opción solo si recibiste esa indicación. Tu reporte la mostrará como una declaración tuya, no como una aprobación verificada por Tu Pana.</p>
                <label for="revisionExceptionNote">Nota breve · Brief note</label>
                <textarea id="revisionExceptionNote" rows="2" placeholder="Ej.: Mi instructor me indicó que entregue esta versión."></textarea>
                <label class="revision-exception-check"><input id="revisionExceptionConfirm" type="checkbox"> Confirmo que esta es mi declaración y que Tu Pana no la verifica. · I confirm this is my statement and Tu Pana does not verify it.</label>
                <div class="revision-exception-error" role="alert" hidden>Escribe una nota breve y marca la confirmación. · Add a brief note and check the confirmation.</div>
                <button class="revision-gate-secondary" type="button">Registrar excepción y continuar · Record exception and continue</button>
            </details>
        </div>`;

    const close = () => closeRevisionCompletionGate(true);
    overlay.querySelector('.toolkit-close').addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    overlay.querySelector('.revision-gate-primary').addEventListener('click', returnToRevisionFromGate);
    overlay.querySelector('.revision-gate-secondary').addEventListener('click', () => {
        const note = overlay.querySelector('#revisionExceptionNote').value.trim();
        const confirmed = overlay.querySelector('#revisionExceptionConfirm').checked;
        const error = overlay.querySelector('.revision-exception-error');
        if (note.length < 12 || !confirmed) {
            error.hidden = false;
            (note.length < 12 ? overlay.querySelector('#revisionExceptionNote') : overlay.querySelector('#revisionExceptionConfirm')).focus();
            return;
        }
        try {
            localStorage.setItem(REVISION_CHECKPOINT_KEY, JSON.stringify({
                mode: 'student_reported_instructor_exception',
                note,
                timestamp: new Date().toISOString(),
                assignmentId: String((state && state.assignmentId) || ''),
                draftSignature: _revisionDraftSignature()
            }));
        } catch(e) {}
        logProcessEvent('revision_exception_recorded', 'Student reported an instructor-directed revision exception before Stage 10; not independently verified.');
        closeRevisionCompletionGate(false);
        if (typeof continueAction === 'function') continueAction();
    });

    const onKey = event => {
        if (!document.getElementById('revisionCompletionGate')) {
            document.removeEventListener('keydown', onKey);
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            document.removeEventListener('keydown', onKey);
            close();
        } else if (event.key === 'Tab') {
            const focusable = Array.from(overlay.querySelectorAll('button, summary, textarea, input')).filter(node => !node.disabled);
            const first = focusable[0], last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    };
    _revisionGateKeydown = onKey;
    document.addEventListener('keydown', _revisionGateKeydown);
    document.body.appendChild(overlay);
    setTimeout(() => overlay.querySelector('.revision-gate-primary')?.focus(), 80);
}

function buildSubmissionDiagnostic() {
    const warnings = [];
    const essay = getFinalEssay();
    const draftSaved = (() => { try { return localStorage.getItem('tupana_draft_saved') === 'true'; } catch(e) { return false; } })();
    const decisions = (() => { try { return JSON.parse(localStorage.getItem('tupana_decisions') || '[]'); } catch(e) { return []; } })();
    const rs = reflectionStatus();
    if (!essay.text.trim()) {
        warnings.push({ es: 'No se encontró tu trabajo escrito. Escribe y guarda tu trabajo antes de entregar.', en: 'No written work found — write and save your work before submitting.' });
    } else if (!essay.revised) {
        // Milestone 4's name resolves through msLabel so CAP 200 / Research students
        // are pointed at THEIR revision milestone, not the default essay name.
        const _m4 = msLabel(MILESTONES[3]);
        if (!hasStudentReportedRevisionException()) {
            warnings.push({ es: `Solo se encontró tu PRIMER borrador — tu versión revisada no aparece. Revisa en "${_m4.es}" antes de entregar.`, en: `Only your FIRST draft was found — your revised version is missing. Revise in "${_m4.en}" before submitting.` });
        }
    }
    if (!draftSaved) warnings.push({ es: 'La puerta de autoría no está documentada: no guardaste tu primer borrador sin ayuda.', en: 'Authorship gate not documented: your unassisted first draft was not saved.' });
    if (rs.status === 'BLANK') warnings.push({ es: 'No completaste ninguna reflexión del proceso.', en: 'No process reflection completed yet.' });
    if (!decisions.length) warnings.push({ es: 'No hay decisiones de revisión registradas todavía.', en: 'No revision decisions recorded yet.' });
    return { ok: warnings.length === 0, warnings, essay, rs };
}

// Bilingual diagnostic banner for the Save/Export modal.
function buildPacketDiagnosticHTML() {
    const d = buildSubmissionDiagnostic();
    if (d.ok) {
        return `<div class="packet-diag packet-diag--ok" role="status">` +
            `<span class="show-es">✓ Tu paquete está listo para entregar.</span>` +
            `<span class="lang-sep"> · </span>` +
            `<span class="show-en">✓ Your packet is ready to submit.</span></div>`;
    }
    const items = d.warnings.map(w =>
        `<li><span class="show-es">${escapeHtml(w.es)}</span><span class="lang-sep"> · </span><span class="show-en">${escapeHtml(w.en)}</span></li>`
    ).join('');
    return `<div class="packet-diag packet-diag--warn" role="alert">` +
        `<div class="packet-diag-title"><span class="show-es">Revisa antes de entregar</span><span class="lang-sep"> · </span><span class="show-en">Check before you submit</span></div>` +
        `<ul class="packet-diag-list">${items}</ul></div>`;
}

// One recommended export: the complete packet (essay + process report).
// generateInstructorReport() now includes the Submission Check + Final Essay,
// so it IS the packet; copy/download both use it.
function exportFinalPacket() {
    const text = generateInstructorReport();
    const diag = buildSubmissionDiagnostic();
    const okMsg = 'Paquete final copiado. Pégalo y entrégalo en Brightspace.\nFinal packet copied. Paste and submit it in Brightspace.';
    const warnMsg = 'Paquete final copiado — pero revisa esto antes de entregar:\nFinal packet copied — but review this before submitting:\n\n' +
        diag.warnings.map(w => '• ' + w.en).join('\n');
    navigator.clipboard.writeText(text)
        .then(() => alert(diag.ok ? okMsg : warnMsg))
        .catch(() => window.prompt(t('Copia este texto · Copy this text:', 'Copy this text:'), text));
}
function downloadFinalPacket() {
    const text = generateInstructorReport();
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `tupana-final-packet-${date}.txt`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
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

    const { accepted, questioned, thinking, checks } = tallyDecisions(decisions);
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
    const revisionException = hasStudentReportedRevisionException() ? getRevisionCheckpoint() : null;

    const line = (n) => '='.repeat(n);

    let r = '';
    r += `${line(72)}\n`;
    r += `  STUDENT WRITING PROCESS REPORT\n`;
    r += `  Tu Pana de Escritura — CUNY Hostos Community College\n`;
    r += `  Generated: ${dateStr} at ${timeStr}\n`;
    r += `${line(72)}\n\n`;

    // Batch 6 — compact instructor at-a-glance summary (one scan, no scrolling)
    const _sumDraftSaved = (() => { try { return localStorage.getItem('tupana_draft_saved') === 'true'; } catch(e) { return false; } })();
    const _sumStages = Array.from({ length: 10 }, (_, i) => i + 1).filter(i => state.done.has(i) || i < state.stage);
    const _sumRs   = reflectionStatus();
    const _sumDiag = buildSubmissionDiagnostic();
    r += `AT-A-GLANCE SUMMARY  [System-recorded]\n`;
    r += `${line(40)}\n`;
    r += `Process report present : Yes\n`;
    r += `Authorship gate        : ${_sumDraftSaved ? 'PASSED' : 'NOT DOCUMENTED'}\n`;
    r += `Final written work     : ${_sumDiag.essay.text.trim() ? (_sumDiag.essay.revised ? 'Changed draft present' : (revisionException ? 'Student-reported instructor exception' : 'First draft only')) : 'Not found'}\n`;
    r += `Milestones completed   : ${milestonesCompletedCount()} of ${TOTAL_MILESTONES}\n`;
    r += `Internal stages done   : ${_sumStages.length} of 10${_sumStages.length ? ' (' + _sumStages.join(',') + ')' : ''}\n`;
    r += `Reflection             : ${_sumRs.status} (${_sumRs.filled}/${_sumRs.total})\n`;
    r += `Submission diagnostic  : ${_sumDiag.ok ? 'READY — no issues detected' : _sumDiag.warnings.length + ' item(s) to review (see Submission Check)'}\n\n`;

    r += `STUDENT INFORMATION\n`;
    r += `${line(40)}\n`;
    r += `Name / Identifier : ${na(meta.studentName, 'Not provided')}\n`;
    r += `Assignment Title  : ${na(meta.assignmentTitle, 'Not provided')}\n`;
    r += `Course / Section  : ${na(meta.courseSection, 'Not provided')}\n\n`;

    // Batch 5: Submission Check + Final Essay lead the packet, so the single
    // artifact a student submits already contains the revised essay and flags
    // any missing piece (the pilot's "first draft only / no essay" problem).
    const _essay = getFinalEssay();
    const _diag  = buildSubmissionDiagnostic();
    r += `${line(72)}\n`;
    r += `SUBMISSION CHECK  [System-recorded]\n`;
    r += `${line(72)}\n`;
    if (_diag.ok) {
        r += `Ready to submit — no issues detected.\n\n`;
    } else {
        r += `Review before submitting:\n`;
        _diag.warnings.forEach(w => { r += `  ! ${w.en}\n`; });
        r += `\n`;
    }

    r += `${line(72)}\n`;
    r += `FINAL WRITTEN WORK  [Student work — ${_essay.revised ? 'changed draft detected' : (revisionException ? 'student-reported instructor exception' : (_essay.stage === 6 ? 'FIRST DRAFT ONLY — no changed version detected' : 'none found'))}]\n`;
    r += `${line(72)}\n`;
    r += (_essay.text.trim()
        ? `${_essay.text.trim()}\n\n`
        : `[No written work found — student has not written or saved draft text]\n\n`);
    if (revisionException) {
        r += `REVISION EXCEPTION  [Student statement — not independently verified]\n`;
        r += `Student statement about instructor direction: ${revisionException.note}\n`;
        r += `Recorded: ${revisionException.timestamp || 'timestamp unavailable'}\n\n`;
    }

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
    r += `  ✓ Accepted                       : ${accepted}\n`;
    r += `  ? Thinking more about            : ${thinking}\n`;
    r += `  ✗ Questioned / flagged           : ${questioned}\n`;
    r += `  ◆ Revision checks (Pause-and-Reflect) : ${checks}\n`;
    if (decisions.length) {
        r += `\nDecision log (most recent first, up to 20):\n`;
        decisions.slice(-20).reverse().forEach((d, i) => {
            const ts = d.t ? new Date(d.t).toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true }) : '';
            r += `  ${i + 1}. ${decisionRowLabel(d).plain} — "${d.q}"${ts ? ' (' + ts + ')' : ''}\n`;
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
    r += `SECTION 5 — PROCESS REFLECTIONS  [Student-written]\n`;
    r += `${line(72)}\n`;
    const rs = reflectionStatus();
    r += `Reflection status : ${rs.status} (${rs.filled} of ${rs.total} in-flow reflections completed)\n\n`;
    r += `In-flow reflections (captured during the writing journey):\n`;
    r += `  • Main idea after first draft   : ${na(pnAnswers.mr_main_idea, '[blank]')}\n`;
    r += `  • What changed after revision   : ${na(pnAnswers.mr_changed, '[blank]')}\n`;
    r += `  • What still needs work (pre-submit) : ${na(pnAnswers.mr_needs_work, '[blank]')}\n\n`;
    r += `Deeper Process Note (Q3–Q8, optional — filled via the Process Note button;\n`;
    r += `"[Not filled in]" means the student has not completed it, not a system error):\n\n`;
    const q3 = na(pnAnswers.q3); const q4 = na(pnAnswers.q4);
    const q5 = na(pnAnswers.q5); const q6 = na(pnAnswers.q6);
    const q7 = na(pnAnswers.q7); const q8 = na(pnAnswers.q8);
    r += `Q3. What kind of AI help did you receive?\n${q3}\n\n`;
    r += `Q4. What suggestion did you accept and why?\n${q4}\n\n`;
    r += `Q5. What suggestion did you reject or modify?\n${q5}\n\n`;
    r += `Q6. How did you protect your own voice?\n${q6}\n\n`;
    r += `Q7. What part of your final work still sounds most like you?\n${q7}\n\n`;
    r += `Q8. Final reflection (prior knowledge, community, language):\n${q8}\n\n`;

    r += `${line(72)}\n`;
    r += `SECTION 6 — SELF-ASSESSMENT  [Student-written, Stage 10]\n`;
    r += `${line(72)}\n`;
    r += `10A — Evidence-First Reflections (required)\n`;
    r += `One thing I improved:\n${naOpt(reflections.improved)}\n\n`;
    r += `One thing that still needs work:\n${naOpt(reflections.needs)}\n\n`;
    r += `One decision I made to protect my voice:\n${naOpt(reflections.voice)}\n\n`;
    r += `10A — Optional Self-Check Ratings\n`;
    CAPSTONE_CRITERIA.forEach(c => {
        r += `  ${c.en.padEnd(36)} : ${ratingLabel(ratings[c.key])}\n`;
    });
    r += `\n`;

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
    // H5 (Stage A.2 polish): the first-draft attestation is a REAL attestation tied to
    // the recorded gate status — not an unconditional system stamp. When the unassisted
    // first draft was not saved, it must not falsely claim completion (which contradicted
    // Section 1's honest "NOT DOCUMENTED"). The remaining lines are general attestations.
    r += draftSaved
        ? `☑  I completed my first draft before using AI feedback.\n`
        : `☐  I completed my first draft before using AI feedback.\n` +
          `   — NOT documented: no unassisted first draft was saved in the app (see Section 1).\n`;
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
    if (!hasCompletionRevisionEvidence()) {
        closeCapstoneModal({ suppressCompletion: true });
        openRevisionCompletionGate(() => {
            openCapstoneModal();
            injectInstructorReportPanel(scrollTo);
        });
        return;
    }
    if (document.getElementById('instrReportPanel')) {
        if (scrollTo) {
            openCapstoneModal();
            const mb = el('capstoneModalBody');
            setTimeout(() => { mb.scrollTop = mb.scrollHeight; }, 150);
        }
        return;
    }

    const meta = loadReportMeta();
    const draftSaved = (() => { try { return localStorage.getItem('tupana_draft_saved') === 'true'; } catch(e) { return false; } })();
    const decisions  = (() => { try { return JSON.parse(localStorage.getItem('tupana_decisions') || '[]'); } catch(e) { return []; } })();
    const chatLog    = (() => { try { return JSON.parse(localStorage.getItem(CHAT_LOG_KEY) || '[]'); } catch(e) { return []; } })();
    const protected_ = loadProtected();
    const { accepted, questioned, thinking, checks } = tallyDecisions(decisions);
    const botMsgs    = chatLog.filter(m => m.who === 'bot').length;
    const draft      = (() => { try { return localStorage.getItem('tupana_draft') || ''; } catch(e) { return ''; } })();
    const wc         = draft.trim().split(/\s+/).filter(Boolean).length;
    const finalStageObj = STAGES[state.stage - 1];
    const finalStageName = finalStageObj ? `${state.stage} — ${finalStageObj.en}` : state.stage;
    const stagesDone = Array.from({ length: 10 }, (_,i) => i + 1).filter(i => state.done.has(i) || i < state.stage);
    const rs = reflectionStatus();

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
            <span class="show-es">Revisa este reporte antes de entregarlo. Cópialo o descárgalo y entrégalo en Brightspace junto con tu trabajo escrito.</span>
            <span class="lang-sep"> · </span>
            <span class="show-en">Review this report before submitting. Copy or download it and submit it in Brightspace with your written work.</span>
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
                placeholder="Título de la tarea · Assignment title..."
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
                <span class="instr-evidence-val">${decisions.length} total — ${accepted} accepted · ${thinking} reconsidered · ${questioned} questioned${checks ? ` · ${checks} revision checks` : ''}</span>
            </div>
            <div class="instr-evidence-row" role="listitem">
                <span class="instr-evidence-key"><span class="show-es">Frases protegidas (Bóveda de voz)</span><span class="lang-sep"> · </span><span class="show-en">Voice Vault phrases</span></span>
                <span class="instr-evidence-val">${protected_.length ? protected_.length + ' phrase' + (protected_.length > 1 ? 's' : '') : 'None recorded'}</span>
            </div>
            <div class="instr-evidence-row" role="listitem">
                <span class="instr-evidence-key"><span class="show-es">Reflexión del proceso</span><span class="lang-sep"> · </span><span class="show-en">Process reflection</span></span>
                <span class="instr-evidence-val ${rs.status === 'COMPLETED' ? 'ok' : rs.status === 'BLANK' ? 'warn' : ''}">${rs.status} — ${rs.filled}/${rs.total}</span>
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
            <span class="show-es">Copia o descarga este reporte y entrégalo en Brightspace junto con tu trabajo escrito, según las instrucciones de tu profesor/a. Esta aplicación <em>no entrega automáticamente</em> a Brightspace.</span>
            <span class="lang-sep"> · </span>
            <span class="show-en">Copy or download this report and submit it in Brightspace with your assignment as instructed by your professor. This app does <em>not</em> submit directly to Brightspace.</span>
        </div>`;

    el('capstoneModalBody').appendChild(panel);
    openCapstoneModal();

    // Generate initial preview
    refreshInstrPreview();

    if (scrollTo) {
        const mb = el('capstoneModalBody');
        setTimeout(() => { mb.scrollTop = mb.scrollHeight; }, 150);
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
    // Patch 7: delay cleanup — Safari needs time to process the download before the URL is revoked
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
}
function downloadInstructorReport()   { _downloadInstrAs('txt', 'text/plain'); }
// Patch 7: use text/plain for .md — Safari does not recognize text/markdown as a downloadable type
function downloadInstructorReportMd() { _downloadInstrAs('md',  'text/plain'); }

/* ─────────────────────────────────────────────────────────────
   Mi Toolkit · My Writing Toolkit
   Shows locally stored learning artifacts and provides the optional,
   no-AI Tu Conocimiento entry point. No provider changes.
───────────────────────────────────────────────────────────── */
function openToolkitPanel() {
    document.getElementById('toolkitModal')?.remove();
    const returnFocus = document.activeElement;

    const claimed = getClaimedAssets();
    let sentence = '';
    try { sentence = localStorage.getItem('tupana_mani_sentence') || ''; } catch(e) {}

    const TOOLKIT_ICONS = {
        languages:    'language-bridge',
        community:    'community-map',
        journey:      'footsteps',
        positionality: 'positionality-compass',
        story:        'luminous-page'
    };

    const assetsHtml = MANI_ORDER.map(key => {
        const def = MANI_ASSET_DEFS[key];
        const isClaimed = claimed.includes(key);
        return `<div class="toolkit-asset-chip ${isClaimed ? 'toolkit-asset-claimed' : 'toolkit-asset-unclaimed'}" aria-label="${escapeHtml(def.nameEn)}${isClaimed ? ', claimed' : ', not yet claimed'}">
            ${getIcon(TOOLKIT_ICONS[key], 28, true)}
            <div class="toolkit-asset-body">
                <div class="toolkit-asset-name"><span class="show-es">${escapeHtml(def.nameEs)}</span><span class="lang-sep"> · </span><span class="show-en">${escapeHtml(def.nameEn)}</span></div>
                <div class="toolkit-asset-desc"><span class="show-es">${escapeHtml(def.toastEs)}</span><span class="lang-sep"> · </span><span class="show-en">${escapeHtml(def.toastEn)}</span></div>
            </div>
            ${isClaimed ? '<span class="toolkit-asset-check" aria-hidden="true">✓</span>' : ''}
        </div>`;
    }).join('');

    const claimHtml = sentence
        ? `<blockquote class="toolkit-claim-text">${escapeHtml(sentence)}</blockquote>
           <button type="button" class="toolkit-knowledge-btn" id="toolkitKnowledgeBtn"><span class="show-es">Volver a Tu Conocimiento</span><span class="lang-sep"> · </span><span class="show-en">Revisit Tu Conocimiento</span></button>`
        : `<p class="toolkit-claim-empty"><span class="show-es">Esta actividad opcional te ayuda a nombrar los idiomas, experiencias y conocimientos que traes a tu escritura. No usa IA.</span><span class="lang-sep"> · </span><span class="show-en">This optional activity helps you name the languages, experiences, and knowledge you bring to your writing. It does not use AI.</span></p>
           <button type="button" class="toolkit-knowledge-btn" id="toolkitKnowledgeBtn"><span class="show-es">Explorar Tu Conocimiento</span><span class="lang-sep"> · </span><span class="show-en">Explore Tu Conocimiento</span></button>`;

    // Build Skills HTML from tupana_skills_acquired — writing-process skills by stage entry.
    // Stage 6 requires executeSave(); all others unlock on first entry.
    let skillsHtml = '';
    try {
        const acquired = new Set(getAcquiredSkills());
        const earnedDefs = STAGE_SKILL_DEFS.filter(s => acquired.has(s.skillId));
        if (earnedDefs.length === 0) {
            skillsHtml = `<p class="toolkit-skills-empty"><span class="show-es">Las habilidades de escritura que practicas aparecerán aquí a medida que avanzas por las etapas.</span><span class="lang-sep"> · </span><span class="show-en">Writing skills you practice will appear here as you move through the stages.</span></p>`;
        } else {
            skillsHtml = earnedDefs.map(s => `<div class="toolkit-skill-gain" aria-label="${escapeHtml(s.labelEn)}, practicado · practiced">
                <span class="toolkit-skill-check" aria-hidden="true">✓</span>
                <span class="toolkit-skill-gain-name"><span class="show-es">${escapeHtml(s.labelEs)}</span><span class="lang-sep"> · </span><span class="show-en">${escapeHtml(s.labelEn)}</span></span>
            </div>`).join('');
        }
    } catch(e) { skillsHtml = ''; }

    const overlay = document.createElement('div');
    overlay.className = 'toolkit-modal-bg';
    overlay.id = 'toolkitModal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'toolkitModalTitle');

    overlay.innerHTML = `<div class="toolkit-modal-card">
        <div class="toolkit-modal-top">
            <h2 id="toolkitModalTitle" class="toolkit-modal-title">
                <span class="show-es">Mi Toolkit</span><span class="lang-sep"> · </span><span class="show-en">My Writing Toolkit</span>
            </h2>
            <button class="toolkit-close" aria-label="Cerrar · Close">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>
            </button>
        </div>
        <div class="toolkit-section">
            <div class="toolkit-section-title"><span class="show-es">Lo que traigo</span><span class="lang-sep"> · </span><span class="show-en">What I Bring</span></div>
            <div class="toolkit-asset-list">${assetsHtml}</div>
        </div>
        <div class="toolkit-claim-block">
            <div class="toolkit-claim-label"><span class="show-es">Mi punto de partida</span><span class="lang-sep"> · </span><span class="show-en">My starting point</span></div>
            ${claimHtml}
        </div>
        <div class="toolkit-section">
            <div class="toolkit-section-title"><span class="show-es">Habilidades practicadas en este trabajo</span><span class="lang-sep"> · </span><span class="show-en">Skills practiced in this work</span></div>
            ${skillsHtml}
        </div>
        <div class="toolkit-section">
            <div class="toolkit-section-title"><span class="show-es">Más allá de este trabajo</span><span class="lang-sep"> · </span><span class="show-en">Beyond This Work</span></div>
            <p class="toolkit-transfer-intro"><span class="show-es">Habilidades de alfabetización de IA que puedes usar en otras clases, trabajos y situaciones digitales cotidianas.</span><span class="lang-sep"> · </span><span class="show-en">AI literacy skills you can use in other classes, jobs, and everyday digital life.</span></p>
            <div class="toolkit-transfer-card">
                <div class="toolkit-transfer-principle"><span class="show-es">La IA no es una fuente.</span><span class="lang-sep"> · </span><span class="show-en">AI is not a source.</span></div>
                <div class="toolkit-transfer-skill"><span class="show-es">Puedo verificar las afirmaciones de la IA antes de confiar en ellas o usarlas.</span><span class="lang-sep"> · </span><span class="show-en">I can check AI claims before trusting or using them.</span></div>
            </div>
            <div class="toolkit-transfer-card">
                <div class="toolkit-transfer-principle"><span class="show-es">La IA puede sonar neutral, pero no es neutral.</span><span class="lang-sep"> · </span><span class="show-en">AI may sound neutral, but it is not neutral.</span></div>
                <div class="toolkit-transfer-skill"><span class="show-es">Puedo notar cuándo un consejo de IA refleja sesgos o ideas dominantes sobre el lenguaje, la cultura, la raza, la clase, el género, la inmigración o lo que cuenta como escritura "correcta."</span><span class="lang-sep"> · </span><span class="show-en">I can notice when AI advice may reflect bias or dominant assumptions about language, culture, race, class, gender, immigration, or what counts as "correct" writing.</span></div>
            </div>
            <div class="toolkit-transfer-card">
                <div class="toolkit-transfer-principle"><span class="show-es">No todo debe compartirse en un prompt.</span><span class="lang-sep"> · </span><span class="show-en">Not everything belongs in a prompt.</span></div>
                <div class="toolkit-transfer-skill"><span class="show-es">Puedo decidir qué información personal o sensible no debo compartir con una herramienta de IA.</span><span class="lang-sep"> · </span><span class="show-en">I can decide what personal or sensitive information should not be shared with an AI tool.</span></div>
            </div>
            <div class="toolkit-transfer-card">
                <div class="toolkit-transfer-principle"><span class="show-es">Usa la IA sin renunciar a tu criterio.</span><span class="lang-sep"> · </span><span class="show-en">Use AI without surrendering judgment.</span></div>
                <div class="toolkit-transfer-skill"><span class="show-es">Puedo usar la IA como apoyo sin dejar que reemplace mi pensamiento, mi voz o mis decisiones.</span><span class="lang-sep"> · </span><span class="show-en">I can use AI for support without letting it replace my thinking, my voice, or my decisions.</span></div>
            </div>
            <div class="toolkit-transfer-card">
                <div class="toolkit-transfer-principle"><span class="show-es">Pregúntate si la IA corresponde a esta situación.</span><span class="lang-sep"> · </span><span class="show-en">Ask whether AI belongs in this situation.</span></div>
                <div class="toolkit-transfer-skill"><span class="show-es">Puedo decidir si usar IA es apropiado, permitido, útil, justo y seguro en un contexto específico.</span><span class="lang-sep"> · </span><span class="show-en">I can decide whether using AI is appropriate, allowed, useful, fair, and safe in a specific context.</span></div>
            </div>
        </div>
    </div>`;

    const closeModal = (restoreFocus = true) => {
        overlay.remove();
        document.removeEventListener('keydown', onEsc);
        if (restoreFocus && returnFocus && document.contains(returnFocus)) returnFocus.focus();
    };
    const onEsc = e => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeModal();
        } else if (e.key === 'Tab') {
            const focusable = getDialogFocusables(overlay);
            const first = focusable[0], last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
    };
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    overlay.querySelector('.toolkit-close').addEventListener('click', closeModal);
    overlay.querySelector('#toolkitKnowledgeBtn')?.addEventListener('click', () => {
        closeModal(false);
        openMani({ standalone: true });
    });
    document.addEventListener('keydown', onEsc);

    document.body.appendChild(overlay);
    setTimeout(() => overlay.querySelector('.toolkit-close')?.focus(), 120);
}

/* ─────────────────────────────────────────────────────────────
   Help / Orientation panel
   Non-AI, static. Opens via ? button in header.
   Reuses toolkit-modal-bg / toolkit-modal-card patterns.
───────────────────────────────────────────────────────────── */
function openHelpPanel() {
    document.getElementById('helpModal')?.remove();
    const returnFocus = document.activeElement;

    // Current-position line in journey vocabulary (IA Sprint Batch 4): milestone
    // (the journey view) + step, both profile-aware via msLabel/stLabel.
    const curMs = milestoneForStage(state.stage);
    const curMsL = msLabel(curMs);
    const curStL = stLabel(state.stage);
    const stageLineHtml = `<span class="show-es">Hito ${curMs.n}: ${escapeHtml(curMsL.es)} — Paso ${state.stage}: <strong>${escapeHtml(curStL.es.replace(/\n/g, ' '))}</strong></span><span class="lang-sep"> · </span><span class="show-en">Milestone ${curMs.n}: ${escapeHtml(curMsL.en)} — Step ${state.stage}: <strong>${escapeHtml(curStL.en.replace(/\n/g, ' '))}</strong></span>`;

    const STAGE_HELP = [
        { es: 'Escribe un recuerdo personal o un momento de identidad en el idioma que más natural te salga.', en: 'Write a personal memory or identity moment in the language that feels most real.' },
        { es: 'Conecta tu recuerdo con un contexto histórico, social o cultural más amplio.', en: 'Connect your memory to a larger historical, social, or cultural context.' },
        { es: 'Escribe 4–6 oraciones que expliquen tu argumento y por qué importa.', en: 'Write 4–6 sentences explaining your argument and why it matters.' },
        { es: 'Busca fuentes. El coach sugiere direcciones; tú buscas y evalúas.', en: 'Find sources. The coach suggests directions; you search and evaluate.' },
        { es: 'Crea tu propio esquema. El coach puede darte retroalimentación sobre la estructura — tú escribes el esquema.', en: 'Create your own outline. The coach can give feedback on structure — you write the outline.' },
        { es: 'Escribe tu borrador completo sin ayuda del coach. Esta es la puerta de autoría — solo tú escribes este borrador. Al guardarlo, desbloqueas el apoyo de revisión.', en: 'Write your complete first draft without AI help. This is the authorship gate — only you write this draft. Saving it unlocks revision support.' },
        { es: 'Revisa con un enfoque: argumento, evidencia o estructura.', en: 'Revise with a focus: argument, evidence, or structure.' },
        { es: 'Fortalece tu voz y estilo. El coach no reescribirá tu texto.', en: 'Strengthen your voice and style. The coach will not rewrite for you.' },
        { es: 'Reflexiona sobre tu proceso de escritura desde la Etapa 1 hasta ahora.', en: 'Reflect on your writing journey from Stage 1 to now.' },
        { es: 'Finaliza, haz tu autoevaluación y responde a la perspectiva del coach sobre tu ensayo.', en: 'Finalize, self-assess, and respond to the coach\'s perspective on your essay.' },
    ];

    // Milestone-grouped stage list (IA Sprint Batch 4): the SAME 10 stages, now
    // grouped under the visible 5-milestone journey vocabulary. msLabel/stLabel
    // keep both levels profile-aware; per-stage descriptions use the active
    // profile's task cue (getStageStepOverride) when one exists, else the default
    // STAGE_HELP text. Pedagogy unchanged: still exactly 10 .help-stage-item rows.
    const stageListHtml = MILESTONES.map((ms) => {
        const mL = msLabel(ms);
        const items = ms.ids.map((id) => {
            const s = stLabel(id);
            const step = (typeof getStageStepOverride === 'function') ? getStageStepOverride(id, 0, state.assignmentId) : null;
            const h = step || STAGE_HELP[id - 1] || { es: '', en: '' };
            const isCurrent = id === state.stage;
            return `<li class="help-stage-item${isCurrent ? ' help-stage-current' : ''}">
            <span class="help-stage-num">${id}.</span>
            <span><strong><span class="show-es">${escapeHtml(s.es.replace(/\n/g, ' '))}</span><span class="lang-sep"> · </span><span class="show-en">${escapeHtml(s.en.replace(/\n/g, ' '))}</span></strong><br><span class="show-es" style="color:var(--text-muted)">${escapeHtml(h.es)}</span><span class="lang-sep" style="color:var(--text-muted)"> · </span><span class="show-en" style="color:var(--text-muted)">${escapeHtml(h.en)}</span></span>
        </li>`;
        }).join('');
        return `<li class="help-milestone-group" style="list-style:none">
            <div class="help-milestone-head" style="margin:10px 0 4px;font-size:0.78rem;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--amber-text)"><span class="show-es">Hito ${ms.n}: ${escapeHtml(mL.es)}</span><span class="lang-sep"> · </span><span class="show-en">Milestone ${ms.n}: ${escapeHtml(mL.en)}</span></div>
            <ul class="help-stage-sublist" style="list-style:none;margin:0;padding:0">${items}</ul>
        </li>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'toolkit-modal-bg';
    overlay.id = 'helpModal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'helpModalTitle');

    overlay.innerHTML = `<div class="toolkit-modal-card help-modal-card">
        <div class="toolkit-modal-top">
            <h2 id="helpModalTitle" class="toolkit-modal-title">
                <span class="show-es">Cómo funciona Tu Pana</span><span class="lang-sep"> · </span><span class="show-en">How Tu Pana Works</span>
            </h2>
            <button class="toolkit-close" aria-label="Cerrar · Close">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>
            </button>
        </div>
        <div class="help-current-stage">${stageLineHtml}</div>
        <!-- Context-Collapse sprint D: help sections are native disclosures (closed
             by default; intro + privacy ship open) so the panel scans as a list of
             titles first — no storage, no custom handlers, keyboard-native. -->
        <details class="help-section" open>
            <summary class="help-section-title"><span class="show-es">¿Qué es Tu Pana?</span><span class="lang-sep"> · </span><span class="show-en">What is Tu Pana?</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <div class="help-section-body"><span class="show-es">Tu Pana de Escritura es tu coach de escritura. Te guía etapa por etapa en tu trabajo de escritura usando IA como herramienta de apoyo — tú tomas las decisiones.</span><span class="lang-sep"> · </span><span class="show-en">Tu Pana de Escritura is your writing coach. It guides you stage by stage through your writing using AI as a support tool — you make the decisions.</span></div>
        </details>
        <details class="help-section">
            <summary class="help-section-title"><span class="show-es">¿Qué pasa al inicio?</span><span class="lang-sep"> · </span><span class="show-en">What happens at the start?</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <div class="help-section-body"><span class="show-es">En tu primera visita verás una bienvenida breve y podrás empezar a escribir de inmediato. La guía de las Cinco Preguntas es opcional y te permite practicar cómo evaluar una respuesta de IA.<br><br><strong>Tu Conocimiento</strong> también es opcional. Puedes abrirlo en <strong>Mi Toolkit</strong> cuando quieras para nombrar los idiomas, experiencias y conocimientos que traes a tu escritura. Esta actividad no usa IA.</span><span class="lang-sep"> · </span><span class="show-en">On your first visit, you will see a short welcome and may start writing immediately. The Five Questions guide is optional and lets you practice evaluating an AI response.<br><br><strong>Tu Conocimiento</strong> is optional too. Open it from <strong>My Toolkit</strong> whenever you want to name the languages, experiences, and knowledge you bring to your writing. This activity does not use AI.</span></div>
        </details>
        <details class="help-section">
            <summary class="help-section-title"><span class="show-es">¿Cómo envío un mensaje?</span><span class="lang-sep"> · </span><span class="show-en">How do I send a message?</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <div class="help-section-body"><span class="show-es">Escribe tu pregunta o texto en el cuadro de chat y presiona Enviar (o Enter). El coach responderá en unos segundos.</span><span class="lang-sep"> · </span><span class="show-en">Type your question or text in the chat box and press Send (or Enter). The coach will reply in a few seconds.</span></div>
        </details>
        <details class="help-section">
            <summary class="help-section-title"><span class="show-es">Idioma y modos de lengua</span><span class="lang-sep"> · </span><span class="show-en">Language and language modes</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <div class="help-section-body"><span class="show-es">Puedes escribir en español, inglés o los dos — tu idioma es válido aquí.<br><br>Usa los botones <strong>Español · English · ES-EN</strong> para cambiar el idioma de la interfaz. El modo ES-EN muestra el texto en ambos idiomas.<br><br>Tu Pana apoya completamente el español y el inglés. Si te sientes más cómodo/a usando otro idioma que puedas escribir con tu teclado, puedes intentarlo con el Coach IA; cuando sea posible, el coach responderá en ese idioma. La interfaz y la Guía sin IA están disponibles solo en español e inglés.<br><br>Nota: la narración de audio está disponible actualmente solo en español.</span><span class="lang-sep"> · </span><span class="show-en">You can write in Spanish, English, or both — your language is valid here.<br><br>Use the <strong>Español · English · ES-EN</strong> buttons to change the interface language. ES-EN mode shows text in both languages.<br><br>Tu Pana fully supports Spanish and English. If you feel more comfortable using another language that you can type with your keyboard, you may try it with the Live AI coach; when possible, the coach will respond in that language. The interface and the Built-in, no AI guide are available in Spanish and English only.<br><br>Note: audio narration is currently available in Spanish only.</span></div>
        </details>
        <details class="help-section">
            <summary class="help-section-title"><span class="show-es">Narración de audio</span><span class="lang-sep"> · </span><span class="show-en">Audio narration</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <div class="help-section-body"><span class="show-es">En la bienvenida y las actividades opcionales Tu Conocimiento y Cinco Preguntas, verás botones <strong>Escuchar</strong>. Haz clic para escuchar una narración grabada y de nuevo para detenerla. El audio aparece cuando el idioma está en Español.</span><span class="lang-sep"> · </span><span class="show-en">In the welcome and the optional Tu Conocimiento and Five Questions activities, you will see <strong>Escuchar</strong> (Listen) buttons. Click to hear a recorded narration and again to stop it. Audio appears when the language is set to Español.</span></div>
        </details>
        <details class="help-section">
            <summary class="help-section-title"><span class="show-es">¿Cómo avanzo de etapa?</span><span class="lang-sep"> · </span><span class="show-en">How do I move to the next stage?</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <div class="help-section-body"><span class="show-es">Usa el botón <strong>Siguiente etapa</strong> en el área de tarea cuando estés listo/a. En móvil, usa el selector de etapas en la barra superior.</span><span class="lang-sep"> · </span><span class="show-en">Use the <strong>Next stage</strong> button in the task area when you're ready. On mobile, use the stage selector in the top bar.</span></div>
        </details>
        <details class="help-section">
            <summary class="help-section-title"><span class="show-es">Moverte entre etapas</span><span class="lang-sep"> · </span><span class="show-en">Moving between stages</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <div class="help-section-body"><span class="show-es">Puedes regresar a etapas anteriores en cualquier momento para seguir desarrollando tus ideas. Cuando avances otra vez, Tu Pana puede preguntarte si quieres traer tu trabajo anterior a la próxima etapa. Elige esta opción cuando sientas que tu escritura en la etapa anterior ya está lista para ayudarte a construir la siguiente parte de tu borrador.<br><br>No tienes que importarlo todo de inmediato. Puedes revisar una etapa primero, volver a ella más tarde y traerla hacia adelante cuando esté lista.</span><span class="lang-sep"> · </span><span class="show-en">You can go back to earlier stages at any time to keep developing your ideas. When you move forward again, Tu Pana may ask whether you want to bring your previous work into the next stage. Choose this option when you feel that your writing in the earlier stage is ready to help you build the next part of your draft.<br><br>You do not have to import everything right away. You can revise a stage first, return to it later, and bring it forward when it feels ready.</span></div>
        </details>
        <details class="help-section">
            <summary class="help-section-title"><span class="show-es">¿Qué es Mi Toolkit?</span><span class="lang-sep"> · </span><span class="show-en">What is My Toolkit?</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <div class="help-section-body"><span class="show-es">Mi Toolkit guarda lo que traes y lo que practicas: los activos culturales que reclamaste durante la introducción, las habilidades de escritura que desarrollas en cada etapa, tus evaluaciones críticas del coach, y las frases que proteges en la Bóveda de voz.</span><span class="lang-sep"> · </span><span class="show-en">My Toolkit saves what you bring and what you practice: the cultural assets you claimed during onboarding, the writing skills you develop at each stage, your critical evaluations of the coach, and the phrases you protect in your Voice Vault.</span></div>
        </details>
        <details class="help-section">
            <summary class="help-section-title"><span class="show-es">Bóveda de voz</span><span class="lang-sep"> · </span><span class="show-en">Voice Vault</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <div class="help-section-body"><span class="show-es">En la Etapa 8 (Pulir Voz), aparece la Bóveda de voz en el chat. Úsala para guardar frases de tu borrador que no quieres perder durante la revisión. Las frases guardadas aparecen en tu Toolkit y en tu reporte.</span><span class="lang-sep"> · </span><span class="show-en">At Stage 8 (Voice Polish), the Voice Vault appears in the chat. Use it to save phrases from your draft that you want to protect during revision. Saved phrases appear in your Toolkit and in your report.</span></div>
        </details>
        <details class="help-section">
            <summary class="help-section-title"><span class="show-es">Tu camino: 5 hitos, 10 pasos</span><span class="lang-sep"> · </span><span class="show-en">Your journey: 5 milestones, 10 steps</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <div class="help-section-body" style="margin-bottom:6px;"><span class="show-es">El mapa de progreso muestra <strong>5 hitos</strong> — tu vista del camino. Cada hito agrupa algunos de los <strong>10 pasos</strong> — la ruta detallada de escritura. Son el mismo camino: los hitos son el mapa, los pasos son la ruta.</span><span class="lang-sep"> · </span><span class="show-en">The progress map shows <strong>5 milestones</strong> — your journey view. Each milestone groups a few of the <strong>10 steps</strong> — the detailed writing path. They are the same journey: milestones are the map, steps are the path.</span></div>
            <ul class="help-stage-list">${stageListHtml}</ul>
            <div class="help-section-body" style="margin-top:6px;"><span class="show-es">Al terminar la reflexión de la Etapa 10, verás una tarjeta "Proceso completo" con los pasos para copiar tu reporte y entregarlo en Brightspace.</span><span class="lang-sep"> · </span><span class="show-en">When you finish the Stage 10 reflection, a "Journey Complete" card shows the steps to copy your report and submit it in Brightspace.</span></div>
        </details>
        <details class="help-section">
            <summary class="help-section-title"><span class="show-es">Evaluar el coach</span><span class="lang-sep"> · </span><span class="show-en">Evaluate the coach</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <!-- ADHD Nav B4: same Five-Questions content, scannable chip-per-question
                 layout instead of a single text wall (no AI-literacy language removed) -->
            <div class="help-section-body"><span class="show-es">Cada respuesta del coach tiene un botón <strong>Evaluar</strong>. Úsalo para revisar lo que dijo el coach con cinco preguntas:</span><span class="lang-sep"> · </span><span class="show-en">Each coach response has an <strong>Evaluar · Evaluate</strong> button. Use it to review what the coach said using five questions:</span></div>
            <ul class="help-fiveq-list">
                <li><span class="fiveq-chip"><span class="show-es">Conocimiento</span><span class="lang-sep"> · </span><span class="show-en">Knowledge</span></span><span class="show-es">¿El coach respetó lo que sabes desde tu comunidad?</span><span class="lang-sep"> · </span><span class="show-en">Did the coach respect what you know from your community?</span></li>
                <li><span class="fiveq-chip"><span class="show-es">Precisión</span><span class="lang-sep"> · </span><span class="show-en">Accuracy</span></span><span class="show-es">¿Hay afirmaciones que necesitan una fuente real?</span><span class="lang-sep"> · </span><span class="show-en">Are there claims that need a real source?</span></li>
                <li><span class="fiveq-chip"><span class="show-es">Voz</span><span class="lang-sep"> · </span><span class="show-en">Voice</span></span><span class="show-es">¿La respuesta todavía suena como tú?</span><span class="lang-sep"> · </span><span class="show-en">Does this still sound like you?</span></li>
                <li><span class="fiveq-chip"><span class="show-es">Especificidad</span><span class="lang-sep"> · </span><span class="show-en">Specificity</span></span><span class="show-es">¿Hay detalles concretos o se queda abstracto?</span><span class="lang-sep"> · </span><span class="show-en">Are there concrete details, or does it stay abstract?</span></li>
                <li><span class="fiveq-chip"><span class="show-es">Pensamiento</span><span class="lang-sep"> · </span><span class="show-en">Thinking</span></span><span class="show-es">¿Profundiza la conexión con el tema más amplio?</span><span class="lang-sep"> · </span><span class="show-en">Does it deepen the connection to the larger issue?</span></li>
            </ul>
            <div class="help-section-body"><span class="show-es">No tienes que aceptar lo que dice el coach. Tu criterio es parte del trabajo.</span><span class="lang-sep"> · </span><span class="show-en">You do not have to accept what the coach says. Your judgment is part of the work.</span></div>
        </details>
        <details class="help-section">
            <summary class="help-section-title"><span class="show-es">El coach no responde</span><span class="lang-sep"> · </span><span class="show-en">Coach is not responding</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <div class="help-section-body"><span class="show-es">Tu Pana funciona en tres modos:<br><br><strong>Coach IA</strong> — coach de IA en vivo usando internet. Si no responde, verifica tu conexión a internet. Si el coach falla, aparecerá un botón para cambiar al modo Guía sin IA.<br><strong>Guía sin IA</strong> — orientación integrada, sin IA. Funciona sin internet pero más limitado.<br><strong>Ollama</strong> — requiere instalación local.<br><br>Tus textos se guardan automáticamente en este navegador aunque el coach no responda.</span><span class="lang-sep"> · </span><span class="show-en">Tu Pana runs in three modes:<br><br><strong>Live AI</strong> — live AI coach using the internet. If it is not responding, check your internet connection. If the coach fails, a button will appear to switch to Built-in, no AI mode.<br><strong>Built-in, no AI</strong> — built-in guidance, no AI. Works without a connection but more limited.<br><strong>Ollama</strong> — requires a local installation.<br><br>Your texts are saved automatically in this browser even if the coach is not responding.</span></div>
        </details>
        <details class="help-section" open>
            <summary class="help-section-title"><span class="show-es">Tu trabajo y tu privacidad</span><span class="lang-sep"> · </span><span class="show-en">Your work and your privacy</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <div class="help-section-body"><span class="show-es">Tu borrador, tus reflexiones y tu Toolkit se guardan en este navegador. Si borras el historial o usas otro dispositivo, no estarán disponibles.<br><br>Tu borrador nunca se envía al Coach IA solo por escribirlo o guardarlo. Cuando envías un mensaje, se envía ese mensaje y cualquier pasaje que adjuntaste. El borrador completo solo se envía cuando eliges explícitamente <strong>Revisar borrador</strong> o <strong>Comparar con el coach</strong>; antes verás qué contenido se enviará. Tu Pana no guarda ese contenido en un servidor.<br><br>Tu instructor/a solo ve lo que tú decides exportar, copiar o compartir. Tu Pana no comparte tu trabajo automáticamente.</span><span class="lang-sep"> · </span><span class="show-en">Your draft, reflections, and Toolkit are saved in this browser. If you clear browser history or use another device, they will not be available.<br><br>Your draft is never sent to the Live AI coach merely because you write or save it. When you send a message, that message and any passage you attached are sent. The full draft is sent only when you explicitly choose <strong>Review draft</strong> or <strong>Compare with the Coach</strong>; first, you will see what content will be sent. Tu Pana does not store that content on a server.<br><br>Your instructor sees only what you choose to export, copy, or share. Tu Pana does not share your work automatically.</span></div>
        </details>
        <details class="help-section">
            <summary class="help-section-title"><span class="show-es">Preguntas para tu instructor/a</span><span class="lang-sep"> · </span><span class="show-en">Questions for your instructor</span><span class="help-sum-arrow" aria-hidden="true">▾</span></summary>
            <div class="help-section-body"><span class="show-es">Si tienes preguntas sobre la tarea, el tema o las expectativas del curso, habla con tu instructor/a — el coach no puede responder esas preguntas.</span><span class="lang-sep"> · </span><span class="show-en">If you have questions about the assignment, topic, or course expectations, talk to your instructor — the coach cannot answer those questions.</span></div>
        </details>
    </div>`;

    const closeHelp = () => {
        overlay.remove();
        document.removeEventListener('keydown', onEscHelp);
        if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
    };
    const onEscHelp = e => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeHelp();
        } else if (e.key === 'Tab') {
            const focusable = Array.from(overlay.querySelectorAll('button, summary, a[href], input, textarea, [tabindex]:not([tabindex="-1"])')).filter(node => !node.disabled);
            const first = focusable[0], last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    };
    overlay.addEventListener('click', e => { if (e.target === overlay) closeHelp(); });
    overlay.querySelector('.toolkit-close').addEventListener('click', closeHelp);
    document.addEventListener('keydown', onEscHelp);

    document.body.appendChild(overlay);
    setTimeout(() => overlay.querySelector('.toolkit-close')?.focus(), 120);
}

// ════════════════════════════════════════════════════════
//  BUG REPORT — Patch 25 (disabled-state update: Patch 25b)
// ════════════════════════════════════════════════════════
function openBugReport() {
    const btn = document.querySelector('.bug-report-btn');
    if (btn && btn.getAttribute('aria-disabled') === 'true') return;
    const base = (CONFIG.bugReportUrl || '').trim();
    if (!base) return;
    const stageObj = (typeof STAGES !== 'undefined' && STAGES[state.stage - 1]) || {};
    const params = new URLSearchParams({
        stage:    state.stage,
        stage_en: (stageObj.en || '').replace('\n', ' '),
        lang:     state.lang,
        provider: state.coachMode,
        ts:       new Date().toISOString().slice(0, 16),
    });
    window.open(`${base}?${params}`, '_blank', 'noopener,noreferrer');
}

function _initBugReportBtn() {
    const btn = document.querySelector('.bug-report-btn');
    if (!btn) return;
    const hasUrl = !!(CONFIG.bugReportUrl || '').trim();
    if (hasUrl) {
        btn.classList.remove('is-unavailable');
        btn.removeAttribute('aria-disabled');
        btn.setAttribute('aria-label', 'Reportar un problema · Report a problem');
        btn.setAttribute('title', 'Reportar un problema técnico o un momento confuso. No incluyas información privada. · Report a technical problem or confusing moment. Do not include private information.');
    } else {
        btn.classList.add('is-unavailable');
        btn.setAttribute('aria-disabled', 'true');
        btn.setAttribute('aria-label', 'Formulario de reporte no disponible todavía · Bug report form not available yet');
        btn.setAttribute('title', 'Formulario de reporte próximamente · Bug report form coming soon');
    }
}

_initBugReportBtn();

// ════════════════════════════════════════════════════════
//  TRANSITION IMPORT — Patch 26
//  Guidance sequence: coach spotlight → import card → editor spotlight.
//  Only shown when moving forward with >= 30 chars of text.
//
//  _pendingImport: queued import data set in confirmStagePreview().
//  _importCompletionAction: callback fired after import card is dismissed.
//    • Set to _activateEditorSpotlight when student clicked "Entendido" first.
//    • null on all other dismissal paths (student dismissed or spotlight unseen).
let _pendingImport         = null;
let _importCompletionAction = null;

function _showPendingImport(completionAction) {
    if (!_pendingImport) {
        if (typeof completionAction === 'function') completionAction();
        return;
    }
    const { prevText, nextStage, nextText } = _pendingImport;
    _pendingImport = null;
    _importCompletionAction = typeof completionAction === 'function' ? completionAction : null;
    _offerTransitionImport(prevText, nextStage, nextText);
}
// ════════════════════════════════════════════════════════
function _offerTransitionImport(prevText, nextStage, nextText) {
    const existing = document.getElementById('transitionImportCard');
    if (existing) existing.remove();

    const hasNextText = nextText.trim().length >= 10;
    const card = document.createElement('div');
    card.id = 'transitionImportCard';
    card.className = 'transition-import-card';
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label',
        '¿Quieres traer tu trabajo anterior? · Bring your previous work forward?');

    if (!hasNextText) {
        card.innerHTML =
            '<p class="tic-title">' +
                '<span class="show-es">¿Quieres traer tu trabajo anterior?</span>' +
                '<span class="lang-sep"> · </span>' +
                '<span class="show-en">Bring your previous work forward?</span>' +
            '</p>' +
            '<p class="tic-body">' +
                '<span class="show-es">Escribiste algo en la etapa anterior. Si ya se siente listo, puedes traerlo a esta etapa y seguir desarrollándolo.</span>' +
                '<span class="show-en">You wrote something in the last stage. If it feels ready, you can bring it into this stage and keep building on it.</span>' +
            '</p>' +
            '<div class="tic-actions">' +
                '<button class="tic-btn tic-btn-yes" aria-label="Sí, traerlo · Yes, bring it forward">' +
                    '<span class="show-es">Sí, traerlo</span><span class="lang-sep"> · </span><span class="show-en">Yes, bring it forward</span>' +
                '</button>' +
                '<button class="tic-btn tic-btn-no" aria-label="No, empezar de nuevo · No, start fresh">' +
                    '<span class="show-es">No, empezar de nuevo</span><span class="lang-sep"> · </span><span class="show-en">No, start fresh</span>' +
                '</button>' +
            '</div>';

        card.querySelector('.tic-btn-yes').addEventListener('click', () => {
            D.draftArea.value = prevText;
            D.draftArea.dispatchEvent(new Event('input'));
            saveStageWork(nextStage, prevText);
            _dismissTransitionImportCard();
        });
        card.querySelector('.tic-btn-no').addEventListener('click', _dismissTransitionImportCard);
    } else {
        card.innerHTML =
            '<p class="tic-title">' +
                '<span class="show-es">Esta etapa ya tiene texto.</span>' +
                '<span class="lang-sep"> · </span>' +
                '<span class="show-en">This stage already has writing.</span>' +
            '</p>' +
            '<p class="tic-body">' +
                '<span class="show-es">¿Cómo quieres usar tu trabajo anterior?</span>' +
                '<span class="show-en">How would you like to use your previous work?</span>' +
            '</p>' +
            '<div class="tic-actions">' +
                '<button class="tic-btn tic-btn-above" aria-label="Añadirlo arriba de mi texto actual · Add it above my current writing">' +
                    '<span class="show-es">Añadirlo arriba</span><span class="lang-sep"> · </span><span class="show-en">Add it above</span>' +
                '</button>' +
                '<button class="tic-btn tic-btn-below" aria-label="Añadirlo abajo de mi texto actual · Add it below my current writing">' +
                    '<span class="show-es">Añadirlo abajo</span><span class="lang-sep"> · </span><span class="show-en">Add it below</span>' +
                '</button>' +
                '<button class="tic-btn tic-btn-no" aria-label="Mantener solo mi texto actual · Keep my current writing only">' +
                    '<span class="show-es">Mantener solo mi texto</span><span class="lang-sep"> · </span><span class="show-en">Keep my current writing only</span>' +
                '</button>' +
            '</div>';

        card.querySelector('.tic-btn-above').addEventListener('click', () => {
            const combined = prevText + '\n\n' + D.draftArea.value;
            D.draftArea.value = combined;
            D.draftArea.dispatchEvent(new Event('input'));
            saveStageWork(nextStage, combined);
            _dismissTransitionImportCard();
        });
        card.querySelector('.tic-btn-below').addEventListener('click', () => {
            const combined = D.draftArea.value + '\n\n' + prevText;
            D.draftArea.value = combined;
            D.draftArea.dispatchEvent(new Event('input'));
            saveStageWork(nextStage, combined);
            _dismissTransitionImportCard();
        });
        card.querySelector('.tic-btn-no').addEventListener('click', _dismissTransitionImportCard);
    }

    card._escHandler = e => { if (e.key === 'Escape') _dismissTransitionImportCard(); };
    document.addEventListener('keydown', card._escHandler);

    const wrap = document.querySelector('.draft-textarea-wrap');
    if (wrap && wrap.parentNode) wrap.parentNode.insertBefore(card, wrap);

    setTimeout(() => { const b = card.querySelector('.tic-btn'); if (b) b.focus(); }, 50);
}

function _dismissTransitionImportCard() {
    const card = document.getElementById('transitionImportCard');
    if (!card) return;
    if (card._escHandler) document.removeEventListener('keydown', card._escHandler);
    card.remove();
    // Step 3: fire editor spotlight if student came via "Entendido" (Patch 26 sequence).
    if (_importCompletionAction) {
        const action = _importCompletionAction;
        _importCompletionAction = null;
        action();
    }
}
