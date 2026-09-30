"use client";

import { useState, useEffect, useCallback } from "react";
import withAuth from "@/components/withAuth";
import { useToast } from "@/context/ToastContext";
import { getMembers, getAllMembers, Member } from "@/lib/services/member";
import { getAllAdmins, Admin } from "@/lib/services/admin";
import PaymentCardItem from "@/components/PaymentCardItem";
import QRCodeModal from "@/components/QRCodeModal";
import PaymentCodePrintView from "@/components/PaymentCodePrintView";
import {
  Search,
  RefreshCw,
  Printer,
  QrCode,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

function ITPaymentCodePage() {
  const { addToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [center, setCenter] = useState("");
  const [centers, setCenters] = useState<Admin[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  // Modal & Print states
  const [selectedMemberForQr, setSelectedMemberForQr] = useState<Member | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<"cards" | "plates" | null>(null);

  // Load centers
  useEffect(() => {
    const loadCenters = async () => {
      try {
        const data = await getAllAdmins();
        const list = Array.isArray(data?.data) ? data.data : data?.admins || [];
        setCenters(list);
      } catch (e) {
        console.error("Failed to load centers:", e);
      }
    };
    loadCenters();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (center) {
        res = await getMembers(page, limit, center);
      } else {
        res = await getAllMembers(page, limit);
      }

      if (res && res.data) {
        setMembers(Array.isArray(res.data) ? res.data : []);
        setMeta(
          res.meta || {
            page,
            limit,
            total: res.data.length,
            totalPages: Math.ceil(res.data.length / limit) || 1,
          }
        );
      }
    } catch (err: any) {
      console.error(err);
      addToast("error", err?.message || "Failed to fetch taxpayers");
    } finally {
      setLoading(false);
    }
  }, [center, page, limit, addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Local search filter
  const filteredMembers = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const wallet = Array.isArray(m.wallet) ? m.wallet[0] : m.wallet;
    const acct = wallet?.accountNo || wallet?.accountNumber || "";
    return (
      (m.fullname && m.fullname.toLowerCase().includes(q)) ||
      (m.businessName && m.businessName.toLowerCase().includes(q)) ||
      (m.uid && m.uid.toLowerCase().includes(q)) ||
      (m.phone && m.phone.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      acct.toLowerCase().includes(q)
    );
  });

  const handlePrintCards = () => {
    const listToPrint = filteredMembers.length > 0 ? filteredMembers : members;
    if (listToPrint.length === 0) {
      addToast("error", "No cards available on this page to print");
      return;
    }
    setPrintMode("cards");
    const cleanup = () => {
      setPrintMode(null);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handlePrintPlates = () => {
    const listToPrint = filteredMembers.length > 0 ? filteredMembers : members;
    if (listToPrint.length === 0) {
      addToast("error", "No plates available on this page to print");
      return;
    }
    setPrintMode("plates");
    const cleanup = () => {
      setPrintMode(null);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const totalPages = meta.totalPages || 1;
  const start = meta.total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, meta.total);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-6 print:hidden">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-5 md:p-6 ring-1 ring-emerald-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                <CreditCard size={20} />
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">Payment Codes (IT)</h2>
            </div>
            <p className="text-xs md:text-sm text-slate-600">
              {meta.total} registered taxpayers • Bank transfer payment cards & direct QR checkout plates
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => fetchUsers()}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs md:text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handlePrintCards}
              disabled={loading || members.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Printer size={16} className="text-slate-600" />
              <span>Print Payment Cards</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPlates}
              disabled={loading || members.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs md:text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <QrCode size={16} />
              <span>Print Payment Plates (4 per A4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl ring-1 ring-slate-100 shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, business, account number, phone, email, or UID..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs md:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Center Selector for IT */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400" />
            <select
              value={center}
              onChange={(e) => {
                setCenter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">All Centers</option>
              {centers.map((c) => (
                <option key={c.uid || c.id} value={c.uid}>
                  {c.adminName || c.center || c.uid}
                </option>
              ))}
            </select>
          </div>

          {/* Limit selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 font-medium">Per Page:</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value={12}>12 cards</option>
              <option value={24}>24 cards</option>
              <option value={48}>48 cards</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl ring-1 ring-slate-100">
          <RefreshCw size={32} className="animate-spin text-emerald-600 mb-2" />
          <p className="text-sm font-semibold text-slate-600">Loading payment cards...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl ring-1 ring-slate-100 text-center">
          <CreditCard size={40} className="text-slate-300 mb-2" />
          <p className="text-base font-bold text-slate-700">No taxpayers found</p>
          <p className="text-xs text-slate-400 mt-1">Try another search term or refresh the page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <PaymentCardItem
              key={member.uid || member.id}
              member={member}
              onOpenQr={(m) => {
                setSelectedMemberForQr(m);
                setIsQrModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && meta.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl ring-1 ring-slate-100 shadow-xs">
          <span className="text-xs md:text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{start}</span> to{" "}
            <span className="font-semibold text-slate-900">{end}</span> of{" "}
            <span className="font-semibold text-slate-900">{meta.total}</span> taxpayers
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 text-xs font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* QR Code Plate Modal */}
      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        member={selectedMemberForQr}
      />

      {/* Hidden print layout component */}
      <PaymentCodePrintView
        members={filteredMembers.length > 0 || search.trim() ? filteredMembers : members}
        printMode={printMode}
      />
    </div>
  );
}

export default withAuth(ITPaymentCodePage);
