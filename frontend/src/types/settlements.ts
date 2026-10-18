import type { Contact } from "./contacts";

export type SettlementDocumentType = "factura" | "nota_credito" | "letra";

export const SETTLEMENT_DOCUMENT_TYPE_LABELS: Record<SettlementDocumentType, string> = {
  factura: "Factura",
  nota_credito: "Nota de Crédito",
  letra: "Letra",
};

export type SettlementPaymentMethod = "transfer" | "deposit" | "check" | "cash" | "card" | "yape_plin";

export const SETTLEMENT_PAYMENT_METHOD_LABELS: Record<SettlementPaymentMethod, string> = {
  transfer: "Transferencia",
  deposit: "Depósito en cuenta",
  check: "Cheque",
  cash: "Efectivo",
  card: "Tarjeta",
  yape_plin: "Yape / Plin",
};

export type SettlementCurrency = "PEN" | "USD";

export const CURRENCY_SYMBOLS: Record<SettlementCurrency, string> = { PEN: "S/", USD: "US$" };

/** Suggestions only: the bank field accepts any name. */
export const COMMON_BANKS = [
  "BCP",
  "BBVA",
  "Interbank",
  "Scotiabank",
  "Banco de la Nación",
  "BanBif",
  "Banco Pichincha",
  "Caja Arequipa",
  "Caja Huancayo",
];

export interface PaymentSettlement {
  id: number;
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
  status: "registered" | "annulled";
  annulled_at: string | null;
  annulment_reason: string | null;
  contact: Contact | null;
  user?: string;
  created_at: string;
}
