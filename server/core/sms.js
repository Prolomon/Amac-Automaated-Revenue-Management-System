import { sendSms, formatPhoneNumber } from "../service/sms.js";

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
 * Safe SMS dispatch wrapper
 */
export const sendSafeSms = async (to, text, options = {}) => {
  const recipient = resolveRecipientPhone(typeof to === "object" && to !== null ? to : { to });

  if (!recipient) {
    console.warn("SMS engine warning: No recipient phone number provided for message:", text?.substring?.(0, 30));
    return { ok: false, error: "Recipient phone number is required" };
  }

  try {
    const result = await sendSms(recipient, text, options);
    return result;
  } catch (err) {
    console.error(`SMS engine error sending to ${recipient}:`, err?.message || err);
    return { ok: false, error: err?.message || "Failed to send SMS" };
  }
};

// =============================================================================
// 1. SUCCESSFUL LOGIN SMS
// =============================================================================
export const sendLoginSuccessSms = async ({
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
  const text = `AMAC URMS Security Alert: Hello ${name || "User"}, a successful login was recorded on your account at ${time} from IP ${ip} (${location}). If this wasn't you, reset your password immediately or call support.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 2. ACCOUNT CREATION SMS
// =============================================================================
export const sendAccountCreationSms = async ({
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
  const credentialsPart = password ? ` Temp Pass: ${password}.` : "";
  const uidPart = uid ? ` UID: ${uid}.` : "";
  const text = `AMAC URMS: Welcome ${name || "User"}! Your account is active. Role: ${role}.${uidPart}${credentialsPart} Please log in to complete setup.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 3. RESET PASSWORD (SUCCESS) SMS
// =============================================================================
export const sendResetPasswordSms = async ({
  to,
  phone,
  phoneNumber,
  name,
  time = new Date().toLocaleString(),
  ip = "Unknown",
  password = "",
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const passwordPart = password ? ` New password: ${password}.` : "";
  const text = `AMAC URMS: Hello ${name || "User"}, your password was successfully reset on ${time}.${passwordPart} If you did not make this change, please contact AMAC support immediately.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 4. FORGOT PASSWORD (OTP / RESET CODE) SMS
// =============================================================================
export const sendForgotPasswordSms = async ({
  to,
  phone,
  phoneNumber,
  name,
  code,
  resetLink = "",
  expiresAt = "15 minutes",
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const text = `AMAC URMS: Your password reset verification code is ${code}. Valid for ${expiresAt}. Do not disclose this OTP to anyone.${resetLink ? ` Link: ${resetLink}` : ""}`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 5. UPDATE PROFILE SMS
// =============================================================================
export const sendProfileUpdateSms = async ({
  to,
  phone,
  phoneNumber,
  name,
  time = new Date().toLocaleString(),
  ip = "Unknown",
  changes = [],
}) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const changesPart = changes?.length ? ` (${changes.join(", ")})` : "";
  const text = `AMAC URMS: Hello ${name || "User"}, your profile details${changesPart} were updated on ${time}. If unauthorized, alert AMAC support immediately.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 6. TRANSACTION SUCCESS SMS
// =============================================================================
export const sendTransactionSuccessSms = async ({
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
  const destPart = destRecipient ? ` To: ${destRecipient}.` : "";
  const text = `AMAC URMS: Transaction Successful! Paid: ${formatAmount(amount)} ${currency}. Ref: ${reference}.${destPart} Channel: ${String(channel).toUpperCase()}. Date: ${date}. Full receipt on portal.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 7. TRANSACTION FAILED SMS
// =============================================================================
export const sendTransactionFailedSms = async ({
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
  const text = `AMAC URMS: Transaction Failed. Attempted: ${formatAmount(amount)} ${currency}. Ref: ${reference}. Reason: ${reason}. Please check balance/payment method and retry.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 8. TRANSACTION PENDING SMS
// =============================================================================
export const sendTransactionPendingSms = async ({
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
  const text = `AMAC URMS: Transaction Pending. Amount: ${formatAmount(amount)} ${currency}. Ref: ${reference}. Channel: ${String(channel).toUpperCase()}. Verification in progress. We'll alert you once settled.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 9. PAYMENT SUCCESS SMS
// =============================================================================
export const sendPaymentSuccessSms = async ({
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
  const billPart = planId ? ` Bill: ${planId}.` : "";
  const debtPart = Number(debt) > 0 ? ` Bal: ${formatAmount(debt)}.` : " Bal: ₦0.00.";
  const text = `AMAC URMS: Payment Confirmed! Amount: ${formatAmount(amount)}. Ref: ${reference}.${billPart}${debtPart} Thank you for your revenue compliance.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 10. PAYMENT PENDING (DUE REMINDER) SMS
// =============================================================================
export const sendPaymentPendingSms = async ({
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
  const refPart = reference || planId ? ` Ref: ${reference || planId}.` : "";
  const text = `AMAC URMS Payment Notice: You have an outstanding bill of ${formatAmount(amount)} due on ${formattedDue}.${refPart} Pay promptly at amac.ng to avoid penalties.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 11. PAYMENT PAID (COMPLETELY SETTLED) SMS
// =============================================================================
export const sendPaymentPaidSms = async ({
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
  const text = `AMAC URMS: Payment CLEARED IN FULL! Total: ${formatAmount(amount)}. Ref: ${reference}. Outstanding: ₦0.00. Your compliance certificate is ready on the portal.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 12. PAYMENT CREATED (NEW BILL) SMS
// =============================================================================
export const sendPaymentCreatedSms = async ({
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
  const formattedDue = dueDate ? new Date(dueDate).toLocaleDateString() : "Soon";
  const text = `AMAC URMS: New Revenue Bill Issued. Assessment: ${formatAmount(amount)}. Ref: ${reference || planId}. Cycle: ${frequency}. Due Date: ${formattedDue}. Settle at amac.ng.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 13. WALLET CREATION SMS
// =============================================================================
export const sendWalletCreationSms = async ({
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
  const text = `AMAC URMS: Virtual Wallet Created. Acct: ${accountNumber} (${bankName}). Name: ${accountName || name}. Bal: ${formatAmount(balance)}. Transfer from any Nigerian bank to fund.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 14. DISPUTE APPROVED SMS
// =============================================================================
export const sendDisputeApprovedSms = async ({
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
  const text = `AMAC URMS: Dispute ${requestId} APPROVED by ${approverName}. Adjusted Amount: ${formatAmount(amount)}. Updated record is available on your dashboard.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 15. DISPUTE REJECTED SMS
// =============================================================================
export const sendDisputeRejectedSms = async ({
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
  const text = `AMAC URMS: Dispute ${requestId} DECLINED. Reason: ${comment}. Original bill remains valid. Settle promptly to stay compliant.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// 16. DISPUTE PENDING SMS
// =============================================================================
export const sendDisputePendingSms = async ({
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
  const text = `AMAC URMS: Dispute ${requestId} received and under audit review. We will notify you once assessment concludes.`;

  return sendSafeSms(recipient, text);
};

// =============================================================================
// GENERIC SMS NOTIFICATION
// =============================================================================
export const sendSmsNotification = async ({ to, phone, phoneNumber, message, text }) => {
  const recipient = resolveRecipientPhone({ to, phone, phoneNumber });
  const content = message || text;
  return sendSafeSms(recipient, content);
};

// =============================================================================
// EXPORT UNIFIED SMS ENGINE (with interface aliases for mailEngine parity)
// =============================================================================
export const smsEngine = {
  // SMS specific naming
  sendLoginSuccessSms,
  sendAccountCreationSms,
  sendResetPasswordSms,
  sendForgotPasswordSms,
  sendProfileUpdateSms,
  sendTransactionSuccessSms,
  sendTransactionFailedSms,
  sendTransactionPendingSms,
  sendPaymentSuccessSms,
  sendPaymentPendingSms,
  sendPaymentPaidSms,
  sendPaymentCreatedSms,
  sendWalletCreationSms,
  sendDisputeApprovedSms,
  sendDisputeRejectedSms,
  sendDisputePendingSms,
  sendSmsNotification,
  sendSafeSms,

  // Mail interface aliases (allows drop-in replacement where mailEngine was used)
  sendLoginSuccessEmail: sendLoginSuccessSms,
  sendAccountCreationEmail: sendAccountCreationSms,
  sendResetPasswordEmail: sendResetPasswordSms,
  sendForgotPasswordEmail: sendForgotPasswordSms,
  sendProfileUpdateEmail: sendProfileUpdateSms,
  sendTransactionSuccessEmail: sendTransactionSuccessSms,
  sendTransactionFailedEmail: sendTransactionFailedSms,
  sendTransactionPendingEmail: sendTransactionPendingSms,
  sendPaymentSuccessEmail: sendPaymentSuccessSms,
  sendPaymentPendingEmail: sendPaymentPendingSms,
  sendPaymentPaidEmail: sendPaymentPaidSms,
  sendPaymentCreatedEmail: sendPaymentCreatedSms,
  sendWalletCreationEmail: sendWalletCreationSms,
  sendDisputeApprovedEmail: sendDisputeApprovedSms,
  sendDisputeRejectedEmail: sendDisputeRejectedSms,
  sendDisputePendingEmail: sendDisputePendingSms,

  // Generic action naming
  sendLoginSuccess: sendLoginSuccessSms,
  sendAccountCreation: sendAccountCreationSms,
  sendResetPassword: sendResetPasswordSms,
  sendForgotPassword: sendForgotPasswordSms,
  sendProfileUpdate: sendProfileUpdateSms,
  sendTransactionSuccess: sendTransactionSuccessSms,
  sendTransactionFailed: sendTransactionFailedSms,
  sendTransactionPending: sendTransactionPendingSms,
  sendPaymentSuccess: sendPaymentSuccessSms,
  sendPaymentPending: sendPaymentPendingSms,
  sendPaymentPaid: sendPaymentPaidSms,
  sendPaymentCreated: sendPaymentCreatedSms,
  sendWalletCreation: sendWalletCreationSms,
  sendDisputeApproved: sendDisputeApprovedSms,
  sendDisputeRejected: sendDisputeRejectedSms,
  sendDisputePending: sendDisputePendingSms,
};

export default smsEngine;
