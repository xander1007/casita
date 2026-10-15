import { useEffect, useState } from "react";
import axios from "axios";
import { annulSettlement, fetchSettlements } from "../../api/settlements";
import type { PaginationMeta } from "../../types/common";
import type { PaymentSettlement } from "../../types/settlements";
import {
  CURRENCY_SYMBOLS,
  SETTLEMENT_DOCUMENT_TYPE_LABELS,
  SETTLEMENT_PAYMENT_METHOD_LABELS,
} from "../../types/settlements";
import { useAuth } from "../../context/useAuth";
import { Modal } from "../../components/Modal";
import { SettlementFormModal } from "./SettlementFormModal";

const inputClass =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

function AnnulSettlementModal({
  settlement,
  onClose,
  onAnnulled,
}: {
  settlement: PaymentSettlement;
  onClose: () => void;
  onAnnulled: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAnnul() {
    setError(null);
    setIsSubmitting(true);
    try {
      await annulSettlement(settlement.id, reason);
      onAnnulled();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.errors?.reason?.[0] ??
              err.response?.data?.errors?.settlement?.[0] ??
              err.response?.data?.message ??
              "No se pudo anular la cancelación.")
          : "No se pudo anular la cancelación.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Anular cancelación" onClose={onClose}>
      <p className="text-sm text-slate-600">
        {SETTLEMENT_DOCUMENT_TYPE_LABELS[settlement.document_type]} {settlement.document_number} —{" "}
        {CURRENCY_SYMBOLS[settlement.currency]} {settlement.amount.toFixed(2)}. El registro se conserva como anulado.
      </p>
      <label className="mb-1 mt-4 block text-sm font-medium text-slate-700">Motivo de anulación</label>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
      />
      {error && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={isSubmitting || reason.trim() === ""}
          onClick={handleAnnul}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          Confirmar anulación
        </button>
      </div>
    </Modal>
  );
}

export default function SettlementsPage() {
  const { hasPermission } = useAuth();
  const [settlements, setSettlements] = useState<PaymentSettlement[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    document_type: "",
    payment_method: "",
    status: "",
    date_from: "",
    date_to: "",
  });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [toAnnul, setToAnnul] = useState<PaymentSettlement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchSettlements({ ...filters, page })
      .then((response) => {
        if (cancelled) return;
        setSettlements(response.data);
        setMeta(response.meta);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, page, refreshIndex]);

  function applyFilter(key: keyof typeof filters, value: string) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function reload() {
    setRefreshIndex((i) => i + 1);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Cancelación de Comprobantes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registra el pago de facturas, notas de crédito y letras con su operación bancaria.
          </p>
        </div>
        {hasPermission("settlements.create") && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Registrar cancelación
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={filters.search}
          onChange={(e) => applyFilter("search", e.target.value)}
          placeholder="Buscar comprobante, N° operación o contacto..."
          className={`w-72 ${inputClass}`}
        />
        <select value={filters.document_type} onChange={(e) => applyFilter("document_type", e.target.value)} className={inputClass}>
          <option value="">Todos los comprobantes</option>
          {Object.entries(SETTLEMENT_DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={filters.payment_method} onChange={(e) => applyFilter("payment_method", e.target.value)} className={inputClass}>
          <option value="">Todos los medios</option>
          {Object.entries(SETTLEMENT_PAYMENT_METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => applyFilter("status", e.target.value)} className={inputClass}>
          <option value="">Todos los estados</option>
          <option value="registered">Registrado</option>
          <option value="annulled">Anulado</option>
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => applyFilter("date_from", e.target.value)} className={inputClass} />
        <input type="date" value={filters.date_to} onChange={(e) => applyFilter("date_to", e.target.value)} className={inputClass} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Comprobante</th>
              <th className="px-4 py-3 font-medium">Cliente / Proveedor</th>
              <th className="px-4 py-3 font-medium">Fecha de pago</th>
              <th className="px-4 py-3 font-medium">Medio / N° operación</th>
              <th className="px-4 py-3 font-medium">Banco / Cuenta</th>
              <th className="px-4 py-3 text-right font-medium">Importe</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!isLoading && settlements.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  No se encontraron cancelaciones.
                </td>
              </tr>
            )}
            {!isLoading &&
              settlements.map((s) => (
                <tr key={s.id} className={s.status === "annulled" ? "text-slate-400" : undefined}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{s.document_number}</div>
                    <div className="text-xs text-slate-400">{SETTLEMENT_DOCUMENT_TYPE_LABELS[s.document_type]}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.contact?.name_or_business_name ?? "-"}
                    <div className="text-xs text-slate-400">{s.contact?.document_number}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(`${s.payment_date}T00:00:00`).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {SETTLEMENT_PAYMENT_METHOD_LABELS[s.payment_method]}
                    <div className="text-xs text-slate-400">{s.operation_number ?? "Sin N° de operación"}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.bank}
                    <div className="text-xs text-slate-400">{s.account}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">
                    {CURRENCY_SYMBOLS[s.currency]} {s.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      title={s.annulment_reason ?? undefined}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.status === "annulled" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {s.status === "annulled" ? "Anulado" : "Registrado"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.status === "registered" && hasPermission("settlements.annul") && (
                      <button
                        type="button"
                        onClick={() => setToAnnul(s)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Anular
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Página {meta.current_page} de {meta.last_page} ({meta.total} cancelaciones)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => setPage(meta.current_page - 1)}
              className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage(meta.current_page + 1)}
              className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <SettlementFormModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            reload();
          }}
        />
      )}

      {toAnnul && (
        <AnnulSettlementModal
          settlement={toAnnul}
          onClose={() => setToAnnul(null)}
          onAnnulled={() => {
            setToAnnul(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
