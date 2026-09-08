import { sendWhatsApp, sendWhatsAppTemplate } from "../service/whatsapp.js";
import { formatPhoneNumber } from "../service/sms.js";

/**
 * Format currency amount
 */
export const formatAmount = (amount) => {
  const num = Number(amount || 0);
  return `₦${num.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Resolve phone number from flexible property names
 */
const resolveRecipientPhone = (params = {}) => {
  return (
    params.to ||
    params.phone ||
    params.phoneNumber ||
    params.mobile ||
    params.tel ||
    params.recipient ||
    ""
  );
};

/**
 * WhatsApp Card Layout Template Wrapper
 */
const formatWhatsAppCard = ({ title, badge = "", body = "" }) => {
  const badgeLine = badge ? `\n🏷️ *[ ${badge.toUpperCase()} ]*\n` : "\n";

  return `🏛️ *ABUJA MUNICIPAL AREA COUNCIL*
*AMAC Unified Revenue Management System*
━━━━━━━━━━━━━━━━━━━━━━━━━
${title ? `*${title.trim()}*` : ""}${badgeLine}
${body.trim()}

━━━━━━━━━━━━━━━━━━━━━━━━━
ℹ️ _This is an automated notification from AMAC URMS._
📧 Support: support@amac.ng | 🌐 www.amac.ng`;
};

/**
 * Safe WhatsApp dispatch wrapper
 */
export const sendSafeWhatsApp = async (to, message, options = {}) => {
  const recipient = resolveRecipientPhone(typeof to === "object" && to !== null ? to : { to });

  if (!recipient) {
    console.warn("WhatsApp engine warning: No recipient phone number provided.");
    return { ok: false, error: "Recipient phone number is required" };
  }

  try {
    const result = await sendWhatsApp(recipient, message, options);
    return result;
  } catch (err) {
    console.error(`WhatsApp engine error sending to ${recipient}:`, err?.message || err);
    return { ok: false, error: err?.message || "Failed to send WhatsApp message" };
  }
};

// =============================================================================
// 1. SUCCESSFUL LOGIN WHATSAPP
// =============================================================================
export const sendLoginSuccessWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  ip = "Unknown",
  time = new Date().toLocaleString(),
  userAgent = "",
  location = "Abuja, Nigeria",
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "🔐 Security Alert: Successful Login",
    badge: "Security Notice",
    body: `Dear *${name || "User"}*,

We noticed a successful sign-in to your AMAC Automated Revenue Management System account.

📅 *Date & Time:* ${time}
🌐 *IP Address:* ${ip}
📍 *Location:* ${location}${userAgent ? `\n📱 *Device/Agent:* ${userAgent}` : ""}

⚠️ *Security Notice:* If this was not you, please reset your password immediately and contact AMAC security.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 2. ACCOUNT CREATION WHATSAPP
// =============================================================================
export const sendAccountCreationWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  email = "",
  password = "",
  role = "MEMBER",
  uid = "",
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "🎉 Welcome to AMAC Revenue Portal",
    badge: "Welcome",
    body: `Dear *${name || "User"}*,

Your account has been successfully registered on the Abuja Municipal Area Council Unified Revenue Management System.

👤 *User ID (UID):* \`${uid || "N/A"}\`
📋 *Account Role:* ${role}
📧 *Registered Email:* ${email || recipient}${password ? `\n🔑 *Temporary Password:* \`${password}\`` : ""}

🔒 For your account security, please log in and change your password as soon as possible.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 3. RESET PASSWORD (SUCCESS) WHATSAPP
// =============================================================================
export const sendResetPasswordWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  time = new Date().toLocaleString(),
  ip = "Unknown",
  password = "",
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "🔑 Password Reset Complete",
    badge: "Security Update",
    body: `Dear *${name || "User"}*,

Your account password has been updated successfully.

📅 *Date & Time:* ${time}
🌐 *IP Address:* ${ip}${password ? `\n🔑 *New Password:* \`${password}\`` : ""}

⚠️ If you did not make this change, please contact AMAC Security and Support right away.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 4. FORGOT PASSWORD (OTP / RESET CODE) WHATSAPP
// =============================================================================
export const sendForgotPasswordWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  code,
  resetLink = "",
  expiresAt = "15 minutes",
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "🔐 Password Reset Request",
    badge: "Verification Code",
    body: `Dear *${name || "User"}*,

We received a request to reset the password for your AMAC account. Use the verification code below:

🔢 *OTP Code:* \`${code}\`
⏳ *Expires in:* ${expiresAt}${resetLink ? `\n\n🔗 *Reset Link:* ${resetLink}` : ""}

⚠️ *Never share this code with anyone.* AMAC staff will never ask for your verification code.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 5. UPDATE PROFILE WHATSAPP
// =============================================================================
export const sendProfileUpdateWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  time = new Date().toLocaleString(),
  ip = "Unknown",
  changes = [],
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "📝 Profile Information Updated",
    badge: "Profile Updated",
    body: `Dear *${name || "User"}*,

Your profile information on the AMAC Revenue Management portal has been modified successfully.

📅 *Date & Time:* ${time}
🌐 *IP Address:* ${ip}${changes?.length ? `\n✏️ *Updated Fields:* ${changes.join(", ")}` : ""}

If you did not authorize these modifications, please notify our support desk immediately.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 6. TRANSACTION SUCCESS WHATSAPP
// =============================================================================
export const sendTransactionSuccessWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  reference,
  amount,
  currency = "NGN",
  channel = "wallet",
  date = new Date().toLocaleString(),
  recipient: destRecipient = "",
  metadata = {},
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "✅ Transaction Confirmed",
    badge: "Successful",
    body: `Dear *${name || "Valued Customer"}*,

Your transaction has been processed and completed successfully.

💰 *Amount:* *${formatAmount(amount)} ${currency}*
🔖 *Reference:* \`${reference}\`
💳 *Channel:* ${String(channel).toUpperCase()}
📅 *Date & Time:* ${date}${destRecipient ? `\n👤 *Recipient:* ${destRecipient}` : ""}
⚡ *Status:* SUCCESSFUL

You can view and download your full electronic receipt on the AMAC portal.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 7. TRANSACTION FAILED WHATSAPP
// =============================================================================
export const sendTransactionFailedWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  reference,
  amount,
  currency = "NGN",
  channel = "wallet",
  date = new Date().toLocaleString(),
  reason = "Transaction could not be completed",
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "❌ Transaction Failed",
    badge: "Failed",
    body: `Dear *${name || "Valued Customer"}*,

We were unable to complete your transaction.

💰 *Attempted Amount:* ${formatAmount(amount)} ${currency}
🔖 *Reference:* \`${reference}\`
💳 *Channel:* ${String(channel).toUpperCase()}
⚠️ *Reason:* ${reason}
📅 *Date:* ${date}
❌ *Status:* FAILED

Please check your balance or payment method and try again, or reach out to support.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 8. TRANSACTION PENDING WHATSAPP
// =============================================================================
export const sendTransactionPendingWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  reference,
  amount,
  currency = "NGN",
  channel = "wallet",
  date = new Date().toLocaleString(),
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "⏳ Transaction Processing",
    badge: "Pending",
    body: `Dear *${name || "Valued Customer"}*,

Your transaction has been received and is currently undergoing verification.

💰 *Amount:* ${formatAmount(amount)} ${currency}
🔖 *Reference:* \`${reference}\`
💳 *Channel:* ${String(channel).toUpperCase()}
📅 *Date Initiated:* ${date}
⏳ *Status:* PENDING VERIFICATION

We will notify you immediately once the settlement is finalized.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 9. PAYMENT SUCCESS WHATSAPP
// =============================================================================
export const sendPaymentSuccessWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  reference,
  amount,
  planId = "",
  date = new Date().toLocaleString(),
  debt = 0,
  frequency = "MONTHLY",
  receipt = null,
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "🧾 Payment Receipt Confirmed",
    badge: "Payment Successful",
    body: `Dear *${name || "Taxpayer"}*,

Thank you for your payment to the Abuja Municipal Area Council.

💰 *Amount Paid:* *${formatAmount(amount)}*
🔖 *Payment Reference:* \`${reference}\`${planId ? `\n📑 *Billing / Demand Ref:* \`${planId}\`` : ""}
🔄 *Billing Cycle:* ${frequency}
💳 *Remaining Balance:* ${formatAmount(debt)}
📅 *Date & Time:* ${date}

Your revenue obligation has been credited accordingly. Your electronic receipt is available on the AMAC portal.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 10. PAYMENT PENDING (DUE REMINDER) WHATSAPP
// =============================================================================
export const sendPaymentPendingWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  reference = "",
  amount,
  planId = "",
  dueDate = "Due soon",
  debt = 0,
  frequency = "MONTHLY",
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const formattedDue = dueDate ? new Date(dueDate).toLocaleDateString() : "Due soon";
  const text = formatWhatsAppCard({
    title: "⚠️ Payment Due Notice",
    badge: "Action Required",
    body: `Dear *${name || "Taxpayer"}*,

This is a reminder that you have a scheduled revenue payment due on your account.

💰 *Amount Due:* *${formatAmount(amount)}*${reference ? `\n🔖 *Reference:* \`${reference}\`` : ""}${planId ? `\n📑 *Bill / Notice ID:* \`${planId}\`` : ""}
📅 *Due Date:* ${formattedDue}
🔄 *Billing Frequency:* ${frequency}${debt > 0 ? `\n💳 *Cumulative Debt:* ${formatAmount(debt)}` : ""}

Please log into your AMAC portal to make the payment promptly and avoid penalties.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 11. PAYMENT PAID (COMPLETELY SETTLED) WHATSAPP
// =============================================================================
export const sendPaymentPaidWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  reference,
  amount,
  planId = "",
  date = new Date().toLocaleString(),
  receipt = null,
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "🎉 Payment Fully Settled & Cleared",
    badge: "Paid in Full",
    body: `Dear *${name || "Taxpayer"}*,

We are delighted to confirm that your revenue obligation has been *PAID IN FULL*.

💰 *Total Amount Paid:* *${formatAmount(amount)}*
🔖 *Receipt Reference:* \`${reference}\`${planId ? `\n📑 *Billing Record:* \`${planId}\`` : ""}
💳 *Outstanding Debt:* ₦0.00 (Cleared)
📅 *Settlement Date:* ${date}

Your compliance certificate and electronic receipt are ready to download in your portal dashboard.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 12. PAYMENT CREATED (NEW BILL) WHATSAPP
// =============================================================================
export const sendPaymentCreatedWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  reference,
  amount,
  planId = "",
  dueDate = new Date(),
  startDate = new Date(),
  frequency = "MONTHLY",
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const formattedStart = new Date(startDate).toLocaleDateString();
  const formattedDue = new Date(dueDate).toLocaleDateString();

  const text = formatWhatsAppCard({
    title: "📄 New Revenue Assessment Bill",
    badge: "New Bill",
    body: `Dear *${name || "Taxpayer"}*,

A new billing schedule has been created on your AMAC account according to your revenue assessment.

💰 *Assessment Amount:* *${formatAmount(amount)}*
🔖 *Payment Ref:* \`${reference || planId}\`
🔄 *Billing Frequency:* ${frequency}
📅 *Start Date:* ${formattedStart}
⏰ *Due Date:* ${formattedDue}
⏳ *Status:* PENDING

Please ensure timely settlement to avoid penalty fees or compliance notices.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 13. WALLET CREATION WHATSAPP
// =============================================================================
export const sendWalletCreationWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  accountNumber,
  bankName = "Nomba / Providus Bank",
  bankCode = "110028",
  accountName = "",
  balance = 0,
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "💳 Virtual Wallet Ready",
    badge: "Wallet Active",
    body: `Dear *${name || "User"}*,

Your dedicated AMAC revenue virtual collection wallet has been successfully generated.

🏦 *Dedicated Account No:* \`${accountNumber}\`
🏛️ *Bank Name:* ${bankName}
🔢 *Bank Code:* ${bankCode}
👤 *Account Name:* ${accountName || name}
💰 *Current Balance:* ${formatAmount(balance)}

You can transfer funds to this dedicated account from any Nigerian commercial bank to automatically settle bills or disburse funds.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 14. DISPUTE APPROVED WHATSAPP
// =============================================================================
export const sendDisputeApprovedWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  requestId,
  paymentId = "",
  amount = 0,
  comment = "",
  approverName = "Administrator",
  date = new Date().toLocaleString(),
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "✅ Dispute Request Approved",
    badge: "Approved",
    body: `Dear *${name || "Taxpayer"}*,

Your billing dispute/adjustment request has been reviewed and *APPROVED* by the council administration.

🔖 *Request ID:* \`${requestId}\`${paymentId ? `\n📑 *Associated Bill:* \`${paymentId}\`` : ""}${amount ? `\n💰 *Adjusted Amount:* ${formatAmount(amount)}` : ""}
📅 *Decision Date:* ${date}
👤 *Reviewed By:* ${approverName}${comment ? `\n📝 *Remarks:* ${comment}` : ""}

Any applicable adjustments or discounts have been posted to your billing record.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 15. DISPUTE REJECTED WHATSAPP
// =============================================================================
export const sendDisputeRejectedWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  requestId,
  paymentId = "",
  amount = 0,
  comment = "Request does not meet assessment guidelines",
  rejecterName = "Administrator",
  date = new Date().toLocaleString(),
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "❌ Dispute Request Declined",
    badge: "Declined",
    body: `Dear *${name || "Taxpayer"}*,

Following administrative review, your billing adjustment request has been *DECLINED*.

🔖 *Request ID:* \`${requestId}\`${paymentId ? `\n📑 *Associated Bill:* \`${paymentId}\`` : ""}
📅 *Review Date:* ${date}
⚠️ *Reason:* ${comment}

Your original bill amount remains valid. Please settle the due balance to remain in good standing.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// 16. DISPUTE PENDING WHATSAPP
// =============================================================================
export const sendDisputePendingWhatsApp = async ({
  to,
  phone,
  phoneNumber,
  name,
  requestId,
  paymentId = "",
  amount = 0,
  reason = "Under investigation",
  date = new Date().toLocaleString(),
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = formatWhatsAppCard({
    title: "⏳ Dispute Request Acknowledged",
    badge: "Under Review",
    body: `Dear *${name || "Taxpayer"}*,

Your dispute/adjustment request has been lodged and assigned to our revenue audit desk for review.

🔖 *Tracking ID:* \`${requestId}\`${paymentId ? `\n📑 *Bill ID:* \`${paymentId}\`` : ""}${amount ? `\n💰 *Disputed Amount:* ${formatAmount(amount)}` : ""}
📝 *Reason:* ${reason}
📅 *Date Submitted:* ${date}
⏳ *Status:* UNDER REVIEW

You will receive an update once the council verification team completes the assessment.`,
  });

  return sendSafeWhatsApp(recipient, text);
};

// =============================================================================
// GENERIC WHATSAPP NOTIFICATION
// =============================================================================
export const sendWhatsAppNotification = async ({ to, phone, phoneNumber, message, text, title }) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const content = message || text;
  const formatted = title ? formatWhatsAppCard({ title, body: content }) : content;
  return sendSafeWhatsApp(recipient, formatted);
};

// =============================================================================
// EXPORT UNIFIED WHATSAPP ENGINE (with interface aliases for mailEngine parity)
// =============================================================================
export const whatsappEngine = {
  // WhatsApp specific naming
  sendLoginSuccessWhatsApp,
  sendAccountCreationWhatsApp,
  sendResetPasswordWhatsApp,
  sendForgotPasswordWhatsApp,
  sendProfileUpdateWhatsApp,
  sendTransactionSuccessWhatsApp,
  sendTransactionFailedWhatsApp,
  sendTransactionPendingWhatsApp,
  sendPaymentSuccessWhatsApp,
  sendPaymentPendingWhatsApp,
  sendPaymentPaidWhatsApp,
  sendPaymentCreatedWhatsApp,
  sendWalletCreationWhatsApp,
  sendDisputeApprovedWhatsApp,
  sendDisputeRejectedWhatsApp,
  sendDisputePendingWhatsApp,
  sendWhatsAppNotification,
  sendSafeWhatsApp,

  // Mail interface aliases (allows drop-in replacement where mailEngine was used)
  sendLoginSuccessEmail: sendLoginSuccessWhatsApp,
  sendAccountCreationEmail: sendAccountCreationWhatsApp,
  sendResetPasswordEmail: sendResetPasswordWhatsApp,
  sendForgotPasswordEmail: sendForgotPasswordWhatsApp,
  sendProfileUpdateEmail: sendProfileUpdateWhatsApp,
  sendTransactionSuccessEmail: sendTransactionSuccessWhatsApp,
  sendTransactionFailedEmail: sendTransactionFailedWhatsApp,
  sendTransactionPendingEmail: sendTransactionPendingWhatsApp,
  sendPaymentSuccessEmail: sendPaymentSuccessWhatsApp,
  sendPaymentPendingEmail: sendPaymentPendingWhatsApp,
  sendPaymentPaidEmail: sendPaymentPaidWhatsApp,
  sendPaymentCreatedEmail: sendPaymentCreatedWhatsApp,
  sendWalletCreationEmail: sendWalletCreationWhatsApp,
  sendDisputeApprovedEmail: sendDisputeApprovedWhatsApp,
  sendDisputeRejectedEmail: sendDisputeRejectedWhatsApp,
  sendDisputePendingEmail: sendDisputePendingWhatsApp,

  // Generic action naming
  sendLoginSuccess: sendLoginSuccessWhatsApp,
  sendAccountCreation: sendAccountCreationWhatsApp,
  sendResetPassword: sendResetPasswordWhatsApp,
  sendForgotPassword: sendForgotPasswordWhatsApp,
  sendProfileUpdate: sendProfileUpdateWhatsApp,
  sendTransactionSuccess: sendTransactionSuccessWhatsApp,
  sendTransactionFailed: sendTransactionFailedWhatsApp,
  sendTransactionPending: sendTransactionPendingWhatsApp,
  sendPaymentSuccess: sendPaymentSuccessWhatsApp,
  sendPaymentPending: sendPaymentPendingWhatsApp,
  sendPaymentPaid: sendPaymentPaidWhatsApp,
  sendPaymentCreated: sendPaymentCreatedWhatsApp,
  sendWalletCreation: sendWalletCreationWhatsApp,
  sendDisputeApproved: sendDisputeApprovedWhatsApp,
  sendDisputeRejected: sendDisputeRejectedWhatsApp,
  sendDisputePending: sendDisputePendingWhatsApp,
};

export default whatsappEngine;
