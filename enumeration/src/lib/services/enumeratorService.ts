import { API_URL, buildHeaders, authFetchJson } from "../api";
import {
  EnumeratorUser,
  PropertyCapture,
  DailyTaskProgress,
  RegisteredMember,
} from "../types";

export const enumeratorService = {
  // Auth
  async login(identifier: string, password: string) {
    const res = await fetch(`${API_URL}/enumerator/login`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to sign in");
    return data;
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_URL}/enumerator/forgot-password`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to send reset code");
    return data;
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const res = await fetch(`${API_URL}/enumerator/reset-password`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to reset password");
    return data;
  },

  async changePassword(oldPassword: string, newPassword: string, _token?: string) {
    return authFetchJson(`${API_URL}/enumerator/change-password`, {
      method: "POST",
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  // Profile & Daily Tasks
  async getProfile(_token?: string): Promise<{ ok: boolean; data: EnumeratorUser }> {
    return authFetchJson(`${API_URL}/enumerator/profile`);
  },

  async getDailyTasks(_token?: string): Promise<{ ok: boolean; data: DailyTaskProgress }> {
    return authFetchJson(`${API_URL}/enumerator/daily-tasks`);
  },

  // Property Captures
  async submitCapture(
    payload: {
      address: string;
      images: string[];
      location?: any;
      name?: string;
      type?: string;
      size?: string;
      zone?: string;
      center?: string;
    },
    _token?: string
  ): Promise<{ ok: boolean; message: string; data: PropertyCapture }> {
    return authFetchJson(`${API_URL}/property/capture`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getCaptures(
    _token?: string,
    params?: { status?: string; page?: number; limit?: number; supervisorId?: string }
  ): Promise<{ ok: boolean; data: PropertyCapture[]; meta?: any }> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.supervisorId) query.set("supervisorId", params.supervisorId);

    const queryString = query.toString();
    return authFetchJson(`${API_URL}/property/captures${queryString ? `?${queryString}` : ""}`);
  },

  async getCaptureById(id: string, _token?: string): Promise<{ ok: boolean; data: PropertyCapture }> {
    return authFetchJson(`${API_URL}/property/captures/${id}`);
  },

  // Member registration by Enumerator
  async registerMember(payload: any, _token?: string): Promise<{ ok: boolean; message: string; data: any }> {
    return authFetchJson(`${API_URL}/member`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Directory of all registered properties
  async getProperties(_token?: string): Promise<{ ok: boolean; data: any[] }> {
    try {
      const data = await authFetchJson(`${API_URL}/property`);
      return { ok: true, data: Array.isArray(data.data) ? data.data : [] };
    } catch {
      return { ok: false, data: [] };
    }
  },

  // Supervisor Operations
  async getSupervisorTeam(_token?: string): Promise<{ ok: boolean; data: any[] }> {
    return authFetchJson(`${API_URL}/enumerator/team`);
  },

  async reviewCapture(
    id: string,
    action: "APPROVE" | "DENY",
    rejectionReason: string | undefined,
    _token?: string
  ): Promise<{ ok: boolean; message: string; data: PropertyCapture }> {
    return authFetchJson(`${API_URL}/property/review/${id}`, {
      method: "POST",
      body: JSON.stringify({ action, rejectionReason }),
    });
  },

  async reviewMember(
    id: string,
    action: "APPROVE" | "DENY",
    rejectionReason: string | undefined,
    _token?: string
  ): Promise<{ ok: boolean; message: string; data: any }> {
    return authFetchJson(`${API_URL}/property/review-member/${id}`, {
      method: "POST",
      body: JSON.stringify({ action, rejectionReason }),
    });
  },
};
