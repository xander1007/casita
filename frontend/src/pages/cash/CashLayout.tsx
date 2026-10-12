import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function CashLayout() {
  const { hasPermission } = useAuth();

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium ${
      isActive ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-200"
    }`;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Caja</h1>
      <p className="mt-1 text-sm text-slate-500">
        Apertura y cierre de caja, turnos y series de comprobantes SUNAT.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {hasPermission("cash.open-close") && (
          <NavLink to="/cash/actual" className={tabClass}>
            Caja Actual
          </NavLink>
        )}
        {hasPermission("cash.view-history") && (
          <NavLink to="/cash/historial" className={tabClass}>
            Historial
          </NavLink>
        )}
        {hasPermission("series.manage") && (
          <NavLink to="/cash/series" className={tabClass}>
            Series SUNAT
          </NavLink>
        )}
      </nav>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
