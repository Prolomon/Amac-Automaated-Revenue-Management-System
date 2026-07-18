import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { createRecurringPaymentForPayment, createPaymentRecord, getNextDueDate } from '../controller/paymentController.js';

let paymentCronStarted = false;

export const startPaymentCron = () => {
  if (paymentCronStarted) {
    return;
  }

  paymentCronStarted = true;

  // Run hourly at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      // Find payments where the due date has passed (overdue for next cycle)
      const now = new Date();

      const duePayments = await prisma.payment.findMany({
        where: {
          due: {
            lte: now,
          },
          status: {
            in: ['SUCCESS', 'PENDING'],
          },
        },
      });

      for (const payment of duePayments) {
        await createRecurringPaymentForPayment(payment, prisma);
      }

      // Seed payments for members who have pricing but no upcoming payments
      const members = await prisma.member.findMany({
        where: { status: true },
        select: { uid: true, pricing: true },
      });

      for (const member of members) {
        if (!member.pricing || member.pricing.length === 0) continue;

        // Find first active pricing WITH its frequency
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

        // Get the frequency from the pricing model (NOT from member.billingFrequency)
        const pricingFrequency = selectedPricing.frequency || 'MONTHLY';

        // Find the latest payment for the member for this specific pricing
        const latestPayment = await prisma.payment.findFirst({
          where: {
            userId: member.uid,
            payment: selectedPricing.id,
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, due: true, createdAt: true, frequency: true },
        });

        // If they have a future/upcoming payment (not yet due) => skip
        if (latestPayment && new Date(latestPayment.due) > new Date()) {
          continue; // already has an upcoming payment
        }

        // Determine the allowed gap based on the pricing's frequency
        const allowedGapMs = getFrequencyDurationMs(pricingFrequency);

        // Check if enough time has passed since the last payment was created
        // based on the pricing frequency duration
        if (latestPayment) {
          const diffMs = Date.now() - new Date(latestPayment.createdAt).getTime();
          if (diffMs < allowedGapMs) {
            // Not enough time has passed since the last payment was created
            continue;
          }
        }

        // Calculate the next due date based on the latest payment's due date + pricing frequency
        const dueDate = latestPayment
          ? getNextDueDate(latestPayment.due, pricingFrequency)
          : new Date();

        try {
          await createPaymentRecord({
            userId: member.uid,
            frequency: pricingFrequency, // Use the pricing's frequency, NOT member.billingFrequency
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

/**
 * Get the duration in milliseconds for a given billing frequency.
 * This determines the allowed gap window for auto-seeding payments.
 */
function getFrequencyDurationMs(frequency) {
  const normalized = String(frequency || 'MONTHLY').toUpperCase();
  switch (normalized) {
    case 'DAILY':
      return 24 * 60 * 60 * 1000; // 1 day
    case 'WEEKLY':
      return 7 * 24 * 60 * 60 * 1000; // 7 days
    case 'BIWEEKLY':
      return 14 * 24 * 60 * 60 * 1000; // 14 days
    case 'QUARTERLY':
      return 90 * 24 * 60 * 60 * 1000; // ~90 days
    case 'YEARLY':
      return 365 * 24 * 60 * 60 * 1000; // 365 days
    case 'MONTHLY':
    default:
      return 30 * 24 * 60 * 60 * 1000; // 30 days
  }
}