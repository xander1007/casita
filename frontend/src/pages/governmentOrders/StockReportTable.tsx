import type { StockReport } from "../../types/governmentOrders";
import { STOCK_LINE_STATUS_LABELS, STOCK_LINE_STATUS_STYLES } from "../../types/governmentOrders";

interface StockReportTableProps {
  report: StockReport;
}

function SummaryTile({ label, value, tone = "text-slate-900" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

export function StockReportTable({ report }: StockReportTableProps) {
  const { summary } = report;

  return (
    <div>
      <div
        className={`rounded-md px-3 py-2 text-sm ${
          summary.can_fulfill ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
        }`}
      >
        {summary.can_fulfill
          ? "El stock actual cubre toda la orden. No es necesario comprar."
          : `Para completar la entrega hay que comprar ${summary.units_to_buy} unidad(es) en ${summary.lines_to_buy} ítem(s).`}
        <span className="ml-1 text-xs opacity-75">
          Stock considerado: {report.warehouse ? `almacén ${report.warehouse.name}` : "todos los almacenes"}.
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryTile label="Unidades solicitadas" value={String(summary.units_required)} />
        <SummaryTile label="Cubiertas con stock" value={String(summary.units_covered)} tone="text-emerald-700" />
        <SummaryTile
          label="Por comprar"
          value={String(summary.units_to_buy)}
          tone={summary.units_to_buy > 0 ? "text-red-600" : "text-slate-900"}
        />
        <SummaryTile label="Costo estimado de compra" value={`S/ ${summary.estimated_purchase_cost.toFixed(2)}`} />
      </div>

      <div className="mt-3 overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 text-right font-medium">Solicitado</th>
              <th className="px-3 py-2 text-right font-medium">Stock disponible</th>
              <th className="px-3 py-2 text-right font-medium">Por comprar</th>
              <th className="px-3 py-2 text-right font-medium">Costo est.</th>
              <th className="px-3 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.lines.map((line) => (
              <tr key={line.product_id} className={line.to_buy > 0 ? "bg-red-50/40" : undefined}>
                <td className="px-3 py-2 align-top">
                  <div className="font-medium text-slate-900">{line.product_name}</div>
                  <div className="text-xs text-slate-400">
                    {line.internal_code} · {line.unit_of_measure}
                  </div>
                  {line.stock_by_warehouse.length > 0 && (
                    <div className="mt-0.5 text-xs text-slate-400">
                      {line.stock_by_warehouse.map((s) => `${s.warehouse ?? "-"}: ${s.quantity}`).join(" · ")}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-right align-top">{line.required}</td>
                <td className="px-3 py-2 text-right align-top">{line.available ?? "—"}</td>
                <td
                  className={`px-3 py-2 text-right align-top font-semibold ${
                    line.to_buy > 0 ? "text-red-600" : "text-slate-400"
                  }`}
                >
                  {line.to_buy}
                </td>
                <td className="px-3 py-2 text-right align-top text-slate-600">
                  {line.to_buy > 0 ? `S/ ${line.estimated_cost.toFixed(2)}` : "—"}
                </td>
                <td className="px-3 py-2 align-top">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STOCK_LINE_STATUS_STYLES[line.status]}`}>
                    {STOCK_LINE_STATUS_LABELS[line.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Calculado con el stock al {new Date(report.generated_at).toLocaleString("es-PE")}. El costo estimado usa el
        último costo de compra de cada producto.
      </p>
    </div>
  );
}
