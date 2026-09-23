"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getCenterId } from "@/lib/permissions";
import {
  getProperties,
  Property,
} from "@/lib/services/property";
import Link from "next/link";
import {
  Home,
  Search,
  Plus,
  RefreshCw,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Layers,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export default function ITPropertiesListPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const centerId = getCenterId(user);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProperties({
        center: centerId,
        search,
        page,
        limit: 20,
      });
      if (res.ok) {
        setProperties(res.data || []);
        if (res.meta) {
          setMeta({
            total: res.meta.total,
            totalPages: res.meta.totalPages || 1,
          });
        } else {
          setMeta({
            total: (res.data || []).length,
            totalPages: Math.ceil((res.data || []).length / 20) || 1,
          });
        }
      } else {
        setProperties([]);
      }
    } catch (err: any) {
      console.error("Failed to load properties:", err);
      addToast("error", err?.message || "Failed to load properties");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [centerId, search, page, addToast]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const filteredProperties = useMemo(() => {
    if (selectedType === "all") return properties;
    return properties.filter(
      (p) => (p.type || "").toLowerCase() === selectedType.toLowerCase()
    );
  }, [properties, selectedType]);

  const stats = useMemo(() => {
    const total = meta.total || properties.length;
    const commercial = properties.filter((p) =>
      (p.type || "").toLowerCase().includes("commercial")
    ).length;
    const residential = properties.filter((p) =>
      (p.type || "").toLowerCase().includes("residential")
    ).length;
    const totalOccupants = properties.reduce(
      (acc, p) => acc + (Number(p.membersCount) || 0),
      0
    );

    return {
      total,
      commercial,
      residential,
      totalOccupants,
    };
  }, [properties, meta.total]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-5 md:p-6 ring-1 ring-emerald-100 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Home className="text-emerald-600" size={28} />
              Property Registry (IT Portal)
            </h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              System-wide premises administration, occupancy tracking, and asset records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadProperties}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
            >
              <RefreshCw size={16} className={loading ? "animate-spin text-emerald-600" : ""} />
              Refresh
            </button>

            <Link
              href="/it/properties/add"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm transition"
            >
              <Plus size={18} />
              Register Property
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Properties
            </span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Home size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">Recorded in registry</p>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Commercial
            </span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Building2 size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">{stats.commercial}</p>
          <p className="text-xs text-slate-500 mt-1">Plazas, shops, complexes</p>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Residential
            </span>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Layers size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">{stats.residential}</p>
          <p className="text-xs text-slate-500 mt-1">Residential estates & houses</p>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Occupants
            </span>
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
              <Users size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">{stats.totalOccupants}</p>
          <p className="text-xs text-slate-500 mt-1">Linked registered members</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search property by name, PID, or type..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">All Property Types</option>
            <option value="commercial">Commercial</option>
            <option value="residential">Residential</option>
            <option value="industrial">Industrial</option>
            <option value="plaza">Plaza / Complex</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-3 text-sm text-slate-500">Loading properties...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Home className="h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-semibold text-slate-700">No properties found</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              {search
                ? `No properties matched your search "${search}". Try adjusting your filters.`
                : "No registered properties recorded yet. Click 'Register Property' to add one."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3.5">Property ID (PID)</th>
                  <th className="px-4 py-3.5">Property Name</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Size</th>
                  <th className="px-4 py-3.5">Center</th>
                  <th className="px-4 py-3.5 text-center">Occupants</th>
                  <th className="px-4 py-3.5">Created At</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProperties.map((prop) => {
                  const occupants = Number(prop.membersCount) || (prop.members ? prop.members.length : 0);
                  const isCommercial = (prop.type || "").toLowerCase().includes("commercial");

                  return (
                    <tr key={prop.id || prop.pid} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-4 font-mono font-semibold text-xs text-emerald-700">
                        {prop.pid || prop.id?.slice(0, 10) || "—"}
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-900">
                        <Link
                          href={`/it/properties/${prop.id || prop.pid}`}
                          className="hover:text-emerald-600 transition"
                        >
                          {prop.name}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isCommercial
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {prop.type || "Commercial"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600">
                        {prop.size || "Standard"}
                      </td>
                      <td className="px-4 py-4 text-xs font-mono text-slate-500">
                        {prop.center ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            {prop.center}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            occupants > 0
                              ? "bg-purple-50 text-purple-700 font-semibold"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Users size={12} />
                          {occupants} {occupants === 1 ? "Member" : "Members"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {prop.createdAt
                          ? new Date(prop.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/it/properties/${prop.id || prop.pid}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
                        >
                          <Eye size={14} />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-100 p-4">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredProperties.length}</span> of{" "}
            <span className="font-semibold text-slate-800">{meta.total}</span> properties
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`rounded-lg p-2 transition ${
                page <= 1
                  ? "cursor-not-allowed text-slate-300 bg-slate-50"
                  : "text-emerald-600 hover:bg-emerald-50 border border-slate-200"
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-slate-700">
              Page {page} of {meta.totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className={`rounded-lg p-2 transition ${
                page >= meta.totalPages
                  ? "cursor-not-allowed text-slate-300 bg-slate-50"
                  : "text-emerald-600 hover:bg-emerald-50 border border-slate-200"
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
