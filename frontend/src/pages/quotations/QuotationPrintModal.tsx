import { useEffect, useState } from "react";
import { Modal } from "../../components/Modal";
import { CompanyHeaderA4 } from "../../components/print/CompanyHeader";
import { fetchQuotationPrintPayload } from "../../api/quotations";
import type { QuotationPrintPayload } from "../../types/quotations";
import { formatDate } from "../../utils/dates";

function QuotationPrintView({ payload }: { payload: QuotationPrintPayload }) {
  const { company, quotation } = payload;

  return (
    <div className="print-root mx-auto w-full max-w-[210mm] bg-white p-8 text-sm text-slate-900">
      <CompanyHeaderA4 company={company} documentTitle="PROFORMA / COTIZACIÓN" documentNumber={quotation.code} />

      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-1 rounded-md border border-slate-300 p-3">
          <div>
            <span className="font-semibold">Cliente:</span> {quotation.contact?.name_or_business_name ?? "-"}
          </div>
          <div>
            <span className="font-semibold">RUC/DNI:</span> {quotation.contact?.document_number ?? "-"}
          </div>
          <div>
            <span className="font-semibold">Dirección:</span> {quotation.contact?.address ?? "-"}
          </div>
        </div>
        <div className="space-y-1 rounded-md border border-slate-300 p-3">
          <div className="flex justify-between">
            <span className="font-semibold">Fecha de emisión:</span>
            <span>{formatDate(quotation.issue_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Válida hasta:</span>
            <span>{formatDate(quotation.valid_until)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Moneda:</span>
            <span>Soles (S/)</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Vendedor:</span>
            <span>{quotation.user ?? "-"}</span>
          </div>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse text-xs">
        <thead>
          <tr className="border-y border-slate-800 bg-slate-100">
            <th className="px-2 py-1 text-left">Cant.</th>
            <th className="px-2 py-1 text-left">Código</th>
            <th className="px-2 py-1 text-left">Descripción</th>
            <th className="px-2 py-1 text-right">P. Unit.</th>
            <th className="px-2 py-1 text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {quotation.items?.map((item) => (
            <tr key={item.id} className="border-b border-slate-200">
              <td className="px-2 py-1">{item.quantity}</td>
              <td className="px-2 py-1">{item.product?.internal_code}</td>
              <td className="px-2 py-1">{item.product?.name}</td>
              <td className="px-2 py-1 text-right">{item.unit_price.toFixed(2)}</td>
              <td className="px-2 py-1 text-right">{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex justify-between gap-6 text-xs">
        <div className="flex-1">
          {quotation.notes && (
            <div className="rounded-md border border-slate-300 p-2">
              <p className="font-semibold">Condiciones:</p>
              <p className="whitespace-pre-line">{quotation.notes}</p>
            </div>
          )}
          <p className="mt-2 text-slate-500">
            Documento sin valor tributario. Precios incluyen IGV y están sujetos a disponibilidad de stock.
          </p>
        </div>
        <dl className="w-56 space-y-1">
          <div className="flex justify-between">
            <dt>Op. Gravada</dt>
            <dd>S/ {quotation.op_taxed.toFixed(2)}</dd>
          </div>
          {quotation.op_exonerated > 0 && (
            <div className="flex justify-between">
              <dt>Op. Exonerada</dt>
              <dd>S/ {quotation.op_exonerated.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>IGV 18%</dt>
            <dd>S/ {quotation.igv.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-800 pt-1 text-sm font-bold">
            <dt>TOTAL</dt>
            <dd>S/ {quotation.total.toFixed(2)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function QuotationPrintModal({ quotationId, onClose }: { quotationId: number; onClose: () => void }) {
  const [payload, setPayload] = useState<QuotationPrintPayload | null>(null);

  useEffect(() => {
    fetchQuotationPrintPayload(quotationId).then(setPayload);
  }, [quotationId]);

  return (
    <Modal title="Proforma" onClose={onClose} maxWidth="max-w-4xl">
      <div className="max-h-[32rem] overflow-y-auto rounded-md border border-slate-200 bg-slate-50 py-4">
        {payload ? (
          <QuotationPrintView payload={payload} />
        ) : (
          <p className="text-center text-sm text-slate-400">Cargando proforma...</p>
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
