import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import {
  createDocumentSeries,
  deleteDocumentSeries,
  fetchDocumentSeries,
  updateDocumentSeries,
} from "../../api/documentSeries";
import { fetchCashRegisters } from "../../api/cash";
import { useAuth } from "../../context/useAuth";
import { Modal } from "../../components/Modal";
import { DOCUMENT_SERIES_TYPES } from "../../types/cash";
import type { CashRegister, DocumentSeries } from "../../types/cash";

function typeLabel(code: string): string {
  return DOCUMENT_SERIES_TYPES.find((t) => t.value === code)?.label ?? code;
}

export default function DocumentSeriesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("series.manage");

  const [series, setSeries] = useState<DocumentSeries[]>([]);
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [modalSeries, setModalSeries] = useState<DocumentSeries | null | "new">(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    fetchDocumentSeries().then(setSeries);
  }, [refreshIndex]);

  useEffect(() => {
    fetchCashRegisters().then(setRegisters);
  }, []);

  async function handleDelete(item: DocumentSeries) {
    if (!window.confirm(`¿Eliminar la serie "${item.series}"?`)) return;
    await deleteDocumentSeries(item.id);
    setRefreshIndex((i) => i + 1);
  }

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setModalSeries("new")}
            className="btn btn-primary"
          >
            + Nueva serie
          </button>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Tipo de documento</th>
              <th className="px-4 py-3 font-medium">Serie</th>
              <th className="px-4 py-3 font-medium">Correlativo actual</th>
              <th className="px-4 py-3 font-medium">Caja asignada</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              {canManage && <th className="px-4 py-3 font-medium">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {series.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <span className="pill bg-slate-100 text-slate-600">
                    {typeLabel(item.document_type)}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-900">{item.series}</td>
                <td className="px-4 py-3 text-slate-600">
                  {item.current_correlative.toString().padStart(6, "0")}
                </td>
                <td className="px-4 py-3 text-slate-500">{item.cash_register?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`pill ${
                      item.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {item.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setModalSeries(item)}
                        className="text-indigo-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalSeries !== null && (
        <SeriesFormModal
          series={modalSeries === "new" ? null : modalSeries}
          registers={registers}
          onClose={() => setModalSeries(null)}
          onSaved={() => {
            setModalSeries(null);
            setRefreshIndex((i) => i + 1);
          }}
        />
      )}
    </div>
  );
}

function SeriesFormModal({
  series,
  registers,
  onClose,
  onSaved,
}: {
  series: DocumentSeries | null;
  registers: CashRegister[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = series !== null;

  const [documentType, setDocumentType] = useState(series?.document_type ?? "03");
  const [code, setCode] = useState(series?.series ?? "");
  const [cashRegisterId, setCashRegisterId] = useState(series?.cash_register?.id.toString() ?? "");
  const [currentCorrelative, setCurrentCorrelative] = useState(
    (series?.current_correlative ?? 0).toString(),
  );
  const [isActive, setIsActive] = useState(series?.is_active ?? true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    const payload = {
      document_type: documentType,
      series: code,
      cash_register_id: cashRegisterId ? Number(cashRegisterId) : null,
      current_correlative: Number(currentCorrelative),
      is_active: isActive,
    };

    try {
      if (isEditing) {
        await updateDocumentSeries(series.id, payload);
      } else {
        await createDocumentSeries(payload);
      }
      onSaved();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Editar serie" : "Nueva serie"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de documento</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="field w-full"
          >
            {DOCUMENT_SERIES_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Serie</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="B001"
            required
            className="field w-full font-mono"
          />
          {errors.series && <p className="mt-1 text-sm text-red-600">{errors.series[0]}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Caja asignada</label>
          <select
            value={cashRegisterId}
            onChange={(e) => setCashRegisterId(e.target.value)}
            className="field w-full"
          >
            <option value="">Sin asignar</option>
            {registers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        {isEditing && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Correlativo actual
            </label>
            <input
              type="number"
              min="0"
              value={currentCorrelative}
              onChange={(e) => setCurrentCorrelative(e.target.value)}
              className="field w-full"
            />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-slate-300"
          />
          Activo
        </label>

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
