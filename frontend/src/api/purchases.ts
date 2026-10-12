import api from "./axios";
import type { PaginatedResponse } from "../types/common";
import type { Contact } from "../types/contacts";
import type { Product } from "../types/inventory";
import type { Warehouse } from "../types/inventory";
import type { Purchase, PurchaseDocumentType } from "../types/purchases";

export interface PurchaseFilters {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export async function fetchPurchases(filters: PurchaseFilters): Promise<PaginatedResponse<Purchase>> {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.page) params.page = filters.page;

  const { data } = await api.get<PaginatedResponse<Purchase>>("/purchases", { params });
  return data;
}

export async function fetchPurchase(id: number): Promise<Purchase> {
  const { data } = await api.get<{ purchase: Purchase }>(`/purchases/${id}`);
  return data.purchase;
}

export async function annulPurchase(id: number, reason: string): Promise<Purchase> {
  const { data } = await api.post<{ purchase: Purchase }>(`/purchases/${id}/annul`, { reason });
  return data.purchase;
}

export async function fetchPurchaseWarehouses(): Promise<Warehouse[]> {
  const { data } = await api.get<{ data: Warehouse[] }>("/purchases/lookups/warehouses");
  return data.data;
}

export async function searchPurchaseSuppliers(search: string): Promise<Contact[]> {
  const { data } = await api.get<{ data: Contact[] }>("/purchases/lookups/suppliers", {
    params: { search },
  });
  return data.data;
}

export interface PurchaseSupplierPayload {
  type: "supplier";
  identity_document_type: string;
  document_number: string;
  name_or_business_name: string;
  address?: string | null;
  phone?: string | null;
}

export async function createPurchaseSupplier(payload: PurchaseSupplierPayload): Promise<Contact> {
  const { data } = await api.post<{ contact: Contact }>("/purchases/lookups/suppliers", payload);
  return data.contact;
}

export async function searchPurchaseProducts(search: string): Promise<Product[]> {
  const { data } = await api.get<{ data: Product[] }>("/purchases/lookups/products", {
    params: { search },
  });
  return data.data;
}

export interface PurchaseItemPayload {
  product_id: number;
  quantity: number;
  unit_cost: number;
  serial_numbers?: string[];
}

export interface StorePurchasePayload {
  supplier_id: number;
  warehouse_id: number;
  document_type: PurchaseDocumentType;
  document_number: string;
  purchase_date: string;
  items: PurchaseItemPayload[];
}

export async function createPurchase(payload: StorePurchasePayload): Promise<Purchase> {
  const { data } = await api.post<{ purchase: Purchase }>("/purchases", payload);
  return data.purchase;
}
