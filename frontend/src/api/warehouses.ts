import api from "./axios";
import type { Warehouse } from "../types/inventory";

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const { data } = await api.get<{ data: Warehouse[] }>("/inventory/warehouses");
  return data.data;
}

export async function createWarehouse(payload: {
  name: string;
  code: string;
  address?: string;
}): Promise<Warehouse> {
  const { data } = await api.post<{ warehouse: Warehouse }>("/inventory/warehouses", payload);
  return data.warehouse;
}

export async function updateWarehouse(
  id: number,
  payload: { name: string; code: string; address?: string; is_active?: boolean },
): Promise<Warehouse> {
  const { data } = await api.put<{ warehouse: Warehouse }>(`/inventory/warehouses/${id}`, payload);
  return data.warehouse;
}

export async function deleteWarehouse(id: number): Promise<void> {
  await api.delete(`/inventory/warehouses/${id}`);
}
