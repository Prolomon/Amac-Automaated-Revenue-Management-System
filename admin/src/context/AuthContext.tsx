"use client";

import Cookies from "js-cookie";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login as userLogin, getAdmin } from "@/lib/services/admin";
import { Admin } from "@/lib/services/admin";
import { Staff, getStaff, loginStaff } from "@/lib/services/staff";
import {
  refreshAuthToken,
  isTokenExpired,
  getValidAccessToken,
  clearAuthTokens,
  setAuthTokens,
} from "@/lib/api";

const AuthContext = createContext<any>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      await getValidAccessToken();

      if (role === "staff" && uid) {
        const res = await getStaff(uid);

        if (res.ok) {
          setStaff(res.staff);
          setIsAuthenticated(true);
          Cookies.set("amac_session", JSON.stringify(res.staff), { path: "/", expires: 1 });
          setUid(res.staff.uid);
          setRole(res.staff.role);
          Cookies.set("amac_role", res.staff.role, { path: "/", expires: 1 });
        } else {
          throw new Error(res.message || "Failed to refresh user data");
        }

        return;
      }

      if (uid) {
        const res = await getAdmin(uid);

        if (res.ok) {
          setAdmin(res.admin);
          setIsAuthenticated(true);
          Cookies.set("amac_session", JSON.stringify(res.admin), { path: "/", expires: 1 });
          setUid(res.admin.uid);
          setRole(res.admin.role);
          Cookies.set("amac_role", res.admin.role, { path: "/", expires: 1 });
        } else {
          throw new Error(res.message || "Failed to refresh user data");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to refresh user data");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string, roleParam: string) => {
    setLoading(true);
    try {
      setError(null);

      if (roleParam === "staff") {
        const res = await loginStaff(email, password);
        if (!res.ok) {
          throw new Error(res.message || "Login failed");
        }
        setStaff(res.staff);
        setIsAuthenticated(true);
        Cookies.set("amac_session", JSON.stringify(res.staff), { path: "/", expires: 1 });
        Cookies.set("amac_uid", res.staff.uid, { path: "/", expires: 1 });
        setUid(res.staff.uid);
        const accessToken = res.accessToken || res.token;
        const refreshToken = res.refreshToken;
        if (accessToken) {
          setToken(accessToken);
        }
        if (accessToken || refreshToken) {
          setAuthTokens(accessToken, refreshToken);
        }
        setRole(res.role || res.staff.role);
        Cookies.set("amac_role", res.staff.role, { path: "/", expires: 1 });

        router.replace("/admin");
        return;
      }

      const res = await userLogin(email, password);

      if (!res.ok) {
        throw new Error(res.message || "Login failed");
      }

      setAdmin(res.admin);
      setIsAuthenticated(true);
      Cookies.set("amac_session", JSON.stringify(res.admin), { path: "/", expires: 1 });
      Cookies.set("amac_uid", res.admin.uid, { path: "/", expires: 1 });
      setUid(res.admin.uid);
      const accessToken = res.accessToken || res.token;
      const refreshToken = res.refreshToken;
      if (accessToken) {
        setToken(accessToken);
      }
      if (accessToken || refreshToken) {
        setAuthTokens(accessToken, refreshToken);
      }
      setRole(res.role || res.admin.role);
      Cookies.set("amac_role", res.admin.role, { path: "/", expires: 1 });

      if (res.admin.role === "IT" || res.role === "IT") {
        router.replace("/it");
        return;
      }

      router.replace("/admin");
    } catch (err: any) {
      setError(err?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = (_route?: string) => {
    clearAuthTokens();
    setAdmin(null);
    setStaff(null);
    setIsAuthenticated(false);
    setToken(null);
    setUid(null);
    setRole(null);
    router.push(`/auth/admin`);
  };

  // Restore and maintain authenticated session
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const adminData = Cookies.get("amac_session");
        let cookieData = Cookies.get("amac_token");
        const refreshToken = Cookies.get("amac_refresh_token");
        const adminRole = Cookies.get("amac_role");

        if (adminData) {
          const parsedAdmin = JSON.parse(adminData);

          // Proactively refresh access token if it's missing or expired
          if ((!cookieData || isTokenExpired(cookieData)) && refreshToken) {
            const newTok = await refreshAuthToken();
            if (newTok) {
              cookieData = newTok;
            }
          }

          if (isMounted) {
            setIsAuthenticated(true);
            setToken(cookieData || null);
            setAdmin(parsedAdmin);
            setUid(parsedAdmin?.uid || null);
            setRole(adminRole || parsedAdmin?.role || null);
          }
        } else {
          if (isMounted) {
            setIsAuthenticated(false);
            setToken(null);
            setAdmin(null);
            setUid(null);
            setRole(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to restore session"));
          setIsAuthenticated(false);
          setToken(null);
          setAdmin(null);
          setUid(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    // Listen for background token refreshes to keep state synchronized
    const handleTokenRefreshed = (e: any) => {
      if (e?.detail?.token && isMounted) {
        setToken(e.detail.token);
      }
    };

    // Listen for session expiry to clear state and redirect to login
    const handleSessionExpired = () => {
      if (isMounted) {
        setAdmin(null);
        setStaff(null);
        setIsAuthenticated(false);
        setToken(null);
        setUid(null);
        setRole(null);
        router.push("/auth/admin");
      }
    };

    window.addEventListener("amac_token_refreshed", handleTokenRefreshed);
    window.addEventListener("amac_session_expired", handleSessionExpired);

    return () => {
      isMounted = false;
      window.removeEventListener("amac_token_refreshed", handleTokenRefreshed);
      window.removeEventListener("amac_session_expired", handleSessionExpired);
    };
  }, [router]);

  const value = {
    user: admin || staff,
    admin,
    staff,
    isAuthenticated,
    loading,
    error,
    token,
    uid,
    role,
    login,
    logout,
    refresh,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
