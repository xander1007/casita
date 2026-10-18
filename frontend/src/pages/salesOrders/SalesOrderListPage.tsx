import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchSalesOrder, fetchSalesOrders } from "../../api/salesOrders";
import type { SalesOrder } from "../../types/salesOrders";
import { SALES_ORDER_STATUS_LABELS, SALES_ORDER_STATUS_STYLES } from "../../types/salesOrders";
import type { PaginationMeta } from "../../types/common";
import { useAuth } from "../../context/useAuth";
import { formatDate } from "../../utils/dates";
import { SalesOrderDetailModal } from "./SalesOrderDetailModal";
import { PurchaseSuggestionsPanel } from "./PurchaseSuggestionsPanel";
import { EmptyTableRow } from "../../components/ui/EmptyState";
import { ClipboardList } from "lucide-react";

const inputClass = "field";

export default function SalesOrderListPage() {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"orders" | "suggestions">("orders");
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [filters, setFilters] = useState({ search: "", status: "", on_demand: "", date_from: "", date_to: "" });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [selected, setSelected] = useState<SalesOrder | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchSalesOrders({ ...filters, page })
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
  }, [filters, page, refreshIndex]);

  // Coming from the order form or a quotation conversion: open the new order.
  useEffect(() => {
    const openId = (location.state as { openOrderId?: number } | null)?.openOrderId;
    if (!openId) return;
    navigate(location.pathname, { replace: true, state: null });
    fetchSalesOrder(openId).then(setSelected);
  }, [location, navigate]);

  function applyFilter(key: keyof typeof filters, value: string) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function openDetail(order: SalesOrder) {
    setSelected(await fetchSalesOrder(order.id));
  }

  const tabClass = (active: boolean) =>
    `border-b-2 px-1 pb-2 text-sm font-medium ${
      active ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Pedidos de Venta</h1>
          <p className="mt-1 text-sm text-slate-500">
            Reserva stock para tus clientes y gestiona la compra de lo que se vende a demanda.
          </p>
        </div>
        {hasPermission("sales-orders.manage") && (
          <Link
            to="/sales-orders/nuevo"
            className="btn btn-primary"
          >
            Nuevo Pedido
          </Link>
        )}
      </div>

      <div className="mt-4 flex gap-6 border-b border-slate-200">
        <button type="button" className={tabClass(tab === "orders")} onClick={() => setTab("orders")}>
          Pedidos
        </button>
        <button type="button" className={tabClass(tab === "suggestions")} onClick={() => setTab("suggestions")}>
          Compras a demanda
        </button>
      </div>

      {tab === "suggestions" ? (
        <div className="mt-4">
          <PurchaseSuggestionsPanel />
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={filters.search}
              onChange={(e) => applyFilter("search", e.target.value)}
              placeholder="Buscar por código o cliente..."
              className={`w-64 ${inputClass}`}
            />
            <select value={filters.status} onChange={(e) => applyFilter("status", e.target.value)} className={inputClass}>
              <option value="">Todos los estados</option>
              {Object.entries(SALES_ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input type="date" value={filters.date_from} onChange={(e) => applyFilter("date_from", e.target.value)} className={inputClass} />
            <input type="date" value={filters.date_to} onChange={(e) => applyFilter("date_to", e.target.value)} className={inputClass} />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={filters.on_demand === "1"}
                onChange={(e) => applyFilter("on_demand", e.target.checked ? "1" : "")}
              />
              Solo con productos a demanda
            </label>
          </div>

          <div className="card mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Pedido</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Fecha / Entrega</th>
                  <th className="px-4 py-3 font-medium">Almacén</th>
                  <th className="px-4 py-3 font-medium">Total</th>
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
                  <EmptyTableRow colSpan={7} icon={ClipboardList} title="Aún no hay pedidos" description="Registra un pedido para reservar stock a tu cliente o comprar a demanda." filtered={Object.values(filters).some(Boolean)} />
                )}
                {!isLoading &&
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{order.code}</div>
                        {order.has_on_demand && (
                          <span className="pill bg-amber-100 text-amber-700">
                            A demanda
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{order.contact?.name_or_business_name ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(order.order_date)}
                        <div className="text-xs text-slate-400">Entrega: {formatDate(order.expected_date)}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{order.warehouse?.name ?? "-"}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">S/ {order.total.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`pill ${SALES_ORDER_STATUS_STYLES[order.status]}`}>
                          {SALES_ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openDetail(order)}
                          className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                          Ver detalle
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
                Página {meta.current_page} de {meta.last_page} ({meta.total} pedidos)
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
        </>
      )}

      {selected && (
        <SalesOrderDetailModal
          order={selected}
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
