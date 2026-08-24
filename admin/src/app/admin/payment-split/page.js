"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Info,
  PieChart as PieChartIcon,
  Save,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { getTransactions } from "@/lib/services/payments";
import { getMembers } from "@/lib/services/member";
import { useToast } from "@/context/ToastContext";
import { updatePaymentConfig } from "@/lib/api";

// Returns YYYY-MM-DD using the browser's LOCAL date, not UTC.
// toISOString() converts to UTC first, which rolls back to "yesterday"
// for WAT (UTC+1) users between 00:00–00:59 local time.
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PaymentSplit() {
  const { user, uid, role } = useAuth();
  const { addToast } = useToast();
  const centerId = role === "STAFF" ? user?.center : user?.uid;

  const defaultSplits = useMemo(
    () => [
      { key: "main", name: "Main Account", value: 65, color: "#10b981" },
      { key: "agent", name: "Agent Commission", value: 25, color: "#3b82f6" },
      {
        key: "technology",
        name: "Technology Fund",
        value: 10,
        color: "#8b5cf6",
      },
    ],
    [],
  );

  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [splits, setSplits] = useState(defaultSplits);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentChecks, setPaymentChecks] = useState([]);
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [splitAmounts, setSplitAmounts] = useState({});
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());

  const colorPalette = [
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#14b8a6",
    "#6366f1",
    "#22c55e",
  ];

  const keyToDisplay = {
    main: "Main Account",
    agent: "Agent Commission",
    technology: "Technology Fund",
  };

  const normalizeSplits = useCallback(
    (config) => {
      const allowedKeys = ["main", "agent", "technology"];
      const synonyms = { admin: "main" };

      const toKey = (k) => {
        if (!k) return undefined;
        const low = String(k).toLowerCase();
        if (allowedKeys.includes(low)) return low;
        if (synonyms[low]) return synonyms[low];
        return undefined;
      };

      if (!config) return defaultSplits;

      const itemsMap = new Map();

      if (Array.isArray(config)) {
        config.forEach((item, idx) => {
          const rawKey = item?.key || item?.name || item?.label;
          const key = toKey(rawKey);
          const value =
            typeof item?.value === "number"
              ? item.value
              : typeof item?.percentage === "number"
                ? item.percentage
                : 0;
          const name =
            item?.name ||
            keyToDisplay[key] ||
            item?.label ||
            `Split ${idx + 1}`;
          const color = item?.color || colorPalette[idx % colorPalette.length];
          if (key) itemsMap.set(key, { key, name, value, color });
        });
      } else if (typeof config === "object" && config !== null) {
        Object.entries(config).forEach(([k, v], idx) => {
          const key = toKey(k);
          if (!key) return;
          const value = Number(v) || 0;
          const name = keyToDisplay[key] || k;
          const color = colorPalette[idx % colorPalette.length];
          itemsMap.set(key, { key, name, value, color });
        });
      }

      return allowedKeys.map((k, idx) => {
        if (itemsMap.has(k)) return itemsMap.get(k);
        const def = defaultSplits.find((d) => d.key === k) || {};
        return {
          key: k,
          name: keyToDisplay[k] || def.name || k,
          value: def.value || 0,
          color: def.color || colorPalette[idx % colorPalette.length],
        };
      });
    },
    [defaultSplits],
  );

  const resolvePaymentName = (payment, memberLookup) => {
    const userId =
      payment?.userId ||
      payment?.uid ||
      payment?.memberId ||
      payment?.customerId;
    const member = memberLookup.get(String(userId || ""));

    return (
      member?.fullname ||
      member?.businessName ||
      payment?.name ||
      payment?.fullName ||
      payment?.customerName ||
      payment?.paymentName ||
      payment?.reference ||
      "Taxpayer"
    );
  };

  // ---- Currency formatter ----
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  // ---- Fetch transactions for the selected date ----
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getTransactions(1, 1000, centerId, selectedDate);
      if (response?.data || response?.transactions) {
        setTransactions(response.data || response.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (e) {
      addToast("error", e.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, [addToast, selectedDate, centerId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ---- Fetch members (independent of splits, only depends on center) ----
  useEffect(() => {
    let cancelled = false;
    getMembers(1, 1000, centerId)
      .then((res) => {
        if (!cancelled) setMembers(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [centerId]);

  // ---- Load saved split config ONCE per user session ----
  // This must not re-run whenever `transactions` changes, or it will
  // silently discard any in-progress edits the user made to the sliders.
  useEffect(() => {
    const normalized = normalizeSplits(user?.paymentConfig);
    setSplits(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, uid]);

  // ---- Recompute breakdown whenever transactions, members, or splits change ----
  useEffect(() => {
    try {
      const memberLookup = new Map(
        members
          .filter((member) => member?.uid || member?.id)
          .map((member) => [String(member?.uid || member?.id), member]),
      );

      const mainPct = splits.find((s) => s.key === "main")?.value || 0;
      const agentPct = splits.find((s) => s.key === "agent")?.value || 0;
      const techPct = splits.find((s) => s.key === "technology")?.value || 0;

      const mappedPayments = transactions.map((payment) => {
        const amount = Number(payment?.amount || 0);
        const debt = Number(payment?.debt || 0);
        const net = Number(
          payment?.metadata?.receipt?.netAmount || Math.max(amount - debt, 0),
        );

        const mainAmount = (net * mainPct) / 100;
        const agentAmount = (net * agentPct) / 100;
        const technologyAmount = (net * techPct) / 100;

        return {
          id:
            payment?.id ||
            payment?.reference ||
            `${payment?.userId}-${payment?.date || payment?.createdAt || ""}`,
          userId: payment?.userId || "",
          name: resolvePaymentName(payment, memberLookup),
          reference: payment?.reference || "",
          status: payment?.status || "",
          amount,
          debt,
          net,
          mainAmount,
          agentAmount,
          technologyAmount,
          date: payment?.date || payment?.createdAt || null,
        };
      });

      const grossTotal = mappedPayments.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      const debtTotal = mappedPayments.reduce(
        (sum, item) => sum + item.debt,
        0,
      );
      const netTotal = mappedPayments.reduce((sum, item) => sum + item.net, 0);

      const totalMain = mappedPayments.reduce(
        (sum, item) => sum + item.mainAmount,
        0,
      );
      const totalAgent = mappedPayments.reduce(
        (sum, item) => sum + item.agentAmount,
        0,
      );
      const totalTech = mappedPayments.reduce(
        (sum, item) => sum + item.technologyAmount,
        0,
      );

      setPaymentChecks(mappedPayments);
      setGrossRevenue(grossTotal);
      setTotalDebt(debtTotal);
      setTotalRevenue(netTotal);

      const amounts = {};
      splits.forEach((split) => {
        const key = split.key;
        let amount = (netTotal * Number(split.value || 0)) / 100;
        if (key === "main") amount = totalMain;
        else if (key === "agent") amount = totalAgent;
        else if (key === "technology") amount = totalTech;

        amounts[key] = {
          name: split.name,
          amount,
          percentage: split.value,
          color: split.color,
        };
      });
      setSplitAmounts(amounts);
    } catch (e) {
      console.error("Error computing payment split breakdown:", e);
      addToast("error", e.message || "Failed to process transaction split");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, members, splits]);

  const handleSplitChange = (index, newValue) => {
    let val = parseInt(newValue, 10);
    if (Number.isNaN(val)) val = 0;
    val = Math.min(100, Math.max(0, val)); // clamp to 0–100
    const newSplits = splits.map((split, idx) =>
      idx === index ? { ...split, value: val } : split,
    );
    setSplits(newSplits);
  };

  const handleSaveConfig = async () => {
    if (totalAllocation !== 100) {
      addToast("error", "Total allocation must equal 100%");
      return;
    }
    setSaving(true);
    try {
      const configPayload = {};
      splits.forEach((s) => {
        configPayload[s.key] = s.value;
      });
      await updatePaymentConfig(configPayload);
      addToast("success", "Payment split configuration saved successfully");
    } catch (e) {
      addToast("error", e.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const totalAllocation = splits.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header Card */}
      <div className="rounded-2xl bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-5 md:p-6 ring-1 ring-emerald-100 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Info className="text-emerald-600" size={28} />
              Payment Split Configuration
            </h1>
            <p className="mt-1 text-sm text-slate-600 md:text-base">
              Define and monitor how collected revenue is automatically
              distributed across accounts for the selected date.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Picker Input */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xs">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="text-sm font-medium text-slate-700 outline-none bg-transparent cursor-pointer"
              />
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                totalAllocation === 100
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              Total: {totalAllocation}%
            </span>

            <button
              onClick={() => fetchTransactions()}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                loading
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleSaveConfig}
              disabled={saving || totalAllocation !== 100}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                saving || totalAllocation !== 100
                  ? "cursor-not-allowed bg-slate-200 text-slate-400"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
              }`}
            >
              <Save size={15} />
              <span>{saving ? "Saving..." : "Save Split"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Total Revenue Summary Cards */}
      <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-xs">
        <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
          Total Net Revenue for Selected Date
        </p>
        <h2 className="mt-1 text-3xl font-extrabold text-emerald-700">
          {currencyFormatter.format(totalRevenue)}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Net revenue from {paymentChecks.length} transactions on{" "}
          {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-NG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              Gross Collections
            </p>
            <p className="mt-1 text-lg font-bold text-slate-800">
              {currencyFormatter.format(grossRevenue)}
            </p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3.5 border border-rose-100">
            <p className="text-xs uppercase tracking-wider font-semibold text-rose-600">
              Total Outstanding / Debt
            </p>
            <p className="mt-1 text-lg font-bold text-rose-700">
              {currencyFormatter.format(totalDebt)}
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-100">
            <p className="text-xs uppercase tracking-wider font-semibold text-emerald-600">
              Main Account Share (
              {splits.find((s) => s.key === "main")?.value || 65}%)
            </p>
            <p className="mt-1 text-lg font-bold text-emerald-700">
              {currencyFormatter.format(splitAmounts.main?.amount || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Allocation Editor + Chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Split Configuration */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <PieChartIcon className="text-emerald-600" size={20} />
                Revenue Allocation
              </h3>
            </div>

            <div className="space-y-3">
              {(loading ? defaultSplits : splits).map((split, idx) => (
                <div
                  key={split.key || split.name}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/30"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: split.color }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">
                        {split.name}
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${split.value}%`,
                            backgroundColor: split.color,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={split.value}
                        onChange={(e) => handleSplitChange(idx, e.target.value)}
                        className="w-16 text-right text-sm font-bold text-slate-800 outline-none bg-transparent"
                      />
                      <span className="text-sm font-medium text-slate-500">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className={`mt-4 rounded-xl border p-4 transition-all ${
                totalAllocation === 100
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-rose-200 bg-rose-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  Total Allocation
                </span>
                <span
                  className={`text-xl font-extrabold ${
                    totalAllocation === 100
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {totalAllocation}%
                </span>
              </div>
            </div>

            {totalAllocation !== 100 && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                ⚠ Total allocation percentage must equal exactly 100%.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Daily Transactions Breakdown ({paymentChecks.length})
            </h4>
            <div className="mt-3 max-h-80 space-y-2.5 overflow-auto pr-1">
              {paymentChecks.length ? (
                paymentChecks.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-xl bg-slate-50 p-3 text-sm border border-slate-100"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-slate-800 capitalize">
                        {payment.name}
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {currencyFormatter.format(payment.net)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>
                        Gross: {currencyFormatter.format(payment.amount)}
                      </span>
                      {payment.debt > 0 ? (
                        <span className="text-rose-600 font-medium">
                          Debt: {currencyFormatter.format(payment.debt)}
                        </span>
                      ) : null}
                      {payment.reference ? (
                        <span className="font-mono text-[11px]">
                          Ref: {payment.reference}
                        </span>
                      ) : null}
                    </div>
                    {/* Breakdown values per transaction */}
                    <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-slate-200 pt-2 text-[11px]">
                      <div className="flex flex-col rounded-lg bg-emerald-50 p-2 text-center items-center justify-center border border-emerald-100">
                        <span className="text-emerald-700 text-[10px] font-bold uppercase">
                          Main
                        </span>
                        <span className="font-bold text-emerald-800 text-xs">
                          {currencyFormatter.format(payment.mainAmount)}
                        </span>
                      </div>
                      <div className="flex flex-col rounded-lg bg-blue-50 p-2 text-center items-center justify-center border border-blue-100">
                        <span className="text-blue-700 text-[10px] font-bold uppercase">
                          Agent
                        </span>
                        <span className="font-bold text-blue-800 text-xs">
                          {currencyFormatter.format(payment.agentAmount)}
                        </span>
                      </div>
                      <div className="flex flex-col rounded-lg bg-purple-50 p-2 text-center items-center justify-center border border-purple-100">
                        <span className="text-purple-700 text-[10px] font-bold uppercase">
                          Tech
                        </span>
                        <span className="font-bold text-purple-800 text-xs">
                          {currencyFormatter.format(payment.technologyAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No transactions recorded on this date.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Visual Breakdown */}
        <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-xs">
          <h3 className="text-lg font-semibold text-slate-900">
            Visual Allocation
          </h3>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={loading ? defaultSplits : splits}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {(loading ? defaultSplits : splits).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value}% (${currencyFormatter.format(splitAmounts[props.payload.key]?.amount || (totalRevenue * value) / 100)})`,
                    name || props.payload.name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Distribution Summary
            </h4>
            <div className="space-y-2.5">
              {(loading ? defaultSplits : splits).map((split) => {
                const splitKey = split.key || split.name;
                const splitAmount = splitAmounts[splitKey]?.amount || 0;
                return (
                  <div
                    key={split.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: split.color }}
                      />
                      <span className="text-slate-700 font-medium">
                        {split.name} ({split.value}%)
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {currencyFormatter.format(splitAmount)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-200 pt-3 mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-800">
                  Total Net Distributed
                </span>
                <span className="font-extrabold text-base text-emerald-700">
                  {currencyFormatter.format(totalRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
