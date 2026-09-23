import { API_URL, authFetchJson } from "../api";
import { Payment } from "../types";

export async function getPayment(id: string) {
  return authFetchJson(`${API_URL}/payment/reference/${id}`);
}

export async function getPayments(userId: string, _token?: string): Promise<{ ok: boolean; payments: Payment[] }> {
  return authFetchJson(`${API_URL}/payment/user/${userId}`);
}

export async function verifyPayment(reference: string, _token?: string) {
  return authFetchJson(`${API_URL}/payment/verify/${encodeURIComponent(reference)}`);
}

export async function payNow(id: string) {
  return authFetchJson(`${API_URL}/payment/pay-now/${id}`);
}

export async function confirmPayment(
  userId?: string,
  paymentId?: string,
  amount?: number,
  center?: string,
  company?: string,
  _token?: string
) {
  if (!userId || !paymentId || !amount || !center || !company) {
    throw new Error("Missing required parameters for confirming payment");
  }
  return authFetchJson(`${API_URL}/payment/confirm/${userId}/${paymentId}`, {
    method: "POST",
    body: JSON.stringify({ amount, center, company }),
  });
}

export async function getRecord(id: string, _token?: string) {
  if (!id) {
    throw new Error("No record ID found");
  }
  return authFetchJson(`${API_URL}/payment-transaction/reference/${id}`);
}

export async function getRecords(
  id: string,
  _token?: string,
  fromDate?: string,
  toDate?: string,
  query?: string
) {
  if (!id) {
    throw new Error("No user ID found");
  }
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (query) params.set("query", query);

  const queryString = params.toString();
  return authFetchJson(
    `${API_URL}/payment-transaction/user/company/${id}${queryString ? `?${queryString}` : ""}`
  );
}

export async function getTransaction(id: string, _token?: string) {
  return authFetchJson(`${API_URL}/transaction/${id}`);
}

export async function getTransactions(
  id: string,
  _token?: string,
  fromDate?: string,
  toDate?: string,
  query?: string
) {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (query) params.set("query", query);

  const queryString = params.toString();
  return authFetchJson(
    `${API_URL}/transaction/user/${id}${queryString ? `?${queryString}` : ""}`
  );
}