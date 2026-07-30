# Tu Pana Gemini Cloudflare Worker

**Purpose:** Secure server-side proxy for Gemini API calls. Keeps the Gemini API key out of the GitHub Pages frontend.

**Status:** Active Cloudflare Worker proxy for Gemini. Configure `GEMINI_API_KEY` and point the frontend at the deployed Worker URL via `CONFIG.geminiProxyUrl`.

---

## Required secret

`GEMINI_API_KEY` — set as a Cloudflare secret, never in code or config files.

---

## Local setup

1. Install Wrangler if needed: `npm install -g wrangler`
2. Create `.dev.vars` in this directory (gitignored — do not commit):
   ```
   GEMINI_API_KEY=your-key-here
   ```
3. Run locally: `npx wrangler dev`
4. Test with a POST to `http://localhost:8787`:
   ```json
   { "prompt": "Hello coach", "model": "gemini-2.5-flash-lite" }
   ```

---

## Deployment

1. Authenticate: `wrangler login`
2. Set production secret: `wrangler secret put GEMINI_API_KEY`
3. Deploy: `wrangler deploy`
4. Copy the deployed Worker URL into `CONFIG.geminiProxyUrl` in `assets/js/config.js`
5. Only then set `FEATURES.geminiProvider = true` after running the full test matrix

---

## Allowed origins

Configured in `src/index.js` (`ALLOWED_ORIGINS`). Currently:
- `http://localhost:8000`
- `http://localhost:3001`
- `https://vikthor1.github.io`

Tighten this list before any public deployment.

---

## Request shape

```json
{
  "prompt": "...",
  "model": "gemini-2.5-flash",
  "stageId": "stage.revision",
  "requestKind": "full_draft_review"
}
```

`stageId` selects the validated Stage 7 and Stage 10 generation profiles.
`requestKind: "passage_analysis"` selects the cross-genre whole-passage
profile: Gemini 2.5 Flash, 1,536 output-token ceiling, and thinking disabled so
the concise visible response is not starved by hidden reasoning.
`requestKind: "full_draft_review"` selects the guided whole-draft profile:
Gemini 2.5 Flash, a 3,072 output-token safety ceiling, and thinking disabled.
The higher ceiling prevents a structured whole-draft review from being cut off;
it is not a target response length. Unknown `requestKind` values receive the
ordinary stage configuration.

## Response shape

Success:
`{ "text": "...", "truncated": false, "usage": { "inputTokens": 0, "outputTokens": 0, "thoughtTokens": 0, "cachedTokens": 0, "totalTokens": 0 } }`
Error: `{ "error": "...", "category": "..." }`

The Worker accepts prompts up to 128,000 characters. This application ceiling
accommodates Tu Pana's longest genre layer plus long-form student writing while
retaining a bounded request size.

---

## Privacy

Student writing is never logged. API key is never logged. Only error type is
logged on failure. The success response exposes sanitized aggregate token
counts from Gemini so the browser can maintain local usage totals; it never
includes prompt text, response text, IP addresses, or student identifiers.
