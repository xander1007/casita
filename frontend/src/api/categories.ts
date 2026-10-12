import api from "./axios";
import type { Category } from "../types/inventory";

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<{ data: Category[] }>("/inventory/categories");
  return data.data;
}

export async function createCategory(payload: {
  name: string;
  description?: string;
}): Promise<Category> {
  const { data } = await api.post<{ category: Category }>("/inventory/categories", payload);
  return data.category;
}

export async function updateCategory(
  id: number,
  payload: { name: string; description?: string; is_active?: boolean },
): Promise<Category> {
  const { data } = await api.put<{ category: Category }>(`/inventory/categories/${id}`, payload);
  return data.category;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/inventory/categories/${id}`);
}
