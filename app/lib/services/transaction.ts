import { API_URL, authFetchJson } from "@/lib/api";
import { Transaction } from "../types";

export async function getTransactions(
  id: string,
  _token?: string,
  fromDate?: string,
  toDate?: string,
  query?: string
): Promise<{ ok: boolean; transactions?: Transaction[]; message?: string }> {
  const queryParts: string[] = [];
  if (fromDate) queryParts.push(`fromDate=${encodeURIComponent(fromDate)}`);
  if (toDate) queryParts.push(`toDate=${encodeURIComponent(toDate)}`);
  if (query) queryParts.push(`query=${encodeURIComponent(query)}`);

  const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  return authFetchJson(`${API_URL}/transaction/user/${id}${qs}`);
}

export async function getTransaction(
  id: string,
  _token?: string
): Promise<{ ok: boolean; transaction?: Transaction; message?: string }> {
  return authFetchJson(`${API_URL}/transaction/${id}`);
}
