import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { exportKardex, exportSalesRegistry, fetchKardex, fetchSalesRegistry } from "../../api/reports";
import type { KardexRow, ReportRangeFilters, SalesRegistryRow } from "../../types/reports";
import type { PaginationMeta } from "../../types/common";
import { useAuth } from "../../context/useAuth";
import { DateRangeFilter } from "./DateRangeFilter";
import { EmptyTableRow } from "../../components/ui/EmptyState";
import { ArrowLeftRight, Receipt } from "lucide-react";

type Tab = "sales" | "kardex";

const STOCK_MOVEMENT_LABELS: Record<string, string> = {
  in: "Entrada",
  out: "Salida",
  adjustment: "Ajuste",
};

export default function ReportsPage() {
  const { hasPermission } = useAuth();
  const canExport = hasPermission("reports.export");
  const canSeeSunat = hasPermission("reports.sunat");

  const [tab, setTab] = useState<Tab>("sales");
  const [range, setRange] = useState<ReportRangeFilters>({ period: "month" });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [salesRows, setSalesRows] = useState<SalesRegistryRow[]>([]);
  const [kardexRows, setKardexRows] = useState<KardexRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  useEffect(() => {
    setPage(1);
  }, [tab, range.period, range.date_from, range.date_to]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const request =
      tab === "sales" ? fetchSalesRegistry({ ...range, page }) : fetchKardex({ ...range, page });

    request
      .then((response) => {
        if (cancelled) return;
        if (tab === "sales") {
          setSalesRows(response.data as SalesRegistryRow[]);
        } else {
          setKardexRows(response.data as KardexRow[]);
        }
        setMeta(response.meta);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, range, page]);

  async function handleExport() {
    setIsExporting(true);
    try {
      if (tab === "sales") {
        await exportSalesRegistry(range);
      } else {
        await exportKardex(range);
      }
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reportes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Consulta el registro de ventas y el kardex de inventario por rango de fechas.
          </p>
        </div>

        {canSeeSunat && (
          <Link
            to="/reports/sunat"
            className="btn btn-primary"
          >
            Reportes Oficiales SUNAT (SIRE/PLE) →
          </Link>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter value={range} onChange={setRange} />

        {canExport && (
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="btn btn-success"
          >
            {isExporting ? "Exportando..." : "Descargar CSV / Excel"}
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("sales")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "sales" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Registro de Ventas
        </button>
        <button
          type="button"
          onClick={() => setTab("kardex")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "kardex" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Kardex de Inventario
        </button>
      </div>

      <div className="card mt-4 overflow-x-auto">
        {tab === "sales" ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Comprobante</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Op. Gravada</th>
                <th className="px-4 py-3 font-medium">Op. Exonerada</th>
                <th className="px-4 py-3 font-medium">IGV</th>
                <th className="px-4 py-3 font-medium">Total</th>
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
              {!isLoading && salesRows.length === 0 && (
                <EmptyTableRow colSpan={7} icon={Receipt} title="Sin ventas en el período" description="Prueba con otro rango de fechas." />
              )}
              {!isLoading &&
                salesRows.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-4 py-3 text-slate-600">{new Date(sale.created_at).toLocaleDateString("es-PE")}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{sale.document_number}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {sale.contact?.name_or_business_name ?? "Clientes Varios"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">S/ {sale.op_taxed.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-600">S/ {sale.op_exonerated.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-600">S/ {sale.igv.toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">S/ {sale.total.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Almacén</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Cantidad</th>
                <th className="px-4 py-3 font-medium">Costo Unit.</th>
                <th className="px-4 py-3 font-medium">Valor</th>
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
              {!isLoading && kardexRows.length === 0 && (
                <EmptyTableRow colSpan={7} icon={ArrowLeftRight} title="Sin movimientos en el período" description="Prueba con otro rango de fechas." />
              )}
              {!isLoading &&
                kardexRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-slate-600">{new Date(row.date).toLocaleString("es-PE")}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.product}</td>
                    <td className="px-4 py-3 text-slate-600">{row.warehouse}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`pill ${
                          row.type === "in"
                            ? "bg-emerald-100 text-emerald-700"
                            : row.type === "out"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {STOCK_MOVEMENT_LABELS[row.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.quantity}</td>
                    <td className="px-4 py-3 text-slate-600">S/ {row.unit_cost.toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">S/ {row.value.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Página {meta.current_page} de {meta.last_page} ({meta.total} registros)
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
    </div>
  );
}
