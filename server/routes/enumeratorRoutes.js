import express from "express";
import {
  createEnumerator,
  loginEnumerator,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  getDailyTaskProgress,
  getAllEnumerators,
  getEnumeratorById,
  getSupervisorTeam,
  getAnalytics,
} from "../controller/enumeratorController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Public / Auth routes
router.post("/login", loginEnumerator);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Authenticated Enumerator routes
router.get("/profile", authMiddleware, getProfile);
router.post("/change-password", authMiddleware, changePassword);
router.get("/daily-tasks", authMiddleware, getDailyTaskProgress);
router.get("/daily-tasks/:id", authMiddleware, getDailyTaskProgress);
router.get("/team", authMiddleware, getSupervisorTeam);

// Admin & Management routes
router.post("/", authMiddleware, createEnumerator);
router.get("/", authMiddleware, getAllEnumerators);
router.get("/analytics", authMiddleware, getAnalytics);
router.get("/:id", authMiddleware, getEnumeratorById);

export { router as enumeratorRouter };
