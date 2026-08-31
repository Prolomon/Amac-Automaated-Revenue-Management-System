"use client";
import { useEffect, useState, use, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Flag,
} from "lucide-react";
import { getPayment, Payment as PaymentType } from "@/lib/services/payments";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import { useReactToPrint } from "react-to-print";

export default function PaymentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const receiptRef = useRef(null);
  const { addToast } = useToast();

  const router = useRouter();
  const [payment, setPayment] = useState<PaymentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await getPayment(id);
        if (!mounted) return;
        const paymentData = response?.payment || null;
        setPayment(paymentData);
      } catch (e) {
        addToast("error", "Failed to fetch payment");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [addToast, id, setPayment]);

  const handleRetry = async () => {
    setLoading(true);
    try {
      const response = await getPayment(id);
      const paymentData = response?.payment || null;
      setPayment(paymentData);
    } catch (e) {
      addToast("error", "Failed to fetch payment");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.back();

  const formatDate = (iso: string | Date | null | undefined): string => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const formatCurrency = (amount: number) => {
    if (typeof amount !== "number") return "—";
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusConfig = (status: string) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case "SUCCESS":
        return {
          icon: CheckCircle,
          bg: "bg-emerald-100",
          text: "text-emerald-700",
          label: "Success",
        };
      case "PENDING":
        return {
          icon: Clock,
          bg: "bg-blue-100",
          text: "text-blue-700",
          label: "Pending",
        };
      case "FAILED":
        return {
          icon: XCircle,
          bg: "bg-rose-100",
          text: "text-rose-700",
          label: "Failed",
        };
      case "CANCELLED":
        return {
          icon: Ban,
          bg: "bg-slate-100",
          text: "text-slate-700",
          label: "Cancelled",
        };
      case "REFUNDED":
        return {
          icon: RefreshCw,
          bg: "bg-purple-100",
          text: "text-purple-700",
          label: "Refunded",
        };
      default:
        return {
          icon: AlertCircle,
          bg: "bg-slate-100",
          text: "text-slate-700",
          label: status || "Unknown",
        };
    }
  };

  const downloadAsPDF = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: () =>
      `Receipt_${payment?.member?.businessName}_${payment?.reference || id}_${new Date().toISOString().split("T")[0]}`,
  });

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-3xl space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 md:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-20 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="text-rose-600" size={48} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
            Payment not found
          </h2>
          <p className="text-sm md:text-base text-slate-600 mb-6">
            We couldn&apos;t find the requested payment record.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw size={18} />
              Retry
            </button>
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(payment.status);
  const StatusIcon = statusConfig.icon;

  const principal = Number(payment.debt > 0 ? payment.debt : payment.amount);
  const vat = principal * 0.075;
  const subtotal = principal + vat;

  // Get payment date and current date
  const paymentDate = new Date(payment?.date);
  const currentDate = new Date();

  // Calculate days overdue
  let daysOverdue = 0;
  // if (currentDate > paymentDate) {
  //   const diffTime = currentDate - paymentDate;
  //   daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // convert ms → days
  // }
  if (currentDate > paymentDate) {
    const diffTime = currentDate.getTime() - paymentDate.getTime(); // ✅ use getTime()
    daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // convert ms → days
  }

  // Penalty: 0.005% per day overdue
  const penaltyRatePerDay = 0.00005; // 0.005% = 0.00005
  const penalty = subtotal * penaltyRatePerDay * daysOverdue;

  const totalAmount = subtotal + penalty - Number(payment.discount || 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link
            href={`/it/demands/${payment?.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
          >
            <Flag size={18} />
            View Demand Notice
          </Link>
          <button
            onClick={downloadAsPDF}
            className="inline-flex items-center justify-center gap-2 rounded-xl border bg-emerald-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Download size={18} />
            Download Receipt
          </button>
        </div>
      </div>

      {/* Receipt */}
      <div
        ref={receiptRef}
        className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
      >
        {/* Receipt Header */}
        <div className="bg-linear-to-r from-emerald-500 to-emerald-600 p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Payment Receipt
              </h1>
              <p className="text-emerald-100 mt-1">Amac Revenue Collection</p>
            </div>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${statusConfig.bg} ${statusConfig.text} font-semibold`}
            >
              <StatusIcon size={20} />
              {statusConfig.label}
            </div>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Reference and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                Reference Number
              </p>
              <p className="text-lg font-mono font-semibold text-slate-900">
                {payment?.reference || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                Payment Date
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {formatDate(payment?.date ? payment?.date : new Date())}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          {/* Business Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Business Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Business Name
                </p>
                <p className="text-base font-medium text-slate-900">
                  {payment?.member?.businessName ||
                    payment?.member?.fullname ||
                    "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Business Type
                </p>
                <p className="text-base font-medium text-slate-900">
                  {payment?.member?.type || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  User ID
                </p>
                <p className="text-base font-mono text-slate-900">
                  {payment?.userId || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Billing Frequency
                </p>
                <p className="text-base font-medium text-slate-900">
                  {payment?.frequency || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Payment Frequency
                </p>
                <p className="text-base font-medium text-slate-900">
                  {payment?.frequency || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Due Date
                </p>
                <p className="text-base font-medium text-slate-900">
                  {formatDate(payment?.due || new Date())}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Partner Name
                </p>
                <p className="text-base font-medium text-slate-900">
                  {payment?.member?.companyData?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Agent Name
                </p>
                <p className="text-base font-medium text-slate-900">
                  {payment?.member?.agentData?.fullname || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          {/* Pricing Information */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Pricing Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Pricing Title
                </p>
                <p className="text-base font-medium text-slate-900">
                  {payment?.pricing?.title || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Pricing Code
                </p>
                <p className="text-base font-medium text-slate-900">
                  {payment?.pricing?.code || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Pricing Type
                </p>
                <p className="text-base font-medium text-slate-900">
                  {payment?.pricing?.type || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  Billing Frequency
                </p>
                <p className="text-base font-medium text-slate-900">
                  {payment?.pricing?.frequency || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200" />

          {/* Payment split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="bg-slate-50 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    Total Amount
                  </p>
                  <p className="text-3xl md:text-4xl font-bold text-slate-900">
                    {formatCurrency(totalAmount || 0)}
                  </p>
                </div>
              </div>
            </div>
            {/* Discount */}
            <div className="bg-amber-50 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-amber-600 mb-1">
                    Discount
                  </p>
                  <p className="text-3xl md:text-4xl font-bold text-amber-900">
                    {formatCurrency(payment?.discount || 0)}
                  </p>
                </div>
              </div>
            </div>
            {/* Amount Paid */}
            <div className="bg-emerald-50 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-emerald-600 mb-1">
                    Amount Paid
                  </p>
                  <p className="text-3xl md:text-4xl font-bold text-emerald-900">
                    {formatCurrency(payment?.paid || 0)}
                  </p>
                </div>
              </div>
            </div>
            {/* Amount Pending */}
            <div className="bg-amber-50 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-amber-600 mb-1">
                    Debt
                  </p>
                  <p className="text-3xl md:text-4xl font-bold text-amber-900">
                    {formatCurrency(payment?.debt || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div>
              <span className="font-medium">Created:</span>{" "}
              {formatDate(payment?.createdAt)}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>{" "}
              {formatDate(payment?.updatedAt)}
            </div>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 text-center">
          <p className="text-sm text-slate-600">
            This is an official receipt from Amac Revenue Collection System
          </p>
          <p className="text-xs text-slate-500 mt-1">
            For inquiries, please contact the revenue office with your reference
            number
          </p>
        </div>
      </div>
    </div>
  );
}
