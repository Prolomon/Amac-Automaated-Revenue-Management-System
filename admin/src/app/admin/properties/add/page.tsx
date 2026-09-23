"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Home,
  Building2,
  MapPin,
  Layers,
  UploadCloud,
  X,
  Image as ImageIcon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePageAccess } from "@/components/PageGuard";
import { useToast } from "@/context/ToastContext";
import { getCenterId } from "@/lib/permissions";
import { createProperty, Property } from "@/lib/services/property";
import { uploadImagesToCloudinary } from "@/lib/services/upload";

const PROPERTY_TYPES = [
  "Commercial",
  "Residential",
  "Industrial",
  "Plaza / Mall",
  "Market Stall",
  "Office Complex",
  "Shop / Kiosk",
  "Hotel / Hospitality",
  "Filling Station",
  "Warehouse",
  "Other",
];

const ZONE_OPTIONS = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E", "Other"];

export default function AdminAddPropertyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { readOnly } = usePageAccess();
  const { addToast } = useToast();
  const centerId = getCenterId(user);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "Commercial",
    size: "Standard",
    zone: "Zone A",
    address: "",
    images: [] as string[],
  });

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
        addToast("success", `${newUrls.length} image(s) uploaded successfully!`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (readOnly) {
      addToast("error", "You have read-only access and cannot register properties.");
      return;
    }

    if (!formData.name.trim()) {
      addToast("error", "Property name is required.");
      return;
    }

    if (!formData.address.trim()) {
      addToast("error", "Physical address is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Property> = {
        name: formData.name.trim(),
        type: formData.type.trim(),
        size: formData.size.trim(),
        zone: formData.zone.trim(),
        address: formData.address.trim(),
        center: user?.uid || centerId || undefined,
        images: formData.images,
      };

      const res = await createProperty(payload);
      if (res.ok) {
        addToast("success", res.message || "Property registered successfully!");
        router.push("/admin/properties");
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

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-teal-50 p-6 ring-1 ring-emerald-100 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
            <Home size={28} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 mb-1">
              <Sparkles size={12} />
              Property Onboarding
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Register New Property</h1>
            <p className="text-sm text-slate-600">
              Create physical premises, commercial plazas, residential structures, or market stalls in the municipal revenue registry.
            </p>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Basic Information */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Building2 className="text-emerald-600" size={20} />
            <h2 className="text-base font-bold text-slate-800">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Property Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Silverbird Galleria, Shop 4 Wuse Zone 2, Banex Plaza"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-slate-600"
              />
              <p className="mt-1 text-xs text-slate-400">
                Enter the official or recognizable name of the building, plaza, or premises.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Property Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-slate-600"
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Property Size / Dimension *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 500 sqm, Standard, 3-Storey Complex, Shop 20sqm"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-slate-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Cadastral Zone
              </label>
              <select
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-slate-600"
              >
                {ZONE_OPTIONS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <MapPin size={13} className="text-emerald-600" />
                Administrative Center UID
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={user?.uid || centerId || "Current Admin Center"}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-mono text-slate-700 cursor-not-allowed outline-none"
              />
              <p className="mt-1 text-xs text-slate-400">
                Automatically registered under your administrative center jurisdiction.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Location & Address */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <MapPin className="text-emerald-600" size={20} />
            <h2 className="text-base font-bold text-slate-800">Location & Physical Address</h2>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Detailed Physical Address *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Plot 1234, Ahmadu Bello Way, Area 11, Garki, Abuja"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-slate-600"
            />
            <p className="mt-1 text-xs text-slate-400">
              Provide full street address, building numbers, landmarks, or district details for location verification.
            </p>
          </div>
        </div>

        {/* Card 3: Photos & Evidence */}
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <ImageIcon className="text-emerald-600" size={20} />
              <h2 className="text-base font-bold text-slate-800">Premises Photos & Evidence</h2>
            </div>
            {formData.images.length > 0 && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {formData.images.length} photo(s) uploaded
              </span>
            )}
          </div>

          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-6 text-center transition hover:border-emerald-400 hover:bg-slate-50">
            <UploadCloud className="mx-auto h-10 w-10 text-emerald-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              Upload Property Premises Evidence Photos
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Select multiple photos of the front exterior, entrance, shop number, or surrounding views.
            </p>

            <label className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer">
              {uploadingImages ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Uploading to Cloudinary...
                </>
              ) : (
                <>
                  <ImageIcon size={14} />
                  Browse & Upload Images
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 pt-2">
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
                    className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600 transition shadow-sm"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Photo #{i + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/properties"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || uploadingImages || readOnly}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md transition disabled:opacity-50"
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
  );
}
