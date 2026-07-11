import React from "react";
import { Separator } from "@/components/ui/separator";

export default function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="flex items-center gap-2.5 px-4">
        <Separator orientation="vertical" className="h-4" />
        <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          HackOnVibe · Multi-Agent Launch Swarm
        </div>
      </div>
      <div className="flex items-center gap-2 px-4">
        {children}
      </div>
    </header>
  );
}