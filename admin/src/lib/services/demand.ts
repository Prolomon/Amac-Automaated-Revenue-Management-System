import { API_URL, buildHeaders } from "../api";
import { Member } from "./member";
import { Payment } from "./payments";
import { Wallet } from "./wallet";

export type Demand = {
  id?: string;
  userId: string;
  paymentId: string;
  amount: number;
  reference: string;
  status: "PENDING" | "SENT" | "REJECTED";
  createdAt?: Date;
  updatedAt?: Date;
  member: Member;
  walletId: string;
  wallet: Wallet;
  payment: Payment;
  isSent: Boolean;
  dates: Date[];
};

export async function sendDemand(
  userId: string,
): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch(`${API_URL}/demand/send`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ userId }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to send demand");
  }
  return data;
}

export async function sendDemandByPayment(
  paymentId: string,
): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch(`${API_URL}/demand/send-by-payment`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ paymentId }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to send demand");
  }
  return data;
}

export async function sendMultipleDemand(
  userId: string[],
): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch(`${API_URL}/demand/send-multiple`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ userId }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to send multiple demands");
  }
  return data;
}

export async function getDemandsByUser(
  userId: string,
  status?: string,
  startDate?: string,
  endDate?: string,
  page?: string,
  limit?: string,
): Promise<{
  ok: boolean;
  data?: Demand[];
  message?: string;
  meta?: { total: string; page: string; limit: string; totalPages: number };
}> {
  const params = new URLSearchParams();

  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (status) params.set("status", status);
  if (page) params.set("page", page);
  if (limit) params.set("limit", limit);

  const queryString = params.toString();

  const response = await fetch(
    `${API_URL}/demand/${userId}/user${queryString ? `?${queryString}` : ""}`,
    {
      headers: { ...buildHeaders() },
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch demands");
  }
  return data;
}

export async function getDemand(
  demandId: string,
  status?: string,
  startDate?: string,
  endDate?: string,
  page?: string,
  limit?: string,
): Promise<{ ok: boolean; data?: Demand; message?: string }> {
  const params = new URLSearchParams();

  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (status) params.set("status", status);
  if (page) params.set("page", page);
  if (limit) params.set("limit", limit);

  const queryString = params.toString();

  const response = await fetch(
    `${API_URL}/demand/${demandId}${queryString ? `?${queryString}` : ""}`,
    {
      headers: { ...buildHeaders() },
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch demand");
  }
  return data;
}

export async function getDemandByPayment(
  paymentId: string,
): Promise<{
  ok: boolean;
  data?: Demand[];
  message?: string;
}> {

  const response = await fetch(
    `${API_URL}/demand/${paymentId}/payment`,
    {
      headers: { ...buildHeaders() },
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch demands");
  }
  return data;
}

export async function getDemandsByCenter(
  centerId: string,
  status?: string,
  startDate?: string,
  endDate?: string,
  page?: string,
  limit?: string,
): Promise<{
  ok: boolean;
  data?: Demand[];
  message?: string;
  meta?: { total: string; page: string; limit: string; totalPages: number };
}> {
  const params = new URLSearchParams();

  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (status) params.set("status", status);
  if (page) params.set("page", page);
  if (limit) params.set("limit", limit);

  const queryString = params.toString();

  const response = await fetch(
    `${API_URL}/demand/${centerId}/center${queryString ? `?${queryString}` : ""}`,
    {
      headers: { ...buildHeaders() },
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch demands");
  }

  return data;
}

export async function getAllDemands(
  status?: string,
  startDate?: string,
  endDate?: string,
  page?: string,
  limit?: string,
): Promise<{
  ok: boolean;
  data?: Demand[];
  message?: string;
  meta?: { total: string; page: string; limit: string; totalPages: number };
}> {
  const params = new URLSearchParams();

  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (status) params.set("status", status);
  if (page) params.set("page", page);
  if (limit) params.set("limit", limit);

  const queryString = params.toString();

  const response = await fetch(
    `${API_URL}/demand${queryString ? `?${queryString}` : ""}`,
    {
      headers: { ...buildHeaders() },
    },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch demands");
  }

  return data;
}

export async function resendDemand(
  demandId: string,
): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch(`${API_URL}/demand/${demandId}/resend`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to resend demand");
  }
  return data;
}

export async function downloadDemandPdf(demandId: string, filename?: string): Promise<void> {
  const response = await fetch(`${API_URL}/demand/${demandId}/download`, {
    headers: { ...buildHeaders() },
  });

  if (!response.ok) {
    let errorMsg = "Failed to download demand notice";
    try {
      const errJson = await response.json();
      if (errJson.message) errorMsg = errJson.message;
    } catch {}
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `Demand_Notice_${demandId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadMultipleDemandsPdf(ids: string[], filename?: string): Promise<void> {
  const response = await fetch(`${API_URL}/demand/download-many`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    let errorMsg = "Failed to download demand notices batch";
    try {
      const errJson = await response.json();
      if (errJson.message) errorMsg = errJson.message;
    } catch {}
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `Demand_Notices_Batch_${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
