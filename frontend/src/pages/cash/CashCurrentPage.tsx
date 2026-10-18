import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { closeShift, fetchCashRegisters, fetchCurrentShift, openShift } from "../../api/cash";
import type { CashRegister, CashShift } from "../../types/cash";

export default function CashCurrentPage() {
  const [shift, setShift] = useState<CashShift | null | "loading">("loading");
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    fetchCashRegisters().then(setRegisters);
  }, []);

  useEffect(() => {
    fetchCurrentShift().then(setShift);
  }, [refreshIndex]);

  function refresh() {
    setShift("loading");
    setRefreshIndex((i) => i + 1);
  }

  if (shift === "loading") {
    return <p className="text-sm text-slate-400">Cargando...</p>;
  }

  if (shift === null) {
    return <OpenShiftForm registers={registers} onOpened={refresh} />;
  }

  return <ShiftControlCard shift={shift} onClosed={refresh} />;
}

function OpenShiftForm({
  registers,
  onOpened,
}: {
  registers: CashRegister[];
  onOpened: () => void;
}) {
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRegisterId = cashRegisterId || (registers[0]?.id.toString() ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await openShift({
        cash_register_id: Number(selectedRegisterId),
        opening_balance: Number(openingBalance),
      });
      onOpened();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.errors?.cash_register_id?.[0] ?? "No se pudo abrir la caja.")
          : "No se pudo abrir la caja.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card mx-auto max-w-md p-8">
      <h2 className="text-lg font-semibold text-slate-900">Apertura de Caja</h2>
      <p className="mt-1 text-sm text-slate-500">
        No tienes una caja abierta. Ingresa el monto inicial en efectivo para comenzar.
      </p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Caja</label>
          <select
            value={selectedRegisterId}
            onChange={(e) => setCashRegisterId(e.target.value)}
            required
            className="field w-full"
          >
            {registers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Monto inicial (S/)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            required
            className="field w-full"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !selectedRegisterId}
          className="btn btn-primary w-full"
        >
          {isSubmitting ? "Abriendo..." : "Abrir caja"}
        </button>
      </form>
    </div>
  );
}

function ShiftControlCard({ shift, onClosed }: { shift: CashShift; onClosed: () => void }) {
  const expected = shift.opening_balance + shift.total_cash_sales;

  const [closingBalance, setClosingBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);

  const previewDifference =
    closingBalance !== "" ? Number(closingBalance) - expected : null;

  async function handleClose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await closeShift(shift.id, {
        closing_balance: Number(closingBalance),
        notes: notes || undefined,
      });
      onClosed();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "No se pudo cerrar la caja.")
          : "No se pudo cerrar la caja.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {shift.cash_register?.name ?? "Caja"}
            </h2>
            <p className="text-sm text-slate-500">
              Abierta el {new Date(shift.opened_at).toLocaleString("es-PE")}
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            Abierta
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Monto de apertura</dt>
            <dd className="text-lg font-semibold text-slate-900">
              S/ {shift.opening_balance.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Ventas en efectivo</dt>
            <dd className="text-lg font-semibold text-slate-900">
              S/ {shift.total_cash_sales.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Ventas con tarjeta</dt>
            <dd className="text-slate-700">S/ {shift.total_card_sales.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Ventas por transferencia</dt>
            <dd className="text-slate-700">S/ {shift.total_transfer_sales.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Ventas Yape/Plin</dt>
            <dd className="text-slate-700">S/ {shift.total_yape_plin_sales.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Efectivo esperado en caja</dt>
            <dd className="text-lg font-semibold text-slate-900">S/ {expected.toFixed(2)}</dd>
          </div>
        </dl>

        {!showCloseForm && (
          <div className="mt-6 flex gap-2">
            <Link
              to="/pos"
              className="btn btn-primary flex-1 text-center"
            >
              Ir al Punto de Venta
            </Link>
            <button
              type="button"
              onClick={() => setShowCloseForm(true)}
              className="btn flex-1 bg-ink-800 text-white shadow-sm hover:bg-ink-900"
            >
              Cerrar caja / Arqueo
            </button>
          </div>
        )}
      </div>

      {showCloseForm && (
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-900">Cierre de caja (arqueo)</h3>
          <p className="mt-1 text-sm text-slate-500">
            Cuenta el efectivo físico en caja e ingresa el monto real.
          </p>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleClose} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Monto real contado (S/)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                required
                className="field w-full"
              />
            </div>

            {previewDifference !== null && (
              <div
                className={`rounded-md px-3 py-2 text-sm ${
                  previewDifference === 0
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                Diferencia: S/ {previewDifference.toFixed(2)}{" "}
                {previewDifference === 0
                  ? "(cuadre exacto)"
                  : previewDifference > 0
                    ? "(sobrante)"
                    : "(faltante)"}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Observaciones
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="field w-full"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCloseForm(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? "Cerrando..." : "Confirmar cierre"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
