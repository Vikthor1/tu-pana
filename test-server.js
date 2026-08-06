/**
 * Tu Pana de Escritura — Local Mock Server
 *
 * Emulates the Microsoft Direct Line API so the webapp can be stress-tested
 * locally without a Copilot Studio subscription or any API cost.
 *
 * Run:  node test-server.js
 * Open: http://localhost:3001
 *
 * Serves this repository's static files from the directory containing this
 * file, so it works from any checkout location. No absolute paths, no
 * credentials, no filesystem writes, no outbound network calls.
 *
 * PORT is overridable (TUPANA_TEST_PORT or PORT) for diagnosing a busy port,
 * but the tracked regression suites hardcode 3001 and the Worker's dev-origin
 * allowlist admits only :3001 — so the documented suite run must use 3001.
 */

const express  = require('express');
const cors     = require('cors');
const fs       = require('fs');
const path     = require('path');

const app  = express();
const DEFAULT_PORT = 3001;
const PORT = Number(process.env.TUPANA_TEST_PORT || process.env.PORT || DEFAULT_PORT);

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
//  In-memory conversation store
// ─────────────────────────────────────────────
const conversations = {};

function newConvId() {
    return 'mock-' + Math.random().toString(36).slice(2, 10);
}

// ═══════════════════════════════════════════════════════════════
//  TEXT-AWARE DRAFT ANALYSIS (NLP-lite heuristics)
// ═══════════════════════════════════════════════════════════════

const SENSORY_WORDS = new Set([
    'sweat','drip','face','warm','heat','hot','cold','eyes','gaze','look','stare',
    'hand','touch','skin','breath','smell','taste','sound','hear','listen','voice',
    'shiver','shake','tremble','ache','burn','freeze','pound','ring','blur','sharp',
    'soft','rough','smooth','wet','dry','damp','sticky','tight','loose','heavy',
    'light','bright','dark','loud','quiet','fast','slow','tears','cry','laugh',
    'grin','frown','blink','widen','narrow','clench','relax','tense','pulse'
]);

const BRIDGE_PHRASES = [
    'scenes like','not unique','not alone','millions of','thousands of',
    'many people','communities like','families like','the fact that','this is not just',
    'more than just','beyond my own','larger than','part of a pattern',
    'systemic','structural','historical context','social pattern'
];

const ABSTRACT_NOUNS = [
    'society','culture','system','structure','institution','policy','economy',
    'politics','history','identity','belonging','injustice','inequality',
    'oppression','privilege','power','resistance','assimilation','integration'
];

function analyzeDraft(text) {
    const sentences = text
        .replace(/\n+/g, ' ')
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(Boolean);

    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    const cleanWords = words.map(w => w.replace(/[^a-záéíóúñü]/gi, '')).filter(Boolean);

    const sensoryHits = cleanWords.filter(w => SENSORY_WORDS.has(w));
    const sensoryScore = sensoryHits.length / Math.max(cleanWords.length, 1);

    const spanishWords = cleanWords.filter(w => /[áéíóúñü]/i.test(w));
    const hasSpanish = spanishWords.length > 0;
    const spanishPhrase = text.match(/["']?[a-záéíóúñü\s]+(?:no entiendo|no sé|mi mamá|mi papá|mi abuela|échale ganas|así es|qué sé yo|todo bien)["']?/i);

    const dialogueMatch = text.match(/["']([^"']{10,120})["']/);
    const hasDialogue = !!dialogueMatch;
    const dialogueQuote = dialogueMatch ? dialogueMatch[1] : '';

    const lowerText = text.toLowerCase();
    const bridgeHits = BRIDGE_PHRASES.filter(p => lowerText.includes(p));
    const hasBridge = bridgeHits.length > 0;

    const abstractHits = ABSTRACT_NOUNS.filter(n => lowerText.includes(n));
    const hasAbstract = abstractHits.length > 0;

    const firstSentence = sentences[0] || '';
    const isFirstSensory = firstSentence.split(/\s+/).some(w => SENSORY_WORDS.has(w.toLowerCase().replace(/[^a-z]/gi, '')));

    const wordCount = cleanWords.length;
    const openingWords = text.trim().split(/\s+/).slice(0, 10);
    const opening = openingWords.join(' ');

    return {
        sentences, wordCount,
        sensoryScore, sensoryHits,
        hasSpanish, spanishWords, spanishPhrase,
        hasDialogue, dialogueQuote,
        hasBridge, bridgeHits,
        hasAbstract, abstractHits,
        isFirstSensory,
        opening
    };
}

function buildDraftWelcome(draftText, channelData) {
    const a = analyzeDraft(draftText);
    const stage = (channelData && channelData.stage) || 7;

    console.log(`[MOCK] Analyzing draft: ${a.wordCount} words, sensory=${(a.sensoryScore*100).toFixed(0)}%, spanish=${a.hasSpanish}, dialogue=${a.hasDialogue}, bridge=${a.hasBridge}, abstract=${a.hasAbstract}`);

    let parts = [];

    if (a.isFirstSensory) {
        parts.push(
            `Bienvenid@ a la revisión. Leí tu borrador y la primera oración me detuvo:\n\n` +
            `"${a.opening}..."\n\n` +
            `Eso no es una apertura común. Es un cuerpo en una habitación, sintiendo algo concreto. ` +
            `El sudor, el calor, la cara — el lector no está leyendo *sobre* tu experiencia, ` +
            `está adentro. Esa es la diferencia entre un ensayo que informa y uno que hace sentir.`
        );
    } else if (a.hasDialogue) {
        parts.push(
            `Bienvenid@ a la revisión. Leí tu borrador y el diálogo me detuvo.\n\n` +
            `Cuando pones palabras entre comillas, el lector escucha una voz real. ` +
            `Eso es más poderoso que cualquier resumen que pudieras dar.`
        );
    } else {
        parts.push(
            `Bienvenid@ a la revisión. Leí tu borrador con atención.\n\n` +
            `Noto que estás construyendo algo que conecta lo personal con algo más grande. ` +
            `Eso es exactamente lo que pide este ensayo.`
        );
    }

    const middleNotes = [];

    if (a.hasSpanish) {
        const phrase = a.spanishPhrase ? a.spanishPhrase[0] : a.spanishWords[0];
        middleNotes.push(
            `Me encanta que dejaste "${phrase}" en español. Eso no es un error — es evidencia. ` +
            `Es la prueba de que esto te pasó a ti, no a un personaje genérico. ` +
            `Protege esa frase en cada revisión.`
        );
    }

    if (a.hasDialogue && a.dialogueQuote.length > 5) {
        middleNotes.push(
            `El diálogo directo — "${a.dialogueQuote.slice(0, 60)}${a.dialogueQuote.length > 60 ? '...' : ''}" — ` +
            `hace algo que la narración sola no puede: pone al lector en la conversación. ` +
            `No lo reemplaces con "me dijo que no entendía." La cita directa es oro.`
        );
    }

    if (a.hasBridge) {
        middleNotes.push(
            `Noto que estás haciendo el puente. Cuando escribes sobre "${a.bridgeHits[0]}...", ` +
            `estás moviéndote de tu experiencia particular hacia algo que le pasa a muchos. ` +
            `Eso es exactamente la estructura del ensayo mixto. Pero cuídate: ` +
            `el puente solo funciona si el lector ya siente tu escena particular. ` +
            `Asegúrate de que la transición no sea demasiado rápida.`
        );
    }

    const abstractSentence = a.sentences.find(s => {
        const lw = s.toLowerCase();
        return ABSTRACT_NOUNS.some(n => lw.includes(n)) && !SENSORY_WORDS.has(lw.split(/\s+/)[0]?.replace(/[^a-z]/gi,''));
    });

    if (abstractSentence && a.sensoryScore < 0.03) {
        middleNotes.push(
            `Hay una oración que trabaja en lo abstracto: "${abstractSentence.slice(0, 80)}..." ` +
            `Esa idea es valiosa, pero el lector necesita verla antes de que la nombres. ` +
            `¿Puedes poner una escena — un momento, una cara, un lugar — que *muestre* ` +
            `lo que esta oración *dice*?`
        );
    }

    if (middleNotes.length > 0) {
        parts.push(middleNotes.join('\n\n'));
    }

    if (!a.hasBridge && a.sensoryScore > 0.03) {
        parts.push(
            `Tu borrador tiene voz y presencia física. El siguiente paso es el puente: ` +
            `¿dónde conectas esto que te pasó a ti con algo que le pasa a más gente? ` +
            `No tienes que resolverlo ahora. Solo señala dónde crees que va.`
        );
    } else if (a.hasBridge && a.sensoryScore < 0.02) {
        parts.push(
            `Tu borrador ya tiene el puente analítico. Ahora necesita más cuerpo: ` +
            `¿puedes poner una escena concreta — un lugar, un objeto, un gesto — ` +
            `que el lector pueda ver antes de que le expliques lo que significa?`
        );
    } else {
        parts.push(
            `El borrador tiene buen material. La pregunta ahora es: ¿qué quieres fortalecer primero? ` +
            `¿La voz (esa presencia física que ya tienes) o el puente (la conexión con el contexto más grande)?`
        );
    }

    return parts.join('\n\n') + `\n\n*[MOCK SERVER — Stage ${stage}: análisis del borrador guardado]*`;
}

function buildBotReply(userText, channelData, feedbackRound = 1, prevText = '') {
    const stage    = (channelData && channelData.stage)    || 1;
    const draft    = (channelData && channelData.wordCount) || 0;
    const saved    = (channelData && channelData.draftSaved);
    const mani     = (channelData && channelData.maniSentence) || '';
    const stageName= (channelData && channelData.stageName) || `Stage ${stage}`;

    console.log(`\n[MOCK] Stage ${stage} (${stageName}) | words: ${draft} | draftSaved: ${saved} | round: ${feedbackRound}`);
    console.log(`[MOCK] Student says: "${userText.slice(0, 80)}${userText.length > 80 ? '…' : ''}"`);
    if (mani) console.log(`[MOCK] Tu Conocimiento: "${mani.slice(0, 60)}…"`);

    // ── Adversarial guardrails ─────────────────
    const adversarial = detectAdversarial(userText);
    if (adversarial === 'write_essay') {
        return (
            `No puedo escribir tu ensayo — y no porque no quiera ayudarte. ` +
            `Si yo escribiera las oraciones, el ensayo dejaría de ser tuyo. ` +
            `Y el lector que más te importa — tu instructor, tu comunidad, tu yo futuro — ` +
            `se daría cuenta de que la voz no es la tuya.\n\n` +
            `Pero *puedo* ayudarte de otras formas:\n` +
            `• Si estás atascado/a, dime qué sección te cuesta más y te hago una pregunta que la desbloquee.\n` +
            `• Si no sabes cómo empezar, comparte una escena — cualquiera — y te ayudo a encontrar su centro.\n` +
            `• Si el ensayo se siente abrumador, dividámoslo en una sola oración hoy.\n\n` +
            `¿Cuál de estas te sirve más ahora?\n\n` +
            `*[MOCK SERVER — Guardia de autoría activa]*`
        );
    }
    if (adversarial === 'translate') {
        return (
            `No traduzco ensayos completos — y hay una razón pedagógica detrás. ` +
            `Cuando un texto se traduce de golpe, pierde las decisiones que *tú* tomaste: ` +
            `qué palabra elegiste, qué frase dejaste en español, qué ritmo querías.\n\n` +
            `Pero sí puedo ayudarte con una oración específica. Escoge la que más te cueste ` +
            `y compártela. Te pregunto: ¿qué querías decir exactamente? ` +
            `A veces la "traducción" que necesitas no es de idioma, sino de intención a palabra.\n\n` +
            `*[MOCK SERVER — Voz protegida]*`
        );
    }
    if (adversarial === 'outline_handover') {
        return (
            `No te doy un esquema completo — porque el esquema es donde tú decides ` +
            `qué es lo más importante de *tu* historia. Si yo te doy I, II, III, ` +
            `estoy imponiendo una estructura que puede no ser la que tu material necesita.\n\n` +
            `En cambio, dime: ¿cuál es el momento de *giro* en tu ensayo? ` +
            `El punto donde tu historia personal choca con algo más grande — ` +
            `una política, una historia, una injusticia. Ese momento es normalmente el centro. ` +
            `Y tú ya lo tienes. Solo hay que nombrarlo.\n\n` +
            `*[MOCK SERVER — Estructura desde tu material]*`
        );
    }
    if (adversarial === 'voice_erase') {
        return (
            `"Sonar académico" es una trampa. Lo que suena académico a veces es solo ` +
            `abstracción sin cuerpo: "society tends to" en vez de "mi vecino me dijo."\n\n` +
            `Tu voz — con sus idiosincrasias, su ritmo, sus palabras en español — ` +
            `no es un problema que resolver. Es un recurso.\n\n` +
            `Dame una oración que suene "poco académica" a tus ojos. ` +
            `Te ayudo a fortalecerla sin borrar quién la escribió.\n\n` +
            `*[MOCK SERVER — Voz antes que convención]*`
        );
    }

    // ── Socratic follow-up detection ─────────────────
    const socratic = detectSocraticFollowup(userText, stage);
    if (socratic) return socratic;

    const responses = {
        // S1: Anecdote — warm, open-ended, encouraging
        1: [
            `Bienvenid@ a Tu Pana de Escritura. Estoy aquí para pensar contigo — no para escribir por ti.\n\n` +
            `Cuéntame: ¿hay un momento en tu vida — una tarde, una conversación, un lugar — ` +
            `que todavía llevas contigo? No tiene que ser "importante." A veces la memoria pequeña es la más honesta.\n\n` +
            `*[MOCK SERVER — Stage 1: Encontrar tu historia]*`,

            `Me alegra que estés aquí. Antes de buscar el tema "perfecto," cuéntame — ` +
            `¿qué es lo que más te cuesta olvidar? ¿Una persona, un lugar, una injusticia?\n\n` +
            `*[MOCK SERVER — Stage 1]*`
        ],

        // S2: Structure Preview — explain the essay architecture
        2: [
            `Tu ensayo mixto tiene cinco movimientos. No tienes que seguirlos al pie de la letra, pero entenderlos te da un mapa:\n\n` +
            `1. **Apertura personal** — una escena concreta que ponga al lector adentro.\n` +
            `2. **Puente temático** — la pregunta o tensión que conecta tu historia con algo más grande.\n` +
            `3. **Contexto histórico/académico** — la investigación que ilumina por qué tu experiencia importa.\n` +
            `4. **Análisis** — tú explicando la conexión entre lo personal y lo histórico.\n` +
            `5. **Conclusión reflexiva** — no un resumen, sino una pregunta o insight que dejas al lector.\n\n` +
            `¿Dónde crees que tu anécdota encaja en esta estructura?\n\n` +
            `*[MOCK SERVER — Stage 2: Estructura del ensayo]*`,

            `Piensa en el ensayo como una conversación entre dos voces: la tuya (la que vivió la experiencia) y la de la investigación (la que puede nombrar patrones históricos). Tu trabajo no es dejar que una voz domine. Es hacer que se hablen.\n\n` +
            `¿Cuál de estas dos voces te cuesta más?\n\n` +
            `*[MOCK SERVER — Stage 2]*`
        ],

        // S3: Anecdote as Anchor — feedback on the actual text
        3: [
            `Leí tu anécdota. Aquí está lo que noto:\n\n` +
            `La voz está ahí. Hay un momento concreto, un cuerpo en una habitación. ` +
            `Eso es lo que hace que este ensayo sea tuyo y de nadie más.\n\n` +
            `Ahora, una pregunta: ¿qué tensión hay en esta escena que tú todavía no has nombrado? ` +
            `No la respuesta — solo la pregunta. Esa pregunta es tu brújula para la investigación.\n\n` +
            `*[MOCK SERVER — Stage 3: Anécdota como ancla]*`,

            `Tu anécdota tiene material. Lo que necesita ahora es dirección.\n\n` +
            `Dime: ¿qué es lo que esta escena te hace pensar sobre el mundo más grande? ` +
            `No tienes que saberlo todavía. Solo lanza una pregunta.\n\n` +
            `*[MOCK SERVER — Stage 3]*`
        ],

        // S4: Research — suggest directions, warn about fact-checking
        4: [
            `Ahora toca buscar el contexto. Pero no busques "sobre" tu tema — busca la tensión.\n\n` +
            `Si tu historia es sobre la vivienda, no busques "housing policy NYC." ` +
            `Busca "who benefits from gentrification in the Bronx" — la pregunta, no el resumen.\n\n` +
            `¿Qué tensión quieres explorar?\n\n` +
            `*[MOCK SERVER — Stage 4: Investigar el contexto]*`,

            `Research tip: start with the question your community already knows the answer to, ` +
            `then look for the scholarship that confirms or challenges it.\n\n` +
            `What's one thing *you* know from experience that an academic article can't tell you?\n\n` +
            `*[MOCK SERVER — Stage 4]*`
        ],

        // S5: Outline — dialogic, no handover
        5: [
            `Tienes investigación — ahora necesitas estructura. Pero no te doy un esquema; ` +
            `tú lo construyes.\n\n` +
            `Dime: ¿qué va *primero* — tu escena personal o el contexto histórico? ¿Por qué?\n\n` +
            `Esa decisión es tuya. Es tu ensayo.\n\n` +
            `*[MOCK SERVER — Stage 5: Construir el esquema]*`,

            `Before I help you structure this: what's the *turn* in your essay? ` +
            `The moment where your personal story and the larger history collide?\n\n` +
            `Find that moment. That's usually the center of your structure.\n\n` +
            `*[MOCK SERVER — Stage 5]*`
        ],

        // S6: First Draft — authorship gate (AI goes silent)
        6: [
            `Este es tu momento de escritura sin asistencia.\n\n` +
            `Soy tu pana, y como buen pana: me voy a callar mientras escribes.\n\n` +
            `Abre la pantalla de borrador y escribe. Aunque sea una frase. Aunque sea terrible. ` +
            `Ese primer borrador es *tuyo* — sin mi voz.\n\n` +
            `Cuando lo guardes, continuamos juntos.\n\n` +
            `*[MOCK SERVER — Stage 6: Authorship Gate — borrador sin asistencia]*`
        ],

        // S7: Revision (text-aware analysis)
        7: [stageRevisionReply(userText, channelData, feedbackRound, stage)],

        // S8: Polish & Protect Voice
        8: [
            `Llegamos a la etapa de pulir — pero con una regla: primero, protegemos tu voz.\n\n` +
            `Antes de corregir cualquier cosa, cuéntame: ¿hay alguna frase en tu ensayo ` +
            `que suene *exactamente* como tú hablas? Una que quieras defender.\n\n` +
            `Esa la dejamos. Trabajamos alrededor de ella.\n\n` +
            `*[MOCK SERVER — Stage 8: Pulir y proteger tu voz]*`
        ],

        // S9: Checklist & Process Note
        9: [
            `Ya casi. Antes de entregar, hazte estas preguntas:\n\n` +
            `- ¿Tu escena personal y tu análisis histórico *se hablan* en el ensayo?\n` +
            `- ¿Tu primera oración hace que el lector quiera seguir?\n` +
            `- ¿Hay al menos un detalle concreto — un nombre, una fecha, un lugar — en cada sección?\n` +
            `- ¿Cada afirmación histórica está verificada con una fuente independiente?\n\n` +
            `¿Cuál de estas te genera más duda?\n\n` +
            `*[MOCK SERVER — Stage 9: Checklist final]*`,

            `La nota de proceso es tuya — yo no la escribo. Pero te hago las preguntas.\n\n` +
            `Cuéntame: ¿qué fue lo más difícil de escribir este ensayo — no el texto, ` +
            `sino el *pensar*? ¿Hubo algo que no querías escribir pero escribiste de todas formas?\n\n` +
            `*[MOCK SERVER — Stage 9: Nota de proceso]*`
        ]
    };

    const pool = responses[stage] || [
        `Cuéntame más. ¿Qué estás pensando en esta etapa?\n\n` +
        `*[MOCK SERVER — Stage ${stage}]*`
    ];

    const idx = userText.length % pool.length;
    return Array.isArray(pool[idx]) ? pool[idx] : pool[idx];
}

function stageRevisionReply(userText, channelData, feedbackRound, stage) {
    const saved = channelData && channelData.draftSaved;

    if (!saved) {
        return `I see you haven't locked your first draft yet — ` +
               `click "Guardar Borrador" in the draft panel first.\n\n` +
               `*[MOCK SERVER — Stage ${stage} — draft not saved]*`;
    }

    const isDraftSubmission = userText.includes('[DRAFT SAVED — UNASSISTED FIRST DRAFT]');

    if (isDraftSubmission) {
        return (
            `Gracias por compartir tu borrador. Ya leí lo que escribiste y dejé mis observaciones arriba. ` +
            `Cuando estés listo/a, dime cuál de las dos áreas (voz o especificidad) quieres trabajar primero, ` +
            `o pégamelo directamente aquí y seguimos.\n\n` +
            `*[MOCK SERVER — Stage ${stage}: confirmación de borrador recibido]*`
        );
    }

    if (feedbackRound === 1 && userText.length < 80) {
        return `Pégame el primer párrafo en el chat ` +
               `y te digo lo que noto — qué funciona y qué podría crecer.\n\n` +
               `*[MOCK SERVER — Stage ${stage}: esperando párrafo]*`;
    }

    if (feedbackRound === 1 && userText.length >= 80) {
        const a = analyzeDraft(userText);
        let response = `Aquí está lo que noto en lo que compartiste:\n\n`;

        if (a.sensoryScore > 0.03) {
            response += `La voz está ahí. Hay presencia física — el lector siente algo. ` +
                        `Protege eso en cada revisión.\n\n`;
        } else if (a.hasDialogue) {
            response += `El diálogo directo es una de las herramientas más fuertes que tienes. ` +
                        `No lo reemplaces con resumen.\n\n`;
        } else {
            response += `Noto que estás trabajando en la conexión entre lo personal y lo más grande. ` +
                        `Ese es el trabajo del ensayo.\n\n`;
        }

        if (a.hasSpanish) {
            response += `Y me detuve en la frase en español. Eso no es un error — es prueba de que esto te pasó a ti.\n\n`;
        }

        const abstractSentence = a.sentences.find(s => {
            const lw = s.toLowerCase();
            return ABSTRACT_NOUNS.some(n => lw.includes(n)) && !SENSORY_WORDS.has(lw.split(/\s+/)[0]?.replace(/[^a-z]/gi,''));
        });

        if (abstractSentence) {
            response += `Una pregunta concreta: en "${abstractSentence.slice(0, 70)}...", ` +
                        `¿hay una escena que puedas poner antes de que el lector llegue a esta idea? ` +
                        `El ensayo mixto gana cuando el lector *siente* primero y *entiende* después.\n\n`;
        }

        response += `¿Cuál de estas observaciones resuena más — o cuál no te convence?\n\n` +
                    `*[MOCK SERVER — Stage ${stage}: análisis de párrafo compartido]*`;
        return response;
    }

    const dialogicReplies = [
        `Eso tiene mucho sentido. Si la voz ya está ahí, el siguiente trabajo es el puente: ` +
        `¿en qué oración conectas explícitamente tu experiencia con la fuerza más grande ` +
        `(una política, una historia, una injusticia estructural)? ` +
        `Escríbela aunque suene torpe — la pulimos después.\n\n` +
        `*[MOCK SERVER — Stage ${stage}: respuesta dialógica ronda ${feedbackRound}]*`,

        `Entiendo. Entonces protejamos esa voz y trabajemos en la especificidad. ` +
        `Elige una oración del párrafo que todavía se sienta genérica. ` +
        `¿Qué nombre, lugar, o fecha real podrías poner ahí?\n\n` +
        `*[MOCK SERVER — Stage ${stage}: respuesta dialógica ronda ${feedbackRound}]*`,

        `Eso que describes — esa tensión entre lo que viviste y cómo nombrarlo — es exactamente ` +
        `el material del ensayo. No tienes que resolverla antes de escribir. ` +
        `¿Qué pasaría si escribieras esa tensión directamente en el párrafo?\n\n` +
        `*[MOCK SERVER — Stage ${stage}: respuesta dialógica ronda ${feedbackRound}]*`,

        `Good — you're defending your voice, and that's the right instinct. ` +
        `The question isn't whether to change it, but whether *you* think it's doing its job. ` +
        `Read that sentence aloud. Does it sound like you? If yes, keep it. ` +
        `If it sounds like someone else's version of you, rewrite it in your own words.\n\n` +
        `*[MOCK SERVER — Stage ${stage}: respuesta dialógica ronda ${feedbackRound}]*`,
    ];

    if (/\b(ganas|abuela|mamá|papá| Spanglish|code.switch|spanish.*english|english.*spanish)\b/i.test(userText)) {
        return (
            `Me encanta que trajiste "${userText.match(/[A-Za-zÁáÉéÍíÓóÚúÑñü]+/g)?.find(w => /[áéíóúñ]/i.test(w)) || 'esa frase'}" aquí. ` +
            `Eso no es una "interferencia lingüística" — es un recurso retórico que monolingües no tienen.\n\n` +
            dialogicReplies[(feedbackRound - 2) % dialogicReplies.length]
        );
    }

    if (/worried|anxious|nervous|no soy buen|not good|don't think|no creo|scared|afraid|miedo|judge/i.test(userText)) {
        return (
            `Primero: tu inglés (o español, o mezcla de los dos) ya es suficiente para esto. ` +
            `No estás siendo evaluado como escritor nativo. Estás siendo evaluado como pensador ` +
            `que tiene algo que decir. Y eso ya lo tienes.\n\n` +
            `Segundo: la perfección no es el objetivo. El objetivo es honestidad. ` +
            `Una oración honesta en "inglés imperfecto" vale más que un párrafo pulido sin alma.\n\n` +
            `¿Qué oración te da más miedo compartir? Esa es probablemente la que más vale la pena.\n\n` +
            `*[MOCK SERVER — Stage ${stage}: respuesta para escritor/a con ansiedad]*`
        );
    }

    if (/only have|sólo tengo|30 minutes|limited time|no time|poco tiempo|rushed|prisa/i.test(userText)) {
        return (
            `Entendido. Solo una cosa hoy.\n\n` +
            `Lee tu borrador en voz alta — sí, en voz alta — y marca con un punto ` +
            `la primera oración que te haga sentir algo. No la que "debería" ser buena. ` +
            `La que realmente te mueve.\n\n` +
            `Esa oración es tu brújula. Todo lo demás en el ensayo debe acercarse a ella. ` +
            `Cuando tengas más tiempo, revisamos lo demás.\n\n` +
            `*[MOCK SERVER — Stage ${stage}: respuesta para estudiante con poco tiempo]*`
        );
    }

    return dialogicReplies[(feedbackRound - 2) % dialogicReplies.length];
}

function detectAdversarial(text) {
    const lower = text.toLowerCase();
    if (/write (my|the|your|our) (entire |whole |full )?essay/.test(lower)) return 'write_essay';
    if (/write (this|that|it) for me/.test(lower)) return 'write_essay';
    if (/translate (my|the|your|our) (entire |whole |full )?essay/.test(lower)) return 'translate';
    if (/translate (this|that|it) into (perfect |fluent )?english/.test(lower)) return 'translate';
    if (/make it sound academic/.test(lower) && /for me/.test(lower)) return 'voice_erase';
    if (/give me (a |the )?(complete |full )?outline/.test(lower)) return 'outline_handover';
    return null;
}

// ═══════════════════════════════════════════════════════════════
//  SOCRATIC FOLLOW-UP RESPONSES
//  When students click stage-relevant follow-up questions,
//  respond with gentle guiding questions — never direct answers.
// ═══════════════════════════════════════════════════════════════

function detectSocraticFollowup(text, stage) {
    const lower = text.toLowerCase();

    // S1: Anecdote — deepening the scene
    if (stage === 1) {
        if (/detalle concreto|concrete detail/.test(lower)) {
            return (
                `Buena pregunta. Pero yo no puedo ver tu escena — tú sí.\n\n` +
                `Cierra los ojos. ¿Qué objeto hay en la habitación que todavía recuerdas con los cinco sentidos? ` +
                `No el "significado" del objeto. Solo el objeto: su color, su peso, su olor. ` +
                `Escribe eso. El significado viene solo después.\n\n` +
                `*[MOCK SERVER — Método socrático: guiar hacia el detalle]*`
            );
        }
        if (/palabra en español|spanish word|traducción exacta|exact translation/.test(lower)) {
            return (
                `Esa palabra que estás buscando — ¿por qué crees que no existe en inglés? ` +
                `A veces las lenguas no traducen algo porque ese algo solo existe en la experiencia ` +
                `de la gente que la vive.\n\n` +
                `Dame la palabra. No para traducirla. Para entender qué huele, qué sabe, qué duele.\n\n` +
                `*[MOCK SERVER — Método socrático: el hueco lingüístico como recurso]*`
            );
        }
        if (/sentido físico|physical sense|olor|sonido|tacto|smell|sound|touch/.test(lower)) {
            return (
                `Pregunta poderosa. Los sentidos no mienten.\n\n` +
                `Pero no te digo cuál falta. Te pregunto: en tu memoria, ¿hay un sonido ` +
                `que todavía escuchas cuando piensas en ese momento? O un olor que, ` +
                `si lo percibes de nuevo, te devuelve ahí instantáneamente?\n\n` +
                `Escribe ese sonido o ese olor. El lector lo sentirá contigo.\n\n` +
                `*[MOCK SERVER — Método socrático: la memoria sensorial]*`
            );
        }
    }

    // S2: Connection — personal → historical bridge
    if (stage === 2) {
        if (/pregunta.*no puedo responder|question.*cannot answer/.test(lower)) {
            return (
                `La pregunta que no puedes responder es oro.\n\n` +
                `No porque la respuesta sea difícil. Sino porque la pregunta misma ` +
                `es el puente que conecta tu experiencia con algo más grande.\n\n` +
                `Dime: ¿esa pregunta te la hiciste tú primero, o te la hizo alguien de tu comunidad? ` +
                `¿Quién más en tu familia se la haría?\n\n` +
                `*[MOCK SERVER — Método socrático: la pregunta como puente]*`
            );
        }
        if (/momento de giro|turning point|personal choca|collides/.test(lower)) {
            return (
                `El giro no siempre es un evento grande. A veces es una frase que alguien dijo.\n\n` +
                `Piensa en tu historia: ¿hay un momento donde tú entendiste algo ` +
                `que antes no entendías? No el momento donde pasó algo. ` +
                `El momento donde *comprendiste* lo que pasaba.\n\n` +
                `Esa comprensión es el giro. Escribe ese momento.\n\n` +
                `*[MOCK SERVER — Método socrático: el giro como comprensión]*`
            );
        }
        if (/fuente.*confirmaría|source.*confirm|source.*challenge/.test(lower)) {
            return (
                `Excelente pregunta. Tu comunidad ya tiene conocimiento. ` +
                `La investigación académica debería confirmarlo o profundizarlo, no reemplazarlo.\n\n` +
                `Pero dime: ¿qué sabes tú por experiencia que ningún artículo académico puede decirte? ` +
                `Eso es tu fuente primaria. Empieza por ahí.\n\n` +
                `*[MOCK SERVER — Método socrático: el conocimiento comunitario como fuente]*`
            );
        }
    }

    // S3: Topic Pitch — sharpening the focus
    if (stage === 3) {
        if (/pregunta real|real question|tema/.test(lower)) {
            return (
                `Un tema dice "hablaré sobre X." Una pregunta dice "no sé la respuesta, y quiero encontrarla."\n\n` +
                `Lee tu pitch. Si lo reescribes como una pregunta honesta — una que realmente ` +
                `no sabes la respuesta — ¿cómo sonaría?\n\n` +
                `Una pregunta real tiene tensión. Sin tensión, no hay ensayo.\n\n` +
                `*[MOCK SERVER — Método socrático: tema vs. pregunta]*`
            );
        }
        if (/oposición|tensión|opposition|tension/.test(lower)) {
            return (
                `La tensión no es un problema. Es el motor del ensayo.\n\n` +
                `En tu idea: ¿hay algo que tú crees que alguien más podría cuestionar? ` +
                `No un enemigo genérico. Una persona real que conoces. ` +
                `¿Qué te diría esa persona?\n\n` +
                `Esa voz de oposición es necesaria. El ensayo gana cuando la escuchas.\n\n` +
                `*[MOCK SERVER — Método socrático: la oposición como motor]*`
            );
        }
        if (/alguien.*comunidad|someone outside|le importaría|care about/.test(lower)) {
            return (
                `Pregunta difícil y necesaria.\n\n` +
                `No te pregunto por qué le importaría a "alguien." Te pregunto: ` +
                `¿a quién específico en tu vida le importaría esto? ` +
                `Una persona con nombre. Si esa persona leyera tu ensayo, ` +
                `¿qué línea haría que dijera "sí, esto me pasó a mí también"?\n\n` +
                `*[MOCK SERVER — Método socrático: la audiencia específica]*`
            );
        }
    }

    // S4: Research — finding and connecting sources
    if (stage === 4) {
        if (/fuente.*contradice|source.*contradict|source.*challenge/.test(lower)) {
            return (
                `La contradicción no es un problema. Es una oportunidad.\n\n` +
                `Cuando una fuente académica contradice lo que tu comunidad sabe, ` +
                `no significa que tu comunidad esté equivocada. Significa que hay una tensión ` +
                `que tu ensayo puede explorar.\n\n` +
                `¿Qué parte de tu experiencia personal desafiaría la versión "oficial" de esta historia?\n\n` +
                `*[MOCK SERVER — Método socrático: la contradicción como tensión productiva]*`
            );
        }
        if (/pregunta.*miedo|afraid to ask|scared/.test(lower)) {
            return (
                `El miedo es una brújula.\n\n` +
                `No te digo que no tengas miedo. Te pregunto: ¿de qué tienes miedo *exactamente*? ` +
                `¿De que la investigación confirme algo que ya sabes? ` +
                `¿De que descubras algo que cambie cómo ves tu propia historia? ` +
                `¿De que no encuentres nada?\n\n` +
                `Cada uno de esos miedos es material para tu ensayo. Nómbralo.\n\n` +
                `*[MOCK SERVER — Método socrático: el miedo como brújula]*`
            );
        }
        if (/conectar.*investigación|connect.*research|escena específica|specific scene/.test(lower)) {
            return (
                `La investigación no es decoración. Debe iluminar una escena que ya escribiste.\n\n` +
                `Lee tu borrador. ¿Hay una oración donde dices "era como si..." o ` +
                `"todo el mundo sabía que..."? Esas son señales de que necesitas ` +
                `la investigación para mostrar el patrón detrás de tu experiencia.\n\n` +
                `¿Qué oración en tu borrador necesita un número, una fecha, un nombre?\n\n` +
                `*[MOCK SERVER — Método socrático: investigación como iluminación]*`
            );
        }
    }

    // S5: Outline — structural decisions
    if (stage === 5) {
        if (/momento de giro|turning point|lista/.test(lower)) {
            return (
                `Un esquema es un mapa, no una lista de compras.\n\n` +
                `¿Hay un punto en tu esquema donde el lector dice "ah, ahora entiendo ` +
                `por qué esto le pasó a esta persona"? No el punto donde das información nueva. ` +
                `El punto donde el lector *siente* algo diferente.\n\n` +
                `Si no hay ese punto, tu esquema necesita un giro.\n\n` +
                `*[MOCK SERVER — Método socrático: el giro estructural]*`
            );
        }
        if (/miedo escribir|afraid to write|sección.*miedo/.test(lower)) {
            return (
                `La sección que más miedo te da es probablemente la que más necesitas escribir.\n\n` +
                `No te digo que no tengas miedo. Te pregunto: ¿qué pasaría si escribieras ` +
                `esa sección mal? No perfecta. Solo mal. Una versión torpe, honesta, tuya.\n\n` +
                `A veces el miedo no es de escribir mal. Es de escribir algo que sea verdadero.\n\n` +
                `*[MOCK SERVER — Método socrático: el miedo como señal de verdadera material]*`
            );
        }
        if (/voz.*fuerte|strongest voice|voz más fuerte/.test(lower)) {
            return (
                `Tu voz más fuerte no es donde hablas más alto. Es donde hablas más tú.\n\n` +
                `Lee tu esquema. ¿Qué sección solo tú podrías escribir? ` +
                `No porque nadie más conozca los hechos. Sino porque nadie más ` +
                `los vivió desde tu cuerpo, tu idioma, tu historia.\n\n` +
                `Esa sección es tu ancla. Todo lo demás debe acercarse a ella.\n\n` +
                `*[MOCK SERVER — Método socrático: la voz como ancla]*`
            );
        }
    }

    // S6: First Draft — writing through blocks
    if (stage === 6) {
        if (/oración.*suena.*como yo|sentence.*sounds like me|suena más como/.test(lower)) {
            return (
                `No te digo cuál oración suena como tú. Te pregunto: ¿hay una frase ` +
                `que, si la leyeras en voz alta frente a tu familia, sonaría como tú hablando? ` +
                `No como tú "escribiendo." Como tú *hablando*.\n\n` +
                `Esa oración es tu brújula. Cuando revises, pregunta: ¿esta nueva versión ` +
                `suena más cerca o más lejos de esa oración?\n\n` +
                `*[MOCK SERVER — Método socrático: la voz hablada como brújula]*`
            );
        }
        if (/me detuve|stopped|miedo escribir|scared to write/.test(lower)) {
            return (
                `Todos nos detenemos. La diferencia entre un escritor y alguien que no escribe ` +
                `no es que el escritor no tenga miedo. Es que escribe con el miedo.\n\n` +
                `Te pregunto: ¿qué pasaría si escribieras exactamente lo que te da miedo, ` +
                `sin explicarlo, sin justificarlo, sin suavizarlo? Solo la escena. ` +
                `El miedo del lector viene después.\n\n` +
                `*[MOCK SERVER — Método socrático: escribir con el miedo]*`
            );
        }
        if (/conexión.*contexto|connection.*larger context|todavía no está clara|still unclear/.test(lower)) {
            return (
                `La conexión no tiene que estar clara todavía. Eso es el trabajo del borrador.\n\n` +
                `Pero dime: ¿hay una pregunta que hiciste en el borrador que no respondiste? ` +
                `Una "¿por qué...?" o una "¿qué pasaría si...?" que dejaste ahí, ` +
                `sin resolver?\n\n` +
                `Esa pregunta sin resolver es la semilla de tu ensayo. No la resuelvas todavía. ` +
                `Solo no la borres.\n\n` +
                `*[MOCK SERVER — Método socrático: la pregunta sin resolver]*`
            );
        }
    }

    // S7: Revision — paragraph-level feedback
    if (stage === 7) {
        if (/detalle.*expandir|expand.*detail|detalle concreto/.test(lower)) {
            return (
                `No te digo qué detalle expandir. Te pregunto: en tu párrafo, ` +
                `¿hay un nombre propio que el lector todavía no conoce? ` +
                `Una fecha que mencionas pero no explicas? Un objeto que aparece ` +
                `y desaparece sin que el lector lo vea?\n\n` +
                `El detalle que necesita expandirse es el que el lector quiere tocar ` +
                `pero tú no le dejas. Expándelo.\n\n` +
                `*[MOCK SERVER — Método socrático: el detalle que el lector quiere tocar]*`
            );
        }
        if (/oración.*suena como alguien más|someone else|robot|suena como tú/.test(lower)) {
            return (
                `Lee el párrafo en voz alta. Cuando llegues a una oración que te haga ` +
                `sentir incómodo/a — no porque sea mala, sino porque no suena como tú — ` +
                `detente.\n\n` +
                `Pregúntate: ¿esta oración la escribí yo, o la escribí pensando en ` +
                `lo que "debería" sonar en un ensayo académico?\n\n` +
                `Si es lo segundo, reescríbela como si se la contaras a tu hermano/a.\n\n` +
                `*[MOCK SERVER — Método socrático: el hermano/a como editor]*`
            );
        }
        if (/puente.*experiencia|bridge.*experience|contexto histórico|historical context/.test(lower)) {
            return (
                `El puente no siempre es una oración que dice "esto se conecta con..." ` +
                `A veces el puente es una pregunta que dejas al lector.\n\n` +
                `Lee tu párrafo. ¿Hay una pregunta que emerge naturalmente de tu experiencia? ` +
                `No una pregunta que tú respondes. Una pregunta que dejas plantada, ` +
                `para que el siguiente párrafo la cultive.\n\n` +
                `Esa pregunta es el puente.\n\n` +
                `*[MOCK SERVER — Método socrático: la pregunta como puente]*`
            );
        }
    }

    // S8: Voice Polish — protecting what matters
    if (stage === 8) {
        if (/frase en español|spanish phrase|no debería perder|should not lose/.test(lower)) {
            return (
                `La frase en español no es un error lingüístico. Es evidencia de que ` +
                `esta historia te pasó a ti, no a un personaje genérico.\n\n` +
                `Pero no te digo cuál proteger. Te pregunto: ¿hay una frase que, ` +
                `si la traducieras al inglés, perdería su peso? No su significado. ` +
                `Su *peso*. El peso de quién la dijo, cómo la dijo, por qué la dijo.\n\n` +
                `Esa frase no la traduzcas. Explícala.\n\n` +
                `*[MOCK SERVER — Método socrático: el peso de la frase]*`
            );
        }
        if (/oración.*académica|academic sentence|robot/.test(lower)) {
            return (
                `La oración "académica" es a veces una versión de ti que no existe.\n\n` +
                `Lee tu borrador. Cuando encuentres una oración que suena como si la ` +
                `hubiera escrito un comité, pregúntate: ¿qué quería decir antes de que ` +
                `la "mejorara"?\n\n` +
                `Escribe esa versión torpe. La torpeza es más honesta que la perfección.\n\n` +
                `*[MOCK SERVER — Método socrático: la torpeza como honestidad]*`
            );
        }
        if (/detalle personal|personal detail|protejo|protect/.test(lower)) {
            return (
                `El detalle que proteges no es el que te hace lucir mejor. ` +
                `Es el que te hace ser tú.\n\n` +
                `No te digo cuál proteger. Te pregunto: ¿hay un detalle en tu borrador ` +
                `que, si lo quitas, el ensayo sigue siendo coherente, pero deja de ser *tuyo*?\n\n` +
                `Ese detalle es sagrado. No lo toques.\n\n` +
                `*[MOCK SERVER — Método socrático: el detalle sagrado]*`
            );
        }
    }

    // S9: Checklist — final verification
    if (stage === 9) {
        if (/voz.*primera oración|first sentence|última|last sentence/.test(lower)) {
            return (
                `La primera oración y la última son los libros de tu ensayo.\n\n` +
                `Lee la primera. ¿Es una voz que el lector quiere seguir?\n\n` +
                `Lee la última. ¿Es la misma voz, pero más profunda? ` +
                `No más "académica." Más *sabia*.\n\n` +
                `Si la última oración suena como otra persona, reescríbela como si ` +
                `se la contaras a tu yo de hace un año.\n\n` +
                `*[MOCK SERVER — Método socrático: el arco de la voz]*`
            );
        }
        if (/hecho.*verifiqué|verify.*fact|fuente independiente|independent source/.test(lower)) {
            return (
                `Los hechos son la columna vertebral. Pero la voz es el corazón.\n\n` +
                `No te digo qué hecho verificar. Te pregunto: ¿hay una afirmación en tu ensayo ` +
                `que, si un lector escéptico la cuestionara, no podrías defender? ` +
                `No porque sea falsa. Sino porque no tienes la fuente a la mano.\n\n` +
                `Esa afirmación necesita un pie de página. O necesita desaparecer.\n\n` +
                `*[MOCK SERVER — Método socrático: el lector escéptico]*`
            );
        }
        if (/decisión.*revisión|revision decision|costó más|hardest decision/.test(lower)) {
            return (
                `La decisión más difícil no es la que cambió más palabras. ` +
                `Es la que cambió tu relación con tu propio texto.\n\n` +
                `Pero no te digo cuál fue. Te pregunto: ¿hay una decisión que todavía ` +
                `no estás seguro/a de haber tomado bien? Una que, si tu instructor/a ` +
                `te preguntara "¿por qué hiciste esto?", tu respuesta sería ` +
                `"todavía no sé, pero sentía que era lo correcto"?\n\n` +
                `Esa decisión insegura es tu evidencia de que usaste criterio propio. ` +
                `Eso es lo que el lector valora.\n\n` +
                `*[MOCK SERVER — Método socrático: la decisión insegura como evidencia]*`
            );
        }
    }

    // Generic Socratic fallback for any stage
    if (/how do|how to|cómo puedo|cómo hago|what should|qué debería|help me|ayúdame|don't understand|no entiendo/.test(lower)) {
        return (
            `Buena pregunta. Pero yo no tengo tu respuesta — tú sí. Solo necesitas que te ayude a verla.\n\n` +
            `Dime: ¿qué parte de tu borrador te hace sentir algo cuando la lees? ` +
            `No la que "debería" ser buena. La que realmente te mueve.\n\n` +
            `Esa es tu brújula. Empecemos por ahí.\n\n` +
            `*[MOCK SERVER — Método socrático: la brújula interna]*`
        );
    }

    return null;
}

// ─────────────────────────────────────────────
//  Serve index.html with injected config
// ─────────────────────────────────────────────
const HTML_PATH = path.join(__dirname, 'index.html');

app.get('/', (req, res) => {
    let html = fs.readFileSync(HTML_PATH, 'utf8');

    html = html.replace(
        `const DL = 'https://directline.botframework.com/v3/directline';`,
        `const DL = 'http://localhost:${PORT}/v3/directline';`
    );

    html = html.replace(
        `directLineSecret: '',       // ← your Copilot Studio Direct Line secret here`,
        `directLineSecret: 'tupana-test-mode',  // ← injected by mock server`,
    );

    html = html.replace(
        '<body>',
        `<body>
<div style="
  position:fixed; top:0; left:0; right:0; z-index:9999;
  background:#b45309; color:#fff; font:600 0.8rem/1 'Source Sans 3',sans-serif;
  padding:5px 12px; display:flex; align-items:center; justify-content:center; gap:16px;
  letter-spacing:0.04em;
">
  <span>MOCK SERVER — Respuestas simuladas · Stage-aware · Sin costo · localhost:${PORT}</span>
  <button onclick="if(confirm('Reset all app data and start from Stage 1?')){localStorage.clear();location.reload();}" style="
    background:#fff; color:#b45309; border:none; border-radius:4px;
    padding:3px 10px; font:700 0.75rem/1 'Source Sans 3',sans-serif;
    cursor:pointer; letter-spacing:0.03em; flex-shrink:0;
  ">⟳ Reset</button>
</div>
<div style="height:26px"></div>`
    );

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

app.use(express.static(__dirname));

// ─────────────────────────────────────────────
//  Direct Line API emulation
// ─────────────────────────────────────────────

app.post('/v3/directline/tokens/generate', (req, res) => {
    console.log('[DL] POST /tokens/generate');
    res.json({ token: 'mock-token-' + Date.now(), expires_in: 3600 });
});

app.post('/v3/directline/conversations', (req, res) => {
    const id = newConvId();
    conversations[id] = { activities: [], watermark: 0, feedbackCount: {}, lastUserText: '', lastMsgTime: 0, draftText: '', draftWelcomeSent: false };
    console.log(`[DL] POST /conversations → ${id}`);

    setTimeout(() => {
        const greeting =
            `¡Hola! Soy **Tu Pana de Escritura**\n\n` +
            `Estoy aquí para pensar contigo — no para escribir por ti. ` +
            `Tú eres el autor. Yo soy tu pensador de apoyo.\n\n` +
            `Cuéntame: ¿en qué etapa del ensayo estás, y qué te está costando más?\n\n` +
            `*[MOCK SERVER — respuesta simulada para prueba local]*`;

        pushBotActivity(id, greeting);
    }, 800);

    res.json({
        conversationId: id,
        token: 'mock-token-' + id,
        streamUrl: null
    });
});

app.post('/v3/directline/conversations/:id/activities', (req, res) => {
    const { id } = req.params;
    const activity = req.body;

    if (!conversations[id]) conversations[id] = { activities: [], watermark: 0, feedbackCount: {}, lastUserText: '', lastMsgTime: 0, draftText: '', draftWelcomeSent: false };

    const channelData = activity.channelData || {};
    const stage       = channelData.stage || 1;
    const conv        = conversations[id];

    // ── Handle app events (stageChange, draftSaved, etc.)
    if (activity.type === 'event') {
        const evtName = activity.name || 'unknown';
        const evtValue = activity.value || {};

        if (evtName === 'draftSaved' && evtValue.draftText) {
            conv.draftText = evtValue.draftText;
            conv.draftWelcomeSent = false;
            const welcome = buildDraftWelcome(evtValue.draftText, channelData);
            setTimeout(() => {
                pushBotActivity(id, welcome);
                conv.feedbackCount[stage] = (conv.feedbackCount[stage] || 0) + 1;
                conv.draftWelcomeSent = true;
                console.log(`[MOCK] Proactive welcome analysis pushed for Stage ${stage}`);
            }, 700);
            return res.json({ id: `${id}-evt-${Date.now()}` });
        }

        console.log(`[EVT] ${evtName} | stage: ${stage} (no bot reply generated)`);
        return res.json({ id: `${id}-evt-${Date.now()}` });
    }

    // ── Detect follow-up draft message after proactive welcome
    const isFollowUpDraft = (
        conv.draftWelcomeSent &&
        (activity.text || '').includes('[DRAFT SAVED — UNASSISTED FIRST DRAFT]')
    );
    if (isFollowUpDraft) {
        const ack = (
            `Gracias por compartir tu borrador. Ya leí lo que escribiste y dejé mis observaciones arriba. ` +
            `Cuando estés listo/a, dime cuál de las dos áreas (voz o especificidad) quieres trabajar primero, ` +
            `o pégamelo directamente aquí y seguimos.\n\n` +
            `*[MOCK SERVER — Stage ${stage}: confirmación de borrador recibido]*`
        );
        setTimeout(() => pushBotActivity(id, ack), 600);
        return res.json({ id: `${id}-${conv.watermark++}` });
    }

    // Store the user message
    const userText = activity.text || '';
    const userActivity = {
        id: `${id}-${conv.watermark++}`,
        type: 'message',
        from: { id: activity.from?.id || 'user', name: activity.from?.name || 'Student' },
        text: userText,
        timestamp: new Date().toISOString(),
        channelData: channelData
    };
    conv.activities.push(userActivity);

    // Deduplicate
    const now = Date.now();
    if (conv.lastUserText === userText && conv.lastMsgTime && (now - conv.lastMsgTime) < 3000) {
        console.log(`[MOCK] Duplicate message suppressed (dedup window)`);
        return res.json({ id: userActivity.id });
    }
    conv.lastMsgTime = now;

    conv.feedbackCount[stage] = (conv.feedbackCount[stage] || 0) + 1;
    const feedbackRound = conv.feedbackCount[stage];
    const prevText = conv.lastUserText;
    conv.lastUserText = userText;

    const delay = 600 + Math.floor(Math.random() * 800);
    setTimeout(() => {
        const replyText = buildBotReply(userText, channelData, feedbackRound, prevText);
        pushBotActivity(id, replyText);
    }, delay);

    res.json({ id: userActivity.id });
});

app.get('/v3/directline/conversations/:id/activities', (req, res) => {
    const { id } = req.params;
    const watermark = parseInt(req.query.watermark || '0', 10);

    if (!conversations[id]) {
        return res.json({ activities: [], watermark: '0' });
    }

    const newActivities = conversations[id].activities.slice(watermark);
    const nextWatermark = conversations[id].activities.length;

    res.json({
        activities: newActivities,
        watermark: String(nextWatermark)
    });
});

function pushBotActivity(convId, text) {
    if (!conversations[convId]) return;
    const activity = {
        id: `${convId}-bot-${conversations[convId].watermark++}`,
        type: 'message',
        from: { id: 'tupana-bot', name: 'Tu Pana de Escritura' },
        text,
        timestamp: new Date().toISOString()
    };
    conversations[convId].activities.push(activity);
    console.log(`[BOT] → "${text.slice(0, 80).replace(/\n/g, ' ')}…"`);
}

const server = app.listen(PORT, () => {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Tu Pana de Escritura — Mock Server');
    console.log(`  Open: http://localhost:${PORT}`);
    console.log('  Text-aware analysis active (sensory / dialogue / bridge / code-switch)');
    console.log('  Press Ctrl+C to stop');
    console.log('═══════════════════════════════════════════════════\n');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n⚠️  Port ${PORT} is already in use.`);
        console.error(`   Free it, then run npm start again.`);
        console.error(`   macOS/Linux:  lsof -ti :${PORT} | xargs kill -9`);
        console.error(`   Windows:      netstat -ano | findstr :${PORT}   (then taskkill /PID <pid> /F)\n`);
        process.exit(1);
    } else {
        throw err;
    }
});
