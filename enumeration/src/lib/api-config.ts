import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const rawBaseUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000");

export const API_URL = rawBaseUrl.endsWith("/api")
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/+$/, "")}/api`;

export const STORAGE_KEYS = {
  USER: "amac_enum_user",
  TOKEN: "amac_enum_token",
  REFRESH_TOKEN: "amac_enum_refresh_token",
  WALLET: "amac_enum_wallet",
  ACTIVE_LEVEL: "amac_enum_active_level", // "BASIC" | "SUPER"
};

export function buildHeaders(token?: string | null, isMultipart = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}
