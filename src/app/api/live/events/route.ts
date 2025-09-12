import { FeedBus } from "@/server/feed-bus";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await FeedBus.start();

  const { searchParams } = new URL(req.url);
  const replay = Math.min(100, Math.max(0, Number(searchParams.get("replay") || "20")));

  let doCleanup: (() => void) | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      let closed = false;

      const safeEnqueue = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(enc.encode(chunk));
        } catch {
          closed = true;
          cleanup();
        }
      };
      const safeWrite = (data: unknown) => safeEnqueue(`data: ${JSON.stringify(data)}\n\n`);

      // Optional replay
      const recent = FeedBus.getSince(undefined, replay);
      for (const e of recent.reverse()) safeWrite(e);

      // Subscribe to new events
      const unsubscribe = FeedBus.subscribe((e) => safeWrite(e));

      // Heartbeat
      const heartbeat = setInterval(() => safeEnqueue(`: keepalive\n\n`), 15_000);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
      doCleanup = cleanup;
    },
    cancel() {
      try {
        if (doCleanup) doCleanup();
      } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "*",
    },
  });
}
