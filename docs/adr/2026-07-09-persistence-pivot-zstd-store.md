# ADR-003 — Persistence Layer Pivot: SQLite → Zero-Dep Store

**Number**: ADR-003
**Title**: Drop better-sqlite3; use a zero-dependency durable store
**Date**: 2026-07-09
**Status**: Accepted
**Supersedes**: ADR-001 §4 (SQLite via better-sqlite3)

---

## Context

ADR-001 specified SQLite via `better-sqlite3`. During Phase 3 scaffolding on Node 24,
`npm install` attempted to compile `better-sqlite3` from source (no prebuilt binary for the
Node 24 ABI). The native build is slow and was killed by the environment timeout, leaving
`node_modules` uninstalled and blocking the entire build. A fragile native dependency
directly threatens the offline-demo guarantee because it can fail at demo-setup time.

## Decision

Replace `better-sqlite3` with a zero-dependency, process-local durable store: an in-memory
map persisted to a single JSON file (`launch_system_data.json`), accessed through the same
function API (`createRun`, `updateRunState`, `appendTrace`, `getRun`, `getTracesSince`).
No native compilation. `npm install` is now pure-JS and instant.

## Consequences

Positive:

- `npm install` is fast and reliable; no native toolchain needed → stronger offline/demo
  guarantee.
- Identical DB API, so orchestrator, agents, and SSE routes are unchanged.
- Aligns with the "simple beats clever" and "demo or die" principles.

Negative:

- Not a true concurrent SQL engine (single Node process). Acceptable: the demo runs one
  local Next.js server, one run at a time.
- Persisted JSON (not a real DB file); fine for hackathon scope. If future needs require
  SQL, revisit — out of scope now.

## Alternatives Considered

### Alternative: keep better-sqlite3, allow long compile
- **Pros**: matches original ADR.
- **Cons**: slow/fragile native build on Node 24; risks demo-setup failure.
- **Rejected**.

### Alternative: Node 24 built-in `node:sqlite`
- **Pros**: zero install.
- **Cons**: experimental flag wiring inside the Next.js server runtime is fragile; same
  concurrency limits.
- **Rejected**: pure-JS store is simpler and flag-free.
