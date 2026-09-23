import { API_URL } from "./api-config";
import { getValidAccessToken, refreshAccessToken } from "./auth-token";

export interface AuthFetchOptions extends RequestInit {
  skipAuth?: boolean;
  retryCount?: number;
}

function resolveUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
  if (pathOrUrl.startsWith("/api/")) {
    return `${baseUrl}${pathOrUrl}`;
  }
  if (pathOrUrl.startsWith("/")) {
    return `${API_URL}${pathOrUrl}`;
  }
  return `${API_URL}/${pathOrUrl}`;
}

/**
 * Universal authenticated fetch with automatic access token renewal for Agent app.
 */
export async function authFetch(
  pathOrUrl: string,
  options: AuthFetchOptions = {}
): Promise<Response> {
  const fullUrl = resolveUrl(pathOrUrl);
  const headers = new Headers(options.headers || {});

  if (
    options.body &&
    typeof options.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth) {
    const validToken = await getValidAccessToken();
    if (validToken) {
      headers.set("Authorization", `Bearer ${validToken}`);
    }
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (response.status === 401 && !options.skipAuth && (options.retryCount || 0) < 1) {
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      return authFetch(fullUrl, {
        ...options,
        headers,
        retryCount: (options.retryCount || 0) + 1,
      });
    }
  }

  return response;
}

export async function authFetchJson<T = any>(
  pathOrUrl: string,
  options: AuthFetchOptions = {}
): Promise<T> {
  const res = await authFetch(pathOrUrl, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
  }
  return data;
}
