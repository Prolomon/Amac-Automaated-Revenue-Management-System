"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { getAllAdmins, Admin } from "@/lib/services/admin";
import { useToast } from "@/context/ToastContext";

export default function AdminsPage() {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [admins, setAdmins] = useState<Admin[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 100;
  const [meta, setMeta] = useState({
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getAllAdmins();
        const list = Array.isArray(data?.data) ? data.data : data?.admins || [];
        setAdmins(list);
        setMeta(
          data?.meta || {
            page: 1,
            limit,
            total: list.length,
            totalPages: 1,
          },
        );
      } catch (error) {
        addToast("error", "Failed to fetch admins");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addToast]);

  useEffect(() => {
    const id = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(id);
  }, [searchTerm]);

  const adminList = Array.isArray(admins) ? admins : [];
  const filteredAdmins = adminList.filter((a) => {
    const q = searchTerm.trim().toLowerCase();
    return (
      !q ||
      [a.uid, a.adminName, a.adminEmail, a.email, a.phone, a.center]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  });

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  const escapeCSV = (val: unknown) => {
    if (val === null || val === undefined) return "";
    const s = typeof val === "string" ? val : String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const handleDownload = () => {
    const headers = [
      "ID",
      "Admin ID",
      "Name",
      "Email",
      "Phone",
      "Center",
      "Role",
      "Status",
    ];
    const lines = [
      headers.join(","),
      ...filteredAdmins.map((a) =>
        [
          escapeCSV(a.id),
          escapeCSV(a.uid),
          escapeCSV(a.adminName),
          escapeCSV(a.adminEmail || a.email),
          escapeCSV(a.adminPhone || a.phone),
          escapeCSV(a.center),
          escapeCSV(a.role),
          escapeCSV(a.status ? "Active" : "Inactive"),
        ].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admins.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Admins</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage all center administrators across the system
          </p>
        </div>
        <Link
          href="/it/admins/add"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <Plus size={18} />
          Create Admin
        </Link>
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 md:p-5 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email or ID..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <button
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Download size={16} />
            Export
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 md:px-4">Name</th>
                  <th className="px-3 py-3 md:px-4">Email</th>
                  <th className="px-3 py-3 md:px-4">Phone</th>
                  <th className="px-3 py-3 md:px-4">Center</th>
                  <th className="px-3 py-3 md:px-4">Status</th>
                  <th className="px-3 py-3 md:px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmins.length > 0 ? (
                  filteredAdmins.map((a) => (
                    <tr key={a.uid || a.id} className="hover:bg-slate-50">
                      <td className="px-3 py-4 md:px-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <ShieldCheck size={16} />
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">{a.adminName || "—"}</p>
                            <p className="text-xs text-slate-500">{a.uid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 md:px-4 text-slate-600">
                        {a.adminEmail || a.email || "—"}
                      </td>
                      <td className="px-3 py-4 md:px-4 text-slate-600">
                        {a.adminPhone || a.phone || "—"}
                      </td>
                      <td className="px-3 py-4 md:px-4 text-slate-600">{a.center || "—"}</td>
<td className="px-3 py-4 md:px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            a.status ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {a.status ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-4 md:px-4">
                        <Link
                          href={`/it/admins/${a.uid}`}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center md:px-6">
                      <p className="text-slate-500 text-sm">No admins found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs md:text-sm text-slate-600">
              Showing <span className="font-semibold text-slate-900">{start}-{end}</span> of{" "}
              <span className="font-semibold text-slate-900">{meta.total}</span> admins
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, meta.page - 1))}
                disabled={meta.page <= 1}
                className={`rounded-lg p-2 transition-colors ${meta.page <= 1 ? "cursor-not-allowed bg-slate-50 text-slate-300" : "text-emerald-600 hover:bg-emerald-50"}`}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-slate-600">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(meta.totalPages, meta.page + 1))}
                disabled={meta.page >= meta.totalPages}
                className={`rounded-lg p-2 transition-colors ${meta.page >= meta.totalPages ? "cursor-not-allowed bg-slate-50 text-slate-300" : "text-emerald-600 hover:bg-emerald-50"}`}
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