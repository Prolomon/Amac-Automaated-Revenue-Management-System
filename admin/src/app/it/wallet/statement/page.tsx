"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Calendar,
  Download,
  Loader2,
  RefreshCw,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getStatementData } from "@/lib/services/wallet";
import { getCenterId } from "@/lib/permissions";
import { useReactToPrint } from "react-to-print";

const getDefaultFromDate = () =>
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

const getDefaultToDate = () =>
  new Date().toISOString().split("T")[0];

function StatementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const urlCenterId = searchParams?.get("centerId") || "";
  const centerId = urlCenterId || getCenterId(user) || "";
  const displayName = user?.adminName || user?.center || "Abuja Municipal Area Council (AMAC)";

  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(getDefaultFromDate());
  const [toDate, setToDate] = useState(getDefaultToDate());

  const [statementData, setStatementData] = useState<any>(null);

  const statementPrintRef = useRef<HTMLDivElement>(null);

  const reactToPrintFn = useReactToPrint({
    contentRef: statementPrintRef,
    documentTitle: `AMAC_Monthly_Statement_${fromDate}_to_${toDate}`,
  });

  const fetchStatement = useCallback(async () => {
    if (!centerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getStatementData(centerId, fromDate, toDate);
      if (res?.ok) {
        setStatementData(res);
      } else {
        addToast("error", res?.message || "Failed to fetch statement data");
        setStatementData(null);
      }
    } catch (err: any) {
      addToast(
        "error",
        err?.message || "An error occurred while fetching statement data"
      );
      setStatementData(null);
    } finally {
      setLoading(false);
    }
  }, [centerId, fromDate, toDate, addToast]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? Number(amount) : amount;
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(num || 0);
  };

  const formatDateDisplay = (dateStr?: string | Date) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-NG", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const meta = statementData?.meta || {};
  const collectionSummary = statementData?.collectionSummary || { streams: [], totals: {} };
  const disbursementSchedule = statementData?.disbursementSchedule || { stakeholders: [], totals: {} };
  const performanceMetrics = statementData?.performanceMetrics || {
    channelBreakdown: { pos: {}, bankTransfer: {}, webPortal: {} },
    reconciliation: {},
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 ring-1 ring-emerald-100 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/it/wallet")}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              aria-label="Back to wallet"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Monthly Statement of Account
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Review and print revenue collection statements for{" "}
                <span className="font-semibold text-slate-800">
                  {meta.displayName || displayName}
                </span>
                .
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchStatement}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => reactToPrintFn()}
              disabled={loading || !statementData}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Download / Print
            </button>
          </div>
        </div>
      </div>

      {/* Simplified Filters (From Date, To Date, Refresh, Download) */}
      <div className="rounded-2xl bg-white p-4 md:p-5 ring-1 ring-slate-200 shadow-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              From Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              To Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
              <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setFromDate(getDefaultFromDate());
                setToDate(getDefaultToDate());
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={fetchStatement}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {!centerId && (
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 text-amber-800 text-sm font-medium">
          No center ID was found in the session or URL. Statement records may not be accurate.
        </div>
      )}

      {loading && !statementData ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl ring-1 ring-slate-100 shadow-xs space-y-3">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading statement details...</p>
        </div>
      ) : (
        /* Actual Statement Document Component */
        <div
          ref={statementPrintRef}
          className="bg-white border border-slate-200 shadow-md rounded-xl overflow-hidden my-2 max-w-5xl mx-auto w-full text-slate-800 font-sans"
        >
          {/* Header */}
          <div className="bg-emerald-800 text-white px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-wide">TR3-G INNOVATIONS LIMITED</h1>
              <p className="text-emerald-100 text-sm">Unified Revenue Management Solution</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-lg font-semibold">{meta.displayName || displayName}</p>
              <p className="text-emerald-100 text-sm">Monthly Statement of Account</p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="px-8 py-6 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm bg-slate-50/50">
            <div>
              <span className="block text-slate-500 uppercase text-xs tracking-wide font-medium">Statement Period</span>
              <span className="font-semibold text-slate-800">
                {formatDateDisplay(fromDate)} – {formatDateDisplay(toDate)}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 uppercase text-xs tracking-wide font-medium">Statement Reference</span>
              <span className="font-semibold text-slate-800">{meta.reference || "AMAC-TR3G-SOA-2026"}</span>
            </div>
            <div>
              <span className="block text-slate-500 uppercase text-xs tracking-wide font-medium">Generation Date</span>
              <span className="font-semibold text-slate-800">{formatDateDisplay(meta.generationDate || new Date())}</span>
            </div>
            <div>
              <span className="block text-slate-500 uppercase text-xs tracking-wide font-medium">Technical Partner / Agent</span>
              <span className="font-semibold text-slate-800">PayPoint Collections Ltd (Zone B)</span>
            </div>
            <div>
              <span className="block text-slate-500 uppercase text-xs tracking-wide font-medium">Partner ID</span>
              <span className="font-semibold text-slate-800">TP-AMAC-{centerId ? centerId.slice(-6).toUpperCase() : "2026"}</span>
            </div>
            <div>
              <span className="block text-slate-500 uppercase text-xs tracking-wide font-medium">Settlement Bank &amp; Account</span>
              <span className="font-semibold text-slate-800">
                {meta.bankDetails?.bankName || "Access Bank"} / {meta.bankDetails?.accountNumber || "0012345678"}
              </span>
            </div>
          </div>

          {/* Section 1: Monthly Collection Summary */}
          <div className="px-8 py-6">
            <h2 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <span className="inline-block w-2 h-5 bg-amber-500 rounded-sm"></span>
              1. Monthly Collection Summary
            </h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-emerald-800 text-white text-left">
                    <th className="px-4 py-3 font-semibold">Revenue Stream / Head</th>
                    <th className="px-4 py-3 font-semibold text-right">Demand Notices Issued</th>
                    <th className="px-4 py-3 font-semibold text-right">Paid Transactions</th>
                    <th className="px-4 py-3 font-semibold text-right">Gross Collections (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {collectionSummary.streams && collectionSummary.streams.length > 0 ? (
                    collectionSummary.streams.map((stream: any, i: number) => (
                      <tr key={i} className="odd:bg-white even:bg-slate-50 hover:bg-slate-100/50">
                        <td className="px-4 py-3 font-medium text-slate-800">{stream.revenueHead}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{(stream.demandNotices || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{(stream.paidTransactions || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">
                          {formatCurrency(stream.grossCollections)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        No collection records found for this statement period.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-amber-50 border-t-2 border-amber-500 font-bold">
                    <td className="px-4 py-3 text-slate-800">TOTAL GROSS COLLECTIONS</td>
                    <td className="px-4 py-3 text-right text-slate-800">
                      {(collectionSummary.totals?.demandNotices || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-800">
                      {(collectionSummary.totals?.paidTransactions || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-800 text-base">
                      {formatCurrency(collectionSummary.totals?.grossCollections || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 2: Revenue Split & Disbursement Schedule */}
          <div className="px-8 py-6 bg-slate-50/70 border-t border-b border-slate-200">
            <h2 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <span className="inline-block w-2 h-5 bg-amber-500 rounded-sm"></span>
              2. Revenue Split &amp; Disbursement Schedule
            </h2>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm bg-white">
                <thead>
                  <tr className="bg-emerald-800 text-white text-left">
                    <th className="px-4 py-3 font-semibold">Stakeholder / Beneficiary</th>
                    <th className="px-4 py-3 font-semibold text-right">Agreed Split Ratio (%)</th>
                    <th className="px-4 py-3 font-semibold text-right">Gross Entitlement (₦)</th>
                    <th className="px-4 py-3 font-semibold text-right">Deductions / Withholding (₦)</th>
                    <th className="px-4 py-3 font-semibold text-right">Net Payable Amount (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {disbursementSchedule.stakeholders && disbursementSchedule.stakeholders.map((s: any, i: number) => (
                    <tr key={i} className="odd:bg-white even:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{Number(s.ratio).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(s.gross)}</td>
                      <td className="px-4 py-3 text-right text-rose-600 font-medium">
                        {formatCurrency(s.deductions)}{" "}
                        {s.label && <span className="text-xs text-slate-400 font-normal">{s.label}</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(s.net)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-amber-50 border-t-2 border-amber-500 font-bold">
                    <td className="px-4 py-3 text-slate-800">TOTAL SETTLEMENT DISBURSED</td>
                    <td className="px-4 py-3 text-right text-slate-800">
                      {Number(disbursementSchedule.totals?.ratio || 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-slate-800">
                      {formatCurrency(disbursementSchedule.totals?.gross || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-600">
                      {formatCurrency(disbursementSchedule.totals?.deductions || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-800 text-base">
                      {formatCurrency(disbursementSchedule.totals?.net || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 3: Transaction Performance Metrics */}
          <div className="px-8 py-6">
            <h2 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <span className="inline-block w-2 h-5 bg-amber-500 rounded-sm"></span>
              3. Transaction Performance Metrics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Collection Channel Breakdown */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">
                  Collection Channel Breakdown
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5 font-medium">
                      <span className="text-slate-600">POS Terminals</span>
                      <span className="text-slate-800">
                        {formatCurrency(performanceMetrics.channelBreakdown?.pos?.amount || 0)} (
                        {performanceMetrics.channelBreakdown?.pos?.percentage || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-700 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${performanceMetrics.channelBreakdown?.pos?.percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5 font-medium">
                      <span className="text-slate-600">Bank Transfer / Remita</span>
                      <span className="text-slate-800">
                        {formatCurrency(performanceMetrics.channelBreakdown?.bankTransfer?.amount || 0)} (
                        {performanceMetrics.channelBreakdown?.bankTransfer?.percentage || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${performanceMetrics.channelBreakdown?.bankTransfer?.percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5 font-medium">
                      <span className="text-slate-600">Web Portal</span>
                      <span className="text-slate-800">
                        {formatCurrency(performanceMetrics.channelBreakdown?.webPortal?.amount || 0)} (
                        {performanceMetrics.channelBreakdown?.webPortal?.percentage || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-slate-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${performanceMetrics.channelBreakdown?.webPortal?.percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reconciliation Status */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">
                  Reconciliation &amp; Discrepancy Status
                </h3>
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Total Successful Direct Gateway Settlements</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(performanceMetrics.reconciliation?.successfulSettlements || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-slate-600">Unreconciled / Flagged Transactions</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {formatCurrency(performanceMetrics.reconciliation?.unreconciledAmount || 0)} (
                    {performanceMetrics.reconciliation?.unreconciledPercentage || 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="px-8 py-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 bg-slate-50/30">
            <div>
              <div className="border-b border-slate-400 h-12"></div>
              <p className="mt-2 text-sm font-semibold text-slate-800">Prepared By</p>
              <p className="text-xs text-slate-500">Head of Finance &amp; Operations — TR3-G Innovations Limited</p>
            </div>
            <div>
              <div className="border-b border-slate-400 h-12"></div>
              <p className="mt-2 text-sm font-semibold text-slate-800">Verified &amp; Approved By</p>
              <p className="text-xs text-slate-500">Chief Revenue Officer (CRO) — Abuja Municipal Area Council (AMAC)</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-800 text-slate-300 text-xs text-center py-3 font-medium">
            TR3-G Innovations Limited | Confidential Revenue Statement — Page 1 of 1
          </div>
        </div>
      )}
    </div>
  );
}

function StatementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        </div>
      }
    >
      <StatementContent />
    </Suspense>
  );
}

export default withAuth(StatementPage);
