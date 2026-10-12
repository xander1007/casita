import { CompanyHeaderA4, CompanyHeaderTicket, LEGAL_NOTICE } from "../../components/print/CompanyHeader";
import { DOCUMENT_TYPE_PRINT_TITLES, PAYMENT_METHOD_LABELS } from "../../types/sales";
import type { SalePrintPayload } from "../../types/sales";

interface SalePrintViewProps {
  payload: SalePrintPayload;
  format: "80mm" | "a4";
}

const CONTACT_DOC_LABELS: Record<string, string> = {
  "1": "DNI",
  "6": "RUC",
  "4": "Carné Ext.",
  "7": "Pasaporte",
  "0": "Doc.",
};

export function SalePrintView({ payload, format }: SalePrintViewProps) {
  const { company, sale } = payload;
  const createdAt = new Date(sale.created_at);
  const contactDocLabel = sale.contact ? CONTACT_DOC_LABELS[sale.contact.identity_document_type] ?? "Doc." : null;
  const amountInWords = sale.amount_in_words ?? "";

  if (format === "80mm") {
    return (
      <div id="sale-print-area" className="print-root mx-auto w-[300px] bg-white p-3 font-mono text-xs text-slate-900">
        <CompanyHeaderTicket company={company} />
        <div className="my-2 border-t border-dashed border-slate-400" />
        <p className="text-center font-semibold">{DOCUMENT_TYPE_PRINT_TITLES[sale.document_type]}</p>
        <p className="text-center font-semibold">{sale.document_number}</p>
        <p>Fecha: {createdAt.toLocaleString("es-PE")}</p>
        <p>Condición pago: {sale.payment_condition}</p>
        <p>Cliente: {sale.contact?.name_or_business_name ?? "Clientes Varios"}</p>
        {sale.contact && sale.contact.document_number !== "00000000" && (
          <p>
            {contactDocLabel}: {sale.contact.document_number}
          </p>
        )}
        <div className="my-2 border-t border-dashed border-slate-400" />
        {sale.details.map((detail) => (
          <div key={detail.id} className="mb-1">
            <p>{detail.product_name}</p>
            {detail.product_serial && <p className="text-[10px]">S/N: {detail.product_serial}</p>}
            <div className="flex justify-between">
              <span>
                {detail.quantity} x {detail.unit_price.toFixed(2)}
              </span>
              <span>S/ {detail.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
        <div className="my-2 border-t border-dashed border-slate-400" />
        <div className="flex justify-between">
          <span>Op. Gravada</span>
          <span>S/ {sale.op_taxed.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Op. Exonerada</span>
          <span>S/ {sale.op_exonerated.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Op. Inafecta</span>
          <span>S/ 0.00</span>
        </div>
        <div className="flex justify-between">
          <span>IGV (18%)</span>
          <span>S/ {sale.igv.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold">
          <span>IMPORTE TOTAL</span>
          <span>S/ {sale.total.toFixed(2)}</span>
        </div>
        {amountInWords && (
          <>
            <div className="my-2 border-t border-dashed border-slate-400" />
            <p className="text-[10px] font-semibold">{amountInWords}</p>
          </>
        )}
        <div className="my-2 border-t border-dashed border-slate-400" />
        {sale.payments.map((payment) => (
          <div key={payment.id} className="flex justify-between">
            <span>{PAYMENT_METHOD_LABELS[payment.payment_method]}</span>
            <span>S/ {payment.amount.toFixed(2)}</span>
          </div>
        ))}
        <div className="mt-3 text-center">
          <p>¡Gracias por su compra!</p>
          <p className="font-semibold">*****NOTA IMPORTANTE*****</p>
          <p>{LEGAL_NOTICE}</p>
          {sale.status === "annulled" && <p className="font-semibold">*** COMPROBANTE ANULADO ***</p>}
        </div>
      </div>
    );
  }

  return (
    <div id="sale-print-area" className="print-root mx-auto w-full max-w-[210mm] bg-white p-8 text-sm text-slate-900">
      <CompanyHeaderA4
        company={company}
        documentTitle={DOCUMENT_TYPE_PRINT_TITLES[sale.document_type]}
        documentNumber={sale.document_number}
      />

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 rounded-md border border-slate-300 p-3 text-xs">
        <div>
          <span className="font-semibold">Razón Social:</span> {sale.contact?.name_or_business_name ?? "Clientes Varios"}
        </div>
        <div>
          <span className="font-semibold">Fecha Emisión:</span> {createdAt.toLocaleDateString("es-PE")}
        </div>
        <div>
          <span className="font-semibold">{contactDocLabel ?? "Doc."}:</span> {sale.contact?.document_number ?? "-"}
        </div>
        <div>
          <span className="font-semibold">Tipo Moneda:</span> SOLES
        </div>
        <div>
          <span className="font-semibold">Dirección:</span> {sale.contact?.address ?? "-"}
        </div>
        <div>
          <span className="font-semibold">Condición pago:</span> {sale.payment_condition}
        </div>
        <div />
        <div>
          <span className="font-semibold">Vendedor:</span> {sale.user ?? "-"}
        </div>
      </div>

      <table className="mt-4 w-full border-collapse text-left text-xs">
        <thead className="border-y border-slate-800 bg-slate-100">
          <tr>
            <th className="py-2 pl-2">DESCRIPCIÓN</th>
            <th className="py-2 text-right">CANTIDAD</th>
            <th className="py-2 text-right">UNID.</th>
            <th className="py-2 text-right">PRECIO UNITARIO</th>
            <th className="py-2 pr-2 text-right">PRECIO VENTA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sale.details.map((detail) => (
            <tr key={detail.id}>
              <td className="py-2 pl-2">
                {detail.product_name}
                {detail.product_serial && (
                  <span className="block text-[10px] text-slate-400">S/N: {detail.product_serial}</span>
                )}
              </td>
              <td className="py-2 text-right">{detail.quantity.toFixed(3)}</td>
              <td className="py-2 text-right">NIU</td>
              <td className="py-2 text-right">{detail.unit_price.toFixed(2)}</td>
              <td className="py-2 pr-2 text-right">{detail.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {amountInWords && <p className="mt-4 text-xs font-semibold">{amountInWords}</p>}
      <p className="mt-1 text-xs">
        <span className="font-semibold">Observaciones:</span>
      </p>

      <div className="mt-4 flex justify-end">
        <dl className="w-72 space-y-1 border border-slate-300 p-3 text-xs">
          <div className="flex justify-between">
            <dt>OP. GRAVADA:</dt>
            <dd>S/ {sale.op_taxed.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>OP. EXONERADA:</dt>
            <dd>S/ {sale.op_exonerated.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>OP. INAFECTA:</dt>
            <dd>S/ 0.00</dd>
          </div>
          <div className="flex justify-between">
            <dt>IGV: 18.00 %</dt>
            <dd>S/ {sale.igv.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-300 pt-1 text-sm font-bold">
            <dt>IMPORTE TOTAL:</dt>
            <dd>S/ {sale.total.toFixed(2)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-3 text-xs">
        <p className="text-slate-500">Pagos</p>
        {sale.payments.map((payment) => (
          <div key={payment.id} className="flex justify-between">
            <span>
              {PAYMENT_METHOD_LABELS[payment.payment_method]}
              {payment.reference_number && ` — Ref: ${payment.reference_number}`}
            </span>
            <span>S/ {payment.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-xs">
        <p>¡GRACIAS POR SU COMPRA!</p>
        <p className="mt-1 font-semibold">*****NOTA IMPORTANTE*****</p>
        <p>{LEGAL_NOTICE}</p>
      </div>

      {sale.status === "annulled" && (
        <p className="mt-6 text-center text-base font-semibold text-red-600">
          *** COMPROBANTE ANULADO {sale.annulment_reason ? `— ${sale.annulment_reason}` : ""} ***
        </p>
      )}

      <p className="mt-6 text-center text-[10px] text-slate-400">
        Representación impresa de la {DOCUMENT_TYPE_PRINT_TITLES[sale.document_type]}.
      </p>
    </div>
  );
}
