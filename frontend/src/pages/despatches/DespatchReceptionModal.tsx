import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { Modal } from "../../components/Modal";
import { fetchContacts } from "../../api/contacts";
import { fetchSales } from "../../api/sales";
import { createDespatch } from "../../api/despatches";
import type { DespatchItemPayload } from "../../api/despatches";
import { TRANSPORT_REASONS } from "../../types/despatches";
import type { Despatch, TransportReason } from "../../types/despatches";
import type { Contact } from "../../types/contacts";
import type { Sale } from "../../types/sales";

interface DespatchReceptionModalProps {
  onClose: () => void;
  onCreated: (despatch: Despatch) => void;
}

const EMPTY_ITEM: DespatchItemPayload = {
  description: "",
  quantity: 1,
  unit_of_measure: "NIU",
  code: "",
  weight: null,
};

export function DespatchReceptionModal({ onClose, onCreated }: DespatchReceptionModalProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState<Contact[]>([]);

  const [referenceSale, setReferenceSale] = useState<Sale | null>(null);
  const [saleSearch, setSaleSearch] = useState("");
  const [saleResults, setSaleResults] = useState<Sale[]>([]);

  const [startingAddress, setStartingAddress] = useState("JR. LIBERTAD NRO. 502, Moyobamba");
  const [arrivalAddress, setArrivalAddress] = useState("");
  const [transportReason, setTransportReason] = useState<TransportReason>("Venta");
  const [grossWeight, setGrossWeight] = useState("");
  const [packageCount, setPackageCount] = useState("1");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [driverDni, setDriverDni] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [observations, setObservations] = useState("");
  const [transportStartDate, setTransportStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryDate, setDeliveryDate] = useState("");

  const [items, setItems] = useState<DespatchItemPayload[]>([{ ...EMPTY_ITEM }]);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contactSearch.trim().length < 2) {
      setContactResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      fetchContacts({ search: contactSearch.trim(), page: 1 }).then((response) => {
        if (!cancelled) setContactResults(response.data);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [contactSearch]);

  useEffect(() => {
    if (saleSearch.trim().length < 2) {
      setSaleResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      fetchSales({ search: saleSearch.trim(), page: 1 }).then((response) => {
        if (!cancelled) setSaleResults(response.data);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [saleSearch]);

  function updateItem(index: number, patch: Partial<DespatchItemPayload>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItemRow() {
    setItems((current) => [...current, { ...EMPTY_ITEM }]);
  }

  function removeItemRow(index: number) {
    setItems((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!contact) {
      setFormError("Selecciona el destinatario de la guía.");
      return;
    }

    setIsSubmitting(true);
    try {
      const despatch = await createDespatch({
        contact_id: contact.id,
        reference_sale_id: referenceSale?.id ?? null,
        starting_address: startingAddress,
        arrival_address: arrivalAddress,
        transport_reason: transportReason,
        gross_weight: grossWeight ? Number(grossWeight) : null,
        package_count: packageCount ? Number(packageCount) : null,
        vehicle_plate: vehiclePlate || null,
        vehicle_brand: vehicleBrand || null,
        driver_dni: driverDni || null,
        driver_license: driverLicense || null,
        order_number: orderNumber || null,
        observations: observations || null,
        transport_start_date: transportStartDate,
        delivery_date: deliveryDate || null,
        items: items
          .filter((item) => item.description.trim().length > 0)
          .map((item) => ({ ...item, weight: item.weight || null })),
      });
      onCreated(despatch);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const responseErrors = error.response.data.errors ?? {};
        setFormError(Object.values(responseErrors).flat().join(" ") || "No se pudo emitir la guía.");
      } else {
        setFormError("No se pudo emitir la guía. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Nueva Guía de Remisión" onClose={onClose} maxWidth="max-w-3xl">
      {formError && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Destinatario</span>
          {contact ? (
            <div className="flex items-center justify-between rounded-md border border-slate-300 px-3 py-2 text-sm">
              <span>
                {contact.name_or_business_name}{" "}
                <span className="text-xs text-slate-400">({contact.document_number})</span>
              </span>
              <button
                type="button"
                onClick={() => setContact(null)}
                className="text-xs text-indigo-600 hover:underline"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div>
              <input
                type="search"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Buscar por nombre, RUC o DNI..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {contactResults.length > 0 && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded-md border border-slate-200">
                  {contactResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setContact(c);
                        setArrivalAddress(c.address ?? "");
                        setContactSearch("");
                        setContactResults([]);
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
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Comprobante referenciado (opcional)</span>
          {referenceSale ? (
            <div className="flex items-center justify-between rounded-md border border-slate-300 px-3 py-2 text-sm">
              <span>{referenceSale.document_number}</span>
              <button
                type="button"
                onClick={() => setReferenceSale(null)}
                className="text-xs text-indigo-600 hover:underline"
              >
                Quitar
              </button>
            </div>
          ) : (
            <div>
              <input
                type="search"
                value={saleSearch}
                onChange={(e) => setSaleSearch(e.target.value)}
                placeholder="Buscar comprobante por serie/número..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {saleResults.length > 0 && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded-md border border-slate-200">
                  {saleResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setReferenceSale(s);
                        setSaleSearch("");
                        setSaleResults([]);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-indigo-50"
                    >
                      {s.document_number} — {s.contact?.name_or_business_name ?? "Clientes Varios"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Dirección de partida</label>
            <input
              type="text"
              required
              value={startingAddress}
              onChange={(e) => setStartingAddress(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Dirección de llegada</label>
            <input
              type="text"
              required
              value={arrivalAddress}
              onChange={(e) => setArrivalAddress(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Motivo de traslado</label>
            <select
              value={transportReason}
              onChange={(e) => setTransportReason(e.target.value as TransportReason)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {TRANSPORT_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Peso Bruto (KGM)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={grossWeight}
              onChange={(e) => setGrossWeight(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">N° de bultos</label>
            <input
              type="number"
              min="0"
              value={packageCount}
              onChange={(e) => setPackageCount(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de inicio de traslado</label>
            <input
              type="date"
              required
              value={transportStartDate}
              onChange={(e) => setTransportStartDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de entrega (opcional)</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="rounded-md border border-slate-200 p-3">
          <p className="mb-2 text-sm font-medium text-slate-700">Vehículo y conductor</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              placeholder="Nro. de placa"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={vehicleBrand}
              onChange={(e) => setVehicleBrand(e.target.value)}
              placeholder="Marca del vehículo"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={driverDni}
              onChange={(e) => setDriverDni(e.target.value)}
              placeholder="DNI del conductor"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={driverLicense}
              onChange={(e) => setDriverLicense(e.target.value)}
              placeholder="N° de licencia"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Ítems a trasladar</span>
            <button type="button" onClick={addItemRow} className="text-xs font-medium text-indigo-600 hover:underline">
              + Agregar ítem
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2">
                <input
                  type="text"
                  value={item.code ?? ""}
                  onChange={(e) => updateItem(index, { code: e.target.value })}
                  placeholder="Código"
                  className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="text"
                  required
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  placeholder="Descripción"
                  className="col-span-5 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                  placeholder="Cant."
                  className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="text"
                  value={item.unit_of_measure}
                  onChange={(e) => updateItem(index, { unit_of_measure: e.target.value })}
                  placeholder="Unid."
                  className="col-span-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.weight ?? ""}
                  onChange={(e) => updateItem(index, { weight: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Peso"
                  className="col-span-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  className="col-span-1 text-xs text-red-600 hover:underline"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Observaciones (opcional)</label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">N° Orden de compra (opcional)</label>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
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
            {isSubmitting ? "Guardando..." : "Emitir guía"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
