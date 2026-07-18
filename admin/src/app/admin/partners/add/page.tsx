"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { createCompany, Company } from "@/lib/services/company";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap } from "lucide-react";
import { getBanks } from "@/lib/services/wallet";
import { useWallet } from "@/context/WalletContext";
import { getPricingByCenter, Pricing } from "@/lib/services/pricing";
import { useToast } from "@/context/ToastContext";

export default function AddPartnerPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const [pricingOptions, setPricingOptions] = useState<Pricing[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bank, setBank] = useState<{ bankName: string; accountNumber: string; bankCode: string; accountName: string }>({
    bankName: "",
    accountNumber: "",
    bankCode: "",
    accountName: "",
  })
  const { resolveBankAccount } = useWallet();
  const centerId = role === "ADMIN" ? user?.uid : user?.center;

  if (user?.permission?.canAddPartner === false) {
    router.push("/admin");
  }

  const [bankList, setBankList] = useState<{ code: string, logo: string, name: string, nipCode: null }[]>([]);

  const fetchPricingOptions = useCallback(async () => {
    if (!centerId) return;

    const res = await getPricingByCenter(centerId);
    if (res.ok && res.data) {
      setPricingOptions(res.data);
    } else {
      addToast("error", res.message || "Failed to fetch pricing options");
    }
  }, [centerId, addToast]);

  useEffect(() => {
    fetchPricingOptions();
  }, [fetchPricingOptions]);

  const fetchBanks = useCallback(async () => {
    try {
      const data = await getBanks();

      if (data.ok && data.banks) {
        setBankList(data.banks?.data);
      }

    } catch (e) {
      addToast("error", e?.error || e?.message || "Failed to fetch banks");
    }
  }, [addToast]);

  useEffect(() => {
    fetchBanks();
  }, [fetchBanks]);

  const fetchBankAccountName = useCallback(async (accountNumber: string, bankCode: string) => {
    try {
      const resolve = await resolveBankAccount(accountNumber, bankCode);

      if (resolve?.ok === false) {
        addToast("error", resolve?.message || "Failed to resolve bank account");
        return;
      }

      // Handle both response formats: { data: { accountName } } and direct { accountName }
      const accountName = resolve?.data?.accountName || resolve?.accountName || "";
      if (accountName) {
        setBank(prev => ({ ...prev, accountName: accountName }));
      } else {
        addToast("error", "Account name not found. Please verify the account details.");
      }
    } catch (err) {
      addToast("error", "Account name not found. Please verify the account details.");
    }

  }, [addToast, resolveBankAccount]);

  //Automatically get account name
  useEffect(() => {
    if (bank.accountNumber.length > 10 || bank.accountNumber.length < 10 && !bank.bankCode) {
      return;
    }

    fetchBankAccountName(bank.accountNumber, bank.bankCode);

  }, [fetchBankAccountName, bank.accountNumber, bank.bankCode]);

  const [formData, setFormData] = useState<Omit<Company, "id" | "uid" | "role">>({
    name: "",
    email: "",
    phone: "",
    location: "",
    category: [],
    zone: "",
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

  const handlePricingToggle = (pricingId: string) => {
    setFormData((prev) => {
      const selectedCategories = Array.from(new Set(prev.category || []));
      const isSelected = selectedCategories.includes(pricingId);

      return {
        ...prev,
        category: isSelected
          ? selectedCategories.filter((id) => id !== pricingId)
          : [...selectedCategories, pricingId],
      };
    });
  };

  const formatSubCategory = (value: Pricing["subCategory"]) => {
    if (Array.isArray(value)) return value.join(", ");
    return value || "";
  };

  const zoneOptions = ["A", "B", "C", "D", "E"];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name || !formData.email || !formData.phone || formData.category.length === 0 || !formData.zone || !bank.accountNumber || !bank.bankCode) {
        addToast("error", "Please fill in all required fields");
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        center: centerId || "",
      };

      await createCompany(payload, bank);

      addToast("success", "Partner created successfully");
      setTimeout(() => router.push("/admin/partners"), 1500);
    } catch (err: any) {
      addToast("error", "An error occured. Please contact support");
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
            <h2 className="text-xl font-bold text-slate-900">Add New Partner</h2>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Partner Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Partner Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Acme Corporation"
                required
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
                placeholder="e.g., info@acme.com"
                required
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
                required
                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
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
                Partner Logo/Avatar
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              <p className="mt-2 text-xs text-slate-500">
                {avatarFile ? `Selected: ${avatarFile.name}` : "No file selected"}
              </p>
            </div>

            {/* account number */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                value={bank.accountNumber}
                onChange={(e) => setBank(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="e.g., 1234567890"
                required
                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* bank name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Bank Name
              </label>
              <select
                name="bankCode"
                value={bank.bankCode}
                onChange={(e) => {
                  const selectedCode = e.target.value;
                  const selectedBank = bankList.find((b) => b.code === selectedCode);
                  setBank(prev => ({
                    ...prev,
                    bankCode: selectedCode,
                    bankName: selectedBank?.name || ""
                  }));
                }}
                required
                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Select bank</option>
                {bankList.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            {/* account name (auto-filled after verification) */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Account Name</label>
              <input
                type="text"
                name="name"
                value={bank.accountName}
                readOnly
                placeholder="Will auto-fill after account verification"
                className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              {bank.accountName && (
                <p className="mt-1 text-xs text-emerald-700">Recipient verified and ready for transfer.</p>
              )}
            </div>
          </div>

          {/* Zones */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Zone
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {zoneOptions.map((zone) => {
                const isSelected = formData.zone === zone;

                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, zone }))}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${isSelected
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50"
                      }`}
                  >
                    Zone {zone}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing Plans */}
          {pricingOptions.length > 0 && (
            <div className="space-y-4 pb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                Pricing Plans
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pricingOptions.map((pricing) => {
                  const pricingId = pricing.id as string;
                  const isSelected = formData.category.includes(pricingId);
                  return (
                    <label
                      key={pricing.id}
                      className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${isSelected
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          handlePricingToggle(pricingId)
                        }
                        className="hidden"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Zap size={16} className={isSelected ? "text-emerald-700" : "text-amber-500"} />
                          <p className={`font-semibold ${isSelected ? "text-emerald-700" : "text-slate-900"}`}>
                            {pricing.title}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${isSelected
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                            }`}>
                            {pricing.category || "No category"}
                          </span>
                          {pricing.subCategory && (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${isSelected
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                              }`}>
                              {formatSubCategory(pricing.subCategory)}
                            </span>
                          )}
                        </div>
                        <p className={`mt-1 text-xs font-bold ${isSelected ? "text-emerald-700" : "text-slate-600"}`}>
                          ₦{Number(pricing.price)?.toLocaleString()}
                          <span className="font-medium text-slate-500">
                            {
                              (() => {
                                const f = String(pricing.frequency || "").toUpperCase();
                                const map: Record<string, string> = {
                                  DAILY: "/day",
                                  WEEKLY: "/week",
                                  MONTHLY: "/month",
                                  YEARLY: "/year",
                                  QUARTERLY: "/quarter",
                                  BIWEEKLY: "/2-weeks"
                                };
                                return map[f] || (pricing.frequency ? pricing.frequency : "/month");
                              })()
                            }
                          </span>
                        </p>
                        {pricing.code && (
                          <p className={`mt-1 text-xs ${isSelected ? "text-emerald-700" : "text-slate-600"}`}>
                            {pricing.code}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="border-t border-slate-200 pt-5 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Partner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
