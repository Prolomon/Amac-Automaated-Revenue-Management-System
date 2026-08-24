import { prisma } from "../config/db.js";
import {
  createPaymentTransactionSchema,
  getPaymentTransactionSchema,
  filterPaymentTransactionsSchema,
} from "../validator/paymentTransactionValidator.js";
import { customAlphabet } from "nanoid";

const transactionReferenceSuffix = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  10,
);

const generateTransactionReference = () => {
  return `TXN-${new Date().toISOString().split("T")[0]}-${transactionReferenceSuffix()}`;
};

const WAT_OFFSET_MS = 60 * 60 * 1000; // UTC+1, no DST in Nigeria

// Given a "YYYY-MM-DD" string meant to represent a WAT calendar day,
// return the UTC instant that day starts at.
const getWatDayStartUtc = (dateStr) => {
  return new Date(
    new Date(`${dateStr}T00:00:00.000Z`).getTime() - WAT_OFFSET_MS,
  );
};

const toDateStr = (input) => {
  // Accept "YYYY-MM-DD" as-is; only re-derive via Date if it's some other format.
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
};

const parseDateFilter = ({ date, fromDate, toDate, startDate, endDate }) => {
  // Single date: just return the parsed WAT day-start, no gte/lt wrapping.
  if (date) {
    const dateStr = toDateStr(date);
    return dateStr ? getWatDayStartUtc(dateStr) : null;
  }

  const from = fromDate || startDate;
  const to = toDate || endDate;

  const dateFilter = {};

  if (from) {
    const fromStr = toDateStr(from);
    if (fromStr) dateFilter.gte = getWatDayStartUtc(fromStr);
  }

  if (to) {
    const toStr = toDateStr(to);
    if (toStr) {
      // Range end is still inclusive of the whole "to" day, so use
      // the start of the day AFTER `to` as an exclusive upper bound.
      const toStart = getWatDayStartUtc(toStr);
      dateFilter.lt = new Date(toStart.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  return Object.keys(dateFilter).length > 0 ? dateFilter : null;
};

const createPaymentTransaction = async (req, res) => {
  try {
    const { error, value } = createPaymentTransactionSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const transaction = await prisma.paymentTransaction.create({
      data: {
        reference: value.reference || generateTransactionReference(),
        userId: value.userId,
        pricingId: value.pricingId,
        companyId: value.companyId || null,
        centerId: value.centerId,
        amount: Number(value.amount),
        currency: value.currency || "NGN",
        paymentId: value.paymentId,
        date: value.date ? new Date(value.date) : new Date(),
        type: value.type || "COMPLETE",
        category: value.category || null,
        name: value.name || null,
        billing: value.billing || "MONTHLY",
        status: value.status || "PENDING",
        metadata: value.metadata || null,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Payment transaction created successfully",
      transaction,
    });
  } catch (err) {
    console.error("Create payment transaction error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

const getPaymentTransactionsByUserId = async (req, res) => {
  try {
    const { userId, type } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      5000,
    );
    const skip = (page - 1) * limit;
    const { fromDate, toDate, startDate, endDate, date, query, status } =
      req.query;

    if (!userId) {
      return res
        .status(400)
        .json({ ok: false, message: "User ID is required" });
    }

    // Build where clause based on type
    let where = {};
    if (String(type).toLocaleLowerCase() === "COMPANY".toLocaleLowerCase()) {
      where.companyId = userId;
    } else if (
      String(type).toLocaleLowerCase() === "CENTER".toLocaleLowerCase()
    ) {
      where.centerId = userId;
    } else {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    // Add date range filtering
    const dateRange = parseDateFilter({
      date,
      fromDate,
      toDate,
      startDate,
      endDate,
    });
    if (dateRange) {
      where.date = dateRange;
    }

    // Add payment ID query filtering
    if (query) {
      where.OR = [
        { paymentId: { contains: query, mode: "insensitive" } },
        { reference: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.paymentTransaction.count({ where }),
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
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

const getPaymentTransactionsByPaymentId = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      5000,
    );
    const skip = (page - 1) * limit;

    if (!paymentId) {
      return res
        .status(400)
        .json({ ok: false, message: "Payment ID is required" });
    }

    const [transactions, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where: { paymentId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.paymentTransaction.count({ where: { paymentId } }),
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
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

const getPaymentTransactionByReference = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res
        .status(400)
        .json({ ok: false, message: "Transaction reference is required" });
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ ok: false, message: "Transaction not found" });
    }

    return res.status(200).json({ ok: true, data: transaction, transaction });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getAllPaymentTransactions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 50, 1),
      5000,
    );
    const skip = (page - 1) * limit;
    const {
      centerId,
      date,
      startDate,
      endDate,
      fromDate,
      toDate,
      status,
      query,
    } = req.query;

    const where = {};

    if (
      centerId &&
      centerId !== "ADMIN" &&
      centerId !== "IT" &&
      centerId !== "undefined" &&
      centerId !== "null" &&
      centerId !== "all"
    ) {
      where.centerId = centerId;
    }

    if (status) {
      where.status = status;
    }

    // Date filtering — filters on createdAt, the field guaranteed to be set on every row
    const dateRange = parseDateFilter({
      date,
      fromDate,
      toDate,
      startDate,
      endDate,
    });

    // if (dateRange) {
    //   where.createdAt = dateRange;
    // }

    if (dateRange) {
      if (dateRange instanceof Date) {
        // single `date` case — build the WAT day range here
        const start = dateRange;
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        where.createdAt = { gte: start, lt: end };
      } else {
        // from/to range case — already { gte, lt } shaped
        where.createdAt = dateRange;
      }
    }

    if (query) {
      where.OR = [
        { reference: { contains: query, mode: "insensitive" } },
        { paymentId: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { userId: { contains: query, mode: "insensitive" } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.paymentTransaction.count({ where }),
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
    console.error("getAllPaymentTransactions error:", err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const updatePaymentTransaction = async (req, res) => {
  try {
    const { reference } = req.params;
    const { status, metadata } = req.body;

    if (!reference) {
      return res
        .status(400)
        .json({ ok: false, message: "Transaction reference is required" });
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      return res
        .status(404)
        .json({ ok: false, message: "Transaction not found" });
    }

    const updatedTransaction = await prisma.paymentTransaction.update({
      where: { reference },
      data: {
        ...(status && { status }),
        ...(metadata && { metadata }),
      },
    });

    return res.status(200).json({
      ok: true,
      message: "Payment transaction updated successfully",
      transaction: updatedTransaction,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

export {
  createPaymentTransaction,
  getPaymentTransactionsByUserId,
  getPaymentTransactionsByPaymentId,
  getPaymentTransactionByReference,
  getAllPaymentTransactions,
  updatePaymentTransaction,
  generateTransactionReference,
};
