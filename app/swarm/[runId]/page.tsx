"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSwarmSSE } from "@/hooks/useSwarmSSE";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import StageStepper from "./components/StageStepper";
import ChatTrace from "./components/ChatTrace";
import { StatCard } from "./components/StatCard";

export default function SwarmPage({ params }: { params: Promise<{ runId: string }> }) {
  const router = useRouter();
  const [runId, setRunId] = useState<string | null>(null);
  useEffect(() => {
    params.then((p) => setRunId(p.runId));
  }, [params]);

  const { logs, state, isComplete } = useSwarmSSE(runId);
  const current = state?.currentStage;
  const provider = state?.provider;
  const payload = state?.payload;

  return (
    <DashboardShell
      headerRight={
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            ← New Brief
          </Button>
          {provider && (
            <Badge variant={provider === "nim" ? "success" : "warning"}>
              {provider === "nim" ? "LIVE NIM" : "OFFLINE MOCK"}
            </Badge>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {payload?.appName ? `${capitalizeApp(payload.appName)} Launch Campaign` : "Swarm in Progress"}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isComplete ? "Campaign generation complete." : "Agents are orchestrating your launch…"}
            </p>
          </div>
          {runId && (
            <code className="rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-mono text-zinc-500 dark:bg-zinc-800">
              {runId.slice(0, 8)}…
            </code>
          )}
        </div>
        <StageStepper currentStage={current ?? "INITIALIZE"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                Live Agent Trace
              </CardTitle>
              <CardDescription>Real-time SSE stream of every agent thought and tool call</CardDescription>
            </CardHeader>
            <CardContent>
              <ChatTrace logs={logs} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Campaign Stats</CardTitle>
              <CardDescription>Key metrics at a glance.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <StatCard label="Channels" value={String(payload?.channels?.length ?? 0)} />
              <StatCard label="Copy Assets" value={String(Object.keys(payload?.copyAssets ?? {}).length)} />
              {payload?.projectionReport && (
                <>
                  <StatCard label="Impressions" value={payload.projectionReport.projectedImpressions.toLocaleString()} />
                  <StatCard label="Total Installs" value={payload.projectionReport.totalProjectedInstalls.toLocaleString()} trend="up" />
                </>
              )}
            </CardContent>
          </Card>

          {payload?.svgMarkupContent && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Promo Poster</CardTitle>
                <CardDescription>Generated SVG vector artwork.</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="w-full max-w-[280px] mx-auto rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800"
                  dangerouslySetInnerHTML={{ __html: payload.svgMarkupContent }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {isComplete && payload && (
        <div className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Campaign</CardTitle>
              <CardDescription>Full launch kit produced by the agent swarm.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 overflow-hidden">
                <div className="space-y-3 overflow-hidden min-w-0">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Strategy</span>
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words max-w-full">{payload.campaignStrategy}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Tagline</span>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap break-words max-w-full">{payload.sloganText}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Channels</span>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap break-words max-w-full">{payload.channels?.join(" · ")}</p>
                  </div>
                </div>

                <div className="space-y-2 overflow-hidden min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Copy Assets</span>
                  {Object.entries(payload.copyAssets ?? {}).map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                      <span className="text-[10px] font-bold uppercase text-zinc-500">{k}</span>
                      <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words max-w-full">{v as string}</p>
                    </div>
                  ))}
                </div>
              </div>

              {payload.projectionReport && (
                <div>
                  <Separator />
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Ad Spend</span>
                      <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">${payload.projectionReport.targetAdSpend.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Impressions</span>
                      <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{payload.projectionReport.projectedImpressions.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Clicks</span>
                      <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{payload.projectionReport.projectedClicks.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Paid Installs</span>
                      <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{payload.projectionReport.calculatedPaidInstalls.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Organic Installs</span>
                      <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{(payload.projectionReport.totalProjectedInstalls - payload.projectionReport.calculatedPaidInstalls).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">K-Factor</span>
                      <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{payload.projectionReport.organicKFactorMultiplier.toFixed(3)}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">ASO Factor</span>
                      <p className="mt-0.5 text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{payload.projectionReport.asoScaleFactor.toFixed(3)}</p>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Installs</span>
                      <p className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{payload.projectionReport.totalProjectedInstalls.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                variant="outline"
                onClick={() => {
                  const md = buildKitMarkdown(payload);
                  const blob = new Blob([md], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${payload.appName.replace(/\s+/g, "_")}_launch_kit.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download Kit (.md)
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/swarm/shared?runId=${runId}&budget=${payload.marketingBudget}&designShare=${payload.designShare}`;
                  navigator.clipboard.writeText(shareUrl);
                }}
              >
                Copy Share Link
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}

function capitalizeApp(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function buildKitMarkdown(p: any): string {
  const lines: string[] = [];
  lines.push(`# Launch Kit — ${p.appName}`);
  lines.push("");
  lines.push(`- **Category:** ${p.category}`);
  lines.push(`- **Target audience:** ${p.targetAudience}`);
  lines.push(`- **Store:** ${p.storeUrl || "n/a"}`);
  lines.push(`- **Budget:** $${p.marketingBudget} (design share ${(p.designShare * 100).toFixed(0)}%)`);
  lines.push(`- **Channels:** ${(p.channels ?? []).join(", ")}`);
  lines.push("");
  lines.push(`## Strategy`);
  lines.push(p.campaignStrategy ?? "");
  lines.push("");
  lines.push(`## Tagline`);
  lines.push(p.sloganText ?? "");
  lines.push("");
  lines.push(`## Copy`);
  const copy = p.copyAssets ?? {};
  for (const [k, v] of Object.entries(copy)) {
    lines.push(`### ${k}`);
    lines.push(v as string);
    lines.push("");
  }
  if (p.projectionReport) {
    const r = p.projectionReport;
    lines.push(`## Projection`);
    lines.push(`- Target ad spend: $${r.targetAdSpend}`);
    lines.push(`- Projected impressions: ${r.projectedImpressions.toLocaleString()}`);
    lines.push(`- Projected clicks: ${r.projectedClicks.toLocaleString()}`);
    lines.push(`- ASO scale factor: ${r.asoScaleFactor}`);
    lines.push(`- Paid installs: ${r.calculatedPaidInstalls.toLocaleString()}`);
    lines.push(`- Organic multiplier: ${r.organicKFactorMultiplier}`);
    lines.push(`- **Total projected installs: ${r.totalProjectedInstalls.toLocaleString()}**`);
  }
  return lines.join("\n");
}