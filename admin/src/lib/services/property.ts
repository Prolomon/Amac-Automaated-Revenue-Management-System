import { API_URL, buildHeaders } from "../api";

export interface Property {
  id: string;
  pid?: string | null;
  name: string;
  type: string;
  size: string;
  images?: string[];
  center?: string | null;
  memberId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  membersCount?: number | string;
  members?: any[];
}

export interface GetPropertiesResponse {
  ok: boolean;
  data: Property[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface GetPropertyResponse {
  ok: boolean;
  property?: Property;
  data?: Property & { members?: any[] };
  members?: any[];
  message?: string;
}

export async function getProperties(params?: {
  center?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<GetPropertiesResponse> {
  try {
    const query = new URLSearchParams();
    if (params?.center && params.center !== "ADMIN" && params.center !== "all") {
      query.set("center", params.center);
    }
    if (params?.search) {
      query.set("search", params.search);
    }
    if (params?.page) {
      query.set("page", String(params.page));
    }
    if (params?.limit) {
      query.set("limit", String(params.limit));
    }

    const qs = query.toString();
    const url = `${API_URL}/property${qs ? `?${qs}` : ""}`;

    const res = await fetch(url, {
      headers: { ...buildHeaders(false) },
    });
    if (!res.ok) {
      return { ok: false, data: [] };
    }
    const data = await res.json();
    return {
      ok: true,
      data: data.data || [],
      meta: data.meta,
    };
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    return { ok: false, data: [] };
  }
}

export async function getProperty(id: string): Promise<GetPropertyResponse> {
  try {
    const res = await fetch(`${API_URL}/property/${id}`, {
      headers: { ...buildHeaders(false) },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, message: data.message || "Failed to fetch property" };
    }
    const data = await res.json();
    const propertyObj = data.property || data.data;
    const membersList = data.members || data.data?.members || propertyObj?.members || [];
    return {
      ok: true,
      property: propertyObj,
      members: membersList,
      data: data.data,
    };
  } catch (error: any) {
    console.error("Failed to fetch property:", error);
    return { ok: false, message: error.message || "Failed to fetch property" };
  }
}

export async function createProperty(payload: Partial<Property>): Promise<{ ok: boolean; property?: Property; message?: string }> {
  const res = await fetch(`${API_URL}/property`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to create property");
  }
  return data;
}

export async function updateProperty(id: string, payload: Partial<Property>): Promise<{ ok: boolean; property?: Property; message?: string }> {
  const res = await fetch(`${API_URL}/property/${id}`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to update property");
  }
  return data;
}

export async function deleteProperty(id: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${API_URL}/property/${id}`, {
    method: "DELETE",
    headers: { ...buildHeaders(true) },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to delete property");
  }
  return data;
}
