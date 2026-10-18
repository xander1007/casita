import { useEffect, useMemo, useState } from "react";
import { searchSalesProducts } from "../../api/salesOrders";
import type { Product } from "../../types/inventory";
import { calcSalesTotals, round2 } from "./salesLines";
import type { SalesLine } from "./salesLines";

interface SalesLinesEditorProps {
  lines: SalesLine[];
  onChange: (lines: SalesLine[]) => void;
  warehouseId: number | null;
  /**
   * "order": shows how many units will be reserved from stock and how many
   * will be handled "a demanda". "quotation": only shows availability.
   */
  mode: "quotation" | "order";
  error?: string;
}

function StockHint({ line, mode }: { line: SalesLine; mode: "quotation" | "order" }) {
  if (line.product.is_service) {
    return <span className="text-xs text-slate-400">Servicio</span>;
  }

  const available = line.product.available_stock;
  const fromStock = Math.min(available, line.quantity);
  const onDemand = line.quantity - fromStock;

  if (onDemand === 0) {
    return (
      <span className="text-xs text-emerald-600">
        {mode === "order" ? `Se reservan ${fromStock} de stock` : `Stock disponible: ${available}`}
      </span>
    );
  }

  return (
    <span className="text-xs text-amber-700">
      {fromStock > 0 && `${fromStock} de stock · `}
      <span className="font-semibold">{onDemand} a demanda</span>
      {mode === "quotation" && " (sin stock suficiente)"}
    </span>
  );
}

export function SalesLinesEditor({ lines, onChange, warehouseId, mode, error }: SalesLinesEditorProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      searchSalesProducts(search.trim(), warehouseId).then((found) => {
        if (!cancelled) setResults(found);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search, warehouseId]);

  const totals = useMemo(() => calcSalesTotals(lines), [lines]);

  function addProduct(product: Product) {
    setSearch("");
    setResults([]);
    if (lines.some((line) => line.product.id === product.id)) {
      onChange(lines.map((line) => (line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line)));
      return;
    }
    onChange([...lines, { product, quantity: 1, unitPrice: product.sale_price }]);
  }

  function updateLine(productId: number, patch: Partial<Pick<SalesLine, "quantity" | "unitPrice">>) {
    onChange(lines.map((line) => (line.product.id === productId ? { ...line, ...patch } : line)));
  }

  return (
    <div>
      <div className="relative">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto por nombre, código o código de barras..."
          className="field w-full"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
            {results.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addProduct(product)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50"
              >
                <span>
                  {product.name} <span className="text-xs text-slate-400">({product.internal_code})</span>
                </span>
                <span className={`text-xs ${!product.is_service && product.available_stock <= 0 ? "text-amber-700" : "text-slate-400"}`}>
                  {product.is_service
                    ? "Servicio"
                    : product.available_stock > 0
                      ? `Disponible: ${product.available_stock}`
                      : "Sin stock · a demanda"}
                  {" · "}S/ {product.sale_price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 font-medium">Cantidad</th>
              <th className="px-3 py-2 font-medium">Precio Unit. (inc. IGV)</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  Busca y agrega productos.
                </td>
              </tr>
            )}
            {lines.map((line) => (
              <tr key={line.product.id}>
                <td className="px-3 py-2 align-top">
                  <div className="font-medium text-slate-900">{line.product.name}</div>
                  <div className="text-xs text-slate-400">{line.product.internal_code}</div>
                  <StockHint line={line} mode={mode} />
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.product.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                    className="field-sm w-20"
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.product.id, { unitPrice: Math.max(0, Number(e.target.value)) })}
                    className="field-sm w-28"
                  />
                </td>
                <td className="px-3 py-2 text-right align-top font-medium text-slate-900">
                  S/ {round2(line.quantity * line.unitPrice).toFixed(2)}
                </td>
                <td className="px-3 py-2 align-top">
                  <button
                    type="button"
                    onClick={() => onChange(lines.filter((l) => l.product.id !== line.product.id))}
                    aria-label="Quitar"
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto mt-3 w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between text-slate-500">
          <dt>Op. gravadas</dt>
          <dd>S/ {totals.opTaxed.toFixed(2)}</dd>
        </div>
        {totals.opExonerated > 0 && (
          <div className="flex justify-between text-slate-500">
            <dt>Op. exoneradas / inafectas</dt>
            <dd>S/ {totals.opExonerated.toFixed(2)}</dd>
          </div>
        )}
        <div className="flex justify-between text-slate-500">
          <dt>IGV (18%)</dt>
          <dd>S/ {totals.igv.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between text-lg font-semibold text-slate-900">
          <dt>Total</dt>
          <dd>S/ {totals.total.toFixed(2)}</dd>
        </div>
      </dl>
    </div>
  );
}
