import express from "express";
import {
  submitCapture,
  getCaptures,
  getCaptureById,
  reviewProperty,
  reviewMember,
} from "../controller/propertyController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Capture submission (Enumerator)
router.post("/capture", authMiddleware, submitCapture);

// Listing and details
router.get("/captures", authMiddleware, getCaptures);
router.get("/captures/:id", authMiddleware, getCaptureById);

// Supervisor / Admin Reviews
router.post("/review/:id", authMiddleware, reviewProperty);
router.post("/review-member/:id", authMiddleware, reviewMember);

export { router as propertyRouter };
