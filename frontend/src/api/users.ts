import api from "./axios";
import type { User } from "../types/auth";
import type { PaginatedResponse } from "../types/common";

export interface UserFilters {
  search?: string;
  role?: string;
  status?: "true" | "false";
  page?: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  roles?: string[];
  is_active?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

export async function fetchUsers(filters: UserFilters): Promise<PaginatedResponse<User>> {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.role) params.role = filters.role;
  if (filters.status) params.status = filters.status;
  if (filters.page) params.page = filters.page;

  const { data } = await api.get<PaginatedResponse<User>>("/admin/users", { params });
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post<{ user: User }>("/admin/users", payload);
  return data.user;
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
  const { data } = await api.put<{ user: User }>(`/admin/users/${id}`, payload);
  return data.user;
}

export async function updateUserStatus(id: number, isActive: boolean): Promise<User> {
  const { data } = await api.patch<{ user: User }>(`/admin/users/${id}/status`, {
    is_active: isActive,
  });
  return data.user;
}

export async function syncUserRoles(id: number, roles: string[]): Promise<User> {
  const { data } = await api.put<{ user: User }>(`/admin/users/${id}/roles`, { roles });
  return data.user;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/admin/users/${id}`);
}
