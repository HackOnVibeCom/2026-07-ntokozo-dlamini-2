# Expansion Roadmap

If Zink were grown beyond the hackathon into a real product, these are the directions I
would take. Ordered roughly by impact-to-effort ratio.

## Phase A — Solidify the core (0–3 months)

### 1. Persist runs in a real database

Replace the in-memory JSON store with Postgres or SQLite (now that we are not racing a
Node 24 native-build timeout). Run history survives server restarts, enabling user
accounts and "my past campaigns."

### 2. Multi-run concurrency

Add a queue and a worker model so the orchestrator can handle parallel swarms. Simple
Node.js `Worker` threads or a BullMQ queue backed by Redis. The typed state graph is
already an independent unit — the work is in scheduling, not in rewriting agents.

### 3. Replay mode

Store the full trace log and re-stream it on demand. This is the low-hanging fruit for
demos, pitch meetings, and debugging: replay a past run exactly as it happened, with the
same stage transitions and agent messages, without re-executing the swarm.

### 4. Proper tool execution

Wire the `lib/llm.ts` tool-dispatch infrastructure into actual function calls. Agents
currently mutate typed payloads directly; with real tool execution the LLM would emit
`function_call` blocks and the orchestrator would execute them and fold results back into
the context window. This is the single biggest upgrade to "AI depth" for a future demo.

## Phase B — Connect to the world (3–6 months)

### 5. App Store Connect / Google Play Console feed

Plug a real app store metadata pipeline: the `COPYWRITING` agent's store listing goes
straight to App Store Connect API. Screenshot templates from the Designer agent feed into
a real screenshot generator. This turns Zink from a "generator" into a "publisher."

### 6. Social scheduling plugins

Plugin architecture for posting channels: `Meta Graph API` for Instagram/Facebook,
`X API v2` for Twitter/X threads, `Reddit API` for the Reddit angle. Each plugin is
opt-in — the offline Mock path still works without any plugin loaded.

### 7. Ad platform connectors

Plug the projection engine into real cost-per-install data. Fetch CPI benchmarks per
category per region from a data partner (Sensor Tower, data.ai) so the `PROJECTION` stage
produces a spend-vs-installs model grounded in market data, not just heuristics.

## Phase C — Scale to teams (6–12 months)

### 8. Per-team workspaces

User accounts with scoped runs, shared campaign templates, and role-based access. A
marketing team of 3 can each tune a different channel copy while the Designer agent runs
in parallel — the swarm becomes a collaborative workspace, not a single-user tool.

### 9. A/B variant generation

The Planner agent generates 3 strategy variants, the Copywriter writes copy for each,
and the Analyst projects installs per variant. The results page shows a comparison grid.
This is a natural extension of the state graph — just fork the pipeline at `STRATEGIZE`
and collect results.

### 10. Post-launch monitoring agent

Add a sixth agent: `MONITOR`. After the swarm completes, it polls app store review APIs,
social mentions, and install numbers, feeding back into the existing run as a live
"campaign health" view. The original 5-agent swarm becomes a 6-agent lifecycle.

## Phase D — Platform play (12+ months)

### 11. Agent marketplace

Let third parties build and register custom agents (e.g. "TikTok Specialist", "Brazil
Localiser") that plug into the Zink orchestrator via a typed contract. The `ExecutionStep`
type already defines the agent interface — the marketplace is a registry plus a sandboxed
runtime.

### 12. White-label SDK

Embeddable Zink orchestrator for CMS platforms, app-building tools, and no-code services.
Pass a brief, get a launch kit returned as a typed JSON payload. The Next.js UI becomes an
optional shell; the core runtime is a standalone npm package.

### 13. Self-hosted LLM option

For enterprise users who cannot send brief data to a cloud LLM, support a local inference
server (Ollama, LM Studio, llama.cpp with a quantised model). The Mock provider already
demonstrates we can run the full pipeline without any network — the enterprise variant
replaces the seeded PRNG with a real local model, keeping data on-prem.

---

These phases assume the constraints in `CONSTRAINTS.md` are lifted (primarily time and
single-machine execution). The architecture — typed state graph, pluggable LLM provider,
SSE observability — was built with these expansions in mind. The `forceProvider` parameter,
the `ToolDef`/`ToolCall` types, and the `ExecutionStep` interface are deliberate hooks, not
accidental ones.