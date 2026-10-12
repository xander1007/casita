import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  exportInventory12Csv,
  exportInventory12Txt,
  exportKardex13Csv,
  exportKardex13Txt,
  exportRiceCsv,
  exportRiceTxt,
  exportRvieCsv,
  exportRvieTxt,
  fetchInventory12,
  fetchKardex13,
  fetchRice,
  fetchRvie,
} from "../../api/reports";
import type { PaginationMeta } from "../../types/common";
import type { Inventory12Row, Kardex13Row, RiceRow, RvieRow, SunatPeriodFilters } from "../../types/reports";
import { useAuth } from "../../context/useAuth";

type Tab = "rvie" | "rice" | "kardex13" | "inventory12";

const TABS: { value: Tab; label: string }[] = [
  { value: "rvie", label: "Ventas SUNAT (SIRE)" },
  { value: "rice", label: "Compras SUNAT (SIRE)" },
  { value: "kardex13", label: "Kardex 13.1" },
  { value: "inventory12", label: "Inventario Físico 12.1" },
];

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const MOVEMENT_LABELS: Record<string, string> = { in: "Entrada", out: "Salida", adjustment: "Ajuste" };

function currentYear(): number {
  return new Date().getFullYear();
}

function currentMonth(): number {
  return new Date().getMonth() + 1;
}

function PeriodSelector({
  filters,
  useCustomRange,
  onCustomRangeChange,
  onChange,
}: {
  filters: SunatPeriodFilters;
  useCustomRange: boolean;
  onCustomRangeChange: (custom: boolean) => void;
  onChange: (next: SunatPeriodFilters) => void;
}) {
  const years = Array.from({ length: 5 }, (_, i) => currentYear() - i);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex overflow-hidden rounded-md border border-slate-300">
        <button
          type="button"
          onClick={() => onCustomRangeChange(false)}
          className={`px-3 py-2 text-sm font-medium transition ${
            !useCustomRange ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Mes / Año
        </button>
        <button
          type="button"
          onClick={() => onCustomRangeChange(true)}
          className={`px-3 py-2 text-sm font-medium transition ${
            useCustomRange ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Rango de fechas
        </button>
      </div>

      {!useCustomRange ? (
        <div className="flex items-center gap-2">
          <select
            value={filters.month}
            onChange={(e) => onChange({ ...filters, month: Number(e.target.value) })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {MONTHS.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={filters.year}
            onChange={(e) => onChange({ ...filters, year: Number(e.target.value) })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.date_from ?? ""}
            onChange={(e) => onChange({ ...filters, date_from: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-400">a</span>
          <input
            type="date"
            value={filters.date_to ?? ""}
            onChange={(e) => onChange({ ...filters, date_to: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}
    </div>
  );
}

export default function SunatReportsPage() {
  const { hasPermission } = useAuth();
  const canSeeSunat = hasPermission("reports.sunat");

  const [tab, setTab] = useState<Tab>("rvie");
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [filters, setFilters] = useState<SunatPeriodFilters>({ year: currentYear(), month: currentMonth() });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [exportingFormat, setExportingFormat] = useState<"txt" | "csv" | null>(null);

  const [rvieRows, setRvieRows] = useState<RvieRow[]>([]);
  const [riceRows, setRiceRows] = useState<RiceRow[]>([]);
  const [kardex13Rows, setKardex13Rows] = useState<Kardex13Row[]>([]);
  const [inventory12Rows, setInventory12Rows] = useState<Inventory12Row[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const effectiveFilters: SunatPeriodFilters = useCustomRange
    ? { ...filters, date_from: filters.date_from, date_to: filters.date_to }
    : { year: filters.year, month: filters.month };

  useEffect(() => {
    setPage(1);
  }, [tab, useCustomRange, filters.year, filters.month, filters.date_from, filters.date_to]);

  useEffect(() => {
    if (!canSeeSunat) return;
    if (useCustomRange && (!filters.date_from || !filters.date_to)) return;

    let cancelled = false;
    setIsLoading(true);

    const request =
      tab === "rvie"
        ? fetchRvie({ ...effectiveFilters, page })
        : tab === "rice"
          ? fetchRice({ ...effectiveFilters, page })
          : tab === "kardex13"
            ? fetchKardex13({ ...effectiveFilters, page })
            : fetchInventory12({ ...effectiveFilters, page });

    request
      .then((response) => {
        if (cancelled) return;
        if (tab === "rvie") setRvieRows(response.data as RvieRow[]);
        else if (tab === "rice") setRiceRows(response.data as RiceRow[]);
        else if (tab === "kardex13") setKardex13Rows(response.data as Kardex13Row[]);
        else setInventory12Rows(response.data as Inventory12Row[]);
        setMeta(response.meta);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, useCustomRange, filters.year, filters.month, filters.date_from, filters.date_to, canSeeSunat]);

  async function handleExport(format: "txt" | "csv") {
    if (useCustomRange && (!filters.date_from || !filters.date_to)) return;

    setExportingFormat(format);
    try {
      if (tab === "rvie") await (format === "txt" ? exportRvieTxt(effectiveFilters) : exportRvieCsv(effectiveFilters));
      else if (tab === "rice") await (format === "txt" ? exportRiceTxt(effectiveFilters) : exportRiceCsv(effectiveFilters));
      else if (tab === "kardex13")
        await (format === "txt" ? exportKardex13Txt(effectiveFilters) : exportKardex13Csv(effectiveFilters));
      else await (format === "txt" ? exportInventory12Txt(effectiveFilters) : exportInventory12Csv(effectiveFilters));
    } finally {
      setExportingFormat(null);
    }
  }

  if (!canSeeSunat) {
    return null;
  }

  const columnCount =
    tab === "rvie" ? 9 : tab === "rice" ? 10 : tab === "kardex13" ? 8 : 7;

  return (
    <div>
      <Link to="/reports" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
        ← Volver a Reportes
      </Link>

      <h1 className="mt-2 text-xl font-semibold text-slate-900">Reportes Oficiales SUNAT (SIRE / PLE)</h1>
      <p className="mt-1 text-sm text-slate-500">
        Registro de Ventas (RVIE), Registro de Compras (RICE), Kardex Valorizado y Registro de Inventario Físico
        listos para el SIRE.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <PeriodSelector
          filters={filters}
          useCustomRange={useCustomRange}
          onCustomRangeChange={setUseCustomRange}
          onChange={setFilters}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleExport("txt")}
            disabled={exportingFormat !== null}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exportingFormat === "txt" ? "Exportando..." : "Exportar TXT para SIRE/PLE"}
          </button>
          <button
            type="button"
            onClick={() => handleExport("csv")}
            disabled={exportingFormat !== null}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exportingFormat === "csv" ? "Exportando..." : "Exportar a Excel (.csv)"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t.value ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
        {tab === "rvie" && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">CAR</th>
                <th className="px-4 py-3 font-medium">Fecha Emisión</th>
                <th className="px-4 py-3 font-medium">Tipo Comp.</th>
                <th className="px-4 py-3 font-medium">Serie-Correlativo</th>
                <th className="px-4 py-3 font-medium">Doc. Cliente</th>
                <th className="px-4 py-3 font-medium">Razón Social</th>
                <th className="px-4 py-3 font-medium">Op. Gravada</th>
                <th className="px-4 py-3 font-medium">IGV</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-6 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              )}
              {!isLoading && rvieRows.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-6 text-center text-slate-400">
                    No se encontraron ventas SUNAT (01/03) en el período.
                  </td>
                </tr>
              )}
              {!isLoading &&
                rvieRows.map((row) => (
                  <tr key={row.car}>
                    <td className="px-4 py-3 text-slate-600">{row.car}</td>
                    <td className="px-4 py-3 text-slate-600">{row.fecha_emision}</td>
                    <td className="px-4 py-3 text-slate-600">{row.tipo_comprobante}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.serie}-{row.correlativo}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.doc_cliente}</td>
                    <td className="px-4 py-3 text-slate-600">{row.razon_social}</td>
                    <td className="px-4 py-3 text-slate-600">S/ {row.op_gravada.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-600">S/ {row.igv.toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">S/ {row.total.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {tab === "rice" && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">CAR</th>
                <th className="px-4 py-3 font-medium">Fecha Emisión</th>
                <th className="px-4 py-3 font-medium">Fecha Venc.</th>
                <th className="px-4 py-3 font-medium">Tipo Comp.</th>
                <th className="px-4 py-3 font-medium">Serie-Correlativo</th>
                <th className="px-4 py-3 font-medium">Doc. Proveedor</th>
                <th className="px-4 py-3 font-medium">Razón Social</th>
                <th className="px-4 py-3 font-medium">Base Imponible</th>
                <th className="px-4 py-3 font-medium">IGV</th>
                <th className="px-4 py-3 font-medium">Importe Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-6 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              )}
              {!isLoading && riceRows.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-6 text-center text-slate-400">
                    No se encontraron compras en el período.
                  </td>
                </tr>
              )}
              {!isLoading &&
                riceRows.map((row) => (
                  <tr key={row.car}>
                    <td className="px-4 py-3 text-slate-600">{row.car}</td>
                    <td className="px-4 py-3 text-slate-600">{row.fecha_emision}</td>
                    <td className="px-4 py-3 text-slate-600">{row.fecha_vencimiento}</td>
                    <td className="px-4 py-3 text-slate-600">{row.tipo_comprobante}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.serie}-{row.correlativo}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.doc_proveedor}</td>
                    <td className="px-4 py-3 text-slate-600">{row.razon_social}</td>
                    <td className="px-4 py-3 text-slate-600">S/ {row.base_imponible.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-600">S/ {row.igv.toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">S/ {row.importe_total.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {tab === "kardex13" && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Cantidad</th>
                <th className="px-4 py-3 font-medium">Costo Unit.</th>
                <th className="px-4 py-3 font-medium">Saldo Cant.</th>
                <th className="px-4 py-3 font-medium">Costo Prom.</th>
                <th className="px-4 py-3 font-medium">Saldo Valorizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-6 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              )}
              {!isLoading && kardex13Rows.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-6 text-center text-slate-400">
                    No se encontraron movimientos en el período.
                  </td>
                </tr>
              )}
              {!isLoading &&
                kardex13Rows.map((row, index) => (
                  <tr key={`${row.product_id}-${row.date}-${index}`}>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.product}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(row.date).toLocaleString("es-PE")}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.type === "in" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {row.type === "in" ? "Entrada" : "Salida"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.quantity}</td>
                    <td className="px-4 py-3 text-slate-600">S/ {row.unit_cost.toFixed(4)}</td>
                    <td className="px-4 py-3 text-slate-600">{row.balance_quantity}</td>
                    <td className="px-4 py-3 text-slate-600">S/ {row.average_cost.toFixed(4)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">S/ {row.balance_value.toFixed(2)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {tab === "inventory12" && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Almacén</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Unidad</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Cantidad</th>
                <th className="px-4 py-3 font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-6 text-center text-slate-400">
                    Cargando...
                  </td>
                </tr>
              )}
              {!isLoading && inventory12Rows.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-6 text-center text-slate-400">
                    No se encontraron movimientos en el período.
                  </td>
                </tr>
              )}
              {!isLoading &&
                inventory12Rows.map((row, index) => (
                  <tr key={`${row.product}-${row.warehouse}-${row.date}-${index}`}>
                    <td className="px-4 py-3 text-slate-600">{new Date(row.date).toLocaleString("es-PE")}</td>
                    <td className="px-4 py-3 text-slate-600">{row.warehouse}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.product}</td>
                    <td className="px-4 py-3 text-slate-600">{row.unit}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.type === "in"
                            ? "bg-emerald-100 text-emerald-700"
                            : row.type === "out"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {MOVEMENT_LABELS[row.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.quantity}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.balance_quantity}</td>
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
    </div>
  );
}
