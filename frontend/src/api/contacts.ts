import api from "./axios";
import type { PaginatedResponse } from "../types/common";
import type { Contact, ContactType } from "../types/contacts";

export interface ContactFilters {
  search?: string;
  type?: "client" | "supplier";
  status?: "true" | "false";
  page?: number;
}

export interface ContactPayload {
  type: ContactType;
  identity_document_type: string;
  document_number: string;
  name_or_business_name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active?: boolean;
}

export async function fetchContacts(filters: ContactFilters): Promise<PaginatedResponse<Contact>> {
  const params: Record<string, string | number> = {};
  if (filters.search) params.search = filters.search;
  if (filters.type) params.type = filters.type;
  if (filters.status) params.status = filters.status;
  if (filters.page) params.page = filters.page;

  const { data } = await api.get<PaginatedResponse<Contact>>("/contacts", { params });
  return data;
}

export async function createContact(payload: ContactPayload): Promise<Contact> {
  const { data } = await api.post<{ contact: Contact }>("/contacts", payload);
  return data.contact;
}

export async function updateContact(id: number, payload: ContactPayload): Promise<Contact> {
  const { data } = await api.put<{ contact: Contact }>(`/contacts/${id}`, payload);
  return data.contact;
}

export async function updateContactStatus(id: number, isActive: boolean): Promise<Contact> {
  const { data } = await api.patch<{ contact: Contact }>(`/contacts/${id}/status`, {
    is_active: isActive,
  });
  return data.contact;
}

export async function deleteContact(id: number): Promise<void> {
  await api.delete(`/contacts/${id}`);
}
