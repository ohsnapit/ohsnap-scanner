"use client";

import { useMemo } from "react";
import type { Event } from "@/types/events";
import { Skeleton } from "@/components/Skeleton";

interface LiveFeedTableProps {
  events: Event[];
  pageIndex: number;
  pageSize: number;
  onPageIndexChange: (n: number) => void;
}

export function LiveFeedTable({ events, pageIndex, pageSize, onPageIndexChange }: LiveFeedTableProps) {
  // No "new data" nudge. We always prepend and keep pagination simple.

  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const currentPage = pageIndex + 1;
  const startIndex = pageIndex * pageSize;
  const endIndex = startIndex + pageSize;
  const pageRows = useMemo(() => {
    const sliced = events.slice(startIndex, endIndex);
    return sliced;
  }, [events, startIndex, endIndex, pageSize, pageIndex]);

  return (
    <div className="overflow-x-auto md:overflow-x-visible">
      <div
        className="grid grid-cols-11 gap-4 py-3 text-sm font-medium px-6 min-w-[800px] md:min-w-0"
        style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="col-span-2">fid</div>
        <div className="col-span-7">content</div>
        <div className="col-span-2">type</div>
      </div>

      <div className="min-w-[800px] md:min-w-0">
        {events.length === 0 ? (
          <Skeleton variant="table" rows={8} />
        ) : (
          <div>
            {pageRows.map((row, index) => (
              <div
                key={`${row.id}-${row.seq}-${startIndex + index}`}
                className="grid grid-cols-11 gap-4 py-3 px-6"
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                <div className="col-span-2 overflow-hidden">
                  {row.fid ? (
                    <a href={`/user/${row.fid}`} className="hover:underline cursor-pointer block truncate max-w-full" style={{ color: '#71579E' }}>
                      {row.fid}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </div>
                <div className="col-span-7 overflow-hidden">
                  <span className="block truncate max-w-full" style={{ color: 'var(--foreground)' }}>{row.content || ''}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{row.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageIndexChange(Math.max(0, pageIndex - 1))}
              disabled={pageIndex === 0}
              className="px-3 py-1 text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--card-background)', color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
            >
              previous
            </button>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageIndexChange(Math.min(totalPages - 1, pageIndex + 1))}
              disabled={pageIndex >= totalPages - 1}
              className="px-3 py-1 text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--card-background)', color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
            >
              next
            </button>
          </div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            showing {startIndex + 1}-{Math.min(endIndex, events.length)} of {events.length} events
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveFeedTable;
