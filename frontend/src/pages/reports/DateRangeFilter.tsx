import type { ReportPeriod, ReportRangeFilters } from "../../types/reports";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "custom", label: "Personalizado" },
];

interface DateRangeFilterProps {
  value: ReportRangeFilters;
  onChange: (next: ReportRangeFilters) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex overflow-hidden rounded-md border border-slate-300">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange({ ...value, period: p.value })}
            className={`px-3 py-2 text-sm font-medium transition ${
              value.period === p.value
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value.period === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.date_from ?? ""}
            onChange={(e) => onChange({ ...value, date_from: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-400">a</span>
          <input
            type="date"
            value={value.date_to ?? ""}
            onChange={(e) => onChange({ ...value, date_to: e.target.value })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}
    </div>
  );
}
