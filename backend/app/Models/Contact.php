<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    use HasFactory;

    /**
     * A short subset of SUNAT Catalog No. 06 (tipo de documento de identidad).
     */
    public const DOCUMENT_TYPES = ['0', '1', '4', '6', '7'];

    public const TYPES = ['client', 'supplier', 'both'];

    protected $fillable = [
        'type',
        'identity_document_type',
        'document_number',
        'name_or_business_name',
        'address',
        'email',
        'phone',
        'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
