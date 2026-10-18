import api from "./axios";
import type { PaginatedResponse } from "../types/common";
import type { Category, Product, ProductSerial } from "../types/inventory";
import type { DocumentType, PaymentMethod, Sale, SalePrintPayload } from "../types/sales";
import type { Contact } from "../types/contacts";

export async function fetchPosCategories(): Promise<Category[]> {
  const { data } = await api.get<{ data: Category[] }>("/pos/categories");
  return data.data;
}

export async function fetchPosProducts(filters: {
  search?: string;
  category_id?: number;
  warehouse_id: number;
  page?: number;
}): Promise<PaginatedResponse<Product>> {
  const params: Record<string, string | number> = { warehouse_id: filters.warehouse_id };
  if (filters.search) params.search = filters.search;
  if (filters.category_id) params.category_id = filters.category_id;
  if (filters.page) params.page = filters.page;

  const { data } = await api.get<PaginatedResponse<Product>>("/pos/products", { params });
  return data;
}

export async function fetchPosProductSerials(
  productId: number,
  warehouseId: number,
): Promise<ProductSerial[]> {
  const { data } = await api.get<{ data: ProductSerial[] }>(`/pos/products/${productId}/serials`, {
    params: { warehouse_id: warehouseId, status: "available" },
  });
  return data.data;
}

export async function searchPosContacts(search: string): Promise<Contact[]> {
  const { data } = await api.get<{ data: Contact[] }>("/pos/contacts", {
    params: { search, per_page: 10 },
  });
  return data.data;
}

export interface PosContactPayload {
  type: "client";
  identity_document_type: string;
  document_number: string;
  name_or_business_name: string;
  address?: string | null;
  phone?: string | null;
}

export async function createPosContact(payload: PosContactPayload): Promise<Contact> {
  const { data } = await api.post<{ contact: Contact }>("/pos/contacts", payload);
  return data.contact;
}

export interface SaleItemPayload {
  product_id: number;
  product_serial_id?: number | null;
  quantity: number;
  unit_price: number;
}

export interface SalePaymentPayload {
  payment_method: PaymentMethod;
  amount: number;
  reference_number?: string | null;
}

export interface StoreSalePayload {
  contact_id: number | null;
  document_type: DocumentType;
  items: SaleItemPayload[];
  payments: SalePaymentPayload[];
  /** Source document being invoiced (at most one). */
  quotation_id?: number | null;
  sales_order_id?: number | null;
}

/** Cart contents of a quotation or sales order to be invoiced in the POS. */
export interface PosSourcePayload {
  contact: Contact;
  items: { product: Product; quantity: number; unit_price: number }[];
}

export async function fetchPosQuotation(
  id: number,
  warehouseId: number,
): Promise<PosSourcePayload & { quotation: { id: number; code: string } }> {
  const { data } = await api.get(`/pos/quotations/${id}`, { params: { warehouse_id: warehouseId } });
  return data;
}

export async function fetchPosSalesOrder(
  id: number,
): Promise<PosSourcePayload & { sales_order: { id: number; code: string; warehouse_id: number } }> {
  const { data } = await api.get(`/pos/sales-orders/${id}`);
  return data;
}

export async function createSale(
  payload: StoreSalePayload,
): Promise<{ sale: Sale; change: number }> {
  const { data } = await api.post<{ sale: Sale; change: number }>("/pos/sales", payload);
  return data;
}

export async function fetchSalePrintPayload(saleId: number): Promise<SalePrintPayload> {
  const { data } = await api.get<SalePrintPayload>(`/pos/sales/${saleId}/print`);
  return data;
}
