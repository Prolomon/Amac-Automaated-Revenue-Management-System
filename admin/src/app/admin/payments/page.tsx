"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCcw, CheckCircle, XCircle, Clock, Ban, RotateCcw, User, Hash, Calendar, CreditCard, Receipt, Bell } from "lucide-react";
import { sendDemandByPayment } from "@/lib/services/demand";
import { getAllPayments, Payment } from "@/lib/services/payments";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  SUCCESS: { label: "Success", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CheckCircle },
  PENDING: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Clock },
  FAILED: { label: "Failed", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: XCircle },
  CANCELLED: { label: "Cancelled", bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", icon: Ban },
  REFUNDED: { label: "Refunded", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: RotateCcw },
};

const frequencyLabels: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
  QUARTERLY: "Quarterly",
  BIWEEKLY: "Bi-weekly",
};

export default function Payments() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;
  const { addToast } = useToast();
  const [paymentLoad, setPaymentLoad] = useState<string>("");

  const fetchPayments = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await getAllPayments(pageNum, limit);
      const paymentsData = Array.isArray(data?.payments) ? data.payments : [];
      setPayments(paymentsData);
      if (data?.meta) {
        setTotalPages(data.meta.totalPages);
        setTotal(data.meta.total);
        setPage(data.meta.page);
      }
    } catch (err) {
      addToast("error", err.message || "An error occurred while fetching payments");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  const stats = useMemo(() => {
    if (!payments) return { total: 0, success: 0, pending: 0, failed: 0, totalAmount: 0, totalDebt: 0 };
    return {
      total: payments.length,
      success: payments.filter(p => p.status === "SUCCESS").length,
      pending: payments.filter(p => p.status === "PENDING").length,
      failed: payments.filter(p => p.status === "FAILED").length,
      totalAmount: payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      totalDebt: payments.reduce((sum, p) => sum + Number(p.debt || 0), 0),
    };
  }, [payments]);

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSendDemandNotice = async (payment: Payment) => {
    setPaymentLoad(payment.id || "");
    try {
      const res = await sendDemandByPayment(payment.id);

      if (res.ok) {
        addToast("success", res.message || "Demand notice sent successfully");
      } else {
        addToast("error", res.message || "Failed to send demand notice");
      }

    } catch (err) {
      addToast("error", err.message || "Failed to send demand notice");
    } finally {
      setPaymentLoad("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:space-y-5 md:p-6">
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Payment Records
            </h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              View and manage all payment transactions across your center.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => fetchPayments(1)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <RefreshCcw size={18} />
              Refresh Payments
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Payments</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-500">All payment records</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Successful</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{stats.success}</p>
          <p className="mt-1 text-xs text-slate-500">Completed payments</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">₦{stats.totalAmount.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">Across all payments</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Outstanding Debt</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">₦{stats.totalDebt.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">Pending collections</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Transaction Log</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">All payment transactions</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Receipt className="h-3.5 w-3.5" />
            {stats.total} records
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-4 animate-spin">
                  <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-emerald-600" />
                </div>
                <p className="font-medium text-slate-600">Loading payment records...</p>
              </div>
            </div>
          ) : payments?.length > 0 ? (
            payments.map((payment, index) => {
              const statusInfo = statusConfig[payment.status] || statusConfig.PENDING;
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={payment.id || index}
                  className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                    payment.status === "SUCCESS"
                      ? "border-emerald-200 shadow-xl ring-1 ring-emerald-500/20"
                      : payment.status === "FAILED"
                      ? "border-red-200 shadow-sm"
                      : payment.status === "PENDING"
                      ? "border-amber-200 shadow-sm"
                      : "border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-lg"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Reference
                        </p>
                        <h3 className="mt-1 truncate text-base font-semibold text-slate-900">
                          {payment.reference}
                        </h3>
                        {payment.member && (
                          <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                            <User size={12} />
                            {payment.member.fullname}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusInfo.border} ${statusInfo.bg} ${statusInfo.text}`}
                      >
                        <StatusIcon size={12} />
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="mt-4 border-b border-slate-200 pb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-emerald-600">
                          ₦{Number(payment.amount || 0).toLocaleString()}
                        </span>
                        <span className="font-medium text-slate-500">
                          /{frequencyLabels[payment.frequency]?.toLowerCase() || payment.frequency?.toLowerCase() || "month"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={14} />
                        <span>Due: {formatDate(payment.due)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Hash size={14} />
                        <span>Date: {formatDate(payment.date || payment.createdAt)}</span>
                      </div>
                      {payment.pricing && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <CreditCard size={14} />
                          <span>Plan: {payment.pricing.title || payment.pricing.code || "N/A"}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Debt
                          </p>
                          <p className={`mt-1 text-2xl font-bold ${Number(payment.debt || 0) > 0 ? "text-amber-600" : "text-slate-900"}`}>
                            ₦{Number(payment.debt || 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Verified
                          </p>
                          <p className={`mt-1 text-2xl font-bold ${payment.isVerified ? "text-emerald-600" : "text-slate-400"}`}>
                            {payment.isVerified ? "Yes" : "No"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="grid gap-2">
                        <button
                          onClick={() => router.push(`/admin/payments/${payment.id}`)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-emerald-600"
                          disabled={loading || paymentLoad === payment.id}
                        >
                          {loading || paymentLoad === payment.id ? (
                            <RefreshCcw className="animate-spin" size={16} />
                          ) : (
                            <Receipt size={16} />
                          )}
                          View Payment
                        </button>
                        <button
                          onClick={() => handleSendDemandNotice(payment)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                          disabled={loading || paymentLoad === payment.id}
                        >
                          {loading || paymentLoad === payment.id ? (
                            <RefreshCcw className="animate-spin" size={16} />
                          ) : (
                            <Bell size={16} />
                          )}
                          Send Demand Notice
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="mb-4 h-12 w-12 text-slate-300" />
                <h3 className="mb-2 text-lg font-semibold text-slate-700">No Payment Records Found</h3>
                <p className="mb-6 text-slate-600">No payment transactions have been recorded yet.</p>
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages} ({total} total records)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchPayments(page - 1)}
                disabled={page <= 1 || loading}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && arr[idx - 1] !== p - 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-sm text-slate-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => fetchPayments(p)}
                      disabled={loading}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                        p === page
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => fetchPayments(page + 1)}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
