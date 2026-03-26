"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { IUser } from "@/types";

// Current user
export function useMe() {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: () => api.get<IUser>("/api/users/me"),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; phone?: string } | { oldPassword: string; newPassword: string }) =>
      api.put<IUser>("/api/users/me", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
}

// Admin
interface PaginatedUsers {
  users: IUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useAdminUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.users.admin(page),
    queryFn: () => api.get<PaginatedUsers>(`/api/admin/users?page=${page}&limit=${limit}`),
  });
}

export function useToggleAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.put(`/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.admin() });
    },
  });
}
