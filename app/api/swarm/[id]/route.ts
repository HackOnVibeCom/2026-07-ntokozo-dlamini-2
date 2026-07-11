import { NextRequest, NextResponse } from "next/server";
import { getRun, getTracesSince } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const run = getRun(id);
  if (!run) {
    return NextResponse.json({ error: "run not found" }, { status: 404 });
  }
  const traces = getTracesSince(id, 0);
  return NextResponse.json({ run, traces });
}
