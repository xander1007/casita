import { useState } from "react";
import axios from "axios";
import { Modal } from "../../components/Modal";
import { annulSale } from "../../api/sales";
import { DOCUMENT_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "../../types/sales";
import type { Sale } from "../../types/sales";
import { useAuth } from "../../context/useAuth";

interface SaleDetailModalProps {
  sale: Sale;
  onClose: () => void;
  onAnnulled: () => void;
}

export function SaleDetailModal({ sale, onClose, onAnnulled }: SaleDetailModalProps) {
  const { hasPermission } = useAuth();
  const [showAnnulForm, setShowAnnulForm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAnnul() {
    setError(null);
    setIsSubmitting(true);
    try {
      await annulSale(sale.id, reason);
      onAnnulled();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.errors?.reason?.[0] ?? err.response?.data?.message ?? "No se pudo anular el comprobante.")
          : "No se pudo anular el comprobante.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`${DOCUMENT_TYPE_LABELS[sale.document_type]} ${sale.document_number}`} onClose={onClose}>
      {sale.status === "annulled" && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Comprobante anulado{sale.annulment_reason ? `: ${sale.annulment_reason}` : ""}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Cliente</p>
          <p className="font-medium text-slate-900">{sale.contact?.name_or_business_name ?? "Clientes Varios"}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500">Fecha</p>
          <p className="font-medium text-slate-900">{new Date(sale.created_at).toLocaleString("es-PE")}</p>
        </div>
      </div>

      <table className="mt-4 w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="py-2">Producto</th>
            <th className="py-2 text-right">Cant.</th>
            <th className="py-2 text-right">P. Unit.</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sale.details.map((detail) => (
            <tr key={detail.id}>
              <td className="py-2">
                {detail.product_name}
                {detail.product_serial && (
                  <span className="block text-xs text-slate-400">S/N: {detail.product_serial}</span>
                )}
              </td>
              <td className="py-2 text-right">{detail.quantity}</td>
              <td className="py-2 text-right">S/ {detail.unit_price.toFixed(2)}</td>
              <td className="py-2 text-right">S/ {detail.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">IGV</dt>
          <dd>S/ {sale.igv.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd>S/ {sale.total.toFixed(2)}</dd>
        </div>
      </dl>

      <div className="mt-3 border-t border-slate-200 pt-3 text-sm">
        <p className="text-slate-500">Pagos</p>
        {sale.payments.map((payment) => (
          <div key={payment.id} className="flex justify-between">
            <span>{PAYMENT_METHOD_LABELS[payment.payment_method]}</span>
            <span>S/ {payment.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {hasPermission("sales.annul") && sale.status === "completed" && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          {!showAnnulForm ? (
            <button
              type="button"
              onClick={() => setShowAnnulForm(true)}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Anular comprobante
            </button>
          ) : (
            <div className="space-y-2">
              {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo de anulación"
                rows={2}
                className="field w-full"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnnulForm(false)}
                  className="btn-sm btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || reason.trim().length === 0}
                  onClick={handleAnnul}
                  className="btn-sm btn-danger text-sm"
                >
                  {isSubmitting ? "Anulando..." : "Confirmar anulación"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
