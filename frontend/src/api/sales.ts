import api from "./axios";
import type { PaginatedResponse } from "../types/common";
import type { Sale, SalePrintPayload } from "../types/sales";

export interface SaleFilters {
  search?: string;
  document_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export async function fetchSales(filters: SaleFilters): Promise<PaginatedResponse<Sale>> {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.document_type) params.document_type = filters.document_type;
  if (filters.status) params.status = filters.status;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.page) params.page = filters.page;

  const { data } = await api.get<PaginatedResponse<Sale>>("/sales", { params });
  return data;
}

export async function fetchSale(id: number): Promise<Sale> {
  const { data } = await api.get<{ sale: Sale }>(`/sales/${id}`);
  return data.sale;
}

export async function annulSale(id: number, reason: string): Promise<Sale> {
  const { data } = await api.post<{ sale: Sale }>(`/sales/${id}/annul`, { reason });
  return data.sale;
}

export async function fetchSalePrintPayload(saleId: number): Promise<SalePrintPayload> {
  const { data } = await api.get<SalePrintPayload>(`/sales/${saleId}/print`);
  return data;
}
