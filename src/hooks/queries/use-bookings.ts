"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { IBooking } from "@/types";

// LIFF
export function useMyBookings() {
  return useQuery({
    queryKey: queryKeys.bookings.all,
    queryFn: () => api.get<IBooking[]>("/api/liff/bookings"),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => api.get<IBooking>(`/api/liff/bookings/${id}`),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idempotencyKey, ...body }: {
      routeId: string;
      timeslotId: string;
      seatIds: string[];
      passengerName: string;
      passengerPhone: string;
      pickupLocation: string;
      paymentMethod: string;
      sourceChannel?: string;
      idempotencyKey?: string;
    }) =>
      api.post<IBooking>(
        "/api/liff/bookings",
        body,
        idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      passengerName?: string;
      passengerPhone?: string;
      pickupLocation?: string;
    }) => api.put<IBooking>(`/api/liff/bookings/${id}`, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      timeslotId: string;
      seatIds: string[];
    }) => api.post<IBooking>(`/api/liff/bookings/${id}/reschedule`, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/liff/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
    },
  });
}

// Admin
interface AdminBookingsFilters {
  page?: number;
  limit?: number;
  status?: string;
  date?: string;
  all?: boolean;
}

interface PaginatedBookings {
  bookings: IBooking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useAdminBookings(filters?: AdminBookingsFilters) {
  const params = new URLSearchParams();
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.status) params.set("status", filters.status);
  if (filters?.date) params.set("date", filters.date);
  if (filters?.all) params.set("all", "true");

  return useQuery({
    queryKey: queryKeys.bookings.admin(filters),
    queryFn: () => api.get<PaginatedBookings>(`/api/admin/bookings?${params}`),
  });
}

export function useAdminBookingDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: () => api.get<IBooking>(`/api/admin/bookings/${id}`),
    enabled: !!id,
  });
}

export function useAdminCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/admin/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.admin() });
    },
  });
}
