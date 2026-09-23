import { API_URL, authFetchJson } from "../api";

export async function getAgent(uid: string, _token?: string) {
  if (!uid) {
    throw new Error("No user ID found");
  }
  return authFetchJson(`${API_URL}/agent/one/${uid}`);
}
