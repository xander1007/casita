import type { Contact } from "./contacts";
import type { Warehouse } from "./inventory";

export const PURCHASE_DOCUMENT_TYPES = [
  { value: "factura", label: "Factura" },
  { value: "boleta", label: "Boleta" },
] as const;

export type PurchaseDocumentType = "factura" | "boleta";

export const PURCHASE_DOCUMENT_TYPE_LABELS: Record<PurchaseDocumentType, string> = {
  factura: "Factura",
  boleta: "Boleta",
};

export type PurchaseStatus = "completed" | "annulled";

export interface PurchaseSerial {
  id: number;
  serial_number: string;
  status: "available" | "sold" | "reserved" | "defective";
  notes: string | null;
  created_at: string;
}

export interface PurchaseDetail {
  id: number;
  product_id: number;
  product_name?: string;
  requires_serial?: boolean;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  serials: PurchaseSerial[];
}

export interface Purchase {
  id: number;
  document_type: PurchaseDocumentType;
  document_number: string;
  purchase_date: string;
  subtotal: number;
  igv: number;
  total: number;
  status: PurchaseStatus;
  annulled_at: string | null;
  annulment_reason: string | null;
  supplier: Contact | null;
  warehouse: Warehouse | null;
  user?: string;
  created_at: string;
  details: PurchaseDetail[];
}
