<?php

namespace App\Support;

/**
 * Neutralizes CSV/formula injection ("CSV injection"): user-controlled text
 * (contact names, product names, stock movement reasons, etc.) is exported
 * verbatim into SUNAT/accounting CSV and pipe-delimited TXT reports, which
 * are routinely opened in Excel/Sheets. A value starting with =, +, -, @,
 * or a tab/CR is interpreted there as a formula and can execute arbitrary
 * commands or leak data when the file is opened, so any such value is
 * prefixed with a leading apostrophe to force it to be read as plain text.
 */
class CsvSanitizer
{
    private const DANGEROUS_PREFIXES = ['=', '+', '-', '@', "\t", "\r"];

    public static function field(mixed $value): mixed
    {
        if (! is_string($value) || $value === '') {
            return $value;
        }

        foreach (self::DANGEROUS_PREFIXES as $prefix) {
            if (str_starts_with($value, $prefix)) {
                return "'".$value;
            }
        }

        return $value;
    }

    /**
     * Sanitize every value in a flat row array (used for fputcsv rows).
     *
     * @param  array<int|string, mixed>  $row
     * @return array<int|string, mixed>
     */
    public static function row(array $row): array
    {
        return array_map(self::field(...), $row);
    }
}
