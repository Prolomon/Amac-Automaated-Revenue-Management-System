"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Wallet,
  Users,
  Briefcase,
  MapPin,
  Mail,
  Shield,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import withAuth from "@/components/withAuth";
import { useToast } from "@/context/ToastContext";
import { getAdmin, Admin } from "@/lib/services/admin";
import { getTransactions, Transaction } from "@/lib/services/wallet";
import { getMembers, Member } from "@/lib/services/member";
import { getCompanies, Company } from "@/lib/services/company";

function AdminDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addToast } = useToast();

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "wallet" | "entities" | "partners">("overview");

  // Related Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [entities, setEntities] = useState<Member[]>([]);
  const [partners, setPartners] = useState<Company[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const adminId = params.id;

  const fetchAdminDetails = useCallback(async () => {
    if (!adminId) return;
    setLoading(true);
    try {
      const res = await getAdmin(adminId);
      if (res?.ok && res.admin) {
        setAdmin(res.admin);
      } else {
        addToast("error", res?.message || "Admin center not found");
      }
    } catch (err: any) {
      addToast("error", err?.message || "Failed to fetch admin details");
    } finally {
      setLoading(false);
    }
  }, [adminId, addToast]);

  useEffect(() => {
    fetchAdminDetails();
  }, [fetchAdminDetails]);

  const fetchRelatedData = useCallback(async () => {
    if (!admin) return;
    const centerCode = admin.center || admin.uid || "";
    setDataLoading(true);
    try {
      if (activeTab === "wallet") {
        const res: any = await getTransactions(centerCode, 1, 100, "" as any, "" as any, "", "", "");
        const txs = Array.isArray(res?.transactions) ? res.transactions : Array.isArray(res?.data) ? res.data : [];
        setTransactions(txs);
      } else if (activeTab === "entities") {
        const res: any = await getMembers(1, 100, centerCode);
        const mems = Array.isArray(res?.members) ? res.members : Array.isArray(res?.data) ? res.data : [];
        setEntities(mems);
      } else if (activeTab === "partners") {
        const res: any = await getCompanies(centerCode, 1, 100);
        const comps = Array.isArray(res?.companies) ? res.companies : Array.isArray(res?.data) ? res.data : [];
        setPartners(comps);
      }
    } catch (err: any) {
      addToast("error", err?.message || "Failed to fetch related records");
    } finally {
      setDataLoading(false);
    }
  }, [admin, activeTab, addToast]);

  useEffect(() => {
    if (activeTab !== "overview") {
      fetchRelatedData();
    }
  }, [activeTab, fetchRelatedData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-2" />
        <p className="text-sm text-slate-500 font-medium">Loading admin center profile...</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="rounded-2xl bg-rose-50 p-6 ring-1 ring-rose-200 text-center">
          <h2 className="text-lg font-bold text-rose-800">Admin Center Not Found</h2>
          <p className="text-sm text-rose-600 mt-1">The requested admin center record could not be located.</p>
          <Link
            href="/super-admin/admins"
            className="inline-flex items-center gap-2 mt-4 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Admins
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount || 0);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/admins"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-emerald-600" />
              {admin.adminName || admin.center || "Admin Center Profile"}
            </h1>
            <p className="text-sm text-slate-600">
              Center ID: <span className="font-mono font-bold text-slate-800">{admin.center || admin.uid}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons to View Relatives */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-xs ${
              activeTab === "overview" ? "bg-slate-800 text-white" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Shield className="h-4 w-4" /> Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wallet")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-xs ${
              activeTab === "wallet" ? "bg-emerald-600 text-white" : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            <Wallet className="h-4 w-4" /> View Wallet Transactions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("entities")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-xs ${
              activeTab === "entities" ? "bg-blue-600 text-white" : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
            }`}
          >
            <Users className="h-4 w-4" /> View Entities
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("partners")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-xs ${
              activeTab === "partners" ? "bg-purple-600 text-white" : "bg-white text-purple-700 border border-purple-200 hover:bg-purple-50"
            }`}
          >
            <Briefcase className="h-4 w-4" /> View Partners
          </button>
        </div>
      </div>

      {/* Main Content Sections */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-2xl bg-white ring-1 ring-slate-200 p-6 space-y-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-3">Center Info &amp; Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Admin Email</span>
                <span className="font-semibold text-slate-800">{admin.email || "—"}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">State / LGA</span>
                <span className="font-semibold text-slate-800">{admin.state || "—"} / {admin.lga || "—"}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Center Code</span>
                <span className="font-mono font-bold text-slate-800">{admin.center || "—"}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Active
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Address</span>
                <span className="font-semibold text-slate-800">{admin.address || "—"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-3">Quick Actions</h2>
            <p className="text-xs text-slate-600">Inspect specific records tied to center identifier: <strong className="text-slate-800">{admin.center}</strong></p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setActiveTab("wallet")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 hover:text-emerald-800 transition-colors text-sm font-semibold"
              >
                <span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-emerald-600" /> Wallet Transactions</span>
                <span>&rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("entities")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-800 transition-colors text-sm font-semibold"
              >
                <span className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" /> Registered Entities</span>
                <span>&rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("partners")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 text-slate-700 hover:text-purple-800 transition-colors text-sm font-semibold"
              >
                <span className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-purple-600" /> Assigned Partners</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Related Wallet Transactions Tab */}
      {activeTab === "wallet" && (
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              Wallet Transactions ({transactions.length})
            </h2>
            <button
              type="button"
              onClick={fetchRelatedData}
              disabled={dataLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${dataLoading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-left border-b border-slate-200 font-semibold">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Event / Channel</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dataLoading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">Loading transactions...</td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">No transactions recorded for this center.</td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">{tx.reference}</td>
                      <td className="px-4 py-3 text-slate-600">{tx.event} ({tx.channel || "direct"})</td>
                      <td className="px-4 py-3 font-bold text-emerald-700">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {String(tx.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString("en-NG") : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Related Entities Tab */}
      {activeTab === "entities" && (
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Registered Center Entities ({entities.length})
            </h2>
            <button
              type="button"
              onClick={fetchRelatedData}
              disabled={dataLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${dataLoading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-left border-b border-slate-200 font-semibold">
                  <th className="px-4 py-3">Full / Business Name</th>
                  <th className="px-4 py-3">Member UID</th>
                  <th className="px-4 py-3">Email &amp; Phone</th>
                  <th className="px-4 py-3">Zone / Category</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dataLoading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">Loading entities...</td>
                  </tr>
                ) : entities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">No entities registered under this center.</td>
                  </tr>
                ) : (
                  entities.map((m) => (
                    <tr key={m.id || m.uid} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{m.businessName || m.fullname}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{m.uid}</td>
                      <td className="px-4 py-3 text-slate-600">{m.email} / {m.phone}</td>
                      <td className="px-4 py-3 text-slate-600">{m.zone || "Zone A"} ({m.category})</td>
                      <td className="px-4 py-3">
                        {m.status !== false ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Inactive</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Related Partners Tab */}
      {activeTab === "partners" && (
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 overflow-hidden shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-purple-600" />
              Center Partners ({partners.length})
            </h2>
            <button
              type="button"
              onClick={fetchRelatedData}
              disabled={dataLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${dataLoading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-left border-b border-slate-200 font-semibold">
                  <th className="px-4 py-3">Partner Name</th>
                  <th className="px-4 py-3">Partner UID</th>
                  <th className="px-4 py-3">Contact Email &amp; Phone</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {dataLoading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">Loading partners...</td>
                  </tr>
                ) : partners.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">No partners assigned to this center.</td>
                  </tr>
                ) : (
                  partners.map((p) => (
                    <tr key={p.id || p.uid} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.uid}</td>
                      <td className="px-4 py-3 text-slate-600">{p.email} / {p.phone}</td>
                      <td className="px-4 py-3 text-slate-600">{p.zone || "Default Zone"}</td>
                      <td className="px-4 py-3">
                        {p.status !== false ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Inactive</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(AdminDetailPage);
