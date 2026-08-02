import { API_URL, buildHeaders } from "../api";

export async function getPayment(id: string) {
  const response = await fetch(`${API_URL}/payment/reference/${id}`, {
    headers: buildHeaders(false),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function getPayments(userId: string) {
  const response = await fetch(`${API_URL}/payment/user/${userId}`, {
    headers: buildHeaders(false),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function payNow(id: string) {
  const response = await fetch(`${API_URL}/payment/pay-now/${id}`, {
    method: "GET",
    headers: buildHeaders(false),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to initiate payment");
  }
  return data;
}

export async function confirmPayment(
  userId?: string,
  paymentId?: string,
  amount?: number,
  center?: string,
  company?: string,
  token?: string,
) {
  if (!userId || !paymentId || !amount || !center || !company) {
    throw new Error("Missing required parameters for confirming payment");
  }
  const response = await fetch(`${API_URL}/payment/confirm/${userId}/${paymentId}`, {
    method: "POST",
    headers: buildHeaders(true, token),
    body: JSON.stringify({ amount, center, company }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to confirm payment");
  }
  return data;
}

export async function getRecord(id: string) {
  if (!id) {
    throw new Error("No record ID found");
  }
  const response = await fetch(`${API_URL}/payment-transaction/reference/${id}`, {
    headers: buildHeaders(false),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payment transaction");
  }
  return data;
}

export async function getRecords(
  id: string,
  fromDate?: string,
  toDate?: string,
  query?: string,
) {
  if (!id) {
    throw new Error("No user ID found");
  }
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (query) params.set("query", query);

  const queryString = params.toString();
  const response = await fetch(
    `${API_URL}/payment-transaction/user/company/${id}${queryString ? `?${queryString}` : ""}`,
    {
      headers: buildHeaders(false),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}
