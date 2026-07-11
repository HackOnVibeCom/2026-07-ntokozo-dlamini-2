"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { STAGE_ORDER, AGENT_LABELS, type CampaignStage } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export default function StageStepper({ currentStage }: { currentStage: CampaignStage }) {
  const ci = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {STAGE_ORDER.map((stage, i) => {
        const done = i < ci;
        const active = i === ci;
        return (
          <React.Fragment key={stage}>
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
                done
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : active
                    ? "border-zinc-900 bg-zinc-900 text-zinc-50 animate-pulse"
                    : "border-zinc-200 bg-white text-zinc-400"
              )}
            >
              <span className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                done && "bg-emerald-600 text-white",
                active && "bg-zinc-700 text-white",
                !done && !active && "bg-zinc-100 text-zinc-400"
              )}>
                {done ? "✓" : i + 1}
              </span>
              <div className="text-xs font-semibold whitespace-nowrap">
                {AGENT_LABELS[stage] ?? stage}
              </div>
            </div>
            {i < STAGE_ORDER.length - 1 && (
              <span className="text-zinc-300 select-none">→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}