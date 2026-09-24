import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, STORAGE_KEYS } from "./api-config";

// Pure JS base64 decode safe for React Native
function base64UrlDecode(str: string): string {
  let output = str.replace(/-/g, "+").replace(/_/g, "/");
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += "==";
      break;
    case 3:
      output += "=";
      break;
    default:
      throw new Error("Illegal base64url string!");
  }
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let result = "";
  output = output.replace(/=+$/, "");
  for (
    let bc = 0, bs = 0, buffer: any, idx = 0;
    (buffer = output.charAt(idx++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (result += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer);
  }
  try {
    return decodeURIComponent(
      result
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    return result;
  }
}

export function parseJwtPayload(token: string): { exp?: number; [key: string]: any } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT token is expired or about to expire within bufferSeconds.
 */
export function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) {
    return false;
  }
  const expiryMs = payload.exp * 1000;
  const nowWithBuffer = Date.now() + bufferSeconds * 1000;
  return nowWithBuffer >= expiryMs;
}

export async function getAccessToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
}

export async function saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  } catch (err) {
    console.error("Error saving tokens:", err);
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (err) {
    console.error("Error clearing tokens:", err);
  }
}

// Event listeners for token refresh & auth failure
type TokenRefreshListener = (newToken: string) => void;
type AuthFailureListener = () => void;

const tokenRefreshedListeners: Set<TokenRefreshListener> = new Set();
const authFailureListeners: Set<AuthFailureListener> = new Set();

export function onTokenRefreshed(cb: TokenRefreshListener): () => void {
  tokenRefreshedListeners.add(cb);
  return () => tokenRefreshedListeners.delete(cb);
}

export function onAuthFailure(cb: AuthFailureListener): () => void {
  authFailureListeners.add(cb);
  return () => authFailureListeners.delete(cb);
}

function notifyTokenRefreshed(newToken: string) {
  tokenRefreshedListeners.forEach((cb) => {
    try {
      cb(newToken);
    } catch (e) {
      console.error("Error in tokenRefreshed callback:", e);
    }
  });
}

function notifyAuthFailure() {
  authFailureListeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error("Error in authFailure callback:", e);
    }
  });
}

// Single-flight refresh mutex to handle concurrent requests
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        notifyAuthFailure();
        return null;
      }

      const res = await fetch(`${API_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        await clearTokens();
        notifyAuthFailure();
        return null;
      }

      const data = await res.json();
      const newAccessToken = data.accessToken || data.token;
      const newRefreshToken = data.refreshToken;

      if (!newAccessToken) {
        await clearTokens();
        notifyAuthFailure();
        return null;
      }

      await saveTokens(newAccessToken, newRefreshToken);
      notifyTokenRefreshed(newAccessToken);
      return newAccessToken;
    } catch (err) {
      console.error("Token refresh network/unexpected error:", err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getValidAccessToken(): Promise<string | null> {
  const currentToken = await getAccessToken();
  if (!currentToken) {
    return null;
  }

  if (!isTokenExpired(currentToken)) {
    return currentToken;
  }

  return await refreshAccessToken();
}
