import api from "./axios";
import type { PaginatedResponse } from "../types/common";
import type { Despatch, DespatchPrintPayload, TransportReason } from "../types/despatches";

export interface DespatchFilters {
  search?: string;
  page?: number;
  per_page?: number;
}

export async function fetchDespatches(filters: DespatchFilters): Promise<PaginatedResponse<Despatch>> {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;

  const { data } = await api.get<PaginatedResponse<Despatch>>("/despatches", { params });
  return data;
}

export async function fetchDespatch(id: number): Promise<Despatch> {
  const { data } = await api.get<{ despatch: Despatch }>(`/despatches/${id}`);
  return data.despatch;
}

export interface DespatchItemPayload {
  product_id?: number | null;
  code?: string | null;
  description: string;
  quantity: number;
  unit_of_measure: string;
  weight?: number | null;
}

export interface StoreDespatchPayload {
  contact_id: number;
  reference_sale_id?: number | null;
  starting_address: string;
  arrival_address: string;
  transport_reason: TransportReason;
  gross_weight?: number | null;
  package_count?: number | null;
  vehicle_plate?: string | null;
  vehicle_brand?: string | null;
  driver_dni?: string | null;
  driver_license?: string | null;
  order_number?: string | null;
  observations?: string | null;
  transport_start_date: string;
  delivery_date?: string | null;
  items: DespatchItemPayload[];
}

export async function createDespatch(payload: StoreDespatchPayload): Promise<Despatch> {
  const { data } = await api.post<{ despatch: Despatch }>("/despatches", payload);
  return data.despatch;
}

export async function fetchDespatchPrintPayload(id: number): Promise<DespatchPrintPayload> {
  const { data } = await api.get<DespatchPrintPayload>(`/despatches/${id}/print`);
  return data;
}
