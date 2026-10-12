import api from "./axios";
import type { PaginatedResponse } from "../types/common";
import type { Product } from "../types/inventory";
import type { Contact } from "../types/contacts";
import type { DeviceType, ServicePrintPayload, ServiceStatus, Technician, TechnicalService } from "../types/services";

export interface ServiceFilters {
  search?: string;
  status?: ServiceStatus | "";
  page?: number;
  per_page?: number;
}

export async function fetchServices(filters: ServiceFilters): Promise<PaginatedResponse<TechnicalService>> {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.page) params.page = filters.page;
  if (filters.per_page) params.per_page = filters.per_page;

  const { data } = await api.get<PaginatedResponse<TechnicalService>>("/services", { params });
  return data;
}

export async function fetchService(id: number): Promise<TechnicalService> {
  const { data } = await api.get<{ service: TechnicalService }>(`/services/${id}`);
  return data.service;
}

export async function fetchTechnicians(): Promise<Technician[]> {
  const { data } = await api.get<{ data: Technician[] }>("/services/technicians");
  return data.data;
}

export async function searchServiceCustomers(search: string): Promise<Contact[]> {
  const { data } = await api.get<{ data: Contact[] }>("/services/customers", { params: { search } });
  return data.data;
}

export async function fetchServiceParts(search: string): Promise<Product[]> {
  const { data } = await api.get<PaginatedResponse<Product>>("/services/parts", { params: { search } });
  return data.data;
}

export interface ReceptionPayload {
  customer_id?: number | null;
  customer_document_type?: string;
  customer_document_number?: string;
  customer_name?: string;
  customer_phone?: string | null;
  technician_id?: number | null;
  device_type: DeviceType;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  device_password?: string | null;
  accessories?: string | null;
  reported_issue: string;
  estimated_cost?: number;
}

export async function createService(payload: ReceptionPayload): Promise<TechnicalService> {
  const { data } = await api.post<{ service: TechnicalService }>("/services", payload);
  return data.service;
}

export interface UpdateServicePayload {
  technician_id?: number | null;
  device_type?: DeviceType;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  device_password?: string | null;
  accessories?: string | null;
  reported_issue?: string;
  diagnosis?: string | null;
  estimated_cost?: number;
  final_cost?: number | null;
  status?: ServiceStatus;
}

export async function updateService(id: number, payload: UpdateServicePayload): Promise<TechnicalService> {
  const { data } = await api.put<{ service: TechnicalService }>(`/services/${id}`, payload);
  return data.service;
}

export async function addServiceItem(
  serviceId: number,
  payload: { product_id: number; quantity: number },
): Promise<TechnicalService> {
  const { data } = await api.post<{ service: TechnicalService }>(`/services/${serviceId}/items`, payload);
  return data.service;
}

export async function removeServiceItem(serviceId: number, itemId: number): Promise<TechnicalService> {
  const { data } = await api.delete<{ service: TechnicalService }>(`/services/${serviceId}/items/${itemId}`);
  return data.service;
}

export async function fetchServiceReceipt(serviceId: number): Promise<ServicePrintPayload> {
  const { data } = await api.get<ServicePrintPayload>(`/services/${serviceId}/receipt`);
  return data;
}

export interface ServiceChargePayload {
  service: TechnicalService;
  product: Product;
  contact: Contact;
  amount: number;
}

export async function fetchServiceChargePayload(serviceId: number): Promise<ServiceChargePayload> {
  const { data } = await api.get<ServiceChargePayload>(`/services/${serviceId}/charge`);
  return data;
}

export async function deliverService(serviceId: number, saleId: number): Promise<TechnicalService> {
  const { data } = await api.post<{ service: TechnicalService }>(`/services/${serviceId}/deliver`, {
    sale_id: saleId,
  });
  return data.service;
}
