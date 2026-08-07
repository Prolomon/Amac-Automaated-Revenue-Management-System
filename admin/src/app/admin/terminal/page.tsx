"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Check, RefreshCcw, AlertCircle, Monitor, UserCheck, Building2, UserX, Eye, Link2, Unlink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getTerminals, Terminal, unassignTerminal, updateTerminal } from "@/lib/services/terminal";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

export default function TerminalListPage() {
  const router = useRouter();
  const { uid, user, role } = useAuth();
  const [terminals, setTerminals] = useState<Terminal[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadTerminals = useCallback(async () => {
    setLoading(true);
    try {
      const query: any = { page: 1, limit: 100 };
      if (search) query.search = search;
      if (filterStatus === "active") query.status = true;
      if (filterStatus === "inactive") query.status = false;

      const data = await getTerminals(query);
      const list = Array.isArray(data?.data) ? data.data : [];
      setTerminals(list);
    } catch (err: any) {
      addToast("error", err.message || "Failed to fetch terminals");
      setTerminals([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, addToast]);

  useEffect(() => {
    loadTerminals();
  }, [loadTerminals]);

  const stats = useMemo(() => {
    const list = terminals ?? [];
    const total = list.length;
    const assigned = list.filter((t) => t.agentId || t.agent || t.companyId || t.company).length;
    const unassigned = total - assigned;
    const active = list.filter((t) => t.status).length;

    return {
      total,
      assigned,
      unassigned,
      active,
    };
  }, [terminals]);

  const handleQuickUnassign = async (term: Terminal) => {
    const targetId = term.id || term.uid;
    if (!targetId) return;

    if (!confirm(`Are you sure you want to unassign terminal ${term.name}?`)) return;

    setActionLoadingId(targetId);
    try {
      try {
        await unassignTerminal({ name: term.name, uid: term.uid });
      } catch (e) {
        // Fallback to updateTerminal to clear agent/company if Nomba API fails
      }
      await updateTerminal(targetId, { agentId: null, companyId: null });
      addToast("success", "Terminal unassigned successfully");
      await loadTerminals();
    } catch (err: any) {
      addToast("error", err.message || "Failed to unassign terminal");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getAgentName = (term: Terminal) => {
    if (term.agent) {
      const full = `${term.agent.firstName || ""} ${term.agent.lastName || ""}`.trim();
      return full || term.agent.fullname || term.agent.name || "Assigned Agent";
    }
    if (term.agentId) return `Agent (${term.agentId.slice(0, 8)}...)`;
    return null;
  };

  const getCompanyName = (term: Terminal) => {
    if (term.company) return term.company.name || "Assigned Company";
    if (term.companyId) return `Company (${term.companyId.slice(0, 8)}...)`;
    return null;
  };

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 p-5 text-white shadow-lg md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Monitor className="h-7 w-7 text-emerald-400" />
              <h1 className="text-2xl font-bold md:text-3xl">Terminals & POS Management</h1>
            </div>
            <p className="mt-1 text-sm text-emerald-100 md:text-base">
              Manage assigned POS terminals, monitor active agents, and assign hardware across companies.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={loadTerminals}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-800/60 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-700 hover:text-white"
            >
              <RefreshCcw size={18} />
              Refresh
            </button>
            <button
              onClick={() => router.push("/admin/terminal/assign")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-300"
            >
              <Plus size={18} />
              Assign
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Total Terminals</p>
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
              <Monitor size={20} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-500">Registered POS terminals</p>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Assigned Terminals</p>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <UserCheck size={20} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{stats.assigned}</p>
          <p className="mt-1 text-xs text-slate-500">Active agent & company deployments</p>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Unassigned Terminals</p>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <UserX size={20} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">{stats.unassigned}</p>
          <p className="mt-1 text-xs text-slate-500">Available for assignment</p>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Active Status</p>
            <div className="rounded-xl bg-cyan-100 p-2 text-cyan-700">
              <Check size={20} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-cyan-700">{stats.active}</p>
          <p className="mt-1 text-xs text-slate-500">Online & operational</p>
        </div>
      </div>

      {/* Main Terminal Cards Grid */}
      <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Terminal Fleet</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">All Assigned & Registered Terminals</h2>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Search serial number, label..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-4 animate-spin">
                  <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-emerald-600" />
                </div>
                <p className="font-medium text-slate-600">Loading POS terminals...</p>
              </div>
            </div>
          ) : terminals && terminals.length > 0 ? (
            terminals.map((term) => {
              const agentName = getAgentName(term);
              const companyName = getCompanyName(term);
              const isAssigned = Boolean(agentName || companyName);
              const cardId = term.id || term.uid || "";

              return (
                <div
                  key={cardId}
                  className={`relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                    term.status
                      ? "border-emerald-200 shadow-md ring-1 ring-emerald-500/10 hover:shadow-xl"
                      : "border-slate-200 shadow-sm hover:border-slate-300"
                  }`}
                >
                  <div className="p-5">
                    {/* Top row: Serial & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">POS Terminal</span>
                        </div>
                        <h3 className="mt-1 text-lg font-bold text-slate-900 tracking-tight">
                          {term.name}
                        </h3>
                        {term.uid && (
                          <p className="text-xs font-mono text-slate-500">ID: {term.uid}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            term.status
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          {term.status ? "Active" : "Inactive"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isAssigned
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isAssigned ? "Assigned" : "Unassigned"}
                        </span>
                      </div>
                    </div>

                    {/* Agent Name Box - Highlighted like Tier Card */}
                    <div className="mt-5 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                        Assigned Agent
                      </p>
                      <p className="mt-1 text-base font-bold text-slate-900">
                        {agentName ? (
                          <span className="text-emerald-700">{agentName}</span>
                        ) : (
                          <span className="text-slate-400 italic">No agent assigned</span>
                        )}
                      </p>
                    </div>

                    {/* Company Info & Center */}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-2">
                        <span className="font-semibold text-slate-500 flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" /> Company
                        </span>
                        <span className="font-medium text-slate-800">
                          {companyName || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-semibold text-slate-500">Center Location</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                          {term.center || "General Center"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => router.push(`/admin/terminal/${cardId}`)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-emerald-700"
                      >
                        <Eye size={15} />
                        View Details
                      </button>

                      {isAssigned ? (
                        <button
                          onClick={() => handleQuickUnassign(term)}
                          disabled={actionLoadingId === cardId}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                        >
                          <Unlink size={15} />
                          Unassign
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/admin/terminal/assign?serial=${encodeURIComponent(term.name)}`)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <Link2 size={15} />
                          Assign
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center">
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="mb-4 h-12 w-12 text-slate-300" />
                <h3 className="mb-2 text-lg font-semibold text-slate-700">No Terminals Found</h3>
                <p className="mb-6 text-slate-500 max-w-md">
                  No terminals match your filter or search criteria. Assign your first terminal now.
                </p>
                <button
                  onClick={() => router.push("/admin/terminal/assign")}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 shadow-md"
                >
                  <Plus size={18} />
                  Assign New Terminal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
