// Tu Pana de Escritura — app.js
// Initialization sequence: restores state from localStorage, wires up the app, fires onboarding.
// Runs inline (no DOMContentLoaded wrapper) after the DOM before this script tag is ready.

// ════════════════════════════════════════════════════════
initTheme();
initTone();
initLang();
// CAP 200 assignment layer (Session 78): link/config-activated, generic-fallback-safe.
// ?assignment=<id> activates a known layer (and is remembered for later visits); ?assignment=
// (empty), ?assignment=none, or ?assignment=generic clears it; with no active assignment the app
// is the generic Tu Pana coach, unchanged. Stage 6/8 guardrails are global and are NEVER altered
// by an assignment layer; an unknown id falls back to the generic coach.
try {
    const _qAssign = new URLSearchParams(location.search).get('assignment');
    if (_qAssign !== null && (!_qAssign || _qAssign === 'none' || _qAssign === 'generic')) {
        localStorage.removeItem('tupana_assignment_id');
    }
    const _assignId = (_qAssign && _qAssign !== 'none' && _qAssign !== 'generic')
        ? _qAssign
        : (localStorage.getItem('tupana_assignment_id') || '');
    if (_assignId && typeof getAssignmentLayer === 'function' && getAssignmentLayer(_assignId)) {
        state.assignmentId = _assignId;
        if (_qAssign) tupanaSafeSetItem('tupana_assignment_id', _assignId, 'project selection');
    }
} catch(e) {}
try {
    const expanded = localStorage.getItem('tupana_journey_expand');
    if (expanded === 'true') state.showAllJourney = true;
} catch(e) {}
try {
    const savedStage = parseInt(localStorage.getItem('tupana_stage') || '1', 10);
    if (savedStage > 10) {
        // Migration: old 12-stage data detected, reset to Stage 1
        state.stage = 1;
        state.done = new Set();
        tupanaSafeSetItem('tupana_stage', '1', 'current step');
        addSysTech('La aplicación se ha actualizado. Empezamos de nuevo en la Etapa 1. / The app has been updated. Starting fresh at Stage 1.');
    } else if (savedStage >= 1 && savedStage <= 10) {
        state.stage = savedStage;
        state.step  = loadStepForStage(savedStage);
        if (savedStage > 1) {
            for (let i = 1; i < savedStage; i++) state.done.add(i);
        }
        const s = STAGES[savedStage - 1];
        if (D.headerSub) {
            // Milestone wording on load — mirror goToStage() so the header is not
            // stale "Etapa N" before the first navigation (Stage A consistency).
            const ms = milestoneForStage(savedStage);
            const mL = (typeof msLabel === 'function') ? msLabel(ms) : { es: ms.es, en: ms.en };
            D.headerSub.innerHTML = `<span class="show-es">TU COACH DE ESCRITURA</span><span class="lang-sep">&nbsp;·&nbsp;</span><span class="show-en">YOUR WRITING COACH</span>&nbsp;—&nbsp;<span class="header-stage-inline"><span class="show-es">Paso ${ms.n} de ${TOTAL_MILESTONES} · ${escapeHtml(mL.es)}</span><span class="lang-sep"> / </span><span class="show-en">Step ${ms.n} of ${TOTAL_MILESTONES} · ${escapeHtml(mL.en)}</span></span>`;
        }
    }
} catch(e) {}
buildMap();
updateCurrentTaskBar();
restoreChatLog();
restoreDraft();
applyDraftPlaceholder();   // Stage B.1: profile-aware draft placeholder (CAP 200 vs default)
editHistoryInit(D.draftArea.value);
updateDraftControls();
initChatProgress();
initManiPrompt();
initStuckTriageKeyboard();

// Restore Five Questions strip if returning to Stage 7+
if (state.stage >= 7) {
    const fqs = document.getElementById('fiveQStrip');
    if (fqs) fqs.classList.remove('hidden');
}

// Restore Voice Vault when returning to any revision stage (7–9)
if (vaultAvailable()) {
    setTimeout(() => injectVoiceVaultPanel(), 400);
}
updateProtectBtn();

// Restore capstone panel (and 10B/10C if already generated) when returning to stage 10
if (state.stage === 10) {
    setTimeout(() => {
        injectCapstonePanel();
        const _cd = loadCapstoneData();
        if (_cd.completed && _cd.coachPerspective) {
            setTimeout(() => renderCoachPerspectiveData(_cd.coachPerspective, true), 200);
        }
        // Restore instructor report panel if previously generated
        if (_cd.instrReportGenerated) {
            setTimeout(() => injectInstructorReportPanel(false), 700);
        }
    }, 400);
}

// Check if draft warning was previously dismissed this session
try {
    if (sessionStorage.getItem('tupana_warn_dismissed')) {
        const w = document.getElementById('draftWarning');
        if (w) w.style.display = 'none';
    }
} catch(e) {}
renderDecisionLog();
trackSession();
renderBadges();
renderEvalStreak();

// Clicking into the chat panel signals the student wants to read coach guidance
document.querySelector('.chat-panel')?.addEventListener('click', () => {
    exitDraftFocus();
});

initDL();

// Cross-device persistence reminder (shown once per session)
try {
    if (!sessionStorage.getItem('tupana_persist_warn')) {
        sessionStorage.setItem('tupana_persist_warn', '1');
        const inIframe = window.self !== window.top;
        if (inIframe) {
            setTimeout(() => addSys(
                'Consejo: tu trabajo se guarda solo en este navegador. Si usas Safari dentro de Brightspace, exporta tu progreso regularmente como respaldo. / Tip: your work is saved only in this browser. If using Safari inside Brightspace, export your progress regularly as backup.'
            ), 4000);
        }
    }
} catch(e) {}

// Colleague/evaluator review mode (URL-scoped only — ?review=colleague, alias
// ?review=true; NEVER persisted). Badge always renders in review mode. With no
// ?assignment= param the review selector opens (a link hub that navigates into
// the existing ?assignment= boot path), regardless of onboarding state; with an
// assignment param the pathway loads normally and only the badge is added.
// Absent the parameter this block is a no-op and student flow is untouched.
const _reviewMode = (typeof isReviewMode === 'function') && isReviewMode();
if (_reviewMode) {
    try { renderReviewBadge(); } catch(e) {}
}

// First-run entry: one welcome card, then the editor. The optional guide
// remains available from that card without blocking the first sentence.
try {
    const labDone        = localStorage.getItem('tupana_lab_done') === 'true';
    const onboardingDone = localStorage.getItem('tupana_onboarding_complete') === 'true' || labDone;

    const _reviewSelector = _reviewMode
        && !(new URLSearchParams(location.search).get('assignment'))
        && typeof showProjectSelector === 'function';
    if (_reviewSelector) {
        // Review hub: show the colleague selector instead of the normal
        // onboarding dispatch; card clicks navigate away, so nothing else runs.
        setTimeout(() => showProjectSelector(true), 400);
    } else if (!onboardingDone) {
        // First visit. If no profile is active yet, choose the writing project
        // first; otherwise go directly to the streamlined welcome card.
        const _projectChosen = localStorage.getItem('tupana_project_chosen') === 'true' || !!state.assignmentId;
        if (!_projectChosen && typeof showProjectSelector === 'function') {
            setTimeout(showProjectSelector, 400);
        } else {
            setTimeout(showLandingMoment, 400);
        }
    } else {
        // Returning session — show orientation message in chat after connection
        setTimeout(showWelcomeBack, 1800);
    }
} catch(e) {}

// Restore Tu Conocimiento claimed-asset state even if modal is not open
try { restoreManiClaims(); } catch(e) {}

// Marquee hint: measure after fonts load, re-check on resize
setTimeout(refreshMarqueeHint, 300);
window.addEventListener('resize', refreshMarqueeHint);

// ════════════════════════════════════════════════════════
//  DEV PREVIEW BAR VISIBILITY
// ════════════════════════════════════════════════════════
if (location.search.includes('dev=true')) {
    const devBar = document.getElementById('devPreviewBar');
    if (devBar) devBar.style.display = 'flex';
}
