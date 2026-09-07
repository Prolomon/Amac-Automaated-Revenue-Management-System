import { sendEmail } from "../service/mail.js";

/**
 * AMAC / URMS Email Styling Theme
 */
const theme = {
  primary: "#15803d",       // Emerald green
  primaryDark: "#166534",
  secondary: "#0284c7",     // Blue
  danger: "#dc2626",        // Red
  warning: "#d97706",       // Amber
  success: "#16a34a",       // Green
  textDark: "#1f2937",
  textMuted: "#4b5563",
  bgLight: "#f9fafb",
  cardBg: "#ffffff",
  borderColor: "#e5e7eb",
};

/**
 * Base Email Layout Wrapper
 */
const emailWrapper = ({ title, preheader = "", badgeColor, badgeText, contentHtml }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .email-container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #15803d 0%, #166534 100%); padding: 24px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { color: #dcfce7; margin: 6px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 32px 30px; color: #374151; font-size: 15px; line-height: 1.6; }
    .badge { display: inline-block; padding: 5px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .card { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; margin: 20px 0; }
    .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #6b7280; font-weight: 500; }
    .card-value { color: #111827; font-weight: 600; text-align: right; }
    .button { display: inline-block; background-color: #15803d; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 6px; margin: 20px 0 10px 0; text-align: center; }
    .footer { background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 30px; text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.5; }
    .preheader { display: none; max-height: 0px; overflow: hidden; mso-hide: all; }
  </style>
</head>
<body>
  <span class="preheader">${preheader}</span>
  <div class="email-container">
    <div class="header">
      <h1>Abuja Municipal Area Council</h1>
      <p>Automated Revenue Management System (AMAC URMS)</p>
    </div>
    <div class="body">
      ${badgeText ? `<div class="badge" style="background-color: ${badgeColor?.bg || '#dcfce7'}; color: ${badgeColor?.text || '#166534'};">${badgeText}</div>` : ""}
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">This is an automated notification from AMAC Unified Revenue Management System.</p>
      <p style="margin: 0 0 6px 0;">If you have any questions, please contact our support team at support@amac.ng</p>
      <p style="margin: 8px 0 0 0; color: #6b7280;">&copy; ${new Date().getFullYear()} AMAC. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Format currency amount
 */
const formatAmount = (amount) => {
  const num = Number(amount || 0);
  return `₦${num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Safe send email wrapper
 */
const sendSafeEmail = async (to, subject, html) => {
  if (!to) {
    console.warn("Mail engine warning: No recipient email provided for subject:", subject);
    return { ok: false, error: "Recipient email is required" };
  }

  try {
    const result = await sendEmail(to, subject, html);
    return result;
  } catch (err) {
    console.error(`Mail engine error sending to ${to} [${subject}]:`, err?.message || err);
    return { ok: false, error: err?.message || "Failed to send email" };
  }
};

// =============================================================================
// 1. SUCCESSFUL LOGIN EMAIL
// =============================================================================
export const sendLoginSuccessEmail = async ({ to, name, ip = "Unknown", time = new Date().toLocaleString(), userAgent = "", location = "Abuja, Nigeria" }) => {
  const subject = "AMAC URMS - Successful Login Alert";
  const html = emailWrapper({
    title: subject,
    preheader: `Login detected on your AMAC account at ${time}`,
    badgeColor: { bg: "#dcfce7", text: "#166534" },
    badgeText: "Security Alert",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Successful Login Notification</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "User"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">We noticed a successful sign-in to your AMAC Automated Revenue Management System account.</p>
      
      <div class="card">
        <div class="card-row"><span class="card-label">Date & Time:</span><span class="card-value">${time}</span></div>
        <div class="card-row"><span class="card-label">IP Address:</span><span class="card-value">${ip}</span></div>
        <div class="card-row"><span class="card-label">Location:</span><span class="card-value">${location}</span></div>
        ${userAgent ? `<div class="card-row"><span class="card-label">Device / Browser:</span><span class="card-value">${userAgent}</span></div>` : ""}
      </div>

      <p style="margin: 0 0 16px 0; color: #dc2626; font-size: 13px;">
        <strong>Security Notice:</strong> If this was not you, please reset your password immediately and notify our security task force.
      </p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 2. ACCOUNT CREATION EMAIL
// =============================================================================
export const sendAccountCreationEmail = async ({ to, name, email, password, role = "MEMBER", uid = "" }) => {
  const subject = "Welcome to AMAC URMS - Account Created Successfully";
  const html = emailWrapper({
    title: subject,
    preheader: `Your AMAC account has been created. Here are your credentials.`,
    badgeColor: { bg: "#dbeafe", text: "#1e40af" },
    badgeText: "Welcome",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Welcome to AMAC Revenue Portal</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "User"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">Your account has been successfully created on the Abuja Municipal Area Council Unified Revenue Management System.</p>

      <div class="card">
        ${uid ? `<div class="card-row"><span class="card-label">User ID (UID):</span><span class="card-value">${uid}</span></div>` : ""}
        <div class="card-row"><span class="card-label">Account Role:</span><span class="card-value">${role}</span></div>
        <div class="card-row"><span class="card-label">Registered Email:</span><span class="card-value">${email || to}</span></div>
        ${password ? `<div class="card-row"><span class="card-label">Temporary Password:</span><span class="card-value" style="font-family: monospace; color: #15803d;">${password}</span></div>` : ""}
      </div>

      <p style="margin: 0 0 16px 0;">For your account security, please log in and change your password as soon as possible.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 3. RESET PASSWORD (SUCCESS) EMAIL
// =============================================================================
export const sendResetPasswordEmail = async ({ to, name, time = new Date().toLocaleString(), ip = "Unknown", password = "" }) => {
  const subject = "AMAC URMS - Password Reset Successful";
  const html = emailWrapper({
    title: subject,
    preheader: `Your account password was successfully reset.`,
    badgeColor: { bg: "#dcfce7", text: "#166534" },
    badgeText: "Password Changed",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Password Reset Complete</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "User"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">Your account password has been updated successfully.</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Date & Time:</span><span class="card-value">${time}</span></div>
        <div class="card-row"><span class="card-label">IP Address:</span><span class="card-value">${ip}</span></div>
        ${password ? `<div class="card-row"><span class="card-label">New Password:</span><span class="card-value" style="font-family: monospace; color: #15803d;">${password}</span></div>` : ""}
      </div>

      <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px;">If you did not make this change, contact AMAC Security and Support right away.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 4. FORGOT PASSWORD (OTP / RESET CODE) EMAIL
// =============================================================================
export const sendForgotPasswordEmail = async ({ to, name, code, resetLink = "", expiresAt = "15 minutes" }) => {
  const subject = "AMAC URMS - Password Reset Code";
  const html = emailWrapper({
    title: subject,
    preheader: `Your verification code is ${code}`,
    badgeColor: { bg: "#fef3c7", text: "#92400e" },
    badgeText: "Verification Code",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Password Reset Request</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "User"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">We received a request to reset the password for your AMAC account. Use the code below to proceed:</p>

      <div style="background-color: #f9fafb; border: 2px dashed #15803d; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #15803d; font-family: monospace;">${code}</span>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">This code expires in ${expiresAt}.</p>
      </div>

      ${resetLink ? `<div style="text-align: center;"><a href="${resetLink}" class="button">Reset Password</a></div>` : ""}

      <p style="margin: 16px 0 0 0; font-size: 13px; color: #6b7280;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 5. UPDATE PROFILE EMAIL
// =============================================================================
export const sendProfileUpdateEmail = async ({ to, name, time = new Date().toLocaleString(), ip = "Unknown", changes = [] }) => {
  const subject = "AMAC URMS - Profile Updated Successfully";
  const html = emailWrapper({
    title: subject,
    preheader: `Your account profile has been updated.`,
    badgeColor: { bg: "#dbeafe", text: "#1e40af" },
    badgeText: "Profile Updated",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Profile Information Updated</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "User"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">Your profile information on the AMAC Revenue Management portal has been modified successfully.</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Date & Time:</span><span class="card-value">${time}</span></div>
        <div class="card-row"><span class="card-label">IP Address:</span><span class="card-value">${ip}</span></div>
        ${changes.length > 0 ? `<div class="card-row"><span class="card-label">Updated Fields:</span><span class="card-value">${changes.join(", ")}</span></div>` : ""}
      </div>

      <p style="margin: 0 0 16px 0; font-size: 13px; color: #6b7280;">If you did not authorize these modifications, please contact our support desk immediately.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 6. TRANSACTION SUCCESS EMAIL
// =============================================================================
export const sendTransactionSuccessEmail = async ({ to, name, reference, amount, currency = "NGN", channel = "wallet", date = new Date().toLocaleString(), recipient = "", metadata = {} }) => {
  const subject = `AMAC URMS - Transaction Successful [${reference}]`;
  const html = emailWrapper({
    title: subject,
    preheader: `Your transaction of ${formatAmount(amount)} was successful.`,
    badgeColor: { bg: "#dcfce7", text: "#166534" },
    badgeText: "Transaction Successful",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Transaction Confirmed</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "Valued Customer"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">Your transaction has been processed and completed successfully.</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Amount:</span><span class="card-value" style="color: #16a34a; font-size: 16px;">${formatAmount(amount)} ${currency}</span></div>
        <div class="card-row"><span class="card-label">Reference:</span><span class="card-value" style="font-family: monospace;">${reference}</span></div>
        <div class="card-row"><span class="card-label">Payment Channel:</span><span class="card-value" style="text-transform: uppercase;">${channel}</span></div>
        <div class="card-row"><span class="card-label">Status:</span><span class="card-value" style="color: #16a34a;">SUCCESSFUL</span></div>
        <div class="card-row"><span class="card-label">Date & Time:</span><span class="card-value">${date}</span></div>
        ${recipient ? `<div class="card-row"><span class="card-label">Recipient:</span><span class="card-value">${recipient}</span></div>` : ""}
      </div>

      <p style="margin: 0 0 16px 0;">You can view and download your full receipt on the AMAC portal.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 7. TRANSACTION FAILED EMAIL
// =============================================================================
export const sendTransactionFailedEmail = async ({ to, name, reference, amount, currency = "NGN", channel = "wallet", date = new Date().toLocaleString(), reason = "Transaction could not be completed" }) => {
  const subject = `AMAC URMS - Transaction Failed [${reference}]`;
  const html = emailWrapper({
    title: subject,
    preheader: `Your transaction of ${formatAmount(amount)} was unsuccessful.`,
    badgeColor: { bg: "#fee2e2", text: "#991b1b" },
    badgeText: "Transaction Failed",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Transaction Failed</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "Valued Customer"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">We were unable to process your transaction. Please review the details below:</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Attempted Amount:</span><span class="card-value">${formatAmount(amount)} ${currency}</span></div>
        <div class="card-row"><span class="card-label">Reference:</span><span class="card-value" style="font-family: monospace;">${reference}</span></div>
        <div class="card-row"><span class="card-label">Channel:</span><span class="card-value" style="text-transform: uppercase;">${channel}</span></div>
        <div class="card-row"><span class="card-label">Status:</span><span class="card-value" style="color: #dc2626;">FAILED</span></div>
        <div class="card-row"><span class="card-label">Reason:</span><span class="card-value" style="color: #dc2626;">${reason}</span></div>
        <div class="card-row"><span class="card-label">Date:</span><span class="card-value">${date}</span></div>
      </div>

      <p style="margin: 0 0 16px 0;">Please check your balance or payment method and try again, or reach out to support.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 8. TRANSACTION PENDING EMAIL
// =============================================================================
export const sendTransactionPendingEmail = async ({ to, name, reference, amount, currency = "NGN", channel = "wallet", date = new Date().toLocaleString() }) => {
  const subject = `AMAC URMS - Transaction Processing [${reference}]`;
  const html = emailWrapper({
    title: subject,
    preheader: `Your transaction of ${formatAmount(amount)} is currently being processed.`,
    badgeColor: { bg: "#fef3c7", text: "#92400e" },
    badgeText: "Processing",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Transaction in Progress</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "Valued Customer"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">Your transaction has been received and is currently undergoing verification.</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Amount:</span><span class="card-value">${formatAmount(amount)} ${currency}</span></div>
        <div class="card-row"><span class="card-label">Reference:</span><span class="card-value" style="font-family: monospace;">${reference}</span></div>
        <div class="card-row"><span class="card-label">Channel:</span><span class="card-value" style="text-transform: uppercase;">${channel}</span></div>
        <div class="card-row"><span class="card-label">Status:</span><span class="card-value" style="color: #d97706;">PENDING VERIFICATION</span></div>
        <div class="card-row"><span class="card-label">Date Initiated:</span><span class="card-value">${date}</span></div>
      </div>

      <p style="margin: 0 0 16px 0;">We will notify you immediately once the settlement is finalized.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 9. PAYMENT SUCCESS EMAIL
// =============================================================================
export const sendPaymentSuccessEmail = async ({ to, name, reference, amount, planId = "", date = new Date().toLocaleString(), debt = 0, frequency = "MONTHLY", receipt = null }) => {
  const subject = `AMAC URMS - Payment Receipt [${reference}]`;
  const html = emailWrapper({
    title: subject,
    preheader: `Your payment of ${formatAmount(amount)} has been confirmed.`,
    badgeColor: { bg: "#dcfce7", text: "#166534" },
    badgeText: "Payment Successful",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Payment Successfully Processed</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "Taxpayer"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">Thank you for your payment to the Abuja Municipal Area Council. Your payment details are summarized below:</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Amount Paid:</span><span class="card-value" style="color: #16a34a; font-size: 16px;">${formatAmount(amount)}</span></div>
        <div class="card-row"><span class="card-label">Payment Reference:</span><span class="card-value" style="font-family: monospace;">${reference}</span></div>
        ${planId ? `<div class="card-row"><span class="card-label">Billing / Demand Ref:</span><span class="card-value">${planId}</span></div>` : ""}
        <div class="card-row"><span class="card-label">Billing Cycle:</span><span class="card-value">${frequency}</span></div>
        <div class="card-row"><span class="card-label">Remaining Balance:</span><span class="card-value">${formatAmount(debt)}</span></div>
        <div class="card-row"><span class="card-label">Date & Time:</span><span class="card-value">${date}</span></div>
      </div>

      <p style="margin: 0 0 16px 0;">Your revenue obligation has been credited accordingly.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 10. PAYMENT PENDING EMAIL
// =============================================================================
export const sendPaymentPendingEmail = async ({ to, name, reference = "", amount, planId = "", dueDate = "Due soon", debt = 0, frequency = "MONTHLY" }) => {
  const subject = `AMAC URMS - Payment Due Notice [${reference || planId}]`;
  const html = emailWrapper({
    title: subject,
    preheader: `You have an outstanding payment of ${formatAmount(amount)} due on ${dueDate}.`,
    badgeColor: { bg: "#fef3c7", text: "#92400e" },
    badgeText: "Payment Due",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Payment Notice</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "Taxpayer"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">This is a reminder that you have a scheduled revenue payment due on your account.</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Amount Due:</span><span class="card-value" style="color: #d97706; font-size: 16px;">${formatAmount(amount)}</span></div>
        ${reference ? `<div class="card-row"><span class="card-label">Reference:</span><span class="card-value" style="font-family: monospace;">${reference}</span></div>` : ""}
        ${planId ? `<div class="card-row"><span class="card-label">Bill / Notice ID:</span><span class="card-value">${planId}</span></div>` : ""}
        <div class="card-row"><span class="card-label">Due Date:</span><span class="card-value" style="color: #dc2626; font-weight: 700;">${new Date(dueDate).toLocaleDateString() || dueDate}</span></div>
        <div class="card-row"><span class="card-label">Billing Frequency:</span><span class="card-value">${frequency}</span></div>
        ${debt > 0 ? `<div class="card-row"><span class="card-label">Cumulative Debt:</span><span class="card-value" style="color: #dc2626;">${formatAmount(debt)}</span></div>` : ""}
      </div>

      <p style="margin: 0 0 16px 0;">Please log into your portal to make the payment promptly and ensure your status remains in good standing.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 11. PAYMENT PAID (COMPLETELY SETTLED) EMAIL
// =============================================================================
export const sendPaymentPaidEmail = async ({ to, name, reference, amount, planId = "", date = new Date().toLocaleString(), receipt = null }) => {
  const subject = `AMAC URMS - Payment Fully Settled & Cleared [${reference}]`;
  const html = emailWrapper({
    title: subject,
    preheader: `Your payment has been fully settled and paid in full.`,
    badgeColor: { bg: "#dcfce7", text: "#166534" },
    badgeText: "Paid in Full",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Payment Fully Cleared</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "Taxpayer"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">We are delighted to confirm that your revenue obligation has been <strong>PAID IN FULL</strong>.</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Total Amount Paid:</span><span class="card-value" style="color: #16a34a; font-size: 16px;">${formatAmount(amount)}</span></div>
        <div class="card-row"><span class="card-label">Receipt Reference:</span><span class="card-value" style="font-family: monospace;">${reference}</span></div>
        ${planId ? `<div class="card-row"><span class="card-label">Billing Record:</span><span class="card-value">${planId}</span></div>` : ""}
        <div class="card-row"><span class="card-label">Outstanding Debt:</span><span class="card-value" style="color: #16a34a;">₦0.00 (Cleared)</span></div>
        <div class="card-row"><span class="card-label">Settlement Date:</span><span class="card-value">${date}</span></div>
      </div>

      <p style="margin: 0 0 16px 0;">Your compliance certificate and electronic receipt are available in your portal dashboard.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 12. PAYMENT CREATED EMAIL
// =============================================================================
export const sendPaymentCreatedEmail = async ({ to, name, reference, amount, planId = "", dueDate = new Date(), startDate = new Date(), frequency = "MONTHLY" }) => {
  const subject = `AMAC URMS - New Billing Obligation Created [${reference || planId}]`;
  const html = emailWrapper({
    title: subject,
    preheader: `A new revenue bill of ${formatAmount(amount)} has been issued.`,
    badgeColor: { bg: "#dbeafe", text: "#1e40af" },
    badgeText: "New Bill Issued",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">New Payment Bill Created</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "Taxpayer"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">A new billing schedule has been created on your AMAC account according to your revenue assessment.</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Assessment Amount:</span><span class="card-value" style="color: #15803d; font-size: 16px;">${formatAmount(amount)}</span></div>
        <div class="card-row"><span class="card-label">Payment Reference:</span><span class="card-value" style="font-family: monospace;">${reference || planId}</span></div>
        <div class="card-row"><span class="card-label">Billing Frequency:</span><span class="card-value">${frequency}</span></div>
        <div class="card-row"><span class="card-label">Start Date:</span><span class="card-value">${new Date(startDate).toLocaleDateString()}</span></div>
        <div class="card-row"><span class="card-label">Due Date:</span><span class="card-value" style="color: #dc2626; font-weight: 700;">${new Date(dueDate).toLocaleDateString()}</span></div>
        <div class="card-row"><span class="card-label">Status:</span><span class="card-value" style="color: #d97706;">PENDING</span></div>
      </div>

      <p style="margin: 0 0 16px 0;">Please ensure timely settlement to avoid penalty fees or compliance notices.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 13. WALLET CREATION EMAIL
// =============================================================================
export const sendWalletCreationEmail = async ({ to, name, accountNumber, bankName = "Nomba / Providus Bank", bankCode = "110028", accountName = "", balance = 0 }) => {
  const subject = "AMAC URMS - Virtual Wallet Created Successfully";
  const html = emailWrapper({
    title: subject,
    preheader: `Your AMAC dedicated virtual wallet account is ${accountNumber}.`,
    badgeColor: { bg: "#dcfce7", text: "#166534" },
    badgeText: "Wallet Active",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Virtual Wallet Ready</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "User"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">Your dedicated AMAC revenue virtual collection wallet has been successfully generated.</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Dedicated Account No:</span><span class="card-value" style="font-size: 18px; color: #15803d; font-family: monospace;">${accountNumber}</span></div>
        <div class="card-row"><span class="card-label">Bank Name:</span><span class="card-value">${bankName}</span></div>
        <div class="card-row"><span class="card-label">Bank Code:</span><span class="card-value">${bankCode}</span></div>
        <div class="card-row"><span class="card-label">Account Name:</span><span class="card-value">${accountName || name}</span></div>
        <div class="card-row"><span class="card-label">Current Balance:</span><span class="card-value">${formatAmount(balance)}</span></div>
      </div>

      <p style="margin: 0 0 16px 0;">You can fund this dedicated account from any Nigerian commercial bank to automatically settle bills or disburse funds.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 14. DISPUTE APPROVED EMAIL
// =============================================================================
export const sendDisputeApprovedEmail = async ({ to, name, requestId, paymentId = "", amount = 0, comment = "", approverName = "Administrator", date = new Date().toLocaleString() }) => {
  const subject = `AMAC URMS - Dispute Request Approved [${requestId}]`;
  const html = emailWrapper({
    title: subject,
    preheader: `Your dispute request ${requestId} has been approved.`,
    badgeColor: { bg: "#dcfce7", text: "#166534" },
    badgeText: "Dispute Approved",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Dispute Request Approved</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "Taxpayer"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">Your billing dispute/adjustment request has been reviewed and <strong style="color: #16a34a;">APPROVED</strong> by the council administration.</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Request ID:</span><span class="card-value" style="font-family: monospace;">${requestId}</span></div>
        ${paymentId ? `<div class="card-row"><span class="card-label">Associated Bill:</span><span class="card-value">${paymentId}</span></div>` : ""}
        ${amount ? `<div class="card-row"><span class="card-label">Adjusted Amount:</span><span class="card-value" style="color: #15803d;">${formatAmount(amount)}</span></div>` : ""}
        <div class="card-row"><span class="card-label">Decision Date:</span><span class="card-value">${date}</span></div>
        <div class="card-row"><span class="card-label">Reviewed By:</span><span class="card-value">${approverName}</span></div>
        ${comment ? `<div class="card-row"><span class="card-label">Remarks:</span><span class="card-value">${comment}</span></div>` : ""}
      </div>

      <p style="margin: 0 0 16px 0;">Any applicable adjustments or discounts have been posted to your billing record.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 15. DISPUTE REJECTED EMAIL
// =============================================================================
export const sendDisputeRejectedEmail = async ({ to, name, requestId, paymentId = "", amount = 0, comment = "Request does not meet assessment guidelines", rejecterName = "Administrator", date = new Date().toLocaleString() }) => {
  const subject = `AMAC URMS - Dispute Request Update [${requestId}]`;
  const html = emailWrapper({
    title: subject,
    preheader: `Update on your dispute request ${requestId}.`,
    badgeColor: { bg: "#fee2e2", text: "#991b1b" },
    badgeText: "Dispute Declined",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Dispute Request Declined</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "Taxpayer"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">Following administrative review, your billing adjustment request has been <strong style="color: #dc2626;">DECLINED</strong>.</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Request ID:</span><span class="card-value" style="font-family: monospace;">${requestId}</span></div>
        ${paymentId ? `<div class="card-row"><span class="card-label">Associated Bill:</span><span class="card-value">${paymentId}</span></div>` : ""}
        <div class="card-row"><span class="card-label">Review Date:</span><span class="card-value">${date}</span></div>
        <div class="card-row"><span class="card-label">Reason:</span><span class="card-value" style="color: #dc2626;">${comment}</span></div>
      </div>

      <p style="margin: 0 0 16px 0;">Your original bill amount remains valid. Please settle the due balance to remain in good standing.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// 16. DISPUTE PENDING EMAIL
// =============================================================================
export const sendDisputePendingEmail = async ({ to, name, requestId, paymentId = "", amount = 0, reason = "Under investigation", date = new Date().toLocaleString() }) => {
  const subject = `AMAC URMS - Dispute Request Received [${requestId}]`;
  const html = emailWrapper({
    title: subject,
    preheader: `We have received your dispute request ${requestId}.`,
    badgeColor: { bg: "#fef3c7", text: "#92400e" },
    badgeText: "Dispute Pending",
    contentHtml: `
      <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 20px;">Dispute Request Acknowledgment</h2>
      <p style="margin: 0 0 16px 0;">Dear <strong>${name || "Taxpayer"}</strong>,</p>
      <p style="margin: 0 0 16px 0;">Your dispute/adjustment request has been lodged and assigned to our revenue audit desk for review.</p>

      <div class="card">
        <div class="card-row"><span class="card-label">Tracking ID:</span><span class="card-value" style="font-family: monospace;">${requestId}</span></div>
        ${paymentId ? `<div class="card-row"><span class="card-label">Bill ID:</span><span class="card-value">${paymentId}</span></div>` : ""}
        ${amount ? `<div class="card-row"><span class="card-label">Disputed Amount:</span><span class="card-value">${formatAmount(amount)}</span></div>` : ""}
        <div class="card-row"><span class="card-label">Reason:</span><span class="card-value">${reason}</span></div>
        <div class="card-row"><span class="card-label">Date Submitted:</span><span class="card-value">${date}</span></div>
        <div class="card-row"><span class="card-label">Status:</span><span class="card-value" style="color: #d97706;">UNDER REVIEW</span></div>
      </div>

      <p style="margin: 0 0 16px 0;">You will receive an update once the council verification team completes the assessment.</p>
    `,
  });

  return sendSafeEmail(to, subject, html);
};

// =============================================================================
// EXPORT UNIFIED MAIL ENGINE
// =============================================================================
export const mailEngine = {
  sendLoginSuccessEmail,
  sendAccountCreationEmail,
  sendResetPasswordEmail,
  sendForgotPasswordEmail,
  sendProfileUpdateEmail,
  sendTransactionSuccessEmail,
  sendTransactionFailedEmail,
  sendTransactionPendingEmail,
  sendPaymentSuccessEmail,
  sendPaymentPendingEmail,
  sendPaymentPaidEmail,
  sendPaymentCreatedEmail,
  sendWalletCreationEmail,
  sendDisputeApprovedEmail,
  sendDisputeRejectedEmail,
  sendDisputePendingEmail,
};

export default mailEngine;
