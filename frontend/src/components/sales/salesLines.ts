import type { Product } from "../../types/inventory";

export interface SalesLine {
  product: Product;
  quantity: number;
  /** IGV included, as in the POS. */
  unitPrice: number;
}

export interface SalesTotals {
  opTaxed: number;
  opExonerated: number;
  igv: number;
  total: number;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Mirrors the backend SaleLineCalculator: IGV is split out only for affectation "10". */
export function calcSalesTotals(lines: SalesLine[]): SalesTotals {
  return lines.reduce(
    (acc, line) => {
      const total = round2(line.quantity * line.unitPrice);
      if (line.product.igv_affectation === "10") {
        const base = round2(total / 1.18);
        return {
          ...acc,
          opTaxed: round2(acc.opTaxed + base),
          igv: round2(acc.igv + total - base),
          total: round2(acc.total + total),
        };
      }
      return { ...acc, opExonerated: round2(acc.opExonerated + total), total: round2(acc.total + total) };
    },
    { opTaxed: 0, opExonerated: 0, igv: 0, total: 0 },
  );
}
