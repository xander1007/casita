import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { createQuotation, fetchQuotation, updateQuotation } from "../../api/quotations";
import { fetchSalesWarehouses } from "../../api/salesOrders";
import { CustomerPicker } from "../../components/sales/CustomerPicker";
import { SalesLinesEditor } from "../../components/sales/SalesLinesEditor";
import type { SalesLine } from "../../components/sales/salesLines";
import type { Contact } from "../../types/contacts";
import type { Warehouse } from "../../types/inventory";
import { localTodayIso } from "../../utils/dates";

const inputClass = "field w-full disabled:bg-slate-50";

export default function QuotationFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editingId = id ? Number(id) : null;

  const [isLoading, setIsLoading] = useState(Boolean(editingId));
  const [code, setCode] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Contact | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [issueDate, setIssueDate] = useState(localTodayIso());
  const [validUntil, setValidUntil] = useState(localTodayIso(15));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<SalesLine[]>([]);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSalesWarehouses().then(setWarehouses);
  }, []);

  useEffect(() => {
    if (!editingId) return;

    fetchQuotation(editingId)
      .then((quotation) => {
        if (quotation.status !== "draft") {
          navigate("/quotations", { replace: true });
          return;
        }
        setCode(quotation.code);
        setCustomer(quotation.contact);
        setWarehouseId(quotation.warehouse ? String(quotation.warehouse.id) : "");
        setIssueDate(quotation.issue_date);
        setValidUntil(quotation.valid_until);
        setNotes(quotation.notes ?? "");
        setLines(
          (quotation.items ?? [])
            .filter((item) => item.product)
            .map((item) => ({ product: item.product!, quantity: item.quantity, unitPrice: item.unit_price })),
        );
      })
      .finally(() => setIsLoading(false));
  }, [editingId, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    if (!customer) {
      setFormError("Selecciona el cliente de la cotización.");
      return;
    }
    if (lines.length === 0) {
      setFormError("Agrega al menos un producto a la cotización.");
      return;
    }

    const payload = {
      contact_id: customer.id,
      warehouse_id: warehouseId ? Number(warehouseId) : null,
      issue_date: issueDate,
      valid_until: validUntil,
      notes: notes || null,
      items: lines.map((line) => ({
        product_id: line.product.id,
        quantity: line.quantity,
        unit_price: line.unitPrice,
      })),
    };

    setIsSubmitting(true);
    try {
      const saved = editingId ? await updateQuotation(editingId, payload) : await createQuotation(payload);
      navigate("/quotations", { state: { openQuotationId: saved.id } });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setErrors(error.response.data.errors ?? {});
        setFormError(error.response.data.message ?? null);
      } else {
        setFormError("No se pudo guardar la cotización. Intenta nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-slate-400">Cargando cotización...</p>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold text-slate-900">
        {code ? `Editar cotización ${code}` : "Nueva Cotización"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        La cotización no reserva stock. Una vez aprobada podrás convertirla en pedido o facturarla en el POS.
      </p>

      {formError && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-6">
        <section className="card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <CustomerPicker value={customer} onChange={setCustomer} error={errors.contact_id?.[0]} />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Almacén de referencia</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                disabled={lines.length > 0}
                className={inputClass}
              >
                <option value="">Todos los almacenes</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                {lines.length > 0
                  ? "Quita los productos para cambiar el almacén."
                  : "Solo se usa para mostrar la disponibilidad de stock."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Fecha de emisión</label>
                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputClass} />
                {errors.issue_date && <p className="mt-1 text-sm text-red-600">{errors.issue_date[0]}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Válida hasta</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputClass} />
                {errors.valid_until && <p className="mt-1 text-sm text-red-600">{errors.valid_until[0]}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Observaciones / condiciones</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Forma de pago, plazo de entrega, garantía..."
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Productos</h2>
          <SalesLinesEditor
            lines={lines}
            onChange={setLines}
            warehouseId={warehouseId ? Number(warehouseId) : null}
            mode="quotation"
            error={errors.items?.[0]}
          />

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate("/quotations")}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar cotización"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
