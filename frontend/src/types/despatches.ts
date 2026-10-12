import type { Contact } from "./contacts";
import type { CompanyPrintInfo } from "./sales";

export const TRANSPORT_REASONS = [
  "Venta",
  "Traslado entre establecimientos de la misma empresa",
  "Traslado por emisor itinerante",
  "Otros",
] as const;

export type TransportReason = (typeof TRANSPORT_REASONS)[number];

export type DespatchStatus = "issued" | "annulled";

export interface DespatchDetail {
  id: number;
  product_id: number | null;
  code: string | null;
  description: string;
  quantity: number;
  unit_of_measure: string;
  weight: number | null;
}

export interface Despatch {
  id: number;
  series: string;
  number: number;
  document_number: string;
  contact: Contact | null;
  reference_sale: { id: number; document_number: string } | null;
  starting_address: string | null;
  arrival_address: string | null;
  transport_reason: string | null;
  gross_weight: number | null;
  package_count: number | null;
  vehicle_plate: string | null;
  vehicle_brand: string | null;
  driver_dni: string | null;
  driver_license: string | null;
  order_number: string | null;
  observations: string | null;
  status: DespatchStatus;
  emission_date: string | null;
  transport_start_date: string | null;
  delivery_date: string | null;
  user?: string;
  details: DespatchDetail[];
  created_at: string;
}

export interface DespatchPrintPayload {
  company: CompanyPrintInfo | null;
  despatch: Despatch;
}
