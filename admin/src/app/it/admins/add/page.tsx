"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAdmin, getAllAdmins, Admin } from "@/lib/services/admin";
import { useToast } from "@/context/ToastContext";

export default function CreateAdminPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [centers, setCenters] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    adminName: "",
    email: "",
    phone: "",
    password: "",
    center: "",
    state: "",
    lga: "",
    address: "",
    country: "Nigeria",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllAdmins();
        const list = Array.isArray(data?.data) ? data.data : data?.admins || [];
        setCenters(list);
      } catch (e) {
        addToast("error", "Failed to load centers");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [addToast]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.adminName.trim()) {
      addToast("error", "Admin name is required");
      return;
    }
    if (!form.email.trim()) {
      addToast("error", "Email is required");
      return;
    }
    if (!form.phone.trim()) {
      addToast("error", "Phone number is required");
      return;
    }
    if (!form.password) {
      addToast("error", "Password is required");
      return;
    }
    if (!form.center) {
      addToast("error", "Please assign a center");
      return;
    }

    setSaving(true);
    try {
      const res = await createAdmin({
        center: form.center,
        adminName: form.adminName,
        adminEmail: form.email,
        adminPhone: form.phone,
        email: form.email,
        phone: form.phone,
        password: form.password,
        state: form.state,
        address: form.address,
        lga: form.lga,
        country: form.country,
      });
      if (!res?.ok) {
        throw new Error(res?.message || "Failed to create admin");
      }
      addToast("success", "Admin created successfully");
      router.push("/it/admins");
    } catch (err) {
      addToast("error", err.message || "Failed to create admin");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
        >
          <ArrowLeft size={16} />
          Back to Admins
        </button>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold text-slate-900">Create Admin</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a new center administrator account
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 md:p-8 ring-1 ring-slate-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Admin Name *</label>
              <input
                value={form.adminName}
                onChange={(e) => handleChange("adminName", e.target.value)}
                placeholder="e.g., John Doe"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="e.g., admin@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Phone *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="e.g., 08012345678"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Set a temporary password"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Assigned Center *</label>
              <select
                value={form.center}
                onChange={(e) => handleChange("center", e.target.value)}
                className={`${inputClass} appearance-none`}
              >
                <option value="">Select a center</option>
                {centers.map((c) => (
                  <option key={c.uid || c.id} value={c.uid}>
                    {c.adminName || c.adminEmail || c.email || c.uid}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">State</label>
              <input
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                placeholder="e.g., FCT"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">LGA</label>
              <input
                value={form.lga}
                onChange={(e) => handleChange("lga", e.target.value)}
                placeholder="e.g., AMAC"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Address</label>
              <input
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Office address"
                className={inputClass}
              />
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
            <Building2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <p className="text-sm text-emerald-800">
              The assigned center determines which entities, payments and
              demands this administrator will be scoped to.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/it/admins"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-400"
            >
              <Save size={18} />
              {saving ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
