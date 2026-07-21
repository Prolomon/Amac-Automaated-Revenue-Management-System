"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    MapPin,
    User,
    Zap,
    Save,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Member, createMember } from "@/lib/services/member";
import { getCompanies, Company } from "@/lib/services/company";
import { getPricingByCenter, Pricing } from "@/lib/services/pricing";
import { getLocation } from "@/lib/services/location";
import statesData from "@/lib/jsons/state_and_lgas.json";
import { useToast } from "@/context/ToastContext";

export default function AddEntityPage() {
    const router = useRouter();
    const { user, role } = useAuth();
    const centerId = role === "ADMIN" ? user?.uid : user?.center;
    const adminState = user?.state || "";
    const adminLga = user?.lga || "";
    const [metaData, setMetaData] = useState<{ page: number; limit: number }>({ page: 1, limit: 100 });

    if (role !== "ADMIN" && user?.permission?.canCreateEntity !== true) {
        router.push("/admin/entities");
    }

    const [formData, setFormData] = useState({
        fullname: "",
        email: "",
        pricing: [],
        businessName: "",
        location: null as any,
        phone: "",
        center: "",
        type: "INDIVIDUAL" as "BUSINESS" | "INDIVIDUAL",
        category: "",
        zone: "",
    });

    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [pricingOptions, setPricingOptions] = useState<Pricing[]>([]);
    const [locationSuggestions, setLocationSuggestions] = useState<
        Array<{ id: string | number; name: string; display_name?: string }>
    >([]);

    const [selectedLocation, setSelectedLocation] = useState<{
        state: string;
        city: string;
        address: string;
        zipcode: string;
        nearestBusStop: string;
    } | null>(null);
    const [locationInput, setLocationInput] = useState("");
    const [locationStateValue, setLocationStateValue] = useState(adminState || "");
    const [locationLgaValue, setLocationLgaValue] = useState(adminLga || "");
    const [availableLgas, setAvailableLgas] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [companyLoading, setCompanyLoading] = useState(false);
    const [priceLoading, setPriceLoading] = useState(false);
    const { addToast } = useToast();

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

    const zoneOptions = ["A", "B", "C", "D", "E"];

    // Load companies and pricing options
    const fetchPricing = useCallback(async () => {
        setPriceLoading(true);
        try {
            const pricingRes = await getPricingByCenter(centerId)

            const pricingList = Array.isArray(pricingRes?.data) ? pricingRes.data : [];

            setPricingOptions(pricingList);
        } catch (e) {
            addToast("error", e.message || e.error || "Failed to pricing options");
        } finally {
            setPriceLoading(false);
        }
    }, [addToast, centerId]);

    useEffect(() => {
        fetchPricing()
    }, [fetchPricing])

    const fetchCompany = useCallback(async () => {
        setCompanyLoading(true)

        try {
            const companiesRes = await getCompanies(centerId, metaData.page, metaData.limit)

            const companyList = Array.isArray(companiesRes?.data) ? companiesRes.data : [];

            // Get pricing options that match the selected category
            const normalizedCategory = (formData.category.toUpperCase() || "");

            const matchingPricing = pricingOptions.filter((p) => {
                const cats = Array.isArray(p.category) ? p.category : [p.category || ""];
                return cats.some((cat) => String(cat || "").toUpperCase() === normalizedCategory);
            });

            // Filter companies whose category matches any of the pricing-derived categories
            setCompanies(
                companyList.filter((c) => {
                    const cats = Array.isArray(c.category) ? c.category : [c.category || ""];
                    return cats.some((cat) => matchingPricing.map((p) => p.id).includes(String(cat || "")));
                })
            );
            setSelectedCompany(null);
        } catch (e) {
            addToast("error", e.message || "Failed to get partners information")
        } finally {
            setCompanyLoading(false)
        }

    }, [addToast, centerId, formData.category, metaData.limit, metaData.page, pricingOptions])

    useEffect(() => {
        fetchCompany()
    }, [fetchCompany])

    const handleInputChange = (
        field: keyof Omit<Member, "location">,
        value: string
    ) => {
        setFormData((prev) => {
            const updated = {
                ...prev,
                [field]: value,
            };
            // If type is changed to INDIVIDUAL, set businessName to fullname
            if (field === "type" && value === "INDIVIDUAL") {
                updated.businessName = prev.fullname || "";
            }
            // If type is changed to BUSINESS, clear businessName
            if (field === "type" && value === "BUSINESS") {
                updated.businessName = "";
            }
            // If fullname changes and type is INDIVIDUAL, update businessName too
            if (field === "fullname" && prev.type === "INDIVIDUAL") {
                updated.businessName = value;
            }
            return updated;
        });
    };

    const handleLocationSearch = async (query: string) => {
        setLocationInput(query);
        if (!query?.trim()) {
            setLocationSuggestions([]);
            setSelectedLocation(null);
            return;
        }

        try {
            const res = await getLocation({ query, limit: 30 });
            setLocationSuggestions(Array.isArray(res) ? res : []);
        } catch (e) {
            addToast("error", e.message || "Failed to fetch location suggestions");
            setLocationSuggestions([]);
        }
    };

    const handleLocationSelect = (location: any) => {
        const address = location?.display_name || location?.name || "";
        setLocationInput(address);
        const nextLocation = {
            state: locationStateValue || adminState,
            city: locationLgaValue || adminLga,
            address,
            zipcode: location?.postcode || "0",
            nearestBusStop: location?.name || "",
        };

        setSelectedLocation(nextLocation);
        setFormData((prev) => ({
            ...prev,
            location: nextLocation,
        }));
        setLocationSuggestions([]);
    };

    const handleLocationFieldChange = (key: "state" | "lga" | "address", value: string) => {
        if (key === "state") setLocationStateValue(value);
        if (key === "lga") setLocationLgaValue(value);
        if (key === "address") setLocationInput(value);
        setSelectedLocation(null);
    };

    // When state changes, update available LGAs
    useEffect(() => {
        if (locationStateValue) {
            const lgas = (statesData as Record<string, string[]>)[locationStateValue] || [];
            setAvailableLgas(lgas);
            // If current LGA is not in the list, pick the first one or clear
            if (!lgas.includes(locationLgaValue)) {
                setLocationLgaValue(lgas[0] || "");
            }
        } else {
            setAvailableLgas([]);
            setLocationLgaValue("");
        }
    }, [locationStateValue, locationLgaValue]);

    const handlePricingToggle = (pricingId: string) => {
        setFormData((prev) => {
            const currentPricing = Array.from(new Set(prev.pricing || []));
            const isSelected = currentPricing.includes(pricingId);
            return {
                ...prev,
                pricing: isSelected
                    ? currentPricing.filter((id) => id !== pricingId)
                    : [...currentPricing, pricingId],
            };
        });
    };

    const validateForm = (): boolean => {
        if (!formData.fullname?.trim()) {
            addToast("error", "Full name is required");
            return false;
        }
        if (!formData.email?.trim()) {
            addToast("error", "Email is required");
            return false;
        }
        if (!formData.phone?.trim()) {
            addToast("error", "Phone is required");
            return false;
        }
        if (!formData.businessName?.trim()) {
            addToast("error", "Business name is required");
            return false;
        }
        if (!formData.type) {
            addToast("error", "Entity type is required");
            return false;
        }
        if (!formData.category) {
            addToast("error", "Category is required");
            return false;
        }
        if (!selectedCompany?.uid) {
            addToast("error", "Please select a company");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        try {
            const finalLocation = selectedLocation || {
                state: locationStateValue || adminState,
                city: locationLgaValue || adminLga,
                address: locationInput || "",
                zipcode: "0",
                nearestBusStop: "",
            };

            const payload = {
                ...formData,
                pricing: Array.from(new Set(formData.pricing || [])),
                center: centerId,
                location: finalLocation,
                company: selectedCompany?.uid || "",
            };

            const res = await createMember(payload as Member);

            if (!res?.ok) {
                throw new Error(res?.message || "Failed to create entity");
            }

            addToast("success", "Entity created successfully");
            router.push("/admin/entities")
        } catch (e) {
            addToast("error", "Failed to create entity. Please try again.");
        } finally {
            setSaving(false);
            setLoading(false);
        }
    };

    const formatSubCategory = (value: Pricing["subCategory"]) => {
        if (Array.isArray(value)) return value.join(", ");
        return value || "";
    };

    const getFilteredPricing = () => {
        const normalizedCategory = (formData.category || "").toLowerCase();
        const filteredPricing = pricingOptions.filter(p => p?.type?.toUpperCase() === formData.type?.toUpperCase()).filter((p) => {
            const cats = Array.isArray(p.category) ? p.category : [p.category || ""];
            return cats.some((cat) => String(cat || "").toLowerCase() === normalizedCategory);
        });
        const uniquePricing = new Map(
            filteredPricing
                .filter((pricing) => pricing?.id)
                .map((pricing) => [pricing.id as string, pricing]),
        );

        return Array.from(uniquePricing.values());
    };

    if (loading) {
        return (
            <div className="col-span-full py-16 text-center">
                <div className="flex flex-col items-center justify-center">
                    <div className="mb-4 animate-spin">
                        <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-emerald-600" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 relative">
            {/* Header */}
            <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                    >
                        <ArrowLeft size={16} />
                        Back to Entities
                    </button>
                </div>
                <h1 className="mt-3 text-2xl md:text-3xl font-bold text-slate-900">
                    Add New Entity
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                    Create and register a new member entity in the system
                </p>
            </div>

            {/* Form Card */}
            <div className="rounded-2xl bg-white p-6 md:p-8 ring-1 ring-slate-100 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Entity Classification */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Entity Classification
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Entity Type */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Entity Type *
                                </label>
                                <select
                                    value={formData.type || ""}
                                    onChange={(e) =>
                                        handleInputChange("type", e.target.value)
                                    }
                                    className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                >
                                    <option hidden>Select entity type</option>
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
                                    value={formData.category || ""}
                                    onChange={(e) =>
                                        handleInputChange("category", e.target.value)
                                    }
                                    className="w-full appearance-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                >
                                    <option hidden>Select a category</option>
                                    {categoryOptions.map((category) => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <hr className="border-b border-slate-200" />

                    {/* Section 2: Basic Information */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Basic Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        placeholder="e.g., John Doe"
                                        value={formData.fullname || ""}
                                        onChange={(e) =>
                                            handleInputChange("fullname", e.target.value)
                                        }
                                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email *
                                </label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        placeholder="e.g., john@example.com"
                                        value={formData.email || ""}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Phone *
                                </label>
                                <div className="relative">
                                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="tel"
                                        placeholder="e.g., 08012345678"
                                        value={formData.phone || ""}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                    />
                                </div>
                            </div>

                            {/* Business Name - Only show for BUSINESS type */}
                            {formData.type === "BUSINESS" && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Business Name *
                                    </label>
                                    <div className="relative">
                                        <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            placeholder="e.g., Acme Corp"
                                            value={formData.businessName || ""}
                                            onChange={(e) =>
                                                handleInputChange("businessName", e.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="border-b border-slate-200" />

                    {/* Section 3: Partner Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Partner Selection
                                </h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Select the partner this member belongs to.
                                </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {selectedCompany?.uid ? `Selected: ${selectedCompany.name}` : "Select one partner"}
                            </span>
                        </div>

                        {companyLoading ? (
                            <div className="col-span-full py-16 text-center">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="mb-4 animate-spin">
                                        <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-emerald-600" />
                                    </div>
                                </div>
                            </div>
                        ) : companies.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {companies.map((company) => {
                                    const isSelected = selectedCompany?.uid === company.uid;

                                    return (
                                        <button
                                            key={company.uid || company.id}
                                            type="button"
                                            onClick={() => setSelectedCompany(company)}
                                            className={`rounded-2xl border p-4 text-left transition-all ${isSelected
                                                ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                                                : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50"
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                                                    }`}>
                                                    <Building2 size={18} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="truncate text-sm font-semibold text-slate-900">
                                                            {company.name || "Untitled Company"}
                                                        </p>
                                                        {isSelected && (
                                                            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                                                                Selected
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {company.uid || company.id}
                                                    </p>
                                                    <p className="mt-2 text-xs text-slate-600">
                                                        {company.email || "No email available"}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-600">
                                                        {company.phone || "No phone available"}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                                No partner found for this center.
                            </div>
                        )}
                    </div>

                    <hr className="border-b border-slate-200" />

                    {/* Section 4: Location */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Location
                                </h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Select a location for this member.
                                </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                Select location
                            </span>
                        </div>

                        <div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">State</label>
                                    <select
                                        value={locationStateValue}
                                        onChange={(e) => handleLocationFieldChange("state", e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
                                    >
                                        <option value="" hidden>Select state</option>
                                        {Object.keys(statesData).map((st) => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">LGA</label>
                                    <select
                                        value={locationLgaValue}
                                        onChange={(e) => handleLocationFieldChange("lga", e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 appearance-none"
                                    >
                                        <option value="" hidden>Select LGA</option>
                                        {availableLgas.map((lga) => (
                                            <option key={lga} value={lga}>{lga}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Address</label>
                                    <div className="relative">
                                        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="e.g., Wuse, Lagos, Abuja"
                                            value={locationInput}
                                            onChange={(e) => handleLocationSearch(e.target.value)}
                                            className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                        />
                                    </div>
                                </div>
                                {/* Zones */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Zone</label>
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
                            </div>

                            {/* Location Suggestions */}
                            {locationSuggestions.length > 0 && (
                                <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-emerald-300 bg-white p-2">
                                    {locationSuggestions.map((suggestion) => (
                                        <button
                                            key={suggestion.id || suggestion.name + suggestion.display_name}
                                            type="button"
                                            onClick={() => handleLocationSelect(suggestion)}
                                            className="w-full text-left cursor-pointer rounded-lg px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-emerald-500 hover:text-white"
                                        >
                                            {suggestion.display_name || suggestion.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Selected Location */}
                            {selectedLocation && (
                                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="font-semibold text-slate-700">State</p>
                                            <p className="text-emerald-700">{selectedLocation.state}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-700">LGA</p>
                                            <p className="text-emerald-700">{selectedLocation.city}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="font-semibold text-slate-700">Address</p>
                                            <p className="text-emerald-700">{selectedLocation.address}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-700">Zip Code</p>
                                            <p className="text-emerald-700">{selectedLocation.zipcode}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-700">Nearest Bus Stop</p>
                                            <p className="text-emerald-700">{selectedLocation.nearestBusStop}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="border-b border-slate-200" />

                    {/* Section 5: Pricing Plans */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Pricing Plan Selection
                                </h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Select a pricing plan for this member.
                                </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                Select one pricing plan
                            </span>
                        </div>
                        {priceLoading ? (
                            <div className="col-span-full py-16 text-center">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="mb-4 animate-spin">
                                        <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-emerald-600" />
                                    </div>
                                </div>
                            </div>
                        ) : getFilteredPricing().length > 0 ? (
                            <div className="space-y-4 pb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {getFilteredPricing().map((pricing) => {
                                        const isSelected = (formData.pricing || []).includes(pricing.id as string);
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
                                                        handlePricingToggle(pricing.id as string)
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
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-sm text-slate-500">No pricing plans available for this center.</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6">
                        <Link
                            href="/admin/entities"
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
                            {saving ? "Creating..." : "Create Entity"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
