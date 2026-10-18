import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { Modal } from "../../components/Modal";
import { deleteSerial, fetchSerials, storeSerials } from "../../api/products";
import { fetchWarehouses } from "../../api/warehouses";
import { useAuth } from "../../context/useAuth";
import type { Product, ProductSerial, Warehouse } from "../../types/inventory";

const STATUS_LABELS: Record<ProductSerial["status"], string> = {
  available: "Disponible",
  sold: "Vendido",
  reserved: "Reservado",
  defective: "Defectuoso",
};

export function ProductSeriesModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { hasPermission } = useAuth();
  const canManageStock = hasPermission("inventory.manage-stock");

  const [serials, setSerials] = useState<ProductSerial[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [newSerials, setNewSerials] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    fetchSerials(product.id).then(setSerials);
  }, [product.id, refreshIndex]);

  useEffect(() => {
    fetchWarehouses().then(setWarehouses);
  }, []);

  async function handleAddSerials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const numbers = newSerials
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (numbers.length === 0) return;

    setIsSubmitting(true);
    try {
      await storeSerials(product.id, {
        warehouse_id: warehouseId ? Number(warehouseId) : undefined,
        serial_numbers: numbers,
      });
      setNewSerials("");
      setRefreshIndex((i) => i + 1);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "No se pudieron registrar las series.")
          : "No se pudieron registrar las series.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(serial: ProductSerial) {
    if (!window.confirm(`¿Eliminar la serie "${serial.serial_number}"?`)) return;
    await deleteSerial(product.id, serial.id);
    setRefreshIndex((i) => i + 1);
  }

  return (
    <Modal title={`Series — ${product.name}`} onClose={onClose}>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="max-h-64 overflow-y-auto rounded-md border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Serie</th>
              <th className="px-3 py-2 font-medium">Almacén</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              {canManageStock && <th className="px-3 py-2 font-medium"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {serials.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                  Sin series registradas.
                </td>
              </tr>
            )}
            {serials.map((serial) => (
              <tr key={serial.id}>
                <td className="px-3 py-2 font-mono text-xs text-slate-900">{serial.serial_number}</td>
                <td className="px-3 py-2 text-slate-500">{serial.warehouse?.name ?? "—"}</td>
                <td className="px-3 py-2 text-slate-500">{STATUS_LABELS[serial.status]}</td>
                {canManageStock && (
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(serial)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManageStock && (
        <form onSubmit={handleAddSerials} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Almacén</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="field w-full"
            >
              <option value="">Sin asignar</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nuevas series (una por línea o separadas por coma)
            </label>
            <textarea
              value={newSerials}
              onChange={(e) => setNewSerials(e.target.value)}
              rows={3}
              placeholder={"SN-0001\nSN-0002"}
              className="field w-full font-mono"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? "Guardando..." : "Registrar series"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
