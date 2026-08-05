/*
 * Tu Pana Writing Studio — Council structured-response safety kernel.
 * Ported from the legacy assets/js/council.js (read-only source at R0 1462aea):
 * verbatim-anchor validation in application code, per-role caps, corroboration
 * recomputed by code (never trusted from the model), disagreement preservation,
 * and safe malformed/partial handling. Role identity always derives from the
 * requested role record, never from generated text.
 *
 * A generated quotation that cannot be anchored to the consented draft is
 * discarded and can never appear as verified student text.
 */
(function () {
    'use strict';

    // Caps ported from legacy COUNCIL_LIMITS (council.js:17-33).
    const LIMITS = {
        reviewerCount: 3,
        minReviewers: 2,
        perReviewerMax: 5,
        priorityMax: 3,
        secondaryMax: 4,
        preserveMax: 3,
        disagreementMax: 2,
        claimWords: 60,
        quoteWordsMax: 40,
        quoteCharsMin: 10,
        whyWords: 40,
        moveWords: 40,
        retriesPerCall: 1,
    };

    // Normalization for anchor matching (legacy _councilNorm): smart quotes,
    // collapsed whitespace, case-insensitive. Never mutates stored text.
    function norm(text) {
        return String(text || '')
            .replace(/[‘’‚‹›']/g, "'")
            .replace(/[“”„«»"]/g, '"')
            .replace(/[–—]/g, '-')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function anchorValid(quote, draftText) {
        const q = norm(quote);
        if (q.length < LIMITS.quoteCharsMin) return false;
        if (q.split(' ').length > LIMITS.quoteWordsMax) return false;
        return norm(draftText).includes(q);
    }

    function trimWords(text, maxWords) {
        const words = String(text || '').trim().split(/\s+/);
        return words.length <= maxWords ? String(text || '').trim() : `${words.slice(0, maxWords).join(' ')}…`;
    }

    // Tolerant JSON extraction: strips code fences and leading/trailing prose,
    // then requires one valid JSON object. Anything else is unparseable.
    function parseJsonLoose(text) {
        if (typeof text !== 'string' || !text.trim()) return null;
        let candidate = text.trim();
        const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced) candidate = fenced[1].trim();
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start === -1 || end === -1 || end <= start) return null;
        try { return JSON.parse(candidate.slice(start, end + 1)); } catch { return null; }
    }

    // Validate one reviewer response. Role identity comes from the caller's
    // requested role record (roleKey/roleLabel), never from the response body.
    // Returns { ok, findings, preserve, dropped, reason? }.
    function validateReviewerResult(rawText, draftText, roleKey, roleLabel) {
        const dropped = [];
        const parsed = parseJsonLoose(rawText);
        if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'unparseable', roleKey, roleLabel, findings: [], preserve: [], dropped: [{ reason: 'unparseable' }] };
        if (parsed.noFindings === true) return { ok: true, roleKey, roleLabel, findings: [], preserve: [], dropped: [] };
        const rawFindings = Array.isArray(parsed.findings) ? parsed.findings : null;
        if (!rawFindings) return { ok: false, reason: 'malformed', roleKey, roleLabel, findings: [], preserve: [], dropped: [{ reason: 'malformed' }] };
        const findings = [];
        for (const item of rawFindings) {
            if (findings.length >= LIMITS.perReviewerMax) { dropped.push({ reason: 'over-cap' }); continue; }
            if (!item || typeof item !== 'object' || !item.claim || !item.evidenceQuote) { dropped.push({ reason: 'missing-fields' }); continue; }
            if (!anchorValid(item.evidenceQuote, draftText)) { dropped.push({ reason: 'bad-anchor', quote: String(item.evidenceQuote).slice(0, 60) }); continue; }
            findings.push({
                id: `${roleKey}-${findings.length + 1}`,
                roleKey,
                roleLabel,
                claim: trimWords(item.claim, LIMITS.claimWords),
                evidenceQuote: String(item.evidenceQuote),
                severity: item.severity === 'priority' ? 'priority' : 'secondary',
                confidence: item.confidence === 'low' ? 'low' : 'high',
                why: trimWords(item.why || '', LIMITS.whyWords),
                revisionMove: trimWords(item.revisionMove || '', LIMITS.moveWords),
                voiceNote: item.voiceNote ? trimWords(item.voiceNote, LIMITS.whyWords) : null,
            });
        }
        const preserve = [];
        for (const item of (Array.isArray(parsed.preserve) ? parsed.preserve : [])) {
            if (preserve.length >= LIMITS.preserveMax) { dropped.push({ reason: 'preserve-over-cap' }); continue; }
            if (!item || !item.quote) { dropped.push({ reason: 'preserve-missing-fields' }); continue; }
            if (!anchorValid(item.quote, draftText)) { dropped.push({ reason: 'bad-preserve-anchor' }); continue; }
            preserve.push({ id: `${roleKey}-p${preserve.length + 1}`, roleKey, roleLabel, quote: String(item.quote), why: trimWords(item.why || '', LIMITS.whyWords) });
        }
        return { ok: true, roleKey, roleLabel, findings, preserve, dropped };
    }

    // Validate the synthesis against the real validated findings. sourceIds must
    // resolve; corroboration is recomputed here (distinct source roles >= 2);
    // disagreements stay questions with fairly stated positions.
    function validateSynthesisResult(rawText, validFindings, validPreserve, draftText) {
        const parsed = parseJsonLoose(rawText);
        if (!parsed || typeof parsed !== 'object') return { ok: false, reason: 'unparseable' };
        const byId = new Map(validFindings.map(finding => [finding.id, finding]));
        const preserveById = new Map(validPreserve.map(item => [item.id, item]));
        const usedIds = new Set();

        function resolveItem(item, allowPreserve = false) {
            if (!item || typeof item !== 'object') return null;
            const ids = (Array.isArray(item.sourceIds) ? item.sourceIds : []).filter(id => byId.has(id) || (allowPreserve && preserveById.has(id)));
            if (!ids.length) return null;
            const sources = ids.map(id => byId.get(id) || preserveById.get(id));
            const roles = [...new Set(sources.map(source => source.roleKey))];
            return { ids, sources, roles };
        }

        const priorities = [];
        for (const item of (Array.isArray(parsed.priorities) ? parsed.priorities : [])) {
            if (priorities.length >= LIMITS.priorityMax) break;
            const resolved = resolveItem(item);
            if (!resolved) continue;
            const primary = resolved.sources.find(source => source.evidenceQuote) || resolved.sources[0];
            if (resolved.ids.some(id => usedIds.has(id))) continue;
            resolved.ids.forEach(id => usedIds.add(id));
            priorities.push({
                claim: trimWords(item.claim || primary.claim, LIMITS.claimWords),
                evidenceQuote: primary.evidenceQuote || null,
                revisionMove: trimWords(item.revisionMove || primary.revisionMove || '', LIMITS.moveWords),
                why: trimWords(item.why || primary.why || '', LIMITS.whyWords),
                sourceIds: resolved.ids,
                roles: resolved.roles,
                corroborated: resolved.roles.length >= 2,
                confidence: resolved.sources.some(source => source.confidence === 'low') ? 'low' : 'high',
                voiceNote: resolved.sources.map(source => source.voiceNote).find(Boolean) || null,
            });
        }
        const secondary = [];
        for (const item of (Array.isArray(parsed.secondary) ? parsed.secondary : [])) {
            if (secondary.length >= LIMITS.secondaryMax) break;
            const resolved = resolveItem(item);
            if (!resolved || resolved.ids.some(id => usedIds.has(id))) continue;
            resolved.ids.forEach(id => usedIds.add(id));
            const primary = resolved.sources[0];
            secondary.push({
                claim: trimWords(item.claim || primary.claim, LIMITS.claimWords),
                evidenceQuote: primary.evidenceQuote || null,
                revisionMove: trimWords(item.revisionMove || primary.revisionMove || '', LIMITS.moveWords),
                sourceIds: resolved.ids,
                roles: resolved.roles,
                corroborated: resolved.roles.length >= 2,
                confidence: resolved.sources.some(source => source.confidence === 'low') ? 'low' : 'high',
            });
        }
        const preserve = [];
        for (const item of (Array.isArray(parsed.preserve) ? parsed.preserve : [])) {
            if (preserve.length >= LIMITS.preserveMax) break;
            const resolved = resolveItem(item, true);
            if (!resolved) continue;
            const primary = resolved.sources[0];
            const quote = primary.quote || primary.evidenceQuote;
            if (!quote || !anchorValid(quote, draftText)) continue;
            preserve.push({ quote, why: trimWords(item.why || primary.why || '', LIMITS.whyWords), sourceIds: resolved.ids });
        }
        const disagreements = [];
        for (const item of (Array.isArray(parsed.disagreements) ? parsed.disagreements : [])) {
            if (disagreements.length >= LIMITS.disagreementMax) break;
            if (!item || !item.question || !Array.isArray(item.positions) || item.positions.length < 2) continue;
            const resolved = resolveItem(item);
            disagreements.push({
                question: trimWords(item.question, LIMITS.claimWords),
                positions: item.positions.slice(0, 3).map(position => ({ roleKey: String(position.roleKey || ''), view: trimWords(position.view || '', LIMITS.whyWords) })),
                sourceIds: resolved ? resolved.ids : [],
            });
        }
        if (!priorities.length && !secondary.length && !preserve.length && validFindings.length) {
            return { ok: false, reason: 'empty-synthesis' };
        }
        return {
            ok: true,
            report: {
                summary: trimWords(parsed.summary || '', LIMITS.claimWords),
                priorities, secondary, preserve, disagreements,
            },
        };
    }

    window.StudioCouncil = { LIMITS, norm, anchorValid, parseJsonLoose, validateReviewerResult, validateSynthesisResult };
}());
