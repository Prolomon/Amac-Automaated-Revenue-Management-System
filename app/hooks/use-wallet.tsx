"use client";
import { AUTH_MEMBER, AUTH_MEMBER_TOKEN, AUTH_MEMBER_PIN, AUTH_MEMBER_WALLET_STATE } from "@/lib/api";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getWallet, createWallet, initiateTransfer, resolveBankAccount, getBanks } from "@/lib/services/wallet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Wallet } from "@/lib/types";
import { getTransactions, getTransaction } from "@/lib/services/transaction";
import { useAuth } from "@/hooks/use-auth";

const walletContext = createContext<any>(null);

export const useWallet = () => {
    const context = useContext(walletContext);
    if (!context) {
        throw new Error("useWallet must be used within an WalletProvider");
    }
    return context;
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const { currentUser, token: authUserToken } = useAuth();
    const [localUid, setLocalUid] = useState<string | null>(null);
    const [localToken, setLocalToken] = useState<string | undefined>(undefined);

    const uid = currentUser?.uid || localUid;
    const token = authUserToken || localToken;

    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [isWallet, setIsWallet] = useState<boolean>(true);
    const [loading, setLoading] = useState(true);
    const [pin, setPin] = useState<string>("");
    const [error, setError] = useState<Error | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [hide, setHide] = useState(false);

    const setUid = (newUid: string | null) => {
        setLocalUid(newUid);
    };

    useEffect(() => {
        (async () => {
            const code = await AsyncStorage.getItem(AUTH_MEMBER_PIN);
            if (code) {
                setPin(code);
            }
        })();
    }, []);

    const toggleHide = async (toggle: boolean) => {
        setHide(toggle);
        try {
            await AsyncStorage.setItem(AUTH_MEMBER_WALLET_STATE, JSON.stringify(toggle));
        } catch (e) {
            // ignore
        }
    };

    // Load initial data from AsyncStorage
    useEffect(() => {
        (async () => {
            try {
                const adminData = await AsyncStorage.getItem(AUTH_MEMBER);
                if (adminData) {
                    const parsedAdmin = JSON.parse(adminData);
                    setLocalUid(parsedAdmin.uid ?? null);
                }

                const tok = await AsyncStorage.getItem(AUTH_MEMBER_TOKEN);
                if (tok) {
                    setLocalToken(tok);
                }

                const savedState = await AsyncStorage.getItem(AUTH_MEMBER_WALLET_STATE);
                if (savedState !== null) {
                    setHide(JSON.parse(savedState));
                }
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    // Fetch wallet data when customerCode is available
    const fetchWallet = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!uid) {
                setIsWallet(false);
                setWallet(null);
                setMessage("No customer code found for this account.");
                return;
            }

            const { ok, wallet, message } = await getWallet(uid, "MEMBER", token as string);

            if (ok && wallet) {
                setIsWallet(true);
                setWallet(wallet);
            } else {
                setIsWallet(false);
                setWallet(null);
            }

            setMessage(message || null);

        } catch (error) {
            setIsWallet(false);
            setError(error instanceof Error ? error : new Error("Unknown error"));
        } finally {
            setLoading(false);
        }

    }, [token, uid]);

    // Handle uid changes and trigger refetch or reset
    useEffect(() => {
        if (!uid) {
            setWallet(null);
            setIsWallet(true); // Default to true when logged out so next login doesn't immediately redirect
            setLoading(false);
        } else {
            fetchWallet();
        }
    }, [uid, fetchWallet]);

    const refresh = useCallback(async () => {
        await fetchWallet();
    }, [fetchWallet]);

    const value = {
        toggleHide,
        hide,
        wallet,
        isWallet,
        loading,
        pin,
        error,
        message,
        refresh,
        setUid,
        initiateTransfer,
        resolveBankAccount,
        getBanks,
        getTransactions,
        getTransaction,
        createWallet,
    };

    return (
        <walletContext.Provider value={value}>{children}</walletContext.Provider>
    );
};
