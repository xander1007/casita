import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { createSalesOrder, fetchSalesWarehouses } from "../../api/salesOrders";
import { CustomerPicker } from "../../components/sales/CustomerPicker";
import { SalesLinesEditor } from "../../components/sales/SalesLinesEditor";
import type { SalesLine } from "../../components/sales/salesLines";
import type { Contact } from "../../types/contacts";
import type { Warehouse } from "../../types/inventory";
import { localTodayIso } from "../../utils/dates";

const inputClass = "field w-full disabled:bg-slate-50";

export default function SalesOrderFormPage() {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Contact | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [orderDate, setOrderDate] = useState(localTodayIso());
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<SalesLine[]>([]);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSalesWarehouses().then(setWarehouses);
  }, []);

  const onDemandUnits = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          line.product.is_service ? sum : sum + Math.max(0, line.quantity - line.product.available_stock),
        0,
      ),
    [lines],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    if (!customer) {
      setFormError("Selecciona el cliente del pedido.");
      return;
    }
    if (!warehouseId) {
      setFormError("Selecciona el almacén desde el que se atenderá el pedido.");
      return;
    }
    if (lines.length === 0) {
      setFormError("Agrega al menos un producto al pedido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createSalesOrder({
        contact_id: customer.id,
        warehouse_id: Number(warehouseId),
        order_date: orderDate,
        expected_date: expectedDate || null,
        notes: notes || null,
        items: lines.map((line) => ({
          product_id: line.product.id,
          quantity: line.quantity,
          unit_price: line.unitPrice,
        })),
      });
      navigate("/sales-orders", { state: { openOrderId: order.id } });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors ?? {});
        setFormError(error.response.data.message ?? null);
      } else {
        setFormError("No se pudo registrar el pedido. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold text-slate-900">Nuevo Pedido de Venta</h1>
      <p className="mt-1 text-sm text-slate-500">
        El stock disponible se reserva para el cliente. Los productos sin stock quedan "a demanda" y aparecen en las
        compras sugeridas por la cantidad exacta.
      </p>

      {formError && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-6">
        <section className="card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <CustomerPicker value={customer} onChange={setCustomer} error={errors.contact_id?.[0]} />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Almacén de despacho</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                disabled={lines.length > 0}
                className={inputClass}
              >
                <option value="">Selecciona un almacén</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                {lines.length > 0
                  ? "Quita los productos para cambiar el almacén."
                  : "Aquí se reserva el stock y se recibe la compra a demanda."}
              </p>
              {errors.warehouse_id && <p className="mt-1 text-sm text-red-600">{errors.warehouse_id[0]}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Fecha del pedido</label>
                <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Entrega comprometida</label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className={inputClass}
                />
                {errors.expected_date && <p className="mt-1 text-sm text-red-600">{errors.expected_date[0]}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Observaciones</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Productos</h2>
          {!warehouseId ? (
            <p className="rounded-md bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">
              Selecciona primero el almacén para ver el stock disponible.
            </p>
          ) : (
            <SalesLinesEditor
              lines={lines}
              onChange={setLines}
              warehouseId={Number(warehouseId)}
              mode="order"
              error={errors.items?.[0]}
            />
          )}

          {onDemandUnits > 0 && (
            <div className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {onDemandUnits} unidad(es) no tienen stock y se registrarán <strong>a demanda</strong>. El pedido quedará
              "Esperando compra" hasta que ingrese la mercadería.
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate("/sales-orders")}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? "Guardando..." : "Registrar pedido"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
