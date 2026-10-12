import type { Contact } from "./contacts";

export const DEVICE_TYPES = [
  { value: "laptop", label: "Laptop" },
  { value: "desktop", label: "PC Escritorio" },
  { value: "printer", label: "Impresora" },
  { value: "monitor", label: "Monitor" },
  { value: "other", label: "Otro" },
] as const;

export type DeviceType = "laptop" | "desktop" | "printer" | "monitor" | "other";

export type ServiceStatus = "received" | "diagnosing" | "repaired" | "delivered" | "cancelled";

export const SERVICE_STATUSES: { value: ServiceStatus; label: string }[] = [
  { value: "received", label: "Recibido" },
  { value: "diagnosing", label: "En Diagnóstico" },
  { value: "repaired", label: "Reparado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
];

export interface Technician {
  id: number;
  name: string;
}

export interface TechnicalServiceItem {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface TechnicalService {
  id: number;
  code: string;
  customer: Contact | null;
  technician: Technician | null;
  device_type: DeviceType;
  device_type_label: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  device_password: string | null;
  accessories: string | null;
  reported_issue: string;
  diagnosis: string | null;
  status: ServiceStatus;
  status_label: string;
  estimated_cost: number;
  final_cost: number | null;
  sale_id: number | null;
  received_at: string;
  delivered_at: string | null;
  items: TechnicalServiceItem[];
  items_total?: number;
  created_at: string;
}

export interface ServicePrintPayload {
  company: {
    ruc: string | null;
    legal_name: string;
    address: string | null;
    phones: string[] | null;
    emails: string[] | null;
    slogan: string | null;
  } | null;
  service: TechnicalService;
}
