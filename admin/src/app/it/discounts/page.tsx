"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Eye, FileText, RefreshCw, ChevronLeft, ChevronRight, Filter, CheckCircle2, Clock, Search, Tag, User, CreditCard } from "lucide-react";
import { getRequests, Request } from "@/lib/services/request";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getCenterId } from "@/lib/permissions";

function DiscountRequestsListPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, role } = useAuth();
  const { addToast } = useToast();
  const centerId = getCenterId(user);

  const [meta, setMeta] = useState<{ total: string | number; page: string | number; limit: string | number; totalPages: number }>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });

  const [filters, setFilters] = useState<{
    status: string;
    search: string;
    startDate: string;
    endDate: string;
    page: string;
    limit: string;
  }>({
    status: "",
    search: "",
    startDate: "",
    endDate: "",
    page: "1",
    limit: "12",
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getRequests({
        status: filters.status !== "" ? filters.status : undefined,
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        center: centerId || undefined,
        page: filters.page,
        limit: filters.limit,
      });

      if (response.ok && (response.data || response.requests)) {
        const list = response.data || response.requests || [];
        setRequests(list);
        if (response.meta) {
          setMeta(response.meta);
        }
      } else {
        addToast("error", response.message || "Failed to fetch requests");
      }
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "An error occurred fetching requests");
    } finally {
      setLoading(false);
    }
  }, [addToast, centerId, filters]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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
      month: "short",
      year: "numeric",
    });
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: "1" }));
  };

  const handlePageChange = (newPage: string) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      search: "",
      startDate: "",
      endDate: "",
      page: "1",
      limit: "12",
    });
  };

  const currentPage = Number(filters.page);
  const totalPages = Number(meta.totalPages) || 1;
  const totalRecords = Number(meta.total) || 0;
  const start = totalRecords === 0 ? 0 : (currentPage - 1) * Number(filters.limit) + 1;
  const end = Math.min(currentPage * Number(filters.limit), totalRecords);

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-teal-50 p-5 md:p-6 ring-1 ring-emerald-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                <Tag size={22} />
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Discount & Waiver Requests</h2>
            </div>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              {totalRecords} total requests • Review, evaluate, and approve discount requests from taxpayers
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              onClick={() => fetchRequests()}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 md:px-4 cursor-pointer"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="rounded-2xl bg-white p-4 md:p-5 ring-1 ring-slate-100 shadow-xs">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative w-full lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Search by member, payment ref, reason..."
                className="w-full rounded-xl border border-slate-300 bg-transparent py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* Status Dropdown */}
            <div className="relative w-full">
              <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-transparent py-2.5 pl-10 pr-4 text-sm text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="false">PENDING</option>
                <option value="true">APPROVED</option>
              </select>
            </div>

            {/* Start Date */}
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              placeholder="Start Date"
              className="w-full rounded-xl border border-slate-300 bg-transparent py-2.5 px-4 text-sm text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />

            {/* End Date */}
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              min={filters.startDate || undefined}
              placeholder="End Date"
              className="w-full rounded-xl border border-slate-300 bg-transparent py-2.5 px-4 text-sm text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Page Size:</span>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange("limit", e.target.value)}
                className="rounded-lg border border-slate-200 bg-transparent px-2.5 py-1 text-xs text-slate-600 outline-none transition focus:border-emerald-400"
              >
                <option value="12">12 per page</option>
                <option value="24">24 per page</option>
                <option value="48">48 per page</option>
                <option value="96">96 per page</option>
              </select>
            </div>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Request Grid */}
      <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-xs">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Applications</p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-900">Taxpayer Discount Requests</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              Pending Review
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approved
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-4 animate-spin">
                  <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-emerald-600" />
                </div>
                <p className="font-medium text-slate-600">Loading discount requests...</p>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Requests Found</h3>
              <p className="text-slate-600">There are no discount requests matching your filter criteria.</p>
            </div>
          ) : (
            <>
              {requests.map((req) => {
                const isApproved = req.status === "APPROVED";
                const originalAmount = req.payment?.amount || 0;
                const currentDiscount = req.payment?.discount || 0;
                const pricingTitle = req.payment?.pricing?.title || "Revenue Assessment";

                return (
                  <div key={req.id} className="block">
                    <div
                      className={`relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                        isApproved
                          ? "border-emerald-200 shadow-sm hover:shadow-md ring-1 ring-emerald-500/10"
                          : "border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md"
                      }`}
                    >
                      <div className="p-5">
                        {/* Header & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              REF: {req.payment?.reference || req.id.slice(0, 10)}
                            </span>
                            <h3 className="mt-1 text-base font-bold text-slate-900 line-clamp-1">
                              {req.member?.fullname || req.member?.businessName || "Unknown Taxpayer"}
                            </h3>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shrink-0 ${
                              isApproved
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {isApproved ? (
                              <>
                                <CheckCircle2 size={12} />
                                APPROVED
                              </>
                            ) : (
                              <>
                                <Clock size={12} />
                                PENDING
                              </>
                            )}
                          </span>
                        </div>

                        {/* Taxpayer & Assessment Meta */}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            <User size={12} />
                            {req.member?.type || "INDIVIDUAL"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            <CreditCard size={12} />
                            {pricingTitle}
                          </span>
                        </div>

                        {/* Financial Figures */}
                        <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Assessment Amount:</span>
                            <span className="font-semibold text-slate-700">{formatCurrency(originalAmount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Current Discount:</span>
                            <span className="font-bold text-emerald-600">{formatCurrency(currentDiscount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200 font-medium">
                            <span>Net Payable:</span>
                            <span className="font-extrabold text-slate-900">
                              {formatCurrency(Math.max(0, originalAmount - currentDiscount))}
                            </span>
                          </div>
                        </div>

                        {/* Reason / Request Detail */}
                        <div className="mt-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Request Reason</p>
                          <p className="mt-0.5 text-xs text-slate-700 line-clamp-2 bg-amber-50/50 p-2 rounded-lg border border-amber-100/60">
                            {req.reason || "No specific reason provided."}
                          </p>
                        </div>

                        {/* Date Info */}
                        <div className="mt-3 text-[11px] text-slate-400">
                          Requested on {formatDate(req.createdAt)}
                        </div>
                      </div>

                      {/* Action Link */}
                      <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                        <Link
                          href={`/it/discounts/${req.id}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white py-2.5 text-xs font-bold text-emerald-700 transition-all hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-xs"
                        >
                          <Eye size={14} />
                          Review Request Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination Controls */}
              <div className="border-t border-slate-100 pt-4 col-span-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <p className="text-xs md:text-sm text-slate-600">
                    Showing <span className="font-semibold text-slate-900">{start}-{end}</span> of{" "}
                    <span className="font-semibold text-slate-900">{totalRecords}</span> entries
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(String(Math.max(1, currentPage - 1)))}
                      disabled={currentPage <= 1}
                      className={`rounded-lg p-2 transition-colors ${
                        currentPage <= 1 ? "cursor-not-allowed bg-slate-50 text-slate-300" : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="hidden md:flex items-center gap-1">
                      {generatePageNumbers().map((page, idx) =>
                        typeof page === "number" ? (
                          <button
                            key={idx}
                            onClick={() => handlePageChange(String(page))}
                            className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {page}
                          </button>
                        ) : (
                          <span key={idx} className="px-2 text-slate-500">
                            {page}
                          </span>
                        )
                      )}
                    </div>
                    <div className="md:hidden">
                      <span className="text-sm font-medium text-slate-600">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>
                    <button
                      onClick={() => handlePageChange(String(Math.min(totalPages, currentPage + 1)))}
                      disabled={currentPage >= totalPages}
                      className={`rounded-lg p-2 transition-colors ${
                        currentPage >= totalPages ? "cursor-not-allowed bg-slate-50 text-slate-300" : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(DiscountRequestsListPage);