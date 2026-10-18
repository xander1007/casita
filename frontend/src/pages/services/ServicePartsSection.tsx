import { useEffect, useState } from "react";
import axios from "axios";
import { addServiceItem, fetchServiceParts, removeServiceItem } from "../../api/services";
import type { TechnicalService } from "../../types/services";
import type { Product } from "../../types/inventory";

interface ServicePartsSectionProps {
  service: TechnicalService;
  canManage: boolean;
  onChanged: (service: TechnicalService) => void;
}

export function ServicePartsSection({ service, canManage, onChanged }: ServicePartsSectionProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      fetchServiceParts(search.trim()).then((products) => {
        if (!cancelled) setResults(products);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search]);

  async function handleAdd() {
    if (!selected) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const updated = await addServiceItem(service.id, {
        product_id: selected.id,
        quantity: Number(quantity) || 1,
      });
      onChanged(updated);
      setSelected(null);
      setSearch("");
      setQuantity("1");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        const responseErrors = err.response.data.errors ?? {};
        setError(Object.values(responseErrors).flat().join(" ") || "No se pudo agregar el repuesto.");
      } else {
        setError("No se pudo agregar el repuesto.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(itemId: number) {
    const updated = await removeServiceItem(service.id, itemId);
    onChanged(updated);
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700">Repuestos utilizados</h3>

      {canManage && (
        <div className="mt-2 space-y-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="search"
                value={selected ? selected.name : search}
                onChange={(e) => {
                  setSelected(null);
                  setSearch(e.target.value);
                }}
                placeholder="Buscar repuesto en almacén Servicio Técnico..."
                className="field w-full"
              />
              {!selected && results.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm">
                  {results.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setSelected(product);
                        setResults([]);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-indigo-50"
                    >
                      {product.name}{" "}
                      <span className="text-xs text-slate-400">
                        (S/ {product.sale_price.toFixed(2)} · stock {product.available_stock})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="field w-20 px-2"
            />
            <button
              type="button"
              disabled={!selected || isSubmitting}
              onClick={handleAdd}
              className="btn btn-primary"
            >
              Agregar
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 divide-y divide-slate-100 rounded-md border border-slate-200">
        {service.items.length === 0 && (
          <p className="px-3 py-2 text-sm text-slate-400">Sin repuestos agregados.</p>
        )}
        {service.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <span>
              {item.quantity} x {item.product_name}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">S/ {item.subtotal.toFixed(2)}</span>
              {canManage && (
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>
        ))}
        {service.items.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-900">
            <span>Subtotal repuestos</span>
            <span>S/ {(service.items_total ?? service.items.reduce((sum, i) => sum + i.subtotal, 0)).toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
