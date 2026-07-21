import { API_URL, buildHeaders } from "../api";
import { Pricing } from "./pricing";
import { TransactionStatus } from "./wallet";
import { Member } from "./member";

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "QUARTERLY";

export type Payment = {
  id?: string;
  reference: string;
  userId: string;
  frequency: Frequency;
  date: string;
  amount: number;
  payment: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";
  due: Date | null;
  member?: Member;
  isVerified: boolean;
  pricing: Pricing;
  sessions:     string[];
  debt: number;      
  createdAt?: Date;
  updatedAt?: Date;
  center?: string;
  company?: string;
};

export type PaymentTransaction = {
  id: string;
  reference: string;
  userId: string;
  pricingId: string;
  companyId: string;
  centerId: string
  amount: string;
  agentId?: string | null;
  currency: string
  paymentId: string;
  date: Date;
  type: string;
  category: string
  name: string;
  billing: string;
  status: TransactionStatus;
  metadata: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getPayments(centerId: string): Promise<{ ok: boolean; payments?: Payment[]; message?: string }> {
  const response = await fetch(`${API_URL}/payment/center/${centerId}`, {
    headers: { ...buildHeaders() },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function getAllPayments(page: number, limit: number): Promise<{ ok: boolean; payments?: Payment[]; message?: string, meta: {
        page: number,
        limit: number,
        total: number,
        totalPages: number,
      }, }> {
  const response = await fetch(`${API_URL}/payment?page=${page}&limit=${limit}`, {
    headers: { ...buildHeaders() },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function getPaymentsByUser(userId: string): Promise<{ ok: boolean; payments?: Payment[]; message?: string }> {
  const response = await fetch(`${API_URL}/payment/user/${userId}`, {
    headers: {...buildHeaders()},
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function getPaymentsByPartner(partnerId: string): Promise<{ ok: boolean; payments?: Payment[]; message?: string }> {
  const response = await fetch(`${API_URL}/payment/partner/${partnerId}`, {
    headers: { ...buildHeaders() },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function getRecords(id: string, fromDate?: string, toDate?: string, query?: string): Promise<{ok: boolean;transactions?: PaymentTransaction[]; message?: string}> { 
    if (!id) {
        throw new Error("No user ID found");
    }
    const params = new URLSearchParams();

    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    if (query) params.set("query", query);

    const queryString = params.toString();
    const response = await fetch(`${API_URL}/payment-transaction/user/company/${id}${queryString ? `?${queryString}` : ""}`, {
        headers: {...buildHeaders()},
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch payments");
    }
    return data;
}

export async function getRecord(id: string): Promise<{ok: boolean; transaction?: PaymentTransaction; message?: string}> { 
    if (!id) {
        throw new Error("No record ID found");
    }
    const response = await fetch(`${API_URL}/payment-transaction/reference/${id}`, {
        headers: {...buildHeaders()},
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch payment");
    }
    return data;
}

export const getTransactions = async (page: number, limit: number, centerId: string) => {
    const response = await fetch(`${API_URL}/payment-transaction/?page=${page}&limit=${limit}&centerId=${centerId}`, {
        headers: {...buildHeaders()},
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch transactions");
    }
    return data;
}

export async function verifyPayment(userId: string): Promise<{ ok: boolean; message?: string, payment: Payment }> {
  const response = await fetch(`${API_URL}/payment/verify/${userId}`, {
    method: "GET"
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to verify payment");
  }

  return data;
}