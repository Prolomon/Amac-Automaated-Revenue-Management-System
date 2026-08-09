import express from "express";
import {
  createStaff,
  getStaffs,
  getStaffsByCenter,
  getStaff,
  updateStaff,
  deleteStaff,
  resetPassword,
  changePassword,
  loginStaff,
} from "../controller/staffController.js";
import {authMiddleware} from '../middleware/auth.js';
import {roleMiddleware} from '../middleware/role.js';

const router = express.Router();

router.post("/", authMiddleware, roleMiddleware(['admin']), createStaff);
router.post("/:uid/reset-password", resetPassword);
router.post("/:uid/change-password", authMiddleware, roleMiddleware(['admin']), changePassword);
router.get("/", authMiddleware, roleMiddleware(['admin']), getStaffs);
router.get("/center/:center", authMiddleware, roleMiddleware(['admin']), getStaffsByCenter);
router.get("/:uid", authMiddleware, roleMiddleware(['admin']), getStaff);
router.put("/:uid", authMiddleware, roleMiddleware(['admin']), updateStaff);
router.delete("/:uid", authMiddleware, roleMiddleware(['admin']), deleteStaff);
router.post("/login", loginStaff);

export { router as staffRouter };