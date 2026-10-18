import { useState } from "react";
import axios from "axios";
import { Modal } from "../../components/Modal";
import {
  annulGovernmentOrder,
  fetchGovernmentOrderStockReport,
  markGovernmentOrderDelivered,
} from "../../api/governmentOrders";
import type { GovernmentOrderWithReport } from "../../api/governmentOrders";
import { GOVERNMENT_ORDER_STATUS_LABELS, GOVERNMENT_ORDER_STATUS_STYLES } from "../../types/governmentOrders";
import { useAuth } from "../../context/useAuth";
import { StockReportTable } from "./StockReportTable";

interface GovernmentOrderDetailModalProps {
  data: GovernmentOrderWithReport;
  onClose: () => void;
  onChanged: () => void;
}

function formatDate(value: string | null): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString("es-PE") : "-";
}

function errorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  const errors = err.response?.data?.errors;
  return errors?.reason?.[0] ?? errors?.order?.[0] ?? err.response?.data?.message ?? fallback;
}

export function GovernmentOrderDetailModal({ data, onClose, onChanged }: GovernmentOrderDetailModalProps) {
  const { hasPermission } = useAuth();
  const { order } = data;
  const [report, setReport] = useState(data.stock_report);
  const [showAnnulForm, setShowAnnulForm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const canManage = hasPermission("government-orders.manage") && order.status === "pending";

  async function refreshReport() {
    setIsRefreshing(true);
    try {
      setReport(await fetchGovernmentOrderStockReport(order.id));
    } finally {
      setIsRefreshing(false);
    }
  }

  async function run(action: () => Promise<unknown>, fallback: string) {
    setError(null);
    setIsSubmitting(true);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError(errorMessage(err, fallback));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Orden de Compra ${order.order_number}`} onClose={onClose} maxWidth="max-w-4xl">
      {order.status === "annulled" && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Orden anulada{order.annulment_reason ? `: ${order.annulment_reason}` : ""}
        </div>
      )}

      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-slate-500">Entidad</p>
          <p className="font-medium text-slate-900">{order.contact?.name_or_business_name ?? "-"}</p>
          <p className="text-xs text-slate-400">RUC {order.contact?.document_number}</p>
        </div>
        <div>
          <p className="text-slate-500">Emisión / Plazo de entrega</p>
          <p className="font-medium text-slate-900">
            {formatDate(order.issue_date)} → {formatDate(order.delivery_deadline)}
          </p>
          {order.siaf_number && <p className="text-xs text-slate-400">SIAF: {order.siaf_number}</p>}
        </div>
        <div className="sm:text-right">
          <p className="text-slate-500">Monto de la OC</p>
          <p className="text-lg font-semibold text-slate-900">S/ {order.total.toFixed(2)}</p>
          <span className={`pill ${GOVERNMENT_ORDER_STATUS_STYLES[order.status]}`}>
            {GOVERNMENT_ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
      </div>

      {order.notes && <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{order.notes}</p>}

      <div className="mt-5 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Stock disponible vs. qué se tiene que comprar</h3>
        <button
          type="button"
          onClick={refreshReport}
          disabled={isRefreshing}
          className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
        >
          {isRefreshing ? "Actualizando..." : "Recalcular con stock actual"}
        </button>
      </div>
      <div className="mt-2">
        <StockReportTable report={report} />
      </div>

      <h3 className="mt-5 text-base font-semibold text-slate-900">Ítems de la orden</h3>
      <table className="mt-2 w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="py-2">Producto</th>
            <th className="py-2 text-right">Cant.</th>
            <th className="py-2 text-right">P. Unit.</th>
            <th className="py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {order.items?.map((item) => (
            <tr key={item.id}>
              <td className="py-2">
                {item.product_name} <span className="text-xs text-slate-400">({item.internal_code})</span>
              </td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">S/ {item.unit_price.toFixed(2)}</td>
              <td className="py-2 text-right font-medium">S/ {item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {canManage && !showAnnulForm && (
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowAnnulForm(true)}
            className="btn border border-red-300 bg-white text-red-600 hover:bg-red-50"
          >
            Anular orden
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => run(() => markGovernmentOrderDelivered(order.id), "No se pudo actualizar la orden.")}
            className="btn btn-success"
          >
            Marcar como entregada
          </button>
        </div>
      )}

      {canManage && showAnnulForm && (
        <div className="mt-5 rounded-md border border-red-200 p-3">
          <label className="mb-1 block text-sm font-medium text-slate-700">Motivo de anulación</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="field w-full focus:border-red-500 focus:ring-red-500/20"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAnnulForm(false)}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting || reason.trim() === ""}
              onClick={() => run(() => annulGovernmentOrder(order.id, reason), "No se pudo anular la orden.")}
              className="btn btn-danger"
            >
              Confirmar anulación
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
