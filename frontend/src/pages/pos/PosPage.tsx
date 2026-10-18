import { useEffect, useEffectEvent, useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Keyboard, Store, TriangleAlert, Wallet } from "lucide-react";
import { fetchCurrentShift } from "../../api/cash";
import { fetchPosQuotation, fetchPosSalesOrder } from "../../api/pos";
import { deliverService, fetchServiceChargePayload } from "../../api/services";
import { CatalogPanel } from "./CatalogPanel";
import type { CatalogHandle } from "./CatalogPanel";
import { CartPanel } from "./CartPanel";
import { SerialPickerModal } from "./SerialPickerModal";
import { CheckoutModal } from "./CheckoutModal";
import { SaleSuccessModal } from "./SaleSuccessModal";
import type { CartItem } from "./cart";
import type { CashShift } from "../../types/cash";
import type { Product, ProductSerial } from "../../types/inventory";
import type { Contact } from "../../types/contacts";
import type { Sale } from "../../types/sales";

interface SaleSource {
  type: "quotation" | "order";
  id: number;
  code: string;
}

/** Serialized products of the source document still waiting for the cashier to pick their serials. */
interface PendingSerial {
  product: Product;
  unitPrice: number;
  remaining: number;
  locked: boolean;
}

export default function PosPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [shift, setShift] = useState<CashShift | null | "loading">("loading");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [serialPickerProduct, setSerialPickerProduct] = useState<Product | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [completedSale, setCompletedSale] = useState<{ sale: Sale; change: number } | null>(null);
  const [catalogRefreshIndex, setCatalogRefreshIndex] = useState(0);
  const [chargingServiceId, setChargingServiceId] = useState<number | null>(null);
  const [chargingServiceCode, setChargingServiceCode] = useState<string | null>(null);
  const [initialContact, setInitialContact] = useState<Contact | null>(null);

  // Quotation / sales order being invoiced, requested through navigation state.
  const [sourceRequest] = useState<{ type: SaleSource["type"]; id: number } | null>(() => {
    const state = location.state as { quotationId?: number; salesOrderId?: number } | null;
    if (state?.quotationId) return { type: "quotation", id: state.quotationId };
    if (state?.salesOrderId) return { type: "order", id: state.salesOrderId };
    return null;
  });
  const sourceLoaded = useRef(false);
  const [saleSource, setSaleSource] = useState<SaleSource | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [pendingSerials, setPendingSerials] = useState<PendingSerial[]>([]);
  const pendingSerialUnits = pendingSerials.reduce((sum, p) => sum + p.remaining, 0);
  const catalogRef = useRef<CatalogHandle>(null);
  const hasOpenModal = Boolean(serialPickerProduct || showCheckout || completedSale);

  useEffect(() => {
    fetchCurrentShift().then(setShift);
  }, []);

  function startCheckout() {
    if (saleSource?.type === "order" && pendingSerialUnits > 0) {
      setSourceError("Elige los números de serie pendientes del pedido antes de cobrar.");
      return;
    }
    setSourceError(null);
    setShowCheckout(true);
  }

  // Cashier shortcuts: F2 charge, F3 focus search, Esc clear search. Ignored while a modal is open.
  const handleShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (hasOpenModal) return;
    if (event.key === "F2") {
      event.preventDefault();
      if (cart.length > 0) startCheckout();
    } else if (event.key === "F3") {
      event.preventDefault();
      catalogRef.current?.focusSearch();
    } else if (event.key === "Escape") {
      catalogRef.current?.clearSearch();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    const warehouseId = shift !== "loading" ? shift?.cash_register?.warehouse_id : undefined;
    if (!sourceRequest || sourceLoaded.current || !warehouseId) return;
    sourceLoaded.current = true;
    navigate(location.pathname, { replace: true, state: null });

    const { type, id } = sourceRequest;
    const request =
      type === "quotation"
        ? fetchPosQuotation(id, warehouseId).then((payload) => ({ ...payload, code: payload.quotation.code }))
        : fetchPosSalesOrder(id).then((payload) => ({ ...payload, code: payload.sales_order.code }));

    request
      .then((payload) => {
        // Ordered units are reserved: their lines are fixed. Quotation lines stay editable.
        const locked = type === "order";
        const merged = new Map<number, { product: Product; quantity: number; unitPrice: number }>();
        for (const item of payload.items) {
          const current = merged.get(item.product.id);
          merged.set(item.product.id, {
            product: item.product,
            quantity: (current?.quantity ?? 0) + item.quantity,
            unitPrice: item.unit_price,
          });
        }
        const lines = [...merged.values()];

        setSaleSource({ type, id, code: payload.code });
        setInitialContact(payload.contact);
        setCart(
          lines
            .filter((line) => !line.product.requires_serial)
            .map((line) => ({
              key: `product-${line.product.id}`,
              product: line.product,
              serial: null,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              locked,
            })),
        );
        setPendingSerials(
          lines
            .filter((line) => line.product.requires_serial)
            .map((line) => ({ product: line.product, unitPrice: line.unitPrice, remaining: line.quantity, locked })),
        );
      })
      .catch((error) => {
        setSourceError(
          (axios.isAxiosError(error) &&
            (Object.values(error.response?.data?.errors ?? {}).flat()[0] as string | undefined)) ||
            "No se pudo cargar el documento a facturar.",
        );
      });
  }, [shift, sourceRequest, navigate, location.pathname]);

  function discardSource() {
    setSaleSource(null);
    setPendingSerials([]);
    setInitialContact(null);
    setCart([]);
  }

  useEffect(() => {
    const state = location.state as { serviceChargeId?: number } | null;
    if (!state?.serviceChargeId) return;

    const serviceId = state.serviceChargeId;
    navigate(location.pathname, { replace: true, state: null });

    fetchServiceChargePayload(serviceId).then(({ service, product, contact, amount }) => {
      setChargingServiceId(serviceId);
      setChargingServiceCode(service.code);
      setInitialContact(contact);
      setCart((items) => [
        ...items,
        {
          key: `service-${serviceId}`,
          product,
          serial: null,
          quantity: 1,
          unitPrice: amount,
          locked: true,
        },
      ]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addProduct(product: Product) {
    if (product.requires_serial) {
      setSerialPickerProduct(product);
      return;
    }

    setCart((items) => {
      const existing = items.find((item) => item.key === `product-${product.id}`);
      if (existing) {
        const maxQty = product.available_stock || existing.quantity + 1;
        return items.map((item) =>
          item.key === existing.key
            ? { ...item, quantity: Math.min(item.quantity + 1, maxQty) }
            : item,
        );
      }
      return [
        ...items,
        {
          key: `product-${product.id}`,
          product,
          serial: null,
          quantity: 1,
          unitPrice: product.sale_price,
        },
      ];
    });
  }

  function addSerialItem(product: Product, serial: ProductSerial) {
    // A serial chosen for a quotation/order line keeps that line's price.
    const pending = pendingSerials.find((p) => p.product.id === product.id && p.remaining > 0);

    setCart((items) => [
      ...items,
      {
        key: `serial-${serial.id}`,
        product,
        serial,
        quantity: 1,
        unitPrice: pending?.unitPrice ?? product.sale_price,
        locked: pending?.locked,
      },
    ]);
    if (pending) {
      setPendingSerials((list) =>
        list.map((p) => (p.product.id === product.id ? { ...p, remaining: p.remaining - 1 } : p)),
      );
    }
    setSerialPickerProduct(null);
  }

  function updateQuantity(key: string, quantity: number) {
    if (quantity < 1 || Number.isNaN(quantity)) return;
    setCart((items) =>
      items.map((item) => {
        if (item.key !== key || item.locked) return item;
        const maxQty = item.product.is_service ? quantity : item.product.available_stock;
        return { ...item, quantity: Math.min(quantity, maxQty || quantity) };
      }),
    );
  }

  function removeItem(key: string) {
    const removed = cart.find((item) => item.key === key);
    if (removed?.serial && pendingSerials.some((p) => p.product.id === removed.product.id)) {
      setPendingSerials((list) =>
        list.map((p) => (p.product.id === removed.product.id ? { ...p, remaining: p.remaining + 1 } : p)),
      );
    }
    setCart((items) => items.filter((item) => item.key !== key));
    if (chargingServiceId && key === `service-${chargingServiceId}`) {
      setChargingServiceId(null);
      setChargingServiceCode(null);
    }
  }

  async function handleSaleSuccess(sale: Sale, change: number) {
    if (chargingServiceId) {
      await deliverService(chargingServiceId, sale.id);
      setChargingServiceId(null);
      setChargingServiceCode(null);
      setInitialContact(null);
    }
    if (saleSource) {
      setSaleSource(null);
      setPendingSerials([]);
      setInitialContact(null);
    }
    setShowCheckout(false);
    setCompletedSale({ sale, change });
    setCart([]);
    setCatalogRefreshIndex((i) => i + 1);
    fetchCurrentShift().then(setShift);
  }

  if (shift === "loading") {
    return <p className="text-sm text-slate-400">Cargando...</p>;
  }

  if (shift === null) {
    return (
      <div className="card mx-auto mt-8 max-w-md p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Wallet className="h-7 w-7" strokeWidth={1.7} />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">No tienes una caja abierta</h2>
        <p className="mt-2 text-sm text-slate-500">
          Debes abrir un turno de caja antes de poder realizar ventas en el punto de venta.
        </p>
        <Link to="/cash/actual" className="btn btn-primary mt-5">
          Ir a apertura de caja
        </Link>
      </div>
    );
  }

  const warehouseId = shift.cash_register?.warehouse_id;

  if (!warehouseId) {
    return (
      <div className="card mx-auto mt-8 max-w-md p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <TriangleAlert className="h-7 w-7" strokeWidth={1.7} />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">Caja sin almacén asignado</h2>
        <p className="mt-2 text-sm text-slate-500">
          La caja "{shift.cash_register?.name}" no tiene un almacén configurado. Contacta a un
          administrador para asignarle uno antes de vender.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-7rem)]">
      {chargingServiceCode && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          Cobrando la orden de servicio técnico <strong>{chargingServiceCode}</strong>. Al confirmar la venta,
          la orden se marcará como entregada.
        </div>
      )}

      {sourceError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{sourceError}</div>
      )}

      {saleSource && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Facturando {saleSource.type === "order" ? "el pedido" : "la cotización"} <strong>{saleSource.code}</strong>.
              {saleSource.type === "order"
                ? " Los productos y cantidades están reservados y no se pueden modificar."
                : " Al confirmar la venta, la cotización quedará como convertida."}
            </span>
            <button type="button" onClick={discardSource} className="text-xs font-medium text-indigo-700 hover:underline">
              Descartar
            </button>
          </div>
          {pendingSerials
            .filter((p) => p.remaining > 0)
            .map((p) => (
              <div key={p.product.id} className="mt-1 flex items-center gap-2 text-amber-800">
                <span>
                  "{p.product.name}" requiere elegir {p.remaining} número(s) de serie.
                </span>
                <button
                  type="button"
                  onClick={() => setSerialPickerProduct(p.product)}
                  className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-indigo-700 shadow-sm hover:bg-indigo-100"
                >
                  Elegir serie
                </button>
              </div>
            ))}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="card flex min-h-[28rem] flex-col p-4 lg:min-h-0">
          <div className="min-h-0 flex-1">
            <CatalogPanel
              ref={catalogRef}
              warehouseId={warehouseId}
              onSelectProduct={addProduct}
              refreshIndex={catalogRefreshIndex}
            />
          </div>
          <div className="mt-3 hidden flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-400 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <Keyboard className="h-3.5 w-3.5" />
              Atajos:
            </span>
            {[
              ["F3", "Buscar"],
              ["Enter", "Agregar (1 resultado)"],
              ["Esc", "Limpiar búsqueda"],
              ["F2", "Cobrar"],
            ].map(([key, label]) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-500">
                  {key}
                </kbd>
                {label}
              </span>
            ))}
            {shift.cash_register?.name && (
              <span className="ml-auto inline-flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" />
                {shift.cash_register.name}
              </span>
            )}
          </div>
        </div>

        <div className="card flex min-h-[24rem] flex-col overflow-hidden lg:min-h-0">
          <CartPanel items={cart} onUpdateQuantity={updateQuantity} onRemove={removeItem} onCheckout={startCheckout} />
        </div>
      </div>

      {serialPickerProduct && (
        <SerialPickerModal
          product={serialPickerProduct}
          warehouseId={warehouseId}
          excludeSerialIds={cart.filter((i) => i.serial).map((i) => i.serial!.id)}
          onClose={() => setSerialPickerProduct(null)}
          onSelect={(serial) => addSerialItem(serialPickerProduct, serial)}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          items={cart}
          initialContact={initialContact}
          quotationId={saleSource?.type === "quotation" ? saleSource.id : null}
          salesOrderId={saleSource?.type === "order" ? saleSource.id : null}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleSaleSuccess}
        />
      )}

      {completedSale && (
        <SaleSuccessModal
          sale={completedSale.sale}
          change={completedSale.change}
          onNewSale={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
}
