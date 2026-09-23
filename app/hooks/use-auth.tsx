import { API_URL } from "@/config";
import {
  AUTH_MEMBER,
  AUTH_MEMBER_PIN,
  AUTH_MEMBER_REFRESH_TOKEN,
  AUTH_MEMBER_TOKEN,
  AUTH_MEMBER_UID,
  AUTH_MEMBER_WALLET,
  AUTH_MEMBER_WALLET_STATE,
  authFetch,
  clearTokens,
  isTokenExpired,
  onAuthFailure,
  onTokenRefreshed,
  refreshAccessToken,
  saveTokens,
} from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Member } from "@/lib/types";
import { login as MemberLogin, getMember, forgetPassword, resetPassword, refreshAuthToken } from "@/lib/services/member";

type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "QUARTERLY";

export type User = {
  uid?: string;
  fullname?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  businessType?: string;
  password?: string;
  confirm?: string;
  location?: string;
  avatar?: string;
  agent: string;
  role?: "USER" | "ADMIN";
  billingFrequency?: Frequency;
  createdAt?: string;
  updatedAt?: string;
  type?: "BUSINESS" | "INDIVIDUAL";
  balance?: number;
  dueBalance?: number;
  due?: Date;
};

export type Notification = {
  title: string;
  description: string;
  date: string;
  type:
  | "UPDATE"
  | "SUCCESS"
  | "FAILED"
  | "PENDING"
  | "REQUEST"
  | "REMINDER"
  | "WELCOME";
};

export type Payment = {
  reference: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  frequency: Frequency;
  date: string;
  amount: number;
  payment: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";
  due: Date | null;
  isVerified: boolean;
};

type AuthContextValue = {
  currentUser: Member | null;
  loading: boolean;
  login: (
    uid: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  billing: (
    frequency: Frequency,
    due: Date,
  ) => Promise<{ ok: boolean; message?: string }>;
  notifications: () => Promise<Notification[]>;
  receipt: (reference: string) => Promise<Payment | any>;
  payments: () => Promise<Payment[]>;
  createPayment: (
    reference: string,
    amount: number,
    payment: string,
    status?: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED",
    due?: Date,
  ) => Promise<{ ok: boolean; message: string; payment?: any }>;
  agentList: () => Promise<any[]>;
  getBusiness: () => Promise<BusinessType[]>;
  setBalance: (
    newBalance: number,
  ) => Promise<{ ok: boolean; message?: string }>;
  setDueBalance: (
    dueBalance?: number,
  ) => Promise<{ ok: boolean; message?: string }>;
  token: string | undefined;
  createCode: (
    secureToken: string,
    confirmSecureToken: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  uid?: string;
  wallet: any;
  verifyCode: (
    secureToken: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
  refreshSession?: () => Promise<string | null>;
};

export type BusinessType = {
  id?: string;
  title: string;
  price: string;
  type: "BUSINESS" | "INDIVIDUAL";
  benefit: string;
};

const AUTH_CURRENT_KEY = "miRvAy3HC/25KEoA";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeUser(user: any): Member {
  return {
    uid: user.uid,
    fullname: user.fullname,
    businessName: user.businessName,
    center: user.center,
    email: user.email,
    phone: user.phone,
    type: user.type,
    category: user.category,
    company: user.company,
    billingFrequency: user.billingFrequency,
    password: user.password,
    location: user.location
      ? {
          state: user.location.state || "",
          city: user.location.city || "",
          address: user.location.address || "",
          zipcode: user.location.zipcode || "",
          nearestBusStop: user.location.nearestBusStop || user.uid || "",
        }
      : undefined,
    status: user.status,
    avatar: user.avatar,
    pricing: user.pricing,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    agent: user.agent,
    propertyId: user.propertyId,
    zone: user.zone,
    bvn: user.bvn,
    property: user.property || (user.properties && user.properties[0]) || null,
    properties: user.properties || (user.property ? [user.property] : []),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [uid, setUid] = useState<string | undefined>(undefined);
  const [wallet, setWallet] = useState<any>(null);

  const refreshUser = async () => {
    try {

      const res = await getMember(currentUser?.uid || "", token || "");
      const updatedUser = res?.member || res?.data || res;
      const normalized = normalizeUser(updatedUser);
      await AsyncStorage.setItem(AUTH_MEMBER, JSON.stringify(normalized));
      setCurrentUser(normalized);

    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    const unsubToken = onTokenRefreshed((newToken) => {
      setToken(newToken);
    });
    const unsubAuthFailure = onAuthFailure(() => {
      logout();
    });
    return () => {
      unsubToken();
      unsubAuthFailure();
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cur = await AsyncStorage.getItem(AUTH_MEMBER);
        if (cur) {
          setCurrentUser(normalizeUser(JSON.parse(cur)));
        }

        const wal = await AsyncStorage.getItem(AUTH_MEMBER_WALLET);
        if (wal) {
          setWallet(JSON.parse(wal));
        }
        let tok = await AsyncStorage.getItem(AUTH_MEMBER_TOKEN);
        const refTok = await AsyncStorage.getItem(AUTH_MEMBER_REFRESH_TOKEN);

        // Auto-refresh access token if missing or expired
        if ((!tok || isTokenExpired(tok)) && refTok) {
          try {
            const newAccess = await refreshAccessToken();
            if (newAccess) {
              tok = newAccess;
            }
          } catch (_) {
            // refresh token expired or failed
          }
        }

        if (tok) {
          setToken(tok);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshSession = async (): Promise<string | null> => {
    try {
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        setToken(newAccess);
      }
      return newAccess;
    } catch (err) {
      console.error("Session refresh failed:", err);
      return null;
    }
  };

  const login = async (uid: string, password: string) => {
    try {
      await clearTokens();
      await AsyncStorage.removeItem(AUTH_MEMBER);
      await AsyncStorage.removeItem(AUTH_MEMBER_WALLET);
      await AsyncStorage.removeItem(AUTH_MEMBER_WALLET_STATE);

      const response = await MemberLogin(uid, password);

      const normalized = normalizeUser(response.member || {});
      const accessToken = response.accessToken || response.token || "";
      const refreshToken = response.refreshToken || "";

      await AsyncStorage.setItem(AUTH_MEMBER, JSON.stringify(normalized));
      await saveTokens(accessToken, refreshToken);
      await AsyncStorage.setItem(AUTH_MEMBER_UID, response?.uid || normalized.uid || "");
      setToken(accessToken);
      setUid(response?.uid || normalized.uid || "");

      setCurrentUser(normalized);

      return { ok: true, message: response.message || "Login successful" };

    } catch (e: any) {
      return { ok: false, error: e?.message || e?.error || "Login failed" };
    }
  };

  const logout = async () => {
    await clearTokens();
    await AsyncStorage.removeItem(AUTH_MEMBER);
    await AsyncStorage.removeItem(AUTH_MEMBER_WALLET);
    await AsyncStorage.removeItem(AUTH_MEMBER_WALLET_STATE);
    await AsyncStorage.removeItem(AUTH_MEMBER_UID);
    await AsyncStorage.removeItem(AUTH_MEMBER_PIN);
    setToken(undefined);
    setUid(undefined);
    setWallet(null);
    setCurrentUser(null);
  }; 

  const billing = async (frequency: Frequency, due: Date) => {
    try {
      if (!currentUser) return { ok: false, message: "Not authenticated" };
      if (!currentUser.uid) return { ok: false, message: "User ID not found" };

      const response = await authFetch(
        `/member/${currentUser.uid}/billing-frequency`,
        {
          method: "PATCH",
          body: JSON.stringify({ frequency: frequency.toUpperCase(), due }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return { ok: false, message: error.message || "Billing update failed" };
      }

      const updatedUser = await response.json();
      const normalized = normalizeUser(updatedUser?.member || {});
      await AsyncStorage.setItem(AUTH_CURRENT_KEY, JSON.stringify(normalized));
      setCurrentUser(normalized);
      return { ok: true, message: "Billing frequency updated successfully" };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Billing update failed" };
    }
  };

  const notifications = async (): Promise<Notification[]> => {
    try {
      if (!currentUser) return [];
      if (!currentUser.uid) return [];

      const response = await authFetch(
        `/notification/${currentUser.uid}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.notifications || [];
    } catch (e) {
      return [];
    }
  };

  const receipt = async (reference: string) => {
    try {
      if (!currentUser) return {};
      if (!currentUser.uid) return {};

      const response = await authFetch(
        `/payment/reference/${reference}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        return {};
      }

      const data = await response.json();
      return data.payment || {};
    } catch (e) {
      return {};
    }
  };

  const payments = async (): Promise<Payment[]> => {
    try {
      if (!currentUser) return [];
      if (!currentUser.uid) return [];

      const response = await authFetch(
        `/payment/user/${currentUser.uid}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.payments || [];
    } catch (e) {
      return [];
    }
  };

  const createPayment = async (
    reference: string,
    amount: number,
    payment: string,
    status?: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED",
    due?: Date,
  ) => {
    try {
      if (!currentUser) return { ok: false, message: "Not authenticated" };
      if (!currentUser.uid) return { ok: false, message: "User ID not found" };

      const response = await authFetch(`/payment`, {
        method: "POST",
        body: JSON.stringify({
          reference: reference,
          userId: currentUser.uid,
          businessName: currentUser.businessName || "",
          frequency: currentUser.billingFrequency || "MONTHLY",
          amount: amount,
          payment: payment,
          status: status?.toUpperCase() || "PENDING",
          due: due ? due.toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          ok: false,
          message: error.message || "Payment creation failed",
        };
      }

      const data = await response.json();
      return {
        ok: true,
        message: data.message || "Payment created successfully",
        payment: data.payment,
      };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Payment creation failed" };
    }
  };

  const agentList = async () => {
    try {
      const response = await authFetch(`/agent/list`, {
        method: "GET",
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data || data.agents || [];
    } catch (e) {
      return [];
    }
  };

  const getBusiness = async () => {
    try {
      const response = await authFetch(`/pricing`, {
        method: "GET",
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (e) {
      return [];
    }
  };

  const setBalance = async (newBalance: number) => {
    try {
      if (!currentUser) return { ok: false, message: "Not authenticated" };
      if (!currentUser.uid) return { ok: false, message: "User ID not found" };

      const response = await authFetch(
        `/member/${currentUser.uid}/balance`,
        {
          method: "PATCH",
          body: JSON.stringify({ balance: newBalance }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return { ok: false, message: error.message || "Balance update failed" };
      }

      const updatedUser = await response.json();
      const normalized = normalizeUser(updatedUser?.member || {});
      await AsyncStorage.setItem(AUTH_CURRENT_KEY, JSON.stringify(normalized));
      setCurrentUser(normalized);
      return { ok: true, message: "Balance updated successfully" };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Balance update failed" };
    }
  };

  const setDueBalance = async (dueBalance?: number) => {
    try {
      if (!currentUser) return { ok: false, message: "Not authenticated" };
      if (!currentUser.uid) return { ok: false, message: "User ID not found" };

      const response = await authFetch(
        `/member/${currentUser.uid}/due-balance`,
        {
          method: "PATCH",
          body: JSON.stringify({ dueBalance: dueBalance }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return { ok: false, message: error.message || "Balance update failed" };
      }

      const updatedUser = await response.json();
      const normalized = normalizeUser(updatedUser?.member || {});
      await AsyncStorage.setItem(AUTH_CURRENT_KEY, JSON.stringify(normalized));
      setCurrentUser(normalized);
      return { ok: true, message: "Balance updated successfully" };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Balance update failed" };
    }
  };

  const createCode = async (secureToken: string, confirmSecureToken: string): Promise<{ok: boolean, message: string}> => {

    try {

      if (secureToken !== confirmSecureToken) {
        return { ok: false, message: "Security codes do not match" };
      }

      await AsyncStorage.setItem(AUTH_MEMBER_PIN, secureToken);

      return { ok: true, message: "Security code created successfully" };

    } catch (error: any) {
      return { ok: false, message: "An error occurred while creating the security code" };
    }

  }

  const verifyCode = async (secureToken: string): Promise<{ok: boolean, message: string}> => {

    try {

      const response = await AsyncStorage.getItem(AUTH_MEMBER_PIN);

      if (!response) {
        return { ok: false, message: "Security code not found" };
      }

      if (response !== secureToken) {
        return { ok: false, message: "Security code does not match" };
      }

      return { ok: true, message:  "Security code verified successfully" };

    } catch (error: any) {
      return { ok: false, message: "An error occurred while verifying the security code" };
    }

  }

  const value: AuthContextValue = {
    currentUser,
    loading,
    login,
    logout,
    billing,
    notifications,
    receipt,
    payments,
    createPayment,
    agentList,
    getBusiness,
    setBalance,
    setDueBalance,
    token,
    createCode,
    uid,
    wallet,
    verifyCode,
    refreshUser,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
