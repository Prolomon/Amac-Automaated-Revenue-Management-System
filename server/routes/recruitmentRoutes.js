import express from "express";
import {
  createRecruitment,
  deleteRecruitment,
  getRecruitmentById,
  getRecruitments,
} from "../controller/recruitmentController.js";
import { authMiddleware } from "../middleware/auth.js";
import { roleMiddleware } from "../middleware/role.js";

const router = express.Router();

router.post("/", createRecruitment);
router.get("/", authMiddleware, roleMiddleware(['admin', 'it', 'staff']), getRecruitments);
router.get("/:id", authMiddleware, roleMiddleware(['admin', 'it', 'staff', 'member', 'agent', 'company']), getRecruitmentById);
router.delete("/:id", authMiddleware, roleMiddleware(['admin', 'it', 'staff']), deleteRecruitment);

export { router as recruitmentRouter };
 