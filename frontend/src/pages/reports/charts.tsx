import type { DailySalesPoint } from "../../types/reports";

const CATEGORY_COLOR_CLASSES: Record<string, string> = {
  indigo: "bg-indigo-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
};

export interface BreakdownItem {
  key: string;
  label: string;
  value: number;
  color: keyof typeof CATEGORY_COLOR_CLASSES;
}

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`;
}

export function DailySalesChart({ data }: { data: DailySalesPoint[] }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">Sin ventas registradas en el período.</p>;
  }

  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex h-48 items-end gap-1 border-b border-slate-200 pb-1">
      {data.map((point) => {
        const heightPct = Math.max((point.total / max) * 100, point.total > 0 ? 4 : 0);
        const day = new Date(`${point.date}T00:00:00`).getDate();
        return (
          <div key={point.date} className="group relative flex flex-1 flex-col items-center justify-end">
            <div className="pointer-events-none absolute -top-7 hidden whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block">
              {formatCurrency(point.total)}
            </div>
            <div
              className="w-full min-w-[3px] rounded-t bg-indigo-500 transition-colors group-hover:bg-indigo-600"
              style={{ height: `${heightPct}%` }}
              title={`${point.date}: ${formatCurrency(point.total)}`}
            />
            <span className="mt-1 text-[10px] text-slate-400">{day}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CategoryBreakdown({ items }: { items: BreakdownItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (items.length === 0 || total === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Sin datos en el período.</p>;
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = total > 0 ? (item.value / total) * 100 : 0;
        const widthPct = Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0);
        return (
          <div key={item.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className={`h-2 w-2 rounded-full ${CATEGORY_COLOR_CLASSES[item.color]}`} />
                {item.label}
              </span>
              <span className="text-slate-500">
                {formatCurrency(item.value)} ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${CATEGORY_COLOR_CLASSES[item.color]}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RankedBarList({ items }: { items: { key: string; label: string; value: number; suffix?: string }[] }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Sin datos en el período.</p>;
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const widthPct = Math.max((item.value / max) * 100, 2);
        return (
          <div key={item.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">
                {index + 1}. {item.label}
              </span>
              <span className="text-slate-500">
                {item.value}
                {item.suffix ?? ""}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${widthPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
