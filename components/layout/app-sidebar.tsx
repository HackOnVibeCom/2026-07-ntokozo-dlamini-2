"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  title: string;
  icon: string;
  url: string;
  badge?: string;
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = [
    { title: "New Brief", icon: "plus", url: "/" },
    { title: "Zink", icon: "zap", url: isActive("/swarm/*") ? pathname : "#" },
  ];

  function isActive(pattern: string): boolean {
    if (pattern === "/") return pathname === "/";
    if (pattern === "/swarm/*") return pathname.startsWith("/swarm/");
    return pathname.startsWith(pattern);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-zinc-200 bg-zinc-50">
      {/* Logo area */}
      <div className="flex h-14 items-center gap-2 border-b border-zinc-200 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 8h4M8 2v4M10 8h4M8 10v4" />
          </svg>
        </div>
        <span className="font-bold text-sm tracking-tight text-zinc-900">
          Zink
        </span>
        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">v0.1</Badge>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-3 py-3">
        <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Main
        </p>
        {navItems.map((item) => {
          const active = isActive(item.url);
          return (
            <button
              key={item.title}
              onClick={() => item.url !== "#" && router.push(item.url)}
              disabled={item.url === "#"}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left w-full",
                active
                  ? "bg-zinc-200 text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <Icon name={item.icon} className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-zinc-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600">
            ZK
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-900">Zink</span>
            <span className="text-[11px] text-zinc-400">HackOnVibe 2026</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Icon({ name, className }: { name: string; className?: string }) {
  const map: Record<string, React.ReactNode> = {
    plus: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    ),
    zap: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  };
  return <>{map[name] ?? null}</>;
}