<?php

namespace App\Support;

/**
 * Converts a monetary amount into its Spanish letters representation, as
 * required on Peruvian sales receipts, e.g.:
 *
 *   170.00 => "SON: CIENTO SETENTA CON 00/100 SOLES"
 */
class NumberToLetters
{
    /**
     * @var array<int, string>
     */
    private const UNITS = [
        '', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
        'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
        'VEINTE',
    ];

    /**
     * @var array<int, string>
     */
    private const TENS = [
        0 => '', 2 => 'VEINTI', 3 => 'TREINTA', 4 => 'CUARENTA', 5 => 'CINCUENTA',
        6 => 'SESENTA', 7 => 'SETENTA', 8 => 'OCHENTA', 9 => 'NOVENTA',
    ];

    /**
     * @var array<int, string>
     */
    private const HUNDREDS = [
        1 => 'CIENTO', 2 => 'DOSCIENTOS', 3 => 'TRESCIENTOS', 4 => 'CUATROCIENTOS', 5 => 'QUINIENTOS',
        6 => 'SEISCIENTOS', 7 => 'SETECIENTOS', 8 => 'OCHOCIENTOS', 9 => 'NOVECIENTOS',
    ];

    /**
     * Render "SON: ... CON XX/100 {currency}".
     */
    public static function toInvoiceWords(float $amount, string $currency = 'SOLES'): string
    {
        $amount = round($amount, 2);
        $integerPart = (int) floor($amount);
        $cents = (int) round(($amount - $integerPart) * 100);

        $words = $integerPart === 0 ? 'CERO' : trim(self::convertInteger($integerPart));

        return sprintf('SON: %s CON %02d/100 %s', $words, $cents, $currency);
    }

    /**
     * Recursively spell out an integer using the Spanish short scale.
     */
    private static function convertInteger(int $number): string
    {
        if ($number === 0) {
            return '';
        }

        if ($number === 100) {
            return 'CIEN';
        }

        if ($number < 21) {
            return self::UNITS[$number];
        }

        if ($number < 100) {
            $ten = intdiv($number, 10);
            $unit = $number % 10;

            if ($unit === 0) {
                return self::TENS[$ten];
            }

            if ($ten === 2) {
                return self::TENS[2].self::UNITS[$unit];
            }

            return self::TENS[$ten].' Y '.self::UNITS[$unit];
        }

        if ($number < 1000) {
            $hundred = intdiv($number, 100);
            $rest = $number % 100;

            return trim(self::HUNDREDS[$hundred].($rest > 0 ? ' '.self::convertInteger($rest) : ''));
        }

        if ($number < 1_000_000) {
            $thousands = intdiv($number, 1000);
            $rest = $number % 1000;
            $thousandsWords = $thousands === 1 ? 'MIL' : trim(self::convertInteger($thousands)).' MIL';

            return trim($thousandsWords.($rest > 0 ? ' '.self::convertInteger($rest) : ''));
        }

        $millions = intdiv($number, 1_000_000);
        $rest = $number % 1_000_000;
        $millionsWords = $millions === 1 ? 'UN MILLÓN' : trim(self::convertInteger($millions)).' MILLONES';

        return trim($millionsWords.($rest > 0 ? ' '.self::convertInteger($rest) : ''));
    }
}
