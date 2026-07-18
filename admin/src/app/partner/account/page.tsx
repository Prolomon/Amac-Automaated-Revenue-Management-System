"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Loader2,
    LogOut,
    Pencil,
    Save,
    X,
} from "lucide-react";
import { usePartner } from "@/context/PartnerContext";
import { Company, updateCompany } from "@/lib/services/company";
import { getPricingByCenter, Pricing } from "@/lib/services/pricing";
import { useRouter } from "next/navigation";
import withPartnerAuth from "@/components/withPartnerAuth";

type Feedback = {
    type: "success" | "error";
    message: string;
};

const normalizePricingIds = (value: unknown): string[] => {
    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    if (!Array.isArray(value)) return [];

    return Array.from(
        new Set(
            value
                .map((item) => {
                    if (typeof item === "string") return item;
                    if (!item || typeof item !== "object") return "";

                    const pricingItem = item as Record<string, unknown>;
                    return String(
                        pricingItem.id ||
                        pricingItem._id ||
                        pricingItem.uid ||
                        pricingItem.pricingId ||
                        "",
                    ).trim();
                })
                .filter(Boolean),
        ),
    );
};

const formatSubCategory = (value: Pricing["subCategory"]) => {
    if (Array.isArray(value)) return value.join(", ");
    return value || "";
};

const mapPartnerToForm = (company: any): Partial<Company> & { category: string[] } => ({
    id: company?.id ? String(company.id) : "",
    uid: company?.uid ? String(company.uid) : "",
    name: company?.name ?? "",
    email: company?.email ?? "",
    phone: company?.phone ?? "",
    location: company?.location ?? "",
    zone: company?.zone ?? "",
    category: normalizePricingIds(company?.category || []),
    status: company?.status !== false,
});

function AccountPage() {
    const router = useRouter();
    const { user, logout, refresh } = usePartner();

    const [form, setForm] = useState<(Partial<Company> & { category: string[] }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [pricingOptions, setPricingOptions] = useState<Pricing[]>([]);
    const [pricingLoading, setPricingLoading] = useState(false);

    const zoneOptions = ["A", "B", "C", "D", "E"];

    const hasProfile = useMemo(() => {
        return Boolean(form?.uid || form?.id || form?.email);
    }, [form]);

    useEffect(() => {
        setLoading(true);
        setFeedback(null);

        if (user) {
            setForm(mapPartnerToForm(user));
        } else {
            setForm(null);
        }

        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (!loading && !hasProfile) {
            router.replace("/");
        }
    }, [hasProfile, loading, router]);

    useEffect(() => {
        const fetchPricingOptions = async () => {
            const centerId = user?.center || "";
            if (!centerId) return;

            try {
                setPricingLoading(true);
                const res = await getPricingByCenter(centerId);
                setPricingOptions(Array.isArray(res?.data) ? res.data : []);
            } catch (error: any) {
                console.error("Failed to fetch pricing data", error?.message || error);
            } finally {
                setPricingLoading(false);
            }
        };

        if (user?.center) {
            fetchPricingOptions();
        }
    }, [user?.center]);

    const selectedPricingIds = normalizePricingIds(form?.category || []);
    const selectedPricingCards = pricingOptions.filter((pricing) =>
        selectedPricingIds.includes(pricing.id || ""),
    );

    const updateField = (field: string, value: string) => {
        setForm((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                [field]: value,
            };
        });
    };

    const handlePricingToggle = (pricingId: string) => {
        setForm((current) => {
            if (!current) return current;
            const selected = Array.from(new Set(current.category || []));
            const isSelected = selected.includes(pricingId);

            return {
                ...current,
                category: isSelected
                    ? selected.filter((id) => id !== pricingId)
                    : [...selected, pricingId],
            };
        });
    };

    const handleEditOrUpdate = async () => {
        if (!editing) {
            setEditing(true);
            setFeedback(null);
            return;
        }

        setSaving(true);
        setFeedback(null);

        try {
            const payload: Record<string, unknown> = {
                name: form?.name?.trim(),
                email: form?.email?.trim(),
                phone: form?.phone?.trim(),
                location: form?.location?.trim(),
                zone: form?.zone?.trim(),
                category: form?.category || [],
            };

            const data = await updateCompany(user?.uid ?? "", payload);
            if (data?.company) {
                setForm(mapPartnerToForm(data.company));
                refresh();
            }
            setFeedback({
                type: "success",
                message: "Account details updated successfully",
            });
        } catch (error) {
            setFeedback({
                type: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to update account details",
            });
        } finally {
            setSaving(false);
            setEditing(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 md:p-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-600">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading account details...
                    </div>
                </div>
            </div>
        );
    }

    if (!hasProfile) {
        return (
            <div className="p-4 md:p-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-600">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Redirecting...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Account</h1>
                        <p className="text-sm text-slate-500">
                            Manage your profile and account actions.
                        </p>
                    </div>
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${form?.status
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                    >
                        {form?.status ? "Active" : "Disabled"}
                    </span>
                </div>
            </div>

            {feedback && (
                <div
                    className={`rounded-xl border p-3 text-sm flex items-center gap-2 ${feedback.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-rose-50 border-rose-200 text-rose-700"
                        }`}
                >
                    {feedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <span>{feedback.message}</span>
                </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">
                    Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Company UID
                        </label>
                        <input
                            value={form?.uid}
                            readOnly
                            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Company Name
                        </label>
                        <input
                            value={form?.name}
                            readOnly={!editing}
                            onChange={(event) => updateField("name", event.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                : "border-slate-200 bg-slate-100 text-slate-700"
                                }`}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Email
                        </label>
                        <input
                            value={form?.email}
                            readOnly={!editing}
                            onChange={(event) => updateField("email", event.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                : "border-slate-200 bg-slate-100 text-slate-700"
                                }`}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Phone Number
                        </label>
                        <input
                            value={form?.phone}
                            readOnly={!editing}
                            onChange={(event) => updateField("phone", event.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                : "border-slate-200 bg-slate-100 text-slate-700"
                                }`}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Location
                        </label>
                        <input
                            value={form?.location}
                            readOnly={!editing}
                            onChange={(event) => updateField("location", event.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition ${editing
                                ? "border-slate-300 bg-white text-slate-800 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                                : "border-slate-200 bg-slate-100 text-slate-700"
                                }`}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">
                            Zone <span className="text-red-500">*</span>
                        </label>
                        {editing ? (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                {zoneOptions.map((zone) => {
                                    const isSelected = form?.zone === zone;

                                    return (
                                        <button
                                            key={zone}
                                            type="button"
                                            onClick={() => updateField("zone", zone)}
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
                        ) : (
                            <div className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                                {form?.zone || "—"}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pricing Plans */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            Pricing Plans
                        </h3>
                        <p className="text-sm text-slate-600">
                            {selectedPricingCards.length > 0
                                ? `${selectedPricingCards.length} selected pricing plan(s)`
                                : "No pricing plan selected yet"}
                        </p>
                    </div>
                    {editing && (
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Select one or more plans
                        </span>
                    )}
                </div>

                {pricingLoading ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        Loading pricing options...
                    </div>
                ) : selectedPricingCards.length === 0 && !editing ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        No pricing cards are assigned to your account.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {(editing ? pricingOptions : selectedPricingCards).map((pricing) => {
                            const pricingId = pricing.id as string;
                            const isSelected = form?.category?.includes(pricingId);

                            return (
                                <button
                                    key={pricingId}
                                    type="button"
                                    disabled={!editing}
                                    onClick={() => editing && handlePricingToggle(pricingId)}
                                    className={`text-left rounded-xl border p-4 transition-colors ${isSelected
                                        ? "border-emerald-400 bg-emerald-50"
                                        : "border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50"
                                        } ${editing ? "cursor-pointer" : "cursor-default"}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
                                            <CheckCircle2 size={16} className={isSelected ? "text-emerald-700" : "text-slate-400"} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className={`font-semibold ${isSelected ? "text-emerald-700" : "text-slate-900"}`}>
                                                        {pricing.title}
                                                    </p>
                                                    <p className={`mt-1 text-xs ${isSelected ? "text-emerald-700" : "text-slate-500"}`}>
                                                        Category: {pricing.category || "—"}
                                                    </p>
                                                </div>
                                                <p className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isSelected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                                    {pricing.price ? `₦${Number(pricing.price).toLocaleString()}` : "—"}
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
                                                </p>
                                            </div>
                                            {pricing.subCategory && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${isSelected ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                                        {formatSubCategory(pricing.subCategory)}
                                                    </span>
                                                </div>
                                            )}
                                            {pricing.code && (
                                                <p className={`mt-2 text-xs ${isSelected ? "text-emerald-700" : "text-slate-600"}`}>
                                                    {pricing.code}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                <div className={`grid grid-cols-1 gap-3 ${editing ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                    <button
                        type="button"
                        onClick={handleEditOrUpdate}
                        disabled={saving}
                        className={`inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:bg-emerald-300 disabled:cursor-not-allowed ${editing ? "bg-amber-500 hover:bg-amber-600 text-neutral-950" : ""}`}
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : editing ? (
                            <Save size={16} />
                        ) : (
                            <Pencil size={16} />
                        )}
                        {editing ? "Update" : "Edit"}
                    </button>

                    {editing && (
                        <button
                            type="button"
                            onClick={() => {
                                setForm(mapPartnerToForm(user));
                                setEditing(false);
                            }}
                            disabled={saving}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-neutral-950`}
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <X size={16} />
                            )}
                            Cancel
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={logout}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default withPartnerAuth(AccountPage);