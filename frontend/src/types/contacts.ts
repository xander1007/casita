export type ContactType = "client" | "supplier" | "both";

export interface Contact {
  id: number;
  type: ContactType;
  identity_document_type: string;
  document_number: string;
  name_or_business_name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
}

export const DOCUMENT_TYPES = [
  { value: "1", label: "DNI" },
  { value: "6", label: "RUC" },
  { value: "4", label: "Carné de Extranjería" },
  { value: "7", label: "Pasaporte" },
  { value: "0", label: "Varios" },
] as const;

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  client: "Cliente",
  supplier: "Proveedor",
  both: "Cliente y Proveedor",
};
