export interface CashRegister {
  id: number;
  name: string;
  code: string;
  warehouse_id: number | null;
  warehouse?: { id: number; name: string; code: string } | null;
  is_active: boolean;
}

export type ShiftStatus = "open" | "closed";

export interface CashShift {
  id: number;
  status: ShiftStatus;
  opening_balance: number;
  closing_balance: number | null;
  expected_balance: number | null;
  difference: number | null;
  total_cash_sales: number;
  total_card_sales: number;
  total_transfer_sales: number;
  total_yape_plin_sales: number;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  cash_register: CashRegister | null;
  user?: string;
}

export const DOCUMENT_SERIES_TYPES = [
  { value: "01", label: "01 - Factura" },
  { value: "03", label: "03 - Boleta" },
  { value: "NV", label: "NV - Nota de Venta" },
] as const;

export interface DocumentSeries {
  id: number;
  document_type: string;
  series: string;
  current_correlative: number;
  is_active: boolean;
  cash_register: CashRegister | null;
}
