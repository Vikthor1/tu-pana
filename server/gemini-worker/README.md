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
  "model": "gemini-2.5-flash-lite"
}
```

Optional fields accepted but not yet used: `stageId`, `studentContext`, `assignmentConfig`, `responseFormat`.

## Response shape

Success: `{ "text": "..." }`
Error: `{ "error": "..." }`

---

## Privacy

Student writing is never logged. API key is never logged. Only error type is logged on failure.
