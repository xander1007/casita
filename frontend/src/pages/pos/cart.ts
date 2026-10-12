import type { Product, ProductSerial } from "../../types/inventory";

export interface CartItem {
  key: string;
  product: Product;
  serial: ProductSerial | null;
  quantity: number;
  unitPrice: number;
  /** Fixed-quantity line (e.g. a technical service charge) that can't be edited in the cart. */
  locked?: boolean;
}

export interface CartLineTotals {
  subtotal: number;
  igv: number;
  total: number;
}

export function calcLineTotals(item: CartItem): CartLineTotals {
  const total = Math.round(item.quantity * item.unitPrice * 100) / 100;

  if (item.product.igv_affectation === "10") {
    const subtotal = Math.round((total / 1.18) * 100) / 100;
    return { subtotal, igv: Math.round((total - subtotal) * 100) / 100, total };
  }

  return { subtotal: total, igv: 0, total };
}

export function calcCartTotals(items: CartItem[]): CartLineTotals {
  return items.reduce(
    (acc, item) => {
      const line = calcLineTotals(item);
      return {
        subtotal: Math.round((acc.subtotal + line.subtotal) * 100) / 100,
        igv: Math.round((acc.igv + line.igv) * 100) / 100,
        total: Math.round((acc.total + line.total) * 100) / 100,
      };
    },
    { subtotal: 0, igv: 0, total: 0 },
  );
}
