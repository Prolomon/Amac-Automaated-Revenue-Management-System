import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

/* ------------------------------------------------------------------ *
 *  Palette matching root Demand_Notice_2026-09-08.pdf & admin page   *
 * ------------------------------------------------------------------ */
const darkSlate = rgb(15 / 255, 23 / 255, 42 / 255);      // #0f172a
const darkBody = rgb(30 / 255, 41 / 255, 59 / 255);       // #1e293b
const mutedSlate = rgb(100 / 255, 116 / 255, 139 / 255);  // #64748b
const borderGray = rgb(226 / 255, 232 / 255, 240 / 255);  // #e2e8f0
const brandGreen = rgb(0 / 255, 153 / 255, 102 / 255);    // #009966 (emerald-600)
const mintBg = rgb(240 / 255, 255 / 255, 249 / 255);      // #f0fff9
const tableHeadBg = rgb(241 / 255, 245 / 255, 249 / 255); // #f1f5f9
const rowAltBg = rgb(248 / 255, 250 / 255, 252 / 255);    // #f8fafc
const skyBlue = rgb(56 / 255, 189 / 255, 248 / 255);      // #38bdf8
const amberBg = rgb(255 / 255, 251 / 255, 235 / 255);     // #fffbeb
const amberBorder = rgb(253 / 255, 224 / 255, 71 / 255);  // #fde047
const amberText = rgb(180 / 255, 83 / 255, 9 / 255);      // #b45309
const white = rgb(1, 1, 1);

/* ------------------------------------------------------------------ *
 *  Date & String Formatters                                          *
 * ------------------------------------------------------------------ */
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
};

const resolveLocationString = (location) => {
  if (!location) return "Abuja Municipal, FCT, Nigeria";
  if (typeof location === "string") {
    try {
      const parsed = JSON.parse(location);
      const parts = [parsed.address, parsed.city, parsed.state, parsed.lga, parsed.country].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : location;
    } catch {
      return location;
    }
  }
  if (typeof location === "object") {
    const parts = [location.address, location.city, location.state, location.lga, location.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Abuja Municipal, FCT, Nigeria";
  }
  return String(location);
};

/* ------------------------------------------------------------------ *
 *  Vector Naira Symbol + Number Drawer                               *
 *  Draws standard Helvetica 'N' with double crossbars & amounts      *
 * ------------------------------------------------------------------ */
const drawNairaAmount = (page, {
  amount,
  rightX,
  y,
  size = 8,
  font,
  color = darkBody,
  strikeColor = null,
}) => {
  const num = Number(amount || 0);
  const formattedNumber = num.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const nWidth = font.widthOfTextAtSize("N", size);
  const numWidth = font.widthOfTextAtSize(formattedNumber, size);
  const totalWidth = nWidth + numWidth;
  const startX = rightX - totalWidth;

  // Draw 'N'
  page.drawText("N", {
    x: startX,
    y,
    size,
    font,
    color,
  });

  // Crossbars across 'N'
  const lineCol = strikeColor || color;
  const lineThickness = Math.max(0.6, size * 0.07);
  const linePad = size * 0.04;
  const bar1Y = y + size * 0.38;
  const bar2Y = y + size * 0.54;

  page.drawLine({
    start: { x: startX - linePad, y: bar1Y },
    end: { x: startX + nWidth + linePad, y: bar1Y },
    thickness: lineThickness,
    color: lineCol,
  });

  page.drawLine({
    start: { x: startX - linePad, y: bar2Y },
    end: { x: startX + nWidth + linePad, y: bar2Y },
    thickness: lineThickness,
    color: lineCol,
  });

  // Draw formatted numbers
  page.drawText(formattedNumber, {
    x: startX + nWidth,
    y,
    size,
    font,
    color,
  });
};

/* ------------------------------------------------------------------ *
 *  Vector Icon Helpers (Crisp at any resolution / zoom)               *
 * ------------------------------------------------------------------ */
const drawLandmarkIcon = (page, x, y, size = 11, color = mutedSlate) => {
  page.drawLine({ start: { x, y: y + 8 }, end: { x: x + size / 2, y: y + 11 }, thickness: 1, color });
  page.drawLine({ start: { x: x + size / 2, y: y + 11 }, end: { x: x + size, y: y + 8 }, thickness: 1, color });
  page.drawLine({ start: { x, y: y + 8 }, end: { x: x + size, y: y + 8 }, thickness: 1, color });
  page.drawLine({ start: { x: x + 2, y: y + 2 }, end: { x: x + 2, y: y + 7 }, thickness: 1, color });
  page.drawLine({ start: { x: x + size / 2, y: y + 2 }, end: { x: x + size / 2, y: y + 7 }, thickness: 1, color });
  page.drawLine({ start: { x: x + size - 2, y: y + 2 }, end: { x: x + size - 2, y: y + 7 }, thickness: 1, color });
  page.drawLine({ start: { x: x - 1, y: y + 1.5 }, end: { x: x + size + 1, y: y + 1.5 }, thickness: 1.2, color });
};

const drawGlobeIcon = (page, x, y, size = 10, color = mutedSlate) => {
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;
  page.drawCircle({ x: cx, y: cy, size: r, borderColor: color, borderWidth: 1, color: undefined });
  page.drawLine({ start: { x: cx - r, y: cy }, end: { x: cx + r, y: cy }, thickness: 0.8, color });
  page.drawLine({ start: { x: cx, y: cy - r }, end: { x: cx, y: cy + r }, thickness: 0.8, color });
};

const drawPhoneIcon = (page, x, y, color = mutedSlate) => {
  page.drawRectangle({ x, y: y + 1, width: 7, height: 9, borderColor: color, borderWidth: 0.8 });
  page.drawLine({ start: { x: x + 2, y: y + 8 }, end: { x: x + 5, y: y + 8 }, thickness: 0.8, color });
  page.drawCircle({ x: x + 3.5, y: y + 2.5, size: 0.8, color });
};

const drawMailIcon = (page, x, y, color = mutedSlate) => {
  page.drawRectangle({ x, y: y + 1, width: 10, height: 7, borderColor: color, borderWidth: 0.8 });
  page.drawLine({ start: { x: x + 1, y: y + 7 }, end: { x: x + 5, y: y + 4 }, thickness: 0.8, color });
  page.drawLine({ start: { x: x + 5, y: y + 4 }, end: { x: x + 9, y: y + 7 }, thickness: 0.8, color });
};

const drawPinIcon = (page, x, y, color = mutedSlate) => {
  page.drawCircle({ x: x + 4, y: y + 6, size: 2.5, borderColor: color, borderWidth: 0.8 });
  page.drawLine({ start: { x: x + 4, y: y + 3.5 }, end: { x: x + 4, y: y + 1 }, thickness: 0.8, color });
};

const drawShieldIcon = (page, x, y, color = brandGreen) => {
  page.drawLine({ start: { x, y: y + 8 }, end: { x: x + 4, y: y + 10 }, thickness: 1, color });
  page.drawLine({ start: { x: x + 4, y: y + 10 }, end: { x: x + 8, y: y + 8 }, thickness: 1, color });
  page.drawLine({ start: { x: x + 8, y: y + 8 }, end: { x: x + 7, y: y + 3 }, thickness: 1, color });
  page.drawLine({ start: { x: x + 7, y: y + 3 }, end: { x: x + 4, y }, thickness: 1, color });
  page.drawLine({ start: { x: x + 4, y }, end: { x: x + 1, y: y + 3 }, thickness: 1, color });
  page.drawLine({ start: { x: x + 1, y: y + 3 }, end: { x, y: y + 8 }, thickness: 1, color });
};

/* ------------------------------------------------------------------ *
 *  Image Loaders: AMAC Logo & Dynamic QR Code                        *
 * ------------------------------------------------------------------ */
const loadAmacLogo = async (pdfDoc) => {
  const possiblePaths = [
    path.resolve(process.cwd(), "admin/public/icon.png"),
    path.resolve(process.cwd(), "../admin/public/icon.png"),
    "/home/proloon/Desktop/Amac/admin/public/icon.png",
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const bytes = fs.readFileSync(p);
        return await pdfDoc.embedPng(bytes);
      }
    } catch {}
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch("https://res.cloudinary.com/dwq2uwkk2/image/upload/v1784073682/icon_agowv7.png", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      return await pdfDoc.embedPng(buffer);
    }
  } catch {}

  return null;
};

const loadQrCodeImage = async (pdfDoc, qrData) => {
  const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=240`;

  // 1. Fetch from QuickChart (exact same mechanism as admin demand page)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(qrCodeUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const bytes = Buffer.from(await res.arrayBuffer());
      return await pdfDoc.embedPng(bytes);
    }
  } catch (e) {
    console.warn("[demandPdf] QuickChart QR fetch failed, trying local fallback:", e?.message);
  }

  // 2. Local fallback if qrcode package is accessible in workspace
  try {
    const possiblePaths = [
      "qrcode",
      "/home/proloon/Desktop/Amac/agent/node_modules/qrcode/lib/index.js",
    ];
    for (const p of possiblePaths) {
      try {
        const qrMod = (await import(p)).default || (await import(p));
        if (qrMod && typeof qrMod.toBuffer === "function") {
          const qrPngBuffer = await qrMod.toBuffer(qrData, {
            type: "png",
            width: 240,
            margin: 1,
          });
          return await pdfDoc.embedPng(qrPngBuffer);
        }
      } catch {}
    }
  } catch (e) {
    console.warn("[demandPdf] Local qrcode generation failed:", e?.message);
  }

  return null;
};

/* ------------------------------------------------------------------ *
 *  Main Demand Notice PDF Generator (Pure pdf-lib, Single A4 Page)   *
 * ------------------------------------------------------------------ */
export const createDemandNoticePdf = async ({ demand, member = {}, payment = {}, wallet = {}, pricing = {} }) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 (Points)
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Financial calculations matching admin demands/[id]/page.tsx
  const pricingName = demand?.payment?.pricing?.title || pricing?.title || "Revenue Assessment";
  const principal = Number(
    demand?.amount ?? Math.max(0, Number(demand?.payment?.amount || payment?.amount || 0) - Number(demand?.payment?.paid || payment?.paid || 0))
  );
  const vat = principal * 0.075;
  const discount = Number(demand?.discount || demand?.payment?.discount || pricing?.discount || 0);
  const charges = principal * 0.015;
  const subtotal = principal + vat + charges;

  const rawDueDate = demand?.payment?.due || payment?.due || demand?.payment?.createdAt || payment?.createdAt || demand?.createdAt;
  const paymentDate = rawDueDate ? new Date(rawDueDate) : null;
  const currentDate = new Date();

  let daysOverdue = 0;
  let penalty = 0;
  const isSettled = String(demand?.status).toUpperCase() === "PAID" || (payment?.paid && payment?.paid >= payment?.amount);
  if (!isSettled && paymentDate && !isNaN(paymentDate.getTime()) && currentDate > paymentDate) {
    const diffTime = currentDate.getTime() - paymentDate.getTime();
    daysOverdue = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const penaltyRatePerDay = 0.00005;
    penalty = subtotal * penaltyRatePerDay * daysOverdue;
  }
  const totalAmount = subtotal + penalty;

  // Key Identifiers
  const resolvedMember = member || demand?.member || payment?.member || {};
  const memberName = String(resolvedMember.businessName || resolvedMember.fullname || "Valued Taxpayer");
  const locationStr = resolveLocationString(resolvedMember.location);
  const memberId = String(resolvedMember.uid || resolvedMember.id || demand?.userId || "N/A");
  const paymentRef = String(demand?.payment?.reference || payment?.reference || demand?.reference || "N/A");
  const demandRef = String(demand?.reference || paymentRef);

  // Wallet resolution
  const resolvedWallet = wallet || demand?.wallet || {};
  let walletBankName = "Nombank MFB";
  if (resolvedWallet?.bank) {
    if (typeof resolvedWallet.bank === "object" && resolvedWallet.bank.name) {
      walletBankName = resolvedWallet.bank.name;
    } else if (typeof resolvedWallet.bank === "string" && resolvedWallet.bank.trim()) {
      walletBankName = resolvedWallet.bank.trim();
    }
  }
  const walletAccountNo = String(resolvedWallet?.accountNo || "8661548682");
  const walletAccountName = String(resolvedWallet?.accountName || `TR3-G/${memberName}`);

  // QR Code URL (exact admin URL pattern)
  const qrData = `https://urms.afriverge.com/payment/${paymentRef}/checkout`;

  // Asynchronously load assets concurrently
  const [logoImage, qrImage] = await Promise.all([
    loadAmacLogo(pdfDoc),
    loadQrCodeImage(pdfDoc, qrData),
  ]);

  // Layout Dimensions
  const margin = 28;
  const contentWidth = width - margin * 2; // 539.28 pt
  const rightEdge = margin + contentWidth; // 567.28 pt
  let y = height - margin - 6;

  /* ================= 1. HEADER SECTION ================= */
  if (logoImage) {
    page.drawImage(logoImage, {
      x: margin,
      y: y - 32,
      width: 32,
      height: 32,
    });
  } else {
    page.drawRectangle({
      x: margin,
      y: y - 32,
      width: 32,
      height: 32,
      color: brandGreen,
    });
    page.drawText("AMAC", {
      x: margin + 3,
      y: y - 22,
      size: 9,
      font: fontBold,
      color: white,
    });
  }

  page.drawText("AMAC", {
    x: margin + 38,
    y: y - 10,
    size: 21,
    font: fontBold,
    color: darkSlate,
  });
  page.drawText("AMAC REVENUE MANAGEMENT SYSTEM", {
    x: margin + 38,
    y: y - 22,
    size: 8,
    font: fontBold,
    color: brandGreen,
  });
  page.drawText("Automated Revenue & Compliance Framework", {
    x: margin + 38,
    y: y - 33,
    size: 7.5,
    font: fontRegular,
    color: mutedSlate,
  });

  // Right-aligned council information
  const drawHeaderRight = (text, yPos, font, size, color) => {
    const textW = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: rightEdge - textW, y: yPos, size, font, color });
  };

  drawHeaderRight("FCT Revenue Administration", y - 10, fontBold, 10, darkSlate);
  drawHeaderRight("Revenue & Tax Solutions Division", y - 21, fontRegular, 7.5, mutedSlate);
  drawHeaderRight("Abuja Municipal Area Council Secretariat, Abuja", y - 30, fontRegular, 7.5, mutedSlate);
  drawHeaderRight("Email: info@amac-revenue.ng", y - 39, fontRegular, 7.5, mutedSlate);
  drawHeaderRight("Website: www.amac-revenue.ng", y - 48, fontRegular, 7.5, mutedSlate);

  y -= 56;
  page.drawLine({
    start: { x: margin, y },
    end: { x: rightEdge, y },
    thickness: 1,
    color: borderGray,
  });

  /* ================= 2. DEMAND NOTICE BANNER ================= */
  y -= 14;
  const bannerHeight = 24;
  page.drawRectangle({
    x: margin,
    y: y - bannerHeight,
    width: contentWidth,
    height: bannerHeight,
    color: mintBg,
  });
  page.drawRectangle({
    x: margin,
    y: y - bannerHeight,
    width: 4,
    height: bannerHeight,
    color: brandGreen,
  });
  page.drawText("DEMAND NOTICE", {
    x: margin + 14,
    y: y - 16,
    size: 12,
    font: fontBold,
    color: darkSlate,
  });

  y -= bannerHeight + 14;

  /* ================= 3. TAXPAYER & METADATA DASHBOARD ================= */
  const colGap = 16;
  const leftColW = 340;
  const rightColW = contentWidth - leftColW - colGap; // 183.28 pt
  const rightColX = margin + leftColW + colGap;

  // Left: Taxpayer details
  page.drawText("TAXPAYER / ENTITY DETAILS", {
    x: margin,
    y,
    size: 7.5,
    font: fontBold,
    color: mutedSlate,
  });

  page.drawText(memberName, {
    x: margin,
    y: y - 13,
    size: 10.5,
    font: fontBold,
    color: darkSlate,
  });

  // Shorten location if necessary to fit on line
  let displayLocation = locationStr;
  if (fontRegular.widthOfTextAtSize(displayLocation, 8) > leftColW - 10) {
    while (displayLocation.length > 10 && fontRegular.widthOfTextAtSize(displayLocation + "...", 8) > leftColW - 10) {
      displayLocation = displayLocation.slice(0, -5).trim();
    }
    displayLocation += "...";
  }

  page.drawText(displayLocation, {
    x: margin,
    y: y - 25,
    size: 8,
    font: fontRegular,
    color: darkBody,
  });

  page.drawText("MEMBER ID: ", {
    x: margin,
    y: y - 38,
    size: 8,
    font: fontBold,
    color: darkSlate,
  });
  page.drawText(memberId, {
    x: margin + fontBold.widthOfTextAtSize("MEMBER ID: ", 8),
    y: y - 38,
    size: 8,
    font: fontRegular,
    color: darkBody,
  });

  // Right: Notice System Metadata
  page.drawText("NOTICE SYSTEM METADATA", {
    x: rightColX,
    y,
    size: 7.5,
    font: fontBold,
    color: mutedSlate,
  });

  const drawMetaRow = (label, value, rowY) => {
    page.drawText(label, {
      x: rightColX,
      y: rowY,
      size: 7.5,
      font: fontRegular,
      color: mutedSlate,
    });
    const valW = fontBold.widthOfTextAtSize(value, 7.5);
    page.drawText(value, {
      x: rightEdge - valW,
      y: rowY,
      size: 7.5,
      font: fontBold,
      color: darkSlate,
    });
    page.drawLine({
      start: { x: rightColX, y: rowY - 3 },
      end: { x: rightEdge, y: rowY - 3 },
      thickness: 0.5,
      color: borderGray,
      dashArray: [2, 2],
    });
  };

  drawMetaRow("Reference No:", `AMAC/DN/${demandRef}`, y - 13);
  drawMetaRow("Date of Issue:", formatDate(demand?.createdAt), y - 25);
  drawMetaRow("Assessment Period:", formatDate(rawDueDate), y - 37);

  y -= 52;

  /* ================= 4. MAIN TWO-COLUMN BODY ================= */
  let yLeft = y;
  let yRight = y;

  /* ----- LEFT COLUMN: LIABILITY BREAKDOWN ----- */
  page.drawText("LIABILITY BREAKDOWN", {
    x: margin,
    y: yLeft,
    size: 7.5,
    font: fontBold,
    color: mutedSlate,
  });
  yLeft -= 10;

  // Table header
  const tableHeadHeight = 18;
  page.drawRectangle({
    x: margin,
    y: yLeft - tableHeadHeight,
    width: leftColW,
    height: tableHeadHeight,
    color: tableHeadBg,
  });
  page.drawLine({
    start: { x: margin, y: yLeft - tableHeadHeight },
    end: { x: margin + leftColW, y: yLeft - tableHeadHeight },
    thickness: 1,
    color: borderGray,
  });
  page.drawText("REVENUE COMPONENT DESCRIPTION", {
    x: margin + 8,
    y: yLeft - 12,
    size: 7,
    font: fontBold,
    color: mutedSlate,
  });
  const amtHeader = "AMOUNT (N)";
  const amtHeaderW = fontBold.widthOfTextAtSize(amtHeader, 7);
  page.drawText(amtHeader, {
    x: margin + leftColW - 8 - amtHeaderW,
    y: yLeft - 12,
    size: 7,
    font: fontBold,
    color: mutedSlate,
  });
  yLeft -= tableHeadHeight;

  // Table Rows
  const tableRows = [
    {
      label: `${pricingName} - Principal Assessment`,
      amount: principal,
      isBold: false,
    },
    {
      label: "Value Added Tax (VAT) @ 7.5%",
      amount: vat,
      isBold: false,
    },
    {
      label: "Discount Approvied",
      amount: discount,
      isBold: false,
    },
    {
      label: "Payment Processing Charges @ 1.5%",
      amount: charges,
      isBold: false,
    },
    {
      label: "Subtotal (Principal + VAT + Charges)",
      amount: subtotal,
      isBold: true,
      bg: rowAltBg,
    },
    {
      label: "Penalty Accrued Over Time",
      amount: penalty,
      isBold: false,
    },
  ];

  const rowHeight = 17;
  for (const r of tableRows) {
    if (r.bg) {
      page.drawRectangle({
        x: margin,
        y: yLeft - rowHeight,
        width: leftColW,
        height: rowHeight,
        color: r.bg,
      });
    }

    page.drawText(r.label, {
      x: margin + 8,
      y: yLeft - 12,
      size: 7.5,
      font: r.isBold ? fontBold : fontRegular,
      color: r.isBold ? darkSlate : darkBody,
    });

    drawNairaAmount(page, {
      amount: r.amount,
      rightX: margin + leftColW - 8,
      y: yLeft - 12,
      size: 7.5,
      font: r.isBold ? fontBold : fontRegular,
      color: r.isBold ? darkSlate : darkBody,
    });

    page.drawLine({
      start: { x: margin, y: yLeft - rowHeight },
      end: { x: margin + leftColW, y: yLeft - rowHeight },
      thickness: 0.5,
      color: borderGray,
    });

    yLeft -= rowHeight;
  }

  // Total Compliance Bar
  const totalBarHeight = 24;
  page.drawRectangle({
    x: margin,
    y: yLeft - totalBarHeight,
    width: leftColW,
    height: totalBarHeight,
    color: darkSlate,
  });

  page.drawText("TOTAL COMPLIANCE AMOUNT PAYABLE", {
    x: margin + 8,
    y: yLeft - 16,
    size: 8,
    font: fontBold,
    color: white,
  });

  drawNairaAmount(page, {
    amount: totalAmount,
    rightX: margin + leftColW - 8,
    y: yLeft - 16,
    size: 10.5,
    font: fontBold,
    color: skyBlue,
    strikeColor: skyBlue,
  });

  yLeft -= totalBarHeight + 6;

  page.drawText(
    "* Penalty charges continue to accumulate iteratively daily until the exact financial settlement position registers as zero.",
    {
      x: margin,
      y: yLeft - 2,
      size: 6.8,
      font: fontItalic,
      color: mutedSlate,
    }
  );

  yLeft -= 16;

  /* ----- LEFT COLUMN: OTHER PAYMENT OPTIONS CARD ----- */
  const payCardHeight = 124;
  page.drawRectangle({
    x: margin,
    y: yLeft - payCardHeight,
    width: leftColW,
    height: payCardHeight,
    color: white,
    borderColor: borderGray,
    borderWidth: 1,
  });

  page.drawText("OTHER PAYMENT OPTIONS", {
    x: margin + 10,
    y: yLeft - 13,
    size: 8,
    font: fontBold,
    color: darkSlate,
  });

  // 1. Settlement Account
  drawLandmarkIcon(page, margin + 10, yLeft - 28, 11, mutedSlate);
  page.drawText("Settlement Account", {
    x: margin + 26,
    y: yLeft - 28,
    size: 8,
    font: fontBold,
    color: darkBody,
  });
  page.drawText("Account Number: 1310770007", {
    x: margin + 130,
    y: yLeft - 28,
    size: 7.5,
    font: fontRegular,
    color: darkBody,
  });
  page.drawText("Bank Name: Zenith Bank", {
    x: margin + 130,
    y: yLeft - 38,
    size: 7.5,
    font: fontRegular,
    color: darkBody,
  });
  page.drawText("Account Name: AMAC Revenue Account", {
    x: margin + 130,
    y: yLeft - 48,
    size: 7.5,
    font: fontRegular,
    color: darkBody,
  });

  page.drawLine({
    start: { x: margin + 10, y: yLeft - 54 },
    end: { x: margin + leftColW - 10, y: yLeft - 54 },
    thickness: 0.5,
    color: borderGray,
  });

  // 2. Payment Account
  drawLandmarkIcon(page, margin + 10, yLeft - 66, 11, mutedSlate);
  page.drawText("Payment Account", {
    x: margin + 26,
    y: yLeft - 66,
    size: 8,
    font: fontBold,
    color: darkBody,
  });
  page.drawText(`Account Number: ${walletAccountNo}`, {
    x: margin + 130,
    y: yLeft - 66,
    size: 7.5,
    font: fontRegular,
    color: darkBody,
  });
  page.drawText(`Bank Name: ${walletBankName}`, {
    x: margin + 130,
    y: yLeft - 76,
    size: 7.5,
    font: fontRegular,
    color: darkBody,
  });
  page.drawText(`Account Name: ${walletAccountName}`, {
    x: margin + 130,
    y: yLeft - 86,
    size: 7.5,
    font: fontRegular,
    color: darkBody,
  });

  page.drawLine({
    start: { x: margin + 10, y: yLeft - 92 },
    end: { x: margin + leftColW - 10, y: yLeft - 92 },
    thickness: 0.5,
    color: borderGray,
  });

  // 3. Pay on Website
  drawGlobeIcon(page, margin + 10, yLeft - 106, 10, mutedSlate);
  page.drawText("Pay on Website", {
    x: margin + 26,
    y: yLeft - 105,
    size: 8,
    font: fontBold,
    color: darkBody,
  });
  page.drawText(paymentRef, {
    x: margin + 130,
    y: yLeft - 105,
    size: 8,
    font: fontBold,
    color: darkBody,
  });

  yLeft -= payCardHeight + 12;

  /* ----- LEFT COLUMN: SIGN-OFF BLOCK ----- */
  page.drawText("Regards,", {
    x: margin,
    y: yLeft,
    size: 8.5,
    font: fontBold,
    color: darkSlate,
  });
  page.drawLine({
    start: { x: margin, y: yLeft - 18 },
    end: { x: margin + 120, y: yLeft - 18 },
    thickness: 1,
    color: borderGray,
  });
  page.drawText("Adekunle Adeyanju", {
    x: margin,
    y: yLeft - 28,
    size: 8.5,
    font: fontBold,
    color: darkSlate,
  });
  page.drawText("Director of Audit & Compliance Division", {
    x: margin,
    y: yLeft - 37,
    size: 7.5,
    font: fontRegular,
    color: mutedSlate,
  });
  page.drawText("Amac Revenue Management System", {
    x: margin,
    y: yLeft - 46,
    size: 7.5,
    font: fontRegular,
    color: mutedSlate,
  });

  /* ----- RIGHT COLUMN: 1. SECURE WEB GATEWAY CARD ----- */
  const gwCardHeight = 178;
  page.drawRectangle({
    x: rightColX,
    y: yRight - gwCardHeight,
    width: rightColW,
    height: gwCardHeight,
    color: rowAltBg,
    borderColor: borderGray,
    borderWidth: 1,
  });

  const gwCenterX = rightColX + rightColW / 2;
  const gwTitle = "SECURE WEB GATEWAY";
  const gwTitleW = fontBold.widthOfTextAtSize(gwTitle, 9);
  page.drawText(gwTitle, {
    x: gwCenterX - gwTitleW / 2,
    y: yRight - 15,
    size: 9,
    font: fontBold,
    color: darkSlate,
  });

  const gwSub = "Scan to pay.";
  const gwSubW = fontRegular.widthOfTextAtSize(gwSub, 7.5);
  page.drawText(gwSub, {
    x: gwCenterX - gwSubW / 2,
    y: yRight - 26,
    size: 7.5,
    font: fontRegular,
    color: mutedSlate,
  });

  // QR Code Container Box
  const qrBoxSize = 96;
  const qrBoxX = gwCenterX - qrBoxSize / 2;
  const qrBoxY = yRight - 32 - qrBoxSize;
  page.drawRectangle({
    x: qrBoxX,
    y: qrBoxY,
    width: qrBoxSize,
    height: qrBoxSize,
    color: white,
    borderColor: borderGray,
    borderWidth: 1,
  });

  if (qrImage) {
    const qrPad = 4;
    page.drawImage(qrImage, {
      x: qrBoxX + qrPad,
      y: qrBoxY + qrPad,
      width: qrBoxSize - qrPad * 2,
      height: qrBoxSize - qrPad * 2,
    });
  } else {
    // Elegant fallback box with checkout link indicators
    page.drawText("QR CODE", {
      x: gwCenterX - fontBold.widthOfTextAtSize("QR CODE", 9) / 2,
      y: qrBoxY + qrBoxSize / 2 + 2,
      size: 9,
      font: fontBold,
      color: brandGreen,
    });
    page.drawText("Scan or visit URL", {
      x: gwCenterX - fontRegular.widthOfTextAtSize("Scan or visit URL", 6.5) / 2,
      y: qrBoxY + qrBoxSize / 2 - 10,
      size: 6.5,
      font: fontRegular,
      color: mutedSlate,
    });
  }

  const payRefLabel = "SYSTEM PAYMENT REFERENCE";
  const payRefLabelW = fontRegular.widthOfTextAtSize(payRefLabel, 7);
  page.drawText(payRefLabel, {
    x: gwCenterX - payRefLabelW / 2,
    y: yRight - 138,
    size: 7,
    font: fontRegular,
    color: mutedSlate,
  });

  // Green reference box
  const refTextW = fontBold.widthOfTextAtSize(paymentRef, 8);
  const refBoxW = Math.min(rightColW - 16, refTextW + 16);
  page.drawRectangle({
    x: gwCenterX - refBoxW / 2,
    y: yRight - 163,
    width: refBoxW,
    height: 18,
    color: white,
    borderColor: borderGray,
    borderWidth: 1,
  });
  page.drawText(paymentRef, {
    x: gwCenterX - refTextW / 2,
    y: yRight - 158,
    size: 8,
    font: fontBold,
    color: brandGreen,
  });

  yRight -= gwCardHeight + 8;

  /* ----- RIGHT COLUMN: 2. HELP DESK CARD ----- */
  const helpCardHeight = 68;
  page.drawRectangle({
    x: rightColX,
    y: yRight - helpCardHeight,
    width: rightColW,
    height: helpCardHeight,
    color: white,
    borderColor: borderGray,
    borderWidth: 1,
  });

  page.drawText("HELP DESK", {
    x: rightColX + 10,
    y: yRight - 14,
    size: 7.5,
    font: fontBold,
    color: darkSlate,
  });

  drawPhoneIcon(page, rightColX + 10, yRight - 28, mutedSlate);
  page.drawText("0700-REVENUE-AMAC", {
    x: rightColX + 24,
    y: yRight - 27,
    size: 7.2,
    font: fontRegular,
    color: darkBody,
  });

  drawMailIcon(page, rightColX + 10, yRight - 40, mutedSlate);
  page.drawText("info@amac-revenue.ng", {
    x: rightColX + 24,
    y: yRight - 39,
    size: 7.2,
    font: fontRegular,
    color: darkBody,
  });

  drawPinIcon(page, rightColX + 10, yRight - 55, mutedSlate);
  page.drawText("Abuja Municipal Area Council", {
    x: rightColX + 24,
    y: yRight - 52,
    size: 6.8,
    font: fontRegular,
    color: darkBody,
  });
  page.drawText("Secretariat, Abuja", {
    x: rightColX + 24,
    y: yRight - 60,
    size: 6.8,
    font: fontRegular,
    color: darkBody,
  });

  yRight -= helpCardHeight + 8;

  /* ----- RIGHT COLUMN: 3. SYSTEM NOTICE NOTE ----- */
  const alertCardHeight = 54;
  page.drawRectangle({
    x: rightColX,
    y: yRight - alertCardHeight,
    width: rightColW,
    height: alertCardHeight,
    color: amberBg,
    borderColor: amberBorder,
    borderWidth: 1,
  });

  // Circle with '!'
  page.drawCircle({
    x: rightColX + 15,
    y: yRight - 15,
    size: 5.5,
    color: amberText,
  });
  page.drawText("!", {
    x: rightColX + 13.8,
    y: yRight - 18,
    size: 7,
    font: fontBold,
    color: white,
  });

  page.drawText("SYSTEM NOTICE NOTE:", {
    x: rightColX + 26,
    y: yRight - 16,
    size: 7,
    font: fontBold,
    color: amberText,
  });

  page.drawText("This is an automated legal financial", {
    x: rightColX + 10,
    y: yRight - 28,
    size: 6.6,
    font: fontRegular,
    color: amberText,
  });
  page.drawText("document statement. If matching", {
    x: rightColX + 10,
    y: yRight - 36,
    size: 6.6,
    font: fontRegular,
    color: amberText,
  });
  page.drawText("payment records have cleared recently, disregard.", {
    x: rightColX + 10,
    y: yRight - 44,
    size: 6.6,
    font: fontRegular,
    color: amberText,
  });

  /* ================= 5. FOOTER STRIP (Edge-to-Edge) ================= */
  const footerHeight = 22;
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: footerHeight,
    color: darkSlate,
  });

  drawShieldIcon(page, margin, 6, brandGreen);
  page.drawText("Ensuring fiscal optimization through unified digital integrity.", {
    x: margin + 14,
    y: 7,
    size: 7.2,
    font: fontRegular,
    color: white,
  });

  drawGlobeIcon(page, rightEdge - fontBold.widthOfTextAtSize("portal.amac-revenue.ng", 7.5) - 15, 6, 9, white);
  page.drawText("portal.amac-revenue.ng", {
    x: rightEdge - fontBold.widthOfTextAtSize("portal.amac-revenue.ng", 7.5),
    y: 7,
    size: 7.5,
    font: fontBold,
    color: white,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

/* ------------------------------------------------------------------ *
 *  Batch PDF Generator for Multiple Demand Notices                   *
 * ------------------------------------------------------------------ */
export const createMultipleDemandNoticesPdf = async (demandsDataList = []) => {
  const mergedPdf = await PDFDocument.create();
  for (const item of demandsDataList) {
    const singlePdfBytes = await createDemandNoticePdf(item);
    const srcDoc = await PDFDocument.load(singlePdfBytes);
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }
  const mergedPdfBytes = await mergedPdf.save();
  return Buffer.from(mergedPdfBytes);
};

export default {
  createDemandNoticePdf,
  createMultipleDemandNoticesPdf,
};