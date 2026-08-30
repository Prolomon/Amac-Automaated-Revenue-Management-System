"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw, Shield, Eye, Building2, MapPin, CheckCircle, XCircle } from "lucide-react";
import withAuth from "@/components/withAuth";
import { useToast } from "@/context/ToastContext";
import { getAllAdmins, Admin } from "@/lib/services/admin";

function SuperAdminAdminsListPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { addToast } = useToast();

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllAdmins();
      if (res?.ok) {
        setAdmins(res.admins || (res as any).data || []);
      } else {
        addToast("error", res?.message || "Failed to fetch admins");
      }
    } catch (err: any) {
      addToast("error", err?.message || "An error occurred fetching admins");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const filteredAdmins = admins.filter((admin) => {
    const q = searchQuery.toLowerCase();
    return (
      (admin.adminName || "").toLowerCase().includes(q) ||
      (admin.center || "").toLowerCase().includes(q) ||
      (admin.email || "").toLowerCase().includes(q) ||
      (admin.state || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 ring-1 ring-emerald-100 p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2.5">
            <Shield className="h-7 w-7 text-emerald-600" />
            Admin Centers Management
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            View all registered area council admins, centers, and credentials.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAdmins}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/super-admin/admins/add"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add New Admin Center
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-xs flex items-center gap-3">
        <Search className="h-5 w-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by center name, email, or state..."
          className="w-full text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Admin List Table */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left border-b border-slate-200 font-semibold">
                <th className="px-5 py-3.5">Admin / Center Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Center Code</th>
                <th className="px-5 py-3.5">State &amp; LGA</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 font-medium">
                    Loading admin centers...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500 font-medium">
                    No admin centers found.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin.uid || admin.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-800 flex items-center gap-2.5">
                      <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      {admin.adminName || admin.center || "Unnamed Center"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{admin.email || "—"}</td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{admin.center || "—"}</td>
                    <td className="px-5 py-4 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {admin.state || "—"} {admin.lga ? `(${admin.lga})` : ""}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {admin.status !== false ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                          <XCircle className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/super-admin/admins/${admin.uid || admin.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        View Center
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default withAuth(SuperAdminAdminsListPage);
