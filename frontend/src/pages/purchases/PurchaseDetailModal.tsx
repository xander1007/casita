import { useState } from "react";
import axios from "axios";
import { Modal } from "../../components/Modal";
import { annulPurchase } from "../../api/purchases";
import { PURCHASE_DOCUMENT_TYPE_LABELS } from "../../types/purchases";
import type { Purchase } from "../../types/purchases";
import { useAuth } from "../../context/useAuth";

interface PurchaseDetailModalProps {
  purchase: Purchase;
  onClose: () => void;
  onAnnulled: () => void;
}

export function PurchaseDetailModal({ purchase, onClose, onAnnulled }: PurchaseDetailModalProps) {
  const { hasPermission } = useAuth();
  const [showAnnulForm, setShowAnnulForm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAnnul() {
    setError(null);
    setIsSubmitting(true);
    try {
      await annulPurchase(purchase.id, reason);
      onAnnulled();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.errors?.reason?.[0] ??
              err.response?.data?.errors?.purchase?.[0] ??
              err.response?.data?.message ??
              "No se pudo anular la compra.")
          : "No se pudo anular la compra.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title={`${PURCHASE_DOCUMENT_TYPE_LABELS[purchase.document_type]} ${purchase.document_number}`}
      onClose={onClose}
    >
      {purchase.status === "annulled" && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Compra anulada{purchase.annulment_reason ? `: ${purchase.annulment_reason}` : ""}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Proveedor</p>
          <p className="font-medium text-slate-900">{purchase.supplier?.name_or_business_name ?? "-"}</p>
          <p className="text-xs text-slate-400">{purchase.supplier?.document_number}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500">Fecha</p>
          <p className="font-medium text-slate-900">
            {new Date(purchase.purchase_date).toLocaleDateString("es-PE")}
          </p>
          <p className="text-xs text-slate-400">Almacén: {purchase.warehouse?.name}</p>
        </div>
      </div>

      <table className="mt-4 w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="py-2">Producto</th>
            <th className="py-2 text-right">Cant.</th>
            <th className="py-2 text-right">Costo Unit.</th>
            <th className="py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {purchase.details.map((detail) => (
            <tr key={detail.id}>
              <td className="py-2">
                {detail.product_name}
                {detail.serials.length > 0 && (
                  <span className="block text-xs text-slate-400">
                    S/N: {detail.serials.map((s) => s.serial_number).join(", ")}
                  </span>
                )}
                {detail.allocations?.map((a) => (
                  <span key={a.sales_order_id} className="block text-xs text-amber-700">
                    Para pedido {a.order_code}: {a.quantity} und.
                  </span>
                ))}
              </td>
              <td className="py-2 text-right">{detail.quantity}</td>
              <td className="py-2 text-right">S/ {detail.unit_cost.toFixed(2)}</td>
              <td className="py-2 text-right">S/ {detail.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">Subtotal</dt>
          <dd>S/ {purchase.subtotal.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">IGV (18%)</dt>
          <dd>S/ {purchase.igv.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd>S/ {purchase.total.toFixed(2)}</dd>
        </div>
      </dl>

      {hasPermission("purchases.annul") && purchase.status === "completed" && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          {!showAnnulForm ? (
            <button
              type="button"
              onClick={() => setShowAnnulForm(true)}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Anular compra
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
