import crypto from "node:crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dwq2uwkk2";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "urms_uploads";

/**
 * Upload an image to Cloudinary using standard REST API
 * Supports base64 data URIs, buffer, or remote URL strings
 */
export async function uploadToCloudinary(fileData, options = {}) {
  try {
    if (!fileData) {
      throw new Error("No file data provided for Cloudinary upload");
    }

    // If file is already a Cloudinary URL, return immediately
    if (typeof fileData === "string" && fileData.includes("res.cloudinary.com")) {
      return {
        ok: true,
        url: fileData,
      };
    }

    const cloudName = (options.cloudName || process.env.CLOUDINARY_CLOUD_NAME || CLOUD_NAME || "dwq2uwkk2").replace(/^["']|["']$/g, "").trim();
    const apiKey = (options.apiKey || process.env.CLOUDINARY_API_KEY || API_KEY || "").replace(/^["']|["']$/g, "").trim();
    const apiSecret = (options.apiSecret || process.env.CLOUDINARY_API_SECRET || API_SECRET || "").replace(/^["']|["']$/g, "").trim();
    const uploadPreset = (options.uploadPreset || process.env.CLOUDINARY_UPLOAD_PRESET || UPLOAD_PRESET || "urms_uploads").replace(/^["']|["']$/g, "").trim();

    const folder = options.folder || "amac/properties";
    const timestamp = Math.round(Date.now() / 1000);

    const formData = new FormData();

    // If fileData is a Buffer, convert to data URI
    let payload = fileData;
    if (Buffer.isBuffer(fileData)) {
      const mimeType = options.mimeType || "image/jpeg";
      payload = `data:${mimeType};base64,${fileData.toString("base64")}`;
    }

    formData.append("file", payload);
    formData.append("folder", folder);

    // If API Key and Secret are configured, use signed upload
    if (apiKey && apiSecret) {
      const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto
        .createHash("sha1")
        .update(signatureString)
        .digest("hex");

      formData.append("timestamp", String(timestamp));
      formData.append("api_key", apiKey);
      formData.append("signature", signature);
    } else {
      // Unsigned upload using preset
      formData.append("upload_preset", uploadPreset);
      formData.append("timestamp", String(timestamp));
    }

    const apiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok && (data.secure_url || data.url)) {
      return {
        ok: true,
        url: data.secure_url || data.url,
        public_id: data.public_id,
        format: data.format,
        bytes: data.bytes,
      };
    }

    console.warn("Cloudinary direct upload response not ok:", data);

    // If unsigned preset is not configured in Cloudinary dashboard,
    // fallback gracefully so the user is never stuck
    if (typeof fileData === "string" && fileData.startsWith("data:")) {
      return {
        ok: true,
        url: fileData,
        warning: data?.error?.message || "Cloudinary upload unconfigured, preserved image data.",
      };
    }

    throw new Error(data?.error?.message || "Cloudinary upload failed");
  } catch (error) {
    console.error("uploadToCloudinary error:", error.message || error);

    // Fallback: If base64, return the data URI so registration continues seamlessly
    if (typeof fileData === "string" && fileData.startsWith("data:")) {
      return {
        ok: true,
        url: fileData,
        warning: "Fallback to embedded image due to upload error: " + error.message,
      };
    }

    throw error;
  }
}
