import { useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../../components/Modal";

interface SerialCaptureModalProps {
  productName: string;
  quantity: number;
  initialSerials: string[];
  onClose: () => void;
  onSave: (serials: string[]) => void;
}

export function SerialCaptureModal({
  productName,
  quantity,
  initialSerials,
  onClose,
  onSave,
}: SerialCaptureModalProps) {
  const [text, setText] = useState(initialSerials.join("\n"));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numbers = text
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (numbers.length !== quantity) {
      setError(`Debes ingresar exactamente ${quantity} número(s) de serie (ingresaste ${numbers.length}).`);
      return;
    }

    const unique = new Set(numbers);
    if (unique.size !== numbers.length) {
      setError("Hay números de serie duplicados en la lista.");
      return;
    }

    onSave(numbers);
  }

  return (
    <Modal title={`Series — ${productName}`} onClose={onClose}>
      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <p className="mb-2 text-sm text-slate-500">
        Ingresa {quantity} número(s) de serie, uno por línea o separados por coma.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={Math.max(4, quantity)}
          placeholder={"SN-0001\nSN-0002"}
          className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Guardar series
          </button>
        </div>
      </form>
    </Modal>
  );
}
