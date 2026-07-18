"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    Clock3,
    Download,
    Edit2,
    Filter,
    Loader2,
    Search,
    Wallet,
    X,
    XCircle,
} from "lucide-react";
import withAuth from "@/components/withAuth";
import Link from "next/link";
type WalletTransactionStatus = "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";
type WalletTransactionType = "credit" | "debit";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { Transaction, getBanks, updateWallet } from "@/lib/services/wallet";
import { useToast } from "@/context/ToastContext";
import { createPayout } from "@/lib/services/payout";

function WalletPage() {
    const router = useRouter();
    const [load, setLoad] = useState(false);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [pageLoading, setPageLoading] = useState(true);
    const { user, role } = useAuth();
    const { wallet, loading, error, message, refresh, setUid, getTransactions, resolveBankAccount } = useWallet();
    const { addToast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [fromDate, setFromDate] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

    useEffect(() => {
        if (error || message) {
             addToast(error ? "error" : "success", message)
        } 
    }, [addToast, error, message]);

    // Create wallet form state (bank details style)
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createAccountNo, setCreateAccountNo] = useState("");
    const [createBankCode, setCreateBankCode] = useState("");
    const [createAccountName, setCreateAccountName] = useState("");
    const [createLoading, setCreateLoading] = useState(false);
    const [createValidationError, setCreateValidationError] = useState<string | null>(null);
    const [bankList, setBankList] = useState<{ code: string; logo: string; name: string; nipCode: null }[]>([]);

    // Edit bank details form state
    const [isEditing, setIsEditing] = useState(false);
    const [editAccountNo, setEditAccountNo] = useState("");
    const [editBankCode, setEditBankCode] = useState("");
    const [editAccountName, setEditAccountName] = useState("");
    const [editLoading, setEditLoading] = useState(false);
    const [editValidationError, setEditValidationError] = useState<string | null>(null);
    const centerId = role === "ADMIN" ? user?.uid : user?.center;

    if (role !== "ADMIN" && user?.permission?.canViewWallet !== true) {
        router.push("/admin");
    }

    // Fetch banks
    const fetchBanks = useCallback(async () => {
        try {
            const data = await getBanks();
            if (data.ok && data.banks) {
                setBankList(data.banks?.data);
            }
        } catch (e) {
            addToast("error", "Failed to fetch banks");
        }
    }, [addToast]);

    useEffect(() => {
        fetchBanks();
    }, [fetchBanks]);

    useEffect(() => {
        // Wait until wallet state is determined (loading must be false)
        if (loading) return;

        if (!wallet && !showCreateForm) {
            setPageLoading(false);
            return;
        }

        if (wallet) {
            setPageLoading(false);
        }
    }, [wallet, loading, showCreateForm]);

    // Resolve account name for create form
    const fetchCreateAccountName = useCallback(
        async (accountNumber: string, bankCode: string) => {
            try {
                const resolve = await resolveBankAccount(accountNumber, bankCode);
                const accountName = resolve?.data?.accountName || "";
                if (accountName) {
                    setCreateAccountName(accountName);
                    addToast("success", "Account name resolved successfully.");
                } else {
                    addToast("error", "Account name not found. Please verify the account details.");
                }
            } catch (err) {
                addToast("error", "Failed to resolve bank account. Please try again.");
            }
        },
        [addToast, resolveBankAccount]
    );

    useEffect(() => {
        if (!createBankCode || !createAccountNo || createAccountNo.length < 10) {
            return;
        }
        fetchCreateAccountName(createAccountNo, createBankCode);
    }, [fetchCreateAccountName, createAccountNo, createBankCode]);

    // Resolve account name for edit form
    const fetchEditAccountName = useCallback(
        async (accountNumber: string, bankCode: string) => {
            try {
                const resolve = await resolveBankAccount(accountNumber, bankCode);
                const accountName = resolve?.data?.accountName || "";
                if (accountName) {
                    setEditAccountName(accountName);
                    addToast("success", "Account name resolved successfully.");
                } else {
                    addToast("error", "Account name not found. Please verify the account details.");
                }
            } catch (err) {
                addToast("error", "Failed to resolve bank account. Please try again.");
            }
        },
        [addToast, resolveBankAccount]
    );

    useEffect(() => {
        if (!editBankCode || !editAccountNo || editAccountNo.length < 10) {
            return;
        }
        fetchEditAccountName(editAccountNo, editBankCode);
    }, [fetchEditAccountName, editAccountNo, editBankCode]);

    const fetChTransactions = useCallback(async () => {
        setLoad(true);
        if (wallet) {
            try {
                const res = await getTransactions(centerId, 1, 100, fromDate, toDate, query, typeFilter, statusFilter);

                if (res.transactions) {
                    setTransactions(res.transactions);
                } else {
                    setTransactions([]);
                }
            } catch (error) {
                addToast("error", "Failed to fetch transactions. Please try again.");
                setTransactions([]);
            } finally {
                setLoad(false);
            }
        }
    }, [wallet, getTransactions, centerId, fromDate, toDate, query, typeFilter, statusFilter, addToast]);

    useEffect(() => {
        fetChTransactions();
    }, [fetChTransactions]);

    useEffect(() => {
        setUid(user?.uid || null);
    }, [setUid, user?.uid]);

    // Handle create wallet (with bank details)
    const handleCreateWallet = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);

        try {
            if (!createAccountName) {
                addToast("error", "Please verify the account details first.");
                return;
            }
            if (!createAccountNo) {
                addToast("error", "Account number is required.");
                return;
            }
            if (!createBankCode) {
                addToast("error", "Bank is required.");
                return;
            }

            const selectedBank = bankList.find((b) => b.code === createBankCode);
            const result = await createPayout(
                centerId,
                createAccountNo,
                createAccountName,
                createBankCode,
                selectedBank?.name || "",
                "ADMIN"
            );

            if (result && result.ok) {
                refresh();
                addToast("success", "Wallet created successfully!");
            } else {
                refresh();
                addToast("error", result?.message || "Failed to create wallet. Please try again.");
            }
        } catch (e: any) {
            addToast("error", e?.message || "Failed to create wallet. Please try again.");
        } finally {
            setCreateLoading(false);
        }
    };

    // Handle update bank details
    const handleUpdateBank = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!wallet?.id) return;
        setEditLoading(true);

        try {
            if (!editAccountName) {
                addToast("error", "Please verify the account details first.");
                return;
            }

            const selectedBank = bankList.find((b) => b.code === editBankCode);
            const result = await updateWallet(centerId, editAccountNo, editAccountName, editBankCode, selectedBank?.name || "", "ADMIN");

            if (result && result.ok) {
                setIsEditing(false);
                refresh();
                addToast("success", "Bank details updated successfully!");
            } else {
                addToast("error", "Failed to update bank details.");
            }
        } catch (e: any) {
            addToast("error", e?.message || "Failed to update bank details.");
        } finally {
            setEditLoading(false);
        }
    };

    const handleStartEdit = () => {
        setEditAccountNo(wallet?.accountNo || "");
        setEditBankCode(wallet?.bank?.code || "");
        setEditAccountName(wallet?.accountName || "");
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setEditAccountNo(wallet?.accountNo || "");
        setEditBankCode(wallet?.bank?.code || "");
        setEditAccountName(wallet?.accountName || "");
        setIsEditing(false);
    };

    //this id for the bank details
    const bankDetails = {
        bankName: wallet?.bank?.name || "Not available",
        accountName: wallet?.accountName || user?.center || "Not available",
        accountNumber: wallet?.accountNo || "Not available",
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(value);
    };

    // This is for the balance calculations, we can connect this to the backend later
    const balances = useMemo(() => {

        const walletBalance = Number(wallet?.balance ?? 0);
        const available = Number.isFinite(walletBalance) ? walletBalance : 0;
        const ledger = available;

        return {
            available,
            ledger,
            pendingDebits: 0,
            totalInflow: 0,
            totalOutflow: 0,
        };
    }, [wallet?.balance]);

    // This is the function to handle copying account details to clipboard
    const handleCopyAccountDetails = async () => {
        const text = `${bankDetails.bankName}\n${bankDetails.accountName}\n${bankDetails.accountNumber}`;

        try {
            if (navigator?.clipboard) {
                await navigator.clipboard.writeText(text);
                addToast("success", "Account details copied to clipboard");
                return;
            }

            addToast("error", "Copy is not supported in this browser");
        } catch {
            addToast("error", "Unable to copy account details");
        }
    };

    // This is to refresh wallet data after creating wallet or when the page loads
    const statusBadge = (status: any) => {
        const statusStr = String(status || "").toUpperCase();
        if (statusStr === "SUCCESS" || statusStr === "1") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Success
                </span>
            );
        }

        if (statusStr === "PENDING" || statusStr === "0") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    Pending
                </span>
            );
        }

        if (statusStr === "REFUNDED" || statusStr === "3") {
            return (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    Refunded
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                <XCircle className="h-3.5 w-3.5" />
                Failed
            </span>
        );
    };

    if (pageLoading) {
        return (
            <div className="mx-auto max-w-7xl p-4 md:p-6">
                <div className="flex items-center justify-center min-h-100">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Wallet className="h-5 w-5 animate-pulse" />
                        <span>Loading wallet...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Show create wallet form when wallet doesn't exist
    if (!wallet && !showCreateForm) {
        return (
            <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4 md:space-y-5">
                <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 ring-1 ring-emerald-100 p-5 md:p-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="rounded-full bg-emerald-100 p-4">
                            <Wallet className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">No Wallet Found</h1>
                            <p className="mt-1 text-sm text-slate-600">
                                You don&apos;t have a wallet yet. Create one to start receiving payments and managing funds.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowCreateForm(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                        >
                            <Wallet className="h-4 w-4" />
                            Create Wallet
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Create wallet form (bank details style - like payout create)
    if (showCreateForm) {
        return (
            <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4 md:space-y-5">
                <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 ring-1 ring-emerald-100 p-5 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Create Wallet</h1>
                            <p className="mt-1 text-sm text-slate-600">
                                Set up your wallet by providing your bank account details.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-slate-200 text-sm text-slate-600">
                            <Wallet className="h-4 w-4 text-emerald-600" />
                            Secure wallet mode
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm md:p-6">
                    {createValidationError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{createValidationError}</p>
                        </div>
                    )}

                    <form onSubmit={handleCreateWallet} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    value={createAccountNo}
                                    onChange={(e) => setCreateAccountNo(e.target.value)}
                                    placeholder="e.g., 1234567890"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Bank Name
                                </label>
                                <select
                                    value={createBankCode}
                                    onChange={(e) => setCreateBankCode(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 appearance-none"
                                >
                                    <option value="">Select bank</option>
                                    {bankList.map((bank) => (
                                        <option key={bank.code} value={bank.code}>
                                            {bank.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Account Name
                            </label>
                            <input
                                type="text"
                                value={createAccountName}
                                readOnly
                                placeholder="Will auto-fill after account verification"
                                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 outline-none"
                            />
                            {createAccountName && (
                                <p className="mt-1 text-xs text-emerald-700">
                                    Account verified.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                disabled={createLoading}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createLoading}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                            >
                                {createLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {createLoading ? "Creating..." : "Create Wallet"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // Main wallet dashboard (wallet exists)
    return (
        <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-4 md:space-y-5">
            <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 ring-1 ring-emerald-100 p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Wallet</h1>
                        <p className="mt-1 text-sm text-slate-600">
                            Track available funds, monitor payouts, and review transaction activity.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-slate-200 text-sm text-slate-600">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                        Secure wallet mode
                    </div>
                </div>
            </div>

            {/* Bank Account Details Section */}
            <div className="rounded-2xl bg-white p-4 md:p-5 ring-1 ring-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Payout Account</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900">Bank transfer destination</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopyAccountDetails}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            Copy Details
                        </button>
                        {!isEditing ? (
                            <button
                                type="button"
                                onClick={handleStartEdit}
                                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
                            >
                                <Edit2 className="h-4 w-4" />
                                Edit
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </button>
                        )}
                    </div>
                </div>

                {/* Edit form */}
                {isEditing ? (
                    <form onSubmit={handleUpdateBank} className="space-y-4">
                        {editValidationError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-700">{editValidationError}</p>
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Account Number</label>
                                <input
                                    type="text"
                                    value={editAccountNo}
                                    onChange={(e) => setEditAccountNo(e.target.value)}
                                    placeholder="e.g., 1234567890"
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Bank Name</label>
                                <select
                                    value={editBankCode}
                                    onChange={(e) => setEditBankCode(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 appearance-none"
                                >
                                    <option value="">Select bank</option>
                                    {bankList.map((bank) => (
                                        <option key={bank.code} value={bank.code}>
                                            {bank.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Account Name</label>
                            <input
                                type="text"
                                value={editAccountName}
                                readOnly
                                placeholder="Will auto-fill after account verification"
                                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 outline-none"
                            />
                            {editAccountName && (
                                <p className="mt-1 text-xs text-emerald-700">Account verified.</p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                disabled={editLoading}
                                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={editLoading}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors"
                            >
                                {editLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {editLoading ? "Updating..." : "Update Bank Details"}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* View mode */
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Bank Name</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{bankDetails.bankName}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Account Name</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{bankDetails.accountName}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                <p className="text-xs uppercase tracking-wide text-slate-500">Account Number</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{bankDetails.accountNumber}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Available Balance</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(balances.available)}</p>
                    <p className="text-xs text-emerald-600 mt-1">Cleared funds ready for transfer</p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Ledger Balance</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(user.ledger || 0.00)}</p>
                    <p className="text-xs text-slate-500 mt-1">Includes pending wallet movements</p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Pending Debits</p>
                    <p className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(balances.pendingDebits)}</p>
                    <p className="text-xs text-slate-500 mt-1">Waiting for settlement confirmation</p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Net Movement</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {formatCurrency(balances.totalInflow - balances.totalOutflow)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Success credits minus success debits</p>
                </div>
            </div>

            {/* Transactions Section */}
            <div className="rounded-2xl bg-white p-4 md:p-5 ring-1 ring-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Transactions</h2>
                        <p className="text-sm text-slate-500">{transactions.length} result(s)</p>
                    </div>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Export Statement
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="relative lg:col-span-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="reference"
                            className="w-full rounded-xl border border-slate-400 bg-transparent pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-600"
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <label className="sr-only" htmlFor="statusFilter">
                            Status filter
                        </label>
                        <div className="relative">
                            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <select
                                id="statusFilter"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value as "all" | WalletTransactionStatus)
                                }
                                className="w-full appearance-none rounded-xl border border-slate-400 bg-transparent pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-600"
                            >
                                <option value="all" hidden>All statuses</option>
                                <option value="SUCCESS">Success</option>
                                <option value="PENDING">Pending</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <label className="sr-only" htmlFor="typeFilter">
                            Type filter
                        </label>
                        <select
                            id="typeFilter"
                            value={typeFilter}
                            onChange={(event) => setTypeFilter(event.target.value as "all" | WalletTransactionType)}
                            className="w-full rounded-xl border border-slate-400 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none text-slate-600"
                        >
                            <option value="">All types</option>
                            <option value="payment.admin.credit">Credit</option>
                            <option value="payment.admin.debit">Debit</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:col-span-3">
                    <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor="fromDate">From date</label>
                        <input
                            id="fromDate"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-400 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-600"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor="toDate">To date</label>
                        <input
                            id="toDate"
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-400 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-600"
                        />
                    </div>

                    <p className="text-sm text-slate-500 mt-1 sm:mt-0">Showing transactions between selected dates. Changes auto-refresh results.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-190">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</th>
                                <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                                <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                                <th className="py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Channel</th>
                                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Currency</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td className="py-8 text-center text-sm text-slate-500" colSpan={5}>
                                        No transactions match your filters.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((item: any) => {
                                    const mainAmount = Number(item.metadata?.split?.mainAmount || item.metadata?.receipt?.breakdown?.main || 0);
                                    const agentAmount = Number(item.metadata?.split?.agentAmount || item.metadata?.receipt?.breakdown?.agent || 0);
                                    const techAmount = Number(item.metadata?.split?.technologyAmount || item.metadata?.receipt?.breakdown?.technology || 0);

                                    return (
                                        <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                                            <td className="py-4 text-sm font-medium text-slate-800">
                                                <Link href={`/admin/wallet/transaction/${item.reference}`}>{item.reference || item.id}</Link>
                                                <div className="mt-2 flex gap-2 text-[9px] text-slate-400">
                                                    <span className="rounded bg-emerald-100 px-3 text-emerald-600">M: {formatCurrency(mainAmount)}</span>
                                                    <span className="rounded bg-blue-50 px-3 text-blue-600">A: {formatCurrency(agentAmount)}</span>
                                                    <span className="rounded bg-purple-50 px-3 text-purple-600">T: {formatCurrency(techAmount)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-sm text-slate-600 capitalize">{item.event === "payment.admin.credit" ? "CREDIT" : "DEBIT"}</td>
                                            <td className="py-4 text-sm text-slate-600">
                                                {new Date(item.createdAt || item.updatedAt).toLocaleString("en-NG", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                            <td className="py-4 text-sm">{statusBadge(item.status)}</td>
                                            <td
                                                className={`py-4 text-right text-sm font-semibold ${(item.event || "").toLowerCase() === "payment.admin.credit" ? "text-emerald-700" : "text-rose-700"
                                                    }`}
                                            >
                                                <span className="inline-flex items-center gap-1.5">
                                                    {(item.event || "").toLowerCase() === "payment.admin.credit" ? (
                                                        <ArrowDownLeft className="h-4 w-4" />
                                                    ) : (
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    )}
                                                    {(item.event || "").toLowerCase() === "payment.admin.credit" ? "+" : "-"}
                                                    {formatCurrency(Math.abs(Number(item.amount || 0)))}
                                                </span>
                                            </td>
                                            <td className="py-4 px-2 text-sm text-slate-600 capitalize text-center">{item.channel}</td>
                                            <td className="py-4 px-2 text-sm text-slate-600 capitalize text-center">{item.currency}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default withAuth(WalletPage);