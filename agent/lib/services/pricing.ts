import { API_URL, authFetchJson } from "../api";
import { Pricing } from "../types";

export async function getPricing(
  id: string,
  _token?: string
): Promise<{ ok: boolean; data: Pricing[]; message?: string }> {
  return authFetchJson(`${API_URL}/pricing/${id}/all`);
}