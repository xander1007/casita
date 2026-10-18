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
