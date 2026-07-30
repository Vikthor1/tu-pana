# TP-SR-02 — Live Verification & Edge-Hardening Checklist

Companion to the TP-SR-01 audit and the TP-SR-02 hardening pass. The repo-level fixes
(F2 disclosure, F1 origin admission gate, data-minimization cleanup) are committed in code;
the items below are **dashboard / deployment** facts that **cannot be verified from the repo**
and must be checked by the founder with Cloudflare / Google / GitHub access. Nothing here
authorizes a deployment.

Status legend: **Verified from repo** · **Needs dashboard verification** · **Not inspectable from repo** · **Deferred**

---

## F1 — Abuse / rate-limit / quota protection

The code-level origin admission gate added in `server/gemini-worker/src/index.js` rejects requests
whose `Origin` is not allowlisted **before** any Gemini call, so casual cross-origin / naive-script
abuse can no longer burn quota. **It does not stop a determined non-browser client that forges the
`Origin` header.** Meaningful abuse/cost protection therefore still requires an edge rule:

| Item | Status | Action required |
|------|--------|-----------------|
| Origin admission gate (reject non-allowlisted origin pre-Gemini) | **Verified from repo** | Shipped in `src/index.js` (TP-SR-02). Re-deploy Worker to take effect. |
| Cloudflare **Rate Limiting** rule on the Worker route | **Needs dashboard verification** | Add a rule (e.g. N requests / IP / minute → block or challenge) on the `tupana-gemini-proxy` route. This is the real abuse/cost ceiling. |
| Cloudflare **Turnstile** (optional, stronger) | **Deferred** | Only if rate limiting proves insufficient; adds a human-verification step. Not built — requires separate authorization. |
| Gemini per-request caps (prompt size, model allowlist, output tokens) | **Verified from repo** | Already enforced in `src/index.js` (`MAX_PROMPT_CHARS`, `ALLOWED_MODELS`, `maxOutputTokens`). |
| Privacy-safe local usage totals | **Verified from repo** | Worker returns token counts only; browser aggregates them locally by request kind. No prompts, responses, IPs, or student identifiers are added. |

## F5 — Live Cloudflare / deployment verification

| Item | Status | Action required |
|------|--------|-----------------|
| `GEMINI_API_KEY` exists as a Cloudflare **secret** (not a plaintext var, not in public JS) | **Needs dashboard verification** | Confirm via `wrangler secret list` or dashboard → Worker → Settings → Variables (encrypted). Repo confirms it is never in client code. |
| Worker route / custom domain is correct | **Needs dashboard verification** | Confirm `tupana-gemini-proxy.*.workers.dev` (or custom domain) is the only route serving this Worker. |
| CORS allowed origins match production needs | **Verified from repo** (values) / **Needs dashboard verification** (deployed build matches repo) | Repo allowlists `https://vikthor1.github.io` + two dev `localhost` origins (now marked dev-only). Remove localhost for a production-only deploy if desired. |
| Cloudflare logs do **not** retain request bodies / student text | **Not inspectable from repo** | Confirm no Logpush / log retention captures POST bodies. Worker code logs only error type + status enum. |
| Gemini billing / quota limits set | **Needs dashboard verification** | Confirm a billing cap / quota on the Google Cloud project to bound cost. |
| Billing alert threshold matches Fall enrollment | **Needs dashboard verification** | Set a Google Cloud budget alert appropriate to expected enrollment and review it after the first week. The app's soft review guidance is not a substitute for an account-level alert. |
| Gemini data-retention / training settings | **Not inspectable from repo** | Confirm the API tier's data-use terms (paid tier generally excludes training-on-data); record the determination. |
| GitHub Pages serves only intended files | **Needs dashboard verification** | Confirm the Pages deploy publishes only allowlisted files (backups like `index.original.html`, `*.backup` are gitignored and should not be served). |
| Google Form (bug report) permissions & fields | **Needs dashboard verification** | Confirm the Form collects no email/identity by default and is not public-editable. Repo confirms only `stage, stage_en, lang, provider, ts` are passed (no PII). |

---

## What is NOT covered here

This checklist does not authorize deployment, secret rotation, dashboard changes, or any
institutional/security claim. Each is a separate founder decision.
