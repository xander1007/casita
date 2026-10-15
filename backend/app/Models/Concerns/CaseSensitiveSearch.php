<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Substring search that matches the exact upper/lower case the value was
 * stored with, regardless of the database driver or its default collation.
 * Wildcard characters typed by the user (% and _) are matched literally.
 */
trait CaseSensitiveSearch
{
    public function scopeWhereContainsExact(Builder $query, string $column, string $term, string $boolean = 'and'): Builder
    {
        $wrapped = $query->getQuery()->getGrammar()->wrap($query->qualifyColumn($column));

        return match ($query->getConnection()->getDriverName()) {
            // "C" is a deterministic, byte-wise collation: LIKE never folds case under it.
            'pgsql' => $query->whereRaw("{$wrapped} COLLATE \"C\" LIKE ?", [$this->likePattern($term)], $boolean),
            'mysql', 'mariadb' => $query->whereRaw("{$wrapped} LIKE BINARY ?", [$this->likePattern($term)], $boolean),
            // SQLite's LIKE is case-insensitive for ASCII; instr() is not.
            default => $query->whereRaw("instr({$wrapped}, ?) > 0", [$term], $boolean),
        };
    }

    public function scopeOrWhereContainsExact(Builder $query, string $column, string $term): Builder
    {
        return $this->scopeWhereContainsExact($query, $column, $term, 'or');
    }

    private function likePattern(string $term): string
    {
        return '%'.addcslashes($term, '\\%_').'%';
    }
}
