import { prisma } from "../config/db.js";
import {
  createPaymentSchema,
  updatePaymentScheduleSchema,
  makePaymentSchema,
} from "../validator/paymentValidator.js";
import { customAlphabet } from "nanoid";
import { executeUnifiedPayment } from "../core/payment.js";
import { sendPaymentCreatedEmail, sendPaymentPendingEmail } from "../core/mail.js";
import { sendPaymentCreatedSms, sendPaymentPendingSms } from "../core/sms.js";
import { sendPaymentCreatedWhatsApp, sendPaymentPendingWhatsApp } from "../core/whatsapp.js";


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

const notifyPaymentCreated = async (payment, client = prisma) => {
  if (!payment) return;

  try {
    const notificationType = payment.status === "SUCCESS" ? "SUCCESS" : "PENDING";
    const notificationTitle =
      payment.status === "SUCCESS" ? "Payment Successful" : "New Payment Bill Issued";
    const notificationDescription =
      payment.status === "SUCCESS"
        ? `Your payment of ₦${Number(payment.amount).toLocaleString()} has been processed successfully.`
        : `A new revenue bill of ₦${Number(payment.amount).toLocaleString()} (Ref: ${payment.reference}) has been issued, due on ${new Date(payment.due).toLocaleDateString()}.`;

    await client.notification.create({
      data: {
        userId: payment.userId,
        title: notificationTitle,
        description: notificationDescription,
        type: notificationType,
        date: new Date(),
      },
    }).catch((e) => console.warn("Failed to create in-app notification:", e?.message));
  } catch (notificationError) {
    console.warn("Notification creation error:", notificationError?.message || notificationError);
  }

  try {
    const payingMember = await client.member.findUnique({
      where: { uid: payment.userId },
      select: { email: true, phone: true, fullname: true, businessName: true },
    });

    if (payingMember) {
      const recipientName = payingMember.fullname || payingMember.businessName || "Taxpayer";
      const payload = {
        name: recipientName,
        reference: payment.reference,
        amount: payment.amount,
        planId: payment.id,
        dueDate: payment.due,
        frequency: payment.frequency,
      };

      const tasks = [];

      // Email notifications
      if (payingMember.email) {
        tasks.push(
          sendPaymentCreatedEmail({ ...payload, to: payingMember.email }).catch((err) =>
            console.warn("Payment created email warning:", err?.message)
          )
        );
        if (payment.status === "PENDING") {
          tasks.push(
            sendPaymentPendingEmail({ ...payload, to: payingMember.email }).catch((err) =>
              console.warn("Payment pending email warning:", err?.message)
            )
          );
        }
      }

      // SMS notifications
      if (payingMember.phone) {
        tasks.push(
          sendPaymentCreatedSms({ ...payload, to: payingMember.phone, phone: payingMember.phone }).catch((err) =>
            console.warn("Payment created SMS warning:", err?.message)
          )
        );
        if (payment.status === "PENDING") {
          tasks.push(
            sendPaymentPendingSms({ ...payload, to: payingMember.phone, phone: payingMember.phone }).catch((err) =>
              console.warn("Payment pending SMS warning:", err?.message)
            )
          );
        }
      }

      // WhatsApp notifications
      if (payingMember.phone) {
        tasks.push(
          sendPaymentCreatedWhatsApp({ ...payload, to: payingMember.phone, phone: payingMember.phone }).catch((err) =>
            console.warn("Payment created WhatsApp warning:", err?.message)
          )
        );
        if (payment.status === "PENDING") {
          tasks.push(
            sendPaymentPendingWhatsApp({ ...payload, to: payingMember.phone, phone: payingMember.phone }).catch((err) =>
              console.warn("Payment pending WhatsApp warning:", err?.message)
            )
          );
        }
      }

      await Promise.allSettled(tasks);
    }
  } catch (err) {
    console.warn("Multi-channel payment notification error:", err?.message);
  }
};

const createRecurringPaymentForPayment = async (payment, client = prisma) => {
  const nextDueDate = getNextDueDate(payment.due, payment.frequency);
  const startOfNextDueDay = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth(), nextDueDate.getDate(), 0, 0, 0);
  const endOfNextDueDay = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth(), nextDueDate.getDate(), 23, 59, 59, 999);

  // Check if a payment for this cycle already exists
  const existingNextPayment = await client.payment.findFirst({
    where: {
      userId: payment.userId,
      payment: payment.payment,
      due: {
        gte: startOfNextDueDay,
        lte: endOfNextDueDay,
      },
    },
    select: { id: true },
  });

  if (existingNextPayment) {
    return { created: false, payment: null };
  }

  // Calculate accumulated debt:
  // If previous payment was settled (PAID, COMPLETED, SUCCESS), debt carried over is 0.
  // If previous payment was PENDING, unpaid amount is carried over into debt.
  let accumulatedDebt = 0;
  const isSettled = ["PAID", "COMPLETED", "SUCCESS"].includes(String(payment.status).toUpperCase());
  if (isSettled) {
    accumulatedDebt = 0;
  } else {
    const unpaidAmount = Math.max(0, Number(payment.amount || 0) - Number(payment.paid || 0));
    accumulatedDebt = Number(payment.debt || 0) + unpaidAmount;
  }

  const uniqueId = await generateUniquePaymentId(client);

  const nextPayment = await client.payment.create({
    data: {
      id: uniqueId,
      reference: generatePaymentReference(),
      userId: payment.userId,
      frequency: payment.frequency,
      sessions: normalizeSessions(payment.sessions),
      debt: accumulatedDebt,
      due: nextDueDate,
      amount: Number(payment.amount),
      payment: payment.payment,
      centerId: payment.centerId || null,
      companyId: payment.companyId || null,
      status: "PENDING",
      isVerify: false,
    },
  });

  void notifyPaymentCreated(nextPayment, client).catch((err) => {
    console.warn("Recurring payment notification error:", err?.message || err);
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

    void notifyPaymentCreated(payment, prisma).catch((err) => {
      console.warn("Create payment notification error:", err?.message || err);
    });

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

    if (!id || String(id).trim() === "") {
      return res
        .status(400)
        .json({ ok: false, message: "User ID or Payment Reference is required" });
    }

    const trimmedId = String(id).trim();

    // 1. Try finding Member by uid, phone, or email
    let member = await prisma.member.findFirst({
      where: {
        OR: [{ uid: trimmedId }, { phone: trimmedId }, { email: trimmedId }],
      },
    });

    let agent = null;
    let wallet = null;

    if (member) {
      let payments = [];
      try {
        payments = await prisma.payment.findMany({
          where: { userId: member.uid },
          include: { member: true, pricing: true },
          orderBy: { createdAt: "desc" },
        });
      } catch (relationErr) {
        console.warn("Payment pricing relation lookup failed, falling back:", relationErr?.message);
        payments = await prisma.payment.findMany({
          where: { userId: member.uid },
          include: { member: true },
          orderBy: { createdAt: "desc" },
        });
      }

      // Fetch agent if assigned (Agent is optional; do not throw or 500 if missing)
      if (member.agent) {
        agent = await prisma.agent.findFirst({
          where: { uid: member.agent },
        }).catch((e) => {
          console.warn("Could not find agent record:", e?.message);
          return null;
        });
      }

      // Find member wallet, agent wallet, or fallback to admin wallet
      wallet = await prisma.wallet.findFirst({
        where: { userId: member.uid },
      });

      if (!wallet && member.agent) {
        wallet = await prisma.wallet.findFirst({
          where: { userId: member.agent },
        });
      }

      if (!wallet) {
        wallet = await prisma.wallet.findFirst({
          where: { role: "ADMIN" },
        });
      }

      const paymentList = payments.map((payment) => ({
        payment,
        wallet,
      }));

      return res.status(200).json({
        ok: true,
        data: { payments: paymentList, member, agent },
      });
    } else {
      // 2. Lookup by Payment reference, primary key id, or billing code
      let payment = null;
      try {
        payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { reference: trimmedId },
              { id: trimmedId },
              { payment: trimmedId },
            ],
          },
          include: { member: true, pricing: true },
        });
      } catch (relationErr) {
        console.warn("Payment pricing relation lookup failed, falling back:", relationErr?.message);
        payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { reference: trimmedId },
              { id: trimmedId },
              { payment: trimmedId },
            ],
          },
          include: { member: true },
        });
      }

      if (!payment) {
        return res
          .status(404)
          .json({ ok: false, message: "Payment or User record not found" });
      }

      member = payment.member || (await prisma.member.findFirst({
        where: { uid: payment.userId },
      }));

      if (!member) {
        return res.status(404).json({
          ok: false,
          message: "Member associated with this payment not found",
        });
      }

      const agentUid = member.agent || payment?.member?.agent;
      if (agentUid) {
        agent = await prisma.agent.findFirst({
          where: { uid: agentUid },
        }).catch((e) => {
          console.warn("Could not find agent record:", e?.message);
          return null;
        });
      }

      wallet = await prisma.wallet.findFirst({
        where: { userId: member.uid },
      });

      if (!wallet && member.agent) {
        wallet = await prisma.wallet.findFirst({
          where: { userId: member.agent },
        });
      }

      if (!wallet) {
        wallet = await prisma.wallet.findFirst({
          where: { role: "ADMIN" },
        });
      }

      return res.status(200).json({
        ok: true,
        data: {
          payments: [{ payment, wallet }],
          agent,
          member,
        },
      });
    }
  } catch (err) {
    console.error("getPaymentForUser error:", err);
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
