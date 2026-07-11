import { NextRequest, NextResponse } from "next/server";
import { decodeStatePayload } from "@/lib/share";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const payloadParam = searchParams.get("payload");
  const shortParam = searchParams.get("s");
  const runId = searchParams.get("runId");
  const budget = searchParams.get("budget");
  const designShare = searchParams.get("designShare");

  // Try to decode full payload first
  let state = null;
  if (payloadParam) {
    state = decodeStatePayload(payloadParam);
  } else if (shortParam) {
    // Short URL - decode the minimal payload
    try {
      const base64 = shortParam.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
      const json = decodeURIComponent(escape(atob(padded)));
      state = JSON.parse(json);
    } catch {}
  }

  // Build redirect URL with any available params
  const url = new URL("/", request.url);
  if (runId) url.searchParams.set("runId", runId);
  if (budget) url.searchParams.set("budget", budget);
  if (designShare) url.searchParams.set("designShare", designShare);

  // Return HTML that redirects client-side
  return new NextResponse(
    `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Loading SwarmLaunch…</title>
    <script>
      window.location.href = "${url.toString()}";
    </script>
  </head>
  <body>Redirecting…</body>
</html>`,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
}