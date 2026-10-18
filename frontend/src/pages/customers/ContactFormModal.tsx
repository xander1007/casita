import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { Modal } from "../../components/Modal";
import { createContact, updateContact } from "../../api/contacts";
import { DOCUMENT_TYPES } from "../../types/contacts";
import type { Contact, ContactType } from "../../types/contacts";

interface ContactFormModalProps {
  contact: Contact | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ContactFormModal({ contact, onClose, onSaved }: ContactFormModalProps) {
  const isEditing = contact !== null;

  const [type, setType] = useState<ContactType>(contact?.type ?? "client");
  const [documentType, setDocumentType] = useState(contact?.identity_document_type ?? "1");
  const [documentNumber, setDocumentNumber] = useState(contact?.document_number ?? "");
  const [name, setName] = useState(contact?.name_or_business_name ?? "");
  const [address, setAddress] = useState(contact?.address ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [isActive, setIsActive] = useState(contact?.is_active ?? true);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      type,
      identity_document_type: documentType,
      document_number: documentNumber,
      name_or_business_name: name,
      address: address || null,
      email: email || null,
      phone: phone || null,
      is_active: isActive,
    };

    try {
      if (isEditing) {
        await updateContact(contact.id, payload);
      } else {
        await createContact(payload);
      }
      onSaved();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors ?? {});
      } else {
        setFormError("No se pudo guardar el contacto. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Editar contacto" : "Nuevo contacto"} onClose={onClose}>
      {formError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Tipo de contacto</span>
          <div className="flex gap-2">
            {(["client", "supplier", "both"] as ContactType[]).map((option) => (
              <label
                key={option}
                className={`flex-1 cursor-pointer rounded-md border px-3 py-2 text-center text-sm ${
                  type === option
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={option}
                  checked={type === option}
                  onChange={() => setType(option)}
                  className="sr-only"
                />
                {option === "client" ? "Cliente" : option === "supplier" ? "Proveedor" : "Ambos"}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de documento</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="field w-full"
            >
              {DOCUMENT_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Número de documento</label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              required
              className="field w-full"
            />
            {errors.document_number && (
              <p className="mt-1 text-sm text-red-600">{errors.document_number[0]}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Nombre completo / Razón social
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="field w-full"
          />
          {errors.name_or_business_name && (
            <p className="mt-1 text-sm text-red-600">{errors.name_or_business_name[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Dirección</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="field w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field w-full"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="field w-full"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-slate-300"
          />
          Activo
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
