"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Pricing as PricingType, createPricing } from "@/lib/services/pricing";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

const categoryOptions = [
  {
    value: "TENEMENT RENT ZONE A",
    label: "Tenement Rent Zone A",
    subCategories: []
  },
  {
    value: "TENEMENT RENT ZONE B",
    label: "Tenement Rent Zone B",
    subCategories: []
  },
  {
    value: "TENEMENT RENT ZONE C",
    label: "Tenement Rent Zone C",
    subCategories: []
  },
  {
    value: "TENEMENT RENT ZONE D",
    label: "Tenement Rent Zone D",
    subCategories: []
  },
  {
    value: "SHOP AND KIOSK ZONE A & B",
    label: "Shop and Kiosk Zone A & B",
    subCategories: []
  },
  {
    value: "SHOP AND KIOSK ZONE C",
    label: "Shop and Kiosk Zone C",
    subCategories: []
  },
  {
    value: "SHOP AND KIOSK ZONE D",
    label: "Shop and Kiosk Zone D",
    subCategories: []
  },
  {
    value: "TV AND RADIO",
    label: "TV and Radio",
    subCategories: []
  },
  {
    value: "HABITATION",
    label: "Habitation",
    subCategories: []
  },
  {
    value: "BANKS",
    label: "Banks",
    subCategories: []
  },
  {
    value: "HOTELS",
    label: "Hotels",
    subCategories: []
  },
  {
    value: "FILING STATION",
    label: "Filing Station",
    subCategories: []
  },
  {
    value: "LIQUOR",
    label: "Liquor",
    subCategories: []
  },
  {
    value: "MARRIAGE REGISTRY",
    label: "Marriage Registry",
    subCategories: []
  },
  {
    value: "FOOD HANDLING",
    label: "Food Handling",
    subCategories: []
  },
  {
    value: "SIGN POST",
    label: "Sign Post",
    subCategories: []
  },
  {
    value: "MOBILE ADVERT",
    label: "Mobile Advert",
    subCategories: []
  },
  {
    value: "AMAC MARKETS",
    label: "AMAC Markets",
    subCategories: []
  },
  {
    value: "SANITARY INSPECTION",
    label: "Sanitary Inspection",
    subCategories: []
  },
  {
    value: "CORPORATE PARKING",
    label: "Corporate Parking",
    subCategories: []
  }
];

export default function Pricing() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const uid = user?.center || user?.uid;

  const [formData, setFormData] = useState<PricingType>({
    title: "",
    price: "",
    type: "BUSINESS",
    code: "",
    category: "",
    subCategory: [],
    frequency: "MONTHLY",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      ...(name === "category" ? { subCategory: [] } : {}),
      [name]: value,
    }));
  };

  const selectedCategory = categoryOptions.find(
    (option) => option.value === formData.category,
  );

  const selectedSubCategories = Array.isArray(formData.subCategory)
    ? formData.subCategory
    : formData.subCategory
      ? [formData.subCategory]
      : [];

  const handleSubCategoryToggle = (subCategory: string) => {
    setFormData((prev) => {
      const current = Array.isArray(prev.subCategory)
        ? prev.subCategory
        : prev.subCategory
          ? [prev.subCategory]
          : [];

      return {
        ...prev,
        subCategory: current.includes(subCategory)
          ? current.filter((item) => item !== subCategory)
          : [...current, subCategory],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (
      !formData.title ||
      !formData.code ||
      !formData.category ||
      !formData.price ||
      !formData.type
    ) {
      addToast("error", "Please fill in all required fields");
      return;
    }
    e.preventDefault();
    setLoading(true);

    try {
      await createPricing(formData, uid ?? "");

      setFormData({
        title: "",
        price: "",
        type: "BUSINESS",
        code: "",
        category: "",
        subCategory: [],
        frequency: "MONTHLY",
      });

      addToast("success", "Pricing tier created successfully");

      router.push("/admin/tiers");
    } catch (err) {
      addToast("error", err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:space-y-5 md:p-6">
      <div className="w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100">
        {/* pricing Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">
            Create New Pricing Tier
          </h2>
        </div>

        {/* pricing Content */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Tier Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tier Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Small Business"
              required
              className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Monthly Price (₦) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="e.g., 8000"
              required
              className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Select category</option>
              {categoryOptions.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sub Category */}
          {selectedCategory && selectedCategory.subCategories.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Sub Category *
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {selectedCategory.subCategories.map((subCategory) => {
                  const isSelected = selectedSubCategories.includes(subCategory);

                  return (
                    <label
                      key={subCategory}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${isSelected
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50"
                        }`}
                    >
                      <span className="font-medium">{subCategory}</span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSubCategoryToggle(subCategory)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Frequency */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Frequency *
            </label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              required
              className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="" hidden>Select frequency</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="BI-WEEKLY">Bi-Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">YEARLY</option>

            </select>
          </div>

          {/* Codes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Code
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder="e.g., etyuuw"
              required
              className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Modal Actions */}
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
              {loading ? "Saving..." : "Create Tier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
