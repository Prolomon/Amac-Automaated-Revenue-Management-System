/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Printer,
  CheckCircle2,
  Clock,
  User,
  CreditCard,
  Building,
  MapPin,
  Mail,
  Phone,
  FileText,
  Percent,
  Check,
  X,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import {
  getRequest,
  approveRequest,
  updateRequestStatus,
  Request as RequestData,
} from "@/lib/services/request";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import withAuth from "@/components/withAuth";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";

function DiscountRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<string>("");
  const [decisionNotes, setDecisionNotes] = useState<string>("");

  const { user, role } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const printDocumentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printDocumentRef,
    documentTitle: () => `Discount_Request_${request?.id || new Date().toISOString().split("T")[0]}`,
  });

  const fetchRequestDetail = useCallback(async () => {
    setLoading(true);
    try {
      if (!params.id) {
        addToast("error", "Invalid request ID");
        setLoading(false);
        return;
      }

      const response = await getRequest(params.id);

      if (response.ok && (response.data || response.request)) {
        const reqData = response.data || response.request || null;
        setRequest(reqData);
        if (reqData?.payment?.discount) {
          setDiscountAmount(String(reqData.payment.discount));
        }
      } else {
        addToast("error", response.message || "Request not found");
      }
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [addToast, params.id]);

  useEffect(() => {
    fetchRequestDetail();
  }, [fetchRequestDetail]);

  const formatCurrency = (amount?: number | null) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(Number(amount || 0));
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (date?: string | Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleApprove = async () => {
    if (!request?.id) return;
    const discountVal = parseFloat(discountAmount);
    if (isNaN(discountVal) || discountVal < 0) {
      addToast("error", "Please enter a valid discount amount");
      return;
    }

    const originalAmount = Number(request.payment?.amount || 0);
    if (discountVal > originalAmount) {
      addToast("error", "Discount amount cannot exceed the total assessment amount");
      return;
    }

    setActionLoading(true);
    try {
      const response = await approveRequest(request.id, {
        status: true,
        discount: discountVal,
        reason: decisionNotes || request.reason,
        approverId: user?.uid || undefined,
      });

      if (response.ok) {
        addToast("success", "Discount request approved successfully");
        fetchRequestDetail();
      } else {
        addToast("error", response.message || "Failed to approve discount request");
      }
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!request?.id) return;
    setActionLoading(true);
    try {
      const response = await updateRequestStatus(request.id, {
        status: false,
        reason: decisionNotes || request.reason,
        approverId: user?.uid || undefined,
      });

      if (response.ok) {
        addToast("success", "Request marked as pending / rejected");
        fetchRequestDetail();
      } else {
        addToast("error", response.message || "Failed to update request status");
      }
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  // Location string helper
  let locationStr = "N/A";
  if (request?.member?.location) {
    try {
      const loc =
        typeof request.member.location === "string"
          ? JSON.parse(request.member.location)
          : request.member.location;
      const parts = [];
      if (loc.address) parts.push(loc.address);
      if (loc.city) parts.push(loc.city);
      if (loc.state) parts.push(loc.state);
      if (loc.lga) parts.push(loc.lga);
      if (loc.country) parts.push(loc.country);
      locationStr = parts.length > 0 ? parts.join(", ") : "N/A";
    } catch {
      locationStr = String(request.member.location);
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen py-8">
        <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
          <div className="rounded-2xl bg-white p-8 animate-pulse space-y-4 border border-slate-200">
            <div className="h-8 w-64 bg-slate-200 rounded" />
            <div className="h-4 w-96 bg-slate-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="h-64 bg-slate-100 rounded-xl" />
              <div className="h-64 bg-slate-100 rounded-xl" />
              <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-slate-50 min-h-screen py-8">
        <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Request Not Found</h3>
            <p className="text-slate-600 mb-5">
              The discount or waiver request you are looking for does not exist or has been removed.
            </p>
            <Link
              href="/admin/discounts"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Discount Requests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isApproved = request.status === true;
  const assessmentAmount = Number(request.payment?.amount || 0);
  const currentDiscount = Number(request.payment?.discount || 0);
  const pricingTitle = request.payment?.pricing?.title || "Revenue Assessment";

  return (
    <div className="min-h-screen bg-slate-50 py-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 md:px-6">
        {/* Top Header & Navigation */}
        <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-teal-50 p-5 md:p-6 ring-1 ring-emerald-100 shadow-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => router.push("/admin/discounts")}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                  Discount Application #{request.id.slice(0, 8)}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    isApproved
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {isApproved ? (
                    <>
                      <CheckCircle2 size={13} />
                      APPROVED
                    </>
                  ) : (
                    <>
                      <Clock size={13} />
                      PENDING REVIEW
                    </>
                  )}
                </span>
              </div>
              <p className="mt-1 text-xs md:text-sm text-slate-500 ml-11">
                Submitted on {formatDateTime(request.createdAt)} • Ref: {request.payment?.reference || "N/A"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => fetchRequestDetail()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Printer size={16} />
                <span>Print Form</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3-Column Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Request Info & Justification */}
          <div className="rounded-2xl bg-white p-5 md:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="rounded-lg bg-amber-100 p-2 text-amber-700">
                  <FileText size={18} />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Request Information</h3>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Request ID</span>
                  <p className="font-mono font-bold text-slate-800 break-all">{request.id}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Application Reason</span>
                  <p className="mt-1 rounded-xl bg-amber-50/60 p-3 text-slate-800 border border-amber-200/60 text-xs leading-relaxed font-medium">
                    {request.reason || "No detailed justification supplied."}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</span>
                  <p className="font-bold text-slate-800">
                    {isApproved ? "Approved & Granted" : "Pending Evaluation"}
                  </p>
                </div>

                {request.approver && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reviewed By</span>
                    <p className="font-medium text-slate-800">
                      {request.approver.adminName || request.approver.email} ({request.approver.center || "HQ"})
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
              Last updated: {formatDateTime(request.updatedAt)}
            </div>
          </div>

          {/* Card 2: Taxpayer / Member Info */}
          <div className="rounded-2xl bg-white p-5 md:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="rounded-lg bg-blue-100 p-2 text-blue-700">
                  <User size={18} />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Taxpayer Details</h3>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Name / Business</span>
                  <p className="font-bold text-slate-900 text-base">
                    {request.member?.businessName || request.member?.fullname || "N/A"}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-bold uppercase">
                    {request.member?.type || "INDIVIDUAL"}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-medium">
                    UID: {request.member?.uid || request.memberId}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{request.member?.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span>{request.member?.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{locationStr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-slate-400 shrink-0" />
                    <span>Center: {request.member?.center || "General Center"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href={`/admin/entities/${request.member?.uid || request.memberId}`}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
              >
                View Full Taxpayer Profile →
              </Link>
            </div>
          </div>

          {/* Card 3: Payment & Assessment Details */}
          <div className="rounded-2xl bg-white p-5 md:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                  <CreditCard size={18} />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Payment Assessment</h3>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Assessment Title</span>
                  <p className="font-bold text-slate-800">{pricingTitle}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Payment Reference</span>
                  <p className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block">
                    {request.payment?.reference || request.paymentId}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gross Assessment:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(assessmentAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Discount:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(currentDiscount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-bold text-slate-700">{formatCurrency(request.payment?.paid || 0)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                    <span className="text-slate-700">Net Balance / Debt:</span>
                    <span className="text-slate-900">
                      {formatCurrency(Math.max(0, assessmentAmount - currentDiscount - Number(request.payment?.paid || 0)))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                href={`/admin/payments/${request.payment?.id || request.paymentId}`}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
              >
                View Complete Assessment →
              </Link>
            </div>
          </div>
        </div>

        {/* Action / Evaluation Decision Panel */}
        <div className="rounded-2xl bg-white p-6 md:p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Administrative Decision Panel</h3>
              <p className="text-xs text-slate-500">
                Grant discount approval or reject the waiver request with an official note.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Discount Amount to Grant (₦)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  ₦
                </span>
                <input
                  type="number"
                  min="0"
                  max={assessmentAmount}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 text-base font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500">Quick calculate:</span>
                <button
                  type="button"
                  onClick={() => setDiscountAmount(String(Math.round(assessmentAmount * 0.1)))}
                  className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 hover:bg-slate-200"
                >
                  10% ({formatCurrency(assessmentAmount * 0.1)})
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountAmount(String(Math.round(assessmentAmount * 0.25)))}
                  className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 hover:bg-slate-200"
                >
                  25% ({formatCurrency(assessmentAmount * 0.25)})
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountAmount(String(Math.round(assessmentAmount * 0.5)))}
                  className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 hover:bg-slate-200"
                >
                  50% ({formatCurrency(assessmentAmount * 0.5)})
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Approval / Audit Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Enter remarks or justification for the granted waiver..."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 cursor-pointer"
            >
              <X size={16} />
              <span>{isApproved ? "Revoke / Set Pending" : "Reject Request"}</span>
            </button>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
            >
              <Check size={16} />
              <span>{actionLoading ? "Processing..." : isApproved ? "Update Approved Discount" : "Approve Discount"}</span>
            </button>
          </div>
        </div>

        {/* Printable Official Document Layout (Hidden from screen view, shown on print) */}
        <div className="hidden">
          <div
            ref={printDocumentRef}
            className="w-full bg-white p-8 text-slate-800 text-xs box-border border border-slate-200"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
              <div>
                <div className="text-xl font-extrabold text-slate-900 tracking-tight">AMAC REVENUE MANAGEMENT</div>
                <div className="text-emerald-700 font-bold text-xs mt-0.5">Automated Revenue & Compliance Framework</div>
                <div className="text-slate-500 text-[11px] mt-1">Abuja Municipal Area Council, FCT Abuja</div>
              </div>
              <div className="text-right text-[11px] text-slate-600">
                <strong>DISCOUNT & WAIVER APPLICATION</strong>
                <br />
                Ref No: AMAC/DISC/{request.id}
                <br />
                Date: {formatDate(request.createdAt)}
              </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                  Taxpayer Information
                </div>
                <div>
                  <strong>{request.member?.businessName || request.member?.fullname}</strong>
                  <br />
                  Member ID: {request.member?.uid}
                  <br />
                  Email: {request.member?.email}
                  <br />
                  Phone: {request.member?.phone}
                  <br />
                  Address: {locationStr}
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3">
                <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                  Assessment Information
                </div>
                <div>
                  <strong>Assessment: {pricingTitle}</strong>
                  <br />
                  Payment Ref: {request.payment?.reference}
                  <br />
                  Original Amount: {formatCurrency(assessmentAmount)}
                  <br />
                  Discount Granted: {formatCurrency(request.payment?.discount || parseFloat(discountAmount) || 0)}
                  <br />
                  Status: {isApproved ? "APPROVED" : "PENDING"}
                </div>
              </div>
            </div>

            {/* Reason Block */}
            <div className="border border-slate-200 rounded-lg p-4 mb-6 bg-slate-50">
              <div className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">
                Stated Justification / Note
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                {request.reason || "No detailed justification supplied."}
              </p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 mt-8">
              <div>
                <div className="border-b border-slate-400 pb-8 mb-1" />
                <div className="font-bold text-slate-900">Taxpayer Signature</div>
                <div className="text-[10px] text-slate-500">Applicant Verification</div>
              </div>
              <div>
                <div className="border-b border-slate-400 pb-8 mb-1" />
                <div className="font-bold text-slate-900">Revenue Authorizing Officer</div>
                <div className="text-[10px] text-slate-500">Audit & Waiver Approval Division</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(DiscountRequestDetailPage);
