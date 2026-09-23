import { API_URL, authFetchJson } from "../api";
import { Payment, PaymentTransaction } from "../types";

export async function getPayments(
  uid: string,
  _token?: string
): Promise<{ ok: boolean; payments?: Payment[]; message?: string }> {
  if (!uid) {
    throw new Error("No user ID found");
  }
  return authFetchJson(`${API_URL}/payment/user/${uid}`);
}

export async function verifyPayment(
  reference: string,
  _token?: string
): Promise<{
  ok: boolean;
  payment?: any;
  message?: string;
}> {
  if (!reference) {
    throw new Error("No payment reference provided");
  }
  return authFetchJson(`${API_URL}/payment/verify/${reference}`);
}

export async function getPayment(
  reference: string,
  _token?: string
): Promise<{
  ok: boolean;
  payment?: any;
  message?: string;
}> {
  if (!reference) {
    throw new Error("No payment reference provided");
  }
  return authFetchJson(`${API_URL}/payment/reference/${reference}`);
}

export async function schedulePayment(
  userId: string,
  frequency: string,
  amount: number,
  due: Date,
  _token?: string
): Promise<{
  ok: boolean;
  payment?: any;
  message?: string;
}> {
  if (!userId) {
    throw new Error("No user ID provided");
  }
  return authFetchJson(`${API_URL}/payment/schedule/${userId}`, {
    method: "POST",
    body: JSON.stringify({
      userId,
      frequency,
      amount,
      due,
    }),
  });
}

export async function makePayment(
  userId: string,
  amount: number,
  paymentId: string,
  center: string,
  company: string,
  _token?: string
): Promise<{
  ok: boolean;
  payment?: any;
  message?: string;
}> {
  if (!userId) {
    throw new Error("No user ID provided");
  }
  return authFetchJson(`${API_URL}/payment/make/${userId}/${paymentId}`, {
    method: "POST",
    body: JSON.stringify({ amount, center, company }),
  });
}

export async function getRecords(
  uid: string,
  _token?: string
): Promise<{ ok: boolean; transactions?: PaymentTransaction[]; message?: string }> {
  if (!uid) {
    throw new Error("No user ID found");
  }
  return authFetchJson(`${API_URL}/payment-transaction/user/member/${uid}`);
}

export async function getRecord(
  id: string,
  _token?: string
): Promise<{ ok: boolean; transaction?: PaymentTransaction; message?: string }> {
  if (!id) {
    throw new Error("No record ID found");
  }
  return authFetchJson(`${API_URL}/payment-transaction/reference/${id}`);
}