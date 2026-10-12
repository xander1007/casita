import api from "./axios";
import type { Brand } from "../types/inventory";

export async function fetchBrands(): Promise<Brand[]> {
  const { data } = await api.get<{ data: Brand[] }>("/inventory/brands");
  return data.data;
}

export async function createBrand(name: string): Promise<Brand> {
  const { data } = await api.post<{ brand: Brand }>("/inventory/brands", { name });
  return data.brand;
}

export async function updateBrand(
  id: number,
  payload: { name: string; is_active?: boolean },
): Promise<Brand> {
  const { data } = await api.put<{ brand: Brand }>(`/inventory/brands/${id}`, payload);
  return data.brand;
}

export async function deleteBrand(id: number): Promise<void> {
  await api.delete(`/inventory/brands/${id}`);
}
