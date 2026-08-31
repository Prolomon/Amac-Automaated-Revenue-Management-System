"use client";
import { useEffect, useState, use } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Building2,
  Users,
  HandCoins,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { getAdmin, Admin } from "@/lib/services/admin";
import { useToast } from "@/context/ToastContext";

export default function AdminDetailPage({ params }) {
  const parameter: any = use(params);
  const id = parameter?.id;
  const { addToast } = useToast();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getAdmin(id);
        if (mounted) setAdmin(res?.admin || null);
      } catch (e) {
        if (mounted) addToast("error", "Failed to fetch admin");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id, addToast]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="p-4 md:p-6 text-center py-16">
        <p className="text-slate-500">Admin not found</p>
        <Link
          href="/it/admins"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600"
        >
          <ArrowLeft size={16} />
          Back to Admins
        </Link>
      </div>
    );
  }

  const centerId = admin.uid || admin.center;

  const infoItems = [
    { label: "Email", value: admin.adminEmail || admin.email, icon: Mail },
    { label: "Phone", value: admin.adminPhone || admin.phone, icon: Phone },
    { label: "Address", value: admin.adminLocation || admin.address, icon: MapPin },
    { label: "State", value: admin.state, icon: MapPin },
    { label: "LGA", value: admin.lga, icon: MapPin },
    { label: "Center", value: admin.center, icon: Building2 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <Link
          href="/it/admins"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
        >
          <ArrowLeft size={16} />
          Back to Admins
        </Link>
      </div>

      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-6 ring-1 ring-emerald-100 flex flex-col md:flex-row md:items-center gap-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
          <ShieldCheck size={30} />
        </span>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {admin.adminName || "Admin"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{admin.uid}</p>
          <span
            className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              admin.status ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
            }`}
          >
            {admin.status ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`/it/entities?center=${encodeURIComponent(centerId)}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <Users size={18} />
          View Entities
        </Link>
        <Link
          href={`/it/payments?center=${encodeURIComponent(centerId)}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          <HandCoins size={18} />
          View Payments
        </Link>
        <Link
          href={`/it/demands?center=${encodeURIComponent(centerId)}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
        >
          <Building2 size={18} />
          View Demands
        </Link>
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoItems.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <item.icon size={14} className="text-emerald-600" />
                {item.label}
              </div>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {item.value || "—"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
