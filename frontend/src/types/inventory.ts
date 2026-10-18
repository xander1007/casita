export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface Brand {
  id: number;
  name: string;
  is_active: boolean;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
}

export const UNITS_OF_MEASURE = [
  { value: "NIU", label: "NIU - Unidad" },
  { value: "ZZ", label: "ZZ - Servicio" },
  { value: "KGM", label: "KGM - Kilogramo" },
  { value: "LTR", label: "LTR - Litro" },
  { value: "MTR", label: "MTR - Metro" },
  { value: "PAQ", label: "PAQ - Paquete" },
  { value: "BX", label: "BX - Caja" },
  { value: "GLL", label: "GLL - Galón" },
] as const;

export const IGV_AFFECTATIONS = [
  { value: "10", label: "10 - Gravado - Operación Onerosa" },
  { value: "20", label: "20 - Exonerado - Operación Onerosa" },
  { value: "30", label: "30 - Inafecto - Operación Onerosa" },
  { value: "40", label: "40 - Exportación" },
] as const;

export interface Product {
  id: number;
  name: string;
  internal_code: string;
  barcode: string | null;
  description: string | null;
  purchase_price: number;
  sale_price: number;
  unit_of_measure: string;
  igv_affectation: string;
  min_stock: number;
  requires_serial: boolean;
  is_service: boolean;
  is_active: boolean;
  category: Category | null;
  brand: Brand | null;
  total_stock: number;
  /** Units held by sales orders; only filled by endpoints that load it. */
  reserved_stock: number;
  /** total_stock - reserved_stock: what can actually be sold or consumed. */
  available_stock: number;
  is_low_stock: boolean;
  serials_count?: number;
}

export interface ProductStockByWarehouse {
  warehouse_id: number;
  warehouse: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
}

export interface ProductSerial {
  id: number;
  serial_number: string;
  status: "available" | "sold" | "reserved" | "defective";
  notes: string | null;
  warehouse: Warehouse | null;
  created_at: string;
}

export interface StockMovement {
  id: number;
  type: "in" | "out" | "adjustment";
  quantity: number;
  reason: string | null;
  warehouse: Warehouse | null;
  user: string | null;
  created_at: string;
}
