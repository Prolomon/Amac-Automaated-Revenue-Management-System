import { API_URL, buildHeaders } from "@/lib/api";

export type ActivityLog = {
  id: string;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  action: string;
  method: string;
  route: string;
  status: number;
  details: any;
  createdAt: string | Date;
};

export async function getActivityLogs(
  page = 1,
  limit = 50,
  role = "",
  search = ""
): Promise<{ ok: boolean; logs?: ActivityLog[]; meta?: any; message?: string }> {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("limit", String(limit));
  if (role) params.append("role", role);
  if (search) params.append("search", search);

  const response = await fetch(`${API_URL}/activity-log?${params.toString()}`, {
    method: "GET",
    headers: { ...buildHeaders(true) },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch activity logs");
  }

  return await response.json();
}
