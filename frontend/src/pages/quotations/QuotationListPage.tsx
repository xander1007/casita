import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchQuotation, fetchQuotations } from "../../api/quotations";
import type { Quotation } from "../../types/quotations";
import { QUOTATION_STATUS_LABELS, QUOTATION_STATUS_STYLES } from "../../types/quotations";
import type { PaginationMeta } from "../../types/common";
import { useAuth } from "../../context/useAuth";
import { formatDate } from "../../utils/dates";
import { QuotationDetailModal } from "./QuotationDetailModal";

const inputClass =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function QuotationListPage() {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [filters, setFilters] = useState({ search: "", status: "", date_from: "", date_to: "" });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [selected, setSelected] = useState<Quotation | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchQuotations({ ...filters, page })
      .then((response) => {
        if (cancelled) return;
        setQuotations(response.data);
        setMeta(response.meta);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, page, refreshIndex]);

  // After saving a quotation the form sends us here with its id: open it right away.
  useEffect(() => {
    const openId = (location.state as { openQuotationId?: number } | null)?.openQuotationId;
    if (!openId) return;
    navigate(location.pathname, { replace: true, state: null });
    fetchQuotation(openId).then(setSelected);
  }, [location, navigate]);

  function applyFilter(key: keyof typeof filters, value: string) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function openDetail(quotation: Quotation) {
    setSelected(await fetchQuotation(quotation.id));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Cotizaciones de Venta</h1>
          <p className="mt-1 text-sm text-slate-500">
            Emite proformas, apruébalas y conviértelas en pedido o venta sin volver a digitar los productos.
          </p>
        </div>
        {hasPermission("quotations.manage") && (
          <Link
            to="/quotations/nueva"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Nueva Cotización
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={filters.search}
          onChange={(e) => applyFilter("search", e.target.value)}
          placeholder="Buscar por código o cliente..."
          className={`w-64 ${inputClass}`}
        />
        <select value={filters.status} onChange={(e) => applyFilter("status", e.target.value)} className={inputClass}>
          <option value="">Todos los estados</option>
          {Object.entries(QUOTATION_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => applyFilter("date_from", e.target.value)} className={inputClass} />
        <input type="date" value={filters.date_to} onChange={(e) => applyFilter("date_to", e.target.value)} className={inputClass} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Emisión</th>
              <th className="px-4 py-3 font-medium">Vigencia</th>
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
            {!isLoading && quotations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No se encontraron cotizaciones.
                </td>
              </tr>
            )}
            {!isLoading &&
              quotations.map((quotation) => (
                <tr key={quotation.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{quotation.code}</td>
                  <td className="px-4 py-3 text-slate-600">{quotation.contact?.name_or_business_name ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(quotation.issue_date)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(quotation.valid_until)}
                    {quotation.is_expired && <span className="ml-1 text-xs font-medium text-amber-700">(vencida)</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">S/ {quotation.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${QUOTATION_STATUS_STYLES[quotation.status]}`}>
                      {QUOTATION_STATUS_LABELS[quotation.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openDetail(quotation)}
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
            Página {meta.current_page} de {meta.last_page} ({meta.total} cotizaciones)
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

      {selected && (
        <QuotationDetailModal
          quotation={selected}
          onClose={() => setSelected(null)}
          onChanged={(updated) => {
            setSelected({ ...selected, ...updated });
            setRefreshIndex((i) => i + 1);
          }}
        />
      )}
    </div>
  );
}
