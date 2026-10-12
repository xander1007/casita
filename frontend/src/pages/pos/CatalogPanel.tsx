import { useEffect, useState } from "react";
import { fetchPosCategories, fetchPosProducts } from "../../api/pos";
import type { Category, Product } from "../../types/inventory";

interface CatalogPanelProps {
  warehouseId: number;
  onSelectProduct: (product: Product) => void;
  refreshIndex: number;
}

export function CatalogPanel({ warehouseId, onSelectProduct, refreshIndex }: CatalogPanelProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosCategories().then(setCategories);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchPosProducts({
      warehouse_id: warehouseId,
      search: search || undefined,
      category_id: categoryFilter ? Number(categoryFilter) : undefined,
    })
      .then((response) => {
        if (!cancelled) setProducts(response.data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [warehouseId, search, categoryFilter, refreshIndex]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <input
          type="search"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, código de barras o serie..."
          className="min-w-[16rem] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex-1 overflow-y-auto">
        {isLoading && <p className="p-4 text-center text-sm text-slate-400">Cargando productos...</p>}

        {!isLoading && products.length === 0 && (
          <p className="p-4 text-center text-sm text-slate-400">No se encontraron productos.</p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {!isLoading &&
            products.map((product) => {
              const outOfStock = !product.is_service && product.total_stock <= 0;

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={outOfStock}
                  onClick={() => onSelectProduct(product)}
                  className="flex flex-col items-start rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-indigo-400 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="line-clamp-2 text-sm font-medium text-slate-900">{product.name}</span>
                  <span className="mt-1 text-xs text-slate-400">{product.internal_code}</span>
                  <div className="mt-2 flex w-full items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-indigo-600">
                      S/ {product.sale_price.toFixed(2)}
                    </span>
                    <div className="flex gap-1">
                      {product.requires_serial && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                          Serie
                        </span>
                      )}
                      {!product.is_service && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            outOfStock ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {product.total_stock} und.
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
