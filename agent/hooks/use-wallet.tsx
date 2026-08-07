import { AUTH_AGENT, AUTH_AGENT_TOKEN, AUTH_AGENT_WALLET_STATE } from "@/lib/api";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { getWallet, createWallet, initiateTransfer, resolveBankAccount, getBanks, getTransactions } from "@/lib/services/wallet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Wallet } from "@/lib/types";

const walletContext = createContext<any>(null);

export const useWallet = () => {
    const context = useContext(walletContext);
    if (!context) {
        throw new Error("useWallet must be used within an WalletProvider");
    }
    return context;
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [isWallet, setIsWallet] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [uid, setUid] = useState<string | null>(null);
    const [token, setToken] = useState<string | undefined>(undefined);
    const [hide, setHide] = useState(false);

    const toggleHide = useCallback(async (toggle: boolean) => {
        // toggle === true  -> user wants the balance hidden
        // toggle === false -> user wants the balance visible
        await AsyncStorage.setItem(AUTH_AGENT_WALLET_STATE, JSON.stringify({ hidden: toggle }));
        setHide(toggle);
    }, []);

    // Get CustomerCode from session storage on initial load
    useEffect(() => {
        (async () => {
            const adminData = await AsyncStorage.getItem(AUTH_AGENT);

            if (adminData) {
                const parsedAdmin = JSON.parse(adminData);
                setUid(parsedAdmin.uid ?? null);
            } else {
                setUid(null);
            }

            const tok = await AsyncStorage.getItem(AUTH_AGENT_TOKEN);

            const rawWalletState = await AsyncStorage.getItem(AUTH_AGENT_WALLET_STATE);
            const walletState = rawWalletState ? JSON.parse(rawWalletState) : null;

            if (walletState) {
                setHide(walletState?.hidden ?? false);
            }

            if (tok) {
                setToken(tok);
            }
        })()
    }, []);

    // Fetch wallet data when customerCode is available
    const fetchWallet = useCallback(async () => {
        await Promise.resolve()
        setLoading(true);
        setError(null);
        try {
            if (!uid || !token) {
                setIsWallet(false);
                setWallet(null);
                setMessage(!uid ? "No customer code found for this account." : "Not authenticated.");
                return;
            }

            const { ok, wallet, message } = await getWallet(uid, "AGENT", token);

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

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    const refresh = useCallback(() => {
        fetchWallet();
    }, [fetchWallet]);

    const value = useMemo(() => ({
        toggleHide,
        hide,
        wallet,
        isWallet,
        loading,
        error,
        message,
        refresh,
        setUid,
        initiateTransfer,
        resolveBankAccount,
        getBanks,
        getTransactions,
        createWallet
    }), [toggleHide, hide, wallet, isWallet, loading, error, message, refresh]);

    return (
        <walletContext.Provider value={value}>{children}</walletContext.Provider>
    );
};