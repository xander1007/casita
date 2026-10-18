import { useEffect, useState } from "react";
import { searchSalesCustomers } from "../../api/salesOrders";
import type { Contact } from "../../types/contacts";

interface CustomerPickerProps {
  value: Contact | null;
  onChange: (contact: Contact | null) => void;
  error?: string;
}

export function CustomerPicker({ value, onChange, error }: CustomerPickerProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Contact[]>([]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      searchSalesCustomers(search.trim()).then((found) => {
        if (!cancelled) setResults(found);
      });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search]);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
      {value ? (
        <div className="field flex items-center justify-between">
          <span>
            {value.name_or_business_name} <span className="text-xs text-slate-400">({value.document_number})</span>
          </span>
          <button type="button" onClick={() => onChange(null)} className="text-xs text-indigo-600 hover:underline">
            Cambiar
          </button>
        </div>
      ) : (
        <div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por RUC/DNI o razón social..."
            className="field w-full"
          />
          {results.length > 0 && (
            <div className="mt-1 max-h-32 overflow-y-auto rounded-md border border-slate-200">
              {results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c);
                    setSearch("");
                    setResults([]);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-indigo-50"
                >
                  {c.name_or_business_name} <span className="text-xs text-slate-400">({c.document_number})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
