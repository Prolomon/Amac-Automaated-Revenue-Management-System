"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
} from "lucide-react";
import { createEnumerator, getAllEnumerators, Enumerator } from "@/lib/services/enumerator";
import { getPublicCenters, PublicCenter } from "@/lib/services/admin";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { uploadImagesToCloudinary } from "@/lib/services/upload";

const ZONES = ["A", "B", "C", "D", "E"];

export default function AddEnumeratorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [centers, setCenters] = useState<PublicCenter[]>([]);
  const [supervisors, setSupervisors] = useState<Enumerator[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    altPhone: "",
    dob: "",
    address: "",
    center: "",
    zone: "A",
    level: "BASIC" as "BASIC" | "SUPER",
    supervisorId: "",
    avatar: "",
    guarantor1: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    guarantor2: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    async function loadData() {
      setLoadingInitial(true);
      try {
        const [cRes, sRes] = await Promise.all([
          getPublicCenters().catch(() => ({ data: [] })),
          getAllEnumerators({ level: "SUPER", limit: 100 }).catch(() => ({ data: [] })),
        ]);

        if (cRes?.data) setCenters(cRes.data);
        if (sRes?.data) setSupervisors(sRes.data);

        if (cRes?.data?.length > 0) {
          setForm((prev) => ({ ...prev, center: cRes.data[0].id || cRes.data[0].centerName }));
        }
      } catch (err) {
        console.error("Failed to load initial centers or supervisors:", err);
      } finally {
        setLoadingInitial(false);
      }
    }

    loadData();
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingAvatar(true);
    try {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const uploadRes = await uploadImagesToCloudinary([base64]);
        const url = uploadRes?.urls?.[0] || base64;
        setForm((prev) => ({ ...prev, avatar: url }));
        addToast("success", "Avatar uploaded successfully!");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      addToast("error", err?.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.center.trim()) {
      addToast("error", "Name, email, phone, and revenue center are required.");
      return;
    }

    if (!form.altPhone.trim()) {
      addToast("error", "Alternative phone number (WhatsApp) is required.");
      return;
    }

    if (!form.guarantor1.name.trim() || !form.guarantor1.phone.trim()) {
      addToast("error", "Guarantor 1 name and phone are compulsory.");
      return;
    }

    if (!form.guarantor2.name.trim() || !form.guarantor2.phone.trim()) {
      addToast("error", "Guarantor 2 name and phone are compulsory.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        altPhone: form.altPhone.trim(),
        supervisorId: form.level === "SUPER" ? null : form.supervisorId || null,
      };

      const res = await createEnumerator(payload);
      if (res.ok) {
        addToast("success", "Enumerator created successfully with automated wallet provision!");
        router.push(`/admin/enumerators/${res.data.uid}`);
      }
    } catch (err: any) {
      addToast("error", err?.message || "Failed to create enumerator");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/enumerators"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add Enumeration Personnel</h1>
          <p className="text-xs text-slate-500">
            Onboard field enumerator or supervisor with guarantors and automated wallet creation.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                {form.avatar ? (
                  <img src={form.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-slate-300" />
                )}
              </div>
              <div>
                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition">
                  <UploadCloud className="h-4 w-4 text-emerald-600" />
                  {uploadingAvatar ? "Uploading..." : "Upload Profile Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
                <p className="mt-1 text-[11px] text-slate-400">Square photo recommended for ID badge.</p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ibrahim Abubakar"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="officer@amac.gov.ng"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Primary Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="08012345678"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Alternative Phone (WhatsApp) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={form.altPhone}
                onChange={(e) => setForm({ ...form, altPhone: e.target.value })}
                placeholder="08098765432 (Must be WhatsApp)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Date of Birth
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Residential Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="House number, Street, Area"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Operational Role & Assignment */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
            <h2 className="text-base font-semibold text-slate-900">Role & Field Assignment</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Personnel Level <span className="text-red-500">*</span>
              </label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value as any })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 transition"
              >
                <option value="BASIC">Field Enumerator (Captures & Registrations)</option>
                <option value="SUPER">Supervisor (Reviews & Approvals)</option>
              </select>
            </div>

            {form.level === "BASIC" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Assign to Supervisor
                </label>
                <select
                  value={form.supervisorId}
                  onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 transition"
                >
                  <option value="">Select Supervisor...</option>
                  {supervisors.map((s) => (
                    <option key={s.uid} value={s.uid}>
                      {s.name} ({s.center} - {s.phone})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Revenue Center <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.center}
                onChange={(e) => setForm({ ...form, center: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 transition"
              >
                {centers.length > 0 ? (
                  centers.map((c) => (
                    <option key={c.id || c.center} value={c.center}>
                      {c.center}
                    </option>
                  ))
                ) : (
                  <option value="AMAC Central">AMAC Central</option>
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Zone</label>
              <select
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 transition"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    Zone {z}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Guarantors (2 Compulsory) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">Guarantor Verification (2 Required)</h2>
          </div>

          {/* Guarantor 1 */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Guarantor 1</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                placeholder="Full Name *"
                value={form.guarantor1.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    guarantor1: { ...form.guarantor1, name: e.target.value },
                  })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
              <input
                type="tel"
                required
                placeholder="Phone Number *"
                value={form.guarantor1.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    guarantor1: { ...form.guarantor1, phone: e.target.value },
                  })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={form.guarantor1.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    guarantor1: { ...form.guarantor1, email: e.target.value },
                  })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Physical Address"
                value={form.guarantor1.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    guarantor1: { ...form.guarantor1, address: e.target.value },
                  })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Guarantor 2 */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Guarantor 2</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                placeholder="Full Name *"
                value={form.guarantor2.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    guarantor2: { ...form.guarantor2, name: e.target.value },
                  })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
              <input
                type="tel"
                required
                placeholder="Phone Number *"
                value={form.guarantor2.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    guarantor2: { ...form.guarantor2, phone: e.target.value },
                  })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={form.guarantor2.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    guarantor2: { ...form.guarantor2, email: e.target.value },
                  })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Physical Address"
                value={form.guarantor2.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    guarantor2: { ...form.guarantor2, address: e.target.value },
                  })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/enumerators"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {submitting ? "Creating Personnel..." : "Create & Provision Wallet"}
          </button>
        </div>
      </form>
    </div>
  );
}
