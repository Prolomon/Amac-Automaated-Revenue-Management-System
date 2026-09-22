"use client";

import Cookies from 'js-cookie'
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Company, getCompany, login as CompanyLogin } from "@/lib/services/company";
import { refreshAuthToken } from "@/lib/api";

const PartnerContext = createContext<any>(null);

export const usePartner = () => {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error("usePartner must be used within an PartnerProvider");
  }
  return context;
};

export const PartnerProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<Company | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      
      const res = await getCompany(uid);

      if (res.ok) {
        setUser(res.company);
        setIsAuthenticated(true);
        Cookies.set("amac_session", JSON.stringify(res.company), { path: "/", expires: 1 });
        setUid(res.company.uid);
        setRole(res.company.role);
        
        Cookies.set("amac_role", res.company.role, { path: "/", expires: 1 }); // 3 days
      } else {
        throw new Error(res.message || "Failed to refresh user data");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      setError(null);
      const res = await CompanyLogin(email, password);

      if (!res.ok) {
        throw new Error(res.message || "Login failed");
      }

        setUser(res.company);
        setIsAuthenticated(true);
        Cookies.set("amac_session", JSON.stringify(res.company), { path: "/", expires: 1 });
        setUid(res.company.uid);
        const accessToken = res.accessToken || res.token;
        const refreshToken = res.refreshToken;
        if (accessToken) {
          setToken(accessToken);
          Cookies.set("amac_token", accessToken, { path: "/", expires: 1 });
        }
        if (refreshToken) {
          Cookies.set("amac_refresh_token", refreshToken, { path: "/", expires: 7 });
        }
        setRole(res.role || res.company.role);
        Cookies.set("amac_role", res.company.role, { path: "/", expires: 1 });

        router.replace("/partner");
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    Cookies.remove("amac_token");
    Cookies.remove("amac_refresh_token");
    Cookies.remove("amac_role");
    Cookies.remove("amac_session");
    setUser(null);
    setIsAuthenticated(false);
    setToken(null);
    setUid(null);
    setRole(null);
    router.push("/auth/partner");
  };

  // Get company data function
  useEffect(() => {
    (async () => {
      try {
        const companyData = Cookies.get("amac_session");
        let cookieData = Cookies.get("amac_token");
        const refreshToken = Cookies.get("amac_refresh_token");
        const companyRole = Cookies.get("amac_role");

        if (companyData) {
          const parsedCompany = JSON.parse(companyData);

          if (!cookieData && refreshToken) {
            const newTok = await refreshAuthToken();
            if (newTok) {
              cookieData = newTok;
            }
          }

          setIsAuthenticated(true);
          setToken(cookieData || null);
          setUser(parsedCompany);
          setUid(parsedCompany?.uid || null);
          setRole(companyRole || parsedCompany?.role || null);
        } else {
          setIsAuthenticated(false);
          setToken(null);
          setUser(null);
          setUid(null);
          setRole(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to restore session"));
        setIsAuthenticated(false);
        setToken(null);
        setUser(null);
        setUid(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    token,
    uid,
    login,
    logout,
    refresh,
    role,
  };

  return (
    <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>
  );
};
