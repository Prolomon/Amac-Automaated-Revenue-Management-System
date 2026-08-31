import { API_URL, buildHeaders } from "@/lib/api";

export type AdminLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export type Admin = {
  id?: string;
  uid?: string;
  center: string;
  prefix?: string;
  email?: string;
  password?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  location?: AdminLocation;
  state?: string;
  address?: string;
  lga?: string;
  country?: string;
  status?: boolean;
  paymentConfig?: Record<string, unknown>;
  secureToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  adminLocation?: string;
  ledger?: string;
  departmentId?: string | null;
  department?: {
    uid?: string;
    name?: string;
    role?: string;
    status?: boolean;
  } | null;
};

export type CreateAdminInput = Pick<
  Admin,
  | "center"
  | "email"
  | "password"
  | "location"
  | "state"
  | "address"
  | "lga"
  | "country"
  | "prefix"
> & {
  status?: Admin["status"];
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  phone?: string;
};

export async function login(
  email: string,
  password: string,
): Promise<{
  ok: boolean;
  admin?: Admin;
  message?: string;
  token: string;
  role: string;
}> {
  const response = await fetch(`${API_URL}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

export async function createAdmin(
  adminData: CreateAdminInput,
): Promise<{ ok: boolean; admin?: Admin; message?: string }> {
  const response = await fetch(`${API_URL}/admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(adminData),
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.message || "Failed to create admin");
  }
  const data = await response.json();
  return data;
}

export async function getAdminProfile(): Promise<{
  ok: boolean;
  admin?: Admin;
  message?: string;
}> {
  const response = await fetch(`${API_URL}/admin/profile`, {
    // headers: buildHeaders(),
  });
  const data = await response.json();
  return data;
}

export async function updateStatus(
  id: string,
  status: boolean,
): Promise<{ ok: boolean; admin?: Admin; message?: string }> {
  const response = await fetch(`${API_URL}/admin/${id}/status`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update status");
  }
  return data;
}

export async function changePassword(
  id: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/admin/${id}/change-password`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to change password");
  }
  return data;
}

export async function changeSecurityToken(
  id: string,
  oldSecurityToken: string,
  newSecurityToken: string,
  confirmSecurityToken: string,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/admin/${id}/change-security-token`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({
      oldSecurityToken,
      newSecurityToken,
      confirmSecurityToken,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to change security Token");
  }
  return data;
}

export async function createSecurityToken(
  id: string,
  securityToken: string,
  confirmSecurityToken: string,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/admin/${id}/security-token`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ securityToken, confirmSecurityToken }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to change security Token");
  }
  return data;
}

export async function verifySecurityCode(id: string, secureToken: string) {
  if (!secureToken) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_URL}/admin/${id}/verify-security-token`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ secureCode: secureToken }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to verify security code");
  }

  return data;
}

export async function forgetPassword(
  id: string,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/admin/${id}/forget-password`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to change password");
  }
  return data;
}

export async function forgetSecureCode(
  id: string,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/admin/${id}/forget-secure-token`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to change secure code");
  }
  return data;
}

export async function getAllAdmins(): Promise<{
  ok: boolean;
  admins?: Admin[];
  data?: Admin[];
  message?: string;
  meta?: {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}> {
  const response = await fetch(`${API_URL}/admin`, {
    headers: { ...buildHeaders(true) },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch admins");
  }

  const data = await response.json();
  return data;
}

export async function getAdmin(
  id: string,
): Promise<{ ok: boolean; admin?: Admin; message?: string }> {
  if (!id) {
    throw new Error("No user ID found");
  }

  const response = await fetch(`${API_URL}/admin/${id}`, {
    headers: { ...buildHeaders(false) },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch admin data");
  }

  const data = await response.json();
  return data;
}

type DashboardStats = {
  admin: number;
  member: number;
  demand: number;
  payment: number;
  revenue: number;
  partner: number;
  agent: number;
  paymentRate: number;
};

export async function dashboardStats(
  center: string,
): Promise<{ ok: boolean; stats?: DashboardStats; message?: string }> {
  if (!center) {
    throw new Error("No center ID found");
  }

  const response = await fetch(`${API_URL}/admin/dashboard/${center}/stats`, {
    headers: { ...buildHeaders(false) },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }

  const data = await response.json();
  return data;
}
