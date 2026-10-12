import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../components/Modal";
import { fetchTechnicians, updateService } from "../../api/services";
import { ServicePartsSection } from "./ServicePartsSection";
import { ServiceReceiptModal } from "./ServiceReceiptModal";
import { useAuth } from "../../context/useAuth";
import type { ServiceStatus, Technician, TechnicalService } from "../../types/services";

interface ServiceDetailModalProps {
  service: TechnicalService;
  onClose: () => void;
  onChanged: (service: TechnicalService) => void;
}

const LOCKED_STATUSES: ServiceStatus[] = ["delivered", "cancelled"];

export function ServiceDetailModal({ service, onClose, onChanged }: ServiceDetailModalProps) {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const canManage = hasPermission("services.manage");
  const canDeliver = hasPermission("services.deliver");

  const [current, setCurrent] = useState(service);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [technicianId, setTechnicianId] = useState(current.technician?.id.toString() ?? "");
  const [diagnosis, setDiagnosis] = useState(current.diagnosis ?? "");
  const [estimatedCost, setEstimatedCost] = useState(current.estimated_cost.toString());
  const [finalCost, setFinalCost] = useState(current.final_cost?.toString() ?? "");
  const [showReceipt, setShowReceipt] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isLocked = LOCKED_STATUSES.includes(current.status);

  useEffect(() => {
    fetchTechnicians().then(setTechnicians);
  }, []);

  function applyUpdate(updated: TechnicalService) {
    setCurrent(updated);
    setTechnicianId(updated.technician?.id.toString() ?? "");
    setDiagnosis(updated.diagnosis ?? "");
    setEstimatedCost(updated.estimated_cost.toString());
    setFinalCost(updated.final_cost?.toString() ?? "");
    onChanged(updated);
  }

  async function save(status?: ServiceStatus) {
    setFormError(null);
    setIsSaving(true);
    try {
      const updated = await updateService(current.id, {
        technician_id: technicianId ? Number(technicianId) : null,
        diagnosis: diagnosis || null,
        estimated_cost: estimatedCost ? Number(estimatedCost) : 0,
        final_cost: finalCost ? Number(finalCost) : null,
        status,
      });
      applyUpdate(updated);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const responseErrors = error.response.data.errors ?? {};
        setFormError(Object.values(responseErrors).flat().join(" ") || "No se pudo guardar.");
      } else {
        setFormError("No se pudo guardar los cambios.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save(undefined);
  }

  function markRepaired() {
    if (!diagnosis.trim()) {
      setFormError("Ingresa el informe de diagnóstico antes de marcar como reparado.");
      return;
    }
    if (!finalCost) {
      setFormError("Ingresa el costo final antes de marcar como reparado.");
      return;
    }
    save("repaired");
  }

  function cancelOrder() {
    if (!window.confirm("¿Cancelar esta orden de servicio? Esta acción no se puede deshacer.")) return;
    save("cancelled");
  }

  function goToCharge() {
    navigate("/pos", { state: { serviceChargeId: current.id } });
    onClose();
  }

  return (
    <Modal title={`Orden ${current.code}`} onClose={onClose} maxWidth="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            current.status === "delivered"
              ? "bg-emerald-100 text-emerald-700"
              : current.status === "cancelled"
                ? "bg-red-100 text-red-700"
                : current.status === "repaired"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-amber-100 text-amber-700"
          }`}
        >
          {current.status_label}
        </span>
        <button
          type="button"
          onClick={() => setShowReceipt(true)}
          className="text-xs font-medium text-indigo-600 hover:underline"
        >
          Ver comprobante
        </button>
      </div>

      {formError && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3 text-sm">
        <div>
          <p className="text-slate-400">Cliente</p>
          <p className="font-medium text-slate-900">{current.customer?.name_or_business_name}</p>
        </div>
        <div>
          <p className="text-slate-400">Equipo</p>
          <p className="font-medium text-slate-900">
            {current.device_type_label} {current.brand} {current.model}
          </p>
        </div>
        <div>
          <p className="text-slate-400">N° de serie</p>
          <p className="font-medium text-slate-900">{current.serial_number || "-"}</p>
        </div>
        <div>
          <p className="text-slate-400">Accesorios</p>
          <p className="font-medium text-slate-900">{current.accessories || "-"}</p>
        </div>
        <div>
          <p className="text-slate-400">Clave</p>
          <p className="font-medium text-slate-900">{current.device_password || "-"}</p>
        </div>
        <div className="col-span-2">
          <p className="text-slate-400">Falla reportada</p>
          <p className="font-medium text-slate-900">{current.reported_issue}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Técnico asignado</label>
          <select
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            disabled={!canManage || isLocked}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          >
            <option value="">Sin asignar</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Diagnóstico / informe técnico</label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            disabled={!canManage || isLocked}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Costo estimado</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              disabled={!canManage || isLocked}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Costo final (mano de obra + repuestos)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={finalCost}
              onChange={(e) => setFinalCost(e.target.value)}
              disabled={!canManage || isLocked}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </div>
        </div>

        {canManage && !isLocked && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Guardar cambios
            </button>
          </div>
        )}
      </form>

      <div className="mt-4 border-t border-slate-200 pt-4">
        <ServicePartsSection service={current} canManage={canManage && !isLocked} onChanged={applyUpdate} />
      </div>

      {canManage && !isLocked && (
        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={cancelOrder}
            disabled={isSaving}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Cancelar orden
          </button>
          {current.status === "received" && (
            <button
              type="button"
              onClick={() => save("diagnosing")}
              disabled={isSaving}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Iniciar diagnóstico
            </button>
          )}
          {current.status === "diagnosing" && (
            <button
              type="button"
              onClick={markRepaired}
              disabled={isSaving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Marcar como reparado
            </button>
          )}
          {current.status === "repaired" && canDeliver && (
            <button
              type="button"
              onClick={goToCharge}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Enviar a cobro (POS)
            </button>
          )}
        </div>
      )}

      {showReceipt && (
        <ServiceReceiptModal serviceId={current.id} onClose={() => setShowReceipt(false)} />
      )}
    </Modal>
  );
}
