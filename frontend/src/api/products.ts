import api from "./axios";
import type { PaginatedResponse } from "../types/common";
import type { Product, ProductSerial, ProductStockByWarehouse, StockMovement } from "../types/inventory";

export interface ProductFilters {
  search?: string;
  category_id?: number;
  brand_id?: number;
  status?: "true" | "false";
  page?: number;
}

export interface ProductPayload {
  category_id?: number | null;
  brand_id?: number | null;
  name: string;
  internal_code: string;
  barcode?: string | null;
  description?: string | null;
  purchase_price: number;
  sale_price: number;
  unit_of_measure: string;
  igv_affectation: string;
  min_stock: number;
  requires_serial: boolean;
  is_service: boolean;
  is_active?: boolean;
}

export async function fetchProducts(filters: ProductFilters): Promise<PaginatedResponse<Product>> {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.category_id) params.category_id = filters.category_id;
  if (filters.brand_id) params.brand_id = filters.brand_id;
  if (filters.status) params.status = filters.status;
  if (filters.page) params.page = filters.page;

  const { data } = await api.get<PaginatedResponse<Product>>("/inventory/products", { params });
  return data;
}

export async function fetchProduct(
  id: number,
): Promise<{ product: Product; stock_by_warehouse: ProductStockByWarehouse[] }> {
  const { data } = await api.get(`/inventory/products/${id}`);
  return data;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const { data } = await api.post<{ product: Product }>("/inventory/products", payload);
  return data.product;
}

export async function updateProduct(id: number, payload: ProductPayload): Promise<Product> {
  const { data } = await api.put<{ product: Product }>(`/inventory/products/${id}`, payload);
  return data.product;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/inventory/products/${id}`);
}

export async function fetchStockHistory(
  productId: number,
): Promise<PaginatedResponse<StockMovement>> {
  const { data } = await api.get<PaginatedResponse<StockMovement>>(
    `/inventory/products/${productId}/stock-history`,
  );
  return data;
}

export async function adjustStock(
  productId: number,
  payload: { warehouse_id: number; type: "in" | "out" | "adjustment"; quantity: number; reason?: string },
): Promise<StockMovement> {
  const { data } = await api.post<{ movement: StockMovement }>(
    `/inventory/products/${productId}/stock-movements`,
    payload,
  );
  return data.movement;
}

export async function fetchSerials(productId: number): Promise<ProductSerial[]> {
  const { data } = await api.get<{ data: ProductSerial[] }>(`/inventory/products/${productId}/serials`);
  return data.data;
}

export async function storeSerials(
  productId: number,
  payload: { warehouse_id?: number; serial_numbers: string[] },
): Promise<ProductSerial[]> {
  const { data } = await api.post<{ data: ProductSerial[] }>(
    `/inventory/products/${productId}/serials`,
    payload,
  );
  return data.data;
}

export async function deleteSerial(productId: number, serialId: number): Promise<void> {
  await api.delete(`/inventory/products/${productId}/serials/${serialId}`);
}
