import express from "express";
import { upload } from "../service/upload.js";
import { uploadToCloudinary } from "../service/cloudinary.js";

const router = express.Router();

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  res.status(200).send(`File uploaded successfully: ${req.file.path}`);
});

router.post("/cloudinary", async (req, res) => {
  try {
    const { image, images, folder = "amac/properties" } = req.body;
    const items = Array.isArray(images) && images.length > 0 ? images : (image ? [image] : []);

    if (items.length === 0) {
      return res.status(400).json({ ok: false, message: "No image payload provided" });
    }

    const uploaded = [];
    for (const img of items) {
      const result = await uploadToCloudinary(img, { folder });
      if (result?.url) {
        uploaded.push(result.url);
      }
    }

    return res.status(200).json({
      ok: true,
      message: "Images uploaded to Cloudinary successfully",
      urls: uploaded,
      url: uploaded[0] || null,
    });
  } catch (error) {
    console.error("Cloudinary upload route error:", error);
    return res.status(500).json({
      ok: false,
      message: error.message || "Failed to upload to Cloudinary",
    });
  }
});

export { router as uploadRouter };
