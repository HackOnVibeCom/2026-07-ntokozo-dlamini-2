"use client";

import { useEffect, useRef, useState } from "react";
import type { SwarmState, TraceEvent } from "@/lib/types";

export interface SwarmEvent extends TraceEvent {}

export function useSwarmSSE(runId: string | null) {
  const [logs, setLogs] = useState<SwarmEvent[]>([]);
  const [state, setState] = useState<SwarmState | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const lastId = useRef(0);

  useEffect(() => {
    if (!runId) return;
    setLogs([]);
    setState(null);
    setIsComplete(false);
    lastId.current = 0;

    const es = new EventSource(`/api/swarm/stream?runId=${runId}`);

    es.addEventListener("handshake", () => {});

    es.addEventListener("agent_log", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as SwarmEvent;
      setLogs((prev) => [...prev, data]);
      lastId.current = data.event_id;
    });

    es.addEventListener("swarm_complete", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as SwarmState;
      setState(data);
      setIsComplete(true);
      es.close();
    });

    es.addEventListener("error", () => {
      // EventSource auto-reconnects; no-op.
    });

    return () => es.close();
  }, [runId]);

  return { logs, state, isComplete };
}
