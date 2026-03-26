"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { ITimeslot } from "@/types";

export function useTimeslots(routeId: string, date?: string) {
  const params = new URLSearchParams();
  params.set("routeId", routeId);
  if (date) params.set("date", date);

  return useQuery({
    queryKey: queryKeys.timeslots.byRoute(routeId, date),
    queryFn: () => api.get<ITimeslot[]>(`/api/liff/timeslots?${params}`),
    enabled: !!routeId,
  });
}

export function useAdminTimeslots(routeId: string) {
  return useQuery({
    queryKey: queryKeys.timeslots.byRoute(routeId),
    queryFn: () => api.get<ITimeslot[]>(`/api/admin/timeslots?routeId=${routeId}`),
    enabled: !!routeId,
  });
}

export function useCreateTimeslot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { routeId: string; date: string; time: string; totalSeats: number }) =>
      api.post<ITimeslot>("/api/admin/timeslots", body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeslots.byRoute(variables.routeId) });
    },
  });
}

export function useCancelTimeslot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/admin/timeslots/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeslots.all });
    },
  });
}
