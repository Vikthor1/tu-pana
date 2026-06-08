# Tu Pana de Escritura — Survey Deployment Guide

**Version:** 1.0 (2026-06-08)  
**Covers:** Pre-survey + Post-survey for LAC 118 Summer 2026 pilot (or any future class)  
**Script:** `docs/pilot/survey-builder.gs`  
**Instrument spec:** `docs/pilot/survey-instrument.md`

---

## Part 1 — One-Time Setup: Running the Script

**Before you start:** You need a Google Account with access to Google Drive and Google Sheets. Your CUNY Google account works.

1. Go to **Google Drive** and create a new Google Sheet.
   - Name it something like `Tu Pana Pilot Data — LAC 118 Summer 2026`

2. In that sheet: **Extensions → Apps Script**

3. Delete all placeholder code in the editor. Paste the entire contents of `docs/pilot/survey-builder.gs` into the editor.

4. Click **File → Save** (or Cmd/Ctrl + S). Name the project `Tu Pana Survey Builder`.

5. Close the script editor and **reload the Google Sheet.**  
   A **"Tu Pana Surveys"** menu will appear in the menu bar.

6. Click **Tu Pana Surveys → Build Pre + Post Surveys**

7. When Google prompts for authorization, click **Review Permissions** and allow.  
   The script needs permission to create Google Forms and write to Sheets — it does nothing else.

8. Wait approximately 20–30 seconds. A dialog confirms completion.

**What you now have:**

| Item | Location |
|------|----------|
| Pre-Survey Form | Your Google Drive (new file) |
| Post-Survey Form | Your Google Drive (new file) |
| Distribution sheet | Same spreadsheet — codes + pre-filled URLs |
| Form Links sheet | Same spreadsheet — your edit links |
| Response sheets | Created automatically when students submit |

---

## Part 2 — Manual Verification Checklist

**Do this immediately after running the script. These settings cannot be controlled via Apps Script.**

### Step 1 — Test a pre-filled URL in incognito

- Open the Distribution sheet
- Copy the TPN-001 Pre-Survey URL
- Open it in an **incognito / private browser window** (not logged into Google)
- Confirm the Participant Code field shows `TPN-001` pre-filled
- Repeat with TPN-002 — confirm the code differs
- Submit a test response and confirm it appears in the response sheet
- **Delete test responses** before distributing to students

### Step 2 — Check "Who can respond" in each form

- Open each form's edit link (from the Form Links sheet)
- Click the **gear icon (Settings)** → **Responses** tab
- Confirm **"Collect email addresses"** is OFF
- Confirm **"Limit to 1 response"** is OFF
- Confirm **"Allow response editing"** is OFF

> ⚠️ **CUNY Workspace note:** If "Require Hostos sign-in" appears as a forced setting, contact your Brightspace/IT administrator. The survey must be accessible without login to preserve anonymity. Students should NOT need to sign into Google to complete the survey.

### Step 3 — Check "Who can access"

- In the form editor: click **Send** (top right)
- Confirm the form link does not require sign-in to access
- If you see a lock or "Sign-in required" indicator, see the CUNY Workspace note above

### Step 4 — Confirm response sheets exist

- In your spreadsheet, response sheets appear as new tabs (e.g., "Tu Pana de Escritura — Encuesta Inicial · Pre-Survey (Responses)")
- Both pre and post should have response sheet tabs after your test submission

---

## Part 3 — Brightspace Deployment Instructions

### Option A — Link (recommended, simplest)

1. In Brightspace, navigate to your course module where you want students to find the survey
2. **Add a Content Item → Create a Link**
3. Title: `Pre-Survey — Tu Pana (Week 1)`
4. URL: paste the **plain Published URL** from the Form Links sheet (not the pre-filled code URL — students need their individual links sent separately)
5. **Important:** The pre-filled code URLs must be sent to each student individually (see Part 4). The Published URL is only for reference.

> The recommended distribution method is **individual Brightspace announcements or messages** containing each student's unique pre-filled URL — not a shared link.

### Option B — HTML page embed (advanced)

You can embed the form via `<iframe>` in an HTML page uploaded to Brightspace. However, note that the pre-filled code will not work in an embedded iframe — students must open their unique link in a new tab. If you use this option, include a "Click here to open your survey" link that opens in a new tab.

---

## Part 4 — Faculty Note: Participant Code Distribution

### What you're distributing

Each student gets **two unique pre-filled URLs**:
- A **Pre-Survey URL** (send on Week 1, Day 1, before students open Tu Pana)
- A **Post-Survey URL** (send on Week 4, same day final writing assignment is submitted or within 24 hours)

These URLs are in the **Distribution sheet** of your pilot spreadsheet. Each row is one student.

### How to distribute

**Recommended method: Brightspace individual messages or announcements**

1. Open the Distribution sheet
2. For each student, copy their Pre-Survey URL from Column B
3. Send each student a **private Brightspace message** with their unique URL
   - Do NOT post all URLs in a public announcement — codes must stay 1-per-student
   - Do NOT share the Distribution sheet with students
4. In Column D ("Pre Submitted?"), mark YES when a student completes the pre-survey
5. Repeat the process with Column C (Post-Survey URLs) at Week 4

**Tracking note:** The Distribution sheet has a "Pre Submitted?" and "Post Submitted?" column for your manual tracking. This is not connected to the response sheets — you'll need to cross-reference manually or by checking the response sheet for that code.

### Maintaining the code-to-student mapping

- Keep a **separate private record** mapping each TPN-NNN code to the student's name
- This record should NOT appear in research data — it exists only for your own distribution purposes
- If you use Brightspace messages, your sent messages serve as the implicit record

### Privacy reminder

The survey data itself contains no names, emails, or student IDs. Only the participant code appears. The code-to-student mapping you maintain privately is not part of the research data.

---

## Part 5 — Student Announcements

### 5A — Pre-Survey Announcement (Week 1, Day 1)

**Post this before students open Tu Pana for the first time.**

> **Subject:** Before you start writing — quick survey (5 minutes) · Antes de empezar a escribir — encuesta breve (5 minutos)
>
> ---
>
> Hello! · ¡Hola!
>
> Before you open Tu Pana for the first time, I'm asking you to complete a brief survey. It takes about **5 minutes** and asks about your writing experience and your feelings about AI tools.
>
> Antes de abrir Tu Pana por primera vez, te pido que completes una breve encuesta. Toma unos **5 minutos** y pregunta sobre tu experiencia con la escritura y cómo te sientes con respecto a las herramientas de IA.
>
> **Important / Importante:**
>
> - Your answers are **voluntary** and will **not affect your grade**.
> - The survey does **not** ask for your name or student ID.
> - You received a unique link by message — the survey link includes a participant code that's already filled in for you. Please don't change it.
>
> - Tu participación es **voluntaria** y **no afectará tu calificación**.
> - La encuesta **no** pide tu nombre ni tu número de estudiante.
> - Recibiste un enlace único por mensaje — el enlace ya incluye un código de participante prellenado. Por favor, no lo cambies.
>
> **Your personalized survey link is in your Brightspace message / Tu enlace personalizado está en tu mensaje de Brightspace.**
>
> Thank you — your responses help me understand how Tu Pana is working for students like you. · Gracias — tus respuestas me ayudan a entender cómo está funcionando Tu Pana para estudiantes como tú.
>
> — [Your name / Professor Torres-Vélez]

---

### 5B — Post-Survey Announcement (Week 4, after final writing submission)

**Post this on the same day students submit their final writing assignment, or within 24 hours.**

> **Subject:** Final reflection survey — you're almost done! (8 minutes) · Encuesta de reflexión final — ¡ya casi terminas! (8 minutos)
>
> ---
>
> You did it! · ¡Lo lograste!
>
> You've completed your writing process with Tu Pana. Before we wrap up, I'm asking you to complete a final survey. It takes about **8 minutes** and asks about your experience using Tu Pana, how your writing process felt, and what you'd change.
>
> Completaste tu proceso de escritura con Tu Pana. Antes de terminar, te pido que completes una encuesta final. Toma unos **8 minutos** y pregunta sobre tu experiencia usando Tu Pana, cómo se sintió el proceso de escritura, y qué cambiarías.
>
> **Important / Importante:**
>
> - Your answers are **voluntary** and will **not affect your grade**.
> - The survey does **not** ask for your name.
> - Use the **same personalized link** you received in your Brightspace message at the start of the course. If you can't find it, message me and I'll resend it.
> - Your answers help me improve Tu Pana for future students — and document that it actually helped you write.
>
> - Tu participación es **voluntaria** y **no afectará tu calificación**.
> - La encuesta **no** pide tu nombre.
> - Usa el **mismo enlace personalizado** que recibiste en tu mensaje de Brightspace al inicio del curso. Si no lo encuentras, escríbeme y te lo reenvío.
> - Tus respuestas me ayudan a mejorar Tu Pana para futuros estudiantes — y documentan que realmente te ayudó a escribir.
>
> **Your personalized post-survey link is in your Brightspace message / Tu enlace de encuesta final personalizado está en tu mensaje de Brightspace.**
>
> Thank you for your time and your writing. · Gracias por tu tiempo y por tu escritura.
>
> — [Your name / Professor Torres-Vélez]

---

## Part 6 — Data Collection Schedule

| Week | Action |
|------|--------|
| Week 1, Day 1 | Post pre-survey announcement; send individual pre-survey URLs via Brightspace message |
| Week 1, Day 1 | Students open Tu Pana **after** completing pre-survey |
| Weeks 1–3 | Students work through Tu Pana's 10 stages |
| Week 4 | Final writing assignment submitted |
| Week 4 (same day or within 24h) | Post post-survey announcement; send individual post-survey URLs |
| After pilot | Download response sheets; match pre/post by participant code |

---

## Part 7 — Post-Pilot Analysis Reminders

- **Minimum for reporting:** 5 paired responses (pre + post with matching code)
- **C2 is reverse-scored:** "I worry that using AI will make my writing less my own." A *decrease* from pre to post may indicate reduced anxiety — but a high stable score may also reflect growing critical literacy. Document both patterns.
- **Statistical test:** With N = 5–10, use Wilcoxon signed-rank test (nonparametric). With N > 15, a paired t-test is appropriate.
- **Qualitative:** E3 ("do you feel the writing is truly your own?") is the most IRB-relevant qualitative item — record verbatim if possible.
- **Export:** Download both response sheets as CSV. Match by the Code column. Do not export the Distribution sheet (it maps codes to students and should not appear in research data).

---

## Part 8 — Reuse for Future Classes

The survey is class-agnostic. For a new class:
1. Create a new Google Sheet
2. Paste `survey-builder.gs` and run it fresh
3. New forms and new participant code URLs are generated
4. Adjust `NUM_PARTICIPANTS` at the top of the script if the class size differs
5. The survey questions are identical — pre/post deltas transfer across classes

---

*This guide is reproducible. The script + this file + `survey-instrument.md` are everything needed to run the survey for any future Tu Pana class.*
