import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/Modal";
import { approveQuotation, convertQuotationToOrder, rejectQuotation } from "../../api/quotations";
import { fetchSalesWarehouses } from "../../api/salesOrders";
import type { Quotation } from "../../types/quotations";
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_STYLES } from "../../types/quotations";
import type { Warehouse } from "../../types/inventory";
import { useAuth } from "../../context/useAuth";
import { formatDate } from "../../utils/dates";
import { QuotationPrintModal } from "./QuotationPrintModal";

interface QuotationDetailModalProps {
  quotation: Quotation;
  onClose: () => void;
  onChanged: (quotation: Quotation) => void;
}

function errorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  const errors = err.response?.data?.errors ?? {};
  return (Object.values(errors).flat()[0] as string | undefined) ?? err.response?.data?.message ?? fallback;
}

function ConvertToOrderForm({ quotation, onCancel }: { quotation: Quotation; onCancel: () => void }) {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState(quotation.warehouse ? String(quotation.warehouse.id) : "");
  const [expectedDate, setExpectedDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSalesWarehouses().then(setWarehouses);
  }, []);

  async function handleConvert() {
    setError(null);
    setIsSubmitting(true);
    try {
      const order = await convertQuotationToOrder(quotation.id, {
        warehouse_id: Number(warehouseId),
        expected_date: expectedDate || null,
      });
      navigate("/sales-orders", { state: { openOrderId: order.id } });
    } catch (err) {
      setError(errorMessage(err, "No se pudo convertir la cotización."));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-5 rounded-md border border-indigo-200 bg-indigo-50/40 p-3">
      <p className="text-sm font-medium text-slate-800">Convertir en pedido de venta</p>
      <p className="mt-1 text-xs text-slate-500">
        Se copian los productos y precios. Lo que haya en stock se reserva para el cliente; el resto queda "a demanda"
        para comprarlo.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Almacén de despacho</label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecciona un almacén</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Entrega comprometida (opcional)</label>
          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      {error && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={isSubmitting || !warehouseId}
          onClick={handleConvert}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isSubmitting ? "Creando pedido..." : "Crear pedido"}
        </button>
      </div>
    </div>
  );
}

export function QuotationDetailModal({ quotation, onClose, onChanged }: QuotationDetailModalProps) {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [showConvert, setShowConvert] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = hasPermission("quotations.manage");
  const isDraft = quotation.status === "draft";
  const isApproved = quotation.status === "approved";

  async function run(action: () => Promise<Quotation>, fallback: string) {
    setError(null);
    setIsSubmitting(true);
    try {
      onChanged(await action());
    } catch (err) {
      setError(errorMessage(err, fallback));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`Cotización ${quotation.code}`} onClose={onClose} maxWidth="max-w-3xl">
      {quotation.is_expired && (
        <div className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Esta cotización venció el {formatDate(quotation.valid_until)}. Confirma precios y stock antes de continuar.
        </div>
      )}
      {quotation.status === "converted" && (
        <div className="mb-4 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
          Convertida
          {quotation.sales_order && ` en el pedido ${quotation.sales_order.code}`}
          {quotation.sale && ` en la venta ${quotation.sale.document_number}`}.
        </div>
      )}

      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-slate-500">Cliente</p>
          <p className="font-medium text-slate-900">{quotation.contact?.name_or_business_name ?? "-"}</p>
          <p className="text-xs text-slate-400">{quotation.contact?.document_number}</p>
        </div>
        <div>
          <p className="text-slate-500">Emisión / Vigencia</p>
          <p className="font-medium text-slate-900">
            {formatDate(quotation.issue_date)} → {formatDate(quotation.valid_until)}
          </p>
          <p className="text-xs text-slate-400">Vendedor: {quotation.user ?? "-"}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-slate-500">Total</p>
          <p className="text-lg font-semibold text-slate-900">S/ {quotation.total.toFixed(2)}</p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${QUOTATION_STATUS_STYLES[quotation.status]}`}>
            {QUOTATION_STATUS_LABELS[quotation.status]}
          </span>
        </div>
      </div>

      <table className="mt-4 w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500">
          <tr>
            <th className="py-2">Producto</th>
            <th className="py-2 text-right">Cant.</th>
            <th className="py-2 text-right">P. Unit.</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {quotation.items?.map((item) => {
            const product = item.product;
            const short = product && !product.is_service && product.available_stock < item.quantity;
            return (
              <tr key={item.id}>
                <td className="py-2">
                  {product?.name} <span className="text-xs text-slate-400">({product?.internal_code})</span>
                  {short && quotation.status !== "converted" && (
                    <div className="text-xs text-amber-700">
                      Stock disponible: {product.available_stock} · {item.quantity - product.available_stock} irían a
                      demanda
                    </div>
                  )}
                </td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">S/ {item.unit_price.toFixed(2)}</td>
                <td className="py-2 text-right font-medium">S/ {item.total.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {quotation.notes && (
        <p className="mt-3 whitespace-pre-line rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          {quotation.notes}
        </p>
      )}

      {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {showConvert ? (
        <ConvertToOrderForm quotation={quotation} onCancel={() => setShowConvert(false)} />
      ) : (
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowPrint(true)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Imprimir proforma
          </button>

          {canManage && isDraft && (
            <button
              type="button"
              onClick={() => navigate(`/quotations/${quotation.id}/editar`)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Editar
            </button>
          )}

          {canManage && (isDraft || isApproved) && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => run(() => rejectQuotation(quotation.id), "No se pudo rechazar la cotización.")}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Rechazar
            </button>
          )}

          {canManage && isDraft && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => run(() => approveQuotation(quotation.id), "No se pudo aprobar la cotización.")}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Aprobar
            </button>
          )}

          {isApproved && hasPermission("sales-orders.manage") && (
            <button
              type="button"
              onClick={() => setShowConvert(true)}
              className="rounded-md border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
            >
              Convertir en pedido
            </button>
          )}

          {isApproved && hasPermission("pos.access") && (
            <button
              type="button"
              onClick={() => navigate("/pos", { state: { quotationId: quotation.id } })}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Facturar en POS
            </button>
          )}
        </div>
      )}

      {showPrint && <QuotationPrintModal quotationId={quotation.id} onClose={() => setShowPrint(false)} />}
    </Modal>
  );
}
