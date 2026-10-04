import { API_URL, buildHeaders } from "../api";
import { PermissionsGroup } from "../permissions";

export type ITStaff = {
  id?: string;
  uid?: string;
  fullname: string;
  email: string;
  phone: string;
  gender: string;
  status?: boolean;
  password?: string;
  location?: any;
  avatar?: string;
  center?: string;
  role?: string;
  permissions?: PermissionsGroup | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function getITStaffs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
}): Promise<{
  ok: boolean;
  data?: ITStaff[];
  message?: string;
  meta: { total: number; limit: number; page: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status !== undefined) query.set("status", String(params.status));

  const qs = query.toString();
  const response = await fetch(`${API_URL}/it-staff${qs ? `?${qs}` : ""}`, {
    headers: { ...buildHeaders(false) },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch IT staffs");
  }
  return data;
}

export async function getITStaff(
  uid: string
): Promise<{ ok: boolean; itStaff?: ITStaff; message?: string }> {
  if (!uid) {
    throw new Error("No IT staff ID found");
  }
  const response = await fetch(`${API_URL}/it-staff/${uid}`, {
    headers: { ...buildHeaders(false) },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch IT staff");
  }
  return data;
}

export async function createITStaff(
  payload: Partial<ITStaff>
): Promise<{ ok: boolean; itStaff?: ITStaff; message?: string; temporaryPassword?: string }> {
  const response = await fetch(`${API_URL}/it-staff`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create IT staff");
  }
  return data;
}

export async function updateITStaff(
  uid: string,
  payload: Partial<ITStaff>
): Promise<{ ok: boolean; itStaff?: ITStaff; message?: string }> {
  const response = await fetch(`${API_URL}/it-staff/${uid}`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update IT staff");
  }
  return data;
}

export async function deleteITStaff(
  uid: string
): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch(`${API_URL}/it-staff/${uid}`, {
    method: "DELETE",
    headers: { ...buildHeaders(true) },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete IT staff");
  }
  return data;
}
