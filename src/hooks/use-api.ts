"use client";

import { useState, useCallback } from "react";
import type { ApiResponse } from "@/types";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T = unknown>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(
    async (url: string, options?: RequestInit): Promise<T | null> => {
      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const res = await fetch(url, {
          headers: { "Content-Type": "application/json", ...options?.headers },
          ...options,
        });

        const json: ApiResponse<T> = await res.json();

        if (!json.success) {
          setState({ data: null, loading: false, error: json.error || "Request failed" });
          return null;
        }

        setState({ data: json.data ?? null, loading: false, error: null });
        return json.data ?? null;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error";
        setState({ data: null, loading: false, error: message });
        return null;
      }
    },
    []
  );

  const get = useCallback((url: string) => request(url), [request]);

  const post = useCallback(
    (url: string, body: unknown) =>
      request(url, { method: "POST", body: JSON.stringify(body) }),
    [request]
  );

  const put = useCallback(
    (url: string, body: unknown) =>
      request(url, { method: "PUT", body: JSON.stringify(body) }),
    [request]
  );

  const del = useCallback(
    (url: string, body?: unknown) =>
      request(url, {
        method: "DELETE",
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    [request]
  );

  return { ...state, get, post, put, del, request };
}
