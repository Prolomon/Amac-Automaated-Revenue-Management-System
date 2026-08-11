"use client";

import { useState } from "react";
import { Phone, User, CreditCard, CheckCircle, Shield, Wallet, ArrowRight, Search, Mail, Clock, X, FileText, Calendar, Hash, RefreshCw } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { verifyPayment, Payment, payNow } from "@/lib/services/payments";
import { useRouter } from "next/navigation";

export default function PaymentPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [showPayButton, setShowPayButton] = useState(false);
    const [verifyInput, setVerifyInput] = useState("");
    const [showNotFoundModal, setShowNotFoundModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState<Payment | null>(null);
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<boolean>(false);

    const handleInputChange = (value: string) => {
        setIdentifier(value);
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
            // addToast("error", error instanceof Error ? error.message : "Failed to verify payment");
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const getPayNow = async () => {
        if (!identifier.trim()) {
            addToast("error", "Please enter a valid identifier");
            return;
        }

        try {

            const res = await payNow(identifier.trim());
            if (res.ok) {
                setStatus(true);
                // addToast("success", "Payment initiated successfully. Please check your email for further instructions.");
            } else {
                setStatus(false);
                // addToast("error", res.message || "Failed to initiate payment");
            }

        } catch (error) {
            // addToast("error", error instanceof Error ? error.message : "Failed to initiate payment");
            setStatus(false);
        } finally {
            setShowPayButton(identifier.trim().length > 0);
        }
    }

    const handlePayNow = async () => {
        if (!identifier.trim()) {
            addToast("error", "Please enter a valid identifier");
            return;
        }

        try {

            const res = await payNow(identifier.trim());
            if (res.ok) {
                setStatus(true);
                addToast("success", "Payment initiated successfully. Please check your email for further instructions.");
                router.push(`/payment/${identifier.trim()}/checkout`);
            } else {
                setStatus(false);
                addToast("error", res.message || "Failed to initiate payment");
            }

        } catch (error) {
            addToast("error", error instanceof Error ? error.message : "Failed to initiate payment");
        }
    }

    return (
        <main className="bg-[#F5F7F5] font-['Inter',sans-serif] text-[#0E1F17]">
            {/* Section 1: Showcase */}
            <section className="relative overflow-hidden bg-[#0B3B26]">
                <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(27,158,90,0.35),transparent_70%)]" />

                <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#1B9E5A]/45 bg-[#1B9E5A]/18 px-3.5 py-1.5 font-['JetBrains_Mono',monospace] text-xs font-semibold uppercase tracking-wide text-[#8FE0B4]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] shadow-[0_0_0_3px_rgba(74,222,128,0.25)]" />
                            Payment Portal
                        </span>
                        <h1 className="mt-4 font-['Space_Grotesk',sans-serif] text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">
                            Complete Your Payment in Minutes
                        </h1>
                        <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70 md:text-lg">
                            Pay your tenement and business rates securely. Multiple payment options available with instant confirmation.
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                                <Shield className="h-6 w-6 text-[#8FE0B4]" />
                                <p className="mt-2 text-xs font-medium text-white/70">SSL Secured</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                                <Clock className="h-6 w-6 text-[#8FE0B4]" />
                                <p className="mt-2 text-xs font-medium text-white/70">Instant Processing</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
                        <div className="rounded-2xl border border-white/10 bg-[#0E1F17]/40 p-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B9E5A] text-white">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-['Space_Grotesk',sans-serif] text-sm font-semibold text-white">Easy Payment</p>
                                        <p className="text-xs text-white/60">Quick & secure transactions</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/4 p-3">
                                        <CheckCircle className="h-4 w-4 text-[#7BD9A6]" />
                                        <span className="text-xs text-white/75">Card Payments Accepted</span>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/4 p-3">
                                        <CheckCircle className="h-4 w-4 text-[#7BD9A6]" />
                                        <span className="text-xs text-white/75">Bank Transfer Support</span>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/4 p-3">
                                        <CheckCircle className="h-4 w-4 text-[#7BD9A6]" />
                                        <span className="text-xs text-white/75">Mobile Money Available</span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#1B9E5A]/30 bg-[#1B9E5A]/12 p-3">
                                    <p className="inline-flex items-center gap-1 text-xs font-medium text-[#8FE0B4]">
                                        <CreditCard className="h-5 w-5 text-[#8FE0B4]" /> Your payment is protected with bank-level security encryption
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Enter Details */}
            <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
                <div className="mb-10 text-center">
                    <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Start Payment</span>
                    <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Enter Your Details</h2>
                    <p className="mx-auto mt-2 max-w-2xl text-sm text-[#5B6B62] md:text-base">
                        Provide your phone number, member ID, or payment ID to view and pay your bills.
                    </p>
                </div>

                <div className="mx-auto max-w-2xl">
                    <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-8 shadow-sm">
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="identifier" className="mb-2 block text-sm font-semibold text-[#0E1F17]">
                                    Phone Number / Member ID / Payment ID
                                </label>
                                <div className="flex w-full items-center gap-2">
                                    <div className="relative w-full">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <Search className="h-5 w-5 text-[#5B6B62]" />
                                        </div>
                                        <input
                                            id="identifier"
                                            type="text"
                                            value={identifier}
                                            onChange={(e) => handleInputChange(e.target.value)}
                                            placeholder="Enter your phone number, member ID, or payment ID"
                                            className="w-full appearance-none rounded-xl border border-[#E1E7E2] bg-[#F5F7F5] px-4 py-3 pl-12 text-sm outline-none transition focus:border-[#1B9E5A] focus:bg-white focus:ring-2 focus:ring-[#E4F5EB]"
                                        />
                                    </div>
                                    <button onClick={getPayNow} className="cursor-pointer rounded-xl border border-transparent bg-[#158049] px-3 py-3 text-white transition hover:bg-[#0B3B26] focus:ring-2 focus:ring-[#1B9E5A]/40">
                                        <Search className="h-5 w-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            {showPayButton && (
                                <div className="animate-fade-in">
                                    {status ? (<div className="mb-4 rounded-2xl border border-[#1B9E5A]/25 bg-[#E4F5EB]/60 p-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="mt-0.5 h-5 w-5 text-[#158049]" />
                                            <div>
                                                <p className="text-sm font-semibold text-[#0E1F17]">Payment Found</p>
                                                <p className="mt-1 text-xs text-[#5B6B62]">
                                                    We found your pending payment. Click the button below to proceed with payment.
                                                </p>
                                            </div>
                                        </div>
                                    </div>) : (<div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="mt-0.5 h-5 w-5 text-red-700" />
                                            <div>
                                                <p className="text-sm font-semibold text-[#0E1F17]">Payment Not Found</p>
                                                <p className="mt-1 text-xs text-[#5B6B62]">
                                                    We could not find a pending payment with the provided details.
                                                </p>
                                            </div>
                                        </div>
                                    </div>)}
                                    {status && (
                                        <button className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0B3B26] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5" onClick={handlePayNow}>
                                            <CreditCard className="h-4 w-4" />
                                            Pay Now
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2b: Accepted Channels & Anti-fraud */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm">
                        <CreditCard className="h-6 w-6 text-[#158049]" />
                        <h3 className="mt-2 font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">Card & Bank Transfer</h3>
                        <p className="mt-1 text-xs text-[#5B6B62]">Pay directly on this page using your debit card or bank transfer through our secure gateway.</p>
                    </div>
                    <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm">
                        <Phone className="h-6 w-6 text-[#158049]" />
                        <h3 className="mt-2 font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">USSD & Mobile Money</h3>
                        <p className="mt-1 text-xs text-[#5B6B62]">Prefer offline? Dial the USSD code on your receipt or use supported mobile money channels.</p>
                    </div>
                    <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 shadow-sm">
                        <User className="h-6 w-6 text-[#158049]" />
                        <h3 className="mt-2 font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">Verified Field Agents</h3>
                        <p className="mt-1 text-xs text-[#5B6B62]">Paying an agent in person? Ask for their agent ID and confirm it with our support line first.</p>
                    </div>
                </div>

                <div className="mt-4 flex flex-col items-start gap-3 rounded-[20px] border border-[#E8A33D]/40 bg-[#E8A33D]/[0.08] p-5 sm:flex-row sm:items-center">
                    <Shield className="h-6 w-6 shrink-0 text-[#E8A33D]" />
                    <p className="text-sm text-[#0E1F17]/80">
                        <span className="font-semibold">Protect yourself:</span> Only make payments through this website, our official USSD/bank channels, or an agent whose ID you have verified. We will never ask you to send money to a personal account, and every genuine payment gets you an official digital receipt.
                    </p>
                </div>
            </section>

            {/* Section 3: Verify Payment */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6" id="verify">
                <div className="rounded-[20px] border border-[#1B9E5A]/25 bg-[#E4F5EB]/60 p-6 shadow-sm md:p-8">
                    <div className="mb-6 text-center">
                        <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Payment Status</span>
                        <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Verify Your Payment</h2>
                        <p className="mx-auto mt-2 max-w-2xl text-sm text-[#5B6B62] md:text-base">
                            Check the status of your payment by entering your transaction details.
                        </p>
                    </div>

                    <div className="mx-auto max-w-2xl">
                        <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-6 shadow-sm">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="verify-id" className="mb-2 block text-sm font-semibold text-[#0E1F17]">
                                        Payment Reference Number / Payment ID
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <Search className="h-5 w-5 text-[#5B6B62]" />
                                        </div>
                                        <input
                                            id="verify-id"
                                            type="text"
                                            value={verifyInput}
                                            onChange={(e) => setVerifyInput(e.target.value)}
                                            placeholder="Enter payment reference number ID or payment ID"
                                            className="w-full appearance-none rounded-xl border border-[#E1E7E2] bg-[#F5F7F5] px-4 py-3 pl-12 text-sm outline-none transition focus:border-[#1B9E5A] focus:bg-white focus:ring-2 focus:ring-[#E4F5EB]"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleVerifyPayment}
                                    disabled={loading}
                                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0B3B26] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-md">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#0E1F17]">Verification Result</h3>
                            <button onClick={() => setShowNotFoundModal(false)} className="text-[#5B6B62] hover:text-[#0E1F17]">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4">
                            <p className="text-sm text-red-800">
                                No payment with such reference/ID was found. Please check your payment reference number or ID and try again.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowNotFoundModal(false)}
                            className="w-full cursor-pointer rounded-xl bg-[#0B3B26] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Found Modal */}
            {showPaymentModal && paymentData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="my-8 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] bg-white p-6 shadow-md">
                        <div className="mb-4 flex shrink-0 items-center justify-between">
                            <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#0E1F17]">Payment Details</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="cursor-pointer text-[#5B6B62] hover:text-[#0E1F17]">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto">
                            <div className="rounded-2xl border border-[#1B9E5A]/25 bg-[#E4F5EB] p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="mt-0.5 h-6 w-6 text-[#158049]" />
                                    <div>
                                        <p className="text-sm font-semibold text-[#0E1F17]">Payment Verified</p>
                                        <p className="mt-1 text-xs text-[#5B6B62]">
                                            This payment has been successfully verified.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {paymentData.member && (
                                <div className="rounded-2xl border border-[#E1E7E2] bg-[#F5F7F5] p-4">
                                    <h4 className="mb-3 flex items-center gap-2 font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">
                                        <User className="h-4 w-4" />
                                        User Details
                                    </h4>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div>
                                            <p className="text-xs text-[#5B6B62]">Full Name</p>
                                            <p className="text-sm font-medium text-[#0E1F17]">
                                                {paymentData.member.businessName || paymentData.member.fullname}
                                            </p>
                                        </div>
                                        {paymentData.member.email && (
                                            <div>
                                                <p className="text-xs text-[#5B6B62]">Email</p>
                                                <p className="text-sm font-medium text-[#0E1F17]">{paymentData.member.email}</p>
                                            </div>
                                        )}
                                        {paymentData.member.phone && (
                                            <div>
                                                <p className="text-xs text-[#5B6B62]">Phone</p>
                                                <p className="text-sm font-medium text-[#0E1F17]">{paymentData.member.phone}</p>
                                            </div>
                                        )}
                                        {paymentData.member.uid && (
                                            <div>
                                                <p className="text-xs text-[#5B6B62]">Member ID</p>
                                                <p className="text-sm font-medium text-[#0E1F17]">{paymentData.member.uid}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-2xl border border-[#E1E7E2] bg-[#F5F7F5] p-4">
                                <h4 className="mb-3 flex items-center gap-2 font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">
                                    <FileText className="h-4 w-4" />
                                    Payment Information
                                </h4>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-[#5B6B62]">Reference Number</p>
                                        <p className="font-['JetBrains_Mono',monospace] text-sm font-medium text-[#0E1F17]">{paymentData.reference}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#5B6B62]">Amount</p>
                                        <p className="text-sm font-medium text-[#0E1F17]">
                                            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(paymentData.amount)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#5B6B62]">Pending Payment</p>
                                        <p className="text-sm font-medium text-[#0E1F17]">
                                            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(paymentData.debt)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#5B6B62]">Payment Status</p>
                                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${paymentData.status === 'SUCCESS' ? 'bg-[#E4F5EB] text-[#158049]' :
                                            paymentData.status === 'PENDING' ? 'bg-[#E8A33D]/15 text-[#8A5A17]' :
                                                paymentData.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                    'bg-slate-100 text-slate-800'
                                            }`}>
                                            {paymentData.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#5B6B62]">Payment Category</p>
                                        <p className="text-sm font-medium text-[#0E1F17]">{paymentData.pricing.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#5B6B62]">Frequency</p>
                                        <p className="text-sm font-medium text-[#0E1F17]">{paymentData.frequency}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#5B6B62]">Date</p>
                                        <p className="text-sm font-medium text-[#0E1F17]">
                                            {new Date(paymentData.date).toLocaleDateString('en-NG', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    {paymentData.due && (
                                        <div>
                                            <p className="text-xs text-[#5B6B62]">Due Date</p>
                                            <p className="text-sm font-medium text-[#0E1F17]">
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
                                            <p className="text-xs text-[#5B6B62]">Center</p>
                                            <p className="text-sm font-medium text-[#0E1F17]">{paymentData.center}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[#E1E7E2] bg-[#F5F7F5] p-4">
                                <h4 className="mb-3 flex items-center gap-2 font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">
                                    <User className="h-4 w-4" />
                                    Tier Details
                                </h4>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-[#5B6B62]">Title</p>
                                        <p className="text-sm font-medium text-[#0E1F17]">
                                            {paymentData.pricing.title}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#5B6B62]">Category</p>
                                        <p className="text-sm font-medium text-[#0E1F17]">{paymentData.pricing.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#5B6B62]">Amount</p>
                                        <p className="text-sm font-medium text-[#0E1F17]">{paymentData.pricing.price}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#5B6B62]">Code</p>
                                        <p className="text-sm font-medium text-[#0E1F17]">{paymentData.pricing.code}</p>
                                    </div>
                                </div>
                            </div>

                            {paymentData.sessions && paymentData.sessions.length > 0 && (
                                <div className="rounded-2xl border border-[#E1E7E2] bg-[#F5F7F5] p-4">
                                    <h4 className="mb-3 flex items-center gap-2 font-['Space_Grotesk',sans-serif] text-sm font-semibold text-[#0E1F17]">
                                        <Calendar className="h-4 w-4" />
                                        Sessions
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {paymentData.sessions.map((session, index) => (
                                            <span key={index} className="rounded-lg border border-[#E1E7E2] bg-white px-3 py-1 text-xs font-medium text-[#0E1F17]/80">
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
                                className="w-full rounded-xl bg-[#0B3B26] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Section 4: Payment Methods */}
            <section className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6">
                <div className="mb-10 text-center">
                    <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Available Methods</span>
                    <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Choose Your Payment Method</h2>
                    <p className="mx-auto mt-2 max-w-2xl text-sm text-[#5B6B62] md:text-base">
                        Select from our various payment options for your convenience.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        { icon: CreditCard, title: "Card Payment", desc: "Pay with your debit or credit card" },
                        { icon: Wallet, title: "Bank Transfer", desc: "Transfer directly from your bank account" },
                        { icon: Phone, title: "Mobile Money", desc: "Pay using mobile money platforms" },
                        { icon: Shield, title: "Secure Payment", desc: "256-bit SSL encrypted transactions" },
                    ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="rounded-[20px] border border-[#E1E7E2] bg-white p-5 text-center shadow-sm">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                                <Icon className="h-6 w-6" />
                            </div>
                            <h3 className="mt-3 font-['Space_Grotesk',sans-serif] text-base font-semibold text-[#0E1F17]">{title}</h3>
                            <p className="mt-2 text-sm text-[#5B6B62]">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Section 5: Security Features */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6">
                <div className="overflow-hidden rounded-[28px] bg-[#0B3B26] p-6 shadow-sm md:p-8">
                    <div className="mb-6 text-center">
                        <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#8FE0B4]">Protected</span>
                        <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-white md:text-3xl">Your Security is Our Priority</h2>
                        <p className="mx-auto mt-2 max-w-2xl text-sm text-white/65 md:text-base">
                            We use bank-level security measures to protect your transactions and personal information.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {[
                            { icon: Shield, title: "SSL Encryption", desc: "All transactions are secured with 256-bit SSL encryption." },
                            { icon: CheckCircle, title: "Instant Confirmation", desc: "Receive immediate payment confirmation and receipt." },
                            { icon: Clock, title: "24/7 Available", desc: "Make payments anytime, anywhere." },
                        ].map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex gap-4">
                                <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#8FE0B4]">
                                    <Icon className="h-6 w-6" />
                                </span>
                                <div>
                                    <h3 className="font-['Space_Grotesk',sans-serif] text-base font-semibold text-white">{title}</h3>
                                    <p className="mt-1 text-sm text-white/65">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Section 6: Need Help */}
            <section className="mx-auto w-full max-w-7xl px-4 pb-14 md:px-6">
                <div className="rounded-[20px] border border-[#E1E7E2] bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6 text-center">
                        <span className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-wide text-[#158049]">Support</span>
                        <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0E1F17] md:text-3xl">Need Help?</h2>
                        <p className="mx-auto mt-2 max-w-2xl text-sm text-[#5B6B62] md:text-base">
                            Our support team is available to assist you with any payment-related inquiries.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-[#E1E7E2] bg-[#F5F7F5] p-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                                <Mail className="h-6 w-6" />
                            </div>
                            <h3 className="mt-3 font-['Space_Grotesk',sans-serif] text-base font-semibold text-[#0E1F17]">Email Support</h3>
                            <p className="mt-2 text-sm text-[#5B6B62]">Send us your questions</p>
                            <a href="mailto:support@abujamunicipal.gov.ng" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#158049] hover:text-[#0B3B26]">
                                support@abujamunicipal.gov.ng
                                <ArrowRight className="h-4 w-4" />
                            </a>
                        </div>

                        <div className="rounded-2xl border border-[#E1E7E2] bg-[#F5F7F5] p-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                                <Phone className="h-6 w-6" />
                            </div>
                            <h3 className="mt-3 font-['Space_Grotesk',sans-serif] text-base font-semibold text-[#0E1F17]">Call Us</h3>
                            <p className="mt-2 text-sm text-[#5B6B62]">Mon - Fri, 8:00am - 5:00pm</p>
                            <a href="tel:+2348003BWARITC" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#158049] hover:text-[#0B3B26]">
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