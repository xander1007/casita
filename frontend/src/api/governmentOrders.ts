import api from "./axios";
import type { PaginatedResponse } from "../types/common";
import type { Contact } from "../types/contacts";
import type { Product, Warehouse } from "../types/inventory";
import type { GovernmentOrder, StockReport } from "../types/governmentOrders";

export interface GovernmentOrderFilters {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export async function fetchGovernmentOrders(
  filters: GovernmentOrderFilters,
): Promise<PaginatedResponse<GovernmentOrder>> {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.page) params.page = filters.page;

  const { data } = await api.get<PaginatedResponse<GovernmentOrder>>("/government-orders", { params });
  return data;
}

export interface GovernmentOrderWithReport {
  order: GovernmentOrder;
  stock_report: StockReport;
}

export async function fetchGovernmentOrder(id: number): Promise<GovernmentOrderWithReport> {
  const { data } = await api.get<GovernmentOrderWithReport>(`/government-orders/${id}`);
  return data;
}

export async function fetchGovernmentOrderStockReport(id: number): Promise<StockReport> {
  const { data } = await api.get<{ stock_report: StockReport }>(`/government-orders/${id}/stock-report`);
  return data.stock_report;
}

export async function markGovernmentOrderDelivered(id: number): Promise<GovernmentOrder> {
  const { data } = await api.post<{ order: GovernmentOrder }>(`/government-orders/${id}/deliver`);
  return data.order;
}

export async function annulGovernmentOrder(id: number, reason: string): Promise<GovernmentOrder> {
  const { data } = await api.post<{ order: GovernmentOrder }>(`/government-orders/${id}/annul`, { reason });
  return data.order;
}

export async function fetchGovernmentOrderWarehouses(): Promise<Warehouse[]> {
  const { data } = await api.get<{ data: Warehouse[] }>("/government-orders/lookups/warehouses");
  return data.data;
}

export async function searchGovernmentEntities(search: string): Promise<Contact[]> {
  const { data } = await api.get<{ data: Contact[] }>("/government-orders/lookups/entities", {
    params: { search },
  });
  return data.data;
}

export async function searchGovernmentOrderProducts(search: string): Promise<Product[]> {
  const { data } = await api.get<{ data: Product[] }>("/government-orders/lookups/products", {
    params: { search },
  });
  return data.data;
}

export interface StoreGovernmentOrderPayload {
  contact_id: number;
  warehouse_id: number | null;
  order_number: string;
  siaf_number: string | null;
  issue_date: string;
  delivery_deadline: string | null;
  notes: string | null;
  items: { product_id: number; quantity: number; unit_price: number }[];
}

export async function createGovernmentOrder(payload: StoreGovernmentOrderPayload): Promise<GovernmentOrderWithReport> {
  const { data } = await api.post<GovernmentOrderWithReport>("/government-orders", payload);
  return data;
}
