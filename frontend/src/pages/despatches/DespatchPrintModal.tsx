import { useEffect, useState } from "react";
import { Modal } from "../../components/Modal";
import { fetchDespatchPrintPayload } from "../../api/despatches";
import { DespatchPrintView } from "./DespatchPrintView";
import type { DespatchPrintPayload } from "../../types/despatches";

interface DespatchPrintModalProps {
  despatchId: number;
  onClose: () => void;
}

export function DespatchPrintModal({ despatchId, onClose }: DespatchPrintModalProps) {
  const [payload, setPayload] = useState<DespatchPrintPayload | null>(null);

  useEffect(() => {
    fetchDespatchPrintPayload(despatchId).then(setPayload);
  }, [despatchId]);

  return (
    <Modal title="Guía de Remisión" onClose={onClose} maxWidth="max-w-4xl">
      <div className="max-h-[32rem] overflow-y-auto rounded-md border border-slate-200 bg-slate-50 py-4">
        {payload ? (
          <DespatchPrintView payload={payload} />
        ) : (
          <p className="text-center text-sm text-slate-400">Cargando guía...</p>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          disabled={!payload}
          onClick={() => window.print()}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Imprimir
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
