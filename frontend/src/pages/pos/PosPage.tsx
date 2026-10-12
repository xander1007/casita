import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchCurrentShift } from "../../api/cash";
import { deliverService, fetchServiceChargePayload } from "../../api/services";
import { CatalogPanel } from "./CatalogPanel";
import { CartPanel } from "./CartPanel";
import { SerialPickerModal } from "./SerialPickerModal";
import { CheckoutModal } from "./CheckoutModal";
import { SaleSuccessModal } from "./SaleSuccessModal";
import type { CartItem } from "./cart";
import type { CashShift } from "../../types/cash";
import type { Product, ProductSerial } from "../../types/inventory";
import type { Contact } from "../../types/contacts";
import type { Sale } from "../../types/sales";

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

  useEffect(() => {
    fetchCurrentShift().then(setShift);
  }, []);

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
        const maxQty = product.total_stock || existing.quantity + 1;
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
    setCart((items) => [
      ...items,
      {
        key: `serial-${serial.id}`,
        product,
        serial,
        quantity: 1,
        unitPrice: product.sale_price,
      },
    ]);
    setSerialPickerProduct(null);
  }

  function updateQuantity(key: string, quantity: number) {
    if (quantity < 1 || Number.isNaN(quantity)) return;
    setCart((items) =>
      items.map((item) => {
        if (item.key !== key || item.locked) return item;
        const maxQty = item.product.is_service ? quantity : item.product.total_stock;
        return { ...item, quantity: Math.min(quantity, maxQty || quantity) };
      }),
    );
  }

  function removeItem(key: string) {
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
      <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">No tienes una caja abierta</h2>
        <p className="mt-2 text-sm text-slate-500">
          Debes abrir un turno de caja antes de poder realizar ventas en el punto de venta.
        </p>
        <Link
          to="/cash/actual"
          className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Ir a apertura de caja
        </Link>
      </div>
    );
  }

  const warehouseId = shift.cash_register?.warehouse_id;

  if (!warehouseId) {
    return (
      <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Caja sin almacén asignado</h2>
        <p className="mt-2 text-sm text-slate-500">
          La caja "{shift.cash_register?.name}" no tiene un almacén configurado. Contacta a un
          administrador para asignarle uno antes de vender.
        </p>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-11rem)] grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      {chargingServiceCode && (
        <div className="lg:col-span-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Cobrando la orden de servicio técnico <strong>{chargingServiceCode}</strong>. Al confirmar la venta,
          la orden se marcará como entregada.
        </div>
      )}

      <div className="min-h-0 rounded-xl bg-white p-4 shadow-sm">
        <CatalogPanel
          warehouseId={warehouseId}
          onSelectProduct={addProduct}
          refreshIndex={catalogRefreshIndex}
        />
      </div>

      <div className="min-h-0 rounded-xl bg-white p-4 shadow-sm">
        <CartPanel
          items={cart}
          onUpdateQuantity={updateQuantity}
          onRemove={removeItem}
          onCheckout={() => setShowCheckout(true)}
        />
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
