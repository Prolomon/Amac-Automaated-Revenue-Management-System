import { prisma } from "../config/db.js";
import {
  createPaymentSchema,
  updatePaymentScheduleSchema,
  makePaymentSchema,
} from "../validator/paymentValidator.js";
import { customAlphabet } from "nanoid";
import { executeUnifiedPayment } from "../core/payment.js";
import { sendPaymentCreatedEmail, sendPaymentPendingEmail } from "../core/mail.js";

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

    try {
      const payingMember = await prisma.member.findUnique({
        where: { uid: payment.userId },
        select: { email: true, fullname: true, businessName: true },
      });
      if (payingMember?.email) {
        void sendPaymentCreatedEmail({
          to: payingMember.email,
          name: payingMember.fullname || payingMember.businessName || "Taxpayer",
          reference: payment.reference,
          amount: payment.amount,
          planId: payment.id,
          dueDate: payment.due,
          frequency: payment.frequency,
        }).catch((err) => console.warn("Payment created email warning:", err?.message));

        if (payment.status === "PENDING") {
          void sendPaymentPendingEmail({
            to: payingMember.email,
            name: payingMember.fullname || payingMember.businessName || "Taxpayer",
            reference: payment.reference,
            amount: payment.amount,
            planId: payment.id,
            dueDate: payment.due,
            frequency: payment.frequency,
          }).catch((err) => console.warn("Payment pending email warning:", err?.message));
        }
      }
    } catch (emailErr) {
      console.warn("Payment created email lookup warning:", emailErr?.message);
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
