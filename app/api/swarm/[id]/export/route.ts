import { NextRequest, NextResponse } from "next/server";
import { getRun } from "@/lib/db";
import type { AgentPayload } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildKitMarkdown(p: AgentPayload): string {
  const lines: string[] = [];
  lines.push(`# Launch Kit — ${p.appName}`);
  lines.push("");
  lines.push(`- **Category:** ${p.category}`);
  lines.push(`- **Target audience:** ${p.targetAudience}`);
  lines.push(`- **Store:** ${p.storeUrl || "n/a"}`);
  lines.push(`- **Budget:** $${p.marketingBudget} (design share ${(p.designShare * 100).toFixed(0)}%)`);
  lines.push(`- **Channels:** ${p.channels.join(", ")}`);
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
    lines.push(v);
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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleExport(params);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleExport(params);
}

async function handleExport(params: Promise<{ id: string }>) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) {
    return NextResponse.json({ error: "run not found" }, { status: 404 });
  }
  const md = buildKitMarkdown(run.payload);
  return new NextResponse(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${run.payload.appName.replace(/\s+/g, "_")}_launch_kit.md"`,
    },
  });
}
