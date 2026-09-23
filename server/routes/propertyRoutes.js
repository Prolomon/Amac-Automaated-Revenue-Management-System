import express from "express";
import { prisma } from "../config/db.js";
import {
  submitCapture,
  getCaptures,
  getCaptureById,
  reviewProperty,
  reviewMember,
  createPropertyAdmin,
  updatePropertyAdmin,
  deletePropertyAdmin,
} from "../controller/propertyController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public / Authenticated listing of all properties (for entity registration selection)
router.get("/", async (req, res) => {
  try {
    const { search, limit = 300 } = req.query;
    const where = {};
    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { pid: { contains: q, mode: "insensitive" } },
        { type: { contains: q, mode: "insensitive" } },
      ];
    }
    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(parseInt(limit, 10) || 300, 1), 500),
    });
    return res.status(200).json({ ok: true, data: properties });
  } catch (error) {
    console.error("GET /property error:", error);
    return res.status(500).json({ ok: false, message: "Failed to fetch properties" });
  }
});

// Capture submission (Enumerator)
router.post("/capture", authMiddleware, submitCapture);

// Listing and details for captures
router.get("/captures", authMiddleware, getCaptures);
router.get("/captures/:id", authMiddleware, getCaptureById);

// Supervisor / Admin Reviews
router.post("/review/:id", authMiddleware, reviewProperty);
router.post("/review-member/:id", authMiddleware, reviewMember);

// Direct Property CRUD (Admin & IT)
router.post("/", authMiddleware, createPropertyAdmin);
router.get("/:id", authMiddleware, getCaptureById);
router.put("/:id", authMiddleware, updatePropertyAdmin);
router.delete("/:id", authMiddleware, deletePropertyAdmin);

export { router as propertyRouter };
