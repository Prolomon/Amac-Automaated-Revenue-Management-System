import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { createRecurringPaymentForPayment, createPaymentRecord, getNextDueDate } from '../controller/paymentController.js';

let paymentCronStarted = false;

export const startPaymentCron = () => {
  if (paymentCronStarted) {
    return;
  }

  paymentCronStarted = true;

  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();

      const duePayments = await prisma.payment.findMany({
        where: {
          due: {
            lte: now,
          },
        },
      });

      for (const payment of duePayments) {
        // BUG FIX: previously, once a payment's `due` date passed, it kept
        // matching `due: { lte: now }` on every hourly cron run forever —
        // nothing checked whether a recurring payment for the *next* cycle
        // had already been created. That caused a brand new payment to be
        // generated every hour for as long as the overdue payment sat in
        // the table, instead of once per billing cycle.
        const alreadyRenewed = await prisma.payment.findFirst({
          where: {
            userId: payment.userId,
            payment: payment.payment, // same pricing plan
            createdAt: { gt: payment.createdAt },
          },
          select: { id: true },
        }); 

        if (alreadyRenewed) continue;

        await createRecurringPaymentForPayment(payment, prisma);
      }

      const members = await prisma.member.findMany({
        where: { status: true },
        select: { uid: true, pricing: true },
      });

      for (const member of members) {
        if (!member.pricing || member.pricing.length === 0) continue;

        let selectedPricing = null;
        for (const pid of member.pricing || []) {
          const p = await prisma.pricing.findUnique({
            where: { id: pid },
            select: { id: true, price: true, status: true, frequency: true },
          });
          if (p?.status) {
            selectedPricing = p;
            break;
          }
        }

        if (!selectedPricing) continue;

        const pricingFrequency = selectedPricing.frequency || 'MONTHLY';

        const latestPayment = await prisma.payment.findFirst({
          where: {
            userId: member.uid,
            payment: selectedPricing.id,
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, due: true, createdAt: true, frequency: true },
        });

        if (latestPayment && new Date(latestPayment.due) > now) {
          continue;
        }

        // BUG FIX: previously, even after confirming the current cycle was
        // already overdue (the check above), this computed nextDueDate one
        // full period PAST that due date and then waited for that to also
        // pass before creating anything — silently skipping an entire
        // billing cycle for the member. The overdue check above already
        // establishes it's time to renew, so just use that next due date
        // directly instead of gating on it again.
        let dueDate;
        if (latestPayment) {
          dueDate = getNextDueDate(latestPayment.due, pricingFrequency);
        } else {
          dueDate = new Date();
        }

        try {
          await createPaymentRecord({
            userId: member.uid,
            frequency: pricingFrequency,
            sessions: [],
            debt: 0,
            due: dueDate,
            amount: Number(selectedPricing.price),
            payment: selectedPricing.id,
            status: 'PENDING',
            isVerify: false,
          }, prisma);
        } catch (err) {
          console.error('Failed to seed payment for member', member.uid, err?.message || err);
        }
      }
    } catch (error) {
      console.error('Payment cron error:', error?.message || error);
    }
  });
};