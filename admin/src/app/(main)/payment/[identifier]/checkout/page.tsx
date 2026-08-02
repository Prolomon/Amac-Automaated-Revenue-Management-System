"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Phone, User, CreditCard, CheckCircle, Shield, Wallet, ArrowRight, Search, Mail, Clock, X, XCircle, FileText, Calendar, Hash, RefreshCw } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { Payment, payNow, confirmPayment, DataType } from "@/lib/services/payments";
import { Member } from "@/lib/services/member";
import { Wallet as WalletType } from "@/lib/services/wallet";
import { Agent } from "@/lib/services/agent";
import { useParams } from "next/navigation";

export default function PaymentPage() {
    const { identifier } = useParams();
    const [paymentData, setPaymentData] = useState<{ payments: { wallet: WalletType; payment: Payment }[]; member: Member; agent?: Agent } | null>(null);
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<string>("")
    const [confirmDetails, setConfirmDetails] = useState<DataType | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showFailureModal, setShowFailureModal] = useState(false);
    const [failureMessage, setFailureMessage] = useState<string | null>(null);

    const id = identifier as string;

    useEffect(() => {
        const getPayNow = async () => {
            if (!id.trim()) {
                addToast("error", "Please enter a valid identifier");
                return;
            }

            try {

                const res = await payNow(id.trim());
                if (res.ok) {
                    setPaymentData(res.data ? { payments: res.data.payments || [], member: res.data.member, agent: res.data.agent } : null);
                } else {
                    addToast("error", res.message || "Failed to initiate payment");
                }

            } catch (error) {
                addToast("error", error instanceof Error ? error.message : "Failed to initiate payment");
            }
        }

        if (id.trim().length > 0) {
            getPayNow();
        }
    }, [addToast, id]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (date: string | Date | undefined | null) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-NG", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
            SUCCESS: "bg-green-100 text-green-800 border-green-200",
            FAILED: "bg-red-100 text-red-800 border-red-200",
            CANCELLED: "bg-gray-100 text-gray-800 border-gray-200",
            COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
            REFUNDED: "bg-purple-100 text-purple-800 border-purple-200",
        };
        return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    if (!paymentData) {
        return (
            <main>
                <div className="flex min-h-[60vh] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-700">Loading payment details...</h2>
                        <p className="mt-2 text-sm text-slate-500">Please wait while we retrieve your information</p>
                    </div>
                </div>
            </main>
        );
    }

    const { member, payments, agent } = paymentData;
    const payment = payments?.find((p) => p?.payment?.reference === selectedPayment);
    const totalPaid = payments?.reduce((sum, p) => sum + p?.payment?.paid, 0);
    const totalDebt = payments?.reduce((sum, p) => sum + p?.payment?.debt, 0);

    const principal = Number(payment?.payment?.amount);
    const vat = principal * 0.075;
    const charges = principal * 0.015;
    const subtotal = principal + vat + charges;

    // Get payment date and current date
    const paymentDate = new Date(payment?.payment?.date);
    const currentDate = new Date();

    // Calculate days overdue
    let daysOverdue = 0;
    if (currentDate > paymentDate) {
        const diffTime = currentDate.getTime() - paymentDate.getTime(); // ✅ use getTime()
        daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // convert ms → days
    }

    // Penalty: 0.005% per day overdue
    const penaltyRatePerDay = 0.00005; // 0.005% = 0.00005
    const penalty = subtotal * penaltyRatePerDay * daysOverdue;

    const totalAmount = subtotal + penalty;

    const handleConfirmPayment = async () => {
        if (!id) {
            addToast("error", "Please enter a valid identifier");
            return;
        }

        setLoading(true);

        try {

            const p = paymentData?.payments?.find(p => p?.payment?.reference === selectedPayment)

            const res = await confirmPayment(id, p?.payment?.id, p?.payment?.debt || totalAmount, paymentData?.member?.center, paymentData?.member?.company);
            if (!res.ok) {
                setFailureMessage(res.message || "Failed to confirm payment");
                setShowFailureModal(true);
                addToast("error", res.message || "Failed to confirm payment");
                return;
            }

            setConfirmDetails(res.data || null);
            setShowSuccessModal(true);
            addToast("success", res?.message || "Payment confirmed successfully. Please check your email for further instructions.");

        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to confirm payment";
            setFailureMessage(msg);
            setShowFailureModal(true);
            addToast("error", msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main>
            {/* Member & Payment Summary Header */}
            <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-cyan-50">
                <div className="relative mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
                    {/* Member Profile Card */}
                    <div className="mb-8 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-lg">
                        <div className="bg-linear-to-r from-emerald-600 to-emerald-500 px-6 py-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white">
                                    {member?.avatar ? (
                                        <Image src={member?.avatar} alt={member?.fullname} width={64} height={64} className="rounded-full" />
                                    ) : (
                                        <User className="h-8 w-8" />
                                    )}
                                </div>
                                <div className="text-white">
                                    <h1 className="text-2xl font-bold">{member?.fullname}</h1>
                                    {member?.businessName && (
                                        <p className="text-sm text-emerald-100">{member?.businessName}</p>
                                    )}
                                    <div className="mt-1 flex items-center gap-3 text-xs text-emerald-100">
                                        <span className="flex items-center gap-1">
                                            <Mail className="h-3 w-3" /> {member?.email}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-3 w-3" /> {member?.phone}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                                <p className="text-xs font-medium text-slate-500">Member Type</p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">{member?.type}</p>
                            </div>
                            {member?.location && (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                                    <p className="text-xs font-medium text-slate-500">Location</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                        {member?.location.city}, {member?.location.state}
                                    </p>
                                </div>
                            )}
                            {member?.zone && (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                                    <p className="text-xs font-medium text-slate-500">Zone</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-800">{member?.zone}</p>
                                </div>
                            )}
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                                <p className="text-xs font-medium text-slate-500">Billing Frequency</p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {member?.billingFrequency || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payments List */}
                    <div className="mb-8 overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-lg">
                        <div className="border-b border-emerald-100 bg-emerald-50/50 px-6 py-4">
                            <h2 className="text-lg font-semibold text-slate-800">Payment Records</h2>
                        </div>
                        <div className="divide-y divide-emerald-50 px-6 py-8 grid md:grid-cols-2 gap-6">
                            {payments.length === 0 ? (
                                <div className="px-6 py-8 text-center text-sm text-slate-500">
                                    No payment records found.
                                </div>
                            ) : (
                                payments.map((payment, index) => (
                                    <button key={payment?.payment?.reference || index} onClick={() => setSelectedPayment(payment?.payment?.reference)} className={`px-6 py-4 hover:bg-emerald-50/30 rounded-lg border-slate-300 border ${selectedPayment === payment?.payment?.reference && "bg-emerald-50/30 border-emerald-700 hover:border-slate-500"}`}>
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800 text-left">{payment?.payment?.pricing.title.trim() || "Payment"}</p>
                                                    <p className="text-xs text-slate-500">
                                                        Ref: {payment?.payment?.reference}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {formatCurrency(payment?.payment?.amount)}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Due: {formatDate(payment?.payment?.due)}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(payment?.payment?.status)}`}>
                                                    {payment?.payment?.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
                                            <span>Frequency: {payment?.payment?.frequency}</span>
                                            <span>Paid: {formatCurrency(payment?.payment?.paid)}</span>
                                            <span>Debt: {formatCurrency(payment?.payment?.debt)}</span>
                                            <span>Sessions: {payment?.payment?.sessions?.length || 0}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Payment Summary Cards */}
                    {selectedPayment && (<div className="mb-8 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-medium text-slate-500">Principal</p>
                            <p className="mt-1 text-2xl font-bold text-emerald-800">{formatCurrency(principal)}</p>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-medium text-slate-500">Value Added Tax (VAT)</p>
                            <p className="mt-1 text-2xl font-bold text-amber-600">{formatCurrency(vat)}</p>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-medium text-slate-500">Charges</p>
                            <p className="mt-1 text-2xl font-bold text-amber-600">{formatCurrency(charges)}</p>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-medium text-slate-500">Subtotal</p>
                            <p className="mt-1 text-2xl font-bold text-amber-700">{formatCurrency(subtotal)}</p>
                        </div>
                        <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-medium text-slate-500">Overdue Day(s)</p>
                            <p className="mt-1 text-2xl font-bold text-red-600">{daysOverdue}</p>
                        </div>
                        <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-medium text-slate-500">Penalty</p>
                            <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(penalty)}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-medium text-slate-500">Total Amount Due</p>
                            <p className="mt-1 text-2xl font-bold text-emerald-800">{formatCurrency(totalAmount)}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-medium text-slate-500">Total Paid</p>
                            <p className="mt-1 text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
                            <p className="text-xs font-medium text-slate-500">Outstanding Debt</p>
                            <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
                        </div>
                    </div>)}

                    {/* Wallet & Agent Info */}
                    <div className="mb-8 grid gap-6 md:grid-cols-2">
                        {payment?.wallet && (
                            <div className="rounded-lg border border-emerald-100 bg-white shadow-lg">
                                <div className="border-b border-emerald-100 px-6 py-4">
                                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                        <Wallet className="h-5 w-5 text-emerald-600" /> Wallet Information
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-500">Account Name</span>
                                            <span className="text-sm font-medium text-slate-800">{(Number(totalAmount) === Number(totalPaid)) ? "****** *******" : payment?.wallet?.accountName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-500">Account Number</span>
                                            <span className="text-sm font-medium text-slate-800">{(Number(totalAmount) === Number(totalPaid)) ? "**********" : payment?.wallet?.accountNo || "N/A"}</span>
                                        </div>
                                        {/* <div className="flex justify-between">
                                            <span className="text-sm text-slate-500">Balance</span>
                                            <span className="text-sm font-semibold text-emerald-800">
                                                {formatCurrency(wallet.balance || 0)}
                                            </span>
                                        </div> */}
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-500">Currency</span>
                                            <span className="text-sm font-medium text-slate-800">{payment?.wallet?.currency}</span>
                                        </div>
                                        {payment?.wallet?.bank && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-slate-500">Bank</span>
                                                <span className="text-sm font-medium text-slate-800">{(Number(totalAmount) === Number(totalPaid)) ? "******* *******" : payment?.wallet?.bank.name}</span>
                                            </div>
                                        )}
                                        {/* <div className="flex justify-between">
                                            <span className="text-sm text-slate-500">Status</span>
                                            <span className={`text-sm font-medium ${payment?.wallet?.status ? "text-green-600" : "text-red-600"}`}>
                                                {payment?.wallet?.status ? "Active" : "Inactive"}
                                            </span>
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                        )}

                        {agent && (
                            <div className="rounded-lg border border-emerald-100 bg-white shadow-lg">
                                <div className="border-b border-emerald-100 px-6 py-4">
                                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                                        <User className="h-5 w-5 text-emerald-600" /> Agent Information
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-500">Name</span>
                                            <span className="text-sm font-medium text-slate-800">{agent.fullname || agent.name || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-500">Email</span>
                                            <span className="text-sm font-medium text-slate-800">{agent.email || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-slate-500">Phone</span>
                                            <span className="text-sm font-medium text-slate-800">{agent.phone || "N/A"}</span>
                                        </div>
                                        {agent.batchNo && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-slate-500">Batch No</span>
                                                <span className="text-sm font-medium text-slate-800">{agent.batchNo}</span>
                                            </div>
                                        )}
                                        {agent.zone && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-slate-500">Zone</span>
                                                <span className="text-sm font-medium text-slate-800">{agent.zone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pay Now Action */}
                    <div className="rounded-lg border border-emerald-100 bg-white p-6 shadow-lg">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Ready to complete your payment?</h3>
                                <p className="text-sm text-slate-500">
                                    Transfer the payment amount to the account details provided: {formatCurrency(totalDebt)}
                                </p>
                            </div>
                            {selectedPayment && (<button
                                onClick={(Number(totalAmount) === Number(totalPaid)) ? null : handleConfirmPayment}
                                disabled={loading || (Number(totalAmount) === Number(totalPaid))}
                                className={(Number(totalAmount) === Number(totalPaid)) ? "inline-flex items-center gap-2 rounded-xl border-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:border-emerald-700 border disabled:cursor-not-allowed disabled:opacity-50" : "inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"}
                            >
                                {(Number(totalAmount) === Number(totalPaid)) ?
                                    <>
                                        <CreditCard className="h-4 w-4 animate-spin" />
                                        Paid
                                    </>
                                    : loading ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            I have made the payment
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                            </button>)}
                        </div>
                    </div>
                </div>
            </section>
            {/* Success Modal */}
            {showSuccessModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
                    onClick={() => setShowSuccessModal(false)}
                >
                    <div
                        className="w-full max-w-md rounded-xl border border-emerald-100 bg-white shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between rounded-t-xl bg-linear-to-r from-emerald-600 to-emerald-500 px-6 py-4">
                            <div className="flex items-center gap-3 text-white">
                                <div className="rounded-full bg-white/20 p-2 text-white">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold">Payment Confirmed</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowSuccessModal(false)}
                                aria-label="Close"
                                className="rounded-full p-1 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 text-sm text-slate-600">
                            <p className="mb-3 font-medium text-slate-700">Your payment was confirmed successfully.</p>

                            {confirmDetails ? (
                                <dl className="divide-y divide-emerald-100 rounded-lg border border-emerald-100 bg-emerald-50/40 text-sm">
                                    {confirmDetails?.payment?.reference && (
                                        <div className="flex items-center justify-between px-4 py-2.5">
                                            <dt className="text-slate-500">Reference</dt>
                                            <dd className="font-medium text-slate-900">{confirmDetails?.payment?.reference}</dd>
                                        </div>
                                    )}
                                    {confirmDetails?.payment?.amount && (
                                        <div className="flex items-center justify-between px-4 py-2.5">
                                            <dt className="text-slate-500">Amount</dt>
                                            <dd className="font-medium text-slate-900">₦{Number(confirmDetails?.payment?.amount).toLocaleString()}</dd>
                                        </div>
                                    )}
                                    {confirmDetails?.payment?.status && (
                                        <div className="flex items-center justify-between px-4 py-2.5">
                                            <dt className="text-slate-500">Status</dt>
                                            <dd className="font-medium capitalize text-emerald-700">{confirmDetails?.payment?.status}</dd>
                                        </div>
                                    )}
                                    {confirmDetails?.payment?.date && (
                                        <div className="flex items-center justify-between px-4 py-2.5">
                                            <dt className="text-slate-500">Date</dt>
                                            <dd className="font-medium text-slate-900">{confirmDetails?.payment?.date}</dd>
                                        </div>
                                    )}
                                </dl>
                            ) : (
                                <p className="text-slate-700">Payment confirmed successfully.</p>
                            )}
                        </div>

                        <div className="flex justify-end border-t border-emerald-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setShowSuccessModal(false)}
                                className="rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Failure Modal */}
            {showFailureModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
                    onClick={() => setShowFailureModal(false)}
                >
                    <div
                        className="w-full max-w-md rounded-xl border border-rose-100 bg-white shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between rounded-t-xl bg-linear-to-r from-rose-600 to-rose-500 px-6 py-4">
                            <div className="flex items-center gap-3 text-white">
                                <div className="rounded-full bg-white/20 p-2 text-white">
                                    <XCircle className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold">Payment Failed</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFailureModal(false)}
                                aria-label="Close"
                                className="rounded-full p-1 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 text-sm text-slate-600">
                            <p>{failureMessage || "There was an issue confirming your payment."}</p>
                        </div>

                        <div className="flex justify-end border-t border-rose-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setShowFailureModal(false)}
                                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}