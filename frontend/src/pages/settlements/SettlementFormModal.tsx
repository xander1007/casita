import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { Modal } from "../../components/Modal";
import { createSettlement, searchSettlementContacts } from "../../api/settlements";
import type { Contact } from "../../types/contacts";
import {
  COMMON_BANKS,
  SETTLEMENT_DOCUMENT_TYPE_LABELS,
  SETTLEMENT_PAYMENT_METHOD_LABELS,
} from "../../types/settlements";
import type { SettlementCurrency, SettlementDocumentType, SettlementPaymentMethod } from "../../types/settlements";

interface SettlementFormModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function todayIso(): string {
  // Local date, not UTC: in Peru (UTC-5) toISOString() already returns tomorrow after 7 p.m.
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const inputClass = "field w-full";

function FieldError({ messages }: { messages?: string[] }) {
  return messages ? <p className="mt-1 text-sm text-red-600">{messages[0]}</p> : null;
}

export function SettlementFormModal({ onClose, onCreated }: SettlementFormModalProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState<Contact[]>([]);

  const [documentType, setDocumentType] = useState<SettlementDocumentType>("factura");
  const [documentNumber, setDocumentNumber] = useState("");
  const [currency, setCurrency] = useState<SettlementCurrency>("PEN");
  const [amount, setAmount] = useState("");
  const [operationNumber, setOperationNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [paymentMethod, setPaymentMethod] = useState<SettlementPaymentMethod>("transfer");
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contactSearch.trim().length < 2) {
      setContactResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      searchSettlementContacts(contactSearch.trim()).then((results) => {
        if (!cancelled) setContactResults(results);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [contactSearch]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    if (!contact) {
      setFormError("Selecciona el cliente o proveedor del comprobante.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSettlement({
        contact_id: contact.id,
        document_type: documentType,
        document_number: documentNumber,
        currency,
        amount: Number(amount),
        operation_number: operationNumber.trim() || null,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        bank,
        account,
        notes: notes || null,
      });
      onCreated();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors ?? {});
        setFormError(error.response.data.message ?? null);
      } else {
        setFormError("No se pudo registrar la cancelación. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Registrar cancelación de comprobante" onClose={onClose} maxWidth="max-w-2xl">
      {formError && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-900">Comprobante</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Cliente / Proveedor</label>
              {contact ? (
                <div className="field flex items-center justify-between">
                  <span>
                    {contact.name_or_business_name}{" "}
                    <span className="text-xs text-slate-400">({contact.document_number})</span>
                  </span>
                  <button type="button" onClick={() => setContact(null)} className="text-xs text-indigo-600 hover:underline">
                    Cambiar
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="search"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Buscar por RUC/DNI o razón social..."
                    className={inputClass}
                  />
                  {contactResults.length > 0 && (
                    <div className="mt-1 max-h-32 overflow-y-auto rounded-md border border-slate-200">
                      {contactResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setContact(c);
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
              <FieldError messages={errors.contact_id} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de comprobante</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as SettlementDocumentType)}
                className={inputClass}
              >
                {Object.entries(SETTLEMENT_DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <FieldError messages={errors.document_type} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">N° de comprobante</label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="F001-000123"
                className={inputClass}
              />
              <FieldError messages={errors.document_number} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-900">Datos del pago</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Importe pagado</label>
              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as SettlementCurrency)}
                  className="field px-2"
                >
                  <option value="PEN">S/</option>
                  <option value="USD">US$</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputClass}
                />
              </div>
              <FieldError messages={errors.amount} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de pago</label>
              <input
                type="date"
                value={paymentDate}
                max={todayIso()}
                onChange={(e) => setPaymentDate(e.target.value)}
                className={inputClass}
              />
              <FieldError messages={errors.payment_date} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Medio de pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as SettlementPaymentMethod)}
                className={inputClass}
              >
                {Object.entries(SETTLEMENT_PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <FieldError messages={errors.payment_method} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                N° de operación <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={operationNumber}
                onChange={(e) => setOperationNumber(e.target.value)}
                className={inputClass}
              />
              <FieldError messages={errors.operation_number} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Banco</label>
              <input
                type="text"
                list="settlement-banks"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="Ej. BCP"
                className={inputClass}
              />
              <datalist id="settlement-banks">
                {COMMON_BANKS.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <FieldError messages={errors.bank} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cuenta</label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="N° de cuenta o CCI"
                className={inputClass}
              />
              <FieldError messages={errors.account} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Observaciones</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
            </div>
          </div>
        </fieldset>

        <div className="flex justify-end gap-2">
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
            {isSubmitting ? "Guardando..." : "Registrar cancelación"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
