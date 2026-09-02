import express from "express";
import {
  createPayout,
  getAllPayouts,
  getPayoutById,
  getPayoutByUser,
  updatePayout,
  updatePayoutStatus,
} from "../controller/payoutController.js";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/role.js";

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(["it", "admin", "agent", "staff", "company"]), createPayout);
router.get("/", authMiddleware, roleMiddleware(["it", "admin", "staff", "company"]), getAllPayouts);
router.get("/:id", authMiddleware, roleMiddleware(["it", "admin", "member", "agent", "staff", "company"]), getPayoutById);
router.get("/user/:userId", authMiddleware, roleMiddleware(["it", "admin", "member", "agent", "staff", "company"]), getPayoutByUser);
router.put("/:id", authMiddleware, roleMiddleware(["it", "admin", "agent", "staff", "company"]), updatePayout);
router.patch("/:id/status", authMiddleware, roleMiddleware(["it", "admin", "staff", "company"]), updatePayoutStatus);

export { router as payoutRouter };