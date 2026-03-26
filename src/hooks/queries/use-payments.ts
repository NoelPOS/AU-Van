"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { IPayment } from "@/types";

// LIFF
export function useMyPayments() {
  return useQuery({
    queryKey: queryKeys.payments.mine,
    queryFn: () => api.get<IPayment[]>("/api/payments"),
  });
}

export function useSubmitPaymentProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      formData,
    }: {
      bookingId: string;
      formData: FormData;
    }) => api.upload<IPayment>(`/api/liff/bookings/${bookingId}/payment-proof`, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(variables.bookingId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.mine });
    },
  });
}

// Admin
interface AdminPaymentsFilters {
  status?: string;
  page?: number;
  limit?: number;
}

interface PaginatedPayments {
  payments: IPayment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useAdminPayments(filters?: AdminPaymentsFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));

  return useQuery({
    queryKey: queryKeys.payments.admin(filters),
    queryFn: () => api.get<PaginatedPayments>(`/api/admin/payments?${params}`),
  });
}

export function useReviewPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      status: string;
      transactionId?: string;
      reviewNote?: string;
    }) => api.put<IPayment>(`/api/admin/payments/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.admin() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.admin() });
    },
  });
}
