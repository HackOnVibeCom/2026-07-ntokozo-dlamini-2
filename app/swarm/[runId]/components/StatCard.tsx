import { cn } from "@/lib/utils";

export function StatCard({ label, value, trend }: { label: string; value: string; trend?: "up" | "down" | "neutral" }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="text-xl font-bold tabular-nums text-zinc-900">{value}</span>
      {trend && (
        <span className={cn(
          "text-[11px] font-medium",
          trend === "up" && "text-emerald-600",
          trend === "down" && "text-rose-600",
          trend === "neutral" && "text-zinc-500",
        )}>
          {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"} {trend === "up" ? "Up" : trend === "down" ? "Down" : "Steady"}
        </span>
      )}
    </div>
  );
}