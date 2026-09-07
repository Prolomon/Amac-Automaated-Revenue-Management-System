"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getCenterId } from "@/lib/permissions";
import {
  getProperties,
  createProperty,
  Property,
} from "@/lib/services/property";
import { getAllAdmins, getPublicCenters } from "@/lib/services/admin";
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
  UploadCloud,
  Image as ImageIcon,
} from "lucide-react";
import { uploadImagesToCloudinary } from "@/lib/services/upload";

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

  // Add Property Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [centers, setCenters] = useState<{ uid: string; center: string; adminName?: string }[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Commercial",
    size: "Standard",
    center: "",
    images: [] as string[],
  });

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

  // Load all available revenue centers for the IT property modal dropdown
  useEffect(() => {
    let isMounted = true;
    const loadCenters = async () => {
      setLoadingCenters(true);
      try {
        const res = await getAllAdmins();
        const list = Array.isArray(res?.data) ? res.data : (res?.admins || []);
        const activeList = list
          .filter((a: any) => a.status !== false)
          .map((a: any) => ({
            uid: a.uid || a.id,
            center: a.center || a.adminName || a.uid,
            adminName: a.adminName,
          }));
        if (isMounted) {
          setCenters(activeList);
          if (activeList.length > 0 && !formData.center) {
            setFormData((prev) => ({ ...prev, center: activeList[0].uid }));
          }
        }
      } catch (err) {
        try {
          const pubRes = await getPublicCenters();
          const pubList = (pubRes?.data || []).map((c: any) => ({
            uid: c.uid || c.center,
            center: c.center,
            adminName: c.adminName,
          }));
          if (isMounted) {
            setCenters(pubList);
            if (pubList.length > 0 && !formData.center) {
              setFormData((prev) => ({ ...prev, center: pubList[0].uid }));
            }
          }
        } catch (pubErr) {
          console.warn("Failed to load centers:", pubErr);
        }
      } finally {
        if (isMounted) setLoadingCenters(false);
      }
    };
    loadCenters();
    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast("error", "Property name is required");
      return;
    }
    if (!formData.center) {
      addToast("error", "Please select an administrative center");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Property> = {
        name: formData.name.trim(),
        type: formData.type.trim(),
        size: formData.size.trim(),
        center: formData.center.trim() || undefined,
        images: formData.images,
      };

      const res = await createProperty(payload);
      if (res.ok) {
        addToast("success", res.message || "Property registered successfully!");
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          type: "Commercial",
          size: "Standard",
          center: centers[0]?.uid || "",
          images: [],
        });
        loadProperties();
      } else {
        throw new Error(res.message || "Failed to register property");
      }
    } catch (err: any) {
      console.error("Create property error:", err);
      addToast("error", err?.message || "Failed to register property");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePropertyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const base64List: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          addToast("error", `${file.name} is not an image file`);
          continue;
        }
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        base64List.push(base64);
      }

      if (base64List.length > 0) {
        const uploadRes = await uploadImagesToCloudinary(base64List);
        const newUrls = uploadRes?.urls || base64List;
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...newUrls],
        }));
        addToast("success", `${newUrls.length} image(s) uploaded to Cloudinary!`);
      }
    } catch (err: any) {
      console.error("Image upload failed:", err);
      addToast("error", err?.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

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

            <button
              onClick={() => {
                if (centers.length > 0 && !formData.center) {
                  setFormData((prev) => ({ ...prev, center: centers[0].uid }));
                }
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm transition"
            >
              <Plus size={18} />
              Register Property
            </button>
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

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                  <Home size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Register New Property (IT)</h2>
                  <p className="text-xs text-slate-500">Add physical premises to the revenue registry</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Property Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silverbird Galleria, Shop 4 Wuse Zone 2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Property Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Residential">Residential</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Plaza / Mall">Plaza / Mall</option>
                    <option value="Market Stall">Market Stall</option>
                    <option value="Office Complex">Office Complex</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Property Size *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 sqm, Standard, Large"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1">
                  <MapPin size={12} className="text-emerald-600" />
                  Administrative Center *
                </label>
                <select
                  value={formData.center}
                  onChange={(e) => setFormData({ ...formData, center: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                >
                  <option value="">
                    {loadingCenters ? "Loading revenue centers..." : "-- Select Revenue Center --"}
                  </option>
                  {centers.map((c) => (
                    <option key={c.uid} value={c.uid}>
                      {c.center} ({c.uid})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Select which revenue center this property falls under.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Property Images (Cloudinary)
                  </label>
                  {formData.images.length > 0 && (
                    <span className="text-xs font-medium text-emerald-600">
                      {formData.images.length} photo(s) selected
                    </span>
                  )}
                </div>

                <div className="mt-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-5 text-center transition hover:border-emerald-400 hover:bg-slate-50">
                  <UploadCloud className="mx-auto h-7 w-7 text-emerald-600 mb-1.5" />
                  <p className="text-xs font-semibold text-slate-700">
                    Upload Property Premises Evidence
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Images are automatically uploaded and hosted on Cloudinary
                  </p>

                  <label className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer">
                    {uploadingImages ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        Uploading to Cloudinary...
                      </>
                    ) : (
                      <>
                        <ImageIcon size={13} />
                        Browse & Upload Photos
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={uploadingImages || submitting}
                      onChange={handlePropertyImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                    {formData.images.map((url, i) => (
                      <div
                        key={i}
                        className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Property photo ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          disabled={uploadingImages || submitting}
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600 transition"
                          title="Remove image"
                        >
                          <X size={12} />
                        </button>
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white">
                          #{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting || uploadingImages}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImages}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Registering Property...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Register Property
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
