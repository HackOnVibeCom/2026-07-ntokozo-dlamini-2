"use client";
import React from "react";
import { cn } from "@/lib/utils";
import type { TraceEvent } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

const kindStyles: Record<TraceEvent["kind"], { dot: string; label: string; bg: string }> = {
  think: { dot: "bg-zinc-400", label: "text-zinc-500", bg: "bg-zinc-50" },
  tool: { dot: "bg-emerald-500", label: "text-emerald-600", bg: "bg-emerald-50" },
  handoff: { dot: "bg-amber-500", label: "text-amber-600", bg: "bg-amber-50" },
  complete: { dot: "bg-zinc-900", label: "text-zinc-900", bg: "bg-zinc-100" },
  error: { dot: "bg-rose-500", label: "text-rose-600", bg: "bg-rose-50" },
};

export default function ChatTrace({ logs }: { logs: TraceEvent[] }) {
  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Agent Chat Trace</h3>
        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          {logs.length} events
        </span>
      </div>
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-3 p-1">
          {logs.length === 0 && (
            <p className="text-xs text-zinc-400 py-4 text-center">Waiting for agent activity…</p>
          )}
          {logs.map((log) => {
            const s = kindStyles[log.kind] ?? kindStyles.think;
            return (
              <div key={log.event_id} className={cn("flex flex-col gap-1")}>
                {/* Agent name header */}
                <div className="flex items-center gap-2 px-1">
                  <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                  <span className="text-[11px] font-semibold text-zinc-600">
                    {log.agent_role}
                  </span>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", s.label)}>
                    {log.kind}
                  </span>
                  <span className="ml-auto text-[10px] font-mono text-zinc-300">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {/* Bubble */}
                <div className={cn(
                  "rounded-xl border border-zinc-200 p-3 text-xs leading-relaxed",
                  s.bg
                )}>
                  <p className="text-zinc-700">{log.narrative}</p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-zinc-400">
                    <span className="rounded bg-zinc-200/50 px-1.5 py-0.5 font-mono">
                      {log.stage}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}