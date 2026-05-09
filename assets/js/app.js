// Tu Pana de Escritura — app.js
// Initialization sequence: restores state from localStorage, wires up the app, fires onboarding.
// Runs inline (no DOMContentLoaded wrapper) after the DOM before this script tag is ready.

// ════════════════════════════════════════════════════════
initTheme();
initTone();
initLang();
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
        localStorage.setItem('tupana_stage', '1');
        addSysTech('La aplicación se ha actualizado. Empezamos de nuevo en la Etapa 1. / The app has been updated. Starting fresh at Stage 1.');
    } else if (savedStage >= 1 && savedStage <= 10) {
        state.stage = savedStage;
        state.step  = loadStepForStage(savedStage);
        if (savedStage > 1) {
            for (let i = 1; i < savedStage; i++) state.done.add(i);
        }
        const s = STAGES[savedStage - 1];
        if (D.headerSub) {
            D.headerSub.innerHTML = `<span class="show-es">TU COACH DE ESCRITURA</span><span class="lang-sep">&nbsp;·&nbsp;</span><span class="show-en">YOUR WRITING COACH</span>&nbsp;—&nbsp;<span class="header-stage-inline"><span class="show-es">Etapa ${savedStage} · ${s.es.replace('\n', ' ')}</span><span class="lang-sep"> / </span><span class="show-en">Stage ${savedStage} · ${s.en}</span></span>`;
        }
    }
} catch(e) {}
buildMap();
updateCurrentTaskBar();
restoreChatLog();
restoreDraft();
editHistoryInit(D.draftArea.value);
updateDraftControls();
initChatProgress();
renderEvalStreak();
initManiPrompt();

// Restore Five Questions strip if returning to Stage 7+
if (state.stage >= 7) {
    const fqs = document.getElementById('fiveQStrip');
    if (fqs) fqs.classList.remove('hidden');
}

// Restore Voice Vault if returning to Stage 8
if (state.stage === 8) {
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

// Onboarding sequence: Tu Conocimiento → El Laboratorio (each runs once)
try {
    const maniDone = localStorage.getItem('tupana_mani_done') === 'true';
    const labDone  = localStorage.getItem('tupana_lab_done')  === 'true';

    if (!maniDone) {
        // First-ever visit: show landing quote, then Tu Conocimiento
        setTimeout(showLandingMoment, 400);
    } else if (!labDone) {
        // Returned after Conocimiento but Lab not yet done
        setTimeout(openLab, 700);
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
