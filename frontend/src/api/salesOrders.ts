import api from "./axios";
import type { PaginatedResponse } from "../types/common";
import type { Contact } from "../types/contacts";
import type { Product, Warehouse } from "../types/inventory";
import type { PurchaseSuggestion, SalesOrder } from "../types/salesOrders";

export interface SalesOrderFilters {
  search?: string;
  status?: string;
  on_demand?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export async function fetchSalesOrders(filters: SalesOrderFilters): Promise<PaginatedResponse<SalesOrder>> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value) params[key] = value;
  }

  const { data } = await api.get<PaginatedResponse<SalesOrder>>("/sales-orders", { params });
  return data;
}

export async function fetchSalesOrder(id: number): Promise<SalesOrder> {
  const { data } = await api.get<{ sales_order: SalesOrder }>(`/sales-orders/${id}`);
  return data.sales_order;
}

export interface StoreSalesOrderPayload {
  contact_id: number;
  warehouse_id: number;
  order_date: string;
  expected_date: string | null;
  notes: string | null;
  items: { product_id: number; quantity: number; unit_price: number }[];
}

export async function createSalesOrder(payload: StoreSalesOrderPayload): Promise<SalesOrder> {
  const { data } = await api.post<{ sales_order: SalesOrder }>("/sales-orders", payload);
  return data.sales_order;
}

export async function cancelSalesOrder(id: number, reason: string): Promise<SalesOrder> {
  const { data } = await api.post<{ sales_order: SalesOrder }>(`/sales-orders/${id}/cancel`, { reason });
  return data.sales_order;
}

export async function fetchPurchaseSuggestions(warehouseId?: number): Promise<PurchaseSuggestion[]> {
  const { data } = await api.get<{ data: PurchaseSuggestion[] }>("/sales-orders/purchase-suggestions", {
    params: warehouseId ? { warehouse_id: warehouseId } : {},
  });
  return data.data;
}

// Lookups shared by the quotation and sales order forms.

export async function fetchSalesWarehouses(): Promise<Warehouse[]> {
  const { data } = await api.get<{ data: Warehouse[] }>("/sales-lookups/warehouses");
  return data.data;
}

export async function searchSalesCustomers(search: string): Promise<Contact[]> {
  const { data } = await api.get<{ data: Contact[] }>("/sales-lookups/customers", { params: { search } });
  return data.data;
}

export async function searchSalesProducts(search: string, warehouseId?: number | null): Promise<Product[]> {
  const params: Record<string, string | number> = { search };
  if (warehouseId) params.warehouse_id = warehouseId;

  const { data } = await api.get<{ data: Product[] }>("/sales-lookups/products", { params });
  return data.data;
}
