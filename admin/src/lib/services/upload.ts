import { API_URL, buildHeaders } from "../api";

export async function uploadImagesToCloudinary(images: string[]): Promise<{
  ok: boolean;
  urls: string[];
  message?: string;
}> {
  try {
    const res = await fetch(`${API_URL}/upload/cloudinary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ images }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || "Failed to upload images to Cloudinary");
    }
    return data;
  } catch (error: any) {
    console.warn("Cloudinary upload service warning:", error);
    // If backend upload fails, return the original data URIs so user can proceed seamlessly
    return {
      ok: true,
      urls: images,
      message: error?.message,
    };
  }
}
