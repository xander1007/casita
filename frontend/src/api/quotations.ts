import api from "./axios";
import type { PaginatedResponse } from "../types/common";
import type { Quotation, QuotationPrintPayload } from "../types/quotations";
import type { SalesOrder } from "../types/salesOrders";

export interface QuotationFilters {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export async function fetchQuotations(filters: QuotationFilters): Promise<PaginatedResponse<Quotation>> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value) params[key] = value;
  }

  const { data } = await api.get<PaginatedResponse<Quotation>>("/quotations", { params });
  return data;
}

export async function fetchQuotation(id: number): Promise<Quotation> {
  const { data } = await api.get<{ quotation: Quotation }>(`/quotations/${id}`);
  return data.quotation;
}

export interface QuotationPayload {
  contact_id: number;
  warehouse_id: number | null;
  issue_date: string;
  valid_until: string;
  notes: string | null;
  items: { product_id: number; quantity: number; unit_price: number }[];
}

export async function createQuotation(payload: QuotationPayload): Promise<Quotation> {
  const { data } = await api.post<{ quotation: Quotation }>("/quotations", payload);
  return data.quotation;
}

export async function updateQuotation(id: number, payload: QuotationPayload): Promise<Quotation> {
  const { data } = await api.put<{ quotation: Quotation }>(`/quotations/${id}`, payload);
  return data.quotation;
}

export async function approveQuotation(id: number): Promise<Quotation> {
  const { data } = await api.post<{ quotation: Quotation }>(`/quotations/${id}/approve`);
  return data.quotation;
}

export async function rejectQuotation(id: number): Promise<Quotation> {
  const { data } = await api.post<{ quotation: Quotation }>(`/quotations/${id}/reject`);
  return data.quotation;
}

export async function convertQuotationToOrder(
  id: number,
  payload: { warehouse_id: number; expected_date: string | null },
): Promise<SalesOrder> {
  const { data } = await api.post<{ sales_order: SalesOrder }>(`/quotations/${id}/convert-to-order`, payload);
  return data.sales_order;
}

export async function fetchQuotationPrintPayload(id: number): Promise<QuotationPrintPayload> {
  const { data } = await api.get<QuotationPrintPayload>(`/quotations/${id}/print`);
  return data;
}
