import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { createRole, deleteRole, fetchRoles, syncRolePermissions, updateRole } from "../../api/roles";
import { fetchPermissions } from "../../api/permissions";
import { useAuth } from "../../context/useAuth";
import type { Role, Permission } from "../../types/rbac";

const PROTECTED_ROLES = ["Super Admin", "Usuario"];

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("roles.create");
  const canUpdate = hasPermission("roles.update");
  const canDelete = hasPermission("roles.delete");
  const canAssign = hasPermission("permissions.assign");

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function loadRoles() {
    const data = await fetchRoles();
    setRoles(data);
    return data;
  }

  useEffect(() => {
    fetchRoles().then(setRoles);
    fetchPermissions().then(setPermissions);
  }, []);

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  function selectRole(role: Role) {
    setSelectedRoleId(role.id);
    setRoleName(role.name);
    setSelectedPermissions(role.permissions);
  }

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, Permission[]>();
    for (const permission of permissions) {
      const [resource] = permission.name.split(".");
      if (!groups.has(resource)) groups.set(resource, []);
      groups.get(resource)!.push(permission);
    }
    return groups;
  }, [permissions]);

  function togglePermission(name: string) {
    setSelectedPermissions((current) =>
      current.includes(name) ? current.filter((p) => p !== name) : [...current, name],
    );
  }

  async function handleCreateRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const role = await createRole(newRoleName, []);
      setNewRoleName("");
      await loadRoles();
      selectRole(role);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message : "No se pudo crear el rol.");
    }
  }

  async function handleSaveRole() {
    if (!selectedRole) return;
    setIsSaving(true);
    setError(null);
    try {
      if (!PROTECTED_ROLES.includes(selectedRole.name) && roleName !== selectedRole.name) {
        await updateRole(selectedRole.id, roleName);
      }
      await syncRolePermissions(selectedRole.id, selectedPermissions);
      await loadRoles();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message : "No se pudo guardar el rol.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteRole() {
    if (!selectedRole) return;
    if (!window.confirm(`¿Eliminar el rol "${selectedRole.name}"?`)) return;
    try {
      await deleteRole(selectedRole.id);
      setSelectedRoleId(null);
      await loadRoles();
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message : "No se pudo eliminar el rol.");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="rounded-xl bg-white p-4 shadow-sm md:col-span-1">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Roles</h2>

        <ul className="mb-4 space-y-1">
          {roles.map((role) => (
            <li key={role.id}>
              <button
                type="button"
                onClick={() => selectRole(role)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                  selectedRoleId === role.id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {role.name}
                <span className="ml-2 text-xs opacity-70">({role.users_count ?? 0})</span>
              </button>
            </li>
          ))}
        </ul>

        {canCreate && (
          <form onSubmit={handleCreateRole} className="flex gap-2">
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Nombre del rol"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              +
            </button>
          </form>
        )}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
        {!selectedRole && (
          <p className="text-sm text-slate-400">Selecciona un rol para ver sus permisos.</p>
        )}

        {selectedRole && (
          <>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="mb-4 flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre del rol</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  disabled={!canUpdate || PROTECTED_ROLES.includes(selectedRole.name)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                />
              </div>
              {canDelete && !PROTECTED_ROLES.includes(selectedRole.name) && (
                <button
                  type="button"
                  onClick={handleDeleteRole}
                  className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Eliminar rol
                </button>
              )}
            </div>

            {selectedRole.name === "Super Admin" && (
              <p className="mb-4 text-xs text-slate-400">
                Super Admin tiene acceso total al sistema independientemente de los permisos
                marcados aquí.
              </p>
            )}

            <div className="space-y-4">
              {[...groupedPermissions.entries()].map(([resource, perms]) => (
                <div key={resource}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {resource}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {perms.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.name)}
                          onChange={() => togglePermission(permission.name)}
                          disabled={!canAssign}
                          className="rounded border-slate-300"
                        />
                        {permission.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {(canAssign || canUpdate) && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveRole}
                  disabled={isSaving}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
