import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { selectProvider } from "@/lib/llm";
import { runCampaign } from "@/lib/agents";
import type { AgentPayload } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Body = z.object({
  appName: z.string().min(1).max(80),
  targetAudience: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  storeUrl: z.string().max(200).optional().default(""),
  marketingBudget: z.coerce.number().min(0).max(1_000_000),
  designShare: z.coerce.number().min(0).max(1),
  forceProvider: z.enum(["cloud", "mock", "auto"]).optional().default("auto"),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const payload: AgentPayload = {
    appName: d.appName,
    targetAudience: d.targetAudience,
    category: d.category,
    storeUrl: d.storeUrl,
    marketingBudget: d.marketingBudget,
    designShare: d.designShare,
    channels: [],
  };

  const runId = randomUUID();
  const selection = await selectProvider(d.forceProvider);

  // Kick off orchestration in the background; SSE streams progress from the store.
  runCampaign(runId, payload, selection).catch((err) => {
    console.error("runCampaign failed", err);
  });

  return NextResponse.json({ runId, provider: selection.kind });
}
