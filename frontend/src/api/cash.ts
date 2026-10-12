import api from "./axios";
import type { PaginatedResponse } from "../types/common";
import type { CashRegister, CashShift } from "../types/cash";

export async function fetchCashRegisters(): Promise<CashRegister[]> {
  const { data } = await api.get<{ data: CashRegister[] }>("/cash-registers");
  return data.data;
}

export async function fetchCurrentShift(): Promise<CashShift | null> {
  const { data } = await api.get<{ shift: CashShift | null }>("/shifts/current");
  return data.shift;
}

export async function openShift(payload: {
  cash_register_id: number;
  opening_balance: number;
}): Promise<CashShift> {
  const { data } = await api.post<{ shift: CashShift }>("/shifts/open", payload);
  return data.shift;
}

export async function closeShift(
  shiftId: number,
  payload: { closing_balance: number; notes?: string },
): Promise<CashShift> {
  const { data } = await api.post<{ shift: CashShift }>(`/shifts/${shiftId}/close`, payload);
  return data.shift;
}

export async function fetchShiftHistory(page = 1): Promise<PaginatedResponse<CashShift>> {
  const { data } = await api.get<PaginatedResponse<CashShift>>("/shifts", { params: { page } });
  return data;
}
