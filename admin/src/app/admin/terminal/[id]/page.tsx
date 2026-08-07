"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Monitor,
  User,
  Building2,
  Unlink,
  Link2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCcw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Tag,
  ShieldCheck
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { getTerminal, updateTerminal, unassignTerminal, deleteTerminal, Terminal } from "@/lib/services/terminal";

export default function TerminalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const { addToast } = useToast();

  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);

  const loadTerminalDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getTerminal(id);
      if (res?.terminal) {
        setTerminal(res.terminal);
      } else {
        addToast("error", "Terminal record not found");
      }
    } catch (err: any) {
      addToast("error", err.message || "Failed to fetch terminal details");
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    loadTerminalDetails();
  }, [loadTerminalDetails]);

  const isAssigned = Boolean(
    terminal?.agentId || terminal?.agent || terminal?.companyId || terminal?.company
  );

  // Handle Unassign Action
  const handleUnassign = async () => {
    if (!terminal) return;
    const targetId = terminal.id || terminal.uid || id;

    setActionLoading(true);
    try {
      try {
        await unassignTerminal({
          name: terminal.name,
          serialNumber: terminal.name,
          terminalLabel: terminal.name,
        });
      } catch (e) {
        // Fallback to update terminal directly if Nomba fails
      }

      await updateTerminal(targetId, {
        agentId: null,
        companyId: null,
      });

      addToast("success", "Terminal unassigned successfully");
      setShowUnassignModal(false);
      await loadTerminalDetails();
    } catch (err: any) {
      addToast("error", err.message || "Failed to unassign terminal");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Action
  const handleDelete = async () => {
    if (!terminal) return;
    const targetId = terminal.id || terminal.uid || id;

    setActionLoading(true);
    try {
      await deleteTerminal(targetId);
      addToast("success", "Terminal deleted successfully");
      router.push("/admin/terminal");
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete terminal");
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getAgentFullName = () => {
    if (!terminal?.agent) return null;
    const ag = terminal.agent;
    const full = `${ag.firstName || ""} ${ag.lastName || ""}`.trim();
    return full || ag.fullname || ag.name || null;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl py-20 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-4 animate-spin">
            <div className="h-9 w-9 rounded-full border-4 border-slate-200 border-t-emerald-600" />
          </div>
          <p className="font-medium text-slate-600">Loading terminal information...</p>
        </div>
      </div>
    );
  }

  if (!terminal) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-800">Terminal Not Found</h2>
          <p className="mt-2 text-sm text-slate-500">The requested POS terminal could not be found or has been removed.</p>
          <button
            onClick={() => router.push("/admin/terminal")}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <ArrowLeft size={16} /> Return to Terminals
          </button>
        </div>
      </div>
    );
  }

  const agentName = getAgentFullName();

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Top Header Nav */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => router.push("/admin/terminal")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
          Back to Terminals
        </button>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {isAssigned ? (
            <button
              onClick={() => setShowUnassignModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100"
            >
              <Unlink size={18} />
              Unassign Terminal
            </button>
          ) : (
            <button
              onClick={() => router.push(`/admin/terminal/assign?serial=${encodeURIComponent(terminal.name)}`)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <Link2 size={18} />
              Assign Terminal
            </button>
          )}

          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-100"
          >
            <Trash2 size={18} />
            Delete Terminal
          </button>
        </div>
      </div>

      {/* Terminal Title Banner */}
      <div className="rounded-2xl bg-linear-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white shadow-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-emerald-500/20 p-3.5 text-emerald-400 border border-emerald-500/30">
              <Monitor className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold md:text-3xl">{terminal.name}</h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    terminal.status
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-slate-700 text-slate-300 border border-slate-600"
                  }`}
                >
                  {terminal.status ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-1 text-sm font-mono text-slate-300">
                UID: {terminal.uid || "N/A"} | Center: {terminal.center}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 px-4 py-3 border border-white/10 text-right sm:text-left">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assignment Status</p>
            <p className="text-base font-bold text-white">
              {isAssigned ? (
                <span className="text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" /> Currently Assigned
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5 mt-0.5">
                  <AlertTriangle className="h-4 w-4" /> Unassigned
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 3 Grid Columns / Information Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 1. Terminal Details Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Monitor className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Terminal Details</h2>
          </div>

          <div className="space-y-3.5 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Serial Number / Name</p>
              <p className="font-bold text-slate-900 mt-0.5">{terminal.name}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">System UID</p>
              <p className="font-mono text-xs font-semibold text-slate-700 mt-0.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {terminal.uid || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Center Location</p>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                <MapPin className="h-4 w-4 text-emerald-600" />
                {terminal.center || "Not Specified"}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Operational Status</p>
              <span
                className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  terminal.status
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {terminal.status ? "Active & Functional" : "Disabled / Inactive"}
              </span>
            </div>

            {terminal.createdAt && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Created Date</p>
                <p className="font-medium text-slate-600 mt-0.5 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(terminal.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 2. Agent Details Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Agent Details</h2>
          </div>

          {terminal.agent ? (
            <div className="space-y-3.5 text-sm">
              <div className="rounded-xl bg-emerald-50/60 p-3.5 border border-emerald-100">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Agent Name</p>
                <p className="text-base font-bold text-emerald-950 mt-0.5">{agentName || "N/A"}</p>
              </div>

              {terminal.agent.email && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</p>
                  <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {terminal.agent.email}
                  </p>
                </div>
              )}

              {terminal.agent.phone && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number</p>
                  <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {terminal.agent.phone}
                  </p>
                </div>
              )}

              {terminal.agent.uid && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Agent UID</p>
                  <p className="font-mono text-xs text-slate-600 mt-0.5">{terminal.agent.uid}</p>
                </div>
              )}

              {terminal.agent.batchNo && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Batch Number</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{terminal.agent.batchNo}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 text-center space-y-3">
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-600" />
              <div>
                <p className="font-bold text-amber-900 text-sm">No Agent Assigned</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  This terminal is currently not assigned to any agent.
                </p>
              </div>
              <button
                onClick={() => router.push(`/admin/terminal/assign?serial=${encodeURIComponent(terminal.name)}`)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700"
              >
                <Link2 size={14} /> Assign Agent Now
              </button>
            </div>
          )}
        </div>

        {/* 3. Company Details Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Company Details</h2>
          </div>

          {terminal.company ? (
            <div className="space-y-3.5 text-sm">
              <div className="rounded-xl bg-blue-50/60 p-3.5 border border-blue-100">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-800">Company Name</p>
                <p className="text-base font-bold text-blue-950 mt-0.5">{terminal.company.name}</p>
              </div>

              {terminal.company.email && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Company Email</p>
                  <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {terminal.company.email}
                  </p>
                </div>
              )}

              {terminal.company.phone && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Company Phone</p>
                  <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {terminal.company.phone}
                  </p>
                </div>
              )}

              {terminal.company.center && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Company Center</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{terminal.company.center}</p>
                </div>
              )}

              {terminal.company.category && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Array.isArray(terminal.company.category)
                      ? terminal.company.category.map((cat, i) => (
                          <span key={i} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {cat}
                          </span>
                        ))
                      : <span className="text-slate-600">{String(terminal.company.category)}</span>}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-center space-y-3">
              <Building2 className="mx-auto h-8 w-8 text-slate-400" />
              <div>
                <p className="font-bold text-slate-800 text-sm">No Company Assigned</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  No company account linked to this hardware.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unassign Confirmation Modal */}
      {showUnassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="h-7 w-7" />
              <h3 className="text-lg font-bold text-slate-900">Unassign Terminal</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to unassign terminal <strong className="text-slate-900">{terminal.name}</strong> from its agent and company?
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowUnassignModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnassign}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {actionLoading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Unlink size={16} />}
                Unassign Terminal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <Trash2 className="h-7 w-7" />
              <h3 className="text-lg font-bold text-slate-900">Delete Terminal</h3>
            </div>
            <p className="text-sm text-slate-600">
              This action cannot be undone. Terminal <strong className="text-slate-900">{terminal.name}</strong> will be permanently removed from the system.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {actionLoading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
