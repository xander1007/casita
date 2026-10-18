import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { Modal } from "../../components/Modal";
import { createService, fetchTechnicians, searchServiceCustomers } from "../../api/services";
import { DEVICE_TYPES } from "../../types/services";
import type { DeviceType, Technician, TechnicalService } from "../../types/services";
import { DOCUMENT_TYPES } from "../../types/contacts";
import type { Contact } from "../../types/contacts";

interface ServiceReceptionModalProps {
  onClose: () => void;
  onCreated: (service: TechnicalService) => void;
}

export function ServiceReceptionModal({ onClose, onCreated }: ServiceReceptionModalProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [technicianId, setTechnicianId] = useState("");

  const [customer, setCustomer] = useState<Contact | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Contact[]>([]);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [newDocumentType, setNewDocumentType] = useState("1");
  const [newDocumentNumber, setNewDocumentNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [deviceType, setDeviceType] = useState<DeviceType>("laptop");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [devicePassword, setDevicePassword] = useState("");
  const [accessories, setAccessories] = useState("");
  const [reportedIssue, setReportedIssue] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTechnicians().then(setTechnicians);
  }, []);

  useEffect(() => {
    if (customerSearch.trim().length < 2) {
      setCustomerResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      searchServiceCustomers(customerSearch.trim()).then((results) => {
        if (!cancelled) setCustomerResults(results);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [customerSearch]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    if (!customer && !creatingCustomer) {
      setFormError("Selecciona un cliente o crea uno nuevo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const service = await createService({
        customer_id: customer?.id ?? undefined,
        customer_document_type: customer ? undefined : newDocumentType,
        customer_document_number: customer ? undefined : newDocumentNumber,
        customer_name: customer ? undefined : newName,
        customer_phone: customer ? undefined : newPhone || null,
        technician_id: technicianId ? Number(technicianId) : null,
        device_type: deviceType,
        brand: brand || null,
        model: model || null,
        serial_number: serialNumber || null,
        device_password: devicePassword || null,
        accessories: accessories || null,
        reported_issue: reportedIssue,
        estimated_cost: estimatedCost ? Number(estimatedCost) : undefined,
      });
      onCreated(service);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const responseErrors = error.response.data.errors ?? {};
        setErrors(responseErrors);
        setFormError(Object.values(responseErrors).flat().join(" ") || "No se pudo registrar la orden.");
      } else {
        setFormError("No se pudo registrar la orden. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Nueva recepción de equipo" onClose={onClose} maxWidth="max-w-2xl">
      {formError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Cliente</span>
          {customer ? (
            <div className="field flex items-center justify-between">
              <span>
                {customer.name_or_business_name}{" "}
                <span className="text-xs text-slate-400">({customer.document_number})</span>
              </span>
              <button
                type="button"
                onClick={() => setCustomer(null)}
                className="text-xs text-indigo-600 hover:underline"
              >
                Cambiar
              </button>
            </div>
          ) : creatingCustomer ? (
            <div className="space-y-2 rounded-md border border-slate-200 p-3">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newDocumentType}
                  onChange={(e) => setNewDocumentType(e.target.value)}
                  className="field"
                >
                  {DOCUMENT_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newDocumentNumber}
                  onChange={(e) => setNewDocumentNumber(e.target.value)}
                  placeholder="N° de documento"
                  required
                  className="field"
                />
              </div>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre completo / Razón social"
                required
                className="field w-full"
              />
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Teléfono (opcional)"
                className="field w-full"
              />
              <button
                type="button"
                onClick={() => setCreatingCustomer(false)}
                className="text-xs text-slate-500 hover:underline"
              >
                Cancelar y buscar cliente existente
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  type="search"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Buscar por nombre o DNI/RUC..."
                  className="field flex-1"
                />
                <button
                  type="button"
                  onClick={() => setCreatingCustomer(true)}
                  className="btn btn-secondary"
                >
                  + Nuevo
                </button>
              </div>
              {customerResults.length > 0 && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded-md border border-slate-200">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCustomer(c);
                        setCustomerSearch("");
                        setCustomerResults([]);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-indigo-50"
                    >
                      {c.name_or_business_name} <span className="text-xs text-slate-400">({c.document_number})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {errors.customer_name && <p className="mt-1 text-sm text-red-600">{errors.customer_name[0]}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Técnico asignado (opcional)</label>
          <select
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            className="field w-full"
          >
            <option value="">Sin asignar</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de equipo</label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as DeviceType)}
              className="field w-full"
            >
              {DEVICE_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">N° de serie</label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="field w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Marca</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="field w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Modelo</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="field w-full"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Clave (equipo/usuario, opcional)</label>
          <input
            type="text"
            value={devicePassword}
            onChange={(e) => setDevicePassword(e.target.value)}
            className="field w-full"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Accesorios dejados (ej: Cargador, Funda, Mouse)
          </label>
          <input
            type="text"
            value={accessories}
            onChange={(e) => setAccessories(e.target.value)}
            className="field w-full"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Falla reportada por el cliente</label>
          <textarea
            value={reportedIssue}
            onChange={(e) => setReportedIssue(e.target.value)}
            required
            rows={3}
            className="field w-full"
          />
          {errors.reported_issue && <p className="mt-1 text-sm text-red-600">{errors.reported_issue[0]}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Costo estimado (opcional)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={estimatedCost}
            onChange={(e) => setEstimatedCost(e.target.value)}
            className="field w-40"
          />
        </div>

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
            {isSubmitting ? "Guardando..." : "Registrar recepción"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
