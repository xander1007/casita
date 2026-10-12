import { CompanyHeaderTicket } from "../../components/print/CompanyHeader";
import type { ServicePrintPayload } from "../../types/services";

interface ServiceReceiptViewProps {
  payload: ServicePrintPayload;
}

export function ServiceReceiptView({ payload }: ServiceReceiptViewProps) {
  const { company, service } = payload;
  const isDelivery = service.status === "delivered";
  const receivedAt = new Date(service.received_at);
  const deliveredAt = service.delivered_at ? new Date(service.delivered_at) : null;

  return (
    <div id="service-print-area" className="print-root mx-auto w-[320px] bg-white p-3 font-mono text-xs text-slate-900">
      <CompanyHeaderTicket company={company} />
      <div className="my-2 border-t border-dashed border-slate-400" />
      <p className="text-center font-semibold">
        {isDelivery ? "COMPROBANTE DE ENTREGA" : "TICKET DE RECEPCIÓN - SERVICIO TÉCNICO"}
      </p>
      <p>N° Registro: {service.code}</p>
      <p>Fecha Registro: {receivedAt.toLocaleDateString("es-PE")}</p>
      {isDelivery && deliveredAt && <p>Fecha entrega: {deliveredAt.toLocaleString("es-PE")}</p>}
      <div className="my-2 border-t border-dashed border-slate-400" />
      <p>Nombre Cliente:</p>
      <p className="font-semibold">{service.customer?.name_or_business_name ?? "-"}</p>
      {service.customer?.address && <p>Dirección Cliente: {service.customer.address}</p>}
      {service.customer?.phone && <p>Teléfono Cliente: {service.customer.phone}</p>}
      <div className="my-2 border-t border-dashed border-slate-400" />
      <p>
        Descripción Equipo: {service.device_type_label}
        {service.brand ? ` ${service.brand}` : ""}
        {service.model ? ` ${service.model}` : ""}
      </p>
      <p>Serie: {service.serial_number || "-"}</p>
      <p>Clave: {service.device_password || "-"}</p>
      <p>Accesorios: {service.accessories || "-"}</p>
      <div className="my-2 border-t border-dashed border-slate-400" />
      <p className="font-semibold">Falla:</p>
      <p>{service.reported_issue}</p>

      {isDelivery && (
        <>
          {service.diagnosis && (
            <>
              <div className="my-2 border-t border-dashed border-slate-400" />
              <p className="font-semibold">Diagnóstico / Trabajo realizado:</p>
              <p>{service.diagnosis}</p>
            </>
          )}
          {service.items.length > 0 && (
            <>
              <div className="my-2 border-t border-dashed border-slate-400" />
              <p className="font-semibold">Repuestos:</p>
              {service.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity} x {item.product_name}
                  </span>
                  <span>S/ {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </>
          )}
          <div className="my-2 border-t border-dashed border-slate-400" />
          <div className="flex justify-between text-sm font-semibold">
            <span>TOTAL COBRADO</span>
            <span>S/ {(service.final_cost ?? service.estimated_cost).toFixed(2)}</span>
          </div>
        </>
      )}

      {!isDelivery && (
        <div className="mt-3 flex justify-between text-sm font-semibold">
          <span>Costo estimado</span>
          <span>S/ {service.estimated_cost.toFixed(2)}</span>
        </div>
      )}

      <div className="mt-3 text-center">
        <p>Conserve este comprobante para el retiro de su equipo.</p>
      </div>
    </div>
  );
}
