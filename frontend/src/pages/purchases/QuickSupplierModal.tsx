import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { Modal } from "../../components/Modal";
import { createPurchaseSupplier } from "../../api/purchases";
import { DOCUMENT_TYPES } from "../../types/contacts";
import type { Contact } from "../../types/contacts";

interface QuickSupplierModalProps {
  onClose: () => void;
  onCreated: (contact: Contact) => void;
}

export function QuickSupplierModal({ onClose, onCreated }: QuickSupplierModalProps) {
  const [documentType, setDocumentType] = useState("6");
  const [documentNumber, setDocumentNumber] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      const contact = await createPurchaseSupplier({
        type: "supplier",
        identity_document_type: documentType,
        document_number: documentNumber,
        name_or_business_name: name,
        address: address || null,
        phone: phone || null,
      });
      onCreated(contact);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors ?? {});
      } else {
        setFormError("No se pudo crear el proveedor. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Nuevo proveedor" onClose={onClose}>
      {formError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de documento</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {DOCUMENT_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">N° de documento (RUC/DNI)</label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.document_number && (
              <p className="mt-1 text-sm text-red-600">{errors.document_number[0]}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Razón social / Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {errors.name_or_business_name && (
            <p className="mt-1 text-sm text-red-600">{errors.name_or_business_name[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Dirección (opcional)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono (opcional)</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Guardando..." : "Guardar y seleccionar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
