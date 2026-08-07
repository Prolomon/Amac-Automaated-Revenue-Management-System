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

export type Terminal = {
  id?: string;
  uid?: string;
  name: string;
  center: string;
  companyId?: string | null;
  agentId?: string | null;
  status?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  agent?: {
    id?: string;
    uid?: string;
    name?: string;
    fullname?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    gender?: string;
    center?: string;
    company?: string;
    batchNo?: string;
    [key: string]: any;
  } | null;
  company?: {
    id?: string;
    uid?: string;
    name?: string;
    email?: string;
    phone?: string;
    center?: string;
    category?: string[];
    location?: string;
    zone?: string;
    [key: string]: any;
  } | null;
};

export type GetTerminalsQuery = {
  page?: number;
  limit?: number;
  center?: string;
  agentId?: string;
  companyId?: string;
  status?: boolean;
  search?: string;
};

export async function getTerminals(query: GetTerminalsQuery = {}): Promise<{
  ok: boolean;
  data?: Terminal[];
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
  if (query.center) params.append("center", query.center);
  if (query.agentId) params.append("agentId", query.agentId);
  if (query.companyId) params.append("companyId", query.companyId);
  if (query.status !== undefined) params.append("status", String(query.status));
  if (query.search) params.append("search", query.search);

  const queryString = params.toString();
  const url = `${API_URL}/terminal${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    headers: { ...buildHeaders(false) },
  });
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch terminals");
  }
  return data;
}

export async function getTerminal(id: string): Promise<{
  ok: boolean;
  terminal?: Terminal;
  message?: string;
}> {
  if (!id) {
    throw new Error("No terminal ID provided");
  }
  const response = await fetch(`${API_URL}/terminal/${id}`, {
    headers: { ...buildHeaders(false) },
  });
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch terminal");
  }
  return data;
}

export type CreateTerminalPayload = {
  name?: string;
  center: string;
  companyId?: string | null;
  agentId?: string | null;
  status?: boolean;
  uid?: string;
};

export async function createTerminal(payload: CreateTerminalPayload): Promise<{
  ok: boolean;
  terminal?: Terminal;
  message?: string;
}> {
  const response = await fetch(`${API_URL}/terminal`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create terminal");
  }
  return data;
}

export async function updateTerminal(
  id: string,
  payload: Partial<CreateTerminalPayload>
): Promise<{
  ok: boolean;
  terminal?: Terminal;
  message?: string;
}> {
  if (!id) {
    throw new Error("No terminal ID provided");
  }
  const response = await fetch(`${API_URL}/terminal/${id}`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update terminal");
  }
  return data;
}

export async function deleteTerminal(id: string): Promise<{
  ok: boolean;
  message?: string;
}> {
  if (!id) {
    throw new Error("No terminal ID provided");
  }
  const response = await fetch(`${API_URL}/terminal/${id}`, {
    method: "DELETE",
    headers: { ...buildHeaders(true) },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete terminal");
  }
  return data;
}

export async function assignTerminal(payload: {
  name?: string;
  uid?: string;
  center?: string;
  companyId?: string | null;
  agentId?: string | null;
}): Promise<{
  ok: boolean;
  message?: string;
  data?: any;
}> {
  const response = await fetch(`${API_URL}/terminal/assign`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to assign terminal");
  }
  return data;
}

export async function unassignTerminal(payload: {
  name?: string;
  uid?: string;
}): Promise<{
  ok: boolean;
  message?: string;
  data?: any;
}> {
  const response = await fetch(`${API_URL}/terminal/unassign`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to unassign terminal");
  }
  return data;
}
