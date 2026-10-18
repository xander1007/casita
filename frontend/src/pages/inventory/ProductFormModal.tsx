import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { Modal } from "../../components/Modal";
import { createProduct, updateProduct } from "../../api/products";
import { IGV_AFFECTATIONS, UNITS_OF_MEASURE } from "../../types/inventory";
import type { Brand, Category, Product } from "../../types/inventory";

interface ProductFormModalProps {
  product: Product | null;
  categories: Category[];
  brands: Brand[];
  onClose: () => void;
  onSaved: () => void;
}

export function ProductFormModal({
  product,
  categories,
  brands,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const isEditing = product !== null;

  const [name, setName] = useState(product?.name ?? "");
  const [internalCode, setInternalCode] = useState(product?.internal_code ?? "");
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.category?.id.toString() ?? "");
  const [brandId, setBrandId] = useState(product?.brand?.id.toString() ?? "");
  const [purchasePrice, setPurchasePrice] = useState(product?.purchase_price.toString() ?? "0");
  const [salePrice, setSalePrice] = useState(product?.sale_price.toString() ?? "0");
  const [unitOfMeasure, setUnitOfMeasure] = useState(product?.unit_of_measure ?? "NIU");
  const [igvAffectation, setIgvAffectation] = useState(product?.igv_affectation ?? "10");
  const [minStock, setMinStock] = useState((product?.min_stock ?? 0).toString());
  const [requiresSerial, setRequiresSerial] = useState(product?.requires_serial ?? false);
  const [isService, setIsService] = useState(product?.is_service ?? false);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      category_id: categoryId ? Number(categoryId) : null,
      brand_id: brandId ? Number(brandId) : null,
      name,
      internal_code: internalCode,
      barcode: barcode || null,
      description: description || null,
      purchase_price: Number(purchasePrice),
      sale_price: Number(salePrice),
      unit_of_measure: unitOfMeasure,
      igv_affectation: igvAffectation,
      min_stock: Number(minStock),
      requires_serial: requiresSerial,
      is_service: isService,
      is_active: isActive,
    };

    try {
      if (isEditing) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
      }
      onSaved();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors ?? {});
      } else {
        setFormError("No se pudo guardar el producto. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Editar producto" : "Nuevo producto"} onClose={onClose}>
      {formError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="field w-full"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Código interno</label>
            <input
              type="text"
              value={internalCode}
              onChange={(e) => setInternalCode(e.target.value)}
              required
              className="field w-full"
            />
            {errors.internal_code && (
              <p className="mt-1 text-sm text-red-600">{errors.internal_code[0]}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Código de barras</label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="field w-full"
            />
            {errors.barcode && <p className="mt-1 text-sm text-red-600">{errors.barcode[0]}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="field w-full"
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Marca</label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="field w-full"
            >
              <option value="">Sin marca</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Precio compra</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              required
              className="field w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Precio venta</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              required
              className="field w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Unidad (SUNAT)</label>
            <select
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value)}
              className="field w-full"
            >
              {UNITS_OF_MEASURE.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Afect. IGV</label>
            <select
              value={igvAffectation}
              onChange={(e) => setIgvAffectation(e.target.value)}
              className="field w-full"
            >
              {IGV_AFFECTATIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Stock mínimo</label>
            <input
              type="number"
              min="0"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="field w-full"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="field w-full"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isService}
              onChange={(e) => setIsService(e.target.checked)}
              className="rounded border-slate-300"
            />
            Es un servicio (no maneja stock)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={requiresSerial}
              onChange={(e) => setRequiresSerial(e.target.checked)}
              disabled={isService}
              className="rounded border-slate-300 disabled:opacity-50"
            />
            Requiere serie
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300"
            />
            Activo
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
