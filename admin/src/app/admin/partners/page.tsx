"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { getCompanies, Company } from "@/lib/services/company";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

export default function OrganizationsPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [organizations, setOrganizations] = useState<Company[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  });
  const { addToast } = useToast();
  const centerId = role === "ADMIN" ? user?.uid : user?.center;
  const pageRef = useRef(meta.page);
  const limitRef = useRef(meta.limit);

  useEffect(() => {
    if (user?.permission?.canViewPartner === false) {
      router.push("/admin");
    }
  }, [user, router]);

  const fetchData = useCallback(async (page?: number, limit?: number) => {
    const p = page ?? pageRef.current;
    const l = limit ?? limitRef.current;
    if (!centerId) return;
    setLoading(true);
    try {
      const data = await getCompanies(centerId, p, l);
      const companyList = Array.isArray(data?.data) ? data.data : [];
      setOrganizations(companyList);
      const newMeta = data?.meta || { page: p, limit: l, total: companyList.length, totalPages: 1 };
      setMeta(newMeta);
      pageRef.current = newMeta.page;
      limitRef.current = newMeta.limit;
    } catch (error) {
      addToast("error", "Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  }, [addToast, centerId])

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const companyList = Array.isArray(organizations) ? organizations : [];
  const filteredOrganizations = companyList.filter((c) => {
    const q = searchTerm.trim().toLowerCase();
    return (
      !q ||
      [c.uid, c.name, c.email, c.phone]
        .filter(Boolean)
        .some((v) => v?.toLowerCase().includes(q))
    );
  });

  // CSV helpers
  const escapeCSV = (val: string | number | Date | null | undefined) => {
    if (val === null || val === undefined) return "";
    let s = "";
    if (val instanceof Date) {
      s = val.toISOString();
    } else {
      s = typeof val === "string" ? val : String(val);
    }
    return `"${s.replace(/"/g, '""')}"`;
  };

  const buildCSV = (rows: Company[]) => {
    const headers = [
      "id",
      "Organization ID",
      "Name",
      "Email",
      "Phone",
      "Location",
      "Status",
      "Role",
      "Created At",
      "Updated At",
    ];

    const lines = [headers.join(",")];

    rows.forEach((r) => {
      const line = [
        escapeCSV(r.id),
        escapeCSV(r.uid),
        escapeCSV(r.name),
        escapeCSV(r.email),
        escapeCSV(r.phone),
        escapeCSV(r.location),
        escapeCSV(r.status ? "Active" : "Inactive"),
        escapeCSV(r.role),
        escapeCSV(r.createdAt),
        escapeCSV(r.updatedAt),
      ].join(",");
      lines.push(line);
    });

    return lines.join("\n");
  };

  const handleDownload = () => {
    try {
      const rows = filteredOrganizations.length ? filteredOrganizations : companyList;
      const csv = buildCSV(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().slice(0, 10);
      const filename = `ORGANIZATIONS ${date}.csv`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      addToast("error", "Failed to export organizations");
      console.error("Export failed", e);
    }
  };

  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  const pages = Array.from(
    { length: Math.max(1, meta.totalPages) },
    (_, i) => i + 1,
  );

  const statusBadgeClass = (status?: boolean) => {
    if (status) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    return "border-red-200 bg-red-50 text-red-700";
  };

  const truncate = (str: string, maxLength: number) => {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + "...";
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
              Partner Management
            </h2>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              {meta.total} partners • Manage your business partners
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 md:px-4"
              onClick={() => {
                router.push("/admin/partners/add");
              }}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Partner</span>
            </button>
            {role === "ADMIN" || (user?.permission?.canViewPartner ?? false) ? (<>
              <button
                onClick={() => handleDownload()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 md:px-4"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => fetchData()}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 md:px-4"
              >
                <RefreshCw size={18} className={`${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </>) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 md:p-5 ring-1 ring-slate-100 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by Partner ID, name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-transparent py-2.5 pl-10 pr-4 text-sm text-slate-600 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
            />
          </div>

          {loading ? (
            <div className="col-span-full py-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-4 animate-spin">
                  <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-emerald-600" />
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto block">
              <table className="min-w-max w-full text-left">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                      PRT ID
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                      Partner Name
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                      Email
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                      Zone
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:px-6 md:text-sm">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center md:px-6">
                        <p className="text-slate-500 text-sm">Loading...</p>
                      </td>
                    </tr>
                  ) : filteredOrganizations.length > 0 ? (
                    filteredOrganizations.map((organization) => (
                      <tr
                        key={organization.uid}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="px-4 py-4 font-mono text-xs md:px-6 md:text-sm">
                          {role === "ADMIN" || (user?.permission?.canViewPartner ?? false) ? (
                            <Link
                              href={`/admin/partners/${organization.uid}`}
                              className="rounded-lg text-xs font-medium text-slate-600 transition-colors hover:text-emerald-600 md:text-sm"
                            >
                              {organization.uid}
                            </Link>) : (
                            <span className="rounded-lg text-xs font-medium text-slate-600 md:text-sm">
                              {organization.uid}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-900 md:px-6 md:text-sm truncate">
                          {truncate(organization.name, 20) || "—"}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600 md:px-6 md:text-sm">
                          {organization.email || "—"}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600 md:px-6 md:text-sm">
                          {organization.phone || "—"}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600 md:px-6 md:text-sm">
                          {organization.zone || "—"}
                        </td>
                        <td className="px-4 py-4 md:px-6">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusBadgeClass(
                              organization.status,
                            )}`}
                          >
                            {organization.status ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center md:px-6">
                        <p className="text-slate-500 text-sm">
                          No Partner found
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-xs md:text-sm text-slate-600">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {start}-{end}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-900">
                  {meta.total}
                </span>{" "}
                partners
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMeta((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={meta.page <= 1}
                  className={`rounded-lg p-2 transition-colors ${meta.page <= 1
                    ? "cursor-not-allowed bg-slate-50 text-slate-300"
                    : "text-emerald-600 hover:bg-emerald-50"
                    }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="hidden md:flex items-center gap-1">
                  {pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setMeta((prev) => ({ ...prev, page: p }))}
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${p === meta.page
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="md:hidden">
                  <span className="text-sm font-medium text-slate-600">
                    Page {meta.page} of {meta.totalPages}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setMeta((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))
                  }
                  disabled={meta.page >= meta.totalPages}
                  className={`rounded-lg p-2 transition-colors ${meta.page >= meta.totalPages
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
    </div>
  );
}
