"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMembers } from "@/lib/services/member";
import { getPayments, Payment } from "@/lib/services/payments";
import { getCompanies, Company } from "@/lib/services/company";
import { getPricingByCenter, Pricing } from "@/lib/services/pricing";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Building2,
  Tag,
  DollarSign,
  AlertCircle,
  XCircle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdvancedSearchPage() {
  const { user, role } = useAuth();
  const { addToast } = useToast();
  const centerId = role === "ADMIN" ? user?.uid : user?.center;
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [selectedPricingId, setSelectedPricingId] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [lateFilter, setLateFilter] = useState("all"); // 'all' | 'late' | 'ontime'
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  if (role !== "ADMIN" && user?.permission?.canSearch !== true) {
    router.push("/admin");
  }

  // Tab State
  const [activeTab, setActiveTab] = useState<"payments" | "members">("payments");

  // Fetch all relevant data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!centerId) {
        setLoading(false);
        return;
      }

      const [paymentsRes, membersRes, companiesRes, pricingRes] = await Promise.all([
        getPayments(centerId).catch(() => ({ ok: false, payments: [] })),
        getMembers(1, 1000, centerId).catch(() => ({ ok: false, data: [] })),
        getCompanies(centerId, 1, 100).catch(() => ({ ok: false, data: [] })),
        getPricingByCenter(centerId).catch(() => ({ ok: false, data: [] })),
      ]);

      setPayments(paymentsRes?.payments || []);
      setMembers(membersRes?.data || []);
      setCompanies(companiesRes?.data || []);
      setPricing(pricingRes?.data || []);

      addToast("success", "Data loaded for advanced search");
    } catch (error: any) {
      addToast("error", "Failed to fetch search data");
    } finally {
      setLoading(false);
    }
  }, [centerId, addToast]);

  useEffect(() => {
    if (user?.uid) {
      fetchData();
    }
  }, [user?.uid, fetchData]);

  // Reset Filters
  const handleReset = () => {
    setSearchTerm("");
    setSelectedPartnerId("");
    setSelectedPricingId("");
    setMinAmount("");
    setMaxAmount("");
    setSelectedStatus("");
    setLateFilter("all");
    setDateFrom("");
    setDateTo("");
    addToast("success", "Filters reset");
  };

  // Helper to normalize status strings
  const getStatusUpper = (status: string) => {
    return String(status || "").toUpperCase();
  };

  // 1. FILTERED PAYMENTS
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Search Term Filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const refMatch = String(p.reference || "").toLowerCase().includes(query);
        const nameMatch = String(p.payment || "").toLowerCase().includes(query);
        const methodMatch = String(p.payment || "").toLowerCase().includes(query);
        const userMatch = String(p.userId || "").toLowerCase().includes(query);
        if (!refMatch && !nameMatch && !methodMatch && !userMatch) {
          return false;
        }
      }

      // Partner/Company Filter (Impersonation check)
      // Matches payment's company field directly
      if (selectedPartnerId) {
        const paymentCompany = p.company;
        if (paymentCompany !== selectedPartnerId) {
          return false;
        }
      }

      // Pricing Plan Filter
      if (selectedPricingId) {
        // Match the payment type / category
        const paymentType = String(p.payment || "").toUpperCase();
        const pricingPlan = pricing.find((pr) => pr.id === selectedPricingId);
        const pricingTitle = String(pricingPlan?.title || "").toUpperCase();
        const pricingCat = String(pricingPlan?.category || "").toUpperCase();
        if (!paymentType.includes(pricingTitle) && !paymentType.includes(pricingCat)) {
          return false;
        }
      }

      // Amount Range Filter
      const amt = Number(p.amount);
      if (minAmount && amt < Number(minAmount)) {
        return false;
      }
      if (maxAmount && amt > Number(maxAmount)) {
        return false;
      }

      // Status Filter
      if (selectedStatus) {
        const pStatus = getStatusUpper(p.status);
        if (pStatus !== getStatusUpper(selectedStatus)) {
          return false;
        }
      }

      // Date Range Filter
      if (dateFrom && p.createdAt) {
        const fromDate = new Date(dateFrom);
        const paymentDate = new Date(p.createdAt);
        if (paymentDate < fromDate) return false;
      }
      if (dateTo && p.createdAt) {
        const toDate = new Date(dateTo);
        // Set to end of day so full day is included
        toDate.setHours(23, 59, 59, 999);
        const paymentDate = new Date(p.createdAt);
        if (paymentDate > toDate) return false;
      }

      // Late / Overdue Filter
      if (lateFilter !== "all") {
        const pStatus = getStatusUpper(p.status);
        const isCompleted = pStatus === "COMPLETED" || pStatus === "SUCCESS";
        const isOverdue = p.due && new Date() > new Date(p.due);

        if (lateFilter === "late") {
          // Late means not completed and past its due date
          if (isCompleted || !isOverdue) return false;
        }
        if (lateFilter === "ontime") {
          // On-time means completed or not yet due
          if (!isCompleted && isOverdue) return false;
        }
      }

      return true;
    });
  }, [payments, pricing, searchTerm, selectedPartnerId, selectedPricingId, minAmount, maxAmount, selectedStatus, lateFilter, dateFrom, dateTo]);

  // 2. FILTERED MEMBERS
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search Term Filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const nameMatch = String(m.fullname || m.businessName || "").toLowerCase().includes(query);
        const emailMatch = String(m.email || "").toLowerCase().includes(query);
        const phoneMatch = String(m.phone || "").toLowerCase().includes(query);
        const uidMatch = String(m.uid || "").toLowerCase().includes(query);
        if (!nameMatch && !emailMatch && !phoneMatch && !uidMatch) {
          return false;
        }
      }

      // Partner/Company Filter (Impersonation check)
      if (selectedPartnerId) {
        const memberCompany = m.company || m.companyId;
        if (memberCompany !== selectedPartnerId) {
          return false;
        }
      }

      // Pricing Plan Filter
      if (selectedPricingId) {
        const memberPricing = Array.isArray(m.pricing)
          ? m.pricing
          : typeof m.pricing === "string"
            ? m.pricing.split(",")
            : [];
        if (!memberPricing.includes(selectedPricingId)) {
          return false;
        }
      }

      return true;
    });
  }, [members, searchTerm, selectedPartnerId, selectedPricingId]);

  function truncateSentence(count: number, sentence: string) {
    return sentence.length > count ? sentence.slice(0, count) + '...' : sentence;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header Pattern */}
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Search className="text-emerald-600" size={28} />
              Advanced Search Engine
            </h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              Search & filter payments, impersonate partners, and verify member pricing fees.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw size={16} />
            Sync Data
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg border-b border-slate-100 pb-3">
          <SlidersHorizontal className="text-emerald-600" size={18} />
          Filter Parameters
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {/* Text Search Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Text Query</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference, name, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-700"
              />
            </div>
          </div>

          {/* Partner Dropdown (Remove Chevron with appearance-none) */}
          <div className="space-y-1 relative">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
              <Building2 size={13} className="text-emerald-600" />
              Partner (Impersonation)
            </label>
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none text-slate-700"
            >
              <option value="">All Partners</option>
              {companies.map((c) => (
                <option key={c.uid || c.id} value={c.uid || c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Category Dropdown (Remove Chevron with appearance-none) */}
          <div className="space-y-1 relative">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
              <Tag size={13} className="text-emerald-600" />
              Pricing Plan / Fees
            </label>
            <select
              value={selectedPricingId}
              onChange={(e) => setSelectedPricingId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none text-slate-700"
            >
              <option value="">All Pricing Fees</option>
              {pricing.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.category}) - ₦{Number(p.price || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown (Remove Chevron with appearance-none) */}
          <div className="space-y-1 relative">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed / Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Price Range: Min */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
              <DollarSign size={13} className="text-emerald-600" />
              Min Price (₦)
            </label>
            <input
              type="number"
              placeholder="e.g. 10000"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-700"
            />
          </div>

          {/* Price Range: Max */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1">
              <DollarSign size={13} className="text-emerald-600" />
              Max Price (₦)
            </label>
            <input
              type="number"
              placeholder="e.g. 30000"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-700"
            />
          </div>

          {/* Date Range: From */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-700"
            />
          </div>

          {/* Date Range: To */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-700"
            />
          </div>

          {/* Late/Overdue filter Dropdown (Remove Chevron with appearance-none) */}
          <div className="space-y-1 relative">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule / Due State</label>
            <select
              value={lateFilter}
              onChange={(e) => setLateFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none text-slate-700"
            >
              <option value="all">All Schedules</option>
              <option value="late">Late Payments / Overdue Only</option>
              <option value="ontime">On-time / Active Only</option>
            </select>
          </div>

          {/* Clear Button */}
          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="w-full rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 text-sm font-semibold text-rose-600 transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "payments"
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          Payments ({filteredPayments.length})
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "members"
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          Members / Payers ({filteredMembers.length})
        </button>
      </div>

      {/* Results Area */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-emerald-600" size={32} />
            <p>Scanning datasets and compiling results...</p>
          </div>
        ) : activeTab === "payments" ? (
          <div>
            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <XCircle className="mx-auto text-slate-300 mb-2" size={32} />
                No payments match your current filter parameters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-max w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm">Reference</th>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm">Payer UID</th>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm">Payment Type</th>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm">Frequency</th>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm">Date / Due</th>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm">Amount</th>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((p) => {
                      const pStatus = getStatusUpper(p.status);
                      const isOverdue = p.due && new Date() > new Date(p.due) && pStatus !== "COMPLETED" && pStatus !== "SUCCESS";

                      return (
                        <tr key={p.reference || p.userId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-4 font-mono text-xs text-slate-600 md:px-4 md:text-sm">
                            <Link
                              href={`/admin/payments/${p.reference}`}
                              className="text-slate-700 font-semibold hover:text-emerald-600 transition"
                            >
                              {truncateSentence(17, p.reference) || "—"}
                            </Link>
                          </td>
                          <td className="px-3 py-4 text-xs text-slate-600 md:px-4 md:text-sm">
                            <Link
                              href={`/admin/entities/${p.userId}`}
                              className="text-slate-600 hover:text-emerald-600 transition underline decoration-dotted"
                            >
                              {truncateSentence(14, p.userId) || "—"}
                            </Link>
                          </td>
                          <td className="px-3 py-4 text-xs text-slate-700 md:px-4 md:text-sm">
                            {truncateSentence(14, p.payment) || "—"}
                          </td>
                          <td className="px-3 py-4 text-xs text-slate-700 md:px-4 md:text-sm">
                            {p.frequency || "—"}
                          </td>
                          <td className="px-3 py-4 text-xs text-slate-700 md:px-4 md:text-sm">
                            <div className="space-y-0.5">
                              <div>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</div>
                              {p.due && (
                                <div className={`text-[11px] font-medium flex items-center gap-1 ${isOverdue ? "text-rose-600" : "text-slate-500"}`}>
                                  {isOverdue && <AlertCircle size={10} />}
                                  Due: {new Date(p.due).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-xs font-bold text-slate-900 md:px-4 md:text-sm">
                            ₦{Number(p.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-4 text-xs md:px-4 md:text-sm">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${pStatus === "COMPLETED" || pStatus === "SUCCESS"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : pStatus === "PENDING"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                            >
                              {p.status || "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredMembers.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <XCircle className="mx-auto text-slate-300 mb-2" size={32} />
                No members match your current filter parameters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-max w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm">UID</th>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm">Full Name / Business</th>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm">Email</th>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm">Phone</th>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm">Category</th>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm">Zone</th>
                      <th className="px-3 py-3 text-xs font-semibold text-slate-700 md:px-4 md:text-sm text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.map((m) => (
                      <tr key={m.uid || m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-4 font-mono text-xs font-semibold text-slate-700 md:px-4 md:text-sm">
                          {m.uid || "—"}
                        </td>
                        <td className="px-3 py-4 text-xs font-bold text-slate-800 md:px-4 md:text-sm">
                          {truncateSentence(12, m.businessName) || truncateSentence(12, m.fullname) || "—"}
                        </td>
                        <td className="px-3 py-4 text-xs text-slate-600 md:px-4 md:text-sm">
                          {truncateSentence(12, m.email) || "—"}
                        </td>
                        <td className="px-3 py-4 text-xs text-slate-600 md:px-4 md:text-sm">
                          {truncateSentence(12, m.phone) || "—"}
                        </td>
                        <td className="px-3 py-4 text-xs text-slate-600 md:px-4 md:text-sm">
                          <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            {m.category || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-xs text-slate-600 md:px-4 md:text-sm">
                          {m.zone ? `Zone ${m.zone}` : "—"}
                        </td>
                        <td className="px-3 py-4 text-xs text-center md:px-4 md:text-sm">
                          <Link
                            href={`/admin/entities/${m.uid || m.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
                          >
                            Manage
                            <ChevronRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
