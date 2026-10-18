import type { Contact } from "./contacts";
import type { Warehouse } from "./inventory";

export type GovernmentOrderStatus = "pending" | "delivered" | "annulled";

export const GOVERNMENT_ORDER_STATUS_LABELS: Record<GovernmentOrderStatus, string> = {
  pending: "Pendiente",
  delivered: "Entregada",
  annulled: "Anulada",
};

export const GOVERNMENT_ORDER_STATUS_STYLES: Record<GovernmentOrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  annulled: "bg-red-100 text-red-700",
};

export interface GovernmentOrderItem {
  id: number;
  product_id: number;
  product_name: string | null;
  internal_code: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface GovernmentOrder {
  id: number;
  order_number: string;
  siaf_number: string | null;
  issue_date: string;
  delivery_deadline: string | null;
  total: number;
  status: GovernmentOrderStatus;
  notes: string | null;
  annulled_at: string | null;
  annulment_reason: string | null;
  contact: Contact | null;
  warehouse: Warehouse | null;
  user?: string;
  created_at: string;
  items?: GovernmentOrderItem[];
}

export type StockLineStatus = "complete" | "partial" | "missing" | "service";

export const STOCK_LINE_STATUS_LABELS: Record<StockLineStatus, string> = {
  complete: "Stock completo",
  partial: "Stock parcial",
  missing: "Sin stock",
  service: "Servicio",
};

export const STOCK_LINE_STATUS_STYLES: Record<StockLineStatus, string> = {
  complete: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  missing: "bg-red-100 text-red-700",
  service: "bg-slate-100 text-slate-600",
};

export interface StockReportLine {
  product_id: number;
  internal_code: string;
  product_name: string;
  unit_of_measure: string;
  is_service: boolean;
  required: number;
  available: number | null;
  covered: number;
  to_buy: number;
  unit_cost: number;
  estimated_cost: number;
  status: StockLineStatus;
  stock_by_warehouse: { warehouse_id: number; warehouse: string | null; quantity: number }[];
}

export interface StockReport {
  warehouse: { id: number; name: string } | null;
  generated_at: string;
  lines: StockReportLine[];
  summary: {
    total_lines: number;
    complete_lines: number;
    lines_to_buy: number;
    units_required: number;
    units_covered: number;
    units_to_buy: number;
    estimated_purchase_cost: number;
    can_fulfill: boolean;
  };
}
