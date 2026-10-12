<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $fillable = [
        'ruc',
        'legal_name',
        'address',
        'phones',
        'emails',
        'slogan',
    ];

    protected function casts(): array
    {
        return [
            'phones' => 'array',
            'emails' => 'array',
        ];
    }
}
