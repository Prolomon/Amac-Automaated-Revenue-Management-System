export const API_URL=process.env.EXPO_PUBLIC_API_URL + "/api"

export const AUTH_MEMBER = "amac_member";
export const AUTH_MEMBER_WALLET = "amac_member_wallet";
export const AUTH_MEMBER_WALLET_STATE = "amac_member_wallet_state";
export const AUTH_MEMBER_TOKEN = "amac_member_token";
export const AUTH_MEMBER_PIN = "amac_member_pin";
export const AUTH_MEMBER_UID = "amac_member_uid";

export function buildHeaders(
  hasJson: boolean = true,
  token?: string,
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (hasJson) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

