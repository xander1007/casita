import { useEffect, useState } from "react";
import { Modal } from "../../components/Modal";
import { fetchServiceReceipt } from "../../api/services";
import { ServiceReceiptView } from "./ServiceReceiptView";
import type { ServicePrintPayload } from "../../types/services";

interface ServiceReceiptModalProps {
  serviceId: number;
  onClose: () => void;
}

export function ServiceReceiptModal({ serviceId, onClose }: ServiceReceiptModalProps) {
  const [payload, setPayload] = useState<ServicePrintPayload | null>(null);

  useEffect(() => {
    fetchServiceReceipt(serviceId).then(setPayload);
  }, [serviceId]);

  return (
    <Modal title="Comprobante de servicio técnico" onClose={onClose}>
      <div className="max-h-96 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 py-4">
        {payload ? (
          <ServiceReceiptView payload={payload} />
        ) : (
          <p className="text-center text-sm text-slate-400">Cargando comprobante...</p>
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
