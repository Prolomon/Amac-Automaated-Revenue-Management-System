import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../config/db.js';
import { sendDemandNoticeEmail } from './mail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let demandCronStarted = false;
let isProcessing = false;

export const processDemands = async () => {
  if (isProcessing) {
    console.log('Demand processing already in progress, skipping.');
    return;
  }
  isProcessing = true;
  try {
    console.log('Demand cron started at', new Date().toISOString());

    // Find all demand records with CREATED status
    const createdDemands = await prisma.demand.findMany({
      where: {
        status: 'CREATED',
      },
      include: {
        payment: {
          include: {
            member: true,
          },
        },
      },
    });

    console.log(`Found ${createdDemands.length} demand records with CREATED status`);

    if (createdDemands.length === 0) {
      console.log('No CREATED demand notices found to process');
      return;
    }

    // Process each demand individually - one email per demand/payment
    for (const demand of createdDemands) {
      try {
        const member = demand.payment?.member;
        if (!member || !member.email) {
          console.error(`Member not found or no email for userId: ${demand.userId}`);
          continue;
        }

        // Fetch the single payment record for this demand
        const payment = await prisma.payment.findUnique({
          where: { id: demand.paymentId },
        });

        if (!payment) {
          console.error(`Payment not found for demand ${demand.id}`);
          continue;
        }

        // Fetch pricing record
        const pricing = await prisma.pricing.findUnique({
          where: { id: payment.payment },
        });
        const pricingName = pricing?.title || 'Revenue Assessment';

        // Calculate for single payment
        const principal = Number(payment.amount);
        const vat = principal * 0.075;
        const charges = principal * 0.015;
        const subtotal = principal + vat + charges;
        const penalty = subtotal * 0.1;
        const interest = subtotal * 0.05;
        const totalAmount = subtotal + penalty + interest;

        const formatCurrency = (amount) => {
          return Number(amount || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        };

        const formatDate = (date) => {
          const d = new Date(date);
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
          ];
          const day = String(d.getDate()).padStart(2, '0');
          const month = months[d.getMonth()];
          const year = d.getFullYear();
          return `${day} ${month} ${year}`;
        };

        const getAssessmentPeriod = (frequency) => {
          const now = new Date();
          const year = now.getFullYear();
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
          ];
          const currentMonth = months[now.getMonth()];

          switch ((frequency || 'MONTHLY').toUpperCase()) {
            case 'YEARLY':
              return `Jan - Dec ${year}`;
            case 'QUARTERLY': {
              const quarter = Math.floor(now.getMonth() / 3);
              const qStart = months[quarter * 3];
              const qEnd = months[quarter * 3 + 2];
              return `${qStart} - ${qEnd} ${year}`;
            }
            case 'BIWEEKLY': {
              const weekNum = Math.ceil(now.getDate() / 14);
              return `Period ${weekNum} - ${currentMonth} ${year}`;
            }
            case 'WEEKLY': {
              const weekNum = Math.ceil(now.getDate() / 7);
              return `Week ${weekNum} - ${currentMonth} ${year}`;
            }
            case 'DAILY':
              return formatDate(now);
            case 'MONTHLY':
            default:
              return `${currentMonth} ${year}`;
          }
        };

        const liabilityRows = `
          <tr>
            <td>${pricingName} - Principal Assessment</td>
            <td class="amount-col">${formatCurrency(principal)}</td>
          </tr>
          <tr>
            <td>Value Added Tax (VAT) @ 7.5%</td>
            <td class="amount-col">${formatCurrency(vat)}</td>
          </tr>
          <tr>
            <td>Payment Processing Charges @ 1.5%</td>
            <td class="amount-col">${formatCurrency(charges)}</td>
          </tr>
        `;

        // Generate reference numbers - use demand's own reference
        const now = new Date();
        const year = now.getFullYear();
        const referenceNo = demand.reference.replace(/[^A-Z0-9]/g, '/').substring(0, 20);
        const auditTrack = `AUD/${year}/${Math.floor(Math.random() * 999)}`;
        const paymentRef = payment.reference || payment.id.substring(0, 12).toUpperCase();
        const wallet = demand.wallet;
        
        // Build location string
        let locationStr = 'N/A';
        if (member.location) {
          try {
            const loc = typeof member.location === 'string'
              ? JSON.parse(member.location)
              : member.location;
            const parts = [];
            if (loc.address) parts.push(loc.address);
            if (loc.city) parts.push(loc.city);
            if (loc.state) parts.push(loc.state);
            if (loc.lga) parts.push(loc.lga);
            if (loc.country) parts.push(loc.country);
            locationStr = parts.length > 0 ? parts.join(', ') : 'N/A';
          } catch {
            locationStr = String(member.location);
          }
        }

        // Generate QR code URL
        const qrData = JSON.stringify({
          userId: demand.userId,
          paymentId: payment.id,
          amount: totalAmount,
        });
        const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=240`;

        // Read HTML template
        const templatePath = path.join(__dirname, '..', 'service', 'templates', 'index.html');
        
        if (!fs.existsSync(templatePath)) {
          console.error(`Email template not found at ${templatePath}`);
          continue;
        }

        let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');

        // Replace placeholders
        const replacements = {
          '{{MEMBER_NAME}}': member.businessName || member.fullname || 'N/A',
          '{{MEMBER_LOCATION}}': locationStr,
          '{{MEMBER_TIN}}': member.uid,
          '{{REFERENCE_NO}}': 'AMAC/DN/' + year + '/' + referenceNo,
          '{{DATE_OF_ISSUE}}': formatDate(now),
          '{{ASSESSMENT_PERIOD}}': getAssessmentPeriod(payment.frequency || 'MONTHLY'),
          '{{AUDIT_TRACK}}': auditTrack,
          '{{LIABILITY_ROWS}}': liabilityRows,
          '{{SUBTOTAL_AMOUNT}}': formatCurrency(subtotal),
          '{{PENALTY_AMOUNT}}': formatCurrency(penalty),
          '{{INTEREST_AMOUNT}}': formatCurrency(interest),
          '{{TOTAL_AMOUNT}}': formatCurrency(totalAmount),
          '{{QR_CODE_URL}}': qrCodeUrl,
          '{{PAYMENT_REFERENCE}}': paymentRef,
          '{{SETTLEMENT_ACCOUNT_NAME}}': 'AMAC Revenue Account',
          '{{SETTLEMENT_ACCOUNT_NUMBER}}': '1310770007',
          '{{SETTLEMENT_BANK_NAME}}': 'Zenith Bank',
          '{{PAYMENT_ACCOUNT_NAME}}': wallet?.accountName || `Zenith/Amac/${paymentRef}`,
          '{{PAYMENT_ACCOUNT_NUMBER}}': wallet?.accountNo || 'N/A',
          '{{PAYMENT_BANK_NAME}}': wallet?.bank?.name || 'N/A',
        };

        for (const [key, value] of Object.entries(replacements)) {
          htmlTemplate = htmlTemplate.split(key).join(value);
        }

        const memberName = member.businessName || member.fullname || 'Taxpayer';
        const subject = `Demand Notice - ${referenceNo} - ${memberName}`;
        const body = `Dear ${memberName},
          Please find attached your demand notice for the assessment period ${getAssessmentPeriod(payment.frequency || 'MONTHLY')}. The total amount due is ${formatCurrency(totalAmount)}.`

        // Send email
        const emailResult = await sendDemandNoticeEmail(member.email, subject, body, htmlTemplate, `${demand?.member?.businessName || demand?.member?.fullname}-demand-document-${new Date().toISOString().split('T')[0]}.pdf`,);

        if (emailResult.ok) {
          // Update this specific demand record to PENDING
          await prisma.demand.update({
            where: { id: demand.id },
            data: {
              status: 'PENDING',
              isSent: true,
            },
          });
          console.log(`Successfully sent demand notice to ${member.email} for demand ${demand.id}`);
        } else {
          console.error(`Failed to send demand notice to ${member.email} for demand ${demand.id}:`, emailResult.error);
        }
      } catch (err) {
        console.error(`Error processing demand ${demand.id}:`, err);
      }
    }

    console.log('Demand cron completed at', new Date().toISOString());
  } catch (error) {
    console.error('Demand cron error:', error);
  } finally {
    isProcessing = false;
  }
};

export const startDemandCron = () => {
  if (demandCronStarted) {
    return;
  }

  demandCronStarted = true;

  // Run once on startup after 10 seconds to allow DB/Prisma to initialize
  setTimeout(() => {
    console.log('Running startup demand cron check...');
    processDemands();
  }, 10000);

  // Run every 5 minutes
  cron.schedule('*/5 * * * *', processDemands);

  console.log('Demand cron job scheduled successfully');
};