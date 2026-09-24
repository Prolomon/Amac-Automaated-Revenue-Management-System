import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthContextValue,
  EnumeratorUser,
  EnumeratorLevel,
  Wallet,
  DailyTaskProgress,
} from "../lib/types";
import { STORAGE_KEYS } from "../lib/api";
import {
  isTokenExpired,
  refreshAccessToken,
  saveTokens,
  clearTokens,
  onTokenRefreshed,
  onAuthFailure,
} from "../lib/auth-token";
import { enumeratorService } from "../lib/services/enumeratorService";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<EnumeratorUser | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [level, setLevel] = useState<EnumeratorLevel | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyTasks, setDailyTasks] = useState<DailyTaskProgress | null>(null);

  const loadStoredSession = async () => {
    try {
      let storedToken = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const storedWallet = await AsyncStorage.getItem(STORAGE_KEYS.WALLET);
      const storedLevel = (await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_LEVEL)) as EnumeratorLevel | null;

      if (storedToken && storedUser) {
        // Proactive token expiration check
        if (isTokenExpired(storedToken)) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            storedToken = refreshed;
          } else {
            // Token expired and refresh failed - clear session
            await clearTokens();
            setUser(null);
            setToken(null);
            setLevel(null);
            setWallet(null);
            return;
          }
        }

        setToken(storedToken);
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        if (parsedUser) {
          setUser(parsedUser);
          setLevel(storedLevel || parsedUser?.level || "BASIC");
        }
        if (storedWallet) {
          setWallet(JSON.parse(storedWallet));
        }

        // Fetch fresh profile in background
        try {
          const profileRes = await enumeratorService.getProfile();
          if (profileRes.ok && profileRes.data) {
            setUser(profileRes.data);
            if (profileRes.data.level) {
              setLevel(profileRes.data.level);
            }
            if (profileRes.data.wallet) {
              setWallet(profileRes.data.wallet);
              await AsyncStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(profileRes.data.wallet));
            }
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profileRes.data));
          }

          // Also fetch daily tasks
          const taskRes = await enumeratorService.getDailyTasks();
          if (taskRes.ok && taskRes.data) {
            setDailyTasks(taskRes.data);
          }
        } catch (err) {
          console.warn("Background session update failed:", err);
        }
      }
    } catch (e) {
      console.error("Failed to restore auth session:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoredSession();

    // Subscribe to auto-refreshed token events
    const unsubRefreshed = onTokenRefreshed((newToken) => {
      setToken(newToken);
    });

    // Subscribe to auth failures (e.g. invalid/expired refresh token)
    const unsubFailure = onAuthFailure(() => {
      logout();
    });

    return () => {
      unsubRefreshed();
      unsubFailure();
    };
  }, []);

  const login = async (
    emailOrPhone: string,
    password: string,
    requiredLevel?: EnumeratorLevel
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      console.log(requiredLevel, "requiredLevel");
      const res = await enumeratorService.login(emailOrPhone.trim(), password);

      if (!res.ok) {
        return { ok: false, message: res.message || "Invalid credentials" };
      }

      const userData: EnumeratorUser = res.user || res.data;
      if (!userData) {
        return { ok: false, message: "Invalid user account data received from server" };
      }
      const userLevel: EnumeratorLevel = userData.level || "BASIC";

      // If user signed in through Supervisor portal, verify they have SUPER level
      if (requiredLevel === "SUPER" && userLevel !== "SUPER") {
        return {
          ok: false,
          message: "Access denied: This account does not have Supervisor privileges.",
        };
      }

      const authToken = res.accessToken || res.token;
      setToken(authToken);
      setUser(userData);
      setLevel(userLevel);

      const userWallet = userData.wallet || res.wallet || (res.wallets && res.wallets[0]) || null;
      setWallet(userWallet);

      await saveTokens(authToken, res.refreshToken);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_LEVEL, userLevel);
      if (userWallet) {
        await AsyncStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(userWallet));
      }

      // Fetch task progress
      try {
        const taskRes = await enumeratorService.getDailyTasks();
        if (taskRes.ok && taskRes.data) {
          setDailyTasks(taskRes.data);
        }
      } catch (_) {}

      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err?.message || "Sign in failed" };
    }
  };

  const logout = async () => {
    setUser(null);
    setWallet(null);
    setLevel(null);
    setToken(null);
    setDailyTasks(null);

    await clearTokens();
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    await AsyncStorage.removeItem(STORAGE_KEYS.WALLET);
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_LEVEL);
  };

  const refreshProfile = async () => {
    try {
      const res = await enumeratorService.getProfile();
      if (res.ok && res.data) {
        setUser(res.data);
        if (res.data.wallet) {
          setWallet(res.data.wallet);
          await AsyncStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(res.data.wallet));
        }
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data));
      }
    } catch (err) {
      console.error("Refresh profile error:", err);
    }
  };

  const refreshDailyTasks = async () => {
    try {
      const res = await enumeratorService.getDailyTasks();
      if (res.ok && res.data) {
        setDailyTasks(res.data);
      }
    } catch (err) {
      console.error("Refresh tasks error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        level,
        token,
        loading,
        dailyTasks,
        login,
        logout,
        refreshProfile,
        refreshDailyTasks,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
