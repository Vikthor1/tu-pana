/*
 * Tu Pana Writing Studio — AI provider seam.
 * Prompt contracts are translated from the legacy application (read-only sources
 * at R0 1462aea): PASSAGE_READING_PROTOCOL and the full-draft review contract
 * from assets/js/ui.js, the authorship rules from buildOllamaSystemPrompt, and
 * the Council reviewer/synthesis contracts from assets/js/council.js.
 *
 * Two providers share one contract:
 *   mock   — deterministic, local-only, zero network; the default in this plane.
 *            Failure states are injectable with ?mockfail=<category> for tests.
 *   gemini — the production adapter, speaking the deployed Worker's existing
 *            request contract and requestKinds (passage_analysis,
 *            full_draft_review, council_reviewer, council_synthesis). It is
 *            selected only by explicit configuration (window.STUDIO_CONFIG =
 *            { provider: 'gemini' }) and is never exercised by the automated
 *            suites; no live-model behavior is claimed in this plane.
 *
 * Every call is preceded by the interface's consent gate. Nothing in this file
 * initiates a request on its own, mutates the draft, or stores prompt/draft
 * text in usage records (token/request counts only, mirroring the legacy
 * metadata-only usage contract).
 */
(function () {
    'use strict';

    // ── Prompt contracts (translated from legacy) ─────────────────────────────

    const AUTHORSHIP_RULES =
`ABSOLUTE AUTHORSHIP RULE — this overrides everything else:
Do not produce any sentence, phrase, outline item, paragraph, bridge sentence, thesis sentence, introduction sentence, conclusion sentence, topic sentence, or revised sentence that could be copied into the student's work.
This rule applies even when the student asks for an example, a rewrite, an academic register, an outline, a stronger version, or a sentence starter.
Never write "For example:" followed by student-like content. Use blanks or questions instead.
If your response includes quotation marks around a full sentence that you generated, you are probably violating this rule. Only quote the student's own words when referring to them.
You may provide only: questions the student can answer; blank frames with blanks only; checklists of what the student's own sentence should do; descriptions of rhetorical moves without wording them as sentences; names of rhetorical strategies; and feedback about what is working and what needs more specificity.
You must not write the student's work for them. Never produce full essays, drafts, paragraphs, introductions, conclusions, outlines, citations, bibliographies, self-assessments, or process reports for the student.`;

    const PASSAGE_READING_PROTOCOL =
`WHOLE-PASSAGE READING PROTOCOL — mandatory:
- Read the entire selected passage before diagnosing any sentence.
- Briefly name the passage's current rhetorical movement: how its opening, development, evidence, and/or reflection work together.
- Check later sentences before saying that context, specificity, evidence, explanation, or connection is missing. Never ask for information the selection already provides.
- If the highest-impact issue is in the opening sentence, say what rhetorical job the proposed change would serve and explain why.
- Distinguish among hook, focus, sequencing, evidence, connection, reflection, clarity, and voice. Name the actual level of the issue instead of giving generic praise or asking a generic question.
- Ground feedback in the student's exact words, including relevant material later in the passage. Do not rewrite, paraphrase, or provide replacement prose.
- Address the student's stated request directly. Offer one highest-impact next move and at most one focused decision question.`;

    function genreHeader(payload) {
        const lines = [
            `Assignment or genre: ${payload.genreName}`,
            `Interface language: ${payload.lang}`,
        ];
        if (payload.genreContext) lines.push(`GENRE GUIDANCE (additive; it does NOT relax any rule above): ${payload.genreContext}`);
        return lines.join('\n');
    }

    function voiceConstraintBlock(voiceEntries) {
        if (!voiceEntries || !voiceEntries.length) return '';
        return '\nSTUDENT-PROTECTED VOICE — the student explicitly asked that these exact passages be honored, never corrected, standardized, translated, or smoothed:\n'
            + voiceEntries.map(entry => `- "${entry.text}"`).join('\n') + '\n';
    }

    function buildPassagePrompt(payload) {
        return `${AUTHORSHIP_RULES}\n\n${genreHeader(payload)}\n${voiceConstraintBlock(payload.voiceEntries)}\n[STUDENT-SELECTED ${payload.scopeLabel.toUpperCase()}]\n${payload.text}\n[END SELECTED TEXT]\n\n${PASSAGE_READING_PROTOCOL}\n${payload.moveContext ? `\nSTUDENT PLANNING CONTEXT (student-authored, explicitly chosen for this request):\nMove: ${payload.moveContext.moveLabel}\nNote: ${payload.moveContext.noteText}\n` : ''}\nSTUDENT REQUEST:\n${payload.question}`;
    }

    function buildFullDraftPrompt(payload) {
        return `${AUTHORSHIP_RULES}\n\n[FULL-DRAFT REVIEW]\n${genreHeader(payload)}\nSelected lens: ${payload.lensLabel}\nStudent purpose for this reading: ${payload.purpose}\nDraft word count: ${payload.words}\n${voiceConstraintBlock(payload.voiceEntries)}\n[STUDENT DRAFT — READ ALL OF IT BEFORE RESPONDING]\n${payload.text}\n[END STUDENT DRAFT]\n\nMANDATORY WHOLE-DRAFT REVIEW CONTRACT:\n- Read the entire draft before diagnosing any part. Later paragraphs may develop, qualify, or answer something introduced earlier.\n- Apply only this assignment or genre's expectations. Do not import expectations from another genre.\n- Lens instruction: ${payload.lensInstruction || payload.lensLabel}\n- Do not rewrite, line-edit, or produce replacement prose. Do not add facts, experiences, evidence, sources, or language the student did not provide.\n- Ground every important observation in an exact anchor from the student's draft.\n- Never request information that appears elsewhere in the draft.\n- Prioritize. Do not turn the response into a line-by-line inventory.\n\nUse exactly these four labeled sections in the current interface language:\n1. CURRENT MOVEMENT — map what the draft currently does in 2–3 sentences.\n2. TWO STRENGTHS — two specific strengths, each with a draft anchor and its effect.\n3. PRIORITY REVISIONS — at most three high-impact priorities. For each: location, effect on the reader, and one revision route the student can carry out.\n4. BEST NEXT ACTION — one concrete action the student should do next.\nEnd after BEST NEXT ACTION. Do not add a rewritten model paragraph.`;
    }

    function buildCouncilReviewerPrompt(payload) {
        return `${AUTHORSHIP_RULES}\n\n[COUNCIL REVIEWER]\n${genreHeader(payload)}\nYOUR ROLE — ${payload.roleLabel}\nMANDATE: ${payload.roleMandate || payload.roleLabel}\n${payload.prohibitions && payload.prohibitions.length ? `PROHIBITED IN THIS GENRE:\n${payload.prohibitions.map(rule => `- ${rule}`).join('\n')}\n` : ''}RULES:\n- At most 5 findings; reporting no findings is an acceptable answer.\n- Every finding MUST anchor to a verbatim quotation from the draft (3–40 words); non-verbatim anchors are discarded automatically.\n- Name a revision strategy, never replacement prose.\n- Warn explicitly when a likely recommendation would flatten culturally meaningful, dialectal, or code-meshed language.\n\n[STUDENT DRAFT]\n${payload.text}\n[END STUDENT DRAFT]`;
    }

    function buildCouncilSynthesisPrompt(payload) {
        return `[COUNCIL SYNTHESIS]\n${genreHeader(payload)}\nWork only from the reviewer findings provided below. Every output item must cite its source findings.\nSynthesis order for tie-breaking only: ${(payload.synthesisOrder || []).join(' > ')}.\nDisagreements must NOT be resolved: state each position fairly as a question only the writer can answer.\nNo praise, scores, or predictions.\n\nREVIEWER FINDINGS:\n${payload.findingsJson}`;
    }

    // ── Error copy (translated from legacy getGeminiErrorMessage) ─────────────

    const ERROR_COPY = {
        rate_limited: {
            es: 'El coach está ocupado en este momento. Espera un minuto e inténtalo de nuevo — tu trabajo está guardado.',
            en: 'The coach is busy right now. Wait a minute and try again — your work is saved.',
        },
        service_unavailable: {
            es: 'El servicio de IA no está disponible ahora. Tu borrador no cambió; puedes seguir escribiendo sin IA.',
            en: 'The AI service is unavailable right now. Your draft is unchanged; you can keep writing without AI.',
        },
        upstream_error: {
            es: 'El servicio de IA devolvió un error. Nada se guardó de esta solicitud; inténtalo más tarde.',
            en: 'The AI service returned an error. Nothing from this request was saved; try again later.',
        },
        network_error: {
            es: 'No hay conexión con el servicio de IA. Tu trabajo sigue guardado en este dispositivo.',
            en: 'The AI service could not be reached. Your work remains saved on this device.',
        },
        origin_forbidden: {
            es: 'Esta copia de Tu Pana no está autorizada para usar el coach en vivo. No lo reintentes; abre el enlace oficial.',
            en: 'This copy of Tu Pana is not authorized to use the live coach. Do not retry; open the official link.',
        },
        prompt_too_large: {
            es: 'El texto es demasiado largo para una sola solicitud. Elige la sección en la que quieres trabajar primero.',
            en: 'The text is too large for one request. Choose the section you want to work on first.',
        },
        auth_error: {
            es: 'El servicio de IA no está configurado. Puedes continuar todo el proceso de escritura sin IA.',
            en: 'The AI service is not configured. You can continue the entire writing process without AI.',
        },
    };
    const RETRYABLE = new Set(['rate_limited', 'service_unavailable', 'upstream_error', 'network_error']);

    function errorMessage(category, lang) {
        const entry = ERROR_COPY[category] || ERROR_COPY.upstream_error;
        return lang === 'en' ? entry.en : entry.es;
    }

    // ── Mock provider (default in this plane) ─────────────────────────────────
    // Deterministic and local-only. Responses intentionally match the hardened
    // finalist's mock strings so the pinned behavior suites stay meaningful.

    function mockFailCategory() {
        try { return new URLSearchParams(location.search).get('mockfail') || null; } catch { return null; }
    }

    function createMockProvider() {
        return {
            name: 'mock-local',
            live: false,
            call({ requestKind, payload, lang }) {
                return new Promise((resolve, reject) => {
                    window.setTimeout(() => {
                        const fail = mockFailCategory();
                        if (fail && ERROR_COPY[fail]) {
                            reject({ category: fail, message: errorMessage(fail, lang), retryable: RETRYABLE.has(fail) });
                            return;
                        }
                        const genreLabel = payload.genreName;
                        let text;
                        if (requestKind === 'council_reviewer') {
                            text = payload.roleSuggestion;
                        } else if (requestKind === 'council_synthesis') {
                            text = payload.synthesisText || '';
                        } else if (lang !== 'en') {
                            text = `Fortaleza: el pasaje establece una dirección clara para ${genreLabel}. Pregunta de revisión: ¿qué evidencia específica ayudaría al lector a seguir esta idea? No reescribí ninguna oración.`;
                        } else {
                            text = `Strength: the passage sets a clear direction for ${genreLabel}. Revision question: what specific evidence would help a reader follow this idea further? I did not rewrite any sentence.`;
                        }
                        resolve({ text, truncated: false, usage: { requests: 1 } });
                    }, 260);
                });
            },
        };
    }

    // ── Gemini provider (production adapter; configuration-selected only) ─────
    // Speaks the deployed Worker's existing contract. Retry policy translated
    // from legacy ai-provider.js: 2 retries on retryable categories with backoff.

    function statusToCategory(status) {
        if (status === 429) return 'rate_limited';
        if (status === 403) return 'origin_forbidden';
        if (status === 400) return 'bad_request';
        if (status === 503) return 'service_unavailable';
        if (status === 502) return 'upstream_error';
        return 'upstream_error';
    }

    function createGeminiProvider(config) {
        const proxyUrl = config?.proxyUrl;
        return {
            name: 'gemini-proxy',
            live: true,
            async call({ requestKind, prompt, stageId, lang }) {
                if (!proxyUrl) throw { category: 'auth_error', message: errorMessage('auth_error', lang), retryable: false };
                let lastError = null;
                for (let attempt = 0; attempt <= 2; attempt++) {
                    if (attempt) await new Promise(resolveDelay => window.setTimeout(resolveDelay, attempt === 1 ? 1500 : 4000));
                    try {
                        const response = await fetch(proxyUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ prompt, stageId: stageId || null, requestKind }),
                        });
                        if (!response.ok) {
                            const category = statusToCategory(response.status);
                            lastError = { category, message: errorMessage(category, lang), retryable: RETRYABLE.has(category) };
                            if (!lastError.retryable) throw lastError;
                            continue;
                        }
                        const data = await response.json();
                        return { text: data.text || '', truncated: Boolean(data.truncated), usage: data.usage || { requests: 1 } };
                    } catch (error) {
                        if (error && error.category) { lastError = error; if (!error.retryable) break; continue; }
                        lastError = { category: 'network_error', message: errorMessage('network_error', lang), retryable: true };
                    }
                }
                throw lastError || { category: 'network_error', message: errorMessage('network_error', lang), retryable: false };
            },
        };
    }

    function active() {
        const config = window.STUDIO_CONFIG || {};
        if (config.provider === 'gemini') return createGeminiProvider(config);
        return createMockProvider();
    }

    window.StudioProvider = {
        buildPassagePrompt, buildFullDraftPrompt,
        buildCouncilReviewerPrompt, buildCouncilSynthesisPrompt,
        errorMessage, active, createMockProvider, createGeminiProvider,
    };
}());
