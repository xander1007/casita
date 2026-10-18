import { useEffect, useState } from "react";
import { deleteContact, fetchContacts, updateContactStatus } from "../../api/contacts";
import { useAuth } from "../../context/useAuth";
import { ContactFormModal } from "./ContactFormModal";
import { CONTACT_TYPE_LABELS, DOCUMENT_TYPES } from "../../types/contacts";
import type { Contact } from "../../types/contacts";
import type { PaginationMeta } from "../../types/common";
import { EmptyTableRow } from "../../components/ui/EmptyState";
import { Users } from "lucide-react";

const TABS = [
  { value: "", label: "Todos" },
  { value: "client", label: "Clientes" },
  { value: "supplier", label: "Proveedores" },
] as const;

function documentLabel(code: string): string {
  return DOCUMENT_TYPES.find((d) => d.value === code)?.label ?? code;
}

export default function CustomersPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("customers.manage");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"" | "client" | "supplier">("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [modalContact, setModalContact] = useState<Contact | null | "new">(null);

  useEffect(() => {
    let cancelled = false;

    fetchContacts({ search: search || undefined, type: tab || undefined, page })
      .then((response) => {
        if (cancelled) return;
        setContacts(response.data);
        setMeta(response.meta);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, tab, page, refreshIndex]);

  function refresh() {
    setIsLoading(true);
    setRefreshIndex((i) => i + 1);
  }

  function goToPage(nextPage: number) {
    setIsLoading(true);
    setPage(nextPage);
  }

  function applyFilters(next: { search?: string; tab?: "" | "client" | "supplier" }) {
    setIsLoading(true);
    setPage(1);
    if (next.search !== undefined) setSearch(next.search);
    if (next.tab !== undefined) setTab(next.tab);
  }

  async function handleToggleStatus(contact: Contact) {
    await updateContactStatus(contact.id, !contact.is_active);
    refresh();
  }

  async function handleDelete(contact: Contact) {
    if (!window.confirm(`¿Eliminar el contacto "${contact.name_or_business_name}"?`)) return;
    await deleteContact(contact.id);
    refresh();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Clientes y Proveedores</h1>
      <p className="mt-1 text-sm text-slate-500">
        Contactos utilizados en el punto de venta y las compras.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-md bg-slate-200 p-1">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => applyFilters({ tab: t.value })}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  tab === t.value ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => applyFilters({ search: e.target.value })}
            placeholder="Buscar por DNI, RUC o nombre..."
            className="field w-64"
          />
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setModalContact("new")}
            className="btn btn-primary"
          >
            + Nuevo contacto
          </button>
        )}
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre / Razón social</th>
              <th className="px-4 py-3 font-medium">Documento</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Contacto</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            )}
            {!isLoading && contacts.length === 0 && (
              <EmptyTableRow colSpan={6} icon={Users} title="No hay contactos" description="Registra clientes y proveedores para usarlos en ventas y compras." filtered={Boolean(search)} />
            )}
            {!isLoading &&
              contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="px-4 py-3 text-slate-900">{contact.name_or_business_name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="pill bg-slate-100 text-slate-600">
                      {documentLabel(contact.identity_document_type)}
                    </span>{" "}
                    {contact.document_number}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{CONTACT_TYPE_LABELS[contact.type]}</td>
                  <td className="px-4 py-3 text-slate-500">
                    <div>{contact.email ?? "—"}</div>
                    <div className="text-xs text-slate-400">{contact.phone ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`pill ${
                        contact.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {contact.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && (
                      <div className="flex gap-3 text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => setModalContact(contact)}
                          className="text-indigo-600 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(contact)}
                          className="text-slate-600 hover:underline"
                        >
                          {contact.is_active ? "Deshabilitar" : "Habilitar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(contact)}
                          className="text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Página {meta.current_page} de {meta.last_page} ({meta.total} contactos)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1}
              onClick={() => goToPage(meta.current_page - 1)}
              className="btn-sm btn-secondary"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.last_page}
              onClick={() => goToPage(meta.current_page + 1)}
              className="btn-sm btn-secondary"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {modalContact !== null && (
        <ContactFormModal
          contact={modalContact === "new" ? null : modalContact}
          onClose={() => setModalContact(null)}
          onSaved={() => {
            setModalContact(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
