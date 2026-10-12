import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { fetchCriticalInventory, fetchDailySales, fetchPosMetrics, fetchSummary } from "../api/reports";
import type { CriticalInventoryProduct, DailySalesPoint, PosMetrics, ReportSummary } from "../types/reports";
import { CategoryBreakdown, DailySalesChart } from "./reports/charts";
import type { BreakdownItem } from "./reports/charts";

const PAYMENT_METHOD_META: Record<string, { label: string; color: BreakdownItem["color"] }> = {
  cash: { label: "Efectivo", color: "indigo" },
  yape_plin: { label: "Yape / Plin", color: "amber" },
  card: { label: "Tarjeta", color: "emerald" },
  transfer: { label: "Transferencia", color: "rose" },
};

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

function KpiCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ?? "text-slate-900"}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user, hasAnyPermission, hasPermission } = useAuth();
  const canViewReports = hasAnyPermission(["reports.view"]);

  const [todaySummary, setTodaySummary] = useState<ReportSummary | null>(null);
  const [monthSummary, setMonthSummary] = useState<ReportSummary | null>(null);
  const [dailySales, setDailySales] = useState<DailySalesPoint[]>([]);
  const [posMetrics, setPosMetrics] = useState<PosMetrics | null>(null);
  const [criticalStock, setCriticalStock] = useState<CriticalInventoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(canViewReports);

  useEffect(() => {
    if (!canViewReports) return;
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      fetchSummary({ period: "today" }),
      fetchSummary({ period: "month" }),
      fetchDailySales({ period: "month" }),
      fetchPosMetrics({ period: "month" }),
      fetchCriticalInventory(),
    ])
      .then(([today, month, daily, pos, stock]) => {
        if (cancelled) return;
        setTodaySummary(today);
        setMonthSummary(month);
        setDailySales(daily);
        setPosMetrics(pos);
        setCriticalStock(stock);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canViewReports]);

  const paymentBreakdown: BreakdownItem[] = (posMetrics?.payment_methods ?? []).map((pm) => ({
    key: pm.payment_method,
    label: PAYMENT_METHOD_META[pm.payment_method]?.label ?? pm.payment_method,
    value: pm.total,
    color: PAYMENT_METHOD_META[pm.payment_method]?.color ?? "indigo",
  }));

  return (
    <div>
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Bienvenido, {user?.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{user?.email}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {user?.roles.map((role) => (
            <span key={role} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
              {role}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {hasPermission("pos.access") && (
          <Link
            to="/pos"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Nueva Venta (POS)
          </Link>
        )}
        {hasPermission("services.create") && (
          <Link
            to="/services"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            + Recepción de Equipo
          </Link>
        )}
        {hasPermission("inventory.manage") && (
          <Link
            to="/inventory/productos"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            + Nuevo Producto
          </Link>
        )}
        {hasPermission("reports.view") && (
          <Link
            to="/reports"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Ver Reportes
          </Link>
        )}
      </div>

      {canViewReports && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Ventas de hoy" value={isLoading ? "…" : formatCurrency(todaySummary?.total_sales ?? 0)} />
            <KpiCard label="Ventas del mes" value={isLoading ? "…" : formatCurrency(monthSummary?.total_sales ?? 0)} />
            <KpiCard
              label="Ganancia neta (mes)"
              value={isLoading ? "…" : formatCurrency(monthSummary?.net_profit ?? 0)}
              accent="text-emerald-600"
            />
            <KpiCard
              label="Servicios en proceso"
              value={isLoading ? "…" : String(monthSummary?.active_services ?? 0)}
            />
            <KpiCard
              label="Alertas de stock"
              value={isLoading ? "…" : String(criticalStock.length)}
              hint="Productos en o bajo el mínimo"
              accent={criticalStock.length > 0 ? "text-red-600" : undefined}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="text-sm font-semibold text-slate-900">Ventas diarias del mes</h2>
              <div className="mt-4">
                {isLoading ? (
                  <p className="py-8 text-center text-sm text-slate-400">Cargando...</p>
                ) : (
                  <DailySalesChart data={dailySales} />
                )}
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Métodos de pago (mes)</h2>
              <div className="mt-4">
                {isLoading ? (
                  <p className="py-6 text-center text-sm text-slate-400">Cargando...</p>
                ) : (
                  <CategoryBreakdown items={paymentBreakdown} />
                )}
              </div>
            </div>
          </div>

          {!isLoading && criticalStock.length > 0 && (
            <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Inventario crítico</h2>
              <ul className="mt-3 divide-y divide-slate-100">
                {criticalStock.slice(0, 5).map((product) => (
                  <li key={product.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-700">{product.name}</span>
                    <span className="font-medium text-red-600">
                      {product.total_stock} / mín. {product.min_stock}
                    </span>
                  </li>
                ))}
              </ul>
              {criticalStock.length > 5 && (
                <p className="mt-2 text-xs text-slate-400">y {criticalStock.length - 5} producto(s) más...</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
