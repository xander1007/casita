import { useEffect, useState } from "react";
import { Modal } from "../../components/Modal";
import { fetchSalePrintPayload } from "../../api/pos";
import { SalePrintView } from "./SalePrintView";
import type { Sale, SalePrintPayload } from "../../types/sales";

interface SaleSuccessModalProps {
  sale: Sale;
  change: number;
  onNewSale: () => void;
}

export function SaleSuccessModal({ sale, change, onNewSale }: SaleSuccessModalProps) {
  const [payload, setPayload] = useState<SalePrintPayload | null>(null);
  const [format, setFormat] = useState<"80mm" | "a4">("80mm");

  useEffect(() => {
    fetchSalePrintPayload(sale.id).then(setPayload);
  }, [sale.id]);

  return (
    <Modal title="Venta registrada" onClose={onNewSale} maxWidth="max-w-4xl">
      <div className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        Comprobante {sale.document_number} generado por S/ {sale.total.toFixed(2)}.
        {change > 0 && <span className="block font-semibold">Vuelto: S/ {change.toFixed(2)}</span>}
      </div>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setFormat("80mm")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            format === "80mm" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          Ticket 80mm
        </button>
        <button
          type="button"
          onClick={() => setFormat("a4")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            format === "a4" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          Formato A4
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 py-4">
        {payload ? (
          <SalePrintView payload={payload} format={format} />
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
          onClick={onNewSale}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Nueva venta
        </button>
      </div>
    </Modal>
  );
}
