import { API_URL, authFetch, authFetchJson, refreshAccessToken } from "../api";
import { User } from "../types";

export async function login(email: string, password: string): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  member?: User;
  uid?: string;
}> {
  return authFetchJson(`${API_URL}/member/login`, {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshAuthToken(refreshToken: string): Promise<{
  ok: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
}> {
  const newAccessToken = await refreshAccessToken();
  if (newAccessToken) {
    return {
      ok: true,
      accessToken: newAccessToken,
      token: newAccessToken,
    };
  }

  // Fallback direct call if refreshAccessToken returned null
  const response = await fetch(`${API_URL}/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to refresh token");
  }
  return data;
}

export async function forgetPassword(
  oldPassword: string,
  newPassword: string,
  confirmPassword: string,
  id: string,
  _token?: string
): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  token?: string;
  member?: User;
}> {
  return authFetchJson(`${API_URL}/member/${id}/forgot-password`, {
    method: "PUT",
    body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
  });
}

export async function resetPassword(
  id: string,
  _token?: string
): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  token?: string;
  member?: User;
}> {
  return authFetchJson(`${API_URL}/member/${id}/reset-password`, {
    method: "PUT",
  });
}

export async function getMembers(page: number, limit: number) {
  return authFetchJson(`${API_URL}/member?page=${page}&limit=${limit}`);
}

export async function getMember(id: string, _token?: string) {
  return authFetchJson(`${API_URL}/member/${id}`);
}

export async function getPayment(id: string) {
  return authFetchJson(`${API_URL}/payment/reference/${id}`);
}

export async function getPayments(userId: string) {
  return authFetchJson(`${API_URL}/payment/user/${userId}`);
}

export async function updateMember(id: string, payload: any) {
  return authFetchJson(`${API_URL}/member/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getPricing(id: string, _token?: string) {
  return authFetchJson(`${API_URL}/pricing/${id}/all`);
}
