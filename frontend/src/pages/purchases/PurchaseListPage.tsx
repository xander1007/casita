import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPurchase, fetchPurchases } from "../../api/purchases";
import type { Purchase } from "../../types/purchases";
import { PURCHASE_DOCUMENT_TYPE_LABELS } from "../../types/purchases";
import type { PaginationMeta } from "../../types/common";
import { useAuth } from "../../context/useAuth";
import { PurchaseDetailModal } from "./PurchaseDetailModal";
import { EmptyTableRow } from "../../components/ui/EmptyState";
import { ShoppingBag } from "lucide-react";

export default function PurchaseListPage() {
  const { hasPermission } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchPurchases({
      search: search || undefined,
      status: status || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
    })
      .then((response) => {
        if (cancelled) return;
        setPurchases(response.data);
        setMeta(response.meta);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, status, dateFrom, dateTo, page, refreshIndex]);

  function applyFilters(next: Partial<{ search: string; status: string; dateFrom: string; dateTo: string }>) {
    setPage(1);
    if (next.search !== undefined) setSearch(next.search);
    if (next.status !== undefined) setStatus(next.status);
    if (next.dateFrom !== undefined) setDateFrom(next.dateFrom);
    if (next.dateTo !== undefined) setDateTo(next.dateTo);
  }

  async function openDetail(purchase: Purchase) {
    const fresh = await fetchPurchase(purchase.id);
    setSelectedPurchase(fresh);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Historial de Compras</h1>
          <p className="mt-1 text-sm text-slate-500">
            Consulta las compras registradas, filtra por fecha o proveedor, y anula si es necesario.
          </p>
        </div>
        {hasPermission("purchases.create") && (
          <Link
            to="/purchases/nueva"
            className="btn btn-primary"
          >
            Nueva Compra
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => applyFilters({ search: e.target.value })}
          placeholder="Buscar por N° de documento o proveedor..."
          className="field w-64"
        />
        <select
          value={status}
          onChange={(e) => applyFilters({ status: e.target.value })}
          className="field"
        >
          <option value="">Todos los estados</option>
          <option value="completed">Completado</option>
          <option value="annulled">Anulado</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => applyFilters({ dateFrom: e.target.value })}
          className="field"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => applyFilters({ dateTo: e.target.value })}
          className="field"
        />
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Documento</th>
              <th className="px-4 py-3 font-medium">Proveedor</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!isLoading && purchases.length === 0 && (
              <EmptyTableRow colSpan={6} icon={ShoppingBag} title="Aún no hay compras" description="Las compras a proveedores que registres aparecerán aquí." filtered={Boolean(search || status || dateFrom || dateTo)} />
            )}
            {!isLoading &&
              purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{purchase.document_number}</div>
                    <div className="text-xs text-slate-400">
                      {PURCHASE_DOCUMENT_TYPE_LABELS[purchase.document_type]}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {purchase.supplier?.name_or_business_name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(purchase.purchase_date).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">S/ {purchase.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`pill ${
                        purchase.status === "annulled"
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {purchase.status === "annulled" ? "Anulado" : "Completado"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openDetail(purchase)}
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
            Página {meta.current_page} de {meta.last_page} ({meta.total} compras)
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

      {selectedPurchase && (
        <PurchaseDetailModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          onAnnulled={() => {
            setSelectedPurchase(null);
            setRefreshIndex((i) => i + 1);
          }}
        />
      )}
    </div>
  );
}
