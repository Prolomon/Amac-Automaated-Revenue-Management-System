import nodemailer from "nodemailer";
import { Resend } from "resend";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cleanEnvValue = (value, fallback = "") =>
  String(value ?? fallback)
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/^'|'$/g, "");

const smtpHost = cleanEnvValue(process.env.SMTP_HOST);
const smtpUser = cleanEnvValue(process.env.SMTP_USER);
const smtpPass = cleanEnvValue(process.env.SMTP_PASS);

const smtpPort = Number.parseInt(cleanEnvValue(process.env.SMTP_PORT, "587"), 10);
const smtpSecure = cleanEnvValue(process.env.SMTP_SECURE).toLowerCase() === "true"
  ? true
  : smtpPort === 465;

const createSmtpTransport = (port, secure) =>
  nodemailer.createTransport({
    host: smtpHost,
    port,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: Number.parseInt(cleanEnvValue(process.env.SMTP_CONNECTION_TIMEOUT_MS, "30000"), 10),
    greetingTimeout: Number.parseInt(cleanEnvValue(process.env.SMTP_GREETING_TIMEOUT_MS, "30000"), 10),
    socketTimeout: Number.parseInt(cleanEnvValue(process.env.SMTP_SOCKET_TIMEOUT_MS, "60000"), 10),
    requireTLS: !secure,
    tls: {
      servername: smtpHost,
      rejectUnauthorized:
        cleanEnvValue(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, "true").toLowerCase() !== "false",
    },
    debug: cleanEnvValue(process.env.SMTP_DEBUG, "false").toLowerCase() === "true",
    logger: cleanEnvValue(process.env.SMTP_DEBUG, "false").toLowerCase() === "true",
  });

// Create a transporter using SMTP
export const transporter = createSmtpTransport(smtpPort, smtpSecure);

const shouldRetryWithFallback = (error) => {
  const code = String(error?.code || "").toUpperCase();
  return code === "ETIMEDOUT" || code === "ECONNECTION" || code === "ESOCKET";
};

// Initialize Resend client
const resendApiKey = cleanEnvValue(process.env.RESEND_API_KEY);
const resendFrom = cleanEnvValue(process.env.RESEND_FROM, "URMS System <noreply@amac.ng>");
let resendClient = null;
let resendAvailable = false;
if (resendApiKey) {
  try {
    resendClient = new Resend(resendApiKey);
    resendAvailable = true;
  } catch (err) {
    console.error("Failed to initialize Resend client:", err);
  }
}

let cachedBrowser = null;

async function getBrowser() {
  if (cachedBrowser) {
    try {
      if (cachedBrowser.isConnected()) {
        return cachedBrowser;
      }
    } catch (e) {
      cachedBrowser = null;
    }
  }

  cachedBrowser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  return cachedBrowser;
}

export async function generatePdfFromHtml(htmlContent, publicDir) {
  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    // Inject viewport meta tag for proper scaling
    let htmlWithViewport = htmlContent.replace(
      /<head>/i,
      `<head><meta name="viewport" content="width=device-width, initial-scale=1.0">`
    );

    // Resolve relative image URLs to absolute file:// URLs so Playwright can load them
    if (publicDir) {
      htmlWithViewport = htmlWithViewport.replace(
        /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
        (match, before, src, after) => {
          if (!src || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
            return match;
          }
          const absolutePath = path.resolve(publicDir, src);
          const absoluteUrl = 'file://' + absolutePath;
          return `<img${before}src="${absoluteUrl}"${after}>`;
        }
      );
    }

    await page.setContent(htmlWithViewport, {
      waitUntil: 'domcontentloaded',
      timeout: 120000
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      scale: 0.8,
      preferCSSPageSize: false
    });

    return pdfBuffer;
  } finally {
    if (page) {
      await page.close().catch(err => console.error("Error closing page:", err));
    }
  }
}

export const sendEmail = async (to, subject, text, attachments = []) => {
  const mailOptions = {
    from: smtpUser,
    to,
    subject,
    html: text,
    text: String(text || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    attachments,
  };

  // Try Resend first if available
  if (resendAvailable && resendClient) {
    try {
      const resendAttachments = attachments.map((att) => ({
        filename: att.filename || "attachment.pdf",
        content: att.content,
      }));

    const { data, error } = await resendClient.emails.send({
        from: resendFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: text,
        text: String(text || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        attachments: resendAttachments.length > 0 ? resendAttachments.map(att => ({
          ...att,
          content: Buffer.isBuffer(att.content) 
            ? att.content.toString('base64')
            : typeof att.content === 'string'
            ? att.content
            : Buffer.from(att.content).toString('base64')
        })) : undefined,
      });

      if (error) {
        console.error("Resend send returned an error:", error);
        throw new Error(error.message || "Resend API error");
      }

      console.log("Email sent via Resend:", data?.id);
      return { ok: true, messageId: data?.id };
    } catch (error) {
      console.error("Resend send failed, falling back to SMTP:", error);
      // Fall through to SMTP fallback below
    }
  }

  // Only try SMTP if credentials are configured
  if (!smtpHost || !smtpUser || !smtpPass) {
    return { ok: false, error: "SMTP credentials not configured" };
  }

  try {
    const result = await new Promise((resolve) => {
      transporter.sendMail(
        mailOptions,
        (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
            return resolve({
              ok: false,
              error: error?.message || "Failed to send email",
              code: error?.code,
            });
          }

          console.log("Email sent:", info?.messageId);
          return resolve({ ok: true, messageId: info?.messageId });
        },
      );
    });

    if (!result?.ok && shouldRetryWithFallback(result) && smtpPort !== 465) {
      const fallbackTransporter = createSmtpTransport(465, true);
      const fallbackResult = await new Promise((resolve) => {
        fallbackTransporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Fallback SMTP send failed:", error);
            return resolve({
              ok: false,
              error: error?.message || "Failed to send email",
              code: error?.code,
            });
          }

          console.log("Email sent with fallback SMTP:", info?.messageId);
          return resolve({ ok: true, messageId: info?.messageId });
        });
      });

      return fallbackResult;
    }

    return result;
  } catch (error) {
    console.error("Error sending email:", error);

  if (shouldRetryWithFallback(error) && smtpPort !== 465 && smtpHost && smtpUser && smtpPass) {
      try {
        const fallbackTransporter = createSmtpTransport(465, true);
        const info = await fallbackTransporter.sendMail(mailOptions);
        console.log("Email sent with fallback SMTP:", info?.messageId);
        return { ok: true, messageId: info?.messageId };
      } catch (fallbackError) {
        console.error("Fallback SMTP send failed:", fallbackError);
      }
    }

    return { ok: false, error: error?.message || "Failed to send email" };
  }
};

export const sendDemandNoticeEmail = async (to, subject, body, attachment, filename = "Demand_Notice.pdf", publicDir) => {
  try {
    const pdfBuffer = await generatePdfFromHtml(attachment, publicDir);
    const attachments = [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];

    const result = await sendEmail(to, subject, body, attachments);
    return result;
  } catch (error) {
    console.error("Error sending demand notice email:", error);
    return { ok: false, error: error?.message || "Failed to send demand notice email" };
  }
};

export const verifyEmail = async (to, token) => {
  const verificationLink = `http://localhost:3000/verify-email?token=${token}`;
  const subject = "Verify Your Email Address";
  const text = `Please click the following link to verify your email address: ${verificationLink}`;
  await sendEmail(to, subject, text);
};

export const verifyProtocol = async () => {
  try {
    await transporter.verify();
    console.log("Server is ready to take our messages");
    return true;
  } catch (err) {
    console.error("Verification failed:", err);
    return false;
  }
}; 