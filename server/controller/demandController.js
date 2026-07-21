import { prisma } from "../config/db.js";
import { processDemands } from "../service/demandCron.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const formatCurrency = (amount) => {
  return Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const createDemandNotice = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        ok: false,
        message: "userId is required",
      });
    }

    let wallet;

    wallet = await prisma.wallet.findFirst({
      where: { userId },
    });

    if (!wallet) {
      console.log(`Wallet not found for userId: ${userId}. Creating a new wallet.`);
    }

    // Fetch member details
    const member = await prisma.member.findUnique({
      where: { uid: userId },
    });

    if (!member) {
      return res.status(404).json({
        ok: false,
        message: "Member not found",
      });
    }

    // Fetch all payments for this user where status is not COMPLETED
    const payments = await prisma.payment.findMany({
      where: { 
        userId: userId,
        status: {
          not: "COMPLETED",
        },
      },
    });

    if (payments.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "No outstanding payments found for this user",
      });
    }

    // Create Demand records with CREATED status - each with unique reference
    const demandRecords = await prisma.$transaction(
      payments.map(async (payment) => {
        const uniqueRef = `DN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        await prisma.payment.update({
          where: { id: payment.id },
          data: { isDemand: true }, // Update payment status to PENDING
        });
        return await prisma.demand.create({
          data: {
            reference: uniqueRef,
            userId: userId,
            walletId: wallet ? wallet.id : null,
            paymentId: payment.id,
            amount: Number(payment.debt || payment.amount),
            status: "CREATED",
            isSent: false,
            center: member.center,
          },
        });
      })
    );

    // Calculate totals for response
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Trigger instant email processing in the background
    processDemands().catch((err) =>
      console.error("Error in background demand processing:", err)
    );

    return res.status(200).json({
      ok: true,
      message: "Demand notice created successfully. Email is being sent.",
      data: {
        demandsCreated: demandRecords.length,
        paymentsProcessed: payments.length,
        memberEmail: member.email,
        memberName: member.businessName || member.fullname || "N/A",
        totalAmount: formatCurrency(totalAmount),
        status: "CREATED",
        note: "Email is being sent instantly in the background",
      },
    });
  } catch (err) {
    console.error("sendDemandNotice error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

export const createMultipleDemandNotice = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "userIds must be a non-empty array of user IDs",
      });
    }

    const results = {
      total: userIds.length,
      created: 0,
      skipped: 0,
      failed: 0,
      details: [],
    };

    for (const userId of userIds) {
      try {
        // Fetch member
        const member = await prisma.member.findUnique({
          where: { uid: userId },
        });

        let wallet;

        wallet = await prisma.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          console.log(`Wallet not found for userId: ${userId}. Creating a new wallet.`);
        }

        if (!member) {
          results.failed++;
          results.details.push({
            userId,
            status: "failed",
            reason: "Member not found",
          });
          continue;
        }

        // Fetch all payments for this user
        const payments = await prisma.payment.findMany({
          where: { userId },
        });

        if (payments.length === 0) {
          results.skipped++;
          results.details.push({
            userId,
            status: "skipped",
            reason: "No payments found for this user",
          });
          continue;
        }

        // Check if all payments are SUCCESS/COMPLETED and debt is 0
        const allPaid = payments.every(
          (p) => (p.status === "SUCCESS" || p.status === "COMPLETED") && Number(p.debt) === 0
        );

        if (allPaid) {
          results.skipped++;
          results.details.push({
            userId,
            status: "skipped",
            reason: "All payments are completed/successful with zero debt",
          });
          continue;
        }

        // Filter to only unpaid payments (not SUCCESS/COMPLETED or has debt > 0)
        const unpaidPayments = payments.filter(
          (p) => p.status !== "SUCCESS" && p.status !== "COMPLETED" || Number(p.debt) > 0
        );

        if (unpaidPayments.length === 0) {
          results.skipped++;
          results.details.push({
            userId,
            status: "skipped",
            reason: "No outstanding payments to demand",
          });
          continue;
        }

        // Create Demand records with CREATED status for unpaid payments - each with unique reference
        const demandRecords = await prisma.$transaction(
          unpaidPayments.map((payment) => {
            const uniqueRef = `${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
            return prisma.demand.create({
              data: {
                reference: uniqueRef,
                userId: userId,
                paymentId: payment.id,
                amount: Number(payment.debt || payment.amount),
                status: "CREATED",
                walletId: wallet ? wallet.id : null,
                isSent: false,
                center: member.center,
              },
            });
          })
        );

        results.created++;
        results.details.push({
          userId,
          status: "created",
          memberEmail: member.email,
          memberName: member.businessName || member.fullname || "N/A",
          paymentsProcessed: unpaidPayments.length,
          demandsCreated: demandRecords.length,
          note: "Email is being sent instantly",
        });
      } catch (err) {
        console.error(`sendMultipleDemandNotice error for userId ${userId}:`, err);
        results.failed++;
        results.details.push({
          userId,
          status: "failed",
          reason: err?.message || "Server error",
        });
      }
    }

    // Trigger instant email processing in the background
    processDemands().catch((err) =>
      console.error("Error in background demand processing:", err)
    );

    return res.status(200).json({
      ok: true,
      message: `Demand notices created: ${results.created} created, ${results.skipped} skipped, ${results.failed} failed. Emails are being processed.`,
      data: results,
    });
  } catch (err) {
    console.error("sendMultipleDemandNotice error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

export const createDemandNoticeByPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        ok: false,
        message: "paymentId is required",
      });
    }

    // Fetch payment details
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId },
    });

    if (!payment) {
      return res.status(404).json({
        ok: false,
        message: "Payment not found",
      });
    }

    // Fetch member details
    const member = await prisma.member.findFirst({
      where: { uid: payment.userId },
    });

    if (!member) {
      return res.status(404).json({
        ok: false,
        message: "Member not found",
      });
    }

    let wallet;

    wallet = await prisma.wallet.findFirst({
      where: { userId: payment.userId },
    });

    if (!wallet) {
      console.log(`Wallet not found for userId: ${payment.userId}. Creating a new wallet.`);
    }

    // Create Demand record with CREATED status - each with unique reference
    const uniqueRef = `DN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const demandRecord = await prisma.demand.create({
      data: {
        reference: uniqueRef,
        status: "CREATED",
        paymentId: payment.id,
        userId: member.uid,
        walletId: wallet ? wallet.id : null,
        paymentId: payment.id,
        amount: Number(payment.debt || payment.amount),
        isSent: false,
        center: member.center,
      },
    });

    // Trigger instant email processing in the background
    processDemands().catch((err) =>
      console.error("Error in background demand processing:", err)
    );

    return res.status(200).json({
      ok: true,
      message: "Demand notice created successfully. Email is being sent.",
      data: {
        demandId: demandRecord.id,
        memberEmail: member.email,
        memberName: member.businessName || member.fullname || "N/A",
        amount: formatCurrency(Number(payment.amount)),
        status: "CREATED",
        note: "Email is being sent instantly in the background",
      },
    });
  } catch (err) {
    console.error("sendDemandNoticeByPayment error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

export const getDemands = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where = {};
    if (status) where.status = status;

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get demands with payment and member info
    const [demands, total] = await Promise.all([
      prisma.demand.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.demand.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: demands,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("getDemands error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

export const getDemandById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "Demand ID is required",
      });
    }

    const demand = await prisma.demand.findUnique({
      where: { id },
      include: {
        payment: true,
        member: true,
      },
    });

    if (!demand) {
      return res.status(404).json({
        ok: false,
        message: "Demand not found",
      });
    }

    return res.status(200).json({
      ok: true,
      data: demand,
    });
  } catch (err) {
    console.error("getDemandById error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

export const getDemandByCenter = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "Demand ID is required",
      });
    }

    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where = {};
    if (id) where.center = id;
    if (status) where.status = status;

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get demands with payment and member info
    const [demands, total] = await Promise.all([
      prisma.demand.findMany({
        where,
        include: {
          payment: true,
          member: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.demand.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: demands,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("getDemands error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

export const getDemandByPayment = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "Demand ID is required",
      });
    }

    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where = {};
    if (id) where.paymentId = id;
    if (status) where.status = status;

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get demands with payment and member info
    const [demands, total] = await Promise.all([
      prisma.demand.findMany({
        where,
        include: {
          payment: true,
          member: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.demand.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: demands,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("getDemands error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

export const getDemandByUser = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "Demand ID is required",
      });
    }

    const { status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where = {};
    if (id) where.userId = id;
    if (status) where.status = status;

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get demands with payment and member info
    const [demands, total] = await Promise.all([
      prisma.demand.findMany({
        where,
        include: {
          payment: true,
          member: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.demand.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: demands,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("getDemands error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

export const resendDemandNotice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "Demand ID is required",
      });
    }

    // Fetch demand with payment and member details
    const demand = await prisma.demand.findUnique({
      where: { id },
      include: {
        payment: true,
        member: true,
      },
    });

    if (!demand) {
      return res.status(404).json({
        ok: false,
        message: "Demand not found",
      });
    }

    // Re-check payment for current pricing/price
    const payment = await prisma.payment.findUnique({
      where: { id: demand.paymentId },
    });

    if (!payment) {
      return res.status(404).json({
        ok: false,
        message: "Payment record not found",
      });
    }

    // Reset demand to CREATED status so cron will handle the resend
    await prisma.demand.update({
      where: { id },
      data: {
        status: "CREATED",
        isSent: false,
        amount: (Number(payment.amount) - Number(payment.debt)),
      },
    });

    // Trigger instant email processing in the background
    processDemands().catch((err) =>
      console.error("Error in background demand processing:", err)
    );

    return res.status(200).json({
      ok: true,
      message: "Demand notice queued for resend. Email is being sent.",
      data: {
        demandId: id,
        memberEmail: demand.member.email,
        memberName: demand.member.fullname || demand.member.businessName || "N/A",
        amount: formatCurrency((Number(payment.amount) - Number(payment.debt))),
        priceRechecked: true,
        status: "CREATED",
        note: "Email is being sent instantly in the background",
      },
    });
  } catch (err) {
    console.error("resendDemandNotice error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};