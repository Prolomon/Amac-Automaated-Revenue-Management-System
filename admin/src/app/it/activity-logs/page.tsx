"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, ClipboardList } from "lucide-react";
import { getActivityLogs, ActivityLog } from "@/lib/services/activityLog";
import { useToast } from "@/context/ToastContext";

export default function ActivityLogsPage() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });

  const fetchLogs = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const data = await getActivityLogs(pageNum, 50, "", search);
        setLogs(Array.isArray(data?.logs) ? data.logs : []);
        if (data?.meta) setMeta(data.meta);
      } catch (err) {
        addToast("error", err.message || "Failed to fetch activity logs");
      } finally {
        setLoading(false);
      }
    },
    [addToast, search],
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const formatDate = (val: string | Date | null | undefined) => {
    if (!val) return "—";
    try {
      return new Date(val).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "—";
    }
  };

  const methodBadge = (method: string) => {
    const upper = (method || "").toUpperCase();
    const map: Record<string, string> = {
      GET: "bg-emerald-50 text-emerald-700",
      POST: "bg-blue-50 text-blue-700",
      PUT: "bg-amber-50 text-amber-700",
      PATCH: "bg-violet-50 text-violet-700",
      DELETE: "bg-red-50 text-red-700",
    };
    return map[upper] || "bg-slate-100 text-slate-600";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <ClipboardList size={22} />
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Activity Logs</h1>
            <p className="mt-1 text-sm text-slate-600">
              System-wide audit trail of user actions
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchLogs(1)}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
        <div className="border-b border-slate-100 p-4 md:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, action, method or route..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 md:px-4">User</th>
                  <th className="px-3 py-3 md:px-4">Action</th>
                  <th className="px-3 py-3 md:px-4">Method</th>
                  <th className="px-3 py-3 md:px-4">Route</th>
                  <th className="px-3 py-3 md:px-4">Status</th>
                  <th className="px-3 py-3 md:px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length > 0 ? (
                  logs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-50">
                      <td className="px-3 py-3 md:px-4">
                        <p className="font-semibold text-slate-900">{log.userName || "—"}</p>
                        <p className="text-xs text-slate-400">{log.userRole || "—"}</p>
                      </td>
                      <td className="px-3 py-3 md:px-4 text-slate-700">{log.action || "—"}</td>
                      <td className="px-3 py-3 md:px-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${methodBadge(log.method)}`}>
                          {log.method || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-4 font-mono text-xs text-slate-600">{log.route || "—"}</td>
                      <td className="px-3 py-3 md:px-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${Number(log.status) < 400 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {log.status ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 md:px-4 text-xs text-slate-600">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center md:px-6">
                      <p className="text-slate-500 text-sm">No activity logs found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4">
            <p className="text-xs text-slate-600">
              Showing page {meta.page} of {meta.totalPages} ({meta.total} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= meta.totalPages || loading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
