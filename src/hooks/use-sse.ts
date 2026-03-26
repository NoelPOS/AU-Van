"use client";

import { useEffect, useRef, useCallback } from "react";

type SSEHandler = (data: unknown) => void;

export function useSSE(url: string, handlers: Record<string, SSEHandler>, enabled = true) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    if (!enabled) return;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("connected", (e) => {
      handlersRef.current.connected?.(JSON.parse(e.data));
    });

    es.addEventListener("notification", (e) => {
      handlersRef.current.notification?.(JSON.parse(e.data));
    });

    es.addEventListener("seat_update", (e) => {
      handlersRef.current.seat_update?.(JSON.parse(e.data));
    });

    es.addEventListener("booking_update", (e) => {
      handlersRef.current.booking_update?.(JSON.parse(e.data));
    });

    es.onerror = () => {
      es.close();
      // Reconnect after 5s
      setTimeout(connect, 5000);
    };
  }, [url, enabled]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return {
    close: () => eventSourceRef.current?.close(),
  };
}
