import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Modal } from "../../components/Modal";
import { createSale, searchPosContacts } from "../../api/pos";
import { QuickClientModal } from "./QuickClientModal";
import { calcCartTotals } from "./cart";
import type { CartItem } from "./cart";
import { DOCUMENT_TYPES, PAYMENT_METHODS } from "../../types/sales";
import type { DocumentType, PaymentMethod, Sale } from "../../types/sales";
import type { Contact } from "../../types/contacts";

interface PaymentRow {
  payment_method: PaymentMethod;
  amount: string;
  reference_number: string;
}

interface CheckoutModalProps {
  items: CartItem[];
  initialContact?: Contact | null;
  /** Source document being invoiced; a sales order fixes the customer. */
  quotationId?: number | null;
  salesOrderId?: number | null;
  onClose: () => void;
  onSuccess: (sale: Sale, change: number) => void;
}

export function CheckoutModal({
  items,
  initialContact = null,
  quotationId = null,
  salesOrderId = null,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const totals = useMemo(() => calcCartTotals(items), [items]);

  const [contact, setContact] = useState<Contact | null>(initialContact);
  const [contactSearch, setContactSearch] = useState("");
  const [contactResults, setContactResults] = useState<Contact[]>([]);
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>("03");
  const [payments, setPayments] = useState<PaymentRow[]>([
    { payment_method: "cash", amount: totals.total.toFixed(2), reference_number: "" },
  ]);
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
      searchPosContacts(contactSearch.trim()).then((results) => {
        if (!cancelled) setContactResults(results);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [contactSearch]);

  const paidTotal = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const change = Math.max(0, Math.round((paidTotal - totals.total) * 100) / 100);
  const isFacturaInvalid = documentType === "01" && contact?.identity_document_type !== "6";

  function addPaymentRow() {
    const remaining = Math.max(0, Math.round((totals.total - paidTotal) * 100) / 100);
    setPayments((rows) => [...rows, { payment_method: "yape_plin", amount: remaining.toFixed(2), reference_number: "" }]);
  }

  function updatePaymentRow(index: number, patch: Partial<PaymentRow>) {
    setPayments((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removePaymentRow(index: number) {
    setPayments((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setErrors({});
    setFormError(null);

    if (isFacturaInvalid) {
      setFormError("Para emitir una Factura el cliente debe tener RUC (documento tipo 6).");
      return;
    }

    if (paidTotal + 0.01 < totals.total) {
      setFormError("El monto pagado es insuficiente para cubrir el total de la venta.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { sale, change } = await createSale({
        contact_id: contact?.id ?? null,
        document_type: documentType,
        quotation_id: quotationId,
        sales_order_id: salesOrderId,
        items: items.map((item) => ({
          product_id: item.product.id,
          product_serial_id: item.serial?.id ?? null,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
        payments: payments.map((p) => ({
          payment_method: p.payment_method,
          amount: Number(p.amount),
          reference_number: p.reference_number || null,
        })),
      });
      onSuccess(sale, change);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const responseErrors = error.response.data.errors ?? {};
        setErrors(responseErrors);
        setFormError(Object.values(responseErrors).flat().join(" ") || "No se pudo procesar la venta.");
      } else {
        setFormError("No se pudo procesar la venta. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Cobrar venta" onClose={onClose}>
      {formError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
      )}

      <div className="space-y-4">
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Cliente</span>
          {contact ? (
            <div className="field flex items-center justify-between">
              <span>
                {contact.name_or_business_name}{" "}
                <span className="text-xs text-slate-400">({contact.document_number})</span>
              </span>
              {salesOrderId ? (
                <span className="text-xs text-slate-400">Cliente del pedido</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setContact(null)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Cambiar
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  type="search"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Clientes Varios (buscar por nombre o documento)"
                  className="field flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowQuickClient(true)}
                  className="btn btn-secondary"
                >
                  + Nuevo
                </button>
              </div>
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
                      {c.name_or_business_name}{" "}
                      <span className="text-xs text-slate-400">({c.document_number})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {errors.contact_id && <p className="mt-1 text-sm text-red-600">{errors.contact_id[0]}</p>}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Comprobante</span>
          <div className="flex gap-2">
            {DOCUMENT_TYPES.map((option) => (
              <label
                key={option.value}
                className={`flex-1 cursor-pointer rounded-md border px-3 py-2 text-center text-sm ${
                  documentType === option.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                <input
                  type="radio"
                  name="document_type"
                  value={option.value}
                  checked={documentType === option.value}
                  onChange={() => setDocumentType(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
          {isFacturaInvalid && (
            <p className="mt-1 text-sm text-amber-600">
              Selecciona un cliente con RUC para emitir Factura.
            </p>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Métodos de pago</span>
            <button
              type="button"
              onClick={addPaymentRow}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              + Agregar pago
            </button>
          </div>

          <div className="space-y-2">
            {payments.map((row, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={row.payment_method}
                  onChange={(e) => updatePaymentRow(index, { payment_method: e.target.value as PaymentMethod })}
                  className="field-sm"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.amount}
                  onChange={(e) => updatePaymentRow(index, { amount: e.target.value })}
                  className="field-sm w-24"
                />
                {row.payment_method !== "cash" && (
                  <input
                    type="text"
                    value={row.reference_number}
                    onChange={(e) => updatePaymentRow(index, { reference_number: e.target.value })}
                    placeholder="N° de operación"
                    className="field-sm flex-1"
                  />
                )}
                {payments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePaymentRow(index)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Quitar pago"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.payments && <p className="mt-1 text-sm text-red-600">{errors.payments[0]}</p>}
        </div>

        <dl className="space-y-1 rounded-md bg-slate-50 px-3 py-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Total a pagar</dt>
            <dd className="font-semibold text-slate-900">S/ {totals.total.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Pagado</dt>
            <dd className="text-slate-700">S/ {paidTotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Vuelto</dt>
            <dd className="font-semibold text-emerald-600">S/ {change.toFixed(2)}</dd>
          </div>
        </dl>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="btn btn-primary"
          >
            {isSubmitting ? "Procesando..." : "Confirmar venta"}
          </button>
        </div>
      </div>

      {showQuickClient && (
        <QuickClientModal
          onClose={() => setShowQuickClient(false)}
          onCreated={(created) => {
            setContact(created);
            setShowQuickClient(false);
          }}
        />
      )}
    </Modal>
  );
}
