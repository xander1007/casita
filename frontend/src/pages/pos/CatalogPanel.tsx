import { useEffect, useImperativeHandle, useRef, useState } from "react";
import type { KeyboardEvent, Ref } from "react";
import { Package, ScanBarcode, Search, Wrench, X } from "lucide-react";
import { fetchPosCategories, fetchPosProducts } from "../../api/pos";
import { EmptyState } from "../../components/ui/EmptyState";
import type { Category, Product } from "../../types/inventory";

export interface CatalogHandle {
  focusSearch: () => void;
  clearSearch: () => void;
}

interface CatalogPanelProps {
  warehouseId: number;
  onSelectProduct: (product: Product) => void;
  refreshIndex: number;
  ref?: Ref<CatalogHandle>;
}

/** Background tints for the product tile, picked by category so similar products look alike. */
const TILE_TONES = [
  "from-indigo-50 to-indigo-100 text-indigo-500",
  "from-sky-50 to-sky-100 text-sky-500",
  "from-emerald-50 to-emerald-100 text-emerald-500",
  "from-amber-50 to-amber-100 text-amber-500",
  "from-rose-50 to-rose-100 text-rose-500",
  "from-purple-50 to-purple-100 text-purple-500",
];

function tileTone(product: Product): string {
  return TILE_TONES[(product.category?.id ?? product.id) % TILE_TONES.length];
}

function StockBadge({ product }: { product: Product }) {
  if (product.is_service) {
    return <span className="pill bg-sky-100 text-sky-700">Servicio</span>;
  }
  const stock = product.available_stock;
  if (stock <= 0) return <span className="pill bg-red-100 text-red-700">Sin stock</span>;
  if (stock <= product.min_stock) return <span className="pill bg-amber-100 text-amber-700">{stock} und.</span>;
  return <span className="pill bg-emerald-100 text-emerald-700">{stock} und.</span>;
}

export function CatalogPanel({ warehouseId, onSelectProduct, refreshIndex, ref }: CatalogPanelProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusSearch: () => searchRef.current?.focus(),
    clearSearch: () => {
      setSearchInput("");
      setSearch("");
      searchRef.current?.focus();
    },
  }));

  useEffect(() => {
    fetchPosCategories().then(setCategories);
  }, []);

  // Short debounce: barcode scanners type fast, people type slower.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  function selectable(product: Product) {
    return product.is_service || product.available_stock > 0;
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setSearchInput("");
      setSearch("");
      return;
    }
    // Enter with a single match (typical after scanning a barcode) adds it straight to the cart.
    if (event.key === "Enter" && !isLoading && search === searchInput.trim() && products.length === 1 && selectable(products[0])) {
      event.preventDefault();
      onSelectProduct(products[0]);
      setSearchInput("");
      setSearch("");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            type="text"
            autoFocus
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar por nombre, código de barras o serie..."
            className="field h-11 w-full pr-20 pl-10 text-base"
            aria-label="Buscar productos"
          />
          <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
            {searchInput ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  searchRef.current?.focus();
                }}
                aria-label="Limpiar búsqueda"
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <ScanBarcode className="h-[18px] w-[18px] text-slate-300" />
            )}
            <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-500 sm:inline">
              F3
            </kbd>
          </div>
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="field h-11">
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="-mx-1 mt-4 min-h-0 flex-1 overflow-y-auto px-1 pb-1">
        {isLoading && products.length === 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        )}

        {!isLoading && products.length === 0 && (
          <EmptyState
            filtered={Boolean(search || categoryFilter)}
            icon={Package}
            title="No se encontraron productos"
            description={
              search
                ? `Ningún producto coincide con "${search}". Recuerda que la búsqueda distingue mayúsculas y minúsculas.`
                : "No hay productos disponibles para este almacén."
            }
          />
        )}

        <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 ${isLoading ? "opacity-60" : ""}`}>
          {products.map((product) => {
            const disabled = !selectable(product);
            const TileIcon = product.is_service ? Wrench : Package;

            return (
              <button
                key={product.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectProduct(product)}
                className="group card flex flex-col overflow-hidden text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:border-slate-200 disabled:hover:shadow-sm"
              >
                <div className={`relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br ${tileTone(product)}`}>
                  <TileIcon className="h-10 w-10 opacity-80 transition-transform group-hover:scale-110" strokeWidth={1.4} />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {product.requires_serial && <span className="pill bg-purple-100 text-purple-700">Serie</span>}
                  </div>
                  {product.category && (
                    <span className="absolute bottom-2 left-2 max-w-[85%] truncate rounded-md bg-ink-900/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {product.category.name}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <span className="line-clamp-2 text-sm leading-snug font-medium text-slate-900">{product.name}</span>
                  <span className="mt-0.5 truncate font-mono text-[11px] text-slate-400">{product.internal_code}</span>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <span className="text-lg leading-none font-bold text-slate-900 tabular-nums">
                      <span className="mr-0.5 text-xs font-medium text-slate-400">S/</span>
                      {product.sale_price.toFixed(2)}
                    </span>
                    <StockBadge product={product} />
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
