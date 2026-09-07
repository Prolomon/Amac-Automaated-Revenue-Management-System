import { API_URL, buildHeaders } from "../api";

export type DocumentStatus = "VERIFIED" | "REJECTED" | "PENDING";

export interface Document {
  id: string;
  type: string;
  number: string;
  data?: any;
  status: DocumentStatus;
  memberId: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getDocumentsByMember(
  memberId: string
): Promise<{ ok: boolean; data?: Document[]; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/document/member/${encodeURIComponent(memberId)}`, {
      headers: { ...buildHeaders(false) },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, message: err.message || "Failed to fetch documents", data: [] };
    }
    const data = await res.json();
    return { ok: true, data: data.data || [] };
  } catch (error: any) {
    console.error("getDocumentsByMember error:", error);
    return { ok: false, message: error?.message || "Failed to fetch documents", data: [] };
  }
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus
): Promise<{ ok: boolean; document?: Document; message?: string }> {
  const res = await fetch(`${API_URL}/document/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to update document status");
  }
  return data;
}

export async function createDocument(payload: {
  type: string;
  number: string;
  memberId: string;
  memberType?: string;
  status?: DocumentStatus;
  data?: any;
}): Promise<{ ok: boolean; document?: Document; message?: string }> {
  const res = await fetch(`${API_URL}/document`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to create document");
  }
  return data;
}

export async function deleteDocument(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${API_URL}/document/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...buildHeaders(true) },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to delete document");
  }
  return data;
}
