import { API_URL, buildHeaders } from "../api";
import { Member } from "./member";
import { Payment } from "./payments";
import { Admin } from "./admin";

export type Request = {
  id: string;
  memberId: string;
  paymentId: string;
  adminId?: string | null;
  adminComment?: string | null;
  approverId?: string | null;
  approverComment?: string | null;
  reason: string;
  status: RequestStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  member?: Member;
  payment?: Payment;
  admin?: Admin;
  approver?: Admin;
  center: string;
  amount?: number;
};

enum RequestStatus {
  APPROVED = "APPROVED",
  PENDING = "PENDING",
  REJECTED = "REJECTED",
}

export type CreateRequestPayload = {
  memberId: string;
  paymentId: string;
  reason: string;
};

export type UpdateRequestPayload = {
  reason?: string;
  adminId?: string | null;
  approverId?: string | null;
  memberId?: string;
  paymentId?: string;
  status?: boolean;
};

export type UpdateRequestStatusPayload = {
  status: boolean;
  approverId?: string | null;
  discount?: number;
  reason?: string;
};

export interface RequestFilterParams {
  status?: string | boolean;
  memberId?: string;
  adminId?: string;
  approverId?: string;
  paymentId?: string;
  center?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: string | number;
  limit?: string | number;
}

export interface RequestListResponse {
  ok: boolean;
  data?: Request[];
  requests?: Request[];
  message?: string;
  meta?: {
    total: number | string;
    page: number | string;
    limit: number | string;
    totalPages: number;
  };
}

export interface SingleRequestResponse {
  ok: boolean;
  data?: Request;
  request?: Request;
  message?: string;
}

export async function createRequest(
  payload: CreateRequestPayload
): Promise<SingleRequestResponse> {
  const response = await fetch(`${API_URL}/request`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create request");
  }
  return data;
}

export async function getRequests(
  params?: RequestFilterParams
): Promise<RequestListResponse> {
  const urlParams = new URLSearchParams();
  if (params) {
    if (params.status !== undefined && params.status !== "") {
      urlParams.set("status", String(params.status));
    }
    if (params.memberId) urlParams.set("memberId", params.memberId);
    if (params.adminId) urlParams.set("adminId", params.adminId);
    if (params.approverId) urlParams.set("approverId", params.approverId);
    if (params.paymentId) urlParams.set("paymentId", params.paymentId);
    if (params.center) urlParams.set("center", params.center);
    if (params.search) urlParams.set("search", params.search);
    if (params.startDate) urlParams.set("startDate", params.startDate);
    if (params.endDate) urlParams.set("endDate", params.endDate);
    if (params.page) urlParams.set("page", String(params.page));
    if (params.limit) urlParams.set("limit", String(params.limit));
  }

  const queryString = urlParams.toString();
  const response = await fetch(
    `${API_URL}/request${queryString ? `?${queryString}` : ""}`,
    {
      headers: { ...buildHeaders() },
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch requests");
  }
  return data;
}

export async function getRequest(id: string): Promise<SingleRequestResponse> {
  const response = await fetch(`${API_URL}/request/${id}`, {
    headers: { ...buildHeaders() },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch request");
  }
  return data;
}

export async function getRequestsByCenter(
  centerId: string,
  params?: RequestFilterParams
): Promise<RequestListResponse> {
  const urlParams = new URLSearchParams();
  if (params) {
    if (params.status !== undefined && params.status !== "") {
      urlParams.set("status", String(params.status));
    }
    if (params.startDate) urlParams.set("startDate", params.startDate);
    if (params.endDate) urlParams.set("endDate", params.endDate);
    if (params.page) urlParams.set("page", String(params.page));
    if (params.limit) urlParams.set("limit", String(params.limit));
  }

  const queryString = urlParams.toString();
  const response = await fetch(
    `${API_URL}/request/center/${centerId}${queryString ? `?${queryString}` : ""}`,
    {
      headers: { ...buildHeaders() },
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch requests for center");
  }
  return data;
}

export async function getRequestsByMember(
  memberId: string,
  params?: RequestFilterParams
): Promise<RequestListResponse> {
  const urlParams = new URLSearchParams();
  if (params) {
    if (params.status !== undefined && params.status !== "") {
      urlParams.set("status", String(params.status));
    }
    if (params.page) urlParams.set("page", String(params.page));
    if (params.limit) urlParams.set("limit", String(params.limit));
  }

  const queryString = urlParams.toString();
  const response = await fetch(
    `${API_URL}/request/member/${memberId}${queryString ? `?${queryString}` : ""}`,
    {
      headers: { ...buildHeaders() },
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch requests for member");
  }
  return data;
}

export async function getRequestsByAdmin(
  adminId: string,
  params?: RequestFilterParams
): Promise<RequestListResponse> {
  const urlParams = new URLSearchParams();
  if (params) {
    if (params.status !== undefined && params.status !== "") {
      urlParams.set("status", String(params.status));
    }
    if (params.page) urlParams.set("page", String(params.page));
    if (params.limit) urlParams.set("limit", String(params.limit));
  }

  const queryString = urlParams.toString();
  const response = await fetch(
    `${API_URL}/request/admin/${adminId}${queryString ? `?${queryString}` : ""}`,
    {
      headers: { ...buildHeaders() },
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch requests for admin");
  }
  return data;
}

export async function getRequestsByPayment(
  paymentId: string
): Promise<RequestListResponse> {
  const response = await fetch(`${API_URL}/request/payment/${paymentId}`, {
    headers: { ...buildHeaders() },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch requests for payment");
  }
  return data;
}

export async function updateRequest(
  id: string,
  payload: UpdateRequestPayload
): Promise<SingleRequestResponse> {
  const response = await fetch(`${API_URL}/request/${id}`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update request");
  }
  return data;
}

export async function updateRequestStatus(
  id: string,
  payload: UpdateRequestStatusPayload
): Promise<SingleRequestResponse> {
  const response = await fetch(`${API_URL}/request/${id}/status`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update request status");
  }
  return data;
}

export async function approveRequest(
  id: string,
  payload: UpdateRequestStatusPayload
): Promise<SingleRequestResponse> {
  const response = await fetch(`${API_URL}/request/${id}/approve`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to approve request");
  }
  return data;
}

export async function deleteRequest(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch(`${API_URL}/request/${id}`, {
    method: "DELETE",
    headers: { ...buildHeaders() },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete request");
  }
  return data;
}
