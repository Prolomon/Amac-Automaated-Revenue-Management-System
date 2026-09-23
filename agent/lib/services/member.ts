import { API_URL, authFetch, authFetchJson } from "../api";

export async function getMembers(
  page: number,
  limit: number,
  id: string,
  _token?: string
): Promise<{ ok: boolean; data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
  return authFetchJson(`${API_URL}/member/agent/${id}?page=${page}&limit=${limit}`);
}

export async function getMember(id: string, _token?: string) {
  return authFetchJson(`${API_URL}/member/${id}`);
}

export async function createMember(
  payload: any,
  _token?: string
): Promise<{ ok: boolean; message: string; data?: any; member?: any }> {
  return authFetchJson(`${API_URL}/member`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getProperties(_token?: string): Promise<{ ok: boolean; data: any[] }> {
  try {
    const response = await authFetch(`${API_URL}/property`);
    const data = await response.json();
    if (!response.ok) {
      return { ok: false, data: [] };
    }
    return { ok: true, data: Array.isArray(data.data) ? data.data : [] };
  } catch (error) {
    console.error("Failed to fetch properties:", error);
    return { ok: false, data: [] };
  }
}
