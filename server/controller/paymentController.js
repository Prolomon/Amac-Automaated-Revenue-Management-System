import { prisma } from "../config/db.js";
import {
  createPaymentSchema,
  updatePaymentScheduleSchema,
  verifyPaymentSchema,
  makePaymentSchema,
} from "../validator/paymentValidator.js";
import { customAlphabet } from "nanoid";
import { initiateTransfer as nombaTransfer } from "../service/wallet.js";
import { generateTransactionReference } from "./paymentTransactionController.js";
import argon2 from "argon2";
import { createAccount, getAccount } from "../service/wallet.js";

const paymentReferenceSuffix = customAlphabet("0123456789", 8);

const generatePaymentReference = () => {
  const date = new Date();
  return `PAY|${date.getFullYear()}${date.getMonth() + 1}${date.getHours()}${date.getMinutes()}${date.getSeconds()}${paymentReferenceSuffix()}`;
};

const getWalletBankDetails = (wallet) => {
  const bank = wallet?.bank || {};

  return {
    accountNumber: wallet?.accountNo || null,
    accountName: wallet?.accountName || null,
    bankName: bank?.name || null,
    bankCode: bank?.code || null,
  };
};

const generateReceipt = ({
  reference,
  paymentRecord,
  grossAmount,
  fee,
  netAmount,
  mainAmount,
  agentAmount,
  technologyAmount,
  senderWallet,
  mainWallet,
  agentWallet,
}) => {
  const sender = getWalletBankDetails(senderWallet);

  return {
    reference,
    paymentReference: paymentRecord.reference,
    paymentId: paymentRecord.id,
    date: new Date().toISOString(),
    grossAmount,
    fee,
    netAmount,
    sender,
    recipients: {
      admin: getWalletBankDetails(mainWallet),
      agent: getWalletBankDetails(agentWallet),
    },
    breakdown: {
      main: mainAmount,
      agent: agentAmount,
      technology: technologyAmount,
    },
  };
};

const normalizeSessions = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item));
  }

  return [String(value)].filter(Boolean);
};

const getNextDueDate = (dueDate, frequency) => {
  const nextDueDate = new Date(dueDate || new Date());
  const normalizedFrequency = String(frequency || "MONTHLY").toUpperCase();

  switch (normalizedFrequency) {
    case "DAILY":
      nextDueDate.setDate(nextDueDate.getDate() + 1);
      break;
    case "WEEKLY":
      nextDueDate.setDate(nextDueDate.getDate() + 7);
      break;
    case "BIWEEKLY":
      nextDueDate.setDate(nextDueDate.getDate() + 14);
      break;
    case "QUARTERLY":
      nextDueDate.setMonth(nextDueDate.getMonth() + 3);
      break;
    case "YEARLY":
      nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      break;
    case "MONTHLY":
    default:
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      break;
  }

  return nextDueDate;
};

const generateUniquePaymentId = async (client = prisma) => {
  const generateId = customAlphabet("0123456789", 12);

  let id;
  let exists = true;

  while (exists) {
    id = generateId();
    const existingPayment = await client.payment.findUnique({
      where: { id },
    });
    exists = !!existingPayment;
  }

  return id;
};

const createPaymentRecord = async (data, client = prisma) => {
  const uniqueId = await generateUniquePaymentId(client);

  return client.payment.create({
    data: {
      id: uniqueId,
      reference: data.reference || generatePaymentReference(),
      userId: data.userId,
      frequency: data.frequency || "MONTHLY",
      sessions: normalizeSessions(data.sessions),
      debt: Number(data.debt ?? 0),
      due: data.due ? new Date(data.due) : new Date(),
      amount: Number(data.amount),
      payment: String(data.payment),
      centerId: data.centerId || null,
      companyId: data.companyId || null,
      status: data.status || "PENDING",
      isVerify: Boolean(data.isVerify),
    },
  });
};

const createRecurringPaymentForPayment = async (payment, client = prisma) => {
  const nextDueDate = getNextDueDate(payment.due, payment.frequency);
  const existingNextPayment = await client.payment.findFirst({
    where: {
      userId: payment.userId,
      payment: payment.payment,
      due: nextDueDate,
    },
    select: { id: true },
  });

  if (existingNextPayment) {
    return { created: false, payment: null };
  }

  const nextPayment = await client.payment.create({
    data: {
      reference: generatePaymentReference(),
      userId: payment.userId,
      frequency: payment.frequency,
      sessions: [],
      debt: Number(payment.debt ?? 0),
      due: nextDueDate,
      amount: Number(payment.amount),
      payment: payment.payment,
      status: "PENDING",
      isVerify: false,
    },
  });

  return { created: true, payment: nextPayment };
};

const createPayment = async (req, res) => {
  try {
    const { error, value } = createPaymentSchema.validate(req.body, {
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

    const payment = await createPaymentRecord(value);

    try {
      const notificationType =
        payment.status === "SUCCESS" ? "SUCCESS" : "PENDING";
      const notificationTitle =
        payment.status === "SUCCESS" ? "Payment Successful" : "Payment Pending";
      const notificationDescription =
        payment.status === "SUCCESS"
          ? `Your payment of ${payment.amount} has been processed successfully.`
          : `Your payment of ${payment.amount} is pending approval.`;

      await prisma.notification.create({
        data: {
          userId: payment.userId,
          title: notificationTitle,
          description: notificationDescription,
          type: notificationType,
          date: new Date(),
        },
      });
    } catch (notificationError) {
      console.error(
        "Failed to create payment notification:",
        notificationError.message || notificationError,
      );
    }

    return res
      .status(201)
      .json({ ok: true, message: "Payment created successfully", payment });
  } catch (err) {
    console.error("Create payment error:", err);
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getPaymentsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ ok: false, message: "User ID is required" });
    }

    const payments = await prisma.payment.findMany({
      where: { userId },
      include: { member: true, pricing: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ ok: true, payments });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getPaymentByReference = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res
        .status(400)
        .json({ ok: false, message: "Payment reference is required" });
    }

    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: {
        member: { include: { companyData: true, agentData: true } },
        pricing: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ ok: false, message: "Payment not found" });
    }

    return res.status(200).json({ ok: true, payment });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ ok: false, message: "Payment id is required" });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { member: true, pricing: true },
    });

    if (!payment) {
      return res.status(404).json({ ok: false, message: "Payment not found" });
    }

    return res.status(200).json({ ok: true, payment });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100,
    );
    const skip = (page - 1) * limit;

    const search = req.query.search ? String(req.query.search).trim() : null;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          reference: search
            ? { contains: search, mode: "insensitive" }
            : undefined,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          member: true,
          pricing: true,
        },
      }),
      prisma.payment.count(),
    ]);

    return res.status(200).json({
      ok: true,
      payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    // const { error, value } = verifyPaymentSchema.validate(req.body, {
    //   abortEarly: false,
    // });

    // if (error) {
    //   const errors = error.details.map((detail) => detail.message);
    //   return res.status(400).json({
    //     ok: false,
    //     message: errors[0],
    //     errors,
    //   });
    // }

    if (!id) {
      return res
        .status(400)
        .json({ ok: false, message: "Payment ID or reference is required" });
    }

    // Try to find payment by reference first, then by ID
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ reference: id }, { id: id }],
      },
    });

    if (!payment) {
      return res.status(404).json({ ok: false, message: "Payment not found" });
    }

    // const incomingSessions = normalizeSessions(value.session ?? value.sessions);
    // const updatedSessions = Array.from(
    //   new Set([...(payment.sessions || []), ...incomingSessions])
    // );

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        isVerify: true,
      },
      include: { member: true, pricing: true },
    });

    if (updatedPayment.userId) {
      await prisma.notification.create({
        data: {
          userId: updatedPayment.userId,
          title: "Payment Verified",
          description: `Your payment of ${updatedPayment.amount} has been verified successfully.`,
          type: "SUCCESS",
          date: new Date(),
        },
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Payment verified successfully",
      payment: updatedPayment,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const updatePaymentSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updatePaymentScheduleSchema.validate(req.body, {
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

    if (!id) {
      return res
        .status(400)
        .json({ ok: false, message: "Payment id is required" });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return res.status(404).json({ ok: false, message: "Payment not found" });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        frequency: value.frequency,
        amount: value.amount,
        due: value.due,
      },
    });

    return res.status(200).json({
      ok: true,
      message: "Payment schedule updated successfully",
      payment: updatedPayment,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getPaymentsByPartnerId = async (req, res) => {
  try {
    const { partnerId } = req.params;

    if (!partnerId) {
      return res
        .status(400)
        .json({ ok: false, message: "Partner ID is required" });
    }

    const payments = await prisma.payment.findMany({
      where: { companyId: partnerId },
      include: { member: true, pricing: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ ok: true, payments });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getPaymentsByCenterId = async (req, res) => {
  try {
    const { centerId } = req.params;

    if (!centerId) {
      return res
        .status(400)
        .json({ ok: false, message: "center ID is required" });
    }

    const payments = await prisma.payment.findMany({
      where: { centerId },
      include: { member: true, pricing: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ ok: true, payments });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getPaymentForUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ ok: false, message: "User ID is required" });
    }

    let member = await prisma.member.findFirst({
      where: {
        OR: [{ uid: id }, { phone: id }, { email: id }],
      },
    });

    if (member) {
      const payments = await prisma.payment.findMany({
        where: { userId: member.uid },
        include: { member: true, pricing: true },
        orderBy: { createdAt: "desc" },
      });

      const agentUid = member.agent;

      if (!agentUid) {
        return res.status(500).json({
          ok: false,
          message: "Please Contact Support to assign an agent",
        });
      }

      const agent = await prisma.agent.findFirst({
        where: { uid: agentUid },
      });

      if (!agent) {
        return res.status(500).json({
          ok: false,
          message: "Please Contact Support to assign an agent",
        });
      }

      let wallet;

      wallet = await prisma.wallet.findFirst({
        where: { userId: member.uid },
      });

      if (!wallet) {
        wallet = await prisma.wallet.findFirst({
          where: { userId: member.agent },
        });
      }

      const paymentList = await Promise.all(
        payments.map(async (payment) => {
          return { payment, wallet };
        }),
      );

      return res
        .status(200)
        .json({ ok: true, data: { payments: paymentList, member, agent } });
    } else {
      const payment = await prisma.payment.findFirst({
        where: { reference: id },
        include: { member: true, pricing: true },
      });

      if (!payment) {
        return res
          .status(404)
          .json({ ok: false, message: "Payment not found" });
      }

      const agentUid = payment?.member?.agent;

      if (!agentUid) {
        return res.status(500).json({
          ok: false,
          message: "Please Contact Support to assign an agent | not member",
        });
      }

      const agent = await prisma.agent.findFirst({
        where: { uid: agentUid },
      });

      if (!agent) {
        return res.status(500).json({
          ok: false,
          message: "Please Contact Support to assign an agent | not member",
        });
      }

      member = await prisma.member.findFirst({
        where: { uid: payment?.userId },
      });

      if (!member) {
        return res.status(404).json({
          ok: false,
          message: "Member associated with this payment not found",
        });
      }

      let wallet = await prisma.wallet.findFirst({
        where: { userId: member.uid },
      });

      if (!wallet) {
        wallet = await prisma.wallet.findFirst({
          where: { userId: member.agent },
        });
      }

      return res.status(200).json({
        ok: true,
        data: { payments: [{ payment, wallet }], agent, member },
      });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const executeUnifiedPayment = async ({
  amount,
  userId,
  paymentId,
  center,
  company,
  agentId,
  directWalletDebit = false,
  channel = "wallet",
}) => {
  try {
    const grossAmount = Number(amount);
    if (isNaN(grossAmount) || grossAmount <= 0) {
      return { ok: false, message: "Invalid payment amount" };
    }

    if (!userId) {
      return { ok: false, message: "User ID is required" };
    }

    if (!paymentId) {
      return { ok: false, message: "Payment ID or reference is required" };
    }

    const member = await prisma.member.findUnique({
      where: { uid: userId },
    });

    if (!member) {
      return { ok: false, message: "Member not found" };
    }

    // Scoped payment lookup: prioritize current user's records
    let paymentRecord = await prisma.payment.findFirst({
      where: {
        userId: member.uid,
        OR: [
          { id: paymentId },
          { reference: paymentId },
          { payment: paymentId },
        ],
      },
      select: {
        id: true,
        reference: true,
        userId: true,
        frequency: true,
        sessions: true,
        debt: true,
        due: true,
        amount: true,
        paid: true,
        payment: true,
        status: true,
        isVerify: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!paymentRecord) {
      paymentRecord = await prisma.payment.findFirst({
        where: {
          OR: [
            { id: paymentId },
            { reference: paymentId },
          ],
        },
        select: {
          id: true,
          reference: true,
          userId: true,
          frequency: true,
          sessions: true,
          debt: true,
          due: true,
          amount: true,
          paid: true,
          payment: true,
          status: true,
          isVerify: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    if (!paymentRecord) {
      return { ok: false, message: "Payment record not found" };
    }

    // Short-circuit if already settled
    if (paymentRecord.status === "PAID" && Number(paymentRecord.debt || 0) === 0) {
      return {
        ok: true,
        message: "Payment has already been made for this record",
        data: { payment: paymentRecord },
      };
    }

    const centerUid = member.center || center;
    const companyUid = member.company || company;
    const agentUid = agentId || member.agent;

    const [main, mainWallet, agentWallet, senderWallet, technologyWallet] =
      await Promise.all([
        centerUid
          ? prisma.admin.findFirst({ where: { uid: centerUid } })
          : null,
        centerUid
          ? prisma.wallet.findFirst({ where: { userId: centerUid } })
          : null,
        agentUid
          ? prisma.wallet.findFirst({ where: { userId: agentUid } })
          : null,
        prisma.wallet.findFirst({ where: { userId: member.uid } }),
        prisma.wallet.findFirst({ where: { role: "IT" } }),
      ]);

    if (!main) {
      return { ok: false, message: "Main admin not found" };
    }

    if (!main.paymentConfig) {
      return { ok: false, message: "Payment configuration is incomplete" };
    }

    const paymentConfig = main.paymentConfig || {
      main: 65,
      agent: 25,
      technology: 10,
    };

    // If direct wallet debit is requested, strictly verify sender wallet and balance
    if (directWalletDebit) {
      if (!senderWallet) {
        return { ok: false, message: "Sender wallet not found for direct debit" };
      }
      if (Number(senderWallet.balance || 0) < grossAmount) {
        return { ok: false, message: "Insufficient balance in sender wallet" };
      }
    }

    const existingDebt = Math.max(Number(paymentRecord.debt || 0), 0);
    const principal = Number(paymentRecord.amount || 0);
    const vat = principal * 0.075;
    const paySubtotal = principal + vat;
    const totalObligation =
      existingDebt > 0
        ? existingDebt
        : paySubtotal > 0
          ? paySubtotal
          : principal;

    let excess = 0;
    let payableAmount = grossAmount;

    if (totalObligation > 0 && payableAmount > totalObligation) {
      excess = payableAmount - totalObligation;
      payableAmount = totalObligation;
    }

    const feePercentage = 0.015; // 1.5% AMAC technology platform fee
    const fee = payableAmount * feePercentage;
    const netTotal = payableAmount - fee;
    const receiptReference = generateTransactionReference();

    const mainShare = Number(paymentConfig.main ?? 0);
    const agentShare = Number(paymentConfig.agent ?? 0);
    const technologyShare = Number(paymentConfig.technology ?? 0);

    const mainAmount = (netTotal * mainShare) / 100;
    const agentAmount = (netTotal * agentShare) / 100;
    const technologyAmount = (netTotal * technologyShare) / 100;
    const itCreditAmount = technologyAmount;

    const senderDetails = getWalletBankDetails(senderWallet);
    const receipt = generateReceipt({
      reference: receiptReference,
      paymentRecord,
      grossAmount: payableAmount,
      fee,
      netAmount: netTotal,
      mainAmount,
      agentAmount,
      technologyAmount,
      senderWallet,
      mainWallet,
      agentWallet,
    });

    const previouslyPaid = Number(paymentRecord.paid || 0);
    const cumulativePaid = previouslyPaid + payableAmount;

    let newDebt;
    if (existingDebt > 0) {
      newDebt = Math.max(existingDebt - payableAmount, 0);
    } else {
      newDebt = Math.max(totalObligation - cumulativePaid, 0);
    }
    const isFullyPaid = newDebt === 0;

    const paymentResult = await prisma.$transaction(async (tx) => {
      // Direct debit from sender wallet
      if (directWalletDebit && senderWallet) {
        await tx.wallet.update({
          where: { id: senderWallet.id },
          data: { balance: { decrement: payableAmount } },
        });
      }

      // If external payment overpaid, credit excess to sender wallet
      if (excess > 0 && !directWalletDebit && senderWallet) {
        await tx.wallet.update({
          where: { id: senderWallet.id },
          data: { balance: { increment: excess } },
        });
      }

      const updatedPayment = await tx.payment.update({
        where: { id: paymentRecord.id },
        data: {
          paid: cumulativePaid,
          debt: newDebt,
          status: isFullyPaid ? "PAID" : "PENDING",
        },
      });

      if (mainWallet) {
        await tx.wallet.update({
          where: { id: mainWallet.id },
          data: { balance: { increment: mainAmount } },
        });
      }

      if (agentWallet) {
        await tx.wallet.update({
          where: { id: agentWallet.id },
          data: { balance: { increment: agentAmount } },
        });
      }

      if (technologyWallet) {
        await tx.wallet.update({
          where: { id: technologyWallet.id },
          data: { balance: { increment: itCreditAmount } },
        });
      }

      if (main) {
        await tx.admin.update({
          where: { id: main.id },
          data: { ledger: { increment: netTotal } },
        });
      }

      await Promise.all([
        tx.transaction.create({
          data: {
            reference: `${receiptReference}-ADMIN`,
            merchantTxRef: main.uid,
            event: "payment.admin.credit",
            status: "SUCCESS",
            amount: mainAmount,
            currency: "NGN",
            channel,
            gatewayResponse: "Admin wallet credited",
            customerEmail: main.adminEmail || main.email || null,
            paymentId: paymentRecord.id,
            userId: main.uid,
            metadata: {
              receipt,
              role: "ADMIN",
              transactionType: "CREDIT",
              creditedAmount: mainAmount,
              senderAccountNumber: senderDetails.accountNumber,
              senderBankName: senderDetails.bankName,
              senderBankCode: senderDetails.bankCode,
              senderName: senderDetails.accountName,
            },
          },
        }),
        tx.transaction.create({
          data: {
            reference: `${receiptReference}-AGENT`,
            merchantTxRef: agentUid || null,
            event: "payment.agent.credit",
            status: "SUCCESS",
            amount: agentAmount,
            currency: "NGN",
            channel,
            gatewayResponse: "Agent wallet credited",
            customerEmail: agentWallet?.accountName || null,
            paymentId: paymentRecord.id,
            userId: agentUid || null,
            metadata: {
              receipt,
              role: "AGENT",
              transactionType: "CREDIT",
              creditedAmount: agentAmount,
              senderAccountNumber: senderDetails.accountNumber,
              senderBankName: senderDetails.bankName,
              senderBankCode: senderDetails.bankCode,
              senderName: senderDetails.accountName,
            },
          },
        }),
        tx.transaction.create({
          data: {
            reference: `${receiptReference}-SENDER`,
            merchantTxRef: member.uid,
            event: directWalletDebit ? "payment.sender.debit" : "payment.sender.paid",
            status: "SUCCESS",
            amount: payableAmount,
            currency: "NGN",
            channel,
            gatewayResponse: directWalletDebit ? "Sender wallet debited" : "Payment received",
            customerEmail: member.email || null,
            paymentId: paymentRecord.id,
            userId: member.uid,
            metadata: {
              receipt,
              role: "SENDER",
              transactionType: "DEBIT",
              debitedAmount: payableAmount,
              senderAccountNumber: senderDetails.accountNumber,
              senderBankName: senderDetails.bankName,
              senderBankCode: senderDetails.bankCode,
              senderName: senderDetails.accountName,
            },
          },
        }),
        tx.transaction.create({
          data: {
            reference: `${receiptReference}-IT`,
            merchantTxRef: technologyWallet?.userId || null,
            event: "payment.it.credit",
            status: "SUCCESS",
            amount: itCreditAmount,
            currency: "NGN",
            channel,
            gatewayResponse: "IT wallet credited",
            customerEmail: member.email || null,
            paymentId: paymentRecord.id,
            userId: technologyWallet?.userId || null,
            metadata: {
              receipt,
              role: "IT",
              transactionType: "CREDIT",
              creditedAmount: itCreditAmount,
              senderAccountNumber: senderDetails.accountNumber,
              senderBankName: senderDetails.bankName,
              senderBankCode: senderDetails.bankCode,
              senderName: senderDetails.accountName,
            },
          },
        }),
      ]);

      const paymentTransaction = await tx.paymentTransaction.create({
        data: {
          reference: `${receiptReference}-PAYMENT`,
          userId: member.uid,
          pricingId: paymentRecord.payment,
          companyId: companyUid || null,
          centerId: centerUid,
          amount: payableAmount,
          currency: "NGN",
          paymentId: paymentRecord.id,
          date: new Date(),
          type: newDebt > 0 ? "PART_PAYMENT" : "COMPLETE",
          billing: paymentRecord.frequency || "MONTHLY",
          status: "SUCCESS",
          metadata: {
            receipt,
            paymentReference: paymentRecord.reference,
            split: {
              mainAmount,
              agentAmount,
              technologyAmount,
              fee,
            },
          },
        },
      });

      return { payment: updatedPayment, paymentTransaction };
    });

    const payoutResults = { agent: null, admin: null, technology: null };

    // Initiate Nomba transfer to agent's bank account
    if (agentWallet && agentWallet.accountNo && agentWallet.bank?.code && agentAmount > 0) {
      try {
        const agentTransfer = await nombaTransfer(
          agentAmount,
          agentWallet.accountNo,
          agentWallet.accountName || "Agent",
          agentWallet.bank.code,
          `${receiptReference}-AGENT-TRANSFER`,
          `${senderDetails.accountName || "AMAC Payment Split"}`,
          "Agent wallet payout",
        );

        if (!agentTransfer?.status) {
          console.error("Agent Nomba transfer failed:", agentTransfer?.message);
          payoutResults.agent = {
            attempted: true,
            success: false,
            message: agentTransfer?.message || "Transfer failed",
          };
        } else {
          payoutResults.agent = { attempted: true, success: true };
        }
      } catch (transferError) {
        console.error("Agent Nomba transfer error:", transferError?.message || transferError);
        payoutResults.agent = {
          attempted: true,
          success: false,
          message: transferError?.message || "Transfer error",
        };
      }
    } else {
      const reason = !agentWallet
        ? "No agent wallet found"
        : !agentWallet.accountNo
          ? "Agent wallet missing account number"
          : "Agent wallet missing bank code";
      payoutResults.agent = { attempted: false, success: false, message: reason };
    }

    // Initiate Nomba transfer to admin's bank account
    if (mainWallet && mainWallet.accountNo && mainWallet.bank?.code && mainAmount > 0) {
      try {
        const adminTransfer = await nombaTransfer(
          mainAmount,
          mainWallet.accountNo,
          mainWallet.accountName || "Admin",
          mainWallet.bank.code,
          `${receiptReference}-ADMIN-TRANSFER`,
          `${senderDetails.accountName || "AMAC Payment Split"}`,
          "Admin wallet payout",
        );

        if (!adminTransfer?.status) {
          console.error("Admin Nomba transfer failed:", adminTransfer?.message);
          payoutResults.admin = {
            attempted: true,
            success: false,
            message: adminTransfer?.message || "Transfer failed",
          };
        } else {
          payoutResults.admin = { attempted: true, success: true };
        }
      } catch (transferError) {
        console.error("Admin Nomba transfer error:", transferError?.message || transferError);
        payoutResults.admin = {
          attempted: true,
          success: false,
          message: transferError?.message || "Transfer error",
        };
      }
    } else {
      const reason = !mainWallet
        ? "No admin wallet found"
        : !mainWallet.accountNo
          ? "Admin wallet missing account number"
          : "Admin wallet missing bank code";
      payoutResults.admin = { attempted: false, success: false, message: reason };
    }

    // Initiate Nomba transfer to IT / Technology account
    if (
      technologyWallet &&
      technologyWallet.accountNo &&
      technologyWallet.bank?.code &&
      itCreditAmount > 0
    ) {
      try {
        const techTransfer = await nombaTransfer(
          itCreditAmount,
          technologyWallet.accountNo,
          technologyWallet.accountName || "IT",
          technologyWallet.bank.code,
          `${receiptReference}-IT-TRANSFER`,
          `${senderDetails.accountName || "AMAC Payment Split"}`,
          "IT wallet payout",
        );

        if (!techTransfer?.status) {
          console.error("IT Nomba transfer failed:", techTransfer?.message);
          payoutResults.technology = {
            attempted: true,
            success: false,
            message: techTransfer?.message || "Transfer failed",
          };
        } else {
          payoutResults.technology = { attempted: true, success: true };
        }
      } catch (transferError) {
        console.error("IT Nomba transfer error:", transferError?.message || transferError);
        payoutResults.technology = {
          attempted: true,
          success: false,
          message: transferError?.message || "Transfer error",
        };
      }
    } else {
      const reason = !technologyWallet
        ? "No IT wallet found"
        : !technologyWallet.accountNo
          ? "IT wallet missing account number"
          : "IT wallet missing bank code";
      payoutResults.technology = { attempted: false, success: false, message: reason };
    }

    // Persist payout outcomes onto transaction records
    try {
      const [agentTxRecord, adminTxRecord, itTxRecord] = await Promise.all([
        prisma.transaction.findUnique({
          where: { reference: `${receiptReference}-AGENT` },
          select: { metadata: true },
        }),
        prisma.transaction.findUnique({
          where: { reference: `${receiptReference}-ADMIN` },
          select: { metadata: true },
        }),
        prisma.transaction.findUnique({
          where: { reference: `${receiptReference}-IT` },
          select: { metadata: true },
        }),
      ]);

      await Promise.all([
        payoutResults.agent.attempted
          ? prisma.transaction.update({
              where: { reference: `${receiptReference}-AGENT` },
              data: {
                status: payoutResults.agent.success ? "SUCCESS" : "PAYOUT_FAILED",
                metadata: {
                  ...(agentTxRecord?.metadata || {}),
                  payout: payoutResults.agent,
                },
              },
            })
          : null,
        payoutResults.admin.attempted
          ? prisma.transaction.update({
              where: { reference: `${receiptReference}-ADMIN` },
              data: {
                status: payoutResults.admin.success ? "SUCCESS" : "PAYOUT_FAILED",
                metadata: {
                  ...(adminTxRecord?.metadata || {}),
                  payout: payoutResults.admin,
                },
              },
            })
          : null,
        payoutResults.technology.attempted
          ? prisma.transaction.update({
              where: { reference: `${receiptReference}-IT` },
              data: {
                status: payoutResults.technology.success ? "SUCCESS" : "PAYOUT_FAILED",
                metadata: {
                  ...(itTxRecord?.metadata || {}),
                  payout: payoutResults.technology,
                },
              },
            })
          : null,
      ].filter(Boolean));
    } catch (persistError) {
      console.error(
        "Failed to persist payout status:",
        persistError?.message || persistError,
      );
    }

    const agentPayoutOk =
      payoutResults.agent.success ||
      (!payoutResults.agent.attempted &&
        payoutResults.agent.message === "No agent wallet found");
    const adminPayoutOk =
      payoutResults.admin.success ||
      (!payoutResults.admin.attempted &&
        payoutResults.admin.message === "No admin wallet found");
    const allPayoutsOk = agentPayoutOk && adminPayoutOk;

    return {
      ok: true,
      message: allPayoutsOk
        ? "Payment initiated, split and transfers completed successfully"
        : "Payment recorded and wallets credited, but one or more bank transfers require attention",
      data: {
        payment: paymentResult.payment,
        paymentTransaction: paymentResult.paymentTransaction,
        amountBreakdown: {
          grossAmount: payableAmount,
          fee,
          netAmount: netTotal,
        },
        split: {
          mainWallet: mainAmount,
          agentWallet: agentAmount,
          technologyWallet: itCreditAmount,
          breakdown: {
            main: mainAmount,
            agent: agentAmount,
            technology: technologyAmount,
          },
        },
        payouts: payoutResults,
        receipt,
      },
    };
  } catch (err) {
    console.error("executeUnifiedPayment error:", err);
    return {
      ok: false,
      message: err?.message || "Server error",
    };
  }
};

const paymentProcess = async (
  amount,
  center,
  company,
  userId,
  paymentId,
  direct = false,
) => {
  return executeUnifiedPayment({
    amount,
    center,
    company,
    userId,
    paymentId,
    directWalletDebit: Boolean(direct),
    channel: "wallet",
  });
};

const makePayment = async (req, res) => {
  try {
    const { error, value } = makePaymentSchema.validate(req.body, {
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

    const { amount, center, company } = value;
    const { userId, paymentId } = req.params;

    const paymentResponse = await executeUnifiedPayment({
      amount,
      center,
      company,
      userId,
      paymentId,
      directWalletDebit: true,
      channel: "wallet",
    });

    if (!paymentResponse.ok) {
      return res.status(400).json(paymentResponse);
    }

    return res.status(201).json(paymentResponse);
  } catch (err) {
    console.error("makePayment error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { error, value } = makePaymentSchema.validate(req.body, {
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

    const { amount, center, company } = value;
    const { userId, paymentId } = req.params;

    const paymentResponse = await executeUnifiedPayment({
      amount,
      center,
      company,
      userId,
      paymentId,
      directWalletDebit: false,
      channel: "web",
    });

    if (!paymentResponse.ok) {
      return res.status(400).json(paymentResponse);
    }

    return res.status(200).json(paymentResponse);
  } catch (err) {
    console.error("confirmPayment error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error",
    });
  }
};

const paymentSplit = async (
  amount,
  center,
  company,
  userId,
  paymentId,
  agentId,
) => {
  return executeUnifiedPayment({
    amount,
    center,
    company,
    userId,
    paymentId,
    agentId,
    directWalletDebit: false,
    channel: "pos",
  });
};

export {
  createPayment,
  getPaymentsByUserId,
  getPaymentByReference,
  getPaymentById,
  getAllPayments,
  verifyPayment,
  updatePaymentSchedule,
  makePayment,
  createPaymentRecord,
  createRecurringPaymentForPayment,
  generatePaymentReference,
  getNextDueDate,
  getPaymentsByPartnerId,
  getPaymentsByCenterId,
  getPaymentForUser,
  confirmPayment,
  paymentSplit,
  paymentProcess,
  executeUnifiedPayment,
};
