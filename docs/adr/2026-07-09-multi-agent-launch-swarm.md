# ADR-001 — Multi-Agent Launch Swarm Architecture

**Number**: ADR-001
**Title**: Fully-local multi-agent launch orchestration for HackOnVibe
**Date**: 2026-07-09
**Status**: Accepted (§3 superseded by ADR-002, §4 superseded by ADR-003)
**Supersedes**: Nothing

---

## Context

HackOnVibe (July 2026) theme is **"Effective promotion of a newly launched mobile app."**
Judging weights: (1) Usefulness/execution, (2) AI & product depth, (3) Business potential.
We chose the hardest, most novel engineering route — not a copy-generator. **Zink** is an
autonomous multi-agent launch orchestrator: given a freshly launched app's details, a
coordinated set of specialized agents (planner, copywriter, designer, analyst) run a
simulated launch campaign and emit a full promo kit + analytics projection.

Constraints that shape the decision:

- Demo MUST work offline (judges may drop Wi-Fi during evaluation).
- 3-day build window (Fri Jul 10 → Mon Jul 13, 2026, SAST).
- Single deployable, minimal external dependencies (no microservices, no paid tiers).
- Must be demoable in under 3 minutes with a clear "wow".

## Decision

1. **Stack**: Single full-stack TypeScript app — Next.js 15 (App Router) + React 19 +
   Tailwind CSS 3. No separate Python backend (one deployable, one language). Backend
   logic lives in Next.js API routes and `lib/` server modules.
2. **Agent runtime**: A custom lightweight multi-agent orchestrator written in TypeScript,
   not LangGraph. Rationale: maximizes engineering signal, zero heavy framework deps, full
   control over offline behavior, no dependency we must verify at demo time. Each agent is
   a module with: a system prompt, a tool set, a role in a shared **state graph**, and a
   typed message bus.
3. **LLM provider**: pluggable. Cloud LLM is primary when available; a deterministic Mock
   provider is the fallback that returns structured, plausible outputs so the entire swarm
   pipeline still executes and is demoable with zero network. Provider is selected at
   runtime by health-check; UI shows which provider is active. (See ADR-002 for the cloud
   provider choice.)
4. **Tool use**: Agents call local tools (no external network): `writeFile`, `schedulePost`,
   `generateDesignBrief`, `computeProjection`, `reflect`. Tools are pure functions over the
   in-memory/shared state — no external API calls — preserving the offline demo.
5. **Shared state**: a JSON-backed store persists each campaign run (app profile, agent
   messages, generated artifacts, timeline). Single file, portable, offline. (See ADR-003
   for why this replaced SQLite.)
6. **Visualization**: Live "swarm activity" view — an event stream plus a stage tracker
   showing agents activating and handing off. This is the demo "wow."

## Consequences

Positive:

- Fully offline, single-command demo (`npm run dev` / `npm run build && npm run start`).
- Strong "AI & product depth" story (real multi-agent orchestration, tool use, shared state).
- Differentiated vs. the expected copy-generator crowd.
- No secrets, no paid tiers, no external API risk.

Negative:

- Custom orchestrator is more code than using LangGraph (mitigated by keeping it small
  and well-scoped — one `lib/orchestrator.ts` file).
- Agent outputs without a real LLM are templated and less "magical" — the UI must make the
  *orchestration* the star, not just text quality. We lean on the live stage tracker and
  streamed reasoning for that.

## Alternatives Considered

### Alternative 1: LangGraph.js
- **Pros**: battle-tested orchestration, state graph primitives.
- **Cons**: heavy dependency to verify, less "we built it" engineering signal, another
  moving part for offline.
- **Rejected**: custom runtime better serves the "hardest engineering" goal and the
  offline guarantee.

### Alternative 2: Python FastAPI + LangGraph backend + Next.js frontend
- **Pros**: rich AI/ML ecosystem.
- **Cons**: two languages/runtimes (violates single-stack scope), two processes to demo,
  harder offline story.
- **Rejected**: single TS stack is simpler to demo and deploy.

### Alternative 3: Single LLM call that emits the whole kit (no agents)
- **Pros**: trivial.
- **Cons**: not novel, weak AI-depth score, exactly what others will do.
- **Rejected**: contradicts the goal.

## Status Notes

- §3 (LLM provider as Ollama) was superseded by ADR-002 when it became clear the demo host
  had insufficient disk for a local model.
- §4 (SQLite via better-sqlite3) was superseded by ADR-003 after a Node 24 native-build
  failure during scaffolding.
