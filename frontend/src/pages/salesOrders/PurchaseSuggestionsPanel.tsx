import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPurchaseSuggestions } from "../../api/salesOrders";
import type { PurchaseSuggestion } from "../../types/salesOrders";
import { useAuth } from "../../context/useAuth";
import { formatDate } from "../../utils/dates";
import { EmptyState } from "../../components/ui/EmptyState";
import { PackageCheck } from "lucide-react";

/**
 * Lines sold "a demanda" that still have to be bought. Selected lines of one
 * warehouse are sent to the purchase form, already linked to their orders.
 */
export function PurchaseSuggestionsPanel() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<PurchaseSuggestion[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPurchaseSuggestions().then(setSuggestions);
  }, []);

  const selectedRows = useMemo(
    () => (suggestions ?? []).filter((s) => selected.has(s.sales_order_item_id)),
    [suggestions, selected],
  );
  const selectedWarehouses = new Set(selectedRows.map((s) => s.warehouse_id));
  const canCreatePurchase = hasPermission("purchases.create") && selectedRows.length > 0 && selectedWarehouses.size === 1;

  function toggle(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (suggestions === null) {
    return <p className="px-4 py-6 text-center text-sm text-slate-400">Cargando...</p>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={PackageCheck}
          title="Nada pendiente de compra"
          description="Todos los pedidos tienen su mercadería. Los productos vendidos a demanda aparecerán aquí."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          Cantidades exactas que faltan para completar cada pedido. Selecciona líneas del mismo almacén para generar la
          compra vinculada.
        </p>
        <button
          type="button"
          disabled={!canCreatePurchase}
          onClick={() => navigate("/purchases/nueva", { state: { onDemand: selectedRows } })}
          className="btn btn-primary"
        >
          Generar compra ({selectedRows.length})
        </button>
      </div>
      {selectedWarehouses.size > 1 && (
        <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Las líneas seleccionadas son de almacenes distintos: una compra ingresa a un solo almacén.
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="w-10 px-4 py-3"></th>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 text-right font-medium">Por comprar</th>
              <th className="px-4 py-3 font-medium">Pedido / Cliente</th>
              <th className="px-4 py-3 font-medium">Entrega</th>
              <th className="px-4 py-3 font-medium">Almacén</th>
              <th className="px-4 py-3 font-medium">Proveedor sugerido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suggestions.map((s) => (
              <tr key={s.sales_order_item_id} className={selected.has(s.sales_order_item_id) ? "bg-indigo-50/50" : undefined}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(s.sales_order_item_id)}
                    onChange={() => toggle(s.sales_order_item_id)}
                    aria-label={`Seleccionar ${s.product_name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{s.product_name}</div>
                  <div className="text-xs text-slate-400">
                    {s.internal_code} · último costo S/ {s.purchase_price.toFixed(2)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">{s.quantity_to_buy}</td>
                <td className="px-4 py-3 text-slate-600">
                  {s.order_code}
                  <div className="text-xs text-slate-400">{s.customer}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(s.expected_date)}</td>
                <td className="px-4 py-3 text-slate-600">{s.warehouse}</td>
                <td className="px-4 py-3 text-slate-600">
                  {s.suggested_supplier ? (
                    <>
                      {s.suggested_supplier.name}
                      <div className="text-xs text-slate-400">Última compra</div>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">Sin compras previas</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
