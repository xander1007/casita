import api from "./axios";
import type { PaginatedResponse } from "../types/common";
import type { Contact } from "../types/contacts";
import type {
  PaymentSettlement,
  SettlementCurrency,
  SettlementDocumentType,
  SettlementPaymentMethod,
} from "../types/settlements";

export interface SettlementFilters {
  search?: string;
  document_type?: string;
  payment_method?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export async function fetchSettlements(filters: SettlementFilters): Promise<PaginatedResponse<PaymentSettlement>> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value) params[key] = value;
  }

  const { data } = await api.get<PaginatedResponse<PaymentSettlement>>("/settlements", { params });
  return data;
}

export interface StoreSettlementPayload {
  contact_id: number;
  document_type: SettlementDocumentType;
  document_number: string;
  currency: SettlementCurrency;
  amount: number;
  operation_number: string | null;
  payment_date: string;
  payment_method: SettlementPaymentMethod;
  bank: string;
  account: string;
  notes: string | null;
}

export async function createSettlement(payload: StoreSettlementPayload): Promise<PaymentSettlement> {
  const { data } = await api.post<{ settlement: PaymentSettlement }>("/settlements", payload);
  return data.settlement;
}

export async function annulSettlement(id: number, reason: string): Promise<PaymentSettlement> {
  const { data } = await api.post<{ settlement: PaymentSettlement }>(`/settlements/${id}/annul`, { reason });
  return data.settlement;
}

export async function searchSettlementContacts(search: string): Promise<Contact[]> {
  const { data } = await api.get<{ data: Contact[] }>("/settlements/lookups/contacts", { params: { search } });
  return data.data;
}
