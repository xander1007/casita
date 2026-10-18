import { useEffect, useState } from "react";
import { fetchDespatches } from "../../api/despatches";
import { DespatchReceptionModal } from "./DespatchReceptionModal";
import { DespatchPrintModal } from "./DespatchPrintModal";
import type { Despatch } from "../../types/despatches";
import type { PaginationMeta } from "../../types/common";
import { useAuth } from "../../context/useAuth";
import { EmptyTableRow } from "../../components/ui/EmptyState";
import { Truck } from "lucide-react";

export default function DespatchesListPage() {
  const { hasPermission } = useAuth();
  const [despatches, setDespatches] = useState<Despatch[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [showReception, setShowReception] = useState(false);
  const [printId, setPrintId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchDespatches({ search: search || undefined, page })
      .then((response) => {
        if (cancelled) return;
        setDespatches(response.data);
        setMeta(response.meta);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, page, refreshIndex]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Guías de Remisión</h1>
          <p className="mt-1 text-sm text-slate-500">
            Emite y consulta las guías de remisión electrónica remitente.
          </p>
        </div>
        {hasPermission("despatches.create") && (
          <button
            type="button"
            onClick={() => setShowReception(true)}
            className="btn btn-primary"
          >
            + Nueva Guía
          </button>
        )}
      </div>

      <div className="mt-4">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Buscar por número o destinatario..."
          className="field w-72"
        />
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Guía</th>
              <th className="px-4 py-3 font-medium">Destinatario</th>
              <th className="px-4 py-3 font-medium">Motivo</th>
              <th className="px-4 py-3 font-medium">Fecha traslado</th>
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
            {!isLoading && despatches.length === 0 && (
              <EmptyTableRow colSpan={6} icon={Truck} title="Aún no hay guías de remisión" description="Las guías que emitas para trasladar mercadería aparecerán aquí." filtered={Boolean(search)} />
            )}
            {!isLoading &&
              despatches.map((despatch) => (
                <tr key={despatch.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{despatch.document_number}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {despatch.contact?.name_or_business_name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{despatch.transport_reason ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {despatch.transport_start_date
                      ? new Date(`${despatch.transport_start_date.slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE")
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`pill ${
                        despatch.status === "annulled"
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {despatch.status === "annulled" ? "Anulada" : "Emitida"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setPrintId(despatch.id)}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      Ver / Imprimir
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
            Página {meta.current_page} de {meta.last_page} ({meta.total} guías)
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

      {showReception && (
        <DespatchReceptionModal
          onClose={() => setShowReception(false)}
          onCreated={(despatch) => {
            setShowReception(false);
            setRefreshIndex((i) => i + 1);
            setPrintId(despatch.id);
          }}
        />
      )}

      {printId && <DespatchPrintModal despatchId={printId} onClose={() => setPrintId(null)} />}
    </div>
  );
}
