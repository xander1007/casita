import { useEffect, useState } from "react";
import { deleteUser, fetchUsers, updateUserStatus } from "../../api/users";
import { fetchRoles } from "../../api/roles";
import { useAuth } from "../../context/useAuth";
import { UserFormModal } from "./UserFormModal";
import type { User } from "../../types/auth";
import type { Role } from "../../types/rbac";
import type { PaginationMeta } from "../../types/common";
import { EmptyTableRow } from "../../components/ui/EmptyState";
import { Users } from "lucide-react";

export default function UsersPage() {
  const { user: currentUser, hasPermission } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [modalUser, setModalUser] = useState<User | null | "new">(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const canCreate = hasPermission("users.create");
  const canUpdate = hasPermission("users.update");
  const canManageStatus = hasPermission("users.manage-status");
  const canDelete = hasPermission("users.delete");

  function refresh() {
    setIsLoading(true);
    setRefreshIndex((i) => i + 1);
  }

  function goToPage(nextPage: number) {
    setIsLoading(true);
    setPage(nextPage);
  }

  function applyFilters(next: { search?: string; role?: string; status?: "" | "true" | "false" }) {
    setIsLoading(true);
    setPage(1);
    if (next.search !== undefined) setSearch(next.search);
    if (next.role !== undefined) setRoleFilter(next.role);
    if (next.status !== undefined) setStatusFilter(next.status);
  }

  useEffect(() => {
    let cancelled = false;

    fetchUsers({
      search: search || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      page,
    })
      .then((response) => {
        if (cancelled) return;
        setUsers(response.data);
        setMeta(response.meta);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, roleFilter, statusFilter, page, refreshIndex]);

  useEffect(() => {
    fetchRoles().then(setRoles);
  }, []);

  async function handleToggleStatus(target: User) {
    await updateUserStatus(target.id, !target.is_active);
    refresh();
  }

  async function handleDelete(target: User) {
    if (!window.confirm(`¿Eliminar a ${target.name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    await deleteUser(target.id);
    refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => applyFilters({ search: e.target.value })}
            placeholder="Buscar por nombre o correo..."
            className="field"
          />
          <select
            value={roleFilter}
            onChange={(e) => applyFilters({ role: e.target.value })}
            className="field"
          >
            <option value="">Todos los roles</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => applyFilters({ status: e.target.value as "" | "true" | "false" })}
            className="field"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => setModalUser("new")}
            className="btn btn-primary"
          >
            + Nuevo usuario
          </button>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Roles</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!isLoading && users.length === 0 && (
              <EmptyTableRow colSpan={5} icon={Users} title="No hay usuarios" description="Crea el primer usuario para darle acceso al sistema." filtered={Boolean(search || roleFilter)} />
            )}
            {!isLoading &&
              users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((role) => (
                        <span
                          key={role}
                          className="pill bg-slate-100 text-slate-600"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`pill ${
                        u.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {u.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs font-medium">
                      {canUpdate && (
                        <button
                          type="button"
                          onClick={() => setModalUser(u)}
                          className="text-indigo-600 hover:underline"
                        >
                          Editar
                        </button>
                      )}
                      {canManageStatus && (
                        <button
                          type="button"
                          disabled={u.id === currentUser?.id}
                          onClick={() => handleToggleStatus(u)}
                          className="text-slate-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {u.is_active ? "Deshabilitar" : "Habilitar"}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          disabled={u.id === currentUser?.id}
                          onClick={() => handleDelete(u)}
                          className="text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Página {meta.current_page} de {meta.last_page} ({meta.total} usuarios)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => goToPage(meta.current_page - 1)}
              className="btn-sm btn-secondary"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => goToPage(meta.current_page + 1)}
              className="btn-sm btn-secondary"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {modalUser !== null && (
        <UserFormModal
          user={modalUser === "new" ? null : modalUser}
          roles={roles}
          onClose={() => setModalUser(null)}
          onSaved={() => {
            setModalUser(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
