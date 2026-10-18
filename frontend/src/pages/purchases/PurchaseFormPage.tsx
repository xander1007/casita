import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createPurchase,
  fetchPurchaseWarehouses,
  searchPurchaseProducts,
  searchPurchaseSuppliers,
} from "../../api/purchases";
import { QuickSupplierModal } from "./QuickSupplierModal";
import { SerialCaptureModal } from "./SerialCaptureModal";
import { PURCHASE_DOCUMENT_TYPES } from "../../types/purchases";
import type { PurchaseDocumentType } from "../../types/purchases";
import type { Contact } from "../../types/contacts";
import type { Product } from "../../types/inventory";
import type { Warehouse } from "../../types/inventory";
import type { PurchaseSuggestion } from "../../types/salesOrders";

interface OrderAllocation {
  salesOrderItemId: number;
  orderCode: string;
  customer: string | null;
  quantity: number;
}

interface PurchaseLine {
  key: string;
  product: Product;
  quantity: number;
  unitCost: number;
  serialNumbers: string[];
  /** Back-to-back: units of this line bought for specific sales orders. */
  allocations: OrderAllocation[];
}

const allocatedUnits = (line: PurchaseLine) => line.allocations.reduce((sum, a) => sum + a.quantity, 0);

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PurchaseFormPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [supplier, setSupplier] = useState<Contact | null>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierResults, setSupplierResults] = useState<Contact[]>([]);
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");

  const [documentType, setDocumentType] = useState<PurchaseDocumentType>("factura");
  const [documentNumber, setDocumentNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayIso());

  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [items, setItems] = useState<PurchaseLine[]>([]);
  const [serialLineKey, setSerialLineKey] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPurchaseWarehouses().then(setWarehouses);
  }, []);

  // Coming from "Compras a demanda": preload warehouse, supplier and lines linked to their orders.
  useEffect(() => {
    const onDemand = (location.state as { onDemand?: PurchaseSuggestion[] } | null)?.onDemand;
    if (!onDemand?.length) return;
    navigate(location.pathname, { replace: true, state: null });

    setWarehouseId(String(onDemand[0].warehouse_id));

    const suppliers = new Map(onDemand.filter((s) => s.suggested_supplier).map((s) => [s.suggested_supplier!.id, s.suggested_supplier!]));
    if (suppliers.size === 1) {
      const suggested = [...suppliers.values()][0];
      searchPurchaseSuppliers(suggested.document_number).then((found) => {
        const match = found.find((c) => c.id === suggested.id);
        if (match) setSupplier(match);
      });
    }

    const byProduct = new Map<number, PurchaseSuggestion[]>();
    for (const s of onDemand) byProduct.set(s.product_id, [...(byProduct.get(s.product_id) ?? []), s]);

    Promise.all(
      [...byProduct.entries()].map(async ([productId, rows]): Promise<PurchaseLine | null> => {
        const found = await searchPurchaseProducts(rows[0].internal_code);
        const product = found.find((p) => p.id === productId);
        if (!product) return null;
        const quantity = rows.reduce((sum, r) => sum + r.quantity_to_buy, 0);
        return {
          key: `product-${product.id}`,
          product,
          quantity,
          unitCost: product.purchase_price || 0,
          serialNumbers: [],
          allocations: rows.map((r) => ({
            salesOrderItemId: r.sales_order_item_id,
            orderCode: r.order_code,
            customer: r.customer,
            quantity: r.quantity_to_buy,
          })),
        };
      }),
    ).then((lines) => setItems(lines.filter((line): line is PurchaseLine => line !== null)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (supplierSearch.trim().length < 2) {
      setSupplierResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      searchPurchaseSuppliers(supplierSearch.trim()).then((results) => {
        if (!cancelled) setSupplierResults(results);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [supplierSearch]);

  useEffect(() => {
    if (productSearch.trim().length < 2) {
      setProductResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      searchPurchaseProducts(productSearch.trim()).then((results) => {
        if (!cancelled) setProductResults(results);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [productSearch]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const roundedSubtotal = Math.round(subtotal * 100) / 100;
    const igv = Math.round(roundedSubtotal * 0.18 * 100) / 100;
    const total = Math.round((roundedSubtotal + igv) * 100) / 100;
    return { subtotal: roundedSubtotal, igv, total };
  }, [items]);

  function addProduct(product: Product) {
    setProductSearch("");
    setProductResults([]);

    setItems((current) => {
      const key = `product-${product.id}`;
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + 1, serialNumbers: [] }
            : item,
        );
      }
      return [
        ...current,
        {
          key,
          product,
          quantity: 1,
          unitCost: product.purchase_price || 0,
          serialNumbers: [],
          allocations: [],
        },
      ];
    });
  }

  function removeAllocation(key: string, salesOrderItemId: number) {
    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, allocations: item.allocations.filter((a) => a.salesOrderItemId !== salesOrderItemId) }
          : item,
      ),
    );
  }

  const hasAllocations = items.some((item) => item.allocations.length > 0);

  function updateLine(key: string, patch: Partial<Pick<PurchaseLine, "quantity" | "unitCost">>) {
    setItems((current) =>
      current.map((item) => {
        if (item.key !== key) return item;
        const next = { ...item, ...patch };
        if (patch.quantity !== undefined && patch.quantity !== item.quantity) {
          next.serialNumbers = [];
        }
        return next;
      }),
    );
  }

  function removeLine(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  const serialLine = items.find((item) => item.key === serialLineKey) ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    if (!supplier) {
      setFormError("Selecciona un proveedor.");
      return;
    }
    if (!warehouseId) {
      setFormError("Selecciona el almacén de destino.");
      return;
    }
    if (items.length === 0) {
      setFormError("Agrega al menos un producto a la compra.");
      return;
    }
    for (const item of items) {
      if (item.product.requires_serial && item.serialNumbers.length !== item.quantity) {
        setFormError(
          `Registra los ${item.quantity} número(s) de serie de "${item.product.name}" antes de continuar.`,
        );
        return;
      }
      if (allocatedUnits(item) > item.quantity) {
        setFormError(
          `"${item.product.name}" tiene ${allocatedUnits(item)} unidad(es) asignadas a pedidos: la cantidad comprada no puede ser menor.`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const purchase = await createPurchase({
        supplier_id: supplier.id,
        warehouse_id: Number(warehouseId),
        document_type: documentType,
        document_number: documentNumber,
        purchase_date: purchaseDate,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          serial_numbers: item.product.requires_serial ? item.serialNumbers : undefined,
          allocations: item.allocations.map((a) => ({ sales_order_item_id: a.salesOrderItemId, quantity: a.quantity })),
        })),
      });
      navigate("/purchases", { state: { createdPurchaseId: purchase.id } });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors ?? {});
        setFormError(error.response.data.message ?? null);
      } else {
        setFormError("No se pudo registrar la compra. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold text-slate-900">Nueva Compra</h1>
      <p className="mt-1 text-sm text-slate-500">
        Registra el ingreso de mercadería al almacén desde un proveedor.
      </p>

      {formError && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-6">
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Datos del comprobante</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Proveedor</label>
              {supplier ? (
                <div className="flex items-center justify-between rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <span>
                    {supplier.name_or_business_name}{" "}
                    <span className="text-xs text-slate-400">({supplier.document_number})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSupplier(null)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="search"
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      placeholder="Buscar por RUC/DNI o razón social..."
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowQuickSupplier(true)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      + Nuevo
                    </button>
                  </div>
                  {supplierResults.length > 0 && (
                    <div className="mt-1 max-h-32 overflow-y-auto rounded-md border border-slate-200">
                      {supplierResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSupplier(c);
                            setSupplierSearch("");
                            setSupplierResults([]);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-indigo-50"
                        >
                          {c.name_or_business_name}{" "}
                          <span className="text-xs text-slate-400">({c.document_number})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.supplier_id && <p className="mt-1 text-sm text-red-600">{errors.supplier_id[0]}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Almacén de destino</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                disabled={hasAllocations}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
              >
                <option value="">Selecciona un almacén</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {hasAllocations && (
                <p className="mt-1 text-xs text-slate-400">
                  Fijado por los pedidos a demanda: la mercadería debe ingresar donde se reservó.
                </p>
              )}
              {errors.warehouse_id && <p className="mt-1 text-sm text-red-600">{errors.warehouse_id[0]}</p>}
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">Tipo de comprobante</span>
              <div className="flex gap-2">
                {PURCHASE_DOCUMENT_TYPES.map((option) => (
                  <label
                    key={option.value}
                    className={`flex-1 cursor-pointer rounded-md border px-3 py-2 text-center text-sm ${
                      documentType === option.value
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-300 text-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="document_type"
                      value={option.value}
                      checked={documentType === option.value}
                      onChange={() => setDocumentType(option.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {errors.document_type && <p className="mt-1 text-sm text-red-600">{errors.document_type[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">N° de documento</label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="F001-1234"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errors.document_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.document_number[0]}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de compra</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {errors.purchase_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.purchase_date[0]}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Productos</h2>

          <div className="relative mt-3">
            <input
              type="search"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar por nombre, código o código de barras..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {productResults.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
                {productResults.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50"
                  >
                    <span>
                      {product.name} <span className="text-xs text-slate-400">({product.internal_code})</span>
                      {product.requires_serial && (
                        <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                          Serie
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400">Costo actual: S/ {product.purchase_price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.items && <p className="mt-1 text-sm text-red-600">{errors.items[0]}</p>}

          <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Producto</th>
                  <th className="px-3 py-2 font-medium">Cantidad</th>
                  <th className="px-3 py-2 font-medium">Costo Unit.</th>
                  <th className="px-3 py-2 font-medium text-right">Subtotal</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                      Busca y agrega productos a la compra.
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr key={item.key}>
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-slate-900">{item.product.name}</div>
                      {item.allocations.map((a) => (
                        <div key={a.salesOrderItemId} className="mt-0.5 flex items-center gap-1 text-xs text-amber-700">
                          <span>
                            Para pedido {a.orderCode}
                            {a.customer ? ` (${a.customer})` : ""}: {a.quantity} und.
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAllocation(item.key, a.salesOrderItemId)}
                            aria-label={`Desvincular pedido ${a.orderCode}`}
                            className="text-slate-400 hover:text-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {allocatedUnits(item) > item.quantity && (
                        <div className="text-xs font-medium text-red-600">
                          Cantidad menor a lo asignado a pedidos ({allocatedUnits(item)}).
                        </div>
                      )}
                      {item.product.requires_serial && (
                        <button
                          type="button"
                          onClick={() => setSerialLineKey(item.key)}
                          className={`mt-1 block text-xs font-medium hover:underline ${
                            item.serialNumbers.length === item.quantity ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {item.serialNumbers.length === item.quantity
                            ? `${item.quantity} serie(s) registrada(s)`
                            : `Registrar ${item.quantity} serie(s)`}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateLine(item.key, { quantity: Math.max(1, Number(e.target.value)) })}
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) => updateLine(item.key, { unitCost: Math.max(0, Number(e.target.value)) })}
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-right align-top font-medium text-slate-900">
                      S/ {(item.quantity * item.unitCost).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => removeLine(item.key)}
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
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Resumen</h2>
          <dl className="mt-3 space-y-1 text-sm">
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

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate("/purchases")}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Guardando..." : "Registrar Compra"}
            </button>
          </div>
        </section>
      </form>

      {showQuickSupplier && (
        <QuickSupplierModal
          onClose={() => setShowQuickSupplier(false)}
          onCreated={(contact) => {
            setSupplier(contact);
            setShowQuickSupplier(false);
          }}
        />
      )}

      {serialLine && (
        <SerialCaptureModal
          productName={serialLine.product.name}
          quantity={serialLine.quantity}
          initialSerials={serialLine.serialNumbers}
          onClose={() => setSerialLineKey(null)}
          onSave={(serials) => {
            setItems((current) =>
              current.map((item) => (item.key === serialLine.key ? { ...item, serialNumbers: serials } : item)),
            );
            setSerialLineKey(null);
          }}
        />
      )}
    </div>
  );
}
