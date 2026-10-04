"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Shield,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getITStaffs, deleteITStaff, ITStaff } from "@/lib/services/itStaff";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";

export default function ITStaffsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [staffs, setStaffs] = useState<ITStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStaffs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getITStaffs({
        page,
        limit: 50,
        search: searchTerm.trim() || undefined,
      });
      if (res.ok && Array.isArray(res.data)) {
        setStaffs(res.data);
        setMeta(res.meta || { page, limit: 50, total: res.data.length, totalPages: 1 });
      } else {
        setStaffs([]);
      }
    } catch (err: any) {
      addToast("error", err?.message || "Failed to fetch IT Staffs");
      setStaffs([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, addToast]);

  useEffect(() => {
    fetchStaffs();
  }, [fetchStaffs]);

  const handleDelete = async (uid: string, name: string) => {
    if (!confirm(`Are you sure you want to delete IT Staff "${name}"?`)) return;
    setDeletingId(uid);
    try {
      await deleteITStaff(uid);
      addToast("success", `IT Staff "${name}" deleted successfully`);
      fetchStaffs();
    } catch (err: any) {
      addToast("error", err?.message || "Failed to delete IT Staff");
    } finally {
      setDeletingId(null);
    }
  };

  const countPermissions = (permissions?: any) => {
    if (!permissions || typeof permissions !== "object") return 0;
    let count = 0;
    for (const res of Object.values(permissions)) {
      if (res && typeof res === "object") {
        for (const act of Object.values(res as any)) {
          if (act === true) count++;
        }
      }
    }
    return count;
  };

  return (
    <div className="mx-auto space-y-6 p-4 md:p-6 font-['Inter',sans-serif]">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 font-['JetBrains_Mono',monospace]">
            <Shield size={14} />
            Access & Security
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 font-['Space_Grotesk',sans-serif]">
            IT Staff Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure IT team accounts with custom resource-level permissions (e.g. payment.read, member.create).
          </p>
        </div>

        <Link
          href="/it/it-staffs/add"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus size={18} />
          Add IT Staff
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, phone, or staff ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {/* Staffs Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
            <p className="mt-3 text-sm text-slate-500 font-medium">Loading IT staff members...</p>
          </div>
        ) : staffs.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 text-base font-semibold text-slate-800">No IT Staff Found</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchTerm ? "No staff matched your search query." : "Get started by adding your first IT Staff member."}
            </p>
            <Link
              href="/it/it-staffs/add"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus size={16} /> Add IT Staff
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">IT Staff</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Permissions</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffs.map((staff) => {
                  const permCount = countPermissions(staff.permissions);
                  return (
                    <tr key={staff.uid} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                            {staff.fullname?.charAt(0)?.toUpperCase() || "I"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{staff.fullname}</div>
                            <div className="font-['JetBrains_Mono',monospace] text-xs text-slate-400">
                              {staff.uid}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900">{staff.email}</div>
                        <div className="text-xs text-slate-500">{staff.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            staff.status
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {staff.status ? (
                            <>
                              <CheckCircle2 size={12} /> Active
                            </>
                          ) : (
                            <>
                              <XCircle size={12} /> Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          <Shield size={12} className="text-emerald-600" />
                          {permCount > 0 ? `${permCount} rules active` : "No custom rules"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/it/it-staffs/${staff.uid}`}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition"
                            title="View & Edit Permissions"
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(staff.uid!, staff.fullname)}
                            disabled={deletingId === staff.uid}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
            <div>
              Showing page <span className="font-semibold text-slate-700">{meta.page}</span> of{" "}
              <span className="font-semibold text-slate-700">{meta.totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
