"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, Activity, ShieldAlert, User, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import withAuth from "@/components/withAuth";
import { useToast } from "@/context/ToastContext";
import { getActivityLogs, ActivityLog } from "@/lib/services/activityLog";

function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { addToast } = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getActivityLogs(1, 100, roleFilter, searchQuery);
      if (res?.ok) {
        setLogs(res.logs || []);
      } else {
        addToast("error", res?.message || "Failed to fetch activity logs");
      }
    } catch (err: any) {
      addToast("error", err?.message || "An error occurred fetching logs");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, searchQuery, addToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
          <CheckCircle className="h-3 w-3" /> {status} OK
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
        <AlertTriangle className="h-3 w-3" /> {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 ring-1 ring-emerald-100 p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2.5">
            <Activity className="h-7 w-7 text-emerald-600" />
            System Activity &amp; Audit Logs
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time activity log tracking user actions, operations carried out, status, and timestamps.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Logs
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 md:col-span-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, person name, or route..."
            className="w-full text-sm text-slate-700 outline-none bg-transparent"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
          >
            <option value="">All User Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="STAFF">STAFF</option>
            <option value="AGENT">AGENT</option>
            <option value="MEMBER">MEMBER</option>
            <option value="COMPANY">COMPANY</option>
          </select>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-left border-b border-slate-200 font-semibold">
                <th className="px-5 py-3.5">User / Person</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Action Taken &amp; Route</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500 font-medium">
                    Loading activity logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500 font-medium">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-800 flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400 shrink-0" />
                      <div>
                        <div>{log.userName || "Anonymous"}</div>
                        {log.userId && <div className="text-xs font-mono font-normal text-slate-400">{log.userId}</div>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-slate-100 text-slate-700">
                        {log.userRole || "GUEST"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{log.action}</div>
                      <div className="text-xs font-mono text-slate-500">{log.method} {log.route}</div>
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(log.status)}</td>
                    <td className="px-5 py-4 text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {log.createdAt ? new Date(log.createdAt).toLocaleString("en-NG") : "—"}
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

export default withAuth(ActivityLogPage);
