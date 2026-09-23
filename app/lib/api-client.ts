import { API_URL } from "./api-config";
import { getValidAccessToken, refreshAccessToken } from "./auth-token";

export interface AuthFetchOptions extends RequestInit {
  skipAuth?: boolean;
  retryCount?: number;
}

/**
 * Normalizes an API path or full URL.
 */
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
 * Universal authenticated fetch with automatic access token renewal.
 *
 * 1. Checks if current access token is expired before sending, renewing via refreshToken if needed.
 * 2. If the server still responds with HTTP 401 (e.g. clock skew, revoked token), it automatically
 *    fetches a new access token and retries the request once seamlessly.
 */
export async function authFetch(
  pathOrUrl: string,
  options: AuthFetchOptions = {}
): Promise<Response> {
  const fullUrl = resolveUrl(pathOrUrl);
  const headers = new Headers(options.headers || {});

  // Add default JSON content-type if not already specified and not FormData
  if (
    options.body &&
    typeof options.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  // Inject valid Bearer access token if not explicitly skipped
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

  // Handle expired access token response (401)
  if (response.status === 401 && !options.skipAuth && (options.retryCount || 0) < 1) {
    // Attempt to refresh the access token
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      // Retry the original request with the fresh access token
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

/**
 * Convenience helper: calls authFetch and parses JSON.
 */
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
