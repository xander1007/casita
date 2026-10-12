import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { Modal } from "../../components/Modal";
import { createUser, syncUserRoles, updateUser } from "../../api/users";
import type { User } from "../../types/auth";
import type { Role } from "../../types/rbac";

interface UserFormModalProps {
  user: User | null;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}

export function UserFormModal({ user, roles, onClose, onSaved }: UserFormModalProps) {
  const isEditing = user !== null;

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles ?? []);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleRole(roleName: string) {
    setSelectedRoles((current) =>
      current.includes(roleName)
        ? current.filter((r) => r !== roleName)
        : [...current, roleName],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await updateUser(user.id, {
          name,
          email,
          ...(password ? { password, password_confirmation: passwordConfirmation } : {}),
        });
        await syncUserRoles(user.id, selectedRoles);
      } else {
        await createUser({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
          roles: selectedRoles,
        });
      }
      onSaved();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors ?? {});
      } else {
        setFormError("No se pudo guardar el usuario. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Editar usuario" : "Nuevo usuario"} onClose={onClose}>
      {formError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {isEditing ? "Nueva contraseña" : "Contraseña"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEditing}
              placeholder={isEditing ? "Dejar en blanco para no cambiar" : ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirmar</label>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required={!isEditing || password !== ""}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Roles</span>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <label
                key={role.id}
                className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.name)}
                  onChange={() => toggleRole(role.name)}
                  className="rounded border-slate-300"
                />
                {role.name}
              </label>
            ))}
          </div>
          {errors.roles && <p className="mt-1 text-sm text-red-600">{errors.roles[0]}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
