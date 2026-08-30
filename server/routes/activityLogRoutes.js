import express from "express";
import { getActivityLogs } from "../controller/activityLogController.js";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/role.js";

const router = express.Router();

router.get("/", authMiddleware, roleMiddleware(["admin", "it", "staff"]), getActivityLogs);

export { router as activityLogRouter };
