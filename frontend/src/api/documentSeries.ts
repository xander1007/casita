import api from "./axios";
import type { DocumentSeries } from "../types/cash";

export async function fetchDocumentSeries(): Promise<DocumentSeries[]> {
  const { data } = await api.get<{ data: DocumentSeries[] }>("/document-series");
  return data.data;
}

export interface DocumentSeriesPayload {
  document_type: string;
  series: string;
  cash_register_id?: number | null;
  current_correlative?: number;
  is_active?: boolean;
}

export async function createDocumentSeries(payload: DocumentSeriesPayload): Promise<DocumentSeries> {
  const { data } = await api.post<{ series: DocumentSeries }>("/document-series", payload);
  return data.series;
}

export async function updateDocumentSeries(
  id: number,
  payload: DocumentSeriesPayload,
): Promise<DocumentSeries> {
  const { data } = await api.put<{ series: DocumentSeries }>(`/document-series/${id}`, payload);
  return data.series;
}

export async function deleteDocumentSeries(id: number): Promise<void> {
  await api.delete(`/document-series/${id}`);
}
