"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  Building2,
  Users,
  MapPin,
  Calendar,
  Layers,
  Edit2,
  RefreshCw,
  Eye,
  X,
  Mail,
  Phone,
  Search,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  UploadCloud,
  Image as ImageIcon,
} from "lucide-react";
import { usePageAccess } from "@/components/PageGuard";
import { useToast } from "@/context/ToastContext";
import { uploadImagesToCloudinary } from "@/lib/services/upload";
import {
  getProperty,
  updateProperty,
  Property,
} from "@/lib/services/property";

export default function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { readOnly } = usePageAccess();
  const { addToast } = useToast();

  const unwrappedParams = use(params);
  const propertyId = unwrappedParams?.id;

  const [property, setProperty] = useState<Property | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Search/filter within occupying members
  const [memberSearch, setMemberSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    type: "",
    size: "",
    center: "",
    images: [] as string[],
    newImageUrl: "",
  });
  const [updating, setUpdating] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

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
        setEditFormData((prev) => ({
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

  const fetchPropertyData = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const res = await getProperty(propertyId);
      if (res.ok && res.property) {
        setProperty(res.property);
        setMembers(res.members || res.property.members || []);
        setEditFormData({
          name: res.property.name || "",
          type: res.property.type || "Commercial",
          size: res.property.size || "Standard",
          center: res.property.center || "",
          images: res.property.images || [],
          newImageUrl: "",
        });
      } else {
        addToast("error", res.message || "Property not found");
      }
    } catch (err: any) {
      console.error("Failed to load property:", err);
      addToast("error", err?.message || "Failed to load property");
    } finally {
      setLoading(false);
    }
  }, [propertyId, addToast]);

  useEffect(() => {
    fetchPropertyData();
  }, [fetchPropertyData]);

  // Filter members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (statusFilter === "active" && !m.status) return false;
      if (statusFilter === "inactive" && m.status) return false;

      if (memberSearch) {
        const q = memberSearch.toLowerCase();
        const matchName = String(m.fullname || m.businessName || "").toLowerCase().includes(q);
        const matchEmail = String(m.email || "").toLowerCase().includes(q);
        const matchPhone = String(m.phone || "").toLowerCase().includes(q);
        const matchUid = String(m.uid || "").toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchUid) return false;
      }

      return true;
    });
  }, [members, memberSearch, statusFilter]);

  const handleUpdateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property?.id) return;
    setUpdating(true);
    try {
      const res = await updateProperty(property.id, {
        name: editFormData.name.trim(),
        type: editFormData.type.trim(),
        size: editFormData.size.trim(),
        center: editFormData.center.trim() || undefined,
        images: editFormData.images,
      });

      if (res.ok) {
        addToast("success", "Property updated successfully!");
        setIsEditModalOpen(false);
        fetchPropertyData();
      } else {
        throw new Error(res.message || "Failed to update property");
      }
    } catch (err: any) {
      console.error("Update property error:", err);
      addToast("error", err?.message || "Failed to update property");
    } finally {
      setUpdating(false);
    }
  };

  const addImageUrl = () => {
    if (!editFormData.newImageUrl.trim()) return;
    setEditFormData((prev) => ({
      ...prev,
      images: [...prev.images, prev.newImageUrl.trim()],
      newImageUrl: "",
    }));
  };

  const removeImageUrl = (index: number) => {
    setEditFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="mt-4 text-sm font-medium text-slate-600">Loading property details...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Home className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-lg font-bold text-slate-800">Property Not Found</h2>
          <p className="mt-1 text-sm text-slate-500">
            The requested property record could not be found or has been deleted.
          </p>
          <Link
            href="/admin/properties"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
          >
            <ArrowLeft size={16} />
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const activeMembersCount = members.filter((m) => m.status).length;
  const isCommercial = (property.type || "").toLowerCase().includes("commercial");

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/admin/properties"
            className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-emerald-600 transition"
          >
            <ArrowLeft size={16} />
            Properties
          </Link>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="font-medium text-slate-900 truncate max-w-xs">{property.name}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPropertyData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw size={14} />
            Sync
          </button>

          {!readOnly && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm transition"
            >
              <Edit2 size={14} />
              Edit Property
            </button>
          )}
        </div>
      </div>

      {/* Property Overview Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 px-3 py-1">
                {property.pid || property.id?.slice(0, 10)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isCommercial
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {property.type || "Commercial"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{property.name}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <MapPin size={15} className="text-slate-400" />
              Administrative Center:{" "}
              <span className="font-mono font-semibold text-slate-700">
                {property.center || "Global / Unassigned"}
              </span>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-purple-50/80 p-3.5 text-center border border-purple-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700">
                Occupants
              </span>
              <p className="mt-1 text-xl font-extrabold text-purple-900">{members.length}</p>
            </div>
            <div className="rounded-xl bg-emerald-50/80 p-3.5 text-center border border-emerald-100">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                Active
              </span>
              <p className="mt-1 text-xl font-extrabold text-emerald-900">{activeMembersCount}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 text-center border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Size
              </span>
              <p className="mt-1 text-sm font-bold text-slate-800 truncate">{property.size || "Standard"}</p>
            </div>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 border-t border-slate-100 pt-5 text-xs text-slate-600">
          <div>
            <span className="font-semibold uppercase tracking-wide text-slate-400 block mb-0.5">
              Registration Date
            </span>
            <span className="font-medium text-slate-800">
              {property.createdAt
                ? new Date(property.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>

          <div>
            <span className="font-semibold uppercase tracking-wide text-slate-400 block mb-0.5">
              Last Record Update
            </span>
            <span className="font-medium text-slate-800">
              {property.updatedAt
                ? new Date(property.updatedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>

          <div>
            <span className="font-semibold uppercase tracking-wide text-slate-400 block mb-0.5">
              Primary Creator ID
            </span>
            <span className="font-mono font-medium text-slate-700">
              {property.memberId || "System Admin"}
            </span>
          </div>

          <div>
            <span className="font-semibold uppercase tracking-wide text-slate-400 block mb-0.5">
              Internal UUID
            </span>
            <span className="font-mono text-[11px] text-slate-500 truncate block">
              {property.pid}
            </span>
          </div>
        </div>

        {/* Property Photos Gallery */}
        {property.images && property.images.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-3">
              Premises Photos ({property.images.length})
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {property.images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setPreviewImage(imgUrl)}
                  className="group relative h-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 cursor-pointer transition hover:border-emerald-500 hover:shadow-md"
                >
                  <img
                    src={imgUrl}
                    alt={`Property photo ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION: ALL MEMBERS USING THIS PROPERTY */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-emerald-600" size={22} />
                Members Using This Property
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-extrabold text-emerald-800">
                  {members.length}
                </span>
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Registered entities, businesses, and taxpayers associated with or operating at this premises.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-55">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Filter members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500 text-slate-700 appearance-none" 
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members Table */}
        {members.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-semibold text-slate-700">
              No Members Associated Yet
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
              No entities or businesses are currently recorded using this property. When new members register, they can select this existing property.
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No members matched the filter "{memberSearch}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Member UID</th>
                  <th className="px-4 py-3">Full / Business Name</th>
                  <th className="px-4 py-3">Category & Zone</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m) => (
                  <tr key={m.uid || m.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-emerald-700">
                      <Link
                        href={`/admin/entities/${m.uid}`}
                        className="hover:underline flex items-center gap-1"
                      >
                        {m.uid || "—"}
                        <ExternalLink size={11} className="text-slate-400" />
                      </Link>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {m.fullname || "—"}
                      </p>
                      {m.businessName && (
                        <p className="text-[11px] text-slate-500">{m.businessName}</p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      <p className="font-medium text-slate-800">{m.category || "—"}</p>
                      <p className="text-[11px] text-slate-400">Zone: {m.zone || "Default"}</p>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      <p className="flex items-center gap-1 text-slate-700">
                        <Mail size={12} className="text-slate-400" />
                        {m.email || "—"}
                      </p>
                      <p className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                        <Phone size={12} className="text-slate-400" />
                        {m.phone || "—"}
                      </p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          m.status
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {m.status ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/entities/${m.uid}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
                      >
                        <Eye size={13} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-black">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition"
            >
              <X size={20} />
            </button>
            <img
              src={previewImage}
              alt="Property preview"
              className="max-h-[85vh] w-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit2 size={18} className="text-emerald-600" />
                Edit Property Details
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProperty} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Property Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Type
                  </label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
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
                    Size
                  </label>
                  <input
                    type="text"
                    value={editFormData.size}
                    onChange={(e) => setEditFormData({ ...editFormData, size: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 flex items-center gap-1">
                  <MapPin size={12} className="text-emerald-600" />
                  Center ID
                </label>
                <input
                  type="text"
                  value={editFormData.center}
                  onChange={(e) => setEditFormData({ ...editFormData, center: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Property Photos (Cloudinary)
                  </label>
                  {editFormData.images.length > 0 && (
                    <span className="text-xs font-medium text-emerald-600">
                      {editFormData.images.length} photo(s)
                    </span>
                  )}
                </div>

                <div className="mt-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 text-center transition hover:border-emerald-400 hover:bg-slate-50">
                  <UploadCloud className="mx-auto h-6 w-6 text-emerald-600 mb-1" />
                  <p className="text-xs font-semibold text-slate-700">
                    Upload New Premises Photos
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Images are automatically hosted on Cloudinary
                  </p>

                  <label className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer">
                    {uploadingImages ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        Uploading to Cloudinary...
                      </>
                    ) : (
                      <>
                        <ImageIcon size={12} />
                        Browse & Upload Photos
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={uploadingImages || updating}
                      onChange={handlePropertyImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {editFormData.images.length > 0 && (
                  <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {editFormData.images.map((url, i) => (
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
                          onClick={() => removeImageUrl(i)}
                          disabled={uploadingImages || updating}
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
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Save Changes
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
