import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { createBrand, deleteBrand, fetchBrands, updateBrand } from "../../api/brands";
import { useAuth } from "../../context/useAuth";
import { Modal } from "../../components/Modal";
import type { Brand } from "../../types/inventory";

export default function BrandsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("inventory.manage");

  const [brands, setBrands] = useState<Brand[]>([]);
  const [modalBrand, setModalBrand] = useState<Brand | null | "new">(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    fetchBrands().then(setBrands);
  }, [refreshIndex]);

  async function handleDelete(brand: Brand) {
    if (!window.confirm(`¿Eliminar la marca "${brand.name}"?`)) return;
    await deleteBrand(brand.id);
    setRefreshIndex((i) => i + 1);
  }

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setModalBrand("new")}
            className="btn btn-primary"
          >
            + Nueva marca
          </button>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              {canManage && <th className="px-4 py-3 font-medium">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td className="px-4 py-3 text-slate-900">{brand.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`pill ${
                      brand.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {brand.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setModalBrand(brand)}
                        className="text-indigo-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(brand)}
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

      {modalBrand !== null && (
        <BrandFormModal
          brand={modalBrand === "new" ? null : modalBrand}
          onClose={() => setModalBrand(null)}
          onSaved={() => {
            setModalBrand(null);
            setRefreshIndex((i) => i + 1);
          }}
        />
      )}
    </div>
  );
}

function BrandFormModal({
  brand,
  onClose,
  onSaved,
}: {
  brand: Brand | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(brand?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (brand) {
        await updateBrand(brand.id, { name });
      } else {
        await createBrand(name);
      }
      onSaved();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.errors?.name?.[0] ?? "No se pudo guardar la marca.")
          : "No se pudo guardar la marca.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={brand ? "Editar marca" : "Nueva marca"} onClose={onClose}>
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
            className="field w-full"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
