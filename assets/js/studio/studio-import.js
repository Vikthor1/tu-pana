/*
 * Tu Pana Writing Studio — bounded legacy-work translation adapter.
 *
 * Reads the legacy Writing Studio's documented localStorage keys (read-only,
 * named explicitly — never enumerated) only when the student opens the import
 * preview from Settings. Truth rules (migration contract C17):
 *   - exact student text is preserved byte-for-byte;
 *   - dates are only claimed where the legacy record carries one; per-stage
 *     buffers carry none and are labeled "date not recorded";
 *   - byte-identical copies of the same text across stage buffers (the legacy
 *     seeding behavior) collapse to one snapshot;
 *   - navigation, word count, and flags never become completion, readiness,
 *     reflection, or Finish state; tupana_draft_saved becomes one factual
 *     evidence line, never studio Finish state;
 *   - the coach chat log is NOT imported (the studio has no chat column) and
 *     the preview says so;
 *   - the current studio draft is never overwritten: when it has content, the
 *     imported legacy draft becomes an exact snapshot instead;
 *   - applying an import first stores a restorable pre-import snapshot of the
 *     whole studio record; Settings offers the rollback;
 *   - nothing here writes, changes, or deletes any legacy tupana_* key.
 */
(function () {
    'use strict';

    const LEGACY_TEXT_KEYS = ['tupana_draft', 'tupana_writing_s1', 'tupana_writing_s2', 'tupana_writing_s3', 'tupana_writing_s4', 'tupana_writing_s5', 'tupana_writing_s6', 'tupana_writing_s7', 'tupana_writing_s8', 'tupana_writing_s9', 'tupana_writing_s10'];

    function readJson(storage, key) {
        try { const raw = storage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
    }

    function wordCount(text) { return text && text.trim() ? text.trim().split(/\s+/).length : 0; }

    // Read-only scan of the documented legacy keys. Returns found artifacts and
    // a truthful mapping plan; performs no writes.
    function scanLegacy(storage) {
        const texts = [];
        for (const key of LEGACY_TEXT_KEYS) {
            const value = storage.getItem(key);
            if (value && value.trim()) texts.push({ key, text: value, words: wordCount(value) });
        }
        // Collapse byte-identical buffers (legacy stages >= 6 seed themselves from
        // tupana_draft, producing indistinguishable copies).
        const distinct = [];
        for (const item of texts) {
            const match = distinct.find(existing => existing.text === item.text);
            if (match) match.collapsedKeys.push(item.key);
            else distinct.push({ ...item, collapsedKeys: [] });
        }
        const protectedPhrases = readJson(storage, 'tupana_protected') || [];
        const decisions = readJson(storage, 'tupana_decisions') || [];
        const councilRuns = readJson(storage, 'tupana_council_runs') || null;
        const fullDraftReviews = readJson(storage, 'tupana_full_draft_reviews') || null;
        const processNote = readJson(storage, 'tupana_process_note') || null;
        const capstone = readJson(storage, 'tupana_capstone') || null;
        const maniSentence = storage.getItem('tupana_mani_sentence') || '';
        const assignmentId = storage.getItem('tupana_assignment_id') || '';
        const draftSaved = storage.getItem('tupana_draft_saved') === 'true';
        const chatlogEntries = (readJson(storage, 'tupana_chatlog') || []).length;
        const found = Boolean(distinct.length || protectedPhrases.length || decisions.length || councilRuns || fullDraftReviews || processNote || capstone || maniSentence || draftSaved);
        return { found, distinct, protectedPhrases, decisions, councilRuns, fullDraftReviews, processNote, capstone, maniSentence, assignmentId, draftSaved, chatlogEntries };
    }

    // Build the mapping plan against the current studio record. Pure; no writes.
    function buildPlan(scan, studioState) {
        const studioDraftHasContent = Boolean((studioState.draft || '').trim());
        // The live-draft candidate is the ceremonially saved legacy first draft when
        // present, else the highest-numbered distinct buffer — always shown exactly
        // in the preview, never applied silently.
        const savedDraft = scan.distinct.find(item => item.key === 'tupana_draft');
        const candidate = savedDraft || scan.distinct[scan.distinct.length - 1] || null;
        return {
            liveDraft: !studioDraftHasContent && candidate ? { key: candidate.key, text: candidate.text, words: candidate.words, collapsedKeys: candidate.collapsedKeys || [] } : null,
            liveDraftBlockedByExisting: studioDraftHasContent && Boolean(candidate),
            snapshots: scan.distinct
                .filter(item => !(candidate && !studioDraftHasContent && item.key === candidate.key))
                .map(item => ({ key: item.key, text: item.text, words: item.words, collapsedKeys: item.collapsedKeys })),
            voiceEntries: (scan.protectedPhrases || []).filter(item => item && item.text).map(item => ({ text: item.text, savedAt: item.savedAt || null })),
            facts: [
                scan.draftSaved ? 'A legacy first-draft save was recorded (authorship-gate fact; it does not mark anything finished here).' : null,
                scan.decisions.length ? `${scan.decisions.length} legacy revision decisions imported as read-only evidence.` : null,
                scan.councilRuns ? 'Legacy Review Council history imported as read-only evidence.' : null,
                scan.fullDraftReviews ? 'Legacy full-draft review history imported as read-only evidence.' : null,
                scan.processNote ? 'Legacy process-note answers imported as read-only evidence (they never pre-fill Studio reflection).' : null,
                scan.capstone ? 'Legacy self-assessment imported as read-only evidence.' : null,
                scan.maniSentence ? 'Legacy Tu Conocimiento sentence imported as read-only evidence.' : null,
            ].filter(Boolean),
            notImported: [
                scan.chatlogEntries ? `Coach conversation (${scan.chatlogEntries} messages) — the Studio has no chat column; the legacy record stays untouched in this browser.` : null,
                'Navigation progress, milestones, badges, and streak counters — navigation is not evidence.',
            ].filter(Boolean),
            assignmentSuggestion: scan.assignmentId || null,
        };
    }

    // Apply the plan to the studio state (mutates the passed state). The caller
    // persists. Stores a restorable pre-import snapshot first.
    function applyPlan(plan, scan, state) {
        state.legacyImport = {
            appliedAt: new Date().toISOString(),
            preImportSnapshot: JSON.stringify(state),
            facts: plan.facts,
            notImported: plan.notImported,
            records: {
                decisions: scan.decisions || [],
                councilRuns: scan.councilRuns,
                fullDraftReviews: scan.fullDraftReviews,
                processNote: scan.processNote,
                capstone: scan.capstone,
                maniSentence: scan.maniSentence || '',
                draftSaved: scan.draftSaved,
            },
        };
        for (const snapshot of plan.snapshots) {
            state.versions.push({
                id: `legacy-${snapshot.key}-${Date.now()}`,
                signature: `${snapshot.text.length}:${snapshot.text.slice(0, 24)}`,
                words: snapshot.words,
                createdAt: null,
                dateNotRecorded: true,
                reason: `imported from legacy ${snapshot.key}${snapshot.collapsedKeys.length ? ` (identical copies collapsed: ${snapshot.collapsedKeys.join(', ')})` : ''} — date not recorded`,
                text: snapshot.text,
                legacyImport: true,
            });
        }
        if (plan.liveDraft) state.draft = plan.liveDraft.text;
        for (const entry of plan.voiceEntries) {
            if (!(state.voiceEntries || []).some(existing => existing.text === entry.text)) {
                state.voiceEntries = state.voiceEntries || [];
                state.voiceEntries.push({
                    id: `voice-legacy-${Date.now()}-${state.voiceEntries.length}`,
                    text: entry.text,
                    protectedAt: entry.savedAt,
                    genre: state.genre,
                    studentAuthored: true,
                    reason: '',
                    legacyImport: true,
                });
            }
        }
        return state;
    }

    function restorePreImport(state) {
        if (!state.legacyImport?.preImportSnapshot) return null;
        try { return JSON.parse(state.legacyImport.preImportSnapshot); } catch { return null; }
    }

    window.StudioImport = { scanLegacy, buildPlan, applyPlan, restorePreImport };
}());
