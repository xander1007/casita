import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { fetchCurrentShift } from "../api/cash";
import type { CashShift } from "../types/cash";

function getInitials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

function CashStatusBadge({ shift }: { shift: CashShift | null }) {
  if (shift) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Caja Abierta
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Caja Cerrada
    </span>
  );
}

export function AppLayout() {
  const { user, logout, hasAnyPermission, hasPermission } = useAuth();
  const location = useLocation();

  const canSeeAdmin = hasAnyPermission(["users.view", "roles.view", "permissions.view"]);
  const canSeeInventory = hasAnyPermission(["inventory.view"]);
  const canSeeCustomers = hasAnyPermission(["customers.view"]);
  const canSeeCash = hasAnyPermission(["cash.open-close", "cash.view-history", "series.manage"]);
  const canSeePos = hasPermission("pos.access");
  const canSeeSales = hasAnyPermission(["sales.view"]);
  const canSeeDespatches = hasAnyPermission(["despatches.view"]);
  const canSeePurchases = hasAnyPermission(["purchases.view"]);
  const canSeeQuotations = hasAnyPermission(["quotations.view"]);
  const canSeeSalesOrders = hasAnyPermission(["sales-orders.view"]);
  const canSeeGovernmentOrders = hasAnyPermission(["government-orders.view"]);
  const canSeeSettlements = hasAnyPermission(["settlements.view"]);
  const canSeeServices = hasAnyPermission(["services.view"]);
  const canSeeReports = hasAnyPermission(["reports.view"]);
  const canSeeCashStatus = hasAnyPermission(["cash.open-close", "pos.access"]);

  const [shift, setShift] = useState<CashShift | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const primaryRole = user?.roles[0] ?? "Sin rol";

  useEffect(() => {
    if (!canSeeCashStatus) return;

    fetchCurrentShift()
      .then(setShift)
      .catch(() => setShift(null));
  }, [canSeeCashStatus, location.pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-lg font-semibold text-slate-900">SistemaCasita</span>
            <nav className="flex flex-wrap gap-4 text-sm font-medium text-slate-500">
              <NavLink
                to="/"
                end
                className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
              >
                Panel
              </NavLink>
              {canSeePos && (
                <NavLink
                  to="/pos"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  Punto de Venta
                </NavLink>
              )}
              {canSeeSales && (
                <NavLink
                  to="/sales"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  Ventas
                </NavLink>
              )}
              {canSeeQuotations && (
                <NavLink
                  to="/quotations"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  Cotizaciones
                </NavLink>
              )}
              {canSeeSalesOrders && (
                <NavLink
                  to="/sales-orders"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  Pedidos
                </NavLink>
              )}
              {canSeeServices && (
                <NavLink
                  to="/services"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  Servicio Técnico
                </NavLink>
              )}
              {canSeeDespatches && (
                <NavLink
                  to="/despatches"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  Guías de Remisión
                </NavLink>
              )}
              {canSeePurchases && (
                <NavLink
                  to="/purchases"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  Compras
                </NavLink>
              )}
              {canSeeGovernmentOrders && (
                <NavLink
                  to="/government-orders"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  OC del Estado
                </NavLink>
              )}
              {canSeeSettlements && (
                <NavLink
                  to="/settlements"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  Cancelaciones
                </NavLink>
              )}
              {canSeeInventory && (
                <NavLink
                  to="/inventory"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  Inventario
                </NavLink>
              )}
              {canSeeCustomers && (
                <NavLink
                  to="/customers"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  Clientes y Proveedores
                </NavLink>
              )}
              {canSeeCash && (
                <NavLink
                  to="/cash"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  Caja
                </NavLink>
              )}
              {canSeeReports && (
                <NavLink
                  to="/reports"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  Reportes
                </NavLink>
              )}
              {canSeeAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => (isActive ? "text-indigo-600" : "hover:text-slate-800")}
                >
                  Administración
                </NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600">
            {canSeeCashStatus && <CashStatusBadge shift={shift} />}

            {canSeePos && (
              <NavLink
                to="/pos"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                + Nueva Venta POS
              </NavLink>
            )}

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  {getInitials(user?.name)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-medium leading-tight text-slate-800">{user?.name}</span>
                  <span className="block text-xs leading-tight text-slate-400">{primaryRole}</span>
                </span>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-4 w-4 text-slate-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 z-10 mt-2 w-52 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-2">
                    <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
                    <p className="truncate text-xs text-slate-400">{user?.email}</p>
                    <p className="mt-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {primaryRole}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
