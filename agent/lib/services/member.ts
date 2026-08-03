import { API_URL, buildHeaders } from "../api";

export async function getMembers(page: number, limit: number, id: string, token: string): Promise<{ok: boolean, data: any[], meta: { page: number, limit: number, total: number, totalPages: number }}> {
  const response = await fetch(
    `${API_URL}/member/agent/${id}?page=${page}&limit=${limit}`,
    { headers: buildHeaders(true, token) },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch members");
  }
  return data;
}

export async function getMember(id: string, token: string) {
  const response = await fetch(`${API_URL}/member/${id}`, {
    headers: buildHeaders(true, token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch member");
  }
  return data;
}
