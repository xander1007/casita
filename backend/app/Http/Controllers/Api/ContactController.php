<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactRequest;
use App\Http\Resources\ContactResource;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ContactController extends Controller
{
    /**
     * List contacts with pagination, search and type filter.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Contact::query()->orderBy('name_or_business_name');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name_or_business_name', 'like', "%{$search}%")
                    ->orWhere('document_number', 'like', "%{$search}%");
            });
        }

        if ($type = $request->string('type')->trim()->toString()) {
            $query->where(function ($q) use ($type) {
                $q->where('type', $type)->orWhere('type', 'both');
            });
        }

        if ($request->has('status')) {
            $query->where('is_active', $request->boolean('status'));
        }

        $perPage = (int) $request->integer('per_page', 15);

        return ContactResource::collection($query->paginate($perPage));
    }

    /**
     * Create a new contact.
     */
    public function store(ContactRequest $request): JsonResponse
    {
        $contact = Contact::create($request->validated() + ['is_active' => $request->boolean('is_active', true)]);

        return response()->json(['contact' => new ContactResource($contact)], 201);
    }

    /**
     * Show a single contact.
     */
    public function show(Contact $contact): JsonResponse
    {
        return response()->json(['contact' => new ContactResource($contact)]);
    }

    /**
     * Update a contact's data.
     */
    public function update(ContactRequest $request, Contact $contact): JsonResponse
    {
        $contact->update($request->validated());

        return response()->json(['contact' => new ContactResource($contact)]);
    }

    /**
     * Enable or disable a contact.
     */
    public function updateStatus(Request $request, Contact $contact): JsonResponse
    {
        $request->validate(['is_active' => ['required', 'boolean']]);

        $contact->update(['is_active' => $request->boolean('is_active')]);

        return response()->json(['contact' => new ContactResource($contact)]);
    }

    /**
     * Delete a contact.
     */
    public function destroy(Contact $contact): JsonResponse
    {
        $contact->delete();

        return response()->json(['message' => 'Contacto eliminado correctamente.']);
    }
}
