import { API_URL, buildHeaders } from "../api";

export type Staff = {
  id?: string;
  uid?: string;
  fullname: string;
  email: string;
  phone: string;
  gender: string;
  status?: boolean;
  password?: string;
  location?: string;
  avatar?: string;
  center?: string;
  secureToken?: string;
  role?: "STAFF";
  createdAt?: Date;
  updatedAt?: Date;
  permission?: { 
    canViewWallet: boolean;
    canCreateEntity: boolean;
    canViewEntity: boolean;
    canEditEntity: boolean;
    canDeleteEntity: boolean;
    canCreatePartner: boolean;
    canViewPartner: boolean;
    canEditPartner: boolean;
    canDeletePartner: boolean;
    canCreatePricing: boolean;
    canViewPricing: boolean;
    canEditPricing: boolean;
    canDeletePricing: boolean;
    canViewSplit: boolean;
    canSearch: boolean;
    canViewAssurance: boolean;
    canSupport: boolean;
  };
};

export async function getStaffs(
  uid: string,
): Promise<{
  ok: boolean;
  data?: Staff[];
  message?: string;
  meta: { total: number; limit: number; page: number; totalPages: number };
}> {
  if (!uid) {
    throw new Error("No user ID found");
  }
  const response = await fetch(`${API_URL}/staff/center/${uid}`, {
    headers: { ...buildHeaders(false) },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch staffs");
  }
  return data;
}

export async function getStaff(
  uid: string,
): Promise<{ ok: boolean; staff?: Staff; message?: string }> {
  if (!uid) {
    throw new Error("No user ID found");
  }
  const response = await fetch(`${API_URL}/staff/${uid}`, {
    headers: { ...buildHeaders(false) },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch staffs");
  }
  return data;
}

export type CreateStaffPayload = Omit<Staff, "id" | "uid" | "avatar"> & {
  avatar?: string | File;
};

export async function createStaff(
  payload: CreateStaffPayload,
): Promise<{ ok: boolean; staff?: Staff; message?: string }> {
  const avatarValue = payload?.avatar;
  const hasAvatarFile =
    typeof File !== "undefined" && (avatarValue as any) instanceof File;

  const response = await fetch(`${API_URL}/staff`, {
    method: "POST",
    headers: hasAvatarFile
      ? { ...buildHeaders(false) }
      : { ...buildHeaders(true) },
    body: hasAvatarFile
      ? (() => {
          const formData = new FormData();

          Object.entries(payload).forEach(([key, value]) => {
            if (value === undefined || value === null) return;

            if (value instanceof File) {
              formData.append(key, value);
              return;
            }

            formData.append(key, String(value));
          });

          return formData;
        })()
      : JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create staff");
  }
  return data;
}

export async function updateStaff(
  id: string,
  payload: Partial<Staff>,
): Promise<{ ok: boolean; staff?: Staff; message?: string }> {
  const response = await fetch(`${API_URL}/staff/${id}`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update staff");
  }
  return data;
}

export async function deleteStaff(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch(`${API_URL}/staff/${id}`, {
    method: "DELETE",
    headers: { ...buildHeaders(true) },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete staff");
  }
  return data;
}

export async function loginStaff(
  email: string,
  password: string,
): Promise<{
  ok: boolean;
  staff?: Staff;
  message?: string;
  token: string;
  role: string;
}> {
  const response = await fetch(`${API_URL}/staff/login`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to login staff");
  }

  return data;
}

export async function changeStaffPassword(
  id: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ ok: boolean; message?: string; error?: string }> {

  const response = await fetch(`${API_URL}/staff/${id}/change-password`, {
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

export async function forgetStaffPassword(
  id: string,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/staff/${id}/forget-password`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to forget password");
  }

  return data;
}