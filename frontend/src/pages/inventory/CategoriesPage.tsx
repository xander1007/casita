import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { createCategory, deleteCategory, fetchCategories, updateCategory } from "../../api/categories";
import { useAuth } from "../../context/useAuth";
import { Modal } from "../../components/Modal";
import type { Category } from "../../types/inventory";

export default function CategoriesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("inventory.manage");

  const [categories, setCategories] = useState<Category[]>([]);
  const [modalCategory, setModalCategory] = useState<Category | null | "new">(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, [refreshIndex]);

  async function handleDelete(category: Category) {
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) return;
    await deleteCategory(category.id);
    setRefreshIndex((i) => i + 1);
  }

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setModalCategory("new")}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Nueva categoría
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Descripción</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              {canManage && <th className="px-4 py-3 font-medium">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-3 text-slate-900">{category.name}</td>
                <td className="px-4 py-3 text-slate-500">{category.description ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      category.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {category.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setModalCategory(category)}
                        className="text-indigo-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        className="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalCategory !== null && (
        <CategoryFormModal
          category={modalCategory === "new" ? null : modalCategory}
          onClose={() => setModalCategory(null)}
          onSaved={() => {
            setModalCategory(null);
            setRefreshIndex((i) => i + 1);
          }}
        />
      )}
    </div>
  );
}

function CategoryFormModal({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (category) {
        await updateCategory(category.id, { name, description });
      } else {
        await createCategory({ name, description });
      }
      onSaved();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.errors?.name?.[0] ?? "No se pudo guardar la categoría.")
          : "No se pudo guardar la categoría.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={category ? "Editar categoría" : "Nueva categoría"} onClose={onClose}>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
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
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
