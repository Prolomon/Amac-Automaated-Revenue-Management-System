import { API_URL, authFetchJson, refreshAccessToken } from "../api";
import { User } from "../types";

export async function login(email: string, password: string): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  agent?: User;
}> {
  return authFetchJson(`${API_URL}/agent/login`, {
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
  agent?: User;
}> {
  return authFetchJson(`${API_URL}/agent/${id}/forgot-password`, {
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
  agent?: User;
}> {
  return authFetchJson(`${API_URL}/agent/${id}/reset-password`, {
    method: "PUT",
  });
}

export async function getAgent(uid: string) {
  if (!uid) {
    throw new Error("No user ID found");
  }
  return authFetchJson(`${API_URL}/agent/one/${uid}`);
}

export async function updateAgent(id: string, payload: any) {
  return authFetchJson(`${API_URL}/agent/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getPricing(id: string, _token?: string) {
  return authFetchJson(`${API_URL}/pricing/${id}/all`);
}
