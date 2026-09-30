"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { Download, QrCode, Copy, Check, Loader2 } from "lucide-react";
import { Member } from "@/lib/services/member";
import html2canvas from "html2canvas-pro";

interface PaymentCardItemProps {
  member: Member;
  onOpenQr: (member: Member) => void;
}

export default function PaymentCardItem({ member, onOpenQr }: PaymentCardItemProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extract account details from member or member wallet
  const wallet = Array.isArray(member.wallet)
    ? member.wallet[0]
    : Array.isArray((member as any).wallets)
    ? (member as any).wallets[0]
    : (member.wallet || (member as any).wallets);

  const bankName = wallet?.bank?.name || wallet?.bank?.bankName || wallet?.bankName || "AMAC Unified Bank / Kuda MFB";
  const accountNo = wallet?.accountNo || wallet?.accountNumber || member.phone || "6119039150";
  const accountName = (wallet?.accountName || member.businessName || member.fullname || "AMAC TAXPAYER").toUpperCase();

  const handleCopyAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (accountNo) {
      navigator.clipboard.writeText(accountNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement("a");
      const safeName = (member.businessName || member.fullname || "taxpayer")
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `AMAC_Payment_Card_${safeName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err: any) {
      console.error("Failed to download payment card:", err);
      alert(`Download error: ${err?.message || "Failed to export card image"}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Visual Payment Card (strictly styled to match sample image) */}
      <div
        ref={cardRef}
        className="relative w-full max-w-90 aspect-[1/1.48] rounded-3xl overflow-hidden p-5 flex flex-col justify-between shadow-lg text-white select-none"
        style={{
          background: "linear-gradient(145deg, #02945a 0%, #03a866 50%, #01804c 100%)",
        }}
      >
        {/* Subtle curved background overlay styling */}
        <div className="pointer-events-none absolute inset-0 opacity-15">
          <svg className="w-full h-full" viewBox="0 0 400 600" fill="none" preserveAspectRatio="none">
            <path
              d="M-50 150 C 100 80, 250 250, 450 100 L 450 600 L -50 600 Z"
              fill="#ffffff"
            />
            <path
              d="M-50 350 C 150 280, 280 480, 450 320 L 450 600 L -50 600 Z"
              fill="#ffffff"
            />
          </svg>
        </div>

        {/* Top Header Row with Logo */}
        <div className="relative z-10 flex items-start justify-between w-full">
          <div>
            <span 
              className="text-[10px] font-semibold uppercase tracking-wider block"
              style={{ color: "rgba(209, 250, 229, 0.95)" }}
            >
              Abuja Municipal Area Council
            </span>
            <span 
              className="text-[9px] font-mono"
              style={{ color: "rgba(167, 243, 208, 0.85)" }}
            >
              UID: {member.uid || "N/A"}
            </span>
          </div>
          {/* Logo capsule on top right */}
          <div 
            className="rounded-full py-1 px-3 flex items-center gap-1.5 shadow-sm"
            style={{ backgroundColor: "#ffffff" }}
          >
            <div className="relative w-5 h-5">
              <Image
                src="/icon.png"
                alt="AMAC Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-bold text-xs tracking-tight" style={{ color: "#065f46" }}>
              AMAC Pay
            </span>
          </div>
        </div>

        {/* Center Title Header */}
        <div className="relative z-10 text-center my-1">
          <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight text-white">
            PAY WITH<br />BANK TRANSFER
          </h2>
          <p 
            className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase mt-0.5"
            style={{ color: "#d1fae5" }}
          >
            ALL BANKS ACCEPTED
          </p>
        </div>

        {/* The 3 Stacked White Boxes with Floating Pill Badges */}
        <div className="relative z-10 space-y-3.5 my-1">
          {/* Box 1: Recipient Bank */}
          <div className="relative pt-2">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
              <span 
                className="inline-block text-white text-[10px] font-bold px-3.5 py-0.5 rounded-full tracking-wide shadow-xs"
                style={{ backgroundColor: "#582be8" }}
              >
                Recipient Bank
              </span>
            </div>
            <div 
              className="rounded-2xl px-3 py-2.5 flex items-center justify-center gap-2 shadow-sm text-center"
              style={{ backgroundColor: "#ffffff" }}
            >
              <div className="relative w-5 h-5 shrink-0">
                <Image
                  src="/icon.png"
                  alt="Bank Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-extrabold text-sm md:text-base tracking-tight truncate max-w-50" style={{ color: "#1e1b4b" }}>
                {bankName}
              </span>
            </div>
          </div>

          {/* Box 2: Account Number */}
          <div className="relative pt-2">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
              <span 
                className="inline-block text-white text-[10px] font-bold px-3.5 py-0.5 rounded-full tracking-wide shadow-xs"
                style={{ backgroundColor: "#582be8" }}
              >
                Account Number
              </span>
            </div>
            <div 
              className="rounded-2xl px-3 py-2.5 flex items-center justify-center gap-2 shadow-sm relative group"
              style={{ backgroundColor: "#ffffff" }}
            >
              <span className="font-black text-2xl md:text-3xl tracking-widest font-mono select-all" style={{ color: "#1e1b4b" }}>
                {accountNo}
              </span>
              <button
                type="button"
                onClick={handleCopyAccount}
                title="Copy account number"
                data-html2canvas-ignore="true"
                className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Box 3: Account Name */}
          <div className="relative pt-2">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
              <span 
                className="inline-block text-white text-[10px] font-bold px-3.5 py-0.5 rounded-full tracking-wide shadow-xs"
                style={{ backgroundColor: "#582be8" }}
              >
                Account Name
              </span>
            </div>
            <div 
              className="rounded-2xl px-3 py-2.5 flex items-center justify-center shadow-sm text-center"
              style={{ backgroundColor: "#ffffff" }}
            >
              <span className="font-black text-xs md:text-sm tracking-wide truncate max-w-70" style={{ color: "#1e1b4b" }}>
                {accountName}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Section matching sample badge */}
        <div className="relative z-10 pt-1">
          {/* App download badge */}
          <div 
            className="rounded-full py-1 px-3 flex items-center justify-center gap-2 shadow-xs mb-1.5"
            style={{ backgroundColor: "#ffffff" }}
          >
            <div 
              className="text-white rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider flex items-center gap-1"
              style={{ backgroundColor: "#0f172a" }}
            >
              <span>GET IT ON</span>
              <span className="font-extrabold" style={{ color: "#34d399" }}>Google Play</span>
            </div>
            <span className="font-semibold text-[10px] truncate" style={{ color: "#1e1b4b" }}>
              Download AMAC Revenue App
            </span>
          </div>

          {/* Accreditation line */}
          <div className="text-[9px] font-medium" style={{ color: "#d1fae5" }}>
            <span>Note: </span>
            <span>You are required to pay through this account.</span>
          </div>
        </div>
      </div>

      {/* Card Action Buttons (Under card) */}
      <div className="flex items-center gap-2 mt-3 w-full max-w-90">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {downloading ? (
            <>
              <Loader2 size={14} className="animate-spin text-emerald-600" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Download size={14} className="text-emerald-600" />
              <span>Download Card</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => onOpenQr(member)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 p-3 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          <QrCode size={14} />
          <span>QR Code Plate</span>
        </button>
      </div>
    </div>
  );
}
