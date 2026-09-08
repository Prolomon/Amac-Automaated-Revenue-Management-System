import { formatPhoneNumber } from "./sms.js";

const cleanEnvValue = (value, fallback = "") =>
  String(value ?? fallback)
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/^'|'$/g, "");

/**
 * Infobip WhatsApp Configuration
 */
const getInfobipWhatsAppConfig = () => {
  const apiKey = cleanEnvValue(process.env.INFOBIP_API_KEY);
  const rawBaseUrl = cleanEnvValue(process.env.INFOBIP_API_BASE_URL, "api.infobip.com");
  const baseUrl = rawBaseUrl.startsWith("http")
    ? rawBaseUrl.replace(/\/+$/, "")
    : `https://${rawBaseUrl.replace(/\/+$/, "")}`;

  // Use configured WhatsApp sender or test sender default "447860088970"
  const senderNumber = cleanEnvValue(
    process.env.INFOBIP_WHATSAPP_SENDER || process.env.INFOBIP_WHATSAPP_NUMBER,
    "447860088970"
  );

  return {
    apiKey,
    baseUrl,
    senderNumber,
    isConfigured: Boolean(apiKey && baseUrl),
  };
};

/**
 * Send WhatsApp text message via Infobip (/whatsapp/1/message/text)
 * 
 * @param {string} to - Recipient phone number (e.g. 08012345678 or 2348012345678)
 * @param {string} text - Message body (supports WhatsApp markdown formatting like *bold*, _italics_)
 * @param {object} [options] - Optional configurations (e.g. custom from sender number)
 * @returns {Promise<{ ok: boolean, messageId?: string, status?: object, error?: string }>}
 */
export const sendWhatsApp = async (to, text, options = {}) => {
  const { apiKey, baseUrl, senderNumber, isConfigured } = getInfobipWhatsAppConfig();

  if (!isConfigured) {
    console.warn("WhatsApp service warning: Infobip credentials not configured in environment.");
    return { ok: false, error: "Infobip credentials not configured" };
  }

  const destination = formatPhoneNumber(to);
  if (!destination) {
    console.warn("WhatsApp service warning: No recipient phone number provided.");
    return { ok: false, error: "Recipient phone number is required" };
  }

  if (!text || String(text).trim() === "") {
    console.warn("WhatsApp service warning: Empty message text for", destination);
    return { ok: false, error: "WhatsApp message text cannot be empty" };
  }

  const from = options.from || senderNumber;

  const payload = {
    from,
    to: destination,
    content: {
      text: String(text).trim(),
    },
  };

  try {
    const response = await fetch(`${baseUrl}/whatsapp/1/message/text`, {
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
      console.error(`WhatsApp send failed to ${destination}:`, errorMsg);
      return { ok: false, error: errorMsg, code: response.status };
    }

    const messageId = data?.messageId;
    const status = data?.status;

    // Check for rejected / undeliverable status
    if (status?.groupId === 4 || status?.groupId === 5) {
      console.warn(`WhatsApp message rejected for ${destination}:`, status?.description);
      return {
        ok: false,
        messageId,
        status,
        error: status?.description || "WhatsApp message rejected",
      };
    }

    console.log(`WhatsApp message sent successfully to ${destination}. Message ID: ${messageId || "N/A"}`);
    return {
      ok: true,
      messageId,
      status,
    };
  } catch (error) {
    console.error(`WhatsApp service error sending to ${destination}:`, error?.message || error);
    return {
      ok: false,
      error: error?.message || "Failed to dispatch WhatsApp message",
    };
  }
};

/**
 * Send pre-approved WhatsApp template message via Infobip (/whatsapp/1/message/template)
 * 
 * @param {string} to - Recipient phone number
 * @param {string} templateName - Approved template name
 * @param {string[]} [placeholders=[]] - Array of placeholder values in order
 * @param {string} [language="en"] - Language code
 * @param {object} [options] - Additional options
 */
export const sendWhatsAppTemplate = async (to, templateName, placeholders = [], language = "en", options = {}) => {
  const { apiKey, baseUrl, senderNumber, isConfigured } = getInfobipWhatsAppConfig();

  if (!isConfigured) {
    return { ok: false, error: "Infobip credentials not configured" };
  }

  const destination = formatPhoneNumber(to);
  if (!destination) {
    return { ok: false, error: "Recipient phone number is required" };
  }

  const from = options.from || senderNumber;

  const payload = {
    messages: [
      {
        from,
        to: destination,
        content: {
          templateName,
          templateData: {
            body: {
              placeholders: Array.isArray(placeholders) ? placeholders : [placeholders],
            },
          },
          language,
        },
      },
    ],
  };

  try {
    const response = await fetch(`${baseUrl}/whatsapp/1/message/template`, {
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
      console.error(`WhatsApp template send failed to ${destination}:`, errorMsg);
      return { ok: false, error: errorMsg, code: response.status };
    }

    const messageResult = data?.messages?.[0];
    return {
      ok: true,
      messageId: messageResult?.messageId,
      status: messageResult?.status,
    };
  } catch (error) {
    console.error(`WhatsApp template service error to ${destination}:`, error?.message || error);
    return {
      ok: false,
      error: error?.message || "Failed to dispatch WhatsApp template",
    };
  }
};

/**
 * Verify WhatsApp service connectivity
 */
export const verifyWhatsAppConfig = async () => {
  const { apiKey, baseUrl, isConfigured } = getInfobipWhatsAppConfig();
  if (!isConfigured) return false;

  try {
    const res = await fetch(`${baseUrl}/whatsapp/1/senders`, {
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
  sendWhatsApp,
  sendWhatsAppTemplate,
  verifyWhatsAppConfig,
};
