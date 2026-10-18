import type { Contact } from "./contacts";
import type { Product, Warehouse } from "./inventory";

export type SalesOrderStatus = "pending" | "ready" | "completed" | "cancelled";

export const SALES_ORDER_STATUS_LABELS: Record<SalesOrderStatus, string> = {
  pending: "Esperando compra",
  ready: "Listo para facturar",
  completed: "Facturado",
  cancelled: "Cancelado",
};

export const SALES_ORDER_STATUS_STYLES: Record<SalesOrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  completed: "bg-indigo-100 text-indigo-700",
  cancelled: "bg-red-100 text-red-700",
};

export interface SalesOrderItem {
  id: number;
  product_id: number;
  product: Product | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  igv: number;
  total: number;
  /** Taken from existing stock when the order was registered. */
  reserved_quantity: number;
  /** Had no stock: bought for this order ("a demanda"). */
  on_demand_quantity: number;
  received_quantity: number;
  pending_quantity: number;
  is_on_demand: boolean;
  purchases: { purchase_id: number; document_number: string; supplier: string | null; quantity: number }[];
}

export interface SalesOrder {
  id: number;
  code: string;
  order_date: string;
  expected_date: string | null;
  op_taxed: number;
  op_exonerated: number;
  igv: number;
  total: number;
  status: SalesOrderStatus;
  notes: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  has_on_demand?: boolean;
  contact: Contact | null;
  warehouse: Warehouse | null;
  user?: string;
  quotation?: { id: number; code: string } | null;
  sale?: { id: number; document_number: string } | null;
  created_at: string;
  items?: SalesOrderItem[];
}

export interface PurchaseSuggestion {
  sales_order_item_id: number;
  sales_order_id: number;
  order_code: string;
  expected_date: string | null;
  customer: string | null;
  warehouse_id: number;
  warehouse: string | null;
  product_id: number;
  product_name: string;
  internal_code: string;
  requires_serial: boolean;
  purchase_price: number;
  quantity_to_buy: number;
  suggested_supplier: { id: number; name: string; document_number: string } | null;
}
