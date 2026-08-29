import { API_URL, buildHeaders } from "../api";

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return {
    message: text || `HTTP ${response.status}: ${response.statusText}`,
  };
}

export type Department = {
  id?: string;
  uid?: string;
  name: string;
  center: string;
  role?: string;
  status?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type GetDepartmentsQuery = {
  page?: number;
  limit?: number;
};

export async function getDepartments(query: GetDepartmentsQuery = {}): Promise<{
  ok: boolean;
  data?: Department[];
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const params = new URLSearchParams();
  if (query.page) params.append("page", String(query.page));
  if (query.limit) params.append("limit", String(query.limit));

  const queryString = params.toString();
  const url = `${API_URL}/department${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    headers: { ...buildHeaders(false) },
  });
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch departments");
  }
  return data;
}

export async function getDepartmentsByCenter(
  center: string,
  query: GetDepartmentsQuery = {}
): Promise<{
  ok: boolean;
  data?: Department[];
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  if (!center) {
    throw new Error("No center provided");
  }

  const params = new URLSearchParams();
  if (query.page) params.append("page", String(query.page));
  if (query.limit) params.append("limit", String(query.limit));

  const queryString = params.toString();
  const url = `${API_URL}/department/center/${encodeURIComponent(
    center
  )}${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    headers: { ...buildHeaders(false) },
  });
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch departments");
  }
  return data;
}

export async function getDepartment(
  uid: string
): Promise<{ ok: boolean; department?: Department; message?: string }> {
  if (!uid) {
    throw new Error("No department UID provided");
  }
  const response = await fetch(`${API_URL}/department/${uid}`, {
    headers: { ...buildHeaders(false) },
  });
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch department");
  }
  return data;
}

export type CreateDepartmentPayload = {
  name: string;
  center: string;
  role: string;
  status?: boolean;
};

export async function createDepartment(
  payload: CreateDepartmentPayload
): Promise<{
  ok: boolean;
  department?: Department;
  message?: string;
}> {
  const response = await fetch(`${API_URL}/department`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || "Failed to create department");
  }
  return data;
}

export async function updateDepartment(
  uid: string,
  payload: Partial<CreateDepartmentPayload>
): Promise<{
  ok: boolean;
  department?: Department;
  message?: string;
}> {
  if (!uid) {
    throw new Error("No department UID provided");
  }
  const response = await fetch(`${API_URL}/department/${uid}`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || "Failed to update department");
  }
  return data;
}

export async function deleteDepartment(uid: string): Promise<{
  ok: boolean;
  message?: string;
}> {
  if (!uid) {
    throw new Error("No department UID provided");
  }
  const response = await fetch(`${API_URL}/department/${uid}`, {
    method: "DELETE",
    headers: { ...buildHeaders(true) },
  });
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete department");
  }
  return data;
}
