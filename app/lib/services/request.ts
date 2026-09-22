import { API_URL, buildHeaders } from "../api";
import { Request } from "../types";

export type CreateRequestPayload = {
  memberId: string;
  paymentId: string;
  reason: string;
};

export async function createRequest(
  payload: CreateRequestPayload,
  token?: string
): Promise<{ ok: boolean; data?: Request; message?: string }> {
  if (!payload.memberId || !payload.paymentId || !payload.reason) {
    throw new Error("Member ID, Payment ID, and Reason are required");
  }

  const response = await fetch(`${API_URL}/request`, {
    method: "POST",
    headers: buildHeaders(true, token),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create discount request");
  }
  return data;
}

export async function getRequestsByPayment(
  paymentId: string,
  token?: string
): Promise<{ ok: boolean; data?: Request[]; requests?: Request[]; message?: string }> {
  if (!paymentId) {
    throw new Error("Payment ID is required");
  }

  const response = await fetch(`${API_URL}/request/payment/${paymentId}`, {
    headers: buildHeaders(true, token),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch requests for payment");
  }
  return data;
}
