"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  BarChart3,
  Users,
  ShieldCheck,
  Camera,
  Layers,
  ChevronRight,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { getAllEnumerators, Enumerator } from "@/lib/services/enumerator";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function EnumeratorsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [enumerators, setEnumerators] = useState<Enumerator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const fetchEnumerators = async () => {
    setLoading(true);
    try {
      const res = await getAllEnumerators({
        page,
        limit: 20,
        level: levelFilter !== "all" ? levelFilter : undefined,
        status: statusFilter !== "all" ? statusFilter === "active" : undefined,
        search: searchTerm.trim() || undefined,
      });

      if (res.ok) {
        setEnumerators(res.data || []);
        if (res.meta) setMeta(res.meta);
      }
    } catch (error: any) {
      addToast("error", error?.message || "Failed to load enumerators");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnumerators();
  }, [page, levelFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEnumerators();
  };

  const totalBasic = enumerators.filter((e) => e.level === "BASIC").length;
  const totalSuper = enumerators.filter((e) => e.level === "SUPER").length;

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enumeration Personnel</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage field enumerators, supervisors, captures, and daily tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/enumerators/analytics"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            View Analytics
          </Link>
          <Link
            href="/admin/enumerators/add"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add Enumerator
          </Link>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Personnel
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{meta.total || enumerators.length}</p>
          <p className="mt-1 text-xs text-slate-400">Registered in system</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Supervisors
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-purple-700">{totalSuper}</p>
          <p className="mt-1 text-xs text-slate-400">Approval managers</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Field Enumerators
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Camera className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-blue-700">{totalBasic}</p>
          <p className="mt-1 text-xs text-slate-400">Field capture agents</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Daily Target
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-700">50 / 50</p>
          <p className="mt-1 text-xs text-slate-400">Captures & Registrations @ ₦50</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={levelFilter}
            onChange={(e) => {
              setLevelFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="all">All Roles</option>
            <option value="BASIC">Field Enumerators</option>
            <option value="SUPER">Supervisors</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Disabled</option>
          </select>

          <button
            type="button"
            onClick={fetchEnumerators}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 transition"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Enumerator / Officer</th>
                <th className="px-5 py-3.5">Role Level</th>
                <th className="px-5 py-3.5">Center & Zone</th>
                <th className="px-5 py-3.5">Contact Details</th>
                <th className="px-5 py-3.5">Submissions</th>
                <th className="px-5 py-3.5">Wallet Balance</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <p className="mt-2 text-sm">Loading personnel data...</p>
                  </td>
                </tr>
              ) : enumerators.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 font-medium text-slate-600">No enumerators found</p>
                    <p className="text-xs text-slate-400">
                      Try adjusting your filters or click "Add Enumerator" to register new personnel.
                    </p>
                  </td>
                </tr>
              ) : (
                enumerators.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 uppercase">
                          {item.avatar ? (
                            <img
                              src={item.avatar}
                              alt={item.name}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            item.name.slice(0, 2)
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="font-mono text-xs text-slate-400">{item.uid}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.level === "SUPER"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.level === "SUPER" ? "Supervisor" : "Enumerator"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-slate-800">{item.center}</p>
                      <p className="text-[11px] text-slate-400">Zone {item.zone || "A"}</p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Phone className="h-3 w-3 text-slate-400" /> {item.phone}
                      </p>
                      {item.altPhone && (
                        <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                          WA: {item.altPhone}
                        </p>
                      )}
                      <p className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate max-w-[180px]">
                        <Mail className="h-3 w-3 text-slate-400" /> {item.email}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 text-xs">
                        <span title="Properties Captured">
                          📸 <strong>{item._count?.properties || 0}</strong>
                        </span>
                        <span title="Entities Registered">
                          🏢 <strong>{item._count?.members || 0}</strong>
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        ₦{(item.wallets?.[0]?.balance || 0).toLocaleString()}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400">
                        {item.wallets?.[0]?.accountNo || "Ledger Ready"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          item.status
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status ? "Active" : "Disabled"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/enumerators/${item.uid}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <span>
              Page {meta.page} of {meta.totalPages} ({meta.total} records)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-600 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
                className="rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-600 disabled:opacity-40"
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
