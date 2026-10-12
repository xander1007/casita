<?php

namespace App\Http\Controllers\Api\Cash;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cash\DocumentSeriesRequest;
use App\Http\Resources\DocumentSeriesResource;
use App\Models\DocumentSeries;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DocumentSeriesController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return DocumentSeriesResource::collection(
            DocumentSeries::query()->with('cashRegister')->orderBy('document_type')->orderBy('series')->get(),
        );
    }

    public function store(DocumentSeriesRequest $request): JsonResponse
    {
        $series = DocumentSeries::create(
            $request->validated() + ['current_correlative' => 0, 'is_active' => true],
        )->load('cashRegister');

        return response()->json(['series' => new DocumentSeriesResource($series)], 201);
    }

    public function update(DocumentSeriesRequest $request, DocumentSeries $series): JsonResponse
    {
        $series->update($request->validated());

        return response()->json(['series' => new DocumentSeriesResource($series->load('cashRegister'))]);
    }

    public function destroy(DocumentSeries $series): JsonResponse
    {
        $series->delete();

        return response()->json(['message' => 'Serie eliminada correctamente.']);
    }
}
