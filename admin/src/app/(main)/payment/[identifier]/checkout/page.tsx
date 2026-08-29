"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Phone,
  User,
  CreditCard,
  CheckCircle,
  Wallet,
  ArrowRight,
  Mail,
  X,
  XCircle,
  FileText,
  RefreshCw,
  Hash,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import {
  Payment,
  payNow,
  confirmPayment,
  DataType,
} from "@/lib/services/payments";
import { Member } from "@/lib/services/member";
import { Wallet as WalletType } from "@/lib/services/wallet";
import { Agent } from "@/lib/services/agent";
import { useParams } from "next/navigation";
import {
  Request,
  createRequest,
  CreateRequestPayload,
  getRequestsByPayment,
} from "@/lib/services/request";

export default function PaymentPage() {
  const { identifier } = useParams();
  const [paymentData, setPaymentData] = useState<{
    payments: { wallet: WalletType; payment: Payment }[];
    member: Member;
    agent?: Agent;
  } | null>(null);
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [confirmDetails, setConfirmDetails] = useState<DataType | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [discountRequests, setDiscountRequests] = useState<string>("");
  const [requestLoad, setRequestLoad] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);

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
          setPaymentData(
            res.data
              ? {
                  payments: res.data.payments || [],
                  member: res.data.member,
                  agent: res.data.agent,
                }
              : null,
          );
        } else {
          addToast("error", res.message || "Failed to initiate payment");
        }
      } catch (error) {
        addToast(
          "error",
          error instanceof Error ? error.message : "Failed to initiate payment",
        );
      }
    };

    if (id.trim().length > 0) {
      getPayNow();
    }
  }, [addToast, id]);

  const handleFetchRequests = useCallback(async () => {
    setRequestLoad(true);
    try {
      const res = await getRequestsByPayment(selectedPayment);
      if (res.ok) {
        setRequests(res.data || []);
      } else {
        addToast("error", res.message || "Failed to fetch requests");
      }
    } catch (error) {
      addToast(
        "error",
        error instanceof Error ? error.message : "Failed to fetch requests",
      );
    } finally {
      setRequestLoad(false);
    }
  }, [selectedPayment, addToast]);

  useEffect(() => {
    if (selectedPayment) {
      handleFetchRequests();
    }
  }, [selectedPayment, handleFetchRequests]);

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
      PENDING: "bg-[#E8A33D]/15 text-[#8A5A17] border-[#E8A33D]/30",
      SUCCESS: "bg-[#E4F5EB] text-[#158049] border-[#1B9E5A]/25",
      PAID: "bg-emerald-100 text-emerald-800 border-[#1B9E5A]/25",
      FAILED: "bg-red-100 text-red-800 border-red-200",
      CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
      COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
      REFUNDED: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return colors[status] || "bg-slate-100 text-slate-600 border-slate-200";
  };

  if (!paymentData) {
    return (
      <main className="bg-[#F5F7F5] font-['Inter',sans-serif] text-[#0E1F17]">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E4F5EB]">
              <RefreshCw className="h-8 w-8 animate-spin text-[#158049]" />
            </div>
            <h2 className="font-['Space_Grotesk',sans-serif] text-xl font-semibold text-[#0E1F17]">
              Loading payment details...
            </h2>
            <p className="mt-2 text-sm text-[#5B6B62]">
              Please wait while we retrieve your information
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { member, payments, agent } = paymentData;
  const payment = payments?.find(
    (p) => p?.payment?.reference === selectedPayment,
  );
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

  const totalAmount = subtotal + penalty - Number(payment?.payment?.discount || 0);

  const handleConfirmPayment = async () => {
    if (!id) {
      addToast("error", "Please enter a valid identifier");
      return;
    }

    setLoading(true);

    try {
      const p = paymentData?.payments?.find(
        (p) => p?.payment?.reference === selectedPayment,
      );

      const res = await confirmPayment(
        paymentData?.member.uid || id,
        p?.payment?.id,
        p?.payment?.debt ? p?.payment?.debt : totalAmount,
        paymentData?.member?.center,
        paymentData?.member?.company,
      );
      if (!res.ok) {
        setFailureMessage(res.message || "Failed to confirm payment");
        setShowFailureModal(true);
        addToast("error", res.message || "Failed to confirm payment");
        return;
      }

      setConfirmDetails(res.data || null);
      setShowSuccessModal(true);
      addToast(
        "success",
        res?.message ||
          "Payment confirmed successfully. Please check your email for further instructions.",
      );
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to confirm payment";
      setFailureMessage(msg);
      setShowFailureModal(true);
      addToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscount = async () => {
    setRequestLoad(true);

    try {
      if (!discountRequests.trim()) {
        addToast("error", "Please enter a valid request ID");
        return;
      }

      const requestPayload: CreateRequestPayload = {
        memberId: member.uid,
        paymentId: payment?.payment?.id || "",
        reason: discountRequests.trim(),
      };

      const res = await createRequest(requestPayload);
      if (!res.ok) {
        addToast("error", res.message || "Failed to create request");
        return;
      }

      handleFetchRequests();
      addToast("success", res.message || "Request created successfully");
    } catch (e: any) {
      addToast("error", e?.message || "Failed to create request");
    } finally {
      setRequestLoad(false);
      setDiscountRequests("");
    }
  };

  return (
    <main className="bg-[#F5F7F5] font-['Inter',sans-serif] text-[#0E1F17]">
      {/* Member & Payment Summary Header */}
      <section className="relative overflow-hidden bg-[#0B3B26]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(27,158,90,0.35),transparent_70%)]" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
          {/* Member Profile Card */}
          <div className="mb-8 overflow-hidden rounded-[20px] border border-white/10 bg-white shadow-lg">
            <div className="bg-[#0B3B26] px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-white">
                  {member?.avatar ? (
                    <Image
                      src={member?.avatar}
                      alt={member?.fullname}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                </div>
                <div className="text-white">
                  <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold">
                    {member?.fullname}
                  </h1>
                  {member?.businessName && (
                    <p className="text-sm text-white/70">
                      {member?.businessName}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-white/60">
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
              <div className="rounded-2xl border border-[#E1E7E2] bg-[#F5F7F5] p-4">
                <p className="font-['JetBrains_Mono',monospace] text-xs font-medium uppercase tracking-wide text-[#5B6B62]">
                  Member Type
                </p>
                <p className="mt-1 text-sm font-semibold text-[#0E1F17]">
                  {member?.type}
                </p>
              </div>
              {member?.location && (
                <div className="rounded-2xl border border-[#E1E7E2] bg-[#F5F7F5] p-4">
                  <p className="font-['JetBrains_Mono',monospace] text-xs font-medium uppercase tracking-wide text-[#5B6B62]">
                    Location
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0E1F17]">
                    {member?.location.city}, {member?.location.state}
                  </p>
                </div>
              )}
              {member?.zone && (
                <div className="rounded-2xl border border-[#E1E7E2] bg-[#F5F7F5] p-4">
                  <p className="font-['JetBrains_Mono',monospace] text-xs font-medium uppercase tracking-wide text-[#5B6B62]">
                    Zone
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0E1F17]">
                    {member?.zone}
                  </p>
                </div>
              )}
              <div className="rounded-2xl border border-[#E1E7E2] bg-[#F5F7F5] p-4">
                <p className="font-['JetBrains_Mono',monospace] text-xs font-medium uppercase tracking-wide text-[#5B6B62]">
                  Billing Frequency
                </p>
                <p className="mt-1 text-sm font-semibold text-[#0E1F17]">
                  {member?.billingFrequency || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Payments List */}
          <div className="mb-8 overflow-hidden rounded-[20px] border border-white/10 bg-white shadow-lg">
            <div className="border-b border-[#E1E7E2] bg-[#F5F7F5] px-6 py-4">
              <h2 className="font-['Space_Grotesk',sans-serif] text-lg font-semibold text-[#0E1F17]">
                Payment Records
              </h2>
            </div>
            <div className="grid gap-6 divide-y divide-[#E1E7E2] px-6 py-8 grid-cols-2 max-lg:grid-cols-1 md:divide-y-0">
              {payments.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-[#5B6B62]">
                  No payment records found.
                </div>
              ) : (
                payments.map((payment, index) => (
                  <button
                    key={payment?.payment?.reference || index}
                    onClick={() =>
                      setSelectedPayment(payment?.payment?.reference)
                    }
                    className={`rounded-2xl border border-[#E1E7E2] px-6 py-4 text-left transition hover:bg-[#F5F7F5] ${selectedPayment === payment?.payment?.reference && "border-[#1B9E5A] bg-[#E4F5EB]/50 hover:border-[#158049]"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-left text-sm font-medium text-[#0E1F17]">
                            {payment?.payment?.pricing.title.trim() ||
                              "Payment"}
                          </p>
                          <p className="font-['JetBrains_Mono',monospace] text-xs text-[#5B6B62]">
                            Ref: {payment?.payment?.reference}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#0E1F17]">
                            {formatCurrency(payment?.payment?.amount)}
                          </p>
                          <p className="text-xs text-[#5B6B62]">
                            Due: {formatDate(payment?.payment?.due)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#5B6B62] sm:grid-cols-4 items-center">
                      <span>Frequency: {payment?.payment?.frequency}</span>
                      <span>
                        Paid: {formatCurrency(payment?.payment?.paid)}
                      </span>
                      <span>
                        Debt: {formatCurrency(payment?.payment?.debt)}
                      </span>
                      <span
                        className={`w-auto inline-block items-center justify-center text-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(payment?.payment?.status)}`}
                      >
                        {payment?.payment?.status}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Payment Summary Cards */}
          {selectedPayment && (
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#E1E7E2] bg-white p-5 shadow-sm">
                <p className="font-['JetBrains_Mono',monospace] text-xs font-medium uppercase tracking-wide text-[#5B6B62]">
                  Principal
                </p>
                <p className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#158049]">
                  {formatCurrency(principal)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E8A33D]/30 bg-white p-5 shadow-sm">
                <p className="font-['JetBrains_Mono',monospace] text-xs font-medium uppercase tracking-wide text-[#5B6B62]">
                  Value Added Tax (VAT)
                </p>
                <p className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#E8A33D]">
                  {formatCurrency(vat)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E8A33D]/30 bg-white p-5 shadow-sm">
                <p className="font-['JetBrains_Mono',monospace] text-xs font-medium uppercase tracking-wide text-[#5B6B62]">
                  Charges
                </p>
                <p className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#E8A33D]">
                  {formatCurrency(charges)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E8A33D]/30 bg-white p-5 shadow-sm">
                <p className="font-['JetBrains_Mono',monospace] text-xs font-medium uppercase tracking-wide text-[#5B6B62]">
                  Subtotal
                </p>
                <p className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#B8791A]">
                  {formatCurrency(subtotal)}
                </p>
              </div>
              <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
                <p className="font-['JetBrains_Mono',monospace] text-xs font-medium uppercase tracking-wide text-[#5B6B62]">
                  Overdue Day(s)
                </p>
                <p className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-red-600">
                  {daysOverdue}
                </p>
              </div>
              <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
                <p className="font-['JetBrains_Mono',monospace] text-xs font-medium uppercase tracking-wide text-[#5B6B62]">
                  Penalty
                </p>
                <p className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-red-600">
                  {formatCurrency(penalty)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#1B9E5A]/25 bg-white p-5 shadow-sm">
                <p className="font-['JetBrains_Mono',monospace] text-xs font-medium uppercase tracking-wide text-[#5B6B62]">
                  Total Amount Due
                </p>
                <p className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#0B3B26]">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E1E7E2] bg-white p-5 shadow-sm">
                <p className="font-['JetBrains_Mono',monospace] text-xs font-medium uppercase tracking-wide text-[#5B6B62]">
                  Total Paid
                </p>
                <p className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#158049]">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E1E7E2] bg-white p-5 shadow-sm">
                <p className="font-['JetBrains_Mono',monospace] text-xs font-medium uppercase tracking-wide text-[#5B6B62]">
                  Outstanding Debt
                </p>
                <p className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-red-600">
                  {formatCurrency(totalDebt)}
                </p>
              </div>
            </div>
          )}

          {/* Wallet & Agent Info */}
          <div className="mb-8 grid gap-6 grid-cols-2 max-lg:grid-cols-1-2">
            {payment?.wallet && (
              <div className="rounded-[20px] border border-white/10 bg-white shadow-lg">
                <div className="border-b border-[#E1E7E2] px-6 py-4">
                  <h2 className="flex items-center gap-2 font-['Space_Grotesk',sans-serif] text-lg font-semibold text-[#0E1F17]">
                    <Wallet className="h-5 w-5 text-[#158049]" /> Wallet
                    Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#5B6B62]">
                        Account Name
                      </span>
                      <span className="text-sm font-medium text-[#0E1F17]">
                        {Number(totalAmount) === Number(totalPaid)
                          ? "****** *******"
                          : payment?.wallet?.accountName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#5B6B62]">
                        Account Number
                      </span>
                      <span className="font-['JetBrains_Mono',monospace] text-sm font-medium text-[#0E1F17]">
                        {Number(totalAmount) === Number(totalPaid)
                          ? "**********"
                          : payment?.wallet?.accountNo || "N/A"}
                      </span>
                    </div>
                    {/* <div className="flex justify-between">
                                            <span className="text-sm text-slate-500">Balance</span>
                                            <span className="text-sm font-semibold text-emerald-800">
                                                {formatCurrency(wallet.balance || 0)}
                                            </span>
                                        </div> */}
                    <div className="flex justify-between">
                      <span className="text-sm text-[#5B6B62]">Currency</span>
                      <span className="text-sm font-medium text-[#0E1F17]">
                        {payment?.wallet?.currency}
                      </span>
                    </div>
                    {payment?.wallet?.bank && (
                      <div className="flex justify-between">
                        <span className="text-sm text-[#5B6B62]">Bank</span>
                        <span className="text-sm font-medium text-[#0E1F17]">
                          {Number(totalAmount) === Number(totalPaid)
                            ? "******* *******"
                            : payment?.wallet?.bank.name}
                        </span>
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
              <div className="rounded-[20px] border border-white/10 bg-white shadow-lg">
                <div className="border-b border-[#E1E7E2] px-6 py-4">
                  <h2 className="flex items-center gap-2 font-['Space_Grotesk',sans-serif] text-lg font-semibold text-[#0E1F17]">
                    <User className="h-5 w-5 text-[#158049]" /> Agent
                    Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#5B6B62]">Name</span>
                      <span className="text-sm font-medium text-[#0E1F17]">
                        {agent.fullname || agent.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#5B6B62]">Email</span>
                      <span className="text-sm font-medium text-[#0E1F17]">
                        {agent.email || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#5B6B62]">Phone</span>
                      <span className="text-sm font-medium text-[#0E1F17]">
                        {agent.phone || "N/A"}
                      </span>
                    </div>
                    {agent.batchNo && (
                      <div className="flex justify-between">
                        <span className="text-sm text-[#5B6B62]">Batch No</span>
                        <span className="text-sm font-medium text-[#0E1F17]">
                          {agent.batchNo}
                        </span>
                      </div>
                    )}
                    {agent.zone && (
                      <div className="flex justify-between">
                        <span className="text-sm text-[#5B6B62]">Zone</span>
                        <span className="text-sm font-medium text-[#0E1F17]">
                          {agent.zone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pay Now Action */}
          <div className="rounded-[20px] border border-white/10 bg-white p-6 shadow-lg">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div>
                <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-semibold text-[#0E1F17]">
                  Ready to complete your payment?
                </h3>
                <p className="text-sm text-[#5B6B62]">
                  Transfer the payment amount to the account details provided:{" "}
                  {formatCurrency(totalDebt)}
                </p>
              </div>
              {selectedPayment && (
                <button
                  onClick={
                    Number(totalAmount) === Number(totalPaid)
                      ? null
                      : handleConfirmPayment
                  }
                  disabled={
                    loading || Number(totalAmount) === Number(totalPaid)
                  }
                  className={
                    Number(totalAmount) === Number(totalPaid)
                      ? "inline-flex items-center gap-2 rounded-xl border border-[#1B9E5A] px-8 py-3 text-sm font-semibold text-[#158049] shadow-sm transition-all hover:border-[#158049] disabled:cursor-not-allowed disabled:opacity-50"
                      : "inline-flex items-center gap-2 rounded-xl bg-[#0B3B26] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0B3B26]/20 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  }
                >
                  {Number(totalAmount) === Number(totalPaid) ? (
                    <>
                      <CreditCard className="h-4 w-4 animate-spin" />
                      Paid
                    </>
                  ) : loading ? (
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
                </button>
              )}
            </div>
          </div>

          {/* Discount Requests */}
          {selectedPayment && (
            <div className="my-8 overflow-hidden rounded-[20px] border border-white/10 bg-white shadow-lg">
              <div className="border-b border-[#E1E7E2] bg-[#F5F7F5] px-6 py-4">
                <h2 className="font-['Space_Grotesk',sans-serif] text-lg font-semibold text-[#0E1F17]">
                  Discount Requests
                </h2>
              </div>

              <div className="grid gap-6 divide-y divide-[#E1E7E2] px-6 py-8 grid-cols-2 max-lg:grid-cols-1 md:divide-y-0">
                {requests.length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-[#5B6B62]">
                    No discount requests found.
                  </div>
                ) : (
                  requests.map((request, index) => (
                    <button
                      key={request?.id || index}
                      onClick={() => setSelectedPayment(request?.id)}
                      className={`rounded-2xl border border-[#E1E7E2] px-6 py-4 text-left transition hover:bg-[#F5F7F5] ${selectedPayment === request?.id && "border-[#1B9E5A] bg-[#E4F5EB]/50 hover:border-[#158049]"}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-left text-sm font-medium text-[#0E1F17]">
                              {request?.payment?.pricing.title.trim() ||
                                "Payment"}
                            </p>
                            <p className="font-['JetBrains_Mono',monospace] text-xs text-[#5B6B62]">
                              Request ID: {request?.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#0E1F17]">
                              {formatCurrency(request?.amount || 0)}
                            </p>
                            <span
                              className={`w-auto inline-block items-center justify-center text-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(request?.status)}`}
                            >
                              {request?.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full block appearance-none rounded-xl border border-[#E1E7E2] bg-[#F5F7F5] px-4 py-3 text-sm outline-none transition focus:border-[#1B9E5A] focus:bg-white focus:ring-2 focus:ring-[#E4F5EB] mt-2">
                        <p className="text-sm text-[#5B6B62]">
                          {request?.reason ||
                            "No Comment available for this request."}
                        </p>
                      </div>
                    </button>
                  ))
                )}

                {payment?.payment?.status != "PAID" || payment.payment.discount > 0 && (
                  <div
                    className={`rounded-2xl border border-[#E1E7E2] object-fit w-full px-6 py-4 text-left transition hover:bg-[#F5F7F5] ${selectedPayment === payment?.payment?.reference && "border-[#1B9E5A] bg-[#E4F5EB]/50 hover:border-[#158049]"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E4F5EB] text-[#158049]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-left text-sm font-medium text-[#0E1F17]">
                            {payment?.payment?.pricing.title.trim() ||
                              "Payment"}
                          </p>
                          <p className="font-['JetBrains_Mono',monospace] text-xs text-[#5B6B62]">
                            Ref: {payment?.payment?.reference}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#0E1F17]">
                            {formatCurrency(totalAmount)}
                          </p>
                          <p className="text-xs text-[#5B6B62]">
                            Due: {formatDate(payment?.payment?.due)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full mt-3 text-xs text-[#5B6B62] items-center gap-2">
                      <input
                        id="identifier"
                        type="text"
                        value={discountRequests}
                        onChange={(e) => setDiscountRequests(e.target.value)}
                        placeholder="Enter reason for request"
                        className="w-full block appearance-none rounded-xl border border-[#E1E7E2] bg-[#F5F7F5] px-4 py-3 text-sm outline-none transition focus:border-[#1B9E5A] focus:bg-white focus:ring-2 focus:ring-[#E4F5EB] relative"
                        disabled={requestLoad}
                      />
                      <button
                        onClick={handleDiscount}
                        disabled={requestLoad}
                        className="cursor-pointer rounded-xl border border-transparent bg-[#158049] px-4 py-2.5 text-white transition hover:bg-[#0B3B26] focus:ring-2 focus:ring-[#1B9E5A]/40"
                      >
                        {requestLoad ? (
                          <span className="text-sm font-bold">
                            Requesting...
                          </span>
                        ) : (
                          <span className="text-sm font-bold">Request</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1F17]/50 p-4"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="w-full max-w-md rounded-[20px] border border-[#E1E7E2] bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between rounded-t-[20px] bg-[#0B3B26] px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <div className="rounded-full bg-white/15 p-2 text-white">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-semibold">
                  Payment Confirmed
                </h3>
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

            <div className="p-6 text-sm text-[#5B6B62]">
              <p className="mb-3 font-medium text-[#0E1F17]">
                Your payment was confirmed successfully.
              </p>

              {confirmDetails ? (
                <dl className="divide-y divide-[#E1E7E2] rounded-2xl border border-[#1B9E5A]/25 bg-[#E4F5EB]/40 text-sm">
                  {confirmDetails?.payment?.reference && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <dt className="text-[#5B6B62]">Reference</dt>
                      <dd className="font-['JetBrains_Mono',monospace] font-medium text-[#0E1F17]">
                        {confirmDetails?.payment?.reference}
                      </dd>
                    </div>
                  )}
                  {confirmDetails?.payment?.amount && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <dt className="text-[#5B6B62]">Amount</dt>
                      <dd className="font-medium text-[#0E1F17]">
                        ₦
                        {Number(
                          confirmDetails?.payment?.amount,
                        ).toLocaleString()}
                      </dd>
                    </div>
                  )}
                  {confirmDetails?.payment?.status && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <dt className="text-[#5B6B62]">Status</dt>
                      <dd className="font-medium capitalize text-[#158049]">
                        {confirmDetails?.payment?.status}
                      </dd>
                    </div>
                  )}
                  {confirmDetails?.payment?.date && (
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <dt className="text-[#5B6B62]">Date</dt>
                      <dd className="font-medium text-[#0E1F17]">
                        {confirmDetails?.payment?.date}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-[#0E1F17]">
                  Payment confirmed successfully.
                </p>
              )}
            </div>

            <div className="flex justify-end border-t border-[#E1E7E2] px-6 py-4">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="rounded-xl bg-[#0B3B26] px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1F17]/50 p-4"
          onClick={() => setShowFailureModal(false)}
        >
          <div
            className="w-full max-w-md rounded-[20px] border border-rose-100 bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between rounded-t-[20px] bg-rose-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <div className="rounded-full bg-white/20 p-2 text-white">
                  <XCircle className="h-6 w-6" />
                </div>
                <h3 className="font-['Space_Grotesk',sans-serif] text-lg font-semibold">
                  Payment Failed
                </h3>
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

            <div className="p-6 text-sm text-[#5B6B62]">
              <p>
                {failureMessage ||
                  "There was an issue confirming your payment."}
              </p>
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
