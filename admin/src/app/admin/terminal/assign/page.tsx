"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { ArrowLeft, Monitor, Building2, User, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { createTerminal, assignTerminal } from "@/lib/services/terminal";
import { Company, getCompanies } from "@/lib/services/company";
import { getAllAgents, getAgentsByCompany, Agent } from "@/lib/services/agent";
import { getCenterId } from "@/lib/permissions";

function AssignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSerial = searchParams.get("serial") || "";

  const { user } = useAuth();
  const { addToast } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [serialNumber, setSerialNumber] = useState<string>(initialSerial);
  const [terminalLabel, setTerminalLabel] = useState<string>("");
  const [center, setCenter] = useState<string>(getCenterId(user) || "");
  const [status, setStatus] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const centerId = getCenterId(user);

  // Fetch Companies
  const loadCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try { 
      const res = await getCompanies(centerId, 1, 200);
      const list = Array.isArray(res?.data) ? res.data : [];
      setCompanies(list);
    } catch (err: any) {
      addToast("error", err.message || "Failed to load companies");
    } finally {
      setLoadingCompanies(false);
    }
  }, [addToast]);

  // Fetch Agents when Company changes or initially
  const loadAgents = useCallback(async (companyId?: string) => {
    setLoadingAgents(true);
    try {
      let list: Agent[] = [];
      if (companyId) {
        const res = await getAgentsByCompany(companyId, 1, 200);
        list = Array.isArray(res?.data) ? res.data : [];
      } else {
        const res = await getAllAgents(1, 200);
        list = Array.isArray(res?.data) ? res.data : [];
      }
      setAgents(list);
    } catch (err: any) {
      addToast("error", err.message || "Failed to load agents");
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadCompanies();
    loadAgents();
  }, [loadCompanies, loadAgents]);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = e.target.value;
    setSelectedCompanyId(cid);
    setSelectedAgentId(""); // Reset selected agent
    loadAgents(cid);

    // Auto update center if company has center
    const comp = companies.find((c) => (c.uid || c.id) === cid);
    if (comp?.center) {
      setCenter(comp.center);
    }
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const aid = e.target.value;
    setSelectedAgentId(aid);

    const ag = agents.find((a) => (a.uid || a.id) === aid);
    if (ag?.center) {
      setCenter(ag.center);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serialNumber.trim()) {
      addToast("error", "Terminal serial number or name is required");
      return;
    }

    if (!center.trim()) {
      addToast("error", "Center location is required");
      return;
    }

    setSubmitting(true);
    try {
      // First try to assign via API or create terminal
      const payload = {
        name: terminalLabel.trim(),
        uid: serialNumber.trim(),
        center: center.trim(),
        companyId: selectedCompanyId || null,
        agentId: selectedAgentId || null,
        status: status,
      };

      const res = await createTerminal(payload);
      addToast("success", res.message || "Terminal assigned successfully!");
      router.push("/admin/terminal");
    } catch (err: any) {
      addToast("error", err.message || "Failed to assign terminal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/admin/terminal")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
          Back to Terminals
        </button>
      </div>

      {/* Hero Header */}
      <div className="rounded-2xl bg-linear-to-r from-emerald-800 to-teal-800 p-6 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-700/60 p-3 text-emerald-300">
            <Monitor className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Assign POS Terminal</h1>
            <p className="mt-1 text-sm text-emerald-100">
              Select a partner company and agent to assign a POS hardware unit.
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-6">
        {/* Section 1: Company & Agent Selection */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="h-5 w-5 text-emerald-600" />
            1. Select Assignment Targets
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Select Company */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Partner Company <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCompanyId}
                  onChange={handleCompanyChange}
                  disabled={loadingCompanies}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-hidden disabled:bg-slate-50 appearance-none"
                >
                  <option value="">-- Choose Company --</option>
                  {companies.map((comp) => {
                    const cid = comp.uid || comp.id || "";
                    return (
                      <option key={cid} value={cid}>
                        {comp.name} {comp.center ? `(${comp.center})` : ""}
                      </option>
                    );
                  })}
                </select>
                {loadingCompanies && (
                  <span className="absolute right-3 top-3.5 text-xs text-slate-400">Loading...</span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Filter agents by selecting a partner company.</p>
            </div>

            {/* Select Agent */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Assigned Agent <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <select
                  value={selectedAgentId}
                  onChange={handleAgentChange}
                  disabled={loadingAgents}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-hidden disabled:bg-slate-50 appearance-none"
                >
                  <option value="">-- Choose Agent --</option>
                  {agents.map((agent) => {
                    const aid = agent.uid || agent.id || "";
                    const agentName = agent.fullname || `${agent.fullname || agent.name || "Agent"}`;
                    return (
                      <option key={aid} value={aid}>
                        {agentName} ({agent.email || agent.phone || "No contact"})
                      </option>
                    );
                  })}
                </select>
                {loadingAgents && (
                  <span className="absolute right-3 top-3.5 text-xs text-slate-400">Loading...</span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-slate-500">The agent operating this POS terminal.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Terminal Hardware Information */}
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Monitor className="h-5 w-5 text-emerald-600" />
            2. Terminal Hardware Details
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Serial Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Serial Number / Terminal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. NMB-9021873 or POS-001"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden"
              />
              <p className="mt-1.5 text-xs text-slate-500">Unique hardware serial number from Nomba/Provider.</p>
            </div>

            {/* Terminal Label / UID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Terminal Label / Alias <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Market-Station-01"
                value={terminalLabel}
                onChange={(e) => setTerminalLabel(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Center Location */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Center / Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled
                placeholder="e.g. AMAC Central Office"
                value={center}
                onChange={(e) => setCenter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Terminal Status */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Initial Status
              </label>
              <div className="flex items-center gap-4 pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === true}
                    onChange={() => setStatus(true)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Active</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={status === false}
                    onChange={() => setStatus(false)}
                    className="h-4 w-4 text-slate-600 focus:ring-slate-500"
                  />
                  <span className="text-sm font-semibold text-slate-700">Inactive</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push("/admin/terminal")}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                Assigning Terminal...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirm & Assign Terminal
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AssignPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssignContent />
    </Suspense>
  );
}


