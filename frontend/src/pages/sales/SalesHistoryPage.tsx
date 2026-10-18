import { useEffect, useState } from "react";
import { fetchSale, fetchSales } from "../../api/sales";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPES } from "../../types/sales";
import type { Sale } from "../../types/sales";
import type { PaginationMeta } from "../../types/common";
import { SaleDetailModal } from "./SaleDetailModal";
import { EmptyTableRow } from "../../components/ui/EmptyState";
import { Receipt } from "lucide-react";

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchSales({
      search: search || undefined,
      document_type: documentType || undefined,
      status: status || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
    })
      .then((response) => {
        if (cancelled) return;
        setSales(response.data);
        setMeta(response.meta);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, documentType, status, dateFrom, dateTo, page, refreshIndex]);

  function applyFilters(next: Partial<{ search: string; documentType: string; status: string; dateFrom: string; dateTo: string }>) {
    setPage(1);
    if (next.search !== undefined) setSearch(next.search);
    if (next.documentType !== undefined) setDocumentType(next.documentType);
    if (next.status !== undefined) setStatus(next.status);
    if (next.dateFrom !== undefined) setDateFrom(next.dateFrom);
    if (next.dateTo !== undefined) setDateTo(next.dateTo);
  }

  async function openDetail(sale: Sale) {
    const fresh = await fetchSale(sale.id);
    setSelectedSale(fresh);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Historial de Ventas</h1>
      <p className="mt-1 text-sm text-slate-500">
        Consulta los comprobantes emitidos, filtra por fecha o tipo, y anula si es necesario.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => applyFilters({ search: e.target.value })}
          placeholder="Buscar por correlativo o cliente..."
          className="field w-64"
        />
        <select
          value={documentType}
          onChange={(e) => applyFilters({ documentType: e.target.value })}
          className="field"
        >
          <option value="">Todos los comprobantes</option>
          {DOCUMENT_TYPES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
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
              <th className="px-4 py-3 font-medium">Comprobante</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
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
            {!isLoading && sales.length === 0 && (
              <EmptyTableRow colSpan={6} icon={Receipt} title="Aún no hay ventas" description="Los comprobantes emitidos desde el Punto de Venta aparecerán aquí." filtered={Boolean(search || documentType || status || dateFrom || dateTo)} />
            )}
            {!isLoading &&
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{sale.document_number}</div>
                    <div className="text-xs text-slate-400">{DOCUMENT_TYPE_LABELS[sale.document_type]}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {sale.contact?.name_or_business_name ?? "Clientes Varios"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(sale.created_at).toLocaleString("es-PE")}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">S/ {sale.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`pill ${
                        sale.status === "annulled"
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {sale.status === "annulled" ? "Anulado" : "Completado"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openDetail(sale)}
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
            Página {meta.current_page} de {meta.last_page} ({meta.total} ventas)
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

      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onAnnulled={() => {
            setSelectedSale(null);
            setRefreshIndex((i) => i + 1);
          }}
        />
      )}
    </div>
  );
}
