import { calcCartTotals, calcLineTotals } from "./cart";
import type { CartItem } from "./cart";

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  onCheckout: () => void;
}

export function CartPanel({ items, onUpdateQuantity, onRemove, onCheckout }: CartPanelProps) {
  const totals = calcCartTotals(items);

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-base font-semibold text-slate-900">Carrito de Compra</h2>

      <div className="mt-3 flex-1 overflow-y-auto rounded-lg border border-slate-200">
        {items.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-400">
            Agrega productos desde el catálogo para iniciar la venta.
          </p>
        )}

        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const line = calcLineTotals(item);
              return (
                <tr key={item.key}>
                  <td className="px-3 py-2 align-top">
                    <div className="font-medium text-slate-900">{item.product.name}</div>
                    {item.serial && (
                      <div className="font-mono text-xs text-slate-400">Serie: {item.serial.serial_number}</div>
                    )}
                    <div className="text-xs text-slate-400">S/ {item.unitPrice.toFixed(2)} c/u</div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    {item.serial || item.locked ? (
                      <span className="text-sm text-slate-600">{item.quantity}</span>
                    ) : (
                      <input
                        type="number"
                        min={1}
                        max={item.product.available_stock || undefined}
                        value={item.quantity}
                        onChange={(e) => onUpdateQuantity(item.key, Number(e.target.value))}
                        className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 text-right align-top font-medium text-slate-900">
                    S/ {line.total.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 align-top">
                    <button
                      type="button"
                      onClick={() => onRemove(item.key)}
                      aria-label="Quitar"
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <dl className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm">
        <div className="flex justify-between text-slate-500">
          <dt>Subtotal</dt>
          <dd>S/ {totals.subtotal.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between text-slate-500">
          <dt>IGV (18%)</dt>
          <dd>S/ {totals.igv.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between text-lg font-semibold text-slate-900">
          <dt>Total</dt>
          <dd>S/ {totals.total.toFixed(2)}</dd>
        </div>
      </dl>

      <button
        type="button"
        disabled={items.length === 0}
        onClick={onCheckout}
        className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cobrar
      </button>
    </div>
  );
}
