import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { createWarehouse, deleteWarehouse, fetchWarehouses, updateWarehouse } from "../../api/warehouses";
import { useAuth } from "../../context/useAuth";
import { Modal } from "../../components/Modal";
import type { Warehouse } from "../../types/inventory";

export default function WarehousesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("inventory.manage");

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [modalWarehouse, setModalWarehouse] = useState<Warehouse | null | "new">(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    fetchWarehouses().then(setWarehouses);
  }, [refreshIndex]);

  async function handleDelete(warehouse: Warehouse) {
    if (!window.confirm(`¿Eliminar el almacén "${warehouse.name}"?`)) return;
    await deleteWarehouse(warehouse.id);
    setRefreshIndex((i) => i + 1);
  }

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setModalWarehouse("new")}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Nuevo almacén
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Dirección</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              {canManage && <th className="px-4 py-3 font-medium">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {warehouses.map((warehouse) => (
              <tr key={warehouse.id}>
                <td className="px-4 py-3 text-slate-900">{warehouse.name}</td>
                <td className="px-4 py-3 text-slate-500">{warehouse.code}</td>
                <td className="px-4 py-3 text-slate-500">{warehouse.address ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      warehouse.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {warehouse.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setModalWarehouse(warehouse)}
                        className="text-indigo-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(warehouse)}
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

      {modalWarehouse !== null && (
        <WarehouseFormModal
          warehouse={modalWarehouse === "new" ? null : modalWarehouse}
          onClose={() => setModalWarehouse(null)}
          onSaved={() => {
            setModalWarehouse(null);
            setRefreshIndex((i) => i + 1);
          }}
        />
      )}
    </div>
  );
}

function WarehouseFormModal({
  warehouse,
  onClose,
  onSaved,
}: {
  warehouse: Warehouse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(warehouse?.name ?? "");
  const [code, setCode] = useState(warehouse?.code ?? "");
  const [address, setAddress] = useState(warehouse?.address ?? "");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    try {
      if (warehouse) {
        await updateWarehouse(warehouse.id, { name, code, address });
      } else {
        await createWarehouse({ name, code, address });
      }
      onSaved();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={warehouse ? "Editar almacén" : "Nuevo almacén"} onClose={onClose}>
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
          <label className="mb-1 block text-sm font-medium text-slate-700">Código</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code[0]}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Dirección</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
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
