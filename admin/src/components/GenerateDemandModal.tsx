"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, FilePlus, Loader2, Check, AlertCircle, Plus, Trash2 } from "lucide-react";
import { getAllPayments, Payment } from "@/lib/services/payments";
import { createDemandNotice } from "@/lib/services/demand";
import { useToast } from "@/context/ToastContext";

interface GenerateDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ManualItem {
  user: string;
  paymentId: string;
}

export default function GenerateDemandModal({
  isOpen,
  onClose,
  onSuccess,
}: GenerateDemandModalProps) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<"list" | "manual">("list");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  
  // Selected from payments list: Set of payment IDs
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());

  // Manual items list
  const [manualUser, setManualUser] = useState("");
  const [manualPaymentId, setManualPaymentId] = useState("");
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);

  const fetchPendingPayments = useCallback(async (searchQuery = "") => {
    setLoadingPayments(true);
    try {
      // Fetch payments
      const res = await getAllPayments(1, 50, searchQuery || undefined);
      if (res.ok && res.payments) {
        // Filter out completed/paid payments if any returned
        const pendingOnly = res.payments.filter((p) => {
          const st = String(p.status).toUpperCase();
          return st !== "PAID" && st !== "COMPLETED" && st !== "SUCCESS";
        });
        setPayments(pendingOnly.length > 0 ? pendingOnly : res.payments);
      }
    } catch (err: any) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPendingPayments(search);
      setSelectedPaymentIds(new Set());
      setManualItems([]);
      setManualUser("");
      setManualPaymentId("");
      setActiveTab("list");
    }
  }, [isOpen, fetchPendingPayments]);

  if (!isOpen) return null;

  const handleTogglePayment = (payment: Payment) => {
    if (!payment.id) return;
    const next = new Set(selectedPaymentIds);
    if (next.has(payment.id)) {
      next.delete(payment.id);
    } else {
      next.add(payment.id);
    }
    setSelectedPaymentIds(next);
  };

  const handleSelectAll = () => {
    if (selectedPaymentIds.size === payments.length) {
      setSelectedPaymentIds(new Set());
    } else {
      const allIds = new Set(payments.map((p) => p.id).filter(Boolean) as string[]);
      setSelectedPaymentIds(allIds);
    }
  };

  const handleAddManualItem = () => {
    if (!manualUser.trim() || !manualPaymentId.trim()) {
      addToast("error", "Both User ID and Payment ID are required");
      return;
    }
    setManualItems((prev) => [
      ...prev,
      { user: manualUser.trim(), paymentId: manualPaymentId.trim() },
    ]);
    setManualUser("");
    setManualPaymentId("");
  };

  const handleRemoveManualItem = (index: number) => {
    setManualItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPendingPayments(search);
  };

  const handleGenerate = async () => {
    let itemsToSubmit: Array<{ user: string; paymentId: string }> = [];

    if (activeTab === "list") {
      const selectedPayments = payments.filter((p) => p.id && selectedPaymentIds.has(p.id));
      if (selectedPayments.length === 0) {
        addToast("error", "Please select at least one payment to generate demand notice");
        return;
      }
      itemsToSubmit = selectedPayments.map((p) => ({
        user: p.userId,
        paymentId: p.id!,
      }));
    } else {
      if (manualItems.length === 0) {
        if (manualUser.trim() && manualPaymentId.trim()) {
          itemsToSubmit = [{ user: manualUser.trim(), paymentId: manualPaymentId.trim() }];
        } else {
          addToast("error", "Please add at least one { user, paymentId } entry");
          return;
        }
      } else {
        itemsToSubmit = [...manualItems];
        if (manualUser.trim() && manualPaymentId.trim()) {
          itemsToSubmit.push({ user: manualUser.trim(), paymentId: manualPaymentId.trim() });
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await createDemandNotice(itemsToSubmit);
      if (res.ok) {
        addToast(
          "success",
          res.message || `Successfully generated demand notices and sent emails!`
        );
        onSuccess();
        onClose();
      } else {
        addToast("error", res.message || "Failed to generate demand notices");
      }
    } catch (err: any) {
      console.error(err);
      addToast("error", err?.message || "Failed to generate demand notices");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const selectedCount =
    activeTab === "list"
      ? selectedPaymentIds.size
      : manualItems.length + (manualUser.trim() && manualPaymentId.trim() ? 1 : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-gradient-to-r from-emerald-50 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-xs">
              <FilePlus size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Generate Demand Notice</h3>
              <p className="text-xs text-slate-500">
                Create demand notice records and dispatch PDF notifications to taxpayers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 px-6 pt-3 bg-slate-50/50 gap-4">
          <button
            onClick={() => setActiveTab("list")}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "list"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Select from Payments ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === "manual"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Manual Entry {manualItems.length > 0 && `(${manualItems.length})`}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === "list" ? (
            <>
              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by payment reference or keyword..."
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs md:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </form>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={payments.length === 0}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {selectedPaymentIds.size === payments.length && payments.length > 0
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
              </div>

              {/* Payments Table / List */}
              {loadingPayments ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Loader2 size={32} className="animate-spin text-emerald-600 mb-2" />
                  <p className="text-sm">Loading pending payments...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <AlertCircle size={36} className="mb-2 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">No pending payments found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try another search term or use manual entry
                  </p>
                </div>
              ) : (
                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {payments.map((p) => {
                    const isSelected = p.id ? selectedPaymentIds.has(p.id) : false;
                    const memberName =
                      p.member?.businessName || p.member?.fullname || p.userId;
                    const remaining = Math.max(
                      0,
                      Number(p.debt || p.amount || 0) - Number(p.paid || 0)
                    ) || Number(p.amount || 0);

                    return (
                      <div
                        key={p.id || p.reference}
                        onClick={() => handleTogglePayment(p)}
                        className={`flex items-center justify-between p-3.5 transition-colors cursor-pointer ${
                          isSelected ? "bg-emerald-50/60" : "hover:bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                              isSelected
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check size={14} className="stroke-[3]" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 text-sm">
                                {memberName}
                              </span>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                                {p.reference}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {p.pricing?.title || p.pricing?.category || "Standard Assessment"} •{" "}
                              <span className="text-slate-400">UID: {p.userId}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900">
                            {formatCurrency(remaining)}
                          </div>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mt-0.5 ${
                              p.status === "PENDING"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Manual Entry Tab */
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="text-xs text-emerald-800">
                  Manually provide taxpayer User ID (Member UID) and Payment ID pairs. Demand notices
                  will be created and emailed to each respective taxpayer.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Taxpayer User ID (Member UID)
                  </label>
                  <input
                    type="text"
                    value={manualUser}
                    onChange={(e) => setManualUser(e.target.value)}
                    placeholder="e.g. MEM-12345 or uid"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Payment ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualPaymentId}
                      onChange={(e) => setManualPaymentId(e.target.value)}
                      placeholder="e.g. payment cuid/id"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualItem}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus size={16} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>

              {manualItems.length > 0 && (
                <div className="mt-4 border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 flex justify-between">
                    <span>Items to generate ({manualItems.length})</span>
                  </div>
                  {manualItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 flex items-center justify-between text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">User:</span> {item.user}{" "}
                        <span className="text-slate-300 mx-2">|</span>
                        <span className="font-semibold text-slate-900">Payment:</span>{" "}
                        {item.paymentId}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveManualItem(idx)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="text-xs text-slate-500">
            Selected: <span className="font-bold text-slate-800">{selectedCount}</span> notice(s)
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={submitting || selectedCount === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FilePlus size={16} />
                  <span>Generate & Send ({selectedCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
