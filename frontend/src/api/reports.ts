import api from "./axios";
import type { PaginatedResponse } from "../types/common";
import type {
  CriticalInventoryProduct,
  DailySalesPoint,
  Inventory12Row,
  Kardex13Row,
  KardexRow,
  PosMetrics,
  ReportRangeFilters,
  ReportSummary,
  RiceRow,
  RvieRow,
  SalesRegistryRow,
  SunatPeriodFilters,
} from "../types/reports";

function rangeParams(filters: ReportRangeFilters): Record<string, string> {
  const params: Record<string, string> = { period: filters.period };
  if (filters.period === "custom") {
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
  }
  return params;
}

export async function fetchSummary(filters: ReportRangeFilters): Promise<ReportSummary> {
  const { data } = await api.get<ReportSummary>("/reports/summary", { params: rangeParams(filters) });
  return data;
}

export async function fetchPosMetrics(filters: ReportRangeFilters): Promise<PosMetrics> {
  const { data } = await api.get<PosMetrics>("/reports/pos-metrics", { params: rangeParams(filters) });
  return data;
}

export async function fetchDailySales(filters: ReportRangeFilters): Promise<DailySalesPoint[]> {
  const { data } = await api.get<{ data: DailySalesPoint[] }>("/reports/daily-sales", { params: rangeParams(filters) });
  return data.data;
}

export async function fetchCriticalInventory(): Promise<CriticalInventoryProduct[]> {
  const { data } = await api.get<{ data: CriticalInventoryProduct[] }>("/reports/critical-inventory");
  return data.data;
}

export async function fetchSalesRegistry(
  filters: ReportRangeFilters & { page?: number },
): Promise<PaginatedResponse<SalesRegistryRow>> {
  const { data } = await api.get<PaginatedResponse<SalesRegistryRow>>("/reports/sales-registry", {
    params: { ...rangeParams(filters), page: filters.page },
  });
  return data;
}

export async function fetchKardex(
  filters: ReportRangeFilters & { page?: number },
): Promise<PaginatedResponse<KardexRow>> {
  const { data } = await api.get<PaginatedResponse<KardexRow>>("/reports/kardex", {
    params: { ...rangeParams(filters), page: filters.page },
  });
  return data;
}

async function downloadFile(url: string, params: Record<string, string>, fallbackName: string): Promise<void> {
  const response = await api.get<Blob>(url, { params, responseType: "blob" });
  const disposition = response.headers["content-disposition"] as string | undefined;
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? fallbackName;

  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function exportSalesRegistry(filters: ReportRangeFilters): Promise<void> {
  await downloadFile("/reports/sales-registry/export", rangeParams(filters), "registro-ventas.csv");
}

export async function exportKardex(filters: ReportRangeFilters): Promise<void> {
  await downloadFile("/reports/kardex/export", rangeParams(filters), "kardex.csv");
}

function sunatParams(filters: SunatPeriodFilters): Record<string, string> {
  if (filters.date_from && filters.date_to) {
    return { date_from: filters.date_from, date_to: filters.date_to };
  }
  return { year: String(filters.year), month: String(filters.month) };
}

export async function fetchRvie(
  filters: SunatPeriodFilters & { page?: number },
): Promise<PaginatedResponse<RvieRow>> {
  const { data } = await api.get<PaginatedResponse<RvieRow>>("/reports/sunat/ventas", {
    params: { ...sunatParams(filters), page: filters.page },
  });
  return data;
}

export async function fetchRice(
  filters: SunatPeriodFilters & { page?: number },
): Promise<PaginatedResponse<RiceRow>> {
  const { data } = await api.get<PaginatedResponse<RiceRow>>("/reports/sunat/compras", {
    params: { ...sunatParams(filters), page: filters.page },
  });
  return data;
}

export async function fetchKardex13(
  filters: SunatPeriodFilters & { page?: number },
): Promise<PaginatedResponse<Kardex13Row>> {
  const { data } = await api.get<PaginatedResponse<Kardex13Row>>("/reports/sunat/kardex13", {
    params: { ...sunatParams(filters), page: filters.page },
  });
  return data;
}

export async function fetchInventory12(
  filters: SunatPeriodFilters & { page?: number },
): Promise<PaginatedResponse<Inventory12Row>> {
  const { data } = await api.get<PaginatedResponse<Inventory12Row>>("/reports/sunat/inventario12", {
    params: { ...sunatParams(filters), page: filters.page },
  });
  return data;
}

export async function exportRvieTxt(filters: SunatPeriodFilters): Promise<void> {
  await downloadFile("/reports/sunat/ventas/export-txt", sunatParams(filters), "RVIE.txt");
}

export async function exportRvieCsv(filters: SunatPeriodFilters): Promise<void> {
  await downloadFile("/reports/sunat/ventas/export-csv", sunatParams(filters), "RVIE.csv");
}

export async function exportRiceTxt(filters: SunatPeriodFilters): Promise<void> {
  await downloadFile("/reports/sunat/compras/export-txt", sunatParams(filters), "RICE.txt");
}

export async function exportRiceCsv(filters: SunatPeriodFilters): Promise<void> {
  await downloadFile("/reports/sunat/compras/export-csv", sunatParams(filters), "RICE.csv");
}

export async function exportKardex13Txt(filters: SunatPeriodFilters): Promise<void> {
  await downloadFile("/reports/sunat/kardex13/export-txt", sunatParams(filters), "KARDEX13.txt");
}

export async function exportKardex13Csv(filters: SunatPeriodFilters): Promise<void> {
  await downloadFile("/reports/sunat/kardex13/export-csv", sunatParams(filters), "KARDEX13.csv");
}

export async function exportInventory12Txt(filters: SunatPeriodFilters): Promise<void> {
  await downloadFile("/reports/sunat/inventario12/export-txt", sunatParams(filters), "INVENTARIO12.txt");
}

export async function exportInventory12Csv(filters: SunatPeriodFilters): Promise<void> {
  await downloadFile("/reports/sunat/inventario12/export-csv", sunatParams(filters), "INVENTARIO12.csv");
}
