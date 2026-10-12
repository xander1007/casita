import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function InventoryLayout() {
  const { hasPermission } = useAuth();

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium ${
      isActive ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-200"
    }`;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Inventario</h1>
      <p className="mt-1 text-sm text-slate-500">
        Catálogo de productos, categorías, marcas y almacenes.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {hasPermission("inventory.view") && (
          <>
            <NavLink to="/inventory/productos" className={tabClass}>
              Productos
            </NavLink>
            <NavLink to="/inventory/categorias" className={tabClass}>
              Categorías
            </NavLink>
            <NavLink to="/inventory/marcas" className={tabClass}>
              Marcas
            </NavLink>
            <NavLink to="/inventory/almacenes" className={tabClass}>
              Almacenes
            </NavLink>
          </>
        )}
      </nav>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
