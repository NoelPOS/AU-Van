"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { ITimeslot } from "@/types";

const ADMIN_PAGE_LIMIT = 15;

export interface PaginatedTimeslots {
  data: ITimeslot[];
  total: number;
  page: number;
  totalPages: number;
}

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

export function useAdminTimeslots(routeId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.timeslots.adminList(routeId, page),
    queryFn: () =>
      api.get<PaginatedTimeslots>(
        `/api/admin/timeslots?routeId=${routeId}&page=${page}&limit=${ADMIN_PAGE_LIMIT}`
      ),
    enabled: !!routeId,
  });
}

export function useCreateTimeslot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { routeId: string; date: string; time: string; totalSeats: number }) =>
      api.post<ITimeslot>("/api/admin/timeslots", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeslots.all });
    },
  });
}

export function useBulkCreateTimeslots() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      routeId: string;
      dateFrom: string;
      dateTo: string;
      daysOfWeek: number[];
      times: string[];
      totalSeats: number;
    }) => api.post<{ created: number; skipped: number }>("/api/admin/timeslots/bulk", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeslots.all });
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
