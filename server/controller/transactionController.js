import { prisma } from "../config/db.js";
import { createTransactionSchema } from "../validator/transactionValidator.js";

const validationErrorResponse = (res, error) => {
  const errors = error.details.map((detail) => detail.message);
  return res.status(400).json({
    ok: false,
    message: errors[0],
    errors,
  });
};

const normalizeAmount = (amount) => {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) ? numericAmount : null;
};

const parseDateParam = (value, endOfDay = false) => {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw || raw === "undefined" || raw === "null") return null;

  const datePart = raw.split("T")[0];
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(datePart);
  if (!isDateOnly) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return null;

  if (endOfDay) {
    // End of day in UTC with 4-hour timezone window buffer
    const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    return new Date(end.getTime() + 4 * 60 * 60 * 1000);
  } else {
    // Start of day in UTC with 4-hour timezone window buffer
    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    return new Date(start.getTime() - 4 * 60 * 60 * 1000);
  }
};

const createTransaction = async (req, res) => {
  try {
    const { error, value } = createTransactionSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const payment = value.paymentId
      ? await prisma.payment.findUnique({ where: { id: value.paymentId } })
      : null;

    if (value.paymentId && !payment) {
      return res.status(404).json({
        ok: false,
        message: "Payment not found",
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        reference: value.reference,
        merchantTxRef: value.merchantTxRef || value.userId || payment?.userId || null,
        event: value.event,
        status: value.status,
        amount: value.amount,
        currency: value.currency || "NGN",
        channel: value.channel || null,
        gatewayResponse: value.gatewayResponse || null,
        customerEmail: value.customerEmail || null,
        paymentId: value.paymentId || payment?.id || null,
        userId: value.userId || payment?.userId || null,
        metadata: value.metadata || null,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Transaction created successfully",
      transaction,
    });
  } catch (err) {
    if (err?.code === "P2002") {
      return res.status(409).json({
        ok: false,
        message: "Transaction already exists for this reference and event",
      });
    }

    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 5000);
    const skip = (page - 1) * limit;

    const fromDate = parseDateParam(req.query.fromDate || req.query.startDate);
    const toDate = parseDateParam(req.query.toDate || req.query.endDate, true);

    const where = {};
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          payment: {
            include: {
              member: true,
              pricing: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: transactions,
      transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
};

const getTransactionsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ ok: false, message: "User ID is required" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 5000);
    const skip = (page - 1) * limit;

    const sort = String(req.query.sort || "desc").toLowerCase() === "asc" ? "asc" : "desc";
    const eventFilter =
      req.query.event && req.query.event !== "undefined" && req.query.event !== "null"
        ? String(req.query.event).trim()
        : null;
    const reference =
      req.query.reference && req.query.reference !== "undefined" && req.query.reference !== "null"
        ? String(req.query.reference).trim()
        : null;
    const status =
      req.query.status && req.query.status !== "undefined" && req.query.status !== "null"
        ? String(req.query.status).trim()
        : null;

    const fromDate = parseDateParam(req.query.fromDate || req.query.formDate || req.query.startDate);
    const toDate = parseDateParam(req.query.toDate || req.query.endDate, true);

    // Resolve if userId belongs to an Admin/Center or Member/Agent
    const adminRecord = await prisma.admin.findFirst({
      where: {
        OR: [{ uid: userId }, { center: userId }, { id: userId }],
      },
      select: { uid: true, center: true },
    });

    const userOrConditions = [
      { userId },
      { merchantTxRef: userId },
    ];

    if (adminRecord) {
      if (adminRecord.uid) {
        userOrConditions.push({ payment: { centerId: adminRecord.uid } });
        userOrConditions.push({ payment: { member: { center: adminRecord.uid } } });
        if (adminRecord.uid !== userId) {
          userOrConditions.push({ userId: adminRecord.uid });
          userOrConditions.push({ merchantTxRef: adminRecord.uid });
        }
      }
      if (adminRecord.center) {
        userOrConditions.push({ payment: { centerId: adminRecord.center } });
        userOrConditions.push({ payment: { member: { center: adminRecord.center } } });
      }
    }

    if (reference) {
      userOrConditions.push({ reference: { contains: reference, mode: "insensitive" } });
    }

    const where = {
      AND: [
        {
          OR: userOrConditions,
        },
      ],
    };

    if (eventFilter) {
      where.AND.push({ event: eventFilter });
    }

    if (status) {
      where.AND.push({ status });
    }

    if (fromDate || toDate) {
      const range = {};
      if (fromDate && !Number.isNaN(fromDate.getTime())) range.gte = fromDate;
      if (toDate && !Number.isNaN(toDate.getTime())) range.lte = toDate;
      if (Object.keys(range).length) {
        where.AND.push({ createdAt: range });
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sort },
        include: {
          payment: {
            include: {
              member: true,
              pricing: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      transactions,
      data: transactions,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("getTransactionsByUserId error:", err);
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
};

const getTransactionsByReference = async (req, res) => {
  try {
    const reference = String(req.query.query || req.query.reference || "").trim();

    if (!reference) {
      return res.status(400).json({ ok: false, message: "Reference is required" });
    }

    const transactions = await prisma.transaction.findMany({
      where: { reference: { contains: reference, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      include: {
        payment: {
          include: {
            member: true,
            pricing: true,
          },
        },
      },
    });

    return res.status(200).json({ ok: true, transactions, data: transactions });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ ok: false, message: "Transaction ID is required" });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [{ id }, { reference: id }],
      },
      include: {
        payment: {
          include: {
            member: true,
            pricing: true,
          },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ ok: false, message: "Transaction not found" });
    }

    return res.status(200).json({ ok: true, transaction, data: transaction });
  } catch (err) {
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
};

const getStatement = async (req, res) => {
  try {
    const centerId = req.query.centerId || req.query.userId || req.user?.uid || req.user?.center;

    if (!centerId) {
      return res.status(400).json({ ok: false, message: "Center ID or User ID is required" });
    }

    const fromDate = parseDateParam(req.query.fromDate || req.query.startDate);
    const toDate = parseDateParam(req.query.toDate || req.query.endDate, true);

    const adminRecord = await prisma.admin.findFirst({
      where: {
        OR: [{ uid: centerId }, { center: centerId }, { id: centerId }],
      },
      select: { uid: true, center: true, adminName: true, paymentConfig: true },
    });

    const centerUids = new Set([centerId]);
    if (adminRecord) {
      if (adminRecord.uid) centerUids.add(adminRecord.uid);
      if (adminRecord.center) centerUids.add(adminRecord.center);
    }
    const centerList = Array.from(centerUids);

    const txWhere = {
      AND: [
        {
          OR: [
            { userId: { in: centerList } },
            { merchantTxRef: { in: centerList } },
            { payment: { centerId: { in: centerList } } },
            { payment: { member: { center: { in: centerList } } } },
          ],
        },
      ],
    };

    if (fromDate || toDate) {
      const range = {};
      if (fromDate && !Number.isNaN(fromDate.getTime())) range.gte = fromDate;
      if (toDate && !Number.isNaN(toDate.getTime())) range.lte = toDate;
      if (Object.keys(range).length) {
        txWhere.AND.push({ createdAt: range });
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: txWhere,
      orderBy: { createdAt: "desc" },
      include: {
        payment: {
          include: {
            member: true,
            pricing: true,
          },
        },
      },
    });

    const walletRecord = await prisma.wallet.findFirst({
      where: {
        OR: [{ userId: { in: centerList } }, { id: { in: centerList } }],
      },
    });

    // Grouping by Pricing (Revenue Stream / Head)
    const summaryMap = {};

    let totalGrossCollections = 0;
    let totalPaidTransactions = 0;
    let totalDemandNoticesIssued = 0;

    // Fetch demand notices count for period and center
    const demandWhere = {
      member: { center: { in: centerList } },
    };
    if (fromDate || toDate) {
      demandWhere.createdAt = {};
      if (fromDate && !Number.isNaN(fromDate.getTime())) demandWhere.createdAt.gte = fromDate;
      if (toDate && !Number.isNaN(toDate.getTime())) demandWhere.createdAt.lte = toDate;
    }
    const totalDemandsCount = await prisma.demand.count({ where: demandWhere });
    totalDemandNoticesIssued = totalDemandsCount;

    // Channels counters
    let posAmount = 0;
    let bankTransferAmount = 0;
    let webPortalAmount = 0;
    let otherChannelAmount = 0;

    transactions.forEach((tx) => {
      const isSuccess = String(tx.status || "").toUpperCase() === "SUCCESS";
      const amt = Number(tx.amount || 0);
      const channelStr = String(tx.channel || "").toLowerCase();

      if (isSuccess) {
        totalGrossCollections += amt;
        totalPaidTransactions += 1;

        if (channelStr.includes("pos") || channelStr.includes("card")) {
          posAmount += amt;
        } else if (channelStr.includes("wallet") || channelStr.includes("bank") || channelStr.includes("nomba")) {
          bankTransferAmount += amt;
        } else if (channelStr.includes("web") || channelStr.includes("checkout")) {
          webPortalAmount += amt;
        } else {
          otherChannelAmount += amt;
        }
      }

      const pricingTitle = tx.payment?.pricing?.title || "General Revenue & Compliance Fees";
      if (!summaryMap[pricingTitle]) {
        summaryMap[pricingTitle] = {
          revenueHead: pricingTitle,
          demandNotices: 0,
          paidTransactions: 0,
          grossCollections: 0,
        };
      }

      if (isSuccess) {
        summaryMap[pricingTitle].paidTransactions += 1;
        summaryMap[pricingTitle].grossCollections += amt;
      }
    });

    const revenueStreams = Object.values(summaryMap);
    if (revenueStreams.length > 0) {
      const remainingDemands = totalDemandNoticesIssued;
      const totalStreams = revenueStreams.length;
      revenueStreams.forEach((stream, idx) => {
        stream.demandNotices = Math.round(remainingDemands / totalStreams);
      });
    }

    // Revenue Split Schedule
    let paymentConfig = adminRecord?.paymentConfig || {};
    if (typeof paymentConfig !== "object") {
      try {
        paymentConfig = JSON.parse(paymentConfig);
      } catch (e) {
        paymentConfig = {};
      }
    }

    const amacSharePct = Number(paymentConfig.main ?? paymentConfig.amac ?? 80);
    const agentSharePct = Number(paymentConfig.agent ?? 15);
    const techSharePct = Number(paymentConfig.technology ?? 5);

    const amacGross = (totalGrossCollections * amacSharePct) / 100;
    const amacWht = 0;
    const amacNet = amacGross - amacWht;

    const agentGross = (totalGrossCollections * agentSharePct) / 100;
    const agentWht = (agentGross * 5) / 100; // 5% WHT
    const agentNet = agentGross - agentWht;

    const techGross = (totalGrossCollections * techSharePct) / 100;
    const techWht = (techGross * 5) / 100; // 5% WHT
    const techNet = techGross - techWht;

    const totalGrossSplit = amacGross + agentGross + techGross;
    const totalWhtSplit = amacWht + agentWht + techWht;
    const totalNetDisbursed = amacNet + agentNet + techNet;

    // Channel Percentages
    const calcPct = (val) => (totalGrossCollections > 0 ? ((val / totalGrossCollections) * 100).toFixed(1) : "0.0");

    const channelBreakdown = {
      pos: { amount: posAmount, percentage: Number(calcPct(posAmount)) },
      bankTransfer: { amount: bankTransferAmount, percentage: Number(calcPct(bankTransferAmount)) },
      webPortal: { amount: webPortalAmount + otherChannelAmount, percentage: Number(calcPct(webPortalAmount + otherChannelAmount)) },
    };

    return res.status(200).json({
      ok: true,
      meta: {
        statementPeriod: {
          from: fromDate || null,
          to: toDate || null,
        },
        reference: `AMAC-TR3G-SOA-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
        generationDate: new Date(),
        centerId: centerId,
        displayName: adminRecord?.adminName || "Abuja Municipal Area Council (AMAC)",
        bankDetails: walletRecord ? {
          bankName: walletRecord.bank?.name || "Access Bank",
          accountNumber: walletRecord.accountNo || "0012345678",
          accountName: walletRecord.accountName || "AMAC Settlement Account",
        } : {
          bankName: "Access Bank",
          accountNumber: "0012345678",
          accountName: "AMAC Settlement Account",
        },
      },
      collectionSummary: {
        streams: revenueStreams,
        totals: {
          demandNotices: totalDemandNoticesIssued,
          paidTransactions: totalPaidTransactions,
          grossCollections: totalGrossCollections,
        },
      },
      disbursementSchedule: {
        stakeholders: [
          { name: "AMAC Treasury Account", ratio: amacSharePct, gross: amacGross, deductions: amacWht, net: amacNet },
          { name: "Technical Partner Commission", ratio: agentSharePct, gross: agentGross, deductions: agentWht, net: agentNet, label: "(5% WHT)" },
          { name: "Platform Software / Maintenance Fee", ratio: techSharePct, gross: techGross, deductions: techWht, net: techNet, label: "(5% WHT)" },
        ],
        totals: {
          ratio: amacSharePct + agentSharePct + techSharePct,
          gross: totalGrossSplit,
          deductions: totalWhtSplit,
          net: totalNetDisbursed,
        },
      },
      performanceMetrics: {
        channelBreakdown,
        reconciliation: {
          successfulSettlements: totalGrossCollections,
          unreconciledAmount: 0,
          unreconciledPercentage: 0,
        },
      },
      transactions,
    });
  } catch (err) {
    console.error("getStatement error:", err);
    return res.status(500).json({ ok: false, message: err?.message || "Server error" });
  }
};

export {
  createTransaction,
  getAllTransactions,
  getTransactionsByUserId,
  getTransactionsByReference,
  getTransactionById,
  getStatement,
};