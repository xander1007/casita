import api from "./axios";
import type { Role } from "../types/rbac";

export async function fetchRoles(): Promise<Role[]> {
  const { data } = await api.get<{ data: Role[] }>("/admin/roles");
  return data.data;
}

export async function createRole(name: string, permissions: string[]): Promise<Role> {
  const { data } = await api.post<{ role: Role }>("/admin/roles", { name, permissions });
  return data.role;
}

export async function updateRole(id: number, name: string): Promise<Role> {
  const { data } = await api.put<{ role: Role }>(`/admin/roles/${id}`, { name });
  return data.role;
}

export async function syncRolePermissions(id: number, permissions: string[]): Promise<Role> {
  const { data } = await api.put<{ role: Role }>(`/admin/roles/${id}/permissions`, {
    permissions,
  });
  return data.role;
}

export async function deleteRole(id: number): Promise<void> {
  await api.delete(`/admin/roles/${id}`);
}
