/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import { Download, ArrowLeft, RefreshCw, Landmark, Globe, Printer } from "lucide-react";
import { getDemand, Demand, resendDemand } from "@/lib/services/demand";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import withAuth from "@/components/withAuth";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";

function DemandDetailPage() {
  const params = useParams<{ id: string }>();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, role } = useAuth();
  const { addToast } = useToast();
  const demandDocumentRef = useRef(null);
  const printFn = useReactToPrint({
    contentRef: demandDocumentRef,
    documentTitle: () => `Demand_Notice_${new Date().toISOString().split('T')[0]}`,
  });

  const fetchDemand = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDemand(params.id);
      if (response.ok && response.data) {
        setDemand(response.data);
      } else {
        addToast("error", response.message || "Demand not found");
      }
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [addToast, params.id]);

  useEffect(() => {
    fetchDemand();
  }, [fetchDemand]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (date?: Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleDownload = async () => {
    // 1. Dynamically import html2pdf inside the click handler
    const html2pdf = (await import("html2pdf.js")).default;

    const element = demandDocumentRef.current;
    if (element) {
      const a4HeightMm = 292;
      const pxToMm = 0.264583; // conversion factor
      const elementHeightMm = element.scrollHeight * pxToMm;
      const scale = a4HeightMm / elementHeightMm;

      element.style.transform = `print:scale(${scale})`;
      element.style.transformOrigin = 'print:top print:left';
      
      const opt = {
        margin: 0,
        filename: `${demand?.member?.businessName || demand?.member?.fullname}-demand-document-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
        pagebreak: { mode: 'none' }
      };

      // 3. Generate the PDF
      html2pdf().set(opt).from(element).save();
    }
  };

  const handleResend = async () => {
    try {
      const response = await resendDemand(demand?.id || "");

      if (response.ok) {
        addToast("success", "Demand resent successfully");

        fetchDemand();
      } else {
        addToast("error", response.message || "Failed to resend demand");
      }
    } catch (err) {
      addToast("error", "Failed to resend demand");
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
          {/* Header Skeleton */}
          <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
            <div className="animate-pulse flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 space-y-3">
                <div className="h-8 w-48 rounded-lg bg-slate-200" />
                <div className="h-4 w-96 rounded bg-slate-200" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-24 rounded-xl bg-slate-200" />
                <div className="h-10 w-24 rounded-xl bg-slate-200" />
                <div className="h-10 w-24 rounded-xl bg-slate-200" />
              </div>
            </div>
          </div>

          {/* Document Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
            <div className="animate-pulse space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <div className="h-8 w-64 rounded bg-slate-200" />
                  <div className="h-4 w-48 rounded bg-slate-200" />
                  <div className="h-3 w-32 rounded bg-slate-200" />
                </div>
                <div className="space-y-2 w-64">
                  <div className="h-4 w-full rounded bg-slate-200" />
                  <div className="h-4 w-full rounded bg-slate-200" />
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                </div>
              </div>

              <div className="h-px w-full bg-slate-200" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="h-5 w-48 rounded bg-slate-200" />
                  <div className="h-4 w-40 rounded bg-slate-200" />
                  <div className="h-4 w-36 rounded bg-slate-200" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-32 rounded bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-slate-200" />
                    <div className="h-4 w-full rounded bg-slate-200" />
                    <div className="h-4 w-2/3 rounded bg-slate-200" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-4 w-40 rounded bg-slate-200" />
                <div className="h-24 w-full rounded-lg border border-slate-200 bg-slate-50" />
              </div>

              <div className="space-y-3">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-32 w-full rounded-lg border border-slate-200" />
              </div>

              <div className="space-y-3">
                <div className="h-4 w-40 rounded bg-slate-200" />
                <div className="h-24 w-full rounded-lg border border-slate-200 bg-slate-50" />
              </div>

              <div className="h-px w-full bg-slate-200" />

              <div className="flex justify-between items-start gap-8">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-20 rounded bg-slate-200" />
                  <div className="h-px w-48 bg-slate-200" />
                  <div className="h-4 w-32 rounded bg-slate-200" />
                </div>
                <div className="h-24 w-72 rounded-lg border border-amber-200 bg-amber-50" />
              </div>

              <div className="h-12 w-full rounded-lg bg-slate-900" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!demand) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Demand Not Found</h3>
            <p className="text-slate-600 mb-4">The demand notice you are looking for does not exist or has been removed.</p>
            <Link
              href="/admin/demands"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Demands
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pricingName = demand?.payment?.pricing?.title || 'Revenue Assessment';

  // Calculate for single payment
  const principal = Number(demand?.payment?.amount);
  const vat = principal * 0.075;
  const charges = principal * 0.015;
  const subtotal = principal + vat + charges;
  const penalty = subtotal * 0.1;
  const interest = subtotal * 0.05;
  const totalAmount = subtotal + penalty + interest;

  // Build location string
  let locationStr = 'N/A';
  if (demand?.member?.location) {
    try {
      const loc = typeof demand?.member?.location === 'string'
        ? JSON.parse(demand?.member?.location)
        : demand?.member?.location;
      const parts = [];
      if (loc.address) parts.push(loc.address);
      if (loc.city) parts.push(loc.city);
      if (loc.state) parts.push(loc.state);
      if (loc.lga) parts.push(loc.lga);
      if (loc.country) parts.push(loc.country);
      locationStr = parts.length > 0 ? parts.join(', ') : 'N/A';
    } catch {
      locationStr = String(demand?.member?.location);
    }
  }

  // Generate QR code URL
  const qrData = JSON.stringify({
    userId: demand?.member?.uid,
    paymentId: demand?.payment?.id,
    amount: totalAmount,
  });
  const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=240`;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="mx-auto max-w-7xl space-y-4 px-4 md:p-6">
        {/* Header Actions */}
        <div className="rounded-2xl bg-linear-to-r from-blue-50 via-white to-purple-50 p-5 md:p-6 ring-1 ring-blue-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">DEMAND NOTICE</h2>
              <p className="mt-1 text-xs font-semibold text-sky-600 md:text-sm">
                Notice under Section 29 of the Tax Procedures Act, 2015
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Reference: AMAC/DN/{new Date().getFullYear()}/{demand.reference} | Issued on: {formatDate(demand.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => fetchDemand()}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 cursor-pointer"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              {role === "ADMIN" || (role === "STAFF" && user?.permission?.canCreateEntity) ? (
                <>
                  <button
                    onClick={printFn}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                  >
                    <Printer size={16} />
                    <span className="hidden sm:inline">Print</span>
                  </button>
                  <button
                    onClick={handleResend}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Resend</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download PDF</span>
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Main Document */}
        <div
          className="w-full my-0 mx-auto bg-white p-12.5 rounded-xl shadow-[0_4px_20px_rgba(15,23,42,0.04),0_1px_3px_rgba(15,23,42,0.02)] box-border relative border border-[#e2e8f0]"
          ref={demandDocumentRef}
        >
          {/* <!-- Top Bar Branding --> */}
          <div className="flex justify-between items-start mb-7.5">
            <div className="flex flex-col">
              <div
                className="flex items-center text-[24px] font-extrabold text-[#0f172a] tracking-tight"
              >
                <span className="text-emerald-500 mr-2 flex items-center">

                  <Image src="/icon.png" alt="AMAC Icon" width={32} height={32} />
                </span>
                AMAC
              </div>
              <div
                className="text-[11px] text-emerald-600 font-bold tracking-widest mt-0.5"
              >
                AMAC REVENUE MANAGEMENT SYSTEM
              </div>
              <div className="text-[#64748b] text-[11px] mt-1.5 font-normal">
                Automated Revenue & Compliance Framework
              </div>
            </div>

            <div className="text-right text-[12px] text-[#64748b] line-height-[1.5]">
              <strong className="text-[#0f172a] text-[14px] font-bold">FCT Revenue Administration</strong>
              <br />
              Revenue & Tax Solutions Division<br />
              Abuja Municipal Area Council Secretariat, Abuja<br />
              Email: info@amac-revenue.ng<br />
              Website: www.amac-revenue.ng
            </div>
          </div>

          <div className="border-t border-[#e2e8f0] my-6.25 mx-0 mb-8.75"></div>

          {/* <!-- Document Context Header --> */}
          <div
            className="mb-7.5 bg-[#f0fff9] py-4 px-6 rounded-lg border-l-4 border-emerald-600"
          >
            <div className="text-[#0f172a] text-[18px] font-extrabold tracking-tight">
              DEMAND NOTICE
            </div>
          </div>

          {/* <!-- Split Meta Information Dashboard --> */}
          <div className="grid grid-cols-[1.2fr_0.8fr] gap-10 mb-8.75">
            <div className="bg-transparent">
              <div
                className="text-[11px] uppercase tracking-wider text-[#64748b] font-bold mb-2"
              >
                Taxpayer / Entity Details
              </div>
              <div className="text-[13px] text-[#1e293b]">
                <strong className="text-[15px] text-[#0f172a] font-bold"
                >{demand?.member?.businessName || demand?.member?.fullname}</strong
                ><br />
                {locationStr}<br /><br />
                <strong className="font-bold">Taxpayer TIN:</strong> {demand?.member?.uid}
              </div>
            </div>
            <div>
              <div
                className="text-[11px] uppercase tracking-wider text-[#64748b] font-bold mb-2"
              >
                Notice System Metadata
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td
                      className="text-[#64748b] font-medium w-32.5 py-1 px-0 border-b border-dashed border-[#e2e8f0]"
                    >
                      Reference No:
                    </td>
                    <td
                      className="font-semibold text-[#0f172a] text-right py-1 px-0 border-b border-dashed border-[#e2e8f0]"
                    >
                      AMAC/DN/{new Date().getFullYear()}/{demand?.reference || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="text-[#64748b] font-medium w-32.5 py-1 px-0 border-b border-dashed border-[#e2e8f0]"
                    >
                      Date of Issue:
                    </td>
                    <td
                      className="font-semibold text-[#0f172a] text-right py-1 px-0 border-b border-dashed border-[#e2e8f0]"
                    >
                      {new Date(demand?.createdAt).toLocaleDateString() || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="text-[#64748b] font-medium w-32.5 py-1 px-0 border-b border-dashed border-[#e2e8f0]"
                    >
                      Assessment Period:
                    </td>
                    <td
                      className="font-semibold text-[#0f172a] text-right py-1 px-0 border-b border-dashed border-[#e2e8f0]"
                    >
                      {new Date(demand?.payment?.createdAt).toLocaleDateString() || "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      className="text-[#64748b] font-medium w-32.5 py-1 px-0 border-b-0"
                    >
                      Audit Track Code:
                    </td>
                    <td
                      className="font-semibold text-[#0f172a] text-right py-1 px-0 border-b-0"
                    >
                      {`AUD/${new Date().getFullYear()}/${Math.floor(Math.random() * 999)}`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* <!-- Notice Context text block --> */}
          <div
            className="mb-8.75 text-[#1e293b] text-[13px] bg-white border border-[#e2e8f0] p-5 rounded-lg"
          >
            <p className="m-0 mb-2.5">
              <strong className="font-bold">OFFICIAL DEMAND NOTICE</strong>
            </p>
            <p className="m-0 mb-2.5">
              This document serves as a formal Demand Notice issued by the Abuja
              Municipal Area Council (AMAC) Revenue Administration. It constitutes
              an official assessment of outstanding tax liabilities, penalties, and
              accrued interest against your entity as itemized in the liability
              breakdown below.
            </p>
            <p className="m-0 mb-0">
              This notice is generated under the authority of the Federal Revenue
              Administration Framework and carries the full weight of legal
              enforcement provisions.
            </p>
          </div>

          {/* <!-- Core Transaction Layout Grid --> */}
          <div className="grid grid-cols-[1.3fr_0.7fr] gap-7.5 mb-8.75">
            <div>
              <div
                className="text-[11px] uppercase tracking-wider text-[#64748b] font-bold mb-2"
              >
                Liability Breakdown
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th
                      className="bg-[#f1f5f9] text-[#64748b] font-bold text-left py-3 px-4 text-[11px] uppercase tracking-wider border-b-2 border-[#e2e8f0]"
                    >
                      Revenue Component Description
                    </th>
                    <th
                      className="bg-[#f1f5f9] text-[#64748b] font-bold text-right py-3 px-4 text-[11px] uppercase tracking-wider border-b-2 border-[#e2e8f0] w-32.5"
                    >
                      Amount (₦)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* <!-- Placeholder row mimicking loop dynamic outputs safely --> */}
                  <tr className="font-medium text-[#1e293b]">
                    <td className="py-3.5 px-4 border-b border-[#e2e8f0]">{pricingName} - Principal Assessment</td>
                    <td className="py-3.5 px-4 border-b border-[#e2e8f0] text-right w-32.5">{formatCurrency(principal)}</td>
                  </tr>
                  <tr className="font-medium text-[#1e293b]">
                    <td className="py-3.5 px-4 border-b border-[#e2e8f0]">Value Added Tax (VAT) @ 7.5%</td>
                    <td className="py-3.5 px-4 border-b border-[#e2e8f0] text-right w-32.5">{formatCurrency(vat)}</td>
                  </tr>
                  <tr className="font-medium text-[#1e293b]">
                    <td className="py-3.5 px-4 border-b border-[#e2e8f0]">Payment Processing Charges @ 1.5%</td>
                    <td className="py-3.5 px-4 border-b border-[#e2e8f0] text-right w-32.5">{formatCurrency(charges)}</td>
                  </tr>
                  <tr className="font-semibold bg-[#f8fafc] text-[#0f172a]">
                    <td className="py-3.5 px-4 border-b border-[#e2e8f0]">
                      Subtotal (Principal + VAT + Charges)
                    </td>
                    <td
                      className="py-3.5 px-4 border-b border-[#e2e8f0] text-right w-32.5"
                    >
                      {formatCurrency(subtotal)}
                    </td>
                  </tr>
                  <tr className="font-medium text-[#1e293b]">
                    <td className="py-3.5 px-4 border-b border-[#e2e8f0]">
                      Penalty Accrued Over Time
                    </td>
                    <td
                      className="py-3.5 px-4 border-b border-[#e2e8f0] text-right w-32.5"
                    >
                      {formatCurrency(penalty)}
                    </td>
                  </tr>
                  <tr className="font-medium text-[#1e293b]">
                    <td className="py-3.5 px-4 border-b border-[#e2e8f0]">
                      Interest Accrued
                    </td>
                    <td
                      className="py-3.5 px-4 border-b border-[#e2e8f0] text-right w-32.5"
                    >
                      {formatCurrency(interest)}
                    </td>
                  </tr>
                  <tr
                    className="bg-[#0f172a] text-white font-bold text-[15px] [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] border-0"
                  >
                    <td className="p-4 rounded-l-md">
                      TOTAL COMPLIANCE AMOUNT PAYABLE
                    </td>
                    <td
                      className="p-4 rounded-r-md text-right w-32.5 text-[#38bdf8] font-extrabold text-[16px] tracking-wide"
                    >
                      {formatCurrency(totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="italic text-[11px] text-[#64748b] mt-3">
                * Interest charges continue to accumulate iteratively daily until
                the exact financial settlement position registers as zero.
              </div>
            </div>

            {/* <!-- Visual Pay Now Sidebar Panel --> */}
            <div
              className="border border-[#e2e8f0] rounded-lg p-6 text-center bg-[#f8fafc] flex flex-col items-center"
            >
              <div
                className="text-[#0f172a] font-extrabold text-[14px] tracking-tight mb-1"
              >
                SECURE WEB GATEWAY
              </div>
              <div className="text-[11px] text-[#64748b] mb-5">
                Scan via AMAC Mobile or Banking apps.
              </div>

              <div
                className="w-full border border-[#e2e8f0] rounded-md mb-5 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.02)] aspect-square overflow-hidden object-cover"
              >
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-60 h-60 object-cover"
                />
              </div>

              <div
                className="text-[11px] text-[#64748b] font-600 uppercase tracking-wider mb-1"
              >
                System Payment Reference
              </div>
              <div
                className="font-mono font-bold text-[#009966] text-[14px] bg-white py-1.5 px-3 border border-[#e2e8f0] rounded mb-5 tracking-wide"
              >
                {demand?.payment?.reference || "N/A"}
              </div>

              <div className="text-[10px] text-[#64748b] leading-normal">
                This verification signature profile matches this demand note
                instance specifically. Do not replicate.
              </div>
            </div>
          </div>

          {/* <!-- Lower Layout Meta Channels --> */}
          <div className="grid grid-cols-[1.3fr_0.7fr] gap-7.5 mb-8.75">
            <div className="border border-[#e2e8f0] rounded-lg p-5 bg-white">
              <div
                className="text-[#0f172a] font-bold text-[12px] mb-3.5 tracking-wider"
              >
                OTHER PAYMENT OPTIONS
              </div>

              {/* settlement account */}
              <div className="grid grid-cols-[0.7fr_1.3fr] gap-7.5 mb-4 pb-4 border-b border-[#e2e8f0]">
                <div className="flex items-center text-[12px] text-[#1e293b] last:mb-0 gap-3.5">
                  <Landmark size={18} />
                  <span><b>Settlement Account</b></span>
                </div>
                <div className="text-[#1e293b] font-semibold text-[12px] flex flex-col items-start gap-1">
                  <span><b>Account Number: </b>1310770007</span>
                  <span><b>Bank Name: </b>Zenith Bank</span>
                  <span><b>Account Name: </b>AMAC Revenue Account</span>
                </div>
              </div>

              {/* payment account */}
              <div className="grid grid-cols-[0.7fr_1.3fr] gap-7.5 mb-4 pb-4 border-b border-[#e2e8f0]">
                <div className="flex items-center text-[12px] text-[#1e293b] last:mb-0 gap-3.5">
                  <Landmark size={18} />
                  <span><b>Payment Account</b></span>
                </div>
                <div className="text-[#1e293b] font-semibold text-[12px] flex flex-col items-start gap-1">
                  <span><b>Account Number: </b>1310770007</span>
                  <span><b>Bank Name: </b>Zenith Bank</span>
                  <span><b>Account Name: </b>AMAC Revenue Account</span>
                </div>
              </div>

              {/* pay on website */}
              <div className="grid grid-cols-[0.7fr_1.3fr] gap-7.5">
                <div className="flex items-center text-[12px] text-[#1e293b] last:mb-0 gap-3.5">
                  <Globe size={18} />
                  <span><b>Pay on Website</b></span>
                </div>
                <div className="text-[#1e293b] font-semibold text-[12px] flex flex-col items-start gap-1">
                  <span><b>AMAC/DN/2026/{demand?.reference}</b></span>
                </div>
              </div>
            </div>

            <div className="border border-[#e2e8f0] rounded-lg p-5 bg-white">
              <div
                className="text-[#0f172a] font-bold text-[12px] mb-3.5 tracking-wider"
              >
                REVENUE ASSISTANCE HELP DESK
              </div>

              <div
                className="flex items-center mb-3 text-[12px] text-[#1e293b] last:mb-0"
              >
                <svg
                  className="text-[#64748b] mr-3 shrink-0"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                  />
                </svg>
                <span>0700-REVENUE-AMAC</span>
              </div>

              <div
                className="flex items-center mb-3 text-[12px] text-[#1e293b] last:mb-0"
              >
                <svg
                  className="text-[#64748b] mr-3 shrink-0"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>support@amac.ng</span>
              </div>

              <div
                className="flex items-center mb-3 text-[12px] text-[#1e293b] last:mb-0"
              >
                <svg
                  className="text-[#64748b] mr-3 shrink-0"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Abuja Municipal Area Council Secretariat, Abuja</span>
              </div>
            </div>
          </div>

          {/* <!-- Sign-off System Block Layout --> */}
          <div className="grid grid-cols-2 gap-10 items-end mb-12.5">
            <div className="text-[13px]">
              <div className="font-bold text-[#0f172a]">Regards,</div>
              <div className="h-11.25"></div>
              <div className="border-b border-[#e2e8f0] mb-6.25 w-50"></div>
              <div className="font-bold text-[#0f172a]">Adekunle Adeyanju</div>
              <div className="text-[#64748b] text-[12px]">
                Director of Audit & Compliance Division<br />Amac Revenue
                Management System
              </div>
            </div>

            <div
              className="border border-[#fde047] bg-[#fffbeb] rounded-lg p-5 flex items-start"
            >
              <div
                className="bg-[#b45309] text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] mr-3 shrink-0"
              >
                !
              </div>
              <div className="text-[12px] text-[#b45309] leading-relaxed">
                <strong
                  className="block mb-1 uppercase text-[11px] tracking-wider font-bold"
                >System Notice Note:</strong
                >
                This is an automated legal financial document statement. If matching
                payment records have cleared recently, disregard and present
                verification codes to the portal to update.
              </div>
            </div>
          </div>

          {/* <!-- Seamless Edge-to-Edge Footer Strip --> */}
          <div
            className="bg-[#0f172a] text-white py-4 px-7.5 flex justify-between items-center text-[12px] mt-12.5 -mx-12.5 -mb-12.5 rounded-b-xb"
          >
            <div className="flex items-center opacity-80">
              <svg
                className="mr-2 text-[#009966]"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Ensuring fiscal optimization through unified digital integrity.
            </div>
            <div className="flex items-center">
              <svg
                className="mr-2 opacity-60"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path
                  d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                />
              </svg>
              <a
                href="https://www.amac-revenue.ng"
                target="_blank"
                className="text-white no-underline font-semibold"
              >portal.amac-revenue.ng</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(DemandDetailPage);
