import type { Contact } from "./contacts";
import type { Product, Warehouse } from "./inventory";

export type QuotationStatus = "draft" | "approved" | "rejected" | "converted";

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "Borrador",
  approved: "Aprobada",
  rejected: "Rechazada",
  converted: "Convertida",
};

export const QUOTATION_STATUS_STYLES: Record<QuotationStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  converted: "bg-indigo-100 text-indigo-700",
};

export interface QuotationItem {
  id: number;
  product_id: number;
  product: Product | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  igv: number;
  total: number;
}

export interface Quotation {
  id: number;
  code: string;
  issue_date: string;
  valid_until: string;
  is_expired: boolean;
  op_taxed: number;
  op_exonerated: number;
  igv: number;
  total: number;
  status: QuotationStatus;
  notes: string | null;
  converted_at: string | null;
  contact: Contact | null;
  warehouse?: Warehouse | null;
  user?: string;
  sale?: { id: number; document_number: string } | null;
  sales_order?: { id: number; code: string } | null;
  created_at: string;
  items?: QuotationItem[];
}

export interface QuotationPrintPayload {
  company: {
    ruc: string | null;
    legal_name: string;
    address: string | null;
    phones: string[] | null;
    emails: string[] | null;
    slogan: string | null;
  } | null;
  quotation: Quotation;
}
