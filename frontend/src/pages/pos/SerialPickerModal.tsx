import { useEffect, useState } from "react";
import { Modal } from "../../components/Modal";
import { fetchPosProductSerials } from "../../api/pos";
import type { Product, ProductSerial } from "../../types/inventory";

interface SerialPickerModalProps {
  product: Product;
  warehouseId: number;
  excludeSerialIds: number[];
  onClose: () => void;
  onSelect: (serial: ProductSerial) => void;
}

export function SerialPickerModal({
  product,
  warehouseId,
  excludeSerialIds,
  onClose,
  onSelect,
}: SerialPickerModalProps) {
  const [serials, setSerials] = useState<ProductSerial[] | null>(null);

  useEffect(() => {
    fetchPosProductSerials(product.id, warehouseId).then(setSerials);
  }, [product.id, warehouseId]);

  const available = (serials ?? []).filter((s) => !excludeSerialIds.includes(s.id));

  return (
    <Modal title={`Seleccionar serie — ${product.name}`} onClose={onClose}>
      {serials === null && <p className="text-sm text-slate-400">Cargando series disponibles...</p>}

      {serials !== null && available.length === 0 && (
        <p className="text-sm text-slate-400">No hay series disponibles en esta caja.</p>
      )}

      <div className="max-h-72 space-y-2 overflow-y-auto">
        {available.map((serial) => (
          <button
            key={serial.id}
            type="button"
            onClick={() => onSelect(serial)}
            className="flex w-full items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-left text-sm hover:border-indigo-400 hover:bg-indigo-50"
          >
            <span className="font-mono text-slate-800">{serial.serial_number}</span>
            {serial.notes && <span className="text-xs text-slate-400">{serial.notes}</span>}
          </button>
        ))}
      </div>
    </Modal>
  );
}
