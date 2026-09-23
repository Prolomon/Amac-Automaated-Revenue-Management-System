import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import { API_URL, AUTH_AGENT_REFRESH_TOKEN, AUTH_AGENT_TOKEN } from "./api-config";

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let activeRefreshPromise: Promise<string | null> | null = null;

type TokenListener = (token: string) => void;
type AuthFailureListener = () => void;

const tokenListeners = new Set<TokenListener>();
const authFailureListeners = new Set<AuthFailureListener>();

/**
 * Register a listener invoked whenever a new access token is generated.
 */
export function onTokenRefreshed(listener: TokenListener): () => void {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}

/**
 * Register a listener invoked when token refresh fails completely (e.g. refresh token expired).
 */
export function onAuthFailure(listener: AuthFailureListener): () => void {
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}

/**
 * Decode JWT payload safely.
 */
export function decodeJwt(token: string): { exp?: number; [key: string]: any } | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Check if a JWT access token is expired or within bufferSeconds of expiration.
 */
export function isTokenExpired(token: string | null | undefined, bufferSeconds = 60): boolean {
  if (!token) return true;
  const decoded = decodeJwt(token);
  if (!decoded || typeof decoded.exp !== "number") {
    return false;
  }
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return decoded.exp <= nowInSeconds + bufferSeconds;
}

/**
 * Get current access token.
 */
export async function getAccessToken(): Promise<string | null> {
  if (memoryAccessToken) return memoryAccessToken;
  try {
    const stored = await AsyncStorage.getItem(AUTH_AGENT_TOKEN);
    if (stored) {
      memoryAccessToken = stored;
    }
    return stored;
  } catch {
    return null;
  }
}

/**
 * Get current refresh token.
 */
export async function getRefreshToken(): Promise<string | null> {
  if (memoryRefreshToken) return memoryRefreshToken;
  try {
    const stored = await AsyncStorage.getItem(AUTH_AGENT_REFRESH_TOKEN);
    if (stored) {
      memoryRefreshToken = stored;
    }
    return stored;
  } catch {
    return null;
  }
}

/**
 * Persist access and refresh tokens.
 */
export async function saveTokens(
  accessToken: string,
  refreshToken?: string | null
): Promise<void> {
  memoryAccessToken = accessToken;
  await AsyncStorage.setItem(AUTH_AGENT_TOKEN, accessToken);

  if (refreshToken) {
    memoryRefreshToken = refreshToken;
    await AsyncStorage.setItem(AUTH_AGENT_REFRESH_TOKEN, refreshToken);
  }
}

/**
 * Clear stored tokens from memory and AsyncStorage.
 */
export async function clearTokens(): Promise<void> {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  try {
    await AsyncStorage.removeItem(AUTH_AGENT_TOKEN);
    await AsyncStorage.removeItem(AUTH_AGENT_REFRESH_TOKEN);
  } catch {
    // ignore
  }
}

/**
 * Concurrency-safe token refresh.
 * If multiple requests call this simultaneously, they will all await the exact same in-flight Promise.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        authFailureListeners.forEach((listener) => {
          try {
            listener();
          } catch (_) {}
        });
        return null;
      }

      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        if (
          response.status === 401 ||
          response.status === 403 ||
          data.code === "REFRESH_TOKEN_EXPIRED" ||
          data.code === "REFRESH_TOKEN_INVALID"
        ) {
          await clearTokens();
          authFailureListeners.forEach((listener) => {
            try {
              listener();
            } catch (_) {}
          });
        }
        return null;
      }

      const newAccessToken = data.accessToken || data.token;
      const newRefreshToken = data.refreshToken || refreshToken;

      if (!newAccessToken) {
        return null;
      }

      await saveTokens(newAccessToken, newRefreshToken);

      tokenListeners.forEach((listener) => {
        try {
          listener(newAccessToken);
        } catch (_) {}
      });

      return newAccessToken;
    } catch (err) {
      console.warn("Agent auto token refresh error:", err);
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

/**
 * Returns a valid, non-expired access token.
 * If current token is missing or expired, it automatically refreshes it first.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const currentToken = await getAccessToken();

  if (!currentToken || isTokenExpired(currentToken)) {
    const refreshed = await refreshAccessToken();
    return refreshed || currentToken || null;
  }

  return currentToken;
}
