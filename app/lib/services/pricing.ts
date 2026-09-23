import { API_URL, authFetchJson } from "../api";
import { Pricing } from "../types";

export async function getPricing(
  page: number,
  limit: number,
  center: string,
  selectedType?: string,
  selectedCategory?: string,
  _token?: string
): Promise<{ data: Pricing[]; meta: { total: number; page: number; limit: number }; ok: boolean; message?: string }> {
  const queryParams =
    (selectedType ? `&type=${selectedType}` : "") +
    (selectedCategory ? `&category=${selectedCategory}` : "");

  return authFetchJson(
    `${API_URL}/pricing/${center}/all?page=${page}&limit=${limit}${queryParams}`
  );
}

export async function getPricingByCenter(
  id: string,
  _token?: string
): Promise<{ ok: boolean; data?: Pricing[]; message?: string }> {
  return authFetchJson(`${API_URL}/pricing/${id}/all`);
}