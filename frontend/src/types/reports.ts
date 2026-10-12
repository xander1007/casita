import type { Contact } from "./contacts";
import type { DocumentType, PaymentMethod } from "./sales";

export type ReportPeriod = "today" | "week" | "month" | "custom";

export interface ReportRangeFilters {
  period: ReportPeriod;
  date_from?: string;
  date_to?: string;
}

export interface ReportSummary {
  period: { from: string; to: string };
  total_sales: number;
  total_cost: number;
  net_profit: number;
  active_services: number;
  cash_balance: number;
}

export interface TopProduct {
  id: number;
  name: string;
  quantity_sold: number;
  total_sold: number;
}

export interface PaymentMethodTotal {
  payment_method: PaymentMethod;
  total: number;
}

export interface DocumentTypeTotal {
  document_type: DocumentType;
  count: number;
  total: number;
}

export interface PosMetrics {
  top_products: TopProduct[];
  payment_methods: PaymentMethodTotal[];
  document_types: DocumentTypeTotal[];
}

export interface DailySalesPoint {
  date: string;
  total: number;
}

export interface CriticalInventoryProduct {
  id: number;
  name: string;
  internal_code: string | null;
  min_stock: number;
  total_stock: number;
  is_low_stock: boolean;
}

export interface SalesRegistryRow {
  id: number;
  document_type: DocumentType;
  series: string;
  number: number;
  document_number: string;
  op_taxed: number;
  op_exonerated: number;
  igv: number;
  total: number;
  status: string;
  contact: Contact | null;
  created_at: string;
}

export type StockMovementType = "in" | "out" | "adjustment";

export interface KardexRow {
  id: number;
  date: string;
  product: string;
  warehouse: string;
  type: StockMovementType;
  quantity: number;
  unit_cost: number;
  value: number;
  reason: string | null;
}

export interface SunatPeriodFilters {
  year: number;
  month: number;
  date_from?: string;
  date_to?: string;
}

export interface RvieRow {
  periodo: string;
  car: string;
  fecha_emision: string;
  tipo_comprobante: string;
  serie: string;
  correlativo: string;
  tipo_doc_cliente: string;
  doc_cliente: string;
  razon_social: string;
  op_gravada: number;
  op_exonerada: number;
  igv: number;
  total: number;
}

export interface RiceRow {
  periodo: string;
  car: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  tipo_comprobante: string;
  serie: string;
  correlativo: string;
  tipo_doc_proveedor: string;
  doc_proveedor: string;
  razon_social: string;
  base_imponible: number;
  igv: number;
  importe_total: number;
}

export interface Kardex13Row {
  product_id: number;
  product: string;
  code: string | null;
  date: string;
  type: "in" | "out";
  reference: string;
  quantity: number;
  unit_cost: number;
  movement_value: number;
  balance_quantity: number;
  average_cost: number;
  balance_value: number;
}

export interface Inventory12Row {
  date: string;
  warehouse: string;
  product: string;
  code: string | null;
  unit: string;
  type: StockMovementType;
  quantity: number;
  balance_quantity: number;
  reference: string | null;
}
