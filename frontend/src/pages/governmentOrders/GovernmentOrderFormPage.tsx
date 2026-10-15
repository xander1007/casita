import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  createGovernmentOrder,
  fetchGovernmentOrderWarehouses,
  searchGovernmentEntities,
  searchGovernmentOrderProducts,
} from "../../api/governmentOrders";
import type { Contact } from "../../types/contacts";
import type { Product, Warehouse } from "../../types/inventory";

interface OrderLine {
  product: Product;
  quantity: number;
  unitPrice: number;
}

function todayIso(): string {
  // Local date, not UTC: in Peru (UTC-5) toISOString() already returns tomorrow after 7 p.m.
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function GovernmentOrderFormPage() {
  const navigate = useNavigate();

  const [entity, setEntity] = useState<Contact | null>(null);
  const [entitySearch, setEntitySearch] = useState("");
  const [entityResults, setEntityResults] = useState<Contact[]>([]);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [siafNumber, setSiafNumber] = useState("");
  const [issueDate, setIssueDate] = useState(todayIso());
  const [deliveryDeadline, setDeliveryDeadline] = useState("");
  const [notes, setNotes] = useState("");

  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderLine[]>([]);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGovernmentOrderWarehouses().then(setWarehouses);
  }, []);

  useEffect(() => {
    if (entitySearch.trim().length < 2) {
      setEntityResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      searchGovernmentEntities(entitySearch.trim()).then((results) => {
        if (!cancelled) setEntityResults(results);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [entitySearch]);

  useEffect(() => {
    if (productSearch.trim().length < 2) {
      setProductResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      searchGovernmentOrderProducts(productSearch.trim()).then((results) => {
        if (!cancelled) setProductResults(results);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [productSearch]);

  const total = useMemo(
    () => Math.round(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) * 100) / 100,
    [items],
  );

  function addProduct(product: Product) {
    setProductSearch("");
    setProductResults([]);
    setItems((current) => {
      if (current.some((item) => item.product.id === product.id)) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { product, quantity: 1, unitPrice: product.sale_price || 0 }];
    });
  }

  function updateLine(productId: number, patch: Partial<Pick<OrderLine, "quantity" | "unitPrice">>) {
    setItems((current) => current.map((item) => (item.product.id === productId ? { ...item, ...patch } : item)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    if (!entity) {
      setFormError("Selecciona la entidad del Estado que emite la orden.");
      return;
    }
    if (items.length === 0) {
      setFormError("Agrega al menos un ítem a la orden de compra.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createGovernmentOrder({
        contact_id: entity.id,
        warehouse_id: warehouseId ? Number(warehouseId) : null,
        order_number: orderNumber,
        siaf_number: siafNumber || null,
        issue_date: issueDate,
        delivery_deadline: deliveryDeadline || null,
        notes: notes || null,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      });
      navigate("/government-orders", { state: { createdOrder: created } });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors ?? {});
        setFormError(error.response.data.message ?? null);
      } else {
        setFormError("No se pudo registrar la orden de compra. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold text-slate-900">Nueva Orden de Compra del Estado</h1>
      <p className="mt-1 text-sm text-slate-500">
        Al guardar se generará el reporte de stock disponible y de lo que falta comprar. Registrar la orden no
        descuenta stock.
      </p>

      {formError && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-6">
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Datos de la orden</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Entidad del Estado</label>
              {entity ? (
                <div className="flex items-center justify-between rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <span>
                    {entity.name_or_business_name}{" "}
                    <span className="text-xs text-slate-400">({entity.document_number})</span>
                  </span>
                  <button type="button" onClick={() => setEntity(null)} className="text-xs text-indigo-600 hover:underline">
                    Cambiar
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="search"
                    value={entitySearch}
                    onChange={(e) => setEntitySearch(e.target.value)}
                    placeholder="Buscar por RUC o nombre de la entidad..."
                    className={inputClass}
                  />
                  {entityResults.length > 0 && (
                    <div className="mt-1 max-h-32 overflow-y-auto rounded-md border border-slate-200">
                      {entityResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setEntity(c);
                            setEntitySearch("");
                            setEntityResults([]);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-indigo-50"
                        >
                          {c.name_or_business_name} <span className="text-xs text-slate-400">({c.document_number})</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Si la entidad no aparece, regístrala primero como cliente en "Clientes y Proveedores".
                  </p>
                </div>
              )}
              {errors.contact_id && <p className="mt-1 text-sm text-red-600">{errors.contact_id[0]}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Almacén de atención</label>
              <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={inputClass}>
                <option value="">Todos los almacenes</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">Define qué stock se compara contra la orden.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">N° de OC</label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="OC-2026-000123"
                  className={inputClass}
                />
                {errors.order_number && <p className="mt-1 text-sm text-red-600">{errors.order_number[0]}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">N° SIAF (opcional)</label>
                <input type="text" value={siafNumber} onChange={(e) => setSiafNumber(e.target.value)} className={inputClass} />
                {errors.siaf_number && <p className="mt-1 text-sm text-red-600">{errors.siaf_number[0]}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de emisión</label>
                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputClass} />
                {errors.issue_date && <p className="mt-1 text-sm text-red-600">{errors.issue_date[0]}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Plazo de entrega</label>
                <input
                  type="date"
                  value={deliveryDeadline}
                  onChange={(e) => setDeliveryDeadline(e.target.value)}
                  className={inputClass}
                />
                {errors.delivery_deadline && (
                  <p className="mt-1 text-sm text-red-600">{errors.delivery_deadline[0]}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Observaciones</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Ítems solicitados</h2>

          <div className="relative mt-3">
            <input
              type="search"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar producto por nombre, código o código de barras..."
              className={inputClass}
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
                    </span>
                    <span className="text-xs text-slate-400">
                      {product.is_service ? "Servicio" : `Stock total: ${product.total_stock}`}
                    </span>
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
                  <th className="px-3 py-2 font-medium">Precio Unit. (inc. IGV)</th>
                  <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                      Busca y agrega los productos que solicita la entidad.
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr key={item.product.id}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">{item.product.name}</div>
                      <div className="text-xs text-slate-400">
                        {item.product.is_service ? "Servicio" : `Stock total actual: ${item.product.total_stock}`}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateLine(item.product.id, { quantity: Math.max(1, Number(e.target.value)) })}
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLine(item.product.id, { unitPrice: Math.max(0, Number(e.target.value)) })}
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-slate-900">
                      S/ {(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setItems((current) => current.filter((i) => i.product.id !== item.product.id))}
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

          <div className="mt-4 flex items-center justify-between">
            <p className="text-lg font-semibold text-slate-900">Monto total: S/ {total.toFixed(2)}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/government-orders")}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Guardando..." : "Registrar y ver reporte de stock"}
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
