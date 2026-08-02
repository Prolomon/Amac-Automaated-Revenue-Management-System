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

        let dueDate;
        if (latestPayment) {
          const nextDueDate = getNextDueDate(latestPayment.due, pricingFrequency);
          if (now < nextDueDate) {
            continue;
          }
          dueDate = nextDueDate;
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