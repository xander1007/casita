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
          className="btn btn-secondary"
        >
          Imprimir
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-primary"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  );
}
