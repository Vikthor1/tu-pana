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

    // F1 — the request block is LABELLED TRUTHFULLY. `STUDENT REQUEST` is the
    // default and every pre-F1 caller keeps it, so their prompts are
    // byte-identical. The Ask Tu Pana path passes an explicit label when the
    // writer left the question blank, so a request Tu Pana generated on the
    // writer's behalf is never presented to the model as something the writer
    // asked. Before F1 this path sent the literal placeholder
    // 'Student question' under this header — text and no actual request.
    function buildPassagePrompt(payload) {
        const requestLabel = payload.requestLabel || 'STUDENT REQUEST';
        return `${AUTHORSHIP_RULES}\n\n${genreHeader(payload)}\n${voiceConstraintBlock(payload.voiceEntries)}\n[STUDENT-SELECTED ${payload.scopeLabel.toUpperCase()}]\n${payload.text}\n[END SELECTED TEXT]\n\n${PASSAGE_READING_PROTOCOL}\n${payload.moveContext ? `\nSTUDENT PLANNING CONTEXT (student-authored, explicitly chosen for this request):\nMove: ${payload.moveContext.moveLabel}\nNote: ${payload.moveContext.noteText}\n` : ''}\n${requestLabel}:\n${payload.question}`;
    }

    function buildFullDraftPrompt(payload) {
        return `${AUTHORSHIP_RULES}\n\n[FULL-DRAFT REVIEW]\n${genreHeader(payload)}\nSelected lens: ${payload.lensLabel}\nStudent purpose for this reading: ${payload.purpose}\nDraft word count: ${payload.words}\n${voiceConstraintBlock(payload.voiceEntries)}\n[STUDENT DRAFT — READ ALL OF IT BEFORE RESPONDING]\n${payload.text}\n[END STUDENT DRAFT]\n\nMANDATORY WHOLE-DRAFT REVIEW CONTRACT:\n- Read the entire draft before diagnosing any part. Later paragraphs may develop, qualify, or answer something introduced earlier.\n- Apply only this assignment or genre's expectations. Do not import expectations from another genre.\n- Lens instruction: ${payload.lensInstruction || payload.lensLabel}\n- Do not rewrite, line-edit, or produce replacement prose. Do not add facts, experiences, evidence, sources, or language the student did not provide.\n- Ground every important observation in an exact anchor from the student's draft.\n- Never request information that appears elsewhere in the draft.\n- Prioritize. Do not turn the response into a line-by-line inventory.\n\nUse exactly these four labeled sections in the current interface language:\n1. CURRENT MOVEMENT — map what the draft currently does in 2–3 sentences.\n2. TWO STRENGTHS — two specific strengths, each with a draft anchor and its effect.\n3. PRIORITY REVISIONS — at most three high-impact priorities. For each: location, effect on the reader, and one revision route the student can carry out.\n4. BEST NEXT ACTION — one concrete action the student should do next.\nEnd after BEST NEXT ACTION. Do not add a rewritten model paragraph.`;
    }

    // B1 de-duplication. The Council path receives BOTH the universal genre
    // carrier (genreContext → GENRE GUIDANCE) and the Council carrier
    // (prohibitions). Where a profile declares one canonical safeguard set,
    // the same sentence would otherwise be transmitted twice in a single
    // prompt. This drops from the Council list any rule already carried
    // verbatim in GENRE GUIDANCE — the protection still reaches the reviewer,
    // exactly once. Genuinely Council-specific rules, and any rule not carried
    // by genreContext, are untouched and still listed.
    function councilOnlyProhibitions(payload) {
        const context = String(payload.genreContext || '');
        return (payload.prohibitions || []).filter(rule => !context.includes(rule));
    }

    function buildCouncilReviewerPrompt(payload) {
        const prohibitions = councilOnlyProhibitions(payload);
        return `${AUTHORSHIP_RULES}\n\n[COUNCIL REVIEWER]\n${genreHeader(payload)}\nYOUR ROLE — ${payload.roleLabel}\nMANDATE: ${payload.roleMandate || payload.roleLabel}\n${prohibitions.length ? `PROHIBITED IN THIS GENRE:\n${prohibitions.map(rule => `- ${rule}`).join('\n')}\n` : ''}RULES:\n- At most 5 findings; reporting no findings is an acceptable answer (\"noFindings\": true).\n- Every finding MUST include \"evidenceQuote\": an exact verbatim quotation from the draft, 3–40 words, copied in whatever language the student wrote. Non-verbatim anchors are discarded automatically by validation code.\n- \"revisionMove\" names a strategy the student can carry out — never replacement prose.\n- Use \"confidence\": \"low\" whenever a competent reader could reasonably disagree.\n- Add \"voiceNote\" when a likely recommendation would flatten culturally meaningful, dialectal, or code-meshed language.\n- Write student-facing fields in the interface language named above.\n\nRespond with ONLY this strict JSON, no code fences, no commentary:\n{\"noFindings\": false, \"findings\": [{\"claim\": \"<=60 words\", \"evidenceQuote\": \"verbatim 3-40 words\", \"severity\": \"priority|secondary\", \"confidence\": \"high|low\", \"why\": \"<=40 words\", \"revisionMove\": \"<=40 words\", \"voiceNote\": \"optional\"}], \"preserve\": [{\"quote\": \"verbatim\", \"why\": \"<=40 words\"}]}\n\n[STUDENT DRAFT]\n${payload.text}\n[END STUDENT DRAFT]`;
    }

    function buildCouncilSynthesisPrompt(payload) {
        return `[COUNCIL SYNTHESIS]\n${genreHeader(payload)}\nWork ONLY from the validated reviewer findings provided below. Every output item must cite real source finding ids in \"sourceIds\"; unknown ids are discarded by validation code and corroboration is recomputed by code, never trusted from you.\nSynthesis order for tie-breaking only: ${(payload.synthesisOrder || []).join(' > ')}.\nDisagreements must NOT be resolved: state each position fairly as a question only the writer can answer.\nNo praise, scores, or predictions. Caps: 3 priorities, 4 secondary, 3 preserve, 2 disagreements.\n\nRespond with ONLY this strict JSON, no code fences, no commentary:\n{\"summary\": \"<=60 words\", \"priorities\": [{\"claim\": \"...\", \"revisionMove\": \"...\", \"why\": \"...\", \"sourceIds\": [\"structure-1\"]}], \"secondary\": [...same shape...], \"preserve\": [{\"why\": \"...\", \"sourceIds\": [\"voice-p1\"]}], \"disagreements\": [{\"question\": \"...\", \"positions\": [{\"roleKey\": \"...\", \"view\": \"...\"}], \"sourceIds\": [...]}]}\n\nREVIEWER FINDINGS (validated):\n${payload.findingsJson}`;
    }

    // ── F1 — prose response-integrity guard ──────────────────────────────────
    // Modelled on the Council kernel's validate-BEFORE-store discipline
    // (studio-council.js), which demonstrably works: a generated artifact that
    // fails application-side validation is discarded and can never be shown or
    // persisted. The Council path gets that for free because it demands strict
    // JSON — prose scaffolding fails parseJsonLoose() and is dropped. The four
    // single-coach pathways receive free prose and had no equivalent gate.
    //
    // Observed in the 1D live run: an Ask Tu Pana request on a plain draft
    // returned ~5,973 characters of the model's own deliberation, opening
    // "Here's a thinking process that applies the rules…" and reciting this
    // file's rule scaffolding by name, on the College Personal Statement route.
    // Showing a student the guardrail structure is exactly what someone trying
    // to circumvent it would want.
    //
    // DESIGN — precision over reach. Rejecting good coaching is itself a harm,
    // so the markers below are strings that appear in OUR OWN prompt
    // scaffolding and essentially nowhere in legitimate writing feedback. That
    // makes the guard falsifiable and self-maintaining: if a prompt header is
    // renamed, its marker is renamed with it. Deliberately NOT matched:
    // "thinking process" in running prose ("your thinking process is visible
    // here" is real coaching), and the bare word "prompt" ("the assignment
    // prompt" is real coaching). Only line-initial headings and explicit
    // self-referential instruction talk are caught.
    //
    // This guard does not claim to catch every possible leak. It catches the
    // observed failure class deterministically and fails toward showing the
    // student nothing rather than showing them scaffolding.
    const SCAFFOLD_MARKERS = [
        'absolute authorship rule',
        'whole-passage reading protocol',
        'whole-draft review contract',
        'passage reading protocol',
        'genre guidance',
        'student-selected passage',
        'student-selected paragraph',
        'student-selected full',
        'end selected text',
        'end student draft',
        'student request:',
        'student-protected voice',
        'student planning context',
        'prohibited in this genre',
        'council reviewer]',
        'council synthesis]',
        'full-draft review]',
        'interface language:',
        'assignment or genre:',
        'constraint check',
        'final review against',
        'system prompt',
        'evidencequote',
        'revisionmove',
        'sourceids',
        'nofindings',
    ];

    const DELIBERATION_PATTERNS = [
        // "Here's a thinking process that applies the rules…" (observed, R2)
        /\bhere(?:'|’)?s?\s+(?:is\s+)?(?:a|my|the)\s+(?:thinking|thought|reasoning)\s+process\b/i,
        // A line that opens a deliberation section, with or without markdown.
        /^\s*(?:#{1,6}\s*)?(?:\*{1,2}\s*)?(?:thinking|thought|reasoning)\s+process\b/im,
        /^\s*(?:#{1,6}\s*)?(?:\*{1,2}\s*)?proceso\s+de\s+(?:pensamiento|razonamiento)\b/im,
        /\bchain[-\s]of[-\s]thought\b/i,
        // The model narrating a pass over its own instructions.
        /\b(?:my|the)\s+(?:system\s+prompt|instructions\s+above|guidelines\s+above)\b/i,
        /\b(?:given|provided|described)\s+in\s+the\s+(?:system\s+)?prompt\b/i,
        /\bapplies?\s+the\s+rules\s+and\s+genre\s+guidance\b/i,
        /\bfinal\s+(?:review|check)\s+against\s+(?:all\s+)?(?:the\s+)?rules\b/i,
        /\b(?:mis|las)\s+(?:reglas|instrucciones)\s+del\s+sistema\b/i,
    ];

    // Returns { ok: true, text } or { ok: false, reason, marker }.
    // `marker` exists for TESTS AND LOCAL DIAGNOSIS ONLY. It is a fragment of
    // the scaffolding itself, so callers must never render it to the writer or
    // write it into a stored record — that would reintroduce the leak the
    // guard exists to stop. Only `reason` is safe to persist.
    function validateCoachResponse(rawText) {
        const text = typeof rawText === 'string' ? rawText : '';
        if (!text.trim()) return { ok: false, reason: 'empty', marker: null };
        const lower = text.toLowerCase();
        const marker = SCAFFOLD_MARKERS.find(entry => lower.includes(entry));
        if (marker) return { ok: false, reason: 'scaffolding', marker };
        const pattern = DELIBERATION_PATTERNS.find(entry => entry.test(text));
        if (pattern) return { ok: false, reason: 'deliberation', marker: String(pattern) };
        return { ok: true, text };
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
        timeout: {
            es: 'La solicitud tardó demasiado y se detuvo. Tu borrador no cambió; puedes intentarlo de nuevo.',
            en: 'The request took too long and was stopped. Your draft is unchanged; you can try again.',
        },
        bad_request: {
            es: 'El servicio de IA no pudo aceptar esta solicitud. Nada se guardó; puedes seguir escribiendo sin IA.',
            en: 'The AI service could not accept this request. Nothing was saved; you can keep writing without AI.',
        },
        auth_error: {
            es: 'El servicio de IA no está configurado. Puedes continuar todo el proceso de escritura sin IA.',
            en: 'The AI service is not configured. You can continue the entire writing process without AI.',
        },
        // F1 — the response arrived but failed the integrity guard. Calm and
        // truthful: it says what happened, that nothing was kept, and what the
        // writer can do next. It never names or quotes what was rejected.
        response_rejected: {
            es: 'La respuesta no cumplió las reglas de respuesta de Tu Pana, así que no se mostró ni se guardó. Tu borrador no cambió. Puedes preguntar otra vez — una pregunta específica suele ayudar — o seguir escribiendo sin IA.',
            en: 'The answer did not meet Tu Pana’s response rules, so it was not shown or saved. Your draft is unchanged. You can ask again — a specific question usually helps — or keep writing without AI.',
        },
    };
    // response_rejected is deliberately absent: it is decided AFTER a
    // successful HTTP response, so the transport retry loop never sees it, and
    // an automatic retry would spend a second paid call on the same prompt.
    // The writer retries by pressing send again, which is their decision.
    const RETRYABLE = new Set(['rate_limited', 'service_unavailable', 'upstream_error', 'network_error', 'timeout']);

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

    // Adversarial Council fixtures for validation testing: ?mockcouncil=
    // malformed | missingfields | badanchor | partial | allfail | synthfail | emptysynth
    function mockCouncilFixture() {
        try { return new URLSearchParams(location.search).get('mockcouncil') || null; } catch { return null; }
    }

    // F1 — adversarial COACH fixtures, so the response-integrity guard is
    // exercised deterministically with zero live calls, exactly as
    // ?mockcouncil= exercises the Council kernel: ?mockleak=
    // scaffolding | deliberation | empty | clean
    // The scaffolding fixture reproduces the SHAPE of the 1D leak (rule names
    // recited back at the writer); it is a test fixture, never a real prompt.
    function mockLeakFixture() {
        try { return new URLSearchParams(location.search).get('mockleak') || null; } catch { return null; }
    }

    const MOCK_LEAK_TEXT = {
        scaffolding: 'Constraint Check — ABSOLUTE AUTHORSHIP RULE: no sentences, phrases, or outlines the student could copy. GENRE GUIDANCE (Personal Statement): not acting as an admissions officer. Final Review against ALL Rules: passed.',
        deliberation: 'Here\'s a thinking process that applies the rules and genre guidance to the student\'s request: first I consider what the writer needs, then I check each constraint in order, and then I answer.',
        empty: '   ',
    };

    function mockReviewerJson(payload) {
        const fixture = mockCouncilFixture();
        if (fixture === 'malformed') return 'I looked at the draft and here are my thoughts, unstructured.';
        if (fixture === 'missingfields') return JSON.stringify({ findings: [{ claim: 'A claim with no anchor at all.' }] });
        if (fixture === 'badanchor') return JSON.stringify({ findings: [{ claim: 'A claim resting on an invented quotation.', evidenceQuote: 'this exact wording appears nowhere in the submitted draft', severity: 'priority', confidence: 'high', why: 'Invented.', revisionMove: 'None.' }] });
        const draft = String(payload.draft || '');
        const words = draft.trim().split(/\s+/).filter(Boolean);
        const quote = words.slice(0, Math.min(8, words.length)).join(' ');
        const laterQuote = words.length > 18 ? words.slice(10, 18).join(' ') : quote;
        const role = payload.roleKey || 'structure';
        const finding = {
            claim: `${payload.roleLabel}: consider how this section carries the ${payload.genreName} purpose for its reader.`,
            evidenceQuote: quote,
            severity: role === 'evidence' ? 'secondary' : 'priority',
            confidence: role === 'evidence' ? 'low' : 'high',
            why: 'Deterministic mock reasoning grounded in the consented text.',
            revisionMove: 'Name the connection in your own words before expanding it.',
        };
        if (role === 'voice') finding.voiceNote = 'If any phrase here is culturally meaningful, keep its exact wording.';
        return JSON.stringify({ noFindings: false, findings: [finding], preserve: [{ quote: laterQuote, why: 'This wording is doing distinct work; keep it.' }] });
    }

    function mockSynthesisJson(payload) {
        const fixture = mockCouncilFixture();
        if (fixture === 'synthfail') return 'The council mostly agrees, in prose.';
        if (fixture === 'emptysynth') return JSON.stringify({ summary: 'Empty.', priorities: [], secondary: [], preserve: [], disagreements: [] });
        const findings = (payload.validated && payload.validated.findings) || [];
        const preserve = (payload.validated && payload.validated.preserve) || [];
        const priorities = findings.slice(0, 2).map(finding => ({ claim: finding.claim, revisionMove: finding.revisionMove, why: finding.why, sourceIds: [finding.id] }));
        const secondary = findings.slice(2, 3).map(finding => ({ claim: finding.claim, revisionMove: finding.revisionMove, sourceIds: [finding.id] }));
        const preserveOut = preserve.slice(0, 2).map(item => ({ why: item.why, sourceIds: [item.id] }));
        const roles = [...new Set(findings.map(finding => finding.roleKey))];
        const disagreements = roles.length >= 2 && findings.length >= 2
            ? [{ question: 'Should the opening move faster, or does its current pace do necessary work? Only the writer can decide.', positions: [{ roleKey: findings[0].roleKey, view: 'The opening earns its length.' }, { roleKey: findings[1].roleKey, view: 'The opening delays the purpose.' }], sourceIds: [findings[0].id, findings[1].id] }]
            : [];
        return JSON.stringify({ summary: `Deterministic mock synthesis for ${payload.genreName}.`, priorities, secondary, preserve: preserveOut, disagreements });
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
                        const fixture = mockCouncilFixture();
                        let text;
                        if (requestKind === 'council_reviewer') {
                            if ((fixture === 'partial' && payload.roleKey === 'evidence') || fixture === 'allfail') {
                                reject({ category: 'upstream_error', message: errorMessage('upstream_error', lang), retryable: false });
                                return;
                            }
                            text = mockReviewerJson(payload);
                        } else if (requestKind === 'council_synthesis') {
                            text = mockSynthesisJson(payload);
                        } else if (MOCK_LEAK_TEXT[mockLeakFixture()]) {
                            // Coach/full-draft pathways only; the Council kernel
                            // has its own validation and is left untouched.
                            text = MOCK_LEAK_TEXT[mockLeakFixture()];
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

    // Legacy request contract (ai-provider.js selectGeminiModel): these request
    // kinds are served by gemini-2.5-flash, and the deployed Worker applies its
    // per-kind output ceilings only when the model accompanies the kind.
    const GEMINI_MODEL_BY_KIND = {
        passage_analysis: 'gemini-2.5-flash',
        full_draft_review: 'gemini-2.5-flash',
        capstone_review: 'gemini-2.5-flash',
        council_reviewer: 'gemini-2.5-flash',
        council_synthesis: 'gemini-2.5-flash',
    };

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
                    const controller = new AbortController();
                    const timeoutId = window.setTimeout(() => controller.abort(), 45000);
                    try {
                        const response = await fetch(proxyUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ prompt, stageId: stageId || null, requestKind, model: GEMINI_MODEL_BY_KIND[requestKind] }),
                            signal: controller.signal,
                        });
                        window.clearTimeout(timeoutId);
                        if (!response.ok) {
                            const category = statusToCategory(response.status);
                            lastError = { category, message: errorMessage(category, lang), retryable: RETRYABLE.has(category) };
                            if (!lastError.retryable) throw lastError;
                            continue;
                        }
                        const data = await response.json();
                        return { text: data.text || '', truncated: Boolean(data.truncated), usage: data.usage || { requests: 1 } };
                    } catch (error) {
                        window.clearTimeout(timeoutId);
                        if (error && error.category) { lastError = error; if (!error.retryable) break; continue; }
                        const category = error && error.name === 'AbortError' ? 'timeout' : 'network_error';
                        lastError = { category, message: errorMessage(category, lang), retryable: true };
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
        validateCoachResponse, SCAFFOLD_MARKERS, DELIBERATION_PATTERNS,
        errorMessage, active, createMockProvider, createGeminiProvider,
    };
}());
