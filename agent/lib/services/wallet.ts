import { API_URL, authFetchJson } from "@/lib/api";
import { Wallet, Transaction } from "../types";

export async function createWallet(
  name: string,
  bvn: string,
  role: string,
  id: string,
  _token?: string
): Promise<{ ok: boolean; admin?: Wallet; message?: string }> {
  return authFetchJson(`${API_URL}/wallet`, {
    method: "POST",
    body: JSON.stringify({ name, bvn, role, id }),
  });
}

export async function getWallet(
  id: string,
  role: "MEMBER" | "ADMIN" | "AGENT" | "COMPANY" | "STAFF",
  _token?: string
): Promise<{
  ok: boolean;
  wallet?: Wallet;
  message?: string;
  isExist?: boolean;
}> {
  return authFetchJson(`${API_URL}/wallet/${id}/${role}`);
}

export async function initiateTransfer(
  amount: string,
  accountNumber: string,
  accountName: string,
  bankCode: string,
  merchantTxRef: string,
  senderName: string,
  narration: string,
  _token?: string
) {
  return authFetchJson(`${API_URL}/wallet/transfer/initiate`, {
    method: "POST",
    body: JSON.stringify({
      amount,
      accountNumber,
      accountName,
      bankCode,
      merchantTxRef,
      senderName,
      narration,
    }),
  });
}

export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string,
  _token?: string
): Promise<{ accountName: string; accountNumber: string }> {
  return authFetchJson(`${API_URL}/wallet/resolve-bank-account`, {
    method: "POST",
    body: JSON.stringify({ accountNumber, bankCode }),
  });
}

export async function getBanks(
  _token?: string
): Promise<{
  ok: boolean;
  banks?: { code: string; data: [] };
  message?: string;
}> {
  return authFetchJson(`${API_URL}/wallet/banks`);
}

export async function getTransactions(
  accountNumber: string,
  fromDate: string,
  toDate: string,
  _token?: string
): Promise<{ ok: boolean; transactions?: Transaction[]; message?: string }> {
  return authFetchJson(`${API_URL}/wallet/transactions`, {
    method: "POST",
    body: JSON.stringify({ accountNumber, fromDate, toDate }),
  });
}
