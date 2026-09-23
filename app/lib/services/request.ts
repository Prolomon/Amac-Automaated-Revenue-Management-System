import { API_URL, authFetchJson } from "../api";
import { Request } from "../types";

export type CreateRequestPayload = {
  memberId: string;
  paymentId: string;
  reason: string;
};

export async function createRequest(
  payload: CreateRequestPayload,
  _token?: string
): Promise<{ ok: boolean; data?: Request; message?: string }> {
  if (!payload.memberId || !payload.paymentId || !payload.reason) {
    throw new Error("Member ID, Payment ID, and Reason are required");
  }

  return authFetchJson(`${API_URL}/request`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRequestsByPayment(
  paymentId: string,
  _token?: string
): Promise<{ ok: boolean; data?: Request[]; requests?: Request[]; message?: string }> {
  if (!paymentId) {
    throw new Error("Payment ID is required");
  }

  return authFetchJson(`${API_URL}/request/payment/${paymentId}`);
}
