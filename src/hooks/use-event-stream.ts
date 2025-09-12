"use client";

import { useEffect, useRef, useState } from "react";
import type { Event } from "@/types/events";

const MAX_EVENTS = 500;

export function useEventStream(opts?: { paused?: boolean; replay?: number }) {
  const paused = !!opts?.paused;
  const replay = Math.max(0, Math.min(100, opts?.replay ?? 20));

  const [events, setEvents] = useState<Event[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (paused) {
      // Close existing stream when pausing
      if (esRef.current) {
        try { esRef.current.close(); } catch {}
        esRef.current = null;
      }
      setConnected(false);
      return; // do not open a stream
    }

    const url = `/api/live/events?replay=${replay}`;
    const es = new EventSource(url);
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as Event;
        setEvents((prev) => {
          const next = [data, ...prev];
          if (next.length > MAX_EVENTS) next.length = MAX_EVENTS;
          return next;
        });
      } catch {}
    };
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [paused, replay]);

  return { events, connected };
}
