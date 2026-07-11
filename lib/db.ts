import fs from "fs";
import path from "path";
import type { CampaignStage, SwarmState, TraceEvent } from "./types";

// Zero-dependency, durable in-memory store with JSON-file persistence.
// Pivoted from better-sqlite3 (ADR-003): the native build has no Node 24 prebuilt
// and the source compile is slow/fragile, threatening the offline demo guarantee.
// API is identical to the SQLite version so orchestrator/agents/routes are unchanged.

const STORE_PATH = path.join(process.cwd(), "launch_system_data.json");

interface StoreShape {
  runs: Record<string, SwarmState>;
  traces: Record<string, TraceEvent[]>;
  counters: Record<string, number>;
}

declare global {
  // eslint-disable-next-line no-var
  var swarmStore: StoreShape | undefined;
  // eslint-disable-next-line no-var
  var swarmPersistChain: Promise<void> | undefined;
}

function loadStore(): StoreShape {
  if (globalThis.swarmStore) return globalThis.swarmStore;
  let data: StoreShape = { runs: {}, traces: {}, counters: {} };
  try {
    if (fs.existsSync(STORE_PATH)) {
      data = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as StoreShape;
    }
  } catch {
    data = { runs: {}, traces: {}, counters: {} };
  }
  globalThis.swarmStore = data;
  return data;
}

// Serialize all writes through a single promise chain to avoid interleaved file writes.
function persist(): Promise<void> {
  const store = loadStore();
  const prev = globalThis.swarmPersistChain ?? Promise.resolve();
  const next = prev.then(() => {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store));
  });
  globalThis.swarmPersistChain = next.catch(() => undefined);
  return globalThis.swarmPersistChain;
}

function nextEventId(runId: string): number {
  const store = loadStore();
  const cur = store.counters[runId] ?? 0;
  store.counters[runId] = cur + 1;
  return store.counters[runId];
}

export function createRun(runId: string, state: SwarmState): void {
  const store = loadStore();
  store.runs[runId] = state;
  store.traces[runId] = [];
  store.counters[runId] = 0;
  persist();
}

export function updateRunState(runId: string, state: SwarmState): void {
  const store = loadStore();
  store.runs[runId] = state;
  persist();
}

export function appendTrace(
  runId: string,
  event: {
    agent_role: string;
    narrative: string;
    stage: CampaignStage;
    kind: TraceEvent["kind"];
  },
): void {
  const store = loadStore();
  if (!store.traces[runId]) store.traces[runId] = [];
  const record: TraceEvent = {
    event_id: nextEventId(runId),
    run_id: runId,
    agent_role: event.agent_role,
    narrative: event.narrative,
    stage: event.stage,
    kind: event.kind,
    timestamp: new Date().toISOString(),
  };
  store.traces[runId].push(record);
  persist();
}

export function getRun(runId: string): SwarmState | undefined {
  const store = loadStore();
  return store.runs[runId];
}

export function getTracesSince(runId: string, lastId: number): TraceEvent[] {
  const store = loadStore();
  const all = store.traces[runId] ?? [];
  return all.filter((t) => t.event_id > lastId);
}
