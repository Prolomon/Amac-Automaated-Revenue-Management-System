import Cookies from "js-cookie";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Get current access token from cookie (js-cookie with document.cookie fallback).
 */
export function getTokenFromCookie() {
  if (typeof window === "undefined") return null;
  const token = Cookies.get("amac_token");
  if (token) return token;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + "amac_token" + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Get current refresh token from cookie (js-cookie with document.cookie fallback).
 */
export function getRefreshTokenFromCookie() {
  if (typeof window === "undefined") return null;
  const refreshToken = Cookies.get("amac_refresh_token");
  if (refreshToken) return refreshToken;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + "amac_refresh_token" + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Store updated access & refresh tokens across cookies and notify the application.
 */
export function setAuthTokens(accessToken, refreshToken) {
  if (typeof window === "undefined") return;
  if (accessToken) {
    Cookies.set("amac_token", accessToken, { path: "/", expires: 1 });
    try {
      document.cookie = `amac_token=${encodeURIComponent(accessToken)}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    } catch (_) {}
  }
  if (refreshToken) {
    Cookies.set("amac_refresh_token", refreshToken, { path: "/", expires: 7 });
    try {
      document.cookie = `amac_refresh_token=${encodeURIComponent(refreshToken)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } catch (_) {}
  }

  // Notify AuthContext and other components of the refreshed token
  window.dispatchEvent(
    new CustomEvent("amac_token_refreshed", {
      detail: { token: accessToken, refreshToken },
    })
  );
}

/**
 * Clear all authentication cookies and local state.
 */
export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  Cookies.remove("amac_token", { path: "/" });
  Cookies.remove("amac_refresh_token", { path: "/" });
  Cookies.remove("amac_role", { path: "/" });
  Cookies.remove("amac_session", { path: "/" });
  Cookies.remove("amac_uid", { path: "/" });
  Cookies.remove("arums_uid", { path: "/" });

  try {
    document.cookie = "amac_token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "amac_refresh_token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "amac_role=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "amac_session=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "amac_uid=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "arums_uid=; path=/; max-age=0; SameSite=Lax";
  } catch (_) {}

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("loggedIn");
  }

  window.dispatchEvent(new CustomEvent("amac_session_expired"));
}

/**
 * Check if a JWT is expired (or will expire within threshold seconds).
 */
export function isTokenExpired(token, thresholdSeconds = 30) {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000 - thresholdSeconds * 1000;
  } catch (e) {
    return false;
  }
}

// In-flight refresh promise singleton to prevent race conditions on parallel 401s
let refreshPromise = null;

/**
 * Exchange the current refresh token for a brand new access token.
 * Multiple concurrent callers will wait on the same single request.
 */
export async function refreshAuthToken() {
  const refreshToken = getRefreshTokenFromCookie();
  if (!refreshToken) {
    return null;
  }

  // If a refresh request is already underway, wait for it instead of sending duplicates
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const rawFetch = (typeof window !== "undefined" && window._rawFetch) || fetch;
      const response = await rawFetch(`${API_URL}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Refresh token is expired or invalid
        clearAuthTokens();
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.accessToken || data.token;
      const newRefreshToken = data.refreshToken;

      if (newAccessToken) {
        setAuthTokens(newAccessToken, newRefreshToken || refreshToken);
        return newAccessToken;
      }

      clearAuthTokens();
      return null;
    } catch (err) {
      console.error("Token refresh failed:", err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Ensure a valid access token exists; refreshes it proactively if expired.
 */
export async function getValidAccessToken() {
  let token = getTokenFromCookie();
  const refreshToken = getRefreshTokenFromCookie();

  if ((!token || isTokenExpired(token)) && refreshToken) {
    const newToken = await refreshAuthToken();
    if (newToken) {
      token = newToken;
    }
  }

  return token;
}

export function buildHeaders(hasJson = true, tokenOverride = null) {
  const headers = {};
  if (hasJson) headers["Content-Type"] = "application/json";
  const token = tokenOverride || getTokenFromCookie();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/**
 * Authenticated fetch with proactive token check and automatic 401 refresh retry.
 */
export async function authFetch(input, init = {}) {
  const rawFetch = (typeof window !== "undefined" && window._rawFetch) || fetch;

  // Proactively refresh if access token is expired but refresh token exists
  let token = await getValidAccessToken();

  let modifiedInit = { ...init };
  const headers = new Headers(modifiedInit.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  modifiedInit.headers = headers;

  let response = await rawFetch(input, modifiedInit);

  // If 401 is returned (token expired in-flight), attempt a refresh and retry once
  if (response.status === 401 && getRefreshTokenFromCookie()) {
    const newToken = await refreshAuthToken();
    if (newToken) {
      const retryHeaders = new Headers(modifiedInit.headers || {});
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      modifiedInit.headers = retryHeaders;
      response = await rawFetch(input, modifiedInit);
    }
  }

  return response;
}

/**
 * Global fetch interceptor to transparently upgrade all application fetch calls
 * with automatic token expiration detection and seamless refresh.
 */
export function installFetchInterceptor() {
  if (typeof window === "undefined" || window._fetchInterceptorInstalled) return;

  const originalFetch = window.fetch.bind(window);
  window._rawFetch = originalFetch;

  window.fetch = async function (input, init = {}) {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : input?.url || "";

    const isApiRequest = url.includes("/api/") || (API_URL && url.startsWith(API_URL));
    const isAuthBypass =
      url.includes("/auth/refresh-token") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/admin/login") ||
      url.includes("/staff/login");

    // Don't intercept external calls or token refresh endpoint itself
    if (!isApiRequest || isAuthBypass) {
      return originalFetch(input, init);
    }

    // Step 1: Proactive check before request
    const currentToken = getTokenFromCookie();
    const refreshToken = getRefreshTokenFromCookie();

    let activeInit = { ...init };
    let headers = new Headers(activeInit.headers || {});

    if ((!currentToken || isTokenExpired(currentToken)) && refreshToken) {
      const refreshedToken = await refreshAuthToken();
      if (refreshedToken) {
        headers.set("Authorization", `Bearer ${refreshedToken}`);
        activeInit.headers = headers;
      }
    } else if (currentToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${currentToken}`);
      activeInit.headers = headers;
    }

    // Step 2: Make the fetch
    let response;
    try {
      response = await originalFetch(input, activeInit);
    } catch (networkErr) {
      throw networkErr;
    }

    // Step 3: Reactive retry on 401 Unauthorized
    if (response.status === 401 && getRefreshTokenFromCookie()) {
      const newToken = await refreshAuthToken();
      if (newToken) {
        const retryHeaders = new Headers(activeInit.headers || {});
        retryHeaders.set("Authorization", `Bearer ${newToken}`);
        activeInit.headers = retryHeaders;
        return originalFetch(input, activeInit);
      }
    }

    return response;
  };

  window._fetchInterceptorInstalled = true;
}

// Auto-install interceptor on client-side initialization
if (typeof window !== "undefined") {
  installFetchInterceptor();
}

async function parseResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return {
    message: text || `HTTP ${response.status}: ${response.statusText}`,
  };
}

export async function login(email, password) {
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

  // Persist tokens and identifiers client-side
  const accessToken = data.accessToken || data.token;
  const refreshToken = data.refreshToken;
  if (accessToken || refreshToken) {
    setAuthTokens(accessToken, refreshToken);
  }

  if (typeof window !== "undefined" && data.admin?.uid) {
    try {
      document.cookie = `arums_uid=${encodeURIComponent(data.admin.uid)}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    } catch (e) {
      console.warn("Failed to set cookie client-side", e);
    }
  }

  return data;
}

export async function getMembers(page, limit) {
  const response = await fetch(
    `${API_URL}/member?page=${page}&limit=${limit}`,
    { headers: buildHeaders() }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch members");
  }
  return data;
}

export async function getMember(id) {
  const response = await fetch(`${API_URL}/member/${id}`, {
    headers: buildHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch member");
  }
  return data;
}

export async function deleteMember(id) {
  const response = await fetch(`${API_URL}/member/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete member");
  }
  return data;
}

export async function updateMember(id, payload) {
  const response = await fetch(`${API_URL}/member/${id}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update member");
  }
  return data;
}

export async function getPayment(id) {
  const response = await fetch(`${API_URL}/payment/reference/${id}`, {
    headers: buildHeaders(false),
  });
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function getPayments(userId) {
  const response = await fetch(`${API_URL}/payment/user/${userId}`, {
    headers: buildHeaders(false),
  });
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function getAllPayments() {
  const response = await fetch(`${API_URL}/payment`, {
    headers: buildHeaders(),
  });
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function calculateDistribution(config, id) {
  const response = await fetch(`${API_URL}/payment-distribution/calculate`, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify({ ...config, userId: id }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function getAdmin(id) {
  if (!id) {
    throw new Error("No user ID found");
  }

  const response = await fetch(`${API_URL}/admin/${id}`, {
    headers: buildHeaders(false),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    let errorMessage = "Failed to fetch admin data";

    if (contentType && contentType.includes("application/json")) {
      try {
        const data = await response.json();
        errorMessage = data.message || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    } else {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

export async function updateAdmin(payload, uid) {
  if (!uid) {
    throw new Error("No user ID found");
  }
  const response = await fetch(`${API_URL}/admin/${uid}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update admin");
  }
  return data;
}

export async function updatePaymentConfig(payload) {
  const token = getTokenFromCookie();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_URL}/admin/${token}/payment-config`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update payment configuration");
  }
  return data;
}

export function logout() {
  clearAuthTokens();
}
