"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Camera,
  Layers,
  Users,
  ShieldCheck,
  Eye,
  X,
  ExternalLink,
  RefreshCw,
  Building2,
} from "lucide-react";
import {
  getEnumeratorById,
  getDailyTaskProgress,
  getCaptures,
  Enumerator,
  DailyTaskProgress,
  PropertyCapture,
} from "@/lib/services/enumerator";
import { getAllMembers } from "@/lib/services/member";
import { useToast } from "@/context/ToastContext";

export default function EnumeratorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { addToast } = useToast();

  const [enumerator, setEnumerator] = useState<Enumerator | null>(null);
  const [taskProgress, setTaskProgress] = useState<DailyTaskProgress | null>(null);
  const [captures, setCaptures] = useState<PropertyCapture[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"captures" | "members" | "guarantors" | "team">("captures");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [eRes, tRes, cRes] = await Promise.all([
        getEnumeratorById(id),
        getDailyTaskProgress(id).catch(() => ({ ok: false, data: null })),
        getCaptures({ enumeratorId: id, limit: 50 }).catch(() => ({ ok: false, data: [] })),
      ]);

      if (eRes.ok) {
        setEnumerator(eRes.data);
      }
      if (tRes?.ok && tRes.data) {
        setTaskProgress(tRes.data);
      }
      if (cRes?.ok && cRes.data) {
        setCaptures(cRes.data);
      }

      // Fetch members registered by this enumerator
      try {
        const mRes = await getAllMembers(1, 100);
        const mList = Array.isArray(mRes?.data) ? mRes.data : [];
        setMembers(mList.filter((m: any) => m.enumeratorId === id));
      } catch (mErr) {
        console.warn("Could not fetch members for enumerator:", mErr);
      }
    } catch (err: any) {
      addToast("error", err?.message || "Failed to load enumerator details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="mt-3 text-sm">Loading enumerator profile...</p>
      </div>
    );
  }

  if (!enumerator) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="mt-3 text-lg font-bold text-slate-800">Enumerator Not Found</h2>
        <p className="mt-1 text-sm text-slate-500">The requested personnel record does not exist.</p>
        <Link
          href="/admin/enumerators"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to List
        </Link>
      </div>
    );
  }

  const cleanWaNumber = (enumerator.altPhone || enumerator.phone).replace(/[^0-9]/g, "");

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/enumerators"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{enumerator.name}</h1>
          <p className="font-mono text-xs text-slate-500">ID: {enumerator.uid}</p>
        </div>
      </div>

      {/* Profile Banner */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        <div className="bg-gradient-to-r from-[#0B3B26] to-[#125939] p-6 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-bold uppercase ring-4 ring-white/20">
                {enumerator.avatar ? (
                  <img
                    src={enumerator.avatar}
                    alt={enumerator.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  enumerator.name.slice(0, 2)
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-bold">{enumerator.name}</h2>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                      enumerator.level === "SUPER"
                        ? "bg-purple-400/30 text-purple-200 border border-purple-300/40"
                        : "bg-emerald-400/30 text-emerald-200 border border-emerald-300/40"
                    }`}
                  >
                    {enumerator.level === "SUPER" ? "Supervisor" : "Field Enumerator"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      enumerator.status ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {enumerator.status ? "Active" : "Disabled"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-white/80">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-emerald-300" /> {enumerator.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-emerald-300" /> {enumerator.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-emerald-300" /> {enumerator.center} (Zone {enumerator.zone || "A"})
                  </span>
                </div>
              </div>
            </div>

            {cleanWaNumber && (
              <a
                href={`https://wa.me/${cleanWaNumber.startsWith("0") ? "234" + cleanWaNumber.slice(1) : cleanWaNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-400 transition"
              >
                <ExternalLink className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 p-4 sm:grid-cols-4">
          <div className="p-2">
            <p className="text-[11px] font-semibold uppercase text-slate-400">Ledger Account</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-800">
              {enumerator.wallet?.accountNo || enumerator.wallets?.[0]?.accountNo || "Provisioned"}
            </p>
          </div>
          <div className="p-2 pl-4">
            <p className="text-[11px] font-semibold uppercase text-slate-400">Wallet Balance</p>
            <p className="mt-1 text-sm font-bold text-emerald-700">
              ₦{(enumerator.wallet?.balance ?? enumerator.wallets?.[0]?.balance ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="p-2 pl-4">
            <p className="text-[11px] font-semibold uppercase text-slate-400">Total Captures</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {captures.length || enumerator._count?.properties || 0}
            </p>
          </div>
          <div className="p-2 pl-4">
            <p className="text-[11px] font-semibold uppercase text-slate-400">Assigned Supervisor</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              {enumerator.supervisor?.name || "None / Direct"}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Task Progress (50 Captures & 50 Registrations) */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">Today's Daily Task Target (50 / 50)</h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Reward: ₦50 per capture • ₦50 per registration
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Captures Progress */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Camera className="h-4 w-4 text-emerald-600" />
                Daily Captures Target
              </span>
              <span className="text-emerald-700 font-bold">
                {taskProgress?.captures?.submitted ?? 0} / 50
              </span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${taskProgress?.captures?.percent ?? 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Earned: <strong>₦{(taskProgress?.captures?.earned ?? 0).toLocaleString()}</strong> today
            </p>
          </div>

          {/* Registrations Progress */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Building2 className="h-4 w-4 text-blue-600" />
                Daily Registrations Target
              </span>
              <span className="text-blue-700 font-bold">
                {taskProgress?.registrations?.submitted ?? 0} / 50
              </span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${taskProgress?.registrations?.percent ?? 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Earned: <strong>₦{(taskProgress?.registrations?.earned ?? 0).toLocaleString()}</strong> today
            </p>
          </div>

          {/* Today's Payout */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Today's Accrued Earnings
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-950">
              ₦{(taskProgress?.earnings?.today ?? 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-emerald-700">
              Auto-credited to wallet balance upon supervisor approval.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("captures")}
          className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "captures"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Property Captures ({captures.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "members"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Registered Entities ({members.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("guarantors")}
          className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "guarantors"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Guarantors
        </button>

        {enumerator.level === "SUPER" && (
          <button
            type="button"
            onClick={() => setActiveTab("team")}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === "team"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Assigned Field Team ({(enumerator as any).teamMembers?.length || 0})
          </button>
        )}
      </div>

      {/* Tab 1: Captures */}
      {activeTab === "captures" && (
        <div className="space-y-4">
          {captures.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-slate-400">
              <Camera className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-600">No property captures recorded yet</p>
              <p className="text-xs text-slate-400">Captures taken via the enumeration mobile app will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {captures.map((cap) => (
                <div key={cap.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
                  {/* Photo Preview Strip */}
                  <div className="relative h-44 bg-slate-100">
                    {cap.images && cap.images.length > 0 ? (
                      <img
                        src={cap.images[0]}
                        alt={cap.name}
                        onClick={() => setPreviewImage(cap.images[0])}
                        className="h-full w-full object-cover cursor-pointer hover:opacity-95 transition"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300">
                        <Camera className="h-8 w-8" />
                      </div>
                    )}
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xs ${
                        cap.status === "APPROVED"
                          ? "bg-emerald-500 text-white"
                          : cap.status === "DENIED"
                            ? "bg-red-500 text-white"
                            : "bg-amber-500 text-white"
                      }`}
                    >
                      {cap.status}
                    </span>

                    {cap.images && cap.images.length > 1 && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        +{cap.images.length - 1} photos
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">{cap.name}</h3>
                        <p className="font-mono text-[11px] text-emerald-700 font-bold">PID: {cap.pid || cap.id}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{cap.type}</span>
                    </div>

                    <p className="text-xs text-slate-600 truncate">{cap.address}</p>

                    {cap.rejectionReason && (
                      <p className="rounded-lg bg-red-50 p-2 text-xs font-medium text-red-700">
                        Reason: {cap.rejectionReason}
                      </p>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                      <span>{new Date(cap.createdAt).toLocaleDateString()}</span>
                      <span className="font-semibold text-emerald-700">Reward: ₦{cap.reward}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Registered Members */}
      {activeTab === "members" && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
          {members.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-600">No entities registered by this enumerator yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Entity / Business</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">BVN</th>
                    <th className="px-5 py-3.5">Approval Status</th>
                    <th className="px-5 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id || m.uid} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/entities/${m.uid}`} className="font-semibold text-slate-900 hover:text-emerald-700">
                          {m.businessName || m.fullname}
                        </Link>
                        <p className="font-mono text-[11px] text-slate-400">{m.uid}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{m.type}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{m.phone}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-700">{m.bvn || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            m.enumerationStatus === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : m.enumerationStatus === "DENIED"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {m.enumerationStatus || "APPROVED"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Guarantors */}
      {activeTab === "guarantors" && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Guarantor 1</h3>
            <p className="text-base font-bold text-slate-900">
              {enumerator.guarantor1?.name || "Not provided"}
            </p>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> {enumerator.guarantor1?.phone || "—"}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> {enumerator.guarantor1?.email || "—"}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {enumerator.guarantor1?.address || "—"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Guarantor 2</h3>
            <p className="text-base font-bold text-slate-900">
              {enumerator.guarantor2?.name || "Not provided"}
            </p>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> {enumerator.guarantor2?.phone || "—"}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> {enumerator.guarantor2?.email || "—"}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {enumerator.guarantor2?.address || "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Team (if Supervisor) */}
      {activeTab === "team" && enumerator.level === "SUPER" && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
          <div className="border-b border-slate-100 p-4">
            <h3 className="font-semibold text-slate-900 text-sm">Assigned Field Officers</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {((enumerator as any).teamMembers || []).map((tm: any) => (
              <div key={tm.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition">
                <div>
                  <Link href={`/admin/enumerators/${tm.uid}`} className="font-semibold text-slate-900 hover:text-emerald-700">
                    {tm.name}
                  </Link>
                  <p className="font-mono text-xs text-slate-400">{tm.uid} • {tm.phone}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-emerald-600" />
                    {tm._count?.properties || 0} captures
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-blue-600" />
                    {tm._count?.members || 0} entities
                  </span>
                  <Link
                    href={`/admin/enumerators/${tm.uid}`}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewImage}
              alt="Property inspection"
              className="max-h-[82vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
