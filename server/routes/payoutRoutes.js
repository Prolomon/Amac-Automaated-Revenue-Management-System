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

router.post("/", authMiddleware, roleMiddleware(["admin", "agent", "staff"]), createPayout);
router.get("/", authMiddleware, roleMiddleware(["admin", "staff"]), getAllPayouts);
router.get("/:id", authMiddleware, roleMiddleware(["admin", "member", "agent", "staff"]), getPayoutById);
router.get("/user/:userId", authMiddleware, roleMiddleware(["admin", "member", "agent", "staff"]), getPayoutByUser);
router.put("/:id", authMiddleware, roleMiddleware(["admin", "agent", "staff"]), updatePayout);
router.patch("/:id/status", authMiddleware, roleMiddleware(["admin", "staff"]), updatePayoutStatus);

export { router as payoutRouter };