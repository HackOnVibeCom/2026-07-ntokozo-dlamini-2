import { NextRequest } from "next/server";
import { getRun, getTracesSince } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  if (!runId) {
    return new Response(JSON.stringify({ error: "runId parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let lastId = 0;
      let closed = false;
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      send("handshake", { status: "streaming_initialized", runId });

      const tick = () => {
        try {
          const fresh = getTracesSince(runId, lastId);
          for (const t of fresh) {
            send("agent_log", t);
            lastId = t.event_id;
          }
          const run = getRun(runId);
          if (!run) {
            send("error", { details: "run not found" });
            controller.close();
            closed = true;
            return;
          }
          if (run.currentStage === "COMPLETE") {
            send("swarm_complete", run);
            controller.close();
            closed = true;
            return;
          }
        } catch (e) {
          send("error", { details: (e as Error).message });
          controller.close();
          closed = true;
        }
      };

      tick();
      const interval = setInterval(() => {
        if (closed) {
          clearInterval(interval);
          return;
        }
        tick();
      }, 700);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
