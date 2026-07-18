"use client";

import Cookies from 'js-cookie'
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login as userLogin, getAdmin } from "@/lib/services/admin";
import { Admin } from "@/lib/services/admin";
import { Staff, getStaff, loginStaff } from "@/lib/services/staff";

const AuthContext = createContext<any>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
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
      let res;

      if (role === "ADMIN") {
        res = await getAdmin(uid);

        if (res.ok) {
          setAdmin(res.admin);
          setIsAuthenticated(true);
          sessionStorage.setItem("amac_session", JSON.stringify(res.admin));
          setUid(res.admin.uid);
          setToken(res.token);
          setRole(res.admin.role);

          Cookies.set("amac_token", res.token, { path: "/", expires: 3 }); // 3 days
          Cookies.set("amac_role", res.admin.role, { path: "/", expires: 3 }); // 3 days
        } else {
          throw new Error(res.message || "Failed to refresh user data");
        }
      } else {
        res = await getStaff(uid);

        if (res.ok) {
          setStaff(res.staff);
          setIsAuthenticated(true);
          sessionStorage.setItem("amac_session", JSON.stringify(res.staff));
          setUid(res.staff.uid);
          setToken(res.token);
          setRole(res.role || res.staff.role);
          Cookies.set("amac_token", res.token, { path: "/", expires: 3 }); // 3 days
          Cookies.set("amac_role", res.role || res.staff.role, { path: "/", expires: 3 }); // 3 days
        } else {
          throw new Error(res.message || "Failed to refresh user data");
        }
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // Login function
  const login = async (email: string, password: string, role: string) => {
    setLoading(true);
    try {
      setError(null);

      const res = await userLogin(email, password);

      if (!res.ok) {
        throw new Error(res.message || "Login failed");
      }

      setAdmin(res.admin);
      setIsAuthenticated(true);
      sessionStorage.setItem("amac_session", JSON.stringify(res.admin));
      setUid(res.admin.uid);
      setToken(res.token);
      setRole(res.role || res.admin.role);
      Cookies.set("amac_token", res.token, { path: "/", expires: 3 }); // 3 days
      Cookies.set("amac_role", res.admin.role, { path: "/", expires: 3 }); // 3 days

      router.replace("/admin");
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = (route: string) => {
    Cookies.remove("amac_token");
    Cookies.remove("amac_role");
    localStorage.removeItem("loggedIn");
    sessionStorage.removeItem("urms_session");
    setAdmin(null);
    setStaff(null);
    setIsAuthenticated(false);
    setToken(null);
    setUid(null);
    setRole(null);
    router.push(`/auth/${route}`);
  };

  // Get admin data function
  useEffect(() => {
    try {
      const adminData = sessionStorage.getItem("urms_session");
      const cookieData = Cookies.get("amac_token");

      if (adminData) {
        const parsedAdmin = JSON.parse(adminData);
        setIsAuthenticated(true);
        setToken(cookieData ? cookieData.split("=")[1] : null);
        setAdmin(parsedAdmin);
        setUid(parsedAdmin?.uid || null);
        setRole(parsedAdmin?.role || null);
      } else {
        setIsAuthenticated(false);
        setToken(null);
        setAdmin(null);
        setUid(null);
        setRole(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to restore session"));
      setIsAuthenticated(false);
      setToken(null);
      setAdmin(null);
      setUid(null);
    } finally {
      setLoading(false);
    }
  }, []);


  const value = {
    user: role === "ADMIN" ? admin : staff,
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
