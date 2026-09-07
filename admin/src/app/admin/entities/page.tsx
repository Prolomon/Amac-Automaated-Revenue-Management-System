"use client";

import { useState, useEffect, useCallback } from "react";
import { usePageAccess } from "@/components/PageGuard";
import {
  Search,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building2,
  User,
} from "lucide-react";
import Link from "next/link";
import { getMembers, Member } from "@/lib/services/member";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getCenterId } from "@/lib/permissions";

export default function EntitiesPage() {
  const { user } = useAuth();
  const { readOnly } = usePageAccess();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [members, setMembers] = useState<Member[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [statusFilter, setStatusFilter] = useState("All");
  const [meta, setMeta] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });

  const centerId = getCenterId(user);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const memberData = await getMembers(page, limit, centerId);
      const list = Array.isArray(memberData?.data) ? memberData.data : [];
      setMembers(list);
      setMeta(
        memberData?.meta || {
          page,
          limit,
          total: list.length,
          totalPages: Math.max(1, Math.ceil(list.length / limit)),
        },
      );
    } catch (error) {
      addToast("error", "Failed to fetch entities. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [centerId, page, limit, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const id = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(id);
  }, [searchTerm, statusFilter, typeFilter]);

  const memberList = Array.isArray(members) ? members : [];
  const filteredMembers = memberList.filter((m) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesQuery =
      !q ||
      [m.uid, m.fullname, m.businessName, m.email, m.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" ? Boolean(m.status) : !Boolean(m.status));

    const matchesType =
      typeFilter === "All Types" || (m.type && m.type === typeFilter);

    return matchesQuery && matchesStatus && matchesType;
  });

  const escapeCSV = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return "";
    const s = typeof val === "string" ? val : String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const handleDownload = () => {
    try {
      const rows = filteredMembers.length ? filteredMembers : memberList;
      const headers = [
        "Entity ID",
        "Fullname",
        "Type",
        "Business Name",
        "Category",
        "Zone",
        "Email",
        "Phone",
        "Billing Frequency",
        "Status",
        "Created At",
      ];

      const lines = [
        headers.join(","),
        ...rows.map((r: any) =>
          [
            escapeCSV(r.uid),
            escapeCSV(r.fullname),
            escapeCSV(r.type),
            escapeCSV(r.businessName),
            escapeCSV(r.category),
            escapeCSV(r.zone),
            escapeCSV(r.email),
            escapeCSV(r.phone),
            escapeCSV(r.billingFrequency),
            escapeCSV(r.status ? "Active" : "Inactive"),
            escapeCSV(r.createdAt),
          ].join(","),
        ),
      ];

      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `AMAC_ENTITIES_${date}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      addToast("error", "Failed to export entities");
    }
  };

  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Top Banner matching IT Admins style */}
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Entities</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage businesses and tax-paying entities registered in your revenue center
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <button
            onClick={() => fetchData()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
          >
            <Download size={16} />
            Export
          </button>
          {!readOnly && (
            <Link
              href="/admin/entities/add"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 shadow-sm"
            >
              <Plus size={18} />
              Add Entity
            </Link>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
        {/* Filter Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 md:p-5 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, email or phone..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
            >
              <option value="All Types">All Types</option>
              <option value="BUSINESS">Business</option>
              <option value="INDIVIDUAL">Individual</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
            >
              <option value={100}>100 / page</option>
              <option value={200}>200 / page</option>
              <option value={500}>500 / page</option>
            </select>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
            <p className="text-xs text-slate-500">Loading entities...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 md:px-4">Entity</th>
                  <th className="px-3 py-3 md:px-4">Type</th>
                  <th className="px-3 py-3 md:px-4">Category</th>
                  <th className="px-3 py-3 md:px-4">Zone</th>
                  <th className="px-3 py-3 md:px-4">Contact</th>
                  <th className="px-3 py-3 md:px-4">Status</th>
                  <th className="px-3 py-3 md:px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((entity) => {
                    const isBusiness = entity.type === "BUSINESS";
                    const displayName = isBusiness
                      ? entity.businessName || entity.fullname
                      : entity.fullname || entity.businessName;

                    return (
                      <tr key={entity.uid || entity.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-4 md:px-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                isBusiness
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-purple-50 text-purple-600"
                              }`}
                            >
                              {isBusiness ? <Building2 size={16} /> : <User size={16} />}
                            </span>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/entities/${entity.uid}`}
                                className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors block truncate max-w-[220px]"
                              >
                                {displayName || "—"}
                              </Link>
                              <p className="text-xs text-slate-500 font-mono">{entity.uid}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 md:px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isBusiness
                                ? "bg-blue-50 text-blue-700"
                                : "bg-purple-50 text-purple-700"
                            }`}
                          >
                            {entity.type || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-4 md:px-4 text-slate-600">
                          <span
                            className="text-xs font-medium text-slate-700 block truncate max-w-[170px]"
                            title={entity.category}
                          >
                            {entity.category || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-4 md:px-4 text-slate-600">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            Zone {entity.zone || "A"}
                          </span>
                        </td>
                        <td className="px-3 py-4 md:px-4 text-slate-600">
                          <p className="text-xs text-slate-800 truncate max-w-[190px]">
                            {entity.email || "—"}
                          </p>
                          <p className="text-[11px] text-slate-500">{entity.phone || "—"}</p>
                        </td>
                        <td className="px-3 py-4 md:px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              entity.status
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {entity.status ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-3 py-4 md:px-4 text-right">
                          <Link
                            href={`/admin/entities/${entity.uid}`}
                            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center md:px-6">
                      <p className="text-slate-500 text-sm">No entities found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination matching IT Admins style */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs md:text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{start}-{end}</span> of{" "}
              <span className="font-semibold text-slate-900">{meta.total}</span> entities
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, meta.page - 1))}
                disabled={meta.page <= 1}
                className={`rounded-lg p-2 transition-colors ${
                  meta.page <= 1
                    ? "cursor-not-allowed bg-slate-50 text-slate-300"
                    : "text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-slate-600">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(meta.totalPages, meta.page + 1))}
                disabled={meta.page >= meta.totalPages}
                className={`rounded-lg p-2 transition-colors ${
                  meta.page >= meta.totalPages
                    ? "cursor-not-allowed bg-slate-50 text-slate-300"
                    : "text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
