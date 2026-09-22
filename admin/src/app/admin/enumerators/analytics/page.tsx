"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Camera,
  Award,
  Wallet,
  RefreshCw,
  Building,
} from "lucide-react";
import { enumeratorService, EnumerationAnalytics } from "@/lib/services/enumerator";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function EnumeratorAnalyticsPage() {
  const [data, setData] = useState<EnumerationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await enumeratorService.getAnalytics();
      if (res?.ok && res?.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const captureStatusData = data
    ? [
        { name: "Approved", value: data.capturesBreakdown?.approved || 0, color: "#10b981" },
        { name: "Pending", value: data.capturesBreakdown?.pending || 0, color: "#f59e0b" },
        { name: "Denied", value: data.capturesBreakdown?.denied || 0, color: "#ef4444" },
      ]
    : [];

  const registrationStatusData = data
    ? [
        { name: "Approved", value: data.registrationsBreakdown?.approved || 0, color: "#10b981" },
        { name: "Pending", value: data.registrationsBreakdown?.pending || 0, color: "#f59e0b" },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/enumerators"
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-600"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Enumeration Ecosystem Analytics
            </h1>
            <p className="text-sm text-slate-500">
              Live metrics across field captures, entity registrations, and reward payouts
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Gathering ecosystem analytics...</p>
        </div>
      ) : data ? (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Enumerators
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={20} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {data.overview?.totalPersonnel || 0}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span className="text-blue-600 font-bold">{data.overview?.totalSupervisors || 0}</span> Supervisors
                <span className="text-slate-300">•</span>
                <span className="text-emerald-600 font-bold">{data.overview?.totalEnumerators || 0}</span> Field Agents
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Captures
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Camera size={20} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {data.overview?.totalCaptures || 0}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span className="text-emerald-600 font-bold">{data.capturesBreakdown?.approved || 0}</span> Approved
                <span className="text-slate-300">•</span>
                <span className="text-amber-500 font-bold">{data.capturesBreakdown?.pending || 0}</span> Pending
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Entities Registered
                </span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building size={20} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                {data.overview?.totalRegistrations || 0}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span className="text-emerald-600 font-bold">{data.registrationsBreakdown?.approved || 0}</span> Approved
                <span className="text-slate-300">•</span>
                <span className="text-amber-500 font-bold">{data.registrationsBreakdown?.pending || 0}</span> Pending
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Rewards Paid
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-emerald-600">
                ₦{(data.overview?.totalRewardsPaid || 0).toLocaleString()}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span>₦50 fixed per approved task</span>
              </div>
            </div>
          </div>

          {/* Breakdown Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Captures Status Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Camera size={18} className="text-emerald-600" />
                Capture Pipeline Status
              </h2>
              <p className="text-xs text-slate-500 mb-4">Breakdown of submitted property photo sets</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={captureStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {captureStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                <div>
                  <span className="text-xs text-slate-400">Approved</span>
                  <p className="text-lg font-bold text-emerald-600">{data.capturesBreakdown?.approved || 0}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Pending Review</span>
                  <p className="text-lg font-bold text-amber-500">{data.capturesBreakdown?.pending || 0}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Denied</span>
                  <p className="text-lg font-bold text-rose-500">{data.capturesBreakdown?.denied || 0}</p>
                </div>
              </div>
            </div>

            {/* Registrations Status Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Building size={18} className="text-indigo-600" />
                Member Registration Pipeline
              </h2>
              <p className="text-xs text-slate-500 mb-4">Verification status of new taxpayers & entities</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={registrationStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {registrationStatusData.map((entry, index) => (
                        <Cell key={`reg-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                <div>
                  <span className="text-xs text-slate-400">Approved</span>
                  <p className="text-lg font-bold text-emerald-600">{data.registrationsBreakdown?.approved || 0}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Pending Review</span>
                  <p className="text-lg font-bold text-amber-500">{data.registrationsBreakdown?.pending || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Task Target Benchmark Card */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500/30 mb-3">
                  <Award size={14} /> Daily Target Standard
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">50 Captures & 50 Registrations Target</h3>
                <p className="text-sm text-slate-300 mt-1 max-w-xl">
                  Each field enumerator is measured against the daily threshold of 50 property photo captures and 50 registered entities. Each approved unit immediately pays ₦50 into their wallet.
                </p>
              </div>

              <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[130px]">
                  <p className="text-xs text-slate-300 uppercase tracking-wider">Per Capture</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">₦50</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Min 3 - 8 Photos</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center min-w-[130px]">
                  <p className="text-xs text-slate-300 uppercase tracking-wider">Per Registration</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">₦50</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">BVN + Wallet Ready</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <p className="text-slate-500 text-sm">No analytics data available yet.</p>
        </div>
      )}
    </div>
  );
}
