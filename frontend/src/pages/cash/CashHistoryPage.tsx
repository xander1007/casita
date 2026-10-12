import { useEffect, useState } from "react";
import { fetchShiftHistory } from "../../api/cash";
import type { CashShift } from "../../types/cash";
import type { PaginationMeta } from "../../types/common";

export default function CashHistoryPage() {
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchShiftHistory(page)
      .then((response) => {
        if (cancelled) return;
        setShifts(response.data);
        setMeta(response.meta);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  function goToPage(nextPage: number) {
    setIsLoading(true);
    setPage(nextPage);
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Caja</th>
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Apertura</th>
              <th className="px-4 py-3 font-medium">Cierre</th>
              <th className="px-4 py-3 font-medium">Monto inicial</th>
              <th className="px-4 py-3 font-medium">Monto real</th>
              <th className="px-4 py-3 font-medium">Diferencia</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!isLoading && shifts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  Sin turnos registrados.
                </td>
              </tr>
            )}
            {!isLoading &&
              shifts.map((shift) => (
                <tr key={shift.id}>
                  <td className="px-4 py-3 text-slate-900">{shift.cash_register?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{shift.user ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(shift.opened_at).toLocaleString("es-PE")}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {shift.closed_at ? new Date(shift.closed_at).toLocaleString("es-PE") : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    S/ {shift.opening_balance.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {shift.closing_balance !== null ? `S/ ${shift.closing_balance.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {shift.difference !== null ? (
                      <span
                        className={
                          shift.difference === 0
                            ? "text-emerald-600"
                            : shift.difference > 0
                              ? "text-sky-600"
                              : "text-red-600"
                        }
                      >
                        S/ {shift.difference.toFixed(2)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        shift.status === "open"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {shift.status === "open" ? "Abierta" : "Cerrada"}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Página {meta.current_page} de {meta.last_page} ({meta.total} turnos)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => goToPage(meta.current_page - 1)}
              className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => goToPage(meta.current_page + 1)}
              className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
