import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/Modal";
import { cancelSalesOrder, fetchPurchaseSuggestions } from "../../api/salesOrders";
import type { SalesOrder } from "../../types/salesOrders";
import { SALES_ORDER_STATUS_LABELS, SALES_ORDER_STATUS_STYLES } from "../../types/salesOrders";
import { useAuth } from "../../context/useAuth";
import { formatDate } from "../../utils/dates";

interface SalesOrderDetailModalProps {
  order: SalesOrder;
  onClose: () => void;
  onChanged: () => void;
}

export function SalesOrderDetailModal({ order, onClose, onChanged }: SalesOrderDetailModalProps) {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = order.status === "pending" || order.status === "ready";

  async function handleCancel() {
    setError(null);
    setIsSubmitting(true);
    try {
      await cancelSalesOrder(order.id, reason);
      onChanged();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.errors?.reason?.[0] ??
              err.response?.data?.errors?.order?.[0] ??
              err.response?.data?.message ??
              "No se pudo cancelar el pedido.")
          : "No se pudo cancelar el pedido.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function buyMissing() {
    const suggestions = await fetchPurchaseSuggestions(order.warehouse?.id);
    navigate("/purchases/nueva", {
      state: { onDemand: suggestions.filter((s) => s.sales_order_id === order.id) },
    });
  }

  return (
    <Modal title={`Pedido ${order.code}`} onClose={onClose} maxWidth="max-w-4xl">
      {order.status === "cancelled" && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Pedido cancelado{order.cancellation_reason ? `: ${order.cancellation_reason}` : ""}. Su stock fue liberado.
        </div>
      )}
      {order.status === "pending" && (
        <div className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Hay productos a demanda por recibir. Al ingresar la compra vinculada, las unidades se reservan automáticamente
          para este cliente.
        </div>
      )}
      {order.status === "completed" && order.sale && (
        <div className="mb-4 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
          Facturado con el comprobante {order.sale.document_number}.
        </div>
      )}

      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-slate-500">Cliente</p>
          <p className="font-medium text-slate-900">{order.contact?.name_or_business_name ?? "-"}</p>
          <p className="text-xs text-slate-400">{order.contact?.document_number}</p>
        </div>
        <div>
          <p className="text-slate-500">Pedido / Entrega</p>
          <p className="font-medium text-slate-900">
            {formatDate(order.order_date)} → {formatDate(order.expected_date)}
          </p>
          <p className="text-xs text-slate-400">
            Almacén: {order.warehouse?.name}
            {order.quotation && ` · Cotización ${order.quotation.code}`}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-slate-500">Total</p>
          <p className="text-lg font-semibold text-slate-900">S/ {order.total.toFixed(2)}</p>
          <span className={`pill ${SALES_ORDER_STATUS_STYLES[order.status]}`}>
            {SALES_ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 text-right font-medium">Cant.</th>
              <th className="px-3 py-2 text-right font-medium">De stock</th>
              <th className="px-3 py-2 text-right font-medium">A demanda</th>
              <th className="px-3 py-2 text-right font-medium">Recibido</th>
              <th className="px-3 py-2 text-right font-medium">Por comprar</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items?.map((item) => (
              <tr key={item.id} className={item.pending_quantity > 0 && isOpen ? "bg-amber-50/50" : undefined}>
                <td className="px-3 py-2 align-top">
                  <div className="font-medium text-slate-900">
                    {item.product?.name}
                    {item.is_on_demand && (
                      <span className="pill ml-2 bg-amber-100 text-amber-700">
                        A demanda
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {item.product?.internal_code} · S/ {item.unit_price.toFixed(2)} c/u
                  </div>
                  {item.purchases.map((p) => (
                    <div key={`${p.purchase_id}-${item.id}`} className="text-xs text-emerald-700">
                      ↳ Compra {p.document_number} ({p.supplier ?? "-"}): {p.quantity} und.
                    </div>
                  ))}
                </td>
                <td className="px-3 py-2 text-right align-top">{item.quantity}</td>
                <td className="px-3 py-2 text-right align-top">{item.reserved_quantity}</td>
                <td className="px-3 py-2 text-right align-top">{item.on_demand_quantity || "—"}</td>
                <td className="px-3 py-2 text-right align-top">{item.on_demand_quantity ? item.received_quantity : "—"}</td>
                <td
                  className={`px-3 py-2 text-right align-top font-semibold ${
                    item.pending_quantity > 0 ? "text-red-600" : "text-slate-400"
                  }`}
                >
                  {item.pending_quantity}
                </td>
                <td className="px-3 py-2 text-right align-top font-medium">S/ {item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {order.notes && <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{order.notes}</p>}

      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {isOpen && !showCancelForm && (
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {hasPermission("sales-orders.manage") && (
            <button
              type="button"
              onClick={() => setShowCancelForm(true)}
              className="btn border border-red-300 bg-white text-red-600 hover:bg-red-50"
            >
              Cancelar pedido
            </button>
          )}
          {order.status === "pending" && hasPermission("purchases.create") && (
            <button
              type="button"
              onClick={buyMissing}
              className="btn bg-amber-600 text-white shadow-sm hover:bg-amber-700"
            >
              Comprar faltantes
            </button>
          )}
          {order.status === "ready" && hasPermission("pos.access") && (
            <button
              type="button"
              onClick={() => navigate("/pos", { state: { salesOrderId: order.id } })}
              className="btn btn-primary"
            >
              Facturar en POS
            </button>
          )}
        </div>
      )}

      {isOpen && showCancelForm && (
        <div className="mt-5 rounded-md border border-red-200 p-3">
          <label className="mb-1 block text-sm font-medium text-slate-700">Motivo de cancelación</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="field w-full focus:border-red-500 focus:ring-red-500/20"
          />
          <p className="mt-1 text-xs text-slate-500">
            Se libera el stock reservado. Las unidades ya compradas para este pedido quedan como stock libre.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCancelForm(false)}
              className="btn btn-secondary"
            >
              Volver
            </button>
            <button
              type="button"
              disabled={isSubmitting || reason.trim() === ""}
              onClick={handleCancel}
              className="btn btn-danger"
            >
              Confirmar cancelación
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
