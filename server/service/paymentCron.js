import cron from 'node-cron';
import { prisma } from '../config/db.js';
import {
  createRecurringPaymentForPayment,
  createPaymentRecord,
  getNextDueDate,
} from '../controller/paymentController.js';

let paymentCronStarted = false;

// Allowed payment statuses eligible for recurring recreation
const RECURRING_ELIGIBLE_STATUSES = ['PENDING', 'SUCCESS', 'PAID', 'COMPLETED'];

export const startPaymentCron = () => {
  if (paymentCronStarted) {
    return;
  }

  paymentCronStarted = true;

  // Run hourly at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      // End of current date (23:59:59.999) ensures payments due today (equal to current date) or earlier are matched
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      console.log(`[Payment Cron] Running recurring check at ${now.toISOString()}...`);

      // 1. Fetch payments where status is PENDING, SUCCESS, PAID, or COMPLETED and due date is on or before current date
      const duePayments = await prisma.payment.findMany({
        where: {
          status: {
            in: RECURRING_ELIGIBLE_STATUSES,
          },
          due: {
            lte: endOfToday,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log(`[Payment Cron] Found ${duePayments.length} payments due on or before ${now.toISOString().slice(0, 10)} eligible for renewal.`);

      for (const payment of duePayments) {
        const nextDueDate = getNextDueDate(payment.due, payment.frequency);
        const startOfNextDueDay = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth(), nextDueDate.getDate(), 0, 0, 0);
        const endOfNextDueDay = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth(), nextDueDate.getDate(), 23, 59, 59, 999);

        // Check whether a recurring payment for the next cycle has already been created
        const alreadyRenewed = await prisma.payment.findFirst({
          where: {
            userId: payment.userId,
            payment: payment.payment,
            OR: [
              {
                due: {
                  gte: startOfNextDueDay,
                  lte: endOfNextDueDay,
                },
              },
              {
                createdAt: { gt: payment.createdAt },
                due: { gt: payment.due },
              },
            ],
          },
          select: { id: true },
        });

        if (alreadyRenewed) {
          continue;
        }

        const result = await createRecurringPaymentForPayment(payment, prisma);
        if (result.created) {
          console.log(
            `[Payment Cron] Recreated recurring payment ${result.payment.reference} for user ${payment.userId} (Due: ${new Date(result.payment.due).toLocaleDateString()}, Previous Status: ${payment.status})`
          );
        }
      }

      // 2. Ensure active members with assigned pricing plans have an active payment record
      const members = await prisma.member.findMany({
        where: { status: true },
        select: { uid: true, pricing: true, center: true, company: true },
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

        // If member already has a payment whose due date is in the future, nothing to do
        if (latestPayment && new Date(latestPayment.due) > endOfToday) {
          continue;
        }

        let dueDate;
        if (latestPayment) {
          dueDate = getNextDueDate(latestPayment.due, pricingFrequency);
        } else {
          dueDate = now;
        }

        const startOfNextDueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 0, 0, 0);
        const endOfNextDueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999);

        // Check if next payment already exists
        const nextExists = await prisma.payment.findFirst({
          where: {
            userId: member.uid,
            payment: selectedPricing.id,
            due: {
              gte: startOfNextDueDay,
              lte: endOfNextDueDay,
            },
          },
          select: { id: true },
        });

        if (nextExists) continue;

        try {
          const seeded = await createPaymentRecord(
            {
              userId: member.uid,
              frequency: pricingFrequency,
              sessions: [],
              debt: 0,
              due: dueDate,
              amount: Number(selectedPricing.price),
              payment: selectedPricing.id,
              centerId: member.center || null,
              companyId: member.company || null,
              status: 'PENDING',
              isVerify: false,
            },
            prisma
          );

          console.log(`[Payment Cron] Seeded payment ${seeded.reference} for member ${member.uid}`);
        } catch (err) {
          console.error('[Payment Cron] Failed to seed payment for member', member.uid, err?.message || err);
        }
      }
    } catch (error) {
      console.error('[Payment Cron] Execution error:', error?.message || error);
    }
  });
};

export default {
  startPaymentCron,
};