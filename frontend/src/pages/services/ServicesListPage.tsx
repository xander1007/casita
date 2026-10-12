import { useEffect, useState } from "react";
import { fetchService, fetchServices } from "../../api/services";
import { SERVICE_STATUSES } from "../../types/services";
import type { ServiceStatus, TechnicalService } from "../../types/services";
import type { PaginationMeta } from "../../types/common";
import { useAuth } from "../../context/useAuth";
import { ServiceReceptionModal } from "./ServiceReceptionModal";
import { ServiceDetailModal } from "./ServiceDetailModal";

const KANBAN_STATUSES: { value: ServiceStatus; label: string }[] = [
  { value: "received", label: "Recibido" },
  { value: "diagnosing", label: "En Diagnóstico" },
  { value: "repaired", label: "Reparado" },
  { value: "delivered", label: "Entregado" },
];

const STATUS_BADGE_CLASSES: Record<ServiceStatus, string> = {
  received: "bg-amber-100 text-amber-700",
  diagnosing: "bg-amber-100 text-amber-700",
  repaired: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function ServicesListPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("services.create");

  const [view, setView] = useState<"table" | "kanban">("kanban");
  const [services, setServices] = useState<TechnicalService[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ServiceStatus | "">("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [showReception, setShowReception] = useState(false);
  const [selectedService, setSelectedService] = useState<TechnicalService | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetchServices({
      search: search || undefined,
      status: view === "table" ? status || undefined : undefined,
      page: view === "table" ? page : 1,
      per_page: view === "kanban" ? 100 : undefined,
    })
      .then((response) => {
        if (cancelled) return;
        setServices(response.data);
        setMeta(response.meta);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, status, page, view, refreshIndex]);

  async function openDetail(service: TechnicalService) {
    const fresh = await fetchService(service.id);
    setSelectedService(fresh);
  }

  function handleCreated(service: TechnicalService) {
    setShowReception(false);
    setRefreshIndex((i) => i + 1);
    openDetail(service);
  }

  function handleChanged() {
    setRefreshIndex((i) => i + 1);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Servicio Técnico</h1>
          <p className="mt-1 text-sm text-slate-500">
            Recepción, diagnóstico y entrega de equipos de cómputo.
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowReception(true)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Nueva recepción
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, cliente o serie..."
          className="w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {view === "table" && (
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as ServiceStatus | "");
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Todos los estados</option>
            {SERVICE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        )}
        <div className="ml-auto flex gap-1 rounded-md bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={`rounded px-3 py-1 text-xs font-medium ${
              view === "kanban" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
            }`}
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setView("table")}
            className={`rounded px-3 py-1 text-xs font-medium ${
              view === "table" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
            }`}
          >
            Tabla
          </button>
        </div>
      </div>

      {isLoading && <p className="mt-6 text-center text-sm text-slate-400">Cargando...</p>}

      {!isLoading && view === "kanban" && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KANBAN_STATUSES.map((column) => (
            <div key={column.value} className="rounded-xl bg-slate-50 p-3">
              <h2 className="mb-2 text-sm font-semibold text-slate-600">
                {column.label}{" "}
                <span className="text-xs font-normal text-slate-400">
                  ({services.filter((s) => s.status === column.value).length})
                </span>
              </h2>
              <div className="space-y-2">
                {services
                  .filter((s) => s.status === column.value)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => openDetail(s)}
                      className="block w-full rounded-lg bg-white p-3 text-left shadow-sm hover:shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{s.code}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{s.customer?.name_or_business_name}</p>
                      <p className="text-xs text-slate-400">
                        {s.device_type_label} {s.brand}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && view === "table" && (
        <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Equipo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Recepción</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No se encontraron órdenes de servicio.
                  </td>
                </tr>
              )}
              {services.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{s.code}</td>
                  <td className="px-4 py-3 text-slate-600">{s.customer?.name_or_business_name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.device_type_label} {s.brand} {s.model}
                    {s.serial_number && <div className="text-xs text-slate-400">S/N: {s.serial_number}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[s.status]}`}>
                      {s.status_label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(s.received_at).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openDetail(s)}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "table" && meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Página {meta.current_page} de {meta.last_page} ({meta.total} órdenes)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => setPage(meta.current_page - 1)}
              className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setPage(meta.current_page + 1)}
              className="rounded-md border border-slate-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {showReception && (
        <ServiceReceptionModal onClose={() => setShowReception(false)} onCreated={handleCreated} />
      )}

      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onChanged={handleChanged}
        />
      )}
    </div>
  );
}
