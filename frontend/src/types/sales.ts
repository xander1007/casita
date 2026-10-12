import type { Contact } from "./contacts";

export const DOCUMENT_TYPES = [
  { value: "03", label: "Boleta" },
  { value: "01", label: "Factura" },
  { value: "NV", label: "Nota de Venta" },
] as const;

export type DocumentType = "01" | "03" | "NV";

export const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "yape_plin", label: "Yape / Plin" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
] as const;

export type PaymentMethod = "cash" | "yape_plin" | "card" | "transfer";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  yape_plin: "Yape / Plin",
  card: "Tarjeta",
  transfer: "Transferencia",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  "01": "Factura",
  "03": "Boleta",
  NV: "Nota de Venta",
};

export const DOCUMENT_TYPE_PRINT_TITLES: Record<DocumentType, string> = {
  "01": "FACTURA ELECTRÓNICA",
  "03": "BOLETA DE VENTA ELECTRÓNICA",
  NV: "NOTA DE VENTA",
};

export interface SaleDetail {
  id: number;
  product_id: number;
  product_name?: string;
  product_serial?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  igv: number;
  total: number;
}

export interface SalePayment {
  id: number;
  payment_method: PaymentMethod;
  amount: number;
  reference_number: string | null;
}

export type SaleStatus = "completed" | "annulled";

export type PaymentCondition = "CONTADO" | "CRÉDITO";

export interface Sale {
  id: number;
  document_type: DocumentType;
  series: string;
  number: number;
  document_number: string;
  op_taxed: number;
  op_exonerated: number;
  igv: number;
  total: number;
  amount_in_words: string | null;
  payment_status: "paid" | "pending";
  payment_condition: PaymentCondition;
  status: SaleStatus;
  annulled_at: string | null;
  annulment_reason: string | null;
  contact: Contact | null;
  user?: string;
  created_at: string;
  details: SaleDetail[];
  payments: SalePayment[];
}

export interface CompanyPrintInfo {
  ruc: string | null;
  legal_name: string;
  address: string | null;
  phones: string[] | null;
  emails: string[] | null;
  slogan: string | null;
}

export interface SalePrintPayload {
  company: CompanyPrintInfo | null;
  sale: Sale;
}
