import api from "./axios";
import type { Permission } from "../types/rbac";

export async function fetchPermissions(): Promise<Permission[]> {
  const { data } = await api.get<{ data: Permission[] }>("/admin/permissions");
  return data.data;
}
