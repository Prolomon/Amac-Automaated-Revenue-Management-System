"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Download, Eye, EyeOff, FileText, RefreshCw, ChevronLeft, ChevronRight, Filter, Check } from "lucide-react";
import { getDemandsByUser, resendDemand } from "@/lib/services/demand";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useParams } from 'next/navigation'

import { sendDemand } from "@/lib/services/demand";

function DemandsListPage() {
    const [demands, setDemands] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [resendLoading, setResendLoading] = useState(false);
    const { user, role } = useAuth();
    const { addToast } = useToast();
    const { id } = useParams();
    const [meta, setMeta] = useState<{ total: string; page: string; limit: string; totalPages: number }>({
        total: "0",
        page: "0",
        limit: "0",
        totalPages: 0,
    });

    const handleSendDemand = async () => {
        setLoading(true);
        const userId = id as string | undefined;
        if (!userId) {
            addToast("error", "Member does not have a valid User ID / UID");
            return;
        }

        try {
            const res = await sendDemand(userId);
            if (res.ok) {
                addToast("success", res.message || "Demand notice sent successfully");
                fetchDemands();
            } else {
                addToast("error", res.message || "Failed to send demand notice");
            }
        } catch (error: any) {
            console.error(error);
            addToast("error", error?.message || "Failed to send demand notice");
        } finally {
            setLoading(false);
        }
    };

    const [filters, setFilters] = useState<{
        status: string;
        startDate: string;
        endDate: string;
        page: string;
        limit: string;
    }>({
        status: "",
        startDate: "",
        endDate: "",
        page: "1",
        limit: "12",
    });

    const fetchDemands = useCallback(async () => {
        setLoading(true);
        try {
            if (!id) {
                addToast("error", "User ID Not Found");
                setLoading(false);
                return;
            }
            const response = await getDemandsByUser(
                id as string,
                filters.status || undefined,
                filters.startDate || undefined,
                filters.endDate || undefined,
                filters.page || undefined,
                filters.limit || undefined
            );
            if (response.ok && response.data) {
                setDemands(response.data);
                setMeta(response.meta);
            } else {
                addToast("error", response.message || "Failed to fetch demands");
            }
        } catch (err) {
            addToast("error", err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [addToast, id, filters]);

    useEffect(() => {
        fetchDemands();
    }, [fetchDemands]);

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
            month: "short",
            year: "numeric",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING":
                return "border-amber-200 bg-amber-50 text-amber-700";
            case "SENT":
                return "border-blue-200 bg-blue-50 text-blue-700";
            case "REJECTED":
                return "border-red-200 bg-red-50 text-red-700";
            default:
                return "border-slate-200 bg-slate-50 text-slate-700";
        }
    };

    const handleResend = async (demandId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setResendLoading(true);
        try {
            const response = await resendDemand(demandId);
            if (response.ok) {
                addToast("success", "Demand resent successfully");
                fetchDemands();
            } else {
                addToast("error", response.message || "Failed to resend demand");
            }
        } catch (err) {
            addToast("error", "Failed to resend demand");
        } finally {
            setResendLoading(false);
        }
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
            startDate: "",
            endDate: "",
            page: "1",
            limit: "12",
        });
    };

    const currentPage = parseInt(filters.page);
    const totalPages = meta.totalPages;
    const start = meta.total === "0" ? 0 : (currentPage - 1) * parseInt(filters.limit) + 1;
    const end = Math.min(currentPage * parseInt(filters.limit), parseInt(meta.total));

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

    const getDemandIdentifier = (demand: any, index: number) => {
        const ref = demand.reference || `#${index + 1}`;
        return `${ref}`;
    };

    return (
        <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
            {/* header  */}
            <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Demand Notice</h2>
                        <p className="mt-1 text-sm text-slate-600 md:text-base">
                            {meta.total} entities • Manage businesses and tax-paying entities
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <button
                            onClick={handleSendDemand}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50"
                        >
                            <FileText size={18} />
                            <span className="hidden sm:inline">Send Demand Notice</span>
                        </button>
                        <button
                            onClick={() => fetchDemands()}
                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 md:px-4"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        {role === "ADMIN" || (role === "STAFF" && user?.permission?.canCreateEntity) ? (
                            <>
                                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 md:px-4">
                                    <Download size={18} />
                                    <span className="hidden sm:inline">Export</span>
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl bg-white p-4 md:p-5 ring-1 ring-slate-100 shadow-sm">
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                        <div className="relative w-full">
                            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-transparent py-2.5 pl-10 pr-4 text-sm text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
                            >
                                <option value="">All Status</option>
                                <option value="PENDING">PENDING</option>
                                <option value="SENT">SENT</option>
                                <option value="REJECTED">REJECTED</option>
                                <option value="PAID">PAID</option>
                            </select>
                        </div>

                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange("startDate", e.target.value)}
                            placeholder="Start Date"
                            className="w-full rounded-xl border border-slate-300 bg-transparent py-2.5 px-4 text-sm text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
                        />

                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange("endDate", e.target.value)}
                            min={filters.startDate || undefined}
                            placeholder="End Date"
                            className="w-full rounded-xl border border-slate-300 bg-transparent py-2.5 px-4 text-sm text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
                        />

                        <select
                            value={filters.limit}
                            onChange={(e) => handleFilterChange("limit", e.target.value)}
                            className="flex-1 rounded-xl border border-slate-300 bg-transparent px-4 py-2.5 text-sm text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
                        >
                            <option value="200">200 per page</option>
                            <option value="400">400 per page</option>
                            <option value="600">600 per page</option>
                            <option value="800">800 per page</option>
                            <option value="1000">1000 per page</option>
                        </select>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">Demand Catalog</p>
                        <h2 className="mt-1 text-lg font-semibold text-slate-900">All demand notices</h2>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <Check className="h-3.5 w-3.5" />
                        Collections ready
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {loading ? (
                        <div className="col-span-full py-16 text-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="mb-4 animate-spin">
                                    <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-emerald-600" />
                                </div>
                                <p className="font-medium text-slate-600">Loading demand notices...</p>
                            </div>
                        </div>
                    ) : demands.length === 0 ? (
                        <div className="col-span-full py-16 text-center">
                            <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Demands Found</h3>
                            <p className="text-slate-600">There are no demand notices for this center yet.</p>
                        </div>
                    ) : (
                        <>
                            {demands.map((demand, index) => (
                                <div key={demand.id} className="block">
                                    <div
                                        className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${demand.isSent
                                            ? "border-emerald-200 shadow-xl ring-1 ring-emerald-500/20"
                                            : "border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-lg"
                                            }`}
                                    >
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs uppercase tracking-wide text-slate-500">
                                                        {getDemandIdentifier(demand, index)}
                                                    </p>
                                                    <h3 className="mt-1 text-lg font-semibold capitalize text-slate-900">
                                                        {demand.member?.fullname || demand.member?.businessName || "Unknown Member"}
                                                    </h3>
                                                    <p className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                                                        {demand.member?.businessName ? 'BUSINESS' : 'INDIVIDUAL'}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${demand.isSent
                                                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                                        : "border border-amber-200 bg-amber-50 text-amber-700"
                                                        }`}
                                                >
                                                    {demand.isSent ? "Sent" : "Pending"}
                                                </span>
                                            </div>

                                            <div className="mt-5 border-b border-slate-200 pb-4">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-extrabold text-emerald-600">
                                                        {formatCurrency(demand.amount)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-slate-500">Contact Details</p>
                                                    <div className="space-y-2">
                                                        <div className="flex items-start gap-3">
                                                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                                            <span className="text-xs font-medium text-slate-700">
                                                                {demand.member?.email || "No email"}
                                                            </span>
                                                        </div>
                                                        {demand.member?.location && (
                                                            <div className="flex items-start gap-3">
                                                                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                                                <span className="text-xs font-medium text-slate-700">
                                                                    {demand.member.location.nearestBusStop || demand.member?.location?.city || "N/A"}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-start gap-3">
                                                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                                            <span className="text-xs font-medium text-slate-700">
                                                                {formatDate(demand.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                            Reference
                                                        </p>
                                                        <p className="mt-1 text-sm font-bold text-slate-900">
                                                            {demand.reference || "N/A"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                                            Status
                                                        </p>
                                                        <p className="mt-1 text-2xl font-bold text-emerald-600 capitalize">
                                                            {demand.status.toLowerCase()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-5">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Link href={`/admin/demands/${demand.id}`}
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                                                    >
                                                        <Eye size={16} />
                                                        View Details
                                                    </Link>
                                                    <button
                                                        onClick={(e) => demand.id && handleResend(demand.id, e)}
                                                        disabled={resendLoading || !demand.id}
                                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <RefreshCw className={resendLoading ? "animate-spin w-4 h-4" : "w-4 h-4"} />
                                                        Resend
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="border-t border-slate-100 pt-4 col-span-full ">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <p className="text-xs md:text-sm text-slate-600">
                                        Showing <span className="font-semibold text-slate-900">{start}-{end}</span> of{" "}
                                        <span className="font-semibold text-slate-900">{meta.total}</span> entries
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(String(Math.max(1, currentPage - 1)))}
                                            disabled={currentPage <= 1}
                                            className={`rounded-lg p-2 transition-colors ${currentPage <= 1 ? "cursor-not-allowed bg-slate-50 text-slate-300" : "text-emerald-600 hover:bg-emerald-50"}`}
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <div className="hidden md:flex items-center gap-1">
                                            {generatePageNumbers().map((page, idx) =>
                                                typeof page === "number" ? (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handlePageChange(String(page))}
                                                        className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
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
                                            className={`rounded-lg p-2 transition-colors ${currentPage >= totalPages ? "cursor-not-allowed bg-slate-50 text-slate-300" : "text-emerald-600 hover:bg-emerald-50"}`}
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

export default withAuth(DemandsListPage);