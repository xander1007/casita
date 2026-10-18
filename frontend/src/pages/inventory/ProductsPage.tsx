import { useEffect, useState } from "react";
import { deleteProduct, fetchProducts } from "../../api/products";
import { fetchCategories } from "../../api/categories";
import { fetchBrands } from "../../api/brands";
import { useAuth } from "../../context/useAuth";
import { ProductFormModal } from "./ProductFormModal";
import { ProductSeriesModal } from "./ProductSeriesModal";
import type { Product } from "../../types/inventory";
import type { Category, Brand } from "../../types/inventory";
import type { PaginationMeta } from "../../types/common";
import { EmptyTableRow } from "../../components/ui/EmptyState";
import { Package } from "lucide-react";

export default function ProductsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("inventory.manage");
  const canManageStock = hasPermission("inventory.manage-stock");

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [modalProduct, setModalProduct] = useState<Product | null | "new">(null);
  const [seriesProduct, setSeriesProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories);
    fetchBrands().then(setBrands);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchProducts({
      search: search || undefined,
      category_id: categoryFilter ? Number(categoryFilter) : undefined,
      brand_id: brandFilter ? Number(brandFilter) : undefined,
      page,
    })
      .then((response) => {
        if (cancelled) return;
        setProducts(response.data);
        setMeta(response.meta);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, categoryFilter, brandFilter, page, refreshIndex]);

  function refresh() {
    setIsLoading(true);
    setRefreshIndex((i) => i + 1);
  }

  function goToPage(nextPage: number) {
    setIsLoading(true);
    setPage(nextPage);
  }

  function applyFilters(next: { search?: string; category?: string; brand?: string }) {
    setIsLoading(true);
    setPage(1);
    if (next.search !== undefined) setSearch(next.search);
    if (next.category !== undefined) setCategoryFilter(next.category);
    if (next.brand !== undefined) setBrandFilter(next.brand);
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`¿Eliminar el producto "${product.name}"?`)) return;
    await deleteProduct(product.id);
    refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => applyFilters({ search: e.target.value })}
            placeholder="Buscar por nombre, código o serie..."
            className="field w-64"
          />
          <select
            value={categoryFilter}
            onChange={(e) => applyFilters({ category: e.target.value })}
            className="field"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={brandFilter}
            onChange={(e) => applyFilters({ brand: e.target.value })}
            className="field"
          >
            <option value="">Todas las marcas</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setModalProduct("new")}
            className="btn btn-primary"
          >
            + Nuevo producto
          </button>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Categoría / Marca</th>
              <th className="px-4 py-3 font-medium">Precio venta</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!isLoading && products.length === 0 && (
              <EmptyTableRow colSpan={6} icon={Package} title="No hay productos" description="Registra tu primer producto para empezar a vender y controlar stock." filtered={Boolean(search || categoryFilter || brandFilter)} />
            )}
            {!isLoading &&
              products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{product.name}</div>
                    <div className="flex gap-1 pt-1">
                      {product.is_service && (
                        <span className="pill bg-sky-100 text-sky-700">
                          Servicio
                        </span>
                      )}
                      {product.requires_serial && (
                        <span className="pill bg-purple-100 text-purple-700">
                          Serie
                        </span>
                      )}
                      {!product.is_active && (
                        <span className="pill bg-slate-200 text-slate-600">
                          Inactivo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{product.internal_code}</div>
                    {product.barcode && (
                      <div className="text-xs text-slate-400">{product.barcode}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{product.category?.name ?? "—"}</div>
                    <div className="text-xs text-slate-400">{product.brand?.name ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-900">S/ {product.sale_price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    {product.is_service ? (
                      <span className="text-xs text-slate-400">N/A</span>
                    ) : (
                      <span
                        className={`pill ${
                          product.is_low_stock
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {product.total_stock} und.
                      </span>
                    )}
                    {product.reserved_stock > 0 && (
                      <div className="mt-1 text-xs text-amber-600">{product.reserved_stock} reservada(s) en pedidos</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs font-medium">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setModalProduct(product)}
                          className="text-indigo-600 hover:underline"
                        >
                          Editar
                        </button>
                      )}
                      {product.requires_serial && canManageStock && (
                        <button
                          type="button"
                          onClick={() => setSeriesProduct(product)}
                          className="text-slate-600 hover:underline"
                        >
                          Ver series
                        </button>
                      )}
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          className="text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Página {meta.current_page} de {meta.last_page} ({meta.total} productos)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => goToPage(meta.current_page - 1)}
              className="btn-sm btn-secondary"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => goToPage(meta.current_page + 1)}
              className="btn-sm btn-secondary"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {modalProduct !== null && (
        <ProductFormModal
          product={modalProduct === "new" ? null : modalProduct}
          categories={categories}
          brands={brands}
          onClose={() => setModalProduct(null)}
          onSaved={() => {
            setModalProduct(null);
            refresh();
          }}
        />
      )}

      {seriesProduct !== null && (
        <ProductSeriesModal product={seriesProduct} onClose={() => setSeriesProduct(null)} />
      )}
    </div>
  );
}
