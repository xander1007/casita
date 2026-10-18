import type { ComponentType, ReactNode } from "react";
import { Inbox, SearchX } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Shown when the list is empty because of active filters, not because there is no data. */
  filtered?: boolean;
  action?: ReactNode;
  className?: string;
}

/** Illustrated placeholder for lists and tables with no records. */
export function EmptyState({ title, description, icon, filtered = false, action, className = "" }: EmptyStateProps) {
  const IconComponent = filtered ? SearchX : (icon ?? Inbox);

  return (
    <div className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      <div className="relative mb-4">
        <div className="absolute inset-0 -m-3 rounded-full bg-indigo-50" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <IconComponent className="h-7 w-7 text-indigo-500" strokeWidth={1.6} />
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Table row wrapper so an EmptyState spans the whole table width. */
export function EmptyTableRow({ colSpan, ...props }: EmptyStateProps & { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <EmptyState {...props} />
      </td>
    </tr>
  );
}
