"use client";

import React from "react";
import Image from "next/image";
import { Member } from "@/lib/services/member";
import { QRCodeSVG } from "qrcode.react";

interface PaymentCodePrintViewProps {
  members: Member[];
  printMode: "cards" | "plates" | null;
}

export default function PaymentCodePrintView({
  members,
  printMode,
}: PaymentCodePrintViewProps) {
  if (!printMode) return null;

  // Chunk array into groups of N
  const chunk = <T,>(arr: T[], size: number): T[][] => {
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size));
    }
    return res;
  };

  // For plates: exactly 4 per A4 page (2x2 grid)
  const platePages = chunk(members, 4);

  // For cards: 2 or 4 per page
  const cardPages = chunk(members, 4);

  return (
    <div className="hidden print:block print:w-full print:m-0 print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide all application layout elements */
          body > *:not(#print-root) {
            display: none !important;
          }
          #print-root {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
          }
          .a4-page-grid-4 {
            page-break-after: always;
            break-after: page;
            height: 275mm;
            max-height: 275mm;
            width: 100%;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 8mm;
            box-sizing: border-box;
            padding: 4mm;
            overflow: hidden;
          }
          .a4-page-grid-4:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>

      <div id="print-root">
        {printMode === "plates" ? (
          /* Render QR Plates: 4 PER A4 PAGE in a 2x2 grid */
          platePages.map((pageMembers, pageIdx) => (
            <div key={`plate-page-${pageIdx}`} className="a4-page-grid-4">
              {pageMembers.map((member, idx) => {
                const wallet = Array.isArray(member.wallet)
                  ? member.wallet[0]
                  : Array.isArray((member as any).wallets)
                  ? (member as any).wallets[0]
                  : (member.wallet || (member as any).wallets);
                const accountNo = wallet?.accountNo || wallet?.accountNumber || member.phone || "6119039150";
                const memberName = (member.businessName || member.fullname || wallet?.accountName || "AMAC Taxpayer").toUpperCase();
                const identifier = member.phone || member.email || member.uid || "";
                const checkoutUrl = `http://localhost:3000/payment/${encodeURIComponent(identifier)}/checkout`;

                return (
                  <div
                    key={`plate-${member.uid || idx}`}
                    className="w-full h-full flex items-center justify-center p-2"
                  >
                    <div
                      className="w-full h-full max-w-[340px] max-h-[125mm] rounded-[22px] overflow-hidden p-4 flex flex-col items-center justify-between text-white shadow-none"
                      style={{
                        background: "linear-gradient(145deg, #072e1d 0%, #0e4e32 45%, #083321 100%)",
                        border: "1px solid #064e3b",
                      }}
                    >
                      {/* Header */}
                      <div className="flex flex-col items-center text-center">
                        <div 
                          className="relative w-9 h-9 mb-1 p-0.5 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.12)",
                            border: "1px solid rgba(255, 255, 255, 0.25)",
                          }}
                        >
                          <Image
                            src="/icon.png"
                            alt="AMAC Official Seal"
                            width={28}
                            height={28}
                            className="object-contain"
                          />
                        </div>
                        <h3 className="font-bold text-xs tracking-wide text-white">
                          Abuja Municipal Area Council (AMAC)
                        </h3>
                        <p 
                          className="text-[8px] uppercase tracking-widest font-semibold"
                          style={{ color: "#8FE0B4" }}
                        >
                          Unified Automated Revenue Service
                        </p>
                      </div>

                      {/* Member & Account Chip */}
                      <div className="text-center px-1 max-w-full my-0.5">
                        <h4 className="font-black text-xs md:text-sm text-white tracking-wide truncate">
                          {memberName}
                        </h4>
                        <div 
                          className="mt-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.18)",
                            border: "1px solid rgba(255, 255, 255, 0.3)",
                          }}
                        >
                          <span className="text-[9px] uppercase font-semibold" style={{ color: "#a7f3d0" }}>Acct:</span>
                          <span className="text-[11px] font-mono font-black tracking-wider" style={{ color: "#8FE0B4" }}>
                            {accountNo}
                          </span>
                        </div>
                      </div>

                      {/* White QR Box */}
                      <div 
                        className="my-0.5 p-2 rounded-xl shadow-xs flex items-center justify-center"
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid rgba(52, 211, 153, 0.4)",
                        }}
                      >
                        <QRCodeSVG
                          value={checkoutUrl}
                          size={110}
                          level="H"
                          includeMargin={false}
                        />
                      </div>

                      {/* Bottom instructions */}
                      <div className="text-center">
                        <p className="text-[9px] font-extrabold text-white tracking-wider uppercase">
                          SCAN TO PAY WITH BANK APP / CARD
                        </p>
                        <p 
                          className="text-[7.5px] font-medium"
                          style={{ color: "rgba(167, 243, 208, 0.85)" }}
                        >
                          Instant Council Verification • Real-time Receipt
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          /* Render Payment Cards: 4 per page or 2 per page */
          cardPages.map((pageMembers, pageIdx) => (
            <div key={`card-page-${pageIdx}`} className="a4-page-grid-4">
              {pageMembers.map((member, idx) => {
                const wallet = Array.isArray(member.wallet)
                  ? member.wallet[0]
                  : Array.isArray((member as any).wallets)
                  ? (member as any).wallets[0]
                  : (member.wallet || (member as any).wallets);
                const bankName = wallet?.bank?.name || wallet?.bank?.bankName || wallet?.bankName || "AMAC Unified / Kuda MFB";
                const accountNo = wallet?.accountNo || wallet?.accountNumber || member.phone || "6119039150";
                const accountName = (member.businessName || member.fullname || wallet?.accountName || "AMAC TAXPAYER").toUpperCase();

                return (
                  <div
                    key={`card-${member.uid || idx}`}
                    className="w-full h-full flex items-center justify-center p-2"
                  >
                    <div
                      className="w-full h-full max-w-[340px] max-h-[125mm] rounded-[20px] overflow-hidden p-3.5 flex flex-col justify-between text-white"
                      style={{
                        background: "linear-gradient(145deg, #02945a 0%, #03a866 50%, #01804c 100%)",
                        border: "1px solid #065f46",
                      }}
                    >
                      {/* Top Header Row with Logo */}
                      <div className="flex items-start justify-between w-full">
                        <div>
                          <span 
                            className="text-[9px] font-semibold uppercase tracking-wider block"
                            style={{ color: "rgba(209, 250, 229, 0.95)" }}
                          >
                            Abuja Municipal Area Council
                          </span>
                          <span 
                            className="text-[8px] font-mono"
                            style={{ color: "rgba(167, 243, 208, 0.85)" }}
                          >
                            UID: {member.uid || "N/A"}
                          </span>
                        </div>
                        <div 
                          className="rounded-full py-0.5 px-2.5 flex items-center gap-1 shadow-xs"
                          style={{ backgroundColor: "#ffffff" }}
                        >
                          <div className="relative w-4 h-4">
                            <Image
                              src="/icon.png"
                              alt="AMAC Logo"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span className="font-bold text-[10px]" style={{ color: "#065f46" }}>AMAC Pay</span>
                        </div>
                      </div>

                      {/* Center Title */}
                      <div className="text-center my-0.5">
                        <h2 className="text-sm font-black tracking-tight leading-tight text-white">
                          PAY WITH BANK TRANSFER
                        </h2>
                        <p 
                          className="text-[8px] font-bold tracking-widest uppercase"
                          style={{ color: "#d1fae5" }}
                        >
                          ALL BANKS ACCEPTED
                        </p>
                      </div>

                      {/* 3 Boxes */}
                      <div className="space-y-2 my-0.5">
                        {/* Recipient Bank */}
                        <div className="relative pt-1.5">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                            <span 
                              className="inline-block text-white text-[8px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: "#582be8" }}
                            >
                              Recipient Bank
                            </span>
                          </div>
                          <div 
                            className="rounded-[12px] px-2 py-1.5 flex items-center justify-center gap-1.5 shadow-xs text-center"
                            style={{ backgroundColor: "#ffffff" }}
                          >
                            <span className="font-extrabold text-xs tracking-tight truncate" style={{ color: "#1e1b4b" }}>
                              {bankName}
                            </span>
                          </div>
                        </div>

                        {/* Account Number */}
                        <div className="relative pt-1.5">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                            <span 
                              className="inline-block text-white text-[8px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: "#582be8" }}
                            >
                              Account Number
                            </span>
                          </div>
                          <div 
                            className="rounded-[12px] px-2 py-1.5 flex items-center justify-center shadow-xs"
                            style={{ backgroundColor: "#ffffff" }}
                          >
                            <span className="font-black text-lg md:text-xl tracking-widest font-mono" style={{ color: "#1e1b4b" }}>
                              {accountNo}
                            </span>
                          </div>
                        </div>

                        {/* Account Name */}
                        <div className="relative pt-1.5">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                            <span 
                              className="inline-block text-white text-[8px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: "#582be8" }}
                            >
                              Account Name
                            </span>
                          </div>
                          <div 
                            className="rounded-[12px] px-2 py-1.5 flex items-center justify-center shadow-xs text-center"
                            style={{ backgroundColor: "#ffffff" }}
                          >
                            <span className="font-black text-[10px] md:text-xs tracking-wide truncate max-w-[240px]" style={{ color: "#1e1b4b" }}>
                              {accountName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-0.5">
                        <div 
                          className="rounded-full py-0.5 px-2 flex items-center justify-center gap-1.5 shadow-xs mb-0.5"
                          style={{ backgroundColor: "#ffffff" }}
                        >
                          <span className="font-semibold text-[8px]" style={{ color: "#1e1b4b" }}>
                            Download AMAC Revenue App
                          </span>
                        </div>
                        <div 
                          className="flex items-center justify-center gap-1.5 text-[7px] font-medium"
                          style={{ color: "#d1fae5" }}
                        >
                          <span>Licensed by CBN</span>
                          <span>•</span>
                          <span>Insured by NDIC</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
