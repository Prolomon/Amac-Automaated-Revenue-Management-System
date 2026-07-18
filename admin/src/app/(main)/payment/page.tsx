"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Phone, User, CreditCard, CheckCircle, Shield, Wallet, ArrowRight, Search, Mail, Clock, X, FileText, Calendar, Hash, RefreshCw } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { verifyPayment, Payment } from "@/lib/services/payments";

export default function PaymentPage() {
    const [identifier, setIdentifier] = useState("");
    const [showPayButton, setShowPayButton] = useState(false);
    const [verifyInput, setVerifyInput] = useState("");
    const [showNotFoundModal, setShowNotFoundModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState<Payment | null>(null);
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleInputChange = (value: string) => {
        setIdentifier(value);
        setShowPayButton(value.trim().length > 0);
    };

    const handleVerifyPayment = async () => {
        setLoading(true);
        if (!verifyInput.trim()) {
            addToast("error", "Please enter a payment reference number or ID");
            return;
        }

        try {
            const result = await verifyPayment(verifyInput.trim());
            if (result.ok) {
                setPaymentData(result.payment);
                setShowPaymentModal(true);
            } else {
                setShowNotFoundModal(true);
            }
        } catch (error) {
            addToast("error", error instanceof Error ? error.message : "Failed to verify payment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main>
            {/* Section 1: Showcase */}
            <section className="relative overflow-hidden bg-linear-to-br from-emerald-50 via-white to-cyan-50">
                <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
                <div className="absolute -right-20 bottom-4 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />

                <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
                    <div>
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            Payment Portal
                        </span>
                        <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
                            Complete Your Payment in Minutes
                        </h1>
                        <p className="mt-4 text-base text-slate-600 md:text-lg">
                            Pay your tenement and business rates securely. Multiple payment options available with instant confirmation.
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                                <Shield className="h-6 w-6 text-emerald-700" />
                                <p className="mt-2 text-xs font-medium text-slate-600">SSL Secured</p>
                            </div>
                            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                                <Clock className="h-6 w-6 text-emerald-700" />
                                <p className="mt-2 text-xs font-medium text-slate-600">Instant Processing</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Easy Payment</p>
                                        <p className="text-xs text-slate-600">Quick & secure transactions</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 rounded-lg bg-white p-3 border border-emerald-100">
                                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                                        <span className="text-xs text-slate-700">Card Payments Accepted</span>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg bg-white p-3 border border-emerald-100">
                                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                                        <span className="text-xs text-slate-700">Bank Transfer Support</span>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg bg-white p-3 border border-emerald-100">
                                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                                        <span className="text-xs text-slate-700">Mobile Money Available</span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-emerald-200 bg-emerald-100/50 p-3">
                                    <p className="text-xs font-medium text-emerald-900">
                                        💳 Your payment is protected with bank-level security encryption
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Enter Details */}
            <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
                <div className="mb-10 text-center">
                    <span className="text-xs uppercase tracking-wide text-emerald-700">Start Payment</span>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Enter Your Details</h2>
                    <p className="mt-2 max-w-2xl mx-auto text-sm text-slate-600 md:text-base">
                        Provide your phone number, member ID, or payment ID to view and pay your bills.
                    </p>
                </div>

                <div className="max-w-2xl mx-auto">
                    <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="identifier" className="mb-2 block text-sm font-semibold text-slate-700">
                                    Phone Number / Member ID / Payment ID
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                        <Search className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <input
                                        id="identifier"
                                        type="text"
                                        value={identifier}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        placeholder="Enter your phone number, member ID, or payment ID"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-12 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                    />
                                </div>
                            </div>

                            {showPayButton && (
                                <div className="animate-fade-in">
                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="h-5 w-5 text-emerald-700 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">Payment Found</p>
                                                <p className="text-xs text-slate-600 mt-1">
                                                    We found your pending payment. Click the button below to proceed with payment.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                                        <CreditCard className="h-4 w-4" />
                                        Pay Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Verify Payment */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6" id="verify">
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 shadow-sm md:p-8">
                    <div className="mb-6 text-center">
                        <span className="text-xs uppercase tracking-wide text-emerald-700">Payment Status</span>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Verify Your Payment</h2>
                        <p className="mt-2 max-w-2xl mx-auto text-sm text-slate-600 md:text-base">
                            Check the status of your payment by entering your transaction details.
                        </p>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="verify-id" className="mb-2 block text-sm font-semibold text-slate-700">
                                        Payment Reference Number / Payment ID
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <Search className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            id="verify-id"
                                            type="text"
                                            value={verifyInput}
                                            onChange={(e) => setVerifyInput(e.target.value)}
                                            placeholder="Enter payment reference number ID or payment ID"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-12 text-sm outline-none appearance-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleVerifyPayment}
                                    disabled={loading}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <RefreshCw className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                                    {loading ? "Verifying..." : "Verify Payment"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Not Found Modal */}
            {showNotFoundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">Verification Result</h3>
                            <button onClick={() => setShowNotFoundModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4">
                            <p className="text-sm text-red-800">
                                No payment with such reference/ID was found. Please check your payment reference number or ID and try again.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowNotFoundModal(false)}
                            className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Found Modal */}
            {showPaymentModal && paymentData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl my-8 max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="mb-4 flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-bold text-slate-900">Payment Details</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto flex-1">
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-6 w-6 text-emerald-700 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Payment Verified</p>
                                        <p className="text-xs text-slate-600 mt-1">
                                            This payment has been successfully verified.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {paymentData.member && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                        <User className="h-4 w-4" />
                                        User Details
                                    </h4>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div>
                                            <p className="text-xs text-slate-500">Full Name</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {paymentData.member.businessName || paymentData.member.fullname}
                                            </p>
                                        </div>
                                        {paymentData.member.email && (
                                            <div>
                                                <p className="text-xs text-slate-500">Email</p>
                                                <p className="text-sm font-medium text-slate-900">{paymentData.member.email}</p>
                                            </div>
                                        )}
                                        {paymentData.member.phone && (
                                            <div>
                                                <p className="text-xs text-slate-500">Phone</p>
                                                <p className="text-sm font-medium text-slate-900">{paymentData.member.phone}</p>
                                            </div>
                                        )}
                                        {paymentData.member.uid && (
                                            <div>
                                                <p className="text-xs text-slate-500">Member ID</p>
                                                <p className="text-sm font-medium text-slate-900">{paymentData.member.uid}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <FileText className="h-4 w-4" />
                                    Payment Information
                                </h4>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-slate-500">Reference Number</p>
                                        <p className="text-sm font-medium text-slate-900 font-mono">{paymentData.reference}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Amount</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(paymentData.amount)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Pending Payment</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(paymentData.debt)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Payment Status</p>
                                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${paymentData.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                                paymentData.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    paymentData.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                        'bg-slate-100 text-slate-800'
                                            }`}>
                                            {paymentData.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Payment Category</p>
                                        <p className="text-sm font-medium text-slate-900">{paymentData.pricing.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Frequency</p>
                                        <p className="text-sm font-medium text-slate-900">{paymentData.frequency}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Date</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {new Date(paymentData.date).toLocaleDateString('en-NG', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    {paymentData.due && (
                                        <div>
                                            <p className="text-xs text-slate-500">Due Date</p>
                                            <p className="text-sm font-medium text-slate-900">
                                                {new Date(paymentData.due).toLocaleDateString('en-NG', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    {paymentData.center && (
                                        <div>
                                            <p className="text-xs text-slate-500">Center</p>
                                            <p className="text-sm font-medium text-slate-900">{paymentData.center}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                    <User className="h-4 w-4" />
                                    Tier Details
                                </h4>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-slate-500">Title</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {paymentData.pricing.title}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Category</p>
                                        <p className="text-sm font-medium text-slate-900">{paymentData.pricing.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Amount</p>
                                        <p className="text-sm font-medium text-slate-900">{paymentData.pricing.price}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Code</p>
                                        <p className="text-sm font-medium text-slate-900">{paymentData.pricing.code}</p>
                                    </div>
                                </div>
                            </div>

                            {paymentData.sessions && paymentData.sessions.length > 0 && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                        <Calendar className="h-4 w-4" />
                                        Sessions
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {paymentData.sessions.map((session, index) => (
                                            <span key={index} className="rounded-lg bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                                                {session}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Section 4: Payment Methods */}
            <section className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
                <div className="mb-10 text-center">
                    <span className="text-xs uppercase tracking-wide text-emerald-700">Available Methods</span>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Choose Your Payment Method</h2>
                    <p className="mt-2 max-w-2xl mx-auto text-sm text-slate-600 md:text-base">
                        Select from our various payment options for your convenience.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-slate-900">Card Payment</h3>
                        <p className="mt-2 text-sm text-slate-600">Pay with your debit or credit card</p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-slate-900">Bank Transfer</h3>
                        <p className="mt-2 text-sm text-slate-600">Transfer directly from your bank account</p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <Phone className="h-6 w-6" />
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-slate-900">Mobile Money</h3>
                        <p className="mt-2 text-sm text-slate-600">Pay using mobile money platforms</p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-slate-900">Secure Payment</h3>
                        <p className="mt-2 text-sm text-slate-600">256-bit SSL encrypted transactions</p>
                    </div>
                </div>
            </section>

            {/* Section 5: Security Features */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
                <div className="rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-cyan-50 p-6 shadow-sm md:p-8">
                    <div className="mb-6 text-center">
                        <span className="text-xs uppercase tracking-wide text-emerald-700">Protected</span>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Your Security is Our Priority</h2>
                        <p className="mt-2 max-w-2xl mx-auto text-sm text-slate-600 md:text-base">
                            We use bank-level security measures to protect your transactions and personal information.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="flex gap-4">
                            <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                                <Shield className="h-6 w-6" />
                            </span>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">SSL Encryption</h3>
                                <p className="mt-1 text-sm text-slate-600">All transactions are secured with 256-bit SSL encryption.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                                <CheckCircle className="h-6 w-6" />
                            </span>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">Instant Confirmation</h3>
                                <p className="mt-1 text-sm text-slate-600">Receive immediate payment confirmation and receipt.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                                <Clock className="h-6 w-6" />
                            </span>
                            <div>
                                <h3 className="text-base font-semibold text-slate-900">24/7 Available</h3>
                                <p className="mt-1 text-sm text-slate-600">Make payments anytime, anywhere.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 6: Need Help */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6 text-center">
                        <span className="text-xs uppercase tracking-wide text-emerald-700">Support</span>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Need Help?</h2>
                        <p className="mt-2 max-w-2xl mx-auto text-sm text-slate-600 md:text-base">
                            Our support team is available to assist you with any payment-related inquiries.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                <Mail className="h-6 w-6" />
                            </div>
                            <h3 className="mt-3 text-base font-semibold text-slate-900">Email Support</h3>
                            <p className="mt-2 text-sm text-slate-600">Send us your questions</p>
                            <a href="mailto:support@abujamunicipal.gov.ng" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                                support@abujamunicipal.gov.ng
                                <ArrowRight className="h-4 w-4" />
                            </a>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                <Phone className="h-6 w-6" />
                            </div>
                            <h3 className="mt-3 text-base font-semibold text-slate-900">Call Us</h3>
                            <p className="mt-2 text-sm text-slate-600">Mon - Fri, 8:00am - 5:00pm</p>
                            <a href="tel:+2348003BWARITC" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                                +234 (0) 8003 BWARITC
                                <ArrowRight className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}