"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { X, Download, Loader2, QrCode } from "lucide-react";
import { Member } from "@/lib/services/member";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas-pro";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

export function QRCodePlate({
  member,
  innerRef,
  className = "",
}: {
  member: Member;
  innerRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}) {
  const wallet = Array.isArray(member.wallet)
    ? member.wallet[0]
    : Array.isArray((member as any).wallets)
    ? (member as any).wallets[0]
    : (member.wallet || (member as any).wallets);

  const accountNo =
    wallet?.accountNo || wallet?.accountNumber || member.phone || "6119039150";
  const memberName = (
    wallet?.accountName ||
    member.businessName ||
    member.fullname ||
    "AMAC Taxpayer"
  ).toUpperCase();

  // QR Checkout Link: http://localhost:3000/payment/(phonenumber or email)/checkout
  const identifier = member.phone || member.email || member.uid || "";
  const host =
    (typeof window !== "undefined" && window.location.origin) ||
    process.env.NEXT_PUBLIC_HOST ||
    "http://localhost:3000";
  const checkoutUrl = `${host}/payment/${encodeURIComponent(identifier)}/checkout`;

  return (
    <div
      ref={innerRef}
      className={`relative aspect-square w-full max-w-95 rounded-[28px] overflow-hidden p-6 flex flex-col items-center justify-between text-white select-none shadow-2xl ${className}`}
      style={{
        background:
          "linear-gradient(145deg, #072e1d 0%, #0e4e32 45%, #083321 100%)",
      }}
    >
      {/* Decorative background glow circles like (main) showcase */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(74,222,128,0.25),transparent_70%)]" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(27,158,90,0.3),transparent_70%)]" />

      {/* Top Header: AMAC Logo & Full Name */}
      <div className="relative z-10 flex items-center gap-2 text-left">
        <div 
          className="relative w-10 h-10 mb-1.5 p-1 rounded-sm flex items-center justify-center"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
          }}
        >
          <Image
            src="/icon.png"
            alt="AMAC Official Seal"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
        <div>
          <h3 className="font-bold text-[12px] tracking-wide text-white">
            Abuja Municipal Area Council (AMAC)
          </h3>
          <p 
            className="text-[10px] uppercase tracking-widest font-semibold mt-0.5"
            style={{ color: "#8FE0B4" }}
          >
            Unified Automated Revenue Service
          </p>
        </div>
      </div>

      {/* Member Name */}
      <div className="relative z-10 text-center px-2 my-1 max-w-full">
        <h4 className="font-extrabold text-base text-white tracking-wide truncate">
          {memberName}
        </h4>
        {/* Chip with Member Account Number */}
        <div 
          className="mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.18)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          <span className="text-[10px] uppercase font-semibold" style={{ color: "#a7f3d0" }}>
            Account:
          </span>
          <span className="text-xs font-mono font-black tracking-wider" style={{ color: "#8FE0B4" }}>
            {accountNo} / {wallet?.bank?.name || wallet?.bankName || "AMAC Unified Bank / Kuda MFB"}
          </span>
        </div>
      </div>

      {/* White Box for QR Code */}
      <div 
        className="relative z-10 my-1 p-3.5 rounded-2xl shadow-xl flex items-center justify-center"
        style={{
          backgroundColor: "#ffffff",
          border: "2px solid rgba(52, 211, 153, 0.4)",
        }}
      >
        <QRCodeSVG
          value={checkoutUrl}
          size={160}
          level="H"
          includeMargin={false}
        />
      </div>

      {/* Bottom instructions */}
      <div className="relative z-10 text-center">
        <p className="text-[11px] font-extrabold text-white tracking-wider uppercase">
          SCAN TO PAY WITH BANK APP / CARD
        </p>
        <p 
          className="text-[9px] mt-0.5 font-medium"
          style={{ color: "rgba(167, 243, 208, 0.85)" }}
        >
          Instant Council Verification • Real-time Receipt
        </p>
      </div>
    </div>
  );
}

export default function QRCodeModal({
  isOpen,
  onClose,
  member,
}: QRCodeModalProps) {
  const plateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !member) return null;

  const handleDownload = async () => {
    if (!plateRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(plateRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement("a");
      const safeName = (
        member.businessName ||
        member.fullname ||
        "taxpayer"
      ).replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `AMAC_Payment_Plate_${safeName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err: any) {
      console.error("Failed to download QR code plate:", err);
      alert(`Download error: ${err?.message || "Failed to export QR code plate"}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Payment QR Plate
              </h3>
              <p className="text-xs text-slate-500">
                Official Municipal Direct Payment Code
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* The Square Green Showcase Plate */}
        <div className="w-full flex justify-center py-2">
          <QRCodePlate member={member} innerRef={plateRef} />
        </div>

        {/* Modal Actions */}
        <div className="w-full flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {downloading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Download Plate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
