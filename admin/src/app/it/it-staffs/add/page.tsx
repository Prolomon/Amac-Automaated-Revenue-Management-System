"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Check,
  RotateCcw,
  Sparkles,
  Lock,
  User,
  Mail,
  Phone,
  Key,
  MapPin,
} from "lucide-react";
import { createITStaff } from "@/lib/services/itStaff";
import {
  PERMISSION_RESOURCES,
  PermissionsGroup,
  createFullPermissions,
  NO_PERMISSIONS,
} from "@/lib/permissions";
import { useToast } from "@/context/ToastContext";

const RESOURCE_LABELS: Record<string, { label: string; description: string }> = {
  member: { label: "Entities (Members)", description: "Taxpayers, businesses, and registered entities" },
  payment: { label: "Payments", description: "Invoices, transactions, and payment statuses" },
  property: { label: "Properties", description: "Land, buildings, and enumerated real estate" },
  demand: { label: "Demand Notices", description: "Generation, dispatch, and review of demand notices" },
  staff: { label: "Center Staffs", description: "Revenue center staff members and roles" },
  department: { label: "Departments", description: "Center departments and administrative divisions" },
  tier: { label: "Pricing / Tiers", description: "Tariff rates, business category tiers, and fees" },
  terminal: { label: "Terminals", description: "POS terminals and field enumeration devices" },
  partner: { label: "Partners", description: "Corporate and collection partner management" },
  discount: { label: "Discount Requests", description: "Waivers, relief, and discount application reviews" },
  recruitment: { label: "Recruitment", description: "Job postings and field enumerator applications" },
  enumerator: { label: "Enumerators", description: "Field agents, supervisors, and rewards" },
  paymentCode: { label: "Payment Code", description: "Payment plates, account cards, and checkout QR codes" },
  paymentSplit: { label: "Payment Split", description: "Multi-party revenue distribution configurations" },
  revenueAssurance: { label: "Assurance", description: "Automated discrepancy checks and audit trails" },
  financeTracker: { label: "Finance Tracker", description: "System-wide financial analytics and transaction search" },
  activityLog: { label: "Activity Logs", description: "Security logs, user sessions, and audit entries" },
  wallet: { label: "Wallet", description: "Accounts, balances, statements, and disbursements" },
  helpCenter: { label: "Help Center", description: "Support tickets, user inquiries, and FAQs" },
};

export default function AddITStaffPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    gender: "MALE",
    location: "",
    password: "",
  });

  // Permissions state initialized with empty/false permissions
  const [permissions, setPermissions] = useState<PermissionsGroup>(() =>
    JSON.parse(JSON.stringify(NO_PERMISSIONS))
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePermission = (
    resource: string,
    action: "create" | "read" | "update" | "delete"
  ) => {
    setPermissions((prev: any) => {
      const copy = { ...prev };
      if (!copy[resource]) {
        copy[resource] = { create: false, read: false, update: false, delete: false };
      }
      const currentVal = Boolean(copy[resource][action]);
      copy[resource] = {
        ...copy[resource],
        [action]: !currentVal,
      };
      // If turning on create/update/delete, auto-enable read for sanity
      if (!currentVal && action !== "read") {
        copy[resource].read = true;
      }
      return copy;
    });
  };

  const toggleResourceAll = (resource: string) => {
    setPermissions((prev: any) => {
      const copy = { ...prev };
      const current = copy[resource] || { create: false, read: false, update: false, delete: false };
      const allActive = current.create && current.read && current.update && current.delete;
      copy[resource] = {
        create: !allActive,
        read: !allActive,
        update: !allActive,
        delete: !allActive,
      };
      return copy;
    });
  };

  const setAllRead = () => {
    setPermissions((prev: any) => {
      const copy = { ...prev };
      for (const res of PERMISSION_RESOURCES) {
        copy[res] = {
          ...(copy[res] || { create: false, update: false, delete: false }),
          read: true,
        };
      }
      return copy;
    });
    addToast("success", "Enabled 'read' on all resources");
  };

  const selectAll = () => {
    setPermissions(createFullPermissions(true));
    addToast("success", "Granted all permissions");
  };

  const clearAll = () => {
    setPermissions(JSON.parse(JSON.stringify(NO_PERMISSIONS)));
    addToast("success", "Cleared all permissions");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullname || !formData.email || !formData.phone) {
      addToast("error", "Full name, email, and phone are required");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        permissions,
        role: "IT_STAFF",
        status: true,
      };

      const res = await createITStaff(payload);
      if (res.ok) {
        addToast("success", "IT Staff created successfully");
        router.push("/it/it-staffs");
      } else {
        addToast("error", res.message || "Failed to create IT Staff");
      }
    } catch (err: any) {
      addToast("error", err?.message || "Failed to create IT Staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6 font-['Inter',sans-serif]">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/it/it-staffs"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-['Space_Grotesk',sans-serif]">
              New IT Staff Account
            </h1>
            <p className="text-xs text-slate-500">
              Create an IT account and assign explicit resource permissions (read, create, update, delete).
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-bold uppercase tracking-wider text-slate-700">
            <User size={16} className="text-emerald-600" />
            Staff Details
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  name="fullname"
                  required
                  value={formData.fullname}
                  onChange={handleInputChange}
                  placeholder="e.g. Samuel Adekunle"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. it.samuel@amac.gov.ng"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. 08012345678"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Location / Station
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. AMAC HQ, Abuja"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Password <span className="text-xs text-slate-400 font-normal">(Optional: auto-generated if blank)</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Leave empty to auto-generate"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Configuration Card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-700">
                <Shield size={16} className="text-emerald-600" />
                Granular Permissions Matrix
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Configure resource-level actions. When <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700">read</code> is active, the corresponding page is accessible and appears in the sidebar navigation.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={setAllRead}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                <Sparkles size={12} className="text-amber-500" /> Read Only All
              </button>
              <button
                type="button"
                onClick={selectAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition"
              >
                <Check size={12} /> Select All
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 transition"
              >
                <RotateCcw size={12} /> Clear All
              </button>
            </div>
          </div>

          {/* Grid of Resource Permissions */}
          <div className="mt-6 divide-y divide-slate-100">
            {PERMISSION_RESOURCES.map((resource) => {
              const info = RESOURCE_LABELS[resource] || { label: resource, description: "" };
              const current = (permissions as any)[resource] || {
                create: false,
                read: false,
                update: false,
                delete: false,
              };

              return (
                <div
                  key={resource}
                  className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between hover:bg-slate-50/50 px-2 rounded-xl transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{info.label}</span>
                      <span className="font-['JetBrains_Mono',monospace] text-[11px] text-slate-400">
                        {resource}
                      </span>
                    </div>
                    {info.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{info.description}</p>
                    )}
                  </div>

                  {/* Actions Checkboxes */}
                  <div className="flex items-center gap-4 sm:gap-6">
                    {(["read", "create", "update", "delete"] as const).map((action) => {
                      const isChecked = Boolean(current[action]);
                      return (
                        <label
                          key={action}
                          className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(resource, action)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                          />
                          <span
                            className={
                              isChecked
                                ? action === "read"
                                  ? "text-emerald-700 font-semibold"
                                  : "text-slate-900 font-semibold"
                                : "text-slate-500"
                            }
                          >
                            {action}
                          </span>
                        </label>
                      );
                    })}

                    {/* Toggle All Resource Button */}
                    <button
                      type="button"
                      onClick={() => toggleResourceAll(resource)}
                      className="ml-2 text-[11px] font-semibold text-slate-400 hover:text-emerald-600 transition"
                      title="Toggle all actions for this resource"
                    >
                      Toggle
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/it/it-staffs"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Check size={16} />
                Create IT Staff
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
