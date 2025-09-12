"use client";

import { useState } from "react";
import { useEventStream } from "@/hooks/use-event-stream";
import { LiveFeedTable } from "./live-feed-table";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function LiveFeed() {
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 50;
  const { events, connected } = useEventStream({ replay: 20 });

  return (
    <ErrorBoundary>
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Live Feed</h2>
        <div className="text-sm" style={{ color: connected ? '#16a34a' : 'var(--text-muted)' }}>
          {connected ? 'connected' : 'connecting...'}
        </div>
        </div>
        <LiveFeedTable
          events={events}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageIndexChange={setPageIndex}
        />
      </div>
    </ErrorBoundary>
  );
}

export default LiveFeed;
