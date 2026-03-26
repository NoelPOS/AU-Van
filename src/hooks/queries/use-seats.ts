"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { ISeat } from "@/types";

export function useSeats(timeslotId: string) {
  return useQuery({
    queryKey: queryKeys.seats.byTimeslot(timeslotId),
    queryFn: () => api.get<ISeat[]>(`/api/seats/${timeslotId}`),
    enabled: !!timeslotId,
    refetchInterval: 10_000, // poll every 10s for seat availability
  });
}

export function useLockSeats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ timeslotId, seatIds }: { timeslotId: string; seatIds: string[] }) =>
      api.post<ISeat[]>(`/api/seats/${timeslotId}`, { seatIds }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seats.byTimeslot(variables.timeslotId) });
    },
  });
}

export function useReleaseSeats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ timeslotId, seatIds }: { timeslotId: string; seatIds: string[] }) =>
      api.del(`/api/seats/${timeslotId}`, { seatIds }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.seats.byTimeslot(variables.timeslotId) });
    },
  });
}
