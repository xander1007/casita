import { CompanyHeaderA4 } from "../../components/print/CompanyHeader";
import type { DespatchPrintPayload } from "../../types/despatches";

interface DespatchPrintViewProps {
  payload: DespatchPrintPayload;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const datePart = value.slice(0, 10);
  return new Date(`${datePart}T00:00:00`).toLocaleDateString("es-PE");
}

export function DespatchPrintView({ payload }: DespatchPrintViewProps) {
  const { company, despatch } = payload;

  return (
    <div id="despatch-print-area" className="print-root mx-auto w-full max-w-[210mm] bg-white p-8 text-sm text-slate-900">
      <CompanyHeaderA4
        company={company}
        documentTitle="GUÍA DE REMISIÓN ELECTRÓNICA REMITENTE"
        documentNumber={despatch.document_number}
      />

      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-1 rounded-md border border-slate-300 p-3">
          <div>
            <span className="font-semibold">Razón Social:</span> {despatch.contact?.name_or_business_name ?? "-"}
          </div>
          <div>
            <span className="font-semibold">RUC/DNI:</span> {despatch.contact?.document_number ?? "-"}
          </div>
          <div>
            <span className="font-semibold">Dom. Fiscal:</span> {despatch.contact?.address ?? "-"}
          </div>
        </div>
        <div className="space-y-1 rounded-md border border-slate-300 p-3">
          <p className="text-center font-semibold">DATOS DEL COMPROBANTE</p>
          <div className="flex justify-between">
            <span className="font-semibold">Comprobante Ref.:</span>
            <span>{despatch.reference_sale?.document_number ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Motivo de Traslado:</span>
            <span>{despatch.transport_reason ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Peso Bruto (KGM):</span>
            <span>{despatch.gross_weight ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Número de Bultos:</span>
            <span>{despatch.package_count ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Orden Compra:</span>
            <span>{despatch.order_number ?? "-"}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
        <div className="rounded-md border border-slate-300 p-3">
          <span className="font-semibold">Dir. Partida:</span> {despatch.starting_address ?? "-"}
        </div>
        <div className="rounded-md border border-slate-300 p-3">
          <span className="font-semibold">Dir. Llegada:</span> {despatch.arrival_address ?? "-"}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-4 border border-slate-300 p-3 text-center text-xs">
        <div>
          <p className="font-semibold">FECHA DE EMISIÓN</p>
          <p>{formatDate(despatch.emission_date)}</p>
        </div>
        <div>
          <p className="font-semibold">FECHA DE INICIO DE TRASLADO</p>
          <p>{formatDate(despatch.transport_start_date)}</p>
        </div>
        <div>
          <p className="font-semibold">FECHA DE ENTREGA DE BIENES</p>
          <p>{formatDate(despatch.delivery_date)}</p>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse text-left text-xs">
        <thead className="border-y border-slate-800 bg-slate-100">
          <tr>
            <th className="py-2 pl-2">#</th>
            <th className="py-2">CÓDIGO</th>
            <th className="py-2">DESCRIPCIÓN</th>
            <th className="py-2 text-right">CANTIDAD</th>
            <th className="py-2 text-right">UNID.</th>
            <th className="py-2 pr-2 text-right">PESO</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {despatch.details.map((item, index) => (
            <tr key={item.id}>
              <td className="py-2 pl-2">{index + 1}</td>
              <td className="py-2">{item.code ?? "-"}</td>
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{item.unit_of_measure}</td>
              <td className="py-2 pr-2 text-right">{item.weight ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 rounded-md border border-slate-300 p-3 text-xs">
        <span className="font-semibold">OBSERVACIONES:</span> {despatch.observations ?? "-"}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
        <div className="rounded-md border border-slate-300 p-3">
          <p>
            <span className="font-semibold">Nro de Placa:</span> {despatch.vehicle_plate ?? "-"}
          </p>
          <p>
            <span className="font-semibold">Marca vehículo:</span> {despatch.vehicle_brand ?? "-"}
          </p>
        </div>
        <div className="rounded-md border border-slate-300 p-3">
          <p className="font-semibold">DATOS DEL CONDUCTOR</p>
          <p>
            <span className="font-semibold">DNI:</span> {despatch.driver_dni ?? "-"}
          </p>
          <p>
            <span className="font-semibold">Nro. Licencia:</span> {despatch.driver_license ?? "-"}
          </p>
        </div>
      </div>

      {despatch.status === "annulled" && (
        <p className="mt-6 text-center text-base font-semibold text-red-600">*** GUÍA ANULADA ***</p>
      )}

      <p className="mt-8 text-center text-[10px] text-slate-400">
        Representación impresa de la GUÍA DE REMISIÓN ELECTRÓNICA REMITENTE.
      </p>
    </div>
  );
}
