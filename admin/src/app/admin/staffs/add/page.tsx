"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createStaff, Staff } from "@/lib/services/staff";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function AddStaffPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const { addToast } = useToast();

  const [formData, setFormData] = useState<Omit<Staff, "id" | "uid" | "role">>({
    fullname: "",
    email: "",
    phone: "",
    gender: "",
    location: "",
    permission: {
      canViewWallet: false,
      canCreateEntity: false,
      canViewEntity: false,
      canEditEntity: false,
      canDeleteEntity: false,
      canCreatePartner: false,
      canViewPartner: false,
      canEditPartner: false,
      canDeletePartner: false,
      canCreatePricing: false,
      canViewPricing: false,
      canEditPricing: false,
      canDeletePricing: false,
      canViewSplit: false,
      canSearch: false,
      canViewAssurance: false,
      canSupport: false,
    }
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.fullname || !formData.email || !formData.phone || !formData.gender || !formData.location) {
        setLoading(false);
        addToast("error", "Please fill in all required fields");
        return;
      }

      const payload = {
        ...formData,
        center: user?.uid,
        // avatar: avatarFile,
      };

      await createStaff(payload);

      addToast("success", "Staff created successfully");
      setTimeout(() => router.push("/admin/staffs"), 1500);
    } catch (err: any) {
      addToast("error", err.message || "Failed to create staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto space-y-4 p-4 md:space-y-5 md:p-6">
      <div className="w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-900">Add New Staff</h2>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="fullname"
              value={formData.fullname}
              onChange={handleInputChange}
              placeholder="e.g., John Doe"
              className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="e.g., john@example.com"
              className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="e.g., +234 800 000 0000"
              className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., Lagos, Nigeria"
              className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Avatar
            </label>
            <input
              type="file"
              name="avatar"
              accept="image/*"
              onChange={handleAvatarChange}
              className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            {avatarFile && (
              <p className="mt-2 text-xs text-slate-500">
                Selected: {avatarFile.name}
              </p>
            )}
          </div>

          {/* Permissions Section */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Staff Permissions
            </label>
            <div className="space-y-4">

              {/* Entity Management */}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Entity Management</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "canCreateEntity", label: "Create" },
                    { key: "canViewEntity", label: "View" },
                    { key: "canEditEntity", label: "Edit" },
                    { key: "canDeleteEntity", label: "Delete" },
                  ].map((perm) => (
                    <button
                      key={perm.key}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          permission: {
                            ...prev.permission,
                            [perm.key]: !prev.permission[perm.key as keyof typeof prev.permission],
                          },
                        }))
                      }
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                        formData.permission[perm.key as keyof typeof formData.permission]
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                      }`}
                    >
                      {perm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partner Management */}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Partner Management</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "canCreatePartner", label: "Create" },
                    { key: "canViewPartner", label: "View" },
                    { key: "canEditPartner", label: "Edit" },
                    { key: "canDeletePartner", label: "Delete" },
                  ].map((perm) => (
                    <button
                      key={perm.key}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          permission: {
                            ...prev.permission,
                            [perm.key]: !prev.permission[perm.key as keyof typeof prev.permission],
                          },
                        }))
                      }
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                        formData.permission[perm.key as keyof typeof formData.permission]
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                      }`}
                    >
                      {perm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing Management */}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Pricing Management</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "canCreatePricing", label: "Create" },
                    { key: "canViewPricing", label: "View" },
                    { key: "canEditPricing", label: "Edit" },
                    { key: "canDeletePricing", label: "Delete" },
                  ].map((perm) => (
                    <button
                      key={perm.key}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          permission: {
                            ...prev.permission,
                            [perm.key]: !prev.permission[perm.key as keyof typeof prev.permission],
                          },
                        }))
                      }
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                        formData.permission[perm.key as keyof typeof formData.permission]
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                      }`}
                    >
                      {perm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Other Permissions */}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Other</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "canViewWallet", label: "View Wallet" },
                    { key: "canViewSplit", label: "View Split" },
                    { key: "canSearch", label: "Search" },
                    { key: "canViewAssurance", label: "View Assurance" },
                    { key: "canSupport", label: "Provide Support" },
                  ].map((perm) => (
                    <button
                      key={perm.key}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          permission: {
                            ...prev.permission,
                            [perm.key]: !prev.permission[perm.key as keyof typeof prev.permission],
                          },
                        }))
                      }
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                        formData.permission[perm.key as keyof typeof formData.permission]
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                      }`}
                    >
                      {perm.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-400"
            >
              {loading ? "Creating..." : "Create Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
