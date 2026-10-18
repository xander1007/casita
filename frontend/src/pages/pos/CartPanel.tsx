import { Lock, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { calcCartTotals, calcLineTotals } from "./cart";
import type { CartItem } from "./cart";

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  onCheckout: () => void;
}

function money(value: number): string {
  return value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CartPanel({ items, onUpdateQuantity, onRemove, onCheckout }: CartPanelProps) {
  const totals = calcCartTotals(items);
  const units = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <ShoppingCart className="h-5 w-5 text-indigo-600" />
          Carrito
        </h2>
        {items.length > 0 && (
          <span className="pill bg-indigo-100 text-indigo-700">
            {units} {units === 1 ? "unidad" : "unidades"}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
              <ShoppingCart className="h-7 w-7 text-slate-300" strokeWidth={1.6} />
            </div>
            <p className="text-sm font-medium text-slate-700">El carrito está vacío</p>
            <p className="mt-1 text-xs text-slate-400">Busca o escanea un producto para iniciar la venta.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => {
              const line = calcLineTotals(item);
              const fixed = Boolean(item.serial || item.locked);
              const max = item.product.is_service ? undefined : item.product.available_stock || undefined;

              return (
                <li key={item.key} className="group px-5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm leading-snug font-medium text-slate-900">{item.product.name}</p>
                      {item.serial && (
                        <p className="font-mono text-xs text-slate-400">Serie: {item.serial.serial_number}</p>
                      )}
                      <p className="text-xs text-slate-400">S/ {money(item.unitPrice)} c/u</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-slate-900 tabular-nums">S/ {money(line.total)}</p>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    {fixed ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Lock className="h-3 w-3" />
                        Cantidad: {item.quantity}
                      </span>
                    ) : (
                      <div className="inline-flex items-center rounded-lg border border-slate-300">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.key, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Disminuir cantidad"
                          className="flex h-8 w-8 items-center justify-center rounded-l-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={max}
                          value={item.quantity}
                          onChange={(e) => onUpdateQuantity(item.key, Number(e.target.value))}
                          aria-label="Cantidad"
                          className="h-8 w-12 border-x border-slate-300 bg-transparent text-center text-sm text-slate-900 tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.key, item.quantity + 1)}
                          disabled={max !== undefined && item.quantity >= max}
                          aria-label="Aumentar cantidad"
                          className="flex h-8 w-8 items-center justify-center rounded-r-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(item.key)}
                      aria-label={`Quitar ${item.product.name}`}
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500">
            <dt>Op. gravada / exonerada</dt>
            <dd className="tabular-nums">S/ {money(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-slate-500">
            <dt>IGV (18%)</dt>
            <dd className="tabular-nums">S/ {money(totals.igv)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-dashed border-slate-300 pt-2">
            <dt className="text-base font-semibold text-slate-900">Total</dt>
            <dd className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              <span className="mr-1 text-base font-semibold text-slate-500">S/</span>
              {money(totals.total)}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          disabled={items.length === 0}
          onClick={onCheckout}
          className="btn btn-primary mt-4 h-14 w-full justify-between rounded-xl px-5 text-base font-semibold shadow-md shadow-indigo-600/20"
        >
          <span>Cobrar</span>
          <span className="flex items-center gap-2">
            <span className="tabular-nums">S/ {money(totals.total)}</span>
            <kbd className="rounded-md bg-white/20 px-1.5 py-0.5 font-sans text-xs font-medium">F2</kbd>
          </span>
        </button>
      </div>
    </div>
  );
}
