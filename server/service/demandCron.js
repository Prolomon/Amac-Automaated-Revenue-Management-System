import cron from "node-cron";
import { prisma } from "../config/db.js";
import { sendDemandNoticeEmail } from "./mail.js";
import { createDemandNoticePdf } from "./demandPdf.js";

let demandCronStarted = false;
let demandEmailCronStarted = false;
let isGeneratingDemands = false;
let isSendingEmails = false;

/**
 * 1. Demand Generation Job:
 * Checks payments with status "PENDING".
 * - If a demand notice with the same userId and payment reference (or paymentId) already exists,
 *   it updates the existing demand notice with (amount - paid).
 * - Else, generates a new demand notice with (amount - paid).
 */
export const processDemandGeneration = async () => {
  if (isGeneratingDemands) {
    console.log(
      "[Demand Generation] Previous run still in progress, skipping.",
    );
    return;
  }
  isGeneratingDemands = true;

  try {
    console.log(
      "[Demand Generation] Cron started at",
      new Date().toISOString(),
    );

    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        member: true,
      },
    });

    if (pendingPayments.length === 0) {
      console.log("[Demand Generation] No PENDING payments found");
      return;
    }

    console.log(
      `[Demand Generation] Found ${pendingPayments.length} pending payments to process`,
    );

    for (const payment of pendingPayments) {
      try {
        const remainingAmount = Math.max(
          0,
          Number(payment.amount || 0) - Number(payment.paid || 0),
        );

        // Check if a demand notice already exists for this user and payment
        const existingDemand = await prisma.demand.findFirst({
          where: {
            userId: payment.userId,
            OR: [
              { paymentId: payment.id },
              ...(payment.reference ? [{ reference: payment.reference }] : []),
            ],
          },
        });

        if (existingDemand) {
          // Update the existing demand notice based on amount - paid
          await prisma.demand.update({
            where: { id: existingDemand.id },
            data: {
              amount: remainingAmount,
              reference: payment.reference || existingDemand.reference,
              center: payment.center || existingDemand.center,
              walletId: payment.walletId || existingDemand.walletId,
              status: remainingAmount <= 0 ? "PAID" : existingDemand.status,
            },
          });
          console.log(
            `[Demand Generation] Updated existing demand ${existingDemand.id} for payment ${payment.id} with remaining amount ${remainingAmount}`,
          );
        } else {
          // Resolve wallet for taxpayer if not set on payment
          let walletId = payment.walletId;
          if (!walletId && payment.userId) {
            const userWallet = await prisma.wallet.findFirst({
              where: { userId: payment.userId },
              select: { id: true },
            });
            walletId = userWallet ? userWallet.id : null;
          }
          if (!walletId && payment.member?.agent) {
            const agentWallet = await prisma.wallet.findFirst({
              where: { userId: payment.member.agent },
              select: { id: true },
            });
            walletId = agentWallet ? agentWallet.id : null;
          }

          const referenceNo =
            payment.reference ||
            `DN-${payment.id.substring(0, 10).toUpperCase()}`;

          await prisma.demand.create({
            data: {
              userId: payment.userId,
              paymentId: payment.id,
              reference: referenceNo,
              amount: remainingAmount,
              center:
                payment.center || payment.member?.center || "HEADQUARTERS",
              walletId: walletId || null,
              status: remainingAmount <= 0 ? "PAID" : "CREATED",
              isSent: false,
            },
          });

          await prisma.payment.update({
            where: { id: payment.id },
            data: { idDemand: true },
          });

          console.log(
            `[Demand Generation] Generated new demand notice for payment ${payment.id}, reference: ${referenceNo}`,
          );
        }
      } catch (err) {
        console.error(
          `[Demand Generation] Error processing payment ${payment.id}:`,
          err,
        );
      }
    }

    console.log("[Demand Generation] Completed at", new Date().toISOString());
  } catch (error) {
    console.error("[Demand Generation] Cron error:", error);
  } finally {
    isGeneratingDemands = false;
  }
};

/**
 * 2. Dedicated Demand Mail Job:
 * Finds unsent demand notices, generates official PDFs via pure pdf-lib,
 * and sends email notifications.
 */
export const processDemandEmails = async () => {
  if (isSendingEmails) {
    console.log(
      "[Demand Email Cron] Previous email run still in progress, skipping.",
    );
    return;
  }
  isSendingEmails = true;

  try {
    console.log("[Demand Email Cron] Started at", new Date().toISOString());

    const unsentDemands = await prisma.demand.findMany({
      where: {
        isSent: false,
        status: { in: ["CREATED", "PENDING"] },
        amount: { gt: 0 },
      },
      include: {
        member: true,
        payment: true,
        wallet: true,
      },
    });

    if (unsentDemands.length === 0) {
      console.log("[Demand Email Cron] No unsent demand notices to email");
      return;
    }

    console.log(
      `[Demand Email Cron] Found ${unsentDemands.length} unsent demand notices`,
    );

    for (const demand of unsentDemands) {
      try {
        const member = demand.member || demand.payment?.member;
        if (!member || !member.email) {
          console.warn(
            `[Demand Email Cron] Demand ${demand.id} has no member email, skipping.`,
          );
          continue;
        }

        const payment = demand.payment;
        if (!payment) {
          console.warn(
            `[Demand Email Cron] Payment missing for demand ${demand.id}, skipping.`,
          );
          continue;
        }

        // Fetch pricing record if available
        let pricing = null;
        if (payment.payment) {
          pricing = await prisma.pricing.findUnique({
            where: { id: payment.payment },
          });
        }

        // Ensure wallet details are resolved
        let wallet = demand.wallet;
        if (!wallet && demand.userId) {
          wallet = await prisma.wallet.findFirst({
            where: { userId: demand.userId },
          });
        }
        if (!wallet && member.agent) {
          wallet = await prisma.wallet.findFirst({
            where: { userId: member.agent },
          });
        }

        // Generate PDF using pure pdf-lib (zero browser dependency)
        const pdfBuffer = await createDemandNoticePdf({
          demand,
          member,
          payment,
          wallet,
          pricing,
        });

        const memberName = member.businessName || member.fullname || "Taxpayer";
        const referenceNo = demand.reference || payment.reference || demand.id;
        const subject = `Official AMAC Demand Notice - ${referenceNo} - ${memberName}`;
        const formattedAmount = `NGN ${Number(demand.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #15803d; padding: 16px 20px; border-radius: 8px 8px 0 0; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px;">ABUJA MUNICIPAL AREA COUNCIL</h2>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Unified Revenue & Compliance Directorate</p>
            </div>
            <div style="padding: 24px 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
              <p>Dear <strong>${memberName}</strong>,</p>
              <p>Please find attached your official AMAC Demand Notice under reference <strong>AMAC/DN/${referenceNo}</strong>.</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #15803d; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; color: #64748b;">Total Compliance Assessment Due:</p>
                <p style="margin: 4px 0 0 0; font-size: 22px; font-weight: bold; color: #0f172a;">${formattedAmount}</p>
              </div>
              <p>Please review the attached PDF document for your complete liability breakdown, statutory schedule, and approved settlement instructions.</p>
              <p style="font-size: 13px; color: #64748b; margin-top: 24px;">This is an official computer-generated notice. If you have already completed payment for this assessment, please disregard this notice.</p>
            </div>
          </div>
        `;

        const filename = `AMAC_Demand_Notice_${referenceNo.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
        const emailResult = await sendDemandNoticeEmail(
          member.email,
          subject,
          emailHtml,
          pdfBuffer,
          filename,
        );

        if (emailResult.ok) {
          await prisma.demand.update({
            where: { id: demand.id },
            data: {
              status: "PENDING",
              isSent: true,
            },
          });
          console.log(
            `[Demand Email Cron] Sent demand notice to ${member.email} for demand ${demand.id}`,
          );
        } else {
          console.error(
            `[Demand Email Cron] Failed to send email to ${member.email}:`,
            emailResult.error,
          );
        }
      } catch (err) {
        console.error(
          `[Demand Email Cron] Error emailing demand ${demand.id}:`,
          err,
        );
      }
    }

    console.log("[Demand Email Cron] Completed at", new Date().toISOString());
  } catch (error) {
    console.error("[Demand Email Cron] Cron error:", error);
  } finally {
    isSendingEmails = false;
  }
};

/**
 * Backward-compatible helper that runs both generation and email sender
 */
export const processDemands = async () => {
  await processDemandGeneration();
  await processDemandEmails();
};

/**
 * Start the Demand Generation Cron
 */
export const startDemandCron = () => {
  if (demandCronStarted) {
    return;
  }
  demandCronStarted = true;

  // Run once on startup after 10s to allow DB connection to initialize
  setTimeout(() => {
    console.log("[Demand Generation] Running startup check...");
    processDemandGeneration();
  }, 10000);

  // Run every 10 minutes
  cron.schedule("*/10 * * * *", processDemandGeneration);
  console.log(
    "[Demand Generation] Cron scheduled successfully (every 10 minutes)",
  );
};

/**
 * Start the Demand Email Sender Cron
 */
export const startDemandEmailCron = () => {
  if (demandEmailCronStarted) {
    return;
  }
  demandEmailCronStarted = true;

  // Run once on startup after 15s
  setTimeout(() => {
    console.log("[Demand Email Cron] Running startup check...");
    processDemandEmails();
  }, 15000);

  // Run every 7 hours
  cron.schedule("0 0 * * *", async () => {
    const lastRun = await getLastRunTimestamp(); // however you persist this
    const daysSince = (Date.now() - lastRun) / (1000 * 60 * 60 * 24);
    if (daysSince >= 7) {
      await processDemandEmails();
      await setLastRunTimestamp(Date.now());
    }
  });
  console.log(
    "[Demand Email Cron] Cron scheduled successfully (every 7 hours)",
  );
};
