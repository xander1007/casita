import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BadgeCheck,
  ChartColumn,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Plus,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sun,
  Truck,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/useTheme";
import { fetchCurrentShift } from "../api/cash";
import type { CashShift } from "../types/cash";

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

interface NavItem {
  to: string;
  label: string;
  icon: Icon;
  visible: boolean;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const COLLAPSED_STORAGE_KEY = "casita_sidebar_collapsed";

function getInitials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function CashStatusBadge({ shift }: { shift: CashShift | null }) {
  return shift ? (
    <Link to="/cash/actual" className="pill bg-emerald-100 text-emerald-700 hover:bg-emerald-50">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Caja Abierta
    </Link>
  ) : (
    <Link to="/cash/actual" className="pill bg-red-100 text-red-700 hover:bg-red-50">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Caja Cerrada
    </Link>
  );
}

function SidebarNav({ groups, collapsed, onNavigate }: { groups: NavGroup[]; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
      {groups.map((group) => (
        <div key={group.label}>
          {collapsed ? (
            <div className="mx-2 mb-2 border-t border-ink-800" />
          ) : (
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-ink-500 uppercase">{group.label}</p>
          )}
          <ul className="space-y-0.5">
            {group.items.map(({ to, label, icon: ItemIcon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  title={collapsed ? label : undefined}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-lg px-3 py-[7px] text-sm font-medium transition-colors ${
                      collapsed ? "justify-center" : ""
                    } ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-950/40"
                        : "text-ink-300 hover:bg-ink-800 hover:text-white"
                    }`
                  }
                >
                  <ItemIcon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
                  {!collapsed && <span className="truncate">{label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link to="/" className={`flex h-16 shrink-0 items-center gap-3 px-5 ${collapsed ? "justify-center px-0" : ""}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-bold text-white shadow-md shadow-indigo-950/50">
        SC
      </span>
      {!collapsed && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-white">SistemaCasita</span>
          <span className="block text-[11px] text-ink-400">Gestión comercial</span>
        </span>
      )}
    </Link>
  );
}

export function AppLayout() {
  const { user, logout, hasAnyPermission, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const canSeePos = hasPermission("pos.access");
  const canSeeCashStatus = hasAnyPermission(["cash.open-close", "pos.access"]);

  const groups: NavGroup[] = [
    {
      label: "General",
      items: [{ to: "/", label: "Panel", icon: LayoutDashboard, visible: true, end: true }],
    },
    {
      label: "Ventas & POS",
      items: [
        { to: "/pos", label: "Punto de Venta", icon: ShoppingCart, visible: canSeePos },
        { to: "/sales", label: "Ventas", icon: Receipt, visible: hasAnyPermission(["sales.view"]) },
        { to: "/quotations", label: "Cotizaciones", icon: FileText, visible: hasAnyPermission(["quotations.view"]) },
        { to: "/sales-orders", label: "Pedidos", icon: ClipboardList, visible: hasAnyPermission(["sales-orders.view"]) },
        { to: "/despatches", label: "Guías de Remisión", icon: Truck, visible: hasAnyPermission(["despatches.view"]) },
      ],
    },
    {
      label: "Compras & Estado",
      items: [
        { to: "/purchases", label: "Compras", icon: ShoppingBag, visible: hasAnyPermission(["purchases.view"]) },
        {
          to: "/government-orders",
          label: "OC del Estado",
          icon: Landmark,
          visible: hasAnyPermission(["government-orders.view"]),
        },
        { to: "/settlements", label: "Cancelaciones", icon: BadgeCheck, visible: hasAnyPermission(["settlements.view"]) },
      ],
    },
    {
      label: "Taller",
      items: [{ to: "/services", label: "Servicio Técnico", icon: Wrench, visible: hasAnyPermission(["services.view"]) }],
    },
    {
      label: "Inventario & Caja",
      items: [
        { to: "/inventory", label: "Inventario", icon: Package, visible: hasAnyPermission(["inventory.view"]) },
        { to: "/customers", label: "Clientes y Proveedores", icon: Users, visible: hasAnyPermission(["customers.view"]) },
        {
          to: "/cash",
          label: "Caja",
          icon: Wallet,
          visible: hasAnyPermission(["cash.open-close", "cash.view-history", "series.manage"]),
        },
      ],
    },
    {
      label: "Reportes & Administración",
      items: [
        { to: "/reports", label: "Reportes", icon: ChartColumn, visible: hasAnyPermission(["reports.view"]) },
        {
          to: "/admin",
          label: "Administración",
          icon: ShieldCheck,
          visible: hasAnyPermission(["users.view", "roles.view", "permissions.view"]),
        },
      ],
    },
  ]
    .map((group) => ({ ...group, items: group.items.filter((item) => item.visible) }))
    .filter((group) => group.items.length > 0);

  const currentItem = groups
    .flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
    .filter((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))
    .sort((a, b) => b.to.length - a.to.length)[0];

  const [shift, setShift] = useState<CashShift | null>(null);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const primaryRole = user?.roles[0] ?? "Sin rol";
  const isPos = location.pathname.startsWith("/pos");

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

  function toggleCollapsed() {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, value ? "0" : "1");
      } catch {
        // Not persisted; the toggle still works for this session.
      }
      return !value;
    });
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-ink-950">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-ink-800 bg-ink-900 transition-[width] duration-200 lg:flex ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <Brand collapsed={collapsed} />
        <SidebarNav groups={groups} collapsed={collapsed} />
        <div className="border-t border-ink-800 p-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-400 transition-colors hover:bg-ink-800 hover:text-white ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
            {!collapsed && <span>Contraer menú</span>}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-ink-900 shadow-2xl">
            <div className="flex items-center justify-between pr-3">
              <Brand collapsed={false} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-lg p-2 text-ink-400 hover:bg-ink-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav groups={groups} collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-md dark:bg-ink-900/85">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              {currentItem && (
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="hidden text-slate-400 sm:inline">{currentItem.group}</span>
                  <span className="hidden text-slate-300 sm:inline">/</span>
                  <span className="truncate font-semibold text-slate-900">{currentItem.label}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {canSeeCashStatus && (
                <span className="hidden sm:inline-flex">
                  <CashStatusBadge shift={shift} />
                </span>
              )}

              {canSeePos && !isPos && (
                <NavLink to="/pos" className="btn btn-primary hidden md:inline-flex">
                  <Plus className="h-4 w-4" />
                  Nueva venta
                </NavLink>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
                title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-slate-100"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {getInitials(user?.name)}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-[10rem] truncate text-sm font-medium leading-tight text-slate-800">
                      {user?.name}
                    </span>
                    <span className="block text-xs leading-tight text-slate-400">{primaryRole}</span>
                  </span>
                  <ChevronDown
                    className={`hidden h-4 w-4 text-slate-400 transition-transform sm:block ${isUserMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="card absolute right-0 z-30 mt-2 w-60 py-1 shadow-lg">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-medium text-slate-800">{user?.name}</p>
                      <p className="truncate text-xs text-slate-400">{user?.email}</p>
                      <p className="pill mt-2 bg-indigo-100 text-indigo-700">{primaryRole}</p>
                    </div>
                    {canSeeCashStatus && (
                      <div className="border-b border-slate-100 px-4 py-2 sm:hidden">
                        <CashStatusBadge shift={shift} />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className={`mx-auto px-4 py-6 sm:px-6 lg:py-8 ${isPos ? "max-w-[1600px] lg:py-6" : "max-w-7xl"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
