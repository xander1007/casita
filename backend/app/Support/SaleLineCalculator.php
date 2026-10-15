<?php

namespace App\Support;

use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Builds priced sale lines the same way the POS does: unit prices include
 * IGV, which is split out only for products with affectation "10" (gravado).
 */
class SaleLineCalculator
{
    /**
     * @param  array<int, array{product_id: int, quantity: int, unit_price: float|int|string}>  $items
     * @return array{lines: list<array<string, mixed>>, totals: array{op_taxed: float, op_exonerated: float, igv: float, total: float}}
     */
    public static function build(array $items): array
    {
        /** @var Collection<int, Product> $products */
        $products = Product::query()->whereIn('id', collect($items)->pluck('product_id'))->get()->keyBy('id');

        $lines = [];
        $opTaxed = 0.0;
        $opExonerated = 0.0;
        $igvTotal = 0.0;

        foreach ($items as $item) {
            $product = $products->get($item['product_id']);

            if (! $product) {
                throw ValidationException::withMessages(['items' => 'Uno de los productos ya no existe.']);
            }

            $lineTotal = round($item['quantity'] * $item['unit_price'], 2);

            if ($product->igv_affectation === '10') {
                $lineBase = round($lineTotal / 1.18, 2);
                $lineIgv = round($lineTotal - $lineBase, 2);
                $opTaxed += $lineBase;
            } else {
                $lineBase = $lineTotal;
                $lineIgv = 0.0;
                $opExonerated += $lineBase;
            }

            $igvTotal += $lineIgv;

            $lines[] = [
                'product' => $product,
                'product_id' => $product->id,
                'quantity' => (int) $item['quantity'],
                'unit_price' => $item['unit_price'],
                'subtotal' => $lineBase,
                'igv' => $lineIgv,
                'total' => $lineTotal,
            ];
        }

        return [
            'lines' => $lines,
            'totals' => [
                'op_taxed' => round($opTaxed, 2),
                'op_exonerated' => round($opExonerated, 2),
                'igv' => round($igvTotal, 2),
                'total' => round($opTaxed + $opExonerated + $igvTotal, 2),
            ],
        ];
    }
}
