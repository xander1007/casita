import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchGovernmentOrder, fetchGovernmentOrders } from "../../api/governmentOrders";
import type { GovernmentOrderWithReport } from "../../api/governmentOrders";
import type { GovernmentOrder } from "../../types/governmentOrders";
import { GOVERNMENT_ORDER_STATUS_LABELS, GOVERNMENT_ORDER_STATUS_STYLES } from "../../types/governmentOrders";
import type { PaginationMeta } from "../../types/common";
import { useAuth } from "../../context/useAuth";
import { GovernmentOrderDetailModal } from "./GovernmentOrderDetailModal";
import { EmptyTableRow } from "../../components/ui/EmptyState";
import { Landmark } from "lucide-react";

export default function GovernmentOrderListPage() {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<GovernmentOrder[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  // Right after registering an order, open it so the stock report is shown immediately.
  const [selected, setSelected] = useState<GovernmentOrderWithReport | null>(
    () => (location.state as { createdOrder?: GovernmentOrderWithReport } | null)?.createdOrder ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchGovernmentOrders({
      search: search || undefined,
      status: status || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
    })
      .then((response) => {
        if (cancelled) return;
        setOrders(response.data);
        setMeta(response.meta);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, status, dateFrom, dateTo, page, refreshIndex]);

  // Drop the one-shot navigation state so a refresh doesn't reopen the modal.
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  function applyFilters(next: Partial<{ search: string; status: string; dateFrom: string; dateTo: string }>) {
    setPage(1);
    if (next.search !== undefined) setSearch(next.search);
    if (next.status !== undefined) setStatus(next.status);
    if (next.dateFrom !== undefined) setDateFrom(next.dateFrom);
    if (next.dateTo !== undefined) setDateTo(next.dateTo);
  }

  async function openDetail(order: GovernmentOrder) {
    setSelected(await fetchGovernmentOrder(order.id));
  }

  const inputClass = "field";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Órdenes de Compra del Estado</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registra las OC de entidades públicas y compara lo solicitado contra el stock de tus almacenes.
          </p>
        </div>
        {hasPermission("government-orders.manage") && (
          <Link
            to="/government-orders/nueva"
            className="btn btn-primary"
          >
            Nueva Orden de Compra
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => applyFilters({ search: e.target.value })}
          placeholder="Buscar por N° de OC, SIAF o entidad..."
          className={`w-64 ${inputClass}`}
        />
        <select value={status} onChange={(e) => applyFilters({ status: e.target.value })} className={inputClass}>
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="delivered">Entregada</option>
          <option value="annulled">Anulada</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => applyFilters({ dateFrom: e.target.value })} className={inputClass} />
        <input type="date" value={dateTo} onChange={(e) => applyFilters({ dateTo: e.target.value })} className={inputClass} />
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">N° OC</th>
              <th className="px-4 py-3 font-medium">Entidad</th>
              <th className="px-4 py-3 font-medium">Emisión</th>
              <th className="px-4 py-3 font-medium">Plazo de entrega</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!isLoading && orders.length === 0 && (
              <EmptyTableRow colSpan={7} icon={Landmark} title="Aún no hay órdenes de compra del Estado" description="Registra una OC para comparar lo solicitado con tu stock disponible." filtered={Boolean(search || status || dateFrom || dateTo)} />
            )}
            {!isLoading &&
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{order.order_number}</div>
                    {order.siaf_number && <div className="text-xs text-slate-400">SIAF {order.siaf_number}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{order.contact?.name_or_business_name ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(`${order.issue_date}T00:00:00`).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {order.delivery_deadline
                      ? new Date(`${order.delivery_deadline}T00:00:00`).toLocaleDateString("es-PE")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">S/ {order.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`pill ${GOVERNMENT_ORDER_STATUS_STYLES[order.status]}`}>
                      {GOVERNMENT_ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openDetail(order)}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      Ver stock / detalle
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Página {meta.current_page} de {meta.last_page} ({meta.total} órdenes)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => setPage(meta.current_page - 1)}
              className="btn-sm btn-secondary"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage(meta.current_page + 1)}
              className="btn-sm btn-secondary"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {selected && (
        <GovernmentOrderDetailModal
          data={selected}
          onClose={() => setSelected(null)}
          onChanged={() => {
            setSelected(null);
            setRefreshIndex((i) => i + 1);
          }}
        />
      )}
    </div>
  );
}
