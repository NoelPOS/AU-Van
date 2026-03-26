"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { IRoute } from "@/types";

export function useRoutes() {
  return useQuery({
    queryKey: queryKeys.routes.all,
    queryFn: () => api.get<IRoute[]>("/api/admin/routes"),
  });
}

export function useLiffRoutes() {
  return useQuery({
    queryKey: queryKeys.routes.all,
    queryFn: () => api.get<IRoute[]>("/api/liff/routes"),
  });
}

export function useRoute(id: string) {
  return useQuery({
    queryKey: queryKeys.routes.detail(id),
    queryFn: () => api.get<IRoute>(`/api/liff/routes/${id}`),
    enabled: !!id,
  });
}

export function useCreateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { from: string; to: string; price: number; distance?: number; duration?: number }) =>
      api.post<IRoute>("/api/admin/routes", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes.all });
    },
  });
}

export function useDeleteRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/admin/routes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routes.all });
    },
  });
}
