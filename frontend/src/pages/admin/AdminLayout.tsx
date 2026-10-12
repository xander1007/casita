import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function AdminLayout() {
  const { hasPermission } = useAuth();

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium ${
      isActive ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-200"
    }`;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Administración</h1>
      <p className="mt-1 text-sm text-slate-500">
        Gestión de usuarios, roles y permisos del sistema.
      </p>

      <nav className="mt-6 flex gap-2 border-b border-slate-200 pb-3">
        {hasPermission("users.view") && (
          <NavLink to="/admin/usuarios" className={tabClass}>
            Usuarios
          </NavLink>
        )}
        {hasPermission("roles.view") && (
          <NavLink to="/admin/roles" className={tabClass}>
            Roles y Permisos
          </NavLink>
        )}
      </nav>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
