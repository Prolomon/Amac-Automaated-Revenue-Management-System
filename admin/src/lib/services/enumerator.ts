import { API_URL, buildHeaders } from "../api";

export interface GuarantorInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Enumerator {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone: string;
  altPhone?: string;
  avatar?: string;
  dob?: string;
  address?: string;
  center: string;
  zone?: string;
  level: "BASIC" | "SUPER";
  supervisorId?: string;
  status: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
  guarantor1?: GuarantorInfo;
  guarantor2?: GuarantorInfo;
  wallets?: { balance: number; accountNo: string }[];
  wallet?: { balance: number; accountNo: string; accountName: string };
  supervisor?: { uid: string; name: string; phone: string; email: string };
  _count?: { properties: number; members: number };
}

export interface PropertyCapture {
  id: string;
  pid?: string;
  name: string;
  type: string;
  size: string;
  address: string;
  location?: any;
  images: string[];
  center?: string;
  zone?: string;
  status: "PENDING" | "APPROVED" | "DENIED";
  rejectionReason?: string;
  reward: number;
  enumeratorId?: string;
  supervisorId?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  enumerator?: { uid: string; name: string; phone: string; email: string; center: string };
  member?: { uid: string; fullname: string; businessName?: string; phone: string };
}

export interface DailyTaskProgress {
  date: string;
  captures: {
    submitted: number;
    approved: number;
    target: number;
    rate: number;
    earned: number;
    percent: number;
  };
  registrations: {
    submitted: number;
    approved: number;
    target: number;
    rate: number;
    earned: number;
    percent: number;
  };
  earnings: {
    today: number;
    balance: number;
  };
}

export interface EnumerationAnalytics {
  overview: {
    totalEnumerators: number;
    totalSupervisors: number;
    totalPersonnel: number;
    totalCaptures: number;
    totalRegistrations: number;
    totalRewardsPaid: number;
  };
  today: {
    captures: number;
    registrations: number;
  };
  capturesBreakdown: {
    total: number;
    pending: number;
    approved: number;
    denied: number;
  };
  registrationsBreakdown: {
    total: number;
    pending: number;
    approved: number;
  };
}

export const getAllEnumerators = async (params?: {
  page?: number;
  limit?: number;
  level?: string;
  center?: string;
  status?: string | boolean;
  supervisorId?: string;
  search?: string;
}): Promise<{ ok: boolean; data: Enumerator[]; meta: any }> => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.level) query.set("level", params.level);
  if (params?.center) query.set("center", params.center);
  if (params?.status !== undefined) query.set("status", String(params.status));
  if (params?.supervisorId) query.set("supervisorId", params.supervisorId);
  if (params?.search) query.set("search", params.search);

  const res = await fetch(`${API_URL}/enumerator?${query.toString()}`, {
    headers: { ...buildHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch enumerators");
  return data;
};

export const getEnumeratorById = async (id: string): Promise<{ ok: boolean; data: Enumerator & { teamMembers?: any[] } }> => {
  const res = await fetch(`${API_URL}/enumerator/${id}`, {
    headers: { ...buildHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch enumerator details");
  return data;
};

export const createEnumerator = async (payload: any): Promise<{ ok: boolean; message: string; data: Enumerator }> => {
  const res = await fetch(`${API_URL}/enumerator`, {
    method: "POST",
    headers: { ...buildHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create enumerator");
  return data;
};

export const getDailyTaskProgress = async (id?: string): Promise<{ ok: boolean; data: DailyTaskProgress }> => {
  const url = id ? `${API_URL}/enumerator/daily-tasks/${id}` : `${API_URL}/enumerator/daily-tasks`;
  const res = await fetch(url, {
    headers: { ...buildHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch task progress");
  return data;
};

export const getEnumerationAnalytics = async (): Promise<{ ok: boolean; data: EnumerationAnalytics }> => {
  const res = await fetch(`${API_URL}/enumerator/analytics`, {
    headers: { ...buildHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch analytics");
  return data;
};

export const getCaptures = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  enumeratorId?: string;
  supervisorId?: string;
  center?: string;
  search?: string;
}): Promise<{ ok: boolean; data: PropertyCapture[]; meta: any }> => {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);
  if (params?.enumeratorId) query.set("enumeratorId", params.enumeratorId);
  if (params?.supervisorId) query.set("supervisorId", params.supervisorId);
  if (params?.center) query.set("center", params.center);
  if (params?.search) query.set("search", params.search);

  const res = await fetch(`${API_URL}/property/captures?${query.toString()}`, {
    headers: { ...buildHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch captures");
  return data;
};

export const getCaptureById = async (id: string): Promise<{ ok: boolean; data: PropertyCapture }> => {
  const res = await fetch(`${API_URL}/property/captures/${id}`, {
    headers: { ...buildHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch capture details");
  return data;
};

export const reviewPropertyCapture = async (
  id: string,
  action: "APPROVE" | "DENY",
  rejectionReason?: string
): Promise<{ ok: boolean; message: string; data: PropertyCapture }> => {
  const res = await fetch(`${API_URL}/property/review/${id}`, {
    method: "POST",
    headers: { ...buildHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ action, rejectionReason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to review capture");
  return data;
};

export const reviewMemberRegistration = async (
  id: string,
  action: "APPROVE" | "DENY",
  rejectionReason?: string
): Promise<{ ok: boolean; message: string; data: any }> => {
  const res = await fetch(`${API_URL}/property/review-member/${id}`, {
    method: "POST",
    headers: { ...buildHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ action, rejectionReason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to review registration");
  return data;
};

export const enumeratorService = {
  getAll: getAllEnumerators,
  getById: getEnumeratorById,
  create: createEnumerator,
  getDailyTaskProgress,
  getAnalytics: getEnumerationAnalytics,
  getCaptures,
  getCaptureById,
  reviewCapture: reviewPropertyCapture,
  reviewRegistration: reviewMemberRegistration,
};
