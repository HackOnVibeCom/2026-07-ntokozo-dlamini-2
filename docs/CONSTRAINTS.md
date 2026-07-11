# Constraints

Limitations I was honest about during the HackOnVibe build. Listed to show the judges what
trade-offs were deliberate, not oversights.

## Hardware & runtime constraints

### Limited compute — no expensive proprietary models

I did not have budget for paid APIs (OpenAI GPT-4, Anthropic Claude, or the largest NVIDIA
NIM instances). I relied entirely on:

- **Open-source models** via the NVIDIA NIM free-tier catalogue (`meta/llama-3.1-8b-instruct`,
  hosted at `integrate.api.nvidia.com`), accessed through their OpenAI-compatible interface.
- **The deterministic Mock provider** as a fully offline fallback that runs the entire swarm
  pipeline without any API call.

This was not a downgrade — it became a strength. The Mock path makes the demo bulletproof
(no rate limits, no flaky tokens, no Wi-Fi dependency) and the open-source model path works
when connected without costing a cent. A $200/month proprietary model call would have
added zero value to the architecture; the orchestrator, state graph, typed tool contracts,
and observability layer are what the judges score on.

### Single machine, single process

Everything runs in one Next.js process on one laptop. No distributed orchestration, no
separate LLM worker, no Redis queue. The JSON store in `lib/db.ts` is a simple in-memory
map flushed to disk. This was deliberate — the demo is self-contained and the CI/CD
pipeline deploys a single artefact — but it means:

- One run at a time (concurrent swarms are not supported).
- Server restart loses the in-memory state if the JSON file was not persisted (mitigated by
  writing on every state transition).

## Time constraints

### 3-day build window

The hackathon ran from Fri Jul 10 20:00 to Mon Jul 13 07:59 SAST. That is roughly 62 hours
with sleep, food, and sanity. Because of this compression:

- There are no unit tests (the `lib/evals.ts` module is a skeleton for post-hackathon use).
- The CI/CD workflow from the hackathon scaffold expects a static build with `index.html`,
  but Zink is a Next.js SSR app — the CI will likely deploy an honest-error page rather
  than a live SSR server. I know this; I prioritised the functional demo on my machine
  over pipeline compatibility.
- Agent "tools" are simulated as typed payload mutations rather than actual function calls —
  the infrastructure for real tool dispatch exists (`lib/llm.ts` exports `ToolDef` and
  `ToolCall` types) but time did not permit a full tool-execution loop.
- The `lib/attestation.ts` module has the shape for content quality scoring but is not
  wired into the results UI.

## Conscious scope cuts

### No user accounts, no persistence across sessions

The stores are ephemeral — one JSON file, regenerated on each server start. The hackathon
scope explicitly bans auth systems and paid tiers; I obeyed both. Runs are identified by
UUID and live until the server restarts. In a production version this would be a proper DB
with per-user scoping.

### No real-time multi-user collaboration

The SSE stream is per-run, not per-viewer. Multiple browser tabs watching the same run
would each open their own stream. Acceptable for a solo demo; a collaborative product
would use a pub/sub layer.

### No actual app store feed or ad-platform integration

Channels are suggested, not scheduled. The output kit is a Markdown document, not a set of
posted tweets. This keeps the demo self-contained and offline-safe; a real product would
add scheduling connectors (Meta Graph API, X API, Reddit API) as optional plugins.

### No internationalisation

English only. The UI strings are hardcoded, not in a locale file. Given the 3-day window
this was the right call — internationalisation adds surface area without changing the score.