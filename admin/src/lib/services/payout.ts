import { API_URL, buildHeaders } from "../api";

export type Payout = {
  id?: string;
  userId?: string;
  bankName?: string;
  accountNumber?: string;
  bankCode?: string;
  accountName?: string;
  status?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export const createPayout = async (
  userId: string,
  accountNumber: string,
  accountName: string,
  bankCode: string,
  bankName: string,
  role: "MEMBER" | "ADMIN" | "AGENT" | "COMPANY" | "STAFF",
): Promise<{data?: any, message?: string, ok: boolean}> => {
  const response = await fetch(`${API_URL}/payout`, {
    headers: { ...buildHeaders() },
    method: "POST",
    body: JSON.stringify({
      userId,
      accountNumber,
      accountName,
      bankCode,
      bankName,
      role,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create payout");
  }
  return data;
};

export const getPayout = async (id: string): Promise<Payout> => {
  const response = await fetch(`${API_URL}/payout/user/${id}`, {
    headers: { ...buildHeaders() },
    method: "GET",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payout");
  }
  return data.payout;
};

export const updatePayout = async (
  id: string,
  payout: Payout,
): Promise<Payout> => {
  const response = await fetch(`${API_URL}/payout/${id}`, {
    headers: { ...buildHeaders() },
    method: "PUT",
    body: JSON.stringify(payout),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update payout");
  }
  return data;
};
