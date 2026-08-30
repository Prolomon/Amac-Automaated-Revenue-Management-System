// "use client";

// import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
// import {
//   ArrowLeft,
//   Calendar,
//   Clock3,
//   Download,
//   FileText,
//   Loader2,
//   RefreshCw,
//   Search,
//   CheckCircle2,
//   XCircle,
//   Filter,
// } from "lucide-react";
// import { useRouter, useSearchParams } from "next/navigation";
// import withAuth from "@/components/withAuth";
// import { useAuth } from "@/context/AuthContext";
// import { useToast } from "@/context/ToastContext";
// import { getTransactions, Transaction } from "@/lib/services/wallet";
// import { getCenterId } from "@/lib/permissions";
// import { jsPDF } from "jspdf";

// type WalletTransactionStatus = "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";

// const getDefaultFromDate = () =>
//   new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
//     .toISOString()
//     .split("T")[0];
// const getDefaultToDate = () =>
//   new Date().toISOString().split("T")[0];

// function StatementContent() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { user } = useAuth();
//   const { addToast } = useToast();

//   const urlCenterId = searchParams?.get("centerId") || "";
//   const centerId = urlCenterId || getCenterId(user) || "";
//   const displayName = user?.adminName || user?.center || "AMAC";

//   const [transactions, setTransactions] = useState<Transaction[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [fromDate, setFromDate] = useState(getDefaultFromDate());
//   const [toDate, setToDate] = useState(getDefaultToDate());
//   const [reference, setReference] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [meta, setMeta] = useState<{ total: number; limit: number }>({
//     total: 0,
//     limit: 500,
//   });

//   const fetchTransactions = useCallback(async () => {
//     if (!centerId) {
//       setLoading(false);
//       return;
//     }
//     setLoading(true);
//     try {
//       const res: any = await getTransactions(
//         centerId,
//         1,
//         500,
//         fromDate as any,
//         toDate as any,
//         reference,
//         "",
//         statusFilter
//       );
//       if (res?.ok) {
//         const txs = Array.isArray(res.transactions)
//           ? res.transactions
//           : Array.isArray(res.data)
//             ? res.data
//             : [];
//         setTransactions(txs);
//         setMeta({ total: res.meta?.total || txs.length, limit: 500 });
//       } else {
//         addToast("error", res?.message || "Failed to fetch transactions");
//         setTransactions([]);
//         setMeta({ total: 0, limit: 500 });
//       }
//     } catch (err: any) {
//       addToast(
//         "error",
//         err?.message || "An error occurred while fetching transactions"
//       );
//       setTransactions([]);
//       setMeta({ total: 0, limit: 500 });
//     } finally {
//       setLoading(false);
//     }
//   }, [centerId, fromDate, toDate, reference, statusFilter, addToast]);

//   useEffect(() => {
//     fetchTransactions();
//   }, [fetchTransactions]);


//   const isCreditTx = (tx: Transaction) =>
//     (tx.event || "").toLowerCase().includes("credit");

//   const getMainAmount = (tx: Transaction) =>
//     Number(
//       (tx.metadata as any)?.split?.mainAmount ||
//         (tx.metadata as any)?.receipt?.breakdown?.main ||
//         tx.amount ||
//         0
//     );
//   const getAgentAmount = (tx: Transaction) =>
//     Number(
//       (tx.metadata as any)?.split?.agentAmount ||
//         (tx.metadata as any)?.receipt?.breakdown?.agent ||
//         0
//     );
//   const getTechAmount = (tx: Transaction) =>
//     Number(
//       (tx.metadata as any)?.split?.technologyAmount ||
//         (tx.metadata as any)?.receipt?.breakdown?.technology ||
//         0
//     );

//   const summary = useMemo(() => {
//     let totalCredits = 0;
//     let totalDebits = 0;
//     let creditCount = 0;
//     let debitCount = 0;

//     transactions.forEach((tx) => {
//       const amount = Number(tx.amount || 0);
//       if (isCreditTx(tx)) {
//         totalCredits += amount;
//         creditCount++;
//       } else {
//         totalDebits += amount;
//         debitCount++;
//       }
//     });

//     return {
//       totalCredits,
//       totalDebits,
//       netBalance: totalCredits - totalDebits,
//       totalTransactions: transactions.length,
//       creditCount,
//       debitCount,
//     };
//   }, [transactions]);

//   const formatCurrency = (value: number | string) => {
//     const numValue = typeof value === "string" ? Number(value) : value;
//     return new Intl.NumberFormat("en-NG", {
//       style: "currency",
//       currency: "NGN",
//     }).format(numValue || 0);
//   };

//   const formatDate = (dateStr: string | Date) => {
//     if (!dateStr) return "—";
//     return new Date(dateStr).toLocaleDateString("en-NG", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   const normalizeStatus = (status: any): WalletTransactionStatus => {
//     const s = String(status || "").toUpperCase().trim();
//     if (s === "SUCCESS" || s === "1") return "SUCCESS";
//     if (s === "PENDING" || s === "0") return "PENDING";
//     if (s === "REFUNDED") return "REFUNDED";
//     if (s === "FAILED") return "FAILED";
//     if (s === "CANCELLED") return "FAILED";
//     return "FAILED";
//   };

//   const statusBadgeClass = (status: any) => {
//     const s = normalizeStatus(status);
//     if (s === "SUCCESS")
//       return "border-emerald-200 bg-emerald-50 text-emerald-700";
//     if (s === "PENDING")
//       return "border-amber-200 bg-amber-50 text-amber-700";
//     if (s === "REFUNDED")
//       return "border-violet-200 bg-violet-50 text-violet-700";
//     return "border-rose-200 bg-rose-50 text-rose-700";
//   };

//   const statusIcon = (status: any) => {
//     const s = normalizeStatus(status);
//     if (s === "SUCCESS") return <CheckCircle2 className="h-3.5 w-3.5" />;
//     if (s === "PENDING") return <Clock3 className="h-3.5 w-3.5" />;
//     if (s === "REFUNDED") return <Clock3 className="h-3.5 w-3.5" />;
//     return <XCircle className="h-3.5 w-3.5" />;
//   };

//   const statusLabel = (status: any) => {
//     const s = normalizeStatus(status);
//     if (s === "SUCCESS") return "Success";
//     if (s === "PENDING") return "Pending";
//     if (s === "REFUNDED") return "Refunded";
//     return "Failed";
//   };

//   const truncateText = (text: string, maxLen: number) => {
//     if (!text) return "—";
//     if (text.length <= maxLen) return text;
//     return text.substring(0, maxLen - 3) + "...";
//   };

//   const generatePDF = useCallback(() => {
//     const doc = new jsPDF({
//       orientation: "landscape",
//       unit: "mm",
//       format: "a4",
//     });
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();
//     const margin = 10;
//     const tableLeft = margin;
//     const tableWidth = pageWidth - 2 * margin;
//     let y = margin;

//     // ---- Header ----
//     doc.setFontSize(16);
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(16, 185, 129);
//     doc.text("AMAC", margin, y);

//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(71, 80, 90);
//     doc.text("Abuja Municipal Area Council", margin, y + 4);
//     doc.text("Automated Revenue Management System", margin, y + 7);

//     doc.setFontSize(12);
//     doc.setTextColor(17, 24, 39);
//     doc.setFont("helvetica", "bold");
//     doc.text("Account Statement", pageWidth - margin, y - 2, { align: "right" });

//     doc.setFontSize(7);
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(115, 111, 111);
//     doc.text(
//       `Generated: ${new Date().toLocaleString("en-NG")}`,
//       pageWidth - margin,
//       y + 4,
//       { align: "right" }
//     );
//     doc.setTextColor(0, 0, 0);

//     y += 14;

//     // ---- Statement Info ----
//     doc.setFontSize(8);
//     doc.setTextColor(71, 80, 90);
//     doc.text(`Prepared For: ${displayName}`, margin, y);
//     doc.text(`Center ID: ${centerId || "—"}`, margin, y + 4);
//     doc.text(
//       `Statement Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`,
//       margin,
//       y + 8
//     );
//     doc.text(`Reference Filter: ${reference || "None"}`, margin, y + 12);
//     doc.text(`Status Filter: ${statusFilter || "All"}`, margin, y + 16);

//     y += 22;

//     // ---- Summary Boxes ----
//     const boxW = 32;
//     const boxH = 14;
//     const boxGap = 4;
//     const boxesStartX = (pageWidth - (4 * boxW + 3 * boxGap)) / 2;

//     const summaryBoxes = [
//       {
//         label: "Total Credits",
//         value: formatCurrency(summary.totalCredits),
//         bg: [220, 252, 231],
//         color: [5, 150, 108],
//       },
//       {
//         label: "Total Debits",
//         value: formatCurrency(summary.totalDebits),
//         bg: [254, 226, 220],
//         color: [220, 38, 38],
//       },
//       {
//         label: "Net Balance",
//         value: formatCurrency(summary.netBalance),
//         bg: summary.netBalance >= 0 ? [220, 252, 231] : [254, 226, 220],
//         color: [71, 80, 90],
//       },
//       {
//         label: "Transactions",
//         value: String(summary.totalTransactions),
//         bg: [226, 232, 240],
//         color: [17, 24, 39],
//       },
//     ];

//     summaryBoxes.forEach((box, i) => {
//       const bx = boxesStartX + i * (boxW + boxGap);
//       doc.setFillColor(box.bg[0], box.bg[1], box.bg[2]);
//       doc.roundedRect(bx, y, boxW, boxH, 1.5, 1.5, "F");

//       doc.setFont("helvetica", "normal");
//       doc.setFontSize(6.5);
//       doc.setTextColor(box.color[0], box.color[1], box.color[2]);
//       doc.text(box.label, bx + 2, y + 5);

//       doc.setFontSize(7.5);
//       doc.setFont("helvetica", "bold");
//       doc.text(box.value, bx + 2, y + 11);
//     });

//     doc.setTextColor(0, 0, 0);
//     y += boxH + 5;



//     // ---- Table ----
//     const columns = [
//       { label: "S/N", w: 8 },
//       { label: "Reference", w: 48 },
//       { label: "Date", w: 22 },
//       { label: "Type", w: 20 },
//       { label: "Status", w: 25 },
//       { label: "Amount", w: 30 },
//       { label: "Breakdown (M/A/T)", w: 42 },
//     ];

//     const totalColW = columns.reduce((s, c) => s + c.w, 0);
//     const colGap = (tableWidth - totalColW) / (columns.length - 1);
//     const colPositions: { x: number; w: number }[] = [];
//     let cx = tableLeft;
//     columns.forEach((col, idx) => {
//       colPositions.push({ x: cx, w: col.w });
//       cx += col.w + (idx < columns.length - 1 ? colGap : 0);
//     });

//     const headerH = 6;
//     const rowH = 6;

//     const drawTableHeader = (startY: number) => {
//       doc.setFillColor(241, 245, 249);
//       doc.rect(tableLeft, startY, tableWidth, headerH, "F");
//       doc.setDrawColor(226, 232, 240);
//       doc.setLineWidth(0.3);
//       doc.rect(tableLeft, startY, tableWidth, headerH);

//       doc.setFont("helvetica", "bold");
//       doc.setFontSize(6.5);
//       doc.setTextColor(71, 80, 90);
//       colPositions.forEach((col, idx) => {
//         doc.text(truncateText(columns[idx].label, 20), col.x + 1.5, startY + 4);
//       });
//     };

//     drawTableHeader(y);
//     y += headerH;

//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(17, 24, 39);

//     transactions.forEach((tx, i) => {
//       if (y + rowH > pageHeight - margin - 12) {
//         doc.addPage();
//         doc.setFontSize(7);
//         doc.setTextColor(115, 111, 111);
//         doc.text(
//           `AMAC Account Statement - ${displayName || "Statement"}`,
//           margin,
//           margin + 3
//         );
//         y = margin + 6;
//         drawTableHeader(y);
//         y += headerH;
//       }

//       if (i % 2 === 1) {
//         doc.setFillColor(248, 250, 252);
//         doc.rect(tableLeft, y, tableWidth, rowH, "F");
//       }
//       doc.setDrawColor(226, 232, 240);
//       doc.setLineWidth(0.15);
//       doc.rect(tableLeft, y, tableWidth, rowH);

//       const credit = isCreditTx(tx);
//       const amt = Number(tx.amount || 0);
//       const mainAmt = getMainAmount(tx);
//       const agentAmt = getAgentAmount(tx);
//       const techAmt = getTechAmount(tx);

//       doc.setFontSize(6);
//       doc.setTextColor(71, 80, 90);
//       doc.text(String(i + 1), colPositions[0].x + 1.5, y + 4);
//       doc.text(
//         truncateText(tx.reference || tx.id || "", 14),
//         colPositions[1].x + 1.5,
//         y + 4
//       );
//       doc.text(
//         tx.createdAt
//           ? new Date(tx.createdAt).toLocaleDateString("en-NG")
//           : "—",
//         colPositions[2].x + 1.5,
//         y + 4
//       );

//       doc.setFont("helvetica", "bold");
//       doc.setTextColor(
//         credit ? 5 : 220,
//         credit ? 150 : 38,
//         credit ? 108 : 38
//       );
//       doc.text(
//         credit ? "CREDIT" : "DEBIT",
//         colPositions[3].x + 1.5,
//         y + 4
//       );

//       const s = normalizeStatus(tx.status);
//       let sc: [number, number, number] = [180, 180, 180];
//       if (s === "SUCCESS") sc = [5, 150, 108];
//       else if (s === "PENDING") sc = [234, 144, 8];
//       else if (s === "REFUNDED") sc = [136, 73, 221];
//       else sc = [220, 38, 38];
//       doc.setTextColor(sc[0], sc[1], sc[2]);
//       doc.text(
//         statusLabel(tx.status),
//         colPositions[4].x + 1.5,
//         y + 4
//       );

//       doc.setTextColor(
//         credit ? 5 : 220,
//         credit ? 150 : 38,
//         credit ? 108 : 38
//       );
//       doc.text(
//         `${credit ? "+" : "-"}₦${Math.abs(amt).toLocaleString("en-NG")}`,
//         colPositions[5].x + colPositions[5].w - 1.5,
//         y + 4,
//         { align: "right" }
//       );

//       doc.setTextColor(71, 80, 90);
//       doc.setFont("helvetica", "normal");
//       doc.setFontSize(5.5);
//       const brkText = `₦${Math.round(mainAmt).toLocaleString()} / ₦${Math.round(
//         agentAmt
//       ).toLocaleString()} / ₦${Math.round(techAmt).toLocaleString()}`;
//       doc.text(
//         truncateText(brkText, 20),
//         colPositions[6].x + colPositions[6].w - 1.5,
//         y + 4,
//         { align: "right" }
//       );

//       y += rowH;
//     });


//     // ---- Summary Total Row ----
//     y += 2;
//     doc.setDrawColor(226, 232, 240);
//     doc.setLineWidth(0.3);
//     doc.line(tableLeft, y, tableLeft + tableWidth, y);

//     y += 5;
//     doc.setFontSize(7.5);
//     doc.setTextColor(71, 80, 90);
//     doc.setFont("helvetica", "bold");
//     doc.text("Summary:", tableLeft, y);

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(6.5);
//     doc.setTextColor(5, 150, 108);
//     doc.text(`Total Credits: ${formatCurrency(summary.totalCredits)}`, tableLeft + 20, y);
//     doc.setTextColor(220, 38, 38);
//     doc.text(`Total Debits: ${formatCurrency(summary.totalDebits)}`, tableLeft + 55, y);
//     doc.setTextColor(17, 24, 39);
//     doc.text(`Net Balance: ${formatCurrency(summary.netBalance)}`, tableLeft + 90, y);
//     doc.text(
//       `Transactions: ${summary.totalTransactions} (${summary.creditCount}C / ${summary.debitCount}D)`,
//       tableLeft + 130,
//       y
//     );

//     // ---- Footer ----
//     const totalPages = doc.internal.pageSize.getNumberOfPages();
//     doc.setFontSize(6);
//     doc.setTextColor(148, 150, 152);
//     doc.setFont("helvetica", "normal");
//     for (let p = 1; p <= totalPages; p++) {
//       doc.setPage(p);
//       doc.text(
//         `Page ${p} of ${totalPages}`,
//         pageWidth - margin,
//         pageHeight - 5,
//         { align: "right" }
//       );
//     }

//     doc.save(
//       `AMAC_Statement_${centerId || "center"}_${fromDate}_to_${toDate}.pdf`
//     );
//   }, [
//     transactions,
//     fromDate,
//     toDate,
//     summary,
//     centerId,
//     displayName,
//     reference,
//     statusFilter,
//   ]);


//   const handleResetFilters = () => {
//     setFromDate(getDefaultFromDate());
//     setToDate(getDefaultToDate());
//     setReference("");
//     setStatusFilter("");
//   };

//   useEffect(() => {
//     if (!centerId) {
//       setLoading(false);
//     }
//   }, [centerId]);

//   return (
//     <div className="flex flex-col gap-6">
//       {/* Header */}
//       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//         <div className="flex items-center gap-3">
//           <button
//             type="button"
//             onClick={() => router.push("/admin/wallet")}
//             className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition-colors"
//             aria-label="Back to wallet"
//           >
//             <ArrowLeft className="h-5 w-5" />
//           </button>
//           <div>
//             <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
//               Account Statement
//             </h1>
//             <p className="mt-1 text-sm text-slate-600">
//               Review and export transaction records for{" "}
//               <span className="font-medium text-slate-800">
//                 {displayName || "your center"}
//               </span>
//               .
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* No centerId warning */}
//       {!centerId && (
//         <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
//           <p className="text-sm text-amber-800">
//             No center ID was found in the URL or user session. Transaction
//             data may not be available.
//           </p>
//         </div>
//       )}
//       {/* Filters */}
//       <div className="rounded-2xl bg-white p-4 md:p-5 ring-1 ring-slate-100 shadow-sm">
//         <div className="mb-3 flex items-center gap-2">
//           <Filter className="h-4 w-4 text-slate-500" />
//           <h2 className="text-sm font-semibold text-slate-700">
//             Statement Filters
//           </h2>
//         </div>
//         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
//           <div>
//             <label className="block text-xs font-medium text-slate-600 mb-1">
//               From Date
//             </label>
//             <div className="relative">
//               <input
//                 type="date"
//                 value={fromDate}
//                 onChange={(e) => setFromDate(e.target.value)}
//                 className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
//               />
//               <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
//             </div>
//           </div>
//           <div>
//             <label className="block text-xs font-medium text-slate-600 mb-1">
//               To Date
//             </label>
//             <div className="relative">
//               <input
//                 type="date"
//                 value={toDate}
//                 onChange={(e) => setToDate(e.target.value)}
//                 className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
//               />
//               <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
//             </div>
//           </div>
//           <div className="sm:col-span-2">
//             <label className="block text-xs font-medium text-slate-600 mb-1">
//               Reference
//             </label>
//             <div className="relative">
//               <input
//                 type="text"
//                 value={reference}
//                 onChange={(e) => setReference(e.target.value)}
//                 placeholder="Search by reference or transaction ID"
//                 className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
//               />
//               <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
//             </div>
//           </div>
//           <div>
//             <label className="block text-xs font-medium text-slate-600 mb-1">
//               Status
//             </label>
//             <select
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100 appearance-none"
//             >
//               <option value="">All Statuses</option>
//               <option value="SUCCESS">Success</option>
//               <option value="PENDING">Pending</option>
//               <option value="FAILED">Failed</option>
//               <option value="REFUNDED">Refunded</option>
//             </select>
//           </div>
//         </div>

//         <div className="mt-4 flex items-center justify-end gap-3">
//           <button
//             type="button"
//             onClick={handleResetFilters}
//             className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
//           >
//             Reset Filters
//           </button>
//           <button
//             type="button"
//             onClick={fetchTransactions}
//             disabled={loading || !centerId}
//             className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
//           >
//             {loading ? (
//               <Loader2 className="h-4 w-4 animate-spin" />
//             ) : (
//               <RefreshCw className="h-4 w-4" />
//             )}
//                         Apply &amp; Refresh
//           </button>
//         </div>
//       </div>

//     <div class="max-w-5xl mx-auto my-8 bg-white shadow-lg rounded-lg overflow-hidden">
 
// Actual statement
//   <!-- Header -->
//   <div class="bg-green-800 text-white px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//     <div>
//       <h1 class="text-2xl font-bold tracking-wide">TR3-G INNOVATIONS LIMITED</h1>
//       <p class="text-green-100 text-sm">Unified Revenue Management Solution</p>
//     </div>
//     <div class="text-left sm:text-right">
//       <p class="text-lg font-semibold">Abuja Municipal Area Council (AMAC)</p>
//       <p class="text-green-100 text-sm">Monthly Statement of Account</p>
//     </div>
//   </div>
 
//   <!-- Meta info -->
//   <div class="px-8 py-6 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 text-sm">
//     <div>
//       <span class="block text-gray-500 uppercase text-xs tracking-wide">Statement Period</span>
//       <span class="font-medium text-gray-800">August 1 – August 31, 2026</span>
//     </div>
//     <div>
//       <span class="block text-gray-500 uppercase text-xs tracking-wide">Statement Reference</span>
//       <span class="font-medium text-gray-800">AMAC-TR3G-SOA-2026-08</span>
//     </div>
//     <div>
//       <span class="block text-gray-500 uppercase text-xs tracking-wide">Generation Date</span>
//       <span class="font-medium text-gray-800">September 1, 2026</span>
//     </div>
//     <div>
//       <span class="block text-gray-500 uppercase text-xs tracking-wide">Technical Partner / Agent</span>
//       <span class="font-medium text-gray-800">PayPoint Collections Ltd (Zone B)</span>
//     </div>
//     <div>
//       <span class="block text-gray-500 uppercase text-xs tracking-wide">Partner ID</span>
//       <span class="font-medium text-gray-800">TP-AMAC-2026-088</span>
//     </div>
//     <div>
//       <span class="block text-gray-500 uppercase text-xs tracking-wide">Settlement Bank & Account</span>
//       <span class="font-medium text-gray-800">Access Bank / 0012345678</span>
//     </div>
//   </div>
 
//   <!-- Section 1: Monthly Collection Summary -->
//   <div class="px-8 py-6">
//     <h2 class="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
//       <span class="inline-block w-1.5 h-5 bg-yellow-500 rounded-sm"></span>
//       1. Monthly Collection Summary
//     </h2>
//     <div class="overflow-x-auto rounded-md border border-gray-200">
//       <table class="min-w-full text-sm">
//         <thead>
//           <tr class="bg-green-800 text-white text-left">
//             <th class="px-4 py-3 font-medium">Revenue Stream / Head</th>
//             <th class="px-4 py-3 font-medium text-right">Demand Notices Issued</th>
//             <th class="px-4 py-3 font-medium text-right">Paid Transactions</th>
//             <th class="px-4 py-3 font-medium text-right">Gross Collections (₦)</th>
//           </tr>
//         </thead>
//         <tbody class="divide-y divide-gray-200">
//           <tr class="odd:bg-white even:bg-gray-50">
//             <td class="px-4 py-3">Tenement Rate (Residential &amp; Commercial)</td>
//             <td class="px-4 py-3 text-right">1,250</td>
//             <td class="px-4 py-3 text-right">980</td>
//             <td class="px-4 py-3 text-right font-medium">45,000,000.00</td>
//           </tr>
//           <tr class="odd:bg-white even:bg-gray-50">
//             <td class="px-4 py-3">Liquor License &amp; Food Premises Permits</td>
//             <td class="px-4 py-3 text-right">450</td>
//             <td class="px-4 py-3 text-right">410</td>
//             <td class="px-4 py-3 text-right font-medium">12,300,000.00</td>
//           </tr>
//           <tr class="odd:bg-white even:bg-gray-50">
//             <td class="px-4 py-3">Market Stallage &amp; Trade Operator Fees</td>
//             <td class="px-4 py-3 text-right">3,100</td>
//             <td class="px-4 py-3 text-right">2,950</td>
//             <td class="px-4 py-3 text-right font-medium">18,500,000.00</td>
//           </tr>
//           <tr class="odd:bg-white even:bg-gray-50">
//             <td class="px-4 py-3">Mobile Advert &amp; Signage Permits</td>
//             <td class="px-4 py-3 text-right">320</td>
//             <td class="px-4 py-3 text-right">290</td>
//             <td class="px-4 py-3 text-right font-medium">8,700,000.00</td>
//           </tr>
//         </tbody>
//         <tfoot>
//           <tr class="bg-yellow-50 border-t-2 border-yellow-500 font-semibold">
//             <td class="px-4 py-3">TOTAL GROSS COLLECTIONS</td>
//             <td class="px-4 py-3 text-right">5,120</td>
//             <td class="px-4 py-3 text-right">4,630</td>
//             <td class="px-4 py-3 text-right text-green-800">₦ 84,500,000.00</td>
//           </tr>
//         </tfoot>
//       </table>
//     </div>
//   </div>
 
//   <!-- Section 2: Revenue Split & Disbursement Schedule -->
//   <div class="px-8 py-6 bg-gray-50">
//     <h2 class="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
//       <span class="inline-block w-1.5 h-5 bg-yellow-500 rounded-sm"></span>
//       2. Revenue Split &amp; Disbursement Schedule
//     </h2>
//     <div class="overflow-x-auto rounded-md border border-gray-200">
//       <table class="min-w-full text-sm bg-white">
//         <thead>
//           <tr class="bg-green-800 text-white text-left">
//             <th class="px-4 py-3 font-medium">Stakeholder / Beneficiary</th>
//             <th class="px-4 py-3 font-medium text-right">Agreed Split Ratio (%)</th>
//             <th class="px-4 py-3 font-medium text-right">Gross Entitlement (₦)</th>
//             <th class="px-4 py-3 font-medium text-right">Deductions / Withholding (₦)</th>
//             <th class="px-4 py-3 font-medium text-right">Net Payable Amount (₦)</th>
//           </tr>
//         </thead>
//         <tbody class="divide-y divide-gray-200">
//           <tr class="odd:bg-white even:bg-gray-50">
//             <td class="px-4 py-3">AMAC Treasury Account</td>
//             <td class="px-4 py-3 text-right">80.0%</td>
//             <td class="px-4 py-3 text-right">67,600,000.00</td>
//             <td class="px-4 py-3 text-right text-gray-500">0.00</td>
//             <td class="px-4 py-3 text-right font-medium">67,600,000.00</td>
//           </tr>
//           <tr class="odd:bg-white even:bg-gray-50">
//             <td class="px-4 py-3">Technical Partner Commission</td>
//             <td class="px-4 py-3 text-right">15.0%</td>
//             <td class="px-4 py-3 text-right">12,675,000.00</td>
//             <td class="px-4 py-3 text-right text-red-600">633,750.00 <span class="text-xs text-gray-400">(5% WHT)</span></td>
//             <td class="px-4 py-3 text-right font-medium">12,041,250.00</td>
//           </tr>
//           <tr class="odd:bg-white even:bg-gray-50">
//             <td class="px-4 py-3">Platform Software / Maintenance Fee</td>
//             <td class="px-4 py-3 text-right">5.0%</td>
//             <td class="px-4 py-3 text-right">4,225,000.00</td>
//             <td class="px-4 py-3 text-right text-red-600">211,250.00 <span class="text-xs text-gray-400">(5% WHT)</span></td>
//             <td class="px-4 py-3 text-right font-medium">4,013,750.00</td>
//           </tr>
//         </tbody>
//         <tfoot>
//           <tr class="bg-yellow-50 border-t-2 border-yellow-500 font-semibold">
//             <td class="px-4 py-3">TOTAL SETTLEMENT DISBURSED</td>
//             <td class="px-4 py-3 text-right">100.0%</td>
//             <td class="px-4 py-3 text-right">₦ 84,500,000.00</td>
//             <td class="px-4 py-3 text-right text-red-600">₦ 845,000.00</td>
//             <td class="px-4 py-3 text-right text-green-800">₦ 83,655,000.00</td>
//           </tr>
//         </tfoot>
//       </table>
//     </div>
//   </div>
 
//   <!-- Section 3: Transaction Performance Metrics -->
//   <div class="px-8 py-6">
//     <h2 class="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
//       <span class="inline-block w-1.5 h-5 bg-yellow-500 rounded-sm"></span>
//       3. Transaction Performance Metrics
//     </h2>
 
//     <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
 
//       <!-- Collection Channel Breakdown -->
//       <div class="border border-gray-200 rounded-md p-5">
//         <h3 class="font-medium text-gray-700 mb-4">Collection Channel Breakdown</h3>
//         <div class="space-y-4">
//           <div>
//             <div class="flex justify-between text-sm mb-1">
//               <span>POS Terminals</span>
//               <span class="font-medium">₦ 48,200,000.00 (57%)</span>
//             </div>
//             <div class="w-full bg-gray-200 rounded-full h-2">
//               <div class="bg-green-700 h-2 rounded-full" style="width:57%"></div>
//             </div>
//           </div>
//           <div>
//             <div class="flex justify-between text-sm mb-1">
//               <span>Bank Transfer / Remita</span>
//               <span class="font-medium">₦ 29,300,000.00 (35%)</span>
//             </div>
//             <div class="w-full bg-gray-200 rounded-full h-2">
//               <div class="bg-yellow-500 h-2 rounded-full" style="width:35%"></div>
//             </div>
//           </div>
//           <div>
//             <div class="flex justify-between text-sm mb-1">
//               <span>Web Portal</span>
//               <span class="font-medium">₦ 7,000,000.00 (8%)</span>
//             </div>
//             <div class="w-full bg-gray-200 rounded-full h-2">
//               <div class="bg-gray-500 h-2 rounded-full" style="width:8%"></div>
//             </div>
//           </div>
//         </div>
//       </div>
 
//       <!-- Reconciliation Status -->
//       <div class="border border-gray-200 rounded-md p-5">
//         <h3 class="font-medium text-gray-700 mb-4">Reconciliation &amp; Discrepancy Status</h3>
//         <div class="flex items-center justify-between py-2 border-b border-gray-100">
//           <span class="text-sm text-gray-600">Total Successful Direct Gateway Settlements</span>
//           <span class="font-semibold text-gray-800">₦ 84,500,000.00</span>
//         </div>
//         <div class="flex items-center justify-between py-2">
//           <span class="text-sm text-gray-600">Unreconciled / Flagged Transactions</span>
//           <span class="inline-flex items-center gap-1.5 font-semibold text-green-700">
//             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
//             ₦ 0.00 (0.00%)
//           </span>
//         </div>
//       </div>
 
//     </div>
//   </div>
 
//   <!-- Signatures -->
//   <div class="px-8 py-8 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-8">
//     <div>
//       <div class="border-b border-gray-400 h-12"></div>
//       <p class="mt-2 text-sm font-medium text-gray-700">Prepared By</p>
//       <p class="text-xs text-gray-500">Head of Finance &amp; Operations — TR3-G Innovations Limited</p>
//     </div>
//     <div>
//       <div class="border-b border-gray-400 h-12"></div>
//       <p class="mt-2 text-sm font-medium text-gray-700">Verified &amp; Approved By</p>
//       <p class="text-xs text-gray-500">Chief Revenue Officer (CRO) — Abuja Municipal Area Council (AMAC)</p>
//     </div>
//   </div>
 
//   <!-- Footer -->
//   <div class="bg-gray-800 text-gray-300 text-xs text-center py-3">
//     TR3-G Innovations Limited | Confidential Revenue Statement — Page 1 of 1
//   </div>
 
// </div>
 

//       {/* Results Count */}
//       {!loading && transactions.length > 0 && (
//         <div className="text-sm text-slate-600">
//           Showing {transactions.length} transaction
//           {transactions.length !== 1 ? "s" : ""} from{" "}
//           <span className="font-medium">{meta.total}</span> total
//           {meta.total !== transactions.length ? (
//             <span className="text-xs text-slate-400">
//               {" "}
//               (showing first {transactions.length})
//             </span>
//           ) : null}
//         </div>
//       )}
//     </div>
//   );
// }

// function StatementPage() {
//   return (
//     <Suspense fallback={<div>Loading...</div>}>
//       <StatementContent />
//     </Suspense>
//   );
// }

// export default withAuth(StatementPage);


