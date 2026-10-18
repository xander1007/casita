import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChartColumn, PackagePlus, Plus, TrendingUp, TriangleAlert, Wallet, Wrench } from "lucide-react";
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

const KPI_TONES = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  sky: "bg-sky-50 text-sky-600",
} as const;

function formatCurrency(value: number): string {
  return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: ComponentType<{ className?: string }>;
  tone: keyof typeof KPI_TONES;
  isLoading: boolean;
  valueClass?: string;
}

function KpiCard({ label, value, hint, icon: KpiIcon, tone, isLoading, valueClass }: KpiCardProps) {
  return (
    <div className="card p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${KPI_TONES[tone]}`}>
          <KpiIcon className="h-5 w-5" />
        </span>
      </div>
      {isLoading ? (
        <div className="mt-3 h-8 w-28 animate-pulse rounded-md bg-slate-100" />
      ) : (
        <p className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${valueClass ?? "text-slate-900"}`}>{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function QuickAction({ to, label, icon: ActionIcon, primary = false }: { to: string; label: string; icon: ComponentType<{ className?: string }>; primary?: boolean }) {
  return (
    <Link to={to} className={`btn ${primary ? "btn-primary" : "btn-secondary"}`}>
      <ActionIcon className="h-4 w-4" />
      {label}
    </Link>
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

  const today = new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4" />
            <span className="first-letter:uppercase">{today}</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {greeting()}, {user?.name?.split(" ")[0]}
          </h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {user?.roles.map((role) => (
              <span key={role} className="pill bg-indigo-100 text-indigo-700">
                {role}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasPermission("pos.access") && <QuickAction to="/pos" label="Nueva venta" icon={Plus} primary />}
          {hasPermission("services.create") && <QuickAction to="/services" label="Recepción de equipo" icon={Wrench} />}
          {hasPermission("inventory.manage") && (
            <QuickAction to="/inventory/productos" label="Nuevo producto" icon={PackagePlus} />
          )}
          {hasPermission("reports.view") && <QuickAction to="/reports" label="Reportes" icon={ChartColumn} />}
        </div>
      </div>

      {canViewReports && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              label="Ventas de hoy"
              value={formatCurrency(todaySummary?.total_sales ?? 0)}
              icon={Wallet}
              tone="indigo"
              isLoading={isLoading}
            />
            <KpiCard
              label="Ventas del mes"
              value={formatCurrency(monthSummary?.total_sales ?? 0)}
              icon={CalendarDays}
              tone="sky"
              isLoading={isLoading}
            />
            <KpiCard
              label="Ganancia neta (mes)"
              value={formatCurrency(monthSummary?.net_profit ?? 0)}
              icon={TrendingUp}
              tone="emerald"
              valueClass="text-emerald-600"
              isLoading={isLoading}
            />
            <KpiCard
              label="Servicios en proceso"
              value={String(monthSummary?.active_services ?? 0)}
              icon={Wrench}
              tone="amber"
              isLoading={isLoading}
            />
            <KpiCard
              label="Alertas de stock"
              value={String(criticalStock.length)}
              hint="Productos en o bajo el mínimo"
              icon={TriangleAlert}
              tone={criticalStock.length > 0 ? "red" : "emerald"}
              valueClass={criticalStock.length > 0 ? "text-red-600" : undefined}
              isLoading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-2">
              <h2 className="text-sm font-semibold text-slate-900">Ventas diarias del mes</h2>
              <div className="mt-6">
                {isLoading ? (
                  <div className="h-48 animate-pulse rounded-lg bg-slate-50" />
                ) : (
                  <DailySalesChart data={dailySales} />
                )}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-900">Métodos de pago (mes)</h2>
              <div className="mt-6">
                {isLoading ? (
                  <div className="h-32 animate-pulse rounded-lg bg-slate-50" />
                ) : (
                  <CategoryBreakdown items={paymentBreakdown} />
                )}
              </div>
            </div>
          </div>

          {!isLoading && criticalStock.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <TriangleAlert className="h-4 w-4 text-red-500" />
                  Inventario crítico
                </h2>
                {hasPermission("inventory.view") && (
                  <Link to="/inventory/productos" className="text-xs font-medium text-indigo-600 hover:underline">
                    Ver inventario
                  </Link>
                )}
              </div>
              <ul className="mt-3 divide-y divide-slate-100">
                {criticalStock.slice(0, 5).map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="truncate text-slate-700">{product.name}</span>
                    <span className="pill bg-red-100 text-red-700">
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
