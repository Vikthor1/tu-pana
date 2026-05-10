# Local AI Models — Tu Pana Workflow

*Last updated: 2026-05-09. Machine: MacBook Air M2, 24 GB unified memory.*

Ollama 0.23.2 · Homebrew · arm64 native · API: `localhost:11434`
Active flags: `OLLAMA_FLASH_ATTENTION=1` · `OLLAMA_KV_CACHE_TYPE=q8_0`

---

## Installed Models

| Model | Size | Quantization | Base |
|-------|------|-------------|------|
| `hermes3:8b` | 4.7 GB | Q4_K_M | Llama 3.1 8B |
| `qwen2.5:7b` | 4.7 GB | Q4_K_M | Qwen 2.5 7B |
| `qwen2.5:7b-instruct` | — | (same blob as above) | Qwen 2.5 7B |
| `nomic-embed-text` | 274 MB | — | Embedding |
| `mxbai-embed-large` | 669 MB | — | Embedding |

**Total disk:** ~10.4 GB at `~/.ollama/models/`

---

## RAM Behavior

Each 7B/8B Q4_K_M model uses ~5–6 GB of Metal GPU memory when loaded.
Ollama evicts a model after 5 minutes of inactivity (`OLLAMA_KEEP_ALIVE=5m`).
Only one large model loads at a time under normal use — no memory conflict.

With macOS at rest + one model loaded: ~14 GB used, ~10 GB headroom.
Safe to run Aider alongside a loaded model when installed.

---

## Role Assignment

### `hermes3:8b` — Primary local coding assistant

**Use for:**
- Aider routing tasks (structured task descriptions for file-targeted edits)
- Structured JSON output (function-calling tuned — Llama 3.1 base)
- Code review on specific named functions
- Repo inspection (file-map reasoning, architecture questions)
- Constraint enforcement prompts ("do not touch X, edit only Y")

**Strengths:** Function-calling tuning, instruction following, structured output compliance, 128K native context window.

**Weaknesses:** Slightly slower than Qwen on short responses; architecture reasoning can miss data-layer separation.

---

### `qwen2.5:7b` — Secondary assistant / general tasks

**Use for:**
- General coding questions and summarization
- QA scenario drafting
- Comparing alternative approaches
- Quick one-off lookups where speed matters

**Strengths:** Fast, strong general coding knowledge, concise responses.

**Weaknesses:** Less tuned for function-calling and structured routing; Alibaba training data may have different coding style biases.

---

### `nomic-embed-text` — Embedding (lightweight)

**Use for:** Fast local embeddings, semantic search over small document sets.

---

### `mxbai-embed-large` — Embedding (higher quality)

**Use for:** Higher-quality embeddings when nomic is insufficient. Future Obsidian semantic search experiments.

---

## Task → Model Routing

| Task | Model |
|------|-------|
| Aider task routing | `hermes3:8b` |
| Code review (named function) | `hermes3:8b` |
| Structured JSON output | `hermes3:8b` |
| Repo architecture questions | `hermes3:8b` |
| Summarization | `qwen2.5:7b` |
| QA scenario drafting | `qwen2.5:7b` |
| Fast general coding Q&A | `qwen2.5:7b` |
| Lightweight embeddings | `nomic-embed-text` |
| High-quality embeddings | `mxbai-embed-large` |
| TOON experiments (future) | TBD — not yet active |

---

## TOON (future — optional, external)

TOON is a possible future experiment for JSON → TOON → LLM context compression.

- Not part of the current app architecture
- Not a runtime dependency of any kind
- Relevant only as a potential token-reduction layer for passing large data structures to local models
- Do not add TOON as a dependency until explicitly scoped

---

## Aider Integration Notes

**Aider is installed via pipx** (Python 3.9, isolates Aider from system Python with no ongoing maintenance overhead).

```bash
pipx install aider-chat --python /opt/homebrew/bin/python3.9
```

Pass Hermes as the local model (handled automatically by `.aider.conf.yml`):

```bash
aider --model ollama/hermes3:8b
```

Safe Aider targets (small, isolated files): `config.js`, `data.js`, `prompts.js`, `storage.js`

Risky targets (always name exact function): `ui.js`, `styles.css`, `index.html`

See `docs/workflow/aider-prep.md` for full preparation notes.

---

## What Should NOT Be Done With Local Models

- Do not ask either model to edit `ui.js` without specifying the exact function name
- Do not use local models to generate student-facing Spanish text without bilingual review
- Do not rely on local models for final architectural decisions — use Claude for those
- Do not use `qwen2.5:7b-instruct` and `qwen2.5:7b` as separate models — they are the same weights
