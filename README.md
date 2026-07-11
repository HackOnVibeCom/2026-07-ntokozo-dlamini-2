# Zink — Multi-Agent Launch Orchestrator

**HackOnVibe · July 2026** — Theme: *Effective promotion of a newly launched mobile app.*

Zink takes a freshly launched mobile app and autonomously plans, writes,
designs, and projects a complete, downloadable launch campaign. Five
specialized agents run through a typed state machine and emit a full launch
kit — strategy, store listing, social copy, brand palette, SVG poster, and an
install projection — in a single pass. The demo runs **fully offline**; no
API key, no network, no waiting.

## What it does

1. **Brief** — enter app name, audience, category, store URL, budget, and
   design share.
2. **Swarm** — five agents execute in sequence:
   - **Planner** (`STRATEGIZE`) — 14-day launch strategy and channel mix.
   - **Copywriter + Community** (`COPYWRITING`) — store listing, X thread,
     Instagram caption, launch email, and a Reddit/HN angle.
   - **Designer** (`ASSET_GENERATION`) — brand palette and a declarative SVG
     poster (no image API).
   - **Analyst** (`PROJECTION`) — transparent heuristic install projection.
   - **System Orchestrator** — coordinates stage routing and emits the final
     launch kit.
3. **Results** — live stage tracker, streamed agent reasoning, generated
   assets, projection numbers, and one-click kit export.

## Tech stack

- **Next.js 15 (App Router)** + **TypeScript** + **React 19** + **Tailwind CSS 3**
- **Radix UI primitives** (select, scroll-area, separator, slot) wrapped as
  shadcn-style components
- **lucide-react** icons (MIT)
- Custom TypeScript orchestrator — no LangGraph, no agent framework
- LLM provider is pluggable: **NVIDIA NIM** (OpenAI-compatible) when
  `LLM_API_KEY` is set *and* reachable; otherwise a **deterministic mock
  provider** (FNV-1a hash + Mulberry32 PRNG) so the demo always runs offline
- **Server-Sent Events** for live agent streaming
- Zero-dependency JSON store for run state and the trace log

## Run

```bash
npm install
cp .env.example .env      # optional: add LLM_API_KEY for live LLM; leave empty for offline
npm run dev               # http://localhost:3000
```

Production:

```bash
npm run build && npm run start
```

## Demo flow (offline-safe)

1. Fill the brief — try "PocketPantry", audience "busy home cooks",
   category "Food & Drink", budget 3000, design share 0.3.
2. Click **Launch the swarm** — watch the stage tracker light up and the
   agent reasoning stream in real time.
3. When complete, review the strategy, copy assets, SVG poster, and
   projection, then **Download launch kit**.

The UI badge shows `OFFLINE MOCK` or `LIVE LLM (NVIDIA NIM)`. With no key and
Wi-Fi off, the entire campaign still generates — that is the offline guarantee.

## Architecture

- **Typed state graph**: `INITIALIZE → STRATEGIZE → COPYWRITING → ASSET_GENERATION → PROJECTION → COMPLETE`.
- **Fault tolerance**: sliding-window history trim, loop-guard threshold, and graceful cloud→mock fallback on any LLM failure.
- **Observability**: every agent transition is persisted as a trace event and streamed to the UI via SSE.
- **Reproducible**: one command, no external services, deterministic in mock mode.

See `docs/adr/` for the canonical architecture decisions:

- [ADR-001 — Multi-Agent Launch Swarm Architecture](docs/adr/2026-07-09-multi-agent-launch-swarm.md)
- [ADR-002 — LLM Provider: Cloud + Mock](docs/adr/2026-07-09-llm-provider-cloud-mock.md)
- [ADR-003 — Persistence Layer Pivot: SQLite → Zero-Dep Store](docs/adr/2026-07-09-persistence-pivot-zstd-store.md)

## Project layout

```
app/
  page.tsx                        Brief form
  swarm/[runId]/page.tsx          Results (stage tracker, trace, assets, export)
  swarm/[runId]/components/        StageStepper, ChatTrace, StatCard
  api/swarm/run/route.ts          POST  start a run
  api/swarm/stream/route.ts       GET   SSE live trace
  api/swarm/[id]/route.ts         GET   final state + traces
  api/swarm/[id]/export/route.ts  POST  download kit (.md)
components/
  layout/                         app-sidebar, dashboard-shell, header
  ui/                             card, button, input, badge, select, separator, scroll-area, heading
hooks/
  useSwarmSSE.ts                  SSE client hook
lib/
  agents.ts        orchestrator.ts  types.ts  db.ts  llm.ts
  seededGenerators.ts  svgPoster.ts  projectionEngine.ts
  categories.ts  tfidf.ts  evals.ts  attestation.ts  share.ts  utils.ts
docs/
  adr/                            ADR-001 architecture, ADR-002 LLM provider, ADR-003 persistence
  LEARNINGS.md                    what I learnt building Zink
  CONSTRAINTS.md                  limits faced (compute, time, scope cuts)
  FUTURE.md                       expansion roadmap (Phase A–D)
  SUBMISSION.md                   submission checklist
```

## Team

- **Ntokozo Dlamini** — solo captain (`@n-dlms`)
- Built during HackOnVibe, July 10–13, 2026.

## License

MIT.
