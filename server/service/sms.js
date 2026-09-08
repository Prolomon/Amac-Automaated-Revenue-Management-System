const cleanEnvValue = (value, fallback = "") =>
  String(value ?? fallback)
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/^'|'$/g, "");

/**
 * Format phone number to international E.164-compatible format (without leading + for Infobip)
 * Examples:
 *   "08031234567" -> "2348031234567"
 *   "+2348031234567" -> "2348031234567"
 *   "2348031234567" -> "2348031234567"
 *   "09012345678" -> "2349012345678"
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";

  // Convert to string and strip non-digit characters except leading +
  let cleaned = String(phone).trim().replace(/[^\d+]/g, "");

  // Remove leading '+'
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // Handle standard 11-digit Nigerian numbers starting with 0 (e.g. 080..., 070..., 090..., 081...)
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = `234${cleaned.substring(1)}`;
  } else if (cleaned.length === 10 && !cleaned.startsWith("0") && !cleaned.startsWith("234")) {
    // 10-digit number without leading 0 (e.g. 8031234567)
    cleaned = `234${cleaned}`;
  }

  return cleaned;
};

/**
 * Infobip Configuration
 */
const getInfobipConfig = () => {
  const apiKey = cleanEnvValue(process.env.INFOBIP_API_KEY);
  const rawBaseUrl = cleanEnvValue(process.env.INFOBIP_API_BASE_URL, "api.infobip.com");
  const baseUrl = rawBaseUrl.startsWith("http")
    ? rawBaseUrl.replace(/\/+$/, "")
    : `https://${rawBaseUrl.replace(/\/+$/, "")}`;
  const senderId = cleanEnvValue(process.env.INFOBIP_SENDER_ID, "AMAC");

  return {
    apiKey,
    baseUrl,
    senderId,
    isConfigured: Boolean(apiKey && baseUrl),
  };
};

/**
 * Send SMS using Infobip API (/sms/2/text/advanced)
 * 
 * @param {string} to - Recipient phone number
 * @param {string} text - SMS text content
 * @param {object} [options] - Additional options (e.g., custom from sender)
 * @returns {Promise<{ ok: boolean, messageId?: string, status?: object, error?: string }>}
 */
export const sendSms = async (to, text, options = {}) => {
  const { apiKey, baseUrl, senderId, isConfigured } = getInfobipConfig();

  if (!isConfigured) {
    console.warn("SMS service warning: Infobip credentials not configured in environment.");
    return { ok: false, error: "Infobip credentials not configured" };
  }

  const destination = formatPhoneNumber(to);
  if (!destination) {
    console.warn("SMS service warning: No recipient phone number provided.");
    return { ok: false, error: "Recipient phone number is required" };
  }

  if (!text || String(text).trim() === "") {
    console.warn("SMS service warning: Empty SMS text provided for", destination);
    return { ok: false, error: "SMS message text cannot be empty" };
  }

  const from = options.from || senderId || "AMAC";

  const payload = {
    messages: [
      {
        from,
        destinations: [
          {
            to: destination,
          },
        ],
        text: String(text).trim(),
      },
    ],
  };

  try {
    const response = await fetch(`${baseUrl}/sms/2/text/advanced`, {
      method: "POST",
      headers: {
        Authorization: `App ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg =
        data?.requestError?.serviceException?.text ||
        data?.description ||
        data?.message ||
        `HTTP Error ${response.status}: ${response.statusText}`;
      console.error(`SMS send failed to ${destination}:`, errorMsg);
      return { ok: false, error: errorMsg, code: response.status };
    }

    const messageResult = data?.messages?.[0];
    const messageId = messageResult?.messageId;
    const status = messageResult?.status;

    // Infobip status groupId: 1 = PENDING, 2 = UNDELIVERABLE, 3 = DELIVERED, 4 = EXPIRED, 5 = REJECTED
    if (status?.groupId === 4 || status?.groupId === 5) {
      console.warn(`SMS rejected by carrier for ${destination}:`, status?.description);
      return {
        ok: false,
        messageId,
        status,
        error: status?.description || "SMS rejected by network",
      };
    }

    console.log(`SMS sent successfully to ${destination}. Message ID: ${messageId || "N/A"}`);
    return {
      ok: true,
      messageId,
      status,
    };
  } catch (error) {
    console.error(`SMS service error sending to ${destination}:`, error?.message || error);
    return {
      ok: false,
      error: error?.message || "Failed to dispatch SMS",
    };
  }
};

/**
 * Verify SMS service connectivity
 */
export const verifySmsConfig = async () => {
  const { apiKey, baseUrl, isConfigured } = getInfobipConfig();
  if (!isConfigured) return false;

  try {
    const res = await fetch(`${baseUrl}/account/1/balance`, {
      headers: {
        Authorization: `App ${apiKey}`,
        Accept: "application/json",
      },
    });
    return res.ok;
  } catch {
    return false;
  }
};

export default {
  sendSms,
  formatPhoneNumber,
  verifySmsConfig,
};
