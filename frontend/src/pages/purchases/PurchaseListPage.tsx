import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPurchase, fetchPurchases } from "../../api/purchases";
import type { Purchase } from "../../types/purchases";
import { PURCHASE_DOCUMENT_TYPE_LABELS } from "../../types/purchases";
import type { PaginationMeta } from "../../types/common";
import { useAuth } from "../../context/useAuth";
import { PurchaseDetailModal } from "./PurchaseDetailModal";

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
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
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
          className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={status}
          onChange={(e) => applyFilters({ status: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="completed">Completado</option>
          <option value="annulled">Anulado</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => applyFilters({ dateFrom: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => applyFilters({ dateTo: e.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
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
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No se encontraron compras.
                </td>
              </tr>
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
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
              className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage(meta.current_page + 1)}
              className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
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
